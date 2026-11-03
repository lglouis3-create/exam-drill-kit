#!/bin/bash
# ci_1exam.sh: study-controls + paper-picker on a ONE-exam course. Built exactly as core/ci_course.sh
# builds modules:study-controls,paper-picker (template + core, each module's own ci/oncourse.js, in
# ci_course.sh's order), then one line keeps only the exam paper-picker's data makes active
# (COURSE.exams filtered to COURSE.activeExam; no data added), committed, then run_checks.sh.
# Course at /tmp/port-integration-3/ci/sc-pp1/course; output logs/ci-sc-pp1.log.
export NODE_PATH=$(npm root -g)
set -e
K=/home/user/exam-drill-kit/.claude/worktrees/agent-af710a00790ac0d8b
W=/tmp/port-integration-3/ci/sc-pp1; C=$W/course; LOG=/tmp/port-integration-3/logs/ci-sc-pp1.log
rm -rf $W; mkdir -p $C/src
export TMPDIR=$W
{
cp -r $K/template/. $C/src/; cp -r $K/core/. $C/src/; mv $C/src/CLAUDE.md $C/CLAUDE.md
for m in study-controls paper-picker; do
  mkdir -p $C/src/features/$m; cp -r $K/features/$m/current/. $C/src/features/$m/
  echo "-- $m: node features/$m/ci/oncourse.js"; node $K/features/$m/ci/oncourse.js $K $C/src
done
printf '\n;/* integration 1-exam */ COURSE.exams = COURSE.exams.filter(e => e.id === COURSE.activeExam);\n' >> $C/src/course.js
node -e "const fs=require('fs');const t=fs.readFileSync('$C/src/course.js','utf8');const C=new Function(t+';return COURSE;')();console.log('exams now:',JSON.stringify(C.exams.map(e=>[e.id,e.name])),'activeExam',C.activeExam)"
(cd $C && git init -q && git add -A && git -c user.email=ci@example.invalid -c user.name="kit checks" commit -qm "scratch course, 1 exam")
set +e
(cd $C/src && DRILL_BROWSER=chromium bash ./run_checks.sh)
echo "exit $?"
} > $LOG 2>&1
printf '%s\t%s\t%s\t%s\t%s\n' "$(date -u +%H:%M:%S)" "$C" "ci_1exam.sh (study-controls,paper-picker, 1 exam)" "$(tail -1 $LOG)" "$LOG" >> /tmp/port-integration-3/logs/COMMANDS.tsv
grep -E "exams now|^[0-9]+ PASS|^FAIL|^NOT RUN|^REPORT|^exit" $LOG | cut -c1-300
