#include <unity.h>

#include <string.h>

#include "config.h"
#include "payload.h"

void setUp(void) {}
void tearDown(void) {}

static TelemetryFrame make_frame(const char* node_id, uint32_t ts,
                                float m, float t, float ph, float b) {
  TelemetryFrame f = TelemetryFrame();
  strncpy(f.node_id, node_id, sizeof(f.node_id) - 1);
  f.timestamp        = ts;
  f.moisture.value   = m;
  f.soil_temp.value  = t;
  f.ph.value         = ph;
  f.battery.value    = b;
  return f;
}

// Kontrak INTERFACES.md 1.2: key n, ts, m, t, ph, b; tanpa spasi.
void test_payload_matches_contract_example(void) {
  TelemetryFrame f = make_frame("VS-A1-003", 1792934400UL, 22.4f, 34.1f, 7.83f, 3.87f);
  char buf[PAYLOAD_BUF_SIZE];

  size_t len = payload_encode(f, buf, sizeof(buf));

  TEST_ASSERT_EQUAL_STRING(
      "{\"n\":\"VS-A1-003\",\"ts\":1792934400,\"m\":22.4,\"t\":34.1,\"ph\":7.83,\"b\":3.87}",
      buf);
  TEST_ASSERT_EQUAL_UINT(70, len);
}

// DEC-IOT-02: 76 byte adalah kasus terburuk, bukan 52 seperti klaim dokumen.
void test_payload_worst_case_fits_buffer(void) {
  TelemetryFrame f = make_frame("XXXXXXXXXXXX", 1792934400UL, 100.0f, -10.0f, 10.0f, 4.20f);
  char buf[PAYLOAD_BUF_SIZE];

  size_t len = payload_encode(f, buf, sizeof(buf));

  TEST_ASSERT_GREATER_THAN(0, len);
  TEST_ASSERT_LESS_OR_EQUAL_UINT(76, len);
}

void test_payload_uses_one_decimal_for_moisture_and_temp(void) {
  TelemetryFrame f = make_frame("VS-A1-003", 1792934400UL, 22.46f, 34.14f, 7.8f, 3.8f);
  char buf[PAYLOAD_BUF_SIZE];

  payload_encode(f, buf, sizeof(buf));

  TEST_ASSERT_NOT_NULL(strstr(buf, "\"m\":22.5"));
  TEST_ASSERT_NOT_NULL(strstr(buf, "\"t\":34.1"));
  TEST_ASSERT_NOT_NULL(strstr(buf, "\"ph\":7.80"));
  TEST_ASSERT_NOT_NULL(strstr(buf, "\"b\":3.80"));
}

// Sensor putus mengirim -999.0, bukan nilai palsu; backend yang menolak.
void test_payload_encodes_temp_error_flag(void) {
  TelemetryFrame f = make_frame("VS-A1-003", 1792934400UL, 22.4f, -999.0f, 7.83f, 3.87f);
  char buf[PAYLOAD_BUF_SIZE];

  payload_encode(f, buf, sizeof(buf));

  TEST_ASSERT_NOT_NULL(strstr(buf, "\"t\":-999.0"));
}

void test_payload_bounds_ph_and_battery(void) {
  TelemetryFrame f = make_frame("VS-A1-003", 0UL, 0.0f, 60.0f, 3.0f, 2.80f);
  char buf[PAYLOAD_BUF_SIZE];

  payload_encode(f, buf, sizeof(buf));

  TEST_ASSERT_NOT_NULL(strstr(buf, "\"ph\":3.00"));
  TEST_ASSERT_NOT_NULL(strstr(buf, "\"b\":2.80"));
}

// Buffer kurang dari kebutuhan harus dilaporkan gagal, bukan JSON terpotong.
void test_payload_rejects_short_buffer(void) {
  TelemetryFrame f = make_frame("VS-A1-003", 1792934400UL, 22.4f, 34.1f, 7.83f, 3.87f);
  char buf[32];

  TEST_ASSERT_EQUAL_UINT(0, payload_encode(f, buf, sizeof(buf)));
}

int main(int, char**) {
  UNITY_BEGIN();
  RUN_TEST(test_payload_matches_contract_example);
  RUN_TEST(test_payload_worst_case_fits_buffer);
  RUN_TEST(test_payload_uses_one_decimal_for_moisture_and_temp);
  RUN_TEST(test_payload_encodes_temp_error_flag);
  RUN_TEST(test_payload_bounds_ph_and_battery);
  RUN_TEST(test_payload_rejects_short_buffer);
  return UNITY_END();
}
