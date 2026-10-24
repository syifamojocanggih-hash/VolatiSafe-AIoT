# ARCHITECTURE.md — Arsitektur Sistem VolatiSafe AIoT

> **STATUS:** SUMBER KEBENARAN ARSITEKTURAL  
> Dokumen ini mendeskripsikan topologi sistem 4-lapis, interaksi antar-layanan, aliran data, dan isolasi kegagalan untuk **VolatiSafe AIoT**. Kontrak data spesifik didefinisikan di `INTERFACES.md`.

---

## 1. Gambaran Umum Sistem (4 Lapis)

VolatiSafe AIoT membagi beban komputasi menjadi 4 lapis independen untuk memastikan skalabilitas, efisiensi energi di lahan tanpa listrik/internet, dan akurasi prediksi agronomi:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAPIS 1 — FIELD NODE (Edge Sensing & Battery Management)                   │
│  ESP32 MCU + Capacitive Soil Moisture v1.2 + DS18B20 Temp + Analog pH      │
│  Deep Sleep 15 menit · Burst Sampling 5x · MOSFET Power Gate (Anti-Korosi)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ LoRa 433 MHz (SX1278, Jarak 2–5 km)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ LAPIS 2 — GATEWAY & INGESTION ADAPTER (LoRa → MQTT Bridge)                  │
│  ESP32 / Raspberry Pi LoRa RX + WiFi/Ethernet · Mosquitto MQTT Broker       │
│  Anti-Corruption Adapter (Unpack Payload → Clean Telemetry Model)           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Ingestion Pipeline (MQTT / Internal Bus)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ LAPIS 3 — AGRO-CLIMATIC DIGITAL TWIN & AI ENGINE                            │
│  • Agro-Climatic Digital Twin: Neraca Air Tanah FAO-56 (ET₀) + Difusi Termal│
│  • Storage: TimescaleDB (Hypertable Telemetri) & PostgreSQL (State/Metadata)│
│  • AI Core: Physics-Informed ML (PIML) LightGBM + Kinetika Urease Arrhenius │
│  • Explainability: TreeSHAP Feature Attribution (Pemicu Risiko)             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API (JSON) / WebSocket Live Stream
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ LAPIS 4 — PRESENTATION & ALERTING LAYER                                     │
│  • Web Dashboard: Next.js 14 (App Router) + Tailwind CSS + PWA (Offline)    │
│  • Visualisasi: Leaflet Map (Zonasi Petak) & Recharts (Jendela 72 Jam)      │
│  • Fitur Khusus: Dynamic DAT Tracker (Fenologi) & Multi-Fertilizer Blender  │
│  • Direct Push: Gateway WhatsApp Bot (Fonnte/Wablas) & Telegram Bot         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Arsitektur Closed-Loop Virtual Testbed (Fase TKT 3)

Untuk tahap seleksi proposal dan demonstrasi purwarupa *low-fidelity* (TKT 3), sistem dapat berjalan 100% dalam lingkungan simulasi tertutup berbasis software tanpa ketergantungan perangkat keras fisik:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 CLOSED-LOOP VIRTUAL TESTBED (SIMULASI TKT 3)                │
│                                                                             │
│ [ VIRTUAL IOT NODE ] (Wokwi CLI / Web)                                      │
│   • ESP32 C++ firmware identik dengan fisik asli                            │
│   • Simulasi sensor kapasitif, suhu DS18B20, & pH tanah                     │
│   • Output: Payload JSON via Virtual MQTT Bridge (Mosquitto localhost:1883) │
│                               │                                             │
│                               ▼                                             │
│ [ DIGITAL TWIN ENGINE ] (Python / SimPy Simulator)                          │
│   • Replay dataset cuaca historis BMKG Stasiun Lampung Tengah & Lamongan    │
│   • Komputasi neraca air tanah FAO-56 secara deterministik                  │
│   • Failover engine saat node sengaja diputus (Scenario C)                  │
│                               │                                             │
│                               ▼                                             │
│ [ AI PREDICTOR SERVICE ] (FastAPI + LightGBM + PIML)                        │
│   • Evaluasi AVRI (0–100%) dan klasifikasi status risiko                    │
│   • Kalkulasi kontribusi TreeSHAP untuk visualisasi alasan                  │
│                               │                                             │
│                               ▼                                             │
│ [ LIVE DASHBOARD & INTERACTIVE SIMULATOR ] (Next.js 14)                     │
│   • Grafik telemetri dinamis & peta petak interaktif                        │
│   • Panel "What-If Slider" untuk pengujian langsung oleh dewan juri         │
│   • Notifikasi instan via Telegram Bot ke smartphone penguji                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Komponen Sistem & Batas Tanggung Jawab

