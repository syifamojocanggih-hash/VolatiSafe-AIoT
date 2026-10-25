# GIT_WORKFLOW.md — Alur Kolaborasi Multi-AI & Pengendalian Versi Kontrak

> **STATUS:** STANDAR PENGEMBANGAN MULTI-CABANG  
> Dokumen ini mengatur tata kelola Git branching, perlindungan file kontrak global, dan prosedur integrasi agar kontribusi dari AI Agent yang berbeda tidak saling merusak.

---

## 1. Konvensi Cabang Git (Branching Strategy)

Setiap anggota tim pengembang wajib bekerja pada branch spesifik sesuai domain tanggung jawabnya:

```
main (Production / Stable TKT 3 Demo)
  │
  ├── feat/iot-firmware-sampling     <-- Dikerjakan Hafiiz (IoT)
  ├── feat/dt-fao56-water-balance    <-- Dikerjakan Andharu (Digital Twin)
  ├── feat/fullstack-dashboard-pwa   <-- Dikerjakan Syifa (Fullstack: BE + FE)
  └── feat/ai-piml-avri-engine       <-- Dikerjakan Aris (AI Engine / Lead)
```

### 1.1 Pola Penamaan Branch per Anggota Tim

| Awalan Branch | Penanggung Jawab | Domain Kerja | Contoh Nama Branch |
|---|---|---|---|
| `feat/iot-*` | **Hafiiz** | Sensor, firmware ESP32, LoRa, Wokwi | `feat/iot-burst-sampling`, `feat/iot-wokwi-mqtt-bridge` |
| `feat/dt-*` | **Andharu** | Digital Twin, FAO-56, BMKG replay, imputasi | `feat/dt-fao56-water-balance`, `feat/dt-failover-imputation` |
| `feat/fullstack-*` / `feat/be-*` / `feat/fe-*` | **Syifa** | Backend, TimescaleDB, REST, WebSocket, PWA UI | `feat/be-timescale-hypertable`, `feat/fe-leaflet-risk-map` |
| `feat/ai-*` | **Aris** (Lead) | PIML LightGBM, AVRI formula, TreeSHAP | `feat/ai-piml-residual-model`, `feat/ai-shap-explainer` |
| `contract/rfc-*`| **Aris** (Lead) / Tim | Usulan perubahan skema `INTERFACES.md` | `contract/rfc-add-wind-speed-metric` |
| `fix/*` | Seluruh Tim | Hotfix bug terisolasi sesuai wewenang | `fix/fe-chart-legend-wrap`, `fix/be-mqtt-reconnect` |

---

## 2. Aturan Perlindungan File Kontrak (`docs/universal/INTERFACES.md`)

File [`docs/universal/INTERFACES.md`](INTERFACES.md) adalah **Protected Asset**.

### 2.1 Aturan Ketat:
1. **Dilarang Direct Edit di Feature Branch:** Developer yang bekerja di branch fitur (`feat/iot-*`, `feat/dt-*`, atau `feat/fullstack-*`) **DILARANG SEPIHAK** mengedit `INTERFACES.md`.
2. **Prosedur RFC (Request for Comments):** Jika suatu fitur baru membutuhkan perubahan struktur data kontrak:
   - Buat branch khusus `contract/rfc-<nama-perubahan>`.
   - Diskusikan dan setujui bersama Aris (Lead Architect).
   - Perbarui `INTERFACES.md`, `MOCK_DATA.md`, dan `MOCK_PREDICTOR.md`.
   - Lakukan merge ke `main` terlebih dahulu sebelum branch implementasi kode dimulai.
3. **Kompatibilitas Mundur:** Field baru wajib bersifat opsional (`optional / default None`) agar subsistem lain yang belum diperbarui tidak mengalami crash.

---

## 3. Checklist Pull Request (PR) per Anggota Tim

Sebelum kode dari branch digabungkan ke `main`, lakukan verifikasi checklist:

### 3.1 Checklist PR IoT & Hardware (`feat/iot-*` — Hafiiz)
- [ ] Kode C++ lolos kompilasi tanpa warning di PlatformIO / Arduino IDE.
- [ ] Verifikasi ukuran payload LoRa tidak melebihi 52 byte.
- [ ] Simulasi Wokwi berjalan normal dan data terkirim ke MQTT `localhost:1883`.
- [ ] Tidak ada modifikasi file di luar `firmware/`, `simulation/wokwi/`, dan `docs/hardware/`.

### 3.2 Checklist PR Digital Twin (`feat/dt-*` — Andharu)
- [ ] Model neraca air tanah FAO-56 ($ET_0$) teruji matematis pada rentang kelembaban wajar (10–50% VWC).
- [ ] Modul failover sukses mengisi celah data (*imputation*) saat sensor offline dan menandai `is_predicted: true`.
- [ ] Skrip replay data BMKG Lampung berjalan mulus tanpa memory leak.
- [ ] Tidak ada modifikasi file di luar `digital_twin/`, `simulations/data_replay/`, dan `docs/ai/DIGITAL_TWIN.md`.

### 3.3 Checklist PR Fullstack (`feat/fullstack-*` / `feat/be-*` / `feat/fe-*` — Syifa)
- [ ] Backend: Migrasi database Alembic berjalan sukses (*up* dan *down*).
- [ ] Backend: Ingestion adapter berhasil memproses paket LoRa dari Wokwi dan menyimpan ke hypertable TimescaleDB.
- [ ] Backend: Endpoint REST mematuhi amplop `{"data": ..., "meta": ...}` sesuai `INTERFACES.md`.
- [ ] Frontend: Halaman web berjalan mulus pada mode offline menggunakan `MOCK_DATA.md`.
- [ ] Frontend: Peta Leaflet merender poligon petak tanpa error lisensi map tile.
- [ ] Frontend: Responsive test rapi pada resolusi mobile (375px) dan desktop (1440px).
- [ ] Tidak ada modifikasi file di luar `backend/`, `frontend/`, `docs/backend/`, dan `docs/frontend/`.

### 3.4 Checklist PR AI Engine & Architecture (`feat/ai-*` — Aris)
- [ ] Unit test validasi fisika urease lulus (hasil AVRI selalu di rentang 0–100%).
- [ ] Model LightGBM menghasilkan latensi inferensi < 50 ms.
- [ ] TreeSHAP menghasilkan atribusi valid untuk semua fitur input.
- [ ] Skrip mock `MOCK_PREDICTOR.md` teruji independen tanpa koneksi database.
- [ ] Tidak ada modifikasi file di luar `ai_engine/`, `models/`, `docs/ai/`, dan `docs/universal/`.

---

## 4. Struktur Commit Message

Gunakan format konvensional terstandar:
```
<type>(<scope>): <deskripsi singkat imperative>

Contoh:
feat(hw): implement 5x burst sampling with median filter in esp32
feat(ai): integrate fao-56 et0 calculation into digital twin state
feat(be): add timescale hypertable migration for telemetry table
feat(fe): build interactive what-if risk slider component
docs(universal): update AVRI classification thresholds in INTERFACES.md
```
