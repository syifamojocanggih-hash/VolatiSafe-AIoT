// Fungsi murni tanpa hardware. Hanya file ini, payload.cpp, transport_core.cpp,
// dan calibration_core.cpp yang ikut env:native, jadi jangan tarik Arduino.h.
#include "config.h"
#include "sensors.h"

static float clampf(float v, float lo, float hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

static bool inRange(float v, float lo, float hi) {
  return v >= lo && v <= hi;
}

// Urutan prioritas: OUT_OF_RANGE menang atas UNSTABLE. Kanal yang nilainya di
// luar batas fisik sudah pasti rusak, jadi menyebutnya "cuma goyang" menutupi
// penyebab sebenarnya.
static SensorStatus channelStatus(float v, float lo, float hi, bool unstable) {
  if (!inRange(v, lo, hi)) return SENSOR_OUT_OF_RANGE;
  return unstable ? SENSOR_UNSTABLE : SENSOR_OK;
}

// Buang satu min & satu max, rata-rata sisanya (DEC-IOT-06: median-average,
// bukan median sejati, supaya dua outlier sekaligus ikut terbuang).
float sensors_medianAverage(const uint16_t* s, uint8_t n) {
  if (n == 0) return 0.0f;
  if (n <= 2) {
    uint32_t sum = 0;
    for (uint8_t i = 0; i < n; i++) sum += s[i];
    return (float)sum / (float)n;
  }

  uint16_t mn = s[0], mx = s[0];
  uint32_t sum = 0;
  for (uint8_t i = 0; i < n; i++) {
    if (s[i] < mn) mn = s[i];
    if (s[i] > mx) mx = s[i];
    sum += s[i];
  }
  return (float)(sum - mn - mx) / (float)(n - 2);
}

float sensors_adcToMoisturePct(uint16_t adc, uint16_t dry, uint16_t wet) {
  // Kalibrasi tidak valid tidak boleh menghasilkan 0 %: itu angka wajar yang
  // lolos gate backend. Sentinel memaksa paket ditolak.
  if (dry == wet) return MOISTURE_ERROR_FLAG;

  // Tidak di-clamp. Sensor short (ADC 0) menghasilkan >100 % dan sensor putus
  // (ADC 4095) menghasilkan <0 %; keduanya di luar kontrak sehingga backend
  // menolaknya. Memotong ke 0/100 justru mengubah kerusakan jadi data sah.
  return ((float)dry - (float)adc) / ((float)dry - (float)wet) * 100.0f;
}

float sensors_adcToPh(uint16_t adc, float neutral_adc, float slope, float moisture_pct) {
  if (!(slope > 0.0f)) return PH_ERROR_FLAG;   // menangkap NaN juga

  const float raw = 7.0f - ((float)adc - neutral_adc) / slope;

  // Kompensasi dibatasi ke inputnya, bukan hasilnya. moisture sentinel (-999)
  // akan menggeser pH sejauh 3,1 satuan kalau dibiarkan, menutupi penyebab.
  const float m = clampf(moisture_pct, MOISTURE_MIN, MOISTURE_MAX);
  return raw + 0.15f * (50.0f - m) / 50.0f;
}

float sensors_adcToBatteryV(uint16_t adc) {
  return ((float)adc / ADC_MAX) * ADC_REF_VOLTAGE * BATTERY_DIVIDER;
}

bool sensors_isUnstable(uint16_t min, uint16_t max) {
  return (uint16_t)(max - min) > (uint16_t)ADC_UNSTABLE_RANGE;
}

void sensors_classifyTemp(float t_c, SensorReading& out) {
  if (t_c <= TEMP_DISCONNECTED_C) {
    out.value  = TEMP_ERROR_FLAG;
    out.status = SENSOR_DISCONNECTED;
    return;
  }
  // Nilai di luar rentang dikirim apa adanya, tidak di-clamp: menyamarkan
  // kerusakan sensor jadi pembacaan wajar justru membuat data palsu lolos.
  out.value  = t_c;
  out.status = (t_c < SOIL_TEMP_MIN || t_c > SOIL_TEMP_MAX) ? SENSOR_OUT_OF_RANGE
                                                            : SENSOR_OK;
}

void sensors_composeFrame(const AdcBurst& moist, const AdcBurst& ph,
                          uint16_t batt_adc, float temp_c,
                          const Calibration& cal, TelemetryFrame& out) {
  out.moisture.value = sensors_adcToMoisturePct(moist.median, cal.moist_dry, cal.moist_wet);
  out.moisture.status = channelStatus(out.moisture.value, MOISTURE_MIN, MOISTURE_MAX,
                                     sensors_isUnstable(moist.min, moist.max));

#if PH_ONBOARD
  // Kompensasi pH memakai moisture yang baru dihitung, bukan nilai mentah.
  out.ph.value = sensors_adcToPh(ph.median, cal.ph_neutral_adc, cal.ph_slope,
                                 out.moisture.value);
  out.ph.status = channelStatus(out.ph.value, PH_MIN, PH_MAX,
                                sensors_isUnstable(ph.min, ph.max));
#else
  // Tanpa modul pH, GPIO32 hanya membaca noise. Placeholder netral menjaga
  // payload tetap sah, sementara status melarang backend memakainya.
  (void)ph;
  out.ph.value  = PH_PLACEHOLDER;
  out.ph.status = SENSOR_NOT_PRESENT;
#endif

  sensors_classifyTemp(temp_c, out.soil_temp);

#if BATTERY_ONBOARD
  // Divider putus -> 0 V, divider short -> >4,25 V. Keduanya bukan baterai.
  out.battery.value  = sensors_adcToBatteryV(batt_adc);
  out.battery.status = channelStatus(out.battery.value, BATTERY_MIN_V, BATTERY_MAX_V,
                                     false);
#else
  // Tanpa divider, GPIO35 tidak mengukur apa pun. Nilai placeholder menjaga
  // payload tetap sah, sementara status memberi tahu backend bahwa kanal ini
  // belum terpasang dan tidak boleh dipakai untuk keputusan low-battery.
  (void)batt_adc;
  out.battery.value  = BATTERY_PLACEHOLDER_V;
  out.battery.status = SENSOR_NOT_PRESENT;
#endif
}
