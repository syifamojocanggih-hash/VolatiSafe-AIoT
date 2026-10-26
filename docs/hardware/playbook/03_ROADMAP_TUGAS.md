# 03_ROADMAP_TUGAS.md — Rencana Kerja IoT Berurutan

> **Peran dokumen:** `TASK_GUIDE.md` menyebut 5 tahap besar. Dokumen ini memecahnya menjadi **46 task atomik** (40 untuk TKT 3, 6 untuk TKT 4–6) dengan ID, dependensi, estimasi, output, dan kriteria terima, dari kondisi repo hari ini (`main.cpp` skeleton) sampai PR ke `Development`.
> **Estimasi** = jam kerja fokus, bukan jam kalender.

---

## 1. Peta Fase

| Fase | Nama | Task | Estimasi | Target Hari (TKT 3) |
|---|---|---|---|---|
| 0 | Lingkungan & Repo Hygiene | HW-0.1 … HW-0.5 | 2,5 j | 26 Okt |
| 1 | Skeleton Firmware & Build Ganda | HW-1.1 … HW-1.4 | 4 j | 26 Okt |
| 2 | Driver Sensor & Kalibrasi | HW-2.1 … HW-2.7 | 6,5 j | 27 Okt |
| 3 | Payload & Transport | HW-3.1 … HW-3.5 | 5,5 j | 27 Okt |
| 4 | Power Management | HW-4.1 … HW-4.4 | 3 j | 28 Okt |
| 5 | Wokwi Testbed | HW-5.1 … HW-5.4 | 4 j | 28 Okt |
| 6 | Gateway & MQTT | HW-6.1 … HW-6.3 | 3 j | 29 Okt |
| 7 | Uji & Bukti | HW-7.1 … HW-7.4 | 4 j | 29 Okt |
| 8 | Demo & Handover | HW-8.1 … HW-8.4 | 3 j | 30 Okt |
| 9 | TKT 4–6 Fisik | HW-9.1 … HW-9.6 | — | Bulan 1–12 |
| | **TOTAL TKT 3** | **40 task** | **±35,5 j** | |

**Realitas:** 35,5 jam dalam 4 hari efektif = ±9 jam/hari. Ini padat. Lihat §10 untuk jalur kritis dan apa yang boleh dipotong bila waktu mepet.

---

## 2. Jalur Kritis (Critical Path)

Task yang **tidak boleh telat**, karena semua yang lain bergantung padanya:

```
HW-0.1 ─┬─> HW-1.2 ─> HW-1.3 ─┬─> HW-2.1 ─> HW-2.3 ─┐
        │                      ├─> HW-3.2 ───────────┼─> HW-4.3 ─> HW-5.4 ─> HW-7.2 ─> HW-8.4
        │                      └─> HW-3.4 ───────────┘                ▲
        └─> HW-0.2 ─────────────────────> HW-5.1 ─> HW-5.2 ──────────┘
        └─> HW-0.3 ─────────────────────> HW-6.1 ─> HW-7.2
```

Kalau waktu habis, **prioritas bertahan**: HW-0.1 → HW-1.3 → HW-2.1/2.3 → HW-3.2 → HW-3.4 → HW-4.3 → HW-5.1/5.2 → HW-7.2 → HW-8.2.

---

## 3. FASE 0 — Lingkungan & Repo Hygiene

### HW-0.1 — Unduh packages ESP32 + library
| | |
|---|---|
| **Dependensi** | — |
| **Estimasi** | 30 menit (mayoritas waktu tunggu unduhan) |
| **Input** | `firmware/platformio.ini` yang sudah ada |
| **Output** | `~/.platformio/packages` terisi; build pertama `SUCCESS` |
| **Baca** | [`01_SETUP_LINGKUNGAN.md`](01_SETUP_LINGKUNGAN.md) §2 |
| **DoD** | `pio run --project-dir firmware` berakhir `[SUCCESS]`; jumlah entri packages > 0 |

### HW-0.2 — Aktifkan lisensi Wokwi CLI
| | |
|---|---|
| **Dependensi** | — |
| **Estimasi** | 20 menit |
| **Output** | File lisensi di `~/.wokwi`; `wokwi-cli --version` merespons |
| **Baca** | 01 §3 |
| **DoD** | Lisensi aktif; **tidak** ada file lisensi/token ter-commit di repo |

