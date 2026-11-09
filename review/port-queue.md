# Port queue: course features into the kit

Louis approved on 2026-11-01: the Tier 1 features of the Pharmacokinetics drill are
ported now (feature modules, formulas in text, number grading, calculations on exam
papers, problem sets in parts, the equations sheet, wrong-number reading); the Tier 2
features below are ported one per night by the scheduled task "Kit feature port"
(session "Kit feature porter"), each as one kit pull request titled "Port: <feature>"
for Louis's yes (since 2026-11-03 merged under `review/porter-policy.md` §7 and
`KIT_DESIGN.md` §12 decision 10 instead). Tier 3 (walkthroughs with audio, Hear why,
the most-likely paper, origin tags, the sheet map, the clip after a paper, textbook reading cards, module
colours) waits until Pharmacokinetics itself moves.

Source lines are in lglouis3-create/Basic-Pharmacokinetics- `src/` at ac2eb73, from the
read-only assessment of 2026-11-01; the port re-reads them. A port pull request sets its
item's status to `done`.

| Order | Item | Pharmacokinetics source | FEATURES.md | Status |
|---|---|---|---|---|
| 1 | plan-the-problem (set-up drill) | `views.js` 4754-5120 | listed | pending |
| 2 | worksheets-ink (write-on worksheets and ink) | `views.js` 5122-5434, 6040-6322 | listed | pending |
| 3 | terms-variables (Terms tab and variables quiz) | `views.js` 1029-1260, 1072-1147 | listed (glossary entry omits PK) | pending |
| 4 | concept-statuses | `views.js` 2506-2725 | FEATURES.md line 36 wrongly says the core has them | pending |
| 5 | theme (light and dark) | `views.js` 6323-6383 | none | pending |
| 6 | paper-picker (choose a practice paper, paper history) | `shell.html` 1099-1217; `views.js` 3083-3170 | none | pending |
| 7 | quiz-prep-cards | `views.js` 466-546 | none | pending |
| 8 | module-pages (Concepts, Calculations by type, Worksheets) | `views.js` 722-854 | none | partial (left: Extra practice rows, the module page kept through a reload) |
| 9 | stopwatch | `views.js` 1467-1482 | listed | pending |
| 10 | notes (Notes tab and flags) | `views.js` 5564-5654 | listed | pending |

## Tier 2b: BDK and Intro to Pharmacology (added 2026-11-01)

Louis approved on 2026-11-01 adding the most reusable features of BDK and Intro to
Pharmacology after Pharmacokinetics' Tier 2, in the order below (Claude's ranking: how
many future courses could use it, the study evidence in `review/recommendation-proposal.md`,
and whether it repeats a feature already listed). A port only reads the course's code
(public repositories) and never changes the course or its site. **No item whose source is
Intro to Pharmacology starts before 2026-11-02 11:00 America/Chicago** (Louis: wait until
its Exam 4, 8:30-10:30 am that day, is over). BDK still has quizzes on 11/17-11/19 and
11/30; its items only read its code, so they may run before then.

Sources: BDK = lglouis3-create/BDK `assets/app.js` at c2f87ae; Intro to Pharmacology =
lglouis3-create/Intro-Pharmacology- `exam1-drill/src/app.js` at d0d3d2d (line ranges from the
read-only assessments of 2026-11-01; the port re-reads them).

Items 11-17 were `BDK move` (Louis, 2026-11-01). Since 2026-11-08 they are planned as kit
modules for any course (`review/bdk-study-features-plan.md`): each is built once and BDK's
move then switches it on. Their status is `planned (part N)`; the nightly porter takes only
`pending`, and an item becomes `pending` only when Louis says yes to its part. The BDK line numbers in
this table are from c2f87ae; the plan cites BDK at 05c36c3. `field-colours`
(BDK F8) is in part 1 with the drug list, as item 22 (added 2026-11-08).

