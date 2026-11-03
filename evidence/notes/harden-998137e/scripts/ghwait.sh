#!/usr/bin/env bash
# ghwait.sh <run id> <out>: waits for the GitHub Actions run to complete, then writes its jobs to <out>.
run="$1"; out="$2"
while [ "$(gh api "repos/lglouis3-create/exam-drill-kit/actions/runs/$run" --jq .status 2>/dev/null)" != completed ]; do sleep 60; done
gh api "repos/lglouis3-create/exam-drill-kit/actions/runs/$run" --jq '[.id,.head_sha,.event,.status,.conclusion,.html_url] | @tsv' > "$out"
gh api "repos/lglouis3-create/exam-drill-kit/actions/runs/$run/jobs?per_page=50" --jq '.jobs[] | [.id,.name,.status,.conclusion] | @tsv' >> "$out"
cat "$out"
