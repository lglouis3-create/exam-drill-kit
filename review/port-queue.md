# Port queue: Pharmacokinetics features into the kit (Tier 2)

Louis approved on 2026-11-01: the Tier 1 features of the Pharmacokinetics drill are
ported now (feature modules, formulas in text, number grading, calculations on exam
papers, problem sets in parts, the equations sheet, wrong-number reading); the Tier 2
features below are ported one per night by the scheduled task "Kit feature port"
(session "Kit feature porter"), each as one kit pull request titled "Port: <feature>"
for Louis's yes. Tier 3 (walkthroughs with audio, Hear why, the most-likely paper,
origin tags, the sheet map, the clip after a paper, textbook reading cards, module
colours) waits until Pharmacokinetics itself moves.

Source lines are in lglouis3-create/Basic-Pharmacokinetics- `src/` at ac2eb73, from the
read-only assessment of 2026-11-01; the port re-reads them. A port pull request sets its
item's status to `done`.

| Order | Item | Pharmacokinetics source | FEATURES.md | Status |
|---|---|---|---|---|
| 1 | plan-the-problem (set-up drill) | `views.js` 4754-5120 | listed | pending |
| 2 | worksheets-ink (write-on worksheets and ink) | `views.js` 5122-5434, 6040-6322 | listed | pending |
| 3 | terms-variables (Terms tab and variables quiz) | `views.js` 1029-1260, 1072-1147 | listed (glossary entry omits PK) | pending |
| 4 | concept-statuses | `views.js` 2506-2725 | FEATURES.md line 36 wrongly says the core has them | pending |
| 5 | theme (light and dark) | `views.js` 6323-6383 | none | pending |
| 6 | paper-picker (choose a practice paper, paper history) | `shell.html` 1099-1217; `views.js` 3083-3170 | none | pending |
| 7 | quiz-prep-cards | `views.js` 466-546 | none | pending |
| 8 | module-pages (Concepts, Calculations by type, Worksheets) | `views.js` 722-854 | none | pending |
| 9 | stopwatch | `views.js` 1467-1482 | listed | pending |
| 10 | notes (Notes tab and flags) | `views.js` 5564-5654 | listed | pending |
