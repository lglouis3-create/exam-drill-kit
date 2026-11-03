# Evidence: notes, hardening for Louis's rule 4 (agent-run)

Every result here is **agent-run**, by a hardening agent in session
`session_01LVkWFDVVDwgsL5WF7yWqcV`, on 2026-11-02 and 2026-11-03 (UTC), in the cloud container
(Chromium only). The first run's evidence (tested commit `9757062`) is kept unchanged in the
folder above; the coordinator's re-run is in `../coordinator/`.

## Inputs (`inputs.txt`)
- Source read: Basic-Pharmacokinetics `ac2eb73` (read-only clone `/tmp/pk-readonly`):
  `src/course.js` (lectures L11, L12; skills pkpd, nonlin), `src/q13_quizzes.js`,
  `src/q15_module7b.js`, `src/q16_module8.js`. Nothing was written there.
- Partner module: `port/study-controls` `1c1d590`, copied into a scratch copy of the kit
  (`scripts/kitsc.sh`) and into scratch courses only; never committed to `port/notes`.
- Starting commit of `port/notes`: `f6cc9e6`. Tested (final) commit:
  **`998137e0a7531eaaf1537bdef96123050bf68be5`**.
- origin/main: `6432c36709ad3dc3ab78d8558239971b18234aec`.
- Core tree `a2dbf03d6ccea270f77ac440f3fd8b7a86d855cf`, template tree
  `cbac5bd425d480944293f8e1fb5d5d703e8baba1`: both the same as origin/main's;
  `git diff origin/main -- core template` is empty (0 lines).

