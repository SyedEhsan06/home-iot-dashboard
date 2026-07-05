'use client';

import { Thermometer, Droplets, Sun, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SensorGridProps {
  temperature?: number;
  humidity?: number;
  lux?: number;
  online: boolean;
}

export function SensorGrid({ temperature, humidity, lux, online }: SensorGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Temperature */}
      <Card className="bg-card/60 border-border rounded-[2rem] overflow-hidden">
        <CardContent className="p-5 flex flex-col gap-3">
          <div className="p-3 bg-muted w-max rounded-2xl">
            <Thermometer className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{temperature !== undefined ? temperature.toFixed(1) : '--'}</span>
              <span className="text-muted-foreground font-medium">°C</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-1">Temperature</p>
          </div>
        </CardContent>
      </Card>

      {/* Humidity */}
      <Card className="bg-card/60 border-border rounded-[2rem] overflow-hidden">
        <CardContent className="p-5 flex flex-col gap-3">
          <div className="p-3 bg-muted w-max rounded-2xl">
            <Droplets className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{humidity !== undefined ? humidity.toFixed(0) : '--'}</span>
              <span className="text-muted-foreground font-medium">%</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-1">Humidity</p>
          </div>
        </CardContent>
      </Card>

      {/* Light */}
      <Card className="bg-card/60 border-border rounded-[2rem] overflow-hidden">
        <CardContent className="p-5 flex flex-col gap-3">
          <div className="p-3 bg-muted w-max rounded-2xl">
            <Sun className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{lux !== undefined ? lux : '--'}</span>
              <span className="text-muted-foreground font-medium">lx</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-1">Light level</p>
          </div>
        </CardContent>
      </Card>

      {/* ESP32 Status */}
      <Card className={`border rounded-[2rem] overflow-hidden transition-colors duration-500 ${online ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'}`}>
        <CardContent className="p-5 flex flex-col gap-3">
          <div className={`p-3 w-max rounded-2xl ${online ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
            {online ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${online ? 'text-foreground' : 'text-destructive'}`}>
                {online ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-1">System Status</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
