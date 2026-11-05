# Changelog

Dated kit changes, newest first.

## 2026-11-05
- The answer history is no longer cut silently at 20,000 entries: past it a notice offers Export progress and a removal of the oldest entries that names how many and their dates and needs an OK; until then new entries go on being added (`cap_test.js`).
- Study progress first when storage is full: while a progress write is refused, the answer history is held (on the page, named in the notice, in Export) and written after the next progress save; this tab's own per-tab record, proven stored, is removed to make room and the progress write tried once more.
- "Use it here" with only history unsaved no longer stores an entry twice when the other tab already placed this tab's per-tab record.
- With storage full: the notice has an Export progress button and says when this tab's per-tab record is off; the new-version bar's Reload asks first when writes are refused; closing the tab while refused work is not exported gets the browser's leave question.

## 2026-11-04
- Settings shows how much this site stores in this browser (every drill, in characters, against 5,242,880), this drill's part (progress, history, preview copies, copies kept by Import and their number) and this profile's answers kept and recorded.
- A warning in the Quiz tab and in Settings when the space left is less than one more profile of the largest size here, or a first preview of a course here, would need; it names the largest items and offers Export progress and Delete the copies kept by Import. Nothing is deleted automatically. The page says the figures are an estimate and the limit differs by browser.
- `core/storage_use_test.js` checks the figures, the warning on each side of its boundary and the estimate wording.
- Storage in Settings: the Chromium limit is given as measured exactly (5,242,880 characters, UTF-16 units, per origin); each writing tab's pending records have a line of their own; another drill's items name its namespace; a preview page counts and deletes the same copies.
- A profile switch away and straight back no longer leaves the page read-only behind the "open in another tab" wall.
- A tab that closes or reloads without handing over its profile no longer loses its last save to the next tab: each writing tab keeps that save in a record only it writes; the next tab starts from it, or keeps it as a copy (Put back) when it has saved since. Records are removed only after they are read back as stored and 60 s have passed.
- A history write the browser refuses no longer deletes the oldest half of the answer history: every entry is kept on the page, the "did not save" notice names the answer history and points to Export progress (whose file holds them), the page counts them as unsaved (the stop wall's export; "Use it here" adds them to the saved history, or keeps them in its copy), and the next save the browser keeps writes them all (for a profile switched away from, once no tab holds that profile; Louis, 2026-11-04).
- Switching profile with progress or history the browser refused asks first and offers the export; the history of a profile switched away from is written by a later save once the browser has room and no tab holds that profile, and only if no other tab changed that history meanwhile (otherwise a notice offers its export).
- The "did not save" notice shows again for a refusal after everything refused had been saved.
- With the whole site's storage full, progress now stops saving sooner than before, because the history is no longer cut to make room (for Louis to decide; `core/README.md`).

## 2026-11-03
- Import progress shows what a file holds and would change, and saves only when confirmed.
- Import refuses a file of another course or of no course, and replaces progress only with a record that continues it.
- Import compares every part of a file's progress, not only its answers: a file whose concept progress, settings or scheduling state differ goes into a new profile.
- A page whose profile another tab or window saved since stops saving and offers a reload, instead of writing its older progress over the newer one.
- Each profile has one writing tab at a time (Web Locks): another tab of the same browser opens it read-only, takes no answers, and offers "Use it here", which moves the profile after the other tab has saved. A stopped page covers itself, takes no answers, and offers to export what it has not saved before a reload.
- Import keeps a copy of the progress it replaces; Put back never loses either record.
- Put back and "Delete the copies" do nothing when another tab or window saved the profile or changed the copies while their question was open, and Erase does nothing when the profile was saved there meanwhile; copies another tab deleted are not offered or written back.
- Kit checks on GitHub: each module course the plan selects also runs in WebKit (job "modules-webkit"), and a module course fails unless each module's own test passed at least one check in that job's browser.
- An answer or a setting changed just before the page is reloaded, closed or hidden is saved at once; it was lost when the 150 ms save had not yet run.
- `core/test.js` section 7 runs its miss-and-return trial 20 times instead of once, and passes the cool-down by adding to the answer count, so a scheduler that always ignores the different-wording rule is caught in every run, and a topic with few concepts no longer fails it falsely.
- Standing autonomy (Louis): `KIT_DESIGN.md` §12 decision 10 says which pull requests Claude merges on its own after an independent review, which checks must pass (every applicable `checks.yml` job, with "success", on the final head commit), and Claude's readings; `review/porter-policy.md` follows it; no course update goes live without Louis's reply.
- `core/test.js`: the check that a missed concept returns as a different wording takes its two questions from one topic, so a concept with wordings in two topics no longer fails it falsely.
- Kit checks on GitHub: the WebKit job now blocks a merge, as the Chromium jobs do.
- `FEATURES.md`: the focus-switch "Use when" line no longer quotes a professor by name; its source reference is kept.
- `core/test.js`: two lectures with the same id in `course.js` fail the check.
- `core/offline_test.js`: "server down" refuses connections; dropped ones broke WebKit's network session at random.

## 2026-11-02
- `core/style_check.js`: "given as" in a dose or a problem (given as an IV infusion) is no longer flagged.
- `core/home_test.js`: answers a select-all question it picks, with its right boxes, so it no longer fails at random.
- New feature module `glossary-tap` v1 (`features/glossary-tap/`), from Intro-Pharmacology
  `929cd62` (`exam1-drill/src/app.js` 1771-1922, port queue item 18): a Glossary tab over the
  course's `TERMS` with search, a letter bar, by-group or A-Z order and group chips; and,
  written for the kit, after an answer is shown a term named in the explanation, or in a
  section of the Guides, Tell apart and Reference tabs, can be tapped for its definition. A
  term the core's `GLOSS` has glossed in brackets in a question is left to the core. BDK's
  glossary is not part of it (it moves with BDK). With `formulas-in-text` on, its pass over a
  question card runs before the buttons are added, in either course.js order; a term inside a
  quotation is not marked unless the quotation is its name alone. Its test: 56 checks, 93 when
  `formulas-in-text` is in the course too. Its own course, from Intro to Pharmacology's
  lectures L02, L04 and L10 (122 questions, the professor's name kept as the source has it),
  is written by `features/glossary-tap/ci/oncourse.js`.
  Core and template unchanged; no course switches it on.
- Kit checks on GitHub: every pull request runs the checks in Chromium and, as information, in WebKit.
- Checks open built pages over HTTP from 127.0.0.1, not from disk, so WebKit no longer refuses the manifest.
- Kit checks on GitHub: each changed feature module, and each module that needs it, is checked on a course of its own.
- New feature module `pair-up-drills` v1 (`features/pair-up-drills/`), from Intro-Pharmacology-
  `929cd62` `exam1-drill/src/app.js` (Pair up, the drug ↔ receptor drill and the poisoning table
  drill; port queue item 19): a Pair up tab over the course's `PAIR_SETS` (chips dragged or tapped
  into boxes, one or several per box, checked with where each belongs and why, the wrong ones
  retried) and one tab per table of the course's `RECALL_TABLES` (each row asked column from
  column with one tap among answers from the other rows, misses first in the next round, Cover
  and reveal). Best scores and misses are kept in the progress as `DB.pairup`. No course switches
  it on yet; the core and the template are unchanged. Its test: 69 checks pass on a template
  scratch course with Intro to Pharmacology's 5 sets, 39-drug table and 12-row poisoning table
  as course data (written by `features/pair-up-drills/ci/oncourse.js` from the fixture that
  `port_from_ip.js` takes from that course's files); with the module's code left out, 1 of 1 fails.
- New feature module `study-controls` v1 (`features/study-controls/`), from Intro-Pharmacology- `929cd62`: flags with Drill flagged, one at a time or all on one page, keyboard shortcuts, and a strict paper with no going back, each switched on by its own option. No course switches it on yet. After review: no shortcut acts while a dialog such as worksheets-ink's Scratch paper is open or while a pen is down on a canvas; the ticked strict box survives a redraw of the start page; a paper with calculations stays one at a time. Test: 59 checks (61 with paper-picker on), on Intro to Pharmacology's own Day 1 questions.
- New feature module `concept-statuses` v1 (`features/concept-statuses/`), from
  Basic-Pharmacokinetics `ac2eb73` (`src/views.js` 2506-2725): a Concepts section on Weak
  spots with a status per concept (Unfamiliar, Struggling, Improving, Mastered, Returning,
  Learning) read from the answers, the counts behind it, the option chosen most often, the
  most common kind of miss, Practice this concept, and the spaced checks due. It reads the
  core's state and does not change how the core schedules. `FEATURES.md` corrected: the
  core has the concept scheduler and a mastered count, not the named statuses. Test: 89
  checks (PK `src/test.js` section 4c and `src/sweep_test.py` `concept_check` ported, on PK
  data taken verbatim, with persistence checks on a long answer history); `ci/oncourse.js`
  writes the module's course for the kit's CI.
- New feature module `paper-picker` v1 (`features/paper-picker/`), from Basic-Pharmacokinetics
  `ac2eb73` (`pickExam`, `chooseExam`, `examPicker`, `examHistory`): on the Exam view and in
  Settings, a chip per exam a paper can be drawn for; a paper for an earlier exam is drawn
  from that exam's pools through the `X.paper` hook, at the current exam's length and clock
  (an exam of another length, clock or `typed` setting is left off the chips, with the
  reason shown); "Your papers so far" lists each paper submitted on a page with the module
  on (`DB.paperPicker`). Topics, Weak spots and the weighted pass still follow the current
  exam. No course switches it on yet. Test: `features/paper-picker/current/test.js`, on
  Basic-Pharmacokinetics' own exams and questions (`test_fixture.js`, every field as the
  course has it, the professor's name included); `ci/oncourse.js` writes the same data into the kit's CI course, with
  its question, topic, subtopic and lecture ids prefixed `pp-`; the test's Chromium part
  also runs on a course with one exam or with other modules' data.
- New feature module `quiz-prep-cards` v1 (`features/quiz-prep-cards/`), from Basic-Pharmacokinetics `ac2eb73` (`src/views.js` 466-512): a card at the top of Topics for each quiz in course.js `quizzes` until the quiz is over or is hidden, with its day, the days left, what it covers, what the professor said to prepare, and drills over its questions; Settings puts a hidden card back. It does not change the exam handling and has no timed practice quiz. No course switches it on yet.
- New feature module `module-pages` v1 (`features/module-pages/`), from Basic-Pharmacokinetics `ac2eb73` (`src/views.js` 722-854): a card per module above the topic list on Topics, each opening the module's Concepts (by the professor's objectives), Calculations (by kind of problem, each with a worked example) and, with worksheets-ink on, Worksheets; with chained-problem-sets on, In parts; with concept-statuses on, a status line per objective. Course data `OBJECTIVES` and `CALC_TYPES` (both optional), checked by its build step. Test: 30 checks on its own course (PK's Module 2 written by `ci/oncourse.js`), 42 with chained-problem-sets, worksheets-ink and concept-statuses also in the course. `core/` and `template/` unchanged.
- New feature module `stopwatch` v1 (`features/stopwatch/`), from Basic-Pharmacokinetics
  `ac2eb73` (`src/views.js` 1463-1482 and the places that use it): a running clock on each
  calculation in the quiz and on a paper that draws calculations; after the answer it shows
  the time taken, which is the `ms` the engine records; with `paceSeconds` (PK: 120) a time
  past the pace is red and says "over 2:00". On a paper the time on each question is added
  up while it is shown and kept with its answer as `ms`. The core already recorded the time
  of quiz answers and lists "Right, but slow"; PK's time per kind of calculation on Weak
  spots is not ported. Test `features/stopwatch/current/test.js` (29 checks), on the
  module's own course (`features/stopwatch/ci/oncourse.js`): PK's Exam 3, the 5 calculations
  of the professor's Quiz 4 and 63 of PK's questions for Exam 3's pools, from
  `features/stopwatch/current/test_fixture.js`; ids prefixed `sw-`, and a `setup` line or
  `asks` key written only when the course has that equation or key. No course switches it
  on; `core/` and `template/` unchanged.
- `core/render_test.js`: answers calculation and matching items with their own controls; no more random failures.
- New feature module `plan-the-problem` v1 (`features/plan-the-problem/`), from
  Basic-Pharmacokinetics `ac2eb73` (`src/views.js` 4754-5120, the set-up drill): on the
  Equations tab, a calculation stem with no arithmetic, where the student picks the line
  that solves what is asked from four and then reads why, the lines used on the way and
  how to reach a line the sheet does not print; "Plan the problem" asks first what is
  asked and its unit (with `ASKS`) and the dosing model (with `PLAN`), then the line,
  whether the sheet prints it and which givens it uses, and writes the plan out. It
  needs `formulas-in-text` and `equation-drill`. PK's dosing models, unit lures and calculation routine are the
  course's `PLAN` data in the kit, not code; the sentence split has no regex lookbehind;
  the lines missed are kept in the progress as `DB.setup`. Not ported: the whole-sheet
  choice, ten stems to a page, the quiz and exam scopes, and the buttons into the quiz and
  the typing drill. Its test (PK `src/test.js` 788-795 and 997-1068, `src/review_test.py`
  255-268 and 396-438 ported, and checks added in review: the wrong choices, the models
  against PK's own code, the saved tally through Export, Import, profiles and blocked or
  full storage): 54 checks pass on the module's own course of PK data, which
  `features/plan-the-problem/ci/oncourse.js` writes (its lectures with ids prefixed `plc-`,
  so it no longer refuses a course where another module took L91). Port queue item 1 is
  partial.
- New feature module `short-answer-graphs` v1 (`features/short-answer-graphs/`), from
  Intro-Pharmacology `929cd62` (`exam1-drill/src/app.js` 2402-2444, 3716-3778 and
  3821-3854): a Short answer page, where the student writes an answer, shows the model
  answer and ticks the key points it covers (self-check, as in that course; the draft and
  ticks are kept in the progress as `DB.sa`), and a Graphs page, one card per figure of the
  professor's, where "Drill this figure" asks that figure's questions in turn, a wrong pick
  names the reading question skipped, each answer shows how to read the figure, and the end
  of the pass lists what was skipped. The prompts, the figures and the miss-tag tables are
  the course's `SHORT_ANSWERS`, `GRAPHS`, `GRAPH_MISS` and `GRAPH_EXAMS` data; each page
  appears only when its data is there. Not ported: the quote clean-up (`tidySpeech`), the
  page cache and the one-exam focus mode. A saved short answer of another shape is
  cleaned when the progress is read in. `ci/oncourse.js` writes the module's own course
  from that course's data. Its test (that course's `browser_test.js` 114-123 and C8 and
  `test.js` 60-84 ported, with persistence checks): 69 checks pass, 7 of them build
  refusals; with the module's code left out, 1 of 1 fails. Port queue item 20 is partial
  (left: the transcript-quote clean-up).
