# 04_FIRMWARE_CORE.md — Desain Firmware: Modul, Kontrak Internal, Edge Case

> **Dipakai pada:** FASE 1–4
> **Prinsip utama:** satu logika sensor & satu encoder payload untuk **semua** build. Yang berbeda antara fisik dan simulasi hanya modul transport.

---

## 1. Arsitektur Modul

```
                 ┌──────────────────────────────────────────┐
                 │              main.cpp                    │
                 │   orkestrasi siklus (tanpa logika)       │
                 └───┬──────┬────────┬──────────┬───────────┘
                     │      │        │          │
        ┌────────────▼─┐ ┌──▼──────┐ │   ┌──────▼────────┐
        │ sensors.cpp  │ │calibra- │ │   │ power_mgmt.cpp│
        │ ADC, 1-Wire  │ │tion.cpp │ │   │ gate, sleep   │
        └──────┬───────┘ └──┬──────┘ │   └───────────────┘
               │            │        │
               └────────┬───┘        │
                        ▼            ▼
                 ┌─────────────┐ ┌──────────────┐
                 │  payload.cpp│ │ transport.cpp│
                 │ encode JSON │ │ (salah satu) │
                 └──────┬──────┘ └──────┬───────┘
                        │               │
                        └───────┬───────┘
                                ▼
                    ┌───────────────────────┐
                    │ transport_lora.cpp    │  <- build fisik
                    │ transport_mqtt.cpp    │  <- build Wokwi
                    └───────────────────────┘
```

### 1.1 Aturan Isolasi (wajib dipatuhi)

| Aturan | Alasan |
|---|---|
| `main.cpp` hanya berisi urutan pemanggilan | Perbedaan fisik vs simulasi harus terlihat sebagai diff kecil |
| `sensors.cpp`, `payload.cpp`, `calibration.cpp` **tidak boleh** `#include <WiFi.h>` atau `<LoRa.h>` | Menjamin file ini identik byte-per-byte di kedua build |
| Semua akses hardware lewat header modul, bukan langsung di `main.cpp` | Memudahkan unit test native |
| Tidak ada alokasi dinamis saat runtime (`new`, `malloc`, `String`) | Fragmentasi heap pada siklus 15 menit × ribuan kali |
| Nilai `float` yang melintas antar-modul selalu lewat `TelemetryFrame` | Mencegah salah urutan argumen |

---

## 2. `platformio.ini` — Dua Environment, Satu Basis Kode

```ini
; ============================================================================
; PlatformIO — VolatiSafe AIoT Field Node
; Dua build target: hardware fisik (LoRa) dan simulasi Wokwi (MQTT)
; ============================================================================

[platformio]
default_envs = esp32dev
src_dir = src
include_dir = include

; ---------------------------------------------------------------------------
; Build fisik: ESP32 + SX1278 LoRa 433 MHz
; ---------------------------------------------------------------------------
[env:esp32dev]
platform = espressif32@8.0.0
board = esp32dev
framework = arduino

monitor_speed = 115200
upload_speed = 921600

build_flags =
    -D CORE_DEBUG_LEVEL=3
    -D ARDUINO_USB_CDC_ON_BOOT=0
    -D TRANSPORT_KIND=1            ; 1 = LoRa
    -D FW_PROFILE=\"field\"

build_src_filter =
    +<*>
    -<transport_mqtt.cpp>
    -<telemetry_sim.cpp>

lib_deps =
    paulstoffregen/OneWire@^2.3.8
    milesburton/DallasTemperature@^3.11.0
    sandeepmistry/LoRa@^0.8.0
    bblanchon/ArduinoJson@^7.0.4

; ---------------------------------------------------------------------------
; Build simulasi Wokwi: ESP32 + WiFi -> Mosquitto
; Catatan: Wokwi tidak memiliki part SX1278 -> transport diganti, payload SAMA
; ---------------------------------------------------------------------------
[env:wokwi]
platform = espressif32@8.0.0
board = esp32dev
framework = arduino

monitor_speed = 115200

build_flags =
    -D CORE_DEBUG_LEVEL=3
    -D ARDUINO_USB_CDC_ON_BOOT=0
    -D TRANSPORT_KIND=2            ; 2 = MQTT
    -D FW_PROFILE=\"sim\"
    -D SIM_NODE=1                  ; NODE_ID -> VS-SIM-001 (lihat config.h)
    -D SIM_FAST_CYCLE=1            ; siklus 10 detik, bukan 15 menit
    -D SIM_WIFI_SSID=\"Wokwi-GUEST\"
    -D SIM_WIFI_PASS=\"\"
    -D SIM_MQTT_HOST=\"host.wokwi.internal\"   ; lihat 05 §4
    -D SIM_MQTT_PORT=1883

build_src_filter =
    +<*>
    -<transport_lora.cpp>

lib_deps =
    paulstoffregen/OneWire@^2.3.8
    milesburton/DallasTemperature@^3.11.0
    knolleary/PubSubClient@^2.8
    bblanchon/ArduinoJson@^7.0.4

; ---------------------------------------------------------------------------
; Build native: unit test logika tanpa hardware
; ---------------------------------------------------------------------------
[env:native]
platform = native
test_framework = unity
test_build_src = true           ; tanpa ini src/ tidak dikompilasi saat pio test
build_flags =
    -D TRANSPORT_KIND=0            ; 0 = dummy
    -D NATIVE_BUILD=1
    -D UNITY_INCLUDE_DOUBLE
build_src_filter =
    +<payload.cpp>
    +<sensors_core.cpp>           ; fungsi murni saja (tanpa ADC)
```

