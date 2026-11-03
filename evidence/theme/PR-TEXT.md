<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

Port queue item 5, Tier 2 (`review/port-queue.md`). It needs your yes before it merges. Pharmacokinetics' code was only read, from a read-only copy at `ac2eb73`. Title while it is a draft: "Port (incomplete): theme".

## What the feature does

The module brings the Pharmacokinetics drill's light and dark colours, and the student's choice between them, into the kit (`src/views.js` 6323-6334 and `src/shell.html` 979-1042).

- **What the kit core does today.** The core has light colours only. `core/shell.html` has no dark colours, no `prefers-color-scheme` rule and no `data-theme`. `browser_test.js` opens every tab with the browser set to dark ("phone (dark)", "desktop (dark)") and checks for sideways scroll, "undefined" or "NaN" on screen and page errors. In those runs the page stays light.
- **Dark colours.** With the module on, the whole page has dark colours. The palette is Pharmacokinetics': page, cards, lines, text, right, wrong, warning and accent colours. Pharmacokinetics' dark rules for the classes the core has are ported (concept blocks, tags, notes, chips, the exam header, buttons with dark text on light backgrounds, SVG images, form controls). The kit adds dark values for fixed light colours in the core that Pharmacokinetics' shell did not have: the atlas colours (`--at-*`, `--wash`), the figure boxes (`.fgshow`, `.cmpcell`, `.wfig`), the `.tag.p3` and `.tag.p4` tags, and dark text on the light-coloured option letters, buttons and marks. Each of these values is one of Pharmacokinetics' dark palette colours.
- **The choice.** A "Color theme" menu in the header has three entries: **Match device** (the default), **Light** and **Dark**. Settings has the same three choices in a "Color theme" section. The two stay in step.
  - Match device follows the light or dark setting of the phone or computer. This uses CSS alone (`prefers-color-scheme`), so it changes when the device's setting changes and does not need the script.
  - Light and Dark win over the device's setting.
  - Pharmacokinetics names the first choice "System". Here it is "Match device".
- **Where the choice is kept, and why.** The choice is a setting of the device. It is kept in this browser's storage under `<ns>:theme`, the same for every profile, beside the device's other settings (`<ns>:profile`, `<ns>:newsSeen`). It is not in the progress (`DB`). The progress is per profile and moves to another device with Export progress. A colour choice belongs to the screen it was made on (a phone kept dark at night, a laptop kept light). So Export progress does not carry it, Import progress and a profile switch do not change it, and Settings says so. The choice is read and written through the core's `store`, so a browser that refuses storage keeps the choice for the visit only, and the core's notice that the browser did not save is shown. Match device removes the stored value. A stored value that is not `light` or `dark` reads as Match device.
- **No light page first.** The module sets the choice on the page while the page loads, before the first screen is drawn. The test now checks this: a stored Dark is on the page in the first frame that shows the tabs. (The first version of this text said it was not measured.)

## What changes

- New folder `features/theme/current/`: `module.json`, `theme.js`, `theme.css` and `test.js`. The module reads no course data and has no options.
- New `features/theme/ci/oncourse.js`, the script the kit's GitHub checks run to switch the module on in their courses. It writes no data file and appends one line to `course.js`. Without it the jobs "Chromium · module:theme" and "Chromium · modules:theme,chained-problem-sets,equation-drill,formulas-in-text,wrong-number-diagnosis" stopped before any check ("features/theme/ci/oncourse.js is missing"). With it, both pass.
- `test.js` now runs on real course pages: it adds four Pharmacokinetics questions (`src/q15_module7b.js` pd-c01, pd-c02, pd-c04, pd-c05, with their topic and deck, word for word; the one change: `prof` is "Professor") to its scratch copy, in a topic of their own.
- `theme.css` holds the dark rules twice: once for Match device on a dark device, and once for Dark picked by the student. The test checks that the two copies are the same.
- Catalog bookkeeping:
  - `FEATURES.md`: a `theme` entry (its Test line now describes 41 checks).
  - `features/README.md`: one row.
  - `review/port-queue.md`: item 5 set to `partial (left: module colours, views.js 6334-6383, Tier 3; PK dark rules for classes the core lacks, each with the module that brings the class; WebKit run)`.
  - `CHANGELOG.md`: one entry under 2026-11-02.
- **Not ported:**
  - Pharmacokinetics' dark rules for classes the core does not have: `.meter b`, `.misskind`, `.shortfall`, `.warnbtn`, `.rtab`, `.mtab`, `.stsvg`, `.stepfig`, `#zoom` and `.mrow`. The student sees no difference today. A module that brings one of these classes into the kit can add its own dark rule.
  - Pharmacokinetics' module colours `.m0`-`.m7` and their dark values (module-colours, Tier 3). The queue's source range `views.js` 6323-6383 runs into that code (6335-6383). The theme code itself is lines 6323-6334.

