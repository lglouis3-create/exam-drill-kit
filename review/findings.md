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
  course repos or of `exam-drill-kit`. (On 2026-11-01 Louis supplied it from his own
  files, outside GitHub; see §11.) No path containing "template" exists
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

Three defects found in this phase, by reading or scanning the code:

- **BDK's service worker deletes other sites' caches.** `sw.js:8-9` deletes every
  cache whose name is not `bdk-v15`. All of Louis's Pages sites share the
  `lglouis3-create.github.io` origin, so BDK's activation would delete MC's
  `phar4342-drill-v1` cache. MC's `sw.js:14-18` was written to avoid exactly this.
  **Fixed 2026-11-01 with Louis's approval** in BDK `c78e78d` (deployed: Pages run
  19, success). The new `tests/offline.js` confirmed the defect in Chromium on the
  previous code (only `bdk-v15` remained after activation) and passes on the fix.
- **PK's exam draw can put both wordings of a fact on one paper.** `beginExam`
  (`src/views.js:3270-3282`) calls `drawMixed` once per pool, and each call
  starts a new blocked set (`src/views.js:3199`), so a `dupOf` pair whose members
  sit in two pools can both be drawn. This is the defect MC fixed in `ed38dbd`
  after PK had forked. Whether any pair in PK's current bank spans two pools was
  not tested (NOT RUN).
- **Regex lookbehind ships in three of the four drills** (PK, PH, BDK; §6.5).
  The brief records PK's three; PH's one and BDK's two are not in any course's
  notes.

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
| MC | fixed code first on GitHub in `7aa5816` (MC corrected notes §2.8-2.10) | three checks passed while unable to fail (figures at zero, `NaN` in base64, `cite_check` over zero references) | v2 lines 160-161 cover a check that cannot run; missing: a check must be shown to fail on a bad input |
| MC | 09/21 round | 92 questions, `course.js`, `ingest.py` and the template never reached GitHub after a refused push | v2 lines 234-236 hand over a zip; missing: compare the published build's counts with the state record afterwards |
| MC | fixed code first on GitHub in `7aa5816` | reading `localStorage` at load threw and left a blank page | Missing: storage must go through a shim |
| MC | fixed code first on GitHub in `7aa5816` | a figure's `aria-label` named its answer | Missing |
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
| BDK | not fixed | the 10/30 daily review had no write access and did no review; its own report asked Louis to add write permission (BDK notes §2) | v2 Mode 5 (lines 220-230) has no requirement that a run confirm it wrote its log entry (brief §9 Mode 5 adds it) |
| BDK | `80738a4` | iPhone Safari kept hover on the last tapped choice, which looked like a hint | Missing: device check |
| BDK | `71da38b` | 16 generated questions named their own answer | v2 Mode 4 asks "does the stem give the answer away", as review only; missing: an automated check |
| BDK | not done | the spec's ID1 Organism wording check was neither done nor reported as skipped | v2 lines 244-246 cover checks, not spec steps; brief §7.6 adds "skipped steps are listed" |

## 6. Check results per drill

How the runs were done (2026-10-31): each repo was cloned into the session
scratchpad at the same commit as `origin/main`, and every check ran there, one
command at a time, so one failure could not hide another. Afterwards the four
source clones still showed an empty `git status` and the same `HEAD`. Tools:
node v22.22.0, Python 3.13.17, Playwright 1.63.0 (Node, installed globally; Python,
installed into a scratch venv), Chromium build 1243 from `/opt/pw-browsers`,
pdfplumber 0.11.10. Several PK scripts hard-code `/mnt/user-data/outputs`; that path
was redirected to a scratch folder for the PK run and stayed empty.

**WebKit / mobile Safari: NOT RUN in all four drills.** This container has no
WebKit engine, and no drill has a Safari test. BDK's `tests/ui.js:105` uses
`devices['iPhone 13']`, which emulates an iPhone screen inside Chromium; it is not
Safari. No check ran on a real phone, and no live site was opened.

A report-only check is listed as REPORT: it always exits 0 and has no failing
condition, so it cannot pass or fail.

### 6.1 Medicinal-chemistry (`03a314d`, run from `src/`)

