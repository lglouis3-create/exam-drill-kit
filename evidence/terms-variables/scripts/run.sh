#!/bin/bash
# run.sh <log-name> <dir> <command...>: runs a command in dir with NODE_PATH set, logs output and exit code
export NODE_PATH=$(npm root -g)
E=/tmp/port-terms-variables/evidence/logs
mkdir -p "$E"
name=$1; dir=$2; shift 2
cd "$dir" || exit 1
"$@" > "$E/$name.log" 2>&1
code=$?
echo "exit $code" >> "$E/$name.log"
printf '%s\t%s\t%s\t%s\n' "$name" "$code" "$dir" "$*" >> /tmp/port-terms-variables/evidence/COMMANDS.tsv
grep -E '^(PASS|FAIL|NOT RUN|REPORT)|^ *FAIL|crashed|passed|exit ' "$E/$name.log" | tail -40
exit $code
