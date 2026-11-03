# exam-drill-kit: state for Claude

Read `KIT_DESIGN.md` first, in full; its section 12 lists the changes Louis approved
after Phase 1 and overrides earlier sections where they differ.

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
    WebKit and blocks a merge (#29); WebKit on the other courses and the Safari app on
    an iPhone or iPad: NOT RUN so far; the FSRS page contains BigInt syntax;
  - the stored instructions of the scheduled task "Kit update run" still say a
    bookkeeping or `small-fix` update goes live without Louis's reply (read 2026-11-03).
    They defer to `skill/SKILL.md` on `main`, which no longer allows it once #37
    merges; changing the stored text waits for Louis (decision 10: a scheduled task's
    instructions). It cannot fire now: no merged pull request is labelled `small-fix`,
    and Medicinal-chemistry's pin `ff7bd51` is behind core changes;
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
  requests #2, #3 and #4 and Louis's approval of its preview.
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
  CT (after its Exam 4). The "Kit feature port" task's instructions were updated on
  2026-11-03 at 04:45 UTC: they follow `review/porter-policy.md` and take Intro to
  Pharmacology's items 18-21 first (read with `get_trigger` on 2026-11-03).
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
  `review/assessments/`.
- **Kit pull requests merged 2026-11-02 to 2026-11-03 (UTC)** (merge commit, from the
  GitHub pull request list read 2026-11-03): #9 `2bbe395` (BDK move 1/32), #10 `ac5c644`
  (`render_test`), #12 `98e7b5b` (checks on GitHub), #27 `366caf6` (pages over HTTP;
  module courses), #28 `6432c36` (`home_test`), #31 `da6ea21` (style rule "given as"),
  #33 `7286854` (offline test: refused connections), #34 `c1efa19` (lecture ids), #35
  `e3433d2` (catalog wording), #29 `4e0fae4` (the WebKit job blocks a merge). The
  WebKit diagnosis and every run's log: branch `claude/elegant-ptolemy-pqxb8y-webkit-diag`,
  `review/webkit-offline/` (never merged). Open: #32 (Import, waiting for Louis), #36
  (the porter's policy, `review/porter-policy.md`), #37 (this policy record), the
  proposals #23 and #30, and the porter's draft ports.
- **GitHub Actions stopped starting jobs on 2026-11-03** between 04:13 UTC (run
  41576828141, the last that ran and passed) and 04:35 UTC (main's run 41579030257 for
  4e0fae4, the first refused). Every run since then (22 by 05:05 UTC) failed with no
  steps, with GitHub's message "The job was not started because recent account
  payments have failed or your spending limit needs to be increased" (check-run
  annotations). The kit repository was private, and GitHub's free amount for private
  repositories on GitHub Free is $12 a month, at $0.006 a minute on a standard Linux
  runner (GitHub Docs, "GitHub Actions billing", read 2026-11-03). The kit's own job time
  from 2026-11-01 to that stop: 2,021 minutes by exact time ($12.13), 2,376 with each job
  rounded up to a minute (Kit checks 2,105, WebKit offline diagnosis 271; from the
  Actions runs and jobs API, 122 runs and 631 jobs that ran); the account's total is not
  readable from a kit session. **Resolved:** Louis made the kit repository public on
  2026-11-03 (visibility read 05:36 UTC); standard GitHub-hosted runners are free for
  public repositories (same GitHub Docs page), and runs were starting again by 05:36 UTC
  (run 41584721586, created 05:34 UTC, was in progress).
  The refused runs stay in the record; a refused run that never started may be started
  again, which is not rerunning a failure.
- **Phase 3 (test) and Phase 4 (install): not started.**

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
    reviewer, its result posted on the pull request; passing CI alone is not one), every
    job of `checks.yml` concluded "success" on the final head commit (with the affected
    module combinations and WebKit where they apply; a job that did not run blocks the
    merge), no unresolved finding and no unrelated change. Record each one on the pull
    request and in the next consolidated update.
  - Everything else waits for Louis's yes, inside or outside a pull request, after a
    plain-terms summary of what it provides and changes: among them progress storage,
    import and recovery, scheduling; course migrations and live-course updates;
    destructive actions, permission changes, unresolved consequential design choices;
    weakening, skipping or exempting a required check. #32 (Import) waits for him.
  - Live courses stay unchanged unless Louis approves their update separately. An
    unattended run never changes a live site without his reply; the nightly kit-update
    run leaves every update at `/preview/`. A course session changes a live site only
    with his approval of that change in the session (open question 3).
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
| A kit pull request merging itself after required checks (§12.9; since 2026-11-03 decision 10 instead: Claude merges a listed kind of change after an independent review) | not used | — |
| Scheduled task that starts a fresh session each time (first "Kit update run", now deleted) | does not work for this: the fired session started with no repository, `gh` and `git` were refused, and it reported FAILED by push notification | 2026-11-01 |
| `gh api 'repos/<owner>/<repo>/actions/runs?head_sha=<sha>'` for Pages deploys | works through the session proxy without any connector, for repos attached to the session; `gh api …/pages/builds/latest` is refused by the proxy | 2026-11-01 |
| Session "Kit updater" (`session_01LVkWFDAbAtw7kDGwqd43Qg`, started with the kit as its repository) | kit fetch and push dry run work; Python, Node and Chromium work; `mcp__github__*` tools present; `add_repo` for a course repo from a seeded message was blocked by the permission system; after Louis's own message there, all four course repos were attached with push access, and fetch, `git push --dry-run` and `gh api …/actions/runs` worked in each (the session's stored sources list the kit and the four course repos) | 2026-11-01 |
| Scheduled task "Kit update run" (`trig_01QduqhookGDD8HxANEbLq4w`, daily 2:47 AM America/Chicago, fires into "Kit updater") | first run 2026-11-01 08:48 UTC ended "Nothing to update: the kit's main has no core yet" (correct: PR #1 merged at about 12:10 UTC), changed nothing and sent no notification; not yet checked whether a run after the container is replaced still has the repos | 2026-11-01 |
| Session "Kit feature porter" (`session_01LVkWFDVVDwgsL5WF7yWqcV`, started with the kit) and scheduled task "Kit feature port" (`trig_017nw2kiZvgqCKkgWcKuvA8V`, daily 12:45 AM America/Chicago) | setup test 2026-11-01: kit fetch and push dry run, a read-only clone of Pharmacokinetics, `mcp__github__create_pull_request`, Python, Node and Chromium all work; a real push and pull request not yet tried | 2026-11-01 |
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
   which course changes count as separately approved? Claude's reading, followed until
   Louis answers: an unattended run never changes a live site without his reply, and a
   course session changes a live site only with his approval of that change given in
   the session (his request for it, or his yes to a summary of it). Affected:
   - the course repos' own rules: Medicinal-chemistry's `CLAUDE.md` ("Merge it
     automatically always") and BDK's ("push to `main`");
   - the scheduled task "BDK daily review" (daily 5:45 AM America/Chicago, a fresh
     session each time), which pushes its fixes to BDK's `main`; Louis set it up on
     2026-10-27 and it is unchanged.

## Known issues in course drills found by the kit work

- BDK `regression` test: one intermittent failure in 4 runs on 2026-11-01 ("right
  answer graded wrong" on a pick-the-item penicillin question); cause not found; logged
  in BDK `reviews/LOG.md`.
- PK exam draw can put both wordings of a fact on one paper (`review/findings.md` §4).
- Regex lookbehind in PK, pharmacology and BDK (`review/findings.md` §6.5).
