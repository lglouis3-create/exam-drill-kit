# Review evidence: `study-controls` (port queue item 21, pull request #16)

**Pass 3 (2026-11-02 evening, agent-run), final tested commit `54f6d3c`:** the module's own course from Intro to Pharmacology's data, and fix F2 of the integration check. See `v3-54f6d3c/INDEX.md`. The rest of this file is the earlier pass, on `8622653`.

Every result here is **agent-run** (the hardening session, 2026-11-02). The coordinator's re-runs go in `coordinator/`, labelled coordinator-verified.

## What was read and tested

| What | Value |
|---|---|
| Source repository and commit read | Intro-Pharmacology- `929cd62` (`exam1-drill/src/app.js`, `exam1-drill/src/browser_test.js`), read-only copy `/tmp/ip-readonly`. BDK not read. |
| Port branch, starting commit | `port/study-controls` at `c81a735` |
| Port branch, final tested commit | `8622653` (`8622653ab857e09f82211bde79cff8518832f29e`) |
| origin/main | `ac5c644` |
| Core tree (`git rev-parse 8622653:core`) | `daac6e234e10dae4a60c67f14cc575e9a0256f6c` |
| Template tree (`git rev-parse 8622653:template`) | `cbac5bd425d480944293f8e1fb5d5d703e8baba1` |
| Partner modules (scratch courses only, never committed) | worksheets-ink from `origin/port/worksheets-ink` `fa4a532`; paper-picker from `origin/port/paper-picker` `aa843ef` |

**Baseline reuse.** The core and template tree hashes are exactly `daac6e2` and `cbac5bd`, so the no-module template course and Medicinal-chemistry (`f1f5ee5`) results are cited from branch `evidence/baseline` and were not rerun here. `git diff origin/main -- core template` is empty on `8622653`.

## Results (agent-run, on `8622653`)

