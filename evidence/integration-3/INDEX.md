# Integration check of the 14 port branches, run 3 (2026-11-03), agent-run

Every result here is **agent-run**: run by this session in Chromium, with simulated pointer and keyboard
input. Nothing here has been verified by the coordinator. The integration branch is evidence only: it is
never merged and has no pull request. No port branch, course repository or pull request was changed.
The run was cut off by a container restart and then resumed. Rows marked "before the restart" are
read from the logs that survived; they were not rerun.

## 1. What was merged

| | |
|---|---|
| integration branch | `integration/ports-2026-11-03` = `9acfe9d8f82792053fb6bbc62157642a24d84864` (pushed; never merged) |
| base | origin/main `6432c36709ad3dc3ab78d8558239971b18234aec` |
| checked after the restart | first-parent chain from 6432c36: 14 merge commits; their second parents are exactly the 14 shas in `logs/merged-shas.txt`; every `origin/port/*` branch still points at the sha listed there |

Order: plan-the-problem 4c09914, glossary-tap 3190f57, pair-up-drills 5098a48, short-answer-graphs 800b229,
study-controls 1c1d590, worksheets-ink 206834f, terms-variables 8641b3f, concept-statuses 6d89a5e, theme
c85f386, paper-picker a3eb5c3, quiz-prep-cards 5918202, module-pages c8fb645, stopwatch b5a419b, notes
998137e. Merge logs: `logs/merge-*.log`.

## 2. Method

- Each course is `core/ci_course.sh <kind> chromium`, run from the integration worktree (`scripts/ci.sh`,
  and after the restart `scripts/ci_k.sh`, which is the same with the kit taken from `$KIT`). Each module is
  switched on by its own `features/<m>/ci/oncourse.js` and then `run_checks.sh` runs. One command line per
  finished run is in `logs/COMMANDS.tsv`. Output is in `logs/ci-<course>.log`, and the per-check logs are in
  `logs/checks-<course>/` (copied there by `scripts/summary.sh`).
- 1-exam course: `scripts/ci_1exam.sh` builds the course as ci_course.sh builds
  `modules:study-controls,paper-picker`, then keeps only the active exam (`COURSE.exams` filtered to
  `COURSE.activeExam`; no data added).
- Keyboard checks: `scripts/keys_test.js` runs on the built course. A shortcut "fires" when the quiz or
  paper behind it changes. Each case has a control first (key 1 picks option A on a plain card).
- Contrast: `scripts/contrast_test.js` applies the theme test's own LOW measure (read verbatim from
  `features/theme/test.js`) to every tab, each tab's first buttons and the module views. It runs with the
  device set to dark and with Dark picked on a light device, takes one screenshot per view, and starts with a
  control that plants a #333-on-#222 line.
- `home_test.js`: run once per course. Any failure counts as FAIL and nothing was rerun. It passed in every
  course (36 checks each).
- **Patched** (the everything-on course only): the unpatched kit stops before any check. The ci scripts were
  patched in a scratch clone of the integration branch (`/tmp/port-integration-3/kitpatch`, HEAD 9acfe9d plus
  the patch). The whole patch is `patches/all-patched-kit.patch`; there is also one file per script. Only
  `features/*/ci/oncourse.js` files are changed. No module code, test or core file is changed. Each patched
  file's base blob is the same blob as on its port branch head.

## 3. Results

| course (modules on) | when | result | log |
|---|---|---|---|
| ws (worksheets-ink) | before the restart | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; worksheets-ink test PASS 157 | `logs/ci-ws.log` |
| ws-ch (worksheets-ink, chained-problem-sets) | before the restart | 27 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT | `logs/ci-ws-ch.log` |
| ch (chained-problem-sets) | before the restart | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; test PASS 16 | `logs/ci-ch.log` |
| gt (glossary-tap) | before the restart | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; test PASS 56 | `logs/ci-gt.log` |
| gt-fit (glossary-tap, formulas-in-text) | before the restart | 27 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT | `logs/ci-gt-fit.log` |
| fit (formulas-in-text) | before the restart | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; test PASS 11 | `logs/ci-fit.log` |
| sc (study-controls) | before the restart | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; test PASS 59 | `logs/ci-sc.log` |
| sc-pp3 (study-controls, paper-picker, 3 exams) | before the restart | 27 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; paper-picker test PASS 74 | `logs/ci-sc-pp3.log` |
| pp3 (paper-picker) | rerun after the restart | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT | `logs/ci-pp3.log` |
| sc-pp1 (study-controls, paper-picker, 1 exam) | after | **26 PASS, 1 FAIL**, 1 NOT RUN, 1 REPORT: paper-picker test FAIL 1 of 23 (fault P1); study-controls PASS 59 (1 skipped: no earlier exam to draw) | `logs/ci-sc-pp1.log` |
| nt-sc (notes, study-controls) | after | 27 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT | `logs/ci-nt-sc.log` |
| nt (notes) | after | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT | `logs/ci-nt.log` |
| keys (study-controls, worksheets-ink, notes) | after | 28 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT | `logs/ci-keys.log` |
| keyboard checks on keys | after | PASS 12 (1 skipped: paper Scratch paper, no paper with a calculation could be drawn) | `logs/keys-keys.log` |
| all (all 18), unpatched | before the restart | stopped before any check: module-pages ci/oncourse.js refused (fault C1) | `logs/ci-all.log` line 20 |
| **all-patched** (all 18) | after, **patched** | build PASS (1.79 MB); **34 PASS, 8 FAIL, 2 NOT RUN**, 1 REPORT; exit 1 | `logs/ci-all-patched.log` |
| keyboard checks on all-patched | after, patched | PASS 18 (1 skipped: paper Scratch paper, as above) | `logs/keys-all-patched.log` |
| contrast sweep on all-patched | after, patched | PASS 6: 0 low-contrast items in 112 views with the device dark and 112 with Dark picked; the control was found; no page or module error | `logs/contrast-all-patched.log`, `shots/contrast-all-patched/` |

