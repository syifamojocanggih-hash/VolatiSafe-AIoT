# FIRMWARE_SPEC.md — Spesifikasi Algoritma Firmware ESP32

---

## 1. Siklus Hidup & State Machine Firmware

ESP32 beroperasi dengan siklus tidur-bangun periodik (*sleep-wake cycle*) untuk memaksimalkan daya tahan baterai 18650 hingga lebih dari 90 hari:

```
[ TIMER WAKEUP ] (Setiap 15 Menit)
       │
       ▼
[ WAKEUP & INIT ]
 • Inisialisasi Serial (115200 baud)
 • Baca parameter kalibrasi dari Flash NVS (DryADC, WetADC, pHSlope, pHNeutralADC)
 • Inisialisasi SPI & Modul LoRa SX1278 (433.0 MHz, SF7, BW 125kHz)
       │
       ▼
[ SENSOR SAMPLING BURST ]
 • Aktifkan GPIO25 (HIGH) ──> Nyalakan MOSFET power gate sensor
 • Delay 200 ms (stabilisasi tegangan sensor)
 • Ambil 5 sampel pembacaan ADC GPIO34 (Kelembaban) & GPIO32 (pH)
 • Baca suhu probe DS18B20 via 1-Wire GPIO4
 • Matikan GPIO25 (LOW) ──> Putus daya sensor (hemat daya & anti-elektrolisis)
       │
       ▼
[ EDGE FILTERING & KALIBRASI ]
 • Urutkan 5 sampel & ambil nilai Median (buang noise spike)
 • Konversi ADC ke % VWC (Kelembaban) & derajat Celsius (Suhu)
 • Hitung kompensasi pH dinamis terhadap kelembaban tanah
 • Ukur voltase baterai aktual melalui pembagi tegangan GPIO35
       │
       ▼
[ LORA TRANSMISSION ]
 • Susun payload kompak JSON (≤ 52 byte)
 • Kirim paket LoRa SX1278 (Max retry 3x dengan interval jeda 2 detik)
       │
       ▼
[ DEEP SLEEP START ]
 • Set timer bangun ESP32: 15 menit (15 × 60 × 1.000.000 µs)
 • Matikan modul radio LoRa (Sleep mode)
 • Masuk mode ESP.deepSleep() (konsumsi arus ~10 µA)
```

---

## 2. Rumus Kalibrasi & Filter Edge

### 2.1 Kalibrasi Kelembaban Tanah Kapasitif
Sensor kapasitif v1.2 menghasilkan tegangan analog tinggi saat udara kering dan turun saat tercelup air:
```cpp
// dryADC: ~2800 (pembacaan di udara kering)
// wetADC: ~1350 (pembacaan dalam gelas air tanah jenuh)
float moisture_pct = (float)(dryADC - moisture_median) / (dryADC - wetADC) * 100.0;
moisture_pct = constrain(moisture_pct, 0.0, 100.0);
```

### 2.2 Kalibrasi & Koreksi pH Tanah
Modul analog pH tanah mengalami pergeseran impedansi saat kelembaban tanah sangat rendah (< 25%). Oleh karena itu, firmware menerapkan formula kompensasi edge:
```cpp
// 1. Konversi ADC ke pH dasar (kalibrasi 2 titik buffer 4.01 dan 6.86)
float ph_raw = 7.0 - ((ph_median - ph_neutral_adc) / ph_slope);

// 2. Edge Preprocessing: Koreksi terhadap kelembaban tanah
// Saat tanah kering (moisture < 50%), pembacaan probe cenderung terbaca lebih asam
float ph_corrected = ph_raw + (0.15 * (50.0 - moisture_pct) / 50.0);
ph_corrected = constrain(ph_corrected, 3.0, 10.0);
```

### 2.3 Pembacaan Suhu DS18B20
- Menggunakan library `OneWire` dan `DallasTemperature`.
- Rentang validasi: $-10^\circ C$ hingga $+60^\circ C$. Jika sensor terputus (terbaca $-127^\circ C$), firmware menandai flag sensor error (`t: -999`).

---

## 3. Anggaran Daya Baterai (Power Budget Analysis)

| Fase Operasi | Arus Terukur | Durasi per Siklus | Konsumsi Daya per Siklus |
|---|---|---|---|
| **Deep Sleep** | 10 µA | 897 detik | 0,0025 mAh |
| **Sensor Aktif (MOSFET ON)** | 15 mA | 1 detik | 0,0042 mAh |
| **Transmisi LoRa SX1278 (+17dBm)** | 120 mA | 0,5 detik | 0,0167 mAh |
| **Overhead Komputasi & ADC ESP32** | 80 mA | 1,5 detik | 0,0333 mAh |
| **TOTAL PER SIKLUS (15 Menit)** | — | **900 detik (15 mnt)** | **≈ 0,0567 mAh** |
| **TOTAL KONSUMSI PER HARI** | — | **96 siklus/hari** | **≈ 5,44 mAh / hari** |

**Kapasitas Baterai 18650 (2600 mAh):**
- Usia pakai teoritis: $\frac{2600 \text{ mAh}}{5,44 \text{ mAh/hari}} \approx 477 \text{ hari}$.
- Usia pakai realistis (faktor efisiensi 60% & degradasi cuaca dingin): **90 – 120 hari** tanpa isi ulang.
- Penambahan panel surya 1W (menghasilkan 100–150 mAh/hari saat terik) menjadikan node berstatus **zero-maintenance (mandiri daya)** sepanjang siklus tanam jagung (100–120 hari).
