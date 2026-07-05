'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RelayControl from '@/components/RelayControl';
import { EnvironmentHero } from '@/components/EnvironmentHero';
import { LiveAudioPanel } from '@/components/LiveAudioPanel';
import { SensorGrid } from '@/components/SensorGrid';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Activity, LogOut, Settings, RefreshCw, Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

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
    temperature?: number;
    humidity?: number;
    lux?: number;
    audioActive?: boolean;
    lastSeen: number;
  } | null;
  online: boolean;
  lastSeen: number | null;
}

const DEVICE_ID = 'room1';

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  
  const handlePing = async () => {
    setIsPinging(true);
    try {
      const res = await fetch(`/api/device/${DEVICE_ID}/ping`, { method: 'POST' });
      if (res.ok) {
        toast.success('Ping sent successfully', { className: 'bg-card text-card-foreground border-border' });
      } else {
        toast.error('Failed to send ping');
      }
    } catch (err) {
      toast.error('Error sending ping');
    } finally {
      setIsPinging(false);
    }
  };
  useEffect(() => {
    // Force dark theme as requested for the premium look
    if (theme !== 'dark') {
      document.documentElement.classList.add('dark');
    }
    setMounted(true);
  }, [theme]);

  // Real-time SSE Connection
  useEffect(() => {
    const eventSource = new EventSource(`/api/device/${DEVICE_ID}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStatus(data);
        setError('');
      } catch (err) {
        console.error('Failed to parse SSE data', err);
      }
    };

    eventSource.onerror = () => {
      setError('Connection lost. Reconnecting...');
    };

    return () => {
      eventSource.close();
    };
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
        name: (status as any).names?.[id] || `Relay ${id}`, 
        state,
      }))
    : [];

  if (!status) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-8">
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-card/80 p-6 rounded-3xl border shadow-2xl">
            <Activity className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground font-medium tracking-wide mt-6 animate-pulse">Syncing Network...</p>
        </div>
      </div>
    );
  }

  const reported = status.reported;
  // Mock data for display if not provided by backend yet
  const temperature = reported?.temperature ?? 24.6;
  const humidity = reported?.humidity ?? 45;
  const lux = reported?.lux ?? 320;
  const audioActive = reported?.audioActive ?? false;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-12 selection:bg-primary/30">
      <Toaster theme="dark" position="top-center" />
      
      {/* Top Header - Visible on all screens */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Ehsan's Room Logo" className="w-8 h-8 rounded-[10px] shadow-sm shadow-primary/20" />
            <h1 className="text-xl font-bold tracking-tight">Ehsan's Room</h1>
            <div className={`w-2 h-2 rounded-full ${status.online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePing} disabled={isPinging} className="rounded-full" title="Ping Device">
              {isPinging ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <RefreshCw className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full">
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6 max-w-7xl">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 mb-6 text-sm text-destructive flex items-center">
            <Activity className="w-5 h-5 mr-3 animate-pulse" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* 12-Column Desktop Grid / Single-Column Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* LEFT / MAIN COLUMN (Environment, Sensors, Devices) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            
            <EnvironmentHero 
              temperature={temperature}
              humidity={humidity}
              lux={lux}
              lastUpdated={status.lastSeen}
              online={status.online}
            />

            <SensorGrid 
              temperature={temperature}
              humidity={humidity}
              lux={lux}
              online={status.online}
            />

            <div>
              <h2 className="text-xl font-bold tracking-tight mb-4 mt-2">Devices</h2>
              {relays.length > 0 ? (
                <RelayControl
                  relays={relays}
                  deviceId={DEVICE_ID}
                  online={status.online}
                />
              ) : (
                <div className="bg-card/40 border rounded-[2rem] p-12 text-center">
                  <p className="text-muted-foreground">No devices configured.</p>
                </div>
              )}
            </div>
            
          </div>

          {/* RIGHT COLUMN (Audio, Activity) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
            
            <LiveAudioPanel 
              online={status.online}
              audioActive={audioActive}
            />

            {/* Activity/Events Section */}
            <div className="bg-card/40 border rounded-[2.5rem] p-6 lg:sticky lg:top-24">
              <h3 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-muted-foreground" />
                Recent Activity
              </h3>
              
              <div className="space-y-6">
                {[
                  { title: 'ESP32 Connected', time: 'Just now', type: 'system' },
                  { title: 'Relay 1 turned ON', time: '5m ago', type: 'device' },
                  { title: 'Room conditions updated', time: '12m ago', type: 'sensor' },
                  { title: 'Audio session ended', time: '1h ago', type: 'audio' },
                ].map((event, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    {/* Timeline line */}
                    {idx !== 3 && <div className="absolute left-2.5 top-8 bottom-[-16px] w-px bg-border" />}
                    
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 z-10 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
