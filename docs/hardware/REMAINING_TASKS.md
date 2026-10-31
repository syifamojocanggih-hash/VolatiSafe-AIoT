# Sisa Task IoT - VolatiSafe AIoT

Terakhir diperbarui: 27 Okt 2026
Sumber: `docs/hardware/playbook/00_INDEX.md`,
`docs/hardware/playbook/07_TEST_PLAN.md`,
`docs/hardware/playbook/10_DEFINISI_SELESAI.md`, dan folder `evidence/`.

Aturan:

- File ini hanya berisi task yang **belum selesai**.
- Kalau task selesai: simpan bukti, update `00_INDEX.md`, lalu **hapus task
  tersebut dari file ini**.
- Jangan menandai selesai di sini; file ini bukan status board.
- Beberapa task punya blocker lintas domain; blocker ditulis di task, bukan
  dijadikan task baru.

---

## FASE 2 - Kalibrasi

- [ ] **HW-2.7** Mode kalibrasi 2 titik via Serial.
  Status: ditunda untuk TKT 3; dikerjakan bersama HW-9.2.

## FASE 5 - Wokwi (sisa checklist)

Catatan: `TASK_GUIDE.md` menamai testbed ini **HW-1.5**; statusnya mengikuti
HW-5.1..HW-5.4. Screenshot sudah selesai; sisa checklist hanya link publik.

- [ ] **HW-8.2** Link publik Wokwi.
  Screenshot rangkaian sudah ada di `evidence/wokwi_diagram.png`; link publik
  masih butuh proyek wokwi.com. Catatan: akses langsung
  `host.wokwi.internal` belum terbukti karena butuh Private Gateway berbayar;
  bukti saat ini memakai tunnel TCP.

## FASE 6 - Gateway & MQTT (sisa)

- [ ] **HW-6.3** Gateway LoRa RX fisik + LWT.
  Blocker: hardware SX1278 + firmware gateway; TKT 4.
- [ ] **Re-test HW-6.2** setelah `origin/full-stack` di-merge ke `Development`.
  Saat ini lulus terhadap commit `8e77211`; lihat
  `evidence/HW-6.2_adapter_test_20261027.txt`.
- [ ] **DEC-IOT-21** Backend menolak `b` di luar 2.80-4.25, `b` hilang, dan
  `ts < 1700000000`.
  Blocker: keputusan/fix Syifa. Temuan:
  `evidence/HW-6.2_backend_findings_20261027.md`.
- [ ] **Opsional:** uji broker dengan autentikasi bila demo memakai WiFi publik.
  Saat ini tidak dipakai karena broker lokal tanpa auth hanya untuk pengujian.

## FASE 7 - Uji & Bukti

- [ ] **HW-7.2** Integrasi Wokwi -> MQTT -> backend.
  Blocker: backend belum punya MQTT subscriber/worker; API masih `mock_db`;
  `VS-SIM-001` belum di-seed. Lihat
  `evidence/HW-7.2_backend_blocker_20261027.md`.
- [ ] **HW-7.3 E-02** Skenario Hujan.
  Blocker: kuota CI Wokwi gratis habis 27 Okt 2026. `scenario_e02.yaml` sudah
  siap. Lihat `evidence/HW-7.3_blockers_20261027.md`.
- [ ] **HW-7.3 E-03** Dropout + failover Digital Twin.
  Blocker: belum ada ingestion MQTT/`last_seen` yang bisa diuji.
- [ ] **HW-7.3 dashboard** Screenshot + kategori AVRI + alert untuk E-01/E-02/E-03.
  Blocker: dashboard belum menerima telemetri Wokwi.
- [ ] **I-06** DS18B20 terputus.
  Blocker: kuota CI Wokwi gratis habis. `scenario_i06.yaml` sudah siap.
- [ ] **HW-7.4 #6, #7, #8, #9, #11** Bukti integrasi backend, dashboard E-01/E-02,
  E-03, E-02, dan video.
  Blocker: backend/dashboard/kuota/video.
