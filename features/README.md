# Feature modules

One folder per feature that has been ported from a course drill into the kit:

```
features/<name>/
  current/       the active version of the module, with its own test
    module.json  what the module is and which files it ships (below)
    <name>.js    its code; <name>.css its styles; step.js its build step, if any
    test.js      the module's test, which run_checks.sh runs when the module is on
  archive/vN/    every earlier version, unchanged (decision 4), each with its test
```

The test sits inside `current/` (KIT_DESIGN §4 drew it beside `current/`), so that a
version and the test written for it are kept and archived together, and one copy
brings both into a course.

A feature listed in `FEATURES.md` but not yet here is kept, unchanged, at the course
repo and commit its version line names; it is ported when a course's material calls
for it (decision 7), by a kit pull request that adds the module, its test and the
updated catalog entry.

## Switching a module on in a course

1. Copy the module's `current/` into the course as `src/features/<name>/`:

       mkdir -p COURSE_REPO/src/features/<name>
       cp -r features/<name>/current/. COURSE_REPO/src/features/<name>/

2. Name it in `course.js`, with the version the folder holds and any options:

       features: {'formulas-in-text': {version: 'v1', symbols: [['VD', 'V<sub>D</sub>']]}},

3. Put the data the module reads (for example `CHAINS` or `EQUATIONS`) in a course
   file listed in `course.js` `files`, as the module's `module.json` `does` line says.
4. `./run_checks.sh`: the module's own test runs with the core's checks.

The course pins the version (KIT_DESIGN §7.5): the build stops when `course.js` names a
version the folder does not hold. Only a drill update (Mode 7) copies a newer
`current/` in and changes the pin. A course without `features`, or with `features: {}`,
builds the page the core built before modules existed, byte for byte except the build
stamp: no module code and no hooks are in it (`core/features_test.js` checks this).

## module.json

| Field | What it holds |
|---|---|
| `name` | the folder name, which is the name `course.js` uses |
| `version` | `v1`, `v2`, ...: the version this folder is |
| `does` | one line: what the module adds for the student, and the course data it reads |
| `source` | where the code was ported from: course, file, commit |
| `js`, `css` | the module's files, in the order they go into the page |
| `step` | optional: a build step (below) |
| `needs` | optional: modules that must be switched on too; they go into the page first |
| `types` | optional: question `type` values the module draws and grades |
| `options` | optional: `{<option>: {default, about}}`; a course may set only these, with a value of the default's kind |
| `test` | the module's test file, relative to the folder |

The build refuses a field it does not know, so a misspelt field cannot be ignored.

## What the build does with a module

- **Order in the page:** the shell (storage, scheduler, `record`), the course's data,
  then the core's calculation options that are on (`numeric.js`, `exam_typed.js`), then
  `features.js` (the hooks), then each module (a module after the ones it `needs`,
  otherwise in `course.js` order), then `views.js`. Module CSS goes at the end of the
  page's styles.
- **Wrapping:** each module's files are wrapped as
  `FX.load('<name>', '<version>', {options}, <step output>, function(X, OPT, DATA){'use strict'; ...})`,
  so its top-level names stay its own. It runs before `views.js`: while it loads it only
  defines things and registers hooks, and it uses the engine inside its hooks, which run
  later.
- **Build step:** `step.js` runs in node after `course.js` and the data files, with the
  module's options as `OPT`. It sets `STEP` to what the page should carry for the module
  (the module reads it as `DATA`), or throws an `Error`, which stops the build with that
  message before anything is written. A step checks the course's data for the module
  (a problem set that names a question the bank does not have).
- **Question types:** a question whose `type` is not `numeric` or `match` stops the
  build unless a switched-on module lists that type in `types`.
- **Checks:** `--list-sources` names `features.js` and every module file, so
  `device_lint.js` reads them; `--list-checks` names `features_test.js` and each module's
  test, which `run_checks.sh` adds to its checks; `--list-features` prints the modules
  on, with their options.

## The hooks

On `X`, the handle a module gets (`core/features.js` holds the code and the same list):

| Hook | When it runs |
|---|---|
| `X.tab({id, label, render(pane), before})` | a nav tab and its pane `#v-<id>`, placed before the tab `before` (default `settings`); `render` draws the pane when the tab is opened; a reload on the tab comes back to it |
| `X.type(name, {body(q, Q), wire(q, el, Q), read(q, el, Q), grade(q, picked)})` | a question type: the quiz card's body (the engine draws the head, the stem, Next and the confidence buttons), how the answer is read off the card, and the grader; the answer is recorded as any other |
| `X.after(fn(q, result, picked, mode, entry))` | after every recorded answer (quiz, sweep, exam); `entry` is the answer as kept in the progress (`DB.answers`), so a module can add a field to it |
| `X.rendered(fn(pane, view))` | after the engine draws into a view's pane, once per batch of changes |
| `X.reading(fn(html))` | the HTML of a reading tab (Guides, Tell apart, Reference) before it is drawn; returns the HTML to draw |
| `X.paper(fn(qs))` | the questions of a new exam paper, in order, before it starts; returns the same questions, in the order to ask them |
| `X.settings({title, html(), wire(el)})` | a section at the end of Settings |
| `X.start(fn())` | once, after the first progress load |
| `X.progress(fn(db))` | on every saved progress read in (page load, profile switch, Import), before the engine uses it: a converter for answers saved in an older shape |
| `X.api(object)` | what the module offers other modules, read with `FX.api('<name>')` |

