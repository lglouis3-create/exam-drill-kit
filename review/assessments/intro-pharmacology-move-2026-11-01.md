# Intro to Pharmacology (PHAR 4344): what moving it onto the kit core would take

> Read-only assessment written in the kit session on 2026-11-01 by a Claude agent, kept here unchanged as the source the kit documents cite. Paths under `/tmp/...` were scratch copies in that session's container and no longer exist.

Read-only. I changed nothing in any repository, pushed nothing and created no branch. Sources were Intro-Pharmacology- `main` at `d0d3d2d` (2026-11-01 08:30 CT, still the remote head when I checked) and kit `main` `ff7bd51`, extracted with `git archive`. The kit working tree had uncommitted edits from another session while I worked (`core/shell.html`, `core/views.js`, new `core/startup_test.js`). I did not touch them, and I measured the committed core.

## The short answer

- **Timing.** Exam 4, the course's last exam, is tomorrow: Mon Nov 2, 8:30–10:30 am CT. Nothing should touch the live site before it ends.
- **Size.** This drill is larger and further from the core than Pharmacokinetics was:
  - 2,983 questions, 19 tabs and 1,240 recorded clips.
  - A 3,881-line `app.js` with course content written into the engine code.
- **A straight move breaks the drill.** Measured on a scratch copy:
  - The Exam 4 practice paper comes out empty and errors on Start.
  - The quiz screen errors on fill-in items.
  - 157 questions, 95 of them Exam 4 questions, fall out of every exam pool.
  - All four exams merge into one list.
  - 10 of the 19 tabs disappear.
  - Nobody's saved progress is read.
- **Rough size: about 42 kit pull requests**, roughly 13 core and 29 feature, give or take about 4. Pharmacokinetics was about 35 (10 core, 25 feature). On top of that comes a large amount of work in the course repo.
- **Louis's decision.** Since no exam remains this term, he should first decide what the move is for (options at the end).

## 1. Features

The live page's tabs are listed at `exam1-drill/src/app.js:175-178`. The core has 10 tabs (`core/views.js:221`, ff7bd51). Sizes are line spans in `app.js` (section header to next header).

