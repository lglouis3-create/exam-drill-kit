#!/usr/bin/env bash
# mt.sh <courseDir> <log> [test]: runs features/notes/test.js (or the test named) in <courseDir>/src,
# its output in <log>; prints the exit code and the result lines.
c="$1"; log="$2"; t="${3:-features/notes/test.js}"
export NODE_PATH="$(npm root -g)"
mkdir -p "$(dirname "$log")"
cd "$c/src" || exit 9
timeout 900 node "$t" > "$log" 2>&1
code=$?
echo "exit $code" | tee "$log.exit"
grep -E "^ *FAIL|^(PASS|FAIL|NOT RUN)|report" "$log" | head -40
exit $code
