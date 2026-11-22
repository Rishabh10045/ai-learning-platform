// node --test ui/checks/upgrade-matrix.test.mjs : a profile written by EVERY release on main since 0203934 loads in
// the current build with nothing lost (Phase 7 QA, Grok 2026-11-23). Each fixture in ui/fixtures/profiles/ was written
// by that release's own host code (git worktree at the SHA), see the fixture's `note` and `log`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { S, E, codex, createCodexAdapter, createCodexHost, memoryStorage, SIDECAR_KEY } from './codex-load.mjs';

const A = createCodexAdapter({ S, E, codex });
const dir = new URL('../fixtures/profiles/', import.meta.url);
const files = readdirSync(dir).filter(f => /^profile-[0-9a-f]{7}\.json$/.test(f)).sort();

test('fixtures cover every main release since 0203934', () => {
  for (const sha of ['0203934', '9f992de', '60db84e', '5baeba7', '35bf0b2', 'd62d8d6', 'd4aca30', 'b6d53ac', 'cf892c4'])
    assert.ok(files.includes('profile-' + sha + '.json'), sha);
});

for (const f of files) {
  test('upgrade from ' + f.slice(8, 15), async () => {
    const fx = JSON.parse(readFileSync(new URL(f, dir), 'utf8')), sha = fx.sha;
    assert.ok(fx.log.every(l => l.startsWith('ok')), 'the old build accepted every action');
    const storage = memoryStorage(fx.storage), blob = fx.storage[codex.storageKey];
    const h = createCodexHost({ S, E, adapter: A, codex, storage, today: () => '2026-11-23' });
    const p = h.progress();
    // Lesson IDs scheduled then are still scheduled on the same day.
    const now = S.resolveSessions(A.course).sessions;
    fx.lessonIds.forEach((old, i) => {
      assert.deepEqual(now[i].lessons.map(l => l.id), old.main, sha + ' Day ' + (i + 1));
      for (const id of old.dsa) assert.ok(now[i].dsa.some(l => l.id === id), sha + ' keeps ' + id);
    });
    // Day 1 complete with its 100% self-check; Day 2 started.
    assert.equal(p.lessons['j-oop-01'].status, 'complete', sha);
    assert.equal(p.quizzes['j-oop-01'].passed, true, sha + ' self-check still passed');
    assert.equal(S.buildCalendar(A.course, p, { today: '2026-11-23' }).statuses[0].status, 'complete');
    assert.equal(E.tasksFor(A.course, p, '2026-11-23').sessionN, 2, sha + ' today is Day 2');
    assert.ok(p.revisions.S02, sha + ' Day 2 revision kept');
    // Notes, takeaway, interview marks, reminder prefs and days off survive.
    assert.match(p.notes.S01, new RegExp('UPGRADE-NOTE ' + sha)); assert.match(p.notes.S02, /Day 2 in progress/);
    assert.match(p.takeaways['j-oop-01'], /UPGRADE-TAKEAWAY/);
    assert.equal(Object.keys(p.interview).length, 2, sha + ' interview marks');
    assert.equal(p.prefs.notifications.email, true); assert.equal(+p.prefs.notifications.intervalHours, 3);
    assert.deepEqual(Object.keys(p.schedule.unavailable), JSON.parse(blob).unavailable, sha + ' days off as stored');
    // Engagement derives without errors from the old data.
    const d = E.derive(A.course, p, '2026-11-23');
    assert.ok(d.xp > 0); assert.equal(d.revisions.due.length >= 0, true); assert.deepEqual(p.spaced, {});
    // Reading never rewrites; the next action keeps every earlier field.
    assert.equal(storage.getItem(codex.storageKey), blob, sha + ' blob untouched on read');
    const r = await h.change({ type: 'note', key: 'S02', text: 'after upgrade', at: '2026-11-23T16:00:00.000Z' });
    assert.equal(r.ok, true, r.reason);
    const q = h.progress();
    assert.equal(q.lessons['j-oop-01'].status, 'complete'); assert.match(q.notes.S01, /UPGRADE-NOTE/); assert.equal(Object.keys(q.interview).length, 2);
    assert.equal(JSON.parse(storage.getItem(SIDECAR_KEY)).v, 1);
  });
}
