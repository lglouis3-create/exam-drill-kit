#!/bin/bash
# core/ci_course.sh <course> from the worktree; log and exit code to evidence/<label>.log
export NODE_PATH=/opt/node22/lib/node_modules
K=/home/user/exam-drill-kit/.claude/worktrees/agent-a2f96217f6a817521
E=/tmp/port-short-answer-graphs/evidence
label=$2
(cd "$K" && TMPDIR=/tmp/port-short-answer-graphs/tmp bash core/ci_course.sh "$1" chromium) > "$E/$label.log" 2>&1
echo "exit=$?" >> "$E/$label.log"
grep -E "^(PASS|FAIL|NOT RUN|REPORT) |^== |passed|exit=" "$E/$label.log" | tail -n 40
