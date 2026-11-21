/*
 * Study Desk schedule engine (pure functions, no DOM, no storage).
 * Works in the browser (window.StudyDeskSchedule) and in Node (module.exports).
 *
 * It reads a subject-first course (Subject -> Module -> Lesson, sessions that
 * reference stable lesson IDs) plus a progress object, and answers:
 *   - do all sessions resolve to real lessons?            resolveSessions()
 *   - how long is a given date (weekend vs weekday)?      dayBudget()
 *   - what are the blocks of a session on that date?      sessionBlocks()
 *   - which session falls on which date, with unavailable dates carrying the
 *     same unfinished session forward?                    buildCalendar()
 *   - lesson / practice / test states, quiz gates          lessonState(), testState(), ...
 *   - a pure reducer for UI changes                         applyChange()
 *   - mapping old day-based progress to lesson IDs          migrateProgress()
 *
 * Dates are plain "YYYY-MM-DD" strings in Asia/Kolkata; math is done in UTC so
 * the host time zone never shifts a date.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.StudyDeskSchedule = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var SCHEMA_VERSION = 2;
  var DEFAULTS = {
    startDate: "2026-11-22",
    sessionStart: "21:00",
    core: { revision: 12, lesson: 78, dsa: 30 },          // 120 min core (D6)
    dailyMinutes: { 0: 390, 1: 120, 2: 120, 3: 120, 4: 120, 5: 120, 6: 390 }, // Sat + Sun long day 6h30m (2h core + 4h30m stretch), Mon–Fri 2h (D7)
    testPassPct: 70,
    horizonDays: 120
  };
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  /* ---------- dates ---------- */
  function parse(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!m) throw new Error("Bad date: " + iso);
    return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  }
  function fmt(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function addDays(iso, n) { return fmt(parse(iso) + n * 86400000); }
  function weekday(iso) { return new Date(parse(iso)).getUTCDay(); }
  function diffDays(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }   // ISO strings sort lexically
  function todayIST(now) {
    var d = now != null ? new Date(now) : new Date();
    return new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);   // Asia/Kolkata is UTC+5:30, no DST
  }
  function hhmmAdd(hhmm, min) {
    var p = String(hhmm || "21:00").split(":"), t = (+p[0]) * 60 + (+p[1] || 0) + min;
    t = ((t % 1440) + 1440) % 1440;
    return (t / 60 | 0).toString().padStart(2, "0") + ":" + (t % 60).toString().padStart(2, "0");
  }

  function settingsOf(course, progress) {
    var c = (course && course.schedule) || {}, p = (progress && progress.schedule) || {};
    var s = {
      startDate: p.startDate || c.startDate || DEFAULTS.startDate,
      sessionStart: c.sessionStart || DEFAULTS.sessionStart,
      core: Object.assign({}, DEFAULTS.core, c.core || {}),
      dailyMinutes: Object.assign({}, DEFAULTS.dailyMinutes, c.dailyMinutes || {}, p.dailyMinutes || {}),
      dateMinutes: Object.assign({}, p.dateMinutes || {}),
      unavailable: Object.assign({}, p.unavailable || {}),
      testPassPct: c.testPassPct || DEFAULTS.testPassPct,
      day1WarmupLessonId: c.day1WarmupLessonId || null,
      horizonDays: c.horizonDays || DEFAULTS.horizonDays
    };
    return s;
  }

  /* ---------- course index ---------- */
  function indexCourse(course) {
    var idx = { subjects: [], subjectById: {}, moduleById: {}, lessonById: {}, practiceById: {}, order: [], errors: [] };
    var seen = {};
    function claim(id, what) {
      if (!id) { idx.errors.push(what + " without id"); return false; }
      if (seen[id]) { idx.errors.push("Duplicate id " + id + " (" + what + ", also " + seen[id] + ")"); return false; }
      seen[id] = what; return true;
    }
    (course.subjects || []).forEach(function (s, si) {
      claim(s.id, "subject");
      idx.subjects.push(s); idx.subjectById[s.id] = s;
      (s.modules || []).forEach(function (m, mi) {
        claim(m.id, "module");
        idx.moduleById[m.id] = { module: m, subject: s, index: mi };
        (m.lessons || []).forEach(function (l, li) {
          claim(l.id, "lesson");
          if (!l.source || (l.source.kind !== "gfg" && l.source.kind !== "added")) idx.errors.push("Lesson " + l.id + " has no source (gfg | added)");
          idx.lessonById[l.id] = { lesson: l, module: m, subject: s, order: idx.order.length, subjectIndex: si };
          idx.order.push(l.id);
          (l.practice || []).forEach(function (p) {
            claim(p.id, "practice");
            idx.practiceById[p.id] = { practice: p, lesson: l };
          });
        });
      });
    });
    return idx;
  }

  /* ---------- sessions ---------- */
  function resolveSessions(course, idx) {
    idx = idx || indexCourse(course);
    var errors = idx.errors.slice(), out = [];
    var s = settingsOf(course, null);
    (course.sessions || []).forEach(function (sess, i) {
      var n = i + 1, r = { n: n, id: sess.id || ("S" + String(n).padStart(2, "0")), title: sess.title || "", subjectId: sess.subject,
        lessons: [], dsa: [], test: null, warmup: null, revisionOf: n > 1 ? n - 1 : null, raw: sess };
      if (!idx.subjectById[sess.subject]) errors.push("Session " + n + ": unknown subject " + sess.subject);
      (sess.lessons || []).forEach(function (id) {
        var e = idx.lessonById[id];
        if (!e) errors.push("Session " + n + ": lesson " + id + " does not exist");
        else { if (e.subject.id !== sess.subject) errors.push("Session " + n + ": lesson " + id + " belongs to " + e.subject.id + ", not " + sess.subject); r.lessons.push(e.lesson); }
      });
      (sess.dsa || []).forEach(function (id) {
        var e = idx.lessonById[id];
        if (!e) errors.push("Session " + n + ": DSA lesson " + id + " does not exist");
        else { if (!e.subject.dsa) errors.push("Session " + n + ": " + id + " is not in the DSA subject"); r.dsa.push(e.lesson); }
      });
      if (!r.lessons.length) errors.push("Session " + n + ": no main lesson");
      if (!r.dsa.length) errors.push("Session " + n + ": no DSA practice");
      if (sess.test) { if (!idx.moduleById[sess.test] || !idx.moduleById[sess.test].module.test) errors.push("Session " + n + ": test " + sess.test + " not found"); else r.test = sess.test; }
      if (n === 1) {
        var w = sess.warmup || s.day1WarmupLessonId;
        if (w) { if (!idx.lessonById[w]) errors.push("Session 1: warm-up lesson " + w + " does not exist"); else r.warmup = idx.lessonById[w].lesson; }
      }
      out.push(r);
    });
    // Each lesson should be scheduled; report the ones that are not (coverage).
    var scheduled = {};
    out.forEach(function (r) { r.lessons.concat(r.dsa, r.warmup ? [r.warmup] : []).forEach(function (l) { (scheduled[l.id] = scheduled[l.id] || []).push(r.n); }); });
    var unscheduled = idx.order.filter(function (id) { return !scheduled[id]; });
    // Subject order must follow course.subjects order for the main track (non-decreasing).
    var last = -1;
    out.forEach(function (r) {
      var si = idx.subjects.indexOf(idx.subjectById[r.subjectId]);
      if (si >= 0 && !idx.subjectById[r.subjectId].dsa) { if (si < last) errors.push("Session " + r.n + ": subject " + r.subjectId + " goes back in the learning order"); last = Math.max(last, si); }
    });
    return { sessions: out, errors: errors, ok: errors.length === 0, scheduled: scheduled, unscheduled: unscheduled, count: out.length };
  }

  /* ---------- budgets and blocks ---------- */
  function dayBudget(date, settings) {
    var wd = weekday(date);
    var minutes = settings.dateMinutes[date] != null ? +settings.dateMinutes[date] : +settings.dailyMinutes[wd];
    var core = settings.core.revision + settings.core.lesson + settings.core.dsa;
    return { date: date, weekday: wd, dayName: DAY_NAMES[wd], kind: wd === 0 || wd === 6 ? "weekend" : "weekday",
      minutes: minutes, core: Math.min(core, minutes), stretch: Math.max(0, minutes - core), short: minutes < core,
      overridden: settings.dateMinutes[date] != null };
  }

  function scale(parts, total) {
    var sum = parts.reduce(function (a, b) { return a + b; }, 0);
    if (sum <= total) return parts.slice();
    var out = parts.map(function (p) { return Math.floor(p * total / sum); });
    var rest = total - out.reduce(function (a, b) { return a + b; }, 0);
    for (var i = 0; rest > 0; i = (i + 1) % out.length, rest--) out[i]++;
    return out;
  }

  // Blocks for one resolved session on a budget. Day 1: the revision slot is Java foundations.
  function sessionBlocks(r, budget, settings, prev) {
    var c = settings.core, mins = scale([c.revision, c.lesson, c.dsa], budget.minutes), t = settings.sessionStart, blocks = [];
    function push(b) { b.start = t; b.end = hhmmAdd(t, b.minutes); t = b.end; blocks.push(b); }
    if (r.n === 1) push({ id: r.id + "-foundations", kind: "foundations", title: r.warmup ? r.warmup.title : "Java foundations", lessonIds: r.warmup ? [r.warmup.id] : [], minutes: mins[0] });
    else push({ id: r.id + "-revision", kind: "revision", title: "Quick revision of session " + (r.n - 1), lessonIds: prev ? prev.lessons.map(function (l) { return l.id; }) : [], revisionOf: r.n - 1, minutes: mins[0] });
    push({ id: r.id + "-lesson", kind: "lesson", title: r.lessons.map(function (l) { return l.title; }).join(" + "), lessonIds: r.lessons.map(function (l) { return l.id; }), subjectId: r.subjectId, minutes: mins[1] });
    push({ id: r.id + "-dsa", kind: "dsa", title: r.dsa.map(function (l) { return l.title; }).join(" + "), lessonIds: r.dsa.map(function (l) { return l.id; }), minutes: mins[2] });
    if (budget.stretch > 0) blocks.push({ id: r.id + "-stretch", kind: "stretch", title: "Stretch practice", minutes: budget.stretch, start: null, end: null,
      lessonIds: r.lessons.concat(r.dsa).map(function (l) { return l.id; }), flexible: true });
    return blocks;
  }

  /* ---------- states ---------- */
  function rec(map, id) { return (map && map[id]) || {}; }
  function quizGate(lesson, progress) {
    if (!lesson.quiz || !(lesson.quiz.questions || []).length) return { required: false, passed: true };
    var q = rec(progress.quizzes, lesson.id);
    return { required: true, passed: !!q.passed, score: q.score != null ? q.score : null };
  }
  function practiceState(p, progress) {
    var r = rec(progress.practice, p.id);
    return { status: r.status || "pending", evidence: r.evidence || "", needsEvidence: !!p.evidenceRequired, completedOn: r.completedOn || null };
  }
  function lessonState(lesson, progress) {
    var r = rec(progress.lessons, lesson.id);
    if (r.status === "complete") return "complete";
    if (r.status === "in-progress") return "in-progress";
    // Any activity counts as in progress.
    var touched = (lesson.practice || []).some(function (p) { return practiceState(p, progress).status !== "pending"; }) ||
      (lesson.videos || []).some(function (v) { return (rec(progress.watch, v.id).minutes || 0) > 0; }) || rec(progress.quizzes, lesson.id).score != null;
    return touched ? "in-progress" : "pending";
  }
  function canCompleteLesson(lesson, progress) {
    var reasons = [], g = quizGate(lesson, progress);
    if (g.required && !g.passed) reasons.push("Pass the lesson check (quiz) first");
    (lesson.practice || []).forEach(function (p) {
      var st = practiceState(p, progress);
      if (p.required !== false && st.status !== "complete") reasons.push("Finish practice: " + p.title);
    });
    return { ok: reasons.length === 0, reasons: reasons };
  }
  function moduleLessonsDone(m, progress) {
    return (m.lessons || []).every(function (l) { return lessonState(l, progress) === "complete"; });
  }
  function testState(m, progress) {
    if (!m.test) return "none";
    var r = rec(progress.tests, m.id);
    if (r.passed) return "passed";
    if (!moduleLessonsDone(m, progress)) return "locked";
    return r.score != null ? "failed" : "unlocked";
  }
  function moduleProgress(m, progress) {
    var total = (m.lessons || []).length + (m.test ? 1 : 0), done = 0;
    (m.lessons || []).forEach(function (l) { if (lessonState(l, progress) === "complete") done++; });
    if (m.test && testState(m, progress) === "passed") done++;
    var st = done === total && total > 0 ? "complete" : done > 0 || (m.lessons || []).some(function (l) { return lessonState(l, progress) !== "pending"; }) ? "in-progress" : "pending";
    return { done: done, total: total, pct: total ? Math.round(done * 100 / total) : 0, status: st };
  }
  function subjectProgress(s, progress) {
    var done = 0, total = 0, any = false;
    (s.modules || []).forEach(function (m) { var p = moduleProgress(m, progress); done += p.done; total += p.total; if (p.status !== "pending") any = true; });
    return { done: done, total: total, pct: total ? Math.round(done * 100 / total) : 0, status: total && done === total ? "complete" : any ? "in-progress" : "pending" };
  }
  function scoreQuiz(quiz, answers, passPct) {
    var qs = (quiz && quiz.questions) || [], right = 0;
    qs.forEach(function (q, i) { if (answers && answers[q.id || i] === q.answer) right++; });
    var pct = qs.length ? Math.round(right * 100 / qs.length) : 0, need = (quiz && quiz.passPct) || passPct || DEFAULTS.testPassPct;
    return { right: right, total: qs.length, pct: pct, passPct: need, passed: qs.length > 0 && pct >= need };
  }

  // A session is complete when its Day 1 warm-up (if any), main lessons, its DSA lessons and its module test (if any) are done.
  function sessionStatus(r, idx, progress) {
    var items = (r.warmup ? [r.warmup] : []).concat(r.lessons, r.dsa), dates = [], done = 0, touched = false;
    items.forEach(function (l) {
      var st = lessonState(l, progress);
      if (st === "complete") { done++; dates.push(rec(progress.lessons, l.id).completedOn || null); }
      if (st !== "pending") touched = true;
    });
    var total = items.length;
    if (r.test) { total++; var t = rec(progress.tests, r.test); if (t.passed) { done++; dates.push(t.takenOn || null); touched = true; } }
    var complete = total > 0 && done === total;
    var completedOn = complete ? dates.reduce(function (a, d) { return d && (!a || d > a) ? d : a; }, null) : null;
    return { status: complete ? "complete" : touched ? "in-progress" : "pending", done: done, total: total, completedOn: completedOn };
  }

  /*
   * Calendar: walks dates from startDate. Each available date gets the first
   * unfinished session. Unavailable dates get no session and the same unfinished
   * session moves to the next available date (D2). A session finished on or
   * before a date moves the pointer on for the next date (next-day progression).
   * Today and later dates are projected: each available date is assumed to finish
   * its session (so tomorrow shows the next one until today is actually missed).
   */
  function buildCalendar(course, progress, opts) {
    opts = opts || {};
    progress = progress || {};
    var idx = opts.idx || indexCourse(course), res = opts.resolved || resolveSessions(course, idx), settings = settingsOf(course, progress);
    var today = opts.today || todayIST(), sessions = res.sessions, statuses = sessions.map(function (r) { return sessionStatus(r, idx, progress); });
    var entries = [], byN = {}, ptr = 0, d = settings.startDate, guard = 0, limit = settings.horizonDays + sessions.length * 4;
    function advancePast(date) {
      while (ptr < sessions.length && statuses[ptr].status === "complete" && (!statuses[ptr].completedOn || statuses[ptr].completedOn <= date)) ptr++;
    }
    while (ptr < sessions.length && guard++ < limit) {
      var budget = dayBudget(d, settings), past = cmp(d, today) < 0, isToday = d === today, future = cmp(d, today) > 0;
      if (settings.unavailable[d]) {
        entries.push({ date: d, unavailable: true, n: null, carries: sessions[ptr].n, budget: budget, past: past, isToday: isToday, projected: future });
      } else {
        var r = sessions[ptr], prevEntry = null;
        for (var k = entries.length - 1; k >= 0; k--) if (!entries[k].unavailable) { prevEntry = entries[k]; break; }
        var carried = !!(prevEntry && prevEntry.n === r.n);
        var e = { date: d, unavailable: false, n: r.n, sessionId: r.id, budget: budget, past: past, isToday: isToday, projected: future, carried: carried,
          status: statuses[ptr].status, blocks: sessionBlocks(r, budget, settings, ptr > 0 ? sessions[ptr - 1] : null) };
        entries.push(e);
        (byN[r.n] = byN[r.n] || []).push(e);
        var before = ptr; advancePast(d); if (!past && ptr === before) ptr++;   // today and later are projected to finish
      }
      d = addDays(d, 1);
    }
    var lastDate = entries.length ? entries[entries.length - 1].date : null;
    return { entries: entries, byN: byN, finishDate: lastDate, settings: settings, statuses: statuses, today: today, sessions: sessions };
  }

  function entryFor(cal, date) { for (var i = 0; i < cal.entries.length; i++) if (cal.entries[i].date === date) return cal.entries[i]; return null; }

  // Today: the entry for today, or (before Day 1) the first entry as a preview.
  function todayPlan(course, progress, opts) {
    var cal = buildCalendar(course, progress, opts), e = entryFor(cal, cal.today);
    var before = cal.entries.length && cmp(cal.today, cal.entries[0].date) < 0;
    if (!e) e = before ? cal.entries[0] : null;
    var current = cal.statuses.findIndex(function (s) { return s.status !== "complete"; });
    return { calendar: cal, entry: e, beforeStart: !!before, finished: current < 0, currentN: current < 0 ? null : current + 1 };
  }

  // Continue studying: first unfinished main lesson of the current session, then its DSA, then its test.
  function continueTarget(course, progress, opts) {
    var idx = indexCourse(course), res = resolveSessions(course, idx);
    for (var i = 0; i < res.sessions.length; i++) {
      var r = res.sessions[i];
      if (sessionStatus(r, idx, progress).status === "complete") continue;
      var l = (r.warmup ? [r.warmup] : []).concat(r.lessons).find(function (x) { return lessonState(x, progress) !== "complete"; });
      if (l) return { n: r.n, kind: "lesson", lesson: l, state: lessonState(l, progress) };
      var dl = r.dsa.find(function (x) { return lessonState(x, progress) !== "complete"; });
      if (dl) return { n: r.n, kind: "dsa", lesson: dl, state: lessonState(dl, progress) };
      if (r.test) return { n: r.n, kind: "test", moduleId: r.test, state: testState(idx.moduleById[r.test].module, progress) };
    }
    return null;
  }

  /* ---------- reducer ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o || {})); }
  function emptyProgress() { return { schemaVersion: SCHEMA_VERSION, lessons: {}, practice: {}, quizzes: {}, tests: {}, watch: {}, notes: {}, schedule: { unavailable: {}, dateMinutes: {}, dailyMinutes: {} } }; }
  function normalize(p) {
    var e = emptyProgress(), out = Object.assign(e, clone(p));
    ["lessons", "practice", "quizzes", "tests", "watch", "notes"].forEach(function (k) { out[k] = out[k] || {}; });
    out.schedule = Object.assign({ unavailable: {}, dateMinutes: {}, dailyMinutes: {} }, out.schedule || {});
    out.schemaVersion = SCHEMA_VERSION;
    return out;
  }

  /*
   * change = { type, ... , date } where date is the IST date the change happens.
   *   lesson   {id, status: pending|in-progress|complete}  (complete is refused unless canCompleteLesson)
   *   practice {id, status, evidence}                      (complete refused without evidence when evidenceRequired)
   *   quiz     {id: lessonId, answers}
   *   test     {id: moduleId, answers}                     (refused while locked)
   *   watch    {id: videoId, minutes}                      (appends to the watch log)
   *   note     {key: sessionId | lessonId, text}
   *   unavailable {date, value: true|false}
   *   minutes  {date?, weekday?, minutes}                  (per-date override, or a weekday default)
   * Returns { progress, ok, reason }.
   */
  function applyChange(course, progress, change) {
    var idx = indexCourse(course), p = normalize(progress), date = change.date || todayIST(), s = settingsOf(course, p);
    function fail(reason) { return { progress: normalize(progress), ok: false, reason: reason }; }
    switch (change.type) {
      case "lesson": {
        var e = idx.lessonById[change.id]; if (!e) return fail("Unknown lesson " + change.id);
        if (change.status === "complete") { var c = canCompleteLesson(e.lesson, p); if (!c.ok) return fail(c.reasons.join("; ")); }
        if (change.status === "pending") delete p.lessons[change.id];
        else p.lessons[change.id] = { status: change.status, completedOn: change.status === "complete" ? date : null, updatedOn: date };
        break;
      }
      case "practice": {
        var pe = idx.practiceById[change.id]; if (!pe) return fail("Unknown practice " + change.id);
        var prev = p.practice[change.id] || {}, ev = change.evidence != null ? String(change.evidence) : (prev.evidence || "");
        if (change.status === "complete" && pe.practice.evidenceRequired && !ev.trim()) return fail("Add assignment evidence (link or summary) before marking complete");
        if (change.status === "pending" && !ev) delete p.practice[change.id];
        else p.practice[change.id] = { status: change.status || prev.status || "pending", evidence: ev, completedOn: change.status === "complete" ? date : null, updatedOn: date };
        // Reopening practice reopens a completed lesson (keeps gates honest).
        if (change.status !== "complete" && p.lessons[pe.lesson.id] && p.lessons[pe.lesson.id].status === "complete") p.lessons[pe.lesson.id] = { status: "in-progress", completedOn: null, updatedOn: date };
        break;
      }
      case "quiz": {
        var le = idx.lessonById[change.id]; if (!le || !le.lesson.quiz) return fail("No quiz for " + change.id);
        var sc = scoreQuiz(le.lesson.quiz, change.answers, s.testPassPct);
        p.quizzes[change.id] = { score: sc.pct, passed: sc.passed, takenOn: date, attempts: ((p.quizzes[change.id] || {}).attempts || 0) + 1 };
        return { progress: p, ok: true, result: sc };
      }
      case "test": {
        var me = idx.moduleById[change.id]; if (!me || !me.module.test) return fail("No test for " + change.id);
        if (testState(me.module, p) === "locked") return fail("Test is locked until every lesson in " + me.module.title + " is complete");
        var ts = scoreQuiz(me.module.test, change.answers, s.testPassPct), old = p.tests[change.id] || {};
        p.tests[change.id] = { score: ts.pct, passed: ts.passed || !!old.passed, takenOn: ts.passed ? date : (old.takenOn || date), attempts: (old.attempts || 0) + 1 };
        return { progress: p, ok: true, result: ts };
      }
      case "watch": {
        var w = p.watch[change.id] || { minutes: 0, log: [] }, m = Math.max(0, Math.round(+change.minutes || 0));
        if (!m) return fail("Enter minutes watched");
        w.minutes += m; w.log.push({ date: date, minutes: m }); p.watch[change.id] = w;
        break;
      }
      case "note": p.notes[change.key] = String(change.text || ""); if (!p.notes[change.key]) delete p.notes[change.key]; break;
      case "unavailable":
        if (change.value) p.schedule.unavailable[change.date] = true; else delete p.schedule.unavailable[change.date];
        break;
      case "minutes": {
        var mm = Math.max(0, Math.min(16 * 60, Math.round(+change.minutes || 0)));
        if (change.date) { if (change.minutes == null || change.minutes === "") delete p.schedule.dateMinutes[change.date]; else p.schedule.dateMinutes[change.date] = mm; }
        else if (change.weekday != null) p.schedule.dailyMinutes[change.weekday] = mm;
        else return fail("minutes needs date or weekday");
        break;
      }
      default: return fail("Unknown change " + change.type);
    }
    return { progress: p, ok: true };
  }

  /*
   * Map old day-based progress (ui/README v1 contract: days[N].blocks / practice / notes / status)
   * to stable lesson IDs. legacyMap = { blocks: {oldBlockId: lessonId}, practice: {oldId: newPracticeId},
   * days: {"1": "S01"} }. Unmapped entries are kept under progress.legacy so nothing is lost.
   * Idempotent: a v2 object is returned normalized and unchanged.
   */
  function migrateProgress(course, old, legacyMap) {
    if (old && old.schemaVersion === SCHEMA_VERSION) return { progress: normalize(old), report: { migrated: 0, kept: 0, alreadyV2: true } };
    var idx = indexCourse(course), p = emptyProgress(), map = legacyMap || (course && course.legacyMap) || {}, report = { migrated: 0, kept: 0, details: [] };
    var legacy = {};
    var rank = { pending: 0, "in-progress": 1, complete: 2 };
    function setLesson(id, status, why) {
      if (!idx.lessonById[id]) return false;
      var cur = p.lessons[id];
      if (!cur || rank[status] > rank[cur.status]) p.lessons[id] = { status: status, completedOn: null, migratedFrom: why };
      report.migrated++; report.details.push(why + " -> " + id + " (" + status + ")"); return true;
    }
    var days = (old && old.days) || {};
    Object.keys(days).forEach(function (dk) {
      var d = days[dk] || {};
      Object.keys(d.blocks || {}).forEach(function (b) {
        var st = d.blocks[b]; if (!st || st === "pending") return;
        var target = (map.blocks || {})[b];
        if (!(target && setLesson(target, st, "day " + dk + " block " + b))) { (legacy.blocks = legacy.blocks || {})[b] = st; report.kept++; }
      });
      Object.keys(d.practice || {}).forEach(function (k) {
        var st = d.practice[k]; if (!st || st === "pending") return;
        var target = (map.practice || {})[k];
        if (target && idx.practiceById[target]) { p.practice[target] = { status: st, evidence: "", completedOn: null, migratedFrom: "day " + dk + " practice " + k }; report.migrated++; report.details.push("practice " + k + " -> " + target); }
        else { (legacy.practice = legacy.practice || {})[k] = st; report.kept++; }
      });
      if (d.notes) {
        var key = (map.days || {})[dk];
        if (key) { p.notes[key] = (p.notes[key] ? p.notes[key] + "\n" : "") + d.notes; report.migrated++; report.details.push("notes day " + dk + " -> " + key); }
        else { (legacy.notes = legacy.notes || {})[dk] = d.notes; report.kept++; }
      }
    });
    if (Object.keys(legacy).length) p.legacy = legacy;
    if (old && old.unavailable) p.schedule.unavailable = Object.assign({}, old.unavailable);
    return { progress: p, report: report };
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION, DEFAULTS: DEFAULTS, DAY_NAMES: DAY_NAMES,
    addDays: addDays, weekday: weekday, diffDays: diffDays, todayIST: todayIST, hhmmAdd: hhmmAdd,
    settingsOf: settingsOf, indexCourse: indexCourse, resolveSessions: resolveSessions,
    dayBudget: dayBudget, sessionBlocks: sessionBlocks,
    quizGate: quizGate, practiceState: practiceState, lessonState: lessonState, canCompleteLesson: canCompleteLesson,
    testState: testState, moduleProgress: moduleProgress, subjectProgress: subjectProgress, scoreQuiz: scoreQuiz,
    sessionStatus: sessionStatus, buildCalendar: buildCalendar, entryFor: entryFor, todayPlan: todayPlan, continueTarget: continueTarget,
    emptyProgress: emptyProgress, normalize: normalize, applyChange: applyChange, migrateProgress: migrateProgress
  };
});
