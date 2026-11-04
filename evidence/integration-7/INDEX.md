# Integration run 7 (2026-11-04), coordinator-run

Every result here was run by the coordinator (the porter session), not by an implementing agent.

## Inputs

- Kit `main` `91b5920`. Since run 6, kit PR #39 saves the waiting progress when a page is hidden or
  closed (`core/shell.html`, `core/views.js`, `core/storage_test.js`), and kit PR #42 adds the WebKit
  module job to `.github/workflows/checks.yml`.
- The 14 port heads in `merged-shas.txt`, each containing `main` `91b5920`. They include the WebKit
  test fixes of quiz-prep-cards `862f34f`, worksheets-ink `ca9441a` and study-controls `4b8748e`.
  They were merged in that order by `scripts/merge_all.sh` into branch
  `integration/ports-2026-11-04a`, which is never merged. Conflicts were only in CHANGELOG.md,
  FEATURES.md, features/README.md and review/port-queue.md, resolved with both sides kept.
  `core/` and `template/` equal `main`'s.
- Course data, read-only: Basic-Pharmacokinetics `ac2eb73` and Intro-Pharmacology `929cd62`.
- The course: `core/ci_course.sh modules:<all 18 modules>`, 524 questions. Browser: Chromium.

## Results

| Kind | Check | Result | Log |
|---|---|---|---|
| Module tests | the 18 modules' `test.js` on the all-module course, Chromium | 18 PASS, 0 FAIL. SKIPPED cases inside passing tests, the same as run 6. Theme's 2 are KNOWN LIMIT T1: "10 of 12 first frames light" and "8 of 12 first frames dark", on "a 3.1 MB page" by the theme test's own measure | `logs/ci-all.log` |
| Core checks | `run_checks.sh`, Chromium | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no lecture PDFs), 1 REPORT (`explain_check.js`, 209 of 524). `test.js` PASS: section 7 gave 20 of 20 different wordings (cst-inf-c11 then cst-cq2-4). `storage_test.js` PASS, 29 checks. `home_test.js` PASS, 36 checks | `logs/ci-all.log`, `logs/test-js.log` |
| Keyboard | `scripts/keys_test.js`, 3 runs, Exam 3 `typed: true` | 21 PASS, 0 FAIL, 0 SKIPPED each. A real calculation was drawn each time: `wsc-nl-ex2c`, `wsc-m6b-n09`, `qpc-cq5-3` | `logs/keys-typed-{1,2,3}.log` |
| Dark mode | `scripts/contrast_test.js` | 0 low-contrast items in 107 views with a dark device and 107 with Dark picked. Views not reached are listed in the log. Measured on the views tested; no real device | `logs/contrast-all.log` |
| All modules in WebKit | the all-module course in WebKit | NOT RUN: the container has Chromium only. On GitHub, each module's own course passed in WebKit on its final head (see each pull request) | — |
| Device | Safari, iPhone, iPad, Apple Pencil | NOT RUN | — |
