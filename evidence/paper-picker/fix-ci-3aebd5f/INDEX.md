# paper-picker: fix of D1 and P1 (evidence/integration-3), head 3aebd5f (from a3eb5c3), agent-run

Every result is agent-run (this session, Chromium only; WebKit/Safari not run locally). Proof (b) is the everything-on course of `evidence/integration-3` (936a793): kit 9acfe9d plus `patches/all-patched-kit.patch`, with this module's features/ folder taken from the fixed branch head in place of the scratch patch, the 18 modules' ci/oncourse.js run in the order of `logs/ci-all-patched.log`, then build.py, then this module's test.js (`scripts/dry.sh`, `scripts/mkkitb.sh`). In (b) run_checks.sh was not run as a whole: only build.py and the module test. `cite_check.py` NOT RUN everywhere (no lecture PDFs; documented exclusion).

Change: CI data ids (question, topic, subtopic, lecture) prefixed `pp-`, dupOf/topic/sub rewritten; the script stops on its own prefixed id already present and prints a note when an earlier lecture names one of its decks with another exam or module. Test: the scratch copy is always set to the fixture's 3 exams and activeExam; Exam 1's pools take only the fixture's topics; the fixture's lectures move first only where another lecture with one of their decks and another exam/module comes before them.

| check | exit | result | log |
|---|---|---|---|
| core/ci_course.sh module:paper-picker (proof a) | 0 | 26 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; module test 74 | logs/ci_course-module-paper-picker.log |
| module test on its own course, runs 1-3 | 0, 0, 0 | 74, 74, 74 checks passed | logs/test-own-course-run{1,2,3}.log |
| proof (b) build | 0 | build.py PASS | logs/proof-b-everything-on-build.log, proof-b-build.py.log |
| proof (b) module test | 0 | 58 checks passed | logs/proof-b-test.log |
| 1-exam course (template + paper-picker, exams cut to the active one; study-controls is not on this branch) | 0 | 58 checks passed | logs/one-exam-course-test.log |
| control: a3eb5c3's test on the integration-patched everything-on course | 1 | 1 of 23 failed (P1) | logs/control-everything-on-test-at-a3eb5c3.log |
| GitHub Kit checks run 41565109643 on 3aebd5f | | success: Modules to check, Chromium template, template-unset, medicinal-chemistry, module:paper-picker, WebKit template (informational): all success | |

In (b) after this fix, 4 question ids still appear twice (cq5-1, pd-c20, cq5-6, nl-c04), all between notes' and quiz-prep-cards' scratch-patched data; none is paper-picker's.
