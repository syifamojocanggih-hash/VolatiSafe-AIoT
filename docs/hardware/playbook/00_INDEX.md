# 00_INDEX.md — Playbook Eksekusi Domain IoT (VolatiSafe AIoT)

> **PEMILIK:** Hadi M. Hafiiz Hilmi (Hafiiz) — *IoT & Embedded Hardware Engineer*
> **CABANG GIT:** `iot`
> **AREA TULIS (R/W):** `firmware/`, `simulation/wokwi/`, `docs/hardware/`
> **STATUS:** dokumen hidup (*living document*) — diperbarui setiap task selesai
> **SISA TASK:** [`../REMAINING_TASKS.md`](../REMAINING_TASKS.md)

> **Status as-built (31 Okt 2026):** 4 item sudah dibeli (ESP32-WROOM-32D, moisture kapasitif, DS18B20, modul Micro SD). Task yang menyebut pH, LoRa, baterai, MOSFET, dan enclosure adalah target, bukan kondisi terpasang. Ringkasan: [`../HARDWARE_STATUS.md`](../HARDWARE_STATUS.md).

---

## 1. Untuk Apa Playbook Ini

`docs/hardware/TASK_GUIDE.md` menjelaskan **apa** yang harus dicapai (5 tahap ringkas).
Playbook ini menjelaskan **bagaimana** mencapainya: perintah konkret, nama file, signature fungsi, kriteria terima, dan bukti yang harus disimpan.

Playbook ini mencakup **dua fase sekaligus**:

| Fase | Rentang | Target | Bukti |
|---|---|---|---|
| **TKT 3** (Bab 03 FASE 0–8) | s.d. 31 Okt 2026 | Virtual testbed Wokwi + MQTT + payload LoRa-compatible | Proposal + video 2 menit |
| **TKT 4–6** (Bab 03 FASE 9) | Bulan 1–12 | Hardware fisik, kalibrasi lab, uji LoRa, validasi lapangan | Demo lapangan + artikel |

---

## 2. Urutan Baca

Bacaan wajib sebelum menulis kode (30 menit):

1. [`../README.md`](../README.md) — mandat & zona terlarang domain IoT
2. [`../ARCHITECTURE_IOT.md`](../ARCHITECTURE_IOT.md) §1.4 — grand flow end-to-end
3. [`../../universal/INTERFACES.md`](../../universal/INTERFACES.md) §1 — kontrak payload (SUMBER KEBENARAN)
4. [`01_SETUP_LINGKUNGAN.md`](01_SETUP_LINGKUNGAN.md) — apa yang harus diunduh
5. [`03_ROADMAP_TUGAS.md`](03_ROADMAP_TUGAS.md) — daftar task berurutan

Urutan baca per niat:

| Kalau Anda ingin... | Baca |
|---|---|
| Mulai dari nol / mesin baru | 01 → 02 → 03 → 04 |
| Tahu kenapa desainnya begitu | 09 (keputusan & risiko) |
| Langsung ngoding | 03 → 04 |
| Menjalankan simulasi | 05 → 06 |
| Menguji | 07 |
| Rekam demo juri | 08 |
| Tahu kapan dianggap "selesai" | 10 |

---

## 3. Daftar Dokumen

| # | File | Isi | Dipakai saat |
|---|---|---|---|
| 00 | `00_INDEX.md` | Peta dokumen, status board, aturan update | Sekarang |
| 01 | `01_SETUP_LINGKUNGAN.md` | Inventaris tool yang sudah ada vs harus diunduh, perintah verifikasi, troubleshooting Windows | FASE 0 |
| 02 | `02_HARDWARE_BOM.md` | BoM 12 item + 7 pendukung (4 item sudah dibeli), alternatif komponen, aturan pengadaan bertahap, prosedur kalibrasi lab | FASE 0, 9 |
| 03 | `03_ROADMAP_TUGAS.md` | 40+ task ber-ID dengan dependensi, estimasi, output, DoD | Setiap hari |
| 04 | `04_FIRMWARE_CORE.md` | Desain per modul: file, fungsi, pseudocode, edge case, acceptance test | FASE 1–4 |
| 05 | `05_WOKWI_SIMULASI.md` | `diagram.json`, `wokwi.toml`, build `[env:wokwi]`, 3 skenario injeksi, batasan | FASE 5 |
| 06 | `06_GATEWAY_MQTT.md` | Topik MQTT, broker lokal, ACL adapter, gateway ESP32 LoRa RX (TKT 4) | FASE 6 |
| 07 | `07_TEST_PLAN.md` | Matriks unit/integrasi/E2E, tabel input→expected, daftar bukti wajib | FASE 7 |
| 08 | `08_DEMO_RUNBOOK.md` | Checklist H-7, skrip narasi video 2 menit, rencana fallback | FASE 8 |
| 09 | `09_RISIKO_DAN_KEPUTUSAN.md` | Risk register, keputusan lokal `DEC-IOT-*`, poin eskalasi ke ADR universal | Kapan saja |
| 10 | `10_DEFINISI_SELESAI.md` | DoD per fase, checklist PR `iot` → `Development`, paket serah terima | FASE 8, 9 |

