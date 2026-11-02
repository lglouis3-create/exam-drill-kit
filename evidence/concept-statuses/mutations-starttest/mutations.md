| Mutation | What it breaks | Check that FAILed | Exit |
|---|---|---|---|
| M1 | mastery needs 2 sessions -> 1 | the status rules hold on 13 synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning) | 1 |
| M2 | no miss in the last 3 -> in the last 1 | the status rules hold on 13 synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning) | 1 |
| M3 | "Not sure" is solid again (PK's solid) | a correct answer marked "Not sure" is a miss: it blocks mastery; the evidence line counts a "Not sure": 1 miss in 2 attempts, last 2 at 50% (1 of them a correct answer marked "Not sure") | 1 |
| M4 | struggling under 60% -> under 40% | the status rules hold on 13 synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning) | 1 |
| M5 | a session ends after 30 min -> after 50 h | the status rules hold on 13 synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning); mastery starts the spaced check at the mastery box at the pace's intervals, and each further solid answer moves it up one; on the weekly pace the spaced check uses the weekly days; a concept mastered 40 days ago is due for its spaced check, one mastered minutes ago is not | 1 |
| M6 | a solid answer after mastery no longer moves the check up a step | mastery starts the spaced check at the mastery box at the pace's intervals, and each further solid answer moves it up one | 1 |
| M7 | the day steps ignore the pace in Settings | on the weekly pace the spaced check uses the weekly days | 1 |
| M8 | due without the scheduler's own record being due | NOT CAUGHT | 0 |
| M9 | "Ask everything" makes every mastered concept due (isDue) | "Ask everything" does not list a concept mastered minutes ago as due | 1 |
| M10 | a select-all answer counts its correct options as wrong picks | NOT CAUGHT | 0 |
| M11 | repeated wrong options: chosen more than 3 times | NOT CAUGHT | 0 |
| M12 | unfamiliar cards before struggling ones | NOT CAUGHT | 0 |
| M13 | 80 cards shown, none folded | NOT CAUGHT | 0 |
| M14 | kind of miss read from PK's missKind | a calculation concept shows its most common kind of miss; a calculation concept shows its most common kind of miss; a calculation concept shows its most common kind of miss; a calculation concept shows its most common kind of miss | 1 |
| M15 | section at the end of Weak spots | the section is drawn once, after "This session" and before "What to review next" | 1 |
| M16 | drawing creates scheduler records (st) | NOT CAUGHT | 0 |
| M17 | option text and why escaped as stored (the code before this fix) | NOT CAUGHT | 0 |
| M18 | the words option ignored | the course's `words` option names the concept ("trapezoidal-auc" as "Trapezoidal AUC") | 1 |
| M19 | the evidence line leaves out "Not sure" | the evidence line counts a "Not sure": 2 misses in 2 attempts, last 2 at 0% | 1 |
| M20 | a matching answer counts its right pairs as wrong | NOT CAUGHT | 0 |
| M21 | answers to questions no longer in the bank kept | an answer to a question no longer in the bank reaches no concept | 1 |
| M22 | Check asks 3 questions | Check starts a one-question spaced review of that concept | 1 |
| M23 | drawing trims the answer log | FAIL: features/concept-statuses/test.js: crashed: page.evaluate: TypeError: Cannot read properties of null (reading 'click') | 1 |
