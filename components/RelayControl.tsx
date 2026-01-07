'use client';

import { useState } from 'react';

interface Relay {
  id: number;
  name: string;
  state: boolean;
}

interface RelayControlProps {
  relays: Relay[];
  deviceId: string;
  online: boolean;
  onUpdate: () => void;
}

export default function RelayControl({
  relays,
  deviceId,
  online,
  onUpdate,
}: RelayControlProps) {
  const [loading, setLoading] = useState<number | null>(null);

  const handleToggle = async (relay: Relay) => {
    if (loading !== null) return; // Only disable during loading

    setLoading(relay.id);

    try {
      const response = await fetch(`/api/device/${deviceId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          relay: relay.id,
          state: !relay.state,
        }),
      });

      if (response.ok) {
        // Wait a moment for state to propagate
        setTimeout(onUpdate, 500);
      } else {
        console.error('Failed to toggle relay');
      }
    } catch (error) {
      console.error('Error toggling relay:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {relays.map((relay) => (
        <div
          key={relay.id}
          className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
            relay.state
              ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50 shadow-xl shadow-blue-500/20'
              : 'bg-gray-900/50 border-gray-700'
          } ${
            loading !== null
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
          }`}
          onClick={() => handleToggle(relay)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                  relay.state
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50'
                    : 'bg-gray-800'
                }`}
              >
                {loading === relay.id ? (
                  <svg
                    className="animate-spin h-6 w-6 text-white"
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
                ) : (
                  <svg
                    className={`w-7 h-7 transition-all ${
                      relay.state ? 'text-white' : 'text-gray-500'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {relay.name}
                </h3>
                <p className={`text-sm font-semibold ${
                  relay.state ? 'text-blue-400' : 'text-gray-500'
                }`}>
                  {relay.state ? '● ON' : '○ OFF'}
                </p>
              </div>
            </div>

            {loading !== relay.id && (
              <div
                className={`relative inline-flex h-10 w-18 items-center rounded-full transition-colors ${
                  relay.state ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform shadow-lg ${
                    relay.state ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
