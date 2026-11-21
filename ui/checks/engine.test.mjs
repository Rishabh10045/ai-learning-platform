// Unit tests for ui/engine/schedule-engine.js against the example course fixture.
// Run: node --test ui/checks/engine.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require("../fixtures/course.fixture.js");
const S = require("../engine/schedule-engine.js");
const course = window.STUDY_DESK_FIXTURES.course;
const idx = S.indexCourse(course);
const L = id => idx.lessonById[id].lesson;

// Complete a lesson the honest way: quiz, practice evidence, then the lesson.
function finishLesson(p, id, date) {
  const l = L(id);
  if (l.quiz) { const answers = {}; l.quiz.questions.forEach(q => answers[q.id] = q.answer); p = S.applyChange(course, p, { type: "quiz", id, answers, date }).progress; }
  for (const pr of l.practice || []) p = S.applyChange(course, p, { type: "practice", id: pr.id, status: "complete", evidence: "https://example.com/" + pr.id, date }).progress;
  const r = S.applyChange(course, p, { type: "lesson", id, status: "complete", date });
  assert.ok(r.ok, r.reason);
  return r.progress;
}
function finishSession(p, n, date) {
  const r = S.resolveSessions(course).sessions[n - 1];
  for (const l of (r.warmup ? [r.warmup] : []).concat(r.lessons, r.dsa)) if (S.lessonState(l, p) !== "complete") p = finishLesson(p, l.id, date);
  if (r.test) { const answers = {}; idx.moduleById[r.test].module.test.questions.forEach(q => answers[q.id] = q.answer); const t = S.applyChange(course, p, { type: "test", id: r.test, answers, date }); assert.ok(t.ok, t.reason); p = t.progress; }
  return p;
}

test("every session resolves to real lessons; order is subject-first; DSA daily", () => {
  const r = S.resolveSessions(course);
  assert.deepEqual(r.errors, []);
  assert.equal(r.count, course.sessions.length);
  assert.deepEqual(r.unscheduled, []);
  const order = [...new Set(r.sessions.map(s => s.subjectId))];
  assert.deepEqual(order, ["java-core", "streams-apis", "concurrency", "spring-boot", "lld", "hld", "genai"]);
  r.sessions.forEach(s => assert.ok(s.dsa.length >= 1, "session " + s.n + " has DSA"));
  const sb = idx.subjectById["spring-boot"].modules.map(m => m.id);
  assert.deepEqual(sb, ["sb-rest", "sb-persistence", "sb-testing", "sb-security", "sb-ai"]);
});

test("every lesson carries a source (gfg mapping or added)", () => {
  Object.values(idx.lessonById).forEach(e => assert.ok(["gfg", "added"].includes(e.lesson.source.kind), e.lesson.id));
  assert.ok(Object.values(idx.lessonById).some(e => e.lesson.source.kind === "added"));
});

test("resolveSessions reports unknown lessons, wrong subject and missing DSA", () => {
  const bad = JSON.parse(JSON.stringify(course));
  bad.sessions[1].lessons = ["NOPE-1"]; bad.sessions[2].lessons = ["HLD-01"]; bad.sessions[3].dsa = [];
  const r = S.resolveSessions(bad);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(e => /NOPE-1 does not exist/.test(e)));
  assert.ok(r.errors.some(e => /HLD-01 belongs to hld/.test(e)));
  assert.ok(r.errors.some(e => /Session 4: no DSA/.test(e)));
});

test("Day 1 = Sunday 22 Nov 2026: 6h30m = 2h core + 4h30m stretch, revision slot is Java foundations", () => {
  const cal = S.buildCalendar(course, {}, { today: "2026-11-21" });
  const d1 = cal.entries[0];
  assert.equal(d1.date, "2026-11-22"); assert.equal(d1.n, 1); assert.equal(d1.budget.dayName, "Sunday");
  assert.equal(d1.budget.minutes, 390); assert.equal(d1.budget.core, 120); assert.equal(d1.budget.stretch, 270);
  assert.deepEqual(d1.blocks.map(b => [b.kind, b.minutes, b.start]), [["foundations", 12, "21:00"], ["lesson", 78, "21:12"], ["dsa", 30, "22:30"], ["stretch", 270, null]]);
  assert.deepEqual(d1.blocks[0].lessonIds, ["JC-01"]);
});

