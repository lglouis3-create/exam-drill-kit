# Proposed shared core (Phase 1, for Louis's approval)

Sources: the four course repos at `origin/main` (Medicinal-chemistry `03a314d`,
Basic-Pharmacokinetics- `ac2eb73`, Intro-Pharmacology- `85c220f`, BDK `340a396`),
read on 2026-10-31. File and line references are to those commits. Nothing
here has been built yet; each pick is a proposal for Phase 2.

No study data, exam outcome or retro compares these implementations, so every
pick below rests on what the code does, which defects it has, and what tests
cover it. None rests on a measured learning result.

## 0. Which engine the core starts from

The four drills run three separate engines:

1. **Medicinal-chemistry / PK engine** (`src/shell.html` + `src/views.js`). PK's
   `08f16b6` (2026-09-22) ported it from medchem; both files still carry the
   same storage shim comment and the same scheduler constants
   (medchem `src/shell.html:401-500`, PK `src/shell.html:1435-1523`).
2. **Pharmacology engine** (`exam1-drill/src/app.js`). `86a44e7` (2026-09-26)
   wrote it new: a 466-line `app.js` and an 87-line `shell.html`, with no file
   shared with engine 1.
3. **BDK** (`assets/app.js`, multi-file static site), built from Louis's deck
   spec on 2026-10-21 without the skill (BDK notes, top).

Features moved from engine 2 into engine 1 three times, each time as a second
copy of the code: `c01b619` and `d9b6a4e` (2026-10-02), `30154d4` and `52156ed`
(2026-10-17), and `bc8321d` (2026-10-26). That duplication is what brief §1
asks the kit to remove.

**Proposal.** Start the core from PK's current engine (engine 1), because it
already contains medchem's engine and the pharmacology features ported twice,
it has the widest check suite (25 check scripts on `main`), and it implements
v2's numeric item type with worked steps and the kind-of-miss log. Pharmacology's
banks hold matching items (29, counted by `grep` over `exam1-drill/src/q_*.js`)
and a `fill` type (`app.js:813`), but no numeric items, and `app.js` has no
grading path for `type === 'numeric'`. Replace its storage with pharmacology's (§2) and fix its exam draw (§9).
Pharmacology-only features become feature modules ported onto that base, and
BDK's study modes become feature modules too (`FEATURES.draft.md`).
**Decision for Louis**, because it decides how much of pharmacology's
`app.js` is rewritten in Phase 2.

## Summary table

| Core part | Medicinal-chemistry | PK | Pharmacology | BDK | Proposed core |
|---|---|---|---|---|---|
| Course manifest | none on GitHub (settings hard-coded) | `src/course.js` | `exam1-drill/src/course.js` | none (`QUIZZES`, `TOPICS`, `APP_VERSION` in `assets/app.js`) | Pharmacology's schema, plus PK's module labels, plus new `features` and `kit` blocks |
| Storage | `LS` shim | same `LS` shim, adds `del` | `store` with per-key failure tracking and a notice | `store` with no fallback | Pharmacology's `store`, with medchem/PK profiles |
| Scheduler | concept Leitner, two clocks | same, plus pharmacology's concept statuses (ported) | question Leitner with paced time steps, plus concept statuses | FSRS-4.5 per card | PK's current scheduler as the default; FSRS as a feature behind the same interface |
| Offline mode | `sw.js`, network-first with timeout, prefix-scoped cleanup | none | none | `sw.js`, deletes every other cache on the origin | Medchem's `sw.js`, with the prefix taken from `COURSE.ns` |
| Update notice and place restore | `sw.js` offers a reload | `version.json` written by the build, poll, place restore with `place_test.py` | `version.json`, bar in header, place restore, exam result resumes | `version.json` bumped by hand, place restore, Back stack, `tests/refresh.js` | Build-written `version.json`, PK's place restore and test, pharmacology's exam-result resume |
| Build | `src/build.py`, app written to repo root | `src/build.py`, atomic writes, `version.json`, changelog, two outputs (one a sandbox path) | `build.py` runs generators, embeds changelog, copies to root | none for the app; `tools/build.py` is a PDF-to-deck pipeline | PK's build, writing only to the repo root, with pharmacology's generator step |
| Checks | 8 check scripts plus `build.py` | 25 check scripts plus `build.py` | 4 check scripts plus `build.py` and `src/daily/glitch.js` | `tests/run-all.sh` and 5 suites | A shared suite (below) |
| Pages setup | app at root `index.html`, `.nojekyll`, `manifest.json`, icons, old file name redirects | `index.html` redirects to `PHAR4221_Drill.html`, `.nojekyll` | root `index.html` is a copy of the build, `.nojekyll` | app at root, `.nojekyll`, `manifest.webmanifest` | Medchem's layout, plus PK's deploy confirmation from the workflow run |
| Exam draw | one blocked set across pools (`ed38dbd`) | blocked set per pool (defect) | blocks siblings of one original | no exam sim | Medchem's shared set plus pharmacology's sibling rule, plus PK's paper persistence |
| Analytics and export | export and import; "I guessed" | export and import; kind of miss; time per kind | export and import; concept statuses | export and import; FSRS recall | New core module (capability 2) built on PK's answer log |
| State record | four docs in the Claude Project, none in repo | `notes/*.md`, no state doc | `claude/drill-app-state.md` in repo | `CLAUDE.md`, `reviews/LOG.md`, `reviews/OPEN_QUESTIONS.md` | BDK's files, plus pharmacology's restore section |

