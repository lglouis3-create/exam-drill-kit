#!/bin/bash
# Runs on the final commit, one after another: the 9b course test (oncourse, second run refuses,
# build, module test), the module test twice more on that course, the variants, ci_course.sh on
# the module course, and the mutation checks again on a fresh course.
export NODE_PATH=/opt/node22/lib/node_modules
S=/tmp/port-short-answer-graphs/evidence/scripts
E=/tmp/port-short-answer-graphs/evidence
mkdir -p "$E/final" && cd "$E/final"
git -C /home/user/exam-drill-kit/.claude/worktrees/agent-a2f96217f6a817521 rev-parse HEAD > "$E/final/commit.txt"
bash "$S/run_c1.sh" /tmp/port-short-answer-graphs/fin > "$E/final/fin-steps.txt" 2>&1
for k in 2 3; do (cd /tmp/port-short-answer-graphs/fin/src && node features/short-answer-graphs/test.js) > "$E/fin-moduletest-$k.log" 2>&1; echo "exit=$?" >> "$E/fin-moduletest-$k.log"; done
(cd /tmp/port-short-answer-graphs/fin/src && mkdir -p "$E/screenshots" && SAG_SHOTS="$E/screenshots" node features/short-answer-graphs/test.js) > "$E/fin-moduletest-shots.log" 2>&1; echo "exit=$?" >> "$E/fin-moduletest-shots.log"
bash "$S/run_variant.sh" /tmp/port-short-answer-graphs/fin-saonly saonly > "$E/final/fin-saonly-steps.txt" 2>&1
bash "$S/run_variant.sh" /tmp/port-short-answer-graphs/fin-absent absent > "$E/final/fin-absent-steps.txt" 2>&1
bash "$S/ci_course.sh" module:short-answer-graphs ci_course-module-final > "$E/final/ci-steps.txt" 2>&1
bash "$S/run_c1.sh" /tmp/port-short-answer-graphs/mut2 > "$E/final/mut2-steps.txt" 2>&1
(cd "$E" && python3 mutations.py /tmp/port-short-answer-graphs/mut2) > "$E/mutations-run-final.log" 2>&1; echo "exit=$?" >> "$E/mutations-run-final.log"
echo ALLDONE
