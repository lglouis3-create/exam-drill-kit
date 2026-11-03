# glossary-tap rework to Louis's policy of 2026-11-03 (agent-run)

Branch `port/glossary-tap`: `9b7d94f` (start) -> `d9c8ec7` (final, one new commit). Run in the cloud
container, Chromium only (Playwright's WebKit is not installed here; WebKit NOT RUN locally).

## repro-all-put-back/: every L02, L04 and L10 question put back

Data: Intro-Pharmacology- `exam1-drill/src` at `929cd62`, read-only. Made with

    node scripts/gt-gen.js <ip src> L02,L03,L04,L10 q_L02.js,q_L04.js,q_L10.js - - | node scripts/setfix.js <kit copy>/features/glossary-tap/current/test.js
    bash <kit copy>/core/ci_course.sh module:glossary-tap

(the kit copy is `9b7d94f` with this rework's `ci/oncourse.js` and test.js). Files: `q90_gtap_course.js`
and `course.js` (the course data written), `ci_course.log`, `check-logs/` (each check's log),
`test.js.direct.log`, `style_check.direct.log`. Result: 22 PASS, 5 FAIL (test.js, style_check.js,
browser_test.js, and output_test.js and checks_test.js, which run test.js), 1 NOT RUN (cite_check.py),
1 REPORT; exit 1. What failed:

- test.js: L02-010, L02-046, L02-047, L04-048 "only 2 options" (core, PR #30 C2); L02-001, L02-049 cite
  no deck (core, PR #30 C3); L10-049 dupOf points at PE2-065, not in the course (scope of the data;
  fixed by adding PE2-065 and its topic).
- style_check.js: L02-007, L02-057 [metaphor] "downstream"; L10-042, L10-051 [study meta-commentary]
  "not memorized"; 7 graph questions [commentary about the question] (core style rules on real text).
- browser_test.js: "every drawn structure resolves to a group" and "every structure question shows its
  drawing" (the 50 questions with `fg`: core reads fg as an atlas structure); "every stem that promises
  a figure shows one" (L04-016, L04-039, L04-040: their `graph` is not drawn by the core).
- state_check_test.js PASSED with prefixed L02 and L03 (PR #30 C4 does not reach prefixed ids).

## trialB-selection-ci_course.log: the selection committed

47 questions left out (`scripts/left-out-ids.txt`), fg left out, PE2-065 added:
27 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT, exit 0 (before the final commit's comment edits).

## final/: the final head d9c8ec7

`exit-codes.txt`; `ci-module.log` (core/ci_course.sh module:glossary-tap, exit 0: 27 PASS, 0 FAIL,
1 NOT RUN cite_check.py "no lecture PDFs found", 1 REPORT explain_check.js); `module-test-run1..3.log`
(features/glossary-tap/test.js on that course, 3 runs, exit 0, 56 checks passed, 1 skipped: the
formulas-in-text part); `ci-modules-glossary-tap+formulas-in-text.log` (exit 0: 28 PASS, 0 FAIL,
1 NOT RUN, 1 REPORT; glossary-tap test 93 passed); `checks-*/` each check's log.

`scripts/`: the generator and the checks that the fixtures are verbatim (`gt-verify.js`).
