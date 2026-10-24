# PRD — VolatiSafe AIoT
## Sistem Prediksi Risiko Volatilisasi Amonia untuk Optimasi Jendela Waktu Pemupukan Urea Presisi

| Atribut | Keterangan |
|---|---|
| **Nama Produk** | VolatiSafe AIoT |
| **Versi PRD** | 1.0 (Draft Prototipe TKT 3) |
| **Tanggal** | 24 Oktober 2026 |
| **Kompetisi Target** | Hackathon DeepTech for FoodTech Indonesia 2026 — UM Metro, Lampung |
| **Sub-Tema** | A — Smart Production & Precision Agriculture |
| **Deadline Proposal** | 31 Oktober 2026 |
| **Target TKT** | TKT 3 (seleksi awal) → TKT 6 (akhir program) |
| **Mitra Validasi** | Kelompok Tani Jagung — Lamongan (Jawa Timur) & Lampung Tengah/Timur |
| **Tim** | BayWise (5 orang: 1 dosen, 3 mahasiswa, 1 profesional) |

---

## 1. Latar Belakang & Problem Statement

### 1.1 Masalah Spesifik

Petani jagung di lahan kering (Lampung Tengah/Timur & Lamongan utara) menabur pupuk Urea berdasarkan **kalender tanam**, bukan berdasarkan kondisi mikroklimat tanah aktual. Pada tanah alkalin/kapur (pH > 7,5) dengan suhu permukaan tanah > 30°C, enzim urease memecah Urea menjadi gas amonia (NH₃) yang menguap ke atmosfer sebelum sempat diserap akar.

**Rantai sebab-akibat:**
```
Inspeksi manual / tebak kalender
        ↓
Aplikasi Urea pada kondisi tanah panas-kering (kelembaban < 25%)
        ↓
Volatilisasi amonia 40–50% dari total nitrogen hilang ke udara
        ↓
Daun jagung tetap menguning & kerdil (gejala mirip kekurangan N)
        ↓
Petani salah diagnosa → tambah dosis pupuk Urea lagi
        ↓
Biaya pemupukan membengkak 35% + emisi gas rumah kaca (N₂O)
```

### 1.2 Research Gap

Sensor NPK di pasaran hanya menyajikan **kadar statis** ("N = 45 ppm"). Tidak ada sistem yang memprediksi **Jendela Waktu Aman Pemupukan (Fertilization Risk Window)** — yaitu rentang jam ke depan di mana aplikasi Urea akan efisien vs terbuang.

### 1.3 Sasaran Pengguna

| Persona | Kebutuhan Utama |
|---|---|
| **Petani jagung lahan kering** (pemilik 0,5–3 ha) | Tahu kapan waktu tepat menabur Urea, tanpa harus paham kimia tanah |
| **Kelompok Tani / Gapoktan** | Data agregat seluruh petak untuk pengadaan pupuk bersama |
| **Penyuluh Pertanian Lapangan (PPL)** | Alat bantu edukasi & verifikasi lapangan saat kunjungan |
| **Koperasi / Penyalur Saprodi** | Prediksi kebutuhan pupuk kolektif |

---

## 2. Tujuan Produk & Metrik Keberhasilan

### 2.1 Tujuan Fase Prototipe (TKT 3, 1 minggu)

- Membuktikan bahwa pipeline **sensor → kalibrasi edge → prediksi AI → rekomendasi aksi** dapat berjalan end-to-end secara software.
- Menghasilkan bukti purwarupa *low-fidelity* (Wokwi + digital twin + dashboard) untuk lampiran pendaftaran 31 Okt.

### 2.2 Tujuan Fase Program (12 bulan, TKT 6)

- Uji empiris 2 siklus tanam jagung: **Bedeng AI vs Bedeng Kontrol**.
- Penghematan pupuk Urea **≥ 20%** dibanding praktik petani (baseline diukur).
- Akurasi klasifikasi status risiko (Aman/Waspada/Kritis) **≥ 85%** terhadap validasi laboratorium.

### 2.3 Metrik Teknis yang Dapat Gagal

| Metrik | Ambang | Cara Ukur |
|---|---|---|
| Akurasi kalibrasi NPK terhadap kelembaban | MAE ≤ 8% | Uji pada 30 sampel tanah dengan lab reference |
| Latensi inferensi Edge | ≤ 2 detik | Timestamp di firmware |
| Uptime telemetri | ≥ 95% | Log gateway 30 hari |
| Umur baterai node | ≥ 60 hari | Uji discharge 18650 |
| Ketepatan rekomendasi (precision) | ≥ 85% | Konfusi matriks vs keputusan agronom |
| Akurasi alert WhatsApp terkirim | ≥ 98% | Log API gateway |

---

## 3. Arsitektur Sistem (4 Lapis)