### HW-0.3 — Broker MQTT lokal
| | |
|---|---|
| **Dependensi** | Docker berjalan (sudah terpasang) |
| **Estimasi** | 30 menit |
| **Output** | Mosquitto di `localhost:1883`; uji pub/sub berhasil |
| **Baca** | 01 §4 |
| **DoD** | Subscriber menerima payload uji; topik diawali garis miring `/volatisafe/v1/...` |

### HW-0.4 — Eskalasi `.gitignore`
| | |
|---|---|
| **Dependensi** | — |
| **Estimasi** | 10 menit |
| **Output** | Permintaan ke Aris/Syifa; sementara itu disiplin `git add <path>` eksplisit |
| **Baca** | 01 §5 |
| **DoD** | `git status` tidak pernah menampilkan `firmware/.pio/` sebagai sesuatu yang akan di-stage |

### HW-0.5 — Pin versi & baseline build
| | |
|---|---|
| **Dependensi** | HW-0.1 |
| **Estimasi** | 20 menit |
| **Output** | `platform = espressif32@8.0.0`; `firmware/package-lock.json`; angka RAM/Flash baseline |
| **Baca** | 01 §6 |
| **DoD** | Baseline tercatat di [`07_TEST_PLAN.md`](07_TEST_PLAN.md) §5 |

---

## 4. FASE 1 — Skeleton Firmware & Build Ganda

### HW-1.1 — Restrukturisasi `firmware/`
| | |
|---|---|
| **Dependensi** | HW-0.1 |
| **Estimasi** | 2 jam |
| **Output** | Struktur di bawah ini, semua file kosong-bertanda-tangan (stub) tapi **kompilasi lulus** |
| **DoD** | `pio run -e esp32dev` sukses dengan modul baru ter-*include* |

Target struktur:

```
firmware/
├── platformio.ini
├── include/
│   ├── config.h          (sudah ada — tambah guard #ifndef NODE_ID)
│   ├── types.h           (baru — TelemetryFrame, SensorStatus)
│   ├── sensors.h         (baru)
│   ├── payload.h         (baru)
│   ├── transport.h       (baru — antarmuka abstrak)
│   ├── power_mgmt.h      (baru)
│   └── calibration.h     (baru)
└── src/
    ├── main.cpp          (orkestrasi saja)
    ├── sensors.cpp
    ├── payload.cpp
    ├── transport_lora.cpp
    ├── transport_mqtt.cpp
    ├── power_mgmt.cpp
    └── calibration.cpp
```

Aturan: `main.cpp` tidak boleh berisi logika sensor/kalibrasi/radio. Hanya urutan siklus. Alasannya — paritas Wokwi vs fisik hanya bisa dijaga bila yang berbeda benar-benar terisolasi di `transport_*.cpp`.

### HW-1.2 — Dual environment
| | |
|---|---|
| **Dependensi** | HW-1.1 |
| **Estimasi** | 45 menit |
| **Output** | `[env:esp32dev]` dan `[env:wokwi]`; keduanya build sukses |
| **Baca** | [`04_FIRMWARE_CORE.md`](04_FIRMWARE_CORE.md) §2 |
| **DoD** | `pio run -e esp32dev` dan `pio run -e wokwi` sama-sama `SUCCESS` |

### HW-1.3 — Kontrak internal `TelemetryFrame`
| | |
|---|---|
| **Dependensi** | HW-1.1 |
| **Estimasi** | 45 menit |
| **Output** | `types.h` + `sensors.h` mendefinisikan struct yang menjadi satu-satunya bentuk data antar-modul |
| **DoD** | Tidak ada `float` telanjang berpasangan yang berpindah antar-modul; semua lewat `TelemetryFrame` |

### HW-1.4 — Skrip build matrix
| | |
|---|---|
| **Dependensi** | HW-1.2 |
| **Estimasi** | 30 menit |
| **Output** | `firmware/build_all.ps1` (atau task PlatformIO) yang build kedua env berurutan dan gagal bila salah satu gagal |
| **DoD** | Satu perintah memverifikasi kedua env |

