#include <unity.h>

#include "calibration.h"
#include "sensors.h"

void setUp(void) {}
void tearDown(void) {}

// HW-2.1 DoD: spike tunggal harus terbuang, bukan menarik rata-rata.
void test_median_discards_single_spike(void) {
  const uint16_t s[5] = {1000, 1000, 1000, 1000, 4095};
  TEST_ASSERT_EQUAL_FLOAT(1000.0f, sensors_medianAverage(s, 5));
}

// Dua outlier sekaligus terbuang, ini yang membedakannya dari median sejati.
void test_median_discards_two_outliers(void) {
  const uint16_t s[5] = {100, 3000, 1000, 1100, 1200};
  TEST_ASSERT_EQUAL_FLOAT(1100.0f, sensors_medianAverage(s, 5));
}

void test_median_handles_degenerate_counts(void) {
  const uint16_t one[1] = {700};
  const uint16_t two[2] = {600, 800};
  TEST_ASSERT_EQUAL_FLOAT(0.0f, sensors_medianAverage(nullptr, 0));
  TEST_ASSERT_EQUAL_FLOAT(700.0f, sensors_medianAverage(one, 1));
  TEST_ASSERT_EQUAL_FLOAT(700.0f, sensors_medianAverage(two, 2));
}

// HW-2.3 DoD: ADC >= dry -> 0%, ADC <= wet -> 100%, tidak pernah NaN/negatif.
void test_moisture_range_edges(void) {
  TEST_ASSERT_EQUAL_FLOAT(0.0f, sensors_adcToMoisturePct(2800, 2800, 1350));
  TEST_ASSERT_EQUAL_FLOAT(0.0f, sensors_adcToMoisturePct(4000, 2800, 1350));
  TEST_ASSERT_EQUAL_FLOAT(100.0f, sensors_adcToMoisturePct(1350, 2800, 1350));
  TEST_ASSERT_EQUAL_FLOAT(100.0f, sensors_adcToMoisturePct(0, 2800, 1350));
}

void test_moisture_midpoint(void) {
  TEST_ASSERT_EQUAL_FLOAT(50.0f, sensors_adcToMoisturePct(2075, 2800, 1350));
}

// Dry == wet berarti kalibrasi belum diisi; jangan hasilkan inf/NaN.
void test_moisture_rejects_invalid_calibration(void) {
  TEST_ASSERT_EQUAL_FLOAT(0.0f, sensors_adcToMoisturePct(2000, 2000, 2000));
}

// HW-2.4 DoD: moisture 50 -> koreksi 0, moisture 0 -> +0.15, moisture 100 -> -0.15.
void test_ph_humidity_compensation(void) {
  TEST_ASSERT_EQUAL_FLOAT(7.00f, sensors_adcToPh(1500, 1500.0f, 300.0f, 50.0f));
  TEST_ASSERT_EQUAL_FLOAT(7.15f, sensors_adcToPh(1500, 1500.0f, 300.0f, 0.0f));
  TEST_ASSERT_EQUAL_FLOAT(6.85f, sensors_adcToPh(1500, 1500.0f, 300.0f, 100.0f));
}

void test_ph_clamped_to_contract_range(void) {
  TEST_ASSERT_EQUAL_FLOAT(10.0f, sensors_adcToPh(0, 1500.0f, 300.0f, 50.0f));
  TEST_ASSERT_EQUAL_FLOAT(3.0f, sensors_adcToPh(4095, 1500.0f, 300.0f, 50.0f));
}

void test_ph_invalid_slope_returns_sentinel(void) {
  TEST_ASSERT_EQUAL_FLOAT(0.0f, sensors_adcToPh(1500, 1500.0f, 0.0f, 50.0f));
}

// HW-2.5 DoD: ADC 2402 -> sekitar 3.87 V.
void test_battery_conversion(void) {
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 3.87f, sensors_adcToBatteryV(2402));
}

// HW-2.1 DoD: ambang 800 inklusif di sisi aman, 801 baru dianggap goyang.
void test_unstable_threshold(void) {
  TEST_ASSERT_FALSE(sensors_isUnstable(1000, 1000));
  TEST_ASSERT_FALSE(sensors_isUnstable(400, 1200));   // range tepat 800
  TEST_ASSERT_TRUE(sensors_isUnstable(400, 1201));    // range 801
}

// HW-2.2 DoD: DS18B20 putus tidak boleh jadi angka wajar.
void test_temp_disconnected_becomes_sentinel(void) {
  SensorReading r{};
  sensors_classifyTemp(-127.0f, r);
  TEST_ASSERT_EQUAL_FLOAT(-999.0f, r.value);
  TEST_ASSERT_EQUAL(SENSOR_DISCONNECTED, r.status);
}

