# Changelog — Backend Services, Ingestion & DB (Syifa)

Semua perubahan pada subsistem backend didokumentasikan di sini dengan merujuk pada `TASK_GUIDE.md` dan kontrak `INTERFACES.md`.

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