## What does not change

- No course site changes. No course switches this module on, and no course repository was touched.
- `core/` and `template/` are unchanged (`git diff origin/main -- core template` is empty; core tree `a2dbf03`, template tree `cbac5bd`).
- A course without the module builds the same page as before, and it stays light on a dark device.

## Review evidence

Evidence branch: `evidence/theme` (commit `88d9667`, folder `evidence/theme/`, `INDEX.md`). Every result below is **agent-run** unless it says GitHub. Branch start `2b41393`; **final tested commit `c85f386`**.

### Faults found

1. **The CI course script was missing** (the cause of the two failing GitHub jobs). Fixed: `features/theme/ci/oncourse.js`.
2. **The test could not run on a course that already holds its fixture.** On the module's own real-data course it wrote `q90_theme_fixture.js` a second time and the build refused ("course.js `files` lists ['q90_theme_fixture.js'] more than once"). Fixed in `c85f386`: the fixture is added only when the course does not have that file.
3. **Two faults in the new checks themselves, found on their first run and fixed before commit:** the core's save notice is `position:fixed`, so it has no offsetParent; and Import merges answers by second, question, result and mode, so the check now compares with the distinct answers in the file.
4. No fault was found in `theme.js` or `theme.css`. Nothing needs a core change. One finding for the coordinator: with storage denied or full the student sees the core's notice, which speaks of progress, not of the colour choice.

### Behaviour map (Pharmacokinetics `ac2eb73`)

