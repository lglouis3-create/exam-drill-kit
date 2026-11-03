#!/bin/bash
# absent.sh : the module test where the module is absent (it must FAIL), on copies of the module's course c1.
#   a) the page built with the module switched off (course.js features without stopwatch)
#   b) the module's code removed, only its X.api kept (so the test reaches its behaviour checks)
set -u
export NODE_PATH=/opt/node22/lib/node_modules
H=/tmp/port-stopwatch-h; LOGS=$H/evidence/logs
for v in a b; do
  rm -rf $H/cx-$v; cp -r $H/c1 $H/cx-$v
  S=$H/cx-$v/src
  if [ $v = a ]; then
    printf '\n;COURSE.features = {};\n' >> $S/course.js
  else
    python3 - "$S/features/stopwatch/stopwatch.js" <<'EOF'
import sys
p = sys.argv[1]; s = open(p, encoding='utf8').read()
keep = [l for l in s.split('\n') if l.startswith('const PACE =') or l.startswith('const fmtClock') or l.startswith('X.api(')]
keep[-1] = "X.api({fmtClock, pace: PACE, tickTimers: () => {}, spent: () => []});"
open(p, 'w', encoding='utf8').write('\n'.join(keep) + '\n')
EOF
  fi
  (cd $S && python3 build.py > $LOGS/absent-$v-build.log 2>&1); echo "absent-$v build exit $?"
  (cd $S && node features/stopwatch/test.js > $LOGS/absent-$v-test.log 2>&1); code=$?
  printf '%s\t%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "$code" "absent-$v: node features/stopwatch/test.js" "$LOGS/absent-$v-test.log" >> $H/evidence/commands.tsv
  echo "absent-$v test exit $code"; grep -cE '^  FAIL' $LOGS/absent-$v-test.log; tail -n 2 $LOGS/absent-$v-test.log
done
