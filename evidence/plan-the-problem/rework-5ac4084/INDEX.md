# plan-the-problem: rework to Louis's policy of 2026-11-03, head 5ac4084 (from 3d2322b), agent-run

Every result here is **agent-run** (a rework agent in session `session_01LVkWFDVVDwgsL5WF7yWqcV`,
2026-11-03, cloud container, Chromium only). Not verified by the coordinator.

## Inputs

| What | Value |
|---|---|
| Brief | `/tmp/port-tools/REWORK.md`; policy `review/porter-policy.md` (branch `docs/porter-policy`, kit PR #36) |
| Port branch at start | `port/plan-the-problem` `3d2322b` (contains main `4e0fae4`) |
| Final head | `5ac4084cb56caf2d2c29d1a73a8d635c961cf36e`, one commit on top; no history rewritten; pushed as a fast-forward |
| Source | Basic-Pharmacokinetics `ac2eb73`, read-only clone `/tmp/pk-readonly` |
| core/ and template/ | unchanged: `git diff origin/main 5ac4084 -- core template` is empty |

## What changed (`rework.diff`)

- `features/plan-the-problem/current/test.js`: the fixture line `const PK` regenerated from the source by
  `scripts/regen_fixture.js` (the earlier script with the two name changes removed). `logs/fixture-diff.log`:
  25 values differ from 3d2322b, all of them the name: `prof` "Professor" -> the source's value on 10
  questions, 6 topics and 6 lectures, and the professor's name put back in 3 worked steps (m1-ord-n03 step 3,
  m2-n-cl2 step 2, m4-n-clt step 1), which had read "the professor". No other value changed.
- The test's scratch copies keep each question's own `prof` and `skill` (they were set to the course's first
  professor and one numeric skill); the copies' course line adds the fixture's professor and skills when the
  course lacks them.
- `features/plan-the-problem/ci/oncourse.js`: each question's own `prof` is written; the fixture's professor
  is added to COURSE.professors when the course lacks it (the template lists only "Professor").
- Module UI wording ("the professor said so", "the professor said to know it") is unchanged (generic kit text).

`logs/verify-fixture.log` (`scripts/verify_fixture.js`, exit 1 by design when anything differs): the only
differences left between the fixture and the source are fields the fixture does not carry (exam, lecture,
source, teach, teachImg, quote, dupOf, audit); every carried value, `prof` included, is the source's.

## Questions left out

None by this port: the fixture is a selection of 10 calculation questions and the earlier evidence records no
question left out for a check, a name or a pronoun.

## Checks (agent-run)

| Check | Exit | Result | Log |
|---|---|---|---|
| `core/ci_course.sh module:plan-the-problem chromium` (formulas-in-text and equation-drill switched on by their ci scripts) | 0 | run_checks.sh: 29 PASS, 0 FAIL, 0 SKIPPED, 1 NOT RUN, 1 REPORT. Core checks: 26 PASS (build.py included; home_test.js 36 checks PASS), 1 NOT RUN (`cite_check.py`, "no lecture PDFs found", documented exclusion), 1 REPORT (`explain_check.js`, 5 of 17 questions). Module tests: plan-the-problem 54 PASS, formulas-in-text 12 PASS, equation-drill 30 PASS. Sub-checks skipped inside passing checks: draw_test 1, browser_test 5, nullexam_test 1 | `logs/ci_course-module-plan-the-problem.log`, `logs/ci-module-checks/` |
| module test on that course, runs 1-3 (`scripts/three.sh`) | 0, 0, 0 | 54, 54, 54 PASS; no check skipped | `logs/module-test-run{1,2,3}.log` |
| module absent: the same course with `delete COURSE.features['plan-the-problem']`, built, module test | build 0, test 1 | FAIL 1 of 1 ("the page carries plan-the-problem, working"), not NOT RUN | `logs/module-absent-*.log` |
| combinations in `features/ci-combinations.txt` with this module | — | none apply on this branch: the only line naming every module (`theme,*`) needs theme, which is not in this branch's tree | — |
| template course, Medicinal-chemistry | — | NOT RUN in this rework: core/, template/ and the module's own files other than ci/oncourse.js and test.js are unchanged since the earlier runs | — |
| WebKit locally | — | NOT RUN: Chromium only in this container | — |

## GitHub "Kit checks" on 5ac4084

Run 41581178372, completed, conclusion failure: **NOT RUN**. Every job (Modules to check; Chromium ·
template; Chromium · template-unset; Chromium · medicinal-chemistry; WebKit · template) ended in 3-4 s
without starting, each with the annotation: "The job was not started because recent account payments have
failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your
settings". The module job (Chromium · ${{ matrix.course }}) was skipped. No check ran on GitHub; nothing was
rerun.

## Data adaptations that remain

- Ids prefixed `plc-` (ci course) and `plt-`/`eqt-` (test copies), kit CI rule 2.
- Two lecture entries `plc-L02-p1` and `plc-L07-p1` whose deck is a practice-solutions file two questions cite
  (with their own lecture's label, exam and module): core `test.js` requires every cite to name a lecture deck
  (PR #30 C3). These entries are not real lectures; they stay until C3 is changed.
- The fixture carries only the fields the module and the core read: 62 source fields are not carried (exam,
  lecture, source, teach, teachImg, quote, dupOf, audit; `logs/verify-fixture.log`), so the dupOf links of
  m2-n-cl2, m5-n07 and m5-n08 to questions outside the fixture are not in the course.
- PLAN.also is the course code planModels() written as data; PLAN.same keeps 0 of the source's 13 groups (no
  group has two lines among the equations the equation-drill fixture holds).
- The fixture's professor is added to COURSE.professors of the course it is written into.
