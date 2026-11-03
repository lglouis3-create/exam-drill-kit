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
#
# Documented exclusions (check, the reason it must give, which courses, why):
#   cite_check.py    "no lecture PDFs found"     every course   the lecture decks are kept
#                                                               in Louis's Drive, never in
#                                                               a repository
#   stepper_test.js  "no step-through figures"   medicinal-     that course has no
#                                                chemistry      step-through figures
set -euo pipefail
kind="${1:?usage: core/ci_course.sh <template|template-unset|medicinal-chemistry|module:<name>|modules:<a>,<b>> [chromium|webkit]}"
browser="${2:-chromium}"
kit="${KIT:?set KIT}"
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

echo "COURSE $course"
