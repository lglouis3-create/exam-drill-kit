# Port queue: course features into the kit

Louis approved on 2026-11-01: the Tier 1 features of the Pharmacokinetics drill are
ported now (feature modules, formulas in text, number grading, calculations on exam
papers, problem sets in parts, the equations sheet, wrong-number reading); the Tier 2
features below are ported one per night by the scheduled task "Kit feature port"
(session "Kit feature porter"), each as one kit pull request titled "Port: <feature>"
for Louis's yes. Tier 3 (walkthroughs with audio, Hear why, the most-likely paper,
origin tags, the sheet map, the clip after a paper, textbook reading cards, module
colours) waits until Pharmacokinetics itself moves.

Source lines are in lglouis3-create/Basic-Pharmacokinetics- `src/` at ac2eb73, from the
read-only assessment of 2026-11-01; the port re-reads them. A port pull request sets its
item's status to `done`.

| Order | Item | Pharmacokinetics source | FEATURES.md | Status |
|---|---|---|---|---|
| 1 | plan-the-problem (set-up drill) | `views.js` 4754-5120 | listed | done |
| 2 | worksheets-ink (write-on worksheets and ink) | `views.js` 5122-5434, 6040-6322 | listed | pending |
| 3 | terms-variables (Terms tab and variables quiz) | `views.js` 1029-1260, 1072-1147 | listed (glossary entry omits PK) | pending |
| 4 | concept-statuses | `views.js` 2506-2725 | FEATURES.md line 36 wrongly says the core has them | pending |
| 5 | theme (light and dark) | `views.js` 6323-6383 | none | pending |
| 6 | paper-picker (choose a practice paper, paper history) | `shell.html` 1099-1217; `views.js` 3083-3170 | none | pending |
| 7 | quiz-prep-cards | `views.js` 466-546 | none | pending |
| 8 | module-pages (Concepts, Calculations by type, Worksheets) | `views.js` 722-854 | none | pending |
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

Items 11-17 have status `BDK move`: Louis decided on 2026-11-01 that BDK moves onto the
core now, and `review/bdk-move-plan.md` ports these features as part of that move, so the
nightly porter takes only items whose status is `pending`.

| Order | Item | Source | Not before | Status |
|---|---|---|---|---|
| 11 | learn-mode (successive relearning in rounds) | BDK `startLearn` ~1755 | — | BDK move |
| 12 | compare-tab (drugs side by side, differences marked) | BDK ~2244 | — | BDK move |
| 13 | cram-mode (time-boxed pass before a quiz, Last look) | BDK ~2018 | — | BDK move |
| 14 | drug-list-tab (table per page, search across pages) | BDK ~2496 | — | BDK move |
| 15 | match-game (timed pairs) | BDK ~2160 | — | BDK move |
| 16 | flashcards (flip, Know it / Still learning) | BDK ~1647 | — | BDK move |
| 17 | progress-dashboard (today's plan, readiness by page, trouble cards) | BDK `viewProgress` ~2320, `todaysPlan` ~1345 | — | BDK move |
| 18 | glossary-tap (tap a term for its definition; upgrade of the Terms work in item 3) | BDK; Intro to Pharmacology `app.js` 1769-1922 | 2026-11-02 11:00 CT | done (Intro to Pharmacology's glossary only, from `929cd62`; BDK's glossary stays with the BDK move) |
| 19 | pair-up and table-recall drills (drug ↔ receptor, poisoning table) | Intro to Pharmacology `app.js` 1923-2060 | 2026-11-02 11:00 CT | done |
| 20 | short-answer page and graphs drill | Intro to Pharmacology `app.js` 2308-2351, 3518-3580 | 2026-11-02 11:00 CT | pending |
| 21 | flags, one-page layout, keyboard shortcuts, strict exam mode | Intro to Pharmacology; BDK | 2026-11-02 11:00 CT | pending |

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

