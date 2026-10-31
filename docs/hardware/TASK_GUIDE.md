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
| TAHAP 2 — Driver Sensor & Kalibrasi | ✅ selesai 26 Okt 2026 |
| TAHAP 3 — Protokol Telemetri LoRa | ✅ selesai 26 Okt 2026 (LoRa level build; radio belum memancar → HW-9.3) |
| TAHAP 4 — Manajemen Daya & Deep Sleep | ✅ selesai 27 Okt 2026 (deep sleep fisik → HW-9.1) |
| TAHAP 5 — Virtual Testbed Wokwi | 🟨 sebagian: 7 skenario + I-03 lulus via tunnel; screenshot/link → HW-8.2 |

**Unit test:** `pio test -e native` → 45 test PASS (6 payload, 24 sensors_core, 7 calibration_core, 8 transport_core). Bukti: [`evidence/unit_test_native_20261026.txt`](evidence/unit_test_native_20261026.txt).

---

## 📋 Daftar Tugas & Tahapan Implementasi

### TAHAP 1: Struktur Proyek & Konfigurasi Pinout — ✅ SELESAI 26 Okt 2026

> **Bukti:** `docs/hardware/evidence/build_esp32dev.txt` dan `build_wokwi.txt` (keduanya `SUCCESS`).
> Detail task atomik ada di [`playbook/03_ROADMAP_TUGAS.md`](playbook/03_ROADMAP_TUGAS.md) FASE 1 (HW-1.1 … HW-1.4), status di [`playbook/00_INDEX.md`](playbook/00_INDEX.md) §4.

#### 🟢 HW-1.1: Setup PlatformIO / Arduino Project
- **Deskripsi:** Inisialisasi struktur firmware di folder `firmware/` untuk ESP32-WROOM-32D.
- **Target File:**
  - `firmware/platformio.ini` (board: `esp32dev`, framework: `arduino`, lib_deps: `OneWire`, `DallasTemperature`, `LoRa`, `ArduinoJson`)
  - `firmware/src/main.cpp`
  - `firmware/include/config.h` (pin definitions, konstanta kalibrasi)
- **Status:** Struktur final ada di [`playbook/04_FIRMWARE_CORE.md`](playbook/04_FIRMWARE_CORE.md) §1. `main.cpp` hanya orkestrasi; 6 modul lain sudah ada sebagai stub bertanda `TODO HW-x.y`.
- **Checklist:**
  - [x] Pinout mengacu ke [`docs/hardware/PINOUT_AND_SCHEMATICS.md`](PINOUT_AND_SCHEMATICS.md):
    - GPIO 34: Sensor Kelembaban Kapasitif v1.2 (ADC1_CH6)
    - GPIO 32: Sensor pH Tanah Analog (ADC1_CH4)
    - GPIO 4: DS18B20 1-Wire Data (pull-up internal)
    - GPIO 25: MOSFET Gate Control (Power Switch Sensor)
    - SPI LoRa SX1278: SCK=18, MISO=19, MOSI=23, CS=5, RST=14, DIO0=2

---

### TAHAP 2: Driver Sensor & Kalibrasi Fisik — ✅ SELESAI 26 Okt 2026

#### 🟢 HW-1.2: Driver Pembacaan & Filtering Sensor
- **Deskripsi:** Implementasi pembacaan analog & digital dengan perlindungan noise dan pergeseran nilai.
- **Target File:** `firmware/src/sensors.cpp`, `firmware/src/sensors_core.cpp`, `firmware/include/sensors.h`
- **Spesifikasi:**
  - `analogSetAttenuation(ADC_11db);` untuk ADC ESP32.
  - **Burst Sampling:** Ambil 5 sampel pembacaan berturut-turut dengan jeda 50 ms, buang nilai min dan max, lalu hitung rata-rata 3 nilai tengah (median-average filter).
  - **Kalibrasi Kelembaban:** Konversi ADC ke % VWC:
    `moisture_pct = (dry_adc - raw_adc) / (dry_adc - wet_adc) * 100;`
  - **Kompensasi pH terhadap Kelembaban:**
    `ph_corrected = ph_raw + (0.15 * (50.0 - moisture_pct) / 50.0);`
