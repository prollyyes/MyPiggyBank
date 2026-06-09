/**
 * Generates the 5 missing P1 placeholder screenshots + overview_grid.
 * P1 style: grayscale + lower contrast (softer / less refined than P2's crisp wireframe).
 * Run: node scripts/screenshots-p1.js  (dev server must be on :3000)
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const BASE_URL = 'http://localhost:3000';
const P1_DIR   = path.join(__dirname, '../../mypiggybank_prototypes/figures/prototype1');

// ── Shared test data (same as P2/P3 script) ──────────────────────────────────

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
  { id: 'e2', type: 'savings', amount: 200,  currency: 'EUR', category: 'savings',   goalId: 'g1', date: '2026-05-03' },
  { id: 'e3', type: 'savings', amount: 150,  currency: 'EUR', category: 'savings',   goalId: 'g2', date: '2026-05-05' },
  { id: 'e4', type: 'expense', amount: 30,   currency: 'EUR', category: 'food',      date: '2026-05-08', note: 'Dinner out' },
  { id: 'e5', type: 'expense', amount: 50,   currency: 'EUR', category: 'transport', date: '2026-05-10' },
  { id: 'e6', type: 'expense', amount: 180,  currency: 'EUR', category: 'housing',   date: '2026-05-12' },
  { id: 'e7', type: 'expense', amount: 95,   currency: 'EUR', category: 'shopping',  date: '2026-05-14' },
  { id: 'e8', type: 'savings', amount: 100,  currency: 'EUR', category: 'savings',   goalId: 'g3', date: '2026-05-16' },
];

const ALERTS = [
  { id: 'a1', goalId: 'budget', type: 'pace',
    message: "You've used over 90% of your May budget — keep an eye on spending.",
    createdAt: '2026-05-20T10:00:00.000Z', dismissed: false },
  { id: 'a2', goalId: 'g1', type: 'deadline',
    message: 'Trip to Japan: 224 days left — currently 28% funded (€840 of €3,000).',
    createdAt: '2026-05-20T10:00:00.000Z', dismissed: false },
];

const SETTINGS = {
  primaryCurrency: 'EUR', managedCurrencies: [],
  theme: 'light', onboardingComplete: true, name: 'Marco', monthlyBudget: 0,
};

// ── P1 CSS: softer contrast = rougher / sketchier feel vs P2's crisp wireframe
const P1_CSS = `
  * {
    backdrop-filter:         none !important;
    -webkit-backdrop-filter: none !important;
    box-shadow:              none !important;
    text-shadow:             none !important;
    animation:               none !important;
    transition:              none !important;
  }
  [class*="glass"] {
    background:   rgba(255,255,255,0.88) !important;
    border-color: rgba(0,0,0,0.20) !important;
  }
  /* Lower contrast than P2 → softer, less finished look */
  html {
    filter: grayscale(1) contrast(0.82) brightness(1.06) !important;
    background: #f5f5f5 !important;
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function newCtx(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await ctx.addInitScript(({ goals, entries, alerts, settings }) => {
    localStorage.setItem('mpb.goals',    JSON.stringify(goals));
    localStorage.setItem('mpb.entries',  JSON.stringify(entries));
    localStorage.setItem('mpb.alerts',   JSON.stringify(alerts));
    localStorage.setItem('mpb.settings', JSON.stringify(settings));
  }, { goals: GOALS, entries: ENTRIES, alerts: ALERTS, settings: SETTINGS });
  return ctx;
}

async function go(page, url) {
  await page.goto(BASE_URL + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
}

async function applyP1(page) {
  await page.addStyleTag({ content: P1_CSS });
  await page.waitForTimeout(300);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(P1_DIR, name), fullPage: false });
  console.log(`  ✓ ${name}`);
}

function toDataURL(file) {
  return 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch({ headless: true });

  console.log('\n── P1 Sketchy screens (replacing placeholders) ─────────');

  // dashboard.png
  {
    const ctx  = await newCtx(browser);
    const page = await ctx.newPage();
    await go(page, '/');
    await page.waitForSelector('text=Trip to Japan');
    await applyP1(page);
    await shot(page, 'dashboard.png');
    await ctx.close();
  }

  // quick_add.png: entry form, expense tab, amount prefilled
  {
    const ctx  = await newCtx(browser);
    const page = await ctx.newPage();
    await go(page, '/entries/new');
    await applyP1(page);
    await page.locator('input[type="number"]').first().fill('30');
    await page.waitForTimeout(200);
    await shot(page, 'quick_add.png');
    await ctx.close();
  }

  // goal_creation.png: new goal wizard step 0, name pre-filled
  {
    const ctx  = await newCtx(browser);
    const page = await ctx.newPage();
    await go(page, '/goals/new');
    await applyP1(page);
    await page.locator('input[type="text"]').first().fill('Trip to Japan');
    await page.waitForTimeout(200);
    await shot(page, 'goal_creation.png');
    await ctx.close();
  }

  // charts.png
  {
    const ctx  = await newCtx(browser);
    const page = await ctx.newPage();
    await go(page, '/charts');
    await page.waitForTimeout(800); // Recharts render
    await applyP1(page);
    await shot(page, 'charts.png');
    await ctx.close();
  }

  // overview_grid.png: 3×2 composite of the 6 P1 screens (all now available)
  {
    const cells = [
      { file: path.join(P1_DIR, 'dashboard.png'),      label: 'Dashboard' },
      { file: path.join(P1_DIR, 'quick_add.png'),      label: 'Add Entry' },
      { file: path.join(P1_DIR, 'goal_creation.png'),  label: 'Goal Creation' },
      { file: path.join(P1_DIR, 'charts.png'),         label: 'Charts' },
      { file: path.join(P1_DIR, 'alerts.png'),         label: 'Alerts' },
      { file: path.join(P1_DIR, 'settings.png'),       label: 'Settings' },
    ];

    const cellHTML = (c) => `
      <div class="cell">
        <img src="${toDataURL(c.file)}" />
        <div class="label">${c.label}</div>
      </div>`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body  { margin:0; padding:28px 28px 32px; background:#ebebeb;
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  .row-label { font-size:11px; font-weight:600; color:#888;
               text-transform:uppercase; letter-spacing:.08em; margin:0 0 12px; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px;
          margin-bottom:24px; }
  .cell { border-radius:18px; overflow:hidden;
          box-shadow:0 3px 16px rgba(0,0,0,.11); background:#fff; }
  .cell img  { width:100%; display:block; }
  .label { text-align:center; font-size:10px; font-weight:500; color:#888;
           padding:6px 8px 9px; background:#fff; }
</style>
</head><body>
  <div class="row-label">Prototype 1 — Sketchy Lo-Fi Screens</div>
  <div class="grid">${cells.slice(0,3).map(cellHTML).join('')}</div>
  <div class="grid">${cells.slice(3,6).map(cellHTML).join('')}</div>
</body></html>`;

    const ctx  = await browser.newContext({
      viewport: { width: 980, height: 780 },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(P1_DIR, 'overview_grid.png'),
      fullPage: true,
    });
    console.log('  ✓ overview_grid.png  (composite grid)');
    await ctx.close();
  }

  await browser.close();
  console.log('\n✓  All P1 placeholder screenshots replaced.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
