#!/bin/bash

echo "🏠 Home IoT Setup & Testing Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env file with your credentials."
    echo "See MQTT_SETUP.md for instructions."
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"
echo ""

# Start development server in background
echo "Starting Next.js dev server..."
pnpm dev > /dev/null 2>&1 &
DEV_PID=$!

echo "Waiting for server to start..."
sleep 5

# Test Redis Connection
echo ""
echo "Testing Redis Connection..."
REDIS_RESPONSE=$(curl -s http://localhost:3000/api/test/redis)
REDIS_SUCCESS=$(echo $REDIS_RESPONSE | grep -o '"success":true' || echo "")

if [ -n "$REDIS_SUCCESS" ]; then
    echo -e "${GREEN}✅ Redis connection successful${NC}"
else
    echo -e "${RED}❌ Redis connection failed${NC}"
    echo "Response: $REDIS_RESPONSE"
fi

# Test MQTT Connection
echo ""
echo "Testing MQTT Connection..."
MQTT_RESPONSE=$(curl -s http://localhost:3000/api/test/mqtt)
MQTT_SUCCESS=$(echo $MQTT_RESPONSE | grep -o '"success":true' || echo "")

if [ -n "$MQTT_SUCCESS" ]; then
    echo -e "${GREEN}✅ MQTT connection successful${NC}"
    echo -e "Broker: $(echo $MQTT_RESPONSE | grep -o '"broker":"[^"]*"' | cut -d'"' -f4)"
else
    echo -e "${RED}❌ MQTT connection failed${NC}"
    echo "Response: $MQTT_RESPONSE"
fi

# Test Device Status
echo ""
echo "Testing Device Status API..."
STATUS_RESPONSE=$(curl -s http://localhost:3000/api/device/room1/status)
STATUS_SUCCESS=$(echo $STATUS_RESPONSE | grep -o '"deviceId":"room1"' || echo "")

if [ -n "$STATUS_SUCCESS" ]; then
    echo -e "${GREEN}✅ Device API working${NC}"
    echo "Device initialized: room1"
else
    echo -e "${RED}❌ Device API failed${NC}"
fi

# Summary
echo ""
echo "=================================="
echo "📊 Summary"
echo "=================================="
echo ""
echo "🌐 Web Interface: http://localhost:3000"
echo "🔐 Login PIN: 1234 (default)"
echo ""
echo "📋 Test Endpoints:"
echo "  - Redis: http://localhost:3000/api/test/redis"
echo "  - MQTT:  http://localhost:3000/api/test/mqtt"
echo "  - Device: http://localhost:3000/api/device/room1/status"
echo ""
echo -e "${YELLOW}💡 Tip: Open http://localhost:3000 in your browser${NC}"
echo ""

# Keep server running
echo "Server running with PID: $DEV_PID"
echo "Press Ctrl+C to stop..."
wait $DEV_PID
