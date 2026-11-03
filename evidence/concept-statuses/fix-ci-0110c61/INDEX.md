# CI-data fix for `concept-statuses`, commit `0110c61` (agent-run)

Every result here is **agent-run**, by a fixing agent in session
`session_01LVkWFDVVDwgsL5WF7yWqcV`, on 2026-11-03, in the cloud container (Chromium only). It
has not been verified by the coordinator.

## What was fixed
- Branch `port/concept-statuses`: from `6d89a5e` to `0110c61`, one new commit (`commit-message.txt`, `fix.diff`), pushed as a fast-forward. No history was rewritten. Nothing was merged. No pull request was opened or changed.
- Faults from `evidence/integration-3` (936a793, INDEX.md section 4): C3 (lecture L91 taken without checking it is free), C5 (plan-the-problem `setup` lines naming equations no module provides), D1 (unprefixed Basic-Pharmacokinetics question ids).
- Rule set: `/tmp/port-tools/CIDATA.md` (coordinator, 2026-11-03).
- Ids: every question, topic, subtopic and lecture id that the module's `ci/oncourse.js` and its test's scratch copies write, and every reference to one (dupOf, topic, sub, lecture), is the course's own id with the prefix `cst-` (test.js `const PFX`; the full mapping is in ci/oncourse.js's header). The script stops if any of these ids is already in the course.
- A plan-the-problem `setup` is written only when the course's EQUATIONS has every equation it names. An `asks` key is written only when the course's ASKS has that key. Otherwise the line is left out and the script prints which ones.
- The script runs course.js before the course's data files, since a data file may read COURSE (module-pages' `mpc_data.js` does).
- `core/` and `template/` are unchanged: `git diff 6d89a5e 0110c61 -- core template` is empty.
- Greps before the commit and the push, on the diff and the commit message: `ghp_` and `github_pat_` 0 hits; both course professors' surnames 0 hits; model identifiers 0 hits (the only matches were the required `Co-Authored-By` and `Claude-Session` trailer lines).

## The module's own course (proof a) and the module's CI course

`scripts/checks.sh`: a fresh template course (`/tmp/port-tools/mkcourse.sh` with the module), the module's `ci/oncourse.js`, `build.py`, then the module test 3 times; then `core/ci_course.sh module:concept-statuses chromium`.

| check | exit | result | log |
|---|---|---|---|
| ci/oncourse.js on a fresh template course | 0 | wrote the data (see the log for what was left out) | `logs/own-course/a-oncourse.log` |
| build.py | 0 | built | `logs/own-course/a-build.log` |
| module test, 3 runs | 0, 0, 0 | PASS 89, 89, 89 | `logs/own-course/test-run1.log` to `test-run3.log` |
| `core/ci_course.sh module:concept-statuses` | 0 | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; NOT RUN is `cite_check.py` ("no lecture PDFs found", a documented exclusion), REPORT is `explain_check.js` | `logs/own-course/ci_course.log` |

## Proof (b): the integration-3 all-patched course, with this module's fixed files in place of its scratch patch

The patched integration kit, with this module's fixed `features/concept-statuses`. The other two modules of this fix keep their scratch patch, as in the integration run. `scripts/bcourse.sh` builds the course.

| check | exit | result | log |
|---|---|---|---|
| ci/oncourse.js chain, then build.py | 0 | wrote index.html (1.79 MB); concept-statuses wrote cst-L04 and left out 3 setup and 3 asks lines | `logs/b-patched/cst-build.log` |
| core test.js | 1 | 24 duplicate question ids, 0 of them `cst-` (26 before). The 24 are notes' and quiz-prep-cards' scratch-patched, unprefixed copies against paper-picker, so this course does not test those two fixes. | `logs/b-patched/cst-coretest.log` |
| concept-statuses test.js | 0 | PASS 88 (1 skipped: the course has no matching question) | `logs/b-patched/cst-modtest.log` |

The first (b) run, before the course.js-first change, is in `logs/b-patched/first-build-before-coursejs-fix.log`. This rerun is on the committed 0110c61.

## Combined course (all three fixes, paper-picker as it stands)

The patched integration kit (`integration/ports-2026-11-03` 9acfe9d plus
`evidence/integration-3/patches/all-patched-kit.patch`), with `features/concept-statuses`,
`features/notes` and `features/quiz-prep-cards` taken from the committed heads 0110c61, f54c420
and 33a9066 (`git archive`). The course is built by `scripts/bcourse.sh` in the order of
`evidence/integration-3/logs/ci-all-patched.log`, the same way `core/ci_course.sh` builds a
`modules:` course; then `build.py`, core `test.js` and the notes test (`scripts/brun.sh`).

| check | exit | result | log |
|---|---|---|---|
| every module's ci/oncourse.js, then build.py | 0 | wrote index.html (1.79 MB) | `logs/combined/all-build.log` |
| core test.js | 0 | PASS: 364 questions checked, 73 warnings; 0 duplicate question ids (26 in the integration run) | `logs/combined/all-coretest.log` |
| notes test.js | 0 | PASS 106 | `logs/combined/all-notes-test.log` |

On this course: 0 duplicate topic ids. One duplicate lecture id is left, L91, written by
chained-problem-sets and study-controls; this fix does not touch either. There are 7 `cst-`,
16 `nts-` and 20 `qpc-` questions. None of the 43 equals one of paper-picker's 118 ids, and
26 of them keep a real id that paper-picker writes unprefixed (the D1 count). So paper-picker
stays clear of these three as long as its prefix is not `cst-`, `nts-` or `qpc-`.
The full `run_checks.sh` was not run on this course: only build.py, core test.js and the
notes test were run.

## GitHub "Kit checks" on `0110c61`

Run 41565101924, completed, conclusion success. Read with `gh api 'repos/lglouis3-create/exam-drill-kit/actions/runs?head_sha=<sha>'` and the run's jobs.

| job | result |
|---|---|
| Modules to check | success |
| Chromium · template | success |
| Chromium · template-unset | success |
| Chromium · medicinal-chemistry | success |
| Chromium · module:concept-statuses | success |
| WebKit · template (informational) | failure: core offline_test.js 2 of 28 failed ("a reload is offered once the newer page arrives"; a page error: version.json "due to access control checks"), on the template course with no module, which this change does not touch; the same job passed on the notes (f54c420) and quiz-prep-cards (33a9066) runs |

## Not run, and skipped
- `cite_check.py` on every course: no lecture PDFs (a documented exclusion).
- The full `run_checks.sh` on the (b) and combined courses: not run. Only build.py, core test.js and the module tests were run there.
- WebKit locally: not run (Chromium only in this container). The GitHub WebKit job is listed above.
