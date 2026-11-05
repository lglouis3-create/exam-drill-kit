#!/bin/bash
# Integration run 8 (coordinator). Merge the 14 port heads onto main, build the all-module course,
# run its checks, then the keyboard test on a copy whose Exam 3 has typed: true (PK's Exam 3 was 20
# multiple choice and 20 fill in the blank, core/exam_typed.js header), and the contrast sweep.
P=/tmp/port-integration-8; mkdir -p $P/logs $P/ci $P/shots
bash $P/scripts/merge_all.sh > $P/logs/merge-all.log 2>&1 || { echo MERGE-FAILED; exit 3; }
cd $P/wt
MODS=$(ls features | while read m; do [ -f features/$m/current/module.json ] && echo $m; done | paste -sd, -)
echo "modules: $MODS" > $P/logs/modules.txt
TMPDIR=$P/ci bash core/ci_course.sh modules:$MODS > $P/logs/ci-all.log 2>&1; echo "ci_course exit $?" >> $P/logs/ci-all.log
C=$(ls -d $P/ci/kit-ci-* | head -1)/course
rm -rf $C-typed; cp -r $C $C-typed
printf '\n;/* run 8 keyboard test only */ COURSE.exams.forEach(e => { if(e.id === 3) e.typed = true; });\n' >> $C-typed/src/course.js
(cd $C-typed/src && python3 build.py > $P/logs/typed-build.log 2>&1; echo "build exit $?" >> $P/logs/typed-build.log)
for i in 1 2 3; do (cd $C-typed/src && node $P/scripts/keys_test.js . > $P/logs/keys-typed-$i.log 2>&1; echo "exit $?" >> $P/logs/keys-typed-$i.log); done
(cd $C/src && node $P/scripts/contrast_test.js . $P/shots/contrast > $P/logs/contrast-all.log 2>&1; echo "exit $?" >> $P/logs/contrast-all.log)
echo RUN8DONE
