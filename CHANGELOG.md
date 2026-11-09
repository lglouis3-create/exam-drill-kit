# Changelog

Dated kit changes, newest first.

## 2026-11-09 (bookkeeping: drug list outcomes queued)
- `review/port-queue.md` item 23 and `review/porter-policy.md` section 1: drug-list-tab v2, the Drug list's per-fact outcomes kept in each profile's progress (`drug-list-persistent-outcomes`). Louis, 2026-11-09: develop and test it; the pull request goes to him before any merge or any course switches it on. Source: DEENT at `main` `b747e49`, read-only. `coordinator/improvements.json`: the entry set to implementing, with his decision. Nothing is built by this change.

## 2026-11-09 (figures)
- Enlarge: the placeholder that holds a figure's place takes the figure's exact height (`getBoundingClientRect`), not the rounded `offsetHeight`. A figure with a fractional height (DEENT's acne-cascade, 487.22 px at 390x420) made the page 0.22 px shorter while enlarged, so at the end of the page Enlarge then Close moved the scroll by 1 px (DEENT's ux_test, y 18062 then 18061).

## 2026-11-09 (checks: scratch folders)
- The checks' scratch folders are removed when their run passes and kept when it fails (reported by the DEENT session on 2026-11-08: 4,121 leftover folders, about 22 GB, filled its container's disk and stopped browser checks mid-run). `check_lib.js` records each folder `scratchRepo` makes (and so `scratchBuild`) and removes those, by exact path, when the check exits with no failed check; on a FAIL, a crash or a timeout it keeps them and prints `kept for inspection: <paths>`. `run_checks.sh` removes its `drill-checks-*` log folder when no check failed (it reads a check's summary from the line before the "kept" line, so every PASS, FAIL, NOT RUN and REPORT line reads as before). `ci_course.sh` removes its `kit-ci-*` work folder and the log folder when it exits 0, from a trap on EXIT, and otherwise keeps and names them. `state_check_test.js` lists its shallow clone (`state-test-*-shallow`) with its scratch copy. `KEEP_TEST_TMP=1` keeps everything. After SIGTERM or SIGINT nothing is removed, even if another handler then exits 0; `ci_course.sh` removes the log folder only when it is directly in `$TMPDIR`. `checks_test.js` section 7 checks the rule: a passing check removes its folder, a failing one keeps and names it, `KEEP_TEST_TMP=1` keeps it, and `run_checks.sh` still reads a REPORT as REPORT with the kept line after it. No other check's assertions or results change. Test only.

## 2026-11-08 (build: link-preview tags)
- `course.js` `share` (optional; requested by the DEENT session): `title`, `description`, `url` and `image` give the page its `<title>` and the og:/twitter: tags that iMessage, Slack and social sites read when its address is shared; every value HTML-escaped; og:url ends in `preview/` on a preview build; `image`, a PNG in `src/icons/`, is copied to the site root. A wrong value stops the build before it writes. Without `share` every file the build writes is byte for byte what it wrote before (`share_test.js`, against main's `build.py`).
- `course.js` `manifest.short_name` (optional): the manifest's `short_name`, the name under the Home Screen icon; the page keeps `short`.

## 2026-11-08 (bookkeeping: registry)
- `coordinator/improvements.json`: two candidates recorded at the DEENT session's request, `deent-narration-walkthroughs` (discovered) and `drug-list-persistent-outcomes` (proposed; new progress storage and Import behaviour wait for Louis); `bdk-study-features` set to implementing with #75, #82, #83 and #85. The header of the 2026-11-06 optional-topics entry names its merge (#72, efd9386).

## 2026-11-08 (feature modules: the paper hook)
- `X.paper` again accepts a paper of the same length with other questions in place, as before #80 (paper-picker draws another exam's paper; #80's same-questions rule refused it and paper-picker's test failed 3 of 3). A result of another length, with an entry that is not a question of the bank, or with a question twice, is refused, the drawn paper kept and the module switched off for the visit. #80's protection stays: the hooks do not run on the opening page's sample draws. `features_test.js` checks a replacing hook and each refusal (wrong length; a copy that is not the bank's question; a question twice; each on its own visit); the throw test clears the sampled count after it (the review of #80).

## 2026-11-08 (exam opening page and feature modules)
- The exam's opening page draws 20 sample papers to describe its select-all items (#59). A feature module's `X.paper` hook no longer runs on those sample draws, only on a paper that starts (`EXAM_SAMPLING` in `views.js`, read by `features.js`). Before, a hook ran 20 times on opening the Exam tab; a hook that saves (paper-picker, not merged) wrote the progress for papers nobody started. A hook only reorders a paper, so the select-all count is unchanged. `features_test.js` checks it (20 hook calls before, 0 after; a real draw still runs the hook once).

## 2026-11-08 (checks)
- `optional_test.js` decides from `exams[].questions` alone whether the course sets a question count. With `marks: null` and a count set, `nullexam.js` draws full papers, and the test had expected empty ones (DEENT: questions 50, marks null; 1 of 47 checks failed while its 20 papers held 1,000 items, none optional). Test only.
- `optional_test.js`: the Optional-badge check takes an optional question that has option buttons; on a course whose optional questions are calculations (plan-the-problem, quiz-prep-cards) it skips with that reason instead of stopping with a TypeError. A card that draws no option button fails a named check. Test only.

## 2026-11-08 (checks: exam review)
- `exam_review_test.js`: its answer helper sets an answer instead of toggling it. A select-all option clicked a second time is taken off, so when question 1 of the paper was a select-all item, answering it again after Next and Back emptied it; "Chromium · medicinal-chemistry" then failed (the overview read "not answered" for questions 1 and 2, and "all 50 answers are recorded once (history +49)" failed) on main since 9711ce2 (runs 42470418238, 42470992560). Test only.

## 2026-11-08 (plan)
- BDK's study features are planned as kit modules any course can switch on, in four parts (`review/bdk-study-features-plan.md`, Louis 2026-11-08): the drug list, comparison and field colours first; existing study tools next; new storage, scheduling behaviour and the builder's recommendation keep their own approvals. Recorded as `bdk-study-features` in `coordinator/improvements.json`; port queue items 11-17 are `planned` by part. Nothing is built by this change.

## 2026-11-06 (exam paper)
- Exam paper: the last question's "Review" no longer grades and submits the paper. It is now "Review answers" and opens an overview of the paper (each question number, answered or not answered, a way back to any question, one submit button). The overview shows no answers, grades or explanations and records nothing; its submit asks the same question as "Submit paper", and Cancel keeps the paper running (`exam_review_test.js`).
- Exam paper: a chosen answer is drawn in the neutral selection colour (blue), the same for a right and a wrong choice; green and red appear only on the result page.
- Exam opening page: it describes select-all items from papers drawn by the engine's own draw (20 sample papers per exam and bank), worded as a sample about practice papers, not a guarantee or the official exam format: "Practice papers drawn from this bank carry about N" (one count seen, N > 0) or "carry between lo and hi select-all items" (several) "...; yours may differ.", or "... are not expected to carry select-all items (none in 20 sample draws)"; never "about 0". It replaces "about 0 of the 50 are select-all". "No explanations until you finish" no longer adds "same as the real thing".
- Exam overview: the question opened from it takes the focus; with more than six unanswered the "Not answered" line gives the count and the first five. A chosen answer has an inner ring as well as the filled letter, so it differs from an answer under the pointer.
- Exam overview: its Submit, numbers and Back do nothing when left on screen after a switch to another profile (no error, nothing recorded for either profile).

## 2026-11-06 (optional topics; merged as #72, efd9386, on 2026-11-08)
- A TOPICS entry may carry `optional: true`. Its questions stay in the bank and on their own topic (the topic's Start, each subtopic's Start, guide and atlas links), and the topic line shows an "Optional" label. They are left out of "Everything, adaptive" (filtered or not) and the count on Start practice, the pass of every question, the filtered pass, the exam pools (so exam papers, the exam-weighted pass, the pool cards on Weak spots, mark weights and the exam-day scheduling scope), What to review next and the mastered count, and a broad session's retry; a question card of the topic shows "Optional" instead of "Exam N · …". A course with no optional topic is unchanged. New check: `optional_test.js`. `test.js` fails a question of an optional topic that shares its `concept` with a question outside optional topics, since scheduling state is per concept (review of #72).

## 2026-11-06 (study pages, #70)
- The Topics tab opens with a short Start here block: Learn a topic, Start practice, Review weak concepts, Practice exam (existing views only). The whole-bank passes move below the topic list.
- On a narrow screen: a wide reading table keeps its first column in view while the rest scrolls, with a line that says which side has more columns; the tab bar shows a chevron on the side with more tabs and scrolls the opened tab into view; the tab bar no longer slides under a header that wraps to two lines.
- Step-through figures: every control and dot is a 44 px touch target, the current dot is ringed, the step is announced, the arrow keys step, and Enlarge shows the figure across the screen (Close or Escape).
- Atlas: course.js `atlasTitle`, `atlasNoun` and `atlasExampleLabel` set its heading, its noun and the "e.g." label (defaults unchanged); a Reveal name button per tile with aria-expanded; in Hide names mode no drawing label, board heading, intro, section label or note names a structure; the count leaves out tiles a class hides; "Back to the atlas" after a jump out of it.
- `test.js` accepts read links to any view this course shows (the Atlas's `at-<board>`, Diagrams' `dg-<key>`) and fails a link whose anchor its view does not draw. New check: `ux_test.js`.
- Review of #70: an enlarged figure keeps Tab inside it, returns focus to Enlarge, and closes before another tab or a redraw (no scroll lock left); a table with a rowspan or colspan keeps no fixed column; the tab-bar chevrons cover the bar's edge; the Atlas's narrowed count reads "n of N" as before unless `atlasNoun` is set; Start practice says it follows the filters, and the whole-bank passes sit under "Mixed drills and whole-bank passes".
- Enlarge and Close on a step-through no longer move the page: a placeholder holds the figure's place while it is enlarged, and the page returns to where it was. Also with the figure's top at the top of the screen (the placeholder goes in after the figure leaves the flow, and neither anchors the browser's scroll).

## 2026-11-06 (WebKit install)
- In the WebKit jobs the install of Playwright, WebKit and pdfplumber has its own limit of 6 minutes, apart from the checks' 30. After any failure of the first attempt, an error or running longer than 6 minutes, the install is tried once more. Before that second attempt, any process the first left behind is stopped (including dpkg and the Playwright CLI's node child), apt waits up to 120 s for a dpkg lock, an interrupted dpkg run is finished, a line is written to the job summary, and the mirror list is printed; if the list names hosts other than `azure.archive.ubuntu.com`, that host is left out. A second failure fails the job through a step named "NOT RUN: the WebKit install failed twice, so no check ran". The checks are never retried. Diagnosis: `review/ci/webkit-install-2026-11-06.md`.

## 2026-11-06 (records)
- A tab's last save (the per-tab record) keeps a feature module's part of the progress: worksheets-ink's `DB.ink`, equation-drill's `DB.eq`, or any key outside the core's own parts, as Import decides.
  - **A record behind the stored progress, or with no answers:** if it holds a module part that the stored progress does not hold the same, it becomes a copy (Settings, "Put back the progress from …"). Before, only the settings were compared, and the record was removed 60 s later.
  - **A record with no answers whose settings differ from the stored ones:** kept as a copy ("apart"), as the settings-only case behind the stored answers already was. Before, it was taken as stored and removed.
  - **A later record that continues the stored answers:** it no longer replaces a progress whose module part it lacks; it becomes a copy instead.
  - **A record not yet placed, met by Erase, Put back, a replacing Import or Delete the copies:** if it holds a module part the stored progress lacks, it becomes a copy with its history entries. Under a full storage the record, the only stored copy of that work, is never removed to make room: it stays in storage, a notice says it is not yet a copy Settings can put back, and a later check makes the copy once there is room (Louis, 2026-11-06). With every write refused, the record is still in storage after a reload.
  - **This tab's own record under a full storage:** still removed when the stored progress continues it (`placeOf` `own`).
  - **Put back:** the per-tab records are retired after Put back writes its copy list, so a record's module part kept as a copy stays on that list, with storage full or not (the review of #69, N1). Before, Put back's own list write dropped that copy, and with storage full the record had already been removed: the module part was lost.
- New check `core/record_modules_test.js`. On main 3f8ba20 it fails 17 of 36 checks (`review/record-modules/before-main-3f8ba20.log`). The Put back checks fail 3 of 43 on adbcb82 (`review/record-modules/before-putback-fix-adbcb82.log`) and pass 43 of 43 with this change (`after-putback-fix.log`).
- equation-drill and worksheets-ink stay off in every course until this merges (Louis, 2026-11-06).

## 2026-11-06 (checks)
- `import_test.js` section A, a writer that leaves without handing over (task 56): the next tab's take-over waits for the leaving tab's writer lock, and in WebKit job 128009951139 that lock was still held 20 s after the page closed, so the single 20 s wait found the take-over still waiting and the answer recorded next was not stored. `tookOver` now waits on the real condition in two bounded parts: the lock free of every holder but this tab within 60 s, then the take-over finished within 6 s, the core's own 5 s deadline plus a margin. A lock never freed, or a take-over that does not finish once the lock is free, still fails, with what was seen. No core change (`review/takeover/`).
- `import_test.js` "a profile switch frees the old profile's lock": the second tab now asks for the lock until it is granted or 2000 ms have passed, instead of once straight after the switch. The page frees the lock by resolving its lock callback's promise and the browser frees it after that; the lock was still held at the single request in job 127949917972. Before the switch the check now confirms that the second tab is read-only and that the browser lists exactly one held lock under the name it waits on, so a wrong lock name on either side fails it. A lock still held after 2000 ms fails the check and says how many holders remain (`review/lock-test/`).
- A check can report one case as NOT RUN (`check_lib.js` `notRunCase`). It is counted apart from passes and skips, named in the check's summary, and listed by `run_checks.sh`. `ci_course.sh` accepts exactly one such case, listed in `core/ci_exclusions.sh`: the worksheets-ink PDF's size in WebKit (Louis, 2026-11-06). Any other NOT RUN case, and the same case in Chromium, fails the run. When worksheets-ink is on, its PDF check (Chromium) and its four print-layout checks (Chromium and WebKit) must each appear as a passing line in its log (`REQUIRED_PASSES`; `notruncase_test.js`).

## 2026-11-06
- A running exam paper, quiz session or targeted review now belongs to the profile that started it. Before, a profile switch left it on screen: the next profile saw the paper and its picks, a pick saved it under the next profile, and submitting it, or its clock running out, recorded the answers in the next profile's history. A switch now saves the paper under its own profile and puts it and the quiz session away; switching back brings both back as they were. A paper is submitted at most once. A reload brings the quiz place back only for the profile it was saved under, so a reload after another tab switched the profile does not carry the question over; that place record (per tab, sessionStorage) now names its profile (`ownership_test.js`). No progress, history or paper format changes.
- The improvement coordinator (`coordinator/`):
  - records each course's whole exam schedule apart from what its site has released;
  - classifies each course's lifecycle from that schedule in America/Chicago;
  - plans reviews by lifecycle and by what changed since the last reviewed commit;
  - checks that a site lists only released exams;
  - keeps an improvement registry;
  - shows "Show my Exam Drill Dashboard" in Claude Code (`.claude/skills/exam-drill-dashboard/`).

  `coordinator/coord_test.js` runs in Kit checks. DEENT is registered in `COURSES.md` and
  `coordinator/courses.json`, with its published and unreleased question counts labelled by
  branch.
- The coordinator reads a course file as text and never runs it. It reads the release state at the commit GitHub Pages last deployed, or says the live revision is unknown. Credentials are removed from every shown or cached error. Approvals come from an "Approval:" line in each pull request. A final exam with no date no longer stops it.
- The kit-update run reads each course from the branch Pages serves (`pagesBranch`), never
  the default branch, and skips the kit-update preview of a course whose `kitUpdate` is
  paused while keeping its read-only checks (`coord.js kitupdate`). DEENT is paused until
  its pending release is resolved (Louis, 2026-11-06).
- A coordinator run records improvements and prepares none, and writes a retrospective only
  when Louis asks; preparing improvements and automatic retrospectives are a separate
  proposal.

## 2026-11-05
- The answer history is no longer cut silently at 20,000 entries: past it a notice offers Export progress and a removal of the oldest entries that names how many and their dates and needs an OK; until then new entries go on being added (`cap_test.js`).
- Study progress first when storage is full: while a progress write is refused, the answer history is held (on the page, named in the notice, in Export) and written after the next progress save; this tab's own per-tab record, proven stored, is removed to make room and the progress write tried once more.
- "Use it here" with only history unsaved no longer stores an entry twice when the other tab already placed this tab's per-tab record.
- With storage full: the notice has an Export progress button and says when this tab's per-tab record is off; the new-version bar's Reload asks first when writes are refused; closing the tab while refused work is not exported gets the browser's leave question.

## 2026-11-04
- Settings shows how much this site stores in this browser (every drill, in characters, against 5,242,880), this drill's part (progress, history, preview copies, copies kept by Import and their number) and this profile's answers kept and recorded.
- A warning in the Quiz tab and in Settings when the space left is less than one more profile of the largest size here, or a first preview of a course here, would need; it names the largest items and offers Export progress and Delete the copies kept by Import. Nothing is deleted automatically. The page says the figures are an estimate and the limit differs by browser.
- `core/storage_use_test.js` checks the figures, the warning on each side of its boundary and the estimate wording.
- Storage in Settings: the Chromium limit is given as measured exactly (5,242,880 characters, UTF-16 units, per origin); each writing tab's pending records have a line of their own; another drill's items name its namespace; a preview page counts and deletes the same copies.
- A profile switch away and straight back no longer leaves the page read-only behind the "open in another tab" wall.
- A tab that closes or reloads without handing over its profile no longer loses its last save to the next tab: each writing tab keeps that save in a record only it writes; the next tab starts from it, or keeps it as a copy (Put back) when it has saved since. Records are removed only after they are read back as stored and 60 s have passed.
- A history write the browser refuses no longer deletes the oldest half of the answer history: every entry is kept on the page, the "did not save" notice names the answer history and points to Export progress (whose file holds them), the page counts them as unsaved (the stop wall's export; "Use it here" adds them to the saved history, or keeps them in its copy), and the next save the browser keeps writes them all (for a profile switched away from, once no tab holds that profile; Louis, 2026-11-04).
- Switching profile with progress or history the browser refused asks first and offers the export; the history of a profile switched away from is written by a later save once the browser has room and no tab holds that profile, and only if no other tab changed that history meanwhile (otherwise a notice offers its export).
- The "did not save" notice shows again for a refusal after everything refused had been saved.
- With the whole site's storage full, progress now stops saving sooner than before, because the history is no longer cut to make room (for Louis to decide; `core/README.md`).

## 2026-11-03
- Import progress shows what a file holds and would change, and saves only when confirmed.
- Import refuses a file of another course or of no course, and replaces progress only with a record that continues it.
- Import compares every part of a file's progress, not only its answers: a file whose concept progress, settings or scheduling state differ goes into a new profile.
- A page whose profile another tab or window saved since stops saving and offers a reload, instead of writing its older progress over the newer one.
- Each profile has one writing tab at a time (Web Locks): another tab of the same browser opens it read-only, takes no answers, and offers "Use it here", which moves the profile after the other tab has saved. A stopped page covers itself, takes no answers, and offers to export what it has not saved before a reload.
- Import keeps a copy of the progress it replaces; Put back never loses either record.
- Put back and "Delete the copies" do nothing when another tab or window saved the profile or changed the copies while their question was open, and Erase does nothing when the profile was saved there meanwhile; copies another tab deleted are not offered or written back.
- Kit checks on GitHub: each module course the plan selects also runs in WebKit (job "modules-webkit"), and a module course fails unless each module's own test passed at least one check in that job's browser.
- An answer or a setting changed just before the page is reloaded, closed or hidden is saved at once; it was lost when the 150 ms save had not yet run.
- `core/test.js` section 7 runs its miss-and-return trial 20 times instead of once, and passes the cool-down by adding to the answer count, so a scheduler that always ignores the different-wording rule is caught in every run, and a topic with few concepts no longer fails it falsely.
- Standing autonomy (Louis): `KIT_DESIGN.md` §12 decision 10 says which pull requests Claude merges on its own after an independent review, which checks must pass (every applicable `checks.yml` job, with "success", on the final head commit), and Claude's readings; `review/porter-policy.md` follows it; no course update goes live without Louis's reply.
- `core/test.js`: the check that a missed concept returns as a different wording takes its two questions from one topic, so a concept with wordings in two topics no longer fails it falsely.
- Kit checks on GitHub: the WebKit job now blocks a merge, as the Chromium jobs do.
- `FEATURES.md`: the focus-switch "Use when" line no longer quotes a professor by name; its source reference is kept.
- `core/test.js`: two lectures with the same id in `course.js` fail the check.
- `core/offline_test.js`: "server down" refuses connections; dropped ones broke WebKit's network session at random.

## 2026-11-02
- `core/style_check.js`: "given as" in a dose or a problem (given as an IV infusion) is no longer flagged.
- `core/home_test.js`: answers a select-all question it picks, with its right boxes, so it no longer fails at random.
- Kit checks on GitHub: every pull request runs the checks in Chromium and, as information, in WebKit.
- Checks open built pages over HTTP from 127.0.0.1, not from disk, so WebKit no longer refuses the manifest.
- Kit checks on GitHub: each changed feature module, and each module that needs it, is checked on a course of its own.
- `core/render_test.js`: answers calculation and matching items with their own controls; no more random failures.
- New feature module `theme` v1 (`features/theme/`), from Basic-Pharmacokinetics `ac2eb73`
  (`src/views.js` 6323-6333 and `src/shell.html` 979-1042): dark colours for the whole page
  (the core has light colours only) and the student's choice of Match device, Light or Dark
  in the header and in Settings. The choice is kept in the browser under `<ns>:theme` for
  every profile, not in the progress, so Export does not carry it. Its test has 46 checks,
  run on Basic-Pharmacokinetics questions as well as the course's own (first frame, reload
  timing, Export and Import, storage denied and full, contrast); run on a copy with the
  module's code emptied it fails. Known limit: on a page of 1.5 MB or more a stored Dark can
  show light for a moment when the page opens, and a stored Light dark (on 2026-11-03, 6 to 10
  and 4 to 8 of 12 reloads of a 1.6 MB page); the test reports it as a skip labelled KNOWN LIMIT
  T1 with its count, and the fix needs a core change (a script in `<head>`). `features/theme/ci/oncourse.js` switches it on in the kit's
  CI courses. No course switches it on yet.

## 2026-11-01
- `core/`: an exam with `questions: null` or a pool with `marks: null` no longer breaks the page (`nullexam.js`).
- `core/`: a pool without marks makes the whole exam unweighted; `minutes: null` with a count gives an untimed paper.
- `core/`: a practice paper keeps the timing it started with when the course later sets a time limit.
- `core/`: a fault at start-up can no longer cost saved progress (Louis approved the fix).
  Found in a scratch move of Pharmacokinetics: a `DIAGRAMS` list of another shape made a
  tab step throw, start-up stopped before the saved progress was loaded, and the next
  answer's save replaced it. Start-up now loads the progress before any step that builds
  the page; every write of the progress, the answer history and the exam paper waits for
  a load that worked in this visit; when the load fails (not valid JSON, or a value it
  cannot convert) the stored value is left as it was, Import and Erase do nothing, and one
  notice says "Your saved progress could not be loaded. Nothing will be saved during this
  visit, and the saved progress is left as it was." Each later start-up step runs on its
  own: one that throws is skipped with its error on the console, and a tab whose list
  cannot be built is removed. A stored answer history that cannot be read is no longer
  written over. New check `startup_test.js` (77 checks; 40 of them fail on the d187207
  core and on Medicinal-chemistry's live page, where 5 saved answers were replaced by a
  save of 1). `run_checks.sh`: template scratch course 23 PASS, 0 FAIL, 1 NOT RUN,
  1 REPORT; the Medicinal-chemistry copy 22 PASS, 0 FAIL, 2 NOT RUN, 1 REPORT.
- New feature module `wrong-number-diagnosis` v1 (`features/wrong-number-diagnosis/`), from
  Basic-Pharmacokinetics `ac2eb73` (`missDiagnosis`, its `src/shell.html` 1270-1338, written
  into the module by `port_from_pk.py`): after a wrong typed number, in the quiz and on a
  paper's result page, up to two lines say what the number is and which kind of miss that
  is, and the engine's miss chip it points to is marked. The pick stays the answer's `miss`
  (what Weak spots counts), the reading is kept as `missSuggest`, and a progress saved with
  PK's `missKind` gets `miss` from it when loaded or imported. Its test (PK `test.js`
  368-387 ported): 15 checks pass; with the module's code left out, 1 of 1 fails.
- New feature module `equation-drill` v2 (`features/equation-drill/`), from
  Basic-Pharmacokinetics `ac2eb73`: an Equations tab over the course's `EQUATIONS`, grouped
  by module, each equation marked on the sheet, not on it, or to memorise, and opening what
  each symbol is, when it holds, how to reach it and its source; a writing drill types the
  right-hand side (any spelling of the same algebra counts) or builds it from pieces, some
  wrong, learned at 3 right in a row. It needs `formulas-in-text`. Its code is PK's,
  assembled by `features/equation-drill/port_from_pk.py`. Not ported: the set-up drill, "How
  she asks it", the variables quiz, the sheet map. Its test (PK `equation_test.py` and
  `test.js` 5d ported): 30 checks pass; with the module's code left out, 1 of 1 fails.
