#!/bin/bash
R=/tmp/port-integration/runfixed2.sh
for m in glossary-tap module-pages terms-variables worksheets-ink concept-statuses paper-picker study-controls; do bash $R all5 $m; done
bash $R ws worksheets-ink
bash $R ws-ch worksheets-ink
bash $R sc-pp3 study-controls
bash $R sc-pp3 paper-picker
bash $R sc-pp paper-picker
