#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <time.h>

#include "config.h"
#include "transport.h"

#if TRANSPORT_KIND == TRANSPORT_KIND_MQTT

static WiFiClient   net;
static PubSubClient mqtt(net);
static char         topic[64];

// Retry dikerjakan transport_retry(), bukan loop lokal, supaya aturan jeda
// sama persis dengan build LoRa dan bisa diuji di env:native.
static bool publishOnce(const char* payload, size_t len) {
  if (!mqtt.connected() && !mqtt.connect(NODE_ID)) {
    Serial.printf("[TX] connect gagal, state=%d\n", (int)mqtt.state());
    return false;
  }
  // QoS 0: publish() hanya mengembalikan true bila paket masuk ke socket.
  // Tidak ada ACK broker, jadi "ok" berarti "terkirim ke jaringan", bukan
  // "diterima backend" (DEC-IOT-10).
  return mqtt.publish(topic, (const uint8_t*)payload, (unsigned int)len,
                      /*retained=*/false);
}

static void retryGap() {
  delay(TX_RETRY_DELAY_MS);
}

bool transport_init() {
  snprintf(topic, sizeof(topic), "/volatisafe/v1/node/%s/telemetry", NODE_ID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(NET_WIFI_SSID, NET_WIFI_PASS);
  Serial.printf("[TX] WiFi ke \"%s\"\n", NET_WIFI_SSID);

  const uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < WIFI_CONNECT_TIMEOUT_MS) {
    delay(200);
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.printf("[TX] WiFi timeout %d ms, TX dilewati\n", WIFI_CONNECT_TIMEOUT_MS);
    return false;
  }
  Serial.printf("[TX] WiFi tersambung, IP %s\n", WiFi.localIP().toString().c_str());

  mqtt.setServer(NET_MQTT_HOST, NET_MQTT_PORT);
  // Cetak hasil resolusi: kegagalan DNS dan kegagalan TCP sama-sama muncul
  // sebagai state=-2, jadi tanpa ini penyebabnya tidak bisa dibedakan.
  IPAddress broker_ip;
  if (WiFi.hostByName(NET_MQTT_HOST, broker_ip)) {
    Serial.printf("[TX] broker %s -> %s:%d\n", NET_MQTT_HOST,
                  broker_ip.toString().c_str(), NET_MQTT_PORT);
  } else {
    Serial.printf("[TX] DNS gagal untuk %s\n", NET_MQTT_HOST);
  }
  // Default PubSubClient 256 byte. Payload kita 70-76 byte, tapi header topik
  // + overhead MQTT ikut dihitung, jadi beri ruang eksplisit.
  mqtt.setBufferSize(PAYLOAD_BUF_SIZE + 64);

  const uint32_t t1 = millis();
  while (!mqtt.connected() && millis() - t1 < MQTT_CONNECT_TIMEOUT_MS) {
    if (mqtt.connect(NODE_ID)) break;
    delay(200);
  }
  if (!mqtt.connected()) {
    Serial.printf("[TX] MQTT gagal ke %s:%d, state=%d\n", NET_MQTT_HOST,
                  NET_MQTT_PORT, (int)mqtt.state());
    return false;
  }

  Serial.printf("[TX] MQTT tersambung, topik %s\n", topic);
  return true;
}

// Node lapangan tidak punya internet (DEC-IOT-09). Di Wokwi ada WiFi, jadi jam
// disinkronkan lewat NTP. Tanpa ini f.timestamp tetap 0 dan backend menolak
// setiap paket karena ts < 1700000000.
bool transport_syncClock() {
  configTime(0, 0, "pool.ntp.org", "time.google.com");   // UTC, tanpa DST

  const uint32_t t0 = millis();
  while (time(nullptr) < 1700000000 && millis() - t0 < NTP_SYNC_TIMEOUT_MS) {
    delay(200);
  }

  const time_t now = time(nullptr);
  if (now < 1700000000) {
    Serial.println(F("[TX] NTP gagal: jam belum valid, paket akan ditolak backend"));
    return false;
  }
  Serial.printf("[TX] jam tersinkron: %lu (epoch UTC)\n", (unsigned long)now);
  return true;
}

TxResult transport_send(const char* payload, size_t len) {
  return transport_retry(payload, len, TX_RETRY_MAX, publishOnce, retryGap);
}

void transport_shutdown() {
  mqtt.disconnect();
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
}

bool transport_available() {
  return WiFi.status() == WL_CONNECTED && mqtt.connected();
}

const char* transport_topic() {
  return topic;
}

#endif  // TRANSPORT_KIND == TRANSPORT_KIND_MQTT