The script counts in the Checks row are the files present on `main`. Whether
each one passes is reported in `findings.md` §6.

## 1. Course manifest (`course.js`)

- **PK** `src/course.js` (first commit `08f16b6`, 2026-09-22): `id, title,
  short, ns, output, professors, lectures, exams[{pools[{key, name, marks,
  filter}]}], activeExam, skills, paceDefault` (`src/course.js:25`, `29`, `50`,
  `107`, `188`, `200`, `278`). The checks read `output` from it
  (`src/build.py:76-87`).
- **Pharmacology** `exam1-drill/src/course.js` (first commit `86a44e7`,
  2026-09-26): the same base fields, plus `decks`, `scope`, `when`, `facts`,
  `marks:null` (draw by eligible count) and `blueprint` (`share/PORTING.md:24`).
  Exam 4 has `questions:null` (`exam1-drill/src/course.js:101`).
- **Medicinal-chemistry**: no manifest on GitHub. The settings are hard-coded:
  namespace `src/shell.html:399`, exam text `src/views.js:370`, select-all
  ratio and pool sizes `src/views.js:970-979`, 75-minute timer
  `src/views.js:982`. Its corrected drill notes (branch
  `claude/drill-notes-project-sources`, §3) record that a `course.js` was
  built on 2026-09-21 and never pushed.
- **BDK**: no manifest. The quiz schedule is `QUIZZES` at `assets/app.js:42`,
  and the version is `APP_VERSION` at `assets/app.js:6`.

**Proposal.** Use pharmacology's schema, because it holds every PK field plus
the five additions above, and both drills' engines already read the shared
base. Add PK's module display labels (`src/course.js:96-98` record that Module 9 shows as "7b"). Add two blocks that no drill has yet:
`features: {<name>: {version, ...options}}` (brief §5) and
`kit: {core: '<version>'}`, so a course stays pinned until Louis asks for an
update (brief §7.5). BDK's `QUIZZES` entries (label, start, until, pages)
become `exams[]` entries, so BDK can use the manifest without code changes to
its schedule data.

## 2. Storage

- **Medicinal-chemistry / PK** `LS` (`src/shell.html:401-420` medchem;
  `src/shell.html:1435-1453` PK): it probes `localStorage` once at load and
  falls back to memory when the probe fails, and the header shows
  "(progress not saved)" (`src/shell.html:466` medchem). It has a defect: when
  the probe succeeds and a later write throws (storage full), `set` keeps the
  value in `mem`, but `get` still reads `localStorage` because `ok` is true
  (`src/shell.html:415-418`), so the new value is not read back within the
  visit. Medchem and PK both keep profiles under `NS:data:<profile>`
  (`src/shell.html:422-423` medchem).
- **Pharmacology** `store` (`exam1-drill/src/app.js:79-95`): it tracks each
  key whose write failed (`FAILED`), serves that key from memory until a
  write succeeds, and shows a notice once that names the export path
  (`saveWarn`, `app.js:89-98`). It also has profiles (`app.js:99`).
- **BDK** `store` (`assets/app.js:136-144`): a write that throws is dropped
  with no in-memory copy and no notice, and the `bdk2:` prefix is hard-coded.

**Proposal.** Use pharmacology's `store`, because it is the only one that
keeps a failed write readable for the visit and tells the student. Keep the
profile namespacing that medchem, PK and pharmacology share. The `ns` rule
stays as written in all three manifests: never changed in a redesign or core
update (brief §7.4).

## 3. Scheduler

Three designs exist across the four drills:

