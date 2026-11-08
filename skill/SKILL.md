---
name: exam-drill-builder
description: "Build, extend and improve an exam drill site for one of Louis's courses from its own material (decks, transcripts, the professor's questions, Drive and Goodnotes files), using the shared exam-drill-kit: set up a course, add material, prepare an exam build, review the bank, schedule ingest or review, run a retro, update a drill to the latest kit, or record an exam outcome."
---

# Exam drill builder

A drill is a study site for one course on GitHub Pages: questions with explanations,
slide figures, a scheduler, an exam simulator, weak-spot analytics, reference and
tell-apart tables, guides, exports. Two repositories are involved in every session:

- **`lglouis3-create/exam-drill-kit`** holds what every course shares: the core engine
  and its checks (`core/`), the new-course skeleton (`template/`), the feature modules
  (`features/`), the feature catalog (`FEATURES.md`), the course registry (`COURSES.md`)
  and the design record (`KIT_DESIGN.md`).
- **The course repo** holds that course's content (questions, pages, figures, `STYLE.md`),
  its `course.js`, and its state (`CLAUDE.md`, `reviews/LOG.md`, `reviews/OPEN_QUESTIONS.md`).

Reusable logic goes to the kit; one course's data stays in its repo.

## Before anything else, in every mode

1. **Attach `exam-drill-kit` with push access**, alongside the course repo (`add_repo`
   with access "push"). A read-only copy cannot open pull requests. If push access to
   the kit is refused, stop and tell Louis; do not continue without the kit.
2. **Read from the kit:** in every mode, `KIT_DESIGN.md` §7 and §12 (the standing
   principles and the approved design changes) and the `COURSES.md` entry of the course
   the mode names (`COURSES.md` in full in Modes 1 and 6). Mode 9 reads §7 and §12 and,
   in place of one course's entry, what `coordinator/RUN.md` names; a coordinator step
   that performs another mode also reads that mode's list (a retrospective is Mode 6; a
   course-specific improvement is Mode 2's design check; a core or skill change also reads
   what `CLAUDE.md` line 3 requires for a design or policy change). Then, by task:
   - `FEATURES.md` in full in Modes 1, 2 (design check) and 6, where features are chosen
     or compared, together with any registry this file says to read beside it; in other
     modes, the entries of the features the course's `course.js` switches on and of any
     feature the task names, and a search of `FEATURES.md` before any proposal names a
     feature (§7.2); in Mode 7, also the `FEATURES.md` entries added or changed since the
     course's kit pin.
   - `core/README.md`: its section list (`grep -n '^## ' core/README.md`) and each section
     the task touches. Read "Storage", "Start-up and the saved progress", "Offline", "A
     newer version, and the place after a reload" and "Answer history and the Home Screen
     card" in full for any change to `core/` code, to `ns`, question ids or `files`, or
     that touches progress storage, import, recovery, caches or history; and "The
     scheduler" for any scheduling change. Mode 1, and moving a course onto the core,
     read the whole file.
   - Mode 7: the `CHANGELOG.md` entries since the course's kit pin, `git log --stat
     <pin>..origin/main -- core/ features/ template/`, the `core/README.md` sections they
     concern, and, whenever the update brings in any file of `core/`, the storage sections
     listed above in full before deciding whether the update is routine.
   - Mode 7, and moving a course onto the core, also read
     `review/standing-autonomy-2026-11-08.md` in full (his words govern routine
     publication and migrations).
   - Before repeating an investigation, review or check, read the newest handoff note on
     the pull request concerned and compare the inputs it lists (`review/handoff-format.md`):
     not only the head, also the base, comments, runs, sources, instructions and Louis's
     decisions. A note is a summary; verify what decides a merge or a live change.
3. **Read from the course repo:** `CLAUDE.md`, the last 7 entries of `reviews/LOG.md`,
   and `reviews/OPEN_QUESTIONS.md`.
4. **Look before asking.** Check the course's Google Drive folder and, when the session
   can open it, the course's Claude Project. If the Project cannot be opened, say so in
   the report; never treat a file you could not reach as missing.
5. A mode acts only on the course it names; it never assumes the last course worked on.

## Modes and the phrases that start them

| phrase | mode |
|---|---|
| "set up a drill for <course>" | 1 New course |
| "ingest lecture <N>" / "add lecture <N> to <course>" | 2 Add material |
| "exam build for <course> exam <N>" | 3 Exam build |
| "review the <course> bank" | 4 Bank review |
| "set up nightly ingest for <course>" / "set up a daily review for <course>" / "stop …" | 5 Scheduled ingest or review |
| "retro the drill skill against <course>" | 6 Retro |
| "update the <course> drill to the latest kit" | 7 Update a drill |
| "approve updates for <course>" | 7 Update a drill (make a preview live that waits for Louis's decision) |
| "undo the last kit update for <course>" | 7 Update a drill (revert it) |
| "exam <N> outcome for <course>" | 8 Exam outcome |
| "Show my Exam Drill Dashboard" / "run the coordinator" | 9 Coordinator and dashboard |

If the request names no mode, ask which one in one line.

## The course manifest (`course.js`)

Everything specific to the course; the engine and every check read it.

```
COURSE = {id, title, short, ns, output, professors:[…],
  lectures:[{id, deck, decks?, label, prof, exam, module, moduleLabel?}],
  exams:[{id, name, scope, date, when, questions | null, minutes, sata?, blurb, facts?,
          pools:[{key, name, marks | null, filter:{exam:N} | {prof:'X', tier:'new'} | {lecture:[…]} | {module:N}}]}],
  activeExam, skills:[{id, label, short}], paceDefault:'cram'|'weekly'|'semester',
  scheduler:{model:'concept' | 'fsrs' | 'concept-fsrs', compare?:true, preset?:'calc'},
  numeric?:{margin?}, exams[].typed?:true,
  files:['atlas.js', 'diagrams.js', 'q1_topics.js', 'q2_<lecture>.js', …],
  oldCachePrefix?, manifest?:{description?, orientation?, short_name?},
  share?:{title?, description?, url?, image?},
  tools?:{citeAliases?, citeLectures?, citeBareMap?, explainTerms?, harvestMasks?},
  features:{<name>:{version, ...options}},
  kit:{core:'<kit commit or tag>'}}
