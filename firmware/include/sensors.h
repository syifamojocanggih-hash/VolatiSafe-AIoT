#pragma once
#include "types.h"

// Pin mode + bus ADC/1-Wire. Tidak menyalakan sensor: itu tugas power_mgmt.
void sensors_begin();

// Sampling penuh. Power gate diatur pemanggil, bukan di sini.
void sensors_sampleAll(TelemetryFrame& out);

// Fungsi murni tanpa hardware, supaya bisa diuji di env native (HW-3.5).
float sensors_medianAverage(const uint16_t* samples, uint8_t n);
float sensors_adcToMoisturePct(uint16_t adc, uint16_t dry, uint16_t wet);
float sensors_adcToPh(uint16_t adc, float neutral_adc, float slope, float moisture_pct);
float sensors_adcToBatteryV(uint16_t adc);
