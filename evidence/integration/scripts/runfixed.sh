#!/bin/bash
# runfixed.sh COURSE MODULE: the module's test before (test.js) and after the fix (test.fixed.js, the
# patched copy from fixwork/b placed beside it), on the same course; logs fix-<course>-<module>-{before,after}.
C=/tmp/port-integration/c-$1/src; m=$2
cp /tmp/port-integration/fixwork/b/features/$m/current/test.js $C/features/$m/test.fixed.js
bash /tmp/port-integration/run.sh fix-$1-$m-before $C node features/$m/test.js | grep -E "^(PASS|FAIL|NOT RUN)" | sed "s|^|$1 $m before: |" | cut -c1-260
bash /tmp/port-integration/run.sh fix-$1-$m-after $C node features/$m/test.fixed.js | grep -E "^(PASS|FAIL|NOT RUN)" | sed "s|^|$1 $m after:  |" | cut -c1-260
rm -f $C/features/$m/test.fixed.js