- **Checklist:**
  - [x] Nilai kelembaban dikirim **apa adanya**, tanpa clamp ke 0–100 (lihat `DEC-IOT-18`). Sensor short (ADC 0) menghasilkan >100 %, sensor putus (ADC 4095) menghasilkan <0 %, keduanya ditandai `OUT_OF_RANGE` sehingga backend menolak paketnya.
  - [x] Nilai suhu DS18B20 valid (-10°C s.d. 60°C); di luar itu dikirim apa adanya dengan status `OUT_OF_RANGE`, putus (-127 °C) jadi `-999`/`DISCONNECTED`.
  - [x] Nilai pH juga tidak di-clamp ke 3,0–10,0; yang dibatasi hanya **input** kompensasi kelembaban agar sentinel -999 tidak menggeser pH 3,1 satuan.
- **Bukti:** 45 unit test native PASS; nilai Serial di simulator cocok persis dengan `playbook/05_WOKWI_SIMULASI.md` §5.5–5.6 (`evidence/HW-2.1_adc_burst_wokwi_20261026.txt`, `evidence/HW-2.2_ds18b20_wokwi_20261026.txt`, `evidence/HW-2.6_nvs_selftest_wokwi_20261026.txt`).
- **Catatan:** DS18B20 memakai konversi blocking 375 ms (resolusi 11-bit), bukan non-blocking seperti bunyi `playbook/03_ROADMAP_TUGAS.md` HW-2.2 — alasannya di `DEC-IOT-17`. Persistensi kalibrasi lintas reboot belum bisa dibuktikan di Wokwi CLI (flash bersih tiap run), diverifikasi di HW-9.2.

---

### TAHAP 3: Protokol Telemetri LoRa & Bit-Packing — ✅ SELESAI 26 Okt 2026

> **Bukti:** `evidence/HW-3.1_no_clamp_wokwi_20261026.txt`, `evidence/HW-3.3_lora_transport_20261026.txt`, `evidence/HW-3.4_mqtt_transport_20261026.txt`, `evidence/build_esp32dev.txt`, `evidence/build_wokwi.txt`.
> Detail task atomik ada di [`playbook/03_ROADMAP_TUGAS.md`](playbook/03_ROADMAP_TUGAS.md) FASE 3 (HW-3.1 … HW-3.5), status di [`playbook/00_INDEX.md`](playbook/00_INDEX.md) §4.

#### 🟢 HW-1.3: Transmisi LoRa SX1278 433 MHz
- **Deskripsi:** Mengemas data telemetri ke dalam format payload ringkas dan memancarkannya via modul LoRa SX1278.
- **Target File:** `firmware/src/transport_lora.cpp`, `firmware/src/transport_mqtt.cpp`, `firmware/src/transport_core.cpp`, `firmware/include/transport.h` (bukan `lora_comm.cpp`; abstraksi transport diputuskan di `DEC-IOT-01`)
- **Spesifikasi:**
  - Frekuensi: **433.0 MHz**, Bandwidth: 125 kHz, Spreading Factor: SF7, Coding Rate: 4/5, TxPower: +17 dBm.
  - **Format JSON (bukan 52 byte):**
    ```json
    {"n":"VS-A1-003","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}
    ```
    Panjang nyata 70–76 byte untuk Node ID 12 karakter (`DEC-IOT-02`). Klaim "≤ 52 byte" di dokumen ini salah dan sudah dieskalasi.
  - Logika retry: maksimal 3× percobaan, jeda 2 s hanya di antara percobaan, berhenti di percobaan yang berhasil.
- **Checklist:**
  - [x] Ukuran total string payload terukur dan tercatat: 71 byte untuk `VS-SIM-001` (`DEC-IOT-02`). Klaim ≤ 52 byte dicabut, bukan dicapai dengan memotong data.
  - [x] Node ID unik per perangkat (`VS-A1-003` fisik, `VS-SIM-001` simulasi, `DEC-IOT-03`).
  - [x] Build `esp32dev` menautkan `transport_lora.o` tanpa `transport_mqtt.o`; `main.cpp` tidak menyentuh LoRa/SPI langsung.
  - [x] Retry diuji di `env:native` (8 kasus), bukan hanya dibaca.
  - [ ] **Radio benar-benar memancar dan gateway menerima** — belum. Wokwi tidak punya part SX1278, verifikasi di HW-9.3.
  - [x] Retry **tidak** berarti "sampai gateway": `LoRa.endPacket()` hanya menandakan modul selesai memancarkan (`DEC-IOT-08`). Klaim "retry jika tidak ada ACK" di baris atas sudah dikoreksi.
