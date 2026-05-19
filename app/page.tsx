'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, GripVertical, Pencil, PiggyBank } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import { storage } from '@/lib/storage';
import { generateAlerts } from '@/lib/alerts';
import { fmt, convert } from '@/lib/currency';
import { pct, daysUntil, today, uid } from '@/lib/utils';
import QuickAllocate from '@/components/QuickAllocate';
import type { Goal, Alert, Entry, CurrencyCode } from '@/lib/types';

export default function Dashboard() {
  const router = useRouter();
  const [goals, setGoals]         = useState<Goal[]>([]);
  const [entries, setEntries]     = useState<Entry[]>([]);
  const [alerts, setAlerts]       = useState<Alert[]>([]);
  const [settings, setSettings]   = useState(storage.getSettings());
  const [ready, setReady]         = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);

  // Drag state
  const [dragId, setDragId]       = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const dragStartY  = useRef(0);
  const cardRefs    = useRef<Record<string, HTMLDivElement | null>>({});
  const rafRef      = useRef<number | null>(null);
  const latestY     = useRef(0);

  useEffect(() => {
    const s = storage.getSettings();
    if (!s.onboardingComplete) { router.replace('/onboarding'); return; }
    setSettings(s);
    const g = storage.getGoals();
    const e = storage.getEntries();
    const existing = storage.getAlerts();
    const newAlerts = generateAlerts(g, e, existing, s.monthlyBudget ?? 0);
    const merged = [...existing, ...newAlerts];
    storage.saveAlerts(merged);
    setGoals(g);
    setEntries(e);
    setAlerts(merged.filter(a => !a.dismissed));
    setReady(true);
  }, [router]);

  function handleAllocate(allocations: { goalId: string; amount: number }[]) {
    const goalsArr = storage.getGoals();
    const entriesArr = storage.getEntries();
    for (const { goalId, amount } of allocations) {
      if (amount <= 0) continue;
      const idx = goalsArr.findIndex(g => g.id === goalId);
      if (idx === -1) continue;
      goalsArr[idx] = { ...goalsArr[idx], currentAmount: goalsArr[idx].currentAmount + amount };
      entriesArr.push({
        id: uid(), type: 'savings', amount, currency: cur,
        category: 'savings', goalId,
        note: 'Quick allocation', date: today(),
      });
    }
    storage.saveGoals(goalsArr);
    storage.saveEntries(entriesArr);
    setGoals(goalsArr);
    setEntries(entriesArr);
    setShowAllocate(false);
  }

  // Compute per-card translateY for fluid displacement
  const getCardTranslate = useCallback((goalId: string): number => {
    if (!dragId) return 0;
    if (goalId === dragId) return dragOffsetY;
    if (!dragOverId) return 0;

    const fromIdx = goals.findIndex(g => g.id === dragId);
    const toIdx   = goals.findIndex(g => g.id === dragOverId);
    const myIdx   = goals.findIndex(g => g.id === goalId);
    if (fromIdx === -1 || toIdx === -1 || myIdx === -1) return 0;

    const draggedEl = cardRefs.current[dragId];
    const step = draggedEl ? draggedEl.offsetHeight + 12 : 120;

    if (fromIdx < toIdx && myIdx > fromIdx && myIdx <= toIdx) return -step;
    if (fromIdx > toIdx && myIdx >= toIdx && myIdx < fromIdx) return  step;
    return 0;
  }, [dragId, dragOverId, dragOffsetY, goals]);

  function onDragStart(e: React.PointerEvent, id: string) {
    setDragId(id);
    setDragOffsetY(0);
    dragStartY.current = e.clientY;
    latestY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDragMove(e: React.PointerEvent) {
    if (!dragId) return;
    latestY.current = e.clientY;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const y = latestY.current;
      setDragOffsetY(y - dragStartY.current);

      // Determine which card is being hovered
      for (const [id, el] of Object.entries(cardRefs.current)) {
        if (!el || id === dragId) continue;
        const rect = el.getBoundingClientRect();
        if (y > rect.top && y < rect.bottom) {
          setDragOverId(id);
          return;
        }
      }
      // Don't reset dragOverId when in a gap — keep last valid target
    });
  }

  function onDragEnd() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (dragId && dragOverId && dragId !== dragOverId) {
      setGoals(prev => {
        const next = [...prev];
        const fromIdx = next.findIndex(g => g.id === dragId);
        const toIdx   = next.findIndex(g => g.id === dragOverId);
        if (fromIdx !== -1 && toIdx !== -1) {
          const [item] = next.splice(fromIdx, 1);
          next.splice(toIdx, 0, item);
        }
        storage.saveGoals(next);
        return next;
      });
    }
    setDragId(null);
    setDragOverId(null);
    setDragOffsetY(0);
  }

  const cur = settings.primaryCurrency as CurrencyCode;
  const activeAlerts = alerts.filter(a => !a.dismissed).length;

  // Skeleton while loading
  if (!ready) return (
    <div className="pb-nav min-h-screen">
      <PageHeader title="MyPiggyBank" showThemeToggle />
      <main className="px-4 space-y-5">
        <div className="h-4 w-28 rounded-full bg-black/6 dark:bg-white/8 animate-pulse" />
        <div className="glass rounded-3xl p-5 h-36 animate-pulse" />
        <div className="space-y-3">
          {[0, 1].map(i => (
            <div key={i} className="glass rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );

  const totalBalance = goals.reduce((s, g) => s + convert(g.currentAmount, g.currency, cur), 0);
  const totalTarget  = goals.reduce((s, g) => s + convert(g.targetAmount,  g.currency, cur), 0);

  // This month budget breakdown
  const thisMonth = today().slice(0, 7);
  const monthEntries = entries.filter(e => e.date.slice(0, 7) === thisMonth);
  const loggedIncome = monthEntries
    .filter(e => e.type === 'income')
    .reduce((s, e) => s + convert(e.amount, e.currency as CurrencyCode, cur), 0);
  const totalIncome = (settings.monthlyBudget ?? 0) + loggedIncome;
  const totalExpenses = monthEntries
    .filter(e => e.type === 'expense')
    .reduce((s, e) => s + convert(e.amount, e.currency as CurrencyCode, cur), 0);
  const totalSavedMonth = monthEntries
    .filter(e => e.type === 'savings')
    .reduce((s, e) => s + convert(e.amount, e.currency as CurrencyCode, cur), 0);
  const available = totalIncome - totalExpenses - totalSavedMonth;
  const showMonthCard = totalIncome > 0 || totalExpenses > 0 || totalSavedMonth > 0;

  const expPct  = totalIncome > 0 ? Math.min(100, (totalExpenses / totalIncome) * 100) : 0;
  const savePct = totalIncome > 0 ? Math.min(100 - expPct, (totalSavedMonth / totalIncome) * 100) : 0;

  return (
    <div className="page-enter pb-nav min-h-screen">
      <PageHeader
        title="MyPiggyBank"
        showThemeToggle
        right={
          activeAlerts > 0 ? (
            <Link
              href="/alerts"
              className="relative active:scale-[0.88] transition-transform duration-150 select-none
                text-charcoal dark:text-neutral-200"
            >
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full
                bg-burgundy text-white text-[9px] flex items-center justify-center font-bold">
                {activeAlerts}
              </span>
              <Bell size={20} strokeWidth={1.75} />
            </Link>
          ) : undefined
        }
      />

      <main className="px-4 space-y-5">
        {/* Greeting */}
        <p className="text-warmgray dark:text-neutral-400 text-sm px-1">
          Hello, {settings.name || 'there'}
        </p>

        {/* Total saved hero */}
        <div className="glass rounded-3xl p-5">
          <p className="text-[11px] font-semibold text-warmgray dark:text-neutral-400
            uppercase tracking-widest mb-1.5">
            Total Saved
          </p>
          <p className="text-4xl font-bold tracking-tight mb-1">
            {fmt(totalBalance, cur)}
          </p>
          <p className="text-sm text-warmgray dark:text-neutral-400">
            {fmt(Math.max(0, totalTarget - totalBalance), cur)} remaining toward goals
            {goals.length > 0 && ` · ${goals.length} goal${goals.length !== 1 ? 's' : ''}`}
          </p>

          {totalTarget > 0 && (
            <div className="mt-4">
              <div className="h-1.5 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-burgundy progress-bar-fill"
                  style={{ width: `${pct(totalBalance, totalTarget)}%` }}
                />
              </div>
              <p className="text-[11px] text-warmgray dark:text-neutral-500 mt-1.5 text-right">
                {pct(totalBalance, totalTarget)}% of total goal
              </p>
            </div>
          )}
        </div>

        {/* This month breakdown */}
        {showMonthCard && (
          <div className="glass rounded-3xl p-5">
            <p className="text-[11px] font-semibold text-warmgray dark:text-neutral-400
              uppercase tracking-widest mb-3">
              This Month
            </p>

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber flex-shrink-0" />
                  <span className="text-warmgray dark:text-neutral-400">Income</span>
                </div>
                <span className="font-semibold">{fmt(totalIncome, cur)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-terra flex-shrink-0" />
                  <span className="text-warmgray dark:text-neutral-400">Expenses</span>
                </div>
                <span className="font-semibold">{fmt(totalExpenses, cur)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sapphire flex-shrink-0" />
                  <span className="text-warmgray dark:text-neutral-400">Saved toward goals</span>
                </div>
                <span className="font-semibold">{fmt(totalSavedMonth, cur)}</span>
              </div>
            </div>

            {/* Stacked usage bar */}
            {totalIncome > 0 && (
              <div className="h-1.5 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden mb-3">
                <div className="h-full flex">
                  <div style={{ width: `${expPct}%`,  backgroundColor: '#CC5C44' }} />
                  <div style={{ width: `${savePct}%`, backgroundColor: '#54709C' }} />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/8">
              <span className="text-sm font-semibold">Available</span>
              <span className={`text-base font-bold ${available < 0 ? 'text-terra' : ''}`}>
                {available < 0
                  ? `${fmt(Math.abs(available), cur)} over`
                  : fmt(available, cur)
                }
              </span>
            </div>

            {/* Quick allocate CTA */}
            {available > 0 && goals.length > 0 && (
              <button
                onClick={() => setShowAllocate(true)}
                className="w-full mt-1 h-10 rounded-full bg-sapphire/10 text-sapphire text-sm font-semibold
                  active:scale-[0.97] transition-all duration-150 flex items-center justify-center gap-1.5">
                🐷 Done? Chase your goals!
              </button>
            )}
          </div>
        )}

        {/* Goals */}
        <section>
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className="text-sm font-semibold tracking-tight">Savings Goals</h2>
            <Link
              href="/goals/new"
              className="text-xs font-semibold text-burgundy dark:text-burgundy-light
                active:opacity-55 transition-opacity duration-150"
            >
              + New goal
            </Link>
          </div>

          {goals.length === 0 ? (
            <EmptyGoals />
          ) : (
            <div className="space-y-3">
              {goals.map(goal => {
                const translate = getCardTranslate(goal.id);
                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    primary={cur}
                    isDragging={dragId === goal.id}
                    isDragOver={dragOverId === goal.id}
                    translate={translate}
                    onPointerDown={e => onDragStart(e, goal.id)}
                    onPointerMove={onDragMove}
                    onPointerUp={onDragEnd}
                    ref={el => { cardRefs.current[goal.id] = el; }}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      <BottomNav />

      {showAllocate && (
        <QuickAllocate
          available={available}
          currency={cur}
          goals={goals}
          onClose={() => setShowAllocate(false)}
          onConfirm={handleAllocate}
        />
      )}
    </div>
  );
}

// ── Goal card ──────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal;
  primary: string;
  isDragging: boolean;
  isDragOver: boolean;
  translate: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp:   (e: React.PointerEvent) => void;
  ref: React.Ref<HTMLDivElement>;
}

const PRIORITY_COLORS: Record<string, { ring: string; badge: string }> = {
  high:   {
    ring:  'ring-1 ring-terra/35',
    badge: 'bg-terra/10 text-terra',
  },
  medium: {
    ring:  'ring-1 ring-sapphire/30',
    badge: 'bg-sapphire/10 text-sapphire',
  },
  low:    {
    ring:  '',
    badge: 'bg-black/5 dark:bg-white/10 text-warmgray',
  },
};

function GoalCard({
  goal, primary, isDragging, isDragOver, translate,
  onPointerDown, onPointerMove, onPointerUp, ref,
}: GoalCardProps) {
  const router = useRouter();
  const days     = daysUntil(goal.deadline);
  const progress = pct(goal.currentAmount, goal.targetAmount);
  const colors   = PRIORITY_COLORS[goal.priority] ?? PRIORITY_COLORS.low;

  return (
    <div
      ref={ref}
      style={{
        transform: `translateY(${translate}px)`,
        transition: isDragging
          ? 'none'
          : 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        zIndex: isDragging ? 50 : 'auto',
        willChange: isDragging ? 'transform' : 'auto',
        opacity: isDragging ? 0.55 : 1,
        scale: isDragging ? '1.04' : '1',
      }}
      className={`
        glass rounded-2xl p-4 select-none
        ${isDragging
          ? 'shadow-2xl shadow-black/20'
          : `shadow-sm ${isDragOver ? 'ring-2 ring-burgundy/40' : colors.ring}`}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          className="mt-0.5 cursor-grab active:cursor-grabbing touch-none flex-shrink-0
            text-warmgray/50 dark:text-neutral-500 active:text-warmgray
            transition-colors duration-150"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} strokeWidth={1.75} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-2.5">
            {/* Color dot + name */}
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: goal.color }}
            />
            <span className="font-semibold text-sm truncate">{goal.name}</span>

            {/* Priority badge */}
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full
              flex-shrink-0 ${colors.badge}`}>
              {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-black/7 dark:bg-white/10 overflow-hidden mb-2">
            <div
              className="h-full rounded-full progress-bar-fill transition-all duration-700"
              style={{ width: `${progress}%`, backgroundColor: goal.color }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-warmgray dark:text-neutral-400">
              {fmt(goal.currentAmount, goal.currency as CurrencyCode)}
              {' / '}
              {fmt(goal.targetAmount, goal.currency as CurrencyCode)}
            </span>
            <span className="font-semibold">{progress}%</span>
          </div>

          {/* Deadline + edit */}
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className={`font-medium ${
              days <= 0  ? 'text-terra' :
              days < 30  ? 'text-alert-orange' :
                           'text-warmgray dark:text-neutral-400'
            }`}>
              {days > 0 ? `${days}d left` : 'Deadline passed'}
            </span>
            <button
              onClick={() => router.push(`/goals/${goal.id}/edit`)}
              className="text-warmgray/60 dark:text-neutral-500
                active:text-burgundy transition-colors duration-150 p-1 -m-1"
              aria-label={`Edit ${goal.name}`}
            >
              <Pencil size={13} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyGoals() {
  return (
    <div className="glass rounded-3xl p-8 text-center">
      <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mx-auto mb-4
        text-warmgray dark:text-neutral-400">
        <PiggyBank size={28} strokeWidth={1.5} />
      </div>
      <p className="font-semibold mb-1">No goals yet</p>
      <p className="text-sm text-warmgray dark:text-neutral-400 mb-5">
        Create your first savings goal to get started.
      </p>
      <Link
        href="/goals/new"
        className="inline-flex h-11 items-center px-6 rounded-full
          bg-burgundy text-white text-sm font-semibold
          active:scale-[0.95] transition-transform duration-150
          shadow-lg shadow-burgundy/30"
      >
        Create a goal
      </Link>
    </div>
  );
}