---

## 5. FASE 2 — Driver Sensor & Kalibrasi

### HW-2.1 — ADC + burst sampling median 5×
| | |
|---|---|
| **Dependensi** | HW-1.3 |
| **Estimasi** | 1,5 jam |
| **Output** | `sensors_readAdcMedian(uint8_t pin)` di `sensors.cpp` |
| **Spesifikasi** | `analogSetAttenuation(ADC_11db)`; 5 sampel, jeda 50 ms; buang min & max; rata-rata 3 sisanya (median-average, sesuai `TASK_GUIDE.md` HW-1.2) |
| **DoD** | Unit test: input `{1000, 1000, 1000, 1000, 4095}` → hasil 1000 (spike tunggal terbuang) |

> **Catatan penting:** `TASK_GUIDE.md` menyebut "median-average" (buang min/max, rata-rata 3 tengah), sedangkan `FIRMWARE_SPEC.md` §1 menyebut "Median". Keduanya berbeda untuk input seperti `{100, 3000, 1000, 1100, 1200}`. Pilih **median-average** (lebih tahan dua outlier) dan tulis alasannya di `DEC-IOT-06`.

### HW-2.2 — Driver DS18B20
| | |
|---|---|
| **Dependensi** | HW-1.3 |
| **Estimasi** | 1 jam |
| **Output** | `sensors_readSoilTemp()` |
| **Spesifikasi** | `OneWire` + `DallasTemperature`; `setResolution(11)` (±0,125 °C, cukup & lebih cepat); konversi non-blocking bila memungkinkan |
| **DoD** | Nilai `-127 °C` → `TEMP_ERROR_FLAG` (−999); nilai di luar −10…60 → flag error; nilai normal lolos |

### HW-2.3 — Konversi moisture ke % VWC
| | |
|---|---|
| **Dependensi** | HW-2.1 |
| **Estimasi** | 45 menit |
| **Output** | `moisture_pct` |
| **Rumus** | `(dryADC - median) / (dryADC - wetADC) * 100`, lalu `constrain(0, 100)` |
| **DoD** | Input ADC ≥ dryADC → 0,0; ADC ≤ wetADC → 100,0; tidak pernah NaN/negatif |

### HW-2.4 — pH + kompensasi kelembaban
| | |
|---|---|
| **Dependensi** | HW-2.1, HW-2.3 |
| **Estimasi** | 45 menit |
| **Output** | `ph_raw`, `ph_corrected` |
| **Rumus** | `ph_raw = 7.0 - (median - phNeutralAdc)/phSlope`; `ph_corrected = ph_raw + 0.15*(50-moisture)/50`; constrain 3,0–10,0 |
| **DoD** | Unit test: `moisture=50` → koreksi 0; `moisture=0` → +0,15; `moisture=100` → −0,15 |

### HW-2.5 — Baterai via divider
| | |
|---|---|
| **Dependensi** | HW-2.1 |
| **Estimasi** | 45 menit |
| **Output** | `battery_v` |
| **Rumus** | `adcMedian / 4095.0 * 3.3 * BATTERY_DIVIDER` — rata-rata 3 pembacaan (bukan 5×50 ms; cukup) |
| **DoD** | Simulasi ADC 2402 → ±3,87 V |

### HW-2.6 — Kalibrasi NVS + fallback
| | |
|---|---|
| **Dependensi** | HW-2.3, HW-2.4 |
| **Estimasi** | 1,5 jam |
| **Output** | `calibration_load()` / `calibration_save()` di `calibration.cpp` |
| **Spesifikasi** | `Preferences` (NVS). Key: `m_dry`, `m_wet`, `ph_n`, `ph_s`. Bila tidak ada → pakai `config.h` default **dan cetak peringatan** `[CAL] using compile-time defaults` |
| **DoD** | Hapus NVS (`pio run -t erase`) → firmware tetap jalan dengan default + peringatan; simpan NVS → nilai bertahan setelah reboot |

