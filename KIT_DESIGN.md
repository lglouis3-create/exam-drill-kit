# exam-drill-kit: design brief

This file is the brief for building the exam-drill-kit and the revised
exam-drill-builder skill. A session working on the kit reads this file first,
in full, before any other work. Later sessions keep it as the record of the
kit's design and update it when Louis approves a change to the design.

## 1. Goal

Louis builds an exam drill site on GitHub Pages for each course he takes. Each
course should get the features and design that best fit its own material
(slides, transcripts, the professor's questions, Louis's Google Drive and
Goodnotes material). Every feature or improvement one course produces should be
available to every later course. Over time the kit should converge on the best
version of each feature for each kind of material, based on evidence.

Two layers make this work:

| Layer | Contents | Rule |
|---|---|---|
| Shared core | scheduler, storage shim, offline mode, build, checks, Pages setup | One version, used by every drill. A fix lands in every course that updates. |
| Feature library | every optional feature any drill has built | Nothing is discarded. Each feature is a module a course switches on in `course.js`, with a catalog entry saying what material calls for it. |

Differences between courses are intended. Duplicated core code is the problem
to remove.

## 2. Sources for the first build

Repositories (all owned by `lglouis3-create`):

| Repo | Order built | Notes |
|---|---|---|
| `Medicinal-chemistry` | 1st | Original drill. Engine in `src/`, no `course.js`, settings hard-coded in `src/shell.html` and `src/views.js`. Build log in `src/README.md`. |
| `Basic-Pharmacokinetics-` | 2nd | Own engine variant: 25 check scripts, `figures.py`, `slides.py`, Diagrams tab, audio clips, variables quiz, daily file check, `version.json`. No state doc. |
| `Intro-Pharmacology-` | 3rd | Has `course.js`, `share/FEATURES.md` (early feature inventory), `share/skill/` (317-line unpublished SKILL.md draft), state doc at `claude/drill-app-state.md` (stale). |
| `BDK` | built separately | Not built with the skill. Built from Louis's Quizlet deck spec; has `course.js`; tracks state in `CLAUDE.md`, `reviews/LOG.md`, `reviews/OPEN_QUESTIONS.md`. Louis values how it adapted its format to the course. |
| `exam-drill-kit` | this repo | Private at Phase 1 (public since 2026-11-03, Louis's change). Holds `Exam drill builder-v1.zip` (skill v1, 173 lines) and `exam-drill-builder.skill` (skill v2, 245 lines, identical to the installed skill). |

Each course repo has `claude/drill-notes.md`, written by that course's build
session: what the drill added beyond the skill, problems and their fixing
commits, SKILL.md steps that were wrong or skipped, Louis's decisions in his
words, and unfinished work. Read all four notes files before evaluating code.

Skill lineage to verify from git history: v1 (built from Medicinal-chemistry)
→ PK (second course, where v1 said `course.js` would be created) → v2 (refers
to an `exam-drill-template/` folder) → pharmacology and its `share/skill/`
draft. The `exam-drill-template/` folder that v2 names does not exist on
Medicinal-chemistry's main branch; find whether it exists anywhere in any
repo's history.

## 3. Decisions Louis has made

1. **Approval of kit changes (option A).** New features, feature upgrades,
   core changes and SKILL.md changes go to `exam-drill-kit` as pull requests
   that Louis merges. Catalog bookkeeping (a "used by <course>" line, a dated
   evidence note) may merge automatically. Course repos keep their existing
   rule of merging automatically (amended by §12 decision 10, 2026-11-03: not where
   it would change a live site without Louis's approval).
2. **Learning-science research is a proposal.** When the skill sees an
   opportunity to improve how material is presented or practised, it may read
   learning-science research and then present a plan for Louis to review. It
   builds nothing until he approves.
3. **Question content comes only from the course.** Slides, transcripts, the
   professor's polls, practice sets and review material, and Louis's own
   material. No outside content enters a question, explanation or reference
   table.
4. **Old feature versions are kept.** Upgrading a feature never deletes the
   previous version.
5. **A design check runs every time material is added.** See Mode 2.
6. **Design changes are previewed** at `/preview/` on the course's own site
   before they replace the live page.
7. **New features and upgrades are built when the material calls for them**
   and stored in the kit for later courses.
8. **The skill creates each new course's repo** (Mode 1). Louis reports that
   Claude has access to all his repositories. If GitHub refuses repo
   creation, the skill gives Louis the manual steps and continues once the
   repo exists, and records which case applied in the kit's `CLAUDE.md`.
9. **All six capabilities in section 8 are in scope.** The classmate report
   button is off by default per course.
10. **Continuous improvement is a standing rule** (section 7).

## 4. Kit repository layout

```
exam-drill-kit/
  KIT_DESIGN.md        this brief
  CLAUDE.md            kit state: what was built, open questions, which
                       permissions were confirmed (e.g. repo creation)
  FEATURES.md          feature catalog (format in section 5)
  COURSES.md           course registry (format in section 6)
  CHANGELOG.md         dated kit changes
  skill/SKILL.md       the master exam-drill-builder skill
  core/                shared engine and checks
  features/<name>/
    current/           the active version of the module
    archive/v1/ ...    every earlier version, unchanged
    test.*             the feature's own test, run by the shared checks
  history/             skill v1 and v2 archives (move the two uploaded files here)
  template/            a new-course skeleton that core + chosen features are copied into
```

## 5. FEATURES.md entry format

```
## <feature-name>
Does: what it adds for the student
Use when: what in the course material calls for it (with an example from the
  course that introduced it)
Do not use when: material for which it adds clutter
Enable: course.js → features.<name> = { version: 'v2', ...options }
Versions:
  v1  <date>  from <course>   best for: ...   weaker at: ...   archive/v1/
  v2  <date>  from <course>   best for: ...   weaker at: ...   current/
Evidence: learning-science citations, if any; Louis's notes; study data;
  exam feedback
Used by: <course> (version)
Known issues:
Test: path to the feature's test
```

A version is retired only when Louis approves, after a retro shows a newer
version is better at everything the older one was best for.

## 6. COURSES.md entry format

```
## <course code and name>   repo: <name>   site: <url>   term: <term>
Material profile: calculation-heavy / drug tables / structures / pathways /
  figure-heavy / professor question styles / other
Features and versions used:
Mid-course design changes: date, what changed, why, preview approved y/n
Proposals declined: date, proposal, Louis's reason (not re-proposed without
  new evidence)
Exam outcomes: per exam, score if Louis gives it, question types that
  appeared, what the drill missed
Louis's notes: what helped, what he skipped
```

## 7. Standing principles for every mode

1. **Improvement proposals.** Every session (setup, new material, exam build,
   bank review, retro) ends with an "Improvement proposals" section: new
   features, upgrades, better presentation of the material, better question
   writing. Sources: the course material, Louis's study data, exam outcomes,
   learning-science research. Each proposal states what, why for this course
   (deck and slides), evidence with citations, what it would look like, and
   cost and risk. If nothing is worth proposing, say so in one line.
2. **No duplicates.** Before proposing a feature, search FEATURES.md and
   propose an upgrade to a close match instead of a near copy.
3. **General vs course-specific.** Reusable logic goes to the kit; one
   course's data stays in its repo.
4. **Progress is never lost.** Question ids and the storage namespace `ns`
   never change in a redesign or core update.
5. **No silent upgrades.** A course keeps its pinned feature and core
   versions until Louis says "update the <course> drill to the latest kit".
6. **Honest reporting.** A check that did not run is reported as NOT RUN.
   Skipped steps are listed, not only skipped checks. A fact that cannot be
   pointed to on a slide or in a transcript is left out and reported.
7. **Commit every script** that produced content, including one-off helpers.
8. **State lives in the course repo's `CLAUDE.md`** (BDK's pattern, which
   Claude Code reads automatically), plus `reviews/LOG.md` and
   `reviews/OPEN_QUESTIONS.md`. A check fails the build when `CLAUDE.md` was
   not updated after the newest lecture was added. Verify this choice in
   Phase 1 against the pharmacology `drill-app-state.md` approach.
9. **Privacy on shared sites.** Personal names and personal mnemonics stay
   out of a shared build unless Louis asks for them.
10. **Tokens** live only in `.git/config`; grep before every commit and
    package.

## 8. Capabilities

| # | Capability | Plan |
|---|---|---|
| 1 | Exam outcome feedback: after each exam Louis records score, question types seen, what the drill missed | Build now (Mode 8) |
| 2 | Learning analytics: confidence vs correctness, retention, kind of miss (setup, unit, algebra, rounding), feature usage, exported from the drill | Build now in core |
| 3 | Cross-course review: earlier courses' questions return at a low rate in later drills | Design for; build later |
| 4 | Goodnotes coverage check: from notebooks Louis exports as PDF into the course's Drive folder, show which objectives he has written up, drilled, or neither. It never writes review sheets. | Design for; build later |
| 5 | Device testing: every release checked on mobile Safari and Chrome (the PK lookbehind regex broke older Safari) | Build now in core checks |
| 6 | Classmate "report a problem" button that opens a GitHub issue on the course repo | Build as a feature, off by default |

## 9. Skill modes (revised SKILL.md)

Phrase table stays: the user starts a mode by phrase; a mode acts only on the
course it names.

**Mode 1: New course** ("set up a drill for <course>")
1. Create the repo (naming like the existing ones), enable Pages, add
   `CLAUDE.md`, `reviews/`, `course.js`. If creation is refused, give Louis
   the manual steps and wait.
2. Read the course material: Claude Project (when the session can), Google
   Drive course folder, Goodnotes PDFs exported to Drive, syllabus, decks,
   transcripts, professor questions.
3. Build a material profile; compare with COURSES.md; select features and
   versions from FEATURES.md; propose them to Louis with a reason and the
   source course for each; wait for approval.
4. Copy core + chosen features from the kit, build, run all checks, publish,
   add the course to COURSES.md, offer a daily review routine with write
   access and a written-log check.

**Mode 2: Add material** ("ingest lecture N" / "add lecture N to <course>")
1. Ingest and write questions as in skill v2.
2. Design check: profile the new material and compare with the live site's
   features. Result is one of: fits (no change); adjust (propose turning a
   feature on or off, citing slides); redesign (explain what changed and
   build a `/preview/`). Nothing changes without Louis's approval; a
   scheduled run only leaves the proposal.
3. If the material needs a feature the catalog lacks or a current feature
   cannot handle, propose a new feature or an upgrade (section 7.2). After
   approval and preview, the module goes to the kit by pull request with its
   FEATURES.md entry and test.

**Mode 3: Exam build**, **Mode 4: Bank review**: as in skill v2, plus the
standing principles.

**Mode 5: Scheduled ingest or review** ("set up nightly ingest for <course>")
Created with write access to the course repo. Each run must confirm it wrote
its log entry and report failure otherwise; a run that did nothing must not
end as succeeded.

**Mode 6: Retro** ("retro the drill skill against <course>")
After each exam build or course setup: harvest general changes into the kit
by pull request; update FEATURES.md versions, "best for" and evidence; update
COURSES.md; propose retiring versions where evidence supports it.

**Mode 7: Update a drill** ("update the <course> drill to the latest kit")
Move a course to current core and feature versions on a preview first.

**Mode 8: Exam outcome** ("exam N outcome for <course>")
Record Louis's exam feedback in COURSES.md and compare it with drill
coverage.

## 10. Findings already known (verify, do not assume)

- No `exam-drill-template/` folder on any main branch checked so far.
- Medicinal-chemistry: 12 source files described in `src/README.md` are not
  in the repo or in the Drive zip; three missing SKILL.md steps (serving at
  the Pages root, image format, offline) were fixed in `4a32dad` and
  `ed38dbd`; `main` is unprotected.
- PK: SKILL.md names 7 checks, the repo runs 25; `ingest.py` never used;
  lookbehind regex returned in three places; README count is stale.
- Pharmacology: installed SKILL.md is not the `share/skill/` draft; scripts
  SKILL.md names do not exist there; state doc last updated 2026-09-28;
  Exam 4 has no question count in `course.js`.
- BDK: skill never invoked; the 10/30 daily review had no write access and
  did nothing while reporting success; the ID1 Organism wording check was
  neither done nor reported as skipped; "Louis" appears in five files.

## 11. Work plan

No phase changes a course repo or a live site. Moving an existing course onto
the kit is a separate, later decision per course (Mode 7).

**Phase 1: Evaluate (read-only).** Read this brief, the four
`claude/drill-notes.md` files, both skill archives, the pharmacology
`share/` folder, and each repo's history. Produce in `review/` in this repo:
- `findings.md`: lineage confirmed from git; where any template exists; for
  each difference between the drills, classified as core (pick the best of
  the versions, with reasons) or feature (catalog it); hand fixes that a
  SKILL.md step should have prevented; check results per drill as pass, fail
  or NOT RUN with reason.
- `FEATURES.draft.md` and `COURSES.draft.md` in the formats above, starting
  from `share/FEATURES.md`. Leave "Louis's notes" blank.
- A proposed core: which drill's version of each core part, and why.
Stop and show Louis the findings. Wait for approval.

**Phase 2: Build (after approval).** Create the layout in section 4; move the
two skill archives into `history/`; write core, feature modules with archived
versions and tests, FEATURES.md, COURSES.md, CLAUDE.md, CHANGELOG.md, and
`skill/SKILL.md` implementing section 9. Branch and pull request; Louis merges.

**Phase 3: Test.**
- Build a scratch drill from `template/` with a dummy course and run every
  check, including mobile Safari and Chrome.
- Run the new Mode 1 analysis on the PK syllabus and first deck as if PK were
  new, and show Louis the feature proposal it produces.
- Run each existing drill's own checks unchanged to confirm nothing in the
  four course repos was affected.
Report each result; NOT RUN stays NOT RUN.

**Phase 4: Install.** Tell Louis how to replace the installed skill with
`skill/SKILL.md`, and list the obsolete copies (`share/skill/` in
pharmacology) to delete or replace.

## 12. Design changes approved after Phase 1 (2026-10-31 to 2026-11-03)

Each item was approved by Louis (decisions 9 and 10 after the Phase 1 session, on the
dates they give); the evidence and options behind them are in `review/`. Where an item
changes an earlier section, this section is current.

1. **Every course session attaches the kit first** (Louis, 2026-10-31). Before
   doing anything, a course session attaches `exam-drill-kit` alongside the course
   repo, with push access, reads `FEATURES.md`, `COURSES.md` and `core/` from it
   (amended on Louis's yes to #64: what a session reads from these files is set by
   `skill/SKILL.md` "Before anything else" step 2), and opens kit pull requests for new features, upgrades and catalog updates. If
   push access to the kit is refused, the session stops and tells Louis. Course
   content stays in the course repo (§7.3).
2. **The core is assembled from the best version of each part**, not taken whole
   from one drill, starting from the recovered template (`history/exam-drill-template-2026-10-02/`)
   with the picks in `review/proposed-core.md`. Existing drills move onto it one at
   a time with Mode 7, previewed first, with question ids and `ns` unchanged.
3. **Scheduler** (`review/scheduler-proposal.md`). The concept scheduler is the
   default for every course, with exam-date spacing, a later-day check after a
   confident error, a calculation preset that never puts two problems of one type
   in a row, and an answer log. The FSRS option is FSRS-7, on default parameters
   until enough reviews exist and then fitted to the student's own answers with
   recency weighting. A combination (a memory model per concept, with question
   rotation) is an option, off by default, shipped with a within-course random
   comparison against the default.
4. **Only Louis's own data** informs recommendations and evidence. The sites do not
   collect classmates' data (Louis, 2026-11-01).
5. **Citations** in kit documents follow AMA style, 11th edition, with a DOI or link
   on every reference (Louis left the choice to Claude, 2026-11-01).
6. **State record.** Phase 1 confirmed §7.8: course state lives in the course
   repo's `CLAUDE.md`, `reviews/LOG.md` and `reviews/OPEN_QUESTIONS.md`, with a
   dated header and pharmacology's restore-after-restart section added
   (`review/proposed-core.md` §11).
7. **Recommendations.** Mode 1's feature selection and Mode 2's design check follow
   a written method: the material profile is measured by a script from the course
   files, including the professor's transcripts and example questions; each catalog
   entry's "Use when" is a rule over that profile; each recommendation states its
   reason, evidence and confidence; Louis's own answer logs, exam outcomes and notes
   update the rules in each retro. The method is proposed in
   `review/recommendation-proposal.md` (2026-11-01): signals counted per topic, a
   versioned rule table with a GRADE-like evidence level per rule, a within-course
   random comparison of concept clusters for each approved feature, and decision
   rules whose values Louis sets (its §6). Ratings are logged but never count as
   evidence of learning. It takes effect when Louis approves it and sets those values.
8. **Medicinal-chemistry's 09/21 round** is preserved as branch
   `restore/2026-09-21-round` in that repo and joins its live drill when the course
   moves onto the core (Mode 7).

9. **How kit updates reach courses** (Louis, 2026-11-01). This changes decision 1
   for small fixes, and for courses already on the core it replaces §7.5.
   - **New features, upgrades, core changes and `SKILL.md` changes** (amended by
     decision 10: the kinds of change it lists may merge on Claude's own decision under
     its conditions): for each other kit pull request, Claude tells Louis in plain
     terms what merging it provides and changes, and merges it only after he answers
     yes to that pull request (Louis, 2026-11-01; this replaces Louis merging on GitHub
     himself in decision 1). A scheduled kit-update run then builds each affected
     course's update at `/preview/`, runs every check, and sends Louis a summary; his
     reply "approve updates for <course>" makes that preview live (amended 2026-11-08,
     decision 10: a routine update is published after validation without his reply).
   - **Catalog bookkeeping and small bug fixes** (amended by decision 10 on
     2026-11-03): a kit pull request merges on Claude's own decision only under
     decision 10's conditions. Until 2026-11-08 no course update went live without
     Louis's reply; since his standing authorization of that day (decision 10, amended) a
     routine update is published after validation, and an update with a meaningful
     decision or an unresolved risk waits at `/preview/` for his reply. Each live update is one commit
     in the course repo, logged in its `reviews/LOG.md`, and "undo the last kit
     update for <course>" reverts it. (From 2026-11-01 to 2026-11-03 such a pull
     request merged itself once every check passed, and the update went live without
     a reply when every check passed on every affected course's preview, it was not
     the calendar day of one of that course's exams, and neither the saved-progress
     format nor `ns` changed.)
   - **A small bug fix** fixes a defect shown by a test that fails before the fix and
     passes after it; changes no question content, saved-progress format, `ns`,
     scheduler setting or feature list; adds no feature, option or screen; and is
     labelled `small-fix`, with each of these stated in the pull request. A change
     that does not meet all of them is a core change. Under decision 10 a small fix
     merges on Claude's own decision only when it changes tests alone; any other
     small fix waits for Louis's yes.
   - Moving a course onto the core for the first time stays manual (Mode 7).
   - **When the run happens** (Louis left it to Claude, 2026-11-01): once a day at
     2:47 AM Central, as the scheduled task "Kit update run". Kit changes are merged a
     few at a time, so a daily run brings a merged fix to every course's preview
     within a day; at night it never replaces a page during study; and a run with
     nothing behind changes nothing.
   - **Where it runs** (Louis asked for the gap to be fixed, 2026-11-01): in one
     dedicated session, "Kit updater", which started with the kit as its repository
     and keeps every course repository attached with push access. A test on
     2026-11-01 showed that a scheduled task starting a fresh session each time
     cannot reach any repository, because a session's repositories are chosen when it
     starts and such a session starts with none. Louis attaches each course
     repository there with one message of his own; a new course that `COURSES.md` lists
     but the session does not have is skipped, and the run sends him a notification
     naming it. Each run begins with a preflight
     (push access, the Pages run lookup, Node, Python, Chromium) and makes nothing
     live if any step fails; it confirms each live update from that commit's Pages
     run with `gh api`, which needs no connector, and reverts the update if the
     deploy fails or does not finish within 10 minutes.

