# The per-tab record's storage cost: measurements and a proposal (2026-11-06; revised 2026-11-08)

Louis asked on 2026-11-06 for a measured proposal on the storage the per-tab record takes. He
asked for it to reuse the Kit feature porter's evidence and to reproduce the refused Import
independently. He also asked for a comparison of alternatives and one recommendation. He
authorized investigation and a proposal only, so nothing on `main` or in any course changes,
and the existing protection stays as it is.

## Recommendation (2026-11-08)

Approval: awaiting Louis. Nothing in `core/`, in production storage or in any course changes
under this recommendation.

Louis asked on 2026-11-08 for one storage approach, a measurable save-time target, the
preservation and recovery guarantees, and the smallest useful validation plan, from the
measurements already made, before any production storage change.

**The approach: keep today's full copy (A) unchanged, and adopt neither compression in the page
(F, T) nor compression in a Worker (W).**
- A meets the proposed target in Chromium at CPU rate 4 on the measured sample of the progress
  courses hold today, which have no module on. A generated profile at the core's 4,000-answer
  cap holds 526,734 characters of progress (`logs/compress-timing.log`; 526,751 in the page, with the harness's
  probe setting). Its slowest click during saves was 32 ms at rate 4 and 32 ms at rate 6
  (`logs/latency-measure.log`). `review/storage-usage-proposal.md` gives 546,993 characters for a
  profile's progress at both caps; that size was not timed.
- T, the compressed record written only when three full copies would not fit, fails the target
  at every size where it compresses: at rate 4 a save took 589 to 1,616 ms and a click waited
  632 to 1,800 ms for its next paint (`logs/latency-large.log`).
- W cannot be measured on a slowed CPU, because Chromium refuses CPU throttling for a Worker
  (`logs/worker-throttle-probe.log`). On the ink samples it left the record one save behind
  for 125 to 176 ms after each save at rate 1, which reopens the close-without-handover case
  that kit #30's A1 fixed.
