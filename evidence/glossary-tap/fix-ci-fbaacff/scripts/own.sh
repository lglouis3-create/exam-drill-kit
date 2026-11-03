#!/bin/bash
# own.sh BRANCH MODULE: core/ci_course.sh module:MODULE in the branch worktree, then the module
# test 3 more times on that same scratch course. Logs in /tmp/port-fix-a/logs/<branch>-*.log
export NODE_PATH=$(npm root -g)
B=$1; M=$2; K=/tmp/port-fix-a/$B; L=/tmp/port-fix-a/logs
export TMPDIR=/tmp/port-fix-a/run-$B/own; rm -rf "$TMPDIR"; mkdir -p "$TMPDIR"
{ echo "== kit $K at $(git -C $K rev-parse --short HEAD), dirty: $(git -C $K status --porcelain | wc -l) file(s)"; } > $L/$B-ci-own.log
timeout 2400 bash $K/core/ci_course.sh module:$M chromium >> $L/$B-ci-own.log 2>&1; rc=$?
echo "exit $rc" >> $L/$B-ci-own.log; echo "ci_course module:$M exit $rc"
grep -E "^[0-9]+ PASS|features/$M/test.js" $L/$B-ci-own.log | head -3
SRC=$(ls -d $TMPDIR/kit-ci-*/course/src | head -1)
for i in 1 2 3; do (cd $SRC && timeout 900 node features/$M/test.js > $L/$B-test-run$i.log 2>&1); r=$?; echo "test run $i exit $r: $(grep -v '^\s*$' $L/$B-test-run$i.log | tail -1 | cut -c1-200)"; done
