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
  if (!path.startsWith(prefix) || !filename.startsWith(repo + sep) || !mime[extname(filename)]) {
    response.writeHead(404);
    response.end();
    return;
  }
  try {
    if (!(await stat(filename)).isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'content-type': mime[extname(filename)] });
    createReadStream(filename).pipe(response);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port + prefix;
let browser;
const screenshots = process.env.STUDY_SCREENSHOTS;
if (screenshots) await mkdir(screenshots, { recursive: true });
const storageKey = 'ai-learning-platform.study-desk.v1';
const getText = (page, selector) => page.$eval(selector, node => node.textContent);
const buttonByText = (page, label) => page.evaluate(label => {
  const target = Array.from(document.querySelectorAll('button')).find(item => item.textContent.trim() === label);
  if (!target || target.disabled) throw new Error('Button unavailable: ' + label);
  target.click();
}, label);
const readState = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);

async function newPage(viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.evaluateOnNewDocument(() => {
    const RealDate = Date;
    const fixed = new RealDate('2026-11-22T15:30:00Z').valueOf();
    window.Date = class extends RealDate {
      constructor(...args) { super(...(args.length ? args : [fixed])); }
      static now() { return fixed; }
    };
  });
  return page;
}

async function visit(page, hash, view) {
  await page.goto(base + hash, { waitUntil: 'load' });
  await page.waitForFunction(view => document.querySelector('.sd-main')?.dataset.view === view, {}, view);
}

