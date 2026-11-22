# Releasing Study Desk

The site is static and served by GitHub Pages from the root of `main`. Every merge to `main` is a release.

## Rules
1. Work on a branch: `grok/*` for Grok, `gpt/*` for Codex. Open a pull request to `main`. Direct pushes to `main` are blocked. The owner (Rishabh10045) can override this, but only for emergency fixes. If you override, log the reason in `collab/COLLAB.md`.
2. The required check **CI / All test suites** must be green. It runs `ci/run-all.sh`:

   | Suite | Command |
   |---|---|
   | backend | `node --test checks/study-backend.test.mjs` |
   | engine | `node --test ui/checks/engine.test.mjs` |
   | adapter | `node --test ui/checks/adapter.test.mjs` |
   | upgrade (profile saved by `0203934`) | `node --test ui/checks/upgrade.test.mjs` |
   | coverage | `node --test ui/checks/coverage.test.mjs` |
   | Java programs (JDK 21) | `node checks/java-examples.mjs` |
   | browser (desktop, 390 and 320 px, axe) | `node ui/checks/run-checks.mjs <out>` |
   | Day 1 + 2 integration | `node ui/checks/day1-integration.mjs <out>` |
   | all sessions, desktop + 320 px | `node checks/integrated.mjs` |
   | two-browser account | `node checks/qa-browser.mjs` |

   To run them locally: `(cd ci && npm ci) && CHROME=/usr/bin/google-chrome bash ci/run-all.sh`. You need Node 22.13+ and Java 21 on `PATH`.
3. Keep `ai-learning-platform.study-desk.v1` and existing lesson IDs stable. A change that renames or removes an ID needs a migration plus a test in `ui/checks/upgrade.test.mjs`.
4. Use a normal merge commit. Do not squash-merge or force-push `main`.
5. Do not deploy disruptive changes during the study slot, 21:00–23:00 IST.

## After the merge
1. Wait for the Pages build: `gh api repos/Rishabh10045/ai-learning-platform/pages/builds/latest --jq '.status+" "+.commit'` should show `built <merge sha>`.
2. Open the live site and check Today, the day you changed, and a 320 px viewport. There should be no console errors, and earlier progress should still be there.
3. Add an entry to `CHANGELOG.md` (date, merge SHA, what changed for the learner). Add a line to the `collab/COLLAB.md` log.

## Rollback
Revert the merge commit in a PR (`git revert -m 1 <merge sha>`). Progress stays in the browser under the same key, so a revert does not lose it.
