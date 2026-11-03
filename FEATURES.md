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
`review/proposed-core.md`): course manifest, storage and profiles, the concept scheduler
(the named concept statuses are not in the core: they are the feature module
`concept-statuses`, below), service worker and install manifest, update notice and place restore,
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
Use when: two professors teach in sequence and a later exam is one professor's only (PH: "Doctor Gottlieb will not have questions on the, the last exam." (T) 10/26, `exam1-drill/src/course.js:108`).
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
Does: colours chosen table fields (Category teal, Indications pink) and shades the field a question asks about.
Use when: a fact table has fields the student finds hardest (BDK: category and indication "are the hardest of the basic info", 2026-10-22).
Do not use when: the colour would mark the answer.
Enable: course.js → features.field-colours = { version: 'v1', fields: [...] }
Versions:
  v1  2026-10-22  from BDK (`bf91dc0`)   best for: drug-list tables   weaker at: not evaluated   current/
Evidence: Louis's request (BDK notes §4).
Used by: BDK (v1)
Known issues: none recorded. Shares its purpose with module-colours; a later upgrade could merge them.
Test: none specific.

## theme
Does: dark colours for the whole page, and the student's own choice of Match device (the default: the phone's or computer's light or dark setting), Light or Dark, in the header and in Settings. The kit core has no dark colours: its `shell.html` sets light colours only, and `browser_test.js` renders every tab with the browser set to dark (no sideways scroll, no "undefined", no page error) on a page that stays light. The choice is a device setting: it is kept in this browser's storage under `<ns>:theme`, the same for every profile, beside `<ns>:profile`, and not in the progress, because the progress is per profile and moves to another device with Export progress while a colour choice belongs to the screen it was made on. Export does not carry it, Import and a profile switch do not change it, and a browser that refuses storage keeps it for the visit.
Use when: the student studies on a phone or computer kept dark, or wants dark colours whatever the device is set to (PK has the choice in its header since before `ac2eb73`).
Do not use when: none recorded; the module reads no course data.
Enable: course.js → features.theme = { version: 'v1' }
Versions:
  v1  2026-11-02  from PK (`ac2eb73` `src/views.js` 6323-6333, the choice; `src/shell.html` 979-1042, the dark colours and the header control; first commit not looked up: the read-only clone has one commit)   best for: any course   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: PK (its own copy, where the choice is named System); the kit module: none yet.
