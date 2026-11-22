// Release QA (Phase 7): regression at 1366/390/320, axe colour contrast, and the two-browser/two-tab test.
// Usage: node ui/checks/release-qa.mjs <outDir> [baseUrl]
//   baseUrl defaults to a local server over this checkout; pass the live Pages URL to test production.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '..', '..');
const req = createRequire(path.join(repo, 'ci', 'package.json'));
const puppeteer = req('puppeteer-core');
const axeSource = fs.readFileSync(req.resolve('axe-core/axe.min.js'), 'utf8');
const out = path.resolve(process.argv[2] || '/workspace/study-desk-checks/release-qa'); fs.mkdirSync(out, { recursive: true });
let base = process.argv[3], srv;
if (!base) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
  srv = http.createServer((rq, rs) => { let pn = decodeURIComponent(new URL(rq.url, 'http://x').pathname); if (pn.endsWith('/')) pn += 'index.html';
    const p = path.join(repo, pn); if (!p.startsWith(repo) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rs.writeHead(404); return rs.end(); }
    rs.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(rs); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); base = `http://127.0.0.1:${srv.address().port}/`;
}
const TODAY = '2026-11-23', KEY = 'ai-learning-platform.study-desk.v1';
const url = (hash, n = 0) => `${base}?today=${TODAY}&qa=${n}#${hash}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const RUN = new Set((process.env.QA_ONLY || 'regression,axe,two').split(','));
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`); };
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const VP = {
  1366: { width: 1366, height: 900 },
  390: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  320: { width: 320, height: 640, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
};
const VIEWS = ['today', 'course', 'calendar', 'activity', 'settings', 'account', 'day-1', 'day-1/learn', 'day-1/practice',
  'day-1/revision', 'day-1/coach', 'day-1/my-notes', 'day-1/test', 'day-2/learn', 'day-37/learn', 'day-49/learn', 'day-56', 'day-56/coach', 'no-such-page'];
const SHOTS = new Set(['today', 'course', 'calendar', 'settings', 'day-1', 'day-1/learn', 'day-1/practice', 'day-1/coach', 'day-37/learn', 'day-56']);

async function open(ctx, vp, errors, scheme = 'light') {
  const page = await ctx.newPage();
  await page.setViewport(vp);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  return page;
}
async function go(page, hash, n) {
  await page.goto(url(hash, n), { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 15000 });
  await sleep(200);
}
async function route(page, hash) { await page.evaluate(h => { location.hash = h; }, hash); await sleep(300); }

// ---------- 1. Regression: every view at 1366, 390 and 320 ----------
const regression = [];
if (RUN.has('regression')) {
for (const [name, vp] of Object.entries(VP)) {
  const errors = [], ctx = await browser.createBrowserContext(), page = await open(ctx, vp, errors);
  await go(page, 'today', 1);
  for (const view of VIEWS) {
    await route(page, view);
    const info = await page.evaluate(() => {
      const de = document.documentElement, wide = [];
      if (de.scrollWidth > de.clientWidth + 1)
        for (const e of document.querySelectorAll('main *')) { const r = e.getBoundingClientRect(); if (r.right > de.clientWidth + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed') { wide.push(e.tagName + '.' + e.className); if (wide.length > 3) break; } }
      return { h1: document.querySelector('h1')?.textContent.trim().slice(0, 60) || '', overflow: de.scrollWidth > de.clientWidth + 1, wide, text: (document.querySelector('main') || document.body).innerText.length };
    });
    const errs = errors.splice(0);
    regression.push({ vp: name, view, ...info, errors: errs });
    if (SHOTS.has(view)) await page.screenshot({ path: path.join(out, `${view.replace(/\//g, '-')}-${name}.png`), fullPage: false });
  }
  await ctx.close();
}
for (const r of regression)
  if (r.overflow || r.errors.length || !r.h1 || r.text < 40) check(`regression ${r.vp} #${r.view}`, false, JSON.stringify({ h1: r.h1, overflow: r.overflow, wide: r.wide, errors: r.errors, text: r.text }));
check(`regression: ${VIEWS.length} views × 3 widths render with a heading, no page errors and no sideways scroll`,
  regression.every(r => !r.overflow && !r.errors.length && r.h1 && r.text >= 40), `${regression.length} pages`);
}

// ---------- 2. axe colour contrast (light and dark) and other WCAG A/AA rules ----------
const axe = { contrast: [], other: {} };
if (RUN.has('axe')) {
for (const scheme of ['light', 'dark']) for (const [name, vp] of Object.entries({ 1366: VP[1366], 390: VP[390] })) {
  const errors = [], ctx = await browser.createBrowserContext(), page = await open(ctx, vp, errors, scheme);
  await go(page, 'today', 2);
  for (const view of ['today', 'course', 'calendar', 'settings', 'day-1', 'day-1/learn', 'day-1/practice', 'day-1/coach', 'day-1/test', 'day-37/learn']) {
    await route(page, view);
    await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
    if (!await page.evaluate(() => !!window.axe)) await page.addScriptTag({ content: axeSource });
    const res = await page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }, resultTypes: ['violations'] });
      return r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 4).map(n => ({ target: n.target.join(' '), summary: (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 220) })), count: v.nodes.length }));
    });
    for (const v of res) {
      if (v.id === 'color-contrast') axe.contrast.push({ scheme, vp: name, view, count: v.count, nodes: v.nodes });
      else (axe.other[v.id] ??= []).push({ scheme, vp: name, view, count: v.count, impact: v.impact, nodes: v.nodes });
    }
  }
  await ctx.close();
}
check('axe: no colour-contrast violations (light and dark, 1366 and 390, 10 views)', axe.contrast.length === 0,
  axe.contrast.map(c => `${c.scheme}/${c.vp}/#${c.view}: ${c.count} (${c.nodes.map(n => n.target).join('; ')})`).join(' | '));
