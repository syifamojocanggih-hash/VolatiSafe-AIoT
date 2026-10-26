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
bool calibration_begin();               // true bila NVS berisi nilai kalibrasi
bool calibration_save(const Calibration& c);
void calibration_print(const Calibration& c);
