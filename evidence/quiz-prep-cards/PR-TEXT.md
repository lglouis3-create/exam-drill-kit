<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

Title: Port (incomplete): quiz-prep-cards

Port queue item 7, Tier 2 (`review/port-queue.md`). It needs your yes before it merges, and it stays a draft until the coordinator marks it ready. Pharmacokinetics' code was only read, from a read-only copy at `ac2eb73`.

## What the feature does

The module brings the Pharmacokinetics drill's quiz prep cards into the kit (`src/views.js` 466-512, the buttons at 699-709, the quiz days-left line at 2409-2417, and the Settings part at 3734-3738 and 3785).

- **What the kit already shows.** The kit core's Topics tab shows only the exam the page prepares for: its name, number of questions, minutes, date and days left. It shows nothing about quizzes. This module adds the quizzes.
- **A card for each quiz.** Each quiz the course lists gets a card at the top of Topics, under the build stamp and the What's new card, above the filters. The card stays until the quiz is over (its start time plus its minutes) or until the student hides it. A card shows:
  - the quiz's name, day and time, and the days left ("3 days until the quiz.", "Quiz day is today.", "The quiz is in progress.");
  - what the quiz covers, as the course wrote it;
  - the professor's words about the quiz, and under "What the professor said to prepare" the list of points with the transcript they come from;
  - four drills over the questions of the topics (or question modules) the quiz covers: "Concepts on this quiz, adaptive", "Calculations on this quiz, adaptive", "Everything on this quiz, adaptive" (missed concepts come back first; the drill stops when nothing is due), and "Straight pass" (each question once, shuffled). The concepts and calculations rows show only when the quiz has both kinds. A calculation is a question with a typed number.
- **Hide.** The Hide button keeps that card off Topics on that browser until the quiz is over. A new Settings section, "Quiz prep cards", has "Show the hidden quiz card again" and names the hidden quizzes; with none hidden it says "No card is hidden." The hide choice is kept per browser, as in Pharmacokinetics: it holds for every profile on that browser and is not in Export progress.

## What changes

- New folder `features/quiz-prep-cards/current/` holds the module code, its styles, a build step, `module.json` and its test.
- New file `features/quiz-prep-cards/ci/oncourse.js` builds the module's own course for the kit's checks (`core/ci_course.sh module:quiz-prep-cards`). The GitHub job "Chromium · module:quiz-prep-cards" (job 125588267962) failed because this file was missing; on the final commit that job passes. The course is Pharmacokinetics' own data, copied from the test's fixture with nothing invented:
  - `COURSE.quizzes`: Quiz 5 and Quiz 4, with their real dates (19 and 5 October 2026), minutes, modules, covers, quote, said lines and source;
  - 20 questions with their real ids and modules: 15 of the 18 items of the professor's graded Quiz 4 and Quiz 5 (`src/q13_quizzes.js`) and the 5 questions their `dupOf` names;
  - the 6 topics, 5 lectures and the skills those questions name.

  The one change to the data: every `prof` is set to "Professor". Seven questions are left out, not reworded, because the kit core's bank check refuses them as written: cq4-1 (its cite names no lecture deck), pd-c13 and nl-c01 (true/false items with 2 options; the core asks for 3 or more), and cq5-2, pd-c14, cq5-5 and nl-c09, whose `dupOf` leads to those two. The quiz dates stay as written; the test sets the page's clock instead of moving the dates. The questions keep their real ids (rule 4), so this script does not prefix ids as `features/README.md` describes; the test's scratch copy adds only what the course does not already have.
- The quizzes are course data in `course.js`, in the shape Pharmacokinetics already uses: `COURSE.quizzes = [{id, name, when: 'YYYY-MM-DDTHH:MM', minutes, topics: [TOPICS ids] and/or modules: [question module values], covers, quote, said: [lines], src}]`. The module holds no dates, names or modules of its own. `topics` is new for the kit, whose questions carry a `topic`; Pharmacokinetics' `modules` still works.
- The build stops, with the reason, when:
  - `COURSE.quizzes` is missing or empty;
  - a quiz names a topic that `TOPICS` does not have, or a module no question carries;
  - a quiz covers no question;
  - `when` is not a date and time written `YYYY-MM-DDTHH:MM`, or `minutes` is not a number of 0 or more;
  - two quizzes have one id, or an id has a character other than letters, digits, `-` or `_`;
  - a quiz has a field the module does not read (a misspelt field);
  - `said` is not a list of text;
  - `covers`, `quote` or `src` carries an HTML tag, or a said line carries a tag other than `<sub>`, `<sup>`, `<b>`, `<i>` and `<em>`.

  The test checks twelve of these.
- In a said line, `{{frac:a|b}}` is stacked when `formulas-in-text` is on and written (a)/(b) when it is off.
- Text the module writes says "the professor", not "she" or "her". The course's own `covers`, `quote`, `said` and `src` lines are shown as the course wrote them; Pharmacokinetics' own lines use "Her" and "she" for the professor (for example "Her poll put it the other way round"), and they are not reworded.
- The Hide button's tooltip is "Hide the <quiz name> prep card on this browser until the quiz is over". The first wording, "Hide this card", made the core's `scheduler_test.js` fail: its check that no control offers to skip a question or mark it known reads "hide this card" as such a control. The button hides a quiz's card, not a question, so the tooltip now says what it hides; the check is unchanged and passes.
- Catalog bookkeeping:
  - `FEATURES.md`: a new `quiz-prep-cards` entry (v1 from PK `90b60da`, 2026-10-04, the first commit with `quizCards`), with the test and two known issues (the said panel closes when Topics is drawn again; the hide flag is per browser).
  - `features/README.md`: one row added.
  - `review/port-queue.md`: item 7 set to `partial (left: the timed practice quiz, the "Set-up only" row, quizzes over several days, matching items counted as calculations)`.
  - `CHANGELOG.md`: one entry under 2026-11-02.
