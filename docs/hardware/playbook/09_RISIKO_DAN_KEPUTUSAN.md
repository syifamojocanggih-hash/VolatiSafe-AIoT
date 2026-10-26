# 09_RISIKO_DAN_KEPUTUSAN.md — Risk Register & Decision Log Domain IoT

> **Peran:** mencegah keputusan teknis diambil ulang tanpa konteks, dan mencegah temuan hilang.
> **Aturan:** setiap penyimpangan dari `../TASK_GUIDE.md`, `../FIRMWARE_SPEC.md`, atau `../../universal/*` **wajib** punya entri `DEC-IOT-*` di sini sebelum kode ditulis.
> **Keputusan yang menyentuh kontrak lintas domain ditandai 🔺 dan wajib dieskalasi ke Aris.**

---

## Bagian A — Decision Log

### DEC-IOT-01 — Abstraksi Transport: LoRa (fisik) vs MQTT (Wokwi)

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ✅ Diputuskan |
| **Konteks** | Wokwi tidak memiliki part `SX1278`. Target produk tetap LoRa 433 MHz (ADR 002). |
| **Keputusan** | Pisahkan **transport** dari **logika**. `transport.h` mendefinisikan antarmuka; `transport_lora.cpp` (build fisik) dan `transport_mqtt.cpp` (build Wokwi) mengimplementasikannya. `sensors.cpp`, `payload.cpp`, `calibration.cpp` **tidak berubah** di kedua build, dipilih lewat `build_src_filter`. |
| **Alternatif ditolak** | (a) Mock `LoRa.h` yang mencetak ke Serial — menambah lapisan palsu, sulit dibuktikan ke juri. (b) Wokwi Custom Chip SDK untuk emulasi register SX1278 — realistis tapi > 1 hari kerja, risiko tinggi untuk deadline 31 Okt. (c) Tidak simulasi LoRa sama sekali — kehilangan alur end-to-end. |
| **Konsekuensi** | TKT 3 **tidak** membuktikan LoRa PHY. Harus dinyatakan jujur di proposal dan video. Uji LoRa fisik di TKT 4 (HW-9.3). |
| **Bukti paritas** | `payload.cpp` dan `sensors.cpp` identik byte-per-byte; perbedaan hanya di `platformio.ini` + satu file transport. |

### DEC-IOT-02 — Payload 70 Byte, Bukan "≤ 52 Byte" 🔺

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ⚠️ Menunggu eskalasi |
| **Konteks** | Empat dokumen menyebut payload ≤ 52 byte: `INTERFACES.md` §1.2, `TELEMETRY_PAYLOAD.md` §1, `TASK_GUIDE.md` HW-1.3, `ARCHITECTURE_IOT.md` §6.1. |
| **Temuan** | Payload contoh diukur: **70 byte** (`VS-A1-003`), **71 byte** (`VS-SIM-001`), **76 byte** kasus terburuk (Node ID 12 karakter + nilai maksimum). Klaim 52 byte **tidak dapat dicapai** dengan skema JSON 6-key ini. |
| **Keputusan** | Tetap pakai JSON 6-key (kontrak tidak berubah). Buffer `PAYLOAD_BUF_SIZE = 96`. Dokumentasikan ukuran sebenarnya. |
| **Mengapa tidak beralih ke biner 13 byte** | Biner mengubah kontrak, memerlukan perubahan adapter, dan menghilangkan keterbacaan saat demo. Untuk SF7/BW125, 76 byte jauh di bawah batas 255 byte LoRa — **tidak ada masalah teknis**. Yang salah adalah angka di dokumen, bukan desainnya. |
| **Tindakan** | Eskalasi ke Aris. Usulkan koreksi teks di empat dokumen menjadi "≤ 80 byte (JSON), 13 byte (biner opsional)". **Jangan edit `INTERFACES.md` sendiri.** |
| **Dampak bila tidak dikoreksi** | Juri teknis dapat menemukan ketidaksesuaian klaim vs kode. Integritas proposal dipertaruhkan. |

