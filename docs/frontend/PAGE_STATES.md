# PAGE_STATES.md — Spesifikasi Layar & Interaksi State Frontend

---

## 1. Layar 1: Dashboard Petak (Home Screen)

Layar utama yang dibuka oleh petani untuk mengetahui kondisi ladang hari ini secara seketika.

### Elemen & Komponen:
1. **Header Info Petak:** Nama blok ladang (`"Kebun Jagung Pak Suparman · Blok A"`), timestamp update terakhir (`"⏱️ 12 menit lalu"`), dan indikator baterai node (`"⚡ 84%"`).
2. **Hero Alert Banner:**
   - *State Kritis/Bahaya:* Banner merah terang (`#DC2626`) dengan teks: `"🔴 RISIKO KRITIS — AVRI 74%: Jangan tabur Urea sekarang. Potensi penguapan tinggi."` Disertai rekomendasi: `"Jendela aman terdekat: Besok 06:00 – 09:00 WIB"`.
   - *State Aman:* Banner hijau cerah (`#16A34A`): `"🟢 KONDISI AMAN — AVRI 18%: Waktu tepat menabur Urea. Lakukan sekarang."`
3. **Grid 4 Kartu Metrik:**
   - *Kelembaban Tanah:* Nilai `22.4%`, delta 24 jam `↓ 3.2%` (warna merah/kering).
   - *Suhu Permukaan Tanah:* Nilai `34.1°C`, delta 24 jam `↑ 1.8°C` (warna merah/panas).
   - *Derajat Keasaman pH:* Nilai `7.83`, delta `— 0.02` (netral-basa).
   - *Skor AVRI Terkini:* Nilai `74%`, delta `↑ 12%`.
4. **Grafik Tren Deret Waktu 24 Jam (Recharts):** Menampilkan garis fluktuasi kelembaban tanah dan suhu tanah terhadap garis putus-putus ambang kritis ($30^\circ C$ dan $25\%$ kelembaban).
5. **Bar Strip Proyeksi Jendela Aman 72 Jam:** Kotak-kotak interval 3 jam horizontal. Kotak hijau menandakan waktu aman, kotak abu-abu/oranye menandakan waktu terik berisiko.
6. **Kartu TreeSHAP "Mengapa Berisiko?":** Daftar faktor pemicu dengan progress bar mini dampak persentase.

---

## 2. Layar 2: Peta Risiko Lahan (Parcel Risk Map)

Peta interaktif berbasis **Leaflet + OpenStreetMap** untuk kelompok tani atau penyuluh:
- **Poligon Petak/Bedeng:** Setiap bedeng digambar sebagai poligon GeoJSON dan diwarnai dinamis sesuai kategori AVRI saat ini (Hijau = Aman, Kuning = Waspada, Oranye = Kritis, Merah = Bahaya).
- **Interaksi Klik Poligon:** Membuka panel pop-up di samping layar yang memuat kode node, status koneksi, baterai, dan grafik mini 7 hari.

---

## 3. Layar 3: Dynamic DAT Tracker & Kalender Fenologi

- **Input Inisiasi:** Tanggal Tanam (Date Picker), Varietas Benih (Dropdown: Bisi-18 / Pioneer P27 / NK-212), dan Luas Lahan.
- **Timeline Fenologi Vertikal/Horizontal:**
  - `0–7 HST` : Perkecambahan.
  - `10–14 HST (Fase V3)` : **Pemupukan Dasar / I** (NPK + sedikit Urea).
  - `30–35 HST (Fase V8)` : **Pemupukan Susulan I** (Puncak Urea vegetatif cepat).
  - `45–50 HST (Fase V12)`: **Pemupukan Susulan II** (Pembentukan malai).
  - `95–105 HST` : Estimasi Panen Pipilan Kering.
- **Card Preview WhatsApp H-3:** Menampilkan simulasi pesan WhatsApp pengingat tebus pupuk yang akan dikirim otomatis ke petani 3 hari sebelum fase V8 tiba.

---

## 4. Layar 4: Multi-Fertilizer Blender (Kalkulator Pupuk Majemuk)

- **Input:** Luas Lahan (hektar / meter persegi) dan Target Hasil Panen (ton/ha).
- **Kalkulasi Sesuai Permentan No. 40/2007:** Menghitung proporsi campuran Urea, NPK Phonska 15-15-15, dan ZA.
- **Kartu Konversi Takaran Praktis:**
  - Menampilkan jumlah karung fisik (50 kg).
  - Menampilkan jumlah ember takar ukuran 8 kg.
  - Teks petunjuk penaburan (misal: "Tabur di samping rumpun berjarak 7–10 cm, jangan terkena batang langsung").

---

## 5. Layar 5:  Risk Simulator (Demo Juri)

Panel pengujian khusus untuk dewan juri hackathon saat presentasi purwarupa:
- **Slider Kontrol Interaktif:**
  - Slider Suhu Tanah: rentang $20^\circ C$ – $45^\circ C$.
  - Slider Kelembaban Tanah: rentang $10\%$ – $80\%$.
  - Slider pH Tanah: rentang $4.0$ – $9.5$.
  - Slider Curah Hujan: rentang $0$ mm – $50$ mm.
- **Visual Gauge Meter AVRI:** Jarum gauge meter berputar seketika merespon pergerakan slider, warna berubah mulus dari hijau ke merah, dan teks preskripsi berganti secara *live* tanpa jeda.
