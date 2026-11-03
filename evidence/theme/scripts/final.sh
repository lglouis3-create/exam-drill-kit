#!/bin/bash
# final.sh: the reruns on the final port/theme commit (worktree at that commit), one at a time.
R=/tmp/port-theme/tools/run.sh
K=/home/user/exam-drill-kit/.claude/worktrees/agent-a645cc070760fe696
bash /tmp/port-theme/tools/mkon.sh /tmp/port-theme/c-final2 > /tmp/port-theme/evidence/logs/build-c-final2.log 2>&1; echo "build c-final2 exit $?" >> /tmp/port-theme/evidence/logs/build-c-final2.log
for i in 1 2 3; do bash $R final2-theme-test-run$i /tmp/port-theme/c-final2/src node features/theme/test.js; done
bash $R final2-run_checks-c-final2 /tmp/port-theme/c-final2/src bash ./run_checks.sh
FIXTURE=1 bash /tmp/port-theme/tools/mkon.sh /tmp/port-theme/c-own-final2 > /tmp/port-theme/evidence/logs/build-c-own-final2.log 2>&1; echo "build c-own-final2 exit $?" >> /tmp/port-theme/evidence/logs/build-c-own-final2.log
bash $R final2-run_checks-c-own /tmp/port-theme/c-own-final2/src bash ./run_checks.sh
mkdir -p /tmp/port-theme/tmp
TMPDIR=/tmp/port-theme/tmp bash $R final2-ci_course-module-theme $K bash core/ci_course.sh module:theme chromium
echo FINAL2-DONE
bash /tmp/port-theme/tools/sweep.sh; echo SWEEP-DONE
