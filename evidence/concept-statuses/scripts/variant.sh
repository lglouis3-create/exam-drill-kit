#!/bin/bash
# variant.sh <dest> <old-test 0|1> <module to switch on> ... : a template course with concept-statuses on
# (no course data: the test adds FIX to its scratch copy) and the named kit modules copied in and on.
# plan-the-problem is taken from origin/port/plan-the-problem (1226635), never committed to the port branch.
# With old-test 1, the test of the branch's start (46e3156) is run too, as test_46e3156.js.
W=/home/user/exam-drill-kit/.claude/worktrees/agent-a08a9b359b929ddbc
D=$1; OLD=$2; shift 2
export NODE_PATH=/opt/node22/lib/node_modules
bash /tmp/port-tools/mkcourse.sh "$W" "$D" concept-statuses; echo "mkcourse exit $?"
line="COURSE.features = Object.assign({}, COURSE.features, {'concept-statuses': {version: 'v1'}"
for m in "$@"; do
  mkdir -p "$D/src/features/$m"
  if [ "$m" = plan-the-problem ]; then
    for f in module.json plan-the-problem.css plan-the-problem.js step.js test.js; do
      git -C "$W" show "1226635:features/plan-the-problem/current/$f" > "$D/src/features/$m/$f"; done
  else cp -r "$W/features/$m/current/." "$D/src/features/$m/"; fi
  if [ -f "$W/features/$m/ci/oncourse.js" ]; then node "$W/features/$m/ci/oncourse.js" "$W" "$D/src"; echo "$m oncourse exit $?"; continue; fi
  v=$(node -e "console.log(require('$D/src/features/$m/module.json').version)")
  line="$line, '$m': {version: '$v'}"
done
printf '\n;%s});\n' "$line" >> "$D/src/course.js"
tail -1 "$D/src/course.js"
if [ "$OLD" = 1 ]; then git -C "$W" show 46e3156:features/concept-statuses/current/test.js > "$D/src/features/concept-statuses/test_46e3156.js"; fi
cd "$D" && git add -A && git -c user.email=t@t -c user.name=t commit -qm variant
cd "$D/src" && python3 build.py > "$D/build.log" 2>&1; echo "build exit $?"; tail -2 "$D/build.log"
node features/concept-statuses/test.js > "$D/test.log" 2>&1; echo "test exit $?"; grep -v "^  ok" "$D/test.log" | grep -v "^$"
if [ "$OLD" = 1 ]; then node features/concept-statuses/test_46e3156.js > "$D/test-old.log" 2>&1; echo "test at 46e3156 exit $?"; tail -2 "$D/test-old.log"; fi
