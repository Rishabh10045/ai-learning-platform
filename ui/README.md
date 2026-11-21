# Study Desk: presentation layer + schedule engine (`ui/`)

Subject-first Study Desk (v2). The UI renders a course and a progress object that the
host gives it. It never fetches, stores or publishes anything. Codex owns
`curriculum.js`, `lesson-content.js`, `lesson-videos.js`, `progress.js` and `app.js`
(persistence and account sync); this folder never edits them.

Everything in `ui/fixtures/` is **example data**. `course.fixture.js` is not the real
54-session curriculum; it is a 42-session stand-in with the agreed shape and order (Java core → Streams & APIs →
Concurrency → SQL & JDBC → Spring Boot → LLD → HLD → GenAI, one main lesson + one DSA per session).

## Files

| File | Purpose |
| --- | --- |
| `engine/schedule-engine.js` | `window.StudyDeskSchedule` / Node module. Pure functions: session resolution, weekend/weekday budgets, calendar with carry-forward, lesson/practice/test states, quiz gates, `applyChange` reducer, `migrateProgress` |
| `study-desk.js` | `window.StudyDesk.mount()` (needs the engine loaded first) |
| `study-desk.css` | Styles scoped under `.sd-root`; light + dark; responsive |
| `index.html` | Demo host: fixture + preview-only localStorage (`?today=YYYY-MM-DD`, `?migrate=1`, `?store=0`) |
| `coverage.html`, `coverage.js` | Do all sessions resolve? Is every lesson scheduled? Do sessions fit their slots (warnings)? Which reference topics are missing (red)? GfG vs `source: added` counts |
| `reference/topics.reference.js` | `window.STUDY_DESK_REFERENCE`: interview **checklist** (12 subjects, 124 topics) the coverage page measures a course against. Not curriculum content |
| `fixtures/course.fixture.js` | Example Subject → Module → Lesson course + sessions + `legacyMap` |
| `fixtures/legacy-progress.fixture.js` | Example progress in the old day-based (v1) shape, for migration |
| `checks/engine.test.mjs`, `checks/coverage.test.mjs` | `node --test ui/checks/engine.test.mjs ui/checks/coverage.test.mjs` (includes QA 2026-11-21 regressions) |
| `checks/run-checks.mjs` | Headless Chrome: desktop 1366×900, mobile 390×844 and 320×640, keyboard, flows, QA regressions, axe colour contrast (needs `puppeteer-core` and `axe-core` on `NODE_PATH`) |

## Course contract v2

```js
course = {
  title, subtitle,
  schedule: {
    startDate: "2026-11-22",                 // Day 1 (Sunday)
    sessionStart: "21:00",                   // core starts 9:00 PM IST
    dayCutoff: "04:00",                      // before 04:00 IST still counts as the previous study day
    minMinutes: 30, maxMinutes: 960,         // a day is 0 (day off) or 30–960 minutes
    core: { revision: 12, lesson: 78, dsa: 30 },
    dailyMinutes: { 0: 390, 1: 120, 2: 120, 3: 120, 4: 120, 5: 120, 6: 390 }, // 0 = Sunday, 6 = Saturday
    day1WarmupLessonId: "JC-01",             // Day 1 uses the revision slot for Java foundations
    testPassPct: 70
  },
  subjects: [{                               // in learning order; DSA subject has dsa: true
    id, title, short, color, dsa?, daily?,
    modules: [{ id, title,
      lessons: [{
        id: "JC-03",                         // STABLE: progress is keyed by this
        title, estMinutes,
        source: { kind: "gfg", course: "…", ref: "Module 2" } | { kind: "added", note },
        videos: [{ id, title, source, channel, url, durationMin, suggestedWatchMin, segment, kind }],
        diagram: { title, nodes: ["A", "B", "C"] },          // optional, rendered as a flow
        notes: [{ type: "h"|"p"|"ul"|"ol"|"code"|"callout", text|items, tone }],
        revision: ["…"],
        practice: [{ id, title, platform, difficulty, minutes, prompt, acceptance: [], url, evidenceRequired }],
        quiz: { passPct, questions: [{ id, q, options: [], answer: index }] },   // lesson check = gate
        coach: [{ id, prompt }]
      }],
      test: { title, passPct, questions: [...] }             // optional module test
    }]
  }],
  sessions: [{ id: "S01", subject: "java-core", lessons: ["JC-02", "JC-03"], dsa: ["DSA-01"], test?: "jc-basics", warmup?: "JC-01" }],
  legacyMap: { blocks: { oldBlockId: lessonId }, practice: { oldId: newPracticeId }, days: { "1": "S01" } }
};
```

