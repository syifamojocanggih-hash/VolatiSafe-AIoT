#include <Arduino.h>

#include "config.h"
#include "transport.h"

#if TRANSPORT_KIND == TRANSPORT_KIND_LORA

bool transport_init() {
  // TODO HW-3.3: SPI + SX1278 begin, SF7 BW125 CR4/5, +17 dBm.
  Serial.println(F("[STUB] transport_init LoRa belum ada (HW-3.3)"));
  return false;
}

TxResult transport_send(const char* payload, size_t len) {
  // TODO HW-3.3: beginPacket/write/endPacket, retry TX_RETRY_MAX.
  (void)payload;
  (void)len;
  return TxResult{false, 0, 0};
}

void transport_shutdown() {}

bool transport_available() {
  return false;
}

#endif  // TRANSPORT_KIND == TRANSPORT_KIND_LORA
