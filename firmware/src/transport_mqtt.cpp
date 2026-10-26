#include <Arduino.h>

#include "config.h"
#include "transport.h"

#if TRANSPORT_KIND == TRANSPORT_KIND_MQTT

bool transport_init() {
  // TODO HW-3.4: WiFi SIM_WIFI_SSID, lalu PubSubClient ke SIM_MQTT_HOST.
  Serial.println(F("[STUB] transport_init MQTT belum ada (HW-3.4)"));
  return false;
}

TxResult transport_send(const char* payload, size_t len) {
  // TODO HW-3.4: publish ke /volatisafe/v1/node/{NODE_ID}/telemetry, QoS 0.
  (void)payload;
  (void)len;
  return TxResult{false, 0, 0};
}

void transport_shutdown() {}

bool transport_available() {
  return false;
}

const char* transport_topic() {
  // TODO HW-3.4: bentuk topik final; buffer statis, tanpa String.
  return "";
}

#endif  // TRANSPORT_KIND == TRANSPORT_KIND_MQTT
