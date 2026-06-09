'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import LiquidGlass from '@/components/LiquidGlass';

const DISMISSED_KEY = 'mpb.install-dismissed';

type BrowserInfo = {
  os: 'ios' | 'android' | 'other';
  browser: 'safari' | 'chrome' | 'samsung' | 'firefox' | 'edge' | 'other';
  isStandalone: boolean;
};

function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent;
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;

  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);

  let browser: BrowserInfo['browser'] = 'other';
  if (/SamsungBrowser/i.test(ua)) browser = 'samsung';
  else if (/Edg\//i.test(ua)) browser = 'edge';
  else if (/Firefox/i.test(ua)) browser = 'firefox';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'chrome';
  else if (/Safari/i.test(ua)) browser = 'safari';

  return {
    os: isIOS ? 'ios' : isAndroid ? 'android' : 'other',
    browser,
    isStandalone,
  };
}

type Step = { icon: string; text: React.ReactNode };

function getInstructions(info: BrowserInfo): { title: string; steps: Step[] } | null {
  if (info.os === 'ios') {
    if (info.browser === 'chrome') {
      return {
        title: 'Install on your iPhone',
        steps: [
          { icon: '⚠️', text: <>Chrome on iOS doesn&apos;t support direct install. <strong>Open this page in Safari</strong> for the best experience.</> },
          { icon: '📋', text: <>Copy this URL: <strong>mypiggybank.online</strong></> },
          { icon: '🧭', text: <>Paste it in <strong>Safari</strong> and follow the steps below.</> },
        ],
      };
    }
    if (info.browser === 'firefox') {
      return {
        title: 'Install on your iPhone',
        steps: [
          { icon: '⚠️', text: <>Firefox on iOS doesn&apos;t support app install. <strong>Open this page in Safari</strong>.</> },
        ],
      };
    }
    // Safari (default iOS)
    return {
      title: 'Install on your iPhone',
      steps: [
        { icon: '⬆️', text: <>Tap the <strong>Share</strong> button at the bottom of Safari (the square with an arrow pointing up).</> },
        { icon: '📲', text: <>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</> },
        { icon: '✅', text: <>Tap <strong>Add</strong> — MyPiggyBank will appear on your home screen like a native app.</> },
      ],
    };
  }

  if (info.os === 'android') {
    if (info.browser === 'samsung') {
      return {
        title: 'Install on your phone',
        steps: [
          { icon: '☰', text: <>Tap the <strong>menu icon</strong> (three horizontal lines) at the bottom of the screen.</> },
          { icon: '➕', text: <>Tap <strong>&ldquo;Add page to&rdquo;</strong>, then <strong>&ldquo;Home screen&rdquo;</strong>.</> },
          { icon: '✅', text: <>Tap <strong>Add</strong> to confirm.</> },
        ],
      };
    }
    if (info.browser === 'firefox') {
      return {
        title: 'Install on your phone',
        steps: [
          { icon: '⋮', text: <>Tap the <strong>three dots</strong> menu in the top-right corner.</> },
          { icon: '📲', text: <>Tap <strong>&ldquo;Install&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.</> },
          { icon: '✅', text: <>Tap <strong>Add</strong> to confirm.</> },
        ],
      };
    }
    if (info.browser === 'edge') {
      return {
        title: 'Install on your phone',
        steps: [
          { icon: '⋮', text: <>Tap the <strong>three dots</strong> menu at the bottom of the screen.</> },
          { icon: '📲', text: <>Tap <strong>&ldquo;Add to phone&rdquo;</strong>.</> },
          { icon: '✅', text: <>Tap <strong>Install</strong> to confirm.</> },
        ],
      };
    }
    // Chrome (default Android) — uses beforeinstallprompt, button handled inline
    return {
      title: 'Install on your phone',
      steps: [
        { icon: '⋮', text: <>Or tap the <strong>three dots</strong> menu in the top-right corner of Chrome.</> },
        { icon: '📲', text: <>Tap <strong>&ldquo;Add to Home screen&rdquo;</strong> or <strong>&ldquo;Install app&rdquo;</strong>.</> },
        { icon: '✅', text: <>Tap <strong>Install</strong> to confirm.</> },
      ],
    };
  }

  return null;
}

