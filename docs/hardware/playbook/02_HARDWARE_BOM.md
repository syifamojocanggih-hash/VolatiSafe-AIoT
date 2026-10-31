# 02_HARDWARE_BOM.md — Bill of Materials, Rangkaian & Kalibrasi

> **Dipakai pada:** FASE 0 (persiapan) dan FASE 9 (pengadaan TKT 4)
> **STATUS (31 Okt 2026):** 4 item sudah dibeli (Rp103.000): ESP32-WROOM-32D, Capacitive Soil Moisture v1.2, DS18B20 waterproof, dan modul Micro SD. Delapan item BoM lainnya masih rencana. Ringkasan as-built ada di [`../HARDWARE_STATUS.md`](../HARDWARE_STATUS.md).

---

## 1. Prinsip Pengadaan Bertahap

| Tahap | Kapan | Yang Dibeli | Tujuan |
|---|---|---|---|
| **Tahap 0** | Sekarang (TKT 3) | **4 item inti sudah dibeli (Rp103.000).** | Sensor nyata dan SD sudah bisa diuji bench |
| **Tahap 1** | Bulan 1, setelah insentif cair | **Sisa 8 item BoM (±Rp217.000) + pendukung (±Rp12.500)** | Buktikan asumsi: kalibrasi, deep sleep, jangkauan LoRa |
| **Tahap 2** | Bulan 2, setelah Tahap 1 lulus | 8 unit node + 1 gateway | Uji multi-node, fabrikasi PCB |
| **Tahap 3** | Bulan 4 | Spare part 1 unit (10% cadangan) | Antisipasi probe rusak di lapangan |

**Alasan Tahap 1 hanya 1 unit:** tiga asumsi paling berisiko (arus deep sleep, karakter probe pH di tanah, jangkauan LoRa) belum terbukti. Membeli 10 unit sekaligus mengunci kesalahan desain 10×.

---

## 2. BoM Resmi per Node Lapangan

Rujukan: [`../PINOUT_AND_SCHEMATICS.md`](../PINOUT_AND_SCHEMATICS.md) §4.

**Sudah dibeli (hardware saat ini):** ESP32-WROOM-32D, Capacitive Soil Moisture v1.2, DS18B20 waterproof, modul Micro SD. Baris lain masih rencana.

| # | Komponen | Spesifikasi Teknis | Qty | Harga Satuan | Subtotal |
|---|---|---|---|---|---|
| 1 | ESP32-WROOM-32D | Modul WROOM-32D, dual-core 240 MHz | 1 | Rp55.000 | Rp55.000 |
| 2 | Sensor Kelembaban | Capacitive Soil Moisture v1.2 (anti-korosi) | 1 | Rp15.000 | Rp15.000 |
| 3 | Sensor Suhu Tanah | DS18B20 stainless probe waterproof 1 m | 1 | Rp18.000 | Rp18.000 |
| 4 | Modul Micro SD | SPI 3,3 V + kartu micro SD | 1 | Rp15.000 | Rp15.000 |
| 5 | Sensor pH Tanah | Modul analog pH + probe BNC lapangan | 1 | Rp62.000 | Rp62.000 |
| 6 | Modul LoRa | SX1278 Ra-02 433 MHz + antena helikal | 1 | Rp45.000 | Rp45.000 |
| 7 | Baterai Li-ion | 18650 2600 mAh 3.7 V + holder | 1 | Rp35.000 | Rp35.000 |
| 8 | Modul Charger | TP4056 + proteksi DW01 | 1 | Rp6.000 | Rp6.000 |
| 9 | Panel Surya Mini | Polycrystalline 5 V 1 W + dioda 1N4007 | 1 | Rp25.000 | Rp25.000 |
| 10 | MOSFET | IRLZ44N (N-ch) atau AO3401 (P-ch) | 1 | Rp4.000 | Rp4.000 |
| 11 | Enclosure | Box junction PVC IP65 tahan UV | 1 | Rp30.000 | Rp30.000 |
| 12 | Housing Probe | Pipa PVC ¾ inch | 1 | Rp10.000 | Rp10.000 |
| | **TOTAL PER NODE** | | | | **Rp320.000** |

### 2.1 Komponen Pendukung (belum ada di BoM — wajib ditambahkan)

