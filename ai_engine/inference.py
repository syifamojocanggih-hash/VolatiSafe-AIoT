"""
VolatiSafe AIoT — AVRI Inference & Risk Classification Engine
=============================================================
Modul ini bertugas menggabungkan basis fisika termodinamika Arrhenius
dengan prediksi residual LightGBM untuk menghasilkan skor akhir
Ammonia Volatilization Risk Index (AVRI: 0–100%) dan memetakannya
ke dalam 4 kategori tindakan preskriptif lapangan.

Referensi Spek:
- docs/ai/MODEL_SPEC.md §4 (Klasifikasi Risiko & Preskripsi Aksi)
- docs/universal/INTERFACES.md §2.2 (Output DTO Response)
"""

import os
import sys
import math
from pathlib import Path
from typing import Dict, Any, Tuple, List, Union

import numpy as np
import pandas as pd
import lightgbm as lgb

# Pastikan root proyek masuk ke sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ai_engine.physics_layer import (
    calculate_base_physics_loss,
    vectorized_base_physics_loss,
    urease_temperature_kinetics,
    moisture_suppression_factor,
    ph_alkalinity_factor
)
from ai_engine.train import FEATURE_COLUMNS

DEFAULT_MODEL_PATH = "models/avri_model.txt"

# Definisi Ambang Batas 4 Tingkat Risiko (Strict Protocol)
RISK_TIERS = {
    "aman": {
        "min_score": 0.0,
        "max_score": 30.0,
        "color": "#16A34A",
        "action_id": "APPLY_NOW",
        "title": "WAKTU TEPAT MENABUR UREA",
        "summary": "Potensi kehilangan amonia sangat rendah (<30%). Kondisi tanah sejuk dan lembap optimal untuk penyerapan nitrogen.",
        "guidance": "Lakukan penaburan pupuk Urea sekarang sesuai dosis rekomendasi. Sebar merata di sekitar tajuk tanaman."
    },
    "waspada": {
        "min_score": 30.1,
        "max_score": 60.0,
        "color": "#CA8A04",
        "action_id": "INCORPORATE_OR_IRRIGATE",
        "title": "WASPADA — GUNAKAN METODE BENAM ATAU SIRAM",
        "summary": "Potensi kehilangan amonia sedang (30-60%). Tanah agak kering atau suhu mulai menghangat.",
        "guidance": "Gunakan METODE TUGAL/BENAM sedalam 4 cm di samping batang tanaman, atau berikan penyiraman ringan sebelum aplikasi. Hindari sebar bebas di permukaan bedeng."
    },
    "kritis": {
        "min_score": 60.1,
        "max_score": 80.0,
        "color": "#EA580C",
        "action_id": "DELAY_FERTILIZATION",
        "title": "TUNDA PENABURAN UREA",
        "summary": "Potensi kehilangan nitrogen ke udara mencapai 60-80%. Tanah terlalu panas, kering, atau bersifat alkalin tinggi.",
        "guidance": "TUNDA penaburan pupuk! Tunggu jendela aman sore hari atau besok pagi saat suhu tanah turun di bawah 28°C."
    },
    "bahaya": {
        "min_score": 80.1,
        "max_score": 100.0,
        "color": "#DC2626",
        "action_id": "PROHIBIT_APPLICATION",
        "title": "DILARANG MENABUR UREA",
        "summary": "Tanah sangat panas, terik, dan kering ekstrem. Kehilangan pupuk hampir total (>80%) menguap menjadi gas amonia.",
        "guidance": "DILARANG KERAS menabur Urea! Setiap butir pupuk yang ditebar akan menguap sia-sia. Tunda 24–48 jam hingga kelembaban pulih atau hujan turun."
    }
}


