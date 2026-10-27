# Paket Serah Terima IoT -> Backend

Tanggal : 27 Okt 2026
Dari    : Hadi M. Hafiiz Hilmi (IoT & Embedded Hardware)
Untuk   : Syifa (Full-Stack / Backend)
Status  : Draft siap; menunggu pengiriman dan konfirmasi Syifa
Pesan   : `docs/hardware/evidence/HANDOVER_MESSAGE.md`
Acuan   : `docs/universal/INTERFACES.md` 1.1-1.3,
          `docs/hardware/playbook/10_DEFINISI_SELESAI.md` 4

---

## 1. Identitas Node

| Lingkungan | Node ID | Catatan |
|---|---|---|
| Simulasi Wokwi | `VS-SIM-001` | Dipakai untuk I-03/E-01 |
| Fisik (nanti) | `VS-A1-003` | Belum ada hardware |

`NODE_ID` simulasi dan fisik dipisahkan lewat build flag `SIM_NODE`
(`firmware/include/config.h`).

## 2. Topik MQTT

```
/volatisafe/v1/node/VS-SIM-001/telemetry
```

- Wajib memakai **garis miring di depan**.
- QoS: **0**.
- Retain: **false**.
- Panjang topik: 40 karakter (batas internal PubSubClient 64).
- Firmware publish sendiri lewat `transport_mqtt.cpp`; tidak ada bridge.

## 3. Contoh Payload Nyata

Diambil dari `docs/hardware/evidence/E01_mqtt.txt`:

```json
{"n":"VS-SIM-001","ts":1793118124,"m":21.0,"t":34.5,"ph":7.85,"b":3.87}
```

- Panjang: **71 byte** ASCII.
- Panjang kasus terburuk: 76 byte.
- Klaim lama "≤ 52 byte" **tidak benar** untuk format JSON ini.
- Tidak ada spasi di dalam JSON.
- Urutan key: `n, ts, m, t, ph, b`.

## 4. Tabel Field

| Key | Tipe | Wajib | Batas | Desimal | Catatan |
|---|---|---|---|---|---|
| `n` | string | Ya | 6-12 char | - | `VS-SIM-001` |
| `ts` | integer | Ya | >= 1700000000 | - | Unix detik, UTC |
| `m` | float | Ya | 0.0-100.0 | 1 | % VWC |
| `t` | float | Ya | -10.0-60.0 | 1 | `-999` = DS18B20 putus |
| `ph` | float | Ya | 3.00-10.00 | 2 | sudah dikompensasi kelembaban |
| `b` | float | Ya | 2.80-4.25 | 2 | volt |

## 5. Field yang Mungkin di Luar Batas

- `t = -999.0` saat DS18B20 terputus. Backend **harus menolak** paket ini
  (dead-letter), bukan menyimpannya sebagai suhu.
- `m > 100` atau `m < 0` saat sensor short/putus. Nilai dikirim apa adanya,
  tidak di-clamp; backend harus menolak.
- `ph < 3.0` atau `ph > 10.0` saat modul pH rusak/kalibrasi tidak valid;
  backend harus menolak.
- `b < 2.80` atau `b > 4.25` saat divider baterai rusak; backend harus menolak
  atau menandai low-battery.

## 6. Field yang Tidak Dikirim

- `rssi_dbm` dan `snr_db` (belum diimplementasikan; DEC-IOT-11).
- `is_predicted` (milik backend/digital twin).
- Field status/error tambahan (kontrak hanya 6 key; DEC-IOT-07).

## 7. Frekuensi Kirim

| Mode | Interval |
|---|---|
| Produksi | 900 detik (15 menit) |
| Simulasi `SIM_FAST_CYCLE` | 10 detik |

Satu siklus: bangun -> sampling -> encode -> TX -> shutdown -> deep sleep.
Build simulasi memakai restart 10 detik karena Wokwi tidak menyelesaikan
deep sleep timer dengan bersih (DEC-IOT-20).

