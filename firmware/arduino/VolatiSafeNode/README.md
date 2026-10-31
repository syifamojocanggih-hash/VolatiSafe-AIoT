# VolatiSafeNode — Sketch Arduino IDE

Folder ini adalah salinan firmware PlatformIO yang disiapkan untuk Arduino IDE.
Isinya build fisik node saat ini: ESP32-WROOM-32D + WiFi/MQTT + micro SD.

## 1. Buka sketch

Buka `firmware/arduino/VolatiSafeNode/VolatiSafeNode.ino` di Arduino IDE. Jangan memindahkan
file `.cpp`/`.h` keluar dari folder ini; Arduino IDE mengompilasi seluruh folder
sebagai satu sketch.

## 2. Board dan core

| Setelan | Nilai |
|---|---|
| Board | **ESP32 Dev Module** |
| ESP32 core | **3.3.12** (diuji); 2.0.17 juga bisa |
| Flash size | 4 MB |
| Upload speed | 921600 |
| Port | COM5 (sesuai board Anda) |
| Serial monitor | 115200 baud |

Sketch ini diuji kompilasi dengan ESP32 core 3.3.12. Kalau muncul error
`ADC_11db was not declared`, pasang core 2.0.17 lewat Boards Manager.

## 3. Library

Pasang lewat Library Manager:

| Library | Versi |
|---|---|
| OneWire | 2.3.8 |
| DallasTemperature | 3.11.0 |
| PubSubClient | 2.8 |
| ArduinoJson | 7.0.4+ (7.x) |

`WiFi`, `SPI`, `SD`, dan `Preferences` sudah termasuk dalam ESP32 core.

## 4. Kredensial

Edit `config.h`, bagian **Kredensial Jaringan**, lalu ganti:

```cpp
#define NET_WIFI_SSID   "GANTI_SSID"
#define NET_WIFI_PASS   "GANTI_PASS"
#define NET_MQTT_HOST   "192.168.1.10"
#define NET_MQTT_PORT   1883
```

Gunakan IP broker di jaringan yang sama dengan ESP32. Jangan memakai kredensial
dari `firmware/platformio.ini`; itu setelan lokal mesin pengembang.

## 5. Upload

1. Sambungkan board lewat kabel USB data.
2. Pilih board dan port di **Tools**.
3. Klik **Upload**.
4. Buka Serial Monitor 115200 baud.

Log pertama yang benar kira-kira:

```text
=== VolatiSafe VS-A1-003 | FW 1.0.0 ===
[CAL] NVS kosong. Memakai default compile-time (BELUM TERKALIBRASI).
[SENS] m=...%(...) ph=7.00(N/A) t=...C(OK) b=3.87V(N/A)
[TX] payload ... byte: {"n":"VS-A1-003",...}
```

## 6. Wiring

| Sensor | Pin ESP32 |
|---|---|
| Capacitive soil moisture SIG | GPIO34 |
| DS18B20 DQ | GPIO4 (pull-up internal) |
| Micro SD CS | GPIO5 |
| Micro SD SCK | GPIO18 |
| Micro SD MISO | GPIO19 |
| Micro SD MOSI | GPIO23 |

pH (GPIO32), baterai (GPIO35), dan MOSFET power gate (GPIO25) belum dipasang.
Firmware mengirim pH `7.00` dan baterai `3.87 V` sebagai placeholder berstatus
`N/A`; jangan memakai nilai itu sebagai bukti pengukuran.

## 7. Catatan

- `transport_lora.cpp` sengaja tidak disertakan. Untuk build LoRa, pakai
  PlatformIO `[env:esp32dev_lora]` di `firmware/platformio.ini`.
- `build_opt.h` sudah menetapkan `TRANSPORT_KIND=2` dan `PH_ONBOARD=0`. `config.h`
  juga punya default yang sama, jadi sketch tetap benar bila file itu dihapus.
- Kartu micro SD harus FAT32, kapasitas 8–32 GB. Tanpa kartu, node tetap jalan
  tetapi store-and-forward nonaktif.
- Unit test tidak ada di folder ini; jalankan lewat PlatformIO
  (`pio test -e native -e native_no_ph`).
- Folder ini adalah salinan dari `firmware/src/` dan `firmware/include/`. Kalau
  firmware PlatformIO berubah, salin ulang file yang sama; jangan mengedit dua
  tempat. `main.cpp` diganti nama menjadi `VolatiSafeNode.ino`, jadi jangan
  menambahkan `main.cpp` kedua.
