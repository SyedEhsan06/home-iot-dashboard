import { NextRequest } from 'next/server';
import {
  getDesiredState,
  getReportedState,
  isDeviceOnline,
  initializeDevice,
} from '@/lib/redis';
import { getMqttClient } from '@/lib/mqtt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: deviceId } = await params;
  
  // Ensure device is initialized
  await initializeDevice(deviceId);

  // Initialize MQTT client to listen for updates in the background
  getMqttClient();

  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendStatus = async () => {
        if (isClosed) return;
        try {
          const { getDeviceNames } = await import('@/lib/redis');
          const [desired, reported, online, names] = await Promise.all([
            getDesiredState(deviceId),
            getReportedState(deviceId),
            isDeviceOnline(deviceId),
            getDeviceNames(deviceId),
          ]);
          
          const data = {
            deviceId,
            desired,
            reported,
            online,
            names,
            lastSeen: reported?.lastSeen || null,
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (error) {
          console.error('SSE Error:', error);
        }
      };

      // Send immediately on connect
      await sendStatus();
      
      // Poll every 3 seconds on the server
      const interval = setInterval(sendStatus, 3000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(interval);
      });
    },
    cancel() {
      isClosed = true;
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
