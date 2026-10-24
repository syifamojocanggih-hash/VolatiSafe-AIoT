# INGESTION_PIPELINE.md — Pipeline Ingesti MQTT & Adapter LoRa

---

## 1. Arsitektur Ingesti Telemetri Real-Time

Pipeline ingesti bertanggung jawab untuk menyerap data telemetri dari ratusan node sensor lapangan secara asinkron tanpa membebani server REST API utama:

```
[ ESP32 Node Lapangan / Wokwi Simulator ]
                │
                ▼ (LoRa SX1278 433 MHz / TCP Loopback)
[ Gateway Hardware / Local MQTT Bridge ]
                │
                ▼ (Publikasi: /volatisafe/v1/node/{node_id}/telemetry)
[ Mosquitto MQTT Broker ] (localhost:1883)
                │
                ▼ (Asynchronous MQTT Subscription)
[ Ingestion Worker Service (FastAPI / asyncio) ]
 ├── Step 1: Validasi Integritas & Filter Anomali Fisik
 ├── Step 2: Unpack via Anti-Corruption Adapter (lora_adapter.py)
 ├── Step 3: Insert Hypertable TimescaleDB (telemetry)
 ├── Step 4: Trigger Pembaruan State Digital Twin
 ├── Step 5: Eksekusi Inferensi AI (AVRI + TreeSHAP)
 └── Step 6: Siarkan Event WebSocket & Trigger Alert jika Kritis
```

---

## 2. Filter Anomali & Batasan Fisik (*Sanity Check*)

Sebelum data disimpan ke database, sistem melakukan pengecekan batas fisik (*physical plausibility bounds*):

```python
def validate_sensor_bounds(m: float, t: float, ph: float, b: float) -> bool:
    """
    Menolak paket jika sensor mengalami korsleting atau terputus.
    """
    if not (0.0 <= m <= 100.0):
        return False  # Kelembaban di luar batas fisik
    if not (-10.0 <= t <= 60.0):
        return False  # Suhu di luar batas tanah pertanian
    if not (3.0 <= ph <= 10.0):
        return False  # pH di luar rentang tanah agrikultur
    if not (2.5 <= b <= 4.5):
        return False  # Tegangan baterai Li-ion rusak/rusak pembagi tegangan
    return True
```

Jika paket gagal dalam validasi batas fisik, paket dibuang ke log *dead-letter* dan status sensor ditandai *"MALFUNCTION"* di dashboard admin tanpa memicu kalkulasi model AI.

---

## 3. Integrasi Cuaca Otomatis (BMKG Sync Worker)

Setiap 1 jam, scheduler internal backend memanggil endpoint Open Data BMKG untuk menyinkronkan data cuaca stasiun lokal terdekat:
- Suhu udara ambien ($T_{air}$)
- Kelembaban udara relatif ($RH$)
- Kecepatan angin di permukaan ($u_2$)
- Prakiraan presipitasi hujan 6–12 jam ke depan

Data ini langsung disimpan ke cache memori (Redis / in-memory dictionary) untuk disematkan pada setiap siklus prediksi AVRI petak terkait.
