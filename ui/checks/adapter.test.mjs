// node --test ui/checks/adapter.test.mjs : Codex real data -> Study Desk v2 adapter (Day 1 release gate, local).
import test from 'node:test';
import assert from 'node:assert/strict';
import { S, E, codex, createCodexAdapter, createCodexHost, memoryStorage, codexBlob, SIDECAR_KEY } from './codex-load.mjs';

const A = createCodexAdapter({ S, E, codex });
const DAY = '2026-11-22';
const d1 = () => A.lessonsByDay[1];
const answers = lesson => Object.fromEntries(lesson.quiz.questions.map(q => [q.id, q.answer]));
const host = (storage = memoryStorage()) => createCodexHost({ S, E, adapter: A, codex, storage, today: () => DAY });
const ch = (c) => ({ date: DAY, at: '2026-11-22T16:00:00.000Z', ...c });

async function completeDay1(h) {
  const { main, lane, warmup } = d1();
  assert.equal((await h.change(ch({ type: 'practice', id: warmup.practice[0].id, status: 'complete', evidence: '' }))).ok, true, 'warm-up');
  for (const p of main.practice.filter(p => p.required !== false && !p.evidenceRequired)) assert.equal((await h.change(ch({ type: 'practice', id: p.id, status: 'complete', evidence: '' }))).ok, true, p.id);
  assert.equal((await h.change(ch({ type: 'practice', id: lane.practice[0].id, status: 'complete', evidence: 'https://github.com/x/dup' }))).ok, true);
  assert.equal((await h.change(ch({ type: 'practice', id: 'j-oop-01.review', status: 'complete', evidence: 'first=true second=false owner=U1' }))).ok, true);
  const q = await h.change(ch({ type: 'quiz', id: main.id, answers: answers(main) }));
  assert.equal(q.ok, true); assert.equal(q.result.passed, true); assert.equal(q.result.pct, 100);
  assert.equal((await h.change(ch({ type: 'lesson', id: lane.id, status: 'complete' }))).ok, true);
  assert.equal((await h.change(ch({ type: 'lesson', id: main.id, status: 'complete' }))).ok, true);
}

test('real course resolves: 55 sessions, Codex lesson IDs unchanged, no errors', () => {
  const res = S.resolveSessions(A.course);
  assert.equal(res.ok, true, res.errors.join('; '));
  assert.equal(res.count, codex.days.length);
  const outlineIds = codex.courseOutline.tracks.flatMap(t => t.modules.flatMap(m => m.lessons.map(l => l.id)));
  assert.deepEqual(res.sessions.map(r => r.lessons[0].id).sort(), [...outlineIds].sort());
  for (const t of codex.topicIndex) assert.ok(res.sessions.some(r => r.lessons[0].id === t.lessonId), t.lessonId);
  assert.equal(res.sessions[0].lessons[0].id, 'j-oop-01');
  assert.deepEqual(res.sessions[0].dsa.map(l => l.id), ['d-hashing-01']);
});

