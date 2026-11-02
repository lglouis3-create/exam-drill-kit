#!/bin/bash
# matrix2.sh KIT TAG: as matrix.sh, with paper-picker at ed152de, whose ci/oncourse.js writes its own
# Basic-Pharmacokinetics 3-exam course (exam ids 1, 2, 3; 120 minutes; Exam 1 cannot be drawn from the
# kit data). Courses: 1 exam with paper-picker absent / present (present: one plain course.js line, no
# data); paper-picker's 3-exam course with paper-picker present / switched off again (pp_off.js);
# the keys course (worksheets-ink, notes, papers with calculations); F2 before/after on paper-picker's
# 3-exam course made from the kit at d15ebd9.
KIT=$1; TAG=$2
B=/tmp/port-study-controls/v3/bin; LG=/tmp/port-study-controls/v3/logs; C=/tmp/port-study-controls/v3/courses
mkdir -p $C
export NODE_PATH=/opt/node22/lib/node_modules
EX=$LG/$TAG-exits.tsv; : > $EX
run(){ local name=$1; shift; "$@" > $LG/$TAG-$name.log 2>&1; local e=$?; printf '%s\t%s\t%s\n' "$name" "$e" "$*" >> $EX;
  echo "$name exit $e: $(grep -E '^(PASS|FAIL|NOT RUN)' $LG/$TAG-$name.log | tail -1 | cut -c1-240)"; }
mk(){ local kit=$1 name=$2 extra=$3 noci=$4; shift 4; rm -rf $C/$name; NO_CI=$noci EXTRA_DATA=$extra run make-$name bash $B/modcourse.sh $kit $C/$name "$@"; }
t(){ local name=$1; (cd $C/$name/src && run test-$name node features/study-controls/test.js); }
mk $KIT one-exam-pp-absent '' '' study-controls;                               t one-exam-pp-absent
mk $KIT one-exam-pp-present '' paper-picker study-controls paper-picker;       t one-exam-pp-present
mk $KIT three-exam-pp-present '' '' study-controls paper-picker;               t three-exam-pp-present
mk $KIT three-exam-pp-absent $B/pp_off.js '' study-controls paper-picker;      t three-exam-pp-absent
mk $KIT keys $B/typed.js '' study-controls worksheets-ink notes;               t keys
(cd $C/keys/src && KEYS_SHOTS=$LG/$TAG-keys-shots run keys-partners node $B/keys_test.js .)
mk /tmp/port-study-controls/v3/kit-old2 f2-old '' '' study-controls paper-picker
(cd $C/f2-old/src && run f2-before-d15ebd9 node features/study-controls/test.js)
cp $KIT/features/study-controls/current/test.js $C/f2-old/src/features/study-controls/test.js
(cd $C/f2-old/src && run f2-after node features/study-controls/test.js)
