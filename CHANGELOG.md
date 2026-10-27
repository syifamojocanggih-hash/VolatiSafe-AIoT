# CHANGELOG.md — Master Riwayat Proyek VolatiSafe AIoT

Master changelog tingkat sistem yang mencatat rilis dan tonggak integrasi utama proyek VolatiSafe AIoT. Untuk riwayat teknis per domain, lihat changelog spesifik di masing-masing folder:
- **Domain Frontend:** [`docs/frontend/Changelog.md`](docs/frontend/Changelog.md)
- **Domain Backend:** [`docs/backend/Changelog.md`](docs/backend/Changelog.md)
- **Domain AI & Machine Learning:** [`docs/ai/CHANGELOG.md`](docs/ai/CHANGELOG.md)

---

## [Unreleased]
- **Frontend & Fullstack:** Transformasi sistem peringatan risiko dari skema biner (merah/hijau) menjadi 4 tingkatan status resmi: **Aman (Hijau)**, **Waspada (Amber)**, **Kritis (Oranye)**, dan **Bahaya (Merah)** pada `RiskStatusBanner`, kartu AVRI `MetricCardsGrid`, `PredictionDetailModal`, dan pemilih skenario 4-level di `SettingsModal`.
- **Simulator & Peta Spasial:** Penyediaan **4 Preset Skenario 1-Klik** di `WhatIfPanel` (Aman, Waspada, Kritis, Bahaya) dengan kalkulasi live backend FastAPI, serta pemisahan 4 zona warna terpisah pada legenda dan badge persil di `ParcelRiskMap` dan `LeafletFieldMap`.
- **Backend Ingestion & API:** Penyelarasan pemetaan warna dan kategori peringatan `alert_banner` pada endpoint `/fields/{field_id}/current-status` untuk memisahkan level kritis (`#EA580C`) dan bahaya (`#DC2626`).
- Integrasi modul AI Engine, Digital Twin, dan Backend Ingestion.

---

## [0.6.0] - 2026-10-25
- Penyelesaian AI Tahap 5: Implementasi Safe Application Window Forecaster 72 jam.
- Deteksi blok jam aman berurutan minimal 2 jam (AVRI <= 30%) dan perhitungan confidence decay temporal.
- Lolos 23/23 unit test suite.

## [0.5.0] - 2026-10-25
- Penyelesaian AI Tahap 4: Implementasi mesin inferensi AVRI (0–100%) dan service wrapper DTO compliance.
- Pemetaan 4 tingkat risiko resmi (Aman, Waspada, Kritis, Bahaya) dan penjelasan TreeSHAP dinamis.
- Lolos 19/19 unit test suite.

## [0.4.0] - 2026-10-25
- Penyelesaian AI Tahap 3: Pelatihan model Physics-Informed LightGBM residual learning dengan monotone constraints.
- Model berhasil mengalahkan baseline aturan statis petani sebesar 84.62% (MAE 1.004% vs 6.530%, R2 0.9875).
- Ekspor TreeSHAP summary plot dan lulus 15/15 unit test suite.

## [0.3.0] - 2026-10-25
- Penyelesaian AI Tahap 2: Dataset builder anti-bocor dengan 8.760 jam data iklim BMKG Lamongan.
- Lolos 12/12 unit test suite pengujian sains dan dataset.

## [0.2.0] - 2026-10-25
- Penyelesaian AI Tahap 1: Physics-informed urease kinetics layer (Arrhenius, Michaelis-Menten, Sigmoid pH).
- Pemisahan domain mandiri Digital Twin (`docs/digital_twin/`) dan penataan alur kerja Git 6 cabang role-based.

## [0.1.0] - 2026-10-24
- Inisialisasi arsitektur modular VolatiSafe AIoT dan penyusunan master PRD v1.0 (TKT 3 ke TKT 6).
