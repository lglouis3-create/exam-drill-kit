# Changelog

Dated kit changes, newest first.

## 2026-11-02
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
  lectures L04 and L10 (66 questions), is written by `features/glossary-tap/ci/oncourse.js`.
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
