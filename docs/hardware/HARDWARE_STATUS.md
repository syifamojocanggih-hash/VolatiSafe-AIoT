# HARDWARE_STATUS.md — Status Hardware Aktual (As-Built)

> **Tanggal:** 31 Oktober 2026
> **Node uji:** `VS-A1-003`
> **Board:** ESP32-WROOM-32D DevKit, USB-UART CP210x (COM5)
> **Firmware:** 1.0.0, environment `esp32dev`
> **Sumber utama:** [`evidence/HW-9.1_bench_findings_20261031.md`](evidence/HW-9.1_bench_findings_20261031.md)

Dokumen ini menjawab satu pertanyaan: **hardware apa yang benar-benar ada dan bisa diuji sekarang?**
BoM di [`PINOUT_AND_SCHEMATICS.md`](PINOUT_AND_SCHEMATICS.md), [`ARCHITECTURE_IOT.md`](ARCHITECTURE_IOT.md), dan PRD adalah **target desain**. Selisih antara target dan kondisi saat ini dicatat di sini.

---

## 1. Ringkasan

| Kategori | Jumlah | Item |
|---|---|---|
| Sudah ada | 4 | ESP32-WROOM-32D DevKit, Capacitive Soil Moisture v1.2, DS18B20 waterproof, modul Micro SD |
| Belum ada | 8+ | pH, LoRa SX1278, baterai, charger, panel surya, MOSFET, enclosure, resistor pendukung |
| Transport fisik | 1 | WiFi/MQTT (bukan LoRa) |
| Sensor terverifikasi | 2 | DS18B20 lulus; moisture terbaca tetapi belum terkalibrasi |
| Penyimpanan | 1 | Modul SD terpasang, tetapi kartu tidak terdeteksi saat uji bench |

**Kesimpulan singkat:** prototipe fisik saat ini adalah node WiFi/MQTT dengan dua sensor nyata (moisture dan suhu). pH dan baterai masih placeholder. Store-and-forward belum terbukti karena SD tidak terdeteksi.

---

## 2. Hardware yang Sudah Ada

| Komponen | Spesifikasi | Qty | Pin / Bus | Status firmware | Catatan |
|---|---|---|---|---|---|
| ESP32-WROOM-32D DevKit | Modul WROOM-32D, USB-UART CP210x | 1 | — | Aktif | Board yang dipakai uji bench, port COM5 |
| Capacitive Soil Moisture v1.2 | Sensor kelembaban tanah anti-korosi | 1 | GPIO34 (ADC1_CH6) | Dibaca | ADC mentah `3165` stabil; konversi `-25.2%` karena kalibrasi default tidak cocok |
| DS18B20 waterproof | Probe stainless 1-Wire | 1 | GPIO4 | Dibaca | 1 device, `23.62°C`, pull-up internal ESP32 |
| Modul Micro SD | Modul SPI 3,3 V + kartu micro SD | 1 | CS5, SCK18, MISO19, MOSI23 | Gagal mount | Log bench: `[SD] tidak ada kartu`; buffer nonaktif |

**Pendukung yang dipakai saat bench:** kabel USB data dan kabel jumper. Breadboard dan tipe/format kartu SD belum tercatat di evidence.

---

## 3. Hardware yang Belum Ada

| Komponen | Dampak | Workaround saat ini |
|---|---|---|
| Sensor pH + probe BNC | pH tanah tidak diukur | Build fisik `PH_ONBOARD=0`: kirim `7.00` berstatus `N/A`; GPIO32 tidak dibaca. Wokwi memakai `pot_ph` |
| Modul LoRa SX1278 Ra-02 + antena | Tidak ada telemetri radio | Transport fisik WiFi/MQTT; kode LoRa dipertahankan di `[env:esp32dev_lora]` |
| Baterai 18650 + holder | Tidak ada catu daya mandiri | Board diberi daya USB; `BATTERY_ONBOARD=0` mengirim `3.87 V` berstatus `NOT_PRESENT` |
| TP4056 + proteksi DW01 | Tidak ada pengisian baterai | Tidak berlaku selama daya USB |
| Panel surya 5V 1W + dioda | Tidak ada pengisian mandiri | Tidak berlaku |
| MOSFET power gate (GPIO25) | Sensor tidak bisa diputus saat sleep | Sensor menyala langsung dari 3V3; GPIO25 disiapkan di firmware |
| Enclosure IP65 + housing probe | Belum tahan hujan/debu | Uji bench di meja, belum siap lapangan |
| Resistor 4.7 kΩ, 100 kΩ, 10 kΩ, kapasitor 100 nF | Pull-up eksternal dan divider belum ada | DS18B20 memakai pull-up internal; divider baterai/pH belum diperlukan karena kanal belum ada |
| Header, jumper cadangan, silica gel | Perakitan lapangan belum lengkap | Wiring bench memakai jumper yang ada |

---

## 4. Status Uji Bench (HW-9.1)