| Check | Result | Output |
|---|---|---|
| `python3 build.py` | PASS | "19 sources and sw.js parse cleanly"; wrote `index.html` (6.55 MB) |
| `node test.js` | PASS | "All checks passed": 387 questions, 13 topics, 189 images; randomized, so run 10 times: 10 of 10 passed |
| `node style_check.js` | PASS | all 387 stems clean; 387 of 387 citations name a slide (369 by number, 18 by title) |
| `node render_test.js` | PASS | "Render smoke test passed" (9 views) |
| `node explain_check.js` | REPORT | 363 of 387 questions carry at least one issue (332 with a wrong option that names no error, 101 thin option explanations, 1 vague reference, 1 missing gloss) |
| `python3 cite_check.py` | NOT RUN | printed "NOT RUN: no lecture PDFs found under yen/ or the working directory." The decks are not in the repo |
| `python3 coverage_check.py` | PASS | "no holes found against the stated scope" (24 topics ok); the scope is written into the script |
| `python3 browser_test.py` | PASS | "Browser smoke test passed", 65 ok, 0 fail (Python Playwright from the venv) |
| `python3 sw_test.py` | PASS | "Service worker test passed (20/20)" |

Totals for the 8 check scripts: 6 PASS, 1 REPORT, 1 NOT RUN.
Build reproducibility: the rebuilt `index.html` and `PHAR4342_Final_Drill.html` are
byte-identical to the committed files (no tracked file changed).
Exit codes: `cite_check.py` exits 0 when it does not run (`src/cite_check.py:171`,
`185`), and `coverage_check.py` always exits 0 (`src/coverage_check.py:196`), so
neither can stop a chained command; only their printed text shows the result.

### 6.2 Basic-Pharmacokinetics- (`ac2eb73`, run from `src/`)

| Check | Result | Output |
|---|---|---|
| `python3 build.py` | PASS | 37 sources parse; 8.78 MB written to the outputs path and the repo root |
| `node test.js` | PASS | 829 questions; 40 of 40 marks drawable; "All checks passed" |
| `node style_check.js` | PASS | all 829 stems clean |
| `node render_test.js` | PASS | "Render smoke test passed" |
| `node step_check.js` | PASS | 2468 lines parsed, 140 skipped; 525 final values checked; no arithmetic hits |
| `node explain_check.js` | REPORT | 70 of 829 questions carry an issue (62 thin, 10 with no diagnosis) |
| `node sources_check.js` | PASS, name scan skipped | the name list `decks/private_names.txt` is gitignored and not on hand |
| `python3 cite_check.py` | SKIP | "SKIP: no lecture PDFs found under decks or ." |
| `python3 browser_test.py` | PASS | 75 ok, 0 fail |
| `python3 problemset_test.py` | PASS | 11 ok |
| `python3 equation_test.py` | PASS | 33 ok |
| `python3 review_test.py` | PASS | 213 ok |
| `python3 stepper_test.py` | PASS | 231 ok |
| `python3 sweep_test.py` | PASS | 236 ok |
| `python3 sheets_test.py` (after `gen/sheets.py`: 140 PDFs, 0 reprinted) | PASS, name scan skipped | also reports 185 parts worded differently from `STYLE.md` and 4 quizzes with no Drive original, as reports |
| `python3 ink_test.py` | PASS | 100 ok |
| `python3 modcolor_test.py` | PASS | 8 ok |
| `python3 notes_test.py` | PASS | 36 ok |
| `python3 place_test.py` | PASS | 24 ok |
| `python3 var_test.py` | PASS | 22 ok |
| `python3 walk_test.py` | PASS | 475 ok |
| `python3 weak_test.py` | PASS | 28 ok |
| `python3 why_test.py` | PASS | 34 ok |
| `node rewrite_check.js <file>` over 23 committed files | FAIL on 8 files | 40 passages exceed its limits (paragraph 320, bullet 240, explanation 340 characters): 16 in `guide.js`, 11 in `q7_module6.js`, 13 in six other files. Its header says it checks a rewrite against the committed version, and neither README lists it, so this measures committed text against the rewrite limits; it is not a gate that broke |
| `node guide_check.js` | NOT RUN | needs a rewritten-guide fragment as input; none in the repo |
| `node tell_check.js` | NOT RUN | needs a tell-apart fragment as input; none in the repo |

Totals for the 25 check scripts: 20 PASS (two with their name scan skipped),
1 REPORT, 1 SKIP, 1 FAIL, 2 NOT RUN.
Five further `verify_q*.py` scripts: `verify_q3.py`, `verify_q4_module4.py` and
`verify_q5_module5.py` PASS; `verify_q1_module1.py` and `verify_q2_module2.py`
FAIL before checking anything ("OSError: [Errno 7] Argument list too long"),
because each passes its whole question file as one argument to `node -e`
(`verify_q1_module1.py:12`). The files are 147,043 and 135,861 bytes; this
container refuses a single argument of 131,072 bytes and accepts 131,071
(tested), so both scripts stopped working once the banks grew past that size.
Build reproducibility: only the build stamp changed (`BUILD_AT` in
`PHAR4221_Drill.html` and `version.json`, 1 line each).

