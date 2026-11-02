# Evidence: pair-up-drills (port queue item 19, kit pull request #14)

Every result here is **agent-run** (the hardening session, 2026-11-02, Node v22.23.4, Python 3.13.18,
Chromium only). The coordinator's own re-runs go in `coordinator/`.

## Inputs

| What | Value |
|---|---|
| Source read | Intro-Pharmacology- `929cd62`, `exam1-drill/src/` (`app.js`, `drugs.js`, `poison_table.js`, `course.js`), read-only clone `/tmp/ip-readonly` |
| Port branch, starting commit | `port/pair-up-drills` at `a0ff3d4` |
| Port branch, final tested commit | `5098a48c40df52225e2cce3e24922c42b1ef8a23` |
| origin/main | `6432c36709ad3dc3ab78d8558239971b18234aec` |
| core tree (`5098a48:core`, same as `6432c36:core`) | `a2dbf03d6ccea270f77ac440f3fd8b7a86d855cf` |
| template tree (`5098a48:template`, same as `6432c36:template`) | `cbac5bd425d480944293f8e1fb5d5d703e8baba1` |
| `git diff origin/main -- core template` | empty |

## Baseline cited, not rerun

The core and template trees above are exactly the inputs of the coordinator's baseline
`evidence/baseline`, folder `main-6432c36/` (commit `f8a22d5`: core `a2dbf03`, template `cbac5bd`,
Medicinal-chemistry `f1f5ee5`, full clone). This branch changes neither tree, and the no-module course
and Medicinal-chemistry do not switch this module on, so their results are cited from there:

- template course, no module: `run_checks.sh` 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`);
- Medicinal-chemistry `f1f5ee5`, full clone, this core: `run_checks.sh` 23 PASS, 0 FAIL, 2 NOT RUN
  (`stepper_test.js`: no step-through figures; `cite_check.py`: no lecture PDFs), 1 REPORT;
  `home_test.js` PASS, 36 checks.

The GitHub job "Chromium · medicinal-chemistry" on `5098a48` gave the same (below).

## Commands, exit codes, logs (all agent-run)

| # | Command | Exit | Log |
|---|---|---|---|
| 1 | `core/ci_course.sh module:pair-up-drills` on the new `ci/oncourse.js` before any other change (kit `a0ff3d4` + the script) | 0 | `logs/ci_course-first.log`: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT; module test 41 checks |
| 2 | `node features/pair-up-drills/port_from_ip.js /tmp/ip-readonly/exam1-drill/src` on a scratch copy of the module folder, after the name-check change | 0 | `logs/port_from_ip.log`: the fixture it writes is byte-identical to the one in `test.js` |
| 3 | `mkcourse.sh <kit> /tmp/port-pair-up-drills/on pair-up-drills` | 0 | `logs/mkcourse-on.log` |
| 4 | `node features/pair-up-drills/ci/oncourse.js <kit> on/src` | 0 | `logs/oncourse-on.log` |
| 5 | the same a second time on the same course (it runs once per course) | 1 | `logs/oncourse-on-second.log`: "course.js already switches pair-up-drills on" |
| 6 | `python3 build.py` (on course; again after each module copy) | 0, 0, 0 | `logs/on-build.log`, `on-build-2.log`, `on-build-3.log` |
| 7 | module test while the checks were written (development runs) | 0 each | `logs/test-dev1.log` … `test-dev6.log` (65, 68, 69, 69, 69, 69 checks; dev5 ran on a stale copy, dev6 on the final test) |
| 8 | module test on a template course built without the module (`mkcourse.sh` no module, `test.js` copied in, `build.py`) | 1 | `logs/test-module-absent.log` (the test crashed: no `FX` in a page without modules; the test was then changed to report it), `logs/test-module-absent-2.log`: **FAIL**, 1 of 1 checks failed, "the page carries pair-up-drills, working" |
| 9 | `python3 mutations/mutations.py on mutwork mutations/run` (22 mutations) | 0 | `mutations/run/` (one log per mutation, `results.json`, `table.md`, `table-short.md`): 22 of 22 caught |
| 10 | fresh final course: `mkcourse.sh <kit at 5098a48> /tmp/port-pair-up-drills/final pair-up-drills` | 0 | `logs/final-mkcourse.log` |
| 11 | `node features/pair-up-drills/ci/oncourse.js <kit> final/src`, then `git commit` in the course | 0 | `logs/final-oncourse.log` |
| 12 | `python3 build.py` | 0 | `logs/final-build.log` |
| 13 | module test, run 1, 2, 3 | 0, 0, 0 | `logs/final-test-run1.log`, `run2`, `run3`: 69 checks passed each time |
| 14 | `./run_checks.sh` on the final course | 0 | `logs/final-run_checks.log`, `logs/final-run_checks-logs/`: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`); `home_test.js` 36 checks PASS; `features/pair-up-drills/test.js` 69 checks PASS |
| 15 | `core/ci_course.sh module:pair-up-drills` at `5098a48` | 0 | `logs/final-ci_course.log`: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT |
| 16 | module test a fourth time with `PUD_SHOTS` | 0 | `logs/final-test-screenshots.log`, `shots/` |

