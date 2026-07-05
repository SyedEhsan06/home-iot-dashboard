'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Lightbulb, Fan, Plug, Power, Zap, Loader2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Relay {
  id: number;
  name: string;
  state: boolean;
}

interface RelayControlProps {
  relays: Relay[];
  deviceId: string;
  online: boolean;
}

export default function RelayControl({
  relays,
  deviceId,
  online,
}: RelayControlProps) {
  const [loading, setLoading] = useState<number | null>(null);
  
  // State for Rename Dialog
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [activeRelayToRename, setActiveRelayToRename] = useState<Relay | null>(null);
  const [newRelayName, setNewRelayName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const handleToggle = async (relayId: number, currentState: boolean) => {
    if (!online) {
      toast.info('Sending signal...', { description: 'Attempting to wake device and send command.' });
    }
    
    if (loading !== null) return;

    setLoading(relayId);
    const newState = !currentState;

    try {
      const response = await fetch(`/api/device/${deviceId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relay: relayId, state: newState }),
      });

      if (response.ok) {
        toast.success(`${relays.find(r => r.id === relayId)?.name} turned ${newState ? 'ON' : 'OFF'}`, {
          className: 'bg-card text-card-foreground border-border',
        });
      } else {
        throw new Error('Failed to toggle');
      }
    } catch (error) {
      console.error('Error toggling relay:', error);
      toast.error(`Failed to toggle Relay ${relayId}`);
    } finally {
      setLoading(null);
    }
  };

  const handleSaveName = async () => {
    if (!activeRelayToRename || !newRelayName.trim()) return;
    
    setIsRenaming(true);
    try {
      const response = await fetch(`/api/device/${deviceId}/name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relayId: activeRelayToRename.id, name: newRelayName.trim() }),
      });
      
      if (!response.ok) throw new Error('Failed to save name');
      
      toast.success('Name updated successfully', {
        className: 'bg-card text-card-foreground border-border',
      });
      setIsRenameOpen(false);
    } catch (error) {
      console.error('Error saving name:', error);
      toast.error('Failed to update name');
    } finally {
      setIsRenaming(false);
    }
  };

  const getIcon = (id: number) => {
    const props = { className: "w-7 h-7" };
    switch (id) {
      case 1: return <Lightbulb {...props} />;
      case 2: return <Fan {...props} />;
      case 3: return <Plug {...props} />;
      case 4: return <Zap {...props} />;
      default: return <Power {...props} />;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relays.map((relay) => {
          const isLoading = loading === relay.id;
          
          return (
            <Card 
              key={relay.id} 
              className={`relative overflow-hidden rounded-[2rem] transition-all duration-300 border backdrop-blur-2xl group ${
                relay.state 
                  ? 'bg-card/90 border-primary/40 shadow-xl shadow-primary/5' 
                  : 'bg-card/40 border-border hover:bg-card/60 shadow-none'
              }`}
            >
              <CardContent className="p-6 h-full flex flex-col justify-between min-h-[160px] relative z-10">
                <div className="flex justify-between items-start">
                  <div className={`p-4 rounded-[1.5rem] transition-all duration-300 ${
                    relay.state 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 text-muted-foreground group-hover:bg-muted'
                  }`}>
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      getIcon(relay.id)
                    )}
                  </div>
                  
                  <Switch 
                    checked={relay.state}
                    disabled={loading !== null}
                    onCheckedChange={() => handleToggle(relay.id, relay.state)}
                    className={`scale-110 data-[state=checked]:bg-primary shadow-xl ${
                      relay.state ? 'shadow-primary/30' : 'bg-muted'
                    }`}
                  />
                </div>
                
                <div className="mt-8 flex justify-between items-end">
                  <div>
                    <h3 className={`text-xl font-semibold tracking-tight transition-colors duration-500 ${
                      relay.state ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    }`}>
                      {relay.name}
                    </h3>
                    <p className={`text-sm font-medium mt-1 tracking-wide transition-colors duration-500 ${
                      relay.state ? 'text-primary' : 'text-muted-foreground group-hover:text-muted-foreground'
                    }`}>
                      {relay.state ? 'ON' : 'OFF'}
                    </p>
                  </div>
                  
                  {/* Edit Button */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-muted"
                    onClick={() => {
                      setActiveRelayToRename(relay);
                      setNewRelayName(relay.name);
                      setIsRenameOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">Edit name</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl bg-card border-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Rename Device</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-muted-foreground">
                Give this switch a friendly name (e.g., "Living Room Fan")
              </Label>
              <Input
                id="name"
                value={newRelayName}
                onChange={(e) => setNewRelayName(e.target.value)}
                className="col-span-3 text-lg h-12 bg-background border-border rounded-xl focus-visible:ring-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsRenameOpen(false)}
              className="rounded-xl border-border bg-transparent hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveName} 
              disabled={isRenaming || !newRelayName.trim() || newRelayName === activeRelayToRename?.name}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 min-w-[100px]"
            >
              {isRenaming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
