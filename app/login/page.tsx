'use client';

import { useState, FormEvent, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, Loader2, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok) {
        const from = searchParams.get('from') || '/dashboard';
        router.push(from);
        router.refresh();
      } else {
        setError(data.error || 'Invalid PIN');
        setPin('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isDark = mounted ? theme === 'dark' : true;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden font-sans selection:bg-primary/30 px-4 transition-colors duration-500">
      {/* Background Meshes / Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="bg-card/80 backdrop-blur-2xl border-border rounded-[2rem] shadow-2xl overflow-hidden relative transition-colors duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-400 to-primary opacity-80" />
          
          <CardContent className="p-8 md:p-10 pt-12">
            {/* Icon */}
            <div className="text-center mb-8 flex flex-col items-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary blur-xl opacity-20 dark:opacity-30 rounded-full animate-pulse" />
                <div className="relative w-20 h-20 bg-background rounded-3xl border border-border shadow-xl dark:shadow-2xl backdrop-blur-xl flex items-center justify-center">
                  <Home className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 text-foreground">
                Ehsan Room
              </h1>
              <div className="flex items-center justify-center gap-2 text-muted-foreground font-medium">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Secure Access
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="pin"
                  className="block text-sm font-semibold text-foreground mb-3 ml-1"
                >
                  Enter Passcode
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    id="pin"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-background/50 backdrop-blur-md border border-border rounded-2xl text-foreground text-lg tracking-[0.5em] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 shadow-inner"
                    placeholder="••••"
                    maxLength={6}
                    disabled={loading}
                    autoFocus
                    autoComplete="off"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 backdrop-blur-md border border-destructive/20 rounded-2xl animate-shake shadow-lg shadow-destructive/5">
                  <p className="text-destructive text-sm text-center font-medium flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !pin}
                className="w-full h-14 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-primary-foreground font-semibold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(var(--primary),0.2)] dark:shadow-[0_0_20px_rgba(var(--primary),0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none border-0 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying Identity...
                  </>
                ) : (
                  'Unlock Dashboard'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm font-medium tracking-wide">
            Secure IoT Core &bull; Powered by Next.js
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary blur-xl opacity-20 rounded-full animate-pulse" />
          <Loader2 className="w-10 h-10 text-primary animate-spin relative z-10" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
