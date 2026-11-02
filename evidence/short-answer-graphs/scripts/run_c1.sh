#!/bin/bash
# 9b: a fresh mkcourse.sh course with the module copied in; ci/oncourse.js; a second run (must refuse);
# python3 build.py; the module test. Each command's exit code is written to the log named after it.
export NODE_PATH=/opt/node22/lib/node_modules
K=/home/user/exam-drill-kit/.claude/worktrees/agent-a2f96217f6a817521
E=/tmp/port-short-answer-graphs/evidence
C=${1:-/tmp/port-short-answer-graphs/c1}
T=$(basename "$C")
bash /tmp/port-tools/mkcourse.sh "$K" "$C" short-answer-graphs > "$E/$T-mkcourse.log" 2>&1; echo "exit=$?" >> "$E/$T-mkcourse.log"
node "$K/features/short-answer-graphs/ci/oncourse.js" "$K" "$C/src" > "$E/$T-oncourse.log" 2>&1; echo "exit=$?" >> "$E/$T-oncourse.log"
node "$K/features/short-answer-graphs/ci/oncourse.js" "$K" "$C/src" > "$E/$T-oncourse-second.log" 2>&1; echo "exit=$?" >> "$E/$T-oncourse-second.log"
(cd "$C" && git add -A && git -c user.email=t@t -c user.name=t commit -qm "short-answer-graphs ci data") > "$E/$T-commit.log" 2>&1; echo "exit=$?" >> "$E/$T-commit.log"
(cd "$C/src" && python3 build.py) > "$E/$T-build.log" 2>&1; echo "exit=$?" >> "$E/$T-build.log"
(cd "$C/src" && node features/short-answer-graphs/test.js) > "$E/$T-moduletest.log" 2>&1; echo "exit=$?" >> "$E/$T-moduletest.log"
for f in mkcourse oncourse oncourse-second commit build moduletest; do echo "$T-$f: $(tail -n 1 "$E/$T-$f.log")"; done
