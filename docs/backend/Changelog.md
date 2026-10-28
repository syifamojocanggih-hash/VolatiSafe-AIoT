# Changelog — Backend Services, Ingestion & DB (Syifa)

Semua perubahan pada subsistem backend didokumentasikan di sini dengan merujuk pada `TASK_GUIDE.md` dan kontrak `INTERFACES.md`.

---

## [1.0.4] — 2026-10-28

### 🗺️ Relokasi Data Geospasial Poligon ke Hamparan Sawah Murni Solokuro (`parcels_data.py`, `mock_db.py`, `INTERFACES.md`)
- **Penyelarasan Koordinat Sawah Bebas Tambang Kapur:**
  - Memperbarui koordinat batas kadastral 12 bedeng persil (`SOLOKURO_OUTER_BOUNDARY`), surrounding buffer parcels, dan titik pusat menjadi `[-6.912350, 112.345680]` (`6°54'44"S 112°20'44"E`) di hamparan persawahan jagung Solokuro.
  - Memposisikan titik Gateway Basecamp LoRa di koordinat `[-6.911850, 112.346150]` di samping jalan usaha tani dan saluran irigasi.
- **Dukungan Failover Asinkron:**
  - Endpoint `POST /api/v1/fields/{id}/parcels/{parcel_id}/simulate-failover` terverifikasi aktif mengubah state node dropout dan mengembalikan estimasi FAO-56.

---

## [1.0.3] — 2026-10-28

### 🧠 Integrasi Diagnostik Fisika PIML Arrhenius & TreeSHAP Real-Time (`fields.py`, `ai_service.py`, `INTERFACES.md`)
- **Penyediaan Metrik Dekomposisi Fisika & Residual AI:**
  - Menambahkan atribut `base_physics_score`, `residual_ai_score`, dan `confidence_margin_pct` ke `PhysicsDiagnosticsDTO` di [`backend/app/schemas/fields.py`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/backend/app/schemas/fields.py).
  - Menyematkan objek `physics_diagnostics` ke dalam `FieldCurrentStatusDTO` agar antarmuka modal dapat mengakses rasio kinetika Arrhenius vs koreksi non-linear Machine Learning secara langsung dari inferensi model real-time.
- **Eksposur Atribusi Fitur TreeSHAP Real-Time:**
  - Menyertakan daftar kontribusi fitur lokal `shap_explanations` (`impact_pct`, `direction`, `explanation`) pada endpoint `GET /api/v1/fields/{id}/current-status` untuk menggantikan tabel statis *if-else*.
- **Penyelesaian Dependensi Siklik Skema:**
  - Menata ulang referensi antar-skema pydantic antara `fields.py` dan `simulation.py` untuk menjamin konsistensi serialisasi saat kompilasi model pydantic.

---

## [1.0.2] — 2026-10-28

### 🌾 Pengayaan DTO Status Petak & Live Metadata Agronomi (ields.py, mock_db.py, INTERFACES.md)
- **Penyelarasan Kontrak & Skema DTO (FieldCurrentStatusDTO):**
  - Memperkaya skema respons endpoint GET /api/v1/fields/{id}/current-status dengan atribut agronomis dinamis: armer_name ('Pak Suparman'), lock ('Blok A'), rea_ha (0.75), crop_age_days (32), crop_phase ('Fase 8 Vegetatif'), dan corn_variety ('BISI-18').
  - Mengintegrasikan kalkulator siklus fenologi tanaman jagung otomatis berdasarkan umur tanam (dat).
- **Resiliensi Konfigurasi Backend (config.py):**
  - Menambahkan extra = 'ignore' pada konfigurasi Pydantic Settings BaseSettings agar toleran terhadap variabel environment docker-compose.
- **Query Komparasi Dinamis 24 Jam (Delta Calculation):**
  - Mengimplementasikan query SQL dinamis pada ields.py dan mock_db.py yang membandingkan state terkini dengan rekaman telemetri dan prediksi AVRI pada  - 24\text{ jam}$ di TimescaleDB (moisture_delta_24h, soil_temp_delta_24h, ph_delta_24h, dan vri_delta_24h).
  - Mengeliminasi nilai konstanta statis (-3.2, 1.8, -0.02) sehingga seluruh kartu metrik bereaksi dinamis terhadap fluktuasi data.
- **Transparansi Arsitektur Sistem (docs/not_activate.md):**
  - Membuat inventarisasi resmi subsistem non-aktif/simulasi TKT-3 (LoRa Hardware Lapangan, Sentinel-2 On-Demand continuous API, dan WhatsApp live blast) sesuai batas kompetisi dan ADR 004.

---

## [1.0.1] — 2026-10-27

### 🎨 Pemisahan Kode Warna Alert Banner Multilevel (`fields.py` & `mock_db.py`)
- **Pemisahan Kritis dan Bahaya:**
  - Mengubah kode warna respons `alert_banner` pada router [`fields.py`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/backend/app/routers/fields.py) dan memori [`mock_db.py`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/backend/app/services/mock_db.py) agar tidak lagi menggabungkan kategori kritis dan bahaya ke satu warna merah (`#DC2626`).
  - Pemetaan warna resmi:
    - `aman`: `#16A34A` (Hijau)
    - `waspada`: `#CA8A04` (Amber)
    - `kritis`: `#EA580C` (Oranye)
    - `bahaya`: `#DC2626` (Merah Pekat)

---

## [1.0.0] — 2026-10-25

### ✨ Fitur Baru yang Selesai Diimplementasikan (Sesuai PRD & TASK_GUIDE.md)

