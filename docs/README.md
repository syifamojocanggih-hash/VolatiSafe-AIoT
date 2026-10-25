# Dokumentasi Arsitektur & Isolasi Multi-Domain: VolatiSafe AIoT

Selamat datang di repositori dokumentasi **VolatiSafe AIoT** (*Sistem Prediksi Risiko Volatilisasi Amonia untuk Optimasi Jendela Waktu Pemupukan Urea Presisi*).

Dokumentasi ini dirancang dengan prinsip **Multi-AI / Multi-Domain Isolation Architecture**. Setiap domain sistem (Hardware, AI/Digital Twin, Backend, Frontend) dipisahkan secara tegas melalui **Interface Contract**, **Anti-Corruption Layer (ACL)**, dan **Mock-Driven Testing**. Tujuannya agar pengerjaan oleh AI agent maupun developer yang berbeda dapat berjalan paralel tanpa saling bertabrakan (*zero-collision development*).

---

## 1. Peta Navigasi Dokumentasi

```
docs/
├── README.md                          <-- Dokumen ini (Master Index & Aturan Batasan)
│
├── universal/                         <-- KONTRAK GLOBAL & SUMBER KEBENARAN TUNGGAL
│   ├── ARCHITECTURE.md                <-- Arsitektur sistem 4 lapis & aliran data
│   ├── BOUNDARIES_AND_CONTRACTS.md    <-- Aturan batasan isolasi antar-AI & anti-tabrakan
│   ├── INTERFACES.md                  <-- Skema data pasti: LoRa, MQTT, DTO AI, REST, WebSocket
│   ├── PROJECT_CONTEXT.md             <-- Latar belakang, problem agronomi, & target kompetisi
│   ├── PRD.md                         <-- Product Requirements Document (PRD) inti
│   ├── DECISIONS.md                   <-- Architecture Decision Records (ADR 001 - ADR 008)
│   ├── GIT_WORKFLOW.md                <-- Aturan branch multi-AI & protokol RFC breaking changes
│   └── ROADMAP.md                     <-- Roadmap TKT 3 (7 hari software) ke TKT 6 (lapangan)
│
├── hardware/                          <-- DOMAIN 1: HARDWARE & EDGE FIRMWARE (Hafiiz)
│   ├── README.md                      <-- Lingkup, wewenang & zona terlarang Hafiiz
│   ├── TASK_GUIDE.md                  <-- Panduan tugas teknis langkah demi langkah
│   ├── PINOUT_AND_SCHEMATICS.md       <-- Skema rangkaian ESP32, sensor probe, & power gate
│   ├── FIRMWARE_SPEC.md               <-- Algoritma burst sampling, kalibrasi, & deep sleep
│   ├── TELEMETRY_PAYLOAD.md           <-- Spesifikasi bit-packing LoRa & gateway unpacking
│   └── WOKWI_SIMULATION.md            <-- Panduan virtual testbed Wokwi & 3 skenario demo juri
│
├── digital_twin/                      <-- DOMAIN 2: AGRO-CLIMATIC DIGITAL TWIN (Andharu)
│   ├── README.md                      <-- Lingkup, wewenang & zona terlarang Andharu
│   ├── TASK_GUIDE.md                  <-- Panduan tugas teknis langkah demi langkah
│   ├── MATHEMATICAL_FOUNDATIONS.md    <-- 4 Hukum sains (FAO-56, Saxton-Rawls, Fourier 1D, Arrhenius)
│   ├── SOIL_BASELINE_DATA.md          <-- Metodologi data baseline BBSDLP Kementan, SoilGrids & Saxton-Rawls
│   ├── FAO56_WATER_BALANCE.md         <-- Neraca air tanah FAO-56 Penman-Monteith & Kc jagung
│   ├── THERMAL_DIFFUSION.md           <-- Model difusi termal tanah teredam (inersia panas)
│   ├── FAILOVER_IMPUTATION.md         <-- Mesin imputasi state saat sensor offline / dropout
│   └── WEATHER_REPLAY.md              <-- Protokol replay cuaca BMKG & tabel audit data provenance
│
├── ai/                                <-- DOMAIN 3: AI ENGINE & MACHINE LEARNING (Aris)
│   ├── README.md                      <-- Lingkup, wewenang & zona terlarang Aris
│   ├── TASK_GUIDE.md                  <-- Panduan tugas teknis langkah demi langkah
│   ├── MODEL_SPEC.md                  <-- Physics-Informed ML (PIML) LightGBM & AVRI formula
│   ├── EXPLAINABILITY_SHAP.md         <-- TreeSHAP computation & mapping narasi petani
│   └── MOCK_PREDICTOR.md              <-- Script mock predictor untuk isolasi backend/frontend
│
├── backend/                           <-- DOMAIN 4: BACKEND SERVICES, INGESTION & DB (Syifa)
│   ├── README.md                      <-- Lingkup, wewenang & zona terlarang Syifa (Backend)
│   ├── TASK_GUIDE.md                  <-- Panduan tugas teknis langkah demi langkah
│   ├── DATABASE_SCHEMA.md             <-- PostgreSQL & TimescaleDB hypertable schema
│   ├── INGESTION_PIPELINE.md          <-- MQTT broker, LoRa adapter, & deduplication queue
│   ├── API_SPECIFICATION.md           <-- Kontrak REST API FastAPI (Request/Response DTO)
│   ├── WEBSOCKET_AND_ALERTS.md        <-- Streaming live telemetri & gateway bot WhatsApp/Telegram
│   └── SETUP.md                       <-- Panduan setup Docker (Postgres, Timescale, Mosquitto)
│
└── frontend/                          <-- DOMAIN 5: PRESENTATION LAYER & DASHBOARD (Syifa)
    ├── README.md                      <-- Lingkup, wewenang & zona terlarang Syifa (Frontend)
    ├── TASK_GUIDE.md                  <-- Panduan tugas teknis langkah demi langkah
    ├── DESIGN_SYSTEM.md               <-- Design tokens, palet status AVRI, & tipografi
    ├── PAGE_STATES.md                 <-- Spesifikasi UI State 5 layar utama 
    ├── UI_COMPONENTS.md               <-- Katalog komponen reusable (Card, Chart, Map, Banner)
    ├── MOCK_DATA.md                   <-- Fixture JSON offline untuk dev frontend independen
    └── SETUP.md                       <-- Panduan setup Next.js 14, Tailwind, & PWA
```

