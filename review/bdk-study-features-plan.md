# BDK study features across the kit: plan

Louis, 2026-11-08: "Yes, I want reusable BDK study features available across the kit, with the
builder recommending which each course enables. Record this as an improvement candidate. ...
Separate the proposal into manageable parts. Searchable drug lists and existing study tools
come first; new storage, saved lists, scheduling behavior and recommendation-policy changes
retain their approval requirements. This is authorization to record and plan—not blanket
implementation or merge approval."

This file records that plan. It authorizes no implementation and no merge. Each part below
starts only when Louis says yes to that part, and each pull request in it keeps its own
approval rule (`KIT_DESIGN.md` §12.9, `review/porter-policy.md`). The work is outside DEENT's
Exam 1 release (Mon 11/09); nothing in it is a dependency of that release.

## What already exists (checked 2026-11-08, kit main 0eeb13b)

- **`review/bdk-move-plan.md`** lists these features as kit pull requests F1-F18, all with no
  status yet (none started). They were planned as part of moving BDK onto the core.
- **`review/port-queue.md`** items 11-17 (learn-mode, compare-tab, cram-mode, drug-list-tab,
  match-game, flashcards, progress-dashboard) have status `BDK move`, so the nightly porter
  skips them.
- **`FEATURES.md`** already describes, from BDK and with "Used by: BDK" only: `learn-mode`,
  `card-modes` (Test, Written, Flashcards, Scroll), `match-game`, `cram-mode`, `compare-tab`,
  `field-colours`, `back-navigation`; `exam-countdown` is used by Pharmacokinetics (v1) and BDK
  (v2). It has no entry for the drug list.
- **`coordinator/improvements.json`** has `bdk-learn-workflow` (status `discovered`). The new
  entry `bdk-study-features` links it instead of repeating it.
- **Open pull requests and branches:** none implements a BDK study feature. The open port
  branches (`port/*`, kit #11-#26) are Pharmacokinetics and Intro to Pharmacology features.
- **DEENT:** a temporary, DEENT-only Drug List tab for Exam 1 (`druglist_data.js`,
  `druglist_ui.js`, no new progress storage), marked to be replaced by the shared feature. DEENT
  supplies its data shape and acceptance tests after Exam 1.

## What each BDK feature stores (BDK `assets/app.js` at 05c36c3)

| Feature | Stored by BDK | Source line |
|---|---|---|
| Drug list (table per page, search) | view choices only: `listQuiz`, `listView` | 2556-2557 |
| Compare (drugs side by side) | view choices only: `comparePage`, `onlyDiff` | 2361, 2371 |
| Saved personal lists | new keys `lists`, `seededLists` | 662, 675 |
| Cram mode, Last look | each answer (`record`); `lastCram` (missed cards), read back by Last look | 2136; 2162, 2187 |
| Match game | best time per set (`PROGRESS.match`); each wrong pair as a mix-up count (`confuse` → `PROGRESS.confusions`); no answers recorded | 2274; 2263, 609-613 |
| Test, Written, Flashcards, Learn | each answer (`record`): the card's FSRS-4.5 state, the day's counts (`PROGRESS.days`) and the answer log (`logAnswer`) | 568-597 |
| Test, Written, Scroll, Learn and Cram wrong picks (all through `mountQuestion`) | mix-up counts (`explainWrong` → `confuse` → `PROGRESS.confusions`) | 1015, 609-613 |

The FSRS-4.5 formula itself is at lines 471-481. The core records an answer through its own
answer path (its scheduler state, the answer history), not through these BDK keys.

## The parts

**One owner, no new scheduled task.** The kit feature porter (session "Kit feature porter")
builds every part through `review/port-queue.md`, as it does now. Its nightly task takes only
items whose status is `pending`; the items below are entered with status `planned`, so nothing
starts until Louis says yes to a part, which then sets that part's items to `pending`. No
scheduled task is created or changed. Each feature is built once, as a kit module under
`features/`; BDK's move then switches the module on for BDK instead of porting it a
second time, and the F-numbers are kept for cross-reference.

**What stays with BDK's move, not this plan.** The plan places BDK F1-F8 and F14-F16. F9-F13
(glossary v3, source-page viewer, exam countdown v2, back navigation, themes), F17 (page colours)
and F18 (keyboard shortcuts) stay with BDK's move. BDK's own versions of glossary-tap (queue 18)
and of flags, one-page layout and keyboard shortcuts (queue 21) stay with BDK's migration, as
`review/porter-policy.md` §1 says: those queue items use Intro to Pharmacology's implementation
only. They come under this plan only if Louis adds them, so they are not built twice.

**What changes in `review/porter-policy.md` when a part is approved.** Policy §1 orders the
porter's work (Intro to Pharmacology's 18-21, then the remaining Pharmacokinetics items) and
names only those courses' sources. When Louis says yes to a part, the same change adds that
part's items to §1's order and names their source, BDK `assets/app.js` (read-only). Until then
§1 and the "Kit feature port" task are unchanged.

