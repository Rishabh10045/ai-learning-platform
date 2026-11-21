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
