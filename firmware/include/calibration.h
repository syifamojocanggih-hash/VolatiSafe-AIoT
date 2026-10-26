#pragma once
#include <stdint.h>

struct Calibration {
  uint16_t moist_dry;
  uint16_t moist_wet;
  float    ph_neutral_adc;
  float    ph_slope;
  bool     from_nvs;   // false = masih memakai default compile-time
};

void calibration_defaults(Calibration& c);
void calibration_print(const Calibration& c);

// Mengisi out hanya bila NVS berisi nilai yang lolos calibration_validate.
// Nilai keluar lewat parameter karena satu-satunya jalan; versi tanpa
// parameter di 04_FIRMWARE_CORE.md 6 tidak bisa mengembalikan apa pun.
bool calibration_begin(Calibration& out);
bool calibration_save(const Calibration& c);

// Murni, tanpa NVS, supaya bisa diuji di env native.
bool calibration_validate(const Calibration& c);
