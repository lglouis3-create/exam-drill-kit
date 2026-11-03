#!/usr/bin/env bash
# DIAGNOSIS ONLY (branch claude/elegant-ptolemy-pqxb8y-import-diag; never merged).
#   .github/diag/import_runs.sh <medicinal-chemistry|module:<name>|template> <runs> [load]
# Builds the course as core/ci_course.sh does, then runs core/import_test.js <runs> times in
# turn (with "load": while two busy loops keep the CPU occupied), printing every run's
# whole output and then one line per run: RUN <n> <exit code> <its last line>.
# Nothing is retried and no run is left out. Exit status 0: the counts are the result.
# MODE=xtab: runs .github/diag/xtab.js <runs> trials instead. INSTRUMENT=1: adds instrument.py's
# report lines to the course copy of import_test.js first.
set -uo pipefail
kind="$1"; runs="$2"; load="${3:-}"
kit="$(cd "$(dirname "$0")/../.." && pwd)"
work="$(mktemp -d)"; course="$work/course"
case "$kind" in
  template) mkdir -p "$course/src"; cp -r "$kit/template/." "$course/src/"; cp -r "$kit/core/." "$course/src/"; mv "$course/src/CLAUDE.md" "$course/";;
  medicinal-chemistry) git clone -q --filter=blob:none https://github.com/lglouis3-create/Medicinal-chemistry "$course"
    for f in "$kit"/core/*; do [ "$(basename "$f")" = README.md ] && continue; cp -r "$f" "$course/src/"; done;;
  module:*) names="${kind#module:}"; mkdir -p "$course/src"; cp -r "$kit/template/." "$course/src/"; cp -r "$kit/core/." "$course/src/"; mv "$course/src/CLAUDE.md" "$course/"
    # the module and every module it needs, in ci_course.sh's order (its own code, taken from it)
    order="$(sed -n '/^    order="\$(node - "\$kit" "\$names" <<.NODE.$/,/^NODE$/p' "$kit/core/ci_course.sh" | sed '1d;$d' | node - "$kit" "$names")" || exit 1
    echo "modules: $order"
    for m in $order; do mkdir -p "$course/src/features/$m"; cp -r "$kit/features/$m/current/." "$course/src/features/$m/"; node "$kit/features/$m/ci/oncourse.js" "$kit" "$course/src" > /dev/null || exit 1; done;;
  *) echo "unknown course $kind" >&2; exit 2;;
esac
(cd "$course" && git init -q 2>/dev/null; git add -A && git -c user.email=ci@example.invalid -c user.name=diag commit -qm diag) > /dev/null
(cd "$course/src" && python3 build.py > /dev/null) || { echo "build failed"; exit 1; }
[ "${MODE:-import}" = xtab ] && { cp "$kit/.github/diag/xtab.js" "$course/src/"; cd "$course/src" && exec timeout 5400 node xtab.js "$runs"; }
[ -n "${INSTRUMENT:-}" ] && python3 -I "$kit/.github/diag/instrument.py" "$course/src/import_test.js"
echo "== kit $(git -C "$kit" rev-parse --short HEAD), $kind, $runs runs${load:+, under load}"
summary=()
for i in $(seq 1 "$runs"); do
  loops=()
  if [ -n "$load" ]; then timeout 900 node -e 'for(;;){}' & loops+=($!); timeout 900 node -e 'for(;;){}' & loops+=($!); fi
  log="$work/run-$i.log"
  (cd "$course/src" && timeout 900 node import_test.js) > "$log" 2>&1; code=$?
  for p in "${loops[@]}"; do kill "$p" 2>/dev/null; done; wait "${loops[@]}" 2>/dev/null
  echo; echo "######## run $i, exit $code ########"; cat "$log"
  summary+=("RUN $i $code $(grep -E '^(PASS|FAIL):' "$log" | tail -n 1)")
done
echo; echo "######## summary ########"; printf '%s\n' "${summary[@]}"
echo "import_test.js: $(printf '%s\n' "${summary[@]}" | grep -c ' 0 PASS') of $runs runs PASS"
