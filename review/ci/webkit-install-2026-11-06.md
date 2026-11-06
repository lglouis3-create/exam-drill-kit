# WebKit install: three jobs cancelled at the job limit (2026-11-06)

The WebKit jobs install system packages with apt, inside the step "Playwright 1.63.0, WebKit
and pdfplumber 0.11.10" (`npx playwright@1.63.0 install --with-deps webkit`). In three jobs on
2026-11-06 that download ran at about 43 kB/s from `azure.archive.ubuntu.com`. Each job then
reached its 45-minute limit before any check finished. This is an infrastructure failure, not a
test failure. Each of those jobs stays NOT RUN for its head commit (KIT_DESIGN.md §12 decision 10).

## The three cancelled jobs

The apt part of each job's log is in `logs/apt-<job>.txt`: the package-list fetch, "Need to get",
every download line, and the cancel lines. The step times come from the GitHub API's job record
for each job.

| Job (run, head) | Runner | Install step | Packages (apt) | Result |
|---|---|---|---|---|
| 127623349742 (run 42135762254, c25f234) | 1000003578 | 00:17:48-01:02:02 UTC, 44 min 14 s | "Need to get 114 MB" at 00:17:59; "Fetched 114 MB in 43min 36s (43.6 kB/s)" at 01:01:35; 181 downloads, Get:2 to Get:182 | the checks started at 01:02:02 and the job was cancelled 59 s later, at 01:03:01 |
| 127901474048 (run 42220609563, 0769d14) | 1000004127 | 12:49:42-13:34:54 UTC, 45 min 12 s | "Need to get 114 MB" at 12:49:54; 133 downloads started, the last Get:134 at 13:34:26 | cancelled in the install step; no check ran |
| 127956955596 (run 42236831601, 690b4b0) | 1000004270 | 14:48:48-15:35:06 UTC, 46 min 18 s | "Need to get 114 MB" at 14:48:57; Get:2 to Get:182 by 15:31:02, then Get:20 (8998 kB) fetched again at 15:33:04 | cancelled in the install step; no check ran |

- In all three jobs the package lists came fast: "Fetched 12.9 MB in 1s" (9801 kB/s, 10.9 MB/s
  and 9898 kB/s).
- Every package download in all three jobs came from `azure.archive.ubuntu.com`.
- Each log reads the mirror list `file:/etc/apt/apt-mirrors.txt` (144 B). The logs do not show
  its contents.
- Rates (checked):
  - Job 127623349742: apt's own line gives 114 MB in 2,616 s, which is 43.6 kB/s
    (43.6 × 2,616 = 114,058 kB).
  - Job 127956955596: the downloads from 14:48:57 to 15:33:04 took 2,647 s;
    114,000 / 2,647 = 43.1 kB/s.
- At 43.1 kB/s, 6 minutes carry about 15,516 kB (43.1 × 360) of the 114 MB.

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
   - apt's retry acts on a failed download, and its HTTP timeout acts on a connection that
     sends nothing.
   - Every download in the three jobs completed, slowly: no line shows a failed fetch, and data
     arrived throughout.
   - So neither would have ended these installs sooner. This is read from the logs; the options
     were not tried.
2. **A separate install limit, with one retry of the install only.** This is the smallest
   change that the evidence supports, and it is in this pull request.
   - The install gets 6 minutes, about 3.3 times the slowest of the 21 (110 × 3.27 = 360 s). A
     normal install finishes in the first attempt.
   - An install that passes 6 minutes is stopped and tried once more.
   - Before that second try, the step stops leftover install processes and finishes any
     interrupted dpkg run. It also prints the mirror list. When the list names hosts other than
     `azure.archive.ubuntu.com`, that host is removed for the second attempt. The logs show only
     that host serving packages, so a second attempt against it would likely be as slow.
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

## What is not known

- The contents of `/etc/apt/apt-mirrors.txt` on these runners. The second attempt prints it,
  so the first retry shows whether another host is listed.
- Whether a second attempt on the same runner is faster. No run has shown it yet.
- The container image's pull time.
