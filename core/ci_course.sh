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
#              module:<name>         the template with one feature module switched on by
#                                    its features/<name>/ci/oncourse.js
#              modules:<a>,<b>,...   the template with several modules switched on together
#     browser  chromium (default) or webkit (Safari's engine, not the Safari app)
#
# A module course: each module named, and every module its module.json `needs` names
# (and theirs), is copied from features/<name>/current/ into src/features/<name>/ and
# switched on by its own features/<name>/ci/oncourse.js <kitDir> <courseSrcDir>, a
# module before the modules that need it. That script writes the module's course data
# (taken from its test's fixture, nothing invented) and one course.js line. The run
# stops before any check when a module, its module.json or its ci/oncourse.js is
# missing, when the `needs` form a loop, or when a script exits non-zero.
#
# Exit status: run_checks.sh's (1 when the build or any check fails), and 1 when any
# check is NOT RUN that is not one of the documented exclusions below, with the reason
# given there: a missing Playwright, a browser that did not start, a missing pdfplumber
# or any other unplanned NOT RUN fails the run instead of passing on NOT RUN lines.
# On a module course, also 1 when a module's own test (features/<name>/test.js) did not
# PASS with at least one passed check printed after the browser it started (check_lib.js
# launch) was the run's browser.
#
# Documented exclusions (check, the reason it must give, which courses, why):
#   cite_check.py    "no lecture PDFs found"     every course   the lecture decks are kept
#                                                               in Louis's Drive, never in
#                                                               a repository
#   stepper_test.js  "no step-through figures"   medicinal-     that course has no
#                                                chemistry      step-through figures
set -euo pipefail
kind="${1:?usage: core/ci_course.sh <template|template-unset|medicinal-chemistry|module:<name>|modules:<a>,<b>> [chromium|webkit]}"
browser="${2:-chromium}"; browser="${browser,,}"
order=""   # the modules switched on (module courses only), never taken from the environment
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
  module:*|modules:*)
    names="${kind#*:}"
    if [ "${kind%%:*}" = module ] && [[ "$names" == *,* ]]; then echo "module: takes one name; use modules:<a>,<b>" >&2; exit 2; fi
    # every module named and every module it needs, a module after the ones it needs
    order="$(node - "$kit" "$names" <<'NODE'
const fs = require('fs'), path = require('path');
const [kit, list] = process.argv.slice(2);
const stop = m => { console.error('module course: ' + m); process.exit(1); };
const want = list.split(',').map(s => s.trim()).filter(Boolean);
if(!want.length) stop('no module named');
const order = [], state = {};
function visit(n, chain){
  if(!/^[a-z0-9][a-z0-9-]*$/.test(n)) stop(`"${n}" is not a module name`);
  if(state[n] === 2) return;
  if(state[n] === 1) stop('the modules\' needs form a loop: ' + chain.concat(n).join(' needs '));
  const f = path.join(kit, 'features', n, 'current', 'module.json');
  let m;
  try { m = JSON.parse(fs.readFileSync(f, 'utf8')); } catch(e){ stop(`features/${n}/current/module.json cannot be read` + (chain.length ? ` (needed by ${chain[chain.length - 1]})` : '') + ': ' + e.message.split('\n')[0]); }
  if(m.name !== n) stop(`features/${n}/current/module.json names the module "${m.name}"`);
  state[n] = 1;
  for(const d of m.needs || []) visit(d, chain.concat(n));
  state[n] = 2; order.push(n);
}
want.forEach(n => visit(n, []));
console.log(order.join(' '));
NODE
)" || exit 1
    mkdir -p "$course/src"
    cp -r "$kit/template/." "$course/src/"
    cp -r "$kit/core/." "$course/src/"
    mv "$course/src/CLAUDE.md" "$course/CLAUDE.md"
    echo "== modules switched on, in this order: $order"
    for m in $order; do
      script="$kit/features/$m/ci/oncourse.js"
      if [ ! -f "$script" ]; then echo "FAIL: features/$m/ci/oncourse.js is missing, so $m cannot be switched on in a course" >&2; exit 1; fi
      mkdir -p "$course/src/features/$m"
      cp -r "$kit/features/$m/current/." "$course/src/features/$m/"
      echo "-- $m: node features/$m/ci/oncourse.js"
      if ! node "$script" "$kit" "$course/src"; then echo "FAIL: features/$m/ci/oncourse.js exited non-zero" >&2; exit 1; fi
    done
    (cd "$course" && git init -q && git add -A && git_quiet commit -qm "scratch course with $order")
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
# A module course: each module switched on must have its own test (features/<name>/test.js)
# PASS, with at least one passed check printed after the line check_lib.js's launch prints
# when the run's browser has started. A test that finished before starting its browser,
# started none through launch, or passed nothing after it, does not count as run there.
# (A check printed after that line is counted whether or not it used the page; the kit's
# module tests do use it.)
if [ -n "${order:-}" ]; then
  want="$(case "$browser" in webkit) echo WebKit;; firefox) echo Firefox;; *) echo Chromium;; esac)"
  short=0
  echo; echo "---- each module's own test in $want ----"
  for m in $order; do
    c="features/$m/test.js"; f="$logs/${c//\//__}.log"
    res="$(grep -E "^[A-Z ]+ +features/$m/test.js " "$work/checks.log" | head -n 1 | awk '{print $1}' || true)"
    n=0
    if [ -n "$logs" ] && [ -f "$f" ]; then n="$(awk -v b="  browser  $want started" '$0 == b {on = 1; next} on && /^  ok /{k++} END {print k + 0}' "$f")"; fi
    if [ "$res" = PASS ] && [ "$n" -ge 1 ]; then echo "  $m: PASS, $n check(s) passed in $want"
    else echo "  $m: ${res:-no result}, $n check(s) passed in $want"; short=$((short + 1)); fi
  done
  if [ $short -gt 0 ]; then
    echo "FAIL: $short module test(s) did not pass at least one check in $want" >&2
    exit 1
  fi
fi
exit "$status"
