#pragma once
#include <stdint.h>

void     power_begin();           // GPIO25 LOW, sensor mati sejak boot
void     power_sensorOn();
void     power_sensorOff();
void     power_enterDeepSleep();  // tidak kembali
uint32_t power_cycleStartMs();
