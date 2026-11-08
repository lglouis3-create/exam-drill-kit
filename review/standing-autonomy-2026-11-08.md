# Louis's standing authorization for routine course updates (2026-11-08)

Louis wrote the text below in the "Kit updater" session (`session_01LVkWFDAbAtw7kDGwqd43Qg`)
on 2026-11-08, after that session had asked for his approval of a pin-only
Medicinal-chemistry update. His words govern; `KIT_DESIGN.md` §12 decision 10 and
`skill/SKILL.md` Mode 7 summarize them. It replaces his rule of 2026-11-03 that every routine
live-course update waits for his reply (`review/kit-update-run-message-2026-11-03.md`), and
it leaves `review/standing-autonomy-2026-11-03.md` in force for everything else.

His introduction: "Understood—Claude should verify and publish routine updates on its own,
and involve you when there's a meaningful risk or decision. Verifying the exact preview is
Claude's responsibility; it doesn't need to become another approval request."

## 1. Standing authorization for routine updates (verbatim)

> I authorize you to prepare, validate and publish routine course updates without asking for
> my approval each time. Use your judgment to decide when I need to review something.
>
> Before publishing, verify the exact candidate, evaluate the changes, complete required
> checks and independent reviews, and confirm that the published build matches the validated
> candidate. Keep recovery or rollback available.
>
> Ask me when there is a meaningful decision or unresolved risk, such as:
>
> * Potential loss or incompatible conversion of saved progress.
> * Removing content or features, changing answer keys without adequate source support, or
>   making a substantial change to study or exam behavior.
> * A major redesign close to an assessment.
> * Conflicting requirements or a consequential tradeoff you cannot confidently resolve.
> * Weakening required checks, destructive actions or permission changes.
>
> Fix routine defects and resolve ordinary implementation choices yourself. Do not publish
> with unresolved consequential findings or failed required checks.
>
> This replaces my previous requirement to approve every routine live-course update. Record
> the revised authorization in the appropriate reviewed policy PR. Do not repeatedly ask me to
> grant the same authorization.
>
> Existing explicit holds remain in force, including DEENT's pending release and its automatic
> kit-preview pause, until their recorded conditions are resolved or I lift them.

## 2. Finish the current Medicinal-chemistry update (verbatim)

> Inspect the current preview and its exact changes. The previously reported preview was on
> main at ed10308; verify the current state rather than assuming that reference is still
> current.
>
> If it qualifies as a routine update under the authorization above, complete validation and
> publish it without another approval request. Report the resulting commit and deployment
> outcome concisely.
>
> If it needs my review, explain the specific decision or risk and provide the completed
> preview and evidence.

Done the same day: Medicinal-chemistry commit `59c9a86` ("kit update: core 0eeb13b →
1bdc08e"), Pages deploy run 42472429167 completed with success; log entry `97ecf8b`.

## 3. Move all remaining courses onto the shared core (verbatim)

> I want BDK, Basic-Pharmacokinetics- and Intro-Pharmacology- migrated onto the
> exam-drill-kit core. This supersedes my earlier decision to leave Pharmacokinetics and
> Intro to Pharmacology on their original engines while only porting their features.
>
> Continue existing work and reuse existing branches, PRs and ported features. Establish one
> owner per migration and an order based on current progress and upcoming assessments. Keep
> these migrations outside DEENT's immediate release dependencies.
>
> For each migration:
>
> * Inventory existing content and features.
> * Preserve questions, explanations, figures, exam settings, useful study workflows and saved
>   progress.
> * Identify and resolve shared-core feature gaps rather than silently dropping functionality.
> * Test progress compatibility, any necessary conversion, recovery and rollback.
> * Prepare a preview, obtain independent review and complete all required checks.
>
> Proceed autonomously where the migration preserves existing behavior and progress with
> convincing validation. Bring me consequential feature compromises, uncertain progress
> conversions or other meaningful decisions before switching the live course.
>
> Medicinal-chemistry and DEENT already use the core; maintain them as existing core courses.

## 4. Apply meaningful maintenance to every course (verbatim)

> Apply this policy to all five courses:
>
> * Continue lightweight monitoring through existing schedules.
> * When shared-core code or a feature changes, assess which courses benefit. Consider
>   improvements to existing features and newly available features that fit the course
>   material.
> * A new kit commit or pin difference alone should not trigger a preview, publication or
>   notification.
> * For a relevant improvement, explain the student benefit, check for existing work, and
>   prepare and validate the change. Publish routine updates under the standing authorization
>   above.
> * Keep completed courses eligible for useful improvements. "Course ended" reduces routine
>   work and notifications; it does not end maintenance.
> * Prioritize active courses and upcoming assessments. Preserve explicit course-specific
>   holds.
> * Report meaningful completed improvements, confirmed problems and decisions needing my
>   input. Suppress repeated notices about unchanged pauses or version differences.
>
> For Medicinal-chemistry, record that the course has ended and stop previews generated
> solely because its pin differs from kit main. Continue reviewing relevant feature
> improvements.
>
> For courses awaiting migration, continue reviewing their existing engines and tracking
> useful shared features. "No kit pin" is an expected migration status, not a failure.

## 5. Record and coordinate (verbatim)

> Reconcile these decisions across the registry, coordinator, updater instructions and
> migration plans through the appropriate reviewed PRs. Preserve required checks and
> independent reviews.
>
> Use existing coordination channels and schedules. Avoid duplicate tasks, competing owners
> and redundant recurring reviews.
>
> Return one concise handoff showing:
>
> * The Medicinal-chemistry update outcome.
> * Each course's live, preview and migration status.
> * Migration owners, order and work being reused.
> * Relevant improvements identified or published.
> * Remaining blockers and any specific decision needing my review.

## Where each part is recorded

- §1 and §4: `KIT_DESIGN.md` §12 decision 10 ("Live courses", amendment of 2026-11-08);
  `skill/SKILL.md` Mode 7 "The kit-update run"; the stored instructions of the scheduled task
  "Kit update run" (`trig_01QduqhookGDD8HxANEbLq4w`), rewritten in the Kit updater session on
  2026-11-08 at 10:41:46 UTC.
- §2: Medicinal-chemistry `reviews/LOG.md`, 2026-11-08, and `COURSES.md`.
- §3: migration owners and order, set by the central session "Exam drill kit Phase 1
  setup" on 2026-11-08 (11:00 UTC, by message to the Kit updater): order BDK (no switch on
  11/17-11/19 or 11/30), then Basic-Pharmacokinetics-, then Intro-Pharmacology-; the owner of
  all three is the central kit session (inventory, course-repo branch, preview, progress
  conversion and rollback tests, decisions to Louis), because `review/porter-policy.md` §1
  keeps course repositories read-only for the porter and widening that would be a permission
  change for Louis; the porter builds the kit-side feature gaps as modules through
  `review/port-queue.md` (BDK Part 1 now, the Pharmacokinetics Tier 2 drafts, Intro to
  Pharmacology items 18-21); the Kit updater keeps nightly maintenance and routine updates
  for all five courses. `COURSES.md` carries the same under each course.
- Earlier decisions this text supersedes: the 2026-11-01 decisions to leave Pharmacokinetics
  and Intro to Pharmacology on their own engines (`CLAUDE.md`, "Moving the courses onto the
  core"), and the 2026-11-03 rule that every routine live-course update waits for his reply.
