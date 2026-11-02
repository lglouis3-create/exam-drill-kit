| Mutation | Behaviour broken | Exit | First check that FAILed | FAILs |
|---|---|---|---|---|
| `plan-order` | sheetPlan: problems in the sheet's numbering | 1 | a sheet's problems follow its numbering whatever order the items are listed in, slides keep the deck's order, and a set's name or ids say… | 1 |
| `plan-changed` | setNumbers: a '(changed numbers)' set is the extra-practice sheet | 1 | a sheet's problems follow its numbering whatever order the items are listed in, slides keep the deck's order, and a set's name or ids say… | 1 |
| `plan-dup` | sheetPlan: an older copy of a problem already on the sheet is left off | 1 | Homework 2's re-numbered copies, named without "(changed numbers)", are still left off the worksheet and kept as the extra-practice sheet… | 1 |
| `solved-by` | solvedBy: only the professor's own solved sheet is the professor's key | 1 | each worksheet's problems, their order, the changed-numbers sheet and who solved each part are Basic-Pharmacokinetics' own (8 documents) … | 1 |
| `solved-spoken` | solvedBy: working only heard is the drill's | 1 | working only heard in the recording is the drill's, unless the sheet has it written ["prof","prof","prof","prof"] | 1 |
| `carry` | dropCarry: carried values left out on paper | 1 | the text on paper is Basic-Pharmacokinetics' own: carried values left out (16 parts), each set's shared text (12 sets), the options' orde… | 1 |
| `shared-lead` | sharedLead: a set's shared text printed once | 1 | the text on paper is Basic-Pharmacokinetics' own: carried values left out (16 parts), each set's shared text (12 sets), the options' orde… | 1 |
| `ws-order` | wsOrder: the options' fixed order | 1 | the text on paper is Basic-Pharmacokinetics' own: carried values left out (16 parts), each set's shared text (12 sets), the options' orde… | 1 |
| `chain-start` | startSheetSet: a whole problem set starts that set (chained-problem-sets on) | 1 | with chained-problem-sets on, a sheet that is one whole problem set starts that set (part 1 of 5, with its vignette line) {"view":"quiz",… | 1 |
| `sheet-sweep` | startSheetSet: the sheet's order | 1 | with chained-problem-sets off, the same sheet is asked as one pass in the sheet's order {"view":"quiz","chain":null,"sweep":["wsi-ws1-3-2… | 3 |
| `room` | More room / Less room | 1 | More room adds 240 px and Less room takes it back (480 → 720 → 1200) | 4 |
| `eraser` | the stroke eraser | 1 | the eraser removes a stroke it touches, and undo brings it back (1, 2) | 11 |
| `redo` | undo and redo | 1 | undo removes the stroke and redo puts it back (0, 0) | 1 |
| `pencil-only` | Pencil only: a finger scrolls | 1 | a pen writes and switches to Pencil only; then a finger scrolls the page and does not write [1,2,true,3,200,200] | 15 |
| `snap-box` | Hold to snap: a box | 1 | a box held still becomes a box with square corners (shape, null, 220,560,220,563,219,567,217,570,215,574,212,577,208,580,204,583,199,586,… | 2 |
| `two-finger` | two fingers tapped together undo | 1 | two fingers tapped together undo the last stroke (11,11,11,) | 2 |
| `exam-clear` | a new paper's scratch paper starts clean | 1 | a new paper starts with clean scratch paper and the old one is cleared (1, [0,1]) | 2 |
| `continue` | Continue writing on the card | 1 | Done closes it and the card says "✍️ Write on it" | 2 |
| `print` | Save as PDF prints the ink | 1 | Save as PDF prints the worksheet alone, ink as pictures in place of the canvases [1,false,false,false,false,false] | 2 |
| `no-write` | the writing is written when the pen lifts (not 150 ms later) | 1 | a reload at once after a stroke keeps the stroke: the module writes the progress when the pen lifts (["Fresh",2]) | 13 |
| `no-rollback` | storage full: the change is refused and the last good progress kept | 1 | with storage denied the page says the writing is not being saved, on screen ({"shown":true,"text":"This browser is not saving: the writin… | 12 |
| `warn-hidden` | the not-saved notice is shown | 1 | with storage denied the page says the writing is not being saved, on screen ({"shown":false,"text":"This browser is not saving: the writi… | 4 |
| `warn-fixed` | the notice on screen at 390 px | 1 | with storage denied the page says the writing is not being saved, on screen ({"shown":false,"text":"This browser is not saving: the writi… | 2 |
| `progress-shape` | an imported page in another shape is left out | 1 | Import leaves out writing that is not in the module's shape and keeps the rest (["x/main","y/main","z/main","wsi-dp-m1-2/main"]) | 1 |
| `erase-all` | Erase all writing | 1 | Erase all writing removes the writing and keeps the answers ([3,1,true]) | 1 |
| `step-dup` | build step: a question on two documents | 1 | a question on two documents stops the build and says so  — wrote manifest.json and the icons wrote sw.js  (caches named course-id-drill-v… | 1 |
| `step-lookbehind` | build step: an option with a lookbehind | 1 | an option holding a lookbehind stops the build and says so  — wrote manifest.json and the icons wrote sw.js  (caches named course-id-dril… | 1 |

27 of 27 mutations caught.
