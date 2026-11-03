#!/bin/bash
# mp_exp.sh <label> <oncourse.js>: a module-pages course (mkcourse + the given ci script + commit + build), then core test.js
E=/tmp/port-rework/module-pages/$1; rm -rf $E; mkdir -p $E; WT=/tmp/port-rework/wt-module-pages
/tmp/port-tools/mkcourse.sh $WT $E/c module-pages > $E/mk.log 2>&1
node $2 $WT $E/c/src > $E/oncourse.log 2>&1; echo "oncourse exit $?" >> $E/oncourse.log
(cd $E/c && git add -A && git -c user.email=t@t -c user.name=t commit -qm data)
(cd $E/c/src && python3 build.py > $E/build.log 2>&1; echo "build exit $?" >> $E/build.log)
(cd $E/c/src && timeout 300 node test.js > $E/core-test.log 2>&1; echo "core test.js exit $?" >> $E/core-test.log)
tail -1 $E/oncourse.log; tail -1 $E/build.log; grep -E "FAIL|bolus|exit" $E/core-test.log
