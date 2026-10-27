#ifndef POWER_MGMT_H
#define POWER_MGMT_H

#include <Arduino.h>

class PowerManager {
public:
    static void configureLowPowerModes();
    static void enterDeepSleep(uint64_t sleep_time_us);
    static void printWakeupReason();
    static uint32_t getBootCount();
};

#endif // POWER_MGMT_H
