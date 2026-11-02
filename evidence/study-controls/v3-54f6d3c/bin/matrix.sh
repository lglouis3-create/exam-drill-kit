#!/bin/bash
# matrix.sh KIT TAG: the module test on four courses (1 exam / 3 exams, paper-picker absent / present),
# the keyboard checks with worksheets-ink and notes on, and F2 before/after.
# Logs in /tmp/port-study-controls/v3/logs/<TAG>-<name>.log; one exit-code line per command in <TAG>-exits.tsv.
KIT=$1; TAG=$2
B=/tmp/port-study-controls/v3/bin; LG=/tmp/port-study-controls/v3/logs; C=/tmp/port-study-controls/v3/courses
mkdir -p $C
export NODE_PATH=/opt/node22/lib/node_modules
EX=$LG/$TAG-exits.tsv; : > $EX
run(){ local name=$1; shift; "$@" > $LG/$TAG-$name.log 2>&1; local e=$?; printf '%s\t%s\t%s\n' "$name" "$e" "$*" >> $EX;
  echo "$name exit $e: $(grep -E '^(PASS|FAIL|NOT RUN)' $LG/$TAG-$name.log | tail -1 | cut -c1-240)"; }
mk(){ local kit=$1 name=$2 extra=$3; shift 3; rm -rf $C/$name; EXTRA_DATA=$extra run make-$name bash $B/modcourse.sh $kit $C/$name "$@"; }
t(){ local name=$1; (cd $C/$name/src && run test-$name node features/study-controls/test.js); }
mk $KIT one-exam-pp-absent '' study-controls;                         t one-exam-pp-absent
mk $KIT one-exam-pp-present '' study-controls paper-picker;           t one-exam-pp-present
mk $KIT three-exam-pp-absent $B/three_exams.js study-controls;        t three-exam-pp-absent
mk $KIT three-exam-pp-present $B/three_exams.js study-controls paper-picker; t three-exam-pp-present
# papers with calculations (exams[].typed, in course.js), so the paper's Scratch paper can be opened
mk $KIT keys $B/typed.js study-controls worksheets-ink notes;          t keys
(cd $C/keys/src && KEYS_SHOTS=$LG/$TAG-keys-shots run keys-partners node $B/keys_test.js .)
# F2 before/after on one 3-exam course with paper-picker, made from the kit at d15ebd9 (whose ci/oncourse.js
# writes no data): the test as it was at d15ebd9, then the committed test copied in
mk /tmp/port-study-controls/v3/kit-old f2-old $B/three_exams.js study-controls paper-picker
(cd $C/f2-old/src && run f2-before-d15ebd9 node features/study-controls/test.js)
cp $KIT/features/study-controls/current/test.js $C/f2-old/src/features/study-controls/test.js
(cd $C/f2-old/src && run f2-after node features/study-controls/test.js)
