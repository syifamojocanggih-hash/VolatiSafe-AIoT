# 01_SETUP_LINGKUNGAN.md — Inventaris Tool & Unduhan yang Diperlukan

> **Dipakai pada:** FASE 0 (HW-0.1 s.d. HW-0.5)
> **OS acuan:** Windows 10/11 · PowerShell 5.1
> **Status audit:** 26 Oktober 2026

---

## 1. Ringkasan: Apa yang Sudah Ada vs Harus Diunduh

Hasil pemeriksaan mesin pengembangan saat dokumen ini ditulis. Kolom **Aksi** adalah satu-satunya hal yang perlu Anda kerjakan.

| Komponen | Status | Versi / Lokasi | Aksi |
|---|---|---|---|
| PlatformIO Core | ✅ ADA | `6.2.0` — `C:\Users\hafii\AppData\Local\Programs\Python\Python313\Scripts\pio.exe` | — |
| Platform `espressif32` | ✅ ADA | `8.0.0` | — |
| **Packages ESP32** (toolchain, framework, esptool) | ❌ **KOSONG** | `~/.platformio/packages` = 0 entri | **HW-0.1 — unduh (±450 MB)** |
| **Library proyek** (OneWire, DallasTemperature, LoRa, ArduinoJson) | ❌ **BELUM** | `lib_deps` di `platformio.ini` belum di-resolve | **HW-0.1** |
| Ekstensi VS Code PlatformIO | ✅ ADA | `platformio.platformio-ide@3.3.4` | — |
| Ekstensi VS Code Wokwi | ✅ ADA | `wokwi.wokwi-vscode@4.1.0` | — |
| Ekstensi VS Code C/C++ | ✅ ADA | `ms-vscode.cpptools@1.34.4` + pack | — |
| Wokwi CLI | ✅ ADA | `C:\Users\hafii\AppData\Local\wokwi\wokwi-cli.exe` | — |
| **Lisensi Wokwi** | ❌ **BELUM AKTIF** | `~/.wokwi` tidak berisi file lisensi | **HW-0.2** |
| `WOKWI_CLI_TOKEN` | ✅ TER-SET | environment variable | verifikasi saja |
| Docker | ✅ ADA | `C:\Program Files\Docker\Docker\resources\bin\docker.exe` | — |
| **Image Mosquitto** | ❌ **BELUM** | `docker images` kosong | **HW-0.3** |
| **Mosquitto native** | ❌ TIDAK ADA | bukan service Windows | **HW-0.3** (opsional, alternatif Docker) |
| Python | ⚠️ ADA `3.13` | `C:\Users\hafii\AppData\Local\Programs\Python\Python313\python.exe` | lihat §6 catatan |
| Driver CP210x | ❓ BELUM DIVERIFIKASI | hanya perlu untuk TKT 4 | HW-9.1 |
| Git | ✅ ADA | repo aktif di cabang `iot` | — |
| `.gitignore` root repo | ❌ TIDAK ADA | ini di luar area tulis IoT | **HW-0.4 — eskalasi** |

**Kesimpulan:** yang benar-benar harus diunduh sekarang hanya **3 hal** — packages ESP32, lisensi Wokwi, dan image Mosquitto. Sisanya sudah siap.

---

## 2. HW-0.1 — Unduh Toolchain ESP32 & Library

### Mengapa perlu
Platform `espressif32` yang terpasang hanyalah *definisi board* (file JSON + skrip Python). Compiler `xtensa-esp32-elf-gcc`, framework Arduino-ESP32, dan `esptool` belum ada. Tanpa itu `pio run` akan gagal pada tahap compile.

### Perintah

```powershell
# dari root repo
pio run --project-dir firmware
```

Perintah ini akan menarik, di dalam `~/.platformio/packages`:

