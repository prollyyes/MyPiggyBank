'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { storage } from '@/lib/storage';
import { uid, today, CATEGORIES } from '@/lib/utils';
import { pct } from '@/lib/utils';
import type { CurrencyCode, EntryType, Goal } from '@/lib/types';

const CURRENCIES: CurrencyCode[] = ['EUR', 'USD', 'GBP', 'JPY', 'PLN', 'CHF'];

const INCOME_CATS = [
  { id: 'salary',    label: 'Salary',    emoji: '💼' },
  { id: 'freelance', label: 'Freelance', emoji: '💻' },
  { id: 'gift',      label: 'Gift',      emoji: '🎁' },
  { id: 'other',     label: 'Other',     emoji: '📦' },
];

const EXPENSE_CATS = CATEGORIES.filter(c => c.id !== 'savings');

const TABS: { type: EntryType; label: string; hint: string }[] = [
  { type: 'income',  label: 'Income',  hint: 'Money you received'       },
  { type: 'expense', label: 'Expense', hint: 'Money you spent'          },
  { type: 'savings', label: 'Savings', hint: 'Allocate toward a goal'   },
];

export default function NewEntry() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const settings = storage.getSettings();

  const [type, setType]               = useState<EntryType>('expense');
  const [amount, setAmount]           = useState('');
  const [currency, setCurrency]       = useState<CurrencyCode>(
    settings.primaryCurrency as CurrencyCode ?? 'EUR'
  );
  const [category, setCategory]       = useState(EXPENSE_CATS[0].id);
  const [incomeCategory, setIncomeCat]= useState(INCOME_CATS[0].id);
  const [goalId, setGoalId]           = useState('');
  const [note, setNote]               = useState('');
  const [date, setDate]               = useState(today());

  useEffect(() => { setGoals(storage.getGoals()); }, []);

  function handleSave() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    if (type === 'savings' && !goalId) return;

    const entries = storage.getEntries();
    entries.push({
      id: uid(),
      type,
      amount: amt,
      currency,
      category: type === 'income'
        ? incomeCategory
        : type === 'savings'
          ? 'savings'
          : category,
      goalId: type === 'savings' ? goalId : undefined,
      note: note.trim() || undefined,
      date,
    });
    storage.saveEntries(entries);

    if (type === 'savings') {
      const goalsArr = storage.getGoals();
      const idx = goalsArr.findIndex(g => g.id === goalId);
      if (idx !== -1) {
        goalsArr[idx] = {
          ...goalsArr[idx],
          currentAmount: goalsArr[idx].currentAmount + amt,
        };
        storage.saveGoals(goalsArr);
      }
      router.push(`/entries/saved?goalId=${goalId}&amount=${amt}`);
      return;
    }

    router.back();
  }

  const canSave = (() => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return false;
    if (type === 'savings' && !goalId) return false;
    return true;
  })();

  const activeTab = TABS.find(t => t.type === type)!;

  return (
    <div className="page-enter pb-nav min-h-full">
      <PageHeader title="Add Entry" back />

      <main className="px-4 pt-2 space-y-4">
        {/* Type tabs */}
        <div className="glass rounded-full p-1 flex">
          {TABS.map(t => (
            <button key={t.type} onClick={() => setType(t.type)}
              className={`flex-1 h-10 rounded-full text-sm font-semibold
                transition-all duration-200 active:scale-95
                ${type === t.type
                  ? 'bg-burgundy text-white shadow-sm'
                  : 'text-warmgray dark:text-neutral-400'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-warmgray dark:text-neutral-500 text-center -mt-1">
          {activeTab.hint}
        </p>

        {/* Amount */}
        <div className="glass rounded-3xl p-5 text-center">
          <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider mb-3">
            Amount
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold text-warmgray">{currency}</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-4xl font-bold bg-transparent outline-none w-36 text-center"
              min="0"
              step="0.01"
              autoFocus
            />
          </div>
          <div className="flex justify-center gap-2 mt-3 flex-wrap">
            {CURRENCIES.map(c => (
              <button key={c} onClick={() => setCurrency(c)}
                className={`h-7 px-3 rounded-full text-xs font-medium
                  active:scale-95 transition-all duration-150
                  ${currency === c
                    ? 'bg-burgundy text-white'
                    : 'bg-black/5 dark:bg-white/10 text-warmgray dark:text-neutral-400'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="glass rounded-3xl p-4 space-y-2">
          <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
            Date
          </p>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full h-11 bg-black/5 dark:bg-white/10 rounded-2xl px-4 text-sm
              outline-none focus:ring-2 focus:ring-burgundy/30 transition-all"
          />
        </div>

        {/* Income categories */}
        {type === 'income' && (
          <div className="glass rounded-3xl p-4 space-y-3">
            <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {INCOME_CATS.map(cat => (
                <button key={cat.id} onClick={() => setIncomeCat(cat.id)}
                  className={`h-9 px-4 rounded-full text-sm font-medium flex items-center gap-1.5
                    active:scale-95 transition-all duration-150
                    ${incomeCategory === cat.id
                      ? 'bg-burgundy text-white shadow-sm shadow-burgundy/30'
                      : 'bg-black/5 dark:bg-white/10'}`}>
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Expense categories */}
        {type === 'expense' && (
          <div className="glass rounded-3xl p-4 space-y-3">
            <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATS.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className={`h-9 px-4 rounded-full text-sm font-medium flex items-center gap-1.5
                    active:scale-95 transition-all duration-150
                    ${category === cat.id
                      ? 'bg-burgundy text-white shadow-sm shadow-burgundy/30'
                      : 'bg-black/5 dark:bg-white/10'}`}>
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Savings: goal picker (required) */}
        {type === 'savings' && (
          <div className="glass rounded-3xl p-4 space-y-3">
            <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
              Goal <span className="normal-case font-normal text-terra">(required)</span>
            </p>
            {goals.length === 0 ? (
              <p className="text-sm text-warmgray dark:text-neutral-400 text-center py-3">
                Create a goal first to allocate savings toward it.
              </p>
            ) : (
              <div className="space-y-2">
                {goals.map(g => {
                  const progress = pct(g.currentAmount, g.targetAmount);
                  return (
                    <button key={g.id} onClick={() => setGoalId(g.id)}
                      className={`w-full rounded-2xl px-4 py-3 flex items-center gap-3
                        active:scale-[0.98] transition-all duration-150
                        ${goalId === g.id
                          ? 'bg-burgundy/10 ring-1 ring-burgundy/30'
                          : 'bg-black/5 dark:bg-white/10'}`}>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: g.color }} />
                      <span className="text-lg flex-shrink-0">{g.emoji}</span>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate">{g.name}</p>
                        <div className="h-1 rounded-full bg-black/10 dark:bg-white/10 mt-1 overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{ width: `${progress}%`, backgroundColor: g.color }} />
                        </div>
                      </div>
                      <span className="text-xs text-warmgray dark:text-neutral-400 flex-shrink-0">
                        {progress}%
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Note */}
        <div className="glass rounded-3xl p-4 space-y-2">
          <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
            Note <span className="normal-case font-normal">(optional)</span>
          </p>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note..."
            className="w-full h-11 bg-black/5 dark:bg-white/10 rounded-2xl px-4 text-sm
              outline-none focus:ring-2 focus:ring-burgundy/30 transition-all"
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full h-12 rounded-full bg-burgundy text-white font-semibold text-sm
            active:scale-[0.97] transition-transform duration-150 shadow-lg shadow-burgundy/30
            disabled:opacity-40 disabled:active:scale-100 mb-4">
          Save {type === 'income' ? 'income' : type === 'expense' ? 'expense' : 'savings'}
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
