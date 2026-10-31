# SETUP_IOT.md — Konfigurasi Node IoT dari Nol

Panduan operasional: dari repo bersih sampai data sensor muncul di API dan dashboard.
Untuk spesifikasi rangkaian lihat [`PINOUT_AND_SCHEMATICS.md`](PINOUT_AND_SCHEMATICS.md),
untuk skenario demo lihat [`WOKWI_SIMULATION.md`](WOKWI_SIMULATION.md).

---

## 0. Alur data

```
Firmware ESP32 ──MQTT──> Mosquitto :1883
                              │
                              ▼
                    Backend ingestion
                  validasi → AVRI → simpan
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
          TimescaleDB :5433        WebSocket /ws/v1/live
                 │                         │
                 └────────► REST API :8000 ┴──► Dashboard :3000
```

Satu paket harus melewati empat titik ini. Kalau salah satu diam, bagian itu yang bermasalah.

---

## 1. Prasyarat

| Kebutuhan | Dipakai untuk | Cek |
|---|---|---|
| Docker Desktop | TimescaleDB + Mosquitto | `docker --version` |
| Python 3.10+ | Backend FastAPI | `python --version` |
| Node.js 20+ | Dashboard Next.js | `node --version` |
| PlatformIO Core | Build firmware | `pio --version` |
| VS Code + ekstensi Wokwi | Jalur simulasi | `code --list-extensions` |
| ESP32-WROOM-32D + kabel data | Jalur hardware | — |

Port yang harus bebas: `5433` (DB), `1883` (MQTT), `8000` (API), `3000` (dashboard).

---

## 2. Langkah 1 — Nyalakan infrastruktur

Dari root repo:

```powershell
.\scripts\run-dev.ps1
```

Yang dilakukan skrip: menyalakan TimescaleDB + Mosquitto, menyiapkan `backend\.venv`,
menyalin `.env` contoh bila belum ada, lalu menjalankan backend dan dashboard di latar belakang.

Keluaran yang benar:

```
[docker] DB 5433 dan MQTT 1883 siap
[run] backend  -> http://localhost:8000/docs
[run] frontend -> http://localhost:3000
[ok] backend sehat
```

Verifikasi:

```powershell
docker ps --format "{{.Names}} | {{.Status}}" | Select-String volatisafe
(Invoke-WebRequest http://127.0.0.1:8000/api/v1/health -UseBasicParsing).StatusCode
```

Harus muncul `volatisafe_timescaledb ... (healthy)`, `volatisafe_mosquitto ... Up`, dan `200`.

Log berjalan di `logs\backend.log` dan `logs\frontend.log`. Pantau:

```powershell
Get-Content logs\backend.log -Tail 20 -Wait
```

Mematikan: `.\scripts\stop-dev.ps1` (aplikasi) lalu
`docker compose -f docker/docker-compose.yml down` (infrastruktur).

---

## 3. Langkah 2 — Konfigurasi MQTT

Nilai bawaan repo sudah cocok untuk pengembangan lokal. Yang perlu diketahui:

| Parameter | Nilai | Diatur di |
|---|---|---|
| Host (dari host machine) | `127.0.0.1` | — |
| Host (dari Wokwi) | `host.wokwi.internal` | `firmware/platformio.ini` |
| Host (dari ESP32 fisik) | IP LAN laptop, mis. `192.168.1.10` | `firmware/platformio.ini` |
| Port | `1883` | `docker/.env` → `MQTT_PORT` |
| Autentikasi | anonim (`allow_anonymous true`) | `docker/mosquitto.conf` |
| Enkripsi | tidak ada (TLS belum aktif) | — |
| Topik | `/volatisafe/v1/node/{NODE_ID}/telemetry` | `firmware/src/transport_mqtt.cpp` |
| QoS | `0`, `retained=false` | idem |

Dua hal yang sering salah:

1. **Topik diawali garis miring.** Backend berlangganan `/volatisafe/v1/node/+/telemetry`.
   Topik tanpa `/` di depan tidak akan pernah diproses.
2. **QoS 0 tanpa ACK.** `publish()` bernilai true berarti paket masuk ke socket,
   bukan berarti backend sudah menyimpannya.

Backend membaca broker dari `backend\.env`:

```env
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
```

Uji broker tanpa firmware:

```powershell
# terminal 1 — dengarkan semua node
docker exec -it volatisafe_mosquitto mosquitto_sub -h 127.0.0.1 -t "/volatisafe/v1/node/+/telemetry" -v
```

