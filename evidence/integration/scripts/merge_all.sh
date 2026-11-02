#!/bin/bash
# Merge the port branches, in the coordinator's order, at the shas listed in merged-shas-run2.txt.
set -e
cd /home/user/exam-drill-kit/.claude/worktrees/agent-afef9148abf43eda3
for b in plan-the-problem glossary-tap pair-up-drills short-answer-graphs study-controls worksheets-ink terms-variables concept-statuses theme paper-picker quiz-prep-cards module-pages stopwatch notes; do
  sha=$(grep "^origin/port/$b " /tmp/port-integration/merged-shas-run2.txt | cut -d' ' -f2)
  msg="Integration (never merged): merge port/$b ${sha:0:7}

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV"
  if git -c user.name="Claude" -c user.email="noreply@anthropic.com" merge --no-ff -q "$sha" -m "$msg" > /tmp/port-integration/logs/merge2-$b.log 2>&1; then
    echo "$b $sha clean"
  else
    echo "$b $sha conflicts: $(git diff --name-only --diff-filter=U | tr '\n' ' ')"
    /tmp/port-integration/resolve_commit.sh > /dev/null
  fi
done
git log --oneline -1
