<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

Port queue item 1 of Tier 2 (`review/port-queue.md`). This needs your yes before it merges. It stays a draft, "Port (incomplete): plan-the-problem", until the coordinator marks it ready.

At the final tested commit `4c09914`, these passed (agent-run): the module test, three times, and `run_checks.sh` on the module's own course of real Pharmacokinetics data (28 PASS, 0 FAIL, NOT RUN only `cite_check.py`); the no-module template course; and Medicinal-chemistry from a full clone, `home_test.js` included (36 checks). Safari (WebKit) is NOT RUN.

## What the feature does

It adds a set-up drill to the Equations tab, ported from the Pharmacokinetics drill (`src/views.js` lines 4754-5120 at `ac2eb73`).

- **Set-up only: which equation?** The student sees one of the course's calculation questions and does no arithmetic. They pick, from four equation lines, the one that solves what is asked. The page then marks the pick and shows the right line. It explains why, one sentence per line, and lists the lines used before it. For a line the sheet does not print, it shows how to reach it from one that it does print. "Show the problem worked out" opens the keyed answer and its steps.
- **Plan the problem.** Before the line, the student says what is asked (the symbol, from six), the unit the answer carries, and the dosing model from the stem's words. After the line, they say whether the equation sheet prints it and tick the givens the line uses. The page then writes the plan out in five lines, the last of which is the estimate to make before computing.
- Each line picked wrong is counted. The end of a round lists the lines missed most often. The count is kept in the saved progress (`DB.setup`), so Export, Import and Erase cover it, and each profile keeps its own.

## What changes

- New folder `features/plan-the-problem/current/` holding the module code, its styles, a build step, `module.json` and its test. The module needs `formulas-in-text` and `equation-drill`; `module.json` `needs` names both, and the build stops and names them when they are off.
- New file `features/plan-the-problem/ci/oncourse.js`: it switches the module on in a scratch course for the kit's GitHub checks and writes the module's own course (below). Courses never copy it.
- The course supplies the data. Each numeric question carries `setup: {eq, pre, why}`, and for the plan also `asks`, `givens` and `check`. Two optional data files: `ASKS` (what each asked symbol means) and `PLAN` (the dosing models, which topic belongs to which model, the stem words that also accept a route, unit choices, lines counted as one relation, and the steps for any calculation).
  - In Pharmacokinetics these tables are written into the code. In the kit they are course data, so another course can supply its own.
  - The build stops with the reason when the set-up data names an equation that does not exist (the message names the question and the equation), a given is not [symbol, value, role], an `asks` key is missing from `ASKS`, or no question has a set-up line. An `ASKS` with no keys counts as no `ASKS`.
- The sentence split of the set-up reason no longer uses regex lookbehind, which older Safari cannot run (`review/findings.md` §6.5).
- Catalog bookkeeping:
  - `FEATURES.md`: this entry rewritten, and the equation-drill entry now says the set-up drill is this module.
  - `features/README.md`: one row added.
  - `review/port-queue.md`: item 1 set to `partial` (the parts listed under "Not ported" are left).
  - `CHANGELOG.md`: one entry.
- Not ported:
  - choosing the line from the whole sheet (this needs the sheet map, `sheet.js`);
  - ten questions to a page (the kit has no Answer layout setting);
  - the quiz and exam scopes;
  - the buttons "Work it yourself in the quiz" and "Type this line from memory";
  - the origin tag;
  - the button back to the view the drill was started from;
  - the set-up lines and the "Plan drill" chips in Weak spots;
  - the sentence under an unprinted line saying whether the answer comes from it or it is used on the way.

## What does not change

- No course site changes. No course switches this module on, and no course repository was touched.
- `core/` and `template/` are unchanged (`git diff origin/main -- core template` is empty at `4c09914`; core tree `a2dbf03`, template tree `cbac5bd`).
- A course without the module builds the same page as before.

## Review evidence

