| Behaviour (Basic-Pharmacokinetics `ac2eb73`) | Source | Kit | Notes |
|---|---|---|---|
| Notes kept with the progress as `DB.notes` {id: {t, at}} | `src/views.js` 5570 | ported | Same field and shape, so PK's saved notes read in unchanged. The kit does not create `DB.notes` until a note is typed (PK created it on first read). |
| "✎ Note" button on the quiz card | `src/views.js` 1791 | ported | Added to the card's head after the core draws it. |
| "✎ Note" button on the exam paper's card | `src/views.js` 1587, 3309 | ported | Both layouts: the core's one at a time, and study-controls' all on one page. |
| "✎ Note" button on the paper's result cards | `src/views.js` 3425 | ported | |
| "✎ Note" button on the "all on one page" quiz cards | `src/views.js` 1494 | adapted | The kit's one-page quiz is study-controls'; its cards get the button when that module is on. |
| Button reads "✎ My note" when a note exists, updated as the note is typed | `src/views.js` 5571, 6373 | ported | |
| The box opens under the card's head; a second tap closes it; focus goes to the text | `src/views.js` 6361-6368 | ported | |
| Saved as it is typed; an emptied note is removed | `src/views.js` 6369-6375 | ported | Through the core's `save()` (written 150 ms after the last change). |
| Box label and hint text | `src/views.js` 5572-5574 | ported | Same words. Text size 16 px (PK 15 px), so a phone does not zoom in. |
| The answer last given, as text, and right/guessed/missed | `src/views.js` 5577-5586 (noteMyAnswer) | adapted | The kit's matching answer is a list of row picks (PK: an object of pairs); kinds other than multiple choice, numeric and matching are written as their recorded value. |
| The whole set as one Markdown text: title, request, per question the stem, options, my answer, key, working or why, my note | `src/views.js` 5589-5608 (notesMarkdown) | adapted | Course name and exam from course.js; the request is the `request` option (PK's names "Dr. Mosley" and "her equation sheet"); "Her key" becomes "Key"; each section is headed by its topic (PK: its module); matching questions list their rows and choices. Oldest note first, as PK. |
| `{{frac:a|b}}`, tags and entities written as plain text | `src/views.js` 5587 (plain) | ported | |
| A paper still running leaves its key out, in the text and on the tab | `src/views.js` 5591, 5598, 5618, 5627 | ported | |
| Notes tab: every noted question, newest first, with date | `src/views.js` 5612-5643 | ported | Date written with the browser's own format (PK: fmtWhen). |
| Notes tab filter chips | `src/views.js` 5614-5616, 5623, 5651 | adapted | By topic (the kit's questions have no module number). |
| Notes tab card: stem, figure, options, your answer, key and working folded, the note to edit | `src/views.js` 5624-5641 | adapted | Stem and options as plain escaped text (PK used its own formula and rich-text drawing, which the kit core does not have); numeric working as the step lines. |
| PK's origin tag and ★ likely tag on the Notes card | `src/views.js` 5635 | omitted | The kit core has no origin or likely tags; the student does not see where a question came from or whether it is starred on this card. |
| Empty Notes tab text | `src/views.js` 5619-5621 | ported | "Exam sim paper" written "exam paper". |
| Copy for AI (clipboard, with the old textarea fallback) and "Copied ✓" | `src/views.js` 5645-5647 | ported | |
| Download (.md) | `src/views.js` 5648-5649 | adapted | File name `<course id>-my-questions.md` or the `file` option (PK: PHAR4221-my-questions.md). |
| Drill these / Drill this question | `src/views.js` 5650, 5652 | ported | Through the core's `drillList`. |
| Delete note, with a confirm | `src/views.js` 5653 | ported | |
| Weak spots line with the count and "Open Notes" | `src/views.js` 2062-2063 | ported | Placed after the statistics row (or after the heading when nothing is answered yet). |
| Notes tab in the nav, between Weak spots and Exam | `src/views.js` 290, 302; `src/shell.html` 1073 | ported | Through `X.tab`. |
| Module colours on the Notes tab's chips | `src/views.js` 6337-6339 | omitted | The kit has no module colours; the chips are plain. |
| Flags on a paper: ⚐ Flag / ⚑ Flagged per paper question (`EX.flags`), ⚑ in the Go to list, the count on Submit, the list and marks on the results, kept with the paper through a reload | `src/views.js` 5575, 1587, 3309, 3328, 3354, 3418, 3425, 6376-6383 | omitted | Not a second flag store: the kit's flags are study-controls' (`DB.flags`, PR #16), which has its own Flag button on the paper and its results and lists the paper's flagged questions. With study-controls off, the student has no flags. |
| (kit) Flag mark on a Notes card | none in PK's Notes tab | adapted | When study-controls is on, a flagged question's card on the Notes tab says "⚑ flagged", read through `FX.api('study-controls')` each time the tab draws. |
| (kit) Settings line on what is kept | none | adapted | Says that Export, Import and Erase cover the notes. |
| (kit) A saved note in another shape is dropped on load | none | adapted | `X.progress`; keeps every `{t: text, at}`. |