The NOT RUN on every course is `cite_check.py` ("no lecture PDFs found"), which is a documented exclusion.
The REPORT is `explain_check.js`.

all-patched, the failing and not-run checks: core `test.js` (26 failures, all "duplicate question id",
fault D1); `output_test.js` 1 of 16 and `checks_test.js` 5 of 32 (both because test.js fails on this
course); `browser_test.js` 2 of 99 ("the sweep repeats nothing": 26 repeats; "covers every question": 338
of 364 distinct; D1); paper-picker test 1 of 23 (P1); plan-the-problem test 2 of 53 (P2); quiz-prep-cards
test 2 of 54 (its Quiz 4 pass holds m7-c03 and cq4-10 twice; D1); theme test 1 of 41 (T1); notes test
NOT RUN (N1), which is not a documented exclusion. The 26 other module and core checks passed, including
`home_test.js` 36, module-pages 42, glossary-tap 93, worksheets-ink 161 and study-controls 59.

Keyboard checks, each case (both courses): pen down and pen up on quiz Scratch paper, "Write on it" from the
Worksheets tab with the pen down, typing in a note, keys while the Clear flags, Delete note and Clear page
confirms are open, and the Import file picker (simulated: Playwright intercepts the chooser). On
all-patched, the short-answer, glossary search, Terms tab and quiz-prep card cases also ran. No shortcut
fired in any of them.

## 4. Faults (branch, file)