### 3.1 Lapis 1 — Field Node (Edge Sensing)
- **Fungsi:** Membaca kelembaban, suhu, dan pH tanah setiap 15 menit, melakukan kalibrasi analog dasar, dan mengirimkan paket LoRa.
- **Isolasi Daya:** Sensor dipasok daya melalui transistor MOSFET (GPIO25). Saat ESP32 berada pada siklus *deep sleep* (99% waktu), VCC sensor terputus total untuk mengeliminasi arus bocor dan korosi elektrolisis probe tanah.
- **Kegagalan:** Jika transmisi LoRa gagal setelah 3x retry, node tetap masuk mode sleep tanpa menguras baterai.

### 3.2 Lapis 2 — Gateway & Ingestion Adapter
- **Fungsi:** Menerima paket LoRa mentah, mengekstrak bit/JSON kompak, memvalidasi integritas data, dan meneruskan ke MQTT broker internal.
- **Anti-Corruption Layer (ACL):** Mengisolasi backend dari struktur byte LoRa. Semua data yang keluar dari gateway telah dinormalisasi menjadi schema `CleanTelemetryModel`.

### 3.3 Lapis 3 — Digital Twin & AI Engine
- **Agro-Climatic Digital Twin:** Menyimpan representasi virtual tanah per petak. Menggunakan persamaan FAO-56 untuk mengestimasi kelembaban tanah masa depan dan melakukan imputasi otomatis saat sensor kehilangan sinyal.
- **AI Engine (PIML):** Model hibrida menggabungkan hukum kinetika kimia (persamaan laju hidrolisis urease Arrhenius) dengan gradient boosting (LightGBM) untuk memprediksi residual penguapan amonia (AVRI score 0–100%).
- **Storage:** TimescaleDB menyimpan telemetri historis dengan query kompresi tinggi; PostgreSQL menyimpan metadata petak, siklus tanam, dan log audit provenance data.

### 3.4 Lapis 4 — Presentation & Alerting Layer
- **Dashboard Next.js 14:** Menggunakan SSR untuk pemuatan awal yang cepat dan client-side hydration untuk koneksi WebSocket live.
- **PWA Service Worker:** Memungkinkan pembacaan ringkasan rekomendasi terakhir dan kalkulator pupuk majemuk meskipun petani berada di kebun tanpa sinyal internet.
- **Notification Engine:** Memicu pesan peringatan WhatsApp otomatis jika AVRI > 60% (Kritis/Bahaya) serta notifikasi logistik H-3 sebelum fase pemupukan V8/V12 tiba.

---

## 4. Aliran Data End-to-End

```
1. Sensor Read ──> 2. LoRa TX ──> 3. Gateway Adapter ──> 4. TimescaleDB Ingestion
                                                                   │
                                                                   ▼
8. WhatsApp / ◄── 7. WebSocket / ◄── 6. Prediction ◄── 5. Feature Assembly
   Telegram Bot      REST API            (AVRI + SHAP)    (Soil State + Weather)
```

1. **Sampling:** ESP32 menyalakan MOSFET, mengambil 5 sampel per sensor, menghitung median terkalibrasi, mematikan MOSFET.
2. **LoRa Transmit:** ESP32 memancarkan paket 52-byte ke frekuensi 433 MHz.
3. **Gateway Ingestion:** Gateway menerima paket, memetakan ke JSON standar, memublikasikan ke `/volatisafe/v1/node/{node_id}/telemetry`.
4. **Penyimpanan:** Ingestion worker menyimpan data ke TimescaleDB hypertable `telemetry`.
5. **Feature Assembly:** Backend mengambil status tanah aktual dan menggabungkannya dengan prakiraan cuaca 12 jam dari API BMKG.
6. **Inferensi AI:** Model LightGBM + PIML menghitung AVRI, kategori risiko, dan nilai TreeSHAP.
7. **Penyajian Real-Time:** Backend memancarkan event `TELEMETRY_UPDATE` via WebSocket ke Dashboard Next.js.
8. **Peringatan Otomatis:** Jika risiko Kritis/Bahaya terdeteksi, bot WhatsApp mengirimkan pesan preskriptif ke nomor petani terdaftar.
