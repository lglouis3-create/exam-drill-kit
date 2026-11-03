#!/bin/bash
# mkc.sh DEST : a fresh template course with stopwatch copied in and switched on by its
# ci/oncourse.js, committed, then built.
set -e
KIT=/home/user/exam-drill-kit/.claude/worktrees/agent-a19b17cd73b0be458
DEST=$1
bash /tmp/port-tools/mkcourse.sh "$KIT" "$DEST" stopwatch
node "$KIT/features/stopwatch/ci/oncourse.js" "$KIT" "$DEST/src"
cd "$DEST" && git add -A && git -c user.email=t@t -c user.name=t commit -qm "stopwatch ci/oncourse.js"
cd "$DEST/src" && python3 build.py | tail -n 2
