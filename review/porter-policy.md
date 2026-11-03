# Feature-porter policy (Louis, 2026-11-03)

This policy governs the "Kit feature porter" session, its scheduled task "Kit feature port", and
every port pull request (`port/<name>` branches). Correctness takes priority over finishing quickly.
For port pull requests it replaces the rule in `CLAUDE.md` that each merge needs Louis's yes; every
other rule in `CLAUDE.md` and `KIT_DESIGN.md` §12 stays as it is.

## 1. Scope and queue

- Course repositories stay read-only. No push to them, no pull request in them, and no live-course
  update without Louis's separate approval.
- Take pending items in `review/port-queue.md`: Intro to Pharmacology's 18-21 first, then the
  remaining Pharmacokinetics items. Skip items that are not pending, items already represented by
  an open pull request or a pushed port branch, and the section "Core changes found by the
  assessments (not nightly)". There is no limit on open port pull requests.
- Read each item from the repository in its Source column. For items 18 and 21, use only Intro to
  Pharmacology's implementation; BDK's versions belong to BDK's migration.
- The queue is not finished because every item has a branch or a pull request.

## 2. Source fidelity

- Keep real course data, including professors' names and worked explanations. Generic interface
  wording written for the kit may say "the professor".
- Document every adaptation of the data that a port needs, and why.
- Do not rewrite branch history only to remove a professor's surname. Do no unrelated name
  clean-up on `main`.

## 3. Dependencies and completeness

- Name required modules in `module.json` `needs`, and explain each dependency in the pull request.
- A port pull request stays a draft titled "Port (incomplete): <feature>" while any of these holds:
  a required module or core change is unmerged; source behaviour is omitted; a required check fails;
  or a check does not run outside the documented exclusions. The draft lists what remains and its
  student-visible consequence. Documenting an omission does not by itself make a port complete.
- Core changes are proposed in pull requests of their own.
- Do not remove real questions only to make checks pass. Keep a reproduction, find whether the fault
  is in the core, the test or the source data, and propose the fix separately where needed.

## 4. Checks and evidence

- Keep `features/<name>/ci/oncourse.js`, real source-course data, the module-absent failure and the
  module-enabled pass, and template output unchanged apart from build stamps.
- Run `run_checks.sh` on the template course, the module's own course and Medicinal-chemistry (full
  clone), the affected module combinations, and WebKit where it applies. The final revision of a
  pull request needs passing GitHub checks.
- Investigate failures and keep their evidence. Diagnostic reruns are allowed; discarding a failure
  and rerunning until green is not. Never weaken, skip or exempt a required check without Louis's
  approval.
- Use targeted checks of important behaviour, not an open-ended mutation-testing exercise.
- Reuse evidence only while its inputs are unchanged. After a substantive change, rerun the
  affected checks.
- Make test setups deterministic: when a case needs a particular question (for example a real
  calculation on an exam paper), set it up, rather than waiting for random selection.
- Desktop WebKit and simulated input do not replace real Safari, iPhone, iPad or Apple Pencil
  testing. Real-device testing is kept for before BDK goes live.

## 5. Reporting

- Keep module tests apart from core tests (such as `home_test.js`).
- Keep PASS, FAIL, SKIPPED, NOT RUN and REPORT apart.
- Keep results run by implementing agents apart from results the coordinator ran independently.
- Describe a dark-mode or contrast result as the measured result across the views tested, not as
  proof of every visual state or of real devices.

## 6. Merging

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
under this routine authority.

## 7. Branches and parallel work

- Independent items may run in parallel, in separate worktrees and scratch folders. Dependent items,
  and changes to the same module, run one after another. Open new port pull requests in queue order.
- After a merge, refresh the pending branches safely. Never move a branch that is checked out in
  another worktree.

## 8. Review

- The existing exam-drill-kit ChatGPT review automation covers port pull requests too; the porter
  creates no separate review automation. Its review windows are about 5:00, 10:00, 15:00 and 20:00
  America/Chicago; they are windows, not guaranteed completion times.
- Put explanations, evidence, uncertainties and review requests on the relevant pull request. Check
  its comments and reviews before finalizing or merging, evaluate each point independently, and reply
  with the reasoning and validation for accepting or rejecting it.
- A GitHub comment or mention does not start a ChatGPT review at once; continue other work, and use
  another qualified independent reviewer when one is available.
- Coordinate shared fixes with the main kit session rather than duplicating its work.

## 9. Updates

- Give Louis one consolidated update, recording automatic merges and naming each pull request.
- Notify him promptly only about confirmed progress-loss risks, live-site problems, or decisions that
  block progress. Do not ask again about unchanged pull requests.
