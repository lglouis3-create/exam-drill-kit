# The NOT RUN results a kit CI run accepts, and nothing else (sourced by ci_course.sh;
# tested by notruncase_test.js). Every other NOT RUN, of a whole check or of one case
# inside a check, fails the run.
#
#   cite_check.py      "no lecture PDFs found"         every course   the lecture decks are
#                                                                     kept in Louis's Drive,
#                                                                     never in a repository
#   stepper_test.js    "no step-through figures"       medicinal-     that course has no
#                                                      chemistry      step-through figures
#   features/worksheets-ink/test.js, the one case "the printed PDF's size", WebKit only,
#                      why beginning "page.pdf runs only in Chromium": Playwright's page.pdf
#                      exists only in Chromium; the printed worksheet is still checked by its
#                      print layout in WebKit, and the PDF and its size in Chromium
#                      (Louis, 2026-11-06)
#
# allowed <check> <reason> [case] uses $kind (the course) and $browser (chromium, webkit).
# A whole-check line from run_checks.sh is "NOT RUN  <check>  <why>"; a case line is
# "NOT RUN CASE  <check> :: <label>  — <why>", and allowed is called with "case" for it.
allowed() {
  local check="$1" reason="$2" what="${3:-check}"
  if [ "$what" = case ]; then
    [[ "$reason" == ":: "* ]] || return 1
    local rest="${reason#:: }" label why
    label="${rest%%  — *}"; why="${rest#*  — }"
    [ "$label" != "$rest" ] || return 1            # no "  — " separator: not a case line
    case "$check" in
      features/worksheets-ink/test.js)
        [ "${browser:-}" = webkit ] && [ "$label" = "the printed PDF's size" ] && [[ "$why" == "page.pdf runs only in Chromium"* ]] ;;
      *) return 1 ;;
    esac
    return
  fi
  case "$check" in
    cite_check.py)   [[ "$reason" == "no lecture PDFs found"* ]] ;;
    stepper_test.js) [ "${kind:-}" = medicinal-chemistry ] && [[ "$reason" == "no step-through figures"* ]] ;;
    *) return 1 ;;
  esac
}
# unexpected_notruns <checks.log>: prints each NOT RUN line, of a check or of a case, that is not
# a documented exclusion, and sets UNEXPECTED_NOTRUNS to how many there were (the return status
# is only 0 or 1, so a count of 256 or more cannot wrap to 0). The case lines are also counted
# against the "<n> NOT RUN case(s)" that run_checks.sh printed: a difference means a line in the
# log did not come from run_checks.sh, and counts as unexpected.
UNEXPECTED_NOTRUNS=0
unexpected_notruns() {
  local line check reason n=0 listed=0 counted
  while IFS= read -r line; do
    if [[ "$line" == "NOT RUN CASE  "* ]]; then
      listed=$((listed + 1))
      check="$(printf '%s' "$line" | sed -E 's/^NOT RUN CASE  ([^ ]+) .*$/\1/')"
      reason="$(printf '%s' "$line" | sed -E 's/^NOT RUN CASE  [^ ]+ //')"
      allowed "$check" "$reason" case && continue
    else
      check="$(printf '%s' "$line" | sed -E 's/^NOT RUN +([^ ]+) +.*$/\1/')"
      reason="$(printf '%s' "$line" | sed -E 's/^NOT RUN +[^ ]+ +//')"
      allowed "$check" "$reason" && continue
    fi
    [ $n -eq 0 ] && echo && echo "---- NOT RUN that is not a documented exclusion ----"
    echo "  $check: $reason"
    n=$((n + 1))
  done < <(grep -E '^NOT RUN +[^ ]+ ' "$1" || true)
  counted="$(sed -nE 's/^[0-9]+ PASS, [0-9]+ FAIL, [0-9]+ NOT RUN, [0-9]+ REPORT, ([0-9]+) NOT RUN case\(s\); logs in .*$/\1/p' "$1" | tail -n 1)"
  if [ "${counted:-0}" != "$listed" ]; then
    [ $n -eq 0 ] && echo && echo "---- NOT RUN that is not a documented exclusion ----"
    echo "  $listed NOT RUN case line(s) in the log, but run_checks.sh counted ${counted:-0}"
    n=$((n + 1))
  fi
  UNEXPECTED_NOTRUNS=$n
  [ $n -eq 0 ]
}

# Checks that must have passed when a module is on, by browser, so an exclusion above can never
# stand in for them (Louis, 2026-11-06: the Chromium PDF checks and the WebKit print-layout check
# stay required). Each entry: module, browser, the start of the "  ok    " line its test prints.
REQUIRED_PASSES=(
  "worksheets-ink|chromium|the printed PDF has the worksheet"
)
for b in chromium webkit; do
  REQUIRED_PASSES+=(
    "worksheets-ink|$b|Save as PDF prints the worksheet alone"
    "worksheets-ink|$b|in print the worksheet's paper is laid out and every problem prints with its text"
    "worksheets-ink|$b|in print the ink's picture covers its problem and holds the stroke"
    "worksheets-ink|$b|the worksheet renders in print media"
  )
done
unset b
# missing_required <modules on, space-separated> <browser> <logs dir>: prints each required pass
# that is missing from its module test's log and sets MISSING_REQUIRED to how many
MISSING_REQUIRED=0
missing_required() {
  local order=" $1 " br="$2" logs="$3" entry m b want f n=0
  for entry in "${REQUIRED_PASSES[@]}"; do
    IFS='|' read -r m b want <<< "$entry"
    [[ "$order" == *" $m "* ]] && [ "$b" = "$br" ] || continue
    f="$logs/features__${m}__test.js.log"
    if ! { [ -f "$f" ] && awk -v w="  ok    $want" 'index($0, w) == 1 {f = 1} END {exit !f}' "$f"; }; then
      [ $n -eq 0 ] && echo && echo "---- a required check did not pass ----"
      echo "  features/$m/test.js in $br: \"$want\""
      n=$((n + 1))
    fi
  done
  MISSING_REQUIRED=$n
  [ $n -eq 0 ]
}
