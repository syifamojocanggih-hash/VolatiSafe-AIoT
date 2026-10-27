#include "power_mgmt.h"
#include <WiFi.h>
#include <esp_bt.h>
#include <esp_wifi.h>
#include <esp_sleep.h>

RTC_DATA_ATTR static uint32_t bootCount = 0;

void PowerManager::configureLowPowerModes() {
    // 1. Nonaktifkan WiFi & Bluetooth untuk menghemat arus (~80mA penghematan)
    WiFi.mode(WIFI_OFF);
    esp_wifi_stop();
    btStop();
    esp_bt_controller_disable();

    // 2. Increment boot count yang tersimpan di RTC Slow Memory
    bootCount++;
}

void PowerManager::printWakeupReason() {
    esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
    Serial.printf("[PWR-INFO] Boot Count: %u | Wakeup Cause: ", bootCount);
    switch (wakeup_reason) {
        case ESP_SLEEP_WAKEUP_TIMER:
            Serial.println(F("TIMER (Siklus 15 Menit)"));
            break;
        case ESP_SLEEP_WAKEUP_EXT0:
            Serial.println(F("EXTERNAL RTC_IO"));
            break;
        case ESP_SLEEP_WAKEUP_UNDEFINED:
        default:
            Serial.println(F("POWER ON / RESET"));
            break;
    }
}

uint32_t PowerManager::getBootCount() {
    return bootCount;
}

void PowerManager::enterDeepSleep(uint64_t sleep_time_us) {
    Serial.printf("[PWR-SLEEP] Memasuki Deep Sleep selama %llu detik (~10 uA)...\n", sleep_time_us / 1000000ULL);
    Serial.flush();

    // 1. Konfigurasi Timer Wakeup ESP32
    esp_sleep_enable_timer_wakeup(sleep_time_us);

    // 2. Mulai deep sleep
    esp_deep_sleep_start();
}
