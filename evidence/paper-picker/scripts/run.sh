#!/bin/bash
# run.sh <log-name> <cwd> <command...>: runs the command in cwd, logs output to evidence/logs/<log-name>.log,
# and appends "when, exit, cwd, command, log" to evidence/commands.tsv.
EV=/tmp/port-paper-picker/evidence
mkdir -p "$EV/logs"
name=$1; dir=$2; shift 2
export NODE_PATH=$(npm root -g)
log="$EV/logs/$name.log"
( cd "$dir" && "$@" ) > "$log" 2>&1
code=$?
printf '%s\t%s\t%s\t%s\tlogs/%s.log\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$code" "$dir" "$*" "$name" >> "$EV/commands.tsv"
echo "exit $code ($log)"
tail -n ${TAILN:-4} "$log"
exit 0
