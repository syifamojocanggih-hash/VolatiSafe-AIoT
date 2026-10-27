/**
 * VolatiSafe-AIoT — Edge Telemetry Node Firmware
 * Target MCU : ESP32 NodeMCU V1 (30-pin)
 * Transceiver: LoRa SX1278 (Ra-02 433 MHz)
 * Sensors    : Capacitive Moisture v1.2, DS18B20 Temp Probe, Analog Soil pH
 * 
 * Specifications: docs/hardware/FIRMWARE_SPEC.md & docs/hardware/PINOUT_AND_SCHEMATICS.md
 */

#include <Arduino.h>
#include "config.h"
#include "sensors.h"
#include "lora_comm.h"
#include "power_mgmt.h"

SensorManager sensorMgr;
LoRaCommunicator loraComm;

void setup() {
    // 1. Inisialisasi Serial untuk pemantauan & debug
    Serial.begin(115200);
    delay(500);

    Serial.println(F("\n======================================================="));
    Serial.printf(  "  VOLATISAFE AIoT NODE [%s] — %s\n", NODE_ID, FIRMWARE_VERSION);
    Serial.println(F("======================================================="));

    // 2. Konfigurasi Low Power Mode (Matikan WiFi & Bluetooth)
    PowerManager::configureLowPowerModes();
    PowerManager::printWakeupReason();

    // 3. Inisialisasi Hardware Sensor
    sensorMgr.begin();

    // 4. Sampling Burst & Edge Filtering (Median Filter + Kalibrasi)
    Serial.println(F("[ACQUIRE] Mengaktifkan MOSFET gate & mengambil sampel sensor..."));
    unsigned long t_start = millis();
    SensorReading reading = sensorMgr.acquireBurstSamples();
    unsigned long sample_duration = millis() - t_start;

    // Output Telemetri Edge Terkalibrasi
    Serial.printf("[SENSOR-OK] Durasi Sampling: %lu ms\n", sample_duration);
    Serial.printf("  -> Kelembaban Tanah : %.1f %% VWC\n", reading.moisture_pct);
    Serial.printf("  -> Suhu Tanah       : %.1f deg C\n", reading.soil_temp_c);
    Serial.printf("  -> pH Terkoreksi    : %.2f\n", reading.ph);
    Serial.printf("  -> Tegangan Baterai : %.2f V\n", reading.battery_v);

    // 5. Inisialisasi & Transmisi LoRa SX1278
    if (loraComm.begin()) {
        // Hitung estimasi epoch timestamp (atau baca RTC jika modul DS3231 terpasang)
        uint32_t simulated_epoch = 1792934400 + (PowerManager::getBootCount() * (uint32_t)SLEEP_INTERVAL_SECONDS);
        bool tx_status = loraComm.transmitTelemetry(reading, simulated_epoch);
        if (tx_status) {
            Serial.println(F("[STATUS] Siklus transmisi telemetri berhasil diselesaikan!"));
        } else {
            Serial.println(F("[STATUS-WARN] Transmisi LoRa gagal setelah 3x percobaan. Paket dibuang."));
        }
        loraComm.sleep();
    }

    // 6. Masuk ke Deep Sleep 15 Menit (Konsumsi daya ~10 uA)
    PowerManager::enterDeepSleep(SLEEP_INTERVAL_US);
}

void loop() {
    // Kosong: ESP32 selalu reboot ke setup() setelah timer deep sleep berakhir.
}