```
┌─────────────────────────────────────────────────────────────────────┐
│ LAPIS 1 — FIELD NODE (Edge Sensing)                                 │
│  ESP32 + Capacitive Moisture v1.2 + DS18B20 + Soil pH + LoRa SX1278 │
│  Deep Sleep 15 menit · Sampling burst 5x · MOSFET gate sensor VCC   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ LoRa 433 MHz (2–5 km, no internet)
┌────────────────────────────▼────────────────────────────────────────┐
│ LAPIS 2 — GATEWAY (LoRa → MQTT Bridge)                              │
│  ESP32 + LoRa RX + WiFi · Store-and-Forward (SD card buffer)        │
│  Ditempatkan di base camp petani (ada listrik & WiFi)               │
└────────────────────────────┬────────────────────────────────────────┘
                             │ MQTT (TLS) / HTTPS REST
┌────────────────────────────▼────────────────────────────────────────┐
│ LAPIS 3 — DIGITAL TWIN & AI ENGINE (Core Intelligence)              │
│  • Agro-Climatic Digital Twin (state tanah virtual, FAO-56 ET₀)     │
│  • Feature Store (TimescaleDB / InfluxDB)                           │
│  • Model: LightGBM Regressor + Physics-Informed Urease Decay        │
│  • Output: Ammonia Volatilization Risk Index (0–100%)               │
└────────────────────────────┬────────────────────────────────────────┘
                             │ WebSocket / REST API
┌────────────────────────────▼────────────────────────────────────────┐
│ LAPIS 4 — PRESENTATION LAYER (Web Dashboard & Alert)                │
│  React/Next.js Dashboard · Peta Risiko per Bedeng · Chart           │
│  Telegram/WhatsApp Bot · Preskripsi Dosis & Jendela Waktu           │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.1 Spesifikasi Lingkungan Simulasi Penuh (Closed-Loop Virtual Testbed — TKT 3)

Pada fase seleksi proposal (batas 31 Okt 2026), sistem **100% dijalankan dalam lingkungan simulasi tertutup (Full-Simulation Software Environment)**. Hal ini selaras dengan skema panduan resmi: insentif belanja komponen fisik (Rp3.000.000/tim) baru dicairkan setelah pengumuman 10 besar (9 November 2026). Seluruh protokol komunikasi, skema payload, dan logika komputasi dibangun **identik dengan implementasi perangkat keras riil**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLOSED-LOOP VIRTUAL TESTBED ARCHITECTURE                 │
│                                                                             │
│ [ VIRTUAL IOT NODE ] (Wokwi Web / Local CLI)                                │
│   • ESP32 C++ Firmware asli mengeksekusi sampling, filtering, & deep-sleep  │
│   • Sensor virtual digerakkan data injeksi (Moisture, Temp, pH)             │
│   • Output: Payload JSON via Virtual MQTT Bridge (Mosquitto)                │
│                               │                                             │
│                               ▼ (MQTT localhost:1883)                       │
│ [ AGRO-CLIMATIC DIGITAL TWIN ] (Python / SimPy Engine)                      │
│   • Memutar ulang (playback) dataset deret-waktu BMKG Lampung Tengah        │
│   • Menghitung neraca air tanah FAO-56 (ET₀) & difusi termal kontinu        │
│   • Mengisi celah anomali data sensor (State-Space Imputation)              │
│                               │                                             │
│                               ▼                                             │
│ [ AI RISK PREDICTOR ] (LightGBM + Physics-Informed Urease Layer)            │
│   • Mengevaluasi fitur telemetri live + proyeksi cuaca 12 jam ke depan      │
│   • Menghitung skor AVRI (0–100%) & status risiko (Aman/Waspada/Kritis)     │
│                               │                                             │
│                               ▼ (WebSocket / REST API)                      │
│ [ PRESENTATION LAYER ] (Live Next.js / Streamlit Dashboard + Telegram Bot)  │
│   • Visualisasi real-time pergerakan grafik telemetri virtual               │
│   • Peta petak sawah/ladang dengan perubahan warna zonasi risiko dinamis    │
│   • Panel Interaktif "What-If Simulator" untuk pengujian langsung oleh juri │
│   • Pengiriman pesan bot alert instan ke smartphone penguji                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Tiga Skenario Injeksi Pengujian untuk Juri (Demo Day / Bukti Purwarupa):

1. **Skenario A — Terik Ekstrem Siang Hari (High Volatilization Risk):**
   * *Injeksi Data:* Suhu tanah 34,5°C, kelembaban tanah 21% (kering), pH 7,85, radiasi surya tinggi.
   * *Respon Sistem:* Digital twin mendeteksi defisit air kritis; AI mengeluarkan skor **AVRI 78% (Kritis)**; Dashboard menampilkan banner merah peringatan; Bot Telegram menembakkan alert *"JANGAN TABUR UREA: Potensi penguapan 78%. Jendela aman terdekat: Besok 06:00 WIB"*.
2. **Skenario B — Presipitasi Hujan Sore (Safe Window Opening):**
   * *Injeksi Data:* Data BMKG memicu event hujan 15 mm; kelembaban tanah naik ke 42%; suhu tanah turun ke 26°C.
   * *Respon Sistem:* Digital twin memperbarui neraca air tanah; enzim urease terlarut; skor **AVRI turun drastis ke 18% (Aman)**; Dashboard berubah menjadi hijau dengan rekomendasi *"Waktu optimal pemupukan: 120 menit ke depan"*.
3. **Skenario C — Uji Ketahanan Jaringan / Sensor Dropout (Digital Twin Imputation):**
   * *Injeksi Data:* Node IoT virtual diputus secara sengaja selama 2 jam (mensimulasikan blank spot / baterai drop).
   * *Respon Sistem:* Gateway menandai status node *offline*; Digital Twin secara otomatis mengambil alih (*failover*) dengan mengestimasi degradasi kelembaban berbasis persamaan FAO-56; Dashboard tetap menyajikan data bertanda `[Est-Simulated]` tanpa sistem mengalami *crash*.

---

## 4. KOMPONEN IoT — Spesifikasi Teknis

### 4.1 Bill of Materials (BoM) per Node

| # | Komponen | Spesifikasi | Qty | Harga Satuan | Interface | Peran |
|---|---|---|---|---|---|---|
| 1 | **MCU** | ESP32 NodeMCU V1 (30-pin, CP2102) | 1 | Rp55.000 | WiFi/BLE/SPI/I2C/ADC | Akuisisi, edge preprocessing, kontrol LoRa |
| 2 | **Sensor Kelembaban Tanah** | Capacitive Soil Moisture v1.2 (anti-korosi) | 1 | Rp15.000 | Analog → ADC GPIO34 | Input utama model (kelembaban = faktor #1 penekan volatilisasi) |
| 3 | **Sensor Suhu Tanah** | DS18B20 Stainless Waterproof Probe | 1 | Rp18.000 | 1-Wire → GPIO4 + 4.7kΩ pullup | Input utama (suhu = pemicu aktivitas urease) |
| 4 | **Sensor pH Tanah** | Analog Soil pH Probe + Modul (pH 0–14) | 1 | Rp62.000 | Analog → ADC GPIO32 | Modifier risiko (pH > 7,5 mempercepat hidrolisis urea) |
| 5 | **Modul LoRa** | SX1278 Ra-02 433 MHz + Antena Spring | 1 | Rp45.000 | SPI (SCK18/MISO19/MOSI23/CS5/RST14/DIO2) | Telemetri jarak jauh tanpa internet |
| 6 | **Manajemen Daya** | TP4056 + Proteksi DW01 + Baterai 18650 2600mAh | 1 | Rp45.000 | VCC / 3.7V | Catu daya mandiri |
| 7 | **Panel Surya** | Mini 5V 1W Polycrystalline + Dioda | 1 | Rp25.000 | Charger input TP4056 | Recharge otomatis |
| 8 | **Catu Sensor** | Modul MOSFET IRLZ44N / Relay 5V 1-Channel | 1 | Rp10.000 | GPIO gate | Memutus VCC sensor saat sleep (anti-elektrolisis probe) |
| 9 | **Enclosure** | Box Junction PVC IP65 + Pipa PVC ¾" (probe housing) | 1 | Rp30.000 | — | Tahan hujan & radiasi UV |
| | **TOTAL per node** | | | **± Rp305.000** | | Target optimasi: ≤ Rp250.000 (10 node = Rp3,05 jt, sesuai plafon Rp3 jt) |

> **Catatan biaya:** Untuk 10 node, komponen dikomunikasikan sebagai *starter kit* dengan potensi penurunan harga melalui pembelian batch (estimasi −25% pada volume 10+). Plafon dana purwarupa Rp3.000.000 dapat menutup 8–10 node.

### 4.2 Pin Mapping ESP32

| Sensor | Pin ESP32 | Tipe | Catatan |
|---|---|---|---|
| Capacitive Moisture SIG | GPIO 34 | ADC1_CH6 (input only) | Gunakan ADC1, bukan ADC2 (ADC2 konflik dengan WiFi) |
| Soil pH SIG | GPIO 32 | ADC1_CH4 | Kalibrasi 2-titik buffer pH 4.01 & 6.86 |
| DS18B20 DATA | GPIO 4 | 1-Wire digital | Wajib resistor pull-up 4.7kΩ ke 3.3V |
| MOSFET Sensor Gate | GPIO 25 | Digital output | HIGH = sensor menyala, LOW = sleep |
| LoRa SCK | GPIO 18 | SPI CLK | — |
| LoRa MISO | GPIO 19 | SPI MISO | — |
| LoRa MOSI | GPIO 23 | SPI MOSI | — |
| LoRa NSS/CS | GPIO 5 | SPI CS | — |
| LoRa RESET | GPIO 14 | Digital output | — |
| LoRa DIO0 | GPIO 2 | Interrupt input | Trigger TX/RX done |

### 4.3 Firmware Logic (Pseudocode)

```
SETUP:
  Serial.begin(115200)
  analogSetAttenuation(ADC_11db)        // baca hingga ~3.1V
  init LoRa SX1278 (433.0 MHz, SF7, BW125, CR4/5, +17dBm)
  baca kalibrasi dari NVS flash (dryADC, wetADC, pH_slope, pH_offset)

