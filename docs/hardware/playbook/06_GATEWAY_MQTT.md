# 06_GATEWAY_MQTT.md — Gateway, Broker & Anti-Corruption Adapter

> **Dipakai pada:** FASE 6 (HW-6.1 … HW-6.3)
> **Rujukan kontrak:** [`../../universal/INTERFACES.md`](../../universal/INTERFACES.md) §1.1–1.3 · [`../../backend/INGESTION_PIPELINE.md`](../../backend/INGESTION_PIPELINE.md)

---

## 1. Peran Gateway di Dua Fase

```
FASE TKT 3 (sekarang — tanpa LoRa)                    FASE TKT 4+ (fisik)
┌──────────────────────────────┐                      ┌──────────────────────────────┐
│ Wokwi ESP32                  │                      │ Node ESP32 + SX1278          │
│ transport_mqtt.cpp           │                      │ transport_lora.cpp           │
└──────────────┬───────────────┘                      └──────────────┬───────────────┘
               │ TCP publish (skip hop radio)                        │ LoRa 433 MHz
               ▼                                                     ▼
      ┌────────────────┐                                    ┌─────────────────────┐
      │ Mosquitto      │                                    │ Gateway ESP32       │
      │ :1883          │◄───────────────────────────────────│ SX1278 RX           │
      └────────┬───────┘        publish MQTT                │ + WiFi uplink       │
               │                                            └─────────────────────┘
               ▼
      ┌────────────────────────────┐
      │ Ingestion Worker (Syifa)   │  <- domain backend, bukan IoT
      │ validate -> ACL -> DB -> AI│
      └────────────────────────────┘
```

Titik berakhirnya domain IoT: **paket published ke MQTT sesuai kontrak**. Setelah itu milik backend.

---

## 2. Kontrak Topik MQTT

Wajib persis seperti `INTERFACES.md` §1.1. Jangan menambah/mengurangi.

| Topik | Publisher | Subscriber | QoS | Retain |
|---|---|---|---|---|
| `/volatisafe/v1/node/{node_id}/telemetry` | Node (Wokwi / gateway) | Ingestion worker | 0 | **false** |
| `/volatisafe/v1/gateway/{gateway_id}/status` | Gateway (LWT) | Monitoring | 0 | **true** |
| `/volatisafe/v1/node/{node_id}/downlink` | Backend | Gateway → Node | 1 | false |

### 2.1 Jebakan topik: garis miring di depan

Topik `/volatisafe/v1/node/X/telemetry` **berbeda** dari `volatisafe/v1/node/X/telemetry`. MQTT menganggap keduanya topik yang tidak berhubungan. Kontrak memakai **garis miring di depan**, jadi:

```c
// BENAR
snprintf(topic, sizeof(topic), "/volatisafe/v1/node/%s/telemetry", NODE_ID);

// SALAH (subscriber tidak akan menerima)
snprintf(topic, sizeof(topic), "volatisafe/v1/node/%s/telemetry", NODE_ID);
```

Ini adalah penyebab paling umum "publish sukses tapi subscriber kosong". Selalu uji dengan wildcard `+/telemetry` (bukan `#`) agar salah topik langsung terlihat.

### 2.2 QoS 0 dan konsekuensinya

QoS 0 = *fire and forget*. Broker tidak mengonfirmasi; `mqtt.publish()` mengembalikan `true` hanya berarti paket masuk buffer TCP lokal. Ini **disengaja**:

- Node tidur 15 menit segera setelah TX. Menunggu PUBACK QoS 1 menambah 50–200 ms waktu aktif per siklus.
- Kehilangan paket sudah ditangani failover Digital Twin.
- QoS 1 dengan `cleanSession=true` dan node yang tidur akan memicu pengiriman ulang yang sia-sia saat reconnect.

**Jangan** mengubah ke QoS 1 tanpa persetujuan (menyentuh kontrak + anggaran daya).

### 2.3 Last Will and Testament gateway

Gateway fisik (TKT 4) harus mendaftarkan LWT agar dashboard tahu bila gateway mati:

```c
mqtt.connect(GATEWAY_ID, nullptr, nullptr,
             /*willTopic=*/"/volatisafe/v1/gateway/GW-001/status",
             /*willQos=*/0,
             /*willRetain=*/true,
             /*willMessage=*/"{\"status\":\"offline\"}");
// setelah connect sukses:
mqtt.publish("/volatisafe/v1/gateway/GW-001/status",
             "{\"status\":\"online\"}", /*retained=*/true);
```