---

## 2. Matriks Wewenang & Pembagian Tugas Tim Pengembang (Team Access Matrix)

Untuk menghindari kerusakan silang (*cross-domain regression*), setiap anggota tim pengembang memiliki batas kepemilikan folder yang tegas:

| Peran & Developer | Fokus Tugas Utama | Folder Boleh Ditulis (R/W) | Zona Terlarang (DILARANG KERAS) | Titik Kontak Resmi |
|---|---|---|---|---|
| **IoT & Hardware**<br>*(Hafiiz)* | Firmware ESP32 C++, sensor tanah (Moisture & pH), LoRa SX1278 433 MHz, Wokwi virtual node, deep sleep | `firmware/`, `simulation/wokwi/`, `docs/hardware/` | Dilarang menyentuh kode database, API backend, model AI, atau UI frontend | Mengirim payload 52-byte ke topik MQTT Gateway via `docs/universal/INTERFACES.md` §1 |
| **Digital Twin**<br>*(Andharu)* | Model biofisika tanah FAO-56 ($ET_0$), difusi termal tanah damped, imputasi failover dropout, BMKG weather replay | `digital_twin/`, `simulations/data_replay/`, `docs/digital_twin/` | Dilarang mengutak-atik model LightGBM, firmware ESP32, atau membuat UI web | Menghasilkan `FieldStateDTO` standar melalui interface di `docs/universal/INTERFACES.md` §2 |
| **Fullstack (BE + FE)**<br>*(Syifa)* | Ingestion MQTT, TimescaleDB, REST API FastAPI, WebSocket, bot WhatsApp/Telegram, Next.js 14 PWA, Leaflet, Recharts | `backend/`, `frontend/`, `migrations/`, `docker/`, `docs/backend/`, `docs/frontend/` | Dilarang mengubah formula kinetika urease PIML atau mendikte pinout mikrokontroler hardware | Mengekspos REST DTO & WebSocket stream sesuai `docs/universal/INTERFACES.md` §3 |
| **AI Engineer & Lead**<br>*(Aris)* | Arsitek sistem, penjamin kontrak data, Physics-Informed ML (PIML), LightGBM Regressor, AVRI formula, TreeSHAP | `ai_engine/`, `models/`, `docs/ai/` (MODEL_SPEC, SHAP), `docs/universal/` | Dilarang mengubah implementasi internal firmware atau styling CSS sepihak di luar kontrak | Menghasilkan model PIML terlatih dan mengelola *Single Source of Truth* universal |

---

## 3. Empat Aturan Emas Anti-Tabrakan (*Golden Rules*)

1. **Contract-First Development (Single Source of Truth):**
   Semua bentuk data yang melintasi batas domain didefinisikan secara mutlak di [`docs/universal/INTERFACES.md`](universal/INTERFACES.md). Tidak ada agent yang boleh mengubah struktur data tanpa persetujuan lintas domain.
2. **Anti-Corruption Layer (Adapter Pattern):**
   Perubahan pada level sensor/hardware (misal: ganti pin atau format paket LoRa) **hanya boleh ditangani oleh Adapter di Gateway/Ingestion**. Logika inti backend, AI, dan frontend tidak boleh terpengaruh.
3. **Mock-Driven Decoupling:**
   Frontend agent bekerja dengan [`docs/frontend/MOCK_DATA.md`](frontend/MOCK_DATA.md). Backend agent menguji AI dengan [`docs/ai/MOCK_PREDICTOR.md`](ai/MOCK_PREDICTOR.md). Masing-masing dapat berjalan dan diuji 100% tanpa menunggu subsistem lain selesai.
4. **Breaking Change Protocol:**
   Jika suatu perubahan memerlukan modifikasi pada `INTERFACES.md`, wajib melalui prosedur RFC (Request for Comments) yang didokumentasikan di [`docs/universal/GIT_WORKFLOW.md`](universal/GIT_WORKFLOW.md).