LOOP:
  // 1. Sampling burst (rata-rata 5 pembacaan, buang outlier)
  digitalWrite(GPIO25, HIGH); delay(200)     // nyalakan sensor
  for i in 1..5:
    moisture_raw += analogRead(GPIO34)
    ph_raw       += analogRead(GPIO32)
  temp_c = ds18b20.readTemperature()
  digitalWrite(GPIO25, LOW)                   // matikan sensor

  // 2. Konversi & kalibrasi
  moisture_pct = constrain(map(moisture_raw/5, dryADC, wetADC, 0, 100), 0, 100)
  ph_value     = 7.0 - ((ph_raw/5 - ph_neutral_adc) / ph_slope)
  temp_c       = constrain(temp_c, -10, 60)

  // 3. Edge preprocessing — kalibrasi pH terhadap kelembaban
  //    (pembacaan pH probe bergeser saat tanah kering)
  ph_corrected = ph_value + (0.15 * (50 - moisture_pct) / 50)

  // 4. Susun payload JSON ringkas (hemat bandwidth LoRa)
  payload = {
    "node": NODE_ID,
    "ts":   epoch_now(),
    "m":    round(moisture_pct, 1),
    "t":    round(temp_c, 1),
    "ph":   round(ph_corrected, 2),
    "bat":  read_battery_voltage()
  }

  // 5. Kirim via LoRa (retry maks 3x, ACK dari gateway)
  for attempt in 1..3:
    if lora_send(payload) == ACK: break
    delay(2000)

  // 6. Deep sleep 15 menit
  esp_sleep_enable_timer_wakeup(15 * 60 * 1_000_000)
  esp_deep_sleep_start()
