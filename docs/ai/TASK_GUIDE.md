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
  - **Penyelarasan Baseline Empiris Solokuro:** Menggunakan batas retensi tanah terkalibrasi lokal ($\theta_{fc} = 36.5\%$, $\theta_{wp} = 14.2\%$, pH baseline $7.62$ hasil uji lab Agroteknika 2024, serta reduksi kapasitas simpan air efektif akibat fraksi kerikil kapur/coarse fragments $12\%$).
- **Checklist:**
  - [ ] Membaca dataset iklim historis Lamongan (`datasets/bmkg_lamongan.csv`).
  - [ ] Skrip verifikasi kebocoran waktu (`leakage_test`) menghasilkan 0% overlap antara train dan test set.
  - [ ] Seluruh fitur numerik distandarisasi tanpa menggunakan statistik test set (*no fit_transform on validation set*).

---

### TAHAP 3: Pelatihan Model Residual LightGBM & SOP Eksekusi Training

#### 🟢 AI-1.3: Training LightGBM dengan Monotone Constraints
- **Deskripsi:** Melatih model gradient boosting yang mempelajari deviasi lokal (*residual*) di atas model fisika dasar, dengan batasan arah kurva monoton.
- **Target File:** `ai_engine/train.py`
- **Konfigurasi Parameter Inti:**
  - `monotone_constraints`:
    - `soil_temp_c`: `+1` (Makin panas tanah, risiko WAJIB naik).
    - `moisture_pct`: `-1` (Makin lembap tanah, risiko WAJIB turun).
    - `ph`: `+1` (Makin basa/berkapur tanah, risiko WAJIB naik).
  - Objective: `regression_l1` (MAE) atau `huber`.
  - Hyperparameters: `n_estimators=300`, `learning_rate=0.03`, `num_leaves=31`, `max_depth=6`, `min_child_samples=20`.

---

### 🚀 PROSEDUR OPERASIONAL STANDAR (SOP) TRAINING MODEL LANGKAH-DEMI-LANGKAH

Berikut adalah instruksi langkah-demi-langkah yang wajib dieksekusi oleh AI Developer / Coding Agent untuk melatih model dari awal hingga terkompilasi:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ALUR 8 LANGKAH TRAINING MODEL AI                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. SETUP ENV     : Instalasi dependencies (lightgbm, shap, scikit-learn)   │
│ 2. BUILD DATASET : Generate fitur dari BMKG Lamongan + fisika urease        │
│ 3. TIME SPLIT    : 80% train awal / 20% validation out-of-time (no shuffle) │
│ 4. BASE RESIDUAL : Hitung BaseLoss_physics & ekstrak target residual        │
│ 5. FIT MODEL     : Latih LightGBM dengan monotone constraints               │
│ 6. BENCHMARK     : Uji evaluasi MAE, RMSE vs baseline if-else (> 15% better)│
│ 7. SHAP AUDIT    : Hitung TreeSHAP & simpan visualisasi summary plot        │
│ 8. SERIALIZE     : Ekspor model teks ke models/avri_model.txt (~2 MB)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Langkah 1: Setup Lingkungan & Instalasi Dependensi
Jalankan di terminal lokal (atau virtual environment proyek):
```bash
cd /home/aris/projek/VolatiSafe-AIoT
pip install lightgbm scikit-learn shap pandas numpy matplotlib
```

#### Langkah 2: Ekstraksi & Pembangunan Dataset Latih
Jalankan skrip generator dataset yang menyerap cuaca Lamongan dan menjalankan rumus fisika tanah karst terkalibrasi lokal:
```bash
python ai_engine/dataset_builder.py \
  --weather-source simulations/data_replay/datasets/bmkg_lamongan.csv \
  --soil-profile karst_lamongan \
  --output data/training_dataset_lamongan.csv
```
*Output:* File CSV tabular berisi kolom: `[timestamp, soil_temp_c, moisture_pct, ph, air_temp_c, humidity_rh, wind_speed_ms, solar_rad_mj, dat, base_physics_loss, true_loss_target]` dengan batas $\theta_{fc} = 36.5\%$, $\theta_{wp} = 14.2\%$, dan pH baseline $7.62$.

