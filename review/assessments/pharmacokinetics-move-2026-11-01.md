# Pharmacokinetics → exam-drill-kit core: assessment

> Read-only assessment written in the kit session on 2026-11-01 by a Claude agent, kept here unchanged as the source the kit documents cite. Paths under `/tmp/...` were scratch copies in that session's container and no longer exist.

**Moving PK by copying the core over its engine would damage Louis's progress and lose most of the course's features.** In a scratch test, the moved page stopped during start-up, and one answer after that replaced a 20-answer save with a 1-answer save. Most of the work needed first is kit work: about 10 core and about 25 feature pull requests, each needing Louis's yes.

The report was not written to `pk-assess/REPORT.md`: the tool refused, saying subagents must return findings as text, so the full report is below. My scripts are in `/tmp/claude-0/-home-user/c8bced46-36ac-5542-9bd6-a604b508c417/scratchpad/pk-assess/scripts/` and their output in `…/pk-assess/logs/`. "views" below means PK `src/views.js`, "shell" means PK `src/shell.html`, and "core views" or "core shell" means the kit's `core/` files.

Nothing was changed, pushed or branched in any repository. The PK clone is shallow (1 commit); no history was fetched. The kit's `core/` is identical at `ff7bd51`, `c4da6c6` and the branch head (`git diff` prints nothing). PK's final was 2026-10-27 (`src/course.js:159`).

**How the scratch work was set up**
- `pk-assess/pk/` is a copy of PK without `.git`. In it, `/mnt/user-data/outputs` was redirected to `pk-assess/out` in 12 scripts (`logs/redirected_files.txt`).
- `pk-assess/trial/` and `pk-assess/trial2/` are scratch "straight moves": the core copied over PK `src/` as `core/README.md` describes.
- Tools: node 22.22.0, Python 3.13.17, Python Playwright 1.63.0 from the existing `scratchpad/pyvenv` (nothing installed), Node Playwright, Chromium 1243.

## Summary

1. **A straight move is not workable.** It builds (829 questions, 7.98 MB), but:
   - start-up stops on PK's `DIAGRAMS` shape;
   - the next answer then overwrites the saved progress (`scripts/overwrite_trial.js`);
   - Notes, Worksheets, Terms, Equations and PK's Diagrams tab are lost;
   - 365 of 829 questions fall outside every exam pool;
   - no calculation reaches an exam paper;
   - typed numbers are graded differently;
   - formulas show as raw `{{frac:…}}` text.
2. **PK's engine is far larger than the core.**
   - `views.js` is 6,491 lines against the core's 2,409; `shell.html` is 1,750 against 1,405.
   - FEATURES.md has 24 entries listing PK, and none is ported: `features/` holds only `README.md`.
   - Nothing reads `course.js` `features`: FEATURES.md line 31 says so, and `grep` over core `build.py`, `views.js` and `shell.html` finds nothing.
   - At least 10 PK features have no catalog entry.
3. **Saved progress carries over once the page starts cleanly.** The scratch progress test passed all 15 checks (`logs/progress_trial2.log`). Two exceptions:
   - PK's kinds of miss are not counted (the core reads `miss`, PK wrote `missKind`), so a converter is needed;
   - notes, ink, equation-drill stats and paper history are kept but shown nowhere until their features are ported.
4. Most of the work is kit pull requests. Because no exam is coming, Louis may want to settle the scope first (Plan, step 0).

## 1. Features

**Tabs:** PK has 13 (shell:1046-1058); the core has 10 (core shell:491-500); trial2 showed 8.

### Kept by the core

- Multiple choice and select-all.
- Weak spots: this session, review plan, per-pool cards, marks at risk.
- What's new: same key and format (core views:348).
- Exam countdown, for exams (the quiz part is lost).
- The "newer version" offer and Reload: `update_test.js` 38 PASS on trial2.
- The place after a reload: the core's code is a port of PK's (core views:2315-2409). The walkthrough part and PK-only tabs are lost.
- Export and import: the core accepts PK's `{profile, db}` file (core views:2146).
- Profiles: "default" opens.
- Images used by questions (`img`, `teachImg`): 128 of 128 decode on trial2.
- Guides, Tell apart and Reference text (same names). In them, `{{frac}}` stays raw, 2 `{{steps:}}` stay raw, 1 hyphenated `{{fig:}}` key is left unexpanded, and PK's fold bar is gone.
- New on PK: offline copy, Home Screen card, answer history, preview build.

