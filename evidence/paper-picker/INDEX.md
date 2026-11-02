# Review evidence: `paper-picker` (port queue item 6, pull request text `pr-6`)

Every result here is **agent-run** (the hardening session, 2026-11-02 evening). The coordinator's
re-runs go in `coordinator/`, labelled coordinator-verified.

## Inputs

| What | Value |
|---|---|
| Source repository and commit read | lglouis3-create/Basic-Pharmacokinetics- `ac2eb73`, read-only copy `/tmp/pk-readonly` (`src/shell.html`, `src/views.js`, `src/course.js`, the question files `src/q*.js` in its `build.py` order, `src/images.json`) |
| Port branch, starting commit | `port/paper-picker` at `c1709f5` |
| **Final tested commit** | **`ed152dee6f408add9b24e6a0aedad1dc1f59bce8`** (`ed152de`) |
| origin/main | `98e7b5b9d42d1bc81b84ab6a06eadf554035ecba` |
| Core tree (`git rev-parse ed152de:core`) | `c9fde5b23f43746ff8d392314f86e8ff313c1cda` |
| Template tree (`git rev-parse ed152de:template`) | `cbac5bd425d480944293f8e1fb5d5d703e8baba1` |
| Partner module (scratch courses only, never committed) | study-controls from `origin/port/study-controls` `d15ebd9` (`git archive` into `/tmp/port-paper-picker/sc-kit`) |
| Integration finding fixed | F3 (`evidence/integration` `1329222`, `fixes/paper-picker.patch`): applied as given |

**Baseline reuse.** The core and template tree hashes are exactly `c9fde5b` and `cbac5bd`, so the
no-module template course (24 PASS, 0 FAIL, 1 NOT RUN `cite_check.py`, 1 REPORT `explain_check.js`)
and Medicinal-chemistry `f1f5ee5`, full clone (23 PASS, 0 FAIL, 2 NOT RUN: `stepper_test.js` no
step-through figures, `cite_check.py` no PDFs; 1 REPORT) are cited from branch `evidence/baseline`
commit `22b4290`, folder `main-98e7b5b/`, and were not rerun here. `git diff origin/main -- core template`
is empty on `ed152de`.

## Real course data (HARDEN 9a, 9a2)

`features/paper-picker/current/test_fixture.js` holds Basic-Pharmacokinetics' own data, made by
`scripts/mkfixture.js` and `scripts/writefixture.js` from the read-only copy (rerun:
`logs/mkfixture-repro.log`, same output byte for byte):

- `COURSE.exams`, all three, every field as the course has it (40 questions, 120 minutes, sata 4,
  pools and marks 16/16/8, 7/7/20/6, 15/15/5/5, blurbs and facts), `activeExam` 3, all 12 lectures;
- 118 questions, the 11 TOPICS entries and 9 `skills` entries they use, and the 9 `images.json`
  entries they show (4 SVG, no text naming anyone; 5 slide images, viewed: no personal name).
- **The one change to the data:** `prof` is set to the course's own first professor, the template's
  "Professor", in every question, topic and lecture. In the course the lecture ids carry the prefix
  `pp-` (the template already has a lecture `L01`); the questions' own `lecture` field is kept (the kit
  does not read it). No question text is changed.
- **Which questions** (the rule only chooses): no `type`; not `lowYield`; does not name the professor
  in its text; passes the core's question rules (style_check.js STEM_RE; a stem promising a figure
  shows one, browser_test.js; cite names a lecture deck, at least 3 options, a select-all at least 4
  with a distractor, test.js; no word undefined/null/NaN, browser_test.js and nullexam_test.js);
  its `dupOf` chain can be taken too. Every such question without an image is taken; a question with an
  image only while a pool of Exam 3 or Exam 2 has fewer families than its marks, smallest image first.
- Counts skipped (from `logs/mkfixture-repro.log`): typed 540 (numeric 534, match 6), names the professor 25,
  STEM_RE 10, cite names no lecture deck 23, fewer than 3 options 10, stem promises a figure and has none 6,
  lowYield 10, text holds "undefined" 1, dupOf chain leaves the set 12, image question not needed 74.
