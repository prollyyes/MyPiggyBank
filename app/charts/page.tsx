'use client';

import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line,
  ResponsiveContainer,
} from 'recharts';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { storage } from '@/lib/storage';
import { fmt, convert } from '@/lib/currency';
import { pct, CATEGORIES } from '@/lib/utils';
import type { Goal, Entry, CurrencyCode } from '@/lib/types';

const TABS = ['By Goal', 'By Category', 'Over Time'] as const;
type Tab = typeof TABS[number];

export default function ChartsPage() {
  const [tab, setTab]         = useState<Tab>('By Goal');
  const [goals, setGoals]     = useState<Goal[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    setGoals(storage.getGoals());
    setEntries(storage.getEntries());
    setReady(true);
  }, []);

  const cur = storage.getSettings().primaryCurrency as CurrencyCode;

  // ── By Goal: pie of currentAmount per goal ──
  const goalPieData = goals
    .filter(g => g.currentAmount > 0)
    .map(g => ({
      name: `${g.emoji} ${g.name}`,
      value: Math.round(convert(g.currentAmount, g.currency, cur) * 100) / 100,
      color: g.color,
    }));

  // ── By Category: bar chart of expense totals per category ──
  const catMap: Record<string, number> = {};
  entries.filter(e => e.type === 'expense').forEach(e => {
    catMap[e.category] = (catMap[e.category] ?? 0) + convert(e.amount, e.currency, cur);
  });
  const catLabelMap = Object.fromEntries(CATEGORIES.map(c => [c.id, `${c.emoji} ${c.label}`]));
  const catData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, total]) => ({
      cat: catLabelMap[cat] ?? cat,
      total: Math.round(total * 100) / 100,
    }));

  // ── Over Time: cumulative savings allocations by month ──
  const sortedSavings = entries
    .filter(e => e.type === 'savings')
    .sort((a, b) => a.date.localeCompare(b.date));
  const monthlyMap: Record<string, number> = {};
  sortedSavings.forEach(e => {
    const month = e.date.slice(0, 7);
    monthlyMap[month] = (monthlyMap[month] ?? 0) + convert(e.amount, e.currency, cur);
  });
  let running = 0;
  const timeData = Object.entries(monthlyMap).map(([month, amt]) => {
    running += amt;
    return { month: month.slice(5), cumulative: Math.round(running * 100) / 100 };
  });

  const fmtTooltip = (value: unknown) => fmt(Number(value), cur);

  if (!ready) return <div className="min-h-screen" />;

  return (
    <div className="page-enter pb-nav min-h-screen">
      <PageHeader title="Charts" showThemeToggle />

      <main className="px-4 space-y-5">
        {/* Tab pills */}
        <div className="glass rounded-full p-1 flex">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 h-9 rounded-full text-xs font-semibold
                transition-all duration-200 active:scale-95
                ${tab === t ? 'bg-burgundy text-white shadow-sm' : 'text-warmgray dark:text-neutral-400'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── By Goal ── */}
        {tab === 'By Goal' && (
          <div className="space-y-4">
            {goalPieData.length === 0 ? (
              <EmptyChart message="No savings data yet." />
            ) : (
              <>
                <div className="glass rounded-3xl p-4 flex justify-center">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={goalPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {goalPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={fmtTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="glass rounded-3xl p-4 space-y-2">
                  {goalPieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-sm flex-1 truncate">{d.name}</span>
                      <span className="text-sm font-semibold">{fmt(d.value, cur)}</span>
                    </div>
                  ))}
                </div>
                {/* Progress bars */}
                <div className="glass rounded-3xl p-4 space-y-3">
                  <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider">
                    Goal progress
                  </p>
                  {goals.map(g => {
                    const progress = pct(g.currentAmount, g.targetAmount);
                    return (
                      <div key={g.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{g.emoji} {g.name}</span>
                          <span className="text-warmgray dark:text-neutral-400">{progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full progress-bar-fill"
                            style={{ width: `${progress}%`, backgroundColor: g.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── By Category ── */}
        {tab === 'By Category' && (
          <div className="space-y-4">
            {catData.length === 0 ? (
              <EmptyChart message="No expense entries yet." />
            ) : (
              <div className="glass rounded-3xl p-4">
                <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider mb-4">
                  Spending by category ({cur})
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={catData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="cat" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={fmtTooltip} />
                    <Bar dataKey="total" fill="#8A4826" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {catData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-warmgray dark:text-neutral-400">{d.cat}</span>
                      <span className="font-semibold">{fmt(d.total, cur)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Over Time ── */}
        {tab === 'Over Time' && (
          <div className="space-y-4">
            {timeData.length === 0 ? (
              <EmptyChart message="No entries yet to show a trend." />
            ) : (
              <div className="glass rounded-3xl p-4">
                <p className="text-xs font-medium text-warmgray dark:text-neutral-400 uppercase tracking-wider mb-4">
                  Cumulative savings ({cur})
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={timeData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={fmtTooltip} />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#8A4826"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#8A4826' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="glass rounded-3xl p-8 text-center">
      <p className="text-4xl mb-3">📊</p>
      <p className="font-semibold mb-1">No data yet</p>
      <p className="text-sm text-warmgray dark:text-neutral-400">{message}</p>
    </div>
  );
}
