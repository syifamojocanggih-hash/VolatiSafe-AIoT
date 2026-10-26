# TASK_GUIDE.md — IoT & Embedded Hardware (Hafiiz)

> **PENANGGUNG JAWAB:** Hadi M. Hafiiz Hilmi (Hafiiz)  
> **ROLE:** *IoT & Embedded Hardware Engineer*  
> **AREA KERJA (R/W):** `firmware/`, `simulation/wokwi/`, `docs/hardware/`  
> **CABANG GIT:** `iot`
> **KONTRAK DATA:** [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §1  

---

## 🎯 Target Utama Domain Hardware
Menghasilkan firmware ESP32 dan simulasi sirkuit Wokwi yang mampu melakukan akuisisi 3 sensor fisik (kelembaban tanah kapasitif, suhu tanah probe DS18B20, pH tanah), menerapkan kalibrasi & median filter, menghemat daya dengan deep sleep 15 menit, serta memancarkan paket telemetri LoRa 52-byte ke gateway MQTT.

> 📘 **Dokumen ini adalah ringkasan 5 tahap.** Untuk perintah konkret, daftar file, signature fungsi, kriteria terima, dan bukti yang harus disimpan, gunakan **[`playbook/00_INDEX.md`](playbook/00_INDEX.md)** (46 task ber-ID, FASE 0–9, termasuk fabrikasi fisik TKT 4–6).
>
> ⚠️ **Koreksi angka:** payload JSON aktual terukur **70 byte** (`VS-A1-003`) / **76 byte** (kasus terburuk), bukan 52 byte. Rincian dan usulan koreksi ada di [`playbook/09_RISIKO_DAN_KEPUTUSAN.md`](playbook/09_RISIKO_DAN_KEPUTUSAN.md) `DEC-IOT-02`.

---

## 📈 Status Progres

| Tahap | Status |
|---|---|
| TAHAP 1 — Struktur Proyek & Pinout | ✅ selesai 26 Okt 2026 |
| TAHAP 2 — Driver Sensor & Kalibrasi | 🟨 sebagian: konversi VWC/pH/baterai selesai + lulus unit test; driver ADC burst, DS18B20, dan NVS belum |
| TAHAP 3 — Protokol Telemetri LoRa | 🟨 sebagian: encoder payload final + 6 unit test; dua transport masih stub |
| TAHAP 4 — Manajemen Daya & Deep Sleep | ⬜ |
| TAHAP 5 — Virtual Testbed Wokwi | ⬜ |

**Unit test:** `pio test -e native` → 16 test PASS (6 payload, 10 sensors_core). Bukti: [`evidence/unit_test_native_20261026.txt`](evidence/unit_test_native_20261026.txt).

---

## 📋 Daftar Tugas & Tahapan Implementasi

### TAHAP 1: Struktur Proyek & Konfigurasi Pinout — ✅ SELESAI 26 Okt 2026

> **Bukti:** `docs/hardware/evidence/build_esp32dev.txt` dan `build_wokwi.txt` (keduanya `SUCCESS`).
> Detail task atomik ada di [`playbook/03_ROADMAP_TUGAS.md`](playbook/03_ROADMAP_TUGAS.md) FASE 1 (HW-1.1 … HW-1.4), status di [`playbook/00_INDEX.md`](playbook/00_INDEX.md) §4.

#### 🟢 HW-1.1: Setup PlatformIO / Arduino Project
- **Deskripsi:** Inisialisasi struktur firmware di folder `firmware/` untuk ESP32 NodeMCU V1 (30-pin).
- **Target File:**
  - `firmware/platformio.ini` (board: `esp32dev`, framework: `arduino`, lib_deps: `OneWire`, `DallasTemperature`, `LoRa`, `ArduinoJson`)
  - `firmware/src/main.cpp`
  - `firmware/include/config.h` (pin definitions, konstanta kalibrasi)
- **Status:** Struktur final ada di [`playbook/04_FIRMWARE_CORE.md`](playbook/04_FIRMWARE_CORE.md) §1. `main.cpp` hanya orkestrasi; 6 modul lain sudah ada sebagai stub bertanda `TODO HW-x.y`.
- **Checklist:**
  - [x] Pinout mengacu ke [`docs/hardware/PINOUT_AND_SCHEMATICS.md`](PINOUT_AND_SCHEMATICS.md):
    - GPIO 34: Sensor Kelembaban Kapasitif v1.2 (ADC1_CH6)
    - GPIO 32: Sensor pH Tanah Analog (ADC1_CH4)
    - GPIO 4: DS18B20 1-Wire Data (+ 4.7kΩ pull-up)
    - GPIO 25: MOSFET Gate Control (Power Switch Sensor)
    - SPI LoRa SX1278: SCK=18, MISO=19, MOSI=23, CS=5, RST=14, DIO0=2

---

### TAHAP 2: Driver Sensor & Kalibrasi Fisik

#### 🟢 HW-1.2: Driver Pembacaan & Filtering Sensor
- **Deskripsi:** Implementasi pembacaan analog & digital dengan perlindungan noise dan pergeseran nilai.
- **Target File:** `firmware/src/sensors.cpp`, `firmware/include/sensors.h`
- **Spesifikasi:**
  - `analogSetAttenuation(ADC_11db);` untuk ADC ESP32.
  - **Burst Sampling:** Ambil 5 sampel pembacaan berturut-turut dengan jeda 50 ms, buang nilai min dan max, lalu hitung rata-rata 3 nilai tengah (median-average filter).
  - **Kalibrasi Kelembaban:** Konversi ADC ke % VWC:
    `moisture_pct = constrain(map(raw_adc, dry_adc, wet_adc, 0, 100), 0, 100);`
  - **Kompensasi pH terhadap Kelembaban:**
    `ph_corrected = ph_raw + (0.15 * (50.0 - moisture_pct) / 50.0);`
- **Checklist:**
  - [ ] Nilai kelembaban selalu dalam rentang 0.0 – 100.0%.
  - [ ] Nilai suhu DS18B20 valid (-10°C s.d. 60°C).
  - [ ] Nilai pH terkoreksi dalam rentang wajar (3.0 – 10.0).

---

### TAHAP 3: Protokol Telemetri LoRa & Bit-Packing

#### 🟢 HW-1.3: Transmisi LoRa SX1278 433 MHz
- **Deskripsi:** Mengemas data telemetri ke dalam format payload ringkas dan memancarkannya via modul LoRa SX1278.
- **Target File:** `firmware/src/lora_comm.cpp`, `firmware/include/lora_comm.h`
- **Spesifikasi:**
  - Frekuensi: **433.0 MHz**, Bandwidth: 125 kHz, Spreading Factor: SF7, Coding Rate: 4/5, TxPower: +17 dBm.
  - **Format JSON 52-Byte (Strict Contract `INTERFACES.md` §1):**
    ```json
    {"n":"VS-A1-003","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}
    ```
  - Logika retry: Maksimal 3x percobaan transmisi jika tidak ada ACK gateway.
- **Checklist:**
  - [ ] Ukuran total string payload ≤ 52 byte (hemat airtime).
  - [ ] Node ID unik per perangkat (misal: `VS-A1-001`).

---

### TAHAP 4: Manajemen Daya & Deep Sleep

#### 🟢 HW-1.4: Siklus Deep Sleep 15 Menit & Power Gating
- **Deskripsi:** Mengoptimalkan konsumsi daya agar baterai 18650 bertahan minimal 90 hari di lapangan.
- **Target File:** `firmware/src/power_mgmt.cpp`
- **Spesifikasi:**
  - Sebelum tidur: Tarik GPIO 25 ke `LOW` (memutus catu daya sensor via MOSFET untuk mencegah korosi probe).
  - Nonaktifkan WiFi & Bluetooth (`WiFi.mode(WIFI_OFF); btStop();`).
  - Set timer bangun: `esp_sleep_enable_timer_wakeup(15 * 60 * 1000000ULL);` (15 menit).
  - Panggil `esp_deep_sleep_start();`.
  - Siklus aktif total per transmisi ≤ 3.5 detik.
- **Checklist:**
  - [ ] Arus saat deep-sleep terukur/terestimasi ≤ 15 µA.
  - [ ] Sensor hanya menyala selama siklus sampling (2 detik).

---

### TAHAP 5: Virtual Testbed Wokwi (Untuk Seleksi TKT 3)

#### 🟢 HW-1.5: Simulasi Wokwi ESP32 + MQTT Bridge
- **Deskripsi:** Membangun simulasi virtual lengkap di browser Wokwi yang memancarkan data ke broker MQTT lokal untuk demo seleksi proposal 31 Oktober.
- **Target File:**
  - `simulation/wokwi/diagram.json` (skema rangkaian grafis ESP32, potensiometer kelembaban, potensiometer pH, DS18B20)
  - `simulation/wokwi/sketch.ino` (kode firmware siap jalan di Wokwi)
  - `simulation/wokwi/wokwi.toml` (konfigurasi bridge)
- **Skenario Uji Wokwi (Demo Juri):**
  1. *Skenario Terik Siang:* Potensiometer kelembaban diatur ke 21%, suhu 34.5°C, pH 7.85 $\rightarrow$ Terkirim ke MQTT.
  2. *Skenario Hujan:* Kelembaban diatur ke 42%, suhu 26°C $\rightarrow$ Terkirim ke MQTT.
  3. *Skenario Dropout:* Simulasi node dimatikan selama 30 menit.
- **Checklist:**
  - [ ] Wokwi berjalan tanpa error dan terhubung ke MQTT gateway `localhost:1883`.
  - [ ] Screenshot rangkaian dan link Wokwi siap dilampirkan ke proposal.

---

## 🚫 Zona Terlarang Hafiiz (DILARANG KERAS)
1. ❌ DILARANG mengubah skema database backend atau kode FastAPI di `backend/`.
2. ❌ DILARANG mengubah struktur field JSON payload LoRa tanpa membuat issue/RFC di `docs/universal/INTERFACES.md`.
3. ❌ DILARANG menulis kode styling atau frontend Next.js.
