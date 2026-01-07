# Home IoT Control System

A production-ready Next.js application for controlling ESP8266 IoT devices with real-time state management using Upstash Redis and MQTT.

## Features

- 🔐 **PIN-based Authentication** - Simple 4-6 digit PIN protection
- 🎛️ **Real-time Control** - Control up to 4 relays per device
- 📡 **MQTT Integration** - HiveMQ Cloud for real-time communication
- 💾 **Redis State Management** - Upstash Redis as source of truth
- 🌐 **Responsive UI** - Beautiful Tailwind CSS interface
- 🔄 **Auto Polling** - Fallback mechanism for device updates

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Upstash Redis
- **MQTT Broker**: HiveMQ Cloud
- **Authentication**: HTTP-only cookies

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file:

```bash
# Upstash Redis (Required)
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Authentication (Required)
APP_PIN="1234"

# MQTT - HiveMQ Cloud (Required)
MQTT_BROKER="your-broker.hivemq.cloud"
MQTT_PORT="8883"
MQTT_USERNAME="your-username"
MQTT_PASSWORD="your-password"
```

Create a `.env.local` file:

```bash
# Public PIN (safe to expose to client)
NEXT_PUBLIC_APP_PIN="1234"
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll be redirected to the login page.

Default PIN: **1234**

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with PIN
- `POST /api/auth/logout` - Logout (clear cookie)

### Device Control
- `POST /api/device/[id]/command` - Send command to device (requires X-APP-PIN header)
- `GET /api/device/[id]/status` - Get device status
- `GET /api/device/[id]/desired` - Get desired state (for ESP polling)
- `POST /api/device/[id]/report` - Device reports its state

### Testing
- `GET /api/test/redis` - Test Redis connection

## Project Structure

```
home-iot/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── device/[id]/   # Device control endpoints
│   │   └── test/          # Test endpoints
│   ├── dashboard/         # Protected dashboard
│   └── login/             # Login page
├── components/
│   └── RelayControl.tsx   # Relay control component
├── lib/
│   ├── auth.ts           # Auth utilities
│   ├── mqtt.ts           # MQTT client
│   └── redis.ts          # Redis client
└── middleware.ts         # Route protection
```

## Testing

### Test Redis Connection
```bash
curl http://localhost:3000/api/test/redis
```

Expected response:
```json
{
  "success": true,
  "message": "Redis connection successful",
  "result": "OK"
}
```

### Test MQTT Connection
```bash
curl http://localhost:3000/api/test/mqtt
```

Expected response:
```json
{
  "success": true,
  "connected": true,
  "message": "MQTT connection successful!..."
}
```

### Test Device Command
```bash
curl -X POST http://localhost:3000/api/device/room1/command \
  -H "Content-Type: application/json" \
  -H "X-APP-PIN: 1234" \
  -d '{"relay": 1, "state": true}'
```

### Test Device Status
```bash
curl http://localhost:3000/api/device/room1/status
```

## ESP8266 Integration

See [ESP8266_SETUP.md](./ESP8266_SETUP.md) for complete hardware and software setup guide.

### Quick Start for ESP8266

1. **Wire your ESP8266:**
   - D1 (GPIO5) → Relay 1
   - D2 (GPIO4) → Relay 2
   - D5 (GPIO14) → Relay 3
   - D6 (GPIO12) → Relay 4

2. **Update credentials in Arduino code:**
   ```cpp
   const char* WIFI_SSID = "your-wifi";
   const char* WIFI_PASS = "your-password";
   ```

3. **Upload and monitor:**
   - Board: NodeMCU 1.0 (ESP-12E Module)
   - Baud: 115200 (upload), 9600 (monitor)

4. **Test device:**
   - Visit: `http://ESP_IP/status`
   - Control relays from dashboard

## MQTT Background Listener (Optional)

For automatic Redis updates when devices report via MQTT:

```bash
# Install ts-node if not already installed
pnpm add -D ts-node

# Run the listener
npx ts-node lib/mqtt-listener.ts
```

This will listen to `home/room1/reported` and update Redis automatically.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
