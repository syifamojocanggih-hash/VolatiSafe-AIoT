#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ==========================================
// NODE IDENTITY
// ==========================================
#define NODE_ID "VS-A1-003"
#define FIELD_ID "BLOK-A"
#define FIRMWARE_VERSION "v1.0.2-prod"

// ==========================================
// PINOUT MAPPING (PINOUT_AND_SCHEMATICS.md)
// ==========================================
// Sensor Inputs (Must use ADC1: GPIO 32-39)
#define PIN_MOISTURE_ADC     34  // ADC1_CH6 (Capacitive v1.2)
#define PIN_PH_ADC           32  // ADC1_CH4 (Soil pH Probe Amplifier)
#define PIN_BATTERY_ADC      35  // ADC1_CH7 (100k/100k voltage divider)

// Digital & 1-Wire
#define PIN_ONEWIRE_TEMP     4   // DS18B20 1-Wire Data (+ 4.7k pull-up to 3.3V)
#define PIN_POWER_GATE       25  // MOSFET Gate Switch (HIGH=ON, LOW=OFF)

// LoRa SX1278 SPI Bus
#define PIN_LORA_SCK         18
#define PIN_LORA_MISO        19
#define PIN_LORA_MOSI        23
#define PIN_LORA_CS          5
#define PIN_LORA_RST         14
#define PIN_LORA_DIO0        2

// ==========================================
// CALIBRATION CONSTANTS (FIRMWARE_SPEC.md §2)
// ==========================================
// Moisture Sensor: Dry air vs saturated water
#define DEFAULT_DRY_ADC      2800
#define DEFAULT_WET_ADC      1350

// pH Probe Calibration: 2-point buffer (4.01 and 6.86)
#define DEFAULT_PH_NEUTRAL_ADC  2048  // ADC reading at pH 7.00
#define DEFAULT_PH_SLOPE        -195.0 // ADC units per pH unit

// Battery Voltage Divider: 100k / 100k (Ratio = 2.0)
// ESP32 ADC full-scale: ~3.3V at 4095 with 11dB attenuation
#define BATTERY_DIVIDER_RATIO   2.00f
#define ADC_REF_VOLTAGE         3.30f
#define ADC_MAX_VALUE           4095.0f

// ==========================================
// POWER MANAGEMENT & TIMING
// ==========================================
// Deep sleep interval: 15 minutes (900 seconds)
#define SLEEP_INTERVAL_SECONDS  900ULL
#define SLEEP_INTERVAL_US       (SLEEP_INTERVAL_SECONDS * 1000000ULL)

// Sampling burst stabilization delay
#define SENSOR_WARMUP_MS        200
#define SAMPLE_BURST_COUNT      5
#define SAMPLE_BURST_INTERVAL_MS 40

// Max transmission retries
#define LORA_MAX_RETRIES        3
#define LORA_RETRY_INTERVAL_MS  2000

#endif // CONFIG_H
