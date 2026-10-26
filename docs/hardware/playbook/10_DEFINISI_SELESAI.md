# 10_DEFINISI_SELESAI.md — Kriteria Selesai, PR, & Paket Serah Terima

> **Dipakai pada:** FASE 8 (HW-8.3, HW-8.4) dan FASE 9
> **Prinsip:** "selesai" berarti **ada bukti yang bisa dibuka orang lain**, bukan "sudah saya coba dan jalan".

---

## 1. Definition of Done — Umum

Sebuah task dianggap selesai hanya bila **keenam** syarat ini terpenuhi:

1. Kode ada di `firmware/`, `simulation/wokwi/`, atau `docs/hardware/` — **tidak** di luar itu.
2. `pio run -e esp32dev` lulus tanpa error.
3. `pio run -e wokwi` lulus tanpa error.
4. `pio test -e native` lulus (bila task menyentuh logika murni).
5. Bukti tersimpan di `docs/hardware/evidence/` sesuai [`07_TEST_PLAN.md`](07_TEST_PLAN.md) §6.
6. Status di [`00_INDEX.md`](00_INDEX.md) diperbarui menjadi `✅` dengan tautan bukti.

Tanpa nomor 5, status tetap `🟨`.

---

## 2. DoD per Fase

### FASE 0 — Lingkungan

| Kriteria | Cara verifikasi |
|---|---|
| Toolchain lengkap | `pio run --project-dir firmware` → `SUCCESS` |
| Lisensi Wokwi aktif | file ada di `~/.wokwi`, `wokwi-cli --version` merespons |
| Broker siap | `mosquitto_sub` menerima pesan uji |
| Hygiene repo | tidak ada `.pio/` yang akan ter-stage |
| Versi terkunci | `platform = espressif32@8.0.0`, `package-lock.json` ada |

### FASE 1 — Skeleton

| Kriteria | Cara verifikasi |
|---|---|
| Modul terpisah | 7 file `src/*.cpp` + 6 header ada |
| Dua env lulus | `pio run -e esp32dev` **dan** `-e wokwi` → `SUCCESS` |
| Kontrak internal | `TelemetryFrame` didefinisikan sekali di `types.h`, dipakai semua modul |
| Isolasi | `sensors.cpp` dan `payload.cpp` tidak meng-include `<WiFi.h>` / `<LoRa.h>` |

### FASE 2 — Sensor

| Kriteria | Cara verifikasi |
|---|---|
| Filter teruji | U-01 … U-06 PASS |
| Moisture teruji | U-07 … U-13 PASS |
| pH teruji | U-14 … U-22 PASS |
| Baterai teruji | U-23 … U-25 PASS |
| Kalibrasi persisten | setelah `pio run -t erase`, firmware tetap jalan + cetak peringatan |

### FASE 3 — Payload & Transport

| Kriteria | Cara verifikasi |
|---|---|
| Encoder teruji | U-26 … U-33 PASS |
| Bentuk payload | `{"n":"...","ts":...,"m":...,"t":...,"ph":...,"b":...}` — urutan & desimal sesuai kontrak |
| Panjang terukur | dicatat (70 / 71 / 76 byte), bukan diklaim 52 |
| Dua transport | hanya `transport_*.cpp` yang berbeda; `diff` bersih |
| Tidak bocor | `main.cpp` tidak meng-include `<LoRa.h>` atau `<WiFi.h>` |

### FASE 4 — Daya

| Kriteria | Cara verifikasi |
|---|---|
| Gate awal | GPIO25 `LOW` sebelum inisialisasi apa pun |
| Urutan benar | sensor OFF **sebelum** TX (log Serial membuktikan urutan) |
| Deep sleep | Serial mencetak wakeup reason; siklus aktif ≤ 3,5 s |
| Anggaran | total ≤ 0,07 mAh/siklus berdasarkan durasi **terukur** |

### FASE 5 — Wokwi

| Kriteria | Cara verifikasi |
|---|---|
| Rangkaian valid | Wokwi membuka tanpa error |
| ADC1 | pin 34, 32, 35 — bukan ADC2 |
| Pull-up | 4,7 kΩ terpasang di DQ |
| Data mengalir | 5 paket berturut di `mosquitto_sub`, `ts` monoton |

### FASE 6 — Gateway

