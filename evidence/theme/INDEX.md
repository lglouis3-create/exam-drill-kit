# Evidence: theme (port queue item 5), hardening of 2026-11-02/03

Every result here is **agent-run** (Chromium, this cloud container) unless it says GitHub.
The coordinator adds its own re-runs, labelled coordinator-verified, in `coordinator/`.

## Inputs

| What | Value |
|---|---|
| Source read | Basic-Pharmacokinetics `ac2eb73` (`/tmp/pk-readonly`, read-only): `src/views.js` 6323-6334, `src/shell.html` 979-1042 and 1442-1454, `src/modcolor_test.py` 61-68, `src/q15_module7b.js` 33-34 and 109-188, `src/course.js` lectures L11 |
| port/theme at start | `2b41393` (merge of origin/main `6432c36`) |
| port/theme final tested commit | `c85f386` (`01af26c`: CI script, fixture and new checks; `c85f386`: the test uses a fixture the course already holds) |
| origin/main | `6432c36` |
| core tree (start and final) | `a2dbf03` (`git diff origin/main -- core template` is empty) |
| template tree (start and final) | `cbac5bd` |
| Modules in the contrast sweep | port branch heads, unpacked with `git archive origin/port/<m> features`: worksheets-ink `206834f`, glossary-tap `3190f57`, module-pages `c8fb645`, paper-picker `a3eb5c3`, study-controls `1c1d590`, pair-up-drills `5098a48`, short-answer-graphs `800b229`, quiz-prep-cards `5918202`, stopwatch `dbdc42a`, notes `f6cc9e6`, terms-variables `8641b3f`, concept-statuses `6d89a5e`, plan-the-problem `4c09914` (these are the heads the coordinator named as final) |
| Contrast sweep script | `scripts/contrast_test.js`, copied unchanged from `evidence/integration` `1329222` (`evidence/integration/scripts/contrast_test.js`) |

**Baseline reuse.** The core tree (`a2dbf03`) and template tree (`cbac5bd`) are exactly those of
`evidence/baseline` folder `main-6432c36/` (commit `f8a22d5`; Medicinal-chemistry `f1f5ee5`, full
clone). The no-module template course and the Medicinal-chemistry run are cited from there and not
rerun: template 24 PASS, 0 FAIL, 1 NOT RUN (cite_check.py), 1 REPORT; Medicinal-chemistry 23 PASS,
0 FAIL, 2 NOT RUN, 1 REPORT, with `home_test.js` 36 checks passed.

## Why the GitHub jobs failed, and the fix

