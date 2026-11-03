# Evidence: port queue item 10, `notes` (agent-run)

**Later run:** the hardening for Louis's rule 4 (the module's own course built from
Basic-Pharmacokinetics data, stronger key checks), tested commit `998137e`, is in
`harden-998137e/INDEX.md`. The text below is the first run's (tested commit `9757062`).

Every result here is **agent-run**, by the porting agent in session
`session_01LVkWFDVVDwgsL5WF7yWqcV`, on 2026-11-02, in the cloud container (Chromium only).
The coordinator adds its own re-runs, labelled coordinator-verified, in `coordinator/`.

## Inputs
- Source read: Basic-Pharmacokinetics `ac2eb73` (read-only clone `/tmp/pk-readonly`):
  `src/views.js` 5564-5654, 290, 302, 1494, 1587, 1791, 2062-2063, 3309, 3328, 3354, 3418,
  3425, 6337-6339, 6361-6383; `src/shell.html` 1073; `src/notes_test.py`; `src/q13_quizzes.js`
  834-855 (the fixture question cq5-5).
- Partner module read: `origin/port/study-controls` `c81a735` (PR #16, not merged), its four
  files copied into one scratch course only.
- Tested port-branch commit: `port/notes` **`9757062c79ca01f79fe06457f34df75bf5807d3d`**.
- origin/main: `ac5c64491d9f9bf565ce3b4701c31db52633647c`.
- Core tree at the tested commit: `daac6e234e10dae4a60c67f14cc575e9a0256f6c`; template tree:
  `cbac5bd425d480944293f8e1fb5d5d703e8baba1`. Both are the same as origin/main's and as the
  baseline's inputs; `git diff origin/main -- core template` is empty.

## Baseline cited, not rerun
Because the core and template tree hashes are exactly `daac6e2` and `cbac5bd`, the
no-module template course and Medicinal-chemistry (`f1f5ee5`) results are cited from
branch `evidence/baseline` (`8c28a7c`, coordinator-verified there):
template course with no module 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT
(`explain_check.js`); Medicinal-chemistry 22 PASS, 0 FAIL, 3 NOT RUN (`stepper_test.js`,
`cite_check.py`, `state_check.js`), 1 REPORT. This agent did not rerun them.

## Commands (agent-run, on commit 9757062)
`run-all.sh` ran these in order; `commands.tsv` holds the same table. Logs are in `logs/`.

| Command | Exit code | Log |
|---|---|---|
| `mkcourse.sh` (no module) + `python3 build.py` | 0 | `logs/off-build.log` |
| `node features/notes/test.js` on that page, without the module's code (must FAIL) | 1 (FAIL: 1 of 1, "FX is not defined") | `logs/off-moduletest.log` |
| `ci-test.sh`: fresh course, `node features/notes/ci/oncourse.js`, a second run (must refuse), `python3 build.py`, the module test | 0 (oncourse 0, second run 1, build 0, test PASS 86) | `logs/ci-test.log`, `logs/ci-build.log`, `logs/ci-moduletest.log` |
| `mk-on.sh` (notes alone) + build | 0 | `logs/on-build.log` |
| module test, notes alone, run 1 (with screenshots) | 0 (PASS: 86 checks) | `logs/on-moduletest-1.log` |
| module test, notes alone, run 2 | 0 (PASS: 86 checks) | `logs/on-moduletest-2.log` |
| module test, notes alone, run 3 | 0 (PASS: 86 checks) | `logs/on-moduletest-3.log` |
| `./run_checks.sh`, notes alone | 0 (26 PASS, 0 FAIL, 1 NOT RUN `cite_check.py`, 1 REPORT `explain_check.js`) | `logs/on-run_checks.log`, per check `logs/on-run_checks-logs/` |
| `mk-onsc.sh` (notes and study-controls `c81a735`) + build | 0 | `logs/onsc-build.log` |
| module test, notes with study-controls | 0 (PASS: 96 checks) | `logs/onsc-moduletest.log` |
| `./run_checks.sh`, notes and study-controls | 0 (27 PASS, 0 FAIL, 1 NOT RUN `cite_check.py`, 1 REPORT `explain_check.js`; `features/study-controls/test.js` 38 PASS with notes present) | `logs/onsc-run_checks.log`, per check `logs/onsc-run_checks-logs/` |
| `python3 mutations.py /tmp/port-notes/mut ...` (20 mutations, on a notes + study-controls course; its `notes.js` and `test.js` are byte-identical to commit 9757062's) | 0; 20 of 20 caught | `logs/mutations-run1.log`, per mutation `mutations/M*.log`, `mutations/mutations.md`, `mutations/mutations.json` |

Development runs before the commit (kept, not results of the tested commit): `logs/dev/t1.log`
(8 FAIL: 5 were test faults, the first profile was taken to be "TestUser" while the core opens
"me"; the save notice is `position: fixed`, so `offsetParent` was null; a check matched a
copied question's key), `t2.log` (PASS 86), `t3.log` (4 FAIL: study-controls' one-page cards
had no Note button, a real fault, fixed in the module: see below), `t4.log` (PASS 96).

Lookbehind: `grep -nE "\(\?<[=!]" features/notes/current/*.js features/notes/ci/*.js` found
nothing (exit 1). `device_lint.js` passed 3 checks with the module's files (both courses).
Token grep `git grep -nE "ghp_|github_pat_"` on the changed files found nothing.

## Fault found and fixed
- With study-controls on, its one-page quiz and paper cards had no Note button. Both modules
  hook the engine's redraw; study-controls redraws the pane inside the same pass, after
  notes, and that redraw is not passed to the hooks again. Fixed in the module: it looks again
  once the pass is over (`setTimeout` 0; adding the button is idempotent). Mutation M14
  shows the test catches its removal.

## Behaviour map
See `behaviour-map.md` (also in the PR text).

## Mutation checks
`mutations.py` applies each mutation with an exact replace that must match once, rebuilds,
runs the module test and restores the file. Table: `mutations/mutations.md`. All 20 were
caught (exit 1 each). None was committed.

## Persistence (QUALITY C), as checks in `test.js` (390 px run)
- 41 notes of up to 2,000 characters and a history of 304 answers come back after a reload,
  byte for byte (`JSON.stringify(DB.notes)`).
- Export progress carries every note (41); Import progress into a new profile ("Fresh")
  brings back the same notes.
- A third profile starts with no notes and keeps only its own; switching back, the first
  profile has its own 41.
- A reload 400 ms after typing keeps the change. A reload right after typing (under 150 ms)
  lost the last change in every run (4 of 4 runs: on-moduletest-1, 2, 3 and onsc); the
  earlier text of that note and all 41 notes were kept. This is the core's 150 ms write
  delay; the module does not change it. Proposal for the core: write a pending progress save
  on `pagehide` (the core already saves the place there).
- Storage denied (`setItem` throws `SecurityError`) and storage full (`QuotaExceededError`):
  the core's notice "This browser did not save your progress (storage is full or blocked)..."
  is on screen; the stored progress is byte-identical to before; the note stays on screen;
  once storage works, the next change is saved with every earlier note and loads after a
  reload.
- A saved note in a bad shape (`'text only'`, `{t: 7}`) is dropped on load; the other 40
  load.
- Erase my history removes the notes.
- NOT RUN: storage behaviour in Safari/WebKit (not installed); a real full disk (simulated by
  the thrown `QuotaExceededError`).

## Partner module
The module test ran with study-controls absent (86 checks: no flag mark even with a stray
`DB.flags`) and present (96 checks: the flag mark follows the flag; typing `a1b2`, Enter and
the arrows in a note picks, checks and moves nothing in the quiz and on the paper; the
one-page cards carry the button).

## Screenshots
`screenshots/quiz-note-390.png` (the box open on a quiz card), `screenshots/notes-tab-390.png`
(the Notes tab, two notes), `screenshots/notes-many-390.png` (the Notes tab with 41 notes).

## Not run
WebKit, Safari, iPhone, iPad. The clipboard was checked through a stub of
`navigator.clipboard.writeText` (headless Chromium on `file://` has no clipboard permission).
