# Feature catalog

Every optional feature any drill has built, in the format of `KIT_DESIGN.md` §5.
Nothing here is discarded (decision 4). The Phase 1 version of this file is
`review/FEATURES.draft.md`.

Where each version lives: a version line names the course and the commit it came
from. Until a feature is ported into `features/<name>/` (decision 7: when a course's
material calls for it), that commit in the course repo is where the version is kept,
unchanged. A ported feature has `features/<name>/current/`, `archive/vN/` and its
test.

How the fields were filled:
- **Date and commit** on each version line are the first commit that contains the
  code (`git log -S` on the function or file name, or the commit the course's notes
  name, checked to exist). Medicinal-chemistry's features are dated 2026-09-20
  because `7aa5816` (2026-09-20) is their first appearance on GitHub; they were
  built earlier, in sessions whose work is not in git. Pharmacology hashes marked
  (branch) are on `claude/eager-heisenberg-ig6y2o` only; `main` holds the
  squash-merges.
- **Best for** states what the course material needed, from the reason the
  course's notes record. **Weaker at** says "not evaluated" wherever no retro,
  study data or exam outcome exists, which is every entry today.
- **Evidence:** the only learning-science citations recorded in any repo are two,
  in BDK commit `577d5b6`'s message and BDK `reviews/LOG.md` (2026-10-28 entry):
  Haladyna, Downing & Rodriguez 2002, and Couch, Hubbard & Brassil 2018, named by
  author and year only, with no full reference, and not read in this phase.
  Files were searched for citation patterns and method names on 2026-10-31 and
  commit messages on 2026-11-01. Where a method is named in code without a source,
  the entry says so.
- **Enable** lines: `course.js` `features` switches on a module that has been ported
  into `features/<name>/` (the build reads it since 2026-11-01; `features/README.md`).
  For a feature not yet ported, the line is the name it will have.
- Courses: MC = Medicinal-chemistry (PHAR 4342), PK = Basic-Pharmacokinetics-
  (PHAR 4221), PH = Intro-Pharmacology- (PHAR 4344), BDK = BDK (PHAR 4232).

Parts moved to the shared core rather than catalogued here (see
`review/proposed-core.md`): course manifest, storage and profiles, scheduler and concept
statuses, service worker and install manifest, update notice and place restore,
build, checks, Pages setup, exam draw, analytics and progress export, the answer
history (first built in BDK on 2026-11-01), and the Home Screen card (BDK `080d5fa`,
2026-11-01), because Safari's 7-day storage rule affects every drill opened on an
iPhone or iPad.

---

## Exam organisation and navigation

