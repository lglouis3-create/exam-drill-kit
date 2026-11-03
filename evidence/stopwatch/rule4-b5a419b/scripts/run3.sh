#!/bin/bash
# run3.sh : the module test three times on the module's own course c1.
cd /tmp/port-stopwatch-h/c1/src || exit 1
for i in 1 2 3; do
  TAILN=1 bash /tmp/port-stopwatch-h/scripts/run.sh /tmp/port-stopwatch-h/evidence/logs/final-module-test-run$i.log node features/stopwatch/test.js
done
