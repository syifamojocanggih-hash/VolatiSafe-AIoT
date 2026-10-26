# 05_WOKWI_SIMULASI.md — Virtual Testbed Wokwi

> **Dipakai pada:** FASE 5 (HW-5.1 … HW-5.4)
> **Rujukan perilaku:** [`../WOKWI_SIMULATION.md`](../WOKWI_SIMULATION.md) · [`../ARCHITECTURE_IOT.md`](../ARCHITECTURE_IOT.md) §10

---

## 1. Apa yang Dibuktikan dan Apa yang Tidak

Bagian ini penting agar tidak ada klaim berlebihan di proposal.

| Dibuktikan oleh Wokwi | **Tidak** dibuktikan |
|---|---|
| Firmware C++ berjalan pada arsitektur ESP32 nyata (bukan mock) | Jangkauan radio LoRa (2–5 km) |
| Logika sampling burst & median filter | Kinerja PHY LoRa (SF7, BW125, airtime) |
| Kalibrasi & kompensasi pH | Konsumsi daya nyata (deep sleep µA) |
| Encoder payload ≤ batas kontrak | Ketahanan probe di tanah basah |
| Format payload diterima backend tanpa perubahan | Akurasi sensor fisik |
| Alur end-to-end sampai dashboard | Ketahanan enclosure terhadap cuaca |

**Alasan:** Wokwi tidak menyediakan part `SX1278`. Yang disimulasikan hanya **hop radio**-nya, diganti WiFi → MQTT. Karena itu:

- `sensors.cpp`, `payload.cpp`, `calibration.cpp` **identik** antara build simulasi dan fisik.
- `transport_lora.cpp` ↔ `transport_mqtt.cpp` adalah satu-satunya perbedaan.
- Format payload **tidak berubah** → gateway, ACL, dan backend tidak bisa membedakan.

Kalimat yang aman untuk proposal: *"Payload LoRa-compatible dengan transport parity; hop radio disimulasikan melalui MQTT pada fase TKT 3."*
Kalimat yang **harus dihindari**: *"LoRa telah diuji"* atau *"terukur 10 µA"*.

---

## 2. Struktur File

```
simulation/wokwi/
├── diagram.json      # rangkaian virtual
├── wokwi.toml        # menunjuk binary hasil [env:wokwi]
├── README.md         # cara menjalankan (2 menit baca)
└── scenarios/
    ├── A_terik.md    # nilai potensiometer + hasil yang diharapkan
    ├── B_hujan.md
    └── C_dropout.md
```

> **Catatan penting:** `simulation/wokwi/` **hanya berisi konfigurasi simulasi**, bukan salinan firmware. Firmware tetap satu di `firmware/`. Ini mencegah dua sumber kebenaran — pelanggaran yang paling sering terjadi pada proyek Wokwi.

---

## 3. `diagram.json`

### 3.1 Daftar part

| ID | Tipe Wokwi | Peran |
|---|---|---|
| `esp` | `board-esp32-devkit-c-v4` | MCU (setara NodeMCU V1 30-pin) |
| `pot_moist` | `wokwi-potentiometer` | Simulasi sensor kelembaban kapasitif |
| `pot_ph` | `wokwi-potentiometer` | Simulasi modul pH analog |
| `pot_batt` | `wokwi-potentiometer` | Simulasi divider tegangan baterai |
| `ds18b20` | `wokwi-ds18b20` | Sensor suhu tanah 1-Wire |
| `r_pullup` | `wokwi-resistor` (4.7 kΩ) | Pull-up 1-Wire (**wajib**) |
| `oled` | `wokwi-ssd1306` (opsional) | Menampilkan nilai live saat demo |

`pot_batt` memakai potensiometer, bukan dua resistor, karena divider resistor pada rel 3,3 V hanya bisa menghasilkan 1,65 V (terbaca 3,30 V baterai) — tidak bisa mensimulasikan baterai 3,87 V. Potensiometer bisa diatur ke 1,935 V.

### 3.2 Tabel wiring

