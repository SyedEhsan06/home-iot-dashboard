import { NextRequest, NextResponse } from 'next/server';
import { 
  updateRelay, 
  getDesiredState,
  type RelayState 
} from '@/lib/redis';
import { publishDesiredState } from '@/lib/mqtt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;
    const { relay, state } = await request.json();

    // Validate input
    if (!relay || typeof state !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid relay or state' },
        { status: 400 }
      );
    }

    const relayId = relay.toString() as keyof RelayState;
    if (!['1', '2', '3', '4'].includes(relayId.toString())) {
      return NextResponse.json(
        { error: 'Invalid relay ID. Must be 1-4' },
        { status: 400 }
      );
    }

    console.log(`📡 Command received: Device ${deviceId}, Relay ${relayId}, State ${state}`);

    // Step 1: Update Redis desired state
    const desiredState = await updateRelay(deviceId, relayId, state);
    console.log(`✅ Redis updated:`, desiredState);

    // Step 2: Publish to MQTT (ESP8266 listens to this)
    try {
      await publishDesiredState(deviceId, desiredState);
      console.log(`✅ MQTT published to home/${deviceId}/desired`);
    } catch (mqttError) {
      console.error('⚠️  MQTT publish failed (device can still poll):', mqttError);
      // Continue even if MQTT fails - device can poll /desired endpoint
    }

    // Step 3: Return the new desired state
    return NextResponse.json({
      success: true,
      desired: desiredState,
      message: 'Command sent successfully',
    });
  } catch (error) {
    console.error('❌ Command error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
