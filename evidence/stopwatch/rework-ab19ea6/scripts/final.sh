#!/bin/bash
# final checks of the stopwatch rework; logs in /tmp/port-rework/stopwatch/final/
set -u
export NODE_PATH=$(npm root -g)
K=/tmp/port-rework/sw; O=/tmp/port-rework/stopwatch/final; export TMPDIR=$O/tmp; mkdir -p $TMPDIR
cd $K; echo "kit $(git rev-parse HEAD)" > $O/inputs.txt; git rev-parse HEAD:core HEAD:template >> $O/inputs.txt
timeout 1800 bash core/ci_course.sh module:stopwatch > $O/ci_course-module-stopwatch.log 2>&1; echo "ci_course module:stopwatch exit $?" >> $O/exit-codes.txt
C=$(ls -td $TMPDIR/kit-ci-* | head -1)/course/src
for i in 1 2 3; do (cd $C && timeout 900 node features/stopwatch/test.js > $O/module-test-run$i.log 2>&1); echo "module test run $i exit $?" >> $O/exit-codes.txt; done
# module absent: the module's code emptied in a copy of that course
A=$O/absent; rm -rf $A; cp -r $(dirname $C) $A; : > $A/src/features/stopwatch/stopwatch.js
(cd $A/src && python3 build.py > $O/absent-build.log 2>&1; echo "absent build exit $?" >> $O/exit-codes.txt; timeout 900 node features/stopwatch/test.js > $O/absent-test.log 2>&1; echo "absent module test exit $? (must be non-zero)" >> $O/exit-codes.txt)
# the template course, the module on, no CI data (the test adds the fixture to a scratch copy)
P=$O/plain; /tmp/port-tools/mkcourse.sh $K $P stopwatch > $O/plain-mk.log 2>&1
printf '\n;COURSE.features = Object.assign({}, COURSE.features, {"stopwatch": {version: "v1"}});\n' >> $P/src/course.js
(cd $P && git add -A && git -c user.email=t@t -c user.name=t commit -qm on && cd src && python3 build.py >> $O/plain-mk.log 2>&1; timeout 900 node features/stopwatch/test.js > $O/plain-test.log 2>&1; echo "template course module test exit $?" >> $O/exit-codes.txt)
echo done >> $O/exit-codes.txt
