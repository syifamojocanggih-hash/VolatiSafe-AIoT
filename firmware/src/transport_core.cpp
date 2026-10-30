// Logika retry bersama MQTT dan LoRa. Murni: tidak menyentuh hardware, jadi
// ikut env:native dan diuji tanpa board (HW-3.3/3.4).
//
// Callback dipakai supaya kedua transport berbagi satu loop yang sama tanpa
// saling mengenal. Versi pertama menyalin loop yang sama dua kali, dan dua
// salinan mudah menyimpang (satu pakai jeda setelah percobaan terakhir, satu
// tidak).
#include "transport.h"

TxResult transport_retry(const char* payload, size_t len, uint8_t max_attempts,
                         TxAttemptFn attempt, TxGapFn gap) {
  TxResult r{false, 0, 0};

  // Tanpa attempt, percobaan nol berarti gagal, bukan sukses.
  if (attempt == nullptr || max_attempts == 0) return r;

  for (uint8_t i = 1; i <= max_attempts; i++) {
    r.attempts = i;
    if (attempt(payload, len)) {
      r.ok = true;
      return r;
    }
    // Jeda hanya di antara percobaan. Menunggu 2 detik setelah percobaan
    // terakhir memperpanjang bangun tanpa satu pun kesempatan tambahan.
    if (i < max_attempts && gap != nullptr) gap();
  }

  return r;
}
