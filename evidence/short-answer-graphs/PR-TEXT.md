<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

**Status: draft, Port (incomplete): short-answer-graphs.** It stays a draft until the coordinator marks it ready. `review/port-queue.md` item 20 is `partial (left: the clean-up of transcript quotes, tidySpeech)`.

Port queue item 20, Tier 2b. It needs your yes before it merges. The port started after 2026-11-02 11:00 CT, after Intro to Pharmacology's Exam 4. Intro to Pharmacology's code was only read, from a read-only copy at `929cd62`.

Needs (`module.json` `needs`): none. Optional partner modules: none.

At the final tested commit `800b229`, every GitHub "Kit checks" job passed (run 41546905947): Chromium · module:short-answer-graphs, Chromium · template, Chromium · template-unset, Chromium · medicinal-chemistry, and the informational WebKit · template job. Safari itself is NOT RUN.

**Changed since the first version of this pull request (review of 2026-11-02 evening):**
- The GitHub job "Chromium · module:short-answer-graphs" (job 125587774002) failed because `features/short-answer-graphs/ci/oncourse.js` was missing. Its log says so: "FAIL: features/short-answer-graphs/ci/oncourse.js is missing, so short-answer-graphs cannot be switched on in a course". The script is added. It writes the module's own course from Intro to Pharmacology's own data.
- The test's course data no longer names the professor: `prof` is "Professor" everywhere, the one change made to the data.
- The test has new checks, 69 in all (it had 40), among them 22 persistence checks with a large saved state.
- One fault in the module was found and fixed: a saved short answer of another shape stopped the page at "Check my answer" (below).
- `module.json` `source` named the queue's lines at the older commit `d0d3d2d`. It now gives the lines at `929cd62`.

See "Review evidence" at the end.

## What this gives a course

A new feature module, `short-answer-graphs` v1, ported from the Intro to Pharmacology drill (`exam1-drill/src/app.js` at `929cd62`: lines 2402-2444, 3704-3778, 3821-3854, 850 and 911; port queue item 20). It adds two pages. Each page appears only when the course has data for it.

- **Short answer.** One prompt at a time, with its lecture and form ("the professor's wording", "the professor's key"). The student writes an answer. "Check my answer" then shows the model answer, the key points to tick (counted: "2 of 4 key points"), the note, the quote and the source. There are Previous, Next, Shuffle and Clear buttons. This page is **self-check**, as it is in Intro to Pharmacology: nothing grades the typed text. The draft, the ticks and "checked" are kept in the progress (`DB.sa`), so they go with the profile and with Export. When a saved progress is read in, the module cleans `DB.sa` first, so an entry of another shape cannot stop the page.
- **Graphs.** One card per figure of the professor's. Each card shows the figure, how many of its questions are unseen, right and wrong (by each question's latest answer), the forms the professor asks, and the reading questions the student skips most. The cards sit in one fold per exam, with the active exam's fold open. "Drill this figure" asks every question on that figure in turn, as a fixed pass of the core's quiz. A wrong pick names the reading question that was skipped (the `miss` tag on the option picked, for example "Emax: Does the maximum change? ..."). Every answer shows "Read this figure the professor's way". The end of the pass gives the number right on that pass and lists what was skipped. "Redo wrong" asks only the questions last answered wrong. On the Exam 2 tissue tracings, the wording is about tracings, not curves.

## What changes