1. **Arsitektur Modular FastAPI (`backend/app/`)**:
   - Inisialisasi struktur modular: `core/`, `schemas/`, `models/`, `routers/`, `services/`.
   - Konfigurasi environment terpusat via `pydantic-settings` di [`config.py`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/backend/app/core/config.py).
   - Middleware CORS aktif untuk integrasi langsung ke frontend web Next.js (`http://localhost:3000`).
   - Handler pengecualian kustom yang menjamin 100% kepatuhan format amplop data standar `INTERFACES.md` §0.2 (`{"data": ..., "meta": ...}` untuk sukses dan `{"error": {"code": ..., "message": ...}}` untuk gagal).

2. **Skema & DTO Komprehensif (`backend/app/schemas/`)**:
   - `envelope.py`: Amplop baku `ResponseEnvelope[T]`, `MetaDTO`, dan `ErrorEnvelope`.
   - `nodes.py`: `NodeDTO`, `NodeTelemetrySeriesDTO`, `TelemetryPointDTO`.
   - `fields.py`: `FieldCurrentStatusDTO`, `FieldMetricsDTO`, `AlertBannerDTO`, `ForecastWindowDTO`, `ShapExplanationDTO`.
   - `agronomy.py`: `FertilizerBlendRequestDTO`, `FertilizerBlendResponseDTO`, `CropCycleCreateDTO`, `CropCycleResponseDTO`.
   - `simulation.py`: `WhatIfRequestDTO`, `PredictRiskResponseDTO`, `PrescriptionDTO`, `PhysicsDiagnosticsDTO`.

3. **Layanan AI Engine & Fisika PIML (`backend/app/services/ai_service.py`)**:
   - Persamaan kinetika Arrhenius urease: $k_{urease}(T) = A \cdot \exp(-E_a / (R \cdot T))$.
   - Persamaan penekan kelembaban Michaelis-Menten: $f_{moisture}(\theta) = \theta / (\theta + 18.0)$.
   - Persamaan akselerasi pH basa sigmoidal: $f_{pH}(pH) = 10^{\Delta pH} / (1 + 10^{\Delta pH})$.
   - Mesin atribusi Explainable AI TreeSHAP dinamis yang memetakan kontribusi suhu, kelembaban, pH, dan hujan.

4. **Kalkulator Agronomi Jagung Presisi (`backend/app/services/agronomy_service.py`)**:
   - Formulasi pupuk majemuk (Urea 46% N + NPK Phonska 15-15-15 + ZA 21% N) standar Permentan No. 40/2007 & Balitbangtan.
   - Konversi otomatis ke unit praktis petani: **Karung 50 kg** (termasuk pecahan ½ dan 1½) dan **Ember takar 8 kg**.
   - Pelacak fenologi jagung dinamis (*Days After Transplanting / DAT*) dengan milestone H-3 pemupukan dasar (V3), susulan (V8), dan panen fisiologis (R6).

5. **Ingestion Pipeline & LoRa Anti-Corruption Adapter (`backend/app/services/ingestion.py`)**:
   - Unpacking payload LoRa kompak 52 byte (`n`, `ts`, `m`, `t`, `ph`, `b`).
   - Pembersihan data dan validasi rentang fisik.
   - Memicu pembaruan state dan peringatan otomatis jika skor AVRI melompat ke ambang kritis ($\ge 61\%$).

6. **Dispatcher Notifikasi Petani (`backend/app/services/alert_dispatcher.py`)**:
   - Template pesan peringatan darurat risiko penguapan amonia WhatsApp & Telegram.
   - Mekanisme *rate-limiting* 1 jam untuk mencegah spamming ke perangkat petani.

7. **Koleksi Endpoint REST & WebSocket Stream (`backend/app/routers/`)**:
   - `GET /api/v1/health`: Health check status orchestrator, uptime, dan registrasi node.
   - `GET /api/v1/nodes`: Daftar node fisik dan status online/baterai.
   - `GET /api/v1/nodes/{node_id}/telemetry`: Deret waktu historis 24 jam untuk visualisasi grafik.
   - `GET /api/v1/fields/{field_id}/current-status`: Status petak terkini, skor AVRI, banner, dan TreeSHAP.
   - `GET /api/v1/fields/{field_id}/forecast-window`: Strip proyeksi 72 jam jendela pemupukan aman.
   - `POST /api/v1/fertilizer/blend-calculator`: Kalkulator racikan pupuk takaran karung & ember.
   - `POST /api/v1/crop-cycles`: Inisiasi siklus tanam aktif & jadwal H-3.
   - `POST /api/v1/simulation/what-if`: Simulator interaktif pengujian juri.
   - `WebSocket /ws/v1/live`: Streaming live update & heartbeat ping/pong.

8. **Infrastruktur Kontainer & Basis Data (`docker/`, `backend/app/models/`, `migrations/`)**:
   - `docker/mosquitto.conf` & `docker/docker-compose.yml` untuk Mosquitto MQTT dan TimescaleDB PostgreSQL 16.
   - `docker/init.sql`: Otomatisasi inisialisasi DDL, ekstensi TimescaleDB, pembuatan 8 tabel relasional, dan seeding awal data lahan `BLOK-A` & node `VS-A1-003`.
   - `volatisafe_db_admin` (Adminer Web GUI) di port `8082` untuk manajemen visual database di browser.
   - Konfigurasi migrasi database Alembic (`alembic.ini`, `migrations/env.py`, `migrations/versions/001_initial_schema.py`).
   - Modul konektor database `backend/app/core/database.py` dengan driver `psycopg 3.3.6`.

