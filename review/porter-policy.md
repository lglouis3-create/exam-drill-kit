# Feature-porter policy (Louis, 2026-11-03)

This policy governs the "Kit feature porter" session, its scheduled task "Kit feature port", and
every pull request that session opens (port pull requests on `port/<name>` branches, and its
documentation, catalog and proposal pull requests). Correctness takes priority over finishing quickly.

`KIT_DESIGN.md` §12 decision 10 (Louis's standing autonomy policy of 2026-11-03, whose own words
are in `review/standing-autonomy-2026-11-03.md`) applies to the porter session and its pull requests
as to every kit session; it replaced the merge rules of §12.9 (a feature merges only after Louis's
yes; catalog bookkeeping and `small-fix` pull requests merge themselves once every check passes).
This policy adds rules for porting. Where this policy and decision 10 differ, the stricter rule
applies: for example, an automatic merge also needs the independent review's result posted on the
pull request before the merge and a comment after it naming the review and the check run (decision
10). Section 7 below holds the merge rules for these pull requests; in particular a bookkeeping pull
request of the porter does not merge on passing checks alone. Louis: "This replaces the blanket
approval requirement for routine port merges while preserving explicit holds."

Four rules below are written as standing rules from directives Louis gave for one case: the image
rule in §3 (pull request #19), the pairing rule in §5 (#18), the deterministic-setup rule in §5 (the
keyboard calculation case) and the integration-evidence rule in §5 (the all-module run with 14 port
heads).

## 1. Scope and queue

- Course repositories stay read-only. No push to them, no pull request in them, and no live-course
  update without Louis's separate approval.
- Take pending items in `review/port-queue.md`: Intro to Pharmacology's 18-21 first, then BDK's
  part-1 items (below), then the remaining Pharmacokinetics items. Skip items that are not pending, items already represented by
  an open pull request or a pushed port branch, and the section "Core changes found by the
  assessments (not nightly)". There is no two-open-PR limit.
- BDK study features, part 1 (Louis, 2026-11-08: "I approve the reviewed plan at 84736dc and
  authorize implementing its defined Part 1 scope"; his message in the central session, event
  `3eb3c4d9-f3b1-4af6-ac5e-a162e7dd853a`). After Intro to Pharmacology's items and before the
  remaining Pharmacokinetics items, take queue items 14 (drug-list-tab), 22 (field-colours) and 12
  (compare-tab), in that order; for these three, this order replaces the queue's row order (§8).
  Louis approved the plan at `84736dc`. They are built in the narrower scope of the plan as merged
  (`review/bdk-study-features-plan.md` at `fa579cd`), whose only part-1 difference leaves out
  compare-tab's "Learn these N drugs together" button: it starts Learn, which records answers, and
  comes with learn-mode in part 2. Their source is BDK `assets/app.js` and `assets/style.css` at `05c36c3`,
  read-only. One more source, for drug-list-tab's recall mode only, the form the plan's "hide and
  reveal of a field for recall" takes here (BDK's drug list at `05c36c3` has none; DEENT's Recall mode
  hides each card's whole answer, not one field): DEENT `src/druglist_ui.js` at DEENT's live commit,
  `main` `0281922`, read-only. Its parts: the state, `recall` and `showCls` on line 31 and line 32; the
  hiding, lines 160, 163-164 and 174; the writing box and Reveal button, 168-173, and their style,
  70-71; the buttons, 203-206, and the note, 209; the handlers, 236, 248-253 and 256-259. Line 31's
  `flash` and `fi` and the Flashcards button at 207 are not part of it (Flashcards are queue item 16,
  part 2). The central session named this source on 2026-11-08 (its message to the porter at 14:18
  UTC). Louis's
  approval covers development, not storage, import or recovery, scheduling,
  migrations, destructive actions, test weakening or course publication; any of those goes to him
  with a concrete proposal. The other parts' items stay `planned` until he approves their part.
