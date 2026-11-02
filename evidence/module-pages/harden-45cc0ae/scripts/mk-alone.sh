#!/bin/bash
# mk-alone.sh DEST LOG [module ...]
# The module's own course: mkcourse.sh with module-pages (and any modules named after LOG
# copied in, not switched on), module-pages' ci/oncourse.js, commit, build.
set -e
KIT=/home/user/exam-drill-kit/.claude/worktrees/agent-afaac94bfc8add4ab
DEST=$1; LOG=$2; shift 2
exec >"$LOG" 2>&1
/tmp/port-tools/mkcourse.sh $KIT $DEST module-pages "$@"
echo "+ module-pages ci"
node $KIT/features/module-pages/ci/oncourse.js $KIT $DEST/src
echo "ci exit $?"
cd $DEST
git add -A
git -c user.email=t@t -c user.name=t commit -qm data
cd src
python3 build.py
echo "build exit $?"
