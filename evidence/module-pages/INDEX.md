# Evidence: module-pages (port queue item 8)

> **Hardening 2 (2026-11-02 evening, agent-run):** integration finding F6 fixed and the CI course script rewritten from real PK data, final tested commit `45cc0ae794a9ffa6b00e899e441d126e7b147c7f`: see `harden-45cc0ae/INDEX.md`. The results below are for `c9492c8`.

Every result here is **agent-run** (the porting session, 2026-11-02). The coordinator adds its own
re-runs, labelled coordinator-verified, under `coordinator/`.

## Inputs

| What | Value |
|---|---|
| Source read | lglouis3-create/Basic-Pharmacokinetics- `ac2eb73` (`/tmp/pk-readonly`, `src/views.js` 722-854, 210-219, 370-387, 1933-1950, 5751, 6437-6460; `src/shell.html` 720-745; `src/review_test.py`, `src/problemset_test.py`, `src/place_test.py`); first commit of the feature `1003ce4` (2026-10-02), from a full read-only clone |
| Coordinating branches read | `origin/port/worksheets-ink` `fa4a532`, `origin/port/concept-statuses` `61eb52f` (module files only, copied into a scratch course, never committed) |
| Port branch start | `origin/main` `ac5c644` |
| Port branch commits | `72257d0` (the module), `c9492c8` (CI course script, queue status) |
| **Final tested commit** | **`c9492c844e8aed4ef8c57e2dfcff2850af59f25b`** |
| origin/main | `ac5c64491d9f9bf565ce3b4701c31db52633647c` |
| core tree | `daac6e234e10dae4a60c67f14cc575e9a0256f6c` (same as evidence/baseline) |
| template tree | `cbac5bd425d480944293f8e1fb5d5d703e8baba1` (same as evidence/baseline) |
| Medicinal-chemistry | `f1f5ee5` |

`git diff origin/main -- core template` is empty. The trees equal the baseline's, so the baseline
results apply; the no-module course and Medicinal-chemistry were also rerun here (below).

## Commands and results (agent-run)

| # | Command (cwd) | Exit | Result | Log |
|---|---|---|---|---|
| 1 | `node extract.js` (PK data in its build order) | 0 | 829 questions, 38 objectives, 35 kinds, 91 sets | (stdout) |
| 2 | `node mkfixture.js` | 0 | fixture: 22 questions, 5 objectives, 4 kinds; 0 personal names | (stdout) |
| 3 | `node features/module-pages/test.js` in a course built with module-pages' code emptied (`/tmp/port-module-pages/nocode/src`) | 1 | FAIL: 1 of 1 checks failed: the page carries module-pages, working | `logs/module-absent.log` |
| 4 | `mkcourse.sh <kit> off` + `python3 build.py` + `./run_checks.sh` (no features) | 0 | 24 PASS, 0 FAIL, 1 NOT RUN (cite_check.py: no PDFs), 1 REPORT (explain_check.js) | `logs/off_checks.txt` |
| 5 | same course built from origin/main `core`+`template`, compared with `cmp.py` (build stamp masked) | 0 | index.html, sw.js, version.json, manifest.json the same | `logs/nofeature-compare.log` |
| 6 | Medicinal-chemistry `f1f5ee5` + kit core, `./run_checks.sh` | 1 | 21 PASS, 1 FAIL (home_test.js, 1 of 33), 3 NOT RUN, 1 REPORT | `logs/mc_checks.txt` |
| 6b | `node home_test.js` alone, same copy | 0 | PASS: 33 checks (the FAIL in 6 did not repeat: under load; so 22 PASS, 0 FAIL, 3 NOT RUN, 1 REPORT, as this morning) | (stdout) |
| 7 | `mkcourse.sh <kit> on module-pages chained-problem-sets` + `oncourse-course_mp.js` data, `node features/module-pages/test.js` x3 at the final commit | 0, 0, 0 | PASS: 35 checks (2 skipped: worksheets-ink, concept-statuses not in the course), each run | `logs/final-module-test-on-{1,2,3}.log` |
| 8 | `./run_checks.sh` on that course at the final commit | 0 | 27 PASS, 0 FAIL, 1 NOT RUN (cite_check.py: no PDFs), 1 REPORT (explain_check.js); module-pages 35 checks, chained-problem-sets 13 | `logs/final-run_checks-on.log` (first run before the last check was added: `logs/on_checks.txt`) |
| 9 | the same course with worksheets-ink and concept-statuses copied in from their branches, `node features/module-pages/test.js` | 0 | PASS: 42 checks | `logs/module-test-with.log` |
| 10 | `python3 mutations.py <with course src> logs/mutations-run1` | 0 | 12 of 13 caught; M1 not caught | `logs/mutations-run1/` |
| 11 | after adding the check for M1: `python3 mutations.py <with course src> logs/mutations` | 0 | 13 of 13 caught | `logs/mutations/mutations.md`, `mutation-NN.log` |
| 12 | `mkcourse.sh <kit> ci module-pages`, `node features/module-pages/ci/oncourse.js <kit> <src>` | 0 | one line appended to course.js, no data file | `logs/ci-oncourse.log` |
| 12b | the same script a second time | 1 | refuses: the line is already there | `logs/ci-oncourse-again.log` |
| 12c | `python3 build.py`; `node features/module-pages/test.js` on that course | 0; 0 | built; PASS: 27 checks (5 skipped: no course OBJECTIVES/CALC_TYPES, no chained-problem-sets, worksheets-ink, concept-statuses) | `logs/ci-build.log`, `logs/ci-module-test.log` |
| 13 | `node shot.js` | 0 | `topics-cards.png`, `module-calculations.png` | — |

