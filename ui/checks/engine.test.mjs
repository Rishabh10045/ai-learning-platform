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
  assert.deepEqual(order, ["java-core", "streams-apis", "concurrency", "databases", "spring-boot", "lld", "hld", "genai"]);
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
  assert.deepEqual(d2.blocks[0].lessonIds, ["JC-02"]);
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
  assert.equal(base.finishDate, S.addDays("2026-11-22", course.sessions.length - 1), "one session per available date: long weekend days add stretch, not extra sessions");
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
  assert.equal(c.n, 2); assert.equal(c.lesson.id, "JC-03");
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
  let p = finishSession(finishSession({}, 1, "2026-11-22"), 2, "2026-11-23");
  const r3 = S.resolveSessions(course).sessions[2];
  assert.equal(r3.test, "jc-basics");
  for (const l of r3.lessons.concat(r3.dsa)) p = finishLesson(p, l.id, "2026-11-24");
  assert.equal(S.sessionStatus(r3, idx, p).status, "in-progress");
  p = finishSession(p, 3, "2026-11-24");
  assert.equal(S.sessionStatus(r3, idx, p).status, "complete");
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
  assert.deepEqual(p.legacy, { currentDay: 2, blocks: { "zz-unknown": "complete" }, practice: { "x-old": "complete" }, notes: { "9": "orphan" } });
  assert.ok(report.migrated >= 4 && report.kept === 4);
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

/* ===================== Regression tests for QA 2026-11-21 (collab/qa/study-desk-qa-2026-11-21.md) ===================== */
const IST = (d, hhmm) => Date.parse(d + "T" + hhmm + ":00+05:30");

test("QA H2: a weekday default saves the weekday even when the host stamps today's date", () => {
  const r = S.applyChange(course, {}, { type: "minutes", weekday: 1, minutes: 180, date: "2026-11-23" });
  assert.ok(r.ok, r.reason);
  assert.equal(r.progress.schedule.dailyMinutes[1], 180);
  assert.deepEqual(r.progress.schedule.dateMinutes, {});
  const cal = S.buildCalendar(course, r.progress, { today: "2026-11-21" });
  for (const d of ["2026-11-23", "2026-11-30", "2026-12-07"]) assert.equal(S.entryFor(cal, d).budget.minutes, 180, d);
  // a one-date override still works through targetDate/date
  const o = S.applyChange(course, r.progress, { type: "minutes", targetDate: "2026-11-24", date: "2026-11-23", minutes: 60 }).progress;
  assert.equal(o.schedule.dateMinutes["2026-11-24"], 60);
});

test("QA H3: completions before 04:00 IST belong to the previous study day", () => {
  assert.equal(S.studyDayIST(IST("2026-11-23", "00:10")), "2026-11-22");
  assert.equal(S.studyDayIST(IST("2026-11-23", "03:59")), "2026-11-22");
  assert.equal(S.studyDayIST(IST("2026-11-23", "04:00")), "2026-11-23");
  assert.equal(S.studyDayIST(IST("2026-11-22", "21:00")), "2026-11-22");
  assert.equal(S.studyDayIST(IST("2026-11-23", "00:10"), "00:00"), "2026-11-23", "cutoff is configurable");
  // Session 1 finished at 00:10 IST on 23 Nov is stamped with the study day (22 Nov): the plan does not slip.
  const date = S.studyDayIST(IST("2026-11-23", "00:10"));
  const p = finishSession({}, 1, date);
  const t = S.todayPlan(course, p, { today: "2026-11-23" });
  assert.equal(t.entry.n, 2);
  assert.equal(S.buildCalendar(course, p, { today: "2026-11-23" }).finishDate, S.buildCalendar(course, {}, { today: "2026-11-21" }).finishDate);
});

