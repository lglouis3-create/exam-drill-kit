# WebKit install: three jobs cancelled at the job limit (2026-11-06)

The WebKit jobs install system packages with apt, inside the step "Playwright 1.63.0, WebKit
and pdfplumber 0.11.10" (`npx playwright@1.63.0 install --with-deps webkit`). In three jobs on
2026-11-06 that download ran at about 43 kB/s from `azure.archive.ubuntu.com`. Each job then
reached its 45-minute limit before any check finished. This is an infrastructure failure, not a
test failure. Each of those jobs stays NOT RUN for its head commit (KIT_DESIGN.md §12 decision 10).

## The three cancelled jobs

The apt part of each job's log is in `logs/apt-<job>.txt`: the package-list fetch, "Need to get",
every download line (`Get`) and every failed fetch (`Ign`), and the cancel lines. The step times come from the GitHub API's job record
for each job.

| Job (run, head) | Runner | Install step | Packages (apt) | Result |
|---|---|---|---|---|
| 127623349742 (run 42135762254, c25f234) | 1000003578 | 00:17:48-01:02:02 UTC, 44 min 14 s | "Need to get 114 MB" at 00:17:59; "Fetched 114 MB in 43min 36s (43.6 kB/s)" at 01:01:35; 181 downloads, Get:2 to Get:182 | the checks started at 01:02:02 and the job was cancelled 59 s later, at 01:03:01 |
| 127901474048 (run 42220609563, 0769d14) | 1000004127 | 12:49:42-13:34:54 UTC, 45 min 12 s | "Need to get 114 MB" at 12:49:54; 133 downloads started, the last Get:134 at 13:34:26 | cancelled in the install step; no check ran |
| 127956955596 (run 42236831601, 690b4b0) | 1000004270 | 14:48:48-15:35:06 UTC, 46 min 18 s | "Need to get 114 MB" at 14:48:57; Get:2 to Get:182 by 15:31:02, then Get:20 (8998 kB) requested again at 15:33:04 and not finished | cancelled in the install step; no check ran |

- In all three jobs the package lists came fast: "Fetched 12.9 MB in 1s" (9801 kB/s, 10.9 MB/s
  and 9898 kB/s).
- Every package download in all three jobs came from `azure.archive.ubuntu.com`.
- Some fetches failed and were set aside (`Ign` lines), to be requested again later. The gap is
  measured from the `Get` line of the same item (checked); a `Get` line does not mark exactly
  when its transfer began, so these gaps are approximate.
  - Job 127956955596, five:
    - Ign:20 at 15:00:10, 165 s after Get:20 at 14:57:25;
    - Ign:43 at 15:07:58, 131 s after 15:05:47;
    - Ign:59 at 15:10:21, 55 s after 15:09:26;
    - Ign:66 at 15:13:47, 175 s after 15:10:52;
    - Ign:182 at 15:33:03, 121 s after 15:31:02.

    Get:20 was requested again at 15:33:04, 1,974 s after its Ign line, and the job was cancelled
    before it finished.
  - Job 127901474048, one: Ign:83 at 13:27:00, 22 s after Get:83 at 13:26:38.
  - Job 127623349742: none.
- Each log reads the mirror list `file:/etc/apt/apt-mirrors.txt` (144 B). The logs do not show
  its contents.
- Rates (checked):
  - Job 127623349742: apt's own line gives 114 MB in 2,616 s, which is 43.6 kB/s
    (43.6 × 2,616 = 114,058 kB).
  - Job 127956955596, an estimate: the downloads ran from 14:48:57 to 15:33:04, 2,647 s. Not
    all of the 114 MB had arrived, because Get:20 was still being fetched again. 114,000 / 2,647 =
    43.1 kB/s is therefore an upper estimate.
- At 43.1 kB/s, 6 minutes fetch about 15,516 kB (43.1 × 360) of the 114 MB.

## The 21 installs that succeeded

These are the same workflow and commands, in runs 42236699258, 42236827996, 42236831601 and
42234914417 (2026-11-06, 14:37-15:00 UTC). Seconds come from the API's step start and end
times.

