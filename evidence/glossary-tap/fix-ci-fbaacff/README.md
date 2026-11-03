# Fix of the integration run 3 fault on `port/glossary-tap` (2026-11-03), agent-run

Every result here is **agent-run** (Chromium, in this container). It has not been verified by the coordinator.

| | |
|---|---|
| branch | `port/glossary-tap` |
| start | `3190f57` (the head the coordinator's integration run 3 merged) |
| final | `fbaacff` (one new commit on top; history not rewritten) |
| rule set | `/tmp/port-tools/CIDATA.md`; faults from `evidence/integration-3` (936a793) INDEX.md section 4 |
| core/ and template/ | not changed (`git diff 3190f57 fbaacff -- core template` is empty) |

## What changed

- `features/glossary-tap/ci/oncourse.js` line 65-66: the appended course.js line now adds to `COURSE.skills` only those fixture
  skills whose id the course does not already hold. Before, it assigned a new list (fault C1). Header comment updated. CIDATA rule 1.
- `features/glossary-tap/current/test.js`: every `prof` in `FIXCOURSE` is now "Professor" (70 values; the line is otherwise
  unchanged; see the python check at the end of `fix.diff`), and the comment says so. The test does not read FIXCOURSE.
  The ci script still writes "Professor". CIDATA rule 6.
- Earlier commits of `port/glossary-tap` (d4f21d0 to 3190f57, 9 commits counting merges) still hold the professor's surname in
  this fixture. History was not rewritten (only new commits were added). `fix.diff` here leaves out the old FIXCOURSE line for that reason.
- Searched for the name, case-insensitive: no hits in any file under `features/glossary-tap/` at fbaacff, and none in the files of
  `evidence/glossary-tap` (f6a98a4) or in this folder. Outside this module, origin/main itself holds the name in `FEATURES.md`,
  `review/FEATURES.draft.md`, `features/formulas-in-text/current/test.js` and `features/chained-problem-sets/current/test.js`
  (one line each). This branch does not change those files, and they are not changed here.

The diff: `fix.diff`.

## Checks (agent-run)

| # | command | exit | result | log |
|---|---|---|---|---|
| 1 | `core/ci_course.sh module:glossary-tap chromium` from the worktree at `fbaacff` (= proof (a): the script on a fresh template course) | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (cite_check.py), 1 REPORT (explain_check.js); module test PASS 56 (1 skipped: with formulas-in-text). COURSE.skills of that course: recall, tell, apply, read, calc, figure, drug, term (the template's `read` is kept) | `logs/glossary-tap-ci-own.log`, `logs/checks-own/` |
| 2 | `node features/glossary-tap/test.js` in that same course, run 1 | 0 | PASS 56 (1 skipped) | `logs/glossary-tap-test-run1.log` |
| 3 | the same, run 2 | 0 | PASS 56 (1 skipped) | `logs/glossary-tap-test-run2.log` |
| 4 | the same, run 3 | 0 | PASS 56 (1 skipped) | `logs/glossary-tap-test-run3.log` |
| 5 | proof (b): `scripts/allpatched.sh glossary-tap glossary-tap fbaacff`: kit at `integration/ports-2026-11-03` 9acfe9d with `patches/all-patched-kit.patch`, `features/glossary-tap` from `fbaacff`, then `core/ci_course.sh modules:<the 18 modules, in the order of logs/ci-all-patched.log> chromium` | 1 | all-patched course (b): 34 PASS, 8 FAIL, 2 NOT RUN, 1 REPORT, exit 1; the same totals as the coordinator's `evidence/integration-3` `logs/ci-all-patched.log`. Every FAIL and NOT RUN is a fault listed there for other branches: core `test.js` 26 duplicate question ids, and `output_test.js`, `checks_test.js` and `browser_test.js`, which depend on it (D1); paper-picker (P1); plan-the-problem (P2); quiz-prep-cards 2 (D1); theme 1 (T1); notes test NOT RUN (N1); `cite_check.py` NOT RUN (no lecture PDFs: a documented exclusion). glossary-tap's script: exit 0, "appended the skills it lacks of recall, tell, apply, figure, calc, drug, term"; module-pages' script, which refused on the unpatched kit (`ci-all.log` line 20, "skills neither the course nor the fixture has: read"), ran; glossary-tap test PASS 93. In the (b) kit, the other six scratch patches stay in place and glossary-tap's patch is replaced by fbaacff's files. The first (b) run was cut off by a container restart after `scheduler_test.js` (`logs/glossary-tap-ci-allpatched-cut-by-restart.log`, no result line); it was rerun in full. | `logs/glossary-tap-ci-allpatched.log`, `logs/checks-allpatched/` |

Runs 1-4 used the worktree before the commit, holding exactly the changes committed as `fbaacff`.
Commands 1 and 5 were run with `TMPDIR` under `/tmp/port-fix-a/run-glossary-tap/`; the scripts are in `scripts/`.

## GitHub "Kit checks" on `fbaacff`

Run 41564904533 (pull_request): completed, success. https://github.com/lglouis3-create/exam-drill-kit/actions/runs/41564904533

| job | status | conclusion |
|---|---|---|
| WebKit · template (informational) | completed | success |
| Chromium · medicinal-chemistry | completed | success |
| Chromium · template | completed | success |
| Chromium · template-unset | completed | success |
| Modules to check | completed | success |
| Chromium · modules:glossary-tap,formulas-in-text | completed | success |
| Chromium · module:glossary-tap | completed | success |

Read with `gh api 'repos/lglouis3-create/exam-drill-kit/actions/runs?head_sha=<sha>'` and `.../runs/<id>/jobs` (`logs/github-runs.tsv`, `logs/github-jobs.tsv`).

## NOT RUN and skipped

- `cite_check.py` in every course (no lecture PDFs; a documented exclusion).
- In (b): notes `test.js` NOT RUN (fault N1, port/notes).
- WebKit: not run here (Chromium only). The GitHub WebKit job is informational.
- The Medicinal-chemistry course was not run here; the GitHub job "Chromium · medicinal-chemistry" ran it.