#### Langkah 3: Eksekusi Skrip Pelatihan (Training Execution)
Jalankan skrip training utama:
```bash
python ai_engine/train.py \
  --dataset data/training_dataset_lamongan.csv \
  --split-ratio 0.80 \
  --model-out models/avri_model.txt \
  --report-out docs/ai/evaluation_report.json
```

#### Langkah 4: Evaluasi Metrik & Benchmark terhadap Baseline Statis
Di dalam `train.py`, model otomatis diuji pada data holdout (20% akhir) dan dibandingkan dengan aturan statis:
1. **Model PIML LightGBM:** Target MAE $\le 3.5\%$ dan $R^2 \ge 0.85$.
2. **Baseline Aturan Statis (*if-else*):**
   ```python
   # Aturan petani konvensional
   if soil_temp > 30.0 and moisture < 24.0 and ph > 7.4:
       baseline_pred = 70.0
   else:
       baseline_pred = 20.0
   ```
3. **Syarat Lolos Gate:** Penurunan MAE model PIML harus **minimal 15% lebih rendah** daripada MAE aturan statis.

#### Langkah 5: Audit TreeSHAP & Ekspor Gambar Grafis
Jalankan audit explainability untuk menghasilkan plot pembuktian ke juri:
```bash
python ai_engine/explainability.py \
  --model models/avri_model.txt \
  --dataset data/training_dataset_lamongan.csv \
  --output-plot docs/ai/assets/shap_summary_plot.png
```
*Verifikasi Tanda:*
* Suhu tanah $> 30^\circ\text{C}$ $\rightarrow$ SHAP bernilai positif (+).
* Kelembaban $> 35\%$ $\rightarrow$ SHAP bernilai negatif (-).
* pH basa $> 7.5$ $\rightarrow$ SHAP bernilai positif (+).

#### Langkah 6: Verifikasi Model Binary / Text
Pastikan file artifak model telah tercipta dan siap dipanggil:
```bash
ls -lh models/avri_model.txt
# Ukuran berkas harus berkisar antara 1.5 MB s.d 3.0 MB
```

---

### TAHAP 4: Formulasi AVRI & Klasifikasi Risiko

#### 🟢 AI-1.4: Formulasi Skor AVRI (0–100%) & Threshold 4 Tingkat
- **Deskripsi:** Mengintegrasikan keluaran lapisan fisika dan prediksi residual ML menjadi skor akhir *Ammonia Volatilization Risk Index* (AVRI).
- **Target File:** `ai_engine/inference.py`
- **Formula:**
  $$AVRI = \text{clip}\Big(\text{BaseLoss}_{physics} + \text{Residual}_{LightGBM}, \; 0.0, \; 100.0\Big)$$
  - `0.0 – 30.0%`: **Aman** (Hijau) $
ightarrow$ Rekomendasi: Sebar pupuk sekarang.
  - `30.1 – 60.0%`: **Waspada** (Kuning) $
ightarrow$ Rekomendasi: Wajib metode tugal/benam atau siram sebelum tebar.
  - `60.1 – 80.0%`: **Kritis** (Oranye) $
ightarrow$ Rekomendasi: Tunda aplikasi, tunggu jendela aman sore/besok.
  - `80.1 – 100.0%`: **Bahaya** (Merah) $
ightarrow$ Rekomendasi: DILARANG TEBAR (kehilangan amonia >80%).
- **Sinkronisasi Skala Waktu Operasional:**
  - *Jangka Pendek (0–72 Jam):* Peramalan jendela jam aman aplikasi pupuk dievaluasi harian setiap pukul 05:30 WIB.
  - *Jangka Panjang (0–105 HST):* Estimasi kalender fenologi dan fase panen jagung berbasis akumulasi panas GDD (*Growing Degree Days*).
