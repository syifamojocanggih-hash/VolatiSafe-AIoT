# Pesan Handover IoT -> Backend

Kirim ke Syifa setelah `HANDOVER.md` siap. Teks di bawah bisa langsung
copy-paste ke WhatsApp/Telegram/email.

---

Halo Syifa, ini paket handover IoT untuk TKT 3.

Dokumen lengkap:
`docs/hardware/evidence/HANDOVER.md`

Ringkasan kontrak pengiriman:
- Node ID simulasi: `VS-SIM-001`
- Node ID fisik nanti: `VS-A1-003`
- Topik MQTT: `/volatisafe/v1/node/VS-SIM-001/telemetry`
- QoS: 0
- Retain: false
- Contoh payload:
  `{"n":"VS-SIM-001","ts":1793118124,"m":21.0,"t":34.5,"ph":7.85,"b":3.87}`
- Panjang: 71 byte (bukan 52 byte)
- Interval: 900 detik produksi, 10 detik saat `SIM_FAST_CYCLE`
- Key: `n, ts, m, t, ph, b` (tidak ada key tambahan)

Yang perlu dibuat/dipastikan di backend:
1. MQTT worker subscribe `/volatisafe/v1/node/+/telemetry`
2. Worker memanggil `IngestionService.process_lora_payload()`
3. Seed/mapping `VS-SIM-001` ke `field_id`
4. Simpan ke DB dan sediakan `GET /api/v1/nodes/VS-SIM-001/telemetry`
5. Tolak/dead-letter untuk:
   - `t = -999` (DS18B20 putus)
   - `m` di luar 0..100
   - `ph` di luar 3..10
   - `b` di luar 2.80..4.25
   - `ts < 1700000000`

Temuan yang sudah saya catat:
- `DEC-IOT-21`: adapter saat ini masih menerima `b=0.0`, `b` hilang
  (default 3.87), dan `ts=0` (diganti `now()`).
- `rssi_dbm`/`snr_db` belum dikirim (DEC-IOT-11).
- Tidak ada bridge; firmware publish langsung ke MQTT.

Mohon konfirmasi:
- [ ] `VS-SIM-001` terdaftar di tabel `nodes` / ada mapping `field_id`
- [ ] Adapter menerima payload valid tanpa error
- [ ] `t=-999` masuk dead-letter, bukan crash
- [ ] `b < 2.80` ditolak atau ditandai low-battery
- [ ] `ts < 1700000000` ditolak/ditandai
- [ ] Backend tidak butuh Node-RED/bridge tambahan
- [ ] Worker MQTT -> `process_lora_payload()` -> DB/API sudah ada

Bukti yang menyertai:
- `evidence/I03_mqtt_rx.txt`
- `evidence/E01_serial.txt`
- `evidence/E01_mqtt.txt`
- `evidence/E01_validation.txt`
- `evidence/HW-6.1_topic_qos_retain_20261027.txt`
- `evidence/HW-6.2_adapter_test_20261027.txt`
- `evidence/HW-6.2_backend_findings_20261027.md`
- `evidence/HW-7.2_backend_blocker_20261027.md`
- `evidence/HW-7.3_blockers_20261027.md`
- `evidence/HW-7.4_evidence_inventory_20261027.md`

Catatan:
- E-02 dan I-06 masih tertunda karena kuota CI Wokwi gratis habis.
- Untuk uji lokal, broker Mosquitto diakses lewat tunnel TCP sementara;
  `host.wokwi.internal` langsung butuh Private Gateway berbayar.
- Setelah backend di-merge ke `Development`, saya perlu re-test HW-6.2 dan
  integrasi HW-7.2.

Terima kasih.