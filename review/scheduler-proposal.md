# Scheduler proposal (for Louis's review; nothing is built)

Decided by Louis on 2026-11-01: the concept scheduler (medchem and PK) is the
default, and FSRS is an option a course can switch on. He asked for research on
how to improve the scheduler and on whether a combination can serve a course that
needs one. Under brief decision 2, this document is a proposal: nothing below is
built until he approves it.

How it was prepared: a research run on 2026-11-01 searched PubMed, Consensus, Wiley
Scholar Gateway, the Firecrawl research index and the web, and read 69 sources
(its working notes are in `review/research-notes/scheduler-2026-11-01.md`). Every
source cited below was then checked again by the main session against its PubMed
record, publisher record, author PDF or repository file, and each number in this
document comes from that check or from BDK's code. Findings (what a source states)
and implications (this proposal's reasoning) are kept in separate paragraphs.
References follow AMA style, 11th edition.

## 1. What the two schedulers do today

- **Concept scheduler** (medchem `src/shell.html:468-500`; PK `src/shell.html:1508-1523`):
  questions are grouped by idea; a missed idea returns after at least 4 other
  questions, preferably as a different question; boxes advance on a cram clock
  counted in questions (0, 8, 20, 45, 90, 160, 260) and a long-term clock in days
  (0, 1, 3, 7, 14, 30, 60); "I guessed" counts as a miss.
- **FSRS-4.5** (BDK at `c5b5f41`, `assets/app.js:399-421`): one memory model per
  card, default parameters, right/wrong grading, target recall 0.9. Only the first
  answer of each day updates the model; later answers that day are practice
  (`assets/app.js:474-481`). Learn mode asks a new card to be answered right 3 times
  in the session (`assets/app.js:1644`).

## 2. What the evidence supports

**Model-based scheduling.** In a semester-long middle-school language course,
personalized review chosen by a memory model gave a 16.5% gain in retention on a
cumulative exam after the semester over massed study, and a 10.0% gain over a single
spacing schedule used for everyone, with review time matched.<sup>1</sup> In a
laboratory study, an adaptive schedule beat fixed schedules at immediate and delayed
tests, and comparisons with fixed schedules copied from adaptive learners showed the
gain came from adapting to individual items and learners.<sup>2</sup> In another
experiment, up to 40% more items were recalled when practice was scheduled by a
memory model.<sup>3</sup>

**FSRS versions.** The open-spaced-repetition benchmark measures how well each
algorithm predicts recall on Anki review logs; it does not measure learning
outcomes.<sup>4</sup> Without same-day reviews, log loss (lower is better) was 0.3401
for FSRS-7, 0.3460 for FSRS-6 and 0.3625 for FSRS-4.5, against 0.3945 for a
constant-average baseline; AUC (higher is better) was 0.7167, 0.7034 and 0.6891.
With same-day reviews included, FSRS-7's log loss was 0.3206 and FSRS-6's was
0.3842.<sup>4</sup> The ts-fsrs library "defaults to FSRS-7".<sup>5</sup> The research
run found no trial comparing FSRS with a Leitner schedule on learning outcomes.

**A different question for the same idea.** Answering three different application
questions about a concept produced better transfer to new questions two days later
than answering the same question three times, in all four experiments.<sup>6</sup>
Across 192 effect sizes, testing produced transfer (d = 0.40, 95% CI 0.31-0.50),
and transfer was weakest to rearranged stimulus-response items.<sup>7</sup>

**How many correct answers.** The prescription from 533 students was to practise to
3 correct recalls at first and then relearn 3 times at widely spaced
intervals.<sup>8</sup> When relearning follows, the benefit of a higher initial
criterion does not persist across relearning sessions.<sup>9</sup>

**Interval shape and timing.** Expanding and uniform schedules did not differ
significantly (g = 0.034).<sup>10</sup> The best gap between reviews grows with the time
until the test: about 20% to 40% of a 1-week test delay, falling to about 5% to 10%
of a 1-year delay.<sup>11</sup> In pharmacy students learning brand and generic names,
every spaced schedule beat massed practice and study only, and overall performance
fell by almost 50% over 6 weeks (95% on the final exam, 55% on long-term
retention).<sup>12</sup>

**Confidence.** After a multiple-choice test, feedback doubled the retention of
correct answers given with low confidence.<sup>13</sup> High-confidence errors are
corrected well after feedback but are more likely than low-confidence errors to
come back on a test a week later.<sup>14</sup> Letting learners drop cards they thought
they knew had small but consistent negative effects.<sup>15</sup>

**Interleaving.** Across 59 studies, interleaving had an overall effect of g = 0.42,
g = 0.34 for mathematical tasks, and g = −0.39 (blocking better) for
words.<sup>16</sup> In a preregistered cluster randomized trial in 54 seventh-grade
mathematics classes, interleaved practice scored 61% against 38% on an unannounced
test a month later (d = 0.83).<sup>17</sup>

## 3. What this means for the two schedulers

**Concept scheduler (the default).** Its "different question for the same idea"
rule has the most direct support,<sup>6,7</sup> so it stays. Its specific interval
numbers have no direct support, but interval shape matters little,<sup>10</sup> so they
can stay until the drill's own logs say otherwise. What it lacks is the exam date:
it spaces reviews the same way whether the exam is days or weeks, while the
best gap depends on that distance.<sup>11</sup> Counting "I guessed" as a miss fits the
finding that low-confidence correct answers are poorly kept without
feedback;<sup>13</sup> no study tests scheduling them as misses. A confident error has
no later-day check today, although such errors tend to return.<sup>14</sup>

**FSRS (the option).** BDK runs FSRS-4.5, which predicted recall less accurately
than FSRS-6 and FSRS-7 on the benchmark.<sup>4</sup> Because BDK uses only the first
answer of each day, its Cram and Learn practice on quiz day never reaches the model;
FSRS-7 scored better than FSRS-6 when same-day reviews were included,<sup>4</sup> so
upgrading would let that practice count. FSRS schedules each card separately, so a
different wording of the same fact appears only by chance; for BDK's fact list this
matters less, because the quiz asks the practised fact itself, and the two
directions of a fact (brand to generic, generic to brand) behave as separate
items.<sup>7</sup> BDK's Learn mode already matches the 3-correct
prescription.<sup>8</sup>

## 4. Proposed changes (for approval)

**4.1 Concept scheduler, default for every course**
1. **Exam-date spacing.** When a course has exam dates in `course.js`, a concept's
   next review before the exam is placed at a gap of about 20% to 40% of the days
   left when the exam is about a week away, and a smaller fraction when it is
   further away; if a gap must err, it errs longer.<sup>11</sup> The exam never resets
   the long-term schedule, so review continues after it.<sup>12</sup>
2. **Confident-error check.** An answer marked confident and wrong gets an
   immediate retry with a different question and a required check on a later
   day.<sup>14</sup>
3. **Calculation preset.** For calculation courses, no two problems of the same type
   in a row, and earlier types mixed in.<sup>16,17</sup>
4. **No "I know this, skip it" control,** since dropping cards a learner believes
   are known lowers learning.<sup>15</sup>
5. **Answer log for comparison** (fields in §5).

**4.2 FSRS option**
1. Use FSRS-7 instead of FSRS-4.5,<sup>4</sup> through the ts-fsrs library or a port
   of its update rules. Its license and its size inside a single-file build are
   to be checked before it is used.
2. Feed same-day answers to the model, since FSRS-7 predicted recall better than
   FSRS-6 when same-day reviews were included.<sup>4</sup>
3. Fit parameters to the student's own logs once there are enough reviews; until
   then, defaults.
4. Changing BDK's model is a separate decision: BDK's `docs/daily-review.md` lists
   learning-algorithm parameters among the things never changed without Louis.

**4.3 Combination (off by default, for courses that want it)**
A memory model per concept instead of per card, with the concept scheduler's item
rotation: each concept keeps an FSRS state updated by whichever of its questions is
answered; the due concept with the lowest predicted recall goes next; within it,
the question least recently seen is shown. Confidence maps to grades: confident
correct = pass; "Not sure" correct = pass, plus the explanation and a different
question next time;<sup>13</sup> "I guessed" correct = fail; wrong = fail. This
combines two supported parts (model-based timing<sup>1-3</sup> and varied
questions<sup>6</sup>), but FSRS has been benchmarked only per card, so whether a
per-concept state stays accurate is untested. That is why it would ship with the
comparison in §5 switched on.

## 5. How to find out which works for Louis

Every answer would log: course, concept, question id, time, mode (normal, Learn,
Cram, exam), which scheduler picked the question, time since the concept and the
question were last seen, right or wrong, the confidence button, and each model's
predicted recall at that moment. With one student, the workable comparison is
within his own courses: concepts in a course are randomly assigned to the default
scheduler or the combination, review time is matched, and the outcome is accuracy on
questions held back from practice and on exam questions mapped to concepts. The
classroom study likewise compared review strategies with review time matched
within one course.<sup>1</sup>

## 6. Decisions

Approved by Louis on 2026-11-01: 4.1, 4.2 and 4.3, all for the kit, with the
instruction to "make sure that we use the best FSRS option there is". Whether BDK
itself moves from FSRS-4.5 is still a separate decision.

**What "the best FSRS option" means on the benchmark.** The version alone is not
enough. Without same-day reviews, FSRS-7 with its default parameters had log loss
0.3620, about the same as FSRS-4.5 fitted to the user (0.3625). FSRS-7 fitted to the
user's own reviews had 0.3401, and fitted with recency weighting ("older reviews
affect the loss function less and newer reviews affect it more") 0.3370, or 0.3363
with 100 training epochs.<sup>4</sup> The benchmark's recommendation for Anki is FSRS-7
"with both recency weighting and scheduling penalties enabled".<sup>4</sup> So the kit's
FSRS option is FSRS-7, starting on default parameters and switching to parameters
fitted to the student's own answers, with recency weighting, once enough reviews
exist.

**How fitting could run in a static site (to be confirmed in Phase 2).** ts-fsrs is
the scheduler; its optimizer for training parameters from review logs is a separate
package, `@open-spaced-repetition/binding`.<sup>5</sup> fsrs-browser "runs fsrs-rs in the
browser with support for training FSRS parameters" (BSD-3-Clause license).<sup>18</sup>
Not yet confirmed: whether either supports FSRS-7, whether `binding` runs in a
browser, and the ts-fsrs license. If neither runs in the page, a session can fit the
parameters from an exported progress file and write them into `course.js`.

## References

1. Lindsey RV, Shroyer JD, Pashler H, Mozer MC. Improving students' long-term knowledge retention through personalized review. *Psychol Sci*. 2014;25(3):639-647. doi:10.1177/0956797613504302
2. Mettler E, Massey CM, Kellman PJ. A comparison of adaptive and fixed schedules of practice. *J Exp Psychol Gen*. 2016;145(7):897-917. doi:10.1037/xge0000170
3. Eglington LG, Pavlik PI. Optimizing practice scheduling requires quantitative tracking of individual item performance. *NPJ Sci Learn*. 2020;5:15. doi:10.1038/s41539-020-00074-4
4. Open Spaced Repetition. SRS Benchmark. GitHub. Accessed November 1, 2026. https://github.com/open-spaced-repetition/srs-benchmark
5. Open Spaced Repetition. ts-fsrs. GitHub. Accessed November 1, 2026. https://github.com/open-spaced-repetition/ts-fsrs
6. Butler AC, Black-Maier AC, Raley ND, Marsh EJ. Retrieving and applying knowledge to different examples promotes transfer of learning. *J Exp Psychol Appl*. 2017;23(4):433-446. doi:10.1037/xap0000142
7. Pan SC, Rickard TC. Transfer of test-enhanced learning: meta-analytic review and synthesis. *Psychol Bull*. 2018;144(7):710-756. doi:10.1037/bul0000151
8. Rawson KA, Dunlosky J. Optimizing schedules of retrieval practice for durable and efficient learning: how much is enough? *J Exp Psychol Gen*. 2011;140(3):283-302. doi:10.1037/a0023956
9. Vaughn KE, Dunlosky J, Rawson KA. Effects of successive relearning on recall: does relearning override the effects of initial learning criterion? *Mem Cognit*. 2016;44(6):897-909. doi:10.3758/s13421-016-0606-y
10. Latimier A, Peyre H, Ramus F. A meta-analytic review of the benefit of spacing out retrieval practice episodes on retention. *Educ Psychol Rev*. 2021;33(3):959-987. doi:10.1007/s10648-020-09572-8
11. Cepeda NJ, Vul E, Rohrer D, Wixted JT, Pashler H. Spacing effects in learning: a temporal ridgeline of optimal retention. *Psychol Sci*. 2008;19(11):1095-1102. doi:10.1111/j.1467-9280.2008.02209.x
12. Terenyi J, Anksorus H, Persky AM. Impact of spacing of practice on learning brand name and generic drugs. *Am J Pharm Educ*. 2018;82(1):6179. doi:10.5688/ajpe6179
13. Butler AC, Karpicke JD, Roediger HL. Correcting a metacognitive error: feedback increases retention of low-confidence correct responses. *J Exp Psychol Learn Mem Cogn*. 2008;34(4):918-928. doi:10.1037/0278-7393.34.4.918
14. Butler AC, Fazio LK, Marsh EJ. The hypercorrection effect persists over a week, but high-confidence errors return. *Psychon Bull Rev*. 2011;18(6):1238-1244. doi:10.3758/s13423-011-0173-y
15. Kornell N, Bjork RA. Optimising self-regulated study: the benefits—and costs—of dropping flashcards. *Memory*. 2008;16(2):125-136. doi:10.1080/09658210701763899
16. Brunmair M, Richter T. Similarity matters: a meta-analysis of interleaved learning and its moderators. *Psychol Bull*. 2019;145(11):1029-1052. doi:10.1037/bul0000209
17. Rohrer D, Dedrick RF, Hartwig MK, Cheung CN. A randomized controlled trial of interleaved mathematics practice. *J Educ Psychol*. 2020;112(1):40-52. doi:10.1037/edu0000367
18. Open Spaced Repetition. fsrs-browser. GitHub. Accessed November 1, 2026. https://github.com/open-spaced-repetition/fsrs-browser
