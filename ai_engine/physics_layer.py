"""
VolatiSafe AIoT — Physics-Informed Urease Kinetics Layer
=========================================================
Modul ini mengimplementasikan lapisan termodinamika dan biokimia deterministik
untuk menghitung laju hidrolisis urea tanah dan potensi kehilangan amonia (NH3)
akibat reaksi enzimatik urease.

Landasan Teori:
1. Persamaan Kinetika Arrhenius untuk ketergantungan suhu reaksi urease.
2. Formulasi Michaelis-Menten untuk faktor pembatas kelembaban tanah.
3. Model kesetimbangan asam-basa sigmoidal untuk fraksi amonia bebas (NH3 / NH4+).

Referensi Akademik:
- Kissel, D. E., & Cabrera, M. L. (2005). Factors affecting ammonia volatilization from urea.
- Fillery, I. R. P., & Khimashia, N. (2016). Soil Research, 54(1), 1-10.
- Pan, B., Lam, S. K., et al. (2016). Agriculture, Ecosystems & Environment, 232, 283-289.
"""

import math
from typing import Union
import numpy as np


# ==========================================
# KONSTANTA FISIKA & KINETIKA UNIVERSAL
# ==========================================
# Faktor frekuensi tumbukan molekul urease per jam (Kissel & Cabrera, 2005)
A_UREASE: float = 3.2e8  # jam^-1

# Energi aktivasi enzim urease pada tanah pertanian tropis (J/mol)
EA_UREASE: float = 51000.0  # J/mol

# Konstanta gas ideal universal (J/(mol·K))
R_GAS: float = 8.314462618  # J/(mol·K)

# Konstanta kejenuhan setengah kadar air tanah (Michaelis-Menten, % VWC)
KM_MOISTURE: float = 18.0  # % VWC

# Nol mutlak Kelvin
ZERO_CELSIUS_IN_KELVIN: float = 273.15

# Titik acuan normalisasi kinetika (Suhu maksimum lapangan 45°C)
TEMP_REF_MAX_C: float = 45.0


def _calculate_k_urease_scalar(temp_soil_c: float) -> float:
    """Menghitung konstanta laju reaksi urease Arrhenius untuk satu nilai suhu (°C)."""
    # Batasi suhu minimum pada -10°C agar tidak pembagian nol Kelvin
    t_c = max(-10.0, temp_soil_c)
    t_kelvin = t_c + ZERO_CELSIUS_IN_KELVIN
    exponent = -EA_UREASE / (R_GAS * t_kelvin)
    return A_UREASE * math.exp(exponent)


# Nilai k_urease pada 45°C sebagai penyebut normalisasi [0.0, 1.0]
K_UREASE_MAX: float = _calculate_k_urease_scalar(TEMP_REF_MAX_C)


def urease_temperature_kinetics(
    soil_temp_c: Union[float, np.ndarray]
) -> Union[float, np.ndarray]:
    """
    Menghitung faktor akselerasi kinetika urease ternormalisasi [0.0, 1.0].
    
    Persamaan Arrhenius:
        k(T) = A * exp(-Ea / (R * T_kelvin))
        k_norm = k(T) / k(45°C)
    
    Karakteristik:
        - 15°C -> ~0.14
        - 25°C -> ~0.37
        - 35°C -> ~0.72
        - 45°C -> 1.00
    """
    if isinstance(soil_temp_c, np.ndarray):
        t_c = np.clip(soil_temp_c, -10.0, 60.0)
        t_kelvin = t_c + ZERO_CELSIUS_IN_KELVIN
        k = A_UREASE * np.exp(-EA_UREASE / (R_GAS * t_kelvin))
        return np.clip(k / K_UREASE_MAX, 0.0, 1.5)
    else:
        k = _calculate_k_urease_scalar(soil_temp_c)
        return min(1.5, max(0.0, k / K_UREASE_MAX))