| # | branch | file (line at branch head) | what happens |
|---|---|---|---|
| C1 | port/glossary-tap (3190f57) | `features/glossary-tap/ci/oncourse.js` 65 | `COURSE.skills = [...]` **replaces** the course's skills instead of adding to them. That drops the template's `read` (and concept-statuses' `infusion`). Module-pages' questions use `read`, so module-pages' script (line 97-98) correctly refuses: "the questions use skills neither the course nor the fixture has: read". **Module-pages is not at fault here**: it reads the course as it stands, and keeps the skills the course declares and the ones other scripts added. Patched: add only the ids not already present. |
| C2 | port/module-pages (c8fb645) | `features/module-pages/ci/oncourse.js` 118 (also 93-99, 119) | refuses a course that already has a module 2 (glossary-tap's Intro to Pharmacology lecture L10 is module 2), although its own `test.js` (line 125, `FM = free(92)`) moves the fixture to a free module number. Patched: do the same as test.js. |
| C3 | main 6432c36 (chained-problem-sets, already on main) / port/concept-statuses (6d89a5e) / port/study-controls (1c1d590) | `features/chained-problem-sets/ci/oncourse.js` 88; `features/concept-statuses/current/test.js` 90 (WRITE, used by its ci script); `features/study-controls/current/test.js` 113 | each takes lecture id L91 (and L92) without checking that the id is free. The everything-on course holds **two lectures with id L91** (not patched; no check caught it). `features/plan-the-problem/ci/oncourse.js` 116-118 (port/plan-the-problem 4c09914) then refuses "already has a lecture id from L91 on". Patched (plan-the-problem only): the first run of free ids from L91. |
| C4 | port/quiz-prep-cards (5918202) | `features/quiz-prep-cards/ci/oncourse.js` 58-60 | refuses because its lecture ids L10-L12 are taken: L10 by glossary-tap's data, and L11 and L12 by notes' data (`features/notes/current/test.js` 64; port/notes 998137e writes them unprefixed). Patched: prefix them `qpc-` on a clash, along with each question's `lecture`. |
| C5 | port/concept-statuses, port/notes, port/quiz-prep-cards, port/stopwatch (b5a419b) | `features/concept-statuses/ci/oncourse.js` (known limit, lines 23-26); notes, quiz-prep-cards ci data; `features/stopwatch/current/test_fixture.js` | questions are written with plan-the-problem `setup` lines naming equations no module provides (css, cp-infusing, pd-teff-ln, nl-rate, nl-km, cmax-ss, cp-after-stop, ...). With plan-the-problem on, the course does not build. worksheets-ink's script already leaves such lines out (its line 82-86). Patched: the same in the four scripts. |
| D1 | port/paper-picker (a3eb5c3) with port/notes, port/quiz-prep-cards, port/concept-statuses | the ci data files `q90_paper_picker_pk.js`, `q90_notes_fixture.js`, `q90_qpc_pk.js`, `q90_cst_fixture.js` | the scripts write the same Basic-Pharmacokinetics questions with **unprefixed ids** (cq4-*, cq5-*, pd-c*, nl-c*, m6b-c*, m7-c*, inf-c11), so 26 ids appear twice. Core `test.js` fails and so does everything that depends on it (output_test, checks_test, browser_test sweep, quiz-prep-cards' Quiz 4 pass). Not patched. Stopwatch (`sw-`), module-pages (`mpc-`), plan-the-problem and worksheets-ink use prefixes and are not involved. |
| P1 | port/paper-picker (a3eb5c3) | `features/paper-picker/current/test.js` 175-182 | when the course holds all 118 fixture questions but not exactly its 3 exams (a 1-exam course; the everything-on course), the test uses neither the course's copy nor a new one. It records 1 FAIL and stops at 22 checks, so its Chromium part never runs. The 1-exam course was made by filtering the fixture's own exams. |
| P2 | port/plan-the-problem (4c09914) | `features/plan-the-problem/current/test.js` about 290-300 | its scratch copies with ASKS (or ASKS and PLAN) removed do not build when terms-variables is on: terms-variables' build step refuses because its `families` option names ASKS keys. The test should switch terms-variables off in those copies. |
| N1 | port/notes (998137e) | `features/notes/current/test.js` 168 | NOT RUN: its scratch copy adds a test question whose `setup` names equations the course lacks (pd-teff-ln, ...). With plan-the-problem on, that copy does not build (the same issue as C5, in the test). |
| T1 | port/theme (c85f386) | `features/theme/current/theme.js` 39 (`apply(current())` at script time) | on the 1.79 MB everything-on page, a stored Dark is not on `<html>` in the first frame that shows the tabs. The probe (`scripts/theme_probe.js`, `logs/theme-probe-all-patched.log`) shows `#nav` already holding its buttons while `document.readyState` is `loading` and before any script ran. The nav buttons are static markup, and theme's attribute is set only when its script, near the end of the page, runs. On a small page the first frame comes after that script; on a large one it does not, so the light page shows first. Likely needs the attribute set by a script in `<head>`. |

Not a fault, observed: glossary-tap's `test.js` fixture (`FIXCOURSE.lectures` and questions) still carries
the real professor's surname in `prof`. Its ci script replaces it with "Professor", so no course gets it.
This bears on open question 8 (personal names). The name is not written here.

## 5. NOT RUN and skipped

- `cite_check.py` on every course (no lecture PDFs; a documented exclusion).
- notes `test.js` on all-patched (N1).
- paper-picker test's Chromium part on sc-pp1 and all-patched (P1: it stops after 22 checks).
- Keyboard case "paper Scratch paper" on both keys runs: no paper with a calculation could be drawn
  (`{"k":-1}`). In this run the keys were not checked over a paper's Scratch paper.
- The everything-on course **unpatched**: no checks could run (C1, then C2-C5 found in build-only dry runs).
  Every everything-on result above is **patched**.
- WebKit/Safari: not run (Chromium only). Apple Pencil, iPad and Safari: skipped by the worksheets-ink test.
- The contrast sweep did not reach some views (listed in its log under "views not reached": All changes,
  the equation module filters, pair-up items, among others), because their buttons were not found again
  after a redraw.
- The pp3 run from before the restart: its partial log was overwritten when it was rerun. It had no result
  line, and its last lines were draw_test 9 PASS, browser_test 104 PASS and storage_test 24 PASS.

## 6. Files

`logs/` (COMMANDS.tsv, run_all.out, run_resume.out, ci-*.log, keys-*.log, contrast-*.log, summary.out,
checks-<course>/, merge-*.log, merged-shas.txt, theme-probe-all-patched.log), `scripts/`, `patches/`,
`shots/` (keys-keys, keys-all-patched, contrast-all-patched with `*-views.json`).
