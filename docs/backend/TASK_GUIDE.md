# TASK_GUIDE.md — Backend Services, Ingestion & DB (Syifa)

> **PENANGGUNG JAWAB:** Syifa (Syifa)  
> **ROLE:** *Fullstack Developer (Backend Services & Ingestion)*  
> **AREA KERJA (R/W):** `backend/`, `migrations/`, `docker/`, `docs/backend/`  
> **CABANG GIT:** `full-stack`
> **KONTRAK DATA:** [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §0, §1, §2, §3  

---

## 🎯 Target Utama Domain Backend
Membangun orkestrator sentral berbasis **FastAPI** dan **TimescaleDB** yang mampu menerima streaming paket telemetri dari broker MQTT (Wokwi/Gateway), menerjemahkan paket LoRa via *Anti-Corruption Adapter*, memicu inferensi model AI (PIML), menyediakan REST API & WebSocket live stream ke Frontend, serta menembakkan notifikasi peringatan dini ke WhatsApp dan Telegram petani.

---

## 📋 Daftar Tugas & Tahapan Implementasi

### TAHAP 1: Setup Lingkungan & Arsitektur Proyek

#### 🟢 BE-1.1: Setup FastAPI Project Structure
- **Deskripsi:** Menginisialisasi arsitektur modular FastAPI dengan dependency injection dan pydantic v2.
- **Target Folder/File:**
  - `backend/app/main.py` (entry point FastAPI, CORS, middleware, lifecycle events)
  - `backend/app/core/config.py` (Pydantic Settings: DB URL, MQTT host, WhatsApp API token)
  - `backend/app/schemas/` (Pydantic DTO request/response sesuai `INTERFACES.md`)
  - `backend/app/models/` (SQLAlchemy 2.0 ORM models)
  - `backend/app/routers/` (APIRouters untuk nodes, fields, crop-cycles, fertilizer, simulation)
  - `backend/app/services/` (Business logic, AI caller, Digital Twin state manager)
  - `backend/requirements.txt` (`fastapi`, `uvicorn`, `sqlalchemy`, `asyncpg`, `paho-mqtt`, `alembic`, `pydantic-settings`)
- **Checklist:**
  - [ ] `uvicorn app.main:app --reload` berjalan mulus di `http://localhost:8000`.
  - [ ] Health check endpoint `GET /api/v1/health` mengembalikan `{ "status": "healthy" }`.

#### 🟢 BE-1.2: Setup Docker Compose (TimescaleDB & Mosquitto)
- **Deskripsi:** Menyiapkan konfigurasi kontainer lokal untuk database deret waktu dan broker MQTT.
- **Target File:** `docker/docker-compose.yml`, `docker/mosquitto.conf`
- **Spesifikasi:**
  - Image DB: `timescale/timescaledb:latest-pg16` (Port 5432).
  - Image MQTT: `eclipse-mosquitto:2` (Port 1883).
- **Checklist:**
  - [ ] `docker compose -f docker/docker-compose.yml up -d` berjalan tanpa konflik port.
  - [ ] Ekstensi `timescaledb` aktif otomatis di PostgreSQL.

---

### TAHAP 2: Pemodelan Data & Migrasi Database

#### 🟢 BE-1.3: Skema Database & Migrasi Alembic
- **Deskripsi:** Mengimplementasikan tabel relasional dan hypertable deret waktu sesuai acuan [`docs/backend/DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md).
- **Target File:** `backend/app/models/`, `migrations/versions/`
- **Tabel yang Wajib Dibuat:**
  1. `nodes`: Data master node sensor fisik/virtual (ID, petak, baterai, last_seen).
  2. `telemetry`: **Hypertable TimescaleDB** (timestamp, node_id, moisture, soil_temp, ph, battery_v, is_predicted).
  3. `field_state`: State biofisik kontinu per petak ladang (theta, t_soil, ph, dat, last_fertilized).
  4. `crop_cycles`: Siklus tanam jagung aktif (planting_date, varietas, jadwal pemupukan).
  5. `predictions`: Log riwayat prediksi AVRI, kategori risiko, dan nilai TreeSHAP.
  6. `data_provenance`: Log metadata asal-usul data replay BMKG (untuk audit juri).
- **Checklist:**
  - [ ] `alembic upgrade head` berjalan sukses tanpa error.
  - [ ] Perintah `SELECT create_hypertable('telemetry', 'ts');` terverifikasi aktif.

---

### TAHAP 3: Ingestion Pipeline & Anti-Corruption Adapter

#### 🟢 BE-1.4: MQTT Subscriber & LoRa Bit-Unpacking
- **Deskripsi:** Menjalankan background worker asinkron yang subscribe ke topik MQTT `/volatisafe/v1/node/+/telemetry`.
- **Target File:** `backend/app/services/ingestion.py`
- **Logika Adapter:**
  - Menerima payload LoRa ringkas: `{"n":"VS-A1-003","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}`.
  - Memvalidasi rentang nilai (data cleaning): buang data jika suhu > 60°C atau kelembaban < 0%.
  - Menyimpan data bersih ke hypertable `telemetry`.
  - Memicu pembaruan state pada Digital Twin dan pemanggilan AI Predictor.
- **Checklist:**
  - [ ] Mampu memproses paket sintetis dari Wokwi tanpa error parsing.
  - [ ] Menyediakan fallback logging jika koneksi MQTT terputus sejenak.

---

### TAHAP 4: Integrasi Modul AI & Digital Twin

#### 🟢 BE-1.5: Orkestrasi Panggilan AI Engine
- **Deskripsi:** Menjembatani data telemetri yang baru masuk dengan model AI milik Aris (`predict_avri()`) dan model Digital Twin milik Andharu.
- **Target File:** `backend/app/services/ai_invoker.py`
- **Alur Kerja:**
  1. Ambil data sensor terkini + state petak + forecast cuaca BMKG.
  2. Susun objek `FeatureVectorDTO` sesuai kontrak [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §2.
  3. Panggil fungsi `ai_engine.service.predict_avri(features)`.
  4. Simpan output `PredictionResultDTO` (AVRI score, risk category, shap values) ke tabel `predictions`.
  5. Jika skor AVRI $\ge 61\%$ (Kritis/Bahaya), picu `AlertDispatcherService`.
- **Checklist:**
  - [ ] Waktu eksekusi orkestrasi total $\le 100$ ms.
  - [ ] Error pada model AI tidak menggagalkan proses penyimpanan data telemetri.

---

### TAHAP 5: Implementasi REST API & WebSocket Stream

#### 🟢 BE-1.6: Core REST Endpoints (Kontrak `INTERFACES.md` §3)
- **Deskripsi:** Menyediakan endpoint data untuk dikonsumsi Frontend PWA.
- **Target File:** `backend/app/routers/nodes.py`, `backend/app/routers/fields.py`
- **Daftar Endpoint Wajib:**
  - `GET /api/v1/nodes` (Daftar node, status online/offline, persentase baterai).
  - `GET /api/v1/fields/{id}/telemetry` (Deret waktu historis 24 jam untuk grafik).
  - `GET /api/v1/fields/{id}/state` (State live petak, status AVRI terkini, preskripsi tindakan).
- **Checklist:**
  - [ ] Semua respons dibungkus amplop baku: `{ "data": ..., "meta": ... }`.
  - [ ] Format timestamp ISO 8601 UTC string (`YYYY-MM-DDTHH:MM:SSZ`).

#### 🟢 BE-1.7: Agronomic REST Endpoints
- **Deskripsi:** Menyediakan fitur khusus agronomi jagung.
- **Target File:** `backend/app/routers/agronomy.py`
- **Daftar Endpoint:**
  - `POST /api/v1/crop-cycles`: Inisiasi tanggal tanam, perhitungan otomatis umur `DAT`, dan jadwal fase fenologi jagung (V3, V8, V12, Panen).
  - `POST /api/v1/fertilizer/blend-calculator`: Menghitung racikan pupuk majemuk (Urea + Phonska + ZA) dan mengonversinya ke satuan praktis: **jumlah karung 50 kg dan ember takar 8 kg**.
  - `POST /api/v1/simulation/`: Endpoint simulasi langsung untuk juri tanpa mengubah data database produksi.
- **Checklist:**
  - [ ] Logika kalkulator pupuk sesuai standar Permentan No. 40/2007 & Balitbangtan.
  - [ ] Endpoint  mengembalikan skor AVRI dan TreeSHAP instan dalam waktu $< 50$ ms.

#### 🟢 BE-1.8: WebSocket Live Stream & Bot Alert Dispatcher
- **Deskripsi:** Streaming data real-time ke web dan pengiriman pesan otomatis ke petani.
- **Target File:** `backend/app/routers/websocket.py`, `backend/app/services/alert_dispatcher.py`
- **Spesifikasi:**
  - WebSocket di endpoint `/ws/v1/live`: Broadcast event saat ada data telemetri baru atau status risiko berubah.
  - WhatsApp Gateway (Wablas/Fonnte API) & Telegram Bot API:
    - Peringatan instan saat AVRI $\ge 61\%$: *"⚠️ JANGAN TABUR UREA: Risiko Penguapan 74%..."*
    - Pengingat H-3 sebelum tanggal pemupukan tiba (dari data `crop_cycles`).
- **Checklist:**
  - [ ] WebSocket mendukung auto-reconnect tanpa membebani memory server.
  - [ ] Notifikasi memiliki mekanisme *rate-limiting* (tidak membombardir HP petani berkali-kali dalam 1 jam).

---

## 🚫 Zona Terlarang Syifa (Backend) (DILARANG KERAS)
1. ❌ DILARANG mengubah formula kinetika urease atau membongkar model AI LightGBM.
2. ❌ DILARANG mengubah bit-packing payload LoRa di sisi firmware ESP32.
3. ❌ DILARANG melanggar struktur amplop respons `{ "data": ..., "meta": ... }` di REST API.
