# IndexedDB for the kit core: specification check, cross-tab prototype, migration outline

Investigation only (2026-11-04 and 2026-11-05). No core or course file is changed. Prototype: `proto/` (server.js, page.html, run.js for T0-T5, hold.js for T6, T6b, T7; manual.html for the devices). Logs: `logs-2026-11-04/` (this container) and `logs-ci-2026-11-05/` (GitHub). The specification source `index.bs` was read from w3c/IndexedDB at commit f9f83f196f8501429282ff1747ebcbe35d41381a; it is not copied here.

## 1. Specification

The session proxy refused https://w3c.github.io/IndexedDB/ and https://www.w3.org/TR/IndexedDB/. The specification source `index.bs` was read from the public repository w3c/IndexedDB:
- commit f9f83f196f8501429282ff1747ebcbe35d41381a, dated 2026-10-30;
- "Indexed Database API 3.0", Status ED.

https://www.w3.org/TR/IndexedDB/ was also read through a scraper on 2026-11-04. It reports "W3C Working Draft, 30 October 2026" at the same revision.

**Transaction scheduling.**
- §2.7: "Two transactions have overlapping scope if any object store is in both transactions' scope."
- §2.7: "Multiple "readwrite" transactions can't be started at the same time if their scopes are overlapping."
- §2.7.2, normative: "A read/write transaction tx can start when there are no transactions which: Were created before tx; and have overlapping scopes with tx; and are not finished." A read-only transaction waits only for earlier unfinished read/write transactions that overlap it. "Implementations may impose additional constraints."
- §2.7.1: a commit is all or nothing ("the implementation must not write any of the changes" on error), and an abort rolls back.

**Across tabs.**
- §2.1: "There may be multiple connections to a given database at any given time."
- The scheduling rules apply to all transactions on the database. They have no condition about one connection or one browsing context.
- No sentence names other tabs or other connections. Reading the rules as covering tabs of one origin is the direct reading, and Chromium behaved that way (T6).
- The order of two tabs' transactions is not defined: the rules give exclusion, not which tab goes first.

**Durability (§2.7).** "strict", "relaxed" and "default" are all hints ("may"). None guarantees that a committed transaction survives a crash or power loss. §5.4: `complete` fires only after the write.

**A page closed with a transaction open.**
- §2.1.1: when the page's execution context is destroyed, "the connection is closed".
- §5.2: transactions are aborted only when the forced flag is set (for example, the site's storage is cleared). Otherwise the close waits "for all transactions created using connection to complete".
- The text does not say that unload aborts an open transaction.

**versionchange / blocked (§5.1, §2.7.3, §2.8.2).** An upgrade fires `versionchange` at the other open connections. If any of them stays open, `blocked` follows and the upgrade waits until they close.

**QuotaExceededError (§3, §5.4).** A write error at commit aborts the whole transaction, so none of its changes are stored.

**Not read:** the Storage Standard (quota sizes, eviction, storage keys); Safari and Firefox notes.

## 2. Prototype in the cloud container (Chromium 153.0.8010.12 headless; WebKit could not start there: "Executable doesn't exist at /opt/pw-browsers/webkit-2359/pw_run.sh"; see 2b for WebKit)

All pages were in one browser context, so one origin's storage, served from http://localhost. Each transaction:
- reads `kv/state`;
- appends {tab, i, saw: count};
- writes count+1.

**T1, three tabs doing concurrent read-modify-write** (logs-2026-11-04/chromium-run1.log and chromium-run2.log):

| Run | Durability | Transactions | Lost | Duplicates | saw = position | Tab switches |
|---|---|---|---|---|---|---|
| 1 | default | 1,500 | 0 | 0 | 1,500 | 266 |
| 1 | relaxed | 900 | 0 | 0 | 900 | 98 |
| 1 | strict | 900 | 0 | 0 | 900 | 145 |
| 2 | default | 1,500 | 0 | 0 | 1,500 | 212 |
| 2 | relaxed | 900 | 0 | 0 | 900 | 137 |
| 2 | strict | 900 | 0 | 0 | 900 | 148 |

**T6, another tab's readwrite transaction waits for the open one** (logs-2026-11-04/chromium-hold.log). Tab A held a transaction for 1,000 ms, and tab B created one about 200 ms in. In 3 of 3 repetitions, B's first request finished at +1,000 or +1,001 ms.

**T2, a tab closed mid-way while a survivor tab wrote 300 transactions.**
- Snapshots with a half-done transaction: 0 of 491, 470, 419, 376, 395 and 343 snapshots (2,494 in all).
- The survivor completed 300 of 300 each time.
- Every reported `complete` was stored. Some transactions were stored without their `complete` reaching the test before the close: 1 in run 1 repetition 3, 2 in run 2 repetition 3.

**T7, a tab closed with a readwrite transaction open after a put** (logs-2026-11-04/chromium-hold.log). In 3 of 3 repetitions the other tab read `undefined`: the open transaction was not committed. That is Chromium's behaviour; the specification does not require it.

**T3, the same read-modify-write in localStorage, as a control:**
- without a gap: 900 writes kept 739 (161 lost) in run 1 and 503 (397 lost) in run 2;
- with a 1 ms gap between read and write: 300 writes kept 100 (200 lost) in both runs.

**T4/T5, versionchange:**
- an old connection left open blocks the upgrade until close() is called or its page closes;
- a connection that closes itself on `versionchange` causes no `blocked`.

**Not run:**
- WebKit and real Safari;
- Firefox;
- quota errors;
- private mode or IndexedDB being unavailable;
- crash or power loss;
- frozen background tabs, bfcache, reload and navigation;
- separate windows.

## 2b. WebKit (GitHub run 41952037061, 2026-11-05)

The workflow in this pull request ran `run.js` twice and `hold.js` once in each engine on GitHub's Ubuntu runners. WebKit reported version 26.6 (Safari's engine on Linux, not the Safari app); Chromium 153.0.8010.12. Logs: `logs-ci-2026-11-05/`.

