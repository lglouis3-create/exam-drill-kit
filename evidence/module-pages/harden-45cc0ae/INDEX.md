# Evidence: module-pages, hardening 2 (integration finding F6; HARDEN 9a/9a2)

Every result here is **agent-run** (a porting session, 2026-11-02 evening). The earlier agent-run
evidence is in `../INDEX.md`; the coordinator's re-runs are in `../coordinator/`.

## Inputs

| What | Value |
|---|---|
| Source read | lglouis3-create/Basic-Pharmacokinetics- `ac2eb73` (`/tmp/pk-readonly`): `src/course.js` lines 29 (professors) and 50-61 (lectures L02, L03), `src/q1_module1.js` lines 46-58 (topics bolus1, bolus2, `prof`) |
| Port branch start | `428d109` |
| Port branch commit added | `45cc0ae` (test fix, ci course script, FEATURES.md and CHANGELOG.md counts) |
| **Final tested commit** | **`45cc0ae794a9ffa6b00e899e441d126e7b147c7f`** (pushed: `428d109..45cc0ae`) |
| origin/main | `98e7b5b9d42d1bc81b84ab6a06eadf554035ecba` |
| core tree | `c9fde5b23f43746ff8d392314f86e8ff313c1cda` |
| template tree | `cbac5bd425d480944293f8e1fb5d5d703e8baba1` |
| Partner modules copied into scratch courses (never committed) | `origin/port/worksheets-ink` `8265f5c`, `origin/port/concept-statuses` `46e3156`; for the F6 case, worksheets-ink from `origin/integration/ports-2026-11-02` `fa99b5c` |
| Finding fixed | F6 (`evidence/integration` `1329222`, INDEX.md section 4): `test.js` lines 151-267 at `428d109` assume the course has no Module 2 content of its own |
| Integration patch used | `/tmp/port-integration/fixes/module-pages.patch` (its two changes are in `45cc0ae`) |

`git diff origin/main -- core template` is empty at `45cc0ae`, and the core and template trees are
the ones `evidence/baseline` folder `main-98e7b5b/` (commit `22b4290`) ran with.

## What changed