| Kriteria | Cara verifikasi |
|---|---|
| Topik persis | garis miring di depan, `NODE_ID` benar |
| QoS/retain | 0 / false untuk telemetri |
| ACL menerima | payload lolos adaptor Syifa tanpa error |
| Validator lokal | `validate_payload.py` → `[OK]` |

### FASE 7 — Uji

| Kriteria | Cara verifikasi |
|---|---|
| Unit | 33 kasus PASS (U-01 … U-33) |
| Integrasi | I-01 … I-06 dijalankan, hasil dicatat |
| E2E | E-01 … E-03 dijalankan, kategori risiko sesuai |
| Bukti | 12 item di `07_TEST_PLAN.md` §6 lengkap |

### FASE 8 — Demo & Handover

| Kriteria | Cara verifikasi |
|---|---|
| Video | 2 menit, unlisted, tautan tersimpan |
| Screenshot | rangkaian + 3 dashboard, resolusi penuh |
| Link Wokwi | dapat dibuka incognito |
| Handover | dokumen §4 dikirim ke Syifa |
| PR | checklist §3 centang semua |

### FASE 9 — Fisik

| Kriteria | Cara verifikasi |
|---|---|
| Kalibrasi | F-01 … F-03 dalam toleransi |
| Daya | F-04, F-05 terukur dan tercatat |
| LoRa | F-06, F-07 lulus (RSSI > −110 dBm @ 2 km, loss < 10 %) |
| Enclosure | F-08 lulus splash + 24 jam |
| Otonomi | F-09 lulus 7 hari |
| Gateway | F-10 uptime ≥ 99 % |

---

## 3. Checklist Pull Request `iot` → `Development`

Ini adalah **checklist resmi** dari [`../../universal/GIT_WORKFLOW.md`](../../universal/GIT_WORKFLOW.md) §5.1, dilengkapi cara pembuktiannya.

| # | Item resmi | Cara membuktikan | Status |
|---|---|---|---|
| 1 | Kode C++ lulus kompilasi tanpa error di PlatformIO | tempel output `pio run -e esp32dev` & `-e wokwi` di deskripsi PR | ☐ |
| 2 | Ukuran payload LoRa terverifikasi ≤ 52 byte sesuai `INTERFACES.md` §1 | **perlu koreksi**: lihat DEC-IOT-02. Buktikan panjang sebenarnya (70/71/76) dan jelaskan | ☐ |
| 3 | Sirkuit virtual Wokwi memancarkan telemetri ke `localhost:1883` | tempel `evidence/I03_mqtt_rx.txt` | ☐ |
| 4 | Tidak ada modifikasi di luar `firmware/`, `simulation/wokwi/`, `docs/hardware/` | tempel output `git diff --stat Development...iot` | ☐ |

### 3.1 Checklist tambahan (internal IoT)

| # | Item | Cara membuktikan | Status |
|---|---|---|---|
| 5 | Unit test PASS | `evidence/unit_test_*.txt` | ☐ |
| 6 | Tiga skenario E2E dijalankan | `evidence/E01..E03_*` | ☐ |
| 7 | Payload lolos validator lokal | output `validate_payload.py` | ☐ |
| 8 | `.pio/` tidak ter-commit | `git show --stat` tidak memuat `.pio` | ☐ |
| 9 | Tidak ada kredensial/token di repo | `git grep -i "password\|token\|secret"` di area IoT | ☐ |
| 10 | Status board diperbarui | [`00_INDEX.md`](00_INDEX.md) | ☐ |

### 3.2 Cara menjalankan pemeriksaan terakhir

```powershell
# 1. build
pio run -e esp32dev --project-dir firmware
pio run -e wokwi    --project-dir firmware

# 2. test
pio test -e native --project-dir firmware

# 3. file yang berubah (harus hanya di 3 folder)
git diff --stat Development...iot

# 4. pastikan tidak ada .pio
git diff --name-only Development...iot | Select-String "\.pio"

# 5. kredensial
git grep -n -i -E "password|secret|api[_-]?key" -- firmware simulation docs/hardware

# 6. commit & push
git add firmware/src firmware/include firmware/platformio.ini
git add simulation/wokwi
git add docs/hardware
git commit -m "feat(iot): wokwi virtual testbed + mqtt transport (HW-1..HW-8)"
git push origin iot
```