| Live feature | In the core? | If missing: kind and size |
|---|---|---|
| What's new card | Yes, from this drill. Same storage key and value format (`views.js:347-348`) | — |
| Storage that survives refused writes | Yes, from this drill (`shell.html:574-588`) | — |
| Explain-one cards in tables | Yes (`views.js:1775-1799`). The pages carry 275 `data-xpick` buttons; not run on core | — |
| Step-through engine, Diagrams tab | Yes, from this drill. But this drill's figures use another format: `FIG` in `diagrams.js` (276 KB), `STEPS3` in `steps3a/b/4.js` (213 KB), the `DIAGRAMS` list at `app.js:3583`. The core showed 1 step-through (the template sample) against this drill's 43 | Engine work: 2 pull requests (FIG figure registry and its graph drawer and styles; the STEPS3 format), or a content rewrite |
| Duplicate wordings kept off one paper | Yes; the rule is this drill's (core/README "Exam draw") | — |
| Update bar; place kept after a reload | Yes, under different keys and timings | — |
| Topics grouped by exam, "Studying for" exam switch | No. The core has one fixed exam (`shell.html:535`). Topics showed all 35 topics in one list, and "Everything, adaptive" drew from all 2,983 questions (measured) | Core change, large, plus the `exam-groups` feature (app.js 595-631 plus the pages) |
| Exam facts card with her study list (`course.js:104-114`) | Shows the blurb only | Uncatalogued feature, small |
| Smith focus switch and her quotes | No | `focus-switch` feature. The quotes are written into the engine (app.js 180-215, 662-702) |
| Fill-in items (32) | No. Forcing one into the core quiz threw `Cannot read properties of undefined (reading 'map')` | Core item type, medium (app.js 919-976) |
| True/false pairs (45, plus 3 two-option polls) | The core's `test.js` fails them ("only 2 options") | Core check change, small |
| Matching items (39) | Yes, as a core type; 3 items fail core rules | Content review for Louis |
| Question figures, `fg` field (360 questions) | Silently dropped: in the core, `fg` means an atlas group (`views.js:49`) | Field rename plus the FIG port. Content work |
| Graphs drawn in the stem (75), slide crops `simg` (32) | No | Part of the figure port |
| Textbook notes on answers (236 questions) | No | Uncatalogued, small |
| Hear the why, figure narration, listening side panel | No (no audio code in the core) | `recorded-narration`, large (app.js 2714-3054, about 341 lines; `narration*.js`; 749 `q-` clips) |
| Explain-more chips | The mechanism exists (`links.js` `READ_LINKS`). This drill's routing is regex tables and code inside app.js (249-400, `SEC4` at 336-468) | Content conversion by script, medium, plus `explain-more-links` v2 |
| Flags, "All on one page", keyboard shortcuts, missed-questions CSV | No | 4 uncatalogued features, small each |
| Tiers and ladders (Exam 2: 254 tiered, 78 laddered) | No | Uncatalogued, small to medium |
| ★ Most likely (518 marked), Why questions button | No | `most-likely-stars` v1, plus a small uncatalogued drill |
| Six concept statuses, "practice concept" retest | No. FEATURES.md lines 35-36 says concept statuses are in the core, but no status word appears in core `views.js` or `shell.html` | Core change, medium (app.js 1136-1344) |
| Exam sim: length choice, blueprints, 2 true/false, terms capped at 15%, question grid, result kept after reload, past attempts | Basic paper only. Pools with `marks:null` give an empty paper and a page error (measured). A blueprint draws from the whole bank (`views.js:1487`). The result is cleared when the paper finishes (`views.js:1636`) | 2–3 core changes, medium (app.js 1480-1768) |
| Strict "no going back" exam mode | No | `strict-exam-mode`, small |
| Terms tab: 295 terms, 844 generated questions, flashcards | No | `glossary` v2, medium (app.js 1769-1922) |
| Short answer | No | `short-answer-page`, small (app.js 2308-2351) |
| Graphs tab (26 figures) | No | `graphs-drill`, small (app.js 3518-3580) |
| Scenes (15) | No | `scenes`; `scenes.js` is 1,233 lines of engine and content |
| Question map | No | `question-map`, small |
| All drugs page and its narrated walkthrough | No | Uncatalogued, medium (app.js 2097-2104, 2408-2504, 2662-2713) |
| Pair up | No | `pair-up`, small (app.js 1923-2060) |
| Drug ↔ receptor drill; poisoning table drill | No | `table-recall-drill` v1 and v1-b, small each |
| Readings (24 cards), listen deck | No | `readings-page`, `listen-deck`, medium (app.js 3323-3482) |
| Guide walkthroughs (76 scripts, 392 parts, 192 clips, 302 slide images) | No | `guide-walkthroughs` v1, medium to large (app.js 3130-3322) |
| Antidote pages and the panel inside the drill | Not built by the core | `standalone-diagram-pages` |
| Break video | No | `break-clip` v2, small |
| Light/dark theme | No dark styles in the core at all ("dark" appears 0 times) | Core change, small to medium |
| Back gesture within the drill, back-to-top | No `popstate` handling | BDK's `back-navigation`, or new |
| Per-exam pages (`guide/2/3/4.js`, and the same for reference and tell) | The core reads one page per tab | Content plus `exam-groups` |
| Page markers: FIG 179, IMG 42, GRAPH 9, STEP 9, antidote chips 7, "Try it" links 406 | The core renders only `{{fig:…}}` and `<!--DIA:…-->` (`views.js:1882-1892`) | Core hook plus the figure feature, and content conversion |
| Tables on a phone | This drill stacks them as cards; the core scrolls them sideways in a box | A visible change, not a pull request |

The core adds things this drill lacks: an offline copy, the Home Screen card, the answer history, the preview build, exam-date spacing, "I was sure of that", the FSRS options and the Safari syntax lint.

## 2. Content and build

