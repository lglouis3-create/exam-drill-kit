# Integration run 6 (2026-11-03), coordinator-run

Every result here was run by the coordinator (the porter session), not by an implementing agent.

## Inputs

- Kit `main` `e827671` (core tree `9f6d47e`: kit PRs #38 and #40 changed core `test.js` section 7).
- The 14 port heads in `merged-shas.txt`, each already containing `main` `e827671`, merged in that
  order by `scripts/merge_all.sh` into branch `integration/ports-2026-11-03d` (never merged).
  Conflicts were only in CHANGELOG.md, FEATURES.md, features/README.md and review/port-queue.md,
  resolved by `scripts/resolve_commit.sh` (both sides kept). `core/` and `template/` equal `main`'s.
- Course data, read-only: Basic-Pharmacokinetics `ac2eb73`, Intro-Pharmacology `929cd62` (through each
  module's `ci/oncourse.js`).
- The course: `core/ci_course.sh modules:<all 18 modules>` (`logs/modules.txt`), 524 questions. Two
  more than run 5, because module-pages `76d0cef` puts back m2-mod-2 and m2-vd-2.
- The scripts are run 5's, with paths changed (`scripts/run6.sh`).

## Results

| Kind | Check | Result | Log |
|---|---|---|---|
| Module tests | the 18 modules' `test.js` on the all-module course | 18 PASS, 0 FAIL. SKIPPED cases inside passing tests: chained-problem-sets 1, short-answer-graphs 1, study-controls 1, theme 2 (KNOWN LIMIT T1: "9 of 12 first frames light on a 3.1 MB page, a stored Dark on a light device" by the theme test's own measure), worksheets-ink 1 (Apple Pencil, iPad and Safari), wrong-number-diagnosis 1 | `logs/ci-all.log` |
| Core checks | `run_checks.sh` | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no lecture PDFs), 1 REPORT (`explain_check.js`, 209 of 524 questions). `test.js` PASS (524 questions); section 7 returned a different wording in 20 of 20 trials (cst-inf-c11 then cst-cq2-4, topic cst-infusion). `output_test.js` and `checks_test.js` PASS. `home_test.js` PASS, 36 checks | `logs/ci-all.log`, `logs/test-js.log` |
| Keyboard | `scripts/keys_test.js`, 3 runs on a copy whose Exam 3 has `typed: true` | 21 PASS, 0 FAIL, 0 SKIPPED each. The paper case ran each time on a real calculation drawn onto the paper: `wsc-m6b-n10`, `plc-m4-n-crcl`, `wsc-m7-n09` | `logs/keys-typed-{1,2,3}.log` |
| Dark mode | `scripts/contrast_test.js` | 0 low-contrast items in 107 views with a dark device and 107 views with Dark picked. Views not reached are listed in the log. This is the measured result for the views tested, not every visual state, and no real device | `logs/contrast-all.log` |
| Device | Safari, iPhone, iPad, Apple Pencil | NOT RUN | — |

## Compared with run 5

Run 5 (`evidence/integration-5`) had `test.js` section 7 FAIL on this kind of course: it picked a concept
that spans two topics. Kit PR #38 makes section 7 take both wordings from one topic. With it, and with
#40's 20 trials, every core check passes here.