| Dari | Ke | Warna | Catatan |
|---|---|---|---|
| `esp:3V3` | `pot_moist:VCC` | red | |
| `esp:GND` | `pot_moist:GND` | black | |
| `pot_moist:SIG` | `esp:34` | green | ADC1_CH6 — **jangan** pin ADC2 |
| `esp:3V3` | `pot_ph:VCC` | red | |
| `esp:GND` | `pot_ph:GND` | black | |
| `pot_ph:SIG` | `esp:32` | green | ADC1_CH4 |
| `esp:3V3` | `pot_batt:VCC` | red | |
| `esp:GND` | `pot_batt:GND` | black | |
| `pot_batt:SIG` | `esp:35` | green | ADC1_CH7 |
| `esp:3V3` | `ds18b20:VCC` | red | |
| `esp:GND` | `ds18b20:GND` | black | |
| `esp:4` | `ds18b20:DQ` | blue | 1-Wire data |
| `ds18b20:DQ` | `r_pullup:1` | blue | pull-up |
| `esp:3V3` | `r_pullup:2` | red | sisi lain pull-up |

**Nama pin part Wokwi bisa berbeda antar versi.** Arahkan kursor ke pin di simulator untuk melihat labelnya. Jika `ds18b20` memakai label `VDD` bukan `VCC`, sesuaikan. Jika part `wokwi-ds18b20` tidak ditemukan di akun Anda, alternatif: `wokwi-ds18b20` tetap yang benar; pastikan ekstensi Wokwi terbaru.

Terverifikasi 26 Okt 2026 pada CLI 0.29.1: pin GND di `board-esp32-devkit-c-v4` bernama `GND.1`, `GND.2`, `GND.3` (bukan `GND`), dan semua pin DS18B20 memakai `VCC`/`GND`/`DQ`.

### 3.3 `diagram.json` acuan

> **Sudah diterapkan 26 Okt 2026** di `simulation/wokwi/diagram.json`. Blok di bawah adalah
> isi file yang benar-benar dipakai dan sudah lulus `wokwi-cli lint` (0 error) serta
> menjalankan dua skenario demo. Perhatikan tiga koreksi terhadap draf awal bab ini:
>
> 1. Atribut `value` part `wokwi-potentiometer` **hanya menerima 0–1023**, bukan ADC mentah
>    12-bit. Nilai harus dikonversi: `value = ADC × 1023 / 4095`. Draf awal menulis
>    `"value": "2000"` yang tidak akan pernah menghasilkan ADC 2000.
> 2. Pin GND pada `board-esp32-devkit-c-v4` bernama `GND.1`, `GND.2`, `GND.3` — bukan `GND`.
> 3. OLED dilewati. Serial monitor cukup, dan menghindari satu dependensi grafis.

```json
{
  "version": 1,
  "author": "VolatiSafe AIoT — Hafiiz",
  "editor": "wokwi",
  "parts": [
    { "type": "board-esp32-devkit-c-v4", "id": "esp", "top": 0, "left": 0, "attrs": {} },
    { "type": "wokwi-potentiometer", "id": "pot_moist", "top": -140, "left": -120, "attrs": { "value": "624" } },
    { "type": "wokwi-potentiometer", "id": "pot_ph", "top": -140, "left": -40, "attrs": { "value": "318" } },
    { "type": "wokwi-potentiometer", "id": "pot_batt", "top": -140, "left": 40, "attrs": { "value": "600" } },
    { "type": "wokwi-ds18b20", "id": "ds18b20", "top": -140, "left": 160, "attrs": { "temperature": "34.5" } },
    { "type": "wokwi-resistor", "id": "r_pullup", "top": -50, "left": 160, "attrs": { "value": "4700" } }
  ],
  "connections": [
    [ "esp:3V3", "pot_moist:VCC", "red", [] ],
    [ "esp:GND.1", "pot_moist:GND", "black", [] ],
    [ "pot_moist:SIG", "esp:34", "green", [] ],

    [ "esp:3V3", "pot_ph:VCC", "red", [] ],
    [ "esp:GND.1", "pot_ph:GND", "black", [] ],
    [ "pot_ph:SIG", "esp:32", "green", [] ],

    [ "esp:3V3", "pot_batt:VCC", "red", [] ],
    [ "esp:GND.1", "pot_batt:GND", "black", [] ],
    [ "pot_batt:SIG", "esp:35", "green", [] ],

    [ "esp:3V3", "ds18b20:VCC", "red", [] ],
    [ "esp:GND.1", "ds18b20:GND", "black", [] ],
    [ "esp:4", "ds18b20:DQ", "blue", [] ],
    [ "ds18b20:DQ", "r_pullup:1", "blue", [] ],
    [ "esp:3V3", "r_pullup:2", "red", [] ]
  ]
}
```

