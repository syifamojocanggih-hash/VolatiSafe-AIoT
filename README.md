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

## 🚀 Panduan Memulai Cepat (Fase Prototipe Software TKT 3)

1. **Simulasi Hardware Virtual (Wokwi):** Baca panduan di [`docs/hardware/WOKWI_SIMULATION.md`](docs/hardware/WOKWI_SIMULATION.md).
2. **Backend Services & Database:** Jalankan stack Docker lokal via [`docs/backend/SETUP.md`](docs/backend/SETUP.md).
3. **Frontend PWA Dashboard:** Ikuti petunjuk instalasi di [`docs/frontend/SETUP.md`](docs/frontend/SETUP.md).
4. **Validasi Model AI:** Akses mock predictor di [`docs/ai/MOCK_PREDICTOR.md`](docs/ai/MOCK_PREDICTOR.md).

### Jalankan seluruh stack di mesin lokal

Prasyarat: Docker Desktop aktif, Python 3.10+, Node.js 20+, dan port `5433`, `1883`, `8000`, `3000` bebas.

```powershell
.\scripts\run-dev.ps1
```

Skrip menyalakan TimescaleDB + Mosquitto lewat Docker, menyiapkan `backend\.venv`, menyalin `.env` contoh bila belum ada, lalu menjalankan backend dan dashboard di latar belakang. Log ditulis ke `logs\backend.log` dan `logs\frontend.log`; pantau dengan `Get-Content logs\backend.log -Tail 20 -Wait`. Opsi: `-SkipInstall` (lewati pip/npm install), `-NoBrowser` (jangan buka browser otomatis).

| Layanan | Alamat | Catatan |
|---|---|---|
| Dashboard | http://localhost:3000 | Next.js dev server |
| REST API + Swagger | http://localhost:8000/docs | FastAPI |
| Telemetri live | ws://localhost:8000/ws/v1/live | WebSocket dashboard |
| TimescaleDB | localhost:5433 | `DB_PORT=5433` agar tidak bentrok PostgreSQL lokal |
| MQTT | localhost:1883 | topik `/volatisafe/v1/node/{NODE_ID}/telemetry` |

Uji jalur IoT tanpa hardware:

```powershell
.\scripts\publish-telemetry.ps1 -Moisture 41.2 -Temp 21.4 -Ph 6.35 -Battery 4.05
```

Paket masuk ke Mosquitto, diproses ingestion, dan tampil di dashboard dalam ~1 detik lewat WebSocket. Kirim `-Moisture -999` untuk menguji sensor rusak: paket ditolak, alasannya dicatat di log backend, dan metrik terakhir tidak berubah.

Konfigurasi node IoT (Wokwi atau ESP32 fisik, kredensial, topik MQTT, kalibrasi): [`docs/hardware/SETUP_IOT.md`](docs/hardware/SETUP_IOT.md).

Hentikan backend dan dashboard: `.\scripts\stop-dev.ps1`. Hentikan infrastruktur: `docker compose -f docker/docker-compose.yml down`.

Catatan: halaman `/digital-twin` masih memakai data fallback lokal karena service Digital Twin berada di branch `digittal-twin` dan belum di-merge ke `main`.