```

### 4.4 Perhitungan Konsumsi Daya

| Fase | Arus | Durasi | mAh/siklus |
|---|---|---|---|
| Deep Sleep | 10 µA | 899 s | 0,0025 |
| Sensor aktif + sampling | 15 mA | 1 s | 0,004 |
| LoRa TX @ +17dBm | 120 mA | 0,5 s | 0,017 |
| ESP32 aktif (overhead) | 80 mA | 2 s | 0,044 |
| **Total per siklus (15 menit)** | | | **≈ 0,0675 mAh** |
| **Per hari (96 siklus)** | | | **≈ 6,5 mAh** |
| **Umur baterai 2600 mAh** | | | **≈ 400 hari (teoretis)** |
| **Realistis (efisiensi 60%, cuaca mendung)** | | | **≈ 90–120 hari** |

Penambahan panel surya 1W (≈ 150 mAh/hari saat cerah) membuat node berpotensi **tidak perlu baterai diganti sepanjang siklus tanam jagung (100–120 hari)**.

---

## 5. DIGITAL TWIN — Spesifikasi

### 5.1 Definisi & Peran

Digital twin di sini **bukan visualisasi 3D**. Ini adalah **model state virtual** yang mereplikasi kondisi biofisik tanah secara kontinu, dipakai untuk:
1. Mengisi celah data saat sensor gagal/offline (imputasi).
2. Menjalankan simulasi *what-if* (misal: "jika hujan turun 20 mm dalam 3 jam, bagaimana risiko volatilisasi?").
3. Menjadi jembatan antara data telemetri mentah dan model AI.

### 5.2 State Vector Digital Twin

Setiap petak/bedeng direpresentasikan sebagai vektor state yang diperbarui setiap siklus telemetri:

| Variabel | Simbol | Satuan | Sumber | Model Transisi |
|---|---|---|---|---|
| Kelembaban tanah | θ | % VWC | Sensor langsung | Neraca air FAO-56 |
| Suhu tanah (5 cm) | T_soil | °C | Sensor langsung | Difusi panas tanah (damped) |
| pH tanah | pH | — | Sensor + koreksi | Dinamika pengapuran (lambat) |
| Kelembaban udara | RH | % | API cuaca / node tambahan | — |
| Suhu udara | T_air | °C | API cuaca | — |
| Radiasi surya | R_s | MJ/m²/hari | API cuaca (BMKG/OpenWeather) | Model Hargreaves |
| Curah hujan forecast | P | mm/3 jam | API BMKG | — |
| Kecepatan angin | u₂ | m/s | API cuaca | — |
| Hari setelah tanam | DAT | hari | Input petani | — |
| Log pemupukan | F_log | (tanggal, dosis) | Input petani | — |

### 5.3 Model Transisi Biofisik

**a. Neraca Air Tanah (FAO-56):**
```
ET₀ = 0.408 · Δ · (R_n - G) + γ · (900/(T+273)) · u₂ · (e_s - e_a)
      ────────────────────────────────────────────────────────────
                    Δ + γ · (1 + 0.34 · u₂)

ET_c = K_c · ET₀                     // K_c dari tabel fase pertumbuhan jagung
Δθ   = (P_effective - ET_c - Runoff) / Root_depth
θ(t+1) = clamp(θ(t) + Δθ, θ_wp, θ_fc)   // water point .. field capacity
```

**b. Suhu Tanah Terdampak (Damped Thermal Diffusion):**
```
T_soil(t+1) = T_soil(t) + α · (T_air_filtered - T_soil(t))
α = 0.12  (faktor redaman tanah lembap)
α = 0.28  (tanah kering — respons lebih cepat)
```

**c. Dinamika pH (Perubahan Lambat):**
```
pH(t+1) = pH(t) - 0.002 · (N_applied)   // pengasaman per kg N/ha
pH(t+1) = pH(t) + 0.05 · (lime_applied) // efek dolomit
```

### 5.4 Mode Operasi

| Mode | Kondisi | Perilaku |
|---|---|---|
| **Live** | Sensor mengirim data normal (< 30 menit) | Digital twin pakai nilai sensor langsung |
| **Interpolasi** | Sensor hilang 30 menit – 6 jam | Model transisi memprediksi nilai (timestamps ditandai `predicted`) |
| **Forecast** | Selalu aktif | Proyeksi 12 jam ke depan untuk jendela pemupukan |
| **What-if** | Dipicu user dari dashboard | Simulasi skenario hujan/pemupukan tanpa mengubah state live |

### 5.5 Stack Teknologi Digital Twin

| Komponen | Teknologi | Alasan |
|---|---|---|
| Bahasa | Python 3.11 | Ekosistem agronomi & ML |
| Penyimpanan time-series | **TimescaleDB** (ekstensi PostgreSQL) | Hypertable untuk data sensor, query rentang waktu cepat |
| Penyimpanan state | PostgreSQL (tabel `field_state`) | Relasional, transaksional |
| Perhitungan neraca air | NumPy + `pyfao56` (atau implementasi sendiri) | Standar FAO-56 terdokumentasi |
| Scheduler | APScheduler / Celery Beat | Update state tiap 15 menit |
| API internal | FastAPI | Satu bahasa dengan ML, dokumentasi OpenAPI otomatis |
| Simulator data (fase prototipe) | **Pandas + NumPy** dengan dataset cuaca historis BMKG | Menghindari angka acak murni |

### 5.6 Anti-Jebakan: Menghindari "Fake Simulator"

Pada fase prototipe software (sebelum hardware tersedia), digital twin dijalankan dengan **dataset cuaca historis riil** (BMKG Stasiun Meteorologi Lampung/Lamongan), bukan `random.uniform()`. Sumber data disimpan di tabel `data_provenance` agar dapat diaudit juri.

---

## 6. AI ENGINE — Model & Pipeline

### 6.1 Model Utama: Ammonia Volatilization Risk Index (AVRI)

**Output:** Skor 0–100% yang merepresentasikan probabilitas nitrogen hilang sebagai gas NH₃ dalam 12 jam setelah aplikasi Urea.

**Arsitektur: LightGBM Regressor (gradient boosting, quantile loss)**

| Fitur | Tipe | Sumber | Kepentingan (perkiraan) |
|---|---|---|---|
| Kelembaban tanah | float | Sensor | ★★★★★ |
| Suhu tanah | float | Sensor | ★★★★★ |
| pH tanah (terkoreksi) | float | Sensor | ★★★★☆ |
| Suhu udara | float | Cuaca | ★★★☆☆ |
| Kecepatan angin | float | Cuaca | ★★★☆☆ |
| Selisih (T_soil − T_air) | derived | Komputasi | ★★★☆☆ |
| Curah hujan 6 jam ke depan | float | API BMKG | ★★★★☆ |
| Jam setelah aplikasi Urea terakhir | int | Input petani | ★★★☆☆ |
| Hari setelah tanam (DAT) | int | Input petani | ★★☆☆☆ |

**Kenapa LightGBM, bukan Deep Learning?**
1. Dataset awal kecil (< 500 sampel) — DL akan overfit.
2. Perlu explainability (TreeSHAP) untuk meyakinkan petani & PPL.
3. Ringan untuk Edge Inference (~2 MB model, latensi < 500 ms di ESP32-S3 atau < 50 ms di server).

**Pembanding wajib (baseline non-AI):** aturan statis "jangan pupuk jika kelembaban < 30%" dan tabel persentil historis. Model harus mengalahkan keduanya pada metrik out-of-time.

### 6.2 Physics-Informed Constraints

Model hybrid (ML + fisika) agar tidak melanggar hukum termodinamika:

```
// Lapisan fisika: urea decay kinetics
k_urease(T) = A · exp(-Ea / (R · (T + 273.15)))
    A  = 3.2e8  /jam
    Ea = 51.000 J/mol (energi aktivasi urease, literatur)
    R  = 8.314 J/(mol·K)

