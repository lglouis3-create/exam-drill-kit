# quiz-prep-cards: module-absent failure made clean, head 4c35ea2 (from 61caa7f), agent-run

Every result is **agent-run** (session `session_01LVkWFDVVDwgsL5WF7yWqcV`, 2026-11-03, Chromium only), except
the GitHub run, which is GitHub's own. Follows `rework-61caa7f/` (the rework to Louis's policy); that folder's
data findings still hold.

## What changed (`rework.diff`)

One line of `features/quiz-prep-cards/current/test.js`, a test-only change: the first engine read was
`({QUESTIONS, TOPICS, COURSE, FX})`. With no feature module on the page has no FX, so the module-absent
run crashed ("ReferenceError: FX is not defined", `logs/module-absent-test-61caa7f-crash.log`). It now
reads `FX: typeof FX === "undefined" ? null : FX`, as glossary-tap's test does, and the first check fails
with its count. Nothing else changed; core/ and template/ are unchanged.

## Checks (agent-run)

| Check | Exit | Result | Log |
|---|---|---|---|
| `core/ci_course.sh module:quiz-prep-cards chromium` | 0 | 27 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, "no lecture PDFs found", documented exclusion), 1 REPORT (`explain_check.js`, 5 of 27). Core: 26 PASS (home_test.js 36). Module test: 54 PASS, 0 SKIPPED | `logs/ci_course-module-quiz-prep-cards.log`, `logs/ci-module-checks/` |
| module test on that course, runs 1-3 | 0, 0, 0 | 54 PASS each | `logs/module-test-run{1,2,3}.log` |
| module absent (`delete COURSE.features['quiz-prep-cards']`), build, module test | 0, 1 | FAIL 1 of 1: "the page carries quiz-prep-cards, working — no feature modules in the page"; no crash | `logs/module-absent-*.log` |
| WebKit locally | — | NOT RUN: Chromium only in this container | — |

## GitHub "Kit checks" on 4c35ea2

Run 41585218503 (started 05:39:54Z, finished 05:43:47Z), completed, conclusion **success**: the jobs did
start this time (`logs/gh-jobs.tsv`). Jobs: Modules to check success; Chromium · template success;
Chromium · template-unset success; Chromium · medicinal-chemistry success; **WebKit · template success**;
Chromium · module:quiz-prep-cards success. No annotations. Not rerun.
