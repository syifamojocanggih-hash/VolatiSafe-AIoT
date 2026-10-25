# Changelog — Frontend VolatiSafe AIoT

Seluruh catatan kemajuan, keputusan teknis, dan implementasi antarmuka frontend (Next.js 14, Tailwind CSS, PWA) dicatat secara kronologis di sini.

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
