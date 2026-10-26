import math
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.schemas.simulation import (
    WhatIfRequestDTO,
    PredictRiskResponseDTO,
    SafeWindowDTO,
    PrescriptionDTO,
    PhysicsDiagnosticsDTO,
    ModelMetaDTO
)
from app.schemas.fields import ShapExplanationDTO

class AIService:
    """
    Physics-Informed Machine Learning (PIML) & TreeSHAP inference service
    berdasarkan MODEL_SPEC.md dan MOCK_PREDICTOR.md.
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
        # NH4+ <-> NH3 free gas shift
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
        # 1. Hitung kinetika fisika
        physics = cls.calculate_physics(req.soil_temp_c, req.moisture_pct, req.ph)
        
        # 2. Sensitivitas parameter terhadap risiko
        # Baseline normal: Suhu 26°C, Kelembaban 40%, pH 7.0
        temp_delta = max(0.0, (req.soil_temp_c - 20.0) * 2.5)
        moisture_penalty = max(0.0, (40.0 - req.moisture_pct) * 1.8)
        ph_penalty = max(0.0, (req.ph - 6.5) * 12.0)
        rain_discount = min(45.0, req.rain_mm * 4.0)
        
        # Raw AVRI score calculation
        raw_score = 10.0 + temp_delta + moisture_penalty + ph_penalty - rain_discount
        avri_score = round(max(3.0, min(95.0, raw_score)), 1)
        
        # 3. Klasifikasi risiko & preskripsi aksi (MODEL_SPEC.md §4)
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
            
        # 4. TreeSHAP Attribution Waterfall (EXPLAINABILITY_SHAP.md)
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
                is_physics_constrained=True
            ),
            model_meta=ModelMetaDTO(
                version="piml-lgbm-v1.2",
                inferred_at=now_utc
            )
        )