**Jangan mengatur slider manual untuk nilai yang harus persis.** Potensiometer hanya punya
1024 langkah, sehingga ADC 2496 tidak bisa dicapai (624 → 2498, 623 → 2494). Untuk angka
demo yang harus tepat seperti tabel §5.2–5.4, pakai skenario YAML dengan kontrol `position`
(float 0–1): `position = ADC / 4095`. Contoh lengkap ada di
`simulation/wokwi/scenario_a.yaml` dan `scenario_b.yaml`.

OLED opsional. Jika suatu saat dipakai, tambahkan `Adafruit_SSD1306` hanya di build `[env:wokwi]`
agar tidak membebani flash build fisik.

---

## 4. `wokwi.toml` dan Build

```toml
[wokwi]
version = 1
firmware = "../../firmware/.pio/build/wokwi/firmware.bin"
elf = "../../firmware/.pio/build/wokwi/firmware.elf"
```

Path relatif terhadap lokasi `wokwi.toml`.

### 4.1 Alur menjalankan

Tiga jalur, pilih sesuai kebutuhan.

**A. CLI dengan skenario otomatis (dipakai untuk bukti HW-2.x/HW-5.x)**

```powershell
pio run -e wokwi --project-dir firmware
wokwi-cli simulation/wokwi --timeout 30000 --scenario scenario_a.yaml --serial-log-file out.txt
```

`--scenario` menerima path relatif terhadap **direktori proyek** (`simulation/wokwi`), bukan
terhadap cwd — `simulation/wokwi/scenario_a.yaml` akan gagal dengan "scenario file not found".
`wait-serial` di dalam skenario berfungsi sebagai asersi: teks tidak cocok → exit non-zero,
jadi perintah ini tidak bisa "lulus" karena timeout.

**B. VS Code (interaktif, untuk demo)**

```powershell
code simulation\wokwi
# lalu Ctrl+Shift+P -> "Wokwi: Start Simulator"
```

**C. Tanpa skenario, lihat Serial apa adanya**

```powershell
wokwi-cli simulation/wokwi --timeout 25000
```

Catatan penting untuk bukti: `wokwi-cli` **memakai flash bersih setiap run**. Isi NVS tidak
bertahan antar run, jadi uji "simpan kalibrasi → reboot → nilai bertahan" tidak bisa
dibuktikan di simulasi (lihat DEC-IOT-17, diverifikasi di HW-9.2).

Jika ekstensi mengeluh `wokwi.toml not found`, buka folder `simulation/wokwi` sebagai workspace (bukan root repo), atau salin `wokwi.toml` ke root repo sebagai symlink-equivalent. Ekstensi mencari `wokwi.toml` di root workspace yang dibuka.

### 4.2 Konfigurasi WiFi & MQTT di build Wokwi

Build flag di `[env:wokwi]` (`04_FIRMWARE_CORE.md` §2):

| Flag | Nilai | Keterangan |
|---|---|---|
| `SIM_WIFI_SSID` | `Wokwi-GUEST` | SSID bawaan Wokwi, tanpa password |
| `SIM_MQTT_HOST` | `host.wokwi.internal` | Alias ke `localhost` mesin Anda |
| `SIM_MQTT_PORT` | `1883` | |
| `SIM_FAST_CYCLE` | aktif | tidur 10 detik, bukan 900 detik |
| `SIM_NODE` | aktif | `NODE_ID` = `VS-SIM-001` |

Jika `host.wokwi.internal` tidak bisa dijangkau:

1. Cari IP LAN mesin: `ipconfig` → `IPv4 Address` (mis. `192.168.1.10`).
2. Override: `pio run -e wokwi --project-dir firmware --build-flag="-DSIM_MQTT_HOST=\"192.168.1.10\""`
3. Pastikan Windows Firewall mengizinkan port 1883 masuk.

---

## 5. Tiga Skenario Demo — Nilai Konkret

Nilai di bawah dihitung dari kalibrasi default `config.h`: `MOISTURE_DRY_ADC=2800`, `MOISTURE_WET_ADC=1350`, `PH_NEUTRAL_ADC=1500`, `PH_SLOPE=300`.

### 5.1 Cara mengatur potensiometer

Cara paling andal: **jangan menebak posisi slider**. Geser slider, baca `[SENS]` di Serial, hentikan saat nilainya mencapai target. Tabel berikut adalah target yang harus Anda kejar.

**Penting — arah terbalik untuk kelembaban:** sensor kapasitif asli mengeluarkan tegangan **tinggi saat kering** dan **rendah saat basah**. Jadi semakin basah → ADC semakin kecil → slider potensiometer justru diturunkan. Ini sering membuat orang salah mengatur.

