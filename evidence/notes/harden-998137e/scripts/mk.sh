#!/usr/bin/env bash
# mk.sh <kitDir> <dest> <module> [<module> ...]: the course core/ci_course.sh builds for
# modules:<a>,<b> (the template, the core, each module copied in and switched on by its own
# features/<name>/ci/oncourse.js, in the order given), committed and built, without the checks.
set -euo pipefail
kit="$1"; dest="$2"; shift 2
rm -rf "$dest"; mkdir -p "$dest/src"
cp -r "$kit/template/." "$dest/src/"
cp -r "$kit/core/." "$dest/src/"
mv "$dest/src/CLAUDE.md" "$dest/CLAUDE.md"
for m in "$@"; do
  mkdir -p "$dest/src/features/$m"
  cp -r "$kit/features/$m/current/." "$dest/src/features/$m/"
  echo "-- $m: node features/$m/ci/oncourse.js"
  node "$kit/features/$m/ci/oncourse.js" "$kit" "$dest/src"
done
(cd "$dest" && git init -q && git add -A && git -c user.email=ci@example.invalid -c user.name="kit checks" commit -qm "scratch course with $*")
(cd "$dest/src" && python3 build.py)
