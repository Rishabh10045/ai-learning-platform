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
| `engine/engagement-engine.js` | `window.StudyDeskEngagement` / Node module. XP ledger, levels, study-day streak, today's tasks, daily/weekly challenges, badges, activity log, reminder prefs + `nextNudge`, and `applyChange` (schedule reducer + engagement checks + activity log). Contract: [`collab/engagement-contract.md`](../collab/engagement-contract.md) |
| `study-desk.js` | `window.StudyDesk.mount()` (needs the engine loaded first; the engagement engine is optional) |
| `study-desk.css` | Styles scoped under `.sd-root`; light + dark; responsive |
| `index.html` | Demo host: fixture + preview-only localStorage (`?today=YYYY-MM-DD`, `?migrate=1`, `?store=0`, `?engagement=example` made-up history labelled Example data, `?engagement=off`) |
| `coverage.html`, `coverage.js` | Do all sessions resolve? Is every lesson scheduled? Do sessions fit their slots (warnings)? Which reference topics are missing (red)? GfG vs `source: added` counts |
| `reference/topics.reference.js` | `window.STUDY_DESK_REFERENCE`: interview **checklist** (12 subjects, 124 topics) the coverage page measures a course against. Not curriculum content |
| `fixtures/course.fixture.js` | Example Subject → Module → Lesson course + sessions + `legacyMap` |
| `fixtures/legacy-progress.fixture.js` | Example progress in the old day-based (v1) shape, for migration |
| `fixtures/engagement.fixture.js` | **Example data**: builds a made-up 22–27 Nov history through the real reducer for `?engagement=example` |
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
  // engagement (collab/engagement-contract.md), all optional:
  interview:  { "JC-03-c1": { lessonId: "JC-03", answeredOn } },
  challenges: { "daily-2026-11-27": { doneOn, kind, title } },
  prefs:      { notifications: { email, address, intervalHours, quietStart, quietEnd, timezone, maxPerDay } },
  activity:   [ { at: ISO, date, type, id, xp, status? } ],   // oldest first, max 1000
  lastActiveAt: ISO,
  legacy?:  { … unmapped v1 entries kept as-is … } }
```

`mount(el, { course, progress, today, sync, onChange, onCoachAsk, headerLinks, engagement })`.
Every action calls `onChange(change)`; change shapes are documented above
`applyChange` in the engine. Return `{ ok:false, reason }` to show the learner why it
was refused. `sync = { state: "local"|"signed-in"|"syncing"|"error", label }` drives
the top-bar pill; with `state: "error"` and a `detail`, an alert is shown in the page.
A `minutes` change is `{ type:"minutes", weekday, minutes }` for a weekday default or
`{ type:"minutes", targetDate, minutes }` for one date. `validateProgress(raw)` returns
problems with stored progress (hosts should back it up, not wipe it); `normalize()` never
throws. `studyDayIST(nowMs, "04:00")` gives the study date; hosts should re-evaluate it
periodically and on focus. The real account sync stays in Codex's progress.js.

### Engagement (scoring, tasks, streaks)

Load `engine/engagement-engine.js` after the schedule engine and reduce with
`StudyDeskEngagement.applyChange(course, progress, change, change.at)`: schedule rules +
challenge/prefs checks + a timestamped activity entry. The UI then shows, all derived from
progress: an XP / level / streak header and **Today's tasks** (progress ring) plus daily and
weekly **challenges** on Today; `#activity` (streak calendar, badges, points history,
activity log with IST times, the points table); `#settings` (email reminder preferences,
saved with progress; **email sending is not wired yet**, and the page says so). Coach questions
get a "Mark answered out loud · +5 XP" toggle. `engagement` in mount/update overrides the
derived numbers (`{ example:true }` labels everything "Example data"; `false` hides the
engagement UI). Points: lesson 50 · check 20 (+10 for 100%) · practice 25 (+10 with evidence) ·
revision 15 · interview answer 5 · module test 100 (+25 for ≥90%) · session finished 40 · videos
1/10 min (max 12/day) · daily challenge 30 · weekly challenge 150. Streaks count study days:
unavailable / 0-minute dates never break them. Full rules: `collab/engagement-contract.md`.

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
`#lesson/<ID>` (redirects to that lesson's session, Videos & notes), `#activity`
(XP, streak, badges, points history, activity log) and `#settings` (reminder preferences),
the last two only while the engagement UI is on.

## Checks

```
node --test ui/checks/engine.test.mjs ui/checks/coverage.test.mjs
NODE_PATH=<dir with puppeteer-core>/node_modules node ui/checks/run-checks.mjs <outDir>
```
