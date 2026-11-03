# WebKit offline_test.js diagnosis (branch claude/elegant-ptolemy-pqxb8y-webkit-diag)

Diagnosis only; this branch is never merged. Every run's whole job log is kept here,
one folder per GitHub run, with no run left out.

## Run 41562178755 (commit 3a8286a), 2026-11-03

Mode `sequential`: in each set, `core/offline_test.js` (unmodified) and
`.github/diag/offline_diag.js` (instrumented) 10 times each, in turn.

| Set | offline_test.js | offline_diag.js |
|---|---|---|
| webkit 1 | 10 of 10 PASS | 10 of 10 PASS |
| webkit 2 | 10 of 10 PASS | 10 of 10 PASS |
| webkit 3 | 10 of 10 PASS | 10 of 10 PASS |
| webkit 4 | 10 of 10 PASS | 10 of 10 PASS |
| chromium 1 | 10 of 10 PASS | 10 of 10 PASS |

In the 40 instrumented WebKit runs:
- Before the slow reload, the worker controlled the page (state `activated`), with the
  saved drill page in its cache.
- On the slow reload, the worker's NET_TIMEOUT timer fired at 3,500 to 3,503 ms, it
  served the saved copy, and the page opened in 3,532 to 3,548 ms.
- The page's update check fetched `version.json` once per run, always with the server
  in mode `ok`. There were no rejected fetches, no unhandled rejections and no page
  errors.

Neither failure of 2026-11-02 (jobs 125585950320 and 125585978252) reproduced.
