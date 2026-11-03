<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

**Port (incomplete): notes** (draft until the coordinator marks it ready)

Port queue item 10, Tier 2 (`review/port-queue.md`): "notes (Notes tab and flags)". It needs your yes before it merges. Basic-Pharmacokinetics' code and data were only read, from a read-only copy at `ac2eb73`. Final tested commit: **`998137e`** (`998137e0a7531eaaf1537bdef96123050bf68be5`). Evidence branch: **`evidence/notes`** (`26fb752`; this run in `evidence/notes/harden-998137e/INDEX.md`, the first run's files unchanged beside it).

## What the feature does

The module `notes` brings Pharmacokinetics' notes on questions into the kit.

- **A Note button on every question card.** "✎ Note" is on the quiz card, on the exam paper's card, on every card of the paper's results, and, when study-controls (PR #16) is on, on its "all on one page" cards. Tapping it opens a box under the card's head: "What I'm thinking, or what I want to ask". What is typed is saved as it is typed, and the button then reads "✎ My note". Emptying the box removes the note.
- **A Notes tab**, between Weak spots and Exam. It lists every noted question, newest first, with the date, the stem and options, the answer last given (right, guessed or missed), and the key and the working folded under "The key and the working". The note can be edited there. Each card has "Drill this question" and "Delete note" (it asks first). With notes in more than one topic, chips filter by topic, and "Drill these" drills the questions shown.
- **Copy for AI** and **Download (.md)** give every note as one Markdown text: a request at the top, then for each question its topic, citation, stem, options, the answer given, the key, the working (or why the key is right) and the note. It is ready to paste into an AI or to bring to the professor's review. The download is named `<course id>-my-questions.md`.
- **A paper still running keeps its key hidden.** For a question on a paper that has not been submitted, the key is left out of the text ("left out until the paper is submitted") and hidden on the Notes tab. After Submit, both carry it.
- **Weak spots** says how many notes there are, with "Open Notes". **Settings** says what is kept.
- **What is kept.** The notes are kept in the profile's saved progress as `DB.notes`: for each question id, the text and when it was last typed. So Export progress includes them, Import progress brings them back, Erase my history removes them, and each profile has its own. Pharmacokinetics keeps its notes in the same shape, so its saved notes read in unchanged. A saved note in another shape is dropped when the progress loads.
- **Flags.** The module adds no flags of its own. The kit's flags are study-controls' (`DB.flags`, PR #16). When study-controls is on, a flagged question's card on the Notes tab says "⚑ flagged"; the module reads that from `FX.api('study-controls')` each time the tab is drawn. When it is off, there is no flag mark. The module does not need study-controls and works alone.
- **Typing a note never triggers a study-controls key.** With study-controls on, the letters, digits, Enter and the arrow keys typed in a note go into the note and do not answer, check or move anything.
- **Options** in `course.js`: `request` (the request at the top of the text; the default asks to answer each question, say where the reasoning went wrong and show the working step by step) and `file` (the download's file name).

## What changes

- New folder `features/notes/current/`: `module.json`, `notes.js`, `notes.css` and `test.js`. The module reads no course data and has no build step.
- New `features/notes/ci/oncourse.js`, outside `current/` (a course never copies it). For the kit's CI it builds the module's own course from real course data (Louis's rule 4): it writes `q90_notes_fixture.js` with Basic-Pharmacokinetics' topics "PK-PD relationship" and "Nonlinear pharmacokinetics" and 16 of their questions (13 multiple-choice, 2 of them select-all, and 3 numeric), adds their two lectures (Module 7b and Module 8 decks) and two skills to `course.js`, and switches notes on. The data is the test's own `FIX`, written by the test's `WRITE`, so the CI course and the test's copies hold the same data. The one change to the data: the professor is written as "Professor". (Corrected from the first version of this text, which said the script wrote no data file and the test added one question, cq5-5, to the template's sample course.)
- Catalog bookkeeping:
  - `FEATURES.md`: the `exam-notes` entry becomes `notes`, filled in for the kit module (COURSES.md still names Pharmacokinetics' own copy `exam-notes`); its Test line gives the counts below and the course data.
  - `features/README.md`: one row added.
  - `review/port-queue.md`: item 10 set to `partial (left: paper flags, which study-controls #16 provides instead; origin and ★ tags and module colours on the Notes cards)`.
  - `CHANGELOG.md`: one entry under 2026-11-02.

### The course data in the module's own course
From Basic-Pharmacokinetics `src/` at `ac2eb73`: `course.js` (lectures L11 and L12, skills pkpd and nonlin), `q13_quizzes.js` (cq5-1, cq5-6), `q15_module7b.js` (pd-c20, pd-c01, pd-c02, pd-c04, pd-c06, pd-c22, pd-ex-b) and `q16_module8.js` (nl-c04, nl-c02, nl-c03, nl-c05, nl-c06, nl-ex1, nl-ex2a). Left out of those two topics, and why:
- questions whose text refers to the professor by a pronoun, so that no question in the set names the professor in any way;
- nl-c10: its text has "given as", which the kit's `style_check.js` flags (reported, not reworded);
- pd-c13, nl-c01 and nl-c18: they have two options, and the kit's core `test.js` refuses a question with fewer than three ("only 2 options"). Pharmacokinetics' true/false items therefore cannot enter a kit course as they are. This is a finding for the coordinator;
- cq5-2, pd-c14, cq5-5, nl-c08 and nl-c09: each one's `dupOf` leads to one of those two-option questions, and core `test.js` needs every `dupOf` target in the bank.

The questions keep the source's `exam: 3` field, so the quiz card shows "Exam 3 · 8" although the template course has no exam 3. Nothing fails on it.

## What is not ported, and why

- **Pharmacokinetics' flags on a paper** (⚐ Flag on each paper question, ⚑ in the Go to list, the count on Submit, the list and marks on the results). They would be a second flag store beside study-controls'. Study-controls (PR #16) has its own Flag button on the paper and its results and lists the paper's flagged questions. With study-controls off, the student has no flags.
- **The origin tag and the ★ likely tag** on the Notes cards: the kit core has neither.
- **Module colours** on the Notes tab's chips: the kit has no module colours (catalog `module-colours`).
- **The filter by module**: the kit's questions have no module number, so the filter is by topic.
- Pharmacokinetics' own wording (the professor's name, "Her key" and "her equation sheet") is not used: the text says "Key" and "the professor", and the request is the `request` option.

## What does not change

- No course site changes. No course switches this module on, and no course repository was touched.
- `core/` and `template/` are unchanged (`git diff origin/main -- core template` is empty; core tree `a2dbf03`, template tree `cbac5bd`, the same as main `6432c36`).
- A course without the module builds the same page as before. A saved progress gains `notes` only when a note is typed.

## Fault found and fixed during the first review

With study-controls on, and notes before study-controls in `course.js`, study-controls' one-page quiz and paper cards had no Note button: study-controls redraws the pane in the same pass as notes, after it, and that redraw is not passed to the hooks again. The module looks again once the pass is over (adding the button twice is not possible). Mutation M14 shows the test catches its removal with notes before study-controls (the order the kit's CI uses); with study-controls first the fault does not arise. No new fault was found in this run.

## Needs a core proposal (not changed here)

A reload within 150 ms of the last keystroke loses that keystroke's change: the core writes the progress 150 ms after the last change. A core change could write a pending save on `pagehide` (the core already saves the place there).

## Review evidence

All results below are **agent-run**, on commit `998137e`, unless marked as from GitHub. Evidence branch `evidence/notes`, folder `harden-998137e/` (`INDEX.md` lists every command, its exit code and its log).

### Check results (agent-run)

| Check | Result |
|---|---|
| Module test on a page without the module's code | FAIL, exit 1 (1 of 1: "FX is not defined"), as it must |
| `ci/oncourse.js` on a fresh course | exit 0: wrote the fixture file (2 topics, 16 questions) and the course.js line (2 lectures, 2 skills, notes on); a second run on the same course refuses (exit 1) |
| Module test on that course (notes alone, its own course data), 3 runs | PASS 88 checks, PASS 88, PASS 88 |
| Module test with notes on and no course data (the test writes the data into its copy) | PASS 88 checks |
| `core/ci_course.sh module:notes` (the module's own course) | exit 0: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`); `home_test.js` PASS 36; `features/notes/test.js` PASS 88 |
| `core/ci_course.sh modules:notes,study-controls` (study-controls `1c1d590` in a scratch copy of the kit, never committed here) | exit 0: 27 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT; `home_test.js` PASS 36; `features/notes/test.js` PASS 106; `features/study-controls/test.js` PASS 59 (1 skipped: paper-picker is not on) |
| Mutation checks | 22 mutations; each caught in the order where its fault arises (table below) |
| Regex lookbehind in the module's files | none |
| Template course with no module; Medicinal-chemistry `f1f5ee5` (full clone) | cited from `evidence/baseline` folder `main-6432c36/` (`f8a22d5`), whose core and template trees are this branch's: 24 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; and 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`, `cite_check.py`), 1 REPORT, `home_test.js` PASS 36. Not rerun locally by this agent. |
| GitHub "Kit checks" run 41552662982 on `998137e` (pull request) | success: Chromium template, template-unset, medicinal-chemistry (23 PASS, 0 FAIL, 2 NOT RUN, 1 REPORT; `home_test.js` PASS 36), module:notes (26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; `features/notes/test.js` PASS 88), and WebKit template (informational) all success |
| WebKit (Safari), iPhone, iPad, locally | NOT RUN: Chromium only in this container |

The module's test ports Pharmacokinetics' `src/notes_test.py` (its note and Notes-tab checks; its paper-flag checks belong to study-controls). It runs in node on the course's own bank and in Chromium at 390 px and 1200 px on a scratch copy with the 16 Pharmacokinetics questions (the course's own copy when `ci/oncourse.js` wrote them) and 3 copies of the 16 under other ids, with the exam paper drawn from those two topics (a check confirms the paper holds only those questions).

### Typing a note with study-controls on (agent-run, checks in `test.js`)

- On the quiz, before the answer: typing A-J, 1-9, Enter and the arrow keys in a note picks, checks and records nothing, and the keys go into the note. With the note left, the right letter answers the question.
- After a right answer: the same keys typed in the note mark nothing (Not sure, I guessed), record nothing and do not move on. With the note left, 1 moves on.
- On the exam paper: the same keys in the note move and pick nothing and go into the note. With the note left, the right arrow moves on and the left arrow back.
- Mutations M21 and M22 (study-controls' field guard weakened, in a scratch copy only) are caught by these checks.

### Persistence (agent-run, checks in `test.js`)

- 64 notes of up to 2,000 characters and a history of 304 answers come back after a reload, unchanged; the Notes tab lists all 64.
- Export progress carries all 64 notes; Import progress into a fresh profile brings back the same notes.
- A profile switch: each profile keeps its own notes.
- A reload 400 ms after typing keeps the change. A reload under 150 ms after typing lost that last change in every run; the earlier text of that note and all 64 notes were kept (core behaviour, above).
- Storage denied and storage full: the core's notice "This browser did not save your progress (storage is full or blocked)" is on screen, the stored progress is left as it was, the note stays on screen, and once storage works the next change is saved with every earlier note and loads after a reload.
- A saved note in a bad shape is dropped on load, and the other notes load. Erase my history removes the notes.
- NOT RUN: storage in Safari/WebKit; a real full disk (simulated by a thrown `QuotaExceededError`).

### Behaviour map

| Behaviour (Basic-Pharmacokinetics `ac2eb73`) | Source | Kit | Notes |
|---|---|---|---|
| Notes kept with the progress as `DB.notes` {id: {t, at}} | `src/views.js` 5570 | ported | Same field and shape, so PK's saved notes read in unchanged. The kit does not create `DB.notes` until a note is typed (PK created it on first read). |
| "✎ Note" button on the quiz card | `src/views.js` 1791 | ported | Added to the card's head after the core draws it. |
| "✎ Note" button on the exam paper's card | `src/views.js` 1587, 3309 | ported | Both layouts: the core's one at a time, and study-controls' all on one page. |
| "✎ Note" button on the paper's result cards | `src/views.js` 3425 | ported | |
| "✎ Note" button on the "all on one page" quiz cards | `src/views.js` 1494 | adapted | The kit's one-page quiz is study-controls'; its cards get the button when that module is on. |
| Button reads "✎ My note" when a note exists, updated as the note is typed | `src/views.js` 5571, 6373 | ported | |
| The box opens under the card's head; a second tap closes it; focus goes to the text | `src/views.js` 6361-6368 | ported | |
| Saved as it is typed; an emptied note is removed | `src/views.js` 6369-6375 | ported | Through the core's `save()` (written 150 ms after the last change). |
| Box label and hint text | `src/views.js` 5572-5574 | ported | Same words. Text size 16 px (PK 15 px), so a phone does not zoom in. |
| The answer last given, as text, and right/guessed/missed | `src/views.js` 5577-5586 (noteMyAnswer) | adapted | The kit's matching answer is a list of row picks (PK: an object of pairs); kinds other than multiple choice, numeric and matching are written as their recorded value. |
| The whole set as one Markdown text: title, request, per question the stem, options, my answer, key, working or why, my note | `src/views.js` 5589-5608 (notesMarkdown) | adapted | Course name and exam from course.js; the request is the `request` option (PK's text named the professor and "her equation sheet"); "Her key" becomes "Key"; each section is headed by its topic (PK: its module); matching questions list their rows and choices. Oldest note first, as PK. |
| `{{frac:a|b}}`, tags and entities written as plain text | `src/views.js` 5587 (plain) | ported | |
| A paper still running leaves its key out, in the text and on the tab | `src/views.js` 5591, 5598, 5618, 5627 | ported | |
| Notes tab: every noted question, newest first, with date | `src/views.js` 5612-5643 | ported | Date written with the browser's own format (PK: fmtWhen). |
| Notes tab filter chips | `src/views.js` 5614-5616, 5623, 5651 | adapted | By topic (the kit's questions have no module number). |
| Notes tab card: stem, figure, options, your answer, key and working folded, the note to edit | `src/views.js` 5624-5641 | adapted | Stem and options as plain escaped text (PK used its own formula and rich-text drawing, which the kit core does not have); numeric working as the step lines. |
| PK's origin tag and ★ likely tag on the Notes card | `src/views.js` 5635 | omitted | The kit core has no origin or likely tags; the student does not see where a question came from or whether it is starred on this card. |
| Empty Notes tab text | `src/views.js` 5619-5621 | ported | "Exam sim paper" written "exam paper". |
| Copy for AI (clipboard, with the old textarea fallback) and "Copied ✓" | `src/views.js` 5645-5647 | ported | |
| Download (.md) | `src/views.js` 5648-5649 | adapted | File name `<course id>-my-questions.md` or the `file` option (PK: PHAR4221-my-questions.md). |
| Drill these / Drill this question | `src/views.js` 5650, 5652 | ported | Through the core's `drillList`. |
| Delete note, with a confirm | `src/views.js` 5653 | ported | |
| Weak spots line with the count and "Open Notes" | `src/views.js` 2062-2063 | ported | Placed after the statistics row (or after the heading when nothing is answered yet). |
| Notes tab in the nav, between Weak spots and Exam | `src/views.js` 290, 302; `src/shell.html` 1073 | ported | Through `X.tab`. |
| Module colours on the Notes tab's chips | `src/views.js` 6337-6339 | omitted | The kit has no module colours; the chips are plain. |
| Flags on a paper: ⚐ Flag / ⚑ Flagged per paper question (`EX.flags`), ⚑ in the Go to list, the count on Submit, the list and marks on the results, kept with the paper through a reload | `src/views.js` 5575, 1587, 3309, 3328, 3354, 3418, 3425, 6376-6383 | omitted | Not a second flag store: the kit's flags are study-controls' (`DB.flags`, PR #16), which has its own Flag button on the paper and its results and lists the paper's flagged questions. With study-controls off, the student has no flags. |
| (kit) Flag mark on a Notes card | none in PK's Notes tab | adapted | When study-controls is on, a flagged question's card on the Notes tab says "⚑ flagged", read through `FX.api('study-controls')` each time the tab draws. |
| (kit) Settings line on what is kept | none | adapted | Says that Export, Import and Erase cover the notes. |
| (kit) A saved note in another shape is dropped on load | none | adapted | `X.progress`; keeps every `{t: text, at}`. |

### Mutation checks (agent-run)

Script: `evidence/notes/harden-998137e/scripts/mutations.py` (each mutation is an exact replace that must match once; none was committed to the port branch). Run on a scratch course with study-controls then notes; M14 again with notes then study-controls.

| Mutation | Exit code | Checks that FAILed (short; full list in `mutations/mutations.md`) |
|---|---|---|
| M1 a typed note is not saved | 1 | the note is still there after a reload, and 9 more |
| M2 a running paper never hides the key | 1 | the key left out of the text; the Notes tab hides the key |
| M3 the converter keeps bad notes | 1 | a saved note in a bad shape is dropped on load; the converter check |
| M4 no button on the result cards | 1 | after Submit every result card carries ✎ Note |
| M5 the flag mark never shows | 1 | the flagged question's card says ⚑ flagged |
| M6 the flag mark always shows | 1 | the mark goes when the flag does |
| M7 notes listed oldest first | 1 | noted() newest first; the newest note is first |
| M8 {{frac}} left as written in the text | 1 | {{frac:a|b}} written (a)/(b) in the text ((0.693)/(Vmax)) |
| M9 Weak spots miscounts | 1 | Weak spots counts the 2 notes |
| M10 the button label is not updated as the note is typed | 1 | the button then reads My note |
| M11 Delete note deletes nothing | 1 | Delete note removes it; Drill these drills the noted questions |
| M12 Drill these ignores the topic filter | 1 | Drill these drills only that topic's noted questions |
| M13 an emptied note is kept | 1 | an emptied note is removed from the progress |
| M14 no second look after the pass | 0 with study-controls first (the fault does not arise in that order); 1 with notes first | study-controls' one-page quiz and paper cards each carry ✎ Note |
| M15 the Notes tab shows the key of a running paper | 1 | the Notes tab hides that question's key while the paper runs |
| M16 the key left out of the text | 1 | a key for every multiple-choice, numeric and matching question (29); both keys after Submit |
| M17 no button on the quiz card | 1 | the quiz card carries ✎ Note |
| M18 the box does not open | 1 | the test stopped (page.fill timeout) |
| M19 a saved progress loses its notes on load | 1 | the note is still there after a reload; the converter check |
| M20 Download names the file wrongly | 1 | Download saves <course id>-my-questions.md |
| M21 [study-controls] a key typed in a textarea is a shortcut | 1 | typing the keys in a note on the quiz picks, checks and records nothing |
| M22 [study-controls] no key guard at all | 1 | typing the keys in a note on the quiz picks, checks and records nothing |

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
