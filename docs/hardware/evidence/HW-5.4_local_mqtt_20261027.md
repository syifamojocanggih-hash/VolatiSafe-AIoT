# HW-5.4 - Telemetri sampai Mosquitto lokal

Tanggal : 27 Okt 2026
Build   : `pio run -e wokwi` dengan override sementara
          `SIM_MQTT_HOST=<tunnel-host>` dan `SIM_MQTT_PORT=<tunnel-port>`
Uji     : `wokwi-cli . --timeout 180000 --scenario scenario_i03.yaml`
Broker  : container `volatisafe-mqtt` (eclipse-mosquitto:2), port 1883
Bukti   : `I03_mqtt_rx.txt`, `HW-5.4_serial_20261027.txt`,
          `HW-5.4_validation_20261027.txt`

## Hasil

5 paket berturut-turut diterima `mosquitto_sub` di Mosquitto lokal:

```
/volatisafe/v1/node/VS-SIM-001/telemetry {"n":"VS-SIM-001","ts":1793115044,"m":21.0,"t":34.5,"ph":7.85,"b":3.87}
/volatisafe/v1/node/VS-SIM-001/telemetry {"n":"VS-SIM-001","ts":1793115059,"m":21.0,"t":34.5,"ph":7.85,"b":3.87}
/volatisafe/v1/node/VS-SIM-001/telemetry {"n":"VS-SIM-001","ts":1793115073,"m":21.0,"t":34.5,"ph":7.85,"b":3.87}
/volatisafe/v1/node/VS-SIM-001/telemetry {"n":"VS-SIM-001","ts":1793115088,"m":21.0,"t":34.5,"ph":7.85,"b":3.87}
/volatisafe/v1/node/VS-SIM-001/telemetry {"n":"VS-SIM-001","ts":1793115103,"m":21.0,"t":34.5,"ph":7.85,"b":3.87}
```

- Topik persis kontrak, termasuk garis miring di depan.
- `ts` naik monoton: 5044 -> 5059 -> 5073 -> 5088 -> 5103.
- 5/5 payload lolos `validate_payload.py` (71 byte, batas 0..100 / -10..60 /
  3..10 / 2.80..4.25).
- Serial menunjukkan `[TX] KIRIM ok=1 attempts=1` untuk setiap siklus.

## Cara mencapai broker lokal dengan akun Wokwi gratis

`host.wokwi.internal` hanya tersedia lewat Private Gateway, yang membutuhkan
akun Wokwi berbayar. Karena akun yang dipakai gratis, dipakai jalan kedua dari
DEC-IOT-19: broker lokal diekspos sementara lewat tunnel TCP publik
(Serveo, `ssh -p 443 -R 0:localhost:1883 serveo.net`), lalu `SIM_MQTT_HOST`
dan `SIM_MQTT_PORT` diarahkan ke endpoint tunnel.

Yang penting:
- Ini **bukan bridge** dan bukan perubahan firmware. Firmware tetap memakai
  `transport_mqtt.cpp` dan publish sendiri; hanya alamat broker yang berbeda.
- Tunnel hanya hidup saat pengujian (maksimal 10 menit, port acak) dan tidak
  disimpan di repo.
- Konsekuensi: bukti ini membuktikan payload/topik sampai Mosquitto lokal,
  tetapi **bukan** membuktikan `host.wokwi.internal` berfungsi. Klaim itu tetap
  butuh Private Gateway berbayar atau VS Code license yang mendukungnya.
- Untuk demo tanpa tunnel, gunakan broker publik (lihat
  `HW-5.4_public_broker_diagnostic_20261027.txt`) dengan konsekuensi topik
  publik dan status bukti lebih lemah.
