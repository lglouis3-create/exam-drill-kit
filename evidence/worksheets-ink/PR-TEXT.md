<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

**Status: draft, Port (incomplete).** Under rule 5 this stays a draft until the parts below are ported or you decide to leave them out:
- the PDF files and their links;
- the source line under an answer;
- each part's vignette line when a sheet of several sets is practised;
- the "missed on this sheet" marks.

Needs (`module.json` `needs`): none. Optional partner: `chained-problem-sets` (on `main`), tested present and absent.

At the final tested commit `8265f5c`, the module test and `run_checks.sh` on the module's own course have passed (coordinator-verified), and so have the three blocking GitHub "Kit checks" jobs (Chromium on template, template-unset and medicinal-chemistry, run 41518761552, checked by the coordinator). The informational WebKit job failed on the template course; it is not Safari, and it does not block a merge. The combination run with every module on has not been repeated on this commit. Real Safari, an iPad and an Apple Pencil are NOT RUN, because the container has Chromium only, and pen input was simulated.

Port queue item 2, Tier 2 (`review/port-queue.md`). It needs your yes before it merges. Pharmacokinetics' code was only read, from a read-only copy at `ac2eb73`. This is the hardened version: final tested commit `8265f5c`, evidence on branch `evidence/worksheets-ink`.

## What the feature does

The module brings the Pharmacokinetics drill's Worksheets tab and its writing layer into the kit (`src/views.js` 5122-5434 and 6040-6322).

- **A Worksheets tab.** Each document the course's questions come from (daily practice sheets, in-class activities, worked examples on slides, homework, quizzes, reviews) is listed under its module. Homework, quizzes and reviews come after the last module they cover, with each problem tagged by its module. Each card lists the problem numbers the drill holds from that document, links to the original in Google Drive where the course has one, and has two buttons:
  - **Write on it** opens the worksheet over the page. It shows the professor's problems in the sheet's order, with a grid under each one: 480 px for a calculation and 200 px for a short answer. More room adds 240 px under a problem, and Less room takes it back. The student can write on the name line and on every problem with an Apple Pencil, a stylus, a finger or a mouse. The tools are pen, highlighter and eraser, three colours, three sizes, and undo and redo. Pencil only: once a pen touches the page, a finger scrolls and only the pen writes. Hold to snap: a line, circle or box held still at its end becomes a straight line, an ellipse or a box. Two fingers tapped together undo. The other buttons are Show solutions, Save as PDF and Clear page. Show solutions adds, for each problem, the answer, who solved it ("The professor's key" or "Worked by the drill") and the working. Save as PDF opens the browser's print with the writing on the page.
  - **Practice in the drill** asks the document's problems in the sheet's order, as one pass. When the sheet is one whole problem set and `chained-problem-sets` is on, it starts that set (now tested, with that module on and off).
  - Homework that the drill has in two sets of numbers gets a second row, "Changed numbers (extra practice)", with its own worksheet.
