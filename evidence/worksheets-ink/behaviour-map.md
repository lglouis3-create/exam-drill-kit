## Behaviour map (agent-run reading of the source, Basic-Pharmacokinetics `ac2eb73`)

Source: `src/views.js` (PK) against `features/worksheets-ink/current/` (kit). "Line" is the PK line.

| # | Behaviour in the source | PK file:line | Kit | Mark |
|---|---|---|---|---|
| 1 | Documents listed under their module, by type (worked examples, in-class, daily practice, slides), with a tally per module | views.js:5390-5431 | `renderSheets` | ported |
| 2 | Homework, quizzes and reviews listed after the last module they cover, homework then quizzes then reviews, by number; each problem tagged by module | views.js:5160-5162, 5404-5408 | `srcHome`, `renderSheets` | ported |
| 3 | Module order and names from `COURSE.topicsMenu` | views.js:5141-5143 | option `modules`, else the order the documents first name them | adapted: the kit core has no `topicsMenu` |
| 4 | Jump chips to each module; open groups kept for the visit | views.js:5410-5430 | `renderSheets`, `SRC_OPEN` | ported |
| 5 | Card: Open original / Download original (Drive), or the document's `missing` text; student-work note; problem numbers | views.js:5368-5387 | `srcCardHTML` | ported |
| 6 | Card: "Worksheet (PDF)" and "Worksheet with solutions (PDF)" links to files built by `gen/sheets.py` | views.js:5163-5165, 5202-5207, 5379-5384 | none | omitted: the student gets no ready PDF file; Save as PDF on the open worksheet prints one |
| 7 | ★ after a problem number likely on the exam | views.js:5371, 5385 | none | omitted: no ★ marks (Tier 3, `likely.js`) |
| 8 | Problem sets "(changed numbers)" / "(original numbers)" or by id pattern | views.js:5167-5173 | `setNumbers`, options `originalIds`, `changedIds` | adapted: PK's id patterns are options |
| 9 | Worksheet plan: one group per set in the professor's order, an older copy of a set already in the professor's numbers left off and kept as extra practice, unset items after, sorted by the sheet's numbering (examples keep the deck's order) | views.js:5176-5199 | `sheetPlan` | ported (the test compares 4 documents with PK's own plan) |
| 10 | Changed-numbers second worksheet; "numbers changed" line when only changed numbers exist | views.js:5196-5197, 5313 | `sheetPlan`, `sheetHTML` | ported |
| 11 | Carried values "(Part a: ...)" left out on paper | views.js:5220-5221 | `dropCarry` | ported |
| 12 | A set's shared text printed once above its parts | views.js:5225-5237 | `sharedLead` | ported |
| 13 | Part letter at the start of a part's text dropped | views.js:5240-5243 | `dropMarker` | ported |
| 14 | Options in a fixed order from the question id | views.js:5246-5252 | `wsOrder` | ported |
| 15 | A calculation gets the tall work area: numeric, matching whose pairs are quantities in a calc skill, or any item with steps | views.js:5253, 213-219 | `isCalcPart`: numeric, or non-matching with steps | adapted: a matching item of quantities gets the 200 px short area (the kit core has no `kindOf`/calc skill kind); More room adds space |
| 16 | Who solved it: the professor's key only on the professor's own solved sheet unless the audit or note says the drill worked it, or the working was only heard | views.js:5255-5265 | `solvedBy`, options `drillWorked`, `spokenOnly`, `writtenWorking` | adapted: phrases are options; label "The professor's key" for "Her key" |
| 17 | Solutions: answer, worked steps or pairs, why, note | views.js:5281-5298 | `sheetSolHTML` | ported |
| 18 | "From: <document>, <number> · Worksheet · Original" under an answer | views.js:5342-5349 | none | omitted: the student is not told under an answer which document and number it comes from |
| 19 | Practice in the drill: one whole set starts that set | views.js:5354-5358 | `startSheetSet` with chained-problem-sets on (`startChain`) | ported (tested with chained-problem-sets on and off) |
| 20 | Practice in the drill: several sets run as one pass, each part with its own set's vignette line (`setupOf`) | views.js:5359-5364 | `startSheetSet`: one pass in the sheet's order | adapted/omitted: on a sheet of several sets the part's vignette line is not shown above each part |
| 21 | Write on it: the worksheet over the page, name line and every problem a drawing layer, strokes stored per problem as fractions of its width | views.js:6040-6116 | `inkOpen`, `inkWire` | ported |
| 22 | Work areas 480 / 200 / 720 px; More room +240, Less room | views.js:6117, 6309-6316 | `inkBase`, `onClick` | ported |
| 23 | Pen, highlighter (under the writing), eraser (whole stroke, along snapped segments), 3 colours, 3 sizes, a colour returns to the pen | views.js:6125-6148, 6234-6247, 6291-6300 | same functions | ported |
| 24 | Undo, redo, Ctrl/Cmd+Z, Clear page with its undo | views.js:6249-6257, 6303-6307, 6319-6322 | `inkUndo`, `onKey` | ported |
| 25 | Pencil only: a pen touch switches it on; a finger then scrolls | views.js:6189-6194 | `inkWire` | ported |
| 26 | Hold to snap: line (end follows the pen), ellipse, box; highlighter only straightens | views.js:6150-6180 | `inkRecognize`, `inkSnap` | ported |
| 27 | Two fingers tapped together undo; a moving, cancelled or resting-hand touch does not | views.js:6186-6230 | `inkWire` | ported |
| 28 | No selection or long-press menu on the page | views.js:6087-6094 | `inkOpen`, CSS | ported |
| 29 | Show solutions; Save as PDF with the canvases printed as pictures | views.js:6282-6289, 6302 | `inkPrint` | ported |
| 30 | Pen colour, size, Pencil only and Hold to snap kept per device (`<ns>:ink-prefs`) | views.js:6258 | `inkPrefs` | ported |
| 31 | Writing kept in localStorage per page (`<ns>:ink:<id>:<variant>`), written at once at every stroke; "not saving" notice when that write fails | views.js:6046-6056 | `DB.ink` in the profile's progress, written at once when the pen lifts (`inkWrite`); notice on screen | adapted: in the progress so Export, Import, Erase and profiles cover it. Because the progress is written whole, a page that does not fit is refused and the last saved progress kept (fix of 2026-11-02 evening) |
| 32 | Continue writing on the card where writing is kept | views.js:6058-6061 | `inkMark` | ported |
| 33 | Scratch paper beside a calculation's answer box in practice and on a paper; stem over 720 px; no solutions; paper clock; an earlier paper's scratch cleared | views.js:970-981, 6063-6075, 6107-6108 | `X.rendered`, `scratchButton`, `inkOpen` | ported (clock adapted: an untimed paper shows the time taken) |
| 34 | (kit addition) Settings: pages, strokes and KB of writing kept; Erase all writing keeps the answers | none | `X.settings` | added |
| 35 | (kit addition) Import leaves out writing in another shape | none | `X.progress` | added |
| 36 | "Missed on this sheet" marks of the weak-spot view | views.js:5552 | none | omitted: the student does not see which problems of a sheet were missed |
| 37 | Writing stored by PK under its own keys | views.js:6046 | not read | omitted: writing made in the Pharmacokinetics drill does not appear (PK is not moving) |
