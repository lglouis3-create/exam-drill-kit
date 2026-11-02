#!/bin/bash
# verify.sh <name> <commit> [extra modules...]: coordinator re-run of a module's test on an exact commit,
# on a template course switched on by the module's own ci/oncourse.js. Logs and exit codes kept.
set -u
N=$1; C=$2; shift 2
OUT=/tmp/port-coord/verify/$N-${C:0:7}; rm -rf $OUT; mkdir -p $OUT
KIT=/home/user/exam-drill-kit; export NODE_PATH=$(npm root -g)
W=/tmp/port-coord/vw-$N; rm -rf $W; git -C $KIT worktree add -q --detach $W $C 2>>$OUT/setup.log
{ echo "module $N"; echo "commit $(git -C $W rev-parse HEAD)"; echo "core $(git -C $W rev-parse HEAD:core) template $(git -C $W rev-parse HEAD:template)"; echo "extra modules: $*"; date -u +%FT%TZ; } > $OUT/inputs.txt
NEEDS=$(node -e "const m=require('$W/features/$N/current/module.json');console.log((m.needs||[]).join(' '))")
C2=/tmp/port-coord/vc-$N; /tmp/port-tools/mkcourse.sh $W $C2 $NEEDS "$@" $N >>$OUT/setup.log 2>&1
for m in $NEEDS "$@" $N; do if [ -f $W/features/$m/ci/oncourse.js ]; then echo "\$ node features/$m/ci/oncourse.js" >>$OUT/setup.log; node $W/features/$m/ci/oncourse.js $W $C2/src >>$OUT/setup.log 2>&1; echo "oncourse $m exit=$?" >>$OUT/exit-codes.txt; else
  echo "$m has no ci/oncourse.js; switched on by a course.js line only" >>$OUT/setup.log
  V=$(node -e "console.log(require('$W/features/$m/current/module.json').version)"); echo ";COURSE.features = Object.assign({}, COURSE.features, {'$m': {version: '$V'}});" >> $C2/src/course.js; fi; done
cd $C2 && git add -A && git -c user.email=t@t -c user.name=t commit -q --amend -m "scratch course"; cd src
python3 build.py > $OUT/build.log 2>&1; echo "build exit=$?" >> $OUT/exit-codes.txt
for i in 1 2 3; do node features/$N/test.js > $OUT/test-run$i.log 2>&1; echo "module test run $i exit=$?" >> $OUT/exit-codes.txt; done
tail -1 $OUT/test-run1.log > $OUT/summary.txt
cd /; git -C $KIT worktree remove --force $W; rm -rf $C2
echo done > $OUT/DONE
