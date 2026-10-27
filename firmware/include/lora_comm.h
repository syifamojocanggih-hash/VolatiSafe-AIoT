#ifndef LORA_COMM_H
#define LORA_COMM_H

#include <Arduino.h>
#include "sensors.h"

class LoRaCommunicator {
public:
    LoRaCommunicator();
    bool begin();
    bool transmitTelemetry(const SensorReading& reading, uint32_t epoch_ts);
    void sleep();
    String buildJsonPayload(const SensorReading& reading, uint32_t epoch_ts);

private:
    bool initialized;
};

#endif // LORA_COMM_H
