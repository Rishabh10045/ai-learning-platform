// Two-browser account check against backend/server.mjs serving the ROOT app (v2 UI via the Codex adapter).
// v2 port (Grok, 2026-11-22) of Codex's v1 check (checks/legacy-v1/qa-browser.v1.mjs.txt): two isolated
// Chromium contexts sign into one database account; A completes Day 1 through Codex rules, B sees it
// after reload, B reopens it, A sees the reopen. Usage: CHROME=/usr/bin/google-chrome node checks/qa-browser.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createStudyServer } from '../backend/server.mjs';
import { accountPasswordHash, openStudyDatabase, setAccount } from '../backend/database.mjs';
import { days } from '../curriculum.js';
import { sessionQA } from '../session-qa.js';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const email = 'test-browser@example.test';
const password = 'study test password only';
const db = openStudyDatabase(':memory:');
setAccount(db, email, await accountPasswordHash(password));
const { server } = createStudyServer({ db, now: () => new Date('2026-11-22T15:30:00Z'), sendReminder: null });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port + '/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
const text = (page, sel) => page.$eval(sel, n => n.textContent).catch(() => '');
const go = async (page, hash) => { await page.evaluate(h => { location.hash = h; }, hash); await sleep(250); };

async function startBrowser(errors) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + '?today=2026-11-22#account', { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 10000 });
  return page;
}
async function signIn(page) {
  await go(page, 'account');
  await page.waitForSelector('.sd-account-slot input[type="password"]');
  await page.type('.sd-account-slot input[type="email"]', email);
  await page.type('.sd-account-slot input[type="password"]', password);
  await page.click('.sd-account-slot button[type=submit]');
  await page.waitForFunction(() => /Account · /.test(document.querySelector('.sd-sync')?.textContent || ''), { timeout: 8000 });
}
async function practice(page, id, evidence) {
  await go(page, 'day-1/practice');
  const card = `[id="practice-${id}"]`;
  if (evidence) await page.$eval(`${card} textarea`, (t, v) => { t.value = v; t.dispatchEvent(new Event('input', { bubbles: true })); }, evidence);
  await page.$$eval(`${card} .sd-statechoice`, bs => bs[2].click());
  await sleep(400);
}
async function lessonButton(page, id, label) {
  await go(page, 'day-1/learn');
  await page.evaluate((id, label) => [...document.querySelectorAll(`[id="lesson-${id}"] .sd-lesson-actions button`)].find(b => b.textContent.includes(label))?.click(), id, label);
  await sleep(500);
}

try {
  browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const errors = [];
  const a = await startBrowser(errors), b = await startBrowser(errors);
  await signIn(a); await signIn(b);
  await go(a, 'day-1');
  assert.match(await text(a, '.sd-chip-budget'), /6h 30m/);
  for (const block of days[0].blocks.filter(x => x.id !== 'review' && x.id !== 'dsa')) {
    await practice(a, (block.id === 'foundations' ? 'j-foundations-01' : 'j-oop-01') + '.' + block.id);
  }
  await practice(a, 'd-hashing-01.dsa', 'dup ids ok');
  await practice(a, 'j-oop-01.review', 'A1 owner U1 · हिन्दी');
  await go(a, 'day-1/learn');
  for (const [i, q] of sessionQA[1].assessment.entries()) await a.$eval(`[id="q-j-oop-01-${i}-${q.answer}"]`, r => r.click());
  await a.$eval('form[data-quiz="q-j-oop-01"] button[type=submit]', x => x.click());
  await sleep(600);
  await lessonButton(a, 'd-hashing-01', 'Mark complete');
  await lessonButton(a, 'j-oop-01', 'Mark complete');
  await go(a, 'day-1');
  assert.match(await text(a, '.sd-dayhead .sd-badge'), /Complete/);
  await b.reload({ waitUntil: 'load' });
  await b.waitForFunction(() => document.body.dataset.ready === 'true');
  await sleep(500);
  await go(b, 'day-1');
  assert.match(await text(b, '.sd-dayhead .sd-badge'), /Complete/, 'B sees Day 1 complete');
  await lessonButton(b, 'j-oop-01', 'Reopen');
  await a.reload({ waitUntil: 'load' });
  await a.waitForFunction(() => document.body.dataset.ready === 'true');
  await sleep(500);
  await go(a, 'day-1');
  assert.match(await text(a, '.sd-dayhead .sd-badge'), /In progress/, 'A sees the reopen');
  assert.deepEqual(errors, []);
  console.log('Two-browser account check passed (complete, reload, reopen) against backend/server.mjs.');
} finally {
  await browser?.close();
  server.close();
}
