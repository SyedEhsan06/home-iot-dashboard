import { NextRequest, NextResponse } from 'next/server';
import { setDeviceName } from '@/lib/redis';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;
    const { relayId, name } = await request.json();

    if (!relayId || !name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid relayId or name' },
        { status: 400 }
      );
    }

    if (name.trim().length === 0 || name.length > 30) {
      return NextResponse.json(
        { error: 'Name must be between 1 and 30 characters' },
        { status: 400 }
      );
    }

    await setDeviceName(deviceId, relayId.toString(), name.trim());

    return NextResponse.json({
      success: true,
      message: 'Name updated successfully',
    });
  } catch (error) {
    console.error('❌ Error updating device name:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
