# CHANGELOG.md — Master Riwayat Proyek VolatiSafe AIoT

Master changelog tingkat sistem yang mencatat rilis dan tonggak integrasi utama proyek VolatiSafe AIoT. Untuk riwayat teknis per domain, lihat changelog spesifik di masing-masing folder:
- **Domain AI & Machine Learning:** [`docs/ai/CHANGELOG.md`](docs/ai/CHANGELOG.md)

---

## [Unreleased]
- Integrasi modul AI Engine, Digital Twin, dan Backend Ingestion.

---

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
