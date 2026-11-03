#!/usr/bin/env bash
# bcourse.sh KIT DEST : the everything-on course of evidence/integration-3 (logs/ci-all-patched.log
# order), built as core/ci_course.sh builds a modules: course, then build.py. No checks run here.
set -euo pipefail
kit="$1"; course="$2"
order="chained-problem-sets concept-statuses formulas-in-text equation-drill glossary-tap module-pages notes pair-up-drills paper-picker plan-the-problem quiz-prep-cards short-answer-graphs stopwatch study-controls terms-variables theme worksheets-ink wrong-number-diagnosis"
rm -rf "$course"; mkdir -p "$course/src"
cp -r "$kit/template/." "$course/src/"; cp -r "$kit/core/." "$course/src/"; mv "$course/src/CLAUDE.md" "$course/CLAUDE.md"
echo "== modules switched on, in this order: $order"
for m in $order; do
  mkdir -p "$course/src/features/$m"; cp -r "$kit/features/$m/current/." "$course/src/features/$m/"
  echo "-- $m: node features/$m/ci/oncourse.js"
  node "$kit/features/$m/ci/oncourse.js" "$kit" "$course/src" || { echo "FAIL: features/$m/ci/oncourse.js exited non-zero"; exit 1; }
done
(cd "$course" && git init -q && git add -A && git -c user.email=ci@example.invalid -c user.name="kit checks" commit -qm "scratch course" >/dev/null)
(cd "$course/src" && python3 build.py 2>&1 | grep -E "index.html|Error|error|refus|stop" | tail -3)