### HW-2.7 — Mode kalibrasi 2 titik via Serial (TKT 4)
| | |
|---|---|
| **Dependensi** | HW-2.6 |
| **Estimasi** | 45 menit |
| **Status TKT 3** | ➖ ditunda |
| **Output** | Perintah Serial `CAL MOIST`, `CAL SET <key> <value>`, `CAL SHOW`, `CAL RESET` |
| **Baca** | [`02_HARDWARE_BOM.md`](02_HARDWARE_BOM.md) §8 |
| **DoD** | Prosedur §8.1 & §8.2 bisa dijalankan tanpa recompile |

---

## 6. FASE 3 — Payload & Transport

### HW-3.1 — Validasi rentang lokal
| | |
|---|---|
| **Dependensi** | HW-1.3 |
| **Estimasi** | 1 jam |
| **Output** | `TelemetryFrame` selalu dalam batas fisik sebelum dikirim |
| **DoD** | Nilai di luar batas **tidak** dikirim mentah; ditandai status dan dikirim dengan flag agar backend bisa menolak (bukan dipalsukan) |

> **Koreksi 26 Okt 2026:** kontrak payload hanya punya enam key (`n, ts, m, t, ph, b`), jadi **tidak ada tempat untuk flag**. DoD di atas karena itu tidak bisa dicapai persis seperti tertulis. Yang dicapai: nilai rusak dikirim **apa adanya** (tidak di-clamp) sehingga jatuh di luar batas kontrak, dan backend menolaknya lewat `validate_sensor_bounds()`. Status per kanal tetap ada di `TelemetryFrame` untuk logging dan untuk keputusan lokal, tetapi tidak melintas ke jaringan. Usulan menambah field status per kanal dieskalasi ke Syifa (lihat `DEC-IOT-18`).

> **Perhatikan:** backend punya `validate_sensor_bounds()` ([`../../backend/INGESTION_PIPELINE.md`](../../backend/INGESTION_PIPELINE.md) §2). Jangan men-*clamp* nilai rusak menjadi nilai valid — itu menyembunyikan kerusakan sensor dan membuat data palsu lolos gate. Biarkan nilai asli terkirim dengan penanda; backend yang memutuskan.

Catatan implementasi 26 Okt 2026 (FASE 2 selesai): HW-2.1, 2.2, 2.3, 2.4, 2.5 sudah final dan terverifikasi di simulator. Fungsi murni ada di `sensors_core.cpp`, I/O di `sensors.cpp`, kalibrasi murni di `calibration_core.cpp`, I/O NVS di `calibration.cpp`. Total 30 unit test native PASS. Bukti runtime: `evidence/HW-2.1_adc_burst_wokwi_20261026.txt`, `evidence/HW-2.2_ds18b20_wokwi_20261026.txt`, `evidence/HW-2.6_nvs_selftest_wokwi_20261026.txt`.

Penyimpangan dari tabel di atas (detail di `DEC-IOT-17`): DS18B20 memakai konversi blocking 375 ms, bukan non-blocking; `sensors_sampleAll()` menerima `(TelemetryFrame&, const Calibration&)`; `calibration_begin(Calibration&)` memakai parameter keluaran. HW-5.1/5.2 ditarik ke FASE 2, HW-2.7 tetap `➖`.

### HW-3.2 — Encoder JSON + ukur panjang
| | |
|---|---|
| **Dependensi** | HW-3.1 |
| **Estimasi** | 1,5 jam |
| **Output** | `payload_encode(const TelemetryFrame&, char* buf, size_t cap)` di `payload.cpp` |
| **Spesifikasi** | `ArduinoJson` dengan `StaticJsonDocument`/`JsonDocument` berbuffer tetap; key persis `n, ts, m, t, ph, b`; tanpa spasi; 1 desimal untuk `m` & `t`, 2 desimal untuk `ph` & `b` |
| **DoD** | Panjang terukur ≤ 88 byte (lihat DEC-IOT-02); nilai dibulatkan sesuai kontrak; tidak ada alokasi dinamis saat runtime |

### HW-3.3 — `transport_lora.cpp`
| | |
|---|---|
| **Dependensi** | HW-3.2 |
| **Estimasi** | 2 jam |
| **Output** | `transport_init()`, `transport_send()` untuk build fisik |
| **Spesifikasi** | SX1278 433 MHz, SF7, BW 125 kHz, CR 4/5, `setTxPower(17)`; `beginPacket` → `write` → `endPacket`; retry maks 3× jeda 2 s; `sleep()` sebelum deep sleep |
| **DoD** | Build `esp32dev` lulus; panggilan terisolasi di balik `#if TRANSPORT_LORA`; tidak ada kode LoRa bocor ke `main.cpp` |

