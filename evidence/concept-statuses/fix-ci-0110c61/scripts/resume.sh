#!/usr/bin/env bash
export NODE_PATH=$(npm root -g)
L=/tmp/port-fix-b/logs/notes
mv $L/ci_course.log $L/ci_course.cut-by-restart.log 2>/dev/null
(cd /tmp/port-fix-b/notes && timeout 3000 bash core/ci_course.sh module:notes chromium > $L/ci_course.log 2>&1); e=$?
echo "ci_course.sh module:notes (rerun after the restart) exit $e: $(grep -E '^[0-9]+ PASS' $L/ci_course.log | tail -1)" >> $L/summary.txt
/tmp/port-fix-b/tools/checks.sh quiz-prep-cards
/tmp/port-fix-b/tools/brun.sh
echo RESUMEDONE > /tmp/port-fix-b/logs/resume-done
