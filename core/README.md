# core/: the shared engine and its checks

The engine and checks every course drill runs. A course's own content lives in
`template/` (the skeleton a new course starts from) and, once a course exists, in
that course's repository. Both folders come from the recovered exam-drill template
(`history/exam-drill-template-2026-10-02/`, unchanged there), with the picks in
`review/proposed-core.md` applied to `core/`.

## The split

| File | Folder | Why it is there |
|---|---|---|
| `shell.html` | core | page skeleton, styles, storage, scheduler; reads `COURSE` and nothing else about the course |
| `views.js` | core | every view and the boot code |
| `build.py` | core | assembles the page from the shell, the course files listed in `course.js` `files` and the views, and writes it to the repository root |
| `built_page.js` | core | the one place every check takes the built page's location from |
| `check_lib.js` | core | what the newer checks share: summary line and exit code, Playwright loading, a test server |
| `output_test.js` | core | the build writes to the repository root and the checks read from there |
| `files_test.js` | core | `course.js` `files`: every listed question file reaches the page after the core's `build.py` is copied over the course's; the lists the build refuses |
| `tables_test.js` | core | `course.js` `tools`: `cite_check.py`, `explain_check.js` and `harvest_mask.py` read the course's tables from it after the core is copied over; the tables the build refuses |
| `test.js`, `style_check.js`, `render_test.js`, `explain_check.js`, `stepper_test.js` | core | checks that run on any course's built page |
| `style_rules.js`, `style_check_test.js` | core | the stem rule of `style_check.js` (a stem asks the subject, not what the material says; "given as" allowed in dose or problem wording), and its test on examples of both kinds |
| `cite_check.py` | core | citation check; the deck spellings it cannot derive come from `course.js` `tools` |
| `browser_test.js` | core | browser smoke test (Node Playwright port of the template's `browser_test.py`, which stays in `history/`), including no sideways scroll on a 375 px phone and wide reading-tab tables scrolling in their own box |
| `device_lint.js` | core | fails on syntax older Safari rejects (regex lookbehind) in anything that ships |
| `run_checks.sh` | core | builds, then runs every check on its own, one line per check |
| `ci_course.sh` | core | builds a scratch course from the kit (template, template with no count or marks, Medicinal-chemistry, or the template with feature modules switched on) and runs `run_checks.sh` on it in Chromium or WebKit; the GitHub workflow's step |
| `checks_test.js` | core | the checks' own exit codes, the device lint, `run_checks.sh`, and `test.js` and `render_test.js` on a course with no `DIAGRAMS` list |
| `storage_test.js` | core | progress when the browser refuses to save; the last answer before a reload, a closed tab, `pagehide` or a hidden page is kept, with the 150 ms save timer unable to fire |
| `startup_test.js` | core | saved progress when a start-up step or the load itself fails: nothing is written over it, and the rest of start-up runs |
| `draw_test.js` | core | no exam paper carries two wordings of one fact, across pools too |
| `update_test.js` | core | a newer version is offered; a reload comes back to the same place |
| `sw.js` | core | the service worker; `build.py` fills in the course's cache prefix and file list and writes it to the root |
| `offline_test.js` | core | the offline copy: other sites' caches kept, server down (connections refused), server slow |
| `home_test.js` | core | the Home Screen card for each kind of browser: a closed section in Settings, nothing on Topics |
| `history_test.js` | core | the answer history: its fields, Export, Import, Erase, a refused write |
| `import_test.js` | core | Import progress: files of another course or app, files that name no course, and damaged files refused; older files converted; a file replaces this profile only when it continues it or this profile holds no progress, after a confirmed plan, with a copy to put back; conflicting copies of one answer, another origin, a cut answer list, answers out of order, and matching or empty answer lists with other concept progress, settings, scheduling state or module part go into a new profile; repeats change nothing and make no second profile; Put back and refused reads and writes leave both records stored |
| `preview_test.js` | core | `build.py --preview`: the live site unchanged, the preview's own namespace |
| `state_check.js` | core | the course's root `CLAUDE.md` was updated with or after the newest lecture (§7.8) |
| `state_check_test.js` | core | `state_check.js` on repositories with known histories |
| `oldcache_test.js` | core | `course.js` `oldCachePrefix`: an old worker's caches deleted, every other cache kept |
| `scheduler_test.js` | core | the scheduler (`review/scheduler-proposal.md` §4-§5), with a fixed clock, on scratch builds with a test topic |
| `features.js` | core | the hooks a feature module uses (tab, question type, step after an answer, pass after a view is drawn, reading-tab HTML, a new exam paper, Settings section, start-up step, progress converter); in the page only when `course.js` `features` switches a module on |
| `exam_typed.js`, `exam_typed_test.js` | core | `course.js` `exams[].typed`: numeric and matching items drawn onto that exam's papers, typed and picked there, graded and reviewed; in the page and run only when an exam sets it |
| `nullexam.js`, `nullexam_test.js` | core | an active exam with `questions: null`, a pool with `marks: null` or `minutes: null`: no paper without a count, unweighted without marks, untimed without a time limit; in the page only when the active exam leaves one unset, the test runs on every course |
| `numeric.js`, `numeric_test.js` | core | `course.js` `numeric`: a typed number read with its unit, never two numbers joined, graded to a course margin; in the page and run only when the course sets it |
| `features_test.js` | core | feature modules: the build's refusals, every hook, a module that fails, and no change to a page with no module on; runs when a module is on |
| `vendor/` | core | ts-fsrs 6.0.0's own UMD bundle and the licence texts of the code in it; `build.py` inlines them only for a course whose scheduler model needs FSRS |
| `harvest.py`, `harvest_mask.py`, `ingest.py` | core | tools for adding a lecture; `harvest_mask.py` takes the crops to mask from `course.js` `tools` |
| `STEPPERS.md` | core | the rules step-through figures are written to |
| `course.js` | template | the course manifest: names, `ns`, lectures, exams, skills, pace, scheduler, the data files (`files`), the tools' course tables (`tools`), the kit pin (`kit`) |
| `q1_topics.js` | template | the first question file: it declares `TOPICS` and `QUESTIONS` (samples to replace) |
| `links.js` | template | which reading section explains a question (course-specific table) |
| `reference.js`, `tell.js`, `guide.js` | template | the reading tabs (samples to replace) |
| `diagrams.js` | template | drawn figures and the Diagrams tab list (one sample step-through) |
| `atlas.js` | template | drawn structures; a stub unless the course draws them |
| `glossary.js` | template | term glosses (samples to replace) |
| `images.json` | template | slide crops, base64; empty at the start |
| `STYLE.md` | template | the professor's question formats, verbatim |
| `CHANGELOG.md` | template | the course's change log, embedded by the build |
| `CLAUDE.md` | template | rules for working in the course's source tree |
| `.gitignore` | template | decks, ingest output and build leftovers stay out of git |
| `README.md` | template | the course source tree's README |

`links.js` is content: the engine reads `READ_LINKS` if it is defined and works
without it, and every entry in it names a section of one course's reading tabs.

## Setting up a new course

A new course is the files of `template/` plus the files of `core/`, copied into the
course repository's `src/`. `core/README.md` (this file) stays in the kit; the
course's `src/README.md` comes from `template/`.

    mkdir -p COURSE_REPO/src
    cp -r template/. COURSE_REPO/src/
    find core -maxdepth 1 -type f ! -name README.md -exec cp {} COURSE_REPO/src/ \;
    cp -r core/vendor COURSE_REPO/src/

No file name appears in both folders except `README.md`, so the copy order does not
matter for any other file.

A course that switches a feature module on also copies the module's `current/` folder
to `src/features/<name>/` (`features/README.md`).

## Feature modules

`course.js` `features: {<name>: {version, ...options}}` switches modules on. The build
reads each from `src/features/<name>/` (a copy of the kit's `features/<name>/current/`),
checks the pinned version, the options and the modules it needs, runs its build step,
and puts `features.js` and the module into the page between the data and `views.js`;
the layout, `module.json`, the build step and every hook are in `features/README.md`.
With no module on (no `features` field, or `{}`) neither `features.js` nor any module
code is in the page, which is then byte for byte the page this core built before
feature modules existed, except the build stamp: on the template course, built from the
same sources by the kit at `d187207` and by this core, the two `index.html` files
(241,642 bytes each) differ only in `BUILD.stamp` and `BUILD.built`; the same holds with
`numeric` and `typed` left unset, and the page of a template course set up before
2026-11-01 differs from today's only in the 15 comment lines that document `features`,
`numeric` and `typed` at the top of `template/course.js` (2026-11-01).

`features.js` adds the hooks by wrapping eight engine functions (`show`, `renderQuiz`,
`renderSettings`, `refFigures`, `drawPaper`, `record`, `load`, `upgradeDB`) and watching `main` for redrawn views
(a `MutationObserver`), so neither `views.js` nor `shell.html` has a line for modules.
A module that throws while it loads is skipped; a hook that throws switches its module
off for the visit; the page carries on either way. `features_test.js` checks all of
this with three probe modules it writes into a scratch copy, and runs whenever the
course has a module on, with each module's own test (`build.py --list-checks`).

## The course's files

`course.js` `files` lists the course's data files in the order the build puts them into
the page: `atlas.js` and `diagrams.js`, then every question file, named
`q<N>_<topic>.js`, the first of which declares `TOPICS` and `QUESTIONS`. A course adds
each new question file there. The list belongs to the course: bringing in a newer core
replaces `build.py` and never `course.js`, so the list survives a core update. (Until
2026-11-01 the list was `DATA_FILES` inside `build.py`; copying the `9f2f2a4` core's
`build.py` over Medicinal-chemistry's, whose own copy listed its 15 question files,
left 39 of its 479 questions in the page, with no error.) Without the field the build
uses the template's list, `['atlas.js', 'diagrams.js', 'q1_topics.js']`.

The build stops, before it writes anything, when the list names a file that is not in
`src/`, names one twice, names a folder, names a source it always includes
(`course.js`, `glossary.js`, `links.js`, `reference.js`, `tell.js`, `guide.js`,
`views.js`, `sw.js`), has no question file, or leaves out a `q<N>_*.js` file that is in
`src/`, because that file's questions would be missing from the page. A course moving
from a core whose `build.py` carried its list copies that list into `files` before the
new `build.py` is copied in; the build names every question file the default would
leave out.

Everything else reads the same list from the build: `python3 build.py --list-sources`
(every shipped source, which `device_lint.js` scans) and `python3 build.py --list-files`
(`{"files": [...], "questions": [...]}`, the data files and the question files among
them, in build order), which `scheduler_test.js` reads to find the first question file
and `browser_test.js` to count the questions in the sources. `files_test.js` checks it.

The question count the page shows in Settings is `QUESTIONS.length`, and the build writes
the same number into `BUILD.questions`, from `course.js` and the data files run in node in
page order (it used to count lines starting `{id:'` in the question files, which counted
the `TOPICS` entries too: 13 for the template's 7 questions, 551 for
Medicinal-chemistry's 479). `test.js` and `render_test.js` check both.

`DIA`, `DIAGRAMS` and `READ_LINKS` are optional: the engine and the checks run without
them (`checks_test.js` runs `test.js` and `render_test.js` on a copy with no `DIAGRAMS`).

## Course tables

Three core tools need tables that only the course can supply. They live in `course.js`
`tools`, which a core update never replaces, so no core file holds course data and
copying a newer core over a course keeps the course's tables. (Until 2026-11-01 each
tool kept its table at the top of its own file, and a core update reset them to the
kit's empty ones; Medicinal-chemistry's `kit/move-to-core` had entries in all three.)
Every field is optional:

| Field | Read by | What it holds |
|---|---|---|
| `citeAliases` | `cite_check.py` | how a citation spells a deck, in lower case, to the file on disk, or `null` for a deck that is not a PDF on hand (its slide numbers are then reported unchecked) |
| `citeLectures` | `cite_check.py` | lecture number to file, for `Lecture #11` citations, only where the digits of the `lectures` ids do not give it |
| `citeBareMap` | `cite_check.py` | a deck named in words in a citation (`Absorption I slide 24`) to its file, or `null` |
| `explainTerms` | `explain_check.js` | `['gloss key', 'regex source']` for each term the course leans on; one whose key is not in the glossary is reported where an explanation uses it. Appended to the kit's own list in the file (`KIT_TERMS`, empty so far) |
| `harvestMasks` | `harvest_mask.py` | `['images.json key', ['phrase', ...]]` for each question crop that prints its own answer; the phrases are whited out |

The Python tools read `course.js` by evaluating it with node, as `build.py` does, and
`explain_check.js` evaluates it the same way; none of them needs anything else of the
course for this. Each prints what it read with `--tables` (JSON) and stops. Each tool
reads only its own fields, so the build checks `tools` before it writes anything: a
field no tool reads (a misspelt name would otherwise leave a tool without its table and
say nothing) or a table of the wrong shape stops the build. `course.js` ships in the
page, so the tables do too, and `device_lint.js` scans them with the rest of it.
`tables_test.js` checks all of this on scratch copies, with the course's own tables and
with test tables: what each tool reads, that `explain_check.js` reports a course term
with no gloss only while the term is listed, that `cite_check.py` checks citations
against a deck only an alias names (when `pdfplumber` is installed), that without
`tools` every table is empty, and the tables the build refuses.

## What the build writes

`python3 src/build.py` writes into the repository root, which is what GitHub Pages
serves:

| File | What it is |
|---|---|
| `index.html` | the app; the site root opens it |
| `.nojekyll` | stops Pages running Jekyll, which drops files whose names start with `_` |
| the `output` name in `course.js` | a redirect to `index.html`, so old links keep working |
| `version.json` | `{"built": "<UTC time of the build>"}`, the same value as `BUILD.built` in the page |
| `sw.js` | the service worker, from `src/sw.js` with the course's cache prefix and file list filled in |
| `manifest.json` | the web manifest: `title` and `short` from `course.js`, start page `index.html`; `description` and `orientation` too when `course.js` `manifest` gives them (Medicinal-chemistry's manifest before the core had both; `orientation` takes the values the web manifest allows, and any other value or field stops the build) |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | copied from `src/icons/` when the course supplies them; otherwise a plain square in the accent colour, and the build says so |

`python3 src/build.py --preview` writes only `preview/index.html` and
`preview/version.json`, which Pages serves at `<site>/preview/`; every file of the live
site stays as it was. The preview page says it is a preview, links no manifest and
registers no service worker. It keeps everything under the namespace `<ns>-preview`,
copied once from the live keys the first time it opens in a browser, so answering in a
preview never changes the live drill's progress, and a preview with a new progress
format cannot convert the live data. The comparison's arms (see "The scheduler") are
hashed with the course's `ns`, not the storage namespace, so a concept is in the same arm
in the preview as on the live page. Delete `preview/` when the update goes live.

For a course whose `scheduler.model` is `fsrs` or `concept-fsrs`, `index.html` also
carries `vendor/ts-fsrs-6.0.0.umd.js`, with the licence texts above it; for `concept` it
carries no library. Any other model name stops the build. Each file is written through a
`.tmp` file and renamed, so a failed build leaves the last good file in place. Nothing
is written outside the repository. Every check reads
the page through `built_page.js`; `DRILL_PAGE=<file>` points them all at another page.

## Narrow screens

The reading tabs (Guides, Tell apart, Reference) put every table in a box of its own
(`boxTables` in `views.js`, `.tscroll` in `shell.html`) that scrolls sideways when the
table is wider than the screen, so the page itself never scrolls sideways; the table, its
rows and their order are as written, and its top and bottom margins move to the box so
the spacing is unchanged. A word or link longer than its line breaks, and a jump-list chip
longer than the line wraps. Louis approved this on 2026-11-01: on a 375 px phone,
Medicinal-chemistry's three tabs scrolled the whole page sideways by 226, 95 and 176 px
(17 tables wider than the screen), and its longest jump-list chip ended at 979 px.
Screenshots of the three tabs at 1100 px are pixel-identical before and after on
Medicinal-chemistry and on the template course (and at 375 px on the template course).
`browser_test.js` checks a table it builds wider than any phone, the course's own wide
tables, and the chips.

## Storage

Everything the page keeps goes through `store` in `shell.html` (Intro-Pharmacology's,
`exam1-drill/src/app.js`): keys are `<ns>:<what>`, progress is `<ns>:data:<profile>`,
and `ns` comes from `course.js` and never changes during a course. When the browser
refuses a write (quota full, private window, blocked site data), that key is served
from memory for the rest of the visit, and the first refusal shows one notice that
points to Settings → Export progress. A later write that succeeds clears the key's
failure. Switching profile writes any save still waiting on its timer first.

**Saved progress from an earlier core** (`upgradeDB` in `shell.html`). The scheduler work
of 2026-11-01 only added to the progress: question ids, `ns`, and every field a save
already has keep their names and meaning. The progress now carries `v: 2`; a save without
it gets the new top-level fields (`fsrsQ`, `fsrsC`, `arms`, `fsUndo`) empty, and each
concept gets `last` (question id → the answer count when it was last shown), rebuilt from
the answers kept. Import progress runs the same conversion. Under an FSRS model, questions
(or, under `concept-fsrs`, concepts) that have answers but no card get one by replaying
those answers, oldest first, through the library, with the grades above; only when the
answers kept are the whole history (the first is answer 1), because a card built from part
of a history would be a state the student never had (design choice, after ts-fsrs's
CHANGELOG 6.0.0: "rebuild memory from complete review history"). Otherwise those questions
start as new under FSRS and `DB.fsHistory` is `incomplete`. `scheduler_test.js` checks
this on a progress object and history saved by the `5014f27` core (recorded with
`--print-progress`): every saved field reads back unchanged, `last` is rebuilt, the
scheduler ranks every test question as `5014f27` did, the seven-field history reads back
unchanged, and under `fsrs` and the comparison the rebuilt cards equal the library's own.

## Start-up and the saved progress

**The load comes first.** Start-up (the end of `views.js`) picks the profile and loads its
saved progress before any step that builds the page. `load()` needs the answer history
and the scheduler code, which `shell.html` defines after the storage code, so the start of
start-up is the earliest point it can run; before it, only a preview's first-visit copy of
the live keys writes to storage, and that copies them unchanged. Until 2026-11-01 the tab
steps ran first: in a scratch move of the Pharmacokinetics drill a `DIAGRAMS` list of
another shape made one of them throw, start-up stopped before the load, the drill ran on a
blank progress, and the next answer's save replaced the saved progress. `startup_test.js`
shows the same on the `d187207` core and on Medicinal-chemistry's live page (its
`index.html` at `d7331be`): 5 saved answers, then a save of 1. Louis approved the fix on
2026-11-01.

**Writes wait for a load that worked.** `canSave()` in `shell.html` is true only when the
progress of the profile on screen was read in this visit. `save()`, the save a profile
switch writes first, the answer history (`saveLog`) and the exam paper (`saveExam`,
`clearExam`) write nothing while it is false: before `load()` has run, and after a load
that could not read what is stored (not valid JSON, not a progress object, or a value
`upgradeDB` cannot convert). The stored value is left exactly as it was, the drill still
runs for the visit, and one notice (`#loadwarn`) says:

    Your saved progress could not be loaded. Nothing will be saved during this visit, and the saved progress is left as it was.

Import progress and Erase my history replace the saved progress, so they do nothing then
and say so (design choice: a student with an export file can switch to another profile
name and import it there). Switching to a profile whose progress loads takes the notice
away, and that profile saves as usual. A stored answer history that cannot be read (not
valid JSON, or not a list) is never written over either; progress still saves, and no
notice is shown for it, as for a refused history write. Erase my history replaces it.

**Each later step on its own.** Every start-up step after the load runs in `bootStep`: the
page title, the tab buttons, the Atlas and Diagrams tabs, the Home Screen section's
install listeners, the offline copy, the update check, keeping the place, bringing back a
running exam paper or the place before a reload, and opening Topics. A step that throws is
skipped with its error on the console (`Start-up step skipped: <step>.`), and start-up goes
on. A tab whose list cannot be built is removed, as an empty one is. A place that cannot be
brought back (a reading tab that throws, for example) opens Topics, as before, and now logs
its error. The structure index built from an optional `FG` table while the script starts is
left empty, with the error on the console, when the table has the wrong shape. When nothing
fails, nothing changes: on the template scratch course every other check passed with the
same number of checks as on the `d187207` core.

Not covered: a fault in a view's own drawing after start-up (a reading tab opened later, a
glossary entry of the wrong shape in an explanation) still breaks that screen, with the
progress loaded and saving as usual; and an error at the top level of a course data file
stops the page's script before any button works, so nothing can be answered or saved.

`startup_test.js` puts each fault into a copy of the built page just before its start-up
block (the marker `built_page.js` uses), so it runs on any course and on a page an older
core built (`DRILL_PAGE`). From 5 answers saved through the page (fewer in a bank of fewer
than 5 questions), it checks that with nothing failing the progress is loaded and shown
and an answer and an exam paper are saved; that with `DIAGRAMS` of the wrong shape, a
throwing offline step or a throwing reading tab on the place a reload comes back to, the
fault is on the console, Topics opens, the 5 answers are loaded and shown, an answer is
saved and no write stores fewer answers or history entries than were saved; that with
stored progress that is not valid JSON, a value the load cannot convert, or a load that
throws, nothing is written over the progress, the history or an exam paper, Erase and
Import change nothing, the notice is shown once, and another profile saves; and that a
history that cannot be read is left as it was. 77 checks; 40 of them fail on the
`d187207` core (template scratch course) and on Medicinal-chemistry's live page.

## Offline

`sw.js` is Medicinal-chemistry's service worker (`ed38dbd`) made course-agnostic. The page
is fetched network-first; the saved copy is used when the network is down or slower than
3500 ms (`NET_TIMEOUT`), and when the network copy then turns out to differ the page offers
a reload, never forcing one. The worker is registered only on https, `localhost` or
`127.0.0.1`. Caches
are named `<ns>-v<n>`, and cleanup deletes only names of exactly that form, because every
drill on `lglouis3-create.github.io` shares one origin and one Cache Storage: another
course's offline copy is never touched, including one whose `ns` starts with this course's.
A course that had a worker under another prefix before it moved onto the core
(Medicinal-chemistry's is `phar4342-drill-`, its `ns` is `phar4342final`) names that
prefix in `course.js` `oldCachePrefix`, and the worker deletes caches whose names start
with it. The build refuses a prefix that does not end with `-` or that would match the
course's own `<ns>-v<n>` caches. `offline_test.js` treats a cache that the course's own
`oldCachePrefix` matches as one to delete, not as another site's; `oldcache_test.js` sets
or removes the field with a line appended to `course.js`, so both run the same on a
course that names a prefix and on one that does not. `preview_test.js` reads the live
keys only after the live page's worker has taken control and the page has recorded that
(`<ns>:offline-ready`), and compares them key by key.

## A newer version, and the place after a reload

An open page reads `version.json` every 15 minutes and when its tab comes back; when a
newer build is published it shows a bar with Reload (Basic-Pharmacokinetics). Reload, the
browser's own reload, and a phone dropping a background tab all come back to the same tab,
the same open sections, the same question (answered or not, with nothing recorded twice)
and the same line at the top of the screen. The place is kept in `sessionStorage` under
`<ns>:place`, so it belongs to one browser tab. A running exam paper comes back first, as
before.

`update_test.js` checks the 15-minute offer with Playwright's fake clock paused, so the
page's time moves only by the test's own steps: once installed, that clock also runs on
with real time, so the test's own waits (1.9 s) and the page's load used up the 2 s it
keeps before the 15-minute check. With the page's clock read at that point, 8 runs on
Medicinal-chemistry's 6.86 MB page had 7 to 22 ms left in 7 runs and were 12 ms past the
mark in 1; 5 runs on the template course had 86 to 95 ms left. In 20 runs each, the check
"nothing is offered before 15 minutes" failed 4 times on Medicinal-chemistry and never on
the template course; with the clock paused, 20 of 20 passed on each. The test now also
checks that the page's clock moved exactly 898,000 ms (2 s short of 15 minutes) before it
looks for the offer.

## Answer history and the Home Screen card

Both are ported from BDK (`assets/app.js`). Every answer adds an entry to an answer
history kept under `<ns>:log:<profile>`, apart from the progress:

    [time in seconds, question code, 1 right / 0 wrong, mode, concept, confidence, item type,
     scheduler, arm, predicted recall]

The question code is an FNV-1a hash of the question id (8 hex digits); mode is `quiz`,
`sweep` or `exam`; confidence is `knew` (a right answer left as it is: the screen says
Next counts as "Knew it"), `unsure` ("Not sure"), `guessed` ("I guessed"), `sure` ("I
was sure of that" on a miss), or empty where none was given (a miss left as it was, an
exam paper); item type is `mc`, `multi`, `numeric` or `match`. The last three are the
answer log for comparing schedulers (`review/scheduler-proposal.md` §4.1.5 and §5):
scheduler is the model that schedules the question's concept and, in mode `quiz`, picked
the question (`concept`, `fsrs` or `concept-fsrs`); arm is the comparison arm the concept
is assigned to, or empty when the course runs no comparison; predicted recall is the
probability of a right answer the model in use gave at that moment, before the answer
updated it, rounded to 4 decimal places (a design choice, to keep the history small), and
`null` for the concept scheduler, which predicts none. The first seven fields are as they
were, so entries written before the last three were added still read the same, and BDK's
four (`[seconds, card code, 1/0, mode]`) are the first four here. Export progress writes
the progress and the history into one file, labelled with the course (`course`, `ns`).
Import progress merges the history without duplicating an answer (an entry here in the
older seven-field format gains the last three from an imported copy of the same answer)
and handles the progress as "Import progress" below says. Erase my history clears both. When the browser refuses to save the history, the oldest half is
dropped and no notice is shown, so the history never stops progress from saving. No
scheduler reads the history; the progress (`DB`) holds what they schedule from.

**Import progress** (Louis's rules of 2026-11-02, corrected twice on 2026-11-03;
`views.js` `readProgressFile`, `addsTo`, `holdsProgress`, `importPlan`, `continuesHere`,
`runImport`, `restoreBackup`; `import_test.js`). The file is read and checked whole before anything is saved:
- **Refused:**
  - a file that is not JSON or not a progress export;
  - a file labelled with another course (`course` or `ns`);
  - a file that names no course, such as the export before the kit core (`{profile, db}`),
    even when every question it answers is in this drill's bank, since question ids do
    not show whose progress a file is;
  - a BDK quiz export (`app: 'bdk-quiz'`, until a converter for it is built);
  - another app's file;
  - an answer or a history entry that is not whole;
  - the same answer twice.

  The page says which of these it is.
- **Refused as damaged** also: settings that are not a record, or a mode or pace that
  is not text; an answer count or a concept record's count that is not a number; a
  concept record's `asked` that is not a list, or `last` or `check` that is not a
  record; FSRS records that are not lists of cards; a comparison record whose arm is
  neither `concept` nor `concept-fsrs`. A module's own part is not checked by the core.
- **Converted:** an older progress, in a file that names the course, as on load
  (`upgradeDB`).

**One writer per profile (2026-11-03).** localStorage has no locking between tabs, and one
tab's save reaches another tab of the same browser a moment later. In that moment no
comparison before a write can see the other tab's save: `import_test.js` ("Two tabs at
once", with the other tab's save held back from this tab's view and nothing synchronised
before the action) showed an Import, an ordinary save and Put back each writing over an
answer another tab had just saved, and Delete the copies deleting a copy another tab's
import had just kept; that answer or copy was then in no record (7 failed checks on
0237635). So a profile has one writer at a time: the tab holding the Web Lock
`<ns>:writer:<profile>` (`navigator.locks`; the browser grants it to one tab at a time and
frees it when that tab closes).
- Another tab of the same browser opens that profile read-only. A wall over the page says
  so; the page takes no answers (`record` returns at once) and writes nothing: no ordinary
  save, history, Import, Put back, Delete the copies, Erase or exam paper.
- "Use it here" moves the profile: the writer saves what is waiting, frees the lock, stops,
  and posts the values it holds stored (BroadcastChannel). The new tab starts writing only
  once its own view of storage shows those values, so the old writer's last save is in
  place before the new tab's first; if they have not arrived within 5 s it does not start,
  and says so.
- A writer that does not answer within 4 s (asleep in the background) can be taken over
  ("Take it over anyway", `steal`). It then stops: the browser ends its lock, and before
  every write a writer checks that `<ns>:writer:<profile>` still names its own tab.
- An Import that writes another profile (a new one, or the history of the profile that
  already holds the file) holds that profile's lock while it writes, and writes nothing
  when a tab using that profile has it.
- A page that has stopped (read-only, handed over, taken over, or stale below) covers
  itself with that wall: it takes no answers, offers "Export this page's progress" when it
  holds answers or settings that are not stored, and asks before a reload would drop them.

What this does not cover (the independent review of 4b3b94c; Chromium only):
- **A writer that leaves without handing over** (closes, reloads, navigates away or switches
  profile) sends no hand-over, and the next tab to take the lock may not yet have its last
  save. Since 2026-11-04 that save is no longer lost to the next tab's writes: every writing
  tab also keeps what it last stored in `<ns>:pending:<profile>:<tab>`, a key no other tab
  writes (below, "Each writing tab's last save"). What remains:
  - the record arrives a moment later too, so for that moment the next tab works on the older
    progress; when the record arrives it becomes the progress if the tab has written nothing
    since it took the profile, and is kept as a copy (Put back) if it has, so the closed tab's
    answers are then in the copy, not in the live progress;
  - a browser that refuses that record's write (storage full) has no record for that save;
  - the exam paper and the copies Import keeps are not in the record: a paper pick or a copy
    written in that last moment is not covered, and a copy this tab adds from a record is
    written from its own view of the copies list;
  - the 60 s wait assumes a save reaches another tab within 60 s, which the HTML Standard does
    not define; if a newer record arrived later than that, an older one verified earlier could
    already be removed;
  - records of a profile never opened again, and records that cannot be read, stay;
  - an Import that only adds history entries writes no progress, so it is not in the record;
  - a "Not sure" whose save was written over keeps the stored confidence (history entries are
    matched without it);
  - the history merge is not cut to 20,000 entries; the next answer's save cuts it, as the
    `LOG_MAX` rule does (that rule waits for Louis's decision in #47).
- A browser without Web Locks (Safari and Safari on iPhone and iPad before 15.4, per
  https://caniuse.com/mdn-api_lockmanager, read 2026-11-03) keeps the comparison guards
  below on their own, and the interval above stays open there. A page opened from disk has
  Web Locks in Chromium; in Safari that is NOT RUN.
- A tab still running a core from before this change writes without the lock until it is
  reloaded.
- After a take-over, what the old tab had not saved exists only in that tab. It offers the
  export; "Use it here" there keeps that progress, with the history entries it had not stored,
  as one more copy Import keeps (Put back restores the progress and adds those entries to the
  history; if that history write is refused, the copy stays on the list) before it
  opens the stored progress, and refuses to take the profile if the browser refuses that copy.
  Switch, Reload and the new-version bar's Reload ask first while that work has changed since
  its last export. A tab the system closes while asleep loses it, as any unsaved answer.
- An exam-paper pick whose write the browser refused before a take-over is not in that copy
  (the copy holds progress and history); "Use it here" opens the stored paper.
- "Take it over anyway" reads the copies list at once to add that copy, so an Import the
  other tab made just before may not be in the list it writes: the same interval as the first
  item. A truly suspended tab was not
  tested: NOT RUN.
- The check of `<ns>:writer:<profile>` before each write reads localStorage too, so it is
  subject to the same delay between tabs it guards against.
- The hand-over relies on a value this tab reads from storage having been stored, which is
  how browsers behave; the HTML Standard does not define the timing of storage between tabs.
- Two devices never share a lock: moving progress between devices is Import's job.

**Each writing tab's last save (2026-11-04).** With each save of the progress, the tab holding
the lock also writes `<ns>:pending:<profile>:<tab>` = `{at, db, log}`: `db` is the progress it
stored (an object), `log` the history entries it added since it took the profile. No other tab
writes that key. When a tab takes the lock it reads every other tab's record of that profile,
oldest first, at once, 1.5 s later, and on each storage event for such a key. A record's place in
the stored progress is found by its last answer, compared on every field (never question and
time alone), which still works once the oldest answers are cut at 4,000:
- its last answer is stored (its last occurrence), before the stored last answer: the stored
  progress continued from it, nothing to add, unless the record carries a choice the later
  progress does not show (different settings, or an Erase, Put back or replacing Import made in
  that tab, which marks its record): then it is one more copy Import keeps;
- it is the stored last answer (or the record has no answers): the same progress, nothing to
  add; a different progress at that point (a setting, a module's part): one more copy Import
  keeps (Put back);
- its last answer is not stored: the save that was written over. If the record holds the
  stored last answer (it continues what is stored) and this tab has written and changed nothing
  since it took the profile, the record becomes the progress; otherwise it is one more copy
  Import keeps. Either way the page says so, and nothing is mixed.
The record's history entries that the stored history lacks are added; entries are compared on
every field but the confidence ("Not sure" changes it later), and counted, so two identical
attempts stay two. Erase, Put back, an Import that replaces the progress and Delete the copies
retire the other tabs' records of the profile: nothing is deleted then, but each record as it
stands at that moment is noted as handled in `<ns>:pending-seen:<profile>` and is not placed
again while it stays unchanged, so none of them brings back what was erased, put back, replaced
or deleted. A record that changes after that (a leaving tab's newer save arriving late) is placed
as usual, and, since this tab has written since, kept as a copy. A record found handled once
(placed, copied, or equal to what is stored) is not placed again while it is unchanged, so a
setting changed here later does not turn an old record into a copy.
**Cleanup rule:** a record is removed only when what is stored, read back, holds it as above
(in the progress or a copy, and every history entry), on a later check at least 60 s after that
was first found, with the record unchanged in between. The first-found time is kept in
`<ns>:pending-seen:<profile>`, so reloads do not start the wait again. Only the tab holding the
lock removes records, never its own. A record that changed is checked again; one that cannot be
read is left as it is. Without Web Locks no record is kept.
**Cost:** each progress save writes the record too, about the size of the progress (about 547,000
characters at 4,000 answers, `review/storage-usage-proposal.md`), and each writing tab keeps one
record until the next writer has checked it and 60 s have passed.

Import plans and writes nothing while the progress on this page is not what is stored:
when another tab or window saved the profile after this page read it (`SEEN`, the
stored value as this page last read it or had the browser keep it; a write the browser
refuses does not change it, and a profile opened again after a refused write keeps the
value last kept, `KEPT`), or when the browser refused this visit's last save of it. The page says which, and to reload. An answer still waiting
to be saved when Import is tapped is saved first; if the browser refuses that save, it
stays on the page, flagged as not saved, and nothing is imported.

The same check guards every ordinary save, not only Import's: a page whose profile
another tab or window has saved since (its progress or its answer history, `SEEN` and
`SEEN_LOG`, kept by every write through `store` and by `saveLog`) stops saving both and
shows a notice with a Reload button and a pointer to Export progress (`staleWarn`).
Before 2026-11-03 the older page's next save wrote its copy over the newer one, which
could undo an import. Import, Erase my history, Put back, Delete the copies and the
exam paper's saves have the same guard. A key that is gone is not another tab's save:
the core never deletes a profile's progress or history, so a missing key means the
browser's site data was cleared while the page was open, and the page's next save
writes its copy back (as before 2026-11-03); Import saves it back before it plans. A
page that has been stopped stays stopped until it is reloaded, also after a clear.

An answer is found by its question id and its time to the millisecond. Two copies are
the same answer only when every field agrees (result, choices picked, confidence, count
and the rest). Two copies under one key that differ are a **conflict**.

Matching or empty answer lists never show on their own that a file adds nothing (Louis,
2026-11-03): the concept progress, the pace and the scheduler's state can differ while
the answers agree. So Import compares every part of the file's progress with this
profile's (`addsTo`):
- each answer, field for field;
- each concept record;
- each FSRS card and comparison arm, and the answer count;
- the settings that come with the file (all but this device's own, `IMPORT_DEVICE`);
- any other part, such as one a feature module keeps.

Not compared: the shape's version, the record's origin `created` (used for continuation
below), and the FSRS step "I guessed" can undo and the flag that the cards were rebuilt
(`fsUndo`, `fsHistory`). Against the profile on screen, Import then does one of four
things:
- **nothing:** every part of the file's progress is here, field for field, and every
  history entry; or every part of it and every history entry is in another profile
  here (a file imported before into a profile of its own). When that profile's history
  lacks some of the file's entries, the plan is to add them there, and nothing else
  changes. An older file of this record changes nothing only in that
  case: when a concept it holds was answered again here, or its pace differs, its
  answers cannot show that it adds nothing, and it goes into a new profile;
- **history:** the same, but the file adds history entries; they are merged in, and the
  progress is unchanged;
- **replace:** this profile holds no progress (no answers, answer count, concept
  records, scheduler state or module part; settings alone are not progress) and its
  answer history holds nothing the file's lacks, or the file continues this profile's
  record: it has answers this device lacks, and all of these hold:
  - the file's record has the same origin (`created`) as this one;
  - this device's answer list is complete (its first answer is answer 1);
  - this device's answers are the file's first answers, field for field, in order;
  - every other part of this profile is in the file as it is here, except the concept
    records, FSRS cards and questions the file's further answers changed, and the
    settings, which come with the file. A part changed here without an answer (a
    module's record, such as equation-drill's) is not in a file made elsewhere;
- **separate:** anything else, for example:
  - answers on each side the other lacks;
  - a conflict;
  - a record of another origin;
  - an answer list here that the 4,000-answer limit has cut;
  - answers here that are not the file's first answers in order;
  - matching (or empty) answer lists with other concept progress, settings, scheduling
    state or module part;
  - a part of this profile changed without an answer that the file lacks;
  - a profile with no progress whose answer history holds entries the file lacks (as a
    put-back leaves), which would otherwise mix two records' histories.

  The file's progress goes into a new profile, named after the file's profile and the
  date, and this profile is unchanged.

Before it saves, the page shows the course, the file's profile and export date, the
answers and history entries in the file and on this device (with their dates), and what
Import would do and why. It saves only on Import; Cancel leaves everything as it was.

A replace first adds the progress it replaces to the copies Import keeps (a list under
`<ns>:backup:<profile>`, newest last). Import and Put back never delete a copy; "Delete
the copies kept by Import" in Settings does, only when asked and confirmed. The copies
are read from what the browser holds at that moment, not from this page's own copy of
the key, so copies another tab or window deleted are neither offered nor written back
here; Put back and "Delete the copies" also do nothing when the copies changed while
their question was open.

"Put back the progress from <date>" makes the newest copy the progress again, in three
writes ordered so that both records are in storage at every point:
1. the progress on screen is added to the copies;
2. the newest copy is written as the progress;
3. that copy is taken off the list.

The page says what happened at each refusal:
- step 1 refused: nothing changes;
- step 2 refused: the progress stays as it was, and the list is written back as it was;
  if that write is refused too, the list keeps the extra copy of the progress on screen;
- step 3 refused: that copy stays on the list as well, and the put-back stands.

With the progress come its pace and "Ask everything", because the file's review dates
were set with them. The equation drill's choice (`IMPORT_DEVICE`) stays this device's,
and no key outside the progress, the history and the copies is touched.

Nothing is replaced while the progress, or (for a file that adds to it) the history,
could not be read in this visit. Every Import write is `store.trySet`: when the browser
refuses it, nothing changes, not even the copy kept for the visit. A refused write of
the copies or the progress means nothing is imported. A refused history write leaves the
history stored and in memory as it was (it does not shrink), and importing the file
again adds the entries. A new profile whose history cannot be saved is not made. A
browser that stops between the writes leaves either the old progress, or the new
progress with the history not yet merged. Combining two records into one is a separate
proposal (`review/combined-progress-proposal.md`).

The Home Screen card appears only in Settings, as a section that starts closed (a
`<details>` whose `<summary>` is the card's one-line heading), and never on Topics
(Louis, 2026-11-01, after trying Medicinal-chemistry's preview on his phone; until then it
also showed on Topics until "Not now", whose `<ns>:homeTipDismissed` key is no longer
read). In Safari on iPhone and iPad the line reads "Keep your progress: add <short> to
your Home Screen" and opening it gives the steps export, Add to Home Screen, import, with
an Export progress button, because Safari deletes a site's data after 7 days without use
unless the site is on the Home Screen (webkit.org/tracking-prevention) and a Home Screen
copy keeps its own storage (WebKit bug 181849). A Home Screen copy with no progress gets
"Progress from Safari", which says how to bring it over; a browser with an install prompt
gets "Install <short>" with an Install button; any other browser sees no card.
`home_test.js` checks each of these, closed and opened.

## The scheduler

`course.js` `scheduler.model` picks it; the approved changes are
`review/scheduler-proposal.md` §4.1-§4.3 and §5 (Louis, 2026-11-01).

**`concept` (the default, and what an absent `scheduler` means).** Concepts, not single
questions, are scheduled. A miss puts the concept back in box 0; it returns after at
least 4 other questions (`GAP`), as a different question when it has one. A right answer
moves it up a box; the box sets the next review on two clocks, questions answered (cram
pace) and days (weekly and semester paces).

*Exam-date spacing* (§4.1.1). The proposal's figures (its reference 11, Cepeda et al.
2008): the best gap between reviews is about 20% to 40% of the time left at a 1-week test
delay and about 5% to 10% at a 1-year delay, and "if a gap must err, it errs longer".
**Design choice, not a source value:** the fraction is the top of each range, 0.40 when
the exam is 7 days or less away and 0.10 when it is 365 days or more away, interpolated
linearly in log(days left) between (`EXAM_GAP` in `shell.html`). For a concept in the
scope of an exam whose `when` is still ahead (any of its questions passes one of that
exam's pool filters), the next day-clock review is the earlier of the box interval and
max(1 day, fraction × days left); days left are counted in fractions of a day; with several
such exams the nearest one counts; an exam without a `when` is ignored. Nothing is reset
when the exam has passed: the box schedule continues. The question (cram) clock is not
changed.

*Confident-error check* (§4.1.2). Confidence used to be asked only after a right answer,
so a confident error could not be seen. The miss screen now has one optional button, "I
was sure of that", styled like "Not sure" and "I guessed" (a new screen element). Tapped,
it logs the confidence `sure` on that miss; the next question is a different question on
the same concept when the concept has one (from the pool on screen, else the bank; one
never shown first, else the one shown least recently; in a one-pass sweep it moves up the
queue), otherwise the GAP rule holds; and the concept carries a check (`check:{day}` in
its state) that only a right answer on a later calendar day than the error clears ("I
guessed" on that answer puts it back). While the check waits, the concept is due on every
later day whatever its box, and it ranks with the missed concepts (tier 4), still after
`GAP` other questions; that rank is a design choice.

*Calculation preset* (§4.1.3), `scheduler.preset:'calc'`. Two questions in a row never
share a `skill` when a question of another skill is eligible, and due questions from
earlier lectures stay in the mix: a quiz on part of the bank also draws the questions of
lectures listed before the latest lecture the pool covers, while their concept is due or
missed (never-seen or not-yet-due earlier material is not drawn in). Design choices that
make "stay in the mix" happen: with the preset a due review ranks with never-seen
material (tier 3) instead of below it, and that tier is drawn from evenly (keeping a
concept's unseen wordings when it has any) instead of from the top five; the question
after a confident error is one of another skill when the concept has one. One-pass
sweeps keep their shuffled order. Without the preset nothing changes: a seeded session
serves exactly what the `5014f27` core served (`scheduler_test.js`).

**`fsrs`** (§4.2): FSRS-7, one memory model per question, through the ts-fsrs library.

- *The library.* ts-fsrs 6.0.0 from npm (`npm view ts-fsrs` and `npm pack ts-fsrs@6.0.0`
  through the proxy, 2026-11-01; tarball shasum `900b2ff1b375cbebab098001b3c54dcaf9be4f5b`),
  its `dist/index.umd.js` copied unchanged to `vendor/ts-fsrs-6.0.0.umd.js` (198,410 bytes,
  sha256 `6ef23308221a59a524c18153e665480159bc4e26e9d437a70d9e1e912cc54554`). Licence:
  MIT (the package's own `LICENSE`, "Copyright (c) 2026 Open Spaced Repetition"). The
  bundle also contains `@open-spaced-repetition/srs-kit` 1.0.0 (BSD-3-Clause, its own
  `LICENSE` read from its npm tarball), helpers from `@oxc-project/runtime` 0.154.0 (MIT)
  and the rolldown runtime (MIT; `LICENSE` read from rolldown 1.2.16, the version that
  built the bundle is not recorded in it). All four licence texts are in `vendor/` and go
  into the page above the library. Inlined, library and licences are 203,801 bytes; the
  sample course's page was 436,181 bytes with them and 232,384 without when the scheduler
  went in (204,031 at `5014f27`; the rest of that growth is the scheduler code and its
  comments), and is 440,973 and 237,136 after the fixes of 2026-11-01's Medicinal-chemistry
  move. A course on the concept
  scheduler carries none of it.
- *FSRS-7 by default.* The package README: "`DefaultScheduler()` uses FSRS-7 when
  `version` is omitted"; its CHANGELOG for 6.0.0: "It defaults to FSRS-7". The bundle's
  own code agrees (`options.version ?? "FSRS-7"`), and the page's scheduler reports
  model `fsrs-7`. The page calls `DefaultScheduler()` with no options, so the library's
  default parameters and target retention apply; `scheduler_test.js` checks that the
  page's settings equal those of `DefaultScheduler()` run in node on the vendored file.
- *Same-day answers update the model* (§4.2.2). In the bundle, `review()` always runs
  the model's `step` on the card (the learning-step middleware changes only the next
  interval and the card's state), and with FSRS-7 the elapsed time is the fractional
  days since the last review (`fractionalDays: isFSRS7`). Every answer is a review,
  exam papers and sweeps included; `scheduler_test.js` shows a second right answer an
  hour later changing the memory state.
- *Grades* (the mapping of §4.3, used for both FSRS models): right, with or without
  "Not sure", is Good; a miss, or "I guessed", is Again ("I guessed" redoes that review
  as Again from the card before it, kept in `DB.fsUndo`). "I was sure of that" records
  the confidence only; the later-day check is the concept scheduler's.
- *Picking*: a due card first, lowest predicted recall first (the library's
  `forgettingCurve`); then a question never answered (one of up to five at random); with
  "Ask everything", the rest by lowest recall. A missed question returns when its card
  falls due (the library's relearning step). Cards are kept in `DB.fsrsQ` by question
  id, the library's own fields with its two dates as milliseconds. The box of each
  concept is still kept, for Weak spots and mastery. Settings says the course runs
  FSRS-7. Design choices: the order due, then new; the five-way random pick among new
  questions; a device clock set back behind a card's last review counts as the time of
  that review (the library rejects a negative elapsed time).
- *Checked against the library itself*: after each of 7 answers through the screen
  (right, right an hour later, wrong, next day, "I guessed", "Not sure", "I was sure of
  that"), the stored card equals the library's own review of the same sequence, run on
  its own in a blank Chromium page, and each logged predicted recall equals the
  library's. (Run in node instead, one field, `scheduledDays`, differs in the last digit:
  node's V8 and Chromium's round some results differently.)
- *Starting*: `DefaultScheduler()` returns a promise, which settles in the microtasks
  right after the page's script, before any tap; an answer made before that (only a
  check that runs the engine without waiting, such as `test.js`) waits for it, and its
  question counts as answered. If the library fails to start, the course runs the
  concept scheduler.
- *Older browsers*: the bundle calls `Object.hasOwn`, for which the page supplies a
  stand-in where it is missing, and it contains a BigInt literal (`0n`), so a browser
  without BigInt syntax cannot parse a page that carries it. WebKit is not installed
  here, so no FSRS page has been run in Safari (NOT RUN).
- *Fitting parameters to Louis's answers* (§4.2.3, §6) is not built; the page runs the
  defaults. Findings from the packages' own files (2026-11-01):
  `@open-spaced-repetition/binding` 0.6.0 (MIT) trains FSRS-7 by default ("'FSRS-7'
  (default) or 'FSRS-6'"), needs Node.js 24 or later (this container has Node 22), and
  in a browser runs as WASI in a Worker; its CHANGELOG says the threadless
  `binding-wasm32-wasip1` build "requires no COOP/COEP headers or shared memory, so
  static sites hosted on GitHub Pages can run training locally in a browser Worker"
  (that package is 1,565,023 bytes unpacked). Its training options (`modelVersion`,
  `cardIds`, `enableShortTerm`, `enableSchedPenalties`, `trainingConfig`) name no
  recency weighting. `fsrs-browser` 6.6.0 (BSD-3-Clause) "runs fsrs-rs in the browser
  with support for training FSRS parameters"; its README does not mention FSRS-7, and its
  `computeParameters` takes whole-day `delta_ts` with no model-version option, so FSRS-7
  support is not confirmed. Neither has been run here.

**`concept-fsrs`** (§4.3, off by default): a memory model per concept with the concept
scheduler's question rotation. Each concept keeps one FSRS-7 card (`DB.fsrsC`), stepped by
whichever of its questions is answered; the due concept with the lowest predicted recall
goes next, and within it the question seen least recently (one never shown first), so a
concept answered with "Not sure" comes back as a different question when it has one.
Grades: right left as "Knew it" = Good (pass); "Not sure" right = Good, and the
explanation stays on screen as after every answer; "I guessed" = Again (fail); wrong =
Again. Never-seen concepts come after due ones, as under `fsrs`.

*The comparison* (§5), `scheduler.compare`, on unless set to `false` (the combination
ships with it). Each concept is assigned at random to the combination or the default
concept scheduler: the top bit of the FNV-1a hash of `"<concept id>|<ns>"`, with `ns`
the course's own (`COURSE.ns`, also in a preview build), so the same on every visit and
device and in the preview (in `scheduler_test.js` on the template scratch course, all 2005
test ids get the same arm in a preview build as on the live page; hashed with the
preview's namespace, 1004 did)
(design choices: the top bit, because FNV-1a's lowest bit is only
the parity of the characters; the concept id first, because the top bit hardly depends on
the last characters hashed, so with `ns` last the ids `c1` to `c5` still split between the
arms); the first answer stores the assignment in `DB.arms`, and a
stored one is what counts from then on. In `scheduler_test.js` 1010 of 2000 test ids go
to the combination, and neighbouring ids (`concept-0`, `concept-1`, ...) change arm 981 times
in 1999. A concept on the concept arm gets everything of §4.1 (exam-date spacing, the
confident-error check, the calculation preset); one on the combination is scheduled by its
card. Every history entry carries the arm (fields 8 and 9). Both arms get the same review
budget, counted in questions as in the classroom study §5 cites (matched for number of
review trials, `review/research-notes/scheduler-2026-11-01.md` Finding 1.6): within one
session (the drill's own "This session", answers with no gap longer than `SESSION_GAP`),
the arm with fewer quiz answers picks the next question, a tie is drawn at random, and an
arm with nothing to ask leaves the turn to the other, so the arm decides scheduling only,
not how many questions a session shows. In `scheduler_test.js` a 30-question session in
which both arms can ask splits 15 and 15.

*No "I know this, skip it" control* (§4.1.4; its reference 15: letting learners drop
cards they thought they knew had small but consistent negative effects). The core has
none; `scheduler_test.js` reads every control on 24 screens (Topics, a question before
and after right and wrong answers and each confidence button, Weak spots, the exam page
and a paper, Settings) and fails if one offers to skip a question or mark it known.

As coded, the concept scheduler ranks never-seen material (tier 3) above due reviews
(tier 2); the rule list in `shell.html` said "wrong > due > never-seen". The list now says
so; the order itself is unchanged.

## Typed numbers

Without `course.js` `numeric` the engine reads a typed number by dropping every
character that is not part of a number (`parseNum` in `views.js`) and grades it within
the item's `tol`, or 1% of the key when it has none, as before. That reading joins two
numbers into one (`8 5` reads 85, `0.25 1/hr` reads 0.251) and refuses a unit with an
`e` in it (`64.96 inches` reads as no number). A course that sets `numeric` gets
`numeric.js` in its page, which reads and grades as Basic-Pharmacokinetics does
(`src/shell.html` lines 1236-1269 at `ac2eb73`): a number with its unit after it reads
as the number (`2.6 hr`, `188.2 (mg/L)hr`, `55%`, `0.17 hr-1`, `0.17 1/hr`); anything
else, a second number included, reads as no number; and with `numeric.margin` (a
fraction of the key) an item is right within max(`tol`, margin × |key|). PK's value is
`{margin: 0.02}`, from her Canvas quizzes' 2% and 3% margins. The verdict line names
the margin an answer was graded to. `numeric_test.js` checks it.

On PK's 534 numeric items (its `QUESTIONS` at `ac2eb73`), each typed eight ways and
graded by PK's own `gradeNumeric`, by this core without the option, and with
`numeric: {margin: 0.02}` (2026-11-01):

| Typed | Right in PK | Right in the core without `numeric` | Right with `numeric` | Without = PK | With = PK |
|---|---|---|---|---|---|
| the key | 534 | 534 | 534 | 534 | 534 |
| the key and its own unit | 534 | 519 | 534 | 519 | 534 |
| the key + 1.5% | 534 | 145 | 534 | 145 | 534 |
| the key + 2.5% | 63 | 63 | 63 | 534 | 534 |
| the key and ` 1/hr` | 534 | 400 | 534 | 400 | 534 |
| the key and ` hr-1` | 534 | 0 | 534 | 0 | 534 |
| the key and ` 5` (two numbers) | 0 | 382 | 0 | 152 | 534 |
| blank | 0 | 0 | 0 | 534 | 534 |

## Exam draw

Questions marked `dupOf` are wordings of one fact. A family is an original, everything
marked `dupOf` it, and chains of those; it is named by the id at the end of the chain
(Basic-Pharmacokinetics), so two siblings of one original block each other even when the
original is not drawn or not in the bank (Intro-Pharmacology). One blocked set runs through
every pool of a paper (Medicinal-chemistry `ed38dbd`), because a family can span pools;
the draw by announced counts (`exams[].blueprint`) uses the same rule.

**Calculations on a paper.** The draw keeps numeric and matching items off every paper
(`!q.type` in `drawPaper` and `drawBlueprint`), so a course whose exam asks
calculations could not practise them under the clock (Basic-Pharmacokinetics' Exam 3
was 20 multiple choice and 20 fill in the blank: its `course.js` at `ac2eb73`). An exam
with `typed: true` puts `exam_typed.js` into the page; that exam's papers then draw
numeric and matching items by the same rules as every other item (pools, one per
concept first, one wording per `dupOf` family, the select-all count): the engine's own
draw runs, with those items' `type` set aside while it runs and put back after it, so a
later fix to the draw applies to them too. On the paper a calculation is typed and a
matching item is picked row by row; both are kept through a reload, graded as in the
quiz (with `numeric`, to the course's margin), recorded on submit with what was typed
and picked, and shown on the result page with the answer, the margin and the working or
the pairs. Without `typed` the papers are as before. `exam_typed_test.js` checks it.

**A count, marks or time limit not set.** `skill/SKILL.md` allows `questions: null` and
`minutes: null` on an exam and `marks: null` on a pool (a missing field counts the same). Until `nullexam.js` such a
course drew a paper of 0 questions and stopped with a TypeError in `renderExamQ`, Topics
said "null questions", and Weak spots said "null of null marks" (BDK move assessment,
2026-11-01, §4). The build puts `nullexam.js` into the page only when the active exam
leaves one of them unset. Without a count the Exam tab says "The number of questions on
<exam> is not set in the course manifest, so no practice paper is drawn.", `beginExam`
starts none, `drawPaper` returns none, and Topics and the Weak spots pool cards leave the
count out; a paper saved earlier still comes back. A pool without marks makes the whole
exam unweighted, also when other pools have marks (Louis, 2026-11-01: "when any section
lacks points, use unweighted behavior consistently"): every question weighs 0 in
`markWeight`, so the topic table and the kinds of question are ordered by accuracy; a
paper with a count is drawn from all the pools together (the engine's draw with the
pools taken as one); the Weighting chips, the pool cards' marks, the "Marks at risk"
columns and the exam-weighted pass are left out; and "Where you are losing marks" is
headed "Accuracy by topic". Before this, with some pools' marks set, the table kept the
engine's marks-at-risk order under that heading, so a topic answered 9 of 10 right was
listed above one answered 2 of 10. A count with no time limit gives an untimed paper
(Louis, 2026-11-01): the opening page says no time limit is set in the course manifest;
the paper has no countdown, its clock counts the time taken up, and it ends only when it
is submitted, after which the result gives the time taken. The paper saved for a reload
is the engine's (`ids`, `picks`, `orders`, `i`, `ends`) with `ends: null` and one more
field, `started`, so a reload brings it back with the time still counting; a timed paper
is saved exactly as before. No time limit is made up. A paper keeps the timing it started
with: the engine itself (`views.js`, `untimedPaper`) saves, brings back, times and reports
an untimed paper, so when the course later gains a time limit and `nullexam.js` leaves the
page, a paper in progress still comes back untimed with its answers, its place and the
time taken, and only a paper started after that counts down. Before this, the engine read
`ends: null` as a deadline already past and submitted the paper on the next visit. Before this, the engine's clock
read `null` minutes as 0 and ended the paper at its first one-second tick, with every
item blank. As with a timed paper, the result is not kept after a reload.
With every number set the page differs from the `7a6e81b` core's only by those lines of
`views.js` (26 added, 4 removed: 249,541 against 248,119 bytes for the template course,
7,210,227 against 7,208,805 for Medicinal-chemistry's live course at `d7331be`, build
stamps aside), and a timed paper behaves as before (`browser_test.js`,
`startup_test.js`, `history_test.js`, and the timed-save checks of `nullexam_test.js`). `nullexam_test.js` checks the five cases on scratch
copies of any course. On the template course 34 of its 55 checks fail on the `7a6e81b`
core, 11 of its 60 on `d0f9223` (before the mixed-marks and time-limit corrections, all 11
in those two cases) and 3 of its 66 on `04dd3f6` (before a paper kept its own timing: the
paper in progress was submitted once the course gained a time limit); on this core 76
pass and 1 is skipped (the Weighting chips: no pool of the template filters by tier).

## Checks

    cd src && ./run_checks.sh            # build, then every check
    ./run_checks.sh test.js browser_test.js

`run_checks.sh` runs the build and then each check separately, so one failure cannot
hide another, and prints one line per check with the check's own summary. Besides the
checks every course runs, it runs the checks of what the course switches on, as
`build.py --list-checks` names them: `features_test.js` and each module's own test when
a feature module is on, `numeric_test.js` with `course.js` `numeric`, and
`exam_typed_test.js` with an exam's `typed: true`. A course that switches none of them
on runs the same checks as before. The kit's own checks of a core change run on the
template course and on a scratch course with every module and option on.

**On GitHub.** `.github/workflows/checks.yml` runs on every kit pull request and every
push to `main`. `ci_course.sh <course> [browser]` builds a scratch course from the kit
and runs `run_checks.sh` on it, in Chromium for `template`, `template-unset` (the
exam's question count and the pools' marks unset) and `medicinal-chemistry` (its live
repository with this core copied in), and in WebKit, Safari's engine, for `template`.
`ci_course.sh module:<name>` and `modules:<a>,<b>` build the template with feature
modules switched on by their own `features/<name>/ci/oncourse.js` (the modules they
`needs` first; `features/README.md`, "Checked on a course of its own"); the workflow runs
one such course for each module a pull request changes, each module that needs it, and
the combinations in `features/ci-combinations.txt` (`.github/ci_plan.js`), in Chromium
(job "modules") and in WebKit (job "modules-webkit", since #42). On a module course
`ci_course.sh` also fails unless each module switched on has its own test
(`features/<name>/test.js`) PASS with at least one passed check printed after the line
`  browser  <name> started` that `check_lib.js`'s `launch` prints once the run's browser
has started: a module test that finished before starting its browser, or passed nothing
after it, does not count as run there.
`DRILL_BROWSER=webkit` makes `check_lib.js` start WebKit instead of Chromium. A run fails
on any NOT RUN that is not a documented exclusion with its documented reason, so a
missing Playwright, a browser that did not start or a missing pdfplumber fails it rather
than passing on NOT RUN lines. The exclusions, listed at the top of `ci_course.sh`:
`cite_check.py` with "no lecture PDFs found" on every course (the decks are kept in
Louis's Drive, never in a repository), and `stepper_test.js` with "no step-through
figures" on Medicinal-chemistry. Every job blocks a merge, the WebKit job too (Louis,
2026-11-02; held until the WebKit failures of `offline_test.js` were diagnosed and fixed in
kit pull request #33, and repeated WebKit runs on `main` passed). WebKit on the runner is
not the Safari app on an iPhone or iPad, so a device check stays a separate step, done by
hand before BDK goes live. No branch protection is set up, so GitHub enforces no required
check; kit sessions read the results and merge only when every applicable job concluded
"success" on the final head commit (`KIT_DESIGN.md` §12 decision 10 defines which jobs
apply: a module job the plan intentionally did not select does not).

| Line | Exit code of the check | Meaning |
|---|---|---|
| `PASS` | 0 | ran and found nothing wrong |
| `FAIL` | 1 | ran and found a fault (a check that crashes or times out is a FAIL too) |
| `NOT RUN` | 2 | could not run here, with the reason (no built page, no decks, no Playwright); never counted as a pass |
| `REPORT` | 0, last line `REPORT:` | a report with no failing condition (`explain_check.js`) |

It exits 1 when the build or any check fails and 0 otherwise; the full output of every
check is kept in the log folder it names. A check that found nothing to look at reports
NOT RUN, not PASS. The browser checks use Node Playwright with Chromium (in a cloud
session: `NODE_PATH=$(npm root -g)`, browsers in `/opt/pw-browsers`; nothing installs
browsers). WebKit is not installed in the cloud container, so no check here runs Safari
(mobile Safari is NOT RUN); `home_test.js` uses Playwright's iPhone 13 profile, which is
Chromium with an iPhone screen and user agent. The checks open a built page over HTTP
from 127.0.0.1 (`check_lib.js` `pageUrl`, `openFile`, `openPage`), as a student opens the
hosted copy, not from disk: from disk WebKit gives the page the origin "null" and refuses
its manifest on the console. Service workers are blocked in those browser contexts, as a
page opened from disk has none; the worker's own checks serve the site with `serve()`, and
`offline_test.js` still opens the page from disk once (`openFromDisk`) to check that it
works so. `device_lint.js` catches the Safari fault
the brief names (regex lookbehind, `review/findings.md` §6.5) by reading the sources and
the built page.

## Not in core yet

- Fitting FSRS parameters to the student's answers (`review/scheduler-proposal.md`
  §4.2.3); the rest of §4.1-§4.3 and §5 is in, on default parameters. See "The scheduler".
- Intro-Pharmacology's exam-result page coming back after a reload, and its generator
  step in the build (`gen_*.py`), both named in `review/proposed-core.md` §5-§6.
- `coverage_check.py`, `step_check.js` and `sources_check.js` from the drills.
- WebKit on the module courses (their jobs run in Chromium; the template runs in WebKit),
  and the Safari app on an iPhone or iPad, which no check here runs.
