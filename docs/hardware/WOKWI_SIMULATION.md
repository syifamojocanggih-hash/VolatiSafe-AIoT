# WOKWI_SIMULATION.md — Panduan Simulasi Perangkat Keras Virtual (TKT 3)

---

## 1. Peran Virtual Testbed dalam Seleksi Proposal

Sesuai regulasi kompetisi *DeepTech for FoodTech Indonesia 2026*, insentif pengadaan fisik (Rp3.000.000) baru dicairkan setelah lolos 10 besar. Pada fase awal (TKT 3), purwarupa dijalankan 100% menggunakan simulator **Wokwi** yang menjalankan firmware C++ asli dan terhubung langsung ke broker MQTT backend.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ALUR VIRTUAL TESTBED WOKWI                            │
│                                                                             │
│   [ Wokwi ESP32 Virtual ]                                                   │
│   Potensiometer Kelembaban (GPIO34)                                         │
│   Sensor Suhu DS18B20 (GPIO4)                                               │
│   Potensiometer pH (GPIO32)                                                 │
│            │                                                                │
│            ▼ (Virtual WiFi / Gateway Loopback)                              │
│   [ Mosquitto MQTT Broker ] (localhost:1883)                                │
│   Topik: /volatisafe/v1/node/VS-SIM-001/telemetry                           │
│            │                                                                │
│            ▼                                                                │
│   [ Ingestion Pipeline & Digital Twin Backend ]                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Struktur File Simulasi (`simulation/wokwi/`)

1. **`diagram.json`**: Menentukan penempatan komponen virtual (ESP32, sensor suhu DS18B20, potensiometer geser simulasi kelembaban & pH, resistor pull-up 4.7kΩ).
2. **`wokwi.toml`**: Konfigurasi environment simulator (lokasi binary firmware ELF hasil build).
3. **`main.cpp`**: Kode firmware yang sama persis dengan yang akan di-flash ke hardware fisik.

---

## 3. Tiga Skenario Demonstrasi Pengujian untuk Juri (Demo Day)

Simulasi Wokwi dirancang untuk membuktikan 3 skenario lapangan ekstrem:

### Skenario A — Terik Ekstrem Siang Hari (High Volatilization Risk)
- **Injeksi Data:** Geser potensiometer kelembaban ke nilai 21% (kering), potensiometer suhu ke 34.5°C, dan pH ke 7.85.
- **Respon Sistem:**
  1. Wokwi memancarkan payload telemetri suhu tinggi dan kelembaban rendah.
  2. Digital Twin mendeteksi defisit air perakaran kritis.
  3. AI Engine menghitung skor **AVRI 78% (Kategori Kritis)**.
  4. Dashboard menampilkan banner merah peringatan: *"JANGAN TABUR UREA SEKARANG"*.
  5. Bot Telegram mengirimkan alert instan: *"⚠️ RISIKO KRITIS 78%: Jendela aman terdekat besok 06:00 WIB"*.

### Skenario B — Presipitasi Hujan Sore (Safe Window Opening)
- **Injeksi Data:** Simulasikan hujan 15 mm; geser potensiometer kelembaban naik ke 42% dan suhu tanah turun ke 26.0°C.
- **Respon Sistem:**
  1. Digital Twin memperbarui neraca air tanah FAO-56.
  2. Enzim urease terlarut dalam air tanah dan risiko penguapan amonia turun drastis.
  3. AI Engine mengeluarkan skor **AVRI 18% (Kategori Aman)**.
  4. Dashboard berubah hijau cerah dengan preskripsi: *"WAKTU TEPAT MENABUR UREA: Jendela aman terbuka 120 menit ke depan"*.

### Skenario C — Uji Ketahanan Jaringan / Sensor Dropout (Digital Twin Failover)
- **Injeksi Data:** Putus koneksi virtual node Wokwi secara sengaja selama 2 jam (simulasi baterai habis atau blank spot LoRa).
- **Respon Sistem:**
  1. Gateway menandai status node *OFFLINE*.
  2. Digital Twin secara otomatis mengambil alih (*failover*) dengan mengestimasi degradasi kelembaban tanah menggunakan persamaan difusi FAO-56.
  3. Dashboard tetap menampilkan grafik kontinu dengan label `[Est-Simulated]` tanpa sistem mengalami crash.
