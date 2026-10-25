# UI_COMPONENTS.md — Katalog Komponen Reusable Frontend

---

## 1. `RiskBanner.tsx` (Banner Peringatan Risiko Utama)
Komponen penampil status risiko paling dominan di bagian atas dashboard:
- **Props:**
  - `level`: `'aman' | 'waspada' | 'kritis' | 'bahaya'`
  - `avriScore`: `number` (0–100)
  - `headline`: `string`
  - `bestWindow`: `string`
- **Tampilan:** Menggunakan latar belakang sesuai token `DESIGN_SYSTEM.md`, teks kontras tinggi, ikon status, dan tombol aksi cepat *"Lihat Preskripsi Lengkap"*.

---

## 2. `MetricCard.tsx` (Kartu Metrik Sensor dengan Delta 24 Jam)
Menampilkan satu parameter sensor dengan indikator perubahan:
- **Props:**
  - `label`: `string` (misal: "Kelembaban Tanah")
  - `value`: `number | string` (misal: 22.4)
  - `unit`: `string` (misal: "%")
  - `delta24h`: `number` (misal: -3.2)
  - `status`: `'normal' | 'warning' | 'danger'`
- **Fitur Visual:** Menampilkan tanda panah kenaikan/penurunan (`↑` / `↓`) dengan warna kontekstual (misal: suhu naik diwarnai oranye/merah karena menaikkan penguapan).

---

## 3. `TelemetryTrendChart.tsx` (Grafik Fluktuasi 24 Jam)
Grafik interaktif menggunakan **Recharts**:
- **Dua Sumbu Y (Dual Axis):** Sumbu kiri untuk Kelembaban Tanah ($0–100\%$), sumbu kanan untuk Suhu Tanah ($0–50^\circ C$).
- **Garis Ambang Batas (*ReferenceLine*):**
  - Garis merah putus-putus pada Suhu $30^\circ C$ (zona pemicu aktivitas urease tinggi).
  - Garis kuning putus-putus pada Kelembaban $25\%$ (zona kekeringan kritis).
- **Tooltip:** Menampilkan waktu pencatatan, nilai sensor, dan label `[Simulasi]` jika titik data berasal dari imputasi Digital Twin.

---

## 4. `ForecastWindowStrip.tsx` (Bar Strip Jendela Aman 72 Jam)
Komponen horizontal yang membagi proyeksi 72 jam ke dalam balok-balok 3 jam:
- **Warna Balok:**
  - Balok Hijau: Jendela waktu pemupukan aman (AVRI < 30%).
  - Balok Kuning: Waspada / butuh penyiraman (AVRI 31–60%).
  - Balok Oranye / Merah Terang: Waktu terik berisiko tinggi (AVRI > 60%).
- **Interaksi:** Mengklik salah satu balok akan memunculkan perkiraan suhu udara, kemungkinan hujan, dan skor risiko pada jam tersebut.

---

## 5. `ShapAttributionList.tsx` (Kartu Penjelasan TreeSHAP)
Daftar faktor pemicu risiko yang dirancang mudah dibaca petani:
- **Struktur Bar:** Menampilkan persentase dampak relatif (misal: *"Suhu Tanah Panas: +38.5%"*) dengan progress bar berwarna oranye/merah.
- **Teks Pendamping:** Kalimat penjelasan praktis dalam bahasa Indonesia (lihat `EXPLAINABILITY_SHAP.md`).

---

## 6. `FertilizerBucketCard.tsx` (Visualisasi Takaran Karung & Ember)
Menampilkan hasil racikan pupuk majemuk dalam representasi objek nyata:
- **Ilustrasi Karung:** Ikon karung pupuk 50 kg dengan jumlah karung tebusan (misal: $1\frac{1}{2}$ karung Urea + $1\frac{1}{2}$ karung Phonska).
- **Ilustrasi Ember:** Ikon ember cat plastik 8 kg dengan angka tebal jumlah ember campuran (misal: `18 Ember Takar`).

---

## 7. `BedengRiskMap.tsx` (Peta Poligon Lahan Leaflet)
- **Komponen:** Menggunakan `react-leaflet` dengan tile OpenStreetMap.
- **Lapisan Poligon GeoJSON:** Poligon bedeng diwarnai otomatis sesuai status skor AVRI petak.
- **Interaksi:** Klik bedeng untuk berganti fokus petak di dashboard utama.