Biarkan menyala. Terminal ini adalah alat diagnosis paling cepat: kalau paket muncul
di sini, sensor/pengirim sudah benar.

---

## 4. Langkah 3 — Pilih sumber data

Ada tiga jalur. Mulai dari A untuk memastikan backend sehat, lalu B atau C.

### 4A. Tanpa hardware (skrip publish)

```powershell
.\scripts\publish-telemetry.ps1 -Moisture 41.2 -Temp 21.4 -Ph 6.35 -Battery 4.05
```

Parameter: `-Moisture` (0–100), `-Temp` (-10–60), `-Ph` (3–10), `-Battery` (2.8–4.25),
opsional `-NodeId` (default `VS-SIM-001`).

Payload yang dikirim:

```json
{"n":"VS-SIM-001","ts":1793440104,"m":41.2,"t":21.4,"ph":6.35,"b":4.05}
```

| Kunci | Arti | Satuan |
|---|---|---|
| `n` | node ID | — |
| `ts` | epoch UTC (detik) | s |
| `m` | kelembaban tanah | % |
| `t` | suhu tanah | °C |
| `ph` | pH tanah | — |
| `b` | tegangan baterai | V |

`b` boleh dihilangkan bila mengirim JSON mentah; backend memakai 3.87 V. `m`, `t`, `ph`, dan `n` wajib ada.

### 4B. Wokwi (firmware asli, tanpa hardware)

Wokwi menjalankan `firmware.bin` yang sama dengan build fisik, hanya modul transport
yang berbeda (MQTT langsung, tanpa SX1278).

**1. Build:**

```powershell
pio run -e wokwi -d firmware
```

**2. Buka diagram:**

```powershell
code simulation\wokwi\diagram.json
```

**3. Jalankan simulator:** tekan `F1` → **Wokwi: Start Simulator**.
Wokwi untuk ESP32 memerlukan akun/lisensi; lihat
[`playbook/01_SETUP_LINGKUNGAN.md`](playbook/01_SETUP_LINGKUNGAN.md) bagian HW-0.2.

**4. Yang ada di diagram:**

| Part | Pin ESP32 | Peran |
|---|---|---|
| `pot_moist` | GPIO34 | kelembaban tanah (potensiometer) |
| `pot_ph` | GPIO32 | pH tanah (potensiometer) |
| `ds18b20` | GPIO4 | suhu tanah |
| `sd` | SPI (CS GPIO5) | buffer saat kirim gagal |

Putar potensiometer untuk mengubah nilai. `pot_moist` ke kiri = kering (nilai % kecil),
ke kanan = basah.

**5. Serial Monitor** (115200) akan menampilkan siklus tiap 10 detik:

```
=== VolatiSafe VS-SIM-001 | FW 1.0.0 ===
[SIM] FAST CYCLE: sleep 10s, BUKAN perilaku produksi
[CAL] NVS kosong. Memakai default compile-time (BELUM TERKALIBRASI).
[SENS] m=41.2%(OK) ph=6.35(OK) t=21.4C(OK) b=3.87V(N/A)
[TX] WiFi tersambung, IP <ip-wokwi>
[TX] broker host.wokwi.internal -> <ip-host>:1883
[TX] MQTT tersambung, topik /volatisafe/v1/node/VS-SIM-001/telemetry
[TX] payload 71 byte: {"n":"VS-SIM-001","ts":...}
[TX] KIRIM ok=1 attempts=1
```

Catatan jalur B:

- Node ID `VS-SIM-001`, siklus 10 detik (`SIM_FAST_CYCLE`) — bukan perilaku produksi.
- pH **dibaca** dari `pot_ph` karena build Wokwi tidak memasang `PH_ONBOARD=0`.
- Baterai selalu `3.87 V` (`BATTERY_ONBOARD 0` di `config.h`), status `N/A`.

### 4C. Hardware fisik (ESP32 + sensor)

#### 4C.1 Wiring

| Sensor | Pin ESP32 | Catatan |
|---|---|---|
| Capacitive soil moisture v1.2 | GPIO34 | keluaran analog, ADC1 |
| Modul pH tanah | GPIO32 | perlu `PH_ONBOARD=1` (lihat 4C.5) |
| DS18B20 | GPIO4 | pull-up internal; 4.7k eksternal lebih stabil untuk kabel panjang |
| Divider baterai 100k/100k | GPIO35 | perlu `BATTERY_ONBOARD=1` (lihat 4C.5) |
| MOSFET power gate sensor | GPIO25 | HIGH = sensor menyala |
| Micro SD (SPI) | CS 5, SCK 18, MISO 19, MOSI 23 | buffer offline |