| Pemeriksaan | Hasil | Status |
|---|---|---|
| Boot dan wake reason | `wake: power-on/reset` | Lulus |
| Kalibrasi NVS | NVS kosong, memakai default `2800/1350` | Lulus |
| DS18B20 | 1 device, `t=23.62C(OK)` | Lulus |
| ADC moisture | `3165` stabil (`3162..3170`) | Terukur |
| Konversi moisture | `-25.2%` dengan status `RANGE` | Gagal kalibrasi |
| pH | `7.00(N/A)` placeholder | Sesuai desain |
| Baterai | `3.87V(N/A)` placeholder | Sesuai desain |
| Deteksi SD | `[SD] tidak ada kartu` | Gagal deteksi |
| Payload | 63 byte, urutan key sesuai kontrak | Lulus |
| TX MQTT | `GAGAL ok=0 attempts=3` | Belum teruji ke broker |
| Durasi sampling | 729 ms | Lulus |
| Siklus aktif | 24.871 ms termasuk timeout WiFi dan retry | Terukur |
| Tidur | 900 detik | Lulus |
| RAM / Flash | 14,6% / 81,6% | Flash di atas ambang 80% |

**Yang belum bisa diklaim dari bench ini:** pH terukur, baterai terukur, SD menyimpan data, MQTT terkirim ke broker, dan LoRa terpancar.

---

## 5. Wiring As-Built

```
ESP32-WROOM-32D
├── GPIO34 ← Capacitive Soil Moisture SIG
├── GPIO4  ↔ DS18B20 DQ (pull-up internal)
├── GPIO5  → Micro SD CS
├── GPIO18 → Micro SD SCK
├── GPIO19 ← Micro SD MISO
├── GPIO23 → Micro SD MOSI
├── GPIO32   (tidak dibaca; pH placeholder)
├── GPIO35   (tidak dibaca; baterai placeholder)
└── GPIO25   (belum disambungkan; power gate target)
```

Tidak ada resistor eksternal di rangkaian saat ini. Tidak ada modul pH, LoRa, baterai, atau MOSFET.

---

## 6. Flag Firmware yang Menentukan Perilaku

| Flag | Nilai build fisik | Efek |
|---|---|---|
| `PH_ONBOARD` | `0` | pH tidak dihitung dari ADC; kirim `7.00` + `SENSOR_NOT_PRESENT` |
| `BATTERY_ONBOARD` | `0` | Baterai tidak dibaca; kirim `3.87 V` + `SENSOR_NOT_PRESENT` |
| `DS18B20_USE_INTERNAL_PULLUP` | `1` | `INPUT_PULLUP` pada GPIO4, tanpa resistor 4.7 kΩ |
| `TRANSPORT_*` | MQTT | WiFi + Mosquitto, bukan LoRa |
| `SD_BUFFER_MAX_LINES` | `200` | Batas antrian store-and-forward bila kartu terdeteksi |

Payload tetap enam key (`n, ts, m, t, ph, b`). Backend tidak bisa membedakan nilai placeholder dari nilai sensor nyata; status hanya ada di firmware/log Serial.

---

## 7. Daftar Belanja Berikutnya

Urutan berdasarkan apa yang paling cepat membuka verifikasi.

| Prioritas | Item | Estimasi | Untuk |
|---|---|---|---|
| 1 | Kartu microSD FAT32 8–32 GB yang sudah terbukti | Rp15.000 | Mengganti kartu yang tidak terdeteksi; menguji store-and-forward |
| 1 | Resistor 4.7 kΩ (opsional) | Rp500 | Cadangan bila probe DS18B20 berkabel panjang |
| 2 | Modul pH analog + probe BNC | Rp62.000 | Mengaktifkan `PH_ONBOARD=1` dan kalibrasi 2 titik |
| 2 | Larutan buffer pH 4,01 dan 6,86 | ±Rp50.000 | Kalibrasi pH |
| 3 | Baterai 18650 + holder | Rp35.000 | Catu daya mandiri |
| 3 | TP4056 + DW01 | Rp6.000 | Pengisian baterai |
| 3 | Resistor 100 kΩ ×2 | Rp1.000 | Divider baterai ke GPIO35 |
| 3 | Panel surya 5V 1W + dioda 1N4007 | Rp25.000 | Pengisian mandiri |
| 3 | MOSFET IRLZ44N / AO3401 | Rp4.000 | Power gate GPIO25 |
| 3 | Enclosure IP65 + housing probe PVC | Rp40.000 | Kesiapan lapangan |
| 4 | LoRa SX1278 Ra-02 + antena | Rp45.000 | Transport radio; pindahkan CS dari GPIO5 |
| 4 | Gateway LoRa (ESP32 + SX1278 + enclosure + adaptor) | ±Rp165.000 | Penerima paket LoRa |

**Sisa BoM resmi:** Rp320.000 − Rp103.000 (4 item sudah dibeli) = **Rp217.000**.
**Ditambah komponen pendukung:** Rp12.500 → **Rp229.500**.
**Ditambah gateway dan buffer pH:** ±Rp444.500 untuk satu node lengkap + gateway + kalibrasi.

---

## 8. Referensi

- [`PINOUT_AND_SCHEMATICS.md`](PINOUT_AND_SCHEMATICS.md) — pinout dan skema target
- [`FIRMWARE_SPEC.md`](FIRMWARE_SPEC.md) — perilaku firmware dan flag build
- [`TELEMETRY_PAYLOAD.md`](TELEMETRY_PAYLOAD.md) — kontrak payload
- [`WOKWI_SIMULATION.md`](WOKWI_SIMULATION.md) — pemetaan part Wokwi vs hardware nyata
- [`evidence/HW-9.1_bench_findings_20261031.md`](evidence/HW-9.1_bench_findings_20261031.md) — bukti uji bench
- [`playbook/02_HARDWARE_BOM.md`](playbook/02_HARDWARE_BOM.md) — BoM target dan prosedur kalibrasi
