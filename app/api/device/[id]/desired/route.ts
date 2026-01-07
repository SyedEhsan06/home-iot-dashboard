import { NextRequest, NextResponse } from 'next/server';
import { getDesiredState, initializeDevice } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;

    // Initialize device if not exists
    await initializeDevice(deviceId);

    // Get desired state
    const desired = await getDesiredState(deviceId);

    if (!desired) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(desired);
  } catch (error) {
    console.error('Desired state error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
