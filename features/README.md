# Feature modules

One folder per feature that has been ported from a course drill into the kit:

```
features/<name>/
  current/       the active version of the module, with its own test
    module.json  what the module is and which files it ships (below)
    <name>.js    its code; <name>.css its styles; step.js its build step, if any
    test.js      the module's test, which run_checks.sh runs when the module is on
  ci/oncourse.js switches the module on in a scratch course for the kit's checks (below)
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

## Checked on a course of its own

Every module has `ci/oncourse.js`, beside `current/`. `core/ci_course.sh module:<name>`
builds the template course, copies `current/` into `src/features/<name>/` and runs

    node features/<name>/ci/oncourse.js <kitDir> <courseSrcDir>

which switches the module on in that course: it writes the module's course data (taken
from the fixture its `test.js` already uses, nothing invented; ids prefixed so they never
meet the test's own copies) and appends one `course.js` line with the module at the
version in its `module.json`. It writes only inside `<courseSrcDir>`, prints what it
wrote, and exits non-zero on any failure, including a course it already ran on. A module
named in `needs` is copied and switched on first, by its own script, so the course has
every module the module needs. Questions it adds are written in the kit's question-file
format (one question per line opening `{id:'...'`, the professor as a literal), so the
core checks count and read them as they do the course's own; a lecture it adds is written
as `{id:'L91', ...}`, the form `state_check.js` reads. `run_checks.sh` then runs every core
check and the module's test, and the test of each module it needs, on that course.
`modules:<a>,<b>` switches several on together. The run stops before any check when a
module, its `module.json` or its `ci/oncourse.js` is missing, when the `needs` form a
loop, or when a script exits non-zero.

On GitHub, `.github/ci_plan.js` picks the module courses of each pull request: each module
with a changed file, every module that needs one of them, and each combination in
`features/ci-combinations.txt` that holds one of them (every module when `core/`,
`template/` or `.github/` changes, and on every push to `main`). Each runs as two jobs of
its own, in Chromium ("modules") and in WebKit ("modules-webkit"). Each job fails unless
every module switched on has its own test (`test.js`) PASS with at least one passed check
printed after its browser started: so a module's test must start its browser through
`check_lib.js`'s `launch` and check the page there. A module whose test needs no browser
fails both jobs; an exemption for one would be Louis's decision.

## The hooks

On `X`, the handle a module gets (`core/features.js` holds the code and the same list):

| Hook | When it runs |
|---|---|
| `X.tab({id, label, render(pane), before})` | a nav tab and its pane `#v-<id>`, placed before the tab `before` (default `settings`); `render` draws the pane when the tab is opened; a reload on the tab comes back to it |
| `X.type(name, {body(q, Q), wire(q, el, Q), read(q, el, Q), grade(q, picked)})` | a question type: the quiz card's body (the engine draws the head, the stem, Next and the confidence buttons), how the answer is read off the card, and the grader; the answer is recorded as any other |
| `X.after(fn(q, result, picked, mode, entry))` | after every recorded answer (quiz, sweep, exam); `entry` is the answer as kept in the progress (`DB.answers`), so a module can add a field to it |
| `X.rendered(fn(pane, view))` | after the engine draws into a view's pane, once per batch of changes |
| `X.reading(fn(html))` | the HTML of a reading tab (Guides, Tell apart, Reference) before it is drawn; returns the HTML to draw |
| `X.paper(fn(qs))` | the questions of a new exam paper, in order, before it starts; returns a paper of the same length, in the order to ask them: the same questions reordered, or other questions in their place (paper-picker draws another exam's paper). A result of another length, with an entry that is not a question of the bank, or with a question twice, is refused: the drawn paper is kept and the module switched off for the visit. It does not run on the sample papers the exam's opening page draws. The opening paragraph (the exam's name and blurb, its blueprint, the select-all text) describes this exam, so a module that puts another exam's paper in place says so on its own page and does not let that paragraph stand for it; only the number of questions is guaranteed |
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
| `drug-list-tab` | v1 | BDK `05c36c3`; recall mode from DEENT `0281922` | a Drug list tab: a table per page, group chips, a search across every table, a row's essential knowledge under it, a recall mode with Reveal per row; nothing stored |
| `field-colours` | v1 | BDK `05c36c3` | the headings of the fields a course names as hardest coloured (drug-list-tab's columns; any `data-field` heading in a feature pane); nothing stored |
| `compare-tab` | v1 | BDK `05c36c3` | a Compare tab: 2 to 5 drugs side by side, each item marked shared or different, Only differences; a Compare button in drug-list-tab's detail row; nothing stored |
| `equation-drill` | v2 | Basic-Pharmacokinetics `ac2eb73` | an Equations tab: every equation with its symbols and conditions, typed or built from pieces; needs `formulas-in-text` |
| `wrong-number-diagnosis` | v1 | Basic-Pharmacokinetics `ac2eb73` | what a wrong typed number says about the slip behind it, beside the miss chips; converts PK's saved `missKind` |
| `theme` | v1 | Basic-Pharmacokinetics `ac2eb73` | dark colours, and the student's choice of Match device, Light or Dark (header and Settings), kept per device under `<ns>:theme`, not in the progress |

`port_from_pk.py` beside a module's `current/` (equation-drill, wrong-number-diagnosis) is the
script that wrote the module's code from Basic-Pharmacokinetics' files; each of its
replacements must match exactly once, so run on other files it stops instead of writing a
different module. It is not copied into a course.
