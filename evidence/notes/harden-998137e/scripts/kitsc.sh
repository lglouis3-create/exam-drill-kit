#!/usr/bin/env bash
# kitsc.sh: /tmp/port-notes-h/kitsc, a scratch copy of the port/notes worktree as it stands (no .git)
# with features/study-controls taken from port/study-controls at 1c1d590. Never committed anywhere.
set -euo pipefail
wt=/home/user/exam-drill-kit/.claude/worktrees/agent-a242fd253449b7ee7
k=/tmp/port-notes-h/kitsc
rm -rf "$k"; mkdir -p "$k"
(cd "$wt" && tar --exclude=.git -cf - .) | tar -xf - -C "$k"
rm -rf "$k/features/study-controls"
git -C "$wt" archive 1c1d590 features/study-controls | tar -xf - -C "$k"
ls "$k/features/study-controls" "$k/features/study-controls/current"
