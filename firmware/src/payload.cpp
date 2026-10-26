#include <stdio.h>

#include "payload.h"

#if !defined(NATIVE_BUILD)
#include <Arduino.h>
#endif

size_t payload_encode(const TelemetryFrame& f, char* buf, size_t cap) {
  // INTERFACES.md 1.2: key urut n, ts, m, t, ph, b, tanpa spasi.
  // snprintf, bukan ArduinoJson, agar jumlah desimal dan panjang pasti
  // dan nol alokasi dinamis (DEC-IOT-14).
  int n = snprintf(buf, cap,
                   "{\"n\":\"%s\",\"ts\":%lu,\"m\":%.1f,\"t\":%.1f,\"ph\":%.2f,\"b\":%.2f}",
                   f.node_id,
                   (unsigned long)f.timestamp,
                   (double)f.moisture.value,
                   (double)f.soil_temp.value,
                   (double)f.ph.value,
                   (double)f.battery.value);

  if (n <= 0 || (size_t)n >= cap) return 0;   // gagal atau terpotong
  return (size_t)n;
}

#if !defined(NATIVE_BUILD)
void payload_hexdump(const char* buf, size_t len) {
  for (size_t i = 0; i < len; i++) {
    Serial.printf("%02X ", (uint8_t)buf[i]);
  }
  Serial.println();
}
#endif