### Kept but changed

- **Numeric items:** the core has a number box, steps and miss buttons (core views 874-960), but grades differently (see §2) and prints math as typed.
- **Matching items (6):** the core reads `left` and `right` as column headings (core views 908-930), so headings are garbled and extra right-hand values are lost.
- **Misses by kind:** it reads `a.miss` (core views:1229).
- **Saved paper:** the core expects `{ids}` (core views:1552); PK saved `{qs}`, so the paper is not restored.
- **Exam paper:** typed items are excluded from every paper (`!q.type`, core views:1487 and 1529). PK's Exam 3 had 20 fill-in questions.
- **Exam choice:** only `activeExam` (core shell:535). PK's paper picker and paper history (shell 1099-1217; views 3083-3170) are lost.

### Lost: engine (needs a feature module or core change), PK line ranges

| Feature | PK location | Catalog |
|---|---|---|
| Canvas module menu and exam folds | views 306-464, 547-720 | none for PK |
| Module pages (Concepts, Calculations by type, Worksheets) | views 722-854 | **none** |
| Quiz-prep cards | views 466-546 | **none** |
| Concept/calculation split | views 197-262 | none |
| Plan the problem and set-up drill | views 4754-5120 (fields on 534-555 questions) | listed |
| Wrong-number reading | shell 1271-1356 | listed |
| "No, I was right" | shell `markRight` | **none** |
| Stopwatch | views 1467-1482 | listed |
| One-page layout | views 1435-1903 | **none** |
| Formulas in text: 5,187 `{{frac:` markers in content | views 2-93, 3502-3505 | **none** |
| Terms tab (94 terms, 282 questions); in the core, answering throws "GLOSS is not defined" | views 1029-1260 | glossary entry omits PK |
| Variables quiz (301 items) | views 1072-1147 | listed |
| Extra practice (81 items) | `q11_extra.js` | listed |
| Problem sets in parts (91) | `CHAINS`, `paperOrder` | listed |
| Explain more: "0 of 829 resolve" in the core | views 1262-1433 | listed |
| Origin tags | shell `originOf` | **none** |
| Concept statuses | views 2506-2725 | FEATURES.md line 36 wrongly says core has them |
| Most-likely paper and 197 stars | `likely.js`, views ~3250-3290 | listed |
| Notes tab and flags | views 5564-5654 | listed |
| Clip after a paper | views 3386-3406 | listed |
| Textbook reading cards | views 3646-3695 | listed |
| Diagrams tab | views 2942-3015 | listed |
| Step-through figures (17 `STEPFIGS`, written by PK's build) | views 2839-2940 | listed |
| Equations tab | views 3829-4585 | listed |
| Sheet map | views 4587-4752 | listed |
| Worksheets (64 sources, 140 PDFs) | views 5122-5434 | listed |
| Ink | views 6040-6322 | listed |
| Weak-spot marks | views 5435-5563 | listed |
| Module colours | views 5655-5689 | listed |
| Hear why (166 clips) | views 5690-5765 | listed |
| Walkthroughs (42 sections, 321 parts, 321 clips, 234 slides) | views 5789-6039 | listed |
| Theme: the core has no dark scheme at all | views 6323-6383 | **none** |

- Three of these carry a regex lookbehind, which `device_lint.js` rejects: views:1087, 4937 (two) and 5796.
- Course content that stays in the repo: `course.js` data, question files, `TERMS`, `EQUATIONS`, `SHEET_LINES`, `SOURCES`, `CHAINS`, `likely.js`, walkthrough JSON, images and media.

**Missing catalog entries (10):** formulas in text, module pages, quiz-prep cards, one-page layout, "No, I was right", theme, paper picker and history, origin tags, the fold bar, and PK's Terms tab.

### The scratch trials

- **trial** (core plus `links.js`, `q1_sample.js` moved out, `CHANGELOG.md` into `src/`, 31-entry `files`):
  - build PASS;
  - `test.js` crashes after 73 FAILs; `render_test.js` crashes on GLOSS;
  - in Chromium, start-up stops at `if(!DIA_LIST().length)` (core views:2226). That line comes before `askProfile` (2227), so the save is never loaded, and one answer then overwrites it.
- **trial2** (plus scratch shims: no `diagrams.js`, `const GLOSS=[]`), `run_checks.sh`: **11 PASS, 9 FAIL, 3 NOT RUN, 1 REPORT** (`logs/trial2_run_checks.txt`).

| Check | Result on trial2 | Cause |
|---|---|---|
| `test.js` | FAIL, 73 | 62 numeric items with fewer than 2 steps; 10 two-option items; "365 questions cite no deck" |
| `style_check.js` | FAIL, 36 | the core's wider stem rule ("given as" 19, "According to" 15, "described as" 2), which PK narrowed on purpose |
| `render_test.js` | FAIL | one hyphenated `{{fig:}}` key |
| `browser_test.js` | FAIL | "829 of 545 in the sources", then a crash on a numeric first item |
| `output_test.js` | FAIL | PK's old scripts name `/mnt/user-data` |
| `files_test.js`, `checks_test.js` | FAIL | they assume template file names, or that `test.js` passes |
| `scheduler_test.js` | FAIL, 6 | it appends `QUESTIONS.push` to the first question file, but PK declares `QUESTIONS` last, in `qz_all.js` |
| `state_check_test.js` | FAIL, 2 | cause not investigated |
| storage, update, offline, home, history, preview, oldcache, draw, tables, device_lint | PASS | |

### Core changes needed (kit PRs)

- (a) The feature-module mechanism.
- (b) A build data step for `STEPFIGS`, `FIG_TITLES` and the clip lists (PK `build.py:126-141`).
- (c) Pool filters that read a question's own `exam`, `module` and `lecture`.
- (d) Calculations on exam papers.
- (e) Numeric parse fix and a per-course margin.
- (f) No progress write after a failed start-up.
- (g) Read `missKind`.
- (h) Paper picker and history.
- (i) Concept statuses.
- (j) Theme.
- (k) Checks: port `step_check.js` and `sources_check.js`; the anchored stem rule; item-shape options; the `{{fig}}` pattern; the test assumptions above.
- (l) `moduleLabel`. `skill/SKILL.md` documents `moduleLabel`, `decks`, `facts` and `scope`, and the core reads none of them.

## 2. Saved progress

Namespace `phar4221`. PK has no service worker, so no `oldCachePrefix` is needed.

| Stored item | Carries? |
|---|---|
| `:profile` | as is |
| `:data:<profile>` concepts (ten fields) | as is; `upgradeDB` adds `last` |
| answers (up to 4,000) | as is; PK's extra fields kept |
| kind of miss in answers | **needs a converter** (trial2: 0 of 2 logged kinds counted) |
| answers to term, variable and extra items | counted in totals, not re-askable, no page error (`logs/offbank_trial.log`) |
| `qn`, `created` | as is |
| `settings.mode` | `long` reads as Semester, the same days as PK's 1, 3, 7, 14, 30, 60 |
| other settings | kept, unused |
| `eq`, `exams`, `notes` | kept through the core's saves, not shown |
| `:exam:<profile>` | lost in part: not restored (`{qs}` vs `{ids}`), key left alone |
| `:newsSeen` | as is |
| `:ink:*`, `:ink-prefs`, `:setup`, `:sufrom`, `:eqfold`, `:sheetorder`, `:fold:*`, `:examgrp:*`, `:quizhide:*`, `:gw-*`, `:theme` | untouched, unused |
| sessionStorage `:place` | as is; a PK-only tab falls back to Topics |
| new keys | `:log:<profile>` (starts empty), `:offline-ready` |

- **Condition:** the page must start without an error. The preview's `phar4221-preview` namespace protects the live save while that is checked.
- **Louis's real stored data: NOT DETERMINED.** It lives only in his browsers.

**Numeric grading changes** (`scripts/grading.js`, 534 items). PK grades to max(`tol`, 2% of the key) (shell:1262-1263); 431 items have a `tol` below 2%.

| What was typed | Right only in PK | Right only in core |
|---|---|---|
| the key + 1.5% | 389 | 0 |
| the key + its own unit | 15 | 0 |
| the key + "hr-1" | 534 | 0 |
| the key + "1/hr" | 134 | 0 |
| the key + " 5" (a second number) | 0 | 382 (the core joins the digits) |

## 3. Content and build

**Counts** (PK `test.js` and `scripts/count.js`):
- 829 questions: 269 multiple choice, 20 select-all, 534 numeric, 6 matching; 14 topics; 128 images;
- 174 `dupOf`, 16 `lowYield`;
- `EXTRAS` 81, `TERM_QS` 282, `VAR_QS` 301, `CHAINS` 91, `EQUATIONS` 74, `SHEET_LINES` 52, `TERMS` 94, `SOURCES` 64, `SOURCE_OF` 544;
- `GUIDE_WALK` 42/321; `LIKELY` 40 plus 197 stars; `DIAGRAMS` 7; `STEPFIGS` 17; `FIG_TITLES` 35.
- The rebuilt page equals the committed one except `BUILD_AT`.

**Under the core `build.py`:**
- 31 entries in `files`.
- New shapes needed: `glossary.js`, `diagrams.js`, and `qz_all.js`/`QUESTIONS` (the core's first question file must declare it).
- Files to move: `q1_sample.js` out of `src/`; `CHANGELOG.md` into `src/`. Add `links.js`.
- Constants the core build does not write: `STEPFIGS`, `FIG_TITLES`, `GW_CLIPS`, `WHY_CLIPS`, `BUILD_AT`, `CHANGELOG`.
- `tools.citeAliases {"pk.pdf": "8 - Nonlinear PK.pdf"}`.
- The generators (`figures.py`, `slides.py`, `gen_walk.py`, `gen/*.py`) stay course scripts, run by hand.
- 365 questions cite no lecture deck: 188 practice sheets, 116 homework, 15 in-class, 11 reviews, 4 quizzes, 10 lectures, 21 other PDFs. 37 more would get another lecture (two decks are each shared by two lectures).

**What the page loads:**
- the page itself: 9,242,906 bytes, with `images.json` (3,920,884 bytes) inline;
- fetched when used, all referenced:
  - `audio/`: 487 mp3, 183,571,520 bytes. 321 walkthrough clips, 321 of 321 matching parts; 166 Hear-why clips, 31 scripts without one;
  - `slides/`: 234 jpg, 20,975,130 bytes;
  - `sheets/`: 140 PDF, 9,386,978 bytes;
  - `media/`: 3 mp4, 30,512,080 bytes, of which `cheer-3.mp4` is 27,551,154.
- The core's worker saves 7 files, so media would not work offline.

**Not needed by the page:**
- `.git`: 244,658,393 bytes;
- `src/`: 11,376,567 bytes (build inputs);
- `notes/`, `claude/`, `.claude/`, the READMEs;
- `sheets/manifest.json`.

## 4. Checks (PK's own, run in scratch)

- **PASS:** build; `test.js`; `style_check.js`; `render_test.js`; `step_check.js` (525 final values, no hits); `sources_check.js` (name scan skipped, private list not here); `browser_test.py` 75; `problemset_test.py` 11; `equation_test.py` 33; `review_test.py` 213; `stepper_test.py` 231; `sweep_test.py` 236; `ink_test.py` 100; `modcolor_test.py` 8; `notes_test.py` 36; `place_test.py` 24; `var_test.py` 22; `walk_test.py` 475; `weak_test.py` 28; `why_test.py` 34; `verify_q3/q4/q5`.
- **Ran:** `gen/sheets.py`: 140 PDFs unchanged.
- **REPORT:** `explain_check.js`, 70 of 829.
- **FAIL:** `verify_q1` and `verify_q2`: "Argument list too long".
- **NOT RUN:**
  - `cite_check.py`: printed SKIP, no decks;
  - `sheets_test.py`: `pymupdf` is not installed and I installed nothing;
  - `rewrite_check.js`, `guide_check.js`, `tell_check.js`: each needs an input file;
  - WebKit/Safari: not in this container;
  - physical iPad.

**Coverage by the core:**
- Covered: `test.js` (base parts), `style_check.js`, `render_test.js`, `explain_check.js`, `cite_check.py`, place (`update_test.js`), browser smoke.
- Core has no equivalent: `step_check.js`, `sources_check.js`, PK `test.js` §4b, 4c, 5c-5e, 9, 10 and its reading, worksheet and likely-paper sections.
- Every other PK browser test has to be ported with its feature.

## 5. Defects

| Defect | Finding | After the move |
|---|---|---|
| Cross-pool `dupOf` draw | **Latent**: 0 of 67, 53 and 135 families span two pools for Exams 1-3 (`scripts/dupof.js`) | fixed: one blocked set per paper |
| Regex lookbehind | 4 on 3 shipped lines (views:1087, 4937, 5796) | removed only if those features are ported without it |
| PK's storage shim keeps a failed write but reads stale storage | `review/proposed-core.md` §2 | fixed by the core's `store` |
| `verify_q1/q2` failures, stale README counts (620 vs 829), skipped name scan, 31 unrecorded clips | | carried |

New defects a straight move would bring are those in Summary point 1. Kit records that disagree with the core: FEATURES.md line 36 (concept statuses), and SKILL.md's manifest fields.

## 6. Plan

**Step 0: Louis's decisions.**
- **Scope:**
  - A, full move: about 10 core and about 25 feature PRs;
  - B, move with listed losses: which features he still uses is NOT DETERMINED;
  - C, hold PK and do BDK next: this changes his order.
- **Settings:**
  - keep PK's 2% grading margin?
  - `paceDefault`: in the core "weekly" means days 1-14; his saved profile is unaffected;
  - scheduler `concept` or `preset:'calc'`;
  - the 36 stems and 72 items the core's checks flag: change the rule or reword? Rewording needs a source or his approval.

**Steps 1-5: kit pull requests**, each with a plain-terms summary and his yes.
1. Core prerequisites: (a), (b), (f), (g). (f) may qualify as `small-fix`: there is a failing test and it changes no format.
2. Core behaviour: (c), (l), (d), (e), (h), (i), (j). The parse fix is a `small-fix` candidate.
3. Core checks: (k).
4. Feature modules, one PR each, with their PK tests ported and the three lookbehinds rewritten.
5. Bookkeeping: 10 catalog entries, correct FEATURES.md line 36, the PK "Used by" lines.

**Steps 6-9: course work in the PK repo.**
6. Branch `kit/move-to-core` (PK's rule is commits, no pull requests):
   - `git fetch --depth=200` so `state_check.js` can run;
   - add `CLAUDE.md` and `reviews/` (Drive ids for the restore section NOT DETERMINED);
   - copy core and modules; fill in `course.js`;
   - the content shape changes and file moves above;
   - keep the generators; fix the scripts that name `/mnt/user-data`.
7. Build `--preview`, run every check, and run a progress test (extend `scripts/progress_trial.js`). Compare counts (829, 128, 74, 42, 140), push, confirm the Pages run.
8. Louis checks `/preview/` on his phone and iPad.
9. Go live, delete `preview/`, confirm the deploy, log it, and send a bookkeeping PR for COURSES.md and the kit's `CLAUDE.md`.

**What Louis would see differently:**
- the app at `index.html`; the old file name redirects;
- the page works offline, its media does not;
- a Home Screen section in Settings;
- "I was sure of that" on a miss;
- "Long term" becomes "Semester";
- the core's layout on shared screens (core CSS is 466 lines, PK's 1,024);
- anything not ported is gone.

**Risks:**
- progress overwritten after a start-up error (shown in scratch);
- grading and blueprint changes (measured above);
- regressions in ported features;
- Safari and iPad untested;
- unknown stored data;
- the size of the work: about 35 PRs and up to about 4,000 lines of PK engine.

**NOT DETERMINED:** Louis's stored data, which features he uses, the Drive ids, why `state_check_test.js` failed twice, and Safari behaviour.
