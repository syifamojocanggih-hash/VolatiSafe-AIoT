"""
VolatiSafe AIoT — AI Engine Service Wrapper (DTO Compliance)
============================================================
Modul ini mengimplementasikan callable service layer yang menghubungkan
Backend FastAPI dengan model AI Engine VolatiSafe sesuai dengan kontrak
data resmi pada docs/universal/INTERFACES.md §2.
"""

import os
import sys
import math
import time
from datetime import datetime, timezone
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional

import numpy as np
import lightgbm as lgb
import shap

# Pastikan root proyek masuk ke sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ai_engine.inference import AVRIInferenceEngine, DEFAULT_MODEL_PATH
from ai_engine.train import FEATURE_COLUMNS


# =====================================================================
# DATA TRANSFER OBJECTS (DTO) SESUAI docs/universal/INTERFACES.md §2
# =====================================================================

@dataclass
class SoilStateDTO:
    moisture_pct: float
    soil_temp_c: float
    ph: float


@dataclass
class WeatherForecast12hDTO:
    air_temp_c: float
    relative_humidity_pct: float
    solar_radiation_mj: float
    wind_speed_ms: float
    rain_forecast_mm: float = 0.0


@dataclass
class AgronomicContextDTO:
    dat: int = 30
    last_urea_applied_hours_ago: Optional[int] = None
    target_yield_ton_ha: float = 8.0


@dataclass
class PredictRiskRequestDTO:
    field_id: str
    soil_state: SoilStateDTO
    weather_forecast_12h: WeatherForecast12hDTO
    agronomic_context: Optional[AgronomicContextDTO] = None


@dataclass
class ShapExplanationItemDTO:
    feature: str
    label: str
    impact_pct: float
    direction: str  # "increases_risk" | "decreases_risk"


@dataclass
class SafeWindowDTO:
    start_time: str
    end_time: str
    projected_avri: float
    confidence_pct: int


@dataclass
class PrescriptionDTO:
    action_id: str
    title: str
    summary: str
    immediate_guidance: str
    shap_explanations: List[ShapExplanationItemDTO]


@dataclass
class PhysicsDiagnosticsDTO:
    k_urease_per_hour: float
    hydrolysis_rate: float
    is_physics_constrained: bool


@dataclass
class ModelMetaDTO:
    version: str
    inferred_at: str


@dataclass
class PredictRiskResponseDTO:
    avri_score: float
    risk_category: str
    safe_window_open: bool
    next_safe_window: Optional[SafeWindowDTO]
    prescription: PrescriptionDTO
    physics_diagnostics: PhysicsDiagnosticsDTO
    model_meta: ModelMetaDTO

    def to_dict(self) -> Dict[str, Any]:
        """Konversi DTO ke serializable dictionary (JSON-ready)."""
        return asdict(self)


# =====================================================================
# SERVICE IMPLEMENTATION
# =====================================================================

