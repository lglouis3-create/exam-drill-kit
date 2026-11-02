| Mutation | File | What it breaks | Exit | Checks that failed |
|---|---|---|---|---|
| M01 | quiz-prep-cards.js | a quiz scope ignores `modules` | 1 | every quiz covers at least one question, and only questions of the topics or modules it names (2 quizzes); the Quiz 5 card offers concepts (0), calculations (0), everything (0) and a straight pass (0) |
| M02 | quiz-prep-cards.js | no question counts as a calculation | 1 | the Quiz 5 card offers concepts (4), calculations (4), everything (8) and a straight pass (8) |
| M03 | quiz-prep-cards.js | the quiz ends at its start, not start plus minutes | 1 | the days-left line for Quiz 5 (2026-10-19T08:00, 24 minutes) at 5 fixed times; Quiz 5 is ahead until its start plus its 24 minutes (08:24), and not after; Mon 19 Oct: Quiz 5 says quiz day at 07:00 and in progress at 08:10, and its card is gone at 08:24, its start plus 24 minutes |
| M04 | quiz-prep-cards.js | days left counted in hours rounded up, not calendar days | 1 | the days-left line for Quiz 5 (2026-10-19T08:00, 24 minutes) at 5 fixed times; Mon 19 Oct: Quiz 5 says quiz day at 07:00 and in progress at 08:10, and its card is gone at 08:24, its start plus 24 minutes |
| M05 | quiz-prep-cards.js | no in-progress line | 1 | the days-left line for Quiz 5 (2026-10-19T08:00, 24 minutes) at 5 fixed times; Mon 19 Oct: Quiz 5 says quiz day at 07:00 and in progress at 08:10, and its card is gone at 08:24, its start plus 24 minutes |
| M06 | quiz-prep-cards.js | a hidden card is never hidden | 1 | Hide removes the card and the choice survives a reload; Settings offers to put the hidden card back, by name |
| M07 | quiz-prep-cards.js | a card for every quiz, over or hidden | 1 | one card per quiz still ahead and not hidden (0 of 2); Hide removes the card and the choice survives a reload; Mon 12 Oct: no card for Quiz 4, which is over; Quiz 5 is 7 days away; Mon 19 Oct: Quiz 5 says quiz day at 07:00 and in progress at 08:10, and its card is gone at 08:24, its start plus 24 minutes; the hidden Quiz 4 card stays hidden in both profiles (one browser); a reload at once (under 150 ms) and 400 ms after Hide keeps the hidden card hidden (Quiz 5 both times; Quiz 4 shows again after Show again); quota: Hide shows the notice that nothing was saved, and the card is hidden for this visit; quota: with storage working again, the saved flag and the 8 answers load; the Hide that was not saved is not applied; denied: Hide shows the notice that nothing was saved, and the card is hidden for this visit; denied: with storage working again, the saved flag and the 8 answers load; the Hide that was not saved is not applied |
| M08 | quiz-prep-cards.js | <sub> and <sup> shown as text | 1 | every said line is listed (8 and 11), with each <sub> and <sup> kept; {{frac:a|b}} is written (a)/(b) when formulas-in-text is off |
| M09 | quiz-prep-cards.js | {{frac}} left raw without formulas-in-text | 1 | {{frac:a|b}} is written (a)/(b) when formulas-in-text is off |
| M10 | quiz-prep-cards.js | the straight pass asks one question twice | 1 | the Quiz 4 straight pass queues each of its 12 questions once; the two straight passes record 22 answers (9 on Quiz 5, 13 on Quiz 4), all on the quizzes' questions |
| M11 | quiz-prep-cards.js | concepts and calculations drills not narrowed | 1 | the concepts drill (8) has no typed number and the calculations drill (8) only typed numbers |
| M12 | quiz-prep-cards.js | Hide kept for the visit only, not stored | 1 | Hide removes the card and the choice survives a reload; Settings offers to put the hidden card back, by name |
| M13 | quiz-prep-cards.js | Show again does nothing | 1 | the card is back on Topics and Settings says no card is hidden |
| M14 | quiz-prep-cards.js | Settings offers back a hidden card of a quiz that is over | 1 | a hidden card of a quiz that is over is not offered back in Settings |
| M15 | quiz-prep-cards.js | the cards go above the heading, not under the stamp | 1 | the cards sit under the build stamp or the What's new card, above the Topics filters |
| M16 | quiz-prep-cards.js | Settings does not name the hidden quiz | 1 | Settings offers to put the hidden card back, by name |
| M17 | quiz-prep-cards.js | the first tooltip, which the core reads as skipping a question | 1 | the Hide button says what it hides |
| M18 | quiz-prep-cards.js | what the quiz covers is not shown | 1 | the Quiz 5 card names the quiz, its day and time, the days left (17) and what it covers; the Quiz 4 card says 3 days until the quiz |
| M19 | quiz-prep-cards.js | the professor's words are not shown | 1 | the card carries the professor's words and the source |
| M20 | quiz-prep-cards.js | the source is not shown | 1 | the card carries the professor's words and the source |
| M21 | quiz-prep-cards.js | the drill is not labelled as the quiz's prep | 1 | Everything on this quiz starts the drill on Quiz 5's 8 questions: every fixture question of modules 9 and 8, and only those modules; the concepts drill (4) has no typed number and the calculations drill (4) only typed numbers; the Quiz 4 straight pass queues each of its 12 questions once |
| S01 | step.js | a misspelt field is accepted | 1 | a field the module does not read stops the build and says so |
| S02 | step.js | a tag in covers, quote or src is accepted | 1 | a tag in covers stops the build and says so |
| S03 | step.js | any tag in a said line is accepted | 1 | a tag other than sub, sup, b, i, em in a said line stops the build and says so |
| S04 | step.js | two quizzes with one id are accepted | 1 | two quizzes with one id stops the build and says so |
| S05 | step.js | negative minutes accepted | 1 | minutes below 0 stops the build and says so |
| S06 | step.js | a when that is not YYYY-MM-DDTHH:MM accepted | 1 | a when that is not YYYY-MM-DDTHH:MM stops the build and says so |
| S07 | step.js | a quiz that covers no question accepted | 1 | a quiz that covers no question stops the build and says so |
| S08 | step.js | a module no question carries accepted | 1 | a module no question carries stops the build and says so |
| S09 | step.js | a topic TOPICS does not have accepted | 1 | a topic that TOPICS does not have stops the build and says so |
| S10 | step.js | an id with a space accepted | 1 | an id with a space stops the build and says so |
| S11 | step.js | an empty quiz list accepted | 1 | no quizzes stops the build and says so |
| S12 | step.js | said that is not a list accepted | 1 | said that is not a list stops the build and says so |
