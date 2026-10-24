# BOUNDARIES_AND_CONTRACTS.md — Tata Kelola Batasan Sistem & Anti-Tabrakan Antar-AI

> **STATUS:** SUMBER KEBENARAN ARSITEKTURAL MUTLAK  
> Dokumen ini adalah acuan tata kelola boundary untuk proyek **VolatiSafe AIoT**. Setiap pengembang maupun AI Coding Assistant (Hardware AI, AI/Digital Twin AI, Backend AI, Frontend AI) **WAJIB** tunduk pada batasan, hak akses, dan protokol komunikasi yang diatur di sini.

---

## 1. Filosofi Isolasi Multi-AI

Proyek VolatiSafe AIoT dikembangkan secara modular menggunakan AI coding assistant yang dapat ditugaskan secara terpisah untuk tiap domain:
1. **Hardware AI** (ESP32, LoRa, Sensor, Wokwi)
2. **AI & Digital Twin AI** (Neraca Fisika FAO-56, LightGBM, TreeSHAP)
3. **Backend AI** (FastAPI, TimescaleDB, MQTT Broker, Bot WhatsApp/Telegram)
4. **Frontend AI** (Next.js 14, Leaflet Map, Recharts, PWA Dashboard)

Tanpa tata kelola batas yang ketat, modifikasi pada satu komponen dapat menyebabkan efek domino kegagalan (*cascading failures*). Oleh karena itu, diterapkan prinsip:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DEPENDENCY GRAPH & FLOW                          │
│                                                                             │
│  [ Hardware AI ]           [ AI / Digital Twin AI ]                         │
│   (ESP32 / LoRa)           (PIML LightGBM & FAO-56)                         │
│         │                             ▲                                     │
│         │ Telemetry Payload           │ Feature DTO / State Vector          │
│         ▼ (Contract 1)                ▼ (Contract 2)                        │
│  ┌────────────────────────────────────────────────────────┐                 │
│  │                     [ Backend AI ]                     │                 │
│  │   (FastAPI / Ingestion Adapter / TimescaleDB Engine)   │                 │
│  └────────────────────────────────────────────────────────┘                 │
│                               ▲                                             │
│                               │ REST API / WebSocket Stream (Contract 3)    │
│                               ▼                                             │
│                       [ Frontend AI ]                                       │
│                 (Next.js Dashboard & PWA)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **Hukum Utama:** Tidak ada komunikasi langsung antar-cabang tepi (*no edge-to-edge bypassing*). Hardware AI **tidak pernah** berbicara langsung dengan Frontend AI. AI Engine **tidak pernah** menerima koneksi HTTP langsung dari browser. Semua alur diorkestrasi melalui Backend Anti-Corruption Layer.

---

## 2. Definisi Batasan & Hak Akses per AI Agent

### 2.1 Hardware / Edge AI Agent

| Atribut | Ketetapan |
|---|---|
| **Area Kerja** | `firmware/`, `simulation/wokwi/`, `docs/hardware/` |
| **Tanggung Jawab** | Akuisisi sensor, kalibrasi analog-ke-fisik, sampling burst median filter, penghematan daya (deep sleep), transmisi LoRa SX1278, dan simulasi Wokwi. |
| **Output Resmi** | Paket telemetri terkompresi ke topik MQTT Gateway (`/volatisafe/v1/node/{node_id}/telemetry`). |
| **Zona Terlarang** | ❌ DILARANG menyentuh kode backend (FastAPI), skema database (SQL/TimescaleDB), modul ML, atau file UI frontend.<br>❌ DILARANG mengubah struktur field JSON payload LoRa tanpa membuat *Adapter* penerjemah di gateway backend. |

### 2.2 AI & Digital Twin Agent

| Atribut | Ketetapan |
|---|---|
| **Area Kerja** | `ai_engine/`, `digital_twin/`, `models/`, `docs/ai/` |
| **Tanggung Jawab** | Implementasi neraca air tanah FAO-56, model difusi termal damped, estimasi imputasi saat sensor dropout, model LightGBM regresi residual, formulasi kinetika urease PIML, dan perhitungan TreeSHAP. |
| **Output Resmi** | Python Callable Function / Service Interface yang menerima `FeatureVectorDTO` dan mengembalikan `PredictionResultDTO` (AVRI score, klasifikasi risiko, dan atribusi SHAP). |
| **Zona Terlarang** | ❌ DILARANG membuka koneksi database langsung (`psycopg2`, `SQLAlchemy`, dsb). AI menerima data bersih dari backend via argumen DTO.<br>❌ DILARANG membuat server HTTP publik sendiri.<br>❌ DILARANG memodifikasi kode frontend atau firmware ESP32. |

### 2.3 Backend & Ingestion AI Agent

