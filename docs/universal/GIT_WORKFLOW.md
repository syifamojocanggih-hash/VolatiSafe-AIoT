# GIT_WORKFLOW.md — Alur Kolaborasi Role-Based & Struktur Repositori

> **STATUS:** STANDAR TATA KELOLA KODE & REPOSITORI RESMI  
> Dokumen ini adalah acuan mutlak untuk arsitektur repositori Git, pembagian kepemilikan folder, dan strategi pencabangan **Role-Based Branching (1 Role = 1 Branch)** agar kolaborasi 4 pengembang berjalan cepat, bebas overhead, dan bebas konflik (*zero-collision Development*).

---

## 1. Peta Struktur Direktori Fisik Repositori

Untuk menjamin prinsip **Multi-Domain Isolation Architecture**, setiap modul kode dan dokumentasi memiliki pemilik (*code owner*) tunggal:

```
VolatiSafe-AIoT/
│
├── PRD_VolatiSafe_AIoT_v1.md          # Dokumen PRD Utama (Master Spec 15 Seksi)
├── README.md                          # Dokumentasi Root & Panduan Memulai Cepat
│
├── docs/                              # DOKUMENTASI TEKNIS BERSIFAT MODULAR
│   ├── README.md                      # Master Index, Arsitektur 5 Domain & Matriks Wewenang
│   │
│   ├── universal/                     # [KONTRAK GLOBAL — LEAD: ARIS]
│   │   ├── ARCHITECTURE.md            # Arsitektur sistem 4 lapis & aliran data tertutup
│   ├── BOUNDARIES_AND_CONTRACTS.md# Matriks wewenang R/W 4 anggota tim & anti-tabrakan
│   ├── INTERFACES.md              # SUMBER KEBENARAN TUNGGAL skema data (LoRa, REST, DTO)
│   ├── LAB_VALIDATION_PROTOCOL.md # Protokol uji validasi lab & 3 skenario stres simulasi (TKT 3)
│   ├── PROJECT_CONTEXT.md         # Problem statement, research gap, & lokus Lampung/Lamongan
│   │   ├── PRD.md                     # Ringkasan spesifikasi kebutuhan produk
│   │   ├── DECISIONS.md               # Architecture Decision Records (ADR 001 s.d ADR 008)
│   │   ├── GIT_WORKFLOW.md            # Dokumen ini (Alur Git Role-Based & struktur direktori)
│   │   └── ROADMAP.md                 # Jadwal kerja TKT 3 (7 hari software) ke TKT 6 (12 bulan)
│   │
│   ├── hardware/                      # [DOMAIN 1: HARDWARE & EDGE — PIC: HAFIIZ]
│   │   ├── README.md                  # Mandat peran, batasan, & zona terlarang Hafiiz
│   │   ├── TASK_GUIDE.md                  # Panduan tugas langkah demi langkah HW-1.1 s.d HW-1.5
│   │   ├── PINOUT_AND_SCHEMATICS.md   # Skema rangkaian ESP32, sensor probe, & power gate
│   │   ├── FIRMWARE_SPEC.md           # Algoritma burst sampling median filter, kalibrasi, & sleep
│   │   ├── TELEMETRY_PAYLOAD.md       # Spesifikasi bit-packing LoRa 52-byte & unpacking
│   │   └── WOKWI_SIMULATION.md        # Panduan virtual testbed Wokwi & 3 skenario demo juri
│   │
│   ├── digital_twin/                  # [DOMAIN 2: AGRO-CLIMATIC DIGITAL TWIN — PIC: ANDHARU]
│   │   ├── README.md                  # Mandat peran, batasan, & zona terlarang Andharu
│   │   ├── TASK_GUIDE.md              # Panduan tugas langkah demi langkah DT-1.1 s.d DT-1.5
│   │   ├── FAO56_WATER_BALANCE.md     # Formulasi neraca air perakaran FAO-56 Penman-Monteith & Kc
│   │   ├── THERMAL_DIFFUSION.md       # Model konduksi panas tanah teredam 1D Fourier & inersia
│   │   ├── FAILOVER_IMPUTATION.md     # Mesin imputasi state saat sensor offline / dropout (>30 mnt)
│   │   └── WEATHER_REPLAY.md          # Protokol replay cuaca BMKG Lampung & tabel data_provenance
│   │
│   ├── ai/                            # [DOMAIN 3: AI ENGINE & PIML — PIC: ARIS]
│   │   ├── README.md                  # Mandat peran, batasan, & zona terlarang Aris
│   │   ├── TASK_GUIDE.md              # Panduan tugas langkah demi langkah AI-1.1 s.d AI-1.6
│   │   ├── MODEL_SPEC.md              # Physics-Informed ML (PIML), kinetika urease, & AVRI
│   │   ├── EXPLAINABILITY_SHAP.md     # Perhitungan TreeSHAP & pemetaan narasi edukasi petani
│   │   └── MOCK_PREDICTOR.md          # Skrip mock predictor terisolasi untuk tes backend
│   │
│   ├── backend/                       # [DOMAIN 4: BACKEND SERVICES & DB — PIC: SYIFA]
│   │   ├── README.md                  # Mandat peran, batasan, & zona terlarang Syifa (Backend)
│   │   ├── TASK_GUIDE.md              # Panduan tugas langkah demi langkah BE-1.1 s.d BE-1.8
│   │   ├── DATABASE_SCHEMA.md         # Skema PostgreSQL & TimescaleDB hypertable
│   │   ├── INGESTION_PIPELINE.md      # MQTT subscriber worker, LoRa adapter, & deduplication
│   │   ├── API_SPECIFICATION.md       # Spesifikasi REST API FastAPI (Request/Response DTO)
│   │   ├── WEBSOCKET_AND_ALERTS.md    # Streaming live telemetri & gateway bot WhatsApp/Telegram
│   │   └── SETUP.md                   # Panduan setup Docker Compose (Postgres, Mosquitto)
│   │
│   └── frontend/                      # [DOMAIN 5: PRESENTATION LAYER & PWA — PIC: SYIFA]
│       ├── README.md                  # Mandat peran, batasan, & zona terlarang Syifa (Frontend)
│       ├── TASK_GUIDE.md              # Panduan tugas langkah demi langkah FE-1.1 s.d FE-1.8
│       ├── DESIGN_SYSTEM.md           # Tokens palet status AVRI (4 warna), tipografi, & aksesibilitas
│       ├── PAGE_STATES.md             # Spesifikasi UI state 5 layar utama 
│       ├── UI_COMPONENTS.md           # Katalog komponen reusable (Card, Chart, Map, Banner)
│       ├── MOCK_DATA.md               # Fixture JSON offline untuk dev frontend independen
│       └── SETUP.md                   # Panduan setup Next.js 14, Tailwind CSS, & PWA
│
├── firmware/                          # [KODE EDGE ESP32 & LORA — PIC: HAFIIZ]
├── simulation/wokwi/                  # [VIRTUAL TESTBED HARDWARE — PIC: HAFIIZ]
├── digital_twin/                      # [KODE BIOFISIKA TANAH KONTINU — PIC: ANDHARU]
├── simulations/data_replay/           # [SIMULASI REPLAY ATMOSFER BMKG — PIC: ANDHARU]
├── ai_engine/                         # [KODE PIML & INFERENSI ML — PIC: ARIS]
├── models/                            # [FILE ARTIFAK MODEL TERKOMPILASI — PIC: ARIS]
├── backend/                           # [KODE SERVER REST, WS & INGESTION — PIC: SYIFA]
├── docker/                            # [KONFIGURASI KONTAINER LOKAL — PIC: SYIFA]
├── migrations/                        # [ALEMBIC DATABASE MIGRATIONS — PIC: SYIFA]
├── frontend/                          # [KODE APLIKASI WEB PWA — PIC: SYIFA]
└── public/                            # [ASET STATIS GLOBAL REPOSITORI]
```

