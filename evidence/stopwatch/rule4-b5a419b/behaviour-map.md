# stopwatch: behaviour map (agent-run)

Read from Basic-Pharmacokinetics `src/` at `ac2eb73` (read-only clone), lines re-read on 2026-11-03.
The module code did not change in this hardening. The map is the first version's, checked line by line
against the source again; two rows are split into their parts (`views.js` 3790 and 5787, and
`shell.html` 247-249), and the 3371 row now says that every paper answer keeps its time, as the source
does.

| Source (`src/`) | Behaviour | Status |
|---|---|---|
| `views.js` 1467 | `PACE_MS = 120000`, the professor's pace | **adapted**: the option `paceSeconds` (default 0, a clock with no pace); Basic-Pharmacokinetics' 120 is set by the course (`course.js` line 264). The module's own course sets 120. |
| `views.js` 1469 | `fmtClock`: minutes and seconds (m:ss) | **ported**: the same text on 7 control times (test check 2) |
| `views.js` 1471 | after the answer: "took m:ss", "· over 2:00" in words, red when over, green when within | **ported**; the hover title reads "The professor's pace: …" in place of a pronoun |
| `views.js` 1472 | "starts when you begin" when there is no start time | **omitted**: never reached in the kit; the core always sets the start time when it draws the question |
| `views.js` 1473-1474 | the running clock, red and "over 2:00" past the pace | **ported** |
| `views.js` 1476-1481, 5762 | the tick once a second | **adapted**: the text is changed in place, so the core's watch for redrawn views is not woken every second |
| `views.js` 1794 | the clock on the quiz card head, calculations only | **ported** |
| `views.js` 958, 1890-1892 | the start at draw; the time taken recorded with the answer | **core already** (`ms`); the module shows the recorded time |
| `views.js` 1468 | `AWAY_MS`: an answer over 15 minutes left out of averages | **omitted**: only the Weak spots time per kind of calculation used it |
| `views.js` 1484-1530 | the one-page layout's "Start timer" button | **omitted**: the core has no one-page layout (port queue item 21) |
| `views.js` 3226, 3290-3297 | the time on each paper question, added up while it is shown; Back adds to it | **ported** |
| `views.js` 3310 | the clock on a paper calculation, from its time so far | **ported** (in the kit a paper draws calculations only with the exam's `typed: true`) |
| `views.js` 3371 | each paper answer recorded with its question's time | **ported**, for every paper answer (calculation, single-answer and select-all), as in the source |
| `views.js` 3033, 3064 | the time per paper question saved with the paper and read back after a reload | **omitted**: a module cannot add to the core's saved paper (needs a core change). After a reload in the middle of a paper, the time on each question is counted again from the reload. |
| `views.js` 3790, 5787 | when the page is closed or hidden during a paper, the time so far is added and the paper saved | **omitted**: needs the same core change |
| `views.js` 2161-2200 | Weak spots: the middle time per kind of calculation against the 2-minute line, "Work on these first" | **omitted**: grouped by Basic-Pharmacokinetics' `CALC_TYPES`, which the kit does not have. The student does not see time per kind of calculation. |
| `views.js` 2354 | "took m:ss" beside a calculation in the list of misses | **omitted**: the student does not see the time beside a missed calculation in that list |
| `shell.html` 246, 250-251 | the clock's styles: plain, over (red), done within the pace (green) | **ported** |
| `shell.html` 247-249 | the styles of the "starts when you begin" and "Start timer" states | **omitted** with those two states |

Basic-Pharmacokinetics' papers draw calculations without any option (`shell.html` line 1180
`poolDrawable`, `views.js` lines 3270-3277 `beginExam`); its `course.js` exams have no `typed`
field. The kit core draws calculations onto a paper only for an exam with `typed: true`.
