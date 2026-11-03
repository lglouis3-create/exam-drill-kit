#!/bin/bash
# final checks of the theme rework; logs in /tmp/port-rework/theme/final/
set -u
export NODE_PATH=$(npm root -g)
K=/tmp/port-rework/th; O=/tmp/port-rework/theme/final; export TMPDIR=$O/tmp; mkdir -p $TMPDIR
cd $K; echo "kit $(git rev-parse HEAD)" > $O/inputs.txt; git rev-parse HEAD:core HEAD:template >> $O/inputs.txt
timeout 1800 bash core/ci_course.sh module:theme > $O/ci_course-module-theme.log 2>&1; echo "ci_course module:theme exit $?" >> $O/exit-codes.txt
C=$(ls -td $TMPDIR/kit-ci-* | head -1)/course/src
for i in 1 2 3; do (cd $C && timeout 900 node features/theme/test.js > $O/module-test-run$i.log 2>&1); echo "module test run $i exit $?" >> $O/exit-codes.txt; done
# module absent: the module's code emptied in a copy of that course
A=$O/absent; rm -rf $A; cp -r $(dirname $C) $A; : > $A/src/features/theme/theme.js; : > $A/src/features/theme/theme.css
(cd $A/src && python3 build.py > $O/absent-build.log 2>&1; echo "absent build exit $?" >> $O/exit-codes.txt; timeout 900 node features/theme/test.js > $O/absent-test.log 2>&1; echo "absent module test exit $? (must be non-zero)" >> $O/exit-codes.txt)
# a page with a script in <head> (a copy of the course whose shell.html carries one): the known limit must turn into a failure
H=$O/headscript; rm -rf $H; cp -r $(dirname $C) $H; python3 - "$H/src/shell.html" <<'PY'
import sys; p=sys.argv[1]; s=open(p).read(); i=s.index('</head>'); open(p,'w').write(s[:i]+'<script>/* head script: rework test of the T1 rule */</script>\n'+s[i:])
PY
(cd $H/src && python3 build.py > $O/headscript-build.log 2>&1; echo "headscript build exit $?" >> $O/exit-codes.txt; timeout 900 node features/theme/test.js > $O/headscript-test.log 2>&1; echo "headscript module test exit $? (non-zero expected when a frame is wrong)" >> $O/exit-codes.txt)
timeout 2400 bash core/ci_course.sh modules:theme,chained-problem-sets,equation-drill,formulas-in-text,wrong-number-diagnosis > $O/ci_course-modules-theme-all.log 2>&1; echo "ci_course modules:theme,* exit $?" >> $O/exit-codes.txt
echo done >> $O/exit-codes.txt
