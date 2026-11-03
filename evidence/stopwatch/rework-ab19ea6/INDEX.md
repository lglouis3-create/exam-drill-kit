# stopwatch rework to Louis's policy of 2026-11-03 (agent-run)

All results here are agent-run (a rework session, 2026-11-03); none was re-run by the coordinator.

| What | Value |
|---|---|
| Start | `port/stopwatch` `0312d2b` (already merged with `main` `4e0fae4`) |
| Final head | `ab19ea6150b9dea5befdabab19c603a48b354c70` (one commit on top; no history rewritten) |
| Core / template trees | unchanged from `main` (`logs/inputs.txt`) |
| Source | Basic-Pharmacokinetics `ac2eb73`, read-only copy `/tmp/pk-readonly` |

## What changed

- `test_fixture.js` is remade by `scripts/mkfixture2.js` (from `rule4-b5a419b/scripts/mkfixture.js`):
  `PREV_FIXTURE=scripts/prev-plus.js node mkfixture2.js fixture.json exclude.json`, report `mkfixture-final.json`;
  the JSON is put in place of the file's `const FIX = ...` line. Every field as the course has it, `prof` included;
  0 differences from the source in questions, topics, lectures and Exam 3. The earlier fixture had changed no text
  apart from `prof` (checked), so no worded explanation needed putting back.
- `courseData()` no longer takes a professor: each `prof` is the course's, and the course line adds the course's
  professors to `COURSE.professors`. `ci/oncourse.js` no longer stops when the first professor is not "Professor".
- Selection: only scope rules choose (not lowYield, images present, numeric or no type); the pools are filled again
  from the course's order; every question of the earlier fixture is kept, and x3-b-dosesata, which try 1 took.
  68 questions, up from 60. Put back: m1-int-07, m1-ord-c05, m2-mc-7, m2-mc-10 (they name the professor); m6b-c01,
  m6b-c02 (the "given as" stems that kit PR #31 accepts). Taken by the fill: x3-b-intsata, x3-b-dosesata.

## Questions left out, with the reproduction

Try 1, every candidate the fill took with no core rule applied (`repro/fixture-try1.json`, `repro/mkfixture-try1.json`),
in `features/stopwatch/current/test_fixture.js` of `0312d2b` with this rework's `courseData` and `ci/oncourse.js`, then
`TMPDIR=... bash core/ci_course.sh module:stopwatch`: `repro/ci_course-module-stopwatch-try1.log`, per-check logs in
`repro/try1-per-check/`: 21 PASS, 6 FAIL, 1 NOT RUN, 1 REPORT. The module's own test passed (29). output_test.js and
checks_test.js failed only because they run test.js. The records, verbatim with their reason: `repro/excluded-questions.json`.

| Fault | Failing check | Questions | Classification |
|---|---|---|---|
| 2 options (true/false) | core `test.js` line 84 | pd-c13, nl-c01, fr-10, x3-a-tf-rate, x3-a-tf-half | core, kit PR #30 C2 |
| cite names no lecture deck (a worksheet) | core `test.js` line 259 | ws2-4-1f | core, C3 |
| the word "undefined" in prose | core `browser_test.js`, `nullexam_test.js` | m5-c25 | core, C9 |
| stem rule after #31 ("described as", "According to the literature") | core `style_check.js` | m5-c25, x3-a-p3h | core, C10 |
| `dupOf` target is one of the above | core `test.js` line 210 | pd-c14, cq5-2, nl-c09, cq5-5, x3-a-dose2 | follows the target |

## Checks on ab19ea6

| Check | Exit | Result | Log |
|---|---|---|---|
| `core/ci_course.sh module:stopwatch` | 0 | 27 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no lecture PDFs: documented exclusion), 1 REPORT (`explain_check.js`, 25 of 75); SKIPPED inside PASS lines: browser_test.js 2, nullexam_test.js 1; test.js prints one "skip" line (blueprint draw) inside its PASS | `logs/ci_course-module-stopwatch.log`, `logs/run_checks-per-check/` |
| module test on that course, runs 1/2/3 | 0/0/0 | PASS 29 / 29 / 29, 0 skipped | `logs/module-test-run{1,2,3}.log` |
| module test, module code emptied | 1 | FAIL 1 of 1 (as it must) | `logs/absent-test.log` |
| module test, template course with the module on, no CI data | 0 | PASS 27, 1 skipped (the course holds Basic-Pharmacokinetics' data) | `logs/plain-test.log` |
| combinations of `features/ci-combinations.txt` with stopwatch | — | none: no line names stopwatch, and `theme,*` needs theme, which is not in this tree (`.github/ci_plan.js push`) | — |
| Template course, Medicinal-chemistry | — | NOT RUN in this rework: core and template trees unchanged; the module is off there | — |
| WebKit | — | NOT RUN locally: no WebKit in this container | — |
| GitHub "Kit checks" run 41584112774 on ab19ea6 | — | NOT RUN: no job started; annotation "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings" | `logs/github-run.txt` |
