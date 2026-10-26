// Fungsi murni tanpa hardware. Hanya file ini, payload.cpp, dan
// calibration_core.cpp yang ikut env:native, jadi jangan tarik Arduino.h.
#include "config.h"
#include "sensors.h"

static float clampf(float v, float lo, float hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

// Buang satu min & satu max, rata-rata sisanya (DEC-IOT-06: median-average,
// bukan median sejati, supaya dua outlier sekaligus ikut terbuang).
float sensors_medianAverage(const uint16_t* s, uint8_t n) {
  if (n == 0) return 0.0f;
  if (n <= 2) {
    uint32_t sum = 0;
    for (uint8_t i = 0; i < n; i++) sum += s[i];
    return (float)sum / (float)n;
  }

  uint16_t mn = s[0], mx = s[0];
  uint32_t sum = 0;
  for (uint8_t i = 0; i < n; i++) {
    if (s[i] < mn) mn = s[i];
    if (s[i] > mx) mx = s[i];
    sum += s[i];
  }
  return (float)(sum - mn - mx) / (float)(n - 2);
}

float sensors_adcToMoisturePct(uint16_t adc, uint16_t dry, uint16_t wet) {
  if (dry == wet) return 0.0f;   // kalibrasi tidak valid, jangan bagi nol
  float pct = ((float)dry - (float)adc) / ((float)dry - (float)wet) * 100.0f;
  return clampf(pct, MOISTURE_MIN, MOISTURE_MAX);
}

float sensors_adcToPh(uint16_t adc, float neutral_adc, float slope, float moisture_pct) {
  // Slope 0 berarti kalibrasi rusak. Kembalikan 0, bukan inf yang ter-clamp
  // jadi pH_MIN, supaya backend menolak lewat bounds check 3.0-10.0.
  if (slope <= 0.0f) return 0.0f;

  float raw = 7.0f - ((float)adc - neutral_adc) / slope;
  float corrected = raw + 0.15f * (50.0f - moisture_pct) / 50.0f;
  return clampf(corrected, PH_MIN, PH_MAX);
}

float sensors_adcToBatteryV(uint16_t adc) {
  return ((float)adc / ADC_MAX) * ADC_REF_VOLTAGE * BATTERY_DIVIDER;
}

bool sensors_isUnstable(uint16_t min, uint16_t max) {
  return (uint16_t)(max - min) > (uint16_t)ADC_UNSTABLE_RANGE;
}

void sensors_classifyTemp(float t_c, SensorReading& out) {
  if (t_c <= TEMP_DISCONNECTED_C) {
    out.value  = TEMP_ERROR_FLAG;
    out.status = SENSOR_DISCONNECTED;
    return;
  }
  // Nilai di luar rentang dikirim apa adanya, tidak di-clamp: menyamarkan
  // kerusakan sensor jadi pembacaan wajar justru membuat data palsu lolos.
  out.value  = t_c;
  out.status = (t_c < SOIL_TEMP_MIN || t_c > SOIL_TEMP_MAX) ? SENSOR_OUT_OF_RANGE
                                                            : SENSOR_OK;
}

void sensors_composeFrame(const AdcBurst& moist, const AdcBurst& ph,
                          uint16_t batt_adc, float temp_c,
                          const Calibration& cal, TelemetryFrame& out) {
  out.moisture.value = sensors_adcToMoisturePct(moist.median, cal.moist_dry, cal.moist_wet);
  out.moisture.status = sensors_isUnstable(moist.min, moist.max) ? SENSOR_UNSTABLE
                                                                 : SENSOR_OK;

  // Kompensasi pH memakai moisture yang baru dihitung, bukan nilai mentah.
  out.ph.value = sensors_adcToPh(ph.median, cal.ph_neutral_adc, cal.ph_slope,
                                 out.moisture.value);
  out.ph.status = sensors_isUnstable(ph.min, ph.max) ? SENSOR_UNSTABLE : SENSOR_OK;

  sensors_classifyTemp(temp_c, out.soil_temp);

  out.battery.value  = sensors_adcToBatteryV(batt_adc);
  out.battery.status = SENSOR_OK;
}
