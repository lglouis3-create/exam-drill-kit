#!/bin/bash
# mkcombo.sh NAME "opts-json-for-study-controls-or-empty" mod ...
# A template scratch course at /tmp/port-integration/c-NAME with the named modules copied and
# switched on: ci/oncourse.js where the module has one, else on_generic.js; course data from
# int_data.js; committed; built. Prints the build's output tail.
set -e
K=${KIT:-/home/user/exam-drill-kit/.claude/worktrees/agent-afef9148abf43eda3}
N=$1; shift
D=/tmp/port-integration/c-$N
/tmp/port-tools/mkcourse.sh $K $D "$@"
S=$D/src
for m in "$@"; do
  if [ -f $K/features/$m/ci/oncourse.js ]; then node $K/features/$m/ci/oncourse.js $K $S
  elif [ "$m" = study-controls ]; then node /tmp/port-integration/on_generic.js $K $S 'study-controls={"flags":true,"layout":true,"keys":true,"strict":true}'
  else node /tmp/port-integration/on_generic.js $K $S $m; fi
done
node /tmp/port-integration/int_data.js $K $S "$@"
if [ -n "$EXTRA" ]; then printf '\n;/* integration extra */ %s\n' "$EXTRA" >> $S/course.js; echo "extra: $EXTRA"; fi
cd $D
git add -A
git -c user.email=t@t -c user.name=t commit -qm "modules on: $*"
cd $S
python3 build.py > /tmp/port-integration/logs/build-$N.log 2>&1 || { tail -5 /tmp/port-integration/logs/build-$N.log; exit 1; }
tail -3 /tmp/port-integration/logs/build-$N.log
