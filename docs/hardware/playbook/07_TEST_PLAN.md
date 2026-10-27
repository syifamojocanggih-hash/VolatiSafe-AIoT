# 07_TEST_PLAN.md — Rencana Pengujian & Bukti

> **Dipakai pada:** FASE 7 (HW-7.1 … HW-7.4), dan sebagai acuan uji fisik TKT 4
> **Aturan:** tidak ada task yang boleh ditandai `✅` di [`00_INDEX.md`](00_INDEX.md) tanpa entri di §6.

---

## 1. Piramida Pengujian

```
                    ┌──────────────────────┐
                    │  E2E (3 skenario)    │  manual, 3× per demo
                    │  Wokwi → MQTT → BE   │
                    ├──────────────────────┤
                    │  Integrasi (6 kasus) │  manual, tiap build
                    │  node ↔ broker       │
                    ├──────────────────────┤
                    │  Unit (33 kasus)     │  otomatis, tiap commit
                    │  fungsi murni native │
                    └──────────────────────┘
```

Prinsip: **semakin banyak diuji di bawah, semakin murah.** Logika kalibrasi, filter, dan encoder harus lulus unit test tanpa menyalakan Wokwi sama sekali.

---

## 2. Unit Test (env `native`, otomatis)

File: `firmware/test/test_core/test_main.cpp` (Unity). Jalankan:

```powershell
pio test -e native --project-dir firmware
```

### 2.1 `sensors_medianAverage`

| # | Input | Expected | Alasan |
|---|---|---|---|
| U-01 | `{1000,1000,1000,1000,4095}` | `1000.0` | spike tunggal terbuang |
| U-02 | `{100,3000,1000,1100,1200}` | `1100.0` | dua outlier berlawanan terbuang |
| U-03 | `{2000,2000,2000,2000,2000}` | `2000.0` | sinyal stabil |
| U-04 | `{1500}` | `1500.0` | satu sampel, tidak ada yang dibuang |
| U-05 | `{1000,2000}` | `1500.0` | dua sampel → rata-rata biasa |
| U-06 | `{0,0,4095,4095,2048}` | `(0+2048+4095)/3 = 2047.67` | hanya satu min & satu max dibuang |

> U-06 sengaja mendokumentasikan keterbatasan: dua nilai ekstrem di sisi yang sama tidak sepenuhnya terbuang. Itu **perilaku yang diterima** — median sejati 5 sampel akan menghasilkan 2048. Selisih 0,33 ADC tidak signifikan. Catat di `DEC-IOT-06`.

### 2.2 `sensors_adcToMoisturePct` (dry 2800, wet 1350)

| # | ADC | Expected | Catatan |
|---|---|---|---|
| U-07 | 2800 | `0.0` | batas kering |
| U-08 | 1350 | `100.0` | batas jenuh |
| U-09 | 2075 | `50.0` | titik tengah |
| U-10 | 3000 | `0.0` | di-clamp (di atas dry) |
| U-11 | 1200 | `100.0` | di-clamp (di bawah wet) |
| U-12 | 2496 | `21.0` ± 0,2 | target Skenario A |
| U-13 | 2191 | `42.0` ± 0,2 | target Skenario B |

### 2.3 `sensors_adcToPh` (neutral 1500, slope 300)

| # | ADC | Moisture | Expected `ph` | Catatan |
|---|---|---|---|---|
| U-14 | 1500 | 50,0 | `7.00` | tanpa koreksi |
| U-15 | 1200 | 50,0 | `8.00` | ADC turun → pH naik |
| U-16 | 1800 | 50,0 | `6.00` | ADC naik → pH turun |
| U-17 | 1500 | 0,0 | `7.15` | koreksi maksimum +0,15 |
| U-18 | 1500 | 100,0 | `6.85` | koreksi minimum −0,15 |
| U-19 | 1271 | 21,0 | `7.85` ± 0,01 | target Skenario A |
| U-20 | 1567 | 42,0 | `6.80` ± 0,01 | target Skenario B |
| U-21 | 0 | 50,0 | `10.00` | clamp atas |
| U-22 | 4095 | 50,0 | `3.00` | clamp bawah |

