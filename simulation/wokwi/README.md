# Wokwi Testbed - VolatiSafe AIoT

Simulasi ESP32 untuk node `VS-SIM-001`. Firmware tetap satu sumber di
`../../firmware/`; folder ini hanya berisi diagram, konfigurasi, dan skenario.

## Build

```powershell
pio run -e wokwi --project-dir ../../firmware
```

`wokwi.toml` menunjuk ke `firmware/.pio/build/wokwi/firmware.bin` dan
`firmware.elf`.

## Menjalankan skenario

```powershell
# dari folder ini
wokwi-cli . --timeout 60000 --scenario scenario_a.yaml
```

Skenario yang menunggu beberapa siklus (mis. `scenario_fault_range` atau
`scenario_i03`) butuh `--timeout 180000` karena setiap siklus tidur 10 detik
(`SIM_FAST_CYCLE`).

| File | Isi |
|---|---|
| `scenario_a.yaml` | Terik ekstrem, nilai target m 21 / t 34.5 / pH 7.85 |
| `scenario_b.yaml` | Hujan, nilai target m 42 / t 26 / pH 6.80 |
| `scenario_fault.yaml` | DS18B20 70 C -> `RANGE`, tanpa clamp |
| `scenario_fault_range.yaml` | Moisture short/putus -> `RANGE` |
| `scenario_mqtt_down.yaml` | Broker tidak terjangkau -> `ok=0 attempts=3`, siklus tetap jalan |
| `scenario_sd_buffer.yaml` | Broker down -> payload masuk antrian SD, antrian bertambah |
| `scenario_cycle.yaml` | Siklus penuh: sensor ON/OFF, TX, tidur, bangun |
| `scenario_i03.yaml` | 5 paket berturut untuk bukti I-03 |
| `scenario_e01.yaml` | Satu paket E-01 (A) + asersi TX |
| `scenario_e02.yaml` | Satu paket E-02 (B) + asersi TX |
| `scenario_i06.yaml` | DS18B20 terputus (-127 C) untuk I-06 |

## Broker lokal

Jalankan Mosquitto di port 1883, misalnya:

```powershell
docker run -d --name volatisafe-mqtt --restart unless-stopped -p 1883:1883 `
  eclipse-mosquitto:2 mosquitto -c /mosquitto-no-auth.conf
docker exec volatisafe-mqtt mosquitto_sub -h 127.0.0.1 `
  -t "/volatisafe/v1/node/+/telemetry" -v -C 5
```

Build default memakai `host.wokwi.internal:1883`, yang hanya bisa dijangkau
lewat Private Gateway (akun Wokwi berbayar). Untuk akun gratis, lihat
`../../docs/hardware/evidence/HW-5.4_local_mqtt_20261027.md`: broker lokal
dapat diekspos sementara lewat tunnel TCP dan `SIM_MQTT_HOST`/`SIM_MQTT_PORT`
di-override saat build. Ini bukan bridge; firmware tetap publish sendiri.

## Batasan

- Screenshot diagram lewat `wokwi-cli --screenshot-part` tidak bisa untuk board
  `esp` (tidak punya framebuffer). Screenshot rangkaian perlu diambil dari UI
  Wokwi/VS Code.
- Link publik Wokwi membutuhkan proyek di wokwi.com. Tanpa itu, lampirkan
  `diagram.json` + firmware sebagai alternatif.
- Wokwi tidak punya part SX1278. Yang diuji di sini adalah payload dan logika,
  bukan radio LoRa fisik.
- **Kuota Wokwi CI gratis habis 27 Okt 2026** setelah E01; wokwi-cli tidak bisa dijalankan lagi bulan ini. E02 dan I-06 tertunda. Lihat ../../docs/hardware/evidence/HW-7.3_blockers_20261027.md.
