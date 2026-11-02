#!/bin/bash
# absent.sh: a template course with the module's folder copied in but NOT switched on; the module test must FAIL
W=/home/user/exam-drill-kit/.claude/worktrees/agent-a08a9b359b929ddbc
D=/tmp/port-concept-statuses/absent
export NODE_PATH=/opt/node22/lib/node_modules
bash /tmp/port-tools/mkcourse.sh "$W" "$D" concept-statuses; echo "mkcourse exit $?"
cd "$D/src" && python3 build.py > "$D/build.log" 2>&1; echo "build exit $?"
grep -c "concept-statuses" "$D/index.html" | sed 's/^/mentions of concept-statuses in the page: /'
node features/concept-statuses/test.js; echo "test exit $?"
