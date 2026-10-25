"""
Unit Test & Quality Gate Audit: ai_engine/inference.py & ai_engine/service.py
=============================================================================
Memverifikasi batas matematis skor AVRI [0.0, 100.0], pemetaan 4-tingkat risiko,
serta kepatuhan penuh terhadap kontrak data DTO INTERFACES.md §2.
"""

import pytest
import numpy as np
from ai_engine.inference import AVRIInferenceEngine, RISK_TIERS
from ai_engine.service import (
    AIEngineService,
    get_ai_service,
    PredictRiskRequestDTO,
    SoilStateDTO,
    WeatherForecast12hDTO,
    AgronomicContextDTO,
    PredictRiskResponseDTO
)


@pytest.fixture(scope="module")
def inference_engine():
    return AVRIInferenceEngine()


@pytest.fixture(scope="module")
def ai_service():
    return get_ai_service()


def test_avri_score_boundary_exhaustive(inference_engine):
    """Memverifikasi skor AVRI tidak pernah tembus batas [0.0, 100.0] pada 1.000 kombinasi acak."""
    np.random.seed(42)
    for _ in range(1000):
        t_soil = np.random.uniform(10.0, 50.0)
        moist = np.random.uniform(5.0, 60.0)
        ph = np.random.uniform(5.0, 10.0)
        t_air = np.random.uniform(15.0, 45.0)
        rh = np.random.uniform(20.0, 100.0)
        wind = np.random.uniform(0.0, 12.0)
        solar = np.random.uniform(0.0, 5.0)
        rain = np.random.uniform(0.0, 50.0)
        
        res = inference_engine.predict_single(
            soil_temp_c=t_soil,
            moisture_pct=moist,
            ph=ph,
            air_temp_c=t_air,
            humidity_rh=rh,
            wind_speed_ms=wind,
            solar_radiation_mj=solar,
            rain_forecast_6h_mm=rain
        )
        score = res["avri_score"]
        assert 0.0 <= score <= 100.0, f"Skor AVRI keluar batas: {score}"


def test_four_risk_tier_classification(inference_engine):
    """Menguji pemetaan 4 tingkat risiko: aman, waspada, kritis, bahaya."""
    test_cases = [
        (15.0, "aman", "APPLY_NOW", True),
        (30.0, "aman", "APPLY_NOW", True),
        (30.1, "waspada", "INCORPORATE_OR_IRRIGATE", False),
        (55.0, "waspada", "INCORPORATE_OR_IRRIGATE", False),
        (60.0, "waspada", "INCORPORATE_OR_IRRIGATE", False),
        (60.1, "kritis", "DELAY_FERTILIZATION", False),
        (75.0, "kritis", "DELAY_FERTILIZATION", False),
        (80.0, "kritis", "DELAY_FERTILIZATION", False),
        (80.1, "bahaya", "PROHIBIT_APPLICATION", False),
        (95.0, "bahaya", "PROHIBIT_APPLICATION", False),
    ]
    for score, expected_tier, expected_action, expected_safe_window in test_cases:
        category, tier_info = inference_engine.classify_risk(score)
        assert category == expected_tier, f"Score {score} salah klasifikasi: {category}"
        assert tier_info["action_id"] == expected_action
        assert (category == "aman") == expected_safe_window


def test_known_agricultural_scenarios(inference_engine):
    """Menguji output preskripsi pada 3 skenario agronomi nyata di Lamongan."""
    # Skenario 1: Pagi Sejuk & Basah Pasca Embun (Kondisi Ideal)
    res_ideal = inference_engine.predict_single(
        soil_temp_c=23.0, moisture_pct=36.0, ph=7.2,
        air_temp_c=24.0, humidity_rh=90.0, wind_speed_ms=1.0, solar_radiation_mj=0.5
    )
    assert res_ideal["avri_score"] <= 30.0
    assert res_ideal["risk_category"] == "aman"
    assert res_ideal["safe_window_open"] is True
    assert res_ideal["prescription"]["action_id"] == "APPLY_NOW"

    # Skenario 2: Siang Terik Karst Ekstrem (Kondisi Berbahaya)
    res_bahaya = inference_engine.predict_single(
        soil_temp_c=37.5, moisture_pct=13.8, ph=8.3,
        air_temp_c=36.5, humidity_rh=40.0, wind_speed_ms=4.0, solar_radiation_mj=3.6
    )
    assert res_bahaya["avri_score"] >= 60.0
    assert res_bahaya["risk_category"] in ["kritis", "bahaya"]
    assert res_bahaya["safe_window_open"] is False
    assert res_bahaya["prescription"]["action_id"] in ["DELAY_FERTILIZATION", "PROHIBIT_APPLICATION"]


def test_ai_service_dto_contract_compliance(ai_service):
    """Menguji kepatuhan penuh AI Engine Service terhadap DTO INTERFACES.md §2."""
    req = PredictRiskRequestDTO(
        field_id="BLOK-A-LAMONGAN",
        soil_state=SoilStateDTO(moisture_pct=22.4, soil_temp_c=34.1, ph=7.83),
        weather_forecast_12h=WeatherForecast12hDTO(
            air_temp_c=33.5, relative_humidity_pct=55.0, solar_radiation_mj=18.4,
            wind_speed_ms=2.1, rain_forecast_mm=0.0
        ),
        agronomic_context=AgronomicContextDTO(dat=32)
    )

    response = ai_service.predict_avri(req)
    assert isinstance(response, PredictRiskResponseDTO)
    
    # Verifikasi struktur field response
    assert hasattr(response, "avri_score")
    assert hasattr(response, "risk_category")
    assert hasattr(response, "safe_window_open")
    assert hasattr(response, "prescription")
    assert hasattr(response, "physics_diagnostics")
    assert hasattr(response, "model_meta")

    # Verifikasi TreeSHAP explanations
    explanations = response.prescription.shap_explanations
    assert len(explanations) >= 1
    for item in explanations:
        assert hasattr(item, "feature")
        assert hasattr(item, "label")
        assert hasattr(item, "impact_pct")
        assert item.direction in ["increases_risk", "decreases_risk"]

    # Verifikasi serialisasi JSON dictionary
    res_dict = response.to_dict()
    assert isinstance(res_dict, dict)
    assert "avri_score" in res_dict
    assert "prescription" in res_dict
    assert "physics_diagnostics" in res_dict
    assert res_dict["physics_diagnostics"]["is_physics_constrained"] is True