## What changed in commit 998137e
- `features/notes/ci/oncourse.js` writes the module's own course from real course data: the
  test's `FIX` (Basic-Pharmacokinetics' topics pkpd and nonlin with the subtopics used, lectures
  L11 and L12, skills pkpd and nonlin, 16 questions) through the test's `WRITE`, as
  `q90_notes_fixture.js` (one question per line, opening `{id:'...'`, then type, dupOf, skill,
  then `prof:'Professor'`; the two topics pushed after the course's topics) and one `course.js`
  line (the file, the lectures in literal form `{id:'L11', ...}`, the skills, the module on).
- `features/notes/current/test.js`: FIX and WRITE (`scripts/extract.js` produced FIX from the
  source); the scratch copies use the course's own copy of FIX when it has one, add 3 copies of
  the 16 (64 notes for the persistence checks) and draw the exam paper from FIX's two topics; a
  new check that the paper holds only those questions; stronger key checks (below).
- `FEATURES.md`: the notes entry's Test line (counts and the course data).

### The course data and the one change
- 16 questions: cq5-1, cq5-6 (`q13_quizzes.js`); pd-c20, pd-c01, pd-c02 (select-all), pd-c04,
  pd-c06, pd-c22, pd-ex-b (numeric) (`q15_module7b.js`); nl-c04 (select-all), nl-c02, nl-c03,
  nl-c05, nl-c06, nl-ex1, nl-ex2a (numeric) (`q16_module8.js`). 13 multiple-choice (2 of them
  select-all) and 3 numeric. Each is the object the course's engine reads (the file evaluated),
  so a shared section such as `NL_RATE` is in each question that uses it.
- The one change: every `prof` is "Professor". The professor's name is in no file of the port
  branch or of this folder (`scripts/stage.sh` checks this folder; the check reads the name
  from the source and never prints it).
- Left out of the two topics, and why (`scripts/probe3.js` lists the candidates):
  - every question whose text refers to the professor by a pronoun ("her wording", "her second
    Example" and the like), so no question in the set names the professor in any way;
  - nl-c10: its text has "given as", which `style_check.js` flags (finding, not reworded);
  - pd-c13, nl-c01, nl-c18: two options only; the kit's core `test.js` refuses them ("only 2
    options"). Found in development run `logs/dev/ci1.log` (core `test.js` FAIL: pd-c13,
    nl-c01). This is a finding about Basic-Pharmacokinetics' true/false items against the kit
    core, for the coordinator;
  - cq5-2, pd-c14, cq5-5, nl-c08, nl-c09: their `dupOf` leads to one of those two-option
    questions, and core `test.js` needs every `dupOf` target in the bank. cq5-5 was the old
    test's question; the quiz checks now write on cq5-6.
- The questions keep the source's `exam: 3`, `module` and `lecture` fields; the quiz card shows
  them as "Exam 3 · 8" (`screenshots/quiz-note-390.png`), although the template has no exam 3.
  Nothing fails on it; noted for the coordinator.

## Commands (agent-run, on commit 998137e)
`scripts/run-final.sh` ran these in order; `commands.tsv` holds the same table.

| Step | Command | Exit code | Log | Result |
|---|---|---|---|---|
| off | `mkcourse.sh` (no module), `python3 build.py`, then `features/notes/test.js` on that page | 0, 0, **1** | `logs/off-*.log` | FAIL 1 of 1 ("FX is not defined"), as it must |
| ci | fresh `mkcourse.sh` course with notes copied in, `node features/notes/ci/oncourse.js` | 0 | `logs/ci-oncourse.log` | wrote the fixture file (topics pkpd, nonlin, 16 questions) and the course.js line |
| ci | the same script again on that course | **1** | `logs/ci-oncourse-again.log` | refused ("already switches notes on"), as it must |
| ci | commit, `python3 build.py` | 0, 0 | `logs/ci-commit.log`, `logs/ci-build.log` | |
| ci | module test, run 1 (screenshots) | 0 | `logs/ci-moduletest-1.log` | PASS 88 checks |
| ci | module test, run 2 | 0 | `logs/ci-moduletest-2.log` | PASS 88 checks |
| ci | module test, run 3 | 0 | `logs/ci-moduletest-3.log` | PASS 88 checks |
| nodata | template course with notes on and no course data (the test writes FIX into its copy) | 0 | `logs/nodata-moduletest.log` | PASS 88 checks |
| module course | `core/ci_course.sh module:notes` | 0 | `logs/ci_course-module-notes.log`, per check `logs/ci_course-module-notes-checks/` | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`); `home_test.js` PASS 36; `features/notes/test.js` PASS 88 |
| partner | `scripts/kitsc.sh`, then `core/ci_course.sh modules:notes,study-controls` in that scratch kit | 0, 0 | `logs/ci_course-modules-notes-study-controls.log`, per check `logs/ci_course-modules-notes-study-controls-checks/` | 27 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT; `home_test.js` PASS 36; `features/notes/test.js` PASS 106; `features/study-controls/test.js` PASS 59 (1 skipped: paper-picker is not on) |
| lint | lookbehind grep on the module's files | 0 (no match) | `logs/lookbehind.log` | none |
| tokens | `git grep -nE "ghp_|github_pat_"` on the changed files | 0 (no match) | `logs/tokens.log` | none |

Partner absent: every run above without study-controls (88 checks; with study-controls off,
no flag mark even with a stray `DB.flags`). Partner present: 106 checks.

### GitHub (`github-run-41552662982.tsv`)
Workflow "Kit checks", run 41552662982, event pull_request, head `998137e`: conclusion
**success**. Jobs: Chromium · template success; Chromium · template-unset success; Chromium ·
medicinal-chemistry success (23 PASS, 0 FAIL, 2 NOT RUN `stepper_test.js` and `cite_check.py`,
1 REPORT; `home_test.js` PASS 36; `logs/github-medicinal-chemistry-job.log`); Modules to check
success; Chromium · module:notes success (26 PASS, 0 FAIL, 1 NOT RUN `cite_check.py`, 1 REPORT;
`features/notes/test.js` PASS 88; `logs/github-module-notes-job.log`; GitHub ran the pull
request's merge commit `0b05373`); WebKit · template (informational) success. The combination
notes with study-controls does not run on GitHub on this branch: study-controls is not in its tree.

## Baseline cited, not rerun
The core and template trees are exactly those of the coordinator's baseline for main
`6432c36` (`evidence/baseline`, folder `main-6432c36/`, commit `f8a22d5`; core `a2dbf03`,
template `cbac5bd`, Medicinal-chemistry `f1f5ee5`, full clone). Cited from there: template
course with no module 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT;
Medicinal-chemistry 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`, `cite_check.py`), 1 REPORT,
`home_test.js` PASS 36. This agent did not rerun them locally; GitHub's medicinal-chemistry job
on this commit gave the same counts (above).

## Keyboard checks while typing a note (study-controls on)
In `test.js`, at 390 px and 1200 px:
- on the quiz before the answer: typing A-J, 1-9, Enter and the arrows in the note picks,
  checks and records nothing, and the keys go into the note;
- control: with the note left (blurred), the right letter answers the question;
- after a right answer: the same keys typed in the note mark nothing (Not sure, I guessed),
  record nothing and do not move on;
- control: with the note left, 1 moves on;
- on the exam paper: the same keys in the note move and pick nothing and go into the note;
- control: with the note left, the right arrow moves on and the left arrow back.
All passed in `ci_course-modules-notes-study-controls` and the mutation baseline course.

## Mutation checks
`scripts/mutations.py` (each mutation an exact replace that must match once; rebuild; run the
module test; restore). Never applied to the port branch. Run on a scratch course with
study-controls then notes (`logs/mutations-run2.log`, `mutations/`), whose `notes.js` and
`test.js` are byte-identical to commit 998137e's; M14 again on a course with notes then
study-controls (`logs/` and `mutations-notes-first/`), the order `ci_course.sh
modules:notes,study-controls` uses.

