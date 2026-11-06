# The lock check after a profile switch

`core/import_test.js` has a check named "a profile switch frees the old profile's lock". It failed with `false` in GitHub job 127949917972 ("WebKit · template", run 42234914417, on port/worksheets-ink 29cfd75, whose `core/` equals main's). The same job passed on 922bdfd and 0769d14.

## Why the check depended on timing
- `claimProfile` (core/shell.html) frees the old profile's writer lock by resolving the promise its lock callback returned (`writerRelease()`).
- The browser's lock manager frees the lock after that promise settles. Another tab's request is answered by the lock manager, not by the page.
- The check made one request with `ifAvailable` straight after `useProfile('elsewhere')`, so it passed only when the browser had already freed the lock.
- The core itself expects a short delay: after its own release it queues for at most 2 s (`claimWriter(p, 'brief')`).

## Demonstration (`lock_release_demo.js`, log `lock_release_demo-chromium.log`)
Chromium, on a template course built from kit main:

| Case | Old check (one immediate request) | New check (retry until granted, at most 2000 ms) |
|---|---|---|
| core unchanged, 30 switches | free in 30 of 30: Chromium frees the lock before the request | not run in this case |
| release held back 300 ms (stand-in for a browser that frees it later) | fails | passes after 308 ms |
| release never happens | fails | fails at 2,008 ms; the browser still lists 1 holder |

- WebKit: NOT RUN here (not installed in this container). CI runs `import_test.js` in WebKit.
- The 300 ms delay is a deliberate stand-in, not a measurement of WebKit.

## The changed check on the real test file
| Page | Result | Log |
|---|---|---|
| template course, core unchanged | `ok    a profile switch frees the old profile's lock`; 273 of 273 passed | `import_test-asis-chromium.log` |
| the same, with claimWriter's release changed so it never frees the lock (`res()` not called) | `FAIL  a profile switch frees the old profile's lock  — {"free":false,"ms":2006,"stillHeld":1}`; other checks that rely on the release fail too | `import_test-never-released-chromium.log` |

A first attempt removed only `claimProfile`'s `writerRelease()` call. The check still passed, because `claimWriter` also frees the previous lock when the new profile's lock is granted. The never-freed page therefore changes the release function itself.
