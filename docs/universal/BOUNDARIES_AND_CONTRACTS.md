# BOUNDARIES_AND_CONTRACTS.md — Tata Kelola Batasan Sistem & Anti-Tabrakan Antar-AI

> **STATUS:** SUMBER KEBENARAN ARSITEKTURAL MUTLAK  
> Dokumen ini adalah acuan tata kelola boundary untuk proyek **VolatiSafe AIoT**. Setiap pengembang maupun AI Coding Assistant (Hardware AI, AI/Digital Twin AI, Backend AI, Frontend AI) **WAJIB** tunduk pada batasan, hak akses, dan protokol komunikasi yang diatur di sini.

---

## 1. Filosofi Isolasi Multi-Domain & Pembagian 4 Anggota Tim

Proyek VolatiSafe AIoT dikembangkan secara modular dengan pembagian kepemilikan tanggung jawab yang tegas kepada 4 anggota tim pengembang:
1. **Domain IoT & Embedded Hardware:** Hadi M. Hafiiz Hilmi (Hafiiz)
2. **Domain Digital Twin Engine:** Andharu Raffi (Andharu)
3. **Domain Fullstack Development (Backend & Frontend):** Syifa (Syifa)
4. **Domain AI Engineer & System Architecture (Team Lead):** Aris Kurniawan (Aris)

Setiap anggota tim memiliki zona kerja (*Read/Write Zone*), zona terlarang (*Forbidden Zone*), dan kontrak antarmuka yang mengikat. Hal ini menjamin bahwa pengerjaan oleh 4 orang dapat berjalan paralel secara serempak tanpa saling menunggu atau merusak (*zero-collision development*).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DEPENDENCY GRAPH & FLOW                          │
│                                                                             │
│  [ IoT: Hafiiz ]              [ Digital Twin: Andharu ]                     │
│  ESP32, Sensor & LoRa         FAO-56 & State Imputation                     │
│         │                                  ▲                                │
│         │ Telemetry Payload 52-byte        │ State Vector Replay            │
│         ▼ (Contract 1)                     ▼ (Contract 2)                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        [ Fullstack: Syifa ]                           │  │
│  │   • Backend: FastAPI, Ingestion Adapter, TimescaleDB & Bot            │  │
│  │   • Frontend: Next.js PWA, Leaflet Map, Recharts & What-If UI         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                            ▲                                │
│                                            │ Feature Vector DTO             │
│                                            ▼ (Contract 2)                   │
│                              [ AI Engineer: Aris (Lead) ]                   │
│                              Physics-Informed ML (PIML), AVRI & TreeSHAP    │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **Hukum Utama:** Tidak ada komunikasi pintas (*no bypassing*). IoT node yang dikerjakan Hafiiz **tidak pernah** berhubungan langsung dengan frontend Syifa. Model AI yang dikerjakan Aris **tidak pernah** dipanggil langsung oleh browser tanpa melalui API Gateway backend Syifa. Semua alur data diikat oleh kontrak `INTERFACES.md`.

---

## 2. Definisi Batasan & Hak Akses per Anggota Tim

### 2.1 Domain IoT & Embedded Hardware (PIC: Hafiiz)

| Atribut | Ketetapan |
|---|---|
| **Penanggung Jawab** | **Hadi M. Hafiiz Hilmi (Hafiiz)** |
| **Area Akses R/W** | `firmware/`, `simulation/wokwi/`, `docs/hardware/` |
| **Tanggung Jawab** | Akuisisi sensor tanah (Moisture, Temp, pH), kalibrasi analog-ke-fisik, sampling burst median filter, manajemen daya (deep sleep 15 menit), transmisi radio LoRa SX1278 433 MHz, dan simulasi Wokwi virtual testbed. |
| **Output Resmi** | Paket telemetri LoRa 52-byte terkompresi ke gateway lokal yang diteruskan ke broker MQTT (`/volatisafe/v1/node/{node_id}/telemetry`). |
| **Zona Terlarang** | ❌ DILARANG memodifikasi kode backend (FastAPI), skema database (TimescaleDB), model AI/ML, atau file UI frontend.<br>❌ DILARANG mengubah struktur bit-packing LoRa tanpa koordinasi melalui kontrak `INTERFACES.md` §1. |

