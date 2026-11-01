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
| `build.py` | core | assembles the page from the shell, the course files and the views, and writes it to the repository root |
| `built_page.js` | core | the one place every check takes the built page's location from |
| `check_lib.js` | core | what the newer checks share: summary line and exit code, Playwright loading, a test server |
| `output_test.js` | core | the build writes to the repository root and the checks read from there |
| `test.js`, `style_check.js`, `render_test.js`, `explain_check.js`, `stepper_test.js` | core | checks that run on any course's built page |
| `cite_check.py` | core | citation check; its course-specific tables at the top start empty |
| `browser_test.js` | core | browser smoke test (Node Playwright port of the template's `browser_test.py`, which stays in `history/`) |
| `device_lint.js` | core | fails on syntax older Safari rejects (regex lookbehind) in anything that ships |
| `run_checks.sh` | core | builds, then runs every check on its own, one line per check |
| `checks_test.js` | core | the checks' own exit codes, the device lint and `run_checks.sh` |
| `storage_test.js` | core | progress when the browser refuses to save |
| `draw_test.js` | core | no exam paper carries two wordings of one fact, across pools too |
| `harvest.py`, `harvest_mask.py`, `ingest.py` | core | tools for adding a lecture; `harvest_mask.py` keeps a course-specific table at the top, empty in the kit |
| `STEPPERS.md` | core | the rules step-through figures are written to |
| `course.js` | template | the course manifest: names, `ns`, lectures, exams, skills, pace |
| `q1_topics.js` | template | `TOPICS` and the first question file (samples to replace) |
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

No file name appears in both folders except `README.md`, so the copy order does not
matter for any other file.

## What the build writes

`python3 src/build.py` writes into the repository root, which is what GitHub Pages
serves:

| File | What it is |
|---|---|
| `index.html` | the app; the site root opens it |
| `.nojekyll` | stops Pages running Jekyll, which drops files whose names start with `_` |
| the `output` name in `course.js` | a redirect to `index.html`, so old links keep working |

Each file is written through a `.tmp` file and renamed, so a failed build leaves the
last good file in place. Nothing is written outside the repository. Every check reads
the page through `built_page.js`; `DRILL_PAGE=<file>` points them all at another page.

## Storage

Everything the page keeps goes through `store` in `shell.html` (Intro-Pharmacology's,
`exam1-drill/src/app.js`): keys are `<ns>:<what>`, progress is `<ns>:data:<profile>`,
and `ns` comes from `course.js` and never changes during a course. When the browser
refuses a write (quota full, private window, blocked site data), that key is served
from memory for the rest of the visit, and the first refusal shows one notice that
points to Settings → Export progress. A later write that succeeds clears the key's
failure. Switching profile writes any save still waiting on its timer first.

## Exam draw

Questions marked `dupOf` are wordings of one fact. A family is an original, everything
marked `dupOf` it, and chains of those; it is named by the id at the end of the chain
(Basic-Pharmacokinetics), so two siblings of one original block each other even when the
original is not drawn or not in the bank (Intro-Pharmacology). One blocked set runs through
every pool of a paper (Medicinal-chemistry `ed38dbd`), because a family can span pools;
the draw by announced counts (`exams[].blueprint`) uses the same rule.

## Checks

    cd src && ./run_checks.sh            # build, then every check
    ./run_checks.sh test.js browser_test.js

`run_checks.sh` runs the build and then each check separately, so one failure cannot
hide another, and prints one line per check with the check's own summary:

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
browsers). WebKit is not installed in the cloud container, so no check here runs Safari;
`device_lint.js` catches the one Safari fault on record (regex lookbehind, `review/findings.md` §6.5)
by reading the sources and the built page.
