#!/bin/bash
K=/home/user/exam-drill-kit/.claude/worktrees/agent-afef9148abf43eda3
ALL="formulas-in-text chained-problem-sets equation-drill wrong-number-diagnosis plan-the-problem glossary-tap pair-up-drills short-answer-graphs study-controls worksheets-ink terms-variables concept-statuses theme paper-picker quiz-prep-cards module-pages stopwatch notes"
/tmp/port-tools/mkcourse.sh $K /tmp/port-integration/c-probe $ALL
node /tmp/port-integration/on_generic.js $K /tmp/port-integration/c-probe/src $ALL >/dev/null
cd /tmp/port-integration/c-probe/src && python3 build.py 2>&1 | tail -30
