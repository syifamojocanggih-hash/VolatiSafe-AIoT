#include "lora_comm.h"
#include "config.h"
#include <SPI.h>
#include <LoRa.h>
#include <ArduinoJson.h>

LoRaCommunicator::LoRaCommunicator() : initialized(false) {}

bool LoRaCommunicator::begin() {
    // 1. Setup SPI pins khusus LoRa
    SPI.begin(PIN_LORA_SCK, PIN_LORA_MISO, PIN_LORA_MOSI, PIN_LORA_CS);
    LoRa.setPins(PIN_LORA_CS, PIN_LORA_RST, PIN_LORA_DIO0);

    // 2. Inisialisasi frekuensi 433 MHz (Ra-02)
    if (!LoRa.begin(433E6)) {
        Serial.println(F("[LORA-ERR] Gagal mendeteksi modul SX1278! Periksa koneksi SPI."));
        initialized = false;
        return false;
    }

    // 3. Konfigurasi Modulasi RF (Spreading Factor, Bandwidth, TxPower)
    LoRa.setSpreadingFactor(7);           // SF7 (keseimbangan ToA dan jarak jangkau)
    LoRa.setSignalBandwidth(125E3);       // 125 kHz
    LoRa.setCodingRate4(5);               // CR 4/5
    LoRa.setSyncWord(0x12);               // Private network sync word
    LoRa.setPreambleLength(8);
    LoRa.setTxPower(17, PA_OUTPUT_PA_BOOST_PIN); // +17 dBm (daya pancar optimal)

    initialized = true;
    Serial.println(F("[LORA-OK] SX1278 Ra-02 siap pada 433.0 MHz (SF7/BW125/CR5)."));
    return true;
}

String LoRaCommunicator::buildJsonPayload(const SensorReading& reading, uint32_t epoch_ts) {
    // Format JSON 52-Byte (Strict Contract INTERFACES.md §1 & TELEMETRY_PAYLOAD.md)
    // Contoh: {"n":"VS-A1-003","ts":1792934400,"m":22.4,"t":34.1,"ph":7.83,"b":3.87}
    StaticJsonDocument<128> doc;
    doc["n"]  = NODE_ID;
    doc["ts"] = epoch_ts;
    doc["m"]  = round(reading.moisture_pct * 10.0f) / 10.0f;
    doc["t"]  = round(reading.soil_temp_c * 10.0f) / 10.0f;
    doc["ph"] = round(reading.ph * 100.0f) / 100.0f;
    doc["b"]  = round(reading.battery_v * 100.0f) / 100.0f;

    String payload;
    serializeJson(doc, payload);
    return payload;
}

bool LoRaCommunicator::transmitTelemetry(const SensorReading& reading, uint32_t epoch_ts) {
    if (!initialized) {
        if (!begin()) return false;
    }

    String payload = buildJsonPayload(reading, epoch_ts);
    Serial.printf("[LORA-TX] Mengirim paket (%d byte): %s\n", payload.length(), payload.c_str());

    bool success = false;
    for (int attempt = 1; attempt <= LORA_MAX_RETRIES; attempt++) {
        LoRa.beginPacket();
        LoRa.print(payload);
        int tx_result = LoRa.endPacket();

        if (tx_result == 1) {
            Serial.printf("[LORA-TX] Percobaan ke-%d BERHASIL terkirim via LoRa.\n", attempt);
            success = true;
            break;
        } else {
            Serial.printf("[LORA-WARN] Percobaan ke-%d GAGAL. Menunggu retry...\n", attempt);
            delay(LORA_RETRY_INTERVAL_MS);
        }
    }

    return success;
}

void LoRaCommunicator::sleep() {
    if (initialized) {
        LoRa.sleep(); // Masuk mode low-power sleep (< 1 µA)
        Serial.println(F("[LORA-PWR] SX1278 dialihkan ke mode SLEEP."));
    }
}
