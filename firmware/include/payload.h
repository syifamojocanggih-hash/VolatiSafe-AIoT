#pragma once
#include <stddef.h>

#include "types.h"

// Menulis JSON ke buf, mengembalikan panjang byte tanpa NUL.
// 0 berarti gagal atau terpotong.
size_t payload_encode(const TelemetryFrame& f, char* buf, size_t cap);

void payload_hexdump(const char* buf, size_t len);
