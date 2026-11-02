#!/bin/bash
# run the module test three times on the CI course, one log each
cd /tmp/port-stopwatch/ci/src || exit 1
for i in 1 2 3; do
  NODE_PATH=/opt/node22/lib/node_modules timeout 900 node features/stopwatch/test.js > /tmp/port-stopwatch/evidence/stopwatch/logs/12_module_test_run$i.log 2>&1
  echo "run $i exit $?"
  tail -1 /tmp/port-stopwatch/evidence/stopwatch/logs/12_module_test_run$i.log
done