hydrolysis_rate = k_urease(T_soil) · f_moisture(θ) · f_pH(pH)
    f_moisture(θ) = θ / (θ + k_m)   dengan k_m ≈ 18% VWC (Michaelis-Menten)
    f_pH(pH)      = 10^(pH - 7.0) / (1 + 10^(pH - 7.0))  // kurva sigmoid

// ML memprediksi RESIDUAL dari model fisika, bukan menggantikannya
AVRI = clip(physics_model(fitur) + lightgbm_residual(fitur), 0, 100)
```

Pendekatan ini disebut **Physics-Informed ML (PIML)** dan menjadi pembeda kuat di mata juri AI — menunjukkan pemahaman mekanisme, bukan sekadar *black box fitting*.

### 6.3 Klasifikasi Risiko & Preskripsi

| Skor AVRI | Kategori | Warna | Preskripsi Sistem |
|---|---|---|---|
| 0–30% | **Aman** | 🟢 Hijau | "Waktu tepat menabur Urea. Lakukan sekarang." |
| 31–60% | **Waspada** | 🟡 Kuning | "Tabur hanya jika kelembaban naik ≥ 30%. Siram ringan sebelum aplikasi." |
| 61–80% | **Kritis** | 🟠 Oranye | "Tunda! Tunggu hujan atau lakukan penyiraman pra-aplikasi 2 mm." |
| 81–100% | **Bahaya** | 🔴 Merah | "Jangan tabur Urea. Risiko penguapan > 80%. Tunda 24 jam atau gunakan Urea berlapis (coated)." |

### 6.4 Pipeline Retraining (Edge-Cloud Hybrid)

```
Edge (ESP32)          Cloud/Server (Python)         Feedback Loop
─────────────         ─────────────────────         ─────────────
Akuisisi sensor  →    Simpan ke TimescaleDB    →    Data terakumulasi
Kalibrasi dasar       Hitung fisika urease          (per 2 minggu)
Deep sleep            Inference LightGBM            
                      Log prediksi + kondisi aktual 
                              ↓
                      Bandingkan prediksi vs hasil  
                      (apakah benar terjadi volatilisasi?)
                              ↓
                      Retrain LightGBM jika drift    →   OTA update model
                      (klien drift detection)                ke edge (opsional)
```

### 6.5 Stack AI

| Komponen | Teknologi | Catatan |
|---|---|---|
| Training | LightGBM, scikit-learn, NumPy, pandas | Ringan, CPU-only |
| Explainability | **TreeSHAP** (shap library) | Wajib — petani & juri minta alasan |
| Kalibrasi probabilitas | Isotonic regression / Platt scaling | Agar skor 70% benar-benar ≈ 70% kejadian |
| Validasi | TimeSeriesSplit + out-of-time holdout | **Bukan** random split (data time-series) |
| Tracking eksperimen | MLflow / W&B (opsional) | Untuk laporan akhir |
| Format model | `.txt` LightGBM / ONNX | Ringan untuk edge deployment |
| Serving | FastAPI endpoint `/predict` | Satu panggilan per siklus telemetri |

---

## 7. PRESENTATION LAYER — Web Application

### 7.1 Peran Strategis

Dashboard **bukan inti inovasi** — ini lapisan visualisasi & integrasi. Nilai utama ada di pipeline akuisisi → Digital Twin → AI. Tapi dashboard yang buruk akan membuat juri meragukan adopsi pengguna.

### 7.2 Arsitektur Frontend

| Lapisan | Teknologi | Alasan |
|---|---|---|
| Framework | **React 18 + Next.js 14** (App Router) | SSR untuk first-load cepat di jaringan lambat |
| Bahasa | TypeScript | Type safety |
| Styling | **Tailwind CSS** + shadcn/ui | Konsisten, cepat, tidak perlu desainer UI |
| Chart | **Recharts** atau ECharts | Grafik time-series ringan |
| Peta | **Leaflet** + OpenStreetMap (bukan Google Maps — hindari lisensi) | Peta plot bedeng & zona risiko |
| Real-time | WebSocket (Socket.IO) atau SSE | Update telemetri tanpa refresh |
| State | Zustand / React Query | Sederhana, tidak over-engineered |
| PWA | `next-pwa` | Dapat diinstal di HP petani, offline cache |

### 7.3 Halaman & Fitur

#### Halaman 1 — **Dashboard Petak** (Home)
```
┌──────────────────────────────────────────────────────────────┐
│  VolatiSafe        Kebun Jagung Pak Suparman · Blok A        │
│  ⏱️ Update terakhir: 12 menit lalu        ⚡ Baterai: 84%    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ⚠️  STATUS HARI INI                                        │
│   ┌────────────────────────────────────────────────────┐     │
│   │  🔴  RISIKO KRITIS — AVRI 74%                      │     │
│   │  Jangan tabur Urea sekarang.                       │     │
│   │  Alasan: Suhu tanah 34°C + kelembaban 22% + pH 7.8 │     │
│   │  Jendela aman terdekat: Besok 06:00–09:00          │     │
│   └────────────────────────────────────────────────────┘     │
│                                                              │
│   ┌──────────┬──────────┬──────────┬──────────┐              │
│   │ Kelembaban│ Suhu Tanah│  pH Tanah │ AVRI 12j │              │
│   │   22,4%   │  34,1°C  │   7,83    │   74%    │              │
│   │  ↓ 3,2%   │  ↑ 1,8°C │  — 0,02   │  ↑ 12%   │              │
│   └──────────┴──────────┴──────────┴──────────┘              │
│                                                              │
│   📈 Tren 24 Jam                          [Chart line]        │
│   ┌────────────────────────────────────────────────────┐     │
│   │   Kelembaban & Suhu Tanah & Garis Ambang Kritis    │     │
│   └────────────────────────────────────────────────────┘     │
│                                                              │
│   🕐 Jendela Waktu Aman 72 Jam ke Depan                      │
│   ┌────────────────────────────────────────────────────┐     │
│   │ Hari 1  ░░░░░░░█░░░░  06:00–09:00 (Aman 18%)       │     │
│   │ Hari 2  ░░░░░░░░░░░█  17:00–19:00 (Aman 26%)       │     │
│   │ Hari 3  ░░░░░░░░░░░░  Tidak ada jendela aman       │     │
│   └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

