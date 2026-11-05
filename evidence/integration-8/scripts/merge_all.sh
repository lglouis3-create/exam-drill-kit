#!/bin/bash
# Run 8: merge the 14 current origin/port heads onto origin/main into integration/ports-2026-11-05a (never merged).
set -e
P=/tmp/port-integration-8; K=/home/user/exam-drill-kit
git -C $K fetch -q origin; git -C $K worktree prune
rm -rf $P/wt; git -C $K worktree add -q -B integration/ports-2026-11-05a $P/wt origin/main
cd $P/wt; echo "origin/main $(git rev-parse HEAD)" > $P/merged-shas.txt
for b in plan-the-problem glossary-tap pair-up-drills short-answer-graphs study-controls worksheets-ink terms-variables concept-statuses theme paper-picker quiz-prep-cards module-pages stopwatch notes; do
  sha=$(git rev-parse origin/port/$b); echo "origin/port/$b $sha" >> $P/merged-shas.txt
  msg="Integration (never merged): merge port/$b ${sha:0:7}

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV"
  if git -c user.name=Claude -c user.email=noreply@anthropic.com merge --no-ff -q "$sha" -m "$msg" > $P/logs/merge-$b.log 2>&1; then echo "$b ${sha:0:7} clean"
  else echo "$b ${sha:0:7} conflicts: $(git diff --name-only --diff-filter=U | tr '\n' ' ')"; bash $P/scripts/resolve_commit.sh >> $P/logs/merge-$b.log 2>&1 || { echo "STOPPED at $b"; tail -3 $P/logs/merge-$b.log; exit 3; }
    git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q --amend -m "$msg"; fi
done
test -z "$(git diff origin/main -- core template)" && echo "core/template unchanged"
git log --oneline -1
