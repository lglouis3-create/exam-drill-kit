# notes: rework to Louis's policy of 2026-11-03, head 5353092 (from 54203e6), agent-run

Every result here is **agent-run** (a rework agent in session `session_01LVkWFDVVDwgsL5WF7yWqcV`,
2026-11-03, cloud container, Chromium only). Not verified by the coordinator.

## Inputs

| What | Value |
|---|---|
| Brief | `/tmp/port-tools/REWORK.md`; policy `review/porter-policy.md` (branch `docs/porter-policy`, kit PR #36) |
| Port branch at start | `port/notes` `54203e6` (contains main `4e0fae4`) |
| Final head | `5353092be51c619c9dcf395c5ef09b98e008a655`; two commits on top (`1a0810a`, `5353092`); no history rewritten; pushed as a fast-forward |
| Source | Basic-Pharmacokinetics `ac2eb73`, read-only clone `/tmp/pk-readonly` |
| core/ and template/ | unchanged: `git diff origin/main 5353092 -- core template` is empty |

## What changed (`rework.diff`, `logs/fixture-compare.log`)

- `const FIX` in test.js written by `scripts/extract2.js` (from the earlier `extract.js`): every value
  verbatim, `prof` included (it was "Professor"). The earlier 16 questions, the 2 topics (5 + 4 subtopics)
  and the 2 lectures are the same objects but for `prof`. 34 questions put back (list below): 50 in all.
- WRITE (used by ci/oncourse.js and the test's scratch copies) writes each question's, topic's and lecture's
  own `prof` and adds the professor to COURSE.professors when the course lacks it.
- The test's check "the text names no professor by pronoun" read the copied text, which holds the course's
  own stems and keys. With the real text kept, that is a fault in the module's test (it tested course data,
  not the module): it now checks that the module adds no she/her beyond what the noted questions' own text
  carries. On the final course it was exercised with a pronoun present ("1 in the text, 2 in the questions").
- Comments and the FEATURES.md test line. The `nts-` prefixes are unchanged.

## Questions left out earlier, put back and checked

The first port left out every question of topics pkpd and nonlin whose text contains she/her/hers/herself
(`scripts/cands.js`), and several core refusals. Note: the pronoun filter also caught questions whose "she"
and "her" are a patient (for example nl-ic4a, "When she was taking a daily oral dose"). The 16 earlier
questions were a selection of the rest; questions never selected (for example pd-c03) were not put back.

Put back and kept (34): cq5-3, cq5-4, cq5-7, cq5-8, pd-c24, pd-ex-a, pd-ex-c, pd-ex-d, pd-ic1a, pd-ic1b,
pd-ic2a, pd-ic2b, pd-ic2c, nl-ex2c, nl-p2c-t15, nl-p2c-t21, nl-p2c-cl15, nl-p2c-cl21, nl-p3c-t, nl-p3c-cl,
nl-p3d-t, nl-p3d-cl, nl-p4c-t, nl-p4c-cl, nl-p4d-t, nl-p4d-cl, nl-hw-d-t, nl-hw-d-cl, nl-hwo-d-t,
nl-hwo-d-cl, nl-c07, nl-c17, nl-c19, and nl-c10 (left out earlier for "given as"; `style_check.js` on main
`4e0fae4`, after #31, passes it).

### Reproduction 1: every left-out question back (`repro-trial/`)

`node scripts/extract2.js trial` (101 questions, `repro-trial/test.js-FIX-trial.txt`); `scripts/dry.sh notes
<worktree> <out>`: a fresh template course with the module, its ci/oncourse.js (`repro-trial/q90_notes_fixture.js`
is what it wrote), build.py (exit 0), core `test.js` (exit 1, 5 failures, `repro-trial/core-test.js.log`),
`style_check.js` (exit 0, 108 stems clean).

### Reproduction 2: the 42 deck-citing put-backs on the full run (`repro-below-1a0810a/`)

`core/ci_course.sh module:notes chromium` at `1a0810a` (58 questions): exit 1, 26 PASS, 1 FAIL, 1 NOT RUN,
1 REPORT. `browser_test.js`: "every stem that promises a figure shows one before the answer — 8 bare". The
module test passed (88) on that course 3 times. The course data is `repro-below-1a0810a/q90_notes_fixture.js`.

| Questions still left out | Failure | Classification |
|---|---|---|
| pd-p1a, pd-p1b, pd-p2a, pd-p2b, pd-p3a, pd-p3b, hw7-1a to hw7-1d, hw7o-1a to hw7o-1d, nl-p1a-km, nl-p1a-vm, nl-p1b, nl-p1d, nl-p2a-km, nl-p2a-vm, nl-p2b, nl-p3a, nl-p3b, nl-p3e, nl-p4a, nl-p4b, nl-p4e, nl-hw-a, nl-hw-b, nl-hw-c, nl-hw-e, nl-hwo-a, nl-hwo-b, nl-hwo-c, nl-hwo-e (35) | core `test.js`: "35 questions cite no deck in the manifest" (they cite the practice or homework sheets) | core, kit PR #30 C3 (hw7-1a and hw7o-1a also "without a taxonomy skill": their skill is not among the two the fixture adds; test data, moot while C3 holds) |
| pd-c13, nl-c01, nl-c18 | core `test.js`: "only 2 options" | core, PR #30 C2 |
| cq5-2, pd-c14 (dupOf chain to pd-c13); cq5-5, nl-c08, nl-c09 (to nl-c01) | none of their own; their dupOf target would be missing | follows from C2 |
| nl-ic4a, nl-ic4b, nl-ic4c, nl-ic4d-t, nl-ic4d-cl, nl-ic4e, nl-p1c-t, nl-p1c-cl | `browser_test.js`: their stems say "well below the therapeutic range", and the check's word list (`core/browser_test.js` line 376: shown, below, drawn, pictured, ...) reads "below" as a promised figure | core; **new entry**, not in PR #30: proposed change, read "below" as a figure promise only next to a figure word (figure, graph, table, structure) |

The course does not pass with these, so they stay out and the pull request stays a draft with this coverage
listed (51 questions of the two topics' left-out set).

## Checks on the final head (agent-run)

| Check | Exit | Result | Log |
|---|---|---|---|
| `core/ci_course.sh module:notes chromium` | 0 | 27 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT. Core: 26 PASS (home_test.js 36 PASS), 1 NOT RUN (`cite_check.py`, "no lecture PDFs found", documented exclusion), 1 REPORT (`explain_check.js`, 5 of 57). Module test: 88 PASS, 0 SKIPPED. Sub-checks skipped inside passing core checks: browser_test 5, nullexam_test 1. Course: 2 topics, 50 questions, lectures nts-L11 and nts-L12, skills pkpd and nonlin, the professor added | `logs/ci_course-module-notes.log`, `logs/ci-module-checks/` |
| module test on that course, runs 1-3 | 0, 0, 0 | 88 PASS each, 0 SKIPPED | `logs/module-test-run{1,2,3}.log` |
| module absent (`delete COURSE.features['notes']`), build, module test | 0, 1 | FAIL 1 of 1 ("the test ran to its end — FX is not defined") | `logs/module-absent-*.log` |
| combination `notes,study-controls` | — | not applicable on this branch: study-controls is not in its tree (`features/ci-combinations.txt` runs a line only when every module it names exists); `theme,*` likewise | — |
| template course, Medicinal-chemistry | — | NOT RUN in this rework: core/, template/ and the module's shipped files are unchanged | — |
| WebKit locally | — | NOT RUN: Chromium only in this container | — |

## GitHub "Kit checks" on 5353092

Run 41584484468, completed, conclusion failure: **NOT RUN** (`logs/gh-jobs.tsv`). Jobs Modules to check;
WebKit · template; Chromium · template; Chromium · medicinal-chemistry; Chromium · template-unset: each with
the annotation "The job was not started because recent account payments have failed or your spending limit
needs to be increased. Please check the 'Billing & plans' section in your settings". The module jobs were
skipped. Nothing was rerun. (`1a0810a` was never pushed.)

## Data adaptations that remain

- Ids prefixed `nts-` (questions, topics, subtopics, lectures, every reference): kit CI rule 2. The test's
  copies add `-c<n>` to ids and concepts (3 copies, test pages only).
- plan-the-problem `setup` lines and `asks` keys left out when the course lacks their equations or ASKS
  keys: kit CI rule 4 (96 of each in the test's copies on the module's own course).
- Each topic carries only the subtopics its questions are in (5 of pkpd's, 4 of nonlin's), as before.
- The 51 questions above: core C2, C3 and the new browser_test entry.
- The professor is added to COURSE.professors of the course the data is written into.