Evidence branch: **`evidence/plan-the-problem`** (`81c0d7f`), folder `evidence/plan-the-problem/` (INDEX.md, every command with its exit code and log, the behaviour map, the mutation script and table, the persistence results, screenshots). Final tested commit: **`4c09914`** (`4c09914263e30756ea24f4550097fc1517a92f1d`). Start of this review: `1226635`. Commits added: `bee69ed` (merge of main `366caf6`, kit PR #27), `bbf82a8` (the hardening), `4c09914` (merge of main `6432c36`, kit PR #28). Every result below is agent-run.

### The module's own course (real Pharmacokinetics data)

`ci/oncourse.js` writes it from the module test's fixture, which is Basic-Pharmacokinetics `ac2eb73` data: 10 calculation questions with their `setup`, `asks`, `givens`, `check` and worked steps; the 9 equations they name (from equation-drill's fixture, identical to the course's); their 6 topics, 6 skills and 6 lectures (the course's own entries); `ASKS` (55 keys); and `PLAN` (12 models, the topic map, the route words, 12 units, the 6-step routine). A script checked the fixture value by value against the course's files.

Changes to the data: `prof` is "Professor". So that the fixture carries no personal name, the professor's name (title and surname) is also written "the professor" in three worked-step texts (questions m1-ord-n03, m2-n-cl2 and m4-n-clt). This second change goes beyond changing `prof` alone; the coordinator decides whether it stands. Scaffolding: ids are prefixed `plc-`, and lecture ids run from L91. Two questions cite a practice-solutions file, so each gets a lecture entry for that file, with its own lecture's label, exam and module.

Findings in the real data, kept as written: the routine's step 6 says "the decimal places she asked for", and several worked steps say "she" and "her".

### Faults found and fixed in this review

1. The plan said "the block of the sheet" for every model. Pharmacokinetics says "the block" for an "Any route" model (`views.js` 4974). Fixed.
2. A line that is not printed and is marked to know lost "said to know it" (`views.js` 4967). It now reads "not printed; the professor said so, and said to know it". Fixed.
3. With an `ASKS` that has no keys, the card promised "what is asked and its unit" and the build refused every `asks`. An `ASKS` with no keys is now treated as no `ASKS` by both. Fixed.
4. A saved tally of another shape lost each new pick when the progress was saved. Fixed: such a tally starts afresh.
5. Test data: the fixture carried the professor's name, and its topics had no `cite` or `prof`. Fixed (see above).