| Atribut | Ketetapan |
|---|---|
| **Area Kerja** | `backend/`, `migrations/`, `docker/`, `docs/backend/` |
| **Tanggung Jawab** | MQTT broker bridge, penerjemah paket LoRa (Anti-Corruption Adapter), penyimpanan TimescaleDB & PostgreSQL, pemanggilan orkestrasi AI Engine, penyedia REST API & WebSocket, dan dispatcher bot notifikasi (WhatsApp/Telegram). |
| **Output Resmi** | REST API endpoints (`/api/v1/...`) dan WebSocket stream (`/ws/v1/live`) dengan JSON envelope standar. |
| **Zona Terlarang** | ❌ DILARANG mengubah logika algoritma fisika urease atau membongkar model AI internal.<br>❌ DILARANG menulis styling CSS atau komponen UI frontend.<br>❌ DILARANG mendikte pinout mikrokontroler hardware. |

### 2.4 Frontend AI Agent

| Atribut | Ketetapan |
|---|---|
| **Area Kerja** | `frontend/`, `public/`, `docs/frontend/` |
| **Tanggung Jawab** | Penyajian visual Dashboard Petak, visualisasi peta poligon Leaflet, grafik tren Recharts, kalkulator pupuk multi-komponen, Dynamic DAT Tracker, panel simulasi What-If, dan kapabilitas offline PWA. |
| **Output Resmi** | Web Application SPA/PWA yang terisolasi dengan state management lokal (Zustand/React Query). |
| **Zona Terlarang** | ❌ DILARANG menjalankan query SQL atau koneksi langsung ke TimescaleDB.<br>❌ DILARANG membuat endpoint API mock palsu di backend (frontend wajib menggunakan layer mock lokal di `frontend/src/mocks/` jika backend offline).<br>❌ DILARANG memodifikasi logika AI atau firmware. |

---

## 3. Titik Kontrak & Lapisan Anti-Korupsi (*Anti-Corruption Layer*)

Untuk memastikan modifikasi pada satu modul tidak merusak modul lain, sistem menerapkan 3 lapis kontrak data:

```
[Hardware Node] ──(Payload Ringkas)──> [ Gateway Ingestion Adapter ] ──(Clean Telemetry)──> [ TimescaleDB ]
                                                                                                 │
                                   ┌─────────────────────────────────────────────────────────────┘
                                   ▼
                   [ AI Engine / Digital Twin DTO ]
                                   │ (Clean Inference Output)
                                   ▼
                      [ Backend Service Layer ]
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
         [ REST API DTO ]                   [ WebSocket Events ]
                 │                                   │
                 └─────────────────┬─────────────────┘
                                   ▼
                        [ Frontend Client Store ]
```

### 3.1 Kontrak 1: Hardware ↔ Backend (LoRa/MQTT Boundary)
- **Karakteristik:** Hemat bandwidth (paket ~52 byte untuk LoRa SF7 433 MHz).
- **Format:** Payload JSON ringkas atau biner terpadu (`n`, `ts`, `m`, `t`, `ph`, `b`).
- **Peredam Tabrakan (Decoupling Buffer):** Jika Hardware AI memutuskan mengganti jenis sensor (misal dari probe analog ke sensor RS485 Modbus) atau mengubah singkatan key, **Hardware AI hanya perlu memperbarui modul `backend/app/adapters/lora_adapter.py`**. Modul backend lainnya, AI engine, dan frontend tidak akan pernah tahu adanya perubahan fisik sensor.

### 3.2 Kontrak 2: Backend ↔ AI Engine (Inference & State Boundary)
- **Karakteristik:** In-process Python DTO (Pydantic models) atau internal micro-endpoint.
- **Input:** `TelemetryStateDTO` + `WeatherDataDTO` + `CropCycleDTO`.
- **Output:** `AVRIPredictionDTO` (`avri_score`, `risk_class`, `shap_values`, `prescription_text`).
- **Peredam Tabrakan (Decoupling Buffer):** Jika AI Agent memperbarui arsitektur model (misal menambahkan lapisan neural residual atau tuning hiperparameter LightGBM), backend dan frontend **TIDAK TERDAMPAK** selama struktur output `AVRIPredictionDTO` tetap dipatuhi.

### 3.3 Kontrak 3: Backend ↔ Frontend (REST & WebSocket Boundary)
- **Karakteristik:** Standard JSON envelope (`data`, `meta`, `error`), HTTP status codes, dan schema type-safe (TypeScript types di-generate dari OpenAPI schema).
- **Peredam Tabrakan (Decoupling Buffer):** Jika Backend AI melakukan optimasi indeks TimescaleDB, denormalisasi tabel, atau migrasi database, Frontend AI **TIDAK TERDAMPAK** karena REST API serializer tetap mengembalikan struktur DTO yang sama.

