#!/bin/bash
# A variant of the module's own course (mkcourse.sh + ci/oncourse.js), then build and the module test.
#   run_variant.sh <dir> saonly   the same course with GRAPHS, GRAPH_MISS and GRAPH_EXAMS taken out of
#                                 sgc_data.js (short answers only; nothing added)
#   run_variant.sh <dir> absent   the same course with the module's code left out of the page
#                                 (short-answer-graphs.js replaced by a comment): the test must FAIL
export NODE_PATH=/opt/node22/lib/node_modules
K=/home/user/exam-drill-kit/.claude/worktrees/agent-a2f96217f6a817521
E=/tmp/port-short-answer-graphs/evidence
C=$1; mode=$2; T=$(basename "$C")
bash /tmp/port-tools/mkcourse.sh "$K" "$C" short-answer-graphs > "$E/$T-mkcourse.log" 2>&1; echo "exit=$?" >> "$E/$T-mkcourse.log"
node "$K/features/short-answer-graphs/ci/oncourse.js" "$K" "$C/src" > "$E/$T-oncourse.log" 2>&1; echo "exit=$?" >> "$E/$T-oncourse.log"
case "$mode" in
  saonly) python3 - "$C/src/sgc_data.js" <<'EOF'
import sys
p = sys.argv[1]; lines = open(p).read().split('\n')
keep = [l for l in lines if not l.startswith(('const GRAPHS ', 'const GRAPH_MISS ', 'const GRAPH_EXAMS '))]
assert len(lines) - len(keep) == 3, 'expected three lines to take out'
open(p, 'w').write('\n'.join(keep))
print('took out GRAPHS, GRAPH_MISS, GRAPH_EXAMS')
EOF
  ;;
  absent) echo '/* short-answer-graphs code left out for the module-absent run */' > "$C/src/features/short-answer-graphs/short-answer-graphs.js" ;;
esac
(cd "$C" && git add -A && git -c user.email=t@t -c user.name=t commit -qm "variant $mode") > "$E/$T-commit.log" 2>&1; echo "exit=$?" >> "$E/$T-commit.log"
(cd "$C/src" && python3 build.py) > "$E/$T-build.log" 2>&1; echo "exit=$?" >> "$E/$T-build.log"
(cd "$C/src" && node features/short-answer-graphs/test.js) > "$E/$T-moduletest.log" 2>&1; echo "exit=$?" >> "$E/$T-moduletest.log"
for f in mkcourse oncourse commit build moduletest; do echo "$T-$f: $(tail -n 1 "$E/$T-$f.log")"; done
grep -E "^(PASS|FAIL|NOT RUN)" "$E/$T-moduletest.log" | cut -c1-300
