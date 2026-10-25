# DECISIONS.md — Architecture Decision Records (ADR) VolatiSafe AIoT

> **STATUS:** LOG KEPUTUSAN ARSITEKTURAL  
> Dokumen ini mencatat keputusan-keputusan teknis penting, rasional di baliknya, dan alternatif yang ditolak agar keputusan arsitektur tidak diubah sembarangan tanpa pemahaman konteks.

---

## ADR 001: LightGBM Regressor + Physics-Informed ML (PIML) Dipilih Dibanding Deep Learning

- **Keputusan:** Menggunakan model hybrid: formulasi kinetika kimia fisika urease (Arrhenius kinetics) digabungkan dengan LightGBM Regressor yang memprediksi residual deviasi (*residual learning*).
- **Rasional:**
  1. *Small-sample robustness:* Dataset awal telemetri pertanian berukuran sedang (< 1.000 sampel). Model Deep Learning (MLP/LSTM kompleks) rawan *overfitting*.
  2. *Thermodynamic consistency:* Hukum fisika urease memastikan model tidak pernah menghasilkan prediksi yang melanggar logika (misal: memprediksi volatilisasi 0% pada tanah 40°C yang sangat kering dan basa).
  3. *Explainability:* LightGBM mendukung kalkulasi TreeSHAP secara instan (< 10 ms), esensial untuk menjelaskan alasan risiko kepada petani dan dewan juri.
  4. *Edge capability:* Model LightGBM berukuran kompak (~2 MB), memungkinkan eksekusi inferensi di cloud maupun di ESP32-S3/Raspberry Pi.
- **Alternatif Ditolak:**
  - *Deep Neural Network (DNN / MLP):* Ditolak karena black-box, membutuhkan ribuan data latih, dan rentan halusinasi batas nilai fisik.
  - *Aturan Statis Ambang Batas (Rule-based):* Ditolak karena terlalu kaku dan gagal menangkap interaksi multi-faktor antara kelembaban, radiasi matahari, dan angin.

---

## ADR 002: LoRa SX1278 433 MHz Dipilih untuk Komunikasi Lapangan

- **Keputusan:** Node sensor menggunakan modul radio LoRa SX1278 pada frekuensi 433 MHz untuk berkomunikasi dengan gateway lokal.
- **Rasional:**
  1. *Jangkauan & Hambatan:* Frekuensi 433 MHz memiliki daya tembus kanopi tanaman jagung dan vegetasi lebat lebih baik dibanding frekuensi 915 MHz atau 2.4 GHz, dengan jangkauan 2–5 km *line-of-sight*.
  2. *Bebas Lisensi & Legalitas:* Pita frekuensi 433 MHz merupakan ISM band yang legal dan bebas lisensi untuk perangkat berdaya rendah di Indonesia sesuai regulasi Ditjen SDPPI Kominfo.
  3. *Zero Recurring Cost:* Tidak memerlukan kartu SIM seluler per node sensor, menghemat biaya operasional bulanan petani.
- **Alternatif Ditolak:**
  - *Modem Seluler GSM/4G (SIM800L / A7670):* Ditolak karena boros daya (> 500 mA saat transmisi), biaya bulanan pulsa/kuota, dan tingginya blank spot di area persawahan pelosok.
  - *WiFi Langsung:* Ditolak karena jangkauan terbatas (< 50 meter) dan boros daya baterai.

---

## ADR 003: TimescaleDB Digunakan di Atas PostgreSQL

- **Keputusan:** Menggunakan PostgreSQL dengan ekstensi TimescaleDB untuk tabel telemetri deret waktu (*hypertable*).
- **Rasional:**
  1. *Efisiensi Deret Waktu:* TimescaleDB secara otomatis mempartisi data telemetri berdasarkan interval waktu (*chunking*), memberikan kecepatan query agregasi grafik 10x lebih cepat dibanding tabel relasional biasa saat data mencapai jutaan baris.
  2. *Satu Engine Terpadu:* Mengeliminasi kebutuhan menjalankan database time-series terpisah (seperti InfluxDB). Database relasional transaksional (metadata petak, user, siklus tanam) dan telemetri sensor hidup berdampingan dalam satu instance Postgres.
- **Alternatif Ditolak:**
  - *InfluxDB Terpisah:* Ditolak karena menambah kompleksitas operasional (*overhead maintain 2 database*) dan sulit melakukan join relasional antara data sensor dan profil petani.
  - *MySQL Standar:* Ditolak karena performa agregasi time-series menurun signifikan saat data membesar dan tidak memiliki fitur native chunk compression.

---

