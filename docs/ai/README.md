# DOMAIN 3: AI ENGINE & MACHINE LEARNING — README.md

> **PENANGGUNG JAWAB TEKNIS:** Aris Kurniawan (Aris / Lead) — *AI Engineer, System Architect, & AI Quality Auditor*  
> **AREA AKSES PENUH (R/W):** `ai_engine/`, `models/`, `docs/ai/`, `docs/universal/`  
> **CABANG GIT RESMI:** `ai`
> **KONTRAK DATA:** [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §2 (FeatureVectorDTO & PredictionResultDTO)  
> **DOMAIN DIGITAL TWIN:** Untuk spesifikasi biofisika tanah & FAO-56 yang dikelola Andharu, lihat [`docs/digital_twin/README.md`](../digital_twin/README.md)  

---

## 1. Mandat & Ruang Lingkup Kerja

Aris bertanggung jawab penuh atas arsitektur sistem menyeluruh, penjaminan integritas sains data, dan model kecerdasan buatan VolatiSafe AIoT:
- **Physics-Informed Machine Learning (PIML):** Mengintegrasikan kinetika kimia Arrhenius degradasi enzim urease dengan algoritma regresi LightGBM.
- **Formulasi Skor AVRI (0–100%):** Menghitung indeks risiko volatilisasi amonia dan klasifikasi 4-tingkat preskripsi tindakan petani.
- **Explainable AI (TreeSHAP):** Menerjemahkan bobot matematis fitur ke dalam bahasa penjelasan yang dimengerti petani dan juri.
- **AI Quality Auditor:** Menjaga agar tidak terjadi kebocoran data deret waktu (*time-series data leakage*) dan memastikan kepatuhan batas termodinamika.

---

## 2. Peta Navigasi Dokumentasi AI Engine

```
docs/ai/
├── README.md               <-- Dokumen ini (Master Index, Mandat & Batasan AI)
├── TASK_GUIDE.md           <-- Panduan langkah demi langkah implementasi tugas Aris
├── CHANGELOG.md            <-- Riwayat rilis, task, dan audit pengujian pilar AI
├── MODEL_SPEC.md           <-- Spesifikasi teknis arsitektur PIML LightGBM & formula AVRI
├── EXPLAINABILITY_SHAP.md  <-- Kalkulasi TreeSHAP & pemetaan teks narasi petani
└── MOCK_PREDICTOR.md       <-- Skrip mock predictor terisolasi untuk pengujian backend
```

---

## 3. Matriks Batasan Wewenang (Boundary Matrix)

| Atribut | Ketetapan |
|---|---|
| **Area Boleh Ditulis (R/W)** | `ai_engine/`, `models/`, `docs/ai/`, `docs/universal/` |
| **Output Resmi** | Model PIML terlatih (`models/avri_model.txt`) dan modul inferensi callable `predict_avri(features: FeatureVectorDTO) -> PredictionResultDTO`. |
| **Zona Terlarang (DILARANG KERAS)** | ❌ DILARANG membuka koneksi database langsung (`psycopg2`, `SQLAlchemy`, dsb). AI menerima data bersih via argumen DTO.<br>❌ DILARANG membuat server HTTP publik sendiri.<br>❌ DILARANG mengubah implementasi internal firmware ESP32 atau styling frontend secara sepihak. |

---

## 4. Titik Kontak & Kontrak Antarmuka
AI Engine menerima fitur lingkungan dari Backend & Digital Twin:
- Input: `FeatureVectorDTO` (Suhu tanah, kelembaban, pH, suhu udara, radiasi, angin, hujan 6 jam, DAT).
- Output: `PredictionResultDTO` (AVRI score, risk category, shap values dictionary).
