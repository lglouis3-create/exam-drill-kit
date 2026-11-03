#!/bin/bash
# allpatched.sh BRANCH MODULE SHA: a kit at integration/ports-2026-11-03 (9acfe9d) with
# evidence/integration-3 patches/all-patched-kit.patch applied, then features/MODULE taken
# from SHA (the fixed branch head) in place of the scratch patch; then core/ci_course.sh
# modules:<the 18 modules of logs/ci-all-patched.log> chromium.
export NODE_PATH=$(npm root -g)
B=$1; M=$2; SHA=$3; L=/tmp/port-fix-a/logs; KP=/tmp/port-fix-a/kitpatch-$B
cd /home/user/exam-drill-kit
git worktree remove --force $KP 2>/dev/null; git worktree add -q --detach $KP 9acfe9d8f82792053fb6bbc62157642a24d84864 || exit 1
git -C $KP apply /tmp/port-fix-a/ev-int3/evidence/integration-3/patches/all-patched-kit.patch || exit 1
git -C $KP checkout $SHA -- features/$M || exit 1
MODS=chained-problem-sets,concept-statuses,equation-drill,formulas-in-text,glossary-tap,module-pages,notes,pair-up-drills,paper-picker,plan-the-problem,quiz-prep-cards,short-answer-graphs,stopwatch,study-controls,terms-variables,theme,worksheets-ink,wrong-number-diagnosis
export TMPDIR=/tmp/port-fix-a/run-$B/allpatched; rm -rf "$TMPDIR"; mkdir -p "$TMPDIR"
LOG=$L/$B-ci-allpatched.log
{ echo "== kit $KP: 9acfe9d + patches/all-patched-kit.patch, then features/$M from $SHA"; git -C $KP status --short; } > $LOG
timeout 2400 bash $KP/core/ci_course.sh modules:$MODS chromium >> $LOG 2>&1; rc=$?
echo "exit $rc" >> $LOG; echo "allpatched $B exit $rc"
grep -E "^[0-9]+ PASS|^(FAIL|NOT RUN) |features/$M/test.js" $LOG | cut -c1-250
