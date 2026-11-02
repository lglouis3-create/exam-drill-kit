#!/bin/bash
# final.sh: every final run on the committed port branch (kit = the clean worktree at HEAD).
# Logs in /tmp/port-study-controls/v3/logs/final2-*.log; exit codes in final2-exits.tsv.
K=/home/user/exam-drill-kit/.claude/worktrees/agent-ae70c0f888081b96b
V=/tmp/port-study-controls/v3; B=$V/bin; LG=$V/logs; C=$V/courses
export NODE_PATH=/opt/node22/lib/node_modules
EX=$LG/final2-own-exits.tsv; : > $EX
run(){ local name=$1; shift; "$@" > $LG/final2-$name.log 2>&1; local e=$?; printf '%s\t%s\t%s\n' "$name" "$e" "$*" >> $EX;
  echo "$name exit $e: $(grep -E '^(PASS|FAIL|NOT RUN)' $LG/final2-$name.log | tail -1 | cut -c1-240)"; }
mkdir -p $C
# 1. the module's own course: mkcourse, ci/oncourse.js, one commit, build
run own-make bash $B/modcourse.sh $K $C/own study-controls
cp $C/own/src/q90_sc_fixture.js $LG/final2-own-q90_sc_fixture.js; tail -1 $C/own/src/course.js > $LG/final2-own-course-line.txt
# ci/oncourse.js a second time: must refuse
run own-oncourse-again node $K/features/study-controls/ci/oncourse.js $K $C/own/src
# 2. the module test three times, then run_checks.sh
for i in 1 2 3; do (cd $C/own/src && run own-test-$i node features/study-controls/test.js); done
(cd $C/own/src && run own-run-checks ./run_checks.sh)
# 3. module absent: a template course with the test copied in and the module not on
run absent-make bash /tmp/port-tools/mkcourse.sh $K $C/absent
mkdir -p $C/absent/src/features/study-controls; cp $K/features/study-controls/current/test.js $K/features/study-controls/current/module.json $C/absent/src/features/study-controls/
(cd $C/absent/src && run absent-build python3 build.py)
(cd $C/absent/src && run absent-test node features/study-controls/test.js)
