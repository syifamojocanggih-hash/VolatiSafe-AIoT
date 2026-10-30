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

// HW-3.1 DoD: ujung kalibrasi tetap 0 % dan 100 %.
void test_moisture_range_edges(void) {
  TEST_ASSERT_EQUAL_FLOAT(0.0f, sensors_adcToMoisturePct(2800, 2800, 1350));
  TEST_ASSERT_EQUAL_FLOAT(100.0f, sensors_adcToMoisturePct(1350, 2800, 1350));
}

// Nilai di luar kalibrasi dikirim mentah, tidak dipotong ke 0/100. Memotong
// akan mengubah sensor short atau putus jadi data yang lolos gate backend.
void test_moisture_out_of_contract_is_not_clamped(void) {
  // ADC 4000 (di atas dry 2800) -> negatif.
  TEST_ASSERT_FLOAT_WITHIN(0.01f, -82.76f, sensors_adcToMoisturePct(4000, 2800, 1350));
  // ADC 0 (sensor short) -> jauh di atas 100.
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 193.10f, sensors_adcToMoisturePct(0, 2800, 1350));
}

void test_moisture_midpoint(void) {
  TEST_ASSERT_EQUAL_FLOAT(50.0f, sensors_adcToMoisturePct(2075, 2800, 1350));
}

// Dry == wet berarti kalibrasi belum diisi. Sentinel -999 membuat backend
// menolak paket; 0 % akan diterima sebagai tanah kering sungguhan.
void test_moisture_rejects_invalid_calibration(void) {
  TEST_ASSERT_EQUAL_FLOAT(-999.0f, sensors_adcToMoisturePct(2000, 2000, 2000));
}

// HW-2.4 DoD: moisture 50 -> koreksi 0, moisture 0 -> +0.15, moisture 100 -> -0.15.
void test_ph_humidity_compensation(void) {
  TEST_ASSERT_EQUAL_FLOAT(7.00f, sensors_adcToPh(1500, 1500.0f, 300.0f, 50.0f));
  TEST_ASSERT_EQUAL_FLOAT(7.15f, sensors_adcToPh(1500, 1500.0f, 300.0f, 0.0f));
  TEST_ASSERT_EQUAL_FLOAT(6.85f, sensors_adcToPh(1500, 1500.0f, 300.0f, 100.0f));
}

void test_ph_out_of_contract_is_not_clamped(void) {
  // ADC 0 -> pH 12,00 (di atas PH_MAX 10,0).
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 12.00f, sensors_adcToPh(0, 1500.0f, 300.0f, 50.0f));
  // ADC 4095 -> pH -1,65 (di bawah PH_MIN 3,0).
  TEST_ASSERT_FLOAT_WITHIN(0.01f, -1.65f, sensors_adcToPh(4095, 1500.0f, 300.0f, 50.0f));
}

void test_ph_invalid_slope_returns_sentinel(void) {
  TEST_ASSERT_EQUAL_FLOAT(-999.0f, sensors_adcToPh(1500, 1500.0f, 0.0f, 50.0f));
}