test('Day 1 has real content in every element', () => {
  const { main, lane } = d1();
  assert.ok(main.notes.length >= 30);
  assert.ok(main.notes.some(n => n.type === 'code' && /class ClaimTrace/.test(n.text)));
  const vids = main.videos.filter(v => v.kind === 'video');
  assert.equal(vids.length, 5); // javaObjects, dns, httpCrash, llm, hashTables
  for (const v of main.videos) assert.match(v.url, /^https:\/\//);
  assert.ok(!main.videos.some(v => /search_query|results\?/.test(v.url)), 'no search-result placeholder links');
  assert.equal(main.quiz.questions.length, 5); assert.equal(main.quiz.passPct, 80);
  assert.equal(main.interview.length, 20); // 5 session + 4 j-oop-01 + 4 invariants + 4 request + 3 ai packets
  assert.ok(main.interview.every(q => q.prompt && q.answer && q.answer.length > 40));
  assert.equal(main.takeaways.length, 16);
  assert.ok(main.quiz.questions.every(q => q.options.length >= 3), 'no two-option questions');
  assert.equal(main.topics.length, 5);
  assert.deepEqual(main.practice.filter(p => p.required !== false).map(p => p.id), ['j-oop-01.lab', 'j-oop-01.http', 'j-oop-01.ai', 'j-oop-01.review']);
  assert.ok(main.practice.every(p => p.prompt));
  assert.equal(lane.practice.length, 2);
  assert.ok(lane.notes.some(n => n.type === 'code' && /class DuplicateIds/.test(n.text)));
  const { warmup } = d1();
  assert.equal(warmup.id, 'j-foundations-01');
  assert.ok(warmup.notes.some(n => n.type === 'code' && /this\("A1"\)/.test(n.text)));
  assert.equal(S.resolveSessions(A.course).sessions[0].warmup.id, 'j-foundations-01');
});

test('complete Day 1 end to end through Codex rules; score, XP and completion derive from Codex state', async () => {
  const storage = memoryStorage(), h = host(storage);
  await completeDay1(h);
  await h.change(ch({ type: 'note', key: 'S01', text: 'Invariant: owner never changes on a failed claim.' }));
  assert.equal((await h.change(ch({ type: 'takeaway', topicId: 'j-oop-01', text: 'My rule: validate first, then mutate.', base: '' }))).ok, true);
  for (const q of d1().main.interview.slice(0, 3)) await h.change(ch({ type: 'interview', id: q.id, lessonId: 'j-oop-01' }));
  const stored = JSON.parse(storage.getItem(codex.storageKey));
  assert.equal(stored.sessions[1].completedOn, DAY);
  assert.deepEqual(stored.sessions[1].checked.sort(), ['ai', 'dsa', 'foundations', 'http', 'lab', 'review']);
  assert.equal(stored.assessments[1].score, 5);
  assert.equal(stored.personalNotes[1], 'Invariant: owner never changes on a failed claim.');
  assert.equal(stored.topicTakeaways['j-oop-01'], 'My rule: validate first, then mutate.');
  const p = h.progress();
  const cal = S.buildCalendar(A.course, p, { today: DAY });
  assert.equal(cal.statuses[0].status, 'complete');
  const eng = E.derive(A.course, p, DAY);
  assert.ok(eng.xp >= 300, 'xp ' + eng.xp);
  assert.ok(eng.streak.current >= 1);
  assert.equal(Object.keys(JSON.parse(storage.getItem(SIDECAR_KEY)).interview).length, 3);
});

test('reload and reopen keep notes, evidence, takeaways and attempts; Codex marks the score stale on reopen', async () => {
  const storage = memoryStorage(), h = host(storage);
  await completeDay1(h);
  await h.change(ch({ type: 'note', key: 'S01', text: 'keep me' }));
  const h2 = host(storage);   // reload
  assert.equal(h2.progress().lessons['j-oop-01'].status, 'complete');
  assert.equal(h2.progress().quizzes['j-oop-01'].score, 100);
  assert.equal((await h2.change(ch({ type: 'lesson', id: 'j-oop-01', status: 'in-progress' }))).ok, true);   // reopen
  const p = host(storage).progress();
  assert.equal(p.lessons['j-oop-01'].status, 'in-progress');
  assert.equal(p.notes.S01, 'keep me');
  assert.equal(p.practice['j-oop-01.review'].evidence, 'first=true second=false owner=U1');
  assert.equal(p.quizzes['j-oop-01'].score, 100);
  assert.equal(p.quizzes['j-oop-01'].passed, false, 'Codex: reopening makes the self-check stale');
  assert.equal(p.quizzes['j-oop-01'].attempts, 1);
  const again = await h2.change(ch({ type: 'quiz', id: 'j-oop-01', answers: answers(d1().main) }));
  assert.equal(again.ok, true);
  assert.equal((await h2.change(ch({ type: 'lesson', id: 'j-oop-01', status: 'complete' }))).ok, true);
  assert.equal(host(storage).progress().quizzes['j-oop-01'].attempts, 2);
});

test('refused actions leave Codex storage untouched', async () => {
  const storage = memoryStorage(), h = host(storage);
  const r = await h.change(ch({ type: 'lesson', id: 'j-oop-01', status: 'complete' }));
  assert.equal(r.ok, false);
  assert.equal(storage.getItem(codex.storageKey), null);
  const q = await h.change(ch({ type: 'quiz', id: 'j-oop-01', answers: answers(d1().main) }));
  assert.equal(q.ok, false); assert.match(q.reason, /Complete every block|Begin|unlock/i);
  assert.equal(storage.getItem(codex.storageKey), null);
  assert.ok(A.quizLock('j-oop-01', h.state()));
});

test('upgrade: a learner profile written by Codex app.js@76d7e56 loads unchanged; IDs and storage key stable', async () => {
  const old = codexBlob([
    [{ kind: 'begin', day: 1 }], [{ kind: 'block', day: 1, id: 'foundations', done: true }], [{ kind: 'block', day: 1, id: 'lab', done: true }], [{ kind: 'block', day: 1, id: 'http', done: true }],
    [{ kind: 'block', day: 1, id: 'ai', done: true }], [{ kind: 'block', day: 1, id: 'dsa', done: true }], [{ kind: 'block', day: 1, id: 'review', done: true }],
    [{ kind: 'evidence', day: 1, evidence: 'Main output pasted', notes: 'revisit constructors' }],
    [{ kind: 'assessment', day: 1, choices: codex.sessionQA[1].assessment.map(a => a.answer), bankVersion: codex.assessmentVersion }],
    [{ kind: 'finish', day: 1 }], [{ kind: 'notes', day: 1, text: 'Old notes from Codex app' }],
    [{ kind: 'topicTakeaway', topicId: 'd-hashing-01', text: 'Set membership is O(1) expected', base: '' }],
    [{ kind: 'watch', day: 1, id: 'BSVKUk58K6U', minutes: 10, watched: true }],
    [{ kind: 'lecture', day: 2, url: 'https://www.udemy.com/course/java-x/learn/lecture/123', title: 'Threads', minutes: 12 }],
    [{ kind: 'availability', date: '2026-11-24', unavailable: true }],
    [{ kind: 'begin', day: 2 }, '2026-11-23'], [{ kind: 'notes', day: 2, text: 'Day 2 draft' }]
  ]);
  // Profiles from app.js@76d7e56 predate the Day 1 'foundations' block: drop it to reproduce that stored shape.
  old.sessions[1].checked = old.sessions[1].checked.filter(id => id !== 'foundations');
  const raw = JSON.stringify(old);
  const storage = memoryStorage({ [codex.storageKey]: raw, 'studydesk.preview.v2': '{"schemaVersion":2,"lessons":{"JC-01":{"status":"complete"}}}' });
  const h = host(storage);
  const p = h.progress();
  assert.equal(p.lessons['j-oop-01'].status, 'complete');
  assert.equal(p.lessons['d-hashing-01'].status, 'complete');
  assert.equal(p.quizzes['j-oop-01'].score, 100); assert.equal(p.quizzes['j-oop-01'].passed, true);
  assert.equal(p.notes.S01, 'Old notes from Codex app'); assert.equal(p.notes.S02, 'Day 2 draft');
  assert.equal(p.takeaways['d-hashing-01'], 'Set membership is O(1) expected');
  assert.equal(p.watch['1~BSVKUk58K6U'].minutes, 10);
  assert.equal(p.schedule.unavailable['2026-11-24'], true);
  assert.equal(storage.getItem(codex.storageKey), raw, 'reading never rewrites the Codex blob');
  // A new action writes through Codex's reducer; every untouched field survives and Codex can still read it (rollback-safe).
  await h.change({ type: 'note', key: 'S02', text: 'Day 2 draft + more', date: '2026-11-23', at: '2026-11-23T16:00:00.000Z' });
  const after = JSON.parse(storage.getItem(codex.storageKey));
  const { personalNotes: a, ...restAfter } = after, { personalNotes: b, ...restOld } = old;
  assert.deepEqual(restAfter, JSON.parse(JSON.stringify(restOld)));
  assert.equal(after.personalNotes[1], 'Old notes from Codex app');
  assert.deepEqual(codex.readProgress({ getItem: () => JSON.stringify(after) }).sessions, old.sessions);
  assert.equal(storage.getItem('studydesk.preview.v2'), '{"schemaVersion":2,"lessons":{"JC-01":{"status":"complete"}}}', 'demo preview key untouched');
});

test('relaxed engine rules are opt-in: the fixture contract is unchanged', () => {
  const c = { schedule: { startDate: DAY }, subjects: [{ id: 'a', title: 'A', modules: [{ id: 'm', title: 'M', lessons: [{ id: 'L1', title: 'L1', source: { kind: 'added' } }] }] }], sessions: [{ subject: 'a', lessons: ['L1'], dsa: [] }] };
  assert.equal(S.resolveSessions(c).ok, false);
  c.schedule.dsaRequired = false;
  assert.equal(S.resolveSessions(c).ok, true);
  assert.ok(S.resolveSessions(c).warnings.some(w => /no DSA/.test(w)));
});
