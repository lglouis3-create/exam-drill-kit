#!/bin/bash
# Every ci_course.sh course of this run, one at a time.
C=/tmp/port-integration-3/scripts/ci.sh
ALL=chained-problem-sets,concept-statuses,equation-drill,formulas-in-text,glossary-tap,module-pages,notes,pair-up-drills,paper-picker,plan-the-problem,quiz-prep-cards,short-answer-graphs,stopwatch,study-controls,terms-variables,theme,worksheets-ink,wrong-number-diagnosis
bash $C all modules:$ALL
bash $C ws-ch modules:worksheets-ink,chained-problem-sets
bash $C ws module:worksheets-ink
bash $C ch module:chained-problem-sets
bash $C gt-fit modules:glossary-tap,formulas-in-text
bash $C gt module:glossary-tap
bash $C fit module:formulas-in-text
bash $C sc-pp3 modules:study-controls,paper-picker
bash $C sc module:study-controls
bash $C pp3 module:paper-picker
bash $C nt-sc modules:notes,study-controls
bash $C nt module:notes
echo RUN_ALL_DONE
