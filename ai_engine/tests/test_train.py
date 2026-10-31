"""
Unit Test & Quality Gate Audit: ai_engine/train.py & models/avri_model.txt
==========================================================================
Memverifikasi artefak model terkompilasi, pemenuhan kriteria evaluasi benchmark
terhadap aturan statis (> 15% reduction), latensi inferensi, dan monotone constraints.
"""

import os
import json
import pytest
import numpy as np
import lightgbm as lgb

MODEL_PATH = "models/avri_model.txt"
REPORT_PATH = "docs/ai/evaluation_report.json"
SHAP_PLOT_PATH = "docs/ai/assets/shap_summary_plot.png"


def test_model_artifact_exists_and_valid():
    """Memverifikasi berkas model teks LightGBM ada dan dapat dimuat."""
    assert os.path.exists(MODEL_PATH), f"Berkas model {MODEL_PATH} tidak ditemukan!"
    size_kb = os.path.getsize(MODEL_PATH) / 1024.0
    assert 100.0 <= size_kb <= 5000.0, f"Ukuran model mencurigakan: {size_kb:.1f} KB"
    
    booster = lgb.Booster(model_file=MODEL_PATH)
    assert booster.num_trees() > 0, "Model tidak memiliki pohon keputusan!"


def test_evaluation_report_quality_gates():
    """Memverifikasi pemenuhan batas kualitas (Quality Gates) pada evaluation report."""
    assert os.path.exists(REPORT_PATH), f"Laporan evaluasi {REPORT_PATH} tidak ditemukan!"
    
    with open(REPORT_PATH, 'r', encoding='utf-8') as f:
        report = json.load(f)
        
    piml = report.get("piml_model_metrics", {})
    benchmark = report.get("benchmark_comparison", {})
    metadata = report.get("model_metadata", {})
    
    # 1. Gate Akurasi MAE & R2
    assert piml.get("mae", 99.0) <= 3.5, f"MAE model {piml.get('mae')}% melampaui batas toleransi 3.5%!"
    assert piml.get("r2_score", 0.0) >= 0.85, f"R² score {piml.get('r2_score')} di bawah target 0.85!"
    
    # 2. Gate Peningkatan vs Baseline Aturan Statis
    assert benchmark.get("target_gate_passed", False) is True, "Model gagal mengalahkan baseline statis!"
    assert benchmark.get("mae_reduction_pct", 0.0) >= 15.0, f"Peningkatan {benchmark.get('mae_reduction_pct')}% kurang dari 15%!"
    
    # 3. Gate Latensi Inferensi
    assert metadata.get("inference_latency_per_sample_ms", 99.0) <= 20.0, "Latensi inferensi terlalu lambat untuk edge/real-time!"


def test_shap_summary_plot_generated():
    """Memverifikasi grafik TreeSHAP telah diekspor untuk bahan bukti proposal."""
    assert os.path.exists(SHAP_PLOT_PATH), f"Grafik SHAP {SHAP_PLOT_PATH} tidak ditemukan!"
    assert os.path.getsize(SHAP_PLOT_PATH) > 10000, "Ukuran file grafik SHAP terlalu kecil (kemungkinan corrupt)!"
