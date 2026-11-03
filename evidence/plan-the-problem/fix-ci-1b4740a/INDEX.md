# plan-the-problem: fix of C3 and P2 (evidence/integration-3), head 1b4740a (from 4c09914), agent-run

Every result is agent-run (this session, Chromium only; WebKit/Safari not run locally). Proof (b) is the everything-on course of `evidence/integration-3` (936a793): kit 9acfe9d plus `patches/all-patched-kit.patch`, with this module's features/ folder taken from the fixed branch head in place of the scratch patch, the 18 modules' ci/oncourse.js run in the order of `logs/ci-all-patched.log`, then build.py, then this module's test.js (`scripts/dry.sh`, `scripts/mkkitb.sh`). In (b) run_checks.sh was not run as a whole: only build.py and the module test. `cite_check.py` NOT RUN everywhere (no lecture PDFs; documented exclusion).

Change: CI lectures get ids `plc-<id>` (practice-solutions files `plc-<lecture>-p<n>`) instead of L91 onward; the script stops only when one of its own plc- lecture ids is already in the course. Test: the two copies without ASKS (plan-noplan, plan-noasks) switch terms-variables off when it is on (its build step refuses an ASKS lacking the keys its options name; keeping ASKS would defeat what the copies check; no module needs terms-variables). Topics are not prefixed: the script still reuses a topic the course already has (unchanged).

| check | exit | result | log |
|---|---|---|---|
| core/ci_course.sh module:plan-the-problem (with formulas-in-text, equation-drill) (proof a) | 0 | 28 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; module test 54 | logs/ci_course-module-plan-the-problem.log |
| module test on its own course, runs 1-3 | 0, 0, 0 | 54, 54, 54 checks passed | logs/test-own-course-run{1,2,3}.log |
| proof (b) build | 0 | build.py PASS; lectures plc-L02-p1, plc-L07-p1 written (the other decks already in the course) | logs/proof-b-everything-on-build.log |
| proof (b) module test | 0 | 54 checks passed (integration-3 at 4c09914, patched: 2 of 53 failed, P2) | logs/proof-b-test.log |
| GitHub Kit checks run 41566549221 on 1b4740a | | success: Modules to check, Chromium template, template-unset, medicinal-chemistry, module:plan-the-problem, WebKit template (informational): all success | |