| Order | Item | Source | Not before | Status |
|---|---|---|---|---|
| 11 | learn-mode (successive relearning in rounds) | BDK `startLearn` ~1755 | — | planned (part 2) |
| 12 | compare-tab (drugs side by side, differences marked) | BDK ~2244; at `05c36c3`: `viewCompare` 2301 | — | done (part 1: without Learn these drugs together, Drugs you have mixed up and the links from question feedback, see FEATURES.md) |
| 13 | cram-mode (time-boxed pass before a quiz, Last look) | BDK ~2018 | — | planned (part 2) |
| 14 | drug-list-tab (table per page, search across pages; recall mode) | BDK ~2496; at `05c36c3`: `viewBrowse` 2553; recall mode: DEENT `src/druglist_ui.js` at `main` `0281922` | — | done |
| 15 | match-game (timed pairs) | BDK ~2160 | — | planned (part 2) |
| 16 | flashcards (flip, Know it / Still learning) | BDK ~1647 | — | planned (part 2) |
| 17 | progress-dashboard (today's plan, readiness by page, trouble cards) | BDK `viewProgress` ~2320, `todaysPlan` ~1345 | — | planned (part 3, approval) |
| 18 | glossary-tap (tap a term for its definition; upgrade of the Terms work in item 3) | BDK; Intro to Pharmacology `app.js` 1769-1922 | 2026-11-02 11:00 CT | pending |
| 19 | pair-up and table-recall drills (drug ↔ receptor, poisoning table) | Intro to Pharmacology `app.js` 1923-2060 | 2026-11-02 11:00 CT | pending |
| 20 | short-answer page and graphs drill | Intro to Pharmacology `app.js` 2308-2351, 3518-3580 | 2026-11-02 11:00 CT | pending |
| 21 | flags, one-page layout, keyboard shortcuts, strict exam mode | Intro to Pharmacology; BDK | 2026-11-02 11:00 CT | pending |
| 22 | field-colours (the fields a course names as hardest coloured; the field a question asked shaded after the answer) | BDK at `05c36c3`: `assets/app.js` 903-934 (`ROW_KEY`, `ASKED_ROW`, the `asked` class, `kindClass`), the `k-cat`/`k-ind` classes in the list and Compare (for example 2598 and 2325), and `assets/style.css` 367-383; from `bf91dc0` | — | done (part 1: the headings; the after-answer card and its shading not ported, see FEATURES.md) |
| 23 | drug-list-tab v2: per-fact outcomes kept in each profile's progress (`drug-list-persistent-outcomes`; a `DB.drugs` part keyed `drugId:field`; recognition or recall, outcome and self-rating, no typed text; a fact-to-question map so an answer on a fact with a bank question is counted once, on that question) | DEENT at `main` `b747e49`, read-only: `src/druglist_ui.js` 98-99 and 415-428 (this visit's ratings, `{key: 'drug:field', form, rating}`), 117-118 (Forgot, Partly, Knew); `src/drugfacts.js` 38-40 (fields and the question-to-fact map) and 128-142 (`status()`); `src/druglist_data.js` 120 onward (the card ids) | — | pending (develop and test only; merge and any course switching it on wait for Louis) |

## Core changes found by the assessments (not nightly)

These change the engine itself, so they are done in a kit session, one pull request each
with a plain summary for Louis, not by the nightly porter: several exams on one site and
the next exam by date, with multi-day quizzes (BDK, Intro to Pharmacology); true/false,
fill-in and typed-recall item types; questions placed by their own `lecture`; a paper for
pools with `marks:null` (it crashes today); select-all with more than 10 options; a
converter hook for an older saved-progress format; a generator step in the build; course
files kept beside the page and saved offline; the exam result kept after a reload, with
past attempts; and four check fixes (the scheduler test's skill names, ids with an
apostrophe, `test.js` under `fsrs`, a browser-test crash on large banks).

