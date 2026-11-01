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
2. **Read from the kit:** `KIT_DESIGN.md` §7 and §12 (the standing principles and the
   approved design changes), `FEATURES.md`, `COURSES.md`, and `core/README.md`.
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
| "exam <N> outcome for <course>" | 8 Exam outcome |

If the request names no mode, ask which one in one line.

## The course manifest (`course.js`)

Everything specific to the course; the engine and every check read it.

```
COURSE = {id, title, short, ns, output, professors:[…],
  lectures:[{id, deck, decks?, label, prof, exam, module, moduleLabel?}],
  exams:[{id, name, scope, date, when, questions | null, minutes, sata?, blurb, facts?,
          pools:[{key, name, marks | null, filter:{exam:N} | {prof:'X', tier:'new'} | {lecture:[…]} | {module:N}}]}],
  activeExam, skills:[{id, label, short}], paceDefault:'cram'|'weekly'|'semester',
  scheduler:{model:'concept' | 'fsrs' | 'concept-fsrs', compare?:true},
  features:{<name>:{version, ...options}},
  kit:{core:'<kit commit or tag>'}}
```

- `ns` and every question id never change, in a redesign or a core update, so progress
  carries across exams and updates (§7.4).
- `kit.core` and each `features.<name>.version` pin the course; nothing changes them
  except Mode 7 (§7.5).
- `questions: null` means the count is not announced; the exam draw then uses pool
  eligibility, and the clock does not scale.

## Questions

Schema and rules are in `core/README.md`; the essentials:

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

1. **Measure the material** with `core/profile.py` from the course files: the syllabus
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

Louis merges feature, upgrade, core and `SKILL.md` pull requests. Catalog bookkeeping
(a "Used by" line, a dated evidence note) may merge automatically (decision 1). A course
gets kit changes only through Mode 7.

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
- Push to the course repo following its own rule in `CLAUDE.md` (course repos merge
  automatically, decision 1). Confirm the deploy from the Pages workflow run for the
  pushed commit; a cloud session cannot open the live site.
- **A refused push stops the session with a report.** Do not hand over a zip or bundle
  as a workaround: that is how a whole round of work (92 questions, the course manifest
  and the template) once never reached GitHub.
- After pushing, compare the published page's question and image counts with the counts
  in the course's `CLAUDE.md`; report any difference.
- Design changes are built at `/preview/` on the course's own site and replace the live
  page only after Louis approves them (decision 6).

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
4. Copy `template/` and `core/` (and the approved features) into the repo, fill
   `course.js` from the syllabus, propose the skill taxonomy and the exam/module map and
   confirm both, ingest the first lecture (Mode 2), build, run the checks, publish, add
   the course to `COURSES.md` by kit pull request, and offer a daily review (Mode 5).

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
review, and append one entry to `reviews/LOG.md`. Each run confirms that it wrote and
pushed its log entry; a run that wrote nothing, or could not push, reports failure and
never ends as succeeded. A run that finds the push refused reports that the task needs
write access. Never create one for a course that has ended.

## Mode 6: retro

After each exam build and each course setup: harvest general changes into the kit by
pull request; update `FEATURES.md` versions, "best for", "weaker at" and evidence; update
`COURSES.md` (features used, design changes, declined proposals, exam outcomes); propose
retiring a version only where evidence shows a newer one is better at everything the
older one was best for.

## Mode 7: update a drill

Move one course to the current core and feature versions: build the update at
`/preview/`, run every check, show Louis the differences, and replace the live page only
after he approves. Question ids and `ns` stay the same; if the saved-progress format
changed, the update includes a converter that reads the old format on first load.

## Mode 8: exam outcome

Record Louis's feedback in `COURSES.md`: the score if he gives it, the question types
that appeared, and what the drill missed. Compare it with the drill's coverage and the
answer log, and turn what it shows into improvement proposals.

## The scheduler

Set by `course.js` `scheduler.model` (decisions in `KIT_DESIGN.md` §12.3):
- `concept` (default): concepts, not single questions, are scheduled; a missed concept
  returns after at least 4 other questions as a different question; reviews before an
  exam are spaced by the days left; a confident error gets a check on a later day; in
  calculation courses no two problems of one type come in a row.
- `fsrs`: FSRS-7 per card, on default parameters until enough reviews exist, then fitted
  to the student's own answers.
- `concept-fsrs` (off by default): a memory model per concept with question rotation;
  ships with `compare:true`, which assigns each concept at random to this model or the
  default so the answer log shows which works better for Louis.

Every answer is logged (time, card or concept, item, right or wrong, confidence, mode,
scheduler) for retros and for fitting the model.

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
