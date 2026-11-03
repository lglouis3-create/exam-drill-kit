#!/bin/bash
# After the restart (2026-11-03): the runs not finished, one at a time.
S=/tmp/port-integration-3/scripts
ALL=chained-problem-sets,concept-statuses,equation-drill,formulas-in-text,glossary-tap,module-pages,notes,pair-up-drills,paper-picker,plan-the-problem,quiz-prep-cards,short-answer-graphs,stopwatch,study-controls,terms-variables,theme,worksheets-ink,wrong-number-diagnosis
bash $S/ci_k.sh pp3 module:paper-picker
bash $S/ci_1exam.sh
bash $S/ci_k.sh nt-sc modules:notes,study-controls
bash $S/ci_k.sh nt module:notes
bash $S/ci_k.sh keys modules:study-controls,worksheets-ink,notes
bash $S/extra.sh keys keys
KIT=/tmp/port-integration-3/kitpatch bash $S/ci_k.sh all-patched modules:$ALL patched
bash $S/extra.sh keys all-patched patched
bash $S/extra.sh contrast all-patched patched
echo RUN_RESUME_DONE
