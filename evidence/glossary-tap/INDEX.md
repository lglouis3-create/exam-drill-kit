# Evidence: port queue item 18, `glossary-tap` (PR #13)

Every result here is **agent-run** (the hardening agent, 2026-11-02). The coordinator's own
re-runs go in `coordinator/`, labelled coordinator-verified.

## Inputs

| What | Value |
|---|---|
| Source read | lglouis3-create/Intro-Pharmacology- at `929cd62` (read-only clone `/tmp/ip-readonly`, `exam1-drill/src/`); for the formulas-in-text checks, Basic-Pharmacokinetics- at `ac2eb73` (`/tmp/pk-readonly`, `src/`). BDK not read. |
| Port branch | `port/glossary-tap` |
| Starting commit | `561df5204e5b8816a2630081d08981337344acd3` |
| **Final tested commit** | `5f539d263eced022b913ba8ffb68c3f0075addfb` |
| Commits added | `1722e65` fixes and checks, ci script; `d4f21d0`, `94d0d2f` ci course from real data; `3ee17fe` merge of origin/main `98e7b5b` (CHANGELOG.md conflict, both sides kept); `d5adb84` module-absent run fails cleanly; `003b3de` docs; `c0d3a73` integration patch F4 (tab position, module order); `5f539d2` guard in that tab check |
| origin/main | `98e7b5b9d42d1bc81b84ab6a06eadf554035ecba` |
| core tree (final commit = origin/main) | `c9fde5b23f43746ff8d392314f86e8ff313c1cda` |
| template tree (final commit = origin/main) | `cbac5bd425d480944293f8e1fb5d5d703e8baba1` |
| module tree `features/glossary-tap/current` | start `f4c72cd`, final `0e7965c` |
| Medicinal-chemistry | full clone (32 commits), `main` at `f1f5ee5`, with the branch's `core/` copied into `src/` and committed locally |

`git diff origin/main -- core template` on the final commit: empty. The trees match the new
baseline on `evidence/baseline` (`22b4290`, `main-98e7b5b/`); the no-module template course and
Medicinal-chemistry were also rerun here (logs 17 and 19).

The runs in logs 12, 13, 15, 16 used scratch courses built from `c0d3a73` with `test.js` of
`5f539d2` copied in (the only file that differs); `glossary-tap.js` and `test.js` in those courses
were compared with the final commit (`cmp`: equal). The mutation run (06) used the same files.

## Commands, exit codes, logs (agent-run)

