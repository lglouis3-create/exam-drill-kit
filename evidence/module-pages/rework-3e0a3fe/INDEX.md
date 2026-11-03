# Rework of module-pages (kit PR #24) to Louis's porter policy of 2026-11-03

Every result here is **agent-run** (a rework agent of the "Kit feature porter" session, 2026-11-03).
Port branch: `port/module-pages`, start `5937e01` (already merged with main `4e0fae4`), final `3e0a3fe`.
Core and template are main's (`inputs.txt`: core tree `f631c5e` on both; `git diff 4e0fae4 3e0a3fe -- core template` is empty).

## What changed in `3e0a3fe`

- `PK` in `features/module-pages/current/test.js` is Basic-Pharmacokinetics' Module 2 at `ac2eb73` with no field
  changed or left out (`scripts/extract_fix.js`, `extract_fix.log`, `pk.json`; `compare_final.log`: 0 differences).
  Before, it differed in 160 fields (`compare_old.log`):
  - `prof` on 22 questions, and `prof` left out of the 2 topics;
  - "Dr. Mosley" written "The professor" or "the professor" in 12 explanations and worked steps;
  - fields left out: `lecture` and `exam` (22 each), `quote` (18), `setup`, `asks`, `givens` and `check` (12 each),
    `teachImg` (10) and `audit` (3);
  - m2-n-cl2's `dupOf` removed, because its target was not in the fixture.
- m2-n-cl1, the question m2-n-cl2's `dupOf` names, is added (23 questions). The test's counts follow it: 13
  calculations instead of 12.
- `PK_LECTURES` `prof` is "Mosley".
- The 5 slide images of the concept questions (`slide_2IVBolusAdministra_p3`, `_p6`, `_p8`, `_p14`, `_p17`) are copied
  byte for byte into `current/fixture-images/` (`extract_fix.log`: each round-trips). The test's scratch copies and
  `ci/oncourse.js` add them to `images.json`, and add the professor's name to `COURSE.professors` when it is missing.
- When the data is written into a course, two things are left out, and only there:
  - a `setup` or `asks` that names data the course lacks (CI data rule 4);
  - the `teachImg` of the calculation m2-n-koverall: core fault C7 (see the concept-statuses rework,
    `evidence/concept-statuses/rework-8e2d634/repro-C7-teachImg-numeric/`, same core tree).
- `ci/oncourse.js`: topic ids now carry the prefix `mpc-` (CI data rule 2, together with each objective's subtopics
  and each kind's `match`).
- A new check: the 23 questions keep the course's `prof`, stems, options with their whys and worked steps, and the
  concept questions keep their slide images.
- `HOMEWORK2` (used only when worksheets-ink is in the course; it is not in this tree) is now documented as a cut of
  Basic-Pharmacokinetics' `src/sources.js` entry hw-2. Its `missing` note is the test's own text.

## The two second wordings in topic bolus1 (task 2)

m2-mod-2 (`dupOf` m2-mod-1) and m2-vd-2 (`dupOf` m2-vd-1) were tried back in the CI course. Core `test.js` then
fails: `repro-C1-second-wordings/`.
- Data: `data/` holds the course's data files.
- Command: `COMMAND.txt`.
- Log: `core-test.log`, exit 1, "FAIL missed concept never returned".

Checked again on main `4e0fae4`: the branch's core tree is main's (`f631c5e`).

`section7-diag.log` shows why:
- The check takes the first concept with two wordings (onecpt-assumptions, topic mpc-bolus1: 6 questions, 4 concepts).
- After the miss, the other 3 concepts are each answered once.
- Then the scheduler has nothing to offer: the missed concept needs `GAP = 4` other questions (`core/shell.html` line 887).

**The fault is in the core's test** (`test.js` section 7 picks a topic too small for its own rule). It is not in the
course data and not in the module. This is C1 in kit PR #30, as listed there. The course does not pass with the two
questions, so `ci/oncourse.js` leaves them out (`WITH_SECOND = false`, with the reason in its header). The test's
own scratch copies keep them. The PR stays a draft with this coverage listed as blocked.

## The 13 questions that cite no lecture deck

All 23 questions were tried in the CI course: `repro-C3-all-questions/` (`COMMAND.txt`, `oncourse-all-questions.diff`,
`core-test.log`, exit 1). The questions are m2-mc-2 (lecture transcript), m2-n-k2, m2-n-k1, m2-n-c0a, m2-n-c15,
m2-n-cl1, m2-n-cl2, m2-n-vd1 and m2-n-tb1 (practice-sheet solutions), and hw2-2a to hw2-2d (homework sheet).
- **C3 (kit PR #30), core `test.js`:** "13 questions cite no deck in the manifest". Core fault in the test's rule; the
  data cites real course documents that are not lectures.
- **New, not in PR #30:** core `test.js` line 64 requires 2 worked steps on a calculation. hw2-2a, hw2-2b and hw2-2d
  have 1. Basic-Pharmacokinetics' own `src/test.js` line 167 requires 1. This is a core-test rule stricter than the
  course, proposed as a separate core entry.

## Commands and exit codes (on `3e0a3fe`; `logs/exit-codes.txt`)

| # | Command | Exit | Result | Log |
|---|---|---|---|---|
| 1 | `/tmp/port-tools/mkcourse.sh <kit> own module-pages` | 0 | | `logs/01-mkcourse.log` |
| 2 | `node features/module-pages/ci/oncourse.js <kit> own/src` | 0 | 8 questions (1 calculation), 2 topics, 5 objectives, 1 kind, 2 lectures, 5 images, the professor's name; left out and printed: 13 citing no deck, 2 second wordings, 1 `setup`, 1 `asks`, 1 `teachImg` | `logs/02-oncourse.log` |
| 3 | commit, `python3 build.py` | 0, 0 | | `logs/03*.log`, `logs/04-build.log` |
| 4-6 | `node features/module-pages/test.js`, 3 runs | 0, 0, 0 | module test: PASS 31, 0 FAIL, 3 SKIPPED (In parts: chained-problem-sets not in the course; with worksheets-ink on; with concept-statuses on: not in this tree), each run | `logs/05-module-test-{1,2,3}.log` |
| 7 | `core/ci_course.sh module:module-pages` | 0 | module test: PASS (31 checks, 3 skipped). Core checks: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs, documented exclusion), 1 REPORT (`explain_check.js`: 7 of 15 questions); SKIPPED inside passing checks: `draw_test.js` 1, `browser_test.js` 4, `nullexam_test.js` 1; `home_test.js` PASS | `logs/06-ci_course.log` |

Combinations: `node .github/ci_plan.js pull_request 4e0fae4` on `3e0a3fe` selects `module:module-pages` only; no
line of `features/ci-combinations.txt` runs here (each names a module not in this tree).

## GitHub

Kit checks run 41582677396 on `3e0a3fe` (`github-run.tsv`): all five jobs (Modules to check; Chromium · template; Chromium · template-unset; Chromium · medicinal-chemistry; WebKit · template) ended "failure" without starting, and the module job was skipped. Annotation: "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings". Recorded as **NOT RUN** (billing).
