#!/bin/bash
# dry.sh KIT OUT [MODULE-TEST]: the everything-on course of evidence/integration-3 (logs/ci-all-patched.log
# order), built as core/ci_course.sh builds a module course: each module's ci/oncourse.js in that order,
# then build.py; then, if named, that module's test.js on the built course.
set -u
exec > >(tee "$2.log") 2>&1
K=$1; OUT=$2; T=${3:-}
export NODE_PATH=$(npm root -g)
ORDER="chained-problem-sets concept-statuses formulas-in-text equation-drill glossary-tap module-pages notes pair-up-drills paper-picker plan-the-problem quiz-prep-cards short-answer-graphs stopwatch study-controls terms-variables theme worksheets-ink wrong-number-diagnosis"
rm -rf "$OUT"; mkdir -p "$OUT/course/src"; C=$OUT/course
cp -r "$K/template/." "$C/src/"; cp -r "$K/core/." "$C/src/"; mv "$C/src/CLAUDE.md" "$C/CLAUDE.md"
echo "== kit $K ($(git -C $K rev-parse --short HEAD); $(git -C $K diff --stat | tail -1))"
for m in $ORDER; do
  mkdir -p "$C/src/features/$m"; cp -r "$K/features/$m/current/." "$C/src/features/$m/"
  echo "-- $m"; node "$K/features/$m/ci/oncourse.js" "$K" "$C/src" || { echo "STOP: $m ci/oncourse.js exit $?"; exit 1; }
done
(cd "$C" && git init -q && git add -A && git -c user.email=ci@example.invalid -c user.name=ci commit -qm scratch)
(cd "$C/src" && python3 build.py) > "$OUT/build.log" 2>&1; b=$?
echo "== build.py exit $b"; tail -3 "$OUT/build.log"
[ $b -ne 0 ] && exit $b
if [ -n "$T" ]; then (cd "$C/src" && timeout 900 node features/$T/test.js) > "$OUT/test-$T.log" 2>&1; t=$?; echo "== $T test.js exit $t"; tail -4 "$OUT/test-$T.log"; exit $t; fi
