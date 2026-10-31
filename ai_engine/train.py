"""
VolatiSafe AIoT — Training Engine (PIML LightGBM Residual Learning)
===================================================================
Skrip ini melatih model Physics-Informed Machine Learning (PIML)
untuk memprediksi deviasi mikroklimat lokal (residual) di atas
lapisan kinetika kimia Arrhenius dasar.

Fitur Utama:
1. Monotone Constraints: Menjamin kurva prediksi searah hukum alam
   (T_soil: +1, Moisture: -1, pH: +1).
2. Out-of-Time Holdout: 80% data latih awal, 20% data uji akhir (Zero Leakage).
3. Benchmark Validation: Menguji performa terhadap baseline aturan statis petani.
4. Serialisasi Model Teks Kompak: Menyimpan model LightGBM ke format .txt (~2 MB).
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from typing import Dict, Any, Tuple

import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Pastikan root proyek masuk ke sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ai_engine.physics_layer import calculate_base_physics_loss

# Daftar fitur input standar sesuai kontrak INTERFACES.md §2
FEATURE_COLUMNS = [
    'soil_temp_c',
    'moisture_pct',
    'ph',
    'air_temp_c',
    'temp_delta',
    'humidity_rh',
    'wind_speed_ms',
    'solar_radiation_mj',
    'vpd_kpa',
    'rain_forecast_6h_mm',
    'dat'
]

# Batasan arah kurva monotonik:
# soil_temp_c (+1: suhu naik -> risiko naik)
# moisture_pct (-1: air naik -> risiko turun)
# ph (+1: pH naik -> risiko naik)
# fitur lainnya (0: unconstrained)
MONOTONE_CONSTRAINTS = [1, -1, 1, 0, 0, 0, 0, 0, 0, 0, 0]


def train_piml_model(
    dataset_path: str,
    split_ratio: float = 0.80,
    model_output_path: str = "models/avri_model.txt",
    report_output_path: str = "docs/ai/evaluation_report.json"
) -> Dict[str, Any]:
    """
    Melatih model LightGBM residual learning dan mengevaluasinya pada test holdout.
    """
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset tidak ditemukan: {dataset_path}")

    print(f"Memuat dataset dari: {dataset_path} ...")
    df = pd.read_csv(dataset_path)

    n_total = len(df)
    n_train = int(n_total * split_ratio)

    train_df = df.iloc[:n_train].copy().reset_index(drop=True)
    test_df = df.iloc[n_train:].copy().reset_index(drop=True)

    # Verifikasi anti-kebocoran waktu
    assert train_df['timestamp'].max() < test_df['timestamp'].min(), \
        "KRITIS: Kebocoran waktu terdeteksi antara data train dan test!"

    X_train = train_df[FEATURE_COLUMNS]
    # Target pelatihan adalah RESIDUAL: target aktual dikurangi basis fisika Arrhenius
    y_train_residual = train_df['target_volatilization_loss'] - train_df['base_physics_loss']

    X_test = test_df[FEATURE_COLUMNS]
    y_test_target = test_df['target_volatilization_loss']
    y_test_base = test_df['base_physics_loss']

    print(f"Data latih: {len(X_train)} baris ({train_df['timestamp'].min()} s.d {train_df['timestamp'].max()})")
    print(f"Data uji  : {len(X_test)} baris ({test_df['timestamp'].min()} s.d {test_df['timestamp'].max()})")

    # Inisialisasi Model LightGBM Regressor
    model = lgb.LGBMRegressor(
        n_estimators=300,
        learning_rate=0.03,
        num_leaves=31,
        max_depth=6,
        min_child_samples=20,
        monotone_constraints=MONOTONE_CONSTRAINTS,
        objective='regression',
        random_state=42,
        verbose=-1
    )

    print("Memulai pelatihan model LightGBM dengan Monotone Constraints ...")
    t0 = time.time()
    model.fit(X_train, y_train_residual)
    train_duration_sec = time.time() - t0
    print(f"Pelatihan selesai dalam: {train_duration_sec:.2f} detik.")

    # Inferensi pada Holdout Test Set
    t_inf_start = time.time()
    predicted_residual = model.predict(X_test)
    inf_duration_ms = ((time.time() - t_inf_start) / len(X_test)) * 1000.0

    # Rekonstruksi nilai akhir AVRI: BasePhysics + PredictedResidual
    final_avri_pred = np.clip(y_test_base + predicted_residual, 0.0, 100.0)

    # 1. Metrik Model PIML
    mae_piml = float(mean_absolute_error(y_test_target, final_avri_pred))
    rmse_piml = float(np.sqrt(mean_squared_error(y_test_target, final_avri_pred)))
    r2_piml = float(r2_score(y_test_target, final_avri_pred))

    # 2. Metrik Baseline Aturan Statis Petani (If-Else)
    # Aturan: Jika tanah panas (>30C), kering (<24%), dan basa Solokuro (>7.4) -> risiko 65%, selain itu 18%
    static_rule_pred = np.where(
        (test_df['soil_temp_c'] > 30.0) & (test_df['moisture_pct'] < 24.0) & (test_df['ph'] > 7.4),
        65.0,
        18.0
    )
    mae_static = float(mean_absolute_error(y_test_target, static_rule_pred))
    rmse_static = float(np.sqrt(mean_squared_error(y_test_target, static_rule_pred)))

    # Persentase Peningkatan Efisiensi Prediksi
    improvement_pct = float(((mae_static - mae_piml) / mae_static) * 100.0)

    # Serialisasi Model
    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    model.booster_.save_model(model_output_path)
    model_size_kb = os.path.getsize(model_output_path) / 1024.0

    # Laporan Evaluasi Lengkap
    report = {
        "model_metadata": {
            "model_type": "Physics-Informed LightGBM Regressor (PIML)",
            "version": "1.0.0-tkt3",
            "training_date": time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime()),
            "dataset_source": dataset_path,
            "monotone_constraints": dict(zip(FEATURE_COLUMNS, MONOTONE_CONSTRAINTS)),
            "model_file": model_output_path,
            "model_size_kb": round(model_size_kb, 1),
            "inference_latency_per_sample_ms": round(inf_duration_ms, 3)
        },
        "sample_split": {
            "total_samples": n_total,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "train_period": f"{train_df['timestamp'].min()} s.d {train_df['timestamp'].max()}",
            "test_period": f"{test_df['timestamp'].min()} s.d {test_df['timestamp'].max()}",
            "zero_time_series_leakage": True
        },
        "piml_model_metrics": {
            "mae": round(mae_piml, 3),
            "rmse": round(rmse_piml, 3),
            "r2_score": round(r2_piml, 4)
        },
        "static_rule_baseline_metrics": {
            "mae": round(mae_static, 3),
            "rmse": round(rmse_static, 3)
        },
        "benchmark_comparison": {
            "mae_reduction_pct": round(improvement_pct, 2),
            "target_gate_passed": improvement_pct >= 15.0
        }
    }

    os.makedirs(os.path.dirname(report_output_path), exist_ok=True)
    with open(report_output_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    print("\n" + "=" * 50)
    print("HASIL EVALUASI BENCHMARK MODEL PIML")
    print("=" * 50)
    print(f"PIML LightGBM MAE       : {mae_piml:.3f}% (Target: <= 3.5%)")
    print(f"PIML LightGBM RMSE      : {rmse_piml:.3f}%")
    print(f"PIML LightGBM R²        : {r2_piml:.4f} (Target: >= 0.85)")
    print(f"Static Rule Baseline MAE: {mae_static:.3f}%")
    print(f"Peningkatan vs Baseline : {improvement_pct:.2f}% (Target Lolos: >= 15.0%)")
    print(f"Latensi Inferensi       : {inf_duration_ms:.3f} ms / sampel (Target: <= 20 ms)")
    print(f"Model tersimpan ke      : {model_output_path} ({model_size_kb:.1f} KB)")
    print(f"Laporan tersimpan ke    : {report_output_path}")
    print("=" * 50 + "\n")

    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train VolatiSafe PIML LightGBM Model")
    parser.add_argument('--dataset', type=str, default='data/training_dataset_lamongan.csv')
    parser.add_argument('--split-ratio', type=float, default=0.80)
    parser.add_argument('--model-out', type=str, default='models/avri_model.txt')
    parser.add_argument('--report-out', type=str, default='docs/ai/evaluation_report.json')
    args = parser.parse_args()

    train_piml_model(
        dataset_path=args.dataset,
        split_ratio=args.split_ratio,
        model_output_path=args.model_out,
        report_output_path=args.report_out
    )
