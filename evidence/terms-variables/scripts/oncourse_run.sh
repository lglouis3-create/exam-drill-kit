#!/bin/bash
# oncourse_run.sh <courseDir> [extra modules...]: a fresh template course with terms-variables
# (and the named modules) copied in, ci/oncourse.js run on it, committed, built.
KIT=/home/user/exam-drill-kit/.claude/worktrees/agent-a034bc474dd221e7e
E=/tmp/port-terms-variables/evidence/logs
mkdir -p "$E"
C=$1; shift
tag=$(basename "$C")
bash /tmp/port-tools/mkcourse.sh "$KIT" "$C" terms-variables "$@" || exit 1
node "$KIT/features/terms-variables/ci/oncourse.js" "$KIT" "$C/src" > "$E/$tag-oncourse.log" 2>&1
echo "oncourse.js exit $?" | tee -a "$E/$tag-oncourse.log"
cat "$E/$tag-oncourse.log"
cd "$C" && git add -A && git -c user.email=t@t -c user.name=t commit -qm "terms-variables ci data"
cd "$C/src" && python3 build.py > "$E/$tag-build.log" 2>&1
echo "build.py exit $?" | tee -a "$E/$tag-build.log"
tail -4 "$E/$tag-build.log"