- New feature module `worksheets-ink` v1 (`features/worksheets-ink/`), from
  Basic-Pharmacokinetics `ac2eb73` (`src/views.js` 5122-5434 and 6040-6322): a Worksheets
  tab of the documents the course's questions come from (`SOURCES`), each worksheet opened
  over the page to write on with a pen, a finger or a mouse (pen, highlighter, eraser,
  undo, More room, Pencil only, Hold to snap, two-finger undo, Show solutions, Save as
  PDF), Practice in the drill, and Scratch paper beside a calculation in the quiz and on an
  exam paper. The writing is kept in the profile's progress (`DB.ink`), so Export, Import
  and Erase cover it. Its build step checks every document against the bank. PK's
  headings, number-variant id patterns and audit phrases are options, not code. Not
  ported: the PDF files, the source line under an answer, the likely-paper marks.
  Its test (PK `src/ink_test.py` ported to Node Playwright, Chromium only): 114 checks
  pass; with the module's code left out, 1 of 1 fails. Port queue item 2 is partial (left: the PDF
  files, the source line under an answer, each part's vignette line on a sheet of several sets,
  the missed-on-this-sheet marks). Hardened the same evening: the writing is written when the pen
  lifts, and a change that would make the progress too big for the browser's storage is refused
  with a notice on screen, keeping the last saved progress, so later answers are still saved (before,
  every later save failed and the answers given after it were lost on reload); the test now has 157
  checks (persistence, chained-problem-sets on and off) on 8 Pharmacokinetics documents taken
  verbatim, and `ci/oncourse.js` builds the module's own course from 4 of them.
