#!/bin/bash
# f5.sh: finding F5. A template course with plan-the-problem on (origin/port/plan-the-problem 1226635, with
# equation-drill and formulas-in-text from main), set up by /tmp/port-tools/example_oncourse_plan.js (the
# coordinator's plan-the-problem course; nothing of it ships), then concept-statuses switched on with no
# course data. The test at the branch's start (46e3156) and the committed test are both run on it.
W=/home/user/exam-drill-kit/.claude/worktrees/agent-a08a9b359b929ddbc
D=/tmp/port-concept-statuses/v-ptp
export NODE_PATH=/opt/node22/lib/node_modules
bash /tmp/port-tools/mkcourse.sh "$W" "$D" concept-statuses formulas-in-text equation-drill; echo "mkcourse exit $?"
mkdir -p "$D/src/features/plan-the-problem"
for f in module.json plan-the-problem.css plan-the-problem.js step.js test.js; do
  git -C "$W" show "1226635:features/plan-the-problem/current/$f" > "$D/src/features/plan-the-problem/$f"; done
node /tmp/port-tools/example_oncourse_plan.js "$W" "$D/src"; echo "plan course exit $?"
printf "\n;COURSE.features = Object.assign({}, COURSE.features, {'concept-statuses': {version: 'v1'}});\n" >> "$D/src/course.js"
git -C "$W" show 46e3156:features/concept-statuses/current/test.js > "$D/src/features/concept-statuses/test_46e3156.js"
cd "$D" && git add -A && git -c user.email=t@t -c user.name=t commit -qm f5
cd "$D/src" && python3 build.py > "$D/build.log" 2>&1; echo "build exit $?"; grep "feature " "$D/build.log"
node features/concept-statuses/test_46e3156.js > "$D/test-old.log" 2>&1; echo "test at 46e3156 exit $?"; tail -1 "$D/test-old.log"
node features/concept-statuses/test.js > "$D/test.log" 2>&1; echo "committed test exit $?"; grep -v "^  ok" "$D/test.log" | grep -v "^$"
