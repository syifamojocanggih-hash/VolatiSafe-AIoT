# PROJECT_CONTEXT.md — Konteks Proyek VolatiSafe AIoT

## 1. Problem Statement

Petani jagung di lahan kering Indonesia (khususnya sentra produksi Lampung Tengah/Timur dan Lamongan utara) umumnya melakukan penaburan pupuk Urea berdasarkan **kalender tanam konvensional**, bukan berdasarkan kondisi mikroklimat tanah aktual. 

Pada tanah alkalin atau berkapur (pH > 7,5) dengan suhu permukaan tanah melebihi 30°C serta kelembaban rendah (< 25%), enzim alami **urease** memecah Urea secara kilat menjadi gas amonia ($NH_3$). Gas ini menguap ke atmosfer sebelum sempat terlarut dan diserap perakaran tanaman.

**Rantai Masalah di Lapangan:**
```
Inspeksi manual / tebak kalender tanpa sensor mikroklimat
        ↓
Aplikasi Urea pada kondisi tanah panas-kering (kelembaban < 25%, suhu > 30°C)
        ↓
Volatilisasi amonia masif (40–50% total nitrogen hilang menguap ke udara)
        ↓
Daun jagung tetap kerdil dan menguning (disalahartikan sebagai kekurangan pupuk)
        ↓
Petani menabur pupuk Urea tambahan secara berlebihan
        ↓
Biaya pemupukan membengkak hingga 35% + emisi gas rumah kaca berbahaya (N₂O)
```

---

## 2. Research & Engineering Gap

Berdasarkan studi literatur dan observasi lapangan pada sektor agritech Indonesia:

1. **Keterbatasan Sensor NPK Statis di Pasaran:**
   Sensor NPK komersial hanya menyajikan nilai kadar statis pada satu detik pengukuran (misal: "N = 45 ppm"). Sensor tersebut tidak mampu memberikan preskripsi: *kapan waktu yang aman dan efisien untuk menabur pupuk dalam 12–72 jam ke depan*.
2. **Ketiadaan Prediksi Dinamis (Risk Window):**
   Belum ada platform AIoT terintegrasi di Indonesia yang mengombinasikan dinamika biofisika tanah (neraca air FAO-56), kinetika enzim urease, dan prakiraan cuaca real-time untuk menghasilkan **Jendela Waktu Aman Pemupukan (*Fertilization Risk Window*)**.
3. **Keterbatasan Infrastruktur Lahan Kering:**
   Sebagian besar lahan jagung berada di area *blank spot* tanpa jaringan seluler 4G/WiFi dan tanpa akses jala-jala listrik PLN, menuntut solusi sensor berdaya ultra-rendah dengan telemetri jarak jauh (LoRa).

---

## 3. Sasaran Pengguna & Mitra Validasi

| Persona | Kebutuhan Utama |
|---|---|
| **Petani Jagung Lahan Kering** (0,5–3 ha) | Rekomendasi waktu presisi kapan harus menabur Urea (jam aman vs jam bahaya) dalam bahasa praktis tanpa istilah kimia rumit. |
| **Kelompok Tani / Gapoktan** | Visibilitas data agregat per blok sawah/kebun untuk pengadaan pupuk bersama dan koordinasi irigasi. |
| **Penyuluh Pertanian Lapangan (PPL)** | Alat bantu verifikasi digital saat mendampingi petani untuk mengurangi salah diagnosa defisiensi hara. |
| **Mitra Validasi Lapangan** | Kelompok Tani Jagung Lamongan (Jawa Timur) & Lampung Tengah/Timur. |

---

## 4. Target Kompetisi & Skema Pendanaan

| Atribut | Keterangan |
|---|---|
| **Kompetisi Target** | Hackathon DeepTech for FoodTech Indonesia 2026 — Universitas Muhammadiyah Metro, Lampung |
| **Sub-Tema** | Sub-Tema A: *Smart Production & Precision Agriculture* |
| **Batas Proposal** | 31 Oktober 2026 |
| **Fase 1 (TKT 3)** | Purwarupa *low-fidelity* berbasis software (Wokwi Virtual Node + Digital Twin + Live Dashboard). |
| **Fase 2 (TKT 6)** | Uji lapangan split-plot komparatif (*Plot Presisi VolatiSafe vs Plot Kontrol Konvensional Petani*) setelah insentif pencairan komponen fisik (Rp3.000.000/tim). |

---

## 5. Ringkasan Tech Stack

| Domain | Teknologi | Rasional Pemilihan |
|---|---|---|
| **Hardware & Edge** | ESP32 NodeMCU, SX1278 LoRa 433 MHz, DS18B20, Capacitive Moisture v1.2, pH Probe | Biaya BoM rendah (≤ Rp305.000/node), efisiensi deep-sleep (baterai tahan > 90 hari). |
| **Simulasi TKT 3** | Wokwi Web / CLI, Mosquitto MQTT, dataset historis BMKG | Menguji firmware asli C++ dan aliran telemetri tanpa hardware fisik. |
| **Digital Twin** | Python 3.11, NumPy, SimPy, Neraca Air FAO-56 | Model virtual tanah kontinu untuk imputasi data saat terjadi *sensor dropout*. |
| **AI / ML Layer** | Physics-Informed ML (PIML), LightGBM Regressor, TreeSHAP | Akurasi tinggi pada dataset awal berukuran sedang, latensi inferensi < 50 ms, explainable untuk petani. |
| **Backend & Storage**| FastAPI, TimescaleDB, PostgreSQL, Docker Compose | Query time-series telemetri ultra cepat, ACID compliance, orkestrasi asinkron. |
| **Frontend Web** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Leaflet, Recharts, PWA | Tampilan responsif modern, visualisasi peta bedeng ringan, ramah sinyal lambat desa. |
| **Notifikasi** | Fonnte/Wablas WhatsApp Gateway API & Telegram Bot API | Notifikasi langsung ke aplikasi yang setiap hari dibuka oleh petani Indonesia. |