| Check | Result | Log |
|---|---|---|
| Module test, template course with the module on (mkcourse, then `ci/oncourse.js`), run 1 | PASS, 59 checks (1 skipped: paper-picker is not on) | `logs/final-test-1.log` |
| Same, run 2 | PASS, 59 checks (1 skipped) | `logs/final-test-2.log` |
| Same, run 3 | PASS, 59 checks (1 skipped) | `logs/final-test-3.log` |
| `run_checks.sh` on that course | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`: 5 of 7 questions carry at least one explanation issue) | `logs/final-run-checks.log` |
| Module test with paper-picker and worksheets-ink on (probe course, below) | PASS, 61 checks | `logs/partners-on-test-final.log` |
| Module test on a page built without the module | FAIL, as it must: 1 of 1 checks ("no feature modules in the page") | `logs/absent-test.log` |
| `ci/oncourse.js` on a fresh course, then build and module test | exit 0, then build exit 0 and PASS 59 (the final course above was made this way) | `logs/final-ci-oncourse.log`, `logs/final-build.log` |
| `ci/oncourse.js` a second time on the same course | exit 1, "already switches study-controls on" (as designed) | `logs/ci-oncourse-again.log` |
| Mutation checks | 19 of 20 caught; M10 not caught, an equivalent mutation (below) | `mutations.md`, `logs/mut-*.log` |
| No-module template course; Medicinal-chemistry | cited from `evidence/baseline` (tree hashes match) | — |
| WebKit (Safari) | NOT RUN: this container has Chromium only | — |
| Real native file picker and real native confirm box | NOT RUN as real OS dialogs: Playwright intercepts both. The file picker was opened through Playwright's `filechooser` event and the confirm box through its `dialog` event; keys were pressed while each was open | — |

## Faults found and what was done

| # | Fault (agent-run) | How it was found | Fixed? |
|---|---|---|---|
| 1 | With a modal `<dialog>` open, the letter `a` answered the quiz question under it. | `logs/probe-before.log` line 1 | Fixed in the module: no shortcut while a `<dialog>`, `role="dialog"`, `role="alertdialog"` or `aria-modal` element is open. Intro to Pharmacology's handler has the same rule for its own panels (`app.js` line 3937). |
| 2 | With worksheets-ink's Scratch paper open (a `role="dialog"` panel over the page), Enter checked the quiz answer under it; on the exam paper ArrowRight moved to the next question, and with the pen held down on the scratch canvas ArrowRight and Enter moved the paper two questions on. | `logs/probe-before.log` lines 4, 6, 7; `shots/probe-scratch-quiz.png` (after the fix) | Fixed: the dialog rule above, and no shortcut while a pointer is held down on a canvas. After the fix: `logs/probe-after-1.log` to `-3.log` (the paper stays at its question in each). |
| 3 | With paper-picker on, a ticked strict-paper box became unticked when a paper chip was chosen (the start page is drawn again and the box read the choice stored at the last Start), so the student could start a paper that was not strict. | `logs/probe-before.log` line 15 | Fixed: the box is stored as it is ticked. `logs/probe-after.log` line 15; `shots/probe-picker-strict.png`. |
| 4 | On a course with calculations on its papers (`exams[].typed`), All on one page drew a calculation or matching item with no answer box, so it could not be answered and counted as blank. | reading `examCard` against `core/exam_typed.js` (the core gives such items `orders: []`) | Fixed: such a paper stays one at a time and says why; check added. |
| 5 | Source line citations: `exLeaveOk` is line 1718 (was 1716), `renderExam` 1688-1716, the key handler 3936-3963. | `grep` of `app.js` at `929cd62` | Corrected in `module.json`, the module header and FEATURES.md. |
| 6 | (test fault, not module) the first "no key" checks could pass by accident: an answer followed by Enter moved past the only question, and Q then read as not answered. Found because mutations M1, M4 and M5 were not caught in the first pass (`logs/mutations-run1-stopped-old-test.log`, `logs/dbg-m1b.log`). | mutation pass 1 | Fixed in the test: the question must still be on screen and no answer recorded. Pass 2 catches them. |

Nothing found needs a core change to fix. For the core proposals, these core behaviours were seen:
- The progress is written 150 ms after the last change and not on `pagehide`: a reload at once after a flag lost it (reported by the test as a note, every run).
- The core keeps no history entries: the browser's Back leaves the drill. The strict paper still holds (Forward or reopening brings it back strict at the same question).
- The saved paper (`saveExam`) has no field for the strict mark, so the module keeps its own key (`<ns>:strictpaper:<profile>`) tied to the paper's end time. If that one key could not be written while the paper's own could, a reload would bring the paper back not strict. Not observed; a field in the saved paper would close it.
- One-page quiz: the core changes the confidence of the last recorded answer only, so Not sure and I guessed are offered on the card answered last only.

## Behaviour map

See `behaviour-map.md` (30 rows: ported, adapted, omitted, each with its source lines).

## Mutation checks

Script: `mutations.py` (each mutation an exact string replacement that must occur once, applied to a scratch course's copy of the module; the module test run; the file restored). Table: `mutations.md` (pass 2 of all 20, then a rerun of M17 and M10 after the new check).

- Pass 1 (`logs/mutations-run1-stopped-old-test.log`) was stopped after M9 when M1, M4 and M5 showed the test fault above.
- Pass 2: 18 of 20 caught. M17 (the paper's flag bar not refreshed) was not caught: the test looked at the bar only after moving on, which redraws it anyway. Check added ("a flag on the paper is listed on the question bar at once, before moving on"); pass 3 catches M17.
- M10 (the left arrow allowed on a strict paper) is not caught and cannot be. The strict paper also removes the Back button, and the left arrow only presses that button, so nothing changes for the student. M11 (both removed) is caught by four checks.

## Persistence results (agent-run, `logs/final-test-1.log` lines 55-65; the same in runs 2 and 3)

| Case | Result |
|---|---|
| 300 flags (50 copies of the 6 fixture questions, content unchanged, ids suffixed) and the layout, reload after 400 ms | kept; Topics shows 300; Drill flagged drills 300, 40 to a page, then 80 |
| Reload at once after a flag (under 150 ms) | the flag was **lost** (core behaviour: the save waits 150 ms) |
| Reload 300 ms after a flag | kept |
| Export, then Import into a fresh profile | the export carries 301 flags and the layout; the fresh profile had 0; after Import it has 301 and the layout |
| Profile switch | each profile keeps its own: the second profile cleared to 0 flags with One at a time; the first still has 301 with All on one page |
| Storage denied (`setItem` throws `SecurityError`) | the core's notice shows; the saved flags in localStorage are unchanged; the new flag holds for the visit; a strict paper started then has no Back for the visit. When storage works again the next save writes that flag too, and a reload loads all of them |
| Storage full (`QuotaExceededError`) | the notice shows; nothing saved is overwritten; after storage works again, a reload loads the flags and layout saved before. The flag and the layout chosen while storage was full are lost on that reload, as the notice says ("kept until you close or reload this page") |
| Strict paper: reload, Back then Forward, the left arrow, the left arrow pressed while the native confirm box is open | the paper stays at its question with no Back each time |

## Commands

Every command run through `scripts/run.sh` is listed with its exit code (from `commands.tsv`). Other commands: `/tmp/port-tools/mkcourse.sh <kit> /tmp/port-study-controls/{on,probe,mut,absent,ci-course,final} [study-controls]` (each exit 0), `scripts/partners.sh` (copies the two partner modules into the probe course), plain `git` commands for the scratch course commits, the port-branch commit and push, and this branch.

Exit 1 rows that are not faults: `dev-test1`/`dev-test2` (test bugs fixed during the work: a removed canvas, and `offsetParent` on the fixed-position notice), `dbg-m1`/`dbg-m1b` (debug runs with mutation M1 applied), `ci-oncourse-again` (refuses a second run, by design), `absent-test` (must fail).

| When (UTC) | Exit | Command | Log |
|---|---|---|---|
| 2026-11-02T18:58:51Z | exit 0 | `cd /tmp/port-study-controls/on/src && python3 build.py` | `logs/on-build.log` |
| 2026-11-02T18:59:02Z | exit 0 | `cd /tmp/port-study-controls/on/src && node features/study-controls/test.js` | `logs/start-test.log` |
| 2026-11-02T18:59:42Z | exit 0 | `cd /tmp/port-study-controls/probe/src && python3 build.py` | `logs/probe-build.log` |
| 2026-11-02T19:00:44Z | exit 0 | `cd /tmp/port-study-controls/probe/src && node /tmp/port-study-controls/bin/probe.js /tmp/port-study-controls/probe/index.html` | `logs/probe-before.log` |
| 2026-11-02T19:01:33Z | exit 0 | `cd /tmp/port-study-controls/probe/src && python3 build.py` | `logs/probe-build2.log` |
| 2026-11-02T19:01:38Z | exit 0 | `cd /tmp/port-study-controls/probe/src && node /tmp/port-study-controls/bin/probe.js /tmp/port-study-controls/probe/index.html` | `logs/probe-after.log` |
| 2026-11-02T19:06:20Z | exit 0 | `cd /tmp/port-study-controls/on/src && python3 build.py` | `logs/on-build2.log` |
| 2026-11-02T19:06:26Z | exit 1 | `cd /tmp/port-study-controls/on/src && node features/study-controls/test.js` | `logs/dev-test1.log` |
| 2026-11-02T19:07:04Z | exit 1 | `cd /tmp/port-study-controls/on/src && node features/study-controls/test.js` | `logs/dev-test2.log` |
| 2026-11-02T19:07:42Z | exit 0 | `cd /tmp/port-study-controls/on/src && node features/study-controls/test.js` | `logs/dev-test3.log` |
| 2026-11-02T19:07:50Z | exit 0 | `cd /tmp/port-study-controls/probe/src && python3 build.py` | `logs/probe-build3.log` |
| 2026-11-02T19:08:11Z | exit 0 | `cd /tmp/port-study-controls/probe/src && node features/study-controls/test.js` | `logs/partners-on-test1.log` |
| 2026-11-02T19:08:41Z | exit 0 | `cd /tmp/port-study-controls/probe/src && node features/study-controls/test.js` | `logs/partners-on-test2.log` |
| 2026-11-02T19:08:59Z | exit 0 | `cd /tmp/port-study-controls/probe/src && node /tmp/port-study-controls/bin/probe.js /tmp/port-study-controls/probe/index.html` | `logs/probe-after-1.log` |
| 2026-11-02T19:09:04Z | exit 0 | `cd /tmp/port-study-controls/probe/src && node /tmp/port-study-controls/bin/probe.js /tmp/port-study-controls/probe/index.html` | `logs/probe-after-2.log` |
| 2026-11-02T19:09:10Z | exit 0 | `cd /tmp/port-study-controls/probe/src && node /tmp/port-study-controls/bin/probe.js /tmp/port-study-controls/probe/index.html` | `logs/probe-after-3.log` |
| 2026-11-02T19:11:48Z | exit 0 | `cd /tmp/port-study-controls/dbg/src && python3 build.py` | `logs/dbg-build.log` |
| 2026-11-02T19:12:26Z | exit 1 | `cd /tmp/port-study-controls/dbg/src && node features/study-controls/test.js` | `logs/dbg-m1.log` |
| 2026-11-02T19:12:58Z | exit 0 | `cd /tmp/port-study-controls/dbg/src && node /tmp/port-study-controls/bin/dbg2.js /tmp/port-study-controls/dbg/index.html s1-1` | `logs/dbg2.log` |
| 2026-11-02T19:13:52Z | exit 1 | `cd /tmp/port-study-controls/dbg/src && node features/study-controls/test.js` | `logs/dbg-m1b.log` |
| 2026-11-02T19:14:34Z | exit 0 | `cd /tmp/port-study-controls/on/src && python3 build.py` | `logs/on-build3.log` |
| 2026-11-02T19:14:54Z | exit 0 | `cd /tmp/port-study-controls/on/src && node features/study-controls/test.js` | `logs/dev-test4.log` |
| 2026-11-02T19:17:11Z | exit 0 | `cd /tmp/port-study-controls/ci-course/src && node /home/user/exam-drill-kit/.claude/worktrees/agent-a1541b60afbedd42c/features/study-controls/ci/oncourse.js /home/user/exam-drill-kit/.claude/worktrees/agent-a1541b60afbedd42c /tmp/port-study-controls/ci-course/src` | `logs/ci-oncourse.log` |
| 2026-11-02T19:17:11Z | exit 1 | `cd /tmp/port-study-controls/ci-course/src && node /home/user/exam-drill-kit/.claude/worktrees/agent-a1541b60afbedd42c/features/study-controls/ci/oncourse.js /home/user/exam-drill-kit/.claude/worktrees/agent-a1541b60afbedd42c /tmp/port-study-controls/ci-course/src` | `logs/ci-oncourse-again.log` |
| 2026-11-02T19:22:36Z | exit 0 | `python3 -I evidence/mutations.py /tmp/port-study-controls/mut` | `logs/mutations-run2.log` |
| 2026-11-02T19:23:53Z | exit 0 | `python3 -I evidence/mutations.py /tmp/port-study-controls/mut M17 M10 (after the new check)` | `logs/mutations-run3.log` |
| 2026-11-02T19:24:02Z | exit 0 | `cd /tmp/port-study-controls/on/src && python3 build.py` | `logs/on-build4.log` |
| 2026-11-02T19:24:22Z | exit 0 | `cd /tmp/port-study-controls/on/src && node features/study-controls/test.js` | `logs/pre-commit-test.log` |
| 2026-11-02T19:25:13Z | exit 0 | `cd /tmp/port-study-controls/final/src && node /home/user/exam-drill-kit/.claude/worktrees/agent-a1541b60afbedd42c/features/study-controls/ci/oncourse.js /home/user/exam-drill-kit/.claude/worktrees/agent-a1541b60afbedd42c /tmp/port-study-controls/final/src` | `logs/final-ci-oncourse.log` |
| 2026-11-02T19:25:18Z | exit 0 | `cd /tmp/port-study-controls/final/src && python3 build.py` | `logs/final-build.log` |
| 2026-11-02T19:25:40Z | exit 0 | `cd /tmp/port-study-controls/final/src && node features/study-controls/test.js` | `logs/final-test-1.log` |
| 2026-11-02T19:26:01Z | exit 0 | `cd /tmp/port-study-controls/final/src && node features/study-controls/test.js` | `logs/final-test-2.log` |
| 2026-11-02T19:26:21Z | exit 0 | `cd /tmp/port-study-controls/final/src && node features/study-controls/test.js` | `logs/final-test-3.log` |
| 2026-11-02T19:29:32Z | exit 0 | `cd /tmp/port-study-controls/final/src && ./run_checks.sh` | `logs/final-run-checks.log` |
| 2026-11-02T19:29:49Z | exit 0 | `cd /tmp/port-study-controls/probe/src && python3 build.py` | `logs/partners-on-build-final.log` |
| 2026-11-02T19:30:12Z | exit 0 | `cd /tmp/port-study-controls/probe/src && node features/study-controls/test.js` | `logs/partners-on-test-final.log` |
| 2026-11-02T19:30:13Z | exit 0 | `cd /tmp/port-study-controls/absent/src && python3 build.py` | `logs/absent-build.log` |
| 2026-11-02T19:30:13Z | exit 1 | `cd /tmp/port-study-controls/absent/src && node features/study-controls/test.js` | `logs/absent-test.log` |

## Files here

- `INDEX.md`, `behaviour-map.md`, `mutations.py`, `mutations.md`, `commands.tsv`
- `logs/`: every log named above
- `scripts/`: `run.sh`, `probe.js` (the before/after probe), `partners.sh`, `probe_course_line.txt` and `probe-course-sc_probe.js` (the probe course's added data: one worksheet for the template's sample calculation, an earlier exam `exam0`, calculations on papers, the three modules on), the debug scripts, `table.py`, the commit message
- `shots/`: `probe-scratch-quiz.png` (Scratch paper open over a calculation, after the fix), `probe-picker-strict.png` (strict box still ticked after a paper chip, after the fix)