- **Scratch paper** sits beside the answer box of a calculation question in the quiz and on an exam paper. It opens the question's stem over one 720 px work area, with no solutions. On an exam paper it shows the paper's clock. A paper's scratch paper is cleared when the next paper's scratch paper is opened.
- **Where the writing is kept.** The writing is kept in the profile's saved progress, as `DB.ink`. Export progress copies it, Import progress brings it back, Erase my history removes it, and each profile keeps its own. Each page stores its strokes per problem, as fractions of the problem's width rounded to 4 decimals, plus any extra room. A page with no writing and no extra room is not kept. Pharmacokinetics kept the writing in localStorage keys of its own (`<ns>:ink:<id>:<variant>`). The module does not use or read those keys. The pen's colour and size and the two switches (Pencil only, Hold to snap) are a choice of the device, so they are kept under `<ns>:ink-prefs`.
- **Saving (changed in this version).** The module writes the progress when the pen lifts, not 150 ms later, so a reload at once keeps the stroke (Pharmacokinetics also wrote each stroke at once). The progress is written whole, and every drill on the site shares one storage quota. When the browser refuses the write because storage is full, the page goes back to its last saved writing in the progress, writes the progress again without the change, and a notice at the foot of the screen says: "This browser's storage is full, so the last change on this page was not saved. The writing saved before and your answers are kept. Save as PDF to keep this page, or use Erase all writing in Settings to make room." The writing stays on screen until the page closes. When storage is denied altogether, the notice says the browser is not saving, and the core's own notice shows too. **Before this version**, writing that made the progress too big stopped every later save, so the answers given after it were lost on reload, nothing on the page said so, and on a phone the "not saving" notice was out of sight in the toolbar.
- **Size.** In the test, a stroke of 13 points drawn with the mouse took 221 bytes of the progress. Three strokes on one page took 626 bytes, in a saved progress of 771 bytes. The writing of the snap test took 3416 bytes. In Chromium, this site's localStorage took 5242634 characters of keys and values (10.00 MiB as UTF-16), so a save fails once the progress passes about 5.24 million characters. A Settings section, "Writing on worksheets", says how many pages and strokes are kept and how many KB they take, and has an "Erase all writing" button that keeps the answers.

## What changes

- New folder `features/worksheets-ink/current/` holds the module code, its styles, a build step, `module.json` and its test. New file `features/worksheets-ink/ci/oncourse.js` builds the module's own course for the kit's checks (below).
- The documents are course data, in a data file listed in `course.js` `files`. They take the shape of Pharmacokinetics' `src/sources.js`: `const SOURCES = [{id, title, type, module, modules?, date?, key?, note?, drive?: {id}, missing?, chains?, items: [{q, label}]}]`. The build step writes which document and number each question comes from. That map is Pharmacokinetics' `SOURCE_OF`; a course may still carry its own `SOURCE_OF`, and the build then checks that it agrees. The build stops, with the reason, when:
  - an item names a question that is not in the bank;
  - a document has a type other than the seven listed;
  - a document names a problem set that `CHAINS` does not have;
  - a question is on two documents;
  - `SOURCE_OF` disagrees with the items;
  - an option holds a regex lookbehind or is not a regular expression;
  - `SOURCES` is missing or empty.

  The test checks the first six.
- Some of Pharmacokinetics' tables were code. In the kit they are module options:
  - `modules`: the module headings and their order;
  - `originalIds` and `changedIds`: the id patterns that tell the professor's own numbers from the drill's re-numbered copies;
  - `drillWorked`, `spokenOnly` and `writtenWorking`: the audit phrases that mark an answer the drill worked.

  The defaults are empty. With the defaults, an answer counts as the professor's key when the document is the professor's own solved sheet, and as worked by the drill otherwise.
- Text the student sees says "the professor", not "her". Course data shown as written (a document's `missing` or `note`) is left as the course wrote it.
- Catalog bookkeeping:
  - `FEATURES.md`: a `worksheets-ink` entry. The `source-registry`, `worksheets-tab` and `ink-layer` entries say that the kit module holds them.
  - `features/README.md`: one row added.
  - `review/port-queue.md`: item 2 set to `partial (left: the PDF files and their links, the source line under an answer, each part's vignette line when a sheet of several sets is practised, the missed-on-this-sheet marks)`.
  - `CHANGELOG.md`: one entry under 2026-11-02.
- The branch merges `origin/main` at `98e7b5b` (the Kit checks workflow); no conflict.
- **Not ported** (the item is large; the write-on worksheet and the writing layer are the main part):
  - The printable PDF files (worksheet, and worksheet with solutions) and their links. Pharmacokinetics built them at build time with `gen/sheets.py` in Chromium. The kit has Save as PDF from the open worksheet instead.
  - The line under an answer, "From: <document>, <number> · Worksheet · Original" (`fromLineHTML`).
  - On a sheet of several problem sets, each part's own vignette line in the drill (Pharmacokinetics' `setupOf`).
  - A matching item whose pairs are quantities gets the short work area (Pharmacokinetics gave it the tall one, from its calc skill kind, which the kit core does not have).
  - The ★ marks of the most likely exam paper (`likely.js`, Tier 3).
  - The "missed on this sheet" marks from Pharmacokinetics' weak-spot view (`src/views.js` 5552).
  - The Worksheets section of the module pages (port queue item 8).
  - The writing that Pharmacokinetics stored under its own keys. It is not converted, because Pharmacokinetics is not moving.

