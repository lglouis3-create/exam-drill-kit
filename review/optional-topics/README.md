# Optional topics: the review of b13e290 (ChatGPT, comment 6700778160)

Each log is `core/optional_test.js` run by `core/ci_course.sh template chromium`.

1. **The Optional badge was bound as an answer option.** `qLabel` gave the badge the class
   `lbl opt`, and the quiz bound an answer handler to every `.opt`. On 6c35fd0
   (`before-6c35fd0.log`), tapping the badge on an unrevealed single-answer optional question
   left it revealed with the pick `NaN`, a real answer afterwards recorded nothing, and the page
   threw "Cannot read properties of undefined (reading 'correct')". The badge now has the class
   `lbl optional` (style moved with it), and the quiz and the exam paper bind only
   `button.opt[data-o]`. With the fix (`after-fix.log`) the badge changes nothing and a real
   answer records once. The select-all case is skipped: the template course has no optional
   select-all question (NOT RUN).
2. **Paper-draw errors were swallowed.** The test caught errors from the exam-weighted pass and
   from each paper draw without asserting on them. It now fails on any such error, and on a course
   that sets a question count it requires all 20 draws to complete with none empty; a course with
   no question count is reported as a skip with its empty-draw count. A broken copy whose second
   draw throws (`broken-second-draw.log`) fails with "draw 2: …", 1 of 20 drawn.

WebKit: NOT RUN in this container; the PR's Kit checks run it.
