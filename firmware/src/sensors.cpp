#include <Arduino.h>

#include "config.h"
#include "sensors.h"

void sensors_begin() {
  analogSetAttenuation(ADC_ATTENUATION);
  analogReadResolution(12);
  pinMode(PIN_DS18B20, INPUT_PULLUP);   // pull-up eksternal 4.7k tetap wajib

  Serial.printf("[SENS] ADC1 12-bit, atten 11dB, 1-Wire di GPIO%d\n", PIN_DS18B20);
}

void sensors_sampleAll(TelemetryFrame& out) {
  // TODO HW-2.1..2.5: median-average 5x, DS18B20, konversi VWC/pH/baterai.
  out = TelemetryFrame();
  Serial.println(F("[STUB] sensors_sampleAll belum ada (HW-2.x)"));
}

float sensors_medianAverage(const uint16_t* samples, uint8_t n) {
  // TODO HW-2.1: buang satu min & satu max, rata-rata sisanya (DEC-IOT-06).
  (void)samples;
  (void)n;
  return 0.0f;
}

float sensors_adcToMoisturePct(uint16_t adc, uint16_t dry, uint16_t wet) {
  // TODO HW-2.3
  (void)adc;
  (void)dry;
  (void)wet;
  return 0.0f;
}

float sensors_adcToPh(uint16_t adc, float neutral_adc, float slope, float moisture_pct) {
  // TODO HW-2.4
  (void)adc;
  (void)neutral_adc;
  (void)slope;
  (void)moisture_pct;
  return 0.0f;
}

float sensors_adcToBatteryV(uint16_t adc) {
  // TODO HW-2.5
  (void)adc;
  return 0.0f;
}