### HW-3.4 — `transport_mqtt.cpp`
| | |
|---|---|
| **Dependensi** | HW-3.2 |
| **Estimasi** | 1,5 jam |
| **Output** | Implementasi antarmuka yang sama untuk build Wokwi |
| **Spesifikasi** | WiFi + `PubSubClient`; topik `/volatisafe/v1/node/{NODE_ID}/telemetry`; QoS 0; timeout koneksi 10 s; publish → `client.connected()` |
| **DoD** | Build `wokwi` lulus; topik **persis** sama dengan kontrak `INTERFACES.md` §1.1 |

### HW-3.5 — Unit test payload (env `native`)
| | |
|---|---|
| **Dependensi** | HW-3.2 |
| **Estimasi** | 1 jam |
| **Output** | `[env:native]` di `platformio.ini` + `test/test_payload/test_main.cpp` (Unity) |
| **DoD** | Test memverifikasi: urutan key, jumlah desimal, panjang, nilai batas (0/100 °C, pH 3,0/10,0), dan `TEMP_ERROR_FLAG` |

> Kenapa `native`: logika encoder tidak butuh hardware. Menjalankannya di PC = tes dalam <1 detik, bisa dijalankan tiap commit.

Catatan implementasi 26 Okt 2026 (FASE 3 selesai): HW-3.1, 3.2, 3.3, 3.4, 3.5 selesai. Bukti: `evidence/HW-3.1_no_clamp_wokwi_20261026.txt`, `evidence/HW-3.3_lora_transport_20261026.txt`, `evidence/HW-3.4_mqtt_transport_20261026.txt`, `evidence/unit_test_native_20261026.txt` (45 test PASS), `evidence/build_esp32dev.txt`, `evidence/build_wokwi.txt`.

Penyimpangan dari tabel di atas (detail di `DEC-IOT-18` dan `DEC-IOT-19`):

1. **HW-3.1 tidak meng-clamp.** Clamp dibuang seluruhnya: nilai rusak dikirim apa adanya dan ditandai `SENSOR_OUT_OF_RANGE`, karena clamp mengubah sensor short/putus menjadi `m=100.0`/`m=0.0` yang lolos gate backend. Sentinel `-999` dipakai untuk kerusakan kalibrasi.
2. **HW-3.3 lulus di level build, bukan radio.** Wokwi tidak punya part SX1278 dan hardware belum ada, jadi tidak ada paket LoRa yang benar-benar dipancarkan. Klaim "radio terbukti" ditunda ke HW-9.3, dan itu dinyatakan di evidence, bukan disembunyikan.
3. **HW-3.4 lulus tanpa bukti sampai broker.** `wokwi-cli` memakai gateway publik Wokwi yang tidak bisa menjangkau jaringan lokal, sehingga Mosquitto di mesin ini tidak terjangkau. I-03 tetap menjadi DoD HW-5.4.
4. **Retry dipindah ke `transport_core.cpp`.** Kedua transport memanggil `transport_retry()` yang sama, sehingga aturan jeda tidak bisa menyimpang antar build dan bisa diuji di `env:native` (8 kasus).
5. **Estimasi aktual:** FASE 3 memakan ±4 jam, di bawah estimasi 5,5 jam. Yang paling banyak menghabiskan waktu bukan kode, melainkan membuktikan jalur MQTT sampai broker (lihat butir 3).

---

## 7. FASE 4 — Power Management

### HW-4.1 — Sequencing power gate
| | |
|---|---|
| **Dependensi** | HW-2.1 |
| **Estimasi** | 45 menit |
| **Output** | `sensorPowerOn()` / `sensorPowerOff()` |
| **Spesifikasi** | `HIGH` → `delay(SENSOR_WARMUP_MS)` (200 ms) → sampling; setelah selesai `LOW` |
| **DoD** | GPIO25 `LOW` saat boot (sebelum inisialisasi apa pun); `LOW` kembali **sebelum** transmisi |