### 5.2 Tabel konversi kelembaban

`ADC = 2800 - (target% / 100) × (2800 - 1350)`

| Target % VWC | ADC | Tegangan di GPIO34 |
|---|---|---|
| 0 | 2800 | 2,256 V |
| **21** (Skenario A) | **2496** | **2,011 V** |
| 22 | 2481 | 1,999 V |
| **42** (Skenario B) | **2191** | **1,766 V** |
| 50 | 2075 | 1,672 V |
| 100 | 1350 | 1,088 V |

### 5.3 Tabel konversi pH (memperhitungkan kompensasi)

Firmware menghitung `ph_raw = 7 - (ADC - 1500)/300`, lalu `ph_corrected = ph_raw + 0.15 × (50 - moisture)/50`.

Artinya: **nilai yang dikirim payload bukan `ph_raw`.** Anda harus mengatur potensiometer agar hasil **terkoreksi** sesuai target.

| Target `ph` di payload | Moisture saat itu | `ph_raw` yang dibutuhkan | ADC yang diatur |
|---|---|---|---|
| **7,85** (Skenario A) | 21 % | 7,763 | **1271** |
| **6,80** (Skenario B) | 42 % | 6,776 | **1567** |
| 7,00 | 50 % | 7,000 | 1500 |
| 7,83 (contoh kontrak) | 22,4 % | 7,746 | 1276 |

Rumus: `ADC = 1500 - (ph_raw - 7) × 300`

### 5.4 Tabel baterai

`ADC = 4095 × (V_bat / 2) / 3.3`

| Target `b` | Tegangan di GPIO35 | ADC |
|---|---|---|
| 4,20 V (penuh) | 2,100 V | 2606 |
| **3,87 V** (default demo) | **1,935 V** | **2401** |
| 3,70 V | 1,850 V | 2296 |
| 3,30 V | 1,650 V | 2048 |
| 3,00 V (low battery) | 1,500 V | 1861 |

### 5.5 Skenario A — Terik Ekstrem (High Risk)

| Parameter | Target payload | Set potensiometer ke | DS18B20 |
|---|---|---|---|
| Kelembaban | `m: 21.0` | ADC 2496 | — |
| Suhu tanah | `t: 34.5` | — | 34,5 °C |
| pH | `ph: 7.85` | ADC 1271 | — |
| Baterai | `b: 3.87` | ADC 2401 | — |

Payload yang harus muncul di Serial:

```json
{"n":"VS-SIM-001","ts":1792934400,"m":21.0,"t":34.5,"ph":7.85,"b":3.87}
```

Respons sistem yang diharapkan ([`../WOKWI_SIMULATION.md`](../WOKWI_SIMULATION.md) §3):
1. Digital Twin mendeteksi defisit air perakaran kritis
2. AI Engine → **AVRI ±78 % (Kritis)**
3. Dashboard banner merah *"JANGAN TABUR UREA SEKARANG"*
4. Bot Telegram/WA mengirim alert

**Cara mengubah suhu DS18B20 di Wokwi:** klik part DS18B20 → panel atribut → ubah `temperature`. Bisa juga lewat Serial Wokwi dengan perintah `ds18b20 set 34.5` (tergantung versi part). Jika tidak bisa, ubah atur atribut saat simulasi dijeda.

### 5.6 Skenario B — Hujan Sore (Safe Window)

| Parameter | Target payload | Set potensiometer ke | DS18B20 |
|---|---|---|---|
| Kelembaban | `m: 42.0` | ADC 2191 | — |
| Suhu tanah | `t: 26.0` | — | 26,0 °C |
| pH | `ph: 6.80` | ADC 1567 | — |
| Baterai | `b: 3.90` | ADC 2420 | — |

Respons: AI → **AVRI ±18 % (Aman)** → dashboard hijau → preskripsi *"WAKTU TEPAT MENABUR UREA: jendela aman 120 menit"*.

### 5.7 Skenario C — Dropout (Failover Digital Twin)

Cara paling praktis untuk demo 2 menit:

1. Pastikan node sudah mengirim minimal 2 paket (Skenario A atau B).
2. **Hentikan simulasi** (tombol Stop di Wokwi). Node dianggap mati.
3. Backend melihat `last_seen` bertambah.

Ambang failover ([`../ARCHITECTURE_IOT.md`](../ARCHITECTURE_IOT.md) §9.3):

