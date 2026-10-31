#include <Arduino.h>
#include <Preferences.h>

#include "calibration.h"
#include "config.h"

// Namespace dan key mengikuti 04_FIRMWARE_CORE.md 6. Nama key sengaja pendek:
// NVS menyimpan key sebagai string dengan batas 15 karakter.
static const char* NVS_NAMESPACE = "vscal";
static const char* KEY_MOIST_DRY = "m_dry";
static const char* KEY_MOIST_WET = "m_wet";
static const char* KEY_PH_NEUT  = "ph_n";
static const char* KEY_PH_SLOPE = "ph_s";

static Preferences s_prefs;

// calibration_defaults dan calibration_validate tinggal di calibration_core.cpp
// supaya bisa diuji di env:native tanpa Arduino.h.

// Return false dan jangan sentuh out bila NVS kosong, tidak lengkap, atau
// nilainya tidak lolos validasi. Pemanggil yang memutuskan jatuh ke default,
// supaya pesan Serial tetap bisa menyebut alasannya.
bool calibration_begin(Calibration& out) {
  // begin(readOnly=true) gagal bila namespace belum pernah dibuat, yaitu
  // kondisi normal pada boot pertama. Jangan diperlakukan sebagai error.
  if (!s_prefs.begin(NVS_NAMESPACE, /*readOnly=*/true)) return false;

  const bool complete = s_prefs.isKey(KEY_MOIST_DRY) && s_prefs.isKey(KEY_MOIST_WET) &&
                        s_prefs.isKey(KEY_PH_NEUT) && s_prefs.isKey(KEY_PH_SLOPE);
  if (!complete) {
    s_prefs.end();
    return false;
  }

  Calibration c{};
  c.moist_dry      = s_prefs.getUShort(KEY_MOIST_DRY, MOISTURE_DRY_ADC);
  c.moist_wet      = s_prefs.getUShort(KEY_MOIST_WET, MOISTURE_WET_ADC);
  c.ph_neutral_adc = s_prefs.getFloat(KEY_PH_NEUT, PH_NEUTRAL_ADC);
  c.ph_slope       = s_prefs.getFloat(KEY_PH_SLOPE, PH_SLOPE);
  c.from_nvs       = true;
  s_prefs.end();

  if (!calibration_validate(c)) {
    Serial.printf("[CAL] NVS tidak valid: m_dry=%u m_wet=%u ph_n=%.1f ph_s=%.1f\n",
                  c.moist_dry, c.moist_wet, c.ph_neutral_adc, c.ph_slope);
    return false;
  }

  out = c;
  return true;
}

bool calibration_save(const Calibration& c) {
  if (!calibration_validate(c)) {
    Serial.println(F("[CAL] simpan ditolak: nilai tidak valid"));
    return false;
  }

  if (!s_prefs.begin(NVS_NAMESPACE, /*readOnly=*/false)) {
    Serial.println(F("[CAL] NVS gagal dibuka untuk tulis"));
    return false;
  }

  s_prefs.putUShort(KEY_MOIST_DRY, c.moist_dry);
  s_prefs.putUShort(KEY_MOIST_WET, c.moist_wet);
  s_prefs.putFloat(KEY_PH_NEUT, c.ph_neutral_adc);
  s_prefs.putFloat(KEY_PH_SLOPE, c.ph_slope);
  s_prefs.end();

  Serial.println(F("[CAL] tersimpan ke NVS"));
  return true;
}

void calibration_print(const Calibration& c) {
  Serial.printf("[CAL] moist_dry=%u moist_wet=%u ph_n=%.1f ph_s=%.1f from_nvs=%d\n",
                c.moist_dry, c.moist_wet, c.ph_neutral_adc, c.ph_slope,
                (int)c.from_nvs);
}
