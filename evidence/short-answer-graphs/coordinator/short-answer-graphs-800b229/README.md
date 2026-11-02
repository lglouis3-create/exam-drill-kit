# Coordinator-verified re-run: short-answer-graphs-800b229

Run by the coordinator session with `coordinator/verify.sh` (the module switched on by its own `ci/oncourse.js` on a fresh template course). Inputs: `inputs.txt`. Exit codes: `exit-codes.txt`. Logs: `build.log`, `test-run1.log` to `test-run3.log`.

```
module short-answer-graphs
commit 800b2296bf9b89b558935fa7ccd757e63fb8f26d
core a2dbf03d6ccea270f77ac440f3fd8b7a86d855cf template cbac5bd425d480944293f8e1fb5d5d703e8baba1
extra modules: 
2026-11-02T23:52:44Z
oncourse short-answer-graphs exit=0
build exit=0
module test run 1 exit=0
module test run 2 exit=0
module test run 3 exit=0
rc oncourse short-answer-graphs exit=0
rc build exit=0
rc run_checks exit=0
PASS: features/short-answer-graphs/test.js: 69 checks passed (1 skipped: no Graphs tab without figures)
PASS: features/short-answer-graphs/test.js: 69 checks passed (1 skipped: no Graphs tab without figures)
PASS: features/short-answer-graphs/test.js: 69 checks passed (1 skipped: no Graphs tab without figures)
```
