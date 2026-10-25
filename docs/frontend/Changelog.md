# Changelog — Frontend VolatiSafe AIoT

Seluruh catatan kemajuan, keputusan teknis, dan implementasi antarmuka frontend (Next.js 14, Tailwind CSS, PWA) dicatat secara kronologis di sini.

---

## [2026-10-25] — Modul Laporan, Provenance Data & Batas Kejujuran Ilmiah (Screen 5 / PRD Seksi 7.3, 5.6 & 11)

### 🚀 Fitur & Implementasi Baru
- **Tampilan Presisi Sesuai Mockup Referensi (`ReportAnalytics.tsx`):**
  - **Header Halaman Resmi:**
    - Judul: *"Laporan, Provenance Data & Batas Kejujuran Ilmiah"*
    - Subjudul: *"Ringkasan dampak, sumber data, dan batas klaim sistem — untuk audit PPL & juri"*
  - **3 Kartu Ringkasan Dampak Atas (Top Row Cards):**
    1. *Target Efisiensi Pupuk Urea:* Nilai tebal hijau $\ge 20\text{–}35\%$ dengan teks penghematan $\pm\text{Rp}750.000\text{/ha}$ per musim tanam.
    2. *Penurunan Kehilangan Nitrogen:* Nilai tebal biru $45\% \rightarrow <15\%$ dengan penjelasan pencegahan aplikasi pada tanah panas-kering ($>30^\circ\text{C}$, kelembaban $<25\%\text{ VWC}$).
    3. *Ekspor Data Audit:* Latar kartu hijau muda lembut (`#EDF8EE` / border `#C6E7C9`) dilengkapi tombol aksi hijau solid (`#236B32`) **"Ekspor CSV Telemetri"**.
  - **Fitur Ekspor CSV Mandiri (Client-Side Trigger):**
    - Meng-generate file CSV riil `volatisafe_audit_telemetri_2026.csv` lengkap dengan kolom timestamp, node ID, kelembaban, suhu tanah, pH, voltase baterai, skor AVRI, klasifikasi risiko, dan sumber provenance data.
    - Notifikasi toast konfirmasi saat pengunduhan berhasil dieksekusi.
  - **Tabel Audit Data Provenance (Anti-Jebakan "Fake Simulator"):**
    - Modul 1: `BMKG Historical Weather` $\rightarrow$ Stasiun Meteorologi Lampung & Lamongan $\rightarrow$ Replay suhu udara, RH, radiasi, hujan.
    - Modul 2: `FAO-56 Penman-Monteith` $\rightarrow$ Allen et al. (1998) $\rightarrow$ Transisi kelembaban & failover imputasi.
    - Modul 3: `Urease Kinetics Layer` $\rightarrow$ Kissel & Cabrera (2005) / Sommer et al. $\rightarrow$ Persamaan fisika penguapan $\text{NH}_3$.
    - Modul 4: `Dosis Pupuk Majemuk` $\rightarrow$ Permentan No. 40/2007 & Balitbangtan $\rightarrow$ Kalkulator Urea + Phonska + ZA.
  - **Kartu Batas Kejujuran Ilmiah / The Moat (PRD Seksi 11):**
    - Box 1: *1. Menolak Sensor NPK Murah (Gimmick)* — Menolak probe NPK Rp200 ribuan palsu dan mengukur suhu, kelembaban, serta pH sejati.
    - Box 2: *2. Fokus Jalur Volatilisasi Amonia* — Model berfokus pada penguapan $\text{NH}_3$ 12–72 jam pasca-tabur, tidak mengklaim mengukur leaching atau denitrifikasi.
    - Box 3: *3. Kejujuran Status TKT 3* — Prototipe berjalan sebagai simulasi tertutup end-to-end sebelum pencairan dana komponen fisik menuju TKT 6.
- **Keselarasan Sidebar Desktop:**
  - Mempertahankan 5 menu navigasi presisi: `Dashboard Petak`, `Peta Risiko Lahan`, `Preskripsi & Kalender`, `Admin & Node`, dan `Laporan & Ekspor`.