- [ ] **HW-7.4** lengkapi 12 item dan hapus task ini setelah
  `evidence/HW-7.4_evidence_inventory_20261027.md` tidak punya item ⛔/🟨.

## FASE 8 - Demo & Handover

- [ ] **HW-8.1** Video demo 2 menit.
  Butuh dashboard/alert; versi parsial Wokwi + MQTT bisa direkam lebih dulu.
- [ ] **HW-8.2** Screenshot rangkaian + link Wokwi.
  Screenshot manual dari UI; link publik butuh proyek wokwi.com. Alternatif:
  lampirkan `diagram.json` + firmware.
- [ ] **Kirim/konfirmasi HANDOVER.md ke Syifa.**
  Dokumen siap di `evidence/HANDOVER.md`; teks siap kirim di
  `evidence/HANDOVER_MESSAGE.md`. Konfirmasi checklist
  `10_DEFINISI_SELESAI.md` 4.3 masih menunggu Syifa.
- [ ] **HW-8.4** PR `iot` -> `Development`.
  Tunggu integrasi backend/FE dan bukti FASE 7 lengkap.

## FASE 9 - TKT 4-6 (pasca-insentif)

- [ ] **HW-9.1** Pengadaan 1 unit prototipe.
- [ ] **HW-9.2** Kalibrasi lab pH 2 titik + verifikasi titik ketiga.
- [ ] **HW-9.3** Uji jangkauan LoRa (RSSI/SNR).
- [ ] **HW-9.4** Fabrikasi PCB + enclosure IP65.
- [ ] **HW-9.5** Deployment gateway di lokasi mitra.
- [ ] **HW-9.6** Validasi lapangan 2 siklus tanam.

## Utang teknis

- [ ] **D-01** LoRa PHY belum diuji (baru build/simulasi) -> HW-9.3.
- [ ] **D-02** Timestamp lapangan belum ada mekanismenya (DEC-IOT-09).
- [ ] **D-03** `rssi_dbm`/`snr_db` belum diimplementasikan (DEC-IOT-11).
- [ ] **D-04** Status sensor hanya di log, tidak masuk payload (DEC-IOT-07).
- [ ] **D-05** Kalibrasi default masih placeholder (`PH_NEUTRAL_ADC 1500`) -> HW-9.2.
- [ ] **D-06** Arus deep sleep belum terukur -> HW-9.1 (F-04).
- [ ] **D-07** Retry LoRa tanpa ACK (DEC-IOT-08).
- [ ] **D-08** Power gate + ground bersama pH belum diuji (F-05, DEC-IOT-13).
- [ ] **D-09** Mode kalibrasi Serial belum ada -> HW-9.2.
- [ ] **D-10** Klaim 52 byte di dokumen universal belum dikoreksi (E-01).

---

## Catatan blocker

- **Backend/FE:** `backend/` lokal kosong; `origin/full-stack` punya API dan
  adapter, tetapi belum punya MQTT subscriber/worker. Dashboard masih mock.
- **Wokwi:** kuota CI gratis habis 27 Okt 2026; E-02 dan I-06 tertunda.
  Lihat `evidence/HW-7.3_blockers_20261027.md` dan `DEC-IOT-22`.
- **Private Gateway:** `host.wokwi.internal` langsung butuh akun berbayar;
  bukti I-03 memakai tunnel TCP lokal.
- **Screenshot:** `wokwi-cli --screenshot-part esp` tidak bisa karena board
  tidak punya framebuffer; perlu UI Wokwi/VS Code.

## Cara update

1. Selesaikan task dan simpan bukti di `docs/hardware/evidence/`.
2. Update status di `docs/hardware/playbook/00_INDEX.md`.
3. Hapus task dari file ini.
4. Update tanggal "Terakhir diperbarui".
5. Commit: `docs(iot): update remaining task list`.