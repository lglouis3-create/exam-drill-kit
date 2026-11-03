#!/bin/bash
# summary.sh: for each course under ci/, the run_checks.sh totals and the last line of every
# module test and of home_test.js. Copies each run's per-check logs to logs/checks-<course>/.
for d in /tmp/port-integration-3/ci/*/; do
  n=$(basename $d)
  L=$(ls -d $d/drill-checks-* $d/kit-ci-*/../drill-checks-* 2>/dev/null | head -1)
  [ -z "$L" ] && L=$(ls -d $d/*/drill-checks-* 2>/dev/null | head -1)
  echo "## $n"
  grep -E "^[0-9]+ PASS" /tmp/port-integration-3/logs/ci-$n.log | sed 's/; logs in.*//'
  grep -E "^(FAIL|NOT RUN|REPORT) " /tmp/port-integration-3/logs/ci-$n.log | cut -c1-200
  if [ -n "$L" ]; then
    mkdir -p /tmp/port-integration-3/logs/checks-$n; cp $L/*.log /tmp/port-integration-3/logs/checks-$n/
    for f in $L/features__*.log $L/home_test.js.log; do [ -f $f ] && echo "  $(basename $f .log): $(grep -E '^(PASS|FAIL|NOT RUN)' $f | tail -1 | cut -c1-220)"; done
  fi
done
