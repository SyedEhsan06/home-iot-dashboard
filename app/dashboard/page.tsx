'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RelayControl from '@/components/RelayControl';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogOut, Activity, Wifi, Server, Sparkles } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';

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

const DEVICE_ID = 'room1'; // Default device

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

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
        // If names exist in stream data, we can use them later. For now default:
        name: (status as any).names?.[id] || `Relay ${id}`, 
        state,
      }))
    : [];

  const timeSince = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (!status) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-8 relative overflow-hidden transition-colors duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background transition-colors duration-500" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary blur-3xl opacity-20 rounded-full animate-pulse" />
            <div className="bg-card/80 p-6 rounded-3xl border border-border shadow-2xl backdrop-blur-xl">
              <Activity className="w-12 h-12 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium tracking-wide mt-6 animate-pulse">Syncing Network...</p>
        </div>
      </div>
    );
  }

  const isDark = mounted ? theme === 'dark' : true;

  const handlePing = async () => {
    try {
      toast.info('Pinging device...', { description: 'Waiting for response.' });
      await fetch(`/api/device/${DEVICE_ID}/ping`, { method: 'POST' });
    } catch (err) {
      toast.error('Failed to ping device');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans selection:bg-primary/30 transition-colors duration-500">
      
      {/* Background Meshes / Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />
      
      <Toaster theme={isDark ? "dark" : "light"} position="bottom-right" />
      
      <div className="container mx-auto px-4 py-12 max-w-5xl relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-primary mb-4 shadow-sm backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Smart Home
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
              Command Center
            </h1>
            <p className="text-muted-foreground text-lg">Control your environment in real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="rounded-xl border-border bg-card/50 hover:bg-accent text-foreground backdrop-blur-md transition-all hover:scale-105 active:scale-95"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 backdrop-blur-xl border border-destructive/20 rounded-2xl p-4 mb-8 text-sm text-destructive flex items-center shadow-lg shadow-destructive/5">
            <Activity className="w-5 h-5 mr-3 animate-pulse" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Premium Device Overview Card */}
        <Card className="bg-card/60 backdrop-blur-2xl border-border rounded-[2rem] mb-12 overflow-hidden relative shadow-xl transition-colors duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-400 to-primary opacity-80" />
          
          <CardHeader className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-background/50 rounded-2xl border border-border shadow-inner">
                  <Server className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                      {DEVICE_ID.toUpperCase()}
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePing}
                      className="h-7 rounded-lg text-xs border-border bg-background/50 hover:bg-muted"
                    >
                      Ping
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={`px-3 py-1 border-0 backdrop-blur-md ${
                        status.online 
                          ? "bg-green-500/20 text-green-600 dark:text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]" 
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {status.online ? (
                        <><Wifi className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> Online</>
                      ) : (
                        <><Wifi className="w-3.5 h-3.5 mr-1.5" /> Offline</>
                      )}
                    </Badge>
                    <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                      Last ping: {timeSince(status.lastSeen)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="sm:text-right bg-background/50 px-6 py-4 rounded-2xl border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Active Circuits</p>
                <div className="flex items-baseline sm:justify-end gap-1">
                  <span className="text-3xl font-bold">{relays.filter(r => r.state).length}</span>
                  <span className="text-xl font-medium text-muted-foreground">/ {relays.length}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Relays Grid */}
        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-2xl font-bold tracking-tight">
            Devices
          </h2>
        </div>

        {relays.length > 0 ? (
          <RelayControl
            relays={relays}
            deviceId={DEVICE_ID}
            online={status.online}
          />
        ) : (
          <div className="bg-card/60 backdrop-blur-2xl border border-border rounded-[2rem] p-16 flex flex-col items-center justify-center text-center shadow-xl">
            <div className="bg-background/50 p-6 rounded-full mb-6 border border-border">
              <Server className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Devices Found</h3>
            <p className="text-muted-foreground max-w-sm">There are no relays configured for this hub yet. Please check your device configuration.</p>
          </div>
        )}
      </div>
    </div>
  );
}
