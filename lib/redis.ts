import { Redis } from '@upstash/redis';

// Initialize Redis client
export const redis = Redis.fromEnv();

// Types for device state
export interface RelayState {
  '1': boolean;
  '2': boolean;
  '3': boolean;
  '4': boolean;
}

export interface DesiredState {
  relays: RelayState;
  version: number;
  updatedAt: number;
}

export interface ReportedState {
  relays: RelayState;
  lastSeen: number;
}

// Redis key helpers
export const keys = {
  desired: (deviceId: string) => `device:${deviceId}:desired`,
  reported: (deviceId: string) => `device:${deviceId}:reported`,
};

// Get desired state
export async function getDesiredState(deviceId: string): Promise<DesiredState | null> {
  return await redis.get<DesiredState>(keys.desired(deviceId));
}

// Set desired state
export async function setDesiredState(deviceId: string, state: DesiredState): Promise<void> {
  await redis.set(keys.desired(deviceId), state);
}

// Get reported state
export async function getReportedState(deviceId: string): Promise<ReportedState | null> {
  return await redis.get<ReportedState>(keys.reported(deviceId));
}

// Set reported state
export async function setReportedState(deviceId: string, state: ReportedState): Promise<void> {
  await redis.set(keys.reported(deviceId), state);
}

// Update single relay in desired state
export async function updateRelay(
  deviceId: string,
  relayId: keyof RelayState,
  state: boolean
): Promise<DesiredState> {
  const currentState = await getDesiredState(deviceId);
  
  const newState: DesiredState = currentState
    ? {
        ...currentState,
        relays: {
          ...currentState.relays,
          [relayId]: state,
        },
        version: currentState.version + 1,
        updatedAt: Date.now(),
      }
    : {
        relays: {
          '1': false,
          '2': false,
          '3': false,
          '4': false,
          [relayId]: state,
        },
        version: 1,
        updatedAt: Date.now(),
      };

  await setDesiredState(deviceId, newState);
  return newState;
}

// Check if device is online (has active online status or recent report)
export async function isDeviceOnline(deviceId: string): Promise<boolean> {
  try {
    // First check if device has active online status (MQTT-based)
    const onlineStatus = await redis.get(`device:${deviceId}:online`);
    if (onlineStatus === 'true') {
      console.log(`🔍 Device ${deviceId}: Online (MQTT active)`);
      return true;
    }

    // Fallback: check if device reported recently (within 2 minutes)
    const reported = await getReportedState(deviceId);
    if (reported && reported.lastSeen) {
      const now = Date.now();
      const threshold = 2 * 60 * 1000; // 2 minutes
      const timeSince = now - reported.lastSeen;
      
      const isOnline = timeSince < threshold;
      console.log(`🔍 Device ${deviceId}: Last seen ${timeSince}ms ago, Online: ${isOnline}`);
      return isOnline;
    }

    console.log(`🔍 Device ${deviceId}: Offline (no recent activity)`);
    return false;
  } catch (error) {
    console.error(`Error checking device online status:`, error);
    return false;
  }
}

// Initialize device with default state if not exists
export async function initializeDevice(deviceId: string): Promise<void> {
  const desired = await getDesiredState(deviceId);
  
  if (!desired) {
    const defaultState: DesiredState = {
      relays: {
        '1': false,
        '2': false,
        '3': false,
        '4': false,
      },
      version: 0,
      updatedAt: Date.now(),
    };
    
    await setDesiredState(deviceId, defaultState);
  }
}
