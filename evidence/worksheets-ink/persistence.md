## Persistence results (agent-run, Chromium, `features/worksheets-ink/test.js` at 8265f5c, log `logs/72-final-module-test-run1.log`)

| Case | What was done | Result |
|---|---|---|
| Much writing | 1 stroke drawn with the mouse, then 60 pages of 30 strokes of 60 points added to the progress: 61 pages, 1801 strokes, 1355993 characters of writing in a saved progress of 1356138 characters | saved whole; after a reload all 61 pages and the same 1355993 characters are back, and the page shows its writing: PASS |
| Export | Export progress of that progress (a file of 3407786 characters) | the file holds all the writing, byte for byte: PASS |
| Import into a fresh profile | profile "Fresh" (no writing), Import of that file | the same writing comes back and is saved under "Fresh": PASS |
| Import of writing in another shape | pages `{parts: [1, 2]}`, `null`, `{room: {}}` beside one good page | only the good page is kept: PASS |
| Profile switch | a stroke added in "Fresh", then a switch to the first profile and back | each keeps its own (Fresh 2 strokes on the page, the first profile 1): PASS |
| Reload under 150 ms | a stroke, then a reload at once | the stroke is kept (the module writes the progress when the pen lifts): PASS. Core, reported: an answer saved and the page reloaded at once: 0 of 1 kept |
| Reload over 150 ms | a stroke, 300 ms, a reload | kept: PASS. Core, reported: an answer after 300 ms: 1 of 1 kept |
| Storage denied (`setItem` throws SecurityError), 820 and 390 px | an answer and a stroke saved, then storage denied, a second stroke and a second answer | a notice at the foot of the screen says the browser is not saving (and the core's notice shows); the saved progress is unchanged (1 stroke, 1 answer); the new stroke stays on screen; after a reload with storage working the answer and stroke saved before load and new writing is saved: PASS |
| Storage full (this browser's own quota), 820 and 390 px | the progress filled with writing until 3072 characters were left, then a stroke of 400 points | Chromium's localStorage took 5242634 characters of keys and values for this file:// origin (10.00 MiB as UTF-16); a save failed once the progress passed 5242649 characters. The stroke is refused with a notice on screen ("…the last change on this page was not saved. The writing saved before and your answers are kept…"), the core's notice does not show, the saved progress is byte for byte as before, and an answer given after it is still saved: PASS |
| Export with storage full | Export of the full progress | works: PASS |
| Import that does not fit | Import of the full progress into a second profile | the core's notice shows; the second profile is not saved; the first profile's saved progress is unchanged: PASS. Core, reported: the import is kept for the visit only |
| After storage works again | reload, then Erase all writing to make room, then a stroke | the answers and the writing saved before load (without the refused stroke); after Erase all writing new writing is saved and the answers are kept: PASS |

Before the fix (the module at fa4a532 with a first draft of the new test, log `logs/01-new-test-on-old-module.log`):
19 of 152 checks FAILED. Three of them were faults of that draft of the test (it read the canvas before it was
drawn, counted strokes absolutely, and read the stored progress before the old module's 150 ms save), and some
others fail only because the old module has no save state to read; these were corrected in the test. The real
faults it showed: with storage full, the stroke was taken into the progress, every later save failed, and the answer given
after it was lost on reload ("an answer given after the refused stroke is still saved (1 answers saved)" FAIL);
there was no notice that the writing was not saved; at 390 px the "not saving" notice was out of sight in the
sideways-scrolling bar; a reload at once after a stroke lost it.