Perintah 3 dan 4 harus menghasilkan: **tidak ada path di luar `firmware/`, `simulation/wokwi/`, `docs/hardware/`**.

### 3.3 Format pesan commit

Mengikuti `GIT_WORKFLOW.md` §7:

```
feat(iot): HW-3.3 implement LoRa transport with local retry
fix(iot): HW-2.4 correct pH compensation sign for high moisture
docs(iot): HW-8.3 add handover packet for backend
test(iot): HW-7.1 add 33 unit tests for sensor and payload
```

---

## 4. Paket Serah Terima ke Backend (HW-8.3)

Kirim ke Syifa sebagai satu dokumen (boleh berupa file `docs/hardware/evidence/HANDOVER.md`).

### 4.1 Isi wajib

| # | Item | Contoh isi |
|---|---|---|
| 1 | Node ID yang dipakai | `VS-SIM-001` (simulasi), `VS-A1-003` (fisik nanti) |
| 2 | Topik MQTT | `/volatisafe/v1/node/VS-SIM-001/telemetry` — **dengan** garis miring di depan |
| 3 | QoS & retain | QoS 0, `retain=false` |
| 4 | Contoh payload nyata | `<tempel 1 baris dari mosquitto_sub>` |
| 5 | Panjang payload | 71 byte (simulasi), 70 byte (fisik) — **bukan 52** |
| 6 | Frekuensi kirim | 15 menit (produksi), 10 detik (`SIM_FAST_CYCLE`) |
| 7 | Field yang mungkin di luar batas | `t = -999` saat DS18B20 putus → **harus ditolak** |
| 8 | Field yang **tidak** dikirim | `rssi_dbm`, `snr_db`, `is_predicted` (lihat DEC-IOT-11) |
| 9 | Cara menjalankan ulang | perintah build + start simulator + broker |
| 10 | Kontak | Hafiiz |

### 4.2 Format tabel field

| Key | Tipe | Wajib | Batas | Catatan |
|---|---|---|---|---|
| `n` | string | ✅ | 6–12 char | `VS-SIM-001` saat ini |
| `ts` | int | ✅ | ≥ 1700000000 | Unix detik, UTC |
| `m` | float | ✅ | 0,0–100,0 | 1 desimal |
| `t` | float | ✅ | −10,0–60,0 | 1 desimal; **−999 = sensor putus** |
| `ph` | float | ✅ | 3,00–10,00 | 2 desimal, sudah dikoreksi kelembaban |
| `b` | float | ✅ | 2,80–4,25 | 2 desimal, volt |

### 4.3 Yang harus dikonfirmasi balik oleh Syifa

- [ ] `VS-SIM-001` terdaftar di tabel `nodes` (atau ada cara memetakan ke `field_id`)
- [ ] Adapter menerima payload tanpa error (HW-6.2)
- [ ] Perilaku saat `t = -999`: masuk dead-letter, bukan crash
- [ ] Perilaku saat `b` < 2,8: ditolak atau ditandai low-battery
- [ ] Apakah backend butuh `nodered`/bridge tambahan (tidak — firmware publish langsung)

---

## 5. Acceptance Test Akhir TKT 3

Dijalankan H-1 sebagai satu rangkaian. Semua harus `PASS`.

| # | Test | Kriteria | PASS/FAIL |
|---|---|---|---|
| A-01 | Build fisik | `pio run -e esp32dev` → SUCCESS | ☐ |
| A-02 | Build simulasi | `pio run -e wokwi` → SUCCESS | ☐ |
| A-03 | Unit test | semua PASS, 0 fail | ☐ |
| A-04 | Payload valid | `validate_payload.py` → `[OK]` | ☐ |
| A-05 | Data sampai broker | 5 paket berturut | ☐ |
| A-06 | Data sampai backend | muncul di API/DB | ☐ |
| A-07 | Skenario A | AVRI kategori Kritis | ☐ |
| A-08 | Skenario B | AVRI kategori Aman | ☐ |
| A-09 | Skenario C | label `[Est-Simulated]`, tidak crash | ☐ |
| A-10 | Alert terkirim | Telegram/WA diterima | ☐ |
| A-11 | Bukti lengkap | 12 item `07_TEST_PLAN.md` §6 | ☐ |
| A-12 | Video | 2 menit, unlisted, bisa dibuka | ☐ |
| A-13 | PR bersih | hanya 3 folder, tanpa `.pio` | ☐ |
| A-14 | Tidak ada kredensial | `git grep` bersih | ☐ |