- New feature module `terms-variables` v1 (`features/terms-variables/`), from
  Basic-Pharmacokinetics `ac2eb73` (`src/views.js` 1029-1260, its Terms tab, and 4173-4175):
  a Terms tab with Flashcards over the course's `TERMS` (a situation with the term blanked,
  then the term, marked and recorded) and Quiz me (up to three questions per term, drilled by
  the scheduler), and the variables quiz over the course's `ASKS`: which symbol one of the
  professor's own calculation stems asks for, what each symbol means and which symbol a
  meaning belongs to, also offered on the Equations tab when equation-drill is on. It reads
  `TERMS` in the shape glossary-tap (pull request #13) reads and `ASKS` in the shape
  plan-the-problem (pull request #11) reads; PK's Glossary mode is left to glossary-tap, and
  its tab id (`terms`) differs from glossary-tap's (`glossary`). PK's symbol families, usual
  names and twins are the options `families`, `names` and `twins`; the sentence split has no
  regex lookbehind. The questions stay out of the bank and off exam papers, and Weak spots
  does not list them. On PK's whole bank the module makes the same 282 term and 301 variable
  questions, with the same keyed answers, as PK's own code. Its test (PK `src/test.js`
  943-972 and `src/var_test.py` ported, with checks of the wrong options, the flashcard
  marks and the saved answers): 57 checks pass on the module's own course, written by
  `features/terms-variables/ci/oncourse.js` from PK's own data; with the module's code left
  out, 1 of 1 fails; with PK's lookbehind split in its place, `device_lint.js` fails 2 of 3.
  `features/ci-combinations.txt`: terms-variables with equation-drill.
  FEATURES.md: PK added to the `glossary` entry; new entry `terms-variables`. Port queue
  item 3 is partial: Weak spots and a reload during a drill need a core change.
- New feature module `theme` v1 (`features/theme/`), from Basic-Pharmacokinetics `ac2eb73`
  (`src/views.js` 6323-6333 and `src/shell.html` 979-1042): dark colours for the whole page
  (the core has light colours only) and the student's choice of Match device, Light or Dark
  in the header and in Settings. The choice is kept in the browser under `<ns>:theme` for
  every profile, not in the progress, so Export does not carry it. Its test has 46 checks,
  run on Basic-Pharmacokinetics questions as well as the course's own (first frame, reload
  timing, Export and Import, storage denied and full, contrast); run on a copy with the
  module's code emptied it fails. Known limit: on a page of 1.5 MB or more a stored Dark can
  show light for a moment when the page opens, and a stored Light dark (on 2026-11-03, 6 to 10
  and 4 to 8 of 12 reloads of a 1.6 MB page); the test reports it as a skip labelled KNOWN LIMIT
  T1 with its count, and the fix needs a core change (a script in `<head>`). `features/theme/ci/oncourse.js` switches it on in the kit's
  CI courses. No course switches it on yet.

