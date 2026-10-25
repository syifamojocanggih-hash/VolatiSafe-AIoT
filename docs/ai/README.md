# DOMAIN 2: AGRO-CLIMATIC DIGITAL TWIN & AI ENGINE — README.md

> **PENANGGUNG JAWAB TEKNIS:**
> 1. **Andharu Raffi (Andharu):** *Digital Twin Engineer* — Area: `digital_twin/`, `simulations/data_replay/`, `docs/ai/DIGITAL_TWIN.md` (Cabang: `feat/dt-*`)
> 2. **Aris Kurniawan (Aris / Lead):** *AI Engineer & System Architect* — Area: `ai_engine/`, `models/`, `docs/ai/MODEL_SPEC.md`, `EXPLAINABILITY_SHAP.md`, `MOCK_PREDICTOR.md`, dan seluruh `docs/universal/` (Cabang: `feat/ai-*`)

---

## 1. Mandat & Pembagian Ruang Lingkup Kerja

Domain kecerdasan analitik dibagi menjadi dua sub-spesialisasi yang saling melengkapi:

### A. Sub-Domain Digital Twin (PIC: Andharu)
- Pemodelan neraca air tanah perakaran kontinu berbasis standar agronomi internasional FAO-56 Penman-Monteith ($ET_0$).
- Model difusi termal tanah teredam (*damped*) dan algoritma imputasi saat sensor *offline* (`[Est-Simulated]`).
- Skrip pemutaran ulang (*replay*) data klimatologi historis BMKG Stasiun Meteorologi Lampung.

### B. Sub-Domain AI Engine & Machine Learning (PIC: Aris)
- Formulasi kinetika kimia enzimatik hidrolisis urease (Arrhenius kinetics).
- Model *Physics-Informed ML* (PIML) LightGBM Regressor untuk estimasi skor AVRI (0–100%).
- Penjelasan kontribusi fitur berbasis TreeSHAP untuk diterjemahkan ke bahasa petani.
- Penjaminan mutu kontrak data global (`INTERFACES.md`, `BOUNDARIES_AND_CONTRACTS.md`, `DECISIONS.md`).

### File & Direktori yang Dimiliki (Boleh Ditulis):
- `digital_twin/` (Dikelola Andharu: Persamaan FAO-56, neraca kelembaban, dan imputasi state)
- `simulations/data_replay/` (Dikelola Andharu: Ingestion dataset cuaca historis BMKG)
- `ai_engine/` (Dikelola Aris: Kode training, evaluasi, inferensi, dan pipeline PIML)
- `models/` (Dikelola Aris: File model terkompilasi `.txt` LightGBM atau `.onnx`)
- `docs/ai/` (Dikelola bersama sesuai sub-spesialisasi)

---

## 2. Zona Terlarang & Batasan Ketat (*Invariant Rules*)

Untuk mencegah benturan dengan tim backend dan frontend:
1. ❌ **Dilarang Query Database Langsung:** Modul AI tidak boleh membuat koneksi langsung ke PostgreSQL/TimescaleDB. Data telemetri dan cuaca disuplai oleh Backend via argumen DTO `PredictRiskRequestDTO`.
2. ❌ **Dilarang Mengekspos HTTP Server Mandiri:** Jangan membuat server FastAPI/Flask terpisah di dalam folder `ai_engine/`. AI diekspos sebagai modul Python murni (*callable class/function*) yang diimpor oleh Backend Service.
3. ❌ **Wajib Mematuhi Kontrak DTO:** Output inferensi wajib mengembalikan struktur persis sesuai `PredictRiskResponseDTO` di [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §2.2.
4. ❌ **Wajib Menjaga Konsistensi Termodinamika:** Model AI dilarang menghasilkan prediksi yang bertentangan dengan hukum kinetika kimia (pembatas fisika urease aktif).

---

## 3. Indeks Dokumen AI Engine

1. [`DIGITAL_TWIN.md`](DIGITAL_TWIN.md): Formulasi neraca air tanah FAO-56 Penman-Monteith dan mekanisme imputasi failover.
2. [`MODEL_SPEC.md`](MODEL_SPEC.md): Arsitektur PIML LightGBM, laju hidrolisis urease, dan metrik evaluasi model.
3. [`EXPLAINABILITY_SHAP.md`](EXPLAINABILITY_SHAP.md): Pipeline TreeSHAP dan pemetaan narasi rekomendasi praktis untuk petani.
4. [`MOCK_PREDICTOR.md`](MOCK_PREDICTOR.md): Script mock predictor dan test vector deterministik untuk isolasi backend.
