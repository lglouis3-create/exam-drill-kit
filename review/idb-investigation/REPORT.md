# IndexedDB for the kit core: specification check, cross-tab prototype, migration outline

Investigation only (2026-11-04). No repository was changed. Prototype: `proto/` (server.js, page.html, run.js for T0-T5, hold.js for T6, T6b, T7). Logs: `logs/`. Specification source: `spec/src/index.bs`.

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

**T1, three tabs doing concurrent read-modify-write** (logs/chromium-run1.log and chromium-run2.log):

| Run | Durability | Transactions | Lost | Duplicates | saw = position | Tab switches |
|---|---|---|---|---|---|---|
| 1 | default | 1,500 | 0 | 0 | 1,500 | 266 |
| 1 | relaxed | 900 | 0 | 0 | 900 | 98 |
| 1 | strict | 900 | 0 | 0 | 900 | 145 |
| 2 | default | 1,500 | 0 | 0 | 1,500 | 212 |
| 2 | relaxed | 900 | 0 | 0 | 900 | 137 |
| 2 | strict | 900 | 0 | 0 | 900 | 148 |

**T6, another tab's readwrite transaction waits for the open one** (logs/chromium-hold.log). Tab A held a transaction for 1,000 ms, and tab B created one about 200 ms in. In 3 of 3 repetitions, B's first request finished at +1,000 or +1,001 ms.

**T2, a tab closed mid-way while a survivor tab wrote 300 transactions.**
- Snapshots with a half-done transaction: 0 of 491, 470, 419, 376, 395 and 343 snapshots (2,494 in all).
- The survivor completed 300 of 300 each time.
- Every reported `complete` was stored.

**T7, a tab closed with a readwrite transaction open after a put** (logs/chromium-hold.log). In 3 of 3 repetitions the other tab read `undefined`: the open transaction was not committed. That is Chromium's behaviour; the specification does not require it.

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
1. Whether to move at all, given that WebKit and Safari are untested.
2. Whole progress in IndexedDB, or only an append-only log of saves.
3. An old-core save after the move: merged, or kept as a copy.
4. IndexedDB unavailable: fall back with a notice, or silently.
5. How the kept localStorage data is shown and deleted; it still counts against the localStorage limit.
6. Whether the one-writer lock stays.
7. Going back to an older core shows progress as of the move: accept that, or keep a localStorage copy for a while.
8. Durability for saves: strict or default.
