# HW-7.2 - Blocker integrasi ke backend

Tanggal : 27 Okt 2026
Status  : ⛔ menunggu backend (Syifa)

## Yang dibutuhkan HW-7.2

Wokwi publish ke Mosquitto -> ingestion worker backend -> `telemetry` ->
endpoint `GET /api/v1/nodes/{node_id}/telemetry` (atau TimescaleDB).
Bukti yang diminta: `I07_backend.png` + `I07_query.txt`.

## Kondisi aktual

- `backend/` di branch `iot` hanya berisi `.gitkeep`.
- Di `origin/full-stack` commit `8e77211` ada FastAPI + adapter, tetapi:
  - tidak ada MQTT subscriber/worker; `paho-mqtt` hanya ada di
    `requirements.txt`, tidak ada `mqtt.Client`/`subscribe` di kode;
  - `IngestionService.process_lora_payload()` hanya didefinisikan, tidak
    dipanggil dari service lain;
  - API telemetry memakai `mock_db`, bukan TimescaleDB;
  - `mock_db` men-seed `VS-A1-003`, bukan `VS-SIM-001`.
- Dashboard frontend di `origin/full-stack` ada, tetapi masih memakai mock
  data untuk nilai utama; belum menerima telemetri Wokwi.

## Yang perlu dibuat Syifa

1. Worker MQTT yang subscribe `/volatisafe/v1/node/+/telemetry`, memanggil
   `IngestionService.process_lora_payload()`, dan menyimpan ke DB.
2. Seed/mapping `VS-SIM-001` ke `field_id` yang dipakai dashboard.
3. Endpoint telemetry yang mengembalikan data hasil ingestion (bukan mock).
4. Konfirmasi perilaku `t=-999`, `m` di luar 0..100, `b` di luar 2.80..4.25
   (lihat DEC-IOT-21).

## Setelah backend siap

IoT perlu:
- Start Wokwi + Mosquitto + backend.
- Publish 5 paket `VS-SIM-001`.
- Query `GET /api/v1/nodes/VS-SIM-001/telemetry` dan simpan screenshot +
  query SQL/JSON ke `I07_backend.png` / `I07_query.txt`.
- Re-test adapter setelah branch full-stack di-merge ke `Development`.

## Yang bisa dibuktikan sekarang

- Payload/topik/QoS/retain sampai Mosquitto: `HW-6.1_topic_qos_retain_20261027.txt`.
- Adapter menerima payload valid dan menolak nilai rusak utama:
  `HW-6.2_adapter_test_20261027.txt`.
- Ini **bukan** integrasi MQTT -> backend; jangan diklaim sebagai HW-7.2.