> `config.h` yang di-include `sensors_core.cpp` memuat `ADC_ATTENUATION = ADC_11db`, makro yang hanya ada di core Arduino. Bungkus dengan `#if !defined(NATIVE_BUILD)` atau native gagal build. Lihat `09_RISIKO_DAN_KEPUTUSAN.md` `DEC-IOT-16`.

### 2.1 Catatan `SIM_MQTT_HOST`

Nilai host MQTT dari dalam Wokwi bergantung apakah broker berjalan di mesin lokal (VS Code extension) atau di Wokwi cloud:

| Mode | Host | Catatan |
|---|---|---|
| VS Code extension + broker lokal | `host.wokwi.internal` | Wokwi memetakan ini ke `localhost` mesin Anda |
| Wokwi web (wokwi.com) | butuh broker publik / tunnel | Gunakan broker uji publik sementara atau tunnel; **jangan** taruh kredensial |

Verifikasi aktual dilakukan di HW-5.4. Jika `host.wokwi.internal` tidak resolve, pakai IP LAN mesin (`ipconfig`) dan pastikan firewall mengizinkan port 1883.

### 2.2 `SIM_FAST_CYCLE`

Deep sleep 15 menit membuat demo mustahil (1 data point per 15 menit). Dengan `SIM_FAST_CYCLE`, durasi tidur menjadi 10 detik **hanya di build simulasi**, dan nilai ini dicetak jelas di Serial:

```
[SIM] FAST CYCLE ACTIVE — sleep 10s (bukan 900s). BUKAN perilaku produksi.
```

Ini penting agar tidak ada yang salah menyimpulkan bahwa firmware produksi tidur 10 detik.

---

## 3. `config.h` — Perubahan yang Diperlukan

Tambahkan di bagian identitas node:

```c
// --- Identitas Node ---------------------------------------------------------
// SIM_NODE di-set oleh build flag [env:wokwi]
#if defined(SIM_NODE)
  #define NODE_ID           "VS-SIM-001"
  #define NODE_IS_SIMULATED 1
#else
  #define NODE_ID           "VS-A1-003"
  #define NODE_IS_SIMULATED 0
#endif

#define FIRMWARE_VERSION    "1.0.0"
#define PAYLOAD_BUF_SIZE    96      // lihat 09 DEC-IOT-02
```

Tambahkan di bagian daya:

```c
#if defined(SIM_FAST_CYCLE)
  #define SLEEP_DURATION_US   (10ULL * 1000000ULL)
#else
  #define SLEEP_DURATION_US   (15ULL * 60ULL * 1000000ULL)
#endif
```

Tambahkan konstanta yang belum ada:

```c
// --- Sampling tambahan -------------------------------------------------------
#define BATTERY_SAMPLE_COUNT   3     // baterai cukup 3 sampel (bukan 5)
#define ADC_MAX                4095.0f

// --- Transport ---------------------------------------------------------------
#define TRANSPORT_KIND_LORA    1
#define TRANSPORT_KIND_MQTT    2
#define TRANSPORT_KIND_DUMMY   0

// --- Retry -------------------------------------------------------------------
#define TX_RETRY_MAX           3
#define TX_RETRY_DELAY_MS      2000

// --- Timeout -----------------------------------------------------------------
#define WIFI_CONNECT_TIMEOUT_MS 10000
#define MQTT_CONNECT_TIMEOUT_MS 5000
```

> `PIN_BATTERY 35` dan `BATTERY_DIVIDER 2.0f` sudah ada di `config.h` saat ini — tidak perlu ditambah.

---

## 4. `types.h` — Kontrak Internal Tunggal

