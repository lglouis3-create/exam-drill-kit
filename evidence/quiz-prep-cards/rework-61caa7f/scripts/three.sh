#!/bin/bash
# three.sh NAME COURSE_SRC OUTDIR: the module test 3 times on its own course, then the module-absent run
export NODE_PATH=$(npm root -g)
N=$1; C=$2; O=$3; mkdir -p $O
for i in 1 2 3; do (cd $C && timeout 1500 node features/$N/test.js) > $O/module-test-run$i.log 2>&1; echo "run$i exit $?: $(tail -1 $O/module-test-run$i.log)" >> $O/summary.txt; done
A=$O/absent; rm -rf $A; cp -r $(dirname $C) $A
printf "\n;delete COURSE.features['%s'];\n" "$N" >> $A/src/course.js
(cd $A/src && python3 build.py) > $O/module-absent-build.log 2>&1; echo "absent build exit $?" >> $O/summary.txt
(cd $A/src && timeout 600 node features/$N/test.js) > $O/module-absent-test.log 2>&1; echo "absent test exit $?: $(tail -1 $O/module-absent-test.log)" >> $O/summary.txt
rm -rf $A
echo DONE >> $O/summary.txt
