# Evidence: plan-the-problem (port queue item 1, kit PR #11) — agent-run

Every result here is **agent-run** (the hardening session, 2026-11-02 evening). The coordinator
adds its own re-runs, labelled coordinator-verified, in `evidence/plan-the-problem/coordinator/`.

## Inputs

| What | Value |
|---|---|
| Source read | lglouis3-create/Basic-Pharmacokinetics- `ac2eb73` (`src/`), read-only clone |
| Port branch at start | `port/plan-the-problem` `1226635` |
| Port branch, final tested commit | **`4c09914`** (`4c09914263e30756ea24f4550097fc1517a92f1d`) |
| Commits added | `bee69ed` merge of origin/main `366caf6` (kit PR #27); `bbf82a8` the hardening (tests, ci script, fixes); `4c09914` merge of origin/main `6432c36` (kit PR #28) |
| origin/main | `6432c36` |
| core tree / template tree at `4c09914` | `a2dbf03` / `cbac5bd` (the same as main `6432c36`: `git diff origin/main -- core template` is empty) |
| Medicinal-chemistry | full clone (`git clone`, 32 commits), `main` `f1f5ee5` |
| Baseline | not cited: the core tree `a2dbf03` is not the one `evidence/baseline` `main-98e7b5b/` names (`c9fde5b`), so the no-module template course and Medicinal-chemistry were run here |

## Commands (logs/COMMANDS.tsv has each command, folder and time)

| Label | Command | Exit | Log | Result |
|---|---|---|---|---|
| ci-module-plan | `core/ci_course.sh module:plan-the-problem chromium` (main's script: formulas-in-text, equation-drill and plan-the-problem switched on by their own ci/oncourse.js) | 0 | logs/ci-module-plan.log, logs/ci-module-plan-checks/ | `run_checks.sh`: 28 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`); module test 54 PASS; home_test.js 36 PASS |
| module-test-run1..3 | `node features/plan-the-problem/test.js` on that course, three times | 0, 0, 0 | logs/module-test-run{1,2,3}.log | 54 checks PASS each time |
| module-absent-build / -test | the same course with `delete COURSE.features['plan-the-problem']`, built, then the module test | 0 / 1 | logs/module-absent-*.log | the test FAILs (1 of 1: "the page carries plan-the-problem, working"), not NOT RUN |
| ci-script-test-scripts | scripts/ci_script_test.sh: a fresh `/tmp/port-tools/mkcourse.sh` course; formulas-in-text's and equation-drill's ci/oncourse.js, then this module's; the script a second time; build; module test | 0 | logs/ci-script-test-scripts.log | first run exit 0; second run exit 1 (it runs once per course); build 0; module test 54 PASS |
| ci-script-test-plain | the same with the two needs switched on by one course.js line and no data (the script then declares EQUATIONS itself) | 0 | logs/ci-script-test-plain.log | first run 0; second run 1; build 0; module test 54 PASS |
| ci-script-needs-off | the script on a course where formulas-in-text and equation-drill are off | 1 | logs/ci-script-needs-off.log | stops, naming both and their scripts |
| ci-template | `core/ci_course.sh template chromium` (no module on) | 0 | logs/ci-template.log, logs/ci-template-checks/ | 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT (`explain_check.js`) |
| mc-run-checks | Medicinal-chemistry full clone `f1f5ee5`, every `core/` file of `4c09914` except README.md copied into `src/`, `run_checks.sh` (Chromium) | 0 | logs/mc-run-checks.log, logs/mc-run-checks-checks/ | 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures; `cite_check.py`: no lecture PDFs), 1 REPORT; **home_test.js 36 checks PASS**; state_check.js PASS |
| mc-run-checks-own-core-discarded | the same before the core was copied (the copy command was refused by the sandbox, so this ran Medicinal-chemistry's own core) | 0 | logs/mc-run-checks-own-core-discarded.log | not a result for this branch; kept because logs are not deleted |
| verify-fixture-vs-pk | scripts/verify_fixture.js: the test fixture against Basic-Pharmacokinetics `ac2eb73` loaded as its build.py orders it | 1 (differences listed, as expected) | logs/verify-fixture-vs-pk.log | the only values that differ: `prof` "Professor" (10 questions) and "the professor" for "Dr. Mosley" in 3 worked steps; 62 PK fields are not carried by the fixture (exam, lecture, source, teach, teachImg, quote, dupOf, audit); the 9 equations the questions name are identical to PK's |
| mutations | scripts/mutations.py (23 mutations) | — | mutations.tsv, mutations/M*.log, mutations-run.log | every mutation caught (table below) |
| screenshots | scripts/shot.js | 0 | screenshots/ | the Equations card; a plan written out for `plc-m4-n-clt` |

NOT RUN: WebKit / Safari (Chromium only in this container); the kit's GitHub "Kit checks" jobs on `4c09914` (not read by this session).

## The module's own course (HARDEN 9a, 9a2, 9b)

`features/plan-the-problem/ci/oncourse.js` writes it from the module test's fixture (`const PK` in
`test.js`) and equation-drill's fixture (`const FIX`), both Basic-Pharmacokinetics `ac2eb73`:
10 calculation questions with `setup`, `asks`, `givens`, `check` and worked steps; the 9 equations
they name; their 6 topics (the course's whole entries); 6 skills and 6 lectures (the course's
entries); ASKS (55 keys); PLAN (12 models, the topic map, the route words, 12 units, the 6-step
routine). `scripts/regen_fixture.js` rewrote the fixture line from the course's files.

Changes made to the data: `prof` set to "Professor" (questions, topics, lectures), and, so that the
fixture carries no personal name, "Dr. Mosley" written "the professor" in three worked-step texts
(m1-ord-n03, m2-n-cl2, m4-n-clt). The second change goes beyond "prof only": it is reported for the
coordinator's decision. Scaffolding (not data): ids prefixed `plc-`; lecture ids L91-L98; two
lectures (L97, L98) for the practice-solutions files two questions cite, with their own lecture's
label, exam and module; PLAN.same pairs a line with the same line equation-drill's course writes.

Findings in the real data (reported, not changed): the routine's step 6 says "the decimal places she
asked for"; several worked steps say "she" and "her" (course data, kept as written). No stem tripped
`style_check.js` (17 stems clean).

## Behaviour map

See `behaviour-map.md` (31 behaviours, plus the build checks).

## Mutation table (agent-run, on the module's own course; never committed)

Mutations were run on a scratch copy of the module's own course built from the working tree that
became `bbf82a8` (its module and test identical except the header comment of test.js).

| Mutation | Behaviour broken | Check that FAILed | Exit |
|---|---|---|---|
| M1 | the right line is among the four | every set-up stem is offered four distinct lines, the right one among them | 1 |
| M2 | no wrong choice is a line used on the way or the same relation | no wrong choice is a line used on the way or the same relation | 1 |
| M3 | wrong choices from the stem's own module first | the wrong choices come from the stem's own module first | 1 |
| M4 | a quoted ".." does not split a sentence | the sentence split gives Basic-Pharmacokinetics' sentences (control text `a.. b. c`) | 1 |
| M5 | the tally is saved with the progress | the tally is kept through a reload; a tally of 160 picks is kept whole | 1 |
| M6 | a wrong pick is counted wrong | the missed line is tallied per equation | 1 |
| M7 | PLAN.also: a route named in the stem is also accepted | the models a stem accepts are Basic-Pharmacokinetics' own (100 stems and variants) | 1 |
| M8 | a plan counts only with every step right | a plan with a wrong model is not counted as right in every step | 1 |
| M9 | the sheet answer is judged | the sheet answer is judged; a plan right in every step is counted | 1 |
| M10 | a given whose role starts "not needed" is set aside | the three givens whose role says "not needed" are set aside (check added in this review: not caught in the first pass) | 1 |
| M11 | "the block" for an "Any route" model | a stem of an "Any route" model: the plan says the block | 1 |
| M12 | a line the professor said to know says so | says the professor said it is not on the sheet, and said to know it | 1 |
| M13 | the module's other asked symbols first | "What is asked?" offers six distinct symbols ... and its module's first | 1 |
| M14 | no unit twice | the same check (units distinct) | 1 |
| M15 | a saved tally of another shape starts afresh | a saved tally of another shape starts afresh, and the next pick is saved | 1 |
| M16 | the refusal names the question and the equation | a set-up line that is not in EQUATIONS, named with its question | 1 |
| M17 | the build refuses an unknown line used on the way | a line used on the way that is not in EQUATIONS, named with its question | 1 |
| M18 | `needs` names both modules | with formulas-in-text and equation-drill off, the build stops and names both | 1 |
| M19 | the card on the Equations tab | the Equations tab offers the set-up drill with a scope per module | 1 |
| M20 | the drill redrawn when the tab is opened again | opening the tab again while the drill runs shows the drill | 1 |
| M21 | the build refuses a given that is not [symbol, value, role] | a given that is not [symbol, value, role] stops the build | 1 |
| M22 | no "What is asked?" step without ASKS | the PLAN-without-ASKS check: the test stops with the page's TypeError (check added in this review: not caught in the first pass) | 1 |
| M23 | an ASKS with no keys is no ASKS | with PLAN and no ASKS: the plan starts at the dosing model | 1 |

First pass (before the added checks): `mutations-first-pass.tsv`: M10 and M22 not caught (exit 0).

## Persistence results (agent-run, automated in test.js; module test runs 1-3)

| Case | Result |
|---|---|
| 160 picks over 16 lines, then a reload 400 ms later | kept whole |
| A reload at once (under 150 ms) after a pick | the pick is lost: the core saves 150 ms after the last change (core behaviour, reported, not changed) |
| A reload 300 ms after a pick | kept |
| Export, then Import into a fresh profile | the export carries the tally (161 picks); the fresh profile had none; after Import it has the same tally |
| Profile switch | each profile keeps its own tally (the second profile's 20 extra picks stay there) |
| Storage denied (`setItem` throws) | the core's notice shows; the saved tally is not overwritten; the new picks hold for the visit; once storage works, the next save writes them and a reload loads all |
| Storage full (`QuotaExceededError`) | the notice shows; nothing saved is overwritten; after storage works again a reload loads the tally saved before; the 20 picks made while full are lost on that reload, as the notice says |
| A saved tally of another shape (an array) | starts afresh; the next pick is saved (fault fixed in this review) |

## Faults found in this review

1. Fixed: the plan said "the block of the sheet" for every model; Basic-Pharmacokinetics says "the block" for an "Any route" model (views.js 4974).
2. Fixed: a line not printed and marked `must` lost "said to know it" (views.js 4967).
3. Fixed: with an ASKS of no keys, the card promised "what is asked and its unit" and the build refused every `asks`; an ASKS with no keys is now read as no ASKS, by the module and by the build step.
4. Fixed: a saved tally of another shape lost each new pick on save.
5. Fixed (test data): the fixture carried the professor's name; topics lacked cite and prof.
6. Not a fault, kept: the build refuses a course whose set-up lines name an equation it does not have (the coordinator's integration finding F5); the message names the question and the equation.

Needs a core proposal: none new. Seen in the core: the progress is written 150 ms after the last change, so a reload inside that time loses the last pick.
