'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { fmt } from '@/lib/currency';
import { pct } from '@/lib/utils';
import type { Goal, CurrencyCode } from '@/lib/types';

interface Allocation {
  goalId: string;
  amount: number;
}

interface Props {
  available: number;
  currency: CurrencyCode;
  goals: Goal[];
  onClose: () => void;
  onConfirm: (allocations: Allocation[]) => void;
}

export default function QuickAllocate({ available, currency, goals, onClose, onConfirm }: Props) {
  const [percents, setPercents] = useState<Record<string, number>>(
    Object.fromEntries(goals.map(g => [g.id, 0]))
  );

  const totalPct = Object.values(percents).reduce((s, p) => s + p, 0);
  const totalAmt = Math.round((totalPct / 100) * available * 100) / 100;
  const remainAmt = Math.round((available - totalAmt) * 100) / 100;
  const overLimit = totalPct > 100;
  const canConfirm = totalPct > 0 && !overLimit;

  function setPct(goalId: string, raw: number) {
    setPercents(prev => ({ ...prev, [goalId]: Math.max(0, Math.min(100, Math.round(raw))) }));
  }

  function adjust(goalId: string, delta: number) {
    setPct(goalId, (percents[goalId] ?? 0) + delta);
  }

  function splitEvenly() {
    const share = Math.floor(100 / goals.length);
    const extra = 100 - share * goals.length;
    setPercents(Object.fromEntries(goals.map((g, i) => [g.id, share + (i === 0 ? extra : 0)])));
  }

  function handleConfirm() {
    const allocations = goals
      .map(g => ({
        goalId: g.id,
        amount: Math.round((percents[g.id] / 100) * available * 100) / 100,
      }))
      .filter(a => a.amount > 0);
    onConfirm(allocations);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sheet-enter
        rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden"
        style={{ background: 'var(--sheet-bg, #FAF7F5)' }}>

        {/* Use a local CSS var so dark mode works */}
        <style>{`.dark .fixed.bottom-0.z-50 { --sheet-bg: #0E0B09; }`}</style>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-black/15 dark:bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pb-2 flex-shrink-0">
          <div>
            <p className="font-bold text-xl tracking-tight">Chase your goals!</p>
            <p className="text-sm text-warmgray dark:text-neutral-400 mt-0.5">
              {fmt(available, currency)} to split across goals
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center
              justify-center active:scale-90 transition-transform flex-shrink-0 mt-0.5">
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Equal split button */}
        <div className="px-5 pb-3 flex-shrink-0">
          <button
            onClick={splitEvenly}
            className="h-8 px-4 rounded-full bg-sapphire/12 text-sapphire text-xs font-semibold
              active:scale-95 transition-transform">
            Split evenly between {goals.length} goal{goals.length !== 1 ? 's' : ''}
          </button>
        </div>

        {/* Goal rows */}
        <div className="overflow-y-auto flex-1 px-5 space-y-3 pb-2">
          {goals.map(g => {
            const p = percents[g.id] ?? 0;
            const amt = Math.round((p / 100) * available * 100) / 100;
            const goalPct = pct(g.currentAmount, g.targetAmount);

            return (
              <div key={g.id} className="glass rounded-2xl p-3.5">
                {/* Goal header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: g.color }} />
                  <span className="text-sm font-semibold truncate flex-1">
                    {g.emoji} {g.name}
                  </span>
                  <span className="text-xs text-warmgray dark:text-neutral-400 flex-shrink-0">
                    {goalPct}% funded
                  </span>
                </div>

                {/* Stepper row */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjust(g.id, -5)}
                    className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center
                      justify-center text-base font-bold active:scale-90 transition-transform flex-shrink-0">
                    −
                  </button>

                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={p === 0 ? '' : p}
                        onChange={e => setPct(g.id, parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        max="100"
                        className="w-14 text-center font-bold text-xl bg-transparent outline-none"
                      />
                      <span className="text-warmgray dark:text-neutral-400 font-semibold text-sm">%</span>
                    </div>
                    <span className={`text-sm font-semibold ${amt > 0 ? 'text-sapphire' : 'text-warmgray dark:text-neutral-500'}`}>
                      {amt > 0 ? `→ ${fmt(amt, currency)}` : '—'}
                    </span>
                  </div>

                  <button
                    onClick={() => adjust(g.id, 5)}
                    className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center
                      justify-center text-base font-bold active:scale-90 transition-transform flex-shrink-0">
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pt-3 pb-6 flex-shrink-0 border-t border-black/5 dark:border-white/8 space-y-3">
          <div className="flex justify-between text-sm">
            <span className={overLimit ? 'text-terra font-medium' : 'text-warmgray dark:text-neutral-400'}>
              {overLimit
                ? `${totalPct}% — over 100%, reduce some amounts`
                : `${totalPct}% allocated · ${fmt(totalAmt, currency)}`}
            </span>
            {!overLimit && (
              <span className="text-warmgray dark:text-neutral-400">
                {fmt(remainAmt, currency)} free
              </span>
            )}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full h-12 rounded-full bg-burgundy text-white font-semibold text-sm
              active:scale-[0.97] transition-transform shadow-lg shadow-burgundy/30
              disabled:opacity-40 disabled:active:scale-100">
            {canConfirm ? `Allocate ${fmt(totalAmt, currency)}` : 'Set percentages to allocate'}
          </button>
        </div>
      </div>
    </>
  );
}