### DEC-IOT-03 — Dua Node ID: Fisik vs Simulasi

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ✅ Diputuskan |
| **Konteks** | `config.h` memakai `VS-A1-003`; `../WOKWI_SIMULATION.md` §1 memakai `VS-SIM-001` pada contoh topik MQTT. |
| **Keputusan** | Build fisik → `VS-A1-003`; build Wokwi → `VS-SIM-001`, dipilih lewat `#if defined(SIM_NODE)` di `config.h`. Tidak memakai build flag string (`-D NODE_ID="..."`) karena *quoting* di `platformio.ini` rapuh di Windows. |
| **Alasan** | Data simulasi harus dapat dibedakan dari data lapangan di database. Mencampur keduanya akan mengotori analisis. |
| **Tindakan lintas domain** | Beri tahu Syifa bahwa `nodes` harus memiliki baris untuk `VS-SIM-001`, atau bahwa ID ini dipakai khusus demo. |

### DEC-IOT-04 — Anggaran BoM Melebihi Plafon & Gateway Tidak Dianggarkan 🔺

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ⚠️ Menunggu keputusan Lead |
| **Temuan 1** | BoM resmi Rp305.000/node × 10 = **Rp3.050.000** > plafon Rp3.000.000. |
| **Temuan 2** | BoM tidak memuat resistor pull-up 4,7 kΩ, divider baterai, divider pH, kabel, header — total ±Rp12.500/node. Tanpa ini rangkaian **tidak berfungsi**. |
| **Temuan 3** | BoM **tidak memuat gateway** sama sekali (ESP32 + LoRa RX + adaptor + enclosure ≈ Rp165.000). |
| **Keputusan diusulkan** | 9 node + 1 gateway, enclosure ABS untuk node di bawah kanopi: 9 × Rp299.500 + Rp165.000 = **Rp2.860.500**, sisa Rp139.500 untuk cadangan probe. |
| **Alternatif** | 8 node + gateway Rp2.705.000 (sisa lebih besar, tapi klaim "mesh" lebih lemah). |
| **Tindakan** | Ajukan ke Aris. **Jangan menulis "10 node" di proposal** bila anggaran tidak mencukupi — ini akan menjadi temuan audit insentif. |

### DEC-IOT-05 — Klaim Arus Deep Sleep 10 µA Tidak Realistis

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ✅ Diputuskan (dengan catatan proposal) |
| **Konteks** | `../FIRMWARE_SPEC.md` §3 dan `../ARCHITECTURE_IOT.md` §4.3 mengklaim 10 µA dan ketahanan 477 hari. |
| **Temuan** | NodeMCU V1 30-pin memuat regulator AMS1117 (Iq 5–11 mA) dan CP2102. Arus tidur realistis **2–10 mA**, bukan 10 µA. Dengan 5 mA, ketahanan 2600 mAh hanya **±21 hari**, bukan 477 hari. |
| **Keputusan** | Prototipe TKT 4 memakai dev board + panel surya 1 W (surplus 110 mAh/hari vs 53 mAh/hari konsumsi). Desain final memakai ESP32-WROOM-32 bare + LDO low-Iq (MCP1700, Iq 1,6 µA). |
| **Konsekuensi proposal** | Klaim harus berbunyi "target < 15 µA pada desain final", **bukan** "terukur 10 µA". Panel surya wajib disebut sebagai bagian dari solusi daya, bukan aksesori. |
| **Tindakan** | Ukur arus nyata di HW-9.1 (F-04) dan perbarui tabel power budget dengan angka terukur. |

### DEC-IOT-06 — Filter: Median-Average (bukan Median Sejati)

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ✅ Diputuskan |
| **Konteks** | `TASK_GUIDE.md` HW-1.2 menyebut "buang min & max, rata-rata 3 nilai tengah" (median-average). `FIRMWARE_SPEC.md` §1 & §2.1 menyebut "Median". Untuk 5 sampel, keduanya berbeda pada input tertentu. |
| **Keputusan** | Pakai **median-average**. |
| **Alasan** | Median sejati 5 sampel membuang 2 nilai dari tiap sisi; median-average membuang 1 min + 1 max lalu merata-rata. Median-average lebih halus (mengurangi noise acak) sambil tetap tahan satu outlier per sisi. Untuk 5 sampel, perbedaan hasil ≤ 1 LSB ADC. |
| **Keterbatasan yang diterima** | Bila ada **dua** outlier di sisi yang sama (mis. `{0,0,4095,4095,2048}`), hanya satu yang terbuang. Hasil 2047,67 vs median sejati 2048 — selisih tidak signifikan. |
| **Tindakan** | Tulis di komentar fungsi dan di README firmware agar tidak "diperbaiki" orang lain tanpa konteks. |

