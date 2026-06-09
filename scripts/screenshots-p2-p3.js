/**
 * P2 wireframe + P3 hi-fi screenshots for the LaTeX report.
 * Run: node scripts/screenshots-p2-p3.js  (dev server must be on :3000)
 *
 * P2: grayscale + no blur/shadow → clean wireframe look
 * P3: full-colour web app (dashboard cloned from P4, new screens added)
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const BASE_URL = 'http://localhost:3000';
const P2_DIR   = path.join(__dirname, '../../mypiggybank_prototypes/figures/prototype2');
const P3_DIR   = path.join(__dirname, '../../mypiggybank_prototypes/figures/prototype3');
const P4_DIR   = path.join(__dirname, '../../mypiggybank_prototypes/figures/prototype4');

// ── Shared test data ─────────────────────────────────────────────────────────

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

function makeSettings(theme = 'light') {
  return { primaryCurrency: 'EUR', managedCurrencies: ['USD'],
           theme, onboardingComplete: true, name: 'Marco', monthlyBudget: 0 };
}

// ── Wireframe CSS (P2) ───────────────────────────────────────────────────────
// Strips every visual flourish so the structural layout reads as lo-fi wireframe.
const WIREFRAME_CSS = `
  /* Kill glassmorphism blur */
  * {
    backdrop-filter:          none !important;
    -webkit-backdrop-filter:  none !important;
    box-shadow:               none !important;
    text-shadow:              none !important;
    animation:                none !important;
    transition:               none !important;
  }
  /* Flatten semi-transparent glass cards to solid near-white */
  [class*="glass"] {
    background: rgba(255,255,255,0.92) !important;
    border-color: rgba(0,0,0,0.18) !important;
  }
  /* Desaturate entire page — applied last so it wins */
  html {
    filter: grayscale(1) contrast(1.05) !important;
    background: #efefef !important;
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function newCtx(browser, theme = 'light') {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await ctx.addInitScript(({ goals, entries, alerts, settings }) => {
    localStorage.setItem('mpb.goals',    JSON.stringify(goals));
    localStorage.setItem('mpb.entries',  JSON.stringify(entries));
    localStorage.setItem('mpb.alerts',   JSON.stringify(alerts));
    localStorage.setItem('mpb.settings', JSON.stringify(settings));
  }, { goals: GOALS, entries: ENTRIES, alerts: ALERTS, settings: makeSettings(theme) });
  return ctx;
}

async function go(page, url) {
  await page.goto(BASE_URL + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
}

async function applyWireframe(page) {
  await page.addStyleTag({ content: WIREFRAME_CSS });
  await page.waitForTimeout(300);
}

async function shot(page, dir, name) {
  await page.screenshot({ path: path.join(dir, name), fullPage: false });
  console.log(`  ✓ ${name}`);
}

function copy(src, dst) {
  fs.copyFileSync(src, dst);
  console.log(`  ✓ ${path.basename(dst)}  (reused from P4)`);
}

function toDataURL(file) {
  return 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch({ headless: true });

  // P2 wireframes are generated by wireframes.js (HTML mockups) — not here.

  // ════════════════════════════════════════════════════════════
  //  P3 — Hi-Fi Visual
  // ════════════════════════════════════════════════════════════
  console.log('\n── P3 Hi-Fi ────────────────────────────────────────────');

  // Reuse P4 shots for screens that are identical in P3
  copy(path.join(P4_DIR, 'dashboard_light.png'),      path.join(P3_DIR, 'dashboard_light.png'));
  copy(path.join(P4_DIR, 'dashboard_dark.png'),       path.join(P3_DIR, 'dashboard_dark.png'));
  copy(path.join(P4_DIR, 'post_save_variantb.png'),   path.join(P3_DIR, 'confirm_variant_b.png'));

  // Dark mode screens for the overview_grid bottom row
  {
    const ctx  = await newCtx(browser, 'dark');
    const page = await ctx.newPage();
    await go(page, '/alerts');
    await page.waitForTimeout(400);
    await shot(page, P3_DIR, 'alerts_dark.png');
    await ctx.close();
  }
  {
    const ctx  = await newCtx(browser, 'dark');
    const page = await ctx.newPage();
    await go(page, '/charts');
    await page.waitForTimeout(900);
    await shot(page, P3_DIR, 'charts_dark.png');
    await ctx.close();
  }

  // goal_detail.png: Goal edit page — progress bar + absolute figures + deadline
  {
    const ctx  = await newCtx(browser);
    const page = await ctx.newPage();
    await go(page, '/goals/g1/edit');
    await shot(page, P3_DIR, 'goal_detail.png');
    await ctx.close();
  }

  // confirm_variant_a.png: Post-save screen stripped to bare confirmation only
  // (no goal progress card = Variant A: "absolute feedback only")
  {
    const ctx  = await newCtx(browser);
    const page = await ctx.newPage();
    await go(page, '/entries/saved?goalId=g1&amount=200');
    await page.waitForSelector('text=Entry saved');
    // Remove the glass goal-progress card; keep icon + title + subtitle + buttons
    await page.evaluate(() => {
      document.querySelectorAll('.glass, .glass-strong').forEach(el => el.remove());
    });
    await page.waitForTimeout(200);
    await shot(page, P3_DIR, 'confirm_variant_a.png');
    await ctx.close();
  }

  // overview_grid.png: 3×2 composite — light (top) + dark (bottom)
  {
    const cells = [
      // Light row
      { file: path.join(P3_DIR, 'dashboard_light.png'), label: 'Dashboard' },
      { file: path.join(P4_DIR, 'entry_form.png'),      label: 'Add Entry' },
      { file: path.join(P3_DIR, 'goal_detail.png'),     label: 'Goal Detail' },
      // Dark row (all dark mode)
      { file: path.join(P3_DIR, 'dashboard_dark.png'),  label: 'Dashboard' },
      { file: path.join(P3_DIR, 'alerts_dark.png'),     label: 'Alerts' },
      { file: path.join(P3_DIR, 'charts_dark.png'),     label: 'Charts' },
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
               text-transform:uppercase; letter-spacing:.08em;
               margin:0 0 12px; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px;
          margin-bottom:24px; }
  .cell { border-radius:18px; overflow:hidden;
          box-shadow:0 3px 16px rgba(0,0,0,.11); background:#fff; }
  .cell img  { width:100%; display:block; }
  .label { text-align:center; font-size:10px; font-weight:500; color:#888;
           padding:6px 8px 9px; background:#fff; }
</style>
</head><body>
  <div class="row-label">Light mode</div>
  <div class="grid">${cells.slice(0,3).map(cellHTML).join('')}</div>
  <div class="row-label">Dark mode</div>
  <div class="grid">${cells.slice(3,6).map(cellHTML).join('')}</div>
</body></html>`;

    const ctx  = await browser.newContext({ viewport: { width: 980, height: 860 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(P3_DIR, 'overview_grid.png'), fullPage: true });
    console.log('  ✓ overview_grid.png  (composite grid)');
    await ctx.close();
  }

  await browser.close();
  console.log('\n✓  All P2 and P3 screenshots saved.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
