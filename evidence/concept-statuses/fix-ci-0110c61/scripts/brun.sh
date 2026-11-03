#!/usr/bin/env bash
# brun.sh : (b) for concept-statuses at its committed head, then the combined course (three committed heads) with the notes test
export NODE_PATH=$(npm root -g); L=/tmp/port-fix-b/logs/b; mkdir -p $L
mk() { # kitdir modules...
  local k=$1; shift; rm -rf $k; cp -r /tmp/port-fix-b/intkit $k; rm -rf $k/.git
  for m in "$@"; do rm -rf $k/features/$m; mkdir -p $k/features/$m; git -C /tmp/port-fix-b/$m archive HEAD features/$m | tar -x -C $k; echo "$m $(git -C /tmp/port-fix-b/$m rev-parse --short HEAD)" >> $k/FIXED.txt; done; }
mk /tmp/port-fix-b/kit-b2-cst concept-statuses
/tmp/port-fix-b/tools/bcourse.sh /tmp/port-fix-b/kit-b2-cst /tmp/port-fix-b/b2-cst > $L/cst-build.log 2>&1; echo "cst (b) build exit $?" >> $L/summary.txt
(cd /tmp/port-fix-b/b2-cst/src && node test.js > $L/cst-coretest.log 2>&1); echo "cst (b) core test.js exit $?: $(grep -c 'duplicate question id' $L/cst-coretest.log) duplicate ids, $(grep 'duplicate question id' $L/cst-coretest.log | grep -c cst-) of them cst-" >> $L/summary.txt
(cd /tmp/port-fix-b/b2-cst/src && timeout 1500 node features/concept-statuses/test.js > $L/cst-modtest.log 2>&1); echo "cst (b) module test exit $?: $(grep -E '^(PASS|FAIL|NOT RUN):' $L/cst-modtest.log | tail -1)" >> $L/summary.txt
mk /tmp/port-fix-b/kit-b2-all concept-statuses notes quiz-prep-cards
/tmp/port-fix-b/tools/bcourse.sh /tmp/port-fix-b/kit-b2-all /tmp/port-fix-b/b2-all > $L/all-build.log 2>&1; echo "all build exit $?" >> $L/summary.txt
(cd /tmp/port-fix-b/b2-all/src && node test.js > $L/all-coretest.log 2>&1); echo "all core test.js exit $?: $(tail -1 $L/all-coretest.log)" >> $L/summary.txt
(cd /tmp/port-fix-b/b2-all/src && timeout 1800 node features/notes/test.js > $L/all-notes-test.log 2>&1); echo "all notes test exit $?: $(grep -E '^(PASS|FAIL|NOT RUN):' $L/all-notes-test.log | tail -1)" >> $L/summary.txt
echo BDONE >> $L/summary.txt