### DEC-IOT-07 — Kontrak Tidak Punya Field Status/Error 🔺

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ✅ Diputuskan (sementara) |
| **Konteks** | Firmware mendeteksi `SENSOR_DISCONNECTED`, `SENSOR_UNSTABLE`, `SENSOR_OUT_OF_RANGE`. `INTERFACES.md` §1.2 hanya punya 6 key, tanpa tempat menaruh status. |
| **Keputusan** | **Tidak** menambah key. Status internal hanya untuk log Serial. Untuk suhu putus, kirim `t = -999` (mekanisme yang sudah ada di `config.h` dan sudah ditolak `validate_sensor_bounds()`). Kanal lain: kirim nilai asli tanpa clamp. |
| **Alasan** | Menambah key akan memecahkan adapter Syifa (`raw_json["n"]` dst. memakai akses langsung). Kontrak hanya boleh berubah lewat Lead. |
| **Usulan jangka panjang** | Tambah key opsional `"q"` (array status 3 bit) bila TKT 4 membutuhkan diagnosa kualitas per kanal. Harus lewat `GIT_WORKFLOW.md` §6. |
| **Konsekuensi** | Backend tidak bisa membedakan "sensor basah sebagian" dari "tanah memang basah". Diterima untuk TKT 3–5. |

### DEC-IOT-08 — LoRa Tidak Punya ACK; "Retry jika Tidak Ada ACK" Tidak Dapat Diimplementasikan

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ✅ Diputuskan |
| **Konteks** | `TASK_GUIDE.md` HW-1.3 menyebut "retry maksimal 3× jika tidak ada ACK gateway". |
| **Temuan** | Library `sandeepmistry/LoRa` dengan mode *explicit header* satu arah: `endPacket()` mengembalikan 1 bila modul selesai memancarkan, **bukan** bila gateway menerima. Tidak ada ACK di level library. |
| **Keputusan** | TKT 4: retry hanya pada kegagalan lokal (modul belum siap / `endPacket` gagal). Tidak ada jaminan sampai. Celah data ditangani Digital Twin. |
| **Alternatif (TKT 6)** | Protokol ACK 1 byte: node `startReceive()` dengan timeout 500 ms setelah TX. Konsekuensi: menambah 500 ms waktu aktif → +0,012 mAh/siklus (+21 % anggaran daya). Perlu keputusan terpisah. |
| **Tindakan** | Perbaiki teks `TASK_GUIDE.md` HW-1.3 agar tidak menjanjikan hal yang tidak ada. |

### DEC-IOT-09 — Timestamp Tanpa Internet di Lapangan 🔺

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ⚠️ Menunggu koordinasi dengan Syifa |
| **Konteks** | Node lapangan tidak punya internet (ADR 002). `time(nullptr)` akan mengembalikan waktu salah. Di Wokwi, WiFi tersedia sehingga masalah ini **tersembunyi** sampai TKT 4. |
| **Keputusan TKT 3** | Pakai NTP (`configTime`) di build Wokwi. Akui bahwa ini tidak mewakili lapangan. |
| **Opsi TKT 4** | (A) Gateway menstempel ulang `ts` saat terima — paling akurat, **mengubah kontrak**; (B) RTC DS3231 (+Rp15.000/node); (C) offset di NVS + `millis`; (D) `ts` di NVS + tambah 900 s tiap siklus. |
| **Rekomendasi** | (A) untuk akurasi, atau (B) bila kontrak tidak boleh berubah. (D) paling murah tapi punya error kumulatif bila siklus terlewat. |
| **Dampak bila salah** | Grafik dashboard tidak kronologis; TimescaleDB hypertable salah partisi. Ini merusak seluruh alur AI. **Prioritas tinggi.** |

