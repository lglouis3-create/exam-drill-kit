#!/usr/bin/env bash
# Builds one scratch course from this kit and runs every check on it, the way a
# kit session does by hand before a pull request (core/README.md, "Checks").
# The kit's GitHub workflow (.github/workflows/checks.yml) runs it on every pull
# request; a session can run it too.
#
#   core/ci_course.sh <course> [browser]
#     course   template              the new-course template with this core
#              template-unset        the same with the exam's question count and the
#                                    pools' marks unset (questions: null, marks: null)
#              medicinal-chemistry   Medicinal-chemistry's live course (public repo,
#                                    main) with this core copied in, as Mode 7 does
#     browser  chromium (default) or webkit (Safari's engine, not the Safari app)
#
# Exit status: run_checks.sh's (1 when the build or any check fails), and 1 when the
# browser named did not start, so a run whose browser checks could not run is never
# reported as passed.
set -euo pipefail
kind="${1:?usage: core/ci_course.sh <template|template-unset|medicinal-chemistry> [chromium|webkit]}"
browser="${2:-chromium}"
kit="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d "${TMPDIR:-/tmp}/kit-ci-XXXXXX")"
course="$work/course"
git_quiet() { git -c user.email=ci@example.invalid -c user.name="kit checks" "$@" >/dev/null; }

case "$kind" in
  template|template-unset)
    mkdir -p "$course/src"
    cp -r "$kit/template/." "$course/src/"
    cp -r "$kit/core/." "$course/src/"
    mv "$course/src/CLAUDE.md" "$course/CLAUDE.md"          # a course keeps its state file at the root
    if [ "$kind" = template-unset ]; then
      printf '\n;{ const E = COURSE.exams[0]; E.questions = null; E.pools.forEach(p => { p.marks = null; }); }\n' >> "$course/src/course.js"
    fi
    (cd "$course" && git init -q && git add -A && git_quiet commit -qm "scratch course")
    ;;
  medicinal-chemistry)
    git clone -q --filter=blob:none https://github.com/lglouis3-create/Medicinal-chemistry "$course"
    for f in "$kit"/core/*; do
      [ "$(basename "$f")" = README.md ] && continue
      cp -r "$f" "$course/src/"
    done
    ;;
  *) echo "unknown course: $kind" >&2; exit 2 ;;
esac

echo "== $kind, $browser, kit $(git -C "$kit" rev-parse --short HEAD 2>/dev/null || echo '?')"
set +e
(cd "$course/src" && DRILL_BROWSER="$browser" bash ./run_checks.sh) 2>&1 | tee "$work/checks.log"
status=${PIPESTATUS[0]}
set -e
# the full log of each failing check, so the reason is in the workflow's output
logs="$(sed -n 's/.*; logs in \(.*\)$/\1/p' "$work/checks.log" | tail -n 1)"
if [ -n "$logs" ] && [ -d "$logs" ]; then
  for c in $(sed -n 's/^FAIL  *\([^ ]*\).*/\1/p' "$work/checks.log"); do
    f="$logs/${c//\//__}.log"
    [ -f "$f" ] || continue
    echo; echo "---- $c (failing lines, then the end of its log) ----"
    grep -E '^ +FAIL|Error|error' "$f" | head -n 40 || true
    tail -n 25 "$f"
  done
fi
if grep -qE '^NOT RUN .*did not start' "$work/checks.log"; then
  echo "FAIL: the browser ($browser) did not start, so its checks did not run" >&2
  exit 1
fi
exit "$status"
