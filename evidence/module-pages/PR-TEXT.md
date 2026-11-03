<!-- Full description of the port pull request, as of the final tested commit named in the pull request. Check results written here are agent-run unless marked; the pull request lists the coordinator-verified results. -->

## Port (incomplete): module-pages (port queue item 8)

**Status: draft, Port (incomplete).** Under rule 5 it stays a draft while these remain:
- **Not ported (each needs a core change):** PK's Extra practice rows, which live outside `QUESTIONS`; and the module page kept through a reload.
- **Left out of the CI course:** 2 real Pharmacokinetics questions (the second wordings, `dupOf`, in topic `bolus1`). With them in, the core's `test.js` section 7 fails, because that topic has 4 concepts and a missed concept comes back only after 4 other questions (`GAP = 4`). No question was changed. This is listed for the core proposals.

Needs (`module.json` `needs`): none. Optional partners: `chained-problem-sets` (on `main`), `worksheets-ink` (#17, not on `main`) and `concept-statuses` (not on `main`). Each partner is used only when it is on.

At the final tested commit `45cc0ae`, these passed: the module test and `run_checks.sh` on the module's own course of real Pharmacokinetics data (coordinator-verified, below), and the three blocking GitHub "Kit checks" jobs (Chromium on template, template-unset and medicinal-chemistry, run 41521988645, checked by the coordinator). The informational WebKit job failed; it is not Safari, and it does not block a merge. Safari is NOT RUN.

### What it does, in plain terms
When a course switches this module on, the Topics tab gets one card per module of the course, above the topic list the core already shows. Each card opens a page for that module, with a way back ("← All modules", or a tap on Topics). The page has up to three sections:

- **Concepts**: the professor's objectives for the module. Each objective has its concept questions (no arithmetic) and a Start button. There is also a Start for all of them.
- **Calculations**: every calculation of the module in one pass, then each kind of problem with its count, its progress, **Single problems**, and a **worked example**: the stem, the working line by line, the answer and its citation.
- **Worksheets**: the module's documents, each with **Write on it** and **Practice in the drill**.

Concept or calculation questions that no objective or kind of problem takes are listed under "Other …" on the page, so nothing in the module is left out. A course with no objectives at all gets "All concept questions in this module" and "Calculations by subtopic".

It works alone. Three other modules add to the page only when they are on, checked each time the page is drawn; it does not `need` any of them:
- **chained-problem-sets** on: each kind of problem offers **In parts** (the professor's problem worked part by part), and the page lists the module's lecture examples asked in parts.
- **worksheets-ink** (#17) on: the Worksheets section appears. It lists the documents in `SOURCES` whose `module` or `modules` names the module.
- **concept-statuses** (#19) on: each objective row says how many of its concepts are struggling, improving, mastered, and so on, and how many are not answered yet.

Ported from Basic-Pharmacokinetics `src/views.js` lines 722-854 at `ac2eb73`. The feature was first added there in `1003ce4` (2026-10-02).

### What changes
- New `features/module-pages/current/`: `module.json`, `module-pages.js`, `module-pages.css`, `step.js` (build step), `test.js`.
- New `features/module-pages/ci/oncourse.js`, the CI course script (the shape agreed in #12). It sits outside `current/`, so a course never copies it. It writes the module's own course from real Pharmacokinetics data, taken from the test's fixture (PK `ac2eb73`): the 8 Module 2 questions whose citation names a lecture deck of the course (`2IVBolusAdministration.pdf`), one per line in the template's question form; their 2 topics; the 5 Module 2 objectives; the 1 kind of problem whose worked example is among those 8; the skill `multicpt`; PK's two Module 2 lectures (`src/course.js` lines 55-61) as literals. The one change to the data: `prof` is the template's "Professor". Left out, with the reason printed: 12 questions that cite practice sheets, the homework sheet or a lecture transcript (not lectures of the course), the 2 second wordings (see "Needs a core proposal"), 3 kinds whose worked example is one of the left-out questions, and the problem set (its parts cite the homework sheet).
- Course data, in a file listed in `course.js` `files` (both lists are optional):
  - `OBJECTIVES = [{module, n, text, subs: ['topic/sub'], label?}]`
  - `CALC_TYPES = [{module, id, name, match: ['topic', 'topic/sub', 'topic/sub:skill'], example?}]`

  A question's module is its own `module` field, or else its lecture's `module` in `COURSE.lectures`. The module names and their order come from the `modules` option (`[[value, heading], ...]`); without it they come from the lectures. The heading over the cards is the `title` option. No module name or grouping is in the code.
- The build step stops the build, with the reason, on any of these:
  - an objective whose subtopic is not in TOPICS;
  - an objective or kind of problem of a module the course does not have;
  - two objectives with one number;
  - a kind of problem whose topic is not in TOPICS;
  - two kinds of problem with one id;
  - a worked example that is not in the bank, is not a calculation, or belongs to another kind;
  - a `modules` option of the wrong shape.
- Other files:
  - `FEATURES.md`: new `module-pages` entry (its Test line gives the counts below).
  - `features/README.md`: modules table row.
  - `review/port-queue.md`: item 8 set to `partial (left: Extra practice rows, the module page kept through a reload)`.
  - `CHANGELOG.md`: one entry under 2026-11-02.

### What does not change
- No course site changes until a course switches the module on.
- `core/` and `template/` are unchanged: `git diff origin/main -- core template` is empty. A course without the module builds the same page as before; this was checked byte for byte with the build stamp masked.
- The module saves nothing: no progress field, no stored key.

### Not ported, and why
- **Extra practice rows** (PK's `EXTRAS`: problems written for the drill and kept out of the bank). They live outside `QUESTIONS`, and the core's `byId` and quiz runner read only `QUESTIONS`, so porting them needs a core change.
- **The module page kept through a reload.** After a reload the student sees the module cards, not the page that was open. The core keeps no place for the Topics tab (a core change).
- **The "origin mix" captions** (for example "12 daily practice sheet, 4 slide example"). They depend on PK's origin tags, which are Tier 3.
- **PK's two-row progress meters.** The module uses the core's meter, an answered count and a mastered-concept count instead.

### Checks (all agent-run, at `45cc0ae`)
| Check | Result |
|---|---|
| Module test on the module's own course built with `module-pages.js` emptied | FAIL, as it must: 1 of 1 checks failed ("the page carries module-pages, working") |
| Module test on the module's own course (`ci/oncourse.js` data: PK Module 2), 3 runs | PASS, 30 checks each run (3 skipped: chained-problem-sets, worksheets-ink and concept-statuses are not in that course) |
| `run_checks.sh` on the module's own course | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`: no lecture PDFs), 1 REPORT (`explain_check.js`, 7 of 15 questions) |
| Module test with chained-problem-sets, worksheets-ink (`8265f5c`) and concept-statuses (`46e3156`) in the course, worksheets-ink's ci data absent | PASS, 42 checks |
| The same with worksheets-ink's ci data (`8265f5c`) present | PASS, 42 checks (the data built; 36 questions in 8 topics) |
| Integration finding F6: worksheets-ink's ci data from the integration branch (`fa99b5c`, with its own Module 2), module-pages on | test at `428d109`: FAIL ("calcs: 35 problems", then a click timeout); test at `45cc0ae`: PASS, 39 checks (2 skipped: that course declares no objectives or kinds) |
| Mutation checks (13) | 13 of 13 caught |
| CI script run a second time on the same course | refuses, exit 1; course.js unchanged |
| `run_checks.sh`, fresh template course with no features | cited from `evidence/baseline` `main-98e7b5b/` (same core tree `c9fde5b` and template tree `cbac5bd`): 24 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`), 1 REPORT |
| Medicinal-chemistry `f1f5ee5` with the kit core, full clone | cited from `evidence/baseline` `main-98e7b5b/`: 23 PASS, 0 FAIL, 2 NOT RUN (`stepper_test.js`: no step-through figures; `cite_check.py`: no PDFs), 1 REPORT. `home_test.js` passed there (33 checks, before kit PR #28's fix) |
| Regex lookbehind in the module's JS | none (`device_lint.js` PASS) |
| Safari / WebKit | NOT RUN: not installed in the container (Chromium only) |

## Review evidence
- Final tested commit: **`45cc0ae794a9ffa6b00e899e441d126e7b147c7f`**. Branch commits: `72257d0` (module), `c9492c8` (CI script, queue status), `428d109` (merge of origin/main `98e7b5b`), `45cc0ae` (test made independent of the course's own modules; CI course from real PK data).
- Trees at `45cc0ae`: core `c9fde5b` and template `cbac5bd`, the same as `evidence/baseline` folder `main-98e7b5b/`. `git diff origin/main -- core template` is empty.
- Evidence branch: **`evidence/module-pages`** (`32074e7`). The new runs are in `evidence/module-pages/harden-45cc0ae/` (INDEX.md, every log, the scripts, the mutation table, the files the CI script writes); the earlier runs at `c9492c8` stay in `evidence/module-pages/`.
- Corrected from the earlier text: the CI script at `c9492c8` wrote no course data, only the line that switches the module on; it now writes PK's Module 2 (above). The test at `c9492c8`/`428d109` assumed the course had no Module 2 content of its own (integration finding F6); fixed in `45cc0ae`.

### Behaviour map (from PK `src/views.js` at `ac2eb73`)
| Behaviour in the source | Line | Status | Note |
|---|---|---|---|
| A card per module on Topics with Concepts / Calculations / Worksheets buttons, a count and progress | 750-770 | adapted | The cards sit above the core's topic list. A button shows only when its section has questions. The core's meter is used, plus an answered bar. |
| A module holds the topics most of whose questions carry its number | 731-734, 370-387 | adapted | A question's module is its own `module` field, or else its lecture's. Names and order come from the `modules` option, or else the lectures. PK's `topicsMenu` exam and view entries are not part of this module. |
| Concept or calculation (numeric; matching of a calc skill with quantities) | 213-219 | ported | |
| Concepts page: All objectives, one row per objective, objective label | 735-737, 782-791 | adapted | Pool limited to the module. An objective may carry its own `label` (PK's deck 6a/7a rule is course-specific). New "Other concept questions" row. |
| An objective drill is adaptive | 844-845 | ported | |
| A calculation belongs to the first kind of its module it matches (topic, topic/sub, skill) | 739-745 | ported | |
| Calculations page: All calculations (pass); per kind: count, progress, Single problems, worked example | 792-813 | ported | The working uses the core's step format. Formulas are set by formulas-in-text when that module is on. |
| In parts per kind; a fold when there are several sets | 748, 803-810 | ported (with chained-problem-sets on) | |
| Lecture examples in parts | 811-812 | ported (with chained-problem-sets on) | |
| Origin mix in captions | 794, 798 | omitted | The student does not see where each problem of a kind comes from. |
| Extra practice rows | 813-820, 851-852 | omitted | The student does not get PK's extra practice problems (needs a core change). |
| Worksheets page from problem sets by kind | 821-828 | adapted | With worksheets-ink on, it lists that module's documents, with Write on it and Practice in the drill. Without worksheets-ink, there is no Worksheets section. |
| Module page header: back, name, section tabs | 829-842 | ported | |
| A second tap on Topics returns to the list | 5751 | ported | |
| Coming back to Topics shows the module page again | place_test.py 72-75 | ported | |
| Module page kept through a reload | 6437, 6460 | omitted | After a reload the student sees the cards (needs a core change). |
| Two-row progress meters with percent right | 1938-1950 | adapted | Answered count, mastered meter and concept count. |
| Concept statuses per objective | — | added | Only with concept-statuses on. |

### Mutation table (agent-run; scratch course only, never committed)
Each mutation is applied by an exact string replace that must match once. Then the page is rebuilt and the module test is run. At `c9492c8`: the first run caught 12 of 13 (M1 was not caught, so a check was added); the second caught 13 of 13. At `45cc0ae`, rerun on a course with the module's own PK Module 2 data and the three partner modules: 13 of 13 caught. The table below is the `45cc0ae` run.

| Mutation | Check that failed | Exit |
|---|---|---|
| M1 objective drill takes calculations too | an objective whose subtopics also hold calculations draws only their concept questions (new check) | 1 |
| M2 kind ignores the skill in its match | Module 2 card counts; Calculations lists the 4 kinds; without chained-problem-sets: the kinds are listed | 1 |
| M3 worked example without its working | Calculations lists the 4 kinds, each with a worked example worked line by line | 1 |
| M4 a tap on Topics keeps the module page | a tap on Topics while on a module's page goes back to the cards | 1 |
| M5 other modules' cards not hidden under a module page | what another module adds to Topics is hidden under a module's page | 1 |
| M6 status line skips unanswered concepts | with concept-statuses on, each objective row says how many of its concepts are in each status | 1 |
| M7 worksheets not matched to the module | with worksheets-ink on, the Module 2 card offers Worksheets (1 document) | 1 |
| M8 questions no kind takes are dropped | a module with no objectives or kinds lists its questions under All concept questions and Calculations by subtopic | 1 |
| M9 build step accepts a worked example of another kind | a worked example of another kind stops the build and says so | 1 |
| M10 module page not redrawn when Topics is drawn again | coming back to Topics from the quiz shows the module's page again | 1 |
| M11 In parts not offered | with chained-problem-sets on, the two-compartment kind offers In parts | 1 |
| M12 numeric items counted as concepts | on the course's own data: every concept question belongs to an objective (8) and every worked example is of its own kind (1); the fixture card counts; more | 1 |
| M13 module ignores a question's own `module` field | Topics shows a card per module; Module 2 card counts | 1 |

### Persistence
Not applicable. The module saves nothing: no `DB` field, no store key and no localStorage. It keeps the open module page in memory for the visit, and it only reads `DB.answers` and `DB.concepts`. The Export/Import, profile-switch, reload-timing and storage-denied tests therefore have nothing of this module's to check: NOT RUN, nothing to persist.

### Faults found
- None in the module code (`module-pages.js`, `module-pages.css`, `step.js` are unchanged since `72257d0`).
- In the test (F6, fixed in `45cc0ae`): it counted the course's own Module 2. The fixture now goes on a module number the course does not use (the first free number from 92) and on topic ids prefixed `mpt-`; two changes from the coordinator's `fixes/module-pages.patch` are included (In parts clicks the set's own button, opening a closed list; the Homework row is found by its id).
- In the CI script (fixed in `45cc0ae`): it wrote no course data (HARDEN 9a).
- One test gap found by mutation M1 at `c9492c8`, closed then with a new check.

### Needs a core proposal
- Extra practice outside `QUESTIONS` (`byId` and the quiz runner).
- A place for the Topics tab kept through a reload.
- Core `test.js` section 7 ("Different wording when a missed concept returns") takes the first concept with two wordings and expects it back within that concept's topic. A missed concept returns only after 4 other questions (`GAP = 4`, `core/shell.html` line 887), so in a topic with 4 concepts it cannot return. With PK's real topic `bolus1` (4 concepts) that check failed, and `output_test.js` and `checks_test.js` failed with it. The CI course leaves out the 2 second wordings for that reason; no question was changed.

### Coordinator-verified re-run at `45cc0ae` (2026-11-02, core `c9fde5b`, template `cbac5bd`)
Folder `evidence/module-pages/coordinator/module-pages-45cc0ae/` on `evidence/module-pages` (`3f2fca1`).

| Check | Exit | Result |
|---|---|---|
| `ci/oncourse.js` on a fresh template course, then `build.py` | 0, 0 | built |
| Module test, 3 runs | 0, 0, 0 | 30 PASS each (3 skipped: In parts, worksheets-ink and concept-statuses not on) |
| `run_checks.sh` on the module's own course | 0 | 26 PASS, 0 FAIL, 1 NOT RUN (`cite_check.py`, no PDFs), 1 REPORT |
| No-module template course and Medicinal-chemistry (full clone `f1f5ee5`) | 0, 0 | cited from `evidence/baseline` `main-98e7b5b/` (same trees): 24 PASS / 1 NOT RUN / 1 REPORT and 23 PASS / 2 NOT RUN / 1 REPORT |

Not re-run by the coordinator: the run with worksheets-ink and concept-statuses on (agent-run, PASS 42) and the mutation runs. The combination run with every module on is still to be repeated.

### Coordinator-verified (re-run by the coordinator session at `c9492c8`, before `45cc0ae`; kept apart from the agent's results above)
- On commit `c9492c844e8aed4ef8c57e2dfcff2850af59f25b`, I used the module's own `ci/oncourse.js` to switch it on in a fresh template course, with chained-problem-sets also on. The module test ran 3 times: PASS, 32 checks each run (4 skipped). Every exit code was 0 (the oncourse script, the build and all 3 test runs).
- The agent's 35 and 27 come from other courses: 35 from its own PK Module 2 data course, 27 from the CI-script course without chained-problem-sets.
- Logs and exit codes: branch `evidence/module-pages`, folder `coordinator/module-pages-c9492c8` (commit `0cb6c4f`).
- Not re-run by the coordinator: `run_checks.sh` on the module-on course, the combination with worksheets-ink and concept-statuses, and the mutation runs. These are agent-run only.
- Baseline (template course with no features; Medicinal-chemistry): the coordinator's own runs on `evidence/baseline` have exactly this branch's inputs (core `daac6e2`, template `cbac5bd`, Medicinal-chemistry `f1f5ee5`). Results: 24 PASS, 0 FAIL, 1 NOT RUN, 1 REPORT; and 22 PASS, 0 FAIL, 3 NOT RUN, 1 REPORT.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01LVkWFDVVDwgsL5WF7yWqcV