- New feature module `chained-problem-sets` v2 (`features/chained-problem-sets/`), from
  Basic-Pharmacokinetics `ac2eb73`: the course's `CHAINS` (problems asked in parts) get a
  "Problems asked in parts" card on Topics; a set runs in the professor's order with "part i
  of n", the vignette above each part and a closing card naming it; a part met alone names
  its set and offers it from part 1; a paper keeps a set's parts together and in order (the
  new `X.paper` hook). Its build step stops the build on a set naming a missing question.
  Its test (PK `problemset_test.py` and `test.js` 5c, 760-807 ported, including the check
  that every earlier result a part uses is stated in its stem): 17 checks pass; with the
  module's code left out, 5 pass, 2 fail, then it stops (no Start button).
- `core/`: an exam in `course.js` with `typed: true` (new, off unless set) puts
  `exam_typed.js` in the page, and that exam's papers draw numeric and matching items by
  the same rules as the rest (the engine's own draw, with their `type` set aside while it
  runs); on the paper a calculation is typed and a matching item picked row by row, kept
  through a reload, graded as in the quiz, recorded on submit and reviewed with the answer
  and the working. New check `exam_typed_test.js` (17 checks pass; on the `d187207` core
  4 pass, 5 fail, then it stops: no box to type the number). `test.js`, `browser_test.js`
  and `history_test.js` answer a calculation or matching item when one is first on a paper.
  Feature modules get one more hook, `X.paper`: a new paper's questions, in order, before
  it starts (`features_test.js`: 40 checks).
