# Integration run 4 (coordinator-run, 2026-11-03)

Branch `integration/ports-2026-11-03b` (e2b1aad, never merged): the 14 port heads in `merged-shas.txt` merged onto kit `main` `6432c36` with `scripts/merge_all.sh`. Conflicts arose only in CHANGELOG.md, FEATURES.md, features/README.md and review/port-queue.md, resolved by keeping both sides (`scripts/resolve_commit.sh`). `git diff origin/main -- core template` is empty.

These heads carry the fixes for integration run 3's faults (`evidence/integration-3`, C1-C5, D1, P1, P2, N1); theme's T1 is reported by its test as a known limit (it needs core change B5 in pull request #30). No scratch patch was used in this run.

| Command | Exit | Result | Log |
|---|---|---|---|
| `core/ci_course.sh modules:<all 18> chromium` | 0 | 43 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no lecture PDFs), 1 REPORT (`explain_check.js`, 126 of 364 questions); every one of the 18 module tests ran and passed; `home_test.js` 36 checks PASS | `logs/ci-all.log` |
| lecture ids in that course's `course.js` | — | 52 lectures, no id used twice | (read with node from the built course) |
| `node scripts/keys_test.js` on that course | 0 | 18 PASS, 1 skipped (Scratch paper over a paper's calculation: no paper with a calculation could be drawn) | `logs/keys-all.log` |
| `node scripts/contrast_test.js` on that course | 0 | 6 PASS: 0 low-contrast items in 112 views with the device dark and 112 with Dark picked; planted control found; views not reached are listed in the log | `logs/contrast-all.log` |

Not run: WebKit, Safari, iPhone, iPad, Apple Pencil (Chromium only); `cite_check.py` (no lecture PDFs).
