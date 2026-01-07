#!/bin/bash

# Test script to simulate ESP8266 heartbeat
# This mimics what your ESP8266 sends every 10 seconds

echo "🧪 Testing ESP8266 Heartbeat Simulation"
echo "========================================"
echo ""

# Backend URL
API_URL="http://localhost:3000"

# Send heartbeat (simulate ESP8266)
echo "📡 Sending heartbeat..."
RESPONSE=$(curl -s -X POST "$API_URL/api/device/room1/report" \
  -H "Content-Type: application/json" \
  -d '{
    "relays": {
      "1": false,
      "2": false,
      "3": false,
      "4": false
    },
    "device": "room1",
    "uptime": 123,
    "status": "online"
  }')

echo "Response: $RESPONSE"
echo ""

# Check status
echo "📊 Checking device status..."
STATUS=$(curl -s "$API_URL/api/device/room1/status")
echo "$STATUS" | jq '.'
echo ""

# Extract and display key info
ONLINE=$(echo "$STATUS" | jq -r '.online')
LAST_SEEN=$(echo "$STATUS" | jq -r '.lastSeen')

echo "========================================"
echo "✅ Device Online: $ONLINE"
echo "🕒 Last Seen: $LAST_SEEN"
echo ""

if [ "$ONLINE" = "true" ]; then
  echo "✨ SUCCESS! Device is showing as ONLINE"
else
  echo "❌ FAILED! Device still showing as OFFLINE"
  echo ""
  echo "Debug: Check your backend logs for the Redis check output"
fi