## exam-groups
Does: one site for every exam of the course; Topics, Guides, Reference, Tell apart, Terms and Readings show one fold per exam, the exam being studied open; an exam switch on Topics, Exam sim, Weak spots and Terms.
Use when: a course has several exams and progress should carry across them (PH: four exams on one site, `share/FEATURES.md` "Exams as collapsible groups").
Do not use when: the drill serves one exam only (MC's final drill).
Enable: course.js → features.exam-groups = { version: 'v1' }
Versions:
  v1  2026-10-05  from PH (`bffda5c`, `exGroup()`)   best for: multi-exam courses with per-exam pages   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: PH (v1)
Known issues: adding an exam needs three page files and a `PAGE_BY_EXAM` entry (`share/FEATURES.md`).
Test: none specific; `exam1-drill/src/test.js` checks anchors.

## focus-switch
Does: one switch that hides the exams and pages a professor does not test, says what it hides, and offers "Show all exams".
Use when: a later exam covers only one of several instructors (source: PH (T) 10/26, `exam1-drill/src/course.js:108`).
Do not use when: every exam draws on every lecturer.
Enable: course.js → features.focus-switch = { version: 'v1', prof: '<name>' }
Versions:
  v1  2026-10-20  from PH (`96e33bf`; notice `54a3c4a` (branch), 2026-10-26)   best for: sequential two-professor courses   weaker at: not evaluated   current/
Evidence: Louis asked why Exam 3 material disappeared (PH notes §1), which led to the notice.
Used by: PH (v1)
Known issues: PH notes date the first commit `c289f63` (2026-10-21); `git log -S FOCUS_EXAM` finds `96e33bf` (2026-10-20).
Test: none found.

## explain-more-links
Does: after each answer, chips link to the guide, reference and tell-apart sections for that question, with "Back to the question" restoring the question and scroll position.
Use when: the course has guides or reference tables a missed question should send the student to (PH `linksFor0()`).
Do not use when: the drill has no explanation pages.
Enable: course.js → features.explain-more-links = { version: 'v2' }
Versions:
  v1  2026-10-01  from PH (`842074f`, keyword rules per exam)   best for: per-lecture keyword routing   weaker at: not evaluated   archive/v1/
  v1-port  2026-10-02  PK copy (`d9b6a4e`)   separate code in PK `src/views.js`
  v2  2026-10-24  from PH (`620890f`, routing by the guide's Sources lines; reading and tell-apart links `d1df52f` 2026-10-30)   best for: guides that list their question ids   weaker at: not evaluated   current/
Evidence: a phone review found Exam 4 answers linked only to the guide (PH notes §2, `d1df52f`).
Used by: PH (v2), PK (v1-port)
Known issues: link tables are course-specific regexes (`share/PORTING.md` §2).
Test: `exam1-drill/src/test.js` checks that anchors exist.

## back-navigation
Does: a Back button and a "Back to your …" bar that return to the previous screen; the phone back gesture pauses a session.
Use when: study screens link to each other (BDK Compare links; Louis asked for "a back button to go back to previous area the user was at", BDK notes §1).
Do not use when: the drill is a single linear quiz.
Enable: course.js → features.back-navigation = { version: 'v1' }
Versions:
  v1  2026-10-27  from BDK (`e362e6a`, `leaveCurrent`, `assets/app.js:1040`)   best for: many cross-linked screens   weaker at: not evaluated   current/
Evidence: Louis's request (BDK notes §4).
Used by: BDK (v1)
Known issues: none recorded.
Test: `tests/refresh.js`, `tests/ui.js` (BDK).

## whats-new
Does: a "What's new" card on Topics from `CHANGELOG.md`, which the build embeds; bullets of at most 120 characters.
Use when: classmates use the site and content changes between visits.
Do not use when: a single user who makes every change.
Enable: course.js → features.whats-new = { version: 'v1' }
Versions:
  v1  2026-10-02  from PH (`29d912e`, `newsCard()`)   best for: shared sites updated daily   weaker at: not evaluated   current/
  v1-port  2026-10-02  PK copy (`c01b619`)
Evidence: none recorded.
Used by: PH (v1), PK (v1-port)
Known issues: PH `4dd68c7`: a changelog edit committed without a rebuild did not show on the page.
Test: `style_check.js` bullet-length rule (PH, PK).

## module-colours
Does: colours module titles and sections by module, never a question or option, and prints the equation sheet in module colours.
Use when: a course's exams are organised by module and the student wants to see which module a page belongs to (PK: "Can we color coded the module titles every just not the questions because that would give it away", 2026-10-27).
Do not use when: colour would sit on an answer option or reveal the answer.
Enable: course.js → features.module-colours = { version: 'v1' }
Versions:
  v1  2026-10-27  from PK (`d71d237`)   best for: module-organised courses   weaker at: not evaluated   current/
Evidence: Louis's request (PK notes §4).
Used by: PK (v1)
Known issues: its run-time style made `sheets_test.py` mark the worksheet PDFs stale (PK notes §2; fixed in `f013ced`).
Test: `src/modcolor_test.py` (PK).

## field-colours
Does: colours the headings of the fields a course names as hardest (BDK: Pharmacologic category teal, Common indications pink) as text colour, in the panes of feature tabs: drug-list-tab's column headings now, and any element a later module marks `data-field="<field>"` in its pane (compare-tab's row headers, port queue item 12, once built). Display only; stores nothing.
Use when: a fact table has fields the student finds hardest (BDK: category and indication "are the hardest of the basic info", 2026-10-22).
Do not use when: the colour would mark the answer.
Enable: course.js → features['field-colours'] = { version: 'v1', fields: [['category', '#0f766e', '#5eead4'], ['indication', '#a21caf', '#f0abfc']] } ([field, light colour, dark colour]; these are the defaults, BDK's), with drug-list-tab (or another module that marks its headings) on
Versions:
  v1  2026-10-22  from BDK (`bf91dc0`)   best for: drug-list tables   weaker at: not evaluated   current/ (ported 2026-11-08 from BDK `05c36c3` `assets/style.css` 367-383 and `assets/app.js` 2598: the colours and the coloured list headings)
Evidence: Louis's request (BDK notes §4).
Used by: BDK (v1, its own copy); the kit module: none yet.
Known issues: Shares its purpose with module-colours; a later upgrade could merge them. Themes: the kit core's page is light only (`core/shell.html` has no dark rule), so the dark colours apply only under the theme module's dark theme (kit #20, not merged: `:root[data-theme="dark"]`, and Match device on a dark device when the theme module is on); BDK's rule for a dark device (`style.css` line 370) is not ported, since on the core's light page it would put light text on a light background. Contrast, measured on 2026-11-08 by the test on the heading's own background (the headings are 12 px, weight 700, so 4.5:1 is needed): light, on `#F2F4F7` (the core's `--surface`), `#0f766e` 4.97:1 and `#a21caf` 5.74:1; dark, with the theme module of kit #20 (branch `port/theme` at `b4af772`) on `#10161D`, `#5eead4` 12.30:1 and `#f0abfc` 10.34:1. Not ported: the after-answer drug card's field colours and the `.asked` shading of the field a question asked (BDK `assets/app.js` `ROW_KEY` 903, `rowCard` 904-918, `kindClass` 934, `ASKED_ROW` 899-902; `style.css` 374-381, and the `.drug dt` parts of 372-373) and the field labels in question prompts (`style.css` 372-373, whose `th.k-cat` and `th.k-ind` parts are ported; their `.drug dt.k-cat`, `.drug dt.k-ind`, `.term-label .k-cat` and `.term-label .k-ind` parts are left out); they wait for a kit view that shows a question's drug fields. No field card is built.
Test: `features/field-colours/current/test.js` (on BDK's 26 pages with drug-list-tab on, at 390 px and 820 px; contrast measured with the WCAG 2 formula; options; drug-list-tab off; the theme module's dark theme when that module is in the course; four build-step refusals).

## theme
Does: dark colours for the whole page, and the student's own choice of Match device (the default: the phone's or computer's light or dark setting), Light or Dark, in the header and in Settings. The kit core has no dark colours: its `shell.html` sets light colours only, and `browser_test.js` renders every tab with the browser set to dark (no sideways scroll, no "undefined", no page error) on a page that stays light. The choice is a device setting: it is kept in this browser's storage under `<ns>:theme`, the same for every profile, beside `<ns>:profile`, and not in the progress, because the progress is per profile and moves to another device with Export progress while a colour choice belongs to the screen it was made on. Export does not carry it, Import and a profile switch do not change it, and a browser that refuses storage keeps it for the visit.
Use when: the student studies on a phone or computer kept dark, or wants dark colours whatever the device is set to (PK has the choice in its header since before `ac2eb73`).
Do not use when: none recorded; the module reads no course data.
Enable: course.js → features.theme = { version: 'v1' }
Versions:
  v1  2026-11-02  from PK (`ac2eb73` `src/views.js` 6323-6333, the choice; `src/shell.html` 979-1042, the dark colours and the header control; first commit not looked up: the read-only clone has one commit)   best for: any course   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: PK (its own copy, where the choice is named System); the kit module: none yet.
Known issues: PK's dark rules for classes the core does not have (`.misskind`, `.shortfall`, `.rtab`, `.mtab`, `.stsvg`, `.stepfig`, `#zoom`, `.mrow`, its module colours `.m0`-`.m7`) are not ported. The kit adds dark values PK's shell did not need: the atlas colours (`--at-*`, `--wash`), the figure boxes (`.fgshow`, `.cmpcell`, `.wfig`), the `.tag.p3`/`.tag.p4` tags and dark text on the light buttons; each value is one of PK's dark palette. The queue's source range `views.js` 6323-6383 runs into the module-colour code (Tier 3), which is not part of this module. Without the module a page stays light on a dark device, as before. Known limit (fault T1, found by the integration run of 2026-11-03): on a large page a student who picked Dark can see the light colours for a moment when the page opens. theme.js sets `data-theme` when its script runs, at the end of the page's one script block, and the browser paints the tabs before that on a large page. Measured 2026-11-03 in Chromium: on the everything-on scratch course (1,879,886 bytes), 3 of 5 reloads painted the first frame with the tabs light (tabs at 40-62 ms, `data-theme` set at 89-112 ms); on the template course padded to 1,564,690 bytes, 3 of 5; on the 273,848-byte template course, 0 of 3. Measured again 2026-11-03 after the rework (Chromium, 12 reloads each, template course padded to 1.6 MB, five runs: `evidence/theme` folder `rework-*`): a stored Dark on a light device showed a light frame in 10, 8, 9, 7 and 6 of 12 reloads; a stored Light on a dark device showed a dark frame in 8, 4, 8, 5 and 6 of 12; on the 0.3 MB template course, 0 of 3 both ways. A module cannot put a script in `<head>` (module.json has `js` and `css`; `build.py` allows one script block), so the fix needs a core change: see `evidence/theme` `fix-t1-*/FINDING.md`.
Test: `features/theme/current/test.js` (46 checks and 2 known-limit skips on the template course, 2026-11-03, on a scratch copy that adds four Basic-Pharmacokinetics questions (`ac2eb73` `src/q15_module7b.js`, every field as the course has it, the professor's name included) in a topic of their own: the two dark blocks hold the same 18 rules; each of the core's 24 `:root` colours has a dark value; the module loads in the engine run in node; in Chromium, a stored Dark on a light device and a stored Light on a dark device are on the page from its first frame (the first frame with the tabs, and every frame painted until 600 ms after them, read from tracing screenshots) in 3 reloads of a page under 1.5 MB, and the same measured over 12 reloads each of a page of 1.5 MB or more (a wrong frame there is a skip labelled "KNOWN LIMIT T1" with its count, never a pass, while the page has no script in `<head>`, and a failure once it has one); Match device, Light and Dark on light and dark devices, through a reload (0, 100 and 400 ms after a pick), in Settings, across a profile switch; absent from the progress and the Export file (after 30 answers); Import in a fresh browser leaves that browser's choice; storage refused, storage denied and storage full (the core's notice shows, nothing saved is overwritten, all loads once storage works); every tab and five quiz cards, unanswered and answered, at 4.5 : 1 or better in the dark colours, as PK `src/modcolor_test.py` lines 61-68 checks its dark badges; the calculation answer box dark; the page and the Settings radios drawn dark). PK has no test of the choice itself. CI course script: `features/theme/ci/oncourse.js` (switches the module on; writes no data).

## exam-countdown
Does: shows the next exam or quiz by calendar days ("today", "in progress", "over"); BDK's version picks the lab day for lab-week quizzes.
Use when: exams or quizzes are frequent (BDK weekly quizzes; PK three exams).
Do not use when: no exam dates are known.
Enable: course.js → features.exam-countdown = { version: 'v2' }
Versions:
  v1  2026-10-02  from PK (`c01b619`)   best for: a few fixed exam dates   weaker at: not evaluated   archive/v1/
  v2  2026-10-22  from BDK (`58c441d`; lab-day choice `0fab858`)   best for: weekly quizzes with variable days   weaker at: not evaluated   current/
Evidence: BDK week 10 ran across lab days 10/20–10/22 and the banner showed the wrong day (BDK notes §2).
Used by: PK (v1), BDK (v2)
Known issues: none open.
Test: `tests/cram.js` pins the clock to `QUIZ_DAY` (BDK).

## question-map
Does: colour-coded tiles of every question by lecture and concept.
Use when: the bank is large and the student wants to see coverage at a glance (PH).
Do not use when: the bank is small.
Enable: course.js → features.question-map = { version: 'v1' }
Versions:
  v1  2026-09-30  from PH (`8bbb006`, `vMap()`)   best for: large lecture banks   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: PH (v1)
Known issues: none recorded.
Test: none found.

---

## Practice modes

## full-pass
Does: one straight pass through the whole bank with no scheduling gate.
Use when: the student wants to see every question once before an exam (MC `src/README.md:253-265`).
Do not use when: no case recorded; it runs beside the scheduler and replaces nothing.
Enable: course.js → features.full-pass = { version: 'v1' }
Versions:
  v1  2026-09-20  from MC (`7aa5816`)   best for: a final review of a fixed bank   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: MC (v1); PK's engine has the same mode (`mode === 'all'`, from `08f16b6`).
Known issues: none recorded.
Test: none specific.

## most-likely-stars
Does: marks the questions judged most likely to appear, with a reason each, and offers a drill of only those; PK adds a fixed most-likely paper and a split into concepts and calculations.
Use when: transcripts, homework and quizzes show what the professor emphasises (PK: 197 starred questions, PK notes §1).
Do not use when: the evidence for "likely" is thin; the stars then steer study without support.
Enable: course.js → features.most-likely-stars = { version: 'v2' }
Versions:
  v1  2026-10-22  from PH (`449aa57`, `core:true`, `coreBtn()`)   best for: one professor's quiz format   weaker at: not evaluated   archive/v1/
  v2  2026-10-26  from PK (`f4710c3` fixed paper; `22bfe50` 2026-10-27 concept/calculation split)   best for: mixed concept and calculation exams   weaker at: not evaluated   current/
Evidence: Louis asked for the stars and the split (PK notes §4).
Used by: PH (v1), PK (v2)
Known issues: separate code in PH `app.js` and PK `views.js`.
Test: none specific.

## strict-exam-mode
Does: an opt-in exam paper with no backward navigation.
Use when: the professor's exam forbids going back (PH: her 10/21 remark, PH notes §1).
Do not use when: the real exam allows review.
Enable: course.js → features.strict-exam-mode = { version: 'v1' }
Versions:
  v1  2026-10-22  from PH (`f2090d7`, store key `ns+':noback'`)   best for: exams without back navigation   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: PH (v1)
Known issues: none recorded.
Test: none found.

## short-answer-page
Does: practice of written short-answer items.
Use when: the exam format includes short answer (PH Exam 3: "2 short answer", PH notes §1).
Do not use when: the exam is all multiple choice.
Enable: course.js → features.short-answer-page = { version: 'v1' }
Versions:
  v1  2026-10-22  from PH (`f2090d7`, `src/sa3.js`)   best for: partial-credit short answers   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: PH (v1)
Known issues: none recorded.
Test: none found.

## learn-mode
Does: successive relearning in a session: a new card must be answered right three times, a known card once; list answers take one checkbox per item and name the items missed.
Use when: material is a fixed list of facts to memorise (BDK).
Do not use when: questions are long applied items.
Enable: course.js → features.learn-mode = { version: 'v2' }
Versions:
  v1  2026-10-22  from BDK (`58c441d`)   best for: card decks   weaker at: list answers offered as one bundled option   archive/v1/
  v2  2026-10-28  from BDK (`577d5b6`)   best for: card decks with list answers   weaker at: not evaluated   current/
Evidence: method named "successive relearning" in `assets/app.js:1619`, with no citation. For v2, commit `577d5b6` and `reviews/LOG.md` cite Haladyna, Downing & Rodriguez 2002 (advise against complex, Type K options) and Couch, Hubbard & Brassil 2018 (single-answer multiple choice hides incomplete understanding), by author and year only. Louis's concern that bundled answers "hurts the learner in making a proper connection for each drug" led to v2 (BDK notes §4).
Used by: BDK (v2)
Known issues: none open.
Test: `tests/regression.js`, `tests/ui.js` (BDK).

## card-modes
Does: Test, Written, Flashcards and Scroll (continuous scrolling) over the same cards.
Use when: a card deck is the material (BDK).
Do not use when: items need figures and worked steps.
Enable: course.js → features.card-modes = { version: 'v1', modes: [...] }
Versions:
  v1  2026-10-22  from BDK (`58c441d`)   best for: Quizlet-style study   weaker at: not evaluated   current/
Evidence: Louis asked for a Quizlet-like set of modes and continuous scrolling (BDK notes §1).
Used by: BDK (v1)
Known issues: "pick the item" questions are left out of Flashcards because a typed answer could name a different correct item (BDK notes §2).
Test: `tests/ui.js` (BDK).

## match-game
Does: tap pairs (brand and generic) against a timer.
Use when: the material has many two-sided pairs (BDK).
Do not use when: items are not pairs.
Enable: course.js → features.match-game = { version: 'v1' }
Versions:
  v1  2026-10-22  from BDK (`0fab858`)   best for: name pairs   weaker at: not evaluated   current/
Evidence: Louis's request (BDK notes §4).
Used by: BDK (v1)
Known issues: none open.
Test: `tests/ui.js` (BDK).

## cram-mode
Does: for the day before or the day of a quiz: skips strong cards, asks a guess first on unseen cards, retests at growing gaps, then a Last look sheet; the student chooses multiple choice, select-all or written answers.
Use when: quizzes are frequent and some study happens the same day (BDK: "user might study the day of", 2026-10-22).
Do not use when: exams are weeks apart.
Enable: course.js → features.cram-mode = { version: 'v2' }
Versions:
  v1  2026-10-22  from BDK (`302b151`)   best for: same-day study   weaker at: the First look screen gave nothing to do (BDK notes §2)   archive/v1/
  v2  2026-10-22  from BDK (`3f3e816` guess first; `175571e` answer formats)   best for: same-day study   weaker at: not evaluated   current/
Evidence: Louis's statements (BDK notes §4); no citation recorded.
Used by: BDK (v2)
Known issues: the Cram button shows only within a day of a quiz, so tests pin the clock (`tests/lib.js`).
Test: `tests/cram.js` (BDK).

## memory-model-fsrs
Does: schedules each card with FSRS-4.5 (default parameters, pass/fail grading, target retention 0.9) and shows predicted recall on the quiz day.
Use when: a fixed fact list is studied over weeks (BDK). Proposed as an alternative scheduler behind the core interface (`proposed-core.md` §3).
Do not use when: items are grouped by concept and retested in other wordings (the core scheduler does that).
Enable: course.js → features.memory-model-fsrs = { version: 'v1' }
Versions:
  v1  2026-10-22  from BDK (`0fab858`, `assets/app.js:374-384`)   best for: card decks   weaker at: not evaluated; no confidence grades (pass/fail only)   current/
Evidence: formulas from the open-spaced-repetition wiki ("The Algorithm", `assets/app.js:376`). Louis asked for research on improving memory (BDK notes §1, transcript 2026-10-22T00:41:05Z); no citation is recorded in the repo.
Used by: BDK (v1)
Known issues: none recorded.
Test: `tests/data.js` (BDK); scheduler-specific assertions not checked.

---

## Comparison and confusables

## compare-tab
Does: 2 to 5 drugs side by side, one row per field (Drug class, Brand, Rx / OTC / schedule, Indications, Key side effects, US boxed warnings, Other notes, Activity against), each item marked shared (gray: every drug has it) or different (bold), a row the same for all marked "same", and Only differences; drugs chosen by page (a table picker), by Whole class chips or one at a time (the sixth drops the oldest); with drug-list-tab on, its detail row offers "Compare the N drugs in this class". Choices last for the visit only; nothing is stored. In BDK it also tracks which drugs the student mixes up and names "What you picked" and "What you missed" in feedback (not ported, below).
Use when: the material has look-alike items (BDK drugs).
Do not use when: items share no common fields.
Enable: course.js → features['compare-tab'] = { version: 'v1' }, with the tables in a data file listed in `files` (`const DRUG_TABLES = [...]`, the shape drug-list-tab reads); the options `rows`, `sectionLabels`, `ownField`, `seeAbove`, `classField`, `classSkip`, `labelField`, `brandField`, `max` and `defaultTable` default to BDK's (`module.json`)
Versions:
  v1  2026-10-22  from BDK (`0fab858`; feedback `577d5b6` 2026-10-28)   best for: drug tables   weaker at: not evaluated   current/ (ported 2026-11-08 from BDK `05c36c3` `assets/app.js` `viewCompare` 2301-2374, `COMPARE_ROWS` 2290-2293, `factList` 2294-2299, `classmates` 879, `d.short` 297-299, `splitDepth0` 108-120, the Drug list's button 2611, and `assets/style.css` 90, 106, 310-323)
Evidence: Louis's request (BDK notes §1).
Used by: BDK (v1, its own copy); the kit module: none yet.
Known issues: Adapted: BDK builds each drug's lists from its flashcards (`assets/app.js` 283-347), which split each field into items and reword them (abbreviations spelled out, first letters capitalised); the kit's data has no cards, so each row's list comes from the table's fields: Drug class and Brand as one item, Rx / OTC / schedule, Indications and Activity against split at ", ", Key side effects at "; " then ", ", US boxed warnings and Other notes at "; ", all at parentheses' depth 0 (BDK's `splitDepth0`), the essential-knowledge sections split and resolved as drug-list-tab does ("See above"; a section qualified with another drug of the page). Measured by the test against BDK's own lists for the 300 drugs: the same number of items for every drug in Drug class, Brand, Key side effects, US boxed warnings, Other notes and Activity against, for 296 in Rx / OTC / schedule and 292 in Indications (12 drugs differ in at least one row: where the list prints two items with no separator, such as "Elevated IOP Ocular redness" (page 2) or "PO: HTN IV: hypertensive crisis" (page 6), the kit has one item and BDK two); the same items, letter for letter, for 277, 300, 228, 99, 6, 186, 170 and 284 drugs (in that row order; 278, 300, 228, 145, 272, 269, 239 and 289 but for case). Items are compared without case and with spaces collapsed, each shown in its own words: the list writes one fact as "Asthma" for budesonide and "asthma" for montelukast (page 9), where BDK's cards write both alike. Against BDK's own marking (letter for letter, on its lists), over all 1738 pairs of drugs on one page (10781 rows shown), every row is marked "same" exactly where BDK marks it, and 10772 rows give each drug as many shared items as BDK does; over all 44850 pairs of the 300 drugs, "same" agrees in all 290386 rows and the shared-item counts in 290363. The 9 same-page rows that differ: the list prints two items with no separator (page 2's "Elevated IOP Ocular redness" against "Elevated IOP", 3 rows; page 8's "OTC: various omega-3 formulations Rx: Lovaza & Vascepa", 1); an item with commas inside it (page 27's "Advanced bladder, ovarian, and testicular cancer; various cancers", split by the kit at its commas, 2); a stray ";" in the list (page 27's "bone marrow suppression;", 1); BDK's cards put a route before each item ("IV: Hospital-acquired pneumonia (HAP)", page 12, where the list prints "IV: SSTI, HAP, ..." and the kit shares HAP with a drug without the route, 1); and BDK's cards write one fact in two capitalisations ("HIV Infection", "HIV infection", page 13), which BDK marks different and the kit marks shared (1). Across pages the cards also spell one fact two ways ("Community acquired", "Community-acquired pneumonia (CAP)", pages 10 and 11), where the kit, reading the list's "CAP", shares it. Gray and bold mean shared and different among the kit's items, as worded in the list. The tab opens on the option `defaultTable` or the first table; BDK opens on its next quiz's first page (`currentQuiz`, a date rule). Opening Compare with drugs (the Drug list's button) moves the page picker to their page; BDK's `go('compare', refs)` (`assets/app.js` 1250, 2304-2306) keeps the picker on its saved page. Column headings name the drug's table by its short name (BDK `pageName`, "p25 · Pain/Heme/Onc 1"). Row headings carry `data-field`, which field-colours colours (BDK `th.k-cat`, `th.k-ind`, line 2325). Not ported: the "Learn these N drugs together" button (starts Learn, which records answers: part 2, with learn-mode); "Drugs you have mixed up" (reads `PROGRESS.confusions`, stored: part 3); remembering the picked page and Only differences across visits (BDK `store.set('comparePage')`, `store.set('onlyDiff')`, lines 2361 and 2371: part 3; here they last for the visit); Compare links from question feedback and the "What you picked" / "What you missed" feedback (BDK `sourceBlock` lines 919-933, its Compare buttons 928-930, and the feedback at 1018-1019: no kit view shows a drug's feedback); the mix-up tracking used for wrong choices; the glossary links on each item (BDK draws each item with `gloss(x)`, line 2326; the kit shows plain text).
Test: `features/compare-tab/current/test.js` (BDK `tests/regression.js` lines 110-117, the Compare checks that apply, ported, and more: on BDK's 26 pages at 390 px and 820 px; every drug's lists and every same-page pair against BDK's own; the selection rules; a known pair, oxycodone and methadone; Only differences; with drug-list-tab its Compare button; with field-colours the row headings; ten build-step refusals; with drug-list-tab its recall mode).

## pair-up
Does: a page that pairs confusable items (PH Exam 2 work).
Use when: lectures produce confusable pairs beyond the tell-apart tables.
Do not use when: tell-apart tables already cover the pairs.
Enable: course.js → features.pair-up = { version: 'v1' }
Versions:
  v1  2026-10-11  from PH (`f4196e2`, `vPair()`)   best for: lecture courses   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: PH (v1)
Known issues: none recorded. Overlaps compare-tab; a retro should decide whether one replaces the other.
Test: none found.

## explain-one-cards
Does: a "Why?" button on each table row and an "Explain one" select, with a floating "Back to the explanation" button.
Use when: reference tables carry rows that need their own explanation (PH).
Do not use when: tables are look-up only.
Enable: course.js → features.explain-one-cards = { version: 'v1' }
Versions:
  v1  2026-10-02  from PH (`26c0b3f`, `showExplain()`)   best for: mechanism tables   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: PH (v1)
Known issues: none recorded.
Test: none found.

---

## Figures, structures and animation

## step-through-figures
Does: figures stepped with Back, Next, Replay, Play all and step dots; motion by FLIP with the Web Animations API; reduced-motion respected.
Use when: a process or derivation unfolds in steps (PH receptor mechanisms; PK dosing models).
Do not use when: a static figure is clearer.
Enable: course.js → features.step-through-figures = { version: 'v1' }
Versions:
  v1  2026-10-02  from PH (`6fd1755`, `stepTo()`, rewritten 10/10 per `ENGINE_UPGRADES.md` §3)   best for: process diagrams   weaker at: not evaluated   current/
  v1-port  2026-10-02  PK copy (`c01b619`), figures drawn by `figures.py`
Evidence: `ENGINE_UPGRADES.md` §3 cites aerotwist.com, MDN and web.dev for the animation technique; no learning-science citation.
Used by: PH (v1), PK (v1-port)
Known issues: separate code in PH `app.js` and PK `views.js`.
Test: `exam1-drill/src/stepper_test.js` (PH), `src/stepper_test.py` (PK).

## diagrams-tab
Does: a tab listing every figure by group with jump chips; PK's version reads each graph axis by axis in five steps.
Use when: the course's questions turn on reading figures (PK: "you've got to pay attention to the axis", `src/figures.py` header).
Do not use when: the course has few figures.
Enable: course.js → features.diagrams-tab = { version: 'v2' }
Versions:
  v1  2026-10-02  from PH (`2204025`, `vDiagrams()`)   best for: lecture figure groups   weaker at: not evaluated   archive/v1/
  v2  2026-10-26  from PK (`b31f652`, axis-by-axis reading; SVG figures from `067799f` 2026-10-04)   best for: graph-reading courses   weaker at: not evaluated   current/
Evidence: the professor's remark quoted above (PK notes §1).
Used by: PH (v1), PK (v2)
Known issues: PK `src/README.md` line 313 still lists `diagrams.js` as dropped (PK notes §3).
Test: none specific.

## scenes
Does: animated process scenes with synchronized narration.
Use when: a biological process is taught as a sequence (PH).
Do not use when: no process content.
Enable: course.js → features.scenes = { version: 'v1' }
Versions:
  v1  2026-10-11  from PH (`f4196e2`, `vScenes()`)   best for: physiology and mechanism sequences   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: PH (v1)
Known issues: none recorded.
Test: `exam1-drill/src/test.js` checks scene scripts for length and misread forms.

## graphs-drill
Does: per-figure question drills with feedback on skipped questions.
Use when: the course tests curves (PH dose–response).
Do not use when: no graph content.
Enable: course.js → features.graphs-drill = { version: 'v1' }
Versions:
  v1  2026-10-01  from PH (`a12b931`, `vGraphs()`)   best for: curve interpretation   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: PH (v1)
Known issues: none recorded.
Test: none found.

## structure-atlas
Does: an atlas tab of drawn skeletal structures (11 boards, 84 groups on 86 tiles) and generated "name the group" questions with distractors from the same board; question figures use a neutral `aria-label` (`FGQ`) so the figure does not name its answer.
Use when: the course draws structures (MC functional groups).
Do not use when: no structures.
Enable: course.js → features.structure-atlas = { version: 'v1' }
Versions:
  v1  2026-09-20  from MC (`7aa5816`, `src/atlas.js`, `src/gen_atlas_q.py`)   best for: functional-group recognition   weaker at: not evaluated   current/
Evidence: Louis: "I have a hard time remembering and distinguishing them" (2026-08-25; MC notes mark this from session memory, unverified).
Used by: MC (v1)
Known issues: ported from Louis's artifact `claude.ai/artifact/Qx3Zq6gMVACWS17UBnJiTi` (`src/atlas.js:4`).
Test: a browser assertion guards the `FG`/`FGQ` split (MC corrected notes §1).

## structure-compare
Does: draws structures beside the options (`fgShow` at 240 px, `optFig`, `cmpStrip` with the answer first), automatically when every option is an atlas group.
Use when: options are structures (MC).
Do not use when: no structure atlas.
Enable: course.js → features.structure-compare = { version: 'v1' }   (requires structure-atlas)
Versions:
  v1  2026-09-20  from MC (`7aa5816`)   best for: structure recognition   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: MC (v1)
Known issues: none recorded.
Test: none found.

## source-page-viewer
Does: shows the source page or slide itself: BDK shows each PDF page per quiz; PK shows the cited slide whole only after an answer, because a slide often carries the answer.
Use when: the student studies from a printed source (BDK list pages; PK decks).
Do not use when: the page shows personal marks (BDK `ae8840c` replaced highlighted pages; PH `3b0f4ed` removed a slide with personal text).
Enable: course.js → features.source-page-viewer = { version: 'v1', when: 'after-answer' | 'always' }
Versions:
  v1  2026-09-22  from PK (`7b8338c`, `src/slides.py`)   best for: slides that print answers   weaker at: not evaluated   current/
  v1-bdk  2026-10-22  from BDK (`13ab5a6`, `tools/render_pages.py`)   best for: a list PDF   weaker at: not evaluated
Evidence: none recorded.
Used by: PK, BDK
Known issues: both privacy incidents above.
Test: none specific.

---

## Calculation courses

## formulas-in-text
Does: sets formulas typed in plain text the way the slides print them, as each question is drawn: `{{frac:a|b}}` stacks, a caret raises, the course's symbols take their subscripts (C0, VD, ka), t1/2 reads t½, a spaced x is a times sign and a spaced hyphen a minus; fractions in the reading tabs stack too. Stored text is not changed, and text without these marks is drawn as before.
Use when: the course's formulas are typed into the bank (PK: 5,965 `{{frac:` marks in the 36 files its build ships, 4,267 of them in its 829 questions, counted 2026-11-01 at `ac2eb73`).
Do not use when: no formulas in the bank.
Enable: course.js → features['formulas-in-text'] = { version: 'v1', symbols: [['VD', 'V<sub>D</sub>'], ...], rates: ['k0', ...] }
Versions:
  v1  2026-11-01  from PK (`49e2916` 2026-09-25 `prettyMath`, `679e52f` 2026-09-23 `FRAC_RE`; ported from `ac2eb73` `src/views.js` 1-93 and 3496-3505)   best for: kinetics formulas typed in plain text   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: none yet (PK keeps its own copy until it moves onto the core).
Known issues: a `{{frac:...}}` that a glossary gloss is inserted into is left as typed (the gloss splits the mark); none of PK's `ac2eb73` bank was checked for this. Why a module and not core: the symbol table is course data, only calculation courses have formulas, and a course without the module keeps its page unchanged.
Test: `features/formulas-in-text/current/test.js` (its stems, options and worked steps drawn exactly as PK's own formatter draws them, on 8 PK questions and 1 calculation; PK `src/test.js` 826-874 ported).

## plan-the-problem
Does: before a calculation, asks what is wanted and its unit, which givens apply, and a sanity check.
Use when: the exam supplies the equation sheet, so choosing the line is the skill (PK: "You've got to think about which one do I want to apply in this application", `src/reference.js` line 32).
Do not use when: no calculations.
Enable: course.js → features.plan-the-problem = { version: 'v1' }
Versions:
  v1  2026-10-07  from PK (`fb07443`)   best for: equation-sheet exams   weaker at: not evaluated   current/
Evidence: the professor's remark quoted above (PK notes §1).
Used by: PK (v1)
Known issues: none open.
Test: `src/test.js` (PK).

## equation-drill
Does: type an equation line, build it from pieces ("Build it"), find it on the whole sheet, and "How she asks it"; a sheet map of which lines the printed sheet includes and omits, printed in the sheet's own layout.
Use when: a formula sheet is given at the exam (PK).
Do not use when: no formula sheet.
Enable: course.js → features['equation-drill'] = { version: 'v2', groups: {1: 'Module 1: ...'} }, with formulas-in-text on (it `needs` it) and the equations in a data file listed in `files` (`const EQUATIONS = [...]`, the shape in PK `src/equations.js`)
Versions:
  v1  2026-10-05  from PK (`50a803b`)   best for: equation sheets   weaker at: reordered factors marked wrong; bracket-only lures (PK notes §2)   not ported (kept in PK at `50a803b`)
  v2  2026-10-07  from PK (`164ac5a`; sheet print layout `33789e3` 2026-10-27)   best for: equation sheets   weaker at: not evaluated   current/ (the Equations tab and its drill, ported 2026-11-01 from PK `ac2eb73` by `features/equation-drill/port_from_pk.py`; each equation also opens its symbols, the condition it holds under, its derivation and its source)
Evidence: Louis asked that reordered factors count as right while order still matters in some equations (PK notes §1, from session memory).
Used by: PK (v2, its own copy); the kit module: none yet.
Hold: not to be switched on in any course until the core fix for module parts in per-tab records (kit #69, `core/record_modules_test.js`) is merged (Louis, 2026-11-06). Without it, a tab's last save holding `DB.eq` that the stored progress lacked could be removed without a copy. That fix also covers the review's M1, a later record replacing a progress whose `DB.eq` it lacked, and M2, a record retired by Erase, Put back, Import or Delete the copies before it was placed. The same hold applies to worksheets-ink (`DB.ink`), whose catalog entry arrives with kit #17.
Known issues: in PK, the set-up reasoning's `whySentences` uses regex lookbehind (`src/views.js:4937`, added in `0f266e5`); it is part of the set-up drill, which the kit module does not include, so the module has none (`device_lint.js`). Not ported: the set-up drill ("Set-up only") and "How she asks it" (both need plan-the-problem's set-up data), the variables quiz (variables-quiz, Tier 2), the sheet map and its print layouts (`sheet.js`), the exam chip. The normaliser keeps PK's kinetics spellings (half-life, clearance, the ideal-body-weight height term).
Test: `features/equation-drill/current/test.js` (PK `src/equation_test.py` and `src/test.js` section 5d ported: 30 checks on the template course with 14 PK equations added); `src/review_test.py` (PK) was not ported, since the sheet map is not.

## wrong-number-diagnosis
Does: reads an entered wrong number back to the error that produces it (wrong combination of givens, unit factor, reciprocal, missing 0.693, mid-working value, copied given, near miss) before naming the kind of miss.
Use when: numeric items with worked steps (PK).
Do not use when: no numeric items.
Enable: course.js → features['wrong-number-diagnosis'] = { version: 'v1' } (with `numeric` set, a number typed with its unit is read too)
Versions:
  v1  2026-10-07  from PK (`ae9dcb1`, `src/shell.html:1316-1366`)   best for: calculation courses   weaker at: not evaluated   current/ (ported 2026-11-01 from PK `ac2eb73` `src/shell.html` 1270-1338 by `features/wrong-number-diagnosis/port_from_pk.py`)
Evidence: none recorded; the course reason is from session memory (PK notes §1).
Used by: PK (v1, its own copy); the kit module: none yet.
Known issues: none recorded. In the kit the student's pick is the engine's `miss` (what Weak spots counts) and the number's reading is kept beside it as `missSuggest`; PK keeps the pick as `missKind`, which the module converts to `miss` when a progress is loaded or imported. The reading is shown in the quiz and on an exam paper's result page; PK's own placements in its other views are not ported.
Test: `features/wrong-number-diagnosis/current/test.js` (PK `src/test.js` lines 368-387 ported: 15 checks).

## chained-problem-sets
Does: a problem set asked in parts, each part stating the earlier results it uses, kept together and in order on a paper.
Use when: the professor asks one vignette in parts (PK: "at the rate you determined above", `src/BANK_SPEC.md` line 166).
Do not use when: questions are independent.
Enable: course.js → features['chained-problem-sets'] = { version: 'v2' }, with the sets in a data file listed in `files` (`const CHAINS = [{id, name, setup, parts: [...]}]`)
Versions:
  v1  2026-10-07  from PK (`3d9fb75`)   best for: vignette exams   weaker at: 45 parts used an earlier result without stating it   not ported (kept in PK at `3d9fb75`)
  v2  2026-10-17  from PK (`095fdae`, with a test that reads the working)   best for: vignette exams   weaker at: not evaluated   current/ (ported 2026-11-01 from PK `ac2eb73`)
Evidence: PK `notes/PORT_EVALUATION_2026-10-17.md` §5, R5.
Used by: PK (v2, its own copy); the kit module: none yet.
Known issues: the history of PK (searched for the names, 2026-11-01) has `startChain` and `CHAINS` first in `91f1d5f` (2026-09-22); the v1 line names `3d9fb75`, the first commit of `paperOrder`. Not ported with the module: PK's per-module listing of sets on Topics, its review switch ("Stepwise calculations") and its worksheet pages; the kit module lists every set in one "Problems asked in parts" card.
Test: `features/chained-problem-sets/current/test.js` (PK `src/problemset_test.py`, `src/test.js` section 5c and lines 760-807 ported); the build step stops the build on a set that names a missing question or a question in two sets.

## calc-stopwatch
Does: a stopwatch on each calculation and time per kind of item on Weak spots.
Use when: the professor sets a time per calculation (PK: "A few calculations, each meant to take 2 minutes or less", `src/course.js` line 264).
Do not use when: no timed calculations.
Enable: course.js → features.calc-stopwatch = { version: 'v1', targetSeconds: 120 }
Versions:
  v1  2026-10-07  from PK (`5326a60`)   best for: timed calculation exams   weaker at: not evaluated   current/
Evidence: the professor's statement quoted above.
Used by: PK (v1)
Known issues: none recorded.
Test: none specific.

## variables-quiz
Does: which symbol a worded question asks for, and what each symbol means.
Use when: worded calculation questions name a quantity without its symbol (PK: "sometime i forgot in worded concept what variable its asking for", 2026-10-27).
Do not use when: no symbol-heavy content.
Enable: course.js → features.variables-quiz = { version: 'v1' }
Versions:
  v1  2026-10-27  from PK (`f013ced`)   best for: kinetics symbols   weaker at: not evaluated   current/
Evidence: Louis's request (PK notes §1).
Used by: PK (v1)
Known issues: `askSentence` uses regex lookbehind (`src/views.js:1087`, added in `f013ced`).
Test: `src/var_test.py` (PK).

---

## Source material and worksheets

## source-registry
Does: links each problem-set part and quiz item to its original document and problem number; separates instructor solutions from drill explanations.
Use when: exams are built from the professor's own problem sets (PK `src/BANK_SPEC.md` line 32).
Do not use when: questions come only from slides.
Enable: course.js → features.source-registry = { version: 'v1' }
Versions:
  v1  2026-10-21  from PK (`4ce505d`, `src/sources.js`)   best for: problem-set courses   weaker at: not evaluated   current/
Evidence: Louis: "Connect each drill question to its matching source document and problem number" (2026-10-21, PK notes §1).
Used by: PK (v1)
Known issues: a student's name was in four source comments (removed in `4ce505d`).
Test: `src/sources_check.js` (PK).

## drug-list-tab
Does: a Drug list tab: one table per page or section of the course's drug data, under its title, with its legend; group chips (BDK: its quizzes, each naming pages, plus All pages) that narrow the tables shown; a search across every table, not only the chosen group's ("Showing matches from all pages.", "No matches"); a tap, Enter or Space on a row opens a detail row under it with the row's essential knowledge in sections (Key side effects, US boxed warning(s), Other notes), and closes it again; a jump strip to each table shown; a page-image view only when every table gives an image; a recall mode with a writing box and Reveal per row (below).
Use when: the course hands out a drug list as tables, page by page (BDK's 26 pages, 300 drugs, `data/decks.json` at `05c36c3`).
Do not use when: the course has no tables of drugs or items to look up.
Enable: course.js → features['drug-list-tab'] = { version: 'v2', groups: [{label: 'Week 2', tables: [11, 12, 13]}, ..., {label: 'Cumulative', tables: 'all'}], defaultGroup: 'Week 14', headTag: 'p{id}', recallDefault: false }, with the tables in a data file listed in `files` (`const DRUG_TABLES = [{id, title, short, legend, color, image, imageSize, rows: [{generic, brand, ...}]}]`); the options `columns`, `searchFields`, `detailField`, `detailSections` and `detailOwnField` default to BDK's (`module.json`)
Versions:
  v1  2026-10-21  from BDK (`87d17e5`, `viewBrowse`; quiz chips and the search across pages `13ab5a6` 2026-10-22)   best for: drug lists printed as tables   weaker at: not evaluated   archive/v1/ (ported 2026-11-08 from BDK `05c36c3` `assets/app.js` 2553-2618, 42, 882-899 and `assets/style.css`)
  v2  2026-11-09  v1 with Forgot / Partly / Knew ratings kept in the profile's progress (DEENT `b747e49` `src/druglist_ui.js` 98-99, 117-118, 415-428 and `src/drugfacts.js` 38-40, 120-141)   best for: a list a student recalls field by field across visits   weaker at: not evaluated   current/ (queue item 23; Louis, 2026-11-09: the pull request goes to him before any merge or any course switches it on)
Evidence: none recorded.
Used by: BDK (v1, its own copy); the kit module: none yet.
Known issues: the build step refuses a table without an id or rows, a group naming a table that does not exist, a column, searched field or detail field that no row has, images for some tables but not all, and a default group that is not a group. Adapted: BDK builds a row's essential knowledge from its flashcards, which split each section into items and reword them; the kit's data has no cards, so the module splits the row's `essential` text at its labels and shows each section as the list prints it, one entry per label, with its qualifier marked; a section qualified with another drug of the same page, such as "(only for ketorolac)", is shown only on that drug's row (on BDK's 300 rows this gives each row the sections and qualifiers its cards give it). That rule is a heuristic tuned on BDK's data: a qualifier counts as naming a drug only when its first word, after "only for", is the first word of a row's `detailOwnField` on the same table, and the row must hold every word of the qualifier, so a qualifier such as "(only for X and Y)" or one using an abbreviation would hide the section from the rows it names. Ported as BDK has it: resolveSeeAbove (`assets/app.js` lines 331-347): a qualified section whose text starts "See above" (option `detailSeeAbove`) shows instead the texts of the same section and qualifier on every row of every table (the row's own included), in the data's order without repeats (BDK's Set per qualifier); in BDK's data, the boxed warnings "(all opioid analgesics)" of methadone (p25) and of hydrocodone, oxycodone and codeine with acetaminophen (p26) show page 25's list, also when page 25 is not shown. The texts are the list's (`essential`); BDK's own detail shows the same six warnings from its cards, reworded ("Central nervous system (CNS) depressants"). BDK's gray marking of side effects shared by the whole class needs the card items and is not ported; "US boxed warning" is plural when a row has more than one such section or the list's label is plural, where BDK counts card items. The tab opens on the option `defaultGroup`: BDK opens on its next quiz, a rule that reads the student's stored lab day (`currentQuiz`, line 1381), and its "· next" chip mark is not ported. Group and view choices last for the visit only (BDK stores them as `listQuiz` and `listView`). Changed from BDK: the page tag beside a table's title is drawn at full colour, not BDK's opacity .75 (`assets/style.css` 268), which reads below 4.5 : 1 on 8 of BDK's 26 page colours (3.61 : 1 on `#ff5050`); the test measures every table's heading and tag. Not ported: saved personal lists ("My drug lists", BDK `lists` and `seededLists`: new storage, part 3); remembering the chosen group or view across visits (storage, part 3); the "Compare the N drugs in this class" button (compare-tab, queue item 12); the Quizlet download files; the glossary pop-ups (`gloss`: the kit's `glossify` adds inline definitions and has no tap pop-up to call); BDK's field colours on the category and indication headings (field-colours, queue item 22). With `recallFields` empty (the default), nothing is written to localStorage, sessionStorage, IndexedDB or the progress; with it, only the ratings below, in the progress.
Recall mode (from DEENT `src/druglist_ui.js` at `0281922`, lines 31-32, 70-71, 160-174, 203-206, 209, 236, 248-253, 256-259; DEENT draws cards, the module draws table rows): a Recall mode chip; with it on, each row shows only the fields of the option `recallShow` (BDK: generic, brand) and every other cell is drawn empty but for a visually hidden "hidden", so no hidden text is in the page until the row is revealed (DEENT draws a card's answer only when it is open, line 174); under each drug row, a row of its own holds a writing box and a Reveal / Hide again button with `aria-expanded` and `aria-controls` (a cell of the table is too narrow to write in; the row spans the table as the detail row does); Reveal shows that row's cells and its detail row, and in recall mode a tap on the row opens nothing and drug rows take no focus and no pointer cursor (Reveal is the control); Show class shows the field of the option `recallClassField` (BDK: category; empty: no chip) on every row; Reveal all shown reveals the rows the chosen group and the search show, Hide all hides every row. What is typed and which rows are revealed are kept in memory for the visit (through a group change or a search) and are gone on a reload; nothing is stored. Differences from DEENT: DEENT opens with recall on, the module only when the option `recallDefault` is true (default false, so BDK's list opens as before); the box's label is the option `recallPrompt`, default "Write what you recall first (self-check: not graded, not saved)", adapted from DEENT's "Write the target or mechanism first"; the note is DEENT's line 209 adapted to the table; a group chip clears the search, as BDK's does, while the Recall mode and Show class chips keep it, as DEENT's do; in recall mode the search looks only in the `recallShow` fields and `recallClassField`, as DEENT's `findText` (line 99: name, other names, brands, class) does, and the note says so; with recall off it looks in `searchFields`, as BDK's does; recall mode draws the table only: while it is on, the Table / page-image choice is hidden, and turning it off brings back the choice and the view chosen before. Not ported from DEENT: its Flashcards (`flash`, `fi`; queue item 16, part 2).
Ratings kept in the progress (v2; option `recallFields`, default empty: none, as in v1): recall mode asks for one field at a time ("Ask for", DEENT's Recall field), and once a row is revealed, Forgot / Partly / Knew with DEENT's criteria rate that fact, `<drug id>:<field>` (the drug id is a slug of the option `idField`, default `generic`: 300 BDK rows, 300 ids; the build refuses two rows with one id). The ratings are kept as `DB.drugs = {v: 1, ev: [{f, r, at}]}`, at most 2,000, the oldest by time dropped past that (at 2,000 BDK ratings the part is 140,245 characters, about 70 a rating, in the progress and again in this tab's own record, measured by the test): Reset clears them, each profile has its own, Export and Import carry them, and this tab's own record (#69) holds them. A second rating of the same opening replaces the first; a new opening is a new rating. A rating is written at once, and the note under the buttons says "Saved" only when the stored progress is this page's and the browser did not refuse the write; otherwise it says it is not saved and points to the core's notice. Nothing typed is kept, and a rating never goes through `record()`: it adds no answer, answer count or history entry. The line under each row shows the field's last rating and count and, apart from them, the status of the bank questions the course's optional `DRUG_FACTS` (`{question id: [fact ids]}`, DEENT's `drugfacts.js` MAP shape) maps to the fact, with DEENT's status words (Not practised, Forgot, Right, but unsure, Remembered, Kept on a later day), read from the answers only; so no event is counted twice. The ratings line adds "Kept on a later day" by DEENT's rule as the DEENT session gave it for ratings (2026-11-09): the last rating is Knew and an earlier Knew in the unbroken run of Knew ratings ending with it falls on an earlier day; Forgot or Partly breaks the run, same-day repeats never count. Days, for the ratings and the bank part, are the core's `dayKey` (the browser's calendar day), worked out when read: only the time is stored. "Not yet Knew" shows the rows whose last rating is not Knew. Import with only the ratings differing (measured by the test): the same file, nothing; a file without the ratings, nothing; an older file of the same profile one rating behind, or a file with one more rating, goes into a new profile (`core/README.md` 805-840), which is the Import behaviour the proposal in the pull request addresses.
Each column heading carries `data-field="<field>"`, which field-colours colours (BDK marks its two coloured headings `th.k-cat`, `th.k-ind`, `assets/app.js` line 2598).
Test: `features/drug-list-tab/current/test.js` (BDK `tests/ui.js` lines 7-28, the list checks that apply, ported, and more: 186 checks on BDK's 26 pages at 390 px and 820 px with recall mode off and on, a copy with other options (recall on at opening, one field shown), a copy whose one column carries a sub-field named in `recallShow` and an image per table, and eight build-step refusals; v2: 106 more on a copy with `recallFields` and `DRUG_FACTS`, at 390 px and 820 px, each storage check read back after a reload, the Import measurements, and six more refusals).

## worksheets-tab
Does: the course's handouts, quizzes and reviews by module folder, with links to the originals, printable blank PDFs and separate solutions.
Use when: the course hands out worksheets (PK).
Do not use when: no handouts.
Enable: course.js → features.worksheets-tab = { version: 'v2' }
Versions:
  v1  2026-10-21  from PK (`e839844`)   best for: module-organised handouts   weaker at: layout was redone twice (PK notes §2)   archive/v1/
  v2  2026-10-26  from PK (`e6ea184`, `2759b31`, Louis's folder layout of 2026-10-26)   best for: module-organised handouts   weaker at: not evaluated   current/
Evidence: Louis's answers of 2026-10-21 and 2026-10-26 (PK notes §4).
Used by: PK (v2)
Known issues: PDFs went stale after style changes until `f013ced` limited the style hash.
Test: `src/sheets_test.py` (PK).

## ink-layer
Does: writing with an Apple Pencil or a finger on worksheets and as scratch paper; v2 snaps held strokes to lines and shapes, blocks text selection, adds two-finger undo.
Use when: calculation practice on an iPad (PK).
Do not use when: no written work.
Enable: course.js → features.ink-layer = { version: 'v2' }
Versions:
  v1  2026-10-26  from PK (`c981545`)   best for: freehand working   weaker at: text selection while writing; eraser missed snapped lines; lifting hand ended a stroke (PK notes §2)   archive/v1/
  v2  2026-10-27  from PK (`041274d`)   best for: GoodNotes-like writing   weaker at: not tested on a physical iPad; Pencil pressure unused   current/
Evidence: Louis asked for writing that "can follow how it writes on Goodnotes" (PK notes §4).
Used by: PK (v2)
Known issues: checked with synthetic pointer events only (`notes/WRITE_ON_WORKSHEETS.md` line 23).
Test: `src/ink_test.py` (PK).

## readings-page
Does: one card per assigned reading, grouped by exam: summary, status, links into Drive, a Drill button over questions tagged `readingId`, where the lecture used it with verbatim quotes, terms it defines, what lies beyond the lecture.
Use when: the professor assigns readings and tests them as discussed (PH; PK textbook chapters).
Do not use when: no assigned readings.
Enable: course.js → features.readings-page = { version: 'v1' }
Versions:
  v1  2026-10-17  from PH (`a63d34d`, `vReadings()`, `gen_readings.py`)   best for: article and chapter readings   weaker at: not evaluated   current/
  v1-pk  2026-10-17  from PK (`2673dd0`, textbook reading cards under Guides)   best for: textbook chapters   weaker at: not evaluated
Evidence: none recorded.
Used by: PH (v1), PK (v1-pk)
Known issues: PH notes §5: `dipiro-e6` may be the wrong posted chapter.
Test: `exam1-drill/src/test.js` checks `readingId` and anchors (PH).

---

## Audio

## recorded-narration
Does: recorded clips for figure steps, "Hear the why" on questions, scenes and drug walkthroughs, with a device-voice fallback; the site works with sound off; cost reported before generation, one take per clip.
Use when: Louis supplies voice credits and wants spoken explanations (PH; PK "Hear why").
Do not use when: no credits; the device voice then reads the scripts.
Enable: course.js → features.recorded-narration = { version: 'v1', voice: '<id>' }
Versions:
  v1  2026-10-11  from PH (`429f485`, `NARR_Q`, `NAR`)   best for: explanations and processes   weaker at: not evaluated   current/
  v1-pk  2026-10-27  PK "Hear why" (`f013ced`, recorded `d923d9d`)   separate code in PK
Evidence: Louis: "On all the most likely questions can we have the narrator explain the why please?" (PK notes §4).
Used by: PH (v1), PK (v1-pk)
Known issues: quota ran out in both courses (PH 62 of 181 clips on 10/18; PK 166 of 197 recorded) (PH notes §2, PK notes §2).
Test: `exam1-drill/src/test.js` checks spoken forms (PH); `src/why_test.py` (PK).

## listen-deck
Does: on the Readings page, a two-to-three-minute talk per reading with Play all, Shuffle, Next, Stop and speed; the text shows while it plays.
Use when: readings-page is on and Louis wants to listen.
Do not use when: no readings.
Enable: course.js → features.listen-deck = { version: 'v1' }   (requires readings-page)
Versions:
  v1  2026-10-17  from PH (`9b46a29`, `rdPlayFrom`)   best for: readings   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: PH (v1)
Known issues: none recorded.
Test: none specific.

## guide-walkthroughs
Does: a spoken script per guide section, the slide shown beside each part, recorded clips; a reload returns to the same part.
Use when: guides exist and Louis wants them narrated (PH guides 1 to 39; PK 42 walkthroughs).
Do not use when: no guides or no credits.
Enable: course.js → features.guide-walkthroughs = { version: 'v2' }
Versions:
  v1  2026-10-23  from PH (`e1c893b` (branch); recorded `f9b4617` (branch))   best for: lecture guides   weaker at: wrong table shown when parts were tapped out of order (fixed `b307703`)   archive/v1/
  v2  2026-10-26  from PK (`bc8321d`; concept-first rewrite `71ce449`)   best for: concept-first explanation of formulas   weaker at: not evaluated   current/
Evidence: Louis asked for PK's to be built the way PH built its walkthroughs (PK notes §1).
Used by: PH (v1), PK (v2)
Known issues: separate code in PH and PK; PH Exam 4 walkthroughs unrecorded pending approval of the cost (PH notes §5); PK's `gwSents` uses regex lookbehind (`src/views.js:5796`, added in `bc8321d`), which older Safari rejects.
Test: `src/walk_test.py` (PK).

## break-clip
Does: a short video after a submitted paper (PK, three clips in rotation) or suggested after an exam sim or 30 minutes of study (PH).
Use when: Louis supplies the clip and asks for it.
Do not use when: no clip; never during a paper.
Enable: course.js → features.break-clip = { version: 'v2', clips: [...] }
Versions:
  v1  2026-10-04  from PK (`7cddf6c`; third clip `802252d` 2026-10-27)   best for: after a paper   weaker at: not evaluated   archive/v1/
  v2  2026-10-22  from PH (`c22e4bd`, `motivSuggest`)   best for: after a paper or long study   weaker at: does not play in the test Chromium, which has no H.264 (PH notes §2)   current/
Evidence: Louis's requests (PK notes §4; PH notes §4).
Used by: PK (v1), PH (v2)
Known issues: as above.
Test: none.

---

## Exam simulation additions

## exam-notes
Does: notes on any question with an export for an AI to review, flags on exam papers, and a Notes tab to read, edit, drill, delete or export.
Use when: Louis wants to record his own questions while practising (PK).
Do not use when: no need to annotate.
Enable: course.js → features.exam-notes = { version: 'v1' }
Versions:
  v1  2026-10-27  from PK (`c1c847e`; Notes tab `87559c1`)   best for: practice papers   weaker at: not evaluated   current/
Evidence: Louis's messages of 2026-10-27 (PK notes §4).
Used by: PK (v1)
Known issues: none recorded.
Test: `src/notes_test.py` (PK).

## weak-spot-marks
Does: marks weak concepts where they are studied (guides, reference), with a switch in Weak spots; marks go away once the concept is understood.
Use when: the student studies from the guide pages (PK).
Do not use when: no guide pages.
Enable: course.js → features.weak-spot-marks = { version: 'v1' }
Versions:
  v1  2026-10-26  from PK (`3797474`)   best for: guide-based study   weaker at: not evaluated   current/
Evidence: Louis: "this feature can be turned off in weak spots and highlighted portions will go away once concept is understood" (PK notes §4).
Used by: PK (v1)
Known issues: none recorded.
Test: `src/weak_test.py` (PK).

---

## Content generation

## table-deck-generator
Does: turns a PDF table into cards by code: one page = one deck set, merged cells read from the drawn cell rectangles (one card naming every drug in a merged cell), text normalisation, an audit report with flags and differences from the prior year.
Use when: the source is a table (BDK list, 300 drugs on 26 pages).
Do not use when: the source is lecture decks and transcripts.
Enable: course.js → features.table-deck-generator = { version: 'v1', spec: '<path>' }
Versions:
  v1  2026-10-21  from BDK (`f32c87a`, `tools/extract.py`, `tools/norm.py`, `tools/build.py`)   best for: drug lists   weaker at: not evaluated   current/
Evidence: Louis's "BDK QUIZLET DECK SPEC" (BDK notes §4).
Used by: BDK (v1)
Known issues: the spec's "check against the existing ID1 deck" step was neither done nor reported as skipped (BDK notes §3).
Test: the audit in `build_report.md`; `tests/data.js` (BDK).

## quizlet-export
Does: `Question<TAB>Answer` import files for every page.
Use when: Louis also studies in Quizlet (BDK).
Do not use when: no Quizlet use.
Enable: course.js → features.quizlet-export = { version: 'v1' }
Versions:
  v1  2026-10-21  from BDK (`f32c87a`, `downloads/BDK_2026-2027_Quizlet_Decks.zip`)   best for: card decks   weaker at: Select ALL answers stay bundled, as the spec requires   current/
Evidence: Louis: "quiz me on the questions of each drug asked like how i like it on quizlet" (BDK notes §1).
Used by: BDK (v1)
Known issues: as above.
Test: none specific.

## single-fact-questions
Does: generates one-fact questions from a table ("which drug?", "pick the item") with look-alike exclusion and the drug's own name masked as "[this drug]".
Use when: table cells hold several facts each (BDK essential knowledge).
Do not use when: the bank is hand-written from lectures.
Enable: course.js → features.single-fact-questions = { version: 'v1' }   (requires table-deck-generator)
Versions:
  v1  2026-10-25  from BDK (`71da38b`; merges `e362e6a` 2026-10-27)   best for: drug-list facts   weaker at: not evaluated   current/
Evidence: Louis approved the formulations (BDK notes §4, 2026-10-25).
Used by: BDK (v1)
Known issues: 16 questions named their own answer before masking (fixed `71da38b`); `maskNames` builds a lookbehind pattern at run time (`assets/app.js:295`), and in a browser that rejects it the decks would not load (`findings.md` §6.5).
Test: `tests/data.js`, `tests/regression.js` (BDK).

## glossary
Does: defines technical terms: MC glosses a term once per question at first use (`GLOSS`); PH builds a Terms bank and page from `glossary.js`; BDK defines a term on tap (198 entries) with a MedlinePlus search link.
Use when: questions use terms the course defines.
Do not use when: terms are already defined in each question.
Enable: course.js → features.glossary = { version: 'v3', mode: 'inline' | 'terms-page' | 'tap' }
Versions:
  v1  2026-09-20  from MC (`7aa5816`, `GLOSS`, 33 terms per MC corrected notes §1)   best for: inline glossing   weaker at: not evaluated   archive/v1/
  v2  2026-09-28  from PH (`0327661`, `vTerms()`, `gen_terms.py`)   best for: a term bank with questions   weaker at: not evaluated   archive/v2/
  v3  2026-10-22  from BDK (`bf91dc0`, `data/glossary.json`)   best for: drug-list terms   weaker at: not evaluated   current/
Evidence: Louis asked for tap-to-define (BDK notes §4).
Used by: MC (v1), PH (v2), BDK (v3)
Known issues: BDK's MedlinePlus link points outside the course material; decision 3 bars outside content from questions, explanations and tables, and a link is not covered by its wording. **Decision for Louis.** BDK's `loadGlossary` builds a lookbehind pattern (`assets/app.js:655`); where that is rejected, tap-to-define would be missing.
Test: `explain_check.js` `WEIGHTY` table (MC, PK).

## table-recall-drill
Does: recall a course table from written answers, row by row (PH drug ↔ receptor: name the receptor and action, or the drug; PH poisoning table).
Use when: the professor tests a table as a table.
Do not use when: no tables to memorise.
Enable: course.js → features.table-recall-drill = { version: 'v1', table: '<id>' }
Versions:
  v1  2026-10-12  from PH (`5a563f4`, `vRxq()`)   best for: drug-receptor tables   weaker at: not evaluated   current/
  v1-b  2026-10-20  from PH (`96e33bf`, `src/poison_table.js`)   best for: the professor's posted table key   weaker at: not evaluated
Evidence: none recorded.
Used by: PH
Known issues: content-bound; `share/FEATURES.md` notes a kinetics course would replace it with an equation drill of the same shape.
Test: none found.

## standalone-diagram-pages
Does: separate diagram pages built from their own sources, with hashes checked by the main tests.
Use when: a set of diagrams is used outside the drill (PH antidotes, built from a 10/19 chat handoff).
Do not use when: figures belong inside questions.
Enable: course.js → features.standalone-diagram-pages = { version: 'v1' }
Versions:
  v1  2026-10-20  from PH (`28018c7`, `antidotes/`)   best for: one-off diagram sets   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: PH (v1)
Known issues: none recorded.
Test: `exam1-drill/src/test.js` checks the hashes (PH notes §1).

---

## Process features (scheduled tasks and agents)

These are routines and agent definitions rather than page modules. They go to
SKILL.md (Mode 5) and `core/agents/` (proposed), and are listed here so they are
not lost.

- **daily-material-check** (PH, PK): lists new Drive files each class morning and never ingests. PH `share/PORTING.md` §6; PK ran 2026-10-18 to 10-27 at 06:52 America/Chicago (PK notes §3). Known issue: PK's task was created without the Drive connector (PK notes §2).
- **daily-polish with simulated students** (PH `3536d71` (branch), 2026-10-26): a daily practice paper and click-through by simulated students. Known issue: the paper showed the correct answer as option A on 28 of 40 questions until options were shuffled (`2395ea7` (branch), 2026-10-30).
- **daily-review** (BDK, task `trig_01VZfFupWhJzsgL7Q4f7mU2a`, `docs/daily-review.md`): reviews pages for errors daily. Known issue: the 2026-10-30 run had no write access and did no review; no run has logged to `reviews/LOG.md` (BDK notes §2, §5).
- **agents**: PH six (`share/agents/*.md`), PK three (`.claude/agents/`).

## Content patterns (rules for SKILL.md, not modules)

- Verbatim polls and quizzes under `sub:"verbatim"`, exempt from the option-length rules (PH `e7c0b61`, 2026-09-29).
- "Why" question banks that ask the reason behind a concept (PH `63baf64`, 121 questions per PH notes §1).
- Problem sets kept in the professor's original wording and numbers, with changed-number practice as an extra (PK, Louis's answer of 2026-10-21).
- Source order for conflicts: her worked solution, her correction in lecture, the slide, then the textbook (PK `src/BANK_SPEC.md` line 18, `30ab70b`); transcript first, then slide, then reading as discussed (PH `share/FEATURES.md`). These two orders differ and need one rule. **Decision for Louis.**
- Citation by slide title when a deck has no page numbers (MC `src/README.md:394-401`; PH `share/FEATURES.md`).
- The explanation standard: concept block opens on the subject, sectioned `teach`, each wrong option names the misunderstanding by category (MC `claude/drill-explanation-standard.md`, per MC corrected notes §1).
- A figure must not carry its own answer in an `aria-label` (MC `FG`/`FGQ`).

## Planned, not built

- **report-a-problem** (capability 6): a button that opens a GitHub issue on the course repo, off by default. No drill has one (searched for `issues/new` in all four, 2026-10-31).
- **cross-course-review** (capability 3): earlier courses' questions at a low rate. Not built.
- **goodnotes-coverage** (capability 4): objectives written up, drilled, or neither, from Goodnotes PDFs in Drive. Not built.
- **listen-to-the-working** (PK `notes/WALKTHROUGHS.md` line 108): proposed, not built.