| Package | Perkiraan ukuran | Fungsi |
|---|---|---|
| `toolchain-xtensa-esp32` | ~180 MB | Compiler C/C++ |
| `framework-arduinoespressif32` | ~120 MB | API Arduino untuk ESP32 |
| `tool-esp32ulp` | ~2 MB | Assembler ULP (dipakai toolchain) |
| `tool-mkspiffs`, `tool-mklittlefs` | ~3 MB | Filesystem image (tidak dipakai, ikut terpasang) |
| `tool-esptoolpy` | ~1 MB | Flasher (TKT 4) |

Ditambah library dari `lib_deps`:

| Library | Versi | Dipakai untuk |
|---|---|---|
| `paulstoffregen/OneWire` | ^2.3.8 | Protokol 1-Wire DS18B20 |
| `milesburton/DallasTemperature` | ^3.11.0 | Konversi raw DS18B20 → °C |
| `sandeepmistry/LoRa` | ^0.8.0 | Driver SX1278 (build fisik) |
| `bblanchon/ArduinoJson` | ^7.0.4 | Encoder payload JSON |

### Verifikasi

```powershell
# 1. packages sudah terisi (harus > 0)
(Get-ChildItem "$env:USERPROFILE\.platformio\packages").Count

# 2. build sukses
pio run --project-dir firmware

# 3. tidak ada error, output berakhir dengan SUCCESS
```

Ekspektasi akhir perintah 2:

```
RAM:   [          ]   4.5% (used 14700 bytes from 327680 bytes)
Flash: [          ]   4.1% (used 86000 bytes from 2097152 bytes)
========================= [SUCCESS] Took 45.23 seconds =========================
```

> Angka RAM/Flash akan berubah setelah FASE 2–4. Yang penting baris **SUCCESS**.

### Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Could not find the main configuration file` | dijalankan di folder salah | tambahkan `--project-dir firmware` atau jalankan dari dalam `firmware/` |
| Unduhan berhenti di tengah | koneksi lambat / firewall | ulangi perintah; PlatformIO melanjutkan dari cache |
| `SSL: CERTIFICATE_VERIFY_FAILED` | sertifikat/proxy korporat | `pio settings set enable_ssl false` lalu ulangi (kembalikan setelah selesai) |
| Antivirus memblokir `xtensa-esp32-elf-gcc.exe` | false positive | whitelist folder `%USERPROFILE%\.platformio\packages` |
| Disk penuh | butuh ~1 GB total | kosongkan `%USERPROFILE%\.platformio\.cache` |

---

## 3. HW-0.2 — Aktifkan Lisensi Wokwi

### Mengapa perlu
Wokwi CLI dan ekstensi VS Code menolak menjalankan simulasi tanpa lisensi aktif. `WOKWI_CLI_TOKEN` sudah ter-set, tetapi belum ada file lisensi di `~/.wokwi` — artinya **token ada, aktivasi belum**.

### Langkah

1. Buka VS Code pada folder repo ini.
2. `Ctrl+Shift+P` → ketik **`Wokwi: Request a License`** → Enter.
3. Browser terbuka → login/daftar di `wokwi.com` → salin lisensi yang ditampilkan.
4. VS Code menampilkan input box → tempel lisensi → Enter.
5. Verifikasi file lisensi terbentuk:

```powershell
Get-ChildItem "$env:USERPROFILE\.wokwi" -Force
# harus ada file berisi lisensi (mis. 'license.txt')
```

6. Verifikasi CLI:

```powershell
wokwi-cli --version
```

### Catatan penting
- Lisensi Wokwi gratis untuk penggunaan komunitas dengan **kuota simulasi terbatas per bulan**. Untuk demo juri, jalankan uji coba penuh H-1 agar tidak kehabisan kuota pada hari-H.
- Jangan commit file lisensi atau token ke repo. Pastikan tidak ada di `simulation/wokwi/`.

---

## 4. HW-0.3 — Siapkan Broker MQTT Lokal

Ada dua jalur. **Pilih salah satu**, jangan keduanya (bentrok di port 1883).

