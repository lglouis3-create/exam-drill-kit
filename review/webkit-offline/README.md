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

## Run 41564741186 (commit b670b51), 2026-11-03

**Mode `load`**, WebKit. Three sets with no pause between the server coming back up and
the next navigation, and three with 1,000 ms.

| Pause | Set 1 | Set 2 | Set 3 | Total |
|---|---|---|---|---|
| 0 ms | 13 of 15 PASS | 12 of 15 PASS | 13 of 15 PASS | 38 of 45 PASS |
| 1,000 ms | 14 of 15 PASS | 15 of 15 PASS | 13 of 15 PASS | 42 of 45 PASS |

The pause does not remove the failures, so they are not only a race in the moment after
the server comes back.

What the 10 failed runs show:
- **9 of them.** The navigation after the server came back failed with "WebKit
  encountered an internal error", 5 to 14 s after it started (`requestfailed` on the
  document). At that moment:
  - the registration had no active worker, and no cache held the saved drill page;
  - the worker's own log cache was gone, and on the next navigation the worker installed
    and activated again, from nothing.

  The site data of the test's browser (worker registration and Cache Storage) had been
  lost.
  - In 5 of the 9, the worker was installed again before the slow reload, without a saved
    page in time. The slow reload then waited 8,100 to 16,136 ms and got the newer page,
    and no reload was offered: the failure of job 125585978252 on 2026-11-02.
  - In the other 4, it served the saved copy at its timeout (8,014 to 8,023 ms after the
    request began).
  - All 9 also had a "version.json ... due to access control checks" page error: the
    failure of job 125585950320.
- **Run 2.1 of the first 0 ms set.** The navigations worked, but a `version.json` fetch
  in the slow phase failed with "WebKit encountered an internal error". The worker's log
  cache was empty at the end, so the site data had been lost there too, later in the run.

Reading: the browser's site data is wiped partway through a run. Playwright's browser
contexts keep site data in memory. If WebKit's network process (which holds it) stops
and restarts, that data is lost and requests in flight fail. This is not yet confirmed;
the next run records WebKit's own log and whether localStorage is wiped too, and tries
"server down" as an HTTP 503 answer instead of a dropped connection.

## Run 41565485378 (commit ed8656d), 2026-11-03

**Mode `load`**, WebKit. Three sets with "server down" as in `core/check_lib.js` (the
connection dropped), with WebKit's own output (`DEBUG=pw:browser*`). Three sets with
"server down" as an HTTP 503 answer.

| "Server down" as | Set 1 | Set 2 | Set 3 | Total |
|---|---|---|---|---|
| dropped connection | 14 of 15 PASS | 14 of 15 PASS | 15 of 15 PASS | 43 of 45 PASS |
| HTTP 503 | 15 of 15 PASS | 15 of 15 PASS | 15 of 15 PASS | 45 of 45 PASS |

**WebKit's own log.** Both failed runs (run 2.1 of set 1, run 2.2 of set 2) logged the
following, and none of the 43 passing runs logged any of it:
- Just after the server-down phase, libsoup assertion failures in the network process:
  - 6 in one run and 18 in the other;
  - `libsoup-CRITICAL **: soup_session_feature_request_queued: assertion
    'SOUP_IS_SESSION_FEATURE (feature)' failed`;
  - `GLib-GObject-CRITICAL **: g_object_ref: assertion 'G_IS_OBJECT (object)' failed`.
- About 10 s later, the failing navigation:
  `ERROR: WebKit encountered an internal error. This is a WebKit bug.
  .../WebProcess/Network/WebLoaderStrategy.cpp(704) : void
  WebKit::WebLoaderStrategy::internallyFailedLoadTimerFired()`.

**Site data at that moment** (both failed runs):
- 0 worker registrations;
- the localStorage marker set on the first visit gone;
- no caches at all, including the four other sites' caches the test creates.

So the whole network session's data was lost, not only the worker.

Totals with "server down" as a dropped connection, under load, in this and the earlier
runs: 15 failed of 180 (3 of 45, 7 of 45, 3 of 45, 2 of 45). As a 503 answer: 0 of 45.
Without load, as a dropped connection: 0 of 40 (run 41562178755).

Reading:
- **Cause.** WebKit's Linux network stack (libsoup, the GTK/WPE port Playwright runs)
  breaks its network session after connections are dropped, more often under load.
  WebKit labels the result "This is a WebKit bug". With the session go the test
  browser's site data (kept in memory by Playwright's contexts), the requests in flight
  ("internal error", "due to access control checks") and the saved copy. Without a saved
  copy the slow reload must wait for the network.
- **What it is not.** It is not the drill's code: the worker and the page did what they
  should whenever the session held.
- **Students.** The Safari app on iPhone, iPad and Mac does not use libsoup. That is
  reasoning, not a test; a check on a real iPhone and iPad stays before BDK goes live.

Next: "server down" as refused connections (the server stops listening, as a stopped
server or a phone with no connection would appear). Is the network-error path still
tested in WebKit without triggering the bug?

## Run 41566211850 (commit e9155f4), 2026-11-03