### DEC-IOT-10 — Ambang Failover 30 Menit vs "2 Jam" di Dokumen

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ✅ Diputuskan |
| **Konteks** | `../WOKWI_SIMULATION.md` §3 Skenario C menyebut "putus 2 jam". `../ARCHITECTURE_IOT.md` §9.3 menyatakan mode imputasi dimulai pada **30 menit**. |
| **Keputusan** | Tidak ada kontradiksi teknis (2 jam > 30 menit, keduanya dalam mode imputasi). Untuk demo, gunakan **35 menit** agar praktis. |
| **Tindakan** | Rekam Skenario C terpisah (§5.7 `05_WOKWI_SIMULASI.md`), sambungkan saat edit. Jangan menunggu 2 jam di depan kamera. |

### DEC-IOT-11 — `rssi_dbm` / `snr_db` Tidak Bisa Di-inject Tanpa Mengubah Kontrak 🔺

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ⚠️ Menunggu keputusan Aris |
| **Konteks** | `INTERFACES.md` §1.3 mencantumkan `rssi_dbm` dan `snr_db` pada payload bersih. `ARCHITECTURE_IOT.md` §6.3 menyatakan "di-inject oleh gateway dari metadata radio". |
| **Temuan** | Gateway hanya punya dua cara meneruskan metadata: (a) menambah key ke JSON → melanggar kontrak 6-key; (b) topik terpisah → butuh topik baru + perubahan ingestion. Mosquitto sendiri tidak menyimpan metadata radio. |
| **Keputusan** | **Tidak diimplementasikan** di TKT 3–4 sampai ada keputusan. Gateway meneruskan payload apa adanya. |
| **Usulan** | Key opsional `"rssi"` dan `"snr"` di payload MQTT (bukan di payload LoRa), dengan adapter mengabaikannya bila absen. Butuh persetujuan karena `INTERFACES.md` §1.3 sudah mengklaim field ini ada. |

### DEC-IOT-12 — Probe pH di Tanah: Keterbatasan Metodologis 🔺

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ✅ Diputuskan (dengan pengakuan keterbatasan) |
| **Konteks** | Probe pH BNC dirancang untuk larutan, bukan tanah padat. Menancapkan langsung ke tanah kering menghasilkan bacaan melayang dan mempercepat kerusakan junction kaca. Praktik agronomi standar: suspensi tanah:air 1:2,5. |
| **Keputusan** | TKT 4–5: Opsi A (probe di tanah + kompensasi kelembaban) untuk kelayakan biaya. TKT 6: evaluasi Opsi B (chamber slurry) atau C (sensor RS485 industrial, +Rp300k/node). |
| **Konsekuensi** | Jangan mengklaim akurasi laboratorium. Siapkan jawaban untuk juri (`05_WOKWI_SIMULASI.md` §6). |
| **Bobot di AI** | `ph` menyumbang 16 % fitur AI (`MODEL_SPEC.md` §3). Kesalahan pH sistematis akan menggeser AVRI. Perlu validasi lapangan (F-03) sebelum klaim akurasi. |

### DEC-IOT-13 — Risiko Power Gate pada Modul dengan Ground Bersama

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ✅ Diputuskan (perlu uji) |
| **Konteks** | Power gate N-channel low-side memutus GND sensor. Untuk modul pH yang ground-nya bersama dengan ESP32 dan output analog-nya terhubung ke GPIO32, memutus GND dapat membuat arus mengalir balik lewat jalur proteksi pin dan merusak ESP32. |
| **Keputusan** | Uji di Tahap 1 (HW-9.1). Mitigasi: (a) dioda Schottky dari pin analog ke 3,3 V; atau (b) power gate hanya untuk sensor kapasitif + DS18B20, modul pH selalu menyala. |
| **Konsekuensi bila (b)** | Modul pH ±10 mA selalu mengalir → konsumsi harian naik ±240 mAh → **melebihi kapasitas baterai**. Karena itu (a) lebih disukai, atau pindah ke P-channel high-side. |
| **Tindakan** | Ukur arus saat GPIO25 LOW (F-05). Bila ada arus bocor lewat jalur analog, terapkan mitigasi (a). |

### DEC-IOT-14 — Encoder Memakai `snprintf`, Bukan ArduinoJson

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ✅ Diputuskan |
| **Konteks** | `platformio.ini` memuat `ArduinoJson` sesuai `TASK_GUIDE.md` HW-1.1. |
| **Keputusan** | TX memakai `snprintf` ke buffer tetap. `ArduinoJson` hanya dipakai untuk **membaca** payload di gateway (downlink / parsing). |
| **Alasan** | Kontrol penuh jumlah desimal (`%.1f` / `%.2f`), panjang pasti, nol alokasi dinamis, dan dapat diuji native tanpa Arduino. `ArduinoJson` v7 memakai heap; untuk 6 field statis itu tidak perlu. |
| **Konsekuensi** | `ArduinoJson` tetap di `lib_deps` karena dipakai gateway. Dokumentasikan agar tidak dianggap dependensi mati. |

