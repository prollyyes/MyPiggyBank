'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { storage } from '@/lib/storage';
import { GOAL_COLORS, GOAL_EMOJIS } from '@/lib/utils';
import { CURRENCY_NAMES } from '@/lib/currency';
import type { CurrencyCode, GoalPriority, Goal } from '@/lib/types';
import { uid, today } from '@/lib/utils';

const CURRENCIES: CurrencyCode[] = ['EUR', 'USD', 'GBP', 'JPY', 'PLN', 'CHF'];
const PRIORITIES: GoalPriority[] = ['high', 'medium', 'low'];

export default function EditGoal() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [goal, setGoal]           = useState<Goal | null>(null);
  const [otherGoals, setOtherGoals] = useState<Goal[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const [name, setName]         = useState('');
  const [emoji, setEmoji]       = useState('🎯');
  const [color, setColor]       = useState(GOAL_COLORS[0]);
  const [target, setTarget]     = useState('');
  const [current, setCurrent]   = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('medium');

  useEffect(() => {
    const goals = storage.getGoals();
    const g = goals.find(x => x.id === id);
    if (!g) { router.replace('/'); return; }
    setGoal(g);
    setOtherGoals(goals.filter(x => x.id !== id));
    setName(g.name);
    setEmoji(g.emoji);
    setColor(g.color);
    setTarget(String(g.targetAmount));
    setCurrent(String(g.currentAmount));
    setCurrency(g.currency as CurrencyCode);
    setDeadline(g.deadline);
    setPriority(g.priority);
  }, [id, router]);

  function executeTransfer() {
    const amt = parseFloat(transferAmount);
    const currentAmt = parseFloat(current);
    if (!amt || amt <= 0 || amt > currentAmt || !transferTargetId) return;

    const goals = storage.getGoals();
    const fromIdx = goals.findIndex(x => x.id === id);
    const toIdx   = goals.findIndex(x => x.id === transferTargetId);
    if (fromIdx === -1 || toIdx === -1) return;

    goals[fromIdx] = { ...goals[fromIdx], currentAmount: goals[fromIdx].currentAmount - amt };
    goals[toIdx]   = { ...goals[toIdx],   currentAmount: goals[toIdx].currentAmount   + amt };
    storage.saveGoals(goals);

    // Log two entries so the history is traceable
    const entries = storage.getEntries();
    entries.push(
      { id: uid(), type: 'savings', amount: -amt, currency: currency,
        category: 'savings', goalId: id, note: `Transfer → ${goals[toIdx].name}`, date: today() },
      { id: uid(), type: 'savings', amount:  amt, currency: currency,
        category: 'savings', goalId: transferTargetId, note: `Transfer ← ${goals[fromIdx].name}`, date: today() },
    );
    storage.saveEntries(entries);

    setCurrent(String(goals[fromIdx].currentAmount));
    setGoal(goals[fromIdx]);
    setOtherGoals(goals.filter(x => x.id !== id));
    setShowTransfer(false);
    setTransferAmount('');
    setTransferTargetId('');
  }

  function save() {
    const goals = storage.getGoals();
    const idx = goals.findIndex(x => x.id === id);
    if (idx === -1) return;
    goals[idx] = {
      ...goals[idx],
      name: name.trim(),
      emoji,
      color,
      targetAmount:  parseFloat(target)  || 0,
      currentAmount: parseFloat(current) || 0,
      currency,
      deadline,
      priority,
    };
    storage.saveGoals(goals);
    router.back();
  }

  function deleteGoal() {
    const goals = storage.getGoals().filter(x => x.id !== id);
    storage.saveGoals(goals);
    router.replace('/');
  }

  if (!goal) return <div className="min-h-screen" />;

  const canSave = name.trim().length > 0 && parseFloat(target) > 0 && deadline !== '';

  return (
    <div className="page-enter pb-nav min-h-screen">
      <PageHeader title="Edit Goal" back />

      <main className="px-4 pt-2 space-y-4">
        {/* Emoji + Color */}
        <div className="glass rounded-3xl p-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider mb-2">
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
          <div>
            <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider mb-2">
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

        {/* Name */}
        <div className="glass rounded-3xl p-4 space-y-2">
          <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">Name</p>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full h-11 bg-black/5 dark:bg-white/10 rounded-2xl px-4 text-sm
              outline-none focus:ring-2 focus:ring-burgundy/30 transition-all"
          />
        </div>

        {/* Currency */}
        <div className="glass rounded-3xl p-4 space-y-3">
          <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">Currency</p>
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

        {/* Amounts */}
        <div className="glass rounded-3xl p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider mb-2">
              Target amount
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-warmgray">{currency}</span>
              <input type="number" value={target} onChange={e => setTarget(e.target.value)}
                className="w-full h-11 bg-black/5 dark:bg-white/10 rounded-2xl pl-14 pr-4 text-sm
                  outline-none focus:ring-2 focus:ring-burgundy/30 transition-all" min="1" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider mb-2">
              Current saved
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-warmgray">{currency}</span>
              <input type="number" value={current} onChange={e => setCurrent(e.target.value)}
                className="w-full h-11 bg-black/5 dark:bg-white/10 rounded-2xl pl-14 pr-4 text-sm
                  outline-none focus:ring-2 focus:ring-burgundy/30 transition-all" min="0" />
            </div>
          </div>
        </div>

        {/* Transfer savings */}
        {parseFloat(current) > 0 && otherGoals.length > 0 && (
          <div className="glass rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
                Transfer savings
              </p>
              <button
                onClick={() => { setShowTransfer(v => !v); setTransferAmount(''); setTransferTargetId(''); }}
                className="text-xs font-semibold text-sapphire active:opacity-60 transition-opacity">
                {showTransfer ? 'Cancel' : 'Move to another goal →'}
              </button>
            </div>

            {showTransfer && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-warmgray dark:text-neutral-400 mb-2">Transfer to</p>
                  <div className="space-y-2">
                    {otherGoals.map(g => (
                      <button key={g.id} onClick={() => setTransferTargetId(g.id)}
                        className={`w-full rounded-2xl px-3 py-2.5 flex items-center gap-2.5
                          active:scale-[0.98] transition-all duration-150
                          ${transferTargetId === g.id
                            ? 'bg-sapphire/10 ring-1 ring-sapphire/30'
                            : 'bg-black/5 dark:bg-white/10'}`}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                        <span className="text-sm font-medium truncate flex-1 text-left">{g.emoji} {g.name}</span>
                        <span className="text-xs text-warmgray dark:text-neutral-400 flex-shrink-0">
                          {Math.round((g.currentAmount / g.targetAmount) * 100)}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-warmgray dark:text-neutral-400 mb-2">
                    Amount <span className="text-warmgray/60">(max {currency} {current})</span>
                  </p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-warmgray">
                      {currency}
                    </span>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={e => setTransferAmount(e.target.value)}
                      placeholder="0.00"
                      min="0.01"
                      max={current}
                      step="0.01"
                      className="w-full h-11 bg-black/5 dark:bg-white/10 rounded-2xl pl-14 pr-4 text-sm
                        outline-none focus:ring-2 focus:ring-sapphire/30 transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={executeTransfer}
                  disabled={!transferTargetId || !transferAmount || parseFloat(transferAmount) <= 0
                    || parseFloat(transferAmount) > parseFloat(current)}
                  className="w-full h-11 rounded-full bg-sapphire text-white font-semibold text-sm
                    active:scale-[0.97] transition-transform shadow-sm shadow-sapphire/30
                    disabled:opacity-40 disabled:active:scale-100">
                  Transfer {transferAmount && parseFloat(transferAmount) > 0
                    ? `${currency} ${parseFloat(transferAmount).toFixed(2)}`
                    : 'savings'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Deadline */}
        <div className="glass rounded-3xl p-4 space-y-2">
          <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">Deadline</p>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
            className="w-full h-11 bg-black/5 dark:bg-white/10 rounded-2xl px-4 text-sm
              outline-none focus:ring-2 focus:ring-burgundy/30 transition-all" />
        </div>

        {/* Priority */}
        <div className="glass rounded-3xl p-4 space-y-3">
          <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">Priority</p>
          <div className="flex gap-2">
            {PRIORITIES.map(p => (
              <button key={p} onClick={() => setPriority(p)}
                className={`flex-1 h-10 rounded-full text-sm font-medium
                  active:scale-95 transition-all duration-150
                  ${priority === p
                    ? p === 'high'   ? 'bg-burgundy text-white'
                      : p === 'medium' ? 'bg-state-blue text-white'
                      : 'bg-warmgray/40 text-charcoal dark:text-white'
                    : 'bg-black/5 dark:bg-white/10 text-warmgray dark:text-neutral-400'}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={!canSave}
          className="w-full h-12 rounded-full bg-burgundy text-white font-semibold text-sm
            active:scale-[0.97] transition-transform duration-150 shadow-lg shadow-burgundy/30
            disabled:opacity-40 disabled:active:scale-100">
          Save changes
        </button>

        {/* Delete */}
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="w-full h-12 rounded-full glass font-semibold text-sm text-red-500
              active:scale-[0.97] transition-transform duration-150 mb-4">
            Delete goal
          </button>
        ) : (
          <div className="glass rounded-3xl p-4 space-y-3 mb-4">
            <p className="text-sm font-medium text-center">Delete "{name}"?</p>
            <p className="text-xs text-warmgray dark:text-neutral-400 text-center">
              This will permanently remove the goal and all its data.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)}
                className="flex-1 h-11 rounded-full bg-black/5 dark:bg-white/10 text-sm font-semibold
                  active:scale-[0.97] transition-transform duration-150">
                Cancel
              </button>
              <button onClick={deleteGoal}
                className="flex-1 h-11 rounded-full bg-red-500 text-white text-sm font-semibold
                  active:scale-[0.97] transition-transform duration-150">
                Delete
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
