#!/bin/bash
# extra.sh WHAT NAME [LABEL]: run keys_test.js or contrast_test.js on the course built under ci/NAME.
export NODE_PATH=$(npm root -g)
W=$1; N=$2; LABEL=${3:-}
S=$(ls -d /tmp/port-integration-3/ci/$N/kit-ci-*/course/src | head -1)
LOG=/tmp/port-integration-3/logs/$W-$N.log; start=$(date -u +%H:%M:%S)
if [ "$W" = keys ]; then
  KEYS_SHOTS=/tmp/port-integration-3/shots/keys-$N timeout 900 node /tmp/port-integration-3/scripts/keys_test.js $S > $LOG 2>&1
else
  timeout 1800 node /tmp/port-integration-3/scripts/contrast_test.js $S /tmp/port-integration-3/shots/contrast-$N > $LOG 2>&1
fi
code=$?; echo "exit $code" >> $LOG
printf '%s\t%s\t%s\t%s\t%s\n' "$start" "$S" "${LABEL:+[$LABEL] }node scripts/${W}_test.js on $N" "$code" "$LOG" >> /tmp/port-integration-3/logs/COMMANDS.tsv
echo "== $W $N exit $code"; grep -E "^(PASS|FAIL|NOT RUN|SKIP)" $LOG | tail -5 | cut -c1-300
