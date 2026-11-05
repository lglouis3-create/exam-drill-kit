# IndexedDB investigation (2026-11-04 and 2026-11-05)

An investigation only: nothing in `core/` uses IndexedDB, and no course changes.

- `REPORT.md`: the specification reading, the prototype results, and the migration and recovery outline, with the decisions it needs from Louis.
- `proto/`: the reproducible prototype.
  - `run.js <chromium|webkit>`: tests T0-T5;
  - `hold.js <chromium|webkit>`: T6, T6b, T7;
  - `page.html`: the page they drive;
  - `server.js`: a local server;
  - `manual.html`: the same functions behind buttons, for the iPhone and iPad steps.
- `logs-2026-11-04/`: the first runs in this container (Chromium; WebKit could not start there).
- `SAFARI_CHECKLIST.md`: the steps for real iPhone and iPad Safari.
- `.github/workflows/idb-prototype.yml`: runs `run.js` twice and `hold.js` in Chromium and WebKit on GitHub when the prototype changes, or by hand. It keeps the logs as an artifact. It is not a kit check.

To run locally: `cd proto && NODE_PATH=$(npm root -g) node run.js chromium` (Playwright 1.63.0; do not run `playwright install` in the cloud container).