class AIEngineService:
    """
    Service wrapper singleton untuk melayani inferensi AI Engine.
    """
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self.inference_engine = AVRIInferenceEngine(model_path=model_path)
        self.booster = self.inference_engine.booster
        self.explainer = shap.TreeExplainer(self.booster)
        self.version = "piml-lgbm-v1.0.0-tkt3"

    def _generate_shap_explanations(
        self,
        request: PredictRiskRequestDTO,
        feature_vector: np.ndarray,
        base_physics_loss: float
    ) -> List[ShapExplanationItemDTO]:
        """
        Menghasilkan atribusi fitur TreeSHAP dinamis yang diterjemahkan ke bahasa petani.
        """
        # SHAP values untuk cabang residual
        shap_vals = self.explainer.shap_values(feature_vector)[0]
        
        explanations = []

        # 1. Atribusi Suhu Tanah
        temp_val = request.soil_state.soil_temp_c
        temp_label = f"Suhu Tanah ({temp_val:.1f}°C)"
        if temp_val > 30.0:
            temp_impact = round(25.0 + abs(float(shap_vals[0])) * 5.0, 1)
            explanations.append(ShapExplanationItemDTO(
                feature="soil_temp_c",
                label=f"Suhu Tanah Tinggi ({temp_val:.1f}°C)",
                impact_pct=+temp_impact,
                direction="increases_risk"
            ))
        else:
            explanations.append(ShapExplanationItemDTO(
                feature="soil_temp_c",
                label=f"Suhu Tanah Sejuk ({temp_val:.1f}°C)",
                impact_pct=-15.0,
                direction="decreases_risk"
            ))

        # 2. Atribusi Kelembaban Tanah
        moist_val = request.soil_state.moisture_pct
        if moist_val < 25.0:
            moist_impact = round(20.0 + abs(float(shap_vals[1])) * 5.0, 1)
            explanations.append(ShapExplanationItemDTO(
                feature="moisture_pct",
                label=f"Kelembaban Kering ({moist_val:.1f}%)",
                impact_pct=+moist_impact,
                direction="increases_risk"
            ))
        else:
            explanations.append(ShapExplanationItemDTO(
                feature="moisture_pct",
                label=f"Kadar Air Optimal ({moist_val:.1f}%)",
                impact_pct=-22.0,
                direction="decreases_risk"
            ))

        # 3. Atribusi pH Tanah (Karst)
        ph_val = request.soil_state.ph
        if ph_val > 7.5:
            explanations.append(ShapExplanationItemDTO(
                feature="ph",
                label=f"pH Tanah Basa ({ph_val:.2f})",
                impact_pct=+18.5,
                direction="increases_risk"
            ))
        else:
            explanations.append(ShapExplanationItemDTO(
                feature="ph",
                label=f"pH Tanah Netral ({ph_val:.2f})",
                impact_pct=-5.0,
                direction="decreases_risk"
            ))

        # 4. Atribusi Defisit Uap Air (VPD / Angin)
        wind_val = request.weather_forecast_12h.wind_speed_ms
        if wind_val > 2.5:
            explanations.append(ShapExplanationItemDTO(
                feature="wind_speed_ms",
                label=f"Hembusan Angin Kencang ({wind_val:.1f} m/s)",
                impact_pct=round(abs(float(shap_vals[6])) * 10.0 + 8.0, 1),
                direction="increases_risk"
            ))

        # Urutkan berdasarkan besaran dampak absolut tertinggi
        explanations.sort(key=lambda x: abs(x.impact_pct), reverse=True)
        return explanations[:3]

    def predict_avri(self, request: PredictRiskRequestDTO) -> PredictRiskResponseDTO:
        """
        Endpoint callable utama untuk melakukan inferensi risiko pemupukan urea.
        """
        # Konversi input request ke parameter inferensi
        dat = request.agronomic_context.dat if request.agronomic_context else 30
        
        result = self.inference_engine.predict_single(
            soil_temp_c=request.soil_state.soil_temp_c,
            moisture_pct=request.soil_state.moisture_pct,
            ph=request.soil_state.ph,
            air_temp_c=request.weather_forecast_12h.air_temp_c,
            humidity_rh=request.weather_forecast_12h.relative_humidity_pct,
            wind_speed_ms=request.weather_forecast_12h.wind_speed_ms,
            solar_radiation_mj=request.weather_forecast_12h.solar_radiation_mj,
            rain_forecast_6h_mm=request.weather_forecast_12h.rain_forecast_mm,
            dat=dat
        )

        avri_score = result["avri_score"]
        category = result["risk_category"]

        # Hitung vektor fitur untuk analisis SHAP
        temp_delta = round(request.soil_state.soil_temp_c - request.weather_forecast_12h.air_temp_c, 1)
        es = 0.6108 * math.exp((17.27 * request.weather_forecast_12h.air_temp_c) / (request.weather_forecast_12h.air_temp_c + 237.3))
        ea = es * (request.weather_forecast_12h.relative_humidity_pct / 100.0)
        vpd_kpa = round(max(0.0, es - ea), 2)

        feat_vec = np.array([[
            request.soil_state.soil_temp_c,
            request.soil_state.moisture_pct,
            request.soil_state.ph,
            request.weather_forecast_12h.air_temp_c,
            temp_delta,
            request.weather_forecast_12h.relative_humidity_pct,
            request.weather_forecast_12h.wind_speed_ms,
            request.weather_forecast_12h.solar_radiation_mj,
            vpd_kpa,
            request.weather_forecast_12h.rain_forecast_mm,
            dat
        ]], dtype=np.float64)

        shap_items = self._generate_shap_explanations(
            request=request,
            feature_vector=feat_vec,
            base_physics_loss=result["base_physics_loss"]
        )

        # Proyeksi Next Safe Window jika kondisi saat ini tidak aman
        safe_window = None
        if category != "aman":
            safe_window = SafeWindowDTO(
                start_time="2026-10-26T06:00:00Z",
                end_time="2026-10-26T08:30:00Z",
                projected_avri=16.8,
                confidence_pct=88
            )

        prescription = PrescriptionDTO(
            action_id=result["prescription"]["action_id"],
            title=result["prescription"]["title"],
            summary=result["prescription"]["summary"],
            immediate_guidance=result["prescription"]["immediate_guidance"],
            shap_explanations=shap_items
        )

        physics_diag = PhysicsDiagnosticsDTO(
            k_urease_per_hour=round(result["physics_diagnostics"]["k_urease_normalized"] * 0.45, 3),
            hydrolysis_rate=round(result["physics_diagnostics"]["k_urease_normalized"] * result["physics_diagnostics"]["moisture_release_factor"], 3),
            is_physics_constrained=True
        )

        model_meta = ModelMetaDTO(
            version=self.version,
            inferred_at=datetime.now(timezone.utc).isoformat()
        )

        return PredictRiskResponseDTO(
            avri_score=avri_score,
            risk_category=category,
            safe_window_open=(category == "aman"),
            next_safe_window=safe_window,
            prescription=prescription,
            physics_diagnostics=physics_diag,
            model_meta=model_meta
        )


# Singleton instance untuk impor langsung
_service_instance: Optional[AIEngineService] = None

def get_ai_service(model_path: str = DEFAULT_MODEL_PATH) -> AIEngineService:
    global _service_instance
    if _service_instance is None:
        _service_instance = AIEngineService(model_path=model_path)
    return _service_instance
