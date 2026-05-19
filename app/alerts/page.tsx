'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { storage } from '@/lib/storage';
import { fmt } from '@/lib/currency';
import type { Alert, Goal } from '@/lib/types';

const ALERT_META: Record<string, { label: string; icon: string; color: string }> = {
  deadline:   { label: 'Deadline Soon',  icon: '⏰', color: 'text-alert-orange' },
  pace:       { label: 'Off Track',      icon: '🐢', color: 'text-state-blue'   },
  milestone:  { label: 'Milestone',      icon: '🎉', color: 'text-burgundy'     },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [goals, setGoals]   = useState<Goal[]>([]);

  useEffect(() => {
    setGoals(storage.getGoals());
    setAlerts(storage.getAlerts().filter(a => !a.dismissed));
  }, []);

  function dismiss(id: string) {
    const all = storage.getAlerts().map(a =>
      a.id === id ? { ...a, dismissed: true } : a
    );
    storage.saveAlerts(all);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  function dismissAll() {
    const all = storage.getAlerts().map(a => ({ ...a, dismissed: true }));
    storage.saveAlerts(all);
    setAlerts([]);
  }

  const goalMap = Object.fromEntries(goals.map(g => [g.id, g]));

  return (
    <div className="page-enter pb-nav min-h-screen">
      <PageHeader title="Alerts" right={
        alerts.length > 0 ? (
          <button
            onClick={dismissAll}
            className="text-xs font-medium text-burgundy dark:text-burgundy-light
              active:opacity-60 transition-opacity duration-150">
            Clear all
          </button>
        ) : undefined
      } />

      <main className="px-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center mt-4">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-semibold mb-1">All clear</p>
            <p className="text-sm text-warmgray dark:text-neutral-400">
              No alerts right now. You're on track!
            </p>
          </div>
        ) : (
          alerts.map(alert => {
            const meta = ALERT_META[alert.type] ?? { label: alert.type, icon: '💡', color: 'text-warmgray' };
            const goal = alert.goalId ? goalMap[alert.goalId] : undefined;
            return (
              <div key={alert.id} className="glass rounded-3xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-0.5">{alert.message}</p>
                    {goal && (
                      <p className="text-xs text-warmgray dark:text-neutral-400">
                        {goal.emoji} {goal.name} — {fmt(goal.currentAmount, goal.currency)} / {fmt(goal.targetAmount, goal.currency)}
                      </p>
                    )}

                    {/* CTAs */}
                    <div className="flex gap-2 mt-3">
                      {goal && (alert.type === 'deadline' || alert.type === 'pace') && (
                        <Link
                          href={`/goals/${goal.id}/edit`}
                          className="h-8 px-4 rounded-full bg-burgundy/10 text-burgundy dark:text-burgundy-light
                            text-xs font-semibold flex items-center
                            active:scale-95 transition-all duration-150">
                          Adjust target
                        </Link>
                      )}
                      {alert.type === 'pace' && (
                        <Link
                          href={`/entries/new${goal ? `#goal-${goal.id}` : ''}`}
                          className="h-8 px-4 rounded-full bg-state-blue/10 text-state-blue
                            text-xs font-semibold flex items-center
                            active:scale-95 transition-all duration-150">
                          Add savings
                        </Link>
                      )}
                      <button
                        onClick={() => dismiss(alert.id)}
                        className="h-8 px-4 rounded-full bg-black/5 dark:bg-white/10
                          text-xs font-medium text-warmgray dark:text-neutral-400
                          active:scale-95 transition-all duration-150 ml-auto">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      <BottomNav />
    </div>
  );
}
