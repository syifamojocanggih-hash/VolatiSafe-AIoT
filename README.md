# VolatiSafe AIoT
> **Sistem Prediksi Risiko Volatilisasi Amonia untuk Optimasi Jendela Waktu Pemupukan Urea Presisi**  
> *Target Kompetisi:* Hackathon DeepTech for FoodTech Indonesia 2026 — Universitas Muhammadiyah Metro, Lampung (Sub-Tema A: Smart Production & Precision Agriculture).

---

## 🌾 Ringkasan Inovasi
VolatiSafe AIoT adalah platform kecerdasan buatan dan telemetri mikroklimat tanah yang dirancang untuk mencegah kehilangan nitrogen pupuk Urea akibat volatilisasi gas amonia ($NH_3$) pada lahan jagung kering (Lampung & Lamongan). Berbeda dengan sistem agritech konvensional yang hanya menyarankan takaran pupuk statis, VolatiSafe memecahkan dimensi waktu: **"Kapan jendela jam paling aman untuk menebar pupuk agar Nitrogen tidak menguap?"**.

Sistem memadukan:
1. **IoT Node Berdaya Mandiri (< Rp250.000/node):** ESP32 + sensor fisik terverifikasi (Kelembaban Kapasitif, Suhu Probe DS18B20, pH Tanah) + transmisi radio LoRa 433 MHz mesh (zero-internet di lahan).
2. **Agro-Climatic Digital Twin:** Model virtual neraca air tanah FAO-56 ($ET_0$) dan difusi termal kontinu untuk imputasi data saat terjadi *sensor dropout*.
3. **Physics-Informed Machine Learning (PIML):** Model LightGBM Regressor yang memprediksi *residual variance* di atas kinetika reaksi kimia enzim urease (Arrhenius Decay) untuk menghasilkan skor *Ammonia Volatilization Risk Index* (AVRI 0–100%).
4. **PWA Dashboard & Bot Alert WhatsApp:** Preskripsi waktu jam-ke-jam, instruksi mitigasi fisik lapangan (tugal/benam vs siram), serta fitur *Dynamic DAT Tracker* dan *Multi-Fertilizer Blender* (konversi praktis karung & ember).

---

## 📚 Struktur Dokumentasi Teknis

Seluruh dokumentasi dirancang menggunakan arsitektur modular **Multi-Domain Isolation**:

```
.
├── PRD_VolatiSafe_AIoT_v1.md          # Dokumen PRD Lengkap (15 Seksi)
├── docs/
│   ├── README.md                      # Master Index & Aturan Batasan Domain
│   │
│   ├── universal/                     # Kontrak Global & Single Source of Truth
│   │   ├── PROJECT_CONTEXT.md         # Problem Statement, Research Gap & Lokus Riset
│   │   ├── PRD.md                     # Ringkasan Spesifikasi Kebutuhan Produk
│   │   ├── ARCHITECTURE.md            # Arsitektur Sistem 4 Lapis & Aliran Data
│   │   ├── BOUNDARIES_AND_CONTRACTS.md# Kontrak Batasan & Anti-Tabrakan Antar-Modul
│   │   ├── INTERFACES.md              # Kontrak Data Tunggal (LoRa, MQTT, REST, WebSocket)
│   │   ├── DECISIONS.md               # Architecture Decision Records (ADR 001 - ADR 008)
│   │   ├── GIT_WORKFLOW.md            # Konvensi Git, Branching & RFC Kontrak
│   │   └── ROADMAP.md                 # Rencana Kerja TKT 3 (7 Hari) ke TKT 6 (12 Bulan)
│   │
│   ├── hardware/                      # Domain 1: Hardware, Schematics & Firmware Wokwi
│   ├── ai/                            # Domain 2: Digital Twin FAO-56, PIML & TreeSHAP
│   ├── backend/                       # Domain 3: FastAPI, TimescaleDB, Ingestion & Bot
│   └── frontend/                      # Domain 4: Next.js 14, PWA, Tailwind & What-If Simulator
```

---

## 🚀 Panduan Memulai Cepat (Full-Stack Docker)

Seluruh komponen VolatiSafe AIoT (Frontend, Backend, Database TimescaleDB, MQTT Broker, dan Web DB Manager) telah terintegrasi dalam **Docker Compose**:

### 1. Jalankan Seluruh Sistem dalam Sekali Perintah
```bash
# Jalankan dari root direktori proyek:
docker compose -f docker/docker-compose.yml up -d
```

### 2. URL Akses Layanan (Default Ports)
| Layanan | URL Akses | Port Host Default |
| :--- | :--- | :--- |
| **Frontend Web Dashboard** | [http://localhost:3000](http://localhost:3000) | `3000` |
| **Backend REST API (Swagger)**| [http://localhost:8000/docs](http://localhost:8000/docs) | `8000` |
| **Backend Health Check** | [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) | `8000` |
| **Live WebSocket Stream** | `ws://localhost:8000/ws/v1/live` | `8000` |
| **Web DB Manager (Adminer)** | [http://localhost:8082](http://localhost:8082) | `8082` |
| **PostgreSQL / TimescaleDB** | `localhost:5432` | `5432` |
| **Mosquitto MQTT Broker** | `localhost:1883` | `1883` |

---

## ⚙️ Panduan Mengubah Port (Custom Ports)

Jika port di atas sudah terpakai oleh aplikasi lain di laptop Anda (misalnya port `8000` dipakai project lain, port `5432` dipakai PostgreSQL lokal, atau port `3000` dipakai Next.js lain):

### Langkah-langkah Mengganti Port:
1. Buka file `.env` di folder root atau `docker/.env` (atau buat dari salinan `docker/.env.example`).
2. Ubah nomor port pada variabel yang diinginkan, contoh:
```ini
# Ganti port sesuai kebutuhan Anda
FRONTEND_PORT=3001
BACKEND_PORT=8001
DB_PORT=5433
MQTT_PORT=1884
DB_ADMIN_PORT=8083
```
3. Restart container Docker:
```bash
docker compose -f docker/docker-compose.yml up -d
```
Docker akan secara otomatis memetakan port host baru tanpa perlu mengubah kode sumber backend maupun frontend!

### Perintah Docker Bermanfaat:
```bash
# Melihat status seluruh container
docker compose -f docker/docker-compose.yml ps

# Melihat live logs (contoh: backend)
docker compose -f docker/docker-compose.yml logs -f backend

# Mematikan seluruh stack
docker compose -f docker/docker-compose.yml down
```

---

## 📖 Dokumentasi Per Domain

1. **Hardware & Firmware LoRa:** [`docs/hardware/WOKWI_SIMULATION.md`](docs/hardware/WOKWI_SIMULATION.md)
2. **AI & Digital Twin:** [`docs/ai/MOCK_PREDICTOR.md`](docs/ai/MOCK_PREDICTOR.md)
3. **Backend, Database & Ingestion:** [`docs/backend/README.md`](docs/backend/README.md) & [`docs/backend/SETUP.md`](docs/backend/SETUP.md)
4. **Frontend & PWA Dashboard:** [`docs/frontend/SETUP.md`](docs/frontend/SETUP.md)

