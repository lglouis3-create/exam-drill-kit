#!/bin/bash
# gtcourse_run.sh <courseDir>: the module's own course with glossary-tap (branch port/glossary-tap
# 4762fe5, extracted to /tmp/port-terms-variables/gtkit; not part of this branch) on as well,
# each switched on by its own ci/oncourse.js, committed, built.
KIT=/home/user/exam-drill-kit/.claude/worktrees/agent-a034bc474dd221e7e
GT=/tmp/port-terms-variables/gtkit
E=/tmp/port-terms-variables/evidence/logs
C=$1; tag=$(basename "$C")
bash /tmp/port-tools/mkcourse.sh "$KIT" "$C" terms-variables || exit 1
mkdir -p "$C/src/features/glossary-tap" && cp -r "$GT/features/glossary-tap/current/." "$C/src/features/glossary-tap/"
: > "$E/$tag-oncourse.log"
node "$GT/features/glossary-tap/ci/oncourse.js" "$GT" "$C/src" >> "$E/$tag-oncourse.log" 2>&1; echo "glossary-tap oncourse.js exit $?" | tee -a "$E/$tag-oncourse.log"
node "$KIT/features/terms-variables/ci/oncourse.js" "$KIT" "$C/src" >> "$E/$tag-oncourse.log" 2>&1; echo "terms-variables oncourse.js exit $?" | tee -a "$E/$tag-oncourse.log"
cd "$C" && git add -A && git -c user.email=t@t -c user.name=t commit -qm "ci data"
cd "$C/src" && python3 build.py > "$E/$tag-build.log" 2>&1
echo "build.py exit $?" | tee -a "$E/$tag-build.log"; tail -3 "$E/$tag-build.log"
