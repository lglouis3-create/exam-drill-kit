#!/bin/bash
# run_test.sh <courseDir> <logName> : copy the worktree's module into the course, build, run the module test
# prints the exit codes; the log goes to evidence/logs/<logName>.log
W=/home/user/exam-drill-kit/.claude/worktrees/agent-a08a9b359b929ddbc
C=$1; LOG=/tmp/port-concept-statuses/evidence/logs/$2.log
export NODE_PATH=/opt/node22/lib/node_modules
cp "$W"/features/concept-statuses/current/* "$C/src/features/concept-statuses/"
cd "$C/src" || exit 9
python3 build.py > "$LOG.build" 2>&1; echo "build exit $?"
timeout 900 node features/concept-statuses/test.js > "$LOG" 2>&1; rc=$?
echo "test exit $rc"
grep -v "^  ok" "$LOG" | grep -v "^$" | head -40
