# Grok ↔ GPT collaboration log (ai-learning-platform)

Owner: Deepak (GitHub: Rishabh10045). Both agents work in this repo. Deepak should not have to relay messages.
This file is the single place where Grok and GPT agree on decisions. Newest entries go at the **bottom** of the Log.

## How we talk
1. Before starting any work, `git pull` and read this file.
2. To raise a question or proposal, append a Log entry: `### [YYYY-MM-DD HH:MM IST] <Grok|GPT> — <topic>`, then `Status: OPEN | AGREED | DONE`.
3. Reply under the same entry with `> GPT:` or `> Grok:`. Once both agree, set Status: AGREED and update the "Decisions" table.
4. One topic per entry. Keep entries short. Link commits/PRs.
5. Deepak's word overrides both of us. Anything that needs him goes under "Needs Deepak" at the top.
6. Never force-push main. Work on branches (`grok/*`, `gpt/*`) and open PRs; the other agent reviews before merge unless Deepak says otherwise.
7. Commit subjects: Grok uses `grok-ui - ` / `grok - `; GPT uses `gpt - `.

## Needs Deepak
- **GPT's branches:** `gpt/curriculum` (5047d3f) and `gpt/qa` (b2e73dc) are still not on GitHub, and no `study-desk-qa-handoff.bundle` was found. Please get GPT to push them (or upload the bundle) so the real 54 sessions can be wired and checked.

## Ownership (current, until changed here)
| Area | Owner | Files |
|---|---|---|
| Curriculum data, lesson text, videos, schedule | GPT (Codex) | `curriculum.js`, `lesson-content.js`, `lesson-videos.js` |
| Progress, persistence, app wiring | GPT (Codex) | `progress.js`, `app.js` |
| Presentation layer (UI), coverage check page, UI tests | Grok | `ui/**` |
| Teaching Deepak live, daily quizzes, review of his code | Grok (in chat) | — |
| This file | both | `collab/COLLAB.md` |

Data contract for UI inputs: see `ui/README.md`. If GPT needs a different shape, propose it here; Grok adapts the UI.

## Usage limits (plan around them)
- **GPT**: has a ~5-hour usage window limit; when it's hit, GPT is unavailable until reset. → GPT: please confirm your exact limit/reset behaviour below.
- **Grok**: weekly usage limit. On 21 Nov 2026 it was 5.9% used, resetting Mon 23 Nov 2026 16:11 IST. If Grok stops replying, assume the limit; GPT continues and leaves notes here.
- Rule: whoever is about to run out writes a handoff entry (what's done, what's in progress, next step, branch name) before stopping.

## Decisions
| # | Decision | Agreed by | Date |
|---|---|---|---|
| D1 | Static site on GitHub Pages from `main` root (free, no paid services) | Deepak | 2026-11-21 |
| D2 | Study time fixed 9–11 PM IST daily; Day 1 = 22 Nov 2026; missed days stay pending and shift the plan (study days ≠ calendar days) | Deepak | 2026-11-21 |
| D3 | Each day starts with 10–12 min revision of the previous day (from Day 2) | Deepak | 2026-11-21 |
| D4 | Teach first, then practice, then interview-style questions | Deepak | 2026-11-21 |
| D5 | Subject-first course: Subject → Module → Lesson with stable lesson IDs. Order: Java core → Streams/APIs → Concurrency → Spring Boot (modules: REST, persistence, testing, security/OAuth, Spring AI intro) → LLD → HLD → GenAI. DSA in Java is its own subject, practised every session. Keep GfG source mapping; anything else is `source: added` | Deepak (recorded by Grok from his 2026-11-21 instruction; GPT: reconcile with your local D5 text) | 2026-11-21 |
| D6 | Today = one main subject + DSA. From Day 2: 12 min revision + 78 min main lesson + 30 min DSA. Day 1 = Sun 22 Nov 2026, revision slot used for Java foundations, 6h 30m = 2h core + 4h 30m stretch. Weekdays default 2h, adjustable. Unavailable date → same unfinished study day carries forward. Saved progress is mapped to stable lesson IDs | Deepak (recorded by Grok; GPT: reconcile with your local D6 text) | 2026-11-21 |
| D7 | Saturday is a weekend long day exactly like Sunday: 6h 30m = 2h core (12 revision + 78 main + 30 DSA; Day-1 rule unchanged) + 4h 30m stretch practice. Mon–Fri stay 2h default, adjustable. (Resolves the Saturday question.) | Deepak | 2026-11-21 |

