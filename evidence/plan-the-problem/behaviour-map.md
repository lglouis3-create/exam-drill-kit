## Behaviour map (agent-run review, from Basic-Pharmacokinetics `src/views.js` at `ac2eb73`)

Ported: same behaviour. Adapted: changed, with the reason. Omitted: what the student does not get.

| # | Behaviour in Basic-Pharmacokinetics | Source lines | Status | In the kit |
|---|---|---|---|---|
| 1 | The drill's stems: every numeric question whose `setup.eq` is a line of EQUATIONS (not `'none'`) | 4777-4778 | adapted | the bank's QUESTIONS only: Basic-Pharmacokinetics also draws from its EXTRAS (extra practice kept out of the bank); the kit has no EXTRAS |
| 2 | Each pick tallied per line: seen, right, wrong | 4770-4776 | adapted | kept in the saved progress as `DB.setup`, not in a key of its own, so Export, Import, Erase and the profile carry it; a saved tally of another shape starts afresh (added in this review) |
| 3 | Scopes: one module, or every module | 4779-4788 | ported | module names from the module option `groups`, else "Module <n>" |
| 4 | Scopes: a live quiz, the active exam | 4782-4783, 5106-5107 | omitted | the student cannot drill the set-up for one named quiz or for the exam |
| 5 | Start: the scope's stems shuffled, "No set-up questions for that scope yet." when there are none, plan mode from `plan:` | 4789-4795 | ported | also stops equation-drill's writing drill when it is running |
| 6 | The dosing models, the topic-to-model map, and a Module 1/4 stem (or PK-PD stem) that names a route also accepting that route | 4802-4815 | adapted | course data `PLAN.models`, `PLAN.topics`, `PLAN.also`; the same models accepted as Basic-Pharmacokinetics' own `planModels` on every stem and on each stem with the route words added (checked) |
| 7 | The givens the line uses: every given whose role does not start "not needed" | 4816 | ported | |
| 8 | "What is asked?": six symbols, the right one, the same module's other asked symbols first | 4820-4826 | ported | |
| 9 | "Which unit?": up to six units, the same module's first, then the course's unit list, none twice | 4827-4832 | adapted | the unit list is `PLAN.units`; after it, the units of every stem, so a course without `PLAN.units` still gets lures |
| 10 | The ask and unit steps only when the stem's `asks` is in ASKS | 4833 | adapted | also needs ASKS in the course and `units` on the stem |
| 11 | The ask, unit, model, sheet and givens steps: buttons, the verdicts, the meaning of the asked symbol, the first sentence of the reason under the model verdict | 4834-4887 | ported | "her sheet" is "the equation sheet", "she said" is "the professor said" |
| 12 | Three other lines: the same module first, then the modules next door, then any; never a line used on the way or a line counted as the same relation | 4888-4906 | adapted | Basic-Pharmacokinetics' nine groups and its sheet's `alsoEq` pairs are course data `PLAN.same` |
| 13 | The state of each stem made once and kept | 4907-4911 | ported | |
| 14 | Choose the line from the whole sheet, block by block | 4912-4930, 5114-5117 | omitted | the student always chooses from four lines (the whole-sheet choice needs the sheet map, `sheet.js`) |
| 15 | The reason one sentence a bullet, "0.693" and a quoted ".." never splitting | 4934-4937 | adapted | written without regex lookbehind; the same sentences on 9 control texts and every reason (checked) |
| 16 | The card head: the module tag, the origin tag, "set-up only" or "plan the problem" | 4940 | adapted | the origin tag is left out (Tier 3 item) |
| 17 | The verdict, "You picked ..., It holds when:", the right line with its sheet mark and "she said to know it" on every line marked `must` | 4961-4967 | ported | "It holds when" only when the picked line has `holds`. Fixed in this review: a line not printed and marked `must` now also says the professor said to know it |
| 18 | The plan written out: asked and unit, the model's block, the line and the lines before it, the givens that enter and those set aside, the estimate | 4968-4978 | ported | fixed in this review: an "Any route" model reads "the block to read from", other models "the block of the sheet" |
| 19 | "Why this line", "Lines used on the way" | 4979-4980 | ported | |
| 20 | "When it holds", and "Not on the sheet: how to get there" for the unprinted lines, with a line saying which one gives the answer | 4981-4982, 4743-4751 | adapted | "When it holds" and the way to reach an unprinted line are in each line's "Symbols, when it holds" box (equation-drill's `eqSheetHTML`), closed until opened. Omitted: the sentence "This problem's answer comes from this line." / "This problem uses it on the way to the answer." |
| 21 | "Show the problem worked out": the keyed answer and the steps in place | 4983 | ported | |
| 22 | "Work it yourself in the quiz", "Type this line from memory" | 4986-4987, 5079-5080 | omitted | the student cannot go from a stem to the quiz or to the typing drill from here |
| 23 | The closing card: the count and percent, the plans right in every step, the lines missed most often, Again and Back | 4994-4998 | ported | the plans line reads "N of M plans right in every step" |
| 24 | Ten stems to a page (the Answer setting) | 5001-5012 | omitted | one stem at a time (the kit has no Answer layout setting) |
| 25 | One stem at a time, the progress bar and the running count, Stop | 5013-5018, 5027-5031 | ported | |
| 26 | The link back to the view the drill was started from | 4793, 5005, 5013 | omitted | Stop returns to the Equations tab |
| 27 | The lines missed most often, up to six | 5021-5026 | ported | heading "The lines you missed most often" |
| 28 | A pick, and the wiring of every step | 5032-5078 | ported | |
| 29 | "How to go about any calculation", six steps | 5083-5095 | adapted | course data `PLAN.routine` |
| 30 | The card on the Equations tab: the stems count, a Drill row and a Plan row | 5097-5113 | ported | "Her calculation stems" is "The course's calculation stems"; "1 stem" in the singular |
| 31 | Weak spots: the lines mixed up, and a "Plan drill" chip per weak calculation kind | 2193-2205 | omitted | Weak spots does not list the set-up drill's lines or offer the drill |

Build checks, from Basic-Pharmacokinetics `src/test.js` 997-1068 (the kit's build step, `step.js`):

| Check | Source lines | Status |
|---|---|---|
| a set-up line and each line used on the way exist (the message names the question and the equation) | 1005-1006, 1016 | ported |
| the reason is there, at most 60 words, no HTML tag | 1007-1010 | ported |
| four distinct lines with the right one | 1065-1068 | ported (in the test) |
| a given is [symbol, value, role] | 1038 | ported |
| every numeric question has `setup`, `asks`, `givens` and `check` | 1014, 1024-1025, 1034, 1045 | adapted: optional in the kit (a stem without them stays out of the drill or the plan steps) |
| banned phrasing; a set-up line from a later module; a given's value not in the stem; a role over 16 words; more than 10 givens; the estimate's numbers | 1000, 1009, 1012, 1036-1052 | omitted (course writing rules, not the drill's) |
