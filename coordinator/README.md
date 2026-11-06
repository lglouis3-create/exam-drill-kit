# The improvement coordinator

One coordinator for every registered course, instead of a separate reviewer in each course
repository. It knows each course's full academic schedule, works out where each course is in
its term, decides which reviews are due, notices what changed, keeps the student sites
showing only released exams, and tracks every improvement a course shows until it is
adopted, deferred or rejected. Its records are this folder; `coord.js` reads them; a
coordinator run (`RUN.md`) does the reviews and writes the records back by pull request.

It adds to what already runs and replaces none of it:

| Already running | What it does | The coordinator's part |
|---|---|---|
| Kit checks (`.github/workflows/checks.yml`) | every kit pull request and push to main | reads the results; adds `coordinator/coord_test.js` to the run |
| Kit feature port (nightly, session "Kit feature porter") | ports queued features into the kit (`review/port-queue.md`) | sends reusable features to the queue; never ports them itself |
| Kit update run (nightly, session "Kit updater") | builds `/preview/` of a course behind the kit; live only after "approve updates for <course>" | reports courses behind the kit; never updates one |
| BDK daily review; DEENT reminders | course sessions' own work | reads their pull requests; does not repeat them |
| ChatGPT GitHub review (about 05:00, 10:00, 15:00, 20:00 Central) | external reviews of pull requests | none: no second review automation |

## The records

| File | Holds | Written by |
|---|---|---|
| `courses.json` | every course: repository, site, term, the full exam schedule with each exam's release status, work in development, a lifecycle override | coordinator runs and course sessions, in pull requests |
| `state.json` | review checkpoints: per course, the last commit a review covered, when, and of which kind | coordinator runs only |
| `improvements.json` | the improvement registry | coordinator runs and kit sessions |
| `automations.json` | every automation, what it does, its last recorded run, what has been verified | coordinator runs |
| `retros/` | retrospective records (Mode 6), one file per course and date | coordinator runs |

The kit repository is public. These files hold only what is already public in the course
repositories or what Louis gives for the schedule: no scores, answer histories, study
records, credentials or unpublished lecture material (`coord_test.js` checks for tokens,
scores, grades and answer histories). Anything private stays out of GitHub; a run that would
need it asks Louis where it may keep it.

## Schedule and release are two different things

Each exam in `courses.json` has two kinds of facts:

- **Schedule** (what the coordinator knows): `date`, `start` (local time, or null when not
  recorded), `minutes`, `endDate` for a window such as a quiz open Tue-Thu, `final`,
  `cumulative`, and `source` (the file or the person it came from). Missing facts stay null
  and are flagged on the dashboard; none is invented.
- **Release** (what students see): `status`, one of `planned`, `collecting-material`,
  `in-development`, `ready-for-review`, `approved`, `published`; and `siteId`, the exam's id in
  the course's `course.js` once it is on the site.

A date passing never changes a release status, and nothing in the coordinator writes a
course site. `coord.js published` compares each kit course's `course.js` on its main branch
(what Pages serves) with the schedule and reports a problem when the site lists an exam that
is not `published`, opens on one (`activeExam`), or lists an exam the schedule does not know.
So an empty future exam can't slip into a site unnoticed. Earlier exams stay listed when
later ones are cumulative: the check never asks for a published exam to be removed.

A status moves forward only when its work has happened: `published` only after Louis approved
that release and its Pages deploy was confirmed (Mode 7, decision 10).

## Lifecycle

`coord.js status` gives each course one of five statuses, from the schedule in America/Chicago
(or the course's own `timezone`), never from `activeExam`:

| Status | When | Review cadence |
|---|---|---|
| exam-approaching | an exam starts within 7 days, or is in progress | daily, highest priority: coverage, stability, missing material, regressions; no redesign before the exam |
| active | an exam or material remains | daily |
| recently-completed | the final ended within 21 days | weekly: retrospective, exam feedback, reusable improvements |
| completed | the final ended 21 to 365 days ago | monthly light maintenance; a deep cross-course and usability audit every 91 days |
| archived | more than 365 days, or by override | only when the repository changes |

The thresholds are `defaults` in `courses.json`; a course may set its own `thresholds`. An
`override` (`{status, until, reason}`) handles extensions, new terms, repeated exams or
continued use; once `until` passes, the schedule decides again. A completed course becomes
active again when a later exam is added. With no exam marked `final`, the last dated exam
counts and the dashboard says so.

## Review planning

`coord.js plan` lists, highest priority first, what each course needs today:

- `review`: due and changed since the last reviewed commit (or never reviewed);
- `light`: due but unchanged: open items, release check, readiness; no full review of unchanged code;
- `retrospective`: a recently completed course's weekly retrospective;
- `deep-audit`: a completed course's quarterly audit;
- `skip`: due and unchanged for a completed or archived course;
- `essential-check`: an archived course that changed;
- `wait`: not due.

A critical open item in the registry (`severity: "critical"`, such as a progress-saving
problem on a live site) forces a review whatever the cadence. Heads come from `git ls-remote`;
a head equal to the checkpoint is never reviewed in full again.

## The dashboard

Say **"Show my Exam Drill Dashboard"** in a Claude Code session that has the kit. The project
skill `.claude/skills/exam-drill-dashboard/` runs `node coordinator/coord.js dashboard` and
adds what only the session can read (scheduled tasks). The dashboard has four sections:
Courses, Improvements, Approvals, Automation activity. Approvals come only from repository
evidence: an open, non-draft pull request whose description says it waits for Louis, failed
or cancelled checks on an open pull request's head, and a course `/preview/` that differs from
its live site. `--offline` skips the network; `--json` gives the data.

## The builder skill

`skill/SKILL.md` in this repository is the master copy. The skill Claude uses in a session
is installed separately (in Louis's account as `exam-drill-builder`), and a change merged
here does not reach it on its own. After a SKILL.md pull request merges, the kit session
tells Louis that the installed skill needs updating from `skill/SKILL.md` at the merge commit;
the coordinator records the version installed when Louis confirms it.

## Running the checks

    node coordinator/coord_test.js     # no network; also run by Kit checks
    node coordinator/coord.js status
    node coordinator/coord.js plan
    node coordinator/coord.js published