---

## 4. Simulasi Skenario Perubahan: Mengapa Tidak Pernah Tabrakan?

Berikut pembuktian teknis bagaimana aturan ini mencegah konflik (*zero collision*):

| Skenario Nyata | Subsistem Berubah | Penanganan Tanpa Efek Samping | Status Modul Lain |
|---|---|---|---|
| **Skenario 1:** Penggantian sensor pH tanah analog ke sensor RS485 industri. | **Hardware AI** | Hardware memperbarui sketch ESP32 dan format payload bit. Backend memperbarui fungsi `unpack_lora_payload()` di `lora_adapter.py`. | **AI Engine & Frontend 100% untouched.** Tidak ada perubahan tabel DB maupun UI. |
| **Skenario 2:** AI Agent mengubah model LightGBM dan menambahkan fitur kecepatan angin $u_2$. | **AI Agent** | AI memperbarui script training dan menambahkan field opsional `wind_speed` di `FeatureVectorDTO` dengan nilai default. | **Hardware & Frontend 100% untouched.** Firmware tidak perlu kirim data angin (karena diambil otomatis dari API BMKG oleh backend). |
| **Skenario 3:** Backend memigrasikan tabel telemetri dari PostgreSQL standar ke TimescaleDB hypertable dengan partisi 7 hari. | **Backend AI** | Backend menjalankan migrasi Alembic dan mengubah query internal di `telemetry_repository.py`. DTO output `/api/v1/nodes/{id}/telemetry` tetap identik. | **Hardware, AI, & Frontend 100% untouched.** Tidak ada breaking changes pada API. |
| **Skenario 4:** Frontend mendesain ulang dashboard dari sistem grid ke sistem modular tab dan menambahkan dark mode. | **Frontend AI** | Frontend mengubah komponen React/Tailwind di `frontend/src/components/`. Semua data bersumber dari REST API yang ada. | **Hardware, Backend, & AI 100% untouched.** Zero backend work required. |

---

## 5. Strategi Failover & Penahanan Dampak Kerusakan (*Blast Radius Containment*)

Jika salah satu subsistem mengalami anomali saat demo atau pengoperasian, sistem tidak boleh tumbang secara total (*graceful degradation*):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FAILURE CONTAINMENT MATRIX                           │
├───────────────────┬──────────────────────────────┬──────────────────────────┤
│ Titik Kegagalan   │ Respon Penanganan Otomatis   │ Dampak ke Pengguna       │
├───────────────────┼──────────────────────────────┼──────────────────────────┤
│ Sensor Fisik Mati │ Digital Twin FAO-56 aktif    │ Data diberi label        │
│ / Blank Spot LoRa │ melakukan imputasi nilai     │ `[Est-Simulated]`        │
│                   │ berdasarkan model deret waktu│ Dashboard tetap live     │
├───────────────────┼──────────────────────────────┼──────────────────────────┤
│ Model AI Error /  │ Fallback ke aturan fisika    │ Preskripsi tetap aman    │
│ Outlier Ekstrem   │ dasar: "Jika T > 32°C &      │ sistem mencatat warning  │
│                   │ Moisture < 25%, AVRI = 80%"  │ di log audit model       │
├───────────────────┼──────────────────────────────┼──────────────────────────┤
│ Jaringan Internet │ Frontend PWA membaca cache   │ Petani tetap bisa        │
│ Desa Terputus     │ Service Worker (data ter-    │ melihat data terakhir &  │
│                   │ akhir & kalender tanam lokal)│ kalkulator offline       │
└───────────────────┴──────────────────────────────┴──────────────────────────┘
```

---

## 6. Protokol Perubahan Kontrak (Breaking Change Protocol)

Jika suatu pengembangan **benar-benar mewajibkan** perubahan pada `INTERFACES.md`, berikut alur yang wajib dilalui sebelum kode ditulis:

1. **Buat Usulan RFC Singkat:** Ajukan issue atau catatan proposal perubahan skema (sebutkan alasan, field yang diubah/dihapus, dan mitigasi kompatibilitas mundur).
2. **Backward Compatibility First:** Tambahkan field baru sebagai *nullable / optional*, jangan pernah langsung menghapus field lama yang sedang aktif dikonsumsi subsistem lain.
3. **Pembaruan Dokumen Terlebih Dahulu:** File `docs/universal/INTERFACES.md` diubah dan disepakati terlebih dahulu.
4. **Pembaruan Mock Fixtures:** Modul `docs/frontend/MOCK_DATA.md` dan `docs/ai/MOCK_PREDICTOR.md` disinkronkan.
5. **Implementasi Bertahap:** Implementasi perubahan di backend terlebih dahulu, baru kemudian di frontend atau hardware.