Kept on purpose: the build refuses a course whose set-up lines name an equation the course does not have (the coordinator's integration check, `evidence/integration` `1329222`, finding F5). The message names the question and the equation.

Nothing needs a core change. Seen in the core: the progress is written 150 ms after the last change, so a reload within that time loses the last pick.

### Behaviour map

| # | Behaviour in Basic-Pharmacokinetics | Source lines | Status | In the kit |
|---|---|---|---|---|
| 1 | The drill's stems: numeric questions whose `setup.eq` is a line of EQUATIONS | 4777-4778 | adapted | the bank only; Pharmacokinetics also draws from its EXTRAS, which the kit does not have |
| 2 | Each pick tallied per line | 4770-4776 | adapted | kept in the progress (`DB.setup`), so Export, Import, Erase and profiles carry it |
| 3 | Scopes: one module, every module | 4779-4788 | ported | |
| 4 | Scopes: a live quiz, the active exam | 4782-4783, 5106-5107 | omitted | the student cannot drill the set-up for one named quiz or the exam |
| 5 | Start: shuffled, a message when the scope is empty, plan mode | 4789-4795 | ported | also stops equation-drill's writing drill |
| 6 | Dosing models, topic map, a route named in the stem also accepted | 4802-4815 | adapted | course data `PLAN`; same models as Pharmacokinetics' own code (checked) |
| 7 | The givens the line uses | 4816 | ported | |
| 8 | "What is asked?": six symbols, the module's first | 4820-4826 | ported | |
| 9 | "Which unit?": up to six, none twice | 4827-4832 | adapted | the unit list is `PLAN.units`, then the units of every stem |
| 10 | Ask and unit steps only with a known `asks` | 4833 | adapted | also needs ASKS with keys and `units` on the stem |
| 11 | The ask, unit, model, sheet and givens steps and their verdicts | 4834-4887 | ported | "her sheet" and "she said" are "the equation sheet" and "the professor said" |
| 12 | Three other lines: the same module first; never a line used on the way or the same relation | 4888-4906 | adapted | the same-relation groups are `PLAN.same` |
| 13 | Each stem's state made once and kept | 4907-4911 | ported | |
| 14 | Choose the line from the whole sheet | 4912-4930, 5114-5117 | omitted | always four lines |
| 15 | The reason one sentence a bullet | 4934-4937 | adapted | no lookbehind; the same sentences (checked) |
| 16 | Card head with module tag, origin tag, mode | 4940 | adapted | no origin tag |
| 17 | Verdict, "You picked", the right line with its sheet mark and "said to know it" | 4961-4967 | ported | fixed in this review (fault 2) |
| 18 | The plan written out in five lines | 4968-4978 | ported | fixed in this review (fault 1) |
| 19 | "Why this line", "Lines used on the way" | 4979-4980 | ported | |
| 20 | "When it holds" and how to reach an unprinted line | 4981-4982, 4743-4751 | adapted | inside each line's "Symbols, when it holds" box, closed until opened; the sentence saying which line gives the answer is omitted |
| 21 | Show the problem worked out | 4983 | ported | |
| 22 | "Work it yourself in the quiz", "Type this line from memory" | 4986-4987, 5079-5080 | omitted | no way from a stem to the quiz or the typing drill |
| 23 | Closing card | 4994-4998 | ported | the plans line is shorter |
| 24 | Ten stems to a page | 5001-5012 | omitted | one stem at a time |
| 25 | One at a time, progress bar, running count, Stop | 5013-5018, 5027-5031 | ported | |
| 26 | Back to the view the drill started from | 4793, 5005, 5013 | omitted | Stop returns to Equations |
| 27 | The lines missed most often | 5021-5026 | ported | |
| 28 | A pick and the wiring of every step | 5032-5078 | ported | |
| 29 | "How to go about any calculation" | 5083-5095 | adapted | course data `PLAN.routine` |
| 30 | The card on the Equations tab | 5097-5113 | ported | "The course's calculation stems" for "Her calculation stems" |
| 31 | Weak spots: the lines mixed up, "Plan drill" chips | 2193-2205 | omitted | Weak spots does not offer the set-up drill |

Build checks, from Pharmacokinetics `src/test.js` 997-1068:
- Ported: the set-up line and the lines used on the way exist; the reason is at most 60 words and has no HTML; four distinct lines are offered; each given is [symbol, value, role].
- Adapted: `setup`, `asks`, `givens` and `check` are optional.
- Omitted: these are course writing rules: banned phrasing, a line from a later module, a given's value that the stem does not state, the length limits on roles and givens, and the numbers in the estimate.

### Mutation table (agent-run; scratch copies of the module's own course, never committed)

| Mutation | Behaviour broken | Check that FAILed | Exit |
|---|---|---|---|
| M1 | the right line is among the four | every set-up stem is offered four distinct lines, the right one among them | 1 |
| M2 | no wrong choice is a line used on the way or the same relation | no wrong choice is a line used on the way or the same relation | 1 |
| M3 | wrong choices from the stem's own module first | the wrong choices come from the stem's own module first | 1 |
| M4 | a quoted ".." does not split a sentence | the sentence split gives Pharmacokinetics' sentences | 1 |
| M5 | the tally is saved | the tally is kept through a reload; 160 picks kept whole | 1 |
| M6 | a wrong pick is counted wrong | the missed line is tallied per equation | 1 |
| M7 | a route named in the stem is also accepted | the models a stem accepts are Pharmacokinetics' own (100 stems and variants) | 1 |
| M8 | a plan counts only with every step right | a plan with a wrong model is not counted | 1 |
| M9 | the sheet answer is judged | the sheet answer is judged; a plan right in every step is counted | 1 |
| M10 | a "not needed" given is set aside | the three "not needed" givens are set aside (added in review) | 1 |
| M11 | "the block" for an "Any route" model | the plan says the block | 1 |
| M12 | "said to know it" | says the professor said it is not on the sheet, and said to know it | 1 |
| M13 | the module's other asked symbols first | "What is asked?" offers ... its module's first | 1 |
| M14 | no unit twice | the same check (units distinct) | 1 |
| M15 | a tally of another shape starts afresh | a saved tally of another shape starts afresh | 1 |
| M16 | the refusal names the question and the equation | a set-up line that is not in EQUATIONS, named with its question | 1 |
| M17 | an unknown line used on the way is refused | a line used on the way that is not in EQUATIONS, named with its question | 1 |
| M18 | `needs` names both modules | with formulas-in-text and equation-drill off, the build names both | 1 |
| M19 | the card on the Equations tab | the Equations tab offers the set-up drill | 1 |
| M20 | the drill redrawn on return to the tab | opening the tab again shows the drill | 1 |
| M21 | a malformed given is refused | a given that is not [symbol, value, role] stops the build | 1 |
| M22 | no "What is asked?" without ASKS | the PLAN-without-ASKS check (the page's TypeError stops the test; added in review) | 1 |
| M23 | an ASKS with no keys is no ASKS | with PLAN and no ASKS, the plan starts at the model | 1 |

The first pass did not catch M10 and M22, so checks were added for them. In the final run, all 23 mutations were caught.

### Persistence results (agent-run, automated in the module test)

| Case | Result |
|---|---|
| 160 picks over 16 lines, then a reload | kept whole |
| A reload under 150 ms after a pick | the pick is lost (the core saves 150 ms after the last change; core behaviour, reported, not changed) |
| A reload 300 ms after a pick | kept |
| Export, then Import into a fresh profile | the export carries the tally (161 picks); after Import the fresh profile has the same tally |
| Profile switch | each profile keeps its own tally |
| Storage denied | the core's notice shows; the saved tally is not overwritten; the picks are kept for the visit; once storage works, the next save writes them |
| Storage full (`QuotaExceededError`) | the notice shows; nothing saved is overwritten; the tally saved before loads after storage works; the 20 picks made while it was full are lost on that reload, as the notice says |
| A saved tally of another shape | starts afresh; the next pick is saved |

### Check results (agent-run, on `4c09914`)

| Check | Result |
|---|---|
| Module test on its own course (`core/ci_course.sh module:plan-the-problem`), then three more runs | 54 PASS each time (4 runs) |
| `run_checks.sh` on the module's own course | 28 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`); `style_check.js`: 17 stems clean; `state_check.js` PASS; formulas-in-text 12 PASS, equation-drill 30 PASS |
| Module test with the module switched off | FAIL, 1 of 1 checks (the test does not pass without the module) |
| `ci/oncourse.js` on a fresh `mkcourse.sh` course after its needs' own scripts | exit 0; a second run exit 1; build exit 0; module test 54 PASS |
| The same with the needs switched on with no data | exit 0; second run exit 1; build exit 0; module test 54 PASS |
| `ci/oncourse.js` with the needs off | exit 1, naming both modules |
| No-module template course (`core/ci_course.sh template`) | 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT |
| Medicinal-chemistry, full clone `f1f5ee5`, this core | 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures; `cite_check.py`: no lecture PDFs), 1 REPORT; `home_test.js` 36 PASS; `state_check.js` PASS |
| Mutations | 23 of 23 caught |
| Fixture against the course's files | only `prof` (10) and the three renamed step texts differ |
| WebKit (Safari); the GitHub "Kit checks" jobs on `4c09914` | NOT RUN in this review |

Corrected from the first version of this description: the module needs `formulas-in-text` as well as `equation-drill`; queue item 1 is `partial`, not `done`; the test now has 54 checks, not 34, and runs on a course built from Pharmacokinetics data; and the Medicinal-chemistry run used a full clone at `f1f5ee5`, not a shallow one at `d7331be`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
