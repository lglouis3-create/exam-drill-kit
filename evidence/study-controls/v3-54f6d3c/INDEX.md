# Review evidence, pass 3: `study-controls` (port queue item 21), real course data and fix F2

Every result in this folder is **agent-run** (the hardening session, 2026-11-02 evening). The
earlier passes are in `../INDEX.md` (on `8622653`). The coordinator's re-runs go in
`../coordinator/`, labelled coordinator-verified.

## What was read and tested

| What | Value |
|---|---|
| Source repository and commit read | Intro-Pharmacology- `929cd62` (`exam1-drill/src/q_L01.js`, `course.js`, `app.js`), read-only clone `/tmp/ip-readonly` |
| Port branch, starting commit of this pass | `port/study-controls` at `d15ebd9` |
| Port branch, final tested commit | **`54f6d3c`** (`54f6d3cf2b845c2faec38ac293a4cfef245b5e36`); commits of this pass: `5fe1188`, `54f6d3c` |
| origin/main | `98e7b5b` |
| Core tree (`git rev-parse 54f6d3c:core`) | `c9fde5b23f43746ff8d392314f86e8ff313c1cda` |
| Template tree (`git rev-parse 54f6d3c:template`) | `cbac5bd425d480944293f8e1fb5d5d703e8baba1` |
| Partner modules (scratch courses only, never committed) | paper-picker `origin/port/paper-picker` `c1709f5`; worksheets-ink `origin/port/worksheets-ink` `b4b347e`; notes `origin/port/notes` `65085d6` |
| Finding fixed | F2 of the integration check (`evidence/integration` `1329222`): `test.js` lines 306, 399, 412 |

**Baseline reuse.** The core and template trees are exactly `c9fde5b` and `cbac5bd`, and
Medicinal-chemistry `main` is `f1f5ee5` (`git ls-remote`, this session), so the no-module template
course and Medicinal-chemistry are cited from `evidence/baseline`, folder `main-98e7b5b/` (commit
`22b4290`), and were not rerun here: template course 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`),
1 REPORT; Medicinal-chemistry from a full clone 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no
step-through figures; `cite_check.py`: no PDFs), 1 REPORT, with `home_test.js` 33 checks passed in
that run (its known intermittent fault did not show there). `git diff origin/main -- core template`
is empty on `54f6d3c`.

## Louis's rule 4: the module's own course is real course data

`ci/oncourse.js` reads `const FIX` and `const WRITE` from `test.js` and writes the course with them;
the test's scratch copies use the same `WRITE`, and use the course's own copy when it is there.

- `FIX` holds, verbatim from Intro-Pharmacology- `929cd62` (extracted by `bin/extract.js` into
  `fix.json`, turned into the block by `bin/mkfix.js`; `fix.json` holds the professor's name, so it
  is not kept here: `bin/extract.js` makes it again from the read-only clone; `fixblock.js` is the block): the topic `L01` "Day 1: drugs, receptors,
  potency" (`q_L01.js` line 1); the lecture `L01` (`course.js` `lectures`); the questions `L01-002`,
  `L01-004`, `L01-005`, `L01-006` (single-answer) and `L01-003`, `L01-007` (select-all), every
  field as in the source (`q_L01.js` lines 14-93); and the strict note, the professor's answer of
  10/21 (`app.js` line 678): `10/21 (asked whether you can go back to a question): "No, there will
  not, yeah, no backwards nav, OK, yes."`
- **The one change to the data:** `prof` (the professor's name in the source) is the template's
  "Professor". A `git grep` for that name in `features/study-controls` on `54f6d3c` finds nothing.
- How `WRITE` places it in a course (not changes of content): each question on one line opening
  `{id:'L01-002', skill:'apply', prof:'Professor', ...`; the source's `lecture` field (the source's
  lecture id) left out, because the kit finds a question's lecture from the deck its `cite` names;
  the topic pushed after the course's topics with the 2 subtopics its 6 questions are in (`intro`,
  `nds`; the other 6 subtopics have none of them); the lecture added under id `L91`, because the
  template has its own `L01`.
