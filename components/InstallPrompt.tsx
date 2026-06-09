'use client';

import { useEffect, useState } from 'react';
import { X, Share } from 'lucide-react';

const DISMISSED_KEY = 'mpb.install-dismissed';

export default function InstallPrompt() {
  const [show, setShow]           = useState(false);
  const [isIOS, setIsIOS]         = useState(false);
  const [deferredPrompt, setDeferred] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    // Already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((window.navigator as any).standalone === true) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      // Small delay so it doesn't flash on first load
      const t = setTimeout(() => setShow(true), 1800);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
      setTimeout(() => setShow(true), 1800);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
  }

  if (!show) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[200]
        w-[calc(100%-2rem)] max-w-sm
        animate-[slideDown_0.4s_cubic-bezier(0.16,1,0.3,1)_both]"
      role="banner"
      aria-label="Install app"
    >
      <div className="glass-strong rounded-3xl p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
          <img src="/icons/icon.svg" alt="MyPiggyBank" width={40} height={40} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight mb-0.5">
            Better as an app
          </p>
          <p className="text-xs text-warmgray dark:text-neutral-400 leading-snug">
            {isIOS
              ? <>Tap <Share size={11} className="inline mb-0.5" strokeWidth={2} /> then <strong>"Add to Home Screen"</strong> for a full-screen experience.</>
              : 'Install MyPiggyBank for a faster, full-screen experience with no browser bar.'}
          </p>
          {!isIOS && deferredPrompt && (
            <button
              onClick={install}
              className="mt-2 text-xs font-bold text-burgundy dark:text-blush
                active:opacity-60 transition-opacity duration-150"
            >
              Install now →
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="flex-shrink-0 -mt-0.5 -mr-0.5 p-1.5 rounded-full
            text-warmgray dark:text-neutral-500
            hover:bg-black/5 dark:hover:bg-white/8
            active:opacity-60 transition-all duration-150"
          aria-label="Dismiss"
        >
          <X size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
