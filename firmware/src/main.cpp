#include <Arduino.h>

#include "calibration.h"
#include "config.h"
#include "payload.h"
#include "power_mgmt.h"
#include "sensors.h"
#include "transport.h"
#include "types.h"

static Calibration g_cal;

#if defined(SENSOR_PROBE)
static const char* statusName(SensorStatus s) {
  switch (s) {
    case SENSOR_OK:           return "OK";
    case SENSOR_DISCONNECTED: return "DISC";
    case SENSOR_OUT_OF_RANGE: return "RANGE";
    case SENSOR_UNSTABLE:     return "UNSTABLE";
  }
  return "?";
}
#endif

#if defined(CAL_NVS_SELFTEST)
// Membuktikan calibration_save + calibration_begin benar-benar menulis dan
// membaca NVS, bukan hanya lulus di unit test. Nilai sengaja berbeda dari
// default compile-time supaya tertukar nilai langsung kelihatan. Wokwi-only,
// dihapus bersama SENSOR_PROBE saat HW-4.3.
static void calibrationSelftest(const Calibration& original) {
  Calibration t = original;
  t.moist_dry      = 2760;
  t.moist_wet      = 1310;
  t.ph_neutral_adc = 1470.0f;
  t.ph_slope       = 305.0f;

  if (!calibration_save(t)) {
    Serial.println(F("[CAL] selftest GAGAL: simpan ditolak"));
    return;
  }

  Calibration back{};
  if (!calibration_begin(back)) {
    Serial.println(F("[CAL] selftest GAGAL: NVS tidak terbaca ulang"));
    return;
  }

  const bool same = back.from_nvs && back.moist_dry == t.moist_dry &&
                    back.moist_wet == t.moist_wet &&
                    back.ph_neutral_adc == t.ph_neutral_adc &&
                    back.ph_slope == t.ph_slope;

  Serial.printf("[CAL] selftest %s: m_dry=%u m_wet=%u ph_n=%.1f ph_s=%.1f from_nvs=%d\n",
                same ? "OK" : "MISMATCH", back.moist_dry, back.moist_wet,
                back.ph_neutral_adc, back.ph_slope, (int)back.from_nvs);
}
#endif

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
#if defined(SENSOR_PROBE)
  Serial.println(F("[SIM] SENSOR_PROBE: siklus probing, TANPA TX dan TANPA sleep"));
#endif

  power_begin();

  calibration_defaults(g_cal);
  if (calibration_begin(g_cal)) {
    Serial.println(F("[CAL] NVS terbaca"));
  } else {
    calibration_defaults(g_cal);
    Serial.println(F("[CAL] NVS kosong. Memakai default compile-time (BELUM TERKALIBRASI)."));
  }
  calibration_print(g_cal);

#if defined(CAL_NVS_SELFTEST)
  calibrationSelftest(g_cal);
#endif

  sensors_begin();

#if defined(SENSOR_PROBE)
  // Blok sementara untuk verifikasi HW-2.1/2.2 di Wokwi. Wajib dihapus saat
  // HW-4.3 (orkestrasi penuh) masuk; #if menjaga build fisik tetap bersih.
  Serial.println(F("[SIM] probe siap, siklus tiap 5 detik"));
#else
  Serial.println(F("[STUB] siklus sampling -> encode -> TX -> sleep belum ada"));
  Serial.println(F("[STUB] urutan final: HW-2.x sensor, HW-3.x payload/TX, HW-4.3 orkestrasi"));
#endif
}

void loop() {
#if defined(SENSOR_PROBE)
  TelemetryFrame f{};
  strncpy(f.node_id, NODE_ID, sizeof(f.node_id) - 1);

  power_sensorOn();
  delay(SENSOR_WARMUP_MS);
  sensors_sampleAll(f, g_cal);
  power_sensorOff();

  Serial.printf("[PROBE] m=%.1f%%(%s) ph=%.2f(%s) t=%.2fC(%s) b=%.2fV(%s)\n",
                f.moisture.value, statusName(f.moisture.status),
                f.ph.value, statusName(f.ph.status),
                f.soil_temp.value, statusName(f.soil_temp.status),
                f.battery.value, statusName(f.battery.status));

  delay(5000);
#else
  Serial.printf("[LOOP] heartbeat %lu ms\n", (unsigned long)millis());
  delay(5000);
#endif
}
