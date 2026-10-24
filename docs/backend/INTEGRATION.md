# INTEGRATION.md — Integrasi Layanan Eksternal & API Gateway

---

## 1. Integrasi Cuaca Publik (BMKG Open Data API)

Backend VolatiSafe secara otomatis menyerap data iklim dan prakiraan presipitasi hujan dari Badan Meteorologi, Klimatologi, dan Geofisika (BMKG):

### 1.1 Stasiun Pengamatan Cuaca Acuan
- **Wilayah Lampung:** Stasiun Meteorologi Radin Inten II (Lampung Selatan/Tengah) — ID: `96295`.
- **Wilayah Lamongan:** Stasiun Meteorologi Maritim Perak II / Tuban — ID: `96933`.

### 1.2 Parameter yang Diserap Setiap Jam
- `temp`: Suhu udara permukaan (°C).
- `rh`: Kelembaban relatif udara (%).
- `ws`: Kecepatan angin di ketinggian 2 meter (m/s).
- `rain_prob`: Probabilitas dan intensitas curah hujan 3–12 jam ke depan (mm).

---

## 2. Integrasi WhatsApp Gateway (Fonnte / Wablas API)

### 2.1 Spesifikasi HTTP Request Pengiriman Pesan
- **Endpoint:** `POST https://api.fonnte.com/send` (atau endpoint Wablas)
- **Header:** `Authorization: {API_TOKEN}`
- **Payload Request:**
```json
{
  "target": "+6281234567890",
  "message": "🔴 RISIKO KRITIS 74%: Jangan tabur pupuk Urea sekarang! Jendela aman terdekat besok pagi 06:00 WIB.",
  "countryCode": "62"
}
```

---

## 3. Integrasi Telegram Bot API

- **Endpoint:** `POST https://api.telegram.org/bot{TOKEN}/sendMessage`
- **Fungsi:** Menembakkan pesan broadcast ke grup kelompok tani dan mengirimkan notifikasi interaktif ke smartphone dewan juri saat sesi demonstrasi purwarupa.
- **Dukungan Inline Keyboard:** Menyediakan tombol cepat respons (*"Sudah Saya Tunda"* / *"Buka Peta Petak"*).
