# DOMAIN 1: HARDWARE & EDGE FIRMWARE — README.md

> **PENANGGUNG JAWAB TEKNIS:** Hadi M. Hafiiz Hilmi (Hafiiz) — *IoT & Embedded Hardware Engineer*  
> **AREA AKSES PENUH (R/W):** `firmware/`, `simulation/wokwi/`, `docs/hardware/`  
> **CABANG GIT RESMI:** `iot`

> **Status as-built (31 Okt 2026):** hardware yang ada baru ESP32-WROOM-32D, Capacitive Soil Moisture v1.2, DS18B20 waterproof, dan modul Micro SD. Transport fisik memakai WiFi/MQTT; pH, LoRa, baterai, dan power gate belum ada. Mulai dari [`HARDWARE_STATUS.md`](HARDWARE_STATUS.md).

---

## 1. Mandat & Ruang Lingkup Kerja

Hafiiz bertanggung jawab penuh atas segala hal yang berkaitan dengan perangkat keras fisik, pemilihan komponen low-cost, sensor analog terkalibrasi, mikrokontroler ESP32, simulasi sirkuit virtual Wokwi, protokol telemetri LoRa 433 MHz, dan efisiensi konsumsi daya lapangan (*deep sleep*).

### File & Direktori yang Dimiliki (Boleh Ditulis):
- `firmware/` (Sketch C++ PlatformIO / Arduino untuk ESP32 Node & Gateway)
- `simulation/wokwi/` (File `diagram.json`, `wokwi.toml`, script bridge virtual)
- `docs/hardware/` (Seluruh dokumen teknis hardware di folder ini)

---

## 2. Zona Terlarang & Batasan Ketat (*Invariant Rules*)

Untuk mencegah benturan kode dengan tim/AI lain:
1. ❌ **Dilarang Menyentuh Database:** Jangan pernah menulis query SQL, skema migrasi, atau koneksi DB di modul firmware.
2. ❌ **Dilarang Menghubungi REST API Langsung:** Node sensor lapangan tidak memiliki koneksi internet langsung. Pada desain target, transmisi **hanya via LoRa SX1278** ke Gateway. Prototipe bench saat ini memakai WiFi/MQTT langsung ke broker; jangan menambah jalur akses lain tanpa keputusan tertulis.
3. ❌ **Dilarang Mengubah Payload LoRa Sepihak:** Bentuk payload LoRa terikat kontrak di [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §1. Jika Anda mengubah urutan byte atau field JSON, Anda **wajib** memperbarui fungsi adapter di `docs/hardware/TELEMETRY_PAYLOAD.md` dan memberitahukan tim backend.
4. ❌ **Wajib Menjaga Anggaran Daya:** Firmware wajib menerapkan *deep sleep* 15 menit dan, pada desain target, mematikan suplai daya sensor via MOSFET (GPIO25). Prototipe saat ini menyalakan sensor langsung dari 3V3 karena MOSFET belum ada. Konsumsi daya per siklus tidak boleh melampaui 0,07 mAh.

---

## 3. Indeks Dokumen Hardware

### 3.1 Spesifikasi (apa yang harus dibangun)

0. [`HARDWARE_STATUS.md`](HARDWARE_STATUS.md): Status hardware aktual (as-built), hasil uji bench, dan daftar belanja berikutnya.
1. [`PINOUT_AND_SCHEMATICS.md`](PINOUT_AND_SCHEMATICS.md): Pemetaan pin ESP32, status komponen, catatan pull-up internal, dan skema power gate target.
2. [`FIRMWARE_SPEC.md`](FIRMWARE_SPEC.md): Logika sampling burst (5x median filter), kalibrasi dua titik, dan siklus deep-sleep.
3. [`TELEMETRY_PAYLOAD.md`](TELEMETRY_PAYLOAD.md): Spesifikasi payload ringkas (LoRa-compatible, transport fisik MQTT) dan adapter ekstraksi gateway.
4. [`WOKWI_SIMULATION.md`](WOKWI_SIMULATION.md): Petunjuk menjalankan purwarupa virtual testbed Wokwi untuk demonstrasi juri 3 skenario.
5. [`ARCHITECTURE_IOT.md`](ARCHITECTURE_IOT.md): Arsitektur domain IoT (Lapis 1 & 2), alur data end-to-end, dan titik kontak ke Backend/AI.
6. [`SETUP_IOT.md`](SETUP_IOT.md): Langkah konfigurasi operasional dari nol — infrastruktur, MQTT, Wokwi, hardware fisik, kalibrasi, verifikasi, troubleshooting.

### 3.2 Playbook Eksekusi (bagaimana membangunnya)

> **[`playbook/00_INDEX.md`](playbook/00_INDEX.md)** — mulai dari sini.
> Berisi 46 task ber-ID dengan dependensi, estimasi, kriteria terima, dan daftar bukti. Mencakup TKT 3 (simulasi Wokwi) sampai TKT 6 (validasi lapangan).

| # | Dokumen | Isi |
|---|---|---|
| 00 | [`playbook/00_INDEX.md`](playbook/00_INDEX.md) | Peta dokumen, status board, temuan awal |
| 01 | [`playbook/01_SETUP_LINGKUNGAN.md`](playbook/01_SETUP_LINGKUNGAN.md) | Yang sudah ada vs harus diunduh, perintah verifikasi |
| 02 | [`playbook/02_HARDWARE_BOM.md`](playbook/02_HARDWARE_BOM.md) | BoM, komponen pendukung, daya, prosedur kalibrasi |
| 03 | [`playbook/03_ROADMAP_TUGAS.md`](playbook/03_ROADMAP_TUGAS.md) | 46 task, jalur kritis, rencana harian |
| 04 | [`playbook/04_FIRMWARE_CORE.md`](playbook/04_FIRMWARE_CORE.md) | Desain modul, dual build LoRa/MQTT, edge case |
| 05 | [`playbook/05_WOKWI_SIMULASI.md`](playbook/05_WOKWI_SIMULASI.md) | `diagram.json`, `wokwi.toml`, 3 skenario |
| 06 | [`playbook/06_GATEWAY_MQTT.md`](playbook/06_GATEWAY_MQTT.md) | Topik MQTT, broker, ACL, gateway LoRa RX |
| 07 | [`playbook/07_TEST_PLAN.md`](playbook/07_TEST_PLAN.md) | 33 unit test, integrasi, E2E, bukti |
| 08 | [`playbook/08_DEMO_RUNBOOK.md`](playbook/08_DEMO_RUNBOOK.md) | Skrip video 2 menit, fallback |
| 09 | [`playbook/09_RISIKO_DAN_KEPUTUSAN.md`](playbook/09_RISIKO_DAN_KEPUTUSAN.md) | 15 keputusan lokal, risk register, eskalasi |
| 10 | [`playbook/10_DEFINISI_SELESAI.md`](playbook/10_DEFINISI_SELESAI.md) | DoD, checklist PR, paket serah terima |
