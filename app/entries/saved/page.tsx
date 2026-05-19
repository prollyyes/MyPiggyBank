'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { storage } from '@/lib/storage';
import { fmt, convert } from '@/lib/currency';
import { pct } from '@/lib/utils';
import type { Goal } from '@/lib/types';

function SavedContent() {
  const router = useRouter();
  const params = useSearchParams();
  const goalId = params.get('goalId');
  const amount = parseFloat(params.get('amount') ?? '0');

  const [goal, setGoal] = useState<Goal | null>(null);
  const settings = storage.getSettings();

  useEffect(() => {
    if (!goalId) { router.replace('/'); return; }
    const g = storage.getGoals().find(x => x.id === goalId);
    if (!g) { router.replace('/'); return; }
    setGoal(g);
  }, [goalId, router]);

  if (!goal) return <div className="min-h-screen" />;

  const progress = pct(goal.currentAmount, goal.targetAmount);
  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-10 pt-16">
      {/* Confetti-style success icon */}
      <div className="w-20 h-20 rounded-full bg-burgundy/10 flex items-center justify-center mb-6">
        <span className="text-4xl">🎉</span>
      </div>
      <h1 className="text-2xl font-bold mb-1 tracking-tight">Entry saved!</h1>
      <p className="text-warmgray dark:text-neutral-400 text-sm mb-8 text-center">
        {fmt(amount, goal.currency)} added toward your goal.
      </p>

      {/* Variant B: Goal Progress Card */}
      <div className="w-full glass rounded-3xl p-5 shadow-lg shadow-black/5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{goal.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{goal.name}</p>
            <p className="text-xs text-warmgray dark:text-neutral-400">
              {fmt(goal.currentAmount, goal.currency)} of {fmt(goal.targetAmount, goal.currency)}
            </p>
          </div>
          <span className="text-sm font-bold text-burgundy dark:text-burgundy-light">
            {progress}%
          </span>
        </div>

        {/* Animated progress bar */}
        <div className="h-3 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full progress-bar-fill"
            style={{ width: `${progress}%`, backgroundColor: goal.color }}
          />
        </div>

        {progress < 100 ? (
          <p className="text-xs text-warmgray dark:text-neutral-400 mt-2">
            {fmt(remaining, goal.currency)} left to reach your goal
          </p>
        ) : (
          <p className="text-xs font-semibold text-burgundy dark:text-burgundy-light mt-2">
            🎊 Goal reached!
          </p>
        )}

        {/* Pace insight */}
        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
          <p className="text-xs text-warmgray dark:text-neutral-400">
            <span className="font-medium text-charcoal dark:text-neutral-200">
              {fmt(amount, goal.currency)}
            </span>{' '}
            added this session — great progress!
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full flex gap-3">
        <Link
          href="/entries/new"
          className="flex-1 h-12 rounded-full glass font-semibold text-sm
            flex items-center justify-center
            active:scale-[0.97] transition-transform duration-150"
        >
          Add another
        </Link>
        <Link
          href="/"
          className="flex-1 h-12 rounded-full bg-burgundy text-white font-semibold text-sm
            flex items-center justify-center
            active:scale-[0.97] transition-transform duration-150
            shadow-lg shadow-burgundy/30"
        >
          Done
        </Link>
      </div>
    </div>
  );
}

export default function EntrySaved() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SavedContent />
    </Suspense>
  );
}
