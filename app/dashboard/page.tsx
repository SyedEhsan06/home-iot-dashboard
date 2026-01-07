'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RelayControl from '@/components/RelayControl';

interface Relay {
  id: number;
  name: string;
  state: boolean;
}

interface DeviceStatus {
  deviceId: string;
  desired: {
    relays: Record<string, boolean>;
    version: number;
    updatedAt: number;
  } | null;
  reported: {
    relays: Record<string, boolean>;
    lastSeen: number;
  } | null;
  online: boolean;
  lastSeen: number | null;
}

interface DeviceInfo {
  ip?: string;
  uptime?: number;
  lastReport?: number;
  status?: string;
}

const DEVICE_ID = 'room1'; // Default device

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    try {
      const [statusRes, infoRes] = await Promise.all([
        fetch(`/api/device/${DEVICE_ID}/status`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch(`/api/device/${DEVICE_ID}/info`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        console.log('📊 Status update:', {
          online: data.online,
          lastSeen: data.lastSeen ? new Date(data.lastSeen).toLocaleTimeString() : 'Never',
          timeSince: data.lastSeen ? `${Math.floor((Date.now() - data.lastSeen) / 1000)}s ago` : 'N/A'
        });
        setStatus(data);
        setError('');
      } else {
        setError('Failed to fetch device status');
      }

      if (infoRes.ok) {
        const info = await infoRes.json();
        setDeviceInfo(info);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchStatus, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const relays: Relay[] = status?.desired
    ? Object.entries(status.desired.relays).map(([id, state]) => ({
        id: Number(id),
        name: `Relay ${id}`,
        state,
      }))
    : [];

  const formatLastSeen = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 rounded-full mb-6">
            <svg
              className="animate-spin h-12 w-12 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-gray-300 text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Home IoT Control
            </h1>
            <p className="text-gray-400 text-lg">Manage your smart devices</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 border border-gray-700 hover:border-gray-600 shadow-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>

        {/* Device Status Card */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  status?.online
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/50'
                    : 'bg-gradient-to-br from-red-500 to-rose-500 shadow-lg shadow-red-500/50'
                }`}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Device: {DEVICE_ID}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      status?.online
                        ? 'bg-green-500 animate-pulse'
                        : status?.reported?.lastSeen
                        ? 'bg-yellow-500'
                        : 'bg-gray-500'
                    }`}
                  />
                  <p className="text-sm font-medium text-gray-300">
                    {status?.online
                      ? 'Online (MQTT Active)'
                      : status?.reported?.lastSeen
                      ? 'Offline (MQTT Inactive)'
                      : 'Waiting for MQTT connection'
                    }
                  </p>
                </div>
                
                {status?.reported?.lastSeen && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last seen: {new Date(status.reported.lastSeen).toLocaleTimeString()}
                    {' '}
                    ({Math.floor((Date.now() - status.reported.lastSeen) / 1000)}s ago)
                  </p>
                )}
                
                {!status?.online && !status?.reported?.lastSeen && (
                  <p className="text-xs text-gray-500 mt-1">
                    Click a relay to send MQTT command and establish connection
                  </p>
                )}
                
                {deviceInfo?.ip && (
                  <p className="text-sm text-gray-400 mt-1 font-mono">
                    IP: {deviceInfo.ip}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              {deviceInfo?.uptime && (
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                  <p className="text-sm text-gray-400 mb-1">Uptime</p>
                  <p className="text-xl font-bold text-white">
                    {Math.floor(deviceInfo.uptime / 60)}m
                  </p>
                </div>
              )}
             
            </div>
          </div>
        </div>

        {/* Debug Info Panel */}
        {status && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8">
            <h3 className="text-sm font-bold text-blue-400 mb-2">🔍 Connection Debug Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-gray-500">Online Status:</span>
                <span className={`ml-2 font-bold ${status.online ? 'text-green-400' : 'text-red-400'}`}>
                  {status.online ? '✅ ONLINE' : '❌ OFFLINE'}
                </span>
              </div>
             
              <div>
                <span className="text-gray-500">Time Since:</span>
                <span className="ml-2 text-white">
                  {status.lastSeen ? `${Math.floor((Date.now() - status.lastSeen) / 1000)}s` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Desired Ver:</span>
                <span className="ml-2 text-white">{status.desired?.version ?? 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Has Reported:</span>
                <span className="ml-2 text-white">{status.reported ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="text-gray-500">Uptime:</span>
                <span className="ml-2 text-white">{deviceInfo?.uptime ? `${deviceInfo.uptime}s` : 'N/A'}</span>
              </div>
            </div>
            {deviceInfo?.ip && (
              <div className="mt-2 text-xs">
                <span className="text-gray-500">Device IP:</span>
                <a 
                  href={`http://${deviceInfo.ip}/status`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-400 hover:text-blue-300 underline"
                >
                  {deviceInfo.ip}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 mb-8">
            <div className="flex items-center space-x-3">
              <svg
                className="w-6 h-6 text-red-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Relay Controls */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 md:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">Relay Controls</h2>
            <div className="bg-gray-900/50 rounded-lg px-4 py-2 border border-gray-700/50">
              <span className="text-sm text-gray-400">Total: </span>
              <span className="text-lg font-bold text-blue-400">{relays.length}</span>
            </div>
          </div>
          {relays.length > 0 ? (
            <RelayControl
              relays={relays}
              deviceId={DEVICE_ID}
              online={status?.online || false}
              onUpdate={fetchStatus}
            />
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-900/50 rounded-full mb-4">
                <svg
                  className="w-10 h-10 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <p className="text-gray-400 text-lg">No relays configured</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-blue-400 font-semibold text-lg mb-2">
                MQTT Status Detection
              </h3>
              <p className="text-gray-400 mb-4">
                Device status is detected via MQTT messages. Send a command to establish
                connection. Device stays "Online" for 5 minutes after last activity.
                Status updates automatically every 3 seconds.
              </p>

              {/* Debug Info */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Debug Information:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Online Status:</span>
                    <span className={`ml-2 font-mono ${status?.online ? 'text-green-400' : 'text-red-400'}`}>
                      {status?.online ? 'true' : 'false'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Seen:</span>
                    <span className="ml-2 font-mono text-gray-300">
                      {status?.reported?.lastSeen
                        ? new Date(status.reported.lastSeen).toLocaleString()
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Report:</span>
                    <span className="ml-2 font-mono text-gray-300">
                      {deviceInfo?.lastReport
                        ? new Date(deviceInfo.lastReport).toLocaleString()
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Time Since Report:</span>
                    <span className="ml-2 font-mono text-gray-300">
                      {deviceInfo?.lastReport
                        ? `${Math.floor((Date.now() - deviceInfo.lastReport) / 1000)}s ago`
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Device IP:</span>
                    <span className="ml-2 font-mono text-gray-300">
                      {deviceInfo?.ip || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Uptime:</span>
                    <span className="ml-2 font-mono text-gray-300">
                      {deviceInfo?.uptime ? `${Math.floor(deviceInfo.uptime / 60)}m ${deviceInfo.uptime % 60}s` : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-mono text-gray-300">
                      {deviceInfo?.status || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
