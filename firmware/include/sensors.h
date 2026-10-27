#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>

struct SensorReading {
    float moisture_pct;   // % Volumetric Water Content (0.0 - 100.0)
    float soil_temp_c;    // Derajat Celcius (-10.0 to 60.0)
    float ph;             // pH tanah terkoreksi (3.00 to 10.00)
    float battery_v;      // Tegangan baterai aktual (Volt)
    bool is_valid;        // Status kelayakan pembacaan
};

class SensorManager {
public:
    SensorManager();
    void begin();
    void powerSensors(bool enable);
    SensorReading acquireBurstSamples();

private:
    float readMoistureMedian();
    float readPhMedian(float moisture_pct);
    float readTemperature();
    float readBatteryVoltage();
    int calculateMedian(int samples[], int n);
};

#endif // SENSORS_H
