# DOMAIN 2: AGRO-CLIMATIC DIGITAL TWIN & AI ENGINE — README.md

> **PANDUAN KHUSUS UNTUK AI & DIGITAL TWIN AI AGENT**

---

## 1. Mandat & Ruang Lingkup Kerja

AI & Digital Twin Agent bertanggung jawab atas seluruh kecerdasan analitik sistem:
- Pemodelan neraca air tanah kontinu berbasis standar agronomi internasional FAO-56.
- Model difusi termal tanah dan algoritma imputasi saat sensor offline (*failover*).
- Formulasi kinetika kimia enzimatik hidrolisis urease (Arrhenius kinetics).
- Model *Physics-Informed ML* (PIML) LightGBM Regressor untuk estimasi skor AVRI (0–100%).
- Penjelasan kontribusi fitur berbasis TreeSHAP untuk diterjemahkan ke bahasa petani.

### File & Direktori yang Dimiliki (Boleh Ditulis):
- `ai_engine/` (Kode training, evaluasi, inferensi, dan pipeline PIML)
- `digital_twin/` (Persamaan FAO-56, neraca kelembaban, dan imputasi state)
- `models/` (File model terkompilasi `.txt` LightGBM atau `.onnx`)
- `docs/ai/` (Seluruh dokumen teknis AI di folder ini)

---

## 2. Zona Terlarang & Batasan Ketat (*Invariant Rules*)

Untuk mencegah benturan dengan tim backend dan frontend:
1. ❌ **Dilarang Query Database Langsung:** Modul AI tidak boleh membuat koneksi langsung ke PostgreSQL/TimescaleDB. Data telemetri dan cuaca disuplai oleh Backend via argumen DTO `PredictRiskRequestDTO`.
2. ❌ **Dilarang Mengekspos HTTP Server Mandiri:** Jangan membuat server FastAPI/Flask terpisah di dalam folder `ai_engine/`. AI diekspos sebagai modul Python murni (*callable class/function*) yang diimpor oleh Backend Service.
3. ❌ **Wajib Mematuhi Kontrak DTO:** Output inferensi wajib mengembalikan struktur persis sesuai `PredictRiskResponseDTO` di [`docs/universal/INTERFACES.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/universal/INTERFACES.md) §2.2.
4. ❌ **Wajib Menjaga Konsistensi Termodinamika:** Model AI dilarang menghasilkan prediksi yang bertentangan dengan hukum kinetika kimia (pembatas fisika urease aktif).

---

## 3. Indeks Dokumen AI Engine

1. [`DIGITAL_TWIN.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/ai/DIGITAL_TWIN.md): Formulasi neraca air tanah FAO-56 Penman-Monteith dan mekanisme imputasi failover.
2. [`MODEL_SPEC.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/ai/MODEL_SPEC.md): Arsitektur PIML LightGBM, laju hidrolisis urease, dan metrik evaluasi model.
3. [`EXPLAINABILITY_SHAP.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/ai/EXPLAINABILITY_SHAP.md): Pipeline TreeSHAP dan pemetaan narasi rekomendasi praktis untuk petani.
4. [`MOCK_PREDICTOR.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/ai/MOCK_PREDICTOR.md): Script mock predictor dan test vector deterministik untuk isolasi backend.