| # | Komponen | Spesifikasi | Qty | Harga | Untuk |
|---|---|---|---|---|---|
| 13 | Resistor 4.7 kΩ | ¼ W, 1% | 1 | Rp500 | Pull-up 1-Wire DS18B20. **Belum dipasang**; firmware memakai pull-up internal GPIO4. Pasang bila probe berkabel panjang atau pembacaan tidak stabil. |
| 14 | Resistor 100 kΩ | ¼ W, 1% | 2 | Rp1.000 | Voltage divider baterai → GPIO35 (saat baterai ditambahkan) |
| 15 | Resistor 10 kΩ | ¼ W | 2 | Rp1.000 | Pembagi output modul pH ke 3.3 V (§6.3) |
| 16 | Kapasitor 100 nF | Keramik | 2 | Rp1.000 | Decoupling VCC sensor |
| 17 | Header pin | Male/female 2.54 mm | 1 set | Rp3.000 | Koneksi modul |
| 18 | Kabel jumper | Dupont 20 cm | 1 set | Rp5.000 | Wiring |
| 19 | Silica gel | 5 g | 1 | Rp1.000 | Anti-kondensasi dalam enclosure |
| | **TOTAL PENDUKUNG** | | | **± Rp12.500** | |

**Total realistis per node: Rp332.500** (BoM resmi Rp320.000 + pendukung Rp12.500).

> **Temuan T-09:** BoM resmi belum memuat divider baterai, divider pH, dan kabel. Tanpa komponen #14–#15, rangkaian baterai dan pH **tidak akan berfungsi**.

### 2.2 Gateway (belum ada di BoM sama sekali — temuan T-10)

| # | Komponen | Spesifikasi | Qty | Harga |
|---|---|---|---|---|
| 1 | ESP32-WROOM-32D | Modul WROOM-32D | 1 | Rp55.000 |
| 2 | Modul LoRa SX1278 | Ra-02 433 MHz + antena | 1 | Rp45.000 |
| 3 | Enclosure | Box IP65 | 1 | Rp30.000 |
| 4 | Adaptor 5 V 2 A | Micro-USB | 1 | Rp20.000 |
| 5 | Kabel antena + pigtail | U.FL → SMA | 1 | Rp15.000 |
| | **TOTAL GATEWAY** | | | **Rp165.000** |

Gateway bisa juga memakai Raspberry Pi yang sudah ada (lebih mahal tapi bisa menjalankan Mosquitto + bridge MQTT sekaligus). BoM di atas adalah opsi termurah.

---

## 3. Anggaran Total vs Plafon Insentif

Plafon: **Rp3.000.000**.

| Skenario | Perhitungan | Total | Status |
|---|---|---|---|
| Naif: 10 node, BoM resmi | 10 × Rp320.000 | Rp3.200.000 | ❌ **lewat Rp200.000** |
| Realistis: 10 node + pendukung | 10 × Rp332.500 | Rp3.325.000 | ❌ lewat Rp325.000 |
| Realistis + gateway | 10 × Rp332.500 + Rp165.000 | **Rp3.490.000** | ❌ lewat Rp490.000 |
| **Rekomendasi: 8 node + 1 gateway + cadangan** | 8 × Rp332.500 + Rp165.000 | **Rp2.825.000** | ✅ sisa Rp175.000 |
| Rekomendasi + 1 node cadangan | + Rp332.500 | Rp3.157.500 | ⚠️ lewat Rp157.500 |
| **Rekomendasi final: 9 node + 1 gateway** | 9 × Rp332.500 + Rp165.000 | **Rp3.157.500** | ⚠️ lewat Rp157.500 |

**Usulan penyesuaian agar pas:** turunkan enclosure ke box plastik ABS non-IP65 untuk node yang dipasang di bawah kanopi (Rp12.000, hemat Rp18.000/node) → 9 × Rp314.500 + Rp165.000 = **Rp2.995.500**, sisa Rp4.500 tanpa cadangan probe. Bila cadangan probe diperlukan, turun ke 8 node: 8 × Rp314.500 + Rp165.000 = **Rp2.681.000**, sisa Rp319.000. Lihat `DEC-IOT-04` di [`09_RISIKO_DAN_KEPUTUSAN.md`](09_RISIKO_DAN_KEPUTUSAN.md).

> **Catatan strategi proposal:** 8–9 node sudah cukup untuk klaim "multi-node mesh". Menulis "10 node" di proposal tetapi hanya sanggup 9 akan menjadi temuan saat audit insentif. Lebih aman menulis **"8 node + 1 gateway"** bila cadangan probe dianggarkan; **"9 node + 1 gateway"** hanya jika tanpa cadangan.

---

## 4. Alternatif Komponen (jika stok kosong / harga naik)