test("QA M7: 0 minutes is a day off (session carries); out-of-range minutes are refused", () => {
  const p = S.applyChange(course, {}, { type: "minutes", targetDate: "2026-11-23", minutes: 0 }).progress;
  const cal = S.buildCalendar(course, p, { today: "2026-11-21" });
  const mon = S.entryFor(cal, "2026-11-23");
  assert.equal(mon.unavailable, true); assert.equal(mon.reason, "zero-minutes"); assert.equal(mon.carries, 2);
  assert.equal(S.entryFor(cal, "2026-11-24").n, 2);
  const wd0 = S.applyChange(course, {}, { type: "minutes", weekday: 2, minutes: 0 }).progress;   // every Tuesday off
  assert.equal(S.entryFor(S.buildCalendar(course, wd0, { today: "2026-11-21" }), "2026-11-24").unavailable, true);
  for (const bad of [10, 29, 961, "abc", -5]) assert.equal(S.applyChange(course, {}, { type: "minutes", weekday: 1, minutes: bad }).ok, false, String(bad));
  assert.equal(S.applyChange(course, {}, { type: "minutes", minutes: 60 }).ok, false, "needs weekday or date");
});

test("QA M10: a failed quiz retake keeps the earlier pass; a failed first attempt cannot complete the lesson", () => {
  let p = S.applyChange(course, {}, { type: "quiz", id: "JC-02", answers: { q1: 0 } }).progress;
  assert.equal(S.canCompleteLesson(L("JC-02"), p).ok, false);
  p = finishLesson({}, "JC-02", "2026-11-22");
  const r = S.applyChange(course, p, { type: "quiz", id: "JC-02", answers: { q1: 0 }, date: "2026-11-23" });
  assert.equal(r.result.passed, false); assert.equal(r.result.keptPass, true);
  assert.equal(r.progress.quizzes["JC-02"].passed, true);
  assert.equal(r.progress.quizzes["JC-02"].best, 100);
  assert.equal(r.progress.quizzes["JC-02"].score, 0);
  assert.equal(S.lessonState(L("JC-02"), r.progress), "complete");
  assert.equal(S.canCompleteLesson(L("JC-02"), r.progress).ok, true, "state stays consistent");
});

test("QA M11: migration keeps day status and currentDay; v1 HLD/GenAI blocks never touch future lessons", () => {
  const { progress: p, report } = S.migrateProgress(course, window.STUDY_DESK_FIXTURES.legacyProgress || {
    currentDay: 2, days: { "1": { status: "complete", blocks: { "d1-java": "complete", "d1-hld": "in-progress" }, notes: "n" } } });
  assert.equal(p.lessons["HLD-01"], undefined);
  assert.equal(p.lessons["GEN-01"], undefined);
  assert.equal(p.legacy.currentDay, 2);
  assert.ok(report.kept >= 2);
  const m2 = S.migrateProgress(course, { currentDay: 3, days: { "1": { status: "complete" }, "2": { status: "in-progress", blocks: { "d2-hld": "complete" } } } });
  assert.deepEqual(m2.progress.legacy.dayStatus, { "1": "complete", "2": "in-progress" });
  assert.equal(m2.progress.legacy.blocks["d2-hld"], "complete");
  assert.equal(m2.progress.legacy.currentDay, 3);
  assert.equal(m2.report.kept, 4);
});

test("QA M12: the validator rejects a module test before its lessons and warns on duplicate scheduling", () => {
  const bad = JSON.parse(JSON.stringify(course));
  bad.sessions[0].test = "jc-collections";
  const r = S.resolveSessions(bad);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(e => /Session 1: test jc-collections comes before its lessons/.test(e)), r.errors.join(" | "));
  const dup = JSON.parse(JSON.stringify(course));
  dup.sessions[1].lessons.push("JC-02");
  assert.ok(S.resolveSessions(dup).warnings.some(w => /JC-02 is scheduled in sessions 1, 2/.test(w)));
});

test("QA M13: every fixture session fits its slots (78-min lesson, 30-min DSA, 12-min Day 1 warm-up); overloads are reported", () => {
  const r = S.resolveSessions(course);
  assert.deepEqual(r.warnings, []);
  const heavy = JSON.parse(JSON.stringify(course));
  heavy.sessions[1].lessons = ["JC-03", "JC-04"];
  heavy.sessions[2].lessons = ["JC-07"];
  const w = S.resolveSessions(heavy).warnings;
  assert.ok(w.some(x => /Session 2: main lesson needs \d+ min, slot is 78/.test(x)), w.join(" | "));
});

