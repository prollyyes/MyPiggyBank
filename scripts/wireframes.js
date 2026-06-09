/**
 * Generates proper wireframe mockups for P1 (sketchy lo-fi) and P2 (clean wireframe).
 * HTML is built from scratch to match the Figma sketchy style: beige background,
 * thin bordered cards, system font, simplified block icons, status bar, FAB nav.
 *
 * Run: node scripts/wireframes.js  (no dev server needed)
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const P1_DIR = path.join(__dirname, '../../mypiggybank_prototypes/figures/prototype1');
const P2_DIR = path.join(__dirname, '../../mypiggybank_prototypes/figures/prototype2');

// ── Shared CSS base ────────────────────────────────────────────────────────────
// Matches the real Figma P1 visual language: warm beige, thin borders, clean type.
const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 390px; height: 844px; overflow: hidden;
    background: #EFEDE8;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    font-size: 15px; color: #1A1A1A;
    display: flex; flex-direction: column;
  }
  /* Status bar */
  .sb {
    height: 44px; display: flex; align-items: flex-start;
    justify-content: space-between; padding: 12px 20px 0;
    flex-shrink: 0;
  }
  .sb-time { font-size: 15px; font-weight: 600; }
  .sb-right { display: flex; align-items: center; gap: 4px; font-size: 14px; }
  /* Headers */
  .hdr {
    height: 52px; display: flex; align-items: center; justify-content: center;
    position: relative; padding: 0 16px;
    border-bottom: 1px solid #D0CDC8; flex-shrink: 0;
    background: #EFEDE8;
  }
  .hdr-title { font-size: 17px; font-weight: 700; }
  .hdr-back  { position: absolute; left: 16px; font-size: 15px; color: #555; }
  .hdr-right { position: absolute; right: 16px; font-size: 15px; color: #555; }
  /* Scrollable content area */
  .content {
    flex: 1; overflow: hidden; padding: 12px 16px;
    display: flex; flex-direction: column; gap: 10px;
  }
  /* Cards */
  .card {
    background: #fff; border: 1.5px solid #D0CDC8; border-radius: 12px;
    padding: 14px 16px;
  }
  .card + .card { margin-top: 0; }
  /* Labels */
  .lbl {
    font-size: 10px; text-transform: uppercase;
    letter-spacing: .07em; color: #888; margin-bottom: 5px;
  }
  /* Amounts */
  .amt-xl  { font-size: 34px; font-weight: 700; line-height: 1.1; }
  .amt-lg  { font-size: 22px; font-weight: 700; }
  .amt-sm  { font-size: 14px; color: #555; }
  /* Progress bar */
  .pbar-track {
    height: 7px; background: #E8E5E0; border-radius: 4px;
    margin: 8px 0; overflow: hidden;
  }
  .pbar-fill { height: 100%; background: #555; border-radius: 4px; }
  /* Rows */
  .row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; }
  .dot { width: 9px; height: 9px; background: #555; border-radius: 50%; flex-shrink: 0; }
  .dot-light { background: #BBB; }
  /* Section heading */
  .sec-hdr {
    display: flex; justify-content: space-between; align-items: center;
    padding: 2px 2px;
  }
  .sec-title { font-size: 16px; font-weight: 700; }
  .sec-link  { font-size: 14px; color: #777; }
  /* Goal cards */
  .goal-card {
    background: #fff; border: 1.5px solid #D0CDC8; border-radius: 12px;
    padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;
  }
  .goal-row { display: flex; justify-content: space-between; align-items: center; }
  .goal-name { font-size: 15px; font-weight: 600; }
  .goal-sub  { font-size: 13px; color: #777; }
  .tag {
    font-size: 11px; font-weight: 600; color: #555;
    border: 1px solid #ccc; border-radius: 8px;
    padding: 2px 7px;
  }
  /* Tabs */
  .tabs {
    display: flex; background: #E8E4DE; border-radius: 10px;
    padding: 3px; gap: 3px;
  }
  .tab {
    flex: 1; text-align: center; padding: 7px 4px;
    border-radius: 8px; font-size: 14px; font-weight: 500; color: #666;
  }
  .tab.active {
    background: #fff; color: #1A1A1A; font-weight: 700;
    box-shadow: 0 1px 3px rgba(0,0,0,.1);
  }
  /* Form elements */
  .field-wrap { display: flex; flex-direction: column; gap: 4px; }
  .field {
    background: #F5F3EE; border: 1.5px solid #D0CDC8; border-radius: 10px;
    padding: 10px 12px; font-size: 15px; font-family: inherit; color: #1A1A1A;
    width: 100%;
  }
  .field.filled { border-color: #AAA; background: #fff; }
  /* Chip rows */
  .chips { display: flex; gap: 7px; flex-wrap: wrap; }
  .chip {
    border: 1.5px solid #C8C5C0; border-radius: 20px;
    padding: 5px 12px; font-size: 13px; background: #fff;
    display: flex; align-items: center; gap: 4px;
  }
  .chip.active { border-color: #1A1A1A; background: #1A1A1A; color: #fff; }
  /* Amount display (large) */
  .amt-display {
    background: #fff; border: 1.5px solid #D0CDC8; border-radius: 14px;
    padding: 16px; text-align: center;
  }
  .amt-cur  { font-size: 14px; color: #888; margin-bottom: 2px; }
  .amt-big  { font-size: 46px; font-weight: 700; line-height: 1; }
  /* Category grid */
  .cat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 7px; }
  .cat-chip {
    border: 1.5px solid #D0CDC8; border-radius: 10px; background: #fff;
    padding: 8px 10px; font-size: 14px;
    display: flex; align-items: center; gap: 6px;
  }
  .cat-chip.active { border-color: #1A1A1A; background: #1A1A1A; color: #fff; }
  /* Buttons */
  .btn {
    border: 1.5px solid #1A1A1A; border-radius: 24px;
    padding: 13px; text-align: center;
    font-size: 15px; font-weight: 700; font-family: inherit;
    width: 100%; background: #fff;
  }
  .btn.primary { background: #1A1A1A; color: #fff; }
  .btn.outline { background: #fff; color: #1A1A1A; }
  .btn.ghost   { border-color: #C8C5C0; color: #888; background: #fff; }
  .btn-row { display: flex; gap: 8px; }
  .btn-row .btn { flex: 1; padding: 10px; font-size: 14px; }
  /* Annotation (HE notes — salmon/coral) */
  .annot { font-size: 11px; color: #C05A48; font-style: italic; }
  /* Toggle */
  .toggle-row {
    display: flex; justify-content: space-between; align-items: center;
    background: #fff; border: 1.5px solid #D0CDC8; border-radius: 10px;
    padding: 10px 12px;
  }
  .toggle-pill {
    width: 38px; height: 22px; border-radius: 11px;
    border: 1.5px solid #1A1A1A; background: #1A1A1A;
    position: relative;
  }
  .toggle-pill::after {
    content: ''; position: absolute; top: 2px; right: 2px;
    width: 14px; height: 14px; border-radius: 50%; background: #fff;
  }
  .toggle-pill.off { background: #E0DDD8; border-color: #C8C5C0; }
  .toggle-pill.off::after { right: auto; left: 2px; }
  /* Step indicator */
  .steps {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 6px 0;
  }
  .step-dot {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1.5px solid #C8C5C0; display: flex; align-items: center;
    justify-content: center; font-size: 13px; font-weight: 600; color: #888;
  }
  .step-dot.active { border-color: #1A1A1A; background: #1A1A1A; color: #fff; }
  .step-dot.done   { border-color: #888; background: #888; color: #fff; }
  .step-line { flex: 1; height: 1.5px; background: #D0CDC8; max-width: 40px; }
  /* Emoji grid */
  .emoji-grid {
    display: grid; grid-template-columns: repeat(6,1fr); gap: 6px;
  }
  .emoji-cell {
    width: 44px; height: 44px; border-radius: 10px;
    border: 1.5px solid #D0CDC8; background: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
  }
  .emoji-cell.active { border-color: #1A1A1A; border-width: 2px; }
  /* Color swatches */
  .swatches { display: flex; gap: 8px; }
  .swatch {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2px solid transparent;
  }
  .swatch.active { border-color: #1A1A1A; }
  /* Chart circle placeholder */
  .chart-wrap {
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    padding: 8px 0;
  }
  .chart-circle {
    width: 160px; height: 160px; border-radius: 50%;
    border: 2px solid #1A1A1A; background: #F5F3EE;
    position: relative; overflow: hidden; flex-shrink: 0;
  }
  /* Alert cards */
  .alert-card {
    background: #fff; border: 1.5px solid #D0CDC8; border-radius: 12px;
    padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;
  }
  .alert-kind {
    font-size: 10px; text-transform: uppercase; letter-spacing: .07em;
    font-weight: 700; color: #888;
  }
  .alert-title { font-size: 15px; font-weight: 700; }
  .alert-msg   { font-size: 13px; color: #555; line-height: 1.4; }
  .alert-meta  { font-size: 12px; color: #888; }
  /* Bottom navigation — P1 style (4 tab + floating FAB) */
  .nav-p1 {
    flex-shrink: 0; background: #EFEDE8;
    border-top: 1px solid #D0CDC8; padding: 0 0 16px;
    position: relative;
  }
  .nav-p1-fab {
    position: absolute; top: -24px; left: 50%; transform: translateX(-50%);
    width: 52px; height: 52px; border-radius: 50%;
    background: #1A1A1A; color: #fff;
    font-size: 30px; font-weight: 300; line-height: 52px; text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,.25);
  }
  .nav-p1-items {
    display: flex; justify-content: space-around;
    padding: 10px 20px 0;
  }
  .nav-item {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
  }
  .nav-icon-block {
    width: 26px; height: 20px; border-radius: 5px; background: #C8C5C0;
  }
  .nav-icon-block.active { background: #1A1A1A; }
  .nav-label { font-size: 11px; color: #888; }
  .nav-label.active { color: #1A1A1A; font-weight: 700; }
  /* Spacer for FAB area in P1 nav */
  .nav-p1-spacer { width: 52px; }
  /* Bottom navigation — P2 style (pill) */
  .nav-p2 {
    flex-shrink: 0; margin: 8px 16px 20px;
    background: #fff; border: 1.5px solid #D0CDC8;
    border-radius: 40px; padding: 8px 14px;
    display: flex; align-items: center; justify-content: space-around;
  }
  .nav-p2-plus {
    width: 44px; height: 44px; border-radius: 50%;
    background: #1A1A1A; color: #fff;
    font-size: 26px; font-weight: 300; line-height: 44px; text-align: center;
  }
  /* Separator line */
  .sep { height: 1px; background: #E0DDD8; margin: 2px 0; }
  /* List rows (settings style) */
  .list-card {
    background: #fff; border: 1.5px solid #D0CDC8; border-radius: 12px;
    overflow: hidden;
  }
  .list-row {
    padding: 13px 16px; font-size: 15px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #E8E5E0;
  }
  .list-row:last-child { border-bottom: none; }
  .list-arrow { color: #AAA; font-size: 14px; }
  /* Disabled / placeholder style for inputs */
  .placeholder-line {
    height: 14px; background: #E0DDD8; border-radius: 3px; margin: 2px 0;
  }
`;

// ── Reusable HTML snippets ────────────────────────────────────────────────────

const statusBar = () => `
<div class="sb">
  <span class="sb-time">9:41</span>
  <div class="sb-right">
    <span>●●●</span>
    <span style="margin-left:4px;font-size:16px;">⊟</span>
  </div>
</div>`;

const header = ({ title, back = false, right = '' }) => `
<div class="hdr">
  ${back ? `<span class="hdr-back">← Back</span>` : ''}
  <span class="hdr-title">${title}</span>
  ${right ? `<span class="hdr-right">${right}</span>` : ''}
</div>`;

const navP1 = (active = 'Home') => `
<div class="nav-p1">
  <div class="nav-p1-fab">+</div>
  <div class="nav-p1-items">
    ${['Home','Goals','','Charts','Settings'].map(t =>
      t === ''
        ? `<div class="nav-p1-spacer"></div>`
        : `<div class="nav-item">
             <div class="nav-icon-block ${t===active?'active':''}"></div>
             <span class="nav-label ${t===active?'active':''}">${t}</span>
           </div>`
    ).join('')}
  </div>
</div>`;

const navP2 = (active = 'Home') => `
<div class="nav-p2">
  ${['Home','Charts',null,'Alerts','Settings'].map(t =>
    t === null
      ? `<div class="nav-p2-plus">+</div>`
      : `<div class="nav-item">
           <div class="nav-icon-block ${t===active?'active':''}"></div>
           <span class="nav-label ${t===active?'active':''}" style="font-size:10px;">${t}</span>
         </div>`
  ).join('')}
</div>`;

const wrap = (body) => `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>${BASE_CSS}</style></head><body>${body}</body></html>`;

// ── P1 Screens ────────────────────────────────────────────────────────────────

function p1Dashboard() {
  return wrap(`
    ${statusBar()}
    ${header({ title: 'MyPiggyBank',
      right: `<span style="display:flex;gap:10px;font-size:18px;">🔔 🌙</span>` })}
    <div class="content">
      <p style="font-size:15px;color:#555;">Hello, Marco</p>

      <div class="card">
        <div class="lbl">Total Saved</div>
        <div class="amt-xl">€2,360.00</div>
        <div class="pbar-track"><div class="pbar-fill" style="width:26%"></div></div>
        <div class="row">
          <span class="amt-sm">€6,840.00 remaining toward goals</span>
          <span class="amt-sm">26%</span>
        </div>
      </div>

      <div class="card">
        <div class="lbl">This Month</div>
        <div class="row" style="padding:3px 0;">
          <div style="display:flex;align-items:center;gap:6px;">
            <div class="dot dot-light"></div><span style="font-size:14px;">Income</span>
          </div>
          <span style="font-size:14px;">€2,500.00</span>
        </div>
        <div class="row" style="padding:3px 0;">
          <div style="display:flex;align-items:center;gap:6px;">
            <div class="dot"></div><span style="font-size:14px;">Expenses</span>
          </div>
          <span style="font-size:14px;">€355.00</span>
        </div>
        <div class="sep"></div>
        <div class="row" style="padding:3px 0;font-weight:600;">
          <span style="font-size:14px;">Available</span>
          <span style="font-size:14px;">€1,695.00</span>
        </div>
        <div class="annot" style="margin-top:6px;">[HE01 — no refresh indicator]</div>
      </div>

      <div class="sec-hdr">
        <span class="sec-title">Savings Goals</span>
        <span class="sec-link">+ New goal</span>
      </div>

      <div class="goal-card">
        <div class="goal-row">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:20px;">🏔️</span>
            <span class="goal-name">Trip to Japan</span>
          </div>
          <span class="tag">High</span>
        </div>
        <div class="pbar-track"><div class="pbar-fill" style="width:28%"></div></div>
        <div class="goal-row">
          <span class="goal-sub">225d left</span>
          <span class="goal-sub">28%</span>
        </div>
        <div class="annot">[HE08 — no absolute figures shown]</div>
      </div>

      <div class="goal-card">
        <div class="goal-row">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:20px;">💻</span>
            <span class="goal-name">New Laptop</span>
          </div>
          <span class="tag">Med</span>
        </div>
        <div class="pbar-track"><div class="pbar-fill" style="width:27%"></div></div>
        <div class="goal-row">
          <span class="goal-sub">132d left</span>
          <span class="goal-sub">27%</span>
        </div>
      </div>
    </div>
    ${navP1('Home')}
  `);
}

function p1QuickAdd() {
  return wrap(`
    ${statusBar()}
    ${header({ title: 'Add Entry', back: true })}
    <div class="content" style="gap:12px;">
      <div class="tabs">
        <div class="tab">Income</div>
        <div class="tab active">Expense</div>
        <div class="tab">Savings</div>
      </div>
      <div class="amt-display">
        <div class="amt-cur">EUR</div>
        <div class="amt-big">30</div>
      </div>
      <div class="chips" style="justify-content:center;">
        <div class="chip active">EUR</div>
        <div class="chip">USD</div>
        <div class="chip">GBP</div>
        <div class="chip">JPY</div>
        <div class="chip">PLN</div>
      </div>
      <div class="card" style="padding:10px 14px;">
        <div class="lbl">Category</div>
        <div class="cat-grid">
          <div class="cat-chip active">🍕 Food</div>
          <div class="cat-chip">🚇 Transport</div>
          <div class="cat-chip">🏠 Housing</div>
          <div class="cat-chip">💊 Health</div>
          <div class="cat-chip">🛍️ Shopping</div>
          <div class="cat-chip">✈️ Travel</div>
        </div>
      </div>
      <div class="field-wrap">
        <div class="field" style="color:#AAA;">Add a note… (optional)</div>
      </div>
      <div class="annot">[HE02 — FAB scope ambiguous · HE03 — no cancel · HE04 — no numeric pad]</div>
    </div>
    <div style="padding:0 16px 4px;flex-shrink:0;">
      <div class="btn primary">Save</div>
    </div>
    ${navP1()}
  `);
}

function p1GoalCreation() {
  return wrap(`
    ${statusBar()}
    ${header({ title: 'New Goal', back: true })}
    <div class="content" style="gap:12px;">
      <div class="steps">
        <div class="step-dot active">1</div>
        <div class="step-line"></div>
        <div class="step-dot">2</div>
        <div class="step-line"></div>
        <div class="step-dot">3</div>
      </div>
      <div style="font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.06em;">
        Goal Identity
      </div>
      <div class="field-wrap">
        <label class="lbl">Name</label>
        <div class="field filled">Trip to Japan</div>
      </div>
      <div class="field-wrap">
        <label class="lbl">Pick an emoji</label>
        <div class="emoji-grid">
          ${['🎯','🏖️','✈️','💻','🏠','💍','🎓','🗾','🚗','📚','🌍','🎸'].map((e,i) =>
            `<div class="emoji-cell${i===7?' active':''}">${e}</div>`).join('')}
        </div>
      </div>
      <div class="field-wrap">
        <label class="lbl">Colour</label>
        <div class="swatches">
          ${['#CC5C44','#A46726','#54709C','#8A4826','#B87A5A','#3A5880'].map((c,i) =>
            `<div class="swatch${i===0?' active':''}" style="background:${c};"></div>`).join('')}
        </div>
      </div>
      <div class="annot">[HE06 — goal creation buried in menu · HE07 — no draft saved]</div>
    </div>
    <div style="padding:0 16px 4px;flex-shrink:0;">
      <div class="btn primary">Next →</div>
    </div>
    ${navP1()}
  `);
}

function p1Charts() {
  // Simple pie chart using a conic-gradient as placeholder
  return wrap(`
    ${statusBar()}
    ${header({ title: 'Charts' })}
    <div class="content" style="gap:12px;">
      <div class="tabs">
        <div class="tab active">Spending</div>
        <div class="tab">Goals</div>
        <div class="tab">Over Time</div>
      </div>
      <div class="chips" style="justify-content:center;">
        <div class="chip">Week</div>
        <div class="chip active">Month</div>
        <div class="chip">Year</div>
      </div>
      <div class="chart-wrap">
        <div class="chart-circle">
          <div style="
            width:100%; height:100%;
            background: conic-gradient(
              #1A1A1A 0% 22%,
              #555 22% 58%,
              #888 58% 85%,
              #BBB 85% 100%
            );
          "></div>
          <div style="
            position:absolute; top:50%; left:50%;
            transform:translate(-50%,-50%);
            width:70px; height:70px;
            background:#F5F3EE; border-radius:50%;
          "></div>
        </div>
        <div style="width:100%;">
          ${[
            ['#1A1A1A','Housing','€180','46%'],
            ['#555','Food',    '€75', '19%'],
            ['#888','Shopping','€95', '24%'],
            ['#BBB','Transport','€50','13%'],
          ].map(([c,name,amt,pct]) =>
            `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #E8E5E0;">
               <div style="display:flex;align-items:center;gap:8px;">
                 <div style="width:12px;height:12px;border-radius:3px;background:${c};flex-shrink:0;"></div>
                 <span style="font-size:14px;">${name}</span>
               </div>
               <div style="display:flex;gap:16px;">
                 <span style="font-size:14px;font-weight:600;">${amt}</span>
                 <span style="font-size:13px;color:#888;width:32px;text-align:right;">${pct}</span>
               </div>
             </div>`
          ).join('')}
        </div>
      </div>
      <div class="annot">[HE10 — no direct chart-type tab bar · HE11 — too many slices]</div>
    </div>
    ${navP1('Charts')}
  `);
}

// ── P2 Screens ────────────────────────────────────────────────────────────────

function p2QuickAdd() {
  return wrap(`
    ${statusBar()}
    ${header({ title: 'Add Entry', back: true, right: 'Cancel' })}
    <div class="content" style="gap:11px;">
      <div class="tabs">
        <div class="tab">Income</div>
        <div class="tab active">Expense</div>
        <div class="tab">Savings</div>
      </div>
      <div class="amt-display">
        <div class="amt-cur">EUR</div>
        <div class="amt-big">30</div>
      </div>

      <!-- Goal toggle MOVED ABOVE category (C1.7) -->
      <div class="card" style="padding:10px 14px;">
        <div class="lbl">Link to Savings Goal</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
          <span style="font-size:14px;">Trip to Japan  <span style="color:#888;font-size:12px;">(€840 / €3,000)</span></span>
          <div class="toggle-pill"></div>
        </div>
      </div>

      <div class="card" style="padding:10px 14px;">
        <div class="lbl">Category</div>
        <div class="cat-grid">
          <div class="cat-chip active">🍕 Food</div>
          <div class="cat-chip">🚇 Transport</div>
          <div class="cat-chip">🏠 Housing</div>
          <div class="cat-chip">💊 Health</div>
          <div class="cat-chip">🛍️ Shopping</div>
          <div class="cat-chip">✈️ Travel</div>
        </div>
      </div>
      <div class="field-wrap">
        <label class="lbl">Date</label>
        <div class="field filled">21 May 2026</div>
      </div>
      <div class="field-wrap">
        <div class="field" style="color:#AAA;">Add a note… (optional)</div>
      </div>
    </div>
    <div style="padding:0 16px 4px;flex-shrink:0;">
      <div class="btn primary">Save</div>
    </div>
    ${navP2()}
  `);
}

function p2GoalDetail() {
  return wrap(`
    ${statusBar()}
    ${header({ title: 'Edit Goal', back: true })}
    <div class="content" style="gap:12px;">

      <div class="card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <span style="font-size:32px;">🏔️</span>
          <div>
            <div style="font-size:17px;font-weight:700;">Trip to Japan</div>
            <div style="font-size:13px;color:#888;">High priority</div>
          </div>
        </div>
        <!-- Absolute figures (C1.10) -->
        <div style="font-size:15px;font-weight:600;margin-bottom:6px;">
          €840.00 <span style="font-weight:400;color:#888;">of</span> €3,000.00
        </div>
        <div class="pbar-track"><div class="pbar-fill" style="width:28%"></div></div>
        <div class="row" style="margin-top:2px;">
          <span style="font-size:13px;color:#777;">225 days left</span>
          <span style="font-size:13px;font-weight:600;">28%</span>
        </div>
      </div>

      <div class="field-wrap">
        <label class="lbl">Current Amount (€)</label>
        <div class="field filled">840.00</div>
      </div>
      <div class="field-wrap">
        <label class="lbl">Target Amount (€)</label>
        <div class="field filled">3000.00</div>
      </div>
      <div class="field-wrap">
        <label class="lbl">Deadline</label>
        <div class="field filled">31 December 2026</div>
      </div>

      <!-- Differentiated Edit vs Delete (C1.12) -->
      <div class="btn-row">
        <div class="btn outline">Edit</div>
        <div class="btn ghost" style="border-color:#C05A48;color:#C05A48;">Delete</div>
      </div>
    </div>
    ${navP2()}
  `);
}

function p2Alerts() {
  return wrap(`
    ${statusBar()}
    ${header({ title: 'Alerts', right: 'Clear all' })}
    <div class="content" style="gap:10px;">

      <div class="alert-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div class="alert-kind">⚡ Pace Alert</div>
            <div class="alert-title">Budget pace — May 2026</div>
          </div>
        </div>
        <div class="alert-msg">
          You've used over 90% of your monthly budget. Consider reducing non-essential expenses.
        </div>
        <div class="alert-meta">Today, 10:00</div>
        <!-- CTAs added in P2 (C1.3) -->
        <div class="btn-row">
          <div class="btn primary" style="font-size:13px;padding:8px;">Review spending</div>
          <div class="btn ghost" style="font-size:13px;padding:8px;">Dismiss</div>
        </div>
      </div>

      <div class="alert-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div class="alert-kind">⏰ Deadline Alert</div>
            <div class="alert-title">Trip to Japan</div>
          </div>
          <span class="tag">High</span>
        </div>
        <div class="alert-msg">
          224 days left — currently 28% funded (€840 of €3,000). You need to save €268/month.
        </div>
        <div class="alert-meta">Yesterday</div>
        <!-- CTAs added in P2 (C1.3) -->
        <div class="btn-row">
          <div class="btn primary" style="font-size:13px;padding:8px;">Adjust target</div>
          <div class="btn ghost" style="font-size:13px;padding:8px;">Dismiss</div>
        </div>
      </div>

    </div>
    ${navP2('Alerts')}
  `);
}

// ── Overview grids ─────────────────────────────────────────────────────────────

function overviewGrid(cells, title = 'Overview') {
  const encodeImg = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
  const cellHTML  = c => `
    <div style="border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.10);background:#fff;">
      <img src="${encodeImg(c.file)}" style="width:100%;display:block;" />
      <div style="text-align:center;font-size:10px;font-weight:500;color:#888;
                  padding:5px 8px 7px;background:#fff;">${c.label}</div>
    </div>`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { margin:0;padding:24px;background:#E8E5E0;
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  h3 { font-size:11px;font-weight:600;color:#888;text-transform:uppercase;
       letter-spacing:.07em;margin:0 0 12px; }
  .grid { display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px; }
</style></head><body>
  <h3>${title}</h3>
  <div class="grid">${cells.map(cellHTML).join('')}</div>
</body></html>`;
  return html;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function renderHTML(browser, html, file, viewport = { width: 390, height: 844 }, cssFilter = null) {
  const ctx  = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  if (cssFilter) {
    await page.addStyleTag({ content: `html { filter: ${cssFilter} !important; }` });
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${path.basename(file)}`);
  await ctx.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // P1 = rougher lo-fi: grayscale + slightly lower contrast/brightness
  const P1F = 'grayscale(1) contrast(0.82) brightness(1.06)';
  // P2 = clean wireframe: grayscale, full contrast
  const P2F = 'grayscale(1) contrast(0.97)';

  console.log('\n── P1 Wireframe screens ────────────────────────────────');
  await renderHTML(browser, p1Dashboard(),     path.join(P1_DIR, 'dashboard.png'),     { width: 390, height: 844 }, P1F);
  await renderHTML(browser, p1QuickAdd(),      path.join(P1_DIR, 'quick_add.png'),     { width: 390, height: 844 }, P1F);
  await renderHTML(browser, p1GoalCreation(),  path.join(P1_DIR, 'goal_creation.png'), { width: 390, height: 844 }, P1F);
  await renderHTML(browser, p1Charts(),        path.join(P1_DIR, 'charts.png'),        { width: 390, height: 844 }, P1F);

  // P1 overview grid (4 generated + 2 real Figma screens already on disk)
  const p1Cells = [
    { file: path.join(P1_DIR, 'dashboard.png'),     label: 'Dashboard' },
    { file: path.join(P1_DIR, 'quick_add.png'),     label: 'Add Entry' },
    { file: path.join(P1_DIR, 'goal_creation.png'), label: 'Goal Creation' },
    { file: path.join(P1_DIR, 'charts.png'),        label: 'Charts' },
    { file: path.join(P1_DIR, 'alerts.png'),        label: 'Alerts' },
    { file: path.join(P1_DIR, 'settings.png'),      label: 'Settings' },
  ];
  await renderHTML(
    browser,
    overviewGrid(p1Cells, 'Prototype 1 — Sketchy Lo-Fi Screens'),
    path.join(P1_DIR, 'overview_grid.png'),
    { width: 980, height: 560 }
  );

  console.log('\n── P2 Wireframe screens ────────────────────────────────');
  await renderHTML(browser, p2QuickAdd(),    path.join(P2_DIR, 'quick_add.png'),   { width: 390, height: 844 }, P2F);
  await renderHTML(browser, p2GoalDetail(),  path.join(P2_DIR, 'goal_detail.png'), { width: 390, height: 844 }, P2F);
  await renderHTML(browser, p2Alerts(),      path.join(P2_DIR, 'alerts.png'),      { width: 390, height: 844 }, P2F);

  await browser.close();
  console.log('\n✓  All wireframe screens saved.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