| Komponen asli | Alternatif | Konsekuensi |
|---|---|---|
| ESP32-WROOM-32D | ESP32 DevKit V1 38-pin | Pinout berbeda; perbarui `config.h`. Lebih banyak pin GND. |
| ESP32-WROOM-32D | ESP32-WROOM-32 bare module + LDO low-Iq | **Wajib** bila target arus tidur < 1 mA (lihat §5) |
| Capacitive v1.2 | v2.0 / v1.2 versi 3.3 V | Kurva ADC sedikit berbeda; wajib kalibrasi ulang 2 titik |
| DS18B20 probe stainless | DS18B20 TO-92 + epoxy | Tidak tahan tanah basah jangka panjang |
| Modul pH analog + BNC | Modul pH RS485 Modbus | Lebih mahal; hanya ganti `sensors.cpp`, kontrak payload tidak berubah |
| SX1278 Ra-02 433 MHz | RFM95W 433 MHz | Pinout sama (SPI), DIO0 sama; library `LoRa` kompatibel |
| TP4056 | TP4056 dengan USB-C | Hanya konektor berbeda |
| MOSFET IRLZ44N | AO3401 (P-channel high-side) | Rangkaian gate berbeda: P-ch butuh pull-up, logika GPIO terbalik |

---

## 5. Peringatan Kritis: Klaim Arus Deep Sleep 10 µA Tidak Realistis di Dev Board

Dokumen `../FIRMWARE_SPEC.md` §3 dan `../ARCHITECTURE_IOT.md` §4.3 menyebut arus deep sleep **10 µA**. Angka ini benar untuk **chip ESP32 saja**, bukan untuk board development.

Komponen yang tetap mengalirkan arus saat deep sleep pada dev board ESP32-WROOM-32D:

| Komponen | Arus tipikal | Bisa dimatikan? |
|---|---|---|
| Regulator AMS1117-3.3 | 5–11 mA (quiescent) | Tidak, kecuali diganti LDO low-Iq |
| Chip USB-UART CP2102/CH340 | 0,1–1 mA (jika tidak di-*disable*) | Ya, via `ARDUINO_USB_CDC_ON_BOOT=0` + memutus jalur VBUS |
| LED power onboard | 1–3 mA | Ya, potong jalur / desolder |
| ESP32 deep sleep | 10–150 µA | Ya |
| **Total realistis dev board** | **±2–10 mA** | |

**Konsekuensi pada klaim ketahanan baterai:**

| Asumsi arus tidur | Konsumsi harian (dengan 5,44 mAh/hari aktif) | Ketahanan 2600 mAh |
|---|---|---|
| 10 µA (klaim dokumen) | 5,7 mAh/hari | **±456 hari** |
| 1 mA (dev board, LED dicabut) | 24 + 5,44 ≈ 29 mAh/hari | **±90 hari** |
| 5 mA (dev board standar) | 120 + 5,44 ≈ 125 mAh/hari | **±21 hari** |
| 2 mA + panel surya 1 W (110 mAh/hari) | 48 + 5,44 = 53 mAh/hari terhadap 110 | **surplus, aman** |

**Keputusan yang perlu diambil:** `DEC-IOT-05` di [`09_RISIKO_DAN_KEPUTUSAN.md`](09_RISIKO_DAN_KEPUTUSAN.md).

Rekomendasi: untuk prototipe TKT 4 pakai dev board + panel surya (klaim "zero-maintenance" tetap benar dengan panel). Untuk produk final, pakai ESP32-WROOM-32 bare module + LDO MCP1700 (Iq 1,6 µA) atau masuk mode dengan `esp_sleep_pd_config()`.

> **Untuk proposal TKT 3:** klaim yang jujur adalah *"arsitektur hemat daya: deep sleep 15 menit dengan target arus < 15 µA pada desain final (bare module + LDO low-Iq)"*. Jangan menulis "terukur 10 µA" karena belum ada pengukuran.

---

## 6. Rangkaian: Yang Harus Benar Sebelum Disolder

### 6.1 Aturan ADC
Sensor analog **wajib** di ADC1 (GPIO 32–39). ADC2 (GPIO 0, 2, 4, 12–15, 25–27) tidak bisa dipakai bersamaan dengan radio WiFi/BT aktif. Karena build `[env:wokwi]` justru menyalakan WiFi, pelanggaran ini akan muncul sebagai data kacau **hanya di simulasi** — sulit didiagnosis.