> Urutan penting: matikan sensor **sebelum** TX LoRa. LoRa menarik 120 mA; menyalakan sensor bersamaan menambah beban puncak baterai dan menurunkan tegangan di bawah ambang brownout.

### HW-4.2 — Deep sleep + radio off
| | |
|---|---|
| **Dependensi** | HW-4.1 |
| **Estimasi** | 45 menit |
| **Output** | `power_enterDeepSleep()` |
| **Spesifikasi** | `esp_sleep_enable_timer_wakeup(SLEEP_DURATION_US)`; `WiFi.mode(WIFI_OFF)` + `btStop()` hanya pada build fisik; pada build MQTT: `client.disconnect()` lalu `WiFi.disconnect(true)` |
| **DoD** | Serial mencetak alasan wakeup; pada build Wokwi siklus tidak menggantung (lihat HW-5.3 flag `SIM_FAST_CYCLE`) |

### HW-4.3 — Orkestrasi siklus di `main.cpp`
| | |
|---|---|
| **Dependensi** | HW-2.x, HW-3.x, HW-4.2 |
| **Estimasi** | 1 jam |
| **Output** | `setup()` + `loop()` yang menjalankan satu siklus lengkap |
| **DoD** | Urutan persis: init → sensor ON → sample → sensor OFF → kalibrasi/filter → encode → TX → sleep. Tidak ada `delay` total > 3,5 s selain sleep |

### HW-4.4 — Verifikasi power budget
| | |
|---|---|
| **Dependensi** | HW-4.3 |
| **Estimasi** | 30 menit |
| **Output** | Tabel estimasi terbaru berdasarkan durasi **terukur** dari log millis, bukan asumsi dokumen |
| **DoD** | Total per siklus ≤ 0,07 mAh (batas di `../README.md` §2) atau penyimpangan dicatat sebagai risiko |

---

## 8. FASE 5 — Wokwi Testbed

### HW-5.1 — `diagram.json`
| | |
|---|---|
| **Dependensi** | HW-0.2 |
| **Estimasi** | 1,5 jam |
| **Output** | `simulation/wokwi/diagram.json` |
| **Baca** | [`05_WOKWI_SIMULASI.md`](05_WOKWI_SIMULASI.md) §3 |
| **DoD** | ESP32 + potensiometer ×2 + DS18B20 + resistor 4,7 kΩ + OLED (opsional) ter-wire sesuai tabel pinout; Wokwi membuka tanpa error |

### HW-5.2 — `wokwi.toml` + wiring build
| | |
|---|---|
| **Dependensi** | HW-1.2, HW-5.1 |
| **Estimasi** | 45 menit |
| **Output** | `simulation/wokwi/wokwi.toml` menunjuk ke `firmware/.pio/build/wokwi/firmware.elf` |
| **DoD** | `wokwi-cli` atau ekstensi VS Code menjalankan firmware hasil `[env:wokwi]` |

### HW-5.3 — Verifikasi paritas & flag simulasi
| | |
|---|---|
| **Dependensi** | HW-5.2 |
| **Estimasi** | 1 jam |
| **Output** | Dua flag build `SIM_FAST_CYCLE` dan `TRANSPORT_MQTT` aktif hanya di `[env:wokwi]` |
| **DoD** | `diff` menunjukkan satu-satunya perbedaan fisik vs Wokwi adalah `platformio.ini` + `transport_*.cpp`; `sensors.cpp` dan `payload.cpp` identik byte-per-byte |

### HW-5.4 — Telemetri sampai Mosquitto
| | |
|---|---|
| **Dependensi** | HW-5.3, HW-0.3 |
| **Estimasi** | 45 menit |
| **Output** | Payload dari Wokwi muncul di `mosquitto_sub` |
| **DoD** | 5 paket berturut-turut diterima; `ts` naik monoton; tidak ada paket kosong |

---

## 9. FASE 6 — Gateway & MQTT

### HW-6.1 — Topik & QoS sesuai kontrak
| | |
|---|---|
| **Dependensi** | HW-3.4, HW-0.3 |
| **Estimasi** | 1 jam |
| **Output** | Verifikasi topik, QoS, dan *retain* |
| **Baca** | [`06_GATEWAY_MQTT.md`](06_GATEWAY_MQTT.md) §2 |
| **DoD** | Topik `< 64` karakter (batas internal PubSubClient); QoS 0; `retain=false` |

