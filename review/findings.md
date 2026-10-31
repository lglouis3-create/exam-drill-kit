# Phase 1 findings

Read-only evaluation, 2026-10-31. Nothing was changed in any course repo or live
site. Course-repo checks were run only in scratch clones outside the repos.

## 0. What was read, and what could not be reached

Read in full: `KIT_DESIGN.md`; the four `claude/drill-notes.md` files, including
Medicinal-chemistry's unmerged correction (`3b87e8a` on branch
`claude/drill-notes-project-sources`, 450 lines, which states that it
supersedes the 250-line version merged as `03a314d`); both skill archives
(`Exam drill builder-v1.zip`: `SKILL.md` 173 lines and `plugin.json`;
`exam-drill-builder.skill`: `SKILL.md` 245 lines); every file in
Intro-Pharmacology-'s `share/` (10 files, 619 lines); and every repo's full
history on every branch (shallow clones deepened; Medicinal-chemistry 12 commits
on `main`, Basic-Pharmacokinetics- 171, Intro-Pharmacology- 277 on `main` and
524 on `claude/eager-heisenberg-ig6y2o`, BDK 20).

Repo heads used: Medicinal-chemistry `03a314d`, Basic-Pharmacokinetics-
`ac2eb73`, Intro-Pharmacology- `85c220f`, BDK `340a396`. Intro-Pharmacology-'s
work branch has the same tree as `main` (`git diff` empty).

Not reachable from this session, so every claim that depends on them comes from
the course's notes and is marked so: the Claude Projects (including
Medicinal-chemistry's four `claude/` state docs), Louis's Google Drive, the
session transcripts the notes quote, the live sites, and the GitHub API for the
four course repos (they were served read-only through the git proxy and not
attached, so branch protection and Actions runs could not be read).
`lglouis3-create/Heb-pharmacy-guide`, which Medicinal-chemistry's notes name, was
not searched; it was not in the set of repos Louis asked to attach.

Abbreviations: MC = Medicinal-chemistry, PK = Basic-Pharmacokinetics-, PH =
Intro-Pharmacology-, v1 / v2 = the two skill archives, "share draft" =
`Intro-Pharmacology-/share/skill/exam-drill-builder/SKILL.md`.

## 1. Skill lineage, confirmed from git

| Step | When | Evidence |
|---|---|---|
| MC engine reaches GitHub | 2026-09-20 | `966c82e` to `9103bc6`, "Add files via upload" and "Update source files" by `lglouis3-create` |
| **v1** | not dated (the zip entries carry 1980-01-01) | v1 names MC's `PHAR4342_Final_Drill.html` and `src/` (v1 lines 11-13); all 12 engine files it lists (lines 42-48) exist at `9103bc6`; it says to move the course constants into `course.js` "the first time a second course is set up" (lines 51-52); no `course.js` exists in any MC commit |
| MC 09/21 round (not in git) | 2026-09-21 | per MC's Project state doc (quoted in the MC corrected notes §0-§1): `course.js`, `exam-drill-template/`, `ingest.py`, `q14_tell.js`, `q15_types.js`; committed to a local clone only |
| **v2** | `SKILL.md` file time 2026-09-21 23:17 in the archive (no time zone recorded) | names `exam-drill-template/` at the MC root and `medicinal-chemistry/PHAR4342-final-drill/` (v2 lines 15-18), the 09/21 local layout per MC corrected notes §3; md5 `33a1d0a93a2eb3d2f989e3a5517069ed` equals the installed skill the PK session read (PK notes, "Sources") |
| PK repo created | 2026-09-21 23:17:21 -0500 | root commit `2c3c3e5` |
| **PK engine** | 2026-09-22 06:22 UTC | `08f16b6`: engine, `course.js`, six-question placeholder bank `q1_sample.js`, checks that read the output name from `course.js`; its `src/README.md` says it was ported from "the reference implementation ... a medicinal-chemistry drill" |
| **PH engine** | 2026-09-26 03:13 UTC | `86a44e7`: a new engine (`app.js` 466 lines, `shell.html` 87 lines, Node `browser_test.js`) that reads `COURSE`; it shares no file with the MC/PK engine |
| PH → PK port 1 | 2026-10-02 | PH `f517148` (`notes/ENGINE_UPGRADES.md`) → PK `c01b619` "Port the engine upgrades", `d9b6a4e` |
| **share draft** | 2026-10-17 | PH `31740a2`: 317-line replacement `SKILL.md`, `FEATURES.md`, `PORTING.md`, six agents |
| PH → PK port 2 | 2026-10-17 | PK `30154d4`, `52156ed` (R1, R2, R4-R9) |
| BDK | 2026-10-21 | `87d17e5`; the skill was not invoked (BDK notes, top; transcript-based, not checkable from git) |

