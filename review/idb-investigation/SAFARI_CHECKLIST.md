# IndexedDB on a real iPhone and iPad (Safari): checklist

GitHub's WebKit job runs Safari's engine on Linux, not the Safari app. These steps need Louis's own iPhone and iPad. The page is `proto/manual-plus.html` (`proto/manual.html` with the buttons of steps 7 and 8 added; it loads `proto/manual-lab.js`). It uses only its own databases ("proto", "proto-quota", "proto-quota2", "proto-upgrade"), and it touches no course's saved progress.

**Its address.** It needs an HTTPS address. The proposed one is the kit repository's Pages site, https://lglouis3-create.github.io/exam-drill-kit/ (pull request #52, not enabled). That is the same origin as the drill sites (lglouis3-create.github.io), so the test database counts against the same storage. The page never reads or writes a drill's data.

**Before you start.** On each device, write down the iOS or iPadOS version (Settings, General, About).

**How to read Check:**
- **total and entries agree, duplicates 0, "saw = position" equal to entries:** no update was lost.
- **tab switches above 1:** the two tabs really ran at the same time. At 0 or 1 the step did not test two tabs together; do it again with the taps closer.

1. **Opens.** Press **Probe**. Expected: `indexedDB: true` and `hasLocks: true`. Write down the line.
2. **Two tabs at the same time.** Press **Reset**. Open the page in a second Safari tab. Press **Run for 20 s** in tab 1, switch to tab 2 within a few seconds, and press **Run for 20 s** there. Then stay on tab 2.
   - Wait until both report "finished". Tab 1 may finish only when you return to it.
   - Press **Check**. Expected: total = entries, duplicates 0, saw = position for all, tab switches above 1.
   - Write down the line.
3. **A tab closed while both run.** Press **Reset**. Press **Run for 20 s** in tab 2, then in tab 1, and close tab 1 about 5 seconds later.
   - In tab 2, wait for "finished" and press **Check**. Expected: total = entries, duplicates 0, saw = position for all.
   - Write down the line.
4. **Switching apps.** Press **Reset**, press **Run for 20 s**, switch to another app for 30 seconds, come back, wait for "finished", and press **Check**. Expected as in step 3.
5. **Home Screen copy.** Add the page to the Home Screen, open it from there, and repeat step 1. The Home Screen copy keeps storage of its own, separate from Safari's (WebKit bug 181849, as BDK's notes record).
6. **Private Browsing.** Open the page in a Private tab, press **Probe**, and write down whether IndexedDB opens.
7. **An upgrade interrupted.** Press **Upgrade: prepare v1**. Expected: `"version":1,"items":2000`.
   - Press **Upgrade: start slow**. The status shows "upgrading 1->2" and the copied count rises by 100 about every 1.5 s, for about 30 s.
   - While it says "upgrading", close the tab.
   - Open the page in a new tab and press **Upgrade: check**. Expected: `"version":1`, `"stores":["items"]`, `"items":2000`, `"itemsIntact":2000`, and no `items2`.
   - Press **Upgrade: finish**. Expected: `"version":2`, `"items2":2000`.
   - Write down both lines.
   - **7b, an old tab open.** Press **Upgrade: prepare v1**. In a second tab press **Hold v1 (old tab)**. In tab 1 press **Upgrade: start slow**. Expected: the status shows `blocked 1->2` and copied stays 0. Close tab 2. Expected: tab 1's status changes to "upgrading". Write down the two status lines.
8. **Storage full.** This page has the same origin as the drill sites, so this step fills the storage they share.
   - First, in every drill site on this device, use its export (**Export progress**) and keep the files.
   - Press **Fill until refused**. It writes records of 1, 2, 4, up to 32 MB and stops at the first refusal or at 1,024 MB. It can take several minutes. If Safari asks to allow more storage, write down its words and choose not to allow.
   - Expected: `"error":"QuotaExceededError"`, `"failedTxPreStored":false`, `"failedTxBigStored":false`, and the three `intact` values each "N of N".
   - Press **Both stores at once**. Expected, for "progress first" and for "log first": `"result":"abort"` and `"after":{"rev":1,"logKeys":[1]}`.
   - Press **Delete quota test data**, then close the tab.
   - Write down the Fill line, the Both stores line and the Delete line. If Fill reports "none: stopped at the ceiling", write that down; Both stores is then NOT RUN.

Send the line from each step, with the device and its version. A step that could not be done is written NOT RUN.