#### Halaman 2 — **Peta Risiko Lahan**
- Peta Leaflet dengan poligon tiap bedeng diwarnai sesuai kategori AVRI (hijau/kuning/oranye/merah).
- Klik poligon → popup detail node (kode node, sensor live, riwayat 7 hari).
- Layer toggle: status baterai node, status koneksi terakhir.

#### Halaman 3 — **Preskripsi & Log Pemupukan**
- Kalkulator dosis Urea: input DAT + luas bedeng + target yield → output kg Urea + jadwal.
- Form log pemupukan (tanggal, dosis, jenis) → muncul di view digital twin.
- Riwayat: tabel kapan pupuk ditabur + skor AVRI saat itu + catatan hasil.

#### Halaman 4 — **Admin / Manajemen Node**
- Onboarding node baru via QR code (scan di node → node ID terdaftar).
- Kalibrasi sensor dari UI (Dry/Wet ADC, buffer pH).
- Manajemen threshold alert per petak.

#### Halaman 5 — **Laporan & Ekspor**
- Ekspor CSV telemetri (untuk PPL/koperasi).
- Ringkasan bulanan: rata-rata AVRI, jam kritis, estimasi penghematan pupuk (dalam rupiah).

### 7.4 Kanal Notifikasi

| Kanal | Penggunaan | Catatan |
|---|---|---|
| **WhatsApp** (Fonnte/Wablas API) | Alert kritis + preskripsi harian jam 05:30 | Kanal utama — petani Indonesia tinggal di WhatsApp |
| **Telegram Bot** | Alternatif gratis + grup kelompok tani | Gratis, mudah integrasi, ada inline button "Terima/Override" |
| **Web Push (PWA)** | Notifikasi di browser HP | Fallback |
| **SMS** (opsional) | Hanya alert Bahaya untuk petani tanpa smartphone | Biaya per SMS, dipakai terbatas |

**Format pesan WhatsApp (contoh):**
```
VolatiSafe · Blok A

🔴 RISIKO KRITIS 74%

Kondisi saat ini:
• Suhu tanah 34,1°C
• Kelembaban 22,4% (kering)
• pH tanah 7,83 (basa)

⚠️ JANGAN tabur Urea sekarang.
Nitrogen berisiko menguap 74%.

✅ Jendela aman terdekat:
Besok, 06:00–09:00 (Risiko 18%)

[Lihat Detail] [Sudah Saya Tunda]
```

### 7.5 Offline-First & Aksesibilitas

- PWA dengan service worker: halaman terakhir terbuka tetap bisa dibaca tanpa internet.
- Ukuran bundle < 500 KB (gzip) — penting untuk jaringan 3G di desa.
- Bahasa Indonesia sepenuhnya; opsi font besar untuk pengguna lansia.
- Tombol aksi minimal 44×44 px (standar aksesibilitas tap).

---

## 8. Skema Data & Kontrak API

### 8.1 Payload Telemetri (LoRa, ringkas)

```json
{
  "n": "VS-A1-003",
  "ts": 1792934400,
  "m": 22.4,
  "t": 34.1,
  "ph": 7.83,
  "b": 3.87
}
```
> Field dipendekkan karena setiap byte di LoRa boros waktu transmisi. Payload ini ~52 byte, muat dalam satu paket LoRa SF7.

### 8.2 REST API Utama

| Endpoint | Method | Fungsi |
|---|---|---|
| `/api/nodes` | GET | Daftar node + status terakhir |
| `/api/nodes/{id}/telemetry?from=&to=` | GET | Data time-series |
| `/api/fields/{id}/state` | GET | State digital twin saat ini |
| `/api/fields/{id}/forecast?hours=72` | GET | Proyeksi AVRI + jendela aman |
| `/api/fields/{id}/prescription` | GET | Rekomendasi dosis & waktu |
| `/api/fields/{id}/fertilization-log` | POST | Catat aplikasi pupuk aktual |
| `/api/simulate` | POST | Mode what-if (hujan/dosis/pH) |
| `/api/health` | GET | Status gateway & uptime |

### 8.3 Skema Database (PostgreSQL / TimescaleDB)