Lookbehind: `grep -nE '\(\?<[=!]'` on the module's JS files finds nothing; `device_lint.js` PASS in 8.
Token grep `git grep -nE "ghp_|github_pat_"` on the changed files: nothing, before each commit.

## Behaviour map

See `behaviour-map.md` (also in the pull request text).

## Mutation checks

Script: `mutations.py` (exact replace, must match once, in a scratch course only; never committed).

| Mutation | Check that failed | Exit code |
|---|---|---|
| M1 objective drill takes calculations too | an objective whose subtopics also hold calculations draws only their concept questions (added after run 1, where M1 was not caught) | 1 |
| M2 kind of problem ignores the skill in its match | Module 2 card counts; Calculations lists the 4 kinds; without chained-problem-sets: the kinds are listed | 1 |
| M3 worked example without its working | Calculations lists the 4 kinds, each with a worked example worked line by line | 1 |
| M4 a tap on Topics keeps the module page | a tap on Topics while on a module's page goes back to the cards | 1 |
| M5 other modules' cards not hidden under a module page | what another module adds to Topics is hidden under a module's page | 1 |
| M6 status line does not count unanswered concepts | with concept-statuses on, each objective row says how many of its concepts are in each status | 1 |
| M7 worksheets not matched to the module | with worksheets-ink on, the Module 2 card offers Worksheets (1 document) | 1 |
| M8 questions no kind takes are dropped | a module with no objectives or kinds lists its questions under All concept questions and Calculations by subtopic | 1 |
| M9 build step accepts a worked example of another kind | a worked example of another kind stops the build and says so | 1 |
| M10 module page not redrawn when Topics is drawn again | coming back to Topics from the quiz shows the module's page again | 1 |
| M11 In parts not offered | with chained-problem-sets on, the two-compartment kind offers In parts | 1 |
| M12 numeric items counted as concepts | worked example of its own kind; card counts; Concepts lists the 5 objectives; the mixed-objective check | 1 |
| M13 module of a question ignores its own module field | Topics shows a card per module; Module 2 card counts | 1 |

## Persistence (QUALITY C)

Not applicable: the module saves nothing. It keeps the open module page in a variable for the
visit and reads `DB.answers` and `DB.concepts` (through the core and concept-statuses); it writes
no `DB` field, no store key and no localStorage (`grep` for `localStorage`, `store.`, `save()` and
`DB.<field> =` in `module-pages.js` finds nothing). So Export/Import, profile switch, reload timing
and storage-denied tests have nothing of the module's to check: NOT RUN, nothing to persist.

## Partner modules (present and absent)

chained-problem-sets: present (runs 7, 8, 9) and absent (the test's own `mp-nochain` and `mp-bare`
builds, and run 12c). worksheets-ink and concept-statuses: present (run 9) and absent (runs 7, 8, 12c).

## Needs a core change (for a separate core proposal)

- PK's Extra practice (`EXTRAS`, questions outside `QUESTIONS`): the core's `byId` and quiz runner
  read only `QUESTIONS`.
- The module page kept through a reload: the core keeps no place for the Topics tab.
