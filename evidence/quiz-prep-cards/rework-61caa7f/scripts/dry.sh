#!/bin/bash
# dry.sh NAME WORKTREE OUT: a fresh template course with the module, its ci/oncourse.js, build.py, then the
# node-only core checks test.js and style_check.js (the reproduction of a put-back question's refusal)
export NODE_PATH=$(npm root -g)
N=$1; W=$2; O=$3; rm -rf $O; mkdir -p $O
/tmp/port-tools/mkcourse.sh $W $O/course $N > $O/mk.log 2>&1
node $W/features/$N/ci/oncourse.js $W $O/course/src > $O/oncourse.log 2>&1; echo "oncourse exit $?" >> $O/summary.txt
(cd $O/course && git add -A && git -c user.email=t@t -c user.name=t commit -qm data)
(cd $O/course/src && python3 build.py) > $O/build.log 2>&1; echo "build exit $?" >> $O/summary.txt
(cd $O/course/src && node test.js) > $O/core-test.js.log 2>&1; echo "core test.js exit $?: $(tail -1 $O/core-test.js.log)" >> $O/summary.txt
(cd $O/course/src && node style_check.js) > $O/style_check.js.log 2>&1; echo "style_check.js exit $?: $(tail -1 $O/style_check.js.log)" >> $O/summary.txt
