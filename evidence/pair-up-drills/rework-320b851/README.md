# pair-up-drills rework to Louis's policy of 2026-11-03 (agent-run)

Branch `port/pair-up-drills`: `1b65a7d` (start) -> `320b851` (final, one new commit). Cloud container,
Chromium only (WebKit not installed: NOT RUN locally).

- `fixture-changes.txt`: every value of the test's `IP` fixture that differs between `1b65a7d` and
  `320b851` (9 strings, each now as Intro-Pharmacology- `exam1-drill/src/app.js` has it at `929cd62`).
  The fixture was written by `node features/pair-up-drills/port_from_ip.js /tmp/ip-readonly/exam1-drill/src`.
- `final/`: `exit-codes.txt`; `ci-module.log` (core/ci_course.sh module:pair-up-drills, exit 0:
  27 PASS, 0 FAIL, 1 NOT RUN cite_check.py "no lecture PDFs found", 1 REPORT explain_check.js);
  `module-test-run1..3.log` (features/pair-up-drills/test.js on that course: 3 runs, exit 0, 69 checks
  passed each); `checks-module/` each check's log.
- No line of `features/ci-combinations.txt` that names pair-up-drills runs on this branch (`theme,*`
  needs theme, which is not on it).
