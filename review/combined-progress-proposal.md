# Combining progress from two devices: proposal

Status: a proposal for Louis (2026-11-02). Nothing in it is built. Louis asked for it
when he chose the first import rules: "Prepare a separate proposal explaining how
combined progress across devices would work, including duplicate handling and
rebuilding schedules. Don't implement that redesign yet."

## The problem

Each place a drill is opened keeps its own progress. Storage does not sync between a
phone and a laptop (the drill's own Settings text, `core/views.js`), and on an iPhone or
iPad a Home Screen copy keeps its own storage, separate from Safari's (BDK `CLAUDE.md`,
WebKit bug 181849). Under the import rules built in the import-safeguards pull request,
two records are never mixed. When the file and this device each have answers the other
lacks, the file goes into a new profile of its own. So the answers given in two places
cannot yet be studied as one record.

## Why two records cannot simply be added together

The progress record (`core/shell.html`, `BLANK`) holds:

- `answers`: the most recent answers, each `{qid, concept, result, at, qn, picked, ms}`
  plus a cleared check where there was one. Only the last 4,000 are kept (`ANSWERS_MAX`,
  applied in `record()`).
- `qn`: the device's own count of questions answered, which starts at 1 on each device.
- `concepts`: for each concept, its counts, streak, review box, `dueAt`, `dueQ`, `lastQ`,
  the questions asked and when each was last shown, and the check after an "I was sure of
  that" miss.
- `fsrsQ` / `fsrsC`: the FSRS-7 cards. `fsFromHistory()` rebuilds them by replaying the
  answers kept, oldest first, only when those answers are the whole history (the first
  one is answer 1). Otherwise the questions start as new.
- `arms` and `settings` (the pace, "Ask everything", the equation drill's choice).

A concept's box, streak and due date come from its answers taken one after another.
"Not sure", "I guessed" and "I was sure of that" each change a step (`record`,
`markShaky`, `markGuessed`, `markSure`). Two devices' concept records therefore cannot
be summed, and choosing one of them is no better:
- summing counts the same concept's history twice, in a different order;
- choosing one drops the other device's answers.

`qn` and `dueQ` are counted per device, so the two devices' numbers overlap.

The answer history (`<ns>:log:<profile>`) keeps up to 20,000 entries (`LOG_MAX`). Each
entry holds the time to the second, a hashed question code, the result, the mode and
the confidence. Import already merges it without duplicates (`mergeLog`).

## How a combined record would be built

1. **One list of answers.** Put both sides' answers together and drop duplicates. Two
   answers are the same answer when their question id and their time (to the
   millisecond, `at`) are equal, the rule Import uses now. Importing the same file again
   then adds nothing.
2. **One counter.** Sort the list by time and number it again from 1, so `qn`, `dueQ`
   and each concept's `lastQ` and `last` all come from one sequence.
3. **Replay.** Start from an empty record and apply every answer in time order, through
   the same scheduler steps a live answer takes. Each step uses the answer's own time in
   place of "now", and applies the answer's confidence mark where the live page applies
   it. The concept boxes, streaks, due dates, checks and FSRS-7 cards then come out as if
   all the answers had been given on one device.
4. **What is not replayed.**
   - The pace and "Ask everything" come with the record whose answers are newest, because
     they set those due dates.
   - This device keeps its own equation-drill choice.
   - A concept's comparison arm is set by a hash of the concept and the course's storage
     name (`armOf`), so both devices already give the same arm.
5. **Show, then save.** Before saving, the page shows both sides' counts and date ranges
   and the combined result. It keeps the record it replaces as the backup, as Import does
   now, and changes nothing if any step fails.

## What it needs before it can be built

- **A scheduler that can replay.** `record()` reads the clock (`Date.now()`) and writes
  the record directly. Its steps would take the answer's time as an argument, so that the
  same code serves a live answer and a replay. A test would compare a live run with a
  replay of the same answers and require identical records.
- **A complete answer list.** Replay needs every answer from the first, and the progress
  keeps 4,000. There are two ways to provide it, each with a cost, and the choice is
  Louis's:
  - the progress keeps every answer, which uses more storage (BDK's move assessment §3
    measured 2,481,498 characters stored after 8,000 answers with short question ids);
  - the replay reads the answer history instead, which keeps 20,000 entries but stores a
    hashed question code and the time only to the second.
- **Answers older than either side keeps** cannot be replayed. The combined record says
  from which date its schedule is rebuilt; earlier answers count only in the totals.
- **Tests:**
  - the same answers, given on one device or on two devices and then combined, give the
    same record;
  - importing twice changes nothing;
  - a file of another course, or a malformed file, changes nothing;
  - a refused save leaves the old record.

## The pull requests it would take

1. The scheduler that can replay (core), with the live-against-replay test.
2. A complete answer list: a change to the saved format, with a converter for existing
   records.
3. The combine step.
4. The Import screen that offers it.

None of them changes the import safeguards. The separate profile stays as the fallback
whenever a record cannot be replayed.
