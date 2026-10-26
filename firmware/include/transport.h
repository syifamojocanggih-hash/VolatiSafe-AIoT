#pragma once
#include <stddef.h>
#include <stdint.h>

#include "config.h"
#include "types.h"

bool     transport_init();
TxResult transport_send(const char* payload, size_t len);
void     transport_shutdown();
bool     transport_available();

#if TRANSPORT_KIND == TRANSPORT_KIND_MQTT
const char* transport_topic();
#endif
