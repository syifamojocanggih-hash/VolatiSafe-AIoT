# HW-0.3 — Verifikasi Broker MQTT Lokal

Tanggal: 26 Okt 2026

## Keadaan container setelah perbaikan

| Atribut | Nilai |
|---|---|
| Nama container | `volatisafe-mqtt` |
| Image | `eclipse-mosquitto:2` |
| Command | `mosquitto -c /mosquitto-no-auth.conf` |
| Port | `0.0.0.0:1883->1883/tcp` |
| Restart policy | `unless-stopped` |
| Auto-remove | `false` |
| Bind mount conf | tidak ada |

Config yang aktif adalah config bawaan image, bukan file custom:

```conf
listener 1883
allow_anonymous true

listener 9883
protocol http_api
http_dir /usr/share/mosquitto/dashboard
```

`docker/mosquitto.conf` belum ada di repo. Folder `docker/` adalah area domain
backend menurut `docs/README.md` 2 dan `01_SETUP_LINGKUNGAN.md` 4, jadi config
custom harus lewat Syifa, bukan ditulis dari domain IoT.

## Perintah recreate

```powershell
docker rm -f volatisafe-mqtt
docker run -d --name volatisafe-mqtt --restart unless-stopped `
  -p 1883:1883 eclipse-mosquitto:2 `
  mosquitto -c /mosquitto-no-auth.conf
```

Container lama memakai `--rm`, sehingga hilang begitu dihentikan dan tidak
pernah hidup sendiri setelah Docker Desktop restart. Syarat autostart di
`08_DEMO_RUNBOOK.md` H-7 sekarang terpenuhi.

## Perintah verifikasi

```powershell
docker exec volatisafe-mqtt sh -c 'nohup mosquitto_sub -h localhost \
  -t "/volatisafe/v1/node/+/telemetry" -v -C 1 > /tmp/sub.txt 2>&1 &'
docker exec volatisafe-mqtt mosquitto_pub -h localhost \
  -t "/volatisafe/v1/node/VS-SIM-001/telemetry" -f /tmp/p.json
docker exec volatisafe-mqtt cat /tmp/sub.txt
```

Payload uji 71 byte (konsisten `DEC-IOT-02` untuk Node ID `VS-SIM-001`):

```json
{"n":"VS-SIM-001","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}
```

## Keluaran

```
/volatisafe/v1/node/VS-SIM-001/telemetry {"n":"VS-SIM-001","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}
```

Uji restart: `docker restart volatisafe-mqtt` -> container kembali `Up`,
port 1883 di host tetap terbuka, publish berikutnya exit 0.

## Kesimpulan

- Broker menerima publish dan meneruskan ke wildcard `+` dengan benar.
- Topik sesuai `INTERFACES.md` 1.1, termasuk garis miring di depan.
- Payload lewat utuh 71 byte, tanda kutip tidak rusak di sisi broker.
- Autostart aktif setelah ganti restart policy.

## Catatan terbuka

1. `allow_anonymous true` pada `0.0.0.0:1883`: siapa pun di jaringan yang sama
   bisa subscribe dan publish. Aman untuk demo lokal, tidak untuk WiFi publik.
   Checklist `06_GATEWAY_MQTT.md` 7 meminta uji dengan autentikasi bila demo
   memakai WiFi publik.
2. `persistence` nonaktif (`/mosquitto/data` kosong). Tidak berpengaruh pada
   telemetri QoS 0 `retain=false`, tetapi state retained seperti LWT gateway di
   `/volatisafe/v1/gateway/{id}/status` tidak bertahan setelah restart. Perlu
   saat gateway fisik masuk di HW-9.5.
3. Listener 9883 (`protocol http_api`) ikut aktif di dalam container. Tidak
   di-publish ke host, jadi tidak terjangkau dari luar.