Earlier mutation runs: a first run was stopped after M0 and its folder removed (the test then
crashed at the shape check instead of reporting it); a second, `mutations/dev-run-stopped/`, was
stopped after M0 for the same reason (its M0 log is kept). The table below is the full run on the
final test (`test.js` of `5098a48`; the course copy was compared byte for byte before the run).

## GitHub (Kit checks, run 41542639039, on `5098a48`, pull_request event)

| Job | Id | Result |
|---|---|---|
| Modules to check | 125610356136 | success |
| Chromium · module:pair-up-drills | 125610440110 | success: 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; module test 69 checks |
| Chromium · template | 125610355955 | success |
| Chromium · template-unset | 125610355803 | success |
| Chromium · medicinal-chemistry | 125610355850 | success: 23 PASS, 0 FAIL, 2 NOT RUN, 1 REPORT; `home_test.js` 36 checks |
| WebKit · template (informational) | 125610355322 | success |

Logs: `github/job-125610440110-module.log`, `github/job-125610355850-mc.log`, `github/run-41542639039-jobs.json`.
The job that failed before (125588251036, "features/pair-up-drills/ci/oncourse.js is missing") ran on `a0ff3d4`.

## Behaviour map (source: Intro-Pharmacology- `exam1-drill/src/app.js` at `929cd62`)

