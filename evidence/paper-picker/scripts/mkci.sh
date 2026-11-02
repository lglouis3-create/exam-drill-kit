#!/bin/bash
# mkci.sh <dest> [extra module ...]: a course made the way the kit's CI makes a module course (core/ci_course.sh):
# the template and core, paper-picker (and each extra module) copied in, each extra module's ci/oncourse.js run
# first, then paper-picker's, then ONE commit, then build.py.
# Extra modules are read from the kit worktree, or from $EXTRA_KIT_<name with - as _> when set (a checkout of another branch).
set -e
KIT=/home/user/exam-drill-kit/.claude/worktrees/agent-a89fe2858fecc5225
DEST=$1; shift
/tmp/port-tools/mkcourse.sh "$KIT" "$DEST" paper-picker
for m in "$@"; do
  v="EXTRA_KIT_${m//-/_}"; src="${!v:-$KIT}"
  mkdir -p "$DEST/src/features/$m"; cp -r "$src/features/$m/current/." "$DEST/src/features/$m/"
  echo "-- $m: node $src/features/$m/ci/oncourse.js"
  node "$src/features/$m/ci/oncourse.js" "$src" "$DEST/src"
done
echo "-- paper-picker: node features/paper-picker/ci/oncourse.js"
node "$KIT/features/paper-picker/ci/oncourse.js" "$KIT" "$DEST/src"
cd "$DEST" && rm -rf .git && git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm "scratch course with paper-picker $*"
cd "$DEST/src" && python3 build.py
