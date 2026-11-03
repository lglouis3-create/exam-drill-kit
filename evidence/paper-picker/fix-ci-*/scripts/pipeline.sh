#!/bin/bash
export NODE_PATH=$(npm root -g)
R=/tmp/port-fix-c/run; S=$R/summary.txt
rerun3(){ # name course-src
  for i in 1 2 3; do (cd $2 && timeout 1500 node features/$1/test.js > $R/$1-own-$i.log 2>&1); e=$?; echo "$1 own-course test run $i exit $e: $(tail -1 $R/$1-own-$i.log)" >> $S; done; }
# stopwatch: 3 reruns on its CI course, then proof (b)
rerun3 stopwatch $(ls -d $R/sw-ci/kit-ci-*/course/src)
/tmp/port-fix-c/tools/mkkitb.sh sw /tmp/port-fix-c/stopwatch stopwatch >> $S 2>&1
timeout 2000 bash /tmp/port-fix-c/tools/dry.sh /tmp/port-fix-c/kitb-sw $R/b-sw stopwatch > /dev/null 2>&1; echo "stopwatch proof b exit $?: $(grep -E '^== |^STOP' $R/b-sw.log | tr '\n' ' ' | cut -c1-400)" >> $S
# paper-picker: proof (b) rerun with logs on the committed head
/tmp/port-fix-c/tools/mkkitb.sh pp /tmp/port-fix-c/paper-picker paper-picker >> $S 2>&1
timeout 2000 bash /tmp/port-fix-c/tools/dry.sh /tmp/port-fix-c/kitb-pp $R/b-pp paper-picker > /dev/null 2>&1; echo "paper-picker proof b exit $?: $(grep -E '^== |^STOP' $R/b-pp.log | tr '\n' ' ' | cut -c1-400)" >> $S
# plan-the-problem: ci_course, 3 reruns, proof (b)
rm -rf $R/plc-ci; mkdir -p $R/plc-ci
(cd /tmp/port-fix-c/plan-the-problem && TMPDIR=$R/plc-ci timeout 2400 bash core/ci_course.sh module:plan-the-problem chromium > $R/plc-ci.log 2>&1); e=$?; echo "exit $e" >> $R/plc-ci.log
echo "plan-the-problem ci_course exit $e: $(grep -E '^[0-9]+ PASS' $R/plc-ci.log)" >> $S
rerun3 plan-the-problem $(ls -d $R/plc-ci/kit-ci-*/course/src)
/tmp/port-fix-c/tools/mkkitb.sh plc /tmp/port-fix-c/plan-the-problem plan-the-problem >> $S 2>&1
timeout 2000 bash /tmp/port-fix-c/tools/dry.sh /tmp/port-fix-c/kitb-plc $R/b-plc plan-the-problem > /dev/null 2>&1; echo "plan-the-problem proof b exit $?: $(grep -E '^== |^STOP' $R/b-plc.log | tr '\n' ' ' | cut -c1-400)" >> $S
echo ALLDONE >> $S