check('axe: no other WCAG 2.1 A/AA violations', Object.keys(axe.other).length === 0, Object.entries(axe.other).map(([id, l]) => `${id} ×${l.reduce((s, x) => s + x.count, 0)}`).join(', '));
}

// ---------- 3. Two tabs in one browser, and two separate browsers ----------
if (RUN.has('two')) {
  const errors = [], ctx = await browser.createBrowserContext();
  const a = await open(ctx, VP[1366], errors), b = await open(ctx, VP[1366], errors);
  await go(a, 'day-1/practice', 3); await go(b, 'day-1/practice', 4);
  const ids = await a.$$eval('[id^="practice-"]', es => es.map(e => e.id.slice('practice-'.length)));
  check('two tabs: Day 1 has at least two practice cards', ids.length >= 2, ids.join(', '));
  const setDone = async (page, id, evidence) => {
    const card = `[id="practice-${id}"]`;
    await page.$eval(`${card} textarea`, (t, v) => { t.value = v; t.dispatchEvent(new Event('input', { bubbles: true })); }, evidence).catch(() => {});
    await page.$$eval(`${card} .sd-statechoice`, bs => bs[bs.length - 1].click());
    await sleep(400);
  };
  const state = (page, id) => page.$eval(`[id="practice-${id}"] .sd-statechoice[aria-pressed="true"], [id="practice-${id}"] .sd-statechoice.is-on`, e => e.textContent.trim()).catch(() => '');
  await setDone(a, ids[0], 'Tab A evidence');
  await sleep(600);
  const bSees = await state(b, ids[0]);
  check('two tabs: a change in tab A shows in tab B without a reload (storage event)', /complete|done/i.test(bSees), `tab B shows "${bSees}"`);
  await setDone(b, ids[1], 'Tab B evidence');
  await go(a, 'day-1/practice', 5);
  const both = [await state(a, ids[0]), await state(a, ids[1])];
  check('two tabs: tab B’s later write keeps tab A’s change (no lost update)', both.every(s => /complete|done/i.test(s)), both.join(' / '));
  const saved = await a.evaluate(() => Object.keys(localStorage).map(k => k + '=' + localStorage.getItem(k)).join('\n'));
  const keys = saved.split('\n').map(l => l.split('=')[0]).filter(k => k.startsWith('ai-learning-platform.'));
  check('two tabs: progress stays in the Codex key and its UI sidecar only', keys.length && keys.every(k => k === KEY || k === KEY.replace('.v1', '.ui-sidecar.v1')), keys.join(', '));
  const ctx2 = await browser.createBrowserContext(), c = await open(ctx2, VP[1366], errors);
  await go(c, 'day-1/practice', 6);
  const other = await state(c, ids[0]);
  check('two browsers: a separate browser has its own local progress (no account = no sync)', !/complete|done/i.test(other), `browser 2 shows "${other || 'nothing selected'}"`);
  check('two tabs/browsers: no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await a.bringToFront(); await a.screenshot({ path: path.join(out, 'two-tabs-a-1366.png') }); await b.bringToFront(); await b.screenshot({ path: path.join(out, 'two-tabs-b-1366.png') });
  await ctx.close(); await ctx2.close();
}

fs.writeFileSync(path.join(out, 'release-qa.json'), JSON.stringify({ base, today: TODAY, results, regression, axe }, null, 2));
await browser.close(); srv?.close();
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} release QA checks passed · ${base}`);
process.exit(failed ? 1 : 0);
