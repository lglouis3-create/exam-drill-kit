#!/bin/bash
# final.sh: the final runs on the committed port branch (one at a time). Each command's exit code
# and log go to evidence/COMMANDS.tsv and evidence/logs/final-*.log.
R=/tmp/port-terms-variables/scripts/run.sh
KIT=/home/user/exam-drill-kit/.claude/worktrees/agent-a034bc474dd221e7e
S=/tmp/port-terms-variables/scripts
echo "kit HEAD $(git -C $KIT rev-parse HEAD) core $(git -C $KIT rev-parse HEAD:core) template $(git -C $KIT rev-parse HEAD:template)"
# the module's own course (ci/oncourse.js), the module test three times, then run_checks.sh
bash $S/oncourse_run.sh /tmp/port-terms-variables/f-on
for i in 1 2 3; do bash $R final-moduletest-$i /tmp/port-terms-variables/f-on/src node features/terms-variables/test.js; done
bash $R final-on-run_checks /tmp/port-terms-variables/f-on/src ./run_checks.sh
# the CI's own module courses
bash $R final-ci-module-terms-variables $KIT bash core/ci_course.sh module:terms-variables chromium
bash $R final-ci-modules-tv-eq $KIT bash core/ci_course.sh modules:terms-variables,equation-drill chromium
# with glossary-tap (branch port/glossary-tap 4762fe5) on as well
bash $S/gtcourse_run.sh /tmp/port-terms-variables/f-gt
bash $R final-gt-moduletest /tmp/port-terms-variables/f-gt/src node features/terms-variables/test.js
bash $R final-gt-glossarytaptest /tmp/port-terms-variables/f-gt/src node features/glossary-tap/test.js
# the module absent: the test must FAIL
bash $R final-absent-moduletest /tmp/port-terms-variables bash scripts/absent.sh
# the no-module template course
bash $R final-ci-template $KIT bash core/ci_course.sh template chromium
echo FINAL-DONE