---

## 4. Status Board

Legenda: `⬜` belum · `🟨` dikerjakan · `✅` selesai + bukti · `⛔` terblokir · `➖` tidak berlaku untuk TKT 3

Update kolom Status dan Bukti setiap menyelesaikan task. Jangan tandai `✅` tanpa bukti di [`07_TEST_PLAN.md`](07_TEST_PLAN.md) §6.

### FASE 0 — Lingkungan & Repo Hygiene
| ID | Task | Status | Bukti |
|---|---|---|---|
| HW-0.1 | Unduh packages ESP32 + library via `pio run` | ✅ | `evidence/build_esp32dev.txt` |
| HW-0.2 | Aktifkan lisensi Wokwi CLI | ✅ | `~/.wokwi/user.tok` aktif |
| HW-0.3 | Jalankan Mosquitto lokal + uji pub/sub | ✅ | container `volatisafe-mqtt` di `localhost:1883`, `evidence/I00_mqtt_pubsub_20261026.md` |
| HW-0.4 | Eskalasi `.gitignore` untuk `firmware/.pio/` | ✅ | `firmware/.gitignore` (commit `5d0ce46`) |
| HW-0.5 | Kunci versi dependensi + baseline build | ✅ | `firmware/package-lock.json`, 07 §5.1, commit `55e01b8` |

### FASE 1 — Skeleton Firmware & Build Ganda
| ID | Task | Status | Bukti |
|---|---|---|---|
| HW-1.1 | Restrukturisasi `firmware/` multi-modul | ✅ | `firmware/src/` 7 file, `firmware/include/` 7 header |
| HW-1.2 | Dual env `esp32dev` + `wokwi` di `platformio.ini` | ✅ | `evidence/build_esp32dev.txt`, `evidence/build_wokwi.txt` |
| HW-1.3 | Kontrak internal `TelemetryFrame` | ✅ | `firmware/include/types.h` |
| HW-1.4 | Skrip build matrix kedua env | ✅ | `firmware/build_all.ps1` |

### FASE 2 — Driver Sensor & Kalibrasi
| ID | Task | Status | Bukti |
|---|---|---|---|
| HW-2.1 | ADC + burst sampling median 5× | ✅ | `sensors.cpp` `sensors_readAdcBurst/Median`, 4 test lulus, `evidence/HW-2.1_adc_burst_wokwi_20261026.txt` |
| HW-2.2 | Driver DS18B20 + flag putus | ✅ | `sensors.cpp` `sensors_classifyTemp`, 3 test lulus, `evidence/HW-2.2_ds18b20_wokwi_20261026.txt` |
| HW-2.3 | Konversi moisture ke % VWC | ✅ | `sensors_core.cpp`, 3 test lulus |
| HW-2.4 | pH raw + kompensasi kelembaban | ✅ | `sensors_core.cpp`, 3 test lulus |
| HW-2.5 | Pembacaan baterai via divider | ✅ | `sensors_core.cpp`, ADC 2402 → 3,87 V |
| HW-2.6 | Kalibrasi NVS + fallback default | ✅ | `calibration.cpp` + `calibration_core.cpp`, 7 test lulus, `evidence/HW-2.6_nvs_selftest_wokwi_20261026.txt` (persistensi lintas reboot → HW-9.2) |
| HW-2.7 | Mode kalibrasi 2 titik via Serial | ➖ | |

### FASE 3 — Payload & Transport
| ID | Task | Status | Bukti |
|---|---|---|---|
| HW-3.1 | Validasi rentang lokal sebelum kirim | ✅ | `sensors_core.cpp` `channelStatus()`, clamp dibuang, sentinel `-999`, `evidence/HW-3.1_no_clamp_wokwi_20261026.txt` |
| HW-3.2 | Encoder JSON 6 field + ukur panjang | ✅ | `payload.cpp`, 6 test lulus (70 B / ≤76 B) |
| HW-3.3 | `transport_lora.cpp` (SX1278, retry 3×) | ✅ | Build-only: `evidence/HW-3.3_lora_transport_20261026.txt`; radio belum memancar → HW-9.3 |
| HW-3.4 | `transport_mqtt.cpp` (WiFi + publish) | ✅ | `evidence/HW-3.4_mqtt_transport_20261026.txt`; data sampai broker → HW-5.4 (DEC-IOT-19) |
| HW-3.5 | Unit test payload di env `native` | ✅ | `evidence/unit_test_native_20261026.txt`, 45 PASS (payload + sensors_core + calibration_core + transport_core) |

