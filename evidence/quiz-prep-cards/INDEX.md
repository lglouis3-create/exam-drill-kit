# Evidence: quiz-prep-cards (port queue item 7, kit pull request "Port (incomplete): quiz-prep-cards")

Every result here is **agent-run** (the hardening session, 2026-11-02 evening). The coordinator adds
its own re-runs, labelled coordinator-verified, in `evidence/quiz-prep-cards/coordinator/`.

## Inputs

| What | Value |
|---|---|
| Source read | lglouis3-create/Basic-Pharmacokinetics- at `ac2eb73` (`src/`, read-only clone `/tmp/pk-readonly`) |
| Port branch, starting commit | `port/quiz-prep-cards` at `e407385` (already merged with main `6432c36`) |
| Port branch, final tested commit | `5918202` (59182023a56127655ad821e75961b31043e8a8fb) |
| origin/main | `6432c36` (6432c36709ad3dc3ab78d8558239971b18234aec) |
| core tree (branch and main) | `a2dbf03d6ccea270f77ac440f3fd8b7a86d855cf` |
| template tree (branch and main) | `cbac5bd425d480944293f8e1fb5d5d703e8baba1` |
| node, python | v22.23.4, Python 3.13.18; Chromium only (no WebKit run in this container) |

**Baseline reuse.** The branch's core and template trees are exactly those of the coordinator's
baseline `evidence/baseline`, folder `main-6432c36/` (commit `f8a22d5`: core `a2dbf03`, template
`cbac5bd`, Medicinal-chemistry `f1f5ee5`, full clone), and `git diff origin/main -- core template` is
empty. So the no-module template course (24 PASS, 0 FAIL, 1 NOT RUN `cite_check.py`, 1 REPORT) and
Medicinal-chemistry (23 PASS, 0 FAIL, 2 NOT RUN `stepper_test.js` and `cite_check.py`, 1 REPORT;
`home_test.js` 36 checks PASS) are cited from there, not rerun.

## The module's own course (rule 4)

`features/quiz-prep-cards/ci/oncourse.js` writes the fixture of `test.js` (`const FIX`) into a fresh
template course. The fixture is Basic-Pharmacokinetics' own data at `ac2eb73`, copied as it is
(`tools/extract.js` reads it, `tools/mkfix.js` writes the line):

- `COURSE.quizzes`: Quiz 5 (`2026-10-19T08:00`, 24 minutes, modules [9, 8]) and Quiz 4
  (`2026-10-05T08:00`, 24 minutes, modules [6, 7]), with covers, quote, said and src as written;
- 20 questions with their real ids and modules: 15 of the 18 items of the professor's graded Quiz 4 and
  Quiz 5 (`src/q13_quizzes.js`) and the 5 questions their `dupOf` names (`m6b-c16`, `m6b-c14`,
  `m7-c03`, `pd-c20`, `nl-c04`);