class AVRIInferenceEngine:
    """
    Mesin inferensi utama untuk skor AVRI berbasis model PIML LightGBM.
    """
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self.model_path = model_path
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model LightGBM tidak ditemukan di: {model_path}. "
                "Jalankan 'python ai_engine/train.py' terlebih dahulu."
            )
        self.booster = lgb.Booster(model_file=model_path)

    def classify_risk(self, avri_score: float) -> Tuple[str, Dict[str, Any]]:
        """Mengklasifikasikan skor AVRI numerik ke dalam 4 kategori risiko."""
        score = float(np.clip(avri_score, 0.0, 100.0))
        if score <= 30.0:
            category = "aman"
        elif score <= 60.0:
            category = "waspada"
        elif score <= 80.0:
            category = "kritis"
        else:
            category = "bahaya"
        return category, RISK_TIERS[category]

    def predict_single(
        self,
        soil_temp_c: float,
        moisture_pct: float,
        ph: float,
        air_temp_c: float,
        humidity_rh: float,
        wind_speed_ms: float,
        solar_radiation_mj: float,
        rain_forecast_6h_mm: float = 0.0,
        dat: int = 30
    ) -> Dict[str, Any]:
        """
        Menjalankan inferensi PIML untuk 1 titik kondisi lingkungan.
        """
        # 1. Hitung fitur turunan
        temp_delta = round(soil_temp_c - air_temp_c, 1)
        
        # Hitung VPD (Vapor Pressure Deficit) dalam kPa
        es = 0.6108 * math.exp((17.27 * air_temp_c) / (air_temp_c + 237.3))
        ea = es * (humidity_rh / 100.0)
        vpd_kpa = round(max(0.0, es - ea), 2)

        # 2. Hitung Base Physics Loss (Kinetika Arrhenius)
        base_physics_loss = calculate_base_physics_loss(soil_temp_c, moisture_pct, ph)

        # 3. Bentuk matriks fitur untuk model residual LightGBM
        feature_vector = np.array([[
            soil_temp_c,
            moisture_pct,
            ph,
            air_temp_c,
            temp_delta,
            humidity_rh,
            wind_speed_ms,
            solar_radiation_mj,
            vpd_kpa,
            rain_forecast_6h_mm,
            dat
        ]], dtype=np.float64)

        # 4. Prediksi residual deviasi lingkungan
        predicted_residual = float(self.booster.predict(feature_vector)[0])

        # 5. Sintesis Skor Akhir AVRI
        avri_score = float(np.clip(base_physics_loss + predicted_residual, 0.0, 100.0))
        category, tier_info = self.classify_risk(avri_score)

        # Diagnostik kinetika fisika
        k_norm = urease_temperature_kinetics(soil_temp_c)
        f_moist = moisture_suppression_factor(moisture_pct)
        f_ph = ph_alkalinity_factor(ph)

        return {
            "avri_score": round(avri_score, 1),
            "risk_category": category,
            "base_physics_loss": round(base_physics_loss, 2),
            "predicted_residual": round(predicted_residual, 2),
            "safe_window_open": (category == "aman"),
            "color_hex": tier_info["color"],
            "prescription": {
                "action_id": tier_info["action_id"],
                "title": tier_info["title"],
                "summary": tier_info["summary"],
                "immediate_guidance": tier_info["guidance"]
            },
            "physics_diagnostics": {
                "k_urease_normalized": round(float(k_norm), 3),
                "moisture_release_factor": round(float(f_moist), 3),
                "ph_alkalinity_factor": round(float(f_ph), 3),
                "is_physics_constrained": True
            }
        }

    def predict_batch(
        self,
        features_df: pd.DataFrame
    ) -> np.ndarray:
        """
        Menjalankan inferensi cepat untuk ribuan sampel DataFrame.
        Mengembalikan array AVRI numerik.
        """
        base_losses = vectorized_base_physics_loss(
            features_df['soil_temp_c'].values,
            features_df['moisture_pct'].values,
            features_df['ph'].values
        )
        X = features_df[FEATURE_COLUMNS].values
        residuals = self.booster.predict(X)
        return np.clip(base_losses + residuals, 0.0, 100.0)
