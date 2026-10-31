# PINOUT_AND_SCHEMATICS.md — Spesifikasi Rangkaian & Pinout ESP32-WROOM-32D

---

## 1. Pemetaan Pin ESP32-WROOM-32D

> ⚠️ **PERINGATAN KRITIS ADC:** Sensor analog (Kelembaban & pH) **WAJIB** terhubung ke pin **ADC1** (GPIO 32–39). Jangan pernah memindahkan sensor ke ADC2 (GPIO 0, 2, 4, 12–15, 25–27) karena ADC2 terkunci (*hardware conflict*) saat modul radio/WiFi aktif.

Status komponen mengikuti hardware yang benar-benar dipegang saat ini.

| Komponen / Sensor | Pin ESP32 | Tipe Sinyal | Status | Keterangan |
|---|---|---|---|---|
| **Capacitive Moisture v1.2 (SIG)** | **GPIO 34** | Analog Input (ADC1_CH6) | Terpasang | Rentang 1.2V – 2.8V (input-only pin). |
| **Soil pH Sensor (SIG)** | **GPIO 32** | Analog Input (ADC1_CH4) | **Simulasi Wokwi** | Hardware pH belum ada; di Wokwi diganti potensiometer. Build fisik mengirim placeholder `7.00` berstatus `N/A` (`PH_ONBOARD=0`). |
| **DS18B20 Suhu Probe (DATA)** | **GPIO 4** | Digital (1-Wire) | Terpasang | **Tanpa resistor 4.7 kΩ.** Pull-up internal ESP32 diaktifkan lewat `pinMode(4, INPUT_PULLUP)` sebelum `sensors_begin()`. |
| **Micro SD (CS)** | **GPIO 5** | SPI CS | Terpasang | Buffer store-and-forward. **Bentrok dengan CS LoRa** (lihat catatan di bawah). |
| **Micro SD (SCK)** | **GPIO 18** | SPI Clock | Terpasang | Bus SPI hardware. |
| **Micro SD (MISO/DO)** | **GPIO 19** | SPI MISO | Terpasang | |
| **Micro SD (MOSI/DI)** | **GPIO 23** | SPI MOSI | Terpasang | |
| **MOSFET Sensor VCC Gate** | **GPIO 25** | Digital Output | Belum terpasang | Kode tetap ada; sensor saat ini menyala langsung dari 3V3. |
| **Sensor Tegangan Baterai** | **GPIO 35** | Analog Input (ADC1_CH7) | Belum terpasang | Tidak ada baterai/divider. Firmware mengirim placeholder 3,87 V berstatus `NOT_PRESENT`. |
| **LoRa SX1278 (SCK)** | GPIO 18 | SPI Clock | Belum terpasang | Desain masa depan. |
| **LoRa SX1278 (MISO)** | GPIO 19 | SPI MISO | Belum terpasang | |
| **LoRa SX1278 (MOSI)** | GPIO 23 | SPI MOSI | Belum terpasang | |
| **LoRa SX1278 (NSS/CS)** | GPIO 5 | Digital Output | Belum terpasang | **Pindahkan CS LoRa (mis. GPIO 15) sebelum dipasang** karena GPIO5 dipakai SD. |
| **LoRa SX1278 (RESET)** | GPIO 14 | Digital Output | Belum terpasang | |
| **LoRa SX1278 (DIO0)** | GPIO 2 | Interrupt Input | Belum terpasang | |

---

## 2. Rangkaian Manajemen Daya & Anti-Korosi (Power Gate)

Power gate **belum dirakit**. Diagram di bawah adalah target desain; firmware sudah menyiapkan `GPIO25` agar tinggal disambungkan.

```
                  +3.3V / VCC Baterai
                         │
                         ▼
                   [ Source / Emitter ]
                 ┌──────────────────────┐
   GPIO 25 ────> │ MOSFET Gate (P-Ch)   │
   (ESP32)       │  atau N-Ch Low-Side  │
                 └──────────────────────┘
                         │
                         ▼ [ Switched VCC ]
                   ┌─────┴──────────────┐
                   │  Capacitive Sensor │
                   │  DS18B20 Temp      │
                   │  pH Modul Probe    │
                   └────────────────────┘
```

