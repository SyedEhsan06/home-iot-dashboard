'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Radio, Square, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LiveAudioPanelProps {
  online: boolean;
  audioActive?: boolean; // From backend stream
}

export function LiveAudioPanel({ online, audioActive = false }: LiveAudioPanelProps) {
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [duration, setDuration] = useState(0);

  // Simulate duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleListen = () => {
    if (!isListening) {
      setIsConnecting(true);
      // Simulate connection delay
      setTimeout(() => {
        setIsConnecting(false);
        setIsListening(true);
      }, 1500);
    } else {
      setIsListening(false);
      setIsConnecting(false);
    }
  };

  return (
    <Card className={`relative overflow-hidden rounded-[2.5rem] border transition-all duration-500 ${isListening ? 'bg-card border-primary/40 shadow-xl shadow-primary/10' : 'bg-card/60 border-border'}`}>
      
      {/* Background glow when active */}
      {isListening && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 blur-xl pointer-events-none" />
      )}

      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl transition-colors duration-500 ${isListening ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg tracking-tight">Live Room Audio</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {!online ? (
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1"><Radio className="w-3 h-3" /> Offline</span>
                ) : isConnecting ? (
                  <span className="text-xs text-primary font-medium uppercase tracking-wider flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Connecting...</span>
                ) : isListening ? (
                  <span className="text-xs text-green-500 font-bold uppercase tracking-wider flex items-center gap-1"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span> LIVE</span>
                ) : (
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ready to listen</span>
                )}
              </div>
            </div>
          </div>
          
          {isListening && (
            <div className="text-right">
              <span className="text-sm font-mono text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border">
                {formatDuration(duration)}
              </span>
            </div>
          )}
        </div>

        {/* Visualizer Area */}
        <div className={`h-24 rounded-2xl flex items-center justify-center mb-6 border transition-colors duration-500 ${isListening ? 'bg-background/80 border-primary/20' : 'bg-muted/30 border-border border-dashed'}`}>
          {isListening ? (
            <div className="flex items-center gap-1 h-12 px-4">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${Math.max(10, Math.random() * 100)}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`
                  }}
                />
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground font-medium">No active stream</span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button 
            className={`flex-1 h-14 rounded-2xl text-base font-semibold shadow-lg transition-all duration-300 ${isListening ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
            disabled={!online || isConnecting}
            onClick={toggleListen}
          >
            {isConnecting ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Connecting</>
            ) : isListening ? (
              <><Square className="w-5 h-5 mr-2 fill-current" /> Stop Listening</>
            ) : (
              <><Volume2 className="w-5 h-5 mr-2" /> Listen Now</>
            )}
          </Button>
          
          {isListening && (
            <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-border bg-card hover:bg-muted shrink-0">
              <MicOff className="w-5 h-5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
