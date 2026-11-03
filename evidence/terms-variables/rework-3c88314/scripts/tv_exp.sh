#!/bin/bash
# tv_exp.sh <label> <oncourse.js> <check>: a terms-variables course (mkcourse + the given ci script + commit + build), then one core check
E=/tmp/port-rework/terms-variables/$1; rm -rf $E; mkdir -p $E; WT=/tmp/port-rework/wt-terms-variables; export NODE_PATH=$(npm root -g)
/tmp/port-tools/mkcourse.sh $WT $E/c terms-variables > $E/mk.log 2>&1
node $2 $WT $E/c/src > $E/oncourse.log 2>&1; echo "oncourse exit $?" >> $E/oncourse.log
(cd $E/c && git add -A && git -c user.email=t@t -c user.name=t commit -qm data)
(cd $E/c/src && python3 build.py > $E/build.log 2>&1; echo "build exit $?" >> $E/build.log)
(cd $E/c/src && timeout 600 node $3 > $E/$3.log 2>&1; echo "$3 exit $?" >> $E/$3.log)
tail -2 $E/oncourse.log; tail -1 $E/build.log; grep -E "FAIL|exit" $E/$3.log | head