Analog wajib di ADC1 (GPIO32–39); ADC2 tidak bisa dipakai saat WiFi aktif.

#### 4C.2 Kredensial dan alamat broker

Edit `firmware/platformio.ini`, bagian `[env:esp32dev]`:

```ini
build_flags =
    -D WIFI_SSID=\"NAMA_WIFI\"
    -D WIFI_PASS=\"PASSWORD_WIFI\"
    -D MQTT_HOST=\"192.168.1.10\"
    -D MQTT_PORT=1883
```

Cari IP laptop yang menjalankan Mosquitto:

```powershell
ipconfig | Select-String "IPv4"
```

ESP32 dan laptop harus di jaringan yang sama. Izinkan port 1883 masuk
(PowerShell **sebagai Administrator**):

```powershell
New-NetFirewallRule -DisplayName "VolatiSafe MQTT 1883" -Direction Inbound -Protocol TCP -LocalPort 1883 -Action Allow
```

#### 4C.3 Build, upload, monitor

```powershell
pio run -e esp32dev -d firmware -t upload
pio device monitor -d firmware -b 115200
```

#### 4C.4 Serial yang benar

```
=== VolatiSafe VS-A1-003 | FW 1.0.0 ===
[TX] WiFi ke "NAMA_WIFI"
[TX] WiFi tersambung, IP 192.168.1.57
[TX] broker 192.168.1.10 -> 192.168.1.10:1883
[TX] MQTT tersambung, topik /volatisafe/v1/node/VS-A1-003/telemetry
[TX] jam tersinkron: 1793440104 (epoch UTC)
[TX] KIRIM ok=1 attempts=1
```

Setelah itu node tidur 15 menit dan bangun sendiri.

#### 4C.5 pH dan baterai

Keduanya dimatikan di build fisik (`platformio.ini` memasang `PH_ONBOARD=0`,
`config.h` menetapkan `BATTERY_ONBOARD 0`), sehingga firmware mengirim nilai
pengganti yang sah: pH `7.00` dan baterai `3.87 V`.

- **Modul pH terpasang?** Ganti `-D PH_ONBOARD=0` menjadi `-D PH_ONBOARD=1`, lalu
  kalibrasi (bagian 7). Tanpa modul, GPIO32 hanya membaca noise.
- **Divider baterai terpasang?** Ubah `BATTERY_ONBOARD` menjadi `1` di `config.h`.

Selama masih placeholder, API menampilkan pH 7.00 seolah bacaan nyata karena payload
tidak membawa status kanal. Jangan pakai pH sebagai bukti pengukuran sampai modul
terpasang dan kalibrasi selesai.

---

## 5. Langkah 4 — Identitas node dan pemetaan lahan

Node ID ditentukan saat kompilasi di `firmware/include/config.h`:

```c
#if defined(SIM_NODE)
  #define NODE_ID             "VS-SIM-001"   // build Wokwi
#else
  #define NODE_ID             "VS-A1-003"    // build fisik
#endif
```

Ganti string `VS-A1-003` untuk node baru. Satu node fisik = satu ID tetap.

Node yang belum terdaftar **tidak ditolak**. Ingestion memanggil `ensure_node()` dan
mendaftarkannya otomatis ke `BLOK-A` pada paket pertama. Konsekuensinya:

- Salah ketik ID akan membuat node baru, bukan memperbarui node lama.
- Belum ada endpoint untuk memindahkan node antar-blok; pemetaan field masih `BLOK-A`.

Dashboard memilih node dengan `last_seen` terbaru, jadi node yang baru mengirim
langsung menjadi sumber angka di kartu metrik.

---

## 6. Langkah 5 — Verifikasi berlapis

Jalankan berurutan. Berhenti di lapis pertama yang gagal.

**Lapis 1 — broker.** Terminal `mosquitto_sub` dari bagian 3 harus menampilkan baris
topik + JSON setiap kali node mengirim.

**Lapis 2 — ingestion.** `logs\backend.log` harus memuat:

```
Telemetri diterima: node=VS-SIM-001 ts=2026-10-31T10:31:14Z m=34.7 t=26.9 ph=6.72 b=3.97 avri=39.4
```

