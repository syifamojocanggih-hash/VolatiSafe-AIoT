/**
 * VolatiSafe-AIoT — Wokwi Virtual Node Simulation (TKT 3)
 * Target MCU : ESP32 DevKit V4
 * Protocol   : Virtual LoRa/WiFi Bridge -> MQTT Telemetry
 * Spec       : docs/hardware/WOKWI_SIMULATION.md
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// ==========================================
// PINOUT MAPPING
// ==========================================
#define PIN_MOISTURE_POT   34  // Potensiometer simulasi kelembaban
#define PIN_PH_POT         32  // Potensiometer simulasi pH tanah
#define PIN_ONEWIRE_TEMP   4   // DS18B20 probe suhu digital

// ==========================================
// NETWORK & MQTT CONFIGURATION
// ==========================================
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// Menggunakan public broker untuk simulasi cloud Wokwi (atau broker lokal port 1883)
const char* MQTT_SERVER   = "broker.emqx.io";
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC    = "/volatisafe/v1/node/VS-SIM-001/telemetry";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

OneWire oneWire(PIN_ONEWIRE_TEMP);
DallasTemperature tempSensor(&oneWire);

// Status simulasi
bool simulationPaused = false;
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 5000; // Kirim tiap 5 detik untuk demo interaktif

void setupWifi() {
    Serial.println();
    Serial.print(F("[WIFI] Menghubungkan ke Wokwi Virtual Network (Wokwi-GUEST)..."));
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry < 20) {
        delay(300);
        Serial.print(F("."));
        retry++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println(F("\n[WIFI-OK] Terhubung! IP Address: "));
        Serial.println(WiFi.localIP());
    } else {
        Serial.println(F("\n[WIFI-WARN] Mode offline / Serial Only."));
    }
}

void reconnectMqtt() {
    if (WiFi.status() != WL_CONNECTED) return;
    if (!mqttClient.connected()) {
        Serial.print(F("[MQTT] Menghubungkan ke broker: "));
        Serial.print(MQTT_SERVER);
        Serial.print(F("..."));
        String clientId = "VolatiSafe-Wokwi-Node-" + String(random(0xffff), HEX);
        if (mqttClient.connect(clientId.c_str())) {
            Serial.println(F(" TERHUBUNG!"));
        } else {
            Serial.print(F(" GAGAL, rc="));
            Serial.println(mqttClient.state());
        }
    }
}

void printBanner() {
    Serial.println(F("\n======================================================="));
    Serial.println(F("  VOLATISAFE AIoT — WOKWI VIRTUAL TESTBED (TKT 3)"));
    Serial.println(F("  Node ID: VS-SIM-001 | Field ID: BLOK-A"));
    Serial.println(F("======================================================="));
    Serial.println(F("Perintah Uji Skenario Interaktif (Ketik di Serial Monitor):"));
    Serial.println(F("  [A] -> Skenario Terik Siang (AVRI 78% Kritis - Banner Merah)"));
    Serial.println(F("  [B] -> Skenario Presipitasi Hujan (AVRI 18% Aman - Banner Hijau)"));
    Serial.println(F("  [C] -> Skenario Dropout / Node Failover (Simulasi Offline)"));
    Serial.println(F("  [R] -> Reset ke Pembacaan Potensiometer Wokwi"));
    Serial.println(F("-------------------------------------------------------\n"));
}

void setup() {
    Serial.begin(115200);
    delay(500);
    printBanner();

    pinMode(PIN_MOISTURE_POT, INPUT);
    pinMode(PIN_PH_POT, INPUT);
    tempSensor.begin();

    setupWifi();
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
}

void sendTelemetryPayload(float moisture, float temp, float ph, float battery) {
    // Susun payload kompak 52-Byte sesuai TELEMETRY_PAYLOAD.md
    StaticJsonDocument<128> doc;
    doc["n"]  = "VS-SIM-001";
    doc["ts"] = 1792934400 + (millis() / 1000);
    doc["m"]  = round(moisture * 10.0f) / 10.0f;
    doc["t"]  = round(temp * 10.0f) / 10.0f;
    doc["ph"] = round(ph * 100.0f) / 100.0f;
    doc["b"]  = round(battery * 100.0f) / 100.0f;

    String payload;
    serializeJson(doc, payload);

    Serial.printf("[TELEMETRY-TX] Paket %d byte -> %s\n", payload.length(), payload.c_str());
    Serial.printf("  • Kelembaban : %.1f %% VWC\n", moisture);
    Serial.printf("  • Suhu Tanah : %.1f °C\n", temp);
    Serial.printf("  • pH Tanah   : %.2f\n", ph);
    Serial.printf("  • Baterai    : %.2f V\n", battery);

    if (mqttClient.connected()) {
        mqttClient.publish(MQTT_TOPIC, payload.c_str());
        Serial.println(F("  [MQTT-ACK] Berhasil dipancarkan ke topik /volatisafe/v1/node/VS-SIM-001/telemetry"));
    }
}

void handleInteractiveCommands() {
    if (Serial.available()) {
        char cmd = toupper((char)Serial.read());
        if (cmd == 'A') {
            Serial.println(F("\n>>> [SKENARIO A DIAKTIFKAN: TERIK EKSTREM SIANG HARI] <<<"));
            Serial.println(F("Tanah Kering (21.0%), Suhu Terik (34.5°C), pH Basa (7.85)"));
            Serial.println(F("Ekspektasi: AVRI Kritis ~78% -> Banner Merah: TUNDA APLIKASI UREA!"));
            sendTelemetryPayload(21.0f, 34.5f, 7.85f, 3.84f);
        } else if (cmd == 'B') {
            Serial.println(F("\n>>> [SKENARIO B DIAKTIFKAN: PRESIPITASI HUJAN SORE] <<<"));
            Serial.println(F("Tanah Lembap (42.0%), Suhu Sejuk (26.0°C), pH Netral (6.80)"));
            Serial.println(F("Ekspektasi: AVRI Aman ~18% -> Banner Hijau: JENDELA AMAN TERBUKA!"));
            sendTelemetryPayload(42.0f, 26.0f, 6.80f, 3.95f);
        } else if (cmd == 'C') {
            simulationPaused = !simulationPaused;
            if (simulationPaused) {
                Serial.println(F("\n>>> [SKENARIO C DIAKTIFKAN: SENSOR DROPOUT / NODE OFFLINE] <<<"));
                Serial.println(F("Node berhenti memancarkan paket."));
                Serial.println(F("Ekspektasi: Digital Twin Backend mengambil alih (Failover Mode) via estimasi FAO-56."));
            } else {
                Serial.println(F("\n>>> [NODE KEMBALI ONLINE] <<<"));
            }
        } else if (cmd == 'R') {
            Serial.println(F("\n>>> [RESET KE SENSOR FISIK / POTENSIOMETER WOKWI] <<<"));
            simulationPaused = false;
        }
    }
}

void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        if (!mqttClient.connected()) {
            reconnectMqtt();
        }
        mqttClient.loop();
    }

    handleInteractiveCommands();

    if (!simulationPaused && (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL_MS)) {
        lastTelemetryTime = millis();

        // 1. Baca Potensiometer Kelembaban (GPIO34) -> map ke 10.0% - 65.0%
        int pot_m = analogRead(PIN_MOISTURE_POT);
        float moisture = 10.0f + ((float)pot_m / 4095.0f) * 55.0f;

        // 2. Baca Potensiometer pH (GPIO32) -> map ke pH 5.00 - 8.50
        int pot_p = analogRead(PIN_PH_POT);
        float ph = 5.00f + ((float)pot_p / 4095.0f) * 3.50f;

        // 3. Baca Suhu dari DS18B20 (GPIO4)
        tempSensor.requestTemperatures();
        float temp = tempSensor.getTempCByIndex(0);
        if (temp == DEVICE_DISCONNECTED_C || temp < -10.0f) {
            temp = 29.5f; // Fallback jika simulator DS18B20 belum di-set
        }

        float battery = 3.88f;
        sendTelemetryPayload(moisture, temp, ph, battery);
    }

    delay(50);
}
