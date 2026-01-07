import { NextRequest, NextResponse } from 'next/server';
import {
  getDesiredState,
  getReportedState,
  isDeviceOnline,
  initializeDevice,
} from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;

    // Initialize device if not exists
    await initializeDevice(deviceId);

    // Get states
    const [desired, reported, online] = await Promise.all([
      getDesiredState(deviceId),
      getReportedState(deviceId),
      isDeviceOnline(deviceId),
    ]);

    return NextResponse.json({
      deviceId,
      desired,
      reported,
      online,
      lastSeen: reported?.lastSeen || null,
    });
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
