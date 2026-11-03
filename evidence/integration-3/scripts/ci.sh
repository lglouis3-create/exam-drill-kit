#!/bin/bash
# ci.sh NAME KIND [EXTRA-LINE]: core/ci_course.sh KIND from the integration worktree, its scratch
# course kept under /tmp/port-integration-3/ci/NAME (TMPDIR), output in logs/ci-NAME.log, one line
# in logs/COMMANDS.tsv. With EXTRA-LINE (course c-1exam only) the course is built by ci_build.sh
# instead, so a line can be appended to course.js before the checks run.
export NODE_PATH=$(npm root -g)
K=/home/user/exam-drill-kit/.claude/worktrees/agent-af710a00790ac0d8b
N=$1; KIND=$2
export TMPDIR=/tmp/port-integration-3/ci/$N
rm -rf "$TMPDIR"; mkdir -p "$TMPDIR"
LOG=/tmp/port-integration-3/logs/ci-$N.log
start=$(date -u +%H:%M:%S)
timeout 2400 bash $K/core/ci_course.sh "$KIND" chromium > "$LOG" 2>&1
code=$?
echo "exit $code" >> "$LOG"
printf '%s\t%s\t%s\t%s\t%s\n' "$start" "$TMPDIR" "core/ci_course.sh $KIND chromium" "$code" "$LOG" >> /tmp/port-integration-3/logs/COMMANDS.tsv
echo "== $N ($KIND) exit $code"; grep -E "^[0-9]+ PASS|^FAIL|^NOT RUN|^REPORT|switched on" "$LOG" | cut -c1-300