test("QA M4: corrupt progress is detected, and normalize never throws or keeps broken maps", () => {
  assert.ok(S.validateProgress("str").length); assert.ok(S.validateProgress([]).length); assert.ok(S.validateProgress(null).length);
  assert.ok(S.validateProgress({ schedule: { unavailable: null } }).length === 0, "null maps are tolerated");
  assert.ok(S.validateProgress({ schedule: { unavailable: [] } }).length);
  assert.ok(S.validateProgress({ schedule: { startDate: "2026/11/22" } }).length);
  assert.ok(S.validateProgress({ lessons: "x" }).length);
  assert.deepEqual(S.validateProgress(S.emptyProgress()), []);
  for (const raw of ["str", [], null, 42, { schedule: { unavailable: null } }, { schedule: "x" }, { lessons: "x" }, { schedule: { startDate: "2026/11/22" } }]) {
    const p = S.normalize(raw);
    assert.equal(Object.keys(p).some(k => /^\d+$/.test(k)), false, JSON.stringify(raw));
    const r = S.applyChange(course, p, { type: "unavailable", date: "2026-11-23", value: true });
    assert.ok(r.ok, JSON.stringify(raw));
    assert.doesNotThrow(() => S.buildCalendar(course, p, { today: "2026-11-23" }));
  }
});

test("QA L2: reopening a lesson relocks a passed module test until the module is complete again", () => {
  let p = finishSession(finishSession(finishSession({}, 1, "2026-11-22"), 2, "2026-11-23"), 3, "2026-11-24");
  const m = idx.moduleById["jc-basics"].module;
  assert.equal(S.testState(m, p), "passed");
  p = S.applyChange(course, p, { type: "lesson", id: "JC-03", status: "in-progress" }).progress;
  assert.equal(S.testState(m, p), "locked");
  p = S.applyChange(course, p, { type: "lesson", id: "JC-03", status: "complete" }).progress;
  assert.equal(S.testState(m, p), "passed", "no retake needed once the lesson is complete again");
});

test("QA L3: the reducer refuses unknown statuses, unknown videos and huge watch logs", () => {
  assert.equal(S.applyChange(course, {}, { type: "lesson", id: "JC-02", status: "banana" }).ok, false);
  assert.equal(S.applyChange(course, {}, { type: "practice", id: "JC-02-p1", status: "banana" }).ok, false);
  assert.equal(S.applyChange(course, {}, { type: "watch", id: "NOPE-v1", minutes: 5 }).ok, false);
  assert.equal(S.applyChange(course, {}, { type: "watch", id: "JC-02-v1", minutes: 1e9 }).ok, false);
  assert.equal(S.applyChange(course, {}, { type: "unavailable", date: "22-11-2026", value: true }).ok, false);
});

test("QA L4: editing evidence of completed practice keeps the lesson complete and the original date", () => {
  let p = finishLesson({}, "JC-02", "2026-11-22");
  p = S.applyChange(course, p, { type: "practice", id: "JC-02-p1", evidence: "https://github.com/me/better", date: "2026-11-25" }).progress;
  assert.equal(S.lessonState(L("JC-02"), p), "complete");
  assert.equal(p.practice["JC-02-p1"].completedOn, "2026-11-22");
  p = S.applyChange(course, p, { type: "practice", id: "JC-02-p1", status: "complete", evidence: "https://github.com/me/best", date: "2026-11-26" }).progress;
  assert.equal(p.practice["JC-02-p1"].completedOn, "2026-11-22");
});

test("QA L6: quick revision has its own record; old rev- notes are migrated by normalize", () => {
  let p = S.applyChange(course, {}, { type: "revision", id: "S02", done: true, date: "2026-11-23" }).progress;
  assert.deepEqual(p.revisions.S02, { doneOn: "2026-11-23" });
  assert.equal(Object.keys(p.notes).length, 0);
  p = S.applyChange(course, p, { type: "revision", id: "S02", done: false }).progress;
  assert.equal(p.revisions.S02, undefined);
  const old = S.normalize({ notes: { S01: "mine", "rev-S02": "done" } });
  assert.deepEqual(old.notes, { S01: "mine" }); assert.ok(old.revisions.S02);
});

test("QA L8: when the calendar window ends before the plan, there is no fake finish date", () => {
  const p = S.emptyProgress();
  for (let i = 0; i < 400; i++) p.schedule.unavailable[S.addDays("2026-11-22", i)] = true;
  const cal = S.buildCalendar(course, p, { today: "2026-11-21" });
  assert.equal(cal.truncated, true); assert.equal(cal.finishDate, null);
  assert.equal(S.buildCalendar(course, {}, { today: "2026-11-21" }).truncated, false);
});