- **Simulator Risiko What-If Dewan Juri (`WhatIfPanel.tsx`):**
  - **Kontrol 4 Slider Interaktif (Debounce 0 ms):**
    - Suhu Tanah Permukaan ($15^\circ\text{C} - 45^\circ\text{C}$).
    - Kelembaban Tanah ($5\% - 80\% \text{ VWC}$).
    - Derajat Keasaman pH Tanah ($4.0 - 9.5 \text{ pH}$).
    - Curah Hujan 6 Jam ($0 - 50 \text{ mm}$).
  - **Speedometer Gauge Meter Dinamis:**
    - Visual jarum gauge meter SVG berputar mulus (-90° s.d. +90°) merespons langsung tarikan slider.
    - Transisi warna mulus (Hijau Aman, Kuning Waspada, Oranye Kritis, Merah Bahaya).
  - **Dekomposisi Kontribusi Fitur TreeSHAP Mini:**
    - Visual bar progress kontribusi faktor pemicu (suhu urease, kekeringan tanah, pH basa, dan peredaman air hujan).
  - **Pintasan 3 Skenario Pengujian 1-Klik untuk Presentasi Hackathon:**
    - *Skenario A (Terik Ekstrem Siang Hari):* Suhu 34.5°C, Kelembaban 21%, pH 7.85, Hujan 0 mm → Skor AVRI 78% (Kritis).
    - *Skenario B (Hujan Sore 15 mm):* Suhu 25.5°C, Kelembaban 42%, pH 6.95, Hujan 15 mm → Skor AVRI 14% (Aman).
    - *Skenario C (Pagi Sejuk & Lembap):* Suhu 23.0°C, Kelembaban 38%, pH 6.80, Hujan 2 mm → Skor AVRI 12% (Aman).
- **Routing & Navigasi Terpadu:**
  - Sidebar desktop kini memuat akses langsung ke `Laporan & Ekspor` (`/report`) dan `Simulator What-If` (`/simulator` bertanda badge *Demo*).
  - Banner navigasi pintas dari halaman Laporan langsung ke Simulator What-If.

---

## [2026-10-25] — Modul Manajemen Field Node & Jaringan LoRa 433 MHz (Screen 4 / Admin)

### 🚀 Fitur & Implementasi Baru
- **Tabel Monitoring Status Node Lapangan (`NodeManagement.tsx`):**
  - Pemantauan 5 node terdistribusi (`VS-A1-001` s.d. `VS-B2-005`) dengan parameter live (Kelembaban % VWC, Suhu Tanah °C, pH Tanah).
  - Status transmisi radio LoRa 433 MHz (`Online · Sleep 15m` vs `Offline → [Est-Simulated]`).
  - Indikator voltase baterai 18650 + solar charging (tegangan $3.55\text{V} - 4.05\text{V}$, konsumsi $0.067\text{ mAh/siklus}$).
  - Nilai RSSI LoRa aktual ($-64\text{ dBm}$ s.d. $-94\text{ dBm}$).
- **Live LoRa Payload Inspector (SF7 · 52 Bytes):**
  - Terminal JSON payload kompak dengan tombol salin payload (`n`, `ts`, `m`, `t`, `ph`, `b`).
  - Frekuensi ISM 433.0 MHz bebas lisensi SDPPI.
  - Catatan proteksi MOSFET Gate Control (GPIO25) pemutus VCC sensor saat deep sleep untuk mencegah elektrolisis probe tanah.
- **Ringkasan BoM & Pin Mapping ESP32:**
  - 4 kartu komponen utama: Capacitive Moisture v1.2 (GPIO34), Soil pH Probe (GPIO32), DS18B20 1-Wire (GPIO04), dan LoRa SX1278 SPI (GPIO 5/18/19/23).
  - Estimasi total BoM per node: **± Rp305.000** (memenuhi batas anggaran plafon prototipe Rp3.000.000 untuk 10 node).
- **Modal Kalibrasi Sensor 2-Titik (`CalibrationModal.tsx`):**
  - Kalibrasi ADC Kelembaban: Nilai Udara Kering (*Dry ADC*) & Air Basah (*Wet ADC*).
  - Kalibrasi pH Probe: Buffer pH netral 6.86 dan buffer asam 4.01 dengan kalkulasi slope dan offset NVS flash.
- **Modal Onboarding Node QR (`OnboardingQRModal.tsx`):**
  - Viewfinder kamera scanner QR code node fisik.
  - Form pendaftaran manual node baru (Node ID, Blok Lahan, Koordinat GPS) dengan feedback instan.
