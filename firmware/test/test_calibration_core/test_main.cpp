#include <unity.h>

#include "calibration.h"

void setUp(void) {}
void tearDown(void) {}

// HW-2.6 DoD: default compile-time harus selalu lolos validasi, kalau tidak
// node baru akan langsung menolak kalibrasinya sendiri.
void test_defaults_are_valid(void) {
  Calibration c{};
  calibration_defaults(c);
  TEST_ASSERT_TRUE(calibration_validate(c));
  TEST_ASSERT_FALSE(c.from_nvs);
}

// Sensor kapasitif: kering = ADC tinggi. Urutan terbalik berarti probe salah
// pasang atau dua titik kalibrasi tertukar.
void test_rejects_inverted_dry_wet(void) {
  Calibration c{};
  calibration_defaults(c);
  c.moist_dry = 1350;
  c.moist_wet = 2800;
  TEST_ASSERT_FALSE(calibration_validate(c));
}

void test_rejects_equal_dry_wet(void) {
  Calibration c{};
  calibration_defaults(c);
  c.moist_wet = c.moist_dry;
  TEST_ASSERT_FALSE(calibration_validate(c));
}

void test_rejects_zero_wet_point(void) {
  Calibration c{};
  calibration_defaults(c);
  c.moist_wet = 0;
  TEST_ASSERT_FALSE(calibration_validate(c));
}

// slope <= 0 menghasilkan pH inf yang ter-clamp jadi 3.00 atau 10.00, yaitu
// angka wajar yang menyamarkan kerusakan.
void test_rejects_non_positive_slope(void) {
  Calibration c{};
  calibration_defaults(c);

  c.ph_slope = 0.0f;
  TEST_ASSERT_FALSE(calibration_validate(c));

  c.ph_slope = -300.0f;
  TEST_ASSERT_FALSE(calibration_validate(c));
}

// NaN lolos setiap perbandingan biasa (NaN > 0 bernilai false), jadi gerbang
// ditulis sebagai !(slope > 0) supaya NaN ikut tertolak.
void test_rejects_nan_slope(void) {
  Calibration c{};
  calibration_defaults(c);
  c.ph_slope = __builtin_nanf("");
  TEST_ASSERT_FALSE(calibration_validate(c));
}

void test_rejects_neutral_adc_outside_adc_range(void) {
  Calibration c{};
  calibration_defaults(c);

  c.ph_neutral_adc = -1.0f;
  TEST_ASSERT_FALSE(calibration_validate(c));

  c.ph_neutral_adc = 4096.0f;
  TEST_ASSERT_FALSE(calibration_validate(c));

  c.ph_neutral_adc = 4095.0f;
  TEST_ASSERT_TRUE(calibration_validate(c));
}

int main(int, char**) {
  UNITY_BEGIN();
  RUN_TEST(test_defaults_are_valid);
  RUN_TEST(test_rejects_inverted_dry_wet);
  RUN_TEST(test_rejects_equal_dry_wet);
  RUN_TEST(test_rejects_zero_wet_point);
  RUN_TEST(test_rejects_non_positive_slope);
  RUN_TEST(test_rejects_nan_slope);
  RUN_TEST(test_rejects_neutral_adc_outside_adc_range);
  return UNITY_END();
}
