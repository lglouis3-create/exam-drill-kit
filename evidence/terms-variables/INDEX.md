# Evidence: terms-variables (port queue item 3), hardening of 2026-11-02 evening

Every result here is **agent-run** (the porter's hardening session). The coordinator adds its own
re-runs, labelled coordinator-verified, under `coordinator/`.

## Inputs

| What | Value |
|---|---|
| Source read | lglouis3-create/Basic-Pharmacokinetics- `ac2eb73` (`src/`), read-only clone `/tmp/pk-readonly`, never written |
| Port branch at start | `port/terms-variables` `15c69ac` (core tree `c9fde5b`, template tree `cbac5bd`) |
| Commits added | `78a38c2` (merge of main `366caf6`, kit PR #27), `e958fe2` (this hardening), `8641b3f` (merge of main `6432c36`, kit PR #28) |
| **Final tested commit** | **`8641b3f96c37f09b89c7ef85419794c312500a4f`** |
| origin/main at the final runs | `6432c36` |
| Core tree / template tree at `8641b3f` | `a2dbf03` / `cbac5bd` (both the same as `6432c36`'s: `git diff 6432c36 8641b3f -- core template` is empty) |
| Medicinal-chemistry | `f1f5ee5`, full clone (not shallow), this branch's core copied into `src/`, committed locally only |
| Integration finding fixed | evidence/integration `1329222`, F5 (F5b) and F5d |

**Baseline reuse: none.** The evidence/baseline folder `main-98e7b5b/` is for core tree `c9fde5b`;
this branch's core tree is `a2dbf03`, so the no-module template course and Medicinal-chemistry were
rerun here (rows 12 and 13).

## The module's own course (rule 4)

`features/terms-variables/ci/oncourse.js` writes it from the test's fixture, which is
Basic-Pharmacokinetics' own data at `ac2eb73`. `scripts/cmpfix.js` compares the fixture with
PK's files field by field: the only differences are the professor's name (24 differences: the
`prof` of 10 questions and 5 topics, written `PROF` in the fixture and set to the course's
"Professor" by the script, and 9 places in worked steps and a concept list where PK prints
"Dr." and the name and the fixture prints "The professor"). The lectures (PK `course.js` L01-L05)
and the 5 skills the questions carry were added to the fixture verbatim this session
(`scripts/addlect.js`), with `prof` as `PROF`.

What the script leaves out, and why (printed in `logs/f-on-oncourse.log`):
- questions `m2-n-d3a` and `m2-n-vp1`, with their topics `bolus1` and `bolus2`: their `cite` names
  only practice-sheet solutions (`IV-Bolus-Practice-1---Solutions.pdf`,
  `IV-Bolus-Practice-3---Solutions.pdf`), which PK's `course.js` lists as no lecture; the core's
  `test.js` failed on them ("2 questions cite no deck in the manifest", `logs/on-run_checks.log`);
- 8 `setup` lines (plan-the-problem's data; they name equations the course has no EQUATIONS for);
- 8 `teachImg` (PK's image crops are not in the course's `images.json`; with them,
  `browser_test.js` stopped with "Cannot read properties of undefined (reading 'map')",
  `logs/on-run_checks.log`; see core finding 3);
- a term whose name the course's TERMS already has (none on the template; 1, `pharmacodynamics`,
  on the course with glossary-tap's data).

Style: `style_check.js` passed on the course's 15 stems; no real stem tripped STEM_RE.

## Commands (final runs on `8641b3f`)

Full list with exit codes: `COMMANDS.tsv` (name, exit code, folder, command). Logs: `logs/<name>.log`;
per-check logs of each `run_checks.sh`: `check-logs/`.

| # | Command | Exit | Result (agent-run) | Log |
|---|---|---|---|---|
| 1 | `scripts/oncourse_run.sh f-on` (mkcourse.sh + `ci/oncourse.js` + build) | 0 / 0 | data written, build passes | `logs/f-on-oncourse.log`, `logs/f-on-build.log` |
| 2 | `node features/terms-variables/test.js` on f-on, run 1 | 0 | 57 PASS, 0 FAIL, 2 skipped (glossary-tap, equation-drill not on) | `logs/final-moduletest-1.log` |
| 3 | the same, run 2 | 0 | 57 PASS, 0 FAIL, 2 skipped | `logs/final-moduletest-2.log` |
| 4 | the same, run 3 | 0 | 57 PASS, 0 FAIL, 2 skipped | `logs/final-moduletest-3.log` |
| 5 | `./run_checks.sh` on f-on | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT | `logs/final-on-run_checks.log` |
| 6 | `core/ci_course.sh module:terms-variables chromium` | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT; module test 57 | `logs/final-ci-module-terms-variables.log` |
| 7 | `core/ci_course.sh modules:terms-variables,equation-drill chromium` (partner present) | 0 | 28 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT; module test 59 (1 skipped: glossary-tap), equation-drill 30, formulas-in-text 12 | `logs/final-ci-modules-tv-eq.log` |
| 8 | `scripts/gtcourse_run.sh f-gt` (glossary-tap from `port/glossary-tap` `4762fe5`, not on this branch) | 0 | build passes | `logs/f-gt-*.log` |
| 9 | module test on f-gt | 0 | 60 PASS (1 skipped: equation-drill), incl. both tabs, no id twice, the Glossary link opens the Glossary tab | `logs/final-gt-moduletest.log` |
| 10 | glossary-tap's test on f-gt | 0 | 56 PASS (1 skipped) | `logs/final-gt-glossarytaptest.log` |
| 11 | `scripts/absent.sh` (module code emptied, built, test run) | test 1 | FAIL as required: 1 of 1 ("the page carries terms-variables, working") | `logs/final-absent-moduletest.log` |
| 12 | `core/ci_course.sh template chromium` (no module) | 0 | 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT | `logs/final-ci-template.log` |
| 13 | `scripts/mc.sh` (Medicinal-chemistry `f1f5ee5`, full clone) | 0 | 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures; `cite_check.py`: no lecture PDFs), 1 REPORT; `home_test.js` 36 checks PASS | `logs/final-mc-run_checks.log` |

Runs on the working tree before the final commit (same module code): `scripts/wholebank.js`
(exit 0, `logs/wholebank-compare.log`): on PK's whole bank, PK's own `termQuestions` and
`varQuestions` (views.js, run in node with `shuffle` as the identity) and the module give the same
282 term and 301 variable questions, same ids in the same order, 0 stems and 0 keyed answers
differing; the question sentence is the same on 534 of 534 numeric stems; 201 stem-sentence
questions, 50 symbols, 94 terms. `scripts/lookbehind.sh` (`logs/lookbehind-device_lint.log`): with
PK's lookbehind split put back, `device_lint.js` fails 2 of 3 (exit 1).

## Behaviour map

See `behaviour-map.md` (also in the pull request text).

## Mutation checks

Script: `scripts/mutations.py` (each mutation is one exact string replacement that must match once,
applied to a scratch copy of the built course, rebuilt, module test run). Round 1 on the working
tree of `e958fe2` before the group check; round 2 reran M12 after the check was added. Course
`on` = the module's own course; `eq` = with equation-drill on. Logs: `mutations/M<n>-test.log`.
Tables: `mutations-round1.tsv`, `mutations-round2.tsv`. No mutation was committed.

| Mutation | Course | Check that failed | Exit |
|---|---|---|---|
| M1 termMask blanks nothing | on | no situation or definition stem prints the term it asks for (course and scratch copy) | 1 |
| M2 look-alikes not taken first | on | the wrong options of the term questions whose term has look-alikes are those look-alikes first (24 on the course, 48 on the scratch copy) * | 1 |
| M3 family not taken first | on | the wrong options of the variable questions come from the same family first (106; 108) * | 1 |
| M4 twins allowed as wrong options | on | twins are never each other's wrong option; same family first | 1 |
| M5 a sentence naming its own answer is asked | on | the variable questions are the 108 Basic-Pharmacokinetics' own code makes | 1 |
| M6 first question of the stem, not the last | on | the question sentence is Basic-Pharmacokinetics' on 9 control texts and 9 numeric stems | 1 |
| M7 flashcard mark always recorded right | on | Did not know on card 2 is recorded as a wrong answer * | 1 |
| M8 a variable question put into the bank | on | ids unique, none a bank question, none in the bank | 1 |
| M9 no de-duplication of sentences | on | the variable questions are the 108 ... | 1 |
| M10 Equations tab does not offer the quiz | eq | the Equations tab offers the variables quiz | 1 |
| M11 Show the term shows nothing | on | Flashcards card 1 ...; Show the term shows it | 1 |
| M12 a term group's Start drills every term | on | round 1: **not caught** (exit 0); check added: one group drills only its terms' questions; round 2: caught (48 of 24) | 0, then 1 |
| M13 a family's Start drills every symbol | on | one family (rate constants) drills only its symbols | 1 |
| M14 the meaning question has no keyed option | on | every question has one keyed option among four or more ... | 1 |
| M15 variable answers under the wrong concept | on | a right answer is recorded under the symbol's concept | 1 |

\* a check added in this hardening from the behaviour map, before round 1; the test at `15c69ac`
has no such check.

## Persistence (QUALITY C), agent-run, in `test.js` (section "the answers to these questions are kept")

The module writes nothing of its own: its answers go through the core's `record()` (DB.answers,
DB.concepts under `term:<id>` and `var:<key>`, the answer history LOG). On the scratch copy, 60
answers to the module's questions (every third one wrong):

| Case | Result |
|---|---|
| Recorded and stored | 60 answers, 43 concepts, 60 history entries; 60 in localStorage after 400 ms |
| Reload more than 150 ms later | all 60 and their scheduling state come back; all 10 tabs render with them, no page error |
| Reload under 150 ms after an answer | reported, not a check: 0 of 1 new answer kept in DB, 1 of 1 kept in the history (core `save()` waits 150 ms; the history is written at once) |
| Export, then Import into a fresh browser profile | the 60 answers, their scheduling state and their history come back; no page error |
| Profile switch | each profile keeps its own answers (Other 0, then 5; me 60, unchanged) |
| Storage full part-way (QuotaExceededError) | the notice says progress was not saved; the drill goes on (30 answers); the 20 saved before are not overwritten; after storage works again all 31 are saved and load after a reload; no page error |
| Storage denied (SecurityError) | the drill runs, 10 answers recorded for the visit, the notice is shown, no page error |

## Core findings (for separate core proposals; the core was not changed)

1. Weak spots finds an answered question by its id in QUESTIONS only, so answers to the module's
   questions are recorded but not listed there (PK lists them under "Terms").
2. A reload during a term or variables drill comes back to Topics, not to the question, for the
   same reason.
3. `browser_test.js` (teachImg block, lines 150-157 at core tree `a2dbf03`; the failure was seen at
   core tree `c9fde5b`, line 134) calls
   `q.options.map` on every question with a `teachImg`; a numeric question with a `teachImg`
   (PK has them) stops the check with "Cannot read properties of undefined (reading 'map')".
4. A reload under 150 ms after an answer keeps the answer in the history but not in the progress
   (core `save()`), so the two disagree by that answer after the reload.