---

## 2. Strategi Pencabangan Sederhana (Role-Based Branching)

Untuk efisiensi kerja tim 4 orang dengan batas waktu kompetisi yang ketat, repositori **TIDAK MENGGUNAKAN** puluhan branch mikro. Sistem menggunakan model **1 Role = 1 Dedicated Branch**:

```
main (Production / Stable TKT 3 Demo / Final Submission)
  ▲
  │ (Merge resmi setelah lolos integrasi sistem)
  │
Development (Staging / Integrasi Seluruh Modul Tim)
  ▲
  ├── iot            <-- Dikelola Hafiiz (Hardware, ESP32, Wokwi, Sensor, LoRa)
  ├── digittal-twin   <-- Dikelola Andharu (FAO-56, Neraca Air, Difusi Termal, Replay BMKG)
  ├── full-stack      <-- Dikelola Syifa (FastAPI Backend + Next.js PWA Frontend + DB)
  └── ai             <-- Dikelola Aris (Physics-Informed ML, LightGBM, AVRI, TreeSHAP)
```

---

## 3. Matriks Kepemilikan Cabang Resmi

Hanya ada **6 cabang aktif** di seluruh repositori:

| Nama Branch | Penanggung Jawab | Wewenang Folder Kerja (R/W) | Konten Pekerjaan |
|---|---|---|---|
| **`main`** | **Aris** (Lead) | Seluruh Repositori (Protected) | Kode final stabil yang siap didemonstrasikan ke juri dan disubmit ke portal lomba. |
| **`Development`** | **Seluruh Tim** | Seluruh Repositori (Integration) | Cabang staging tempat bertemunya integrasi 4 cabang role sebelum rilis ke `main`. |
| **`iot`** | **Hadi M. Hafiiz Hilmi (Hafiiz)** | `firmware/`, `simulation/wokwi/`, `docs/hardware/` | Seluruh kode C++ PlatformIO, driver sensor tanah, bit-packing LoRa 52-byte, dan simulasi Wokwi. |
| **`digittal-twin`**| **Andharu Raffi (Andharu)** | `digital_twin/`, `simulations/data_replay/`, `docs/digital_twin/` | Model neraca air FAO-56 Penman-Monteith, model difusi termal damped, engine failover imputasi, dan replay data BMKG. |
| **`full-stack`** | **Syifa (Syifa)** | `backend/`, `frontend/`, `docker/`, `migrations/`, `docs/backend/`, `docs/frontend/` | Server FastAPI, koneksi TimescaleDB, MQTT ingestion worker, WebSocket live, PWA Next.js 14, peta Leaflet, UI DAT tracker, . |
| **`ai`** | **Aris Kurniawan (Aris / Lead)**| `ai_engine/`, `models/`, `docs/ai/`, `docs/universal/` | Model Physics-Informed ML (PIML), residual LightGBM, formulasi AVRI (0–100%), TreeSHAP, dan penjaga kontrak `INTERFACES.md`. |

