#pragma once
#include <stdint.h>

// Per-channel status: one broken sensor must not invalidate the other three.
// Satu flag global akan membuang seluruh paket saat hanya DS18B20 yang putus.
enum SensorStatus : uint8_t {
  SENSOR_OK           = 0,
  SENSOR_DISCONNECTED = 1,   // DS18B20 -127C / ADC mentok
  SENSOR_OUT_OF_RANGE = 2,   // di luar batas fisik
  SENSOR_UNSTABLE     = 3,   // variansi antar sampel terlalu tinggi
  SENSOR_NOT_PRESENT  = 4    // kanal belum terpasang, nilai placeholder
};

struct SensorReading {
  float        value;
  SensorStatus status;
};

// Satu-satunya bentuk data yang melintas antar-modul (04_FIRMWARE_CORE.md 4).
struct TelemetryFrame {
  char     node_id[13];      // 12 char + NUL, batas INTERFACES.md 1.2
  uint32_t timestamp;        // Unix epoch detik
  SensorReading moisture;    // % VWC   0.0 - 100.0
  SensorReading soil_temp;   // degC   -10.0 - 60.0
  SensorReading ph;          // pH      3.00 - 10.00
  SensorReading battery;     // Volt    2.80 - 4.25
};

struct TxResult {
  bool    ok;
  uint8_t attempts;
  int16_t rssi;              // 0 bila transport tidak bisa melaporkan
};
