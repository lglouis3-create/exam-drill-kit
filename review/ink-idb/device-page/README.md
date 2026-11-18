# The ink validation page, ready for its own site

`index.html` here is the page for the phone and tablet runs of `../README.md` §6. It was built
by `build.sh`:
- the core of kit commit 6ec2b84 (this pull request: the ink layer after the review of f15fe3b, merged with main 64302e2);
- Medicinal-chemistry at 97ecf8b (public repository);
- `../make_device_page.js`.

The page is about 7.4 MB. It uses the storage namespace `ink-validation` and synthetic data only. It writes generated strokes straight into the page store, not through a worksheet draw or erase (the panel says so). Each "prepare" first erases the test profile, so the counts are exactly 0, 69 and 171 pages in sample order and no manual "Clean up" is needed between samples. "Clean up" removes everything it stored. After any later change to `core/`, run `build.sh` again from the kit's root and commit the new `index.html`.

It must be served from its own origin, not from `lglouis3-create.github.io` (`../README.md` §6 gives the reasons).

## Deploy, once Louis has created the organization and repository

What Louis does once:
1. Create a free organization, for example `lglouis3-lab`.
2. In it, create a public repository `ink-validation`.
3. Install the Claude GitHub app on that repository.
4. Tell the kit session the organization's name.

Then the kit session:
1. Clones `https://github.com/<organization>/ink-validation`.
2. Copies this folder's `index.html` to the repository's root, unchanged.
3. Adds a `README.md` naming the kit commit and the Medicinal-chemistry commit above.
4. Commits and pushes to `main`.

Louis then turns Pages on, once: in the repository, Settings → Pages → Deploy from a branch → `main`, folder `/ (root)` → Save.

The page is then at `https://<organization>.github.io/ink-validation/`.

To check that the published file is this one: every rebuild differs only in its BUILD stamp line (the time of the build), so compare the SHA-256 of the file with that line removed: `grep -v '^const BUILD = ' index.html | sha256sum` (532fff63f7d63d03897d0b51ce207cb97b7653739561f55718b83781578bec5a for the `index.html` here); the published copy, fetched with `curl -s https://<organization>.github.io/ink-validation/ | grep -v '^const BUILD = ' | sha256sum`, gives the same. Open the page and read the panel's top line, which shows the browser, Event Timing and the database state.

## On the devices

Use an iPhone or iPad in Safari, and an Android phone in Chrome. The steps are in `../README.md` §6:
1. For each of the three samples:
   - prepare it (this records the manifest: page ids, a hash of each page, the answer count);
   - run 3 rounds of 5 saves, tapping the blue button about 8 times after each save;
   - reload the page;
   - press Check after reload: the panel must show a PASS line, with exactly 0 pages and 0 strokes (sample 1), 69 pages and 2,085 strokes (sample 2), 171 pages and 5,145 strokes (sample 3).
2. Run the storage-full test. This is safe only on this separate site. It passes only when a write ends in state `refused` and the pages stored before it still match their manifest; the panel shows PASS or FAIL. Reload and press Check after reload (every page stored before the test must be there).
3. Press Copy results and send the results.
4. Press Clean up.
