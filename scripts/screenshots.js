/**
 * Automated P4 screenshots for the LaTeX report.
 * Run from the webapp root with:  node scripts/screenshots.js
 * The dev server must be running on http://localhost:3000 first.
 */

const { chromium } = require('@playwright/test');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR  = path.join(__dirname, '../../mypiggybank_prototypes/figures/prototype4');

// Realistic demo data — Marco's account, May 2026
const GOALS = [
  { id: 'g1', name: 'Trip to Japan',  emoji: '🏔️', color: '#CC5C44',
    targetAmount: 3000, currentAmount: 840,  currency: 'EUR',
    deadline: '2026-12-31', priority: 'high',   createdAt: '2026-01-10' },
  { id: 'g2', name: 'New Laptop',     emoji: '💻', color: '#54709C',
    targetAmount: 1200, currentAmount: 320,  currency: 'EUR',
    deadline: '2026-09-30', priority: 'medium', createdAt: '2026-02-05' },
  { id: 'g3', name: 'Emergency Fund', emoji: '🏦', color: '#8A4826',
    targetAmount: 5000, currentAmount: 1200, currency: 'EUR',
    deadline: '2027-12-31', priority: 'high',   createdAt: '2026-01-01' },
];

const ENTRIES = [
  { id: 'e1', type: 'income',  amount: 2500, currency: 'EUR', category: 'salary',    date: '2026-05-01' },
  { id: 'e2', type: 'savings', amount: 200,  currency: 'EUR', category: 'savings',   goalId: 'g1', note: 'Japan fund',      date: '2026-05-03' },
  { id: 'e3', type: 'savings', amount: 150,  currency: 'EUR', category: 'savings',   goalId: 'g2', note: 'Laptop fund',     date: '2026-05-05' },
  { id: 'e4', type: 'expense', amount: 30,   currency: 'EUR', category: 'food',      date: '2026-05-08', note: 'Dinner out' },
  { id: 'e5', type: 'expense', amount: 50,   currency: 'EUR', category: 'transport', date: '2026-05-10' },
  { id: 'e6', type: 'expense', amount: 180,  currency: 'EUR', category: 'housing',   date: '2026-05-12' },
  { id: 'e7', type: 'expense', amount: 95,   currency: 'EUR', category: 'shopping',  date: '2026-05-14' },
  { id: 'e8', type: 'savings', amount: 100,  currency: 'EUR', category: 'savings',   goalId: 'g3', note: 'Emergency fund', date: '2026-05-16' },
];

const ALERTS = [
  { id: 'a1', goalId: 'budget', type: 'pace',
    message: "You've used over 90% of your May budget — keep an eye on spending.",
    createdAt: '2026-05-20T10:00:00.000Z', dismissed: false },
  { id: 'a2', goalId: 'g1', type: 'deadline',
    message: 'Trip to Japan: 224 days left — currently 28% funded (€840 of €3,000).',
    createdAt: '2026-05-20T10:00:00.000Z', dismissed: false },
];

function makeSettings(theme = 'light') {
  return {
    primaryCurrency: 'EUR', managedCurrencies: ['USD'],
    theme, onboardingComplete: true, name: 'Marco', monthlyBudget: 0,
  };
}

async function seed(page, theme = 'light') {
  await page.addInitScript(({ goals, entries, alerts, settings }) => {
    localStorage.setItem('mpb.goals',    JSON.stringify(goals));
    localStorage.setItem('mpb.entries',  JSON.stringify(entries));
    localStorage.setItem('mpb.alerts',   JSON.stringify(alerts));
    localStorage.setItem('mpb.settings', JSON.stringify(settings));
  }, {
    goals: GOALS, entries: ENTRIES, alerts: ALERTS,
    settings: makeSettings(theme),
  });
}

async function go(page, url) {
  await page.goto(BASE_URL + url, { waitUntil: 'networkidle' });
  // Extra wait for React hydration and CSS transitions
  await page.waitForTimeout(600);
}

async function shot(page, name) {
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${name}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // ── 1. Dashboard light ──────────────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await seed(page, 'light');
    await go(page, '/');
    await page.waitForSelector('text=Trip to Japan');
    await shot(page, 'dashboard_light.png');
    await ctx.close();
  }

  // ── 2. Dashboard dark ───────────────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await seed(page, 'dark');
    await go(page, '/');
    await page.waitForSelector('text=Trip to Japan');
    await shot(page, 'dashboard_dark.png');
    await ctx.close();
  }

  // ── 3. Entry form (expense tab, pre-filled) ─────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await seed(page);
    await go(page, '/entries/new');
    // Expense is the default tab; fill in amount and note
    await page.locator('input[type="number"]').first().fill('30');
    await page.locator('input[placeholder*="note" i], input[placeholder*="optional" i]').first().fill('Dinner out').catch(() => {});
    await page.waitForTimeout(300);
    await shot(page, 'entry_form.png');
    await ctx.close();
  }

  // ── 4. Post-save Variant B (goal progress card) ──────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await seed(page);
    await go(page, '/entries/saved?goalId=g1&amount=200');
    await page.waitForSelector('text=Trip to Japan');
    await shot(page, 'post_save_variantb.png');
    await ctx.close();
  }

  // ── 5. Goal creation wizard (step 0 — Identity) ──────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await seed(page);
    await go(page, '/goals/new');
    // Type a goal name so the form looks filled-in
    await page.locator('input[placeholder*="Goal name" i], input[type="text"]').first().fill('Holiday Fund');
    await page.waitForTimeout(300);
    await shot(page, 'goal_creation.png');
    await ctx.close();
  }

  // ── 6. Charts ────────────────────────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await seed(page);
    await go(page, '/charts');
    await page.waitForTimeout(800); // Let Recharts render
    await shot(page, 'charts.png');
    await ctx.close();
  }

  // ── 7. Alerts ────────────────────────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await seed(page);
    await go(page, '/alerts');
    await page.waitForTimeout(400);
    await shot(page, 'alerts.png');
    await ctx.close();
  }

  // ── 8. Currency settings ─────────────────────────────────────────────────────
  {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await seed(page);
    await go(page, '/settings/currency');
    await page.waitForTimeout(400);
    await shot(page, 'currency.png');
    await ctx.close();
  }

  await browser.close();
  console.log('\nAll 8 screenshots saved to figures/prototype4/');
}

main().catch(err => { console.error(err); process.exit(1); });