Bila A-06, A-07, A-08, A-09, atau A-10 gagal **karena backend belum siap**, itu bukan kegagalan IoT — tetapi harus dicatat di catatan PR sebagai *blocked by backend*, bukan didiamkan.

---

## 6. Acceptance Test Akhir TKT 4–5

| # | Test | Kriteria |
|---|---|---|
| B-01 | Akurasi kelembaban | MAE ≤ 5 % VWC (F-01) |
| B-02 | Akurasi suhu | ±0,5 °C (F-02) |
| B-03 | Akurasi pH | ±0,15 pH (F-03) |
| B-04 | Arus deep sleep terukur | dicatat; klaim diperbarui sesuai angka nyata |
| B-05 | Power gate | < 1 µA saat OFF (F-05) |
| B-06 | Jangkauan LoRa | RSSI > −110 dBm @ 2 km (F-06) |
| B-07 | Packet loss | < 10 % @ 1 km (F-07) |
| B-08 | Enclosure | lulus splash + 24 jam (F-08) |
| B-09 | Otonomi 7 hari | ≥ 95 % paket/hari (F-09) |
| B-10 | Gateway uptime 7 hari | ≥ 99 % (F-10) |
| B-11 | Dokumen dikoreksi | E-01, E-06 di `09 §C` sudah diputuskan & dokumen universal diperbarui |

---

## 7. Serah Terima ke Fase Berikutnya

Saat proyek pindah ke fabrikasi (TKT 4), serahkan:

1. **Repositori** pada kondisi PR merged ke `Development`.
2. **Dokumen playbook ini** (sudah berisi semua keputusan & risiko).
3. **Folder `evidence/`** lengkap.
4. **Daftar utang teknis** di bawah ini.

### 7.1 Utang Teknis yang Diakui

| # | Utang | Kapan diselesaikan |
|---|---|---|
| D-01 | LoRa PHY belum diuji (hanya disimulasikan) | HW-9.3 |
| D-02 | Timestamp di lapangan belum ada mekanismenya | DEC-IOT-09, sebelum HW-9.1 |
| D-03 | `rssi_dbm`/`snr_db` belum diimplementasikan | DEC-IOT-11, keputusan Aris |
| D-04 | Status sensor hanya di log, tidak di payload | DEC-IOT-07 |
| D-05 | Kalibrasi default masih placeholder (`PH_NEUTRAL_ADC 1500`) | HW-9.2 |
| D-06 | Arus deep sleep belum terukur | HW-9.1 (F-04) |
| D-07 | Retry tanpa ACK | DEC-IOT-08, dipertimbangkan TKT 6 |
| D-08 | Power gate + ground bersama pH belum diuji | F-05 + DEC-IOT-13 |
| D-09 | Mode kalibrasi Serial (HW-2.7) belum ada | HW-9.2 |
| D-10 | Klaim 52 byte di dokumen universal belum dikoreksi | E-01 |

### 7.2 Yang **tidak** dianggap utang

Hal-hal berikut memang di luar cakupan TKT 3, bukan kekurangan:

- Tidak ada PCB (fabrikasi baru setelah insentif).
- Tidak ada casing fisik.
- Tidak ada hardware fisik sama sekali (sesuai ADR 004).
- Tidak ada model AI yang dilatih dengan data sensor nyata.
- Tidak ada uji lapangan.

---

## 8. Satu Halaman untuk Lead

| Pertanyaan | Jawaban |
|---|---|
| Apakah IoT selesai untuk proposal 31 Okt? | Ya, bila A-01 … A-14 PASS. |
| Apa risiko terbesar? | Waktu (35 jam dalam 4 hari) dan ketergantungan pada backend untuk A-06…A-10. |
| Apa yang perlu keputusan Lead sekarang? | E-01 (payload 52→70), E-02 (anggaran 9 vs 10 node), E-04 (timestamp), E-06 (klaim 10 µA). |
| Apakah klaim LoRa aman? | Hanya bila dinyatakan sebagai "payload LoRa-compatible + transport parity", bukan "LoRa teruji". |
| Berapa lama ke produksi? | TKT 4 mulai Bulan 1 setelah insentif; validasi lapangan Bulan 5–12. |
