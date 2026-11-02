#!/bin/bash
# HARDEN 9b: test features/plan-the-problem/ci/oncourse.js on a fresh mkcourse.sh course.
#   ci_script_test.sh KIT <scripts|plain>
# scripts: the needs are switched on first by their own ci/oncourse.js (main 366caf6);
# plain:   the needs are switched on by one course.js line, no data (the script then declares EQUATIONS).
# Then: a second run of the script must stop non-zero; python3 build.py; the module test.
set -u
KIT=$1; MODE=$2; D=/tmp/port-plan-the-problem/ci-$MODE
export NODE_PATH=/opt/node22/lib/node_modules
/tmp/port-tools/mkcourse.sh "$KIT" "$D" formulas-in-text equation-drill plan-the-problem || exit 1
cd "$D/src"
if [ "$MODE" = plain ]; then
  printf "\n;COURSE.features = Object.assign({}, COURSE.features, {'formulas-in-text': {version: 'v1'}, 'equation-drill': {version: 'v2'}});\n" >> course.js
else
  node "$KIT/features/formulas-in-text/ci/oncourse.js" "$KIT" "$D/src"; echo "formulas-in-text ci exit=$?"
  node "$KIT/features/equation-drill/ci/oncourse.js" "$KIT" "$D/src"; echo "equation-drill ci exit=$?"
fi
node "$KIT/features/plan-the-problem/ci/oncourse.js" "$KIT" "$D/src"; echo "plan-the-problem ci exit=$?"
node "$KIT/features/plan-the-problem/ci/oncourse.js" "$KIT" "$D/src"; echo "plan-the-problem ci second run exit=$? (must be non-zero)"
printf '\n' >> ../CLAUDE.md   # the state file updated with the data, as a session would
git add -A && git -c user.email=t@t -c user.name=t commit -qm "course data for plan-the-problem"
python3 build.py > /dev/null; echo "build exit=$?"
node features/plan-the-problem/test.js | tail -n 4; echo "module test exit=${PIPESTATUS[0]}"
