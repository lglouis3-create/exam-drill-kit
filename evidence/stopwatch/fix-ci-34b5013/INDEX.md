# stopwatch: fix of C5 (evidence/integration-3), head 34b5013 (from b5a419b), agent-run

Every result is agent-run (this session, Chromium only; WebKit/Safari not run locally). Proof (b) is the everything-on course of `evidence/integration-3` (936a793): kit 9acfe9d plus `patches/all-patched-kit.patch`, with this module's features/ folder taken from the fixed branch head in place of the scratch patch, the 18 modules' ci/oncourse.js run in the order of `logs/ci-all-patched.log`, then build.py, then this module's test.js (`scripts/dry.sh`, `scripts/mkkitb.sh`). In (b) run_checks.sh was not run as a whole: only build.py and the module test. `cite_check.py` NOT RUN everywhere (no lecture PDFs; documented exclusion).

Change: `setup` written only when the course's EQUATIONS has its eq and every pre, `asks` only when the course's ASKS has the key, else left out and printed; subtopic ids and `sub` prefixed `sw-`; the script stops on its own sw- question or topic id already present. The test passes the course's EQUATIONS and ASKS to courseData.

| check | exit | result | log |
|---|---|---|---|
| core/ci_course.sh module:stopwatch (proof a) | 0 | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; module test 29; setup and asks of the 5 calculations left out (no EQUATIONS, no ASKS) | logs/ci_course-module-stopwatch.log |
| module test on its own course, runs 1-3 | 0, 0, 0 | 29, 29, 29 checks passed | logs/test-own-course-run{1,2,3}.log |
| proof (b) build | 0 | build.py PASS; setup of the 5 left out (the course's equations are prefixed by other modules), asks kept (ASKS has the keys) | logs/proof-b-everything-on-build.log |
| proof (b) module test | 0 | 29 checks passed | logs/proof-b-test.log |
| GitHub Kit checks run 41565918699 on 34b5013 | | success: Modules to check, Chromium template, template-unset, medicinal-chemistry, module:stopwatch, WebKit template (informational): all success | |
