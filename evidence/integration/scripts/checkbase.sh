#!/bin/bash
# Each patched file's base (a/) is the same blob as on its port branch head.
cd /home/user/exam-drill-kit/.claude/worktrees/agent-afef9148abf43eda3
for f in glossary-tap/current/test.js paper-picker/current/test.js module-pages/current/test.js worksheets-ink/current/test.js worksheets-ink/ci/oncourse.js terms-variables/current/test.js concept-statuses/current/test.js; do
  m=${f%%/*}
  b=$(git rev-parse origin/port/$m:features/$f)
  a=$(git hash-object /tmp/port-integration/fixwork/a/features/$f)
  [ "$a" = "$b" ] && echo "same  $f (port/$m $(git rev-parse --short origin/port/$m))" || echo "DIFFERS $f (port/$m $(git rev-parse --short origin/port/$m))"
done