- **(a) Concept-level Leitner with two clocks.** Medchem `src/shell.html:468-500`:
  `DAYS = [0, 1, 3, 7, 14, 30, 60]` for long-term pace and
  `CRAM = [0, 8, 20, 45, 90, 160, 260]` counted in questions answered, `GAP = 4`
  questions before a missed concept returns, a different question on the same
  concept preferred, mastery at box 3. The comment block records it as
  "Rules implemented (Louis's spec)" with seven rules (`src/shell.html:470-479`).
  PK carries the same engine with the same constants (`src/shell.html:1508-1523`) and added
  pharmacology's concept statuses on top in `593c704` (2026-10-17).
- **(b) Question-level Leitner with paced time steps.** Pharmacology
  `exam1-drill/src/app.js:155-172`: three pace tables (cram, weekly, semester)
  in minutes to days, with "I guessed" and "Not sure" handled separately, and
  a concept-status layer (`conceptRecord`, `app.js:1147`) whose rules are in
  `exam1-drill/notes/ENGINE_UPGRADES.md` §2.
- **(c) FSRS-4.5 per card.** BDK `assets/app.js:374-384`: default
  parameters, pass/fail grading, target retention 0.9, predicted recall on the
  quiz day; formulas taken from the open-spaced-repetition wiki
  (`assets/app.js:376`). BDK's Learn mode uses successive relearning
  (`assets/app.js:1619`).

