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
  // TODO HW-2.1: sensors_readAdcMedian(). HW-2.2: DS18B20. Lalu rakit frame
  // memakai fungsi murni di sensors_core.cpp yang sudah teruji native.
  out = TelemetryFrame();
  Serial.println(F("[STUB] sensors_sampleAll belum ada (HW-2.1..2.2)"));
}
