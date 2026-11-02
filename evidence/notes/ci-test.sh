#!/bin/bash
# HARDEN 9b: a fresh course with notes copied in, ci/oncourse.js, build, module test; then a second run must refuse
W=/home/user/exam-drill-kit/.claude/worktrees/agent-ad792d8c15dc40f9c
D=/tmp/port-notes/ci-course
/tmp/port-tools/mkcourse.sh $W $D notes || exit 10
node $W/features/notes/ci/oncourse.js $W $D/src; echo "oncourse exit $?"
node $W/features/notes/ci/oncourse.js $W $D/src; echo "second oncourse exit $? (expected 1)"
cd $D/src && git add -A && git -c user.email=t@t -c user.name=t commit -qm "notes on by ci script"
python3 build.py > /tmp/port-notes/evidence/logs/ci-build.log 2>&1; echo "build exit $?"
python3 build.py --list-features
NODE_PATH=/opt/node22/lib/node_modules node features/notes/test.js > /tmp/port-notes/evidence/logs/ci-moduletest.log 2>&1; echo "module test exit $?"
tail -1 /tmp/port-notes/evidence/logs/ci-moduletest.log
