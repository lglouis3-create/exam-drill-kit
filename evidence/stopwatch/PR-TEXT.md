<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

Port queue item 9, Tier 2 (`review/port-queue.md`). It needs your yes before it merges. Pharmacokinetics' code was only read, from a read-only copy at `ac2eb73`.

## What the feature does

The module brings the Pharmacokinetics drill's stopwatch on calculations into the kit (`src/views.js` 1463-1482 and the places that use it: 1794, 1890-1892, 3226, 3290-3297, 3310, 3371, 5762; its styles in `src/shell.html` 246-251).

- **A clock on each calculation.** In the quiz, a question of type `numeric` shows a clock in its card head. It starts when the question is drawn, the same moment the core starts timing the answer.
- **The time taken.** After the answer the clock stops and shows "took 1:47". That is the time the core records with the answer (`ms`), read from the answer itself, so the screen and the record show the same time.
- **The professor's pace.** With the option `paceSeconds` (Pharmacokinetics: 120, from its `course.js` line 264, "A few calculations, each meant to take 2 minutes or less"), a clock past the pace turns red and says "over 2:00" in words, not by colour alone. An answer within the pace is shown in green. Without the option the clock runs with no pace.
- **Exam papers.** On a paper, the time on each question is added up while that question is on screen; going Back to a question adds to its time. When the paper is submitted, each answer keeps its question's time as `ms`, as Pharmacokinetics' paper did. The core records no time for paper answers. A calculation on the paper also shows its clock from its time so far; in the kit a paper carries calculations only when the exam has `typed: true`.

## What the core already had

- The time of every quiz answer (`ms`), recorded by the core since before this port.
- "Right, but slow" on Weak spots: right answers that took at least twice the student's usual time for that kind of question.
- One clock for a whole exam paper (a countdown, or the time taken on an untimed paper).

The core showed no clock on a question, had no pace, and kept no time for paper answers. That is what the module adds. It reads no course data.

## What changes

