'use client';

import { Home, Grid, Activity, Settings, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BottomNavigation() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 bg-background/80 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-between pb-4 max-w-md mx-auto relative">
        <button className="flex flex-col items-center gap-1 p-2 text-primary">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">Home</span>
        </button>
        
        <button className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Grid className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">Rooms</span>
        </button>

        {/* Center Primary Action - Audio / Mic Quick Action */}
        <div className="relative -top-6">
          <Button size="icon" className="w-14 h-14 rounded-full shadow-xl shadow-primary/20 border-4 border-background bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 active:scale-95 transition-transform">
            <Mic className="w-6 h-6" />
          </Button>
        </div>
        
        <button className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Activity className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">Activity</span>
        </button>
        
        <button className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">Settings</span>
        </button>
      </div>
    </div>
  );
}
