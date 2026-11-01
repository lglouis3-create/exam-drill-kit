# Exam drill source

A single-file HTML study app built from plain source files: questions with
explanations, slide figures and drawn figures, a spaced-repetition scheduler
with confidence buttons, an exam simulator that follows the exam's blueprint and
survives a reload, weak-spot analytics with a session score and a review plan,
drawn step-through figures for processes, and reading tabs (objective guides,
tell-apart tables, reference tables) with an explanation card per table row.
Everything the student needs is in one page that opens offline once visited and
works on a phone; progress stays in the browser and can be exported.

The engine is course-agnostic and comes from the kit's `core/` (exam-drill-kit;
`core/README.md` there says which file is engine and which is content). A course
is `course.js` plus its own content files, which start from the kit's
`template/`. Reference implementations with full banks: the PHAR 4342 drill
(github.com/lglouis3-create/Medicinal-chemistry) and the PHAR 4344 Exam 1 drill
(github.com/lglouis3-create/Intro-Pharmacology-).

## Start a course

1. Copy the kit's `template/` and `core/` into the new course's repo as `src/`
   (the commands are in the kit's `core/README.md`).
2. Fill in `course.js`: names, storage namespace, professors, lectures (one per
   deck, with exam and module), the first exam's blueprint, the skill taxonomy
   this course tests, the pace. Add `when` to the exam for a countdown.
3. Replace the samples in `q1_topics.js` with the course's TOPICS and its first
   questions. Add a question file per lecture (`q2_<lecture>.js` …) and list it
   in `files` in `course.js`, in build order (a question file in `src/` that is
   not listed stops the build).
4. Put the professor's own questions into `STYLE.md` as they appear.
5. Put the course's own icons, if it has them, under `icons/` as
   `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` and
   `apple-touch-icon.png`; until then the build writes plain placeholders and
   says so.
6. Build and check:

       ./run_checks.sh                  # build, then every check, one line each
       ./run_checks.sh test.js          # build, then only the checks named

   Each line is PASS, FAIL, NOT RUN (with the reason) or REPORT
   (`explain_check.js`, which ranks weak explanations and has no failing
   condition). `cite_check.py` needs the decks (PDF) under `decks/`; the browser
   checks need Node Playwright with Chromium.
7. Commit the sources and what the build wrote at the repository root; publish
   the root with GitHub Pages.

The build writes the app to the repository root as `index.html` (what GitHub
Pages serves at the site root), with `.nojekyll`, `version.json`, `sw.js`,
`manifest.json` and the icons, and writes the `output` name from `course.js` as
a redirect to it. Every check reads the page through `built_page.js`. A check
that cannot run here says NOT RUN with the reason and exits 2, and is never
counted as passed; a case that does not apply to the bank on hand is listed as
a skip.

## Add a lecture

    python3 ingest.py --deck Lecture07.pdf --transcript "Course - 10_03.txt" \
        --lecture L07 --label "Lecture 7: title (10/03)" --prof Professor --render

This writes `ingest/L07/`: the slide-by-slide text, the picture slides to look
at, a crop spec skeleton for `harvest.py`, the transcript's exam-emphasis
lines, the polls printed on the slides (for STYLE.md), and a question
skeleton with every citation already filled in. Write the questions into the
skeleton, rename it `q<N>_<lecture>.js`, add it to `build.py`, crop the
figures the questions need, build, run the checks, commit. When only the slide
text is on hand (a session reading the Claude Project, which returns text for
a PDF), pass `--slides-text <file>` instead of `--deck`.

## The change log is part of every update

`CHANGELOG.md` is the one place an update is written down. The build embeds it:
the Topics page shows a **What's new** card with the bullets added since this
browser last pressed "Got it", and Settings lists every entry.

- Newest entry first, `## date (short title)`, then `- ` bullets.
- One short line per bullet, in the reader's terms — what they can now do, or
  what is now right — not which file changed. `style_check.js` fails on a
  bullet longer than 120 characters.
- **Every update adds its bullets in the same commit that makes the change.**
  A change with no bullet is invisible to the person using the drill.

## Step-through figures

A process is better walked than described. `stepper()` in `diagrams.js` builds a
figure as a few end states with Back, Next, Replay step, Play all and a dot per
step; the engine animates the difference between two steps, so a shape present
in both glides, a new one fades in and a removed one fades out.

    DIA['activation'] = stepper('activation', 'Title inside the panel', [
      ['What this step shows.', step1Svg],
      ['The next step.',        step2Svg],
    ], 200, 'The caption under the figure.');

Read `STEPPERS.md` before writing one: the rules about `data-k`, opacity and
rotated labels are what decide whether the motion reads as one process or as a
flicker. `node stepper_test.js` walks every step-through and checks that each
step settles and that nothing fades out and back in.

A figure reaches the reader three ways: `svg: DIA.key` on a question (it shows
in the concept block), `<!--DIA:key-->` in a reading tab, and the **Diagrams**
tab.

## The Diagrams tab

`DIAGRAMS` in `diagrams.js` is the tab's contents: `[group name, [figure keys]]`,
grouped the way the course groups the processes. Each group gets a card of chips
that jump to a figure. A key that is not in `DIA` is skipped, and the tab
removes itself from the nav when nothing is listed.

## Explain-one cards for tables

A reference row cannot carry a paragraph without the table becoming unreadable.
Each row gets a `Why?` button, the table gets one select and one output area,
and each row's explanation lives in a `<template>`:

    <td><button class="whybtn" data-xpick="classes:atenolol">Why?</button> …
    <div class="xpick">
      <label>Explain one: <select data-xsel="classes">…</select></label>
      <div class="xout" data-xout="classes"></div>
    </div>
    <template data-x="classes:atenolol"> … card markup … </template>

The `group:key` on a button has to match the `data-x` on its template and the
`data-xsel` / `data-xout` on the table's select and output. A card may carry
`<button data-xgo="fig-id">` to jump to the figure that shows it; a floating
button then comes back to the card. `reference.js` ships a worked sample.

## Weak spots: the session and the review plan

The page opens with **this session** — the run of answers with no half-hour gap,
its accuracy, the last twenty as dots, and first half against second half — and
then **what to review next**: every question whose last three answers are not
all solid, grouped by the section that teaches it, most missing first, each
concept showing the option chosen with why it is wrong, the right answer, and
the first lines of the concept block.

The grouping comes from `links.js`, which maps a question to the reading section
that explains it. Questions with no entry group by topic instead, so the plan
works before any links are written. The same links are the "Explain more" chips
under an answered question.

## Question schema

```
{id, skill, prof, tier:'new'|'old', topic, sub, concept, tags, source:'slide'|'transcript'|'both',
 multi, lowYield, dupOf, type:'numeric'|'match',
 stem, img, options:[{t, correct, why}], teach, teachImg, svg, note, quote, cite, read}
numeric: units, answer, tol, steps:[{k:'setup'|'unit'|'algebra'|'round', t, why}]
match:   left, right, pairs:[{l, r, why}]
```

Rules the checks enforce: one correct option (or `multi` with two or more and a
distractor, stem ending "Select all that apply."); a `why` on every option;
`cite` names the deck file and slide; `skill` from the course taxonomy;
`concept` shared by wordings of one idea; `dupOf` for two wordings of one fact;
`lowYield` for an aside that should stay off the exam paper; stems ask the
subject, never "what does the slide say"; options short and parallel, the
correct one never the longest; British or American spelling as the professor
uses it, consistently.

## Files

Engine, from the kit's `core/` (leave alone unless changing behaviour for every
course; a change for every course goes to the kit): `shell.html`, `views.js`,
`build.py`, `sw.js`, `built_page.js`, `check_lib.js`, `run_checks.sh`, the
checks (`test.js`, `style_check.js`, `render_test.js`, `stepper_test.js`,
`device_lint.js`, `output_test.js`, `checks_test.js`, `draw_test.js`,
`browser_test.js`, `storage_test.js`, `startup_test.js`, `update_test.js`,
`offline_test.js`, `home_test.js`, `history_test.js`, `scheduler_test.js`), `features.js`
and `features_test.js` (feature modules: in the page and run only when `course.js`
`features` switches one on; each module's own folder is `features/<name>/`),
`harvest.py`,
`harvest_mask.py`, `ingest.py`, `STEPPERS.md`, and `vendor/` (the FSRS library
and its licences, which the build puts in the page only when `course.js`
`scheduler.model` is `fsrs` or `concept-fsrs`).

Engine with a course-specific table at the top: `cite_check.py` (deck spellings
a citation uses that cannot be derived from `course.js` and the files on disk),
`explain_check.js` (the terms this course leans on that should be glossed) and
`harvest_mask.py` (crops that print their own answer). All three run with the
tables empty.

Content (per course): `course.js`, `q*.js`, `images.json`, `glossary.js`,
`links.js`, `reference.js`, `tell.js`, `guide.js`, `diagrams.js`, `atlas.js`
(stub unless the course draws structures), `STYLE.md`, `CHANGELOG.md`. Decks go
under `decks/` (ignored by git).
