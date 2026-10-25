"""
Unit Test & Quality Gate Audit: ai_engine/dataset_builder.py
============================================================
Menguji integritas dataset builder: pencegahan kebocoran data deret waktu
(zero time-series leakage), kelengkapan fitur, ketiadaan NaN, dan batas target.
"""

import os
import pytest
import numpy as np
import pandas as pd
from ai_engine.dataset_builder import (
    calculate_vpd,
    build_soil_and_feature_matrix,
    time_series_holdout_split
)

WEATHER_TEST_PATH = "simulations/data_replay/datasets/bmkg_lamongan.csv"


def test_vpd_calculation():
    """Memverifikasi perhitungan defisit tekanan uap air (VPD)."""
    # Pada RH 100%, VPD harus nol
    assert calculate_vpd(30.0, 100.0) == 0.0
    # Pada suhu tinggi dan RH rendah, VPD harus positif tinggi
    vpd_dry = calculate_vpd(35.0, 40.0)
    assert 3.0 <= vpd_dry <= 4.0, f"VPD kering tidak wajar: {vpd_dry} kPa"


def test_build_dataset_structure():
    """Memverifikasi struktur kolom dan tipe data dataset."""
    assert os.path.exists(WEATHER_TEST_PATH), "Dataset cuaca sumber Lamongan belum ada!"
    df = build_soil_and_feature_matrix(WEATHER_TEST_PATH)
    
    expected_columns = [
        'timestamp', 'soil_temp_c', 'moisture_pct', 'ph', 'air_temp_c',
        'temp_delta', 'humidity_rh', 'wind_speed_ms', 'solar_radiation_mj',
        'vpd_kpa', 'rain_forecast_6h_mm', 'dat', 'base_physics_loss',
        'target_volatilization_loss'
    ]
    
    for col in expected_columns:
        assert col in df.columns, f"Kolom wajib '{col}' tidak ditemukan di dataset!"
        
    assert len(df) == 8760, f"Jumlah baris harus 8.760 (1 tahun per jam), ditemukan: {len(df)}"


def test_no_nan_or_infinities():
    """Memastikan tidak ada nilai kosong (NaN) atau tak hingga (Inf)."""
    df = build_soil_and_feature_matrix(WEATHER_TEST_PATH)
    assert not df.isnull().values.any(), "Ditemukan nilai NaN di dalam dataset!"
    assert not np.isinf(df.select_dtypes(include=[np.number]).values).any(), "Ditemukan nilai Inf di dalam dataset!"


def test_zero_time_series_leakage():
    """Audit Kritis: Memverifikasi 0% kebocoran data deret waktu antara train dan test set."""
    df = build_soil_and_feature_matrix(WEATHER_TEST_PATH)
    train_df, test_df = time_series_holdout_split(df, train_ratio=0.80)
    
    # 1. Tidak boleh ada overlap indeks
    assert len(train_df) + len(test_df) == len(df)
    
    # 2. Timestamp terakhir train set strictly lebih kecil dari timestamp pertama test set
    max_train_ts = train_df['timestamp'].max()
    min_test_ts = test_df['timestamp'].min()
    assert max_train_ts < min_test_ts, f"LEAKAGE DETECTED: {max_train_ts} >= {min_test_ts}"


def test_target_loss_bounds_and_distribution():
    """Memverifikasi bahwa target laju volatilisasi berada dalam rentang [0.0, 100.0]."""
    df = build_soil_and_feature_matrix(WEATHER_TEST_PATH)
    targets = df['target_volatilization_loss'].values
    
    assert np.all(targets >= 0.0), "Ditemukan target volatilisasi bernilai negatif!"
    assert np.all(targets <= 100.0), "Ditemukan target volatilisasi melebihi 100%!"
    
    # Rata-rata kehilangan amonia tahunan tanah kapur Lamongan berada di rentang wajar (15% - 40%)
    mean_target = np.mean(targets)
    assert 15.0 <= mean_target <= 45.0, f"Rata-rata target tidak wajar: {mean_target}%"
