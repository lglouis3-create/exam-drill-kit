<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

Title: Port (incomplete): terms-variables

Port queue item 3, Tier 2 (`review/port-queue.md`). It is a draft until the coordinator marks it ready, and it needs your yes before it merges. Pharmacokinetics' code was only read, from a read-only copy at `ac2eb73`.

## What the feature does

The module adds a **Terms tab** with three parts. It reads two kinds of course data. Either one may be missing; the tab then offers what the other gives.
- `TERMS`: the course's term list. This is the same shape the `glossary-tap` module (pull request #13) reads, so one data file serves both.
- `ASKS`: the course's symbols, `{key: [symbol, meaning]}`. This is the same shape the `plan-the-problem` module (pull request #11) reads, so one data file serves both. Each calculation question names the symbol it asks for in its `asks` field.

The three parts (ported from Pharmacokinetics' Terms tab, `src/views.js` lines 1029-1260):
- **Flashcards.** A card shows a situation that shows a term in action, with the term's own words blanked out. "Show the term" shows the term, its one-line meaning, its definition and the professor's point. "Knew it", "Not sure" and "Did not know" are recorded as an answer.
- **Quiz me.** Up to three questions per term: which term a situation describes, what a term means, and which term a definition belongs to. The wrong options are first the term's look-alikes (`confuse`), then terms of its group. The questions are drilled by the scheduler like any other set, all terms or one group at a time, and missed terms come back first.
- **The variables quiz** (under Quiz me): what each symbol in the professor's calculation problems stands for. Three kinds of question:
  - which symbol one of the professor's own calculation stems asks for (the stem's question sentence; a sentence that names its own answer is left out);
  - what a symbol means;
  - which symbol a meaning belongs to.
  The wrong options come first from the same family of symbols (the other concentrations, the other rate constants, and so on). When the `equation-drill` module is on, the Equations tab offers this quiz too, as Pharmacokinetics does (`src/views.js` lines 4173-4175).

These questions are kept out of the question bank, as in Pharmacokinetics: they are never on an exam paper, and the topic counts and the sweeps are unchanged.

**How it fits with the two open pull requests.**
- With #13 (`glossary-tap`): Pharmacokinetics' Glossary list is not repeated here; `glossary-tap` shows that list. This module's tab has the id `terms` and glossary-tap's has the id `glossary`, so both can be on. When both are on, the Terms tab links to the Glossary tab. This branch starts from `main`, which does not have glossary-tap, so the module does not need it.
- With #11 (`plan-the-problem`): the variables quiz reads `ASKS` in the shape #11 reads, and this module's build step checks `ASKS` the same way.

## What changes

- New folder `features/terms-variables/current/`: the module code, its styles, a build step, `module.json` and its test.
- New `features/terms-variables/ci/oncourse.js`: the script the kit's checks on GitHub run to build the module's own course (see "The module's own course" below).
- `features/ci-combinations.txt`: one line, `terms-variables,equation-drill`, so the checks on GitHub also run the module with its optional partner present. This combination was not named by you; it is labelled as added by this port.
- Pharmacokinetics' tables that were code become options:
  - `families`: its symbol families (`VAR_FAMILY`);
  - `names`: the usual names of each symbol (`VAR_NAMES`);
  - `twins`: two symbols its wording cannot tell apart (`VAR_TWINS`);
  - `groups`: the module names on the Module chips (in Pharmacokinetics, "7b" is worked out in code).
  - Also `label` (tab name, default "Terms"), `before` (default Settings), `cite` (the source shown on a "what does this symbol mean" question), `skill`.
  - Without `families`, every `ASKS` key is drilled, in one family.
- Pharmacokinetics splits a stem into sentences with a regex lookbehind (`src/views.js` line 1087), which older Safari cannot read. The module splits without it and gives the same sentence on all 534 of Pharmacokinetics' numeric stems. (Corrected: the first version of this text said 829 stems; 829 is the whole bank, and the number re-counted this session is the 534 calculation stems.)
- The build stops with the reason when:
  - there is neither `TERMS` nor `ASKS`;
  - a term id is used twice, or a term has no name, group, definition or source;
  - there are fewer than 4 terms;
  - a term's `module` is not a number, or its `confuse` is not a list;
  - an `ASKS` entry is not `[symbol, meaning]`;
  - an option names a symbol that `ASKS` does not have;
  - fewer than 5 symbols are drilled;
  - a calculation's `asks` is not in `ASKS`;
  - a bank question's id starts with `term-` or `var-` (the module's own ids).
  A `confuse` id that is not a term is skipped, as Pharmacokinetics skips it, so a course can use part of its term list.
