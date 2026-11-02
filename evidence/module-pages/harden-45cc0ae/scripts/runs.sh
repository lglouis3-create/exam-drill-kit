#!/bin/bash
# runs.sh: the module test on each course; one line per run in evidence/COMMANDS.tsv
V=/tmp/port-module-pages/v2; E=$V/evidence/logs; T=$V/evidence/COMMANDS.tsv
export NODE_PATH=/opt/node22/lib/node_modules
run(){ # name dir command...
  local name=$1 dir=$2; shift 2
  (cd "$dir" && timeout 900 "$@") > "$E/$name.log" 2>&1; local c=$?
  printf '%s\t%s\t%s\t%s\t%s\n' "$name" "$dir" "$*" "$c" "logs/$name.log" >> "$T"
  echo "$name exit $c: $(grep -E '^(PASS|FAIL|NOT RUN)' "$E/$name.log" | tail -1 | cut -c1-200)"
}
for i in 1 2 3; do run test-own-$i $V/c-own/src node features/module-pages/test.js; done
run test-partners-wsdata-absent $V/c-ci/src node features/module-pages/test.js
run test-partners-wsdata-present $V/c-ciws/src node features/module-pages/test.js
# the test at 428d109 on the module's own course (F6 before)
cp $V/c-own/src/features/module-pages/test.js $V/test-new.js
cp $V/test-428d109.js $V/c-own/src/features/module-pages/test.js
run test-428d109-own $V/c-own/src node features/module-pages/test.js
cp $V/test-428d109.js $V/c-ciws/src/features/module-pages/test.js
run test-428d109-partners-wsdata-present $V/c-ciws/src node features/module-pages/test.js
cp $V/test-new.js $V/c-own/src/features/module-pages/test.js
cp $V/test-new.js $V/c-ciws/src/features/module-pages/test.js