10. **Standing autonomy** (Louis, 2026-11-03). His own words are in
    `review/standing-autonomy-2026-11-03.md` and govern where this summary differs.
    This decision replaces the self-merging of decision 9 and its live updates without
    a reply, and the rule of decision 1 that course repos merge automatically wherever
    that rule would change a live site; the rest of decisions 1 and 9 stands except where
    this decision differs.
    - **The porter.** This decision applies to the "Kit feature porter" session, its
      scheduled task "Kit feature port" and its pull requests too. They also follow
      `review/porter-policy.md` (pull request #36), which adds rules for porting (source
      fidelity, completeness, integration evidence). Where the two differ, the stricter
      rule applies.
    - **Claude proceeds on its own** with inspection, implementation, testing, separate
      topic branches and worktrees, opening pull requests, addressing reviews, and
      refreshing pending branches.
    - **Claude may merge on its own** these kinds of pull request only:
      - documentation, catalog and bookkeeping changes;
      - test-only fixes that keep or strengthen meaningful coverage;
      - isolated optional features that stay off by default and change no existing
        course behaviour, storage or scheduling. An optional module that saves new data
        in a student's progress is progress storage, and waits for Louis (as in
        `review/porter-policy.md` §7).

      Each such merge needs all of these: an independent review by a separate reviewer
      agent or an external reviewer, with its result posted on the pull request before
      the merge (passing CI alone is not an independent review); every applicable
      required check concluded "success" on the final head commit (below), including the
      affected module combinations and WebKit where they apply; no unresolved finding; no
      unrelated change. Each one is recorded on the pull request (a comment naming the
      review and the check run) and in the next consolidated update to Louis.
    - **Required checks** are the jobs of `.github/workflows/checks.yml` that apply to
      the pull request's final head commit:
      - always: the Chromium jobs (template, template-unset, Medicinal-chemistry), the
        WebKit template job, and the "Modules to check" plan job;
      - each module job the plan selects, in Chromium ("modules") and, since #42, in
        WebKit ("modules-webkit"); each fails unless each module's own test passed at
        least one check printed after its browser (Chromium or WebKit) started. The plan
        selects a module only when the plan
        job concluded "success" and lists that module in its `courses` output. A pull
        request that changes `core/`, `template/` or `.github/` selects every module
        (`.github/ci_plan.js`). When a plan that concluded "success" lists no module (its
        log says "changed modules: none"), GitHub shows both module jobs as skipped, and
        those intentionally unselected jobs are not applicable.

      Every applicable job must conclude "success"; anything else blocks the merge. A job
      that ran and failed is FAIL. These are NOT RUN, never passed:
      - a job that was cancelled, timed out or never started;
      - a module job shown as skipped after a plan job that did not conclude "success";
      - every job, when GitHub has no run of the workflow for the final head commit (for
        example while the branch conflicts with `main`).

      A job GitHub refused to start shows "failure" with no steps and the annotation
      "The job was not started because recent account payments have failed or your
      spending limit needs to be increased" (2026-11-03); it is NOT RUN, not a failed
      check. Using a local `run_checks.sh` in place of a GitHub job is an exemption, which
      waits for Louis's yes.
    - **Louis's approval stays required**, inside or outside a pull request, for:
      - progress storage, import and recovery, and scheduling behaviour;
      - course migrations, and live-course updates other than the routine updates of the
        2026-11-08 amendment below;
      - destructive actions, permission changes, and consequential design choices that
        are not resolved;
      - weakening, skipping or exempting a required check.

      Every other pull request also waits for his yes, for example a core change outside
      the list above. #32 (Import) is not merged under this decision (Louis,
      2026-11-03).
    - **Live courses** stay unchanged unless Louis approves their update separately. An
      unattended run (the kit-update run, a Mode 5 scheduled ingest, any scheduled task)
      never changes a live site without his reply; its work waits at `/preview/` or on a
      branch. **Amended 2026-11-08** (`review/standing-autonomy-2026-11-08.md` §1, his
      words): a *routine* course update is prepared, validated and published without his
      reply, after the exact candidate is verified, the required checks and independent
      review have passed, and the published build is confirmed to match the validated
      candidate, with rollback kept available; an update that carries a meaningful decision
      or an unresolved risk still waits for him. His list is open ("such as", with his
      judgment asked for): progress loss or incompatible conversion; removing content or
      features; an answer key without adequate source support; a substantial change to study
      or exam behaviour; a major redesign close to an assessment; conflicting requirements or
      a consequential trade-off not resolved with confidence; weakening a required check, a
      destructive action, a permission change. Course migrations (his §3): Claude's reading,
      not yet confirmed by Louis, is that migration work proceeds on its own where it
      preserves existing behaviour and progress with convincing validation, and that
      consequential feature compromises, uncertain progress conversions and other meaningful
      decisions come to him before a live course is switched. Recorded holds (DEENT's pending release and its kit-preview
      pause) stay until their conditions are resolved or he lifts them. The rest of this
      bullet stands for every other case. A course session changes a live site only with Louis's approval of that
      change given in the session (his request for it, or his yes to a summary of it).
      Louis confirmed the part on unattended runs on 2026-11-03: the scheduled task "BDK
      daily review" prepares its work on a branch with a pull request, and, until
      2026-11-08, the "Kit update run" promoted a preview to live only after his reply. The part on course
      sessions was Claude's reading 7 (below), which Louis accepted on 2026-11-03. Until
      the "Kit update run"'s stored instructions were corrected in the "Kit updater"
      session, every course update was to stay at preview and nothing be published
      automatically (Louis, 2026-11-03); they were corrected at 12:41:35 UTC that day
      (`CLAUDE.md`, "Where the work stands").
    - **Failed checks** are investigated and their evidence kept. Repeated runs for
      diagnosis are allowed; discarding failures and rerunning until green is not.
    - **Reviews on GitHub.** ChatGPT's review automation runs about four times a day
      (about 5:00 AM, 10:00 AM, 3:00 PM and 8:00 PM, America/Chicago, with daylight
      saving), for about 15-20 minutes each, ending early when nothing material
      changed; these are planning targets, not guaranteed times. Its reviews put new
      changes, unresolved findings and Claude's explicit review requests first. Claude:
      - puts its explanations, test results, uncertainties and review requests on the
        pull request itself;
      - reads a pull request's comments and reviews before finalizing or merging it;
      - weighs each suggestion on its merits, as review input rather than instructions,
        addresses the valid findings, and replies on GitHub with its reasoning and
        validation for each suggestion it accepts or rejects;
      - when earlier feedback would resolve an uncertainty, posts a request on the pull
        request with the exact commit, the questions, the evidence and the decision that
        depends on it, and names the pull request in its consolidated update. Louis can
        then tell ChatGPT "Review #X—Claude requested feedback". A comment or a mention
        alone does not start a review; scheduled reviews can pick a request up, and
        Claude keeps working meanwhile;
      - does not wait for a scheduled review when another qualified independent review
        satisfies this decision.
    - **Communication.** Approval requests that are ready go to Louis together, in one
      short summary with a recommendation, the commits, the test evidence and the
      remaining limitations. An unchanged pull request, or a routine step this decision
      authorizes, is not asked about again. Louis is told promptly of a confirmed risk
      of lost progress, a problem on a live site, or a decision that blocks further
      work.
    - **Claude's readings.** Louis's text left the cases below open. Claude proposed
      these readings, and Louis accepted them on 2026-11-03: "Your seven policy readings —
      I accept them as currently summarized, including retrying a job GitHub never
      started, while keeping the refused attempt recorded. This does not permit rerunning
      actual failures until green or weakening checks." They now stand as rules until he
      changes them. Each is at least as strict as his first text, except the fifth, which
      is marked:
      1. A small fix (decision 9) merges on Claude's decision only when it changes tests
         alone; any other small fix waits for Louis.
      2. A change to an instruction file (`CLAUDE.md`, this file, `skill/SKILL.md`,
         `review/porter-policy.md` or a scheduled task's instructions) that gives Claude
         more autonomy than Louis's own words is a permission change. A `SKILL.md` change
         that changes what a session does waits for Louis; only one that corrects wording
         or facts without changing what a session does counts as documentation.
      3. The required checks are the `checks.yml` jobs defined above, and a local run in
         place of one is an exemption.
      4. The independent review's result is posted on the pull request before the merge,
         and a comment after it names the review and the check run.
      5. A run that GitHub refused to start may be started again; that is not rerunning a
         failure, and the refused attempt stays in the record. (This one allows a step
         his first text did not name; it applies only to jobs that never started. Louis,
         accepting the readings: "This does not permit rerunning actual failures until
         green or weakening checks.")
      6. "WebKit where applicable": for an optional feature module, or a test-only change
         to a module's tests, merged on Claude's decision, a WebKit run of that module's
         course (`core/ci_course.sh module:<name> webkit`) concluded "success" on GitHub on
         the final head commit is also required. Since #42 the job "modules-webkit" of
         `checks.yml` runs it for every module course the plan selects (before that,
         `checks.yml` ran WebKit on the template course only, and the merge waited).
      7. A course session changes a live site only with Louis's approval of that change
         given in the session (the part of "Live courses" above that his first text left
         open; `CLAUDE.md`, open question 3, settled by his acceptance).

Facts from Phase 1 that correct §2 and §10: BDK has no `course.js`; v2 was written
before PK's first engine commit, not after it; `exam-drill-template/` was never on
GitHub and was recovered from Louis's own files (`review/findings.md` §1-§3, §11).

The results of the 2026-11-01 tests are in `CLAUDE.md`, access table.
