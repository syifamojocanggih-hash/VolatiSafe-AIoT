# DOMAIN 3: BACKEND SERVICES, INGESTION & DB — README.md

> **PANDUAN KHUSUS UNTUK BACKEND AI AGENT**

---

## 1. Mandat & Ruang Lingkup Kerja

Backend AI bertindak sebagai orkestrator sentral sistem VolatiSafe AIoT:
- Mengelola broker MQTT Mosquitto dan Ingestion Adapter telemetri LoRa.
- Mengelola database PostgreSQL dan ekstensi time-series TimescaleDB.
- Memanggil modul inferensi AI / Digital Twin secara terisolasi via DTO.
- Menyediakan REST API FastAPI dan WebSocket live streaming untuk Frontend.
- Mengirimkan pesan notifikasi peringatan dini via WhatsApp Gateway & Telegram Bot.

### File & Direktori yang Dimiliki (Boleh Ditulis):
- `backend/` (Seluruh kode FastAPI, routers, schemas, services, adapters)
- `migrations/` (Alembic database migrations)
- `docker/` (Dockerfile, `docker-compose.yml` untuk PostgreSQL + TimescaleDB & Mosquitto)
- `docs/backend/` (Seluruh dokumen teknis backend di folder ini)

---

## 2. Zona Terlarang & Batasan Ketat (*Invariant Rules*)

Untuk mencegah benturan dengan tim/AI lain:
1. ❌ **Dilarang Menulis Kode UI / Frontend:** Jangan menyentuh komponen React, JSX/TSX, styling Tailwind, atau direktori `frontend/`.
2. ❌ **Dilarang Mengubah Logika Internal AI:** Backend hanya memanggil method `predict()` atau Digital Twin melalui DTO yang disepakati. Jangan memodifikasi file di dalam `ai_engine/`.
3. ❌ **Dilarang Mengubah Payload LoRa di Mikrokontroler:** Backend menyesuaikan diri terhadap perubahan hardware melalui modul `backend/app/adapters/lora_adapter.py`.
4. ❌ **Wajib Mematuhi Amplop REST API:** Semua respons API wajib dibungkus dalam amplop `{"data": ...}` atau `{"error": ...}` sesuai ketentuan [`docs/universal/INTERFACES.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/universal/INTERFACES.md) §0.2.

---

## 3. Indeks Dokumen Backend

1. [`DATABASE_SCHEMA.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/backend/DATABASE_SCHEMA.md): Skema PostgreSQL & TimescaleDB hypertable (`nodes`, `telemetry`, `field_state`, `predictions`).
2. [`INGESTION_PIPELINE.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/backend/INGESTION_PIPELINE.md): Alur penerimaan MQTT, unpacking paket LoRa, dan pemicu antrean analitik.
3. [`API_SPECIFICATION.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/backend/API_SPECIFICATION.md): Spesifikasi lengkap seluruh endpoint REST FastAPI.
4. [`WEBSOCKET_AND_ALERTS.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/backend/WEBSOCKET_AND_ALERTS.md): Streaming live telemetri via WebSocket dan dispatcher bot WhatsApp/Telegram.
5. [`SETUP.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/backend/SETUP.md): Panduan instalasi lokal, Docker Compose, dan migrasi database.
