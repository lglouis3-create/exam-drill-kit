# Evidence: concept-statuses (port queue item 4), hardening of 2026-11-02 evening

Every result here is **agent-run** (the porter's hardening session). The coordinator adds its own
re-runs, labelled coordinator-verified, in `evidence/concept-statuses/coordinator/`.

## Inputs

| What | Value |
|---|---|
| Source read | Basic-Pharmacokinetics `ac2eb73` (read-only clone `/tmp/pk-readonly`), `src/views.js` 2506-2725, `src/shell.html` 636-649, data from `src/q3_module3.js`, `src/q13_quizzes.js`, `src/q1_module1.js`, `src/course.js` |
| Port branch at the start | `46e3156` |
| Port branch, tested (final) | `6d89a5e` (`port/concept-statuses`) |
| Commits added | `a3edf77` merge of `origin/main` `366caf6` (kit PR #27); `d9b9988` test, ci script, fix; `c52c30c` merge of `origin/main` `6432c36` (kit PR #28); `6d89a5e` the fixture moved to the topic "infusion" |
| origin/main | `6432c36` |
| core tree / template tree | `a2dbf03` / `cbac5bd` (the same as `origin/main`; `git diff origin/main -- core template` is empty) |
| Baseline | not cited: `evidence/baseline` `main-98e7b5b/` is for core `c9fde5b`; the no-module template course and Medicinal-chemistry were run here |
| Node / browser | Node 22 (`/opt/node22`), Chromium (Playwright); WebKit not installed: NOT RUN |

`logs/final-inputs.txt` records the commit and tree hashes at the time of the final runs.

## Commands of the final runs (`scripts/all_final.sh`, `logs/COMMANDS.tsv`)

| # | Command | Exit | Result | Log |
|---|---|---|---|---|
| 1 | `scripts/make_on.sh` (mkcourse, `ci/oncourse.js`, one commit, `build.py`) | 0 on each of 4 steps | the module's own course: the topic and 7 questions, lecture L91, skill `infusion`, module on with `words` (61 entries) | `logs/final-make.log` |
| 2 | `ci/oncourse.js` a second time on that course | 1 | refuses, as designed: "course.js already switches concept-statuses on" | `logs/final-oncourse-second.log` |
| 3-5 | module test, 3 runs, on that course | 0, 0, 0 | PASS 89, PASS 89, PASS 89 | `logs/final-test-{1,2,3}.log` |
| 6 | `run_checks.sh` on that course | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`) | `logs/final-run_checks.log` |
| 7 | `core/ci_course.sh module:concept-statuses` (the kit's CI course) | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT | `logs/ci-module.log` |
| 8 | `core/ci_course.sh template` (no module) | 0 | 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT | `logs/ci-template.log` |
| 9 | `core/ci_course.sh medicinal-chemistry` (full history clone, `--filter=blob:none`) | 0 | 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures; `cite_check.py`), 1 REPORT; `home_test.js` PASS, 36 checks | `logs/ci-mc.log` |
| 10 | module test, module folder copied in but not switched on (`scripts/absent.sh`) | 1 | FAIL 1 of 1, as required | `logs/module-absent.log` |
| 11 | module test, template course without the fixture, formulas-in-text absent (`scripts/variant.sh`) | 0 | PASS 89 (the test writes the fixture into its scratch copy) | `logs/variant-template-nofix.log` |
| 12 | F5 (`scripts/f5.sh`): plan-the-problem (`1226635`) with equation-drill and formulas-in-text on; test at `46e3156` / committed test | 2 / 0 | NOT RUN ("setup names the equation auc-trap, which is not in EQUATIONS") / PASS 89, with formulas-in-text on | `logs/f5-plan-the-problem.log` |
| 13 | `scripts/mutations.py`, committed test | 0 | 23 of 23 mutations caught | `logs/mutations.log`, `mutations/` |
| 14 | `scripts/mutations.py`, test at `46e3156` | 0 | 8 of 23 not caught (M8, M10, M11, M12, M13, M16, M17, M20); M23 only by a crash | `logs/mutations-starttest.log`, `mutations-starttest/` |

Optional partner formulas-in-text: absent in runs 3-6 and 11 (PASS 89), present in run 12 (PASS 89).

Earlier runs of this session (on `c52c30c` and before, with the Module 1 fixture) are kept in
`logs/earlier/`. One of them, on `c52c30c`, is why the fixture changed: on the module's own course,
`run_checks.sh` gave 4 FAIL with the 4 Module 1 questions (`test.js`: `m1-auc-n02` dupOf `m1-auc-n01`
missing, and section 7 "missed concept never returned"; `browser_test.js`: `m1-ord-c07`'s stem says
"below"; and `output_test.js` and `checks_test.js`, which run `test.js`). Its logs are in
`logs/earlier/run_checks-c52c30c-module1-fixture/`. `logs/earlier/mutations-run1.log` is the
first mutation run (old fixture, core `d588c64`): 23 of 23 caught.

## The course data (`scripts/extract_fix.js`, `logs/extract_fix.log`, `fix.json`, `words.json`)

7 questions of Basic-Pharmacokinetics' topic "infusion": `inf-c4`, `inf-c5`, `inf-c11`, `inf-n1`,
`inf-n2`, `inf-n4` (`src/q3_module3.js`) and `cq2-4` (`src/q13_quizzes.js`); the topic `infusion`
(7 subtopics, `src/q1_module1.js` TOPICS); lecture L04 and the skills recall, apply and infusion
(`src/course.js`); `CONCEPT_WORDS` (`src/views.js` 2634, 61 entries). The one change to the data:
`prof` set to "Professor". Left out: `teachImg` on 5 questions (no slide images in the kit; core
`test.js` line 86). The script reports no personal name, no pronoun for the professor, no
figure-promise word, no "given as" and no `dupOf` outside the fixture. Scripts used to choose the
questions: `scripts/survey*.js`.

## Behaviour map

See `behaviour-map.md` (20 rows; the same table is in the pull request text).

## Mutation table (committed test, on the module's own course)

See `mutations/mutations.md` (each run's log beside it) and `mutations-starttest/mutations.md` for
the test at the start. Mutations are applied to scratch copies only; none was committed.

## Persistence (QUALITY C), from `logs/final-test-1.log`

History of 4100 answers saved, then one more answered on the page through the core's `record()`.

| Check | Result |
|---|---|
| 4100 saved answers load whole; the first concept (answered only in the first 100) has a status | ok |
| after one more answer the core keeps the last 4000; the statuses are those of exactly those 4000 | ok |
| a concept answered only before the last 4000 has no status any more | ok; reported as core behaviour (`DB.answers.splice`) |
| Export progress writes the 4000 answers (531 KB) | ok |
| Import progress into a fresh browser profile: same statuses, counts and Concepts section; same after a reload | ok |
| profile switch: a new profile shows only its own concept; switching back gives the first profile's statuses unchanged, and the second keeps its own | ok |
| reload 50 ms after an answer | reported: the answer is lost (the core writes 150 ms after the last change) |
| reload 400 ms after an answer: kept, and the statuses read it | ok |
| storage full (`QuotaExceededError`) and storage denied (`SecurityError`): the notice is shown; the saved progress is not overwritten; the section still draws from the answers of the visit; after storage works again the saved progress loads with the same statuses | ok (4 checks each) |

## Screenshot

`shots/concepts-390-light.png`: the Concepts section at 390 px. The dark-scheme screenshot was
byte-identical (the page does not change with the colour scheme without the theme module), so it is
not kept.
