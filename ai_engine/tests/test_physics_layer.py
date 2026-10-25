"""
Unit Test & Quality Gate Audit: ai_engine/physics_layer.py
==========================================================
Menguji kepatuhan lapisan fisika terhadap hukum termodinamika Arrhenius,
arah monoton fungsi, batasan numerik [0.0, 100.0], dan konsistensi vektorisasi.
"""

import pytest
import numpy as np
from ai_engine.physics_layer import (
    EA_UREASE,
    R_GAS,
    KM_MOISTURE,
    urease_temperature_kinetics,
    moisture_suppression_factor,
    ph_alkalinity_factor,
    calculate_base_physics_loss,
    vectorized_base_physics_loss
)


def test_scientific_constants():
    """Memverifikasi konstanta fisika sesuai literatur Kissel & Cabrera (2005)."""
    assert EA_UREASE == 51000.0, "Energi aktivasi urease wajib 51.000 J/mol"
    assert round(R_GAS, 3) == 8.314, "Konstanta gas universal wajib 8.314 J/(mol·K)"
    assert KM_MOISTURE == 18.0, "Konstanta saturasi kelembaban Km wajib 18.0% VWC"


def test_temperature_kinetics_monotonic_increasing():
    """Memverifikasi kenaikan suhu tanah selalu menaikkan laju kinetika Arrhenius."""
    temps = np.linspace(15.0, 45.0, 31)
    k_vals = [urease_temperature_kinetics(t) for t in temps]
    
    # Periksa kenaikan monoton tegas: k(T+1) > k(T)
    for i in range(len(k_vals) - 1):
        assert k_vals[i + 1] > k_vals[i], f"Kinetika suhu tidak monoton naik di T={temps[i]}"
        
    # Kinetika pada 45C harus ternormalisasi mendekati 1.0
    assert abs(k_vals[-1] - 1.0) < 0.01, "k(45C) wajib mendekati 1.0"


def test_moisture_suppression_monotonic_decreasing():
    """Memverifikasi kenaikan kelembaban tanah selalu meredam pelepasan amonia."""
    moistures = np.linspace(5.0, 50.0, 46)
    m_factors = [moisture_suppression_factor(m) for m in moistures]
    
    # Faktor pelepasan harus monoton turun seiring tanah makin basah
    for i in range(len(m_factors) - 1):
        assert m_factors[i + 1] < m_factors[i], f"Faktor pelepasan tidak monoton turun di m={moistures[i]}"
        
    # Tanah sangat basah (>40%) harus memiliki faktor pelepasan < 0.35
    assert moisture_suppression_factor(40.0) < 0.35


def test_ph_alkalinity_monotonic_increasing():
    """Memverifikasi kenaikan pH (makin basa/kapur) selalu menaikkan fraksi amonia bebas."""
    phs = np.linspace(5.0, 9.0, 41)
    ph_factors = [ph_alkalinity_factor(p) for p in phs]
    
    for i in range(len(ph_factors) - 1):
        assert ph_factors[i + 1] > ph_factors[i], f"Faktor pH tidak monoton naik di pH={phs[i]}"
        
    # Pada pH netral (7.0), faktor harus persis 0.50
    assert abs(ph_alkalinity_factor(7.0) - 0.50) < 1e-4
    # Pada pH karst Lamongan (7.8), faktor harus > 0.85
    assert ph_alkalinity_factor(7.8) > 0.85


def test_base_physics_loss_bounds_exhaustive():
    """Uji stres Monte Carlo 5.000 titik acak: output selalu di [0.0, 100.0]."""
    np.random.seed(42)
    sample_temps = np.random.uniform(-10.0, 55.0, 5000)
    sample_moist = np.random.uniform(0.0, 100.0, 5000)
    sample_phs = np.random.uniform(3.5, 10.5, 5000)
    
    losses = vectorized_base_physics_loss(sample_temps, sample_moist, sample_phs)
    
    assert np.all(losses >= 0.0), "Ditemukan nilai BasePhysicsLoss negatif (melanggar termodinamika)!"
    assert np.all(losses <= 100.0), "Ditemukan nilai BasePhysicsLoss melebihi 100%!"


def test_known_environmental_conditions():
    """Menguji kewajaran respons model pada 4 skenario lingkungan agronomis riil."""
    # 1. Sejuk & Basah (Pagi basah sejuk): Kehilangan harus sangat rendah (< 5%)
    loss_cool_wet = calculate_base_physics_loss(soil_temp_c=22.0, moisture_pct=35.0, ph=6.5)
    assert loss_cool_wet < 6.0, f"Kondisi sejuk basah terlalu tinggi: {loss_cool_wet}%"
    
    # 2. Pagi Hari Normal (26C, 30% lembap, pH netral 7.2): Kehilangan wajar 10-18%
    loss_morning = calculate_base_physics_loss(soil_temp_c=26.0, moisture_pct=30.0, ph=7.2)
    assert 10.0 <= loss_morning <= 18.0, f"Kondisi pagi normal di luar ekspektasi: {loss_morning}%"
    
    # 3. Terik Ekstrem Tanah Karst (36C, 15% kering, pH 8.2 alkalin): Kehilangan masif (> 50%)
    loss_hot_karst = calculate_base_physics_loss(soil_temp_c=36.0, moisture_pct=15.0, ph=8.2)
    assert loss_hot_karst >= 50.0, f"Kondisi terik karst harus kritis: {loss_hot_karst}%"


def test_vectorized_vs_scalar_consistency():
    """Memverifikasi bahwa kalkulasi vektor NumPy persis sama dengan kalkulasi skalar Python."""
    t_arr = np.array([20.0, 25.5, 31.0, 37.2])
    m_arr = np.array([40.0, 28.0, 19.5, 12.0])
    p_arr = np.array([6.2, 7.0, 7.6, 8.4])
    
    vec_out = vectorized_base_physics_loss(t_arr, m_arr, p_arr)
    scalar_out = [calculate_base_physics_loss(t, m, p) for t, m, p in zip(t_arr, m_arr, p_arr)]
    
    np.testing.assert_allclose(vec_out, scalar_out, rtol=1e-5, atol=1e-5)
