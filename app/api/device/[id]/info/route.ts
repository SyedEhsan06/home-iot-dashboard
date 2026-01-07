import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;

    // Get device info from Redis
    const deviceInfo = await redis.get<{
      ip?: string;
      uptime?: number;
      lastReport?: number;
    }>(`device:${deviceId}:info`);

    return NextResponse.json({
      deviceId,
      ...deviceInfo,
    });
  } catch (error) {
    console.error('Device info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;
    const { ip, uptime } = await request.json();

    // Store device info in Redis
    await redis.set(`device:${deviceId}:info`, {
      ip,
      uptime,
      lastReport: Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Device info update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
