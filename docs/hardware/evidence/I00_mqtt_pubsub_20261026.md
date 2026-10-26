# HW-0.3 — Verifikasi Broker MQTT Lokal

Tanggal: 26 Okt 2026
Host: Windows, Docker Desktop

## Keadaan container saat verifikasi

| Atribut | Nilai |
|---|---|
| Nama container | `volatisafe-mqtt` |
| Image | `eclipse-mosquitto:2` |
| Command | `mosquitto -c /mosquitto-no-auth.conf` |
| Port | `0.0.0.0:1883->1883/tcp` |
| Restart policy | `no` (tidak autostart) |
| Volume | anonymous, di `/mosquitto/data` dan `/mosquitto/log` |
| Bind mount conf | tidak ada |

Config yang benar-benar dipakai adalah config bawaan image (`/mosquitto-no-auth.conf`):

```conf
listener 1883
allow_anonymous true

listener 9883
protocol http_api
http_dir /usr/share/mosquitto/dashboard
```

Catatan: `docker/mosquitto.conf` belum ada di repo, dan `docker/` adalah area
domain backend (Syifa) menurut `docs/README.md` 2 serta `01_SETUP_LINGKUNGAN.md` 4.
Karena itu broker saat ini memakai fallback image, bukan config custom.

## Perintah verifikasi

Subscriber di dalam container (agar tidak bergantung `mosquitto_sub` di host):

```powershell
docker exec volatisafe-mqtt sh -c 'nohup mosquitto_sub -h localhost \
  -t "/volatisafe/v1/node/+/telemetry" -v -C 1 > /tmp/sub.txt 2>&1 &'
docker exec volatisafe-mqtt mosquitto_pub -h localhost \
  -t "/volatisafe/v1/node/VS-SIM-001/telemetry" -f /tmp/payload.json
docker exec volatisafe-mqtt cat /tmp/sub.txt
```

Payload uji (71 byte, konsisten dengan DEC-IOT-02 untuk Node ID `VS-SIM-001`):

```json
{"n":"VS-SIM-001","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}
```

## Keluaran

```
/volatisafe/v1/node/VS-SIM-001/telemetry {"n":"VS-SIM-001","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}
```

## Kesimpulan

- Broker menerima publish dan meneruskan ke wildcard `+` dengan benar.
- Topik sesuai kontrak `INTERFACES.md` 1.1, termasuk garis miring di depan.
- Payload lewat utuh, 71 byte, tanda kutip tidak rusak di sisi broker.
- `persistence` nonaktif: `/mosquitto/data` kosong. Untuk telemetri QoS 0
  `retain=false` ini tidak berpengaruh, tetapi state retained (mis. LWT gateway
  di `/volatisafe/v1/gateway/{id}/status`) tidak akan bertahan setelah restart.
- Restart policy `no` belum memenuhi syarat demo di `08_DEMO_RUNBOOK.md` H-7,
  yang meminta autostart (`unless-stopped` atau service).

## Sisa tindakan sebelum demo

1. Minta Syifa menambahkan `docker/mosquitto.conf` (domain backend), lalu jalankan
   container dengan bind mount config itu.
2. Set `--restart unless-stopped` pada container demo.
3. Bila demo memakai WiFi publik, aktifkan autentikasi (checklist
   `06_GATEWAY_MQTT.md` 7).
