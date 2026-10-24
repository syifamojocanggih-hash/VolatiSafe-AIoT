# GIT_WORKFLOW.md — Alur Kolaborasi Multi-AI & Pengendalian Versi Kontrak

> **STATUS:** STANDAR PENGEMBANGAN MULTI-CABANG  
> Dokumen ini mengatur tata kelola Git branching, perlindungan file kontrak global, dan prosedur integrasi agar kontribusi dari AI Agent yang berbeda tidak saling merusak.

---

## 1. Konvensi Cabang Git (Branching Strategy)

Setiap AI coding assistant atau developer wajib bekerja pada branch spesifik sesuai domainnya:

```
main (Production / Stable TKT 3 Demo)
  │
  ├── feat/hw-firmware-sampling      <-- Dikerjakan Hardware AI
  ├── feat/ai-piml-lightgbm          <-- Dikerjakan AI/ML Engine Agent
  ├── feat/be-ingestion-adapter      <-- Dikerjakan Backend AI
  └── feat/fe-risk-dashboard         <-- Dikerjakan Frontend AI
```

### 1.1 Pola Penamaan Branch

| Awalan Branch | Domain | Contoh Nama Branch |
|---|---|---|
| `feat/hw-*` | Hardware, sensor, LoRa, Wokwi | `feat/hw-esp32-burst-sampling`, `feat/hw-wokwi-mqtt-bridge` |
| `feat/ai-*` | Model ML, Digital Twin, FAO-56 | `feat/ai-fao56-water-balance`, `feat/ai-shap-explainer` |
| `feat/be-*` | Backend, database, API, WebSocket| `feat/be-timescaledb-hypertable`, `feat/be-whatsapp-bot` |
| `feat/fe-*` | Frontend, UI component, PWA | `feat/fe-leaflet-risk-map`, `feat/fe-what-if-slider` |
| `contract/rfc-*`| Perubahan skema `INTERFACES.md`| `contract/rfc-add-wind-speed-metric` |
| `fix/*` | Hotfix bug terisolasi | `fix/fe-chart-legend-wrap`, `fix/be-mqtt-reconnect` |

---

## 2. Aturan Perlindungan File Kontrak (`docs/universal/INTERFACES.md`)

File [`docs/universal/INTERFACES.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/universal/INTERFACES.md) adalah **Protected Asset**.

### 2.1 Aturan Ketat:
1. **Dilarang Direct Edit di Feature Branch:** AI Agent yang bekerja di `feat/fe-*` atau `feat/hw-*` **DILARANG SEPIHAK** mengedit `INTERFACES.md`.
2. **Prosedur RFC (Request for Comments):** Jika suatu fitur baru membutuhkan perubahan struktur data kontrak:
   - Buat branch khusus `contract/rfc-<nama-perubahan>`.
   - Perbarui `INTERFACES.md`, `MOCK_DATA.md`, dan `MOCK_PREDICTOR.md`.
   - Lakukan merge ke `main` terlebih dahulu sebelum branch implementasi kode dimulai.
3. **Kompatibilitas Mundur:** Field baru wajib bersifat opsional (`optional / default None`) agar subsistem lain yang belum diperbarui tidak mengalami crash.

---

## 3. Checklist Pull Request (PR) per Domain

Sebelum kode dari branch digabungkan ke `main`, lakukan verifikasi checklist:

### 3.1 Checklist PR Hardware (`feat/hw-*`)
- [ ] Kode C++ lolos kompilasi tanpa warning di PlatformIO / Arduino CLI.
- [ ] Verifikasi payload LoRa tidak melebihi 52 byte.
- [ ] Simulasi Wokwi berjalan normal dan data terkirim ke MQTT `localhost:1883`.
- [ ] Tidak ada modifikasi file di luar `firmware/`, `simulation/`, dan `docs/hardware/`.

### 3.2 Checklist PR AI / Digital Twin (`feat/ai-*`)
- [ ] Unit test validasi fisika urease lulus (hasil AVRI selalu di rentang 0–100%).
- [ ] Model LightGBM menghasilkan latensi inferensi < 50 ms.
- [ ] TreeSHAP menghasilkan atribusi valid untuk semua fitur input.
- [ ] Mock script `docs/ai/MOCK_PREDICTOR.md` teruji independen tanpa koneksi database.
- [ ] Tidak ada modifikasi file di luar `ai_engine/`, `models/`, dan `docs/ai/`.

### 3.3 Checklist PR Backend (`feat/be-*`)
- [ ] Migrasi Alembic berjalan sukses (*up* dan *down*).
- [ ] Endpoint REST mematuhi amplop `{"data": ..., "meta": ...}` sesuai `INTERFACES.md`.
- [ ] Ingestion adapter berhasil memproses payload LoRa sintetis dari Wokwi.
- [ ] Test suite pytest lulus 100%.
- [ ] Tidak ada modifikasi file di luar `backend/` dan `docs/backend/`.

### 3.4 Checklist PR Frontend (`feat/fe-*`)
- [ ] Halaman web berjalan mulus pada mode offline menggunakan `docs/frontend/MOCK_DATA.md`.
- [ ] Peta Leaflet merender poligon bedeng tanpa error lisensi map tile.
- [ ] Responsive test: Tampilan rapi pada resolusi mobile (375px) dan desktop (1440px).
- [ ] `npm run build` sukses tanpa linting error.
- [ ] Tidak ada modifikasi file di luar `frontend/` dan `docs/frontend/`.

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