## 2026-11-01
- `core/`: an exam with `questions: null` or a pool with `marks: null` no longer breaks the page (`nullexam.js`).
- `core/`: a pool without marks makes the whole exam unweighted; `minutes: null` with a count gives an untimed paper.
- `core/`: a practice paper keeps the timing it started with when the course later sets a time limit.
- `core/`: a fault at start-up can no longer cost saved progress (Louis approved the fix).
  Found in a scratch move of Pharmacokinetics: a `DIAGRAMS` list of another shape made a
  tab step throw, start-up stopped before the saved progress was loaded, and the next
  answer's save replaced it. Start-up now loads the progress before any step that builds
  the page; every write of the progress, the answer history and the exam paper waits for
  a load that worked in this visit; when the load fails (not valid JSON, or a value it
  cannot convert) the stored value is left as it was, Import and Erase do nothing, and one
  notice says "Your saved progress could not be loaded. Nothing will be saved during this
  visit, and the saved progress is left as it was." Each later start-up step runs on its
  own: one that throws is skipped with its error on the console, and a tab whose list
  cannot be built is removed. A stored answer history that cannot be read is no longer
  written over. New check `startup_test.js` (77 checks; 40 of them fail on the d187207
  core and on Medicinal-chemistry's live page, where 5 saved answers were replaced by a
  save of 1). `run_checks.sh`: template scratch course 23 PASS, 0 FAIL, 1 NOT RUN,
  1 REPORT; the Medicinal-chemistry copy 22 PASS, 0 FAIL, 2 NOT RUN, 1 REPORT.
