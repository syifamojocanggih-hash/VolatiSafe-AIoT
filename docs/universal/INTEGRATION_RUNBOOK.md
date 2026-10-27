# INTEGRATION_RUNBOOK.md — Panduan Operasional Integrasi Cabang ke `Development`

> **VOLATISAFE AIoT — SISTEM PREDIKSI RISIKO VOLATILISASI AMONIA UREA PADA JAGUNG KARST SOLOKURO**  
> **Status:** Active Standard Operating Procedure (SOP)  
> **Penanggung Jawab Integrasi:** Aris Kurniawan (Lead Architect & AI Engineer)  
> **Target Cabang Staging:** `Development`  
> **Target Cabang Rilis:** `main`

---

## 1. Filosofi & Prinsip Dasar Integrasi

Cabang `Development` adalah **lingkungan staging terintegrasi** tempat bertemunya seluruh subsistem dari 4 cabang peran (*role branches*):
* `iot` (Firmware ESP32, Wokwi, LoRa 433 MHz — PIC: Hafiiz)
* `digittal-twin` (Biofisika FAO-56, Difusi Panas Fourier, Replay BMKG — PIC: Andharu)
* `ai` (Physics-Informed ML LightGBM, TreeSHAP, AVRI Inference Service — PIC: Aris)
* `full-stack` (FastAPI Ingestion, TimescaleDB, Next.js 14 PWA — PIC: Syifa)

### Aturan Utama Integrasi:
1. **Contract-First (INTERFACES.md):** Penggabungan modul tidak boleh mengubah tanda tangan fungsi, skema JSON, atau DTO di `docs/universal/INTERFACES.md`.
2. **Urutan Sekuensial Berbasis Dependensi Data:** Merge tidak boleh dilakukan secara acak. Harus mengikuti alur aliran data dari bawah (*hardware*) ke atas (*presentation*).
3. **No Direct Push to Development:** Seluruh penggabungan dilakukan melalui prosedur merge terkontrol atau Pull Request yang telah melewati pre-flight checklist.
4. **Isolasi Kerja Terjaga:** Setelah merge ke `Development`, cabang peran masing-masing tetap bekerja di cabangnya sendiri. Jangan menyalin kode lintas cabang peran secara liar.

---

## 2. Matriks Urutan Penggabungan (Merge Sequence Matrix)

Penggabungan 4 cabang ke `Development` wajib mengikuti urutan 4 tahap berjenjang berikut:

```
[TAHAP 1: iot]           ──> [Development] : Fondasi Telemetri & Payload Kontrak
         │
[TAHAP 2: digittal-twin] ──> [Development] : Model Fisika Tanah & Failover Imputer
         │
[TAHAP 3: ai]            ──> [Development] : Otak PIML LightGBM & Explainer Service
         │
[TAHAP 4: full-stack]    ──> [Development] : Orchestrator FastAPI & Dashboard PWA
         │
         ▼
[VERIFIKASI INTEGRASI END-TO-END (L1 - L4)]
         │
         ▼
[MERGE RESMI KE main] (Final Submission / Tag v1.0.0)
```

| Tahap | Cabang Asal | PIC | Target Komponen yang Masuk | Alasan Dependensi |
|---|---|---|---|---|
| **Tahap 1** | **`iot`** | Hafiiz | `firmware/`, `simulation/wokwi/`, `docs/hardware/` | Menyediakan format biner telemetri payload 52-byte dan mock hardware Wokwi. |
| **Tahap 2** | **`digittal-twin`** | Andharu | `digital_twin/`, `simulations/data_replay/`, `docs/digital_twin/` | Bergantung pada format telemetri IoT; menyediakan estimasi kadar air $\theta$, suhu tanah $T_{soil}$, dan replay BMKG. |
| **Tahap 3** | **`ai`** | Aris | `ai_engine/`, `models/avri_model.txt`, `docs/ai/` | Bergantung pada state biofisika DT; mengompilasi model LightGBM dan layanan inferensi `predict_avri()`. |
| **Tahap 4** | **`full-stack`** | Syifa | `backend/`, `frontend/`, `docker/`, `migrations/` | Membungkus seluruh engine (IoT listener, DT updater, AI runner) ke dalam REST API, WebSocket, dan PWA Next.js. |

---

## 3. Prosedur Teknis Merge Langkah-demi-Langkah

Prosedur ini dijalankan oleh **Aris (Lead Architect)** atau PIC masing-masing cabang di bawah koordinasi Aris.

### Tahap 1: Penggabungan Cabang `iot` (Hafiiz)
Pastikan branch `iot` bersih dan unit test hardware lolos.
```bash
# 1. Masuk ke cabang Development dan tarik update terbaru
git checkout Development
git pull origin Development

# 2. Lakukan merge dari cabang iot
git merge iot --no-ff -m "merge(iot): integrate firmware ESP32, Wokwi virtual node, and telemetry contracts"

# 3. Verifikasi file yang masuk
ls -la firmware/ simulation/wokwi/ docs/hardware/

# 4. Push hasil integrasi Tahap 1
git push origin Development
```

### Tahap 2: Penggabungan Cabang `digittal-twin` (Andharu)
```bash
# 1. Pastikan berada di Development
git checkout Development
git pull origin Development

# 2. Lakukan merge dari cabang digittal-twin
git merge digittal-twin --no-ff -m "merge(digital-twin): integrate FAO-56 water balance, thermal diffusion, and BMKG replay"

# 3. Jalankan unit test Digital Twin
PYTHONPATH=. .venv/bin/pytest simulations/data_replay/test_bmkg_replay.py

# 4. Push hasil integrasi Tahap 2
git push origin Development
```