The number of sessions is always `sessions.length`. `resolveSessions()` reports unknown
lesson IDs, a lesson under the wrong subject, a session without DSA, unknown tests,
duplicate IDs, missing `source`, a main subject going backwards in the learning order,
lessons that no session schedules, and a module test placed before its lessons
(errors). `warnings` lists lessons scheduled twice and sessions whose lesson + practice,
DSA or warm-up exceed the `core` slots.

## Progress v2 (host stores it; `applyChange` produces it)

```js
{ schemaVersion: 2,
  lessons:  { "JC-03": { status: "in-progress"|"complete", completedOn: "2026-11-22" } },
  practice: { "JC-03-p1": { status, evidence: "link or summary", completedOn } },
  quizzes:  { "JC-03": { score, best, passed, passedOn, takenOn, attempts } },   // a pass is kept on a failed retake
  tests:    { "jc-basics": { score, passed, takenOn, attempts } },
  watch:    { "JC-03-v1": { minutes, log: [{ date, minutes }] } },
  notes:    { "S01": "my notes" },
  revisions:{ "S02": { done: true, on: "2026-11-23" } },                  // old notes["rev-S02"] migrate here
  schedule: { unavailable: { "2026-11-24": true }, dateMinutes: { "2026-11-25": 90 }, dailyMinutes: { 3: 180 } },
  legacy?:  { … unmapped v1 entries kept as-is … } }
```

`mount(el, { course, progress, today, sync, onChange, onCoachAsk, headerLinks })`.
Every action calls `onChange(change)`; change shapes are documented above
`applyChange` in the engine. Return `{ ok:false, reason }` to show the learner why it
was refused. `sync = { state: "local"|"signed-in"|"syncing"|"error", label }` drives
the top-bar pill; with `state: "error"` and a `detail`, an alert is shown in the page.
A `minutes` change is `{ type:"minutes", weekday, minutes }` for a weekday default or
`{ type:"minutes", targetDate, minutes }` for one date. `validateProgress(raw)` returns
problems with stored progress (hosts should back it up, not wipe it); `normalize()` never
throws. `studyDayIST(nowMs, "04:00")` gives the study date; hosts should re-evaluate it
periodically and on focus. The real account sync stays in Codex's progress.js.

## Rules the engine implements

- Today = one main subject + DSA. Day 2 on: 12 min revision → 78 min lesson → 30 min DSA (9:00–11:00 PM IST).
- The study date is the IST date with a 04:00 cutoff, so finishing at 00:30 counts for the evening before.
- A 0-minute day is a day off: the session carries to the next date.
- Day 1 (Sun 22 Nov 2026): revision slot = Java foundations; 6h 30m = 2h core + 4h 30m stretch practice (weekend long day).
- Saturday and Sunday are weekend long days: 6h 30m = 2h core (12 + 78 + 30) + 4h 30m stretch practice. Monday–Friday default to 2h; per-weekday defaults and per-date minutes are adjustable. A day under 2h scales the core and is flagged.
- Unavailable or missed date: the same unfinished session moves to the next available date (study days ≠ calendar days). Today and later dates are projected to finish their session.
- A session completes when its lessons, DSA lesson and module test (if any) are done; the next date then gets the next session.
- A lesson completes only after its lesson check passes and required practice has evidence. Reopening practice reopens the lesson.
- A module test is locked until every lesson in the module is complete (reopening a lesson relocks it).
- A passed lesson check stays passed when a retake fails (best and last scores are shown).
- `migrateProgress(course, v1, legacyMap)` maps day/block/practice/notes progress to stable IDs; unmapped entries go to `progress.legacy`; v2 input is returned unchanged.

## Routes

`#today` (default), `#course`, `#calendar`, `#day-N` (session plan), `#day-N/learn`,
`/practice`, `/revision`, `/my-notes`, `/coach`, `/test` (sessions with a module test),
`#lesson/<ID>` (redirects to that lesson's session, Videos & notes).

## Checks

```
node --test ui/checks/engine.test.mjs ui/checks/coverage.test.mjs
NODE_PATH=<dir with puppeteer-core>/node_modules node ui/checks/run-checks.mjs <outDir>
```
