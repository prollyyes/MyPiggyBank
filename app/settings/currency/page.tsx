'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { storage } from '@/lib/storage';
import { CURRENCY_NAMES, RATES } from '@/lib/currency';
import type { CurrencyCode } from '@/lib/types';

const ALL_CURRENCIES = Object.keys(CURRENCY_NAMES) as CurrencyCode[];

const FLAG: Record<string, string> = {
  EUR: '🇪🇺', USD: '🇺🇸', GBP: '🇬🇧', JPY: '🇯🇵', PLN: '🇵🇱', CHF: '🇨🇭',
};

export default function CurrencySettings() {
  const router = useRouter();
  const settings = storage.getSettings();
  const [selected, setSelected] = useState<CurrencyCode>(
    settings.primaryCurrency as CurrencyCode
  );
  const [query, setQuery] = useState('');

  const filtered = ALL_CURRENCIES.filter(c =>
    c.toLowerCase().includes(query.toLowerCase()) ||
    CURRENCY_NAMES[c].toLowerCase().includes(query.toLowerCase())
  );

  function select(c: CurrencyCode) {
    setSelected(c);
    const s = storage.getSettings();
    storage.saveSettings({ ...s, primaryCurrency: c });
    router.back();
  }

  return (
    <div className="page-enter pb-nav min-h-screen">
      <PageHeader title="Currency" back />

      <main className="px-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-warmgray dark:text-neutral-400"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search currencies…"
            className="glass h-12 rounded-full pl-10 pr-4 text-sm w-full
              outline-none focus:ring-2 focus:ring-burgundy/30 transition-all"
            autoFocus
          />
        </div>

        {/* Current label */}
        <p className="text-xs font-medium text-warmgray dark:text-neutral-400 px-1">
          Currently: <span className="font-bold text-charcoal dark:text-neutral-100">{selected}</span> — {CURRENCY_NAMES[selected]}
        </p>

        {/* List */}
        <div className="glass rounded-3xl overflow-hidden divide-y divide-black/5 dark:divide-white/5">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-warmgray dark:text-neutral-400">
              No currencies match "{query}"
            </div>
          ) : (
            filtered.map(c => {
              const rate = RATES[c];
              const rateStr = rate
                ? `1 EUR = ${c === 'JPY' ? rate.toFixed(0) : rate.toFixed(4)} ${c}`
                : '';

              return (
                <button
                  key={c}
                  onClick={() => select(c)}
                  className={`w-full h-16 px-4 flex items-center gap-3
                    active:bg-black/5 dark:active:bg-white/5 transition-colors duration-150
                    ${selected === c ? 'bg-burgundy/5 dark:bg-burgundy/10' : ''}`}
                >
                  <span className="text-2xl flex-shrink-0">{FLAG[c] ?? '💱'}</span>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-sm">{c}</p>
                    <p className="text-xs text-warmgray dark:text-neutral-400 truncate">
                      {CURRENCY_NAMES[c]}{rateStr ? ` · ${rateStr}` : ''}
                    </p>
                  </div>
                  {selected === c && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="text-burgundy flex-shrink-0">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