- New feature module `wrong-number-diagnosis` v1 (`features/wrong-number-diagnosis/`), from
  Basic-Pharmacokinetics `ac2eb73` (`missDiagnosis`, its `src/shell.html` 1270-1338, written
  into the module by `port_from_pk.py`): after a wrong typed number, in the quiz and on a
  paper's result page, up to two lines say what the number is and which kind of miss that
  is, and the engine's miss chip it points to is marked. The pick stays the answer's `miss`
  (what Weak spots counts), the reading is kept as `missSuggest`, and a progress saved with
  PK's `missKind` gets `miss` from it when loaded or imported. Its test (PK `test.js`
  368-387 ported): 15 checks pass; with the module's code left out, 1 of 1 fails.
- New feature module `equation-drill` v2 (`features/equation-drill/`), from
  Basic-Pharmacokinetics `ac2eb73`: an Equations tab over the course's `EQUATIONS`, grouped
  by module, each equation marked on the sheet, not on it, or to memorise, and opening what
  each symbol is, when it holds, how to reach it and its source; a writing drill types the
  right-hand side (any spelling of the same algebra counts) or builds it from pieces, some
  wrong, learned at 3 right in a row. It needs `formulas-in-text`. Its code is PK's,
  assembled by `features/equation-drill/port_from_pk.py`. Not ported: the set-up drill, "How
  she asks it", the variables quiz, the sheet map. Its test (PK `equation_test.py` and
  `test.js` 5d ported): 30 checks pass; with the module's code left out, 1 of 1 fails.
