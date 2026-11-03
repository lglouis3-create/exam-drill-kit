<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

**Status: draft, Port (incomplete).** Under rule 5 it stays a draft while these remain:
- the exam-by-exam scope of the term list (needs the several-exams-on-one-site core change);
- the extra space at the bottom of the list while the floating button shows;
- an abbreviation inside the name's brackets ("PD") is not found in text.

Flashcards (item 16), the term questions (item 3) and Intro to Pharmacology's own figures belong to other items and are not part of this one.

Needs (`module.json` `needs`): none. Optional partner: `formulas-in-text` (on `main`), tested present and absent.

At the final tested commit `5f539d2`, these passed: the module test and `run_checks.sh` on the module's own course of real Intro to Pharmacology data, and the module test with formulas-in-text on (coordinator-verified, below); and the three blocking GitHub "Kit checks" jobs (Chromium on template, template-unset and medicinal-chemistry, run 41520960724, checked by the coordinator). The informational WebKit job failed; it is not Safari, and it does not block a merge. Safari is NOT RUN. The combination run with every module on has not been repeated on this commit.

Port queue item 18, Tier 2b (`review/port-queue.md`). It needs your yes before it merges. Intro to Pharmacology's code was only read, from a read-only copy at `929cd62`, from about 11:00 CT on 2026-11-02 (after its Exam 4). As you asked, only Intro to Pharmacology's version is ported: BDK's glossary was not read and stays with the BDK move.

## What the feature does

The module reads the course's term list, `TERMS` (one entry per term: name, group, definition, source, and where the course has them a one-line meaning, a situation that shows the term in action, the professor's example and a figure). Intro to Pharmacology's `glossary.js` has 295 terms in 22 groups in this shape, and Pharmacokinetics' `glossary.js` uses the same shape.