```c
#pragma once
#include <stdint.h>

// Status tiap kanal sensor. Dipakai untuk menandai, BUKAN untuk memalsukan nilai.
enum SensorStatus : uint8_t {
    SENSOR_OK          = 0,
    SENSOR_DISCONNECTED = 1,   // DS18B20 -127C / ADC mentok
    SENSOR_OUT_OF_RANGE = 2,   // di luar batas fisik
    SENSOR_UNSTABLE     = 3    // variansi antar sampel terlalu tinggi
};

struct SensorReading {
    float value;
    SensorStatus status;
};

// Satu-satunya bentuk data yang melintas antar-modul.
struct TelemetryFrame {
    char     node_id[13];      // maks 12 char + NUL (INTERFACES.md §1.2)
    uint32_t timestamp;        // Unix epoch detik
    SensorReading moisture;    // % VWC       0.0 – 100.0
    SensorReading soil_temp;   // degC       -10.0 – 60.0
    SensorReading ph;          // pH          3.00 – 10.00
    SensorReading battery;     // Volt        2.80 – 4.25
};

// Hasil transmisi, untuk logging & retry.
struct TxResult {
    bool     ok;
    uint8_t  attempts;
    int16_t  rssi;             // 0 bila tidak tersedia
};
```

**Mengapa `SensorStatus` per kanal, bukan satu flag global:** bila hanya DS18B20 yang putus, tiga kanal lain masih berguna. Backend bisa menyimpan 3 nilai dan menolak 1. Satu flag global akan membuang seluruh paket.

### 4.1 Bagaimana status dikirim?

Kontrak `INTERFACES.md` §1.2 **tidak punya** field status. Karena itu:

- Untuk `soil_temp` yang putus: kirim `t: -999` (sudah disepakati di `config.h` sebagai `TEMP_ERROR_FLAG`, dan **otomatis ditolak** `validate_sensor_bounds()` karena di luar −10…60).
- Untuk kanal lain: kirim nilai apa adanya (tidak di-clamp). Nilai di luar batas → ditolak backend.
- **Jangan** menambahkan key baru (`"st"`, `"err"`, dst.) tanpa persetujuan Aris — itu melanggar kontrak dan akan membuat adapter Syifa gagal parse.

Mekanisme penandaan status yang lebih kaya (mis. field `q` kualitas) diusulkan di `DEC-IOT-07` dan **ditunda** sampai ada persetujuan.

---

## 5. `sensors.cpp` — Akuisisi

### 5.1 API

```c
#pragma once
#include "types.h"

// Satu kali inisialisasi (pin mode + bus)
void sensors_begin();

// Nyalakan/matikan suplai sensor lewat MOSFET (lihat power_mgmt)
// sensors_begin() TIDAK menyalakan sensor.

// Sampling penuh. Memanggil power gate sendiri? TIDAK — main.cpp yang mengatur.
void sensors_sampleAll(TelemetryFrame& out);

// Fungsi murni (bisa diuji native)
float sensors_adcToMoisturePct(uint16_t adc, uint16_t dry, uint16_t wet);
float sensors_adcToPh(uint16_t adc, float neutral_adc, float slope, float moisture_pct);
float sensors_adcToBatteryV(uint16_t adc);
float sensors_medianAverage(const uint16_t* samples, uint8_t n);
```

Pemisahan `sensors_sampleAll` (butuh hardware) dan fungsi murni (bisa dites native) adalah kunci agar HW-3.5 berjalan tanpa board.

### 5.2 Burst sampling — implementasi acuan

```c
// Ambil SAMPLE_COUNT pembacaan, jeda SAMPLE_INTERVAL_MS, buang min & max,
// rata-rata sisanya. Tahan terhadap 1-2 spike.
float sensors_medianAverage(const uint16_t* s, uint8_t n) {
    if (n == 0) return 0.0f;
    if (n <= 2) {                    // tidak ada yang bisa dibuang
        uint32_t sum = 0;
        for (uint8_t i = 0; i < n; i++) sum += s[i];
        return (float)sum / n;
    }
    uint16_t mn = s[0], mx = s[0];
    uint32_t sum = 0;
    for (uint8_t i = 0; i < n; i++) {
        if (s[i] < mn) mn = s[i];
        if (s[i] > mx) mx = s[i];
        sum += s[i];
    }
    // buang satu min dan satu max
    return (float)(sum - mn - mx) / (float)(n - 2);
}
```

