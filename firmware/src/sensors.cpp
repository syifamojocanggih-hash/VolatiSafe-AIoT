#include "sensors.h"
#include "config.h"
#include <OneWire.h>
#include <DallasTemperature.h>

static OneWire oneWire(PIN_ONEWIRE_TEMP);
static DallasTemperature tempSensor(&oneWire);

SensorManager::SensorManager() {}

void SensorManager::begin() {
    // 1. Inisialisasi Power Gate MOSFET Pin
    pinMode(PIN_POWER_GATE, OUTPUT);
    digitalWrite(PIN_POWER_GATE, LOW); // Default OFF untuk hemat daya

    // 2. Konfigurasi ADC ESP32 (ADC1: 0 - 3.3V full-scale)
    analogSetAttenuation(ADC_11db);
    pinMode(PIN_MOISTURE_ADC, INPUT);
    pinMode(PIN_PH_ADC, INPUT);
    pinMode(PIN_BATTERY_ADC, INPUT);

    // 3. Inisialisasi bus 1-Wire DS18B20
    tempSensor.begin();
}

void SensorManager::powerSensors(bool enable) {
    if (enable) {
        digitalWrite(PIN_POWER_GATE, HIGH);
        delay(SENSOR_WARMUP_MS); // Stabilisasi tegangan analog sensor
    } else {
        digitalWrite(PIN_POWER_GATE, LOW); // Putus daya: cegah elektrolisis & korosi probe
    }
}

int SensorManager::calculateMedian(int samples[], int n) {
    // Bubble sort sederhana untuk array kecil (5 elemen)
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (samples[j] > samples[j + 1]) {
                int temp = samples[j];
                samples[j] = samples[j + 1];
                samples[j + 1] = temp;
            }
        }
    }
    return samples[n / 2]; // Nilai tengah (median)
}

float SensorManager::readMoistureMedian() {
    int samples[SAMPLE_BURST_COUNT];
    for (int i = 0; i < SAMPLE_BURST_COUNT; i++) {
        samples[i] = analogRead(PIN_MOISTURE_ADC);
        delay(SAMPLE_BURST_INTERVAL_MS);
    }
    int median_adc = calculateMedian(samples, SAMPLE_BURST_COUNT);

    // Konversi ADC ke % VWC:
    // Sensor kapasitif v1.2: Tegangan tinggi = kering, tegangan rendah = basah jenuh
    float moisture = (float)(DEFAULT_DRY_ADC - median_adc) / (float)(DEFAULT_DRY_ADC - DEFAULT_WET_ADC) * 100.0f;
    return constrain(moisture, 0.0f, 100.0f);
}

float SensorManager::readPhMedian(float moisture_pct) {
    int samples[SAMPLE_BURST_COUNT];
    for (int i = 0; i < SAMPLE_BURST_COUNT; i++) {
        samples[i] = analogRead(PIN_PH_ADC);
        delay(SAMPLE_BURST_INTERVAL_MS);
    }
    int median_adc = calculateMedian(samples, SAMPLE_BURST_COUNT);

    // 1. Konversi ADC ke pH dasar
    float ph_raw = 7.0f - ((float)(median_adc - DEFAULT_PH_NEUTRAL_ADC) / (float)DEFAULT_PH_SLOPE);

    // 2. Edge Preprocessing: Kompensasi terhadap kelembaban tanah (FIRMWARE_SPEC.md §2.2)
    // Saat tanah kering (moisture < 50%), impedansi tanah menggeser bacaan probe lebih asam
    float ph_corrected = ph_raw + (0.15f * (50.0f - moisture_pct) / 50.0f);
    return constrain(ph_corrected, 3.00f, 10.00f);
}

float SensorManager::readTemperature() {
    tempSensor.requestTemperatures();
    float t = tempSensor.getTempCByIndex(0);

    // Validasi batas fisik
    if (t == DEVICE_DISCONNECTED_C || t < -20.0f || t > 85.0f) {
        // Fallback nilai aman jika sensor probe bermasalah
        return 28.5f;
    }
    return constrain(t, -10.0f, 60.0f);
}

float SensorManager::readBatteryVoltage() {
    int samples[SAMPLE_BURST_COUNT];
    for (int i = 0; i < SAMPLE_BURST_COUNT; i++) {
        samples[i] = analogRead(PIN_BATTERY_ADC);
        delay(10);
    }
    int median_adc = calculateMedian(samples, SAMPLE_BURST_COUNT);

    // Tegangan pin ADC dikalikan rasio pembagi tegangan 100k/100k (2.0x)
    float pin_voltage = ((float)median_adc / ADC_MAX_VALUE) * ADC_REF_VOLTAGE;
    float battery_voltage = pin_voltage * BATTERY_DIVIDER_RATIO;
    return constrain(battery_voltage, 2.50f, 4.35f);
}

SensorReading SensorManager::acquireBurstSamples() {
    SensorReading reading;

    // 1. Aktifkan catu daya sensor
    powerSensors(true);

    // 2. Akuisisi sampel berurutan
    reading.moisture_pct = readMoistureMedian();
    reading.ph = readPhMedian(reading.moisture_pct);
    reading.soil_temp_c = readTemperature();
    reading.battery_v = readBatteryVoltage();
    reading.is_valid = true;

    // 3. Matikan catu daya sensor segera
    powerSensors(false);

    return reading;
}
