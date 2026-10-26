#include <Arduino.h>

#include "calibration.h"
#include "config.h"

void calibration_defaults(Calibration& c) {
  c.moist_dry      = MOISTURE_DRY_ADC;
  c.moist_wet      = MOISTURE_WET_ADC;
  c.ph_neutral_adc = PH_NEUTRAL_ADC;
  c.ph_slope       = PH_SLOPE;
  c.from_nvs       = false;
}

bool calibration_begin() {
  // TODO HW-2.6: Preferences NVS keys m_dry, m_wet, ph_n, ph_s.
  return false;
}

bool calibration_save(const Calibration& c) {
  // TODO HW-2.6
  (void)c;
  return false;
}

void calibration_print(const Calibration& c) {
  Serial.printf("[CAL] moist_dry=%u moist_wet=%u ph_n=%.1f ph_s=%.1f from_nvs=%d\n",
                c.moist_dry, c.moist_wet, c.ph_neutral_adc, c.ph_slope,
                (int)c.from_nvs);
}