### Tahap 3: Penggabungan Cabang `ai` (Aris)
```bash
# 1. Pastikan berada di Development
git checkout Development
git pull origin Development

# 2. Lakukan merge dari cabang ai
git merge ai --no-ff -m "merge(ai): integrate PIML LightGBM engine, Arrhenius kinetics, TreeSHAP explainer, and avri model"

# 3. Jalankan suite unit test AI & Audit
PYTHONPATH=. .venv/bin/pytest ai_engine/tests/
.venv/bin/python ai_engine/audit.py

# 4. Push hasil integrasi Tahap 3
git push origin Development
```

### Tahap 4: Penggabungan Cabang `full-stack` (Syifa)
```bash
# 1. Pastikan berada di Development
git checkout Development
git pull origin Development

# 2. Lakukan merge dari cabang full-stack
git merge full-stack --no-ff -m "merge(full-stack): integrate FastAPI orchestrator, TimescaleDB ingestion, and Next.js 14 PWA"

# 3. Verifikasi build frontend & dependensi backend
cd frontend && npm run build && cd ..
docker compose -f docker/docker-compose.yml config

# 4. Push hasil integrasi Tahap 4
git push origin Development
```

---

## 4. Protokol Resolusi Konflik (Conflict Resolution)

Saat merge ke `Development`, potensi konflik paling umum terjadi pada 3 file bersama (*shared root files*):

### A. Konflik pada `AGENTS.md`
* **Penyebab:** Tiap cabang menambahkan riwayat aturan atau catatan lokal.
* **Strategi Resolusi:** Pertahankan seluruh aturan isolasi cabang dan konvensi commit bahasa Inggris. Ambil gabungan aturan paling lengkap (*union merge*), jangan hapus aturan strict branch isolation.

### B. Konflik pada `.gitignore`
* **Penyebab:** Penambahan dependensi baru dari sisi Python (`.venv/`, `data/`, `__pycache__/`) dan Frontend (`node_modules/`, `.next/`).
* **Strategi Resolusi:** Gunakan aturan gabungan komprehensif:
  ```gitignore
  # Python & Virtualenv
  .venv/
  __pycache__/
  *.py[cod]
  .pytest_cache/
  data/*.csv
  !simulations/data_replay/datasets/bmkg_lamongan.csv

  # Node & Next.js
  frontend/node_modules/
  frontend/.next/
  frontend/out/
  frontend/.env.local

  # Docker & Database
  docker/postgres_data/
  docker/mosquitto_data/
  ```

### C. Konflik pada `docs/universal/INTERFACES.md`
* **Penyebab:** Perbedaan penamaan DTO atau endpoint.
* **Strategi Resolusi:** **DILARANG MERUBAH SECARA SEPIHAK**. Kembalikan (*revert*) ke versi yang telah disepakati di branch `ai` yang dipimpin Aris.

---

## 5. Prosedur Uji Asap Integrasi End-to-End (Smoke Test Suite)

Setelah seluruh cabang tergabung di `Development`, jalankan 3 skenario verifikasi sebelum rilis ke `main`:

### Skenario 1: Aliran Normal Cuaca Terik Siang (Skenario A)
* **Aksi:** Jalankan Wokwi dengan input Suhu 35.2°C, Lembap 19.0%, pH 7.62.
* **Tolak Ukur:**
  1. MQTT Broker menerima paket 13-byte / 52-byte di topik `/volatisafe/v1/node/+/telemetry`.
  2. Ingestion adapter mendekompresi dan menyimpannya ke TimescaleDB.
  3. Digital Twin mencatat $ET_c$ harian naik dan menurunkan kelembaban tanah.
  4. AI Engine menghasilkan AVRI $\approx 78\%$ (Kategori: **Kritis / Bahaya**).
  5. Dashboard Next.js menampilkan banner status Merah / Oranye dan rekomendasi *"TUNDA PEMUPUKAN"*.

### Skenario 2: Presipitasi Hujan Petir (Skenario B - Safe Window Open)
* **Aksi:** Injeksikan curah hujan 22 mm pada simulator.
* **Tolak Ukur:**
  1. Digital Twin menaikkan kelembaban tanah ke $\ge 38\%$.
  2. AI Engine menurunkan skor AVRI seketika ke $< 20\%$ (Kategori: **Aman**).
  3. Safe Application Window Forecaster membuka jendela hijau *"SEBAR PUPUK SEKARANG"*.

### Skenario 3: Sensor Dropout 6 Jam (Skenario C - Failover Digital Twin)
* **Aksi:** Hentikan transmisi Wokwi (simulasi radio LoRa putus).
* **Tolak Ukur:**
  1. Modul `state_imputer.py` aktif otomatis setelah 30 menit tanpa data.
  2. Backend menandai flag `is_predicted = true` pada DTO telemetri.
  3. Dashboard menampilkan garis putus-putus dengan indikator akurasi estimasi $\approx 92\%$.
  4. Backend dan AI tidak mengalami crash (*zero 500 internal server error*).

---

## 6. Rilis Final ke Cabang `main`

Jika seluruh checklist dan 3 skenario di atas lulus 100%:
```bash
git checkout main
git pull origin main
git merge Development --no-ff -m "chore(release): v1.0.0 - official competition submission for DeepTech FoodTech 2026"
git tag -a v1.0.0 -m "Release v1.0.0: VolatiSafe AIoT TKT-3 Production Prototype"
git push origin main --tags
```
