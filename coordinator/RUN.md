# A coordinator run

What one run does, whether a scheduled task starts it or a person does ("run the
coordinator"). `KIT_DESIGN.md` §12 decision 10, `review/standing-autonomy-2026-11-03.md` and
`review/porter-policy.md` govern every step; where this file and they differ, the stricter
rule applies. A run never publishes a course site, never merges a course repository's main
(merging it publishes, because Pages serves main), and never weakens or skips a check.

## 0. Preflight

- `git fetch origin` in the kit and work from `origin/main`.
- Every repository in `coordinator/courses.json` must be reachable (`git ls-remote`), and
  pull requests readable with `gh api` or the GitHub tools. Git reads of a public repository
  work without attaching it; the GitHub API (pull requests, check runs) needs it attached to
  the run's session with credentials (`add_repo`, access "push"). A read that cannot be made
  is reported as "Access unavailable—status not checked", never as the repository or site
  being down, and the run does not attach a repository on its own.
- Node, Python and Chromium start. If the kit cannot be fetched, stop and report.

## 1. Plan

`node coordinator/coord.js plan --json`. Work in its order (priority, then course). A run does
at most **three** full items (`review`, `retrospective`, `deep-audit`); the rest carry over to
the next run, so deep work rotates across courses and no run reviews every repository.
`light`, `essential-check` and `published` checks are cheap and run for every course they
name. `skip` and `wait` do nothing.

## 2. Review, by kind

- **Every kind:** `node coordinator/coord.js published --course <id>`. A problem there is a
  high-severity registry item for that course.
- **review**: the course's commits from its checkpoint to its head (`git log`, `git diff
  --stat`), and only those: unchanged code is not read again.
  - For a kit course, run `src/run_checks.sh` on a clone.
  - Run a student workflow in Chromium on the live site and on `/preview/` when one exists:
    390 px and 1280 px, light and dark; a quiz, an exam paper, a missed-question
    explanation, weak spots, progress after a reload, offline after a first visit.
  - Look at the screenshots. Report what could not be opened as NOT RUN.
  - Compare each discovery with `FEATURES.md`, `review/port-queue.md` and `improvements.json`
    before adding anything.
- **exam-approaching**: the same, limited to the exam's coverage, stability, missing
  material and regressions. No redesign proposal goes out in the 7 days before an exam;
  findings wait in the registry with status `deferred` and the reason "exam week".
- **light**: open registry items for the course, the release check, and whether
  `inDevelopment` matches the schedule (an exam within 14 days with no material in
  development is a high-severity item). No full review.
- **retrospective**: the plan lists it as due; the run records that in its report and does
  not write one on its own. A retrospective is written only when Louis asks for one (Mode 6).
  Starting retrospectives without being asked is part of the separate proposal named in
  step 3.
- **deep-audit**: the retrospective's questions across all courses using the same features,
  plus the browser workflow above. Done once per quarter per completed course.
- **essential-check**: the course's checks only.

## 3. Improvements: recorded, not prepared

A run records what it finds in `improvements.json` (in step 4's bookkeeping pull request)
and prepares nothing: no branch or pull request in a course repository or the kit, and no
port-queue entry. Preparing improvements and starting retrospectives on its own are a
separate kit pull request for Louis's yes or no; this step changes only when that is merged.

## 4. Record

- **One bookkeeping pull request per run**, `coordinator/run-<YYYY-MM-DD>`, containing:
  - `state.json`: for each course reviewed, the head it covered, the time, the kind, and the
    record file;
  - `improvements.json`;
  - `automations.json`: this run's own entry and the last runs read from the scheduled tasks;
  - `state.json` `lastSeen`: the output of `node coordinator/coord.js lastseen`, so the dashboard
    in a new container can still show each repository's last successful read and its time;
  - any new retrospective.
- It is bookkeeping under decision 10: it merges after an independent review and green
  checks, with a comment naming both. Its description carries "Approval: not needed
  (bookkeeping under decision 10)". The Kit checks job "Coordinator records and logic" is one
  of the jobs every kit pull request runs, so it counts among the required checks under
  decision 10 like every other job of that run.
- A run that changed no record opens no pull request.
- The run never reviews its own bookkeeping commits: they change only the kit, and the kit is
  not a course.

## 5. Report

One message to Louis, only when something waits for him (a pull request for his yes or no, a
preview, a design decision) or when there is a confirmed progress-loss risk or a live site
problem; a push notification only for those two. A run with nothing new ends with one line
per course.
