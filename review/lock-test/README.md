# The lock check after a profile switch

`core/import_test.js` has a check named "a profile switch frees the old profile's lock". It failed with `false` in GitHub job 127949917972 ("WebKit · template", run 42234914417, on port/worksheets-ink 29cfd75). The same job passed on 922bdfd and 0769d14. At 29cfd75, `core/` equals main's at 3ebde7e; `core/shell.html` and `core/import_test.js` also equal main's at 3f8ba20, the base of this branch (`git diff`, read 2026-11-06).

## Why the check depended on timing
- `claimProfile` (core/shell.html) frees the old profile's writer lock by resolving the promise its lock callback returned (`writerRelease()`).
- The browser's lock manager frees the lock after that promise settles. Another tab's request is answered by the lock manager, not by the page.
- The check made one request with `ifAvailable` straight after `useProfile('elsewhere')`, so it passed only when the browser had already freed the lock.
- The lock was still held at the single request in job 127949917972.
- The core itself expects a short delay: after its own release it queues for at most 2 s (`claimWriter(p, 'brief')`).

## Demonstration (`lock_release_demo.js`, log `lock_release_demo-chromium.log`)
Chromium, on a template course built from kit main:

| Case | Old check (one immediate request) | New check (retry until granted or 2000 ms have passed) |
|---|---|---|
| core unchanged, 30 switches | free in 30 of 30: Chromium frees the lock before the request | not run in this case |
| release held back 300 ms (stand-in for a browser that frees it later) | fails | passes after 310 ms |
| release never happens | fails | fails at 2,005 ms; the browser still lists 1 holder |

- WebKit: NOT RUN here (not installed in this container). CI runs `import_test.js` in WebKit.
- The 300 ms delay is a deliberate stand-in, not a measurement of WebKit.

## The changed check on the real test file
Chromium, at this branch's second head, each on a template course built from it:

| Page or test copy | Result for this check | Log |
|---|---|---|
| core unchanged | `ok`; 273 of 273 passed | `import_test-asis-chromium.log` |
| test waits on a wrong name (`PROFILE + 'x'`) | FAIL `{"readOnly":true,"name":"course-id-drill:writer:mex","before":{"writer":"other","heldUnderName":0,"held":["course-id-drill:writer:me"]},"after":{"free":true,"ms":1}}` | `import_test-wrong-name-test-chromium.log` |
| page names its lock wrongly (`:writerX:`) | FAIL `{"readOnly":true,"name":"course-id-drill:writer:me","before":{"writer":"other","heldUnderName":0,"held":["course-id-drill:writerX:me"]},"after":{"free":true,"ms":1}}` | `import_test-wrong-name-page-chromium.log` |
| lock never freed (claimWriter's `res()` not called) | FAIL `{"readOnly":true,"name":"course-id-drill:writer:me","before":{"writer":"other","heldUnderName":1,"held":["course-id-drill:writer:me"]},"after":{"free":false,"ms":2007,"stillHeld":1}}` | `import_test-never-released-chromium.log` |

In both wrong-name copies the wait alone would have passed after 1 ms, because nothing held that name; the check fails on `heldUnderName: 0`. The wrong page name also fails the other checks that read the lock name. The never-freed page fails other checks that rely on the release.

A first attempt removed only `claimProfile`'s `writerRelease()` call. The check still passed, because `claimWriter` also frees the previous lock when the new profile's lock is granted. The never-freed page therefore changes the release function itself.

## The lock name is checked before the switch (review of 387df32, M1)
The independent review found that a wrong lock name on either side let the wait pass at once, since nothing held that name. Before `useProfile('elsewhere')` the check now confirms from the second tab that it is read-only (`WRITER === 'other'`, its wait no longer ignored when it times out) and that `navigator.locks.query()` lists exactly one held lock under the name it then waits on. The name is read once and passed to the wait. Results: the table above.

## WebKit
- Job 128006910346 ("WebKit · template", run 42251330877) passed at 387df32.
- One pass is not evidence that the timing is fixed: the old check also passed on 922bdfd and 0769d14. The evidence that the check no longer depends on timing is the demonstration above, which is Chromium only.
- WebKit locally: NOT RUN (not installed in this container).
