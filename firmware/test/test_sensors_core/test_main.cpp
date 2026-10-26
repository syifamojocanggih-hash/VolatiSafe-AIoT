#include <unity.h>

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
  return UNITY_END();
}
