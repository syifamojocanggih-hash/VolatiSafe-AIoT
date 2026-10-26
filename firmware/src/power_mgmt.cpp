#include <Arduino.h>

#include "config.h"
#include "power_mgmt.h"

static uint32_t s_cycle_start_ms = 0;

void power_begin() {
  pinMode(PIN_SENSOR_POWER, OUTPUT);
  digitalWrite(PIN_SENSOR_POWER, LOW);   // sensor mati sejak boot
  s_cycle_start_ms = millis();
}

void power_sensorOn() {
  digitalWrite(PIN_SENSOR_POWER, HIGH);
  delay(SENSOR_WARMUP_MS);
}

void power_sensorOff() {
  digitalWrite(PIN_SENSOR_POWER, LOW);
}

uint32_t power_cycleStartMs() {
  return s_cycle_start_ms;
}

void power_enterDeepSleep() {
  // TODO HW-4.2: timer wakeup + radio off.
  // FASE 1 sengaja tidak tidur supaya log siklus tetap terlihat di Wokwi.
  Serial.println(F("[STUB] power_enterDeepSleep belum aktif (HW-4.2)"));
}
