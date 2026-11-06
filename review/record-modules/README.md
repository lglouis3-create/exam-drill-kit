# Module parts in per-tab records (2026-11-06)

The independent review of kit PR #66 (head dc68a31) found a data loss. A tab's last save is kept
as a per-tab record, `<ns>:pending:<profile>:<tab>` (kit #45). Such a record could be removed while
it held a feature module's part of the progress that the stored progress lacked:
- worksheets-ink keeps its writing in `DB.ink`;
- equation-drill keeps its records in `DB.eq` and changes them without an answer.

The review of #69 at d5bdd7b (M1, M2) found two more paths.

## Where a record's or the stored progress's module part could be dropped (core/shell.html at main 3f8ba20)

**Placement** (`settlePending` → `settleOne` → `placeOf`). On main, `placeOf` returned `'in'` ("nothing to add") in two cases:
- the stored progress went on from the record's last answer, and the settings and mark matched;
- the record had no answers, and the stored progress had some and no mark.

Neither case compared module parts. **Fixed:** `moduleAhead` makes both `'apart'` / `'conflict'`, so the record becomes a copy.

**A record with no answers and its own settings** (Louis, 2026-11-06, verified first). The no-answers branch returned `'in'` whenever the stored progress had answers and there was no mark. It never compared the settings, so a record whose ordinary settings differed was retired without a copy. For example, a tab opened, a setting changed, then the tab closed.

`before-main-3f8ba20.log` and `before-d5bdd7b.log` show it: `"where":"in"`, no copy. **Fixed:** such a record is `'apart'` and kept as a copy, as the settings-only case behind the stored answers already was. This tab's own record keeps `'in'` there (`own`).

**A record that continues the stored progress** (`'continues'`, this page unchanged), M1. The record replaced the stored progress. A module part the stored progress held and the record lacked was then lost:
1. tab C's 4 answers plus `DB.eq` are stored;
2. tab A's late record has the same 4 answers and a 5th, without `DB.eq`, and replaces the progress;
3. C's record, proven earlier, is removed 60 s later.

**Fixed:** the record replaces the progress only when `!moduleAhead(st, rec.db)`; otherwise it is a copy and the stored progress stays.

**The 60 s retirement** (`pendingDone`). It removes a record only when `placeOf` says `'in'`, or when a copy holds the record's whole progress. So it removed exactly the records in the placement cases above. **Fixed by the same change.** A copy that also carries the record's history entries now counts as holding them (see retire below).

**Recovery at start-up** (a reload). The page that opens takes the lock and settles the earlier page's record through the same path. **Fixed and tested** (the reload case).

**Profile switch** (`claimProfile`). The same path, on the new profile's records. **Fixed and tested** (the switch case).

**Put back, Erase, a replacing Import, Delete the copies** (`pendingRetire`), M2. A record seen at that moment is marked handled and is never placed.
- On main, such a record with a module part was removed, losing the part, if `placeOf` said `'in'`.
- At d5bdd7b it stayed in storage for good: unplaced, unproven, and reachable from no screen.
- Erase left the same orphan on main for any record with answers: its progress is `'continues'` against an erased one.

**Fixed:** a retired record not yet placed, whose module part the stored progress lacks, becomes a copy, with its history entries (`retireToCopy`). The copy screens can put it back or delete it. Put back adds the entries.

The same rule applies to Erase: Erase is one of the four retiring actions, and the copy keeps the student's chance to put the writing back. After Delete the copies, such a record appears as one new copy right after the deletion. That is the record's own content, which no copy held before.

Under a full storage (Louis, 2026-11-06): the record is the only stored copy of that work, so it is never removed to make room for the copy.
1. The copy is written beside the record.
2. If that write is refused, the record stays in storage as it is. A notice, once per record per visit, tells the student: the browser refused to store a copy (storage full or blocked); Settings cannot put it back yet and Export progress does not include it; it stays stored in this browser; and it becomes a copy the next time the drill opens, or copies are deleted here, while there is room.
3. The copy is tried again at each later check: the drill opened or reloaded, copies deleted on this page, a take-over, a profile switch, or a storage event for a per-tab record. Freeing room some other way does not by itself start a check. Once a check finds the copy stored, the record is removed, at least 60 s after it was first seen (that may be at once, if it was first seen more than 60 s earlier).

While storage stays full, the work is in storage but cannot be put back from Settings, and an export does not carry it. Nothing is lost if the page closes or the browser refuses every later write; a reload finds the record unchanged.

In WebKit (Kit checks job 128109291119, `webkit-job-128109291119-excerpt.txt`), the real-quota-filler case stored the copy beside the record, although a probe write of the same size just before had been refused; the record stayed (`"kept":true`). Whether a browser accepts that copy depends on its quota accounting, so the real-filler cases check only that the record stays, and a separate case refuses the copy list's write while the record is stored (in every browser), so code that removed the record first would store the copy and fail; it checks the record unchanged, the unchanged list and the notice.

Evidence (`core/ci_course.sh template chromium`, 48-check test): ced9806, the earlier remove-first code, fails 6 of 48 (`before-keep-record-ced9806.log`). There, with the backup write and every later write refused, the record was gone before and after a reload. This revision passes 48 of 48 (`after-keep-record.log`); the run gave 30 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, an allowed exclusion), 1 REPORT.

