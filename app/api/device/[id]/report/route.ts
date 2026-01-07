import { NextRequest, NextResponse } from 'next/server';
import { setReportedState, type ReportedState } from '@/lib/redis';
import { redis } from '@/lib/redis';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;
    const body = await request.json();

    // Support multiple formats from ESP8266:
    // Format 1: { relays: { "1": true, ... } }
    // Format 2: { device: "room1", status: "applied", relays: { ... }, ip: "...", uptime: 123 }
    const relays = body.relays || {};

    // Validate input
    if (typeof relays !== 'object') {
      return NextResponse.json(
        { error: 'Invalid relays data' },
        { status: 400 }
      );
    }

    // Create reported state with current timestamp
    const reportedState: ReportedState = {
      relays,
      lastSeen: Date.now(),
    };

    // Update Redis with reported state
    await setReportedState(deviceId, reportedState);

    // Always store device info (IP, uptime, status)
    const deviceInfoData: any = {
      lastReport: Date.now(),
    };
    
    if (body.ip) deviceInfoData.ip = body.ip;
    if (body.uptime !== undefined) deviceInfoData.uptime = body.uptime;
    if (body.status) deviceInfoData.status = body.status;
    
    await redis.set(`device:${deviceId}:info`, deviceInfoData);
    
    // Set device as online for 5 minutes (MQTT-based approach)
    await redis.setex(`device:${deviceId}:online`, 300, 'true');
    
    console.log(`✅ Device ${deviceId} reported - Uptime: ${body.uptime}s, Online: true`);

    return NextResponse.json({ 
      ok: true,
      message: 'State reported successfully',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
