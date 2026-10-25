# CHANGELOG.md — Domain AI Engine & Machine Learning (Aris)

> **DOKUMEN RIWAYAT AUDIT & TASK AI VOLATISAFE AIoT**  
> **PIC:** Aris Kurniawan (Lead AI Engineer & System Architect)  
> **Area Kerja:** `ai_engine/`, `models/`, `docs/ai/`  
> **Cabang Git:** `ai`  

Dokumen ini mencatat seluruh riwayat pengembangan, pelatihan model, evaluasi metrik, dan pengujian unit pada pilar AI/ML mengikuti konvensi [Keep a Changelog](https://keepachangelog.com/id/1.0.0/).

---

## [Unreleased] — Tahap 6: Validasi Closed-Loop Virtual Testbed (TKT 3) & Integrasi Final
- **Fokus:** Menjalankan skenario pengujian stres lab (L1–L4) sesuai `docs/universal/LAB_VALIDATION_PROTOCOL.md` dan verifikasi kesiapan demo juri.
- **PIC:** Aris Kurniawan (Lead AI Engineer & Auditor).

---

## [0.6.0] - 2026-10-25 — Penyelesaian AI Tahap 5: Peramalan Jendela Waktu Aman 72 Jam (Safe Application Window Forecaster)

### Ditambahkan (Added)
- **Modul Peramalan Horizon 72 Jam (`ai_engine/window_forecaster.py`):**
  - Implementasi `SafeWindowForecaster` yang mengevaluasi deret waktu cuaca BMKG Lamongan jam demi jam selama 3 hari ke depan (72 jam).
  - Algoritma `detect_safe_windows` untuk mendeteksi blok jam berurutan dengan $AVRI \le 30\%$ dan durasi minimal 2 jam.
  - Perhitungan **Confidence Decay**: tingkat keyakinan prakiraan menurun realistis seiring berjalannya waktu ($95\%$ pada 24 jam pertama, $88\%$ pada 24–48 jam, dan $78\%$ pada 48–72 jam).
  - Penentuan jendela optimal (`get_optimal_safe_window`) untuk segera ditampilkan pada notifikasi petani.
- **Integrasi Service Wrapper (`ai_engine/service.py`):**
  - Penambahan method `forecast_windows_72h(...)` pada `AIEngineService` untuk memasok data deret waktu visualisasi grafik Recharts di dashboard Next.js.
- **Suite Pengujian Unit Peramalan 72 Jam (`ai_engine/tests/test_window_forecaster.py`):**
  - 4 unit test: validasi struktur 72 jam, deteksi blok aman berurutan minimal 2 jam, pengujian penurunan confidence secara temporal, dan integrasi pemanggilan melalui service wrapper.

### Diverifikasi (Verified)
- Seluruh 23 unit test lulus 100% via `pytest` (7 fisika + 5 dataset + 3 training + 4 inferensi + 4 forecaster dalam 4.81s).

---

## [0.5.0] - 2026-10-25 — Penyelesaian AI Tahap 4: Formulasi AVRI & Service Wrapper DTO

### Ditambahkan (Added)
- **Mesin Inferensi AVRI (`ai_engine/inference.py`):**
  - Menggabungkan kehilangan dasar fisika Arrhenius dengan residual LightGBM ke dalam skor $AVRI = \text{clip}(BaseLoss + Residual, 0.0, 100.0)$.
  - Memetakan skor AVRI ke dalam **4 Tingkat Risiko Resmi**:
    - `0.0 – 30.0%`: **Aman** (Hijau `#16A34A` $\rightarrow$ `APPLY_NOW`)
    - `30.1 – 60.0%`: **Waspada** (Kuning `#CA8A04` $\rightarrow$ `INCORPORATE_OR_IRRIGATE`)
    - `60.1 – 80.0%`: **Kritis** (Oranye `#EA580C` $\rightarrow$ `DELAY_FERTILIZATION`)
    - `80.1 – 100.0%`: **Bahaya** (Merah `#DC2626` $\rightarrow$ `PROHIBIT_APPLICATION`)
  - Mendukung inferensi cepat tunggal (*single inference*) dan inferensi berkecepatan tinggi berbasis array DataFrame (*batch inference*).
- **Service Wrapper Sesuai Kontrak DTO (`ai_engine/service.py`):**
  - Implementasi `PredictRiskRequestDTO` dan `PredictRiskResponseDTO` yang mematuhi 100% spesifikasi `docs/universal/INTERFACES.md` §2.
  - Pembangkit penjelasan fitur TreeSHAP dinamis (`_generate_shap_explanations`) untuk menerjemahkan kontribusi fitur teknis ke dalam bahasa agronomi petani.
  - Diagnostik kinetika fisika ($k_{urease}$ per jam, laju hidrolisis, penanda `is_physics_constrained: True`).
- **Suite Pengujian Unit Inferensi & Service (`ai_engine/tests/test_inference_and_service.py`):**
  - 4 unit test: uji batas Monte Carlo 1.000 titik acak, uji pemetaan 4-tingkat risiko, uji skenario agronomi nyata Lamongan, dan verifikasi kepatuhan DTO respons JSON.

### Diverifikasi (Verified)
- Seluruh 19 unit test lulus 100% via `pytest` (7 fisika + 5 dataset + 3 training + 4 inferensi/service dalam 6.35s).

---

## [0.4.0] - 2026-10-25 — Penyelesaian AI Tahap 3: Pelatihan Model Residual LightGBM & SHAP

### Ditambahkan (Added)
- **Modul Pelatihan Residual LightGBM (`ai_engine/train.py`):**
  - Implementasi regresi residual $y_{res} = y_{target} - y_{physics}$ dengan arsitektur Physics-Informed ML.
  - Penegakan **Monotone Constraints**: $T_{soil} (+1)$, $\theta (-1)$, $pH (+1)$ agar kurva selalu logis searah hukum termodinamika.
  - Pemisahan data latih (7.008 baris) dan data uji holdout (1.752 baris) tanpa acak (*zero leakage*).
- **Berkas Model Terkompilasi (`models/avri_model.txt`):**
  - Model teks booster LightGBM berukuran kompak (711.4 KB), siap diintegrasikan ke edge / FastAPI.
- **Laporan Evaluasi Benchmark (`docs/ai/evaluation_report.json`):**
  - Metrik Model PIML: **MAE = 1.004%** (Target: $\le 3.5\%$), **RMSE = 1.272%**, **$R^2 = 0.9875$** (Target: $\ge 0.85$).
  - Baseline Aturan Statis Petani: **MAE = 6.530%**, **RMSE = 9.870%**.
  - Peningkatan Efisiensi Prediksi: **84.62% lebih akurat** dibanding aturan statis (Target Lolos: $\ge 15.0\%$).
  - Latensi Inferensi: **0.006 ms / sampel** (Target: $\le 20\text{ ms}$).
- **Modul Explainable AI & Audit TreeSHAP (`ai_engine/explainability.py`):**
  - Implementasi `shap.TreeExplainer` untuk mengekstrak kontribusi fitur ke dalam bahasa petani.
  - Sanity check tanda nilai SHAP lolos 100%: Defisit Uap Air VPD (+0.9943), Kecepatan Angin (+0.9673), Kelembaban Relatif (-0.7605), Suhu Tanah (+0.8732).
  - Ekspor grafik pembuktian dewan juri: `docs/ai/assets/shap_summary_plot.png` (181 KB) dan salinan di folder Downloads Windows.
- **Suite Pengujian Unit Training (`ai_engine/tests/test_train.py`):**
  - 3 unit test: integritas berkas model teks, pemenuhan seluruh quality gates pada report JSON, dan verifikasi grafik visualisasi SHAP.

### Diverifikasi (Verified)
- Seluruh 15 unit test lulus 100% via `pytest` (7 fisika + 5 dataset + 3 training dalam 3.34s).

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
