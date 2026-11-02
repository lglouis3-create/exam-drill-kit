# Integration check of the 14 port branches (2026-11-02), agent-run

Every result below is **agent-run** (this session, Chromium only, simulated pointer and keyboard
input). Nothing here is coordinator-verified. The integration branch is evidence: it is never merged
and has no pull request. No port branch, course repository or pull request was changed.

## 1. What was merged

| | branch / commit |
|---|---|
| Run 2 (final) integration branch | `integration/ports-2026-11-02` = `fa99b5cf0ef40798e81e7813d4259fc7da807607` |
| its base | origin/main `98e7b5b` (after #12); core tree `c9fde5b23f43746ff8d392314f86e8ff313c1cda`, template tree `cbac5bd425d480944293f8e1fb5d5d703e8baba1` |
| Run 1 integration branch (kept) | `integration/ports-2026-11-02-run1` = `a1051e2550f2be2dc9b620c1b8d8e915c524e6f7`, on origin/main `ac5c644` (core tree `daac6e2`, template `cbac5bd`) |

Merged in the coordinator's order (full shas in `merged-shas-at-fetch.txt` (run 1) and `merged-shas-run2.txt` (run 2)):

| # | branch | run 1 sha | run 2 sha |
|---|---|---|---|
| 1 | port/plan-the-problem | 8c1d9b1 | 1226635 |
| 2 | port/glossary-tap | 561df52 | 1722e65 |
| 3 | port/pair-up-drills | e66f2a3 | 5a4be8d |
| 4 | port/short-answer-graphs | 0145b5a | e0b174f |
| 5 | port/study-controls | c81a735 | d15ebd9 |
| 6 | port/worksheets-ink | fa4a532 | d6e77b5 |
| 7 | port/terms-variables | 436576b | 15c69ac |
| 8 | port/concept-statuses | 61eb52f | 46e3156 |
| 9 | port/theme | 44fd22a | f960514 |
| 10 | port/paper-picker | aa843ef | c1709f5 |
| 11 | port/quiz-prep-cards | 644a155 | f12acae |
| 12 | port/module-pages | c9492c8 | 428d109 |
| 13 | port/stopwatch | 591426f | 304c6b1 |
| 14 | port/notes | 9757062 | 65085d6 |

worksheets-ink and glossary-tap were still being hardened when run 2 was merged; a later rerun is expected.

**Conflicts.** In both runs the only conflicts were in `CHANGELOG.md`, `FEATURES.md`,
`features/README.md` and `review/port-queue.md` (logs: `logs/merge-run2.log`, `logs/merge2-*.log`).
They were resolved by `scripts/union_resolve.py` (both sides' lines kept, ours first; a heading line
present on both sides kept once) and, for `review/port-queue.md`, by `scripts/queue_resolve.py`
(each row matched by its item number; a side's change of a row from `pending` kept; no row was changed
differently by both sides). **No conflict in any other file.** `git diff origin/main` on `core/` and
`template/` is empty for the integration branch.

## 2. The courses and the data each used

All courses: `/tmp/port-tools/mkcourse.sh` from the integration branch, the template's own 7 sample
questions, modules switched on by each module's `ci/oncourse.js` where it has one (module-pages,
notes, stopwatch, study-controls, glossary-tap, worksheets-ink at run 2), otherwise by
`scripts/on_generic.js` (one `COURSE.features` line at the module.json version). Course data for modules
without a ci script: `scripts/int_data.js`, rows taken verbatim from that module's own test fixture
(`scripts/fx.js` reads the `const X = ...;` line), ids prefixed `ic-`:

| data | from | adaptation |
|---|---|---|
| TERMS | glossary-tap ci (`terms_gtap.js`, IP 929cd62) at run 2; glossary-tap `FIX.terms` at run 1 | none |
| SOURCES, CHAINS, 33 questions, 3 topics | worksheets-ink ci (`q90_wsc_fixture.js`, `wsc_data.js`, PK ac2eb73) at run 2; run 1: one PK document with items emptied | run 2 "fixed" courses: setup lines naming missing equations left out (fix below) |
| PAIR_SETS | pair-up-drills `IP.pairSets[0]` (IP 929cd62) | none |
| SHORT_ANSWERS | short-answer-graphs `IP.sa[0..1]` (IP 929cd62) | none |
| EQUATIONS + s2-3 setup | `/tmp/port-tools/example_oncourse_plan.js` (equation-drill fixture, ids `eqc-`) | as the coordinator's example |
| COURSE.quizzes | quiz-prep-cards `PK[0]` (PK ac2eb73) | `modules [9,8]` → `topics ['topic1','topic2']` (the template's questions have no module); `when` → 2026-12-01T08:00 so the card shows |
| 3 exams, 10 lectures, 18 questions (course `sc-pp3` only) | paper-picker `PK` (PK ac2eb73), written as its test's fixtureFiles | prefix `icpp-` |

Each module's test also adds its own verbatim fixture in its own scratch copy. Courses:
`all` / `all2` (run 1, all 18 modules), `all3` (run 2, all 18, as merged), `all4`, `all5` (run 2, all 18,
with the fixes below from `/tmp/port-integration/kitfix`), `keys` (study-controls, worksheets-ink,
notes, short-answer-graphs, terms-variables, quiz-prep-cards, glossary-tap; exams typed), `ws-ch`, `ws`,
`gt-fit`, `gt`, `sc-pp`, `sc-pp3`, `sc`, `pp`, `nt-sc`, `nt`, `theme`.

Per the coordinator's note (HARDEN 9a2), course data that breaks the core checks' rules is not a
module fault; it is listed as a data finding.

## 3. Results (agent-run)

Every command, its directory, exit code and log: `logs/COMMANDS.tsv` (one line per run; logs under
`logs/`; each `run_checks.sh` run's per-check logs in `logs/run1-all`, `run2-all2`, `run3-all3`,
`run4-all4`, `run5-all5`).

### Combinations, partner present and absent (run 2 shas)

| combination | course | module test | result as merged | with fixes |
|---|---|---|---|---|
| worksheets-ink + chained-problem-sets | ws-ch | worksheets-ink test | FAIL 1 of 161 | PASS 161 |
| | ws-ch | chained-problem-sets test | PASS 16 (1 skipped) | — |
| | ws-ch | `scripts/ws_chain_test.js` (Practice in the drill on a whole set; Write on it with sets; stroke kept) | PASS 6 | — |
| worksheets-ink, partner absent | ws | worksheets-ink test | FAIL 1 of 157 | PASS 157 |
| | ws | `ws_chain_test.js` | PASS 6 | — |
| glossary-tap + formulas-in-text | gt-fit | glossary-tap test (its formulas part: fractions stack, subscripts set, terms in a numerator are buttons, no raw `{{frac:`) | PASS 93 | PASS 93 |
| | gt-fit | formulas-in-text test | PASS 11 (1 skipped) | — |
| glossary-tap, partner absent | gt | glossary-tap test | PASS 56 (1 skipped: the formulas part) | — |
| study-controls + paper-picker (1 exam) | sc-pp | study-controls / paper-picker | PASS 59 (earlier-exam part skipped: one exam) / FAIL 2 of 40 | — / PASS 40 |
| study-controls + paper-picker (3 PK exams) | sc-pp3 | study-controls / paper-picker | FAIL 3 of 61 / FAIL 2 of 50 | PASS 60 / PASS 50 |
| partners absent | sc / pp | study-controls / paper-picker | PASS 59 / PASS 40 | — |
| notes + study-controls | nt-sc | notes / study-controls | PASS 96 / PASS 59 | — |
| notes, partner absent | nt | notes | PASS 86 | — |
| theme alone | theme | theme test | PASS 23 | — |
| theme + every module | all5 | `scripts/contrast_test.js` (theme test's own LOW measure; device dark and Dark picked; 94 and 103 views: every tab, each tab's first buttons, quiz card flagged/note/answered/glossary tap, calculation with stopwatch, Scratch paper, wrong number, one-page quiz and note, exam start, paper, flag, result, module pages, Weak spots) | PASS 6 (0 low-contrast items; control line found) | — |
| | all5 | theme test | PASS 23 | — |
| keyboard shortcuts (keys on) | keys | `scripts/keys_test.js` | run 1 (c81a735): FAIL 4 of 20; run 2 (d15ebd9): PASS 21 | — |
| | all5 | `keys_test.js` | PASS 18 (1 skipped: no calculation drawn on a paper) | — |
| everything on (18 modules) | all3 | `run_checks.sh` | build FAIL (plan-the-problem refuses worksheets-ink's ci data); 44 NOT RUN | — |
| | all5 | `run_checks.sh` + every module test | — | 37 PASS, 6 FAIL, 1 NOT RUN (cite_check: no PDFs), 1 REPORT (explain_check) |

Run 1 everything-on (`a1051e2`, course `all2`): 37 PASS, 3 FAIL, 4 NOT RUN, 1 REPORT.

In `all5` the 6 FAILs are: core `test.js`, `output_test.js`, `checks_test.js`, `browser_test.js`
(data finding D1 below), glossary-tap (a slip in the first fix, corrected: rerun PASS 93,
`logs/fix-all5-glossary-tap-after.log`), module-pages (fault F6, not fixed). `home_test.js` passed (33);
the known intermittent `home_test.js` fault was not seen.

### Keyboard shortcuts (keys_test.js), each case

| case | run 1 c81a735 | run 2 d15ebd9 |
|---|---|---|
| control: key 1 picks option A on a plain card | ok | ok |
| quiz Scratch paper, pen down: no shortcut acts behind | FAIL (Enter clicked Check) | ok |
| quiz Scratch paper open, pen up | FAIL (answer typed into the hidden box, checked) | ok |
| paper Scratch paper, pen down | FAIL (ArrowLeft moved the paper 3 → 2) | ok |
| paper Scratch paper open, pen up | FAIL | ok |
| Worksheets tab Write on it, pen down | skipped (no document with items) | ok |
| typing a note | ok | ok |
| typing a short answer | ok | ok |
| typing in the glossary search | ok | ok |
| Terms tab, Topics with the quiz-prep card | ok | ok |
| confirm open: Clear flags, Delete note, Clear page | ok | ok |
| Import file picker (simulated: Playwright intercepts the chooser) | ok | ok |
| no `<dialog>` element is used by any module; the one dialog is worksheets-ink's `#ink` (role="dialog") | — | — |

## 4. Faults

| # | module | file:line (run-2 sha) | cause | fix |
|---|---|---|---|---|
| F1 | study-controls | `study-controls.js` onKey (c81a735) | shortcuts acted on the quiz/paper behind worksheets-ink's Scratch paper, pen down or up | **already fixed on the branch** by 8622653 / d15ebd9 (MODAL check, pointer tracking); logs `fixes/study-controls/keys-at-*.log` |
| F2 | study-controls | `test.js` 306, 399, 412 (d15ebd9) | test assumes a paper under 100 minutes (`/^\d\d:\d\d$/`, PK's 120-minute paper shows 119:59) and string exam ids (`drawn === other`; PK's ids are numbers) | `fixes/study-controls.patch` |
| F3 | paper-picker | `test.js` 150, 186 (c1709f5) | selector `.chip[aria-pressed="true"]` also matches study-controls' layout chips on the Exam view | `fixes/paper-picker.patch` |
| F4 | glossary-tap | `test.js` 184 and 463 (1722e65) | expects Glossary directly before Settings and the page's module list to be exactly its own | `fixes/glossary-tap.patch` |
| F5 | worksheets-ink | `ci/oncourse.js` (d6e77b5) | writes PK questions with `setup` lines naming equations the course lacks: with plan-the-problem on, the course does not build | `fixes/worksheets-ink.patch` (setup left out when its equation is not in EQUATIONS) |
| F5b | worksheets-ink, terms-variables, concept-statuses | test.js courseLine (d6e77b5 / 15c69ac / 46e3156) | same `setup` lines in each test's fixture: with plan-the-problem on, the test is NOT RUN | in the same patches: plan-the-problem switched off in their scratch copies (as terms-variables already does for glossary-tap) |
| F5c | worksheets-ink | `test.js` 170 (d6e77b5) | counts every "(changed numbers)" set in CHAINS, the course's own too | `fixes/worksheets-ink.patch` |
| F5d | terms-variables | `test.js` 159 (15c69ac) | counts stem questions made from the course's own `asks` questions (120 vs 108) | `fixes/terms-variables.patch` |
| F6 | module-pages | `test.js` 151-267 (428d109) | assumes the course has no Module 2 questions, documents or sets of its own; with worksheets-ink's PK Module 2 data on, 6 checks fail (counts 35 vs 12, 3 documents, sets listed under a closed "In parts") | partial: `fixes/module-pages.patch` (Homework row found by its id; the closed list opened). **Not fully fixed**: needs the fixture moved to a module number the course does not use (many lines); for the porter |
| D1 | worksheets-ink ci data | `q90_wsc_fixture.js` | questions written as JSON with `QUESTIONS.push` (HARDEN 9a2 item 1) and without worked steps: core `test.js` (18 "numeric item needs worked steps"), `browser_test.js` (40 of 7 in the sources), `checks_test.js`, `output_test.js` fail on any course with it (also on `ws` alone: `logs/ws__core-test.js.log`) | data finding, not a module fault; not patched (no data invented) |

Every patch's base file is the same blob as on its port branch head (`scripts/checkbase.sh`). Each
`fixes/<module>/` folder holds the failing (`*-before.log`) and passing (`*-after.log`) runs.
module-pages' after-log still FAILs (F6).

Observation, no fault: module-pages' card counts only documents with questions in the drill
("1 document") while its page lists every document of the module, with "No questions from this
document are in the drill yet" (seen at run 1 with a document with no items).

## 5. NOT RUN

- Real Safari (WebKit), an iPad and an Apple Pencil: NOT RUN. Not installed in the container; all pen
  and touch input above is simulated (Playwright mouse, synthetic PointerEvents) in Chromium.
- Native confirm and the file picker: Playwright answers the confirm itself and intercepts the
  chooser; keys pressed then are delivered by Playwright, not by a person with the real dialog open.
- `cite_check.py`: NOT RUN (no lecture PDFs) in every course.
- No-module template course and Medicinal-chemistry on core `c9fde5b`: NOT RUN by this session; the
  coordinator's `evidence/baseline` is for core `daac6e2`, so it applies to run 1 only.
- A paper Scratch paper case in `all5`: skipped (no calculation drawn in 25 papers); run in `keys`.
- module-pages test with all fixes in `all5`: FAIL (F6).

## 6. Screenshots

`shots/contrast-all5/` (197 PNG, 64 colours: both dark modes, one per view, with `*-views.json`
listing each view, its low-contrast count and file), `shots/contrast-all/*.json` (run 1),
`shots/keys-before/` and `shots/keys-after/` (Scratch paper with the pen down), `shots/ws-chain/`.