**Against the brief's order (§2: v1 → PK → v2 → pharmacology).** v1 first and
pharmacology after PK are confirmed. The order of PK and v2 is not as the brief
states: v2's file time is earlier than PK's first content commit whether the
archive's 23:17 is read as UTC (7 h 05 min earlier) or as America/Chicago, the
zone BDK's scheduled task uses (23:17 CDT is 04:17 UTC on 09-22, 2 h 05 min
earlier). Both differences were computed from the times above. PK's `08f16b6`
implements v2's design (manifest fields, numeric and matching types, checks
reading `output` from `course.js`), which fits PK being built from v2. Its
commit message says it "adds numeric and matching question types", while MC's
state doc records numeric and matching items (`q15_types.js`) in the 09/21 round;
which drill implemented those types first cannot be settled from git, because
the MC round is not in git.

## 2. Where a template exists

- **No `exam-drill-template/` exists in any commit on any branch** of the four
  course repos or of `exam-drill-kit`. No path containing "template" exists
  either (`git log --all --name-only`, checked on every repo).
- The name appears only in text: MC's notes (`f9369c8`, `3b87e8a`), PH's
  `notes/ENGINE_UPGRADES.md` (`f517148`, which calls it "an older version of the
  same engine"), PH's `share/` (`31740a2`), and BDK's notes (`47fc231`).
- MC's Project state doc records that the template was built on 2026-09-21 (engine
  plus stubs, a `course.js` template, `q1_topics.js` with 7 sample items,
  `STYLE.md`, `README.md`, `CLAUDE.md`, `.gitignore`) and that it "exists only in a
  session workspace and a local clone, neither of which survives" (MC corrected
  notes §1). The same notes name a bundle, `PHAR4342-medchem.bundle`; whether Louis
  still holds it is unverified (§5 there).
- **Closest surviving copy:** PK `08f16b6`'s `src/`: a course-agnostic engine
  with a manifest, a placeholder bank headed "SAMPLE QUESTION BANK — PLACEHOLDER
  CONTENT", empty course tables, and checks that read the output name from
  `course.js`. It differs from the template as recorded: six sample questions
  rather than seven, and `atlas.js` and `diagrams.js` dropped rather than stubbed
  (PK `src/README.md` at `08f16b6`, "What this build does not carry").

## 3. Corrections to the brief and to the drill notes

1. **PK's history does not start at `c97a6b4`.** PK's notes say "Repository history
   starts at c97a6b4 (2026-10-04) ... The history has 105 commits". Git shows the
   root `2c3c3e5` (2026-09-21), 64 commits before `c97a6b4`, and 171 commits on
   `main`. So PK's notes are wrong that the template copy "is not visible in this
   repository" (it is `08f16b6`), and that the first two break clips predate the
   history (they arrive in `7cddf6c`, 2026-10-04).
2. **BDK has no `course.js`** (brief §2 says it has one). No BDK commit on any
   branch adds a file named `course.js`. Its course data are `QUIZZES`
   (`assets/app.js:42`) and `TOPICS` (`assets/app.js:8`).
3. **MC's notes on `main` are superseded but not merged.** `03a314d` (on `main`)
   lists six SKILL.md steps as "wrong for this repository"; `3b87e8a` (unmerged)
   says they describe work that was done on 09/21 and never pushed. A reader of
   `main` gets the version its own author withdrew.
4. **PH's notes cite work-branch hashes.** Of the 14 PH hashes checked for this,
   8 are on `claude/eager-heisenberg-ig6y2o` only (`c289f63`, `54a3c4a`, `557d93d`, `d25bf95`,
   `b41039d`, `e1c893b`, `3536d71`, `2395ea7`), because `main` holds squash-merges.
   All resolve on origin.