### 6.3 Intro-Pharmacology- (`85c220f`, run from `exam1-drill/src/`)

| Check | Result | Output |
|---|---|---|
| `python3 build.py` | PASS | antidotes (7 pages) built; 76 sources parse; 13,485 KB written |
| `node test.js` | PASS | 2742 questions; "passed (0 failures, 0 warnings)" |
| `node style_check.js` | PASS | "passed (0 failures)" |
| `node stepper_test.js` | PASS | 43 step-throughs, 0 problems |
| `NODE_PATH=$(npm root -g) node browser_test.js` | PASS | answered 40 quiz items (3 select-all) and an exam of 50 |
| `node daily/glitch.js` (site served locally) | PASS | "no issues" at 390 and 1200 px; the script has no `process.exit`, so it exits 0 whatever it finds |
| simulated-student review (`daily/STUDENT.md`) | NOT RUN | it needs AI "students" to sit the paper; no script runs it |
| light/dark sweep (`share/PORTING.md` §4) | NOT RUN | no script in the repo |
| `cite_check`, `explain_check`, `coverage_check` | NOT RUN | not built for this course (`claude/drill-app-state.md`, top section) |

Totals for the 4 check scripts plus `glitch.js`: 5 PASS.
Build reproducibility: only the `BUILD_INFO` line changed (id, time, commit), in
`exam1-drill/PHAR4344_Exam1_Drill.html`, `exam1-drill/version.json` and `index.html`,
1 line each; no generated source file changed.

### 6.4 BDK (`340a396`, run from the repo root)

| Check | Result | Output |
|---|---|---|
| `python3 tools/build.py pages.json pages_prior.json out/` | NOT RUN | `FileNotFoundError: ... 'pages.json'`; its inputs come from `tools/extract.py` run on the BDK PDFs, which are not in the repo |
| `node --check assets/app.js` | PASS | inside each `run-all.sh` call |
| `tests/run-all.sh data` | PASS | 14 pass, 0 fail |
| `tests/run-all.sh ui` | PASS | 21 pass, 0 fail |
| `tests/run-all.sh refresh` | PASS | 11 pass, 0 fail, including "version.json matches APP_VERSION" |
| `tests/run-all.sh cram` | PASS | 13 pass, 0 fail |
| `tests/run-all.sh regression` | PASS | 18 pass, 0 fail; answered 3510 of 3510 questions |

Totals for the 5 suites: 5 PASS; the deck build NOT RUN. Each suite ran on its
own; the five were not run together in one `run-all.sh` call.
Build reproducibility: not checked, because the deck build could not run; the
app itself has no build step.

### 6.5 Device lint (capability 5): regex lookbehind in the shipped pages

| Drill | Occurrences | Where | Form |
|---|---|---|---|
| MC | 0 | — | — |
| PK | 4 on 3 lines | `src/views.js:1087` (`askSentence`, variables quiz, added in `f013ced`), `4937` (`whySentences`, set-up reasoning, `0f266e5`), `5796` (`gwSents`, guide walkthroughs, `bc8321d`) | regex literals in the page script |
| PH | 1 | `exam1-drill/src/app.js:2377` (`drLane`) | regex literal in the page script |
| BDK | 2 | `assets/app.js:295` (`maskNames`, single-fact questions), `655` (`loadGlossary`) | strings passed to `new RegExp` |

PK's notes say older Safari rejects lookbehind, which is why `db37384` removed it.
What follows comes from reading the code and from the JavaScript rule that an
invalid regex literal is a syntax error for the whole script; it was not run,
because there is no WebKit here. In a browser that rejects lookbehind, PK's and
PH's page script would fail to parse, so the drill would not start. BDK's
patterns are built at run time: `maskNames` runs during start-up, and its error
would reach the `.catch` at `assets/app.js:2493`, which shows "The decks could not
be loaded"; the glossary error is discarded by the `.catch` at `assets/app.js:2491`,
so tap-to-define would be missing.

## 7. Brief §10 findings: status after this phase

