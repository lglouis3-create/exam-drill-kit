# Core changes found by the port work (proposal, 2026-11-03)

This document asks for no change by itself. It lists the faults and gaps in the kit's core that the
14 port pull requests (#11, #13 to #22, #24 to #26) ran into. Each one needs a change in `core/`, so
under the port rules no port made it. Each proposed change below would be its own pull request,
with a plain summary for Louis, and none starts before Louis says yes to it.

Every code reference is to kit `main` at `6432c36` (core tree `a2dbf03`). An entry marked
**coordinator-checked** was read in that code by the porter's coordinator session on 2026-11-03.
An entry marked **agent-run** was seen only by the agent that hardened that port. Its evidence is
on that port's `evidence/<name>` branch, and the coordinator has not reproduced it.

Some items are already listed under "Core changes found by the assessments (not nightly)" in
`review/port-queue.md`: several exams on one site, true/false item types, and the exam result kept
after a reload. They are not repeated here, but the ports that wait on them are named in section E.

## A. Saved progress

**A1. A change made less than 150 ms before the page closes or reloads is lost.** Coordinator-checked.
- `save()` in `core/shell.html` (lines 817-824) writes the progress 150 ms after the last change.
- When the page is hidden or closed, the core writes only the student's place on the page, to
  session storage (`placeSave`, `core/views.js` lines 2432-2438, called at lines 2470-2471). A
  progress write still waiting on its 150 ms timer is not done.
- Seen in the ports (agent-run): stopwatch (a reload 20 ms after a paper was submitted brought back
  0 of 2 answers); notes, study-controls, paper-picker, terms-variables and short-answer-graphs
  (the last change before a reload under 150 ms was lost; paper-picker and notes report that it was
  lost in every run).
- What the student loses: the last answer, flag, note or paper choice, when the page is closed or
  reloaded straight after it.
- Proposed change: on `pagehide`, and on `visibilitychange` to hidden, write any pending progress
  at once (clear the timer and call `store.set`). Add a check to `storage_test.js` that reloads
  20 ms after an answer and finds it.

**A2. The whole progress is one write into one storage quota shared by every drill on the site.** Agent-run (worksheets-ink).
- In Chromium the agent measured the site's localStorage limit at 5,242,634 characters
  (`evidence/worksheets-ink`). A profile with much handwriting can reach it. Once it is reached,
  every later save fails, answers included.
- worksheets-ink now refuses a stroke that does not fit and keeps the last saved progress. The
  core's own Import of a file that does not fit keeps it for the visit only, with the core's
  notice.
- Proposed change, for discussion: a report in Settings of how much each drill on the site keeps,
  and a check that an Import which does not fit leaves the saved progress unchanged and says so.

**A3. The answer log keeps the last 4,000 answers.** Coordinator-checked: `core/shell.html` line 1199.
- concept-statuses reads its statuses from this log, so a concept answered only before those 4,000
  has no status. Pull request #23 (case 5) covers this.
- Proposed change: none yet. The limit is a choice; it needs a decision once #23 is decided.

## B. Hooks a module needs

**B1. A module cannot keep its own data with a saved exam paper.** Agent-run (stopwatch).
- The core saves and restores a running paper itself. No hook lets a module add to that saved
  paper. Because of this, stopwatch cannot bring back the time per paper question after a reload,
  and study-controls keeps its strict-paper mark under a key of its own beside the paper.
- Proposed change: a hook `X.examState({save, restore})` called when the core saves and restores
  the paper.

**B2. Only questions in `QUESTIONS` can be found, listed or drilled.** Agent-run (terms-variables, module-pages).
- Questions a module makes are recorded with the answers, but Weak spots does not list them, and a
  reload during their drill returns to Topics. The core finds a question only by its id in
  `QUESTIONS`. Examples: terms-variables' term and symbol questions, and Pharmacokinetics' extra
  practice (`EXTRAS`) in module-pages.
- Proposed change: a hook through which a module resolves its own question ids for Weak spots, for
  the reload, and for the quiz runner.

**B3. No place is kept for the Topics tab through a reload.** Agent-run (module-pages). A module
page open under Topics comes back as the list of module cards.
- Proposed change: let a module add its own state to the place the core already writes in
  `placeSave`.

**B4. The confidence buttons change only the last recorded answer.** Agent-run (study-controls).
On the one-page quiz, "Not sure" and "I guessed" can be offered only on the card answered last.
- Proposed change: `markShaky`, `markGuessed` and `markSure` take the answer to change.

**B5. A module cannot run a script in `<head>`.** Coordinator-checked (the build rules); agent-run (the measurement).
- `core/build.py` line 215 (`META_FIELDS`) allows `js` and `css` as a module's page files, and
  lines 595-597 refuse a page with more than one script block. Module JavaScript runs at the end of
  `<body>`, after the page's tabs are already drawn.
- On a page of 1,879,886 bytes with all 18 modules on, a student who picked Dark saw the light
  colours in the first frame that shows the tabs in 3 of 5 reloads (theme agent, `evidence/theme`,
  folder `fix-t1-b742f43/`). With a one-line head script added by hand to a scratch copy, it was
  0 of 5.
- An independent evaluation (a separate agent, 2026-11-03, agent-run in Chromium on `main`
  `4e0fae4`, all-modules page of 1,886,610 bytes) recorded the frames Chrome actually drew:
  - a light frame was drawn in 8 of 12 reloads, and in 12 of 12 with the CPU slowed 4x;
  - with Light stored on a dark device, a dark frame was drawn in 9 of 12;
  - on the small theme-only page (273,848 bytes), with the CPU slowed 4x, a blank light page was
    drawn in 6 of 12.
  - With a head script in a scratch copy, 0 of 12 in each of those cases.
  - A CSS-only alternative (body hidden until `theme.js` runs) still drew the light blank page in 11
    of 12.
  - The tabs are plain markup at `core/shell.html` lines 491-502, ahead of the one script block at
    line 517.
- The same evaluation found a gap in the core's own checks: the "exactly one script block" rule
  counts only a bare `<script>` (`core/build.py` line 595, `core/built_page.js` line 42,
  `core/output_test.js` line 56). A module CSS file that closes the style element and opens
  `<script data-head>` builds and passes with two script tags and no syntax check.
- Proposed change, revised after that evaluation: a declarative field in `module.json`, for example
  `"early": {"attr": "data-theme", "key": "theme", "values": ["light", "dark"]}`, rather than a
  module JS file in `<head>`. The core writes one fixed head script from it, at most one per page.
  That script reads `<NS>:<key>`, falls back to the live key in a preview build (the preview copy is
  made later, in the body script, `core/shell.html` lines 590-602), sets the attribute only to a
  listed value, and is wrapped in try/catch, so no module code runs before the core. The build:
  - JSON-encodes the namespace;
  - inserts before the first `</head>` only (the built page has a second `</head>` inside a
    `views.js` string);
  - counts script blocks with `<script\b` in all three places, allowing one body block plus at most
    one core head block, which also closes the gap above;
  - adds the source to `--list-sources` for `device_lint.js`.
  `theme.js` line 39 stays as a backstop. The WebKit job should switch theme on, because desktop
  WebKit was not measured.

## C. Core checks that refuse real course data

The ports' own courses were built from Pharmacokinetics (`ac2eb73`) and Intro to Pharmacology
(`929cd62`) data, read-only and not reworded, as Louis's rule 4 asks. The checks below refused
some of that data, so the ports left those questions out and said so in their pull requests.

**C1. Core `test.js` section 7 fails on a topic with few concepts.** Coordinator-checked (the gap)
and agent-run (the failures).
- The check takes the first concept with two wordings and expects the second wording within that
  topic after a miss. A missed concept comes back only after 4 other questions (`GAP = 4`,
  `core/shell.html` line 887). In a topic with 4 concepts or fewer it cannot come back, and the
  check fails.
- The check can also pick a `dupOf` pair whose target is not in the bank.
- Seen in module-pages (Pharmacokinetics topic `bolus1`, 4 concepts), stopwatch,
  short-answer-graphs (Intro to Pharmacology spreads a concept's wordings over two topics) and
  worksheets-ink. In module-pages it also made `output_test.js` and `checks_test.js` fail, because
  both run `test.js`.
- Proposed change: the check picks a concept in a topic that has more than `GAP` other concepts,
  and reports NOT RUN with the reason when the course has none.

**C2. Core `test.js` refuses a single-answer question with fewer than 3 options.** Coordinator-checked: `core/test.js` line 84.
- Pharmacokinetics' true/false questions are refused, and so is every question whose `dupOf`
  leads to one. This is the same as the queued "true/false item types" item. notes and
  quiz-prep-cards left such questions out of their courses (agent-run).

**C3. Every citation must name a lecture deck.** Agent-run (quiz-prep-cards, module-pages, worksheets-ink).
- A graded quiz item that cites only Canvas, a transcript or the textbook, and a homework item that
  cites a homework sheet, are refused.
- Proposed change, for discussion: accept a citation to a course document the course lists, and
  keep the deck rule for lecture items.

**C4. `state_check_test.js` adds a lecture with the fixed id `L02`.** Coordinator-checked: `core/state_check_test.js` line 39.
- On a course that already has a lecture `L02`, such as Intro to Pharmacology, one of its checks
  fails (agent-run, glossary-tap and short-answer-graphs).
- Proposed change: the test picks an id the course does not use.

**C5. `state_check.js` compares commit times to the second.** Coordinator-checked: `core/state_check.js` lines 68-74 compare commit times in seconds; the coordinator's own two-commit scratch course failed it once (glossary-tap, `evidence/glossary-tap`, folder `coordinator/glossary-tap-3190f57/earlier-run-harness-fault/`).
- When the course data is committed in a later second than `CLAUDE.md`, the check reads the state
  file as older than the newest lecture. The kit's CI makes a course in one commit, so CI is not
  affected; a scratch course made in two commits is.
- Proposed change: none needed for CI. Note it in the check's comment.

**C6. `render_test.js` crashes when the first subtopic of the first topic has no question.** Agent-run (glossary-tap).
- Proposed change: report the empty subtopic instead of crashing.

**C7. `browser_test.js` assumes every question with a slide picture (`teachImg`) has options.** Agent-run (worksheets-ink, terms-variables).
- A calculation question with `teachImg` stops the check with a TypeError.
- Proposed change: read `q.options` only when it exists.

**C8. `cite_check.py` does not read approximate slide numbers such as "slide ~31".** Agent-run (glossary-tap).
- Every Exam 1 lecture of Intro to Pharmacology cites slides that way, so `tables_test.js` fails
  on a course with only those citations.

**C9. The word "undefined" inside real text reads as a page fault.** Agent-run (paper-picker).
- 3 Pharmacokinetics explanations contain the word, and `browser_test.js` and `nullexam_test.js`
  report it as a page fault.
- Proposed change: look for "undefined" where the page writes a value, not in the course's text.

**C10. `style_check.js` flags real stems.** Agent-run (paper-picker, notes).
- 10 Pharmacokinetics choice stems contain "given as", "described as" or "according to". The main
  kit session has named narrowing the "given as" rule as its own pull request.

**C11. Core `test.js` requires two worked steps on every calculation.** Coordinator-checked: `core/test.js` line 64.
- Pharmacokinetics' own test asks for one, and Homework 2's hw2-2a, hw2-2b and hw2-2d have one, so
  they are refused (module-pages rework, agent-run, `evidence/module-pages` folder
  `rework-3e0a3fe/`).
- Proposed change, for discussion: accept one worked step, or report fewer than two as a warning.

**C12. `browser_test.js` reads "below" in ordinary text as a promise of a figure.** Agent-run (notes rework, `evidence/notes` folder `rework-5353092/`, citing `core/browser_test.js` line 376).
- Seven Pharmacokinetics questions (nl-ic4a to nl-ic4e, nl-p1c-t, nl-p1c-cl) say "well below the
  therapeutic range", and the check "every stem that promises a figure shows one" refuses them.
- Proposed change: match "below" only in phrases that point at a figure ("the graph below", "shown
  below").

**C13. `style_check.js` flags real explanations.** Agent-run (glossary-tap rework, `evidence/glossary-tap` folder `rework-d9c8ec7/repro-all-put-back/`).
- Intro to Pharmacology's L02-007 and L02-057 ("downstream") and L10-042 and L10-051 ("not
  memorized") are refused. C10 and kit PR #31 cover stems only.

**C14. The core cannot draw a question's own stem graph.** Agent-run (glossary-tap rework, same folder).
- 36 Intro to Pharmacology questions carry a `graph` in the stem. `browser_test.js` "every stem that
  promises a figure shows one" fails on L04-016, L04-039 and L04-040, and the others ask about curves
  the page does not draw. The student would see the question without its graph.

**C15. The core reads `fg` as a drawn structure.** Agent-run (glossary-tap and short-answer-graphs reworks, `evidence/short-answer-graphs` folder `rework-0d63860/repro-fg-kept/`).
- In Intro to Pharmacology `fg` names a figure shown after the answer. In the core it names an atlas
  structure, so `browser_test.js` "every drawn structure resolves to a group" fails on the 15 FG
  questions. The ports leave `fg` out, so the student does not get that figure.

## D. Display

**D1. The concept block drops sections written as `{h, list}`.** Coordinator-checked: `teachParts`, `core/views.js` lines 137-139, keeps only parts with a `t` field.
- Pharmacokinetics writes some sections as `{h, list}`, so its questions show an empty concept
  block in the kit (agent-run, quiz-prep-cards).
- Proposed change: draw a `list` part as a list.

**D2. A question is labelled only by a lecture's `deck`.** Agent-run (short-answer-graphs).
- Intro to Pharmacology's lectures list several decks (`decks`), and a question that cites only a
  transcript cannot be labelled.

**D3. The Weak spots table "Which kind of question is failing" is wider than a phone screen.** Agent-run (concept-statuses).
- It measured 454 px at a 390 px screen, the same on `main` without any module, so the page
  scrolls sideways. `render_test.js` does not catch it.

**D4. The core page does not show a calculation's slide picture.** Agent-run (concept-statuses rework,
`evidence/concept-statuses` folder `rework-8e2d634/`, citing `core/views.js` near line 902). The
course's own page shows it after an answer.
- Together with C7, this is why the calculations' `teachImg` stays out of the ports' test data.

## E. Ports waiting on a change here or in the queued list

| Port pull request | What waits | Change |
|---|---|---|
| stopwatch #25 | time per paper question through a reload | B1 |
| study-controls #16 | "Not sure" and "I guessed" on earlier one-page cards | B4 |
| terms-variables #18 | Weak spots listing its answers; a reload returning to the question | B2 |
| module-pages #24 | extra practice rows; the module page through a reload; 2 real questions in its CI course | B2, B3, C1 |
| paper-picker #21 | Topics, Weak spots and the pass following the chosen exam; papers of another length | several exams on one site (queued) |
| glossary-tap #13 | the term list per exam | several exams on one site (queued) |
| quiz-prep-cards #22 | the timed practice quiz; quizzes over several days | several exams on one site (queued) |
| theme #20 | no light flash on a large page for a student who picked Dark | B5 |
| every port | the last change before a reload | A1 |

## Order proposed

A1 first: it loses student data and is a small change. Then C1, C4 and C7, which make the core's
own checks pass on real course data. B1 to B4 come after them. Each is its own pull request, and
each needs Louis's yes.