- `core/`: `course.js` `numeric` (new, off unless a course sets it) puts `numeric.js` in
  the page: a typed number is read with its unit after it (`2.6 hr`, `0.17 1/hr`,
  `0.17 hr-1`), two numbers are never joined into one, and with `numeric.margin` an item is
  right within max(`tol`, margin × |key|) (Basic-Pharmacokinetics: `{margin: 0.02}`); the
  verdict names the margin. On PK's 534 numeric items, PK's own grader and this option
  agree on every item typed eight ways; without the option the core agrees with PK on 145
  of 534 at the key + 1.5%, 400 at the key and ` 1/hr`, 0 at ` hr-1`, and on 152 at the key
  and ` 5` (382 right only in the core) (`core/README.md` "Typed numbers"). New check
  `numeric_test.js` (16 checks pass; 9 of 16 fail on the `d187207` core).
- New feature module `formulas-in-text` v1 (`features/formulas-in-text/`), from
  Basic-Pharmacokinetics `ac2eb73`: formulas typed in plain text are drawn as the slides
  print them, as each question is drawn (`{{frac:a|b}}` stacked, powers, the course's
  subscripts from the `symbols` option, t½, × and −), and fractions in the reading tabs
  stack; stored text is unchanged. A module, not core: the symbol table is course data and
  only calculation courses need it. Its test: on 8 PK questions and 1 calculation, every
  stem (8), option (32) and worked step (3) is drawn exactly as PK's own formatter draws
  it, plus PK's control cases (6 formulas, 3 runs of ordinary text); 11 checks pass, 1 skip
  on the template course (no fractions in its bank). With the module's code left out the
  same test fails 4 checks and then stops (`FX.api('formulas-in-text')` is null).