- **Question files: 42 `q_*.js`.** They are plain data that push into `TOPICS` and `QUESTIONS`. The core build only accepts names matching `q[0-9]…` (`build.py:34`), so every file needs renaming, plus a first file that declares both arrays. Generator output names change with them.
- **Fields beyond the core schema:** `lecture` (all 2,983), `core`/`coreWhy` 518, `fg` 360, `level` 254, `reading` 236, `readingId` 184, `imgCap` 184, `ladder` 78, `graph` 75, `simg` 32, fill fields 32, option `miss` tags 622 (`/tmp/claude-0/-home-user/c8bced46-36ac-5542-9bd6-a604b508c417/scratchpad/ph-assess/qstats.json`).
- **Lecture lookup.** The core finds a question's lecture from the first deck name in its `cite` (`shell.html:543`).
  - 157 questions match no lecture and leave every exam pool. The Exam 4 pool is 468 on the core against 563 here.
  - 900 more land in a different lecture, though always the same exam.
  - 119 of the 157 would match through the `decks` list. Letting the core use each question's own `lecture` fixes all of it.
- **Generator step.** The build runs six generators and the antidote build first (`exam1-drill/src/build.py`): `gen_druglist`, `gen_druglist2`, `gen_terms`, `gen_drugs`, `gen_readings`, `gen_walk`, plus an audio index written from the `audio/` listing. The core build runs no generators (core/README "Not in core yet").
- **Files the core always includes.**
  - `glossary.js` must define `GLOSS` (`views.js:149`); here it defines `TERMS`.
  - Only `guide.js`, `reference.js` and `tell.js` are read.
  - About 20 more data files (readings, narration, scenes, short answer, poisoning table, walkthroughs) have no reader in the core.
- **Course content inside `app.js`:** link tables, her quotes, tier text, the `DIAGRAMS` list, `PAGE_BY_EXAM` and reading status labels. These must move into course files without changing their wording.
- **Layout.** The core expects `src/` directly under the repository root; this repo has `exam1-drill/src/`. The old page `exam1-drill/PHAR4344_Exam1_Drill.html` (bookmarks, README) needs a redirect.
- **Version polling.** Open tabs poll `exam1-drill/version.json` and compare its `id` field (`app.js:3859-3865`). The core writes `built` at the root, so the switch must also write the old file once, or open tabs never see the refresh bar.
- **Images and media.**
  - `images.json` has 61 crops (38 PNG, 23 JPEG; 4.85 MB) and carries as is.
  - Audio (1,240 MP3, 777 MB), slides (302 JPEG, 29 MB) and `media/break.mp4` (27.6 MB) sit beside the page and keep working only if their paths are kept.
  - The live page is 14,557,571 bytes and is also republished as a claude.ai artifact; the artifact limit is 16 MB.

## 3. Saved progress

Namespace `phar4344drill` (`course.js:9`). It stays the same; the keys and shapes under it differ. Measured: on the core, a browser with this drill's progress opened as an empty profile "me" with 0 answers, and every old key was left untouched (`/tmp/claude-0/-home-user/c8bced46-36ac-5542-9bd6-a604b508c417/scratchpad/ph-assess/scripts/probe_straight.js`). The core's Import rejects this drill's export file, because it needs `j.db` (`views.js:2147`).

| Stored item | Verdict |
|---|---|
| `:p:<profile>`, the progress: per-question boxes, an answer log capped at 5,000, pace, past exam scores, flags, layout, concept records | Needs a converter to `:data:<profile>`. Answers convert (id, time, right/wrong, "guess" → guessed, "unsure" → not sure). Concept states can be rebuilt by replaying the log, but only from the 5,000 kept. **Lost in part:** per-question due dates (the core schedules concepts, not questions), past exam scores, flags and layout, unless those features are ported. Pace maps to `settings.pace` |
| `:profile` | Same key and meaning. But this drill's default profile is `default` (`app.js:99`); the core picks a profile from `:data:` keys or uses "me", so the converter must handle it |
| `:log:<profile>` (core answer history) | Does not exist here. It can be derived from the old log, except which quiz mode was used and the scheduler name |
| `:exam:<profile>`, the saved paper | Same key, different shape (`app.js:1490-1494` here, `views.js:1544` in the core). The core ignores the old shape (no `ids` field) without crashing. A running paper can be converted. **A submitted result is lost** until the core keeps results after a reload |
| `:newsSeen` | Carries as is |
| `:exam`, `:focus`, `:focusprev`, `:theme`, `:tfold`, `:noback` | Lost unless the matching feature or core change is ported. Harmless if lost |
| `:pair`, `:rx`, `:rx:miss`, `:pt`, `:pt:miss:<mode>`, `:sa` (typed short answers), `:narr*`, `:gw-pos`, `:gw-cont`, `:motiv` | Carry as is only if each feature keeps its key. These are not per profile |
| sessionStorage `:resume` | Different key from the core's `:place`; open tabs lose their place once |