try {
  browser = await puppeteer.launch({
    executablePath: process.env.CHROME || '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const layouts = [
    { width: 1366, height: 900 },
    { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    { width: 320, height: 700, isMobile: true, hasTouch: true }
  ];
  for (const viewport of layouts) {
    const page = await newPage(viewport);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(response.url());
    });
    const routes = [
      ['#day-1', 'plan', 'Build the first booking flow'],
      ['#day-1/learn', 'learn', 'Build the first booking flow'],
      ['#day-27/learn', 'learn', 'Two pointers, windows and search'],
      ['#day-54/learn', 'learn', 'Java-first AI deployment and final review'],
      ['#day-54/practice', 'practice', 'Java-first AI deployment and final review'],
      ['#day-54/revision', 'revision', 'Java-first AI deployment and final review'],
      ['#day-54/my-notes', 'my-notes', 'Java-first AI deployment and final review'],
      ['#day-54/coach', 'coach', 'Java-first AI deployment and final review']
    ];
    for (const [hash, view, title] of routes) {
      await visit(page, hash, view);
      assert.equal(await getText(page, 'h1'), title);
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
      assert.ok(fits, `${hash} overflows at width ${viewport.width}`);
      if (view === 'learn') {
        assert.ok(await page.$('.lesson-diagram'), 'Missing interactive walkthrough for ' + hash);
        if (screenshots && hash === '#day-1/learn') {
          await page.$eval('.lesson-diagram', item => item.scrollIntoView({ block: 'center' }));
          await page.screenshot({ path: resolve(screenshots, 'lesson-' + viewport.width + '.png') });
        }
        assert.ok(await page.evaluate(() => Boolean(
          document.querySelector('.sd-video').compareDocumentPosition(document.querySelector('.sd-notes')) &
          Node.DOCUMENT_POSITION_FOLLOWING
        )));
      }
    }
    for (const [hash, title] of [['#topics', 'Course topic index'], ['#topic/ai-rag-01', 'Retrieval and grounded generation']]) {
      await page.goto(base + hash);
      await page.waitForFunction(title => document.querySelector('h1')?.textContent === title, {}, title);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `${hash} overflows at width ${viewport.width}`);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('30 route and layout checks passed across desktop and two mobile widths.');

  const page = await newPage(layouts[0]);
  for (const day of days) {
    await visit(page, '#day-' + day.number + '/learn', 'learn');
    assert.equal(await getText(page, 'h1'), day.title);
    assert.ok((await getText(page, '.sd-notes')).includes(workedExamples[day.number][0]), day.title);
    await visit(page, '#day-' + day.number + '/coach', 'coach');
    assert.equal(await getText(page, 'h1'), day.title);
    assert.equal(await getText(page, '.interview-guidance p'), sessionQA[day.number].answers[0]);
    assert.equal(await page.$eval('.interview-guidance', item => item.open), false);
  }
  console.log('Learn and Coach rendered the matching worked example and collapsed answer for all ' + days.length + ' sessions.');

  await visit(page, '#day-26/learn', 'learn');
  assert.match(await getText(page, '.sd-notes'), /class SumTrace/);
  assert.match(await getText(page, '.sd-notes'), /repeats work/);
  await visit(page, '#day-27/practice', 'practice');
  assert.match(await getText(page, '.sd-main'), /recursive lower bound/);

  await visit(page, '#day-55/learn', 'learn');
  assert.match(await getText(page, '.sd-notes'), /class Connectivity/);
  assert.ok(await page.$('.lesson-diagram'));

  await visit(page, '#day-56/learn', 'learn');
  assert.match(await getText(page, '.sd-notes'), /class NumberAlgorithms/);
  assert.ok(await page.$('.lesson-diagram'));
  await visit(page, '#day-56/practice', 'practice');
  assert.match(await getText(page, '.sd-main'), /fold an array LCM/);

  await visit(page, '#day-1/learn', 'learn');
  await page.select('#diagram-scenario-1', '1');
  await buttonByText(page, 'Next step');
  await buttonByText(page, 'Next step');
  await buttonByText(page, 'Next step');
  assert.match(await getText(page, '#diagram-detail-1'), /Owner: U1.*Result: false/s);
  await visit(page, '#day-2/learn', 'learn');
  await page.select('#diagram-scenario-2', '1');
  await page.click('.lesson-flow li:last-child button');
  assert.match(await getText(page, '#diagram-detail-2'), /two success results|Two success results/);
  await visit(page, '#day-29/learn', 'learn');
  await page.click('.lesson-flow li:last-child button');
  assert.match(await getText(page, '#diagram-detail-29'), /List MRU → LRU: C, A.*Map keys: A, C/s);
  await visit(page, '#day-39/learn', 'learn');
  await page.select('#diagram-scenario-39', '1');
  await page.click('.lesson-flow li:last-child button');
  assert.match(await getText(page, '#diagram-detail-39'), /Result: help fallback/);

  await visit(page, '#day-1/my-notes', 'my-notes');
  await page.type('#sd-note-1', 'My own revision on ownership');
  await page.click('#sd-tab-revision');
  await page.waitForFunction(() => document.querySelector('.sd-mynotes-card')?.textContent.includes('My own revision'));
  assert.equal((await readState(page)).personalNotes[1], 'My own revision on ownership');
  await page.reload();
  assert.match(await getText(page, '.sd-mynotes-card'), /My own revision/);

  await visit(page, '#day-1/learn', 'learn');
  await page.$eval('.video-log input[type=number]', field => { field.value = '9'; });
  await page.click('.video-log input[type=checkbox]');
  await page.click('.video-log button[type=submit]');
  await page.waitForFunction(() => document.querySelector('.video-log [role=status]')?.textContent === 'Logged 9 min');
  await page.reload();
  assert.match(await getText(page, '.video-log [role=status]'), /Logged 9 min/);
  await page.click('.study-details summary');
  await page.type('.udemy-form input[type=text]', 'Purchased Java lesson');
  await page.type('.udemy-form input[type=url]', 'https://www.udemy.com/course/java/learn/lecture/123');
  await page.click('.udemy-form button');
  await page.waitForFunction(() => Array.from(document.querySelectorAll('.sd-video-title'))
    .some(item => item.textContent === 'Purchased Java lesson'));

  await visit(page, '#day-1', 'plan');
  assert.equal(await page.$eval('#block-lab', item => item.disabled), true);
  await buttonByText(page, 'Begin Day 1');
  await page.click('#block-lab');
  assert.equal((await readState(page)).sessions[1].checked[0], 'lab');
  await page.type('#evidence-1', 'Main runs and owner remains U1');
  await buttonByText(page, 'Save evidence');
  await page.waitForFunction(() => document.querySelector('#evidence-1')?.value === 'Main runs and owner remains U1');
  await page.goto(base + '#progress');
  await buttonByText(page, 'Mark unavailable');
  assert.match(await getText(page, '.study-page'), /Day 1 stays pending/);
  await visit(page, '#day-1', 'plan');
  assert.equal(await page.$eval('#block-lab', item => item.disabled), true);
  assert.match(await getText(page, '.study-session-status'), /Day 1 stays pending/);
  assert.equal((await readState(page)).sessions[1].evidence, 'Main runs and owner remains U1');
  await page.goto(base + '#progress');
  await page.click('.study-availability-list button');
  await visit(page, '#day-1', 'plan');
  for (const id of ['http', 'ai', 'dsa', 'review']) {
    await page.click('#block-' + id);
    const model = await readState(page);
    if (!model.sessions[1].checked.includes(id)) {
      const details = await page.$eval('#block-' + id, item => {
        const rect = item.getBoundingClientRect();
        const front = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return { disabled: item.disabled, rect: rect.toJSON(), front: front?.outerHTML.slice(0, 300) };
      });
      assert.fail('Failed to check ' + id + ': ' + JSON.stringify({ model: model.sessions[1], details }));
    }
  }
  assert.equal(await page.$eval('#finish-day', node => node.disabled), true);
  await page.goto(base + '#day-1/assessment');
  await page.waitForSelector('.study-assessment');
  const applied = sessionQA[1].assessment[2];
  for (const [index, item] of sessionQA[1].assessment.entries()) {
    const choice = (item.answer + 1) % item.choices.length;
    await page.click(`input[name="q${index}"][value="${choice}"]`);
  }
  await buttonByText(page, 'Submit self-check');
  await page.waitForSelector('.assessment-review');
  assert.equal(await page.$eval('.assessment-review', item => item.open), false);
  await page.click('.assessment-review summary');
  assert.ok((await getText(page, '.assessment-review')).includes(applied.explanation));
  for (const [index, item] of sessionQA[1].assessment.entries()) {
    await page.click(`input[name="q${index}"][value="${item.answer}"]`);
  }
  await buttonByText(page, 'Submit self-check');
  await page.waitForFunction(() => document.querySelector('.study-page')?.textContent.includes('5/5'));
  await visit(page, '#day-1', 'plan');
  assert.equal(await page.$eval('#finish-day', node => node.disabled), false);
  await buttonByText(page, 'Finish Day 1');
  assert.ok((await readState(page)).sessions[1].completedOn);
  await page.goto(base + '#today');
  assert.match(await getText(page, '.study-session-status'), /Begin this study day/);
  assert.equal((await readState(page)).sessions[2], undefined);

  await visit(page, '#day-54/coach', 'coach');
  assert.equal(await page.$eval('.interview-guidance', item => item.open), false);
  await page.click('.interview-guidance summary');
  assert.equal(await getText(page, '.interview-guidance p'), sessionQA[54].answers[0]);
  await buttonByText(page, 'Next question');
  assert.equal(await page.$eval('.interview-guidance', item => item.open), false);
  await page.click('.interview-guidance summary');
  assert.equal(await getText(page, '.interview-guidance p'), sessionQA[54].answers[1]);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      async writeText(text) { window.copiedStudyPrompt = text; }
    } });
  });
  await buttonByText(page, 'Copy study prompt');
  assert.match(await page.evaluate(() => window.copiedStudyPrompt), /Day 54.*Java-first AI deployment/);
  await buttonByText(page, 'Copy interview prompt');
  const prompt = await page.evaluate(() => window.copiedStudyPrompt);
  assert.match(prompt, /separate 0–4 scores/);
  assert.ok(!prompt.includes(sessionQA[54].answers[0]));
  console.log('Interactive diagrams, notes, Udemy, watch logs, start/finish, availability and coach clipboard flows passed.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