- Feature modules (`features/README.md`): `course.js` `features: {<name>: {version,
  ...options}}` now switches on a module copied from the kit's `features/<name>/current/`
  to the course's `src/features/<name>/`. `build.py` checks the pinned version, the
  options and the modules a module needs, runs its build step, and puts `core/features.js`
  (the hooks: a tab, a question type, a step after an answer, a pass after a view is drawn,
  reading-tab HTML, a Settings section, a start-up step, a progress converter) and the
  module into the page; a module that throws is skipped and the page carries on. With no
  module on the page is unchanged: the template course built from the same sources by the
  `d187207` core and by this one differs only in the build stamp (241,642 bytes each, with
  the 15 lines of documentation this change adds to `template/course.js`'s header).
  `run_checks.sh` adds `build.py --list-checks`: the checks of what a course switches on.
  New check `features_test.js` (39 checks; on the `d187207` core 4 pass, 9 fail, then it
  stops at the first browser step: `FX is not defined`). `run_checks.sh` on the template
  scratch course: 22 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT, as before.
- `core/`: the Home Screen card no longer appears on Topics; in Settings it is a section
  that starts closed, its one line the card's heading ("Keep your progress: add <short>
  to your Home Screen" in Safari on iPhone and iPad, "Progress from Safari" in a Home
  Screen copy with no progress, "Install <short>" where the browser offers an install
  prompt), opening to the same steps and buttons as before (Louis, after trying
  Medicinal-chemistry's preview on his phone). "Not now" is gone. `home_test.js` checks
  it (33 checks; 15 of them fail on the d13462e core). `run_checks.sh`: template scratch
  course 22 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; the Medicinal-chemistry copy 21 PASS,
  0 FAIL, 2 NOT RUN, 1 REPORT.
- `core/`: the course tables of `cite_check.py` (`ALIASES`, `LECTURES`, `BARE_MAP`),
  `explain_check.js` (`WEIGHTY`) and `harvest_mask.py` (`SPEC`) move into `course.js`
  `tools` (`citeAliases`, `citeLectures`, `citeBareMap`, `explainTerms`, `harvestMasks`),
  so a core update no longer resets them to the kit's empty ones; the three files hold
  no course data. Each tool prints what it read with `--tables`; the build stops on a
  `tools` field no tool reads or a table of the wrong shape. New check `tables_test.js`
  (20 checks; 15 of them fail on the 47bf534 core). On a scratch copy of
  Medicinal-chemistry's `kit/move-to-core` with its tables moved into `tools`, the tools
  read the same tables, and `explain_check.js` (816 lines) and `cite_check.py` against
  its 20 decks (PASS, 1191 slide references) print the same output as with the course's
  own three files; with the kit's empty tables `cite_check.py` fails on 1 citation.
  `run_checks.sh`: template scratch course 22 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; the
  Medicinal-chemistry copy 21 PASS, 0 FAIL, 2 NOT RUN, 1 REPORT.
- `core/`: the site opens straight to the drill and never asks for a name on its own
  (Louis): with no name stored it opens the saved progress used most recently, else a
  profile named "me"; the Switch button still asks. `storage_test.js` and `test.js`
  check it.
- `core/`: fixes found moving Medicinal-chemistry onto the core. The data files are
  listed in `course.js` `files` instead of `build.py` (copying the `9f2f2a4` `build.py`
  over Medicinal-chemistry's left 39 of its 479 questions in the page, with no error), and
  the build stops on a question file the list leaves out; `build.py --list-files`. The
  page's question count is `QUESTIONS.length` (it said 13 for the template's 7 and 551
  for Medicinal-chemistry's 479). `scheduler_test.js` finds the first question file from
  the list; `test.js` and `render_test.js` run without a `DIAGRAMS` list; the offline,
  old-cache and preview tests run on a course with its own `oldCachePrefix` and a large
  page; `update_test.js` pauses its fake clock (its 15-minute check failed in 4 of 20 runs
  on Medicinal-chemistry, then in 0 of 20 on each course); the comparison's arms are
  hashed with `COURSE.ns`, the same in a preview; `course.js` `manifest` gives the web
  manifest `description` and `orientation`; wide tables in the reading tabs scroll in
  their own box on a phone (approved by Louis). New check `files_test.js`. With these,
  `run_checks.sh` on a template scratch course: 21 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; on a
  scratch copy of Medicinal-chemistry's `kit/move-to-core`: 20 PASS, 0 FAIL, 2 NOT RUN,
  1 REPORT.
- `core/`: `course.js` `oldCachePrefix` for a drill that had its own service worker
  before the core (Medicinal-chemistry: `phar4342-drill-`); the worker deletes those
  caches and no other; `oldcache_test.js`.
- `core/` and `template/`: the recovered template split into the shared engine and the
  new-course skeleton, with the build writing to the repository root, `store` for
  refused writes, the offline copy scoped to each course's own caches, the exam draw
  keeping dupOf families off one paper across pools, the update offer and place after
  a reload, check exit codes with `run_checks.sh` and the Safari lint, the answer
  history and the Home Screen card. Each change has a test shown failing on the
  template first.
- `KIT_DESIGN.md` §12.9: how kit updates reach courses (Louis's choice). Feature and core
  updates are built to each course's preview automatically and go live on his reply;
  catalog bookkeeping and `small-fix` changes go live automatically when every check
  passes, the progress format is unchanged, and no exam is within N days (N not set).
  `skill/SKILL.md` Mode 7 and the phrase table describe the kit-update run and undo.
  Then, also from Louis: Claude explains each feature or core pull request in plain
  terms and merges it after his yes; automatic updates skip only the day of an exam;
  the scheduled task "Kit update run" runs daily at 2:47 AM Central.
- `core/`: the approved scheduler (`review/scheduler-proposal.md` §4-§5): exam-date
  spacing, "I was sure of that" with a later-day check, the calculation preset, the
  FSRS-7 option through ts-fsrs 6.0.0 (MIT, in `core/vendor/`), the per-concept
  combination with its comparison, three new answer-log fields, and a converter for
  progress saved by the earlier core; `scheduler_test.js` (109 checks). Parameter
  fitting is not built.
- `core/`: `build.py --preview` with `preview_test.js`; `state_check.js` with
  `state_check_test.js`.
- The kit-update run moved into a dedicated session, "Kit updater", after a test showed
  a fresh scheduled session starts with no repository. Each run begins with a preflight,
  confirms deploys with `gh api` (no connector needed), reverts an update whose deploy
  fails or does not finish in 10 minutes, and notifies Louis only when something needs
  him. Course repositories are attached to that session by Louis's own message.
- `review/recommendation-proposal.md`: how the kit recommends features (material-profile
  signals, a rule table with evidence levels, a within-course random comparison of
  concept clusters, decision rules), with nine questions for Louis; research notes in
  `review/research-notes/recommendation-2026-11-01.md`. `skill/SKILL.md` "Recommending
  features" and `KIT_DESIGN.md` §12.7 describe it, pending approval.
- `KIT_DESIGN.md` §12: design changes Louis approved after Phase 1.
- Skill archives moved to `history/`; recovered template kept in
  `history/exam-drill-template-2026-10-02/` (from Medicinal-chemistry's unpushed `baed236`).
- `FEATURES.md` (50 entries), `COURSES.md` (4 courses), `CLAUDE.md`, `features/README.md`
  created from the Phase 1 drafts.
- `review/scheduler-proposal.md` approved: concept scheduler default with exam-date
  spacing, confident-error check, calculation preset and answer log; FSRS-7 option;
  off-by-default combination with a built-in comparison.

## 2026-10-31
- Phase 1 evaluation: `review/findings.md`, `review/proposed-core.md`,
  `review/FEATURES.draft.md`, `review/COURSES.draft.md`.

## 2026-10-30
- `KIT_DESIGN.md` (design brief) and the two skill archives added.
