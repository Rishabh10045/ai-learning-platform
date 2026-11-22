// Headless Chrome: real Day 1 in the integrated preview (ui/preview.html) with Codex persistence.
// Usage: NODE_PATH=<dir with puppeteer-core> node ui/checks/day1-integration.mjs [screenshotDir]
// Local only: a static server like GitHub Pages + Codex's backend/server.mjs on a temp SQLite DB (not the deployed API).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { S, E, codex, createCodexAdapter, codexBlob, SIDECAR_KEY } from './codex-load.mjs';
import { createStudyServer } from '../../backend/server.mjs';
import { openStudyDatabase, setAccount, accountPasswordHash } from '../../backend/database.mjs';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '..', '..');
const shots = path.resolve(process.argv[2] || '/workspace/study-desk-checks/day1');
fs.mkdirSync(shots, { recursive: true });
const A = createCodexAdapter({ S, E, codex });
const DAY = '2026-11-22', KEY = codex.storageKey;
const { main, lane } = A.lessonsByDay[1];

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const stat = http.createServer((req, res) => {
  if (req.url === '/__seed') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<!doctype html><link rel="icon" href="data:,"><title>seed</title>'); }
  let pn = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (pn.endsWith('/')) pn += 'index.html';
  const p = path.join(repo, pn);
  if (!p.startsWith(repo) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => stat.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${stat.address().port}`;
const PAGE = process.env.STUDY_PAGE || '/';
let PIN = DAY;
const url = hash => `${origin}${PAGE}?today=${PIN}${hash ? '#' + hash : ''}`;
const W = A.lessonsByDay[1].warmup;
const all1 = [main, lane, W].filter(Boolean);

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const VP = { desktop: { width: 1366, height: 900 }, m320: { width: 320, height: 640, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };

async function open(ctx, vp, errors) {
  const page = await ctx.newPage();
  await page.setViewport(vp);
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  return page;
}
async function go(page, hash) {
  await page.goto(url(hash), { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.previewReady === 'true', { timeout: 10000 });
  await sleep(150);
}
async function route(page, hash) { await page.evaluate(h => { location.hash = h; }, hash); await sleep(250); }
const txt = (page, sel) => page.$eval(sel, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
const stored = page => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const toast = page => txt(page, '.sd-toast');
let D = 1, M = main; // day + main lesson the helpers act on
async function setPractice(page, id, status, evidence) {
  await route(page, `day-${D}/practice`);
  const card = `[id="practice-${id}"]`;
  if (evidence != null) { await page.$eval(`${card} textarea`, (t, v) => { t.value = v; t.dispatchEvent(new Event('input', { bubbles: true })); }, evidence); }
  const idx = { pending: 0, 'in-progress': 1, complete: 2 }[status];
  await page.$$eval(`${card} .sd-statechoice`, (bs, i) => bs[i].click(), idx);
  await sleep(250);
}
async function answerQuiz(page, right = true) {
  await route(page, `day-${D}/learn`);
  for (let i = 0; i < M.quiz.questions.length; i++) {
    const q = M.quiz.questions[i], pick = right ? q.answer : (q.answer + 1) % q.options.length;
    await page.$eval(`[id="q-${M.id}-${i}-${pick}"]`, r => r.click());
  }
  await page.$eval(`form[data-quiz="q-${M.id}"] button[type=submit]`, b => b.click());
  await sleep(300);
}
async function lessonButton(page, lessonId, label) {
  await route(page, `day-${D}/learn`);
  const ok = await page.evaluate((id, label) => {
    const b = [...document.querySelectorAll(`[id="lesson-${id}"] .sd-lesson-actions button`)].find(x => x.textContent.includes(label));
    if (b) b.click(); return !!b;
  }, lessonId, label);
  await sleep(300);
  return ok;
}
async function shoot(page, name, sel) {
  if (sel) await page.$eval(sel, e => e.scrollIntoView({ block: 'start' })).catch(() => {});
  await sleep(150);
  await page.screenshot({ path: path.join(shots, name + '.png') });
}

// ---------- 1. Content: every Day 1 element renders with real data ----------
{
  const errors = [], ctx = await browser.createBrowserContext(), page = await open(ctx, VP.desktop, errors);
  await go(page, 'day-1');
  check('preview: real curriculum resolves without a curriculum error', !(await page.$('.sd-alert')));
  check('Day 1 plan: Sunday 22 Nov 2026 is a 6h 30m long day (2h core + 4h 30m stretch)', /6h 30m \(2h core \+ 4h 30m stretch\)/.test(await txt(page, '.sd-chip-budget')));
  check('Day 1 plan: main lesson j-oop-01 + DSA lane d-hashing-01', await page.evaluate(() => ['j-oop-01', 'd-hashing-01'].every(id => [...document.querySelectorAll('.sd-lrow code')].some(c => c.textContent === id))));
  await route(page, 'day-1/learn');
  const learn = await page.evaluate(() => ({
    videos: [...document.querySelectorAll('[id="lesson-j-oop-01"] .sd-video:not(.sd-reading) .sd-video-t')].map(a => a.href),
    readings: [...document.querySelectorAll('[id="lesson-j-oop-01"] .sd-reading a')].map(a => a.href),
    paras: document.querySelectorAll('[id="lesson-j-oop-01"] .sd-notes p').length,
    code: [...document.querySelectorAll('[id="lesson-j-oop-01"] .sd-notes pre')].map(p => p.textContent).join('\n'),
    words: (document.querySelector('[id="lesson-j-oop-01"] .sd-notes') || { innerText: '' }).innerText.split(/\s+/).length,
    diagram: !!document.querySelector('[id="lesson-j-oop-01"] .sd-diagram'),
    quizQs: document.querySelectorAll('form[data-quiz="q-j-oop-01"] fieldset').length,
    quizLocked: !!document.querySelector('form[data-quiz="q-j-oop-01"].is-locked button[disabled]'),
    concept: !!document.querySelector('[id="lesson-j-oop-01"] .sd-notes details.sd-reveal'),
    laneNotes: (document.querySelector('[id="lesson-d-hashing-01"] .sd-notes') || { innerText: '' }).innerText.length
  }));
  check('Learn: 5 real YouTube videos (objects, DNS, HTTP, LLM, hashing) (watch URLs, not search links)', learn.videos.length === 5 && learn.videos.every(u => /youtube\.com\/watch\?v=/.test(u)), learn.videos.join(' '));
  check('Learn: readings are direct https links', learn.readings.length >= 5 && learn.readings.every(u => /^https:\/\//.test(u) && !/search/.test(u)), learn.readings.length + ' readings');
  check('Learn: written notes are real (≥ 900 words, runnable ClaimTrace.java)', learn.words >= 900 && /class ClaimTrace/.test(learn.code), learn.words + ' words');
  check('Learn: diagram + concept check render', learn.diagram && learn.concept);
  check('Learn: 5-question lesson check, locked until blocks + evidence are done', learn.quizQs === 5 && learn.quizLocked);
  check('Learn: DSA lane lesson has its own notes', learn.laneNotes > 200);
  await shoot(page, 'desktop-learn', '[id="lesson-j-oop-01"]');
  await shoot(page, 'desktop-quiz', 'form[data-quiz="q-j-oop-01"]');
  await route(page, 'day-1/practice');
  const practice = await page.evaluate(() => [...document.querySelectorAll('.sd-practice')].map(c => ({ id: c.id, prompt: [...c.querySelectorAll(':scope > p')].filter(p => !p.classList.contains('sd-meta') && !p.classList.contains('sd-muted')).map(p => p.textContent).join(' '), checks: c.querySelectorAll('.sd-checklist li').length })));
  check('Practice: warm-up + 4 required Codex blocks + DSA + topic packets + stretch, all with prompts', practice.length === all1.reduce((n, l) => n + l.practice.length, 0) && practice.every(p => p.prompt.length > 20), practice.map(p => p.id.replace('practice-', '') + ':' + p.checks).join(' '));
  await shoot(page, 'desktop-practice', '.sd-panel');
  await route(page, 'day-1/coach');
  const coach = await page.evaluate(() => ({ qs: document.querySelectorAll('article.sd-iq').length, answers: document.querySelectorAll('article.sd-iq details.sd-model').length, open: document.querySelectorAll('article.sd-iq details[open]').length, none: document.querySelectorAll('.sd-noanswer').length }));
  check('Interview: '+all1.reduce((n, l) => n + (l.interview || []).length, 0)+' questions (session + topic packets + lane + warm-up), every one with a collapsed model answer', coach.qs === all1.reduce((n, l) => n + (l.interview || []).length, 0) && coach.answers === coach.qs && coach.open === 0 && coach.none === 0, JSON.stringify(coach));
  await page.$eval('article.sd-iq details', d => { d.open = true; });
  await shoot(page, 'desktop-interview', '.sd-panel');
  await route(page, 'day-1/my-notes');
  check('My notes: ≥5 per-topic takeaway editors + ≥16 coach takeaways kept separate (collapsed)', await page.evaluate(() => document.querySelectorAll('textarea.sd-tk-ta').length >= 5 && document.querySelector('details.sd-coach-tk:not([open])') && document.querySelectorAll('details.sd-coach-tk li').length >= 16));
  check('content pass: no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ---------- 2. Complete Day 1 locally, reload, reopen ----------
let completedBlob;
{
  const errors = [], ctx = await browser.createBrowserContext(), page = await open(ctx, VP.desktop, errors);
  await go(page, 'day-1/learn');
  check('gate: Mark complete is refused before practice/quiz (nothing stored)', await lessonButton(page, 'j-oop-01', 'Mark complete') && (await stored(page)) === null);
  for (const id of ['j-foundations-01.foundations', 'j-oop-01.lab', 'j-oop-01.http', 'j-oop-01.ai']) await setPractice(page, id, 'complete');
  await setPractice(page, 'd-hashing-01.dsa', 'complete', 'https://github.com/example/dup-ids');
  await setPractice(page, 'j-oop-01.review', 'complete', 'first=true second=false owner=U1');
  let s = await stored(page);
  check('practice -> Codex blocks checked + review evidence saved', s?.sessions?.[1]?.checked?.length === 6 && s.sessions[1].evidence === 'first=true second=false owner=U1', JSON.stringify(s?.sessions?.[1]?.checked));
  await answerQuiz(page, false);
  s = await stored(page);
  check('quiz: wrong answers are scored and not passed', s.assessments[1].score < codex.passCount(1) && /Need 80%/.test(await toast(page)), await toast(page));
  check('quiz: Codex explanations shown per question after an attempt', await page.$$eval('form[data-quiz="q-j-oop-01"] .sd-explain', e => e.length) === 5);
  await answerQuiz(page, true);
  s = await stored(page);
  check('quiz: all correct -> 5/5 stored by Codex grading', s.assessments[1].score === 5 && s.assessments[1].attempts === 2 && /5\/5 \(100%\)\. Passed/.test(await toast(page)));
  await lessonButton(page, 'd-hashing-01', 'Mark complete');
  await lessonButton(page, 'j-oop-01', 'Mark complete');
  s = await stored(page);
  check('complete: Codex session 1 completedOn = 22 Nov 2026', s.sessions[1].completedOn === DAY);
  await route(page, 'day-1/coach');
  for (let i = 0; i < 3; i++) { await page.$$eval('article.sd-iq button[data-qid]', (bs, i) => bs[i].click(), i); await sleep(200); }
  await route(page, 'day-1/my-notes');
  await page.type('#sd-notes-ta', 'Invariant: a failed claim never changes the owner.');
  await page.waitForFunction(() => (document.getElementById('sd-notes-status') || {}).textContent === 'Saved', { timeout: 5000 }).catch(() => {});
  await page.type('textarea[data-topic="j-oop-01"]', 'Validate first, then mutate. Mistake: setter on owner.');
  await page.click('button[data-save-topic="j-oop-01"]'); await sleep(300);
  s = await stored(page);
  check('notes + takeaway saved in Codex fields (personalNotes[1], topicTakeaways)', s.personalNotes[1] === 'Invariant: a failed claim never changes the owner.' && s.topicTakeaways['j-oop-01'] === 'Validate first, then mutate. Mistake: setter on owner.');
  await route(page, 'today');
  const xp1 = await txt(page, '.sd-stat-xp .sd-stat-v'), status1 = await page.evaluate(() => document.querySelector('.sd-sync')?.textContent);
  check('score: XP and streak shown on Today after completing Day 1', /^[\d,]+ XP$/.test(xp1) && parseInt(xp1.replace(/,/g, '')) >= 300 && /1-day streak/.test(await txt(page, '.sd-stat-streak')), xp1 + ' · ' + status1);
  await route(page, 'day-1');
  check('completion status: Day 1 shows Complete', /Complete/.test(await txt(page, '.sd-dayhead .sd-badge')));
  // reload
  await page.reload({ waitUntil: 'load' }); await page.waitForFunction(() => document.body.dataset.previewReady === 'true'); await sleep(200);
  await route(page, 'today');
  const xp2 = await txt(page, '.sd-stat-xp .sd-stat-v');
  await route(page, 'day-1/my-notes');
  const notesAfter = await page.$eval('#sd-notes-ta', t => t.value), tkAfter = await page.$eval('textarea[data-topic="j-oop-01"]', t => t.value);
  await route(page, 'day-1/learn');
  const quizBadge = await txt(page, 'form[data-quiz="q-j-oop-01"] h3 .sd-badge');
  check('reload: XP identical, notes + takeaway + quiz pass preserved', xp2 === xp1 && notesAfter.startsWith('Invariant') && tkAfter.startsWith('Validate first') && /Passed/.test(quizBadge), `${xp1} -> ${xp2}, ${quizBadge}`);
  // navigate away and reopen Day 1
  await route(page, 'course'); await route(page, 'day-2'); await route(page, 'day-1/coach');
  check('navigate away + reopen Day 1: interview marks preserved', await page.$$eval('article.sd-iq button[aria-pressed="true"]', b => b.length) === 3);
  await route(page, 'day-1');
  check('navigate away + reopen Day 1: still Complete', /Complete/.test(await txt(page, '.sd-dayhead .sd-badge')));
  await shoot(page, 'desktop-day1-complete');
  completedBlob = await page.evaluate(k => localStorage.getItem(k), KEY);
  // reopen the study day (Codex reopen) then finish again
  await lessonButton(page, 'j-oop-01', 'Reopen');
  s = await stored(page);
  check('reopen: Codex day reopened; notes, evidence, takeaway and blocks kept; self-check marked stale', s.sessions[1].completedOn === '' && s.sessions[1].evidence && s.personalNotes[1] && s.topicTakeaways['j-oop-01'] && s.sessions[1].checked.length === 6 && s.assessments[1].stale === true);
  await answerQuiz(page, true);
  await lessonButton(page, 'j-oop-01', 'Mark complete');
  s = await stored(page);
  check('re-finish after reopen: complete again with attempts history (3)', s.sessions[1].completedOn === DAY && s.assessments[1].attempts === 3 && !s.assessments[1].stale);
  check('flow: no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ---------- 3. Upgrade from the existing learner profile shapes ----------
{
  const errors = [], ctx = await browser.createBrowserContext(), page = await open(ctx, VP.desktop, errors);
  const old = codexBlob([
    [{ kind: 'begin', day: 1 }], ...['foundations', 'lab', 'http', 'ai', 'dsa', 'review'].map(id => [{ kind: 'block', day: 1, id, done: true }]),
    [{ kind: 'evidence', day: 1, evidence: 'Output from the old app', notes: 'revisit this()' }],
    [{ kind: 'assessment', day: 1, choices: codex.sessionQA[1].assessment.map(a => a.answer), bankVersion: codex.assessmentVersion }],
    [{ kind: 'finish', day: 1 }], [{ kind: 'notes', day: 1, text: 'Notes written in the old Codex app' }],
    [{ kind: 'topicTakeaway', topicId: 'h-request-01', text: 'DNS finds, HTTP routes', base: '' }],
    [{ kind: 'watch', day: 1, id: 'BSVKUk58K6U', minutes: 10, watched: true }],
    [{ kind: 'availability', date: '2026-11-25', unavailable: true }]
  ]);
  const legacyUi = fs.readFileSync(path.join(repo, 'ui/fixtures/legacy-progress.fixture.js'), 'utf8');
  old.sessions[1].checked = old.sessions[1].checked.filter(id => id !== 'foundations'); // app.js@76d7e56 shape: no warm-up block
  const raw = JSON.stringify(old), demo = '{"schemaVersion":2,"lessons":{"JC-01":{"status":"complete"}}}';
  await page.goto(`${origin}/__seed`, { waitUntil: 'domcontentloaded' });   // same origin, not the app: seed storage before the app loads
  await page.evaluate((k, raw, demo, legacy) => { localStorage.clear(); localStorage.setItem(k, raw); localStorage.setItem('studydesk.preview.v2', demo); localStorage.setItem('studydesk.legacy.v1.fixture', legacy); }, KEY, raw, demo, legacyUi.slice(0, 2000));
  await go(page, 'day-1');
  check('upgrade: old Codex profile shows Day 1 Complete', /Complete/.test(await txt(page, '.sd-dayhead .sd-badge')));
  await route(page, 'day-1/my-notes');
  check('upgrade: old notes + takeaway visible', (await page.$eval('#sd-notes-ta', t => t.value)) === 'Notes written in the old Codex app' && (await page.$eval('textarea[data-topic="h-request-01"]', t => t.value)) === 'DNS finds, HTTP routes');
  await route(page, 'day-1/learn');
  check('upgrade: score preserved (lesson check passed, 10 min watched)', /Passed/.test(await txt(page, 'form[data-quiz="q-j-oop-01"] h3 .sd-badge')) && /Watched: 10 min/.test(await txt(page, '[id="lesson-j-oop-01"] .sd-watchlog')));
  await route(page, 'today');
  check('upgrade: XP derived from the old profile', parseInt((await txt(page, '.sd-stat-xp .sd-stat-v')).replace(/,/g, '')) >= 200);
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  const same = await page.evaluate(k => localStorage.getItem(k), KEY);
  check('upgrade: loading never rewrites the Codex blob; storage key unchanged; demo keys untouched', same === raw && keys.includes(KEY) && (await page.evaluate(() => localStorage.getItem('studydesk.preview.v2'))) === demo, keys.join(','));
  await route(page, 'day-2/my-notes');
  check('upgrade: Day 2 is the next session (IDs stable: j-concurrency-01)', /j-concurrency-01/.test(await page.evaluate(() => document.querySelector('.sd-main').innerText)) || /Threads|concurr/i.test(await txt(page, '.sd-dayhead h1')));
  check('upgrade: no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ---------- 4. Two browsers on one account (Codex backend, local temp DB, API restart) ----------
{
  const errors = [], dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sd-acct-')), dbFile = path.join(dir, 'study.sqlite');
  const nowFn = () => new Date('2026-11-22T16:30:00Z');
  const startApi = async port => {
    const db = openStudyDatabase(dbFile);
    const { server } = createStudyServer({ db, now: nowFn, allowedOrigins: [origin], sendReminder: null });
    await new Promise(r => server.listen(port, '127.0.0.1', r));
    return { server, db, port: server.address().port };
  };
  let api = await startApi(0);
  setAccount(api.db, 'deepak@example.test', await accountPasswordHash('preview-only-password-1'));
  const apiOrigin = `http://127.0.0.1:${api.port}`;
  async function signIn(page) {
    const back = await page.evaluate(() => location.hash.slice(1));
    let A = '#pv-account';
    if (PAGE.includes('preview')) await page.$eval('#pv-account', d => { d.open = true; });
    else { await route(page, 'account'); A = '.sd-account-slot'; }
    await page.$eval(A + ' input[type=url]', (i, v) => { i.value = v; }, apiOrigin);
    await page.type(A + ' input[type=email]', 'deepak@example.test');
    await page.type(A + ' input[type=password]', 'preview-only-password-1');
    await page.click(A + ' button[type=submit]');
    await page.waitForFunction(() => /Account · /.test(document.querySelector('.sd-sync')?.textContent || ''), { timeout: 8000 });
    if (back && back !== 'account') await route(page, back);
  }
  const ctxA = await browser.createBrowserContext(), a = await open(ctxA, VP.desktop, errors);
  await go(a, 'day-1/practice'); await signIn(a);
  for (const id of ['j-foundations-01.foundations', 'j-oop-01.lab', 'j-oop-01.http', 'j-oop-01.ai']) await setPractice(a, id, 'complete');
  await setPractice(a, 'd-hashing-01.dsa', 'complete', 'https://github.com/example/dup');
  await setPractice(a, 'j-oop-01.review', 'complete', 'account evidence');
  await answerQuiz(a, true);
  await lessonButton(a, 'd-hashing-01', 'Mark complete');
  await lessonButton(a, 'j-oop-01', 'Mark complete');
  await route(a, 'day-1/my-notes');
  await a.type('#sd-notes-ta', 'Account note'); await sleep(1200);
  check('account A: Day 1 complete through the API (local storage untouched)', /Complete/.test(await (async () => { await route(a, 'day-1'); return txt(a, '.sd-dayhead .sd-badge'); })()) && (await stored(a)) === null);
  const ctxB = await browser.createBrowserContext(), b = await open(ctxB, VP.desktop, errors);
  await go(b, 'day-1'); await signIn(b); await route(b, 'day-1'); await sleep(300);
  check('account B (independent browser): sees Day 1 Complete', /Complete/.test(await txt(b, '.sd-dayhead .sd-badge')));
  await route(b, 'day-1/my-notes');
  check('account B: sees the note written in A', (await b.$eval('#sd-notes-ta', t => t.value)) === 'Account note');
  // API restart on the same persistent DB file
  await new Promise(r => api.server.close(r)); api.db.close();
  api = await startApi(api.port);
  await b.reload({ waitUntil: 'load' }); await b.waitForFunction(() => document.body.dataset.previewReady === 'true'); await sleep(500);
  await route(b, 'day-1');
  check('API restart: B reloads, Day 1 still Complete from the database', /Complete/.test(await txt(b, '.sd-dayhead .sd-badge')));
  await route(a, 'day-1'); await lessonButton(a, 'j-oop-01', 'Reopen');
  await b.reload({ waitUntil: 'load' }); await b.waitForFunction(() => document.body.dataset.previewReady === 'true'); await sleep(500);
  await route(b, 'day-1');
  check('account: reopen in A is visible in B after reload', /In progress/.test(await txt(b, '.sd-dayhead .sd-badge')));
  check('account: no console errors', errors.filter(e => !/401|409/.test(e)).length === 0, errors.slice(0, 3).join(' | '));
  await ctxA.close(); await ctxB.close();
  await new Promise(r => api.server.close(r)); api.db.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------- 4b. Day 2 (Mon 23 Nov, weekday 2h): content, complete, reload, reopen, upgrade ----------
{
  const errors = [], ctx = await browser.createBrowserContext(), page = await open(ctx, VP.desktop, errors);
  const { main: m2, lane: l2 } = A.lessonsByDay[2];
  D = 2; M = m2; PIN = '2026-11-23';
  const s2 = await (async () => { await page.goto(`${origin}/__seed`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((k, v) => { localStorage.clear(); localStorage.setItem(k, v); }, KEY, completedBlob); })();
  await go(page, 'day-2');
  check('Day 2 plan: Monday is a 2h weekday', /2h/.test(await txt(page, '.sd-chip-budget')) && !/stretch/.test(await txt(page, '.sd-chip-budget')), await txt(page, '.sd-chip-budget'));
  const plan2 = await page.evaluate(() => document.querySelector('.sd-main').innerText);
  check('Day 2 plan: revision of Day 1 + main j-concurrency-01 + DSA lane j-concurrency-01.dsa', /revis/i.test(plan2) && await page.evaluate(() => ['j-concurrency-01', 'j-concurrency-01.dsa'].every(id => [...document.querySelectorAll('.sd-lrow code')].some(c => c.textContent === id))));
  check('Day 2 plan: 12 min revision · 78 min main · 30 min DSA', /12 min/.test(plan2) && /1h 18m/.test(plan2) && /30 min/.test(plan2), plan2.match(/\d+ min/g)?.slice(0, 8).join(','));
  await route(page, 'day-2/learn');
  const learn2 = await page.evaluate(() => ({
    videos: [...document.querySelectorAll('[id="lesson-j-concurrency-01"] .sd-video:not(.sd-reading) .sd-video-t')].map(a => a.href),
    code: [...document.querySelectorAll('[id="lesson-j-concurrency-01"] .sd-notes pre')].map(p => p.textContent).join('\n'),
    words: (document.querySelector('[id="lesson-j-concurrency-01"] .sd-notes') || { innerText: '' }).innerText.split(/\s+/).length,
    laneCode: [...document.querySelectorAll('[id="lesson-j-concurrency-01.dsa"] .sd-notes pre')].map(p => p.textContent).join('\n'),
    opts: [...document.querySelectorAll('form[data-quiz="q-j-concurrency-01"] fieldset')].map(f => f.querySelectorAll('input[type=radio]').length)
  }));
  check('Day 2 learn: 2 real YouTube videos', learn2.videos.length === 2 && learn2.videos.every(u => /youtube\.com\/watch\?v=/.test(u)), learn2.videos.join(' '));
  check('Day 2 learn: notes ≥ 500 words with runnable RaceTrace.java', learn2.words >= 500 && /class RaceTrace/.test(learn2.code), learn2.words + ' words');
  check('Day 2 DSA lane: TwoSum.java in the lane notes', /class TwoSum/.test(learn2.laneCode));
  check('Day 2 quiz: 5 questions, none with only 2 options', learn2.opts.length === 5 && learn2.opts.every(n => n >= 3), learn2.opts.join(','));
  await shoot(page, 'day2-desktop-learn', '[id="lesson-j-concurrency-01"]');
  await route(page, 'day-2/coach');
  const iq2 = await page.evaluate(() => ({ qs: document.querySelectorAll('article.sd-iq').length, answers: document.querySelectorAll('article.sd-iq details.sd-model').length, open: document.querySelectorAll('article.sd-iq details[open]').length }));
  check('Day 2 interview: ≥ 9 questions with collapsed model answers', iq2.qs >= 9 && iq2.answers === iq2.qs && iq2.open === 0, JSON.stringify(iq2));
  // complete Day 2
  for (const id of ['j-concurrency-01.learn', 'j-concurrency-01.practice']) await setPractice(page, id, 'complete');
  await setPractice(page, 'j-concurrency-01.dsa.dsa', 'complete', 'twoSum passes 3 cases');
  await setPractice(page, 'j-concurrency-01.review', 'complete', 'U1=true U2=true finalOwner=U1');
  await route(page, 'day-2/revision');
  const revBtn = await page.evaluate(() => { const b = [...document.querySelectorAll('.sd-main button')].find(x => /mark.*(revis|done)|revision done|done/i.test(x.textContent)); if (b) b.click(); return b ? b.textContent : null; });
  await sleep(300);
  let st = await stored(page);
  check('Day 2 practice + revision -> Codex blocks checked (revision, learn, practice, dsa, review)', ['revision', 'learn', 'practice', 'dsa', 'review'].every(id => st.sessions[2]?.checked?.includes(id)), JSON.stringify(st.sessions[2]?.checked) + ' rev=' + revBtn);
  await answerQuiz(page, true);
  st = await stored(page);
  check('Day 2 quiz: all correct -> 5/5 stored by Codex grading', st.assessments[2]?.score === 5);
  await lessonButton(page, 'j-concurrency-01.dsa', 'Mark complete');
  await lessonButton(page, 'j-concurrency-01', 'Mark complete');
  st = await stored(page);
  check('Day 2 complete: Codex session 2 completedOn = 23 Nov 2026', st.sessions[2]?.completedOn === '2026-11-23');
  await route(page, 'day-2/my-notes');
  await page.type('#sd-notes-ta', 'Check-then-act races; prove with a latch.');
  await page.waitForFunction(() => (document.getElementById('sd-notes-status') || {}).textContent === 'Saved', { timeout: 5000 }).catch(() => {});
  await page.reload({ waitUntil: 'load' }); await page.waitForFunction(() => document.body.dataset.previewReady === 'true'); await sleep(200);
  await route(page, 'day-2');
  const badge2 = await txt(page, '.sd-dayhead .sd-badge');
  await route(page, 'day-2/my-notes');
  check('Day 2 reload: Complete + notes kept; Day 1 still Complete', /Complete/.test(badge2) && (await page.$eval('#sd-notes-ta', t => t.value)).startsWith('Check-then-act') && (await stored(page)).sessions[1].completedOn === DAY);
  await shoot(page, 'day2-desktop-complete');
  await lessonButton(page, 'j-concurrency-01', 'Reopen');
  st = await stored(page);
  check('Day 2 reopen: reopened, evidence + notes + blocks kept, self-check stale', st.sessions[2].completedOn === '' && st.sessions[2].evidence && st.personalNotes[2] && st.sessions[2].checked.length === 5 && st.assessments[2].stale === true);
  check('Day 2 flow: no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
  // upgrade: a Day 2 completed under the old block shape (no DSA block) stays complete
  const ctx2 = await browser.createBrowserContext(), p2 = await open(ctx2, VP.desktop, errors);
  const old2 = JSON.parse(completedBlob);
  old2.sessions[2] = { startedOn: '2026-11-23', checked: ['revision', 'learn', 'practice', 'review'], evidence: 'old shape', notes: '', completedOn: '2026-11-23' };
  old2.personalNotes = { ...(old2.personalNotes || {}), 2: 'Old Day 2 notes' };
  await p2.goto(`${origin}/__seed`, { waitUntil: 'domcontentloaded' });
  await p2.evaluate((k, v) => { localStorage.clear(); localStorage.setItem(k, v); }, KEY, JSON.stringify(old2));
  await go(p2, 'day-2');
  check('Day 2 upgrade: old-shape completed Day 2 shows Complete, notes kept', /Complete/.test(await txt(p2, '.sd-dayhead .sd-badge')) && await (async () => { await route(p2, 'day-2/my-notes'); return (await p2.$eval('#sd-notes-ta', t => t.value)) === 'Old Day 2 notes'; })());
  await ctx2.close();
  D = 1; M = main; PIN = DAY;
}

// ---------- 5. 320px + desktop screenshots, no horizontal overflow ----------
{
  const errors = [], ctx = await browser.createBrowserContext(), page = await open(ctx, VP.m320, errors);
  await page.goto(`${origin}/__seed`, { waitUntil: 'domcontentloaded' });   // same origin, not the app: seed storage before the app loads
  await page.evaluate((k, v) => { localStorage.clear(); localStorage.setItem(k, v); }, KEY, completedBlob);
  for (const [hash, name, sel] of [['day-1', 'm320-day1-plan', null], ['day-2', 'm320-day2-plan', null], ['day-2/learn', 'm320-day2-learn', '[id="lesson-j-concurrency-01"]'], ['day-1/learn', 'm320-learn', '[id="lesson-j-oop-01"]'], ['day-1/learn', 'm320-quiz', 'form[data-quiz="q-j-oop-01"]'], ['day-1/practice', 'm320-practice', '.sd-panel'], ['day-1/coach', 'm320-interview', '.sd-panel'], ['day-1/my-notes', 'm320-my-notes', '.sd-takeaways']]) {
    await go(page, hash);
    if (name === 'm320-interview') await page.$eval('article.sd-iq details', d => { d.open = true; });
    const of = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check(`320px ${hash}: no horizontal overflow`, !of);
    await shoot(page, name, sel);
  }
  check('320px: no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

await browser.close(); stat.close();
const pass = results.filter(r => r.ok).length;
console.log(`\n${pass}/${results.length} Day 1 + Day 2 integration checks passed · screenshots: ${shots}`);
process.exitCode = pass === results.length ? 0 : 1;
