# MQTT Setup Guide - HiveMQ Cloud (FREE)

This guide will walk you through setting up MQTT with HiveMQ Cloud for your Home IoT project.

## Step 1: Create HiveMQ Cloud Account

1. Go to [HiveMQ Cloud](https://console.hivemq.cloud/)
2. Sign up for a FREE account
3. Verify your email

## Step 2: Create a Cluster

1. Click **"Create Cluster"** or **"New Cluster"**
2. Choose **"Serverless"** (FREE tier)
   - Up to 100 connected clients
   - 10 GB data transfer/month
   - Perfect for IoT projects
3. Choose a **Cloud Provider**:
   - AWS, Google Cloud, or Azure
   - Select a region close to you
4. Give your cluster a name (e.g., "home-iot")
5. Click **"Create Cluster"**

⏳ Wait 2-3 minutes for cluster provisioning...

## Step 3: Get Cluster Connection Details

Once your cluster is ready:

1. Click on your cluster name
2. Go to **"Overview"** tab
3. Find the **"Cluster URL"** - it looks like:
   ```
   xxxxxxxxx.s1.eu.hivemq.cloud
   ```
4. Note the **Port**: `8883` (MQTT over TLS)

## Step 4: Create Access Credentials

1. Go to **"Access Management"** tab
2. Click **"Add Credentials"** or **"Create Credentials"**
3. Enter:
   - **Username**: Choose a username (e.g., `esp8266-client`)
   - **Password**: Generate a strong password
4. Click **"Add"** or **"Create"**

⚠️ **IMPORTANT**: Copy the password immediately! You won't be able to see it again.

## Step 5: Configure Your .env File

Update your `/home-iot/.env` file with the credentials:

```bash
# MQTT Configuration
MQTT_BROKER="xxxxxxxxx.s1.eu.hivemq.cloud"
MQTT_PORT="8883"
MQTT_USERNAME="esp8266-client"
MQTT_PASSWORD="your-strong-password"
```

Replace:
- `xxxxxxxxx.s1.eu.hivemq.cloud` with your actual cluster URL
- `esp8266-client` with your username
- `your-strong-password` with your actual password

## Step 6: Test the Connection

### Method 1: Use the Test API

```bash
curl http://localhost:3000/api/test/mqtt
```

Expected response:
```json
{
  "success": true,
  "connected": true,
  "message": "MQTT connection successful!",
  "config": {
    "broker": "xxxxxxxxx.s1.eu.hivemq.cloud",
    "port": "8883",
    "protocol": "mqtts"
  }
}
```

### Method 2: Check Server Logs

Look for these messages in your terminal:
```
✅ MQTT connected to HiveMQ Cloud
✅ Published to home/test-device/desired
```

## Step 7: Test with HiveMQ Web Client

1. Go to [HiveMQ Web Client](http://www.hivemq.com/demos/websocket-client/)
2. Connect to your cluster:
   - **Host**: `xxxxxxxxx.s1.eu.hivemq.cloud`
   - **Port**: `8884` (WebSocket port)
   - **Username**: Your username
   - **Password**: Your password
   - **Use TLS**: ✅ Checked
3. Click **"Connect"**
4. Subscribe to topic: `home/+/desired`
5. Test the dashboard relay toggles - you should see messages appear!

## MQTT Topics Structure

Your app uses these topics:

### Desired State (Server → Device)
```
home/{deviceId}/desired
```
Example: `home/room1/desired`

Server publishes when user toggles relay:
```json
{
  "relays": {
    "1": true,
    "2": false,
    "3": false,
    "4": false
  },
  "version": 5,
  "updatedAt": 1704672000000
}
```

### Reported State (Device → Server)
```
home/{deviceId}/reported
```
Example: `home/room1/reported`

Device publishes its current state:
```json
{
  "relays": {
    "1": true,
    "2": false,
    "3": false,
    "4": false
  },
  "lastSeen": 1704672000000
}
```

## ESP8266 Arduino Code Example

Here's a basic example for your ESP8266:

```cpp
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker settings
const char* mqtt_server = "xxxxxxxxx.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "esp8266-client";
const char* mqtt_password = "your-password";

// Device ID
const char* device_id = "room1";

// Topics
char topic_desired[50];
char topic_reported[50];

WiFiClientSecure espClient;
PubSubClient client(espClient);

// Relay pins
const int RELAY_PINS[] = {D1, D2, D3, D4};
bool relay_states[] = {false, false, false, false};

void setup_wifi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");
  
  // Parse JSON
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, payload, length);
  
  // Update relays
  JsonObject relays = doc["relays"];
  for (int i = 0; i < 4; i++) {
    char key[2];
    sprintf(key, "%d", i + 1);
    bool state = relays[key];
    relay_states[i] = state;
    digitalWrite(RELAY_PINS[i], state ? HIGH : LOW);
  }
  
  // Report back
  publishState();
}

void publishState() {
  DynamicJsonDocument doc(512);
  JsonObject relays = doc.createNestedObject("relays");
  relays["1"] = relay_states[0];
  relays["2"] = relay_states[1];
  relays["3"] = relay_states[2];
  relays["4"] = relay_states[3];
  doc["lastSeen"] = millis();
  
  char buffer[512];
  serializeJson(doc, buffer);
  client.publish(topic_reported, buffer);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect(device_id, mqtt_user, mqtt_password)) {
      Serial.println("connected!");
      client.subscribe(topic_desired);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  // Setup relay pins
  for (int i = 0; i < 4; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    digitalWrite(RELAY_PINS[i], LOW);
  }
  
  // Setup topics
  sprintf(topic_desired, "home/%s/desired", device_id);
  sprintf(topic_reported, "home/%s/reported", device_id);
  
  setup_wifi();
  
  // Configure MQTT
  espClient.setInsecure(); // For testing only!
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Report state every 10 seconds
  static unsigned long lastReport = 0;
  if (millis() - lastReport > 10000) {
    publishState();
    lastReport = millis();
  }
}
```

## Troubleshooting

### ❌ Connection Failed

**Check:**
1. Broker URL is correct (no `mqtt://` prefix)
2. Port is `8883` for MQTT over TLS
3. Username and password are correct
4. Cluster is active in HiveMQ console
5. Network/firewall allows port 8883

### ❌ "ENOTFOUND" Error

**Solution:**
- Your broker URL might be wrong
- Check for typos in MQTT_BROKER
- Verify cluster is provisioned and running

### ❌ "Not authorized" Error

**Solution:**
- Username/password mismatch
- Recreate credentials in HiveMQ console
- Update .env file

### 🔥 Best Practices

1. **Use TLS**: Always use port 8883 (not 1883)
2. **Unique Client IDs**: Each device should have a unique ID
3. **QoS Levels**:
   - QoS 0: Fire and forget (fastest)
   - QoS 1: At least once (recommended)
   - QoS 2: Exactly once (slowest)
4. **Retained Messages**: Use `retain: true` for desired state
5. **Keep-Alive**: Set appropriate keep-alive interval (60s recommended)

## Security Notes

⚠️ **Never commit .env file to Git!**

For production:
- Use different credentials per device
- Implement certificate-based auth
- Use Access Control Lists (ACL) in HiveMQ
- Rotate passwords regularly

## Need Help?

Check these resources:
- [HiveMQ Documentation](https://docs.hivemq.com/)
- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [PubSubClient Library](https://github.com/knolleary/pubsubclient)

---

✅ Once configured, your Home IoT system will have real-time control!
