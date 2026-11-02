| Mutation | Exit code | Checks that FAILed |
|---|---|---|
| M1 a typed note is not saved | 1 | the note is still there after a reload; the test ran to its end; the test stopped: page.evaluate: TypeError: Cannot read properties of undefined (reading 'nt-many-15') |
| M2 a running paper never hides the key | 1 | a note on a running paper leaves its key and the reason out of the text; the Notes tab hides that question's key while the paper runs |
| M3 the converter keeps bad notes | 1 | a saved note in a bad shape is dropped on load, the others load; the converter keeps each note {t, at} and drops anything else |
| M4 no button on the result cards | 1 | after Submit every result card carries ✎ Note; the test ran to its end; the test stopped: page.evaluate: TypeError: Cannot read properties of null (reading 'textContent') |
| M5 the flag mark never shows | 1 | with study-controls on, the flagged question's card says ⚑ flagged |
| M6 the flag mark always shows | 1 | the mark goes when the flag does; with study-controls on, the flagged question's card says ⚑ flagged |
| M7 notes listed oldest first | 1 | noted() lists every note, newest first; the newest note is first |
| M8 {{frac}} left as written in the text | 1 | the course's {{frac:a|b}} is written (a)/(b) in the text |
| M9 Weak spots miscounts | 1 | Weak spots counts the 2 notes |
| M10 the button label is not updated as the note is typed | 1 | the button then reads My note |
| M11 Delete note deletes nothing | 1 | Delete note removes it; Drill these drills the noted questions |
| M12 Drill these ignores the topic filter | 1 | Drill these drills only that topic's noted questions |
| M13 an emptied note is kept | 1 | Delete note removes it; an emptied note is removed from the progress |
| M14 no second look after the pass (one-page cards miss the button) | 1 | study-controls' one-page paper cards each carry ✎ Note; study-controls' one-page quiz cards each carry ✎ Note |
| M15 the Notes tab shows the key of a running paper | 1 | the Notes tab hides that question's key while the paper runs |
| M16 the key left out of the text | 1 | a key for every multiple-choice, numeric and matching question (7); after Submit the text carries both notes with their keys |
| M17 no button on the quiz card | 1 | the quiz card carries ✎ Note; the test ran to its end; the test stopped: page.click: Timeout 30000ms exceeded. |
| M18 the box does not open | 1 | the test ran to its end; the test stopped: page.fill: Timeout 30000ms exceeded. |
| M19 a saved progress loses its notes on load | 1 | the converter keeps each note {t, at} and drops anything else; the note is still there after a reload; the test ran to its end; the test stopped: page.evaluate: TypeError: Cannot read properties of undefined (reading 'nt-many-7') |
| M20 Download names the file wrongly | 1 | Download saves <course id>-my-questions.md |
