import type { Goal, Entry, Alert } from './types';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function generateAlerts(
  goals: Goal[],
  entries: Entry[],
  existing: Alert[],
  monthlyBudget = 0,
): Alert[] {
  const now = new Date();
  const result: Alert[] = [];

  const dismissed = new Set(
    existing.filter(a => a.dismissed).map(a => `${a.goalId}:${a.type}`),
  );
  const active = new Set(
    existing.filter(a => !a.dismissed).map(a => `${a.goalId}:${a.type}`),
  );

  // ── Budget pace alert (not tied to a specific goal) ──────────────────────
  const thisMonth = now.toISOString().slice(0, 7);
  const loggedIncome = entries
    .filter(e => e.type === 'income' && e.date.startsWith(thisMonth))
    .reduce((s, e) => s + e.amount, 0);
  const totalMonthlyIncome = monthlyBudget + loggedIncome;

  if (totalMonthlyIncome > 0) {
    const monthExpenses = entries
      .filter(e => e.type === 'expense' && e.date.startsWith(thisMonth))
      .reduce((s, e) => s + e.amount, 0);
    const monthSavings = entries
      .filter(e => e.type === 'savings' && e.date.startsWith(thisMonth))
      .reduce((s, e) => s + e.amount, 0);
    const ratio = (monthExpenses + monthSavings) / totalMonthlyIncome;
    const budgetKey = 'budget:pace';
    if (ratio > 0.9 && !dismissed.has(budgetKey) && !active.has(budgetKey)) {
      result.push({
        id: uid(),
        goalId: 'budget',
        type: 'pace',
        message: `You've used ${Math.round(ratio * 100)}% of this month's budget. Consider reviewing your expenses.`,
        createdAt: now.toISOString(),
        dismissed: false,
      });
    }
  }

  // ── Per-goal alerts ───────────────────────────────────────────────────────
  const spendLast30 = entries
    .filter(e => {
      const diff = (now.getTime() - new Date(e.date).getTime()) / 86_400_000;
      return e.type === 'expense' && diff <= 30;
    })
    .reduce((s, e) => s + e.amount, 0);

  const dailyPace = spendLast30 / 30;

  for (const goal of goals) {
    if (goal.currentAmount >= goal.targetAmount) continue;

    const deadline = new Date(goal.deadline);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);
    const remaining = goal.targetAmount - goal.currentAmount;
    const pct = goal.currentAmount / goal.targetAmount;

    // Deadline alert: < 45 days, < 75% funded
    const dKey = `${goal.id}:deadline`;
    if (daysLeft > 0 && daysLeft < 45 && pct < 0.75 && !dismissed.has(dKey) && !active.has(dKey)) {
      result.push({
        id: uid(),
        goalId: goal.id,
        type: 'deadline',
        message: `${goal.name} is ${Math.round(pct * 100)}% funded — only ${daysLeft} day${daysLeft === 1 ? '' : 's'} left.`,
        createdAt: now.toISOString(),
        dismissed: false,
      });
    }

    // Pace alert: spending pace may delay the goal
    const pKey = `${goal.id}:pace`;
    if (
      daysLeft > 0 &&
      dailyPace * daysLeft > remaining * 1.5 &&
      !dismissed.has(pKey) &&
      !active.has(pKey)
    ) {
      result.push({
        id: uid(),
        goalId: goal.id,
        type: 'pace',
        message: `Your spending pace may delay reaching "${goal.name}" by its deadline.`,
        createdAt: now.toISOString(),
        dismissed: false,
      });
    }
  }

  return result;
}
