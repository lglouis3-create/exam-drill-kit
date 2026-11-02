#!/bin/bash
# partners.sh DEST_SRC [worksheets-ink] [paper-picker]: copy partner modules' current/ from their branches (scratch only)
set -e
W=/home/user/exam-drill-kit/.claude/worktrees/agent-a1541b60afbedd42c
DEST=$1; shift
cd "$W"
for m in "$@"; do
  mkdir -p "$DEST/features/$m"
  for f in $(git ls-tree --name-only "origin/port/$m" "features/$m/current/"); do
    git show "origin/port/$m:$f" > "$DEST/features/$m/$(basename "$f")"
  done
  echo "copied $m from origin/port/$m $(git rev-parse --short origin/port/$m)"
done