- New feature module `chained-problem-sets` v2 (`features/chained-problem-sets/`), from
  Basic-Pharmacokinetics `ac2eb73`: the course's `CHAINS` (problems asked in parts) get a
  "Problems asked in parts" card on Topics; a set runs in the professor's order with "part i
  of n", the vignette above each part and a closing card naming it; a part met alone names
  its set and offers it from part 1; a paper keeps a set's parts together and in order (the
  new `X.paper` hook). Its build step stops the build on a set naming a missing question.
  Its test (PK `problemset_test.py` and `test.js` 5c, 760-807 ported, including the check
  that every earlier result a part uses is stated in its stem): 17 checks pass; with the
  module's code left out, 5 pass, 2 fail, then it stops (no Start button).
- `core/`: an exam in `course.js` with `typed: true` (new, off unless set) puts
  `exam_typed.js` in the page, and that exam's papers draw numeric and matching items by
  the same rules as the rest (the engine's own draw, with their `type` set aside while it
  runs); on the paper a calculation is typed and a matching item picked row by row, kept
  through a reload, graded as in the quiz, recorded on submit and reviewed with the answer
  and the working. New check `exam_typed_test.js` (17 checks pass; on the `d187207` core
  4 pass, 5 fail, then it stops: no box to type the number). `test.js`, `browser_test.js`
  and `history_test.js` answer a calculation or matching item when one is first on a paper.
  Feature modules get one more hook, `X.paper`: a new paper's questions, in order, before
  it starts (`features_test.js`: 40 checks).
- `core/`: `course.js` `numeric` (new, off unless a course sets it) puts `numeric.js` in
  the page: a typed number is read with its unit after it (`2.6 hr`, `0.17 1/hr`,
  `0.17 hr-1`), two numbers are never joined into one, and with `numeric.margin` an item is
  right within max(`tol`, margin × |key|) (Basic-Pharmacokinetics: `{margin: 0.02}`); the
  verdict names the margin. On PK's 534 numeric items, PK's own grader and this option
  agree on every item typed eight ways; without the option the core agrees with PK on 145
  of 534 at the key + 1.5%, 400 at the key and ` 1/hr`, 0 at ` hr-1`, and on 152 at the key
  and ` 5` (382 right only in the core) (`core/README.md` "Typed numbers"). New check
  `numeric_test.js` (16 checks pass; 9 of 16 fail on the `d187207` core).
