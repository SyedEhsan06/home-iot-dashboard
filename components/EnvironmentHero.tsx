'use client';

import { Cloud, Droplets, Sun, Thermometer, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EnvironmentHeroProps {
  temperature?: number;
  humidity?: number;
  lux?: number;
  lastUpdated: number | null;
  online: boolean;
}

export function EnvironmentHero({ temperature, humidity, lux, lastUpdated, online }: EnvironmentHeroProps) {
  // Determine light condition
  const getLightCondition = (luxValue?: number) => {
    if (luxValue === undefined) return 'Unknown';
    if (luxValue < 50) return 'Dark';
    if (luxValue < 200) return 'Dim';
    if (luxValue < 1000) return 'Comfortable';
    return 'Bright';
  };

  const lightCondition = getLightCondition(lux);
  
  // Overall status logic
  const getOverallStatus = () => {
    if (!online) return 'Sensor data unavailable';
    if (temperature === undefined) return 'Waiting for sensor data...';
    if (temperature > 30) return 'Room is warm. Cooling recommended.';
    if (temperature < 18) return 'Room is cold. Heating recommended.';
    if (humidity && humidity > 70) return 'High humidity. Dehumidify recommended.';
    return 'Room conditions are comfortable.';
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(timestamp));
  };

  return (
    <Card className="relative overflow-hidden rounded-[2.5rem] border-0 bg-gradient-to-br from-primary/90 to-primary/60 text-primary-foreground shadow-2xl shadow-primary/20 transition-all duration-500">
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
      
      <CardContent className="p-8 relative z-10 flex flex-col justify-between min-h-[300px]">
        {/* Top Header Row inside Hero */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
            <Info className="w-4 h-4 text-white/90" />
            <span className="text-sm font-medium text-white/90">{getOverallStatus()}</span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Last Sync</span>
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-red-400'}`} />
              <span className="text-sm font-medium text-white/90">{formatTime(lastUpdated)}</span>
            </div>
          </div>
        </div>

        {/* Main Temperature Display */}
        <div className="flex items-end gap-4 mb-10">
          <div className="relative">
            <span className="text-8xl font-black tracking-tighter text-white drop-shadow-md">
              {temperature !== undefined ? temperature.toFixed(1) : '--'}
            </span>
            <span className="text-4xl font-bold text-white/70 absolute top-2 -right-10">
              °C
            </span>
          </div>
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Humidity Block */}
          <div className="flex flex-col gap-2 bg-black/10 p-4 rounded-3xl backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-2 text-white/70">
              <Droplets className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Humidity</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">
                {humidity !== undefined ? humidity.toFixed(0) : '--'}
              </span>
              <span className="text-lg font-medium text-white/70">%</span>
            </div>
          </div>

          {/* Light Block */}
          <div className="flex flex-col gap-2 bg-black/10 p-4 rounded-3xl backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-2 text-white/70">
              <Sun className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Light</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {lux !== undefined ? lux : '--'}
                </span>
                <span className="text-lg font-medium text-white/70">lx</span>
              </div>
              <span className="text-xs font-medium text-white/80 mt-1">{lightCondition}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
