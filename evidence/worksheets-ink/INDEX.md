# Evidence: worksheets-ink (port queue item 2, kit PR #17)

All results here are **agent-run** (the hardening agent, 2026-11-02 evening). The coordinator adds its own
re-runs, labelled coordinator-verified, under `coordinator/`.

## Inputs

| What | Value |
|---|---|
| Source read | Basic-Pharmacokinetics `ac2eb73` (`/tmp/pk-readonly`, read only): `src/views.js` 5122-5434, 6040-6322, 970-981, 213-219; `src/ink_test.py`; `src/sources.js`, the q files of `build.py` DATA_FILES, `src/course.js` |
| Port branch at start | `fa4a532` |
| Final tested commit | `8265f5c114a80dba22cbdbc5268a9d9d8f8c81e0` (port/worksheets-ink) |
| Commits added | `d6e77b5` (fix + tests + ci script), `9f0256b` (merge of origin/main `98e7b5b`), `563eb03` (real-data fixture and course), `b4b347e` (lectures as literals), `8265f5c` (setup lines, plan-the-problem off in the test's copies) |
| origin/main | `98e7b5b9d42d1bc81b84ab6a06eadf554035ecba` (merged in) |
| core tree / template tree at 8265f5c | `c9fde5b23f43746ff8d392314f86e8ff313c1cda` / `cbac5bd425d480944293f8e1fb5d5d703e8baba1` |
| Baseline cited | `evidence/baseline` `22b4290`, folder `main-98e7b5b/` (core `c9fde5b`, template `cbac5bd`, the same trees): no-module template course 24 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; Medicinal-chemistry `f1f5ee5` 23 PASS, 0 FAIL, 2 NOT RUN, 1 REPORT. Not rerun here. Known fault, not this port's: on main, `home_test.js` fails 1 of 33 checks intermittently on Medicinal-chemistry (coordinator-verified); it passed in the cited run |
| Node / Python / browser | v22.23.4 / 3.13 / Chromium (Playwright global); WebKit NOT RUN here |

## Files

- `behaviour-map.md`: the behaviour map (source line, kit, ported / adapted / omitted).
- `mutation-table.md`: the final mutation table (27 of 27 caught), from `mutations-final/a|b/mutations.json`
  and one log per mutation. `mutations/` holds the earlier rounds: the first round (on the test before the
  plan, text and spoken-only checks) left `plan-order`, `plan-changed`, `plan-dup`, `solved-spoken` and
  `exam-clear` not caught (`logs/05-mutations-run1-stopped.log`, `logs/05-mutations-a.log`, `-b.log`); checks
  were added and the two last were rerun (`mutations/c`, `logs/05-mutations-c-rerun.log`, both caught).
- `persistence.md`: the persistence results.
- `scripts/`: `mutations.py` (exact replaces, each must match once; never applied to the port branch),
  `mut_table.py`, `pk_fixture.js` (the fixture read from PK, and PK's own sheetPlan/solvedBy as EXPECT),
  `pk_expect.js` (PK's dropCarry, sharedLead and wsOrder as PK_TEXT), `put_fixture.py`, `pk_scan.js` (which PK
  documents meet the core's checks), `pk_names.js` (which name the professor in their text),
  `missed_debug.js`, `compare_off.py`, `oncourse_data.js` (the template-sample course used before rule 4; no
  longer the module's course), `test_add.js` (the first draft of the added checks), `fixture.json`.
- `logs/`: every log named below. No screenshots were taken.

## Commands and exit codes (agent-run)

| # | Command (course) | Exit | Result | Log |
|---|---|---|---|---|
| 00 | module test, start `fa4a532`, template-sample course | 0 | 114 PASS | `logs/00-module-test-start-fa4a532.log` |
| 01 | first draft of new test on the unfixed module | 1 | 19 of 152 FAIL (see persistence.md) | `logs/01-new-test-on-old-module.log` |
| 02 | new test on the fixed module | 0 | 152 PASS | `logs/02-new-test-on-fixed-module.log` |
| 05 | mutations, earlier rounds | 0 | see Files | `logs/05-*` |
| 30 | `run_checks.sh`, course from the first ci script (`d6e77b5`) | 1 | 21 PASS, 5 FAIL (core test.js 18 failures: numeric items with one worked step, dupOf to missing questions, cites with no deck; browser_test bank count; checks_test, output_test; the module test counted the course's own sets) | `logs/30-ci-run_checks-first.log` |
| 34 | `run_checks.sh`, interim real-data course | 1 | 25 PASS, 1 FAIL (browser_test: a numeric question with a slide picture) | `logs/34-real-run_checks.log` |
| 42 | module test ×3, module course at `563eb03` | 0,0,0 | 157 PASS each | `logs/42-*` |
| 43 | `run_checks.sh`, module course at `563eb03` | 0 | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT | `logs/43-*` |
| 46 | module test, chained-problem-sets on, at `563eb03` | 0 | 161 PASS | `logs/46-chained-module-test.log` |
| 47 | `mutations.py`, final, module code of `563eb03` (unchanged since) | 0 | 27 of 27 caught | `logs/47-*`, `mutations-final/` |
| 52 | no-module template course, port vs origin/main (`compare_off.py`) | 0 | index.html, sw.js, version.json, manifest.json the same, build stamp masked | `logs/52-off-compare.log` |
| 54 | module test on the module course with the module switched off | 1 | 1 of 1 FAIL ("the page carries worksheets-ink, working") | `logs/54-absent-module-test.log` |
| 63 | `state_check.js`, ci data committed after the course's first commit, then in the same commit | 1, 0 | FAIL then PASS: lectures added after CLAUDE.md's commit read as a stale state file; one commit passes | `logs/63-ci-v3-state_check.log` |
| 70 | `node features/worksheets-ink/ci/oncourse.js <kit> <src>` at `8265f5c` | 0 | 4 documents, 19 questions, 6 problem sets, 4 topics, 5 skills, 4 lectures; 19 setup lines left out | `logs/70-final-ci-oncourse.log` |
| 71 | `python3 build.py` (module course) | 0 | built | `logs/71-final-build.log` |
| 72 | module test ×3 (module course) at `8265f5c` | 0,0,0 | 157 PASS each (2 skipped: chained-problem-sets on, not in this course; Apple Pencil/iPad/Safari) | `logs/72-*` |
| 73 | `run_checks.sh` (module course) at `8265f5c` | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no PDFs), 1 REPORT (`explain_check.js`, 5 of 26) | `logs/73-*` |
| 74 | module test, chained-problem-sets on, final files | 0 | 161 PASS (1 skipped: Apple Pencil/iPad/Safari) | `logs/74-final-chained-module-test.log` |
| — | GitHub "Kit checks" workflow on `8265f5c` (run 41518761552) | — | completed, success | — |
| — | Medicinal-chemistry `run_checks.sh` (full clone `f1f5ee5` prepared at `/tmp/port-worksheets-ink/mc`) | — | NOT RUN here: cited from the baseline, the trees match | — |
| — | Apple Pencil, iPad, Safari / WebKit | — | NOT RUN: Chromium only in this container | — |

## The module's own course (rule 4)

Built by `ci/oncourse.js` from the test's fixture: 4 Pharmacokinetics documents verbatim (`ex-m6a`, `ic-m7`,
`ic-m7b`, `ex-m8`), with their 19 questions, 6 problem sets, 4 topics, 5 skills and 4 lectures. The changes to
the data: `prof` is the course's own ("Professor"); the 19 `setup` lines (plan-the-problem's, naming equations
the template course does not have) are left out. Why only these 4 of the fixture's 8: the core's checks reject
the others' questions as Pharmacokinetics wrote them (pk_scan.js, pk_names.js): Homework 2's numeric items have
one worked step (the core asks for two) and cite `Homework-2.pdf`, which is no lecture deck; Quiz 1 and the
daily practice sheets have questions whose cites name no lecture deck, and the daily practice sheets' dupOf
questions name the professor in their text; Quiz 3 and the worked examples of Module 6 carry slide pictures the template has no image for; Quiz 5 and
the worked examples of Module 3 carry dupOf pairs, and core test.js section 7 then picks a dupOf pair as its
"concept with two questions" and fails. No worked step, cite or picture was written for the test. No real stem
trips style_check's "given as" (style_check PASS).