| # | Behaviour | File and line | Kit |
|---|---|---|---|
| 1 | Choice kept per browser under `NS + ':theme'` | views.js 6324 | ported (through the core `store`) |
| 2 | Light or Dark sets `data-theme` on `<html>`; anything else removes it | views.js 6325-6328 | ported |
| 3 | Stored value applied at start-up, before the views draw | views.js 6330-6331, 6334 | ported (first frame checked) |
| 4 | Header menu shows the stored value; a change stores and applies it | views.js 6332 | adapted: "System" is "Match device"; Match device removes the stored value; an unknown stored value reads as Match device |
| 5 | Storage that refuses writes keeps the value for the visit | shell.html 1442-1454 | ported (core `store`, with the core's notice) |
| 6 | Dark palette for a dark device, unless Light is picked | shell.html 979-985 | ported, plus atlas colours, `--wash`, `color-scheme:dark` |
| 7 | Dark rules for the classes the core has | shell.html 986-1003 | ported; kit adds `.fgshow`, `.cmpcell`, `.wfig`, `.tag.p3`, `.tag.p4` and others |
| 8 | Dark rules for `.meter b`, `.misskind`, `.shortfall`, `.warnbtn`, `.rtab`, `.mtab`, `.stsvg`, `.stepfig`, `#zoom`, `.mrow` | shell.html 991-1003 | omitted: the core has none of these classes |
| 9 | Same palette and rules for Dark picked | shell.html 1005-1028 | ported (test: the two blocks are the same) |
| 10 | `:root{--sel:var(--ink)}` | shell.html 1029 | omitted: the core uses `--sel` only in the dark chip rule |
| 11 | Header menu style | shell.html 1030 | ported |
| 12 | Header menu markup, "Colour theme" | shell.html 1039-1041 | adapted: added at start, "Color theme" |
| 13 | (not in PK) the same choice in Settings | — | added |
| 14 | Module colours and their tinting | shell.html 755-765, views.js 6335-6383 | omitted (Tier 3) |
| 15 | Dark badges read at 4.5 : 1 | modcolor_test.py 61-68 | ported as a contrast check over every tab and quiz cards |

### Mutation table (20 mutations, each an exact replacement on a scratch copy; never committed)

| Mutation | What it breaks | Test exit | Caught by |
|---|---|---|---|
| M01 | Light and Dark picks do nothing | 1 | 18 checks |
| M02 | a pick is not stored | 1 | 22 checks |
| M03 | Match device stored instead of removed | 1 | Match device removes the stored choice |
| M04 | any stored value taken as a theme | 1 | an unknown value reads as Match device |
| M05 | choice also written into the progress | 1 | the progress holds no theme (check added: missed in the first run) |
| M06 | choice applied 60 ms after load | 1 | first frame shows Dark (and 7 more) |
| M07 | header not kept in step | 1 | the header follows Settings |
| M08 | Settings not wired | 1 | Light picked in Settings |
| M09 | read from localStorage directly | 1 | the test stops: with storage refused the page does not start |
| M10 | no guard for the engine in node | 1 | loads with no page |
| M11 | no Match device entry | 1 | 4 checks |
| M12 | written to localStorage directly | 1 | storage refused, denied and full (4 checks) |
| C01 | device block on light devices | 1 | 14 checks |
| C02 | dim text too dark | 1 | contrast (2.40 : 1 found) |
| C03 | Light does not win on a dark device | 1 | 11 checks |
| C04 | one rule missing from the Dark block | 1 | the two blocks are the same |
| C05 | no dark `--wash` | 1 | each core colour has a dark value |
| C06 | no `color-scheme:dark` on the page | 1 | drawn in the browser's dark style (check added: missed in the first runs) |
| C07 | no dark text on light buttons | 1 | contrast (2.26 : 1 found) |
| C08 | no `color-scheme:dark` anywhere | 1 | drawn in the browser's dark style |

The module test with the module's code emptied: exit 1 (2 checks fail, then the test stops).

### Persistence results (automated in the test)

| Case | Result |
|---|---|
| Export after 30 answers, then Import in a fresh browser | the file holds no theme; the file's distinct answers arrive; that browser's Light stays. PASS |
| Profile switch | the choice stays. PASS |
| Reload 0, 100 and 400 ms after a pick | the pick is kept (it is written at once, not with the progress 150 ms later; nothing is lost below 150 ms). PASS |
| Progress 400 ms after a pick | holds no theme. PASS |
| Storage denied (SecurityError), 25 answers and Light saved | Dark for the visit; the core's "did not save" notice shows; saved Light and progress unchanged; after storage works again and a reload, Light and the 25 answers load and a new pick is saved. PASS |
| Storage full (QuotaExceededError) | the same. PASS |

### Check results

| Check | Result (agent-run unless marked) |
|---|---|
| module test, 3 runs on the template course with the module on (`c85f386`) | 41 passed, 41 passed, 41 passed |
| `run_checks.sh`, template course with the module on (`c85f386`) | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`); `home_test.js` 36 passed |
| `run_checks.sh`, the module's own real-data course (template + the four Pharmacokinetics questions as course data, `c85f386`) | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT; `home_test.js` 36 passed; on `01af26c` it was 25 PASS, 1 FAIL (fault 2 above) |
| `core/ci_course.sh module:theme chromium` (`c85f386`) | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, a documented exclusion), 1 REPORT |
| CI script on a fresh course, then `build.py` and the module test | exit 0, exit 0, 41 passed |
| GitHub, run 41551666202 on `c85f386` | all 7 jobs success, including "Chromium · module:theme" and "Chromium · modules:theme,chained-problem-sets,equation-drill,formulas-in-text,wrong-number-diagnosis" |
| No-module template course and Medicinal-chemistry (full clone `f1f5ee5`) | cited from `evidence/baseline` `main-6432c36/` (`f8a22d5`; same core and template trees): 24 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT and 23 PASS, 0 FAIL, 2 NOT RUN, 1 REPORT with `home_test.js` 36 passed |

### Theme with every new module (contrast sweep, `contrast_test.js` from `evidence/integration` `1329222`)

One course per module: the module at its port head, switched on by its own `ci/oncourse.js` with its own real data, plus theme at `c85f386`.

| Module | Commit | Dark device: views / low contrast | Dark picked: views / low contrast | Theme test there |
|---|---|---|---|---|
| worksheets-ink | 206834f | 50 / 0 | 50 / 0 | 41 passed |
| glossary-tap | 3190f57 | 61 / 0 | 66 / 0 | 39 passed, 2 skipped (no calculation question) |
| module-pages | c8fb645 | 55 / 0 | 55 / 0 | 41 passed |
| paper-picker | a3eb5c3 | 50 / 0 | 50 / 0 | 41 passed |
| study-controls | 1c1d590 | 49 / 0 | 49 / 0 | 41 passed |
| pair-up-drills | 5098a48 | 64 / 0 | 70 / 0 | 41 passed |
| short-answer-graphs | 800b229 | 58 / 0 | 61 / 0 | 41 passed |
| quiz-prep-cards | 5918202 | 51 / 0 | 48 / 0 | 41 passed |
| stopwatch | dbdc42a | 54 / 0 | 54 / 0 | 41 passed |
| notes | f6cc9e6 | 57 / 0 | 54 / 0 | 41 passed |
| terms-variables | 8641b3f | 54 / 0 | 54 / 0 | 41 passed |
| concept-statuses | 6d89a5e | 51 / 0 | 48 / 0 | 41 passed |
| plan-the-problem (with formulas-in-text, equation-drill) | 4c09914 | 56 / 0 | 49 / 0 | 41 passed |

0 low-contrast items in 1,418 views. Each sweep's control line (grey on grey) was found.

### NOT RUN

- WebKit (Safari) and a real iPhone with the module on. This container has Chromium only; GitHub's WebKit job runs the template course without the module.
- Colours inside SVG drawings: the contrast check reads text, not drawn lines.
- All modules on in one course with theme (the coordinator's integration run did this on older heads).
- The mutations on the test of `c85f386` (they ran on `01af26c`; the later change only affects a course that already holds the fixture).

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