---

## 4. Alur Kerja Harian Pengembang (Daily Workflow)

Dengan sistem 1 branch per role, setiap anggota tim bekerja sangat sederhana tanpa pusing memikirkan nama branch baru setiap hari:

### Langkah 1: Memulai Pekerjaan Harian
Di terminal lokal masing-masing, masuk ke cabang role-nya dan sinkronkan perubahan terbaru dari `Development`:
```bash
# Contoh untuk Hafiiz (IoT):
git checkout iot
git pull origin Development

# Contoh untuk Syifa (Fullstack):
git checkout full-stack
git pull origin Development

# Contoh untuk Andharu (Digital Twin):
git checkout digittal-twin
git pull origin Development

# Contoh untuk Aris (AI):
git checkout ai
git pull origin Development
```

### Langkah 2: Menulis Kode & Commit Rutin
Kerjakan task sesuai folder wewenang masing-masing. Lakukan commit berkala menggunakan format pesan standar:
```bash
git add firmware/
git commit -m "feat(iot): implement 5x burst sampling with median filter"
git push origin iot
```

### Langkah 3: Integrasi ke Cabang `Development` (Sesuai Urutan Matriks)
Ketika satu tonggak fitur selesai (misal: simulasi Wokwi selesai atau REST API selesai), lakukan integrasi ke `Development` mengikuti urutan sekuensial yang tertuang dalam [**`docs/universal/INTEGRATION_RUNBOOK.md`**](INTEGRATION_RUNBOOK.md):
* **Tahap 1:** `iot` $\rightarrow$ `Development` (Fondasi Telemetri & Wokwi)
* **Tahap 2:** `digittal-twin` $\rightarrow$ `Development` (Fisika FAO-56 & Replay BMKG)
* **Tahap 3:** `ai` $\rightarrow$ `Development` (Model LightGBM & Inference Service)
* **Tahap 4:** `full-stack` $\rightarrow$ `Development` (FastAPI Ingestion & Next.js PWA)

### Langkah 4: Uji Integrasi Sistemik & Rilis ke `main`
Di cabang `Development`, seluruh modul (Wokwi $\rightarrow$ Ingestion $\rightarrow$ Digital Twin $\rightarrow$ AI Engine $\rightarrow$ PWA Dashboard) diuji bersama menjalankan 3 skenario demo juri (Terik Ekstrem, Hujan Badai, Sensor Putus). Jika seluruh uji lulus, **Aris (Lead)** melakukan merge dari `Development` ke `main` dan membuat tag rilis `v1.0.0`. Prosedur lengkap mengacu pada [**`docs/universal/INTEGRATION_RUNBOOK.md`**](INTEGRATION_RUNBOOK.md).

