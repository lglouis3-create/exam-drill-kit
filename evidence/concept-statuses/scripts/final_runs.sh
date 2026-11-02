#!/bin/bash
# final_runs.sh: on the worktree at the final commit, a fresh module course by ci/oncourse.js, the module test 3 times,
# then run_checks.sh on that course. Logs in evidence/logs/final-*.
W=/home/user/exam-drill-kit/.claude/worktrees/agent-a08a9b359b929ddbc
E=/tmp/port-concept-statuses/evidence/logs
export NODE_PATH=/opt/node22/lib/node_modules
echo "worktree HEAD $(git -C "$W" rev-parse HEAD), status: $(git -C "$W" status --short | wc -l) changed files"
bash /tmp/port-concept-statuses/scripts/make_on.sh /tmp/port-concept-statuses/final > $E/final-make.log 2>&1; cat $E/final-make.log
cd /tmp/port-concept-statuses/final/src || exit 9
for i in 1 2 3; do node features/concept-statuses/test.js > $E/final-test-$i.log 2>&1; echo "module test run $i exit $?: $(tail -1 $E/final-test-$i.log)"; done
bash ./run_checks.sh > $E/final-run_checks.log 2>&1; echo "run_checks.sh exit $?"; tail -1 $E/final-run_checks.log
grep -E "^(PASS|FAIL|NOT RUN|REPORT)" $E/final-run_checks.log | grep -v "^PASS"
