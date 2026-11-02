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
# Exit status: run_checks.sh's (1 when the build or any check fails), and 1 when any
# check is NOT RUN that is not one of the documented exclusions below, with the reason
# given there: a missing Playwright, a browser that did not start, a missing pdfplumber
# or any other unplanned NOT RUN fails the run instead of passing on NOT RUN lines.
#
# Documented exclusions (check, the reason it must give, which courses, why):
#   cite_check.py    "no lecture PDFs found"     every course   the lecture decks are kept
#                                                               in Louis's Drive, never in
#                                                               a repository
#   stepper_test.js  "no step-through figures"   medicinal-     that course has no
#                                                chemistry      step-through figures
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
# every NOT RUN must be a documented exclusion with its documented reason
allowed() {   # $1 check, $2 reason
  case "$1" in
    cite_check.py)   [[ "$2" == "no lecture PDFs found"* ]] ;;
    stepper_test.js) [ "$kind" = medicinal-chemistry ] && [[ "$2" == "no step-through figures"* ]] ;;
    *) return 1 ;;
  esac
}
unexpected=0
while IFS= read -r line; do
  check="$(printf '%s' "$line" | sed -E 's/^NOT RUN +([^ ]+) +.*$/\1/')"
  reason="$(printf '%s' "$line" | sed -E 's/^NOT RUN +[^ ]+ +//')"
  if ! allowed "$check" "$reason"; then
    [ $unexpected -eq 0 ] && echo && echo "---- NOT RUN that is not a documented exclusion ----"
    echo "  $check: $reason"
    unexpected=$((unexpected + 1))
  fi
done < <(grep -E '^NOT RUN +[^ ]+ ' "$work/checks.log" || true)
if [ $unexpected -gt 0 ]; then
  echo "FAIL: $unexpected check(s) did not run for a reason that is not a documented exclusion" >&2
  exit 1
fi
exit "$status"