**Proposal.** Core holds one scheduler interface (`schedule(item, outcome)`,
`due()`, `status(concept)`) and design (a) as the default, in PK's current form
with the concept statuses. Reasons: (a) is the only design recorded as Louis's
specification; it schedules concepts, so a retest arrives in a different
wording; its cram clock counts questions answered, so it works inside one
sitting the night before an exam; and PK's `593c704` shows it combines with
pharmacology's concept statuses. FSRS goes into the feature library as
`memory-model-fsrs`, implementing the same interface, for courses whose
material is a fixed list of facts studied over weeks (BDK's case). Design (b)
is archived as `scheduler` v1 from pharmacology rather than discarded
(decision 4). **Decided by Louis, 2026-11-01:** the concept scheduler is the default
and FSRS is an option a course switches on; he asked for research on how to
improve it and whether a combination can serve a course that needs one.

## 4. Offline mode (service worker)

- **Medicinal-chemistry** `sw.js` (`ed38dbd`, 2026-10-30): network-first,
  falls back to the saved copy when offline or slower than `NET_TIMEOUT = 3500`
  ms, tells the page when a newer copy arrives, never reloads by itself, and
  deletes only caches named with `PREFIX = 'phar4342-drill-'` because every
  site under `lglouis3-create.github.io` shares one origin and one Cache
  Storage (`sw.js:1-22`). Tested by `src/sw_test.py`.
- **BDK** `sw.js` (18 lines): network-first with no timeout, and on activate
  it deletes every cache whose name is not `bdk-v15` (`sw.js:8-9`). On the
  shared origin, that would delete medchem's `phar4342-drill-v1` cache, so
  medchem's drill would no longer open offline until it is visited online
  again. That consequence comes from reading the code; it was not run in a
  browser.
- **PK, Pharmacology**: no service worker.

**Proposal.** Use medchem's `sw.js`, with `PREFIX` derived from `COURSE.ns`
and the precache list written by the build. BDK's cleanup rule was fixed in
BDK `c78e78d` on 2026-11-01 (prefix-scoped cleanup, a 3.5 s network fallback,
and `tests/offline.js`, which the core can reuse as its `sw_test`).

## 5. Update notice and place restore

- **PK**: `version.json` is written by the build (`src/build.py:191`); the page
  re-reads it every 15 minutes and when the tab returns, and offers Reload
  (`src/views.js:5766-5771`, `71ce449`). Place restore is
  `PLACE_KEY` (`src/views.js:6389-6447`, `fb39200`), tested by `src/place_test.py`
  (tab, open sections, question and scroll position at 390 px and 1200 px).
- **Pharmacology**: `version.json` with the bar in the header
  (`exam1-drill/src/app.js:3799-3802`, `557d93d`, `d25bf95`); the exam result
  page resumes after a refresh (`d25bf95`); `browser_test.js` reloads in
  several cases (`exam1-drill/src/browser_test.js:100-155`).
- **BDK**: `version.json` and the cache name are bumped by hand with
  `tools/bump-version.sh`, which must keep three values in step
  (`APP_VERSION`, `version.json`, the `sw.js` cache name);
  `saveSpot`/`restoreSpot` and a Back stack (`assets/app.js:1040`, `1123`,
  `1160`); `tests/refresh.js` checks that every screen comes back with nothing
  recorded twice.
- **Medicinal-chemistry**: `sw.js` tells the page when a newer copy arrives.

**Proposal.** The build writes `version.json` (PK, pharmacology), because a
hand-run bump step can be skipped. Use PK's place restore and its test, add
pharmacology's exam-result resume, and add BDK's rule that a refresh records
no answer twice as a test case. BDK's Back stack goes to the feature library
(`back-navigation`).

## 6. Build

- **PK** `src/build.py` (196 lines): `node --check` on every source and on
  the assembled script, writes through a `.tmp` file and `os.replace`, embeds
  `CHANGELOG.md`, writes `version.json`, and reads the output name from
  `course.js`. It writes two copies: one to `/mnt/user-data/outputs/<output>`
  (`src/build.py:76-87`) and one to the repo root (`src/build.py:182-192`).
  Its checks read the first copy, which is a sandbox path.
- **Medicinal-chemistry** `src/build.py` (114 lines): writes the app to the
  repo root as `index.html` and the old file name as a redirect
  (`src/build.py:20-31`, `4a32dad`).
- **Pharmacology** `exam1-drill/src/build.py` (98 lines): runs each
  `gen_*.py` generator and the antidotes build first (`build.py:18`, `28`),
  embeds the changelog, writes through `.tmp`, and copies the result to the
  repo root `index.html` (`build.py:90-95`).
- **BDK**: the site is static files with no app build. `tools/build.py`
  (568 lines) turns the BDK PDF table into deck data and Quizlet files.

**Proposal.** Use PK's build, because it has every safeguard the others have
(syntax checks, atomic write, changelog, version stamp). Write only to the
repo root, as medchem has done since `4a32dad`, so no check reads a sandbox
path. Add pharmacology's generator step. Keep single-file output as the
default, because three of the four drills use it and pharmacology republishes
the file as an artifact; large media stays in folders beside the page, as PK
(`audio/`, `slides/`, `sheets/`) and pharmacology (`audio/`, `slides/`,
`media/`) already do. BDK's PDF-table pipeline goes to the feature library
(`table-deck-generator`).

## 7. Checks

Proposed shared suite, each check taken from the drill named:

| Check | From | What it proves |
|---|---|---|
| `test.js` | PK (`08f16b6` README) | bank integrity, manifest, pool resolver, grading of every question type, blueprint draw, scheduler rules, storage namespacing |
| `style_check.js` | medchem / PK | rejected phrasing, citation coverage, change-log bullet length |
| `render_test.js` | medchem, with its data-URL strip | every view renders with no `undefined`, `NaN`, `[object Object]` |
| `explain_check.js` | medchem / PK | report only: weak explanations by exam weight |
| `cite_check.py` | PK (handles deck names with spaces, `31f019f`) | cited slide numbers exist; NOT RUN when decks or `pdfplumber` are missing |
| `coverage_check.py` | medchem | thin and empty topics against the documents that define the exam |
| `step_check.js` | PK (`f4b60c3`) | every printed `expression = value` recomputes; runs on numeric items |
| `sources_check.js` | PK (`4ce505d`) | personal-name patterns, from a gitignored list, absent from the build |
| `sweep_test` | PK (`c01b619`) | every tab at 375 and 1100 px, light and dark, no page errors |
| `sw_test` | medchem (`ed38dbd`) | offline open, network-first, update offer, prefix-scoped cleanup |
| `place_test` | PK (`fb39200`) | reload returns to the same place |
| browser test | pharmacology `browser_test.js` (Node) or PK `browser_test.py` | answers questions through the real controls; denies `localStorage` |
| new: device lint | none exists | fails on regex lookbehind and other syntax older Safari rejects; PK, PH and BDK ship lookbehind today (`findings.md` §6.5) |
| new: WebKit run | none exists | the browser test in WebKit (capability 5) |
| new: state freshness | none exists | `CLAUDE.md` updated after the newest lecture (brief §7.8) |

Rules carried from the drills' fixes: a check that cannot run reports NOT
RUN (medchem `cite_check.py` crashed on a missing `pdfplumber` at
`src/cite_check.py:16`); a check that passes over zero items is a failure
(medchem `claude/drill-checks.md`, quoted in the corrected notes §2.8-2.10);
each new check is shown to fail once on a known-bad input (PK `041274d` body).

Browser test: all three ran and passed (`findings.md` §6): MC `browser_test.py`
(65 ok) and PK `browser_test.py` (75 ok) needed Python Playwright installed into a
venv first; PH `browser_test.js` ran on the Node Playwright this container already
has. **Proposal:** the Node harness as core, because it needs no install step in a
cloud session, with PK's cases (every question answered through the real
controls, `localStorage` denied) ported into it.