test("weekday (Mon 23 Nov) is 2h: 12 revision + 78 lesson + 30 DSA, revising session 1", () => {
  const cal = S.buildCalendar(course, {}, { today: "2026-11-21" });
  const d2 = cal.entries[1];
  assert.equal(d2.date, "2026-11-23"); assert.equal(d2.budget.kind, "weekday"); assert.equal(d2.budget.minutes, 120);
  assert.deepEqual(d2.blocks.map(b => [b.kind, b.minutes, b.start, b.end]), [["revision", 12, "21:00", "21:12"], ["lesson", 78, "21:12", "22:30"], ["dsa", 30, "22:30", "23:00"]]);
  assert.equal(d2.blocks[0].revisionOf, 1);
  assert.deepEqual(d2.blocks[0].lessonIds, ["JC-02", "JC-03"]);
  const nextSunday = cal.entries.find(e => e.date === "2026-11-29");
  assert.equal(nextSunday.budget.minutes, 390); assert.equal(nextSunday.budget.kind, "weekend");
  for (const d of ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27"]) {
    const e = S.entryFor(cal, d); assert.equal(e.budget.minutes, 120, d); assert.equal(e.budget.kind, "weekday", d); assert.equal(e.budget.stretch, 0, d);
  }
});

test("Saturday 28 Nov is a weekend long day: 6h30m = 12 revision + 78 lesson + 30 DSA + 4h30m stretch", () => {
  const cal = S.buildCalendar(course, {}, { today: "2026-11-21" });
  const sat = S.entryFor(cal, "2026-11-28");
  assert.equal(sat.budget.dayName, "Saturday"); assert.equal(sat.budget.kind, "weekend");
  assert.equal(sat.n, 7);
  assert.equal(sat.budget.minutes, 390); assert.equal(sat.budget.core, 120); assert.equal(sat.budget.stretch, 270);
  assert.deepEqual(sat.blocks.map(b => [b.kind, b.minutes, b.start]), [["revision", 12, "21:00"], ["lesson", 78, "21:12"], ["dsa", 30, "22:30"], ["stretch", 270, null]]);
  assert.equal(sat.blocks[0].revisionOf, 6);
  // Saturday is adjustable like any day.
  const p = S.applyChange(course, {}, { type: "minutes", weekday: 6, minutes: 240 }).progress;
  assert.equal(S.entryFor(S.buildCalendar(course, p, { today: "2026-11-21" }), "2026-11-28").budget.stretch, 120);
});

test("weekdays are adjustable: weekday default and per-date override; short days scale the core", () => {
  let p = S.applyChange(course, {}, { type: "minutes", weekday: 3, minutes: 180 }).progress; // Wednesdays 3h
  p = S.applyChange(course, p, { type: "minutes", date: "2026-11-24", minutes: 60 }).progress; // Tue 24 Nov: 1h
  const cal = S.buildCalendar(course, p, { today: "2026-11-21" });
  const tue = S.entryFor(cal, "2026-11-24"), wed = S.entryFor(cal, "2026-11-25");
  assert.equal(wed.budget.minutes, 180); assert.equal(wed.budget.stretch, 60);
  assert.equal(tue.budget.minutes, 60); assert.equal(tue.budget.short, true);
  assert.equal(tue.blocks.reduce((a, b) => a + b.minutes, 0), 60);
});

test("unavailable date carries the same unfinished session to the next date", () => {
  const p = S.applyChange(course, {}, { type: "unavailable", date: "2026-11-24", value: true }).progress;
  const cal = S.buildCalendar(course, p, { today: "2026-11-21" });
  const mon = S.entryFor(cal, "2026-11-23"), tue = S.entryFor(cal, "2026-11-24"), wed = S.entryFor(cal, "2026-11-25");
  assert.equal(mon.n, 2); assert.equal(tue.unavailable, true); assert.equal(tue.carries, 3); assert.equal(wed.n, 3);
  const base = S.buildCalendar(course, {}, { today: "2026-11-21" });
  assert.equal(base.finishDate, "2026-12-11", "one session per available date: long weekend days add stretch, not extra sessions");
  assert.equal(S.diffDays(base.finishDate, cal.finishDate), 1, "finish date moves by one day");
  const undo = S.applyChange(course, p, { type: "unavailable", date: "2026-11-24", value: false }).progress;
  assert.equal(S.buildCalendar(course, undo, { today: "2026-11-21" }).finishDate, base.finishDate);
});