- Only worksheets-ink (#17) makes progress large enough to reach A's limits. Before any course
  switches worksheets-ink on, Louis decides between G (IndexedDB, kit #49 and #54) and a size
  limit on ink progress. A's measured candidate for such a limit is about 1,747,620 characters,
  the size at which three full copies stop fitting in 5,242,859 (5,242,859 / 3 = 1,747,619.7,
  checked).

**The save-time target (proposed for Louis to accept).** During saves, the slowest click waits
200 ms or less for its next paint, and a save's own main-thread work has a median of 200 ms or
less, both measured:
- in Chromium at CPU rate 4, on the largest progress a course is expected to hold;
- on an iPhone or iPad in Safari and on an Android phone, on the same progress.

The 200 ms figure is web.dev's upper bound for good Interaction to Next Paint (INP), which
web.dev measures at the 75th percentile of page loads, segmented across mobile and desktop
devices.[1] INP is a site-wide field measure, so its use here as a limit for one save is a
proposal, not web.dev's rule. Measured against it in Chromium at rate 4:

| Progress (characters), A | A save, median ms | A slowest click, ms | Meets the target | Source |
|---|---|---|---|---|
| answers, 526,751 | 22 | 32 | yes | `logs/latency-measure.log` |
| ink, random walk, 1,563,721 | 127 | 120 | yes | `logs/latency-measure.log` |
| ink, random walk, 1,796,478 | 132-136 | 128-168 | yes | `logs/latency-large.log` |
| ink, random walk, 2,604,462 | 179-213 | 216 | no | `logs/latency-large.log` |

Ranges are over 3 runs; the first two rows are one run each.

**The preservation rule** (Louis, kit #69, merged as b0f5046): a stored save is never removed
until its replacement is stored and verified.

**Guarantees.** The recommendation is A as it is on `main`, so its column and today's are the
same; T is shown for comparison. Sizes assume an origin holding nothing else. Every drill shares
`lglouis3-create.github.io`, so on Louis's devices the room is smaller by what the other drills
and any `/preview/` copies store (`review/storage-usage-proposal.md`).

| Case | Recommended = today's full copy (A) | T, compressed above three copies (not recommended) |
|---|---|---|
| Quota failure | The record fits while two copies fit, up to about 2,621,430 characters of progress (5,242,859 / 2 = 2,621,429.5, checked). Above that the record write is refused; the notice says so, and the core removes only this tab's own record, once it has read back that the stored progress holds it (kit #47). In the steady-state runs of `logs/latency-large.log` the progress itself was stored after every save, up to 4,453,234 characters. | The record is about 0.173 of the progress (310,886 to 310,899 of 1,796,478 and 769,982 to 769,999 of 4,453,234 characters) and was stored at every size measured, up to 4,453,234. A refused record write is handled as in A. |
| Reload | The earlier page's record stays until the stored progress is shown to hold it, checked again at least 60 s later and unchanged in between. For about that minute three copies must fit: above about 1,747,620 characters the reloaded page's own record is refused, an Import of a second 1,475,679-character profile was refused (nothing stored changed), and at 2,621,000 the progress save itself was refused for up to about a minute, so closing the tab then lost the answers given since the reload (`logs/real-quota-*.log`, `logs/near-limit-2621000.log`). | The same rules; the minute holds about 1.346 copies (1 + 2 × 0.173 = 1.346, checked), so the reloaded page's record is refused above about 3,895,140 characters (5,242,859 / 1.346 = 3,895,140.4, checked). Not measured: a reload at these sizes under T. |
| Profile switch | One record per return to a profile, under a new key each time (Louis, 2026-11-05). | The same. |
| Cross-tab recovery | The next tab to hold the profile places each record by its last answer, as the progress or as a copy Import keeps; a module part the stored progress lacks is kept as a copy (kit #69); a record is removed only after the 60 s check. | The same rules, plus decompression checked against the record's length and hash; a record that fails is left in place. A tab on an older core skips a compressed record until a newer-core tab places it. |
| Close without handover | No window while the record fits: the progress and the record are written in the same synchronous step, and a save still waiting on its 150 ms timer is written on `pagehide` and `visibilitychange` (kit #30, A1). Above about 2,621,430 characters there is no record, so a save another tab later covers is lost. | No window either (the compression is synchronous), but that step blocks the page for 589 to 1,616 ms at rate 4. W, by contrast, left the record one save behind for 125 to 176 ms at rate 1 on the ink samples. |

**The smallest useful validation plan.**
1. **Devices:** one iPhone or iPad in Safari and one Android phone in Chrome, with the browser
   and system versions recorded.
2. **Page:** a scratch template course built from `main`, with a measuring script injected, on
   an origin other than `lglouis3-create.github.io`, so no drill's storage is touched. Where it
   is hosted is a question for Louis.
3. **Measurements**, each 3 runs of 5 saves:
   - the save's own main-thread time (`performance.now` around the synchronous save), median and
     maximum;
   - the slowest click-to-next-paint during saves, where the browser provides the Event Timing
     API (its support in Safari was not checked in this session);
   - the localStorage limit, with `quota_probe.js`'s method, once per browser, because the
     thresholds above come from Chromium's 5,242,859.
   - Samples: the 4,000-answer profile (526,734 characters) and the random-walk ink profile of
     1,796,478 characters.
4. **Accept or reject:**
   - **Accept A for the current courses** if, on both phones, the answers sample's median save is
     200 ms or less. No production change follows.
   - **Ink:** if the 1,796,478-character sample's median save is also 200 ms or less on both
     phones, a size limit near 1,747,620 characters (recomputed from that browser's measured
     limit) is a workable option for worksheets-ink beside G. If it exceeds 200 ms on either
     phone, worksheets-ink waits for G or another approved design.
   - **Reject A** if the answers sample exceeds 200 ms on either phone: a proposal to reduce the
     save's own work then comes to Louis before any change.

**NOT RUN** (details in "Not run" below): Safari on an iPhone or iPad, Android, WebKit page
latency, and Firefox; any timing on a real phone; a CPU-slowed Worker (refused by Chromium);
the localStorage limit and 15-bit counting outside Chromium; T or W inside the core; a reload or
two-tab run under T; whether an IndexedDB write started at `pagehide` completes.

## What the per-tab record is

Since kit #45, each save of a profile's progress also writes `<ns>:pending:<profile>:<tab>` =
`{at, db, log}`, where `db` is the progress this tab stored. No other tab writes that key, so a
save that another tab's write later covers is still on disk. The tab that next holds the profile
places it, as the progress or as a copy Import keeps. That tab removes the record only once what
is stored holds all of it, checked again at least 60 s later and unchanged in between
(`core/shell.html`, the comment above `pendingKey`). The `db` field is a full copy of the
progress.

## Measurements

All measurements are in Chromium (Playwright 1.63.0) on a scratch template course built from kit
`main` at `3ebde7e`. They use the browser's own localStorage limit, not a forced one. They are
also the limits for an origin holding nothing else. Every kit drill shares the origin
`lglouis3-create.github.io`, so on Louis's devices the room is smaller by whatever the other
drills store. The scripts are in `review/records-storage/` and the logs in its `logs/`. Figures
credited to "the review" come from the independent review of #66 (2026-11-06, of `dc68a31`),
whose own scripts were not committed.

**The limit.** One origin's localStorage took 5,242,859 characters (key and value) and refused
more (`logs/quota-probe.log`; the review measured the same).

**A progress of 1,475,679 characters**, made of two answers and a module part holding ink as
worksheets-ink does (`logs/real-quota-1475679.log`):

| When | Total stored | Times the progress |
|---|---|---|
| after the save | 2,951,873 | 2.00 |
| after a reload and one save, with the earlier page's record not yet removed | 4,428,443 | 3.00 |
| about 65 s after that save, once the earlier record was removed | 2,952,363 | 2.00 |

- **An Import of a second profile of the same size, in that minute, was refused.** The page
  said: "The browser refused to save (storage is full or blocked), so nothing was imported. Your
  progress is unchanged." The stored progress was unchanged.
- **The same Import after the earlier record was removed succeeded.** It stored 1,475,928
  characters as "Other (imported 2026-11-06)".
- The two records in that minute were 1,475,919 and 1,476,083 characters.
- The review reproduced these figures. Its total after the reload was 4,428,444, one character
  more, because its pending-seen entry was 162 characters, not 161.
- **The porter's figures** are on the evidence branch `evidence/records-storage`, commit
  `e3c40bc`, which is never to be merged. They match these measurements in kind.
  - `review/records-storage/logs/diag-records-new.log` at that commit:
    - after the bulk save, `data:me` was 1,475,679 characters and one per-tab record 1,475,714;
    - after a reload and one ink open and close, there were two records of 1,475,714 each;
    - 62 s later, one record was left.
  - The three keys after the reload add to 2 × 1,475,714 + 1,475,679 = 4,427,107 characters
    (checked). With the three small keys listed (2, 17 and 132 characters), the total is 4,427,258.
  - `worksheets-ink-modtest-new-1.log` and `worksheets-ink-modtest-r2-run2.log` at the same commit
    each report "2 per-tab records of this profile after the reload; 1 left after 61 s, before the
    Import", and then the Import succeeds.
  - Their refused Imports (lines 208 and 222 of the first log, 210 and 224 of the second) come from
    the module's separate "storage full (Chromium's own quota)" test, not from a reload minute.
- **Two limits on the porter's evidence** (`logs/README.md` at that commit):
  - no saved log shows the Import refused in the minute after a reload. The porter's test waits
    61 s before its Import, so every saved run shows the Import succeeding, and the refusal was
    reported but not logged;
  - the diag log carries no commit stamp. It ran on the module's save-path code during the
    worksheets-ink F1 work, before the port's final commit `0769d14`.
- The refused Import in the reload minute is therefore shown only by this pull request's
  `logs/real-quota-1475679.log` and by the review.

**Larger progress** (`logs/real-quota-2000000.log`, `logs/real-quota-3000000.log`):

| Progress | After the save | After a reload and one save |
|---|---|---|
| 2,000,000 | 4,000,515 (2.00 times): record kept | the reloaded page's own record was refused, and the core marks the record off and says so; only the earlier page's record remains |
| 3,000,000 | 3,000,275 (1.00 times): the record was refused; the progress saved | the same: no record |

The arithmetic:
- the record fits while twice the progress fits: 5,242,859 / 2 = 2,621,430 characters of
  progress (checked);
- in the minute after a reload, three copies must fit: 5,242,859 / 3 = 1,747,620 characters
  (checked).
- The review measured each limit from both sides. Three copies fit at 1,747,000, and the
  reloaded page's record was refused at 1,748,500. The record was kept at 2,621,000 and absent at 2,622,000. The true limits
  are a few hundred characters lower, because of the record's wrapper (about 240 characters) and
  the other keys.

### The progress save itself refused, just below the record's limit

At 2,621,000 characters of progress, with two answers before a reload and one after it, the
**progress save** was refused, not only the record. `data:me` kept its size from before the
reload, 2,621,023 characters (`logs/real-quota-2621000.log`, `failed: ["…:data:me"]`). The
steady state there was 5,242,515 characters, which left 344 characters of room
(5,242,859 − 5,242,515 = 344, checked). The answer, which added about 250 characters, and the new
pending-seen entry of 161 characters did not fit. At 2,620,000 the progress saved and only the
reloaded page's record was refused (`logs/real-quota-2620000.log`, `recOff: true`).

`near_limit.js` followed the 2,621,000 case for two minutes, answering once every 10 s
(`logs/near-limit-2621000.log`):
- From the first answer after the reload, the page held more answers than storage, which kept 2.
  Ten seconds later the answer history was refused as well.
- After the first answer the notice read: "This browser did not save your progress (storage is
  full or blocked). It is kept on this page until you close or reload it; closing or reloading
  it loses it." From the second answer on, it read "did not save your progress or answer
  history"; the log stores each notice cut at 170 characters (`near_limit.js`), so its end is not
  recorded.
- At the check 70 s after the first answer, storage held all 10 answers, the earlier page's
  record was gone, and this tab had no record. The check 60 s after the first answer still
  showed 2 answers stored. The notice text read at the 70 s check was still the "did not save"
  wording.
- The review saw the same with its own script ("the page held 3 answers and storage held 2").

**The cause.** Kit #47's "study progress first" makes room by removing only this tab's own
proven record (`dropOwnRecordIfStored`). It never removes the earlier page's record, which is
what fills the room. So in the minute after a reload, a progress save is refused whenever the
earlier record and the new progress together exceed the quota. Closing the tab in that minute
loses the answers given since the reload. This happens whenever the progress has grown, since the earlier
record was written, by more than the room left in the origin. Ink can add thousands of characters in a
minute; one answer added about 250 here.

### What the record would take if compressed

**Size.** The progress samples are generated, not Louis's progress (§12.4), so every ratio below
is an estimate for his data.

| Sample (generated) | Progress characters | deflate level 9, estimate (`logs/compress-estimate.log`) | fflate 0.8.2 level 6, measured (`logs/compress-timing.log`) | lz-string 1.5.0 `compressToUTF16`, measured (same log) |
|---|---|---|---|---|
| ink, the porter's generator (60 pages, 30 strokes, 60 points) | 1,355,486 | 0.150 | 0.154 | 0.142 |
| ink, random-walk strokes of the same shape | 1,563,704 | 0.165 | 0.173 | 0.163 |
| 4,000 answers on 600 concepts | 526,734 | 0.096 | 0.104 | 0.108 |

The deflate and fflate figures count the compressed bytes packed 15 bits per stored character.
Both libraries gave the exact text back on every sample (`exact: true`). fflate came out 0.004
to 0.008 above the deflate estimate. lz-string came out below it on both ink samples and 0.012
above it on answers. The review measured Chromium counting a text of 15-bit
characters exactly like ASCII. Counting in WebKit and Firefox was not run.

**Time.** Medians of 5 runs in Chromium, in milliseconds (`logs/compress-timing.log`). "Rate 4" is
Chrome DevTools Protocol CPU throttling on this container's Xeon 2.1 GHz. It is a slowed desktop
CPU, not a phone.

| Sample | CPU | `JSON.stringify` | one `setItem` of the progress | fflate deflate | fflate inflate | lz-string compress | lz-string decompress | IndexedDB put to complete |
|---|---|---|---|---|---|---|---|---|
| ink, porter | rate 1 | 12 | 5 | 141 | 19 | 187 | 43 | 9 |
| ink, random walk | rate 1 | 12 | 6 | 102 | 19 | 257 | 54 | 15 |
| answers | rate 1 | 2 | 1 | 21 | 5 | 56 | 15 | 3 |
| ink, porter | rate 4 | 59 | 23 | 675 | 60 | 1,115 | 201 | 15 |
| ink, random walk | rate 4 | 58 | 27 | 440 | 74 | 1,279 | 211 | 23 |
| answers | rate 4 | 7 | 6 | 86 | 21 | 269 | 48 | 6 |

A save writes the progress and the record, two `setItem` calls. At rate 4 on the random-walk
sample, today's save is about 58 + 27 + 27 = 112 ms of main-thread time (checked). Compressing
the record with fflate on every save would add about 440 ms, which makes it about 525 ms
(58 + 27 + 440 = 525, checked; the record's own smaller `setItem` is left out). On the porter
sample it would be about 59 + 23 + 675 = 757 ms (checked). Saves run 150 ms after each change, so
on a phone this cost could fall on every answer or stroke. The phone time is not measured. The
review measured lz-string 1,342 ms and fflate 681 ms at the same throttling.

## The alternatives

The guarantee to keep is #45's: a save that another tab later covers is not lost. It ends up in
the progress or in a copy Import keeps. It is never mixed with another record, and never removed
before what is stored is shown to hold it.

**A. The present full copy.**
- **Quota:** 2 times the progress, 3 times for about a minute after a reload or a return.
  - A record write that is refused leaves that save without a record. The notice says so, and
    the core removes this tab's own proven record to make room for the progress (kit #47).
  - In the minute after a reload, the earlier page's record is not removed to make room. Just
    below 2,621,430 characters of progress, the **progress save itself** is refused for up to
    about a minute. Closing the tab then loses the answers since the reload (measured above).
  - An Import or another profile's save can be refused while an earlier record waits for its
    cleanup, as measured.
- **Reload:** the earlier page's record stays until it is proven stored, plus 60 s.
- **Profile switch:** one record per return (a new key each time; Louis, 2026-11-05).
- **Closing without handing over:** protected while the record fits.
- **Cost:** none beyond today's.

**B. A delta record** (only what changed since the last stored save).
- Rebuilding the lost save needs the progress it was a change to. In the case #45 covers, that
  stored progress is what another tab wrote over.
- A variant holding only the parts that differ from the stored progress, used while the stored
  progress still equals its base, fails in the same case: the other tab's write replaces the base.
- **Loses:** the exact lost save, whenever another tab has written over its base. **Rejected.**

**C. A hash and a version pointer, plus the smallest unsaved part.**
- The hash shows that the stored progress is no longer this tab's last save, but it cannot bring
  that save back. The "smallest unsaved part" has B's problem.
- **Loses:** the lost save itself; it only detects the loss. **Rejected.**

**D. Removing records sooner.** The idea is to keep a record only while its save is unconfirmed.
- A tab cannot confirm that another tab has seen its save. Between processes the HTML Standard
  defines no ordering or timing for localStorage.
- A tab already removes its own record after reading it back under a full quota (kit #47).
- One prototype went further (`prototype-supersede.diff`, on a throwaway branch, not proposed).
  It removed another tab's record once the stored progress equalled what this tab had taken over
  from.
  - **Space:** it kept the 1,475,679 case at 2.00 times after a reload, and the Import then
    succeeded within the minute (`logs/prototype-supersede-1475679.log`).
  - **Safety:** it failed 6 of 273 checks of `import_test.js`, and `main` passes all 273
    (`logs/prototype-supersede-import_test-failures.log`, `logs/main-import_test-summary.log`;
    the review got the same 6). The failures:
    - 5 checks in 3 scenarios (checks 293 and 294; 313 and 314; 317): a leaving tab's last
      answer was in neither the progress nor a copy;
    - 1 check (319): a leaving tab's last setting was lost.
  - In the failing "tab back on a profile" check, the taking-over tab's view of the other record
    was out of date, so the prototype removed a newer version of that record.
- **Rejected in this form.** The prototype shows that removing other tabs' records on that rule
  loses data. It does not show that every earlier removal does. The 60 s wait itself is a timing
  assumption, and the HTML Standard gives it no bound.

**E. A size-capped record.**
- Above the cap no record is written, which is what happens now above 2,621,430 characters, at a
  smaller size.
- **Loses:** protection above the cap. **Rejected.**

**F. A compressed record** (the same content, written as `{at, n, fp, z, log}`, where `z` is the
compressed `db` text, `n` its length and `fp` its `fpOf` hash).
- **Quota:** with fflate's measured ratios, the steady state is about 1.15 to 1.17 times the
  progress for ink and 1.10 times for answers, against 2 today. In the minute after a reload it
  is about 1.346 times for the random-walk sample (1 + 2 × 0.173 = 1.346, checked), against 3
  today.
  - The record would then fit up to about 5,242,859 / 1.173 = 4,469,616 characters of progress in
    steady state. During a reload's minute the limit would be 5,242,859 / 1.346 = 3,895,140
    (both checked; random-walk sample, empty origin).
  - The reloaded page's own record would be refused above about 3,895,140. The progress save
    itself would be refused in the reload minute when the earlier compressed record and the
    progress no longer fit together, near 4,469,616. The refusal of the progress save in the minute after a reload
    then happens near that size instead of near 2,621,430.
- **Placement and cleanup:** the same rules as A. Placement, the 60 s wait and the "unchanged"
  check are kept; only the record's size changes.
- **Integrity:** raw deflate has no checksum, so a damaged stream can decompress to wrong text.
  The decompressed text must match `n` and `fp`. A record that does not match, or does not
  decompress, is left in place: not placed and not removed, as any unreadable record is now.
- **Cost:** about 440 to 675 ms more per save at rate 4 on the 1.36 to 1.56 million-character ink
  samples (above). The phone time is unknown.
- **Making it asynchronous** (a Worker or `CompressionStream`) would keep the page responsive. It
  would also leave a moment after each change with no record of the newest save, the
  close-without-handover case #45 covers. Compressing less often has the same effect.
- **Older cores:** a #45 or #47 core's `settlePending` skips a record without `db`. It neither
  places nor removes it, though its `pendingRetire` still marks it handled.
  - In a mix of tabs where the next holder runs the older core, the closed tab's last save waits
    until a newer-core tab opens the profile.
  - If a course's kit pin is rolled back to an older core, compressed records stay unplaced until
    the pin moves forward again.
  - While an older-core tab is open, its own records stay full size, so the reload-minute
    refusals, including the progress refusal above, still apply.

**G. Moving the progress, and with it the record, to IndexedDB** (kit #49 and #54, not
approved).
- A read-write transaction that reads the stored progress, checks it and writes inside the same
  transaction prevents the lost update #45 guards against. A write of a whole stale in-memory
  copy would still be a lost update, so the core would need that read-check-write rule.
- Its quota is a share of the disk, not the 5 MB localStorage limit.
- It is a migration with its own decisions and its own approval. It needs device checks on a
  real iPhone and iPad, which have not been run.

**H. Records only in IndexedDB, the progress staying in localStorage** (the review's
alternative).
- **Quota:** localStorage holds only the progress, so a progress up to the whole 5,242,859
  characters (less the other keys) saves. Neither the reloaded page's record nor the progress save is refused in the minute after a
  reload.
- **Unchanged:** the progress key's format, Export and Import, and compression (none).
- **Cost:** an IndexedDB put of the progress text completed in 3 to 15 ms at rate 1 and 6 to
  23 ms at rate 4 (`logs/compress-timing.log`). The put does not block the page.
- **The gap:** the write is asynchronous. The core writes a save still waiting on its 150 ms
  timer when the page is hidden or closed (`saveNow`, called from `views.js` on `pagehide` and
  `visibilitychange`). That fix, finding A1 of kit #30, exists because a reload 20 ms after a
  paper was submitted lost 2 of 2 answers in the stopwatch port. Under H, the record of that last save would be an IndexedDB transaction
  started as the page closes. The browser may not complete it. Whether Chromium, WebKit or a
  phone completes it was not run.
- **Older cores:** they read records only from localStorage, so they never place an IndexedDB
  record. That gives F's mixed-tab and rollback limits, plus a second storage area to clear on
  Erase and Reset.

### Save time and responsiveness in a real page

Measured on 2026-11-06 in Chromium with `latency_measure.js` (`logs/latency-measure.log`), on a
scratch template course built from `main` at `3f8ba20`. Each row covers 8 saves of one sample
placed into the page's progress. After each change the script sent 10 clicks, 40 ms apart, to a
button that repaints, and read the Event Timing API (time from the click to the next paint) and
long tasks (over 50 ms). Rates 4 and 6 are Chrome DevTools Protocol CPU throttling of this
container's desktop CPU: a slowed desktop CPU, not a phone. Each figure in this first table is
from one run.

- **A:** today's save: the progress and this tab's full record.
- **F (compress on every save):** the same save with the record compressed in the page (fflate 0.8.2 `deflateSync`
  level 6, then the bytes packed 15 bits to a character). This is a test harness injected into the
  scratch page only. It is not in `core/`, and its record cannot be placed by the core, so one
  tab was open.
- **W:** the same compression in a Worker. The page writes the record when the Worker answers.
  Chromium refuses CPU throttling for a Worker: `Emulation.setCPUThrottlingRate` sent to the
  worker target answered "Operation is only supported for pages, not workers", and a loop in the
  Worker took 45 ms before and 44 ms after it (`logs/worker-throttle-probe.log`). At rates 4 and
  6 only the page was slowed, so W's figures at those rates do not describe a slow device and its
  "record stored after the progress" time is given here at rate 1 only.

Two progress sizes are 17 characters larger than in the tables above (1,563,721 against
1,563,704; 526,751 against 526,734), because the harness's probe setting is part of the page's
progress by then. The porter sample, measured first, is the same size (1,355,486).

| Sample (progress characters) | Rate | A save, median ms | F (compress on every save) save, median ms | F compress and pack, median ms | W save, median ms | Longest task, ms (A / F / W) | Slowest click to next paint, ms (A / F / W) | W: record stored after the progress, median ms (rate 1 only) |
|---|---|---|---|---|---|---|---|---|
| ink, porter (1,355,486) | 1 | 25 | 179 | 157 | 20 | 0 / 218 / 0 | 24 / 200 / 16 | 176 |
| ink, porter (1,355,486) | 4 | 115 | 671 | 556 | 85 | 143 / 696 / 133 | 120 / 696 / 128 | (Worker not slowed) |
| ink, porter (1,355,486) | 6 | 150 | 972 | 835 | 133 | 240 / 1064 / 190 | 224 / 1040 / 168 | (Worker not slowed) |
| ink, random walk (1,563,721) | 1 | 28 | 141 | 118 | 22 | 82 / 174 / 0 | 64 / 160 / 24 | 125 |
| ink, random walk (1,563,721) | 4 | 127 | 609 | 498 | 95 | 140 / 642 / 123 | 120 / 632 / 104 | (Worker not slowed) |
| ink, random walk (1,563,721) | 6 | 162 | 894 | 730 | 149 | 189 / 980 / 185 | 168 / 976 / 168 | (Worker not slowed) |
| answers (526,751) | 1 | 6 | 28 | 23 | 5 | 0 / 0 / 0 | 16 / 16 / 16 | 25 |
| answers (526,751) | 4 | 22 | 127 | 102 | 24 | 0 / 181 / 0 | 32 / 152 / 32 | (Worker not slowed) |
| answers (526,751) | 6 | 37 | 193 | 153 | 39 | 57 / 209 / 62 | 32 / 200 / 48 | (Worker not slowed) |

- "Longest task" 0 means no task over 50 ms was recorded. A click with no Event Timing entry took
  under 16 ms (the API's lowest threshold).
- The 75th percentile of the 80 clicks per row was 16 ms or less in every row, because most
  clicks arrived while no save was running. The slowest click is the figure that differs between
  A, F and W.
- **F on the ink samples:** at rate 4 the save blocked the page for 609 to 671 ms per save, and a
  click waited up to 632 to 696 ms for its next paint. At rate 6 it was 894 to 972 ms per save,
  and a click waited up to 976 to 1,040 ms. The compression and packing were 498 to 835 ms of
  that.
- **A on the ink samples:** today's save alone already took 115 to 162 ms at rates 4 and 6, and
  at rate 6 a click waited up to 168 to 224 ms.
- **W:** the page's work stayed close to A's, which leaves out the record write the page makes
  when the Worker answers. At rate 1 the record reached storage 125 to 176 ms after the progress
  on the ink samples (a difference of medians); during that window the record holds the previous
  save, and a tab closed in it leaves the previous save's record, which is the case kit #30's A1
  fix exists for. On a slow device that window would be longer; it was not measured, because the
  Worker cannot be slowed here.

**A threshold for comparison.** web.dev's guidance on Interaction to Next Paint calls a page's
responsiveness good when its INP is 200 ms or less, needing improvement above 200 ms up to
500 ms, and poor above 500 ms, measured at the 75th percentile of page loads, segmented across
mobile and desktop devices.[1] That is a site-wide field measure, not a limit for one save. At
rates 4 and 6, F's slowest click on the ink samples was above 500 ms in every row.

**The sizes where the threshold variant compresses** (2026-11-08, `latency_measure.js` with
`LAT_MODES=A,T`, `LAT_RATES=1,4`, one sample per browser; `logs/latency-large.log`, summarised by
`latency_summary.py`; scratch template course from `main` at 1bdc08e). T is the recommended form
of F before this revision: the record is compressed only when three full copies of it, with the
origin's other keys, would not fit in 5,242,859 characters; at every size below it compressed on
every save (5 of 5). Each cell is the range over 3 runs of 5 saves.

| Progress (characters) | Rate | A save, median ms | A slowest click, ms | A's per-tab record | T save, median ms | T compress and pack, ms | T slowest click, ms | T record |
|---|---|---|---|---|---|---|---|---|
| 1,796,478 | 1 | 27-30 | 24 | stored | 118-150 | 95-129 | 128-184 | stored |
| 1,796,478 | 4 | 132-136 | 128-168 | stored | 589-620 | 501-504 | 632-744 | stored |
| 2,604,462 | 1 | 41-46 | 24-40 | stored | 195-234 | 149-201 | 216-240 | stored |
| 2,604,462 | 4 | 179-213 | 216 | stored | 869-943 | 708-756 | 872-936 | stored |
| 3,906,236 | 1 | 46-50 | 40 | refused (5 of 5) | 311-345 | 251-295 | 336-400 | stored |
| 3,906,236 | 4 | 213-228 | 248-272 | refused (5 of 5) | 1359-1474 | 1097-1211 | 1384-1560 | stored |
| 4,453,234 | 1 | 55-62 | 40-56 | refused (5 of 5) | 346-426 | 286-357 | 352-424 | stored |
| 4,453,234 | 4 | 250-273 | 272-304 | refused (5 of 5) | 1436-1616 | 1164-1300 | 1696-1800 | stored |

- The progress itself was stored after every save in every row (`progressCurrent: true`).
- At 3,906,236 and 4,453,234 characters today's save stores the progress but no per-tab record:
  two full copies do not fit in the origin.
- The compressed record took 310,886 to 310,899 of 1,796,478 characters at the smallest size
  (0.173; 310,886 / 1,796,478 = 0.17305 and 310,899 / 1,796,478 = 0.17306, checked).
- The 75th percentile of the clicks was 16 ms or less in every row; the slowest click differs.
- The interrupted run of 2026-11-06 (branch `claude/elegant-ptolemy-pqxb8y-records-proposal-wip`)
  is reused only for its complete logs: `logs/worker-throttle-probe.log` and
  `logs/latency-measure-r2-171pages.log` (4,453,234 characters at rate 1, all four variants). Its
  W rows there show slowest clicks of 8,016 and 23,648 ms in two runs, which no other row comes
  near; they are left out as a measurement fault, not a result.

## The compressed record (the earlier recommendation; not recommended now)

**This was the recommendation at b8017ca: F, the compressed record, written only when three full
copies would not fit (T in the table above). It is not recommended now: at CPU rate 4 every save
that compresses blocked the page for 589 to 1,616 ms (see "The sizes where the threshold variant
compresses"). F's design follows; it applies only if a faster compressor or a smaller record
brings each save under the target in "Recommendation".**

Below that size the record stays today's full copy, so saves below that size cost nothing more. On an empty
origin that size is about 1,747,620 characters of progress, and the core would compute it from
the room the origin has left at each save. Above it, a record exists where A writes none or
refuses the progress save for a minute. H is not recommended: the record of the save written as the
page closes would be an IndexedDB transaction started at `pagehide`, the case A1 fixed, and whether
a browser completes that transaction was not run. G remains a separate
decision; if it is approved first, F is not needed.

**The gate, before any production pull request:**
- Time fflate's deflate, the 15-bit packing and one full save, at 1,475,679 characters of ink
  progress, on a real iPhone or iPad in Safari and on an Android phone.
- Compare the times with the save-time target proposed in "Recommendation" (200 ms; awaiting
  Louis).
- **If a phone exceeds the limit:** F is dropped and A stays. Worksheets-ink (#17) stays off for
  every course until G or another approved design covers large ink progress.

**Its guarantees, if the gate passes:**
1. **Quota failure:** below the size, the same as A. Above it, the record is about 0.15 to 0.17
   of the progress on the generated ink samples. A refused record write is reported and handled
   as now (kit #47).
2. **Reload:** the earlier page's record stays until it is proven stored, plus 60 s. Above the
   size the reload minute holds about 1.35 times the progress instead of 3. On an empty origin
   the reloaded page's record is then refused above about 3,895,140 characters. The progress
   save is refused near 4,469,616, not near 2,621,430. Below the size, A's behaviour stays. The
   measured Import refusal at 1,475,679 characters stays too: it lasts about a minute after a
   reload and changes nothing stored.
3. **Profile switch:** unchanged; one record per return.
4. **Cross-tab recovery:** placement, the "handled" marks, the 60 s wait and the "unchanged in
   between" rule are unchanged. Decompression gives back the exact `db` text, checked against
   `n` and `fp`. A record that fails the check is left in place, not placed and not removed.
5. **An older-core tab** leaves a compressed record alone. A newer-core tab places it the next
   time it holds the profile. Under a rollback, it waits until the pin moves forward again.

**Migration:**
- Uncompressed records written by older cores keep being read and placed. Only the new core
  writes compressed records, and only above the size.
- The progress key's format, Export and Import files, and the copies Import keeps do not change.
- While an older-core tab is open on a profile, its records stay full size (F, older cores).
- A later move to IndexedDB (G) has one more record format to read.

**Tests it needs** (each to fail on a broken copy):
- an exact round trip on records of answers, ink and settings, with the length and hash check;
- a damaged compressed record left in place, unread and unremoved;
- full copies below the size and compressed records above it;
- at 2,621,000 characters, the progress save after a reload succeeding (it is refused today);
- an older-core record still placed;
- every `import_test.js`, `history_test.js` and `storage_test.js` check still passing;
- the save time in Chromium and WebKit, against the accepted target.

## The module-part gap in placement (fixed by kit #69)

Kit #69, merged to `main` as b0f5046 on Louis's approval of 2026-11-07, fixes this: a record's
module part is kept as a copy, and a stored save is never removed to make room. The finding, as
it stood before #69:
- `placeOf` (`core/shell.html`) handles a record whose last answer the stored progress went on
  from. It compares only the record's `mark` and `settings`, and returns "nothing to add"
  otherwise.
- A module part, worksheets-ink's `DB.ink` or equation-drill's `DB.eq`, is not compared.
  Equation-drill changes `DB.eq` without an answer (`eqRecord`), and it is on `main` since kit #6.
- The review planted a leaving tab's record holding 2 answers plus ink, with stored progress of
  3 answers and no ink. `placeOf` returned `'in'`, the record was removed after the aged 60 s
  check, and the ink was in neither the progress nor a copy. The same held for `DB.eq`. A record
  differing only in a setting returned `'apart'` and was kept as a copy.
- Import already guards the same case (`views.js` `NOT_COMPARED`; `import_test.js` "a part this
  profile changed without an answer"). Record placement lacks that check.
- Its real-world trigger needs #45's cross-tab lag and the next tab saving before the record is
  placed. That two-tab run was not done.
- No course has a module on today. The fix belongs in its own core pull request, which needs
  Louis's yes, before any course turns on equation-drill or worksheets-ink. It is separate from
  the record's size.

## Not run

- WebKit, and Safari on an iPhone or iPad; Android; Firefox's localStorage counting and limit.
- A real phone's compression and save time. Rate 4 and rate 6 throttling slow a desktop CPU.
- CPU throttling of a Worker: Chromium refused it (`logs/worker-throttle-probe.log`), so W's
  record window on a slow device was not measured.
- The 15-bit packing step's time alone: `latency_measure.js` times compression and packing
  together.
- Page latency in WebKit, and with more than one tab open (the F, T and W harnesses write a
  record the core cannot place).
- A reload, an Import or a two-tab run under T at the sizes in `logs/latency-large.log`.
- F, T or H implemented inside the core; whether an IndexedDB write started at `pagehide`
  completes.
- Records written by an older core in a mixed-tab test.
- `history_test.js` and `storage_test.js` on the D prototype.
- Any measurement on Louis's own progress (§12.4): every sample is generated.

## References

1. Wagner J, Pollard B. Interaction to Next Paint (INP). web.dev. Published May 6, 2022. Updated
   September 2, 2025. Accessed November 6, 2026. https://web.dev/articles/inp
