import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createStudyServer } from '../backend/server.mjs';
import { accountPasswordHash, openStudyDatabase, setAccount } from '../backend/database.mjs';
import { days } from '../curriculum.js';
import { sessionQA } from '../session-qa.js';
import { topicIndex } from '../topic-index.js';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const email = 'test-browser@example.test';
const password = 'study test password only';
const db = openStudyDatabase(':memory:');
setAccount(db, email, await accountPasswordHash(password));
const { server } = createStudyServer({ db, now: () => new Date('2026-11-22T15:30:00Z'), sendReminder: null });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port + '/';
let browser;
const click = (page, text) => page.evaluate(text => {
  const item = Array.from(document.querySelectorAll('button')).find(node => node.textContent.trim() === text);
  if (!item || item.disabled) throw new Error('Button unavailable: ' + text);
  item.click();
}, text);
const waitForText = (page, selector, text) => page.waitForFunction(
  (selector, text) => document.querySelector(selector)?.textContent.includes(text), {}, selector, text
);

async function startBrowser() {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.evaluateOnNewDocument(() => {
    const Real = Date;
    const fixed = new Real('2026-11-22T15:30:00Z').valueOf();
    window.Date = class extends Real {
      constructor(...args) { super(...(args.length ? args : [fixed])); }
      static now() { return fixed; }
    };
  });
  page.on('pageerror', error => console.error('Page error:', error.message));
  return { context, page };
}

async function signIn(page) {
  await page.goto(base + '#progress');
  await page.waitForSelector('input[type="password"]');
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  await click(page, 'Sign in to sync');
  await waitForText(page, '.study-page', 'Progress saved to your account.');
}

