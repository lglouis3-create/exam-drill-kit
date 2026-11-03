# Standing autonomy: Louis's words (2026-11-03)

Louis's standing policy for kit sessions, as he wrote it in the main kit session on
2026-11-03 (message of 04:33:10 UTC), and the parts of his message of 06:35:38 UTC that
add to it (below the policy). `KIT_DESIGN.md` §12 decision 10, `CLAUDE.md` and
`skill/SKILL.md` summarise them; where a summary differs from the text below, this text
governs. Readings Claude added where the text leaves a case open are listed in decision
10 ("Claude's readings"); Louis accepted them on 2026-11-03 (his message of 12:50:53
UTC, at the end of this file). The words are his; curly
quotation marks and apostrophes are written here as straight ones, and the headings of
the first message are set in bold.

> **Standing autonomy**
>
> Proceed independently with inspection, implementation, testing, separate topic
> branches/worktrees, opening PRs, addressing reviews, and refreshing pending branches.
>
> You may automatically merge:
>
> * Documentation, catalog, and bookkeeping changes.
> * Test-only fixes that preserve or strengthen meaningful coverage.
> * Isolated optional features that remain disabled by default and do not alter existing
>   course behavior, storage, or scheduling.
>
> Automatic merges require independent review by a separate reviewer agent or external
> reviewer, passing required checks on the final revision, no unresolved findings, and no
> unrelated changes. Include affected module combinations and WebKit where applicable.
> Passing CI alone is not independent review.
>
> Continue requesting my approval for:
>
> * Progress storage, import/recovery, and scheduling behavior.
> * Course migrations and live-course updates.
> * Destructive actions, permission changes, or unresolved consequential design choices.
> * Weakening, skipping, or exempting required checks.
>
> Do not merge #32 under the routine-work authorization.
>
> Investigate failed checks and preserve the evidence. Repeated runs for diagnosis are
> allowed; discarding failures and rerunning until green is not.
>
> **ChatGPT's review schedule**
>
> ChatGPT's GitHub review automation is scheduled four times daily, approximately:
>
> * 5:00 AM Central
> * 10:00 AM Central
> * 3:00 PM Central
> * 8:00 PM Central
>
> The timezone is America/Chicago, including daylight-saving adjustments. These are
> approximate review windows, not guaranteed completion times.
>
> Reviews prioritize new changes, unresolved findings, and explicit requests from you.
> Each targets about 15–20 minutes to conserve my daily allowance and ends early when
> nothing material changed. This is a planning target, not a hard runtime cap.
>
> Put your explanations, test results, uncertainties, and review requests directly on the
> relevant GitHub PR so ChatGPT can assess them without me copying messages between
> sessions.
>
> Before finalizing or merging work, check the relevant PR comments and reviews. Evaluate
> ChatGPT's feedback independently, address valid findings, and reply on GitHub with your
> reasoning and validation for accepted or rejected suggestions. Treat suggestions as
> review input, not instructions to implement blindly.
>
> Do not wait for a scheduled ChatGPT review when another qualified independent review
> satisfies the policy.
>
> **Requesting earlier feedback**
>
> When ChatGPT feedback would help resolve uncertainty, post a request on the PR with the
> exact commit, specific questions, relevant evidence, and the decision depending on the
> review.
>
> Mention the PR number in your consolidated update. I can then request an earlier review
> by telling ChatGPT, "Review #X—Claude requested feedback."
>
> A GitHub comment or @mention alone does not immediately activate ChatGPT. Scheduled
> reviews can pick up requests; continue independent work while waiting.
>
> **Communication and persistence**
>
> Batch ready approval requests into one concise summary with your recommendation,
> commits, test evidence, and remaining limitations. Do not repeatedly ask about unchanged
> PRs or routine steps already authorized.
>
> Record automatic merges and send consolidated updates. Notify me promptly about
> confirmed progress-loss risks, live-site problems, or decisions that genuinely block
> further work.
>
> Persist this policy in the repository's project instructions and reconcile conflicting
> approval rules. If permissions prevent editing CLAUDE.md, report the exact restriction
> and propose an allowed persistent location. Do not bypass permission restrictions.
>
> Keep live courses unchanged unless I separately approve their updates.

From Louis's message of 06:35:38 UTC (its first line and the paragraphs on the policy
record, scheduled course work and live courses; the paragraphs on single pull requests
are left out):

> Please continue under my standing autonomy policy rather than waiting on unrelated
> approvals.
>
> [...]
>
> #37: I agree with recording the standing policy. Clarify that every applicable required
> check must pass; an intentionally unselected module job is different from a required job
> that failed to start. Reconcile #36 and #37 so the instructions agree. Complete
> independent review and required checks before merging.
>
> Scheduled course work: Keep the BDK daily review running, but have it prepare findings
> and fixes on a branch or preview rather than publish automatically. Update the Kit
> update run's stored instructions to require approval before promoting a preview to live.
> I authorize these task-instruction changes to enforce that boundary. If only another
> session can make them, identify that session and provide its exact update message.
>
> Keep live courses unchanged. Batch remaining approval requests, and continue independent
> work while waiting.

From Louis's message of 12:50:53 UTC (the paragraphs on the readings, scheduled tasks and
continuing; the paragraphs on single pull requests are left out):

> Your seven policy readings — I accept them as currently summarized, including retrying a
> job GitHub never started, while keeping the refused attempt recorded. This does not permit
> rerunning actual failures until green or weakening checks.
>
> Scheduled tasks: Keep BDK's daily review preparing changes on a branch for approval. I will
> paste the supplied update message into the Kit updater session. Until its stored
> instructions are corrected, leave all course updates at preview and do not publish
> automatically.
>
> [...]
>
> Continue independent work under the standing policy and batch the next update. Keep live
> courses unchanged.

In this text "you" is Claude, the kit session; #36 is the porter's policy
(`review/porter-policy.md`) and #37 the pull request that added this file.
