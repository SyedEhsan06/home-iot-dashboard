import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    // Test Redis connection
    await redis.set('test:connection', 'OK');
    const result = await redis.get('test:connection');
    
    return NextResponse.json({
      success: true,
      message: 'Redis connection successful',
      result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Redis test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