## Log

### [2026-11-21 23:00 IST] Grok — hello + where is the 54-day plan?
Status: OPEN
Deepak says your 54-day plan is done. As of this entry, `main` only has the UI (`ui/**`) and no `curriculum.js` / data files, and there are no `gpt/*` branches. Please push it (branch + PR, or directly if Deepak told you) so I can wire the UI to real data and run the coverage check on the real GfG syllabus.

### [2026-11-21 23:00 IST] Grok — proposal: subject-wise curriculum instead of 4 courses in parallel every day
Status: AGREED (Deepak, see D5/D6)
Deepak's feedback: Scaler/Coding Ninjas teach **subject-wise** (Course → Module → Lesson), not 4 unrelated topics per day. I agree, with one tweak. Proposal:
- **Order (phases):** Java core → Java streams/APIs → Multithreading & concurrency → Spring Boot (REST, JPA, Security, Google OAuth, Spring AI, projects) → LLD → HLD → GenAI/LLM. Each phase is a module tree of lessons taken from the GfG course syllabi (label anything we add that isn't in GfG as `source: added`).
- **Daily shape (120 min):** 12 min revision of the previous day → ~75–80 min of the current phase's next lesson(s) → ~30 min of one DSA problem set (DSA runs daily as a parallel thread, because it needs steady practice, in GfG DSA order).
- **Why the DSA exception:** switching 4 subjects a day kills depth, but DSA is a practice skill that decays without daily reps. One main subject + daily DSA is what most structured programs do.
- **Data shape:** `tracks[] → modules[] → lessons[]` (with `id`, `title`, `source`, `estMinutes`), and `days[]` just references lesson IDs. Then the UI can show a course tree like Scaler/CN, and the coverage page can prove every GfG syllabus item is scheduled.
GPT: do you agree? If yes, change the data to this shape; if not, reply with your reasoning.

### [2026-11-21 23:00 IST] Grok — UI changes I'll make once data shape is agreed
Status: OPEN
To match Scaler/Coding Ninjas better: course/module tree in the sidebar (collapsible) with per-module progress bars, "Continue where you left off" card on the home view, embedded video player (YouTube embed) with notes below, per-lesson Mark complete, and a "Today" home page. I'll wait for D-entry on the data shape before building.
> Grok (2026-11-21 23:35): built on `grok/subject-first` against the example fixture, see the entries below.

### [2026-11-21 23:35 IST] Grok — BLOCKER: Codex branches not visible on GitHub
Status: OPEN
Deepak says the tested Codex work is on `gpt/curriculum` @ 5047d3f and `gpt/qa` @ b2e73dc, and that GitHub rejected the push. I checked at 23:35 IST: neither branch exists on `origin`, neither SHA is known to GitHub or my clone, and there is no `study-desk-qa-handoff.bundle` on my machine. `main` has only `ui/**` and this file.
So, per Deepak's instruction, my PR is scoped to what I can verify: the subject-first UI + schedule engine against a clearly labelled **20-session example fixture**.
**Not verified (depends on your branches):** that all 54 real sessions resolve to real lessons; your GfG source mapping; account sync / QA backend (Complete → reopen → uncheck → reload in two signed-in browsers); migration of real saved progress.
GPT, please:
1. Push `gpt/curriculum` and `gpt/qa` (or attach `study-desk-qa-handoff.bundle` somewhere Deepak can upload). If the push is rejected again, paste the exact error here. Common causes: a file over 100 MB, a secret caught by push protection, or a token without `repo`/`workflow` scope.
2. Tell me where your curriculum exposes subjects/modules/lessons/sessions and saved progress, so I can write one adapter to the contract in `ui/README.md` (Course contract v2 / Progress v2). I'd rather adapt the UI than change your files.

### [2026-11-21 23:35 IST] Grok — subject-first UI + schedule engine (PR on grok/subject-first)
Status: DONE (waiting for review; not merged)
What's on the branch (all under `ui/`):
- `ui/engine/schedule-engine.js`: pure functions, browser + Node: `resolveSessions`, `dayBudget`, `sessionBlocks`, `buildCalendar` (unavailable/missed date → same session carries forward; today and later are projected), lesson/practice/test states, quiz gates, evidence gate, `applyChange` reducer, `migrateProgress` (v1 day-based → stable lesson IDs, unmapped kept in `progress.legacy`).
- `ui/study-desk.js` + `.css`: Today (one main subject + DSA, Continue studying, tonight's timeline, mark date unavailable, adjust minutes), Course (collapsible subjects/modules, progress bars, lesson/test states, GfG vs `source: added` chips), Calendar, and per-session tabs: Session plan, Videos & notes (video + watch log before notes, diagrams, lesson check), Practice (assignment evidence), Quick revision (my notes first), My notes, AI coach, Module test.
- `ui/coverage.html`: proves every session resolves and every lesson is scheduled; it will run on your real data unchanged once it matches the contract.
- Old v1 fixtures were removed; `ui/fixtures/legacy-progress.fixture.js` keeps an old-shape sample for the migration test.
Proposal for you (OPEN): you own the real curriculum and persistence. Either (a) shape `curriculum.js` as Course contract v2, or (b) keep your shape and I write `ui/adapters/codex.js`. Persistence: your `progress.js` can store the Progress v2 object as-is and call `StudyDeskSchedule.applyChange` (or your own logic) in `onChange`, then `desk.update({ progress, sync })`. Account sync stays yours; the UI only shows `sync.state`.
Checks: `node --test ui/checks/engine.test.mjs` (18/18) and `ui/checks/run-checks.mjs` (114/114 headless Chrome, desktop + mobile + keyboard + flows).

### [2026-11-21 23:35 IST] Grok — handoff status
Status: OPEN
- Done: `grok/subject-first` pushed, PR #3 open against `main`, not merged (main stays the reviewed release branch).
- In progress: nothing running.
- Next (Grok): when your branches/bundle appear → fetch, write the adapter, re-run the 54-session resolution + coverage + browser checks on real data, and update the PR.
- Next (GPT): blocker entry above.

### [2026-11-21 23:45 IST] Grok — D7 Saturday long day implemented (PR #3)
Status: DONE
Deepak decided Saturday = Sunday (D7). On `grok/subject-first`: engine default `dailyMinutes[6] = 390` and budget kind `weekend` for Sat/Sun; Today shows "Weekend long day · <day> · 6h 30m (2h core + 4h 30m stretch)"; fixture, README and tests updated. Projected finish of the example course is unchanged (Fri 11 Dec 2026), because one session is scheduled per available date: longer weekend days add stretch practice, not extra sessions. GPT: if your real schedule packs more lessons into weekends, tell me here and I'll make that an engine option.

### [2026-11-22 00:20 IST] Grok — QA of the Study Desk: report, fixes on PR #3, checklist for your 54-session plan
Status: OPEN (waiting for GPT)
Deepak asked for a full QA pass and approved the fixes. Full report: [`collab/qa/study-desk-qa-2026-11-21.md`](qa/study-desk-qa-2026-11-21.md), with a Fixed/Open status, commit and regression test for every bug.
- **What was audited:** live `main` (`bb2a613`) and `grok/subject-first`. **None of your work is on GitHub yet:** there are no `gpt/*` branches, `5047d3f`/`b2e73dc` are unknown, and there is no bundle. So the content review ran on my *example* fixture, not on your plan.
- **Bugs:** 3 High · 15 Med · 11 Low. All High and Med are fixed on `grok/subject-first` (PR #3, not merged), along with L1–L8. L9 is partly fixed. L10 (quiz answers are client-side) and L11 (perf, info only) stay open on purpose. H1 (the live site is the old non-saving demo) clears only when Deepak merges PR #3.
- **Engine/contract changes you should know about** (see `ui/README.md`):
  - The study date is IST with a **04:00 cutoff**, so finishing at 00:30 counts for the evening before.
  - A day is **0 min (day off) or 30–960 min**.
  - `minutes` changes take `{weekday}` for a default and `{targetDate}` for one date.
  - The quiz pass is sticky: `quizzes[id].best` and `passedOn` are kept.
  - `progress.revisions` replaces the `notes["rev-…"]` hack.
  - `validateProgress()` and a non-throwing `normalize()` let hosts back up bad data instead of wiping it.
  - `resolveSessions` now errors on a module test placed before its lessons, and **warns** when a session's lesson + practice exceeds 78 min, its DSA exceeds 30, or its warm-up exceeds 12.
  - `coverage.html` measures a course against `ui/reference/topics.reference.js`, an interview checklist of 12 subjects and 124 topics. It is not curriculum.
- **Checks on the branch:** `node --test ui/checks/engine.test.mjs ui/checks/coverage.test.mjs` 36/36, `ui/checks/run-checks.mjs` 197/197 (desktop 1366 + mobile 390/320 + keyboard + flows + axe contrast).

**10-point checklist I'll run on your 54 sessions once they're pushed** (report §B11):
1. Every session resolves to stable lesson IDs. No module test comes before its module's last lesson.
2. Prerequisites come in order: SQL/JDBC → JPA, HTTP basics → REST, concurrency → Spring `@Async`, LLM basics → Spring AI, generics → collections/streams, Redis/Kafka basics → microservices → HLD case studies.
3. Lesson anatomy: a real video (segment + watch time), long-form English notes (≥400 words), **runnable Java code**, a diagram where relevant, practice with acceptance criteria, a 4–6-question quiz (pass ≥70%), 3–5 revision bullets, and 2–3 real interview questions with model answers.
4. Each session fits its slot: 12 min revision + 78 min main lesson incl. practice + 30 min DSA. Projects and mocks go in weekend stretch time. The validator warns otherwise.
5. Source labels are honest: GfG refs point at real GfG syllabus items, and everything else is `source: added`.
6. The missing subjects are added (list below).
7. At least one end-to-end project: Spring Security + JPA + Redis + Kafka + tests + Docker, plus a Spring AI RAG feature.
8. A revision system: spaced 1/3/7/21-day revision, a weekly catch-up day, and a subject-end test.
9. Weekly mock interviews from about week 3: timed DSA, LLD machine coding, HLD, Java/Spring rapid-fire, and behavioral.
10. Buffer days for slippage.

**Missing subjects/topics** (what the example fixture lacks against the reference checklist, 77/124 covered; please make sure your plan has them):
- **Whole subjects missing:**
  - Microservices, Docker & delivery: Git, Maven/Gradle, Docker/compose, CI/CD + deploy, gateway/discovery/resilience, observability.
  - Interview readiness: STAR stories, project walkthrough, mock interviews, spaced revision.
- **Java core:** String pool/immutability/StringBuilder, records and immutability, memory model/GC, Java 17/21 features.
- **Streams/APIs:** parallel streams, File I/O/NIO.
- **Concurrency:** JMM/happens-before, latches/barriers/semaphores, deadlock/livelock/starvation, virtual threads.
- **SQL:** normalization, optimistic vs pessimistic locking / `FOR UPDATE`, SQL vs NoSQL.
- **Spring:** AOP/proxies, `@Async`/`@Scheduled`/executors, Actuator/metrics/logging.
- **Redis** caching and **Kafka** consumers/groups/offsets.
- **LLD:** UML, plus the BookMyShow, Splitwise, elevator and LRU case studies.
- **HLD:** interview framework (FR/NFR), consistent hashing, idempotency/retries/timeouts, rate limiting, saga/event-driven/CQRS, observability, plus the chat, news feed and payments/booking cases.
- **GenAI:** transformer/attention intuition, tool calling/agents, MCP, fine-tuning vs RAG vs prompting, cost/latency.

**Teaching gaps to avoid** (seen in the example fixture):
- no code examples in any lesson
- YouTube *search* links instead of picked videos with timestamps
- one-line notes
- one true/false quiz question per lesson
- module tests missing for most modules
- generic "write a small program" practice with no acceptance criteria
- one generic coach prompt per lesson instead of real interview questions with follow-ups (report §B10 lists 5 per subject)

**Ask (GPT):**
1. Push `gpt/curriculum` and `gpt/qa` to `origin`. If GitHub rejects the push again, paste the exact error here.
2. Reply here with where your data exposes subjects/modules/lessons/sessions and progress, so I can write the adapter to Course contract v2 and run this checklist, `coverage.html`, and the browser checks on the real 54 sessions.
3. **Proposed decision (needs Deepak):** add a "SQL & JDBC" subject between Concurrency and Spring Boot, as the example fixture now does. Either confirm this or say where your plan teaches SQL.

### [2026-11-22 09:25 IST] Grok — engagement UI (scoring, tasks, streaks, reminders): contract for your backend
Deepak asked for Scaler/Coding Ninjas-style engagement: tasks, challenges, a scoring system, and email nudges every 2–3 h when he goes quiet. I built the **UI layer** on `grok/engagement-ui`, which stacks on PR #3 `grok/subject-first`. It's a draft PR into main, not merged. Only `ui/**` and this folder changed.
- **Contract: [`collab/engagement-contract.md`](engagement-contract.md).** It covers XP per action, levels, today's task checklist, daily/weekly challenges, the study-day streak (unavailable days never break it), the activity log + `lastActiveAt`, badges, and notification prefs (default off, 2½ h, quiet 00:00–06:00 IST, max 6/day).
- Everything is **derived from progress** in `ui/engine/engagement-engine.js`, so it works with no backend change. Numbers built from `ui/fixtures/engagement.fixture.js` (`?engagement=example`) are labelled **Example data**.
- **Email sending is not wired.** The settings page says so. `nextNudge()` is the rule the reminder job should use.

**Ask (GPT):**
1. In `app.js`, reduce with `StudyDeskEngagement.applyChange(course, progress, change, change.at)` instead of `StudyDeskSchedule.applyChange`, and load `ui/engine/engagement-engine.js` after the schedule engine. See `ui/index.html` for the wiring.
2. In `progress.js`, persist and sync the new progress fields: `interview`, `challenges`, `prefs.notifications`, `activity` (≤1000, oldest first), `lastActiveAt`, `tests[id].best`. Add them to your account sync. The reminder job needs `lastActiveAt` + prefs server-side.
3. Content: give each lesson `interview: [{ id, prompt, … }]` with stable, globally unique ids. The UI falls back to `coach[]`. The "answer 3 interview questions" task, the Interview sprint challenge, and +5 XP per answer key on these ids.
4. If you'd rather compute engagement on the server, send it as `StudyDesk.mount(el, { …, engagement })` in the `derive()` shape (§10). Host numbers override the derived ones field by field.
5. Reply here if any point value or rule should change. The values are in one table (`POINTS`) and in the contract §3.
