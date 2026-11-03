# Integration run 5 (2026-11-03), coordinator-run

Every result here was run by the coordinator (the porter session), not by an implementing agent.

## Inputs

- Kit `main` `4e0fae4` (core tree `f631c5e`), and the 14 port heads in `merged-shas.txt`, merged in
  that order onto it by `scripts/merge_all.sh` into branch `integration/ports-2026-11-03c` (head
  `aa1aaec`, pushed for the record, never merged). Conflicts were only in CHANGELOG.md, FEATURES.md,
  features/README.md, review/port-queue.md and features/ci-combinations.txt, resolved by
  `scripts/resolve_commit.sh` (both sides kept). `core/` and `template/` equal `main`'s.
- Course data, read-only: Basic-Pharmacokinetics `ac2eb73`, Intro-Pharmacology `929cd62` (through each
  module's `ci/oncourse.js`).
- The course: `core/ci_course.sh modules:<all 18 modules>` (`logs/modules.txt`), one course with
  every module switched on, 522 questions.

## Results

| Check | Result | Log |
|---|---|---|
| Module tests (18, each module's `test.js` on the all-module course) | 18 PASS, 0 FAIL. SKIPPED cases inside passing tests: chained-problem-sets 1, short-answer-graphs 1, study-controls 1, theme 2 (KNOWN LIMIT T1: 8 of 12 first frames light, 6 of 12 dark, on the 2.93 MB page), worksheets-ink 1 (Apple Pencil, iPad and Safari), wrong-number-diagnosis 1 | `logs/ci-all.log` |
| Core checks (`run_checks.sh`) | 23 PASS, 3 FAIL, 1 NOT RUN (`cite_check.py`, no lecture PDFs), 1 REPORT (`explain_check.js`). `home_test.js` PASS, 36 checks | `logs/ci-all.log` |
| FAIL `test.js` section 7 | "returned the identical question, not a new wording" | `logs/test-js-section7-FAIL.log` |
| FAIL `output_test.js`, FAIL `checks_test.js` | each runs `test.js` (or `run_checks.sh`) again on a copy of the course, and fails because `test.js` fails: "exit 1: FAIL: test.js: 1 failure(s)" | `logs/output_test-FAIL.log`, `logs/checks_test-FAIL.log` |
| Keyboard checks (`scripts/keys_test.js`), 3 runs on a copy whose Exam 3 has `typed: true` | 21 PASS, 0 FAIL, 0 SKIPPED each. The paper case ran each time on a real calculation drawn onto the paper: `nts-nl-ex1`, `qpc-cq5-8`, `sw-cq4-4` | `logs/keys-typed-{1,2,3}.log`, `logs/typed-build.log` |
| Dark-mode contrast (`scripts/contrast_test.js`) | 0 low-contrast items in 107 views with a dark device and 107 views with Dark picked. Views not reached are listed in the log (Equations module tabs, some Pair up and reference rows, glossary tap in the quiz, module-pages cards). This is the measured result for the views tested, not every visual state, and no real device | `logs/contrast-all.log` |

## The `test.js` section 7 failure

- Cause (coordinator-run, `scripts/diag_test7_print_pair.js`, `scripts/concepts_span_topics.js`):
  - the check takes the first concept with two questions anywhere in the bank, then looks for its
    second wording only in the topic of the first question;
  - concept-statuses' and paper-picker's CI data both hold Pharmacokinetics' `inf-c5`, under topics
    `cst-infusion` and `pp-infusion`, so concept `rate-vs-time-to-css` spans two topics;
  - the first question, `cst-inf-c5`, is the only question of that concept in `cst-infusion`, so it
    is the only one the check can return.
- 86 of the 316 concepts in this course span two or more topics, because several modules' CI data
  copy the same source questions under their own topic prefixes.
- In a diagnostic copy of `test.js` that takes the pair from one topic, every check of `test.js`
  passed on the same course (`cst-inf-c11` then `cst-cq2-4`; `logs/diag-test7-within-topic.log`).
  The required check itself was not changed.
- Each module's own course passes this check (coordinator rechecks of the 14 heads).
- Classification: a fault in the core's test, exposed by CI data shared between modules. Recorded
  under C1 in kit pull request #30 (`daff39f`). The main kit session confirmed it is not working on C1.

## Compared with run 4

Run 4 (`evidence/integration-4`, `3076d9a`) had 43 PASS with the earlier port heads. The heads changed
in the rework of 2026-11-03 (real names, text and questions put back), so run 4's results do not carry
over. Run 4's keyboard case for a paper calculation was SKIPPED: its course had no exam with
`typed: true`, so a calculation could not be drawn onto a paper at all.