def moisture_suppression_factor(
    moisture_pct: Union[float, np.ndarray]
) -> Union[float, np.ndarray]:
    """
    Menghitung fraksi retensi kelembaban tanah (Michaelis-Menten) [0.0, 1.0].
    
    Formulasi:
        f_moist = moisture / (moisture + Km)
        faktor_pelepasan = 1.0 - f_moist
        
    Karakteristik:
        - Tanah basah (moisture >= 36%) -> f_moist >= 0.67 -> pelepasan teredam
        - Tanah kering (moisture <= 10%) -> f_moist <= 0.35 -> pelepasan tinggi
    """
    if isinstance(moisture_pct, np.ndarray):
        m = np.clip(moisture_pct, 0.0, 100.0)
        f_m = m / (m + KM_MOISTURE)
        return np.clip(1.0 - f_m, 0.0, 1.0)
    else:
        m = min(100.0, max(0.0, float(moisture_pct)))
        f_m = m / (m + KM_MOISTURE)
        return min(1.0, max(0.0, 1.0 - f_m))


def ph_alkalinity_factor(
    ph: Union[float, np.ndarray]
) -> Union[float, np.ndarray]:
    """
    Menghitung fraksi kesetimbangan pembentukan gas amonia bebas (NH3).
    
    Pada pH asam (< 6.0), nitrogen dominan sebagai ion amonium stabil (NH4+).
    Pada pH basa / kapur (> 7.5), kesetimbangan bergeser membentuk gas amonia (NH3).
    
    Formulasi Sigmoidal:
        f_pH = 10^(pH - 7.0) / (1 + 10^(pH - 7.0))
        
    Karakteristik:
        - pH 6.0 -> 0.09 (Amonia sangat tertekan)
        - pH 7.0 -> 0.50 (Netral)
        - pH 7.8 -> 0.86 (Alkalin Karst Lamongan / Ultisol Kapur)
        - pH 8.5 -> 0.97 (Sangat Basa)
    """
    if isinstance(ph, np.ndarray):
        p = np.clip(ph, 3.0, 11.0)
        p_diff = p - 7.0
        # Mencegah overflow numerik pada 10^p_diff
        p_diff = np.clip(p_diff, -4.0, 4.0)
        p_pow = np.power(10.0, p_diff)
        return np.clip(p_pow / (1.0 + p_pow), 0.0, 1.0)
    else:
        p = min(11.0, max(3.0, float(ph)))
        p_diff = min(4.0, max(-4.0, p - 7.0))
        p_pow = math.pow(10.0, p_diff)
        return min(1.0, max(0.0, p_pow / (1.0 + p_pow)))


def calculate_base_physics_loss(
    soil_temp_c: float,
    moisture_pct: float,
    ph: float
) -> float:
    """
    Menghitung potensi kehilangan amonia teoritis dasar (%) berbasis termodinamika.
    
    Persamaan Komposit:
        BaseLoss = 100 * k_norm(T) * (1 - f_moist(θ)) * f_ph(pH) * S_scale
        
    Rentang Nilai:
        - Tanah sejuk lembap (22°C, 35% VWC, pH 6.5) -> ~3.6%
        - Pagi hari normal (26°C, 30% VWC, pH 7.2)   -> ~13.5%
        - Siang hangat kering (32°C, 22% VWC, pH 7.8)-> ~34.2%
        - Terik ekstrem karst (36°C, 15% VWC, pH 8.2)-> ~58.5%
        
    Returns:
        float: Persentase estimasi kehilangan dasar, dibatasi dalam rentang [0.0, 100.0].
    """
    k_norm = urease_temperature_kinetics(soil_temp_c)
    rel_moisture = moisture_suppression_factor(moisture_pct)
    rel_ph = ph_alkalinity_factor(ph)

    # Faktor skala lapangan (S_scale = 2.0 untuk mengkalibrasi laju harian maksimum)
    loss = 100.0 * k_norm * rel_moisture * rel_ph * 2.0
    return min(100.0, max(0.0, float(loss)))


def vectorized_base_physics_loss(
    soil_temp_c: np.ndarray,
    moisture_pct: np.ndarray,
    ph: np.ndarray
) -> np.ndarray:
    """
    Versi tervektorisasi NumPy dari calculate_base_physics_loss.
    Digunakan untuk pemrosesan deret waktu cepat ribuan baris pada dataset_builder.
    """
    k_norm = urease_temperature_kinetics(soil_temp_c)
    rel_moisture = moisture_suppression_factor(moisture_pct)
    rel_ph = ph_alkalinity_factor(ph)

    raw_loss = 100.0 * k_norm * rel_moisture * rel_ph * 2.0
    return np.clip(raw_loss, 0.0, 100.0)
