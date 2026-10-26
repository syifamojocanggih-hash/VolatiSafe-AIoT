
0# FLOWS.md — Alur Interaksi Pengguna (User Flows)

---

## 1. Alur 1: Pemeriksaan Harian Petani di Pagi Hari (Daily Check Flow)

Alur utama yang dilakukan petani setiap pukul 05:30 – 06:30 pagi sebelum berangkat ke ladang:

```
[ Terima Alert WhatsApp Jam 05:30 ]
 ("VolatiSafe: Hari ini Risiko 74%, TUNDA Urea hingga besok 06:00 WIB")
                  │
                  ▼
[ Buka Web App / PWA dari Homescreen HP ]
                  │
                  ▼
[ Layar 1 — Dashboard Petak ]
 • Melihat Banner Merah: "RISIKO KRITIS 74%"
 • Melihat Suhu Tanah 34.1°C & Kelembaban 22.4%
 • Membaca Kartu Explainability: "Suhu terik memicu penguraian cepat urease"
                  │
                  ▼
[ Keputusan Petani ]
 ├── PILIHAN A: Menunda penaburan pupuk (Hemat biaya pupuk, target tercapai)
 └── PILIHAN B: Melakukan penyiraman air pra-aplikasi minimal 2 mm
```

---

## 2. Alur 2: Perencanaan Siklus Tanam & Logistik Pupuk (Planning Flow)

Alur saat petani baru menanam benih jagung:

```
[ Masuk Layar 3 — Dynamic DAT Tracker ]
                  │
                  ▼
[ Input Tanggal Tanam & Varietas ]
 (Contoh: 1 November 2026, Benih Bisi-18, Luas 0.75 ha)
                  │
                  ▼
[ Sistem Menghasilkan Kalender Fenologi Otomatis ]
 • 12 Nov (12 HST): Pemupukan Dasar (V3)
 • 31 Nov (30 HST): Pemupukan Susulan I (V8) ──> Scheduled WA Reminder H-3 (28 Nov)
 • 18 Des (48 HST): Pemupukan Susulan II (V12) ──> Scheduled WA Reminder H-3 (15 Des)
                  │
                  ▼
[ Masuk Layar 4 — Kalkulator Campuran Pupuk ]
 • Sistem menampilkan: "Siapkan 1.5 Karung Urea + 1.5 Karung Phonska (18 Ember Takar)"
                  │
                  ▼
[ Petani Menuju Kios Desa & Tebus Pupuk Sesuai Takaran ]
```

---

## 3. Alur 3: Presentasi Demonstrasi Dewan Juri (Jury Demo Flow)

Alur cepat 2 menit yang disimulasikan saat sesi penjurian Hackathon DeepTech for FoodTech 2026:

```
[ Juri Membuka Layar 5 —  Risk Simulator ]
                  │
                  ▼
[ Demonstrasi Skenario A — Terik Ekstrem ]
 • Geser slider Suhu ke 34.5°C, Kelembaban 21%, pH 7.85
 • Gauge meter melompat ke 78% (Kritis/Merah)
 • Bot Telegram menembakkan alert peringatan instan ke HP penguji
                  │
                  ▼
[ Demonstrasi Skenario B — Hujan Pembuka Jendela Aman ]
 • Geser slider Curah Hujan ke 15 mm, Kelembaban naik ke 42%
 • Gauge meter anjlok ke 18% (Aman/Hijau)
 • Banner preskripsi berubah: "WAKTU TEPAT MENABUR UREA"
                  │
                  ▼
[ Demonstrasi Skenario C — Sensor Dropout Failover ]
 • Matikan koneksi node Wokwi
 • Dashboard mendeteksi sensor offline dan menampilkan label [Est-Simulated]
 • Menunjukkan ketahanan sistem tanpa crash (*Graceful Failover*)
```