```sql
-- Node fisik
CREATE TABLE nodes (
  node_id       TEXT PRIMARY KEY,
  field_id      TEXT REFERENCES fields(field_id),
  installed_at  TIMESTAMPTZ,
  firmware_ver  TEXT,
  battery_v     NUMERIC(4,2),
  last_seen     TIMESTAMPTZ
);

-- Data telemetri (hypertable TimescaleDB)
CREATE TABLE telemetry (
  ts          TIMESTAMPTZ NOT NULL,
  node_id     TEXT NOT NULL,
  moisture    NUMERIC(5,2),
  soil_temp   NUMERIC(4,1),
  ph          NUMERIC(3,2),
  battery_v   NUMERIC(4,2),
  is_predicted BOOLEAN DEFAULT FALSE   -- true jika hasil imputasi digital twin
);
SELECT create_hypertable('telemetry', 'ts');

-- State digital twin per petak
CREATE TABLE field_state (
  field_id      TEXT PRIMARY KEY,
  updated_at    TIMESTAMPTZ,
  theta         NUMERIC(5,2),   -- kelembaban tanah
  t_soil        NUMERIC(4,1),
  ph            NUMERIC(3,2),
  et0_today     NUMERIC(5,2),
  dat           INTEGER,        -- days after transplanting
  last_urea_kg  NUMERIC(6,2)
);

-- Hasil prediksi AI
CREATE TABLE predictions (
  id            BIGSERIAL PRIMARY KEY,
  ts            TIMESTAMPTZ,
  field_id      TEXT,
  avri_score    NUMERIC(5,2),
  risk_class    TEXT,           -- aman|waspada|kritis|bahaya
  shap_values   JSONB,          -- kontribusi fitur
  model_version TEXT
);

-- Provenance (untuk audit juri)
CREATE TABLE data_provenance (
  dataset_id    TEXT PRIMARY KEY,
  source_name   TEXT,           -- "BMKG Stasiun Meteorologi Lampung"
  url           TEXT,
  license       TEXT,
  ingested_at   TIMESTAMPTZ,
  row_count     INTEGER
);
```

---

## 9. Rencana Implementasi Prototipe Software (7 Hari)

> Konteks: fase TKT 3 butuh bukti purwarupa *low-fidelity*. Karena hardware belum dibeli (dana Rp3 jt baru cair setelah lolos 9 Nov), seluruh prototipe dibangun sebagai **software simulation** dengan Wokwi + dataset riil.

| Hari | Aktivitas | Luaran |
|---|---|---|
| **H1** | Setup repo, skema DB, unduh dataset cuaca historis BMKG (Lampung & Lamongan, 1 tahun) | Repo + dataset terverifikasi |
| **H2** | Bangun **Agro-Climatic Digital Twin** (neraca air FAO-56 + difusi panas) — validasi terhadap data historis | `digital_twin.py` + grafik validasi |
| **H3** | Bangun **firmware Wokwi ESP32** (sensor virtual + LoRa + deep sleep) + jalur MQTT | Link Wokwi + screenshot diagram |
| **H4** | Latih **LightGBM + physics-informed layer** pada data sintetis yang dibangkitkan dari dataset riil; hitung baseline pembanding | Model `.txt` + laporan metrik |
| **H5** | Bangun **dashboard Next.js** (halaman Dashboard Petak + Peta Risiko) dengan mock data dari API | Screenshot UI 2 halaman |
| **H6** | Integrasi end-to-end: Wokwi → MQTT → Digital Twin → AI → Dashboard. Uji 3 skenario | Demo video 2 menit |
| **H7** | Kumpulkan bukti purwarupa (foto rangkaian, screenshot dashboard, skema 3D casing) + tulis proposal 3 halaman | Paket lampiran pendaftaran |

### 9.1 Bukti Purwarupa yang Harus Dihasilkan (Sesuai Panduan Hal. 5)

- ✅ Foto rangkaian Wokwi ESP32 + sensor virtual
- ✅ Diagram skematik sirkuit (`diagram.json` → ekspor gambar)
- ✅ Mockup 3D casing IP65 (Tinkercad/Fusion360 sederhana)
- ✅ Screenshot dashboard (2–3 halaman)
- ✅ Tangkapan layar hasil uji (grafik AVRI, tabel metrik model)
- ✅ Video demo 2 menit (Wokwi jalan + dashboard menerima data)

---

## 10. Risiko & Mitigasi

| # | Risiko | Dampak | Kemungkinan | Mitigasi | Pemilik |
|---|---|---|---|---|---|
| R1 | Sensor pH tanah analog lambat & tidak stabil | Akurasi model turun | Tinggi | Kalibrasi 2-titik + kompensasi kelembaban + median filter 5 sampel | Teknis |
| R2 | LoRa tidak dapat jangkauan jika lahan berbukit | Data tidak sampai gateway | Sedang | Uji RSSI, tambah node repeater, fallback ESP-NOW mesh | Teknis |
| R3 | Dataset awal < 300 sampel → model overfit | Prediksi tidak valid | Tinggi | Physics-informed constraint + validasi out-of-time + label "model awal" jujur | AI |
| R4 | Petani tidak percaya rekomendasi AI | Adopsi gagal | Sedang | TreeSHAP (tampilkan alasan), human-in-the-loop, tombol "override" & log alasan | Validasi |
| R5 | Urea hilang bukan hanya karena volatilisasi (leaching, denitrifikasi) | Klaim manfaat berlebihan | Sedang | Nyatakan batas: model hanya mengukur jalur volatilisasi, sebutkan jalur lain di proposal | AI |
| R6 | Biaya BoM melebihi Rp3 juta untuk jumlah node | Tidak semua petak terpasang | Sedang | Buat 5–8 node prioritas, sisanya estimasi interpolasi digital twin | Bisnis |
| R7 | Petani tidak punya smartphone/WhatsApp | Alert tidak diterima | Rendah | Mode SMS untuk alert Bahaya + papan pengumuman kelompok tani | Validasi |
| R8 | Regulasi frekuensi LoRa 433 MHz | Sanksi hukum | Rendah | 433 MHz ISM band bebas lisensi di Indonesia (SDPPI), simpan rujukan | Operasional |

