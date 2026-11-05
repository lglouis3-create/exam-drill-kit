# IndexedDB investigation (2026-11-04 and 2026-11-05)

An investigation only: nothing in `core/` uses IndexedDB, and no course changes.

- `REPORT.md`: the specification reading, the prototype results, and the migration and recovery outline, with the decisions it needs from Louis.
- `proto/`: the reproducible prototype.
  - `run.js <chromium|webkit>`: tests T0-T5;
  - `hold.js <chromium|webkit>`: T6, T6b, T7;
  - `page.html`: the page they drive;
  - `server.js`: a local server;
  - `manual.html`: the same functions behind buttons, for the iPhone and iPad steps.
  - `manual-plus.html` and `manual-lab.js` (2026-11-05): `manual.html` plus the storage-full and interrupted-upgrade buttons (steps 7 and 8);
  - `quota.js <chromium|webkit> [capMB] [webkitCeilingMB]`: Q0-Q4, quota failure (Chromium caps the quota through the DevTools protocol);
  - `quota-reclaim.js`: Chromium only, when a database refuses small writes again after a refused large one;
  - `upgrade.js <chromium|webkit>`: U1-U5, interrupted upgrade and an old tab during an upgrade;
  - `manual-smoke.js`: Chromium only, clicks the buttons of `manual-plus.html`;
  - `server2.js`: the server for those four scripts (`server.js` is unchanged).
- `logs-2026-11-05/`: the runs of the new scripts in this container (Chromium).
- `idb-prototype.yml.proposed`: the workflow with the new steps, for the owner's pull request to place in `.github/workflows/`.
- `logs-2026-11-04/`: the first runs in this container (Chromium; WebKit could not start there).
- `SAFARI_CHECKLIST.md`: the steps for real iPhone and iPad Safari.
- `.github/workflows/idb-prototype.yml`: runs `run.js` twice and `hold.js` in Chromium and WebKit on GitHub when the prototype changes, or by hand. It keeps the logs as an artifact. It is not a kit check.

To run locally: `cd proto && NODE_PATH=$(npm root -g) node run.js chromium` (Playwright 1.63.0; do not run `playwright install` in the cloud container).