- **Checklist:**
  - [ ] Nilai AVRI terbukti tidak pernah keluar dari rentang matematis $[0.0, 100.0]$.

---

### TAHAP 5: Explainable AI & Verifikasi TreeSHAP

#### 🟢 AI-1.5: Perhitungan TreeSHAP & Sanity Check Arah Dampak
- **Deskripsi:** Menghitung kontribusi tiap fitur menggunakan `shap.TreeExplainer` untuk disajikan ke petani dan juri sebagai bukti transparansi AI.
- **Target File:** `ai_engine/explainability.py`
- **Checklist:**
  - [ ] Sanity check tanda nilai SHAP lolos 100%.
  - [ ] Format output teks narasi: *"Pemicu risiko dominan: Suhu tanah 34.2°C (+45% dampak risiko)"*.

---

### TAHAP 6: Serialisasi Model & Ekspor Service Interface

#### 🟢 AI-1.6: Service Wrapper & DTO Compliance
- **Deskripsi:** Menyediakan modul pemanggil inferensi terpadu yang siap diimpor oleh backend FastAPI milik Syifa, terhubung dengan kontrak endpoint 15 parameter Digital Twin (`GET /api/v1/digital-twin/telemetry/{field_id}`).
- **Target File:** `ai_engine/service.py`, `models/avri_model.txt`
- **Signature Kontrak:**
  ```python
  def predict_avri(features: FeatureVectorDTO) -> PredictionResultDTO: ...
  ```
- **Checklist:**
  - [ ] 100% mematuhi DTO di [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §2.
  - [ ] Tidak ada dependensi database di dalam `ai_engine/`.

---

## 🚀 Skenario & Prosedur Merge ke Cabang `Development` (Tahap 3)

Cabang `ai` diintegrasikan pada **Tahap 3**, setelah fondasi `iot` dan `digittal-twin` stabil di `Development`. Aris wajib memastikan:

### Checklist Pra-Merge Aris:
- [ ] Model LightGBM terkompilasi di `models/avri_model.txt` (~719 KB) dan lolos benchmark ($MAE \le 3.5\%$, $R^2 \ge 0.85$, $Latency \le 20\text{ ms}$).
- [ ] TreeSHAP direction check lolos 100% (VPD +, Angin +, RH -, Suhu +).
- [ ] Audit bias sistematik dan uji monotoni fisika lulus 100% via `ai_engine/audit.py`.
- [ ] Service wrapper `ai_engine/service.py` 100% patuh DTO `docs/universal/INTERFACES.md` §2.
- [ ] Seluruh 23 unit test di `ai_engine/tests/` berstatus **23 passed**.
- [ ] Tidak ada modifikasi file di luar area `ai_engine/`, `models/`, `docs/ai/`, dan `docs/universal/`.

### Prosedur Git Terminal:
```bash
# 1. Pastikan seluruh pekerjaan di commit di cabang ai
git checkout ai
git status

# 2. Jalankan test suite & audit komprehensif
PYTHONPATH=. .venv/bin/pytest ai_engine/tests/
.venv/bin/python ai_engine/audit.py

# 3. Eksekusi merge ke Development (Tahap 3)
git checkout Development
git pull origin Development
git merge ai --no-ff -m "merge(ai): integrate PIML LightGBM engine, Arrhenius kinetics, TreeSHAP explainer, and avri model"
git push origin Development
```

---

## 🚫 Zona Terlarang Aris (AI Domain)
1. ❌ DILARANG membuka koneksi database langsung (`psycopg2`, `SQLAlchemy`, dsb).
2. ❌ DILARANG mengubah implementasi internal firmware ESP32 atau styling frontend secara sepihak di luar perjanjian kontrak `INTERFACES.md`.