| Sensor | Pin | Kanal ADC | Catatan |
|---|---|---|---|
| Kelembaban | GPIO34 | ADC1_CH6 | Input-only pin, tidak ada pull-up internal |
| pH | GPIO32 | ADC1_CH4 | Bisa juga dipakai output, tapi jangan |
| Baterai | GPIO35 | ADC1_CH7 | Input-only; **belum terpasang**, firmware kirim placeholder |
| DS18B20 | GPIO4 | — | Digital. **Tanpa resistor eksternal**, memakai `INPUT_PULLUP` internal |
| Micro SD | GPIO5 | — | SPI CS; bentrok dengan CS LoRa, pindahkan CS LoRa nanti |

### 6.2 Pembagi Tegangan Baterai
18650 terisi penuh = 4,2 V. ADC ESP32 dengan atenuasi 11 dB aman sampai ±3,1 V.

```
Baterai (+) ──[100 kΩ]──┬── GPIO35
                        │
                    [100 kΩ]
                        │
                       GND
```

V_ADC = V_bat / 2. Pada 4,2 V → 2,10 V. Aman. `BATTERY_DIVIDER = 2.0f` di `config.h` sudah benar.

### 6.3 Modul pH: Dua Jebakan

**Jebakan 1 — Tegangan output.** Banyak modul pH analog dijual untuk Arduino 5 V dan mengeluarkan 0–3 V atau bahkan 0–5 V tergantung modul. Jika diberi 5 V, output dapat melebihi 3,3 V dan merusak pin ESP32.

Solusi:
- Beri daya modul 3,3 V bila spesifikasinya mengizinkan (banyak modul bekerja 3,3–5,5 V), **atau**
- Tetap 5 V dan pasang pembagi 10 kΩ/20 kΩ di output sebelum masuk GPIO32.

**Jebakan 2 — Probe pH di tanah bukan pengukuran pH tanah yang sah.** Probe pH BNC dirancang untuk larutan. Menancapkan langsung ke tanah kering menghasilkan pembacaan melayang dan cepat merusak junction kaca.

Praktik agronomi standar: **pH tanah diukur dari suspensi tanah:air 1:2,5**. Untuk node otomatis, opsi realistis:

| Opsi | Cara | Konsekuensi |
|---|---|---|
| A. Probe di tanah + rumus kompensasi kelembaban | Seperti `config.h` sekarang | Cepat rusak, akurasi rendah, tapi murah & tanpa perawatan |
| B. Rumah probe berisi tanah + air (slurry chamber) | Probe tertanam di chamber yang dijaga lembap | Lebih stabil, butuh desain mekanik |
| C. Ganti ke sensor pH RS485 industrial | Modul + probe tahan tanah | +Rp300k/node, melebihi plafon |

Rekomendasi: **Opsi A untuk TKT 4–5** dengan catatan keterbatasan ditulis eksplisit di proposal, **Opsi B untuk TKT 6**. Jangan mengklaim akurasi laboratorium.

> Untuk demo juri TKT 3 ini tidak relevan (potensiometer simulasi), tetapi **juri DeepTech kemungkinan menanyakannya**. Siapkan jawaban.

### 6.4 Power Gate (MOSFET)
Deskripsi lengkap: [`../PINOUT_AND_SCHEMATICS.md`](../PINOUT_AND_SCHEMATICS.md) §2.

| Pilihan | Wiring | Logika GPIO25 | Catatan |
|---|---|---|---|
| N-channel low-side (IRLZ44N) | Sensor GND → Drain; Source → GND; Gate → GPIO25 | `HIGH` = ON | Paling mudah. GND sensor jadi mengambang saat OFF — aman untuk sensor kapasitif |
| P-channel high-side (AO3401) | Source → 3,3 V; Drain → VCC sensor; Gate → GPIO25 + pull-up 10 kΩ ke 3,3 V | `LOW` = ON (**terbalik**) | Lebih benar secara kelistrikan, tapi `config.h` perlu flag inversi |

**Keputusan:** pakai N-channel low-side. `config.h` saat ini mengasumsikan `HIGH` = ON, konsisten dengan N-channel.

**Peringatan:** jika memakai N-channel low-side untuk modul pH yang punya ground referensi bersama dengan ADC, memutus GND dapat membuat arus mengalir lewat pin analog (jalur proteksi) dan merusak ESP32. Mitigasi: tambahkan dioda Schottky dari pin analog ke 3,3 V, atau pisahkan power gate hanya untuk sensor kapasitif + DS18B20, dan biarkan modul pH selalu menyala (konsumsi modul pH ±10 mA — perlu dihitung ulang di power budget).

Ini perlu diuji di Tahap 1, bukan diasumsikan.

---

## 7. Alat Ukur yang Dibutuhkan (TKT 4)