Jobs 125590179521 ("Chromium · module:theme") and 125590179401 ("Chromium · modules:theme,
chained-problem-sets,equation-drill,formulas-in-text,wrong-number-diagnosis") stopped before any
check with `FAIL: features/theme/ci/oncourse.js is missing, so theme cannot be switched on in a
course` (logs: `ci-job-125590179521.log`, `ci-job-125590179401.log`, line 432). The fix is
`features/theme/ci/oncourse.js`: the module reads no course data and has no options, so it writes
no data file and appends one line to `course.js` that switches the module on at its module.json
version. GitHub, on `01af26c` (run 41550299770) and on `c85f386` (run 41551666202,
`ci-jobs-c85f386.tsv`): every job success, including both jobs above.

## The module's own course (real data)

The test (`features/theme/current/test.js`) holds a fixture taken verbatim from PK `ac2eb73`:
questions pd-c01, pd-c02 (select all), pd-c04 and pd-c05 (`src/q15_module7b.js` 109-188), the topic
`pkpd` that file pushes (line 34) and the lecture L11 (`src/course.js`). **The one change to the
data:** `prof` is "Professor" in the topic, the lecture and each question. Questions were picked by
`scripts/pick.js` as multiple-choice items whose text names no person, uses no `{{...}}` formula
markup, has no image and no "given as"; no question was reworded. The test writes them into each
scratch copy as `q90_theme_fixture.js` (one question per line opening `{id:'thm-...'`, `prof:'Professor'`,
`TOPICS.push` after the course's topics, the deck added to `COURSE.lectures`), so the colour,
contrast and quiz-card checks run on these PK pages in every course the test runs in, including the
GitHub courses. `ci/oncourse.js` writes no data (the module reads none). For `run_checks.sh` on a
real-data own course, `scripts/owncourse.js` writes the same fixture into a template course as course
data (`c-own-final2`).

## Commands (all agent-run; `logs/COMMANDS.tsv` lists each with time, directory, exit code, log)

| Command | Exit | Result | Log |
|---|---|---|---|
| module test, first try with the new checks (`c-on`) | 1 | 3 of 37 FAIL: two were faults in the new checks (a `position:fixed` notice has no offsetParent; Import merges answers by second, question, result and mode), fixed in the test | `logs/try1-theme-test.log` |
| module test after those fixes | 0 | 37 passed | `logs/try2-theme-test.log` |
| mutations run 1 (19) | 0 | 17 caught, M05 and C06 not caught | `mutations/mutations.tsv` |
| module test with checks for M05 and C06 added | 0 | 39 passed | `logs/try3-theme-test.log` |
| mutations run 2 (M05, C06) | 0 | M05 caught; C06 not caught | `mutations-run2/` |
| mutations run 3 (C08, a wider C06) | 0 | not caught: the core gives text boxes their own colours | `mutations-run3/` |
| module test with the color-scheme check | 0 | 41 passed | `logs/try4-theme-test.log` |
| mutations run 4 (C06, C08) | 0 | both caught | `mutations-run4/` |
| module absent (theme.js and theme.css emptied) | 1 | FAIL: 2 checks fail, then the test stops (no header control) | `logs/module-absent-theme-test.log` |
| mutations, final (all 20, on the test of `01af26c`) | 0 | 20 of 20 caught (table below) | `mutations-final/` |
| module test x3, `c-final` (template + theme, `01af26c`) | 0, 0, 0 | 41 passed each | `logs/final-theme-test-run{1,2,3}.log` |
| `run_checks.sh`, `c-final` | 0 | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT | `logs/final-run_checks-c-final.log` |
| `run_checks.sh`, own course `c-own-final` (fixture as course data, `01af26c`) | 1 | 25 PASS, **1 FAIL**, 1 NOT RUN, 1 REPORT: the theme test wrote the fixture a second time and the build refused it ("course.js `files` lists ['q90_theme_fixture.js'] more than once"). Fault in the test, fixed in `c85f386` | `logs/final-run_checks-c-own.log` |
| `core/ci_course.sh module:theme chromium` (`01af26c`) | 0 | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT | `logs/final-ci_course-module-theme.log` |
| module test on the own course after the fix | 0 | 41 passed | `logs/fix-own-theme-test.log` |
| module test x3, `c-final2` (template + theme, `c85f386`) | 0, 0, 0 | 41 passed each | `logs/final2-theme-test-run{1,2,3}.log` |
| `run_checks.sh`, `c-final2` | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (cite_check.py: no lecture PDFs), 1 REPORT (explain_check.js); home_test.js 36 passed; browser_test.js 98 passed (5 skipped); features/theme/test.js 41 passed | `logs/final2-run_checks-c-final2.log`, `logs/checks-c-final2/` |
| `run_checks.sh`, own course `c-own-final2` (`c85f386`) | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (cite_check.py), 1 REPORT; home_test.js 36 passed; features/theme/test.js 41 passed | `logs/final2-run_checks-c-own.log`, `logs/checks-c-own/` |
| `core/ci_course.sh module:theme chromium` (`c85f386`) | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (cite_check.py, a documented exclusion), 1 REPORT | `logs/final2-ci_course-module-theme.log`, `logs/checks-ci-module-theme/` |
| CI script test: fresh `mkcourse.sh` course + `ci/oncourse.js` + `build.py` + module test | 0 | the script printed the line it wrote and "no data files"; build exit 0; test 41 passed | `logs/build-c-final2.log`, `logs/final2-theme-test-run1.log` |
| contrast sweep and theme test, 13 courses (`c85f386` + each module) | 0 each | table below | `sweep/`, `logs/sweep-*.log` |

`style_check.js` flagged nothing in the fixture's stems (it passed in `c-own-final2`).

## Behaviour map (from the source code, not the pull request text)

| # | Behaviour in PK `ac2eb73` | File and line | Kit | Notes |
|---|---|---|---|---|
| 1 | The choice is kept per browser under `NS + ':theme'` | views.js 6324 | ported | `<ns>:theme`, read and written through the core's `store` |
| 2 | `applyTheme`: Light or Dark sets `data-theme` on `<html>`; anything else removes it | views.js 6325-6328 | ported | `apply()` |
| 3 | At start-up the stored value (default "system") is applied, before `askProfile()` and before the views draw | views.js 6330-6331, 6334 | ported | applied as the module loads; the test checks the first frame that shows the tabs |
| 4 | The header menu shows the stored value and its change stores and applies the pick | views.js 6332 | adapted | "System" is named "Match device"; Match device removes the stored value instead of storing "system"; a stored value that is not light or dark reads as Match device (PK would apply nothing and put an unknown value in the menu) |
| 5 | Storage that refuses writes keeps the value in memory for the visit | shell.html 1442-1454 (`LS`) | ported | through the core `store`, which also shows the core's notice that the browser did not save |
| 6 | Dark palette for Match device on a dark device, `:root:not([data-theme="light"])` inside `prefers-color-scheme: dark` | shell.html 979-985 | ported | plus dark values for the core's atlas colours `--at-*` and `--wash`, and `color-scheme:dark` |
| 7 | Dark rules for teach blocks, figure boxes, tags, notes, amber buttons, sweep rows, pressed chips, exam header, SVG images, reference figures, form controls, dark text on light buttons | shell.html 986-1003 | ported for the classes the core has | the kit adds `.fgshow`, `.cmpcell`, `.wfig`, `.tag.p3`, `.tag.p4`, `.cite .srcflag`, `textarea`, `#swbar button` |
| 8 | Dark rules for `.meter b`, `.misskind`, `.shortfall`, `.warnbtn`, `.rtab`, `.mtab`, `.stsvg`, `.stepfig`, `#zoom`, `.mrow` | shell.html 991-1003 | omitted | the core has none of these classes (its meter is `.meter i`, coloured by `--ok`, which has a dark value); a module that brings one can add its rule. The student sees no difference today |
| 9 | The same palette and rules for Dark picked, `:root[data-theme="dark"]` | shell.html 1005-1028 | ported | the test checks the two blocks are the same |
| 10 | `:root{--sel:var(--ink)}` for light | shell.html 1029 | omitted | the core uses `--sel` only in the dark rule for pressed chips |
| 11 | Header menu style `header .themesel` | shell.html 1030 | ported | |
| 12 | Header menu markup, aria-label "Colour theme" | shell.html 1039-1041 | adapted | added by the module at start (`X.start`), label "Color theme" |
| 13 | (not in PK) the same choice in Settings, with a line saying where it is kept | — | added | kept in step with the header |
| 14 | Module colours `.m0`-`.m7`, their dark values, and the tinting code | shell.html 755-765, views.js 6335-6383 | omitted | queue's "module colours", Tier 3; the student gets no module colours |
| 15 | Dark badges read at 4.5 : 1 (test) | modcolor_test.py 61-68 | ported | as a contrast check over every tab and quiz cards |

## Mutation table (final run, `mutations-final/`, test of `01af26c`; script `scripts/mutations.py`)

Each mutation is an exact string replacement that must match once, applied to a copy of the course;
nothing was committed. Exit is the module test's exit code; "checks failed" counts FAIL lines.

| Mutation | File | What it breaks | Exit | Checks failed (first one) |
|---|---|---|---|---|
| M01 | theme.js | apply() never sets data-theme | 1 | 18 (first frame shows Dark) |
| M02 | theme.js | a pick is not stored | 1 | 22 (first frame shows Dark) |
| M03 | theme.js | Match device stored as "device" | 1 | 1 (Match device removes the stored choice) |
| M04 | theme.js | any stored value taken as a theme | 1 | 1 (a value not light or dark reads as Match device) |
| M05 | theme.js | the choice also written into the progress | 1 | 2 (the progress holds no theme); not caught in run 1, check added |
| M06 | theme.js | stored choice applied 60 ms after load | 1 | 8 (first frame shows Dark) |
| M07 | theme.js | header menu not kept in step | 1 | 1 (the header follows Settings) |
| M08 | theme.js | Settings choice not wired | 1 | 2 (Light picked in Settings) |
| M09 | theme.js | read from localStorage directly | 1 | the test stops: with storage refused the page does not start (selectOption timeout) |
| M10 | theme.js | no guard for the engine in node | 1 | 1 (loads with no page) |
| M11 | theme.js | no Match device entry | 1 | 4 (Match device on a light device) |
| M12 | theme.js | pick written to localStorage directly | 1 | 4 (storage refused: Dark for the visit) |
| C01 | theme.css | device block on light devices | 1 | 14 (the two dark blocks) |
| C02 | theme.css | dim text #4A5563 in both blocks | 1 | 2 (contrast: Topics "Exam 1: 4 questions…" 2.40 : 1) |
| C03 | theme.css | Light picked does not win on a dark device | 1 | 11 (the two dark blocks) |
| C04 | theme.css | one rule missing from the Dark block | 1 | 1 (the two dark blocks) |
| C05 | theme.css | no dark `--wash` | 1 | 1 (each core colour has a dark value) |
| C06 | theme.css | no `color-scheme:dark` on the page | 1 | 2 (drawn in the browser's dark style); not caught in runs 1-2, check added |
| C08 | theme.css | no `color-scheme:dark` anywhere | 1 | 2 (same); not caught in run 3, check added |
| C07 | theme.css | no dark text on light buttons | 1 | 2 (contrast: "Got it" 2.26 : 1) |

The test change in `c85f386` only affects a course that already holds the fixture file; the mutations
were not rerun on it.

## Persistence (QUALITY C), all automated in the module test, agent-run, 41 checks pass

| Case | Result |
|---|---|
| Export, then Import into a fresh browser | the Export file (made after 30 answers) holds no theme; Import in a fresh browser brings the file's distinct answers (14-16 per run; the core merges answers by second, question, result and mode) and leaves that browser's Light as it was. PASS |
| Profile switch | the choice stays (device setting). PASS |
| Reload soon after a change | 0, 100 and 400 ms after Dark is picked: Dark kept. The choice is written at once, not with the progress 150 ms later, so nothing of the theme is lost below 150 ms. PASS |
| Progress after a pick | in memory and as saved 400 ms after a pick: no theme. PASS |
| Storage denied (setItem throws SecurityError), 25 answers and Light saved | Dark applies for the visit; the core's notice "This browser did not save your progress…" shows; the saved Light and the saved progress are unchanged; with storage working again and a reload, Light and the 25 answers load and a new pick is saved. PASS |
| Storage full (setItem throws QuotaExceededError) | the same. PASS |
| Storage refused entirely (localStorage getter throws) | the page runs and Dark applies for the visit. PASS |

Finding (no fault, no fix): the notice the student sees is the core's, and it speaks of progress, not
of the colour choice. A wording for the colour choice would need a module notice or a core change;
it is listed for the coordinator, not changed.

## Contrast sweep with every new module (Louis's rule: theme with every new module)

One course per module: the template, the module at its port head (and its `needs` from the same
tree), each switched on by its own `ci/oncourse.js` (each writes its own real data;
short-answer-graphs `800b229` has one), then theme from `c85f386`; built. In each: the integration
`contrast_test.js` (the theme test's own LOW measure over every tab, each tab's first buttons, quiz
cards, a calculation, the exam paper and result, module pages, Weak spots; with a planted control
line it must find), dark device and Dark picked; then the theme module test.

| module | commit | needs | build | contrast sweep exit | dark device: views / low | Dark picked: views / low | views not reached (dark device) | theme test in that course |
|---|---|---|---|---|---|---|---|---|
| worksheets-ink | 206834f | - | 0 | 0 | 50 / 0 | 50 / 0 | 3 | PASS 41 |
| glossary-tap | 3190f57 | - | 0 | 0 | 61 / 0 | 66 / 0 | 10 | PASS 39 (2 skipped: the course has no calculation question) |
| module-pages | c8fb645 | - | 0 | 0 | 55 / 0 | 55 / 0 | 7 | PASS 41 |
| paper-picker | a3eb5c3 | - | 0 | 0 | 50 / 0 | 50 / 0 | 4 | PASS 41 |
| study-controls | 1c1d590 | - | 0 | 0 | 49 / 0 | 49 / 0 | 4 | PASS 41 |
| pair-up-drills | 5098a48 | - | 0 | 0 | 64 / 0 | 70 / 0 | 22 | PASS 41 |
| short-answer-graphs | 800b229 | - | 0 | 0 | 58 / 0 | 61 / 0 | 4 | PASS 41 |
| quiz-prep-cards | 5918202 | - | 0 | 0 | 51 / 0 | 48 / 0 | 4 | PASS 41 |
| stopwatch | dbdc42a | - | 0 | 0 | 54 / 0 | 54 / 0 | 7 | PASS 41 |
| notes | f6cc9e6 | - | 0 | 0 | 57 / 0 | 54 / 0 | 7 | PASS 41 |
| terms-variables | 8641b3f | - | 0 | 0 | 54 / 0 | 54 / 0 | 5 | PASS 41 |
| concept-statuses | 6d89a5e | - | 0 | 0 | 51 / 0 | 48 / 0 | 4 | PASS 41 |
| plan-the-problem | 4c09914 | formulas-in-text, equation-drill | 0 | 0 | 56 / 0 | 49 / 0 | 16 | PASS 41 |

0 low-contrast items in 1,418 measured views (710 dark device, 708 Dark picked). "Views not reached" are buttons the sweep looked for
but did not find visible, or views a course does not have (listed per course in
`sweep/shots/<module>/*-views.json`). Screenshots kept: 104 (each course's Topics and Quiz tabs, the
answered quiz card and the exam result, both modes, `sweep/shots/`); the other 1,314 stay in
`/tmp/port-theme/evidence/sweep/` and are not published. A course with all modules on at once was
not run here (the integration run did that on older heads).

## NOT RUN

- WebKit (Safari) and a real iPhone in this container (Chromium only). On GitHub, "WebKit · template
  (informational)" passed on `c85f386`, but that course does not switch theme on.
- Colours inside SVG drawings: the contrast measure reads text, not drawn lines.
- Medicinal-chemistry and the no-module template course: cited from `evidence/baseline`
  `main-6432c36/` (trees identical), not rerun.
- The mutations on the test of `c85f386` (the test of `01af26c` was used; see above).