### 2.4 `sensors_adcToBatteryV`

| # | ADC | Expected | Catatan |
|---|---|---|---|
| U-23 | 2401 | `3.87` ± 0,01 | baterai demo |
| U-24 | 2606 | `4.20` ± 0,01 | penuh |
| U-25 | 1861 | `3.00` ± 0,01 | low battery |

### 2.5 `payload_encode`

| # | Kasus | Expected |
|---|---|---|
| U-26 | `VS-A1-003`, 22.4/34.1/7.83/3.87 | string persis `{"n":"VS-A1-003","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}` |
| U-27 | panjang hasil | `70` byte (bukan 52 — lihat DEC-IOT-02) |
| U-28 | `VS-SIM-001` (10 char) | panjang `71` byte |
| U-29 | Node ID 12 char, nilai maksimum | panjang `76` byte |
| U-30 | buffer `cap = 20` | return `0` (tidak boleh mengirim JSON terpotong) |
| U-31 | `t = -999` | key `t` = `-999.0`, dan payload tetap terbentuk |
| U-32 | urutan key | `n, ts, m, t, ph, b` — verifikasi dengan `strstr` berurutan |
| U-33 | tidak ada spasi | `strchr(payload, ' ') == NULL` |

### 2.6 Hasil yang harus disimpan

```
docs/hardware/evidence/unit_test_<YYYYMMDD>.txt
```

Isi = output lengkap `pio test -e native`. Format akhir harus:

```
------------ native:test_core [PASSED] Took 1.23 seconds ------------
```

---

## 3. Pengujian Integrasi (manual, tiap build)

| # | Kasus | Langkah | Expected |
|---|---|---|---|
| I-01 | Build fisik | `pio run -e esp32dev` | `SUCCESS`, tidak ada warning `unused` yang mencurigakan |
| I-02 | Build simulasi | `pio run -e wokwi` | `SUCCESS` |
| I-03 | Payload sampai broker | jalankan Wokwi + `mosquitto_sub` | 5 paket berturut, `ts` naik monoton |
| I-04 | Broker mati | hentikan Mosquitto saat Wokwi jalan | node retry 3×, lalu tidur; tidak crash, Serial mencetak `ok=0 attempts=3` |
| I-05 | NVS kosong | `pio run -t erase` lalu jalankan | Serial mencetak `[CAL] NVS kosong ...`, node tetap mengirim data |
| I-06 | DS18B20 terputus | hapus part DS18B20 di diagram, jalankan | payload berisi `"t":-999.0`; backend menolak (bukan diterima) |

**Status per 26 Okt 2026:** I-01, I-02, I-04, I-05 lulus. I-03 ⛔ **belum bisa dijalankan**: `wokwi-cli` memakai gateway publik Wokwi, yang tidak bisa menghubungi jaringan lokal mesin ini, sehingga Mosquitto di `localhost:1883` tidak terjangkau (`state=-2`, DNS berhasil ke `10.13.37.254`). Private Gateway yang membuat `host.wokwi.internal` bisa dipakai hanya tersedia untuk akun berbayar. I-03 tetap menjadi DoD HW-5.4 dan dicatat sebagai `DEC-IOT-19`; jangan menandainya lulus tanpa `I03_mqtt_rx.txt`.

### 3.1 Bukti I-03 (contoh format yang harus disimpan)

```
docs/hardware/evidence/I03_mqtt_rx.txt
```

```
/volatisafe/v1/node/VS-SIM-001/telemetry {"n":"VS-SIM-001","ts":1792934401,"m":21.0,"t":34.5,"ph":7.85,"b":3.87}
/volatisafe/v1/node/VS-SIM-001/telemetry {"n":"VS-SIM-001","ts":1792934411,"m":21.0,"t":34.5,"ph":7.85,"b":3.87}
...
```

Perhatikan `ts` naik 10 detik (karena `SIM_FAST_CYCLE`). Pada build fisik jaraknya 900 detik.

