<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

**Status: draft, Port (incomplete).** Under rule 5 it stays a draft while these remain (`review/port-queue.md` item 21 is `partial`):
- matching and fill-in cards on the one-page quiz;
- "Not sure" and "I guessed" on earlier one-page cards, which needs a core change (the confidence buttons change only the last recorded answer).

Needs (`module.json` `needs`): none. Optional partner tested: `paper-picker` (#21, not on `main`), present and absent, on a 1-exam course and on Pharmacokinetics' 3-exam course.

At the final tested commit `f8004dd`, these passed: the module test and `run_checks.sh` on the module's own course of real Intro to Pharmacology data (coordinator-verified, below); and the three blocking GitHub "Kit checks" jobs (Chromium on template, template-unset and medicinal-chemistry, run 41528673888 on `f8004dd`, checked by the coordinator). The informational WebKit job failed; it is not Safari, and it does not block a merge. Safari, real operating-system dialogs and an iPad hardware keyboard are NOT RUN. The combination run with every module on has not been repeated on this commit.

Port queue item 21, Tier 2b (`review/port-queue.md`). It needs your yes before it merges. The port started after 2026-11-02 11:00 CT, after Intro to Pharmacology's Exam 4. Intro to Pharmacology's code was only read, from a read-only copy at `929cd62`. As you asked, only Intro to Pharmacology's version is ported; BDK's code was not read, because BDK's keyboard shortcuts are part of the BDK move.

**Changed since the first version of this pull request (reviews of 2026-11-02 evening):**
- The first review found four faults in the module; all four are fixed on this branch (commit `8622653`). The test went from 38 checks to 59 (61 when paper-picker is on).
- The second review (this version, commits `5fe1188`, `54f6d3c`, `6661669`, `f8004dd`) changed the test and its course data only, not the module:
  - The module's course is now Intro to Pharmacology's own data, written by `ci/oncourse.js`.
  - Fault F2 of the coordinator's integration check is fixed in the test: it assumed papers under 100 minutes and exam ids that are text.
  - The checks of a paper drawn for an earlier exam now pick an exam the bank can draw (the coordinator's note from the paper-picker review).

See "Review evidence" at the end.

## What the feature does

The module `study-controls` adds four study controls from the Intro to Pharmacology drill (`exam1-drill/src/app.js`). Each one has its own on/off option in `course.js`.

- **Flags** (`flags`, on by default).
  - A Flag button on every quiz card, on the exam question and on every question of the exam result. A second tap removes the flag.
  - Topics gets a row with the number of flagged questions, **Drill flagged** (every flagged question once, shuffled) and **Clear flags** (it asks first).
  - On an exam paper, the numbers of the flagged questions are listed on the question bar, and each number moves to its question. Intro to Pharmacology marks them on its question grid; the kit's paper has no grid.
  - The flags are kept in the saved progress (`DB.flags`), so they follow the profile, Export, Import and Erase.
  - Other modules can read and set the flags with `FX.api('study-controls')`: `isFlagged(id)`, `flagged()`, `set(id, on)`, `toggle(id)`, `button(id)`, `onChange(fn)`. Queue item 10 (Pharmacokinetics notes and flags) is to build on this.
- **One page** (`layout`, on by default).
  - The chips **One at a time** and **All on one page**, on Topics, on the quiz and on the exam. The choice is kept in the saved progress (`DB.layout`).
  - Quiz on one page: every multiple-choice and select-all question of the set, 40 at a time with "Show the next 40". Each card is graded and recorded the moment it is answered and shows the reasons in place. Calculation and matching questions stay one at a time, and the page says how many there are.
  - Exam on one page: every question of the paper, with the clock, the count and Submit on a bar that stays in view while scrolling. Picks are saved as they are made, so a reload keeps them. A paper with calculation or matching questions on it (a course with `exams[].typed`) stays one at a time and says why, because those questions have their answer box on the one-at-a-time paper only.
  - Going back to one at a time: the questions answered on the page are not asked again in that set.
- **Keyboard shortcuts** (`keys`, on by default).
  - Quiz: A–J or 1–9 pick an option; Enter checks a select-all item or moves on; after a right answer 1 = Knew it, 2 = Not sure, 3 = I guessed, each then moving on.
  - Exam paper: A–J or 1–9 pick; Enter or the right arrow moves to the next question; the left arrow to the previous one.
  - No key is a shortcut while the student is doing something else: typing in a field (an input, a textarea, a dropdown or an editable area), while a dialog is open over the page (worksheets-ink's Scratch paper is one), or while a pen, finger or mouse button is held down on a drawing canvas. Enter or Space on a focused button keeps its own meaning. A line under the card lists the keys; it is hidden on touch screens.
- **Strict paper** (`strict`, off by default; switch it on only when the real exam allows no going back).
  - A box on the exam start page: "Strict paper: one question at a time with no going back." The `strictNote` option adds a sentence from the course's own files beside it (Intro to Pharmacology has the professor's 10/21 remark, "no backwards nav"). The box stays as the student ticks it, also when the start page is drawn again (for example when paper-picker's paper chips are used).
  - A paper started with the box ticked has no Back button, no flags and no one-page layout. The left arrow does nothing. Moving on from a blank question asks first ("Move on without answering? You cannot come back to this question."). The paper stays strict through a reload. The browser's Back button leaves the drill (the kit keeps no history of its own); opening it again, or Forward, brings the paper back at the same question, still strict. The next paper started without the box has Back again.

**Why one module, not four.** The four parts share the click handler, the stored layout, the card drawing and the exam bar (the flag numbers, the layout chips and the strict paper's rules all sit on the same bar, and the strict paper switches off the flags and the one-page layout). Split into four modules, each would need the others' internals. One module with one option per part lets a course switch on only the parts it wants.

**What the kit core already had** (`core/views.js` and `core/shell.html` were searched for flag, keydown, layout and strict): none of the four controls. The core has the exam clock, Back and Next on the paper, Submit with the count of blank items, and the record and confidence functions (`record`, `markShaky`, `markGuessed`, `markSure`). The module calls those and does not copy them. The only `keydown` in the core is Enter in the number box of a calculation question, and the module leaves that alone.

## What changes

- New folder `features/study-controls/current/`: `module.json`, `study-controls.js`, `study-controls.css` and `test.js`. The module reads no course data and has no build step.
- New file `features/study-controls/ci/oncourse.js`, outside `current/`, so courses never copy it. The kit's CI runs it to make the module's own course from the template:
  - It writes `q90_sc_fixture.js` with Intro to Pharmacology's Day 1 topic and 6 of its questions.
  - It appends one line to `course.js`. The line adds that file, adds the Day 1 lecture (as `L91`), and switches the module on with `strict: true` and, as the strict note, the professor's answer of 10/21.
  - It reads that data from `const FIX` in `test.js`, and writes it with `const WRITE` there, the same code the test's own copies use.
  - The module itself still reads no course data.
- Catalog bookkeeping:
  - `FEATURES.md`: a new `study-controls` entry; the `strict-exam-mode` entry now says it is the module's `strict` option.
  - `features/README.md`: one row added.
  - `review/port-queue.md`: item 21 set to `partial (left: matching and fill-in cards on the one-page quiz; Not sure and I guessed on earlier one-page cards, which needs a core change)`.
  - `CHANGELOG.md`: one entry under 2026-11-02.

## What is not ported, and why

- BDK's keyboard shortcuts: not read, as you asked; they go with the BDK move.
- Intro to Pharmacology's question map with its "Flagged" filter. The kit has no question map; that is a separate catalog feature (`question-map`).
- On the one-page quiz, Not sure, I guessed and I was sure of that are offered only on the card answered last. The core changes the confidence of the last recorded answer only, so changing an earlier card would need a core change. The other cards say how their answer was recorded.
- On the one-page quiz, calculation and matching questions are left to one at a time (Intro to Pharmacology's one-page view also draws its matching and fill-in items; the kit's calculation and matching cards are drawn by the core).
- In an adaptive set (not a fixed pass), the one-page order is: due concepts first, then questions never shown, then the rest. Intro to Pharmacology sorts its due questions by its own box order, which the kit's scheduler does not have.
- Drill flagged and the flagged count cover every flagged question in the bank. Intro to Pharmacology counts only the current exam's questions; in the kit, with paper-picker a student can practise an earlier exam's paper, and its flags would otherwise drop out.
- Intro to Pharmacology's browser Back gesture moves within the drill; the kit's core keeps no history entries, so Back leaves the drill (the paper comes back where it was).
- Intro to Pharmacology ignores a tap on an exam option within 350 ms of the question being drawn. The kit's paper buttons are the core's, which has no such rule.
- Intro to Pharmacology keeps the layout choice through Erase; the kit's Erase replaces the whole progress, so the layout goes back to One at a time.

## What does not change

- No course site changes. No course switches this module on, and no course repository was touched.
- `core/` and `template/` are unchanged (`git diff origin/main -- core template` is empty).
- A course without the module builds the same page as before. A saved progress is read back unchanged; it gains `flags` or `layout` only when the student flags a question or picks a layout.

## Check results (2026-11-02, agent-run, on commit `f8004dd`)

- **The module's own course** is real Intro to Pharmacology data, from `929cd62` (`exam1-drill/src/`, read-only). It has:
  - the Day 1 topic, from `q_L01.js`;
  - its lecture, from `course.js`;
  - 6 of its questions: `L01-002`, `L01-004`, `L01-005` and `L01-006` are single-answer, `L01-003` and `L01-007` are select-all, every field as in the source;
  - as the strict note, the professor's answer of 10/21 (`app.js` line 678): "No, there will not, yeah, no backwards nav, OK, yes."

  The one change to the data: `prof` is the template's "Professor".
- **Placement in the template course:**
  - each question on one line, in the kit's question-file form;
  - a topic of its own after the template's topics, with the 2 subtopics the 6 questions are in;
  - the lecture under id `L91`, because the template has its own `L01`;
  - the source's `lecture` field left out, because the kit finds a question's lecture from the deck its citation names.
- **Module test on that course:** PASS 59 in each of 3 runs. 1 check is skipped each time (the paper-picker checks; paper-picker is not on).
- **`run_checks.sh` on that course:** 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no PDFs), 1 REPORT.
  - The REPORT is `explain_check.js`: 11 of 13 questions carry an explanation issue. It flags "thin option why" on all 6 of Intro to Pharmacology's questions and "no diagnosis of the error" on `L01-004` option E.
  - That is a report, not a check, and the question content is not changed.
  - `style_check.js`: "13 stems and 13 explanations clean".
- **Module absent.** The module's test on a page built without the module: FAIL (1 of 1 checks, "no feature modules in the page"), as it must.
- **Paper-picker absent and present, on a 1-exam course and a 3-exam course.** Paper-picker from `origin/port/paper-picker` `ed152de` is copied into scratch courses only and never committed. Its own `ci/oncourse.js` writes Basic-Pharmacokinetics' 3 exams: ids 1, 2 and 3, 120 minutes each.
  - 1 exam, paper-picker absent: PASS 59 (1 skipped: paper-picker is not on).
  - 1 exam, paper-picker present: PASS 59 (1 skipped: paper-picker offers no exam other than the current one).
  - 3 exams, paper-picker present: PASS 61, none skipped.
    - The clock read 119:59.
    - Exam 1 is left out because the bank holds too few questions for its paper, which paper-picker says on the start page.
    - The checks of a paper drawn for an earlier exam ran on Exam 2.
  - The same 3-exam course with paper-picker switched off again: PASS 59 (1 skipped: paper-picker is not on).
- **Fault F2, before and after**, on paper-picker's 3-exam course:
  - Before: the test as it was at `d15ebd9` FAILs 3 of 61 checks: the clock check (119:59), and the two checks of a paper drawn for an earlier exam.
  - After: the committed test PASSes 61 on the same course.
- **Keyboard shortcuts with the modules where the student writes, types or answers a dialog** (worksheets-ink `8265f5c`, notes `65085d6`, on a course with calculations on its papers): the coordinator's keyboard checks, PASS 15 of 15. No shortcut acts in any of these cases:
  - with Scratch paper open over a quiz calculation and over a paper's calculation, with the pen down and with it up;
  - with the pen down on a worksheet;
  - while the student types a note;
  - while the confirm box of Clear flags, Delete note or Clear page is open;
  - while the Import file picker is open.

  The module's test on that course: PASS 59.
- **Template scratch course, no module on; Medicinal-chemistry `main` (`f1f5ee5`):** cited from branch `evidence/baseline` folder `main-98e7b5b/`, because this branch's core and template trees are exactly `c9fde5b` and `cbac5bd`.
  - Template course: 24 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT.
  - Medicinal-chemistry, from a full clone: 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures; `cite_check.py`: no PDFs), 1 REPORT.
  - `home_test.js` passed 33 checks in that run (before kit PR #28's fix).
  - The first version of this pull request said 22 PASS and 3 NOT RUN; that was a shallow clone.
- No regex lookbehind in the module.
- **NOT RUN anywhere:**
  - WebKit (Safari): this container has Chromium only.
  - A hardware keyboard on an iPad: the keyboard shortcuts were tested with Chromium's keyboard.
  - Real operating-system dialogs: the Import file picker and the confirm box were opened through Playwright, which intercepts them.

## Review evidence

All results are agent-run.

- Final tested commit: **`f8004dd`** (`f8004dd3ca3d7dfcdc995e8134e70e58874c59ce`).
- Starting commit of this review: `d15ebd9`; of the first review: `c81a735`.
- Evidence branch: **`evidence/study-controls`** (`cd9cf47`):
  - `v3-54f6d3c/INDEX.md`: the course data, F2 and the mutation checks;
  - `v3-f8004dd/INDEX.md`: the runs on the final commit;
  - `INDEX.md`: the first review.

  The branch holds every command and its exit code, the logs, the scripts and the screenshots.

### Faults found and fixed

1. With a modal `<dialog>` open, the letter `a` answered the quiz question under it. Fixed: no shortcut while a dialog is open (Intro to Pharmacology has the same rule for its own panels, `app.js` line 3937).
2. With worksheets-ink's Scratch paper open, Enter checked the quiz answer under it, and on the exam paper the right arrow moved to the next question; with the pen held down on the scratch canvas, the right arrow and Enter moved the paper two questions on. Fixed: the dialog rule, and no shortcut while a pointer is held down on a canvas.
3. With paper-picker on, choosing a paper chip unticked a ticked strict box, so a student could start a paper that was not strict. Fixed: the box is kept as it is ticked.
4. On a course with calculations on its papers, All on one page showed a calculation with no answer box. Fixed: such a paper stays one at a time and says why.

5. (test, this review) Fault F2 of the coordinator's integration check (`evidence/integration` `1329222`): the test assumed a paper under 100 minutes and exam ids that are text.
   - The clock check read `^\d\d:\d\d$`, but a 120-minute paper shows 119:59.
   - Two checks compared paper-picker's exam id with text, and Basic-Pharmacokinetics' ids are numbers.

   Fixed with the coordinator's candidate patch, applied as it stands. The same id fault was also fixed on the line that picks the earlier exam: there it had kept the current exam in the list.
6. (test, this review) On paper-picker's own 3-exam course, the checks of a paper drawn for an earlier exam took Exam 1. The bank cannot fill Exam 1's paper, so paper-picker drew it for the current exam, and the checks failed. Fixed: the test takes the first earlier exam that paper-picker does not mark "The bank holds too few questions" (there, Exam 2), and skips with that reason when there is none.
7. (test, this review) With the course's own questions now on the exam paper, two checks depended on the order of the checks before them. Both are fixed in the test:
   - the flag bar listed flags set earlier in the quiz checks, so the flags are now removed before the paper checks;
   - Clear flags had no flag left to clear, so two flags are now set before it.

Also corrected: the source line numbers (`exLeaveOk` is line 1718, `renderExam` 1688-1716, the key handler 3936-3963). Nothing found needs a core change. Seen in the core, for a separate proposal: the progress is saved 150 ms after the last change and not when the page closes; the saved paper has no field for the strict mark, so the module keeps its own key beside it.

### Behaviour map

Source: Intro-Pharmacology- `exam1-drill/src/app.js` at `929cd62`.

| # | Behaviour in the source | Lines | Port | What the student gets, or does not get |
|---|---|---|---|---|
| 1 | A flag per question with the time it was set, saved with the progress | 146-147 | ported | `DB.flags`; it follows Export, Import, the profile and Erase |
| 2 | The Flag button, "⚑ Flag" / "⚑ Flagged" | 148 | ported | on every quiz card, the exam question and each card of the result |
| 3 | Drill flagged and the count use the current exam's pool only | 149, 723, 777 | adapted | every flagged question in the bank (with paper-picker an earlier exam's flags stay drillable) |
| 4 | The layout chips | 151 | ported | on Topics, the quiz and the exam |
| 5 | A mouse click on Flag takes the focus off it, so Enter continues | 581 | ported | same |
| 6 | Only that question's Flag buttons change | 582-583 | ported | same |
| 7 | The paper's question grid marks flags; the flag is also saved in the paper | 585 | adapted | no grid in the kit: the flagged numbers are links on the question bar; the flag is kept in `DB.flags` only |
| 8 | Topics and the question map are redrawn after a flag | 586 | ported / omitted | the Topics row updates; no question map in the kit |
| 9 | On the exam start page the layout chips only restyle | 589-595 | ported | same |
| 10 | Topics row: count, Drill flagged, Clear flags after "Remove every flag?" | 722-723, 777-778 | ported | same |
| 11 | The quiz on one page, 40 at a time, Show the next 40, Finish | 994-1016 | ported | multiple-choice and select-all questions |
| 12 | Matching and fill-in cards on the one-page quiz | 995, 1040-1043 | omitted | they stay one at a time; the page says how many |
| 13 | Each one-page card graded and recorded when answered | 1023-1045 | ported | through the core's `record` |
| 14 | Not sure / I guessed on every right one-page answer | 1021, 1057-1064 | adapted | on the card answered last only (core limit) |
| 15 | The count says how many were answered one at a time | 1031-1034 | adapted | those questions leave the page's list; back to one at a time, page answers are not asked again |
| 16 | The strict box, its last state kept, stored on Start | 1616, 1632 | ported, fixed | only with `strict: true`, with `strictNote`; now also kept as it is ticked |
| 17 | The paper keeps `noBack` in its saved state | 1494-1495, 1505, 1633 | adapted | the core's saved paper has no field, so a key of the module's own, tied to that paper |
| 18 | The exam on one page with a sticky bar | 1663-1686 | ported | with a Flag on every card and the flag numbers on the bar |
| 19 | The strict paper: no chips, grid, Previous or Flag; "No going back" | 1692, 1697-1705 | ported | same |
| 20 | A tap on an option within 350 ms of drawing is ignored | 1710 | omitted | the paper's buttons are the core's; not tested |
| 21 | Moving on from a blank strict question asks first | 1718 | ported | same words; on the last question "Submit the paper without answering this question?" |
| 22 | No shortcut while a panel or the break video is open | 3937 | adapted, fixed | no shortcut while a dialog is open or a pointer is down on a canvas |
| 23 | Fields, focused buttons and modifier keys are never shortcuts | 3939-3942 | ported | same |
| 24 | Quiz keys | 3944-3955 | ported | same |
| 25 | Paper keys, asking first on a strict blank question | 3956-3962 | ported | same |
| 26 | The browser's Back moves within the drill | 240-249 | omitted | Back leaves the drill; the paper comes back where it was |
| 27 | The question map's Flagged filter | 3862-3898 | omitted | no question map in the kit |
| 28 | Erase keeps the layout, empties the flags | 3933 | adapted | the layout goes back to One at a time too |
| 29 | A failed save shows a notice | 152 | core's own | the core's notice |
| 30 | (kit only) a paper with calculation or matching items | — | added, fixed | stays one at a time and says why |

### Mutation checks

How each mutation was run (`mutations.py` on the evidence branch):
1. The mutation is applied to a scratch course's copy of the module, as an exact replacement that must match once.
2. The course is built and the module test is run.
3. The file is restored.

This review ran the 20 again, against the new test, on the module's own course (commit `54f6d3c`):
- The same 19 are caught, and M10 is not.
- M1 and M17 are also caught by "a flag on the paper is listed on the question bar at once".

The table below is the earlier pass. The two commits after `54f6d3c` change only the choice of the earlier exam in the paper-picker part of the test, which the mutation course (no paper-picker) does not reach, so the mutations were not run again on `f8004dd`.

| Mutation | Test exit | Checks that failed (agent-run) |
|---|---|---|
| M1 no dialog guard on keys | 1 | the modal `<dialog>` check; the dialog-panel check on the quiz; the dialog-panel check on the paper |
| M2 no pointer-down guard on keys | 1 | no key acts while the pointer is held down drawing on a canvas |
| M3 a pointer down on a canvas is not noted | 1 | the same canvas check |
| M4 contenteditable is a shortcut | 1 | typing in a contenteditable is not a shortcut |
| M5 a textarea is a shortcut | 1 | typing in a textarea is not a shortcut |
| M6 strict paper keeps Back | 1 | the strict paper has no Back; strict through a reload; Back and Forward; the confirm check; storage denied |
| M7 strict paper not recorded | 1 | the strict paper is one at a time with no Back |
| M8 strict Next on a blank question does not ask | 1 | Next on a blank question asks first; strict through a reload; Back and Forward; the confirm check |
| M9 strict box kept only on Start | 1 | the box stays ticked when the start page is drawn again; the strict paper check |
| M10 the left arrow allowed on a strict paper | 0 | not caught: equivalent, because the strict paper also removes the Back button, which is all the left arrow presses (M11 removes both and is caught) |
| M11 left arrow allowed and Back kept | 1 | the strict paper check; Next on a blank question; two more |
| M12 a flag is not saved | 1 | flags kept through a reload; 300 ms reload; storage denied; storage works again |
| M13 the layout is not saved | 1 | a pick on the one-page paper is saved and the paper comes back on one page after a reload |
| M14 an id the bank does not have is flagged | 1 | flags are set, toggled and cleared; an unknown id is refused |
| M15 flags of another shape kept on load | 1 | a saved progress with flags of another shape loses that field |
| M16 a paper with calculations drawn on one page | 1 | a paper with a calculation stays one at a time, with the answer box |
| M17 the paper's flag bar is not refreshed | 1 | a flag on the paper is listed on the bar at once (check added in this review; the first pass did not catch M17) |
| M18 Drill flagged leaves one out | 1 | Drill flagged drills exactly the flagged questions; 300 flags |
| M19 Show the next 40 shows no more | 1 | Drill flagged drills all 300, 40 to a page |
| M20 Clear flags clears nothing | 1 | Clear flags removes every flag; a profile switch |

### Persistence results (agent-run)

| Case | Result |
|---|---|
| 300 flags and the layout, reload | kept; Topics shows 300; Drill flagged drills 300, 40 to a page |
| Reload at once after a flag (under 150 ms) | the flag is lost: the core saves 150 ms after the last change (core behaviour, reported, not changed) |
| Reload 300 ms after a flag | kept |
| Export, then Import into a fresh profile | the export carries 301 flags and the layout; the fresh profile had none; after Import it has 301 and the layout |
| Profile switch | each profile keeps its own flags and layout |
| Storage denied | the student sees the core's notice; nothing saved is overwritten; the new flag and a strict paper hold for the visit; when storage works again the next save writes the flag, and a reload loads them all |
| Storage full (`QuotaExceededError`) | the notice shows; nothing saved is overwritten; a reload after storage works again loads the flags and layout saved before (what was chosen while it was full is lost on that reload, as the notice says) |
| Strict paper: reload; Back then Forward; the left arrow; the left arrow pressed while the confirm box is open | the paper stays at its question with no Back each time |

### Check results (agent-run, on `f8004dd`)

| Check | Result |
|---|---|
| The module's own course (Intro to Pharmacology `929cd62` data, written by `ci/oncourse.js`), module test, 3 runs | PASS 59, PASS 59, PASS 59 (1 skipped each: paper-picker off) |
| `run_checks.sh` on that course | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT (`explain_check.js`) |
| Module test, module absent | FAIL 1 of 1, as required |
| `ci/oncourse.js` run a second time | exit 1, refuses (by design) |
| 1 exam, paper-picker absent / present | PASS 59 / PASS 59 (1 skipped each, with the reason) |
| paper-picker's 3-exam course, paper-picker present / switched off | PASS 61 / PASS 59 (1 skipped: paper-picker off) |
| F2: the test at `d15ebd9` / the committed test, on that course | FAIL 3 of 61 / PASS 61 |
| Keyboard checks with worksheets-ink and notes (writing, typing a note, dialogs) | PASS 15 of 15; the module test there PASS 59 |
| Mutation checks (on `54f6d3c`) | 19 of 20 caught; M10 equivalent |
| No-module template course, Medicinal-chemistry | cited from `evidence/baseline` `main-98e7b5b/` (tree hashes match): 24 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; 23 PASS, 0 FAIL, 2 NOT RUN, 1 REPORT |
| WebKit (Safari) | NOT RUN (Chromium only) |

### Coordinator-verified re-run (2026-11-02, commit `f8004dd`, core `c9fde5b`, template `cbac5bd`)

Folder `evidence/study-controls/coordinator/study-controls-f8004dd/` on `evidence/study-controls` (`7574fd2`).

| Check | Exit | Result |
|---|---|---|
| `ci/oncourse.js` on a fresh template course, then `build.py` | 0, 0 | built |
| Module test, 3 runs | 0, 0, 0 | 59 PASS each (1 skipped: the paper drawn for an earlier exam, paper-picker not on) |
| `run_checks.sh` on the module's own course | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no PDFs), 1 REPORT |
| No-module template course and Medicinal-chemistry (full clone `f1f5ee5`) | 0, 0 | cited from `evidence/baseline` `main-98e7b5b/` (same trees): 24 PASS / 1 NOT RUN / 1 REPORT and 23 PASS / 2 NOT RUN / 1 REPORT |

Not re-run by the coordinator: the runs with paper-picker present, the keyboard checks with worksheets-ink and notes, and the mutation runs.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
