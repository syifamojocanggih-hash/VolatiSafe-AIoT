#include <Arduino.h>
#include <DallasTemperature.h>
#include <OneWire.h>

#include "config.h"
#include "sensors.h"

static OneWire           s_wire(PIN_DS18B20);
static DallasTemperature s_ds(&s_wire);

void sensors_begin() {
  analogSetAttenuation(ADC_ATTENUATION);
  analogReadResolution(12);

#if DS18B20_USE_INTERNAL_PULLUP
  // Tanpa resistor 4.7k eksternal, satu-satunya pull-up ada di dalam ESP32.
  // Harus aktif sebelum s_ds.begin(), kalau tidak bus 1-Wire terbaca kosong.
  pinMode(PIN_DS18B20, INPUT_PULLUP);
#else
  pinMode(PIN_DS18B20, INPUT);
#endif

  // 11-bit cukup (+-0,125 C) dan menghemat 375 ms dibanding 12-bit. Siklus
  // ini satu tembakan lalu tidur, jadi blocking lebih sederhana daripada
  // state machine non-blocking.
  s_ds.begin();
  s_ds.setResolution(DS18B20_RESOLUTION);
  s_ds.setWaitForConversion(true);

  Serial.printf("[SENS] ADC1 12-bit 11dB, 1-Wire GPIO%d, DS18B20 %u device\n",
                PIN_DS18B20, (unsigned)s_ds.getDeviceCount());
}

void sensors_readAdcBurst(uint8_t pin, AdcBurst& out) {
  uint16_t s[SAMPLE_COUNT];
  for (uint8_t i = 0; i < SAMPLE_COUNT; i++) {
    s[i] = (uint16_t)analogRead(pin);
    if (i + 1 < SAMPLE_COUNT) delay(SAMPLE_INTERVAL_MS);
  }

  uint16_t mn = s[0], mx = s[0];
  for (uint8_t i = 1; i < SAMPLE_COUNT; i++) {
    if (s[i] < mn) mn = s[i];
    if (s[i] > mx) mx = s[i];
  }

  out.median = (uint16_t)sensors_medianAverage(s, SAMPLE_COUNT);
  out.min    = mn;
  out.max    = mx;
}

uint16_t sensors_readAdcMedian(uint8_t pin) {
  AdcBurst b;
  sensors_readAdcBurst(pin, b);
  return b.median;
}

// Divider baterai adalah tegangan DC stabil; 3 sampel tanpa jeda sudah cukup
// dan tidak perlu ikut menunggu 250 ms seperti sensor tanah.
uint16_t sensors_readAdcBattery() {
#if BATTERY_ONBOARD
  uint32_t sum = 0;
  for (uint8_t i = 0; i < BATTERY_SAMPLE_COUNT; i++) {
    sum += (uint16_t)analogRead(PIN_BATTERY);
  }
  return (uint16_t)(sum / BATTERY_SAMPLE_COUNT);
#else
  // GPIO35 mengambang tanpa divider; jangan dibaca. composeFrame mengisi
  // placeholder dan menandai kanal sebagai belum terpasang.
  return 0;
#endif
}

bool sensors_readSoilTemp(float& t_c) {
  s_ds.requestTemperatures();
  t_c = s_ds.getTempCByIndex(0);
  return t_c > TEMP_DISCONNECTED_C;
}

void sensors_sampleAll(TelemetryFrame& out, const Calibration& cal) {
  AdcBurst moist_burst{};
  AdcBurst ph_burst{};

  sensors_readAdcBurst(PIN_MOISTURE, moist_burst);
#if PH_ONBOARD
  sensors_readAdcBurst(PIN_PH, ph_burst);
#endif
  const uint16_t batt_adc = sensors_readAdcBattery();

  float temp_c = TEMP_DISCONNECTED_C;
  sensors_readSoilTemp(temp_c);

  sensors_composeFrame(moist_burst, ph_burst, batt_adc, temp_c, cal, out);

#if PH_ONBOARD
  Serial.printf("[SENS] adc m=%u[%u..%u] ph=%u[%u..%u] b=%u t=%.2fC\n",
                moist_burst.median, moist_burst.min, moist_burst.max,
                ph_burst.median, ph_burst.min, ph_burst.max,
                batt_adc, temp_c);
#else
  // Pin pH mengambang sengaja tidak dibaca; jangan cetak angka yang tak berarti.
  Serial.printf("[SENS] adc m=%u[%u..%u] ph=N/A b=%u t=%.2fC\n",
                moist_burst.median, moist_burst.min, moist_burst.max,
                batt_adc, temp_c);
#endif
}
