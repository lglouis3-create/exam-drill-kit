# exam-drill-kit: state for Claude

Read `KIT_DESIGN.md` §3, §7 and §12 first, in full; §12 lists the changes Louis approved
after Phase 1 and overrides earlier sections where they differ. Read its other sections when
the task touches them: §1-§2 goal and first sources, §4 layout, §5-§6 entry formats, §8
capabilities (always for a release or a change to a check), §9 skill modes, §10 known findings, §11 work plan. Read the whole file for a
change to the design, a policy or an approval rule.

## Where the work stands (2026-11-01; additions to 2026-11-03)

- **Phase 1 (evaluate): done.** `review/` holds the findings, the proposed core, the
  scheduler proposal, the Phase 1 drafts of the catalog and registry, and research
  notes.
- **Phase 2 (build): merged to `main`** by pull request lglouis3-create/exam-drill-kit#1
  from branch `claude/elegant-ptolemy-pqxb8y` (Louis said yes on 2026-11-01). Done:
  `KIT_DESIGN.md` §12; skill archives moved to `history/`; the recovered template in
  `history/exam-drill-template-2026-10-02/`; `FEATURES.md`, `COURSES.md`, this file,
  `CHANGELOG.md`, `features/README.md`, a first draft of `skill/SKILL.md`; `core/` and
  `template/` from the recovered template with the picks in `review/proposed-core.md`
  (merged in `5014f27`); the approved scheduler changes (merged in `c4be612`); the
  `/preview/` build and the state-file check. On fresh scratch courses with each
  scheduler setting (`concept`, `fsrs`, `concept-fsrs` with `compare`, `preset:'calc'`),
  `run_checks.sh` gave 19 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no PDFs), 1 REPORT
  (`explain_check.js`). What is not in the core yet is listed in `core/README.md` "Not
  in core yet". Still to do:
  - fitting FSRS parameters to Louis's own answers (`review/scheduler-proposal.md`
    4.2.3; findings in `core/README.md`: `@open-spaced-repetition/binding` needs Node 24
    and this container has Node 22; `fsrs-browser` does not confirm FSRS-7);
  - WebKit: the GitHub job "WebKit · template" runs the template course's checks in
    WebKit and blocks a merge (#29), and since #42 the job "modules-webkit" runs each
    module course the plan selects in WebKit; Medicinal-chemistry in WebKit and the Safari
    app on an iPhone or iPad: NOT RUN so far; the FSRS page contains BigInt syntax;
  - (done 2026-11-03) the stored instructions of the scheduled task "Kit update run" no
    longer let any update go live without Louis's reply. An `update_trigger` from the
    main kit session was refused ("a routine's instructions (its prompt) can be changed
    only from the conversation or thread the routine posts into, and this is not that
    one"), so Louis pasted the message in `review/kit-update-run-message-2026-11-03.md`
    into the "Kit updater" session (`session_01LVkWFDAbAtw7kDGwqd43Qg`) at 12:41 UTC.
    That session updated the task; its stored instructions date from 12:41:35 UTC and
    equal the message's text exactly (2,937 characters; read with `get_trigger` and
    compared by the main kit session, 2026-11-03);
  - from `core/README.md` "Not in core yet": Intro-Pharmacology's exam-result page after
    a reload and its generator step; `coverage_check.py`, `step_check.js`,
    `sources_check.js`;
  - after Louis approves `review/recommendation-proposal.md` and sets its §6 values:
    `RULES.md` from its §4, rule names on the "Use when" lines of `FEATURES.md`, the
    experiment-file format, and `core/profile.py` (the material-profile script);
  - for §12.9 and decision 10: the kit workflow `checks.yml` runs the core checks on
    every pull request (kit pull request #12) and its WebKit job blocks a merge (#29,
    merged 2026-11-03 as 4e0fae4); no branch protection is set up, so GitHub does not
    enforce required checks, and kit sessions read the results before any merge.
  Each of these goes to `main` in its own pull request, with a plain-terms summary for
  Louis's yes or no.
- **Moving the courses onto the core** (Louis's order, 2026-11-01: Medicinal-chemistry,
  Pharmacokinetics, BDK, Intro to Pharmacology). Medicinal-chemistry: live on the core
  since 2026-11-01 (commit `d7331be` in its repo, kit pin `ff7bd51`), after kit pull
  requests #2, #3 and #4 and Louis's approval of its preview. The kit-update run moved
  its pin to `2bbe395` on 2026-11-02 (Medicinal-chemistry commit `e954e08`, deploy run
  41424293314), after Louis approved the preview in the "Kit updater" session ("Yrs do
  it"; Medicinal-chemistry `reviews/LOG.md`, 2026-11-02 09:54 UTC). It moved the pin to
  `e827671` on 2026-11-03 (Medicinal-chemistry commit `39edc49`, deploy run 41639659320,
  logged in `37c5daf`), after Louis's reply in that session at 12:48 UTC ("The preview
  appears to work correctly on my device. [...] Then approve of the updates and continue
  forward"); that update changed only checks and tests, not the page students use.
  **Superseded 2026-11-08** for Pharmacokinetics and Intro to Pharmacology: Louis decided
  that BDK, Basic-Pharmacokinetics- and Intro-Pharmacology- are all migrated onto the core
  (`review/standing-autonomy-2026-11-08.md` §3); the decisions below of 2026-11-01 to leave
  the two on their own engines are history, and BDK is no longer the only move.
  Read-only assessments (2026-11-01) of a move for the other three: Pharmacokinetics
  about 35 kit pull requests (a straight move broke start-up and lost most features),
  BDK about 33 (quizzes still on 11/17-11/19 and 11/30), Intro to Pharmacology about
  42 (its last exam Mon 11/2, 8:30-10:30 am CT). Louis's decision for Pharmacokinetics:
  no move now; its Tier 1 features are ported into the kit now and its Tier 2 features
  one per night (`review/port-queue.md`, scheduled task "Kit feature port"). Tier 1
  (feature modules, `formulas-in-text`, fair number grading via `course.js` `numeric`,
  calculations on exam papers via `exams[].typed`, `chained-problem-sets`,
  `equation-drill`, `wrong-number-diagnosis`) merged in kit pull request #6 (`dedd0dd`,
  Louis's yes on 2026-11-01); no course switches any of it on yet, and Tier 2 ports
  start with the porter's next nightly run. Start-up safety fix merged in #5. Louis
  approved on 2026-11-01 adding BDK's and Intro to Pharmacology's features after
  Pharmacokinetics' Tier 2 (`review/port-queue.md` items 11-21, merged in #6); no work on Intro to Pharmacology's files before 2026-11-02 11:00
  CT (after its Exam 4). The "Kit feature port" task's instructions were updated from
  the "Kit feature porter" session on 2026-11-03 (the version stored now is from 06:30:42
  UTC, read with `get_trigger` the same day): they follow `review/porter-policy.md` and
  take Intro to Pharmacology's items 18-21 first.
  Louis's decision on 2026-11-01 ("Lets do what you recommend that will result in the
  least mistakes", after Claude recommended option B of the Intro to Pharmacology
  assessment): Intro to Pharmacology is not moved; its site stays as it is and its
  features are ported into the kit from its code (port queue items 18-21, not before
  2026-11-02 11:00 CT). BDK, Louis's decision later the same day when approving this
  record: "BDK can be moved already since thats a good month away". The BDK move starts
  now: about 33 kit pull requests by its assessment (K1, the feature switches, already
  merged in #6) plus the course work on a BDK branch shown at `/BDK/preview/`. The live
  BDK site does not change until Louis approves the preview. Its remaining quizzes are
  Week 14 (Tue-Thu 11/17-11/19, pages 5 and 9) and the Cumulative (Mon 11/30, all
  pages) (BDK `assets/app.js` `QUIZZES`, `c2f87ae`); no switch happens on those days,
  and the assessment judged the whole move unlikely to finish before 11/17. With
  Pharmacokinetics held and Intro to Pharmacology staying as it is, BDK is the only
  course move in progress. The plan, the pre-move decisions and the order of its pull
  requests: `review/bdk-move-plan.md`; the three move assessments are kept in
  `review/assessments/`. Since 2026-11-08 BDK's study features (port queue 11-17, move plan
  F1-F8 and F14-F16; F9-F13, F17 and F18 stay with the move) are planned as kit modules any course can switch on, built once by the kit feature
  porter, in four parts each started only on Louis's yes (`review/bdk-study-features-plan.md`);
  the move switches the built modules on for BDK.
- **Kit pull requests merged 2026-11-02 to 2026-11-03 (UTC)** (merge commit, from the
  GitHub pull request list read 2026-11-03): #9 `2bbe395` (BDK move 1/32), #10 `ac5c644`
  (`render_test`), #12 `98e7b5b` (checks on GitHub), #27 `366caf6` (pages over HTTP;
  module courses), #28 `6432c36` (`home_test`), #31 `da6ea21` (style rule "given as"),
  #33 `7286854` (offline test: refused connections), #34 `c1efa19` (lecture ids), #35
  `e3433d2` (catalog wording), #29 `4e0fae4` (the WebKit job blocks a merge), #36
  `8b5ffdb` (the porter's policy; merged by the porter session under its §7 at 06:35
  UTC), #38 `9f2940b` (`test.js` section 7; merged by the main kit session under Louis's
  standing policy and his go-ahead for that fix at 06:35 UTC, at 06:54 UTC), #37 `494e6d5`
  (the policy record, decision 10; merged on Louis's yes to it), #40 `751251a` (`test.js`
  section 7, 20 trials; merged by the main kit session under decision 10), #41
  `e827671` (bookkeeping), #39 `34ebc6c` (the waiting save written when a page is hidden
  or closed; merged on Louis's approval of 2026-11-03 at its reviewed commit `1a0a1ee`;
  a test in the Safari app on a real iPhone and iPad is still outstanding). The WebKit
  diagnosis and every run's log: branch `claude/elegant-ptolemy-pqxb8y-webkit-diag`,
  `review/webkit-offline/` (never merged). Open: #32 (Import; Louis keeps it unmerged
  after ChatGPT's review of 7dbc054 found three defects; fixes in review), #42 (module
  courses in WebKit; waits for Louis), the proposals #23 and #30, and the porter's draft
  ports (#11, #13-#22, #24-#26).
- **GitHub Actions stopped starting jobs on 2026-11-03** between 04:13 UTC (run
  41576828141, the last that ran and passed) and 04:35 UTC (main's run 41579030257 for
  4e0fae4, the first refused). Every run created since then (22 by 05:05 UTC) failed
  with no steps on its first attempt (three of them, 41580289929, 41581178372 and
  41581740260, were started again at 05:43 UTC and passed on attempt 2), with GitHub's
  message "The job was not started because recent account
  payments have failed or your spending limit needs to be increased" (check-run
  annotations). The kit repository was private, and GitHub's free amount for private
  repositories on GitHub Free is $12 a month, at $0.006 a minute on a standard Linux
  runner (GitHub Docs. GitHub Actions billing. Accessed November 3, 2026.
  https://docs.github.com/en/billing/concepts/product-billing/github-actions). The kit's
  own job time from 2026-11-01 to that stop: 2,021 minutes by exact time ($12.13), 2,376
  with each job rounded up to a minute (Kit checks 2,105, WebKit offline diagnosis 271;
  from the Actions runs and jobs API: 103 runs created, 95 "Kit checks" and 8 "WebKit
  offline diagnosis", the first on 2026-11-02, and 631 jobs that ran); the account's
  total is not readable from a kit session. **Resolved:** Louis made the kit repository
  public on 2026-11-03 (visibility read 05:36 UTC); standard GitHub-hosted runners are
  free for public repositories (same GitHub Docs page), and runs were starting again by
  05:36 UTC (run 41584721586, created 05:34 UTC, was in progress). The refused runs stay
  in the record; when one may be started again is Claude's reading 5 in decision 10.
- **Phase 3 (test) and Phase 4 (install): not started.**

## Coordinator and dashboard (2026-11-06)

- `coordinator/` holds the improvement coordinator's records (courses with their full exam
  schedules and release statuses, review checkpoints, the improvement registry, the
  automations) and `coord.js`; `coordinator/README.md` explains them and `coordinator/RUN.md`
  is a run's procedure.
- **"Show my Exam Drill Dashboard"**: follow `.claude/skills/exam-drill-dashboard/SKILL.md`
  (it runs `node coordinator/coord.js dashboard`).
- The scheduled task "Kit coordinator daily" is proposed, not configured; until it is,
  a run happens only when asked ("run the coordinator"). A run records improvements and
  prepares none; preparing them and automatic retrospectives are a separate proposal.
- **Kit-update previews paused for DEENT** (Louis, 2026-11-06; `coordinator/courses.json`
  `kitUpdate`, `node coordinator/coord.js kitupdate`): the nightly run keeps DEENT's
  read-only checks and reports the pause; its working branch and preview stay untouched.
  The pause is lifted only as its `liftWhen` says.

## Rules for kit sessions

- **Standing autonomy** (Louis, 2026-11-03). His own words are in
  `review/standing-autonomy-2026-11-03.md` and govern; `KIT_DESIGN.md` §12 decision 10
  summarises them and replaces the self-merging of §12.9. In short:
  - Claude proceeds on its own with inspection, implementation, testing, separate topic
    branches and worktrees, opening pull requests, addressing reviews, and refreshing
    pending branches.
  - Claude may merge on its own only documentation, catalog and bookkeeping changes;
    test-only fixes that keep or strengthen meaningful coverage; and isolated optional
    features that stay off by default and change no existing course behaviour, storage
    or scheduling (a module that saves new data in a student's progress is progress
    storage). Each needs an independent review (a separate reviewer agent or an external
    reviewer, its result posted on the pull request before the merge; passing CI alone is
    not one), every applicable required check concluded "success" on the final head
    commit, no unresolved finding and no unrelated change. Applicable: the Chromium jobs
    (template, template-unset, Medicinal-chemistry), the WebKit template job, the plan
    job, and each module job the plan selects; a module job a successful plan
    intentionally did not select is not applicable. Any other
    conclusion of an applicable job, or no run for the final head commit, blocks the
    merge (FAIL if it ran and failed; NOT RUN if it was cancelled, timed out or never
    started); the full definition and Claude's readings (WebKit for a module, among
    them) are in decision 10. Record each merge on the pull request and in the next
    consolidated update.
  - The porter session, its scheduled task and its pull requests follow decision 10 as
    well as `review/porter-policy.md` (#36), which adds rules for porting; where the two
    differ, the stricter rule applies.
  - Everything else waits for Louis's yes, inside or outside a pull request, after a
    plain-terms summary of what it provides and changes: among them progress storage,
    import and recovery, scheduling; course migrations and live-course updates;
    destructive actions, permission changes, unresolved consequential design choices;
    weakening, skipping or exempting a required check. #32 (Import) is never merged
    under this authority; Louis keeps it unmerged (2026-11-03: after ChatGPT's review of
    7dbc054 found three defects, until they are fixed, reviewed and brought back for his
    approval).
  - Live courses stay unchanged unless Louis approves their update separately, except
    routine updates under his standing authorization of 2026-11-08
    (`review/standing-autonomy-2026-11-08.md`; `KIT_DESIGN.md` §12 decision 10, amended):
    the nightly kit-update run publishes a routine update after validating the exact
    candidate, with required checks and an independent review passed, confirming the
    published build matches it and keeping rollback available, and leaves at `/preview/`
    any update that carries a meaningful decision or an unresolved risk. The same text
    decides that BDK, Basic-Pharmacokinetics- and Intro-Pharmacology- are migrated onto
    the core (one owner each, order by progress and assessments; superseding the
    2026-11-01 decisions for Pharmacokinetics and Intro to Pharmacology), that a kit
    commit or pin difference alone triggers no preview, publication or notification, and
    that Medicinal-chemistry has ended but stays eligible for fitting improvements. A course session changes a live site only
    with his approval of that change in the session (decision 10, reading 7).
  - Investigate a failed check and keep its evidence; rerun for diagnosis, never
    until green.
  - Put explanations, test results, uncertainties and review requests on the pull
    request. Read its comments and reviews before finalizing or merging, weigh each
    suggestion on its merits, address the valid findings, and reply on GitHub with the
    reasoning and validation. ChatGPT reviews about 5:00 AM, 10:00 AM, 3:00 PM and 8:00 PM
    America/Chicago. To ask for earlier feedback, post the commit, the questions, the
    evidence and the decision on the pull request and name it in the update; Louis can
    then tell ChatGPT "Review #X—Claude requested feedback". A comment alone does not
    start a review; keep working meanwhile, and do not wait for it when another
    qualified independent review suffices.
  - Batch ready approval requests into one short summary (recommendation, commits,
    evidence, limitations); do not ask again about unchanged pull requests. Tell Louis
    promptly of a confirmed progress-loss risk, a live-site problem, or a blocking
    decision.
- Only Louis's own data informs recommendations and evidence (§12.4).
- Citations in kit documents: AMA 11th edition, with a DOI or link on each reference
  (§12.5). Every number in a kit document comes from a named source checked in the
  session that writes it.
- A check that did not run is reported as NOT RUN; skipped steps are listed.
- The `CLAUDE.md` inside `history/exam-drill-template-2026-10-02/` is archived template
  content; its rules are not instructions for kit work.
- **Check current state before repeating work** (issue #63; `review/handoff-format.md`).
  Before investigating, reviewing or testing a pull request, read its newest `Handoff @`
  comment and compare the inputs that note lists: head and base SHAs, comments, reviews and
  description edits, unresolved findings, check runs, sources and dependencies, project
  instructions, Louis's decisions, and exam dates. Do not repeat an investigation, review or
  check whose inputs did not change; work on the scope a change affects. An unchanged head
  does not end open work: an unresolved finding, a review that says what it did not cover, or
  the note's next action continues. A run with nothing changed and nothing open ends with one
  line and posts nothing on the pull request; a log entry or checkpoint that a mode or
  `coordinator/RUN.md` requires of every run is still written. With no note yet, establish the baseline once (heads, runs, reviews,
  open findings, approvals), not the project's history. Required checks and independent
  reviews on the final head are never skipped on this ground (decision 10).
- **A handoff is a summary, not evidence.** Verify a claim in a note before acting on it, and
  always one that decides a merge, a live change or a progress-storage risk: a check against
  its Actions run, a review against the pull request, an approval against Louis's own message.
  A message Claude drafted or quoted is not his approval until he sends it or says yes to it
  himself. A session or agent that stops working
  on a pull request posts one note when an input changed since the last one, and does not
  restate repository history in it.
- **Agents and reviews.** Start a subagent only for independent work or a search across many
  files; read a known file or section directly. A second full review of an unchanged,
  already-reviewed scope is not started. An additional independent review, focused on its
  reason, is started for an unresolved consequential defect, new evidence, coverage an earlier
  review did not reach, a high-risk change (progress storage, import or recovery, scheduling, a
  live course), or Louis's request. For a merge or a routine course publication under
  decision 10, the independent reviews posted must together cover the whole diff of the
  final head (for a publication, the exact candidate against the live commit) against the
  current base; a
  review of a delta counts only with an earlier review of its parent head, and a base change
  since that review is reviewed as its own delta. Run agents in parallel only for items that
  share no branch, worktree or module. The coordinator's own checkpoints
  (`coordinator/state.json`, `coordinator/RUN.md`) are its baseline for course reviews, and
  the porter's feedback checkpoint (`porter/feedback-checkpoint`, `review/porter-policy.md`
  §11) is its baseline; where one of them and a handoff note differ, the stricter reading
  applies.

## Access confirmed

| What | Result | When |
|---|---|---|
| Read the four course repos (public; served by the git proxy without attaching) | works | 2026-10-31 |
| Push to `lglouis3-create/BDK` (attached with push access) | works; pushed to `main` | 2026-11-01 |
| Push to `lglouis3-create/Medicinal-chemistry` (attached with push access) | works; pushed branch `restore/2026-09-21-round` | 2026-11-01 |
| Read GitHub Actions runs of an attached repo | works (BDK) | 2026-11-01 |
| Google Drive: search, metadata, download | works | 2026-11-01 |
| Claude Projects | not reachable from a cloud session | 2026-10-31 |
| Create a new repository (Mode 1, decision 8) | not tested yet | — |
| A kit pull request merging itself after required checks (§12.9; since 2026-11-03 decision 10 instead: Claude merges a listed kind of change after an independent review) | used: #36 (by the porter session, after its third independent review) and #38 (by the main kit session, after an independent review and run 41591399415) | 2026-11-03 |
| Scheduled task that starts a fresh session each time (first "Kit update run", now deleted) | does not work for this: the fired session started with no repository, `gh` and `git` were refused, and it reported FAILED by push notification | 2026-11-01 |
| `gh api 'repos/<owner>/<repo>/actions/runs?head_sha=<sha>'` for Pages deploys | works through the session proxy without any connector, for repos attached to the session; `gh api …/pages/builds/latest` is refused by the proxy | 2026-11-01 |
| Session "Kit updater" (`session_01LVkWFDAbAtw7kDGwqd43Qg`, started with the kit as its repository) | kit fetch and push dry run work; Python, Node and Chromium work; `mcp__github__*` tools present; `add_repo` for a course repo from a seeded message was blocked by the permission system; after Louis's own message there, all four course repos were attached with push access, and fetch, `git push --dry-run` and `gh api …/actions/runs` worked in each (the session's stored sources list the kit and the four course repos) | 2026-11-01 |
| Scheduled task "Kit update run" (`trig_01QduqhookGDD8HxANEbLq4w`, daily 2:47 AM America/Chicago, fires into "Kit updater") | first run 2026-11-01 08:48 UTC ended "Nothing to update: the kit's main has no core yet" (correct: PR #1 merged at about 12:10 UTC), changed nothing and sent no notification; not yet checked whether a run after the container is replaced still has the repos | 2026-11-01 |
| Session "Kit feature porter" (`session_01LVkWFDVVDwgsL5WF7yWqcV`, started with the kit) and scheduled task "Kit feature port" (`trig_017nw2kiZvgqCKkgWcKuvA8V`, daily 12:45 AM America/Chicago) | setup test 2026-11-01: kit fetch and push dry run, a read-only clone of Pharmacokinetics, `mcp__github__create_pull_request`, Python, Node and Chromium all work; since then the porter has pushed `port/*` branches, opened the draft ports #11, #13-#22 and #24-#26 and #36, and merged #36 (GitHub's pull request list, read 2026-11-03) | 2026-11-01; 2026-11-03 |
| WebKit / Safari browser engine | not installed in the cloud container; Chromium only (GitHub's runners run WebKit: kit job "WebKit · template") | 2026-10-31; 2026-11-03 |

## Open questions for Louis

1. Open since Phase 1 (`review/findings.md` §9): MC's corrected notes `3b87e8a` into
   MC's `main` (4); one source order when sources conflict (6); BDK's MedlinePlus
   glossary links against decision 3 (7); personal names in state files against §7.9
   (8); agent definitions in `core/agents/` (9); PK's cross-pool `dupOf` defect, which
   matters only if PK's drill is reused (10); searching `Heb-pharmacy-guide` (11).
2. `review/recommendation-proposal.md` (written 2026-11-01) waits for Louis's approval
   and the nine answers in its §6. `skill/SKILL.md` already describes the method and
   says that its in-course comparison starts nowhere until then.
3. "Keep live courses unchanged unless I separately approve their updates" (2026-11-03):
   which course changes count as separately approved? Settled on 2026-11-03. Louis
   settled the unattended runs: they never change a live site without his reply. He then
   accepted Claude's reading for course sessions (`KIT_DESIGN.md` §12 decision 10,
   reading 7): a course session changes a live site only with his approval of that
   change given in the session (his request for it, or his yes to a summary of it), also
   where the course repo's own rule says to merge or push automatically
   (Medicinal-chemistry's `CLAUDE.md`: "Merge it automatically always"; BDK's: "push to
   `main`"). Until the "Kit update run"'s stored instructions were corrected in the "Kit
   updater" session, every course update was to stay at preview (Louis, 2026-11-03);
   they were corrected at 12:41:35 UTC that day (above). Done on 2026-11-03 at Louis's instruction: the scheduled
   task "BDK daily review" (daily 5:45 AM America/Chicago, a fresh session each time) now
   prepares its fixes and log entry on a branch `daily-review/<date>` with a pull request
   for Louis, and never pushes to BDK's `main` (its stored instructions, updated from the
   main kit session).

## Tracked limits of the core

- **4,000 answers per profile** (the literal `4000` in `record()`, `core/shell.html:1210` on
  `main`; `ANSWERS_MAX` on #32's branch): past it, a profile's list no longer shows where it
  began; with #32, a round trip of a file between two devices then makes a new profile instead
  of a replace (#32, design choice 4). Louis asked on 2026-11-03 to track it.
  `review/storage-usage-proposal.md` §4 recommends a Settings count now and the origin-chain
  change once any of his profiles passes 2,000 answers; his current counts are not known in
  this session.
- **Storage per site:** every drill shares lglouis3-create.github.io's localStorage
  (5,242,873 characters measured in Chromium; MDN: up to 5 MiB per origin). One profile at
  both caps takes 2,271,973 characters; a preview's copy of it as much again; and a refused
  history write on `main` deletes the oldest half of the history with no notice
  (`review/storage-usage-proposal.md` §1-2). The display, the warning and the history change
  there wait for Louis's approval.

## Known issues in course drills found by the kit work

- BDK `regression` test: one intermittent failure in 4 runs on 2026-11-01 ("right
  answer graded wrong" on a pick-the-item penicillin question); cause not found; logged
  in BDK `reviews/LOG.md`.
- PK exam draw can put both wordings of a fact on one paper (`review/findings.md` §4).
- Regex lookbehind in PK, pharmacology and BDK (`review/findings.md` §6.5).
