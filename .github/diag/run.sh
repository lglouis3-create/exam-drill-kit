#!/usr/bin/env bash
# DIAGNOSIS ONLY (branch claude/elegant-ptolemy-pqxb8y-webkit-diag).
#
#   .github/diag/run.sh <browser> <runs>
#
# Builds two scratch template courses from this kit: one as the kit builds it (for the
# unmodified core/offline_test.js) and one whose sw.js has .github/diag/sw_diag.js
# appended (for .github/diag/offline_diag.js). Then runs each test <runs> times in
# turn, in <browser>, and prints every run's whole output, then one line per run:
#   RUN <n> <test> <exit code> <its last line>
# Nothing is retried and no run is left out. Exit status 0: the counts are the result.
set -uo pipefail
browser="${1:?browser}"; runs="${2:?runs}"
kit="$(cd "$(dirname "$0")/../.." && pwd)"
work="$(mktemp -d "${TMPDIR:-/tmp}/webkit-diag-XXXXXX")"
build() {   # $1: folder; $2: patch sw.js too
  mkdir -p "$1/src"
  cp -r "$kit/template/." "$1/src/"; cp -r "$kit/core/." "$1/src/"
  mv "$1/src/CLAUDE.md" "$1/CLAUDE.md"
  (cd "$1" && git init -q && git add -A && git -c user.email=ci@example.invalid -c user.name="diag" commit -qm scratch)
  (cd "$1/src" && python3 build.py > /dev/null) || { echo "build failed in $1" >&2; exit 1; }
  if [ "$2" = yes ]; then
    cat "$kit/.github/diag/sw_diag.js" >> "$1/sw.js"
    cp "$kit/.github/diag/offline_diag.js" "$1/src/"
  fi
}
build "$work/plain" no
build "$work/diag" yes
echo "== kit $(git -C "$kit" rev-parse --short HEAD), $browser, $runs runs of each test"
summary=()
for i in $(seq 1 "$runs"); do
  for t in plain diag; do
    if [ $t = plain ]; then dir="$work/plain/src"; file=offline_test.js; else dir="$work/diag/src"; file=offline_diag.js; fi
    log="$work/$t-$i.log"
    (cd "$dir" && DRILL_BROWSER="$browser" timeout 300 node "$file") > "$log" 2>&1
    code=$?
    echo; echo "######## run $i, $file, exit $code ########"
    cat "$log"
    summary+=("RUN $i $file $code $(grep -E '^(PASS|FAIL|NOT RUN):' "$log" | tail -n 1)")
  done
done
echo; echo "######## summary ########"
printf '%s\n' "${summary[@]}"
for f in offline_test.js offline_diag.js; do
  n=$(printf '%s\n' "${summary[@]}" | grep -c " $f 0 PASS")
  echo "$f: $n of $runs runs PASS"
done
