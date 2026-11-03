#!/bin/bash
# evidence.sh BRANCH START NEW: copy logs and GitHub job results into evidence/BRANCH/fix-ci-<NEW7>/
B=$1; START=$2; NEW=$3; S7=${NEW:0:7}; L=/tmp/port-fix-a/logs
D=/tmp/port-fix-a/ev-$B/evidence/$B/fix-ci-$S7; mkdir -p $D/logs $D/scripts
cp $L/$B-ci-own.log $L/$B-test-run{1,2,3}.log $L/$B-ci-allpatched.log $D/logs/
[ -f $L/$B-ci-allpatched-cut-by-restart.log ] && cp $L/$B-ci-allpatched-cut-by-restart.log $D/logs/
cp /tmp/port-fix-a/scripts/own.sh /tmp/port-fix-a/scripts/allpatched.sh $D/scripts/
OWN=$(ls -d /tmp/port-fix-a/run-$B/own/drill-checks-* | head -1); AP=$(ls -d /tmp/port-fix-a/run-$B/allpatched/drill-checks-* | head -1)
mkdir -p $D/logs/checks-own $D/logs/checks-allpatched; cp $OWN/*.log $D/logs/checks-own/; cp $AP/*.log $D/logs/checks-allpatched/
git -C /tmp/port-fix-a/$B diff $START $NEW > $D/fix.diff
full=$(git -C /tmp/port-fix-a/$B rev-parse $NEW)
gh api "repos/lglouis3-create/exam-drill-kit/actions/runs?head_sha=$full" --jq '.workflow_runs[] | [.id,.name,.event,.status,.conclusion,.html_url] | @tsv' > $D/logs/github-runs.tsv
for id in $(cut -f1 $D/logs/github-runs.tsv); do gh api repos/lglouis3-create/exam-drill-kit/actions/runs/$id/jobs --jq '.jobs[] | [.id,.name,.status,.conclusion,.completed_at] | @tsv'; done > $D/logs/github-jobs.tsv
echo $D; cat $D/logs/github-jobs.tsv
