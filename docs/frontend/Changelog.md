# Changelog — Frontend VolatiSafe AIoT

Seluruh catatan kemajuan, keputusan teknis, dan implementasi antarmuka frontend (Next.js 14, Tailwind CSS, PWA) dicatat secara kronologis di sini.

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

### 🔍 Verifikasi Browser Subagent
- Tampilan Desktop (1280×800) dan Mobile PWA (390×844) teruji lancar tanpa error layout maupun overflow.
- Seluruh tombol dan modal berfungsi dengan responsif.
