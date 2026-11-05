# Integration run 8 (2026-11-05), coordinator-run

Every result here was run by the coordinator (the porter session), not by an implementing agent.

## Inputs

- Kit `main` `8ec7125`. Since run 7 it carries kit PR #32, Import with a plan that must be confirmed;
  #47, a refused save keeps the history; and #51, the history cap with no silent cut.
- The 14 port heads in `merged-shas.txt`. They include the Import test fixes of 2026-11-05 and
  study-controls' review fix (`7f9b872`, kept in `2f1c023`).
- They were merged by `scripts/merge_all.sh` into `integration/ports-2026-11-05a`, which is never
  merged. `core/` and `template/` equal `main`'s.
- Course data, read-only: Basic-Pharmacokinetics `ac2eb73` and Intro-Pharmacology `929cd62`. The
  course has all 18 modules and 524 questions. Browser: Chromium.

## Results

| Kind | Check | Result | Log |
|---|---|---|---|
| Module tests | the 18 modules' `test.js` | 17 PASS, **1 FAIL**: worksheets-ink at `test.js:410`, its module fault F1 (kit PR #17). Theme: 2 SKIPPED, KNOWN LIMIT T1 ("12 of 12 first frames light on a 3.2 MB page" for a stored Dark on a light device) | `logs/ci-all.log` |
| Core checks | `run_checks.sh` | 28 PASS, **1 FAIL**, 1 NOT RUN (`cite_check.py`), 1 REPORT. The FAIL is `import_test.js` "and the module's part is in it": its fixture's `notes` value is a plain string, which the notes module drops. This is a core test fault; the main kit session is preparing a test-only fix, which waits for Louis. `test.js` and `home_test.js` PASS | `logs/ci-all.log`, `logs/import_test.js.log` |
| Keyboard | `scripts/keys_test.js`, 3 runs, Exam 3 `typed: true` | 20 PASS, 0 FAIL, **1 SKIPPED** each ("Clear flags": the confirm did not open). A real calculation was drawn each time (`wsc-m6b-n13`, `nts-pd-ic2a`, `cst-inf-n2`) | `logs/keys-typed-{1,2,3}.log` |
| Keyboard, diagnostic | `scripts/keys_diag.js`: the same test, printing the page state before the reload in that case | before the reload the stale-page wall is up and the flag is not in storage: `{"stale":true,"savewarn":false,"flagged":1,"stored":false}` | `logs/keys-diag.log` |
| Dark mode | `scripts/contrast_test.js` | 0 low-contrast items in 107 views with a dark device and 107 with Dark picked. Measured on the views tested; no real device | `logs/contrast-all.log` |
| WebKit, all modules | — | NOT RUN: no local WebKit | — |

## The skipped "Clear flags" case

- The keyboard test writes ink on a Scratch paper before this case. worksheets-ink writes the
  progress straight to `localStorage`, not through the core's `store`. The core has recorded its own
  saves since #45, #47 and #51, so it takes that write for another tab's save. It shows the
  stale-page wall, and the page's later changes are not saved: the flag the test sets is lost at
  the reload.
- This is fault F1 of kit PR #17, seen from another module. A student on a course with worksheets-ink
  on would lose what they did after writing ink on that page until they reload.
- No course has the module on, and the fix changes how the module saves, which needs Louis's yes.
- Run 7, before those core changes, had no skip here.
