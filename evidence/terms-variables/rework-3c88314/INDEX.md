# Rework of terms-variables (kit PR #18) to Louis's porter policy of 2026-11-03

Every result here is **agent-run** (a rework agent of the "Kit feature porter" session, 2026-11-03).
Port branch: `port/terms-variables`, start `9ac2df2` (already merged with main `4e0fae4`), final `3c88314`.
Core and template are main's (`inputs.txt`: core tree `f631c5e` on both; `git diff 4e0fae4 3c88314 -- core template` is empty).

## What changed in `3c88314`

- `PK` in `features/terms-variables/current/test.js`: every question, term, topic, lecture and skill is taken again
  from Basic-Pharmacokinetics at `ac2eb73` (`scripts/restore_fix.js`, `restore_fix.log`).
  - Before, it differed in 29 fields (`cmp_old.log`): `prof` on 10 questions, 5 topics and 5 lectures ("Professor",
    or "PROF" in the lectures), and 9 worked steps and concept lines reading "The professor" where the course prints
    "Dr. Mosley".
  - Now there are 0 differences (`cmp_final.log`). No question had been left out of the fixture because of a name.
- The test's scratch copies keep each question's own `prof` and `skill` (before, both were set to the course's
  first professor and skill). The professor's name and the 5 skills are added to `COURSE` when the course lacks them.
- `ci/oncourse.js` writes `prof` as the course has it, on questions, topics and lectures.
- A new check: the questions keep the course's `prof`, skill, stem, worked steps and concept text.
- `features/ci-combinations.txt`: the line `terms-variables,equation-drill` keeps its place and gets a comment
  naming it and its purpose (task 3, below).

## Data adaptations that remain

- **A question's `teachImg` is left out.** All 10 are calculations (8 carry one). Core `browser_test.js` stops with
  a TypeError on a calculation that carries a `teachImg`: core fault C7 in kit PR #30.
  - Reproduction: `repro-C7-teachImg-calculations/`. It uses `oncourse-teachimg.diff`: `teachImg` kept and each
    image copied from the course's `images.json`, read-only.
  - `browser_test.js.log`, exit 1: "the test stopped: page.evaluate: TypeError: Cannot read properties of undefined
    (reading 'map')".
  - The kit's page also never draws a calculation's `teachImg`.
  - Before this rework, the reason given was "crops not in the kit". Now it is C7.
- **tvc-m2-n-d3a and tvc-m2-n-vp1 are left out of the CI course.** They cite only practice-sheet solutions, and core
  `test.js` refuses a question that cites no lecture deck: C3 in kit PR #30.
  - Reproduction: `repro-C3-practice-sheet-questions/` (`oncourse-all-questions.diff`).
  - `test.js.log`, exit 1: "FAIL 2 questions cite no deck in the manifest: tvc-m2-n-d3a, tvc-m2-n-vp1".
  - The test's own copies keep all 10.
- **`setup` lines** are written only when the course has the equations they name (CI data rule 4).
- **Ids are prefixed** (`tvt-` in the test, `tvc-` in the CI course).
- **The data is cut to what the test uses:** the module's own data, plus a term the course's TERMS already has by
  name, which is not written twice. Unchanged from before.

## The combination line (task 3)

`terms-variables,equation-drill` stays. It directly checks an interaction this feature adds: with equation-drill on,
terms-variables puts its variables quiz on the Equations tab (`terms-variables.js`, `X.rendered` for view `eq`).
- **terms-variables' test:** "the Equations tab offers the variables quiz" and "its Start drills the variables quiz"
  run only when equation-drill is on. With it off, the test prints `skip the Equations tab offers the variables quiz`.
  - `logs/05-module-test-*.log` and `logs/06-ci_course.log`: 58 checks, 2 skipped.
  - In the combination course both run and pass: `logs/08-combination-module-test.log` lines 52-53, 60 checks,
    1 skipped (glossary-tap).
- **equation-drill's test:** it has no check that depends on terms-variables (0 references to terms-variables or its
  quiz in `features/equation-drill/current/test.js`). The combination still runs it (PASS, 30 checks), with
  terms-variables' data in the course.

## Commands and exit codes (on `3c88314`; `logs/exit-codes.txt`)

| # | Command | Exit | Result | Log |
|---|---|---|---|---|
| 1 | `/tmp/port-tools/mkcourse.sh <kit> own terms-variables` | 0 | | `logs/01-mkcourse.log` |
| 2 | `node features/terms-variables/ci/oncourse.js <kit> own/src` | 0 | 8 of 10 questions, the professor's name; left out and printed: 2 questions (C3), 8 `setup` lines (rule 4), 8 `teachImg` (C7) | `logs/02-oncourse.log` |
| 3 | commit, `python3 build.py` | 0, 0 | | `logs/03*.log`, `logs/04-build.log` |
| 4-6 | `node features/terms-variables/test.js`, 3 runs | 0, 0, 0 | module test: PASS 58, 0 FAIL, 2 SKIPPED (glossary-tap, equation-drill not on), each run | `logs/05-module-test-{1,2,3}.log` |
| 7 | `core/ci_course.sh module:terms-variables` | 0 | module test: PASS (58, 2 skipped). Core checks: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs, documented exclusion), 1 REPORT (`explain_check.js`: 5 of 15); SKIPPED inside passing checks: `browser_test.js` 5, `nullexam_test.js` 1 | `logs/06-ci_course.log` |
| 8 | `core/ci_course.sh modules:terms-variables,equation-drill` (formulas-in-text switched on as equation-drill's need) | 0 | module tests: terms-variables PASS (60, 1 skipped), equation-drill PASS (30), formulas-in-text PASS (12). Core checks: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT (`explain_check.js`: 5 of 15); SKIPPED inside passing checks: `browser_test.js` 5, `nullexam_test.js` 1 | `logs/07-ci_course-combination.log` |
| 9 | `node features/terms-variables/test.js` in that combination course | 0 | PASS 60 (1 skipped); the two interaction checks `ok` | `logs/08-combination-module-test.log` |

`node .github/ci_plan.js pull_request 4e0fae4` on `3c88314` selects `module:terms-variables` and
`modules:terms-variables,equation-drill`, the two runs above.

## GitHub

Kit checks run 41583573300 on `3c88314` (`github-run.tsv`): all five jobs (Modules to check; Chromium · template;
Chromium · template-unset; Chromium · medicinal-chemistry; WebKit · template) ended "failure" without starting, and
the module job was skipped. Annotation: "The job was not started because recent account payments have failed or your
spending limit needs to be increased. Please check the 'Billing & plans' section in your settings". Recorded as
**NOT RUN** (billing).