### DEC-IOT-15 — `SIM_FAST_CYCLE` untuk Demo

| | |
|---|---|
| **Tanggal** | 26 Okt 2026 |
| **Status** | ✅ Diputuskan |
| **Konteks** | Deep sleep 15 menit membuat demo mustahil (1 paket per 15 menit). |
| **Keputusan** | Build Wokwi memakai tidur 10 detik, dengan **cetakan Serial eksplisit** bahwa ini bukan perilaku produksi. |
| **Risiko** | Seseorang (termasuk juri) dapat menyimpulkan firmware produksi tidur 10 detik. Mitigasi: peringatan di Serial, di README, dan di narasi video. |

---

## Bagian B — Risk Register

Probabilitas & dampak: T = Tinggi, S = Sedang, R = Rendah.

| ID | Risiko | P | D | Mitigasi | Pemilik |
|---|---|---|---|---|---|
| R-01 | Waktu habis sebelum FASE 5 (Wokwi) selesai | T | T | Ikuti jalur kritis §2 di `03_ROADMAP_TUGAS.md`; potong task non-esensial (§14) | Hafiiz |
| R-02 | Wokwi tidak bisa menjangkau broker lokal | S | T | Uji `host.wokwi.internal` lebih dulu (HW-5.4); cadangan pakai IP LAN + buka firewall | Hafiiz |
| R-03 | Backend Syifa belum siap saat HW-7.2 | T | S | Bukti integrasi bisa berupa payload di `mosquitto_sub` + validator; jadwalkan HW-7.2 lebih lambat | Hafiiz + Syifa |
| R-04 | Klaim 52 byte terbukti salah di depan juri | S | T | DEC-IOT-02: koreksi dokumen + jawaban jujur di video | Hafiiz → Aris |
| R-05 | Kuota simulasi Wokwi habis saat demo | S | T | Uji penuh H-1; rekam semua segmen H-1; jangan simulasi berulang hari-H | Hafiiz |
| R-06 | Broker tanpa auth di WiFi publik saat demo | S | T | Aktifkan `password_file`; demo di hotspot pribadi | Hafiiz |
| R-07 | `.pio/` ter-commit (315 MB artefak) | S | S | `git add <path>` eksplisit sampai `.gitignore` ada (HW-0.4) | Hafiiz → Aris |
| R-08 | Arus deep sleep nyata jauh di atas klaim → klaim daya gugur | T | T | Dek-IOT-05: ganti klaim ke "target desain", tambahkan panel surya | Hafiiz |
| R-09 | Python 3.13 tidak kompatibel dengan backend (butuh 3.11) | S | S | venv terpisah per keperluan; catat untuk Syifa | Syifa |
| R-10 | Probe pH rusak saat uji lapangan | T | S | Beli 1 cadangan; jangan biarkan probe kering; rendam storage solution | Hafiiz |
| R-11 | Modul LoRa palsu / tidak sesuai spesifikasi | S | T | Uji di Tahap 1 dengan RSSI; beli dari toko bergaransi | Hafiiz |
| R-12 | Interferensi 433 MHz dari perangkat lain | S | S | Ganti `sync_word` bila perlu (harus sama node & gateway); uji di lokasi | Hafiiz |
| R-13 | Node brownout saat TX (beban 120 mA) | S | T | Kapasitor 470 µF di rel 3,3 V; urutan power gate (sensor OFF sebelum TX); baterai 2600 mAh | Hafiiz |
| R-14 | `ts` salah di lapangan → grafik kacau | T | T | Dek-IOT-09: putuskan mekanisme sebelum TKT 4 | Hafiiz + Syifa |
| R-15 | Wokwi mengubah nama pin part antar versi | S | R | Verifikasi tooltip pin; simpan `diagram.json` yang sudah terbukti | Hafiiz |
| R-16 | Kontrak berubah di tengah jalan tanpa koordinasi | S | T | Semua perubahan via `GIT_WORKFLOW.md` §6; validator lokal mendeteksi dini | Aris |
| R-17 | Enclosure tidak tahan hujan → korosi | S | T | Uji splash F-08; silica gel; sealant netral; posisi kabel masuk dari bawah | Hafiiz |
| R-18 | Baterai 18650 palsu (kapasitas jauh di bawah 2600 mAh) | S | S | Uji kapasitas Tahap 1 dengan beban diketahui | Hafiiz |