## What does not change

- No course site changes. No course switches this module on, and no course repository was touched.
- `core/` and `template/` are unchanged by this branch (`git diff origin/main -- core template` is empty; core tree `c9fde5b`, template tree `cbac5bd`).
- A course without the module builds the same page as before (index.html, sw.js, version.json and manifest.json the same as from `origin/main`, build stamp masked).

## Review evidence

All results below are **agent-run**. Final tested commit: **`8265f5c`**. Evidence branch: **`evidence/worksheets-ink`** (`evidence/worksheets-ink/INDEX.md` lists every command, its exit code and its log).

### Behaviour map (from the source code at `ac2eb73`)

| # | Behaviour in the source | PK file:line | Mark |
|---|---|---|---|
| 1 | Documents under their module, by type, with a tally | views.js:5390-5431 | ported |
| 2 | Homework, quizzes, reviews after the last module they cover; problems tagged by module | views.js:5160-5162, 5404-5408 | ported |
| 3 | Module order and names from `COURSE.topicsMenu` | views.js:5141-5143 | adapted: option `modules` (the kit core has no `topicsMenu`) |
| 4 | Jump chips; open groups kept for the visit | views.js:5410-5430 | ported |
| 5 | Card: Drive links or the `missing` text; student-work note; problem numbers | views.js:5368-5387 | ported |
| 6 | "Worksheet (PDF)" and "with solutions (PDF)" files | views.js:5163-5165, 5202-5207, 5379-5384 | omitted: no ready PDF file; Save as PDF prints one |
| 7 | ★ after a problem likely on the exam | views.js:5371, 5385 | omitted (Tier 3) |
| 8 | Problem sets in changed or original numbers, by name or id pattern | views.js:5167-5173 | adapted: id patterns are options |
| 9 | Worksheet plan: sets in the professor's order, older copies left off and kept as extra practice, sorted by the sheet's numbering (examples keep the deck's order) | views.js:5176-5199 | ported |
| 10 | Changed-numbers second worksheet and its line | views.js:5196-5197, 5313 | ported |
| 11 | Carried values "(Part a: ...)" left out on paper | views.js:5220-5221 | ported |
| 12 | A set's shared text printed once | views.js:5225-5237 | ported |
| 13 | Part letter at the start of the text dropped | views.js:5240-5243 | ported |
| 14 | Options in a fixed order from the question id | views.js:5246-5252 | ported |
| 15 | Tall work area for numeric, quantity matching in a calc skill, or items with steps | views.js:5253, 213-219 | adapted: quantity matching gets the short area |
| 16 | Who solved it (professor's key / the drill), audit phrases, spoken-only rule | views.js:5255-5265 | adapted: phrases are options; "The professor's key" for "Her key" |
| 17 | Solutions: answer, steps or pairs, why, note | views.js:5281-5298 | ported |
| 18 | "From: <document>, <number>" under an answer | views.js:5342-5349 | omitted: the student is not told under an answer where it comes from |
| 19 | One whole set starts that set | views.js:5354-5358 | ported (with chained-problem-sets on) |
| 20 | Several sets as one pass, each part with its set's vignette line | views.js:5359-5364 | adapted: one pass; the vignette line per part is omitted |
| 21 | Worksheet over the page; a drawing layer per problem and the name line; strokes as fractions of the width | views.js:6040-6116 | ported |
| 22 | 480 / 200 / 720 px; More room +240; Less room | views.js:6117, 6309-6316 | ported |
| 23 | Pen, highlighter under the writing, stroke eraser, 3 colours, 3 sizes | views.js:6125-6148, 6234-6247, 6291-6300 | ported |
| 24 | Undo, redo, Ctrl/Cmd+Z, Clear page and its undo | views.js:6249-6257, 6303-6307, 6319-6322 | ported |
| 25 | Pencil only | views.js:6189-6194 | ported |
| 26 | Hold to snap: line, ellipse, box; highlighter only straightens | views.js:6150-6180 | ported |
| 27 | Two-finger tap undo; moving, cancelled or resting touches do not | views.js:6186-6230 | ported |
| 28 | No selection or long-press menu | views.js:6087-6094 | ported |
| 29 | Show solutions; Save as PDF with the ink as pictures | views.js:6282-6289, 6302 | ported |
| 30 | Pen choices kept per device | views.js:6258 | ported |
| 31 | Writing in localStorage per page, written at once; a notice when the write fails | views.js:6046-6056 | adapted: in the profile's progress, written when the pen lifts; a refused change is undone in the saved progress and said on screen |
| 32 | Continue writing on the card | views.js:6058-6061 | ported |
| 33 | Scratch paper in the quiz and on a paper; stem over 720 px; paper clock; old paper's scratch cleared | views.js:970-981, 6063-6075, 6107-6108 | ported (an untimed paper shows the time taken) |
| 34 | Settings section: size kept, Erase all writing | none | added by the kit |
| 35 | Import leaves out writing in another shape | none | added by the kit |
| 36 | "Missed on this sheet" marks | views.js:5552 | omitted |
| 37 | Writing under PK's own keys | views.js:6046 | omitted: not read (PK is not moving) |

### Mutation checks

Each mutation is an exact replace in a scratch course's copy of the module (`scripts/mutations.py`), never on this branch. Final round, on the course with chained-problem-sets on (module code as at `8265f5c`):

| Mutation | Behaviour broken | Exit | First check that FAILed |
|---|---|---|---|
| plan-order | the sheet's numbering | 1 | a sheet's problems follow its numbering whatever order the items are listed in … |
| plan-changed | "(changed numbers)" names the extra sheet | 1 | the same check (setNumbers) |
| plan-dup | an older copy left off the worksheet | 1 | Homework 2's re-numbered copies, named without "(changed numbers)", are still left off … |
| solved-by | only the professor's solved sheet is the professor's key | 1 | each worksheet's problems … and who solved each part are Basic-Pharmacokinetics' own |
| solved-spoken | working only heard is the drill's | 1 | working only heard in the recording is the drill's … |
| carry | carried values left out | 1 | the text on paper is Basic-Pharmacokinetics' own … |
| shared-lead | shared text printed once | 1 | the same check |
| ws-order | the options' fixed order | 1 | the same check |
| chain-start | a whole set starts that set | 1 | with chained-problem-sets on, a sheet that is one whole problem set starts that set … |
| sheet-sweep | the sheet's order in the drill | 1 | with chained-problem-sets off, the same sheet is asked as one pass in the sheet's order |
| room | More room / Less room | 1 | More room adds 240 px and Less room takes it back |
| eraser | the stroke eraser | 1 | the eraser removes a stroke it touches, and undo brings it back |
| redo | undo and redo | 1 | undo removes the stroke and redo puts it back |
| pencil-only | a finger scrolls once a pen wrote | 1 | a pen writes and switches to Pencil only; then a finger scrolls … |
| snap-box | Hold to snap: a box | 1 | a box held still becomes a box with square corners |
| two-finger | two-finger tap undo | 1 | two fingers tapped together undo the last stroke |
| exam-clear | a new paper's scratch paper starts clean | 1 | a new paper starts with clean scratch paper and the old one is cleared |
| continue | Continue writing on the card | 1 | Done closes it and the card says "Continue writing" |
| print | Save as PDF prints the ink | 1 | Save as PDF prints the worksheet alone, ink as pictures … |
| no-write | written when the pen lifts | 1 | a reload at once after a stroke keeps the stroke |
| no-rollback | storage full: the change refused, the last good progress kept | 1 | with storage denied the page says … (and the storage-full checks) |
| warn-hidden | the not-saved notice shown | 1 | with storage denied the page says the writing is not being saved, on screen |
| warn-fixed | the notice on screen at 390 px | 1 | with storage denied … on screen (390 px) |
| progress-shape | Import leaves out writing in another shape | 1 | Import leaves out writing that is not in the module's shape … |
| erase-all | Erase all writing | 1 | Erase all writing removes the writing and keeps the answers |
| step-dup | build step: a question on two documents | 1 | a question on two documents stops the build and says so |
| step-lookbehind | build step: an option with a lookbehind | 1 | an option holding a lookbehind stops the build and says so |

27 of 27 caught. An earlier round left 5 not caught (plan-order, plan-changed, plan-dup, solved-spoken, exam-clear); checks were added for each and all are caught now.

### Persistence results (Chromium)

| Case | Result |
|---|---|
| Much writing: 61 pages, 1801 strokes, 1355993 characters of writing in a progress of 1356138 | saved whole and all back after a reload: PASS |
| Export of it (a file of 3407786 characters), Import into a fresh profile | the same writing comes back and is saved: PASS |
| Import of pages in another shape | left out, the good page kept: PASS |
| Profile switch | each profile keeps its own writing: PASS |
| Reload at once after a stroke / after 300 ms | the stroke kept both times: PASS. Core, reported: an answer saved and reloaded at once is lost (0 of 1); after 300 ms kept (1 of 1). The core writes 150 ms after the last change; not changed here |
| Storage denied (`setItem` throws), 820 and 390 px | notice on screen; nothing saved before is overwritten; after a reload the earlier answers and writing load and new writing is saved: PASS |
| Storage full at Chromium's own quota, 820 and 390 px | the stroke that does not fit is refused with a notice on screen; the saved progress is byte for byte as before; an answer given after it is still saved; Export still works; after a reload the earlier answers and writing load; after Erase all writing new writing is saved: PASS |
| Import that does not fit (a second profile with the same much writing) | the core's notice shows and the first profile's progress is unchanged: PASS. Core, reported: the import lives for the visit only |

### Check results (all agent-run)

| Check | Result |
|---|---|
| Module test, module switched off (before/after) | 1 of 1 FAIL ("the page carries worksheets-ink, working") |
| Module test ×3 on the module's own course, at `8265f5c` | 157 PASS each (2 skipped: chained-problem-sets on, not in that course; Apple Pencil, iPad and Safari) |
| Module test with chained-problem-sets on | 161 PASS (1 skipped: Apple Pencil, iPad and Safari) |
| `run_checks.sh` on the module's own course, at `8265f5c` | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no PDFs), 1 REPORT (`explain_check.js`, 5 of 26 questions) |
| No-module template course vs origin/main | index.html, sw.js, version.json, manifest.json the same (build stamp masked) |
| No-module template course `run_checks.sh` | cited from `evidence/baseline` `22b4290` `main-98e7b5b/` (same core and template trees): 24 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT |
| Medicinal-chemistry `f1f5ee5`, full clone | cited from the same baseline: 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`, no step-through figures; `cite_check.py`, no PDFs), 1 REPORT. `home_test.js` passed (33 checks, before kit PR #28's fix) |
| GitHub "Kit checks" on `8265f5c` | completed, success |
| `device_lint.js` with the module's files | PASS (3 checks), no lookbehind in the module |
| Apple Pencil, iPad, WebKit (Safari) | NOT RUN: Chromium only in this container |

### The module's own course and its test data

- The test's scratch copies hold 8 Pharmacokinetics documents verbatim (Quiz 1, Homework 2, daily practice 2 and 3 of Module 1, the worked examples of Modules 6a and 8, the in-class activities of Modules 7a and 7b), with 52 questions, 12 problem sets, 7 topics, 13 skills and 5 lectures. The one change: `prof` is the course's own ("Professor"). What the test expects of the plans, who solved each part, the carried values, the shared text and the options' order comes from Pharmacokinetics' own functions, run on that data.
- `ci/oncourse.js` builds the module's own course from 4 of them (the worked examples of Modules 6a and 8, the in-class activities of Modules 7a and 7b): 19 questions, one per line in the template's form, in Pharmacokinetics' own topics after the course's, with their lectures added to `COURSE.lectures` as literals. Changes to the data: `prof` is "Professor", and the questions' 19 `setup` lines (plan-the-problem's equation lines, naming equations the course does not have) are left out; worksheets-ink does not read them, and the test's own copies switch plan-the-problem off.
- Why only those 4 (findings, nothing reworded or added): Homework 2's numeric items have one worked step where the core asks for two, and cite `Homework-2.pdf`, which is no lecture deck; Quiz 1 and the daily practice sheets have questions whose cites name no lecture deck, and the daily practice sheets' dupOf questions name the professor in their text; Quiz 3 and the worked examples of Module 6 carry slide pictures the template has no image for; Quiz 5 and the worked examples of Module 3 carry dupOf pairs, which core `test.js` section 7 takes as its "concept with two questions" and then fails. No real stem in the course trips `style_check.js` ("given as").
- `state_check.js` passes when the course data is committed with the course; committed after CLAUDE.md's commit, it reads the state file as older than the newest lecture.

### For a core proposal (not changed here)

- The core writes the progress 150 ms after the last change and does not write it on `pagehide`: an answer given just before a reload is lost.
- Every drill on the site shares one quota and the progress is written whole: two profiles with much writing, or an Import, can exceed it; the core then keeps the progress for the visit only, with its notice.
- `browser_test.js` (teachImg check) assumes every question with a slide picture has options; a numeric question with `teachImg` stops it with a TypeError.
- Core `test.js` section 7 picks the first concept with two questions, which can be a dupOf pair, and then fails.

### Coordinator-verified re-run (2026-11-02, commit `8265f5c`, core `c9fde5b`, template `cbac5bd`)

Folder `evidence/worksheets-ink/coordinator/worksheets-ink-8265f5c/` on `evidence/worksheets-ink` (`3dccf66`).

| Check | Exit | Result |
|---|---|---|
| `ci/oncourse.js` on a fresh template course, then `build.py` | 0, 0 | built |
| Module test, 3 runs | 0, 0, 0 | 157 PASS each (2 skipped: chained-problem-sets not on; Apple Pencil, iPad, Safari) |
| Module test with `chained-problem-sets` on, 3 runs | 0, 0, 0 | 161 PASS each (1 skipped: Apple Pencil, iPad, Safari) |
| `run_checks.sh` on the module's own course | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no PDFs), 1 REPORT |
| No-module template course and Medicinal-chemistry (full clone `f1f5ee5`) | 0, 0 | cited from `evidence/baseline` `22b4290` `main-98e7b5b/` (same core and template trees): 24 PASS / 1 NOT RUN / 1 REPORT and 23 PASS / 2 NOT RUN / 1 REPORT |

The coordinator's combination check (`evidence/integration`, agent-run, on the earlier commit `d6e77b5`) found faults F5, F5c and D1 in this branch's test data. The agent reports all three fixed at `8265f5c` (described above). The combination run with every module on is still to be repeated on this commit.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
