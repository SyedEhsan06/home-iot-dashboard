import mqtt from 'mqtt';
import type { DesiredState } from './redis';
import { setReportedState } from './redis';
import { redis } from './redis';

let client: mqtt.MqttClient | null = null;

// MQTT connection options
const options: mqtt.IClientOptions = {
  host: process.env.MQTT_BROKER,
  port: Number(process.env.MQTT_PORT) || 8883,
  protocol: 'mqtts',
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  rejectUnauthorized: true,
  reconnectPeriod: 5000,
};

// Initialize MQTT client (singleton)
export function getMqttClient(): mqtt.MqttClient {
  if (!client) {
    client = mqtt.connect(options);

    client.on('connect', () => {
      console.log('✅ MQTT connected to HiveMQ Cloud');
      // Subscribe to all reported topics
      client?.subscribe('home/+/reported', { qos: 1 }, (err) => {
        if (err) {
          console.error('❌ Failed to subscribe to reported topics:', err);
        } else {
          console.log('✅ Subscribed to device reported topics');
        }
      });
    });

    client.on('message', async (topic: string, message: Buffer) => {
      try {
        // Handle reported messages from devices
        if (topic.endsWith('/reported')) {
          const deviceId = topic.split('/')[1]; // Extract device ID from topic
          const payload = JSON.parse(message.toString());
          
          console.log(`📡 MQTT report from ${deviceId}:`, payload);
          
          // Update reported state in Redis, preserving relays if omitted in heartbeat
          const existingReported = await redis.get(`device:${deviceId}:reported`) as any;
          await setReportedState(deviceId, {
            relays: payload.relays || existingReported?.relays || {},
            lastSeen: Date.now(),
          });
          
          // Update device info with last report timestamp
          const deviceInfoData: any = {
            lastReport: Date.now(),
          };
          
          if (payload.ip) deviceInfoData.ip = payload.ip;
          if (payload.uptime !== undefined) deviceInfoData.uptime = payload.uptime;
          if (payload.status) deviceInfoData.status = payload.status;
          
          await redis.set(`device:${deviceId}:info`, deviceInfoData);
          
          console.log(`✅ Device ${deviceId} MQTT report processed - Last report updated`);
        }
      } catch (error) {
        console.error('❌ Error processing MQTT message:', error);
      }
    });

    client.on('error', (error: Error) => {
      console.error('❌ MQTT error:', error.message);
    });

    client.on('reconnect', () => {
      console.log('🔄 MQTT reconnecting...');
    });

    client.on('close', () => {
      console.log('🔌 MQTT connection closed');
    });
  }

  return client;
}

// Publish desired state to device
export function publishDesiredState(deviceId: string, state: DesiredState): Promise<void> {
  return new Promise((resolve, reject) => {
    const mqttClient = getMqttClient();
    const topic = `home/${deviceId}/desired`;
    const payload = JSON.stringify(state);

    mqttClient.publish(topic, payload, { qos: 1, retain: true }, (error?: Error) => {
      if (error) {
        console.error(`❌ Failed to publish to ${topic}:`, error);
        reject(error);
      } else {
        console.log(`✅ Published to ${topic}:`, payload);
        resolve();
      }
    });
  });
}

// Subscribe to reported state from device
// Note: We keep this for compatibility, but the main getMqttClient() 
// already handles incoming messages and updates Redis automatically.
export function subscribeToReported(deviceId: string, callback: (state: any) => void): void {
  const mqttClient = getMqttClient();
  const topic = `home/${deviceId}/reported`;

  mqttClient.subscribe(topic, { qos: 1 }, (error: Error | null) => {
    if (error) {
      console.error(`❌ Failed to subscribe to ${topic}:`, error);
    } else {
      console.log(`✅ Subscribed to ${topic}`);
    }
  });

  // Check if we already added a listener for this specific topic and callback
  // To avoid memory leak, we attach only one global listener in getMqttClient
  // which updates Redis. The callback here is mostly for real-time scripts
  // We'll use a Set to track if we've added a listener to avoid stacking
  if (!(mqttClient as any)._hasReportedListener) {
    (mqttClient as any)._hasReportedListener = true;
    mqttClient.on('message', (receivedTopic: string, message: Buffer) => {
      if (receivedTopic.endsWith('/reported')) {
        try {
          const state = JSON.parse(message.toString());
          callback(state);
        } catch (error) {
          console.error('❌ Failed to parse MQTT message:', error);
        }
      }
    });
  }
}

// Close MQTT connection
export function closeMqttConnection(): void {
  if (client) {
    client.end();
    client = null;
    console.log('🔌 MQTT client closed');
  }
}
