/**
 * MQTT Listener - Server-side background process
 * This listens to device reports and updates Redis automatically
 * 
 * To run: node lib/mqtt-listener.js
 * Or add to your deployment as a background service
 */

import { getMqttClient, subscribeToReported } from './mqtt';
import { setReportedState, type ReportedState } from './redis';

const DEVICE_ID = 'room1';

console.log('🚀 Starting MQTT Listener...');
console.log(`📡 Device ID: ${DEVICE_ID}`);
console.log(`📍 Topic: home/${DEVICE_ID}/reported`);

// Initialize MQTT client
const client = getMqttClient();

// Subscribe to device reports
subscribeToReported(DEVICE_ID, async (data) => {
  console.log('📥 Received report from device:', data);

  try {
    // Extract relay states from the report
    // ESP8266 might send different formats, handle both
    let relays = data.relays;

    if (!relays && data.device === DEVICE_ID) {
      // If relays not in data, try to read current state
      console.log('⚠️  No relays in report, using status field');
      return;
    }

    // Update Redis with reported state
    const reportedState: ReportedState = {
      relays: relays || {
        '1': false,
        '2': false,
        '3': false,
        '4': false,
      },
      lastSeen: Date.now(),
    };

    await setReportedState(DEVICE_ID, reportedState);
    console.log('✅ Updated Redis with reported state');
  } catch (error) {
    console.error('❌ Error processing device report:', error);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MQTT listener...');
  client.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down MQTT listener...');
  client.end();
  process.exit(0);
});

console.log('✅ MQTT Listener started successfully');
console.log('Press Ctrl+C to stop');
