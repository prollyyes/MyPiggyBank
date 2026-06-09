'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { storage } from '@/lib/storage';
import { uid, today, GOAL_COLORS, GOAL_EMOJIS } from '@/lib/utils';
import { CURRENCY_NAMES } from '@/lib/currency';
import type { CurrencyCode, GoalPriority } from '@/lib/types';

const CURRENCIES: CurrencyCode[] = ['EUR', 'USD', 'GBP', 'JPY', 'PLN', 'CHF'];
const PRIORITIES: { value: GoalPriority; label: string; desc: string }[] = [
  { value: 'high',   label: 'High',   desc: 'Critical — top of the list' },
  { value: 'medium', label: 'Medium', desc: 'Important but not urgent'   },
  { value: 'low',    label: 'Low',    desc: 'Nice to have'               },
];

export default function NewGoal() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [name, setName]         = useState('');
  const [emoji, setEmoji]       = useState('🎯');
  const [color, setColor]       = useState(GOAL_COLORS[0]);
  const [target, setTarget]     = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(
    storage.getSettings().primaryCurrency as CurrencyCode ?? 'EUR'
  );
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [initial, setInitial]   = useState('');

  const steps = ['Identity', 'Target', 'Priority'];
  const canNext = [
    name.trim().length > 0,
    target !== '' && parseFloat(target) > 0 && deadline !== '',
    true,
  ];

  function next() {
    if (step < 2) { setStep(s => s + 1); return; }
    save();
  }

  function save() {
    const goals = storage.getGoals();
    goals.push({
      id: uid(),
      name: name.trim(),
      emoji,
      color,
      targetAmount: parseFloat(target),
      currentAmount: initial ? parseFloat(initial) : 0,
      currency,
      deadline,
      priority,
      createdAt: today(),
    });
    storage.saveGoals(goals);
    router.replace('/');
  }

  return (
    <div className="page-enter pb-nav min-h-full">
      <PageHeader title="New Goal" back />

      <main className="px-4 pt-2">
        {/* Progress stepper */}
        <div className="flex items-center gap-2 mb-6 px-1">
          {steps.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-1 rounded-full transition-all duration-300
                ${i <= step ? 'bg-burgundy' : 'bg-black/10 dark:bg-white/10'}`} />
              <span className={`text-[10px] font-medium
                ${i === step ? 'text-burgundy dark:text-burgundy-light'
                  : i < step ? 'text-burgundy/60'
                  : 'text-warmgray dark:text-neutral-500'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Step 0: Identity ── */}
        {step === 0 && (
          <div className="space-y-5">
            {/* Emoji picker */}
            <div className="glass rounded-3xl p-4">
              <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider mb-3">
                Icon
              </p>
              <div className="flex flex-wrap gap-2">
                {GOAL_EMOJIS.map(e => (
                  <button key={e} onClick={() => setEmoji(e)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl
                      active:scale-90 transition-all duration-150
                      ${emoji === e ? 'bg-burgundy/15 ring-2 ring-burgundy/40' : 'bg-black/5 dark:bg-white/10'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="glass rounded-3xl p-4 space-y-3">
              <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
                Name
              </p>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. New laptop"
                className="w-full h-11 bg-black/5 dark:bg-white/10 rounded-2xl px-4 text-sm
                  outline-none focus:ring-2 focus:ring-burgundy/30 transition-all"
                autoFocus
              />
            </div>

            {/* Color */}
            <div className="glass rounded-3xl p-4">
              <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider mb-3">
                Color
              </p>
              <div className="flex gap-3">
                {GOAL_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-9 h-9 rounded-full active:scale-90 transition-all duration-150
                      ${color === c ? 'ring-2 ring-offset-2 ring-black/30 dark:ring-white/30 scale-110' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Target ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Goal preview mini-card */}
            <div className="glass rounded-3xl p-4 flex items-center gap-3">
              <span className="text-3xl">{emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{name}</p>
                <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 mt-1.5 overflow-hidden">
                  <div className="h-full w-0 rounded-full" style={{ backgroundColor: color }} />
                </div>
              </div>
            </div>

            {/* Currency */}
            <div className="glass rounded-3xl p-4 space-y-3">
              <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
                Currency
              </p>
              <div className="flex gap-2 flex-wrap">
                {CURRENCIES.map(c => (
                  <button key={c} onClick={() => setCurrency(c)}
                    className={`h-9 px-4 rounded-full text-sm font-medium
                      active:scale-95 transition-all duration-150
                      ${currency === c
                        ? 'bg-burgundy text-white shadow-sm shadow-burgundy/30'
                        : 'bg-black/5 dark:bg-white/10'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Target amount */}
            <div className="glass rounded-3xl p-4 space-y-3">
              <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
                Target amount
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-warmgray">
                  {currency}
                </span>
                <input
                  type="number"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  placeholder="0"
                  className="w-full h-11 bg-black/5 dark:bg-white/10 rounded-2xl pl-14 pr-4 text-sm
                    outline-none focus:ring-2 focus:ring-burgundy/30 transition-all"
                  min="1"
                />
              </div>
            </div>

            {/* Deadline */}
            <div className="glass rounded-3xl p-4 space-y-3">
              <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
                Deadline
              </p>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full h-11 bg-black/5 dark:bg-white/10 rounded-2xl px-4 text-sm
                  outline-none focus:ring-2 focus:ring-burgundy/30 transition-all"
              />
            </div>

            {/* Optional initial amount */}
            <div className="glass rounded-3xl p-4 space-y-3">
              <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
                Already saved (optional)
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-warmgray">
                  {currency}
                </span>
                <input
                  type="number"
                  value={initial}
                  onChange={e => setInitial(e.target.value)}
                  placeholder="0"
                  className="w-full h-11 bg-black/5 dark:bg-white/10 rounded-2xl pl-14 pr-4 text-sm
                    outline-none focus:ring-2 focus:ring-burgundy/30 transition-all"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Priority ── */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-warmgray dark:text-neutral-400 px-1 mb-4">
              Priority affects how your goals are sorted and highlighted on the dashboard.
            </p>
            {PRIORITIES.map(p => (
              <button key={p.value} onClick={() => setPriority(p.value)}
                className={`w-full glass rounded-2xl p-4 flex items-center gap-4 text-left
                  active:scale-[0.98] transition-all duration-150
                  ${priority === p.value ? 'ring-2 ring-burgundy/50' : ''}`}>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  p.value === 'high'   ? 'bg-burgundy' :
                  p.value === 'medium' ? 'bg-state-blue' : 'bg-warmgray'
                }`} />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{p.label}</p>
                  <p className="text-xs text-warmgray dark:text-neutral-400">{p.desc}</p>
                </div>
                {priority === p.value && <CheckIcon />}
              </button>
            ))}
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 h-12 rounded-full glass font-semibold text-sm
                active:scale-[0.97] transition-transform duration-150">
              Back
            </button>
          )}
          <button
            onClick={next}
            disabled={!canNext[step]}
            className="flex-1 h-12 rounded-full bg-burgundy text-white font-semibold text-sm
              active:scale-[0.97] transition-transform duration-150 shadow-lg shadow-burgundy/30
              disabled:opacity-40 disabled:active:scale-100">
            {step === 2 ? 'Create goal' : 'Continue'}
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-burgundy flex-shrink-0">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
