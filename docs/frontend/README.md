# DOMAIN 4: PRESENTATION LAYER & DASHBOARD — README.md

> **PANDUAN KHUSUS UNTUK FRONTEND AI AGENT**

---

## 1. Mandat & Ruang Lingkup Kerja

Frontend AI bertanggung jawab atas seluruh antarmuka pengguna (UI/UX) VolatiSafe AIoT:
- Web Application modern berbasis **Next.js 14 (App Router)** dan **Tailwind CSS**.
- Visualisasi peta interaktif petak ladang/bedeng menggunakan **Leaflet + OpenStreetMap**.
- Grafik deret waktu telemetri 24 jam dan bar proyeksi jendela aman 72 jam menggunakan **Recharts**.
- Fitur interaktif: *Dynamic DAT Tracker* (siklus tanam), *Multi-Fertilizer Blender* (kalkulator ember/karung), dan *What-If Risk Simulator* untuk dewan juri.
- Implementasi **Progressive Web App (PWA)** dengan service worker agar petani dapat mengakses data penting saat offline di tengah kebun.

### File & Direktori yang Dimiliki (Boleh Ditulis):
- `frontend/` (Seluruh kode Next.js, komponen React, styles, types, hooks, mocks)
- `public/` (Aset gambar, ikon, manifest PWA)
- `docs/frontend/` (Seluruh dokumen teknis frontend di folder ini)

---

## 2. Zona Terlarang & Batasan Ketat (*Invariant Rules*)

Untuk mencegah benturan dengan tim/AI lain:
1. ❌ **Dilarang Query Database / Buat Schema DB:** Frontend tidak memiliki akses langsung ke PostgreSQL/TimescaleDB. Seluruh data didapat via REST API atau WebSocket.
2. ❌ **Dilarang Mengubah Payload LoRa atau Firmware:** Jangan pernah mendikte format singkatan field hardware (`n`, `ts`, `m`, dsb). Frontend hanya mengonsumsi format `CleanTelemetry` dari REST API.
3. ❌ **Wajib Berjalan Mandiri dengan Mock Data:** Jika backend belum dinyalakan, seluruh halaman web frontend **WAJIB TETAP BISA DIJALANKAN 100%** menggunakan fixture data di [`docs/frontend/MOCK_DATA.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/frontend/MOCK_DATA.md).
4. ❌ **Desain Ramah Petani & Lapangan:** Hindari UI yang terlalu rumit. Gunakan bahasa Indonesia lugas, kontras tinggi, font jelas, dan target klik tombol minimal 44×44 px.

---

## 3. Indeks Dokumen Frontend

1. [`DESIGN_SYSTEM.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/frontend/DESIGN_SYSTEM.md): Palet warna token status risiko AVRI, tipografi, dan prinsip desain.
2. [`PAGE_STATES.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/frontend/PAGE_STATES.md): Spesifikasi antarmuka 5 layar utama dan interaksi state.
3. [`UI_COMPONENTS.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/frontend/UI_COMPONENTS.md): Katalog komponen reusable (StatusBanner, TelemetryChart, RiskMap, WindowBar).
4. [`MOCK_DATA.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/frontend/MOCK_DATA.md): Fixture JSON offline lengkap untuk pengembangan independen tanpa backend.
5. [`SETUP.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/frontend/SETUP.md): Panduan instalasi Next.js 14, Leaflet CSS, dan konfigurasi PWA.
