# Handoff note on a pull request (proposed 2026-11-06, issue #63; waits for Louis's yes)

A handoff note is one comment on the pull request it concerns. It records what the next
session or agent needs, so that session does not reconstruct it from the repository history.
GitHub keeps the note across container replacements, and ChatGPT's review automation can read it.
`/tmp/port-coord/handoff.md` stays the porter's working note inside its own container.

## When to write one

- When a session or agent stops working on a pull request and its head commit changed since the
  last note.
- When ownership of the pull request passes to another session or agent.
- Not for an unchanged head. A session that finds nothing new posts nothing.

## Format

The first line is fixed so that a search finds it: `Handoff @ <full head SHA>`.

```
Handoff @ <full head SHA>
Owner: <session or agent name>; objective: <one sentence>
Repo / branch: lglouis3-create/<repo> <branch>
Files changed since the last handoff: <paths, or "none">
Checks on this head: <job: PASS | FAIL | NOT RUN | REPORT, with the run id>; local runs listed apart
Reviews on this head: <reviewer, verdict, link>; findings open: <list, or "none">
Risks: <progress storage, import, scheduling, live site, WebKit or Safari not run, or "none known">
Next action: <one action>; owner of it: <name>; waits for Louis: <yes, with the question | no>
```

A check that was cancelled, timed out, never started or has no run for this head is NOT RUN, as
`KIT_DESIGN.md` §12 decision 10 defines it. A note records results; it never counts as a review or
as a passing check.

## Reading one before starting work

1. Read the pull request's head SHA, the newest `Handoff @` comment, and the comments, reviews and
   check runs after it.
2. When the head SHA equals the note's SHA and nothing new was posted after the note, do not
   repeat the investigation or the checks the note lists. Continue from its next action, or end
   with one line when that action is not this session's.
3. When the head changed, read the diff from the note's SHA to the head
   (`git diff <note SHA>..<head>`), not the whole branch, and rerun the checks whose inputs the diff
   changed. Decision 10 still requires the required checks on the final head before any merge.