- Catalog bookkeeping:
  - `FEATURES.md`: Pharmacokinetics added to the `glossary` entry (it was missing); a new `terms-variables` entry; the `variables-quiz` entry points to it.
  - `features/README.md`: one row added.
  - `review/port-queue.md`: item 3 set to `partial (left: Weak spots listing these answers and a reload returning to the question, both need a core change; weak-spot marks, term figures and quotes on the cards)`. (Corrected: the first version set it to `done`.)
  - `CHANGELOG.md`: one entry under 2026-11-02.

## What is not ported, and why

- **Weak spots.** The core's Weak spots finds an answered question by its id in the bank only. Answers to these questions are recorded (the scheduler's state and the answer history), but Weak spots does not list them; Pharmacokinetics lists them under the skill "Terms". Listing them needs a core change, so it is left for its own pull request.
- **A reload during a term or variables drill** comes back to Topics, not to the question, for the same reason (the core finds the question by id in the bank).
- **Pharmacokinetics' Glossary mode** (the list, its search box, the letter bar and the button back to the search): this is `glossary-tap` (#13).
- Weak-spot marks on the term cards, and term figures and quotes on the cards.

## What does not change

- No course site changes. No course switches this module on, and no course repository was touched.
- `core/` and `template/` are unchanged (`git diff origin/main -- core template` is empty at the final tested commit, with `main` at `6432c36`).
- A course without the module builds the same page as before.

## Fixes from the coordinator's integration check (evidence/integration `1329222`)

- **F5 (F5b for this module).** The test's scratch copies keep Pharmacokinetics' `setup` lines, which name equations the course need not have, so with `plan-the-problem` on the scratch copy did not build and the test was NOT RUN. The test now switches `plan-the-problem` off in its scratch copies, as it already did for `glossary-tap`. The new `ci/oncourse.js` leaves a `setup` line out when the course has no such equation.
- **F5d.** The comparison with Pharmacokinetics' own output counted variable questions made from the course's own questions with `asks` (120 instead of 108). In the scratch copy the course's own questions now lose `asks`, so the variables quiz there is made from the test's questions alone, and all of it is compared: 108 questions, the same ids and keyed answers as Pharmacokinetics' own code makes. (This differs from the candidate patch, which filtered the ids: when the course holds a question with the same sentence, the module asks that one in its place, and a filter cannot see that.)

## The module's own course (rule 4)

`features/terms-variables/ci/oncourse.js` writes it from the test's fixture, which is Pharmacokinetics' own data at `ac2eb73`: 8 terms (`src/glossary.js`), the calculation questions with `asks` and their topics (`src/q1_module1.js` to `src/q4_module4.js`), its lectures L01-L05 and the 5 skills those questions carry (`src/course.js`), all of `ASKS` (`src/shell.html`) and its three symbol tables (`src/views.js`), as the module's options. Ids are prefixed `tvc-`. Nothing is written for the test, and the template's sample questions carry no module data.

The one recorded change to the data: every `prof` is the course's professor ("Professor"). The fixture also reads "The professor" in 9 places where Pharmacokinetics' worked steps print "Dr." and the professor's name; that was already in the fixture before this hardening, and it keeps the kit free of personal names. Please say whether that second change may stay.

What the script leaves out, and why:
- 2 of the 10 questions (`m2-n-d3a`, `m2-n-vp1`) and the 2 topics only they fill: their `cite` names only practice-sheet solutions, which Pharmacokinetics' `course.js` lists as no lecture, and the core's `test.js` fails on a question that cites no lecture deck. The test's own scratch copies keep all 10.
- 8 `teachImg` fields: Pharmacokinetics' image crops are not in the course's `images.json`, and with them the core's `browser_test.js` stops (core finding 3 below).
- 8 `setup` lines (see F5).
- A term whose name the course's own term list already has (none on the template).

## Check results

All results are agent-run, on the final tested commit `8641b3f` unless named otherwise.

