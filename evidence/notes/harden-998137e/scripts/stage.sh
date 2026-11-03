#!/usr/bin/env bash
# stage.sh: copies this hardening run's evidence into the evidence/notes worktree, under
# evidence/notes/harden-998137e/, and checks that no file there names the professor.
set -euo pipefail
H=/tmp/port-notes-h; E=$H/evidence; D=$H/ev/evidence/notes/harden-998137e
rm -rf "$D"; mkdir -p "$D/scripts" "$D/logs/ci_course-module-notes-checks" "$D/logs/ci_course-modules-notes-study-controls-checks"
cp -r "$E/logs/." "$D/logs/"
cp -r "$E/mutations" "$E/mutations-notes-first" "$E/screenshots" "$D/"
cp "$E/inputs.txt" "$E/commands.tsv" "$E/github-run-41552662982.tsv" "$D/"
cp -r $H/tmp/drill-checks-SRsyIx/. "$D/logs/ci_course-module-notes-checks/"
cp -r $H/tmp/drill-checks-og8xJ1/. "$D/logs/ci_course-modules-notes-study-controls-checks/"
cp $H/run-final.sh $H/mk.sh $H/mt.sh $H/kitsc.sh $H/run-ci.sh $H/ghwait.sh $H/mutations.py $H/stage.sh "$D/scripts/"
cp $H/tools/extract.js $H/tools/probe3.js "$D/scripts/"
n=$(node -e "console.log(require('fs').readFileSync('/tmp/pk-readonly/src/course.js','utf8').match(/professors: \['([^']+)'/)[1])")
if grep -rli -- "$n" "$D" "$H/ev/evidence/notes/INDEX.md" 2>/dev/null; then echo "the professor's name is in the files above"; exit 1; fi
echo "no file names the professor"
find "$D" -type f | wc -l
du -sh "$D"