- **Not ported:**
  - **"Sit a practice quiz"** (`beginQuiz`, the question and minute chips). In Pharmacokinetics it runs a timed paper with the quiz's own title, clock and id on its exam engine. The kit's exam engine draws only the active exam's paper, and several papers on one site are a core change (`review/port-queue.md`, "Core changes found by the assessments"), so this port leaves it out and does not touch the core's exam handling.
  - **"Set-up only: which equation?"** on the card. That row starts plan-the-problem's set-up drill on the quiz's scope; plan-the-problem (pull request #11) does not have the quiz scope.
  - A matching item of quantities counted as a calculation (Pharmacokinetics' `kindOf`). Here a calculation is a typed-number question only.
  - The "What she said to prepare" panel staying open when Topics is drawn again (`PANEL_OPEN.qsaid`). Here the panel closes.
  - Quizzes that run over several days (BDK). A quiz here has one start time and a length in minutes; multi-day quizzes are listed as a core change.

## What does not change

- No course site changes. No course switches this module on, and no course repository was touched.
- The exam the page prepares for, the exam countdown and the Exam sim are unchanged.
- `core/` and `template/` are unchanged (`git diff origin/main -- core template` is empty; core tree `a2dbf03`, template tree `cbac5bd`, the same as main `6432c36`).
- A course without the module builds the same page as before.

## Check results (2026-11-02, agent-run, on `5918202`)

- **Before and after.** The module's test, run on the module's own course built with the module's code emptied: 1 of 1 checks FAIL. With the module: 54 checks PASS. No lookbehind was rewritten, because the ported code had none.
- **The module's test** (Pharmacokinetics' `src/review_test.py` lines 76-108 ported to Node Playwright, without the practice-paper checks), three times on the module's own course: 54 checks PASS each time.
  - On the course's own data: every quiz covers at least one question, and only questions it names; one card per quiz still ahead.
  - On Quiz 5: the days-left line at 5 fixed times; the end of the quiz at its start plus its 24 minutes.
  - The build-step refusals: 12 of 12 stop the build with their reason.
  - In Chromium, with the page's clock set: on Fri 2 Oct 2026 a card for each quiz, Quiz 5 "17 days" and Quiz 4 "3 days"; on 12 Oct no card for Quiz 4, which is over; on 19 Oct "Quiz day is today." at 07:00, "The quiz is in progress." at 08:10 and no card at 08:24. The card's day, covers, quote, source and all said lines (8 and 11), with every `<sub>` and `<sup>` kept and `{{frac}}` written (a)/(b); the four rows with their counts (Quiz 5: 4 concepts, 4 calculations, 8 in all); the drills hold only the quiz's questions; the straight pass asks each once; the Hide tooltip; the cards under the stamp and above the filters; Hide survives a reload; Settings names the hidden quiz, puts the card back, and does not offer a hidden card of a quiz that is over; no page error and no module error.
  - The persistence checks listed under "Review evidence".
- **The module's own course** (`core/ci_course.sh module:quiz-prep-cards`): 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no lecture PDFs), 1 REPORT (`explain_check.js`). In that run `home_test.js` passed 36 checks and `features/quiz-prep-cards/test.js` 54.
- **With `formulas-in-text` also on** (`core/ci_course.sh modules:formulas-in-text,quiz-prep-cards`): 27 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT; the module test passed 54 checks, with the two fractions of said line 5 stacked.
- **Template course with no module, and Medicinal-chemistry.** The branch's core and template trees are exactly those of the coordinator's baseline (`evidence/baseline`, folder `main-6432c36/`, commit `f8a22d5`), so these are cited from it and not rerun: template course 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT; Medicinal-chemistry `f1f5ee5`, full clone, 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures; `cite_check.py`: no PDFs), 1 REPORT, with `home_test.js` 36 checks PASS.
- **GitHub, "Kit checks" run 41544110430 on `5918202`:** all 6 jobs success: Chromium · module:quiz-prep-cards (job 125615414308), Chromium · template, Chromium · template-unset, Chromium · medicinal-chemistry, WebKit · template (informational), Modules to check.
- **NOT RUN anywhere:**
  - WebKit (Safari) for the module, an iPhone and an iPad. This container has Chromium only; the GitHub WebKit job runs the template course only.
  - The module on Pharmacokinetics' whole bank (829 questions). Pharmacokinetics is not moving; its two quizzes and 20 of its questions were used.

## Review evidence

Every result in this section is agent-run. Final tested commit: `5918202` (59182023a56127655ad821e75961b31043e8a8fb), started from `e407385`. Evidence branch: `evidence/quiz-prep-cards` (commit `ad187f2`), with every command, its exit code and its log, the mutation script, and screenshots.

### Behaviour map (Basic-Pharmacokinetics `ac2eb73` against `features/quiz-prep-cards/current/`)

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

### Mutation checks

`mutations.py` (on the evidence branch) breaks the module on purpose, one exact string replacement at a time, on a copy of the module's own course, and runs the module test. 33 of 33 mutations are caught (exit 1 each). None is on the port branch.

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

### Persistence (all automated in `test.js`)

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

### For a core proposal (not changed here)

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

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
