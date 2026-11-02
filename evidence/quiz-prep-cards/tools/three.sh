#!/bin/bash
# three.sh: the module's own course from the worktree (mkci.sh), then the module test three times on it
KIT=/home/user/exam-drill-kit/.claude/worktrees/agent-ad81031535760dc70
bash /tmp/port-quiz-prep-cards/tools/mkci.sh "$KIT" /tmp/port-quiz-prep-cards/course > /tmp/port-quiz-prep-cards/evidence/logs/mkci_5918202.log 2>&1
echo "mkci.sh (oncourse.js + build.py) exit $?"
cd /tmp/port-quiz-prep-cards/course/src
for i in 1 2 3; do
  NODE_PATH=/opt/node22/lib/node_modules node features/quiz-prep-cards/test.js > /tmp/port-quiz-prep-cards/evidence/logs/module_test_run$i.log 2>&1
  echo "run $i exit $?: $(tail -1 /tmp/port-quiz-prep-cards/evidence/logs/module_test_run$i.log)"
done