The preview copies every key starting `phar4344drill:` into its own namespace, so the converter can be tried there without touching live data. The storage size per profile after conversion is NOT DETERMINED: I had no real save to measure, and all of Louis's drills share one origin quota.

## 4. Checks

**This drill's own checks**, run in scratch copies at `d0d3d2d`:

| Check | Result | Output |
|---|---|---|
| `build.py` | PASS | 77 sources parse; 14,182 KB. Only the build stamp differs from the committed files |
| `test.js` | PASS | 2,983 questions, 0 failures |
| `style_check.js` | PASS | 0 failures |
| `stepper_test.js` | PASS | 43 step-throughs |
| `browser_test.js` | PASS | 40 quiz answers and a 50-question exam, 1 min 19 s |
| `daily/glitch.js` | Reported "no issues" at 390 and 1200 px | Not a PASS: the script always exits 0 |
| Simulated-student paper (`daily/paper.js`, `STUDENT.md`) | NOT RUN | Needs AI "students" |
| cite, explain and coverage checks | NOT RUN | Not built for this course |
| WebKit / Safari | NOT RUN | No WebKit in this container |

- The build and browser test ran with empty placeholder files standing in for the audio, slides and video.
- `glitch.js` ran on the full clone.

**Where the core covers the same ground:**
- Core `build.py`, `test.js`, `style_check.js`, `stepper_test.js`, `render_test.js` and `browser_test.js` cover the same ground as this drill's checks.
- The core rules are stricter in places:
  - True/false pairs fail.
  - A cite must name its deck.
  - The core style check flags 155 items, many of them her own words (for example "upstream or downstream" counted as a metaphor).
- Core `storage_test`, `update_test` and `draw_test` cover this drill's storage, reload and duplicate-wording cases.
- No core check covers fill-in, Terms, readings, scenes, narration texts, antidote hashes, Tell-apart question links, flags, layout, theme, the graphs drill, the drug drill or walkthrough panels. Each becomes a feature test.
- The core device lint would catch the one regex lookbehind at `app.js:2411`.

**Straight move on core ff7bd51** (course.js plus `files`/`kit`/`scheduler`, files renamed, nothing else changed): 11 PASS, 10 FAIL, 2 NOT RUN (cite: no decks; state check: not a git repo), 1 REPORT. Failures include:
- `test.js` stopped on the first fill item;
- the render and history checks broke on the empty exam paper;
- the scheduler test hit the same page error;
- the browser test's question-count pattern does not match this drill's files;
- 155 style findings;
- two core tests that assume the template (`files_test` needs `q1_topics.js`; `state_check_test` adds lecture ids L02/L03, which already exist here).

With two scratch-only fixes (pool marks set to the announced counts, fill items removed): 14 PASS, 7 FAIL. The core `test.js` then found 53 failures: 48 two-option items, 3 matching rules, 1 three-option select-all, and 156 questions that cite no deck in the manifest.

## 5. Exams still to come

- **Exam 4, Mon Nov 2, 2026, 8:30–10:30 am CT** (`course.js:100`, syllabus), 55 questions, 120 minutes. Her notice printed "Monday Nov 4th", but Nov 4 is a Wednesday; the drill keeps the syllabus date by Louis's decision (`course.js:107`).
- It is the last exam. The four exams are Oct 2, Oct 12, Oct 23 and Nov 2 (`claude/drill-notes.md` §1). Her words at `app.js:688`: "your last exam in this course".
- Three scheduled tasks still fire into this drill's session and may push to `main` tonight: "Smith daily ingest and guides" (9:47 pm), "Drill daily polish" (3:41 am) and "Smith reading reminder". Each says it will report after Exam 4 that it can be stopped.
- The kit update run skips this course, since its course.js has no `kit` field.

## 6. Plan and size