Catatan: bila nilai min muncul dua kali (mis. `{1000,1000,1000,1000,4095}`), fungsi ini membuang **satu** 1000 dan 4095, menyisakan rata-rata 1000. Untuk input `{100,3000,1000,1100,1200}` → buang 100 & 3000 → rata-rata (1000+1100+1200)/3 = 1100. Perilaku benar.

### 5.3 ADC

```c
void sensors_begin() {
    analogSetAttenuation(ADC_11db);
    analogReadResolution(12);
    pinMode(PIN_DS18B20, INPUT_PULLUP);   // pull-up eksternal 4.7k tetap wajib
    sensors_ds18b20Begin();
}
```

`analogSetAttenuation(ADC_11db)` mencakup rentang ±0–3,1 V. Sensor kapasitif mengeluarkan 1,2–2,8 V; divider baterai 2,10 V; modul pH harus dijaga ≤3,1 V (`02_HARDWARE_BOM.md` §6.3).

### 5.4 DS18B20

```c
void sensors_readSoilTemp(SensorReading& r) {
    sensors_ds.requestTemperatures();
    float t = sensors_ds.getTempCByIndex(0);

    if (t == DEVICE_DISCONNECTED_C || t <= -126.0f) {   // -127C
        r.value  = TEMP_ERROR_FLAG;                     // -999.0
        r.status = SENSOR_DISCONNECTED;
        return;
    }
    if (t < SOIL_TEMP_MIN || t > SOIL_TEMP_MAX) {
        r.value  = t;                                   // kirim asli, jangan dipalsukan
        r.status = SENSOR_OUT_OF_RANGE;
        return;
    }
    r.value  = t;
    r.status = SENSOR_OK;
}
```

Gunakan resolusi 11-bit (±0,125 °C) → waktu konversi ±375 ms, masih dalam anggaran 3,5 s. Resolusi 12-bit butuh 750 ms.

### 5.5 Deteksi ketidakstabilan

Jika rentang (max − min) antar 5 sampel ADC > 800, tandai `SENSOR_UNSTABLE`. Penyebab umum: probe basah sebagian, kabel longgar, atau modul pH belum stabil setelah power-on.

```c
uint16_t range = mx - mn;
out.moisture.status = (range > 800) ? SENSOR_UNSTABLE : SENSOR_OK;
```

Ambang 800 adalah *placeholder* — kalibrasi di HW-9.1 dengan mengukur noise nyata.

---

## 6. `calibration.cpp` — Kalibrasi Persisten

```c
#pragma once
#include <stdint.h>

struct Calibration {
    uint16_t moist_dry;
    uint16_t moist_wet;
    float    ph_neutral_adc;
    float    ph_slope;
    bool     from_nvs;      // false = masih pakai default compile-time
};

bool calibration_begin();                 // load dari NVS; true bila ada
void calibration_defaults(Calibration&);  // isi dari config.h
bool calibration_save(const Calibration&);
void calibration_print(const Calibration&);// untuk verifikasi & bukti
```

Implementasi memakai `Preferences` (sudah termasuk dalam framework Arduino-ESP32, tidak perlu library tambahan):

```c
static Preferences prefs;

bool calibration_begin() {
    if (!prefs.begin("vscal", /*readOnly=*/false)) return false;
    return prefs.isKey("m_dry") && prefs.isKey("m_wet")
        && prefs.isKey("ph_n")  && prefs.isKey("ph_s");
}
```

Key dan tipe (harus konsisten):

| Key | Tipe | Isi |
|---|---|---|
| `m_dry` | `UShort` | ADC di udara kering |
| `m_wet` | `UShort` | ADC di tanah jenuh |
| `ph_n` | `Float` | ADC pada buffer 6,86 |
| `ph_s` | `Float` | ADC per satuan pH |

Perilaku bila NVS kosong: gunakan default `config.h`, set `from_nvs = false`, dan **cetak peringatan**:

```
[CAL] NVS kosong. Memakai default compile-time (BELUM TERKALIBRASI).
[CAL]   moist_dry=2800 moist_wet=1350 ph_n=1500.0 ph_s=300.0
```

Peringatan ini harus muncul di log bukti agar tidak ada klaim akurasi palsu.

---

## 7. `payload.cpp` — Encoder Payload (Klaim Dokumen 52 Byte, Realitanya 70)

### 7.1 API

```c
#pragma once
#include <stddef.h>
#include "types.h"

// Menulis JSON ke buf. Mengembalikan panjang byte (tanpa NUL), 0 bila gagal.
size_t payload_encode(const TelemetryFrame& f, char* buf, size_t cap);

// Untuk log/uji: cetak hex dump payload
void payload_hexdump(const char* buf, size_t len);
```

### 7.2 Implementasi acuan (tanpa ArduinoJson saat TX)

