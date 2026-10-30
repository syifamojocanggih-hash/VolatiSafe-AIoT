#pragma once
#include <stddef.h>
#include <stdint.h>

#include "config.h"
#include "types.h"

bool     transport_init();
TxResult transport_send(const char* payload, size_t len);
void     transport_shutdown();
bool     transport_available();

// Satu percobaan kirim. true berarti transport menganggap paket terkirim.
typedef bool (*TxAttemptFn)(const char* payload, size_t len);
// Jeda antar percobaan. Di transport nyata isinya delay(); di test tidak
// melakukan apa pun supaya suite tetap di bawah satu detik.
typedef void (*TxGapFn)();

// Murni, dipakai kedua transport dan diuji di env:native. Lihat
// transport_core.cpp untuk alasan jeda tidak dipanggil setelah percobaan
// terakhir.
TxResult transport_retry(const char* payload, size_t len, uint8_t max_attempts,
                         TxAttemptFn attempt, TxGapFn gap);

#if TRANSPORT_KIND == TRANSPORT_KIND_MQTT
const char* transport_topic();

// Sinkronisasi jam lewat NTP (DEC-IOT-09). false berarti jam masih di bawah
// 2023, dan paket akan ditolak backend karena ts < 1700000000.
bool transport_syncClock();
#endif
