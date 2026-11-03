#!/usr/bin/env bash
# run-ci.sh <kitDir> <course kind> <log>: core/ci_course.sh <kind> from <kitDir>, its output in <log>;
# prints the exit code and the result lines.
kit="$1"; kind="$2"; log="$3"
export NODE_PATH="$(npm root -g)"
export TMPDIR=/tmp/port-notes-h/tmp
mkdir -p "$TMPDIR" "$(dirname "$log")"
cd "$kit" || exit 9
timeout 1500 bash core/ci_course.sh "$kind" > "$log" 2>&1
code=$?
echo "exit $code"
echo "$code" > "$log.exit"
grep -E "^(PASS|FAIL|NOT RUN|REPORT) |^== |^-- |wrote|^ *[0-9]+ PASS|PASS, " "$log" | tail -n 60
exit $code
