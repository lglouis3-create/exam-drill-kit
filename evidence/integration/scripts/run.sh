#!/bin/bash
# run.sh LOGNAME DIR CMD...: runs CMD in DIR with NODE_PATH set, logs to logs/LOGNAME.log,
# appends the command and its exit code to logs/COMMANDS.tsv, prints the summary lines.
export NODE_PATH=$(npm root -g)
LOG=/tmp/port-integration/logs/$1.log; DIR=$2; shift 2
cd "$DIR" || exit 9
start=$(date -u +%H:%M:%S)
timeout 1500 "$@" > "$LOG" 2>&1
code=$?
echo "exit $code" >> "$LOG"
printf '%s\t%s\t%s\t%s\t%s\n' "$start" "$DIR" "$*" "$code" "$LOG" >> /tmp/port-integration/logs/COMMANDS.tsv
grep -E "^(PASS|FAIL|NOT RUN|REPORT)|^  FAIL|^exit" "$LOG" | cut -c1-600