Topik LWT **berbeda** dari topik telemetri — jangan mencampur.

---

## 3. Broker Lokal untuk Uji (TKT 3)

Setup lengkap di [`01_SETUP_LINGKUNGAN.md`](01_SETUP_LINGKUNGAN.md) §4.

### 3.1 Uji cepat terima payload

```powershell
# Terminal 1 — dengarkan semua node
mosquitto_sub -h localhost -p 1883 -t "/volatisafe/v1/node/+/telemetry" -v

# Terminal 2 — kirim payload contoh
mosquitto_pub -h localhost -p 1883 `
  -t "/volatisafe/v1/node/VS-SIM-001/telemetry" `
  -m '{"n":"VS-SIM-001","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}'
```

### 3.2 Uji dengan Autentikasi (opsional, disarankan untuk demo)

Broker tanpa autentikasi tidak boleh dipakai bila laptop terhubung WiFi publik saat demo. Konfigurasi minimal (`docker/mosquitto.conf` — milik Syifa, minta ditambahkan):

```conf
listener 1883 0.0.0.0
allow_anonymous false
password_file /mosquitto/config/passwd
persistence false
log_dest stdout
```

Buat file password:

```powershell
docker run --rm -it -v "${PWD}\docker:/mosquitto/config" eclipse-mosquitto:2 `
  mosquitto_passwd -c -b /mosquitto/config/passwd vsnode "rahasia-demo"
```

Lalu firmware memakai kredensial:

```c
mqtt.connect(NODE_ID, "vsnode", "rahasia-demo");
```

**Jangan commit password.** Untuk demo, gunakan nilai sementara yang dihapus setelahnya, atau variabel build flag.

---

## 4. Bridge MQTT (Opsional — hanya bila tidak memakai WiFi langsung)

Pada arsitektur yang dipilih (`transport_mqtt.cpp` di dalam Wokwi), **bridge tidak diperlukan**: firmware sendiri yang publish. Bridge hanya berguna bila:

- Anda ingin mensimulasikan packet loss / delay hop radio.
- Anda menjalankan firmware Wokwi yang mencetak payload ke Serial (mode stub) dan perlu meneruskannya ke broker.
- Anda perlu "memutar ulang" payload yang sudah direkam.

### 4.1 Skrip bridge (stdlib + paho)

Letakkan di `simulation/wokwi/bridge/serial_bridge.py` (area tulis IoT).

```python
"""Meneruskan payload JSON dari Serial Wokwi ke MQTT.

Dipakai HANYA bila firmware mencetak '[TX] payload N byte: {...}' ke Serial
dan transport MQTT di dalam firmware dinonaktifkan.
"""

import json
import sys
import time

import paho.mqtt.client as mqtt
import serial

SERIAL_PORT = "COM5"          # sesuaikan: COM port Wokwi virtual
BAUD = 115200
BROKER = "localhost"
PORT = 1883
TOPIC_FMT = "/volatisafe/v1/node/{node_id}/telemetry"
PREFIX = "[TX] payload"


def extract_json(line: str) -> dict | None:
    if PREFIX not in line or "{" not in line:
        return None
    raw = line[line.index("{"):].strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        print(f"[WARN] JSON tidak valid: {raw!r}", file=sys.stderr)
        return None


def main() -> None:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="wokwi-bridge")
    client.connect(BROKER, PORT, keepalive=30)
    client.loop_start()

    with serial.Serial(SERIAL_PORT, BAUD, timeout=1) as ser:
        print(f"[OK] bridge {SERIAL_PORT} -> {BROKER}:{PORT}")
        while True:
            line = ser.readline().decode("utf-8", errors="replace")
            if not line:
                continue
            payload = extract_json(line)
            if payload is None:
                continue
            topic = TOPIC_FMT.format(node_id=payload["n"])
            client.publish(topic, json.dumps(payload, separators=(",", ":")), qos=0)
            print(f"[PUB] {topic} {payload}")
            time.sleep(0.01)


if __name__ == "__main__":
    main()
