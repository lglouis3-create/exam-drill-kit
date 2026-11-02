## Behaviour map (agent-run reading of Basic-Pharmacokinetics `ac2eb73`, `src/views.js`)

| Behaviour in the source | Source line | Status | Note |
|---|---|---|---|
| A card per module on Topics with Concepts, Calculations, Worksheets buttons, a question count and progress (`moduleCard`, `modBtn`) | 750-770 | adapted | The cards sit above the core's topic list (PK's Topics has no topic list); a button shows only when its section has questions; the meter is the core's mastered meter plus an answered bar |
| A module gathers the topics most of whose questions carry its number (`modulePool`, `moduleOfTopic`, `outline`) | 731-734, 370-387 | adapted | A question's module is its own `module` field, else its lecture's `module` (`COURSE.lectures`); the module list and headings come from the `modules` option, else the lectures' order; PK's `topicsMenu` exam and view entries are not part of this module |
| Concept or calculation: numeric, or matching of a calc skill with quantities (`kindOf`) | 213-219 | ported | Skill kind read from `COURSE.skills[].kind` |
| Concepts page: All objectives and one row per objective with its concept questions, objective label (`conceptsPage`, `objectivePool`, `objLabel`) | 735-737, 782-791 | adapted | Pool limited to the module; PK's deck 6a/7a label rule is course-specific, so an objective may carry its own `label`, else "Objective n"; concept questions no objective takes get an "Other concept questions" row |
| An objective's drill is adaptive (`startPool`) | 844-845 | ported | |
| A calculation belongs to the first kind of its module it matches, by topic, topic/sub and skill (`calcTypeOf`) | 739-745 | ported | |
| Calculations page: All calculations as one shuffled pass; per kind: count, progress, Single problems (a pass), worked example with stem, working, answer, cite (`calcsPage`) | 792-813 | ported | Working drawn in the core's step format; formulas set by formulas-in-text when on |
| Per kind: In parts for one problem set, a fold of sets when more than one (`chainsForType`, `chainRow`) | 748, 803-810 | ported (with chained-problem-sets on) | Not drawn without that module |
| "Her lecture examples, in parts" (`chainsOfKind(module, ['example'])`) | 811-812 | ported (with chained-problem-sets on) | A set with `src` 'example' or no `src` |
| Origin mix in captions ("12 daily practice sheet, 4 slide example") (`originMix`) | 794, 798 | omitted | The student does not see where each problem in a kind comes from; `originOf` is PK's Tier 3 origin tags |
| Extra practice rows (`EXTRAS`, `extrasOf`, `data-xtype`) | 813-820, 851-852 | omitted | The student does not get PK's extra practice problems; they live outside `QUESTIONS`, which the core's `byId` and quiz runner do not read (core change) |
| Worksheets page: problem sets of kinds practice, in-class, homework, review, by kind (`worksheetsPage`, `WORKSHEET_KINDS`) | 821-828 | adapted | With worksheets-ink on: its documents (`SOURCES`) for the module, by document type, each with Write on it and Practice in the drill; without it, no Worksheets section |
| Module page header: ← All modules, the module name, section tabs (`renderModulePage`) | 829-842 | ported | |
| A second tap on Topics returns to the module list | 5751 | ported | |
| Coming back to Topics (Change topic) shows the module page again | (place_test.py 72-75) | ported | |
| The module page kept across a reload (`pl.modpage`) | 6437, 6460 | omitted | After a reload the student sees the module cards, not the open module page; the core keeps no place for Topics |
| Two-row progress meters with the percent right (`progressHTML`, `seenOf`) | 1938-1950 | adapted | Answered count, mastered meter and concept count |
| Concept statuses on the module page | (not in PK's module page) | added | With concept-statuses on, each objective row says how many of its concepts are in each status |