### HW-6.2 — Uji ACL adapter (lintas domain)
| | |
|---|---|
| **Dependensi** | HW-6.1, backend Syifa siap |
| **Estimasi** | 1 jam |
| **Output** | `lora_adapter.unpack_lora_payload()` menerima payload kita tanpa error |
| **DoD** | Hasil unpack: `moisture_pct`, `soil_temp_c`, `ph`, `battery_voltage` sama dengan yang dikirim (setelah pembulatan); **file milik Syifa — jangan diedit** |

### HW-6.3 — Gateway LoRa RX fisik (TKT 4)
| | |
|---|---|
| **Dependensi** | HW-9.1 |
| **Estimasi** | 1 jam |
| **Status TKT 3** | ➖ ditunda |
| **Output** | Firmware gateway: SX1278 RX → parse JSON → publish MQTT |
| **DoD** | RSSI & SNR ter-inject ke payload bersih sesuai `INTERFACES.md` §1.3 |

---

## 10. FASE 7 — Uji & Bukti

### HW-7.1 — Unit test lulus
| **Dependensi** | HW-3.5, HW-2.x | **Estimasi** | 1 jam |
|---|---|---|---|
| **DoD** | `pio test -e native` semua PASS; hasil disimpan di `docs/hardware/evidence/` |

### HW-7.2 — Integrasi Wokwi → MQTT → backend
| **Dependensi** | HW-5.4, HW-6.2 | **Estimasi** | 1,5 jam |
|---|---|---|---|
| **DoD** | Data muncul di TimescaleDB / endpoint `GET /api/v1/nodes/{id}/telemetry` — **bukti berupa screenshot + query SQL dari Syifa** |

### HW-7.3 — Skenario A/B/C
| **Dependensi** | HW-7.2 | **Estimasi** | 1 jam |
|---|---|---|---|
| **DoD** | Tiga skenario di [`05_WOKWI_SIMULASI.md`](05_WOKWI_SIMULASI.md) §5 dijalankan; respons sistem sesuai `../WOKWI_SIMULATION.md` §3 |

### HW-7.4 — Arsip bukti
| **Dependensi** | HW-7.1…7.3 | **Estimasi** | 30 menit |
|---|---|---|---|
| **DoD** | Semua bukti di [`07_TEST_PLAN.md`](07_TEST_PLAN.md) §6 ada dan dapat dibuka |

---

## 11. FASE 8 — Demo & Handover

### HW-8.1 — Video demo 2 menit
| **Dependensi** | HW-7.3 | **Estimasi** | 1,5 jam |
|---|---|---|---|
| **Baca** | [`08_DEMO_RUNBOOK.md`](08_DEMO_RUNBOOK.md) | | |
| **DoD** | Video menunjukkan Wokwi berjalan + dashboard menerima data + 3 skenario |

### HW-8.2 — Screenshot + link Wokwi
| **Dependensi** | HW-7.3 | **Estimasi** | 30 menit |
|---|---|---|---|
| **DoD** | Link proyek Wokwi dapat dibuka orang lain (tidak private) atau file `.json` siap diunggah; screenshot rangkaian resolusi tinggi |

### HW-8.3 — Paket serah terima ke Syifa
| **Dependensi** | HW-8.2 | **Estimasi** | 30 menit |
|---|---|---|---|
| **DoD** | Dokumen berisi: topik MQTT, contoh payload nyata (hex + JSON), Node ID yang dipakai, skrip uji, cara menjalankan | | |

### HW-8.4 — PR `iot` → `Development`
| **Dependensi** | HW-8.1…8.3 | **Estimasi** | 30 menit |
|---|---|---|---|
| **Baca** | [`10_DEFINISI_SELESAI.md`](10_DEFINISI_SELESAI.md) §3 | | |
| **DoD** | Checklist `GIT_WORKFLOW.md` §5.1 centang semua; tidak ada file di luar `firmware/`, `simulation/wokwi/`, `docs/hardware/` | | |

---

## 12. FASE 9 — TKT 4–6 (Ringkas, Pasca-Insentif)

