<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

Port queue item 19, Tier 2b (`review/port-queue.md`). It needs your yes before it merges. The port started after 2026-11-02 11:00 CT, after Intro to Pharmacology's Exam 4. Intro to Pharmacology's code was only read, from a read-only copy at `929cd62`.

## What the feature does

The module adds two kinds of practice tabs, ported from the Intro to Pharmacology drill (`exam1-drill/src/app.js`: Pair up, the drug ↔ receptor drill and the poisoning table drill).

- **Pair up.** The student moves chips into the boxes they belong to, either by dragging or by tapping a chip and then a box. A set is either one chip per box (receptor → what an agonist does there) or several chips per box (receptor → G protein). Check marks every chip. The wrong and unplaced chips come first, each with where it was put, where it belongs and why. "Retry the wrong ones" sends only those chips back to the tray. A set of 9 pairs or fewer is served whole; a bigger set gives 7 pairs a round, or 12 chips when several chips share a box. All three numbers are module options.
- **Table recall: one tab per course table.** Each mode asks one column of a row and wants another column as the answer, for example the poison → its antidote, or the drug → its receptor line. The student answers with one tap. The other answers come from the other rows of the table. A mode can put the row's own near miss first (the same receptor with the action flipped), take answers from the same section first, and leave out rows that would also be right (another drug with the same receptor and action). A miss comes back at the end of the round and leads the next round. The best first-round score per mode is kept. "Cover and reveal" shows the whole table with chosen columns covered, each covered cell opened by a Show button, plus Show all and Hide again. A tap on an answer or on Skip within 350 ms of a card being drawn is not taken, so the second tap of a double tap on Next does not skip the next row.
- The best scores and the misses are kept in the saved progress (`DB.pairup`), so Export, Import and Erase cover them.

**How this differs from the core's `match` type.** `match` is a question in the bank: one stem with a few left and right items, graded all or nothing, recorded in the answer history, scheduled, and drawn onto exam papers. This module adds none of that and leaves `match` unchanged. Its answers are not bank answers and the scheduler does not see them, as in Intro to Pharmacology. It is separate practice over the course's own tables. Pair up's sets are bigger than a bank item (8 to 32 pairs), are served in rounds, can put several chips in one box, explain each chip, and retry only the wrong ones. Table recall asks every row of a table, one tap per row, with answers drawn from the other rows.

## What changes

- New folder `features/pair-up-drills/current/`: the module code, its styles, a build step, `module.json` and its test. Beside it:
  - `port_from_ip.js` writes the test's fixture from Intro to Pharmacology's own files. It is not copied into a course.
  - `ci/oncourse.js` switches the module on in a scratch course for the kit's checks on GitHub (`core/ci_course.sh module:pair-up-drills`), with the fixture's 5 sets and 2 tables as the course data. It is not copied into a course.
- The sets and tables are course data, in a data file listed in `course.js` `files`: `PAIR_SETS` (`[{id, name, cite, bins, pairs: [[chip, box, why]]}]`) and `RECALL_TABLES` (rows, columns, modes, cover choices). The module's header and `module.json` describe the shapes.
  - In Intro to Pharmacology, the drug set and the drug table are built in the page from its drug list, using course-specific patterns (`pairDrugs`, `rxKey`, `rxSig`). In the kit those derived cells (the receptor line, its flipped twin, the receptor-plus-action key) are written into the rows. `port_from_ip.js` shows how this was done for Intro to Pharmacology.
  - The build stops with the reason when:
    - neither `PAIR_SETS` nor `RECALL_TABLES` is there;
    - a box appears twice in a one-chip-per-box set;
    - a mode names a column that no row has;
    - a row has list cells of different lengths;
    - a cell carries an HTML tag;
    - a mode has fewer than 2 items, or only one answer.
- Catalog bookkeeping:
  - `FEATURES.md`: the `pair-up` and `table-recall-drill` entries now say that one module, `pair-up-drills`, holds both.
  - `features/README.md`: one row added.
  - `review/port-queue.md`: item 19 set to `partial (left: the links from a chip or a row to the course's own figures and reference page; the antidote diagrams beside the poisoning table)`.
  - `CHANGELOG.md`: one entry under 2026-11-02.
- Not ported (what the student will not get):
  - Pair up's "See the figure" and "See why" buttons, and the drug drill's "Why?" and "On the list" buttons and drug-map chips. They open Intro to Pharmacology's own diagrams and reference page.
  - The antidote diagrams beside the poisoning table, and its "The whole table" button.
  - The variant drill (`pgx_table.js`, Exam 4). It has the same shape, so a course can give it as a table, but its data was not converted today.
- The test fixture copies Intro to Pharmacology's rows verbatim. Two Pair up reasons in it refer to the professor as "he" or "his" ("His spelling DUMBBELSS has two S"). They are left as the course wrote them, because the fixture is a copy of course data. They name no one. The text the kit itself writes (prompts, mode names, column labels) says "the professor". No personal name is in the module's files.

## What does not change

- No course site changes. No course switches this module on, and no course repository was touched.
- `core/` and `template/` are unchanged (`git diff origin/main -- core template` is empty).
- A course without the module builds the same page as before.