- **Routing & Navigasi:**
  - Terintegrasi di sidebar `Admin & Node` dan route mandiri `/admin`.

---

## [2026-10-25] — Modul Preskripsi, Kalender Tanam & Kalkulator Pupuk Ketik (FE-1.5 & FE-1.6)

### 🚀 Fitur & Implementasi Baru
- **Fitur A: Dynamic DAT Tracker & Early–Warning Logistik:**
  - **Kalkulasi Hari Setelah Tanam (HST) Dinamis:** Form tanggal tanam (`input type="date"`), pemilih varietas jagung hibrida (`Bisi-18`, `NK-212`, `Pioneer P27`), dan badge umur tanaman dinamis (`30 HST`).
  - **Timeline Fenologi 5 Fase Pertumbuhan Jagung:**
    1. `0–7 HST`: Perkecambahan (VE).
    2. `10–14 HST`: V3 · Pupuk Dasar (NPK + Urea awal).
    3. `30–35 HST`: V8 · Susulan I (Kritis) bertanda **Fase Aktif** dengan outline hijau zamrud dan ring sorotan.
    4. `45–50 HST`: V12 / Tasseling (Susulan II).
    5. `95–105 HST`: Masak & Panen (Estimasi pipilan kering).
  - **Banner Peringatan Logistik H-3:** Teks preskriptif pengingat tebus pupuk di kios desa 3 hari sebelum fase V8 tiba.
  - **Modal Simulasi Notifikasi WhatsApp Petani (`WhatsAppPreviewModal.tsx`):** Mensimulasikan tampilan notifikasi bot WhatsApp (*VolatiSafe Bot*) lengkap dengan tombol respon cepat *Cek Jendela Jam Aman* dan *Buka Takaran Ember Karung*.
- **Fitur B: Multi-Fertilizer Blender (Permentan No. 40/2007 & Balitbangtan):**
  - **Input Angka Ketik Langsung (Typed Inputs):** Mengganti model slider geser menjadi input teks numerik ketik langsung untuk:
    - *Luas Lahan Garapan* (satuan `Ha` + konversi otomatis ke $m^2$).
    - *Target Tonase Panen* (satuan `Ton/Ha` + estimasi tonase hasil total).
  - **Kalkulasi Resep Pupuk Reaktif & Otomatis:**
    - Perhitungan otomatis resep Pemupukan I (NPK Phonska, Urea, ZA) dan Pemupukan II (Urea Fokus N, NPK Phonska).
    - **Konversi Satuan Lapangan Praktis:** Menghitung jumlah karung fisik (50 kg) dan takaran ember lapangan (8 kg).
- **Catatan Aplikasi Aktual (Sinkronisasi Digital Twin `F_log`):**
  - Daftar riwayat pemupukan riil dengan status AVRI saat penaburan.
  - **Modal Form Pencatatan Aktual (`RecordFertilizerModal.tsx`):** Petani dapat mencatat tanggal, fase, takaran pupuk nyata, dan skor AVRI ke state Digital Twin secara *real-time*.
- **Routing & Integrasi:**
  - Terintegrasi di menu sidebar `Preskripsi & Kalender` dan route mandiri `/prescription`.

### 🔍 Verifikasi Browser Subagent
- Pengujian desktop dan mobile tuntas.
- Input ketik luas lahan berhasil mengkalkulasi ulang karung dan ember secara instan.
- Modal WhatsApp dan modal pencatatan aktual berfungsi sempurna.

---

## [2026-10-25] — Integrasi Apache ECharts (`echarts-for-react`) dengan Estetika Shadcn UI