```c
size_t payload_encode(const TelemetryFrame& f, char* buf, size_t cap) {
    // Contract INTERFACES.md §1.2: key urut n, ts, m, t, ph, b — tanpa spasi
    int n = snprintf(buf, cap,
        "{\"n\":\"%s\",\"ts\":%lu,\"m\":%.1f,\"t\":%.1f,\"ph\":%.2f,\"b\":%.2f}",
        f.node_id,
        (unsigned long)f.timestamp,
        (double)f.moisture.value,
        (double)f.soil_temp.value,
        (double)f.ph.value,
        (double)f.battery.value);

    if (n <= 0 || (size_t)n >= cap) return 0;   // gagal / terpotong
    return (size_t)n;
}
```

**Mengapa `snprintf` dan bukan ArduinoJson:** kontrol penuh atas jumlah desimal dan panjang hasil, nol alokasi dinamis, dan identik di build saya maupun native. `ArduinoJson` tetap dipakai di gateway untuk **membaca** payload (`06_GATEWAY_MQTT.md`).

### 7.3 Ukuran sebenarnya — temuan penting

Payload contoh di `INTERFACES.md` §1.2:

```
{"n":"VS-A1-003","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}
```

| Klaim dokumen | Terukur |
|---|---|
| ≤ 52 byte (`INTERFACES.md` §1.2, `TELEMETRY_PAYLOAD.md` §1, `TASK_GUIDE.md` HW-1.3, `ARCHITECTURE_IOT.md` §6.1) | **70 byte** ASCII |

Kasus terburuk (Node ID 12 karakter, semua nilai panjang maksimum):

```
{"n":"XXXXXXXXXXXX","ts":1792934400,"m":100.0,"t":-10.0,"ph":10.00,"b":4.20}
```
= **76 byte**

Konsekuensi:
1. Klaim "≤52 byte" di dokumen **tidak dapat dipenuhi** dengan skema JSON ini. Batas 52 byte hanya tercapai dengan format biner (`TELEMETRY_PAYLOAD.md` §2, 13 byte).
2. Untuk LoRa SF7 BW125, 76 byte masih **sah** (batas payload LoRa 255 byte). Jadi ini bukan kegagalan teknis — ini **ketidakakuratan dokumen**.
3. Buffer harus ≥ 76 byte. Disarankan 96 byte (`PAYLOAD_BUF_SIZE`) untuk ruang aman.

Tindakan: eskalasi ke Aris (lihat `DEC-IOT-02`). Jangan mengubah `INTERFACES.md` sendiri.

---

## 8. `transport.h` — Satu Antarmuka, Dua Implementasi

```c
#pragma once
#include <stddef.h>
#include <stdint.h>
#include "types.h"

bool transport_init();
TxResult transport_send(const char* payload, size_t len);
void transport_shutdown();      // sebelum deep sleep
bool transport_available();     // false bila init gagal (mis. WiFi timeout)

#if TRANSPORT_KIND == TRANSPORT_KIND_LORA
  // tidak ada API tambahan
#elif TRANSPORT_KIND == TRANSPORT_KIND_MQTT
  const char* transport_topic();   // untuk logging
#endif
```

### 8.1 `transport_lora.cpp` (build fisik)

```c
#include "config.h"
#include "transport.h"
#include <LoRa.h>
#include <SPI.h>

bool transport_init() {
    SPI.begin(PIN_LORA_SCK, PIN_LORA_MISO, PIN_LORA_MOSI);
    LoRa.setPins(PIN_LORA_CS, PIN_LORA_RST, PIN_LORA_DIO0);
    if (!LoRa.begin(LORA_FREQUENCY)) return false;

    LoRa.setSpreadingFactor(7);
    LoRa.setSignalBandwidth(125E3);
    LoRa.setCodingRate4(5);
    LoRa.setSyncWord(LORA_SYNC_WORD);
    LoRa.setTxPower(LORA_TX_POWER);     // +17 dBm
    return true;
}

TxResult transport_send(const char* payload, size_t len) {
    TxResult r{false, 0, 0};
    for (uint8_t i = 0; i < TX_RETRY_MAX; i++) {
        r.attempts = i + 1;
        LoRa.beginPacket();
        LoRa.write((const uint8_t*)payload, len);
        if (LoRa.endPacket(/*async=*/false) == 1) {   // 1 = sukses terkirim
            r.ok = true;
            break;
        }
        if (i + 1 < TX_RETRY_MAX) delay(TX_RETRY_DELAY_MS);
    }
    return r;
}

void transport_shutdown() { LoRa.sleep(); }
```

