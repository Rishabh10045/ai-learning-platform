# Changelog

Live site: https://rishabh10045.github.io/ai-learning-platform/ (GitHub Pages, `main` root).
Newest release first. Times are IST. Every release keeps the progress key `ai-learning-platform.study-desk.v1` and existing lesson IDs, unless an entry says otherwise.

## Unreleased
- Days 41–43 meet the content standard: tool calling and MCP, AI security, latency and cost, and when to customize a model. Each day has topic packets with runnable Java (ToolGate, McpDispatch, OutputGuard, BudgetedCall, StaleKnowledge), a 30-minute DSA lane (valid brackets, sliding-window limiter, top-k with a heap), 4-option self-checks with 2 extra questions, fuller interview answers, and 4h 30m stretch plans for Sat 2 Jan and Sun 3 Jan.
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
