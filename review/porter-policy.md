# Feature-porter policy (Louis, 2026-11-03)

This policy governs the "Kit feature porter" session, its scheduled task "Kit feature port", and
every pull request that session opens (port pull requests on `port/<name>` branches, and its
documentation, catalog and proposal pull requests). Correctness takes priority over finishing quickly.

For the porter session's pull requests it replaces two merge rules: the rule in `CLAUDE.md` "Rules for
kit sessions" that each merge needs Louis's yes, and the merge rules of `KIT_DESIGN.md` §12.9 (a
feature merges only after Louis's yes; catalog bookkeeping and `small-fix` pull requests merge
themselves once every check passes). Section 6 below holds the merge rules for these pull requests;
in particular a bookkeeping pull request of the porter no longer merges on passing checks alone.
Louis: "This replaces the blanket approval requirement for routine port merges while preserving
explicit holds." Every other rule in `CLAUDE.md` and `KIT_DESIGN.md` §12 stays as it is.

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
- The holds of section 6 still need Louis's approval.

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
  where it applies. The final revision of a pull request needs passing GitHub checks.
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
passing required checks; no unresolved findings; and no unrelated changes. Eligibility is decided per
pull request; being optional does not by itself make a pull request eligible.

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
