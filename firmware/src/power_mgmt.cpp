#include <Arduino.h>
#include <esp_sleep.h>
#include <esp_system.h>

#include "config.h"
#include "power_mgmt.h"

static uint32_t s_cycle_start_ms = 0;

#if defined(SIM_FAST_CYCLE)
static bool     s_sim_sleeping = false;
static uint32_t s_sim_wake_ms = 0;
#endif

static void printWakeupReason() {
  switch (esp_sleep_get_wakeup_cause()) {
    case ESP_SLEEP_WAKEUP_TIMER:
      Serial.println(F("[PWR] wake: timer"));
      break;
    case ESP_SLEEP_WAKEUP_UNDEFINED:
#if defined(SIM_FAST_CYCLE)
      // Wokwi tidak menyelesaikan deep sleep timer dengan bersih; build
      // simulasi memakai restart (lihat power_enterDeepSleep).
      if (esp_reset_reason() == ESP_RST_POWERON) {
        Serial.println(F("[PWR] wake: power-on/reset"));
      } else {
        Serial.println(F("[PWR] wake: reset (SIM sleep)"));
      }
#else
      Serial.println(F("[PWR] wake: power-on/reset"));
#endif
      break;
    default:
      Serial.printf("[PWR] wake: cause=%d\n", (int)esp_sleep_get_wakeup_cause());
      break;
  }
}

void power_begin() {
  pinMode(PIN_SENSOR_POWER, OUTPUT);
  digitalWrite(PIN_SENSOR_POWER, LOW);   // sensor mati sejak boot
  printWakeupReason();
  s_cycle_start_ms = millis();
}

void power_sensorOn() {
  Serial.println(F("[PWR] sensor ON"));
  digitalWrite(PIN_SENSOR_POWER, HIGH);
  delay(SENSOR_WARMUP_MS);
}

void power_sensorOff() {
  digitalWrite(PIN_SENSOR_POWER, LOW);
  Serial.println(F("[PWR] sensor OFF"));
}

uint32_t power_cycleStartMs() {
  return s_cycle_start_ms;
}

void power_enterDeepSleep() {
  Serial.printf("[PWR] tidur %llu detik\n",
                (unsigned long long)(SLEEP_DURATION_US / 1000000ULL));
  Serial.flush();

#if defined(SIM_FAST_CYCLE)
  // Wokwi memblokir di dalam esp_deep_sleep_start() dan memicu task watchdog
  // sebelum timer 10 detik berbunyi. Build simulasi karena itu menunggu di
  // loop() lalu restart; jalur deep sleep asli tetap dikompilasi untuk fisik.
  s_sim_sleeping = true;
  s_sim_wake_ms = millis() + (uint32_t)(SLEEP_DURATION_US / 1000ULL);
#else
  esp_sleep_enable_timer_wakeup(SLEEP_DURATION_US);
  esp_deep_sleep_start();
#endif
}

#if defined(SIM_FAST_CYCLE)
bool power_simSleepDue() {
  return s_sim_sleeping && (int32_t)(millis() - s_sim_wake_ms) >= 0;
}
#endif
