<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

Port queue item 4, Tier 2 (`review/port-queue.md`). It needs your yes before it merges. Pharmacokinetics' code was only read, from a read-only copy at `ac2eb73`.

**Status: draft, "Port (incomplete): concept-statuses".** It stays a draft until the coordinator marks it ready.

## What changed in this hardening (2026-11-02, evening)

- **A fault in the module, found by a new check, fixed.** On a concept card, the wrong option chosen and "Why it is not the answer" were shown as stored. A ratio written `{{frac:R|Cl}}` in the course's text was shown as that markup, and a long why was cut in the middle of a word. Pharmacokinetics shows the ratio as (R)/(Cl) and cuts at a word (`src/views.js` 2683-2684, 2747-2748). The module now does the same. When formulas-in-text is on, the text is set by that module's `rich()`.
- **The module's course is now Pharmacokinetics' own data.** The test uses 7 questions of the topic "infusion": `inf-c11` and `cq2-4` (two wordings of one concept), `inf-c5` (wrong options with their why), `inf-n1` (a calculation), and `inf-c4`, `inf-n2` and `inf-n4`. It also uses that topic (with every subtopic), lecture L04 and the skill `infusion`, which the template lacks. They come from `src/q3_module3.js`, `src/q13_quizzes.js`, `src/q1_module1.js` and `src/course.js` at `ac2eb73`. A script takes them; they are not typed. The question ids are the course's own, and the test no longer prefixes them. The `words` option on the module's course is Pharmacokinetics' `CONCEPT_WORDS` table (61 entries), verbatim.
  - The one change made to the data: `prof` is set to the template's "Professor".
  - One field is left out: `teachImg` (a slide image), on the 5 of the 7 questions that have one. The kit has none of the course's slide images, and the core's `test.js` stops on a `teachImg` that is not in `images.json` (`core/test.js` line 86).
  - Why these 7 and not the 4 Module 1 questions the test used before. On the module's own course, those 4 made the core checks fail:
    - `m1-ord-c07`'s stem says "The table below", and `browser_test.js` counts "below" as a promised figure;
    - `m1-auc-n02`'s `dupOf` names `m1-auc-n01`, which the fixture did not hold (`test.js`);
    - the topic "orders" held one concept only (`test.js` section 7, "Different wording when a missed concept returns").
  - Most other Module 1 questions name the professor in their text. In the 7 chosen, no text names the professor or uses a pronoun for the professor, and every `dupOf` is in the fixture. The extraction script reports each of these points.
