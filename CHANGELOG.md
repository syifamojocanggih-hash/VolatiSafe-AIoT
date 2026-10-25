# CHANGELOG.md — Riwayat Pengembangan & Audit Task VolatiSafe AIoT

Semua perubahan teknis, penambahan modul, hasil pengujian, dan catatan keputusan arsitektur dicatat di sini mengikuti konvensi [Keep a Changelog](https://keepachangelog.com/id/1.0.0/).

---

## [Unreleased] — Tahap 3: Pelatihan Model Residual LightGBM & SHAP (Next)
- **Fokus:** Pembuatan skrip `ai_engine/train.py` dengan monotone constraints dan pembuktian benchmark terhadap baseline aturan statis.
- **PIC:** Aris Kurniawan (Lead AI Engineer & Auditor).

---

## [0.3.0] - 2026-10-25 — Penyelesaian AI Tahap 2: Dataset Builder & Anti-Leakage Holdout

### Ditambahkan (Added)
- **Dataset Cuaca Historis BMKG Lamongan (`simulations/data_replay/datasets/bmkg_lamongan.csv`):**
  - 8.760 baris data per jam 1 tahun penuh (2025) berbasis Stasiun BMKG Tuban/Lamongan (WMO 96933).
  - Parameter: suhu udara ambien, kelembaban relatif, kecepatan angin, radiasi surya, dan curah hujan.
- **Modul Dataset Builder Anti-Bocor (`ai_engine/dataset_builder.py`):**
  - Ingestion cuaca dan simulasi biofisika tanah karst Lamongan (BBSDLP/SoilGrids) secara sekuensial.
  - Perhitungan Defisit Tekanan Uap Air ($VPD = e_s - e_a$ dalam kPa) dan prediksi hujan 6 jam ke depan.
  - Pembentukan fitur komposit 9 parameter (`FeatureVectorDTO`) dan kalkulasi ground truth target volatilisasi amonia.
  - Pemisahan holdout deret waktu murni (*out-of-time split*): 7.008 baris train (Jan–Okt) dan 1.752 baris test (Okt–Des).
  - Jaminan **Zero Time-Series Leakage**: $0\%$ tumpang tindih waktu antara data latih dan data uji.
- **Suite Pengujian Unit Dataset (`ai_engine/tests/test_dataset_builder.py`):**
  - 5 unit test: verifikasi rumus VPD, verifikasi struktur kolom lengkap, verifikasi 0% nilai NaN/Inf, audit ketat anti-kebocoran waktu, dan verifikasi batas rentang nilai target $[0.0, 100.0]$.
- **Dataset Terkompilasi (`data/training_dataset_lamongan.csv`):**
  - Berkas CSV 698 KB siap latih berisi 8.760 sampel tabular lengkap.

### Diverifikasi (Verified)
- Seluruh 12 unit test lulus 100% via `pytest` (7 modul fisika + 5 dataset builder dalam 3.26s).
- Audit kebocoran data: $\max(T_{train}) = \text{2025-10-19T23:00:00Z} < \min(T_{test}) = \text{2025-10-20T00:00:00Z}$ (Zero Leakage Pass).

---

## [0.2.0] - 2026-10-25 — Penyelesaian AI Tahap 1: Physics-Informed Urease Kinetics Layer

### Ditambahkan (Added)
- **Modul Kinetika Fisika (`ai_engine/physics_layer.py`):**
  - Implementasi hukum termodinamika Arrhenius untuk laju reaksi enzim urease tanah ($A = 3.2 \times 10^8\text{ jam}^{-1}$, $E_a = 51.000\text{ J/mol}$, $R = 8.314\text{ J/(mol}\cdot\text{K)}$).
  - Implementasi faktor redaman air tanah Michaelis-Menten ($K_m = 18.0\%$ VWC).
  - Implementasi faktor kesetimbangan asam-basa amonium sigmoidal ($pH \ge 7.0$ meningkatkan fraksi amonia bebas).
  - Fungsi komputasi skalar `calculate_base_physics_loss()` dan vektorisasi cepat `vectorized_base_physics_loss()`.
- **Suite Pengujian Unit (`ai_engine/tests/test_physics_layer.py`):**
  - 7 unit test pengujian sains (uji konstanta, uji kenaikan monotonik suhu, uji penurunan monotonik kelembaban, uji kenaikan pH, uji batas Monte Carlo 5.000 sampel acak $[0.0, 100.0]$, dan uji konsistensi vektorisasi).
- **Konfigurasi Pengujian (`pytest.ini`):**
  - Konfigurasi root pytest untuk eksekusi otomatis tanpa setting manual PYTHONPATH.
- **Dokumentasi Metodologi Tanah (`docs/digital_twin/SOIL_BASELINE_DATA.md`):**
  - Dokumentasi integrasi data sekunder BBSDLP Kementan dan ISRIC SoilGrids 250m.
  - Perhitungan kapasitas lapang ($\theta_{fc} = 39.5\%$) dan titik layu ($\theta_{wp} = 13.8\%$) menggunakan Pedotransfer Saxton & Rawls (2006).
- **Fondasi Matematis Digital Twin (`docs/digital_twin/MATHEMATICAL_FOUNDATIONS.md`):**
  - Perumusan lengkap 4 hukum sains pengatur tanah virtual (FAO-56, Saxton-Rawls, Fourier 1D, Arrhenius).
- **Protokol Validasi Laboratorium (`docs/universal/LAB_VALIDATION_PROTOCOL.md`):**
  - Protokol pengujian 5 tingkat TKT 3 berbasis 3 skenario stres (Terik Siang, Hujan Sore, Sensor Dropout).
- **SOP Training Model AI (`docs/ai/TASK_GUIDE.md`):**
  - Rincian panduan langkah-demi-langkah 6 tahap eksekusi training model LightGBM.
- **Aset Gambar Arsitektur AI Pipeline (`docs/ai/assets/`):**
  - Diagram visual arsitektur resolusi tinggi 4445x2778 (`ai_pipeline_architecture.png` dan `.svg`).

### Diubah (Changed)
- **Penyelarasan Lokus Cuaca ke Lamongan:**
  - Menetapkan Stasiun Meteorologi BMKG Tuban/Lamongan & Pos Pengamatan Agroklimat Lamongan (WMO ID: 96933) sebagai stasiun cuaca utama sistem pada seluruh task guide dan dokumentasi Digital Twin.
- **Penyederhanaan Cabang Git ke Role-Based Model:**
  - Mengganti puluhan cabang mikro menjadi 6 cabang resmi: `Development`, `main`, `ai`, `digittal-twin`, `full-stack`, `iot`.
- **Pembersihan Fitur What-If Simulator:**
  - Menghapus fitur slider What-If dari UI web dan backend untuk menjaga integritas sistem agar 100% realistis berbasis data sensor dan stasiun cuaca asli.

### Diverifikasi (Verified)
- Eksekusi `pytest` lulus 100% (7 passed in 0.16s).
- Batas termodinamika terverifikasi: $0.0\% \le \text{BasePhysicsLoss} \le 100.0\%$.

---

## [0.1.0] - 2026-10-24 — Inisialisasi Arsitektur Modular VolatiSafe AIoT

### Ditambahkan (Added)
- Dokumen Kebutuhan Produk (`PRD_VolatiSafe_AIoT_v1.md` dan `docs/universal/PRD.md`).
- Dokumen Universal Arsitektur (`ARCHITECTURE.md`, `BOUNDARIES_AND_CONTRACTS.md`, `DECISIONS.md`, `GIT_WORKFLOW.md`, `INTERFACES.md`, `PROJECT_CONTEXT.md`, `ROADMAP.md`).
- Pemisahan mandiri dokumentasi Digital Twin ke folder `docs/digital_twin/`.
- Panduan teknis role-based: `docs/hardware/TASK_GUIDE.md`, `docs/digital_twin/TASK_GUIDE.md`, `docs/backend/TASK_GUIDE.md`, `docs/frontend/TASK_GUIDE.md`.
- Inisialisasi direktori fisik repositori dengan file `.gitkeep`.
