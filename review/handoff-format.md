# Handoff note on a pull request (proposed 2026-11-06, issue #63; waits for Louis's yes)

A handoff note is one comment on the pull request it concerns. It tells the next session or agent
what was done and what is left, so that session does not reconstruct it from the repository
history. GitHub keeps the note when a container is replaced, and ChatGPT's review automation can
read it. `/tmp/port-coord/handoff.md` stays the porter's working note inside its own container.

A note is a summary, not evidence. It never counts as a review, a passing check or an approval.
`KIT_DESIGN.md` §12 decision 10 and `review/porter-policy.md` are unchanged by it.

## When to write one

- When a session or agent stops working on a pull request and any input in "What counts as a
  change" below changed since the last note.
- When ownership of the pull request passes to another session or agent.
- Not when nothing changed. A session that finds nothing new posts nothing.

## Format

The first line is fixed so that a search finds it: `Handoff @ <full head SHA>`.

```
Handoff @ <full head SHA>
Owner: <session or agent name>; objective: <one sentence>
Repo / branch: lglouis3-create/<repo> <branch>; base: <base branch> @ <base SHA>
Sources and dependencies read: <course repo @ SHA, dependent PR #N @ SHA, Drive file id, or "none">
Files changed since the last handoff: <paths, or "none">
Checks on this head: <job: PASS | FAIL | NOT RUN | REPORT, with the run id>; local runs listed apart
Reviews on this head: <reviewer, verdict, link>; covered: <areas>; not covered: <areas, or "none">
Findings open: <link and one line each, or "none">
Approvals from Louis: <link to his own message and its words, or "none">
Risks: <progress storage, import, scheduling, live site, WebKit or Safari not run, or "none known">
Next action: <one action>; owner of it: <name>; waits for Louis: <yes, with the question | no>
```

A check that was cancelled, timed out, never started or has no run for this head is NOT RUN, as
decision 10 defines it. An approval is Louis's own message. A message Claude drafted for him, a
prompt Claude wrote, or a quotation of his words in a note or a pull request description is not an
approval until he sends it or says yes to it himself.

## What counts as a change

An unchanged head SHA does not mean nothing changed, and it does not mean the work is finished.
Compare each of these with the note:

1. the pull request's head SHA;
2. the base branch's SHA (a merge to `main` can change what the pull request does or conflicts with);
3. comments and reviews, including edits to earlier ones and to the description (`updated_at`), and
   which findings are still unresolved;
4. check runs on the head: a run that completed, failed, was cancelled or was started again since
   the note;
5. the sources and dependencies the note lists: a course repository's commit, a dependent pull
   request's head or state, a Drive file's modified time;
6. project instructions on the base branch: `CLAUDE.md`, `KIT_DESIGN.md` §3, §7 and §12,
   `review/porter-policy.md`, `review/standing-autonomy-2026-11-03.md` and every later
   `review/standing-autonomy-*.md` (2026-11-08: routine course updates), `skill/SKILL.md`,
   `coordinator/RUN.md`, and the files that define the required checks
   (`.github/workflows/checks.yml`, `.github/ci_plan.js`); and the stored instructions of the
   scheduled tasks concerned, which are not in the repository, so a base SHA does not show them;
7. Louis's decisions and approvals given since the note;
8. dates that change priorities: an exam within 7 days in `coordinator/courses.json` or the
   course's `course.js` (the coordinator's `defaults.approachDays`), or a deadline Louis set.
   Such a date changes the order of work; it is not an approval and not a reason to repeat
   completed checks or reviews.

## Reading one before starting work

1. Read the newest `Handoff @` note and compare the eight inputs above with it.
2. Nothing changed and the note's next action is not this session's: end with one line and
   post nothing on the pull request. A log entry or checkpoint that a mode or
   `coordinator/RUN.md` requires of every run is still written.
3. Nothing changed and work is still open (the next action is this session's, a finding is
   unresolved, a review says what it did not cover): do that open work only. Do not repeat the
   investigations, reviews or checks the note records as done.
4. Something changed: work on the scope the change affects. For a new head, read
   `git diff <note SHA>..<head>`; for a new base, the base's commits since the note's base SHA and
   any conflict; for a new comment, that comment. Rerun the checks whose inputs changed. Decision
   10 still requires the required checks on the final head before any merge.
5. Verify a claim in the note before acting on it: a check result against the
   Actions run, a review against the pull request, an approval against Louis's own message, a file
   state against the repository. Claims that decide a merge, a live change or a progress-storage
   risk are always verified.

## No note yet

Establish the baseline once, without reconstructing the project's history: the head and base
SHAs, the check runs on the head, the reviews and their verdicts, the unresolved findings, and
Louis's approvals on the pull request. Post it as the first note when the session stops.

## Independent reviews

A second full review of a scope that was already reviewed, with nothing changed, is a duplicate
and is not started. An additional independent review, focused on its reason, is started when:

- a consequential defect is still unresolved;
- new evidence appears (a failed run, a user report, a changed source);
- an earlier review's "not covered" list, or its own text, shows incomplete coverage;
- the change is high-risk: progress storage, import or recovery, scheduling, a live course;
- Louis asks for one.

Decision 10's requirement of an independent review before an automatic merge is unchanged. For a
merge under decision 10, the independent reviews posted must together cover the whole diff of the
final head against the current base; a review of a delta counts only with an earlier review of its
parent head, and a base change since that review is reviewed as its own delta.

## Examples

| Situation | What the next session does |
|---|---|
| Head unchanged, base advanced | Reads main's new commits; checks for conflicts and for changed rules or dependencies; reruns checks only if the merge result changes their inputs; no full review. |
| Approval text edited after the note | Reads the edit against Louis's own words; acts only on his approval, never on a draft or quotation. |
| A run completed or was cancelled after the note | Records the conclusion; cancelled is NOT RUN; investigates a failure and keeps the evidence; reruns only to diagnose. |
| The first review says it was partial | Starts one focused independent review of the areas it lists as not covered; not a full restart. |
| An unresolved progress-loss finding, head unchanged | Continues on that finding: reproduction, fix or approval request. An unchanged head is no reason to stop. |
