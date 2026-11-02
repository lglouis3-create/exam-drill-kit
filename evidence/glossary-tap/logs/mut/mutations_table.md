| Mutation | What it breaks | Test exit | Checks that FAILed |
|---|---|---|---|
| M0 | no mutation (control) | 0 | PASS: features/glossary-tap/test.js: 93 checks passed |
| M1 | formulas-in-text pass not run first (order fix removed) | 1 | glossary-tap first, quiz card: no {{frac: or markup shown as text; the 3 fractions stack; subscripts set; glossary-tap first, quiz card: with the buttons put back to text, each explanation and the concept block are exactly as formulas-in-text alone draws them; glossary-tap first, exam review: no {{frac: or markup shown as text; the 3 fractions stack; subscripts set (+2 more) |
| M2 | a term inside a quotation is marked (quote rule removed) | 1 | T-affinity-3: no term marked inside its quotation of the poll sentence, which stays whole; receptor is marked at its next mention |
| M3 | a quotation of a term's name alone is not marked | 1 | L10-030: “cheese effect”, a quotation of the name alone, is marked |
| M4 | links are marked (A removed from the skipped tags) | 1 | a term inside a link is not marked (guide4 section 23 names "drug" only in a link) |
| M5 | <q> quotations are marked (Q removed from the skipped tags) | 1 | formulas-in-text first, guide: nothing is marked in the line that quotes the professor in <q> (guide.js line 94), which names pharmacokinetics; glossary-tap first, guide: nothing is marked in the line that quotes the professor in <q> (guide.js line 94), which names pharmacokinetics |
| M6 | every mention marked, not the first only | 1 | after the answer, 18 terms are marked, each once; a term the core has glossed in brackets is not a button in that question; the others are; in a guide section each term is marked once (+6 more) |
| M7 | the core's bracketed gloss not respected | 1 | a term the core has glossed in brackets is not a button in that question; the others are |
| M8 | the stem is marked too | 1 | before the answer is shown, no term is marked; none in the stem, an option's own text or the verdict; the exam review marks terms in each question card, each once, none in the stem, an option's own text or the source line (+4 more) |
| M9 | an option's own text is marked | 1 | none in the stem, an option's own text or the verdict; the exam review marks terms in each question card, each once, none in the stem, an option's own text or the source line |
| M10 | a word list (dt) does not count as a definition | 1 | a new section marks affinity again, but not efficacy, which its word list defines |
| M11 | a new section (h3) does not start over | 1 | in a guide section each term is marked once; a new section marks affinity again, but not efficacy, which its word list defines |
| M12 | the exam review is not marked | 1 | the exam review marks terms in each question card, each once, none in the stem, an option's own text or the source line; L02-018 in the exam review marks affinity (the review has no bracketed gloss) and efficacy |
| M13 | the source line is marked | 0 | PASS: features/glossary-tap/test.js: 93 checks passed |
| M14 | a second tap does not close | 1 | a second tap closes it |
| M15 | "Open in the Glossary" goes to the wrong tab | 1 | "Open in the Glossary" opens the tab at the term, with the way back to the question |
| M16 | the module saves the last tapped term | 1 | the module stores nothing: the 4 saved keys are unchanged after the glossary and taps are used; with storage blocked (setItem throws SecurityError), the glossary and the taps work; with storage full (setItem throws QuotaExceededError), the glossary and the taps work |
| M17 | option tap ignored | 1 | with tap off, nothing is marked and the Glossary tab stays |
| M18 | option notTapped ignored | 1 | with notTapped, that term is no longer found |
| M19 | search: names that match not listed first | 1 | a search lists the 2 names that match first, then the terms that mention the word |
| M20 | search reads the name only | 1 | a search lists the 2 names that match first, then the terms that mention the word; 8 matches, counted, with Clear shown |
| M21 | a letter does not switch to A-Z | 1 | a letter switches to A-Z order, by first letter, and jumps to it |
| M22 | letters with no term not disabled | 1 | the letters with no term are disabled |
| M23 | a group chip does not narrow | 1 | a group chip shows that group only (5 terms) |
| M24 | no floating button | 1 | the floating button appears once the search bar is off screen |
| M25 | shortest name first in the finder | 1 | all 10 terms are found by their own name, as themselves; in the page, each of the 10 terms is found by its own name, as itself |
| M26 | no plural s/es | 1 | a plural is found: "receptors" in T-affinity-3's concept block is Receptor |
| M27 | build step accepts two terms found by one name | 1 | two terms found by the same name stops the step with its reason; a duplicate name stops the build, with no page written |
| M28 | build step accepts a fig not in DIA | 1 | a figure not in DIA stops the step with its reason |
