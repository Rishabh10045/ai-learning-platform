# Study Desk: presentation layer (`ui/`)

UI-only layer for the Study Desk. It renders whatever lesson, video and progress
data the host gives it. It **does not** fetch, persist, schedule or publish
anything. Codex owns `curriculum.js`, `lesson-content.js`, `lesson-videos.js`,
`progress.js` and `app.js`; this folder never edits them.

Preview with example data: open `ui/index.html` (e.g. `/ui/` on GitHub Pages
once this branch is merged, or serve the repo root locally with any static server).
Everything in `ui/fixtures/` is **example data** for the preview only.

## Files

| File | Purpose |
| --- | --- |
| `study-desk.js` | Exposes `window.StudyDesk` (no build step, no dependencies) |
| `study-desk.css` | Styles, all scoped under `.sd-root`; light + dark, responsive |
| `index.html` | Demo host that mounts the UI with fixtures, in-memory only |
| `coverage.js` | Exposes `window.StudyDeskCoverage` (`mount`, `analyze`) |
| `coverage.html` | Coverage check page: syllabus topics vs scheduled days (same curriculum input) |
| `fixtures/*.fixture.js` | Example curriculum, lessons, videos and progress |
| `checks/run-checks.mjs` | Headless Chrome checks + screenshots (desktop 1366×900, mobile 390×844) |

## Mounting

```html
<link rel="stylesheet" href="ui/study-desk.css">
<div id="study-desk"></div>
<script src="ui/study-desk.js"></script>
<script>
  const desk = StudyDesk.mount(document.getElementById("study-desk"), {
    curriculum, lessons, videos, progress,          // data (shapes below)
    onProgressChange(change) { /* host persists, then desk.update({ progress }) */ },
    onNoteChange(day, text) { /* host persists; may return a Promise */ },
    onCoachAsk(req) { /* optional; return string | {text} | Promise of either */ },
    headerLinks: [{ label: "Coverage check", href: "coverage.html" }], // optional top-bar links
    routing: true,            // default: hash routing on window
    setDocumentTitle: true    // default
  });
  desk.update({ progress });  // re-render with any of curriculum/lessons/videos/progress
  desk.navigate(3, "learn");  // -> #day-3/learn
  desk.getRoute();            // { day, view }
  desk.destroy();
</script>
```

The UI never mutates the objects you pass in. Status buttons and the notes box
only call the callbacks; the host decides what to store and calls `update()`.

## Routes

| Hash | View |
| --- | --- |
| `#day-N` | Session plan (default) |
| `#day-N/learn` | Videos & notes |
| `#day-N/practice` | Practice |
| `#day-N/revision` | Quick revision |
| `#day-N/my-notes` | My notes |
| `#day-N/coach` | AI coach |