> **Kejujuran teknis yang perlu dicatat:** `LoRa.endPacket()` pada library `sandeepmistry/LoRa` mengembalikan 1 bila modul **selesai memancarkan**, bukan bila gateway **menerima**. LoRa bersifat satu arah di level ini — tidak ada ACK pada mode *explicit header* tanpa protokol tambahan. Klaim "retry jika tidak ada ACK gateway" di `TASK_GUIDE.md` HW-1.3 **tidak dapat diimplementasikan** dengan library ini tanpa protokol ACK kustom (gateway mengirim balik paket ACK).

Dua pilihan:
- **Sederhana (dipilih untuk TKT 4):** retry hanya pada kegagalan lokal (modul tidak siap / `endPacket` gagal). Tidak ada jaminan sampai. Celah data ditangani Digital Twin.
- **Lengkap (TKT 6):** protokol ACK 1 byte + `startReceive()` timeout. Menambah waktu aktif (bertentangan dengan anggaran daya) — perlu keputusan terpisah.

Dicatat sebagai `DEC-IOT-08`.

### 8.2 `transport_mqtt.cpp` (build Wokwi / gateway)

```c
#include "config.h"
#include "transport.h"
#include <WiFi.h>
#include <PubSubClient.h>

static WiFiClient   net;
static PubSubClient mqtt(net);
static char topic[64];

bool transport_init() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(SIM_WIFI_SSID, SIM_WIFI_PASS);

    uint32_t t0 = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - t0 < WIFI_CONNECT_TIMEOUT_MS) {
        delay(200);
    }
    if (WiFi.status() != WL_CONNECTED) return false;

    snprintf(topic, sizeof(topic),
             "/volatisafe/v1/node/%s/telemetry", NODE_ID);

    mqtt.setServer(SIM_MQTT_HOST, SIM_MQTT_PORT);
    mqtt.setBufferSize(PAYLOAD_BUF_SIZE + 32);

    if (!mqtt.connect(NODE_ID)) return false;   // client id = NODE_ID (unik)
    return true;
}

TxResult transport_send(const char* payload, size_t len) {
    TxResult r{false, 0, 0};
    for (uint8_t i = 0; i < TX_RETRY_MAX; i++) {
        r.attempts = i + 1;
        if (!mqtt.connected() && !mqtt.connect(NODE_ID)) {
            delay(TX_RETRY_DELAY_MS);
            continue;
        }
        if (mqtt.publish(topic, (const uint8_t*)payload, len, /*retained=*/false)) {
            r.ok = true;
            break;
        }
        delay(TX_RETRY_DELAY_MS);
    }
    return r;
}

void transport_shutdown() {
    mqtt.disconnect();
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
}

const char* transport_topic() { return topic; }
```

**Penting:** `mqtt.setBufferSize()` default PubSubClient hanya 256 byte — cukup untuk payload 76 byte, tetapi naikkan agar ada ruang. `client id = NODE_ID` membuat broker membedakan tiap node.

**Penting 2:** deep sleep mematikan WiFi. Setiap wake harus reconnect. Itu memang perilaku yang diinginkan (paritas dengan node fisik yang memancarkan LoRa dari keadaan mati).

---

## 9. `power_mgmt.cpp`

```c
#pragma once

void power_begin();          // GPIO25 LOW, matikan radio
void power_sensorOn();
void power_sensorOff();
void power_enterDeepSleep(); // tidak kembali
uint32_t power_cycleStartMs();
```

```c
void power_begin() {
    pinMode(PIN_SENSOR_POWER, OUTPUT);
    digitalWrite(PIN_SENSOR_POWER, LOW);   // sensor OFF sejak boot
}

void power_sensorOn() {
    digitalWrite(PIN_SENSOR_POWER, HIGH);
    delay(SENSOR_WARMUP_MS);               // 200 ms stabilisasi
}

void power_sensorOff() {
    digitalWrite(PIN_SENSOR_POWER, LOW);
}

void power_enterDeepSleep() {
    Serial.flush();
    esp_sleep_enable_timer_wakeup(SLEEP_DURATION_US);
    esp_deep_sleep_start();
}
```

### 9.1 Urutan daya yang benar

```
1. power_begin()        GPIO25 LOW
2. sensors_begin()      init ADC & 1-Wire
3. power_sensorOn()     GPIO25 HIGH + 200 ms
4. sensors_sampleAll()  ~600-900 ms (5x50 ms + DS18B20 375 ms)
5. power_sensorOff()    GPIO25 LOW          <-- SEBELUM TX
6. payload_encode()
7. transport_init()     (LoRa: SPI+radio / MQTT: WiFi)
8. transport_send()
9. transport_shutdown()
10. power_enterDeepSleep()
```

