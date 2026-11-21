# Study Desk: presentation layer + schedule engine (`ui/`)

Subject-first Study Desk (v2). The UI renders a course and a progress object that the
host gives it. It never fetches, stores or publishes anything. Codex owns
`curriculum.js`, `lesson-content.js`, `lesson-videos.js`, `progress.js` and `app.js`
(persistence and account sync); this folder never edits them.

Everything in `ui/fixtures/` is **example data**. `course.fixture.js` is not the real
54-session curriculum; it is a 20-session stand-in with the agreed shape and order.

## Files

| File | Purpose |
| --- | --- |
| `engine/schedule-engine.js` | `window.StudyDeskSchedule` / Node module. Pure functions: session resolution, weekend/weekday budgets, calendar with carry-forward, lesson/practice/test states, quiz gates, `applyChange` reducer, `migrateProgress` |
| `study-desk.js` | `window.StudyDesk.mount()` (needs the engine loaded first) |
| `study-desk.css` | Styles scoped under `.sd-root`; light + dark; responsive |
| `index.html` | Demo host: fixture + preview-only localStorage (`?today=YYYY-MM-DD`, `?migrate=1`, `?store=0`) |
| `coverage.html`, `coverage.js` | Do all sessions resolve? Is every lesson scheduled? GfG vs `source: added` counts |
| `fixtures/course.fixture.js` | Example Subject → Module → Lesson course + sessions + `legacyMap` |
| `fixtures/legacy-progress.fixture.js` | Example progress in the old day-based (v1) shape, for migration |
| `checks/engine.test.mjs` | `node --test ui/checks/engine.test.mjs` |
| `checks/run-checks.mjs` | Headless Chrome: desktop 1366×900, mobile 390×844, keyboard, flows |

## Course contract v2

```js
course = {
  title, subtitle,
  schedule: {
    startDate: "2026-11-22",                 // Day 1 (Sunday)
    sessionStart: "21:00",                   // core starts 9:00 PM IST
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
and lessons that no session schedules.

## Progress v2 (host stores it; `applyChange` produces it)

```js
{ schemaVersion: 2,
  lessons:  { "JC-03": { status: "in-progress"|"complete", completedOn: "2026-11-22" } },
  practice: { "JC-03-p1": { status, evidence: "link or summary", completedOn } },
  quizzes:  { "JC-03": { score, passed, takenOn, attempts } },
  tests:    { "jc-basics": { score, passed, takenOn, attempts } },
  watch:    { "JC-03-v1": { minutes, log: [{ date, minutes }] } },
  notes:    { "S01": "my notes", "rev-S02": "done" },
  schedule: { unavailable: { "2026-11-24": true }, dateMinutes: { "2026-11-25": 90 }, dailyMinutes: { 3: 180 } },
  legacy?:  { … unmapped v1 entries kept as-is … } }
```

`mount(el, { course, progress, today, sync, onChange, onCoachAsk, headerLinks })`.
Every action calls `onChange(change)`; change shapes are documented above
`applyChange` in the engine. Return `{ ok:false, reason }` to show the learner why it
was refused. `sync = { state: "local"|"signed-in"|"syncing"|"error", label }` drives
the top-bar pill; the real account sync stays in Codex's progress.js.

## Rules the engine implements

- Today = one main subject + DSA. Day 2 on: 12 min revision → 78 min lesson → 30 min DSA (9:00–11:00 PM IST).
- Day 1 (Sun 22 Nov 2026): revision slot = Java foundations; 6h 30m = 2h core + 4h 30m stretch practice (weekend long day).
- Saturday and Sunday are weekend long days: 6h 30m = 2h core (12 + 78 + 30) + 4h 30m stretch practice. Monday–Friday default to 2h; per-weekday defaults and per-date minutes are adjustable. A day under 2h scales the core and is flagged.
- Unavailable or missed date: the same unfinished session moves to the next available date (study days ≠ calendar days). Today and later dates are projected to finish their session.
- A session completes when its lessons, DSA lesson and module test (if any) are done; the next date then gets the next session.
- A lesson completes only after its lesson check passes and required practice has evidence. Reopening practice reopens the lesson.
- A module test is locked until every lesson in the module is complete.
- `migrateProgress(course, v1, legacyMap)` maps day/block/practice/notes progress to stable IDs; unmapped entries go to `progress.legacy`; v2 input is returned unchanged.

## Routes

`#today` (default), `#course`, `#calendar`, `#day-N` (session plan), `#day-N/learn`,
`/practice`, `/revision`, `/my-notes`, `/coach`, `/test` (sessions with a module test),
`#lesson/<ID>` (redirects to that lesson's session, Videos & notes).

## Checks

```
node --test ui/checks/engine.test.mjs
NODE_PATH=<dir with puppeteer-core>/node_modules node ui/checks/run-checks.mjs <outDir>
```