```

- `ns` and every question id never change, in a redesign or a core update, so progress
  carries across exams and updates (§7.4).
- `kit.core` and each `features.<name>.version` pin the course; nothing changes them
  except Mode 7 (§7.5).
- `questions: null` means the count is not announced: the Exam tab then draws no
  practice paper and says the number of questions is not set, and Topics and Weak
  spots leave the count out. `marks: null` on any pool makes the whole exam
  unweighted, even when other pools have marks: a paper (with a count) is drawn from
  all the pools together, every list is ordered by accuracy, and no marks figure or
  exam-weighted pass is shown. `minutes: null` with a count set makes the paper
  untimed: no countdown, the time taken is shown and reported, and the paper ends
  only when it is submitted; no time limit is made up. A paper keeps the timing it
  started with, so one in progress stays untimed if a time limit is added later
  (`core/nullexam.js`, `core/views.js`;
  `core/README.md` "Exam draw").
- `share` gives the link preview a shared address shows (title, description, the
  site's `https://…/` address and a PNG from `src/icons/`); without it the page is
  unchanged. `manifest.short_name` names the Home Screen icon; the page keeps `short`
  (`core/README.md` "What the build writes").
- `files` lists the data files in build order; every new question file goes there. A
  core update replaces `build.py`, never `course.js`, so the list is kept
  (`core/README.md` "The course's files").
- `tools` holds the course's tables for `cite_check.py` (deck spellings it cannot
  derive), `explain_check.js` (the terms the course leans on) and `harvest_mask.py`
  (question crops that print their own answer), kept here for the same reason
  (`core/README.md` "Course tables").

## Questions

