# Worksheet ink in IndexedDB: scope, guarantees, timing, device validation

Louis, 2026-11-08: "Storage decision: use IndexedDB for worksheet ink. I choose the IndexedDB
approach instead of imposing the proposed ink limit. [...] I authorize developing and testing the
implementation in a PR." The implementation is in `core/shell.html` ("PARTS OF THE PROGRESS KEPT IN
INDEXEDDB"), described in `core/README.md` ("A module part kept in IndexedDB") and checked by
`core/outside_test.js`. No course switches it on: it acts only for a module that calls
`registerOutside(part)`, and worksheets-ink (#17) is not merged.

## 1. Scope: only the module part moves

What fills the storage, from the code and #66's measurements:
- The core's own progress is bounded. `record()` keeps at most `ANSWERS_MAX` answers (4,000;
  `core/shell.html`), so a profile at both caps is 546,993 characters
  (`review/storage-usage-proposal.md` §1, its table; this session's `timing-idb.log` gives
  `"chars":546993` for 5,000 answers recorded on Medicinal-chemistry with this core).
- equation-drill's `DB.eq` holds one record per equation of the course
  (`features/equation-drill/current/equation-drill.js` lines 308-313): bounded by the course's
  equations.
- worksheets-ink's `DB.ink` (#17, `features/worksheets-ink/current/worksheets-ink.js` line 369 and
  417 at eebc3c7) holds every stroke of every page, with no upper bound. In #66's runs of today's
  storage the per-tab record was refused in 5 of 5 saves of each run at the generated samples of
  3,906,236 and 4,453,234 characters, and none at 2,604,462 (`review/records-storage/logs/latency-large.log`
  on #66, mode A, `refused.record`).

So only a module part with no upper bound needs to move, and the progress, the answer history,
the per-tab records, the copies Import keeps and the writer lock stay in localStorage as they are.
Moving everything would change every save path, Import and recovery at once, with no measured
need. The layer is general (any module can register a part) but only worksheets-ink needs it.

What replaces each place that holds ink inline today (the porter's list for #17):

| Today (#17 at eebc3c7) | With this layer |
|---|---|
| the stored progress `<ns>:data:<profile>` holds `ink` | holds no `ink`; each page is a database record |
| the per-tab record (#69) holds `db.ink`, so a closed tab's last ink save is kept | holds no `ink`. A page's database record replaces it: it is written with a revision, and no tab writes over a revision it did not read (it merges), so a closed tab's last committed page cannot be written over unseen |
| Export's `db.ink` | the same `db.ink`, read from the database before the file is made |
| Import of a file with `db.ink` | the same file; its pages go to the database (this profile: merged with the stored pages; a new profile: written for it) |
| the copies Import and "Use it here" keep (`<ns>:backup:<profile>`) | hold no `ink`; Put back leaves the stored pages as they are (it restores the rest) |
| a refused write: #17 puts back the last saved ink and saves again | the page's state is `refused`; the progress's own write is not affected; the core's notice offers Export; the next save tries again |

## 2. Migration, mixed versions, failures

- A page an earlier core kept inside the stored progress stays there until its copy in the database
  is written and then read back equal (`OUT.inline`, `outsideReadBack`). Only the next progress save
  after that leaves it out. A stop at any point leaves the page in localStorage; the next load moves
  it again; a page found in both places is merged (every stroke kept once).
- A tab on an earlier core does not see moved pages, and writes the pages it changes inside the
  progress. The next load on this core merges them into the database. A merge can bring back a
  stroke one tab erased while the other still had it; it never loses one.
- No database (it cannot be opened, or does not open within 5 s): every page stays inside the
  stored progress, as before this layer.
- The database refuses a write: state `refused`, never `saved`; a notice with Export; the page asks
  before it is left; each later save tries again.

## 3. What is guaranteed when the page goes away

- After a page's transaction completed (`outsideState` 'saved'): kept, through a reload, a crash or
  a phone ending the page.
- A change whose transaction had not completed: lost by a crash or by a phone ending the page. The
  write starts when the module calls `save()` (it does not wait for the progress's 150 ms timer),
  so that window is the transaction's own time (§4).
- A reload right after a change: `outside_test.js` "closing" prints whether the change was kept. In
  Chromium it printed "not kept" while the write waited for the progress's 150 ms timer, and "kept"
  in each of the 3 runs read after the write was moved into `save()` (this session). It is reported,
  not required: it depends on the browser finishing a transaction started as the page unloads.
- Nothing depends on a final write at close: `saveNow()` on `pagehide` and on a hidden page still
  runs, as before.

## 4. Timing (Chromium, supporting evidence only; not phone acceptance)

`timing.js` (run from a built Medicinal-chemistry course with this core, 479 questions; Chromium
153.0.8010.12; CPU throttling rates 1 and 4; 3 runs of 5 changes per sample and rate; after each
change 8 clicks 40 ms apart start at once). Logs: `logs/timing-idb.log` (the page with
`registerOutside('ink')`) and `logs/timing-baseline.log` (the same page with no part registered, so
the ink stays inside the stored progress, as #17 keeps it today). Definitions:
- **save (commit)**: from the `save()` call that follows a change to the page's IndexedDB transaction
  `complete` event (`outsideState` 'saved'). For the baseline, to the end of the progress write,
  which waits for `save()`'s 150 ms timer.
- **progress write**: the main-thread time of `saveProgress` (the progress written to localStorage
  and the per-tab record), as #66 measured it.
- **slowest click**: the largest Event Timing duration (input to the next paint) of the 40 clicks of
  a run; entries under 16 ms are not reported by the browser and count as under 16 ms.

Samples (generated, not Louis's data): "answers at both caps" is 5,000 answers recorded through
`record()`, 4,000 kept, 546,993 characters stored (`timing-idb.log`, `placed`); the ink samples are
#66's random-walk generator in #66's order, 69 pages (1,796,377 characters of `DB.ink`) and 171
pages (4,452,807 characters), each added to that profile.

| Sample, rate 4 | save (commit), medians of 3 runs; largest | progress write, medians; largest | slowest click, largest of 3 runs | long tasks, longest |
|---|---|---|---|---|
| answers at both caps | 19, 22, 17 ms; 26 ms | 54, 43, 49 ms; 64 ms | 80 ms | 68 ms |
| + ink 69 pages | 24, 20, 25 ms; 37 ms | 44, 46, 49 ms; 61 ms | 64 ms | 66 ms |
| + ink 171 pages | 19, 19, 22 ms; 30 ms | 41, 44, 43 ms; 75 ms | 96 ms | 79 ms |
| baseline: + ink 69 pages inside the progress | 497, 504, 484 ms; 554 ms | 260, 286, 278 ms; 332 ms | 344 ms | 335 ms |

At rate 1 every largest save (commit) with the layer was 22 ms or less and every slowest click 24
ms or less (`timing-idb.log`). The baseline was not run on the 171-page sample: in #66's runs today's per-tab
record was refused at 4,453,234 characters (§1). With the layer the stored progress stays 546,993
characters with either ink sample (`placed.progressChars`), because no ink is in it.

Against the provisional targets (median save 200 ms or less, slowest click 200 ms or less), on this
desktop CPU slowed 4 times: met by every sample with the layer, including the 171-page sample the
old storage could not hold; not met by the baseline at 69 pages (slowest click 344 ms). This is
supporting evidence only; phones decide (§6). No compression and no Worker were needed: the largest
save with the layer at rate 4 is 37 ms.


## 5. The click-delay measure without Event Timing

Event Timing is a measurement interface (the browser reports input-to-paint durations); the
delay itself happens in every browser. Can I use lists it as supported in Safari and Safari on iOS
from 26.2 and not before (checked live on 2026-11-08 by the independent review of #66; reference
[2] of `review/per-tab-record-storage-proposal.md`). So on an older Safari only the measurement is
missing.

The fallback, used by the device page when Event Timing is missing: for each tap, from the event's
`timeStamp` to the second `requestAnimationFrame` callback after it. The second callback runs at the
start of the frame after the one that shows the tap's result, so it cannot come before that frame
has been produced; the fallback is an upper estimate of the delay. In all 30 Chromium runs above the
fallback's largest value was at least Event Timing's largest (`timing-*.log`, `clickFallback.max`
against `clickEventTiming.max`), larger by 3 to 50 ms (the fallback's largest minus Event Timing's
largest, per run). So a fallback of 200 ms or less shows the click part met; a fallback above 200 ms
does not show it failed, and that phone's click part is reported as not decided and repeated on
Safari 26.2 or later.


## 6. Device validation

**Where to host the page.** The page must not share an origin with the drills. Every drill is on
`lglouis3-create.github.io`, one origin with one quota and one eviction decision: the storage-full
test fills that quota on purpose, and Safari removes an origin's data as a whole. So the page is not
put there, not even for the timing test alone. Two alternatives were checked:
- a claude.ai artifact: it is shown in a frame of another site, and WebKit says "Third-party
  LocalStorage and IndexedDB are partitioned per first-party website and also made ephemeral"
  (WebKit. Tracking Prevention in WebKit. Accessed November 8, 2026.
  https://webkit.org/tracking-prevention/). Ephemeral storage cannot test what survives a reload or
  a full disk, so it is not representative;
- a GitHub Pages site of a separate free organization: its own origin, `<organization>.github.io`.
  "GitHub Pages is available in public repositories with GitHub Free and GitHub Free for
  organizations", and a project site is at `http(s)://<owner>.github.io/<repositoryname>` (GitHub
  Docs. What is GitHub Pages? Accessed November 8, 2026.
  https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages).
  This is the recommendation.

**Setup Louis does once** (nothing else on the account changes):
1. On github.com: your profile picture → Your organizations → New organization → Free. Name it, for
   example, `lglouis3-lab`.
2. In that organization, create a public repository named `ink-validation`.
3. Settings → GitHub Apps (or https://github.com/apps/claude/installations/select_target): install
   the Claude app on that organization, for that repository only.
4. Tell the kit session the organization's name. The session then pushes `index.html` (built by
   `make_device_page.js` from the PR's exact head) and a `README` naming that commit.
5. In the repository: Settings → Pages → Build and deployment → Deploy from a branch → `main`,
   folder `/ (root)` → Save. The page is then at `https://<organization>.github.io/ink-validation/`.

The page is the template course built with this PR's core, with the storage namespace
`ink-validation` and a panel at the bottom. Everything it writes is generated; "Clean up" removes it.

**On each device** (an iPhone or iPad in Safari, and an Android phone in Chrome), one sample at a time:
1. Open the page. Note the line at the top of the panel (browser, Event Timing yes or no, database).
2. Press "1. Answers at both caps". Wait for "prepared".
3. Press "Run 3 rounds of 5 saves". After each "tap the blue button now", tap the blue button about
   8 times in 2 seconds. The run takes about 45 seconds.
4. Reload the page, press "Check after reload": the pages and strokes must all be there.
5. Repeat 2-4 with "2. + ink, 69 pages", then "3. + ink, 171 pages".
6. Press "Copy results" and paste the text to the kit session.
7. Only on this separate site: press "Storage-full test" (it asks first), wait until it says the
   browser refused a write, reload, press "Check after reload", then "Copy results" again.
8. Press "Clean up".

Accept (provisional targets): for each sample and phone, the median save (commit) is 200 ms or
less in each of the 3 rounds, and the slowest tap is 200 ms or less (Event Timing; without it, the
fallback of §5); every check after a reload shows every page; the storage-full test reports
`refused`, shows the notice, and the pages saved before it are there after the reload. A phone that
fails a part is reported with its numbers; nothing is decided on the desktop results alone.