## Corrections to the first version of this text

- Item 19's status is `partial`, not `done`: the links to the course's own figures and reference page, and the antidote diagrams, are left.
- Pair up's smallest set has 8 pairs, not 14 (the sets have 14, 9, 8, 12 and 32 pairs).
- The first version's double-tap behaviour was wrong: the ported drill took a tap on Skip right after Next. It is fixed (fault 1 below).

## Review evidence

Every result below is **agent-run** (this session, 2026-11-02, Chromium only). Final tested commit: **`5098a48c40df52225e2cce3e24922c42b1ef8a23`** (start of this review: `a0ff3d4`). Evidence branch: **`evidence/pair-up-drills`** (`evidence/pair-up-drills/INDEX.md` lists every command, its exit code and its log).

### Faults found and fixed in `5098a48`

1. **A double tap on Next skipped the next row.** Intro to Pharmacology's poisoning drill ignores a tap on an answer or on Skip within 350 ms of the card being drawn; the port had left that out. The second tap of a double tap on Next landed on the new card's Skip and put that row in the redo list. Now every table has the guard.
2. **A saved value in another shape stopped the module.** If the saved progress held a miss list that was not a list (an older or edited export), opening a table threw, the module was switched off and its tabs disappeared. Now such a value is read as none.
3. **A professor's surname in `port_from_ip.js`.** Its fixture check named one professor. It now reads the names from the course's own `course.js` when it runs; the fixture it writes is unchanged (rerun: byte-identical).
4. **`ci/oncourse.js` was missing,** so the GitHub job "Chromium · module:pair-up-drills" failed. It is added.

Not a module fault (core behaviour, for a separate core proposal if wanted): a reload in the same moment as Check loses that new best score, because the core writes the progress 150 ms after the last change.

### Behaviour map (Intro-Pharmacology- `exam1-drill/src/app.js` at `929cd62`)

| # | Source | Behaviour | Kit |
|---|---|---|---|
| 1 | 1929-1980 `PAIR_SETS` | four sets of chip, box, why, figure link | adapted: course data; the link is dropped |
| 2 | 1981-1989 `pairDrugs` | drug set built in the page from the drug list | adapted: rows written into the data (32, the same as `pairDrugs`) |
| 3 | 1991-1996 `pairRound` | whole up to 9 pairs, else 7; shared boxes 12 | ported, as options `wholeUpTo`, `pairRound`, `binRound` |
| 4 | 1997 `pairSee` | "See the figure" / "See why" under a chip's reason | omitted: no button to the course's figure |
| 5 | 1998-2022 `vPair` | sets, tray, boxes, Check / Retry / New round, wrong chips first, Sources | ported |
| 6 | 2023-2027 `pairPlace` | one chip per box; tray return | ported |
| 7 | 2028-2034 `pairCheck` | marks every chip, keeps the best per set | adapted: kept in `DB.pairup` |
| 8 | 2035-2060 `pairWire` | drag with a ghost, tap to select, tap in a box to return, keyboard | ported |
| 9 | 2120-2129 `rxKey`, `rxLabel` | receptor-plus-action key | adapted: written into rows |
| 10 | 2131-2135 `rxStart` | saved misses first; redo rounds | ported; misses kept per mode (one list for both modes before) |
| 11 | 2136-2142 `rxOptions` | Name the drug: 4 drugs, other receptor-plus-action, same section first | ported (`options`, `distinct`, `near`) |
| 12 | 2143-2146 `rxRecText`, `rxSig`, `rxFlip` | the table's line, its flipped twin | adapted: written into rows |
| 13 | 2147-2154 `rxAnswers` | Name the receptor: own line, flipped twin, same section first, 5 | ported (`alts`, `near`) |
| 14 | 2155 `rxAsk` | receptor, action and site shown | adapted: written into rows |
| 15 | 2156-2193 `vRxq` | counter, answers, Next / Redo / New round, Skip / Start over, feedback | ported; Start over asks to confirm; omitted: "Why?", "On the list", drug-map chips |
| 16 | 2194-2200 `rxCheck` | grading, miss kept for the redo | ported |
| 17 | 2201-2210 `rxAdvance` | best first-round score; misses saved | ported |
| 18 | 2212 | Enter goes on | ported |
| 19 | 2219 `PT_MODES` | four modes and Cover and reveal | adapted: labels from the data, "The professor's special questions" |
| 20 | 2220-2225 `ptAnti` … `ptMoaText` | cell texts of the key | adapted: written into rows |
| 21 | 2226-2233 `ptItems` | items per mode | ported: equal to Intro to Pharmacology's (12, 17, 12, 6 items) |
| 22 | 2235-2239 `ptStart` | misses first per mode | ported |
| 23 | 2240-2244 `ptOptions` | 5 different answers from the mode | ported |
| 24 | 2245 `ptRowHTML` | the row after an answer | ported, as `columns` |
| 25 | 2246 `ptDiag`, `antiCard` | antidote diagrams | omitted: the student does not see them |
| 26 | 2247-2259 `ptTable` | Cover and reveal, Show, Show all, Hide again | ported; cover choices from the data |
| 27 | 2260-2286 `vPtab` | intro, "The whole table" button | adapted: "the professor"; the button is omitted |
| 28 | 2285, 2293-2298 | tap within 350 ms not taken | ported in this review (fault 1), for every table |
| 29 | 2287-2292 `ptCellText` | "Same as above" rows | ported, through `port_from_ip.js` |
| 30 | 2299-2307 `ptAdvance` | best first-round score, misses per mode | ported |
| 31 | 2308 | Enter goes on | ported |
| 32 | 184 `FOCUS_VIEWS` | poisoning table tab only while Exam 3 is the focus | adapted: one tab per table the course gives |

