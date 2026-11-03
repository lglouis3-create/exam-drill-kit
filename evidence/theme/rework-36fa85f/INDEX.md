# theme rework to Louis's policy of 2026-11-03 and the coordinator's B5 note (agent-run)

All local results here are agent-run (a rework session, 2026-11-03).

| What | Value |
|---|---|
| Start | `port/theme` `4a548a3` (already merged with `main` `4e0fae4`) |
| Commits | `13ce2a9` (fixture and test), `27728e4` and `36fa85f` (FEATURES.md and CHANGELOG.md only) |
| Final head | `36fa85f53dd8163f727e3b7be72815a019c79ff0` |
| Local checks ran on | `13ce2a9`; `git diff --stat 13ce2a9 36fa85f` touches only FEATURES.md and CHANGELOG.md, which no check reads |

## What changed

- Fixture: `prof` of the four questions (pd-c01, pd-c02, pd-c04, pd-c05), the topic `pkpd` and the lecture L11 is
  the course's (`scripts/cmp.js`: every other field already matched the source at `ac2eb73`); the scratch copy
  adds the course's professor to `COURSE.professors`. Subtopic and lecture ids are prefixed `thm-` too.
  No question of the fixture was ever left out.
- First frame (fault T1; coordinator's B5 note, evaluator files `/tmp/b5-eval/`): both directions (stored Dark on
  a light device, stored Light on a dark device); in Chromium each frame painted until 600 ms after the tabs is
  read from tracing screenshots (lower 70%, mean brightness, light above 128), as `/tmp/b5-eval/scripts/probe2.js`
  and `classify.py` do, with the brightness read in a canvas instead of PIL; 12 reloads on the large page.
  The large-page result is a skip labelled `KNOWN LIMIT T1: <n> of 12 first frames <colour> on a <size> page,
  <case>`, a failure once the page holds a script in `<head>`; a wrong frame on the small page fails.
- A first try read 0 screenshots (no `navigationStart`: the `blink.user_timing` trace category was missing),
  which the "frames are measured" check caught (`logs/trial-test.log`); fixed, and a trace with no
  `navigationStart` now stops the test (`logs/trial-test2.log`).

## Measured (Chromium, template course padded to 1.6 MB; 0.3 MB page for the small case)

| Run | Dark stored, light device: light frames | Light stored, dark device: dark frames | 0.3 MB page, both ways |
|---|---|---|---|
| `ci_course.sh module:theme` | 10 of 12 | 8 of 12 | 0 of 3 |
| module test run 1 | 8 of 12 | 4 of 12 | 0 of 3 |
| run 2 | 9 of 12 | 8 of 12 | 0 of 3 |
| run 3 | 7 of 12 | 5 of 12 | 0 of 3 |
| `theme,*` combination | 6 of 12 | 6 of 12 | 0 of 3 |
| GitHub job `module:theme` (run 41585633012) | 0 of 12 (48 PASS, no skip) | 0 of 12 | 0 of 3 |
| GitHub job `modules:theme,*` | 2 of 12 | 3 of 12 | 0 of 3 |

In the local runs, no reload had a wrong screenshot frame while its first frame with the tabs was right.

## Checks

| Check | Exit | Result | Log |
|---|---|---|---|
| `core/ci_course.sh module:theme` | 0 | 27 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, documented), 1 REPORT; theme test 46 PASS, 2 SKIPPED (KNOWN LIMIT T1) | `logs/ci_course-module-theme.log`, `logs/run_checks-per-check/` |
| module test runs 1/2/3 | 0/0/0 | 46 PASS, 2 SKIPPED (T1) each | `logs/module-test-run{1,2,3}.log` |
| module code emptied | 1 | 2 FAIL (no dark rules; no dark colours), then the test stops (no header choice) | `logs/absent-test.log` |
| `ci_course.sh modules:theme,chained-problem-sets,equation-drill,formulas-in-text,wrong-number-diagnosis` | 0 | 31 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT | `logs/ci_course-modules-theme-all.log`, `logs/combination-per-check/` |
| a page with a script in `<head>` (T1 skip must become a FAIL) | — | NOT RUN: `build.py` refuses it ("expected exactly 1 script block in the output, got 2"), so no such page can be built; the test's branch is unchanged | `logs/headscript-build.log`, `logs/headscript-test.log` |
| WebKit, local | — | NOT RUN: not installed in this container | — |
| GitHub "Kit checks" run 41585633012 on 36fa85f | — | success: WebKit · template, Modules to check, Chromium · template, template-unset, medicinal-chemistry, module:theme, modules:theme,* (no billing annotation) | `logs/github-run.txt`, `logs/github-job-*.log` |
