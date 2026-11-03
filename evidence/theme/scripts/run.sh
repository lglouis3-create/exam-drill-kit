#!/bin/bash
# run.sh LOGNAME DIR CMD...: runs CMD in DIR with NODE_PATH set, writes stdout+stderr to
# /tmp/port-theme/evidence/logs/LOGNAME.log, appends "date, dir, command, exit, log" to
# /tmp/port-theme/evidence/logs/COMMANDS.tsv, prints the exit code and the result lines.
export NODE_PATH=$(npm root -g)
name=$1; dir=$2; shift 2
mkdir -p /tmp/port-theme/evidence/logs
log=/tmp/port-theme/evidence/logs/$name.log
start=$(date -u +%H:%M:%S)
(cd "$dir" && "$@") > "$log" 2>&1
code=$?
printf '%s\t%s\t%s\t%s\t%s\n' "$start" "$dir" "$*" "$code" "logs/$name.log" >> /tmp/port-theme/evidence/logs/COMMANDS.tsv
echo "exit $code ($name)"
grep -E "^ *FAIL|^FAIL|^PASS|^NOT RUN|^REPORT|passed|failed|checks? (passed|failed)|^[0-9]+ PASS" "$log" | tail -n 60
