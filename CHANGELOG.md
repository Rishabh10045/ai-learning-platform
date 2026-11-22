# Changelog

Live site: https://rishabh10045.github.io/ai-learning-platform/ (GitHub Pages, `main` root).
Newest release first. Times are IST. Every release keeps the progress key `ai-learning-platform.study-desk.v1` and existing lesson IDs, unless an entry says otherwise.

## Unreleased
- Fix: on Days 2 and 3, the first AI-coach interview question showed the DSA recall prompt above the main lesson’s model answer. The question now matches its answer.
- Days 41–43 meet the content standard: tool calling and MCP, AI security, latency and cost, and when to customize a model. Each day has topic packets with runnable Java (ToolGate, McpDispatch, OutputGuard, BudgetedCall, StaleKnowledge), a 30-minute DSA lane (valid brackets, sliding-window limiter, top-k with a heap), 4-option self-checks with 2 extra questions, fuller interview answers, and 4h 30m stretch plans for Sat 2 Jan and Sun 3 Jan.
- Days 44–50 meet the content standard: Seat Booking capstone; review and interview; JVM diagnostics and virtual threads; Spring proxies, JdbcTemplate and propagation; OAuth 2.0/OIDC and object-level authorization; API gateways and SSE replay; and outbox, sagas and idempotent consumers. There are 21 new Java programs, all run in CI. New DSA lanes: merge intervals, LRU cache, deadlock-cycle DFS, topological sort, floor binary search, ring buffer and union-find. Sat 9 Jan and Sun 10 Jan get 4h 30m stretch plans. `assessmentVersion` is now 5.
- Days 51–56 meet the content standard, so all of Days 41–56 now do: SLOs and canary gates; backtracking and weighted shortest paths; Euclid, matrix rotation and deeper DP; local vs hosted model choice, a grounding gate and an end-to-end smoke run; Kruskal and minimum spanning forests; and bits, bases and primes with fuller interview answers. There are 13 new Java programs, all run in CI. New DSA lanes: prefix sums, Dijkstra vs DAG relaxation, matrix rotation, two-heap running median, Kruskal and number bases. Days 55–56 get MIT OpenCourseWare videos (minimum spanning trees; number theory). Sat 16 Jan gets a 4h 30m stretch plan.
- Corrections from Codex's ledger. Day 53: `EuclidGcd.java` uses `Math.absExact`, so `gcd(Long.MIN_VALUE, 0)` and `lcm(Long.MIN_VALUE, 1)` throw instead of returning a negative number, and the notes explain why. Day 49: the API lesson no longer calls REST "cacheable" in general. It explains the RFC 9111 conditions (method, status, Cache-Control, validators, Authorization) and contrasts a public catalog with ETag/304 against a private `no-store` booking response.
- Release QA (Phase 7): every view passes at 1366, 390 and 320 px; profiles saved by all 9 earlier releases load with nothing lost; two tabs stay in step; axe WCAG 2.1 AA finds no contrast issues in light or dark mode. Report: `collab/qa/release-qa-2026-11-23.md`.
- Fix: a session finished on a date that an older build wrongly marked as a day off now counts for that date in the calendar.
- Accessibility: wide Java code blocks can be focused and scrolled with the keyboard.
- Fix: on phones (≤ 480 px) the calendar showed "Sessio n 1" broken mid-word. Each row now shows the date and status on one line and the session title at full width below.
- Today now shows **Due revisions**. Each finished session comes back 1, 3 and 7 days later, with a different recall question each time and +10 XP for each one done. The +1 review also counts when the next session’s quick-revision block is ticked.
- Today’s tasks: optional topic packets and stretch work are listed separately, under "Optional". Finishing tonight’s core session now completes the ring and stops reminders.
- Badges match the real course. The one-lesson warm-up no longer counts as "Subject cleared". The module-test badge is hidden because the course has no module tests. New badges: First week done (7 sessions), Halfway there, Course complete and Memory keeper (10 spaced revisions).
- Fix: marking a future date unavailable on its day page marked **today** instead. The chosen date is now saved.
- CI: GitHub Actions runs every test suite on each pull request and on each push to `main` (`.github/workflows/ci.yml`, `ci/run-all.sh`).
- New checks: `ui/checks/upgrade.test.mjs` loads a learner profile written by the `0203934` release and checks that it survives. `checks/java-examples.mjs` compiles and runs every Java program shown in a lesson on JDK 21 and compares its expected output.
- Fix: on narrow phones (320 px) with wide fonts, long code words in practice text pushed the page sideways. They now wrap.
- Fix: the Day 1 warm-up concept check appeared twice. It now appears once.
- `main` is protected. Changes land through pull requests, and the CI check must pass first. See `RELEASING.md`.

## 2026-11-22 23:14 · `9f992de` · 56-day curriculum (PR #5, PR #7)
- The plan now has 56 sessions. Day 56 is new: bits, number bases, primes, sieve, and GCD/LCM in Java.
- Days 1–25 and 56 have dedicated topic packets (59 of 122 indexed topics).
- Days 7–25 have more depth. Java string identity and the HLD scaling audit were added.
- Fix: a lesson with several topic packets showed only the first one. Every packet now has its own heading and notes (PR #7).
- Upgrade check: a profile saved by `0203934` loads unchanged, and the Day 1–55 lesson IDs are identical.

## 2026-11-22 12:15 · `0203934` · Study Desk v2 on the root URL (PR #3, #4, #6)
- The root page runs Study Desk v2 with the real curriculum and keeps Codex's storage key and account API.
- Day 1 (Sunday, 6h 30m: 2h core plus 4h 30m stretch), Day 2 and Day 3 have full depth: notes, runnable Java, videos, 4-option quizzes and DSA lanes.
- Engagement: XP, levels, streak, daily and weekly challenges, badges and activity log. Email reminders are not wired yet.

## 2026-11-21 · `4c50a17` · first Study Desk UI (PR #1, #2)
- Presentation layer on fixtures, dated session plan and coverage check page.
