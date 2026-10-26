// ============================================================================
// main.cpp — Entry point node lapangan VolatiSafe AIoT
// ESP32 NodeMCU V1 · LoRa SX1278 433 MHz · Deep Sleep 15 menit
//
// TAHAP 1 (HW-1.1): skeleton proyek, pinout, dan inisialisasi dasar.
// Implementasi sensor/LoRa/daya penuh ditambahkan pada HW-1.2 .. HW-1.4.
// ============================================================================

#include <Arduino.h>

#include "config.h"

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println();
  Serial.println(F("========================================"));
  Serial.println(F(" VolatiSafe AIoT — Field Node Firmware"));
  Serial.print(F(" Node ID  : "));
  Serial.println(NODE_ID);
  Serial.print(F(" Firmware : "));
  Serial.println(FIRMWARE_VERSION);
  Serial.println(F("========================================"));

  // --- Inisialisasi pin ---
  // MOSFET gate mulai OFF agar sensor tidak menyala sebelum siklus sampling.
  pinMode(PIN_SENSOR_POWER, OUTPUT);
  digitalWrite(PIN_SENSOR_POWER, LOW);

  pinMode(PIN_LORA_CS, OUTPUT);
  digitalWrite(PIN_LORA_CS, HIGH);
  pinMode(PIN_LORA_RST, OUTPUT);

  // --- Konfigurasi ADC (ADC1, 11 dB attenuation) ---
  analogSetAttenuation(ADC_ATTENUATION);

  // --- Ringkasan pinout untuk verifikasi cepat ---
  Serial.println(F("[PINOUT]"));
  Serial.printf("  Moisture  : GPIO%d (ADC1_CH6)\n", PIN_MOISTURE);
  Serial.printf("  pH        : GPIO%d (ADC1_CH4)\n", PIN_PH);
  Serial.printf("  Battery   : GPIO%d (ADC1_CH7)\n", PIN_BATTERY);
  Serial.printf("  DS18B20   : GPIO%d (1-Wire)\n", PIN_DS18B20);
  Serial.printf("  SensorPwr : GPIO%d (MOSFET gate)\n", PIN_SENSOR_POWER);
  Serial.printf("  LoRa SPI  : SCK%d MISO%d MOSI%d CS%d RST%d DIO0%d\n",
                PIN_LORA_SCK, PIN_LORA_MISO, PIN_LORA_MOSI,
                PIN_LORA_CS, PIN_LORA_RST, PIN_LORA_DIO0);
  Serial.println(F("[OK] Bootstrap selesai. Siap untuk HW-1.2 (sensor driver)."));
}

void loop() {
  // Placeholder: siklus sampling -> LoRa TX -> deep sleep ditambahkan pada
  // HW-1.2 s/d HW-1.4. Untuk saat ini hanya heartbeat serial.
  Serial.println(F("[LOOP] menunggu implementasi siklus sampling..."));
  delay(5000);
}