| Finding | Status | Evidence |
|---|---|---|
| No `exam-drill-template/` on any main branch | Confirmed, and on no branch and in no commit | §2 |
| MC: 12 sources named in `src/README.md` not in the repo | Confirmed: none of the 12 is in any commit on any branch | `git log --all -- src/<name>` |
| MC: three missing SKILL.md steps fixed in `4a32dad`, `ed38dbd` | Confirmed: both commits exist and touch the files named | `git show --stat` |
| MC: `main` unprotected | NOT VERIFIED this session: the repo was not attached, so the GitHub API was not available | MC notes §5 |
| PK: SKILL.md names 7 checks, the repo runs 25 | Confirmed: 7 in v2 (lines 152-157); 25 check scripts on `main` (15 `*_test.py`, 7 `*_check.js`, `cite_check.py`, `test.js`, `render_test.js`); results in §6.2 | `ls src` |
| PK: `ingest.py` never used | Confirmed: no commit on any branch contains it | `git log --all -- src/ingest.py ingest.py` |
| PK: lookbehind returned in three places | Confirmed: `src/views.js:1087`, `4937`, `5796` | §6.5 |
| PK: README count stale | Confirmed: `README.md:14` says 620 questions; `test.js` counts 829 in the build (§6.2) | |
| PH: installed SKILL.md is not the share draft | Confirmed: 245 vs 317 lines | |
| PH: scripts SKILL.md names do not exist | Confirmed: no commit on any branch has `ingest.py`, `harvest.py`, `render_test.js`, `explain_check.js`, `cite_check.py`, `coverage_check.py` or `browser_test.py` in `exam1-drill/src/` | `git log --all -- exam1-drill/src/<name>` |
| PH: state doc last updated 2026-09-28 | Confirmed: header reads "Updated 2026-09-28" (`claude/drill-app-state.md:3`) while entries run to 10-30 | |
| PH: Exam 4 has no question count | Confirmed: `questions:null` at `exam1-drill/src/course.js:101` | |
| BDK: skill never invoked | Not checkable from git; BDK notes cite the transcript | |
| BDK: 10/30 review had no write access and reported success | Partly sourced: BDK notes §2 say the run had no write access, did no review, and its report asked for write permission; they do not say the task was marked succeeded, and that is not checkable from git. `reviews/LOG.md`'s last entry is 2026-10-28 | |
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

1. ~~Engine for the core~~ Decided 2026-11-01: the core is assembled from the best
   version of each part, starting from the recovered template (`KIT_DESIGN.md` §12.2).
2. ~~Default scheduler~~ Decided 2026-11-01: the concept scheduler is the default and FSRS
   is an option a course can switch on; research on improvements and on a combination
   was requested and is reported separately before anything is built.
3. ~~BDK's service worker~~ Decided 2026-11-01: fix it now in BDK, and improve how BDK
   keeps the offline copy and progress.
4. Merge MC's corrected notes `3b87e8a` into MC's `main`?
5. ~~Do you still have `PHAR4342-medchem.bundle`?~~ Answered 2026-11-01: Louis supplied
   it (§11). New question: restore MC's 09/21 round to the MC repo, keep it only in
   the kit, or both?
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
12. Decided 2026-11-01: the scheduler proposal (`scheduler-proposal.md` 4.1, 4.2,
    4.3) is approved for the kit, with FSRS-7 fitted to the student's own reviews as
    the FSRS option; BDK's own FSRS upgrade is a separate decision.