The engine functions these attach to are wrapped in `features.js` and nowhere else:
`show`, `renderQuiz`, `renderSettings`, `refFigures` and `drawPaper` (`views.js`), `record`,
`load` and `upgradeDB` (`shell.html`). Each wrapper calls the engine's own function and adds the
module's part before or after it, so the engine's own code is unchanged. If one of
them cannot be wrapped (renamed in a later core), the page still runs, the hooks that
need it are missing, `FX.errors` says which, and `features_test.js` fails.

**A module that fails:** one that throws while it loads is not registered; a hook that
throws switches its module off for the rest of the visit (its tab goes, and the page
shows Topics if that tab was open). The error is kept in `FX.errors` and printed to the
console, and the other modules and the core carry on. A question of a type whose module
is off says so on its card and offers the next question.

## Modules here

| Module | Version | Ported from | What it adds |
|---|---|---|---|
| `formulas-in-text` | v1 | Basic-Pharmacokinetics `ac2eb73` | formulas set as the slides print them: stacked fractions, powers, the course's subscripts |
| `chained-problem-sets` | v2 | Basic-Pharmacokinetics `ac2eb73` | problems asked in parts, worked in the professor's order; parts kept together on a paper |
| `equation-drill` | v2 | Basic-Pharmacokinetics `ac2eb73` | an Equations tab: every equation with its symbols and conditions, typed or built from pieces; needs `formulas-in-text` |
| `wrong-number-diagnosis` | v1 | Basic-Pharmacokinetics `ac2eb73` | what a wrong typed number says about the slip behind it, beside the miss chips; converts PK's saved `missKind` |
| `plan-the-problem` | v1 | Basic-Pharmacokinetics `ac2eb73` | a set-up drill on the Equations tab: pick the line that solves a stem, no arithmetic, and plan the whole problem; needs `equation-drill` |
| `glossary-tap` | v1 | Intro-Pharmacology `929cd62` (the tap part written for the kit) | a Glossary tab over the course's `TERMS` (search, letter bar, groups); after an answer, a term in the explanation or a reading section can be tapped for its definition |
| `pair-up-drills` | v1 | Intro-Pharmacology- `929cd62` | a Pair up tab (chips into boxes, checked with why) and one tab per course table (each row asked column from column; Cover and reveal), from the course's `PAIR_SETS` and `RECALL_TABLES` |
| `short-answer-graphs` | v1 | Intro-Pharmacology `929cd62` | a Short answer page (write, show the model answer, tick the key points) and a Graphs page (drill one figure's questions; a wrong pick names the reading question skipped) |
| `study-controls` | v1 | Intro-Pharmacology- `929cd62` | flags with Drill flagged, one question at a time or all on one page, keyboard shortcuts, a strict paper with no going back; each part an option; `FX.api('study-controls')` gives the flags to other modules |
| `worksheets-ink` | v1 | Basic-Pharmacokinetics `ac2eb73` | a Worksheets tab of the course's source documents, each worksheet written on with a pen, a finger or a mouse, and Scratch paper beside a calculation; the writing is kept in the profile's progress |
| `terms-variables` | v1 | Basic-Pharmacokinetics `ac2eb73` | a Terms tab: flashcards and questions over the course's `TERMS`, and the variables quiz over its `ASKS` (which symbol a stem asks for, what each symbol means) |
| `concept-statuses` | v1 | Basic-Pharmacokinetics `ac2eb73` | a Concepts section on Weak spots: a status per concept read from its answers, the counts behind it, the spaced checks due; reads the core's state and changes none of it |
| `theme` | v1 | Basic-Pharmacokinetics `ac2eb73` | dark colours, and the student's choice of Match device, Light or Dark (header and Settings), kept per device under `<ns>:theme`, not in the progress |
| `paper-picker` | v1 | Basic-Pharmacokinetics `ac2eb73` | choose which exam's paper to practise (drawn from that exam's pools at the current exam's length and clock); the papers submitted so far |
| `quiz-prep-cards` | v1 | Basic-Pharmacokinetics `ac2eb73` | a card on Topics for each quiz in course.js `quizzes` until it is over: day, days left, what it covers, what the professor said, drills over its questions |
| `module-pages` | v1 | Basic-Pharmacokinetics `ac2eb73` | a card per module on Topics opening the module's Concepts (by objective), Calculations (by kind, with a worked example) and, with worksheets-ink on, Worksheets |

`port_from_pk.py` beside a module's `current/` (equation-drill, wrong-number-diagnosis) is the
script that wrote the module's code from Basic-Pharmacokinetics' files (`port_from_ip.js` beside
pair-up-drills' `current/` writes that module's test fixture from Intro to Pharmacology's files); each of its
replacements must match exactly once, so run on other files it stops instead of writing a
different module. It is not copied into a course.
