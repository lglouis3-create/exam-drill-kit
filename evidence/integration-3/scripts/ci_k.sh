#!/bin/bash
# ci_k.sh NAME KIND [LABEL]: as ci.sh, but the kit is $KIT (default: the integration worktree).
# LABEL (e.g. "patched") goes into COMMANDS.tsv's command column.
export NODE_PATH=$(npm root -g)
K=${KIT:-/home/user/exam-drill-kit/.claude/worktrees/agent-af710a00790ac0d8b}
N=$1; KIND=$2; LABEL=${3:-}
export TMPDIR=/tmp/port-integration-3/ci/$N
rm -rf "$TMPDIR"; mkdir -p "$TMPDIR"
LOG=/tmp/port-integration-3/logs/ci-$N.log
start=$(date -u +%H:%M:%S)
{ echo "== kit $K at $(git -C $K rev-parse --short HEAD) ${LABEL:+($LABEL: $(git -C $K diff --stat | tail -1))}"; } > "$LOG"
timeout 2400 bash $K/core/ci_course.sh "$KIND" chromium >> "$LOG" 2>&1
code=$?
echo "exit $code" >> "$LOG"
printf '%s\t%s\t%s\t%s\t%s\n' "$start" "$TMPDIR" "${LABEL:+[$LABEL kit $K] }core/ci_course.sh $KIND chromium" "$code" "$LOG" >> /tmp/port-integration-3/logs/COMMANDS.tsv
echo "== $N ($KIND) exit $code"; grep -E "^[0-9]+ PASS|^FAIL|^NOT RUN|^REPORT|switched on" "$LOG" | cut -c1-300
