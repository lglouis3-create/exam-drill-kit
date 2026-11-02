#!/bin/bash
# modcourse.sh KIT DEST MODULE...   (env EXTRA_DATA: a node script run as `node $EXTRA_DATA KIT SRC` after the modules)
# A scratch course as core/ci_course.sh module:<name> makes it (ccc5172): template + core + each module,
# each module switched on by its own features/<m>/ci/oncourse.js when it has one; a module without one
# (or one named in env NO_CI) is switched on by one course.js line at its module.json version, with no data.
# All in one commit (state_check.js reads when the lectures were added), then built.
set -e
KIT=$1; DEST=$2; shift 2
/tmp/port-tools/mkcourse.sh "$KIT" "$DEST" "$@"
S=$DEST/src
for m in "$@"; do
  if [ -f "$KIT/features/$m/ci/oncourse.js" ] && [[ " $NO_CI " != *" $m "* ]]; then
    echo "-- $m: node features/$m/ci/oncourse.js"; node "$KIT/features/$m/ci/oncourse.js" "$KIT" "$S"
  else
    v=$(node -e 'console.log(require(process.argv[1]).version)' "$KIT/features/$m/current/module.json")
    printf '\n;/* %s on */ COURSE.features = Object.assign({}, COURSE.features, {"%s": {"version": "%s"}});\n' "$m" "$m" "$v" >> "$S/course.js"
    echo "-- $m: no ci/oncourse.js; switched on at $v by one course.js line"
  fi
done
if [ -n "$EXTRA_DATA" ]; then echo "-- extra data: $EXTRA_DATA"; node "$EXTRA_DATA" "$KIT" "$S"; fi
cd "$DEST"
git add -A
git -c user.email=t@t -c user.name=t commit -q --amend -m "scratch course with $*"
git log --oneline | wc -l | sed 's/^/commits: /'
cd "$S"
python3 build.py > ../build.log 2>&1 || { tail -5 ../build.log; exit 1; }
tail -2 ../build.log
