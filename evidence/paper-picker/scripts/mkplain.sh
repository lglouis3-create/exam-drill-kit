#!/bin/bash
# mkplain.sh <dest> [extra module ...]: the template course with one exam (the template's own), paper-picker switched on
# with no course data of its own, and each extra module copied in and switched on by its own ci/oncourse.js (run first).
# Extra modules are read from $EXTRA_KIT_<name with - as _> when set, else the kit worktree. One commit, then build.py.
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
printf '\n;COURSE.features = Object.assign({}, COURSE.features, {"paper-picker": {"version": "v1"}});\n' >> "$DEST/src/course.js"
cd "$DEST" && rm -rf .git && git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm "scratch course, one exam, paper-picker $*"
cd "$DEST/src" && python3 build.py
