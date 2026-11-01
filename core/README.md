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
| `update_test.js` | core | a newer version is offered; a reload comes back to the same place |
| `sw.js` | core | the service worker; `build.py` fills in the course's cache prefix and file list and writes it to the root |
| `offline_test.js` | core | the offline copy: other sites' caches kept, server down, server slow |
| `home_test.js` | core | the Home Screen card for each kind of browser |
| `history_test.js` | core | the answer history: its fields, Export, Import, Erase, a refused write |
| `scheduler_test.js` | core | the scheduler (`review/scheduler-proposal.md` §4-§5), with a fixed clock, on scratch builds with a test topic |
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
| `version.json` | `{"built": "<UTC time of the build>"}`, the same value as `BUILD.built` in the page |
| `sw.js` | the service worker, from `src/sw.js` with the course's cache prefix and file list filled in |
| `manifest.json` | the web manifest: `title` and `short` from `course.js`, start page `index.html` |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | copied from `src/icons/` when the course supplies them; otherwise a plain square in the accent colour, and the build says so |

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

## Offline

`sw.js` is Medicinal-chemistry's service worker (`ed38dbd`) made course-agnostic. The page
is fetched network-first; the saved copy is used when the network is down or slower than
3500 ms (`NET_TIMEOUT`), and when the network copy then turns out to differ the page offers
a reload, never forcing one. The worker is registered only on https, `localhost` or
`127.0.0.1`. Caches
are named `<ns>-v<n>`, and cleanup deletes only names of exactly that form, because every
drill on `lglouis3-create.github.io` shares one origin and one Cache Storage: another
course's offline copy is never touched, including one whose `ns` starts with this course's.
A course that already has a worker under another prefix (Medicinal-chemistry's is
`phar4342-drill-`, its `ns` is `phar4342final`) leaves that old cache behind when it moves
onto the core; Mode 7 deletes it once.

## A newer version, and the place after a reload

An open page reads `version.json` every 15 minutes and when its tab comes back; when a
newer build is published it shows a bar with Reload (Basic-Pharmacokinetics). Reload, the
browser's own reload, and a phone dropping a background tab all come back to the same tab,
the same open sections, the same question (answered or not, with nothing recorded twice)
and the same line at the top of the screen. The place is kept in `sessionStorage` under
`<ns>:place`, so it belongs to one browser tab. A running exam paper comes back first, as
before.

## Answer history and the Home Screen card

Both are ported from BDK (`assets/app.js`). Every answer adds an entry to an answer
history kept under `<ns>:log:<profile>`, apart from the progress:

    [time in seconds, question code, 1 right / 0 wrong, mode, concept, confidence, item type]

The question code is an FNV-1a hash of the question id (8 hex digits); mode is `quiz`,
`sweep` or `exam`; confidence is `knew` (a right answer left as it is: the screen says
Next counts as "Knew it"), `unsure` ("Not sure"), `guessed` ("I guessed"), `sure` ("I
was sure of that" on a miss), or empty where none was given (a miss left as it was, an
exam paper); item type is `mc`, `multi`, `numeric` or
`match`. Export progress writes the progress and the history into one file; Import
progress replaces the progress, as before, and merges the history without duplicating
an answer; Erase my history clears both. When the browser refuses to save the history,
the oldest half is dropped and no notice is shown, so the history never stops progress
from saving. The scheduler does not read the history yet; it is there for the approved
scheduler work (`review/scheduler-proposal.md` §4-§5), which is a later step.

The Home Screen card appears on Topics (until "Not now") and in Settings. In Safari on
iPhone and iPad it gives the steps export, Add to Home Screen, import, because Safari
deletes a site's data after 7 days without use unless the site is on the Home Screen
(webkit.org/tracking-prevention) and a Home Screen copy keeps its own storage (WebKit bug
181849). A Home Screen copy with no progress says how to bring it over; a browser with an
install prompt gets an Install button; any other browser sees no card.

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
browsers). WebKit is not installed in the cloud container, so no check here runs Safari
(mobile Safari is NOT RUN); `home_test.js` uses Playwright's iPhone 13 profile, which is
Chromium with an iPhone screen and user agent. `device_lint.js` catches the Safari fault
the brief names (regex lookbehind, `review/findings.md` §6.5) by reading the sources and
the built page.

## Not in core yet

- The rest of the approved scheduler changes (`review/scheduler-proposal.md` §4.1.3-§4.3);
  exam-date spacing (§4.1.1) and the confident-error check (§4.1.2) are in.
- Intro-Pharmacology's exam-result page coming back after a reload, and its generator
  step in the build (`gen_*.py`), both named in `review/proposed-core.md` §5-§6.
- The check that a course's `CLAUDE.md` was updated after its newest lecture (§7 there),
  `coverage_check.py`, `step_check.js` and `sources_check.js` from the drills.
- A WebKit run of the browser checks.
