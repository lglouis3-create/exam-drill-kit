#!/usr/bin/env bash
# run-final.sh: the agent-run checks of the hardened notes port, on the committed port/notes in the
# worktree. Every command, its exit code and its log go into /tmp/port-notes-h/evidence/commands.tsv.
# One check at a time (other agents share the CPUs).
wt=/home/user/exam-drill-kit/.claude/worktrees/agent-a242fd253449b7ee7
H=/tmp/port-notes-h
E=$H/evidence
L=$E/logs
export NODE_PATH="$(npm root -g)"
export TMPDIR=$H/tmp
mkdir -p "$L" "$TMPDIR" "$E/screenshots"
T=$E/commands.tsv
printf 'step\tcommand\texit\tlog\n' > "$T"
run(){ # run <step> <log> <command...>
  local step="$1" log="$2"; shift 2
  ( "$@" ) > "$L/$log" 2>&1
  local c=$?
  printf '%s\t%s\t%s\t%s\n' "$step" "$*" "$c" "logs/$log" >> "$T"
  echo "$step exit $c ($log)"
  return 0
}
head=$(git -C "$wt" rev-parse HEAD)
{
  echo "port/notes tested commit: $head"
  echo "origin/main: $(git -C "$wt" rev-parse origin/main)"
  echo "core tree: $(git -C "$wt" rev-parse HEAD:core)  (origin/main: $(git -C "$wt" rev-parse origin/main:core))"
  echo "template tree: $(git -C "$wt" rev-parse HEAD:template)  (origin/main: $(git -C "$wt" rev-parse origin/main:template))"
  echo "git diff origin/main -- core template: $(git -C "$wt" diff origin/main -- core template | wc -l) lines"
  echo "Basic-Pharmacokinetics read: $(git -C /tmp/pk-readonly rev-parse HEAD)"
  echo "study-controls (scratch copies only): $(git -C "$wt" rev-parse 1c1d590)"
  echo "node: $(node --version)  python: $(python3 --version)  date: $(date -u +%FT%TZ)"
} > "$E/inputs.txt"

# 1. the module test on a page without the module's code (must FAIL)
run off-mkcourse off-mkcourse.log bash /tmp/port-tools/mkcourse.sh "$wt" $H/c-off
run off-build off-build.log bash -c "cd $H/c-off/src && python3 build.py"
run off-moduletest off-moduletest.log bash -c "cd $H/c-off/src && mkdir -p features/notes && cp $wt/features/notes/current/test.js features/notes/test.js && node features/notes/test.js"

# 2. ci/oncourse.js on a fresh course (twice: the second run must refuse), build, module test
run ci-mkcourse ci-mkcourse.log bash /tmp/port-tools/mkcourse.sh "$wt" $H/c-ci notes
run ci-oncourse ci-oncourse.log node "$wt/features/notes/ci/oncourse.js" "$wt" $H/c-ci/src
run ci-oncourse-again ci-oncourse-again.log node "$wt/features/notes/ci/oncourse.js" "$wt" $H/c-ci/src
run ci-commit ci-commit.log bash -c "cd $H/c-ci && git add -A && git -c user.email=t@t -c user.name=t commit -qm 'notes on, by ci/oncourse.js'"
run ci-build ci-build.log bash -c "cd $H/c-ci/src && python3 build.py"
run ci-moduletest-1 ci-moduletest-1.log bash -c "cd $H/c-ci/src && NOTES_SHOTS=$E/screenshots node features/notes/test.js"
run ci-moduletest-2 ci-moduletest-2.log bash -c "cd $H/c-ci/src && node features/notes/test.js"
run ci-moduletest-3 ci-moduletest-3.log bash -c "cd $H/c-ci/src && node features/notes/test.js"

# 3. the module switched on without its course data (the test writes FIX into its scratch copies)
run nodata-mkcourse nodata-mkcourse.log bash /tmp/port-tools/mkcourse.sh "$wt" $H/c-nodata notes
run nodata-on nodata-on.log bash -c "cd $H/c-nodata/src && printf '\n;COURSE.features = Object.assign({}, COURSE.features, {\"notes\": {\"version\": \"v1\"}});\n' >> course.js && cd .. && git add -A && git -c user.email=t@t -c user.name=t commit -qm 'notes on, no course data' && cd src && python3 build.py"
run nodata-moduletest nodata-moduletest.log bash -c "cd $H/c-nodata/src && node features/notes/test.js"

# 4. core/ci_course.sh module:notes (the module's own course, as the GitHub job builds it)
run ci_course-module ci_course-module-notes.log bash -c "cd $wt && bash core/ci_course.sh module:notes"

# 5. with the partner: study-controls 1c1d590 copied into a scratch copy of the kit (never committed)
run kitsc kitsc.log bash $H/kitsc.sh
run ci_course-modules ci_course-modules-notes-study-controls.log bash -c "cd $H/kitsc && bash core/ci_course.sh modules:notes,study-controls"

# 6. lookbehind and token greps
run lookbehind lookbehind.log bash -c "cd $wt && ! grep -nE '\(\?<[=!]' features/notes/current/*.js features/notes/ci/*.js"
run tokens tokens.log bash -c "cd $wt && ! git grep -nE 'ghp_|github_pat_' -- features/notes FEATURES.md review/port-queue.md"
echo done
