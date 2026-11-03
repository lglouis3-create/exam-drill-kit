# short-answer-graphs rework to Louis's policy of 2026-11-03 (agent-run)

Branch `port/short-answer-graphs`: `d4471bb` (start) -> `0d63860` (final, one new commit). Cloud
container, Chromium only (WebKit not installed: NOT RUN locally).

## repro-fg-kept/: the questions' fg kept

The kit at `0d63860`'s content (before its commit) with one line changed in `ci/oncourse.js`: `delete
rest.fg` removed, so each question keeps the source's `fg`. `bash core/ci_course.sh
module:short-answer-graphs`: 26 PASS, 1 FAIL, 1 NOT RUN (cite_check.py), 1 REPORT; exit 1. The FAIL is
core `browser_test.js`: "every drawn structure resolves to a group" (sgc-FG-025, -026, -027, -028, ...)
and "every structure question shows its drawing before the answer" (15 show no drawing). The core reads
`fg` as a drawn structure of atlas.js (FGQ); Intro to Pharmacology's `fg` names the figure its app.js
`moreHTML` shows after the answer. Core fault, not in PR #30. The module's own test passed there
(69 checks, 1 skipped). Files: `q90_sgc_fixture.js`, `sgc_data.js` (the course data written),
`ci_course.log`, `check-logs/`.

## final/: the final head 0d63860

`exit-codes.txt`; `ci-module.log` (core/ci_course.sh module:short-answer-graphs, exit 0: 27 PASS,
0 FAIL, 1 NOT RUN cite_check.py "no lecture PDFs found", 1 REPORT explain_check.js);
`module-test-run1..3.log` (features/short-answer-graphs/test.js on that course: 3 runs, exit 0,
69 checks passed, 1 skipped "no Graphs tab without figures"); `checks-module/` each check's log.
No line of features/ci-combinations.txt names short-answer-graphs apart from `theme,*` (theme is not on
this branch).

`scripts/`: `sag-restore.js` (how the fixture was put back) and `sag-verify.js` (0 differences between
the fixture and the source, field by field).