**Part 1: searchable drug lists, first.** No new storage, no scheduling change.
- `drug-list-tab` (queue 14, BDK F16): the course's own table data, a table per page or
  section, search and filter across all of it, hide and reveal of a field for recall. View
  choices last for the visit only; remembering them across visits is storage (part 3).
- `field-colours` (BDK F8): marks the fields a course names as hardest. Display only.
- `compare-tab` (queue 12, BDK F7): drugs side by side with the differences marked. View
  choices for the visit only. BDK's "Learn these N drugs together" button starts Learn, which
  records answers; in part 1 the button is left out, and it comes with `learn-mode` in part 2.
- DEENT's data shape and acceptance tests are the first course test of this part, after Exam 1.

**Part 2: existing study tools, next.** These record answers only through the core's existing
answer path and scheduler, with no new keys and no change to how the scheduler orders or dates
cards. BDK's mix-up counts (`PROGRESS.confusions`) are left out of every part-2 module; keeping
them is new storage (part 3).
- `card-modes` Flashcards and Scroll (queue 16, BDK F3, F2). A Flashcards "Know it" or "Still
  learning" is the student's own grade, recorded through the core's answer path, so it moves the
  scheduler on the student's own say-so (BDK lines 1726-1728).
- `match-game` (queue 15, BDK F5), without the stored best time and without mix-up counts. BDK's
  Match records no answers, so the kit's Match stores nothing.
- `cram-mode` with Last look (queue 13, BDK F6): its answers through the core's answer path;
  without the stored last-cram list, so Last look covers the cards missed in the same visit.
- `learn-mode` (queue 11, BDK F1): rounds within one session; it changes the order inside that
  session only, not the stored schedule. If a review finds that it changes stored scheduling,
  it moves to part 3.

**Part 3: keeps its own approval (Louis's yes for each pull request).**
- New storage: saved personal drug lists (BDK `lists`, `seededLists`); remembered view choices;
  match best times; the last-cram list across visits; mix-up counts (`PROGRESS.confusions`).
- Scheduling behaviour: today's plan with predicted recall and the progress dashboard
  (queue 17, BDK F14, F15); any change to what the scheduler shows or when.
- A new item kind: Written typed recall (BDK F4) needs the core's typed item kind (BDK move
  plan K8).

**Part 4: the builder's recommendation, keeps its own approval.** The builder skill
(`skill/SKILL.md`) recommending which of these modules each course switches on is a
recommendation-policy change. It waits for Louis's decision on
`review/recommendation-proposal.md` (its §6 answers), and is a `SKILL.md` pull request for his
yes. Until then a course switches a module on only by Louis's choice.

## What this plan does not change

No course, site or live drill changes; BDK's site stays as it is until its own move is approved
and its preview tried in Safari on an iPhone or iPad (`review/bdk-move-plan.md`, step 7). BDK's
existing behaviour and tests are kept: each module carries over the tests BDK has for it.
