# TELEMETRY_PAYLOAD.md — Spesifikasi Payload Telemetri LoRa & Gateway Adapter

> **Transport fisik saat ini (31 Okt 2026):** WiFi/MQTT. Payload di bawah tetap LoRa-compatible dan dipakai apa adanya oleh `transport_mqtt.cpp`. pH dan baterai dapat berisi placeholder `7.00` dan `3.87 V` karena hardware-nya belum ada; status kanal tidak ikut di payload. Lihat [`HARDWARE_STATUS.md`](HARDWARE_STATUS.md).

---

## 1. Format Payload Kompak (ESP32 → Gateway)

Untuk menghemat konsumsi energi transmisi dan mematuhi batasan *Time-on-Air (ToA)* LoRa pada spreading factor SF7 frekuensi 433 MHz, payload dikirim dalam format JSON ringkas tanpa spasi:

```json
{"n":"VS-A1-003","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}
```

### Kamus Field:
| Key | Tipe Data | Bytes | Contoh Nilai | Deskripsi |
|---|---|---|---|---|
| `n` | String | 9 | `"VS-A1-003"` | Kode pengenal unik node fisik |
| `ts` | Int32 | 10 | `1792934400` | Epoch timestamp saat sampling |
| `m` | Float (1 desimal) | 4 | `22.4` | Kelembaban tanah (% VWC) |
| `t` | Float (1 desimal) | 4 | `34.1` | Suhu tanah probe DS18B20 (°C) |
| `ph` | Float (2 desimal) | 4 | `7.83` | Derajat keasaman tanah terkoreksi |
| `b` | Float (2 desimal) | 4 | `3.87` | Tegangan baterai Li-ion (Volt) |
| **Total** | — | **70 Byte** | — | Panjang contoh di atas; hasil bench 63 byte, rentang nyata 63–76 byte tergantung nilai. Muat dalam 1 paket radio LoRa SF7 |

---

## 2. Pilihan Biner Terpadu (Ultra-Compact Binary Pack — Opsional)

Jika node ditempatkan pada jarak ekstrem (> 4 km) yang membutuhkan spreading factor SF10–SF12, payload dapat dikonversi menjadi biner murni **13 byte**:

```
Byte 0..3   : Node ID (UInt32 numeric hash)
Byte 4..7   : Timestamp Unix Epoch (UInt32)
Byte 8      : Moisture x 2 (UInt8: 0..200 mewakili 0.0–100.0%)
Byte 9..10  : Temperature (Int16: suhu * 10, misal 341 mewakili 34.1°C)
Byte 11     : pH x 10 (UInt8: 0..140 mewakili pH 0.0–14.0)
Byte 12     : Battery Voltage (UInt8: (Volt - 2.5) * 100)
```

---

## 3. Gateway Anti-Corruption Adapter (Python Ingestion Layer)

Modul ini berjalan di Gateway (atau Ingestion Worker backend) untuk menerima payload mentah dari LoRa dan menerjemahkannya ke bentuk data bersih yang dikonsumsi oleh database dan AI:

```python
# File: backend/app/adapters/lora_adapter.py
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class CleanTelemetryModel(BaseModel):
    node_id: str
    recorded_at: datetime
    moisture_pct: float = Field(ge=0.0, le=100.0)
    soil_temp_c: float = Field(ge=-10.0, le=60.0)
    ph: float = Field(ge=3.0, le=10.0)
    battery_voltage: float = Field(ge=2.5, le=4.5)
    is_predicted: bool = False

def unpack_lora_payload(raw_json: dict) -> CleanTelemetryModel:
    """
    Menerjemahkan payload ringkas LoRa menjadi CleanTelemetryModel.
    Jika Hardware AI mengubah nama key di firmware, HANYA fungsi ini yang diperbarui.
    """
    return CleanTelemetryModel(
        node_id=str(raw_json["n"]),
        recorded_at=datetime.fromtimestamp(int(raw_json["ts"]), tz=timezone.utc),
        moisture_pct=round(float(raw_json["m"]), 1),
        soil_temp_c=round(float(raw_json["t"]), 1),
        ph=round(float(raw_json["ph"]), 2),
        battery_voltage=round(float(raw_json["b"]), 2),
        is_predicted=False
    )
```

Dengan adanya adapter ini, jika tim hardware memutuskan untuk mengubah format payload LoRa, tim backend **tidak perlu mengubah skema database maupun logika analitik**.
