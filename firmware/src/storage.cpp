#include <Arduino.h>
#include <SD.h>
#include <SPI.h>

#include "config.h"
#include "storage.h"

static const char* TMP_PATH = "/vs_buffer.tmp";

static bool     s_mounted = false;
static uint16_t s_count   = 0;

static uint16_t countLines(File& f) {
  uint16_t n = 0;
  while (f.available()) {
    if (f.read() == '\n') n++;
  }
  return n;
}

bool storage_begin() {
  SPI.begin(PIN_SD_SCK, PIN_SD_MISO, PIN_SD_MOSI);
  s_mounted = SD.begin(PIN_SD_CS, SPI);

  if (!s_mounted) {
    Serial.println(F("[SD] tidak ada kartu, store-and-forward nonaktif"));
    s_count = 0;
    return false;
  }

  s_count = storage_bufferCount();
  Serial.printf("[SD] terpasang, %u payload tertunda\n", (unsigned)s_count);
  return true;
}

bool storage_available() {
  return s_mounted;
}

uint16_t storage_bufferCount() {
  if (!s_mounted) return 0;
  File f = SD.open(SD_BUFFER_PATH, FILE_READ);
  if (!f) return 0;
  s_count = countLines(f);
  f.close();
  return s_count;
}

bool storage_bufferAppend(const char* payload, size_t len) {
  if (!s_mounted || len == 0) return false;

  if (s_count >= SD_BUFFER_MAX_LINES) {
    Serial.printf("[SD] antrian penuh (%u), payload dibuang\n", (unsigned)s_count);
    return false;
  }

  File f = SD.open(SD_BUFFER_PATH, FILE_APPEND);
  if (!f) {
    Serial.println(F("[SD] gagal membuka antrian untuk tulis"));
    return false;
  }

  const size_t written = f.write((const uint8_t*)payload, len);
  f.write((uint8_t)'\n');
  f.close();

  if (written != len) {
    Serial.println(F("[SD] tulis terpotong"));
    return false;
  }

  s_count++;
  return true;
}

uint16_t storage_bufferFlush(StorageSendFn attempt) {
  if (!s_mounted || attempt == nullptr) return 0;

  File src = SD.open(SD_BUFFER_PATH, FILE_READ);
  if (!src) return 0;
  if (src.size() == 0) {
    src.close();
    return 0;
  }

  SD.remove(TMP_PATH);
  File dst = SD.open(TMP_PATH, FILE_WRITE);
  if (!dst) {
    src.close();
    Serial.println(F("[SD] gagal membuka file sementara"));
    return 0;
  }

  uint16_t sent = 0;
  bool    keep_rest = false;
  char    line[PAYLOAD_BUF_SIZE];
  size_t  n = 0;

  while (src.available()) {
    const int c = src.read();
    if (c != '\n' && c != -1) {
      if (n + 1 < sizeof(line)) line[n++] = (char)c;
      continue;
    }

    line[n] = '\0';
    const size_t line_len = n;
    n = 0;

    if (line_len == 0) continue;

    if (!keep_rest) {
      if (attempt(line, line_len)) {
        sent++;
        continue;
      }
      keep_rest = true;
    }

    dst.write((const uint8_t*)line, line_len);
    dst.write((uint8_t)'\n');
  }

  // Baris terakhir tanpa newline tetap harus diselamatkan.
  if (n > 0) {
    line[n] = '\0';
    if (keep_rest || !attempt(line, n)) {
      dst.write((const uint8_t*)line, n);
      dst.write((uint8_t)'\n');
    } else {
      sent++;
    }
  }

  src.close();
  dst.close();

  SD.remove(SD_BUFFER_PATH);
  if (!SD.rename(TMP_PATH, SD_BUFFER_PATH)) {
    Serial.println(F("[SD] gagal menamai ulang antrian"));
  }

  s_count = storage_bufferCount();
  return sent;
}
