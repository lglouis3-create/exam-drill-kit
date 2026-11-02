#!/bin/bash
# Every agent-run check of the notes port, on the worktree as committed. One line per command in
# /tmp/port-notes/evidence/commands.tsv: label, exit code, log file.
W=/home/user/exam-drill-kit/.claude/worktrees/agent-ad792d8c15dc40f9c
E=/tmp/port-notes/evidence; L=$E/logs; mkdir -p $L $E/screenshots
export NODE_PATH=/opt/node22/lib/node_modules
T=$E/commands.tsv; : > $T
rec(){ echo -e "$1\t$2\t$3" >> $T; echo "$1 -> $2"; }
cd $W; echo "commit $(git rev-parse HEAD)" > $L/commit.txt

# 1. the module test on a page built without the module's code: must FAIL
/tmp/port-tools/mkcourse.sh $W /tmp/port-notes/off > $L/off-mkcourse.log 2>&1
mkdir -p /tmp/port-notes/off/src/features/notes && cp $W/features/notes/current/test.js /tmp/port-notes/off/src/features/notes/
(cd /tmp/port-notes/off/src && python3 build.py > $L/off-build.log 2>&1); rec "build, template course without the module" $? off-build.log
(cd /tmp/port-notes/off/src && node features/notes/test.js > $L/off-moduletest.log 2>&1); rec "module test on a page without the module (expected FAIL, exit 1)" $? off-moduletest.log

# 2. the CI course script (HARDEN 9b)
bash /tmp/port-notes/ci-test.sh > $L/ci-test.log 2>&1; rec "ci/oncourse.js on a fresh course, build, module test (see ci-test.log)" $? ci-test.log

# 3. module alone: fresh course, module test three times, then run_checks.sh
bash /tmp/port-notes/mk-on.sh /tmp/port-notes/on > $L/on-build.log 2>&1; rec "mkcourse + build, notes on alone" $? on-build.log
for i in 1 2 3; do
  (cd /tmp/port-notes/on/src && NOTES_SHOTS=$([ $i = 1 ] && echo $E/screenshots) node features/notes/test.js > $L/on-moduletest-$i.log 2>&1); rec "module test, notes alone, run $i" $? on-moduletest-$i.log
done
(cd /tmp/port-notes/on/src && ./run_checks.sh > $L/on-run_checks.log 2>&1); rec "run_checks.sh, notes alone" $? on-run_checks.log

# 4. with study-controls (origin/port/study-controls c81a735) on: module test, then run_checks.sh
bash /tmp/port-notes/mk-onsc.sh /tmp/port-notes/onsc > $L/onsc-build.log 2>&1; rec "mkcourse + build, notes and study-controls on" $? onsc-build.log
(cd /tmp/port-notes/onsc/src && node features/notes/test.js > $L/onsc-moduletest.log 2>&1); rec "module test, notes with study-controls" $? onsc-moduletest.log
(cd /tmp/port-notes/onsc/src && ./run_checks.sh > $L/onsc-run_checks.log 2>&1); rec "run_checks.sh, notes and study-controls" $? onsc-run_checks.log
echo done