13. Decided 2026-11-01: add a Home Screen tool to BDK (Louis: "a neat tool to
    utilize").
14. Decided 2026-11-01 (Louis: "lets do what you best recommend"): MC's recovered
    history is preserved on GitHub as branch `restore/2026-09-21-round` (`baed236`)
    in Medicinal-chemistry, with `main` and the live site unchanged, and the
    template is kept in the kit at `history/exam-drill-template-2026-10-02/`. The
    09/21 round joins MC's live drill when MC moves onto the kit core (Mode 7).
15. Decided 2026-11-01 ("lets go with your best recommendation"): BDK keeps
    FSRS-4.5 until it moves onto the kit core; the FSRS-7 upgrade happens then.

## 10. Improvement proposals

No learning-science research was done in this phase, so nothing below rests on it.

1. **Delivery confirmation.** After every push, compare the published page's
   question and image counts with the counts in `CLAUDE.md`, and fail the session
   report when they differ. Why: MC's 09/21 round never reached GitHub, and the
   skill had no step that would have shown it (MC corrected notes §0, §7.2). Looks
   like: one script in `core/checks/`. Cost: small. Risk: none to content.
2. **WebKit in CI.** A GitHub Actions workflow that runs the browser test in
   Playwright's WebKit on every push. Why: this container has Chromium only (§6),
   three of the four drills ship regex lookbehind today (§6.5), and earlier faults
   showed only on Safari or on phones (BDK iPhone hover `80738a4`; PH tap targets
   `d1df52f`). A static lint for lookbehind can run now, in every container. Cost: Actions minutes per push. Risk: Playwright's WebKit is not the
   same build as iOS Safari, so a pass does not prove an iPhone pass.
3. **A negative control for every check.** Each check ships with an input it must
   reject, and the suite fails if that input passes. Why: MC's three checks that
   passed while unable to fail; PK `041274d`'s highlighter test that could not fail
   until its colours changed. Cost: one fixture per check.
4. **Shared-origin rule as a check.** A check that fails when a service worker
   deletes caches outside its own prefix. Why: §4, BDK `sw.js:8-9`. Cost: small.
5. **Exit codes that a chain can trust.** Every check exits 0 on pass, 1 on fail
   and a separate code for NOT RUN or SKIP. Why: MC's `cite_check.py` and
   `coverage_check.py` exit 0 whatever they find (§6.1), so the `&&` chain in v1
   lines 120-122, which runs both, carries on past a NOT RUN or a coverage hole;
   PH's `glitch.js` also exits 0 whatever it finds (§6.3), so a scheduled run
   cannot tell from the exit code that it found a glitch. Cost: a few lines per
   script.

## 11. Update 2026-11-01: the recovered bundle and template

Louis uploaded two files on 2026-11-01: `medchem-repo.bundle` (11,987,186 bytes,
md5 `0f18c31d3284b4050dfdd590af9111be`) and `exam-drill-template.zip` (121,544
bytes, md5 `98dadd13fbe0383fa59d1ea5a519a48f`). Both were inspected in scratch
folders with `git` and `unzip` only; nothing from them was run, and nothing was
pushed anywhere.

- **The bundle is the local medchem history that never reached GitHub.** Its `main`
  is `baed236` and it has 10 commits. It shares only the initial commit `697ae8b`
  with GitHub's `main`; the other 9 are its own (`65e2aff` on 2026-09-20 through
  `2ebfade` on 2026-09-21 and `baed236` on 2026-10-02). GitHub's uploads
  (`966c82e` to `9103bc6`) and fixes (`4a32dad`, `ed38dbd`) are not in it, so each
  side has work the other lacks.
- **`2ebfade` (2026-09-21) is the 09/21 round** the MC state doc describes: commit
  message "Course manifest, tell-apart and typed items, confidence and pace,
  exports, ingest script; reusable template". At `baed236` the drill lives at
  `medicinal-chemistry/PHAR4342-final-drill/` (the path v2 lines 17-18 name) with
  `course.js`, `ingest.py`, `q14_tell.js` and `q15_types.js`, and the template at
  `exam-drill-template/` (29 files).
- **The 92 questions are there.** Every question id in GitHub's 13 question files
  is also in the bundle (0 missing), and the bundle has 92 ids GitHub lacks, all in
  `q14_tell.js` (89) and `q15_types.js` (3). 479 − 387 = 92, the gap in MC
  corrected notes §0. The shared question files differ from GitHub's by added
  fields, for example a `skill:` line on 39 questions in `q1_cyp.js`.
- **7 of the 12 missing sources are in the bundle** (`harvest_yen.py`,
  `harvest_yen2.py`, `harvest_yen3.py`, `cyp_images_spec.json`,
  `yen_images_spec.json`, `yen2_images_spec.json`, `yen3_images_spec.json`).
  `add_cyp_q.py`, `attach_cyp.py`, `attach_yen.py`, `attach_yen2.py` and
  `attach_yen3.py` are in no commit of the bundle either.
- **The zip is the bundle's template, byte for byte:** its 29 files match
  `exam-drill-template/` at `baed236` with 0 differences. `baed236` (2026-10-02)
  ported PH's engine upgrades into the template ("rewritten against this engine;
  no course content carried over"): change log, session and review plan,
  `links.js`, step-through figures with `stepper_test.js`, Diagrams tab,
  Explain-one cards, optional blueprint draw, exam countdown. The MC notes listed
  this port as not done (§5 there); it was done on 2026-10-02 and never pushed.
- **The template is not PK's parent.** PK's first engine (`08f16b6`, 2026-09-22)
  and the 09/21 template (`2ebfade:exam-drill-template/`) both come from MC's
  engine but differ throughout (for example `views.js`: 1,640 and 1,204 lines with
  1,434 differing lines by `diff`). So engine 1 in `proposed-core.md` §0 exists in
  four copies: MC on GitHub, MC in the bundle, the template, and PK.
- **What only the bundle has:** `ingest.py`, which v2's Mode 2 depends on and which
  no GitHub repo contains, and a course-agnostic template with no course content.
