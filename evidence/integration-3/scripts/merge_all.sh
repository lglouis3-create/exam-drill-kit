#!/bin/bash
# Merge the 14 port heads (merged-shas.txt), in the coordinator's order, into integration/ports-2026-11-03.
set -e
P=/tmp/port-integration-3
cd /home/user/exam-drill-kit/.claude/worktrees/agent-af710a00790ac0d8b
test "$(git rev-parse --abbrev-ref HEAD)" = integration/ports-2026-11-03
for b in plan-the-problem glossary-tap pair-up-drills short-answer-graphs study-controls worksheets-ink terms-variables concept-statuses theme paper-picker quiz-prep-cards module-pages stopwatch notes; do
  sha=$(grep "^origin/port/$b " $P/merged-shas.txt | cut -d' ' -f2)
  msg="Integration (never merged): merge port/$b ${sha:0:7}

# [redacted in the evidence copy: the Co-Authored-By trailer line the merge commits carry]
Claude-Session: https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV"
  if git -c user.name="Claude" -c user.email="noreply@anthropic.com" merge --no-ff -q "$sha" -m "$msg" > $P/logs/merge-$b.log 2>&1; then
    echo "$b $sha clean"
  else
    echo "$b $sha conflicts: $(git diff --name-only --diff-filter=U | tr '\n' ' ')"
    $P/scripts/resolve_commit.sh >> $P/logs/merge-$b.log 2>&1 || { echo "STOPPED at $b"; tail -3 $P/logs/merge-$b.log; exit 3; }
  fi
done
git log --oneline -1