Exit codes: a check exits 0 on pass, 1 on fail, and a separate code for NOT RUN
or SKIP. MC `cite_check.py` and `coverage_check.py` and PH `daily/glitch.js` exit
0 whatever they find (`findings.md` §6.1, §6.3).

## 8. Pages setup and delivery

**Proposal.** Medchem's layout: the app is `index.html` at the repo root,
`.nojekyll`, `manifest.json` and icons, and the old file name redirects
(`4a32dad`). The deploy is confirmed from the Pages workflow run for the pushed
commit, because a cloud session cannot reach the site or the Pages REST
endpoint (PK `src/README.md` "Delivery", `c856c50`). A refused push stops the
session with a report; it no longer ends in a zip upload that nothing checks
afterwards, which is the step after which medchem's 09/21 round of 92 questions
never reached GitHub (medchem corrected notes §0, §7.2).

## 9. Exam draw

**Proposal.** One blocked set across all pools (medchem `src/views.js:973-979`,
`ed38dbd`), blocking by the root of a `dupOf` chain (PK `src/views.js:3174-3177`)
and two siblings of one original (pharmacology `exam1-drill/src/app.js:1503`).
Keep PK's paper persistence across a reload (`30ab70b`) and problem parts kept
together in order (`3d9fb75`). PK's own draw starts a new blocked set for
each pool (`src/views.js:3199`, called per pool at `src/views.js:3274-3277`),
which is the defect medchem fixed; core removes it.

## 10. Analytics (capability 2)

What exists: PK logs `missKind` on each answer (`src/shell.html:1465-1469`)
from `MISS_KINDS` (`src/shell.html:1360`), reads a wrong number back to the
error that produces it (`ae9dcb1`), and records time per kind (`5326a60`).
Medchem, PK and pharmacology record "I guessed"; PK and pharmacology also
record "Not sure". All four export and import progress.

**Proposal.** A core analytics module built on PK's answer log, adding
confidence against correctness, retention at each return of a concept, and
which features a student used, all included in the progress export so a
retro (Mode 6) can read them.

## 11. State record (brief §7.8, verified against pharmacology's approach)

- **Pharmacology** `claude/drill-app-state.md` (292 lines, in the repo): the
  header still reads "Updated 2026-09-28" while entries continue to 2026-10-30;
  sections are not in date order (09-28, 10-01, 09-30, 09-29 at lines 13-61);
  no entry falls between 10-01 and 10-12; it ends with a useful "Restore after
  a container restart" section (line 274).
- **Medicinal-chemistry**: four state docs in the Claude Project whose counts
  disagree (277, 277, 337, 479 questions), none in the repo (corrected notes
  §0, §6).
- **PK**: no state doc; state spread over `notes/*.md`, `CHANGELOG.md`,
  `src/README.md` (PK notes §6).
- **BDK**: `CLAUDE.md` (26 lines), `reviews/LOG.md`, `reviews/OPEN_QUESTIONS.md`,
  in the repo.

**Finding.** The brief's choice holds. Claude Code loads `CLAUDE.md` at the
start of every session, so reading the state does not depend on a SKILL.md
step that two medchem sessions and the PK session could not carry out (no
Project access). A file in the repo is versioned, so a check can compare its
last change with the newest lecture's commit; a Project doc cannot be checked
that way. Two additions come from pharmacology: the restore-after-restart
section, and a dated header that the freshness check reads. BDK's own
`CLAUDE.md` names Louis on five lines (`grep -c Louis CLAUDE.md`), so the privacy rule
(§7.9) needs an exception for state files or a role name in their place;
**decision for Louis**.

## 12. Agents

Pharmacology has six agent definitions (`share/agents/*.md`: lecture-writer,
bank-verifier, verify-fix-applier, reading-card-writer, listen-script-writer,
learning-presentation-specialist). PK has three in `.claude/agents/`
(calculation verifier, fix applier, student-journey reviewer; PK notes §1).
The kit layout in brief §4 has no place for them. **Proposal:** add
`core/agents/`, copied into each course's `.claude/agents/` at setup, with
course names passed in the caller's prompt as `share/PORTING.md` §5 already
requires.
