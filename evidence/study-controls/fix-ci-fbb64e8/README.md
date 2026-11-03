# Fix of the integration run 3 fault on `port/study-controls` (2026-11-03), agent-run

Every result here is **agent-run** (Chromium, in this container). It has not been verified by the coordinator.

| | |
|---|---|
| branch | `port/study-controls` |
| start | `1c1d590` (the head the coordinator's integration run 3 merged) |
| final | `fbb64e8` (one new commit on top; history not rewritten) |
| rule set | `/tmp/port-tools/CIDATA.md`; faults from `evidence/integration-3` (936a793) INDEX.md section 4 |
| core/ and template/ | not changed (`git diff 1c1d590 fbb64e8 -- core template` is empty) |

## What changed

- `features/study-controls/current/test.js` `WRITE` (also used by `ci/oncourse.js`): the fixture's lecture (L01 in the
  source) gets the first id from L91 on that the course's lectures do not use. Before, it always took L91 (fault C3).
  A fresh template course still gets L91. The ci script prints the id it used, and both headers record the mapping. CIDATA rule 2.
- Not changed: topic id L01 and question ids L01-002 ... are Intro to Pharmacology's own. No other module's data
  writes them (grep of every `features/` file on the integration branch), and the test uses them to find the course's copy.

The diff: `fix.diff`.

## Checks (agent-run)

| # | command | exit | result | log |
|---|---|---|---|---|
| 1 | `core/ci_course.sh module:study-controls chromium` from the worktree at `fbb64e8` (= proof (a): the script on a fresh template course) | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (cite_check.py), 1 REPORT; module test PASS 59 (1 skipped: the flags bar and the strict paper on a paper drawn for an earlier exam); lecture id L91 | `logs/study-controls-ci-own.log`, `logs/checks-own/` |
| 2 | `node features/study-controls/test.js` in that same course, run 1 | 0 | PASS 59 (1 skipped) | `logs/study-controls-test-run1.log` |
| 3 | the same, run 2 | 0 | PASS 59 (1 skipped) | `logs/study-controls-test-run2.log` |
| 4 | the same, run 3 | 0 | PASS 59 (1 skipped) | `logs/study-controls-test-run3.log` |
| 5 | proof (b): `scripts/allpatched.sh study-controls study-controls fbb64e8`: kit at `integration/ports-2026-11-03` 9acfe9d with `patches/all-patched-kit.patch`, `features/study-controls` from `fbb64e8`, then `core/ci_course.sh modules:<the 18 modules, in the order of logs/ci-all-patched.log> chromium` | 1 | all-patched course (b): 34 PASS, 8 FAIL, 2 NOT RUN, 1 REPORT, exit 1; the same totals as the coordinator's `evidence/integration-3` `logs/ci-all-patched.log`. Every FAIL and NOT RUN is a fault listed there for other branches: core `test.js` 26 duplicate question ids, and `output_test.js`, `checks_test.js` and `browser_test.js`, which depend on it (D1); paper-picker (P1); plan-the-problem (P2); quiz-prep-cards 2 (D1); theme 1 (T1); notes test NOT RUN (N1); `cite_check.py` NOT RUN (no lecture PDFs: a documented exclusion). study-controls' script: exit 0, lecture written as L95 (the coordinator's run wrote L91: `ci-all-patched.log` line 54); study-controls test PASS 59. Lecture ids of the built course (`logs/study-controls-allpatched-lecture-ids.log`): 52 lectures, one id still twice: L91, written by chained-problem-sets (on main) and concept-statuses (port/concept-statuses), the other two parts of C3, which are not on this branch. | `logs/study-controls-ci-allpatched.log`, `logs/checks-allpatched/` |

Runs 1-4 used the worktree before the commit, holding exactly the changes committed as `fbb64e8`.
Commands 1 and 5 were run with `TMPDIR` under `/tmp/port-fix-a/run-study-controls/`; the scripts are in `scripts/`.

## GitHub "Kit checks" on `fbb64e8`

Run 41564909031 (pull_request): completed, success. https://github.com/lglouis3-create/exam-drill-kit/actions/runs/41564909031

| job | status | conclusion |
|---|---|---|
| WebKit · template (informational) | completed | success |
| Chromium · template-unset | completed | success |
| Chromium · medicinal-chemistry | completed | success |
| Modules to check | completed | success |
| Chromium · template | completed | success |
| Chromium · module:study-controls | completed | success |

Read with `gh api 'repos/lglouis3-create/exam-drill-kit/actions/runs?head_sha=<sha>'` and `.../runs/<id>/jobs` (`logs/github-runs.tsv`, `logs/github-jobs.tsv`).

## NOT RUN and skipped

- `cite_check.py` in every course (no lecture PDFs; a documented exclusion).
- In (b): notes `test.js` NOT RUN (fault N1, port/notes).
- WebKit: not run here (Chromium only). The GitHub WebKit job is informational.
- The Medicinal-chemistry course was not run here; the GitHub job "Chromium · medicinal-chemistry" ran it.