### 🚀 Fitur & Implementasi Baru
- **Penerapan `echarts-for-react` pada Grafik Tren 24 Jam (`Trend24hChart.tsx`):**
  - Menggantikan implementasi SVG dasar dengan pustaka grafik visualisasi data berstandar industri: **Apache ECharts** (`echarts` & `echarts-for-react`).
  - **Arsitektur SSR-Safe Next.js 14:** Menggunakan `next/dynamic` dengan opsi `ssr: false` dan pengecekan hydration client-side (`isClient`) untuk menjamin zero runtime error `"window is not defined"`.
  - **Renderer SVG Ultra-Tajam:** Menggunakan `opts={{ renderer: 'svg' }}` agar garis kurva tetap tajam di layar resolusi tinggi smartphone petani dan hemat konsumsi memori grafis perangkat.
  - **Konfigurasi Garis Ganda & Ambang Kritis:**
    - Garis Biru (`#2563EB`): Kelembaban tanah (% VWC).
    - Garis Cokelat Oranye (`#C25E26`): Suhu tanah (°C).
    - Garis Putus-putus Abu-abu (`#94A3B8`): Garis batas `Ambang Kritis` di level 25% lengkap dengan label anotasi visual `"25%"`.
  - **Desain Tooltip Bergaya Shadcn UI:** Menggunakan kartu melayang semi-transparan `bg-slate-900/92` dengan border `border-slate-700`, font dinamis, dan pemformatan nilai instan per jam saat di-hover/di-tap.

### 🔍 Verifikasi
- Lolos validasi `npm run build` dengan ukuran first load JS tetap sangat ramping (**104 kB**).
- Teruji di browser desktop dan ponsel pintar tanpa glitch tata letak.

---

## [2026-10-25] — Peta Zonasi Risiko Volatilisasi Lahan & Failover Digital Twin (FE-1.4)

### 🚀 Fitur & Implementasi Baru
- **Peta Interaktif Hamparan Bedeng Lahan (`ParcelRiskMap.tsx`):**
  - **Kanvas Hamparan Lapangan:** Menggunakan latar krem/pasir alami (`#FAF4E6`) merefleksikan tanah kapur Solokuro Lamongan, lengkap dengan garis pemisah alur drainase (*"Alur Drainase & Jalan Usaha Tani"*), koordinat hamparan ($7^\circ04'12''\text{S } 112^\circ18'45''\text{E}$), dan indikator koneksi Gateway Basecamp (0,8 km).
  - **Poligon 5 Bedeng Interaktif:**
    - `A1 · VS-A1-001`: Risiko Kritis (AVRI 74%, Latar merah/peach).
    - `A2 · VS-A2-002`: Kondisi Aman (AVRI 19%, Latar hijau).
    - `A3 · VS-A3-003`: Risiko Bahaya (AVRI 81%, Latar merah).
    - `B1 · VS-B1-004`: Kondisi Sangat Aman (AVRI 12%, Latar hijau).
    - `B2 · VS-B2-005`: Waspada Failover Digital Twin (`[Est-Simulated] FAO-56`, Latar kuning garis putus-putus).
  - **Filter Lapisan Dinamis (*Layer Toggle*):**
    - `Layer Risiko AVRI`: Mewarnai poligon berdasarkan kategori skor volatilisasi (Aman, Waspada, Kritis/Bahaya).
    - `Status Baterai`: Menampilkan persentase daya dan voltase LiFePO4 tiap node (>80% hijau, <80% kuning).
    - `Koneksi LoRa`: Membedakan node aktif siaran langsung vs node failover Digital Twin.
- **Panel Rincian Bedeng Terpilih (*Selected Parcel Detail Card*):**
  - Grid 4 parameter: Varietas benih & luas, mode telemetri, kelembaban & suhu tanah, serta pH & voltase baterai.
  - Kartu rekomendasi preskripsi lapangan per bedeng.
  - **Tombol Simulasi Digital Twin (*"Simulasikan Node Putus"*):** Memungkinkan juri/penguji memutus node secara virtual untuk mendemonstrasikan pengambilalihan estimasi data oleh model neraca air FAO-56 secara *real-time* disertai notifikasi toast.
- **Tabel Ringkasan Semua Bedeng (*Summary Table*):**
  - Tabel ringkasan 5 bedeng dengan indikator badge `Online` / `[Est-Simulated]` dan skor AVRI.
  - Baris tabel dapat diklik untuk menyorot poligon bedeng yang bersangkutan di kanvas peta.
- **Routing & Navigasi Terpadu:**
  - Terintegrasi di tab navigasi `Peta Risiko Lahan` pada desktop sidebar dan tersedia sebagai route mandiri di `/map`.

### 🔍 Verifikasi Browser Subagent
- Verifikasi desktop (1280×800) dan mobile (390×844) teruji tuntas tanpa layout shift maupun horizontal overflow.
- Tombol simulasi putus node berhasil mengaktifkan status failover Digital Twin FAO-56.

---

