#!/usr/bin/env bash
# DIAGNOSIS ONLY (branch claude/elegant-ptolemy-pqxb8y-pendingsave-diag; never merged).
#   .github/diag/close_runs.sh <chromium|webkit> <close|storage> <n>
# Builds the template course as core/ci_course.sh does; "close": runs close_diag.js with <n>
# trials; "storage": runs core/storage_test.js <n> times in turn, printing every run's
# "The last change" lines and one summary line per run. Nothing is retried or left out.
set -uo pipefail
br="$1"; mode="$2"; n="$3"; kit="$(cd "$(dirname "$0")/../.." && pwd)"
course="$(mktemp -d)/course"; mkdir -p "$course/src"
cp -r "$kit/template/." "$course/src/"; cp -r "$kit/core/." "$course/src/"; mv "$course/src/CLAUDE.md" "$course/"
(cd "$course" && git init -q && git add -A && git -c user.email=ci@example.invalid -c user.name=diag commit -qm diag) > /dev/null
(cd "$course/src" && python3 build.py > /dev/null) || { echo "build failed"; exit 1; }
export DRILL_BROWSER="$br"
echo "== kit $(git -C "$kit" rev-parse --short HEAD), template, $br, $mode, $n"
cd "$course/src"
if [ "$mode" = close ]; then cp "$kit/.github/diag/close_diag.js" .; exec timeout 5400 node close_diag.js "$n"; fi
pass=0
for i in $(seq 1 "$n"); do
  timeout 900 node storage_test.js > "run-$i.log" 2>&1; code=$?
  [ $code = 0 ] && pass=$((pass+1))
  echo "RUN $i $code $(grep -E '^(PASS|FAIL)' "run-$i.log" | tail -n 1 | cut -c1-220)"
  grep -E '^  FAIL' "run-$i.log" | sed 's/^/    /'
done
echo "storage_test.js: $pass of $n runs PASS"