**Kit pull requests** (each needs Louis's yes; the small fixes can merge themselves once the kit has required checks):

- **Before anything:** the shared step that lets the core read `features` from course.js. The core does not read it yet (0 matches); it is shared with Pharmacokinetics' move.
- **Core, about 13:**
  1. Questions use their own `lecture`.
  2. `marks:null` pools draw a paper (small fix).
  3. Several exams on one site.
  4. True/false and fill-in item types.
  5. Blueprint by field tests, the true/false count and a cap per skill.
  6. Exam result kept after a reload, with past attempts.
  7. Generator step in the build.
  8. Concept statuses.
  9. Page markers and "Try it" links.
  10. A converter for old saved progress.
  11. Light/dark theme.
  12. Core tests that assume the template (small fix).
  13. Check rules that allow the professor's formats per course.
- **Features, about 29:** the 19 FEATURES.md entries this drill uses that are not in the core, 2 figure-format ports, and about 8–10 uncatalogued ones (flags, one-page layout, keys, CSV, tiers and ladders, textbook notes, All drugs, facts card, why-drill, back gesture).
- Eight of these features also come from Pharmacokinetics. If its versions land first, this drill needs either its own version added or its content converted; the effect on the count is NOT DETERMINED.
- Plus 1–2 catalog bookkeeping pull requests.

**Course work** (in the course repo, not kit pull requests):
1. After Exam 4: stop the three tasks.
2. Write a root `CLAUDE.md`, `reviews/LOG.md` and `reviews/OPEN_QUESTIONS.md` from `claude/drill-app-state.md`.
3. On a branch: move `src/` to the root, add the old-page redirect, and write the old `version.json` once.
4. Fill in course.js.
5. Rename the 42 files and update the generators.
6. Move the content out of `app.js` and merge the per-exam pages.
7. Convert the page markers and the `fg` fields.
8. Split the glossary.
9. Generate the links.
10. Test the converter on real-shaped saves.
11. Build at `/preview/`, run every check and list the differences.
12. Louis tries it on his phone and approves; then go live and confirm the deploy.
13. Decide whether to keep republishing the artifact.

**What Louis would see differently, even after every port:**
- The core's Topics layout and Settings in place of Progress.
- Concepts scheduled instead of single questions. "Not sure" drops a box instead of holding it, and "I was sure of that" is new.
- Tables scroll sideways instead of stacking as cards on a phone.
- An offline copy and a Home Screen card in Settings.
- A preview step before any change goes live.
- Without the ports: 9 tabs only, no audio, no dark mode, and only Exam 1's pages in Guides, Reference and Tell apart.

**Risks:**
- Any change before 10:30 am Nov 2.
- Progress loss if the converter misses a case: the 5,000-answer cap, the `default` profile, submitted papers.
- Storage roughly doubles while old and new keys coexist, on a quota all of Louis's drills share.
- The 240+ figure markers and 360 figure fields fail silently: no check catches them today.
- Moving her quotes out of the engine must not change any wording.
- Paths for the 777 MB of audio, plus classmates' bookmarks.
- Page size near the 16 MB artifact limit.
- The core is changing underneath: uncommitted start-up work today.

**Options for Louis (his decision):**
- **(A) Full move:** about 42 kit pull requests plus the course work above.
- **(B) Freeze this drill as it is** and port its features into the kit from its code, the way the nightly Pharmacokinetics port works. Zero risk to the site; most of the kit pull requests remain.
- **(C) Minimal move after Exam 4:** about 13 core pull requests plus content work. Many tabs and the audio are dropped, which needs his explicit approval.

## Skipped or NOT RUN, and NOT DETERMINED

- **NOT RUN:**
  - Safari / WebKit;
  - `cite_check` (no decks);
  - the simulated-student paper;
  - any phone test;
  - a converter prototype;
  - the live site (a cloud session cannot open it).
- **NOT DETERMINED:**
  - storage size after conversion;
  - how many pull requests the Pharmacokinetics ports would save.

Files are in `/tmp/claude-0/-home-user/c8bced46-36ac-5542-9bd6-a604b508c417/scratchpad/ph-assess/`:
- `ph/` — read-only clone
- `phb/` — build copy
- `straight/`, `straight2/` — straight-move copies
- `straight_checks.log`, `straight2_checks.log` — straight-move check results
- `bt_phb.log`, `glitch.log` — browser test and click-through output
- `qstats.json` — question schema counts
- `scripts/` — probe scripts
