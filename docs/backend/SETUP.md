# SETUP.md — Panduan Setup Lingkungan Backend VolatiSafe AIoT

---

## 1. Prasyarat Sistem

- **Python:** 3.11 atau lebih baru
- **Docker & Docker Compose:** Versi 24.x+ (untuk menjalankan PostgreSQL + TimescaleDB dan Mosquitto)
- **NodeMCU / Serial Driver (opsional):** Driver CP2102 jika menghubungkan hardware fisik langsung via USB.

---

## 2. Menjalankan Layanan Full-Stack via Docker

Seluruh infrastruktur dan aplikasi VolatiSafe AIoT telah terintegrasi dalam Docker Compose:
- **Frontend Next.js:** Port `${FRONTEND_PORT:-3000}`
- **Backend FastAPI:** Port `${BACKEND_PORT:-8000}`
- **TimescaleDB (PostgreSQL 16):** Port `${DB_PORT:-5432}`
- **Eclipse Mosquitto (MQTT):** Port `${MQTT_PORT:-1883}`
- **Adminer (Web DB Manager):** Port `${DB_ADMIN_PORT:-8082}`

```bash
# Jalankan seluruh stack (frontend, backend, db, mqtt, adminer)
docker compose -f docker/docker-compose.yml up -d --build
```

### Konfigurasi Custom Port (Jika Benturan Port)
Jika ada port yang bentrok dengan aplikasi lain di laptop Anda:
1. Buka file `.env` di root atau `docker/.env`.
2. Ubah port sesuai yang kosong:
```ini
FRONTEND_PORT=3001
BACKEND_PORT=8001
DB_PORT=5433
MQTT_PORT=1884
DB_ADMIN_PORT=8083
```
3. Terapkan dengan menjalankan ulang:
```bash
docker compose -f docker/docker-compose.yml up -d
```

---

## 3. Konfigurasi Lingkungan (`.env`)

Buat file `.env` di dalam folder `backend/`:

```ini
# App Config
APP_ENV=development
API_V1_STR=/api/v1
SECRET_KEY=volatisafe_super_secret_dev_key

# Database (PostgreSQL + TimescaleDB)
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=volatisafe_db
POSTGRES_PORT=5432

# MQTT Broker
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_TELEMETRY_TOPIC=/volatisafe/v1/node/+/telemetry

# AI Model Mock Flag (Aktifkan saat belum install LightGBM/SHAP)
MOCK_AI_PREDICTOR=true

# Notification Gateway (Fonnte / Wablas)
WHATSAPP_API_TOKEN=your_fonnte_or_wablas_token_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_ALERT_CHAT_ID=-1001234567890
```

---

## 4. Instalasi Dependensi & Menjalankan Backend

```bash
# 1. Buat virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/macOS

# 2. Install dependensi
pip install -r backend/requirements.txt

# 3. Jalankan migrasi database
alembic upgrade head

# 4. Jalankan dev server FastAPI dengan reload otomatis
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Buka dokumentasi interaktif Swagger UI di browser:
👉 `http://localhost:8000/docs`
