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
  title: "Study Desk", subtitle: "optional", sessionWindow: "9:00–11:00 PM IST", // optional display text
  days: [{
    day: 1,                       // number used in #day-N
    title: "…", summary: "…",
    tracks: ["J", "L"],           // shown as chips, searchable
    topicIds: ["J-OOP-01"],       // shown + searchable
    revisionOf: 0,                // optional: day number to revise first
    blocks: [{ id: "d1-b1", kind: "learn|practice|revision|coach", title: "…", topicId: "…", minutes: 40 }]
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

## Status states

Pending (○, dashed grey), In progress (◐, amber), Complete (✓, green). Every
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
