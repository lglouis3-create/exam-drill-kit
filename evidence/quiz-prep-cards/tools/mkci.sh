#!/bin/bash
# mkci.sh KIT DEST: the module's own course, as core/ci_course.sh module:quiz-prep-cards builds it
# (template + core, the module copied in, ci/oncourse.js run, committed). Then build.py.
set -e
KIT=$1; DEST=$2
rm -rf "$DEST"; mkdir -p "$DEST/src"
cp -r "$KIT/template/." "$DEST/src/"
cp -r "$KIT/core/." "$DEST/src/"
mv "$DEST/src/CLAUDE.md" "$DEST/CLAUDE.md"
mkdir -p "$DEST/src/features/quiz-prep-cards"
cp -r "$KIT/features/quiz-prep-cards/current/." "$DEST/src/features/quiz-prep-cards/"
node "$KIT/features/quiz-prep-cards/ci/oncourse.js" "$KIT" "$DEST/src"
cd "$DEST" && git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm "scratch course with quiz-prep-cards"
cd "$DEST/src" && python3 build.py
