# TASK_GUIDE.md — Presentation Layer, PWA & Dashboard (Syifa)

> **PENANGGUNG JAWAB:** Syifa (Syifa)  
> **ROLE:** *Fullstack Developer (Presentation Layer & Frontend)*  
> **AREA KERJA (R/W):** `frontend/`, `public/`, `docs/frontend/`  
> **CABANG GIT:** `full-stack`
> **KONTRAK DATA:** [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §3, [`docs/frontend/MOCK_DATA.md`](MOCK_DATA.md)  

---

## 🎯 Target Utama Domain Frontend
Membangun antarmuka web modern, responsif, dan ringan berbasis **Next.js 14 (App Router)** dan **Tailwind CSS** dengan kapabilitas **Progressive Web App (PWA)** yang dapat diinstal langsung di ponsel petani. Menampilkan status risiko volatilisasi amonia secara visual, peta poligon petak ladang jagung, timeline fenologi tanaman, kalkulator pupuk praktis (karung & ember), serta panel interaktif *""* untuk pengujian langsung oleh dewan juri.

---

## 📋 Daftar Tugas & Tahapan Implementasi

### TAHAP 1: Setup Proyek & Konfigurasi PWA

#### 🟢 FE-1.1: Inisialisasi Next.js 14 + Tailwind + PWA
- **Deskripsi:** Menyiapkan struktur proyek frontend dengan standar komponen shadcn/ui dan konfigurasi low-bandwidth.
- **Target Folder/File:**
  - `frontend/package.json` (`next@14`, `react@18`, `tailwindcss`, `lucide-react`, `recharts`, `leaflet`, `react-leaflet`, `@ducanh2912/next-pwa`, `zustand`)
  - `frontend/tailwind.config.ts` (mengadopsi palet warna resmi di [`docs/frontend/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md): Navy `#0B2545`, Teal `#0D9488`, Slate `#1E293B`, Hijau `#059669`, Kuning `#D97706`, Oranye `#EA580C`, Merah `#DC2626`)
  - `frontend/next.config.mjs` (konfigurasi service worker PWA & manifest)
  - `frontend/public/manifest.json` (nama: "VolatiSafe AIoT", theme_color: "#0B2545", icons 192x192 & 512x512)
- **Checklist:**
  - [ ] `npm run dev` berjalan lancar di `http://localhost:3000`.
  - [ ] Ukuran bundle produksi `npm run build` terverifikasi $\le 500$ KB (gzipped) agar ramah jaringan pedesaan.
  - [ ] PWA dapat di-*add to homescreen* di perangkat mobile/Chrome.

#### 🟢 FE-1.2: Layer Data Mock Mandiri (Offline-First Development)
- **Deskripsi:** Mengintegrasikan fixture data dari [`docs/frontend/MOCK_DATA.md`](MOCK_DATA.md) agar pengembangan frontend dapat berjalan 100% tanpa menunggu backend selesai dinyalakan.
- **Target Folder:** `frontend/src/mocks/` (fixtures untuk nodes, telemetry, crop-cycles, field-state)
- **Checklist:**
  - [ ] Tersedia switch toggle `NEXT_PUBLIC_USE_MOCKS=true/false` di `.env.local`.

---

### TAHAP 2: Dashboard Pemantauan Petak Utama (Home)

#### 🟢 FE-1.3: Status Banner AVRI, Metric Cards & Grafik Tren
- **Deskripsi:** Menyusun halaman beranda utama petani sesuai spesifikasi wireframe di PRD Seksi 7.3.
- **Target File:** `frontend/src/app/page.tsx`, `frontend/src/components/dashboard/`
- **Komponen Kunci:**
  1. **Banner Status Risiko Dinamis (4 Warna):**
     - 🟢 **AMAN (0–30%):** Latar hijau terang, ikon centang, teks *"Waktu aman menabur Urea sekarang"*.
     - 🟡 **WASPADA (31–60%):** Latar kuning, teks *"Wajib metode benam/tugal atau siram sebelum tebar"*.
     - 🟠 **KRITIS (61–80%):** Latar oranye, teks *"Tunda! Risiko penguapan tinggi"*.
     - 🔴 **BAHAYA (81–100%):** Latar merah, teks *"DILARANG TEBAR: Kehilangan amonia >80%"*.
  2. **4 Kartu Metrik Telemetri:** Kelembaban Tanah (% VWC), Suhu Tanah (°C), pH Tanah, dan Indeks AVRI (12 Jam) lengkap dengan indikator delta pergerakan ($\uparrow / \downarrow$).
  3. **Grafik Tren 24 Jam (Recharts):** Grafik garis ganda interaktif menampilkan pergerakan suhu tanah vs kelembaban tanah dengan garis batas ambang bahaya merah putus-putus.
  4. **Jendela Waktu Aman 72 Jam ke Depan:** Baris jadwal visual jam-ke-jam yang merekomendasikan jam emas aplikasi (misal: "Besok 06:00–08:30 WIB").
- **Checklist:**
  - [ ] Target sentuh tombol aksi minimal 44×44 px untuk kenyamanan petani lansia.
  - [ ] Tampilan rapi dan tidak meluap (*no overflow*) pada layar mobile 375px.

---

### TAHAP 3: Peta Interaktif Poligon Petak Sawah/Ladang

#### 🟢 FE-1.4: Peta Risiko Spasial Leaflet
- **Deskripsi:** Memvisualisasikan hamparan lahan jagung berbasis peta geografis poligon petak.
- **Target File:** `frontend/src/components/map/FieldRiskMap.tsx`
- **Spesifikasi:**
  - Menggunakan library **Leaflet + OpenStreetMap** (bebas biaya lisensi tile API).
  - Merender poligon GeoJSON per petak (misal: Blok A, Blok B, Blok C).
  - Warna poligon berubah otomatis mengikuti status AVRI petak (Hijau/Kuning/Oranye/Merah).
  - Popup interaktif saat poligon diklik: Menampilkan ID Node, Kelembaban, Suhu, pH, dan tombol *"Lihat Detail Petak"*.
- **Checklist:**
  - [ ] Peta ter-load dengan halus (*lazy loading* dengan dynamic import `ssr: false`).
  - [ ] Mendukung kontrol zoom dan sentuhan gestur cubit (*pinch-to-zoom*) di HP.

---

### TAHAP 4: Modul Fitur Agronomi Jagung Presisi

#### 🟢 FE-1.5: Dynamic DAT Tracker (Kalender Siklus Tanam)
- **Deskripsi:** Halaman/antarmuka pengelolaan fase pertumbuhan jagung.
- **Target File:** `frontend/src/app/agronomy/tracker/page.tsx`
- **Alur Interaksi:**
  1. Form input ringkas: Petani memilih **Tanggal Tanam**, Varietas Benih (Bisi-18 / NK-212 / P27), dan Luas Lahan.
  2. Software otomatis menghitung umur tanaman hari ini (`DAT = hari_ini - tanggal_tanam`).
  3. Menampilkan visualisasi **Timeline Fenologi Jagung**:
     - `10–14 HST` (Fase V3): Pemupukan Pertama.
     - `30–35 HST` (Fase V8): Pemupukan Susulan I (Puncak Nitrogen).
     - `45–50 HST` (Fase V12): Pemupukan Susulan II (Tasseling).
     - `95–105 HST`: Estimasi Panen.
  4. Tampilan kartu pengingat logistik: *"Pemberitahuan H-3: Tebus 2 karung Urea dan 1 karung NPK di Kios Pupuk Desa sebelum 14 Nov"*.
- **Checklist:**
  - [ ] Sinkronisasi nilai DAT ke state global tanpa perlu input ulang setiap hari.

#### 🟢 FE-1.6: Multi-Fertilizer Blender (Kalkulator Karung & Ember)
- **Deskripsi:** Antarmuka kalkulator racikan pupuk majemuk (Urea + NPK Phonska 15-15-15 + ZA) sesuai Permentan No. 40/2007.
- **Target File:** `frontend/src/app/agronomy/blender/page.tsx`
- **Alur Interaksi:**
  1. Input: Luas Lahan (ha/m²) dan Target Tonase Panen (ton/ha).
  2. Output Konversi Satuan Praktis Lapangan:
     - Kartu Takaran: **Jumlah Karung 50 kg** (misal: "1½ Karung Urea + 1½ Karung Phonska").
     - Kartu Lapangan: **Jumlah Ember Takar 8 kg** (misal: "Setara 18 Ember Takar").
     - Kotak Panduan: Teks petunjuk aplikasi nyata (*"Tabur di samping rumpun jagung berjarak 7–10 cm"*).
  3. Tombol *"Catat Pemupukan Selesai"* untuk merekam log aplikasi ke database backend.
- **Checklist:**
  - [ ] Angka pecahan desimal selalu dibulatkan ke satuan praktis yang masuk akal bagi petani (misal: 0.5 karung atau kelipatan ember).

---

### TAHAP 5: Panel Interaktif "" (Fitur Juara Juri)

#### 🟢 FE-1.8: Live Streaming & Service Worker Cache
- **Deskripsi:** Menghubungkan client web ke WebSocket backend untuk update live dan menguji ketahanan offline.
- **Target File:** `frontend/src/lib/socket.ts`, `frontend/src/lib/pwa.ts`
- **Checklist:**
  - [ ] Data telemetri pada dashboard otomatis bergerak tanpa refresh halaman saat ada paket baru dari Wokwi/Gateway.
  - [ ] Muncul notifikasi toast saat status risiko petak berpindah ke Kritis.
  - [ ] Uji mode airplane/offline: Halaman yang pernah dibuka tetap dapat dibaca dan kalkulator pupuk tetap bisa menghitung tanpa koneksi internet.

---

## 🚀 Skenario & Prosedur Merge ke Cabang `Development` (Tahap 4 - Frontend)

Cabang `full-stack` dari sisi frontend wajib memastikan:

### Checklist Pra-Merge Syifa (Frontend Next.js):
- [ ] Next.js 14 lolos kompilasi produksi `npm run build` tanpa error TypeScript/ESLint.
- [ ] Ukuran bundle awal PWA $\le 500\text{ KB}$ gzipped.
- [ ] Desain UI Light Mode responsif sempurna di layar smartphone (360px - 414px) dan desktop (1440px).
- [ ] Komponen peta Leaflet petak sawah dan grafik Recharts 24 jam render normal tanpa hydration error.
- [ ] Dukungan offline PWA terverifikasi (Service Worker aktif, cache manifest tersimpan).

---

## 🚫 Zona Terlarang Syifa (Frontend) (DILARANG KERAS)
1. ❌ DILARANG menjalankan query SQL atau membuka koneksi database langsung dari frontend.
2. ❌ DILARANG memodifikasi formula kinetika kimia di `ai_engine/`.
3. ❌ DILARANG mengubah kontrak skema DTO di `docs/universal/INTERFACES.md` secara sepihak.