Alasan langkah 5 sebelum 8: beban puncak 120 mA (LoRa) + 15 mA (sensor) secara bersamaan menurunkan tegangan baterai dan bisa memicu brownout. Mematikan sensor lebih dulu memangkas 15 mA dari puncak.

Alasan langkah 7 setelah 5: inisialisasi WiFi/LoRa memakan waktu dan arus; tidak ada gunanya menyalakan sensor selama itu.

### 9.2 Wakeup reason

```c
esp_sleep_wakeup_cause_t cause = esp_sleep_get_wakeup_cause();
if (cause == ESP_SLEEP_WAKEUP_TIMER) {
    Serial.println(F("[PWR] wake: timer"));
} else {
    Serial.println(F("[PWR] wake: power-on/reset"));
}
```

Berguna saat debugging: bila node bangun karena reset (brownout), bukan timer, itu gejala daya tidak cukup — bukan bug logika.

---

## 10. `main.cpp` — Orkestrasi

```c
#include <Arduino.h>
#include "config.h"
#include "types.h"
#include "sensors.h"
#include "payload.h"
#include "transport.h"
#include "power_mgmt.h"
#include "calibration.h"

static Calibration g_cal;

void setup() {
    Serial.begin(115200);
    Serial.println();
    Serial.printf("=== VolatiSafe %s · FW %s ===\n", NODE_ID, FIRMWARE_VERSION);
#if NODE_IS_SIMULATED
    Serial.println(F("[SIM] Build simulasi: transport MQTT, TANPA LoRa SX1278."));
#endif
#if defined(SIM_FAST_CYCLE)
    Serial.println(F("[SIM] FAST CYCLE: sleep 10s, BUKAN perilaku produksi."));
#endif

    power_begin();

    if (!calibration_begin()) {
        calibration_defaults(g_cal);
        Serial.println(F("[CAL] NVS kosong -> default compile-time (BELUM TERKALIBRASI)"));
    } else {
        g_cal.from_nvs = true;
    }
    calibration_print(g_cal);

    sensors_begin();

    // --- Satu siklus ---
    uint32_t t_cycle = millis();

    TelemetryFrame f{};
    strncpy(f.node_id, NODE_ID, sizeof(f.node_id) - 1);

    power_sensorOn();
    sensors_sampleAll(f, g_cal);
    power_sensorOff();

    f.timestamp = (uint32_t)time(nullptr);   // lihat 10.1

    char buf[PAYLOAD_BUF_SIZE];
    size_t len = payload_encode(f, buf, sizeof(buf));
    if (len == 0) {
        Serial.println(F("[ERR] encode payload gagal"));
        power_enterDeepSleep();
    }
    Serial.printf("[TX] payload %u byte: %s\n", (unsigned)len, buf);

    if (!transport_init()) {
        Serial.println(F("[ERR] transport init gagal"));
        power_enterDeepSleep();
    }
    TxResult tx = transport_send(buf, len);
    Serial.printf("[TX] ok=%d attempts=%u\n", tx.ok, tx.attempts);
    transport_shutdown();

    Serial.printf("[PWR] siklus aktif %lu ms\n", (unsigned long)(millis() - t_cycle));
    power_enterDeepSleep();
}

void loop() {
    // Tidak pernah dieksekusi: setup() berakhir pada deep sleep.
    // Dipertahankan untuk kompatibilitas Arduino.
}
```

### 10.1 Masalah timestamp — perlu keputusan

Node lapangan **tidak punya internet**, jadi tidak ada NTP. `time(nullptr)` akan mengembalikan 0 atau waktu kompilasi yang salah.

Opsi:

| Opsi | Cara | Konsekuensi |
|---|---|---|
| **A. Gateway menstempel ulang** | Node mengirim `ts` = 0 (atau `millis`), gateway memakai waktu terima | Paling akurat & paling sederhana. **Kontrak berubah** — perlu persetujuan |
| B. RTC eksternal | Tambah DS3231 (~Rp15.000) | +biaya, +I2C, drift kecil |
| C. Timestamp di-set saat provisioning | Simpan offset di NVS, hitung dari `millis` | Drift ±menit/bulan |
| D. Perkiraan dari durasi tidur | Simpan `ts` di NVS, tambah 900 s tiap siklus | Cukup akurat untuk grafik, error kumulatif bila siklus terlewat |

**Untuk TKT 3 (Wokwi):** WiFi tersedia → NTP bisa dipakai (`configTime`), masalah tidak muncul. Ini justru **menyembunyikan** masalah yang akan muncul di lapangan.

