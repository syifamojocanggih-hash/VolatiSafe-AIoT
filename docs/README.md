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
├── hardware/                          <-- DOMAIN 1: HARDWARE & EDGE FIRMWARE
│   ├── README.md                      <-- Lingkup, wewenang & zona terlarang Hardware AI
│   ├── PINOUT_AND_SCHEMATICS.md       <-- Skema rangkaian ESP32, sensor probe, & power gate
│   ├── FIRMWARE_SPEC.md               <-- Algoritma burst sampling, kalibrasi, & deep sleep
│   ├── TELEMETRY_PAYLOAD.md           <-- Spesifikasi bit-packing LoRa & gateway unpacking
│   └── WOKWI_SIMULATION.md            <-- Panduan virtual testbed Wokwi & 3 skenario demo juri
│
├── ai/                                <-- DOMAIN 2: AGRO-CLIMATIC DIGITAL TWIN & AI ENGINE
│   ├── README.md                      <-- Lingkup, wewenang & zona terlarang AI/ML Agent
│   ├── DIGITAL_TWIN.md                <-- Neraca air tanah FAO-56 & difusi panas kontinyu
│   ├── MODEL_SPEC.md                  <-- Physics-Informed ML (PIML) LightGBM & AVRI formula
│   ├── EXPLAINABILITY_SHAP.md         <-- TreeSHAP computation & mapping narasi petani
│   └── MOCK_PREDICTOR.md              <-- Script mock predictor untuk isolasi backend/frontend
│
├── backend/                           <-- DOMAIN 3: BACKEND SERVICES, INGESTION & DB
│   ├── README.md                      <-- Lingkup, wewenang & zona terlarang Backend AI
│   ├── DATABASE_SCHEMA.md             <-- PostgreSQL & TimescaleDB hypertable schema
│   ├── INGESTION_PIPELINE.md          <-- MQTT broker, LoRa adapter, & deduplication queue
│   ├── API_SPECIFICATION.md           <-- Kontrak REST API FastAPI (Request/Response DTO)
│   ├── WEBSOCKET_AND_ALERTS.md        <-- Streaming live telemetri & gateway bot WhatsApp/Telegram
│   └── SETUP.md                       <-- Panduan setup Docker (Postgres, Timescale, Mosquitto)
│
└── frontend/                          <-- DOMAIN 4: PRESENTATION LAYER & DASHBOARD
    ├── README.md                      <-- Lingkup, wewenang & zona terlarang Frontend AI
    ├── DESIGN_SYSTEM.md               <-- Design tokens, palet status AVRI, & tipografi
    ├── PAGE_STATES.md                 <-- Spesifikasi UI State 5 layar utama & what-if simulator
    ├── UI_COMPONENTS.md               <-- Katalog komponen reusable (Card, Chart, Map, Banner)
    ├── MOCK_DATA.md                   <-- Fixture JSON offline untuk dev frontend independen
    └── SETUP.md                       <-- Panduan setup Next.js 14, Tailwind, & PWA
```

---

## 2. Matriks Wewenang & Batasan AI Agent (Boundary Matrix)

Untuk menghindari kerusakan silang (*cross-domain regression*), setiap AI agent memiliki batasan yang tidak boleh dilanggar:

| Domain AI | Fokus Tugas Utama | Folder Boleh Ditulis | Zona Terlarang (DILARANG KERAS) | Titik Kontak Resmi |
|---|---|---|---|---|
| **Hardware AI** | Firmware ESP32, driver sensor, LoRa SX1278, Wokwi virtual node, manajemen daya | `firmware/`, `simulation/wokwi/`, `docs/hardware/` | Dilarang menyentuh kode database, API backend, atau UI frontend | Mengirim payload JSON/byte ke topik MQTT Gateway via `docs/universal/INTERFACES.md` §1 |
| **AI / Digital Twin AI** | Model LightGBM, persamaan fisika FAO-56, inferensi AVRI, TreeSHAP, Digital Twin state | `ai_engine/`, `digital_twin/`, `models/`, `docs/ai/` | Dilarang query database langsung atau membuat route endpoint HTTP publik | Menghasilkan DTO inferensi standar melalui Python interface di `docs/universal/INTERFACES.md` §2 |
| **Backend AI** | MQTT ingestion broker, TimescaleDB, REST API FastAPI, WebSocket, WhatsApp/Telegram bot | `backend/`, `migrations/`, `docker/`, `docs/backend/` | Dilarang memodifikasi firmware hardware atau styling frontend | Mengekspos REST DTO & WebSocket stream sesuai `docs/universal/INTERFACES.md` §3 |
| **Frontend AI** | Next.js 14 Dashboard, PWA, peta Leaflet bedeng, Recharts, What-If simulator, UX petani | `frontend/`, `public/`, `docs/frontend/` | Dilarang menyambung langsung ke database atau mendikte struktur payload LoRa | Mengonsumsi endpoint FastAPI dan data mock via `docs/universal/INTERFACES.md` §3 |

---

## 3. Empat Aturan Emas Anti-Tabrakan (*Golden Rules*)

1. **Contract-First Development (Single Source of Truth):**
   Semua bentuk data yang melintasi batas domain didefinisikan secara mutlak di [`docs/universal/INTERFACES.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/universal/INTERFACES.md). Tidak ada agent yang boleh mengubah struktur data tanpa persetujuan lintas domain.
2. **Anti-Corruption Layer (Adapter Pattern):**
   Perubahan pada level sensor/hardware (misal: ganti pin atau format paket LoRa) **hanya boleh ditangani oleh Adapter di Gateway/Ingestion**. Logika inti backend, AI, dan frontend tidak boleh terpengaruh.
3. **Mock-Driven Decoupling:**
   Frontend agent bekerja dengan [`docs/frontend/MOCK_DATA.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/frontend/MOCK_DATA.md). Backend agent menguji AI dengan [`docs/ai/MOCK_PREDICTOR.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/ai/MOCK_PREDICTOR.md). Masing-masing dapat berjalan dan diuji 100% tanpa menunggu subsistem lain selesai.
4. **Breaking Change Protocol:**
   Jika suatu perubahan memerlukan modifikasi pada `INTERFACES.md`, wajib melalui prosedur RFC (Request for Comments) yang didokumentasikan di [`docs/universal/GIT_WORKFLOW.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/universal/GIT_WORKFLOW.md).
