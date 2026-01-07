#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

/* ================= WIFI ================= */
const char* WIFI_SSID = "SyedJioFiber(s)";
const char* WIFI_PASS = "700436430";

/* ================= MQTT (HiveMQ) ================= */
const char* MQTT_HOST = "9170326bd89d4ae39e956f824038d012.s1.eu.hivemq.cloud";
const int MQTT_PORT = 8883;
const char* MQTT_USER = "syed-home";
const char* MQTT_PASS = "Syed@2026@Home";

/* ================= DEVICE ================= */
const char* DEVICE_ID = "room1";
const char* TOPIC_DESIRED  = "home/room1/desired";
const char* TOPIC_REPORTED = "home/room1/reported";

/* ================= RELAY PINS ================= */
// LOW-level trigger relays
#define RELAY1 D1   // GPIO5
#define RELAY2 D2   // GPIO4
#define RELAY3 D5   // GPIO14
#define RELAY4 D6   // GPIO12

WiFiClientSecure espClient;
PubSubClient mqtt(espClient);
ESP8266WebServer server(80);

/* ================= RELAY CONTROL ================= */
void setRelay(uint8_t relay, bool state) {
  uint8_t pin;
  switch (relay) {
    case 1: pin = RELAY1; break;
    case 2: pin = RELAY2; break;
    case 3: pin = RELAY3; break;
    case 4: pin = RELAY4; break;
    default: return;
  }
  digitalWrite(pin, state ? LOW : HIGH); // LOW = ON
}

/* ================= MQTT HEARTBEAT ================= */
void sendMqttHeartbeat() {
  if (!mqtt.connected()) return;

  StaticJsonDocument<128> report;
  report["device"] = DEVICE_ID;
  report["status"] = "online";
  report["ip"] = WiFi.localIP().toString();
  report["uptime"] = millis() / 1000;

  char buffer[128];
  serializeJson(report, buffer);
  mqtt.publish(TOPIC_REPORTED, buffer);

  Serial.println("💓 MQTT Heartbeat sent");
}

/* ================= MQTT CALLBACK ================= */
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) return;

  if (!doc.containsKey("relays")) return;

  JsonObject relays = doc["relays"];
  for (JsonPair kv : relays) {
    int relay = atoi(kv.key().c_str());
    bool state = kv.value();
    setRelay(relay, state);
  }

  // Report back immediately after command
  StaticJsonDocument<128> report;
  report["device"] = DEVICE_ID;
  report["status"] = "applied";
  report["ip"] = WiFi.localIP().toString();
  report["uptime"] = millis() / 1000;

  char buffer[128];
  serializeJson(report, buffer);
  mqtt.publish(TOPIC_REPORTED, buffer);

  Serial.println("📡 Command applied & reported");
}

/* ================= NON-BLOCKING MQTT CONNECT ================= */
unsigned long lastMqttAttempt = 0;

void ensureMQTT() {
  if (mqtt.connected()) return;

  unsigned long now = millis();
  if (now - lastMqttAttempt < 5000) return;
  lastMqttAttempt = now;

  Serial.println("Trying MQTT...");
  if (mqtt.connect(DEVICE_ID, MQTT_USER, MQTT_PASS)) {
    Serial.println("MQTT connected");
    mqtt.subscribe(TOPIC_DESIRED);
    // Send initial heartbeat
    sendMqttHeartbeat();
  } else {
    Serial.print("MQTT failed, rc=");
    Serial.println(mqtt.state());
  }
}

/* ================= HTTP ROUTES ================= */
void handleRoot() {
  server.send(200, "text/plain", "ESP8266 is running 🚀");
}

void handleStatus() {
  String msg;
  msg += "Device: room1\n";
  msg += "IP: " + WiFi.localIP().toString() + "\n";
  msg += "WiFi: connected\n";
  msg += "MQTT: ";
  msg += mqtt.connected() ? "connected\n" : "disconnected\n";
  msg += "Uptime: " + String(millis() / 1000) + " sec\n";

  server.send(200, "text/plain", msg);
}

// Example: /relay?ch=1&state=on
void handleRelay() {
  if (!server.hasArg("ch") || !server.hasArg("state")) {
    server.send(400, "text/plain", "Usage: /relay?ch=1&state=on");
    return;
  }

  int ch = server.arg("ch").toInt();
  bool state = server.arg("state") == "on";
  setRelay(ch, state);

  server.send(200, "text/plain", "Relay updated");
}

/* ================= SETUP ================= */
void setup() {
  Serial.begin(9600);

  pinMode(RELAY1, OUTPUT);
  pinMode(RELAY2, OUTPUT);
  pinMode(RELAY3, OUTPUT);
  pinMode(RELAY4, OUTPUT);

  // Default OFF
  digitalWrite(RELAY1, HIGH);
  digitalWrite(RELAY2, HIGH);
  digitalWrite(RELAY3, HIGH);
  digitalWrite(RELAY4, HIGH);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  Serial.println(WiFi.localIP());

  espClient.setInsecure(); // OK for now (TLS without cert)
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(mqttCallback);

  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  server.on("/relay", handleRelay);
  server.begin();

  Serial.println("HTTP server started");
}

/* ================= LOOP ================= */
unsigned long lastHeartbeat = 0;

void loop() {
  ensureMQTT();        // non-blocking
  mqtt.loop();         // MQTT keep-alive
  server.handleClient(); // HTTP handling

  // Send MQTT heartbeat every 30 seconds
  unsigned long now = millis();
  if (now - lastHeartbeat >= 30000) {
    lastHeartbeat = now;
    sendMqttHeartbeat();
  }

  yield();             // keep WiFi alive
}