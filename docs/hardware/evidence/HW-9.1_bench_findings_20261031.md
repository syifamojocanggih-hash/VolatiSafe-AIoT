# HW-9.1 - Uji bench fisik node ESP32

Tanggal : 31 Okt 2026
Status  : Sebagian lulus. Kalibrasi moisture dan deteksi SD perlu tindak lanjut.

## 1. Setup

| Item | Nilai |
|---|---|
| Board | ESP32-WROOM-32D, USB-UART CP210x |
| Port | COM5 |
| Environment | `esp32dev`, FW 1.0.0 |
| Node ID | `VS-A1-003` |
| Sensor terpasang | Capacitive moisture (GPIO34), DS18B20 (GPIO4, pull-up internal) |
| Storage | Modul microSD (CS5, SCK18, MISO19, MOSI23) |
| Belum terpasang | pH (`PH_ONBOARD=0`), divider baterai (`BATTERY_ONBOARD=0`) |
| Jaringan | Placeholder `GANTI_SSID` / `GANTI_PASS`, broker tidak dijalankan |

## 2. Hasil

| Pemeriksaan | Hasil | Status |
|---|---|---|
| Boot dan wake reason | `wake: power-on/reset` | Lulus |
| Kalibrasi NVS | `NVS kosong`, memakai default `2800/1350` | Lulus |
| DS18B20 | 1 device, `t=23.62C(OK)` | Lulus |
| ADC moisture | `3165` stabil (`3162..3170`) | Terukur |
| Konversi moisture | `-25.2%(RANGE)` | Gagal kalibrasi |
| pH | `7.00(N/A)` placeholder | Sesuai desain |
| Baterai | `3.87V(N/A)` placeholder | Sesuai desain |
| Deteksi SD | `[SD] tidak ada kartu` | Gagal deteksi |
| Payload | 63 byte, urutan key sesuai kontrak | Lulus |
| TX MQTT | `GAGAL ok=0 attempts=3` | Sesuai dugaan |
| Durasi sampling | 729 ms | Lulus |
| Siklus aktif | 24.871 ms (termasuk timeout WiFi dan retry) | Terukur |
| Tidur | 900 detik | Lulus |
| RAM / Flash | 14,6% / 81,6% | Flash di atas ambang 80% |

Log Serial lengkap: `HW-9.1_serial_20261031.txt`.

## 3. Temuan

1. **Kalibrasi moisture tidak cocok dengan probe.** Pembacaan udara kering `3165` lebih tinggi dari titik kering default `2800`, sehingga hasilnya negatif dan ditandai `RANGE`. Perlu kalibrasi dua titik: titik kering di udara dan titik basah di air.
2. **Modul SD tidak terdeteksi.** Firmware tetap berjalan tanpa SD, tetapi store-and-forward tidak aktif. Perlu cek kartu (FAT32, ukuran <= 32 GB), posisi sisip, wiring, dan suplai 3,3 V.
3. **TX belum diuji ke broker.** Kegagalan `ok=0 attempts=3` berasal dari kredensial placeholder dan tidak adanya broker. Payload sendiri terbentuk benar. Tanpa NTP, `ts=21` sehingga paket akan ditolak backend.
4. **Flash 81,6%.** Di atas ambang waspada 80% karena build `esp32dev` membawa WiFi, MQTT, dan SD. Bukan blocker uji bench, tetapi perlu ditinjau sebelum menambah dependensi.

## 4. Bukti Pendukung

| File | Isi |
|---|---|
| `HW-9.1_serial_20261031.txt` | Log Serial siklus pertama |
| `unit_test_native_20261031.txt` | 45 test native PASS |

## 5. Langkah Berikutnya

1. Ukur ADC probe saat dicelup ke air, lalu tetapkan `MOISTURE_DRY_ADC` dan `MOISTURE_WET_ADC` baru.
2. Perbaiki deteksi SD, lalu ulangi skenario `scenario_sd_buffer.yaml`.
3. Isi kredensial WiFi dan alamat broker, jalankan Mosquitto, ulangi siklus untuk memverifikasi TX dan `ts` valid.
4. Uji deep sleep 15 menit dengan wake timer, bukan reset manual.