- What `ci/oncourse.js` wrote on the final course: `logs/final-own-q90_sc_fixture.js` and
  `logs/final-own-course-line.txt`.
- 9a2: one question per line, as `browser_test.js` counts them (PASS, 94 checks); a topic of its
  own after the course's (`storage_test.js` PASS); the lecture as a JS literal (`state_check.js`
  PASS); `style_check.js`: "13 stems and 13 explanations clean" (no real stem trips STEM_RE).
  `explain_check.js` reports "thin option why" on all 6 real questions and "no diagnosis of the
  error" on `L01-004` option E; that is a report, and the content is not changed.
- The course is made as `core/ci_course.sh module:<name>` does it in `ccc5172` (this branch's
  `ci_course.sh`, from main `98e7b5b`, has no `module:` course: `logs/ci-course-module-1.log`,
  exit 2, "unknown course"): `bin/modcourse.sh` = `mkcourse.sh`, then each module's
  `ci/oncourse.js`, all in one commit, then `python3 build.py`.

## Fix F2, and what else changed in the test

- Line 306: the clock is read as `^\d+:\d\d$` (the core pads minutes to 2 digits and no more:
  `core/views.js` line 1605), so a 120-minute paper (119:59) passes. The check name now shows the
  clock it read.
- Lines 399 and 412: the paper-picker exam id is compared as text (`String(...)`), so numbered
  exam ids (Basic-Pharmacokinetics: 1, 2, 3) pass.
- Also fixed, the same id fault on the line that picks an earlier exam (`id !== EXAM.id`, now
  `String(EXAM.id)`): on numbered ids it kept the current exam in the list and worked only because
  the first chip was an earlier exam.
- The candidate patch `/tmp/port-integration/fixes/study-controls.patch` was reviewed and applied
  as it stands (`git apply`), plus the line above.
- Two test-order fixes, needed because the course's real questions are now in the exam's pool
  (their lecture is in `COURSE.lectures`, exam 1): the flags set in the quiz checks are removed
  before the paper checks (else the bar listed them too: `logs/own-test-dev1.log`, "listed on the
  question bar at once" FAIL `["4"]`); two flags are set before the Clear flags check (else no flag
  was left to clear: `logs/own-test-dev2.log`, crash waiting for `#scClearFlag`).
- The copy with 300 more questions draws its papers from the course's other topics, so the 300
  copies do not crowd out the course's calculation; its calculation check tries 40 papers, not 8
  (commit `54f6d3c`; with 8 it was skipped in one run on the 3-exam course, on `5fe1188`; that run's
  logs were overwritten by the final run on `54f6d3c`, so only the console line of it is kept in
  this INDEX: "PASS: features/study-controls/test.js: 60 checks passed (1 skipped: a paper with a
  calculation stays one at a time)").
- No change to the module (`study-controls.js`, `.css`, `module.json`), `core/` or `template/`.

## Results (agent-run, on `54f6d3c`)

