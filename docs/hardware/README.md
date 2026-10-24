# DOMAIN 1: HARDWARE & EDGE FIRMWARE — README.md

> **PANDUAN KHUSUS UNTUK HARDWARE / FIRMWARE AI AGENT**

---

## 1. Mandat & Ruang Lingkup Kerja

Hardware AI bertanggung jawab penuh atas segala hal yang berkaitan dengan perangkat keras, sensor fisik, mikrokontroler, simulasi sirkuit, protokol telemetri nirkabel, dan efisiensi konsumsi daya.

### File & Direktori yang Dimiliki (Boleh Ditulis):
- `firmware/` (Sketch C++ PlatformIO / Arduino untuk ESP32 Node & Gateway)
- `simulation/wokwi/` (File `diagram.json`, `wokwi.toml`, script bridge virtual)
- `docs/hardware/` (Seluruh dokumen teknis hardware di folder ini)

---

## 2. Zona Terlarang & Batasan Ketat (*Invariant Rules*)

Untuk mencegah benturan kode dengan tim/AI lain:
1. ❌ **Dilarang Menyentuh Database:** Jangan pernah menulis query SQL, skema migrasi, atau koneksi DB di modul firmware.
2. ❌ **Dilarang Menghubungi REST API Langsung:** Node sensor lapangan tidak memiliki koneksi internet langsung. Transmisi **hanya via LoRa SX1278** ke Gateway.
3. ❌ **Dilarang Mengubah Payload LoRa Sepihak:** Bentuk payload LoRa terikat kontrak di [`docs/universal/INTERFACES.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/universal/INTERFACES.md) §1. Jika Anda mengubah urutan byte atau field JSON, Anda **wajib** memperbarui fungsi adapter di `docs/hardware/TELEMETRY_PAYLOAD.md` dan memberitahukan tim backend.
4. ❌ **Wajib Menjaga Anggaran Daya:** Firmware wajib menerapkan *deep sleep* 15 menit dan mematikan suplai daya sensor via MOSFET (GPIO25). Konsumsi daya per siklus tidak boleh melampaui 0,07 mAh.

---

## 3. Indeks Dokumen Hardware

1. [`PINOUT_AND_SCHEMATICS.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/hardware/PINOUT_AND_SCHEMATICS.md): Pemetaan pin ESP32, rangkaian sensor, pull-up resistor, dan skema power gating MOSFET.
2. [`FIRMWARE_SPEC.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/hardware/FIRMWARE_SPEC.md): Logika sampling burst (5x median filter), kalibrasi dua titik, dan siklus deep-sleep.
3. [`TELEMETRY_PAYLOAD.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/hardware/TELEMETRY_PAYLOAD.md): Spesifikasi paket LoRa ringkas (52 byte) dan adapter ekstraksi gateway.
4. [`WOKWI_SIMULATION.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/hardware/WOKWI_SIMULATION.md): Petunjuk menjalankan purwarupa virtual testbed Wokwi untuk demonstrasi juri 3 skenario.
