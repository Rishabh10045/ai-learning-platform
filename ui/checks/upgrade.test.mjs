// node --test ui/checks/upgrade.test.mjs : a learner profile written by the released build (main 0203934)
// must load in the current build unchanged: same storage key, same lesson IDs, progress preserved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { S, E, codex, createCodexAdapter, createCodexHost, memoryStorage, SIDECAR_KEY } from './codex-load.mjs';

const fixture = JSON.parse(readFileSync(new URL('../fixtures/profile-0203934.json', import.meta.url), 'utf8'));
const A = createCodexAdapter({ S, E, codex });
const DAY = '2026-11-22';

test('storage keys are unchanged since 0203934', () => {
  assert.deepEqual(Object.keys(fixture.storage).sort(), [codex.storageKey, SIDECAR_KEY].sort());
  assert.equal(codex.storageKey, 'ai-learning-platform.study-desk.v1');
});

test('every lesson ID scheduled at 0203934 is still scheduled on the same day (new DSA lanes may be added)', () => {
  const now = S.resolveSessions(A.course).sessions.map(s => ({ main: s.lessons.map(l => l.id), dsa: s.dsa.map(l => l.id), warmup: s.warmup?.id || null }));
  assert.ok(now.length >= fixture.lessonIds.length);
  fixture.lessonIds.forEach((old, i) => {
    assert.deepEqual(now[i].main, old.main, 'Day ' + (i + 1) + ' main lesson');
    assert.equal(now[i].warmup, old.warmup, 'Day ' + (i + 1) + ' warm-up');
    for (const id of old.dsa) assert.ok(now[i].dsa.includes(id), 'Day ' + (i + 1) + ' keeps DSA lesson ' + id);
  });
});

test('0203934 profile loads with Day 1 complete, score, notes, takeaway and interview marks; blob not rewritten', async () => {
  const storage = memoryStorage(fixture.storage);
  const h = createCodexHost({ S, E, adapter: A, codex, storage, today: () => DAY });
  const p = h.progress();
  assert.equal(p.lessons['j-oop-01'].status, 'complete');
  assert.equal(p.quizzes['j-oop-01'].score, 100);
  assert.equal(p.quizzes['j-oop-01'].passed, true);
  assert.match(p.notes.S01, /UPGRADE-NOTE/);
  assert.match(p.takeaways['j-oop-01'], /UPGRADE-TAKEAWAY/);
  assert.equal(S.buildCalendar(A.course, p, { today: DAY }).statuses[0].status, 'complete');
  assert.equal(Object.keys(JSON.parse(storage.getItem(SIDECAR_KEY)).interview).length, 3);
  assert.equal(storage.getItem(codex.storageKey), fixture.storage[codex.storageKey], 'reading never rewrites the blob');
  // The next action keeps every earlier field.
  const r = await h.change({ type: 'note', key: 'S02', text: 'Day 2 start', date: '2026-11-23', at: '2026-11-23T16:00:00.000Z' });
  assert.equal(r.ok, true);
  const after = JSON.parse(storage.getItem(codex.storageKey)), before = JSON.parse(fixture.storage[codex.storageKey]);
  assert.deepEqual(after.sessions[1], before.sessions[1]);
  assert.deepEqual(after.assessments[1], before.assessments[1]);
  assert.equal(after.personalNotes[1], before.personalNotes[1]);
});
