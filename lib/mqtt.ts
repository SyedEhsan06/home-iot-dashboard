import mqtt from 'mqtt';
import type { DesiredState } from './redis';

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

  mqttClient.on('message', (receivedTopic: string, message: Buffer) => {
    if (receivedTopic === topic) {
      try {
        const state = JSON.parse(message.toString());
        callback(state);
      } catch (error) {
        console.error('❌ Failed to parse MQTT message:', error);
      }
    }
  });
}

// Close MQTT connection
export function closeMqttConnection(): void {
  if (client) {
    client.end();
    client = null;
    console.log('🔌 MQTT client closed');
  }
}
