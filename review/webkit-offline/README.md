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

## Run 41563325561 (commit 224e74e), 2026-11-03

**Mode `repro`** (`repro_versionjson.js`): the page's update check made to fail on purpose,
3 times in WebKit and 2 in Chromium. The 3 WebKit results:

| Case | The fetch | Page errors | Unhandled rejections |
|---|---|---|---|
| ok (control) | resolved 200 | 0 | 0 |
| down (connection dropped) | rejected, "Load failed" | 0 | 0 |
| slow, and the page reloads while it waits | rejected, "Load failed" | 0 | 0 |
| slow, and the page waits 9 s | resolved 200 | 0 | 0 |

In Chromium the rejections read "Failed to fetch", also with 0 page errors and 0 unhandled
rejections. The page handles a failed update check. Neither case produces the "due to
access control checks" page error.

**Mode `load`**: three instrumented runs at once, with two busy loops on the CPU.

| Set | Result |
|---|---|
| webkit 1 | 15 of 15 PASS |
| webkit 2 | 13 of 15 PASS |
| webkit 3 | 14 of 15 PASS |
| chromium 1 | 9 of 9 PASS |

All 3 WebKit failures stopped at the same step: the navigation (`page.goto`) right after
the server came back up from mode `down` failed with "WebKit encountered an internal error"
(runs 1.3 and 5.2 of set 2, run 4.2 of set 3). In each, a page error "version.json ... due
to access control checks" was recorded about 5 s later, the error seen in job 125585950320
on 2026-11-02. The worker's log was not read in these three runs, because the test stopped
before its end; the next run reads it in every case.