| Test | WebKit | Chromium |
|---|---|---|
| T0 probe | durability default/strict/relaxed accepted; commit(); Web Locks present | the same |
| T1, three tabs, read-modify-write (both runs) | 3,300 transactions per run (1,500 default, 900 relaxed, 900 strict), lost 0, duplicates 0, saw = position for all | the same |
| T2, a tab closed mid-way (3 repetitions, both runs) | 0 snapshots with a half-done transaction (1,388 and 1,387 snapshots); every reported `complete` stored | 0 (1,732 and 1,738); in one repetition 1 transaction committed without its `complete` reaching the test |
| T6, a second tab's readwrite waits for the open one | 3 of 3 (B's first request at +1,000 ms, A finished at +1,000 ms) | 3 of 3 |
| T6b, a readonly in B while A holds readwrite | waited 796 ms, read A's committed value | waited 797 ms, the same |
| T7, a tab closed with its readwrite open (after a put) | not committed, 3 of 3 | not committed, 3 of 3 |
| T3, the same in localStorage (control) | lost 327 and 475 of 900 (no gap); 200 of 300 with 1 ms gap, both runs | lost 76 and 214 of 900; 200 of 300 |
| T4/T5 versionchange | an old connection left open blocks the upgrade until it closes or its page closes; closing on versionchange avoids `blocked` | the same |

Sums checked: WebKit T2 snapshots 530 + 455 + 403 = 1,388 and 529 + 455 + 403 = 1,387; Chromium 629 + 567 + 536 = 1,732 and 627 + 570 + 541 = 1,738.

Still NOT RUN: the Safari app on an iPhone or iPad (`SAFARI_CHECKLIST.md`), Firefox, storage full, crash or power loss, background tabs frozen by the system.

## Decisions for Louis before any production storage change (summary of section 3)

1. Whether to move at all, and for which courses, after the iPhone and iPad checklist.
2. What moves: the whole progress, or only an append-only log of saves beside today's localStorage.
3. A save that an old-core tab makes after the move: merged into the live progress, or kept as a copy.
4. IndexedDB unavailable (private mode, an old Safari): stay on localStorage with a notice, or silently.
5. The localStorage data left after the move (kept until you delete it): how it is shown and deleted, since it still counts against the localStorage limit.
6. Whether the one-writer lock stays once saves are checked inside transactions.
7. Going back to an older core after the move shows the progress as of the move: accept, or keep writing a localStorage copy for a while.
8. The durability setting for saves: strict or default.

## 3. Migration and recovery outline (not implemented)

**Data model.**
- One database per course (`ns`), with stores `meta`, `progress`, `log` (append-only), `backups` (one record per copy) and `exam`.
- Each save is one readwrite transaction:
  - read the profile's `rev`;
  - if it equals the rev this tab last read, write the save and rev+1;
  - otherwise merge or stop in that same transaction, using Import's rules.
- This would replace SEEN/SEEN_LOG, the `<ns>:pending:*` records, `<ns>:pending-seen:*` and the 60 s cleanup rule.

**One-time move.**
- It runs in one transaction:
  - if `meta` for the profile exists, it stops;
  - otherwise it reads the localStorage keys, checks them as Import does, and writes everything plus `meta`.
- An interrupted move stores nothing and is retried on the next load.
- localStorage keys are never deleted by the move, under Louis's rule to keep every backup. A marker `<ns>:moved:<profile>` is added.

**Old-core tabs still open.**
- They keep writing localStorage until they are reloaded.
- The new core takes the existing writer lock before moving a profile.
- Afterwards, an old-core save to the old keys is handled once: merged or kept as a copy (for Louis to decide).
- The new core closes its connection on `versionchange`.

