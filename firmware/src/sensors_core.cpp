// Fungsi murni tanpa hardware. Hanya file ini + payload.cpp yang ikut
// dikompilasi ke env:native, jadi jangan tarik Arduino.h ke sini.
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