- **Prinsip Kerja:**
  - Saat ESP32 bangun dari *deep sleep*, pin GPIO25 diatur `HIGH` untuk menyalakan sensor.
  - Sistem memberi jeda `delay(200)` ms agar tegangan sensor stabil.
  - Setelah 5x pembacaan sampel selesai, GPIO25 diatur `LOW` untuk memutus total arus ke probe sensor.
  - ESP32 langsung memasuki mode *deep sleep* 15 menit.

---

## 3. Store-and-Forward Micro SD

Saat pengiriman gagal (broker tidak terjangkau), payload disimpan ke `/vs_buffer.ndjson`. Pada siklus berikutnya firmware mengirim ulang antrian dari baris terlama sebelum mengirim data baru.

| Item | Nilai |
|---|---|
| Modul | Micro SD SPI (3,3 V) |
| CS | GPIO 5 |
| SCK / MISO / MOSI | 18 / 19 / 23 |
| File antrian | `/vs_buffer.ndjson` (satu payload JSON per baris) |
| Batas antrian | 200 baris (`SD_BUFFER_MAX_LINES`) |
| Tanpa kartu | Node tetap jalan; `storage_begin()` mengembalikan false dan buffer nonaktif |

> **Catatan konflik:** GPIO5 dipakai SD sekarang. Modul LoRa SX1278 juga memakai GPIO5 sebagai CS pada desain lama. Sebelum LoRa dipasang, ubah `PIN_LORA_CS` ke pin lain dan sesuaikan wiring.

---

## 4. Bill of Materials (BoM) per Node Lapangan

Kolom **Status** membedakan yang sudah dibeli dari rencana pengadaan berikutnya.

| # | Komponen | Spesifikasi Teknis | Qty | Estimasi Harga | Status |
|---|---|---|---|---|---|
| 1 | ESP32-WROOM-32D | Modul WROOM-32D, dual-core 240 MHz | 1 | Rp55.000 | **Sudah dibeli** |
| 2 | Sensor Kelembaban | Capacitive Soil Moisture v1.2 (anti-korosi) | 1 | Rp15.000 | **Sudah dibeli** |
| 3 | Sensor Suhu Tanah | DS18B20 stainless probe waterproof | 1 | Rp18.000 | **Sudah dibeli** |
| 4 | Modul Micro SD | SPI 3,3 V + kartu micro SD | 1 | Rp15.000 | **Sudah dibeli** |
| 5 | Sensor pH Tanah | Modul analog pH + probe BNC lapangan | 1 | Rp62.000 | Belum (simulasi Wokwi) |
| 6 | Modul LoRa | SX1278 Ra-02 433 MHz + antena helikal | 1 | Rp45.000 | Belum |
| 7 | Baterai Li-ion | 18650 2600 mAh (3.7V) + holder | 1 | Rp35.000 | Belum |
| 8 | Modul Charger | TP4056 dengan proteksi DW01 | 1 | Rp6.000 | Belum |
| 9 | Panel Surya Mini | Polycrystalline 5V 1W + dioda 1N4007 | 1 | Rp25.000 | Belum |
| 10 | Saklar Daya Sensor | MOSFET IRLZ44N / P-Channel AO3401 | 1 | Rp4.000 | Belum |
| 11 | Enclosure | Box junction PVC IP65 tahan UV | 1 | Rp30.000 | Belum |
| 12 | Housing Probe | Pipa PVC ¾ inch pelindung probe tanah | 1 | Rp10.000 | Belum |
| | **TOTAL BIAYA PER NODE** | | | **± Rp305.000** | |

### 4.1 Komponen Pendukung

| # | Komponen | Spesifikasi | Qty | Harga | Status |
|---|---|---|---|---|---|
| 13 | Resistor 4.7 kΩ | ¼ W, 1% | 1 | Rp500 | **Belum dipasang**; firmware memakai pull-up internal. Pasang bila kabel probe panjang atau pembacaan tidak stabil. |
| 14 | Resistor 100 kΩ | ¼ W, 1% | 2 | Rp1.000 | Belum; untuk divider baterai saat baterai ditambahkan. |
| 15 | Resistor 10 kΩ | ¼ W | 2 | Rp1.000 | Belum; untuk pembagi output modul pH. |
| 16 | Kapasitor 100 nF | Keramik | 2 | Rp1.000 | Belum. |
| 17 | Kabel jumper | Dupont 20 cm | 1 set | Rp5.000 | Belum. |
