# Rework of concept-statuses (kit PR #19) to Louis's porter policy of 2026-11-03

Every result here is **agent-run** (a rework agent of the "Kit feature porter" session, 2026-11-03).
Port branch: `port/concept-statuses`, start `5c8a549` (already merged with main `4e0fae4`), final `8e2d634`.
Core and template are main's (`inputs.txt`: core tree `f631c5e` on both; `git diff 4e0fae4 8e2d634 -- core template` is empty).

## What changed in `8e2d634`

- `FIX` in `features/concept-statuses/current/test.js` is Basic-Pharmacokinetics' data at `ac2eb73`, field for field
  (`scripts/extract_fix.js`, `extract_fix.log`, `fix.json`; `compare_final.log`: 0 differences).
  Before, it differed in 14 fields (`compare_old.log`): `prof` "Professor" on 7 questions, the topic and the lecture,
  and `teachImg` left out on 5 questions. No text field had been changed.
- inf-c12 (select all), inf-c13 and inf-c16 are added (10 questions now). The first selection
  (`evidence/concept-statuses/scripts/survey_all.js`) took only questions whose text names no professor and uses no
  pronoun for one; these three of the same deck's concept questions were passed over for that reason only
  (`infusion-topic-survey.log` lists the topic's questions with the names and pronouns found).
- The slide image of inf-c4 and inf-c5 (`slide_3IntravenousInfusi_p4`, webp) is copied byte for byte from the
  course's `src/images.json` into `current/fixture-images/` (`extract_fix.log`: round-trips) and written into the
  course's `images.json` by the test and by `ci/oncourse.js`. The professor's name is added to
  `COURSE.professors` when the course lacks it (core `test.js` wants every `prof` in the manifest).
- A new check: the questions keep the course's `prof` and `teachImg`, and the slide image is in the page.

## The 5 `teachImg` fields (task 1)

| Question | Kind | Image | Needed to answer? | In the branch |
|---|---|---|---|---|
| inf-c4 | concept | p4, slide "Drug Concentration at Steady-State" (Css = R/Cl = R/kVD, the professor's notes "3 to 5 half-lives") | no (shown after the answer, in the concept block); it carries the formula and the note the explanation teaches | restored |
| inf-c5 | concept | p4 (same) | no; same | restored |
| inf-n1 | calculation | p7, slide "Example 1" with the worked answer 14.43 mg/L | no; the stem gives every value | left out: core fault C7 |
| inf-n2 | calculation | p8, slide "Example 2" with the worked answer 69.3 mg/hr | no; same | left out: core fault C7 |
| inf-n4 | calculation | p11, slide "Example 4" with the worked answer 15.35 hr | no; same | left out: core fault C7 |

Basic-Pharmacokinetics' `slides.py` attaches each slide as `teachImg`, shown only after an answer, never beside
the stem, "because a slide frequently carries the answer". So no image is needed to answer; each is the slide the
explanation is about. The two concept questions' image is restored.

The three calculations' images are left out because core `browser_test.js` stops when a calculation carries a
`teachImg` (fault **C7** in kit PR #30, `review/core-proposals-from-ports.md`). Reproduction:
`repro-C7-teachImg-numeric/` (the course data `data/q90_cst_fixture.js`, `data/course.js`, `data/images.json`
with the 4 images; command `core/ci_course.sh module:concept-statuses` with all five `teachImg` kept, log
`ci_course-module-concept-statuses.log`: `FAIL browser_test.js the test stopped: page.evaluate: TypeError: Cannot
read properties of undefined (reading 'map')`; the same from `node browser_test.js` in that course,
`browser_test.log`, exit 1). Fault: in the core test (`browser_test.js` line 157 calls `q.options.map` on every
question with a `teachImg`). Also found (not in PR #30, proposed as a display entry): the core's page never draws a
calculation's `teachImg` (`core/views.js`: the calculation reveal at line 902 has no image; Basic-Pharmacokinetics
`src/views.js` 1722-1724 draws it for every kind), so a student would not see these three slides in the kit even
with C7 fixed. `FIX` keeps the three fields; only the writer (`WRITE`) leaves them out, so the data follows the
core once both are fixed.

Why the test data stays representative: the module reads answers, concepts, options and their whys, kinds of
miss and the scheduler's records; it never reads `teachImg` or an image. The 10 questions still hold a select-all
item, single-answer items with a why on every option, two wordings of one concept and three calculations, and
the professor's name in their text.

## Commands and exit codes (final, on `8e2d634`; `logs/exit-codes.txt`)

| # | Command | Exit | Result | Log |
|---|---|---|---|---|
| 1 | `/tmp/port-tools/mkcourse.sh <kit> own concept-statuses` | 0 | template course with the module copied in | `logs/01-mkcourse.log` |
| 2 | `node features/concept-statuses/ci/oncourse.js <kit> own/src` | 0 | 10 questions, 1 topic, lecture cst-L04, the professor's name, 1 slide image; left out and printed: 3 `teachImg` (C7), 3 `setup` and 3 `asks` (rule 4: the template has no EQUATIONS or ASKS) | `logs/02-oncourse.log` |
| 3 | commit, `python3 build.py` | 0, 0 | | `logs/03*.log`, `logs/04-build.log` |
| 4-6 | `node features/concept-statuses/test.js` on that course, 3 runs | 0, 0, 0 | module test: PASS 90, PASS 90, PASS 90; 0 FAIL, 0 SKIPPED | `logs/05-module-test-{1,2,3}.log` |
| 7 | `core/ci_course.sh module:concept-statuses` | 0 | module test: PASS (90 checks). Core checks: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs, a documented exclusion), 1 REPORT (`explain_check.js`: 6 of 17 questions); SKIPPED inside passing checks: `browser_test.js` 4, `nullexam_test.js` 1; `home_test.js` PASS (36 checks) | `logs/06-ci_course.log` |

Combinations: `node .github/ci_plan.js pull_request 4e0fae4` on `8e2d634` selects `module:concept-statuses` only;
no line of `features/ci-combinations.txt` runs (every line names a module not in this tree). NOT RUN: none needed.

`logs-run1-uncommitted/` is the same sequence on the working tree just before the commit (the tree then differed
from `8e2d634` only in two comment lines of `test.js`): the same results (exit 0 everywhere; module test 90, 90, 90).

The first try, with all five `teachImg` kept, is the C7 reproduction above.

## GitHub, Kit checks run 41581740260 on `8e2d634` (`github-run-41581740260.tsv`)

All five jobs (Modules to check; Chromium · template; Chromium · template-unset; Chromium · medicinal-chemistry;
WebKit · template) ended "failure" without starting, and the module job was skipped. Annotation on each: "The
job was not started because recent account payments have failed or your spending limit needs to be increased.
Please check the 'Billing & plans' section in your settings". Recorded as **NOT RUN** (billing), not as failures
of the code.

## Surname check

`surname_check.log`: case-insensitive, the 10 questions hold "Mosley" 10 times in the source and 10 times in
`FIX`; "Gottlieb" 0 and 0; "the professor" 0 and 0. Nothing is left changed.