**Mode `load`**, "server down" as refused connections: the server stops listening, its
idle connections closed, and listens again on the same port after.

| Set | Result | libsoup assertions | "This is a WebKit bug" |
|---|---|---|---|
| webkit refuse 1 | 15 of 15 PASS | 0 | 0 |
| webkit refuse 2 | 15 of 15 PASS | 0 | 0 |
| webkit refuse 3 | 15 of 15 PASS | 0 | 0 |
| webkit refuse 4 | 15 of 15 PASS | 0 | 0 |
| webkit drop 1 (control) | 14 of 15 PASS | 11 | 1 (the failed run) |
| chromium refuse 1 | 9 of 9 PASS | 0 | 0 |

In the 60 refused-connection WebKit runs:
- no request reached the server while it was down;
- no request was left on a busy connection to answer;
- the drill opened from its saved copy each time, so the worker's network-error path ran
  in every run.

## Run 41567099983 (commit 836d9fa): the fix, first validation, 2026-11-03

The fix (branch `offline-refuse`, merged in here for these runs only):
`core/check_lib.js` `S.down()` / `S.up()` (refused connections), and `offline_test.js`
using them, with a check that no request reaches the server while it is down.

| Set | Result | libsoup assertions | "WebKit bug" |
|---|---|---|---|
| webkit sequential 1 | offline_test.js 10 of 10 PASS | 0 | 0 |
| webkit sequential 2 | offline_test.js 10 of 10 PASS | 0 | 0 |
| webkit load-plain 1-4 | offline_test.js 15 of 15 PASS in each (60 of 60) | 0 | 0 |
| webkit mutate | 8 of 8 broken copies FAIL | 0 | 0 |
| chromium mutate | 4 of 4 broken copies FAIL | 0 | 0 |

How each broken copy failed:
- **no offline fallback.** In Chromium it failed "the site opens from the saved copy with
  the server down". In WebKit it failed only "no page errors" ("TypeError: Load failed"):
  the failed reload left the page from before on screen, so "opens from the saved copy"
  passed without a saved copy. That check is not reliable in WebKit as written. The fix
  now also requires the page to be loaded again (a mark set on it before is gone).
- **no timeout.** Failed "the saved copy opens without waiting for the network" (8,049
  and 8,050 ms in WebKit, 8,047 ms in Chromium).
- **no reload offer.** Failed "a reload is offered once the newer page arrives".
- **S.down() leaving the server up.** Failed "no request reaches the server while it is
  down".

## Run 41568079994 (commit d5c2a1d): the fix, final validation, 2026-11-03

The same `core/check_lib.js` and `core/offline_test.js` as in kit pull request #33
(commit 1738291), with the server-down checks requiring the page to be loaded again.

| Set | Result | libsoup assertions | "WebKit bug" |
|---|---|---|---|
| webkit sequential 1 | offline_test.js 10 of 10 PASS | 0 | 0 |
| webkit sequential 2 | offline_test.js 10 of 10 PASS | 0 | 0 |
| webkit load-plain 1-4 | offline_test.js 15 of 15 PASS in each (60 of 60) | 0 | 0 |
| webkit mutate | 12 of 12 broken copies FAIL (3 of each) | 0 | 0 |
| chromium mutate | 4 of 4 broken copies FAIL | 0 | 0 |

Each broken copy fails on its own check in both browsers:
- **no offline fallback:** "the site opens from the saved copy with the server down
  (loaded again, not the page from before)", "the old file name ... opens it too", "a
  quiz starts and serves a question offline";
- **no timeout:** "the saved copy opens without waiting for the network" (8,052-8,053 ms
  in WebKit, 8,061 ms in Chromium);
- **no reload offer:** "a reload is offered once the newer page arrives";
- **S.down() leaving the server up:** "no request reaches the server while it is down".

## All runs on this branch

Counted from the `RUN` lines of the job logs kept here. Each run is one test run.

- **WebKit, "server down" as a dropped connection** (the kit's test server before the
  fix):
  - in turn: 0 failed of 80 (40 of `offline_test.js` and 40 of `offline_diag.js`, run
    41562178755);
  - under load: 16 failed of 195 (3 of 45 in run 41563325561; 10 of 90 in run
    41564741186; 2 of 45 in run 41565485378; 1 of the 15 control runs in run 41566211850).
- **WebKit, "server down" as an HTTP 503 answer:**
  - 0 failed of 45 under load (run 41565485378);
  - 0 of 40 instrumented runs in turn (runs 41567099983 and 41568079994). There
    `offline_diag.js`, given no DIAG_DOWN, set the old mode "down", which the fixed test
    server answers with 503.
- **WebKit, refused connections (the fix):**
  - instrumented: 0 failed of 60 under load (run 41566211850);
  - the unmodified fixed `offline_test.js`: 0 failed of 40 in turn and 0 of 120 under load
    (runs 41567099983 and 41568079994).
- **Broken copies** (runs 41567099983 and 41568079994): 20 of 20 failed in WebKit and 8 of
  8 in Chromium.
- **Chromium:** no failure in any set that should pass (20 in turn, 18 under load, 2
  forced update-check runs).