test("a missed past date keeps the session pending and repeats it next date", () => {
  const cal = S.buildCalendar(course, {}, { today: "2026-11-23" });
  assert.equal(S.entryFor(cal, "2026-11-22").n, 1);
  const mon = S.entryFor(cal, "2026-11-23");
  assert.equal(mon.n, 1); assert.equal(mon.carried, true);
  assert.equal(S.entryFor(cal, "2026-11-24").n, 2);
});

test("next-day progression: finishing session 1 on Day 1 puts session 2 on Day 2", () => {
  let p = finishSession({}, 1, "2026-11-22");
  const cal = S.buildCalendar(course, p, { today: "2026-11-23" });
  assert.equal(S.entryFor(cal, "2026-11-22").status, "complete");
  assert.equal(S.entryFor(cal, "2026-11-23").n, 2);
  assert.equal(S.entryFor(cal, "2026-11-23").carried, false);
  const t = S.todayPlan(course, p, { today: "2026-11-23" });
  assert.equal(t.entry.n, 2); assert.equal(t.currentN, 2);
  const c = S.continueTarget(course, p);
  assert.equal(c.n, 2); assert.equal(c.lesson.id, "JC-04");
});

test("before Day 1, Today previews Day 1", () => {
  const t = S.todayPlan(course, {}, { today: "2026-11-21" });
  assert.equal(t.beforeStart, true); assert.equal(t.entry.date, "2026-11-22"); assert.equal(t.entry.n, 1);
});

test("quiz gate and assignment evidence block lesson completion", () => {
  let r = S.applyChange(course, {}, { type: "lesson", id: "JC-02", status: "complete", date: "2026-11-22" });
  assert.equal(r.ok, false); assert.match(r.reason, /quiz/);
  let p = S.applyChange(course, {}, { type: "quiz", id: "JC-02", answers: { q1: 0 } }).progress; // wrong
  assert.equal(S.quizGate(L("JC-02"), p).passed, false);
  p = S.applyChange(course, p, { type: "quiz", id: "JC-02", answers: { q1: 1 } }).progress;
  assert.equal(S.quizGate(L("JC-02"), p).passed, true);
  r = S.applyChange(course, p, { type: "practice", id: "JC-02-p1", status: "complete" });
  assert.equal(r.ok, false); assert.match(r.reason, /evidence/);
  p = S.applyChange(course, p, { type: "practice", id: "JC-02-p1", status: "complete", evidence: "https://github.com/me/jc02" }).progress;
  r = S.applyChange(course, p, { type: "lesson", id: "JC-02", status: "complete", date: "2026-11-22" });
  assert.ok(r.ok, r.reason);
});

test("module test: locked -> unlocked -> failed -> passed; refused while locked", () => {
  const m = idx.moduleById["jc-basics"].module;
  let p = {};
  assert.equal(S.testState(m, p), "locked");
  assert.equal(S.applyChange(course, p, { type: "test", id: "jc-basics", answers: {} }).ok, false);
  for (const id of ["JC-01", "JC-02", "JC-03"]) p = finishLesson(p, id, "2026-11-22");
  assert.equal(S.testState(m, p), "locked");
  p = finishLesson(p, "JC-04", "2026-11-23");
  assert.equal(S.testState(m, p), "unlocked");
  p = S.applyChange(course, p, { type: "test", id: "jc-basics", answers: {} }).progress;
  assert.equal(S.testState(m, p), "failed");
  const answers = {}; m.test.questions.forEach(q => answers[q.id] = q.answer);
  p = S.applyChange(course, p, { type: "test", id: "jc-basics", answers }).progress;
  assert.equal(S.testState(m, p), "passed");
  assert.equal(S.moduleProgress(m, p).status, "complete");
});

