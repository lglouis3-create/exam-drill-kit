# The per-tab record's storage cost: measurements and a proposal (2026-11-06)

A proposal for Louis's decision. It changes no code on `main` and no course. Louis asked
(2026-11-06) for a measured proposal on the storage the per-tab record takes, reusing the
Kit feature porter's evidence, with an independent reproduction of the refused Import, a
comparison of alternatives, and one recommendation. It authorizes investigation and this
document only; the existing protection stays as it is.

## What the per-tab record is

Since kit #45, each save of a profile's progress also writes `<ns>:pending:<profile>:<tab>` =
`{at, db, log}`, where `db` is the progress this tab stored. No other tab writes that key, so a
save that another tab's write later covers is still on disk. The tab that next holds the profile
places it (as the progress or as a copy Import keeps) and removes it only once what is stored
holds all of it, checked again at least 60 s later, unchanged in between (`core/shell.html`, the
comment above `pendingKey`). The `db` field is a full copy of the progress.

## Measurements

All are in Chromium (Playwright 1.63.0) on a scratch template course built from kit `main`
`3ebde7e`, with the browser's own localStorage limit, not a forced one. The scripts and logs are in
`review/records-storage/`.

**The limit.** One origin's localStorage took 5,242,859 characters (key and value) and refused
more (`logs/quota-probe.log`). Every kit drill shares that origin (`lglouis3-create.github.io`).

**A progress of 1,475,679 characters**, the porter's size: two answers and a module part holding
ink as worksheets-ink does (`logs/real-quota-1475679.log`).