---

## 4. Pengujian End-to-End (3 skenario juri)

Nilai injeksi tepat: [`05_WOKWI_SIMULASI.md`](05_WOKWI_SIMULASI.md) §5.

| # | Skenario | Injeksi | Expected di payload | Expected di dashboard |
|---|---|---|---|---|
| E-01 | A — Terik | m 21 %, t 34,5 °C, pH 7,85 | `"m":21.0,"t":34.5,"ph":7.85` | AVRI ±78 %, kategori Kritis, banner merah, alert terkirim |
| E-02 | B — Hujan | m 42 %, t 26,0 °C, pH 6,80 | `"m":42.0,"t":26.0,"ph":6.80` | AVRI ±18 %, kategori Aman, banner hijau, preskripsi jendela aman |
| E-03 | C — Dropout | node dihentikan ≥ 35 menit | tidak ada paket baru | grafik kontinu, label `[Est-Simulated]`, `is_predicted=true`, tidak crash |

**Toleransi:** nilai AVRI E-01 dan E-02 bergantung pada model AI (domain Aris) dan data cuaca BMKG yang aktif. Angka 78 % / 18 % adalah target desain, bukan hasil yang dijamin. Bila model menghasilkan 71 % atau 84 %, skenario tetap **PASS** selama kategori risiko sesuai (Kritis / Aman). Catat nilai aktual, jangan memaksa hasil.

### 4.1 Bukti E2E

| File | Isi |
|---|---|
| `evidence/E01_serial.txt` | log Serial Wokwi (payload + status TX) |
| `evidence/E01_mqtt.txt` | output `mosquitto_sub` |
| `evidence/E01_dashboard.png` | tangkapan dashboard (banner merah) |
| `evidence/E02_*.{txt,png}` | idem |
| `evidence/E03_*.{txt,png}` | idem, termasuk label `[Est-Simulated]` |

---

## 5. Baseline Build & Power Budget

### 5.1 Baseline RAM/Flash (isi setelah HW-0.5, perbarui tiap fase)

| Fase | Env | RAM (%) | Flash (%) | Tanggal | Catatan |
|---|---|---|---|---|---|
| 0 | `esp32dev` | 6,8 % (22.172 / 327.680 B) | 22,6 % (296.752 / 1.310.720 B) | 26 Okt 2026 | skeleton + 4 lib `lib_deps` |
| 1 | `esp32dev` | 6,8 % (22.188 / 327.680 B) | 22,7 % (296.972 / 1.310.720 B) | 26 Okt 2026 | 7 modul, API stub |
| 1 | `wokwi` | 6,8 % (22.188 / 327.680 B) | 22,7 % (297.116 / 1.310.720 B) | 26 Okt 2026 | 7 modul, API stub, + PubSubClient |
| 3* | `esp32dev` | 6,8 % (22.188 / 327.680 B) | 22,7 % (296.988 / 1.310.720 B) | 26 Okt 2026 | encoder + fungsi murni nyata, transport masih stub |
| 3* | `wokwi` | 6,8 % (22.188 / 327.680 B) | 22,7 % (297.132 / 1.310.720 B) | 26 Okt 2026 | idem + PubSubClient |
| 3* | `native` | — | — | 26 Okt 2026 | env unit test, 16 test PASS (tidak ada batas RAM/Flash) |
| 2 | `esp32dev` | 6,8 % (22.300 / 327.680 B) | 24,0 % (314.556 / 1.310.720 B) | 26 Okt 2026 | driver sensor + kalibrasi NVS, transport masih stub |
| 2 | `wokwi` | 6,8 % (22.324 / 327.680 B) | 24,7 % (323.468 / 1.310.720 B) | 26 Okt 2026 | idem + PubSubClient + `SENSOR_PROBE`/`CAL_NVS_SELFTEST` |
| 2 | `native` | — | — | 26 Okt 2026 | 30 test PASS (payload + sensors_core + calibration_core) |
| 3 | `esp32dev` | 6,9 % (22.452 / 327.680 B) | 24,5 % (320.984 / 1.310.720 B) | 26 Okt 2026 | + transport LoRa nyata (SX1278), payload nyata |
| 3 | `wokwi` | 14,5 % (47.676 / 327.680 B) | 76,1 % (996.810 / 1.310.720 B) | 26 Okt 2026 | + WiFi + PubSubClient + NTP nyata |
| 3 | `native` | — | — | 26 Okt 2026 | 45 test PASS (payload + sensors_core + calibration_core + transport_core) |
| 4 | `esp32dev` | 6,9 % (22.572 / 327.680 B) | 26,2 % (343.428 / 1.310.720 B) | 27 Okt 2026 | orkestrasi siklus + deep sleep; probe/selftest dihapus |
| 4 | `wokwi` | 14,6 % (47.684 / 327.680 B) | 76,0 % (996.618 / 1.310.720 B) | 27 Okt 2026 | SIM sleep via restart, tanpa probe/selftest |
| 4 | `native` | - | - | 27 Okt 2026 | 45 test PASS (tidak berubah) |

