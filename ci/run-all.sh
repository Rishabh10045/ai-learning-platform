#!/usr/bin/env bash
# Runs every Study Desk test suite. Used by .github/workflows/ci.yml and locally:
#   (cd ci && npm install) && CHROME=/usr/bin/google-chrome bash ci/run-all.sh [outDir]
# Needs Node 22.13+ (node:sqlite), Java 21 on PATH (or JAVA=...), and Chrome (CHROME=...).
set -uo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-${RUNNER_TEMP:-/tmp}/study-desk-ci}"
mkdir -p "$OUT"
export NODE_PATH="${NODE_PATH:-$PWD/ci/node_modules}"
export CHROME="${CHROME:-/usr/bin/google-chrome}"
status=0; summary=()
run() {
  local name="$1"; shift
  echo "::group::$name"
  if "$@" 2>&1 | tee "$OUT/$name.log"; then summary+=("PASS  $name"); else summary+=("FAIL  $name"); status=1; fi
  echo "::endgroup::"
}
run backend      node --test checks/study-backend.test.mjs
run engine       node --test ui/checks/engine.test.mjs
run adapter      node --test ui/checks/adapter.test.mjs
run upgrade      node --test ui/checks/upgrade.test.mjs
run coverage     node --test ui/checks/coverage.test.mjs
run java         node checks/java-examples.mjs
run browser      node ui/checks/run-checks.mjs "$OUT/browser"
run day1-2       node ui/checks/day1-integration.mjs "$OUT/day1"
run integrated   env STUDY_SCREENSHOTS="$OUT/integrated" node checks/integrated.mjs
run qa-browser   node checks/qa-browser.mjs
echo; printf '%s\n' "${summary[@]}"
for f in "$OUT"/{backend,engine,adapter,upgrade,coverage}.log; do printf '%s: %s\n' "$(basename "$f" .log)" "$(grep -E '^ℹ (pass|fail)' "$f" | tr '\n' ' ')"; done
for f in java browser day1-2 integrated qa-browser; do printf '%s: %s\n' "$f" "$(grep -E 'passed|compile and run' "$OUT/$f.log" | tail -1)"; done
exit $status