### FASE 4 — Power Management
| ID | Task | Status | Bukti |
|---|---|---|---|
| HW-4.1 | Sequencing power gate GPIO25 | ✅ | `power_mgmt.cpp` + urutan log, `evidence/HW-4.1_power_gate_20261027.txt` |
| HW-4.2 | Deep sleep + radio off | ✅ | `power_mgmt.cpp`, `evidence/HW-4.2_deep_sleep_20261027.txt` (deep sleep fisik → HW-9.1) |
| HW-4.3 | Orkestrasi siklus di `main.cpp` | ✅ | `main.cpp`, 6 skenario lulus, `evidence/HW-4.3_orchestration_20261027.txt` |
| HW-4.4 | Verifikasi power budget | ✅ | `evidence/HW-4.4_power_budget_20261027.md` (durasi terukur, arus estimasi) |

### FASE 5 — Wokwi Testbed
| ID | Task | Status | Bukti |
|---|---|---|---|
| HW-5.1 | `diagram.json` | ✅ | `simulation/wokwi/diagram.json` (ditarik ke FASE 2, DEC-IOT-17), `evidence/HW-5.1_diagram_lint_20261026.txt` |
| HW-5.2 | `wokwi.toml` + wiring build | ✅ | `simulation/wokwi/wokwi.toml` + `scenario_a.yaml`, `evidence/HW-5.2_wokwi_scenario_ab_20261026.txt` |
| HW-5.3 | Verifikasi paritas firmware | ✅ | `evidence/HW-5.3_parity_20261027.txt` |
| HW-5.4 | Telemetri sampai Mosquitto | ✅ | `evidence/I03_mqtt_rx.txt` + `evidence/HW-5.4_local_mqtt_20261027.md` (via tunnel TCP; Private Gateway tidak tersedia di akun gratis) |

### FASE 6 — Gateway & MQTT
| ID | Task | Status | Bukti |
|---|---|---|---|
| HW-6.1 | Topik & QoS sesuai kontrak | ✅ | `evidence/HW-6.1_topic_qos_retain_20261027.txt` + `evidence/HW-6.1_verification_20261027.md` (5 paket, topik persis, q=0, r=0) |
| HW-6.2 | Uji ACL adapter (koordinasi Syifa) | ✅ | `evidence/HW-6.2_adapter_test_20261027.txt` + `evidence/HW-6.2_backend_findings_20261027.md` (diuji ke `origin/full-stack` 8e77211; re-test setelah merge) |
| HW-6.3 | Gate LoRa RX fisik | ➖ | |

### FASE 7 — Uji & Bukti
| ID | Task | Status | Bukti |
|---|---|---|---|
| HW-7.1 | Unit test lulus | ✅ | `evidence/unit_test_native_20261027.txt` (45 PASS) |
| HW-7.2 | Integrasi Wokwi → MQTT → backend | ⛔ | `evidence/HW-7.2_backend_blocker_20261027.md` (backend belum punya MQTT worker) |
| HW-7.3 | Skenario A/B/C | 🟨 | `evidence/E01_serial.txt`, `E01_mqtt.txt`, `E01_validation.txt`; E02/I-06 kuota Wokwi habis, E03/dashboard butuh backend (`evidence/HW-7.3_blockers_20261027.md`) |
| HW-7.4 | Arsip bukti | 🟨 | `evidence/HW-7.4_evidence_inventory_20261027.md` (item 6-11 belum lengkap) |

### FASE 8 — Demo & Handover
| ID | Task | Status | Bukti |
|---|---|---|---|
| HW-8.1 | Video demo 2 menit | ⬜ | |
| HW-8.2 | Screenshot + link Wokwi | 🟨 | `evidence/wokwi_diagram.png` (screenshot 1270x490 + full 1920x1080); link publik belum ada |
| HW-8.3 | Paket serah terima ke Syifa | ✅ | `evidence/HANDOVER.md` + `evidence/HANDOVER_MESSAGE.md` (draft siap; pengiriman/konfirmasi Syifa di luar repo) |
| HW-8.4 | PR `iot` → `Development` | ⬜ | |