- Drug list outcomes kept in progress, queue item 23 (`drug-list-persistent-outcomes`, proposed by the DEENT
  session; `coordinator/improvements.json`). Louis, 2026-11-09, answering the central session's recommendation:
  "Whatever you recommend is the best" (the central session's message to the porter at 01:06 UTC). The
  recommendation, now his decision: develop and test it, and bring the pull request to him before any merge or
  any course switches it on. It is new progress storage with Import consequences, so it is handled as #81 is:
  it does not merge under decision 10, and it is built as drug-list-tab v2, off by default. Scope: a `DB.drugs`
  progress part (the equation-drill pattern) keyed by a stable fact id `drugId:field`, recording the outcome,
  recognition or recall, and the self-rating, never typed text; a fact-to-bank-question map, so that an answer
  on a fact that has a bank question is recorded once, on that question, and nothing is recorded through
  `record()` for an item that is not a bank question; the Import behaviour of a module record that changes
  without an answer (`core/README.md` 805-816) measured, with a proposal for it; profile isolation, Export and
  Import round trip, Reset and the per-tab record (#69); each test reads its data back after a reload and fails
  on a deliberately broken version. Source: DEENT at `main` `b747e49` or later, read-only, for the data shape
  and the fact ids, with the shape agreed with the DEENT session.
- Read each item from the repository in its Source column. For items 18 and 21, use only Intro to
  Pharmacology's implementation; BDK's versions belong to BDK's migration.
- The queue is not finished because every item has a branch or a pull request.
- Check current GitHub state before acting on pull request numbers mentioned in earlier reports.

## 2. Standing autonomy

- The porter proceeds independently with inspection, implementation, testing, separate topic
  branches and worktrees, opening pull requests, addressing reviews, and refreshing pending branches.
- It continues authorized work without asking again about unchanged pull requests.
- The holds of section 7 still need Louis's approval.

## 3. Source fidelity

- Under the existing source-fidelity requirement (real course data, nothing invented: `review/port-queue.md`
  and Louis's rule 4 of 2026-11-02), keep real course data, including professors' names and worked
  explanations. Generic interface wording written for the kit may say "the professor".
- Document every adaptation of the data that a port needs, and why.
- Do not rewrite branch history only to remove a professor's surname. Do no unrelated name
  clean-up on `main`.
- Images: restore the images a question needs to be understood or answered. Document any image
  that is legitimately left out, and explain why the test data stays representative without it.

## 4. Dependencies and completeness

- Name required modules in `module.json` `needs`, and explain each dependency in the pull request.
- A port stays a draft while a required module or core change is unmerged.
- A port pull request stays a draft titled "Port (incomplete): <feature>" while source behaviour is
  omitted, a required check fails, or a check does not run outside the documented exclusions. The
  draft lists what remains and its student-visible consequence. Documenting an omission does not by
  itself make a port complete.
- Core changes are proposed in pull requests of their own.
- Do not remove real questions only to make checks pass. Keep a reproduction, find whether the fault
  is in the core, the test or the source data, and propose the fix separately where needed. A port
  stays a draft while required coverage is blocked.
- Theme (pull request #20): keep the first-frame limitation and its evidence visible, evaluate the
  proposed core dependency (B5 in pull request #30) independently, and keep theme a draft until the
  limitation is resolved or Louis explicitly approves a narrower scope. Its first-frame check is
  never silently exempted.

## 5. Checks and evidence

- Keep `features/<name>/ci/oncourse.js`, real source-course data, the module-absent failure and the
  module-enabled pass, template output unchanged apart from build stamps, and the required template,
  module-course and Medicinal-chemistry checks. Include the affected module combinations, and WebKit
  where it applies: for a module, its course in WebKit on GitHub (section 7). The final revision of a
  pull request needs passing GitHub checks.
- A pairing in `features/ci-combinations.txt` stays in a port pull request when it directly verifies
  an interaction the feature affects. It carries a clear name and a line on its purpose, in the agreed
  format of that file.
- Investigate failures and keep their evidence. Diagnostic reruns are allowed; discarding a failure
  and rerunning until green is not. Never weaken, skip or exempt a required check without Louis's
  approval.
- Use targeted checks of important behaviour, not an open-ended mutation-testing exercise.
- Reuse evidence only while its inputs are unchanged. After a substantive change, rerun the
  affected checks; do not restart broad verification without need.
- Make test setups deterministic: when a case needs a particular kind of question, set up a real
  question of that kind (for example a real calculation question on an exam paper) rather than
  waiting for random selection to draw one.
- An integration run that is used as evidence keeps its logs, test scripts, integration commit, main
  commit, source-course commits and the exact port heads it included, and states which checks the
  coordinator ran and which results came from implementing agents.
- Desktop WebKit and simulated input do not replace real Safari, iPhone, iPad or Apple Pencil
  testing. Real-device testing remains required before BDK goes live.

## 6. Reporting

- Keep module tests apart from core tests (such as `home_test.js`).
- Keep PASS, FAIL, SKIPPED, NOT RUN and REPORT apart.
- Keep results run by implementing agents apart from results the coordinator ran independently.
- Describe the dark-mode result as the measured result across the views tested, without implying
  that every visual state or a real device was verified.

## 7. Merging

The porter may merge automatically only:

- documentation, catalog and bookkeeping changes;
- test-only fixes that preserve or strengthen meaningful coverage;
- isolated optional features that stay off by default and do not change existing course behaviour,
  progress storage, import or recovery, or scheduling.

Each automatic merge needs, on its final revision: an independent review by a separate reviewer
agent or an external reviewer (the implementing agent's own checks and passing CI do not count);
passing required checks, as `KIT_DESIGN.md` §12 decision 10 defines them (every applicable job
concluded "success" on the final head commit; a module job the plan intentionally did not select is
not applicable, and a job that failed, was cancelled, timed out or never started, or no run for the
final head commit, blocks the merge); for a module, also a WebKit run of its course that concluded
"success" on GitHub on the final head commit (`core/ci_course.sh module:<name> webkit`; decision 10,
Claude's reading 6; the job "modules-webkit" runs it since #42); no unresolved findings; and no
unrelated changes. Eligibility is decided per pull request; being
optional does not by itself make a pull request eligible.

Louis's approval is still needed for:

- progress storage, import or recovery, and scheduling behaviour, including new persistence inside
  an optional module;
- course migrations and live-course updates;
- destructive actions, permission changes, and unresolved consequential design choices;
- weakening, skipping or exempting a required check.

Pull request #32 stays unmerged pending its separate review and Louis's approval; it is never merged
under this routine authority. Louis's approval of #29 at reviewed commit `a2169d6` was used: #29
merged as `4e0fae4`.

## 8. Branches and parallel work

- Independent items may run in parallel, in separate worktrees and scratch folders. Dependent items,
  and changes to the same module, run one after another. Open new port pull requests in queue order.
- After a merge, refresh the pending branches safely. Never move a branch that is checked out in
  another worktree.

## 9. Review

- The existing exam-drill-kit review automation (ChatGPT) covers both main-kit work and port pull
  requests; do not create a separate porter automation. Its review windows are about 5:00, 10:00,
  15:00 and 20:00 America/Chicago, including daylight-saving adjustments; they are windows, not
  guaranteed completion times.
- Put explanations, evidence, uncertainties and review requests on the relevant pull request. Check
  its comments and reviews before finalizing or merging, evaluate each point independently, and reply
  with the reasoning and validation for accepting or rejecting it.
- For earlier feedback, post on the pull request the exact commit, the specific questions, the
  evidence, and the decision that depends on the review, and name the pull request in the
  consolidated update so that Louis can request an earlier ChatGPT review.
- A GitHub comment or mention does not start a ChatGPT review at once; continue other work, and use
  another qualified independent reviewer when one is available.
- Coordinate shared fixes with the main kit session rather than duplicating its work.

## 10. Updates

- Give Louis one consolidated update. It names each pull request it reports on and records every
  automatic merge.
- Notify him promptly about confirmed progress-loss risks, live-site problems, or decisions that
  genuinely block progress. The approval requests of section 7 are asked as before. Do not ask
  again about unchanged pull requests.

## 11. Coordination with ChatGPT, feedback checks and status (Louis, 2026-11-06)

Louis's message of 2026-11-06 adds these rules; where they are stricter than the sections above,
they apply. §9's "do not create a separate porter automation" bars a second ChatGPT review automation
only. Louis: "Keep the shared ChatGPT review automation. Do not create another ChatGPT review task.
The additional Claude feedback checks are for reading and responding to that shared review work." The
Claude feedback-check task below is the one he asked for on 2026-11-06.

- **GitHub is the handoff with ChatGPT.**
  - The shared ChatGPT review automation covers main-kit work and porter drafts: correctness, missing
    functionality, and focused student-experience improvements. No other ChatGPT review task is
    created.
  - Read new comments and reviews before continuing the affected work.
  - Evaluate each finding independently and address the valid ones.
  - Reply on the same pull request with the reasoning, the exact tested commit and the evidence.
  - Continue unrelated authorized work while waiting.
- **Priorities.** Complete the drafts' declared missing functionality and resolve their dependencies
  first. Keep useful source behaviour, without requiring each module to reproduce unrelated features
  of its source course. Weigh optimization suggestions, but confirmed defects, progress preservation
  and agreed functionality come first.
- **Optional improvements** go in the existing improvement registry. Each entry is checked for
  duplicates and says its student benefit and acceptance criteria. On 2026-11-06 the registry
  (`coordinator/improvements.json`) exists only in coordinator PR #57, which is not merged. Until it
  is, each optional improvement is recorded on the pull request it concerns, with its student benefit
  and acceptance criteria, and sent to the main kit session for the registry. The gap is reported to
  Louis. (Claude's stopgap, not Louis's rule.)
- **Three statuses, reported apart:**
  - tests passing;
  - intended source functionality fully ported;
  - feature available in a live course.

  State whether evidence covers a kit fixture, a module course, a real course build or a live site.
  Passing kit tests are not proof that a live course received an update. A course repository that
  could not be read is reported as unreviewed.
- **Feedback checks.** The scheduled task "Kit porter feedback check" runs at about 5:30, 10:30,
  15:30 and 20:30 America/Chicago, daylight-saving included, 30 minutes after ChatGPT's review
  windows. Neither schedule guarantees completion. If feedback has not arrived, authorized work
  continues and the next window checks again. Louis's setup rules: the existing nightly task is kept;
  one recurring task covers all four windows rather than four tasks; no existing equivalent task is
  duplicated. (Claude's design, not Louis's rule: the task fires into the porter session, like the
  nightly run, so the two never run at the same time.) Each check:
  1. reads new comments and reviews on the porter's open pull requests and on relevant core
     dependencies. Its watch list also holds coordinator PR #57 (Claude's reading of Louis's
     line routing course oversight through #57);
  2. compares them with the last processed comments and commits, kept as a durable checkpoint
     (branch `porter/feedback-checkpoint`, `feedback/check.py`), so unchanged discussions are not
     processed again and a new commit counts as a change;
  3. assesses new findings, addresses the valid ones within existing authorization, or records a
     specific approval request;
  4. replies on the pull request with one disposition per finding: fixed, rejected with evidence,
     awaiting clarification, blocked, or awaiting Louis. The reply gives the reasoning, the exact
     commit and the validation;
  5. ends promptly when nothing material changed: no tests rerun and no message to Louis.

  Triage aims at about five minutes; that is a planning budget, not a cutoff. Substantial
  implementation continues through the existing work process (the nightly run and §2's standing
  autonomy).
- **No concurrent edits.** No two tasks or agents edit the same branch or worktree. When necessary,
  a handoff is left for the active implementing session, and fixes are not duplicated across
  sessions.
- **Review requests.** Before requesting another review, give the exact commit, what changed, the
  specific questions and the existing evidence. Request another full review only when code, evidence
  or an unresolved substantive question warrants it. Do not rerun the full suite only because a
  feedback window arrived.
- **Responsibilities.**
  - The porter session owns the feature ports and their reviews.
  - Shared core dependencies and GitHub workflow changes are coordinated with the main kit session.
  - Broader course oversight goes through coordinator PR #57 or its successor, without duplicating
    it or assuming proposed work is already running.
- **Communication.** Send Louis consolidated updates for material progress, batched approval
  decisions or genuine blockers. Each gives the remaining functionality, dependencies, final
  commits, evidence and the decisions actually needed. Routine acknowledgements and unchanged
  status belong on GitHub. Confirmed progress-loss risks and live-site failures are reported to him
  promptly.
- **No new permission.** This schedule grants no merge, course-repository write or deployment
  permission. Every other approval requirement stays.

### Decisions on kit PR #17, worksheets-ink (Louis, 2026-11-06)

Louis: "Check the current PR state first and apply these decisions only where still relevant."

1. **Ink saving.**
   - Louis authorizes the fix that makes worksheets-ink save through the core's supported storage
     path. He prefers it to a direct browser-storage write followed by bookkeeping that only
     suppresses the stale-page warning.
   - The path must be confirmed independently to handle ink correctly. A consequential core design
     change beyond integrating the module with the existing path is explained to him separately
     before it is made.
   - Existing ink and other progress are kept.
   - Tests show that:
     - writing ink does not block later saves;
     - genuine second-tab conflicts stay protected;
     - a failed save gives an accurate warning without deleting saved work.
   - The affected keyboard interaction is rechecked, and the previously reported WebKit print failure
     is investigated.
2. **PDF-size check.**
   - Louis approves documenting it as Chromium-only, because the test's PDF-generation API is not
     available in WebKit.
   - Meaningful WebKit print-layout checks of worksheet content and ink placement are kept.
   - The PDF-size check is reported explicitly as NOT RUN in WebKit under this approved exclusion. It
     is never hidden through output formatting or counted as passed.
   - Real Safari, iPhone, iPad and Apple Pencil testing remain required.

These decisions authorize the implementation and this one testing exclusion. They do not approve
merging #17 or publishing a course update. The final revision, its independent review, the required
check results and the remaining limitations go back to Louis for merge approval.

## 12. Coordination across sessions (Louis, 2026-11-08)

Louis's message of 2026-11-08 in the porter session, verbatim:

> Apply this coordination policy across the project
>
> I authorize the feature porter to coordinate adoption of this policy with the main kit, Kit updater/coordinator, and DEENT sessions using supported session communication. Ask each session to acknowledge adoption and persist the relevant instructions within its authorized scope.
>
> If direct communication is unavailable, use shared GitHub discussions and durable handoff records. Report any session that could not be reached. Do not claim another session adopted the policy without confirmation or bypass session permissions.
>
> This coordination policy does not expand any session’s implementation, merge, or deployment authority. The porter’s Part 1 authorization remains specific to that work.
>
> One central decision session
>
> Use “Exam drill kit Phase 1 setup” as the central coordination and approval session.
>
> Routine questions, dependency checks, reviews, and implementation handoffs should pass directly between the owning sessions. Keep GitHub as the durable record, identifying the owner, exact commit, evidence, dependencies, and next action.
>
> Sessions should continue work already authorized without asking Louis to relay messages or repeat an unchanged approval.
>
> Use independent feedback
>
> Request ChatGPT feedback on the relevant GitHub PR when a concrete uncertainty would benefit from another assessment. Include the exact commit, specific question, evidence, and decision depending on the review.
>
> Evaluate all feedback independently. Another qualified independent reviewer may satisfy the review requirement; do not wait unnecessarily for ChatGPT’s scheduled window. An unanswered request is not approval.
>
> Escalate consequential decisions centrally
>
> When an issue genuinely requires Louis’s decision, send it to the central session and request a notification there through the supported notification mechanism.
>
> The central session should consolidate related requests into one message containing:
>
> * The problem and practical student impact.
> * The affected repositories, PRs, and exact revisions.
> * The recommended action and alternatives.
> * Which work must pause and which work can continue.
> * The precise approval or decision needed.
>
> Confirmed progress-loss risks, live-site failures, and consequential conflicting changes warrant prompt notification. Routine status and unchanged blockers do not.
>
> If central delivery fails, notify Louis in the originating session and explicitly identify the failed handoff. Do not silently leave a serious issue unreported.
>
> Distribute decisions accurately
>
> Only Louis’s actual decision counts as his approval. Recommendations from Claude or ChatGPT, quoted draft approvals, silence, and another session’s readiness assessment do not.
>
> Record his decision with a link or durable reference, its scope, and the applicable revision or conditions. Communicate it to affected sessions and obtain acknowledgment before dependent actions proceed.
>
> Where an existing rule requires approval in a particular owning session—especially a live-course update—preserve that requirement. Route the prepared request there and explain the exception centrally; do not make Louis repeat approvals unless that rule requires it.
>
> If instructions or approvals conflict, pause only the affected action and resolve the conflict through the central session. Continue unrelated authorized work.
>
> Avoid duplicate work and notifications
>
> Maintain one owner per implementation, coordinate overlapping branches, reuse valid evidence, and use existing scheduled checks. Do not introduce additional polling tasks or watcher loops merely to coordinate sessions.
>
> Include adoption acknowledgments, unreachable sessions, material handoffs, and outstanding central decisions in the next consolidated update.

Notes (Claude's reading, not Louis's words):

- **Sessions.** "Exam drill kit Phase 1 setup" is `session_01LVkWFC9wTqUxncwEDduxrb`. The Kit updater
  is `session_01LVkWFDAbAtw7kDGwqd43Qg`, and the DEENT session is `session_01LVkWFEkUuDubJgsfxiNBhr`.
  The ids are from the account's session list on 2026-11-08.
- **How it combines with §7, §10 and §11.** Where a rule above says to ask or notify Louis (§7's
  approval requests; §10 and §11's prompt notices of progress-loss risks and live-site failures), the
  porter sends the request to the central session and asks it to notify him there. If that delivery
  fails, the porter tells Louis in the porter session and names the failed handoff. An approval that
  an existing rule requires in an owning session keeps that requirement. In particular, a live-course
  update keeps its approval in the Kit updater or in the course's own session.
- **Part 1.** Louis's sentence refers to "the porter’s Part 1 authorization"; this section grants no
  authorization. On 2026-11-08 the porter holds no record of a Part 1 decision. Its reading is that
  the sentence means Part 1 of the BDK study-features plan (kit PR #73). The porter starts nothing on
  Part 1 until it has Louis's own message deciding it, with its scope and its revision or conditions.