A retired record without a module part ahead of the stored progress keeps main's behaviour. For example, a record with answers met by Erase stays in storage, unplaced. This is unchanged and not fixed here.

**This tab's own record under a full storage** (`dropOwnRecordIfStored`, kit #47). The stored progress is this tab's own later write, so its module part is the newer one. **Exempt** (`placeOf(..., true)`), and only there: `pendingDone` and `settleOne` check without the exemption.

## Put back (the review of #69, N1)

`restoreBackup` (`core/views.js`) wrote its copy list in its step 3 from the list it had read before it called `pendingRetire`. A record that `retireToCopy` had just made into a copy was dropped from that list. With storage full, `retireToCopy` had also removed the record first, so the module part was in neither. `pendingRetire` now runs after step 3. Nothing between the two reads or writes a per-tab record.

Evidence, from `core/ci_course.sh template chromium` with the same 43-check test:
- adbcb82: 4 of 43 fail (`before-putback-fix-adbcb82.log`). With storage full (real quota filler), right after Put back the record was gone and no copy held its `DB.ink`; after the filler was removed and two later checks, still no copy held it. (The fourth failure in that log was a device-setting case that is no longer part of this change; see below.)
- With the fix: 43 of 43 pass (`after-putback-fix.log`); the run gave 30 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, an allowed exclusion), 1 REPORT.

A record with no answers that differs only in a setting kept per device (`views.js` `IMPORT_DEVICE`, today `eqPick`) stays a copy, as before. Every per-tab record is on this device, so that setting was this device's own choice in another tab; holding it instead would drop it without a copy (the review of fd2aea1). `record_modules_test.js` checks that it stays apart.

## Which parts count as a module's
A module part is any key of the progress outside the core's own parts. The core's parts are `views.js` `NOT_COMPARED` (v, created, fsUndo, fsHistory, answers, qn, settings) and `ENTRY_MAPS` (concepts, arms, fsrsQ, fsrsC). `moduleAhead` uses Import's own `NOT_COMPARED`, `ENTRY_MAPS`, `isEmptyPart` and `canon`, which compares without regard to key order. These are reachable because views.js is in the same page script (`build.py` `FIXED_SOURCES`; `built_page.js` `engine()` includes it). So every module counts, not only ink and eq.

No module declares a merge rule (`core/features.js` has no such hook), so the record is kept as a copy.

wrong-number-diagnosis keeps its data inside the answers (`miss`, `missSuggest` on an answer entry), not in a part of its own. Its data moves with the answers, which placement compares field by field, so it is low risk.

## Evidence
- `before-main-3f8ba20.log`: `core/record_modules_test.js` against main's core, 17 of 36 checks failing. The controls pass.
- `before-d5bdd7b.log`: the same test against the first revision of #69, 9 of 36 failing (M1, M2, the zero-answer settings case).
- `after-fix.log`: the same test with the fix, 36 of 36.
- Two tabs with real cross-tab lag: not produced reliably. The cases plant the closed tab's record, or use a real save and a reload.
