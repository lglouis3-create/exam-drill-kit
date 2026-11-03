# Standing autonomy: Louis's words (2026-11-03)

Louis's standing policy for kit sessions, as he wrote it in the main kit session on
2026-11-03. `KIT_DESIGN.md` §12 decision 10, `CLAUDE.md` and `skill/SKILL.md` summarise
it; where a summary differs from the text below, this text governs. Readings Claude
added where the text leaves a case open are listed in decision 10 and wait for Louis's
confirmation.

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

In this text "you" is Claude, the kit session.