**Rekomendasi:** TKT 3 pakai NTP + `SIM_FAST_CYCLE` tetap memakai timestamp nyata. TKT 4 pakai Opsi A atau D, diputuskan bersama Syifa karena menyentuh kontrak. Dicatat sebagai `DEC-IOT-09`.

Kode untuk TKT 3:

```c
#if TRANSPORT_KIND == TRANSPORT_KIND_MQTT
  configTime(0, 0, "pool.ntp.org");     // UTC
  struct tm ti;
  if (getLocalTime(&ti, 5000)) { /* time() sudah valid */ }
#endif
```

---

## 11. Matriks Edge Case

| Kondisi | Deteksi | Perilaku yang Benar | Yang Harus Dihindari |
|---|---|---|---|
| DS18B20 terputus | `getTempCByIndex` = −127 | kirim `t = -999` | Mengirim 0 atau 25 °C |
| DS18B20 terbaca 85 °C (power-on default) | nilai = 85,0 persis | tandai error, jangan kirim 85 | Menganggapnya suhu nyata |
| Probe moisture di udara | ADC ≈ 2800 | 0,0 % | Penguatan/offset aneh |
| Probe moisture tercelup penuh | ADC ≈ 1350 | 100,0 % | Nilai >100 |
| Kabel ADC longgar | rentang 5 sampel > 800 | status `UNSTABLE` | Rata-rata yang terlihat wajar |
| pH probe belum stabil | sampel pertama jauh dari median | median sudah menanganinya | Kirim sampel pertama |
| NVS kosong | `isKey` false | pakai default + cetak peringatan | Diam-diam pakai default |
| NVS rusak | `begin()` gagal | default + peringatan | Crash |
| Baterai < 3,0 V | divider | kirim nilai asli → backend tolak/nandai | Clamp ke 3,0 |
| WiFi timeout (simulasi) | `WIFI.status()` | lewati TX, tidur, catat | Menggantung selamanya |
| MQTT broker mati | `publish` false | retry 3×, lalu tidur | Blocking tanpa batas |
| Payload > buffer | `snprintf` return ≥ cap | batalkan, jangan kirim potongan | Mengirim JSON tidak valid |
| Waktu belum sinkron | `time()` < 1700000000 | tetap kirim apa adanya + peringatan | Mengarang timestamp |

---

## 12. Anggaran Memori

Target: RAM statis < 32 KB, stack < 8 KB, flash < 1 MB.

| Alokasi | Perkiraan |
|---|---|
| Stack Arduino loop | ~8 KB (default) |
| `TelemetryFrame` | 13 + 4 + 4×8 = ~50 byte |
| `char buf[96]` (lokal di setup) | 96 byte |
| Preferences (NVS) | ~100 byte |
| Library WiFi + MQTT + lwIP | ~35–45 KB heap saat aktif |
| Library LoRa + SPI | ~2 KB heap |

Native ESP32 punya 320 KB DRAM, jadi tidak ada tekanan. Yang perlu dijaga adalah **tidak menambah** alokasi dinamis berulang, karena loop hanya berjalan sekali per siklus (lalu reset) — sebenarnya fragmentasi bukan risiko besar. Klaim "hindari String" tetap dipertahankan demi determinisme, bukan karena keterbatasan memori.

Catat RAM/Flash aktual hasil build di `07_TEST_PLAN.md` §5.

---

## 13. Gaya Kode

- Bahasa: C++11 (PlatformIO default Arduino-ESP32). Tidak perlu C++17.
- Penamaan: `snake_case` untuk fungsi & variabel, `PascalCase` untuk struct/enum, `UPPER_SNAKE` untuk makro.
- Setiap modul: header di `include/`, implementasi di `src/`.
- Guard header: `#pragma once`.
- Log Serial bersifat wajib pada setiap blok keputusan (init gagal, kalibrasi default, TX gagal) — log adalah bukti untuk `07_TEST_PLAN.md` §6.
- Jangan menulis komentar yang mengulang kode (`// increment i`). Komentar hanya untuk **mengapa**.

---

## 14. Yang Tidak Boleh Ada di Firmware

- Query SQL / koneksi database (batas domain, `../README.md` §2)
- Panggilan HTTP/REST ke backend (node tidak punya internet di lapangan)
- Kredensial MQTT/API dalam plaintext yang di-commit
- `#include <backend/...>` atau dependensi ke kode Python
- Logika AI/AVRI — itu domain AI Engine, bukan node
- Field JSON baru di luar `n, ts, m, t, ph, b`
