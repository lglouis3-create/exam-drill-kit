#!/usr/bin/env bash
# Build the course, then run every check on its own and print one line per check:
#
#   ./run_checks.sh                  build, then every check in CHECKS
#   ./run_checks.sh test.js ...      build, then only the checks named
#
# A check exits 0 on pass, 1 on fail and 2 when it could not run (NOT RUN, with
# the reason as its last line); a report has no failing condition, exits 0 and
# says REPORT (check_lib.js). Each check runs separately, so one failure cannot
# hide another, and its full output is kept in the log folder named at the end.
# This script exits 1 when the build or any check fails. NOT RUN is listed with
# its reason and is never counted as a pass.
set -uo pipefail
cd "$(dirname "$0")" || exit 1
export NODE_PATH="${NODE_PATH:-$(npm root -g 2>/dev/null)}"

CHECKS=(test.js style_check.js render_test.js explain_check.js stepper_test.js cite_check.py
        device_lint.js output_test.js checks_test.js draw_test.js browser_test.js storage_test.js
        update_test.js offline_test.js home_test.js history_test.js scheduler_test.js
        preview_test.js state_check.js state_check_test.js oldcache_test.js)
[ $# -gt 0 ] && CHECKS=("$@")

LOGS=$(mktemp -d "${TMPDIR:-/tmp}/drill-checks-XXXXXX")
pass=0; fail=0; notrun=0; report=0
line() { printf '%-8s %-17s %s\n' "$1" "$2" "$3"; }

# the summary a check printed last, without its own "STATUS: name:" prefix
reason() {
  local last
  last=$(grep -v '^[[:space:]]*$' "$1" | tail -n 1)
  last=${last#PASS: }; last=${last#FAIL: }; last=${last#NOT RUN: }; last=${last#REPORT: }
  echo "${last#"$2": }" | cut -c1-200
}

if python3 build.py > "$LOGS/build.py.log" 2>&1; then
  line PASS build.py "$(grep '^wrote index.html' "$LOGS/build.py.log" | head -n 1)"
  pass=$((pass + 1))
else
  line FAIL build.py "$(reason "$LOGS/build.py.log" build.py)"
  for c in "${CHECKS[@]}"; do line "NOT RUN" "$c" "the build failed, so there is no current page to check"; done
  echo "1 FAIL, ${#CHECKS[@]} NOT RUN; logs in $LOGS"
  exit 1
fi

for c in "${CHECKS[@]}"; do
  log="$LOGS/$c.log"
  if [ ! -f "$c" ]; then
    line FAIL "$c" "no such check in $(pwd)"; fail=$((fail + 1)); continue
  fi
  case "$c" in
    *.py) timeout 900 python3 "$c" > "$log" 2>&1 ;;
    *)    timeout 900 node "$c" > "$log" 2>&1 ;;
  esac
  rc=$?
  why=$(reason "$log" "$c")
  if [ $rc -eq 0 ] && grep -v '^[[:space:]]*$' "$log" | tail -n 1 | grep -q '^REPORT:'; then
    line REPORT "$c" "$why"; report=$((report + 1))
  elif [ $rc -eq 0 ]; then
    line PASS "$c" "$why"; pass=$((pass + 1))
  elif [ $rc -eq 2 ]; then
    line "NOT RUN" "$c" "$why"; notrun=$((notrun + 1))
  elif [ $rc -eq 124 ]; then
    line FAIL "$c" "timed out after 900 s"; fail=$((fail + 1))
  else
    line FAIL "$c" "$why"; fail=$((fail + 1))
  fi
done

echo "$pass PASS, $fail FAIL, $notrun NOT RUN, $report REPORT; logs in $LOGS"
[ $fail -eq 0 ]
