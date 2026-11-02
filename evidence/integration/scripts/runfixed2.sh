#!/bin/bash
# runfixed2.sh COURSE MODULE: the module's original test (as on the integration branch) and the fixed
# one, side by side in the course's features/<module>/; logs fix-<course>-<module>-{before,after}.
K=/home/user/exam-drill-kit/.claude/worktrees/agent-afef9148abf43eda3
C=/tmp/port-integration/c-$1/src; m=$2
cp $K/features/$m/current/test.js $C/features/$m/test.orig.js
cp /tmp/port-integration/fixwork/b/features/$m/current/test.js $C/features/$m/test.fixed.js
bash /tmp/port-integration/run.sh fix-$1-$m-before $C node features/$m/test.orig.js | grep -E "^(PASS|FAIL|NOT RUN)" | sed "s|^|$1 $m before: |" | cut -c1-300
bash /tmp/port-integration/run.sh fix-$1-$m-after $C node features/$m/test.fixed.js | grep -E "^(PASS|FAIL|NOT RUN)" | sed "s|^|$1 $m after:  |" | cut -c1-300
rm -f $C/features/$m/test.orig.js $C/features/$m/test.fixed.js
