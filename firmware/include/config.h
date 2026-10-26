#pragma once

// ============================================================================
// config.h — Pinout, kalibrasi, dan konstanta node VolatiSafe AIoT
// Sumber: docs/hardware/PINOUT_AND_SCHEMATICS.md, docs/hardware/FIRMWARE_SPEC.md
// ============================================================================

// --- Identitas Node ---------------------------------------------------------
// SIM_NODE dipasang build flag [env:wokwi] (DEC-IOT-03). Lewat #if, bukan
// -D NODE_ID="...", karena quoting build flag rapuh di Windows.
#if defined(SIM_NODE)
  #define NODE_ID             "VS-SIM-001"
  #define NODE_IS_SIMULATED   1
#else
  #define NODE_ID             "VS-A1-003"
  #define NODE_IS_SIMULATED   0
#endif

#define FIRMWARE_VERSION    "1.0.0"
#define PAYLOAD_BUF_SIZE    96      // payload nyata 70-76 byte, bukan 52 (DEC-IOT-02)

// --- Pinout ESP32 NodeMCU V1 (30-pin) ---------------------------------------
// Analog WAJIB di ADC1 (GPIO 32-39); ADC2 terkunci saat radio aktif.
#define PIN_MOISTURE        34   // ADC1_CH6  Capacitive Soil Moisture v1.2
#define PIN_PH              32   // ADC1_CH4  Modul analog pH tanah
#define PIN_BATTERY         35   // ADC1_CH7  Voltage divider 100k/100k
#define PIN_DS18B20         4    // 1-Wire    DS18B20 (+ pull-up 4.7k ke 3.3V)
#define PIN_SENSOR_POWER    25   // Digital   MOSFET power gate (HIGH=ON, LOW=SLEEP)

// SPI LoRa SX1278 Ra-02 433 MHz
#define PIN_LORA_SCK        18
#define PIN_LORA_MISO       19
#define PIN_LORA_MOSI       23
#define PIN_LORA_CS         5
#define PIN_LORA_RST        14
#define PIN_LORA_DIO0       2

// --- Konfigurasi LoRa SX1278 ------------------------------------------------
#define LORA_FREQUENCY      433E6   // 433.0 MHz
#define LORA_TX_POWER       17      // +17 dBm
#define LORA_SYNC_WORD      0x12

// --- Sampling & Filtering ---------------------------------------------------
// ADC_11db hanya ada di core Arduino. env:native mengompilasi config.h tanpa
// Arduino.h, jadi makro itu harus disembunyikan agar native tidak gagal build.
#if !defined(NATIVE_BUILD)
  #define ADC_ATTENUATION   ADC_11db
#endif
#define SAMPLE_COUNT        5       // Burst sampling 5x
#define SAMPLE_INTERVAL_MS  50
#define SENSOR_WARMUP_MS    200     // Stabilisasi tegangan setelah MOSFET ON
#define BATTERY_SAMPLE_COUNT 3      // Baterai cukup 3 sampel, bukan 5
#define ADC_MAX             4095.0f
#define DS18B20_RESOLUTION  11      // +-0,125 C, konversi ~375 ms (12-bit 750 ms)

// --- Kalibrasi Kelembaban Kapasitif (2 titik) -------------------------------
#define MOISTURE_DRY_ADC    2800    // Pembacaan di udara kering
#define MOISTURE_WET_ADC    1350    // Pembacaan di tanah jenuh air

// --- Kalibrasi pH (2 titik buffer 4.01 & 6.86) ------------------------------
#define PH_NEUTRAL_ADC      1500.0f // ADC pada buffer netral (~pH 7)
#define PH_SLOPE            300.0f  // ADC per satuan pH

// --- Rentang Fisik Valid (gate validasi lokal) ------------------------------
#define MOISTURE_MIN        0.0f
#define MOISTURE_MAX        100.0f
#define SOIL_TEMP_MIN       -10.0f
#define SOIL_TEMP_MAX       60.0f
#define PH_MIN              3.0f
#define PH_MAX              10.0f
#define TEMP_ERROR_FLAG     -999.0f // DS18B20 terputus (-127C)
#define TEMP_DISCONNECTED_C -126.0f // DallasTemperature DEVICE_DISCONNECTED_C
#define ADC_UNSTABLE_RANGE  800     // placeholder; diukur nyata di HW-9.1 (F-01)

// --- Manajemen Daya ---------------------------------------------------------
// SIM_FAST_CYCLE memampatkan tidur ke 10 detik agar demo mungkin; nilai ini
// wajib dicetak di Serial supaya tidak disangka perilaku produksi (DEC-IOT-15).
#if defined(SIM_FAST_CYCLE)
  #define SLEEP_DURATION_US   (10ULL * 1000000ULL)
#else
  #define SLEEP_DURATION_US   (15ULL * 60ULL * 1000000ULL)  // 15 menit
#endif
#define BATTERY_DIVIDER     2.0f    // 100k/100k -> setengah tegangan
#define ADC_REF_VOLTAGE     3.3f

// --- Transport --------------------------------------------------------------
#define TRANSPORT_KIND_LORA   1
#define TRANSPORT_KIND_MQTT   2
#define TRANSPORT_KIND_DUMMY  0

// --- Retry & Timeout --------------------------------------------------------
#define TX_RETRY_MAX           3
#define TX_RETRY_DELAY_MS      2000
#define WIFI_CONNECT_TIMEOUT_MS 10000
#define MQTT_CONNECT_TIMEOUT_MS 5000
