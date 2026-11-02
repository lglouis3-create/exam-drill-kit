#!/bin/bash
# prints each new line of the mutation log; exits when the pass ends
LOG=/tmp/port-study-controls/evidence/logs/mutations-run2.log
n=0
while true; do
  c=$(wc -l < "$LOG")
  if [ "$c" -gt "$n" ]; then tail -n $((c - n)) "$LOG" | cut -c1-160; n=$c; fi
  if grep -qE "^done|Traceback|SystemExit" "$LOG"; then exit 0; fi
  sleep 5
done