No hash: the UI replaces it with `#day-<progress.currentDay>` (or the first day
that isn't complete). An unknown day shows a "not in this plan" message.
Direct links, reload and back/forward all work. The number of days always comes
from `curriculum.days.length`.

## Data contract

```js
curriculum = {
  title: "Study Desk", subtitle: "optional",
  startDate: "2026-11-22",        // Day 1's calendar date (YYYY-MM-DD, read as a plain date in Asia/Kolkata)
  timeZone: "Asia/Kolkata",       // informational
  sessionStart: "21:00", sessionEnd: "23:00",   // optional: per-block time slots + "fits the session" check
  sessionWindow: "9:00–11:00 PM IST",           // optional display text
  tracks: [{                      // course tracks; used for block labels and coverage.html
    id: "HLD", name: "System Design (HLD)", short: "HLD",
    syllabus: [{ id: "H-REQUEST-01", title: "Request lifecycle" }]   // the course's topic list
  }],
  days: [{
    day: 1,                       // number used in #day-N
    date: "2026-11-22",           // optional; overrides startDate + index (the host shifts dates for skipped days)
    title: "…", summary: "…",
    tracks: ["HLD"], topicIds: ["H-REQUEST-01"],   // optional; derived from blocks when missing
    revisionOf: 0,                // optional: day number to revise first
    blocks: [{ id: "d1-hld", kind: "learn|practice|revision|coach", track: "HLD", topicId: "H-REQUEST-01", title: "…", minutes: 30 }]
  }]
};

lessons = {                       // keyed by day number (number or string key)
  "1": {
    objectives: ["…"],
    notes: [                      // long-form English notes, rendered as text (never raw HTML)
      { type: "h", text: "Heading" }, { type: "p", text: "Paragraph" },
      { type: "ul" | "ol", items: ["…"] }, { type: "code", lang: "java", text: "…" },
      { type: "callout", tone: "info|tip|warn", text: "…" }
    ],                            // a plain string is treated as a paragraph
    revision: ["suggested bullet", "…"],
    practice: [{ id, title, platform, difficulty, minutes, prompt, acceptance: ["…"], url }],
    coach: [{ id, prompt }]
  }
};

videos = {                        // keyed by day number; shown BEFORE the notes
  "1": [{ id, title, source: "YouTube", channel, url, durationMin, suggestedWatchMin, segment: "00:00–15:00", note, kind: "video|article" }]
};

progress = {
  currentDay: 2,                  // optional default route
  days: {
    "1": {
      status: "pending|in-progress|complete",   // optional; else derived from blocks
      blocks: { "d1-b1": "complete" },
      practice: { "lab-1-1": "in-progress" },
      notes: "free text from My notes"
    }
  }
};

// onProgressChange receives:
{ day: 1, scope: "day" | "block" | "practice", id: "d1-b1" | null, status: "pending" | "in-progress" | "complete" }
```

Missing pieces render empty-state messages instead of failing.

**Dates.** A day shows `day.date` when it is present; otherwise it shows
`startDate + (position in days[])`. The UI only displays dates. Moving days
forward when one is skipped is the host's job (it can write `date` on each day).

**Session plan.** Each block shows its course (`tracks[].name` from
`block.track`), topic title, topic ID, minutes and a time slot counted from
`sessionStart`. The plan prints the total and warns when it runs past
`sessionEnd`.

## Coverage check (`coverage.html`)

`StudyDeskCoverage.mount(root, { curriculum, deskHref: "index.html" })` reads
the same `curriculum` object. For each `tracks[]` entry it lists every
`syllabus[]` topic with the day(s) whose blocks carry that `topicId` (linked to
`index.html#day-N`). It flags topics **not scheduled on any day**, and topics
scheduled under a track but missing from its syllabus. An overall "All
unscheduled topics" list closes the page. `StudyDeskCoverage.analyze(curriculum)`
returns the same result as plain data. The fixture leaves 2 topics per track
unscheduled on purpose so the report has something to show.

## Status states

Not started (○, dashed grey; status value `"pending"`, also the default for any
missing progress), In progress (◐, amber), Complete (✓, green). Every
badge carries an icon and a text label, so state never depends on color alone.

## Views

- **Session plan:** blocks with minutes, kind, topic ID and a status toggle; revision-first callout when `revisionOf` is set; day status buttons.
- **Videos & notes:** source, suggested watch time, segment and length first, then long-form notes.
- **Practice:** prompt, acceptance criteria, platform link, status toggle.
- **Quick revision:** *My notes* card first and emphasised, suggested bullets below.
- **My notes:** textarea; debounced `onNoteChange(day, text)`.
- **AI coach:** one question per card, copy-prompt button; answer box + feedback only if the host passes `onCoachAsk`.

## Accessibility

Skip link, visible focus rings, `aria-current="page"` on the active day and
view in the sidebar and tabs, arrow-key movement in the day list, Enter in the
search box opens the first match, Esc closes the mobile drawer, live region for
search counts and note save state, and reduced-motion support.

## Checks

```bash
npm i puppeteer-core            # anywhere; point NODE_PATH at its node_modules
NODE_PATH=/path/to/node_modules node ui/checks/run-checks.mjs /tmp/study-desk-checks
```

It checks every route on desktop and mobile, that there's no horizontal
overflow, the learn-view order (video before notes) and the revision order
(My notes before suggestions), back/forward, search filtering, the status
toggle, the skip link and that no console errors appear, and it saves screenshots.

Keyboard checks (explicit):
- **Tab order (desktop):** skip link → search → Day 1 → Day 1 lesson sidebar (6 views) → Day 2. Every stop shows a ≥2px `:focus-visible` outline.
- **Skip link:** Enter moves focus to the lesson content, and the next Tab lands on the view tabs. Enter on a tab opens that view.
- **Day index arrows:** ArrowDown from search enters the list; ArrowDown/ArrowUp walk the day links and the active day's lesson-sidebar links; ArrowUp from the first day returns to search.
- **Enter:** in search, it opens the first match. On a day link or lesson-sidebar link, it opens that route and `aria-current` moves.
- **Space:** toggles a block's status.
- Desktop Tab order now starts: skip link → Coverage check link → search.
- **Mobile:** Tab reaches the Days toggle; Enter opens the drawer and focuses search; Esc closes it and returns focus to the toggle.

Other checks: the fixture loads with every day and block "Not started". Day 1 is
2026-11-22, and the dates run consecutively from there. Day 1 has 4 course blocks
(9:00–11:00 PM). Day 2 onward starts with a 12-minute revision followed by the 4
courses, 2 h in total. The header link opens the coverage page, which shows 4
tracks, 24/32 topics scheduled and 2 unscheduled per track, and its day links
open the desk.

Content, persistence and publishing to `main` are left to the integration step.
