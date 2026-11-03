# paper-picker rework to Louis's policy of 2026-11-03 (agent-run)

All results here are agent-run (a rework session, 2026-11-03); none was re-run by the coordinator.

| What | Value |
|---|---|
| Start | `port/paper-picker` `b283f2f` (already merged with `main` `4e0fae4`) |
| Final head | `a440aff114b7da4dfe1cde047960f3f35bc49c2c` (one commit on top; no history rewritten) |
| Core / template trees | unchanged from `main` (`logs/inputs.txt`); `git diff 4e0fae4 a440aff -- core template` is empty |
| Source | Basic-Pharmacokinetics `ac2eb73`, read-only copy `/tmp/pk-readonly` |

## What changed

- `test_fixture.js` is remade by `scripts/mkfixture2.js` + `scripts/writefixture2.js` (rerun:
  `KIT_CORE=<kit>/core PREV_FIXTURE=<b283f2f test_fixture.js> node mkfixture2.js fixture.json exclude.json`,
  report `mkfixture-final.json`). Every field is as the course has it, `prof` ("the source's value") included;
  a check against the source finds 0 differences in questions, topics, lectures and exams.
- `ci/oncourse.js` adds the course's professors to `COURSE.professors` (core `test.js` line 60 reads each
  `prof` there) instead of writing the template's "Professor".
- 168 questions (was 118; all 118 kept). Put back: 24 of the 25 left out for naming the professor
  (m2-mc-2 stays out: its cite names no deck, C3); the 5 stems PR #31 now accepts (m6b-c01, m6b-c02,
  fig-cpt-1, fig-cpt-2, nl-c10); image questions so that every pool of all three exams is filled
  (Exam 1 m1 16/16, m2 16/16, m3 8/8). **Exam 1 can now be drawn**: its Module 2 pool was empty only
  because of the name rule.
- Module test: Exam 1's paper is checked as drawn for Exam 1; the shortage note is checked on a
  shortage set up in the page (Exam 1's Module 2 filter narrowed to a topic no question has, then put back).
- Module test fault fixed (test, not module): its select-all expectation counted a family with both a
  select-all and a single-answer wording twice; seen once Exam 1 could be drawn (`repro/try2-*`: expected
  3, got 4; `scripts/dbg.js` shows m3's families). It now expects an exact count when single-answer families
  without a select-all wording suffice, else a range up to the possible top-ups.

## Questions left out, with the reproduction

Reproduction: every candidate put back (`repro/fixture-try1.json.gz`, report `repro/mkfixture-try1.json`),
written with `writefixture2.js` into `features/paper-picker/current/test_fixture.js` of `b283f2f` plus the
`ci/oncourse.js` change, then `TMPDIR=... bash core/ci_course.sh module:paper-picker`: log
`repro/ci_course-module-paper-picker-try1.log`, per-check logs `repro/try1-per-check/` (19 PASS, 7 FAIL, 1 NOT RUN, 1 REPORT;
output_test.js and checks_test.js fail only because they run test.js). The excluded records, verbatim with their reason:
`repro/excluded-questions.json`. All faults are in the core (no change to `core/` is allowed in a port):

| Fault | Check that fails | Questions | Classification |
|---|---|---|---|
| 2 options (true/false) | core `test.js` line 84 | e2r-10, pd-c13, nl-c01, nl-c18, fr-5, fr-9, fr-10, x3-a-tf-rate, x3-a-tf-half, x3-a-tf-cl | core, kit PR #30 C2 |
| cite names no lecture deck (transcript, worksheet, homework, Canvas quiz, review sheet) | core `test.js` line 259 | m2-mc-2, inf-c8, inf-c14, m5-c04, m5-c12, m5-c17, m5-c19, m6-p1i, m6b-c18, cq4-1, ws1-3-1a, ws2-4-1d, ws2-4-1e, ws2-4-1f, ws4-2-1c, ws4-4-1a, ws5-1-3, ws5-1-4, ws6-b2e, ws6-i3-2c, hw1-1a, hwo1-1a, hw1-2a, hwo1-2a, hw4-2e, hwo4-2e, fr-1, fr-2, fr-7 | core, C3 |
| the word "undefined" in real prose | core `browser_test.js` (explanation rows), `nullexam_test.js` | m1-int-10, m5-c25, fig-elim-2 | core, C9 |
| stem rule after PR #31 ("described as", "given as the same IV bolus dose", "given as Cp = …", "According to the literature") | core `style_check.js` | inf-c8, m5-c25, m6-c01, fr-2, x3-a-p3h | core, C10 (what remains after #31) |
| "below" read as a promised figure (a table written in the stem; "well below"; "term below") | core `browser_test.js` "every stem that promises a figure shows one" | m1-ord-c07, m4-rm-6, ws1-3-1a, hw1-2a, hwo1-2a, e2r-11 | core, **new** (not in PR #30; proposed C11: the figure rule should not fire on a table in the stem or "below" as a comparison) |
| `dupOf` target is one of the above | core `test.js` line 210 | m1-ord-c08, m5-c26, cq5-2, cq5-5, e2r-7, pd-c14, nl-c08, nl-c09, x3-a-dose2, x3-c-01 | follows the target's fault |

47 questions excluded (some for two reasons), 10 more through `dupOf`.

Left out by scope or size, not to pass a check: 550 questions with a `type` (540) or `lowYield` (10) — the
exams have no `typed` and lowYield never reaches a paper; 54 image questions not needed to fill any pool
(the images are most of the 1.36 MB file).

## Checks on a440aff

| Check | Exit | Result | Log |
|---|---|---|---|
| `core/ci_course.sh module:paper-picker` | 0 | 27 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no lecture PDFs: documented exclusion), 1 REPORT (`explain_check.js`, 36 of 175); SKIPPED inside PASS lines: browser_test.js 2 (drawn structures; wide tables), nullexam_test.js 1 (Weighting chips) | `logs/ci_course-module-paper-picker.log`, `logs/run_checks-per-check/` |
| module test on that course, runs 1/2/3 | 0/0/0 | PASS 82 / 82 / 82, 0 skipped | `logs/module-test-run{1,2,3}.log` |
| module test, module code emptied | 1 | FAIL 1 of 1 (as it must) | `logs/absent-test.log` |
| module test, template course with 1 exam, no CI data | 0 | PASS 59 | `logs/plain-1exam-test.log` |
| `ci_course.sh modules:study-controls,paper-picker` (study-controls from `origin/port/study-controls`, not in this tree, so GitHub does not run this line here: information) | 0 | 28 PASS, 0 FAIL, 1 NOT RUN (cite_check.py), 1 REPORT | `logs/ci_course-modules-study-controls-paper-picker.log` |
| `theme,*` combination | — | NOT RUN: theme is not in this tree | — |
| Template course, Medicinal-chemistry | — | NOT RUN in this rework: core and template trees unchanged and the module is off there | — |
| WebKit | — | NOT RUN locally: no WebKit in this container | — |
| GitHub "Kit checks" run 41583029776 on a440aff | — | NOT RUN: every job failed to start; annotation: "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings" | `logs/github-run.txt` |