## ADR 004: Closed-Loop Software Simulation (Wokwi + BMKG Replay) untuk Prototipe TKT 3

- **Keputusan:** Pada tahap seleksi proposal (batas 31 Okt 2026), seluruh rangkaian didemonstrasikan dalam lingkungan simulasi software terpadu menggunakan Wokwi ESP32, Mosquitto MQTT, dan replay data cuaca historis BMKG Stasiun Meteorologi Lampung.
- **Rasional:**
  1. *Kepatuhan Panduan Kompetisi:* Insentif pengadaan perangkat keras fisik (Rp3.000.000/tim) baru dicairkan setelah pengumuman 10 besar finalis (9 November 2026).
  2. *Ketelitian Pengujian:* Menggunakan data historis riil BMKG Lampung (bukan angka acak `random.uniform()`) membuktikan validitas model tanpa memanipulasi data (*audit-proof provenance*).
  3. *Firmware Ready:* Kode C++ yang dieksekusi di Wokwi adalah kode yang sama 100% yang nantinya di-flash ke modul ESP32 fisik.
- **Alternatif Ditolak:**
  - *Menunggu Pembelian Hardware Fisik Sendiri:* Risiko tertinggal jadwal pengumpulan proposal 31 Oktober.
  - *Mock Acak Pure Fake:* Ditolak karena dewan juri DeepTech akan mengaudit asal-usul data (*data provenance*).

---

## ADR 005: Next.js 14 App Router + Tailwind CSS + PWA untuk Dashboard

- **Keputusan:** Membangun aplikasi web dashboard menggunakan Next.js 14, Tailwind CSS, shadcn/ui, dan konfigurasi PWA (*Progressive Web App*).
- **Rasional:**
  1. *Server-Side Rendering (SSR):* Halaman pertama langsung dirender dari server, sangat membantu kecepatan muat pada koneksi seluler 3G/HSPA di pedesaan.
  2. *Instalasi Mandiri (PWA):* Petani dapat menambahkan ikon VolatiSafe langsung ke layar utama (*homescreen*) smartphone Android tanpa harus mengunduh via Google Play Store.
  3. *Offline Cache:* Data ringkasan terakhir dan kalkulator pupuk tetap dapat diakses di tengah kebun jagung saat ponsel tidak mendapatkan sinyal.
- **Alternatif Ditolak:**
  - *Aplikasi Native Android (Flutter/Kotlin):* Ditolak untuk fase prototipe 7 hari karena *overhead development* ganda (backend + web + mobile app) dan proses instalasi APK yang merepotkan dewan juri saat evaluasi.

---

## ADR 006: Isolasi DTO & Anti-Corruption Adapter Antar-Subsubsistem

- **Keputusan:** Memisahkan batas Hardware, AI, Backend, dan Frontend menggunakan Data Transfer Objects (DTO) dan Adapter penerjemah di lapisan batas (*boundary edges*).
- **Rasional:**
  1. *Zero-Collision Multi-AI Development:* Pengembang atau AI Agent yang mengerjakan frontend tidak akan pernah terhambat oleh perubahan skema tabel backend atau penggantian pinout sensor hardware.
  2. *Mock-Driven Independence:* Frontend dapat dikembangkan 100% menggunakan `docs/frontend/MOCK_DATA.md` meskipun backend dan hardware belum dinyalakan.

---

## ADR 007: Kanal Notifikasi Mengutamakan WhatsApp & Telegram Bot

- **Keputusan:** Menggunakan WhatsApp Gateway (Wablas/Fonnte API) sebagai kanal notifikasi utama ke petani, didampingi Telegram Bot untuk grup pengurus kelompok tani.
- **Rasional:**
  1. *Kenyataan Lapangan:* Hampir seluruh petani jagung di Lampung dan Lamongan memiliki akun WhatsApp aktif, namun jarang sekali membuka dashboard web secara rutin setiap pagi.
  2. *Pesan Preskriptif Instan:* Peringatan *"JANGAN TABUR UREA SEKARANG"* yang masuk langsung pada jam 06:00 pagi langsung mencegah kerugian finansial petani di hari tersebut.

---

## ADR 008: Konversi Takaran Praktis Karung & Ember pada Kalkulator Pupuk

- **Keputusan:** Output kalkulator pupuk majemuk wajib menyajikan konversi satuan praktis lapangan: karung (50 kg) dan ember takar (8 kg).
- **Rasional:** Petani di ladang tidak membawa timbangan analitik gram; mereka menakar pupuk menggunakan ember cat plastik atau menghitung jumlah karung tebusan. Menyajikan angka laboratorium (seperti "63.75 kg Urea") memicu kebingungan dan salah takar.
