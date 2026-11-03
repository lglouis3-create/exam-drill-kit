#!/bin/bash
# pipeline.sh NAME WORKTREE [COMBO...]: ci_course.sh module:NAME, the module test 3 times and module-absent on that
# course, then ci_course.sh modules:<combo> for each combination given
export NODE_PATH=$(npm root -g)
N=$1; W=$2; shift 2; O=/tmp/port-rework/$N/final; rm -rf $O; mkdir -p $O/ci; S=$O/summary.txt
(cd $W && TMPDIR=$O/ci timeout 2400 bash core/ci_course.sh module:$N chromium > $O/ci_course-module-$N.log 2>&1); e=$?
echo "ci_course module:$N exit $e: $(grep -E '^[0-9]+ PASS' $O/ci_course-module-$N.log)" >> $S
C=$(ls -d $O/ci/kit-ci-*/course/src | head -1)
/tmp/port-rework/plan-the-problem/scripts/three.sh $N $C $O/own; cat $O/own/summary.txt >> $S
for combo in "$@"; do mkdir -p $O/ci-$combo
  (cd $W && TMPDIR=$O/ci-$combo timeout 2400 bash core/ci_course.sh modules:$combo chromium > $O/ci_course-modules-$combo.log 2>&1); e=$?
  echo "ci_course modules:$combo exit $e: $(grep -E '^[0-9]+ PASS' $O/ci_course-modules-$combo.log)" >> $S; done
echo ALLDONE >> $S
