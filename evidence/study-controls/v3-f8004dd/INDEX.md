# Review evidence, pass 3 continued: `study-controls` on `f8004dd` (final tested commit)

Every result here is **agent-run** (the hardening session, 2026-11-02 evening). Read
`../v3-54f6d3c/INDEX.md` first: the real course data, fix F2, and the mutation checks are described
there. This folder adds what came after the coordinator's note from the paper-picker hardening
(paper-picker `ed152de`): on paper-picker's own Basic-Pharmacokinetics 3-exam course, the test at
`d15ebd9` failed 3 of 61, from F2 (the 120-minute clock) and from picking Exam 1 as the earlier exam,
which that course cannot draw (its Module 2 pool is empty in the kit data).

| What | Value |
|---|---|
| Final tested commit | **`f8004dd`** (`f8004dd3ca3d7dfcdc995e8134e70e58874c59ce`) |
| Commits after `54f6d3c` | `6661669` (the earlier-exam checks use the first earlier exam that paper-picker's start page does not mark "The bank holds too few questions"; the exams left out are noted; the checks are skipped with that reason when none can be drawn), `f8004dd` (the paper-picker skip reported once: `6661669` left the old skip line beside the new one, so courses without paper-picker said "2 skipped", `logs/final2-*.log`) |
| Core / template trees | `c9fde5b` / `cbac5bd` (unchanged; `git diff origin/main -- core template` empty) |
| Partner modules (scratch courses only) | paper-picker `ed152de` (with its own `ci/oncourse.js`); worksheets-ink `8265f5c`; notes `65085d6` |
| Source read | Intro-Pharmacology- `929cd62` (read-only clone) |

## Results on `f8004dd` (agent-run)

| Check | Result | Log |
|---|---|---|
| The module's own course (`mkcourse.sh`, `ci/oncourse.js`, build) | exit 0 | `logs/final3-own-make.log` |
| `ci/oncourse.js` a second time | exit 1, refuses (by design) | `logs/final3-own-oncourse-again.log` |
| Module test on it, 3 runs | PASS 59, 59, 59 (1 skipped each: paper-picker is not on) | `logs/final3-own-test-{1,2,3}.log` |
| `run_checks.sh` on it | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`: 11 of 13 questions) | `logs/final3-own-run-checks.log` |
| Module absent | FAIL 1 of 1 ("no feature modules in the page"), as it must | `logs/final3-absent-test.log` |
| 1 exam, paper-picker absent | PASS 59 (1 skipped: paper-picker is not on) | `logs/final3-test-one-exam-pp-absent.log` |
| 1 exam, paper-picker present (one course.js line, no data) | PASS 59 (1 skipped: paper-picker offers no exam other than the current one) | `logs/final3-test-one-exam-pp-present.log` |
| paper-picker's own 3-exam course (its `ci/oncourse.js`: exams 1, 2, 3, 120 minutes, current 3), paper-picker present | PASS 61, none skipped; clock 119:59 then 119:57; "earlier exam(s) 1 left out: paper-picker says the bank holds too few questions"; the earlier-exam checks ran on Exam 2 | `logs/final3-test-three-exam-pp-present.log` |
| The same 3-exam course, paper-picker switched off again (`bin/pp_off.js`) | PASS 59 (1 skipped: paper-picker is not on) | `logs/final3-test-three-exam-pp-absent.log` |
| Module test with worksheets-ink and notes on, papers with calculations | PASS 59 (1 skipped: paper-picker is not on) | `logs/final3-test-keys.log` |
| Keyboard checks with worksheets-ink (writing on Scratch paper and on a worksheet), notes (typing a note) and dialogs (three confirm boxes, the file picker) | PASS 15 of 15 | `logs/final3-keys-partners.log`, `logs/final3-keys-shots/` |
| F2 before: the test at `d15ebd9`, paper-picker's 3-exam course, kit at `d15ebd9` | FAIL 3 of 61: the clock check (119:59), and the two earlier-exam checks (Exam 1; the paper was drawn for exam 3) | `logs/final3-f2-before-d15ebd9.log` |
| F2 after: the committed test on the same course | PASS 61 | `logs/final3-f2-after.log` |
| Mutation checks | run on `54f6d3c` (19 of 20 caught; M10 equivalent): `../v3-54f6d3c/mutations.md`. Not rerun on `f8004dd`: its two commits change only the choice of the earlier exam in the paper-picker part of the test, which the mutation course (no paper-picker) skips | — |
| No-module template course; Medicinal-chemistry | cited from `evidence/baseline` `main-98e7b5b/` (trees `c9fde5b`/`cbac5bd`, Medicinal-chemistry `f1f5ee5`, full clone): 24 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; 23 PASS, 0 FAIL, 2 NOT RUN, 1 REPORT (`home_test.js` passed there) | — |
| WebKit (Safari) | NOT RUN: Chromium only in this container | — |
| Real operating-system dialogs | NOT RUN as real dialogs: Playwright intercepts the file picker and the confirm box | — |

The 3-exam course of the `54f6d3c` runs (`../v3-54f6d3c/`) was made from paper-picker `c1709f5`'s
test fixture by `bin/three_exams.js`; on it Exam 1 can be drawn and the earlier-exam checks ran on
Exam 1. Both courses are covered.

Exit codes: `logs/final3-own-exits.tsv` (`bin/final3.sh`) and `logs/final3-exits.tsv`
(`bin/matrix2.sh ... final3`); the same for the `6661669` runs with `final2-`.
