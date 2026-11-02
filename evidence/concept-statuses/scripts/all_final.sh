#!/bin/bash
# all_final.sh: every run on the final commit, one after another. Logs in evidence/logs/; a line per step in
# evidence/logs/COMMANDS.tsv (step, exit code, log).
W=/home/user/exam-drill-kit/.claude/worktrees/agent-a08a9b359b929ddbc
P=/tmp/port-concept-statuses; E=$P/evidence/logs; S=$P/scripts
export NODE_PATH=/opt/node22/lib/node_modules TMPDIR=$P/tmp
mkdir -p $TMPDIR $P/evidence/shots; export CSTAT_SHOTS=$P/evidence/shots
T=$E/COMMANDS.tsv
rec(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> $T; }
echo "final commit $(git -C $W rev-parse HEAD) core $(git -C $W rev-parse HEAD:core) template $(git -C $W rev-parse HEAD:template) main $(git -C $W rev-parse origin/main)" > $E/final-inputs.txt
# 1. the module's own course, by ci/oncourse.js; the module test 3 times; run_checks.sh
rm -rf $P/final
bash $S/make_on.sh $P/final > $E/final-make.log 2>&1; rec "make_on.sh (mkcourse + ci/oncourse.js + build)" "$(grep -c 'exit 0' $E/final-make.log)/4 steps exit 0" final-make.log
node $W/features/concept-statuses/ci/oncourse.js $W $P/final/src > $E/final-oncourse-second.log 2>&1; rec "ci/oncourse.js a second time on the same course" $? final-oncourse-second.log
for i in 1 2 3; do (cd $P/final/src && node features/concept-statuses/test.js > $E/final-test-$i.log 2>&1); rec "module test run $i (module's own course)" $? final-test-$i.log; done
(cd $P/final/src && bash ./run_checks.sh > $E/final-run_checks.log 2>&1); rec "run_checks.sh on the module's own course" $? final-run_checks.log
# 2. the kit's CI course scripts
(cd $W && bash core/ci_course.sh module:concept-statuses > $E/ci-module.log 2>&1); rec "core/ci_course.sh module:concept-statuses" $? ci-module.log
(cd $W && bash core/ci_course.sh template > $E/ci-template.log 2>&1); rec "core/ci_course.sh template (no module)" $? ci-template.log
(cd $W && bash core/ci_course.sh medicinal-chemistry > $E/ci-mc.log 2>&1); rec "core/ci_course.sh medicinal-chemistry (full history clone)" $? ci-mc.log
# 3. module absent, plain template without FIX, plan-the-problem (F5) with formulas-in-text on
bash $S/absent.sh > $E/module-absent.log 2>&1; rec "module test, module absent (must FAIL)" "$(sed -n 's/^test exit //p' $E/module-absent.log)" module-absent.log
bash $S/variant.sh $P/v-plain 0 > $E/variant-template-nofix.log 2>&1; rec "module test, template course without FIX, formulas-in-text absent" "$(sed -n 's/^test exit //p' $E/variant-template-nofix.log)" variant-template-nofix.log
bash $S/f5.sh > $E/f5-plan-the-problem.log 2>&1; rec "F5: plan-the-problem + formulas-in-text on; test at 46e3156 / committed test" "$(sed -n 's/^test at 46e3156 exit //p' $E/f5-plan-the-problem.log) / $(sed -n 's/^committed test exit //p' $E/f5-plan-the-problem.log)" f5-plan-the-problem.log
# 4. mutations on the module's own course, with the committed test and with the test at 46e3156
rm -rf $P/evidence/mutations $P/evidence/mutations-starttest
python3 -I $S/mutations.py $P/final $P/evidence/mutations > $E/mutations.log 2>&1; rec "mutations.py, committed test" $? mutations.log
cp $P/v-ptp/src/features/concept-statuses/test_46e3156.js $P/final/src/features/concept-statuses/
CST_TEST=features/concept-statuses/test_46e3156.js python3 -I $S/mutations.py $P/final $P/evidence/mutations-starttest > $E/mutations-starttest.log 2>&1; rec "mutations.py, test at 46e3156" $? mutations-starttest.log
rm -f $P/final/src/features/concept-statuses/test_46e3156.js
echo done >> $T