test("session with a module test is complete only after the test is passed", () => {
  let p = finishSession({}, 1, "2026-11-22");
  const r2 = S.resolveSessions(course).sessions[1];
  for (const l of r2.lessons.concat(r2.dsa)) p = finishLesson(p, l.id, "2026-11-23");
  assert.equal(S.sessionStatus(r2, idx, p).status, "in-progress");
  p = finishSession(p, 2, "2026-11-23");
  assert.equal(S.sessionStatus(r2, idx, p).status, "complete");
});

test("Complete -> reopen -> uncheck round-trips through JSON (reload)", () => {
  let p = finishLesson({}, "JC-02", "2026-11-22");
  p = JSON.parse(JSON.stringify(p));
  assert.equal(S.lessonState(L("JC-02"), p), "complete");
  p = S.applyChange(course, p, { type: "lesson", id: "JC-02", status: "in-progress", date: "2026-11-22" }).progress;
  p = JSON.parse(JSON.stringify(p));
  assert.equal(S.lessonState(L("JC-02"), p), "in-progress");
  p = S.applyChange(course, p, { type: "practice", id: "JC-02-p1", status: "pending", evidence: "" }).progress;
  p = S.applyChange(course, p, { type: "lesson", id: "JC-02", status: "pending" }).progress;
  p = JSON.parse(JSON.stringify(p));
  assert.equal(p.lessons["JC-02"], undefined);
  assert.notEqual(S.lessonState(L("JC-02"), p), "complete");
});

test("reopening practice reopens a completed lesson", () => {
  let p = finishLesson({}, "JC-02", "2026-11-22");
  p = S.applyChange(course, p, { type: "practice", id: "JC-02-p1", status: "in-progress" }).progress;
  assert.equal(S.lessonState(L("JC-02"), p), "in-progress");
});

test("watch log accumulates minutes per video with dates", () => {
  let p = S.applyChange(course, {}, { type: "watch", id: "JC-02-v1", minutes: 10, date: "2026-11-22" }).progress;
  p = S.applyChange(course, p, { type: "watch", id: "JC-02-v1", minutes: 5, date: "2026-11-23" }).progress;
  assert.equal(p.watch["JC-02-v1"].minutes, 15);
  assert.deepEqual(p.watch["JC-02-v1"].log, [{ date: "2026-11-22", minutes: 10 }, { date: "2026-11-23", minutes: 5 }]);
  assert.equal(S.lessonState(L("JC-02"), p), "in-progress");
});

test("old day-based progress migrates to stable lesson IDs; unmapped kept; idempotent", () => {
  const old = { currentDay: 2, days: {
    "1": { blocks: { "d1-java": "complete", "d1-dsa": "in-progress", "zz-unknown": "complete" }, practice: { "d1-java": "complete", "x-old": "complete" }, notes: "my day 1 notes" },
    "9": { notes: "orphan" } } };
  const { progress: p, report } = S.migrateProgress(course, old);
  assert.equal(p.schemaVersion, 2);
  assert.equal(p.lessons["JC-03"].status, "complete");
  assert.equal(p.lessons["DSA-01"].status, "in-progress");
  assert.equal(p.practice["JC-03-p1"].status, "complete");
  assert.equal(p.notes["S01"], "my day 1 notes");
  assert.deepEqual(p.legacy, { blocks: { "zz-unknown": "complete" }, practice: { "x-old": "complete" }, notes: { "9": "orphan" } });
  assert.ok(report.migrated >= 4 && report.kept === 3);
  const again = S.migrateProgress(course, p);
  assert.equal(again.report.alreadyV2, true);
  assert.deepEqual(again.progress.lessons, p.lessons);
});

test("session count comes from data (no hard-coded total)", () => {
  const small = JSON.parse(JSON.stringify(course)); small.sessions = small.sessions.slice(0, 3);
  const r = S.resolveSessions(small);
  assert.equal(r.count, 3);
  const cal = S.buildCalendar(small, {}, { today: "2026-11-21" });
  assert.equal(cal.entries.filter(e => e.n).length, 3);
});
