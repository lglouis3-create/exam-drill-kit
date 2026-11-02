# Evidence: short-answer-graphs (port queue item 20), hardening review of 2026-11-02 evening

Every result here is **agent-run**. The coordinator adds its own re-runs, labelled
coordinator-verified, in `evidence/short-answer-graphs/coordinator/`.

## Inputs

| What | Value |
|---|---|
| Source read (read-only clone `/tmp/ip-readonly`) | Intro-Pharmacology- `929cd62` (`exam1-drill/src/`) |
| Port branch, starting commit | `port/short-answer-graphs` `6f030f3` |
| Port branch, commits added | `51aafa0` (ci script, data, test checks, fix), `800b229` (test: tracing checks) |
| **Final tested commit** | **`800b2296bf9b89b558935fa7ccd757e63fb8f26d`** |
| origin/main | `6432c36709ad3dc3ab78d8558239971b18234aec` |
| core tree (branch and main) | `a2dbf03d6ccea270f77ac440f3fd8b7a86d855cf` |
| template tree (branch and main) | `cbac5bd425d480944293f8e1fb5d5d703e8baba1` |
| `git diff origin/main -- core template` | empty |
| node, python | v22, Python 3 (the container's); Chromium only |

## Why the GitHub job failed (the job named in the task)

`gh-job-125587774002.log` (job "Chromium · module:short-answer-graphs", on `6f030f3`), line 432:
`FAIL: features/short-answer-graphs/ci/oncourse.js is missing, so short-answer-graphs cannot be switched on in a course`.
The script was missing. It is added in `51aafa0`.

## The module's own course: data

- `verify_fixture.js` compares the test's fixture `IP` with the source, field by field. It never
  prints the professor's name.
  - `verify_fixture_before.log` (fixture at `6f030f3`): every part equal to the source; `prof`
    held the course's professor (now replaced).
  - `verify_fixture_after.log` (fixture at the final commit): exit 0. Every figure, question,
    topic, prompt, image, MISS and MISS2 entry, lecture and skill is the same as the source,
    except `prof`, which is "Professor" (the one change made to the data).
- `build_fixture.js` (log `build_fixture.log`, exit 0) wrote the fixture from the source: 4 figures
  (rev-rt-figure, rev-allo-ant, rev-pindolol, pe2-gi-tracing), their 21 questions, 4 images,
  lectures L06, L07, L08, L09, PE2, skills figure and drug (and recall, tell, apply, which the
  template already has).
- Left out, and why:
  - lectures L14, L21 and TBL3, which the five prompts name: their labels name a professor. The
    prompts show the lecture id in their place.
  - each exam's intro line on the Graphs page (`app.js` 3825-3827): it uses a pronoun for the
    professor, and it is not reworded in the course data. (The test's own scratch copy keeps
    the intro lines it had, with "the professor's" for "his", as before.)
  - the questions' `fg` field: the core reads `fg` as a drawn structure.
- Why two more figures than before: core `test.js` section 7 failed on the course with only the
  two figures (logs `ci_course-module-1.log` to `-4.log`; see "For a core proposal").

## Commands, exit codes and logs

All scripts are in `scripts/` and beside this file. Each log ends with `exit=<code>`.

| # | Command | Exit | Log |
|---|---|---|---|
| 1 | `gh api repos/lglouis3-create/exam-drill-kit/actions/jobs/125587774002/logs` | 0 | `gh-job-125587774002.log` |
| 2 | `node verify_fixture.js <test.js at 6f030f3> /tmp/ip-readonly/exam1-drill/src` | 0 | `verify_fixture_before.log` |
| 3 | `node build_fixture.js <test.js> /tmp/ip-readonly/exam1-drill/src` | 0 | `build_fixture.log` |
| 4 | `node verify_fixture.js <test.js> ...` (after) | 0 | `verify_fixture_after.log` |
| 5 | `scripts/run_c1.sh` (9b: mkcourse.sh, ci/oncourse.js, second run, build, module test), course c1 (2 figures, before the course data change) | 0, 0, 1 (refuses, by design), 0, 0 | `c1-*.log` |
| 6 | `scripts/ci_course.sh module:short-answer-graphs` (core/ci_course.sh), 2 figures | 1: core test.js section 7 "missed concept never returned" | `ci_course-module-1.log` |
| 7 | the same, with L06-026..028 | 1: section 7 again | `ci_course-module-2.log` |
| 8 | the same, with L06-030 and lecture L02 | 1: "dupOf points at missing L02-019"; state_check_test.js (its fixed id L02) | `ci_course-module-3.log` |
| 9 | the same, 3 figures, source build order | 1: section 7 "returned the identical question" | `ci_course-module-4.log` |
| 10 | the same, 4 figures (the data kept) | 0: 26 PASS, 0 FAIL, 1 NOT RUN (cite_check.py), 1 REPORT | `ci_course-module-5.log` |
| 11 | `scripts/run_c1.sh` course c2, the new checks, before the fix | module test 1: 3 of 69 failed, "ticks.includes is not a function" | `c2-moduletest.log` |
| 12 | `scripts/run_c1.sh` course c3, after the fix | 0: 69 passed (1 skipped) | `c3-moduletest.log` |
| 13 | `scripts/run_variant.sh v-saonly saonly`, `v-absent absent` | 0 (67 passed); 1 (1 of 1 failed, as required) | `v-saonly-*.log`, `v-absent-*.log` |
| 14 | `python3 mutations.py /tmp/port-short-answer-graphs/mut` (first pass, before `51aafa0` was committed) | 0; 25 of 26 caught | `mutations-run-pass1.log`, `mutations-pass1.tsv`, `mutations-pass1/` |
| 15 | `scripts/final.sh` on `51aafa0` | all as expected; mutations 24 of 26 caught (M10 not caught on that run) | `run-51aafa0/` |
| 16 | GitHub run 41544977398 on `51aafa0` | success, all 6 jobs | `run-51aafa0/gh-run-41544977398.txt` |
| 17 | **`scripts/final.sh` on `800b229`** | see below | `final/`, `fin-*.log`, `ci_course-module-final.log`, `mutations-run-final.log`, `mutations.tsv`, `mutations/`, `screenshots/` |
| 18 | **GitHub run 41546905947 on `800b229`** | success, all 6 jobs | `gh-run-41546905947.txt`, `gh-job-125624678941.log`, `gh-job-125624593378.log` |

## Results on the final commit `800b229` (agent-run)

| Check | Result |
|---|---|
| `ci/oncourse.js` on a fresh `mkcourse.sh` course (9b) | exit 0; a second run exits 1 and says it runs once per course; `python3 build.py` exit 0 (`fin-oncourse.log`, `fin-oncourse-second.log`, `fin-build.log`) |
| Module test on that course, 3 runs | PASS 69, PASS 69, PASS 69 (1 skipped each: no Graphs tab without figures, because the course has figures) (`fin-moduletest.log`, `-2`, `-3`); a fourth run with screenshots: PASS 69 |
| Module test, the same course with short answers only | PASS 67 (1 skipped: the course's figures); the "no Graphs tab" check ran and passed |
| Module test, module code left out | FAIL 1 of 1, as required |
| `core/ci_course.sh module:short-answer-graphs` (run_checks.sh on the module's own course) | exit 0: 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`); `home_test.js` 36 passed |
| Mutation checks | 25 of 26 caught; M12 not caught, equivalent (below) |
| GitHub "Kit checks" run 41546905947 | success: Chromium · module:short-answer-graphs (job 125624678941: 26 PASS, 1 NOT RUN, 1 REPORT; module test 69 passed), Chromium · template, Chromium · template-unset, Chromium · medicinal-chemistry (job 125624593378: 23 PASS, 0 FAIL, 2 NOT RUN, 1 REPORT; `home_test.js` 36 passed), WebKit · template (informational), Modules to check |
| No-module template course and Medicinal-chemistry (local) | cited from `evidence/baseline` folder `main-6432c36/` (commit `f8a22d5`): its inputs are core `a2dbf03`, template `cbac5bd`, Medicinal-chemistry `f1f5ee5`, the same trees as this branch. Template course: 24 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT. Medicinal-chemistry (full clone): 23 PASS, 0 FAIL, 2 NOT RUN (stepper_test.js, cite_check.py), 1 REPORT; `home_test.js` 36 passed |
| Regex lookbehind in module files | none |
| Professor's name | not in the module's files, the fixture, this evidence or the PR text (searched with the names read from the course's `professors`; the names are not written here) |
| WebKit (Safari) locally | NOT RUN: not installed in this container. The GitHub WebKit job is informational and passed |

## Persistence results (QUALITY C), agent-run, on `800b229`

Saved state: the course's 10 prompts, each with a draft of 2,000 characters, ticks and checked,
plus 200 saved short answers more (210 in all), and 300 answers on the figures' questions.

| Case | Result |
|---|---|
| Reload | the 210 saved short answers and 300 answers come back; the 8 figure cards show the same counts and skipped readings; the page shows the saved draft and "10 checked" |
| Export, then Import into a fresh profile | the export carries 210 saved short answers and 300 answers; the fresh profile has none; after Import it has the same 210 and the cards show the same counts |
| Profile switch | each profile keeps its own short answers |
| Reload 400 ms after typing | the change is kept |
| Reload under 150 ms after typing | the last change is lost; the text saved before it is kept; all 210 are there. This is the core's 150 ms save delay (reported, not changed) |
| Storage denied (`SecurityError`) | the core's notice "This browser did not save your progress ..." shows; the stored progress is left as it was; the draft stays on screen; once storage works, the next change is saved with every earlier short answer and loads after a reload |
| Storage full (`QuotaExceededError`) | the same |
| A saved entry in a bad shape (an edited or older file) | before the fix: Check my answer stopped with a page error ("ticks.includes is not a function"). After: an entry that is not an object is dropped, fields of the wrong kind are removed, ticks keep only key point numbers the prompt has, and every other entry loads |

## Mutation checks

`mutations.py` applies each mutation to the copy of the module in a scratch course (exact
replacement, must match once), rebuilds, runs the module test, records the result and restores
the file. Nothing is committed to the port branch. Final table: `mutations.tsv`; logs: `mutations/`.

| Mutation | Test exit | Checks that failed (agent-run, on 800b229) |
|---|---|---|
| M01 a typed draft is not saved | 1 | the draft is kept in the progress as it is typed; the other profile keeps only its own draft; a reload 400 ms after typing keeps the change; a reload under 150 ms after typing loses at most that change, and every saved short answer is still there; storage denied: once storage works, the next change is saved with every earlier short answer and loads after a reload; storage full: once storage works, the next change is saved with every earlier short answer and loads after a reload |
| M02 saSave changes the progress but never writes it | 1 | a reload comes back to the page with the draft and the ticks; the other profile keeps only its own draft; a reload 400 ms after typing keeps the change; a reload under 150 ms after typing loses at most that change, and every saved short answer is still there; storage denied: the student is told the progress was not saved; storage denied: once storage works, the next change is saved with every earlier short answer and loads after a reload; storage full: the student is told the progress was not saved; storage full: once storage works, the next change is saved with every earlier short answer and loads after a reload |
| M03 the ticks are not kept | 1 | ticking key points counts them and keeps them; a reload comes back to the page with the draft and the ticks |
| M04 Check my answer does not count the prompt checked | 1 | Check my answer shows the model answer and each key point to tick, and counts the prompt checked |
| M05 Clear leaves the ticks and checked | 1 | Clear empties the draft and the ticks |
| M06 Shuffle keeps the prompt number | 1 | Shuffle starts again at prompt 1, every prompt kept |
| M07 a key prompt does not say so | 1 | a key prompt says so, an objective prompt carries no form, and Next stops at the last |
| M08 Next is never disabled at the last prompt | 1 | a key prompt says so, an objective prompt carries no form, and Next stops at the last |
| M09 no cleaning of saved short answers on load | 1 | on load, a saved entry that is not an object is dropped, fields of the wrong kind are removed, and every other saved short answer loads; ticks keep only key point numbers the prompt has; a saved short answer in a bad shape does not stop the page: Check my answer shows the key points |
| M10 the exam's own miss wording (tracings) is ignored | 1 | a tracing's feedback uses tracing wording, not curve wording (sgc-PE2-030); a tracing names its skipped question in tracing wording, not curve wording (tag direction) |
| M11 the tracing noun is ignored | 1 | a tracing names its skipped question in tracing wording, not curve wording (tag read) |
| M12 the tally counts right answers too | 0 | not caught (equivalent: see above) |
| M13 the tally is sorted least often first | 1 | the tally counts each wrong pick's miss tag, most often first, and leaves out right answers |
| M14 the figure's reading is open after a right answer too | 1 | a right answer shows the reading folded and names nothing skipped |
| M15 a wrong pick does not name the reading question skipped | 1 | a tracing's feedback uses tracing wording, not curve wording (sgc-PE2-030); a wrong pick names the reading question skipped, under the verdict; a tracing names its skipped question in tracing wording, not curve wording (tag direction) |
| M16 Redo wrong asks every question of the figure | 1 | Redo wrong asks only the question answered wrong; the end of the Redo wrong pass counts that pass only (1 of 1) |
| M17 the end of a pass counts every answer ever given on the figure | 1 | the end of the Redo wrong pass counts that pass only (1 of 1); a second pass counts its own answers only (5 of 5) |
| M18 a question counts by its first answer, not its latest | 1 | the card counts each question by its latest answer, and still lists the reading skipped before; the counts on the card are kept through a reload; a question counts by its latest answer (wrong, wrong, then right: right) |
| M19 an answer marked guessed counts as right | 1 | an answer marked "I guessed" counts as not right on the card |
| M20 every exam fold is open | 1 | a fold per exam, the active exam open; the Exam 2 fold names its group Tissue tracings and has its intro line |
| M21 the exam's group name (Tissue tracings) is not used | 1 | a fold per exam, the active exam open; the Exam 2 fold names its group Tissue tracings and has its intro line |
| M22 the figure keeps the core's alt text | 1 | the figure carries the question's own description as its alt text |
| M23 build step: an image in two figures is not refused | 1 | an image in two figures stops the build and says so |
| M24 build step: a miss tag in no table is not refused | 1 | a miss tag in no table stops the build and says so |
| M25 build step: a prompt id used twice is not refused | 1 | a prompt id used twice stops the build and says so |
| M26 build step: a prompt with no key points is not refused | 1 | a prompt with no key points stops the build and says so |

M12 ("the tally counts right answers too") is not caught because it is equivalent: a right answer's
picked options are all right options, and the tally counts only wrong options, so removing the
`result` test changes nothing.

M10 was caught on the first pass and not on the run of `51aafa0`: the option the test picked
carried the tag "direction", whose label is the same in MISS and MISS2. Commit `800b229` makes
both tracing checks compare the question text too; on `800b229` M10 is caught.

## For a core proposal (not changed here)

1. Core `test.js` section 7 takes the first concept with two or more questions and expects
   another wording of it, and at least 4 (`GAP`) other concepts, in the same topic. In real
   Intro to Pharmacology data a concept's wordings are spread over topics (FG and L06), so a
   course of real data can fail it. Here the data was chosen (two more of the professor's real
   figures) so that it passes.
2. Core `state_check_test.js` adds a lecture with the fixed id `L02`; a course that already has a
   lecture `L02` makes that check fail.
3. The core writes the progress 150 ms after the last change and not when the page closes, so a
   reload in that time loses the last change.
4. The core labels a question by the first lecture whose `deck` its cite names; Intro to
   Pharmacology's lectures also list `decks`, which the core does not read (L06-029, which cites
   only a transcript, and questions citing a deck listed only in `decks` cannot be labelled).

## Screenshots

`screenshots/short-answer-390.png`, `screenshots/graphs-390.png` (390 px wide, after the large
saved state was loaded).

### Behaviour map

Source: Intro-Pharmacology- `exam1-drill/src/app.js` at `929cd62` (read-only clone), unless another file is named. Written from the source code.

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