**Lapis 3 — API:**

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/fields/BLOK-A/current-status | ConvertTo-Json -Depth 6
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/nodes?field_id=BLOK-A" | ConvertTo-Json -Depth 4
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/nodes/VS-SIM-001/telemetry?hours=24" | ConvertTo-Json -Depth 4
```

**Lapis 4 — database:**

```powershell
docker exec volatisafe_timescaledb psql -U volatisafe -d volatisafe_db -c "select ts, node_id, moisture, soil_temp, ph from telemetry order by ts desc limit 5;"
```

**Lapis 5 — dashboard:** http://localhost:3000 berubah dalam ~1 detik tanpa refresh.

---

## 7. Langkah 6 — Kalibrasi

Kalibrasi disimpan sebagai konstanta kompilasi; ubah di `firmware/include/config.h`
lalu build ulang.

### Kelembaban (dua titik)

```c
#define MOISTURE_DRY_ADC    2800    // probe di udara kering
#define MOISTURE_WET_ADC    1350    // probe di tanah jenuh air
```

Rumus: `moisture = (dry - adc) / (dry - wet) * 100`.

Prosedur: catat ADC saat probe di udara, catat ADC saat probe di air, masukkan keduanya.
Nilai tidak di-clamp — sensor putus atau short sengaja menghasilkan angka di luar 0–100
agar backend menolaknya, bukan menyimpannya sebagai data sah.

### pH (dua titik buffer)

```c
#define PH_NEUTRAL_ADC      1500.0f // ADC pada buffer pH 6.86/7.00
#define PH_SLOPE            300.0f  // selisih ADC per satuan pH
```

Rumus: `ph = 7 - (adc - neutral_adc) / slope + 0.15 * (50 - moisture) / 50`.
Suku terakhir adalah kompensasi kelembaban.

---

## 8. Uji kegagalan

| Uji | Perintah | Hasil yang benar |
|---|---|---|
| Sensor rusak | `.\scripts\publish-telemetry.ps1 -Moisture -999` | Paket ditolak; log menulis `sentinel -999`; metrik terakhir tidak berubah |
| Nilai mustahil | `-Temp 120` | Ditolak: `suhu tanah di luar rentang -10..60` |
| Field hilang | publish tanpa `-Ph` | Ditolak: `field 'ph' ... kosong` |
| Node baru | `-NodeId VS-UJI-777` | Node terdaftar otomatis di `BLOK-A` |
| Broker mati | `docker stop volatisafe_mosquitto` | Serial firmware `[TX] MQTT gagal ... state=-2`; firmware menyimpan ke SD |

---

## 9. Troubleshooting

| Gejala | Penyebab umum | Tindakan |
|---|---|---|
| `[TX] WiFi timeout` | SSID/password salah, atau di luar jangkauan | Perbaiki `WIFI_SSID`/`WIFI_PASS` |
| `[TX] MQTT gagal ... state=-2` | Host salah, DNS gagal, firewall, broker mati | Cek `MQTT_HOST`, `docker ps`, aturan firewall 1883 |
| `state=5` | Broker menolak (ACL/auth) | `docker/mosquitto.conf` masih `allow_anonymous true`? |
| Paket ada di `mosquitto_sub`, log backend kosong | Topik beda atau backend mati | Topik wajib diawali `/volatisafe/...`; cek `logs\backend.log` |
| Log `Paket telemetri ditolak` | Sentinel `-999` atau nilai di luar rentang | Perbaiki sensor/kalibrasi, bukan backend |
| API tidak berubah | Node lain yang lebih baru | Bandingkan `last_seen` di `/api/v1/nodes` |
| Dashboard diam, API benar | WebSocket putus | Cek konsol browser, lalu reload |
| `ts` tahun 1970 | NTP gagal | Backend memakai waktu server; urutan waktu bisa meleset |
| Port 1883 dipakai proses lain | Mosquitto native lain | Ubah `MQTT_PORT` di `docker/.env` dan `MQTT_BROKER_PORT` di `backend\.env` |
| `run-dev.ps1` menolak start | Port 8000/3000 masih dipakai | `.\scripts\stop-dev.ps1` |

---

## 10. Checklist sebelum demo

- [ ] `.\scripts\run-dev.ps1` selesai tanpa warning
- [ ] `docker ps` menunjukkan DB healthy dan Mosquitto Up
- [ ] `mosquitto_sub` menerima paket dari node yang akan didemokan
- [ ] `logs\backend.log` menulis `Telemetri diterima` dengan nilai yang sama
- [ ] `/api/v1/fields/BLOK-A/current-status` mengembalikan nilai terbaru
- [ ] Dashboard berubah tanpa refresh
- [ ] Uji `-999` ditolak dan angka terakhir tidak berubah
- [ ] Sudah tahu node mana yang aktif (`last_seen` terbaru)
- [ ] pH/baterai tidak diklaim sebagai pengukuran nyata bila masih placeholder