The question schema is in `template/README.md` (each course's `src/README.md`); the
essentials:

- Content comes only from the course: slides, transcripts, the professor's polls,
  practice sets and review material, and Louis's own material (decision 3). A fact
  that cannot be pointed to on a slide or in a transcript is left out and reported.
- Every option has a `why`; a wrong option names the misunderstanding behind it;
  `teach` explains the concept, not the answer again.
- `concept` groups wordings of one idea; `dupOf` keeps two wordings of one fact off one
  paper; the professor's own items go in verbatim under `sub:'verbatim'`.
- Source order when sources disagree: follow the order recorded in the course's
  `CLAUDE.md`; state both sources in `note`. (Louis has not yet set one order for all
  courses; the kit's `CLAUDE.md` lists it as open.)
- No metaphors, no study advice, no sentence about the drill itself; personal names and
  personal mnemonics stay out of a shared build unless Louis asks (§7.9).
- A figure never carries its own answer, including in an `aria-label`.

## Recommending features (Mode 1 step 3, Mode 2 design check)

The method is `review/recommendation-proposal.md` in the kit (2026-11-01). Until Louis
approves it and sets the values in its §6, steps 1 to 3 run as written, and steps 4
and 5 start in no course; say so in the recommendation.

1. **Measure the material** with `core/profile.py` (not built yet; until it exists this
   step is NOT RUN, so recommend from the material read and the `FEATURES.md` "Use when"
   lines and say that no profile was measured) from the course files: the syllabus
   (exam dates, formats, weights), the decks, the transcripts (exam cues, emphasis,
   exclusions, the formats the professor names), the professor's polls, practice and
   example questions, and the readings. It counts the signals in the proposal's §3 for
   each topic and writes `reviews/profile.json` with a hash of the input files and the
   script version, so the same files always give the same profile.
2. **Match** the profile against the rule table (the proposal's §4; `RULES.md` once
   approved). Each `FEATURES.md` entry's "Use when" line names its rule. A rule applies
   when its signal is present in a topic. Each recommendation states:
   - the rule and its version, and the signal counts and topics that made it apply;
   - the literature evidence level (High, Moderate, Low, Very low) and the sources;
   - Louis's personal label for the rule, with clusters per arm and the posterior
     interval, or "no data yet";
   - Louis's rating of the feature, if any, marked as a rating; a rating never sets
     the label.
   The professor's exam cues (signal T1) add practice to cued topics only after that
   professor's cue validity (V1) has been measured on a scored exam; uncued topics are
   never dropped. Before proposing a new feature, search `FEATURES.md` and propose an
   upgrade to a close match instead of a near copy (§7.2).
3. **Louis approves** before anything is built (decision 7). A declined proposal is
   recorded in `COURSES.md` with his reason and is not proposed again without new
   evidence.
4. **Test an approved feature** against the current default inside the course. Before
   any studying, group the eligible concepts into clusters, stratify by topic and
   difficulty, assign whole clusters at random to the feature or the default, and write
   the assignment, outcome, analysis, the two priors and the smallest difference the
   clusters can detect to `reviews/experiments/<feature>.json`. Only exam items mapped
   to concepts before the exam count. Never use bandit or other adaptive assignment to
   decide between features.
5. **Update from results** in each retro (Mode 6) and exam outcome (Mode 8): run the
   randomization test and the Bayesian estimate under both recorded priors, set the
   personal label (Supports, No meaningful difference, Against, Inconclusive) by the
   proposal's §5.5 with Louis's *w* and *R*, and update V1 and V2 for the professor.
   Proposed rule changes go to the course's `reviews/OPEN_QUESTIONS.md` and to the kit
   by pull request. Only Louis's own data is used (§12.4). How often a feature is used
   never counts as evidence that it helps.

## Kit pull requests

Open one whenever a session:
- builds a feature another course could use (the module in `features/<name>/current/`,
  its test, and its `FEATURES.md` entry);
- upgrades a feature (the old version moves to `archive/vN/` unchanged; decision 4);
- fixes or improves a core part (with the failing case shown before the fix);
- adds evidence or a "Used by" line to `FEATURES.md`, or updates `COURSES.md`.

Which kit pull requests Claude may merge on its own, and which wait for Louis, is
decision 10 of `KIT_DESIGN.md` §12 (Louis, 2026-11-03). In short:
- **Claude may merge on its own** documentation, catalog and bookkeeping changes;
  test-only fixes that keep or strengthen meaningful coverage; and isolated optional
  features that stay off by default and change no existing course behaviour, storage
  or scheduling (a module that saves new data in a student's progress is progress
  storage). Each needs an independent review (a separate reviewer agent or an external
  reviewer, its result posted on the pull request before the merge; passing CI alone is
  not one), every applicable job of `.github/workflows/checks.yml` concluded "success"
  on the final head commit, no unresolved finding and no unrelated change. Applicable:
  the Chromium jobs (template, template-unset, Medicinal-chemistry), the WebKit template
  job, the "Modules to check" plan job, and each module job a successful plan selects;
  a module job a successful plan intentionally did not select is not applicable. Any
  other conclusion of an applicable job, or no run for the final head commit, blocks the
  merge: FAIL if it ran and failed, NOT RUN if it was cancelled, timed out or never
  started. For an optional module or a change to a module's tests, a WebKit run of that
  module's course is also required (decision 10, Claude's readings). After the merge, a
  comment on the pull request names the review and the check run.
- **Every other pull request waits for Louis's yes**, and so does any such action
  outside a pull request: among them progress storage, import and recovery, and
  scheduling behaviour; course migrations and live-course updates; destructive actions,
  permission changes and unresolved consequential design choices; weakening, skipping
  or exempting a required check; and a change to this file that changes what a session
  does (Claude's reading in decision 10). For each, tell Louis in plain terms what
  merging it provides, what it changes on his sites and when, what it does not change,
  the check results, and any risk; merge it (`merge_pull_request`) only after he answers
  yes to that pull request. A no leaves it open, with his reason recorded in the pull
  request.

Before finalizing or merging a pull request, read its comments and reviews, weigh each
suggestion on its merits, address the valid findings, and reply on GitHub with the
reasoning and validation for each one accepted or rejected. A fix is `small-fix` only if
it meets every condition in §12.9, and the pull request states each one; when in doubt,
it is a core change.
Courses get kit changes only through Mode 7. A routine course update is published under
Louis's standing authorization of 2026-11-08 after the validation it names; an update that
carries a meaningful decision or an unresolved risk waits for his reply. Louis's own words:
`review/standing-autonomy-2026-11-03.md` and `review/standing-autonomy-2026-11-08.md`.

## Checks

Run `core/run_checks.sh` in the course's `src/` after every change. It runs each check
separately and prints PASS, FAIL, NOT RUN or REPORT with the reason. Report every line
as printed: a check that did not run is NOT RUN, never passed; list skipped steps as
well as skipped checks (§7.6). The cloud container has Chromium only, so a WebKit or
Safari run is NOT RUN there; the device lint (regex lookbehind and similar) always runs.

The checks prove structure, not subject matter. Wrong chemistry or pharmacology passes
every automated check; only an adversarial review against the sources (Mode 4) finds it.

## Publishing

- Commit every script that produced content, including one-off helpers (§7.7).
- Before every commit and package, grep the tree for tokens; a token lives only in
  `.git/config` (§7.10).
- A push that changes a live course's site needs Louis's approval of that change: his
  request for it in this session, or his yes to a summary of it (`KIT_DESIGN.md` §12
  decision 10, reading 7, which Louis accepted on 2026-11-03), except a routine kit update
  under his standing authorization of 2026-11-08 (Mode 7, "The kit-update run", steps 2
  and 3). Until then the work waits at `/preview/` or on a branch. An unattended run (a
  scheduled task) never changes a live site without his reply, with the same exception
  for the kit-update run. With that approval, push to the course repo
  following its own rule in `CLAUDE.md` (course repos merge automatically, decision 1).
  Confirm the deploy from the Pages workflow run for the
  pushed commit: `gh api 'repos/<owner>/<repo>/actions/runs?head_sha=<sha>'` and the run
  named "pages build and deployment" (works through the session's proxy without any
  connector, once the repo is attached), or `mcp__github__actions_list` where present.
  A cloud session cannot open the live site.
- **A refused push stops the session with a report.** Do not hand over a zip or bundle
  as a workaround: that is how a whole round of work (92 questions, the course manifest
  and the template) once never reached GitHub.
- After pushing, compare the published page's question and image counts with the counts
  in the course's `CLAUDE.md`; report any difference.
- Design changes are built at `/preview/` on the course's own site and replace the live
  page only after Louis approves them (decision 6).
- **Known is not released.** The coordinator's `coordinator/courses.json` holds every exam the
  syllabus names, each with a release status (`planned`, `collecting-material`,
  `in-development`, `ready-for-review`, `approved`, `published`). Only a `published` exam
  goes into `course.js` `exams`, and `activeExam` names a published one; never add an
  empty future exam to the site, and never release one because its date has passed.
  Earlier exams stay on the site when later ones are cumulative. After a release goes live
  and its deploy is confirmed, set that exam to `published` (and its `siteId`) in the same
  kit pull request that updates `COURSES.md`; `coord.js published` checks the two agree.

## State

The course's state lives in its repo (§7.8, confirmed in Phase 1):
- `CLAUDE.md`: a dated header ("State as of <date>, after <lecture or exam>"), counts,
  rules from Louis, release steps, and a "Restore after a container restart" section
  (Drive ids, what to re-download).
- `reviews/LOG.md`: one entry per session or scheduled run.
- `reviews/OPEN_QUESTIONS.md`: what waits for Louis.

The checks fail the build when `CLAUDE.md` was not updated after the newest lecture.

## Mode 1: new course

1. Create the repo, named like the existing ones, public, with Pages serving `main`
   from the root. If GitHub refuses creation, give Louis the steps (github.com → New
   repository → Public; Settings → Pages → Deploy from branch `main`, root) and continue
   once the repo exists and is attached; record which case applied in the kit's
   `CLAUDE.md` (decision 8).
2. Read the course material: Drive course folder, Goodnotes PDFs exported to Drive, the
   syllabus, decks, transcripts and the professor's questions, and the Claude Project
   when the session can open it.
3. Recommend features (above) and wait for Louis's approval.
4. Copy `template/` and `core/` (with `core/vendor/`, as `core/README.md` "Setting up a
   new course" says) and the approved features into the repo, fill
   `course.js` from the syllabus, propose the skill taxonomy and the exam/module map and
   confirm both, ingest the first lecture (Mode 2), build, run the checks, publish, add
   the course to `COURSES.md` and to `coordinator/courses.json` (its whole exam schedule,
   each exam's release status) by kit pull request, and offer a daily review (Mode 5).
   Tell Louis to attach the new repository to the "Kit updater" session with one
   message there ("attach lglouis3-create/<repo> to this session with push access"),
   so the daily kit-update run can reach it.

## Mode 2: add material

1. Ingest the deck and transcript with `core/ingest.py`; read the picture slides; write
   the questions in the professor's formats from `STYLE.md`, one per testable point, each
   with its `skill` and `concept`; add tell-apart rows and reference tables; append every
   poll and question put to the room to `STYLE.md` verbatim.
2. **Design check.** Profile the new material and compare it with the drill's features.
   The result is one of: fits (no change); adjust (propose turning a feature on or off,
   citing the slides); redesign (explain what changed and build a `/preview/`). Nothing
   changes without Louis's approval; a scheduled run only leaves the proposal.
3. If the material needs a feature the catalog lacks, or one it has cannot handle,
   propose a new feature or an upgrade; after approval and preview, it goes to the kit by
   pull request with its catalog entry and test.
4. Build, run the checks, publish, update `CLAUDE.md` and `reviews/LOG.md`.

## Mode 3: exam build

1. Set the blueprint in `course.js` from the professor's announcement (count or `null`,
   minutes, select-all count, pools with marks); set `activeExam`.
2. Add the review list, practice exam and prep sheet to `STYLE.md`; check the bank
   against the stated scope and fill thin and empty topics.
3. Review round with agents in parallel, about 100 questions each, findings as JSON
   (id, issue, source quote, proposed rewrite keeping the correctness pattern); apply
   accepted rewrites by script; a keyed answer changes only with a quoted source.
4. Objective guides: one section per objective, the slide's points in slide order with
   transcript quotes, the professor's poll on it with each option judged, how the
   professor asks it; separate verifiers check every line before the build.
5. Build, run the checks, publish, update the state, then run Mode 6.

## Mode 4: bank review

Adversarial only: is the keyed option right per the source; is a distractor also
defensible; is every claim in every `why` and `teach` sourced; does the cite point at the
slide that carries it; does the stem give the answer away; is there a duplicate. Per
finding: id, severity, exact quote, source quote, fix. Skip clean questions.

## Mode 5: scheduled ingest or review

Create one scheduled task per course with the scheduled-task tools, **with write access
to the course repo and the kit attached**, at a time Louis chooses. Its prompt is
standalone: load this skill, follow "Before anything else", do the ingest or the
review, and append one entry to `reviews/LOG.md`. What an ingest adds to the site, and a
review's fixes with its log entry, wait at `/preview/` or on a branch with a pull request
for Louis's reply (as the scheduled task "BDK daily review" does since 2026-11-03: branch
`daily-review/<date>`): an unattended run never changes a live site (`KIT_DESIGN.md` §12
decision 10). Each run confirms that it wrote and pushed its log entry (to that branch
when it works on one); a run that wrote nothing, or could not push, reports failure and
never ends as succeeded. A run that finds the push refused reports that the task needs
write access. Never create one for a course that has ended.

## Mode 6: retro

After each exam build and each course setup: harvest general changes into the kit by
pull request; update `FEATURES.md` versions, "best for", "weaker at" and evidence; update
`COURSES.md` (features used, design changes, declined proposals, exam outcomes); propose
retiring a version only where evidence shows a newer one is better at everything the
older one was best for.

## Mode 7: update a drill

**Moving a course onto the core, or any update Louis asks for by name:** build the
update at `/preview/`, run every check, show Louis the differences, and replace the live
page only after he approves. Question ids and `ns` stay the same; if the saved-progress
format changed, the update includes a converter that reads the old format on first load.
A course that had a service worker under another cache prefix before the core
(Medicinal-chemistry: `phar4342-drill-`) names that prefix in `course.js`
`oldCachePrefix`, and the core's worker deletes those caches; it never deletes another
course's cache.

**The kit-update run** (`KIT_DESIGN.md` §12.9) runs in one dedicated session, "Kit
updater", which started with the kit as its repository and keeps every course repository
attached with push access; the scheduled task "Kit update run" sends it the run every day
at 2:47 AM Central. A scheduled task that starts a fresh session each time cannot do this
work, because a session's repositories are chosen when it starts and such a session
starts with none (tested 2026-11-01). Each run:
0. **Preflight.** The run compares the course repositories in `COURSES.md` with the
   ones attached to the session, ignoring letter case (GitHub treats `DEENT` and `deent` as
   one repository). A course that is listed but not attached (a new
   course) is skipped in that run, and Louis gets a push notification naming it and the
   message to send in the session: "attach lglouis3-create/<repo> to this session with
   push access". The session does not attach it itself: the permission system requires
   that request to come from Louis in that session (tested 2026-11-01). For the kit and every attached course repo: `git fetch`, `git push --dry-run` to a scratch
   branch name, and `gh api 'repos/<owner>/<repo>/actions/runs?per_page=1'`; and Node,
   Python and Chromium start. If any of these fails, nothing goes live in this run; the
   run reports FAILED with the failing step and its output.
Then it reads each course's `course.js` from the branch GitHub Pages serves
(`coordinator/courses.json` `pagesBranch`; `main` for every course today), at the commit
Pages last deployed from it, or at its head when the deployment cannot be read, as the
coordinator does; never from the repository's default branch, which can hold unreleased work
(DEENT's default branch is its working branch). It compares the `kit` pins there with the
kit's `main`, and reads the kit-update state of each course: `node coordinator/coord.js
kitupdate --json` on the kit's `origin/main`. A pin difference, or a new kit commit, is not
by itself a reason to build anything (Louis, 2026-11-08, `review/standing-autonomy-2026-11-08.md`
§4): the run reads what changed in `core/` and `features/` since the course's pin and judges
whether the course benefits, by the features it uses and by newly available features that fit
its material. A course whose last exam has passed (Medicinal-chemistry, Louis 2026-11-08;
the coordinator's lifecycle "completed") gets no update for a pin difference alone and stays
eligible for improvements that fit it. A course with no `kit` pin (BDK, Basic-Pharmacokinetics-,
Intro-Pharmacology-, 2026-11-08) is awaiting its migration onto the core: "no kit pin" is an
expected status, not a failure; the run checks that the repository answers and leaves the
migration to its owning session. A course in `COURSES.md` with no entry in
`coordinator/courses.json` has no pause recorded and is active. If that command fails, exits
non-zero, or reports any course as "invalid", or the kit's `main` has no `coordinator/`, the
run builds no kit-update preview for any course in that run and reports FAILED with the
command's output; its read-only checks still run.
- **Paused** (`kitUpdate.previews` "paused"; DEENT since 2026-11-06): the run makes no
  branch, build, `/preview/`, commit or log entry in that course, and changes neither its
  working branch nor its existing preview. Its read-only checks go on: the preflight
  above, the pin on the Pages branch against the kit's `main`, the Pages branch's head and
  its latest "pages build and deployment" run. The run reports, in its one line for the
  course, "kit-update preview paused since <since>: <reason>", the pin and how far it is
  behind. A paused course behind the kit is not a failure and sends no notification on its
  own.
- **Lifting a pause** (the record's `liftWhen`): after the pending release is resolved, a
  kit session verifies the approved course baseline on the Pages branch (its head, its
  question count and its confirmed Pages deploy) and that no pending preview, on the Pages
  branch or the working branch, would be overwritten. Only then does it set `previews` to
  "active" in a bookkeeping pull request, and the next run prepares a separate kit-update
  preview. The run itself never lifts a pause.
For each course, not paused, that benefits from a change in the kit:
1. Bring in the newer core and feature files on a branch `kit/update-<kit sha>`, build the
   update at `/preview/`, run every check, compare the preview with the live page, and
   append the result to the course's `reviews/LOG.md`, with the student benefit stated.
2. Decide whether the update is routine. It is routine when it keeps every question, answer,
   explanation, figure, exam setting and saved progress as they are, changes no study or
   exam behaviour substantially, and every required check and the independent review the
   kit's rules call for have passed. It is not routine, and waits at `/preview/` for Louis's
   decision with the specific risk and the evidence stated, when it could lose or convert
   saved progress incompatibly, removes content or a feature, changes an answer key without
   adequate source support, changes study or exam behaviour substantially, redesigns a drill
   close to an assessment, rests on conflicting requirements or a consequential trade-off
   that is not resolved with confidence, would weaken a required check, or carries any other
   meaningful decision or unresolved risk (Louis's list is open, "such as", and he asks for
   judgment: `review/standing-autonomy-2026-11-08.md` §1; before 2026-11-08 every update
   waited for his reply, and before 2026-11-03 a bookkeeping or `small-fix` update could go
   live without one). Claude's own design choice, not in his text: no update is published
   on an exam day of that course.
3. Publish a routine update, or a waiting one after Louis's reply "approve updates for
   <course>": verify that the candidate on the branch is the one the checks ran on, build the
   live page from it and confirm that it matches the validated preview apart from the preview
   note and stamps, then one commit "kit update: <old pins> → <new pins>", `preview/`
   deleted, the course `CLAUDE.md` pin paragraph updated, pushed. Then wait for that commit's
   "pages build and deployment" run to complete, for up to 10 minutes (a design
   choice: the longest of BDK's last five Pages deploys, 2026-10-30 to 2026-11-01, took
   2 min 51 s). On success, log it; the previous commit stays as the rollback (a revert).
   On failure, or with no completed run after 10 minutes, revert the update commit, push,
   confirm that deploy the same way, log both, and report FAILED.
A run that could not build, check, push or confirm the deploy reports failure and never
ends as succeeded. The run sends Louis a push notification only when a new course needs
attaching, an update that needs his decision waits for his reply, a meaningful improvement
went live, an update was reverted, or the run failed; never for an unchanged pause, a pin
difference, or a run with nothing to do, which ends with one line per course and no
notification.

Bringing in a newer core means copying every file of the kit's `core/` except
`README.md`, and `core/vendor/`, into the course's `src/`. A course with feature modules on
(`course.js` `features`) keeps the copies in `src/features/<name>/` at their pinned
versions; a module moves to a newer version only when Louis asks for it by name, by
copying the kit's `features/<name>/current/` over the course's copy and changing its
`version` in `course.js` in the same commit (`features/README.md`). A course whose `build.py`
still carries its own list of question files (a core before 2026-11-01's `files`) gets
that list in `course.js` `files` first; the new build names any question file left out.
The tables `cite_check.py`, `explain_check.js` and `harvest_mask.py` need from a course
live in `course.js` `tools` (`core/README.md` "Course tables"), so the copy keeps them. A
course whose copies of those three files still carry their own tables at the top (a core
before 2026-11-01's `tools`) gets those entries into `tools` first; `--tables` on each
tool then prints what it reads.

**Undo:** "undo the last kit update for <course>" reverts that update commit, restores
the previous pins in `course.js`, confirms the deploy, and logs it in `reviews/LOG.md`.

## Mode 8: exam outcome

Record Louis's feedback in `COURSES.md`: the score if he gives it, the question types
that appeared, and what the drill missed. Compare it with the drill's coverage and the
answer log, and turn what it shows into improvement proposals.

## Mode 9: coordinator and dashboard

- **"Show my Exam Drill Dashboard"**: follow the project skill
  `.claude/skills/exam-drill-dashboard/SKILL.md` in the kit. It runs
  `node coordinator/coord.js dashboard` and shows the result in the conversation. It changes
  nothing.
- **"Run the coordinator"** (or its scheduled task): follow `coordinator/RUN.md`.
- The coordinator plans reviews by each course's lifecycle, from its whole schedule in
  America/Chicago, never from `activeExam`:
  - exam-approaching and active: daily;
  - recently completed: weekly;
  - completed: monthly, with a quarterly deep audit;
  - archived: only on change.
- It skips unchanged code and records every improvement it finds in
  `coordinator/improvements.json`. Preparing improvements (branches, pull requests, port-queue
  entries) and starting retrospectives on its own are a separate proposal for Louis's yes or
  no; until it is merged, a run prepares nothing and a retrospective happens only when Louis
  asks for one (Mode 6).
- It never publishes a course site or merges a course repository's main.

## The scheduler

Set by `course.js` `scheduler.model` (decisions in `KIT_DESIGN.md` §12.3):
- `concept` (default): concepts, not single questions, are scheduled; a missed concept
  returns after at least 4 other questions as a different question; reviews before an
  exam are spaced by the days left; "I was sure of that" after a miss brings a different
  question on the concept next and a check on a later day; `preset:'calc'` keeps two
  questions of one skill from coming in a row.
- `fsrs`: FSRS-7 per question through ts-fsrs 6.0.0, inlined from `core/vendor/`, on the
  library's default parameters. Fitting the parameters to Louis's own answers is not
  built yet (findings in `core/README.md`).
- `concept-fsrs` (off by default): a memory model per concept with question rotation;
  `compare` is on unless set to `false`, so each concept is assigned at random to this
  model or the default and the answer log shows which works better for Louis.

`core/README.md` "The scheduler" lists every design choice that has no source value.
Every answer is logged (time, question, right or wrong, mode, concept, confidence, item
type, scheduler, arm, predicted recall) for retros and for fitting the model.

## Standing principles

These are `KIT_DESIGN.md` §7; the ones a session most often needs:
- **End every session with "Improvement proposals"**: new features, upgrades, better
  presentation of the material, better question writing, each with what, why for this
  course, evidence with citations (AMA 11th edition), what it would look like, and cost
  and risk. Learning-science research is a proposal; nothing is built before Louis
  approves (decision 2). If nothing is worth proposing, say so in one line.
- No silent upgrades: a course keeps its pinned versions until Mode 7.
- Honest reporting: NOT RUN stays NOT RUN; a fact that cannot be sourced is left out
  and reported.

## Delivery standard

One short report: what changed, which checks ran and which did not (with reasons), what
is missing and what is needed next, the numbers that matter in a table, and the
improvement proposals.
