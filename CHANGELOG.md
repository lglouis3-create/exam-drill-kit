# Changelog

Dated kit changes, newest first.

## 2026-11-01
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
  `d187207` core and by this one differs only in the build stamp (240,996 bytes each).
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
