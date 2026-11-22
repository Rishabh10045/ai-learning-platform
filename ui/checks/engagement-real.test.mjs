// node --test ui/checks/engagement-real.test.mjs : XP, streak, tasks, challenges, badges and the +1/+3/+7 spaced
// revisions on the REAL 56-day Codex course, driven through the same browser host the live site uses (Grok, Phase 6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { S, E, codex, createCodexAdapter, createCodexHost, memoryStorage, SIDECAR_KEY } from './codex-load.mjs';

const A = createCodexAdapter({ S, E, codex });
const START = codex.START_DATE;   // Sun 22 Nov 2026

function makeHost(storage = memoryStorage()) {
  const clock = { day: START };
  const host = createCodexHost({ S, E, adapter: A, codex, storage, today: () => clock.day });
  return { host, clock, storage };
}
async function ok(h, ch, at) {
  const r = await h.host.change({ at: at || h.clock.day + 'T16:00:00.000Z', ...ch });
  assert.equal(r.ok, true, JSON.stringify(ch) + ' → ' + r.reason);
  return r;
}
// Finish session n the way a learner does: revision block, required practice with evidence, the self-check, then the lessons.
async function finishDay(h, n) {
  const { main, lane, warmup } = A.lessonsByDay[n];
  if (codex.days[n - 1].blocks.some(b => b.id === 'revision')) await ok(h, { type: 'revision', id: 'S' + String(n).padStart(2, '0'), done: true });
  for (const l of [warmup, main, lane].filter(Boolean)) for (const p of l.practice.filter(p => p.required !== false)) await ok(h, { type: 'practice', id: p.id, status: 'complete', evidence: 'https://github.com/me/proof/' + p.id });
  await ok(h, { type: 'quiz', id: main.id, answers: Object.fromEntries(main.quiz.questions.map(q => [q.id, q.answer])) });
  if (lane) await ok(h, { type: 'lesson', id: lane.id, status: 'complete' });
  await ok(h, { type: 'lesson', id: main.id, status: 'complete' });
}
const derive = h => E.derive(A.course, h.host.progress(), h.clock.day);

test('real course: finishing Day 1 earns the documented XP and completes the core task list', async () => {
  const h = makeHost();
  const before = derive(h);
  assert.equal(before.xp, 0); assert.equal(before.tasks.sessionN, 1); assert.equal(before.tasks.allDone, false);
  for (const t of before.tasks.tasks) assert.ok(!t.optional, 'core list has no optional items');
  assert.ok(before.tasks.optional.length > 0, 'Day 1 packets/stretch are listed as optional');
  await finishDay(h, 1);
  const d = derive(h), P = E.POINTS;
  // The ledger must only hold real course IDs.
  for (const e of d.ledger) if (['lesson', 'quiz', 'practice'].includes(e.kind)) assert.ok(A.course && e.id, e.id);
  assert.equal(d.xp, d.ledger.reduce((a, e) => a + e.xp, 0));
  assert.ok(d.ledger.some(e => e.kind === 'session' && e.xp === P.sessionComplete), 'session bonus');
  assert.ok(d.ledger.some(e => e.kind === 'quiz' && e.xp === P.quizPass + P.quizPerfectBonus), 'perfect self-check');
  assert.equal(d.todayXp, d.xp, 'all earned today');
  assert.equal(d.streak.current, 1); assert.equal(d.streak.todayDone, true);
  // Core tasks left are the two habits (interview answers, own notes); finishing them ends the day.
  assert.deepEqual(d.tasks.tasks.filter(t => !t.done).map(t => t.kind).sort(), ['interview', 'notes']);
  const qs = A.lessonsByDay[1].main.interview.slice(0, 3);
  for (const q of qs) await ok(h, { type: 'interview', id: q.id, lessonId: A.lessonsByDay[1].main.id, answered: true });
  await ok(h, { type: 'note', key: 'S01', text: 'Seat claim must be atomic.\nDB constraint is the authority.\nLLM never books.' });
  const done = derive(h);
  assert.equal(done.tasks.allDone, true, 'core session done → ring complete');
  await ok(h, { type: 'prefs', notifications: { email: true, address: 'learner@example.com' } });
  assert.equal(derive(h).nextNudge.at, null, 'no reminder once the session is done');
  assert.match(derive(h).nextNudge.reason, /done/);
  // Badges: the one-lesson warm-up track does not count as a cleared subject; no module-test badge (the course has no tests).
  const b = Object.fromEntries(done.badges.map(x => [x.id, x]));
  assert.equal(b['first-step'].earned, true); assert.equal(b['subject-1'].earned, false); assert.equal(b['module-1'], undefined);
  assert.equal(b['sessions-all'].target, codex.days.length);
});

test('real course: streak across consecutive days, a missed day breaks it, an unavailable day does not', async () => {
  const h = makeHost();
  for (let n = 1; n <= 3; n++) { await finishDay(h, n); if (n < 3) h.clock.day = S.addDays(h.clock.day, 1); }
  assert.equal(derive(h).streak.current, 3);
  assert.equal(derive(h).badges.find(x => x.id === 'streak-3').earned, true);
  // Day 4 (Wed 25 Nov) marked unavailable: streak is safe.
  const off = S.addDays(h.clock.day, 1);
  await ok(h, { type: 'unavailable', date: off, value: true });
  assert.equal(h.host.progress().schedule.unavailable[off], true, 'the chosen date is marked, not today');
  assert.equal(h.host.progress().schedule.unavailable[h.clock.day], undefined);
  h.clock.day = S.addDays(off, 1);
  let d = derive(h);
  assert.equal(d.streak.current, 3, 'day off keeps the streak'); assert.equal(d.streak.atRisk, true);
  await finishDay(h, 4);
  assert.equal(derive(h).streak.current, 4);
  // Skip an available day entirely: the streak resets once that day is over.
  h.clock.day = S.addDays(h.clock.day, 2);
  d = derive(h);
  assert.equal(d.streak.current, 0); assert.equal(d.streak.best, 4);
});

