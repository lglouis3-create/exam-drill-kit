#!/bin/bash
# waitgh.sh RUN_ID : wait until every job of the kit checks run has completed, then print the jobs.
cd /home/user/exam-drill-kit/.claude/worktrees/agent-a19b17cd73b0be458 || exit 1
for i in $(seq 1 100); do
  left=$(gh api "repos/lglouis3-create/exam-drill-kit/actions/runs/$1/jobs" --jq '[.jobs[] | select(.status != "completed")] | length')
  [ "$left" = "0" ] && break
  sleep 30
done
gh api "repos/lglouis3-create/exam-drill-kit/actions/runs/$1/jobs" --jq '.jobs[] | [.id, .name, .status, .conclusion, .started_at, .completed_at] | @tsv'
gh api "repos/lglouis3-create/exam-drill-kit/actions/runs/$1" --jq '[.id, .head_sha, .event, .status, .conclusion, .html_url] | @tsv'