---

## 5. Checklist Verifikasi Pull Request per Cabang Role

Sebelum sebuah cabang role di-merge ke `Development`, pastikan checklist berikut terpenuhi:

### 5.1 Checklist Cabang `iot` (Hafiiz)
- [ ] Kode C++ lulus kompilasi tanpa error di PlatformIO / Arduino IDE.
- [ ] Ukuran payload LoRa terverifikasi $\le 52$ byte sesuai `INTERFACES.md` §1.
- [ ] Sirkuit virtual Wokwi berhasil memancarkan telemetri ke MQTT broker `localhost:1883`.
- [ ] Tidak ada modifikasi file di luar folder `firmware/`, `simulation/wokwi/`, dan `docs/hardware/`.

### 5.2 Checklist Cabang `digittal-twin` (Andharu)
- [ ] Persamaan FAO-56 Penman-Monteith teruji matematis (kadar air $\theta$ berada di rentang wajar $10\% - 45\%$).
- [ ] Modul failover sukses mengisi celah data saat sensor putus dan menandai `is_predicted = true`.
- [ ] Generator streaming replay BMKG Lampung berjalan mulus tanpa memory leak.
- [ ] Tidak ada modifikasi file di luar folder `digital_twin/`, `simulations/data_replay/`, dan `docs/digital_twin/`.

### 5.3 Checklist Cabang `full-stack` (Syifa)
- [ ] Migrasi database Alembic berjalan sukses (*up* dan *down*).
- [ ] Ingestion adapter berhasil memproses paket LoRa Wokwi dan menyimpan ke hypertable TimescaleDB.
- [ ] REST API mematuhi amplop respons baku `{ "data": ..., "meta": ... }`.
- [ ] Frontend Next.js 14 lolos `npm run build` tanpa error linting.
- [ ] Peta Leaflet  responsif di layar HP.
- [ ] Tidak ada modifikasi file di luar folder `backend/`, `frontend/`, `docker/`, `migrations/`, `docs/backend/`, dan `docs/frontend/`.

### 5.4 Checklist Cabang `ai` (Aris)
- [ ] Formulasi kinetika Arrhenius urease dibatasi batas fisika (AVRI selalu di rentang $[0.0, 100.0]$).
- [ ] Model LightGBM menghasilkan latensi inferensi $\le 20$ ms.
- [ ] TreeSHAP menghasilkan arah tanda dampak yang logis (Suhu +, Lembap -, pH +).
- [ ] Skrip dataset builder terbukti bebas kebocoran waktu (*zero time-series leakage*).
- [ ] Tidak ada modifikasi file di luar folder `ai_engine/`, `models/`, `docs/ai/`, dan `docs/universal/`.

---

## 6. Aturan Perlindungan File Kontrak (`docs/universal/INTERFACES.md`)

File [`docs/universal/INTERFACES.md`](INTERFACES.md) adalah **Single Source of Truth Mutlak**.

1. **Dilarang Direct Edit di Cabang Role:** Anggota tim dilarang mengubah file ini secara sepihak di cabang `iot`, `digittal-twin`, atau `full-stack`.
2. **Prosedur Usulan Perubahan:** Jika membutuhkan atribut baru (misal: penambahan metrik sensor baru), usulan dibahas bersama Aris (Lead Architect). Aris yang akan memperbarui `INTERFACES.md` di cabang `ai` atau `Development` agar subsistem lain bersiap secara sinkron.
3. **Kompatibilitas Mundur:** Setiap field baru wajib bersifat opsional (`Optional / default None`).

---

## 7. Format Pesan Commit Konvensional (Conventional Commits)

```
<tipe>(<lingkup>): <deskripsi singkat dalam bentuk imperatif>

[Daftar Tipe Resmi]:
feat     : Penambahan fitur baru
fix      : Perbaikan bug atau galat logika
docs     : Perubahan atau pembaruan dokumentasi
refactor : Restrukturisasi kode tanpa mengubah fungsionalitas
test     : Penambahan unit test atau simulasi
chore    : Pembaruan dependensi atau konfigurasi build

[Contoh Commit yang Benar]:
feat(iot): implement 5x burst sampling with median filter
feat(dt): integrate fao-56 et0 calculation into digital twin state
feat(full-stack): add timescale hypertable migration and rest router
feat(full-stack): build  interactive slider component
feat(ai): train residual lightgbm model with monotone constraints
docs(universal): update branch strategy to role-based model
```
