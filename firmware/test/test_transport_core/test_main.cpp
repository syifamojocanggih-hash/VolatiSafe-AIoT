#include <unity.h>

#include "config.h"
#include "transport.h"

void setUp(void) {}
void tearDown(void) {}

// --- Pembantu: attempt palsu dengan hitungan, gap tanpa jeda ----------------

struct FakeAttempt {
  uint8_t calls;
  uint8_t succeed_on;   // 1-based; 0 berarti tidak pernah berhasil
};

static FakeAttempt g_attempt{};
static uint8_t     g_gaps = 0;

static bool attemptStub(const char* payload, size_t len) {
  g_attempt.calls++;
  TEST_ASSERT_NOT_NULL(payload);
  TEST_ASSERT_TRUE(len > 0);
  return g_attempt.succeed_on != 0 && g_attempt.calls >= g_attempt.succeed_on;
}

static void gapStub() { g_gaps++; }

static void resetFakes(uint8_t succeed_on) {
  g_attempt = FakeAttempt{0, succeed_on};
  g_gaps    = 0;
}

// --- Test -------------------------------------------------------------------

// DoD HW-3.4: broker mati -> tepat TX_RETRY_MAX percobaan, tidak menggantung.
void test_retry_gives_up_after_max_attempts(void) {
  resetFakes(0);

  const TxResult r = transport_retry("{}", 2, TX_RETRY_MAX, attemptStub, gapStub);

  TEST_ASSERT_FALSE(r.ok);
  TEST_ASSERT_EQUAL_UINT8(TX_RETRY_MAX, r.attempts);
  TEST_ASSERT_EQUAL_UINT8(TX_RETRY_MAX, g_attempt.calls);
}

// Jeda hanya di antara percobaan: 3 percobaan = 2 jeda, bukan 3.
void test_retry_waits_between_attempts_only(void) {
  resetFakes(0);

  transport_retry("{}", 2, TX_RETRY_MAX, attemptStub, gapStub);

  TEST_ASSERT_EQUAL_UINT8(TX_RETRY_MAX - 1, g_gaps);
}

void test_retry_stops_on_first_success(void) {
  resetFakes(2);

  const TxResult r = transport_retry("{}", 2, TX_RETRY_MAX, attemptStub, gapStub);

  TEST_ASSERT_TRUE(r.ok);
  TEST_ASSERT_EQUAL_UINT8(2, r.attempts);
  TEST_ASSERT_EQUAL_UINT8(1, g_gaps);
}

void test_retry_succeeds_first_try_without_gap(void) {
  resetFakes(1);

  const TxResult r = transport_retry("{}", 2, TX_RETRY_MAX, attemptStub, gapStub);

  TEST_ASSERT_TRUE(r.ok);
  TEST_ASSERT_EQUAL_UINT8(1, r.attempts);
  TEST_ASSERT_EQUAL_UINT8(0, g_gaps);
}

// Batas percobaan tidak boleh dilampaui walau pemanggil minta lebih banyak
// daripada TX_RETRY_MAX yang disepakati.
void test_retry_respects_caller_bound(void) {
  resetFakes(0);

  const TxResult r = transport_retry("{}", 2, 1, attemptStub, gapStub);

  TEST_ASSERT_FALSE(r.ok);
  TEST_ASSERT_EQUAL_UINT8(1, r.attempts);
  TEST_ASSERT_EQUAL_UINT8(0, g_gaps);
}

// max_attempts 0 berarti tidak boleh ada percobaan sama sekali.
void test_retry_zero_attempts_sends_nothing(void) {
  resetFakes(1);

  const TxResult r = transport_retry("{}", 2, 0, attemptStub, gapStub);

  TEST_ASSERT_FALSE(r.ok);
  TEST_ASSERT_EQUAL_UINT8(0, r.attempts);
  TEST_ASSERT_EQUAL_UINT8(0, g_attempt.calls);
}

// attempt null harus gagal, bukan dereference null.
void test_retry_null_attempt_is_rejected(void) {
  resetFakes(1);

  const TxResult r = transport_retry("{}", 2, TX_RETRY_MAX, nullptr, gapStub);

  TEST_ASSERT_FALSE(r.ok);
  TEST_ASSERT_EQUAL_UINT8(0, r.attempts);
}

// gap null berarti tanpa jeda, bukan crash.
void test_retry_null_gap_is_allowed(void) {
  resetFakes(0);

  const TxResult r = transport_retry("{}", 2, 2, attemptStub, nullptr);

  TEST_ASSERT_FALSE(r.ok);
  TEST_ASSERT_EQUAL_UINT8(2, r.attempts);
}

int main(int, char**) {
  UNITY_BEGIN();
  RUN_TEST(test_retry_gives_up_after_max_attempts);
  RUN_TEST(test_retry_waits_between_attempts_only);
  RUN_TEST(test_retry_stops_on_first_success);
  RUN_TEST(test_retry_succeeds_first_try_without_gap);
  RUN_TEST(test_retry_respects_caller_bound);
  RUN_TEST(test_retry_zero_attempts_sends_nothing);
  RUN_TEST(test_retry_null_attempt_is_rejected);
  RUN_TEST(test_retry_null_gap_is_allowed);
  return UNITY_END();
}
