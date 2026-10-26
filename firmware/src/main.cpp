#include <Arduino.h>

#include "calibration.h"
#include "config.h"
#include "payload.h"
#include "power_mgmt.h"
#include "sensors.h"
#include "transport.h"
#include "types.h"

static Calibration g_cal;

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println();
  Serial.printf("=== VolatiSafe %s | FW %s ===\n", NODE_ID, FIRMWARE_VERSION);

#if NODE_IS_SIMULATED
  Serial.println(F("[SIM] build simulasi: transport MQTT, tanpa SX1278"));
#endif
#if defined(SIM_FAST_CYCLE)
  Serial.println(F("[SIM] FAST CYCLE: sleep 10s, BUKAN perilaku produksi"));
#endif

  power_begin();
  sensors_begin();

  calibration_defaults(g_cal);
  if (calibration_begin()) {
    Serial.println(F("[CAL] NVS terbaca"));
  } else {
    Serial.println(F("[CAL] NVS kosong. Memakai default compile-time (BELUM TERKALIBRASI)."));
  }
  calibration_print(g_cal);

  Serial.println(F("[STUB] siklus sampling -> encode -> TX -> sleep belum ada"));
  Serial.println(F("[STUB] urutan final: HW-2.x sensor, HW-3.x payload/TX, HW-4.3 orkestrasi"));
}

void loop() {
  Serial.printf("[LOOP] heartbeat %lu ms\n", (unsigned long)millis());
  delay(5000);
}
