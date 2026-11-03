# study-controls rework to Louis's policy of 2026-11-03 (agent-run)

Branch `port/study-controls`: `19dc419` (start) -> `7ce87af` (final, one new commit). Cloud container,
Chromium only (WebKit not installed: NOT RUN locally).

- The fixture `FIX` (test.js) compared with Intro-Pharmacology- `exam1-drill/src` at `929cd62` field by
  field: before the rework the only differences were the 8 `prof` values ("Professor"); after it, 0
  differences in the topic (q_L01.js line 1), the lecture (course.js L01) and the 6 questions
  (q_L01.js), and the strict note's quotation is app.js line 678's text.
- `final/`: `exit-codes.txt`; `ci-module.log` (core/ci_course.sh module:study-controls, exit 0:
  27 PASS, 0 FAIL, 1 NOT RUN cite_check.py "no lecture PDFs found", 1 REPORT explain_check.js);
  `module-test-run1..3.log` (features/study-controls/test.js on that course: 3 runs, exit 0, 59 checks
  passed, 1 skipped "the flags bar and the strict paper on a paper drawn for an earlier exam", which
  needs paper-picker); `checks-module/` each check's log.
- The combinations `study-controls,paper-picker` and `notes,study-controls`
  (features/ci-combinations.txt): NOT RUN, paper-picker and notes are not on this branch.
- `github-run.txt`, `github-logs/`: GitHub "Kit checks" run 41584870089 on `7ce87af`, read after it
  finished: success. WebKit · template 25 PASS, 0 FAIL, 1 NOT RUN (cite_check.py), 1 REPORT; Chromium ·
  template and template-unset the same; Chromium · medicinal-chemistry 24 PASS, 0 FAIL, 2 NOT RUN
  (cite_check.py, stepper_test.js: both documented exclusions), 1 REPORT; Chromium ·
  module:study-controls 27 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT (study-controls test 59 passed,
  1 skipped); Modules to check: success.
