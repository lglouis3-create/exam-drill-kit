#!/bin/bash
# run.sh <label> <dir> <command...>: runs the command in <dir>, logs its output to
# /tmp/port-plan-the-problem/evidence/logs/<label>.log and appends
# label, dir, command, exit code and log to evidence/COMMANDS.tsv. Exits with the command's code.
label=$1; dir=$2; shift 2
EV=/tmp/port-plan-the-problem/evidence; mkdir -p "$EV/logs"
log="$EV/logs/$label.log"
export NODE_PATH=/opt/node22/lib/node_modules
( cd "$dir" && "$@" ) > "$log" 2>&1
code=$?
printf '%s\t%s\t%s\t%s\tlogs/%s.log\t%s\n' "$label" "$dir" "$*" "$code" "$label" "$(date -u +%FT%TZ)" >> "$EV/COMMANDS.tsv"
echo "$label exit=$code"; tail -n 3 "$log"
exit $code
