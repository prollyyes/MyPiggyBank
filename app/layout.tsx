import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import InstallPrompt from '@/components/InstallPrompt';

export const metadata: Metadata = {
  title: 'MyPiggyBank',
  description: 'Your personal savings companion',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MyPiggyBank',
  },
  icons: {
    apple: '/icons/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F5' },
    { media: '(prefers-color-scheme: dark)',  color: '#0E0B09' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var s = JSON.parse(localStorage.getItem('mpb.settings') || '{}');
            if (s.theme === 'dark') document.documentElement.classList.add('dark');
            var p = s.colorPalette || 'amalfi';
            document.documentElement.classList.add('theme-' + p);
          } catch(e) {}
        `}} />
        {/* Capture beforeinstallprompt early — before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.__installPrompt = null;
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__installPrompt = e;
          });
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `}} />
      </head>
      <body className="font-sans text-charcoal dark:text-neutral-100 antialiased">
        {/* Fixed ambient background — always behind everything */}
        <div className="app-background">
          <div className="app-background-base" />
        </div>

        {/* Scroll root — the only scrollable container. body is position:fixed
            to eliminate iOS rubber-band overscroll. */}
        <div
          id="scroll-root"
          className="relative max-w-md mx-auto"
        >
          <ThemeProvider>
            {children}
            <InstallPrompt />
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
