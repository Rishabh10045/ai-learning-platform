// node --test checks/reminders.test.mjs : the reminder job's send/skip rules and templates (no network, no secrets).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { S, E, codex, createCodexAdapter, createCodexHost, memoryStorage } from '../ui/checks/codex-load.mjs';
import { decide, loadProgress, slotIndex, SLOTS_IST } from '../scripts/reminders/reminder.mjs';
import { templates, pick } from '../scripts/reminders/templates.mjs';
import { readFileSync } from 'node:fs';

const A = createCodexAdapter({ S, E, codex });
async function snapshot(fn) {
  const storage = memoryStorage(), clock = { day: codex.START_DATE };
  const host = createCodexHost({ S, E, adapter: A, codex, storage, today: () => clock.day });
  await fn(host, clock);
  return storage.dump();
}
const at = (iso) => Date.parse(iso);
const emailOn = h => h.change({ type: 'prefs', notifications: { email: true, address: 'deepak@example.com' }, at: '2026-11-22T10:00:00.000Z' });

test('slots: six slots 3 hours apart, none in quiet hours, matching the workflow cron', () => {
  assert.equal(SLOTS_IST.length, 6);
  const mins = SLOTS_IST.map(s => +s.slice(0, 2) * 60 + +s.slice(3));
  for (let i = 1; i < mins.length; i++) assert.equal(mins[i] - mins[i - 1], 180);
  assert.ok(mins.every(m => m >= 360));
  const wf = readFileSync(new URL('../.github/workflows/study-reminders.yml', import.meta.url), 'utf8');
  assert.match(wf, /cron: "7 1,4,7,10,13,16 \* \* \*"/);   // 06:37 … 21:37 IST
  assert.equal(slotIndex(at('2026-11-23T01:07:00Z')), 0); assert.equal(slotIndex(at('2026-11-23T16:07:00Z')), 5);
});

test('templates: five Hinglish templates, each names the pending topic and links to Today', () => {
  assert.equal(templates.length, 5);
  for (const t of templates) { assert.match(t.subject + t.body, /\{topic\}/); assert.match(t.body, /\{link\}/); }
  assert.notEqual(pick('2026-11-23', 0).id, pick('2026-11-23', 1).id, 'two slots on one day use different templates');
});

test('sends when email is on and tonight’s session is pending, naming the topic', async () => {
  const snap = await snapshot(async h => { await emailOn(h); });
  const d = decide(await loadProgress(snap), at('2026-11-22T13:07:00Z'));   // 18:37 IST, slot 4
  assert.equal(d.send, true, d.reason); assert.equal(d.slot, 4); assert.equal(d.to, 'deepak@example.com');
  const topic = A.lessonsByDay[1].main.topics[0].title;
  assert.ok((d.subject + d.text).includes(topic), 'names the pending topic');
  assert.match(d.text, /rishabh10045\.github\.io\/ai-learning-platform\/#today/);
});

test('skips: reminders off, quiet hours, recent study, session done, day off', async () => {
  const off = await snapshot(async () => {});
  assert.equal(decide(await loadProgress(off), at('2026-11-22T13:07:00Z')).send, false);
  const on = await loadProgress(await snapshot(async h => { await emailOn(h); }));
  assert.match(decide(on, at('2026-11-22T19:00:00Z')).reason, /Quiet hours/);          // 00:30 IST
  assert.match(decide(on, at('2026-11-22T00:20:00Z')).reason, /Quiet hours/);          // 05:50 IST
  const recent = await loadProgress(await snapshot(async h => { await emailOn(h); await h.change({ type: 'note', key: 'S01', text: 'x', at: '2026-11-22T12:30:00.000Z' }); }));
  assert.match(decide(recent, at('2026-11-22T13:07:00Z')).reason, /last 2 hours/);
  // Session done: finish Day 1 core tasks.
  const done = await loadProgress(await snapshot(async h => {
    await emailOn(h);
    const { main, lane, warmup } = A.lessonsByDay[1], ok = async c => assert.equal((await h.change({ at: '2026-11-22T05:00:00.000Z', ...c })).ok, true, JSON.stringify(c));
    for (const l of [warmup, main, lane]) for (const p of l.practice.filter(p => p.required !== false)) await ok({ type: 'practice', id: p.id, status: 'complete', evidence: 'https://x/y' });
    await ok({ type: 'quiz', id: main.id, answers: Object.fromEntries(main.quiz.questions.map(q => [q.id, q.answer])) });
    await ok({ type: 'lesson', id: lane.id, status: 'complete' }); await ok({ type: 'lesson', id: main.id, status: 'complete' });
    for (const q of main.interview.slice(0, 3)) await ok({ type: 'interview', id: q.id, lessonId: main.id, answered: true });
    await ok({ type: 'note', key: 'S01', text: 'done' });
  }));
  assert.match(decide(done, at('2026-11-22T13:07:00Z')).reason, /session is done/);
  const dayOff = await loadProgress(await snapshot(async h => { await emailOn(h); await h.change({ type: 'unavailable', date: '2026-11-22', value: true, at: '2026-11-22T04:00:00.000Z' }); }));
  assert.match(decide(dayOff, at('2026-11-22T13:07:00Z')).reason, /day off/);
});

test('daily cap follows the saved maxPerDay preference', async () => {
  const snap = await snapshot(async h => { await h.change({ type: 'prefs', notifications: { email: true, address: 'd@example.com', maxPerDay: 3 }, at: '2026-11-22T00:00:00.000Z' }); });
  const p = await loadProgress(snap);
  assert.equal(decide(p, at('2026-11-22T07:07:00Z')).send, true);              // slot 2 (third email)
  assert.match(decide(p, at('2026-11-22T10:07:00Z')).reason, /Daily limit of 3/); // slot 3
});
