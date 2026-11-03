# Fault T1 fix attempt on port/theme: start c85f386, final b742f43 (2026-11-03), agent-run

Every result here is **agent-run** (Chromium, this cloud container) unless it says GitHub. Not
coordinator-verified. The finding, the reproduction and the core change needed are in `FINDING.md`.

## Outcome

- Reproduced: on the 1,879,886-byte everything-on course, 3 of 5 reloads painted the first frame with the
  tabs light while Dark was stored (`logs/first-frame-before.json`).
- A module cannot put a script in `<head>` (`FINDING.md` section 3), so `theme.js` is unchanged and no
  core or template file is changed (`git diff c85f386 b742f43 -- core template` is empty).
- `features/theme/current/test.js` now measures the first frame on a page of 1.5 MB or more and reports a
  light first frame there as a known limit with its measurement (`FINDING.md` section 4). FEATURES.md and
  CHANGELOG.md record it.
- Core change needed: a module.json field for a head script (`FINDING.md` section 5). A hand-made
  prototype on a scratch copy gave 5 of 5 dark (`logs/first-frame-prototype.json`).

## Checks (agent-run unless marked GitHub)

| Check | Course | Result | Exit | Log |
|---|---|---|---|---|
| first-frame probe, before | everything-on, 1,879,886 bytes | 3 of 5 first frames light | 0 | `logs/first-frame-before.json` |
| first-frame probe, head-script prototype (scratch only) | same page plus the snippet, 1,880,051 bytes | 0 of 5 light | 0 | `logs/first-frame-prototype.json` |
| theme test, new | everything-on scratch copy, 1.89 MB | PASS 42 checks, 1 skipped (known limit: 3 of 5 light) | 0 | `logs/theme-test-everything-on.log` |
| theme test, new, first run | template + theme (273,848 bytes; padded copy 1,564,690 bytes) | PASS 44, 1 skipped (3 of 5 light on the padded copy) | 0 | `logs/module-test-run0.log` |
| theme test, rerun 1 | same | PASS 44, 1 skipped (1 of 5 light) | 0 | `logs/module-test-run1.log` |
| theme test, rerun 2 | same | PASS 44, 1 skipped (3 of 5 light) | 0 | `logs/module-test-run2.log` |
| theme test, rerun 3 | same | PASS 44, 1 skipped (3 of 5 light) | 0 | `logs/module-test-run3.log` |
| mutation: theme.js line 39 delayed 300 ms (scratch) | template + theme | FAIL 8 of 44 (small-page first frame 3 of 3 light, among others) | 1 | `logs/mutation-settimeout.log` |
| mutation: line 39 moved into `X.start` (scratch) | template + theme | PASS 44, 1 skipped: not caught (no flash on a small page either) | 0 | `logs/mutation-xstart.log` |
| `core/ci_course.sh module:theme chromium` | template + theme, kit b742f43 | 26 PASS, 0 FAIL, 1 NOT RUN (cite_check.py: no lecture PDFs), 1 REPORT (explain_check.js) | 0 | `logs/ci-module-theme.log` |
| contrast sweep (`evidence/integration` 1329222 `scripts/contrast_test.js`, unchanged) | everything-on, with the new test.js | PASS 6: 0 low-contrast items in 112 views with the device dark and 112 with Dark picked; control found; no page or module error | 0 | `logs/contrast-everything-on.log`, `logs/contrast-views/` |
| GitHub "Kit checks" run 41564143629 on b742f43 | 7 jobs | completed, success; every job success | - | `logs/github-jobs-b742f43.tsv`, `logs/github-job-125681530460-module-theme.log` |

GitHub module:theme job: `features/theme/test.js` 44 checks passed (1 skipped: the known limit on the
1.56 MB page); 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT.

## NOT RUN and skipped

- `cite_check.py` (no lecture PDFs; documented exclusion).
- WebKit / Safari: the first-frame measure was not run in WebKit locally (not installed). The GitHub WebKit
  job runs the template course only, without the theme module.
- The everything-on course's full `run_checks.sh` was not rerun (only its build, the theme test, the probe
  and the contrast sweep); its other faults (D1, P1, P2, N1) are unchanged.
- Contrast views not reached are listed in the contrast log, as in `evidence/integration-3`.
- Contrast screenshots (226 files) are not copied here; the views JSON files are.

## Files

`FINDING.md`; `scripts/build_course.sh` (`core/ci_course.sh` of the patched scratch kit up to the checks,
kit from `$KIT`), `scripts/first_frame.js` (the probe), `scripts/contrast_test.js`; `logs/`.
