// Integrated browser check of the ROOT app at the GitHub Pages project path (/ai-learning-platform/).
// v2 port (Grok, 2026-11-22) of Codex's v1 check: the root now renders Study Desk v2 through
// ui/adapters/codex-adapter.js. Same intent as v1 (checks/legacy-v1/integrated.v1.mjs.txt): every session
// renders its own title, worked example and collapsed interview answers at desktop and 320px without
// overflow or console errors; Day 1 notes persist in Codex's storage key; the Day 1 flow completes
// through Codex grading. Usage: CHROME=/usr/bin/google-chrome node checks/integrated.mjs
import assert from 'node:assert/strict';
import { createReadStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { days } from '../curriculum.js';
import { sessionQA } from '../session-qa.js';
import { workedExamples } from '../worked-examples.js';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prefix = '/ai-learning-platform/';
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
const server = createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const filename = resolve(repo, path.slice(prefix.length) || 'index.html');
  if (!path.startsWith(prefix) || !filename.startsWith(repo + sep) || !mime[extname(filename)]) { response.writeHead(404); response.end(); return; }
  try {
    if (!(await stat(filename)).isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'content-type': mime[extname(filename)] });
    createReadStream(filename).pipe(response);
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port + prefix;
const storageKey = 'ai-learning-platform.study-desk.v1';
const screenshots = process.env.STUDY_SCREENSHOTS;
if (screenshots) await mkdir(screenshots, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const mainId = day => day.topics[0].toLowerCase();
let browser;

async function openRoot(viewport, errors) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + '?today=2026-11-22#today', { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 10000 });
  return page;
}
const go = async (page, hash) => { await page.evaluate(h => { location.hash = h; }, hash); await sleep(120); };

try {
  browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  for (const viewport of [{ width: 1280, height: 900 }, { width: 320, height: 720 }]) {
    const errors = [], page = await openRoot(viewport, errors);
    for (const day of days) {
      await go(page, 'day-' + day.number + '/learn');
      const info = await page.evaluate(id => ({
        h1: document.querySelector('h1')?.textContent || '',
        notes: document.querySelector(`[id="lesson-${id}"] .sd-notes`)?.textContent || '',
        fits: document.documentElement.scrollWidth <= innerWidth + 1,
        alert: document.querySelector('.sd-alert')?.textContent || ''
      }), mainId(day));
      assert.ok(info.h1.includes(day.title), `Day ${day.number} h1 "${info.h1}"`);
      assert.ok(info.notes.includes(workedExamples[day.number][0]), 'Worked example missing on Day ' + day.number);
      if (day.number === 56) {
        assert.match(info.notes, /class NumberAlgorithms/);
        assert.match(info.notes, /Mark composite numbers through 30/);
      }
      assert.ok(info.fits, `Day ${day.number} learn overflows at width ${viewport.width}`);
      assert.equal(info.alert, '', 'Curriculum alert on Day ' + day.number);
      await go(page, 'day-' + day.number + '/coach');
      const iq = await page.evaluate(() => ({ qs: [...document.querySelectorAll('article.sd-iq')].map(a => a.querySelector('details.sd-model')?.textContent || ''),
        open: document.querySelectorAll('article.sd-iq details[open]').length, fits: document.documentElement.scrollWidth <= innerWidth + 1 }));
      assert.ok(iq.qs.length >= sessionQA[day.number].questions.length, 'Interview questions missing on Day ' + day.number);
      assert.equal(iq.open, 0, 'Model answers must start collapsed on Day ' + day.number);
      assert.ok(iq.qs.some(t => t.includes(sessionQA[day.number].answers[0].slice(0, 60))), 'Codex model answer missing on Day ' + day.number);
      assert.ok(iq.fits, `Day ${day.number} coach overflows at width ${viewport.width}`);
    }
    for (const hash of ['today', 'course', 'calendar', 'activity', 'settings', 'account']) {
      await go(page, hash);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${hash} overflows at ${viewport.width}`);
      if (screenshots) await page.screenshot({ path: `${screenshots}/${hash}-${viewport.width}.png` });
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  // Day 1 personal notes persist in Codex's storage key and survive a reload.
  const errors = [], page = await openRoot({ width: 1280, height: 900 }, errors);
  await go(page, 'day-1/my-notes');
  await page.type('#sd-notes-ta', 'My own revision on ownership');
  await page.waitForFunction(k => JSON.parse(localStorage.getItem(k) || '{}').personalNotes?.[1] === 'My own revision on ownership', { timeout: 5000 }, storageKey);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  await go(page, 'day-1/my-notes');
  assert.equal(await page.$eval('#sd-notes-ta', t => t.value), 'My own revision on ownership');
  assert.deepEqual(errors, []);
  console.log('Integrated root check passed: ' + days.length + ' sessions × 2 viewports, notes persisted.');
} finally {
  await browser?.close();
  server.close();
}
