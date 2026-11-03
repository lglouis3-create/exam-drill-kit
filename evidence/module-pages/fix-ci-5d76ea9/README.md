# Fix of the integration run 3 fault on `port/module-pages` (2026-11-03), agent-run

Every result here is **agent-run** (Chromium, in this container). It has not been verified by the coordinator.

| | |
|---|---|
| branch | `port/module-pages` |
| start | `c8fb645` (the head the coordinator's integration run 3 merged) |
| final | `5d76ea9` (one new commit on top; history not rewritten) |
| rule set | `/tmp/port-tools/CIDATA.md`; faults from `evidence/integration-3` (936a793) INDEX.md section 4 |
| core/ and template/ | not changed (`git diff c8fb645 5d76ea9 -- core template` is empty) |

## What changed

- `features/module-pages/ci/oncourse.js`: if the course's lectures or questions already use module 2, the fixture goes on the
  first module number from 92 on that the course does not use, as its `test.js` line 125 does (`FM = free(92)`). Before, the
  script refused (fault C2). If 2 is free, the script keeps 2, so a fresh template course gets the same output as before
  (module 2, `logs/module-pages-ci-own.log`). The questions, objectives, kinds of problem and lectures it writes, and the
  `modules` option, carry that number. CIDATA rule 3.
- Not changed: topic ids (bolus1, ...) are still unprefixed; on a topic id clash the script still refuses instead of picking a free id.

The diff: `fix.diff`.

## Checks (agent-run)

| # | command | exit | result | log |
|---|---|---|---|---|
| 1 | `core/ci_course.sh module:module-pages chromium` from the worktree at `5d76ea9` (= proof (a): the script on a fresh template course) | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (cite_check.py), 1 REPORT; module test PASS 30 (3 skipped: In parts; with worksheets-ink on; with concept-statuses on); the fixture is on module 2 | `logs/module-pages-ci-own.log`, `logs/checks-own/` |
| 2 | `node features/module-pages/test.js` in that same course, run 1 | 0 | PASS 30 (3 skipped) | `logs/module-pages-test-run1.log` |
| 3 | the same, run 2 | 0 | PASS 30 (3 skipped) | `logs/module-pages-test-run2.log` |
| 4 | the same, run 3 | 0 | PASS 30 (3 skipped) | `logs/module-pages-test-run3.log` |
| 5 | proof (b): `scripts/allpatched.sh module-pages module-pages 5d76ea9`: kit at `integration/ports-2026-11-03` 9acfe9d with `patches/all-patched-kit.patch`, `features/module-pages` from `5d76ea9`, then `core/ci_course.sh modules:<the 18 modules, in the order of logs/ci-all-patched.log> chromium` | 1 | all-patched course (b): 34 PASS, 8 FAIL, 2 NOT RUN, 1 REPORT, exit 1; the same totals as the coordinator's `evidence/integration-3` `logs/ci-all-patched.log`. Every FAIL and NOT RUN is a fault listed there for other branches: core `test.js` 26 duplicate question ids, and `output_test.js`, `checks_test.js` and `browser_test.js`, which depend on it (D1); paper-picker (P1); plan-the-problem (P2); quiz-prep-cards 2 (D1); theme 1 (T1); notes test NOT RUN (N1); `cite_check.py` NOT RUN (no lecture PDFs: a documented exclusion). module-pages' script: exit 0, "the course already uses module 2; the fixture's module goes on module 92"; module-pages test PASS 42. In the (b) kit, module-pages' scratch patch is replaced by 5d76ea9's files. In this run quiz-prep-cards' test also crashed once at its test.js line 286 ("Execution context was destroyed"), after its 2 known D1 failures; rerun alone on the same course: exit 1, 2 of 54 failed (D1), no crash (`logs/module-pages-allpatched-qpc-rerun.log`). quiz-prep-cards is not on this branch. | `logs/module-pages-ci-allpatched.log`, `logs/checks-allpatched/` |

Runs 1-4 used the worktree before the commit, holding exactly the changes committed as `5d76ea9`.
Commands 1 and 5 were run with `TMPDIR` under `/tmp/port-fix-a/run-module-pages/`; the scripts are in `scripts/`.

## GitHub "Kit checks" on `5d76ea9`

Run 41564910363 (pull_request): completed, success. https://github.com/lglouis3-create/exam-drill-kit/actions/runs/41564910363

| job | status | conclusion |
|---|---|---|
| WebKit · template (informational) | completed | success |
| Chromium · template-unset | completed | success |
| Chromium · template | completed | success |
| Chromium · medicinal-chemistry | completed | success |
| Modules to check | completed | success |
| Chromium · module:module-pages | completed | success |

Read with `gh api 'repos/lglouis3-create/exam-drill-kit/actions/runs?head_sha=<sha>'` and `.../runs/<id>/jobs` (`logs/github-runs.tsv`, `logs/github-jobs.tsv`).

## NOT RUN and skipped

- `cite_check.py` in every course (no lecture PDFs; a documented exclusion).
- In (b): notes `test.js` NOT RUN (fault N1, port/notes).
- WebKit: not run here (Chromium only). The GitHub WebKit job is informational.
- The Medicinal-chemistry course was not run here; the GitHub job "Chromium · medicinal-chemistry" ran it.