### 2.2 Domain Digital Twin (PIC: Andharu)

| Atribut | Ketetapan |
|---|---|
| **Penanggung Jawab** | **Andharu Raffi (Andharu)** |
| **Area Akses R/W** | `digital_twin/`, `simulations/data_replay/`, `docs/ai/DIGITAL_TWIN.md` |
| **Tanggung Jawab** | Implementasi neraca air tanah perakaran FAO-56 ($ET_0$ Penman-Monteith), model perambatan termal tanah teredam (*damped*), modul imputasi failover saat sensor *offline* (`[Est-Simulated]`), dan pemutaran ulang (*replay*) data klimatologi historis BMKG Lampung. |
| **Output Resmi** | Vektor state tanah virtual kontinu (`FieldStateDTO`) yang disuplai ke backend database dan AI Engine. |
| **Zona Terlarang** | ❌ DILARANG membongkar algoritma machine learning LightGBM atau merombak formula AVRI.<br>❌ DILARANG membuka koneksi langsung ke hardware ESP32 atau menulis komponen UI dashboard.<br>❌ DILARANG mengubah format output DTO di luar ketentuan `INTERFACES.md` §3. |

### 2.3 Domain Fullstack Development: Backend & Frontend (PIC: Syifa)

| Atribut | Ketetapan |
|---|---|
| **Penanggung Jawab** | **Syifa (Syifa)** |
| **Area Akses R/W** | `backend/`, `frontend/`, `migrations/`, `docker/`, `docs/backend/`, `docs/frontend/` |
| **Tanggung Jawab** | <br>• **Backend:** Ingestion MQTT bridge, pemetaan paket LoRa (Anti-Corruption Adapter), persistensi PostgreSQL & TimescaleDB hypertable, integrasi service AI Engine, penyedia REST API (`/api/v1/...`) & WebSocket, serta webhook notifikasi WhatsApp (Wablas/Fonnte) dan Telegram Bot.<br>• **Frontend:** Next.js 14 App Router, PWA installable, visualisasi peta petak Leaflet, grafik tren Recharts, UI Dynamic DAT Tracker, UI Multi-Fertilizer Blender (konversi karung & ember), dan panel simulasi What-If. |
| **Output Resmi** | Layanan Backend REST/WebSocket yang stabil dan Aplikasi Web PWA yang responsif dan ramah sinyal lambat desa. |
| **Zona Terlarang** | ❌ DILARANG mengubah formula kinetika kimia enzim urease atau merusak pipeline pelatihan model AI.<br>❌ DILARANG mengubah skema payload sensor hardware tanpa adapter penerjemah.<br>❌ DILARANG melanggar amplop response `{ "data": ..., "meta": ... }` di REST API. |

### 2.4 Domain AI Engine & System Architecture (PIC: Aris / Lead)

| Atribut | Ketetapan |
|---|---|
| **Penanggung Jawab** | **Aris Kurniawan (Aris / Koordinator Teknis)** |
| **Area Akses R/W** | `ai_engine/`, `models/`, `docs/ai/` (MODEL_SPEC, EXPLAINABILITY_SHAP, MOCK_PREDICTOR), dan seluruh `docs/universal/` |
| **Tanggung Jawab** | Arsitek sistem dan penjamin keutuhan kontrak antarmuka, implementasi model Physics-Informed ML (PIML), integrasi persamaan Arrhenius kinetika urease dengan LightGBM Regressor, formulasi skor AVRI (0–100%), penjelasan TreeSHAP, dan pengujian akurasi prediksi. |
| **Output Resmi** | Model PIML terlatih (`avri_model.txt`), modul inferensi Python (`predict_avri`), serta pemeliharaan *Single Source of Truth* dokumen universal (`INTERFACES.md`, `BOUNDARIES_AND_CONTRACTS.md`, `DECISIONS.md`, `PRD.md`). |
| **Zona Terlarang** | ❌ DILARANG mengubah implementasi internal firmware atau styling CSS frontend secara sepihak di luar perjanjian antarmuka `INTERFACES.md`. |

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
