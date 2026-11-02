#!/bin/bash
# mkcourse.sh KIT DEST [module ...]
# A scratch course: template/ + core/ (+ each named module's current/ in src/features/<name>/),
# CLAUDE.md copied to the repo root (state_check.js needs it), committed in a fresh git repo.
# Add the course data a module needs (data files, course.js `files` and `features`) yourself
# AFTER this, then commit again before run_checks.sh (state_check reads the commits).
set -e
KIT=$1; DEST=$2; shift 2
rm -rf "$DEST"; mkdir -p "$DEST/src"
cp -r "$KIT/template/." "$DEST/src/"
find "$KIT/core" -maxdepth 1 -type f ! -name README.md -exec cp {} "$DEST/src/" \;
cp -r "$KIT/core/vendor" "$DEST/src/"
for m in "$@"; do mkdir -p "$DEST/src/features/$m"; cp -r "$KIT/features/$m/current/." "$DEST/src/features/$m/"; done
cp "$DEST/src/CLAUDE.md" "$DEST/CLAUDE.md"
cd "$DEST" && git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm init
