#pragma once
#include <stdint.h>

#include "calibration.h"
#include "types.h"

// Satu burst pembacaan ADC. median berisi median-average (DEC-IOT-06),
// bukan median sejati: min dan max dibuang supaya dua outlier ikut hilang.
struct AdcBurst {
  uint16_t median;
  uint16_t min;
  uint16_t max;
};

void sensors_begin();
void sensors_sampleAll(TelemetryFrame& out, const Calibration& cal);

// Butuh hardware, tidak ikut env:native.
void     sensors_readAdcBurst(uint8_t pin, AdcBurst& out);
uint16_t sensors_readAdcMedian(uint8_t pin);
uint16_t sensors_readAdcBattery();
bool     sensors_readSoilTemp(float& t_c);

// Murni, tanpa hardware, diuji di env:native (HW-3.5).
float sensors_medianAverage(const uint16_t* samples, uint8_t n);
float sensors_adcToMoisturePct(uint16_t adc, uint16_t dry, uint16_t wet);
float sensors_adcToPh(uint16_t adc, float neutral_adc, float slope, float moisture_pct);
float sensors_adcToBatteryV(uint16_t adc);
bool  sensors_isUnstable(uint16_t min, uint16_t max);
void  sensors_classifyTemp(float t_c, SensorReading& out);
void  sensors_composeFrame(const AdcBurst& moist, const AdcBurst& ph,
                           uint16_t batt_adc, float temp_c,
                           const Calibration& cal, TelemetryFrame& out);