test("QA fixture structure: prerequisites in order (generics, SQL/JDBC, HTTP, LLM basics) and one main lesson per session", () => {
  const r = S.resolveSessions(course), first = id => Math.min(...r.scheduled[id]);
  assert.ok(first("JC-07") < first("JC-05"), "generics before collections");
  assert.ok(first("DB-03") < first("SB-03"), "SQL/JDBC before JPA");
  assert.ok(first("SB-09") < first("SB-02"), "HTTP before REST controllers");
  assert.ok(first("SB-10") < first("SB-08"), "LLM basics before Spring AI");
  r.sessions.forEach(x => { assert.equal(x.lessons.length, 1, "session " + x.n); assert.equal(x.dsa.length, 1); });
  const dsaIds = r.sessions.map(x => x.dsa[0].id); assert.equal(new Set(dsaIds).size, dsaIds.length, "each session has its own DSA set");
  for (const s of course.subjects) for (const m of s.modules) for (const l of m.lessons) for (const v of l.videos || []) {
    if (["hld", "lld", "genai", "databases", "spring-boot"].includes(s.id)) assert.ok(!/search_query=java%20/.test(v.url), v.url);
  }
});

/* ---------- engagement engine (ui/engine/engagement-engine.js) ---------- */
globalThis.window.StudyDeskSchedule = S;
const E = require("../engine/engagement-engine.js");
require("../fixtures/engagement.fixture.js");
const xpOf = p => E.ledger(course, p).reduce((a, e) => a + e.xp, 0);
const EA = (p, change, at) => E.applyChange(course, p, change, at);

test("engagement: point values and level thresholds", () => {
  assert.equal(E.POINTS.lessonComplete, 50); assert.equal(E.POINTS.moduleTestPass, 100); assert.equal(E.POINTS.dailyChallenge, 30); assert.equal(E.POINTS.weeklyChallenge, 150);
  assert.deepEqual([0, 199, 200, 999, 1000, 4000].map(x => E.levelFor(x).n), [1, 1, 2, 3, 4, 7]);
  const l8 = E.levelFor(5500); assert.equal(l8.n, 8); assert.equal(l8.from, 5500); assert.equal(l8.to, 7000);
  assert.equal(E.levelFor(350).pct, 50); assert.equal(E.levelFor(350).toNext, 150);
});

test("engagement: ledger awards XP once per item, on the date it was earned", () => {
  let p = finishLesson(S.emptyProgress(), "JC-02", "2026-11-22");
  const led = E.ledger(course, p);
  // quiz 20 + 10 (100%), practice 25 + 10 (evidence), lesson 50
  assert.equal(xpOf(p), 115);
  assert.ok(led.every(e => e.date === "2026-11-22"));
  // retaking a passed quiz does not pay again
  const a = {}; L("JC-02").quiz.questions.forEach(q => a[q.id] = q.answer);
  p = S.applyChange(course, p, { type: "quiz", id: "JC-02", answers: a, date: "2026-11-23" }).progress;
  assert.equal(xpOf(p), 115);
  // videos: 1 XP per 10 min, capped at 12/day
  const vid = L("JC-02").videos[0].id;
  p = S.applyChange(course, p, { type: "watch", id: vid, minutes: 25, date: "2026-11-23" }).progress;
  assert.equal(xpOf(p), 117);
  p = S.applyChange(course, p, { type: "watch", id: vid, minutes: 500, date: "2026-11-23" }).progress;
  assert.equal(xpOf(p), 115 + 12);
});

