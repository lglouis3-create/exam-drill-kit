# stopwatch: hardening for Louis's rule 4 (the module's own course from real course data)

Every result in this folder is **agent-run** (2026-11-03 UTC, the kit's 2026-11-02 evening rules).
The coordinator adds its own re-runs, labelled coordinator-verified, under `../coordinator/`.

## Inputs

| What | Value |
|---|---|
| Source read | lglouis3-create/Basic-Pharmacokinetics- `ac2eb73`, `src/` (read-only clone `/tmp/pk-readonly`; never written) |
| Port branch at the start | `port/stopwatch` `dbdc42a` |
| **Final tested commit** | `port/stopwatch` **`b5a419b0c42e6afd2c4ee61048f98e8c0c368366`** (one commit on `dbdc42a`) |
| origin/main | `6432c36709ad3dc3ab78d8558239971b18234aec` |
| Core tree (`b5a419b:core`, the same on `6432c36`) | `a2dbf03d6ccea270f77ac440f3fd8b7a86d855cf` |
| Template tree (`b5a419b:template`, the same on `6432c36`) | `cbac5bd425d480944293f8e1fb5d5d703e8baba1` |
| Node, Python | v22.23.4, Python 3.13.18; Chromium only (WebKit is not installed) |

`git diff origin/main b5a419b -- core template` is empty. The module code (`stopwatch.js`, `stopwatch.css`,
`module.json`) is unchanged from the first version; this commit changes `test.js` and `ci/oncourse.js`, adds
`current/test_fixture.js`, and updates `FEATURES.md`, `CHANGELOG.md` and `review/port-queue.md`.

## What changed for rule 4

- `features/stopwatch/current/test_fixture.js`: Basic-Pharmacokinetics' own data, made by
  `scripts/mkfixture.js` (loader `scripts/pkload.js`, the course's build order) and written by
  `scripts/writefixture.js`. Regenerated from the read-only clone and compared byte for byte with the
  committed file: identical (last row of `commands.tsv`). `fixture-summary.json` is the generator's output.
  - Exam 3 (final), the course's `activeExam`, every field. It has no `typed`: Basic-Pharmacokinetics'
    engine draws calculations onto every paper without an option (`src/shell.html` line 1180,
    `src/views.js` lines 3270-3277). The data is kept as it is.
  - The 5 numeric questions of the professor's Canvas Quiz 4 (`cq4-2`, `cq4-4`, `cq4-6`, `cq4-8`, `cq4-9`;
    none left out). Quiz 4's `said` line (`src/course.js` line 264) gives the pace, 120 s.
  - 55 single-answer and select-all questions for Exam 3's pools (f-e1 21, f-e2 19, f-pkpd 7, f-nl 8),
    10 topics, 9 lectures, the skills they use, 7 images. The rule is in the header of `scripts/mkfixture.js`.
  - Questions that name the professor (the name, or "Dr.") cannot be taken; none was reworded.
    `scripts/namecheck.js` (reads the name from the read-only clone) finds the name in no line of the
    staged diff and of this folder.
  - The one change to the data: `prof` is "Professor". Ids carry the prefix `sw-` (placement). The text is
    otherwise as the course has it; in places it refers to the professor with a pronoun (Exam 3's fact
    "What she expects"), and that is not reworded.
- `ci/oncourse.js` writes exactly that course (and `paceSeconds: 120`); it refuses a course that is not
  the template's ("Professor") and a second run.
- `test.js` runs on that course. On any other course its scratch copies add the fixture. The paper checks
  run on a paper of Exam 3 as the course has it; the clock on a paper calculation is checked on a scratch
  copy that sets the core option `typed: true` on Exam 3.

## Commands (all agent-run; `commands.tsv` has every one with its UTC time, exit code and log)

| # | Command | Exit | Log | Result |
|---|---|---|---|---|
| 1 | `bash core/ci_course.sh module:stopwatch` (kit at `b5a419b`) | 0 | `logs/ci_course-module-stopwatch.log`, per check `logs/ci_course-checks/` | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`: 21 of 67 questions carry an explanation issue). `features/stopwatch/test.js` 29 checks; `home_test.js` 36 checks; `style_check.js` 67 stems and 67 explanations clean; `test.js` 67 questions, 18 warnings |
| 2 | `scripts/mkc.sh c1`: `/tmp/port-tools/mkcourse.sh` with the module, `ci/oncourse.js`, commit, `python3 build.py` | 0 | `logs/final-mkc.log` | the course written as above |
| 3-5 | `node features/stopwatch/test.js` on c1, three times (`scripts/run3.sh`) | 0, 0, 0 | `logs/final-module-test-run{1,2,3}.log` | PASS 29 checks each time |
| 6 | `node features/stopwatch/ci/oncourse.js` a second time on c1 | 1 | `logs/final-oncourse-second-run.log` | refused: "course.js already switches stopwatch on" |
| 7 | `node scripts/persistence_test.js c1/src` | 0 | `logs/final-persistence.log` | PASS 16 checks, 1 report |
| 8 | `scripts/absent.sh` a): the page built with `COURSE.features = {}` | 1 | `logs/absent-a-test.log` | FAIL 1 of 1 ("the page carries stopwatch, working") |
| 9 | `scripts/absent.sh` b): `stopwatch.js` cut to its `X.api` only | 1 | `logs/absent-b-test.log` | FAIL 14 of 29 |
| 10 | `node scripts/screenshots.js c1/src screenshots` | 0 | `logs/final-screenshots.log` | 4 PNG files |
| 11 | `python3 scripts/mutations.py cm/src logs/mutations` (cm: a copy of c1) | 0 | `logs/mutations/` | 12 of 12 caught |
| 12 | fixture regenerated and compared (`cmp`) | 0 | `fixture-summary.json` | identical |

Before the commit, with the same files: `logs/dev-module-test-1.log` (PASS 29) and `logs/dev-run_checks-1.log`
(26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT), and a 10-mutation run, `logs/mutations-dev10/` (10 of 10 caught;
its row in `commands.tsv` names `logs/mutations`, the folder it was written to before it was renamed).

GitHub, kit checks on `b5a419b` (run `41552401712`, pull request event): see `github.md`.

## Baseline (cited, not rerun)

The no-module template course and Medicinal-chemistry `main` `f1f5ee5` (full clone) are cited from branch
`evidence/baseline`, folder `evidence/baseline/main-6432c36/` (commit `f8a22d5`), because this branch's core
and template trees are exactly that folder's inputs (`a2dbf03`, `cbac5bd`):
- template course, no module: `off build.py exit=0`, `off run_checks.sh exit=0` (24 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT);
- Medicinal-chemistry: `mc run_checks.sh exit=0`: 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no
  step-through figures; `cite_check.py`: no PDFs), 1 REPORT; `home_test.js` PASS, 36 checks.

## Behaviour map

`behaviour-map.md`.

## Mutation table (agent-run, `logs/mutations/mutations_table.md`)

Each mutation is one exact replace in `features/stopwatch/stopwatch.js` of the scratch copy (it must match
once), then `python3 build.py` and the module test. The branch is never changed. M11 and M12 are new.

| Mutation | What it breaks | Exit | Checks that failed |
|---|---|---|---|
| M1 | no clock on a quiz calculation | 1 | 5 |
| M2 | the clock does not count | 1 | 3 |
| M3 | the pace is never passed | 1 | 2 |
| M4 | the time shown is not the recorded ms | 1 | 4 |
| M5 | an answer within the pace is not green | 1 | 1 |
| M6 | multiple-choice questions get a clock | 1 | 3 |
| M7 | paper time replaced, not added up | 1 | 2 |
| M8 | paper answers keep no time | 1 | 2 |
| M9 | with no pace, every time is "over" | 1 | 2 |
| M10 | no clock on a paper calculation | 1 | 2 |
| M11 | the course's paceSeconds is not read | 1 | 2 |
| M12 | the time on the question shown at Submit is not added | 1 | 2 |

## Persistence (agent-run, `logs/final-persistence.log`)

On the module's own course, each paper Exam 3 drawn by the core, two questions answered, "Submit what I
have answered"; 400 earlier answers saved first.
- reload 400 ms after a paper: the 400 answers and the paper's ms back: PASS;
- reload 20 ms after a paper: 0 of 2 paper answers back: reported (the core saves 150 ms after a change);
- Export, then Import into a fresh profile: the same 402 answers with the same ms: PASS;
- profile switch: each profile keeps its own paper times: PASS;
- storage denied and storage full: the notice shows, the paper's times stay in the page, the stored
  progress is not overwritten, and after storage works again the 402 answers load: PASS for both.

## Findings

- No fault in the module.
- Core `test.js` section 7 fails on a course whose first concept with two questions is in a topic with
  fewer than 5 concepts (`GAP = 4` other questions before a missed concept returns; a smaller topic runs
  out). A first choice of questions hit it (`scripts/debug7.js` shows the picks). The rule now also takes,
  in a pool that needed questions with images, every other question of that pool that shows no further
  image. Reported for the core; the core is not changed.

## Screenshots (`screenshots/`, Chromium, the module's own course)

`quiz_cq4-2_running_0-47.png`, `quiz_cq4-2_over_pace.png`, `quiz_cq4-2_took_over_pace.png` (the card head of
the professor's Quiz 4 calculation), `exam3_paper_head.png` (a paper of Exam 3: no clock on its questions).

## NOT RUN

- WebKit (Safari) in this container: not installed; Chromium only. (GitHub runs WebKit on the template
  course, as information; see `github.md`.)
- `cite_check.py`: no lecture PDFs in any repository (the documented exclusion).
