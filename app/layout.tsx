import type { Metadata, Viewport } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Ehsan's Room",
  description: "Ehsan's Personal Smart Home Dashboard",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "Ehsan's Room",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