| Run | Job | Job name | Runner | Install (s) | Checks (s) |
|---|---|---|---|---|---|
| 42236699258 | 127956706564 | WebKit · template | 1000004251 | 45 | 302 |
| 42236699258 | 127956794548 | WebKit · module:chained-problem-sets | 1000004257 | 44 | 327 |
| 42236699258 | 127956794607 | WebKit · module:formulas-in-text | 1000004261 | 42 | 307 |
| 42236699258 | 127956794657 | WebKit · module:equation-drill | 1000004262 | 40 | 343 |
| 42236699258 | 127956794868 | WebKit · module:wrong-number-diagnosis | 1000004263 | 54 | 341 |
| 42236827996 | 127957268634 | WebKit · template | 1000004276 | 110 | 328 |
| 42236827996 | 127959431459 | WebKit · module:worksheets-ink | 1000004277 | 36 | 395 |
| 42236827996 | 127959431533 | WebKit · module:chained-problem-sets | 1000004286 | 51 | 343 |
| 42236827996 | 127959431538 | WebKit · modules:worksheets-ink,chained-problem-sets | 1000004283 | 45 | 479 |
| 42236827996 | 127959431553 | WebKit · module:wrong-number-diagnosis | 1000004282 | 54 | 316 |
| 42236827996 | 127959431592 | WebKit · module:formulas-in-text | 1000004280 | 40 | 339 |
| 42236827996 | 127959431623 | WebKit · module:equation-drill | 1000004289 | 64 | 344 |
| 42236831601 | 127959508117 | WebKit · module:formulas-in-text | 1000004288 | 46 | 340 |
| 42236831601 | 127959508118 | WebKit · module:chained-problem-sets | 1000004301 | 51 | 285 |
| 42236831601 | 127959508167 | WebKit · module:wrong-number-diagnosis | 1000004284 | 37 | 295 |
| 42236831601 | 127959508201 | WebKit · module:equation-drill | 1000004297 | 37 | 295 |
| 42236831601 | 127959508207 | WebKit · module:worksheets-ink | 1000004279 | 38 | 413 |
| 42236831601 | 127959508335 | WebKit · modules:worksheets-ink,chained-problem-sets | 1000004300 | 37 | 471 |
| 42234914417 | 127949917972 | WebKit · template | 1000004223 | 37 | 279 |
| 42234914417 | 127953026922 | WebKit · module:worksheets-ink | 1000004249 | 39 | 464 |
| 42234914417 | 127953026977 | WebKit · modules:worksheets-ink,chained-problem-sets | 1000004233 | 39 | 485 |

- Install: 36 to 110 s.
- Checks step: 279 to 485 s.
- Five WebKit · template push runs on main in the earlier record (127818947445, 127710724519,
  127666408808, 127074982073, 126995166818) took 37 to 45 s for the install step.

## Options

