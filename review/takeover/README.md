# Take-over after a writer leaves without handing over (task 56)

## The failure

WebKit job 128009951139 (run 42252162288, kit #67 head 6858675, a workflow-only change) failed 2 of 274 `core/import_test.js` checks in section A, take-over 1:

- `precondition: the take-over finished (section A, take-over 1)` — `other`;
- `a writer closes without handing over before its last save reached the next tab: that answer is in the stored progress, with the next tab's` — `{"last":{"live":true,"copy":false},"next":{"live":false,"copy":false}}`.

The log of that job is kept in the kit session's evidence folder; the two lines above are quoted from it.

## The cause

In section A, tab 1 closes with no hand-over and tab 2 runs `takeOver(false)` (`core/shell.html`). That calls `claimWriter(p, 'wait')`, which waits until the browser frees tab 1's writer lock; then it waits up to 1 s for tab 1's handed-over values (a closed tab sends none) and writes. The test then waited 20 s for `WRITER === 'held'`. `WRITER` was still `other` at 20 s. The likely reading is that the lock had not been granted to tab 2 by then, because the browser still held the closed page's lock. The old check printed only `other`, so it cannot tell that apart from the lock request being rejected (`finish('other')` after a rejection that is not an AbortError). The new check's failure detail gives `writer`, `wall` (`WRITER_WHY`), the holders and the wait times, so a next failure shows which; a passing take-over that waited more than 5 s prints a `note` line with its wait. The second failure follows from the first: the answer recorded next was recorded while tab 2 was read-only, so it was not stored. The leaving tab's last answer was in the stored progress (`last.live: true`).

The other way `takeOver` ends as `other` (a newer `claimWriter` call makes this one's lock grant stale) needs `claimProfile`, which only `useProfile` calls, and tab 2 switches no profile in section A. That path is ruled out by reading the code, not by a run.

Classification: a test synchronization fault (the likely cause above; the rejected-request reading is not ruled out by the old logs). The check asserted that the take-over had finished at a fixed 20 s, before the asynchronous step it depends on (the browser freeing the closed page's lock) had happened. No product defect was found: once the lock is free the take-over finishes, and no stored answer is lost.

## The demonstration (`takeover_demo.js`, Chromium)

Chromium frees a closed page's lock at once, so the WebKit timing does not occur there. A third page in the same browser context queues for the writer lock before tab 1 closes and so holds it afterwards, a stand-in for a closed page whose lock the browser frees late. Log: `takeover_demo-chromium.log`.

| Case | Old wait (20 s for `held`) | New wait (`tookOver`) |
|---|---|---|
| none: no third page | finished at 1,036 ms; both answers stored | finished at 1,033 ms; both stored |
| late: the lock held 25 s after tab 1 closed | `other` at 20,015 ms; next answer not stored (the two CI failures) | finished at 26,042 ms (lock free at 25,009 ms); both stored |
| never: the lock never freed | `other` at 20,015 ms | FAIL at 60,039 ms: another holder kept the writer lock for 60 s |
| broken: lock free, tab 2's `claimWriter` never settles | `other` at 20,007 ms | FAIL at 6,027 ms: the lock was free, but the take-over did not finish within 6 s |

## The correction (`core/import_test.js` `tookOver`)

The wait is on the real condition, in two bounded parts, with no fixed sleep:

1. **released:** the writer lock is free of every holder but this tab (`navigator.locks.query()`, compared with the client id of this tab's own queued request), within 60 s;
2. **finished:** then `WRITER === 'held'` within 6 s: the core's own 5 s deadline for the old writer's values, plus a margin.

Either part not met is a FAIL that reports what was seen. The checks after it are unchanged.

## Runs (Chromium; WebKit NOT RUN locally)

- `core/ci_course.sh template chromium`: exit 0, 29 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, an allowed exclusion), 1 REPORT; `import_test.js` 273 checks passed.
- `core/ci_course.sh template-unset chromium`: exit 0, the same counts; `import_test.js` 273 passed.
- Repeats on one built page (`repeats-chromium.log`): `main`'s test 10 of 10 passed, this test 10 of 10 passed. Chromium does not produce the WebKit timing, so the repeats show only that the change does not add failures.
- Broken copy: a built page whose take-over never completes once the lock is free (`if(false && keys.every(...))` in `takeOver`). `import_test.js` failed 24 of 279; all six section A preconditions failed with "the lock was free, but the take-over did not finish within 6 s" (`import_test-broken-takeover-chromium.log`).

## Not run

- WebKit locally: not installed in this container. Kit checks run it on the pull request; one WebKit pass does not show the timing is resolved, since the old check also passed in WebKit in other runs (for example "WebKit · template" in run 42251330877).
- Why WebKit frees a closed page's lock late (Playwright's `page.close()` or WebKit itself): not determined.
- The earlier task 56 note ("a 'want' posted during another tab's take-over is ignored", template-unset, main 8ec7125) is a different sequence (a want while the old writer is mid-take-over); it was not reproduced or changed here.