5. **PH's focus switch** first appears in `96e33bf` (2026-10-20, `git log -S
   FOCUS_EXAM`), not in `c289f63` (2026-10-21) as PH's notes say.
6. **"Louis" in BDK** appears in the five files the brief names (`CLAUDE.md`,
   `docs/daily-review.md`, `reviews/LOG.md`, `reviews/OPEN_QUESTIONS.md`,
   `tools/build.py`) and since `47fc231` also in `claude/drill-notes.md`, six files
   in all.

## 4. Differences between the drills: core or feature

Each difference is classified in one of the other three files:

- **Core** (one version for every drill, best of the versions chosen with
  reasons): `proposed-core.md`. It covers the manifest, storage, scheduler,
  service worker, update notice and place restore, build, checks, Pages setup,
  exam draw, analytics, state record and agents, plus which engine the core
  starts from (§0 there).
- **Feature** (catalogued, nothing discarded): `FEATURES.draft.md`, with 50
  entries (counted by `grep -c '^## [a-z]'`), plus process features, content
  patterns for SKILL.md, and four planned items not built.
- **Per course**: `COURSES.draft.md`.

The duplication brief §1 asks the kit to remove is concrete: seven features
exist as two separate implementations, one in PH `app.js` and one in PK
`views.js`. Five were ported from PH by copying code: step-through-figures and
whats-new (`c01b619`), explain-more-links (`d9b6a4e`), concept statuses
(`593c704`, merged in `52156ed`) and guide-walkthroughs (`bc8321d`). Two were
built a second time in PK: most-likely-stars (`f4710c3`) and recorded-narration
(`f013ced`).

Two defects found by reading the code, neither reported in any course's notes:

- **BDK's service worker deletes other sites' caches.** `sw.js:8-9` deletes every
  cache whose name is not `bdk-v15`. All of Louis's Pages sites share the
  `lglouis3-create.github.io` origin, so BDK's activation would delete MC's
  `phar4342-drill-v1` cache. MC's `sw.js:13-18` was written to avoid exactly this.
  Not run in a browser.
- **PK's exam draw can put both wordings of a fact on one paper.** `beginExam`
  (`src/views.js:3270-3282`) calls `drawMixed` once per pool, and each call
  starts a new blocked set (`src/views.js:3199`), so a `dupOf` pair whose members
  sit in two pools can both be drawn. This is the defect MC fixed in `ed38dbd`
  after PK had forked. Whether any pair in PK's current bank spans two pools was
  not tested (NOT RUN).

## 5. Hand fixes that a SKILL.md step should have prevented

"v2" line numbers refer to the 245-line archive. "Missing" means no version of
the skill (v1, v2, share draft) has the step.

| Drill | Fix | What happened | Skill step that should have prevented it |
|---|---|---|---|
| MC | `4a32dad` | Pages root showed the README; no `index.html` or `.nojekyll` | Missing: v2 line 12 says the drill is published on Pages but has no publishing step |
| MC | `4a32dad` | build and seven checks read `/mnt/user-data/outputs/…`, so no check ran on a clone | v2 line 159 says checks read the output path from `course.js`; missing: the output path must be inside the repo. PK `src/build.py:86` still has the sandbox path |
| MC | `4a32dad` | page 8.82 MB, 86.4% inline JPEG | Missing: image format and quality (v2 lines 104-105 name only the harvester) |
| MC | `ed38dbd` | a `dupOf` pair across two pools shared a paper about once in 300 | v2 line 147 states the rule; missing: a test that forces every pair. PK still has the defect (§4) |
| MC | `ed38dbd` | offline use; cache cleanup scoped to the drill on a shared origin | Missing. BDK's `sw.js` shows the cost (§4) |
| MC | before `7aa5816` (MC corrected notes §2.8-2.10) | three checks passed while unable to fail (figures at zero, `NaN` in base64, `cite_check` over zero references) | v2 lines 160-161 cover a check that cannot run; missing: a check must be shown to fail on a bad input |
| MC | 09/21 round | 92 questions, `course.js`, `ingest.py` and the template never reached GitHub after a refused push | v2 lines 234-236 hand over a zip; missing: compare the published build's counts with the state record afterwards |
| MC | before `7aa5816` | reading `localStorage` at load threw and left a blank page | Missing: storage must go through a shim |
| MC | before `7aa5816` | a figure's `aria-label` named its answer | Missing |
| PK | `f4b60c3`, `1c35a71`, `7a9f325` | 29 slips in the bank and 8 printed results on teaching pages did not follow from the numbers shown | v2 lines 132-134 require worked steps; missing: recompute every printed `expression = value` |
| PK | `0f266e5`, `bc8321d`, `f013ced` | regex lookbehind, removed for older Safari in `db37384`, came back three times | Missing: a device check (capability 5) |
| PK | `4ce505d` | a student's name in four source comments | v2 lines 239-240 state the rule; missing: a scan step |
| PK | `f013ced` | worksheet PDFs went stale after style changes; `sheets_test.py` was not run before `d71d237` was pushed (PK notes §2, session memory) | v2 line 188 says run every check; skipped, not missing |
| PK | PORT_EVALUATION R7 | the daily check was created without the Drive connector and could not list files | Missing: Mode 5 does not say to confirm the task has the connectors it needs |
| PK | `c856c50` | the Pages site and REST endpoint cannot be reached from a cloud session | Missing: confirm the deploy from the workflow run |
| PH | `3536d71`, `59f9c38` (branch) | a container restart wiped scripts kept in the scratchpad | Missing (brief §7.7 adds it: commit every script) |
| PH | `4dd68c7` | a changelog edit committed without a rebuild | v2 line 188 orders build then commit; missing: a check that the committed page matches the sources |
| PH | `07ca71a` | a writer agent's single long write stopped at L21-035 | Missing: split agent output into parts |
| PH | `3b0f4ed` (branch) and history rewrite; `fc1a3c7` | personal text, with other people's names, on a deck page in the Drive copy; pencil marks in a scanned figure | v1 lines 106-107 say handwriting on slides is the student's; v2 and the share draft dropped that line; no version says to remove personal marks before publishing. BDK `ae8840c` (highlighting on page images) is the same case |
| PH | `2395ea7` (branch) | the daily paper's correct answer was option A on 28 of 40 questions | Missing: every generated paper shuffles options |
| PH | `d1df52f` | phone buttons under 40 px | Missing: device check |
| PH | `c1ae4b0` | the exam clock scaled when `questions` was `null` | v2 line 87 assumes the count is set; missing: a rule for an unannounced count |
| BDK | not fixed | the 10/30 daily review had no write access, did no review, and the task ended without a failure | v2 Mode 5 (lines 220-230) has no requirement that a run confirm it wrote its log entry (brief §9 Mode 5 adds it) |
| BDK | `80738a4` | iPhone Safari kept hover on the last tapped choice, which looked like a hint | Missing: device check |
| BDK | `71da38b` | 16 generated questions named their own answer | v2 Mode 4 asks "does the stem give the answer away", as review only; missing: an automated check |
| BDK | not done | the spec's ID1 Organism wording check was neither done nor reported as skipped | v2 lines 244-246 cover checks, not spec steps; brief §7.6 adds "skipped steps are listed" |

## 6. Check results per drill

Pending. The check suites were running in scratch clones when this commit was made; this section is filled in a later commit. Until then, no check in any drill is reported here as passed, failed or skipped.

## 7. Brief §10 findings: status after this phase

| Finding | Status | Evidence |
|---|---|---|
| No `exam-drill-template/` on any main branch | Confirmed, and on no branch and in no commit | §2 |
| MC: 12 sources named in `src/README.md` not in the repo | Confirmed: none of the 12 is in any commit on any branch | `git log --all -- src/<name>` |
| MC: three missing SKILL.md steps fixed in `4a32dad`, `ed38dbd` | Confirmed: both commits exist and touch the files named | `git show --stat` |
| MC: `main` unprotected | NOT VERIFIED this session: the repo was not attached, so the GitHub API was not available | MC notes §5 |
| PK: SKILL.md names 7 checks, the repo runs 25 | 7 confirmed (v2 lines 152-157); 25 check scripts present on `main` (15 `*_test.py`, 7 `*_check.js`, `cite_check.py`, `test.js`, `render_test.js`); results in §6 | `ls src` |
| PK: `ingest.py` never used | Confirmed: no commit on any branch contains it | `git log --all -- src/ingest.py ingest.py` |
| PK: lookbehind returned in three places | see §6 | |
| PK: README count stale | Confirmed: `README.md:14` says 620 questions; PK notes count 829 in the build | |
| PH: installed SKILL.md is not the share draft | Confirmed: 245 vs 317 lines | |
| PH: scripts SKILL.md names do not exist | Confirmed: no commit on any branch has `ingest.py`, `harvest.py`, `render_test.js`, `explain_check.js`, `cite_check.py`, `coverage_check.py` or `browser_test.py` in `exam1-drill/src/` | `git log --all -- exam1-drill/src/<name>` |
| PH: state doc last updated 2026-09-28 | Confirmed: header reads "Updated 2026-09-28" (`claude/drill-app-state.md:3`) while entries run to 10-30 | |
| PH: Exam 4 has no question count | Confirmed: `questions:null` at `exam1-drill/src/course.js:101` | |
| BDK: skill never invoked | Not checkable from git; BDK notes cite the transcript | |
| BDK: 10/30 review had no write access and reported success | Not checkable from git; consistent with `reviews/LOG.md`, whose last entry is 2026-10-28 | |
| BDK: ID1 Organism check neither done nor reported | Not checkable from git; BDK notes §3 | |
| BDK: "Louis" in five files | Confirmed, plus `claude/drill-notes.md` since `47fc231` | §3.6 |

## 8. Instruction received for Phase 2

Louis's addition (2026-10-31, this session): the revised `skill/SKILL.md` must tell
every course session, before doing anything else, to attach `exam-drill-kit`
alongside the course repo; to read `FEATURES.md`, `COURSES.md` and `core/` from it;
and to open kit pull requests for new features, upgrades and catalog updates.

Two facts from this session bear on the wording:

- The four public course repos were served read-only through the git proxy
  without being attached (`add_repo` returned `read_available`, "Nothing was
  attached"). A read-only copy cannot be pushed to and does not give the GitHub
  API, so opening a kit pull request needs `exam-drill-kit` attached with push
  access. The step should ask for that and, if it is refused, stop and tell
  Louis, as brief decision 8 already does for repo creation.
- Brief decision 1 lets catalog bookkeeping merge automatically. With every
  catalog update arriving as a pull request, the skill needs to say which kinds
  of pull request may merge without Louis.

This addition is recorded here and is not yet in `KIT_DESIGN.md`; Phase 2 adds it
there, as the brief requires for design changes Louis approves.

## 9. Decisions for Louis

1. Engine for the core: PK's (proposed) or pharmacology's (`proposed-core.md` §0).
2. Default scheduler: concept-level Leitner (proposed) or FSRS (§3 there).
3. BDK's service worker clears other sites' caches (§4): fix BDK now, as a
   course-repo change outside the kit work, or record it for Mode 7.
4. Merge MC's corrected notes `3b87e8a` into MC's `main`?
5. Do you still have `PHAR4342-medchem.bundle` (MC's 09/21 round with the template
   and 92 questions)?
6. One source order for conflicts: PK's (her worked solution, her correction in
   lecture, slide, textbook) and PH's (transcript, slide, reading as discussed)
   differ (`FEATURES.draft.md`, content patterns).
7. BDK's glossary links to MedlinePlus; decision 3 bars outside content from
   questions, explanations and tables, and does not mention links.
8. Personal names in state files (`CLAUDE.md`, `reviews/`) against principle 7.9.
9. Agent definitions in `core/agents/` (not in the brief §4 layout).
10. PK's cross-pool `dupOf` defect: PK's final was 2026-10-27, so fixing it matters
    only if the drill is reused.
11. Search `Heb-pharmacy-guide` for the template or the Exam 1 study tools?

## 10. Improvement proposals

No learning-science research was done in this phase, so nothing below rests on it.

1. **Delivery confirmation.** After every push, compare the published page's
   question and image counts with the counts in `CLAUDE.md`, and fail the session
   report when they differ. Why: MC's 09/21 round never reached GitHub, and the
   skill had no step that would have shown it (MC corrected notes §0, §7.2). Looks
   like: one script in `core/checks/`. Cost: small. Risk: none to content.
2. **WebKit in CI.** A GitHub Actions workflow that runs the browser test in
   Playwright's WebKit on every push. Why: this container has Chromium only (§6),
   and three of the four drills hit faults that only Safari shows or that phones
   show (PK lookbehind three times; BDK iPhone hover `80738a4`; PH tap targets
   `d1df52f`). Cost: Actions minutes per push. Risk: Playwright's WebKit is not the
   same build as iOS Safari, so a pass does not prove an iPhone pass.
3. **A negative control for every check.** Each check ships with an input it must
   reject, and the suite fails if that input passes. Why: MC's three checks that
   passed while unable to fail; PK `041274d`'s highlighter test that could not fail
   until its colours changed. Cost: one fixture per check.
4. **Shared-origin rule as a check.** A check that fails when a service worker
   deletes caches outside its own prefix. Why: §4, BDK `sw.js:8-9`. Cost: small.
