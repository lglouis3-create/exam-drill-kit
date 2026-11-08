# The ink validation page, ready for its own site

`index.html` here is the page for the phone and tablet runs of `../README.md` §6. It was built
by `build.sh`:
- the core of kit commit 7596e6e (this pull request merged with main 09b3f9a);
- Medicinal-chemistry at 97ecf8b (public repository);
- `../make_device_page.js`.

The page is about 7.4 MB. It uses the storage namespace `ink-validation` and synthetic data only. "Clean up" removes everything it stored. After any later change to `core/`, run `build.sh` again from the kit's root and commit the new `index.html`.

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

To check that the published file is this one, compare the SHA-256 of `index.html` here (3133b43b79089c65267e70a69388ba172bac3c1d8310e2032d3ed4ca5af66c64, built from 7596e6e) with the one served. Open the page and read the panel's top line, which shows the browser, Event Timing and the database state.

## On the devices

Use an iPhone or iPad in Safari, and an Android phone in Chrome. The steps are in `../README.md` §6:
1. For each of the three samples:
   - prepare it;
   - run 3 rounds of 5 saves, tapping the blue button about 8 times after each save;
   - reload the page;
   - press Check after reload.
2. Run the storage-full test. This is safe only on this separate site.
3. Press Copy results and send the results.
4. Press Clean up.