- the 6 TOPICS entries (`multi`, `intermit`, `multoral`, `bioavail`, `pkpd`, `nonlin`), the 5 lectures
  (L08 to L12) and the 7 skills those questions name (4 added to the template's).

**The one change:** every `prof` is the template's "Professor". The professor's name is nowhere in the
kit branch or in this evidence (the raw extract, which holds it in `prof` fields, is not published).

**Left out, not reworded** (each refused by the kit core's bank check, `core/test.js`, as written):

| Question | Why |
|---|---|
| cq4-1 | its cite ("Canvas Quiz 4 ... question 1; transcript ...; Shargel 7e Chapter 9") names no deck in `COURSE.lectures` |
| pd-c13, nl-c01 | true/false items with 2 options; the core asks for 3 or more |
| cq5-2, pd-c14 | their dupOf chain reaches pd-c13 (a dangling dupOf fails `core/test.js`) |
| cq5-5, nl-c09 | their dupOf chain reaches nl-c01 |

The quizzes' dates are in the past. The data keeps them; the test sets the page's clock with an init
script that moves `Date` to a fixed local time (Fri 2 Oct 2026 12:00, Mon 12 Oct 12:00, and Mon 19 Oct
07:00, 08:10 and 08:24).

Findings in the real data, reported and not changed: the course's own `covers`, `said` and `src`
lines use "Her" and "she" for the professor (for example "Her poll put it the other way round"); the
card shows them as the course wrote them. No stem trips `style_check.js` (27 stems clean).

## Behaviour map (Basic-Pharmacokinetics `ac2eb73` against `features/quiz-prep-cards/current/`)

| # | Behaviour in the source | Source (PK `src/`) | Port | Status |
|---|---|---|---|---|
| 1 | one card per quiz in `COURSE.quizzes` while it is ahead and not hidden | views.js 478-483 | quiz-prep-cards.js 41-44, 94 | ported |
| 2 | a quiz is ahead until `when` plus `minutes` | views.js 480 | 41-42 | ported |
| 3 | the quiz's questions: those whose `module` it names | views.js 478 | 32-35 | adapted: `topics` (TOPICS ids) also accepted, since kit questions carry `topic` |
| 4 | the day and time, in the browser's locale | views.js 486-487 | 72-74 | ported |
| 5 | the days-left line: calendar days, "today", "in progress", "over" | views.js 2404-2417 | 48-58 | ported (a copy for quizzes; the core's own countdown is for the active exam only) |
| 6 | what the quiz covers, after the days left | views.js 493 | 81 | ported |
| 7 | Hide button, tooltip "Hide this card" | views.js 494 | 82 | adapted: the tooltip names the quiz ("Hide the Quiz 5 prep card on this browser until the quiz is over"); the core's `scheduler_test.js` reads "hide this card" as an offer to skip a question |
| 8 | the professor's words (quote) | views.js 496 | 84 | ported |
| 9 | "What she said to prepare", the said lines through `mathHTML` | views.js 497 | 63-68, 85-86 | adapted: heading "What the professor said to prepare"; only `<sub>`, `<sup>`, `<b>`, `<i>`, `<em>` kept; `{{frac:a\|b}}` stacked by formulas-in-text when on, written (a)/(b) when off; the panel shows only when `said` has lines |
| 10 | the said panel stays open across a redraw of Topics (`PANEL_OPEN.qsaid`) | views.js 473, 497 | none | omitted: the student sees the panel closed again after Topics is drawn again |
| 11 | the source under the said lines | views.js 498 | 87 | ported |
| 12 | Concepts row when the quiz has concepts; Calculations row when it has calculations | views.js 499-500 | 88-89 | adapted: both rows only when the quiz has both kinds (with one kind, either row repeats "Everything") |
| 13 | Everything on this quiz, adaptive | views.js 501, 699-704, 872-878 | 90, 99-110 | ported |
| 14 | Straight pass, each once, shuffled | views.js 502, 880-886 | 91, 106 | ported (the row names the count) |
| 15 | the drill label `<quiz> prep — concepts` | views.js 869, 701 | 104 | ported |
| 16 | a calculation: a typed number, or a matching item of quantities with a calc skill | views.js 213-219 | 37 | adapted: a typed number only |
| 17 | "Set-up only: which equation?" row | views.js 503-504 | none | omitted: the student has no set-up drill on the quiz's scope (plan-the-problem's) |
| 18 | "Sit a practice quiz" with question and minute chips (`beginQuiz`) | views.js 474-475, 505-510, 516-546, 705-708 | none | omitted: the student has no timed practice quiz; the kit's exam engine draws only the active exam's paper (a core change) |
| 19 | Hide stores `<ns>:quizhide:<id>` = '1' and redraws Topics | views.js 472, 709 | 26, 111, 124 | ported (through the core's `store`) |
| 20 | the cards at the top of Topics, after the exam facts | views.js 560 | 115-121 | adapted: under the build stamp or What's new, above the filters (the kit core has no exam-facts block) |
| 21 | Settings: "Show the hidden quiz card again" only when a quiz ahead is hidden | views.js 3734-3738 | 128-136 | adapted: the section is always there; it names the hidden quizzes, or says "No card is hidden" |
| 22 | Show again sets every flag to '0' | views.js 3785 | 112 | adapted: removes the keys (same effect) |
| 23 | the card's styles | shell.html 433-442 | quiz-prep-cards.css | adapted: class names of the kit's Topics cards |
| 24 | (kit only) the build step refuses bad quiz data | none | step.js | added: PK checked none of this |
| 25 | quizzes over several days (BDK) | none in PK | none | omitted: a quiz here has one start time (a core change) |

## Mutation checks

`mutations.py` applies each mutation as an exact string replacement that must match once, to a copy of
the module's own course (`tools/mkci.sh`), builds, and runs the module test. Run: `TMPDIR=... python3
mutations.py /tmp/port-quiz-prep-cards/course mutations/` (exit 0; log `logs/mutations_run1.log`; each
mutation's test output in `mutations/<id>.log`). Result: **33 of 33 mutations caught** (exit 1 each).
The mutations were run on the test as committed in `5918202`; the checks that the old test (at
`e407385`) lacked were written first, while rebuilding the test on the real data, so no mutation
needed a further check. No mutation is on the port branch.

| Mutation | File | What it breaks | Exit | Checks that failed |
|---|---|---|---|---|
| M01 | quiz-prep-cards.js | a quiz scope ignores `modules` | 1 | every quiz covers at least one question, and only questions of the topics or modules it names (2 quizzes); the Quiz 5 card offers concepts (0), calculations (0), everything (0) and a straight pass (0) |
| M02 | quiz-prep-cards.js | no question counts as a calculation | 1 | the Quiz 5 card offers concepts (4), calculations (4), everything (8) and a straight pass (8) |
| M03 | quiz-prep-cards.js | the quiz ends at its start, not start plus minutes | 1 | the days-left line for Quiz 5 (2026-10-19T08:00, 24 minutes) at 5 fixed times; Quiz 5 is ahead until its start plus its 24 minutes (08:24), and not after; Mon 19 Oct: Quiz 5 says quiz day at 07:00 and in progress at 08:10, and its card is gone at 08:24, its start plus 24 minutes |
| M04 | quiz-prep-cards.js | days left counted in hours rounded up, not calendar days | 1 | the days-left line for Quiz 5 (2026-10-19T08:00, 24 minutes) at 5 fixed times; Mon 19 Oct: Quiz 5 says quiz day at 07:00 and in progress at 08:10, and its card is gone at 08:24, its start plus 24 minutes |
| M05 | quiz-prep-cards.js | no in-progress line | 1 | the days-left line for Quiz 5 (2026-10-19T08:00, 24 minutes) at 5 fixed times; Mon 19 Oct: Quiz 5 says quiz day at 07:00 and in progress at 08:10, and its card is gone at 08:24, its start plus 24 minutes |
| M06 | quiz-prep-cards.js | a hidden card is never hidden | 1 | Hide removes the card and the choice survives a reload; Settings offers to put the hidden card back, by name |
| M07 | quiz-prep-cards.js | a card for every quiz, over or hidden | 1 | one card per quiz still ahead and not hidden (0 of 2); Hide removes the card and the choice survives a reload; Mon 12 Oct: no card for Quiz 4, which is over; Quiz 5 is 7 days away; Mon 19 Oct: Quiz 5 says quiz day at 07:00 and in progress at 08:10, and its card is gone at 08:24, its start plus 24 minutes; the hidden Quiz 4 card stays hidden in both profiles (one browser); a reload at once (under 150 ms) and 400 ms after Hide keeps the hidden card hidden (Quiz 5 both times; Quiz 4 shows again after Show again); quota: Hide shows the notice that nothing was saved, and the card is hidden for this visit; quota: with storage working again, the saved flag and the 8 answers load; the Hide that was not saved is not applied; denied: Hide shows the notice that nothing was saved, and the card is hidden for this visit; denied: with storage working again, the saved flag and the 8 answers load; the Hide that was not saved is not applied |
| M08 | quiz-prep-cards.js | <sub> and <sup> shown as text | 1 | every said line is listed (8 and 11), with each <sub> and <sup> kept; {{frac:a|b}} is written (a)/(b) when formulas-in-text is off |
| M09 | quiz-prep-cards.js | {{frac}} left raw without formulas-in-text | 1 | {{frac:a|b}} is written (a)/(b) when formulas-in-text is off |
| M10 | quiz-prep-cards.js | the straight pass asks one question twice | 1 | the Quiz 4 straight pass queues each of its 12 questions once; the two straight passes record 22 answers (9 on Quiz 5, 13 on Quiz 4), all on the quizzes' questions |
| M11 | quiz-prep-cards.js | concepts and calculations drills not narrowed | 1 | the concepts drill (8) has no typed number and the calculations drill (8) only typed numbers |
| M12 | quiz-prep-cards.js | Hide kept for the visit only, not stored | 1 | Hide removes the card and the choice survives a reload; Settings offers to put the hidden card back, by name |
| M13 | quiz-prep-cards.js | Show again does nothing | 1 | the card is back on Topics and Settings says no card is hidden |
| M14 | quiz-prep-cards.js | Settings offers back a hidden card of a quiz that is over | 1 | a hidden card of a quiz that is over is not offered back in Settings |
| M15 | quiz-prep-cards.js | the cards go above the heading, not under the stamp | 1 | the cards sit under the build stamp or the What's new card, above the Topics filters |
| M16 | quiz-prep-cards.js | Settings does not name the hidden quiz | 1 | Settings offers to put the hidden card back, by name |
| M17 | quiz-prep-cards.js | the first tooltip, which the core reads as skipping a question | 1 | the Hide button says what it hides |
| M18 | quiz-prep-cards.js | what the quiz covers is not shown | 1 | the Quiz 5 card names the quiz, its day and time, the days left (17) and what it covers; the Quiz 4 card says 3 days until the quiz |
| M19 | quiz-prep-cards.js | the professor's words are not shown | 1 | the card carries the professor's words and the source |
| M20 | quiz-prep-cards.js | the source is not shown | 1 | the card carries the professor's words and the source |
| M21 | quiz-prep-cards.js | the drill is not labelled as the quiz's prep | 1 | Everything on this quiz starts the drill on Quiz 5's 8 questions: every fixture question of modules 9 and 8, and only those modules; the concepts drill (4) has no typed number and the calculations drill (4) only typed numbers; the Quiz 4 straight pass queues each of its 12 questions once |
| S01 | step.js | a misspelt field is accepted | 1 | a field the module does not read stops the build and says so |
| S02 | step.js | a tag in covers, quote or src is accepted | 1 | a tag in covers stops the build and says so |
| S03 | step.js | any tag in a said line is accepted | 1 | a tag other than sub, sup, b, i, em in a said line stops the build and says so |
| S04 | step.js | two quizzes with one id are accepted | 1 | two quizzes with one id stops the build and says so |
| S05 | step.js | negative minutes accepted | 1 | minutes below 0 stops the build and says so |
| S06 | step.js | a when that is not YYYY-MM-DDTHH:MM accepted | 1 | a when that is not YYYY-MM-DDTHH:MM stops the build and says so |
| S07 | step.js | a quiz that covers no question accepted | 1 | a quiz that covers no question stops the build and says so |
| S08 | step.js | a module no question carries accepted | 1 | a module no question carries stops the build and says so |
| S09 | step.js | a topic TOPICS does not have accepted | 1 | a topic that TOPICS does not have stops the build and says so |
| S10 | step.js | an id with a space accepted | 1 | an id with a space stops the build and says so |
| S11 | step.js | an empty quiz list accepted | 1 | no quizzes stops the build and says so |
| S12 | step.js | said that is not a list accepted | 1 | said that is not a list stops the build and says so |

## Module absent

`tools/absent.sh`: the module's own course with `quiz-prep-cards.js` and `.css` emptied, built
(exit 0), then the module test: **FAIL**, 1 of 1 checks ("the page carries quiz-prep-cards,
working"), exit 1 (`logs/module_absent.log`).

## Persistence (QUALITY C), all automated in `test.js`, agent-run

The module saves one thing: the hide flag, `<ns>:quizhide:<quiz id>` = '1', through the core's
`store`, written at once (no timer). The answers given in the quiz drills are the core's progress.

| Test | Result |
|---|---|
| Export, then Import into a fresh browser (new context, profile "Fresh"), after 18 answers on the two straight passes (8 on Quiz 5, 10 on Quiz 4) and one hidden card | the same 18 answers (question and result, in order) and 18 concepts come back; the export holds no hide flag, so both cards show in the fresh browser (the flag is per browser, as in PK) |
| Profile switch to "Other" and back | "Other" has 0 answers; back on the first profile the 18 answers are there; the hidden Quiz 4 card stays hidden in both profiles (one browser, one flag, as in PK) |
| Reload under 150 ms after Hide (in the same script as the click) | the card stays hidden |
| Reload 400 ms after Hide | the card stays hidden |
| Reload under 150 ms after an answer in a quiz drill (core behaviour) | 0 of 1 answer kept: the core writes the progress 150 ms after the last change, so an answer followed at once by a reload is lost. Reported, not fixed (core) |
| Reload 400 ms after an answer | 1 of 1 kept |
| Storage full (`setItem` throws QuotaExceededError) | Hide shows the core's notice "This browser did not save your progress ..."; the card is hidden for the visit; the saved Quiz 4 flag and the 8 saved answers are unchanged; after storage works again and a reload, the Quiz 4 flag and the 8 answers load, and the Quiz 5 hide that was not saved is not applied |
| Storage denied (`setItem` throws SecurityError) | the same four results |

## Commands, exit codes and logs (agent-run)

| # | Command | Exit | Log |
|---|---|---|---|
| 1 | `node tools/extract.js /tmp/pk-readonly/src > pk_extract.json` (not published: it holds the name in `prof`) | 0 | none |
| 2 | `node tools/mkfix.js pk_extract.json tools/fix_line.txt`, `node tools/gentest.js tools/test.tpl.js tools/fix_line.txt features/quiz-prep-cards/current/test.js` | 0, 0 | `tools/fix_line.txt` |
| 3 | `tools/runci.sh module:quiz-prep-cards` (core/ci_course.sh) on the working tree, try 1 | 1: core `test.js` 8 failures (7 dangling dupOf, cq4-1 cites no deck) | `logs/ci_course_try1.log` |
| 4 | the same, try 2 (dupOf targets added) | 1: core `test.js` 2 failures (pd-c13, nl-c01 have 2 options); the module test's single-answer helper did not answer a select-all question | `logs/ci_course_try2.log` |
| 5 | the same, try 3 (the leave-out rule; the helper fixed) | 0 | `logs/ci_course_try3.log` |
| 6 | `tools/mkci.sh` (the module's own course for the mutations) | 0 | `logs/mkci_mutation_base.log` |
| 7 | `python3 mutations.py /tmp/port-quiz-prep-cards/course mutations/` | 0 (33 of 33 caught) | `logs/mutations_run1.log`, `mutations/` |
| 8 | `tools/absent.sh` | build 0, test 1 (expected FAIL) | `logs/module_absent.log` |
| 9 | commit `5918202` on `port/quiz-prep-cards`, pushed | 0 | none |
| 10 | `tools/runci.sh module:quiz-prep-cards` at `5918202` | 0: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no lecture PDFs), 1 REPORT (`explain_check.js`); `home_test.js` 36 PASS; `features/quiz-prep-cards/test.js` 54 PASS | `logs/ci_course_module_5918202.log` |
| 11 | `tools/three.sh` at `5918202`: `mkci.sh`, then the module test three times | 0; 0, 0, 0 (54 checks PASS each) | `logs/module_test_x3.log`, `logs/module_test_run{1,2,3}.log`, `logs/mkci_5918202.log` |
| 12 | `tools/runci.sh modules:formulas-in-text,quiz-prep-cards` at `5918202` (the partner present) | 0: 27 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT; `features/formulas-in-text/test.js` 12 PASS; `features/quiz-prep-cards/test.js` 54 PASS, with "the two {{frac:a\|b}} of said line 5 are stacked" | `logs/ci_course_with_formulas_5918202.log`, `logs/checks-with-formulas/` |
| 13 | `node tools/shot.js` (Topics with the clock on Fri 2 Oct 2026, 12:00) | 0 | `quiz5-card-2026-10-02.png`, `cards-2026-10-02.png` |
| 14 | GitHub "Kit checks" run 41544110430 on `5918202` | all 6 jobs success: Chromium · module:quiz-prep-cards (job 125615414308), Chromium · template, Chromium · template-unset, Chromium · medicinal-chemistry, WebKit · template (informational), Modules to check | GitHub |

The partner absent is runs 10 and 11 (formulas-in-text off: "{{frac:a|b}} is written (a)/(b)").
`logs/unmutated_test.log` is a run on a course built before the final fixture (54 PASS); it is
superseded by run 11. The per-check logs of run 10 were removed with the scratch folder before they
were copied; its summary is in its log, and runs 11 and 12 repeat the module test.

NOT RUN: WebKit (Safari) for the module (not installed in this container; the GitHub WebKit job is
the template course only); an iPhone or iPad; the module on Pharmacokinetics' whole bank (829
questions), since Pharmacokinetics is not moving.

## For a core proposal (not changed here)

1. `core/views.js` `teachParts` (137-139) renders a teach section only when it has `t`; PK writes its
   sections as `{h, list: [...]}`, so the 20 PK questions in the module's course show an empty
   concept block.
2. `core/test.js` asks 3 or more options of every single-answer question; PK's true/false items
   (pd-c13, nl-c01) are refused, and the quiz items whose dupOf reaches them go with them.
3. `core/test.js` asks every cite to name a lecture deck; PK's graded quiz item cq4-1 cites the Canvas
   quiz, a transcript and the textbook only.
4. The core writes the progress 150 ms after the last change: an answer followed at once by a reload
   is lost (0 of 1 kept above).
5. Already listed in `review/port-queue.md`: several exams on one site (for the timed practice quiz)
   and quizzes over several days.
6. `features/README.md` says a `ci/oncourse.js` prefixes ids; under rule 4 this one keeps the course's
   real ids, and the test's scratch copy adds only the topics, questions, lectures and skills the
   course does not already have.
