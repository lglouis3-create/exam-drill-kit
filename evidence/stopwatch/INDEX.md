# Evidence: port queue item 9, `stopwatch`

**Newer evidence (2026-11-03, agent-run):** `rule4-b5a419b/INDEX.md`, for the final tested commit
`b5a419b` (the module's own course from Basic-Pharmacokinetics' data, Louis's rule 4). The results below
are the first version's (commit `591426f`, a template sample course) and are kept as they were.

All results in this folder are **agent-run** (the porting agent, 2026-11-02). The coordinator's
own re-runs go in `coordinator/`, labelled coordinator-verified.

## Inputs

| What | Value |
|---|---|
| Source read | lglouis3-create/Basic-Pharmacokinetics- at `ac2eb73` (read-only clone `/tmp/pk-readonly`) |
| Port branch | `port/stopwatch` |
| Starting commit (first port commit) | `9e0cf6d26afc9f4ed04e74a198209fe2593d5252` |
| **Final tested commit** | `591426f4a7dd0974172b654ddb42ea0ff03ae020` |
| origin/main | `ac5c64491d9f9bf565ce3b4701c31db52633647c` |
| core tree (main and both port commits) | `daac6e234e10dae4a60c67f14cc575e9a0256f6c` |
| template tree (main and both port commits) | `cbac5bd425d480944293f8e1fb5d5d703e8baba1` |
| module tree `features/stopwatch/current` at `9e0cf6d` | `decb1799c36de49e1d98755ee6f32f43deca8afd` |
| Medicinal-chemistry | fresh `--depth 1` clone, 2026-11-02 |

The core and template trees are exactly `daac6e2` and `cbac5bd`, so the baseline runs on
`evidence/baseline` apply to this branch. They were also rerun here (logs 03 and 04).

The second commit (`591426f`) changed `test.js` (one reload check added), added
`features/stopwatch/ci/oncourse.js` and changed documents; `stopwatch.js`, `stopwatch.css` and
`module.json` are the same in both commits. The files run in logs 09-13 were compared byte for byte
with the commit (`cmp`: equal).

## Commands, exit codes, logs (agent-run)

| # | Command | Exit | Result | Log |
|---|---|---|---|---|
| 01 | `run_checks.sh` on `/tmp/port-stopwatch/on` (template course, `features.stopwatch = {version:'v1', paceSeconds:120}`), first version of test.js | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (cite_check.py: no PDFs), 1 REPORT (explain_check.js); module test 22 checks | `logs/01_oncourse_run_checks_first.log` |
| 02 | the same with the files of `9e0cf6d` | 0 | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; module test 22 checks | `logs/02_oncourse_run_checks_final.log` |
| 03 | `run_checks.sh` on `/tmp/port-stopwatch/off` (template course, no features, from the port branch) | 0 | 24 PASS, 0 FAIL, 1 NOT RUN (cite_check.py), 1 REPORT (explain_check.js) | `logs/03_nomodule_template_run_checks.log` |
| 04 | `run_checks.sh` on a Medicinal-chemistry clone with the branch's `core/` copied into `src/` | 0 | 22 PASS, 0 FAIL, 3 NOT RUN (stepper_test.js: no step-through figures; cite_check.py: no PDFs; state_check.js: shallow clone), 1 REPORT | `logs/04_medchem_run_checks.log` |
| 05 | module test on a copy whose `stopwatch.js` keeps only `X.api` (module code removed) | 1 | FAIL: 12 of 22 checks failed | `logs/05_module_stubbed_test.log` |
| 05b | module test of `591426f` on the no-module course (`off`, test.js copied in) | 1 | FAIL: 1 of 1 checks failed, "the page carries stopwatch, working" (no feature modules in the page) | `logs/05b_module_test_without_module.log` |
| 06 | `python3 -I mutations.py /tmp/port-stopwatch/mut/src logs` | 0 | 10 of 10 mutations caught (table below) | `logs/06_mutations_stdout.log`, `logs/mutation_M*.log`, `logs/mutations_table.md` |
| 07 | `python3 build.py` on `/tmp/port-stopwatch/persist` (module on, exam `typed: true`) | 0 | built | `logs/07_persist_build.log` |
| 08a | `node persistence_test.js /tmp/port-stopwatch/persist/src` (first try) | 1 | 1 FAIL from a fault in the script: it switched back to a profile named TestUser, but the page's first profile is "me" | `logs/08a_persistence_first_try_script_bug.log` |
| 08 | the same, script fixed to switch back to the first profile | 0 | PASS: 16 checks; 1 report (below) | `logs/08_persistence.log`, `logs/export.json` |
| 09 | `run_checks.sh` on `/tmp/port-stopwatch/final` (fresh course from `9e0cf6d`) | 0 | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; module test 22 checks | `logs/09_final_commit_oncourse_run_checks.log` |
| 10 | `node features/stopwatch/ci/oncourse.js <kit> /tmp/port-stopwatch/ci/src` on a fresh `mkcourse.sh` course | 0 | appended one course.js line; no data files | `logs/10_ci_oncourse.log` |
| 10b | the same a second time on the same course | 1 | refused: "course.js already switches stopwatch on" | `logs/10b_ci_oncourse_second_run.log` |
| 11 | `python3 build.py` on that course | 0 | built | `logs/11_ci_build.log` |
| 12 | module test on that course, three times (files of `591426f`) | 0, 0, 0 | PASS: 23 checks, each run | `logs/12_module_test_run1.log` … `run3.log` |
| 13 | `run_checks.sh` on that course | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (cite_check.py: no PDFs), 1 REPORT (explain_check.js); module test 23 checks | `logs/13_ci_course_run_checks.log` |
| 14 | `node screenshots.js /tmp/port-stopwatch/ci/src screenshots` | 0 | 3 PNGs | `logs/14_screenshots.log`, `screenshots/` |
| 15 | `bash compare.sh`: no-module course built from origin/main against the same from the port branch | 0 | `sw.js`, `manifest.json` identical; `index.html`, `version.json` differ only in the build timestamp | `logs/15_nomodule_vs_main_outputs.log` |

`git diff origin/main -- core template` on the port branch: empty.

## What the core already had (not ported, not changed)

- The quiz records with every answer the time from drawing the question to the answer (`ms`;
  `core/views.js` 633 sets `Q.startedAt`, 956 passes the time to `record`).
- Weak spots lists "Right, but slow": right answers that took at least twice the student's usual
  time for that kind of question (`core/views.js` 1204-1231).
- An exam paper has one clock for the whole paper: a countdown, or the time taken on an untimed
  paper (`core/views.js` 1577-1612).
- The core shows no clock on a question, has no pace, and records no time for paper answers.

## Behaviour map (from Basic-Pharmacokinetics `ac2eb73`)

| Source | Behaviour | Status |
|---|---|---|
| `src/views.js` 1467 | `PACE_MS = 120000`, the professor's 2 minutes per calculation | **adapted**: option `paceSeconds` (default 0 = clock without a pace); PK's value 120 is set by the course, from its `course.js` line 264 |
| `src/views.js` 1469 | `fmtClock`: m:ss, rounded to the second, never negative | **ported** (same text on 7 control times) |
| `src/views.js` 1471 | after the answer: "⏱ took m:ss", "· over 2:00" in words when over, red when over, green when within | **ported**; the hover title says "The professor's pace: 2:00 or less per calculation" instead of "Her pace: …" (kit wording rule) |
| `src/views.js` 1472 | "⏱ starts when you begin" when no start time is set | **omitted**: never reached in the kit, where the core always sets the start when it draws a question |
| `src/views.js` 1473-1474 | running clock, red and "over 2:00" past the pace | **ported** |
| `src/views.js` 1476-1481, 5762 | `tickTimers` once a second | **adapted**: the text is changed in place, so the core's watch for redrawn views is not woken every second |
| `src/views.js` 1794 | the clock on the quiz card head, calculations only | **ported** (placed after the head's spacer, after the core draws the card) |
| `src/views.js` 958, 1890-1892 | start at draw; the time taken recorded with the answer | **core already** (`core/views.js` 633, 956); the module shows the recorded `ms` |
| `src/views.js` 1468 | `AWAY_MS`: an answer over 15 minutes left out of averages | **omitted**: used only by the Weak spots time chart below |
| `src/views.js` 1484-1530 | one-page layout: a "Start timer" button per calculation; an answer given without it is not timed | **omitted**: the core has no one-page layout (port queue item 21). The student will not see a timer button on a page of many questions |
| `src/views.js` 3226, 3290-3297 | the time on each paper question, added up while it is shown | **ported** |
| `src/views.js` 3310 | the clock on a paper calculation, starting from its time so far | **ported** (needs the exam's `typed: true`) |
| `src/views.js` 3371 | each paper answer recorded with its question's time | **ported** (written into the answer by `X.after`) |
| `src/views.js` 3033, 3064, 3790, 5787 | the time per paper question saved with the paper and brought back after a reload | **omitted**: a module cannot add to the saved paper without a core change. After a reload in the middle of a paper, the time on each question is counted again from the reload |
| `src/views.js` 2160-2200 | Weak spots: middle time per kind of calculation against the pace line, "Work on these first" with a drill button | **omitted**: grouped by PK's `CALC_TYPES`, which the kit does not have yet. The student will not see time per kind of calculation |
| `src/views.js` 2354 | "· took m:ss" on a calculation in the list of misses | **omitted**: the student will not see the time beside a missed calculation in that list |
| `src/shell.html` 246-251 | the clock's styles | **ported** except `.idle` and `.qtstart` (their states are not ported) |

## Mutation checks (agent-run, `mutations.py`, on the module code of `9e0cf6d`, unchanged in `591426f`)

Each mutation is one exact string replace that must match once, applied to a scratch copy, never
to the port branch. All 10 were caught (exit 1); no test check had to be added for them.

| Mutation | What it breaks | Exit | Checks that FAILed |
|---|---|---|---|
| M1 | no clock on a quiz calculation | 1 | 5: one running clock in its card head; its title gives the pace; counts in place; past 2 minutes red; the clock runs with no pace |
| M2 | the clock does not count | 1 | 3: counts in place; past 2 minutes red; runs with no pace |
| M3 | the pace is never passed | 1 | 2: past 2 minutes red; stops on the time taken, over the pace |
| M4 | the time shown is not the recorded ms | 1 | 4: stops on the time taken over the pace; the time shown is the recorded ms; within the pace green; stops with no pace colour |
| M5 | an answer within the pace is not green | 1 | 1: within the pace green |
| M6 | multiple-choice questions get a clock | 1 | 2: no clock on a multiple-choice question, in the quiz and on the paper |
| M7 | paper time replaced, not added up | 1 | 1: each paper answer keeps its question's time (Back added) |
| M8 | paper answers keep no time | 1 | 1: each paper answer keeps its question's time |
| M9 | with paceSeconds 0 every time is over | 1 | 2: the clock runs with no pace; stops with no pace colour |
| M10 | no clock on a paper calculation | 1 | 2: an exam calculation shows its own clock; the time per paper question |

## Persistence (agent-run, `persistence_test.js`, log 08)

The module writes nothing to storage itself. It adds `ms` to each paper answer in `DB.answers`,
which the core saves. With 400 earlier answers seeded:

| Check | Result |
|---|---|
| reload 400 ms after submitting a paper: the 400 earlier answers and the paper's `ms` come back | PASS |
| reload 20 ms after submitting (below the core's 150 ms save delay) | REPORT: 0 of 2 paper answers came back. Core behaviour: the save waits 150 ms and nothing writes it at `pagehide`; the whole answers are lost, not only their times |
| Export holds every answer (402); Import into a fresh, empty profile gives the same 402 answers with the same `ms` | PASS |
| profile switch: the first profile keeps its answers without the other profile's paper; the other keeps its own paper times | PASS |
| storage denied (`setItem` throws): the notice "This browser did not save your progress…" shows; the paper times stay in the page; the stored progress is not overwritten; after storage works again the saved progress (402 answers) loads | PASS |
| storage full (`QuotaExceededError`): the same four | PASS |

The reload check (400 ms) is also in the module's `test.js` from `591426f`.

## Needs a core change (for separate core proposals; not changed here)

1. A reload within 150 ms of an answer or a submitted paper loses it: the core saves 150 ms after
   the last change and does not write at `pagehide` or when the page is hidden (`core/shell.html`
   `save`, `core/views.js` 2470-2471 save only the place).
2. A module cannot keep its own data with the saved exam paper (`saveExam` / `restoreExam` are not
   hooks), so the time per paper question cannot survive a reload in the middle of a paper.

## Screenshots

`screenshots/quiz_running_0-47.png` (running), `screenshots/quiz_over_pace.png` (2:07, red, "over
2:00"), `screenshots/quiz_took_over_pace.png` (stopped on the time taken, after the answer).

## Files

`mutations.py`, `persistence_test.js`, `screenshots.js`, `compare.sh`, `run3.sh`, `commit.sh`
(commits a scratch course repo), `logs/`, `screenshots/`.
