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
# allowed <check> <reason> uses $kind (the course) and $browser (chromium, webkit).
# A case line from run_checks.sh is "NOT RUN  <check> :: <label>  — <why>", so its reason
# starts with ":: "; a whole-check NOT RUN never does.
allowed() {
  local check="$1" reason="$2"
  if [[ "$reason" == ":: "* ]]; then
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
# unexpected_notruns <checks.log>: prints each NOT RUN line that is not allowed and returns
# how many there were (0 when every NOT RUN is a documented exclusion)
unexpected_notruns() {
  local line check reason n=0
  while IFS= read -r line; do
    check="$(printf '%s' "$line" | sed -E 's/^NOT RUN +([^ ]+) +.*$/\1/')"
    reason="$(printf '%s' "$line" | sed -E 's/^NOT RUN +[^ ]+ +//')"
    if ! allowed "$check" "$reason"; then
      [ $n -eq 0 ] && echo && echo "---- NOT RUN that is not a documented exclusion ----"
      echo "  $check: $reason"
      n=$((n + 1))
    fi
  done < <(grep -E '^NOT RUN +[^ ]+ ' "$1" || true)
  return $n
}
