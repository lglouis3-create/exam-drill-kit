#!/bin/bash
# Resolve only the five allowed files (both sides kept); refuse if any other file is in conflict.
set -e
P=/tmp/port-integration-5
cd /tmp/port-integration-5/wt
U=$(git diff --name-only --diff-filter=U)
echo "conflicted: $U"
for f in $U; do case "$f" in CHANGELOG.md|FEATURES.md|features/README.md|review/port-queue.md|features/ci-combinations.txt) ;; *) echo "UNEXPECTED CONFLICT: $f"; exit 3;; esac; done
for f in $U; do
  if [ "$f" = review/port-queue.md ]; then python3 $P/scripts/queue_resolve.py; else python3 $P/scripts/union_resolve.py "$f"; fi
  ! grep -nE '^(<<<<<<<|=======|>>>>>>>)' "$f"
  git add "$f"
done
git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q --no-edit
git log --oneline -1
