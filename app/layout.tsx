import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'MyPiggyBank',
  description: 'Your personal savings companion',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
    { media: '(prefers-color-scheme: dark)',  color: '#0f0f0f' },
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
          } catch(e) {}
        `}} />
      </head>
      <body className="font-sans text-charcoal dark:text-neutral-100 antialiased">
        {/* Ambient background */}
        <div className="app-background">
          <div className="app-background-base" />
        </div>

        <ThemeProvider>
          <div className="relative min-h-screen max-w-md mx-auto">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