test("engagement: streak counts study days; unavailable days never break it, a missed study day does", () => {
  let p = S.emptyProgress();
  p = S.applyChange(course, p, { type: "revision", id: "S02", done: true, date: "2026-11-22" }).progress;
  p = S.applyChange(course, p, { type: "revision", id: "S03", done: true, date: "2026-11-23" }).progress;
  p = S.applyChange(course, p, { type: "unavailable", date: "2026-11-24", value: true }).progress;
  p = S.applyChange(course, p, { type: "revision", id: "S04", done: true, date: "2026-11-25" }).progress;
  let st = E.streak(course, p, "2026-11-25");
  assert.equal(st.current, 3); assert.equal(st.best, 3); assert.equal(st.skippedDays, 1); assert.equal(st.todayDone, true);
  // the next evening, before studying: still 3, at risk
  st = E.streak(course, p, "2026-11-26");
  assert.equal(st.current, 3); assert.equal(st.atRisk, true); assert.equal(st.todayDone, false);
  // a 0-minute day is a day off too
  p = S.applyChange(course, p, { type: "minutes", targetDate: "2026-11-26", minutes: 0, date: "2026-11-25" }).progress;
  st = E.streak(course, p, "2026-11-27"); assert.equal(st.current, 3); assert.equal(st.atRisk, true);
  // a missed available day (27th) breaks it
  st = E.streak(course, p, "2026-11-28"); assert.equal(st.current, 0); assert.equal(st.best, 3);
  assert.equal(st.history.find(h => h.date === "2026-11-27").state, "missed");
  assert.equal(st.history.find(h => h.date === "2026-11-24").state, "off");
});

test("engagement: today's tasks follow tonight's session (Day 1 warm-up, quiz, practice, DSA, interview, notes)", () => {
  let t = E.tasksFor(course, S.emptyProgress(), "2026-11-22");
  assert.equal(t.sessionN, 1); assert.equal(t.done, 0);
  const kinds = t.tasks.map(x => x.kind);
  for (const k of ["quiz", "lesson", "practice", "dsa", "interview", "notes"]) assert.ok(kinds.includes(k), k);
  assert.ok(!kinds.includes("revision"), "Day 1 has no revision task (Java foundations instead)");
  assert.ok(t.tasks.some(x => /^Java foundations/.test(x.title) && !/Java foundations: Java foundations/.test(x.title)));
  let p = finishSession(S.emptyProgress(), 1, "2026-11-22");
  p = S.applyChange(course, p, { type: "note", key: "S01", text: "mine", date: "2026-11-22" }).progress;
  const q = E.questionsOf(L(S.resolveSessions(course).sessions[0].lessons[0].id))[0];
  p = EA(p, { type: "interview", id: q.id, lessonId: S.resolveSessions(course).sessions[0].lessons[0].id, date: "2026-11-22" }).progress;
  t = E.tasksFor(course, p, "2026-11-22");
  assert.equal(t.done, t.total); assert.equal(t.allDone, true); assert.equal(t.xpAvailable, 0);
  // Session 2 on Monday has the quick revision task; an unavailable day has no tasks
  assert.ok(E.tasksFor(course, p, "2026-11-23").tasks.some(x => x.kind === "revision"));
  const off = S.applyChange(course, p, { type: "unavailable", date: "2026-11-23", value: true }).progress;
  assert.equal(E.tasksFor(course, off, "2026-11-23").off, true);
});

test("engagement: challenges are claimed only when met, only today / this week, once", () => {
  let p = S.emptyProgress(), d = "2026-11-22";
  const c = E.dailyChallenge(course, p, d);
  assert.equal(c.id, "daily-" + d); assert.equal(c.met, false);
  assert.equal(EA(p, { type: "challenge", id: c.id, date: d }).ok, false);
  assert.equal(EA(p, { type: "challenge", id: "daily-2026-11-21", date: d }).ok, false, "past challenge");
  // meet it: every candidate is met by finishing the session properly + 3 lines of notes + interview answers
  p = finishSession(p, 1, d);
  p = S.applyChange(course, p, { type: "note", key: "S01", text: "a\nb\nc", date: d }).progress;
  for (const l of S.resolveSessions(course).sessions[0].lessons.concat(S.resolveSessions(course).sessions[0].dsa))
    for (const q of E.questionsOf(l)) p = EA(p, { type: "interview", id: q.id, lessonId: l.id, date: d }).progress;
  assert.equal(E.dailyChallenge(course, p, d).met, true, E.dailyChallenge(course, p, d).kind);
  const before = xpOf(p), r = EA(p, { type: "challenge", id: c.id, date: d });
  assert.ok(r.ok, r.reason); assert.equal(xpOf(r.progress) - before, 30);
  assert.equal(E.dailyChallenge(course, r.progress, d).claimed, true);
  assert.equal(EA(r.progress, { type: "challenge", id: c.id, date: d }).ok, false, "claimed twice");
  // weekly: partial first week is "show up"; Sunday 22 Nov is the only plan day of week 16–22 Nov
  const w = E.weeklyChallenge(course, r.progress, d);
  assert.equal(w.kind, "show-up"); assert.equal(w.availableDays, 1); assert.equal(w.met, true);
  const rw = EA(r.progress, { type: "challenge", id: w.id, date: d }); assert.ok(rw.ok, rw.reason); assert.equal(xpOf(rw.progress) - xpOf(r.progress), 150);
  // unavailable days are not required for "show up"
  let q2 = S.applyChange(course, S.emptyProgress(), { type: "unavailable", date: "2026-11-25", value: true }).progress;
  const w2 = E.weeklyChallenge(course, q2, "2026-11-23"); if (w2.kind === "show-up") assert.equal(w2.availableDays, 6);
});