// Moisture sentinel (-999) tidak boleh ikut menggeser pH 3,1 satuan; yang
// dibatasi hanya masukannya, supaya pH sendiri tetap bisa dinilai terpisah.
void test_ph_compensation_clamps_input_not_output(void) {
  TEST_ASSERT_FLOAT_WITHIN(0.01f, 7.15f, sensors_adcToPh(1500, 1500.0f, 300.0f, -999.0f));
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

// HW-3.1 DoD: sensor short (ADC 0) dan sensor putus (ADC 4095) harus jadi
// OUT_OF_RANGE, bukan 100 % atau 0 % yang lolos gate backend.
void test_compose_frame_flags_short_and_disconnected_moisture(void) {
  Calibration cal{};
  calibration_defaults(cal);

  AdcBurst ph{1271, 1271, 1271};
  TelemetryFrame shorted{}, cut{};

  AdcBurst moist_short{0, 0, 0};
  sensors_composeFrame(moist_short, ph, 2401, 34.5f, cal, shorted);
  TEST_ASSERT_EQUAL(SENSOR_OUT_OF_RANGE, shorted.moisture.status);
  TEST_ASSERT_TRUE(shorted.moisture.value > 100.0f);
  TEST_ASSERT_EQUAL(SENSOR_OK, shorted.ph.status);

  AdcBurst moist_cut{4095, 4095, 4095};
  sensors_composeFrame(moist_cut, ph, 2401, 34.5f, cal, cut);
  TEST_ASSERT_EQUAL(SENSOR_OUT_OF_RANGE, cut.moisture.status);
  TEST_ASSERT_TRUE(cut.moisture.value < 0.0f);
  TEST_ASSERT_EQUAL(SENSOR_OK, cut.ph.status);
}

// Kalibrasi moisture rusak hanya menjatuhkan kanal moisture.
void test_compose_frame_invalid_moisture_calibration(void) {
  Calibration cal{};
  calibration_defaults(cal);
  cal.moist_dry = 2000;
  cal.moist_wet = 2000;

  AdcBurst moist{2000, 2000, 2000};
  AdcBurst ph{1271, 1271, 1271};
  TelemetryFrame f{};

  sensors_composeFrame(moist, ph, 2401, 34.5f, cal, f);

  TEST_ASSERT_EQUAL_FLOAT(-999.0f, f.moisture.value);
  TEST_ASSERT_EQUAL(SENSOR_OUT_OF_RANGE, f.moisture.status);
  TEST_ASSERT_EQUAL(SENSOR_OK, f.ph.status);
}

// Slope pH nol hanya menjatuhkan kanal pH.
void test_compose_frame_invalid_ph_slope(void) {
  Calibration cal{};
  calibration_defaults(cal);
  cal.ph_slope = 0.0f;

  AdcBurst moist{2496, 2496, 2496};
  AdcBurst ph{1271, 1271, 1271};
  TelemetryFrame f{};

  sensors_composeFrame(moist, ph, 2401, 34.5f, cal, f);

  TEST_ASSERT_EQUAL_FLOAT(-999.0f, f.ph.value);
  TEST_ASSERT_EQUAL(SENSOR_OUT_OF_RANGE, f.ph.status);
  TEST_ASSERT_EQUAL(SENSOR_OK, f.moisture.status);
}

// Divider putus -> 0 V, divider short -> 6,6 V. Keduanya bukan baterai.
void test_compose_frame_flags_battery_out_of_range(void) {
  Calibration cal{};
  calibration_defaults(cal);

  AdcBurst moist{2496, 2496, 2496};
  AdcBurst ph{1271, 1271, 1271};
  TelemetryFrame flat{}, hot{};

  sensors_composeFrame(moist, ph, 0, 34.5f, cal, flat);
  TEST_ASSERT_EQUAL(SENSOR_OUT_OF_RANGE, flat.battery.status);

  sensors_composeFrame(moist, ph, 4095, 34.5f, cal, hot);
  TEST_ASSERT_EQUAL(SENSOR_OUT_OF_RANGE, hot.battery.status);
}

// OUT_OF_RANGE menang atas UNSTABLE: nilai di luar batas sudah pasti rusak,
// menyebutnya "cuma goyang" menutupi penyebabnya.
void test_compose_frame_out_of_range_beats_unstable(void) {
  Calibration cal{};
  calibration_defaults(cal);

  AdcBurst moist{0, 0, 4095};   // median 0 -> short, range 4095 -> goyang
  AdcBurst ph{1271, 1271, 1271};
  TelemetryFrame f{};

  sensors_composeFrame(moist, ph, 2401, 34.5f, cal, f);

  TEST_ASSERT_EQUAL(SENSOR_OUT_OF_RANGE, f.moisture.status);
}

int main(int, char**) {
  UNITY_BEGIN();
  RUN_TEST(test_median_discards_single_spike);
  RUN_TEST(test_median_discards_two_outliers);
  RUN_TEST(test_median_handles_degenerate_counts);
  RUN_TEST(test_moisture_range_edges);
  RUN_TEST(test_moisture_out_of_contract_is_not_clamped);
  RUN_TEST(test_moisture_midpoint);
  RUN_TEST(test_moisture_rejects_invalid_calibration);
  RUN_TEST(test_ph_humidity_compensation);
  RUN_TEST(test_ph_out_of_contract_is_not_clamped);
  RUN_TEST(test_ph_invalid_slope_returns_sentinel);
  RUN_TEST(test_ph_compensation_clamps_input_not_output);
  RUN_TEST(test_battery_conversion);
  RUN_TEST(test_unstable_threshold);
  RUN_TEST(test_temp_disconnected_becomes_sentinel);
  RUN_TEST(test_temp_in_range_is_ok);
  RUN_TEST(test_temp_out_of_range_keeps_raw_value);
  RUN_TEST(test_compose_frame_scenario_a);
  RUN_TEST(test_compose_frame_scenario_b);
  RUN_TEST(test_compose_frame_flags_only_unstable_channel);
  RUN_TEST(test_compose_frame_flags_short_and_disconnected_moisture);
  RUN_TEST(test_compose_frame_invalid_moisture_calibration);
  RUN_TEST(test_compose_frame_invalid_ph_slope);
  RUN_TEST(test_compose_frame_flags_battery_out_of_range);
  RUN_TEST(test_compose_frame_out_of_range_beats_unstable);
  return UNITY_END();
}