- **Catatan:** Satu-satunya transport yang punya bukti runtime adalah MQTT, dan itu pun berhenti di `transport_send()`: `wokwi-cli` memakai gateway publik yang tidak bisa menjangkau Mosquitto di mesin ini (`DEC-IOT-19`). Bukti "data sampai broker" adalah DoD HW-5.4.

---

### TAHAP 4: Manajemen Daya & Deep Sleep — ✅ SELESAI 27 Okt 2026

> **Bukti:** `evidence/HW-4.1_power_gate_20261027.txt`, `evidence/HW-4.2_deep_sleep_20261027.txt`, `evidence/HW-4.3_orchestration_20261027.txt`, `evidence/HW-4.4_power_budget_20261027.md`.
> Detail task atomik ada di [`playbook/03_ROADMAP_TUGAS.md`](playbook/03_ROADMAP_TUGAS.md) FASE 4 (HW-4.1 … HW-4.4), status di [`playbook/00_INDEX.md`](playbook/00_INDEX.md) §4.

#### 🟢 HW-1.4: Siklus Deep Sleep 15 Menit & Power Gating
- **Deskripsi:** Mengoptimalkan konsumsi daya agar baterai 18650 bertahan minimal 90 hari di lapangan.
- **Target File:** `firmware/src/power_mgmt.cpp`, `firmware/src/main.cpp`
- **Spesifikasi:**
  - Sebelum tidur: Tarik GPIO 25 ke `LOW` (memutus catu daya sensor via MOSFET untuk mencegah korosi probe).
  - Nonaktifkan WiFi & Bluetooth lewat `transport_shutdown()` (MQTT: `mqtt.disconnect()` + `WiFi.disconnect(true)` + `WIFI_OFF`; LoRa: `LoRa.sleep()` + `SPI.end()`).
  - Set timer bangun: `esp_sleep_enable_timer_wakeup(SLEEP_DURATION_US)` (15 menit; 10 detik saat `SIM_FAST_CYCLE`).
  - Panggil `esp_deep_sleep_start();` pada build fisik.
  - Siklus aktif total per transmisi ≤ 3.5 detik (fisik; build simulasi membawa WiFi/NTP sehingga lebih lama).
- **Checklist:**
  - [x] Urutan gate: `power_begin()` LOW sejak boot, sensor ON hanya saat sampling, sensor OFF **sebelum** TX.
  - [x] Wake reason dicetak (`[PWR] wake: timer` / `power-on/reset`).
  - [x] Orkestrasi penuh ada di `main.cpp`; `SENSOR_PROBE` dan `CAL_NVS_SELFTEST` sudah dihapus.
  - [x] Budget dihitung dari durasi sampling terukur: 0,05673 mAh/siklus (≤ 0,07), arus masih estimasi.
  - [ ] Arus saat deep-sleep terukur ≤ 15 µA — **belum**, butuh hardware (HW-9.1/F-04).
- **Catatan:** Wokwi tidak menyelesaikan deep sleep timer dengan bersih (task watchdog reset sebelum timer). Build simulasi karena itu menunggu 10 detik di `loop()` lalu restart; jalur `esp_deep_sleep_start()` tetap dikompilasi untuk fisik dan diverifikasi di HW-9.1. Detail di `DEC-IOT-20`.

---

### TAHAP 5: Virtual Testbed Wokwi (Untuk Seleksi TKT 3) — 🟨 sebagian 27 Okt 2026

> **Bukti:** `evidence/HW-5.3_parity_20261027.txt`, `evidence/I03_mqtt_rx.txt`, `evidence/HW-5.4_local_mqtt_20261027.md`, `evidence/HW-5.4_serial_20261027.txt`, `evidence/HW-5.4_validation_20261027.txt`.

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
  - [x] Wokwi berjalan tanpa error; 5 paket berturut sampai Mosquitto lokal lewat tunnel TCP sementara (Private Gateway butuh akun berbayar).
  - [ ] Screenshot rangkaian dan link Wokwi: screenshot CLI gagal karena part `esp` tidak punya framebuffer; link publik butuh proyek wokwi.com. Ditunda ke HW-8.2.

---

## 🚫 Zona Terlarang Hafiiz (DILARANG KERAS)
1. ❌ DILARANG mengubah skema database backend atau kode FastAPI di `backend/`.
2. ❌ DILARANG mengubah struktur field JSON payload LoRa tanpa membuat issue/RFC di `docs/universal/INTERFACES.md`.
3. ❌ DILARANG menulis kode styling atau frontend Next.js.
