#include <Arduino.h>

#include "payload.h"

size_t payload_encode(const TelemetryFrame& f, char* buf, size_t cap) {
  // TODO HW-3.2: snprintf key n, ts, m, t, ph, b tanpa spasi (DEC-IOT-14).
  (void)f;
  (void)buf;
  (void)cap;
  return 0;
}

void payload_hexdump(const char* buf, size_t len) {
  // TODO HW-3.2
  (void)buf;
  (void)len;
}
