# Release QA, 23 Nov 2026 (Phase 7)

Owner: Grok. Times are IST. Build under test: `main@33fc852` plus this branch (`grok/qa-release`). The live site is re-checked after merge (see §6).

## 1. Summary

| Area | Result |
| --- | --- |
| Regression: 19 views × 1366 / 390 / 320 px | **Pass.** 57 pages, each with a heading, no page errors and no sideways scroll |
| Upgrade from every saved-progress shape (9 releases) | **Pass**, 10/10. One calendar bug was found and fixed (§3) |
| Two tabs in one browser; two separate browsers | **Pass**, 6/6 |
| axe-core WCAG 2.1 A/AA, incl. colour contrast (light and dark, 1366 and 390) | **Pass** after one fix: code blocks are now keyboard-focusable (§4) |
| CI (`ci/run-all.sh`, GitHub Actions "All test suites") | Green on this PR (§5) |
| Content standard (`node checks/content-audit.mjs 1 56`) | 16 of 56 days pass (Days 41–56). Days 37–40 are ready in PR #17, waiting for Codex's answer. Days 1–36 are Codex's (§7) |

How to rerun:
- `node ui/checks/release-qa.mjs <outDir> [baseUrl]`: regression, axe and two-browser. With no `baseUrl`, it serves this checkout. `QA_ONLY=regression,axe,two` picks sections.
- `node --test ui/checks/upgrade-matrix.test.mjs`: upgrade matrix (also part of CI).

## 2. Regression at 1366, 390 and 320 px

- Views tested: Today, Course, Calendar, Activity, Settings and Account.
  - Day 1: plan, learn, practice, revision, coach, my notes and test.
  - Day 2 learn, Day 37 learn, Day 49 learn, Day 56 plan, Day 56 coach, and an unknown hash (the not-found page).
- The study date is pinned with `?today=2026-11-23`.
- Each page needs a visible `h1`, no `pageerror` or console error, no `scrollWidth > clientWidth`, and real text.
- Screenshots: `/workspace/study-desk-checks/release-qa-local/*-{1366,390,320}.png` (local build) and `/workspace/study-desk-checks/release-qa-live/` (live, §6).
- Visual review at 390 and 320: header, chips, XP cards, task ring and tabs fit. At 320 the brand shortens to "Stu…" and the session tabs scroll sideways inside their strip (by design). The page itself never scrolls sideways.

## 3. Upgrade from every saved-progress shape

`ui/fixtures/profiles/profile-<sha>.json` holds a profile **written by that release's own host code**, using a git worktree at the SHA and running the same actions. There is one for each release on `main` since the root launch: `0203934`, `9f992de`, `60db84e`, `5baeba7`, `35bf0b2`, `d62d8d6`, `d4aca30`, `b6d53ac` and `cf892c4`. `33fc852` changes lesson data only, with no storage or host change.

`ui/checks/upgrade-matrix.test.mjs` loads each profile into the current build and asserts:
- Lesson IDs scheduled then are still scheduled on the same day.
- Day 1 is still complete with its 100% self-check, and Today is Day 2.
- The Day 2 revision, notes, takeaways, interview marks, reminder preferences and days off are all kept.
- XP and engagement derive without errors.
- Reading never rewrites the stored blob, and the first new action keeps every earlier field.

**Bug found and fixed (this branch):** builds before `cf892c4` saved *today* as the day off when a learner ticked "unavailable" on another day's page. That host bug was fixed in PR #15. A profile from those builds can hold a session finished on a date that is also marked off. `buildCalendar` used to show that day as "off" and lost the finished session. It now counts the session for that day: `advancePast` runs in the unavailable branch, with a new test in `engagement-real`.

**Known effect for real users of pre-`cf892c4` builds:** the wrongly stored day off stays in their saved data. If Today says the day is unavailable, untick it in Settings → Days off. Nothing else is lost.

**Quiz banks that grow** (raised by Codex, 01:05 COLLAB entry). A stored self-check keeps its `score` but not the size of its bank. If a bank grows from 3 to 5 questions, an old 2/3 pass would show as 2/5 and count as not passed. Today no learner can have a stored result for Days 26–56, because tests open only on the current day and the live learner is on Day 1–2. The fix is proposed to Codex in COLLAB (store `total`, grade old records against their own total). The file is Codex's.

## 4. Accessibility: axe-core 4.x, WCAG 2.1 A/AA

- Rules: tags `wcag2a`, `wcag2aa` and `wcag21aa` (includes `color-contrast`). All `<details>` are opened first, so hidden answers are checked too.
- Modes: light and dark (`prefers-color-scheme`), at 1366 and 390 px.
- Views: Today, Course, Calendar, Settings, Day 1 (plan, learn, practice, coach, test) and Day 37 learn.
- **Colour contrast: 0 violations** in both modes.
- **Fixed:** `scrollable-region-focusable`, 10 nodes on Day 1 learn. Wide Java code blocks scroll sideways, but keyboard users could not focus them. Code `<pre>` elements now have `tabindex="0"`, `role="region"` and `aria-label="Code example"` (`ui/study-desk.js`). After the fix there are 0 violations of any WCAG 2.1 A/AA rule.

## 5. Two tabs, two browsers

| Check | Result |
| --- | --- |
| A practice item completed in tab A shows in tab B with no reload (`storage` event → `host.reload()`) | Pass |
| Tab B then completes another item; reloading tab A shows both (no lost update) | Pass |
| Progress is written only to `ai-learning-platform.study-desk.v1` and its UI sidecar | Pass |
| A second, separate browser profile starts with its own empty progress | Pass (expected: without an account there is no sync) |
| No page errors in any tab | Pass |

Cross-device sync is Phase 4 work and is not live. The plan and the asks for Deepak are in `collab/sync-and-email-plan.md` (draft PR #16).

## 6. Live verification

- **Run at 01:28 IST, 23 Nov.** GitHub Pages reported `built 98b0fac`, the merge of this QA PR (#20). The live files serve the new code: the `aria-label="Code example"` in `ui/study-desk.js` and `absExact` in `late-depth.js`.
- Command: `node ui/checks/release-qa.mjs /workspace/study-desk-checks/release-qa-live https://rishabh10045.github.io/ai-learning-platform/`
- **Result: 9/9 pass.**
  - Regression: 57 pages.
  - axe, light and dark: 0 contrast issues and 0 other WCAG 2.1 A/AA violations.
  - Two tabs and two browsers: pass.
- Screenshots: `/workspace/study-desk-checks/release-qa-live/` on Grok's box. Today, Course, Calendar, Settings, Day 1 (plan, learn, practice, coach), Day 37 learn and Day 56 at 1366, 390 and 320 px, plus `two-tabs-{a,b}-1366.png`. The full results are in `release-qa.json`.

## 7. Content status (for the release notes)

- Days 41–56 meet the standard (PRs #11, #12, #14, with Codex's ledger fixes in #19).
- Days 37–40 are complete in draft PR #17. Codex owns Days 4–40, so #17 waits for Codex to say "take 37–40" or "drop".
- Days 1–3 have full content. The audit flags only the older interview answers under 80 words (Days 1–3) and a 3-question self-check (Day 3).
- Days 4–36 are Codex's. Codex is active, on Days 26–27 in PR #18.
