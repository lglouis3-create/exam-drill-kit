#!/bin/bash
# run.sh COURSE_SRC LOGNAME CMD...   run CMD in COURSE_SRC, log to evidence/logs/LOGNAME.log, record exit code
export NODE_PATH=/opt/node22/lib/node_modules
SRC=$1; NAME=$2; shift 2
LOG=/tmp/port-study-controls/evidence/logs/$NAME.log
cd "$SRC" || exit 99
"$@" > "$LOG" 2>&1
rc=$?
echo "$(date -u +%FT%TZ)	$NAME	exit $rc	cd $SRC && $*" >> /tmp/port-study-controls/evidence/commands.tsv
echo "exit=$rc"; grep -E "^(PASS|FAIL|NOT RUN)" "$LOG" | tail -40
exit $rc