**IndexedDB unavailable or cleared.**
- If IndexedDB cannot be opened, or its first write fails, the page stays on localStorage, says so, and retries on the next load.
- If the database is cleared while the page is open, the page stops and offers to rebuild from the kept localStorage data or an export, never silently.
- Which browsers and modes refuse IndexedDB: not checked; this needs a Safari test.

**Export and Import.**
- Export is one read-only transaction (one consistent snapshot), in the same file format as now.
- Import is one transaction.
- The localStorage data left by the move is shown as copies "from before the move" until Louis deletes them.

**Decisions for Louis:**
1. Whether to move at all. WebKit is now run on GitHub (section 2b); the Safari app on an iPhone or iPad is not yet tested (SAFARI_CHECKLIST.md).
2. Whole progress in IndexedDB, or only an append-only log of saves.
3. An old-core save after the move: merged, or kept as a copy.
4. IndexedDB unavailable: fall back with a notice, or silently.
5. How the kept localStorage data is shown and deleted; it still counts against the localStorage limit.
6. Whether the one-writer lock stays.
7. Going back to an older core shows progress as of the move: accept that, or keep a localStorage copy for a while.
8. Durability for saves: strict or default.

## 2c. Quota failure and interrupted upgrade (Chromium 153.0.8010.12 in this container, 2026-11-05)

Scripts: `proto/quota.js`, `proto/quota-reclaim.js`, `proto/upgrade.js`, `proto/manual-smoke.js`; page functions in `proto/manual-lab.js`. Logs: `logs-2026-11-05/`. Each script ran twice; the counts below are from both runs. WebKit: NOT RUN here (not installed); `idb-prototype.yml.proposed` adds the runs on GitHub.

**Specification** (`index.bs` at f9f83f1, cited by section title). "Committing a transaction": "If an error occurs while writing the changes to the database, then run abort a transaction with transaction and an appropriate type for the error, for example a QuotaExceededError". "Connection": if the execution context of a connection "is destroyed (for example due to the user navigating away from that page), the connection is closed"; "Opening a database connection": "If connection was closed, return a newly created "AbortError" DOMException"; "Aborting an upgrade transaction" reverts the version and the object stores. The note on `commit()`: a transaction "will automatically commit when all outstanding requests have been satisfied and no new requests have been made", so an upgrade cannot wait on a timer; `upSlow` fills its gap with chained requests.

**Quota (origin capped at 5 MB with `Storage.overrideQuotaForOrigin`; `navigator.storage.estimate()` still reported 3,072 or 4,096 MB, so the override is not visible to the page).**
- Q1, records of 0.25, 0.5, 1, 2, 2 MB: transaction 5 (2 MB) refused with `QuotaExceededError` at commit (`put` did not throw), after 3.755 MB committed, in 4 of 4 repetitions. The refused transaction's 1 KB `pre-5` record was not stored (4 of 4). Earlier committed records intact: 9 of 9, read in the same connection, after reopening and after later writes (4 of 4).
- Q1, a later 1 KB transaction in the same database: refused (`QuotaExceededError`), 4 of 4; a later 1 MB one: refused, 4 of 4. Usage then read 5.84 MB.
- Q2, two stores in one transaction (progress rev 1 to 2, plus a 2 MB log entry), storage nearly full, in both orders: aborted, progress still rev 1, log keys [1], 8 of 8. The later small two-store transaction: refused, 4 of 4.
- Q3, the same on empty storage with a 6 MB log entry: aborted, rev 1, log keys [1], 4 of 4; the later small transaction in that database: refused, 2 of 2.
- Q4 (2 runs), after a refused 6 MB write (usage 6.07 MB): a 1 KB write in the same database refused at once, 2 of 2; a 1 KB write in another database succeeded, 2 of 2, and usage then read 0.14 MB; from then on writes in the same database succeeded (after 10 s, after a reload, from a second page; 2 of 2 each).
- Reclaim check without the other database's write (`quota-reclaim.js`): 1 KB writes in the same database were refused at once, after 5 s, after a reload and after 35 s, with usage at 6.07 MB, 2 of 2 runs; they succeeded after a second page was opened and the first closed (usage 0.07 MB). Why the refused bytes stay counted, and what clears them, is not known (not read in Chromium's code).
- `manual-smoke.js` (the buttons, 5 MB cap): Fill refused at a 4 MB record after 3.003 MB, `QuotaExceededError`, 5 of 5 intact; Both stores rev 1, log keys [1]; Delete freed it (usage 0.07 MB).