| # | Source (file:line) | Behaviour | Kit | Notes |
|---|---|---|---|---|
| 1 | app.js:1929-1980 `PAIR_SETS` | four sets of [chip, box, why, figure link] | adapted | course data `PAIR_SETS`; the link field is dropped (row 4) |
| 2 | app.js:1981-1989 `pairDrugs` | drug set built in the page from `DRUGS_ALL` (Exam 2) by receptor patterns | adapted | rows written into the data by `port_from_ip.js` (32 rows, the same as `pairDrugs` builds; test check) |
| 3 | app.js:1991-1996 `pairRound` | whole set when 9 pairs or fewer, else 7 a round; shared boxes: 12 | ported | the numbers are module options `wholeUpTo`, `pairRound`, `binRound` (test check with them changed) |
| 4 | app.js:1997 `pairSee` | "See the figure" / "See why" buttons under each chip's reason | omitted | the student gets no button from a chip's reason to the course's figure or drug row |
| 5 | app.js:1998-2022 `vPair` | set chips, tray, boxes, Check / Retry the wrong ones / New round, score line, feedback with the wrong chips first, Sources line | ported | drawn in its own tab; tab name is option `pairLabel` |
| 6 | app.js:2023-2027 `pairPlace` | one chip per box (a second sends the first back); tray return | ported | |
| 7 | app.js:2028-2034 `pairCheck` | marks every chip, keeps the placements, keeps the best count per set in `<ns>:pair` | adapted | kept in `DB.pairup.best['pair:<set>']`, written by the core's `save()` 150 ms later |
| 8 | app.js:2035-2060 `pairWire` | drag with a ghost after 6 px, tap to select, tap in a box to return, Enter/Space on a box | ported | |
| 9 | app.js:2120-2129 `rxKey`, `rxLabel` | receptor-plus-action key with per-drug overrides | adapted | written into each row's `key` by `port_from_ip.js` |
| 10 | app.js:2131-2135 `rxStart` | saved misses first, then the rest; redo rounds | ported / adapted | misses kept per mode; Intro to Pharmacology kept one list `<ns>:rx:miss` for both modes |
| 11 | app.js:2136-2142 `rxOptions` | Name the drug: the drug and 3 with another receptor-plus-action, same section first | ported | mode `drug`: `options: 4`, `near: 'sec'`, `distinct: 'key'` |
| 12 | app.js:2143-2146 `rxRecText`, `rxSig`, `rxFlip` | the table's line and its flipped twin | adapted | written into rows (`line`, `flip`) |
| 13 | app.js:2147-2154 `rxAnswers` | Name the receptor: own line, flipped twin, then other lines, same section first, 5 in all | ported | mode `rec`: `alts: 'flip'`, `near: 'sec'` |
| 14 | app.js:2155 `rxAsk` | the receptor, action and site shown for Name the drug | adapted | written into rows (`ask`) |
| 15 | app.js:2156-2193 `vRxq` | counter, answers, Next / Redo the n missed / New round, Skip / Start over, feedback with class, receptor, site, mechanism, why | ported / adapted | the feedback lists the row's columns; "Start over" asks to confirm (as the poisoning drill did); omitted: the "Why?" and "On the list" buttons and the drug-map chips to the course's reference page |
| 16 | app.js:2194-2200 `rxCheck` | grades the tap, keeps the miss for the redo | ported | |
| 17 | app.js:2201-2210 `rxAdvance` | best first-round score by fraction; misses saved; redo or new round | ported | `DB.pairup` |
| 18 | app.js:2212 | Enter goes on (outside buttons and fields) | ported | one handler for every table |
| 19 | app.js:2219 `PT_MODES` | four modes and Cover and reveal; one mode labelled with a pronoun for the professor | adapted | labels come from the data; "The professor's special questions" |
| 20 | app.js:2220-2225 `ptAnti`, `ptAntiLabel`, `PT_LONG`, `ptMoaText` | cell texts of the key | adapted | written into rows by `port_from_ip.js` |
| 21 | app.js:2226-2233 `ptItems` | the items of each mode | ported | the module's items equal Intro to Pharmacology's for all 4 modes (12, 17, 12, 6; test check) |
| 22 | app.js:2235-2239 `ptStart` | misses first per mode | ported | |
| 23 | app.js:2240-2244 `ptOptions` | 5 different answers from the same mode | ported | |
| 24 | app.js:2245 `ptRowHTML` | the row shown after an answer | ported | as the table's `columns` |
| 25 | app.js:2246 `ptDiag`, `antiCard` | antidote diagrams beside the table and the answer | omitted | the student does not see the antidote diagrams |
| 26 | app.js:2247-2259 `ptTable` | Cover and reveal: three cover choices, Show per cell, Show all, Hide again | ported | cover choices come from the data (`covers`); a Show re-draws the table instead of replacing the button in place |
| 27 | app.js:2260-2286 `vPtab` | title, intro naming the professor, "The whole table" button | adapted / omitted | intro says "the professor"; the button to the course's reference page is omitted |
| 28 | app.js:2285 (Skip) and 2293-2298 `ptCheck` | a tap within 350 ms of the card being drawn is not taken | ported in this hardening | was missing on the branch (fault 1); now applies to every table |
| 29 | app.js:2287-2292 `ptCellText` | "Same as above" rows | ported | through `port_from_ip.js` |
| 30 | app.js:2299-2307 `ptAdvance` | best first-round score, misses per mode | ported | |
| 31 | app.js:2308 | Enter goes on | ported | |
| 32 | app.js:184 `FOCUS_VIEWS` | the poisoning table tab shown only while Exam 3 is the focus | adapted | the kit shows one tab per table the course gives |

