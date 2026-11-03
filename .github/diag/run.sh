#!/usr/bin/env bash
# DIAGNOSIS ONLY (branch claude/elegant-ptolemy-pqxb8y-webkit-diag).
#
#   .github/diag/run.sh <browser> <runs> [sequential|load|repro]
#
# Builds two scratch template courses from this kit: one as the kit builds it (for the
# unmodified core/offline_test.js) and one whose sw.js has .github/diag/sw_diag.js
# appended (for .github/diag/offline_diag.js and repro_versionjson.js).
#   sequential (default)  each of offline_test.js and offline_diag.js <runs> times in turn
#   load                  <runs> rounds of three offline_diag.js at once while two busy
#                         loops keep the CPU occupied (a slower machine); WAIT_UP in the
#                         environment is passed on as DIAG_WAIT_AFTER_UP
#   repro                 repro_versionjson.js <runs> times
# Every run's whole output is printed, then one line per run:
#   RUN <n> <test> <exit code> <its last line>
# Nothing is retried and no run is left out. Exit status 0: the counts are the result.
set -uo pipefail
browser="${1:?browser}"; runs="${2:?runs}"; mode="${3:-sequential}"
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
    cp "$kit/.github/diag/offline_diag.js" "$kit/.github/diag/repro_versionjson.js" "$1/src/"
  fi
}
build "$work/plain" no
build "$work/diag" yes
echo "== kit $(git -C "$kit" rev-parse --short HEAD), $browser, mode $mode, $runs"
summary=()
show() {   # $1 run label, $2 file, $3 exit code, $4 log
  echo; echo "######## run $1, $2, exit $3 ########"
  cat "$4"
  summary+=("RUN $1 $2 $3 $(grep -E '^(PASS|FAIL|NOT RUN):' "$4" | tail -n 1)")
}
if [ "$mode" = repro ]; then
  for i in $(seq 1 "$runs"); do
    log="$work/repro-$i.log"
    (cd "$work/diag/src" && DRILL_BROWSER="$browser" timeout 600 node repro_versionjson.js) > "$log" 2>&1
    show "$i" repro_versionjson.js $? "$log"
  done
  echo; echo "######## summary ########"; printf '%s\n' "${summary[@]}"; exit 0
fi
if [ "$mode" = load ]; then
  for i in $(seq 1 "$runs"); do
    node -e 'const e = Date.now() + 120000; while(Date.now() < e){}' & b1=$!
    node -e 'const e = Date.now() + 120000; while(Date.now() < e){}' & b2=$!
    pids=(); for k in 1 2 3; do
      (cd "$work/diag/src" && DRILL_BROWSER="$browser" DIAG_WAIT_AFTER_UP="${WAIT_UP:-0}" timeout 300 node offline_diag.js) > "$work/load-$i-$k.log" 2>&1 & pids+=($!)
    done
    codes=(); for p in "${pids[@]}"; do wait "$p"; codes+=($?); done
    kill "$b1" "$b2" 2>/dev/null; wait "$b1" "$b2" 2>/dev/null
    for k in 1 2 3; do show "$i.$k" offline_diag.js "${codes[$((k-1))]}" "$work/load-$i-$k.log"; done
  done
  echo; echo "######## summary ########"; printf '%s\n' "${summary[@]}"
  echo "offline_diag.js under load: $(printf '%s\n' "${summary[@]}" | grep -c ' offline_diag.js 0 PASS') of $((runs * 3)) runs PASS"
  exit 0
fi
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
