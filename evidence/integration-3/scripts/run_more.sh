#!/bin/bash
# After run_all.sh: the 1-exam course, and the two everything-on variants used to locate the
# glossary-tap ci data conflict (no data changed: only the order of the modules, or glossary-tap left out).
C=/tmp/port-integration-3/scripts/ci.sh
bash /tmp/port-integration-3/scripts/ci_1exam.sh
bash $C all-gt-last modules:chained-problem-sets,concept-statuses,equation-drill,formulas-in-text,module-pages,notes,pair-up-drills,paper-picker,plan-the-problem,quiz-prep-cards,short-answer-graphs,stopwatch,study-controls,terms-variables,theme,worksheets-ink,wrong-number-diagnosis,glossary-tap
bash $C all-but-gt modules:chained-problem-sets,concept-statuses,equation-drill,formulas-in-text,module-pages,notes,pair-up-drills,paper-picker,plan-the-problem,quiz-prep-cards,short-answer-graphs,stopwatch,study-controls,terms-variables,theme,worksheets-ink,wrong-number-diagnosis
echo RUN_MORE_DONE
