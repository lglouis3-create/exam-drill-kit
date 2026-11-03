#!/bin/bash
# mkon.sh DEST [module ...]
# A template scratch course at DEST with theme and the named modules (and their `needs`,
# which the caller lists first) copied in from KIT (default: the port/theme worktree) or,
# for a module named in MODKIT_<name> (a directory), from that directory's features/; each
# switched on by its own ci/oncourse.js (theme last); committed; built.
# FIXTURE=1 also writes the theme test's fixture (features/theme/current/test.js FIX) as course
# data via owncourse.js. Logs: $DEST.build.log.
set -e
export NODE_PATH=$(npm root -g)
K=${KIT:-/home/user/exam-drill-kit/.claude/worktrees/agent-a645cc070760fe696}
D=$1; shift
/tmp/port-tools/mkcourse.sh "$K" "$D" > /dev/null
S=$D/src
for m in "$@" theme; do
  src="$K/features/$m"
  var="MODKIT_${m//-/_}"
  if [ -n "${!var}" ]; then src="${!var}/features/$m"; fi
  rm -rf "$S/features/$m"; mkdir -p "$S/features/$m"; cp -r "$src/current/." "$S/features/$m/"
  if [ -f "$src/ci/oncourse.js" ]; then node "$src/ci/oncourse.js" "$(dirname "$(dirname "$src")")" "$S"
  else echo "NO ci/oncourse.js for $m"; exit 3; fi
done
if [ -n "$FIXTURE" ]; then node /tmp/port-theme/tools/owncourse.js "$K" "$S"; fi
cd "$D"
git add -A
git -c user.email=t@t -c user.name=t commit -qm "modules on: $* theme"
cd "$S"
python3 build.py > "$D.build.log" 2>&1 || { tail -5 "$D.build.log"; exit 1; }
tail -1 "$D.build.log"
