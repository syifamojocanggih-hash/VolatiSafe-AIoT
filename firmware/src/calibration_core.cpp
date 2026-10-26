#include <stdint.h>

#include "calibration.h"
#include "config.h"

void calibration_defaults(Calibration& c) {
  c.moist_dry      = MOISTURE_DRY_ADC;
  c.moist_wet      = MOISTURE_WET_ADC;
  c.ph_neutral_adc = PH_NEUTRAL_ADC;
  c.ph_slope       = PH_SLOPE;
  c.from_nvs       = false;
}

// Nilai NVS bisa berasal dari siklus kalibrasi yang gagal separuh jalan atau
// dari flash yang korup. Tanpa gerbang ini, kalibrasi rusak menghasilkan
// moisture negatif dan pH inf yang ter-clamp jadi kelihatan wajar.
bool calibration_validate(const Calibration& c) {
  if (c.moist_wet == 0) return false;
  if (c.moist_dry > (uint16_t)ADC_MAX) return false;

  // Sensor kapasitif: kering = tegangan tinggi = ADC tinggi.
  if (c.moist_dry <= c.moist_wet) return false;

  if (!(c.ph_slope > 0.0f)) return false;   // menangkap NaN juga
  if (c.ph_neutral_adc < 0.0f || c.ph_neutral_adc > ADC_MAX) return false;

  return true;
}
