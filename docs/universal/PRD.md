# PRD.md — Product Requirements Document: VolatiSafe AIoT

> **Ringkasan:** Dokumen kebutuhan produk inti untuk pengembangan sistem prediksi risiko volatilisasi amonia dan optimasi pemupukan urea presisi.

---

## 1. Visi & Target Keberhasilan

### 1.1 Visi Produk
Memberikan panduan preskriptif berbasis mikroklimat tanah dan kecerdasan buatan kepada petani jagung lahan kering agar setiap butir pupuk Urea terserap maksimal oleh perakaran, menghemat biaya pupuk hingga 20%, dan menekan emisi gas amonia ke atmosfer.

### 1.2 Target Fase Prototipe (TKT 3 — Deadline 31 Okt 2026)
- Pipeline fungsional tertutup end-to-end: **Wokwi Sensor Virtual → LoRa/MQTT Bridge → Digital Twin FAO-56 → Inferensi PIML LightGBM → Dashboard Next.js & Telegram Alert**.
- 3 Skenario demonstrasi juri teruji tanpa bug (Terik Ekstrem, Presipitasi Hujan, Sensor Dropout Failover).
- Mockup 3D Enclosure IP65 & skema skematik sirkuit lengkap.

### 1.3 Target Fase Lapangan (TKT 6 — 12 Bulan)
- Penghematan pupuk Urea terbukti ≥ 20% pada demplot jagung (Bedeng AI vs Bedeng Kontrol).
- Akurasi klasifikasi risiko volatilisasi ≥ 85% terhadap pengujian laboratorium.
- Uptime sistem telemetri LoRa ≥ 95% selama masa tanam 100 hari.

---

## 2. Modul Fitur Utama

### F-01: Akuisisi Sensor & Kalibrasi Edge (Hardware)
- Pengambilan data berkala setiap 15 menit (kelembaban tanah kapasitif, suhu probe DS18B20, pH probe).
- Algoritma *burst sampling* (rata-rata 5 pembacaan dengan pembuangan nilai ekstrem).
- Kompensasi pergeseran pembacaan pH probe akibat kekeringan tanah ($pH_{corrected}$).
- Manajemen daya *deep sleep* dengan saklar MOSFET (GPIO25) pemutus daya sensor saat tidur.

### F-02: Agro-Climatic Digital Twin & Imputasi Failover (AI/Twin)
- Pemodelan neraca air perakaran kontinu berbasis FAO-56 Penman-Monteith ($ET_0$).
- Model perambatan panas tanah (*damped thermal diffusion*).
- *Failover engine*: Jika telemetri terputus > 30 menit, Digital Twin mengestimasi degradasi kelembaban secara matematis dan memberi tanda `[Est-Simulated]`.

### F-03: Ammonia Volatilization Risk Index / AVRI (AI Engine)
- Menghasilkan skor risiko volatilisasi amonia 0–100% dan klasifikasi 4 tingkat:
  - **Aman (0–30%):** Boleh menabur Urea segera.
  - **Waspada (31–60%):** Siram sebelum aplikasi atau tunda.
  - **Kritis (61–80%):** Tunda! Risiko kehilangan amonia tinggi.
  - **Bahaya (81–100%):** Dilarang tabur Urea (kehilangan N > 80%).
- Penjelasan Explainable AI menggunakan TreeSHAP (menampilkan faktor dominan penentu risiko).

### F-04: Dynamic DAT Tracker & Notifikasi Logistik H-3 (Backend & UI)
- Perhitungan otomatis umur tanaman (*Days After Transplanting*) berdasarkan tanggal tanam.
- Pemetaan otomatis fase fenologi jagung: Fase V3 (10–14 HST, Pemupukan Dasar), Fase V8 (30–35 HST, Pemupukan Susulan I), Fase V12 (45–50 HST, Pemupukan Susulan II).
- Pemicu otomatis pesan WhatsApp H-3 sebelum tanggal jadwal pemupukan tiba untuk mengingatkan petani menebus pupuk di kios desa.

### F-05: Multi-Fertilizer Blender & Konversi Takaran Praktis (UI & Backend)
- Menghitung kebutuhan hara bersih (N, P₂O₅, K₂O) berdasarkan luas lahan dan target tonase panen sesuai rekomendasi Permentan No. 40/2007 & Balitbangtan.
- Mengonversi racikan majemuk (Urea + NPK Phonska 15-15-15 + ZA) ke takaran fisik lapangan: **jumlah karung (50 kg) dan ember takar (8 kg)**.

### F-06: Interactive What-If Simulator (UI Demonstrasi)
- Panel kontrol interaktif pada dashboard untuk juri dan penguji dengan slider suhu, kelembaban, pH tanah, dan curah hujan.
- Menampilkan perubahan warna status risiko, nilai AVRI, dan preskripsi aksi secara *real-time* tanpa mengubah database produksi.

---

## 3. Kebutuhan Non-Fungsional (NFR)

1. **Konsumsi Daya:** Rata-rata konsumsi daya node sensor ≤ 6,5 mAh/hari. Baterai 2600 mAh bertahan minimal 90 hari tanpa sinar matahari.
2. **Latensi Inferensi:** Waktu eksekusi inferensi AI dan kalkulasi digital twin ≤ 500 ms di server backend.
3. **Keringanan Tampilan (Low Bandwidth):** Ukuran bundle frontend Next.js ≤ 500 KB (gzipped) agar dapat dibuka mulus pada jaringan seluler 3G di pedesaan.
4. **Aksesibilitas UI:** Bahasa Indonesia penuh, ukuran font judul ≥ 18px, target sentuh tombol minimal 44×44 px untuk kenyamanan petani lansia di smartphone.
