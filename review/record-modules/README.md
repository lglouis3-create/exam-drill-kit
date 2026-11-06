# Module parts in per-tab records (2026-11-06)

Found by the independent review of kit PR #66 (head dc68a31): a tab's last save (the per-tab
record `<ns>:pending:<profile>:<tab>`, kit #45) could be removed while it held a feature module's
part of the progress that the stored progress lacked. worksheets-ink keeps its writing in
`DB.ink`; equation-drill keeps its records in `DB.eq` and changes them without an answer.

## Where a record's non-answer parts could be dropped (core/shell.html at main 3f8ba20)
- **Placement** (`settlePending` → `settleOne` → `placeOf`):
  - if the stored progress went on from the record's last answer, the result was `'in'` ("nothing to add") whenever the settings and mark matched;
  - if the record had no answers and the stored progress had some (and no mark), the result was `'in'`.

  Neither compared module parts. **Fixed:** `moduleAhead` makes both `'apart'` / `'conflict'`, so the record becomes a copy.
- **The 60 s retirement** (`pendingDone`): it removes a record only when `placeOf` says `'in'` or a copy holds the record's whole progress. So it removed exactly the records above. **Fixed by the same change.**
- **Recovery at start-up** (a reload): the page that opens takes the lock and settles the earlier page's record through the same path. **Fixed and tested** (the reload case).
- **Profile switch** (`claimProfile`): the same path on the new profile's records. **Fixed by the same change; not tested on its own.**
- **Put back, Erase, a replacing Import, Delete the copies** (`pendingRetire`): records seen at that moment are marked handled and never placed. `pendingDone` still removes one only with proof that it is stored. A retired record with a module part ahead of the stored progress now stays in storage, unplaced, where before it was removed. It stays because the student chose the newer state; it takes room in storage and shows in the storage list as a pending record. **Not changed further.**
- **This tab's own record under a full storage** (`dropOwnRecordIfStored`, kit #47): the stored progress is this tab's own later write, so its module part is the newer one. **Exempt** (`placeOf(..., true)`), so "study progress first" works as before.
- **Paths that already kept every part:**
  - `'continues'` with this tab unchanged: the record's whole progress becomes the progress;
  - `'conflict'`, `'continues'` and `'apart'`: the whole progress becomes a copy;
  - Put back restores a copy's whole progress.

## Which parts count as a module's
Any key of the progress outside the core's own parts: `views.js` `NOT_COMPARED` (v, created, fsUndo, fsHistory, answers, qn, settings) and `ENTRY_MAPS` (concepts, arms, fsrsQ, fsrsC). Import uses the same rule (`addsTo`, `continuesHere`). So every module counts, not only ink and eq. No module declares a merge rule (`core/features.js` has no such hook), so the record is kept as a copy.

## Evidence
- `before-main-3f8ba20.log`: `core/record_modules_test.js` against main's core, 6 of 15 checks failing (DB.ink, DB.eq and a third module key behind; other DB.ink behind; DB.eq with no answers; the reload case). The controls pass.
- `after-fix.log`: the same test with the fix, 15 of 15.
- Two tabs with real cross-tab lag: not produced deterministically; the cases plant the closed tab's record, or use a real save and a reload.
