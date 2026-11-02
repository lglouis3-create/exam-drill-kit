# Baseline evidence (coordinator-verified)

Run by the "Kit feature porter" coordinator session on 2026-11-02 (started 18:50:51 UTC), in the cloud container (Chromium only).

## Inputs
See `inputs.txt`:
- kit `origin/main` `ac5c64491d9f9bf565ce3b4701c31db52633647c`;
- core tree `daac6e234e10dae4a60c67f14cc575e9a0256f6c`;
- template tree `cbac5bd425d480944293f8e1fb5d5d703e8baba1`;
- Medicinal-chemistry `main` `f1f5ee57840f014cf5ccebd9631b4f413226ea70`;
- Node v22.23.4, Python 3.13.18.

A port branch may cite these results instead of rerunning them only when its own core and template tree hashes are exactly the two above (`git rev-parse <commit>:core`, `:template`), and the Medicinal-chemistry commit is the one above.

## Commands
The script that ran them is `baseline.sh`, which uses `mkcourse.sh`.

| Step | Command | Exit code | Log |
|---|---|---|---|
| Template course, no module: build | `python3 build.py` | 0 | `logs/off-build.log` |
| Template course, no module: checks | `./run_checks.sh` | 0 | `logs/off-run_checks.log`, per-check logs in `logs/off-checks/` |
| Medicinal-chemistry with the kit core: checks | `./run_checks.sh` | 0 | `logs/mc-run_checks.log`, per-check logs in `logs/mc-checks/` |

Exit codes are also in `exit-codes.txt`. The SHA-256 of the no-module course's built files are in `off-built-files.sha256`. Those files carry a build stamp, so later builds differ in that stamp only.

## Results
- Template course, no module: 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`).
- Medicinal-chemistry with the kit core: 22 PASS, 0 FAIL, 3 NOT RUN, 1 REPORT.
  - NOT RUN: `stepper_test.js` (no step-through figures in DIA), `cite_check.py` (no lecture PDFs), `state_check.js` (the clone is too shallow).
  - REPORT: `explain_check.js`, 363 of 479 questions carry at least one explanation issue.

## Not run
WebKit, Safari, iPhone, iPad, Apple Pencil.

## Note on this branch's history
The branch's first commit (`990bd60`) holds a copy of `main`'s files by mistake: `git rm` failed on the new orphan branch, and the commit ran anyway. The second commit replaces that copy with this evidence. Nothing in the first commit is new; it is the content of `main` at `ac5c644`.

## Second baseline: kit `main` `98e7b5b` (coordinator-verified)

Folder `main-98e7b5b/`, run 2026-11-02 from 20:14:19 UTC with the same `baseline.sh` (output folder `baseline2`, and a `git worktree prune` before the worktree is made). Inputs (`main-98e7b5b/inputs.txt`): kit `98e7b5b9d42d1bc81b84ab6a06eadf554035ecba`, core tree `c9fde5b23f43746ff8d392314f86e8ff313c1cda`, template tree `cbac5bd425d480944293f8e1fb5d5d703e8baba1`, Medicinal-chemistry `f1f5ee57840f014cf5ccebd9631b4f413226ea70` (full clone).

| Step | Exit code | Result |
|---|---|---|
| Template course, no module: `python3 build.py` | 0 | built |
| Template course, no module: `./run_checks.sh` | 0 | 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT (`explain_check.js`) |
| Medicinal-chemistry, full clone, with the kit core: `./run_checks.sh` | 0 | 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures; `cite_check.py`: no PDFs), 1 REPORT |

`home_test.js` passed (33 checks) in this run. It is intermittent (core finding 9), so one pass does not show it fixed. An earlier attempt at this run failed before any check ran because the worktree for `main` was missing; its output was discarded and is not cited.

Port branches whose core and template trees are `c9fde5b` and `cbac5bd` may cite this run.

Note: commit `22b4290` removed the folder `mc-full-clone/` by mistake; commit `a18eadb` restored it unchanged from `51b524d`.

## Third baseline: kit `main` `366caf6` (coordinator-verified)

Folder `main-366caf6/`, run 2026-11-02 from 21:52:12 UTC with `baseline.sh` (output folder `baseline3`). Inputs: kit `366caf6a0a0e7ec0f651e3673e9268afb7e9b07e` (kit PR #27 merged), core tree `d588c64f900ec13ca7afec70554f9c5b864a8449`, template tree `cbac5bd425d480944293f8e1fb5d5d703e8baba1`, Medicinal-chemistry `f1f5ee57840f014cf5ccebd9631b4f413226ea70` (full clone).

| Step | Exit code | Result |
|---|---|---|
| Template course, no module: `python3 build.py` | 0 | built |
| Template course, no module: `./run_checks.sh` | 0 | 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT |
| Medicinal-chemistry, full clone, with the kit core: `./run_checks.sh` | 0 | 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`, `cite_check.py`), 1 REPORT |

`home_test.js` passed (33 checks) in both runs. Its fix, kit PR #28, is not on this main. By Louis's rule of 2026-11-02, a pass is not proof that the check is fixed, and a failure is not exempt.

Port branches whose core and template trees are `d588c64` and `cbac5bd` may cite this run.
