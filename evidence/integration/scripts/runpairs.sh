#!/bin/bash
# Each module's own test in each pair course (partner present and absent), one at a time.
R=/tmp/port-integration/run.sh
C=/tmp/port-integration
t(){ bash $R "$1__$2" $C/c-$1/src node features/$2/test.js | sed "s|^|$1 $2: |" | grep -E ": (PASS|FAIL|NOT RUN|exit)"; }
t ws-ch worksheets-ink
t ws-ch chained-problem-sets
t ws worksheets-ink
t gt-fit glossary-tap
t gt-fit formulas-in-text
t gt glossary-tap
t sc-pp study-controls
t sc-pp paper-picker
t sc study-controls
t pp paper-picker
t nt-sc notes
t nt-sc study-controls
t nt notes
t theme theme
