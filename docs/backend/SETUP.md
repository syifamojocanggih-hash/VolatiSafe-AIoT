# SETUP.md — Panduan Setup Lingkungan Backend VolatiSafe AIoT

---

## 1. Prasyarat Sistem

- **Python:** 3.11 atau lebih baru
- **Docker & Docker Compose:** Versi 24.x+ (untuk menjalankan PostgreSQL + TimescaleDB dan Mosquitto)
- **NodeMCU / Serial Driver (opsional):** Driver CP2102 jika menghubungkan hardware fisik langsung via USB.

---

## 2. Menjalankan Layanan Infrastruktur via Docker

Jalankan container database TimescaleDB dan broker Mosquitto:

```bash
# Masuk ke direktori docker
docker-compose up -d
```

File `docker-compose.yml` mencakup:
1. **TimescaleDB:** Port `5432:5432` (image: `timescale/timescaledb:latest-pg15`)
2. **Eclipse Mosquitto:** Port `1883:1883` (image: `eclipse-mosquitto:2`)

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
