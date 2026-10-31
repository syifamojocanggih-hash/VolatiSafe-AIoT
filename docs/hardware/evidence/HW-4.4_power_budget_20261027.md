# HW-4.4 - Verifikasi power budget

Tanggal : 27 Okt 2026
Sumber durasi : log Serial `[PWR] sampling ... ms` dan
                `[PWR] sampling ..., siklus aktif ... ms`
Log     : docs/hardware/evidence/HW-4.3_scenario_fault_range_20261027.txt

## Durasi terukur di simulator

| Komponen | Terukur | Catatan |
|---|---|---|
| Sampling (gate ON + ADC 2 kanal + DS18B20) | 1.013-1.015 s | konsisten di 3 siklus |
| Siklus aktif simulator | 11.668-16.767 s | termasuk WiFi, NTP, MQTT connect timeout; **bukan** angka fisik |

Angka siklus aktif simulator tidak dipakai untuk budget: build Wokwi membawa
WiFi + NTP + percobaan MQTT yang tidak ada di node LoRa.

## Perhitungan budget fisik

Arus per komponen masih memakai estimasi `07_TEST_PLAN.md` 5.2 karena hardware
belum ada. Yang sudah terukur adalah durasi sampling.

| Komponen | Arus (estimasi) | Durasi | mAh |
|---|---|---|---|
| Deep sleep | 10 uA | 900 s | 0.00250 |
| Sensor aktif | 15 mA | 1.015 s | 0.00423 |
| Transmisi LoRa +17 dBm | 120 mA | 0.5 s | 0.01667 |
| Overhead komputasi (MCU, encode) | 80 mA | 1.5 s | 0.03333 |
| **Total per siklus** | | | **0.05673** |

Batas: **0.07 mAh/siklus** (`docs/hardware/README.md` 2).
Total 0.05673 mAh = **81 % dari batas**, sisa margin 19 %.

Per hari (96 siklus): 0.05673 x 96 = **5.45 mAh/hari**.

## Batas bukti

- Durasi sampling terukur; arus sensor/LoRa/MCU masih estimasi dokumen.
- Arus deep sleep 10 uA **tidak realistis** di dev board dengan regulator +
  CP2102. Klaim otonomi baterai 477 hari karena itu tidak boleh dipakai
  (DEC-IOT-05, E-06). Angka di atas adalah target desain, bukan janji lapangan.
- Pengukuran arus nyata (F-04, F-05) dijadwalkan HW-9.1.