- New feature module `formulas-in-text` v1 (`features/formulas-in-text/`), from
  Basic-Pharmacokinetics `ac2eb73`: formulas typed in plain text are drawn as the slides
  print them, as each question is drawn (`{{frac:a|b}}` stacked, powers, the course's
  subscripts from the `symbols` option, t½, × and −), and fractions in the reading tabs
  stack; stored text is unchanged. A module, not core: the symbol table is course data and
  only calculation courses need it. Its test: on 8 PK questions and 1 calculation, every
  stem (8), option (32) and worked step (3) is drawn exactly as PK's own formatter draws
  it, plus PK's control cases (6 formulas, 3 runs of ordinary text); 11 checks pass, 1 skip
  on the template course (no fractions in its bank). With the module's code left out the
  same test fails 4 checks and then stops (`FX.api('formulas-in-text')` is null).
- Feature modules (`features/README.md`): `course.js` `features: {<name>: {version,
  ...options}}` now switches on a module copied from the kit's `features/<name>/current/`
  to the course's `src/features/<name>/`. `build.py` checks the pinned version, the
  options and the modules a module needs, runs its build step, and puts `core/features.js`
  (the hooks: a tab, a question type, a step after an answer, a pass after a view is drawn,
  reading-tab HTML, a Settings section, a start-up step, a progress converter) and the
  module into the page; a module that throws is skipped and the page carries on. With no
  module on the page is unchanged: the template course built from the same sources by the
  `d187207` core and by this one differs only in the build stamp (241,642 bytes each, with
  the 15 lines of documentation this change adds to `template/course.js`'s header).
  `run_checks.sh` adds `build.py --list-checks`: the checks of what a course switches on.
  New check `features_test.js` (39 checks; on the `d187207` core 4 pass, 9 fail, then it
  stops at the first browser step: `FX is not defined`). `run_checks.sh` on the template
  scratch course: 22 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT, as before.
- `core/`: the Home Screen card no longer appears on Topics; in Settings it is a section
  that starts closed, its one line the card's heading ("Keep your progress: add <short>
  to your Home Screen" in Safari on iPhone and iPad, "Progress from Safari" in a Home
  Screen copy with no progress, "Install <short>" where the browser offers an install
  prompt), opening to the same steps and buttons as before (Louis, after trying
  Medicinal-chemistry's preview on his phone). "Not now" is gone. `home_test.js` checks
  it (33 checks; 15 of them fail on the d13462e core). `run_checks.sh`: template scratch
  course 22 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; the Medicinal-chemistry copy 21 PASS,
  0 FAIL, 2 NOT RUN, 1 REPORT.
- `core/`: the course tables of `cite_check.py` (`ALIASES`, `LECTURES`, `BARE_MAP`),
  `explain_check.js` (`WEIGHTY`) and `harvest_mask.py` (`SPEC`) move into `course.js`
  `tools` (`citeAliases`, `citeLectures`, `citeBareMap`, `explainTerms`, `harvestMasks`),
  so a core update no longer resets them to the kit's empty ones; the three files hold
  no course data. Each tool prints what it read with `--tables`; the build stops on a
  `tools` field no tool reads or a table of the wrong shape. New check `tables_test.js`
  (20 checks; 15 of them fail on the 47bf534 core). On a scratch copy of
  Medicinal-chemistry's `kit/move-to-core` with its tables moved into `tools`, the tools
  read the same tables, and `explain_check.js` (816 lines) and `cite_check.py` against
  its 20 decks (PASS, 1191 slide references) print the same output as with the course's
  own three files; with the kit's empty tables `cite_check.py` fails on 1 citation.
  `run_checks.sh`: template scratch course 22 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; the
  Medicinal-chemistry copy 21 PASS, 0 FAIL, 2 NOT RUN, 1 REPORT.
- `core/`: the site opens straight to the drill and never asks for a name on its own
  (Louis): with no name stored it opens the saved progress used most recently, else a
  profile named "me"; the Switch button still asks. `storage_test.js` and `test.js`
  check it.
- `core/`: fixes found moving Medicinal-chemistry onto the core. The data files are
  listed in `course.js` `files` instead of `build.py` (copying the `9f2f2a4` `build.py`
  over Medicinal-chemistry's left 39 of its 479 questions in the page, with no error), and
  the build stops on a question file the list leaves out; `build.py --list-files`. The
  page's question count is `QUESTIONS.length` (it said 13 for the template's 7 and 551
  for Medicinal-chemistry's 479). `scheduler_test.js` finds the first question file from
  the list; `test.js` and `render_test.js` run without a `DIAGRAMS` list; the offline,
  old-cache and preview tests run on a course with its own `oldCachePrefix` and a large
  page; `update_test.js` pauses its fake clock (its 15-minute check failed in 4 of 20 runs
  on Medicinal-chemistry, then in 0 of 20 on each course); the comparison's arms are
  hashed with `COURSE.ns`, the same in a preview; `course.js` `manifest` gives the web
  manifest `description` and `orientation`; wide tables in the reading tabs scroll in
  their own box on a phone (approved by Louis). New check `files_test.js`. With these,
  `run_checks.sh` on a template scratch course: 21 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; on a
  scratch copy of Medicinal-chemistry's `kit/move-to-core`: 20 PASS, 0 FAIL, 2 NOT RUN,
  1 REPORT.
- `core/`: `course.js` `oldCachePrefix` for a drill that had its own service worker
  before the core (Medicinal-chemistry: `phar4342-drill-`); the worker deletes those
  caches and no other; `oldcache_test.js`.
- `core/` and `template/`: the recovered template split into the shared engine and the
  new-course skeleton, with the build writing to the repository root, `store` for
  refused writes, the offline copy scoped to each course's own caches, the exam draw
  keeping dupOf families off one paper across pools, the update offer and place after
  a reload, check exit codes with `run_checks.sh` and the Safari lint, the answer
  history and the Home Screen card. Each change has a test shown failing on the
  template first.
- `KIT_DESIGN.md` §12.9: how kit updates reach courses (Louis's choice). Feature and core
  updates are built to each course's preview automatically and go live on his reply;
  catalog bookkeeping and `small-fix` changes go live automatically when every check
  passes, the progress format is unchanged, and no exam is within N days (N not set).
  `skill/SKILL.md` Mode 7 and the phrase table describe the kit-update run and undo.
  Then, also from Louis: Claude explains each feature or core pull request in plain
  terms and merges it after his yes; automatic updates skip only the day of an exam;
  the scheduled task "Kit update run" runs daily at 2:47 AM Central.
- `core/`: the approved scheduler (`review/scheduler-proposal.md` §4-§5): exam-date
  spacing, "I was sure of that" with a later-day check, the calculation preset, the
  FSRS-7 option through ts-fsrs 6.0.0 (MIT, in `core/vendor/`), the per-concept
  combination with its comparison, three new answer-log fields, and a converter for
  progress saved by the earlier core; `scheduler_test.js` (109 checks). Parameter
  fitting is not built.
- `core/`: `build.py --preview` with `preview_test.js`; `state_check.js` with
  `state_check_test.js`.
- The kit-update run moved into a dedicated session, "Kit updater", after a test showed
  a fresh scheduled session starts with no repository. Each run begins with a preflight,
  confirms deploys with `gh api` (no connector needed), reverts an update whose deploy
  fails or does not finish in 10 minutes, and notifies Louis only when something needs
  him. Course repositories are attached to that session by Louis's own message.
- `review/recommendation-proposal.md`: how the kit recommends features (material-profile
  signals, a rule table with evidence levels, a within-course random comparison of
  concept clusters, decision rules), with nine questions for Louis; research notes in
  `review/research-notes/recommendation-2026-11-01.md`. `skill/SKILL.md` "Recommending
  features" and `KIT_DESIGN.md` §12.7 describe it, pending approval.
- `KIT_DESIGN.md` §12: design changes Louis approved after Phase 1.
- Skill archives moved to `history/`; recovered template kept in
  `history/exam-drill-template-2026-10-02/` (from Medicinal-chemistry's unpushed `baed236`).
- `FEATURES.md` (50 entries), `COURSES.md` (4 courses), `CLAUDE.md`, `features/README.md`
  created from the Phase 1 drafts.
- `review/scheduler-proposal.md` approved: concept scheduler default with exam-date
  spacing, confident-error check, calculation preset and answer log; FSRS-7 option;
  off-by-default combination with a built-in comparison.

## 2026-10-31
- Phase 1 evaluation: `review/findings.md`, `review/proposed-core.md`,
  `review/FEATURES.draft.md`, `review/COURSES.draft.md`.

## 2026-10-30
- `KIT_DESIGN.md` (design brief) and the two skill archives added.