| # | Command | Exit | Result | Log |
|---|---|---|---|---|
| dev | module test of `561df52` on a template course, formulas-in-text absent | 1 | 1 FAIL: "T-affinity-3: no term marked inside its quotation…" (a term inside a quotation was marked) | `logs/dev_test_unfixed_nofx.log` |
| dev | module test of `561df52` with formulas-in-text present | 1 | 6 FAIL: with glossary-tap listed first, `{{frac:FD0\|ClT τ}}` shown as typed and no subscripts in every explanation holding a term button (quiz card and exam review) | `logs/dev_test_unfixed_fx.log` |
| dev | the same after the fix | 0 | PASS 88, then 90, then 93 checks as checks were added | `logs/dev_test_fixed_*.log` |
| 06a | `python3 -I mutations.py` first round (test of `1722e65` before three checks were added) | 0 | 25 of 28 caught; M13, M25, M26 not caught | `logs/06a_mutations_first_round_stdout.log` |
| 06c | recheck of M13, M25, M26 after adding the finder and plural checks | 0 | M25, M26 caught; M13 not caught | `logs/06c_mutations_recheck_M13_M25_M26_stdout.log` |
| 06b | full run on the files of `003b3de` | 0 | 27 of 28 caught | `logs/06b_mutations_at_003b3de_stdout.log` |
| 06 | `python3 -I mutations.py /tmp/port-glossary-tap-h/mut/src logs/mut` on the final files (course with formulas-in-text) | 0 | 27 of 28 caught (table below) | `logs/06_mutations_stdout.log`, `logs/mut/mutation_M*.log`, `logs/mut/mutations_table.md` |
| 10 | `node features/glossary-tap/ci/oncourse.js <kit> /tmp/port-glossary-tap-h/ci/src` on a fresh `mkcourse.sh` course | 0 | wrote terms_gtap.js (10 terms), q1_topics.js (2 topics, 66 questions), guide.js, course.js lectures L04 and L10 | `logs/10_ci_oncourse.log` |
| 10b | the same a second time | 1 | refused: "course.js already switches glossary-tap on" | `logs/10b_ci_oncourse_second_run.log` |
| 11 | `python3 build.py` on that course | 0 | built | `logs/11_ci_build.log` |
| 12 | module test on that course, three times | 0, 0, 0 | PASS 56 checks each (1 skipped: formulas-in-text is not in that course) | `logs/12_module_test_run1.log` … `run3.log` |
| 13 | `run_checks.sh` on that course (the module's own course) | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (cite_check.py: no lecture PDFs), 1 REPORT (explain_check.js) | `logs/13_ci_course_run_checks.log` |
| 14 | the same course with formulas-in-text copied in and switched on first, then the ci script, then `build.py` | 0, 0 | built | `logs/14_fx_ci_oncourse.log`, `logs/14_fx_build.log` |
| 15 | module test with formulas-in-text present | 0 | PASS 93 checks | `logs/15_fx_module_test.log` |
| 16 | `run_checks.sh` on that course | 0 | 27 PASS, 0 FAIL, 1 NOT RUN (cite_check.py), 1 REPORT; formulas-in-text test 11 checks, glossary-tap test 93 | `logs/16_fx_course_run_checks.log` |
| 17 | `run_checks.sh` on a no-module template course (merged core) | 0 | 24 PASS, 0 FAIL, 1 NOT RUN (cite_check.py), 1 REPORT | `logs/17_nomodule_template_run_checks.log` |
| 18 | module test of the final commit on that no-module course | 1 | FAIL: 12 of 12 checks failed (the module does not load, the build step file is missing, no Glossary tab) | `logs/18_module_test_without_module.log` |
| 19 | `run_checks.sh` on Medicinal-chemistry (full clone) with the branch's core | 0 | 23 PASS, 0 FAIL, 2 NOT RUN (stepper_test.js: no step-through figures; cite_check.py: no PDFs), 1 REPORT. `home_test.js` passed (33 checks) in this run; its known intermittent failure on main did not occur | `logs/19_medchem_full_clone_run_checks.log` |
| 20, 21 | `make_shots_course.js`, `build.py`, `screenshots.js` | 0, 0, 0 | 3 PNGs | `logs/20_*.log`, `logs/21_screenshots.log`, `screenshots/` |
| GH | GitHub "Kit checks" workflow on `5f539d2` (run 41520960724) | success | Chromium template, template-unset, medicinal-chemistry: success; WebKit template (informational): failure, as on main `98e7b5b` (run 41511239388) | — |

The workflow builds the template and Medicinal-chemistry only; it does not run the module's own
course, which logs 10-16 cover.

## The module's own course (HARDEN 9a)

`ci/oncourse.js` writes Intro to Pharmacology's data at `929cd62`, from the `FIX` and `FIXCOURSE`
lines of `test.js` (made by `scripts/gen_fix.js` and `scripts/gen_course.js` from the read-only
clone): lectures L04 and L10 (course.js), the course's 7 skills, topics L04 and L10 (q_L04.js,
q_L10.js), 66 questions, the 10 terms (glossary.js) and guide.js sections 1 and 4 (opening lines).
The one change to the data: every `prof` is "Professor". Questions are one per line as
`{id:'…', prof:'Professor', …}`; lectures are literals `{id:'L04', …}` inside course.js's own
`lectures: [` list; the template's sample questions and guide are replaced. Left out, by id,
without rewording (each made a core check FAIL):

