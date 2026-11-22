/*
 * Study Desk engagement engine (pure functions, no DOM, no storage).
 * Works in the browser (window.StudyDeskEngagement, needs window.StudyDeskSchedule first)
 * and in Node (module.exports, requires ./schedule-engine.js).
 *
 * Everything here is DERIVED from the progress object the host already stores
 * (lessons, quizzes, practice, tests, revisions, watch) plus three optional
 * engagement fields the reducer writes:
 *   progress.interview  { [questionId]: { lessonId, answeredOn } }
 *   progress.challenges { [challengeId]: { doneOn, kind, xp } }
 *   progress.spaced     { ["S03+7"]: { doneOn } }   spaced revision of a finished session, +1/+3/+7 days later
 *   progress.prefs      { notifications: {...} }
 *   progress.activity   [ { at, date, type, id, xp } ]   (recordActivity, newest last)
 *   progress.lastActiveAt  ISO timestamp of the last study action
 * Contract: collab/engagement-contract.md. A host may send its own numbers
 * (StudyDesk.mount options.engagement); the UI then shows those instead.
 */
(function (root, factory) {
  var S = typeof module === "object" && module.exports ? require("./schedule-engine.js") : root.StudyDeskSchedule;
  var api = factory(S);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.StudyDeskEngagement = api;
})(typeof self !== "undefined" ? self : this, function (S) {
  "use strict";
  if (!S) throw new Error("StudyDeskEngagement needs StudyDeskSchedule loaded first");

  var CONTRACT_VERSION = 1;
  // Points (XP). Effort-weighted: a 78-minute lesson is the unit (50); proof of work
  // (practice with evidence, tests) pays more than clicking; small daily habits
  // (revision, interview answers) pay enough to be worth doing every day.
  var POINTS = {
    lessonComplete: 50,          // the main unit of work (~78 min)
    quizPass: 20,                // lesson check passed (once per lesson)
    quizPerfectBonus: 10,        // best score 100%
    practiceComplete: 25,        // practice item marked complete
    practiceEvidenceBonus: 10,   // ... with evidence (link / summary) attached
    revisionDone: 15,            // the 12-minute quick revision
    interviewAnswer: 5,          // one interview question answered out loud and marked
    moduleTestPass: 100,         // module test passed (once per module)
    moduleTestHighBonus: 25,     // ... with 90%+
    sessionComplete: 40,         // every item of a session done (finishing bonus)
    watchPer10Min: 1,            // logged video minutes, 1 XP per 10 min
    watchDailyCap: 12,           // at most 12 XP/day from videos (videos are not the goal)
    dailyChallenge: 30,
    weeklyChallenge: 150,
    spacedRevision: 10           // +1/+3/+7-day spaced revision of a finished session
  };
  // Spaced revision: review a finished session 1, 3 and 7 days after it was completed.
  var SPACED_STEPS = [1, 3, 7];
  // Level n starts at LEVELS[n-1].xp. After the table: +1500 XP per level.
  var LEVELS = [
    { xp: 0, name: "Rookie" }, { xp: 200, name: "Learner" }, { xp: 500, name: "Builder" }, { xp: 1000, name: "Problem Solver" },
    { xp: 1750, name: "Engineer" }, { xp: 2750, name: "Senior Engineer" }, { xp: 4000, name: "Architect" }
  ];
  var NOTIFY_DEFAULTS = { email: false, address: "", intervalHours: 2.5, quietStart: "00:00", quietEnd: "06:00", timezone: "Asia/Kolkata", maxPerDay: 6 };
  var STUDY_TYPES = { lesson: 1, practice: 1, quiz: 1, test: 1, watch: 1, note: 1, revision: 1, interview: 1, challenge: 1, spaced: 1 };   // settings changes are not "activity"
  var ACTIVITY_CAP = 1000;

  function isObj(x) { return !!x && typeof x === "object" && !Array.isArray(x); }
  function hhmm(x) { return typeof x === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(x); }
  function minOf(t) { var p = t.split(":"); return (+p[0]) * 60 + (+p[1]); }
  function istParts(ms) { var d = new Date(ms + 330 * 60000); return { date: d.toISOString().slice(0, 10), min: d.getUTCHours() * 60 + d.getUTCMinutes() }; }
  function istLabel(ms) { var p = istParts(ms), H = Math.floor(p.min / 60), M = p.min % 60; return p.date + " " + ((H + 11) % 12 + 1) + ":" + String(M).padStart(2, "0") + " " + (H < 12 ? "AM" : "PM") + " IST"; }

  /* ---------- preferences ---------- */
  function notificationPrefs(progress) {
    var src = progress && isObj(progress.prefs) && isObj(progress.prefs.notifications) ? progress.prefs.notifications : {};
    var out = Object.assign({}, NOTIFY_DEFAULTS);
    if (typeof src.email === "boolean") out.email = src.email;
    if (typeof src.address === "string") out.address = src.address;
    if (+src.intervalHours >= 2 && +src.intervalHours <= 3) out.intervalHours = +src.intervalHours;
    if (hhmm(src.quietStart)) out.quietStart = src.quietStart;
    if (hhmm(src.quietEnd)) out.quietEnd = src.quietEnd;
    if (+src.maxPerDay >= 1 && +src.maxPerDay <= 12) out.maxPerDay = Math.round(+src.maxPerDay);
    return out;
  }
  // Problems with a notifications prefs patch (the reducer refuses invalid ones).
  function validateNotificationPrefs(n) {
    var bad = [];
    if (!isObj(n)) return ["notifications must be an object"];
    if (n.email != null && typeof n.email !== "boolean") bad.push("email must be true or false");
    if (n.address != null && n.address !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(n.address))) bad.push("Enter a valid email address");
    if (n.intervalHours != null && !(+n.intervalHours >= 2 && +n.intervalHours <= 3)) bad.push("Reminder interval must be between 2 and 3 hours");
    if (n.quietStart != null && !hhmm(n.quietStart)) bad.push("Quiet hours start must be HH:MM");
    if (n.quietEnd != null && !hhmm(n.quietEnd)) bad.push("Quiet hours end must be HH:MM");
    if (n.maxPerDay != null && !(+n.maxPerDay >= 1 && +n.maxPerDay <= 12)) bad.push("At most 1–12 reminders a day");
    if (n.email === true && !n.address) bad.push("Add the email address reminders should go to");
    return bad;
  }
  function inQuiet(min, prefs) {
    var a = minOf(prefs.quietStart), b = minOf(prefs.quietEnd);
    if (a === b) return false;
    return a < b ? (min >= a && min < b) : (min >= a || min < b);
  }
  /*
   * When the next reminder email WOULD go out (sending is not wired yet).
   * Rule: every intervalHours after the last study action, never inside quiet hours
   * (moved to quiet-hours end), none once today's tasks are done, at most maxPerDay.
   * sentToday = how many were already sent today (from a future send log; 0 for now).
   */
  function nextNudge(prefs, lastActiveAt, nowMs, o) {
    o = o || {};
    prefs = Object.assign({}, NOTIFY_DEFAULTS, prefs || {});
    if (!prefs.email) return { at: null, reason: "Email reminders are off" };
    if (o.todayDone) return { at: null, reason: "Today’s tasks are done: no reminder needed" };
    if ((o.sentToday || 0) >= prefs.maxPerDay) return { at: null, reason: "Daily limit of " + prefs.maxPerDay + " reminders reached" };
    var iv = prefs.intervalHours * 3600000, now = nowMs != null ? nowMs : Date.now();
    var last = lastActiveAt ? Date.parse(lastActiveAt) : NaN, t;
    if (isNaN(last)) t = now;
    else { t = last + iv; if (t < now) t = now + (iv - ((now - last) % iv)) % iv; }
    var p = istParts(t);
    if (inQuiet(p.min, prefs)) {
      // Move to the next quiet-hours end after t (the quiet window may cross midnight).
      var end = Date.parse(p.date + "T" + prefs.quietEnd + ":00+05:30");
      if (end <= t) end += 86400000;
      t = end;
    }
    return { at: new Date(t).toISOString(), label: istLabel(t), reason: isNaN(last) ? "No study activity recorded yet" : "No activity since " + istLabel(last) };
  }

  /* ---------- ledger ---------- */
  function questionsOf(lesson) { return (lesson.interview && lesson.interview.length ? lesson.interview : lesson.coach) || []; }
  // Every point earned, with the IST date it was earned (null = migrated, date unknown).
  function ledger(course, progress, idx) {
    idx = idx || S.indexCourse(course);
    var p = S.normalize(progress), out = [];
    function push(date, kind, id, xp, label) { if (xp) out.push({ date: date || null, kind: kind, id: id, xp: xp, label: label }); }
    Object.keys(p.lessons).forEach(function (id) {
      var r = p.lessons[id], e = idx.lessonById[id];
      if (e && r.status === "complete") push(r.completedOn, "lesson", id, POINTS.lessonComplete, "Completed " + e.lesson.title);
    });
    Object.keys(p.quizzes).forEach(function (id) {
      var q = p.quizzes[id], e = idx.lessonById[id];
      if (!e || !q.passed) return;
      push(q.passedOn || q.takenOn, "quiz", id, POINTS.quizPass + ((q.best != null ? q.best : q.score) === 100 ? POINTS.quizPerfectBonus : 0), "Passed lesson check: " + e.lesson.title + ((q.best != null ? q.best : q.score) === 100 ? " (100%)" : ""));
    });
    Object.keys(p.practice).forEach(function (id) {
      var r = p.practice[id], e = idx.practiceById[id];
      if (!e || r.status !== "complete") return;
      var ev = !!String(r.evidence || "").trim();
      push(r.completedOn, "practice", id, POINTS.practiceComplete + (ev ? POINTS.practiceEvidenceBonus : 0), "Practice done: " + e.practice.title.replace(/^(Practice|Problem set): /, "") + (ev ? " (with evidence)" : ""));
    });
    Object.keys(p.revisions).forEach(function (id) { push(p.revisions[id] && p.revisions[id].doneOn, "revision", id, POINTS.revisionDone, "Quick revision for " + id); });
    var iv = isObj(p.interview) ? p.interview : {};
    Object.keys(iv).forEach(function (qid) { if (iv[qid] && iv[qid].answeredOn !== undefined) push(iv[qid].answeredOn, "interview", qid, POINTS.interviewAnswer, "Answered interview question " + qid); });
    Object.keys(p.tests).forEach(function (id) {
      var t = p.tests[id], e = idx.moduleById[id];
      if (!e || !t.passed) return;
      push(t.takenOn, "test", id, POINTS.moduleTestPass + ((t.best != null ? t.best : t.score) >= 90 ? POINTS.moduleTestHighBonus : 0), "Passed module test: " + e.module.title);
    });
    var perDay = {};
    Object.keys(p.watch).forEach(function (vid) { ((p.watch[vid] || {}).log || []).forEach(function (w) { perDay[w.date] = (perDay[w.date] || 0) + (+w.minutes || 0); }); });
    Object.keys(perDay).forEach(function (d) { push(d, "watch", "watch-" + d, Math.min(POINTS.watchDailyCap, Math.floor(perDay[d] / 10) * POINTS.watchPer10Min), "Watched " + perDay[d] + " min of videos"); });
    var res = S.resolveSessions(course, idx);
    res.sessions.forEach(function (r) {
      var st = S.sessionStatus(r, idx, p);
      if (st.status === "complete") push(st.completedOn, "session", r.id, POINTS.sessionComplete, "Finished session " + r.n);
    });
    var sp = isObj(p.spaced) ? p.spaced : {};
    Object.keys(sp).forEach(function (k) { var m = /^(.+)\+(1|3|7)$/.exec(k); if (m && sp[k]) push(sp[k].doneOn, "spaced", k, POINTS.spacedRevision, "Spaced revision (+" + m[2] + " day" + (m[2] === "1" ? "" : "s") + ") of " + m[1]); });
    var ch = isObj(p.challenges) ? p.challenges : {};
    Object.keys(ch).forEach(function (id) {
      var c = ch[id] || {}, weekly = /^weekly-/.test(id);
      push(c.doneOn, "challenge", id, weekly ? POINTS.weeklyChallenge : POINTS.dailyChallenge, (weekly ? "Weekly" : "Daily") + " challenge: " + (c.title || id));
    });
    out.sort(function (a, b) { return a.date === b.date ? 0 : a.date == null ? -1 : b.date == null ? 1 : a.date < b.date ? -1 : 1; });
    return out;
  }
  function levelFor(xp) {
    var i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
    var lv = { n: i + 1, name: LEVELS[i].name, from: LEVELS[i].xp, to: i + 1 < LEVELS.length ? LEVELS[i + 1].xp : null };
    if (lv.to == null) {   // beyond the table: +1500 per level
      var extra = Math.floor((xp - LEVELS[i].xp) / 1500);
      lv = { n: i + 1 + extra, name: LEVELS[i].name + (extra ? " " + (extra + 1) : ""), from: LEVELS[i].xp + extra * 1500, to: LEVELS[i].xp + (extra + 1) * 1500 };
    }
    lv.pct = Math.max(0, Math.min(100, Math.round((xp - lv.from) * 100 / (lv.to - lv.from))));
    lv.toNext = lv.to - xp;
    return lv;
  }

  /* ---------- streak ---------- */
  // Dates with study activity: every dated ledger entry, video log, and activity log entry.
  function activeDates(course, progress, led) {
    var set = {};
    (led || ledger(course, progress)).forEach(function (e) { if (e.date) set[e.date] = true; });
    (Array.isArray(progress && progress.activity) ? progress.activity : []).forEach(function (a) { if (a && a.date && STUDY_TYPES[a.type]) set[a.date] = true; });
    return set;
  }
  /*
   * Study-day streak. Walks every date from the first study date (or the plan start)
   * to today: an active date adds 1; an UNAVAILABLE date (or a 0-minute day) is skipped
   * and never breaks the streak (same rule as carry-forward); an available date with no
   * activity breaks it, except TODAY, which is "at risk" until the day ends.
   */
  function streak(course, progress, today, active) {
    var set = S.settingsOf(course, progress), act = active || activeDates(course, progress);
    var dates = Object.keys(act).sort(), start = dates.length && dates[0] < set.startDate ? dates[0] : set.startDate;
    var cur = 0, best = 0, skipped = 0, d = start, guard = 0, history = [];
    if (today < start) return { current: 0, best: 0, todayDone: false, atRisk: false, skippedDays: 0, history: [] };
    while (d <= today && guard++ < 3000) {
      var off = !!set.unavailable[d] || S.dayBudget(d, set).off, on = !!act[d];
      if (on) { cur++; best = Math.max(best, cur); history.push({ date: d, state: "active", streak: cur }); }
      else if (off) { skipped++; history.push({ date: d, state: "off", streak: cur }); }
      else if (d === today) history.push({ date: d, state: "pending", streak: cur });
      else { cur = 0; skipped = 0; history.push({ date: d, state: "missed", streak: 0 }); }
      d = S.addDays(d, 1);
    }
    var todayOff = !!set.unavailable[today] || S.dayBudget(today, set).off;
    return { current: cur, best: best, todayDone: !!act[today], atRisk: !act[today] && !todayOff && cur > 0, todayOff: todayOff, skippedDays: skipped, history: history };
  }

  /* ---------- today's tasks ---------- */
  function sessionItems(rs) { return (rs.warmup ? [rs.warmup] : []).concat(rs.lessons, rs.dsa); }
  function tasksFor(course, progress, today, o) {
    o = o || {};
    var idx = o.idx || S.indexCourse(course), p = S.normalize(progress);
    var tp = o.todayPlan || S.todayPlan(course, p, { today: today, idx: idx });
    var e = tp.entry;
    if (!e || tp.finished) return { date: today, sessionN: null, tasks: [], done: 0, total: 0, pct: 0, xpAvailable: 0, off: false, finished: !!tp.finished };
    var n = e.n || e.carries, rs = tp.calendar.sessions[n - 1], tasks = [], base = "#day-" + n;
    if (e.unavailable) return { date: today, sessionN: n, tasks: [], done: 0, total: 0, pct: 0, xpAvailable: 0, off: true, finished: false };
    function t(id, kind, title, xp, done, href) { tasks.push({ id: id, kind: kind, title: title, xp: xp, done: !!done, href: href }); }
    if (n > 1) t("revision-" + rs.id, "revision", "Quick revision of session " + (n - 1), POINTS.revisionDone, p.revisions[rs.id], base + "/revision");
    sessionItems(rs).forEach(function (l) {
      var isDsa = rs.dsa.indexOf(l) >= 0, warm = rs.warmup === l;
      if (l.quiz && (l.quiz.questions || []).length) t("quiz-" + l.id, "quiz", "Pass the lesson check: " + l.title, POINTS.quizPass, S.quizGate(l, p).passed, "#lesson/" + l.id);
      (l.practice || []).forEach(function (pr) {
        t("practice-" + pr.id, "practice", (isDsa ? "DSA: " : "Practice: ") + pr.title.replace(/^(Practice|Problem set): /, ""), POINTS.practiceComplete + POINTS.practiceEvidenceBonus, S.practiceState(pr, p).status === "complete", base + "/practice");
        if (pr.required === false) tasks[tasks.length - 1].optional = true;   // packets and stretch work: shown, but never block "session done"
      });
      t("lesson-" + l.id, isDsa ? "dsa" : "lesson", (warm ? (/^Java foundations/.test(l.title) ? "" : "Java foundations: ") : isDsa ? "Finish DSA set: " : "Finish lesson: ") + l.title, POINTS.lessonComplete, S.lessonState(l, p) === "complete", isDsa ? base + "/practice" : "#lesson/" + l.id);
    });
    var qs = []; rs.lessons.forEach(function (l) { questionsOf(l).forEach(function (q) { qs.push(q.id); }); });
    if (qs.length) {
      var need = Math.min(3, qs.length), got = qs.filter(function (id) { return p.interview && p.interview[id]; }).length;
      t("interview-" + rs.id, "interview", "Answer " + need + " interview question" + (need === 1 ? "" : "s") + " out loud (" + Math.min(got, need) + "/" + need + ")", need * POINTS.interviewAnswer, got >= need, base + "/coach");
    }
    t("notes-" + rs.id, "notes", "Write your own key takeaways (My notes)", 0, !!String(p.notes[rs.id] || "").trim(), base + "/my-notes");
    if (rs.test) { var m = idx.moduleById[rs.test].module; t("test-" + m.id, "test", "Pass the module test: " + m.test.title, POINTS.moduleTestPass, S.testState(m, p) === "passed", base + "/test"); }
    // Counts cover the core session only. Optional items (topic packets, stretch work) are listed separately
    // so finishing tonight's session ends the day: the ring completes and reminders stop.
    var core = tasks.filter(function (x) { return !x.optional; }), opt = tasks.filter(function (x) { return x.optional; });
    var done = core.filter(function (x) { return x.done; }).length;
    return { date: today, sessionN: n, tasks: core, optional: opt, optionalDone: opt.filter(function (x) { return x.done; }).length,
      done: done, total: core.length, pct: core.length ? Math.round(done * 100 / core.length) : 0,
      xpAvailable: core.reduce(function (a, x) { return a + (x.done ? 0 : x.xp); }, 0), off: false, finished: false, allDone: done === core.length };
  }

  /* ---------- spaced revision (+1 / +3 / +7 days) ---------- */
  function spacedKey(sessionId, step) { return sessionId + "+" + step; }
  /*
   * Every finished session is due for a short review 1, 3 and 7 days after its completion date.
   * The +1 review also counts as done when the next session's quick-revision block was ticked on
   * or after the due date (that block revises the previous session). Returns
   * { due: [...oldest first], upcoming: [...next 7 days], done: n } with items
   * { id, sessionId, n, step, dueOn, overdueDays, title, prompt, href, done }.
   */
  function spacedRevisions(course, progress, today, o) {
    o = o || {};
    var idx = o.idx || S.indexCourse(course), p = S.normalize(progress), res = S.resolveSessions(course, idx);
    var sp = isObj(p.spaced) ? p.spaced : {}, due = [], upcoming = [], doneCount = 0;
    res.sessions.forEach(function (r, i) {
      var st = S.sessionStatus(r, idx, p);
      if (st.status !== "complete" || !st.completedOn) return;
      var main = r.lessons[0], qs = main ? questionsOf(main) : [], next = res.sessions[i + 1];
      SPACED_STEPS.forEach(function (step) {
        var key = spacedKey(r.id, step), dueOn = S.addDays(st.completedOn, step);
        var quick = step === 1 && next && p.revisions[next.id] && (!p.revisions[next.id].doneOn || p.revisions[next.id].doneOn >= dueOn);
        var q = qs.length ? qs[SPACED_STEPS.indexOf(step) % qs.length] : null;   // a different recall question at each step
        var item = { id: key, sessionId: r.id, n: r.n, step: step, dueOn: dueOn, overdueDays: Math.max(0, S.diffDays(dueOn, today)),
          title: main ? main.title : "Session " + r.n, prompt: q ? (q.prompt || q.q || "") : "", href: main ? "#lesson/" + main.id : "#day-" + r.n,
          done: !!sp[key] || !!quick, doneOn: sp[key] ? sp[key].doneOn : quick ? p.revisions[next.id].doneOn : null };
        if (item.done) { doneCount++; return; }
        if (dueOn <= today) due.push(item);
        else if (S.diffDays(today, dueOn) <= 7) upcoming.push(item);
      });
    });
    function byDue(a, b) { return a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : a.n - b.n; }
    return { date: today, due: due.sort(byDue), upcoming: upcoming.sort(byDue), done: doneCount, steps: SPACED_STEPS.slice() };
  }

  /* ---------- challenges ---------- */
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function shortDate(d) { return (+d.slice(8)) + " " + MON[+d.slice(5, 7) - 1]; }
  function mondayOf(d) { return S.addDays(d, -((S.weekday(d) + 6) % 7)); }
  function dailyChallenge(course, progress, today, o) {
    o = o || {};
    var idx = o.idx || S.indexCourse(course), p = S.normalize(progress), tk = o.tasks || tasksFor(course, p, today, { idx: idx });
    var id = "daily-" + today, claimed = isObj(p.challenges) && p.challenges[id];
    if (!tk.sessionN || tk.off) return null;
    var rs = S.resolveSessions(course, idx).sessions[tk.sessionN - 1], main = rs.lessons[0], cands = [];
    if (main && main.quiz) {
      var q = p.quizzes[main.id] || {};
      cands.push({ kind: "perfect-check", title: "Sharp shooter", text: "Score 100% on the lesson check for “" + main.title + "” in one attempt.",
        target: 1, value: q.best === 100 && (q.attempts || 0) <= 1 ? 1 : 0, href: "#lesson/" + main.id, failed: (q.attempts || 0) >= 1 && !(q.best === 100 && q.attempts === 1) });
    }
    var qs = []; rs.lessons.concat(rs.dsa).forEach(function (l) { questionsOf(l).forEach(function (x) { qs.push(x.id); }); });
    if (qs.length) {
      var answeredToday = qs.filter(function (x) { return p.interview && p.interview[x] && p.interview[x].answeredOn === today; }).length;
      cands.push({ kind: "interview-sprint", title: "Interview sprint", text: "Answer every interview question of tonight’s session out loud and mark it answered today.", target: qs.length, value: answeredToday, href: "#day-" + rs.n + "/coach" });
    }
    var lines = String(p.notes[rs.id] || "").split(/\n+/).filter(function (x) { return x.trim(); }).length;
    cands.push({ kind: "teach-back", title: "Teach it back", text: "Write at least 3 lines of key takeaways in your own words for session " + rs.n + ".", target: 3, value: Math.min(3, lines), href: "#day-" + rs.n + "/my-notes" });
    var dsaPr = []; rs.dsa.forEach(function (l) { (l.practice || []).forEach(function (pr) { dsaPr.push(pr); }); });
    if (dsaPr.length) cands.push({ kind: "dsa-proof", title: "Show your code", text: "Finish tonight’s DSA set with a submission link as evidence.", target: dsaPr.length,
      value: dsaPr.filter(function (pr) { var r = p.practice[pr.id]; return r && r.status === "complete" && String(r.evidence || "").trim(); }).length, href: "#day-" + rs.n + "/practice" });
    var c = claimed && claimed.kind ? (cands.find(function (x) { return x.kind === claimed.kind; }) || cands[0]) : cands[hash(today) % cands.length];
    return Object.assign({ id: id, period: "daily", date: today, xp: POINTS.dailyChallenge, claimed: !!claimed, claimedOn: claimed ? claimed.doneOn : null,
      met: c.value >= c.target, pct: Math.round(Math.min(c.value, c.target) * 100 / c.target) }, c);
  }
  function weeklyChallenge(course, progress, today, o) {
    o = o || {};
    var p = S.normalize(progress), set = S.settingsOf(course, p), mon = mondayOf(today), sun = S.addDays(mon, 6);
    var id = "weekly-" + mon, claimed = isObj(p.challenges) && p.challenges[id];
    var led = o.ledger || ledger(course, p), act = o.active || activeDates(course, p, led);
    var avail = 0, activeDays = 0;
    for (var d = mon; d <= sun; d = S.addDays(d, 1)) {
      var off = !!set.unavailable[d] || S.dayBudget(d, set).off || d < set.startDate;   // days before the plan starts don't count
      if (!off) avail++;
      if (act[d]) activeDays++;
    }
    var weekXp = led.filter(function (e) { return e.date && e.date >= mon && e.date <= sun && e.kind !== "challenge"; }).reduce(function (a, e) { return a + e.xp; }, 0);
    // Alternate by week; a partial first week (plan starts mid-week) is always "show up".
    var c = (mon < set.startDate || Math.floor(S.diffDays("2026-01-05", mon) / 7) % 2 === 0)
      ? { kind: "show-up", title: "Show up every study day", text: "Study on all " + avail + " available days this week (" + shortDate(mon) + "–" + shortDate(sun) + "). Days marked unavailable don’t count against you.", target: Math.max(1, avail), value: activeDays }
      : { kind: "xp-600", title: "600 XP week", text: "Earn 600 XP from lessons, checks, practice and revision this week (" + shortDate(mon) + "–" + shortDate(sun) + ").", target: 600, value: weekXp };
    return Object.assign({ id: id, period: "weekly", weekStart: mon, weekEnd: sun, xp: POINTS.weeklyChallenge, claimed: !!claimed, claimedOn: claimed ? claimed.doneOn : null,
      met: c.value >= c.target, pct: Math.round(Math.min(c.value, c.target) * 100 / c.target), weekXp: weekXp, activeDays: activeDays, availableDays: avail }, c);
  }

  /* ---------- badges ---------- */
  function badges(course, progress, o) {
    var idx = o.idx, p = S.normalize(progress), st = o.streak, led = o.ledger;
    var lessonsDone = Object.keys(p.lessons).filter(function (id) { return p.lessons[id].status === "complete" && idx.lessonById[id]; });
    var dsaDone = lessonsDone.filter(function (id) { return idx.lessonById[id].subject.dsa; }).length;
    var perfect = Object.keys(p.quizzes).filter(function (id) { var q = p.quizzes[id]; return (q.best != null ? q.best : q.score) === 100; }).length;
    var tests = Object.keys(p.tests).filter(function (id) { return p.tests[id].passed; }).length;
    var answers = isObj(p.interview) ? Object.keys(p.interview).length : 0;
    var chall = isObj(p.challenges) ? Object.keys(p.challenges).length : 0;
    // The one-lesson Day 1 warm-up track is not a subject you "clear".
    var subj = idx.subjects.filter(function (s) { return !(s.modules || []).every(function (m) { return (m.lessons || []).every(function (l) { return l.warmup; }); }) && S.subjectProgress(s, p).status === "complete"; }).length;
    var res = S.resolveSessions(course, idx), sessionsDone = res.sessions.filter(function (r) { return S.sessionStatus(r, idx, p).status === "complete"; }).length;
    var hasTests = idx.subjects.some(function (s) { return (s.modules || []).some(function (m) { return !!m.test; }); });
    var spacedDone = isObj(p.spaced) ? Object.keys(p.spaced).length : 0;
    var defs = [
      ["first-step", "First step", "Complete your first lesson", lessonsDone.length, 1],
      ["streak-3", "Warming up", "3-day study streak", st.best, 3],
      ["streak-7", "One full week", "7-day study streak", st.best, 7],
      ["streak-14", "Habit formed", "14-day study streak", st.best, 14],
      ["streak-30", "Unstoppable", "30-day study streak", st.best, 30],
      ["dsa-10", "Problem crusher", "Finish 10 DSA sets", dsaDone, 10],
      ["perfect-10", "Sharp shooter", "Score 100% on 10 lesson checks", perfect, 10],
      hasTests ? ["module-1", "Module master", "Pass your first module test", tests, 1] : null,
      ["sessions-7", "First week done", "Finish 7 sessions", sessionsDone, 7],
      ["sessions-half", "Halfway there", "Finish " + Math.ceil(res.count / 2) + " sessions", sessionsDone, Math.ceil(res.count / 2)],
      ["sessions-all", "Course complete", "Finish all " + res.count + " sessions", sessionsDone, res.count],
      ["spaced-10", "Memory keeper", "Do 10 spaced revisions (+1, +3, +7 days)", spacedDone, 10],
      ["interview-25", "Interview ready", "Answer 25 interview questions", answers, 25],
      ["challenge-5", "Challenger", "Claim 5 challenges", chall, 5],
      ["subject-1", "Subject cleared", "Finish every lesson and test of one subject", subj, 1],
      ["xp-1000", "Four digits", "Earn 1,000 XP", led.reduce(function (a, e) { return a + e.xp; }, 0), 1000]
    ];
    return defs.filter(Boolean).map(function (d) { return { id: d[0], title: d[1], text: d[2], value: Math.min(d[3], d[4]), target: d[4], earned: d[3] >= d[4] }; });
  }

  /* ---------- the whole engagement view-model ---------- */
  function derive(course, progress, today, o) {
    o = o || {};
    var idx = S.indexCourse(course), p = S.normalize(progress);
    today = today || S.studyDayIST();
    var led = ledger(course, p, idx), act = activeDates(course, p, led), xp = led.reduce(function (a, e) { return a + e.xp; }, 0);
    var st = streak(course, p, today, act), tk = tasksFor(course, p, today, { idx: idx });
    var todayXp = led.filter(function (e) { return e.date === today; }).reduce(function (a, e) { return a + e.xp; }, 0);
    var log = (Array.isArray(p.activity) ? p.activity : []).slice().reverse();
    var prefs = notificationPrefs(p), last = p.lastActiveAt || (log.find(function (a) { return STUDY_TYPES[a.type]; }) || {}).at || null;
    return {
      contractVersion: CONTRACT_VERSION, source: "derived", example: false, today: today,
      xp: xp, todayXp: todayXp, level: levelFor(xp), streak: st, tasks: tk,
      challenges: [dailyChallenge(course, p, today, { idx: idx, tasks: tk }), weeklyChallenge(course, p, today, { ledger: led, active: act })].filter(Boolean),
      badges: badges(course, p, { idx: idx, streak: st, ledger: led }),
      revisions: spacedRevisions(course, p, today, { idx: idx }),
      ledger: led.slice().reverse(), activity: log, lastActiveAt: last,
      notifications: prefs, nextNudge: nextNudge(prefs, last, o.now, { todayDone: !!tk.allDone && tk.total > 0 })
    };
  }

  // Append one timestamped activity entry after a successful change (host calls this; the reducer stays pure).
  function recordActivity(course, before, after, change, at) {
    var p = S.normalize(after), ts = at || change.at || new Date().toISOString(), ms = Date.parse(ts);
    if (isNaN(ms)) return p;
    var xpDelta = ledger(course, p).reduce(function (a, e) { return a + e.xp; }, 0) - ledger(course, before).reduce(function (a, e) { return a + e.xp; }, 0);
    var entry = { at: new Date(ms).toISOString(), date: change.date || S.studyDayIST(ms), type: change.type, id: change.id || change.key || change.targetDate || (change.weekday != null ? "weekday-" + change.weekday : null), xp: xpDelta };
    if (change.status) entry.status = change.status;
    var log = Array.isArray(p.activity) ? p.activity.slice() : [];
    log.push(entry); if (log.length > ACTIVITY_CAP) log = log.slice(log.length - ACTIVITY_CAP);
    p.activity = log;
    if (STUDY_TYPES[change.type]) p.lastActiveAt = entry.at;
    return p;
  }

  /*
   * The reducer hosts should call: schedule-engine applyChange() plus the engagement rules,
   * then recordActivity(). change.at (ISO timestamp, the UI stamps it) is used for the log.
   *   challenge {id: "daily-YYYY-MM-DD" | "weekly-YYYY-MM-DD"}  refused unless it is today's / this week's
   *                                                             challenge and its goal is met
   *   prefs     {notifications: {...}}                          refused when validateNotificationPrefs() complains
   */
  function applyChange(course, progress, change, at) {
    var p = S.normalize(progress), date = change.date || S.studyDayIST();
    function fail(reason) { return { progress: p, ok: false, reason: reason }; }
    if (change.type === "challenge" && change.done !== false) {
      var c = /^weekly-/.test(change.id || "") ? weeklyChallenge(course, p, date) : dailyChallenge(course, p, date);
      if (!c || c.id !== change.id) return fail("That challenge is not open today");
      if (c.claimed) return fail("Already claimed");
      if (!c.met) return fail("Not yet: " + c.text + " (" + Math.min(c.value, c.target) + "/" + c.target + ")");
      change = Object.assign({}, change, { kind: c.kind, title: c.title });
    }
    if (change.type === "spaced" && change.done !== false) {
      var sr = spacedRevisions(course, p, date), it = sr.due.find(function (x) { return x.id === change.id; });
      if (!it) return fail(/^.+\+(1|3|7)$/.test(change.id || "") ? "That revision is not due yet" : "Unknown spaced revision " + change.id);
    }
    if (change.type === "prefs") {
      var merged = Object.assign({}, notificationPrefs(p), change.notifications || {});
      var bad = validateNotificationPrefs(merged);
      if (bad.length) return fail(bad.join("; "));
      change = Object.assign({}, change, { notifications: merged });
    }
    var r = S.applyChange(course, p, change);
    if (!r.ok) return r;
    r.progress = recordActivity(course, p, r.progress, change, at);
    return r;
  }

  // Merge a host-supplied engagement object over the derived one (host wins, field by field).
  function merge(derived, host) {
    if (!isObj(host)) return derived;
    var out = Object.assign({}, derived);
    Object.keys(host).forEach(function (k) { if (host[k] !== undefined) out[k] = host[k]; });
    if (isObj(host.xp) || typeof host.xp === "number") { if (!isObj(host.level)) out.level = levelFor(+host.xp || 0); }
    if (isObj(host.streak)) out.streak = Object.assign({}, derived.streak, host.streak);
    if (isObj(host.notifications)) out.notifications = Object.assign({}, derived.notifications, host.notifications);
    out.source = host.source || (host.example ? "example" : "host");
    return out;
  }

  return {
    CONTRACT_VERSION: CONTRACT_VERSION, POINTS: POINTS, LEVELS: LEVELS, NOTIFY_DEFAULTS: NOTIFY_DEFAULTS, STUDY_TYPES: STUDY_TYPES,
    notificationPrefs: notificationPrefs, validateNotificationPrefs: validateNotificationPrefs, nextNudge: nextNudge, istLabel: istLabel,
    ledger: ledger, levelFor: levelFor, activeDates: activeDates, streak: streak, tasksFor: tasksFor,
    dailyChallenge: dailyChallenge, weeklyChallenge: weeklyChallenge, badges: badges, spacedRevisions: spacedRevisions, SPACED_STEPS: SPACED_STEPS, derive: derive, recordActivity: recordActivity, applyChange: applyChange, merge: merge, questionsOf: questionsOf
  };
});