---

## 11. Batas Kejujuran (Yang TIDAK Diklaim)

Wajib ditulis di proposal agar tidak dipatahkan juri:

1. Model **hanya memprediksi volatilisasi amonia** — bukan seluruh kehilangan nitrogen (leaching & denitrifikasi di luar lingkup).
2. Penghematan 20% adalah **target hipotesis**, bukan hasil pengukuran. Baseline diukur bersama mitra pada Bulan 1–3.
3. Sensor NPK digantikan oleh **inferensi pH + kelembaban + suhu** (indikator proxy), bukan pengukuran NPK langsung.
4. Prototipe saat ini **TKT 3 (simulasi software)**. Testimoni petani nyata belum ada sampai uji lapangan Bulan 8–10.
5. Model dilatih pada data klimatologi publik + parameter literatur urease — **bukan** data lapangan mitra.

---

## 12. Roadmap 12 Bulan (Menuju TKT 6)

| Bulan | Kegiatan | Luaran | TKT |
|---|---|---|---|
| 1–2 | Validasi masalah, wawancara mitra, audit baseline pupuk, finalisasi desain enclosure | Dokumen SOP + baseline terukur | 3 |
| 3–4 | Pengadaan 8 node, perakitan, kalibrasi lab (buffer pH, oven-dry soil) | Node terkalibrasi + akurasi tervalidasi | 4 |
| 5–6 | Deploy node, kumpulkan data lapangan 1 siklus, latih ulang model | Model v2 + dataset lapangan | 4 |
| 7 | Integrasi WhatsApp, onboarding via QR, uji plug-and-play | System end-to-end siap | 5 |
| 8–10 | **Uji empiris 2 siklus tanam**: Bedeng AI vs Bedeng Kontrol; ukur HPP & rendemen | Laporan uji lapangan + metrik penghematan | 5 |
| 11 | UAT bersama Gapoktan & PPL; evaluasi UX; analisis BoM & skema komersial | Validasi kebergunaan; skema starter kit | 6 |
| 12 | Finalisasi tekno-ekonomi, publikasi, laporan akhir | Prototipe siap hilirisasi | 6 |

---

## 13. Komposisi Tim & Pembagian Peran

| Peran | Nama | Tanggung Jawab |
|---|---|---|
| **Koordinator Teknis** | Aris Kurniawan + Andharu Raffi + Hadi M. Hafiiz H. | Firmware ESP32, desain sirkuit, kalibrasi sensor, arsitektur LoRa gateway, dashboard Next.js, deployment |
| **Koordinator AI & Digital Twin** | (ditunjuk dari tim teknis) | Model LightGBM, physics-informed layer, digital twin FAO-56, validasi & explainability |
| **Koordinator Bisnis & Hilirisasi** | Naufal Adi Satrio (Profesional) | Analisis BoM, skema komersialisasi starter kit, model bisnis berlangganan, jalur kemitraan |
| **Koordinator Validasi Pengguna** | Amma Liesvarastranta Haz (Dosen) | Protokol wawancara, pengukuran baseline, uji lapangan, dokumentasi umpan balik |
| **Mentor Metodologi** | Amma Liesvarastranta Haz | Penjaminan mutu ilmiah, review metodologi, pengawasan etika data |

---

## 14. Kriteria Penerimaan (Definition of Done) — Fase Prototipe

Prototipe software dinyatakan selesai jika **semua** poin berikut terpenuhi:

- [ ] Digital twin menghasilkan estimasi kelembaban & suhu tanah yang tervalidasi terhadap data historis (RMSE < 15%)
- [ ] Firmware Wokwi berjalan: membaca 3 sensor virtual, mengirim payload via LoRa/MQTT, deep sleep 15 menit
- [ ] Model LightGBM + physics layer menghasilkan AVRI dengan metrik lebih baik dari 2 baseline non-AI
- [ ] Dashboard menampilkan: status AVRI, 4 kartu metrik, tren 24 jam, jendela waktu aman 72 jam
- [ ] Peta risiko menampilkan ≥ 3 bedeng dengan warna kategori berbeda
- [ ] Alert WhatsApp/Telegram terkirim saat AVRI melampaui ambang Kritis
- [ ] Video demo 2 menit tersedia
- [ ] Paket bukti purwarupa (foto, skematik, screenshot, mockup 3D) siap diunggah
- [ ] Proposal 3 halaman sudah melalui audit internal dengan skill `competition-submission-audit`

---

## 15. Referensi Teknis

| # | Referensi | Dipakai Untuk |
|---|---|---|
| 1 | FAO-56: Crop evapotranspiration (Allen et al., 1998) | Model neraca air digital twin |
| 2 | Kissel & Cabrera (2005), *Ammonia volatilization from urea* | Parameter laju urease, faktor pH & kelembaban |
| 3 | Sommer et al. (2004), *Ammonia emission from mineral fertilizers* | Koefisien emisi baseline |
| 4 | ESP32 Technical Reference Manual | Kalibrasi ADC, manajemen deep sleep |
| 5 | Semtech SX1278 Datasheet + AN1200.22 LoRa Modem Design Guide | Konfigurasi SF/BW/CR, perhitungan link budget |
| 6 | LightGBM documentation (Ke et al., 2017) | Model gradient boosting dengan quantile loss |
| 7 | Lundberg & Lee (2017), *A Unified Approach to Interpreting Model Predictions* (SHAP) | Explainability TreeSHAP |
| 8 | BMKG Data Online | Dataset cuaca historis Lampung & Lamongan |
| 9 | Permentan No. 40/2007 tentang rekomendasi pupuk N, P, K | Baseline dosis agronomi |

---

*Dokumen ini adalah PRD kerja internal, bukan bagian dari substansi proposal. Digunakan sebagai acuan tunggal tim BayWise untuk pengembangan VolatiSafe AIoT.*