## 8. Cara Menjalankan Ulang

### 8.1 Build

```powershell
pio run -e wokwi --project-dir firmware
```

### 8.2 Broker lokal

```powershell
docker run -d --name volatisafe-mqtt --restart unless-stopped -p 1883:1883 `
  eclipse-mosquitto:2 mosquitto -c /mosquitto-no-auth.conf
```

### 8.3 Simulasi

```powershell
# dari folder simulation/wokwi
wokwi-cli . --timeout 60000 --scenario scenario_e01.yaml
```

Untuk akun Wokwi gratis, `host.wokwi.internal` tidak bisa dipakai. Pengujian
I-03/E-01 memakai tunnel TCP sementara ke Mosquitto lokal:

```powershell
ssh -p 443 -R 0:localhost:1883 serveo.net
```

lalu build `wokwi` dengan `SIM_MQTT_HOST`/`SIM_MQTT_PORT` diarahkan ke endpoint
tunnel. Ini hanya untuk pengujian, bukan konfigurasi produksi.

### 8.4 Verifikasi

```powershell
docker exec volatisafe-mqtt mosquitto_sub -h 127.0.0.1 `
  -t "/volatisafe/v1/node/+/telemetry" -v

python simulation/wokwi/validate_payload.py --file <payload.json>
```

## 9. Bukti yang Diserahkan

| Bukti | Isi |
|---|---|
| `evidence/I03_mqtt_rx.txt` | 5 paket berturut, topik + payload |
| `evidence/E01_serial.txt` | log Serial skenario A |
| `evidence/E01_mqtt.txt` | 1 paket skenario A |
| `evidence/E01_validation.txt` | validator lokal `[OK]` |
| `evidence/HW-6.1_topic_qos_retain_20261027.txt` | 5 paket, `q=0`, `r=0` |
| `evidence/HW-6.1_verification_20261027.md` | cek topik/panjang/QoS |
| `evidence/HW-6.2_adapter_test_20261027.txt` | uji adapter backend |
| `evidence/HW-6.2_backend_findings_20261027.md` | temuan adapter |
| `evidence/HW-7.2_backend_blocker_20261027.md` | blocker integrasi |
| `evidence/HW-7.3_blockers_20261027.md` | blocker E-02/E-03/I-06 |
| `evidence/HW-7.4_evidence_inventory_20261027.md` | inventaris bukti |

## 10. Yang Perlu Dikonfirmasi Syifa

- [ ] `VS-SIM-001` terdaftar di tabel `nodes` atau ada mapping ke `field_id`.
- [ ] Adapter menerima payload valid tanpa error.
- [ ] `t = -999` masuk dead-letter, bukan crash.
- [ ] `b < 2.80` ditolak atau ditandai low-battery.
- [ ] `ts < 1700000000` ditolak/ditandai, bukan diganti `now()`.
- [ ] Backend tidak butuh Node-RED/bridge tambahan (firmware publish langsung).
- [ ] Worker MQTT -> `process_lora_payload()` -> DB/API dibuat (saat ini belum
      ada; lihat `HW-7.2_backend_blocker_20261027.md`).
- [ ] Konfirmasi setelah `origin/full-stack` di-merge ke `Development`.

## 11. Temuan yang Sudah Dicatat

- `DEC-IOT-21`: adapter backend belum menolak `b` di luar 2.80-4.25, `b`
  hilang (default 3.87), dan `ts=0`/hilang (diganti waktu sekarang).
- `DEC-IOT-11`: `rssi_dbm`/`snr_db` belum ada di kontrak pengiriman.
- `DEC-IOT-19`: akses langsung `host.wokwi.internal` butuh Private Gateway
  berbayar; bukti I-03 memakai tunnel TCP.
- `DEC-IOT-22`: kuota CI Wokwi gratis habis 27 Okt 2026; E-02 dan I-06
  tertunda.

## 12. Kontak

Hadi M. Hafiiz Hilmi (Hafiiz) - IoT & Embedded Hardware.