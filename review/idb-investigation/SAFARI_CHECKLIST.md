# IndexedDB on a real iPhone and iPad (Safari): checklist

GitHub's WebKit job runs Safari's engine on Linux, not the Safari app. These steps need Louis's own iPhone and iPad. The page is `proto/manual.html`. It uses its own database ("proto") and touches no course's saved progress.

**The page needs an HTTPS address.** This is for Louis to choose:
- turn on GitHub Pages for the exam-drill-kit repository, which would serve it at a kit address, not a course's;
- or allow a copy on another address.

A course site would change a live site, so it is not used.

**Before you start.** On each device, write down the iOS or iPadOS version (Settings, General, About).

1. **Opens.** Open the page and press **Probe**. Expected: `indexedDB: true` and `hasLocks: true`. Write down the line.
2. **Two tabs, one record.** Press **Reset** once. Open the page in a second Safari tab. Press **Run 300** in each tab, one right after the other. When both say "finished", press **Check**.
   - Expected: total 600, entries 600, lost 0, duplicates 0, "saw = position 600 of 600".
   - Write down the line.
3. **A tab closed mid-way.** Press **Reset**. Press **Run 300** in tab 1 and close tab 1 at once. In tab 2, press **Check**.
   - Expected: lost 0, duplicates 0, and "saw = position" equal to the entries. Fewer than 300 entries is fine: they are the ones finished before the close.
4. **Switching apps.** Press **Reset**, press **Run 300**, switch to another app for 30 seconds, come back, and press **Check**. Expected as in step 3.
5. **Home Screen copy.** Add the page to the Home Screen, open it from there, and repeat step 1. The Home Screen copy keeps storage of its own, separate from Safari's (WebKit bug 181849, as BDK's notes record).
6. **Private Browsing.** Open the page in a Private tab, press **Probe**, and write down whether IndexedDB opens.
7. **Storage full:** not part of this list. It needs a page that fills storage on purpose; that is a separate step if you want it.

Send the line from each step, with the device and its version. A step that could not be done is written NOT RUN.
