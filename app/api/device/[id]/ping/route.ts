import { NextRequest, NextResponse } from 'next/server';
import { getDesiredState, initializeDevice } from '@/lib/redis';
import { publishDesiredState } from '@/lib/mqtt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;
    
    // Ensure initialized
    await initializeDevice(deviceId);

    // Get current desired state
    const desiredState = await getDesiredState(deviceId);
    
    if (!desiredState) {
      return NextResponse.json({ error: 'Device state not found' }, { status: 404 });
    }

    console.log(`📡 Sending ping (re-publishing state) to Device ${deviceId}`);

    // Publish to MQTT to force the device to reply with its reported state
    try {
      await publishDesiredState(deviceId, desiredState);
    } catch (mqttError) {
      console.error('⚠️  MQTT publish failed during ping:', mqttError);
    }

    return NextResponse.json({
      success: true,
      message: 'Ping sent successfully',
    });
  } catch (error) {
    console.error('❌ Ping error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