- New folder `features/stopwatch/current/`: `stopwatch.js`, `stopwatch.css`, `module.json` (one option, `paceSeconds`, default 0), `test.js` (29 checks) and `test_fixture.js` (the course data of the test and of the module's own course, below).
- New file `features/stopwatch/ci/oncourse.js`: builds the module's own course for the kit's checks (`core/ci_course.sh module:stopwatch`). Courses never copy it.
- Catalog bookkeeping:
  - `FEATURES.md`: the entry listed as `calc-stopwatch` is now `stopwatch`, with the real option name (`paceSeconds`, not `targetSeconds`), what is not ported, and the test and its course data. `COURSES.md` still names Pharmacokinetics' own copy `calc-stopwatch`; it is left as it is.
  - `features/README.md`: one row added.
  - `review/port-queue.md`: item 9 set to `partial (left: time per kind of calculation on Weak spots, needs CALC_TYPES; Start timer on the one-page layout, needs item 21; "took m:ss" in the list of misses; time per paper question through a reload, needs a core change)`. The first version listed only the first two.
  - `CHANGELOG.md`: one entry under 2026-11-02.

## The module's own course (Louis's rule 4)

The first version switched the module on in the template's sample course, and its test added one question of its own. Now the module's own course is Pharmacokinetics' own data at `ac2eb73`, taken from its files with nothing invented, in `features/stopwatch/current/test_fixture.js`; `ci/oncourse.js` writes exactly that course:

- **The exam:** Pharmacokinetics' Exam 3 (final), the course's `activeExam`, every field as the course has it: 40 questions, 120 minutes, 4 select-all, four pools (Exam 1 material 15, Exam 2 material 15, PK-PD 5, nonlinear 5).
- **The calculations:** the 5 numeric questions of the professor's Canvas Quiz 4 (`src/q13_quizzes.js`: `cq4-2`, `cq4-4`, `cq4-6`, `cq4-8`, `cq4-9`). Quiz 4 is the quiz whose `said` line in `course.js` (line 264) gives the 2-minute pace.
- **The other questions:** 55 single-answer and select-all questions that fill Exam 3's pools, with their 10 topics, 9 lectures, the skills they use and the 7 images they show. Which ones is decided by a rule that only chooses, never changes a question: a question is taken when it is not `lowYield`, does not name the professor, passes the kit core's rules for a question, and its `dupOf` chain can be taken too; for each pool, questions without an image first, in the course's order, then questions with an image, smallest first, until the pool holds its marks plus one question family and its share of select-all questions plus one. The script is in the evidence (`scripts/mkfixture.js`).
- **Left out:** questions that name the professor in their text are left out, not reworded. None of the 5 Quiz 4 calculations was left out. No chosen stem trips `style_check.js` ("given as"): `style_check.js` reports 67 stems and 67 explanations clean.
- **The one change to the data:** every `prof` is the template's "Professor". The text is otherwise as the course has it; in places it refers to the professor with a pronoun (for example Exam 3's fact "What she expects"), and that is not reworded.
- **Placement, not a change to what the data says:** ids carry the prefix `sw-` (so they never meet another module's copy of the same Pharmacokinetics data in one course); the topics come after the template's own; `COURSE.exams` becomes this one exam; the module is on with `paceSeconds: 120`.
- **No `typed` in the source.** Pharmacokinetics' exams have no `typed` field: its own engine draws calculations onto every paper without an option (`src/shell.html` line 1180, `src/views.js` lines 3270-3277). The kit core draws them only for an exam with `typed: true`. The data is not changed: the module's own course keeps Exam 3 without `typed`. The test checks paper timing on a paper of that exam as it is (40 questions, no calculation, the time on each question kept with its answer), and checks the clock on a paper calculation on a scratch copy of the course that sets the core option `typed: true` on Exam 3.

## Not ported, and why

- **Time per kind of calculation on Weak spots** (`src/views.js` 2161-2200: the middle time per kind against the 2-minute line, and "Work on these first" with a drill button). It groups by Pharmacokinetics' `CALC_TYPES`, which the kit does not have yet. The student will not see time per kind of calculation.
- **The one-page layout's "Start timer" button** (`src/views.js` 1484-1530). The core has no one-page layout (port queue item 21).
- **"took 1:47" beside a calculation in the list of misses** (`src/views.js` 2354).
- **The time per paper question kept through a reload in the middle of a paper** (`src/views.js` 3033, 3064, 3790, 5787). Pharmacokinetics saved it with the paper, also when the page was hidden or closed; a module cannot add to the core's saved paper. After such a reload the time on each question is counted again from the reload. This needs a core change (below).

## What does not change

- No course site changes. No course switches this module on, and no course repository was touched.
- `core/` and `template/` are unchanged (`git diff origin/main -- core template` is empty). A course without the module builds the same page as before.

## Review evidence

All results below are agent-run. Evidence branch: `evidence/stopwatch` (commit `df0d964`), folder `evidence/stopwatch/rule4-b5a419b/` (`INDEX.md`, every log, the scripts and screenshots); the first version's evidence stays beside it.

**Final tested commit: `b5a419b0c42e6afd2c4ee61048f98e8c0c368366`** (branch start `dbdc42a`; the module code, `stopwatch.js`, `stopwatch.css` and `module.json`, is the same as in the first version). Core tree `a2dbf03`, template tree `cbac5bd`, the same as `origin/main` `6432c36`.

### Check results (agent-run, on `b5a419b`)

| Check | Result |
|---|---|
| `core/ci_course.sh module:stopwatch` (the module's own course, Pharmacokinetics' data) | exit 0: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`: 21 of 67 questions carry an explanation issue); module test PASS, 29 checks; `home_test.js` PASS, 36 checks |
| Module test on that course, three runs (a fresh `mkcourse.sh` course, `ci/oncourse.js`, `python3 build.py`) | PASS, 29 checks, each of the 3 runs |
| `ci/oncourse.js` a second time on the same course | exit 1, refused: "course.js already switches stopwatch on" |
| Module test on a page built with the module switched off | FAIL, 1 of 1 check ("the page carries stopwatch, working") |
| Module test with the module's code removed (only its `X.api` kept) | FAIL, 14 of 29 checks |
| Mutation checks (`mutations.py`, 12 mutations) | 12 of 12 caught (each exit 1; the first version had 10, rerun here on the module's own course with 2 more) |
| Persistence (`persistence_test.js`, on the module's own course) | PASS, 16 checks; 1 report (reload within 150 ms) |
| Template course with no features; Medicinal-chemistry `main` `f1f5ee5` from a full clone | cited from `evidence/baseline`, folder `main-6432c36/` (commit `f8a22d5`), because this branch's core and template trees are exactly `a2dbf03` and `cbac5bd`: template 24 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT (its `off-run_checks.log`); Medicinal-chemistry 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures; `cite_check.py`: no PDFs), 1 REPORT, `home_test.js` PASS 36 checks |
| GitHub, kit checks on `b5a419b` (run `41552401712`) | success, every job: Chromium · module:stopwatch (26 PASS, 0 FAIL, 1 NOT RUN `cite_check.py`, 1 REPORT; module test 29 checks), Chromium · medicinal-chemistry (23 PASS, 0 FAIL, 2 NOT RUN, 1 REPORT; `home_test.js` 36 checks), Chromium · template, Chromium · template-unset, WebKit · template (informational), Modules to check |
| WebKit (Safari) in this container | NOT RUN: not installed; Chromium only |
| Regex lookbehind in the module | none (`device_lint.js` PASS) |

The first version's counts (23 checks, 26 PASS on the template course, Medicinal-chemistry 22 PASS and 3 NOT RUN from a shallow clone) are replaced by the ones above.

### Behaviour map (from Pharmacokinetics `ac2eb73`)

| Source | Behaviour | Status |
|---|---|---|
| `src/views.js` 1467 | `PACE_MS = 120000` | **adapted**: option `paceSeconds` (default 0, a clock without a pace); Pharmacokinetics' 120 is set by the course |
| `src/views.js` 1469 | `fmtClock` (m:ss) | **ported** (same text on 7 control times) |
| `src/views.js` 1471 | after the answer: "took m:ss", "· over 2:00" in words, red over, green within | **ported**; the hover title says "The professor's pace: …" in place of a pronoun |
| `src/views.js` 1472 | "starts when you begin" when there is no start time | **omitted**: never reached in the kit; the core always sets the start |
| `src/views.js` 1473-1474 | running clock, red and "over 2:00" past the pace | **ported** |
| `src/views.js` 1476-1481, 5762 | the tick once a second | **adapted**: the text is changed in place, so the core's watch for redrawn views is not woken every second |
| `src/views.js` 1794 | the clock on the quiz card head, calculations only | **ported** |
| `src/views.js` 958, 1890-1892 | start at draw; time taken recorded with the answer | **core already**; the module shows the recorded time |
| `src/views.js` 1468 | `AWAY_MS` (an answer over 15 minutes left out of averages) | **omitted**: only the Weak spots chart used it |
| `src/views.js` 1484-1530 | one-page layout "Start timer" button | **omitted**: no one-page layout in the core |
| `src/views.js` 3226, 3290-3297 | time per paper question, added up while shown | **ported** |
| `src/views.js` 3310 | the clock on a paper calculation | **ported** (needs `typed: true` in the kit) |
| `src/views.js` 3371 | each paper answer recorded with its time | **ported**, for every paper answer, as in the source |
| `src/views.js` 3033, 3064 | time per paper question saved with the paper, back after a reload | **omitted**: needs a core change |
| `src/views.js` 3790, 5787 | the paper's time added and saved when the page is closed or hidden | **omitted**: needs the same core change |
| `src/views.js` 2161-2200 | Weak spots: time per kind of calculation, "Work on these first" | **omitted**: needs `CALC_TYPES` |
| `src/views.js` 2354 | "took m:ss" in the list of misses | **omitted** |
| `src/shell.html` 246, 250-251 | the clock's styles | **ported** |
| `src/shell.html` 247-249 | the styles of the two states not ported | **omitted** |

### Mutation table (agent-run, on the module's own course)

Each mutation is one exact replace in `stopwatch.js` in a scratch copy of the module's own course, never on the branch. M11 and M12 are new in this version.

| Mutation | What it breaks | Exit | Checks that failed |
|---|---|---|---|
| M1 | no clock on a quiz calculation | 1 | 5: a calculation (sw-cq4-2, the professor's Quiz 4) shows one running clock in its card head; its title gives the professor's pace; it counts in place (the same element, the text moved on); past 2 minutes it is red and says over 2:00; the clock runs with no pace and no "over" |
| M2 | the clock does not count (the tick shows 0:00) | 1 | 3: it counts in place (the same element, the text moved on); past 2 minutes it is red and says over 2:00; the clock runs with no pace and no "over" |
| M3 | the pace is never passed (over at ten times the pace) | 1 | 2: past 2 minutes it is red and says over 2:00; after the answer it stops on the time taken, over the pace |
| M4 | the time taken shown is not the recorded ms (one minute added) | 1 | 4: after the answer it stops on the time taken, over the pace; the time shown is the ms the engine recorded with the answer (the professor's key 151.1, graded right); an answer within the pace is shown in green, with no "over"; it stops on the time taken, with no pace colour |
| M5 | an answer within the pace is not shown green | 1 | 1: an answer within the pace is shown in green, with no "over" |
| M6 | multiple-choice questions get a clock too | 1 | 3: a multiple-choice question (sw-m1-int-01) has no clock; a paper of Exam 3 (final) as the course has it: 40 questions, 0 calculations, no clock; the multiple-choice question of the paper has no clock |
| M7 | time on a paper question is replaced, not added up (Back loses the earlier time) | 1 | 2: the 2 answers of the submitted paper keep their question's time as ms (Back added to the first one's); each answer of the submitted paper keeps its question's time as ms, the calculation's too |
| M8 | paper answers do not keep their time | 1 | 2: the 2 answers of the submitted paper keep their question's time as ms (Back added to the first one's); each answer of the submitted paper keeps its question's time as ms, the calculation's too |
| M9 | with paceSeconds 0 every time counts as over the pace | 1 | 2: the clock runs with no pace and no "over"; it stops on the time taken, with no pace colour |
| M10 | no clock on a paper calculation | 1 | 2: an exam calculation (sw-cq4-2) shows its own clock; back on the calculation its clock reads its time so far: undefined |
| M11 | the course's paceSeconds is not read (the pace is always 2:00) | 1 | 2: the clock runs with no pace and no "over"; it stops on the time taken, with no pace colour |
| M12 | the time on the question shown at Submit is not added before the answers are kept | 1 | 2: the 2 answers of the submitted paper keep their question's time as ms (Back added to the first one's); each answer of the submitted paper keeps its question's time as ms, the calculation's too |

### Persistence (agent-run, on the module's own course)

The module writes nothing to storage itself; it adds `ms` to each paper answer, which the core saves. Each paper here is Exam 3 drawn by the core (40 questions), with two questions answered and "Submit what I have answered". With 400 earlier answers saved:

- Reload 400 ms after submitting a paper: the 400 answers and the paper's times come back. PASS. (Also a check in `test.js`.)
- Reload 20 ms after submitting: 0 of 2 paper answers came back. Core behaviour (the save waits 150 ms); reported, not fixed.
- Export, then Import into a fresh profile: the same 402 answers with the same times. PASS.
- Profile switch: each profile keeps its own paper times. PASS.
- Storage denied, and storage full: the "did not save your progress" notice shows, the paper's times stay in the page for the visit, the stored progress is not overwritten, and after storage works again the saved progress (402 answers) loads. PASS for both.

### Findings of this hardening

- No fault in the module was found; the module code is unchanged.
- The core's `test.js` section 7 ("Different wording when a missed concept returns") fails on a course whose first concept with two questions sits in a topic with fewer than 5 concepts: the core asks for 4 other questions before a missed concept returns (`GAP = 4`), and a smaller topic runs out of questions first. A first choice of questions for this course hit that. The rule above takes, in a pool that needed questions with images, also every other question of the pool that shows no further image; with that, the topic holds enough concepts and the check passes. Reported for the core; not changed.

### Needs a core change (separate core proposals)

1. A reload within 150 ms of an answer or a submitted paper loses it: the core saves 150 ms after the last change and does not write when the page is closed or hidden.
2. A module cannot keep its own data with the saved exam paper, so the time per paper question cannot survive a reload in the middle of a paper.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
