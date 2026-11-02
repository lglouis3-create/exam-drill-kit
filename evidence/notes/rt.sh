#!/bin/bash
# rt.sh DIR LOG: copy the worktree's notes module into DIR's course, rebuild, run the module test into LOG
W=/home/user/exam-drill-kit/.claude/worktrees/agent-ad792d8c15dc40f9c
D=$1; LOG=$2
cp $W/features/notes/current/* $D/src/features/notes/
cd $D/src || exit 9
python3 build.py > $LOG.build 2>&1 || { echo "build failed"; exit 8; }
NODE_PATH=/opt/node22/lib/node_modules timeout 900 node features/notes/test.js > $LOG 2>&1
rc=$?
echo "exit $rc"
grep -E "FAIL|report|PASS|NOT RUN" $LOG
exit $rc