### Opsi A — Docker (konsisten dengan target deployment)

```powershell
docker pull eclipse-mosquitto:2
```

Mosquitto 2 **menolak koneksi dari luar container** bila tidak ada konfigurasi `listener`. File konfigurasi ini milik domain backend (`docker/`), jadi **minta Syifa** menambahkan `docker/mosquitto.conf`:

```conf
listener 1883 0.0.0.0
allow_anonymous true
persistence false
log_dest stdout
```

Lalu jalankan:

```powershell
docker run -d --name volatisafe-mqtt --restart unless-stopped -p 1883:1883 `
  -v "${PWD}\docker\mosquitto.conf:/mosquitto/config/mosquitto.conf" `
  eclipse-mosquitto:2
```

Jika `docker/mosquitto.conf` belum tersedia dan Anda perlu broker sekarang, jalankan tanpa volume dengan config bawaan image yang mengizinkan anonim:

```powershell
docker run -d --name volatisafe-mqtt --restart unless-stopped -p 1883:1883 `
  eclipse-mosquitto:2 `
  mosquitto -c /mosquitto-no-auth.conf
```

> **Jangan pakai `--rm`.** Container dengan `--rm` hilang begitu dihentikan, sehingga
> `--restart` tidak menolong dan broker tidak hidup sendiri setelah Docker Desktop
> atau laptop restart. Syarat autostart demo ada di [`08_DEMO_RUNBOOK.md`](08_DEMO_RUNBOOK.md) H-7.
> Kedua perintah di atas sengaja memakai `-d` + `--restart unless-stopped` tanpa `--rm`.
> Saat mengganti config atau image, hapus dulu container lama: `docker rm -f volatisafe-mqtt`.

### Opsi B — Native Windows (paling cepat untuk uji lokal)

```powershell
winget install --id EclipseFoundation.Mosquitto -e
```

Setelah terpasang, tambahkan `C:\Program Files\mosquitto` ke `PATH`, lalu buat `mosquitto.conf` minimal dan jalankan manual:

```powershell
mosquitto -p 1883 -v
```

`-v` menampilkan setiap paket yang lewat — sangat berguna saat debugging FASE 5.

### Verifikasi (berlaku untuk kedua opsi)

Buka **dua** terminal.

Terminal 1 — subscriber:

```powershell
mosquitto_sub -h localhost -p 1883 -t "/volatisafe/v1/node/+/telemetry" -v
```

Terminal 2 — publisher uji:

```powershell
mosquitto_pub -h localhost -p 1883 `
  -t "/volatisafe/v1/node/VS-SIM-001/telemetry" `
  -m '{"n":"VS-SIM-001","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}'
```

Ekspektasi Terminal 1:

```
/volatisafe/v1/node/VS-SIM-001/telemetry {"n":"VS-SIM-001",...}
```

Jika memakai Opsi A dan tidak punya `mosquitto_sub` di host, gunakan eksekusi di dalam container:

```powershell
docker exec -it volatisafe-mqtt mosquitto_sub -t "/volatisafe/v1/node/+/telemetry" -v
```

### Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Connection refused (10061)` | broker tidak jalan / port beda | cek `docker ps`, pastikan port `1883` |
| Publish sukses tapi subscriber kosong | wildcard topik salah | topik bersifat case-sensitive; diawali garis miring `/` |
| `mosquitto_pub : command not found` | belum di PATH | pakai Opsi A + `docker exec`, atau tambahkan PATH |
| Port 1883 dipakai proses lain | Mosquitto lama masih hidup | `Get-NetTCPConnection -LocalPort 1883` lalu hentikan |

---

## 5. HW-0.4 — Repo Hygiene (Eskalasi, Bukan Ditulis Sendiri)

### Masalah
`firmware/.pio/` berisi artefak build dan saat ini **untracked**. Ukuran `~/.platformio` 315 MB; `firmware/.pio` akan tumbuh puluhan MB. Repo belum memiliki `.gitignore` di mana pun.

