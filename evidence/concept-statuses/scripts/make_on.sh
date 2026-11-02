#!/bin/bash
# make_on.sh <dest> [extra module ...]: a fresh template course with concept-statuses (and the extra
# modules copied in, not switched on), ci/oncourse.js run on it, built, and committed as ONE commit,
# as core/ci_course.sh module:<name> does (state_check.js reads the commits)
W=/home/user/exam-drill-kit/.claude/worktrees/agent-a08a9b359b929ddbc
D=$1; shift
bash /tmp/port-tools/mkcourse.sh "$W" "$D" concept-statuses "$@"; echo "mkcourse exit $?"
node "$W/features/concept-statuses/ci/oncourse.js" "$W" "$D/src"; echo "oncourse exit $?"
rm -rf "$D/.git"
cd "$D" && git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm "scratch course with concept-statuses"; echo "commit exit $?"
cd "$D/src" && python3 build.py > "$D/build.log" 2>&1; echo "build exit $?"
