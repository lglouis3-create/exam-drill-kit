#!/bin/bash
# eqcourse_run.sh <courseDir>: a fresh template course with formulas-in-text, equation-drill and
# terms-variables on, each switched on by its own ci/oncourse.js (needs first), committed, built.
KIT=/home/user/exam-drill-kit/.claude/worktrees/agent-a034bc474dd221e7e
E=/tmp/port-terms-variables/evidence/logs
C=$1; tag=$(basename "$C")
bash /tmp/port-tools/mkcourse.sh "$KIT" "$C" formulas-in-text equation-drill terms-variables || exit 1
: > "$E/$tag-oncourse.log"
for m in formulas-in-text equation-drill terms-variables; do
  node "$KIT/features/$m/ci/oncourse.js" "$KIT" "$C/src" >> "$E/$tag-oncourse.log" 2>&1
  echo "$m oncourse.js exit $?" | tee -a "$E/$tag-oncourse.log"
done
cd "$C" && git add -A && git -c user.email=t@t -c user.name=t commit -qm "ci data"
cd "$C/src" && python3 build.py > "$E/$tag-build.log" 2>&1
echo "build.py exit $?" | tee -a "$E/$tag-build.log"