## [2026-10-25] — Inisialisasi Frontend & Dashboard Pemantauan Petak (FE-1.1 & FE-1.3)

### 🚀 Fitur & Implementasi Baru
- **Inisialisasi Proyek Next.js 14 App Router + TypeScript + Tailwind CSS:**
  - Konfigurasi PWA Web App Manifest (`/public/manifest.json`) dengan branding nama *"VolatiSafe AIoT"*, warna tema `#5E9E49`, orientasi portrait-primary, dan ikon SVG mandiri (`/public/icon.svg`).
  - Instalasi paket dependensi esensial: `lucide-react`, `clsx`, `tailwind-merge`, `recharts`.
  - Konfigurasi variabel lingkungan `.env.local` dengan mode `NEXT_PUBLIC_USE_MOCK_DATA=true`.
  - Verifikasi build produksi (`npm run build`): First Load JS hanya **97.9 kB** (sangat ramah koneksi 3G desa, jauh di bawah batas toleransi PRD 500 kB).

- **Sistem Desain & Token Visual Sesuai Mockup Referensi (`DESIGN_SYSTEM.md`):**
  - Implementasi tipografi modern `Plus Jakarta Sans` dari Google Fonts dengan fallback `Inter`.
  - Definisi palet warna: Hijau Sidebar Brand (`#5E9E49`), Hijau Solid AVRI & CTA (`#236B32`), Latar Kartu Status Mint (`#EDF8EE` / border `#C6E7C9`), dan warna semantik risiko AVRI (Aman, Waspada, Kritis, Bahaya).
  - Target sentuh ergonomis ramah petani minimal 44×44 px (`touch-action: manipulation`).

- **Komponen Dashboard Petak (Desktop & Mobile Responsif Sesuai Screenshot Desain):**
  1. `DesktopSidebar.tsx`: Sidebar navigasi vertikal hijau untuk layar desktop, memuat identitas VolatiSafe, navigasi modul (Dashboard Petak, Peta Risiko Lahan, Preskripsi & Kalender, Admin & Node, Laporan & Ekspor), dan kartu profil pengguna (Pak Suparman, Solokuro Lamongan).
  2. `MobileHeader.tsx`: Header banner atas hijau untuk layar ponsel/PWA dengan logo dan judul brand.
  3. `FieldHeader.tsx`: Header informasi petak (*"Kebun Jagung pak suparman · Blok A - 0,75 ha - 32 HST"*), badge status refresh 12 menit lalu, status baterai LiFePO4 84%, dan tombol gear pengaturan.
  4. `RiskStatusBanner.tsx`: Banner status risiko volatilisasi AVRI 4% (*"Aman, waktu optimal pemupukan"*), lengkap dengan deskripsi agronomi dan 2 tombol interaktif (*"Lihat Detail Prediksi"* & *"Sudah Saya Tunda"*).
  5. `MetricCardsGrid.tsx`: Grid 4 kartu metrik (Kelembapan Tanah 42,0%, Suhu Tanah 26,0°C, pH Tanah 7,10, dan kartu hijau solid AVRI 12 Jam 4%). Tertata 2×2 di mobile dan 4 kolom sejajar di desktop.
  6. `Trend24hChart.tsx`: Grafik deret waktu 24 jam interaktif dengan kurva kelembaban tanah, suhu tanah, dan garis ambang batas kritis 25% beserta tooltip hover jam.
  7. `SafeWindowForecast.tsx`: Visualisasi jendela waktu aman 72 jam ke depan (24 balok per jam; jam 06–09 hijau aman). Tampilan 3 baris bertumpuk di desktop dan carousel navigator hari di mobile.

- **Interaktivitas & Pengujian Mandiri (Anti-Slop R-26 / C-2):**
  - `PredictionDetailModal.tsx`: Modal interaktif rincian atribusi faktor tanah (kelembaban, suhu, pH) dan rekomendasi preskripsi benam samping tanaman.
  - `SettingsModal.tsx`: Modal info perangkat IoT (Node VS-A1-003, LoRa 433 MHz, Baterai 84%) dan **Simulator Skenario Demo Juri** untuk beralih instan antara Skenario Aman (AVRI 4%) dan Skenario Terik Kritis (AVRI 74%).
  - Toast feedback instan saat petani menekan tombol *"Sudah Saya Tunda"*.
