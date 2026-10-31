import sys
import math
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

from app.schemas.simulation import (
    WhatIfRequestDTO,
    PredictRiskResponseDTO,
    SafeWindowDTO,
    PrescriptionDTO,
    PhysicsDiagnosticsDTO,
    ModelMetaDTO
)
from app.schemas.fields import ShapExplanationDTO
from app.core.config import settings

logger = logging.getLogger("volatisafe.ai_service")

# Setup search path so ai_engine and models can be discovered
POSSIBLE_ROOTS = [
    Path(__file__).resolve().parent.parent.parent.parent,  # Workspace root
    Path("/app"),                                           # Docker container root
    Path(__file__).resolve().parent.parent.parent           # Backend root
]
for p in POSSIBLE_ROOTS:
    if p.exists() and str(p) not in sys.path:
        sys.path.insert(0, str(p))

class AIService:
    """
    Physics-Informed Machine Learning (PIML) & TreeSHAP inference service
    berdasarkan MODEL_SPEC.md dan MOCK_PREDICTOR.md.
    Terhubung langsung ke model LightGBM (models/avri_model.txt) via ai_engine.service.
    """
    
    # Konstanta Fisika Biokimia Urease
    A_FREQ = 3.2e8         # per hour (Arrhenius pre-exponential factor)
    E_ACTIVATION = 51000.0 # J/mol (Urease activation energy)
    R_GAS = 8.314          # J/(mol*K)
    KM_MOISTURE = 18.0     # % VWC (Michaelis-Menten half-saturation)
    
    @classmethod
    def calculate_physics(cls, soil_temp_c: float, moisture_pct: float, ph: float) -> Dict[str, float]:
        """
        Hitung komponen kinetika Arrhenius, Michaelis-Menten, dan Sigmoid pH
        """
        # 1. Arrhenius Urease
        t_kelvin = max(250.0, soil_temp_c + 273.15)
        k_urease = cls.A_FREQ * math.exp(-cls.E_ACTIVATION / (cls.R_GAS * t_kelvin))
        
        # 2. Moisture limitation (Urea dissolves & diffuses when moist)
        theta = max(0.0, min(100.0, moisture_pct))
        f_moisture = theta / (theta + cls.KM_MOISTURE) if (theta + cls.KM_MOISTURE) > 0 else 0.0
        dry_factor = max(0.0, 1.0 - f_moisture)
        
        # 3. Sigmoid Alkaline pH acceleration
        delta_ph = ph - 7.0
        exponent = max(-10.0, min(10.0, delta_ph))
        ratio = 10 ** exponent
        f_ph = ratio / (1.0 + ratio)
        
        # Hydrolysis rate index
        hydrolysis = k_urease * dry_factor * f_ph
        
        return {
            "k_urease": round(k_urease, 3),
            "dry_factor": round(dry_factor, 3),
            "f_ph": round(f_ph, 3),
            "hydrolysis_rate": round(hydrolysis, 3)
        }

    @classmethod
    def predict_avri(cls, req: WhatIfRequestDTO) -> PredictRiskResponseDTO:
        # MOCK_AI_PREDICTOR dibaca dari Settings, bukan os.getenv, karena .env
        # dimuat pydantic-settings dan tidak selalu masuk ke environment proses.
        use_real_engine = not settings.MOCK_AI_PREDICTOR

        if use_real_engine:
            try:
                from ai_engine.service import (
                    get_ai_service,
                    PredictRiskRequestDTO,
                    SoilStateDTO,
                    WeatherForecast12hDTO,
                    AgronomicContextDTO,
                )

                t_soil = float(req.soil_temp_c)
                moist = float(req.moisture_pct)
                ph_val = float(req.ph)
                rain_val = float(req.rain_mm)

                # Estimasi mikroklimat atmosferik realistis sesuai termodinamika lahan karst Solokuro
                if rain_val > 0.0:
                    air_temp = max(18.0, round(t_soil - 1.0, 1))
                    rh_pct = min(98.0, round(85.0 + min(13.0, rain_val * 0.6), 1))
                    solar_mj = 0.2
                    wind_ms = 1.2
                elif t_soil >= 32.0:
                    air_temp = max(28.0, round(t_soil - 1.0, 1))
                    # Pada siang terik, kelembaban udara turun drastis dan radiasi surya mencapai puncak
                    rh_pct = max(25.0, round(55.0 - (t_soil - 28.0) * 4.5, 1))
                    solar_mj = min(3.8, round(2.2 + (t_soil - 28.0) * 0.22, 2))
                    wind_ms = min(4.5, round(2.2 + (t_soil - 28.0) * 0.22, 1))
                elif t_soil <= 25.0:
                    air_temp = max(18.0, round(t_soil + 0.5, 1))
                    rh_pct = min(92.0, round(75.0 + (25.0 - t_soil) * 2.5, 1))
                    solar_mj = max(0.4, round(1.2 - (25.0 - t_soil) * 0.15, 2))
                    wind_ms = 1.0
                else:
                    air_temp = round(t_soil - 0.5, 1)
                    rh_pct = round(60.0 - (t_soil - 25.0) * 2.0, 1)
                    solar_mj = round(1.5 + (t_soil - 25.0) * 0.1, 2)
                    wind_ms = 1.8

                ai_req = PredictRiskRequestDTO(
                    field_id="BLOK-A",
                    soil_state=SoilStateDTO(
                        moisture_pct=moist,
                        soil_temp_c=t_soil,
                        ph=ph_val
                    ),
                    weather_forecast_12h=WeatherForecast12hDTO(
                        air_temp_c=air_temp,
                        relative_humidity_pct=rh_pct,
                        solar_radiation_mj=solar_mj,
                        wind_speed_ms=wind_ms,
                        rain_forecast_mm=rain_val
                    ),
                    agronomic_context=AgronomicContextDTO(dat=30)
                )

                engine_service = get_ai_service()
                piml_res = engine_service.predict_avri(ai_req)

                shap_explanations: List[ShapExplanationDTO] = []
                for item in piml_res.prescription.shap_explanations:
                    exp_text = (
                        f"Fitur {item.label} "
                        f"{'meningkatkan' if item.direction == 'increases_risk' else 'menurunkan'} "
                        f"risiko penguapan amonia sebesar {abs(item.impact_pct):.1f}%."
                    )
                    shap_explanations.append(
                        ShapExplanationDTO(
                            feature=item.feature,
                            label=item.label,
                            impact_pct=item.impact_pct,
                            direction=item.direction,
                            explanation=exp_text
                        )
                    )

                next_window_dto = SafeWindowDTO(
                    start_time=piml_res.next_safe_window.start_time if piml_res.next_safe_window else "2026-10-25T06:00:00Z",
                    end_time=piml_res.next_safe_window.end_time if piml_res.next_safe_window else "2026-10-25T09:00:00Z",
                    projected_avri=piml_res.next_safe_window.projected_avri if piml_res.next_safe_window else 18.5,
                    confidence_pct=piml_res.next_safe_window.confidence_pct if piml_res.next_safe_window else 88
                )

                return PredictRiskResponseDTO(
                    avri_score=piml_res.avri_score,
                    risk_category=piml_res.risk_category,
                    safe_window_open=piml_res.safe_window_open,
                    next_safe_window=next_window_dto,
                    prescription=PrescriptionDTO(
                        action_id=piml_res.prescription.action_id,
                        title=piml_res.prescription.title,
                        summary=piml_res.prescription.summary,
                        immediate_guidance=piml_res.prescription.immediate_guidance,
                        shap_explanations=shap_explanations
                    ),
                    physics_diagnostics=PhysicsDiagnosticsDTO(
                        k_urease_per_hour=piml_res.physics_diagnostics.k_urease_per_hour,
                        hydrolysis_rate=piml_res.physics_diagnostics.hydrolysis_rate,
                        is_physics_constrained=piml_res.physics_diagnostics.is_physics_constrained,
                        base_physics_score=getattr(piml_res.physics_diagnostics, "base_physics_score", round(piml_res.avri_score * 0.85, 1)),
                        residual_ai_score=getattr(piml_res.physics_diagnostics, "residual_ai_score", round(piml_res.avri_score * 0.15, 1)),
                        confidence_margin_pct=getattr(piml_res.physics_diagnostics, "confidence_margin_pct", 1.2)
                    ),
                    model_meta=ModelMetaDTO(
                        version=piml_res.model_meta.version,
                        inferred_at=piml_res.model_meta.inferred_at
                    )
                )
            except Exception as e:
                logger.warning(f"Could not infer using LightGBM ai_engine ({e}). Falling back to analytical formula.")

        # ================= FALLBACK ANALYTICAL FORMULA =================
        physics = cls.calculate_physics(req.soil_temp_c, req.moisture_pct, req.ph)
        temp_delta = max(0.0, (req.soil_temp_c - 20.0) * 2.5)
        moisture_penalty = max(0.0, (40.0 - req.moisture_pct) * 1.8)
        ph_penalty = max(0.0, (req.ph - 6.5) * 12.0)
        rain_discount = min(45.0, req.rain_mm * 4.0)
        
        raw_score = 10.0 + temp_delta + moisture_penalty + ph_penalty - rain_discount
        avri_score = round(max(3.0, min(95.0, raw_score)), 1)
        
        if avri_score <= 30.0:
            category = "aman"
            is_safe = True
            action = "APPLY_NOW"
            title = "WAKTU TEPAT MENABUR UREA"
            guidance = "Kondisi tanah optimal. Lakukan penaburan sekarang untuk efisiensi penyerapan nitrogen maksimal."
        elif avri_score <= 60.0:
            category = "waspada"
            is_safe = False
            action = "IRRIGATE_FIRST"
            title = "WASPADA PENABURAN"
            guidance = "Siram tanah terlebih dahulu sebelum menabur, atau tunggu sore hari saat suhu tanah turun."
        elif avri_score <= 80.0:
            category = "kritis"
            is_safe = False
            action = "DELAY_FERTILIZATION"
            title = "TUNDA PENABURAN UREA"
            guidance = "Potensi penguapan amonia tinggi (60–80%). Tunda aplikasi hingga tanah lembap atau jendela aman terbuka."
        else:
            category = "bahaya"
            is_safe = False
            action = "STOP_APPLICATION"
            title = "DILARANG MENABUR UREA"
            guidance = "Tanah sangat kering & panas. Kerugian pupuk hampir total (> 80%). Tunda penaburan 24–48 jam."
            
        shap_explanations: List[ShapExplanationDTO] = [
            ShapExplanationDTO(
                feature="soil_temp_c",
                label=f"Suhu Tanah ({req.soil_temp_c:.1f}°C)",
                impact_pct=round(temp_delta, 1),
                direction="increases_risk" if temp_delta > 12.0 else "neutral",
                explanation=f"Suhu tanah {req.soil_temp_c:.1f}°C {'memicu penguraian cepat enzim urease' if req.soil_temp_c > 30 else 'dalam rentang kinetika moderat'}"
            ),
            ShapExplanationDTO(
                feature="moisture_pct",
                label=f"Kelembaban ({req.moisture_pct:.1f}%)",
                impact_pct=round(moisture_penalty, 1),
                direction="increases_risk" if moisture_penalty > 12.0 else ("decreases_risk" if req.moisture_pct > 35 else "neutral"),
                explanation=f"Kelembaban tanah {req.moisture_pct:.1f}% {'terlalu kering untuk melarutkan urea ke perakaran' if req.moisture_pct < 25 else 'cukup untuk hidrolisis difusi'}"
            ),
            ShapExplanationDTO(
                feature="ph",
                label=f"pH Tanah ({req.ph:.2f})",
                impact_pct=round(ph_penalty, 1),
                direction="increases_risk" if ph_penalty > 8.0 else "neutral",
                explanation=f"pH {req.ph:.2f} {'alkalin menggeser ion amonium ke gas amonia bebas' if req.ph > 7.5 else 'netral mengikat nitrogen stabil'}"
            )
        ]
        
        if req.rain_mm > 0.0:
            shap_explanations.append(
                ShapExplanationDTO(
                    feature="rain_mm",
                    label=f"Curah Hujan ({req.rain_mm:.1f} mm)",
                    impact_pct=-round(rain_discount, 1),
                    direction="decreases_risk",
                    explanation=f"Presipitasi {req.rain_mm:.1f} mm melarutkan pupuk langsung ke pori perakaran."
                )
            )

        now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        return PredictRiskResponseDTO(
            avri_score=avri_score,
            risk_category=category,
            safe_window_open=is_safe,
            next_safe_window=SafeWindowDTO(
                start_time="2026-10-25T06:00:00Z",
                end_time="2026-10-25T09:00:00Z",
                projected_avri=18.5,
                confidence_pct=88
            ),
            prescription=PrescriptionDTO(
                action_id=action,
                title=title,
                summary=f"Skor AVRI {avri_score}%. Risiko penguapan amonia berada pada tingkat {category.upper()}.",
                immediate_guidance=guidance,
                shap_explanations=shap_explanations
            ),
            physics_diagnostics=PhysicsDiagnosticsDTO(
                k_urease_per_hour=physics["k_urease"],
                hydrolysis_rate=physics["hydrolysis_rate"],
                is_physics_constrained=True,
                base_physics_score=round(physics["hydrolysis_rate"] * 100 * 0.35, 1),
                residual_ai_score=round(max(0.0, avri_score - (physics["hydrolysis_rate"] * 100 * 0.35)), 1),
                confidence_margin_pct=1.2 if category == "aman" else (1.8 if category == "waspada" else 2.4)
            ),
            model_meta=ModelMetaDTO(
                version="piml-lgbm-v1.2-fallback",
                inferred_at=now_utc
            )
        )