| ID | Task | Bulan | Output | DoD |
|---|---|---|---|---|
| HW-9.1 | Pengadaan 1 unit prototipe (termasuk komponen pendukung BoM #12–#17) | 1 | Barang diterima | Semua komponen §2.1 ada |
| HW-9.2 | Kalibrasi lab pH 2 titik + verifikasi titik ketiga | 2 | Nilai kalibrasi per unit di NVS | Toleransi ±0,15 pH |
| HW-9.3 | Uji jangkauan LoRa terbuka, 5 titik jarak | 3 | Tabel RSSI/SNR vs jarak | RSSI > −110 dBm pada 2 km (minimum); catat jarak maksimum |
| HW-9.4 | Fabrikasi PCB + enclosure IP65 | 2–3 | Board terakit | Lulus uji cebur (splash), tidak ada kondensasi 24 jam |
| HW-9.5 | Deployment gateway di lokasi mitra | 4 | Gateway online 7 hari berturut | Uptime ≥ 99%, LWT berfungsi |
| HW-9.6 | Validasi lapangan 2 siklus tanam | 5–12 | Data petak presisi vs kontrol | Penghematan urea ≥ 20% |

Detail fisik: [`02_HARDWARE_BOM.md`](02_HARDWARE_BOM.md). Detail uji: [`07_TEST_PLAN.md`](07_TEST_PLAN.md) §7.

---

## 13. Rencana Harian TKT 3

| Hari | Fokus | Task | Luaran |
|---|---|---|---|
| **26 Okt** | Fondasi | HW-0.1 … HW-1.4 | Dua env build sukses, modul terpisah |
| **27 Okt** | Data | HW-2.1 … HW-3.5 | Sensor terkalibrasi, payload teruji, dua transport |
| **28 Okt** | Daya + Simulasi | HW-4.1 … HW-5.4 | Siklus lengkap jalan di Wokwi, data sampai Mosquitto |
| **29 Okt** | Integrasi | HW-6.1, HW-6.2, HW-7.1 … HW-7.4 | Bukti integrasi + 3 skenario |
| **30 Okt** | Demo | HW-8.1 … HW-8.4 | Video, screenshot, PR, handover |
| **31 Okt** | Buffer | — | Submit proposal |

---

## 14. Apa yang Boleh Dipotong Bila Waktu Mepet

Urutan pemotongan (dari paling aman dipotong):

| Prioritas potong | Task | Konsekuensi |
|---|---|---|
| 1 | HW-2.7 (mode kalibrasi Serial) | Sudah `➖` untuk TKT 3 |
| 2 | HW-3.5 (unit test native) | Risiko regresi encoder; ganti dengan verifikasi manual sekali |
| 3 | HW-2.6 (NVS) | Kalibrasi hardcode dulu; **wajib** dikerjakan di TKT 4 |
| 4 | HW-2.5 (baterai) | Kirim nilai placeholder → **jangan**, backend akan menolak lewat bounds check |
| 5 | HW-6.1 verifikasi topik | Tidak boleh dipotong — mismatch topik = integrasi gagal |
| 6 | HW-4.4 (verifikasi daya) | Boleh; klaim daya tetap dari dokumen dengan label "estimasi" |

**Yang tidak boleh dipotong:** HW-3.2 (payload), HW-3.4 (transport MQTT), HW-4.3 (orkestrasi), HW-5.4 (data sampai broker), HW-7.2 (bukti integrasi).

---

## 15. Mapping ke Dokumen Lain

| Fase | Spesifikasi teknis | Uji | Bukti |
|---|---|---|---|
| 0 | 01 | 07 §4 | 07 §6 |
| 1 | 04 §2 | 07 §2 | — |
| 2 | 04 §3 | 07 §3 | 07 §6 |
| 3 | 04 §4 | 07 §3 | 07 §6 |
| 4 | 04 §5 | 07 §5 | 07 §6 |
| 5 | 05 | 07 §4 | 08 §3 |
| 6 | 06 | 07 §4 | 07 §6 |
| 7 | 07 | 07 | 07 §6 |
| 8 | 08 | — | 08 |
| 9 | 02 | 07 §7 | 10 §5 |
