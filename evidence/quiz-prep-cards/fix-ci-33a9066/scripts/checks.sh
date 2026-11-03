#!/usr/bin/env bash
# checks.sh M : 3 module test runs on M's own course (proof a), then core/ci_course.sh module:M
export NODE_PATH=$(npm root -g)
m=$1; K=/tmp/port-fix-b/$m; L=/tmp/port-fix-b/logs/$m; mkdir -p $L
echo "head $(git -C $K rev-parse --short HEAD)" > $L/summary.txt
bash /tmp/port-tools/mkcourse.sh $K /tmp/port-fix-b/own-$m $m
node $K/features/$m/ci/oncourse.js $K /tmp/port-fix-b/own-$m/src > $L/a-oncourse.log 2>&1; echo "a oncourse.js exit $?" >> $L/summary.txt
(cd /tmp/port-fix-b/own-$m && git add -A && git -c user.email=t@t -c user.name=t commit -qm data)
(cd /tmp/port-fix-b/own-$m/src && python3 build.py > $L/a-build.log 2>&1); echo "a build.py exit $?" >> $L/summary.txt
for i in 1 2 3; do
  (cd /tmp/port-fix-b/own-$m/src && timeout 1500 node features/$m/test.js > $L/test-run$i.log 2>&1); e=$?
  echo "test run $i exit $e: $(grep -E '^(PASS|FAIL|NOT RUN):' $L/test-run$i.log | tail -1)" >> $L/summary.txt
done
(cd $K && timeout 3000 bash core/ci_course.sh module:$m chromium > $L/ci_course.log 2>&1); e=$?
echo "ci_course.sh module:$m exit $e: $(grep -E '^[0-9]+ PASS|PASS,|passed' $L/ci_course.log | tail -1)" >> $L/summary.txt