- **New file `features/concept-statuses/ci/oncourse.js`**, outside `current/`, so courses never copy it. The kit's CI runs it to make the module's own course from the template. It writes `q90_cst_fixture.js` (the topic and the 7 questions, one question per line in the kit's form). It appends one line to `course.js`: the file, the lecture as `L91`, the skill `infusion`, and the module on with `words`. It reads the data from `const FIX`, `const WORDS` and `const WRITE` in `test.js`, the same code the test's own scratch copies use. Run a second time on the same course, it refuses and exits 1.
- **Finding F5 of the coordinator's integration check, fixed by switching plan-the-problem off in the test's scratch copies.** This is the candidate patch's choice. The calculations keep their `setup` lines, which name equations of the course ("css", "cp-infusing"). With plan-the-problem on and those equations missing from EQUATIONS, plan-the-problem's build step stops the build, so the test was NOT RUN. Leaving the `setup` lines out of the fixture would be a second change to the course's data, so it was not chosen. A course that has both this data and plan-the-problem on, without those equations, still does not build; `ci/oncourse.js` says so in its header.
- **New checks:** persistence on a long answer history (below), and the checks the mutations showed were missing (below).
- `origin/main` `366caf6` (kit PR #27) is merged in. The checks now open pages over http.
- `review/port-queue.md`: item 4 is now `partial (left: names and statuses of term and extra-practice concepts, after the Terms and extra-practice ports)`. It said `done`.

## What the core already had (without this module)

The kit core's concept scheduler (`core/shell.html`, `core/views.js`) keeps a review step ("box", 0 to 6) for each concept in `DB.concepts`, and counts a concept as mastered at step 3 or higher (`MASTER_BOX`). About each concept, the student already sees:

- on Weak spots, "N of M concepts mastered" (step 3 or higher);
- on Topics, the same mastered count for each topic and subtopic;
- on Weak spots, "What to do next" for each exam pool: concepts "not yet seen", "missed or guessed, still open" (step 0), and "mastered";
- on Weak spots, under each missed question, "now mastered" or "still in review".

The core names no status other than mastered or not mastered, gives no counts behind it, and has no list of concepts due for a spaced check. `FEATURES.md` said the core holds the "scheduler and concept statuses". That was wrong, and this pull request corrects it.

## What the feature adds

A **Concepts** section on Weak spots, after "This session" and before "What to review next", where Pharmacokinetics placed it (`src/views.js` 2066, 2506-2725).

- **A status for each concept answered**, read from every answer to every wording of the concept:
  - Unfamiliar: seen once, missed once.
  - Struggling: 2 or more misses, or under 60% on the last 5 with 2 or more attempts.
  - Improving: missed before, the last 2 correct, not yet mastered.
  - Mastered: 3 or more correct answers on 2 or more different questions in 2 or more sessions, no miss in the last 3. One correct answer never masters.
  - Returning: was mastered, then missed.
  - Learning: correct so far, or one miss after correct answers.
  - A session ends after 30 minutes with no answer. A miss is a wrong answer, or a correct one marked "I guessed that one" or "Not sure".
- **A card for each weak concept** (struggling and returning first, then unfamiliar, then improving; 8 shown, the rest folded). Each card has:
  - the status and the counts behind it, for example "3 misses in 4 attempts, last 4 at 25%";
  - the topic and subtopic;
  - the wrong option chosen most often ("You chose this 3 times:") and why it is not the answer, with a ratio shown as (a)/(b);
  - on missed calculations, the most common kind of miss;
  - a "Practice this concept" button, which asks 3 of its questions, the ones answered longest ago first.
- **Due for spaced review.** A mastered concept gets a spaced check, worked out from its answers: step 3 at mastery, one step up for each further correct answer, at the review pace set in Settings (questions on Exam cram, days on Weekly or Semester), counted from the last correct answer. It is listed once that check is due and the core's own record for the concept is also due. "Check" asks one question of that concept; "Run the checks" asks one question of each concept that is due.
- **Mastered concepts** are folded away in a list, each with its counts and a Check button.
- A fold, "What each status means", gives the rules above. It also says that the mastered count at the top of Weak spots is the scheduler's own count (step 3 or higher), so the two counts can differ.

**How this status differs from the scheduler's mastery count and from the FSRS due state** is set out in kit PR #23 (`review/concept-signals-proposal.md`, branch `proposal/concept-signals`). Its recommendations A to D (the word "Secure", a line at the top of the section, no second due list under FSRS, a line after 4000 answers) are changes to this module that wait for your decision; none of them is in this pull request. Today the module says the two counts can differ only inside the closed fold, as #23 describes. The persistence checks below confirm #23's case 5: after 4000 answers the statuses are read from the most recent 4000.

**The module does not change how the core schedules.** It reads `DB.answers`, `DB.concepts` and the review pace, and writes nothing. The test checks that drawing the section leaves the scheduler's records and the saved progress unchanged, with and without the scheduler's records. The buttons start an ordinary drill, and its answers are recorded as any other answer.

## What changes

- Folder `features/concept-statuses/current/`: `module.json`, `concept-statuses.js`, `concept-statuses.css`, `test.js`. There is no build step and no course data file.
- New file `features/concept-statuses/ci/oncourse.js` (above).
- One module option, `words`: how to write words of the concept ids on the cards, for example `{vd: 'VD'}`. The default is empty. Pharmacokinetics had this as a fixed table in its code (`CONCEPT_WORDS`).
- Optional partner: formulas-in-text. When it is on, the option text and its why on a card are set by its `rich()`. The test passes with it on and with it off.
- Changes from Pharmacokinetics' code, to fit the kit core: see the behaviour map below (rows marked adapted).
- Catalog bookkeeping:
  - `FEATURES.md`: the line on parts moved to the core says the core has the concept scheduler, and the named statuses are this module. The `concept-statuses` entry names the formulas-in-text partner, the 4000-answer limit, PR #23 and the test's 89 checks.
  - `features/README.md`: one row.
  - `review/port-queue.md`: item 4 `partial` (above).
  - `CHANGELOG.md`: one entry under 2026-11-02.

## Not ported

- Names and statuses for term concepts (`term:` ids) and extra-practice concepts (`x-` ids). The student does not see a term's own name or an extra-practice kind's name on a card, and answers to those questions get no status. The kit has no Terms tab or extra practice yet. When those are ported, they can name their own concepts.
- Pharmacokinetics' fixed table of words for concept ids. It is now the `words` option, with no course values in the module.

## What does not change

- No course site changes. No course switches this module on, and no course repository was touched.
- `core/` and `template/` are unchanged (`git diff origin/main -- core template` is empty).
- A course without the module builds the same page as before.

## Review evidence

All results below are **agent-run** (the porter's hardening session, 2026-11-02 evening). Final tested commit: **`6d89a5e`** on `port/concept-statuses` (start of the hardening: `46e3156`). `origin/main` `6432c36`; core tree `a2dbf03`, template tree `cbac5bd`, both the same as `main`. Evidence branch: **`evidence/concept-statuses`** (`087648d`), folder `evidence/concept-statuses/`, with every command, its exit code and its log (`INDEX.md`, `logs/COMMANDS.tsv`). The `evidence/baseline` folder `main-98e7b5b/` is for core `c9fde5b`, so it was not cited; the no-module template course and Medicinal-chemistry were run here.

### Check results (agent-run, on `6d89a5e`)

| Check | Exit | Result |
|---|---|---|
| Module test on the module's own course (written by `ci/oncourse.js`), 3 runs | 0, 0, 0 | PASS 89, PASS 89, PASS 89 |
| `run_checks.sh` on that course | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`) |
| `core/ci_course.sh module:concept-statuses` (the kit's CI course) | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT |
| `ci/oncourse.js` run a second time on the same course | 1 | refuses, as designed |
| `core/ci_course.sh template` (no module) | 0 | 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT |
| `core/ci_course.sh medicinal-chemistry` (full history clone) | 0 | 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures; `cite_check.py`), 1 REPORT; `home_test.js` PASS, 36 checks |
| Module test, module absent (folder copied, not switched on) | 1 | FAIL 1 of 1, as required |
| Module test, template course without the fixture, formulas-in-text absent | 0 | PASS 89 |
| F5: plan-the-problem (`1226635`), equation-drill and formulas-in-text on; the test at `46e3156` | 2 | NOT RUN: "setup names the equation "auc-trap", which is not in EQUATIONS" |
| F5: the same course, the committed test (formulas-in-text present) | 0 | PASS 89 |
| Mutations, committed test | — | 23 of 23 caught |
| Mutations, the test at `46e3156` | — | 8 of 23 not caught (M8, M10, M11, M12, M13, M16, M17, M20); M23 caught only by a crash |
| WebKit (Safari), an iPhone, an iPad | — | NOT RUN: this container has Chromium only |

`git diff origin/main -- core template` is empty. No lookbehind in the module's files; no `ghp_` or `github_pat_` in any commit.

### Behaviour map (from Basic-Pharmacokinetics' code at `ac2eb73`)

| # | Behaviour in Basic-Pharmacokinetics (`ac2eb73`) | File and line | Kit module | What changed, and why |
|---|---|---|---|---|
| 1 | The Concepts section on Weak spots, after "This session" and before "What to review next" | `src/views.js` 2066 | ported | The module puts its section before the "What to review next" heading after the core draws Weak spots (`X.rendered`); at the end of the pane if that heading is missing. |
| 2 | The answer log grouped by concept in time order; a session ends after 30 minutes with no answer; an answer to a question no longer in the bank is left out | `src/views.js` 2455, 2540-2549 | ported | none |
| 3 | A solid answer is a correct one; a guess is a miss; "Not sure" on a flashcard is recorded as a guess | `src/views.js` 2462, 2511-2514 | adapted | The kit reads the core's `solidEntry`: a correct answer marked "Not sure" (`conf: 'shaky'`) is a miss, as in the core's own "solid". The evidence line counts those answers separately. |
| 4 | Mastered: 3 or more solid answers on 2 or more questions in 2 or more sessions, no miss in the last 3 | `src/views.js` 2551-2552 | ported | none |
| 5 | The six statuses and the order in which they are decided (mastered, learning, improving, returning, struggling, unfamiliar, learning) | `src/views.js` 2556-2578 | ported | none |
| 6 | The spaced check of a mastered concept: step 3 at mastery, one step up for each further solid answer, due `DAYS[box]` days or `CRAM[box]` questions after the last solid answer | `src/views.js` 2556-2566 | adapted | The steps come from the core's review paces (`PACES`): questions on Exam cram, days on Weekly or Semester (Semester's days while on cram), as the core's `schedule()` uses them. PK had two fixed tables. The core's exam-date shortening (`examGap`) is not applied to the module's own check; the scheduler's record, which has it, must also be due (row 7). |
| 7 | Due for spaced review: the module's check and the scheduler's own record both due; "Ask everything" does not make every mastered concept due (`_isDue`) | `src/views.js` 2580 | ported | none |
| 8 | When the check is due: "due now", "due after N more questions", "due in N days" | `src/views.js` 2581-2587 | ported | none |
| 9 | The wrong options in a wrong answer: only the wrong options of a select-all answer; none for a calculation; none for a term question | `src/views.js` 2590-2599 | ported | none |
| 10 | The wrong pairs of a matching answer | `src/views.js` 2595-2596 | adapted | Read in the core's form (the right-hand item picked for each left-hand item, by number). PK keyed the answer by the left-hand text. |
| 11 | The counts behind a card: attempts, misses, guesses, the last 5, sessions, wrong options chosen more than once, the most common kind of miss on missed calculations | `src/views.js` 2601-2618 | adapted | The kind of miss is read from the core's `miss` field and named with the core's `MISS_KINDS`; PK used `missKind` and `MISS_LABEL`. A calculation is `q.type === 'numeric'` (PK: `qType`). |
| 12 | The evidence line under a status, in exact counts | `src/views.js` 2620-2632 | adapted | Adds the count of correct answers marked "Not sure" (row 3). |
| 13 | A concept's name from its id, with a table of words (`CONCEPT_WORDS`: vd as VD, and so on) | `src/views.js` 2634-2646 | adapted | The table is the module option `words`; the module holds no course values. The CI course sets it to PK's table, verbatim. A word is looked up only as the table's own entry (`hasOwnProperty`), so an id word such as "constructor" is not read as a built-in property. |
| 14 | Names for term concepts (`term:`) and extra-practice concepts (`x-`), and the "Terms" place of a term question | `src/views.js` 2529-2537, 2642-2643, 2652 | omitted | The student does not see a term's own name or an extra-practice kind's name on a card, and answers to term or extra-practice questions get no status: the kit has no Terms tab or extra practice yet, and the core's `byId` finds only the bank's questions. |
| 15 | Where a concept sits: the topic and subtopic of its first question | `src/views.js` 2648-2654 | ported | none |
| 16 | Practice this concept: 3 of its questions, the ones answered longest ago first; Check: 1 question | `src/views.js` 2656-2660, 2717-2724 | adapted | The drill starts with the core's `drillList`; PK used `startSweepOf`. |
| 17 | The groups and their order: struggling and returning first (by misses, how recent the last miss is, and what one question is worth), then unfamiliar, then improving | `src/views.js` 2663-2673 | ported | none |
| 18 | A card: status, evidence line, topic, the wrong option chosen most often with why it is not the answer, the kind of miss, Practice this concept | `src/views.js` 2675-2690 | ported (fixed in this hardening) | PK sets the option text with `rich()` and the why with `rich(clip(plainMath(why), 400))`: a `{{frac:a|b}}` ratio is shown as (a)/(b), and the why is cut at a word. The port escaped the stored text, so a card showed the markup `{{frac:R|Cl}}` (inf-c5) and could cut a word. Fixed: the module now does the same as PK, with formulas-in-text's `rich()` when that module is on and plain escaped text when it is off. |
| 19 | The section: the count of each group, "What each status means", Due for spaced review with Run the checks, 8 weak cards and the rest folded, "No concept is weak on the answers so far.", Mastered folded away | `src/views.js` 2693-2716 | adapted | The fold adds one line: the mastered count at the top of Weak spots is the scheduler's own count (review step 3 or higher), so the two counts can differ. PR #23 (`review/concept-signals-proposal.md`) recommends further wording; not part of this port. |
| 20 | The styles of the section | `src/shell.html` 636-649 | ported | The class names `pw`, `pwhy` and `planbtns` are `cpw`, `cpwhy` and `cbtns`, so they do not meet the core's own classes. |

### Mutation table

Each mutation is one exact string replacement (or two, for M17) in a scratch copy of the module's own course, never committed (`scripts/mutations.py`). "Start" is the test at `46e3156`; "Now" is the committed test.

| Mutation | What it breaks | Now: check that FAILed (exit) | Start |
|---|---|---|---|
| M1 | mastery needs 2 sessions -> 1 | FAIL: the status rules hold on 13 synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning) (1) | FAIL: the status rules hold on 13 synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning) |
| M2 | no miss in the last 3 -> in the last 1 | FAIL: the status rules hold on 13 synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning) (1) | FAIL: the status rules hold on 13 synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning) |
| M3 | "Not sure" is solid again (PK's solid) | FAIL: a correct answer marked "Not sure" is a miss: it blocks mastery; the evidence line counts a "Not sure": 1 miss in 2 attempts, last 2 at 50% (1 of them a correct answer marked "Not sure") (1) | FAIL: a correct answer marked "Not sure" is a miss: it blocks mastery; the evidence line counts a "Not sure": 1 miss in 2 attempts, last 2 at 50% (1 of them a correct answer marked "Not sure") |
| M4 | struggling under 60% -> under 40% | FAIL: the status rules hold on 13 synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning) (1) | FAIL: the status rules hold on 13 synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning) |
| M5 | a session ends after 30 min -> after 50 h | FAIL: the status rules hold on 13 synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning); mastery starts the spaced check at the mastery box at the pace's intervals, and each further solid answer moves it up one; on the weekly pace the spaced check uses the weekly days; a concept mastered 40 days ago is due for its spaced check, one mastered minutes ago is not (1) | FAIL: the status rules hold on 13 synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning); mastery starts the spaced check at the mastery box at the pace's intervals, and each further solid answer moves it up one; on the weekly pace the spaced check uses the weekly days; a concept mastered 40 days ago is due for its spaced check, one mastered minutes ago is not |
| M6 | a solid answer after mastery no longer moves the check up a step | FAIL: mastery starts the spaced check at the mastery box at the pace's intervals, and each further solid answer moves it up one (1) | FAIL: mastery starts the spaced check at the mastery box at the pace's intervals, and each further solid answer moves it up one |
| M7 | the day steps ignore the pace in Settings | FAIL: on the weekly pace the spaced check uses the weekly days (1) | FAIL: on the weekly pace the spaced check uses the weekly days |
| M8 | due without the scheduler's own record being due | FAIL: a concept mastered 40 days ago is not listed as due while the scheduler's own record for it is not due (1) | not caught |
| M9 | "Ask everything" makes every mastered concept due (isDue) | FAIL: "Ask everything" does not list a concept mastered minutes ago as due (1) | FAIL: "Ask everything" does not list a concept mastered minutes ago as due |
| M10 | a select-all answer counts its correct options as wrong picks | FAIL: a select-all answer counts only the wrong options it picked (1) | not caught |
| M11 | repeated wrong options: chosen more than 3 times | FAIL: wrong options chosen more than once are all listed as repeated, one chosen once is not (1) | not caught |
| M12 | unfamiliar cards before struggling ones | FAIL: the struggling card comes first, then the unfamiliar one (1) | not caught |
| M13 | 80 cards shown, none folded | FAIL: 8 of the 13 weak concepts are shown and the rest folded (1) | not caught |
| M14 | kind of miss read from PK's missKind | FAIL: a calculation concept shows its most common kind of miss (1) | FAIL: a calculation concept shows its most common kind of miss |
| M15 | section at the end of Weak spots | FAIL: the section is drawn once, after "This session" and before "What to review next" (1) | FAIL: the section is drawn once, after "This session" and before "What to review next" |
| M16 | drawing creates scheduler records (st) | FAIL: drawing the Concepts section with no scheduler records leaves DB.concepts, DB.qn and the saved progress unchanged (1) | not caught |
| M17 | option text and why escaped as stored (the code before this fix) | FAIL: a card shows the ratio of the why as (R)/(Cl), with no {{frac:...}} markup (formulas-in-text off) (1) | not caught |
| M18 | the words option ignored | FAIL: the course's `words` option names the concept ("time-to-css" as "Time to Css") (1) | FAIL: the course's `words` option names the concept ("trapezoidal-auc" as "Trapezoidal AUC") |
| M19 | the evidence line leaves out "Not sure" | FAIL: the evidence line counts a "Not sure": 2 misses in 2 attempts, last 2 at 0% (1) | FAIL: the evidence line counts a "Not sure": 2 misses in 2 attempts, last 2 at 0% |
| M20 | a matching answer counts its right pairs as wrong | FAIL: a matching answer names each left item with the wrong right-hand item picked (1) | not caught |
| M21 | answers to questions no longer in the bank kept | FAIL: an answer to a question no longer in the bank reaches no concept (1) | FAIL: an answer to a question no longer in the bank reaches no concept |
| M22 | Check asks 3 questions | FAIL: Check starts a one-question spaced review of that concept (1) | FAIL: Check starts a one-question spaced review of that concept |
| M23 | drawing trims the answer log | FAIL: 8 of the 13 weak concepts are shown and the rest folded; drawing the Concepts section with no scheduler records leaves DB.concepts, DB.qn and the saved progress unchanged (1) | crash only |

The checks added for M8, M10, M11, M12, M13, M16, M17, M20 and M23 are new in this hardening. M17 is the fault fixed in the module.

### Persistence (QUALITY C)

The module saves nothing; it reads the answer log. The checks use a saved history of 4100 answers over every concept of the bank, then one more answer through the core's `record()`.

| Check | Result |
|---|---|
| 4100 saved answers load whole; the first concept (answered only in the first 100) has a status | PASS |
| After one more answer, the core keeps the last 4000 (`DB.answers.splice`); the statuses are those of exactly those 4000 | PASS |
| A concept answered only before the last 4000 answers has no status any more | PASS; core behaviour, reported (PR #23, case 5) |
| Export progress writes the 4000 answers (531 KB) | PASS |
| Import progress into a fresh browser profile: the same statuses, counts and Concepts section, and the same after a reload | PASS |
| Profile switch: a new profile shows only its own concept; switching back gives the first profile's statuses unchanged; the second keeps its own | PASS |
| Reload 50 ms after an answer | reported: the answer is lost; the core writes the progress 150 ms after the last change (core behaviour, not changed here) |
| Reload 400 ms after an answer: the answer is kept and the statuses read it | PASS |
| Storage full (`QuotaExceededError`): the notice is shown, the saved progress is not overwritten, the section still draws from this visit's answers, and after storage works again the saved progress loads with the same statuses | PASS (4 checks) |
| Storage denied (`SecurityError`): the same 4 checks | PASS (4 checks) |

### Faults and findings

- **Fixed in the module:** `{{frac:...}}` markup shown on a concept card, and a why cut in the middle of a word (M17; behaviour map row 18).
- **Fixed in the test:** F5 (plan-the-problem switched off in the scratch copies).
- **Course data, reported, not changed:** with the earlier Module 1 fixture on the module's own course, `run_checks.sh` gave 4 FAIL. `m1-ord-c07`'s stem says "The table below" (`browser_test.js`). `m1-auc-n02`'s `dupOf` names a question the fixture lacked (`test.js`). The topic held one concept (`test.js` section 7). `output_test.js` and `checks_test.js` failed because they run `test.js`. The fixture now holds other real questions; no question was reworded.
- **Core behaviour, reported, for a core proposal if wanted:** an answer followed by a reload within 150 ms is lost; the answer log keeps 4000 answers.
- **Not a module fault:** the dark colour scheme renders the page the same as the light one without the theme module, so the dark screenshot was identical and is not kept.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