**Interrupted upgrade (2,000 records of 1 KB; v2 copies them in chunks of 100).**
- U1, the upgrading page closed after 300 copied: then version 1, stores ["items"], 2,000 of 2,000 intact, no `items2`; a fresh upgrade completed with `items2` = 2,000. 6 of 6.
- U2, the same with the page reloaded instead of closed: the same results, 6 of 6.
- U3, an old tab holding v1 that ignores `versionchange`: the upgrading tab got `blocked 1->2` and copied 0; the old tab got `versionchange 1->2` and could still start a transaction; after the blocked tab was closed, version 1, 2,000 intact. 2 of 2.
- U4, an old tab that closes on `versionchange`: a transaction on its closed connection threw `InvalidStateError`; its reopen at v1 waited until the upgrading tab was closed mid-upgrade and then opened v1 (after 514 and 522 ms); version 1, 2,000 intact. 2 of 2.
- U5, the same with the upgrade left to finish: the old tab's reopen at v1 failed with `VersionError` (after 1,934 and 1,943 ms); version 2, `items2` = 2,000. 2 of 2.

## 4. Recommended defaults for the eight decisions (for Louis to approve or change)

One plan: progress and its log move together into one IndexedDB database per course, in one transaction, with nothing in localStorage deleted, and every refusal shown. The evidence is from the prototype runs only (no student data); no number below is a guess, and every "unverified" item is a gap.

1. **Move at all: yes, but only after the device checklist passes on both the iPhone and the iPad, and course by course, never in a week with that course's quiz or exam.** Reason: localStorage lost updates between tabs in every run (T3: WebKit lost 327 and 475 of 900, Chromium 76 to 397 of 900), IndexedDB lost none (T1: 3,300 of 3,300 per run in both engines). First course: Medicinal Chemistry (live on the core, its exam passed on 9/21, none recorded later). BDK only after its Cumulative on Mon 11/30. Depends on the iPhone and iPad results: steps 2, 3, 4, 6, 7, 8.
2. **What moves: the whole progress and the answer log, written in the same transaction.** Reason: under quota, a two-store transaction was all or nothing (Q2/Q3: rev 1 and log keys [1] in 12 of 12), so progress and log cannot disagree; keeping progress in localStorage keeps its lost updates (T3). Study progress first: when a save is refused, the core retries the progress alone, keeps the log entry in memory, and says so (Q1 showed a later small write in the same database can also be refused, so the notice must offer Export). Depends on the device results: steps 2, 3 and 8.
3. **An old-core tab's save after the move: merged with Import's rules, and the old-core save also kept as a backup copy.** Reason: study progress first (its answers count) and keep every backup (the raw save stays until Louis deletes it); the merge is shown in one line, never silent. Does not depend on the device results.
4. **IndexedDB unavailable or its first write refused: stay on localStorage, with a visible notice, and retry on the next load.** Reason: nothing lost silently. Which Safari modes refuse it is unverified. Depends on the device results: steps 1, 5 and 6.
5. **The localStorage data left by the move: never deleted by the core; listed as "copies from before the move" with their date, deleted only when Louis presses delete for a copy and confirms.** Reason: keep every backup until he deletes it. The localStorage limit still applies to them; its size in Safari is unverified, and the core's existing notice for a refused localStorage write stays. Does not depend on the device results.
6. **The one-writer lock stays through the move and while any old-core tab can still be open; removing it is a later, separate decision.** Reason: IndexedDB already orders readwrite transactions across tabs (§2.7.2; T6 3 of 3 in both engines), but old-core tabs write localStorage and only the lock coordinates them with the move. Partly depends on the device results (step 3).
7. **Going back to an older core: for the first release after the move, each save also writes the progress to its old localStorage key; an old-core save made after a rollback is handled as in decision 3.** Reason: nothing lost silently (a rollback would otherwise show progress as of the move). A refused copy write is shown, not hidden. How long to keep the copy: Louis's choice; no number is recommended without his data. Does not depend on the device results.
8. **Durability: strict for saves and for the move.** Reason: all three settings are hints (§2.7), crash and power loss are NOT RUN, and in the runs strict cost no more than relaxed (T1 elapsed for 900 transactions: WebKit 928 and 924 ms strict, 915 and 923 ms relaxed; Chromium 912, 1,050, 517, 524 ms strict, 890, 1,557, 533, 523 ms relaxed). Speed on an iPhone is unverified (steps 2 to 4 give it).

**What the new results add to the outline.**
- The one-time move should run inside the upgrade transaction (`onupgradeneeded`), reading localStorage synchronously: U1/U2 showed an interrupted upgrade keeps version 1 and all data (12 of 12), so an interrupted move leaves nothing half-done and is retried on the next load. The upgrade must not wait on a timer or the network (the auto-commit note on `commit()`).
- The core's connection must close on `versionchange` and treat `InvalidStateError` or `VersionError` (U4, U5) as "a newer core is open: reload", with a notice.
- A `QuotaExceededError` on a save is a save not made: the answer stays in memory, the notice says so and offers Export (Q1, Q4).
