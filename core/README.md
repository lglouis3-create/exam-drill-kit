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
| `vendor/` | core | ts-fsrs 6.0.0's own UMD bundle and the licence texts of the code in it; `build.py` inlines them only for a course whose scheduler model needs FSRS |
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
    cp -r core/vendor COURSE_REPO/src/

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

For a course whose `scheduler.model` is `fsrs` or `concept-fsrs`, `index.html` also
carries `vendor/ts-fsrs-6.0.0.umd.js`, with the licence texts above it; for `concept` it
carries no library. Any other model name stops the build. Each file is written through a
`.tmp` file and renamed, so a failed build leaves the last good file in place. Nothing is written outside the repository. Every check reads
the page through `built_page.js`; `DRILL_PAGE=<file>` points them all at another page.

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
the progress and the history into one file; Import progress replaces the progress, as
before, and merges the history without duplicating an answer (an entry here in the older
seven-field format gains the last three from an imported copy of the same answer); Erase
my history clears both. When the browser refuses to save the history, the oldest half is
dropped and no notice is shown, so the history never stops progress from saving. No
scheduler reads the history; the progress (`DB`) holds what they schedule from.

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
  sample course's page grows from 225,031 to 428,828 bytes. A course on the concept
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
concept scheduler: the top bit of the FNV-1a hash of `"<concept id>|<ns>"`, so the same
on every visit and device (design choices: the top bit, because FNV-1a's lowest bit is only
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

- Fitting FSRS parameters to the student's answers (`review/scheduler-proposal.md`
  §4.2.3); the rest of §4.1-§4.3 and §5 is in, on default parameters. See "The scheduler".
- Intro-Pharmacology's exam-result page coming back after a reload, and its generator
  step in the build (`gen_*.py`), both named in `review/proposed-core.md` §5-§6.
- The check that a course's `CLAUDE.md` was updated after its newest lecture (§7 there),
  `coverage_check.py`, `step_check.js` and `sources_check.js` from the drills.
- A WebKit run of the browser checks.
