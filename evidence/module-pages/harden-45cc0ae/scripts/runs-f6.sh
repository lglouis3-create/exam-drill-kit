#!/bin/bash
# runs-f6.sh: the F6 case (worksheets-ink's data at integration fa99b5c, with its own Module 2
# questions, documents and sets; no module-pages ci data): the test at 428d109, then the new test.
V=/tmp/port-module-pages/v2; E=$V/evidence/logs; T=$V/evidence/COMMANDS.tsv
export NODE_PATH=/opt/node22/lib/node_modules
run(){ local name=$1 dir=$2; shift 2
  (cd "$dir" && timeout 900 "$@") > "$E/$name.log" 2>&1; local c=$?
  printf '%s\t%s\t%s\t%s\t%s\n' "$name" "$dir" "$*" "$c" "logs/$name.log" >> "$T"
  echo "$name exit $c: $(grep -E '^(PASS|FAIL|NOT RUN)' "$E/$name.log" | tail -1 | cut -c1-200)"; }
cp $V/test-428d109.js $V/c-f6/src/features/module-pages/test.js
run test-428d109-f6-integration-wsdata $V/c-f6/src node features/module-pages/test.js
cp $V/test-new.js $V/c-f6/src/features/module-pages/test.js
run test-new-f6-integration-wsdata $V/c-f6/src node features/module-pages/test.js