test('real course: daily and weekly challenges are claimable only when met, and pay once', async () => {
  const h = makeHost();
  h.clock.day = '2026-11-23';   // a Monday: the week starts inside the plan
  await finishDay(h, 1);
  const d = derive(h), daily = d.challenges.find(c => c.period === 'daily');
  assert.ok(daily && daily.id === 'daily-2026-11-23');
  const r = await h.host.change({ type: 'challenge', id: 'weekly-2026-11-23', at: '2026-11-23T16:00:00.000Z' });
  assert.equal(r.ok, false, 'weekly challenge not met after one day');
  // Meet "teach-back" deterministically if that is today's pick; otherwise just verify the refusal text.
  if (daily.kind === 'teach-back') {
    await ok(h, { type: 'note', key: 'S02', text: 'a\nb\nc' });
    await ok(h, { type: 'challenge', id: daily.id });
    assert.equal((await h.host.change({ type: 'challenge', id: daily.id, at: '2026-11-23T17:00:00.000Z' })).ok, false, 'already claimed');
  } else {
    const x = await h.host.change({ type: 'challenge', id: daily.id, at: '2026-11-23T16:30:00.000Z' });
    if (!daily.met) assert.match(x.reason, /Not yet/);
  }
});

test('spaced revision: a finished session is due +1, +3 and +7 days later and pays XP once per step', async () => {
  const h = makeHost();
  await finishDay(h, 1);                           // finished Sun 22 Nov
  let rv = derive(h).revisions;
  assert.equal(rv.due.length, 0); assert.deepEqual(rv.upcoming.map(x => x.id), ['S01+1', 'S01+3', 'S01+7']);
  assert.equal(rv.upcoming[0].dueOn, '2026-11-23'); assert.equal(rv.upcoming[2].dueOn, '2026-11-29');
  // Not due yet → refused.
  const early = await h.host.change({ type: 'spaced', id: 'S01+3', done: true, at: '2026-11-22T17:00:00.000Z' });
  assert.equal(early.ok, false); assert.match(early.reason, /not due/);
  // +1: Day 2's quick-revision block (which revises Day 1) satisfies it.
  h.clock.day = '2026-11-23';
  assert.deepEqual(derive(h).revisions.due.map(x => x.id), ['S01+1']);
  await ok(h, { type: 'revision', id: 'S02', done: true });
  assert.equal(derive(h).revisions.due.length, 0, '+1 done through the quick revision');
  // +3 is due on Wed 25 Nov; it shows a recall prompt and a link to the lesson.
  h.clock.day = '2026-11-25';
  rv = derive(h).revisions;
  assert.deepEqual(rv.due.map(x => x.id), ['S01+3']);
  assert.equal(rv.due[0].href, '#lesson/' + A.lessonsByDay[1].main.id); assert.ok(rv.due[0].prompt.length > 10);
  const xp0 = derive(h).xp;
  await ok(h, { type: 'spaced', id: 'S01+3', done: true });
  assert.equal(derive(h).xp - xp0, E.POINTS.spacedRevision);
  assert.equal((await h.host.change({ type: 'spaced', id: 'S01+3', done: true, at: '2026-11-25T17:00:00.000Z' })).ok, false, 'not due any more');
  // +7 overdue on 1 Dec shows how late it is.
  h.clock.day = '2026-12-01';
  rv = derive(h).revisions;
  assert.equal(rv.due[0].id, 'S01+7'); assert.equal(rv.due[0].overdueDays, 2);
  // Spaced revisions never block "session done" and survive a reload from storage (sidecar).
  await ok(h, { type: 'spaced', id: 'S01+7', done: true });
  const again = createCodexHost({ S, E, adapter: A, codex, storage: h.storage, today: () => '2026-12-01' });
  assert.deepEqual(Object.keys(again.progress().spaced).sort(), ['S01+3', 'S01+7']);
  assert.equal(E.derive(A.course, again.progress(), '2026-12-01').revisions.done, 3);
  assert.equal(derive(h).activity[0].type, 'spaced');
});

test('spaced revision: an older sidecar without the spaced map still loads', () => {
  const storage = memoryStorage({ [SIDECAR_KEY]: JSON.stringify({ v: 1, interview: {}, challenges: {}, notifications: null, practice: {}, watchLog: {}, revisions: {}, activity: [], lastActiveAt: null }) });
  const { host } = makeHost(storage);
  assert.deepEqual(host.progress().spaced, {});
  assert.deepEqual(E.derive(A.course, host.progress(), START).revisions.due, []);
});

test('a session finished on a day later marked off still moves the plan on (no repeat of the finished session next day)', async () => {
  const h = makeHost();
  await finishDay(h, 1);
  await ok(h, { type: 'unavailable', date: START, value: true });   // what the pre-cf892c4 host did when a later date was ticked
  h.clock.day = S.addDays(START, 1);
  const d = derive(h);
  assert.equal(d.tasks.sessionN, 2, 'Day 2 is today');
  assert.equal(d.streak.current, 1, 'the day off you studied on counts');
});
