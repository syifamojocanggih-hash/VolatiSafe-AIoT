#include <Arduino.h>
#include <LoRa.h>
#include <SPI.h>

#include "config.h"
#include "transport.h"

#if TRANSPORT_KIND == TRANSPORT_KIND_LORA

static bool g_ready = false;

// Satu percobaan kirim. endPacket() == 1 berarti modul selesai memancarkan,
// BUKAN berarti gateway menerima: LoRa di lapisan ini satu arah tanpa ACK
// (DEC-IOT-08). Retry hanya menyelamatkan kegagalan lokal modul.
static bool loraSendOnce(const char* payload, size_t len) {
  LoRa.beginPacket();
  LoRa.write((const uint8_t*)payload, len);
  return LoRa.endPacket(/*async=*/false) == 1;
}

static void loraGap() {
  delay(TX_RETRY_DELAY_MS);
}

bool transport_init() {
  SPI.begin(PIN_LORA_SCK, PIN_LORA_MISO, PIN_LORA_MOSI);
  LoRa.setPins(PIN_LORA_CS, PIN_LORA_RST, PIN_LORA_DIO0);

  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println(F("[TX] SX1278 tidak menjawab, cek wiring dan 3V3"));
    g_ready = false;
    return false;
  }

  LoRa.setSpreadingFactor(LORA_SF);
  LoRa.setSignalBandwidth(LORA_BANDWIDTH);
  LoRa.setCodingRate4(LORA_CODING_RATE);
  LoRa.setSyncWord(LORA_SYNC_WORD);
  LoRa.setTxPower(LORA_TX_POWER);

  g_ready = true;
  Serial.printf("[TX] SX1278 siap: %.0f MHz SF%d BW%.0f kHz +%d dBm\n",
                LORA_FREQUENCY / 1e6, LORA_SF, LORA_BANDWIDTH / 1e3,
                LORA_TX_POWER);
  return true;
}

TxResult transport_send(const char* payload, size_t len) {
  // Modul tidak siap bukan alasan mencoba tiga kali: tidak ada satu pun
  // percobaan yang bisa berhasil, dan tiga kali gagal memperpanjang bangun.
  if (!g_ready) return TxResult{false, 0, 0};
  return transport_retry(payload, len, TX_RETRY_MAX, loraSendOnce, loraGap);
}

void transport_shutdown() {
  // sleep() memindahkan SX1278 ke mode sleep, bukan mematikannya: arus turun
  // ke ~0,2 uA tanpa perlu memutus 3V3.
  if (g_ready) LoRa.sleep();
  g_ready = false;
  SPI.end();
}

bool transport_available() {
  return g_ready;
}

#endif  // TRANSPORT_KIND == TRANSPORT_KIND_LORA