**FASE 4:** Flash fisik naik dari 24,5 % ke 26,2 % karena `esp_sleep`/`esp_system`; build `wokwi` turun tipis ke 76,0 % setelah `SENSOR_PROBE`/`CAL_NVS_SELFTEST` dihapus. Tidak ada dependensi baru.

**Catatan lompatan Flash `wokwi` 24,7 % → 76,1 %.** Bukan regresi kode aplikasi: menautkan WiFi + lwIP + mbedTLS untuk NTP memakan ±670 KB. Batas waspada 80 % karena itu **hampir tersentuh**, dan FASE 4 tidak boleh menambah dependensi baru tanpa memeriksa angka ini. Build fisik 26,2 % setelah FASE 4, tetap jauh di bawah ambang karena tidak membawa tumpukan jaringan.

Ambang waspada: RAM > 60 % atau Flash > 80 % → tinjau dependensi.

### 5.2 Power budget — estimasi vs terukur

Tabel dari `../FIRMWARE_SPEC.md` §3 adalah **estimasi**, bukan pengukuran. Isi kolom terukur di TKT 4.

**FASE 4:** durasi sampling terukur 1,013-1,015 s (3 siklus, `HW-4.3_scenario_fault_range_20261027.txt`). Budget fisik dihitung ulang dengan durasi itu: **0,05673 mAh/siklus** (81 % dari batas 0,07). Arus sensor/LoRa/MCU masih estimasi; rincian di `evidence/HW-4.4_power_budget_20261027.md`. Siklus aktif simulator (11,7-16,8 s) tidak dipakai karena membawa WiFi/NTP/MQTT yang tidak ada di node LoRa.

| Fase | Estimasi dokumen | Terukur (TKT 4) | Metode |
|---|---|---|---|
| Deep sleep | 10 µA | | multimeter mode µA, 10 menit |
| Sensor aktif | 15 mA / 1 s | | USB power meter |
| Transmisi LoRa +17 dBm | 120 mA / 0,5 s | | USB power meter, mode kontinu |
| Overhead komputasi | 80 mA / 1,5 s | | power meter |
| **Total per siklus** | **0,0567 mAh** | | integral arus × waktu |
| **Total per hari** | **5,44 mAh** | | × 96 |

Batas yang tidak boleh dilanggar: **0,07 mAh/siklus** (`../README.md` §2).

### 5.3 Cara mengukur arus siklus nyata (TKT 4)

1. Putus jalur positif baterai, sisipkan multimeter (mode mA) atau INA219.
2. Rekam selama 2 siklus penuh (aktif + tidur).
3. Hitung: `mAh = rata-rata_arus_mA × durasi_jam`.
4. Bandingkan dengan tabel. Selisih > 30 % → investigasi.

**Catatan:** USB power meter tidak bisa mengukur arus tidur µA. Untuk deep sleep wajib multimeter mode µA dengan jalur terpisah (lepas regulator bila memakai bare module).

---

