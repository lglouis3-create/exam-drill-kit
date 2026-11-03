#!/bin/bash
# run.sh LOG CMD...  : run CMD with NODE_PATH set as the brief says, log stdout+stderr to LOG,
# append "<exit> <cmd> <log>" to /tmp/port-stopwatch-h/evidence/commands.tsv, print the tail.
LOG=$1; shift
export NODE_PATH=/opt/node22/lib/node_modules
mkdir -p "$(dirname "$LOG")"
"$@" > "$LOG" 2>&1
code=$?
printf '%s\t%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "$code" "$*" "$LOG" >> /tmp/port-stopwatch-h/evidence/commands.tsv
tail -n "${TAILN:-30}" "$LOG"
echo "exit=$code"
exit $code
