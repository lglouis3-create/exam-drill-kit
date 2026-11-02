## Behaviour map (agent-run reading of the source)

Source: Intro-Pharmacology- `exam1-drill/src/app.js` at `929cd62` (read-only copy `/tmp/ip-readonly`). Line numbers are at that commit.
Port: `features/study-controls/current/study-controls.js` on `port/study-controls`.

| # | Behaviour in the source | Source lines | Port | What the student gets, or does not get |
|---|---|---|---|---|
| 1 | A flag per question, kept with the time it was set (`S.flags = {id: time}`), saved with the progress | 146-147 | ported | `DB.flags` in the profile's progress, so it follows Export, Import, the profile and Erase |
| 2 | The Flag button: "⚑ Flag" / "⚑ Flagged", `aria-pressed` | 148 | ported | the same button on every quiz card, the exam question and each card of the exam result |
| 3 | Drill flagged and the flagged count use the flagged questions of the current exam's pool (`examPool()`) | 149, 723, 777 | adapted | every flagged question in the bank. The kit's Topics row is for the whole bank, and with paper-picker a student practises an earlier exam's paper, whose flags would otherwise drop out of Drill flagged |
| 4 | The layout chips One at a time / All on one page | 151 | ported | the same chips, on Topics, the quiz and the exam |
| 5 | A mouse click on Flag takes the focus off the button, so Enter continues the quiz instead of flagging again | 581 | ported | same |
| 6 | Only the Flag buttons of that question change; nothing else is redrawn | 582-583 | ported | same |
| 7 | The exam's question grid marks flagged numbers; the flag is also saved in the paper (`EX.flag`) | 585 | adapted | the kit's paper has no grid: the flagged numbers are listed as links on the question bar. The flag is kept in `DB.flags` only (not in the saved paper); the bar is the same after a reload |
| 8 | Topics and the question map are drawn again after a flag | 586 | ported (Topics) / omitted (map) | the Topics row updates; the kit has no question map |
| 9 | On the exam start page the layout chips only restyle themselves | 589-595 | ported | same |
| 10 | Topics row: count, Drill flagged (a pass over the flagged questions), Clear flags after "Remove every flag?" | 722-723, 777-778 | ported | same words and the same question first |
| 11 | All on one page in the quiz: every question of the drill, 40 at a time, Show the next 40, Finish | 994-1016 | ported | multiple-choice and select-all questions only |
| 12 | The one-page quiz draws matching and fill-in items too | 995, 1040-1043 | omitted | calculation and matching questions stay one at a time; the page says how many there are |
| 13 | Each one-page card is graded and recorded when answered; the count line is refreshed | 1023-1045 | ported | same, through the core's `record` |
| 14 | Not sure / I guessed on every right answer of the one-page quiz | 1021, 1057-1064 | adapted | offered on the card answered last only: the core changes the confidence of the last recorded answer only (a core change would be needed for the others) |
| 15 | The count line says how many were answered one at a time | 1031-1034 | adapted | questions answered one at a time leave the page's list instead; back to one at a time, questions answered on the page are not asked again in a fixed pass |
| 16 | The strict box on the exam start page, its last state kept (`:noback`) and stored when Start is pressed | 1616, 1632 | ported, then fixed | the box only when the course sets `strict: true`, with the course's own `strictNote`. Fixed on 2026-11-02: the box is also kept as it is ticked, so a redraw of the start page (paper-picker's chips) no longer unticks it |
| 17 | The paper keeps `noBack` in its saved state | 1494-1495, 1505, 1633 | adapted | the core's saved paper has no field for it, so the module keeps a key of its own per profile (`<ns>:strictpaper:<profile>`) tied to that paper's end time; the paper stays strict through a reload and the browser's Back and Forward buttons (a profile switch during a strict paper was not tested) |
| 18 | The exam on one page: every question, a sticky bar with the count, the clock and Submit | 1663-1686 | ported | same, with a Flag on every card and the flagged numbers on the bar |
| 19 | The strict paper: no layout chips, no grid, no Previous, no Flag, the "No going back" line | 1692, 1697-1705 | ported | same |
| 20 | A tap on an exam option within 350 ms of the question being drawn is ignored | 1710 | omitted | the kit's paper and its option buttons are drawn by the core, which has no such guard; what a double tap does there was not tested. A core matter |
| 21 | Moving on from a blank strict question asks "Move on without answering? You cannot come back to this question." | 1718 | ported | same words; on the last question the kit asks "Submit the paper without answering this question?" because the kit's Next there submits |
| 22 | No shortcut acts while the diagram panel or the break video is open | 3937 | adapted, fixed | the kit has neither, but has dialogs: no shortcut while a `<dialog>` or a panel marked as a dialog is open (worksheets-ink's Scratch paper is one), or while a pointer is held down on a canvas. Missing from the first version of the port; added on 2026-11-02 |
| 23 | Typing in an input, select, textarea or contenteditable is never a shortcut; Enter or Space on a focused button, link or summary keeps its own meaning; Ctrl, Alt or Cmd: no shortcut | 3939-3942 | ported | same |
| 24 | Quiz: A-J or 1-9 pick; Enter checks (select-all, matching, fill-in) or continues; after a right answer 1 Knew it, 2 Not sure, 3 I guessed; no keys on the one-page quiz | 3944-3955 | ported | same; Enter presses the core's Check answer, which also covers the kit's calculation and matching cards |
| 25 | Paper: A-J or 1-9 pick; the right arrow or Enter moves on (asking first on a strict blank question); the left arrow goes back except on a strict paper; no keys on the one-page paper | 3956-3962 | ported | same |
| 26 | The browser's Back gesture moves within the drill (history entries) | 240-249 | omitted | the kit's core keeps no history entries: Back leaves the drill, and opening it again (or Forward) brings the paper back where it was, still strict |
| 27 | The question map's Flagged filter and its Drill flagged per topic | 3862-3898 | omitted | the kit has no question map (catalog feature `question-map`) |
| 28 | Erase keeps the layout choice and empties the flags | 3933 | adapted | the core's Erase replaces the whole progress, so the flags go and the layout returns to One at a time |
| 29 | A failed save shows a notice | 152 | core's own | the core's `store`/`saveWarn` shows "This browser did not save your progress ..." |
| 30 | (kit only) A paper with calculation or matching items on it (`exams[].typed`) | — | added, fixed | stays one question at a time with All on one page chosen, and says why; the one-page paper would show those items with no answer box. Intro to Pharmacology's papers have no such items |