void test_temp_in_range_is_ok(void) {
  SensorReading r{};
  sensors_classifyTemp(25.0f, r);
  TEST_ASSERT_EQUAL_FLOAT(25.0f, r.value);
  TEST_ASSERT_EQUAL(SENSOR_OK, r.status);
}

// Nilai di luar rentang dikirim apa adanya, bukan di-clamp: menyamarkannya
// jadi angka wajar justru membuat data palsu lolos ke backend.
void test_temp_out_of_range_keeps_raw_value(void) {
  SensorReading hot{}, cold{};
  sensors_classifyTemp(65.0f, hot);
  TEST_ASSERT_EQUAL_FLOAT(65.0f, hot.value);
  TEST_ASSERT_EQUAL(SENSOR_OUT_OF_RANGE, hot.status);

  sensors_classifyTemp(-15.0f, cold);
  TEST_ASSERT_EQUAL_FLOAT(-15.0f, cold.value);
  TEST_ASSERT_EQUAL(SENSOR_OUT_OF_RANGE, cold.status);
}

// Fixture dari 05_WOKWI_SIMULASI.md 5.5: Skenario A (Terik Ekstrem).
// Kalau test ini lulus, angka demo sudah pasti benar sebelum Wokwi dibuka.
void test_compose_frame_scenario_a(void) {
  Calibration cal{};
  calibration_defaults(cal);

  AdcBurst moist{2496, 2496, 2496};
  AdcBurst ph{1271, 1271, 1271};
  TelemetryFrame f{};

  sensors_composeFrame(moist, ph, 2401, 34.5f, cal, f);

  TEST_ASSERT_FLOAT_WITHIN(0.1f, 21.0f, f.moisture.value);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 7.85f, f.ph.value);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 3.87f, f.battery.value);
  TEST_ASSERT_EQUAL_FLOAT(34.5f, f.soil_temp.value);
  TEST_ASSERT_EQUAL(SENSOR_OK, f.moisture.status);
  TEST_ASSERT_EQUAL(SENSOR_OK, f.ph.status);
  TEST_ASSERT_EQUAL(SENSOR_OK, f.soil_temp.status);
  TEST_ASSERT_EQUAL(SENSOR_OK, f.battery.status);
}

// Fixture dari 05_WOKWI_SIMULASI.md 5.6: Skenario B (Hujan Sore).
void test_compose_frame_scenario_b(void) {
  Calibration cal{};
  calibration_defaults(cal);

  AdcBurst moist{2191, 2191, 2191};
  AdcBurst ph{1567, 1567, 1567};
  TelemetryFrame f{};

  sensors_composeFrame(moist, ph, 2420, 26.0f, cal, f);

  TEST_ASSERT_FLOAT_WITHIN(0.1f, 42.0f, f.moisture.value);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 6.80f, f.ph.value);
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 3.90f, f.battery.value);
  TEST_ASSERT_EQUAL_FLOAT(26.0f, f.soil_temp.value);
}

// Satu kanal goyang tidak boleh menjatuhkan tiga kanal lain.
void test_compose_frame_flags_only_unstable_channel(void) {
  Calibration cal{};
  calibration_defaults(cal);

  AdcBurst moist{2496, 1500, 2400};   // range 900 > 800
  AdcBurst ph{1271, 1271, 1271};
  TelemetryFrame f{};

  sensors_composeFrame(moist, ph, 2401, 34.5f, cal, f);

  TEST_ASSERT_EQUAL(SENSOR_UNSTABLE, f.moisture.status);
  TEST_ASSERT_EQUAL(SENSOR_OK, f.ph.status);
  TEST_ASSERT_EQUAL(SENSOR_OK, f.soil_temp.status);
}

int main(int, char**) {
  UNITY_BEGIN();
  RUN_TEST(test_median_discards_single_spike);
  RUN_TEST(test_median_discards_two_outliers);
  RUN_TEST(test_median_handles_degenerate_counts);
  RUN_TEST(test_moisture_range_edges);
  RUN_TEST(test_moisture_midpoint);
  RUN_TEST(test_moisture_rejects_invalid_calibration);
  RUN_TEST(test_ph_humidity_compensation);
  RUN_TEST(test_ph_clamped_to_contract_range);
  RUN_TEST(test_ph_invalid_slope_returns_sentinel);
  RUN_TEST(test_battery_conversion);
  RUN_TEST(test_unstable_threshold);
  RUN_TEST(test_temp_disconnected_becomes_sentinel);
  RUN_TEST(test_temp_in_range_is_ok);
  RUN_TEST(test_temp_out_of_range_keeps_raw_value);
  RUN_TEST(test_compose_frame_scenario_a);
  RUN_TEST(test_compose_frame_scenario_b);
  RUN_TEST(test_compose_frame_flags_only_unstable_channel);
  return UNITY_END();
}