- **Same questions as Pharmacokinetics' own code** (working tree with the same module code, `scripts/wholebank.js`): on Pharmacokinetics' whole bank, `TERMS` and `ASKS` at `ac2eb73`, its own code makes 282 term questions and 301 variable questions (201 from stem sentences, 2 each for 50 symbols); the module makes the same 282 and 301, with the same ids in the same order, 0 stems and 0 keyed answers differing. The question sentence is the same on 534 of 534 numeric stems. 94 terms. (Removed from the first version: the build step on Intro to Pharmacology's 295 terms, which was not re-checked this session.)
- **Before and after.** The module's test, on the module's own course built with the module's code left out: 1 of 1 checks FAIL. With PK's lookbehind split put back into the module, `device_lint.js` fails 2 of 3 checks.
- **The module's own course** (`ci/oncourse.js`): the module test 3 times, 57 PASS, 0 FAIL each time (2 skipped: the Glossary link and the Equations tab, because those modules are not on). `run_checks.sh`: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no lecture PDFs), 1 REPORT (`explain_check.js`). The same through `core/ci_course.sh module:terms-variables`: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT.
- **With `equation-drill` on** (`core/ci_course.sh modules:terms-variables,equation-drill`): 28 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT; this module's test 59 checks (1 skipped: glossary-tap not on), `equation-drill`'s 30, `formulas-in-text`'s 12.
- **With `glossary-tap` on as well** (its files from branch `port/glossary-tap` `4762fe5`, each module switched on by its own `ci/oncourse.js`; not part of this branch): this module's test 60 checks, including a Terms tab and a Glossary tab, no element id twice, the Terms tab's Glossary button opening the Glossary tab, no page error; `glossary-tap`'s own test 56 checks.
- **Template course, no module on** (`core/ci_course.sh template`): 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT. Not cited from a baseline: this branch's core tree is `a2dbf03`, not the baseline's.
- **Medicinal-chemistry `main` (`f1f5ee5`), full clone, this branch's core copied in:** `run_checks.sh` 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures; `cite_check.py`: no lecture PDFs), 1 REPORT. `home_test.js`: 36 checks PASS.
- **Not checked:**
  - WebKit (Safari): NOT RUN here, because this container has Chromium only (the kit's checks on GitHub run WebKit as information).
  - With `plan-the-problem` on at the same time (it is on another branch; the test switches it off in its scratch copies).

## Review evidence

Evidence branch: **`evidence/terms-variables`** (`1ab42a4`), folder `evidence/terms-variables/`: `INDEX.md`, `COMMANDS.tsv` (every command with its exit code), the logs, the per-check logs of each `run_checks.sh`, the scripts, the mutation script and tables. Final tested commit: **`8641b3f96c37f09b89c7ef85419794c312500a4f`** (start `15c69ac`; added `78a38c2` merge of main `366caf6`, `e958fe2` this hardening, `8641b3f` merge of main `6432c36`). Core tree `a2dbf03`, template tree `cbac5bd`.

### Behaviour map (agent-run reading of `src/views.js` at `ac2eb73`)

| # | Behaviour in the source | Source lines | Status | Note |
|---|---|---|---|---|
| 1 | A term's own name and abbreviation blanked in its situation and definition | 1040-1045 | ported | |
| 2 | Term wrong options: `confuse` terms first, then its group, then any term | 1046-1051 | adapted | an option whose text repeats one already chosen is skipped; same result on PK's 94 terms |
| 3 | Three questions per term (situation, meaning, definition), the second and third marked as duplicates of the first | 1052-1070 | adapted | a term with no situation gets no situation question; one with no one-line meaning uses its definition, the term blanked |
| 4 | Term questions carry `skill: 'term'`, an `exam`, and the professor's name as `prof` | 1055-1058 | adapted | the course's first professor; `skill` is the option `skill`; no `exam` (never on a paper) |
| 5 | The concept block lists the definition and the professor's point | 1058 | adapted | one paragraph with both |
| 6 | Symbol families, usual names, twins as tables in the code | 1076-1083, 1092-1095, 1101 | adapted | course options `families`, `names`, `twins` |
| 7 | The question sentence of a stem (last question, else last "calculate/find/..." sentence; table rows skipped) | 1085-1091 | adapted | no regex lookbehind; same sentence on 534 of 534 numeric stems |
| 8 | A sentence naming its symbol, the symbol's usual name or a symbol of its family is not asked | 1097-1099 | ported | |
| 9 | Variable wrong options: the same family first, never a twin | 1100-1106 | adapted | an option whose text repeats one already chosen is skipped |
| 10 | Per symbol: what it stands for, which symbol a meaning is, one question per distinct question sentence; low-yield items and part headers left out | 1107-1136 | ported | 301 of 301 on PK's bank |
| 11 | A symbol's module: its earliest calculation, module 9 ("7b") ordered as 7.5 | 1111-1113 | adapted | plain module order; the option `groups` names the chips |
| 12 | The questions kept out of the bank, off exam papers | 1029-1036 | ported | |
| 13 | These answers counted in Weak spots under "Terms" | 1035-1036 | omitted | the student does not see them in Weak spots (needs a core change) |
| 14 | Variables block under Quiz me: all variables and each family | 1137-1147 | adapted | family rows only with more than one family |
| 15 | Terms tab modes and group and module chips | 1176-1190 | adapted | Glossary mode is glossary-tap's tab, linked when on; module chips only with more than one module |
| 16 | Glossary mode: term cards, search, A-Z, letter bar, back-to-search button | 1160-1175, 1191-1205, 1234-1258 | omitted here | glossary-tap (#13) shows this list |
| 17 | Flashcards: situation with the term blanked, Show the term, Knew it / Not sure / Did not know recorded, the end card | 1206-1218, 1236-1243 | adapted | a term with no situation shows its definition, blanked; the shown side adds the professor's point and the source |
| 18 | Flashcard order reshuffled when the group changes | 1208 | adapted | also when the module changes |
| 19 | Quiz me Start drills all terms or one group, by the scheduler | 1219-1224, 1244-1245, 872-877 | adapted | the pool also follows the module chip (PK's ignores it) |
| 20 | The Equations tab offers the variables quiz | 4173-4175 | ported | when equation-drill is on |
| 21 | Weak-spot marks, term figures and quotes on the term cards | 1160-1166 | omitted | the student does not see a figure or the professor's quote on a term card |
| 22 | A reload during a term or variables drill | core | omitted | it comes back to Topics, not to the question (needs a core change) |

### Mutation table (agent-run; `scripts/mutations.py`, one exact replacement each, in a scratch copy; none committed)

| Mutation | Check that failed | Exit |
|---|---|---|
| M1 the term is not blanked | no situation or definition stem prints the term it asks for | 1 |
| M2 look-alikes not first | the wrong options of the term questions whose term has look-alikes are those look-alikes first * | 1 |
| M3 family not first | the wrong options of the variable questions come from the same family first * | 1 |
| M4 twins allowed | twins are never each other's wrong option | 1 |
| M5 a sentence naming its answer is asked | the variable questions are the 108 Basic-Pharmacokinetics' own code makes | 1 |
| M6 first question of a stem taken | the question sentence is Basic-Pharmacokinetics' on 9 control texts and 9 numeric stems | 1 |
| M7 every flashcard mark recorded right | Did not know on card 2 is recorded as a wrong answer * | 1 |
| M8 a variable question put into the bank | ids unique, none a bank question, none in the bank | 1 |
| M9 no de-duplication of sentences | the variable questions are the 108 ... | 1 |
| M10 the Equations tab does not offer the quiz (equation-drill on) | the Equations tab offers the variables quiz | 1 |
| M11 Show the term shows nothing | Flashcards: card 1 ...; Show the term shows it | 1 |
| M12 a term group's Start drills every term | first run: not caught (exit 0); check added: one group drills only its terms' questions; rerun: caught | 0, then 1 |
| M13 a family's Start drills every symbol | one family drills only its symbols | 1 |
| M14 the meaning question has no keyed option | every question has one keyed option among four or more ... | 1 |
| M15 variable answers under the wrong concept | a right answer is recorded under the symbol's concept | 1 |

\* a check added in this hardening from the behaviour map, before the first mutation run.

### Persistence results (agent-run, in the module's test, 60 answers to the module's questions)

The module saves nothing of its own: its answers go through the core's recording, under the concepts `term:<id>` and `var:<key>`.

| Case | Result |
|---|---|
| Reload more than 150 ms after the last answer | all 60 answers and their scheduling state come back; all 10 tabs render with them, no page error |
| Reload less than 150 ms after an answer | reported (core behaviour): that answer is not in the progress after the reload, but is in the answer history |
| Export, then Import into a fresh browser profile | the 60 answers, their scheduling state and their history come back |
| Profile switch | each profile keeps its own answers |
| Storage full part-way | the notice is shown; the 20 answers saved before are not overwritten; after storage works again, all 31 are saved and load after a reload |
| Storage denied | the drill runs, 10 answers recorded for the visit, the notice is shown |

### For separate core proposals (the core was not changed)

1. Weak spots finds a question by its id in the bank only, so these answers are not listed there.
2. A reload during a term or variables drill comes back to Topics, for the same reason.
3. `core/browser_test.js` (its figure check, lines 150-157) reads `q.options` of every question with a `teachImg`; a calculation question with a `teachImg`, which Pharmacokinetics has, stops the check.
4. A reload less than 150 ms after an answer keeps the answer in the history but not in the progress, so the two disagree by that answer.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