1. **`test.js` (F6).** The fixture (PK Module 2: 22 questions, 2 topics, 5 objectives, 4 kinds of
   problem, 1 problem set, Homework 2) now goes on a module number the course does not use (the first
   free number from 92, read from the course's lectures and questions; on these courses 92) and on
   topic ids prefixed `mpt-` (`mpt-bolus1`, `mpt-bolus2`). Objectives' `subs`, kinds' `match`, the
   set's and Homework 2's `module` follow. The refusal "an objective of a module the course does not
   have" uses the next free number (93). From the integration patch: In parts clicks the set's own
   button (`[data-mpchain="mpt-hw2-p2"]`), opening a closed "In parts" list first; the Homework row's
   count is read from the row of `[data-mpsheet="mpt-hw-2"]`. New: `const PK_LECTURES`, PK's two
   Module 2 lectures (course.js 55-61), `prof` set to "Professor", read by `ci/oncourse.js`.
   The script that applied the change: `scripts/fix_f6.py` (exact replaces, each must match the stated
   number of times).
2. **`ci/oncourse.js` (HARDEN 9a, 9a2).** At `428d109` it wrote no data (it only switched the module
   on), so it did not meet 9a. It now writes the module's own course from the test's fixture:
   - the 8 questions whose `cite` names a deck of PK's lectures (`2IVBolusAdministration.pdf`),
     one per line as `{id:'mpc-…', prof:'Professor', …}` (9a2 item 1);
   - their 2 topics `bolus1`, `bolus2`, pushed after the course's topics (item 2), each with
     `prof:'Professor'` (PK has the professor's surname as `prof` on them; the fixture had dropped it);
   - the 5 Module 2 objectives; the 1 kind of problem whose worked example is among the 8 (`m2-two`,
     example `m2-n-koverall`); the skill `multicpt`;
   - lectures `mpc-L02`, `mpc-L03` as JS literals in course.js (item 3);
   - module-pages on with `modules: [["Module 1","Module 1"],[2,"Module 2 - IV Bolus Administration"]]`
     (the course's own lecture module, then PK's Module 2 under its PK name from the fixture).
   Left out, with the reason printed: 12 questions whose cite names no lecture deck (practice sheets,
   Homework-2.pdf, a lecture transcript); 2 second wordings (questions with `dupOf`, see finding K1);
   3 kinds whose worked example is one of the left-out questions (the build step would refuse them);
   the 1 problem set (its parts cite Homework-2.pdf).
   The one change to the data: `prof` set to "Professor" on questions, topics and lectures.
   0 occurrences of the professor's surname in the files written (`ci-course-written/`). Style: `style_check.js`
   PASS (no stem trips STEM_RE, 9a2 item 4).

## Commands and results (agent-run)

Scripts are in `scripts/`. `COMMANDS.tsv` lists the scripted test runs (name, cwd, command, exit, log).

| # | Command | Exit | Result | Log |
|---|---|---|---|---|
| 1 | `mk.sh c-ws0 yes` with the files of `428d109` (module-pages + chained-problem-sets, worksheets-ink ci data `8265f5c`, the old ci) | 0 | built: 26 questions in 6 topics; worksheets-ink data is Modules 6, 7a, 7b, 8 (4 documents, 19 questions) | `logs/mk-ws0-before.log` |
| 2 | test at `428d109` on that course | 0 | PASS 39 (2 skipped): the current worksheets-ink data has no Module 2, so F6 does not show with it | `logs/test-428d109-ws-data-present.log` |
| 3 | F6 case: `WSTAR=ws-int.tar mk.sh c-f6 yes no` + `on-nodata.sh` (worksheets-ink ci data from `fa99b5c`: 33 questions, 6 sets, 3 topics, with PK Module 2; module-pages on with no data, as at `428d109`) | 0; 0 | built: 40 questions in 5 topics | `logs/mk-f6-integration-wsdata.log`, `logs/f6-on-nodata.log` |
| 4 | test at `428d109` on c-f6 | 1 | **FAIL** (F6 reproduced): Module 2 card "calcs: 35 problems"; All calculations not 12; In parts `chain: 3`; then `page.click` timeout | `logs/test-428d109-f6-integration-wsdata.log` |
| 5 | test at `45cc0ae` on c-f6 | 0 | **PASS 39** (2 skipped: the course declares no OBJECTIVES / CALC_TYPES) | `logs/test-new-f6-integration-wsdata.log` |
| 3a | (before 3's `on-nodata.sh`) the same two tests on c-f6 without module-pages on | 1, 1 | FAIL 1 of 1 ("the page carries module-pages"): module not on. The logs were overwritten by runs 4 and 5; rows 8-9 of COMMANDS.tsv | — |
| 6 | first `ci/oncourse.js` draft (second wordings kept, 10 questions): `mk-alone.sh c-own` + `run_checks.sh` | 1 | 24 PASS, 3 FAIL, 1 NOT RUN, 1 REPORT: core `test.js` "missed concept never returned" and `output_test.js`, `checks_test.js` (both run test.js on the page). Finding K1 | `logs/mk-own-with-second-wordings.log`, `logs/run_checks-own-with-second-wordings.log`, `logs/core-check7-trace-with-second-wordings.log` |
| 7 | final `ci/oncourse.js`: `mk-alone.sh c-own` (mkcourse.sh with module-pages, ci, commit, build) | 0 | ci exit 0; build exit 0; 15 questions in 4 topics | `logs/mk-own.log` |
| 8 | **`./run_checks.sh` on the module's own course (c-own)** | 0 | **26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`, 7 of 15)**; module test 30 checks (3 skipped) | `logs/run_checks-own.log` |
| 9 | **module test x3 on c-own** | 0, 0, 0 | **PASS 30** each (3 skipped: In parts; with worksheets-ink on; with concept-statuses on: not in the course) | `logs/test-own-{1,2,3}.log` |
| 10 | `mk.sh c-ci no` (partners copied in, worksheets-ink data absent, module-pages ci) + module test | 0; 0 | PASS 42 | `logs/mk-ci-wsabsent.log`, `logs/test-partners-wsdata-absent.log` |
| 11 | `mk.sh c-ciws yes` (worksheets-ink ci data `8265f5c` present, then module-pages ci) + module test | 0; 0 | built: 36 questions in 8 topics; PASS 42 | `logs/mk-ci-wspresent.log`, `logs/test-partners-wsdata-present.log` |
| 12 | test at `428d109` on c-own and on c-ciws (the module's own PK Module 2 data in the course) | 2, 2 | NOT RUN: its scratch copy does not build ("two objectives of module 2 are numbered 1"): the old test also collided with the module's own real-data course | `logs/test-428d109-own.log`, `logs/test-428d109-partners-wsdata-present.log` |
| 13 | `mutations.py c-ci/src logs/mutations-v2` | 0 | 13 of 13 caught | `logs/mutations-v2/mutations.md`, `mutation-NN.log` |
| 14 | module test on a copy of c-own with `module-pages.js` emptied | 1 | FAIL 1 of 1: "the page carries module-pages, working" (as it must) | `logs/module-absent.log` |
| 15 | `ci/oncourse.js` a second time on c-own | 1 | refuses: "this course already has the module-pages ci data"; course.js unchanged | `logs/ci-oncourse-again.log` |
| 16 | token grep `git grep -nE "ghp_|github_pat_"` on the changed files before the commit | 1 (nothing found) | — | — |
| 17 | `grep -niE` for model names, regex lookbehind and the professor's surname on the branch diff | 1 (nothing found) | — | — |

worksheets-ink's ci data at `8265f5c` built in every course (rows 1, 11); no fallback to its test's
fixture was needed.

### Baseline (cited, not rerun)

Core tree `c9fde5b` and template tree `cbac5bd` equal the inputs of `evidence/baseline` folder
`main-98e7b5b/` (commit `22b4290`; `inputs.txt`), and Medicinal-chemistry `main` is `f1f5ee5`
(`git ls-remote`, this session), its input too. Its Medicinal-chemistry run is from a full clone
(`baseline.sh` line 26: `git clone -q` without `--depth`). Results cited (coordinator runs):
- template course with no features: 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT;
- Medicinal-chemistry: 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures;
  `cite_check.py`: no PDFs), 1 REPORT. `home_test.js` passed there; its known intermittent fault
  (1 of 33, `evidence/baseline` `mc-full-clone/`) did not show in that run. Not rerun here.

## Behaviour map

Unchanged from `../behaviour-map.md` (the module code is unchanged: `git diff 428d109 45cc0ae --
features/module-pages/current` touches only `test.js`).

## Mutation checks (agent-run, `mutations.py`, on c-ci: partners in the course, PK Module 2 ci data on)

| Mutation | Check that failed | Exit |
|---|---|---|
| M1 objective drill takes calculations too | an objective whose subtopics also hold calculations draws only their concept questions | 1 |
| M2 kind ignores the skill in its match | the fixture Module 2 card counts; Calculations lists the 4 kinds; without chained-problem-sets: the kinds are listed | 1 |
| M3 worked example without its working | Calculations lists the 4 kinds, each with a worked example worked line by line | 1 |
| M4 a tap on Topics keeps the module page | a tap on Topics while on a module's page goes back to the cards | 1 |
| M5 other modules' cards not hidden under a module page | what another module adds to Topics is hidden under a module's page | 1 |
| M6 status line skips unanswered concepts | with concept-statuses on, each objective row says how many of its concepts are in each status | 1 |
| M7 worksheets not matched to the module | with worksheets-ink on, the fixture Module 2 card offers Worksheets (1 document) | 1 |
| M8 questions no kind takes are dropped | a module with no objectives or kinds lists its questions under All concept questions and Calculations by subtopic | 1 |
| M9 build step accepts a worked example of another kind | a worked example of another kind stops the build and says so | 1 |
| M10 module page not redrawn when Topics is drawn again | coming back to Topics from the quiz shows the module's page again | 1 |
| M11 In parts not offered | with chained-problem-sets on, the two-compartment kind offers In parts | 1 |
| M12 numeric items counted as concepts | the course's own data: every concept question belongs to an objective (8), every worked example is of its own kind (1); the fixture card counts; and more | 1 |
| M13 module ignores a question's own `module` field | Topics shows a card per module; the fixture Module 2 card counts | 1 |

## Persistence (QUALITY C)

Not applicable, unchanged: the module saves nothing (no `DB` field, store key or localStorage);
Export/Import, profile switch, reload timing and storage-denied tests: NOT RUN, nothing to persist.

## Findings

- **F6 (fixed in `45cc0ae`).** The test counted the course's own Module 2 content. Now on a free module
  number and its own topic ids; passes with worksheets-ink's integration-era Module 2 data (run 5), with
  the current worksheets-ink data (run 11) and with the module's own PK Module 2 data (runs 8-11).
- **K1 (core check limit; for a core proposal; not fixed).** Core `test.js` section 7 ("Different
  wording when a missed concept returns") takes the first concept that has two wordings and expects it
  to come back within that concept's topic. A missed concept returns only after `GAP = 4` other
  questions (`core/shell.html` line 887), and `pickNext` returns nothing once every other question of
  the topic is answered. With PK's real data the topic `bolus1` holds 4 concepts (6 questions), so the
  missed concept cannot return inside it and the check fails, taking `output_test.js` and
  `checks_test.js` with it (run 6; trace: `pickNext` returns null after 3 other questions). The ci
  course therefore leaves out the 2 second wordings (`m2-mod-2`, `m2-vd-2`); no question is changed.
- **Not a module fault, noted:** at `428d109` `ci/oncourse.js` wrote no course data (HARDEN 9a);
  replaced.

## NOT RUN

- Safari / WebKit: not installed in the container (Chromium only).
- Medicinal-chemistry: not rerun (cited from the baseline, above).
- Persistence tests: nothing to persist.