## 6. Daftar Bukti Wajib (Definition of Evidence)

Semua file disimpan di `docs/hardware/evidence/` (folder ini milik domain IoT, aman untuk ditulis).

| # | Bukti | Format | Untuk task |
|---|---|---|---|
| 1 | Build fisik sukses | `build_esp32dev.txt` | HW-1.2 |
| 2 | Build simulasi sukses | `build_wokwi.txt` | HW-1.2 |
| 3 | Unit test lulus | `unit_test_<tgl>.txt` | HW-7.1 |
| 3a | Unit test native (payload + sensors_core) | `unit_test_native_20261026.txt` | HW-3.5 |
| 3b | Unit test native `calibration_core` | `unit_test_native_20261026.txt` (30 test, bagian `[PASSED]`) | HW-2.6 |
| 3c | ADC burst + median di simulator | `HW-2.1_adc_burst_wokwi_20261026.txt` | HW-2.1 |
| 3d | DS18B20 normal + di luar rentang | `HW-2.2_ds18b20_wokwi_20261026.txt` | HW-2.2 |
| 3e | NVS kosong → default + round-trip tulis/baca | `HW-2.6_nvs_selftest_wokwi_20261026.txt` | HW-2.6 |
| 3f | Lint `diagram.json` | `HW-5.1_diagram_lint_20261026.txt` | HW-5.1 |
| 3g | Dua skenario demo jalan di simulator | `HW-5.2_wokwi_scenario_ab_20261026.txt` | HW-5.2 |
| 3h | Short & putus jadi `OUT_OF_RANGE`, bukan 0/100 | `HW-3.1_no_clamp_wokwi_20261026.txt` | HW-3.1 |
| 3i | LoRa: build + isolasi modul (radio belum memancar) | `HW-3.3_lora_transport_20261026.txt` | HW-3.3 |
| 3j | MQTT: topik kontrak, payload 71 B, NTP valid, retry 3× | `HW-3.4_mqtt_transport_20261026.txt` | HW-3.4 |
| 3k | Urutan power gate ON -> OFF -> TX | `HW-4.1_power_gate_20261027.txt` | HW-4.1 |
| 3l | Tidur, wake reason, siklus berikutnya | `HW-4.2_deep_sleep_20261027.txt` | HW-4.2 |
| 3m | Orkestrasi penuh + 6 skenario regresi | `HW-4.3_orchestration_20261027.txt`, `HW-4.3_scenario_*_20261027.txt` | HW-4.3 |
| 3n | Power budget dari durasi terukur | `HW-4.4_power_budget_20261027.md` | HW-4.4 |
| 4 | Payload sampai broker | `I03_mqtt_rx.txt` | HW-5.4 |
| 5 | Hex dump payload | `payload_hexdump.txt` | HW-3.2 |
| 6 | Integrasi ke backend | `I07_backend.png` + `I07_query.txt` | HW-7.2 |
| 7 | Skenario A | `E01_serial.txt`, `E01_mqtt.txt`, `E01_dashboard.png` | HW-7.3 |
| 8 | Skenario B | `E02_*.{txt,png}` | HW-7.3 |
| 9 | Skenario C | `E03_*.{txt,png}` | HW-7.3 |
| 10 | Screenshot rangkaian Wokwi | `wokwi_diagram.png` | HW-8.2 |
| 11 | Video demo | tautan (bukan file besar di repo) | HW-8.1 |
| 12 | Baseline RAM/Flash | terisi di §5.1 | HW-0.5 |

**Aturan ukuran:** jangan commit file > 5 MB. Video disimpan di Google Drive/YouTube (unlisted), repo hanya berisi tautan.

### 6.1 Aturan penamaan bukti

```
<ID_TASK>_<deskripsi>_<YYYYMMDD>.<ext>
contoh: HW-7.3_E01_harian_20261029.txt
```

Alasan: saat juri bertanya "buktinya mana?", Anda bisa langsung mencari berdasarkan ID task.

---

## 7. Pengujian Fisik TKT 4–6 (HW-9.x)

