# Proposal: three signals about one concept, before any course switches on concept-statuses

Written 2026-11-02 by the "Kit feature porter" session at Louis's request: before
`concept-statuses` (pull request #19) is switched on in a course, recommend how the student tells
its status apart from the scheduler's mastery count and from the FSRS due state. This document
changes nothing. Part 3 is a core change that would need its own pull request and Louis's yes.

## 1. What each signal is today (read from the code at `origin/main` `ac5c644`, and from #19 at `61eb52f`)

| Signal | Where it comes from | What makes it "mastered" or "due" | Where the student sees it |
|---|---|---|---|
| Scheduler mastery | `DB.concepts[c].box`, kept by `record()` in `core/shell.html` | a correct answer moves the concept up one review step (box), a guess or a miss sets it to 0, and "Not sure" on a correct answer takes the step back (`markShaky`). Mastered = box 3 or higher (`MASTER_BOX = 3`, `core/shell.html` line 1068). | "N of M concepts mastered" on Weak spots; the same count per topic on Topics; "now mastered" or "still in review" under each missed question |
| Scheduler due state | concept model: the box and the pace's steps (`PACES`, questions on Exam cram, days on Weekly or Semester). `fsrs` and `concept-fsrs`: the ts-fsrs 6.0.0 card per question or per concept. | what the scheduler serves next | not listed anywhere; it shows only as which question comes next |
| concept-statuses status (#19) | the answer log `DB.answers`, read on each draw of Weak spots | Mastered = 3 or more solid answers on 2 or more different questions in 2 or more sessions, with no miss in the last 3. "Not sure" and a guess count as misses. Statuses: Unfamiliar, Struggling, Improving, Mastered, Returning, Learning. | the new Concepts section on Weak spots, with the counts behind each status |
| concept-statuses due list (#19) | its own spaced check from the answer log, at the pace in Settings, and only when the core's record for the concept is also due | listed as "Due for spaced review" | the same section |

The core keeps the box under every scheduler setting (`core/shell.html` `record()`: "the box above
is still kept: Weak spots and mastery read it"), so the mastery count is shown even when FSRS
decides what comes next.

## 2. Where the signals disagree, with the student-visible result

1. **One correct answer in a new session after two misses.** The box goes 0 → 1, so the scheduler
   shows "still in review". The module shows Improving only after the last 2 answers are solid.
   Both are accurate, but nothing on the page says they measure different things.
2. **Three correct answers to the same question in one sitting.** The box reaches 3, so the
   top of Weak spots counts the concept as mastered. The module needs 2 different questions in
   2 sessions, so it shows Learning. The student sees "mastered" in one place and "Learning" a few
   lines lower. This is the main conflict.
3. **"Not sure" on a correct answer.** The box is net unchanged. The module counts a miss, which
   can move the concept to Struggling.
4. **Under `fsrs` or `concept-fsrs`.** The module's "Due for spaced review" list is worked out from
   the pace steps. The questions served next come from the FSRS cards, so a concept can be listed
   as due and not be asked, or be asked without being listed.
5. **Long use.** `record()` keeps the last 4000 answers (`DB.answers.splice`). The box keeps the
   whole history. After 4000 answers the module reads only the recent log, so its counts can
   undercount older evidence. Pharmacokinetics' bank has 829 questions, so one pass of
   everything takes 829 answers.

## 3. Recommendation

**Before a course switches concept-statuses on.** These are changes to the module, in #19 or a later
version of it, with no core change:

- **A. Different words for different measures.**
  - The module's top status becomes **"Secure"**, with the subtitle "from your answers: 3 solid
    answers on 2 questions in 2 sessions".
  - The module states once, at the top of its section: "The count of mastered concepts above
    comes from the review schedule. The statuses below come from your answers."
  - The core's own word "mastered" stays as it is.
  - Today #19 says the two counts can differ only inside a closed fold, "What each status means",
    which the student has to open.
- **B. Under FSRS, no second due list.**
  - When `SCHED.model` is `fsrs` or `concept-fsrs`, the module hides its "Due for spaced review"
    list.
  - In its place it says: "In this course, FSRS decides when a concept comes back."
  - The statuses stay, because they describe answers, not scheduling.
- **C. Show the evidence gap after 4000 answers.** When the log has reached 4000 answers, the
  section says its statuses are based on the most recent 4000.
- **D. A test of each.** Add checks to #19's `test.js` for case 2 (box 3 with one question in one
  session: the page shows "Secure" nowhere and still carries the line from A) and for case 4
  (under `fsrs`: no due list).

**A core change, for its own pull request (only if Louis wants it):**

- **E. One place to read a concept's scheduling state.** A read-only `conceptState(concept)` in the
  core would return:
  - `box` and `mastered` (box 3 or higher);
  - whether the scheduler treats the concept as due now;
  - under FSRS, the card's due time and predicted recall.

  Modules would then read the scheduler's own due state instead of working out their own. This
  removes case 4 at its cause, and lets any later module show scheduling without copying the
  pace tables.
- **F. Optional: say "review step 3 or higher" next to the core's count.** This makes the core's
  "mastered" self-describing. It changes words every course shows, so it is listed separately.

Louis decides whether A-D go into #19 now, and whether E or F is written as a core pull request.
Nothing above changes `main` until he says yes.
