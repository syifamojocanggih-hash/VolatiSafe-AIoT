#pragma once
#include <stdint.h>

void     power_begin();           // GPIO25 LOW, sensor mati sejak boot
void     power_sensorOn();
void     power_sensorOff();
void     power_enterDeepSleep();  // tidak kembali
uint32_t power_cycleStartMs();

#if defined(SIM_FAST_CYCLE)
// Build simulasi: true saat durasi tidur selesai dan node harus restart.
bool power_simSleepDue();
#endif
