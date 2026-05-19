'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { uid, today, GOAL_COLORS, GOAL_EMOJIS } from '@/lib/utils';
import { CURRENCY_NAMES } from '@/lib/currency';
import type { CurrencyCode } from '@/lib/types';

const CURRENCIES: CurrencyCode[] = ['EUR', 'USD', 'GBP', 'JPY', 'PLN', 'CHF'];

const STEPS = ['Welcome', 'Currency', 'First Goal'];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 0
  const [name, setName] = useState('');

  // Step 1
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');

  // Step 2
  const [goalName, setGoalName]     = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalEmoji, setGoalEmoji]   = useState('🎯');
  const [goalColor, setGoalColor]   = useState(GOAL_COLORS[0]);
  const [goalDeadline, setGoalDeadline] = useState('');

  function next() { setStep(s => s + 1); }
  function back() { setStep(s => s - 1); }

  function finish(skipGoal = false) {
    const s = storage.getSettings();
    storage.saveSettings({
      ...s,
      name: name.trim() || 'there',
      primaryCurrency: currency,
      onboardingComplete: true,
    });

    if (!skipGoal && goalName.trim() && goalTarget) {
      const deadline = goalDeadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);
      storage.saveGoals([{
        id: uid(),
        name: goalName.trim(),
        emoji: goalEmoji,
        color: goalColor,
        targetAmount: parseFloat(goalTarget),
        currentAmount: 0,
        currency,
        deadline,
        priority: 'medium',
        createdAt: today(),
      }]);
    }

    router.replace('/');
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-10">
      {/* Step dots */}
      <div className="flex justify-center gap-2 mb-10">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300
            ${i === step ? 'w-6 bg-burgundy' : i < step ? 'w-3 bg-burgundy/40' : 'w-3 bg-black/10 dark:bg-white/15'}`}
          />
        ))}
      </div>

      {/* ── Step 0: Welcome ── */}
      {step === 0 && (
        <div className="flex-1 flex flex-col">
          <p className="text-4xl mb-4">🐷</p>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Welcome to<br/>MyPiggyBank</h1>
          <p className="text-warmgray dark:text-neutral-400 mb-8">
            Your personal savings companion. Let's get you set up in just a minute.
          </p>

          <label className="text-sm font-medium mb-1.5">What's your name?</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="glass h-12 rounded-2xl px-4 text-sm outline-none mb-2
              focus:ring-2 focus:ring-burgundy/30 transition-all"
            autoFocus
          />

          <div className="mt-auto">
            <button
              onClick={next}
              className="w-full h-12 rounded-full bg-burgundy text-white font-semibold text-sm
                active:scale-[0.97] transition-transform duration-150 shadow-lg shadow-burgundy/30"
            >
              Get started
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Currency ── */}
      {step === 1 && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold mb-1 tracking-tight">Primary Currency</h1>
          <p className="text-warmgray dark:text-neutral-400 text-sm mb-6">
            Choose the currency for your overall balance view.
          </p>

          <div className="space-y-2 flex-1">
            {CURRENCIES.map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`w-full h-14 glass rounded-2xl px-4 flex items-center justify-between
                  active:scale-[0.98] transition-all duration-150
                  ${currency === c ? 'ring-2 ring-burgundy/50' : ''}`}
              >
                <span className="font-semibold text-sm">{c}</span>
                <span className="text-warmgray dark:text-neutral-400 text-sm">{CURRENCY_NAMES[c]}</span>
                {currency === c && (
                  <CheckIcon />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-8">
            <button onClick={back}
              className="flex-1 h-12 rounded-full glass font-semibold text-sm
                active:scale-[0.97] transition-transform duration-150">
              Back
            </button>
            <button onClick={next}
              className="flex-1 h-12 rounded-full bg-burgundy text-white font-semibold text-sm
                active:scale-[0.97] transition-transform duration-150 shadow-lg shadow-burgundy/30">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: First Goal ── */}
      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold mb-1 tracking-tight">Create your first goal</h1>
          <p className="text-warmgray dark:text-neutral-400 text-sm mb-6">
            You can add more goals later from the dashboard.
          </p>

          {/* Emoji picker */}
          <div className="mb-4">
            <label className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider mb-2 block">
              Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {GOAL_EMOJIS.map(e => (
                <button key={e} onClick={() => setGoalEmoji(e)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl
                    active:scale-90 transition-all duration-150
                    ${goalEmoji === e ? 'bg-burgundy/15 ring-2 ring-burgundy/40' : 'glass'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Goal name */}
          <input
            type="text"
            value={goalName}
            onChange={e => setGoalName(e.target.value)}
            placeholder="Goal name (e.g. Emergency Fund)"
            className="glass h-12 rounded-2xl px-4 text-sm outline-none mb-3
              focus:ring-2 focus:ring-burgundy/30 transition-all"
          />

          {/* Target */}
          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-warmgray">
              {currency}
            </span>
            <input
              type="number"
              value={goalTarget}
              onChange={e => setGoalTarget(e.target.value)}
              placeholder="Target amount"
              className="glass h-12 rounded-2xl pl-14 pr-4 text-sm outline-none w-full
                focus:ring-2 focus:ring-burgundy/30 transition-all"
              min="1"
            />
          </div>

          {/* Deadline */}
          <input
            type="date"
            value={goalDeadline}
            onChange={e => setGoalDeadline(e.target.value)}
            className="glass h-12 rounded-2xl px-4 text-sm outline-none mb-4
              focus:ring-2 focus:ring-burgundy/30 transition-all"
          />

          {/* Color picker */}
          <div className="mb-6">
            <label className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider mb-2 block">
              Color
            </label>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button key={c} onClick={() => setGoalColor(c)}
                  className={`w-8 h-8 rounded-full active:scale-90 transition-all duration-150
                    ${goalColor === c ? 'ring-2 ring-offset-2 ring-black/30 dark:ring-white/30 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-auto">
            <button onClick={() => finish(true)}
              className="flex-1 h-12 rounded-full glass font-semibold text-sm
                active:scale-[0.97] transition-transform duration-150 text-warmgray dark:text-neutral-400">
              Skip for now
            </button>
            <button
              onClick={() => finish(false)}
              disabled={!goalName.trim() || !goalTarget}
              className="flex-1 h-12 rounded-full bg-burgundy text-white font-semibold text-sm
                active:scale-[0.97] transition-transform duration-150 shadow-lg shadow-burgundy/30
                disabled:opacity-40 disabled:active:scale-100">
              Finish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-burgundy ml-auto">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
