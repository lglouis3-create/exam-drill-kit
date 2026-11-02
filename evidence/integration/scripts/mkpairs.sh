#!/bin/bash
# The pair-combination courses (partner present and absent).
B=/tmp/port-integration/mkcombo.sh
bash $B ws-ch worksheets-ink chained-problem-sets | tail -1
bash $B ws worksheets-ink | tail -1
bash $B gt-fit glossary-tap formulas-in-text | tail -1
bash $B gt glossary-tap | tail -1
bash $B sc-pp study-controls paper-picker | tail -1
bash $B sc study-controls | tail -1
bash $B pp paper-picker | tail -1
bash $B nt-sc notes study-controls | tail -1
bash $B nt notes | tail -1
bash $B theme theme | tail -1