```

Catat di [`09_RISIKO_DAN_KEPUTUSAN.md`](09_RISIKO_DAN_KEPUTUSAN.md) bila bridge dipakai: ia menambah titik gagal dan membuat firmware tidak lagi "identik fisik".

---

## 5. Anti-Corruption Adapter — Batas Domain

### 5.1 Siapa yang memiliki apa

| Komponen | Pemilik | Boleh diedit IoT? |
|---|---|---|
| `backend/app/adapters/lora_adapter.py` | Syifa | ❌ **tidak** |
| `backend/app/...ingestion...` | Syifa | ❌ tidak |
| `simulation/wokwi/validate_payload.py` (validator lokal kita) | Hafiiz | ✅ ya |

IoT hanya bertanggung jawab memastikan payload yang dikirim **sesuai kontrak**. Setelah itu, penerjemahan adalah milik backend.

> **Koreksi 27 Okt 2026:** implementasi aktual di `origin/full-stack` bukan
> `backend/app/adapters/lora_adapter.py`, melainkan
> `IngestionService.process_lora_payload()` di
> `backend/app/services/ingestion.py`. Nama file di tabel atas perlu
> diselaraskan atau dibuat wrapper. Uji HW-6.2 memakai method aktual tersebut.

### 5.2 Kontrak serah terima

Input adapter (dari `TELEMETRY_PAYLOAD.md` §3):

```json
{"n":"VS-A1-003","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}
```

Aturan yang harus dipenuhi firmware:

| Key | Tipe JSON | Wajib | Batas |
|---|---|---|---|
| `n` | string | ✅ | 6–12 karakter, tanpa spasi |
| `ts` | integer | ✅ | ≥ 1700000000 |
| `m` | number | ✅ | 0,0–100,0 · 1 desimal |
| `t` | number | ✅ | −10,0–60,0 · 1 desimal (atau −999 saat error) |
| `ph` | number | ✅ | 3,00–10,00 · 2 desimal |
| `b` | number | ✅ | 2,80–4,25 · 2 desimal |

Aturan tambahan:
- **Tidak ada key ekstra.** Adapter memakai `raw_json["n"]` dst. secara langsung; key ekstra diabaikan, tetapi menandakan penyimpangan kontrak.
- **Tidak ada nilai `null`.** Adapter memanggil `float()`; `null` akan melempar `TypeError`.
- **`ts` harus integer, bukan float.** `int(raw_json["ts"])` akan memotong desimal, tapi lebih baik kirim integer.
- **Tidak boleh ada spasi** di dalam JSON (menghemat payload; juga memudahkan regex di log).

### 5.3 Validator lokal (buat sendiri, boleh diedit)

`simulation/wokwi/validate_payload.py` — meniru `validate_sensor_bounds()` supaya Anda tahu paket akan diterima atau ditolak **sebelum** menyalahkan backend.

```python
"""Validator payload lokal — meniru gate backend, bukan menggantikannya.

Jalankan: python simulation/wokwi/validate_payload.py '<json>'
Atau:     python simulation/wokwi/validate_payload.py --file payload.txt
"""

import json
import sys

REQUIRED = {"n", "ts", "m", "t", "ph", "b"}
BOUNDS = {
    "m": (0.0, 100.0),
    "t": (-10.0, 60.0),
    "ph": (3.0, 10.0),
    "b": (2.80, 4.25),
}


def validate(raw: str) -> list[str]:
    errors: list[str] = []

    try:
        obj = json.loads(raw)
    except json.JSONDecodeError as exc:
        return [f"JSON tidak valid: {exc}"]

    missing = REQUIRED - obj.keys()
    if missing:
        errors.append(f"key kurang: {sorted(missing)}")
    extra = obj.keys() - REQUIRED
    if extra:
        errors.append(f"key ekstra (menyimpang dari kontrak): {sorted(extra)}")

    node_id = obj.get("n")
    if not isinstance(node_id, str):
        errors.append("n harus string")
    elif not 6 <= len(node_id) <= 12:
        errors.append(f"n panjang {len(node_id)}, harus 6-12")
    elif " " in node_id:
        errors.append("n tidak boleh mengandung spasi")

    ts = obj.get("ts")
    if not isinstance(ts, int):
        errors.append("ts harus integer")
    elif ts < 1_700_000_000:
        errors.append(f"ts {ts} < 1700000000")

    for key, (lo, hi) in BOUNDS.items():
        value = obj.get(key)
        if not isinstance(value, (int, float)):
            errors.append(f"{key} harus angka")
            continue
        if not lo <= value <= hi:
            errors.append(f"{key}={value} di luar batas {lo}..{hi}")

    return errors


def main() -> int:
    if len(sys.argv) < 2:
        print("pemakaian: validate_payload.py '<json>' | --file <path>")
        return 2

    if sys.argv[1] == "--file":
        raw = open(sys.argv[2], encoding="utf-8").read().strip()
    else:
        raw = sys.argv[1]

    errors = validate(raw)
    if errors:
        print(f"[DITOLAK] {len(errors)} masalah:")
        for e in errors:
            print(f"  - {e}")
        return 1

    print(f"[OK] payload valid, {len(raw)} byte")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

Uji:

```powershell
python simulation\wokwi\validate_payload.py '{"n":"VS-SIM-001","ts":1792934400,"m":21.0,"t":34.5,"ph":7.85,"b":3.87}'
# [OK] payload valid, 71 byte

python simulation\wokwi\validate_payload.py '{"n":"VS-SIM-001","ts":1792934400,"m":21.0,"t":120.0,"ph":7.85,"b":3.87}'
# [DITOLAK] 1 masalah:
#   - t=120.0 di luar batas -10.0..60.0
```

> **Versi yang dijalankan ada di [`simulation/wokwi/validate_payload.py`](../../../simulation/wokwi/validate_payload.py), bukan di blok ini.** File itu yang menjadi acuan; blok di atas adalah ringkasan. Bedanya: file menambah pemeriksaan jumlah desimal sesuai kontrak (1 desimal untuk `m`/`t`, 2 untuk `ph`/`b`), menolak `bool` yang lolos `isinstance(int)`, dan memakai batas `b` 2,80–4,25 sesuai `INTERFACES.md` §1.3 (blok lama menulis 2,5–4,5, itu keliru).
>
> Di PowerShell, tanda kutip ganda di dalam argumen native dihapus. Pakai `'{\"n\":...}'` atau `--file`.

### 5.4 Perbedaan yang disengaja antara validator lokal dan backend

| Aspek | Validator lokal | Backend |
|---|---|---|
| Batas `b` | 2,80–4,25 | 2,80–4,25 (sama, `INTERFACES.md` §1.3) |
| Batas `t` | −10…60 (menolak −999) | −10…60 (menolak −999) |
| Aksi bila gagal | cetak error | dead-letter + status `MALFUNCTION` |
| Perubahan kontrak | harus selaras | sumber kebenaran |

Validator lokal adalah **alat bantu**, bukan pengganti. Bila hasilnya berbeda dengan backend, backend yang benar — laporkan ke Syifa.

> **Temuan 27 Okt 2026 (DEC-IOT-21):** adapter aktual `IngestionService.process_lora_payload()` belum menegakkan batas `b` `2.80..4.25` dan belum memvalidasi `ts`; `b` hilang diisi default `3.87`, `ts=0` diganti waktu sekarang. Lihat `evidence/HW-6.2_backend_findings_20261027.md`.

---

## 6. Gateway Fisik ESP32 LoRa RX (TKT 4, HW-6.3)

### 6.1 Peran

```
SX1278 RX 433 MHz ──> parse JSON ──> inject rssi/snr ──> publish MQTT
```

### 6.2 Wiring

Sama seperti node (SPI bersama), ditambah uplink WiFi:

| Sinyal | GPIO |
|---|---|
| SCK | 18 |
| MISO | 19 |
| MOSI | 23 |
| NSS / CS | 5 |
| RESET | 14 |
| DIO0 | 2 |

Tidak ada sensor. Tidak ada deep sleep (gateway harus selalu siaga).

### 6.3 Kerangka firmware

```c
#include <LoRa.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

static WiFiClient net;
static PubSubClient mqtt(net);
static const char* GW_ID = "GW-001";

void setup() {
    Serial.begin(115200);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) delay(500);

    mqtt.setServer(MQTT_HOST, MQTT_PORT);
    mqtt.setBufferSize(512);

    SPI.begin(18, 19, 23);
    LoRa.setPins(5, 14, 2);
    if (!LoRa.begin(433E6)) {
        Serial.println(F("[ERR] LoRa init gagal"));
        while (true) delay(1000);
    }
    LoRa.setSpreadingFactor(7);
    LoRa.setSignalBandwidth(125E3);
    LoRa.setCodingRate4(5);
    LoRa.setSyncWord(0x12);        // HARUS sama dengan node (config.h)
    LoRa.receive();
    Serial.println(F("[OK] gateway siap"));
}

void loop() {
    int packetSize = LoRa.parsePacket();
    if (packetSize == 0) return;

    char buf[128];
    size_t n = LoRa.readBytes((uint8_t*)buf, min((size_t)packetSize, sizeof(buf) - 1));
    buf[n] = '\0';

    int rssi = LoRa.packetRssi();
    float snr = LoRa.packetSnr();

    // Validasi minimal: harus JSON dengan key 'n'
    JsonDocument doc;
    if (deserializeJson(doc, buf) != DeserializationError::Ok || !doc["n"].is<const char*>()) {
        Serial.printf("[DROP] payload tidak valid (%d byte)\n", (int)n);
        return;
    }
    const char* node_id = doc["n"];

    char topic[64];
    snprintf(topic, sizeof(topic), "/volatisafe/v1/node/%s/telemetry", node_id);

    // Payload diteruskan APA ADANYA. rssi/snr di-inject oleh ingestion,
    // bukan ditambahkan ke JSON LoRa (akan melanggar kontrak 6-key).
    if (!mqtt.connected()) reconnect();
    mqtt.publish(topic, buf, n, false);

    Serial.printf("[RX] %s rssi=%d snr=%.1f len=%u\n", node_id, rssi, snr, (unsigned)n);
}
```

### 6.4 Keputusan: di mana `rssi_dbm` dan `snr_db` disuntikkan?

`INTERFACES.md` §1.3 mencantumkan `rssi_dbm` dan `snr_db` di *payload bersih*, dan `ARCHITECTURE_IOT.md` §6.3 menyatakan keduanya "di-inject oleh gateway dari metadata radio saat RX".

Ada dua cara, dan keduanya menyentuh domain backend:

| Opsi | Cara | Kelebihan | Kekurangan |
|---|---|---|---|
| **A. Tambahkan key ke JSON MQTT** | gateway publish `{"n":...,"rssi":-82,"snr":9.5}` | satu paket | **melanggar kontrak 6-key**; adapter backend harus menerima key ekstra |
| **B. Kirim metadata terpisah** | publish ke topik tambahan `<...>/meta` | kontrak payload tetap murni | butuh topik baru + perubahan ingestion |
| **C. Gateway tidak mengirim; ingestion baca dari broker** | Mosquitto tidak menyediakan RSSI — tidak mungkin untuk LoRa | — | tidak bisa |

Artinya: **klaim "gateway inject rssi/snr" tidak bisa diimplementasikan tanpa mengubah kontrak.** Ini temuan nyata, dicatat sebagai `DEC-IOT-11`. Jangan implementasikan sebelum ada keputusan Aris.

Untuk TKT 3 ini tidak relevan (tidak ada LoRa). Untuk TKT 4, rekomendasi: **Opsi A dengan key opsional** — tetapi `INTERFACES.md` §6 GIT_WORKFLOW mewajibkan field baru bersifat opsional dan disetujui Lead.

### 6.5 Gateway harus selalu hidup

| Aspek | Nilai |
|---|---|
| Daya | Adaptor 5 V 2 A, bukan baterai |
| WiFi reconnect | `mqtt.setKeepAlive(15)`, cek `mqtt.connected()` tiap loop |
| Watchdog | `esp_task_wdt_reset()` atau reboot terjadwal harian |
| LWT | Publish `offline` otomatis (lihat §2.3) |
| Log | Simpan 100 baris terakhir di ring buffer RAM untuk diagnosa |

---

## 7. Checklist FASE 6

- [x] Topik persis `/volatisafe/v1/node/{NODE_ID}/telemetry` (garis miring di depan!)
- [x] QoS 0, retain `false` untuk telemetri
- [x] `NODE_ID` berbeda untuk node fisik dan simulasi (`VS-A1-003` vs `VS-SIM-001`)
- [x] Payload lolos `validate_payload.py`
- [x] Adapter Syifa menerima payload tanpa error (HW-6.2, diuji ke `origin/full-stack` 8e77211)
- [ ] Uji broker dengan autentikasi (bila demo memakai WiFi publik)
- [ ] `rssi_dbm`/`snr_db`: **belum** diimplementasikan, tercatat sebagai `DEC-IOT-11`
- [ ] Gateway LWT diuji: matikan gateway → broker mempublikasikan `offline`

**Status 27 Okt 2026:** 5 item pertama lulus. Bukti topik/QoS/retain: `evidence/HW-6.1_topic_qos_retain_20261027.txt`. Bukti adapter: `evidence/HW-6.2_adapter_test_20261027.txt` (terhadap `origin/full-stack` commit `8e77211`; re-test setelah merge ke `Development`). Autentikasi broker tidak diuji karena demo lokal memakai Mosquitto tanpa auth; opsi ini hanya relevan bila demo lewat WiFi publik. `rssi_dbm`/`snr_db` tetap DEC-IOT-11. LWT dan HW-6.3 baru TKT 4.
