# The per-tab record's storage cost: measurements and a proposal (2026-11-06)

Louis asked on 2026-11-06 for a measured proposal on the storage the per-tab record takes. He
asked for it to reuse the Kit feature porter's evidence and to reproduce the refused Import
independently. He also asked for a comparison of alternatives and one recommendation. He
authorized investigation and a proposal only, so nothing on `main` or in any course changes,
and the existing protection stays as it is.

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
- **The porter's figures** come from a "diag-records log" its test refers to, which is in no
  branch. They are left out of this proposal until that log is committed. The porter session was
  asked on 2026-11-06 to commit it under `review/records-storage/logs/`. The porter described its
  Import refusal but saved no log of it: its test adds a 61 s wait, so every saved run shows the
  Import succeeding.

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
- The review bracketed both. Three copies fit at 1,747,000, and the reloaded page's record was
  refused at 1,748,500. The record was kept at 2,621,000 and absent at 2,622,000. The true limits
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
- The notice read: "This browser did not save your progress or answer history (storage is full
  or blocked). It is kept on this page until you close or reload it; closing or reloading it
  loses it."
- At the check 70 s after the first answer, storage held all 10 answers, the earlier page's
  record was gone, and this tab had no record. The check 60 s after the first answer still
  showed 2 answers stored. The notice text read at the 70 s check was still the "did not save"
  wording.
- The review saw the same with its own script ("the page held 3 answers and storage held 2").

**The cause.** Kit #47's "study progress first" makes room by removing only this tab's own
proven record (`dropOwnRecordIfStored`). It never removes the earlier page's record, which is
what fills the room. So in the minute after a reload, a progress save is refused whenever the
earlier record and the new progress together exceed the quota. Closing the tab in that minute
loses the answers given since the reload. This happens for progress whose growth since the
earlier record was written carries it over the limit. Ink can add thousands of characters in a
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
    progress no longer fit together, near 4,469,616. The M2 case moves to that size; it does not
    disappear.
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
  characters (less the other keys) saves. The reload-minute refusals and the M2 case go away.
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

## Recommendation

**F, the compressed record, written only when three full copies would not fit, as a separate
core pull request for Louis's yes. It is gated on timing on real phones. Until that pull request
is approved and live, A stays as it is.**

Below that size the record stays today's full copy, so most saves cost nothing more. On an empty
origin that size is about 1,747,620 characters of progress, and the core would compute it from
the room the origin has left at each save. Above it, a record exists where A writes none or
refuses the progress save for a minute. H is not recommended: its record of the save written at
close is the write least certain to complete, which is the case A1 fixed. G remains a separate
decision; if it is approved first, F is not needed.

**The gate, before any production pull request:**
- Time fflate's deflate, the 15-bit packing and one full save, at 1,475,679 characters of ink
  progress, on a real iPhone or iPad in Safari and on an Android phone.
- Compare the times with a per-save limit Louis sets: ____ ms. (Question for Louis: what is the
  longest pause per answer or stroke you accept on a large worksheet profile?)
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
- the save time in Chromium and WebKit, against Louis's limit.

## The module-part gap in placement

The review reproduced this, in one page with planted records. It is present on `main`.
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

- WebKit, and Safari on an iPhone or iPad; Android; Firefox's localStorage counting.
- A real phone's compression and save time. Rate 4 throttling is a slowed desktop CPU.
- The 15-bit packing step's time (its size is computed from the byte count).
- F or H implemented inside the core; whether an IndexedDB write started at `pagehide` completes.
- The module-part gap under real two-tab lag (the review used planted records in one page).
- Records written by an older core in a mixed-tab test.
- `history_test.js` and `storage_test.js` on the D prototype.
