"""
Unit Test & Quality Gate Audit: ai_engine/window_forecaster.py
==============================================================
Memverifikasi fungsionalitas peramalan 72 jam, deteksi jendela waktu aman berurutan,
degradasi tingkat keyakinan (confidence decay), dan integrasi service.
"""

import pytest
import pandas as pd
from ai_engine.window_forecaster import SafeWindowForecaster, SafeWindowInterval, HourlyForecastPoint
from ai_engine.service import get_ai_service


@pytest.fixture(scope="module")
def sample_weather_72h():
    """Memuat 72 jam data cuaca BMKG Lamongan dari dataset replay."""
    df = pd.read_csv("simulations/data_replay/datasets/bmkg_lamongan.csv")
    return df.iloc[100:172].copy().reset_index(drop=True)


@pytest.fixture(scope="module")
def forecaster():
    return SafeWindowForecaster()


def test_forecast_72h_timeline_structure(forecaster, sample_weather_72h):
    """Memverifikasi panjang timeline tepat 72 jam dan semua skor AVRI valid."""
    timeline = forecaster.forecast_72h_timeline(sample_weather_72h, base_moisture=28.0, base_ph=7.8)
    assert len(timeline) == 72
    
    for pt in timeline:
        assert isinstance(pt, HourlyForecastPoint)
        assert 0.0 <= pt.avri_score <= 100.0
        assert pt.risk_category in ["aman", "waspada", "kritis", "bahaya"]
        assert pt.is_safe == (pt.avri_score <= 30.0)
        assert pt.hour_idx >= 0


def test_detect_safe_windows_contiguous_blocks(forecaster, sample_weather_72h):
    """Memverifikasi jendela aman yang terdeteksi memiliki durasi minimal 2 jam."""
    timeline = forecaster.forecast_72h_timeline(sample_weather_72h, base_moisture=30.0, base_ph=7.5)
    windows = forecaster.detect_safe_windows(timeline, min_consecutive_hours=2)
    
    assert len(windows) >= 1
    for w in windows:
        assert isinstance(w, SafeWindowInterval)
        assert w.duration_hours >= 2
        assert w.projected_mean_avri <= 30.0
        assert w.projected_min_avri <= 30.0
        assert 50 <= w.confidence_pct <= 95
        
        dto = w.to_dto_dict()
        assert "start_time" in dto
        assert "end_time" in dto
        assert "projected_avri" in dto
        assert "confidence_pct" in dto


def test_confidence_decay_over_horizon(forecaster, sample_weather_72h):
    """Memverifikasi bahwa jendela di 24 jam pertama memiliki confidence lebih tinggi dibanding hari ke-3."""
    timeline = forecaster.forecast_72h_timeline(sample_weather_72h, base_moisture=32.0, base_ph=7.4)
    windows = forecaster.detect_safe_windows(timeline, min_consecutive_hours=2)
    
    if len(windows) >= 2:
        first_w = windows[0]
        last_w = windows[-1]
        assert first_w.confidence_pct >= last_w.confidence_pct


def test_service_integration_forecast_windows_72h(sample_weather_72h):
    """Memverifikasi integrasi fungsi peramalan 72 jam pada AIEngineService."""
    service = get_ai_service()
    result = service.forecast_windows_72h(sample_weather_72h, base_moisture=26.0, base_ph=7.8)
    
    assert isinstance(result, dict)
    assert "optimal_window" in result
    assert "all_safe_windows" in result
    assert "total_safe_hours" in result
    assert "timeline" in result
    assert result["timeline_length"] == 72
    assert len(result["timeline"]) == 72
