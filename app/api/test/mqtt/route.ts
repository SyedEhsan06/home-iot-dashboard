import { NextResponse } from 'next/server';
import { getMqttClient, publishDesiredState } from '@/lib/mqtt';

export async function GET() {
  try {
    const client = getMqttClient();
    
    // Check if client is connected
    const isConnected = client.connected;
    
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          message: 'MQTT client not connected. Check your .env configuration.',
          config: {
            broker: process.env.MQTT_BROKER || 'NOT SET',
            port: process.env.MQTT_PORT || 'NOT SET',
            username: process.env.MQTT_USERNAME ? '***' : 'NOT SET',
            password: process.env.MQTT_PASSWORD ? '***' : 'NOT SET',
          },
        },
        { status: 500 }
      );
    }

    // Test publish
    const testState = {
      relays: {
        '1': true,
        '2': false,
        '3': false,
        '4': false,
      },
      version: 999,
      updatedAt: Date.now(),
    };

    await publishDesiredState('test-device', testState);

    return NextResponse.json({
      success: true,
      connected: true,
      message: 'MQTT connection successful! Published test message to home/test-device/desired',
      config: {
        broker: process.env.MQTT_BROKER,
        port: process.env.MQTT_PORT,
        protocol: 'mqtts',
      },
      testPublished: testState,
    });
  } catch (error) {
    console.error('MQTT test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Make sure to configure MQTT_BROKER, MQTT_PORT, MQTT_USERNAME, and MQTT_PASSWORD in your .env file',
      },
      { status: 500 }
    );
  }
}
