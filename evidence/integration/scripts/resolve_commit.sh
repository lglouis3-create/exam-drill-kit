#!/bin/bash
# Resolve only the four expected files; refuse if any other file is in conflict.
set -e
cd /home/user/exam-drill-kit/.claude/worktrees/agent-afef9148abf43eda3
U=$(git diff --name-only --diff-filter=U)
echo "conflicted: $U"
for f in $U; do case "$f" in CHANGELOG.md|FEATURES.md|features/README.md|review/port-queue.md) ;; *) echo "UNEXPECTED CONFLICT: $f"; exit 3;; esac; done
for f in $U; do
  if [ "$f" = review/port-queue.md ]; then python3 /tmp/port-integration/queue_resolve.py; else python3 /tmp/port-integration/union_resolve.py "$f"; fi
  ! grep -nE '^(<<<<<<<|=======|>>>>>>>)' "$f"
  git add "$f"
done
git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q --no-edit
git log --oneline -1