| When | Total stored | Times the progress |
|---|---|---|
| after the save | 2,951,873 | 2.00 |
| after a reload and one save (the earlier page's record not yet removed) | 4,428,443 | 3.00 |
| about 65 s after that save, once the earlier record was removed | 2,952,363 | 2.00 |

- **An Import of a second profile of the same size, in that minute, was refused.** The page said:
  "The browser refused to save (storage is full or blocked), so nothing was imported. Your
  progress is unchanged." The stored progress was unchanged, so nothing was lost.
- **The same Import after the earlier record was removed succeeded.** It stored 1,475,928
  characters as "Other (imported 2026-11-06)".
- This reproduces the porter's report independently. The porter's log has the same sizes
  (`data:me` 1,475,679 and two records of 1,475,714 each, about 4.43 million in all; one record
  left 62 s later). The porter's Import refusal was described, not saved in a log: its test adds a
  61 s wait, so every saved run of it shows the Import succeeding.

**Larger progress** (`logs/real-quota-2000000.log`, `logs/real-quota-3000000.log`):

| Progress | After the save | After a reload and one save |
|---|---|---|
| 2,000,000 | 4,000,515 (2.00 times): record kept | the reloaded page's own record was refused (the core marks the record off and says so); only the earlier page's record remains |
| 3,000,000 | 3,000,275 (1.00 times): the record was refused; the progress saved | the same: no record |

The arithmetic, from these numbers:
- the record fits while twice the progress fits: 5,242,859 / 2 = 2,621,430 characters of
  progress (checked);
- during the minute after a reload, three copies must fit: 5,242,859 / 3 = 1,747,620 characters
  (checked). This matches the measurements: kept at 1,475,679, refused at 2,000,000.

Above those sizes the progress still saves ("study progress first", kit #47), but that save has no
record, so a tab closing without handing over can again lose its last save to the next tab. Kit
#47 already reports this in its notice.

**What the record would take if compressed** (`logs/compress-estimate.log`). Estimated with
deflate at level 9, with the bytes packed 15 bits per stored character, as a UTF-16 text encoder
such as lz-string's `compressToUTF16` does.

| Sample | Progress characters | Record characters | Record / progress |
|---|---|---|---|
| ink, the porter's generator (60 pages, 30 strokes, 60 points) | 1,355,486 | 203,803 | 0.150 |
| ink, random-walk strokes of the same shape | 1,563,704 | 258,484 | 0.165 |
| 4,000 answers on 600 concepts | 526,734 | 50,321 | 0.096 |

These are estimates, not a browser implementation. A compressor that runs synchronously in the
page is usually weaker than deflate, and its time on a phone was not measured.

## The alternatives

The guarantee to keep is #45's: a save that another tab later covers is not lost. It ends up in
the progress or in a copy Import keeps, never mixed with another record, never removed before
what is stored is shown to hold it.

**A. The present full copy.**
- **Quota:** 2 times the progress, 3 times for about a minute after a reload or a return.
  - A record write that is refused leaves that save without a record. The notice says so, and
    the core removes this tab's own proven record to make room for the progress (kit #47).
  - An Import or another profile's save can be refused while an earlier record waits for its
    cleanup, as measured.
- **Reload:** the earlier page's record stays until it is proven, plus 60 s.
- **Profile switch:** one record per return (a new key each time; Louis, 2026-11-05).
- **Closing without handing over:** fully protected while the record fits.
- **Older cores:** a pre-#45 core ignores records; a #45 core reads them.

**B. A delta record** (only what changed since the last stored save).
- Rebuilding the lost save needs the progress it was a change to.
- In the case #45 covers, that stored progress is exactly what another tab wrote over. So the
  delta could only be applied to the other tab's progress, which mixes two records (against
  Import's rule) or rebuilds settings, scheduling state and module parts wrongly.
- **Loses:** the exact lost save, whenever another tab has written over its base. **Rejected.**

**C. A hash and a version pointer, plus the smallest unsaved part.**
- The hash tells that the stored progress is no longer this tab's last save, but it cannot bring
  that save back.
- The "smallest unsaved part" has the same problem as B.
- **Loses:** the lost save itself; it only detects the loss. **Rejected.**

**D. A record only while a save is unconfirmed, removed once it is stored and read back.**
- A tab cannot confirm that another tab has seen its save. Between processes the HTML Standard
  defines no ordering or timing for localStorage, and that lag is the very case #45 protects.
- Tested with a prototype (`prototype-supersede.diff`, on a throwaway branch, not proposed). It
  removed another record as soon as its progress equalled what this tab had taken over from.
  - **Space:** it kept the 1,475,679 case at 2.00 times after a reload, and the Import then
    succeeded within the minute (`logs/prototype-supersede-1475679.log`).
  - **Safety:** it failed 6 of 273 checks of `import_test.js`, and `main` passes all 273
    (`logs/prototype-supersede-import_test-failures.log`, `logs/main-import_test-summary.log`).
    The failures:
    - a leaving tab's last answer was in neither the progress nor a copy, in five cases;
    - a leaving tab's last setting was lost, in one case.

    The removal was based on a view of the other tab's record that was out of date, so a newer
    version of that record was removed.
- So the 60 s wait and the "unchanged in between" rule carry the guarantee. Removing a record
  sooner loses data. **Rejected.**

**E. A size-capped record.**
- Above the cap no record is written, which is what happens now above 2,621,430 characters, at a
  smaller size.
- **Loses:** protection above the cap. **Rejected as a solution**; it is already the behaviour at
  the browser's limit.

**F. A compressed record** (the same content, written as `{at, z, log}`, where `z` is the
compressed `db`).
- **Quota:** with the ratios above, about 1.15 to 1.17 times the progress for ink and 1.10 for
  answers, instead of 2. In the minute after a reload, about 1.3 instead of 3.
  - The record then fits up to about 5,242,859 / 1.165 = 4,500,308 characters of progress in
    steady state, and 5,242,859 / 1.33 = 3,941,999 during a reload's minute (both checked; the
    random-walk ink ratio).
  - A refused record write is handled exactly as now.
- **Reload, profile switch, closing without handing over:** the same rules as A. Placement, the
  60 s wait and the "unchanged" check are kept; only the record's size changes.
- **Loses:** nothing that A keeps, provided that compression and decompression are exact (a
  tested round trip) and that a record that cannot be decompressed is left as it is, as any
  unreadable record is now.
- **Older cores:** a #45 core cannot read a compressed record. Today's rule is "a record that
  cannot be read is left as it is", so that core neither places nor removes it. In a mix of tabs
  where the next holder is on the older core, the closed tab's last save waits until a newer-core
  tab opens the profile. It is kept, not lost, but not yet placed.

**G. Moving the progress, and with it the record, to IndexedDB** (kit #49 and #54, not
approved).
- IndexedDB's read-write transactions on one store run one at a time across tabs, so the lost
  update #45 guards against cannot occur, and the record is no longer needed.
- Its quota is a share of the disk rather than the 5 MB localStorage limit.
- It is the lasting answer, but a migration with its own decisions, its device checks on a real
  iPhone and iPad (not run), and its own approval.

## Recommendation

**F, the compressed record, as a separate core pull request for Louis's yes**, with G kept as
the lasting answer. The compressed record changes the record's size only: what is protected,
when a record is placed, and when it is removed stay as they are.

**Its guarantees, exactly:**
1. Every save that writes a record writes the same content as today: the full progress and this
   tab's new history entries, compressed. Decompression gives back the exact `db` text; a test
   compares the two on every record written in the checks.
2. A record that cannot be decompressed or read is left as it is: not placed, not removed. As now.
3. Placement, the "handled" marks, the 60 s wait and the "unchanged in between" rule are unchanged.
4. A refused record write is reported and handled as now (kit #47). It is refused less often,
   because the record is about a sixth of the progress (by the estimates above).
5. An older-core tab leaves a compressed record alone. A newer-core tab places it the next time it
   holds the profile.

**What it does not change:** the progress key's format (old cores keep reading progress as they
do), Export and Import files, and the copies Import keeps.

**Migration:**
- **Records in the field:** uncompressed records written by older cores keep being read and
  placed. A new record is compressed only when written by the new core.
- **Mixed tabs:** item 5. While an older-core tab is open on a profile, its own records stay
  uncompressed.
- **IndexedDB (G):** a compressed record is one more record format for the move to read. If G is
  approved first, F is not needed.

**Tests it needs** (each to fail on a broken copy):
- an exact round trip on records of answers, ink and settings;
- the measured sizes: steady state about 1.2 times the progress and a reload's minute about 1.3
  times, at 1,475,679 characters;
- the Import of a same-sized profile within the minute after a reload, which today is refused,
  succeeding;
- a corrupt compressed record left in place, unread and unremoved;
- an older-core record still placed;
- every `import_test.js`, `history_test.js` and `storage_test.js` check still passing;
- the time to compress a 1,475,679-character progress, measured in Chromium and WebKit, with a
  limit agreed before merging. Saves happen 150 ms after a change. Not measured yet.

**Not part of the recommendation:**
- removing records sooner (D): measured, it loses data;
- a delta or pointer record (B, C): it cannot rebuild the lost save.

## Found while reading, not reproduced

`placeOf` treats a record whose last answer the stored progress went on from as "nothing to
add", unless the record's settings or mark differ. A module part (worksheets-ink's ink, or
notes) is not compared. A leaving tab that drew ink after its last answer, followed by a next tab
that answered while its view of that ink was out of date, could therefore lose that ink after the
60 s cleanup. This is a placement question, separate from the record's size, and is noted for its
own check. It was found by reading `core/shell.html` at `3ebde7e` and has not been reproduced.

## Not run

- WebKit, and Safari on an iPhone or iPad.
- A browser implementation of compression, and its time cost.
- The ink gap above, as a test.
- Records written by an older core in a mixed-tab test.