### Mutation checks (22 mutations, each in a scratch copy, none on the branch; 22 of 22 caught, each exit code 1)

| Mutation | What it breaks | Check that FAILs (first named) |
|---|---|---|
| M0 | the module as it was at `a0ff3d4` | a tap on Skip or on an answer within 350 ms of Next is not taken; a saved value in another shape is read as none |
| M1 | a second chip no longer sends the first back | a second chip put in a taken box sends the first back to the tray |
| M2 | Check counts any placed chip as right | Check marks every chip: 5 right, 2 wrong |
| M3 | Retry returns every chip | Retry the wrong ones returns only the wrong chips to the tray |
| M4 | `wholeUpTo` ignored | the 9-pair set is served whole |
| M5 | `binRound` ignored | the options are used (12-chip set gives 10) |
| M6 | the flipped twin not offered | Name the receptor: … its flipped twin among them |
| M7 | rows with another right answer not left out | Name the drug: none of the others with the same receptor and action |
| M8 | `near` ignored | each drug is offered the lines or drugs of its own section first |
| M9 | saved misses do not lead | the drug missed last time leads the next round |
| M10 | a redo round can change the best | the redo round answered right leaves 5/6 |
| M11 | misses not kept at the end of a round | the redo round holds the one miss; the best score and the miss are kept |
| M12 | Check does not save | a reload 400 ms after Check keeps the new best score |
| M13 | no 350 ms guard on an answer | a tap on Skip or on an answer within 350 ms of Next is not taken |
| M14 | no 350 ms guard on Skip | the same check |
| M15 | a miss list in another shape used as it is | a saved value in another shape is read as none: both tables open |
| M16 | Enter does not go on | Enter goes on to the next row |
| M17 | Hide again does not cover | Hide again covers them again |
| M18 | a dropped chip is not placed | a chip dragged onto a box is placed there |
| M19 | wrong chips not listed first | the wrong chips come first |
| M20 | `step.js` lets an HTML tag through | an HTML tag in a cell stops the build |
| M21 | `step.js` lets a box twice through | a box twice in a one-chip-per-box set stops the build |

Script and full table: `evidence/pair-up-drills/mutations/`.

### Persistence (checks in `test.js`, so they run with every module test)

- A large saved state: 11 best scores and 119 missed items (every mode's items but one) come back after a reload; the 38 saved misses lead the round of 39.
- Export progress carries all 11 best scores and 6 miss lists; Import into a new profile brings them back, and they survive a reload.
- Each profile keeps its own scores and misses through switches.
- A reload 400 ms after Check keeps the new score. A reload in the same moment as Check lost the new score (the score saved before was kept, and every other value was there): core behaviour, reported, not changed.
- Storage denied and storage full: the student is told the progress was not saved; the stored progress is left as it was; the new score stays on screen; once storage works, the next change is saved with everything earlier and loads after a reload.
- A saved value in another shape is read as none, and both tables open.

### Check results (all agent-run, on `5098a48`)

| Check | Result |
|---|---|
| Module test on the module course (template + Intro to Pharmacology's data from `ci/oncourse.js`), 3 runs | PASS, 69 checks, each run |
| Module test with the module's code left out | FAIL, 1 of 1 checks ("the page carries pair-up-drills, working") |
| `ci/oncourse.js` on a fresh course; a second run on the same course | exit 0; exit 1 ("already switches pair-up-drills on") |
| `run_checks.sh` on the module course | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no lecture PDFs), 1 REPORT (`explain_check.js`); `home_test.js` 36 checks PASS |
| `core/ci_course.sh module:pair-up-drills` | exit 0: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT |
| `port_from_ip.js` rerun on `929cd62` | exit 0; fixture byte-identical |
| Template course, no module | cited from `evidence/baseline` `main-6432c36/` (same core and template trees): 24 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT |
| Medicinal-chemistry `f1f5ee5`, full clone | cited from the same baseline: 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`, `cite_check.py`), 1 REPORT; `home_test.js` 36 checks PASS |
| GitHub, Kit checks run 41542639039 on `5098a48` | all 6 jobs success: Modules to check; Chromium · module:pair-up-drills (26 PASS, module test 69 checks); Chromium · template; Chromium · template-unset; Chromium · medicinal-chemistry (23 PASS, `home_test.js` 36); WebKit · template (informational) |
| NOT RUN | the module test in WebKit (Safari): this container has Chromium only, and the GitHub WebKit job runs the template course without the module; a touch drag on an iPad |

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
