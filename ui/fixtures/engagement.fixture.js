/*
 * EXAMPLE DATA ONLY (ui/index.html?engagement=example). Builds a made-up progress
 * history so the engagement UI can be previewed with numbers in it:
 *   Sun 22 – Tue 24 Nov: sessions 1–3 done; Wed 25 Nov marked unavailable (streak kept);
 *   Thu 26 Nov: session 4 done; Fri 27 Nov ("today"): quiz + practice done, lesson still open.
 * Every change goes through the real reducer (StudyDeskEngagement.applyChange) with
 * made-up timestamps, so XP, streak, tasks and the activity log are derived, not typed in.
 * The host labels everything built from this as "Example data".
 */
(function (root) {
  "use strict";
  var F = root.STUDY_DESK_FIXTURES = root.STUDY_DESK_FIXTURES || {};
  F.engagementExample = {
    today: "2026-11-27",
    build: function (S, E, course) {
      var idx = S.indexCourse(course), res = S.resolveSessions(course, idx), p = S.emptyProgress(), clock = {};
      function at(date) { clock[date] = (clock[date] || 0) + 1; var m = 21 * 60 + 4 + clock[date] * 7; return date + "T" + String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0") + ":00+05:30"; }
      function ap(change) { var r = E.applyChange(course, p, change, new Date(Date.parse(at(change.date))).toISOString()); if (r.ok) p = r.progress; return r.ok; }
      function finish(l, date, opts) {
        opts = opts || {};
        if (l.quiz) { var a = {}; l.quiz.questions.forEach(function (q) { a[q.id] = q.answer; }); ap({ type: "quiz", id: l.id, answers: a, date: date }); }
        (l.practice || []).forEach(function (pr) { ap({ type: "practice", id: pr.id, status: "complete", evidence: "https://github.com/example/" + pr.id, date: date }); });
        if (!opts.open) ap({ type: "lesson", id: l.id, status: "complete", date: date });
      }
      var dates = ["2026-11-22", "2026-11-23", "2026-11-24", "2026-11-26"];
      ap({ type: "unavailable", date: "2026-11-25", value: true });
      res.sessions.slice(0, 4).forEach(function (r, i) {
        var d = dates[i];
        if (r.n > 1) ap({ type: "revision", id: r.id, done: true, date: d });
        (r.warmup ? [r.warmup] : []).concat(r.lessons, r.dsa).forEach(function (l) { finish(l, d); });
        r.lessons.forEach(function (l) { ((l.interview && l.interview.length ? l.interview : l.coach) || []).forEach(function (q) { ap({ type: "interview", id: q.id, lessonId: l.id, date: d }); }); });
        ap({ type: "note", key: r.id, text: "Example takeaway 1 for session " + r.n + "\nExample takeaway 2\nExample takeaway 3", date: d });
        ap({ type: "challenge", id: "daily-" + d, date: d });
        if (r.test) { var a = {}; idx.moduleById[r.test].module.test.questions.forEach(function (q) { a[q.id] = q.answer; }); ap({ type: "test", id: r.test, answers: a, date: d }); }
      });
      var r5 = res.sessions[4], t = "2026-11-27";
      ap({ type: "revision", id: r5.id, done: true, date: t });
      finish(r5.lessons[0], t, { open: true });
      ap({ type: "prefs", notifications: { email: true, address: "deepak@example.com", intervalHours: 2.5, quietStart: "00:00", quietEnd: "06:00", maxPerDay: 6 }, date: t });
      return p;
    }
  };
})(typeof window !== "undefined" ? window : this);
