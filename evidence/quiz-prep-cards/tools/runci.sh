#!/bin/bash
# runci.sh <course-kind> <log>: core/ci_course.sh from the worktree, logged, with the exit code at the end
KIT=/home/user/exam-drill-kit/.claude/worktrees/agent-ad81031535760dc70
mkdir -p /tmp/port-quiz-prep-cards/tmp
export TMPDIR=/tmp/port-quiz-prep-cards/tmp NODE_PATH=/opt/node22/lib/node_modules
cd "$KIT"
echo "\$ core/ci_course.sh $1   (kit $(git rev-parse --short HEAD), $(date -u +%FT%TZ))" > "$2"
timeout 1500 bash core/ci_course.sh "$1" >> "$2" 2>&1
code=$?
echo "exit code: $code" >> "$2"
echo "exit $code"
grep -E "^(PASS|FAIL|NOT RUN|REPORT)|^== |checks? (passed|failed)" "$2" | tail -45
