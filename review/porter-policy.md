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
- Take pending items in `review/port-queue.md`: Intro to Pharmacology's 18-21 first, then the
  remaining Pharmacokinetics items. Skip items that are not pending, items already represented by
  an open pull request or a pushed port branch, and the section "Core changes found by the
  assessments (not nightly)". There is no two-open-PR limit.
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
  Louis.
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
     dependencies. Its watch list also holds coordinator PR #57, because Louis routes course
     oversight through it;
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
  implementation continues through the existing work process (§2: the nightly run and the porter's
  standing autonomy).
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