### FASE 9 — TKT 4–6 (pasca-insentif)
| ID | Task | Status | Bukti |
|---|---|---|---|
| HW-9.1 | Pengadaan 1 unit validasi | ⬜ | |
| HW-9.2 | Kalibrasi lab pH 2 titik | ⬜ | |
| HW-9.3 | Uji jangkauan LoRa (RSSI) | ⬜ | |
| HW-9.4 | Fabrikasi PCB + enclosure | ⬜ | |
| HW-9.5 | Deployment gateway | ⬜ | |
| HW-9.6 | Validasi lapangan 2 siklus tanam | ⬜ | |

---

## 5. Aturan Update Dokumen Ini

1. **Satu task, satu commit.** Format: `feat(iot): HW-3.3 transport lora retry 3x` (lihat `GIT_WORKFLOW.md` §7).
2. **Tandai `✅` hanya dengan bukti.** Bukti = path file log, screenshot, atau hash. Tanpa bukti → tetap `🟨`.
3. **Perubahan desain wajib lewat 09.** Jika Anda menyimpang dari `04_FIRMWARE_CORE.md`, tambahkan entri `DEC-IOT-*` dulu, baru kode.
4. **Jangan ubah `INTERFACES.md`.** Kontrak payload hanya boleh berubah lewat Aris (Lead). Temuan ketidaksesuaian dicatat di 09 dan dieskalasi.
5. **Estimasi boleh meleset, catat saja.** Tambahkan kolom catatan di 03 bila aktual > estimasi 1.5×.

---

## 6. Temuan Awal (hasil audit 26 Okt 2026)

Dirangkum untuk konteks; detail teknis di [`09_RISIKO_DAN_KEPUTUSAN.md`](09_RISIKO_DAN_KEPUTUSAN.md).

| # | Temuan | Dampak | Tindakan |
|---|---|---|---|
| T-01 | Payload contoh di `INTERFACES.md` §1.2 sebenarnya **70 byte**, bukan ≤52 seperti diklaim | Klaim efisiensi airtime di proposal tidak akurat | Eskalasi ke Aris; lihat DEC-IOT-02 |
| T-02 | Wokwi tidak punya part SX1278 | LoRa tidak bisa disimulasikan | Abstraksi transport (DEC-IOT-01) |
| T-03 | `firmware/src/` baru `main.cpp` skeleton; `sensors.cpp`, `transport_*.cpp`, `power_mgmt.cpp` belum ada | FASE 2–4 belum mulai | 04 sebagai acuan |
| T-04 | `simulation/wokwi/` kosong (hanya `.gitkeep`) | Belum ada testbed | FASE 5 |
| T-05 | `firmware/.pio/` untracked; repo belum punya `.gitignore` | Risiko commit 315 MB artefak build | HW-0.4, eskalasi ke Lead |
| T-06 | `docs/hardware/WOKWI_SIMULATION.md` §1 memakai `VS-SIM-001`, `firmware/include/config.h` memakai `VS-A1-003` | Topik MQTT simulasi bisa mismatch | DEC-IOT-03 |
| T-07 | `~/.platformio/packages` kosong walau platform `espressif32@8.0.0` terpasang | Build pertama harus unduh ±450 MB | HW-0.1 |
| T-08 | Belum ada Mosquitto (tidak ada service, tidak ada image Docker, `docker/` kosong) | Broker harus disiapkan sendiri | HW-0.3 |
| T-09 | BoM resmi tidak memuat divider baterai, divider pH, kabel, header | Rangkaian baterai/pH **tidak akan berfungsi** tanpa komponen ini. Pull-up DS18B20 kini internal (`INPUT_PULLUP`). Lihat 02 §2.1, DEC-IOT-04 |
| T-10 | BoM tidak menganggarkan gateway sama sekali | Anggaran 10 node + gateway = Rp3,34 jt vs plafon Rp3 jt | 02 §2.2, DEC-IOT-04 |
| T-11 | Klaim arus deep sleep 10 µA tidak mungkin pada dev board (regulator + CP2102) | Klaim ketahanan baterai 477 hari tidak akurat | 02 §5, DEC-IOT-05 |
| T-12 | Library LoRa tidak menyediakan ACK; retry "jika tidak ada ACK" tidak dapat diimplementasikan | Klaim di `TASK_GUIDE.md` HW-1.3 tidak akurat | 04 §8.1, DEC-IOT-08 |
| T-13 | Node lapangan tanpa internet → `ts` tidak valid; Wokwi menyembunyikan masalah ini | Grafik dashboard & partisi TimescaleDB bisa kacau | 04 §10.1, DEC-IOT-09 |
| T-14 | `rssi_dbm`/`snr_db` tidak bisa di-inject gateway tanpa mengubah kontrak | Klaim `ARCHITECTURE_IOT.md` §6.3 belum dapat diwujudkan | 06 §6.4, DEC-IOT-11 |