- **A Glossary tab** (ported from Intro to Pharmacology's Terms tab, its glossary part: `app.js` lines 1771-1922 at `929cd62`, `termHTML`, `glossWire`, `vTerms`). Every term is shown with its meaning, definition, "In action" situation, example, figure and source. A search box filters as you type. It lists the terms whose name matches first, then the terms that only mention the word, with a count. A letter bar jumps to a letter and switches to A-Z order; letters with no term are greyed out. The list can be ordered by group or A-Z, and group chips narrow it. Once the search bar has scrolled off the screen, a floating button brings it back.
- **Tap a term** (written for the kit; Intro to Pharmacology has no code for this). Nothing is marked until an answer has been shown. Then, on the question card and in the exam review, the first mention of each term in the explanations and the concept block is underlined. Tapping it opens the term's meaning, definition and source under that line, with a button that opens the term in the Glossary tab (the Back button returns to the question). A second tap closes it. In the Guides, Tell apart and Reference tabs the first mention in each section is underlined the same way. The stem, the option's own text, the source line, headings, buttons, links, figures and quotations are never marked; a quotation that is only a term's name (“cheese effect”) is.
- **With `formulas-in-text`** (already on main): both modules change the explanation text after it is drawn. Whichever order the course lists them in, fractions stack, subscripts are set and terms are underlined, including a term inside a fraction.

**What the core already had, and how the module fits with it.** The core's `glossary.js` (`GLOSS`) and `views.js` (`glossify`) put a short definition in brackets after the first use of a term in a question's explanations. The module does not repeat that:
- a term the core has defined in brackets in a question is not underlined anywhere in that question;
- a term a reading section defines in its own word list (`<dt>`) is not underlined in that section.
The core had no list of terms to browse and nothing to tap.

**Kept separate from item 3** (Pharmacokinetics' Terms tab and variables quiz): this module has its own tab (`glossary`) and does not include flashcards or term questions. Both modules can read the same `TERMS` data, because the two courses use the same shape.

## What changes

- New folder `features/glossary-tap/current/`: the module code, its styles, a build step, `module.json` and its test.
- New `features/glossary-tap/ci/oncourse.js`: writes the module's own course for the kit's checks, from Intro to Pharmacology's own data (below).
- Options: `label` (tab name, default "Glossary"), `before` (the tab it sits before, default Settings), `tap` (default on), `notTapped` (term ids never underlined, for a word used in almost every sentence, such as "drug").
- The build stops with the reason when:
  - there is no `TERMS`, or it is empty;
  - an id is used twice;
  - a term has no name, group, definition or source;
  - a `fig` is not a figure in `diagrams.js` `DIA`;
  - a `lecture` is not in `COURSE.lectures`;
  - two terms would be found by the same name;
  - a `notTapped` id is not a term.
- How a term is found in text: by its name without a closing bracket ("Pharmacodynamics (PD)" is found as "Pharmacodynamics"), as a whole word, with an optional plural s or es, the longest name first ("Receptor tyrosine kinase" before "Receptor"). The code has no regex lookbehind.
- Catalog bookkeeping:
  - `FEATURES.md`: a new `glossary-tap` entry after `glossary`.
  - `features/README.md`: one row added.
  - `review/port-queue.md`: item 18 set to `partial (left: the per-exam scope of the list, which needs the several-exams core change; …)`.
  - `CHANGELOG.md`: one entry under 2026-11-02 (merged with main's entry for the Kit checks workflow).

## What is not ported, and why

- The exam-by-exam scope of Intro to Pharmacology's list ("this exam only" or "all exams", and Exam 4 including Exam 3's terms). It needs the several-exams-on-one-site core change listed in the port queue.
- The Terms tab's Flashcards and "Quiz me" modes. Flashcards is item 16. The term questions belong to item 3's Terms work, and Intro to Pharmacology builds them with a build-time script (`gen_terms.py`).
- Intro to Pharmacology's own figures (`graphs.js`). In the kit, a term's `fig` names one of the course's `DIA` figures.
- Extra space at the bottom of the list while the floating button shows (`shell.html` 270): the button can cover the last line until it is used.
- An abbreviation inside the name's brackets ("PD") is not found in text.

## What does not change

- No course site changes. No course switches this module on, and no course repository was touched.
- `core/` and `template/` are unchanged (`git diff origin/main -- core template` is empty).
- A course without the module builds the same page as before.

## Corrections to the first version of this text

- "Running this module together with `formulas-in-text`: not checked." It is now checked, and the check found a fault in the first version: with `glossary-tap` listed first, explanations that held a term button showed `{{frac:…}}` as typed and no subscripts. Fixed (see Review evidence).
- "The exam review's underlined terms: not checked." Now checked: terms are underlined per question card, and a tap opens the definition.
- "43 checks pass" and "2 of 12 checks FAIL without the module" were the first version's counts. Now: 56 checks (93 with `formulas-in-text` in the course); without the module, 12 of 12 FAIL.
- Item 18 was marked `done`; it is `partial`, because the per-exam scope is left.
- The module-on course was the template with test terms added; it is now built from Intro to Pharmacology's own lectures, questions, terms and guide.

## Review evidence

Final tested commit: **`5f539d263eced022b913ba8ffb68c3f0075addfb`** (branch `port/glossary-tap`, started at `561df52`; origin/main `98e7b5b` merged in). Evidence branch: **`evidence/glossary-tap`** (`evidence/glossary-tap/INDEX.md`, every command with its exit code and log). Core tree `c9fde5b`, template tree `cbac5bd`: the same as main.

### Faults found
1. **Fixed in the module:** with `formulas-in-text` listed after `glossary-tap` in course.js, every explanation holding a term button kept its formulas unset, because `formulas-in-text` leaves alone an element that holds a button. The module now runs `formulas-in-text`'s pass over the card before it adds its buttons.
2. **Fixed in the module:** a term inside a quotation (a quoted poll sentence) was underlined. Now it is not, unless the quotation is the term's name alone.
3. **Fixed in the test:** without the module the test crashed instead of failing its checks; the integration check's patch (tab position, module order with other modules on) is applied.

### Check results (all agent-run)

| Check | Result |
|---|---|
| Module test on the module's own course, 3 runs | PASS 56 checks, each run (1 skipped: `formulas-in-text` not in that course) |
| `run_checks.sh` on the module's own course | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`) |
| Module test with `formulas-in-text` present | PASS 93 checks (both course.js orders and `formulas-in-text` alone) |
| `run_checks.sh` with `formulas-in-text` present | 27 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT |
| Module test on a page without the module | FAIL, 12 of 12 checks (as it must) |
| `run_checks.sh`, no-module template course | 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT |
| `run_checks.sh`, Medicinal-chemistry full clone (`f1f5ee5`) with this core | 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures; `cite_check.py`: no PDFs), 1 REPORT. `home_test.js` passed (33 checks, before kit PR #28's fix) |
| `ci/oncourse.js` on a fresh course; a second run | exit 0; exit 1 (refuses to run twice) |
| Mutation checks | 27 of 28 caught (table below) |
| GitHub "Kit checks" on `5f539d2` | Chromium template, template-unset, Medicinal-chemistry: success. WebKit (informational): failure, as on main `98e7b5b` |
| WebKit locally | NOT RUN: Chromium only in this container |

**The module's own course** (`ci/oncourse.js`): Intro to Pharmacology at `929cd62`: lectures L04 and L10, its 7 skills, topics L04 and L10, 66 of their questions, the 10 terms of the test and its guide excerpt. The one change to the data: every `prof` is "Professor". Left out by id, not reworded: L04-048 (two options), L04-008 (cites no lecture deck), L10-042 and L10-051 (`style_check.js`: study meta-commentary), and questions with the course's own figures, graphs, images or `dupOf`. No stem tripped "given as".

### Persistence
The module saves nothing (no `DB` field, no store, no `localStorage`); the Glossary tab's search, order and group last until a reload, as in Intro to Pharmacology. Checked: the 4 saved keys are unchanged after the glossary and taps are used; with storage blocked (`SecurityError`) and full (`QuotaExceededError`) the tab and the taps work. Export/Import, profile switch and reload timing: NOT RUN, nothing to carry.

### For a separate core proposal (core not changed)
- `core/state_check_test.js` adds a lecture with the fixed id `L02`; on a course that already has a lecture L02 (Intro to Pharmacology's real ids) one of its checks fails. The module's own course therefore uses L04 and L10, not L02.
- `core/render_test.js` crashes when the first topic's first subtopic has no question.
- `cite_check.py` does not read approximate slide numbers ("slide ~31"), which every Exam 1 lecture of Intro to Pharmacology uses, so `tables_test.js` fails on a course with only those citations.

### Mutation table

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

M13 is not caught and no check was added: the card's source line (`.cite`) is outside the
explanation and concept parts the tap walks, so removing its class from the skip list changes nothing
on any course's data; the rule only matters for a reading tab that uses the class `cite`, which no
course has.

### Behaviour map
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

### Coordinator-verified re-run (2026-11-02, commit `5f539d2`, core `c9fde5b`, template `cbac5bd`)

Folder `evidence/glossary-tap/coordinator/glossary-tap-5f539d2/` on `evidence/glossary-tap` (`2806983`).

| Check | Exit | Result |
|---|---|---|
| `ci/oncourse.js` on a fresh template course, then `build.py` | 0, 0 | built |
| Module test, 3 runs | 0, 0, 0 | 56 PASS each (1 skipped: formulas-in-text not on) |
| Module test with `formulas-in-text` on, 3 runs | 0, 0, 0 | 93 PASS each |
| `run_checks.sh` on the module's own course | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no PDFs), 1 REPORT |
| No-module template course and Medicinal-chemistry (full clone `f1f5ee5`) | 0, 0 | cited from `evidence/baseline` `main-98e7b5b/` (same trees): 24 PASS / 1 NOT RUN / 1 REPORT and 23 PASS / 2 NOT RUN / 1 REPORT |

Not re-run by the coordinator: the mutation runs and `run_checks.sh` with formulas-in-text on (agent-run: 27 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT).

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