Known issues: PK's dark rules for classes the core does not have (`.misskind`, `.shortfall`, `.rtab`, `.mtab`, `.stsvg`, `.stepfig`, `#zoom`, `.mrow`, its module colours `.m0`-`.m7`) are not ported. The kit adds dark values PK's shell did not need: the atlas colours (`--at-*`, `--wash`), the figure boxes (`.fgshow`, `.cmpcell`, `.wfig`), the `.tag.p3`/`.tag.p4` tags and dark text on the light buttons; each value is one of PK's dark palette. The queue's source range `views.js` 6323-6383 runs into the module-colour code (Tier 3), which is not part of this module. Without the module a page stays light on a dark device, as before. Known limit (fault T1, found by the integration run of 2026-11-03): on a large page a student who picked Dark can see the light colours for a moment when the page opens. theme.js sets `data-theme` when its script runs, at the end of the page's one script block, and the browser paints the tabs before that on a large page. Measured 2026-11-03 in Chromium: on the everything-on scratch course (1,879,886 bytes), 3 of 5 reloads painted the first frame with the tabs light (tabs at 40-62 ms, `data-theme` set at 89-112 ms); on the template course padded to 1,564,690 bytes, 3 of 5; on the 273,848-byte template course, 0 of 3. A module cannot put a script in `<head>` (module.json has `js` and `css`; `build.py` allows one script block), so the fix needs a core change: see `evidence/theme` `fix-t1-*/FINDING.md`.
Test: `features/theme/current/test.js` (44 checks and 1 known limit on the template course, on a scratch copy that adds four Basic-Pharmacokinetics questions (`ac2eb73` `src/q15_module7b.js`, prof set to "Professor") in a topic of their own: the two dark blocks hold the same 18 rules; each of the core's 24 `:root` colours has a dark value; the module loads in the engine run in node; in Chromium, a stored Dark is on the page in the first frame that shows the tabs in 3 reloads of a page under 1.5 MB, and the same measured over 5 reloads of a page of 1.5 MB or more (a light first frame there is reported as the known limit below, not as a failure, while the page has no script in `<head>`); Match device, Light and Dark on light and dark devices, through a reload (0, 100 and 400 ms after a pick), in Settings, across a profile switch; absent from the progress and the Export file (after 30 answers); Import in a fresh browser leaves that browser's choice; storage refused, storage denied and storage full (the core's notice shows, nothing saved is overwritten, all loads once storage works); every tab and five quiz cards, unanswered and answered, at 4.5 : 1 or better in the dark colours, as PK `src/modcolor_test.py` lines 61-68 checks its dark badges; the calculation answer box dark; the page and the Settings radios drawn dark). PK has no test of the choice itself. CI course script: `features/theme/ci/oncourse.js` (switches the module on; writes no data).

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

## quiz-prep-cards
Does: a card at the top of Topics for each quiz the course lists, until the quiz is over (its start plus its minutes) or the student hides it: the quiz's day and time, the days left, what it covers, the professor's words about it and what the professor said to prepare (with the transcript it comes from), and drills over the questions of the topics or modules the quiz covers: concepts, calculations and everything, each adaptive, and a straight pass that asks each once. Hide keeps the card off on that browser; Settings puts it back. The kit core's Topics tab shows only the active exam (its name, length, date and days left); it has nothing on quizzes.
Use when: the professor announces quizzes between exams and says what each covers (PK: Quiz 4 and Quiz 5, `src/course.js` lines 224-276).
Do not use when: the course has no quizzes, or the quizzes are not dated.
Enable: course.js → features['quiz-prep-cards'] = { version: 'v1' }, with `COURSE.quizzes = [{id, name, when: 'YYYY-MM-DDTHH:MM', minutes, topics: [TOPICS ids] and/or modules: [question module values], covers, quote, said: [lines], src}]` in course.js
Versions:
  v1  2026-10-04  from PK (`90b60da`)   best for: dated quizzes between exams   weaker at: not evaluated   current/ (ported 2026-11-02 from PK `ac2eb73` `src/views.js` 466-512)
Evidence: none recorded.
Used by: PK (v1, its own copy); the kit module: none yet.
Known issues: the module does not change the exam the page prepares for, the exam countdown or the Exam sim: several exams on one site, the next exam by date and quizzes that run over several days are a core change (`review/port-queue.md`, "Core changes found by the assessments"), and a quiz here has one start time. Not ported: PK's timed practice quiz ("Sit a practice quiz", `beginQuiz`, which runs a paper with its own title and clock on PK's exam engine; the kit's exam engine draws only the active exam's paper), its question and minute chips, and the "Set-up only: which equation?" row (plan-the-problem's quiz scope). A calculation here is a typed-number question; PK also counts a matching item of quantities as a calculation. The said lines keep only `<sub>`, `<sup>`, `<b>`, `<i>` and `<em>`; `{{frac:a|b}}` is stacked when formulas-in-text is on and written (a)/(b) when it is off. The build step checks each quiz (PK checked none of this). PK keeps the "What she said to prepare" panel open across a redraw of Topics (`PANEL_OPEN.qsaid`); here it closes when Topics is drawn again. The hide flag is kept per browser (`<ns>:quizhide:<id>`, as in PK), so it holds for every profile on that browser and is not in Export progress.
Test: `features/quiz-prep-cards/current/test.js` (PK `src/review_test.py` lines 76-108 ported, without the practice paper, with the page's clock set in the test: 54 checks on the module's own course, which `ci/oncourse.js` builds from PK's own data: its Quiz 5 and Quiz 4, 20 of its questions, 6 topics and 5 lectures, `prof` set to "Professor"). Every question, topic, subtopic and lecture id that `ci/oncourse.js` and the test's scratch copies write carries the prefix `qpc-` with the course's own id inside it, so the module shares a course with other modules' copies of the same questions; a plan-the-problem `setup` or an `asks` key is written only when the course has the equations or the ASKS key it names.

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
Enable: ported as the `strict` option of `study-controls` (below): course.js → features['study-controls'] = { version: 'v1', strict: true }
Versions:
  v1  2026-10-22  from PH (`f2090d7`, store key `ns+':noback'`)   best for: exams without back navigation   weaker at: not evaluated   current/ (ported 2026-11-02 from PH `929cd62` into `features/study-controls/`)
Evidence: none recorded.
Used by: PH (v1, its own copy); the kit module: none yet.
Known issues: none recorded.
Test: none found in PH; the kit module's test covers it (`study-controls` below).

## study-controls
Does: four study controls, each switched on by its own option: flags (a Flag button on every quiz card, the exam question and the exam result; the flagged set kept in the progress; a Topics row with the count, Drill flagged and Clear flags; a paper's flagged numbers as links on its question bar); a one-page layout (One at a time / All on one page: every multiple-choice and select-all question of the quiz, 40 at a time, or every question of the exam paper with the clock and Submit on a bar that stays in view); keyboard shortcuts (A-J or 1-9 pick, Enter checks or continues, after a right answer 1 Knew it, 2 Not sure, 3 I guessed; on the paper the arrow keys); a strict paper (a box on the exam start page: one question at a time, no going back, moving on from a blank question asks first).
Use when: flags, layout and keys: any course. Strict: the professor's exam allows no going back (PH: "no backwards nav", 10/21).
Do not use when: strict, when the real exam allows review.
Enable: course.js → features['study-controls'] = { version: 'v1' } (options `flags`, `layout`, `keys` default true; `strict` default false; `strictNote`, a sentence from the course's files beside the strict box)
Versions:
  v1  2026-11-02  from PH (`929cd62`, `exam1-drill/src/app.js`: isFlagged/toggleFlag/flagBtn/layoutToggle 145-151, the flag and layout handler 576-595, the Topics row 722-723 and 777-778, renderAll 994-1080, renderExamAll 1663-1689, the noBack paper 1616, 1633, 1688-1716, exLeaveOk 1718, the keydown handler 3936-3963)   best for: any course   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: the kit module: none yet. PH has its own copy. BDK's keyboard shortcuts are not part of this module; they are ported in the BDK move.
Known issues: the one-page quiz leaves calculation and matching questions to one at a time (the page says how many), and so does the one-page paper when it has calculation or matching items on it (`exams[].typed`; it says so); Not sure, I guessed and I was sure of that are offered on the card answered last only, because the core changes the confidence of the last recorded answer only. PH's question map (its flagged filter) is not in the kit. The browser's Back button leaves the drill (the core keeps no history entries); a strict paper comes back strict where it was. A strict paper relies on the module's own saved key: with storage blocked it holds for the visit only, as the paper itself does. A reload under 150 ms after a flag or a layout choice loses it (the core saves 150 ms after the last change). No shortcut acts while a dialog is open over the page (worksheets-ink's Scratch paper is one) or while a pointer is held down on a canvas. Other modules read the flags with `FX.api('study-controls')` (`isFlagged`, `flagged`, `set`, `toggle`, `button`, `onChange`); queue item 10 (Pharmacokinetics notes and flags) is to build on it.
Test: `features/study-controls/current/test.js` (PH `exam1-drill/src/browser_test.js` lines 41-48, 124-139, 150-156, 243-246, 286-294, 332-337 ported, with checks of the strict paper, which PH had none of; with the review checks of 2026-11-02: keys where the student is doing something else, the strict paper against a reload, the browser's Back and Forward and the arrow keys, 300 flags through Export, Import, a profile switch, reloads and storage denied or full: 59 checks, and 2 more when paper-picker is on). Its course data, `FIX` in the test: Intro to Pharmacology's Day 1 topic, its lecture and 6 of its questions, verbatim from `929cd62` with `prof` set to "Professor", and the professor's 10/21 answer on going back to a question as the strict note; `features/study-controls/ci/oncourse.js` writes that data into the kit's CI course. The test works with exam ids that are numbers and with papers of 100 minutes or more. Review evidence: branch `evidence/study-controls`.

## short-answer-page
Does: practice of written short-answer items.
Use when: the exam format includes short answer (PH Exam 3: "2 short answer", PH notes §1).
Do not use when: the exam is all multiple choice.
Enable: course.js → features['short-answer-graphs'] (the kit module, below; this entry's name is not a module name)
Versions:
  v1  2026-10-22  from PH (`f2090d7`, `src/sa3.js`)   best for: partial-credit short answers   weaker at: not evaluated   current/ (ported 2026-11-02 from PH `929cd62` into the kit module `short-answer-graphs` v1, below)
Evidence: none recorded.
Used by: PH (v1, its own copy); the kit module: none yet.
Known issues: none recorded.
Test: PH has none for this page; `features/short-answer-graphs/current/test.js` checks it in Chromium.

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
Does: 2 to 5 items side by side with differences in bold; tracks which items the student mixes up and uses those as wrong choices; feedback names "What you picked" and "What you missed".
Use when: the material has look-alike items (BDK drugs).
Do not use when: items share no common fields.
Enable: course.js → features.compare-tab = { version: 'v1' }
Versions:
  v1  2026-10-22  from BDK (`0fab858`; feedback `577d5b6` 2026-10-28)   best for: drug tables   weaker at: not evaluated   current/
Evidence: Louis's request (BDK notes §1).
Used by: BDK (v1)
Known issues: none open.
Test: `tests/ui.js` (BDK).

## pair-up
Does: a Pair up tab: chips dragged or tapped into the box they belong to (one chip per box, or several per box), checked together, each chip shown with where it belongs and why, the wrong ones retried (PH Exam 2 work: receptor → effect, DUMBBELSS, anti-DUMBBELSS, receptor → G protein, drug → receptor).
Use when: lectures produce sets of pairs or groups (receptor to effect, drug to receptor family) beyond the tell-apart tables.
Do not use when: tell-apart tables already cover the pairs, or the pairs are few enough for one `match` question in the bank (the core's matching item type, which is graded and scheduled as a bank question).
Enable: course.js → features['pair-up-drills'] = { version: 'v1' }, with `const PAIR_SETS = [{id, name, cite, bins, pairs: [[chip, box, why], ...]}]` in a data file listed in `files` (module `pair-up-drills`, which also holds table-recall-drill)
Versions:
  v1  2026-10-11  from PH (`f4196e2`, `vPair()`)   best for: lecture courses   weaker at: not evaluated   current/ (ported 2026-11-02 from PH `929cd62` `exam1-drill/src/app.js` into `features/pair-up-drills/`)
Evidence: none recorded.
Used by: PH (v1, its own copy); the kit module: none yet.
Known issues: none recorded. Overlaps compare-tab; a retro should decide whether one replaces the other. In the kit the best score per set is kept in the progress (`DB.pairup`), not in PH's separate `:pair` key; PH's "See the figure" links (to its own diagrams) are not ported; PH's drug set, which PH builds in the page from its drug list with course-specific patterns, is course data in the kit. A reload in the same moment as Check loses that new best score (the core writes the progress 150 ms after the last change).
Test: `features/pair-up-drills/current/test.js` (69 checks on the template course with PH's sets and tables as its course data, written by `features/pair-up-drills/ci/oncourse.js`; they include the saved scores and misses through a reload, Export and Import, a profile switch, storage denied and full, and the module options; PH's own tests do not drive Pair up beyond its saved score).

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
Enable: course.js → features['short-answer-graphs'] (the kit module, below; this entry's name is not a module name)
Versions:
  v1  2026-10-01  from PH (`a12b931`, `vGraphs()`)   best for: curve interpretation   weaker at: not evaluated   current/ (ported 2026-11-02 from PH `929cd62` into the kit module `short-answer-graphs` v1, below)
Evidence: none recorded.
Used by: PH (v1, its own copy); the kit module: none yet.
Known issues: none recorded.
Test: PH `exam1-drill/src/browser_test.js` lines 114-123 and check C8 (line 325), and its `test.js` lines 60-84 (the graph registry); ported in `features/short-answer-graphs/current/test.js`.

## short-answer-graphs
Does: the kit module that holds short-answer-page and graphs-drill, as two pages, each shown only when its data is in the page. Short answer: one prompt at a time with its lecture and form; the student writes an answer, then "Check my answer" shows the model answer, the key points to tick (counted, "2 of 4 key points"), the note, the quote and the source; Previous, Next, Shuffle and Clear. It is self-check, as in PH: nothing grades the typed text. Graphs: one card per figure of the professor's (its image, its questions' counts unseen, right and wrong, the forms the professor asks, the reading questions the student skips most), in a fold per exam; "Drill this figure" asks every question on that figure as a fixed pass of the quiz, a wrong pick names the reading question skipped (the miss tag of the option picked), every answer shows how to read the figure in the professor's order, and the end of the pass gives the right count and what was skipped; "Redo wrong" asks the questions last answered wrong.
Use when: the exam has short-answer items graded on key points, or the professor's figures carry several questions each (PH: dose–response curves and Exam 2 tissue tracings).
Do not use when: neither: the build stops when the course has no short-answer prompt and no figure.
Enable: course.js → features['short-answer-graphs'] = { version: 'v1', saAbout: '<the course's line on its short answers>' } (options also `saLabel`, `graphsLabel`, `before`); in a data file listed in `files`: `SHORT_ANSWERS = [{id, q, model, points, lecture, form, quote, cite, note}]` (form `her`, `key` or `objective`, PH's `SHORT4` and `SHORT3`), `GRAPHS = [{key, alts, title, group, source, read, method, asks, exam}]` (PH's `graphs.js`), `GRAPH_MISS = {tag: [label, question]}` (PH's `MISS`) and, if wanted, `GRAPH_EXAMS = {exam number: {intro, noun, other, miss}}` (PH's Exam 2 tracing wording, `MISS2`); a figure's questions carry `img` set to its key or an alt, and `miss` on wrong options.
Versions:
  v1  2026-11-02  from PH (`929cd62`, `exam1-drill/src/app.js` lines 2402-2444, 3704-3778, 3821-3854, 850 and 911; the queue's lines 2308-2351 and 3518-3580 were taken at `d0d3d2d`)   best for: partial-credit short answers; figure reading   weaker at: not evaluated   current/
Evidence: none recorded.
Used by: none yet (PH keeps its own copy).
Known issues: none recorded. In the kit the draft, the ticks and "checked" are kept in the progress as `DB.sa` (PH keeps them per browser in its own storage key), cleaned when a saved progress is read in, so an entry of another shape cannot stop the page; right, wrong and the skipped tally are read from the core's answers, where an answer marked "guessed" counts as not right; the figure's image gets the question's `imgAlt` as its alt text (the core labels every question image "Reaction scheme"). The professor is named "the professor" ("Read this figure the professor's way", "The professor asks:"). Not ported: PH's `tidySpeech` clean-up of transcript quotes (the quote is shown as written), its page cache (`memoHTML`) and its one-exam focus mode; PH's own content rules for the registry (fixed group names, 3-6 reading lines, 2-4 asks, at least 5 questions a figure) are not build refusals.
Test: `features/short-answer-graphs/current/test.js` (PH `browser_test.js` 114-123 and C8 and `test.js` 60-84 ported, and more): on the module's own course, which `ci/oncourse.js` writes from PH's own data at `929cd62` (4 figures, their 21 questions, 3 topics, 4 images, 5 prompts, `MISS` and `MISS2`, the lectures and skills those questions use; `prof` set to "Professor"), 69 checks pass (1 skipped: no Graphs tab without figures), 7 of them build refusals, 22 of them persistence checks with 210 saved short answers and 300 answers (reload, Export and Import, profiles, a reload under and over 150 ms, storage denied and full, a saved entry in a bad shape); on the same course with short answers only, 67 pass; with the module's code left out, 1 of 1 fails.

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
Does: on the Equations tab, a set-up drill: a calculation stem with no arithmetic, where the student picks the equation line that solves what is asked from four (the right line and three others, first from the same module), then reads why, one sentence a line, the lines used on the way, and what each symbol is, when the line holds and how to reach it from a printed line; "Plan the problem" first asks what is asked and the unit the answer carries, then the dosing model from the stem's words, then the line, whether the equation sheet prints it and which of the stem's givens it uses, and writes the plan out with the estimate to make before computing. The lines picked wrong are tallied per line and the most-missed are listed.
Use when: the exam supplies the equation sheet, so choosing the line is the skill (PK: "You've got to think about which one do I want to apply in this application", `src/reference.js` line 32).
Do not use when: no calculations.
Enable: course.js → features['plan-the-problem'] = { version: 'v1' }, with formulas-in-text and equation-drill switched on before it (its `module.json` `needs` names both; the build stops and names them when they are off); on each numeric question `setup: {eq, pre, why}` and, for the plan, `asks`, `givens: [[symbol, value, role]]` and `check: {t}`; in a data file listed in `files`, `ASKS = {key: [symbol, meaning]}` and `PLAN = {models, topics, also, units, same, routine}` (the shapes in the module's header; without `PLAN.models` only "Set-up only" is offered, without ASKS the plan starts at the model)
Versions:
  v1  2026-10-07  from PK (`fb07443`)   best for: equation-sheet exams   weaker at: not evaluated   current/ (ported 2026-11-02 from PK `ac2eb73` `src/views.js` 4754-5120)
Evidence: the professor's remark quoted above (PK notes §1).
Used by: PK (v1, its own copy); the kit module: none yet.
Known issues: the build refuses a course whose set-up lines name an equation the course does not have, and the message names the question and the equation (intended; the coordinator's integration check met it with another module's course data). Basic-Pharmacokinetics' calculation routine (`PLAN.routine`, step 6) says "she asked for": it is course data, kept as the course wrote it. In the kit the dosing models, the topic-to-model map, the stem words that also accept a route, the unit lures, the lines counted as one relation and "How to go about any calculation" are the course's `PLAN` data (in PK they are code in `src/views.js`); the sentence split of the set-up reason is written without regex lookbehind (PK `src/views.js:4937`); the tally is kept in the progress as `DB.setup` (PK keeps it in its own storage key). Not ported: choosing the line from the whole sheet (it needs the sheet map, `sheet.js`), ten stems to a page (the kit has no Answer layout setting), the quiz and exam scopes, "Work it yourself in the quiz", "Type this line from memory", the origin tag, the button back to the view the drill started from, and the set-up repair chips in Weak spots.
Test: `features/plan-the-problem/current/test.js` (PK `src/test.js` 788-795 and 997-1068 and `src/review_test.py` 255-268 and 396-438 ported, with the checks added in review: 54 checks on the module's own course, the template with 10 PK calculation questions, the equations they name, their topics, lectures and skills, ASKS and the plan tables, written by `features/plan-the-problem/ci/oncourse.js`). Since 2026-11-03 that script gives its lectures their own ids prefixed `plc-` (`plc-L04`; a practice-solutions file of a lecture `plc-L02-p1`), where it took L91 onward and refused a course in which another module's script had taken L91; it still stops when one of its own `plc-` ids is already in the course. The test's two copies without ASKS switch terms-variables off when the course has it on, because terms-variables' build step refuses a course whose ASKS lacks the keys its options name.

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
Known issues: in PK, the set-up reasoning's `whySentences` uses regex lookbehind (`src/views.js:4937`, added in `0f266e5`); it is part of the set-up drill, which is the plan-the-problem module, written there without lookbehind (`device_lint.js`). Not ported: "How she asks it" (it needs plan-the-problem's set-up data), the variables quiz (variables-quiz, Tier 2), the sheet map and its print layouts (`sheet.js`), the exam chip. The normaliser keeps PK's kinetics spellings (half-life, clearance, the ideal-body-weight height term).
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

## module-pages
Does: one card per module above the topic list on Topics, each opening a page of that module: Concepts (the professor's objectives, each with the concept questions of its subtopics and a Start, and All objectives), Calculations (every calculation of the module in one pass, then each kind of problem with Single problems, its progress and a worked example: the stem, the working line by line, the answer and its citation) and Worksheets (the module's documents, with Write on it and Practice in the drill). Concept and calculation questions that no objective or kind of problem takes are listed under "Other" on the page, so nothing in the module is left out.
Use when: the course is taught in modules, each with an objectives slide and several kinds of calculation (PK: its data files declare 38 objectives and 35 kinds of problem across its modules, counted 2026-11-02 at `ac2eb73` by loading them in its build order).
Do not use when: the course has one module, or its topics already are its modules.
Enable: course.js → features['module-pages'] = { version: 'v1', modules: [[2, 'Module 2 - IV Bolus Administration'], ...] }, with `const OBJECTIVES = [{module, n, text, subs: ['topic/sub']}]` and `const CALC_TYPES = [{module, id, name, match: ['topic/sub:skill'], example}]` in a data file listed in `files` (both optional). A question's module is its own `module` field, or else its lecture's `module` in `COURSE.lectures`. With chained-problem-sets on, each kind also offers In parts and the page lists the module's lecture examples asked in parts; with worksheets-ink on, the Worksheets page appears (the documents of `SOURCES` whose `module` or `modules` names the module); with concept-statuses on, each objective row says how many of its concepts are struggling, improving, mastered and so on. The module does not need any of the three.
Versions:
  v1  2026-10-02  from PK (`1003ce4`, "Reorganize each module into Concepts, Calculations and Worksheets")   best for: modular calculation courses   weaker at: not evaluated   current/ (ported 2026-11-02 from PK `ac2eb73` `src/views.js` 722-854)
Evidence: none recorded.
Used by: PK (v1, its own copy); the kit module: none yet.
Known issues: not ported: PK's Extra practice rows (its `EXTRAS`, questions kept out of `QUESTIONS`, which the core's `byId` and quiz runner do not read; a core change); the module page kept through a reload (PK's place restore holds `MODPAGE`; the core keeps no place for Topics); PK's two-row progress meters (`progressHTML` with `seenOf`), replaced by the core's meter and an answered count; PK's objective labels for decks 6a and 7a, which a course now writes as an objective's `label`. In PK the Worksheets section lists its problem sets by `src` kind; in the kit it lists worksheets-ink's documents.
Test: `features/module-pages/current/test.js` (PK `src/review_test.py` 32-38 and 110-170, `src/problemset_test.py` 33-44 and `src/place_test.py` 72-75 ported). Its scratch copies add PK's Module 2 (22 questions, 5 objectives, 4 kinds of problem, one problem set) on a module number and topic ids the course does not use, so the course's own modules never change what it counts. On the module's own course (`ci/oncourse.js`: 8 of those questions, the 2 topics, the 5 objectives, 1 kind of problem and PK's 2 Module 2 lectures) it gave 30 checks (3 skipped: chained-problem-sets, worksheets-ink and concept-statuses not in the course); with those three also in the course, 42 checks. CI course script: `features/module-pages/ci/oncourse.js`.

## calc-stopwatch
Does: a stopwatch on each calculation and time per kind of item on Weak spots.
## stopwatch
Does: a running clock on each calculation, in the quiz and on an exam paper that draws calculations; after the answer it shows the time taken (the time the engine records with the answer), and with a pace set, a time past the professor's pace is red and says "over 2:00" in words. On a paper, the time on each question is added up while it is on screen and kept with each of the paper's answers. (Listed as `calc-stopwatch` before the port; `COURSES.md` still names PK's copy that way.)
Use when: the professor sets a time per calculation (PK: "A few calculations, each meant to take 2 minutes or less", `src/course.js` line 264).
Do not use when: no timed calculations.
Enable: course.js → features.stopwatch = { version: 'v1', paceSeconds: 120 } (`paceSeconds: 0`, the default, shows the clock without a pace; the clock on a paper needs the exam's `typed: true`)
Versions:
  v1  2026-10-07  from PK (`5326a60`)   best for: timed calculation exams   weaker at: not evaluated   current/ (ported 2026-11-02 from PK `ac2eb73` `src/views.js` 1463-1482 and the places that use it)
Evidence: the professor's statement quoted above.
Used by: PK (v1, its own copy); the kit module: none yet.
Known issues: the core already records the time of each quiz answer (`ms`) and lists "Right, but slow" on Weak spots; the module adds the clock, the pace and the time of paper answers, and reads no course data. Not ported: PK's time per kind of calculation on Weak spots (`src/views.js` 2160-2200, grouped by PK's `CALC_TYPES`, which the kit does not have yet), the one-page layout's "Start timer" button (the core has no one-page layout) and "took m:ss" in the list of misses (`src/views.js` 2354). The time on a paper question is kept in the page only: after a reload in the middle of a paper it is counted again from the reload (keeping it needs a core change).
Test: `features/stopwatch/current/test.js` (PK `src/review_test.py` lines 517-541 ported: 29 checks). Its course data is PK's own (`ac2eb73`, in `current/test_fixture.js`): PK's Exam 3 (final), the 5 calculations of the professor's Canvas Quiz 4 and 55 single-answer and select-all questions for Exam 3's pools, with `prof` set to "Professor". `features/stopwatch/ci/oncourse.js` writes that course for the kit's CI, with `paceSeconds: 120`. PK's exams have no `typed` (PK's own engine draws calculations onto every paper), so the module's own course keeps Exam 3 without it; the test checks the clock on a paper calculation on a scratch copy that sets the core option `typed: true`. Since 2026-11-03 the course data's subtopic ids carry the prefix `sw-` too (questions, topics and lectures already did), and a calculation's `setup` line (plan-the-problem equations) and `asks` (an ASKS key) are written only when the course already has those equations and that key; otherwise they are left out and the script says so (the module reads neither).

## variables-quiz
Does: which symbol a worded question asks for, and what each symbol means.
Use when: worded calculation questions name a quantity without its symbol (PK: "sometime i forgot in worded concept what variable its asking for", 2026-10-27).
Do not use when: no symbol-heavy content.
Enable: course.js → features.variables-quiz = { version: 'v1' }
Versions:
  v1  2026-10-27  from PK (`f013ced`)   best for: kinetics symbols   weaker at: not evaluated   current/ (ported 2026-11-02 from PK `ac2eb73` `src/views.js` 1072-1147 into the kit module `terms-variables`, below)
Evidence: Louis's request (PK notes §1).
Used by: PK (v1, its own copy); the kit module: none yet.
Known issues: in PK, `askSentence` uses regex lookbehind (`src/views.js:1087`, added in `f013ced`); the kit module splits sentences without it and gives the same sentence on all 829 of PK's stems (checked 2026-11-02).
Test: `src/var_test.py` (PK); in the kit, `features/terms-variables/current/test.js`.

## terms-variables
Does: a Terms tab. Flashcards over the course's `TERMS`: a situation that shows a term in action with the term's own words blanked, then the term, its one-line meaning, its definition and the professor's point, marked Knew it, Not sure or Did not know (recorded as an answer to the term's meaning question). Quiz me: up to three questions per term (which term a situation describes, what a term means, which term a definition belongs to), with the wrong options from the term's `confuse` terms first, then its group; drilled by the scheduler, by group or all. The variables quiz over the course's `ASKS`: which symbol one of the professor's own calculation stems asks for (the stem's question sentence, left out when it names its own answer), what each symbol means, and which symbol a meaning belongs to, with the wrong options from the same family of symbols first; offered under Quiz me and on the Equations tab when equation-drill is on. These questions are kept off exam papers and out of the bank.
Use when: the course keeps a term list with situations (PK: 94 terms in `src/glossary.js` at `ac2eb73`), or a calculation course whose numeric questions carry `asks` (PK: 201 stem sentences and 50 symbols, 301 variable questions; 282 term questions; counted 2026-11-02 by running PK's own `termQuestions` and `varQuestions` on its bank).
Do not use when: the course has neither a term list nor symbols; a list to read alone is `glossary-tap`.
Enable: course.js → features['terms-variables'] = { version: 'v1', families: {k: 'rate constants', ...}, names: {thalf: ['half-life'], ...}, twins: {Cp: ['Cpn']}, groups: {1: 'Module 1'} }, with `TERMS = [{id, term, group, def, cite, gist, scene, hook, module, confuse}]` (the shape glossary-tap reads) and/or `ASKS = {key: [symbol, meaning]}` (the shape plan-the-problem reads) in a data file listed in `files`, and `asks` on each numeric question
Versions:
  v1  2026-11-02  from PK (`ac2eb73` `src/views.js` 1029-1260: `termQuestions`, `varQuestions`, `varQuizHTML`, `renderTerms`; 4173-4175, the Equations tab button)   best for: a term list with situations; calculation courses with symbol-heavy stems   weaker at: not evaluated   current/
Evidence: Louis's request for the variables quiz (PK notes §1, under variables-quiz above); none recorded for the term questions.
Used by: none yet (PK keeps its own copy until it moves onto the core).
Known issues: the core's Weak spots finds an answered question by id in `QUESTIONS` only, so answers to these questions are recorded (the scheduler's concepts `term:<id>` and `var:<key>`, and the answer history) but not listed in Weak spots; PK lists them under the skill "Terms". A reload during one of these drills comes back to Topics, not to the question, for the same reason. PK's symbol families, usual names and twins (`VAR_FAMILY`, `VAR_NAMES`, `VAR_TWINS`) are the options `families`, `names` and `twins` in the kit; PK's module order (7b after 7a) and its Module chips' names are the option `groups`. Not ported: PK's Glossary mode (the `glossary-tap` module of kit pull request #13 shows the list; this module's tab links to it when it is on), the search box, letter bar and back-to-search button (part of that list), Weak spots marks on the Terms tab, the term figures (`fig`) and quotes on cards.
Test: `features/terms-variables/current/test.js` (PK `src/test.js` 943-972 and `src/var_test.py` ported, with behaviour and saved-answer checks added 2026-11-02): on the module's own course (`features/terms-variables/ci/oncourse.js`: PK's 8 terms, 8 of the 10 calculation questions, their 3 topics, its 5 lectures and 5 skills, all of ASKS and its symbol tables, from PK `ac2eb73`, with `prof` set to the course's professor) 57 checks pass (2 skipped: glossary-tap and equation-drill not on); with equation-drill on, 59. The module makes the same question ids, with the same keyed answers, as PK's own code makes from the test's data; the wrong options are the look-alikes and the same family first; 60 answers survive a reload, Export and Import, a profile switch, storage full and storage denied. A reload less than 150 ms after an answer loses that answer from the progress (core `save()`), but not from the answer history.

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
Used by: PK (v1, its own copy); the kit module `worksheets-ink` v1 reads the same `SOURCES` and writes the question-to-document map in its build step: none yet.
Known issues: a student's name was in four source comments (removed in `4ce505d`).
Test: `src/sources_check.js` (PK).

## worksheets-tab
Does: the course's handouts, quizzes and reviews by module folder, with links to the originals, printable blank PDFs and separate solutions.
Use when: the course hands out worksheets (PK).
Do not use when: no handouts.
Enable: course.js → features.worksheets-tab = { version: 'v2' }
Versions:
  v1  2026-10-21  from PK (`e839844`)   best for: module-organised handouts   weaker at: layout was redone twice (PK notes §2)   archive/v1/
  v2  2026-10-26  from PK (`e6ea184`, `2759b31`, Louis's folder layout of 2026-10-26)   best for: module-organised handouts   weaker at: not evaluated   current/
Evidence: Louis's answers of 2026-10-21 and 2026-10-26 (PK notes §4).
Used by: PK (v2, its own copy); the kit module `worksheets-ink` v1 holds the tab, without the PDF files: none yet.
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
Used by: PK (v2, its own copy); the kit module `worksheets-ink` v1 holds the writing layer and the scratch paper: none yet.
Known issues: checked with synthetic pointer events only (`notes/WRITE_ON_WORKSHEETS.md` line 23).
Test: `src/ink_test.py` (PK).

## worksheets-ink
Does: a Worksheets tab with each document the course's questions come from, under its module (homework, quizzes and reviews after the last module they cover, each problem tagged by its module), with the original's Drive links where the course has them, Write on it and Practice in the drill (the document's problems in the sheet's order, as one pass; a whole problem set starts as that set when chained-problem-sets is on). Write on it opens the worksheet over the page: the professor's problems with a grid to work on (480 px for a calculation, 200 px for a short answer, More room adds 240 px), a drawing layer on the name line and on each problem, pen, highlighter and eraser, three colours and three sizes, undo and redo, Pencil only, Hold to snap, two fingers tapped together undo, Show solutions (the answer, who solved it: the professor's key or the drill, and the working), Save as PDF (the browser's print, with the writing on it) and Clear page. Scratch paper beside a calculation's answer box in the quiz and on an exam paper (the stem over 720 px; a paper's scratch paper is cleared when the next paper's is opened). A Settings section says how much writing is kept and erases it.
Use when: the course hands out worksheets and has calculations worked on paper (PK).
Do not use when: the course lists no source documents for its questions.
Enable: course.js → features['worksheets-ink'] = { version: 'v1' }, with `const SOURCES = [{id, title, type, module, modules?, date?, key?, note?, drive?: {id}, missing?, chains?, items: [{q, label}]}]` in a data file listed in `files` (the shape of PK's `src/sources.js`); options `modules` ([[value, short name, heading], ...] in teaching order), `originalIds` and `changedIds` (which problem sets are in the professor's numbers and which are the drill's re-numbered copies), `drillWorked`, `spokenOnly` and `writtenWorking` (which audits say the drill worked the answer), `tab`, `label`, `before`
Versions:
  v1  2026-11-02  from PK (`ac2eb73`, `src/views.js` 5122-5434 and 6040-6322, the Scratch paper button of `numericInput` 970-981, styles `src/shell.html` 787-808, 813-856, 902-934)   best for: worksheet and calculation courses   weaker at: not tested on a physical iPad or in Safari; no PDF files   current/
Evidence: as worksheets-tab and ink-layer above (PK notes §2 and §4).
Used by: none yet.
Known issues: the writing is kept in the profile's progress (`DB.ink`, one entry per page: the strokes of each problem as fractions of its width, 4 decimals, and the extra room), so Export progress copies it, Import progress brings it back, Erase my history removes it and each profile has its own; PK kept it in localStorage keys of its own (`<ns>:ink:<id>:<variant>`), which the module does not read. A stroke of 13 points drawn with the mouse took 221 bytes in the test; the progress is written whole at every save, and every drill on one site shares one storage quota (in the test, Chromium's localStorage for a file page took 5242634 characters of keys and values, 10.00 MiB as UTF-16). The module writes the progress when the pen lifts, not 150 ms later, so a reload at once keeps the stroke. When the browser refuses that write (storage full), the page goes back to its last saved writing in the progress, the progress is written again without the change, and a notice at the foot of the screen says the change was not saved; the answers and the writing saved before are kept. When storage is denied altogether, the notice says the browser is not saving, and the core's own notice shows. Two profiles each holding much writing share the one quota: an Import that does not fit is kept for the visit only, with the core's notice (a core matter). The pen's colour, size, Pencil only and Hold to snap are this device's choice, under `<ns>:ink-prefs`. PK's tables that were code are options (the module headings, the id patterns of the original and changed numbers, the audit phrases that mark the drill's working). Not ported: the printable PDF files and their links (PK built them with `gen/sheets.py`), the "From: <document>, <number> · Worksheet · Original" line under an answer, the ★ marks of the most likely paper (Tier 3), the "missed on this sheet" marks of PK's weak-spot view, the Worksheets section of the module pages (port queue item 8); when a sheet of several problem sets is practised, each part's vignette line (PK's `setupOf`); a matching item whose pairs are quantities gets the short work area (PK gave it the tall one, from its calc skill kind).
Test: `features/worksheets-ink/current/test.js` (PK `src/ink_test.py` ported to Node Playwright, its scratch copies holding 8 PK documents verbatim (52 questions, 12 problem sets, 7 topics, 13 skills, 5 lectures; the professor set to the course's own): 157 checks pass on the module's own course, 161 with chained-problem-sets on as well; they include Practice in the drill with chained-problem-sets off and on, much writing (61 pages, 1801 strokes) through Export, Import into a fresh profile, a profile switch and reloads, storage denied, and storage full at Chromium's own quota, and 27 of 27 deliberate breaks of the module are caught (evidence branch `evidence/worksheets-ink`); pen and touch input are synthetic PointerEvents and mouse strokes in Chromium; Apple Pencil, iPad and Safari NOT RUN). `features/worksheets-ink/ci/oncourse.js` builds the module's own course for the kit's CI: the template with 4 of those PK documents (the worked examples of Module 6, the in-class activities of Modules 7a and 7b, the worked examples of Module 8: 19 questions), the ones whose questions meet the core's checks; `run_checks.sh` on it: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no PDFs), 1 REPORT (`explain_check.js`).

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

## paper-picker
Does: on the Exam view and in Settings, one chip per exam a paper can be drawn for; a paper started while an earlier exam is chosen is drawn from that exam's pools (each pool's share by marks, the exam's select-all count, the engine's own draw rules); the choice is kept with the progress and moves on to the current exam once the chosen exam is over, unless it was chosen after that exam (to review it); "Your papers so far" lists each paper submitted (exam, day, score, blank items), newest first.
Use when: the course has more than one exam in `course.js` `exams` and a student will sit an earlier exam's paper again, for example before a cumulative final (PK).
Do not use when: the course has one exam; or the exam to practise has another question count, time limit or `typed` setting than the current exam (it is left off the chips, with the reason on the Exam view; a paper of another length or clock needs "several exams on one site" in the core, `review/port-queue.md`).
Enable: course.js → features['paper-picker'] = { version: 'v1' }
Versions:
  v1  2026-09-22  from PK (`fa9c49d`; the paper list `8ce8de2` 2026-09-28; the rule for a choice made before its exam `71ce449` 2026-10-26)   best for: courses with several exams on one blueprint shape   weaker at: not evaluated   current/ (ported 2026-11-02 from PK `ac2eb73` `src/shell.html` 1108-1128 and 1174-1186, `src/views.js` 3108-3136 and 3146-3168)
Evidence: none recorded.
Used by: PK (v1, its own copy); the kit module: none yet.
Known issues: in the kit only the paper follows the choice; Topics, Weak spots and the exam-weighted pass follow the current exam (`activeExam`), where PK's followed the choice. The paper list holds only papers submitted on a page with the module on, kept in the progress as `DB.paperPicker.papers` (the 100 newest; the 12 newest shown); the core keeps no record of earlier papers, and the result page is still lost on a reload, as in the core. An exam whose pools the bank cannot fill gets no paper of its own (the page says how many of its questions the pools can supply, and the paper is drawn for the current exam), where PK drew a shorter paper. Not ported: PK's quiz-scope papers and the "practice" label in its list (they belong to quiz-prep-cards), the Progress view's list of practice papers, and the line saying when the bank holds fewer select-all items than the exam asks.
Test: `features/paper-picker/current/test.js` (PK has no test of its own for the paper choice or the list, so the checks are written from its code), on PK's own data in `test_fixture.js` (its three exams, lectures, and the questions, topics, skills and images that file names, from `ac2eb73`; the professor set to the course's own); `ci/oncourse.js` writes that data into the kit's CI course. 74 checks on that course, 57 on the template course with its one exam (2026-11-02). Since 2026-11-03 the CI data's question, topic, subtopic and lecture ids carry the prefix `pp-` (other modules write some of the same PK questions), and the Chromium part runs on a course that holds the questions with other exams or other modules' data: its scratch copy is set to the fixture's three exams, Exam 1's pools take only the fixture's topics, and the fixture's lectures are moved first where another lecture names one of their decks with another module. 74 checks on the CI course; 58 on a 1-exam course (study-controls is not on this branch, so paper-picker alone, then the exams cut to the active one) and 58 on the everything-on course of `evidence/integration-3` with this branch's module (2026-11-03).

## exam-notes
Does: notes on any question with an export for an AI to review, flags on exam papers, and a Notes tab to read, edit, drill, delete or export.
## notes
Does: a "✎ Note" button on every question card (the quiz, the exam paper and its results) that opens a box for what the student is thinking or wants to ask, saved as it is typed; a Notes tab that lists every noted question, newest first, with the last answer given, the key and the working, to edit, delete or drill, filtered by topic; "Copy for AI" and "Download (.md)" give every note as one Markdown text with the question, the answer, the key and the working, ready to paste into an AI or bring to the professor's review. A question on a paper still running has its key left out until the paper is submitted. Weak spots says how many notes there are. (Listed before 2026-11-02 as `exam-notes`; COURSES.md keeps that name for PK's own copy.)
Use when: Louis wants to record his own questions while practising (PK).
Do not use when: no need to annotate.
Enable: course.js → features.notes = { version: 'v1' } (options: `request`, the request at the top of the text; `file`, the download's file name). Reads no course data.
Versions:
  v1  2026-10-27  from PK (`c1c847e`; Notes tab `87559c1`)   best for: practice papers   weaker at: not evaluated   current/ (ported 2026-11-02 from PK `ac2eb73` `src/views.js` 5564-5654 and the Note button and handlers, 1494, 1587, 1791, 2062-2063, 3309, 3425, 6361-6375)
Evidence: Louis's messages of 2026-10-27 (PK notes §4).
Used by: PK (v1, its own copy); the kit module: none yet.
Known issues: none recorded. In the kit the notes are kept in the profile's progress as `DB.notes` {question id: {t, at}}, the shape PK keeps, so Export, Import, Erase and the profile switch cover them and PK's saved notes read in unchanged; a saved note in another shape is dropped on load. The course's name, exam and professor come from course.js, and the text says "the professor"; the Notes tab filters by topic (PK by module). Not ported: PK's flags on a paper (`EX.flags`, ⚑ in the Go to list, the count on Submit, the list on the results): the kit's flags are study-controls' (`DB.flags`), and when study-controls is on, a flagged question's card on the Notes tab says "⚑ flagged"; PK's origin and ★ likely tags on the cards (the kit has no such tags); the module colour on the topic chips. A reload within 150 ms of the last keystroke loses that keystroke's change (the core writes the progress 150 ms after the last change).
Test: `features/notes/current/test.js` (PK `src/notes_test.py` ported, with persistence checks: 88 checks with the module alone, 106 with study-controls on), on Basic-Pharmacokinetics' course data (`ac2eb73`: topics pkpd and nonlin, lectures L11 and L12, skills pkpd and nonlin and 16 of their questions, with `prof` set to "Professor"), which `features/notes/ci/oncourse.js` writes into the module's own CI course. Every question, topic, subtopic and lecture id that `ci/oncourse.js` and the test's scratch copies write carries the prefix `nts-` with the course's own id inside it, so the module shares a course with other modules' copies of the same questions; a plan-the-problem `setup` or an `asks` key is written only when the course has the equations or the ASKS key it names.

## concept-statuses
Does: a Concepts section on Weak spots: each concept answered gets a status read from its answers (Unfamiliar, Struggling, Improving, Mastered, Returning, Learning) with the counts behind it, the wrong option chosen most often and why it is not the answer, the most common kind of miss on missed calculations, and Practice this concept; mastered concepts are folded away, and the ones whose spaced check is due are listed with Check and Run the checks.
Use when: concepts are asked in several wordings and the student wants to see which ideas are weak, not only which questions (PK, Intro to Pharmacology).
Do not use when: each concept has one question (the statuses then repeat the per-question list on Weak spots).
Enable: course.js → features['concept-statuses'] = { version: 'v1' }, with `words: {vd: 'VD'}` to write words of the concept ids on the cards; no data file. With formulas-in-text on, the option text and its why on a card are set by that module's `rich()`; without it, a `{{frac:a|b}}` ratio is shown as (a)/(b).
Versions:
  v1  2026-10-17  from PK (`593c704`, which added Intro to Pharmacology's concept statuses to PK's scheduler; `review/proposed-core.md` §3)   best for: banks with several wordings per concept   weaker at: not evaluated   current/ (ported 2026-11-02 from PK `ac2eb73` `src/views.js` 2506-2725)
Evidence: none recorded.
Used by: PK (v1, its own copy); Intro to Pharmacology has its own form (`exam1-drill/src/app.js` `conceptRecord`, line 1174 at `929cd62`, with "Returned" and "On track" as two of its words); the kit module: none yet.
Known issues: what the core already shows about a concept, without the module: "N of M concepts mastered" on Weak spots and per topic on Topics (box 3 or higher), per exam pool "not yet seen", "missed or guessed, still open" and "mastered", and on each missed question "now mastered" or "still in review". The module's Mastered (3 correct on 2 questions in 2 sessions) is read from the answers and can differ from that count; the section says so. A correct answer marked "Not sure" counts as a miss, as in the core's own "solid"; PK records "Not sure" on a flashcard as a guess (`src/views.js` line 2513). The spaced check's due line uses the concept's review steps in the core (`DB.concepts`), which the core keeps under every scheduler setting; under an FSRS setting the questions the scheduler asks next come from its own cards, not from this list. Not ported: PK's names for term and extra-practice concepts (`term:` and `x-` ids; the kit has no Terms tab or extra practice yet) and its fixed table of words for concept ids (now the `words` option). The core keeps the last 4000 answers (`record()`, `DB.answers.splice`), so the statuses are read from those 4000 and a concept answered only earlier is no longer listed. Kit pull request #23 (`review/concept-signals-proposal.md`) recommends how the student tells this status apart from the scheduler's mastery count and the FSRS due state; until Louis decides, the module says the counts can differ only inside the fold "What each status means".
Test: `features/concept-statuses/current/test.js` (PK `src/test.js` section 4c and `src/sweep_test.py` `concept_check` ported, on 7 PK questions of the topic "infusion" with that topic, its lecture and the skill `infusion`, taken verbatim from PK `ac2eb73`, `prof` set to "Professor"; with persistence checks on a history of 4100 answers: 89 checks). `ci/oncourse.js` writes that course for the kit's CI. Every question, topic, subtopic and lecture id that `ci/oncourse.js` and the test's scratch copies write carries the prefix `cst-` with the course's own id inside it, so the module shares a course with other modules' copies of the same questions; a plan-the-problem `setup` or an `asks` key is written only when the course has the equations or the ASKS key it names.

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
Does: defines technical terms: MC glosses a term once per question at first use (`GLOSS`); PH builds a Terms bank and page from `glossary.js`; PK builds a Terms tab from `src/glossary.js` `TERMS` (94 terms in 8 groups at `ac2eb73`, counted 2026-11-02) with three modes, Glossary, Flashcards and Quiz me (three questions per term, kept out of the exam bank), and its variables quiz under Quiz me (`src/views.js` 1029-1260); BDK defines a term on tap (198 entries) with a MedlinePlus search link.
Use when: questions use terms the course defines.
Do not use when: terms are already defined in each question.
Enable: course.js → features.glossary = { version: 'v3', mode: 'inline' | 'terms-page' | 'tap' }
Versions:
  v1  2026-09-20  from MC (`7aa5816`, `GLOSS`, 33 terms per MC corrected notes §1)   best for: inline glossing   weaker at: not evaluated   archive/v1/
  v2  2026-09-28  from PH (`0327661`, `vTerms()`, `gen_terms.py`)   best for: a term bank with questions   weaker at: not evaluated   archive/v2/
  v3  2026-10-22  from BDK (`bf91dc0`, `data/glossary.json`)   best for: drug-list terms   weaker at: not evaluated   current/
Evidence: Louis asked for tap-to-define (BDK notes §4).
Used by: MC (v1), PH (v2), BDK (v3), PK (its own Terms tab; no version line, since the commit that first has it was not looked up: the read-only clone of PK is one commit deep). PK's Flashcards and Quiz me are the kit module `terms-variables` (below, under Calculation courses); its Glossary mode is the list that the module `glossary-tap` (kit pull request #13, not merged when this was written) shows from the same `TERMS` shape.
Known issues: BDK's MedlinePlus link points outside the course material; decision 3 bars outside content from questions, explanations and tables, and a link is not covered by its wording. **Decision for Louis.** BDK's `loadGlossary` builds a lookbehind pattern (`assets/app.js:655`); where that is rejected, tap-to-define would be missing.
Test: `explain_check.js` `WEIGHTY` table (MC, PK).

## glossary-tap
Does: a Glossary tab over the course's `TERMS`: every term with its one-line meaning, definition, a situation that shows it in action, the professor's example, its figure and its source; a search box (names that match first, then terms that only mention the word), a letter bar that jumps to a letter in A-Z order, by-group or A-Z order, group chips, and a floating button back to the search bar. After an answer is shown, the first mention of each term in the question's explanations and concept block, and in each section of the Guides, Tell apart and Reference tabs, can be tapped to open its definition under the line, with a button to the term in the Glossary tab.
Use when: the course keeps a term list with definitions and sources (PH: 295 terms in 22 groups in `exam1-drill/src/glossary.js` at `929cd62`, counted 2026-11-02; PK's `src/glossary.js` `TERMS` has the same shape).
Do not use when: the course has no term list; the core's bracketed glosses (`glossary.js` `GLOSS`, the `glossary` entry above, v1) already cover the few terms it needs.
Enable: course.js → features['glossary-tap'] = { version: 'v1', label: 'Glossary', tap: true, notTapped: [] }, with the terms in a data file listed in `files` (`const TERMS = [{id, term, group, def, cite, gist, scene, hook, lecture, fig}]`, the shape in PH `exam1-drill/src/glossary.js`; `fig` is a key of `diagrams.js` `DIA`)
Versions:
  v1  2026-11-02  from PH (`929cd62` `exam1-drill/src/app.js` 1771-1922: `termHTML`, `glossWire`, the glossary branch of `vTerms`; the port queue's lines 1769-1922 were taken at `d0d3d2d`); the tap part written for the kit (PH has no tap code; BDK's tap, `glossary` v3, is ported with the BDK move)   best for: a course term list   weaker at: not evaluated   current/
Evidence: Louis asked for tap-to-define (BDK notes §4, recorded in the `glossary` entry above).
Used by: none yet (PH keeps its own Terms tab; it is not moving onto the core).
Known issues: what the core already had: `glossary.js` `GLOSS` and `views.js` `glossify`, a definition in brackets after the first use of a term in a question's explanations; the module leaves a term the core has glossed in a question alone in that question, and a term a reading section defines in its word list (`<dt>`) alone in that section. Not ported: PH's per-exam scope of the list ("this exam only" or "all exams", its Exam 4 borrowing of Exam 3's terms), which needs the several-exams core change in the port queue; PH's Flashcards and "Quiz me" modes of the Terms tab (flashcards is item 16, the term questions are item 3's Terms work, and PH's `gen_terms.py` question generator is a build-time script); PH's own figures (`graphs.js`; a term's `fig` names a kit `DIA` figure instead). A term is found by its name without a closing bracket ("Pharmacodynamics (PD)" is found as "Pharmacodynamics"), as a whole word, with a plural s or es; an abbreviation in the bracket is not found. With `formulas-in-text` on (checked 2026-11-02 in both course.js orders): the first version left a question's formulas unset ({{frac:}} shown as typed, no subscripts) in every explanation that held a term button whenever `glossary-tap` came first in course.js, because `formulas-in-text` leaves alone an element that holds a button; fixed in v1 before it merged: the module runs `formulas-in-text`'s pass over the card before it adds its buttons. A term inside a quotation (`<blockquote>`, `<q>`, the source line's quote, or words in quotation marks) is not marked, unless the quotation is the term's name alone (PH L10-030 names the cheese effect only as “cheese effect”); a quotation broken into several pieces of text by markup (bold, a subscript) is checked piece by piece, so a term inside it can still be marked. The module saves nothing: the Glossary tab's search, order and group are kept until the page is reloaded, as in PH. WebKit (Safari): not run (Chromium only in the container).
Test: `features/glossary-tap/current/test.js` (PH `exam1-drill/src/browser_test.js` lines 53-56 ported: the glossary shows its terms and figures; the rest written for the kit: 56 checks, including the exam review, links, quotations and storage blocked or full, on scratch copies with 10 PH terms, 4 PH questions and PH guide excerpts; 37 more when `formulas-in-text` is in the course, with 7 PK terms and PK question ws6-i3-2c built in both module orders). The module's own course, written by `features/glossary-tap/ci/oncourse.js`: PH's lectures L04 and L10, their topics and 66 of their questions, the 10 terms and the guide excerpt (prof set to the template's "Professor"), on which `run_checks.sh` passes with only `cite_check.py` NOT RUN; the build step stops the build on a duplicate id or name, a term with no definition, group or source, a figure not in `DIA`, a lecture not in `COURSE.lectures`, and a `notTapped` id that is not a term.

## table-recall-drill
Does: recall a course table row by row: each row asked column from column (PH drug ↔ receptor: name the receptor and action, or the drug; PH poisoning table: the antidote, its mechanism, the poison, the professor's special questions), one tap among answers drawn from the other rows, misses back at the end of the round and first in the next one; and Cover and reveal over the whole table.
Use when: the professor tests a table as a table.
Do not use when: no tables to memorise.
Enable: course.js → features['pair-up-drills'] = { version: 'v1' }, with `const RECALL_TABLES = [{id, tab, title, intro, cite, name, columns, covers, modes, rows}]` in a data file listed in `files` (shapes in `features/pair-up-drills/current/pair-up-drills.js`); one tab per table
Versions:
  v1  2026-10-12  from PH (`5a563f4`, `vRxq()`)   best for: drug-receptor tables   weaker at: not evaluated   current/ (ported 2026-11-02 from PH `929cd62` into `features/pair-up-drills/`, with v1-b)
  v1-b  2026-10-20  from PH (`96e33bf`, `src/poison_table.js`)   best for: the professor's posted table key   weaker at: not evaluated   current/ (same module)
Evidence: none recorded.
Used by: PH (its own copy); the kit module: none yet.
Known issues: content-bound in PH (`share/FEATURES.md` notes a kinetics course would replace it with an equation drill of the same shape); in the kit the module holds no course content: a course gives its rows, and PH's per-row derivations (the receptor line, its flipped twin, the receptor-plus-action key) are written into the rows by `features/pair-up-drills/port_from_ip.js`. Scores and misses are kept in the progress (`DB.pairup`). A tap on an answer or on Skip within 350 ms of a card being drawn is not taken, in every table (PH had this on its poisoning table only). Not ported: PH's antidote diagrams beside the poisoning table, its links to the reference page; PH's variant drill (`pgx_table.js`, Exam 4) has the same shape and can be given as a table.
Test: `features/pair-up-drills/current/test.js` (PH `exam1-drill/src/browser_test.js` section 12 ported, and the module's items compared with PH's own `ptItems` on its 12-row poisoning table).

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
