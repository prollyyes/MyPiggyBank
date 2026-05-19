'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { storage } from '@/lib/storage';
import { useTheme } from '@/components/providers/ThemeProvider';
import { CURRENCY_NAMES } from '@/lib/currency';
import type { Settings } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [settings, setSettings] = useState<Settings>(storage.getSettings());
  const [showClear, setShowClear] = useState(false);

  function updateName(name: string) {
    const s = { ...settings, name };
    setSettings(s);
    storage.saveSettings(s);
  }

  function updateBudget(raw: string) {
    const monthlyBudget = parseFloat(raw) || 0;
    const s = { ...settings, monthlyBudget };
    setSettings(s);
    storage.saveSettings(s);
  }

  function clearAll() {
    storage.clear();
    router.replace('/onboarding');
  }

  return (
    <div className="page-enter pb-nav min-h-screen">
      <PageHeader title="Settings" showThemeToggle />

      <main className="px-4 space-y-5">
        {/* Profile */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-warmgray dark:text-neutral-400 px-1 mb-2">
            Profile
          </h2>
          <div className="glass rounded-3xl p-4 space-y-2">
            <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
              Your name
            </p>
            <input
              type="text"
              value={settings.name}
              onChange={e => updateName(e.target.value)}
              className="w-full h-11 bg-black/5 dark:bg-white/10 rounded-2xl px-4 text-sm
                outline-none focus:ring-2 focus:ring-burgundy/30 transition-all"
              placeholder="Your name"
            />
          </div>
        </section>

        {/* Budget */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-warmgray dark:text-neutral-400 px-1 mb-2">
            Budget
          </h2>
          <div className="glass rounded-3xl p-4 space-y-2">
            <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
              Monthly income ({settings.primaryCurrency})
            </p>
            <input
              type="number"
              value={settings.monthlyBudget || ''}
              onChange={e => updateBudget(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full h-11 bg-black/5 dark:bg-white/10 rounded-2xl px-4 text-sm
                outline-none focus:ring-2 focus:ring-burgundy/30 transition-all"
            />
            <p className="text-xs text-warmgray dark:text-neutral-500">
              Used as your baseline if you don&apos;t log income entries. Freelancers can leave this at 0 and log each payment instead.
            </p>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-warmgray dark:text-neutral-400 px-1 mb-2">
            Appearance
          </h2>
          <div className="glass rounded-3xl overflow-hidden">
            <button
              onClick={toggle}
              className="w-full h-14 px-4 flex items-center justify-between
                active:bg-black/5 dark:active:bg-white/5 transition-colors duration-150"
            >
              <span className="text-sm font-medium">Dark mode</span>
              {/* Toggle pill */}
              <div className={`w-12 h-6 rounded-full transition-colors duration-200 relative
                ${theme === 'dark' ? 'bg-burgundy' : 'bg-black/15 dark:bg-white/20'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm
                  transition-transform duration-200
                  ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`}
                />
              </div>
            </button>
          </div>
        </section>

        {/* Currency */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-warmgray dark:text-neutral-400 px-1 mb-2">
            Currency
          </h2>
          <Link
            href="/settings/currency"
            className="glass rounded-3xl h-14 px-4 flex items-center justify-between
              active:bg-black/5 dark:active:bg-white/5 transition-colors duration-150"
          >
            <span className="text-sm font-medium">Primary currency</span>
            <div className="flex items-center gap-2 text-sm text-warmgray dark:text-neutral-400">
              <span>{settings.primaryCurrency}</span>
              <ChevronRight />
            </div>
          </Link>
        </section>

        {/* About */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-warmgray dark:text-neutral-400 px-1 mb-2">
            About
          </h2>
          <div className="glass rounded-3xl overflow-hidden divide-y divide-black/5 dark:divide-white/5">
            <div className="h-14 px-4 flex items-center justify-between">
              <span className="text-sm font-medium">Version</span>
              <span className="text-sm text-warmgray dark:text-neutral-400">1.0.0</span>
            </div>
            <div className="h-14 px-4 flex items-center justify-between">
              <span className="text-sm font-medium">Exchange rates</span>
              <span className="text-sm text-warmgray dark:text-neutral-400">2026-05-01</span>
            </div>
            <div className="h-14 px-4 flex items-center justify-between">
              <span className="text-sm font-medium">Storage</span>
              <span className="text-sm text-warmgray dark:text-neutral-400">Local only</span>
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section className="pb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-warmgray dark:text-neutral-400 px-1 mb-2">
            Danger Zone
          </h2>
          {!showClear ? (
            <button
              onClick={() => setShowClear(true)}
              className="w-full h-12 glass rounded-full text-sm font-semibold text-red-500
                active:scale-[0.97] transition-transform duration-150">
              Clear all data
            </button>
          ) : (
            <div className="glass rounded-3xl p-4 space-y-3">
              <p className="text-sm font-medium text-center">Clear everything?</p>
              <p className="text-xs text-warmgray dark:text-neutral-400 text-center">
                This removes all goals, entries, alerts and settings. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowClear(false)}
                  className="flex-1 h-11 rounded-full bg-black/5 dark:bg-white/10 text-sm font-semibold
                    active:scale-[0.97] transition-transform duration-150">
                  Cancel
                </button>
                <button onClick={clearAll}
                  className="flex-1 h-11 rounded-full bg-red-500 text-white text-sm font-semibold
                    active:scale-[0.97] transition-transform duration-150">
                  Clear all
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
