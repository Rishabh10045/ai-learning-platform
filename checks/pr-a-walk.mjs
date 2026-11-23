// PR A browser walk of the ROOT app (Grok, 2026-11-23). Usage: CHROME=/usr/bin/google-chrome node checks/pr-a-walk.mjs [outDir]
// Days 1, 9, 17, 26, 35, 44, 46, 56 × 1366 and 390 px × light and dark: plan, learn, practice and revision render with no
// sideways scroll and no console errors or failed requests; every rendered quiz question on Learn has at least 4 options;
// axe finds no serious/critical issue on plan and practice (1366 light). Content-only checks: the UI is unchanged in PR A.
import assert from 'node:assert/strict';
import { createReadStream, readFileSync } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../ci/', import.meta.url));
const puppeteer = require('puppeteer-core');
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prefix = '/ai-learning-platform/';
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const f = resolve(repo, p.slice(prefix.length) || 'index.html');
  if (!p.startsWith(prefix) || !f.startsWith(repo + sep) || !mime[extname(f)]) { res.writeHead(404); res.end(); return; }
  try { if (!(await stat(f)).isFile()) throw 0; res.writeHead(200, { 'content-type': mime[extname(f)] }); createReadStream(f).pipe(res); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port + prefix;
const out = process.argv[2] ? resolve(process.argv[2]) : null;
if (out) await mkdir(out, { recursive: true });
const KEY = 'ai-learning-platform.study-desk.v1';
const DAYS = [1, 9, 17, 26, 35, 44, 46, 56];
const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser, passed = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); passed++; };

async function open(vp, scheme, errors, today = '2026-11-22', hash = 'today') {
  const page = await browser.newPage();
  await page.setViewport(vp);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warn') errors.push(m.type() + ': ' + m.text()); });
  page.on('requestfailed', r => errors.push('requestfailed ' + r.url()));
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) errors.push(r.status() + ' ' + r.url()); });
  await page.goto(base + '?today=' + today + '#' + hash, { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 15000 });
  return page;
}
const go = async (page, hash) => { await page.evaluate(h => { location.hash = h; }, hash); await sleep(150); };
const fits = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const shot = async (page, name) => { if (out) await page.screenshot({ path: `${out}/${name}.png`, fullPage: true }); };
async function axe(page) {
  await page.evaluate(AXE);
  const r = await page.evaluate(async () => (await axe.run(document, { resultTypes: ['violations'] })).violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id + ':' + v.nodes.length));
  return r;
}

try {
  browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const vps = { 1366: { width: 1366, height: 900 }, 390: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
  for (const [w, vp] of Object.entries(vps)) for (const scheme of ['light', 'dark']) {
    const errors = [], page = await open(vp, scheme, errors);
    for (const d of DAYS) {
      for (const view of ['', 'learn', 'practice', 'revision']) {
        await go(page, 'day-' + d + (view ? '/' + view : ''));
        ok(await fits(page), `Day ${d} ${view || 'plan'} overflows at ${w}px ${scheme}`);
        if (!view) await shot(page, `day${d}-plan-${w}-${scheme}`);
        if (view === 'practice') {
          await shot(page, `day${d}-practice-${w}-${scheme}`);
        }
        if (view === 'learn') {
          const opts = await page.evaluate(() => [...document.querySelectorAll('form.sd-quiz fieldset')].map(f => f.querySelectorAll('input[type=radio]').length));
          ok(opts.length >= 4 && opts.every(n => n >= 4), `Day ${d}: a rendered question has fewer than 4 options (${opts})`);
          if (w === '1366' && scheme === 'light') await shot(page, `day${d}-learn-${w}-${scheme}`);
        }
        if (w === '1366' && scheme === 'light' && (view === '' || view === 'practice')) {
          const v = await axe(page); ok(v.length === 0, `Day ${d} ${view || 'plan'} axe: ${v.join(', ')}`);
        }
      }
    }
    assert.deepEqual(errors, [], `console/network errors at ${w}px ${scheme}`); passed++;
    await page.close();
  }

  console.log(`PR A browser walk passed: ${passed} checks (${DAYS.length} days × 4 views × 2 widths × 2 schemes).`);
} finally {
  await browser?.close();
  server.close();
}
