# Study Desk QA report (21 Nov 2026, ~11:58 PM IST; fix status updated 22 Nov 2026 IST)

Repo `Rishabh10045/ai-learning-platform`. Checked the live `main` (`bb2a613`)
(https://rishabh10045.github.io/ai-learning-platform/ui/) and branch `grok/subject-first` @ `a06f1aa` (PR #3, open)
served locally. Fixes are on `grok/subject-first` (PR #3, **not merged**); `main` is unchanged.

**Fix status (22 Nov 2026 IST):** 3/3 High and 15/15 Med fixed on the branch (H1 reaches the live site only when Deepak merges PR #3);
8/11 Low fixed (L1–L8), L9 partly, L10–L11 left open on purpose. Checks: `node --test ui/checks/engine.test.mjs ui/checks/coverage.test.mjs`
**36/36**, `ui/checks/run-checks.mjs` **197/197** (desktop 1366, mobile 390 and 320, keyboard, flows, QA regressions, axe contrast).
Commits: `ef2c31c` engine + example fixture, `a792042` coverage reference checklist, `6078e72` UI + preview host,
`0ddf514` browser regression checks, `15108e8` root index, `5b1d833` README.

| Bug | Status | Commit | Regression test |
|---|---|---|---|
| H1 | Fixed in PR #3, open on live until Deepak merges | 6078e72, 15108e8 | — |
| H2 | Fixed | ef2c31c, 6078e72 | engine `QA H2` + browser `QA H2` ×2 |
| H3 | Fixed | ef2c31c, 6078e72 | engine `QA H3` + browser `QA H3` (`__studyDeskTick`) |
| M1 | Fixed | 6078e72 | browser `QA M1` + route checks `#%E0%A4%A` |
| M2 | Fixed | 6078e72 | browser `QA M2` |
| M3 | Fixed | 6078e72 | browser `QA M3` |
| M4 | Fixed | ef2c31c, 6078e72 | engine `QA M4` + browser `QA M4` ×2 |
| M5 | Fixed | 6078e72 | browser `QA M5` (two tabs) |
| M6 | Fixed | 6078e72 | browser `QA M6` ×2 |
| M7 | Fixed | ef2c31c, 6078e72 | engine `QA M7` + browser `QA M7` ×2 |
| M8 | Fixed | 6078e72 | `no horizontal overflow (QA M8)` at 1366/390/320 on every route |
| M9 | Fixed | 6078e72 | browser `QA M9` (axe colour-contrast, 8 pages) |
| M10 | Fixed | ef2c31c | engine `QA M10` + browser `QA M10` |
| M11 | Fixed | ef2c31c, 6078e72 | engine `QA M11` + browser migration check |
| M12 | Fixed | ef2c31c | engine `QA M12` |
| M13 | Fixed (example fixture + validator warnings) | ef2c31c | engine `QA M13` + browser `QA M13` |
| M14 | Fixed | a792042, 6078e72 | `coverage.test.mjs` ×3 + browser `QA M14` |
| M15 | Fixed | 6078e72 | browser `QA M15` at 390 and 320 |
| L1 | Fixed on branch (live after merge) | 15108e8 | browser `QA L1` |
| L2 | Fixed (reopening a lesson relocks the test) | ef2c31c | engine `QA L2` |
| L3 | Fixed | ef2c31c | engine `QA L3` |
| L4 | Fixed | ef2c31c | engine `QA L4` |
| L5 | Fixed | 6078e72 | browser `QA L5` |
| L6 | Fixed | ef2c31c, 6078e72 | engine `QA L6` + browser `QA L6` |
| L7 | Fixed (no dedicated regression test) | 6078e72 | — |
| L8 | Fixed | ef2c31c, 6078e72 | engine `QA L8` |
| L9 | Open (partly: per-subject search prefix; real videos/problem links must come from GPT's data) | ef2c31c | — |
| L10 | Open (accepted: self-study honour system) | — | — |
| L11 | Open (info only) | — | — |

---

## 0. Is GPT's work anywhere? **No.**

| Check (after `git fetch --all --prune`) | Result |
|---|---|
| Remote branches | only `main`, `grok/lesson-ui`, `grok/lesson-ui-2`, `grok/subject-first`. **No `gpt/*` branch** (`git ls-remote` + GitHub API) |
| Commits `5047d3f`, `b2e73dc` | `fatal: Not a valid object name` (not in any fetched ref) |
| `curriculum.js`, `lesson-content.js`, `lesson-videos.js`, `progress.js`, `app.js` | not on any branch, not anywhere on the box (`find /`) |
| `*.bundle` (e.g. `study-desk-qa-handoff.bundle`) | none on the box |
| COLLAB.md | every entry is Grok's; no `> GPT:` reply. PR list: #1, #2 merged, #3 open, all Grok's. No PR comments |
| Commit authors | every commit is `Rishabh10045` via Grok's commit prefixes (`grok -`, `grok-ui -`) or the PR merges |

**So everything audited below is Grok's example fixture, not GPT's 54-session plan.** Nothing in this report is GPT's content.
Section B gives a checklist to judge GPT's plan once it is pushed.

---

## A. App QA: bugs

Severity: **High** = wrong result or data loss on a core flow Deepak uses from Day 1. **Med** = real defect with a workaround or edge trigger. **Low** = polish, hardening or copy.
Line numbers are on `grok/subject-first` unless marked *main*.

### Summary: 3 High · 15 Med · 11 Low (29 total)

### HIGH

**H1. The live site is still the old v1 demo and does not save progress.** `[Fixed in PR #3, open on live until Deepak merges · 6078e72, 15108e8]`
- Where: *main* `ui/index.html` (in-memory host); the subject-first UI is only on unmerged PR #3.
- Steps: open https://rishabh10045.github.io/ai-learning-platform/ui/#day-1/my-notes, type a note, wait 1 s, reload.
- Expected: the note persists, and the plan is subject-first (D5/D6).
- Actual: the note is gone (verified: textarea `""` after reload). The page shows the 6-day "4 courses per day" fixture with "0/6 days complete". Day 1 is tomorrow (Sun 22 Nov).
- Fix: before Day 1, either merge PR #3 (it has localStorage persistence), or tell Deepak to track somewhere else until the real data lands. Don't let him enter a day's work on a page that forgets it.

**H2. "Save default for every <weekday>" never saves the weekday default.** `[Fixed · ef2c31c, 6078e72]`
- Where: `ui/study-desk.js:124` (`emit` sets `change.date = change.date || data.today`) plus `ui/engine/schedule-engine.js:380-385` (`minutes` prefers `change.date` over `change.weekday`).
- Steps: open `?today=2026-11-23#today`, set "Default for every Monday" to 180, click Save default.
- Expected: `schedule.dailyMinutes[1] = 180`, and every Monday becomes 3h.
- Actual: `{"dateMinutes":{"2026-11-23":180},"dailyMinutes":{}}`. Only today changes, and nothing tells the user. "Weekdays default 2h and can be adjusted" (D6) is broken from the UI.
- Fix: don't auto-stamp `date` for `minutes` changes, or split the event into `targetDate` and `changedOn`. The engine should check `weekday != null` first. Add a UI test.

**H3. Finishing a session after midnight IST (or a day late) slips the whole plan, and Today shows the finished session.** `[Fixed · ef2c31c, 6078e72]`
- Where: `schedule-engine.js:263-279` (`buildCalendar`, one session per date, `advancePast`) plus `ui/index.html:29` (`today` computed once at load).
- Steps (engine, verified): complete Session 1 with `date: 2026-11-23` (e.g. at 00:10 IST after a 9-11 PM session that ran late), then view Today on 23 Nov.
- Expected: 23 Nov shows Session 2, and the finish date is unchanged.
- Actual: 23 Nov shows **Session 1 (complete)** again. Session 2 moves to 24 Nov, and the projected finish moves from 11 Dec to 12 Dec. Every late night compounds this. The tab also keeps the date it had when it loaded, so a page left open across midnight stamps completions with yesterday's date, while a page opened after midnight stamps today's. Behaviour depends on whether he reloaded.
- Fix: add a "study-day cutoff" (e.g. 04:00 IST: `todayIST(now - cutoff)`), and recompute `today` on `visibilitychange` and every minute. When today's entry is already complete, show "Session N done. Start N+1 early?" and let the pointer advance. Add engine tests for 23:59, 00:10 and 03:59 IST.

### MED

**M1. A malformed hash crashes routing.** `[Fixed · 6078e72]`
- Where: `study-desk.js:96` (`decodeURIComponent` with no try/catch).
- Steps: open `ui/index.html#%E0%A4%A` fresh.
- Expected: the "Not in this plan" page.
- Actual: `pageerror: URI malformed` and a blank main area. On a hashchange the old view stays on screen.
- Fix: wrap the decode in try/catch and fall back to the raw hash, then show not-found.

**M2. My notes are lost if you reload or close within 600 ms of typing.** `[Fixed · 6078e72]`
- Where: `study-desk.js:612-616` (debounced emit, with no flush on `pagehide`/`visibilitychange`/`blur`).
- Verified: type "quick note" and reload at once: stored notes have no `S03`. The status says "Saved" before the host has confirmed anything.
- Fix: flush pending drafts on `blur`, `pagehide` and `visibilitychange`, and set "Saved" only after `onChange` resolves ok.

**M3. Storage failures are silent.** `[Fixed · 6078e72]`
- Where: `ui/index.html:37` (`try { localStorage.setItem } catch(e) {}`).
- Verified: fill localStorage to quota and type a note. No error, "Saved" logic runs, and after reload the textarea is empty.
- Fix: return an error from `save()`, have `hostChange` return `{ok:false, reason:"Could not save (storage full)"}`, and show a persistent banner.

**M4. Corrupt or unexpected stored JSON is wiped, or crashes the app.** `[Fixed · ef2c31c, 6078e72]`
- Where: `ui/index.html:31,38`; `schedule-engine.js:319` (shallow `Object.assign` in `normalize`), `:38-41` (`parse` throws).
- Verified:
  - `{bad json` and `[]` are silently replaced by empty progress on load. There is no backup copy, so the user's data is gone.
  - `"str"` becomes `{"0":"s","1":"t","2":"r",…}`.
  - `{"schedule":{"unavailable":null}}` throws `TypeError: Cannot set properties of null` when you tick "I can't study".
  - `{"schedule":{"startDate":"2026/11/22"}}` gives a **blank app** (`Bad date`).
- Fix: on parse or shape failure, copy the raw string to `studydesk.backup.<ts>` and show a banner. Deep-validate `schedule.*` maps and dates in `normalize()`. Catch engine errors in `render()` and show an error card.

**M5. Two open tabs overwrite each other.** `[Fixed · 6078e72]`
- Where: `ui/index.html` (no `storage` event listener and no merge).
- Verified: tab A writes S01 notes, then tab B writes S02. The stored notes are only `{"S02":"tab B note"}`, so tab A's work is lost.
- Fix: listen for `storage`, reload `progress`, and `desk.update`. Or re-read the key before each write and merge.

**M6. "Reset preview" deletes all progress in one click.** `[Fixed · 6078e72]`
- Where: `ui/index.html:16,54`.
- Verified: no confirm dialog, and notes are `{}` afterwards. The button sits in the top banner next to normal text.
- Fix: add `confirm()` plus a one-step undo (keep the last snapshot), or hide the button behind `?debug=1`.

**M7. A 0-minute or empty day still schedules a full session.** `[Fixed · ef2c31c, 6078e72]`
- Where: `schedule-engine.js:146-151` (`dayBudget`) and the `minutes` reducer; `study-desk.js` `dayControls` (`min="30"` is not enforced in JS).
- Verified: "Minutes on Mon 23 Nov" set to 0 gives blocks `9:00 PM 0 min / 0 min / 0 min`. Session 1 is still assigned there and counts as that day's session.
- Fix: clamp to ≥30 in the UI, and in the engine treat `minutes === 0` as unavailable so the session carries forward.

**M8. Mobile overflow on Today at 320 px and 390 px.** `[Fixed · 6078e72]`
- Where: `study-desk.css:114,118` (`.sd-chip` has `white-space:nowrap`); `study-desk.js:335`.
- Verified: on `#today` the document `scrollWidth` is 399 against a 320/390 viewport, because the chip "Weekend long day · Sunday · 6h 30m (2h core + 4h 30m stretch)" overflows. So the whole page scrolls sideways on Deepak's phone on weekends. The PR #3 "mobile 390×844 pass" missed it. Live *main* also overflows at 320 px (`scrollWidth` 399 on `#day-1`, `/learn`, `/practice`).
- Fix: `.sd-chip-budget { white-space: normal }` and `max-width:100%`. Add an automated `scrollWidth <= clientWidth` assertion for every view at 320 and 390.

**M9. Colour contrast below WCAG AA in the light theme** `[Fixed · 6078e72]` (axe-core, 4.x).
- Where: `study-desk.css:3,6`.
- Failures:
  - Accent `#c2571a` on white, 4.49:1: links, `.sd-toplink`, primary buttons, current nav item.
  - Budget chip `#c2571a` on `#fbeadf`, 3.83:1.
  - Video title and watch time on paper `#f7f5f0`, 4.12:1.
  - Lesson links in the locked-test list, 3.73:1.
  - `code` chips `#6b7280` on `#eef0f3`, 4.23:1.
  - The coverage page has 59 failing nodes.
- The dark theme passes. The `region` landmark issue: the demo banner sits outside landmarks.
- Fix: accent about `#a94a12` (≥5:1 on white and ≥4.5 on the soft background), and ink-3 about `#5b616e`.

**M10. Retaking a lesson quiz and failing un-passes the gate, but the lesson stays Complete.** `[Fixed · ef2c31c]`
- Where: `schedule-engine.js:360`.
- Verified: JC-02 complete, retake wrong gives `quizzes.JC-02.passed=false`, lesson state `complete`, `canComplete=false`. Module tests keep `passed || old.passed`; quizzes don't.
- Fix: store `best` and `passed = sc.passed || old.passed` (and track `lastScore` separately).

**M11. Progress migration drops or misplaces data, and only the fixture is ever migrated.** `[Fixed · ef2c31c, 6078e72]`
- Where: `schedule-engine.js:398-431`; `ui/index.html:32-35`.
- Verified:
  - v1 day-level `status` (the "mark day complete" scope) and `currentDay` are ignored. The report says `migrated:0, kept:0` and they are not kept in `legacy`, so the "nothing is lost" claim is false.
  - The legacy map sends `d1-hld` and `d2-hld` to HLD-01, so a Day-1 HLD block becomes **in-progress on a lesson 15 sessions away**.
  - The demo only migrates the hard-coded fixture (`?migrate=1`), and does so again on every load, overwriting stored progress. It never migrates real stored v1 data.
- Mitigation: live *main* never persisted anything (H1), so no real v1 data exists yet.
- Fix: keep unmapped day `status`/`currentDay` under `legacy`. Don't map cross-subject blocks to future lessons (keep them as legacy). Migrate whatever the host actually loads, once, behind a `schemaVersion` check.

**M12. The curriculum validator misses plan deadlocks.** `[Fixed · ef2c31c]`
- Where: `schedule-engine.js:105-143` (`resolveSessions`).
- Verified: putting `test: 'jc-collections'` on Session 1 (whose lessons come in Session 3) returns `ok: true, errors: []`. That session can never complete, so the calendar is stuck forever. Scheduling the same lesson twice is also not flagged.
- This matters as soon as GPT's 54 sessions are plugged in.
- Fix: error when a session's test module has lessons scheduled in later sessions, and warn on duplicate scheduling.

**M13. Each session's time budget is far over its slot, and nothing warns.** `[Fixed · ef2c31c]`
- Where: `ui/fixtures/course.fixture.js` (`estMinutes` plus practice minutes) against `core` 12/78/30.
- From `load.cjs`:
  - Most sessions need about 135 min of lesson and practice in a 78-min slot. S15 needs 155 and S19 needs 195.
  - Every DSA set is about 55 min in a 30-min slot.
  - The Day-1 warm-up (JC-01, 40 + 25 min) sits in a 12-min slot.
- So weekdays can't actually finish, and with gating plus one session per date (H3) the plan slips daily.
- Fix: the validator should warn when `sum(est + practice + suggestedWatch) > slot`. Then re-split sessions, or move practice into weekend stretch time.

**M14. The coverage page can't answer "are all topics covered?"** `[Fixed · a792042, 6078e72]`
- Where: `ui/coverage.js:16-26`.
- It only checks that every lesson *already in the course* is scheduled. It shows a green "57/57 lessons scheduled" while SQL, Kafka, Redis, Docker, rate limiting and more are absent (Section B). The `GfG · Module N` refs are illustrative and not checked against the real GfG syllabus (the real JBDL page is session-based: Session 1-4 + AI toolkit 1-4).
- Fix: load a reference checklist (Section B as JSON: `topicId → required`), let lessons declare `covers: [topicIds]`, and show missing topics in red.

**M15. The open mobile drawer has no focus trap.** `[Fixed · 6078e72]`
- Where: `study-desk.js:171-173`.
- Verified: after opening "☰ Course" on 390 px, Tab goes through 37 sidebar stops and then into `#sd-main` behind the scrim. Main is not `inert` and not `aria-hidden`.
- Esc closes the drawer and returns focus to the toggle (good).
- Fix: set `main.inert = true` while the drawer is open, or cycle focus inside it.

### LOW

**L1. The root page doesn't link to the app.** `[Fixed on branch · 15108e8]` https://rishabh10045.github.io/ai-learning-platform/ shows only "Setting up: Deepak's study plan and tracker." (`/index.html`, one line). Fix: add a link to `ui/`, or a meta-refresh.

**L2. Unchecking a lesson after the module test passed leaves the test "passed".** `[Fixed · ef2c31c]` The module then shows 4/5 with the test still passed. `schedule-engine.js:212`. Decide whether to relock or show "re-verify".

**L3. The reducer accepts junk.** `[Fixed · ef2c31c]` Lesson `status: "banana"` is stored, watch minutes `1e9` are accepted, and an unknown video id is accepted (`applyChange`). Fix: validate enums and ids, and cap minutes.

**L4. Practice edits mangle dates.** `[Fixed · ef2c31c]` "Save evidence" on a complete practice re-stamps `completedOn` to today. An evidence-only change (no `status`) reopens the parent lesson (`schedule-engine.js` practice case).

**L5. Non-canonical routes aren't normalized.** `[Fixed · 6078e72]` `#day-01` renders Session 1 but keeps the hash, so the same page has two URLs. `#day-1/test` on a session without a test shows "This session has no module test" (fine) but keeps the route. Fix: `replaceState` to the canonical form.

**L6. "Revision done" is stored as a fake note (`notes["rev-S02"]="done"`).** `[Fixed · ef2c31c, 6078e72]`
- It pollutes the notes namespace and is not part of session completion, so the revision block stays "Not started" unless that button is clicked (`study-desk.js` `blockState` / `vRevision`).
- Fix: add `progress.revisions[sessionId]`.

**L7. Some copy is hard-coded and ignores `course.schedule`.** `[Fixed · 6078e72]` Examples: "2h core + …", "From Day 2: 12 min revision, 78 min main lesson, 30 min DSA", and the defaults paragraph (`study-desk.js:335,347,367,467`). If `core` changes, the copy lies.

**L8. The calendar silently truncates.** `[Fixed · ef2c31c, 6078e72]`
- Cause: the loop limit is `horizonDays + 4 × sessions` (`schedule-engine.js:263`).
- Verified: with 200 days marked off, 0 of 20 sessions are placed and "Projected finish" shows 9 Jun 2027 (the cut-off date, not a real finish).
- Fix: when it truncates, show "Plan extends beyond the calendar window" instead of a finish date.

**L9. Fixture video and practice links are placeholders.** `[Open · ef2c31c]`
- All 57 videos are YouTube *search* URLs with "java" prefixed even for non-Java topics ("java Prompt engineering", "java Design a URL shortener", "java SOLID principles").
- Watch time and duration are made up (`estMinutes × 0.35 / 0.6`).
- Every DSA practice link is the generic `geeksforgeeks.org/explore` (HTTP 200), not specific problems.
- From the box, YouTube answered 429/302 (bot wall, not a dead link); they open fine in a normal browser.
- Code: `course.fixture.js:16,29,154,158`.

**L10. Quiz answers ship in the client data.** `[Open · —]` The answer index is readable in the page source, so gates are honour-system. That is acceptable for self-study; just don't call it a "test".

**L11. Performance is fine (info).** `[Open · —]` `update()` takes about 4 ms on 20 sessions (re-indexes the course about 4× per render). With 54 sessions that's still well under one frame. Worth memoizing `indexCourse` once real content (long notes) arrives.

### Verified OK (no bug)
- **XSS:** My notes rendered `<img src=x onerror>`, `<svg onload>` and `<script>` as text. Everything goes through `textContent` (0 `<img>` created, `window.__xss` unset).
- **Routing:** `#day-0`, `#day-999`, `#day--1`, `#day-1.5`, `#DAY-1`, `#day-1/foo`, `#lesson/NOPE`, `#today/x` all show the "Not in this plan" page. `#lesson/JC-03` redirects to `#day-1/learn`. Back/forward works. Focus moves to the H1 on route change, and `document.title` updates.
- **Gates:** "Mark complete" with an unpassed quiz is blocked in the UI and the engine. Module tests stay locked until their lessons are done.
- **Dates:** `todayIST` is correct at the boundary (18:29:59Z gives 21 Nov, 18:30:00Z gives 22 Nov). All date maths is UTC on `YYYY-MM-DD`, so `toISOString` is safe. Sunday and Saturday are 390 min, Mon-Fri 120.
- **Carry-forward:** missing 22 Nov makes 24 Nov show Session 1 "carried". An unavailable date pushes the same session.
- **Other:** dark-theme contrast passes. No console errors on normal flows. Engine tests 19/19 pass.

---

## B. Content gap analysis

### B0. What exists
> **Update 22 Nov:** after the fixes the example fixture is 42 sessions (one main lesson + one DSA each) with SQL & JDBC before JPA, HTTP before REST, LLM basics before Spring AI and generics before collections, and fits the slots. It is still **example data**; the numbers below describe the fixture as audited.
- `ui/fixtures/course.fixture.js` (Grok's example) has **20 sessions, 57 lessons**:
  - Java core 6, Streams/APIs 4, Concurrency 5, Spring Boot 8, LLD 4, HLD 5, GenAI 5, DSA 20.
  - Only SA-04 and GEN-05 are labelled `source: added`; the rest are "gfg (example mapping)" with invented module refs.
- *main* still has the older v1 fixture (6 days, 4 tracks × 8 topics).
- **The real target is GPT's 54-session plan, which is not on GitHub.**

**Teaching quality of the fixture, per lesson:**

| Element | Coverage | Gap |
|---|---|---|
| Video | 57/57, but YouTube *search* links, not picked videos | no real video, no timestamps |
| Notes | 57/57, but 1 sentence + "Example notes." | no long-form English notes (D-spec asked for these) |
| Code example | **0/57** | for a Java interview plan every Java/Spring/LLD lesson needs runnable code |
| Diagram | 10/57 (linear flow only) | no class/sequence/architecture diagrams for LLD/HLD |
| Practice | 57/57, generic "write a small program that demonstrates X" | no concrete problem links, no acceptance tests |
| Lesson quiz | 37/57 (DSA has none); **1 true/false question, pass = 100 %** | weak gate; need 4-6 MCQ/code-output questions |
| Module test | 8 of 20 modules; 2-3 T/F questions | none for persistence, testing, Spring AI, functional, threads, LLD principles, HLD basics, LLM basics, any DSA module |
| Revision bullets | 1-2 per lesson | ok for a 12-min slot, but no spaced repetition |
| Coach prompt | 1 generic "explain X" | needs real interview questions with follow-ups (see B9) |

**Prerequisite-order problems in the fixture:**
1. **SQL/JDBC never taught before JPA (SB-03).** There is no SQL subject at all.
2. **HTTP/REST basics (HLD-01: DNS/TCP/HTTP) come at S16, after REST controllers (S09).** Teach HTTP methods, status codes and idempotency before Spring REST.
3. **Spring AI (SB-08, S13) comes before LLM fundamentals (GEN-01 tokens/context, S19).** Either move Spring AI into the GenAI phase or teach GEN-01/02 first.
4. Concurrency (S06-08) comes before Spring, which is good. But there is no Spring `@Async`, `@Scheduled` or thread-pool config lesson to cash it in.
5. Design patterns: GfG's Java course introduces Singleton in Session 2, but the fixture waits until LLD (S14). Fine, but LLD should then reference earlier Java code.
6. Testing (SB-05) comes after REST/JPA. Better to introduce JUnit in Java core and use Mockito/slices in Spring.
7. Generics (needed for Collections/Streams) is **missing** before Collections.

**Missing subjects and threads:**
- **SQL and databases (MySQL/Postgres):** absent. GfG JBDL lists MySQL + JDBC, and it is asked in every backend loop.
- **Redis/caching, Kafka/messaging, microservices + Spring Cloud Gateway:** in GfG JBDL, absent from the fixture.
- **Git/GitHub, Maven/Gradle, Docker, CI/CD (GitHub Actions), deployment, logging/monitoring:** absent. GfG lists Git and containerized deployment.
- **Projects:** GfG builds Splitwise, Splitwise+AI agents and Airbnb backend. The fixture has none. Deepak needs 1-2 end-to-end projects to talk about in interviews.
- **Behavioral / project storytelling (STAR), resume walkthrough:** absent.
- **Mock interviews** (DSA timed, LLD 45-min machine coding, HLD 45-min design, Java/Spring rapid-fire): absent.
- **Spaced revision at 1/3/7/21 days:** only "previous session" revision exists. Weekly revision days are absent.
- **Timed DSA contests / mixed-pattern days:** absent.

### Legend for checklists
✅ in fixture (lesson id) · ⚠ only mentioned in a one-line summary · ❌ missing. **GfG** = in a GfG public syllabus (JBDL 12-week Java Backend, Mastering System Design, AI Engineering / GenAI tutorials, Master Java). **added** = expected by interviews but not explicit in GfG.

### B1. Java core
| Topic | Fixture | Source |
|---|---|---|
| JDK/JRE/JVM, bytecode, class loading, JIT | ✅ JC-01 (no class loaders/JIT) | GfG |
| Primitives vs wrappers, autoboxing, Integer cache (`==` on 127/128) | ⚠ JC-02 | GfG |
| String immutability, String pool, `intern`, StringBuilder vs StringBuffer | ❌ | GfG |
| OOP 4 pillars, abstract class vs interface, default/static methods | ✅ JC-03/04 (⚠ abstract vs interface) | GfG |
| Overloading vs overriding rules (covariant return, access, exceptions) | ⚠ JC-04 | GfG |
| `static`, `final`, `this`/`super`, constructors, init order | ❌ | GfG |
| `equals`/`hashCode` contract, `Comparable` vs `Comparator` | ✅ JC-06 (no Comparator) | GfG |
| Immutability (final class, defensive copies), records | ❌ | added |
| Exceptions: checked vs unchecked, hierarchy, `finally`, try-with-resources, custom exceptions, propagation | ⚠ JC-06 | GfG (Session 2) |
| Generics: bounded types, wildcards, PECS, type erasure | ❌ | GfG (Session 4) |
| Collections internals: HashMap (buckets, treeification, resize, load factor), LinkedHashMap (LRU), TreeMap, ArrayList growth, fail-fast vs fail-safe iterators | ⚠ JC-05 | GfG |
| Queue/Deque/PriorityQueue, Iterator | ❌ | GfG (Session 3) |
| Memory: stack vs heap, GC basics (G1/ZGC), memory leaks, `OutOfMemoryError` types | ❌ | added |
| Pass-by-value semantics | ❌ | added |
| Java 17/21: records, sealed classes, pattern matching for `switch`/`instanceof`, text blocks, `var` | ❌ (switch expressions ⚠ JC-02) | added |
| Serialization, `transient`, `Cloneable` pitfalls | ❌ | added |
| Reflection and annotations (needed to understand Spring) | ❌ | added |
| Singleton (thread-safe, enum) | ❌ in Java (LLD-02 later) | GfG (Session 2) |

### B2. Streams and Java APIs
| Topic | Fixture | Source |
|---|---|---|
| Lambdas, functional interfaces, method references | ✅ SA-01 | GfG |
| Stream pipeline, laziness, short-circuiting | ✅ SA-02 | GfG |
| Collectors: groupingBy, partitioningBy, toMap (merge fn / duplicate key), joining | ✅ SA-03 | GfG |
| `Optional` correct use (not for fields/params) | ⚠ SA-03 | GfG |
| `flatMap`, `reduce`, primitive streams, `iterate`/`generate` | ⚠ SA-02 | GfG |
| Parallel streams: when not to use, ForkJoin common pool | ❌ | GfG (Session 4) |
| Side effects and stateful lambdas pitfalls | ❌ | added |
| `java.time` | ✅ SA-04 | added |
| HttpClient | ✅ SA-04 | added |
| File I/O / NIO basics | ❌ | GfG (Master Java) |
| JDBC (Connection, PreparedStatement, SQL injection, connection pool/HikariCP) | ❌ | **GfG JBDL skill** |

### B3. Concurrency (Java multithreading)
| Topic | Fixture | Source |
|---|---|---|
| Thread lifecycle, Runnable/Callable, `start` vs `run` | ✅ CC-01 | GfG |
| Race conditions, `synchronized`, `volatile` | ✅ CC-02 | GfG |
| **Java Memory Model, happens-before**, safe publication, double-checked locking | ❌ | added |
| `wait`/`notify`, producer-consumer, BlockingQueue | ❌ | GfG |
| ExecutorService, pool sizing (CPU vs IO), rejection policies, shutdown | ✅ CC-03 (no rejection policies) | GfG |
| ReentrantLock, ReadWriteLock, Condition, tryLock, fairness | ⚠ CC-04 | GfG |
| Atomics/CAS, ABA, LongAdder | ⚠ CC-04 | added |
| ConcurrentHashMap internals, CopyOnWriteArrayList | ⚠ CC-04 | GfG |
| CountDownLatch, CyclicBarrier, Semaphore | ❌ | added |
| Deadlock, livelock, starvation; detection and prevention | ❌ | GfG |
| CompletableFuture (thenApply/thenCompose/allOf, exceptionally, custom executor) | ✅ CC-05 | added |
| **Virtual threads (Java 21)**, structured concurrency, pinning | ❌ | added |
| ThreadLocal (and leaks in pools) | ❌ | added |
| Classic coding: print odd/even with 2 threads, bounded buffer, thread-safe LRU cache, rate limiter | ❌ | added |

### B4. Spring Boot
| Module / topic | Fixture | Source |
|---|---|---|
| IoC/DI, bean scopes, **bean lifecycle** (`@PostConstruct`, BeanPostProcessor), circular deps | ⚠ SB-01 (no lifecycle/scopes) | GfG |
| Auto-configuration, starters, `@Conditional`, profiles, `application.yml`, `@ConfigurationProperties` | ⚠ SB-01 (no profiles/config) | GfG |
| AOP and proxies (why `@Transactional` on self-invocation fails) | ❌ | added |
| REST: controllers, DTOs, status codes, **validation** (`@Valid`), **global exception handling** (`@ControllerAdvice`, ProblemDetail) | ✅ SB-02 | GfG |
| REST design: idempotency, versioning, **pagination/sorting**, HATEOAS-lite, OpenAPI/Swagger | ❌ | added |
| JDBC → JPA/Hibernate: entities, relationships, lazy/eager, **N+1** and fetch joins/EntityGraph | ✅ SB-03 (N+1 only a bullet) | GfG |
| **`@Transactional` propagation, isolation, rollback rules, readOnly, self-invocation pitfall** | ⚠ SB-04 | GfG |
| Optimistic (`@Version`) vs pessimistic locking | ❌ | added |
| DB migrations (Flyway/Liquibase) | ❌ | added |
| Testing: JUnit 5, Mockito, `@WebMvcTest`, `@DataJpaTest`, **Testcontainers** | ✅ SB-05 (one lesson) | GfG |
| Security: filter chain, authN/authZ, password encoding, role-based access, CORS/CSRF | ✅ SB-06 (no RBAC/CORS/CSRF detail) | GfG |
| **JWT + OAuth2 resource server**, refresh tokens | ⚠ SB-06 | GfG (OAuth 2.0) |
| Google OAuth2 login (authorization code + PKCE) | ✅ SB-07 | GfG |
| Caching with **Redis** (`@Cacheable`, TTL, eviction, cache-aside) | ❌ | **GfG JBDL** |
| Messaging with **Kafka** (producer/consumer, groups, offsets, retries, DLQ, idempotent consumer) | ❌ | **GfG JBDL** |
| Microservices: Spring Cloud Gateway, service discovery, config, resilience (Resilience4j circuit breaker/retry), Feign/WebClient | ❌ | **GfG JBDL (Airbnb project)** |
| Async and scheduling: `@Async`, `@Scheduled`, TaskExecutor config | ❌ | added |
| Observability: **Actuator**, health/readiness, Micrometer metrics, structured logging, tracing | ❌ | GfG (monitoring/logging) |
| **Rate limiting** (Bucket4j / gateway) | ❌ | added |
| Docker image, docker-compose (app+MySQL+Redis+Kafka), deploy, GitHub Actions CI | ❌ | GfG (containerized deploy) |
| Spring AI: ChatClient, prompt templates, structured output | ✅ SB-08 | GfG (AI with Spring) |
| Spring AI advisors, tool/function calling, VectorStore, RAG, MCP client/server | ⚠ GEN-04 | added |
| **Projects**: Splitwise-style backend → +Redis/Security/JUnit → microservices booking system | ❌ | **GfG JBDL** |

### B5. SQL and databases (missing subject)
❌ entire subject. Must-have:
- Joins, group by/having, subqueries vs joins, window functions (`ROW_NUMBER`, `RANK`, running totals), top-N per group, 2nd-highest salary
- Normalization (1NF-3NF/BCNF) vs denormalization, keys and constraints
- **Indexes:** B-tree, composite index and leftmost prefix, covering index, when indexes hurt
- **EXPLAIN plans**
- **Transactions:** ACID, **isolation levels** and anomalies (dirty/non-repeatable/phantom reads), MVCC
- **Locking:** row/table, `SELECT … FOR UPDATE`, deadlocks
- Connection pooling, SQL injection
- NoSQL types (key-value, document, wide-column) and when to use them; Redis data structures

### B6. LLD
| Topic | Fixture | Source |
|---|---|---|
| OOP for design, class relationships (association/aggregation/composition) | ❌ | GfG |
| **UML**: class, sequence, activity, state diagrams | ❌ | GfG (MSD module 3) |
| SOLID | ✅ LLD-01 | GfG |
| GRASP, DRY, KISS, YAGNI, composition over inheritance | ❌ | GfG (MSD module 4) |
| Creational: Factory, Abstract Factory, Builder, Singleton, Prototype | ✅ LLD-02 (partial) | GfG |
| Structural: Adapter, Decorator, Facade, Proxy, Composite | ⚠ LLD-03 | GfG |
| Behavioral: Strategy, Observer, Command, State, Chain of Responsibility, Template, Iterator | ⚠ LLD-03 (2 of 7) | GfG |
| Machine-coding approach: requirements → entities → APIs → class diagram → code → **concurrency** → extensibility | ⚠ LLD-04 | added |
| Concurrency in LLD (locking a parking spot or seat, thread-safe inventory) | ❌ | added |
| **Classic problems**: parking lot ✅ LLD-04; ❌ elevator, BookMyShow/seat booking, Splitwise, LRU cache, rate limiter, vending machine, Snake & Ladder / Tic-Tac-Toe, chess, library management, ATM, logger, pub-sub / notification system, food delivery | 1 of ~14 | GfG + added |

### B7. HLD
| Topic | Fixture | Source |
|---|---|---|
| Interview framework: requirements (functional/NFR) → estimates → API → data model → HLD → deep dives → trade-offs | ❌ | GfG |
| **Back-of-envelope estimation** (QPS, storage, bandwidth) | ⚠ HLD-01 | GfG |
| DNS, CDN, proxies (forward/reverse), HTTP/HTTPS/TLS, WebSockets, long polling, SSE | ⚠ HLD-01 | GfG |
| Load balancers (L4/L7, algorithms), stateless services | ✅ HLD-02 | GfG |
| Caching: cache-aside / read-through / write-through / write-back, eviction, stampede, invalidation | ⚠ HLD-02 (cache-aside only) | GfG |
| DB: SQL vs NoSQL, replication (leader-follower, multi-leader, quorum), **sharding/partitioning**, hot keys | ✅ HLD-03 | GfG |
| **Consistent hashing** | ❌ | GfG |
| **CAP and PACELC**, consistency models (strong/eventual/read-your-writes) | ⚠ HLD-04 (CAP only) | GfG |
| Message queues and **Kafka semantics** (partitions, ordering, consumer groups, at-least/at-most/exactly-once), outbox pattern | ⚠ HLD-04 | GfG |
| **Idempotency** keys, retries with backoff + jitter, timeouts | ❌ | added |
| **Rate limiting** algorithms (token bucket, leaky bucket, sliding window) and distributed rate limiter | ❌ | GfG (project) |
| Microservices vs monolith, API gateway, service discovery, saga, circuit breaker, event-driven / event sourcing / CQRS | ❌ | GfG |
| Distributed IDs (Snowflake), clocks, leader election, consensus (Raft, overview) | ❌ | added |
| Blob/object storage, search (inverted index / Elasticsearch) | ❌ | GfG (object store) |
| AuthN at scale: OAuth/JWT/session, SSO | ❌ in HLD | GfG |
| **Observability**: logs/metrics/traces, SLO/SLA/SLI, alerting | ❌ | added |
| Availability, fault tolerance, disaster recovery, multi-region | ❌ | GfG |
| **Case studies**: URL shortener ✅ HLD-05; ❌ rate limiter, chat (WhatsApp), news feed / Twitter, notification service, YouTube/Netflix, Uber/nearby (geohash), BookMyShow/ticketing, payment system / e-wallet, distributed cache, web crawler, typeahead/autocomplete, object store (S3) | 1 of ~13 | GfG + added |

### B8. GenAI
| Topic | Fixture | Source |
|---|---|---|
| Neural-net and transformer intuition: attention, encoder/decoder, positional encoding | ❌ | GfG (AI Eng. module 2) |
| Tokens/tokenization, context window, temperature/top-p, next-token prediction | ✅ GEN-01 | GfG |
| Prompt engineering: zero/few-shot, CoT, role/context/constraints, structured (JSON) output | ✅ GEN-02 | GfG |
| Hallucinations and mitigation | ❌ | GfG |
| **Embeddings**, similarity, vector DBs (FAISS/Chroma/pgvector/Qdrant), ANN indexes (HNSW) | ✅ GEN-03 (no ANN) | GfG |
| **RAG**: chunking strategies/overlap, metadata filters, hybrid search (BM25+vector), reranking, query rewriting, citations, failure modes | ✅ GEN-04 (no chunking depth/hybrid/rerank) | GfG |
| **Function/tool calling**, agents (ReAct), memory, multi-agent (CrewAI/LangGraph) | ❌ | GfG |
| **MCP** (Model Context Protocol), A2A | ❌ | GfG |
| **Evals**: golden sets, LLM-as-judge, RAG metrics (faithfulness, context recall), DeepEval/LangSmith | ✅ GEN-05 (brief) | GfG |
| **Guardrails**, prompt injection, PII, jailbreaks | ⚠ GEN-05 | GfG |
| Fine-tuning vs RAG vs prompting; LoRA/QLoRA (concept only) | ❌ | GfG |
| **Cost/latency**: token budgeting, caching (prompt/semantic), streaming, model routing, batching | ❌ | GfG (evaluation framework) |
| LLM serving/deployment, Docker, observability (tracing prompts), local SLMs (Ollama) | ❌ | GfG |
| Spring AI end-to-end (ChatClient + advisors + VectorStore + tools + MCP) | ⚠ SB-08/GEN-04 | added |
| GenAI system design (design a RAG chatbot / support assistant at scale) | ❌ | added |

### B9. DSA in Java (daily)
Fixture DSA-01…20 covers: Big-O ✅, arrays and two pointers ✅, hashing ✅, sliding window ✅, prefix sums ✅, binary search ✅, merge/quick sort ✅, recursion/backtracking ✅ (one day for both), stack and monotonic stack ✅, queue/deque ✅, linked lists ✅, tree traversals ✅, BST ✅, heaps ✅, BFS/DFS ✅, topo sort + shortest paths ✅ (one day), DP 1D ✅, DP 2D ✅, greedy ✅, tries ✅.

**Missing patterns:**
- ❌ Strings (palindromes, KMP/Z basic, anagram windows)
- ❌ Matrix traversal
- ❌ Fast and slow pointers / cycle detection
- ❌ Intervals (merge/insert/meeting rooms)
- ❌ Cyclic sort
- ❌ Bit manipulation
- ❌ Binary search on the answer
- ❌ Top-K / k-way merge
- ❌ Two heaps (median)
- ❌ Union-Find (DSU)
- ❌ Dijkstra in its own right, plus Bellman-Ford/MST (Prim/Kruskal)
- ❌ LCA / tree DP / diameter
- ❌ Knapsack / LIS / LCS / partition DP
- ❌ Segment tree / BIT (optional)
- ❌ Design-DS problems (LRU, LFU, min-stack)
- ❌ Math (GCD, sieve, modular)

**Process gaps:**
- One 30-min set per pattern is too little. Plan 2-3 days per major pattern: graphs, DP and trees need about 4 each.
- No problem lists. Map to GfG Practice / NeetCode 150 IDs.
- No weekly timed contest, and no revisiting failed problems on day +3/+7.

### B10. Five high-frequency interview questions per subject (the plan must teach toward these)

**Java core**
1. What is the `equals`/`hashCode` contract, and what breaks in a `HashMap` if you violate it?
2. Why is `String` immutable? Explain the String pool, and `==` vs `equals`.
3. How does `HashMap` work internally (hashing, collisions, treeify at 8, resize at 0.75), and how is Java 8+ different?
4. Checked vs unchecked exceptions: when would you create a custom exception? What does `finally` do when there is a `return`?
5. How do you make a class immutable? Records vs a hand-written immutable class.

**Streams/APIs**
1. Intermediate vs terminal operations; why are streams lazy?
2. `map` vs `flatMap`, with an example.
3. Group employees by department and find the highest-paid per department (Collectors code).
4. When should you *not* use parallel streams?
5. `Optional`: correct and incorrect uses.

**Concurrency**
1. `synchronized` vs `ReentrantLock` vs `volatile` vs `AtomicInteger`: when is each right?
2. What is the Java Memory Model / happens-before? Why is double-checked locking broken without `volatile`?
3. How do you size a thread pool, and what happens when the queue is full (rejection policies)?
4. Write producer-consumer (BlockingQueue, and with `wait`/`notify`), or print odd/even with two threads.
5. CompletableFuture `thenApply` vs `thenCompose`; how do virtual threads change blocking I/O?

**Spring Boot**
1. Bean lifecycle and scopes. How does DI resolve circular dependencies, and why is constructor injection preferred?
2. `@Transactional`: propagation (REQUIRED vs REQUIRES_NEW), isolation, rollback for checked exceptions, why self-invocation skips it.
3. What is the N+1 problem in JPA, and how do you fix it (fetch join, EntityGraph, batch size)?
4. How does Spring Security's filter chain work? Implement JWT auth; OAuth2 login vs resource server.
5. How do you make a Spring Boot service production-ready (Actuator, profiles, config, global error handling, pagination, idempotent APIs, caching, rate limiting, tests with Testcontainers)?

**SQL/DB**
1. Find the Nth-highest salary / top-N per group (window functions).
2. How does a composite index work, and when is it not used (leftmost prefix, functions on columns)?
3. Isolation levels and which anomalies each prevents.
4. Optimistic vs pessimistic locking: when would you use each in a booking system?
5. SQL vs NoSQL for a given use-case, and how you would shard.

**LLD**
1. Design a parking lot (and handle concurrent spot allocation).
2. Design BookMyShow seat booking with seat locking and expiry.
3. Design Splitwise (expense split strategies and simplify debts).
4. Design an LRU cache, thread-safe.
5. Design a rate limiter / logger / notification system (Strategy, Observer, Chain of Responsibility).

**HLD**
1. Design a URL shortener (estimation, ID generation, cache, 301 vs 302).
2. Design a rate limiter (token bucket, distributed with Redis).
3. Design a chat system / WhatsApp (WebSockets, delivery receipts, offline storage).
4. Design a news feed / Twitter timeline (fan-out on write vs read).
5. Design a payment/e-wallet or ticket-booking system (idempotency, exactly-once, saga, consistency).

**GenAI**
1. Explain RAG end to end. How do you choose chunk size and overlap, and how do you evaluate retrieval?
2. Embeddings: what they are, cosine similarity, and how a vector DB index (HNSW) works.
3. How do function/tool calling and agents work? What is MCP and why does it matter?
4. How do you reduce hallucinations, and defend against prompt injection?
5. How do you control LLM cost and latency in production (caching, smaller models, streaming, token limits), and how do you evaluate quality?

**DSA**
1. Two Sum / Longest substring without repeating characters (hashing, sliding window)
2. Merge intervals / Meeting rooms (sorting, heap)
3. Number of islands / Course schedule (BFS/DFS, topo sort)
4. LRU cache, Kth largest, Top-K frequent (heap, design)
5. Coin change / Longest increasing subsequence / Edit distance (DP)

**Behavioral / project** (missing entirely)
1. Walk me through your project architecture.
2. The hardest bug you fixed.
3. A conflict with a teammate.
4. A trade-off you made.
5. Why are you switching?

### B11. What every lesson should have, and what to check in GPT's plan
For each of the 54 sessions, check:
1. **Stable lesson IDs.** Every session resolves (use `coverage.html` once wired in). No test before its module's last lesson (M12).
2. **Prerequisites in order:**
   - SQL/JDBC → JPA
   - HTTP basics → REST
   - Java concurrency → Spring async
   - LLM basics → Spring AI
   - Generics → Collections/Streams
   - Redis/Kafka basics → microservices → HLD case studies
3. **Lesson anatomy:**
   - real video with a segment and watch time
   - long-form English notes (≥400 words)
   - **runnable Java code**
   - diagram (class/sequence/architecture where relevant)
   - concrete practice with acceptance criteria
   - 4-6-question quiz (pass ≥70 %)
   - 3-5 revision bullets
   - 2-3 real interview questions with model answers / follow-ups
4. **Time fits the slot** (78 min main and 30 min DSA on weekdays; weekend stretch for projects and mocks). See M13.
5. **Source labels:** GfG refs point at real GfG syllabus items (JBDL Session N / AI toolkit N / MSD module N); everything else is `source: added`.
6. **Missing subjects added:** SQL/DB, Redis, Kafka, microservices, Docker/CI/deploy, Git, observability, behavioral.
7. **Projects:** at least one end-to-end project built over weekend stretch time: Splitwise/booking backend with Spring Security + JPA + Redis + Kafka + tests + Docker, plus a Spring AI RAG feature.
8. **Revision system:** spaced 1/3/7/21-day revisions of notes and failed problems, a weekly revision/catch-up day, a subject-end test.
9. **Mock interviews:** weekly from about week 3: timed DSA (2 problems / 45 min), LLD machine coding (90 min), HLD (45 min), Java/Spring rapid-fire, behavioral.
10. **Buffer:** days for slippage (H3 shows every late night costs a day).

---

## C. Suggested next steps
> **Update 22 Nov:** item 3 is done (`ui/reference/topics.reference.js`, shown red on `coverage.html`). Items 1–2 still need Deepak / GPT.
1. Before Day 1, decide where he tracks: merge PR #3 after fixing H2/H3/M8, or use a notebook until GPT's data lands. Live *main* forgets everything (H1).
2. Ask GPT to push `gpt/curriculum` and `gpt/qa` (or paste the plan) so this checklist can be run against the real 54 sessions.
3. Turn B1-B9 into a machine-readable `reference-topics.json` so `coverage.html` can flag missing topics (M14).