export default function InstallPrompt() {
  const { theme } = useTheme();
  const [info, setInfo]               = useState<BrowserInfo | null>(null);
  const [show, setShow]               = useState(false);
  const [expanded, setExpanded]       = useState(false);
  const [deferredPrompt, setDeferred] = useState<any>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const detected = detectBrowser();
    if (detected.isStandalone) return;
    setInfo(detected);

    // Read the prompt captured early in <head> before React hydrated
    if ((window as any).__installPrompt) {
      setDeferred((window as any).__installPrompt);
      setTimeout(() => setShow(true), 1600);
      return;
    }

    // Listen for future fires (shouldn't be needed but keeps it robust)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS and other browsers: always show the banner
    if (detected.os === 'ios' || detected.os === 'android') {
      const t = setTimeout(() => setShow(true), 1600);
      return () => { clearTimeout(t); window.removeEventListener('beforeinstallprompt', handler); };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  }

  async function nativeInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
  }

  if (!show || !info) return null;

  const instructions = getInstructions(info);
  const canNativeInstall = !!deferredPrompt && info.os === 'android' && info.browser === 'chrome';

  return (
    <div
      className="fixed left-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm"
      style={{
        top: 'max(16px, env(safe-area-inset-top, 16px))',
        animation: 'slideDown 0.4s cubic-bezier(0.16,1,0.3,1) both',
      }}
      role="banner"
      aria-label="Install app"
    >
      <LiquidGlass
        radius={24}
        blur={40}
        saturate={180}
        style={{
          boxShadow: theme === 'dark'
            ? '0 16px 48px rgba(0,0,0,0.52)'
            : '0 16px 48px rgba(0,0,0,0.18)',
          background: theme === 'dark'
            ? 'rgba(24,20,18,0.88)'
            : 'rgba(255,255,255,0.88)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm bg-white dark:bg-neutral-800">
            <img src="/icons/icon.svg" alt="MyPiggyBank" width={40} height={40} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight text-charcoal dark:text-white">Better as an app</p>
            <p className="text-xs text-warmgray dark:text-neutral-300 leading-snug mt-0.5">
              Full-screen, works offline, no browser bar.
            </p>
          </div>

          <button
            onClick={dismiss}
            className="flex-shrink-0 p-1.5 -mr-1 -mt-1 rounded-full
              text-warmgray dark:text-neutral-400 hover:text-charcoal dark:hover:text-white
              hover:bg-black/5 dark:hover:bg-white/8
              active:opacity-60 transition-all duration-150"
            aria-label="Dismiss"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Install button for Android Chrome */}
        {canNativeInstall && (
          <div className="px-4 pb-4">
            <button
              onClick={nativeInstall}
              className="w-full h-11 rounded-full bg-burgundy text-white text-sm font-bold
                active:scale-[0.97] transition-transform shadow-lg shadow-burgundy/30"
            >
              Install MyPiggyBank
            </button>
          </div>
        )}

        {/* Step-by-step instructions toggle */}
        {instructions && (
          <>
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-full px-4 pb-3 flex items-center justify-between
                text-xs font-semibold text-burgundy dark:text-blush
                active:opacity-60 transition-opacity duration-150"
            >
              <span>{expanded ? 'Hide instructions' : 'How to install'}</span>
              <span className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>

            {expanded && (
              <div className="px-4 pb-4 space-y-2.5">
                <p className="text-xs font-bold text-charcoal dark:text-white mb-3">
                  {instructions.title}
                </p>
                {instructions.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-base leading-none flex-shrink-0 mt-0.5">{step.icon}</span>
                    <p className="text-xs text-charcoal dark:text-neutral-200 leading-snug">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </LiquidGlass>
    </div>
  );
}
