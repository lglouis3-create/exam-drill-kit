#!/bin/bash
# Waits for a GitHub Actions run of the kit to complete, then writes its jobs and their results.
run=$1; out=$2
while true; do
  s=$(gh api "repos/lglouis3-create/exam-drill-kit/actions/runs/$run" --jq .status 2>/dev/null)
  [ "$s" = completed ] && break
  sleep 30
done
gh api "repos/lglouis3-create/exam-drill-kit/actions/runs/$run" --jq '"run \(.id) \(.name) head \(.head_sha) \(.conclusion)"' > "$out"
gh api "repos/lglouis3-create/exam-drill-kit/actions/runs/$run/jobs?per_page=100" --jq '.jobs[] | "\(.id)\t\(.name)\t\(.conclusion)"' >> "$out"
cat "$out"