1. **apt retries and HTTP timeouts** (`Acquire::Retries`, `Acquire::http::Timeout`).
   - The noble `apt.conf(5)` page describes these settings as follows (read 2026-11-06,
     https://manpages.ubuntu.com/manpages/noble/man5/apt.conf.5.html):
     - Retries: "If this is non-zero APT will retry failed files the given number of times."
     - The HTTP timeout "applies to the connection as well as the data timeout". The page gives
       no default value.
   - The logs show apt's own handling acting in two of the three jobs: six fetches failed
     (`Ign`), and in job 127956955596 one of them was requested again 1,974 s later.
   - An independent review read two of the gaps (121 s and 165 s) as matching a 120 s timeout.
     The logs record when each `Ign` was printed, not which setting caused it, and the other gaps
     were 22, 55, 131 and 175 s.
   - What this shows: apt's per-fetch handling did act, and the install was still slow. Every
     retried fetch went back to the same host, `azure.archive.ubuntu.com`.
   - Raising the retry count or shortening the HTTP timeout keeps that host. A shorter timeout
     could fail some slow fetches sooner, but the logs do not show that it would shorten the
     install as a whole. These settings were not tried.
2. **A separate install limit, with one retry of the install only.** This is the smallest
   change that the evidence supports, and it is in this pull request.
   - The install gets 6 minutes, about 3.3 times the slowest of the 21 (110 × 3.27 = 360 s). A
     normal install finishes in the first attempt.
   - The second attempt runs after any failure of the first, a timeout or an error. A first
     attempt that ran longer than 6 minutes is stopped.
   - Before that second try, the step stops leftover install processes (the `npx` process and the
     Playwright CLI's node child, `apt-get`, `dpkg`). It gives apt up to 120 s to wait for a dpkg
     lock (`DPkg::Lock::Timeout`), and finishes any interrupted dpkg run. It also prints the mirror list. When the list names hosts other than
     `azure.archive.ubuntu.com`, that host is removed for the second attempt. The logs show only
     that host serving packages, so a second attempt against it would likely be as slow.
   - The second attempt writes one line to the job summary, so the jobs it rescued can be
     counted.
   - If the second attempt also fails, a step named "NOT RUN: the WebKit install failed twice, so
     no check ran" fails the job visibly and writes the same line to the job summary. The checks
     are skipped, never passed.
   - The checks step gets its own 30-minute limit, about 3.7 times the slowest measured
     (485 s), and is never retried.
   - Worst case: 6 + 6 + 30 = 42 minutes, inside the job's 45.
   - A slow mirror now costs at most about 12 minutes instead of 45, and the job's own steps say
     it was the install.
3. **Playwright's container image** (`mcr.microsoft.com/playwright:v1.63.0-noble`, pinned by
   digest).
   - It carries WebKit's system packages, so the job needs no apt download.
   - It moves the download to a container pull from another host, whose speed on these runners
     has not been measured.
   - It also changes the environment every WebKit check runs in.
   - It is the larger change. Keep it for the case where option 2's second attempt also proves
     slow.

## The retry path, shown on a scratch branch

This was run 42248694033, on branch `claude/elegant-ptolemy-pqxb8y-verify-webkit-install`
(aa41b65), which is not for merging. On that branch:
- the first attempt was held past a 1-minute limit;
- five jobs were switched off (chromium, coordinator, plan, modules, and the plan-driven WebKit
  module matrix);
- the WebKit module job used one fixed course, `module:formulas-in-text`. Excerpts are in `logs/verify-<job>.txt`.

- **Job 127997632041 (WebKit · template):** the first attempt shows "has timed out after 1
  minutes" at 16:04:15.
  - The second attempt printed the mirror list:
    `http://azure.archive.ubuntu.com/ubuntu/ priority:1`,
    `https://archive.ubuntu.com/ubuntu/ priority:2` and
    `https://security.ubuntu.com/ubuntu/ priority:3`.
  - It dropped the first line. It fetched 19 package lists and all 181 package downloads from
    `archive.ubuntu.com`, with no failed fetch: "Fetched 114 MB in 10s (11.4 MB/s)".
  - The checks then gave "29 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT, 0 NOT RUN case(s)"; the one
    NOT RUN is `cite_check.py`, the documented exclusion.
  - The job succeeded.
- **Job 127997632542 (one module course, both attempts held):** both attempts timed out, at
  16:04:18 and 16:05:31.
  - The step "NOT RUN: the WebKit install failed twice, so no check ran" printed its line and
    "Process completed with exit code 1".
  - The checks step was skipped, and the job failed.

The scratch branch ran the retry step as it stood at 9564c42. The second attempt's commands
changed after that run: it now also stops `dpkg` and the Playwright CLI's node child, sets
`DPkg::Lock::Timeout`, ignores blank lines in the mirror list, and writes a summary line. That
run does not cover these additions.

This shows the mechanics and that `archive.ubuntu.com` served the packages once, on a runner
that was not slow. It does not show the retry on a slow runner.

The normal path ran on this PR's first head, 9564c42, in run 42248641607. In all 5 WebKit jobs the first
attempt passed in 39 to 67 s, and the second attempt and the NOT RUN step were skipped.

## What is not known

- Whether `archive.ubuntu.com` is fast on a runner where `azure.archive.ubuntu.com` is slow.
- The container image's pull time.

## The two take-over failures on 6858675 (run 42252162288), and what resolved them

On this PR's head 6858675, "WebKit · template" (job 128009951139) failed after its install passed on the first attempt. `import_test.js` failed 2 of 274 checks: "precondition: the take-over finished (section A, take-over 1)" with `other`, and "a writer closes without handing over before its last save reached the next tab" (`logs/takeover-fail-128009951139.txt`). This PR changes only the workflow and its notes, so these checks ran the same core and tests as main.

Kit task 56 diagnosed them as a test timing fault: in section A the test waited a fixed 20 s for the take-over, and in WebKit the closed page's writer lock was still held then (the likely reading; the old output, `other` alone, does not rule out a rejected lock request). Kit PR #71, merged to main as d5ea4a2, makes each section A take-over wait for the actual lock release (up to 60 s) and then for the take-over (up to 6 s), and fails with the holders and wait times otherwise; a take-over that never completes still fails 24 of 279 checks. This PR now includes main at d5ea4a2. The failed run is kept as it was; it was not rerun.

The same run 42252162288 also shows the retry rescuing a slow install: "WebKit · module:equation-drill" (job 128010450064) timed out its first attempt at 6 minutes after `Ign:2` from azure, and the second attempt completed the install and the checks passed (`logs/retry-rescue-128010450064.txt`).