| Waktu sejak paket terakhir | Mode |
|---|---|
| < 30 menit | Live |
| 30 menit – 12 jam | **Failover Imputation** |
| > 12 jam | Warning Critical |
| > 24 jam | Node Offline |

**Ketidaksesuaian yang perlu dicatat:** `../WOKWI_SIMULATION.md` §3 Skenario C menyebut "putus 2 jam", sedangkan ambang masuk mode imputasi sebenarnya **30 menit**. Keduanya masih dalam rentang imputasi, jadi tidak salah — tetapi untuk demo, **35 menit sudah cukup** dan jauh lebih praktis. Ini dicatat sebagai `DEC-IOT-10`.

**Masalah praktis:** Anda tidak bisa menunggu 35 menit di tengah video 2 menit. Tiga opsi:

| Opsi | Cara | Kualitas bukti |
|---|---|---|
| **C1. Rekam terpisah** | Rekam paket terakhir, hentikan simulasi, tunggu 35 menit (sambil kerja lain), rekam dashboard yang menampilkan `[Est-Simulated]`, sambung di edit | **Paling jujur** |
| C2. Minta trigger backend | Syifa menambahkan cara memundurkan `last_seen` / endpoint uji failover | Cepat, tapi mengubah backend |
| C3. Manipulasi jam | Ubah waktu sistem saat simulasi berhenti | Tidak disarankan — merusak timestamp data lain |

**Keputusan:** gunakan C1. Sisipkan teks di video: *"node dimatikan 35 menit — dashboard tetap kontinu dengan label [Est-Simulated]"*.

---

## 6. Batasan Simulasi & Jawaban untuk Juri

| Pertanyaan juri | Jawaban yang benar |
|---|---|
| "Ini LoRa asli?" | "Bukan. Wokwi tidak punya part SX1278. Firmware, payload, dan logika sensor identik; hanya hop radio yang disimulasikan via MQTT. Uji LoRa fisik dijadwalkan Bulan 3 setelah insentif cair." |
| "Berapa jangkauan LoRa-nya?" | "Target desain 2–5 km *line-of-sight* pada 433 MHz SF7 +17 dBm, mengacu datasheet SX1278 dan ADR 002. Belum diukur; pengukuran RSSI terjadwal di fase TKT 4–5." |
| "Berapa konsumsi daya sebenarnya?" | "Estimasi arsitektur 0,057 mAh/siklus. Arus tidur nyata akan diukur pada prototipe fisik; board development tidak mencapai 10 µA karena regulator dan USB-UART." |
| "Payload-nya 52 byte?" | "Panjang terukur 70 byte JSON untuk payload contoh. Batas 52 byte hanya tercapai pada format biner 13 byte. 70 byte tetap sah untuk SF7; kami sedang meninjau klaim dokumen dengan Lead Architect." |
| "pH diukur langsung di tanah?" | "Prototipe memakai probe BNC di tanah dengan kompensasi kelembaban, dengan keterbatasan akurasi yang kami nyatakan. Untuk TKT 6 kami mengevaluasi chamber slurry atau sensor RS485." |
| "Kenapa tidak ada ACK LoRa?" | "Library LoRa mengonfirmasi paket terkirim, bukan diterima. Retry kami bersifat lokal. Celah data ditangani failover Digital Twin. Protokol ACK kustom dipertimbangkan untuk TKT 6 dengan konsekuensi daya." |

Semua angka di tabel ini konsisten dengan analisis di [`09_RISIKO_DAN_KEPUTUSAN.md`](09_RISIKO_DAN_KEPUTUSAN.md).

---

## 7. Checklist FASE 5

- [ ] `diagram.json` valid, Wokwi membuka tanpa error
- [ ] Semua sensor analog di pin ADC1 (34, 32, 35)
- [ ] Pull-up 4,7 kΩ terpasang di DQ DS18B20
- [ ] `pio run -e wokwi` → `SUCCESS`
- [ ] `wokwi.toml` menunjuk path yang benar (relatif, bukan absolut)
- [ ] Serial mencetak `[SIM] Build simulasi ...` dan `[SIM] FAST CYCLE ...`
- [ ] Payload muncul di `mosquitto_sub`
- [ ] Tiga skenario dijalankan; nilai payload sesuai tabel §5
- [ ] Screenshot rangkaian resolusi tinggi tersimpan
- [ ] Link Wokwi dapat dibuka orang lain (atau file `.json` + `.ino`/ELF siap unggah)
