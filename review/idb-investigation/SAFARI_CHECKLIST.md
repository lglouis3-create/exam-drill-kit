# IndexedDB on a real iPhone and iPad (Safari): checklist

GitHub's WebKit job runs Safari's engine on Linux, not the Safari app. These steps need Louis's own iPhone and iPad. The page is `proto/manual.html`. It uses only its own database ("proto"), and it touches no course's saved progress.

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

Send the line from each step, with the device and its version. A step that could not be done is written NOT RUN.