## Faults found

1. **Double tap on Next skipped the next row** (fixed in `5098a48`). The branch set `S.t0` but never used it;
   Intro to Pharmacology's poisoning drill ignores a tap on an answer or on Skip within 350 ms of the card
   being drawn. Without it, the second tap of a double tap on Next landed on the new card's Skip (where Next
   was) and put that row in the redo list. Check: "a tap on Skip or on an answer within 350 ms of Next is not
   taken" (FAIL on `a0ff3d4`'s module, M0: `{"i":3,"redo":2,...}`).
2. **A saved value in another shape stopped the module** (fixed). With `DB.pairup.miss[...]` not a list (an
   older or edited export), opening a table threw, the module was switched off and its tabs disappeared.
   Now such a value is read as none. Check: "a saved best score or miss list in another shape is read as none"
   (FAIL on M0 and M15).
3. **A professor's surname in `port_from_ip.js`** (fixed): the file named one professor in its fixture check.
   It now reads the names from the course's own `course.js` at run time; the fixture it writes is unchanged.
4. **No `ci/oncourse.js`** (added): the GitHub job "Chromium · module:pair-up-drills" failed on `a0ff3d4`.

Not a module fault (core behaviour, for a core proposal if wanted): a reload in the same moment as Check
loses that new best score, because the core writes the progress 150 ms after the last change. A reload
400 ms after keeps it.

## Mutation checks (`mutations/mutations.py`, run on the final test)

See `mutations/run/table-short.md` (names only) and `mutations/run/table.md` (with the values each check
printed). 22 of 22 mutations caught, each with exit code 1. No mutation is on the port branch.

## Persistence (in `test.js`, so it runs in every module test; results of `logs/final-test-run1.log`)

- 11 best scores and 119 missed items (every mode's items but one, from the course's own items) come back after a reload; the 38 saved misses lead the round of 39 and the saved best is shown.
- Export progress carries every best score (11) and every miss list (6); Import into a new profile brings back the same, and it is saved through a reload.
- Each profile keeps its own: a round in a third profile keeps only its own score; switching back, the first profile is unchanged.
- A reload 400 ms after Check keeps the new best score. **Report:** a reload in the same moment as Check lost the new score (best read 0/8, the value saved before); every other saved value was still there.
- Storage denied (`SecurityError`) and storage full (`QuotaExceededError`): the student is told ("did not save your progress"); the stored progress is left as it was; the new score stays on screen; once storage works, the next change is saved with that score and every earlier value, and loads after a reload.
- A saved value in another shape is read as none and both tables open with every row.
- A redo round leaves the best score as it was (5/6 kept after a redo round answered right).
- NOT RUN: storage tests in WebKit (Safari); this container has Chromium only.

## Data rule (Louis's rule 4)

The module course is the template with Intro to Pharmacology's data as written by `ci/oncourse.js`: the 5 Pair up
sets (14, 9, 8, 12, 32 pairs), the 39-row drug table and the 12-row poisoning table, verbatim from the test
fixture, which `port_from_ip.js` writes from that course's files at `929cd62` (rerun here: byte-identical). The
module reads no question, topic or lecture, so none is added, and the data has no `prof` field; no data was
changed. The template's own sample questions stay in the course as the template's base course; the module
data is not attached to them. Two Pair up reasons refer to the professor with a pronoun ("His spelling DUMBBELSS
has two S"; "his slide 32 lists ..."); they name no one and are kept verbatim. No personal name is in the kit
files of this module or in this evidence (checked with grep).

## Screenshots

`shots/pairup-checked.png` (Pair up after Check: two wrong chips first, with where they belong and why),
`shots/cover-symptoms.png` (Cover and reveal, symptoms covered), `shots/storage-full.png` (the notice with storage full).

## Tools

`tools/edit_test.py`, `tools/persist_block.js`: the edits made to `test.js` (applied once, then committed).