| # | Uji | Prosedur | Kriteria lulus |
|---|---|---|---|
| F-01 | Akurasi kelembaban | 5 sampel tanah dengan kadar air diukur gravimetri | MAE ≤ 5 % VWC |
| F-02 | Akurasi suhu | Bandingkan dengan termometer referensi di air 25 °C & 40 °C | ±0,5 °C |
| F-03 | Akurasi pH | Buffer 4,01 / 6,86 / 9,18 | ±0,15 pH |
| F-04 | Arus deep sleep | multimeter µA, 10 menit | ≤ 1 mA (dev board) / ≤ 15 µA (bare module + LDO) |
| F-05 | Power gate | arus sensor saat GPIO25 LOW | < 1 µA |
| F-06 | Jangkauan LoRa | 5 titik: 100 m, 500 m, 1 km, 2 km, 5 km | RSSI > −110 dBm pada 2 km |
| F-07 | Packet loss | 100 paket pada jarak 1 km | ≥ 90 % diterima |
| F-08 | Ketahanan enclosure | splash test IP65 + 24 jam | tidak ada air masuk, tidak ada kondensasi |
| F-09 | Siklus otonom | 7 hari tanpa intervensi | ≥ 95 % paket/hari terkirim |
| F-10 | Gateway uptime | 7 hari | ≥ 99 %, LWT berfungsi |

Bukti F-06 disimpan sebagai tabel jarak vs RSSI/SNR + screenshot `LoRa.packetRssi()`.

---

## 8. Matriks Ketertelusuran (Task → Test → Bukti)

| Task | Test | Bukti |
|---|---|---|
| HW-2.1 | U-01 … U-06 | #3 |
| HW-2.3 | U-07 … U-13 | #3 |
| HW-2.4 | U-14 … U-22 | #3 |
| HW-2.5 | U-23 … U-25 | #3 |
| HW-3.2 | U-26 … U-33 | #3, #5 |
| HW-3.1 | U-34 … U-45 (range & status per kanal) | #3, #3h |
| HW-3.3 | Build + isolasi objek | #1, #3i |
| HW-3.4 | U-46 … U-53 (retry), I-04 | #2, #3j |
| HW-4.3 | I-01, I-05 | #1, #3 |
| HW-5.4 | I-03 | #4 |
| HW-6.1 | I-04 | #4 |
| HW-7.2 | E2E prasyarat | #6 |
| HW-7.3 | E-01 … E-03 | #7, #8, #9 |
| HW-8.2 | — | #10 |
| HW-8.1 | — | #11 |

---

## 9. Perintah Uji Lengkap (satu blok)

```powershell
# 1. unit test
pio test -e native --project-dir firmware

# 2. build kedua env
pio run -e esp32dev --project-dir firmware
pio run -e wokwi    --project-dir firmware

# 3. broker
mosquitto_sub -h localhost -p 1883 -t "/volatisafe/v1/node/+/telemetry" -v

# 4. simulator (terminal lain)
code simulation\wokwi

# 5. validasi payload yang tertangkap
python simulation\wokwi\validate_payload.py --file docs\hardware\evidence\I03_mqtt_rx.txt
```

> Langkah 5 hanya berfungsi bila file berisi **satu** payload. Untuk banyak payload, ekstrak dulu dengan `Select-String` atau tambahkan mode `--lines` pada validator.

---

## 10. Yang Bukan Tanggung Jawab Uji IoT

Jangan menguji (dan jangan mengklaim) hal berikut — itu domain lain:

| Hal | Pemilik |
|---|---|
| Akurasi AVRI terhadap emisi amonia aktual | AI Engine (Aris) |
| Kebenaran neraca air FAO-56 | Digital Twin (Andharu) |
| Query TimescaleDB & migrasi | Backend (Syifa) |
| Render dashboard & PWA offline | Frontend (Syifa) |
| Tingkat keberhasilan alert WhatsApp | Backend (Syifa) |

Yang boleh Anda lakukan: **memastikan data masuk** ke sistem mereka. Setelah itu serahkan.
