# TASK_GUIDE.md — AI Engine & Machine Learning (Aris)

> **PENANGGUNG JAWAB:** Aris Kurniawan (Aris / Lead)  
> **ROLE:** *AI Engineer, System Architect, & AI Quality Auditor*  
> **AREA KERJA (R/W):** `ai_engine/`, `models/`, `docs/ai/`, `docs/universal/`  
> **CABANG GIT:** `ai`
> **KONTRAK DATA:** [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §2 (FeatureVectorDTO & PredictionResultDTO)  
> **INTEGRASI DIGITAL TWIN:** Menghubungkan output dari domain [`docs/digital_twin/`](../digital_twin/README.md) (Andharu)  

---

## 🎯 Target Utama Domain AI Engine
Membangun model *Physics-Informed Machine Learning (PIML)* yang menggabungkan formulasi kinetika kimia degradasi enzim urease (Persamaan Arrhenius) dengan algoritma regresi **LightGBM** untuk menghasilkan skor *Ammonia Volatilization Risk Index* (AVRI 0–100%), menetapkan klasifikasi risiko pemupukan 4-tingkat (Aman/Waspada/Kritis/Bahaya), serta menghasilkan atribusi faktor dominan berbasis TreeSHAP tanpa kebocoran data deret waktu (*zero data leakage*).

---

## 📋 Daftar Tugas & Tahapan Implementasi

### TAHAP 1: Lapisan Fisika & Kinetika Reaksi Kimia

#### 🟢 AI-1.1: Physics-Informed Urease Kinetics Layer
- **Deskripsi:** Membangun modul perhitungan laju reaksi kimia hidrolisis urea berbasis hukum kinetika Arrhenius dan fungsi deplesi kelembaban Michaelis-Menten.
- **Target File:** `ai_engine/physics_layer.py`
- **Formula Acuan ([`docs/ai/MODEL_SPEC.md`](MODEL_SPEC.md) §2):**
  $$k_{urease}(T) = A \cdot \exp\left(-\frac{E_a}{R(T + 273.15)}\right)$$
  $$\text{BaseLoss} = k_{urease}(T_{soil}) \cdot \left(\frac{\theta}{\theta + K_m}\right) \cdot \text{Sigmoid}(pH - 7.0)$$
- **Checklist:**
  - [ ] Konstanta ilmiah valid: $E_a = 51.000\text{ J/mol}$ dan $R = 8.314\text{ J/(mol}\cdot\text{K)}$.
  - [ ] Output laju dasar $\text{BaseLoss}$ selalu non-negatif dan dibatasi secara termodinamika.

---

### TAHAP 2: Pembentukan Dataset & Pencegahan Kebocoran Waktu

#### 🟢 AI-1.2: Anti-Leakage Dataset Builder & TimeSeriesSplit
- **Deskripsi:** Menyiapkan pipeline penggabungan data sensor fisik/Wokwi, state Digital Twin (`FieldStateDTO`), dan data cuaca historis BMKG Wilayah Lamongan (Stasiun BMKG Tuban/Lamongan Utara) menjadi matriks fitur tabular bebas kebocoran waktu.
- **Target File:** `ai_engine/dataset_builder.py`
- **Aturan Audit Ketat:**
  - **DILARANG KERAS MENGGUNAKAN `train_test_split(shuffle=True)`**.
  - Wajib menggunakan `TimeSeriesSplit(n_splits=5)` atau *Block Out-of-Time Holdout* (8 bulan awal untuk training, 2 bulan akhir untuk testing).
- **Checklist:**
  - [ ] Membaca dataset iklim historis Lamongan (`datasets/bmkg_lamongan.csv`).
  - [ ] Skrip verifikasi kebocoran waktu (`leakage_test`) menghasilkan 0% overlap antara train dan test set.
  - [ ] Seluruh fitur numerik distandarisasi tanpa menggunakan statistik test set (*no fit_transform on validation set*).

---

### TAHAP 3: Pelatihan Model Residual LightGBM

#### 🟢 AI-1.3: Training LightGBM dengan Monotone Constraints
- **Deskripsi:** Melatih model gradient boosting yang mempelajari deviasi lokal (*residual*) di atas model fisika dasar, dengan batasan arah kurva monoton.
- **Target File:** `ai_engine/train.py`
- **Konfigurasi Parameter:**
  - `monotone_constraints`:
    - `soil_temp_c`: `+1` (Makin panas tanah, risiko WAJIB naik).
    - `moisture_pct`: `-1` (Makin lembap tanah, risiko WAJIB turun).
    - `ph`: `+1` (Makin basa/berkapur tanah, risiko WAJIB naik).
  - Objective: `regression_l1` (MAE) atau `huber`.
- **Checklist:**
  - [ ] Model berhasil mengalahkan baseline aturan statis (*if-else*) minimal 15% pada evaluasi out-of-time.
  - [ ] Latensi inferensi model tunggal $\le 20\text{ milidetik}$ di CPU.

---

### TAHAP 4: Formulasi AVRI & Klasifikasi Risiko

#### 🟢 AI-1.4: Formulasi Skor AVRI (0–100%) & Threshold 4 Tingkat
- **Deskripsi:** Mengintegrasikan keluaran lapisan fisika dan prediksi residual ML menjadi skor akhir *Ammonia Volatilization Risk Index* (AVRI).
- **Target File:** `ai_engine/inference.py`
- **Formula:**
  $$AVRI = \text{clip}\Big(\text{BaseLoss}_{physics} + \text{Residual}_{LightGBM}, \; 0.0, \; 100.0\Big)$$
  - `0.0 – 30.0%`: **Aman** (Hijau) $\rightarrow$ Rekomendasi: Sebar merata sekarang.
  - `30.1 – 60.0%`: **Waspada** (Kuning) $\rightarrow$ Rekomendasi: Wajib metode tugal/benam atau siram sebelum tebar.
  - `60.1 – 80.0%`: **Kritis** (Oranye) $\rightarrow$ Rekomendasi: Tunda aplikasi, tunggu jendela aman sore/besok.
  - `80.1 – 100.0%`: **Bahaya** (Merah) $\rightarrow$ Rekomendasi: DILARANG TEBAR (kehilangan amonia >80%).
- **Checklist:**
  - [ ] Nilai AVRI terbukti tidak pernah keluar dari rentang matematis $[0.0, 100.0]$.

---

### TAHAP 5: Explainable AI & Verifikasi TreeSHAP

#### 🟢 AI-1.5: Perhitungan TreeSHAP & Sanity Check Arah Dampak
- **Deskripsi:** Menghitung kontribusi tiap fitur menggunakan `shap.TreeExplainer` untuk disajikan ke petani dan juri sebagai bukti transparansi AI.
- **Target File:** `ai_engine/explainability.py`
- **Sanity Check Tanda Nilai Dampak SHAP:**
  - [ ] Suhu tanah tinggi ($> 30^\circ\text{C}$) $\rightarrow$ SHAP bernilai **POSITIF** (+ menambah risiko).
  - [ ] Kelembaban tanah tinggi ($> 35\%$) $\rightarrow$ SHAP bernilai **NEGATIF** (- meredam risiko).
  - [ ] pH basa ($> 7.5$) $\rightarrow$ SHAP bernilai **POSITIF** (+ memicu amonia).
  - [ ] Format output teks narasi: *"Pemicu risiko dominan: Suhu tanah 34.2°C (+45% dampak risiko)"*.

---

### TAHAP 6: Serialisasi Model & Ekspor Service Interface

#### 🟢 AI-1.6: Service Wrapper & DTO Compliance
- **Deskripsi:** Menyediakan modul pemanggil inferensi terpadu yang siap diimpor oleh backend FastAPI milik Syifa.
- **Target File:** `ai_engine/service.py`, `models/avri_model.txt`
- **Signature Kontrak:**
  ```python
  def predict_avri(features: FeatureVectorDTO) -> PredictionResultDTO: ...
  ```
- **Checklist:**
  - [ ] 100% mematuhi DTO di [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §2.
  - [ ] Tidak ada dependensi database di dalam `ai_engine/`.

---

## 🚫 Zona Terlarang Aris (AI Domain)
1. ❌ DILARANG membuka koneksi database langsung (`psycopg2`, `SQLAlchemy`, dsb).
2. ❌ DILARANG mengubah implementasi internal firmware ESP32 atau styling frontend secara sepihak di luar perjanjian kontrak `INTERFACES.md`.
