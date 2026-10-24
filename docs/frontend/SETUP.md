# SETUP.md — Panduan Setup Lingkungan Frontend Next.js 14

---

## 1. Prasyarat Sistem

- **Node.js:** Versi 18.17 atau lebih baru (direkomendasikan Node.js 20 LTS)
- **Package Manager:** `npm` atau `pnpm`

---

## 2. Dependensi Utama

Proyek frontend menggunakan stack modern yang ringan dan type-safe:
- **Framework:** `next` 14.x (App Router) + `react` 18.x
- **Bahasa:** `typescript`
- **Styling:** `tailwindcss` + `tailwind-merge` + `clsx`
- **Komponen UI:** `@radix-ui/react-icons` / `lucide-react`
- **Grafik & Visualisasi:** `recharts`
- **Peta Lahan:** `leaflet` + `react-leaflet` + `@types/leaflet`
- **Offline PWA:** `@ducanh2912/next-pwa` atau `next-pwa`

---

## 3. Konfigurasi Lingkungan (`.env.local`)

Buat file `.env.local` di dalam folder `frontend/`:

```ini
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# WebSocket URL Live Stream
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/v1/live

# Mock Data Flag (Aktifkan untuk development mandiri tanpa backend)
NEXT_PUBLIC_USE_MOCK_DATA=true

# Mapbox / OpenStreetMap Tile URL (Default OpenStreetMap bebas lisensi)
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## 4. Instalasi & Menjalankan Dev Server

```bash
# 1. Masuk ke direktori frontend
cd frontend

# 2. Install dependensi
npm install

# 3. Jalankan development server
npm run dev
```

Buka aplikasi di browser Anda:
👉 `http://localhost:3000`

---

## 5. Mode Pengembangan Mandiri (Offline Mock Mode)

Saat `NEXT_PUBLIC_USE_MOCK_DATA=true`:
- Seluruh panggilan API otomatis dialihkan ke objek data di [`docs/frontend/MOCK_DATA.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/frontend/MOCK_DATA.md).
- Frontend AI dapat menguji responsivitas kartu metrik, render grafik Recharts, poligon Leaflet, dan slider simulator tanpa memerlukan backend berjalan.