| Check | Result | Log |
|---|---|---|
| The module's own course: `mkcourse.sh`, `ci/oncourse.js`, build | exit 0 | `logs/final-own-make.log` |
| `ci/oncourse.js` a second time on that course | exit 1, "already switches study-controls on" (by design) | `logs/final-own-oncourse-again.log` |
| Module test on that course, run 1 / 2 / 3 | PASS 59 / 59 / 59 (1 skipped each: paper-picker is not on) | `logs/final-own-test-{1,2,3}.log` |
| `run_checks.sh` on that course | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`: 11 of 13 questions) | `logs/final-own-run-checks.log` |
| Module test on a page built without the module | FAIL 1 of 1 ("no feature modules in the page"), as it must | `logs/final-absent-test.log` |
| 1-exam course, paper-picker absent | PASS 59 (1 skipped: paper-picker is not on) | `logs/final-test-one-exam-pp-absent.log` |
| 1-exam course, paper-picker present | PASS 59 (1 skipped: paper-picker offers no exam other than the current one) | `logs/final-test-one-exam-pp-present.log` |
| 3-exam course (Basic-Pharmacokinetics' 3 exams, ids 1, 2, 3, 120 minutes), paper-picker absent | PASS 59 (1 skipped: paper-picker is not on) | `logs/final-test-three-exam-pp-absent.log` |
| 3-exam course, paper-picker present | PASS 61, none skipped; the clock read 119:59, then 119:57 | `logs/final-test-three-exam-pp-present.log` |
| F2 before: the test at `d15ebd9` on a 3-exam course with paper-picker (kit at `d15ebd9`) | FAIL 3 of 60: the clock check (119:59), the two earlier-exam checks (exam id 1) | `logs/final-f2-before-d15ebd9.log` |
| F2 after: the committed test on the same course | PASS 61 | `logs/final-f2-after.log` |
| Module test with worksheets-ink and notes on (papers with calculations) | PASS 59 (1 skipped: paper-picker is not on) | `logs/final-test-keys.log` |
| Keyboard checks with worksheets-ink and notes (`bin/keys_test.js`) | PASS 15 of 15: Scratch paper over a quiz calculation and over a paper's calculation, pen down and pen up; the Worksheets tab with the pen down; typing in a note; the confirm boxes of Clear flags, Delete note and Clear page; the Import file picker | `logs/final-keys-partners.log`, `shots/` |
| Mutation checks (20) against the new test | see below | `mutations.md`, `logs/mut3-*.log` |
| No-module template course; Medicinal-chemistry | cited from `evidence/baseline` `main-98e7b5b/` (trees match) | — |
| WebKit (Safari) | NOT RUN: this container has Chromium only | — |
| Real operating-system dialogs (file picker, confirm) | NOT RUN as real dialogs: Playwright intercepts both | — |

`bin/keys_test.js` is the coordinator's `/tmp/port-integration/keys_test.js` with one change: 300
tries, not 25, to draw a paper with a calculation. On the keys course `exams[].typed` is set in
`course.js` (`bin/typed.js`): set only while the page runs, the draw put no calculation on any of
300 papers (`logs/dev-keys-partners.log`, skipped), so the paper draw takes `typed` from the built
page.

Every command and its exit code: `logs/final-own-exits.tsv` (`bin/final.sh`: the module's own
course, the 3 test runs, `run_checks.sh`, the module-absent run), `logs/final-exits.tsv`
(`bin/matrix.sh final`: the four exam / paper-picker courses, the keys course, F2 before and after),
`logs/final-mutations.log` (`bin/mutations.py`, exit 0). `bin/final.sh` was run twice on `54f6d3c`
with the same results: in the first run its exit file had the same name as the matrix's and was
overwritten, so it was run again with its own file; the logs are of the second run. Development runs are kept as
`logs/dev-*` and `logs/own-*-dev*`.

## Behaviour map

Unchanged from `../behaviour-map.md` (30 rows, source `app.js` at `929cd62`): this pass changed
the test and its course data, not the module.

## Mutation checks (pass 3, on `54f6d3c`)

`bin/mutations.py` is `../mutations.py` with its output moved to this folder: the same 20
mutations, each an exact string replacement that must occur once, applied to a copy of the module
in the module's own course (`bin/modcourse.sh ... study-controls`, data from `ci/oncourse.js`), the
course built, the module test run, the file restored (checked: identical to the branch afterwards).
**19 of 20 are caught**; M10 is not, as in the earlier passes: it is equivalent, because a strict
paper also has no Back button, which is all the left arrow presses (M11 removes both and is caught).
Full table: `mutations.md`; logs `logs/mut3-M*.log`.