| Question | Why left out |
|---|---|
| L04-048 | two options (test.js wants at least 3) |
| L04-008 | its cite names no lecture deck (test.js) |
| L10-042, L10-051 | style_check.js: study meta-commentary ("…not memorized") |
| any L04/L10 question with `fg`, `graph`, `img` or `dupOf` | a figure, graph or image of the course's own, or a link to a question not in this course |

No stem tripped style_check's "given as". Lecture L02, where most of the fixture's terms are taught,
is not used, and Exam 1's other lectures alone do not work: see the core findings below.

## What the module stores (QUALITY C)

Nothing. It has no `DB` field and does not use the store or `localStorage`; the Glossary tab's
search, order and group live in memory until the page is reloaded (as in the source, `app.js` 1772).
So C applies only as: the saved keys are unchanged after the glossary is searched, letters and
groups used, terms tapped and opened (check "the module stores nothing", 4 keys compared); with
`setItem` throwing `SecurityError` and with it throwing `QuotaExceededError`, the Glossary tab and
the taps work with no module error. Export/Import, profile switch and the reload at 150 ms: NOT RUN,
because the module saves nothing they could carry or lose.

## Faults found

1. **Fixed:** with `formulas-in-text` listed after `glossary-tap` in course.js, every explanation
   that held a term button kept its formulas unset (`{{frac:FD0|ClT τ}}` as typed, `ClT` without a
   subscript), because formulas-in-text leaves alone an element that holds a button. The module now
   runs formulas-in-text's pass over the card first (through `FX.api('formulas-in-text').setPane`,
   inside `FX.run` so a fault there is that module's). Mutation M1 shows the test catches it.
2. **Fixed:** a term inside a quotation (T-affinity-3's quoted poll sentence) was marked. Now not,
   unless the quotation is the term's name alone (L10-030's “cheese effect”). `<blockquote>`, `<q>`
   and the `quote` class are skipped too (PK guide.js line 94 is a `<q>`).
3. **Fixed (test):** the module-absent run crashed (`FX is not defined`) instead of failing its
   checks; the integration patch F4 (tab position, module order) applied with a guard for the same.

## Core findings (for a separate core proposal; core not changed)

- `core/state_check_test.js` adds a lecture with the fixed id `L02` and expects it to be new; on a
  course that already has a lecture L02 (Intro to Pharmacology's real lecture ids) its check "a
  lecture committed after the last CLAUDE.md change: FAIL, naming it" fails (`logs/dev_ci_run_checks3.log`).
- `core/render_test.js` starts a quiz on `TOPICS[0].subs[0]` and crashes when that subtopic has no
  question (Intro to Pharmacology's L02 "review" subtopic once L02-001 is left out) (`dev_ci_run_checks3.log`).
- `cite_check.py`'s slide pattern does not read approximate slide numbers ("slide ~31"), which every
  Exam 1 lecture of Intro to Pharmacology uses, so `tables_test.js` fails on a course with only those
  citations (`logs/dev_ci_run_checks.log`); lecture L10's citations ("slide 12") are read.
- `render_test.js` logs "feature module glossary-tap (tab): TypeError: nav.querySelector is not a
  function": its stand-in page has no real nav for a module tab. The check still passes.

## Mutation checks

Script: `mutations.py` (each mutation an exact replace that must match once; rebuild; module test;
original restored). Course: the module's own course with formulas-in-text on. Table:
`logs/mut/mutations_table.md`, copied below.

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

## Screenshots

`screenshots/1_quiz_card_tap_with_formulas.png` (glossary-tap listed first: a stacked fraction and
subscripts beside underlined terms, Elimination opened), `2_guide_term_inside_fraction.png`,
`3_glossary_tab.png`.

## Not run

- WebKit (Safari) locally: NOT RUN, Chromium only in this container. The GitHub workflow's WebKit job
  (informational) fails on the template course on main as well.
- Persistence tests other than the stores-nothing and storage-blocked/full checks: NOT RUN, nothing saved.