---

## Bagian C — Eskalasi ke Lead (`docs/universal/`)

Item 🔺 yang **tidak boleh** diselesaikan sendiri:

| # | Isu | Dokumen terdampak | Usulan |
|---|---|---|---|
| E-01 | Payload 70 byte, bukan 52 | `INTERFACES.md` §1.2, `TELEMETRY_PAYLOAD.md` §1, `TASK_GUIDE.md` HW-1.3, `ARCHITECTURE_IOT.md` §6.1 | Koreksi angka menjadi "≤ 80 byte JSON / 13 byte biner" |
| E-02 | Anggaran BoM melebihi plafon; gateway tidak dianggarkan | `PRD.md`, `08 §BoM`, proposal | 9 node + 1 gateway, atau kurangi node |
| E-03 | `rssi_dbm`/`snr_db` tidak bisa di-inject tanpa kontrak berubah | `INTERFACES.md` §1.3, `ARCHITECTURE_IOT.md` §6.3 | Tambah key opsional atau hapus klaim |
| E-04 | Timestamp tanpa internet | `INTERFACES.md` §1.2 | Putuskan: gateway restamp / RTC / NVS |
| E-05 | Retry "jika tidak ada ACK" tidak ada di library | `TASK_GUIDE.md` HW-1.3 | Koreksi teks; ACK kustom di TKT 6 |
| E-06 | Klaim 10 µA tidak realistis di dev board | `FIRMWARE_SPEC.md` §3, `ARCHITECTURE_IOT.md` §4.3 | Ubah ke "target desain final" |
| E-07 | Status sensor tidak punya tempat di kontrak | `INTERFACES.md` §1.2 | Opsional: key `q` |

**Cara mengeskalasi:** jangan buat PR ke `docs/universal/`. Buka issue/diskusi dengan Aris, sertakan entri `DEC-IOT-*` ini sebagai lampiran.

---

## Bagian D — Pertanyaan Terbuka

| # | Pertanyaan | Dibutuhkan sebelum | Pemilik jawaban |
|---|---|---|---|
| Q-01 | Apakah `VS-SIM-001` akan didaftarkan di tabel `nodes`? | HW-7.2 | Syifa |
| Q-02 | Apakah gateway boleh restamp `ts`? | HW-9.x | Aris |
| Q-03 | Apakah juri akan menuntut video LoRa fisik? | H-1 | Aris / Lead |
| Q-04 | Berapa kuota simulasi Wokwi akun tim? | HW-0.2 | Hafiiz (cek sendiri) |
| Q-05 | Siapa menyediakan `docker/mosquitto.conf`? | HW-0.3 | Syifa |
| Q-06 | Apakah `ArduinoJson` boleh dilepas dari `lib_deps` build fisik? | HW-1.2 | Hafiiz (keputusan lokal) |

---

## Bagian E — Ringkasan untuk Proposal

Bila hanya satu halaman yang dibaca Lead, ini isinya:

1. **Transport diabstraksi**: LoRa untuk fisik, MQTT untuk simulasi. Logika identik. Jujur di proposal.
2. **Payload 70 byte, bukan 52.** Perlu koreksi dokumen lintas domain.
3. **Anggaran kurang Rp340.000** bila 10 node + gateway. Usulkan 9 node + gateway.
4. **Arus tidur 10 µA tidak realistis** di dev board. Ganti klaim menjadi target desain + panel surya.
5. **Timestamp di lapangan belum terpecahkan.** Prioritas tinggi sebelum TKT 4.
6. **pH di tanah punya keterbatasan metodologis.** Nyatakan, jangan sembunyikan.
7. **Semua pengujian TKT 3 = software.** LoRa PHY belum diuji, dan itu dijadwalkan TKT 4.
