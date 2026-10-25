# PINOUT_AND_SCHEMATICS.md — Spesifikasi Rangkaian & Pinout ESP32

---

## 1. Pemetaan Pin ESP32 NodeMCU V1 (30-Pin)

> ⚠️ **PERINGATAN KRITIS ADC:** Sensor analog (Kelembaban & pH) **WAJIB** terhubung ke pin **ADC1** (GPIO 32–39). Jangan pernah memindahkan sensor ke ADC2 (GPIO 0, 2, 4, 12–15, 25–27) karena ADC2 terkunci (*hardware conflict*) saat modul radio/WiFi aktif.

| Komponen / Sensor | Pin ESP32 | Tipe Sinyal | Keterangan & Rangkaian Tambahan |
|---|---|---|---|
| **Capacitive Moisture v1.2 (SIG)** | **GPIO 34** | Analog Input (ADC1_CH6) | Rentang tegangan 1.2V – 2.8V (input only pin). |
| **Soil pH Sensor (SIG)** | **GPIO 32** | Analog Input (ADC1_CH4) | Terhubung ke modul amplifier pH probe. |
| **DS18B20 Suhu Probe (DATA)** | **GPIO 4** | Digital (1-Wire) | **Wajib resistor pull-up 4.7 kΩ** dari data ke 3.3V. |
| **MOSFET Sensor VCC Gate** | **GPIO 25** | Digital Output | Kontrol suplai daya sensor (HIGH = ON, LOW = SLEEP). |
| **LoRa SX1278 (SCK)** | **GPIO 18** | SPI Clock | Bus SPI hardware ESP32. |
| **LoRa SX1278 (MISO)** | **GPIO 19** | SPI MISO | Bus SPI hardware ESP32. |
| **LoRa SX1278 (MOSI)** | **GPIO 23** | SPI MOSI | Bus SPI hardware ESP32. |
| **LoRa SX1278 (NSS / CS)** | **GPIO 5** | Digital Output | Chip Select LoRa. |
| **LoRa SX1278 (RESET)** | **GPIO 14** | Digital Output | Pin Reset modul LoRa. |
| **LoRa SX1278 (DIO0)** | **GPIO 2** | Interrupt Input | Menandakan paket TX/RX selesai. |
| **Sensor Tegangan Baterai** | **GPIO 35** | Analog Input (ADC1_CH7) | Voltage divider (100 kΩ / 100 kΩ) dari terminal baterai. |

---

## 2. Rangkaian Manajemen Daya & Anti-Korosi (Power Gate)

Untuk memperpanjang usia baterai hingga > 90 hari dan mencegah terjadinya korosi elektrolisis pada probe sensor di tanah basah:

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
  - ESP32 langsung memasuki mode *deep sleep* 15 menit dengan konsumsi daya hanya 10 µA.

---

## 3. Bill of Materials (BoM) per Node Lapangan

| # | Komponen | Spesifikasi Teknis | Qty | Estimasi Harga |
|---|---|---|---|---|
| 1 | ESP32 NodeMCU V1 | 30-pin, CP2102, Dual Core 240 MHz | 1 | Rp55.000 |
| 2 | Sensor Kelembaban | Capacitive Soil Moisture v1.2 (anti-korosi) | 1 | Rp15.000 |
| 3 | Sensor Suhu Tanah | DS18B20 Stainless Probe Waterproof (1 meter) | 1 | Rp18.000 |
| 4 | Sensor pH Tanah | Modul Analog pH + Probe BNC Lapangan | 1 | Rp62.000 |
| 5 | Modul LoRa | SX1278 Ra-02 433 MHz + Antena Helikal Spring | 1 | Rp45.000 |
| 6 | Baterai Li-ion | 18650 2600 mAh (3.7V) + Holder | 1 | Rp35.000 |
| 7 | Modul Charger | TP4056 dengan sirkuit proteksi DW01 | 1 | Rp6.000 |
| 8 | Panel Surya Mini | Polycrystalline 5V 1W (110 × 60 mm) + Dioda 1N4007 | 1 | Rp25.000 |
| 9 | Saklar Daya Sensor | MOSFET IRLZ44N / P-Channel AO3401 | 1 | Rp4.000 |
| 10 | Enclosure | Box Junction PVC IP65 Tahan UV & Air Hujan | 1 | Rp30.000 |
| 11 | Housing Probe | Pipa PVC ¾ inch pelindung probe tanah | 1 | Rp10.000 |
| | **TOTAL BIAYA PER NODE** | *(Sesuai plafon purwarupa Rp3.000.000 untuk 10 node)* | | **± Rp305.000** |
