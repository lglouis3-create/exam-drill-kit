## Behaviour map (from Intro to Pharmacology `exam1-drill/src/app.js` and `shell.html` at `929cd62`)

| Source | Behaviour | Status |
|---|---|---|
| `app.js` 41 | `fmtCite`: an approximate range "~21–~22" is printed "~21–22" | **ported** |
| `app.js` 312 | `termName`: a term's name without its closing bracket ("Pharmacodynamics (PD)" reads "Pharmacodynamics") | **ported** as `nameOf`, and **adapted**: the kit also uses it to find a term in text for the tap |
| `app.js` 1772 | the Terms tab's state (`TM`: mode, group, search, order, scope) kept in memory only, not saved | **ported** (`G`: search, order, group; in memory only, nothing saved) |
| `app.js` 1773-1777 | the list is the terms of the exam being studied; Exam 4 also lists the professor's Exam 3 terms | **omitted**: the student sees every term of the course at once; there is no "this exam only" list. It needs the several-exams-on-one-site core change in the port queue |
| `app.js` 1782-1783 | the letter bar A-Z and `#`; a term's letter is its first letter, `#` when it starts with no letter | **ported** |
| `app.js` 1786 | `tScene`: the situation card shows `sceneQ` when written, none when `dropScene` | **omitted**: used by the flashcards only (item 16); the glossary card shows `scene`, as the source's `termHTML` does |
| `app.js` 1787 | `termHTML`: name, one-line meaning, definition, "In action:" situation, example, figure, source | **ported**; **adapted**: the figure is a key of the kit's `diagrams.js` `DIA` (the source's `figHTML` and `graphs.js` are not ported); the "Exam N" label beside a term is omitted (only shown when both exams are listed together) |
| `app.js` 1794 | the search filters on name, one-line meaning, definition and situation as you type | **ported** |
| `app.js` 1797 | no match: "No term matches “…”. Try a shorter word, or pick a letter above." | **ported** |
| `app.js` 1797 | empty group: "No terms for <exam> yet." | **adapted**: "No terms in this group." (no exam scope) |
| `app.js` 1800-1803 | a search lists "Term names with “…”" first, then "Also mentioned in", each A-Z | **ported** |
| `app.js` 1804-1807 | A-Z order: one heading per letter | **ported** |
| `app.js` 1808-1811 | by group: one heading per group, in the course's order | **ported** |
| `app.js` 1813-1821 | "All exams": one folding section per exam | **omitted** (exam scope, above) |
| `app.js` 1824 | the count: "N matches" while searching, "N terms" otherwise | **ported** |
| `app.js` 1827-1828 | Clear empties the box, redraws, keeps the focus in the box | **ported** |
| `app.js` 1829-1830 | the order chips (By group, A-Z) | **ported** |
| `app.js` 1831 | the scope chips ("<exam> only", "All exams") | **omitted** (exam scope, above) |
| `app.js` 1832-1837 | a letter clears the search, switches to A-Z and scrolls to that letter | **ported** |
| `app.js` 1839-1850, 1852 | the floating "↑ Search or pick a letter" button once the search bar is off screen; one scroll watcher at a time | **ported** |
| `app.js` 1856 | no terms: "No glossary in this build." | **ported** ("No glossary terms in this build.") |
| `app.js` 1858-1859 | the groups of the exam being studied listed first | **adapted**: the groups in the course's order (no exam scope) |
| `app.js` 1863 | "Smith focus" forces this exam only | **omitted**: the kit has no professor focus |
| `app.js` 1864-1865, 1868 | the group chips; a chip whose group has gone resets to All | **ported** |
| `app.js` 1866-1867 | the tab's heading and subtitle with the per-exam counts | **adapted**: "N terms, each with its source", plus one line on the tap when it is on |
| `app.js` 1867 | the Glossary / Flashcards / Quiz me mode chips | **omitted**: the student gets the glossary only. Flashcards are item 16; the term questions are item 3's Terms work (built by the course's `gen_terms.py`) |
| `app.js` 1878-1898, 1912-1918 | Flashcards: due, new and seen cards, "Knew it" / "Not sure" / "Did not know", scheduled and saved | **omitted** (item 16) |
| `app.js` 1899-1903, 1919-1922 | "Quiz me": the generated term questions | **omitted** (item 3) |
| `shell.html` 238, 251-253, 269, 295-296 | the search bar, letter bar, floating button (raised above a Back button) and term card styles | **ported** to `glossary-tap.css` |
| `shell.html` 270 | extra space at the bottom of the page while the floating button shows | **omitted**: the floating button can cover the last line of the list until it is used |
| `shell.html` 213 | larger touch targets on a coarse pointer | **ported** for the letter buttons |
| `browser_test.js` 53-56 | the glossary shows its terms and its figures | **ported** (test.js) |
| `browser_test.js` 320-322 | this-exam-only and all-exams lists | **omitted** with the exam scope |
| (none) | tap a term: after an answer, the first mention of each term in a question card's explanations and concept block (quiz card and exam review), and in each section of the Guides, Tell apart and Reference tabs, is a button that opens its meaning, definition and source under the line, with "Open in the Glossary" | **written for the kit**: Intro to Pharmacology has no tap code |
| (none) | the tap leaves alone a term the core's `GLOSS` defined in brackets in that question, a term a section's word list (`<dt>`) defines, headings, buttons, links, figures, an option's own text, the source line, and quotations (`<blockquote>`, `<q>`, words in quotation marks unless the quotation is a term's name alone) | **written for the kit** (the quotation rule added in this hardening) |
| (none) | with formulas-in-text on, its pass over a question card runs first, whichever order course.js lists the two | **written for the kit** (added in this hardening, after the test found the fault) |