- New folder `features/short-answer-graphs/current/`: `module.json`, `short-answer-graphs.js`, `short-answer-graphs.css`, `step.js` (the build step), `test.js`.
- New `features/short-answer-graphs/ci/oncourse.js`: switches the module on in a scratch course for the kit's checks, with Intro to Pharmacology's own data taken from the test's fixture. Courses never copy it.
- The course data the module reads comes from a data file listed in course.js `files`: `SHORT_ANSWERS` (Intro to Pharmacology's `SHORT4` and `SHORT3`), `GRAPHS` (its `graphs.js`), `GRAPH_MISS` (its `MISS` table) and, if wanted, `GRAPH_EXAMS` (its Exam 2 tracing wording, `MISS2`, and the intro line for each exam). A figure's questions carry `img` set to the figure's key.
- The build step stops the build, and says why, when: an image is not in images.json; one image belongs to two figures; a miss tag is in no table; a figure has no question; a prompt has no key points; a prompt id is used twice; or the course has neither prompts nor figures.
- `FEATURES.md`: a new `short-answer-graphs` entry. The `short-answer-page` and `graphs-drill` entries now point to it. `features/README.md`: one new row in the modules table. `review/port-queue.md`: item 20 is `partial` (left: `tidySpeech`). `CHANGELOG.md`: one entry under 2026-11-02.

## What does not change

- No course site changes. A course gets these pages only after it switches the module on in course.js, and that needs a separate yes.
- `core/` and `template/` are unchanged: `git diff origin/main -- core template` is empty. A course with no features builds the same page as before.

## What is not ported, and why

- Short answers are not graded. The source does not grade them either; it is self-check. Grading them would need a new core question type, and "typed-recall item types" is listed in the port queue as a core change, not a nightly port.
- Intro to Pharmacology's `tidySpeech` clean-up of transcript quotes (`app.js` 405-421): it takes "um", "uh" and "OK?" out of the quote a prompt shows. In the kit the quote is shown as written in the course data. This is what is left of item 20.
- Its page cache (`memoHTML`) and its focus-one-exam mode.
- Its content rules for the figure list (fixed group names, 3-6 reading lines, 2-4 asks, at least 5 questions per figure). These were that course's own rules, so the kit does not stop the build on them.
- Differences from the source: the progress is kept per profile in `DB.sa` (the source kept it per browser). An answer marked "guessed" counts as not right on the cards. The figure's image gets the question's own `imgAlt` as its alt text (the core labels every question image "Reaction scheme"). The professor is named "the professor" where the source used a pronoun.

## The module's own course (Intro to Pharmacology data)

`ci/oncourse.js` writes it from the test's fixture, which holds Intro to Pharmacology's own rows at `929cd62`, verbatim except `prof`:
- 4 of the professor's figures from `graphs.js` (rev-rt-figure, rev-allo-ant, rev-pindolol, pe2-gi-tracing) and their 4 images;
- the 21 questions on them, from `q_FIGS.js`, `q_L06.js` and `q_PE2.js`, with their 3 topics;
- 5 prompts from `sa4.js` and `sa3.js`; `app.js`'s `MISS` (12 tags) and `MISS2` (4 tags);
- the `COURSE.lectures` entries those questions cite (L06, L07, L08, L09, PE2) and the skills they use (figure, drug).

The ids are prefixed `sgc-`. Left out, and why:
- the lectures the prompts name (L14, L21, TBL3): their labels name a professor, so the prompts show the lecture id in their place;
- each exam's intro line on the Graphs page: the source text uses a pronoun for the professor, and the course data is not reworded;
- the questions' `fg` field: the core reads `fg` as a drawn structure.

The first version of the fixture had two figures. With two, core `test.js` section 7 failed on the module's own course, so two more of the professor's figures were added (see "For a core proposal").

## Checks (agent-run, on `800b229`)

| Check | Result |
|---|---|
| `ci/oncourse.js` on a fresh `mkcourse.sh` course | exit 0; a second run exits 1 (it runs once per course); `python3 build.py` exit 0 |
| Module test on the module's own course, 3 runs | PASS 69, PASS 69, PASS 69 (1 skipped each: no Graphs tab without figures, because the course has figures); 7 of the checks are build refusals |
| Module test, the same course with short answers only | PASS 67 (1 skipped: the course's figures); the "no Graphs tab" check ran and passed |
| Module test, module code left out of the page | FAIL 1 of 1, as required |
| `core/ci_course.sh module:short-answer-graphs` (`run_checks.sh` on the module's own course) | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`); `home_test.js` 36 passed |
| No-module template course | cited from `evidence/baseline` `main-6432c36/` (commit `f8a22d5`; core `a2dbf03`, template `cbac5bd`, the same trees as this branch): 24 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT |
| Medicinal-chemistry (full clone) | cited from the same baseline: 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`, `cite_check.py`), 1 REPORT; `home_test.js` 36 passed. GitHub job 125624593378 on `800b229` gave the same counts |
| GitHub "Kit checks" run 41546905947 on `800b229` | success: all 6 jobs (job 125624678941, module:short-answer-graphs: 26 PASS, 1 NOT RUN, 1 REPORT; module test 69 passed) |
| Regex lookbehind in module files | none |
| Browser engine | Chromium locally. WebKit (Safari's engine) ran on GitHub in the informational template job, without this module. Safari: NOT RUN |

## Review evidence

All results are agent-run.

- Final tested commit: **`800b229`** (`800b2296bf9b89b558935fa7ccd757e63fb8f26d`). Starting commit of this review: `6f030f3`. Commits added: `51aafa0`, `800b229`.
- Evidence branch: **`evidence/short-answer-graphs`** (`eeed161`), folder `evidence/short-answer-graphs/`. `INDEX.md` lists every command with its exit code and log, the scripts, the fixture check against the source, and two screenshots.

### Faults found and fixed

1. **Module.** A saved short answer of another shape (a progress file edited by hand, or saved in another shape) stopped the page: "Check my answer" threw "ticks.includes is not a function" and showed nothing. Found by a new check. Fixed: when a saved progress is read in (page load, profile switch, Import), the module cleans `DB.sa` (`X.progress`): an entry that is not an object is dropped, fields of the wrong kind are removed, and ticks keep only key point numbers the prompt has.
2. **Missing file.** `ci/oncourse.js` was missing, so the GitHub module job failed. Added.
3. **Test data.** The fixture named the professor in `prof`. It is now "Professor".
4. **Test.** The tracing checks compared only the reading question's label. For the tag "direction" the label is the same in `MISS` and `MISS2`, so a module that ignored `MISS2` could pass. Both checks now compare the question text too (commit `800b229`).

Nothing found needs a change to the core to make the module work.

### Behaviour map

Source: Intro-Pharmacology- `exam1-drill/src/app.js` at `929cd62`, unless another file is named.

| # | Behaviour in the source | Lines | Port | What the student gets, or does not get |
|---|---|---|---|---|
| 1 | The prompts are Exam 4's, then Exam 3's (`SHORT4`, then `SHORT3`) | 2405 | adapted | the course's `SHORT_ANSWERS`, in the order the course lists them |
| 2 | Drafts, ticks and "checked" kept per browser under `<ns>:sa` | 2406, 2409-2410 | adapted | kept in the progress as `DB.sa`: per profile, in Export and Import, removed by Erase |
| 3 | The prompt's lecture shown by its label (the id when the course has no such lecture) | 2408, 2418 | ported | same |
| 4 | "No prompts loaded." when there are none | 2412 | adapted | no Short answer tab at all without prompts |
| 5 | Subtitle "Her exam has two short-answer questions graded with partial credit. Write your answer first, ..." | 2416 | adapted | the course's own sentence comes from the `saAbout` option; the instruction sentence is kept as written |
| 6 | Form label "her wording" / "her key" / none | 2418 | adapted | "the professor's wording" / "the professor's key" / none |
| 7 | "Prompt i of n" and the count checked | 2417 | ported | same |
| 8 | The draft is saved as it is typed | 2434 | ported | same |
| 9 | Check my answer: shows the model answer and the key points; marks the prompt checked when the draft is not empty; the button reads "Hide the model answer" | 2422, 2435 | ported | same |
| 10 | Ticking key points: counted ("2 of 4 key points") and saved | 2425-2426, 2437-2440 | ported | same |
| 11 | The note, the quote and the source under the model answer | 2427-2429 | ported | same |
| 12 | The quote cleaned of "um", "uh", "OK?" (`tidySpeech`) | 2428, 405-421 | omitted | the quote is shown as written in the course data |
| 13 | Clear empties the draft, the ticks and "checked" | 2436 | ported | same |
| 14 | Previous and Next, disabled at the ends, hide the model answer and scroll to the top | 2431, 2441-2442 | ported | same |
| 15 | Shuffle: a new order, back to prompt 1 | 2443 | ported | same |
| 16 | (kit only) a saved `DB.sa` in another shape (an edited file) | none | added, fixed | cleaned on load and Import; before the fix, Check my answer stopped with a page error |
| 17 | The MISS table: 12 reading questions | 3718-3731 | adapted | the course's `GRAPH_MISS` |
| 18 | Exam 2 tracings: MISS2 wording, "Read this tracing", "Tissue tracings" | 3734-3740, 3762, 3832 | adapted | per exam in `GRAPH_EXAMS` (`miss`, `noun`, `other`); not tied to exam 2 |
| 19 | A figure's questions: those whose `img` is its key or an alt | 3741-3743 | ported | same |
| 20 | The tally of skipped readings: miss tags of wrong options picked, across the answers kept, most often first; matching and fill-in left out | 3745-3752 | adapted | read from the core's `DB.answers` (`result`, `picked`); every typed question type left out |
| 21 | After an answer on a figure: the reading question skipped (wrong pick), and the figure's reading, open after a wrong answer | 3754-3763, 911 | adapted | under the verdict (the source put it after the explanation); worded "the professor's way" |
| 22 | The end of a pass: "<right> of <done> correct.", the tally, Drill this figure again, All figures | 3765-3773, 850 | adapted | the count is this pass's answers in `DB.answers` |
| 23 | Drill this figure: every question on it, shuffled, one pass | 3774-3778 | adapted | a sweep of the core's quiz with `Q.graph` set |
| 24 | "No figures are registered." | 3823 | adapted | no Graphs tab without figures |
| 25 | Subtitle "His own figures. ..." | 3824 | adapted | "The professor's own figures. ..." |
| 26 | Each exam's intro line (`INTRO`) | 3825-3827, 3830 | adapted | `GRAPH_EXAMS[n].intro`, from the course |
| 27 | One fold per exam, the active exam open (`exGroup`) | 618, 3828 | adapted | one fold per exam number that has a figure; a number with no exam is named "Exam <n>" |
| 28 | Folding to one exam in focus mode (`exGroup`, `FOCUS_EXAM`) | 618 | omitted | every exam with figures has its fold |
| 29 | The page cache (`memoHTML`) | 3828 | omitted | the page is drawn each time it opens |
| 30 | Cards grouped by `group` | 3829, 3831-3832 | ported | same |
| 31 | The card: image, title, counts (unseen, right, wrong; by the latest answer), source, "He asks:", "You skip:" (top 3), Drill this figure, Redo wrong when one is wrong | 3833-3845 | adapted | "The professor asks:"; an answer marked guessed counts as not right |
| 32 | Redo wrong: the questions last answered wrong, shuffled | 3851 | ported | same |
| 33 | The card image's alt text is the figure's title; images filled in after drawing (`fillImgs`) | 2097, 3848 | adapted | the image is in the page; on the quiz card the figure gets the question's own `imgAlt` |
| 34 | The tabs Short answer and Graphs in the nav | 176-177 | adapted | placed before the `before` option's tab (default Diagrams); names from `saLabel` and `graphsLabel` |
| 35 | The figure registry check (keys and alts are images, one figure each, miss tags known, fixed groups and counts) | `test.js` 60-84 | adapted | build refusals for images, owners, miss tags, figures with no question and prompts; the group names and counts were that course's own rules and are not checked |
| 36 | Styles | `shell.html` 162, 170-171, 370-371 | ported | same, scoped to the two pages |
| 37 | A "Short answer practice" button on a guide page | 677 | omitted | not part of this module: guides are the course's own pages |

### Mutation checks

`mutations.py` (on the evidence branch) applies each mutation to the copy of the module in a scratch course of the module's own data, as an exact replacement that must match once; it rebuilds, runs the module test and restores the file. Nothing was committed to the port branch. On `800b229`: 25 of 26 caught.

| Mutation | Test exit | Checks that failed (agent-run, on `800b229`) |
|---|---|---|
| M01 a typed draft is not saved | 1 | the draft is kept as it is typed; the other profile keeps only its own draft; a reload 400 ms after typing; and more |
| M02 the progress is changed but never written | 1 | a reload comes back with the draft and the ticks; the other profile keeps only its own draft; a reload 400 ms after typing; and more |
| M03 the ticks are not kept | 1 | ticking key points counts them and keeps them; a reload comes back with the draft and the ticks |
| M04 Check my answer does not count the prompt checked | 1 | Check my answer shows the model answer and the key points, and counts the prompt checked |
| M05 Clear leaves the ticks and checked | 1 | Clear empties the draft and the ticks |
| M06 Shuffle keeps the prompt number | 1 | Shuffle starts again at prompt 1, every prompt kept |
| M07 a key prompt does not say so | 1 | a key prompt says so, an objective prompt carries no form, and Next stops at the last |
| M08 Next is never disabled at the last prompt | 1 | the same check |
| M09 no cleaning of saved short answers on load | 1 | a saved entry that is not an object is dropped ...; ticks keep only key point numbers ...; a saved short answer in a bad shape does not stop the page |
| M10 the exam's own miss wording (tracings) is ignored | 1 | a tracing's feedback uses tracing wording (on the course's own data); a tracing names its skipped question in tracing wording |
| M11 the tracing noun is ignored | 1 | a tracing names its skipped question in tracing wording |
| M12 the tally counts right answers too | 0 | not caught: equivalent. A right answer's picked options are all right options, and the tally counts only wrong options, so the change does nothing |
| M13 the tally is sorted least often first | 1 | the tally counts each wrong pick's miss tag, most often first |
| M14 the reading is open after a right answer too | 1 | a right answer shows the reading folded and names nothing skipped |
| M15 a wrong pick does not name the reading question skipped | 1 | a wrong pick names the reading question skipped; both tracing checks |
| M16 Redo wrong asks every question of the figure | 1 | Redo wrong asks only the question answered wrong; the end of the Redo wrong pass counts that pass only |
| M17 the end of a pass counts every answer ever given on the figure | 1 | the end of the Redo wrong pass counts that pass only (1 of 1); a second pass counts its own answers only (5 of 5) |
| M18 a question counts by its first answer, not its latest | 1 | the card counts each question by its latest answer; the counts are kept through a reload; a question counts by its latest answer |
| M19 an answer marked guessed counts as right | 1 | an answer marked "I guessed" counts as not right on the card |
| M20 every exam fold is open | 1 | a fold per exam, the active exam open ... |
| M21 the exam's group name (Tissue tracings) is not used | 1 | the same check |
| M22 the figure keeps the core's alt text | 1 | the figure carries the question's own description as its alt text |
| M23 build step: an image in two figures is not refused | 1 | an image in two figures stops the build and says so |
| M24 build step: a miss tag in no table is not refused | 1 | a miss tag in no table stops the build and says so |
| M25 build step: a prompt id used twice is not refused | 1 | a prompt id used twice stops the build and says so |
| M26 build step: a prompt with no key points is not refused | 1 | a prompt with no key points stops the build and says so |

Checks added in this review because a mutation was not caught by the first test, or to show a behaviour: M09, M13, M17, M18 and M19 are caught only by new checks. M10 was caught on the first pass and missed on the run of `51aafa0` (the tag picked was "direction"); commit `800b229` closes that gap.

### Persistence results (agent-run, on `800b229`)

Saved state: the course's 10 prompts, each with a draft of 2,000 characters, ticks and "checked", plus 200 saved short answers more (210 in all), and 300 answers on the figures' questions.

| Case | Result |
|---|---|
| Reload | the 210 saved short answers and 300 answers come back; the 8 figure cards show the same counts and skipped readings; the page shows the saved draft and "10 checked" |
| Export, then Import into a fresh profile | the export carries 210 saved short answers and 300 answers; the fresh profile has none; after Import it has the same 210, and the cards show the same counts |
| Profile switch | each profile keeps its own short answers |
| Reload 400 ms after typing | the change is kept |
| Reload under 150 ms after typing | the last change is lost; the text saved before it is kept; all 210 are there. This is the core's 150 ms save delay (reported, not changed) |
| Storage denied (`SecurityError`) | the core's notice "This browser did not save your progress ..." shows; the stored progress is left as it was; the draft stays on screen; once storage works, the next change is saved with every earlier short answer and loads after a reload |
| Storage full (`QuotaExceededError`) | the same |
| A saved entry in a bad shape | before the fix: a page error at Check my answer. After: dropped or cleaned on load; every other entry loads; the page works |

### For a core proposal (seen in the core, not changed here)

1. Core `test.js` section 7 takes the first concept with two or more questions and expects another wording of it, and at least 4 other concepts (`GAP`), in the same topic. In Intro to Pharmacology's real data a concept's wordings are spread over two topics (FG and L06), so a course of real data can fail it. The module's course passes because two more of the professor's real figures were added.
2. Core `state_check_test.js` adds a lecture with the fixed id `L02`; a course that already has a lecture `L02` makes it fail.
3. The core writes the progress 150 ms after the last change and not when the page closes, so a reload in that time loses the last change.
4. The core labels a question by the first lecture whose `deck` its cite names. Intro to Pharmacology's lectures also list `decks`, which the core does not read, and a question that cites only a transcript cannot be labelled.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
