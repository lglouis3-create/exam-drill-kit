<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

Port queue item 6, Tier 2 (`review/port-queue.md`). It needs your yes before it merges. Pharmacokinetics' code and data were only read, from a read-only copy at `ac2eb73`.

## What the feature does

The module brings the Pharmacokinetics drill's paper choice and its list of papers into the kit (`src/shell.html` 1108-1128 and 1174-1186, `src/views.js` 3108-3136 and 3146-3168).

- **Choose the paper.** The Exam view's opening page and Settings show one chip per exam in `course.js` `exams` that a paper can be drawn for. The course's current exam (`activeExam`) is chosen at first. The choice is kept with the profile's saved progress, as `DB.paperPicker`, so it survives a reload.
- **A paper for an earlier exam.** When another exam is chosen, the opening page says the paper is drawn at that exam's blueprint, shows the exam's own description, and shows a table: each of its pools, how many questions it supplies, and how many the bank holds. The paper is then drawn from that exam's pools. Each pool supplies its share of the paper by its marks, and the exam's own select-all count is used. The draw is the engine's own (`drawMixed`), so the engine's rules hold: one question per concept before a concept repeats, and never two wordings of one fact on one paper. The paper is shuffled.
- **The rule for an old choice** (Pharmacokinetics' `pickExam`). An exam chosen before it was sat gives way to the current exam once it is over. An exam chosen after it was sat (to review it) stays chosen.
- **Your papers so far.** Under the start button, a table lists each paper submitted on a page with the module on, newest first: the exam it was drawn for, the day, the score, the blank items and a bar with the percentage. The 12 newest are shown and the 100 newest are kept. The result page of a paper for an earlier exam says "This paper was drawn for <exam>."
- **What it says plainly to the student.** The note under the chips says that Topics, Weak spots and the exam-weighted pass follow the course's current exam, whatever is chosen. When the bank holds too few questions for the chosen exam's pools, the page says so (on Pharmacokinetics' own data in the kit: "its pools can supply 16 of the 40" for Exam 1) and says the paper is drawn for the current exam; the paper started then is the current exam's.

## How it is built, and its limits

- The paper choice uses the `X.paper` hook, as asked. The hook must return as many questions as the engine drew, and the clock and the way typed items are shown follow the current exam. So a paper for another exam keeps the current exam's length and clock.
- For that reason an exam is offered as a chip only when it has the current exam's question count, time limit and `typed` setting, no `blueprint` (counts per topic), and marks on every pool. The build step (`step.js`) leaves every other exam off the chips, and the Exam view names each one with the reason, for example "Other paper (5 questions, and the current exam has 4 questions)". For Pharmacokinetics all three exams have 40 questions and 120 minutes, so all three are offered.
- The build stops only when an exam has no id or two exams share one, because the choice is kept by the exam's id. An earlier version of this branch also stopped the build for an exam of another length or clock. That broke two core checks on a course with the module on (`scheduler_test.js` and `nullexam_test.js` build test copies with such exams), so those exams are now left off instead.
- **The paper list keeps its own record.** The core keeps no record of past papers. The module writes one entry per paper into the progress (`DB.paperPicker.papers`: when, exam, right, total, blank, and whether it was submitted with blank items) when the result page is first drawn. It covers papers submitted on a page with this module on. It does not cover papers from before the module was switched on. The result page itself is still lost on a reload, as in the core: the list keeps the score, not the answers.
- Opening the Exam view or Settings adds nothing to the saved progress. Only a choice, a paper started for a chosen exam, or a submitted paper does.

## What changes

- `features/paper-picker/current/` holds the module code (`paper-picker.js`), a build step (`step.js`), `module.json`, its test (`test.js`) and the test's course data (`test_fixture.js`). The module has no options and reads only `course.js` `exams`.
- **New in this version:** `test_fixture.js` holds Pharmacokinetics' own data, taken from its files at `ac2eb73` with nothing written for the test: its three exams as the course has them (40 questions, 120 minutes, select-all 4, pools and marks 16/16/8, 7/7/20/6 and 15/15/5/5, with their descriptions), `activeExam` 3, its 12 lectures, and 118 of its questions with the 11 topics, 9 skills and 9 images they use. The one change to the data: the professor is set to the course's own first professor (the template's "Professor"), so the kit holds no personal name. In a course the lectures' ids carry the prefix `pp-`, because the template already has a lecture `L01`. Which questions are taken follows a stated rule (in the file's header): no calculation or matching item, not low-yield, no professor's name in the text, and the core's own rules for a question. The earlier version of the test changed the data (6-question papers, Exam 3's marks scaled to 2/2/1/1) and used 18 questions; that is gone.
- **New in this version:** `features/paper-picker/ci/oncourse.js` writes the same data into a fresh course for the kit's checks on GitHub (the shape agreed in PR #12). It is outside `current/`, so courses never copy it.
- **New in this version:** the test's two chip checks now look only at the module's own chips (`data-ppexam`). Before, they also matched study-controls' layout chips, so the test failed when study-controls was on (finding F3 of the coordinator's integration check).
- Catalog bookkeeping:
  - `FEATURES.md`: the `paper-picker` entry under "Exam simulation additions". Its version line gives the first Pharmacokinetics commits, found with `git log -S` on a full clone: `fa9c49d` (2026-09-22) for `chooseExam`, `8ce8de2` (2026-09-28) for the paper list, `71ce449` (2026-10-26) for the rule for an old choice. Its Known issues and Test lines are updated in this version.
  - `features/README.md`: one row added.
  - `review/port-queue.md`: item 6 set to `partial` (left: the Progress view's list of practice papers; the line saying when the bank holds fewer select-all items than the exam asks; Topics, Weak spots and the weighted pass following the chosen exam, and papers of another length or clock, which need several exams on one site in the core). The first version said `done`, which was wrong.
  - `CHANGELOG.md`: one entry under 2026-11-02.

## Not ported, and why

- **Topics, Weak spots and the exam-weighted pass following the choice.** In Pharmacokinetics they followed it (`setActiveExam`). In the kit that needs "several exams on one site", which is listed under "Core changes found by the assessments (not nightly)". It is not done here.
- **A paper of another length or clock** than the current exam's. Same reason.
- **A shorter paper when the bank cannot fill an exam's pools.** Pharmacokinetics drew a shorter paper; the hook cannot, so the module draws the current exam's paper and says so.
- **The exam result kept after a reload, with past attempts.** Also a listed core change; not done here. The module's list keeps the scores only.
- **Pharmacokinetics' quiz papers and the "practice" label** in its list (`paperOf` with `COURSE.quizzes`). They belong to quiz-prep-cards (port queue item 7).
- **The Progress view's list of the 8 newest practice papers** (`views.js` 2020-2029). Not ported: the student sees the list on the Exam view only. (The first version of this text did not mention it.)
- **Pharmacokinetics' select-all line** (`sataLine`, from `sataShares`): when the bank holds fewer select-all items than the exam asks, Pharmacokinetics said so and moved a pool's select-all share to a pool that had some. The module splits the count by marks as the kit's own draw does, and its page says "About 4 of the 40 are select-all" from the exam's count even when the paper will carry fewer (Exam 2 on this data carries 3, because its Module 4 pool holds no select-all question). The first version of this text said the kit's core already drew to the pools and so this was not needed; that was not the whole difference.

## What does not change

- No course site changes. No course switches this module on, and no course repository was touched.
- `core/` and `template/` are unchanged (`git diff origin/main -- core template` is empty).
- The module's code (`paper-picker.js`, `step.js`) is unchanged in this version.
- A course without the module builds the same page as before.

## Review evidence

All results below are **agent-run** (the hardening session, 2026-11-02). Evidence branch: **`evidence/paper-picker`** (folder `evidence/paper-picker/`, with `INDEX.md`, every command and its exit code, the logs, the scripts, two screenshots). The coordinator's own re-runs go in its `coordinator/` folder.

**Final tested commit:** `ed152dee6f408add9b24e6a0aedad1dc1f59bce8` (`port/paper-picker`; started from `c1709f5`). origin/main `98e7b5b`; core tree `c9fde5b`, template tree `cbac5bd`.

### Behaviour map (from Pharmacokinetics' code, `ac2eb73`)

| # | Behaviour in the source (file:line) | In the kit module | Status |
|---|---|---|---|
| 1 | The paper's exam is `COURSE.activeExam` unless the student chose another (`shell.html` 1107-1110, 1113-1118 `pickExam`) | `chosen()` returns the course's current exam unless an offered exam is chosen | ported |
| 2 | The choice is kept with the progress, with the time it was made (`views.js` 3112-3115 `chooseExam`) | kept as `DB.paperPicker.exam` and `.at` | adapted: another field name, same content |
| 3 | A choice of an exam that is over gives way to the current exam, unless made after that exam ended (`shell.html` 1110-1118) | same rule | ported |
| 4 | An exam ends at its `when` (else its `date` at 23:59) plus its minutes (`shell.html` 1112 `examEnds`) | same; an exam with no ISO date never ends | ported |
| 5 | No change of choice while a paper runs (`views.js` 3113) | `choose()` refuses while a paper runs | ported |
| 6 | One chip per exam on the Exam view, the chosen one pressed, a note under them (`views.js` 3118-3123, 3159) | one chip per exam the build step offers; the others named with the reason | adapted: the hook keeps the current exam's length and clock |
| 7 | No chips when the course has one exam (`views.js` 3119) | nothing shown | ported |
| 8 | The chips also in Settings (`shell.html` 1108) | `X.settings` "Practice paper" | ported |
| 9 | Each pool's share by marks, largest remainder (`shell.html` 1174-1186 `poolShares`) | `shares()`: same method | ported |
| 10 | A question belongs to the first pool it matches; lowYield items stay off (`shell.html` 1137-1139; `views.js` `poolDrawable`) | first pool by the core's `poolFilter`; no lowYield; typed items only when the exam takes them | ported |
| 11 | The select-all count split by marks, a share moved from a pool with none (`shell.html` 1187-1215 `sataShares`) | split by marks as the core's `drawPaper`; no moving of a share | adapted |
| 12 | Never two wordings of one fact; one question per concept first (`views.js` 3172 `drawN`) | the core's `drawMixed`/`drawN`, one blocked set per paper | ported |
| 13 | A short bank leaves marks off and draws a shorter paper (`views.js` 3083-3108, 3141-3143) | no paper for that exam; the page says how many its pools can supply and that the paper is drawn for the current exam | adapted |
| 14 | The opening page: the exam, its count and minutes, its pools and what the bank holds (`views.js` 3146-3156) | same for another exam, with its description and the current exam's clock | ported |
| 15 | Topics, Weak spots and the weighted pass follow the choice (`shell.html` 1119-1126 `setActiveExam`) | they follow the current exam; the page says so | omitted: the student does not get them for the chosen earlier exam (core change) |
| 16 | A paper of another exam's length and clock (`setActiveExam`) | such an exam gets no chip | omitted: the student cannot sit an earlier exam of another length or time limit |
| 17 | Each submitted paper recorded: when, exam, right, total, blank (`views.js` 3374-3376) | recorded by the module when the result page is first drawn | adapted |
| 18 | The 100 newest records kept (`views.js` 3376) | same | ported |
| 19 | "Your papers so far": newest first, the 12 newest, name, day, score, blank, bar, percentage (`views.js` 3124-3136, 3164) | same | ported |
| 20 | A record names the exam the paper was drawn for (`views.js` 3374) | the draw is recorded and matched; the result page says which exam | adapted |
| 21 | A quiz paper listed as "<quiz> practice" (`views.js` 3129, 3268 `paperOf`) | not done | omitted: belongs to quiz-prep-cards (item 7) |
| 22 | The Progress view lists the 8 newest practice papers (`views.js` 2020-2029) | not done | omitted: the list is on the Exam view only |
| 23 | The select-all count the bank can supply, said on the page (`views.js` 3137-3143 `sataLine`) | not done; the page gives the exam's own count | omitted: the student is not told when the paper carries fewer |
| 24 | Papers sat before the feature existed listed (`DB.exams`) | not listed | omitted: the core keeps no record |
| 25 | The exam's id may be a number (`views.js` 3168, 3781) | ids compared as strings on the chips | ported |
| 26 | (kit only) the build step leaves off an exam a paper cannot be drawn for, with the reason; stops the build for a missing or shared id (`step.js`) | — | added for the kit |

### Mutation checks

27 mutations of `paper-picker.js` and `step.js`, each applied to a scratch copy only (script `mutations.py`). First pass: 22 of 27 caught. Five were not caught, so the test got five new checks (the split of a paper size the marks do not divide; the result page drawn again records the paper once; an exam left off cannot be chosen; a pool short of single-answer questions is topped up from its own select-all questions; the paper is shuffled). Second pass of those five: 5 of 5 caught.

| Mutation | Check that failed (first named) | Exit |
|---|---|---|
| M1 shares without the largest remainder | a paper of 7 is split as the largest-remainder method says (added) | 1 |
| M2 every question put in the first pool | the module's pools hold the questions the core's pool filter puts in them | 1 |
| M3 an old choice never gives way | Exam 1 chosen before it was sat gives way to Exam 3 | 1 |
| M4 a choice made after its exam not kept | choosing Exam 2 keeps the choice | 1 |
| M5 the choice can change while a paper runs | the choice cannot change while a paper runs | 1 |
| M6 a paper recorded at each drawing of its result page | the result page drawn again keeps one record (added) | 1 |
| M7 no limit of 100 papers | 101 papers: the 100 newest are kept | 1 |
| M8 every paper listed | 101 papers: the 12 newest are listed | 1 |
| M9 the list oldest first | the list shows the newest paper first | 1 |
| M10 every paper recorded for the current exam | the result page names the exam the paper was drawn for | 1 |
| M11 the draw not recorded | after a reload during the paper it is still recorded as drawn for Exam 2 | 1 |
| M12 reading the state creates it | opening Settings and the Exam view adds nothing to the progress | 1 |
| M13 no select-all item asked of a pool | Exam 2: the paper carries 3 select-all items | 1 |
| M14 blank items not counted | a paper submitted with 39 blank is kept with its blank count | 1 |
| M15 the other exam's paper drawn but not used | its paper is 40 questions from Modules 4-7 | 1 |
| M16 no note when the bank is too small | Exam 1's pools hold too few questions: the page says so | 1 |
| M17 a chip for every exam | an exam left off cannot be chosen (added) | 1 |
| M18 no chips in Settings | Settings offers the same chips (the click times out) | 1 |
| M19 step: another question count offered | an exam with another question count is left off | 1 |
| M20 step: two exams with one id accepted | two exams with one id stops the build | 1 |
| M21 typed items on a paper that does not take them | the module's pools hold the questions the core's filter puts in them | 1 |
| M22 an exam ends at its start | an exam ends at its `when` plus its minutes | 1 |
| M23 the result page does not name the exam | the result page names the exam | 1 |
| M24 the list does not name the exam | "Your papers so far" lists it: Exam 2 | 1 |
| M25 the chosen chip not marked | the current exam chosen; choosing Exam 2 marks its chip | 1 |
| M26 a short pool not topped up from its own select-all items | a pool with one single-answer question too few gives its share (added) | 1 |
| M27 the paper not shuffled | the paper is shuffled, not drawn pool by pool (added) | 1 |

### Persistence (checks in the module test, every run)

| Case | Result |
|---|---|
| 101 papers submitted, reload after 400 ms | the 100 newest kept, 12 listed, all 100 the same after the reload |
| A reload during a paper | the same paper at the same question, still recorded for Exam 2 |
| Reload at once (under 150 ms) after a choice | the choice was lost in every run: the core saves 150 ms after the last change (reported, not a check) |
| Reload 300 ms after a choice | kept |
| Export, then Import into a fresh profile | the choice and the 100 papers come back the same |
| Profile switch | each profile keeps its own choice and papers |
| Storage denied (`SecurityError`) | the student is told; the saved progress is not overwritten; the change is saved once storage works and loads after a reload |
| Storage full (`QuotaExceededError`) | the student is told; nothing saved is overwritten; after storage works, a reload loads what was saved before (the change made while full is lost, as the notice says) |

### Check results (each agent-run, on `ed152de`)

| Check | Result |
|---|---|
| `ci/oncourse.js` on a fresh course, then `build.py` | exit 0, exit 0 |
| `ci/oncourse.js` a second time on that course | exit 1, refuses (as designed) |
| Module test on that course (Pharmacokinetics' 3 exams), 3 runs | PASS 74, PASS 74, PASS 74 |
| `run_checks.sh` on that course | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`: 20 of 125 questions) |
| Module test with study-controls present, Pharmacokinetics' 3 exams | PASS 74 |
| Module test with study-controls present, template course with 1 exam | PASS 57 |
| Module test with study-controls absent, template course with 1 exam | PASS 57 |
| The old chip selectors with study-controls present (F3, before the fix) | FAIL 2 of 62 |
| Module test on a page built without the module's code | FAIL 1 of 1, as it must |
| Template course without the module; Medicinal-chemistry (`f1f5ee5`, full clone) | cited from `evidence/baseline` `main-98e7b5b/` (the core and template trees are the same): 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT; and 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures; `cite_check.py`: no PDFs), 1 REPORT |
| Lookbehind in the module's files; token grep | none; none |

**NOT RUN:**
- WebKit (Safari), an iPhone or an iPad. This container has Chromium only.
- A paper for a chosen exam with typed items (`typed: true` on both exams). Pharmacokinetics' exams have no `typed`, so the real data has none.
- Pharmacokinetics' whole bank: the kit course holds 118 of its 829 questions (the rule above). With them, Exam 1's Module 2 pool holds no question, so a paper for Exam 1 is not drawn in the kit course.

### Findings

- **Module faults:** none found; the module's code is unchanged.
- **Test fault fixed:** F3 (the chip selectors also matched study-controls' chips).
- **Course data findings (not reworded):** 10 of Pharmacokinetics' choice stems trip the core's `style_check.js` (for example "given as", "described as", "according to"); 3 explanations contain the word "undefined", which the core's `browser_test.js` and `nullexam_test.js` read as a page fault; 56 of its 829 questions name the professor in their text. These are left out of the kit course.
- **study-controls' own test** (another pull request) fails 3 of 61 on this course: its F2 (a 120-minute clock), and it chooses Exam 1 as the earlier exam, which this course cannot draw. For the study-controls port.
- **For a core proposal:** several exams on one site (rows 15 and 16); the result page kept after a reload; a save when the page is closed, so a change made less than 150 ms before a reload is not lost.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