### Batasan
`.gitignore` di root repo **di luar** area tulis IoT (`firmware/`, `simulation/wokwi/`, `docs/hardware/`) dan menyentuh semua domain. Jangan dibuat sepihak.

### Tindakan
1. Ajukan ke Aris (Lead) atau Syifa untuk menambahkan ke `.gitignore` root:

```gitignore
# PlatformIO
.pio/
.pioenvs/
.piolibdeps/

# Wokwi
simulation/wokwi/.wokwi/
*.elf
*.bin

# Python
__pycache__/
*.pyc
.venv/
venv/

# Node
node_modules/
.next/

# Env & secrets
.env
.env.local

# OS
Thumbs.db
.DS_Store
```

2. Sampai itu ada, **jangan** `git add -A` atau `git add .` — stage per path secara eksplisit.

```powershell
# benar
git add firmware/src firmware/include firmware/platformio.ini
# salah (ikut memasukkan .pio/)
git add firmware/
```

---

## 6. HW-0.5 — Kunci Versi & Baseline Build

### Tujuan
Memastikan build reprodusibel. `platformio.ini` saat ini memakai `platform = espressif32` tanpa versi, artinya build bisa berubah bila rilis platform baru keluar — berbahaya menjelang demo.

### Tindakan
1. Catat versi aktual setelah HW-0.1:

```powershell
pio pkg list --project-dir firmware
```

2. Pin versi platform di `platformio.ini`:

```ini
platform = espressif32@8.0.0
```

3. Simpan `firmware/package-lock.json` hasil `pio pkg install` (dibuat otomatis) ke repo.
4. Catat baseline RAM/Flash dari build pertama di [`07_TEST_PLAN.md`](07_TEST_PLAN.md) §5.

---

## 7. Catatan Python 3.13

Dokumen `docs/backend/SETUP.md` menyebut **Python 3.11**, sedangkan mesin ini memiliki **3.13**.

- Untuk **firmware**: tidak relevan — PlatformIO hanya memakai Python sebagai host tool dan sudah terbukti jalan (`pio --version` OK).
- Untuk **bridge MQTT** (`paho-mqtt`, Bab 06): `paho-mqtt` 2.x mendukung 3.13, aman.
- Untuk **backend FastAPI** (domain Syifa): jangan diasumsikan aman. Beberapa paket (`asyncpg`, `psycopg2`) bisa butuh wheel khusus. Itu keputusan Syifa; cukup dicatat sebagai risiko lintas domain di [`09_RISIKO_DAN_KEPUTUSAN.md`](09_RISIKO_DAN_KEPUTUSAN.md) R-09.

Rekomendasi: buat virtualenv terpisah per keperluan agar tidak saling mengunci versi.

```powershell
# untuk bridge MQTT IoT (Bab 06)
python -m venv .venv-iot
.\.venv-iot\Scripts\Activate.ps1
pip install paho-mqtt==2.1.0
```

---

## 8. Checklist Selesai FASE 0

- [ ] `pio run --project-dir firmware` → `SUCCESS`
- [ ] `(Get-ChildItem "$env:USERPROFILE\.platformio\packages").Count` > 0
- [ ] File lisensi ada di `~/.wokwi`
- [ ] `wokwi-cli --version` merespons
- [ ] Broker MQTT lokal menerima pesan uji (subscriber menerima payload)
- [ ] Container broker memakai `--restart unless-stopped` dan **tanpa** `--rm`, terverifikasi lewat `docker restart volatisafe-mqtt` lalu `docker ps`
- [ ] `.gitignore` sudah diajukan ke Lead (atau disetujui tertunda dengan mitigasi stage eksplisit)
- [ ] Versi platform sudah di-pin, `package-lock.json` tersimpan
- [ ] Baseline RAM/Flash dicatat di Bab 07 §5
