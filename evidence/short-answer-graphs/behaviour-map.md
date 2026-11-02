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