| Mutation | Exit code | Checks that FAILed (short) |
|---|---|---|
| M1 a typed note is not saved | 1 | the note is still there after a reload, and 9 more |
| M2 a running paper never hides the key | 1 | the key left out of the text; the Notes tab hides the key |
| M3 the converter keeps bad notes | 1 | a bad saved note is dropped on load; the converter check |
| M4 no button on the result cards | 1 | after Submit every result card carries ✎ Note |
| M5 the flag mark never shows | 1 | the flagged card says ⚑ flagged |
| M6 the flag mark always shows | 1 | the mark goes when the flag does |
| M7 notes listed oldest first | 1 | newest first (noted(), the tab) |
| M8 {{frac}} left as written | 1 | {{frac:a|b}} written (a)/(b) ((0.693)/(Vmax)) |
| M9 Weak spots miscounts | 1 | Weak spots counts the 2 notes |
| M10 the label not updated as typed | 1 | the button then reads My note |
| M11 Delete note deletes nothing | 1 | Delete note removes it |
| M12 Drill these ignores the topic filter | 1 | Drill these drills only that topic's notes |
| M13 an emptied note is kept | 1 | an emptied note is removed |
| M14 no second look after the pass | 0 with study-controls first (not caught: the fault does not arise in that order); **1** with notes first | the one-page quiz and paper cards each carry ✎ Note |
| M15 the Notes tab shows a running paper's key | 1 | the Notes tab hides that key |
| M16 the key left out of the text | 1 | a key for every keyed question (29); both keys after Submit |
| M17 no button on the quiz card | 1 | the quiz card carries ✎ Note |
| M18 the box does not open | 1 | the test stopped (page.fill timeout) |
| M19 a saved progress loses its notes | 1 | the note is still there after a reload; the converter check |
| M20 Download names the file wrongly | 1 | Download saves <course id>-my-questions.md |
| M21 [study-controls] a key in a textarea is a shortcut | 1 | typing the keys in a note on the quiz picks nothing |
| M22 [study-controls] no key guard at all | 1 | typing the keys in a note on the quiz picks nothing |

Full table with every failing check: `mutations/mutations.md`, `mutations-notes-first/mutations.md`.
All 22 are caught in the order where each fault arises.

## Persistence (QUALITY C), as checks in `test.js` (390 px, every run above)
- 64 notes of up to 2,000 characters and a history of 304 answers come back after a reload,
  byte for byte; the Notes tab lists all 64; the topic filter and Drill these follow the topic.
- Export progress carries every note (64); Import progress into a fresh profile brings back the
  same notes.
- A profile switch: a third profile has no notes and keeps only its own; switching back, the
  first profile has its own 64.
- A reload 400 ms after typing keeps the change. A reload under 150 ms after typing lost that
  last change in every run here (each `report` line), with every note and the earlier text kept:
  the core writes 150 ms after the last change (core proposal below).
- Storage denied (`SecurityError`) and storage full (`QuotaExceededError`): the core's notice is
  on screen, the stored progress is left as it was, the note stays on screen, and once storage
  works the next change is saved with every earlier note and loads after a reload.
- A saved note in a bad shape is dropped on load; the others load. Erase my history removes the notes.
- NOT RUN: storage in WebKit/Safari locally (not installed); a real full disk (simulated by the
  thrown `QuotaExceededError`).

## Behaviour map
Unchanged: `notes.js` is not changed by this commit. See `../behaviour-map.md`.

## Faults
- No fault in the module was found by this run. The test's own first key check failed once in
  development (`logs/dev/sc2.log`): the caret was placed before the newline typed earlier; the
  check was corrected to count the typed keys.
- Needs a core proposal (not changed): a reload within 150 ms of the last keystroke loses that
  keystroke's change; the core could write a pending save on `pagehide`.

## Development runs (kept; not results of the tested commit)
`logs/dev/ci1.log` (core `test.js` FAIL on the two-option questions), `ci2.log` (26 PASS),
`sc1.log` (PASS 96, before the new key checks), `sc2.log` (1 FAIL, the test fault above),
`sc3.log` (PASS 106), `on4.log` (PASS 88).

## Screenshots
`screenshots/quiz-note-390.png` (the note box on Pharmacokinetics' question cq5-6),
`screenshots/notes-tab-390.png`, `screenshots/notes-many-390.png` (64 notes).

## Not run
WebKit, Safari, iPhone, iPad locally (Chromium only here; GitHub's informational WebKit job ran
the template course without the module).
