#!/bin/bash
# final checks of the paper-picker rework; logs in /tmp/port-rework/paper-picker/final/
set -u
export NODE_PATH=$(npm root -g)
K=/tmp/port-rework/pp; O=/tmp/port-rework/paper-picker/final; export TMPDIR=$O/tmp; mkdir -p $TMPDIR
cd $K; echo "kit $(git rev-parse HEAD)" > $O/inputs.txt; git rev-parse HEAD:core HEAD:template >> $O/inputs.txt
timeout 1800 bash core/ci_course.sh module:paper-picker > $O/ci_course-module-paper-picker.log 2>&1; echo "ci_course module:paper-picker exit $?" >> $O/exit-codes.txt
C=$(ls -td $TMPDIR/kit-ci-* | head -1)/course/src
for i in 1 2 3; do (cd $C && timeout 900 node features/paper-picker/test.js > $O/module-test-run$i.log 2>&1); echo "module test run $i exit $?" >> $O/exit-codes.txt; done
# module absent: the module's code emptied in a copy of that course
A=$O/absent; rm -rf $A; cp -r $(dirname $C) $A; : > $A/src/features/paper-picker/paper-picker.js
(cd $A/src && python3 build.py > $O/absent-build.log 2>&1; echo "absent build exit $?" >> $O/exit-codes.txt; timeout 900 node features/paper-picker/test.js > $O/absent-test.log 2>&1; echo "absent module test exit $? (must be non-zero)" >> $O/exit-codes.txt)
# a template course with one exam, the module on, no CI data (the test adds the fixture to a scratch copy)
P=$O/plain; /tmp/port-tools/mkcourse.sh $K $P paper-picker > $O/plain-mk.log 2>&1
printf '\n;COURSE.features = Object.assign({}, COURSE.features, {"paper-picker": {version: "v1"}});\n' >> $P/src/course.js
(cd $P && git add -A && git -c user.email=t@t -c user.name=t commit -qm on && cd src && python3 build.py >> $O/plain-mk.log 2>&1; timeout 900 node features/paper-picker/test.js > $O/plain-1exam-test.log 2>&1; echo "1-exam template course module test exit $?" >> $O/exit-codes.txt)
# combination study-controls,paper-picker (study-controls is not in this tree: its branch, information only)
SK=$O/kit-sc; rm -rf $SK; mkdir -p $SK; git -C $K archive HEAD | tar -x -C $SK; mkdir -p $SK/features/study-controls
git -C /home/user/exam-drill-kit archive origin/port/study-controls features/study-controls | tar -x -C $SK
echo "study-controls from origin/port/study-controls $(git -C /home/user/exam-drill-kit rev-parse origin/port/study-controls)" >> $O/inputs.txt
(cd $SK && git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm k && timeout 1800 bash core/ci_course.sh modules:study-controls,paper-picker > $O/ci_course-modules-study-controls-paper-picker.log 2>&1; echo "ci_course modules:study-controls,paper-picker exit $?" >> $O/exit-codes.txt)
echo done >> $O/exit-codes.txt
