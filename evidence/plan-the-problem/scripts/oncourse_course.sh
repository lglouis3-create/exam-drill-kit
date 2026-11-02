#!/bin/bash
# oncourse_course.sh KIT DEST [plain]
# The module's own course, assembled the way kit PR #27's core/ci_course.sh assembles
# `module:plan-the-problem`: template + core in src/, CLAUDE.md moved to the root, each
# module (formulas-in-text, equation-drill, plan-the-problem) copied into src/features/<m>
# and switched on by its own ci/oncourse.js in that order, then one git commit.
# formulas-in-text's and equation-drill's ci/oncourse.js are PR #27's (ccc5172), saved in
# /tmp/port-plan-the-problem/pr27/ (they are not on main yet).
# With `plain`: the two needs are switched on by one course.js line with their default
# options and no data, instead of their scripts (plan-the-problem's script then declares
# EQUATIONS itself).
set -e
KIT=$1; DEST=$2; MODE=${3:-scripts}
rm -rf "$DEST"; mkdir -p "$DEST/src"
cp -r "$KIT/template/." "$DEST/src/"
cp -r "$KIT/core/." "$DEST/src/"
mv "$DEST/src/CLAUDE.md" "$DEST/CLAUDE.md"
for m in formulas-in-text equation-drill plan-the-problem; do
  mkdir -p "$DEST/src/features/$m"; cp -r "$KIT/features/$m/current/." "$DEST/src/features/$m/"
done
if [ "$MODE" = plain ]; then
  printf "\n;COURSE.features = Object.assign({}, COURSE.features, {'formulas-in-text': {version: 'v1'}, 'equation-drill': {version: 'v2'}});\n" >> "$DEST/src/course.js"
else
  echo "-- formulas-in-text: ci/oncourse.js (main 366caf6)"; node "$KIT/features/formulas-in-text/ci/oncourse.js" "$KIT" "$DEST/src"
  echo "-- equation-drill: ci/oncourse.js (main 366caf6)"; node "$KIT/features/equation-drill/ci/oncourse.js" "$KIT" "$DEST/src"
fi
echo "-- plan-the-problem: node features/plan-the-problem/ci/oncourse.js"
node "$KIT/features/plan-the-problem/ci/oncourse.js" "$KIT" "$DEST/src"
cd "$DEST" && git init -q && git add -A && git -c user.email=ci@example.invalid -c user.name="kit checks" commit -qm "scratch course with formulas-in-text equation-drill plan-the-problem"
echo "== course ready: $DEST"