- **Data findings (reported, not reworded):** 10 choice stems trip `style_check.js` STEM_RE (inf-c8,
  m5-c25, m6-c01, m6b-c01, m6b-c02, fig-cpt-1, fig-cpt-2, nl-c10, fr-2, x3-a-p3h; "given as",
  "described as", "according to"); 3 texts hold the word "undefined" (m1-int-10, m5-c25, fig-elim-2),
  which `browser_test.js` and `nullexam_test.js` read as a rendering fault; 56 of the bank's 829 questions name the
  professor in their text. With these rules **Exam 1's Module 2 pool holds 0 questions** in the kit
  course, so a paper for Exam 1 cannot be drawn there: the module says so (checked).
- A first try with fewer rules (`logs/try1-run_checks.log`, per-check logs in `logs/try1-run_checks-per-check/`)
  failed 8 core checks on the data (2-option questions, cites naming no deck, STEM_RE, "undefined",
  a 38-question paper, and state_check because the data was a second commit); each rule above comes
  from one of those failures. The CI course is now made as `core/ci_course.sh` makes it: one commit.

## Results (agent-run, on `ed152de`)

| Check | Result | Log |
|---|---|---|
| `ci/oncourse.js` on a fresh course (mkcourse, then the script, one commit, `build.py`) | exit 0 / build exit 0: q90 file (11 topics, 118 questions), images.json (9), the course.js line | `logs/final-mkci.log` |
| `ci/oncourse.js` a second time on that course | exit 1, "already switches paper-picker on" (as designed) | `logs/final-ci-oncourse-again.log` |
| Module test on that course (PK's 3 exams), run 1 / 2 / 3 | PASS 74 / PASS 74 / PASS 74 | `logs/final-module-test-run{1,2,3}.log` |
| `run_checks.sh` on that course | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`: 20 of 125 questions); `features/paper-picker/test.js` 74 | `logs/final-run_checks.log`, `logs/final-run_checks-per-check/` |
| Module test, study-controls **present**, PK's 3 exams | PASS 74 | `logs/final-sc3-paper-picker-test.log` |
| Module test, study-controls **present**, template course with 1 exam | PASS 57 | `logs/final-sc1-paper-picker-test.log` |
| Module test, study-controls **absent**, template course with 1 exam | PASS 57 | `logs/final-one-paper-picker-test.log` |
| Module test, study-controls absent, PK's 3 exams | PASS 74 (the final course above) | `logs/final-module-test-run1.log` |
| F3 before: the old selectors, study-controls present, PK's 3 exams | FAIL 2 of 62 (`{"on":["2",null]}`: study-controls' layout chip is pressed too) | `logs/sc3-test-F3-old-selector.log` |
| Module test on a page built with the module's code emptied | FAIL 1 of 1, as it must ("the page carries paper-picker, working") | `logs/final-absent-test.log` |
| study-controls' own test on the PK 3-exam course with paper-picker (information only) | FAIL 3 of 61: its F2 (a 120-minute clock reads 119:59) and its choice of Exam 1 as the earlier exam, which this course cannot draw (`drawn: 3`) | `logs/final-sc3-study-controls-test.log` |
| Mutation checks | pass 1: 22 of 27 caught; pass 2 (5 new checks): 5 of 5 caught | `mutations.md` |
| No-module template course; Medicinal-chemistry | cited from `evidence/baseline` `main-98e7b5b/` (tree hashes match) | — |
| WebKit (Safari) | NOT RUN: this container has Chromium only | — |

Lookbehind: `grep -nE '\(\?<[=!]'` on `features/paper-picker/current/*.js` and `ci/*.js` finds nothing;
`device_lint.js` PASS. Token grep `git grep -nE "ghp_|github_pat_"` on the changed files: nothing, before the commit.

## Behaviour map

`behaviour-map.md` (26 rows, each with its source lines; also in the pull request text).

## Mutation checks

Script `mutations.py`; tables in `mutations.md` (both passes, with the checks that failed and the exit codes).
Not caught in pass 1, and the check added for each:
M1 (largest remainder) — a paper size the marks do not divide (7 and 41) is split as the largest-remainder method says;
M6 (a paper recorded at each drawing of its result page) — the result page drawn again after another tab keeps one record;
M17 (every exam choosable) — an exam the build step left off cannot be chosen;
M26 (a short pool not topped up from its own select-all questions) — single-answer questions set aside (lowYield, in that run only) until one select-all more is needed: the pool still gives its share;
M27 (no shuffle) — over five papers, one does not hold its pools one after another.

## Persistence (QUALITY C), in the module test, every run

| Case | Result |
|---|---|
| 101 papers submitted (Exam 2 and Exam 3 in turn), reload after 400 ms | the 100 newest kept, the first dropped; the 12 newest listed ("the 12 newest of 100"); all 100 identical after the reload |
| A reload during a paper (300 ms after the third answer) | the same paper at question 4, still recorded as drawn for Exam 2; submitted, it is recorded for Exam 2 |
| Reload at once after a choice (under 150 ms) | the choice was **lost** in every run (core behaviour: the save waits 150 ms; reported as a note) |
| Reload 300 ms after a choice | kept |
| Export, then Import into a fresh profile | the export carries the choice and the 100 papers; the fresh profile had none; after Import it has them, identical |
| Profile switch | each profile keeps its own: the second profile's choice changed to Exam 1; the first still has its own choice and 100 papers |
| Storage denied (`setItem` throws `SecurityError`) | the core's notice shows; the saved progress in localStorage is unchanged; the new paper and choice hold for the visit; when storage works again the next save writes them and a reload loads them |
| Storage full (`QuotaExceededError`) | the notice shows; nothing saved is overwritten; after storage works again a reload loads what was saved before (the choice and paper made while storage was full are lost on that reload, as the notice says) |

## Faults found

- **Module:** none. Every mutation is caught, and no check found a fault in `paper-picker.js` or `step.js`; they are unchanged.
- **Test:** F3, the chip selectors (lines 150 and 186 at `c1709f5`), fixed as the coordinator's patch.
- **Data:** the findings above (STEM_RE stems, "undefined" in texts, professor's name in 56 questions).
- **Seen on the page:** the module's opening page for another exam says "About 4 of the 40 are
  select-all" from the exam's `sata`, while Exam 2's paper carries 3 (its Module 4 pool holds no
  select-all question). Row 23 of the behaviour map; not changed here.
- **study-controls' test** (another branch): it assumes the first other exam can be drawn; on this
  course Exam 1 cannot. For the study-controls porter, beside F2.

## Needs a core change (for a separate core proposal)

- Topics, Weak spots and the exam-weighted pass following the chosen exam, and a paper of another
  length or clock: "several exams on one site" (already listed in `review/port-queue.md`).
- The result page after a reload (the core keeps no record of a submitted paper).
- A save on `pagehide`: a choice made less than 150 ms before a reload is lost.

## Commands

`commands.md` lists every command run through `scripts/run.sh` with its exit code and log
(39 rows). Exit 1 rows that are not faults: `try1-run_checks` (the first data, see above),
`try2-mkci` first row (a syntax error in the first fixture writer; its log was overwritten by the
second, exit 0, run of the same name), `try2-newtest` (a test bug: the module's hook runs from a
MutationObserver, so the loop now calls `logPaper` itself), `sc3-test-F3-old-selector` (F3, as
expected), `try2-newtest3` (a test bug in the new top-up check, fixed in `try2-newtest4`),
`final-ci-oncourse-again` (refuses, by design), `absent-test` and `final-absent-test` (must fail),
`final-sc3-study-controls-test` (study-controls' test, above). Other commands: `/tmp/port-tools/mkcourse.sh`
inside `scripts/mkci.sh` and `scripts/mkplain.sh`; plain `git` for scratch commits, the port-branch
commit and push, and this branch.

Screenshots: `shots/exam2-chosen.png`, `shots/exam1-short-and-list.png`.