try {
  browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const a = (await startBrowser()).page;
  const b = (await startBrowser()).page;
  await Promise.all([signIn(a), signIn(b)]);

  await a.goto(base + '#day-1');
  await waitForText(a, '.agenda-total', '6 h 30 min');
  await a.$eval('.study-form input[type=date]', input => {
    input.value = '2026-11-23';
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await waitForText(a, '.agenda-total', '2 h planned');
  await a.goto(base + '#day-1/assessment');
  await waitForText(a, '.study-page', 'unlock the test');

  await a.goto(base + '#day-1');
  await waitForText(a, '.study-session-status', 'Begin Day 1');
  await click(a, 'Begin Day 1');
  await waitForText(a, '.study-session-status', 'Check a block');
  for (const block of days[0].blocks) {
    await a.click('#block-' + block.id);
    await a.waitForFunction(id => document.getElementById(id)?.getAttribute('aria-label')?.startsWith('Uncheck '), {}, 'block-' + block.id);
  }
  await a.type('#evidence-1', 'A1 owner U1 · हिन्दी');
  await click(a, 'Save evidence');
  await waitForText(a, '.study-session-status', 'Test · Ready');
  await a.goto(base + '#day-1/assessment');
  await a.waitForSelector('.study-assessment');
  for (const [index, answer] of sessionQA[1].assessment.map(item => item.answer).entries()) {
    await a.click(`input[name="q${index}"][value="${answer}"]`);
  }
  await click(a, 'Submit self-check');
  await waitForText(a, '.study-page', '5/5');
  await a.goto(base + '#day-1');
  await a.waitForFunction(() => document.querySelector('#finish-day')?.disabled === false);
  await click(a, 'Finish Day 1');
  await waitForText(a, '.study-session-status', 'Completed');

  await b.goto(base + '#day-1');
  await b.reload();
  await waitForText(b, '.study-session-status', 'Completed');
  await click(b, 'Reopen Day 1');
  await waitForText(b, '.study-session-status', 'Check a block');
  await b.click('#block-lab');
  await b.waitForFunction(() => document.getElementById('block-lab')?.getAttribute('aria-label')?.startsWith('Complete '));

  await a.reload();
  await waitForText(a, '.study-session-status', 'Check a block');
  assert.equal(await a.$eval('#block-lab', item => item.getAttribute('aria-label').startsWith('Complete ')), true);
  assert.equal(await a.$eval('#evidence-1', item => item.value), 'A1 owner U1 · हिन्दी');
  await Promise.all([a.goto(base + '#day-1/my-notes'), b.goto(base + '#day-1/my-notes')]);
  await Promise.all([a.waitForSelector('#sd-note-1'), b.waitForSelector('#sd-note-1')]);
  await b.focus('#sd-note-1');
  await a.type('#sd-note-1', 'Account note from browser A');
  await waitForText(a, '.sd-savestate', 'Saved');
  await b.type('#sd-note-1', 'Unsaved draft from browser B');
  await waitForText(b, 'main', 'Compare notes from both browsers');
  assert.equal(await b.$eval('#sd-note-1', input => input.value), 'Unsaved draft from browser B');
  assert.equal(await b.$eval('.study-note-compare', item => item.textContent), 'Account note from browser A');
  await b.reload();
  await waitForText(b, 'main', 'Compare notes from both browsers');
  assert.equal(await b.$eval('#sd-note-1', input => input.value), 'Unsaved draft from browser B');
  await click(b, 'Save my draft over the account note');
  await b.waitForFunction(() => !document.querySelector('.study-note-compare'));
  await a.reload();
  await a.waitForFunction(() => document.querySelector('#sd-note-1')?.value === 'Unsaved draft from browser B');
  await a.goto(base + '#day-1/coach');
  await waitForText(a, 'main', 'Question 1 of 5');
  await click(a, 'Next question');
  await waitForText(a, 'main', 'Question 2 of 5');
  await a.goto(base + '#subjects');
  await waitForText(a, '.subject-grid', 'Spring Boot');
  await a.goto(base + '#topics');
  await waitForText(a, 'h1', 'Course topic index');
  assert.equal(await a.$$eval('main a[href^="#topic/"]', links => links.length), topicIndex.length);
  await a.type('main input[type="search"]', 'Union-Find');
  assert.deepEqual(await a.$$eval('main a[href^="#topic/"]', links => links.map(link => link.textContent)),
    ['Union-Find and dynamic connectivity']);
  const path = base + '#topic/j-equality-01';
  await Promise.all([a.goto(path), b.goto(path)]);
  await Promise.all([a.waitForSelector('#topic-takeaway'), b.waitForSelector('#topic-takeaway')]);
  assert.equal(await a.$$eval('details', elements => elements.every(element => !element.open)), true);
  await a.click('.topic-self-check input[value="1"]');
  await click(a, 'Check answer');
  await waitForText(a, '.topic-self-check [role="status"]', 'Try again.');
  await a.click('.topic-self-check input[value="0"]');
  await click(a, 'Check answer');
  await waitForText(a, '.topic-self-check [role="status"]', 'Correct.');
  await b.type('#topic-takeaway', 'My browser B draft');
  await a.type('#topic-takeaway', 'A collision alone proves nothing');
  await click(a, 'Save my takeaway');
  await waitForText(a, '#notice', 'Takeaway saved.');
  await click(b, 'Save my takeaway');
  await waitForText(b, '.study-note-compare', 'A collision alone proves nothing');
  assert.equal(await b.$eval('#topic-takeaway', input => input.value), 'My browser B draft');
  await b.reload();
  await waitForText(b, '.study-note-compare', 'A collision alone proves nothing');
  assert.equal(await b.$eval('#topic-takeaway', input => input.value), 'My browser B draft');
  await click(b, 'Save my draft over the saved takeaway');
  await waitForText(b, '#notice', 'Takeaway saved.');
  await a.reload();
  await a.waitForFunction(() => document.querySelector('#topic-takeaway')?.value === 'My browser B draft');
  await a.goto(base + '#topic/j-collections-01');
  await waitForText(a, 'main', 'dedicated notes and questions are still being written');
  assert.equal(await a.$eval('#topic-takeaway', input => input.value), '');
  await a.goto(base + '#day-4/revision');
  await waitForText(a, 'main', 'My topic takeaways');
  await waitForText(a, 'main .study-note-compare', 'My browser B draft');
  await a.goto(base + '#progress');
  await waitForText(a, '.study-page', 'Score and study consistency');
  assert.equal(await a.$eval('input[type="checkbox"]', item => item.disabled), true);
  console.log('Two isolated browsers verified session progress, note conflicts, topic drafts and revision, concept checks, and the score dashboard.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
  db.close();
}