test("engagement: interview answers are validated and pay 5 XP each", () => {
  const l = L("JC-02"), q = E.questionsOf(l)[0];
  assert.equal(EA(S.emptyProgress(), { type: "interview", id: "nope", lessonId: "JC-02", date: "2026-11-22" }).ok, false);
  const r = EA(S.emptyProgress(), { type: "interview", id: q.id, lessonId: "JC-02", date: "2026-11-22" });
  assert.ok(r.ok); assert.equal(xpOf(r.progress), 5);
  assert.equal(xpOf(EA(r.progress, { type: "interview", id: q.id, lessonId: "JC-02", answered: false, date: "2026-11-22" }).progress), 0);
});

test("engagement: notification preferences (defaults 00:00–06:00 IST, 2–3 h, validated)", () => {
  const d = E.notificationPrefs(S.emptyProgress());
  assert.deepEqual([d.email, d.quietStart, d.quietEnd, d.intervalHours, d.maxPerDay, d.timezone], [false, "00:00", "06:00", 2.5, 6, "Asia/Kolkata"]);
  const p = S.emptyProgress();
  assert.equal(EA(p, { type: "prefs", notifications: { intervalHours: 4 } }).ok, false);
  assert.equal(EA(p, { type: "prefs", notifications: { email: true } }).ok, false, "email on needs an address");
  assert.equal(EA(p, { type: "prefs", notifications: { quietStart: "25:00" } }).ok, false);
  const r = EA(p, { type: "prefs", notifications: { email: true, address: "d@example.com", intervalHours: 3, quietStart: "23:30", quietEnd: "07:00" }, date: "2026-11-22" }, "2026-11-22T10:00:00Z");
  assert.ok(r.ok, r.reason);
  const n = E.notificationPrefs(r.progress);
  assert.deepEqual([n.email, n.address, n.intervalHours, n.quietStart, n.quietEnd], [true, "d@example.com", 3, "23:30", "07:00"]);
  assert.equal(r.progress.lastActiveAt, undefined, "settings changes are not study activity");
});

test("engagement: next reminder time respects interval, quiet hours, done-for-today and daily limit", () => {
  const on = Object.assign({}, E.NOTIFY_DEFAULTS, { email: true, address: "d@example.com" });
  assert.equal(E.nextNudge(E.NOTIFY_DEFAULTS, null, 0).at, null);
  // last activity 9:00 PM IST, now 9:30 PM: next at 11:30 PM IST
  let n = E.nextNudge(on, "2026-11-22T15:30:00Z", Date.parse("2026-11-22T16:00:00Z"));
  assert.equal(n.at, "2026-11-22T18:00:00.000Z"); assert.match(n.label, /11:30 PM IST/);
  // last activity 10:30 PM IST: +2.5 h = 1:00 AM, inside quiet hours -> 6:00 AM IST
  n = E.nextNudge(on, "2026-11-22T17:00:00Z", Date.parse("2026-11-22T17:30:00Z"));
  assert.equal(n.at, "2026-11-23T00:30:00.000Z"); assert.match(n.label, /6:00 AM IST/);
  // quiet window not crossing midnight (13:00–15:00)
  n = E.nextNudge(Object.assign({}, on, { quietStart: "13:00", quietEnd: "15:00" }), "2026-11-23T05:00:00Z", Date.parse("2026-11-23T05:10:00Z"));
  assert.match(n.label, /3:00 PM IST/);
  // long inactivity: the next slot on the interval grid after now
  n = E.nextNudge(on, "2026-11-22T04:30:00Z", Date.parse("2026-11-22T10:00:00Z"));   // last 10:00 AM IST, now 3:30 PM -> grid 12:30, 3:00, 5:30 PM
  assert.match(n.label, /5:30 PM IST/);
  assert.equal(E.nextNudge(on, "2026-11-22T15:30:00Z", 0, { todayDone: true }).at, null);
  assert.equal(E.nextNudge(on, "2026-11-22T15:30:00Z", 0, { sentToday: 6 }).at, null);
});

