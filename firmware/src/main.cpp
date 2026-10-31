#include <Arduino.h>
#include <time.h>

#include "calibration.h"
#include "config.h"
#include "payload.h"
#include "power_mgmt.h"
#include "sensors.h"
#include "storage.h"
#include "transport.h"
#include "types.h"

static Calibration g_cal;

// transport_send sudah melakukan retry sendiri; adaptor ini hanya menyesuaikan
// tanda tangan agar storage tidak perlu tahu soal TxResult.
static bool sendBuffered(const char* payload, size_t len) {
  return transport_send(payload, len).ok;
}

static const char* statusName(SensorStatus s) {
  switch (s) {
    case SENSOR_OK:           return "OK";
    case SENSOR_DISCONNECTED: return "DISC";
    case SENSOR_OUT_OF_RANGE: return "RANGE";
    case SENSOR_UNSTABLE:     return "UNSTABLE";
    case SENSOR_NOT_PRESENT:  return "N/A";
  }
  return "?";
}

// Satu siklus bangun: sampling -> kirim -> tidur. Tidak ada logika sensor,
// kalibrasi, atau radio di sini; semuanya lewat modul masing-masing.
static void runCycle(const Calibration& cal) {
  const uint32_t t_cycle = millis();

  TelemetryFrame f{};
  strncpy(f.node_id, NODE_ID, sizeof(f.node_id) - 1);

  const uint32_t t_sample = millis();
  power_sensorOn();
  sensors_sampleAll(f, cal);
  power_sensorOff();
  const uint32_t sample_ms = millis() - t_sample;

  Serial.printf("[SENS] m=%.1f%%(%s) ph=%.2f(%s) t=%.2fC(%s) b=%.2fV(%s)\n",
                f.moisture.value, statusName(f.moisture.status),
                f.ph.value, statusName(f.ph.status),
                f.soil_temp.value, statusName(f.soil_temp.status),
                f.battery.value, statusName(f.battery.status));

  const bool tx_ready = transport_init();
#if TRANSPORT_KIND == TRANSPORT_KIND_MQTT
  // Jam harus valid sebelum encode: ts 0 ditolak backend (DEC-IOT-09).
  transport_syncClock();
#endif
  f.timestamp = (uint32_t)time(nullptr);
  if (f.timestamp < 1700000000UL) {
    Serial.println(F("[TX] peringatan: ts belum valid, paket akan ditolak backend"));
  }

  // Kirim antrian lama lebih dulu supaya urutan waktu di backend tidak tertukar.
  // Kalau transport tidak siap, flush hanya akan menghabiskan retry tanpa hasil.
  if (tx_ready) {
    const uint16_t flushed = storage_bufferFlush(sendBuffered);
    if (flushed > 0) {
      Serial.printf("[SD] flushed %u, sisa %u\n", (unsigned)flushed,
                    (unsigned)storage_bufferCount());
    }
  }

  char buf[PAYLOAD_BUF_SIZE];
  const size_t len = payload_encode(f, buf, sizeof(buf));
  if (len == 0) {
    Serial.println(F("[TX] encode gagal, tidak ada yang dikirim"));
  } else {
    Serial.printf("[TX] payload %u byte: %s\n", (unsigned)len, buf);
    if (!tx_ready) {
      Serial.println(F("[TX] init gagal, retry tetap dicoba"));
    }
    const TxResult r = transport_send(buf, len);
    Serial.printf("[TX] %s ok=%d attempts=%d\n", r.ok ? "KIRIM" : "GAGAL",
                  (int)r.ok, (int)r.attempts);
    if (!r.ok && storage_bufferAppend(buf, len)) {
      Serial.printf("[SD] buffered, antrian %u\n", (unsigned)storage_bufferCount());
    }
  }

  transport_shutdown();

  Serial.printf("[PWR] sampling %lu ms, siklus aktif %lu ms\n",
                (unsigned long)sample_ms, (unsigned long)(millis() - t_cycle));
  power_enterDeepSleep();
}

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

  calibration_defaults(g_cal);
  if (calibration_begin(g_cal)) {
    Serial.println(F("[CAL] NVS terbaca"));
  } else {
    calibration_defaults(g_cal);
    Serial.println(F("[CAL] NVS kosong. Memakai default compile-time (BELUM TERKALIBRASI)."));
  }
  calibration_print(g_cal);

  sensors_begin();
  storage_begin();
  runCycle(g_cal);
}

void loop() {
#if defined(SIM_FAST_CYCLE)
  // power_enterDeepSleep() pada build simulasi hanya menandai waktu tidur.
  // Loop tetap berjalan supaya task watchdog di-feed, lalu restart setelah
  // durasi tidur tercapai (lihat DEC-IOT-20).
  delay(100);
  if (power_simSleepDue()) {
    ESP.restart();
  }
#endif
  // Build fisik tidak pernah sampai di sini: runCycle() berakhir di deep sleep.
}