| Alat | Fungsi | Wajib? |
|---|---|---|
| Multimeter digital | Verifikasi tegangan divider, kontinuitas, arus | **Wajib** |
| USB power meter (inline) | Ukur arus nyata saat aktif | **Wajib** untuk validasi power budget |
| Solder + timah + flux | Perakitan | **Wajib** |
| Solder wick / pump | Perbaikan | Opsional |
| Heat shrink + heat gun | Isolasi sambungan di lapangan | **Wajib** |
| Silicone sealant netral | Seal kabel masuk enclosure | **Wajib** |
| Tang crimping | Konektor | Opsional |
| Osiloskop | Debug noise ADC / SPI | Opsional (pinjam kampus) |

Pengukuran arus deep sleep di bawah 1 mA **tidak bisa** dengan USB power meter biasa (resolusinya terlalu kasar). Butuh multimeter dengan mode µA, atau modul INA219/INA260.

---

## 8. Prosedur Kalibrasi (TKT 4, HW-9.2)

### 8.1 Kalibrasi Kelembaban (2 titik)

| Titik | Media | Cara | Nilai acuan |
|---|---|---|---|
| **Dry** | Udara ruang | Sensor di udara, jangan disentuh, tunggu 30 detik | Catat ADC → `MOISTURE_DRY_ADC` |
| **Wet** | Tanah jenuh air | Tanam sensor di tanah yang direndam sampai jenuh, tunggu 60 detik | Catat ADC → `MOISTURE_WET_ADC` |

Prosedur:
1. Flash firmware mode kalibrasi (HW-2.7): kirim `CAL MOIST` via Serial.
2. Firmware mencetak 5 sampel + median tiap 500 ms.
3. Catat median dry, lalu median wet.
4. Tulis ke NVS, bukan hardcode: `CAL SET MOIST_DRY 2740` / `CAL SET MOIST_WET 1310`.
5. Verifikasi: masukkan sensor ke tanah dengan kadar air diketahui (timbang massa air / massa tanah kering). Toleransi ±5% VWC.
6. **Ulangi per unit** — dua sensor kapasitif murah bisa berbeda 200–400 ADC.

### 8.2 Kalibrasi pH (2 titik, buffer standar)

Butuh larutan buffer pH 4,01 dan pH 6,86 (beli di toko kimia, ±Rp25.000/botol).

1. Bilas probe dengan air deionisasi, keringkan dengan tisu lembut (jangan digosok).
2. Celup di buffer 6,86 → tunggu 60 detik sampai angka stabil → `CAL SET PH_NEUTRAL <adc>`.
3. Bilas, celup di buffer 4,01 → tunggu 60 detik → `CAL SET PH_SLOPE <adc_per_ph>`.
   `PH_SLOPE = (adc_686 − adc_401) / (6.86 − 4.01)`
4. Verifikasi dengan buffer ketiga bila ada (pH 9,18). Toleransi ±0,15 pH.
5. Setelah terpasang di tanah, lakukan **kalibrasi lapangan silang**: ambil sampel tanah di sekitar probe, ukur pH-nya di lab/kantin dengan pH meter standar, bandingkan. Selisih sistematis → simpan sebagai offset.

**Catatan:** `config.h` saat ini memakai `PH_NEUTRAL_ADC 1500.0f` dan `PH_SLOPE 300.0f` — ini **angka placeholder**, bukan hasil kalibrasi. Jangan pernah dipakai untuk klaim akurasi.

### 8.3 Verifikasi Tegangan Baterai
1. Ukur tegangan 18650 dengan multimeter: misal 3,87 V.
2. Baca `b` dari payload.
3. Toleransi ±0,05 V. Bila lebih, periksa nilai resistor aktual (100 kΩ ±1% → bagi tegangan tidak persis 2,0).

---

## 9. Checklist FASE 9 (Pengadaan)

- [ ] 1 unit prototipe dipesan (Tahap 1), **termasuk komponen pendukung #13–#19**
- [ ] Multimeter + USB power meter tersedia
- [ ] Buffer pH 4,01 & 6,86 tersedia sebelum kalibrasi
- [ ] Arus deep sleep diukur nyata; angka dicatat menggantikan klaim 10 µA
- [ ] Uji power gate: arus sensor saat OFF < 1 µA
- [ ] Keputusan pH (Opsi A/B/C, §6.3) dicatat di `DEC-IOT-*`
- [ ] Harga aktual per node dicatat; total ≤ Rp3.000.000 termasuk gateway
- [ ] Sisa prototipe Tahap 1 lulus semua uji sebelum pesan 8 unit berikutnya