test("engagement: activity log is timestamped, capped, and drives lastActiveAt", () => {
  let p = S.emptyProgress();
  const l = L("JC-02"), a = {}; l.quiz.questions.forEach(q => a[q.id] = q.answer);
  let r = EA(p, { type: "quiz", id: "JC-02", answers: a, date: "2026-11-22" }, "2026-11-22T15:45:00Z");
  assert.ok(r.ok); p = r.progress;
  assert.equal(p.activity.length, 1);
  assert.deepEqual(p.activity[0], { at: "2026-11-22T15:45:00.000Z", date: "2026-11-22", type: "quiz", id: "JC-02", xp: 30 });
  assert.equal(p.lastActiveAt, "2026-11-22T15:45:00.000Z");
  r = EA(p, { type: "unavailable", date: "2026-11-30", value: true }, "2026-11-22T16:00:00Z"); p = r.progress;
  assert.equal(p.activity.length, 2); assert.equal(p.lastActiveAt, "2026-11-22T15:45:00.000Z", "a day-off change is logged but is not study activity");
  // refused changes are not logged
  assert.equal(EA(p, { type: "lesson", id: "JC-02", status: "complete", date: "2026-11-22" }, "2026-11-22T16:05:00Z").ok, false);
  // cap
  p.activity = Array.from({ length: 1000 }, (_, i) => ({ at: "2026-11-22T10:00:00.000Z", date: "2026-11-22", type: "note", id: "x" + i, xp: 0 }));
  p = EA(p, { type: "note", key: "S01", text: "hi", date: "2026-11-22" }, "2026-11-22T17:00:00Z").progress;
  assert.equal(p.activity.length, 1000); assert.equal(p.activity[999].id, "S01");
  // survives normalize / validateProgress (the hosts' load path)
  assert.deepEqual(S.validateProgress(p), []); assert.equal(S.normalize(p).activity.length, 1000);
  const d = E.derive(course, p, "2026-11-22");
  assert.equal(d.lastActiveAt, "2026-11-22T17:00:00.000Z"); assert.equal(d.activity[0].id, "S01", "newest first");
});

test("engagement: derive() view-model and host override (options.engagement)", () => {
  const d = E.derive(course, {}, "2026-11-22");
  assert.equal(d.contractVersion, 1); assert.equal(d.source, "derived"); assert.equal(d.xp, 0); assert.equal(d.level.n, 1);
  assert.equal(d.challenges.length, 2); assert.equal(d.badges.length, 16); // 12 + sessions-7, sessions-half, sessions-all, spaced-10 (Grok, Phase 6) assert.equal(d.nextNudge.at, null);
  const m = E.merge(d, { xp: 2000, streak: { current: 9 } });
  assert.equal(m.source, "host"); assert.equal(m.level.n, 5); assert.equal(m.streak.current, 9); assert.equal(m.streak.best, 0);
  assert.equal(E.merge(d, { example: true }).source, "example");
  assert.equal(E.merge(d, null), d);
});

test("engagement: example fixture history derives the documented numbers", () => {
  const F = window.STUDY_DESK_FIXTURES, p = F.engagementExample.build(S, E, course);
  const d = E.derive(course, p, F.engagementExample.today, { now: Date.parse("2026-11-27T17:30:00Z") });
  assert.equal(d.streak.current, 5); assert.equal(d.streak.skippedDays, 1);
  assert.equal(d.level.n, 4); assert.ok(d.xp >= 1000 && d.xp < 1750, String(d.xp));
  assert.equal(Object.keys(p.challenges).length, 4);
  assert.ok(d.activity.length > 30); assert.ok(d.nextNudge.at);
});
