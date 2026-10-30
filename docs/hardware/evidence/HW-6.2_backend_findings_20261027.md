# HW-6.2 - Temuan adapter untuk Syifa

Tanggal : 27 Okt 2026
Sumber  : `origin/full-stack` commit `8e77211`
File    : `backend/app/services/ingestion.py`
Metode  : `IngestionService.process_lora_payload()`

## Yang sudah cocok

- Payload valid dari Wokwi (`VS-SIM-001`, 71 byte) diterima.
- Field normalisasi cocok: `moisture_pct`, `soil_temp_c`, `ph`,
  `battery_voltage`, `timestamp` ISO UTC.
- `t=-999`, moisture short (`193.1`), dan pH di luar batas (`2.0`) ditolak
  (`None`).
- Payload tanpa `n` ditolak.

## Temuan yang perlu diperbaiki/diputuskan

1. **Baterai tidak divalidasi.**
   `b=0.0` diterima dan disimpan sebagai `battery_voltage=0.0`, padahal
   kontrak `INTERFACES.md` 1.3 membatasi `2.80..4.25` V.
   `docs/backend/INGESTION_PIPELINE.md` 2 menulis `2.5..4.5`, dan function
   `validate_sensor_bounds()` tidak dipanggil di `process_lora_payload()`.

2. **`b` yang hilang diisi default 3.87.**
   Kontrak menyebut `b` wajib. Default ini menyembunyikan paket tidak lengkap
   dan membuat data baterai palsu.

3. **`ts` tidak divalidasi.**
   `ts=0` atau `ts` tidak ada diterima, lalu diganti `datetime.now()`.
   Kontrak meminta `ts >= 1700000000`. Mengganti timestamp di adapter membuat
   waktu pengukuran dan waktu terima tidak bisa dibedakan; ini juga menyentuh
   DEC-IOT-09.

4. **`rssi_dbm`/`snr_db` tidak ada di output.**
   `INTERFACES.md` 1.3 mencantumkannya, tetapi adapter tidak menerima/mengisi
   field tersebut. Keputusan masih di DEC-IOT-11 (butuh kontrak/opsi baru).

5. **Nama file di dokumen tidak cocok.**
   `06_GATEWAY_MQTT.md` menyebut `lora_adapter.unpack_lora_payload()`, tetapi
   implementasi aktual adalah `IngestionService.process_lora_payload()` di
   `backend/app/services/ingestion.py`. Perlu diselaraskan atau dibuat wrapper.

## Permintaan

- Re-test setelah branch full-stack di-merge ke `Development`; hasil di sini
  berlaku untuk commit `8e77211`, bukan `Development`.
- Putuskan apakah adapter harus menolak `b` di luar `2.80..4.25`, `b` hilang,
  dan `ts < 1700000000` (dead-letter), atau gateway yang menstempel ulang.
- Jangan ubah kontrak 6-key tanpa persetujuan Aris.