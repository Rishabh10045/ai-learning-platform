// Screenshots of the ROOT app (index.html) for given days, desktop + 320px, plus per-day render checks.
// Usage: NODE_PATH=<puppeteer-core> node ui/checks/root-shots.mjs <outDir> [fromDay] [toDay]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = path.resolve(process.argv[2] || '/workspace/study-desk-checks/day2'); fs.mkdirSync(out, { recursive: true });
const from = +(process.argv[3] || 1), to = +(process.argv[4] || 2), shots = to - from < 2;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((req, res) => { let pn = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (pn.endsWith('/')) pn += 'index.html';
  const p = path.join(repo, pn); if (!p.startsWith(repo) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${srv.address().port}`;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const VP = { desktop: { width: 1366, height: 900 }, m320: { width: 320, height: 640, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
const report = [];
for (const [vpName, vp] of Object.entries(VP)) {
  if (!shots && vpName === 'm320') { /* overflow-only pass still runs */ }
  const ctx = await browser.createBrowserContext(), page = await ctx.newPage(), errors = [];
  await page.setViewport(vp);
  page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${origin}/?today=2026-11-22#day-${from}`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 10000 });
  for (let d = from; d <= to; d++) {
    for (const view of ['', '/learn', '/practice', '/coach']) {
      await page.evaluate(h => { location.hash = h; }, `day-${d}${view}`); await new Promise(r => setTimeout(r, 250));
      const info = await page.evaluate(() => ({
        h1: document.querySelector('h1')?.textContent.trim(), alert: document.querySelector('.sd-alert')?.textContent || '',
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        words: (document.querySelector('.sd-notes') || { innerText: '' }).innerText.split(/\s+/).filter(Boolean).length,
        notesBlocks: document.querySelectorAll('.sd-notes').length, code: document.querySelectorAll('.sd-notes pre').length,
        videos: document.querySelectorAll('.sd-video:not(.sd-reading)').length, readings: document.querySelectorAll('.sd-reading').length,
        quiz: [...document.querySelectorAll('form[data-quiz] fieldset')].map(f => f.querySelectorAll('input[type=radio]').length),
        iq: document.querySelectorAll('article.sd-iq').length, practice: document.querySelectorAll('.sd-practice').length,
        budget: document.querySelector('.sd-chip-budget')?.textContent.trim() || '', mins: (document.querySelector('.sd-main')?.innerText.match(/\d+ min/g) || []).slice(0, 10)
      }));
      report.push({ vp: vpName, day: d, view: view || '/plan', ...info, errors: errors.splice(0) });
      if (shots) await page.screenshot({ path: path.join(out, `day${d}${(view || '-plan').replace('/', '-')}-${vpName}.png`), fullPage: view === '' });
    }
  }
  await ctx.close();
}
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
await browser.close(); srv.close();
console.log(report.filter(r => r.vp === 'desktop').map(r => `D${r.day}${r.view} h1="${r.h1}" words=${r.words} code=${r.code} vids=${r.videos} read=${r.readings} quiz=${r.quiz.join('/')} iq=${r.iq} pr=${r.practice} ${r.budget} ${r.alert ? 'ALERT ' + r.alert : ''} ${r.errors.length ? 'ERR ' + r.errors[0] : ''}`).join('\n'));
const of = report.filter(r => r.overflow).map(r => r.vp + ' D' + r.day + r.view); console.log('overflow:', of.length ? of.join(', ') : 'none');
