# Research notes: scheduler evidence (2026-11-01)

Working notes from the research run that informed `review/scheduler-proposal.md`, kept as gathered: the reference format is the run's own, not AMA, and some numbers here were read from abstracts only (marked ABS). The proposal is the checked version; every source it cites was re-checked against its record, and where these notes and the proposal differ, the proposal is current. One correction: Finding 7.13 assumed BDK sends same-day answers to FSRS-4.5; BDK uses only the first answer of each day (`assets/app.js:474-481` at `c5b5f41`).

---

# Research report: learning-science evidence for the exam-drill schedulers

Prepared 2026-11-01. Research only; no code or repository was changed.

Method: Consensus search, PubMed (metadata and PubMed Central full text), Firecrawl research index (paper search and full-text passage retrieval), Wiley Scholar Gateway (full-text passages), Firecrawl web search and page scraping, WebSearch, and direct download of the open-spaced-repetition README and wiki files. Section 5 lists every source with its access level: **FT** = full text read (whole document or targeted passages from the full text), **ABS** = abstract only, **WEB** = web page or repository file read.

Conventions: a **Finding** line reports what a source states. An **Implication** line is my interpretation. Every number comes from a source I read; where I could not check a number, I say so and leave it out.

Design labels used below: **A** = concept scheduler (Leitner boxes per concept, cram clock in questions, long-term clock in days, confidence buttons). **B** = FSRS-4.5 per card with default parameters, pass/fail grading, target retention 0.9, Learn mode, Cram mode. **C** = the combination proposed in Section 3.

---

## 1. Summary

1. Spaced retrieval has strong evidence. The shape of the interval sequence (expanding or equal) makes little difference (meta-analysis g = 0.034). The amount of spacing and the number of separate sessions matter more.
2. Model-based adaptive schedulers beat fixed schedules in one classroom study (Lindsey 2014) and several lab studies. None of them tested FSRS, and I found no learning-outcome trial comparing FSRS with Leitner or SM-2. The FSRS benchmark measures prediction accuracy only.
3. On that benchmark FSRS-4.5, the version design B uses, falls clearly behind FSRS-6 and FSRS-7. When same-day reviews are scored, its log loss is worse than a constant-average baseline. FSRS-7, the newest version, is built to model same-day reviews.
4. Answering different questions on one concept improves transfer to new questions. This supports design A's "different question" rule for lecture courses. It matters less for a fixed fact list.
5. The published successive-relearning prescription is 3 correct recalls at first, then 1 correct recall in each of about 3 later spaced sessions. Design B's Learn mode matches it. For math procedures the benefit is small (d = 0.28).
6. When an exam is days away, massing raises the next quiz score but spacing protects later cumulative exams. The best gap is a shrinking fraction of the time to the test: about 20–40% for a 1-week test.
7. Correct answers given with low confidence are poorly retained without feedback. Confident errors are corrected well at first but tend to return after a week, so a re-check on a later day is supported.
8. Interleaving problem types has large classroom effects in math (RCT d = 0.83), which fits the pharmacokinetics course.
9. Tracking memory per concept while rotating items has support from knowledge-component models, but FSRS-per-concept itself is untested; only this student's logs, with concepts randomly assigned to schedulers, can show which design works for this student.

---

## 2. Findings by question

### Q1. Adaptive (model-based) vs fixed-interval schedules

#### 1a. Prediction accuracy: the open-spaced-repetition benchmark

**Finding 1.1** (srs-benchmark README, WEB, retrieved 2026-11-01). The dataset is "10 thousand users who use Anki" with "~727 million reviews". The evaluation trains on older reviews and tests on newer ones using TimeSeriesSplit. Log loss and RMSE (bins) measure calibration and AUC measures discrimination. The README states: "AUC can be good (high) even if Log Loss and RMSE are poor." The tables report means with 99% confidence intervals.

Selected rows **without same-day reviews** (9,999 collections; 349,923,850 reviews; section "Without same-day reviews"):

| Algorithm | Trainable params | Log loss ↓ | RMSE (bins) ↓ | AUC ↑ |
|---|---|---|---|---|
| RWKV-Instant (neural net) | 2,762,884 | 0.2773 | 0.02502 | 0.8329 |
| LSTM | 8,869 | 0.3332 | 0.05378 | 0.7329 |
| MOVING-AVG (baseline) | 0 | 0.3369 | 0.05915 | 0.7001 |
| FSRS-7 | 34 | 0.3401 | 0.0634 | 0.7167 |
| FSRS-6 | 21 | 0.3460 | 0.0653 | 0.7034 |
| FSRS-5 | 19 | 0.3561 | 0.0742 | 0.7010 |
| FSRS-7, default parameters | 0 | 0.3620 | 0.0910 | 0.7029 |
| FSRS-4.5 | 17 | 0.3625 | 0.0764 | 0.6891 |
| DASH | 9 | 0.3682 | 0.0838 | 0.6311 |
| AVG (constant baseline) | 0 | 0.3945 | 0.1034 | 0.4997 |
| ACT-R | 5 | 0.4033 | 0.1074 | 0.5225 |
| HLR (Duolingo) | 3 | 0.4694 | 0.1275 | 0.6369 |
| Ebisu v2 (Bayesian) | 0 | 0.4989 | 0.1627 | 0.6051 |

Selected rows **with same-day reviews** (10,000 collections; 519,296,315 reviews; section "With same-day reviews"):

| Algorithm | Log loss ↓ | RMSE (bins) ↓ | AUC ↑ |
|---|---|---|---|
| FSRS-7 | 0.3206 | 0.06148 | 0.7475 |
| MOVING-AVG | 0.3301 | 0.0789 | 0.7077 |
| AVG | 0.3816 | 0.1195 | 0.5006 |
| FSRS-6 | 0.3842 | 0.0985 | 0.6830 |
| FSRS-4.5 | 0.4286 | 0.1033 | 0.6821 |
| FSRS-5 | 0.4565 | 0.1175 | 0.6761 |

**Finding 1.2** (same README). SM-2 and Anki's SM-2 do not appear in either result table; SM-2 appears only in a run command. The README says an algorithm that does not beat AVG "cannot be considered good". When same-day reviews are scored, FSRS-4.5, FSRS-5 and FSRS-6 all have worse log loss than AVG, though better RMSE (bins). Per-deck parameters for FSRS-7 ("FSRS-7 deck", log loss 0.3489) did worse than one parameter set per user (0.3401).

**Finding 1.3** (fsrs4anki tutorial, WEB). "RMSE=0.05 means that, on average, FSRS is off by 5% when predicting R." The default parameters "are the median values of 20k sets of parameters", so "half of the new users will find that their retention is lower than desired retention".

**Finding 1.4** (ABC of FSRS wiki, WEB). "With FSRS, users have to do 20–30% fewer reviews than with SM-2 algorithm to achieve the same retention level (2026-02-12 udpate: the figure is based on simulation results)." This claim comes from simulation, not from a learner study.

**Finding 1.5** (Settles & Meeder 2016, FT passages). On historical Duolingo logs (Table 2), half-life regression (HLR) had MAE 0.128 against Leitner's 0.235, but AUC 0.538 against Leitner's 0.542. In a live experiment of HLR against Leitner (Table 4, "daily retention activity", meaning whether students came back to the app), the changes were +0.3 (any activity), +0.3 (lessons) and −7.3 (practice, significant). These are engagement measures, not memory tests.

#### 1b. Learning outcomes from model-based scheduling

**Finding 1.6** (Lindsey, Shroyer, Pashler & Mozer 2014; FT of the author's reprint PDF plus PubMed abstract). The study ran for a semester in an 8th-grade Spanish course: 179 students, 2 excluded for cheating. Within each student, a random one-third of each chapter's items went to each of three schedulers, matched for number of review trials:
- **massed**: kept selecting material from the current chapter;
- **generic spaced**: "selected one previous chapter to review at a spacing deemed to be optimal for a range of students", based on Cepeda et al. 2006/2008 and model simulations;
- **personalized spaced**: a Bayesian model (DASH: difficulty, ability, study history) predicted recall "for each student-KC pair". Its rule "prioritizes for review the item whose expected recall probability is closest to a threshold", with θ = 0.33 identified as best in earlier simulations.

The DASH model was fit on data from the whole population of students. The cumulative exam gave these percent-correct scores (massed / generic / personalized): end of semester 65.2 / 67.8 / 73.3; one month later 52.0 / 55.0 / 60.5. On the end-of-semester exam, personalized beat massed by 12.4% (d = 1.38) and generic by 8.3% (d = 1.05). The abstract, for "a cumulative exam administered after the semester's end", reports a 16.5% boost over massed and 10.0% over generic spaced. On the end-of-chapter quizzes, massed did best: 89.4% against 87.2% (generic) and 88.1% (personalized), "because it provided the largest number of study trials on the quizzed chapter."

**Finding 1.7** (Mettler, Massey & Kellman 2016; FT from PMC). Learners matched highlighted African countries to names. Experiment 1 had 36 learners per condition, and each item appeared 4 times. The fixed schedules were equal spacing (5 trials between presentations) and expanding spacing (1, then 5, then 9 trials). The adaptive schedule (ARTS) used accuracy and response time. At the 1-week delayed posttest, adaptive accuracy was 0.42; the two fixed schedules scored 0.31 and 0.30, with Cohen's d of 0.56 and 0.57 for the comparisons. The abstract states: "No evidence was found for differences between expanding and equal spacing". In Experiment 2, fixed schedules were copied (yoked) from adaptive learners, and the advantage "was primarily due to adaptation to individual items and learners."

**Finding 1.8** (Eglington & Pavlik 2020; FT from PMC). Participants recruited online (Amazon Mechanical Turk) studied 30 Japanese–English word pairs for 22 minutes. Five adaptive conditions practiced whichever item had predicted recall closest to, but below, a threshold (0.40, 0.70, 0.86, 0.94, 0.98). The conventional condition repeated items about every 15 trials within two blocks. "The OET 94 condition led to approximately 40% higher memory retention than conventional scheduling"; thresholds 0.86 and 0.94 beat conventional scheduling and the 0.40 condition. The authors note that model-based scheduling "naturally leads to an expanding schedule."

**Finding 1.9** (Pavlik & Anderson 2008, ABS). An ACT-R-based optimized condition "showed significant benefits with large effect sizes for both improved recall and recall latency" compared with other conditions.

**Finding 1.10** (Whitmer, Johnson & Marraffino 2022, ABS). This was a single-session flashcard study of armored-vehicle identification comparing ARTS, Leitner and Random. There were "no differences between the three conditions in terms of learning efficiency and delayed learning gains". Leitner finished training fastest. "After controlling for in-training measures", Leitner "had the lowest delayed learning gains", and ARTS did not differ from Random.

**Finding 1.11** (Xiong et al. 2015, ABS). In ASSISTments, a personalized adaptive scheduling system for retention tests was compared with traditional fixed schedules across "97 classes in the summer of 2013 and 2014". The personalized group scored higher on long-term retention (p = 0.0002). For students with a medium knowledge level, the effect size was 0.27. This compared different years rather than randomized groups.

**Finding 1.12** (Tabibian et al. 2019, ABS). In a "large-scale natural experiment" on Duolingo data, learners whose review times happened to match the MEMORIZE algorithm "memorize more effectively" than learners following heuristic schedules. This is observational, not randomized.

**Finding 1.13** (Sense et al. 2016, ABS; Sense, van der Velde & van Rijn 2021, ABS). In an ACT-R-based adaptive fact-learning system, each learner's estimated rate of forgetting "is stable over time but not across materials". In a university course, this estimate "predicts overall grades and performance on individual exam questions". That is a correlation, not a comparison of schedulers.

**Finding 1.14** (no direct evidence). In searches of Consensus, Scholar Gateway, the Firecrawl research index and the web, I found no randomized or controlled study comparing FSRS with Leitner or SM-2 on retention or exam results.

**Conflicts.**
- The best recall threshold differs by about a factor of three: Lindsey (from simulations) used 0.33, while Eglington & Pavlik found 0.86–0.94. Eglington & Pavlik count time per trial, since failed trials take longer; Lindsey's schedulers were matched on number of trials. Eglington & Pavlik's study is the direct experimental test of thresholds, so I treat it as more authoritative on threshold choice.
- Whitmer et al. found no adaptive benefit in a single session; Mettler et al. found one. Whitmer's random order may already have produced wide spacing in a large deck, as its authors suggest.

**Implications.**
- **Design A.** Fixed box intervals cannot adapt to how hard a concept is for this student. The yoked comparison in Mettler 2016 indicates that this adaptation is where the adaptive benefit comes from. I found no evidence for the specific intervals 0/8/20/45/90/160/260 questions or 0/1/3/7/14/30/60 days.
- **Design B.** FSRS's advantage is established for predicting Anki flashcard recall, not for learning outcomes. Even with per-user optimized parameters, FSRS-4.5 ranks below FSRS-6 and FSRS-7. Design B uses default parameters, which the benchmark does not report for FSRS-4.5; for FSRS-7, default parameters were clearly worse than optimized ones (RMSE (bins) 0.0910 against 0.0634). Cram and Learn modes generate many same-day reviews, which is the condition where FSRS-4.5 scored worse than AVG on log loss. The displayed "predicted recall on the quiz date" is therefore least reliable in exactly the situation where it is shown.
- **Combination.** Use a memory model to decide when a concept is due, and keep design A's concept tagging and item rotation. Evaluate the result on the student's own logs (Section 4).

---

### Q2. Varied retrieval vs repeating the identical question

**Finding 2.1** (Pan & Rickard 2018 meta-analysis, ABS). The analysis pooled 192 transfer effect sizes from 122 experiments (N = 10,382). Testing produced transfer relative to non-testing re-exposure, d = 0.40 (95% CI 0.31–0.50). Transfer was "greatest across test formats, to application and inference questions, to problems involving medical diagnoses". It was "weakest to rearranged stimulus-response items, to untested materials seen during initial study, and to problems involving worked examples". Three moderators strongly influenced transfer: "response congruency and elaborated retrieval practice, as well as initial test performance". After publication-bias correction, the intercept estimates often showed "no positive transfer when none of the aforementioned moderators are present."

**Finding 2.2** (Butler, Black-Maier, Raley & Marsh 2017, ABS). Learners answered either the same application question three times or three different application questions about a concept. Two days later they took a final test of new application questions. "All four experiments showed that variability during retrieval practice produced superior transfer of knowledge to new examples."

**Finding 2.3** (Butowska-Buczyńska et al. 2024, ABS). Across six vocabulary experiments, varying the context sentences across retrieval cycles "led to better learning ... than constant sentences". The benefit appeared immediately and after 24 hours, and it "[was] larger when retrieval practice was spaced rather than massed". Learners nonetheless judged constant cues as more effective.

**Finding 2.4** (Butler 2010, ABS). Compared with repeated studying, repeated testing improved retention and transfer to "new inferential questions" one week later, both within the same knowledge domain and across domains.

**Finding 2.5** (Pan & Rickard 2017, ABS). For term–definition facts, retrieval practice "consistently yielded at best minimal positive transfer in either direction", that is, from term to definition or definition to term, compared with restudy.

**Finding 2.6** (Price et al. 2024, randomized, ABS). In 26,258 family physicians, repeating 6 questions (the ones answered incorrectly with the highest confidence first) improved learning on the repeated questions at quarter 6: 58.03% against 43.20%, d = 0.62. On rewritten questions at quarter 10 the gain was smaller: 58.33% against 52.39%, d = 0.26. Two repetitions beat one (learning d = 0.43; transfer d = 0.20).

**Finding 2.7** (Yang et al. 2021 classroom meta-analysis, ABS). Over 48,478 students in 222 studies, quizzing raised achievement (g = 0.499). The effect was moderated by "test format consistency" and "material matching", among other factors.

**Gap.** Butler et al. 2017 measured only new questions. I found no study that compared same-question and varied-question practice when the final test repeats the practiced question itself.

**Implications.**
- **Design A** ("preferably a different question on the same concept"). Supported for pharmacology and medicinal chemistry, where exam questions are new wordings and application questions; Findings 2.1, 2.2 and 2.6 point the same way.
- **Basic Drug Knowledge.** The exam asks the practiced fact itself, so identical items are acceptable. Each direction of a fact, such as brand→generic and generic→brand, should be scheduled as its own unit (Finding 2.5, and "rearranged stimulus-response items" in Finding 2.1).
- **Pharmacokinetics.** Numeric variants of a problem type are "different examples" in the sense of Finding 2.2.
- **Design B** schedules each card separately, so varied retrieval happens only by chance.

---

### Q3. Successive relearning: evidence and criterion levels

**Finding 3.1** (Rawson & Dunlosky 2011, ABS). In 3 experiments with 533 students, items were practiced until recalled correctly 1 to 4 times in the first session. They were then relearned to 1 correct recall in 1–5 later sessions, and retention was tested 1–4 months afterwards. The effects of initial criterion and relearning were "subadditive". Relearning "had pronounced effects on long-term retention with a relatively minimal cost". The prescription: "practice recalling concepts to an initial criterion of 3 correct recalls and then to relearn them 3 times at widely spaced intervals." I did not read the specific relearning intervals; only the abstract was available.

**Finding 3.2** (Vaughn, Dunlosky & Rawson 2016, ABS). Initial criteria ran from 1 to 7 correct recalls, followed by relearning to 1 correct "at one-week intervals across four or five" sessions. "The substantial benefits of learning to a higher initial criterion during the first session do not persist across relearning sessions". The authors conclude that extra initial practice "is not efficient" when relearning will follow.

**Finding 3.3** (Rawson & Dunlosky 2013, published online 2012, ABS). With initial criteria of 1 or 3 and 2–3 relearning sessions, the benefits of spacing during initial learning "were substantial prior to relearning but were significantly attenuated after relearning".

**Finding 3.4** (Rawson et al. 2018, ABS). Successive relearning beat single-session learning by ds = 1.52 to 4.19.

**Finding 3.5** (classroom studies, ABS).
- Rawson, Dunlosky & Sciartelli 2013 reported "meaningful improvements in course exam performance and on long-term retention tests". I did not verify any numbers from the full text.
- Janes et al. 2020, in a biopsychology course with a criterion of "at least one correct retrieval attempt" per session and stacks of 4–6 items: "at least 10%" improvement (ds 0.54–1.10), with an average of 13% in the General Discussion.
- Higham et al. 2022, in introductory psychology: three sessions after each weekly lecture, "each separated by two days". Correct items were dropped and incorrect ones repeated "up to 2 more times". End-of-semester recall was better than with time-matched restudy.

**Finding 3.6** (Rawson, Dunlosky & Janes 2020, ABS; boundary condition). 431 students learned four types of probability problems. Successive relearning (1 correct per type in each of 3 sessions) was compared with 3 correct per type in a single session. On novel problems one week later, the advantage was "only small": pooled d = 0.28 (95% CI 0.08–0.49). "Correctly solving a problem did not significantly boost the likelihood of subsequent success."

**Finding 3.7** (Sando & Feng 2018, ABS; pharmacy). A spaced-education game for the Top 200 drugs sent 2 questions every 2 days and re-sent incorrect ones after 7 days; 2 correct answers retired a question. It "did not significantly affect top 200 drug examination performance or retention".

**Finding 3.8** (Kornell & Bjork 2008, ABS). Letting learners drop flashcards they thought they knew "had small but consistently negative effects on learning."

**Conflict.** Rawson & Dunlosky 2011 recommend 3 initial correct recalls. Vaughn et al. 2016 found that the benefit of a higher initial criterion disappears after 4–5 weekly relearning sessions. The two are consistent if the initial criterion matters less the more relearning sessions follow.

**Implications.**
- **Design B's Learn mode** (new card right 3 times, known card right once) matches the 2011 prescription.
- **Design A's mastery rule** ("correct on separate occasions", box ≥ 3) matches the "relearn 3 times" part.
- **When the exam is within a few days**, only 1–2 relearning sessions fit before it, so the 3-correct initial criterion is worth its cost (Finding 3.1). When the exam is weeks away, 1–2 initial correct recalls followed by more spaced sessions is more efficient (Findings 3.2–3.3).
- **Pharmacokinetics.** A correct solve is a weak signal of later success (Finding 3.6). Mastery rules based on counting correct answers should not be trusted there without checking the logs.

---

### Q4. Interval shape, timing relative to the test, within-session spacing, exams days away

**Expanding vs uniform**

**Finding 4.1** (Latimier, Peyre & Ramus 2021 meta-analysis, FT). Across 29 studies, spaced retrieval beat massed retrieval. The abstract gives g = 0.74; the results section of the author PDF gives g = 1.01 (95% CI 0.68–1.34) for the same 39 effect sizes; the PDF says "corrected publication 2021". Expanding against uniform schedules gave g = 0.034 (95% CI −0.10 to 0.17; 54 effect sizes). The moderator "4 exposures vs. more than 4" gave β = 0.22 (p = 0.09), suggesting "more than four exposures might be needed to differentiate expanding from uniform schedules."

**Finding 4.2** (primary studies, ABS).
- Karpicke & Roediger 2007: expanding practice gave short-term benefits at 10 minutes, but "equally spaced retrieval produced superior retention 2 days later". Delaying the first test improved long-term retention regardless of schedule.
- Karpicke & Bauernschmidt 2011: long absolute spacing gave "a 200% improvement in long-term retention relative to repeated retrieval with no spacing", with no advantage for any relative schedule (expanding, equal or contracting).
- Karpicke & Roediger 2010, with text materials: no difference between expanding and equal schedules.
- Kang et al. 2014, foreign vocabulary over 4 weeks: final recall after 8 weeks was equivalent, but expanding "yielded much higher average recallability over the whole training period".
- Kim & Webb 2022 meta-analysis of second-language learning: "equal and expanding spacing were statistically equivalent".

**Finding 4.3** (health-professions and pharmacy, ABS).
- Dobson 2012, physiology, 250 students: expanding (days 1, 6, 16) scored 45.80 on a day-29 test, against 36.15 and 32.31 for the two uniform schedules.
- Terenyi, Anksorus & Persky 2018, brand and generic names of 100 drugs: a contracting schedule gave 67% long-term retention, against 58% (expanding), 59% (equal), 50% (massed) and 46% (study only). "Overall performance decreased by almost 50% (final exam 95%, long-term retention 55%) over a 6-week period."
- Terenyi et al. 2019, Top 200 drugs: retention was best when quiz 2 came closer to quiz 1 and further from the final, an expanding pattern. Giving the first 3 letters as a hint lowered long-term retention.

**Conflict.** The pharmacy studies disagree with each other: contracting was best in 2018 and expanding in 2019. Both disagree with the null result of the meta-analysis. I treat the meta-analysis (Finding 4.1) as more authoritative on schedule shape. Both pharmacy studies agree that spaced quizzes beat massed practice or study only.

**Gap relative to time until the test**

**Finding 4.4** (Cepeda et al. 2008, FT). More than 1,350 people learned 32 trivia facts to a criterion of one correct answer each, reviewed them once after a gap of up to 3.5 months, and were tested after a retention interval (RI) of up to 1 year. For RIs of 7, 35, 70 and 350 days, the best recall gaps among those tested were 1, 11, 21 and 21 days. Interpolated optima were about 3, 8, 12 and 27 days, which is 43%, 23%, 17% and 8% of the RI. Abstract: "the optimal gap declined from about 20 to 40% of a 1-week test delay to about 5 to 10% of a 1-year test delay". The costs of a gap longer than optimal "are much smaller than the costs of using too short a gap". Compared with a zero-day gap, the optimal gap gave a 64% increase in final recall (d = 1.1). The study had only two sessions: initial learning and one review.

**Finding 4.5** (Cepeda et al. 2006 meta-analysis, ABS). Across 839 assessments in 317 experiments, "the ISI producing maximal retention increased as retention interval increased."

**Within-session spacing**

**Finding 4.6** (Kornell 2009, ABS). Studying one large stack of flashcards (wider within-session spacing) beat four small stacks. "Spacing was also more effective than cramming—that is, massing study on the last day before the test". Spacing won for 90% of participants, yet 72% believed massing had been more effective.

**Finding 4.7.** Absolute spacing within a session matters (Finding 4.2, Karpicke & Bauernschmidt), and delaying the first test helps (Karpicke & Roediger 2007). In the within-session study of Finding 1.7, the fixed spacings were 5 trials, or 1, 5 and 9 trials.

**Exam only days away**

**Finding 4.8** (Rohrer & Taylor 2006, ABS). College students solved 10 math problems either in one session or split across two sessions a week apart. "The benefit of distributed practise was nil among students who were tested 1 week later but extremely large among students tested 4 weeks later." Doing 9 problems instead of 3 in one session (overlearning) "had no effect on test scores 1 or 4 weeks later".

**Finding 4.9** (Lindsey et al. 2014, FT; Finding 1.6). The massed scheduler gave the best end-of-chapter quiz scores and the worst cumulative-exam scores.

**Finding 4.10** (Emeny, Hartwig & Rohrer 2021, ABS and FT passage). In Year 7 math, three sessions a week apart beat one session on a test a month later. Score predictions were "grossly overconfident after massed practice". The discussion notes that "the mathematics spacing effect can vanish when the test delay is brief."

**Finding 4.11** (Murray et al. 2025 meta-analysis of mathematics, ABS). Spaced practice beat massed practice with g = 0.28 (27 studies); the effect was g = 0.24 for course-embedded studies. Testing against restudy gave g = 0.18 with a CI crossing zero.

**Implications.**
- **Design A's two clocks.** The evidence supports spacing in both questions and days. It does not support any particular expanding sequence. The "at least 4 other questions" minimum is consistent with Finding 4.2 (delaying the first test), and longer within-session gaps are better as long as retrieval still succeeds.
- **Exam date.** The ridgeline (Finding 4.4) gives a usable rule: spacing should be a fraction of the time the material must be retained after the last review. That is about 20–40% for a 1-week horizon and less for longer horizons. If a gap must err, a longer one is less costly than a shorter one.
- **Exams days away.** A final massed review raises the next test score (Findings 4.8 and 4.9), but courses with cumulative finals, and later licensure, need the spaced schedule to continue after the quiz (Findings 4.3, 4.8 and 4.9). Cram mode should therefore add reviews, not replace or reset the long-term schedule.

---

### Q5. Confidence judgments

**Finding 5.1** (Butler, Karpicke & Roediger 2008, ABS). After a multiple-choice test with confidence ratings, feedback "doubled the retention of correct low-confidence responses, relative to providing no feedback."

**Finding 5.2** (Butterfield & Metcalfe 2001, ABS). "Highly confident errors were the most likely to be corrected in a subsequent retest" (the hypercorrection effect). The effect has been reported in a college classroom (Carpenter et al. 2018, ABS).

**Finding 5.3** (Butler, Fazio & Marsh 2011, ABS). The hypercorrection effect held on immediate and 1-week tests, "but error correction decreased on the delayed test". "High-confidence errors were more likely than low-confidence errors to be reproduced on the delayed test."

**Finding 5.4** (Metcalfe et al. 2014, ABS). "Testing immediately after corrective feedback not only greatly enhanced memory for the correct answers but also blocked the return of the errors."

**Finding 5.5** (Sitzman, Rhodes & Tauber 2014, ABS). "Prior knowledge likely plays a primary role in error correction, while confidence may play a small role or merely serve as a proxy for prior knowledge."

**Finding 5.6** (Price et al. 2024, ABS). Physicians' "incorrectly but confidently answered questions were prioritized for repetition". The study found "no meaningful differences in learning or transfer between repetition strategy chosen". In a companion report (Wang et al. 2025, ABS), confidence gains were smaller for clone questions than for repeated questions.

**Finding 5.7** (Anki manual, WEB). "When you press 'Hard', FSRS assumes you have recalled the information correctly (though with hesitation and a lot of mental effort)." The fsrs4anki tutorial (WEB, FAQ A8) adds that FSRS "is a little more accurate for people who mostly use 'Again' and 'Good'".

**Finding 5.8** (Lindsey et al. 2014, FT). The "I don't know" button was "recorded as an incorrect response and the student received corrective feedback as usual."

**Gap.** I found no study comparing scheduling a correct guess as a failure against scheduling it as a success.

**Implications.**
- **Design A** ("I guessed" counts as a miss). Consistent with Finding 5.1, which shows low-confidence correct answers are weakly retained, and with the practice in Finding 5.8. The direct evidence concerns feedback, not scheduling.
- **Design B** (pass/fail only). A lucky guess on a multiple-choice question counts as a pass and raises stability. This makes the model's predicted recall too high for exactly the items the student does not know.
- **Hypercorrection.** A confident error should get feedback, a retest in the same session (Finding 5.4) and another check on a later day (Finding 5.3).
- **Self-judgment.** Confidence should not be used to drop items from practice (Finding 3.8).

---

### Q6. Interleaving, especially for problem solving and calculation

**Finding 6.1** (Brunmair & Richter 2019 meta-analysis, ABS). Across 59 studies, interleaving had an overall effect of g = 0.42. By material: paintings g = 0.67; mathematical tasks g = 0.34; expository texts nonsignificant; words g = −0.39, an advantage for blocking. Effects were stronger "for learning material more similar between categories, for learning material less similar within categories, and for more complex learning material."

**Finding 6.2** (math classroom studies, ABS).
- Rohrer, Dedrick & Burgess 2014: 72% against 38% (d = 1.05) on an unannounced test 2 weeks later, even when problem kinds were "superficially dissimilar".
- Rohrer, Dedrick & Stershic 2015: d = 0.42 at 1 day and d = 0.79 at 30 days.
- Rohrer, Dedrick, Hartwig & Cheung 2020, a preregistered cluster RCT in 54 classes: 61% against 38% one month later, d = 0.83.

**Finding 6.3** (Foster et al. 2019, ABS). For volume calculations, interleaving with unrelated problems helped as much as standard interleaving, a finding "that supports the distributed-practice hypothesis". This means part of the interleaving benefit comes from spacing.

**Finding 6.4** (Samani & Pan 2021, ABS). In university physics homework over 8 weeks, interleaved problems gave "median improvements of 50% on test 1 and 125% on test 2". Students rated interleaving as harder and "incorrectly believed that they learned less from it".

**Finding 6.5** (Sana & Yan 2022, ABS). On weekly science quizzes in grades 9–12, concepts quizzed in interleaved order scored 63% a month later. Concepts from blocked quizzes scored 54% (d = 0.35 against interleaved), and unquizzed concepts 47%.

**Implications.**
- **Pharmacokinetics.** Interleave problem types: never two problems of the same type in a row, and mix in earlier topics. Each problem type is a concept; numeric variants are its items. Combine this with spacing across days and a cap on problems per type per session (Finding 4.8, no benefit from overlearning).
- **Pharmacology and medicinal chemistry.** Interleaving similar, easily confused drug classes or mechanisms fits the "similar between categories" moderator.
- **Basic Drug Knowledge** (word-like name pairs). Finding 6.1 shows blocking can be better for words. I did not check whether "words" in that meta-analysis means name–fact pairs like brand↔generic, so the ordering of this list should be left as it is unless logs show a difference.

---

### Q7. Combining designs; exam-date targeting; current FSRS version; same-day reviews

**Memory model at the concept level, different item each time**

**Finding 7.1** (Lindsey et al. 2014, FT). The scheduler cast knowledge as "collections of primitive knowledge components or KCs", and "dash predicts the probability of successful recall for each student-KC pair". The model combines a student ability term, a difficulty term and windowed counts of past study and successes. DAS3H (Finding 7.2) describes Lindsey's KCs as clusters of "similar words together (e.g. all conjugations of a verb)".

**Finding 7.2** (Choffin et al. 2019, DAS3H, FT passages, arXiv). DAS3H adds item difficulty and lets the effect of practice and forgetting differ per skill, using time windows of {1/24, 1, 7, 30, ∞} days. On the Algebra 2005–2006 dataset, its AUC was 0.826, against 0.773–0.775 for DASH and 0.744 for PFA. The authors propose, without testing it with students, "a two-step recommendation strategy": first select "the skill k whose recall probability is closest to a given threshold", then select "an item among the pool of items that involve this skill". On ASSISTments 2012–2013, DASH fit per item and DASH fit per KC had nearly equal AUC (0.703 and 0.702).

**Finding 7.3** (Anki manual, WEB). Anki can "bury" siblings: other cards of the same note are "delayed until the next day". This is established practice for avoiding two related items in one day. The benchmark's RWKV models also take "sibling card information" as an input (README, WEB).

**Finding 7.4** (Khajah, Lindsey & Mozer 2014, ABS). Simulations with ACT-R and MCM, with a fixed amount of review time each week, found two near-optimal heuristics: "(a) review the material from μ-weeks back, and (b) review material whose predicted memory strength is closest to a particular threshold."

**Scheduling toward a known exam date**

**Finding 7.5** (fsrs4anki tutorial, WEB). For an upcoming exam, the tutorial recommends "the Advance function of the Helper add-on", because it "doesn't skew the grading history of the cards". For choosing desired retention: "If you are preparing for an exam that is 12 months away, set 'Days to simulate' to 365."

**Finding 7.6** (no direct evidence). I found no learner study that tested scheduling toward a target retention on a known date against a standard scheduler. Lindsey's generic scheduler (Finding 1.6) used ridgeline-based spacing, and Khajah et al. (Finding 7.4) simulated end-of-semester retention. Tabibian et al. optimize recall against a review cost with no fixed date (ABS).

**Current FSRS version and differences from FSRS-4.5**

**Finding 7.7** (FSRS algorithm wiki, WEB, now at awesome-fsrs/wiki/The-Algorithm).
- **FSRS-4.5** has 17 parameters. Its forgetting curve is R(t,S) = (1 + FACTOR·t/S)^DECAY with DECAY = −0.5 and FACTOR = 19/81, and it "drops sharply before S and flatly after S".
- **FSRS-5** has 19 parameters. It adds a same-day stability update, S′ = S·e^{w17·(G−3+w18)}, an exponential initial difficulty, linear damping of difficulty changes, and mean reversion toward D0(4).
- **FSRS-6** has 21 parameters. It changes the same-day formula to S′ = S·e^{w17·(G−3+w18)}·S^{−w19}, so "S increases faster when it's small and slower when it's large". It also makes the curve's decay trainable through w20, with factor = 0.9^(−1/w20) − 1.

**Finding 7.8** (srs-benchmark README, WEB). FSRS-7 is "the newest version". "It is the only version that can give realistic predictions of probability of recall for same-day reviews". It works with fractional interval lengths, and its forgetting curve "has 8 optimizable parameters". The benchmark table lists 34 trainable parameters. "In Anki, FSRS-7 should be shipped with both recency weighting and scheduling penalties enabled."

**Finding 7.9** (ts-fsrs README and migration guide, WEB; npm "latest" = 6.0.0). `DefaultScheduler()` in ts-fsrs v6 "defaults to FSRS-7; the library version and the FSRS model version are independent". The migration guide says to use FSRS-7's "own 34 default weights", never reuse FSRS-6 weights, and set `fractionalDays: true`. It refers to an "intrinsic FSRS-7 fast trace" and a `stabilityFast` state, and gives default steps of `learningSteps: ['1m', '10m']` and `relearningSteps: ['10m']`.

**Conflict on version status.** Expertium's benchmark page calls FSRS-6 "the newest version" in one place and says "FSRS-7 is the final version" in another. I could not confirm from an official Anki changelog whether the current stable Anki ships FSRS-7. A web-search summary suggested it had not, and I treat that as unverified. For a web app, the authoritative fact is that the ts-fsrs library (Finding 7.9) defaults to FSRS-7.

**What the FSRS authors say about short-term (same-day) reviews**

**Finding 7.10** (Jarrett Ye, "The History of FSRS for Anki", LessWrong, 14 Jul 2025, WEB).
- "When users review a new card multiple times on the day it's first learned, the sequence of ratings significantly influences the card's initial stability."
- "The working mechanisms of short-term and long-term memory are quite different. Ultimately, I adopted a simplified approach: using short-term reviews to refine predictions related to long-term memory."
- FSRS-5 cut "prediction error by ~4%" relative to FSRS-4.5, and recency weighting cut it by "around 4.5%".

**Finding 7.11** (Expertium, "Benchmark of Spaced Repetition Algorithms", WEB). FSRS-5 "takes into account same-day reviews, unlike all previous versions; though the improvement in accuracy is small", and "FSRS doesn't have a short-term memory model". The second statement predates FSRS-7's fast trace, as I read the page.

**Finding 7.12** (Anki manual and fsrs4anki tutorial, WEB).
- Learning and relearning steps should be "shorter than 1d and can be completed on the same day".
- "A single reasonable learning step can be 10m, 15m, 20m or 30m".
- "Multiple short (re)learning steps ... is also discouraged", though "adding more intraday learning steps (such as 2h or 4h) may be helpful" if young-card retention is low.
- Tutorial FAQ A5 says "FSRS only takes into account one review per day", and only the first review of a day is used by the optimizer. This conflicts with Findings 7.7–7.8. I treat the benchmark README and algorithm wiki as more current.

**Finding 7.13** (my derivation from the FSRS v4/4.5 stability formula on the wiki). In FSRS-4.5, the stability increase after a success contains the factor (e^{w10·(1−R)} − 1). At t = 0, R = 1, so that factor is 0 and S is unchanged. A failure at t = 0 applies the post-lapse formula, which lowers S. So under FSRS-4.5, same-day successes in Learn or Cram mode add nothing to S and same-day failures reduce it. That holds only if the app feeds same-day reviews into the FSRS-4.5 update at all; I have not seen the app code.

**Implications.**
- Design B should move to the model that ts-fsrs ships by default (FSRS-7), or at least to FSRS-6. Learn and Cram reviews would then inform the model, which matters for a student who studies the night before and the day of. Parameters should be optimized on the student's own logs once there are enough reviews.
- Per-course parameter sets are not obviously better: per-deck parameters lost to per-user parameters in Finding 1.2. Desired retention can differ per course while parameters are shared.
- A concept-level model with item rotation has indirect support (Findings 7.1–7.4), and the two-step "pick concept, then pick item" policy has been proposed (Finding 7.2) but not tested with learners.

---

## 3. Proposed combination scheduler (design C) — a proposal, not a tested design

The proposal keeps design A's concept tagging, item rotation and confidence buttons. It replaces A's fixed boxes with a memory model per concept (FSRS-7 through ts-fsrs, or FSRS-6), and it adds exam dates. A course could switch it on per course. Each part below is tagged **[evidence]**, **[indirect]** or **[no direct evidence]**.

### 3.1 State

**Per concept, per student**
- FSRS memory state (stability S, difficulty D; FSRS-7 adds its fast-trace state) and the last review timestamp, updated by a graded review of any item tagged with the concept. **[indirect]** Findings 7.1–7.2 support concept-level memory. FSRS itself was fit and benchmarked per card (Finding 1.1).
- Count of separate days with a confident correct answer, used for "mastered". **[evidence]** Finding 3.1 ("relearn 3 times").
- In-session counters: correct recalls this session, questions since last shown, item last used. **[evidence]** Findings 3.1 and 4.2.
- Flags: `confident_error_pending` (needs a later-day check) and `guessed_correct_count`. **[indirect]** Findings 5.1 and 5.3.
- Weak-spots status derived from the above (Section 3.5). **[no direct evidence]** for the status thresholds.

**Per item (question wording or numeric variant)**
- Times shown, last shown, correct/incorrect history, and the student's accuracy on this item compared with the concept's predicted recall. This works as an item-difficulty offset used when choosing items and when displaying predicted recall, but it does not update S. **[indirect]** DASH/DAS3H use an item difficulty term alongside the KC memory term (Findings 7.1–7.2). **[no direct evidence]** for adding such an offset on top of FSRS.
- Direction tag for fact items (for example brand→generic), with each direction scheduled as a separate concept. **[evidence]** Finding 2.5.

**Per course**
- Exam dates, with the concepts covered by each exam. Desired retention for daily scheduling, default 0.9 (Anki manual: above 90% "the workload increases very quickly"). Exam target retention. Preset: lecture, calculation or fact-list. **[no direct evidence]** for specific exam targets.
- One FSRS parameter set shared across the student's courses until each course has enough reviews to test per-course parameters. **[indirect]** Finding 1.2 (per-deck parameters underperformed).

### 3.2 Choosing the next item

1. **Due set.** A concept is due when its predicted recall now is at or below the course's desired retention (standard FSRS rule; corresponds to a high threshold, **[evidence]** Finding 1.8). In exam mode, a concept is also due when its predicted recall at the exam time is below the exam target (Section 3.3).
2. **Concept order.** Order concepts from lowest predicted recall to highest. Mix concepts from different topics; for calculation courses, never place two of the same problem type in a row. **[evidence]** Findings 6.1–6.5. In lecture courses, put easily confused concepts near each other. **[indirect]** Finding 6.1, "similar between categories".
3. **Item choice within the concept.** In lecture and calculation courses, pick the item least recently seen by this student, excluding the item just answered. **[evidence]** Findings 2.2–2.3. Avoid showing two items of the same concept within the same short block; Anki's sibling burying is the established version of this. **[indirect]** Finding 7.3. In the fact-list preset, repeating the identical item is allowed. **[indirect]** Finding 2.1, transfer weakest to rearranged items.
4. **Within-session return of a miss.** A missed concept returns after at least 4 other questions, with a different item when one exists. If retrieval keeps succeeding, the gap can be lengthened rather than kept at 4. **[evidence]** Findings 4.2 and 4.6. **[no direct evidence]** for the number 4 itself.
5. **New concepts (Learn).** A new concept counts as learned for the session after 3 correct recalls, each separated by other questions. A known concept needs 1 correct recall per session. When the next exam is more than about 2 weeks away, the initial criterion can drop to 1–2. **[evidence]** Findings 3.1–3.2. **[no direct evidence]** for the 2-week cut-off.
6. **Calculation cap.** No more than 2–3 problems of one type per session; extra problems go to later sessions. **[evidence]** Finding 4.8, no benefit of 9 against 3 problems. **[no direct evidence]** for the exact cap.

### 3.3 Exam dates, cram mode and the night before

- **Exam check.** For each concept on an upcoming exam, compute predicted recall at the exam time from the current state. If it is below the exam target, schedule an extra review before the exam. This is the same function as Anki's "Advance" (Finding 7.5). Extra reviews update the model normally and never shorten later long-term intervals beyond what the model gives. **[indirect]** Finding 7.5. **[no direct evidence]** that this beats plain FSRS for exam scores (Finding 7.6).
- **Spacing before the exam.** When several reviews fit before the exam, space them so each gap is roughly 20–40% of the remaining days for horizons around 1 week, and a smaller fraction for longer horizons. If in doubt, lean toward the longer gap. **[evidence]** Finding 4.4. It is **[indirect]** for multi-session schedules, because Cepeda used two sessions.
- **Cram mode (day before and day of).** Pick only concepts on that exam. Order them by lowest predicted recall now. Interleave them. Use wide within-session spacing, one long queue rather than many small ones. Require 1 correct recall per concept in the session. **[evidence]** Findings 4.6, 4.9 and 3.5. Cram reviews are logged and, with FSRS-6/7, update the model as same-day reviews (Findings 7.7–7.8). They never reset the long-term schedule. **[evidence]** that massed review helps the immediate quiz and that long-term spacing matters for cumulative exams: Findings 1.6 and 4.8. **[no direct evidence]** for how to weight cram reviews in the model beyond what FSRS-6/7 already do.
- **After the exam.** Concepts keep their FSRS schedule at the normal desired retention; nothing is retired at the exam date. **[evidence]** Finding 4.3: a decline from 95% to 55% in 6 weeks when practice stopped. Findings 1.6 and 4.8 point the same way.

### 3.4 Confidence buttons → grades

| Outcome | Grade sent to the concept's FSRS state | Extra action | Evidence |
|---|---|---|---|
| Correct, confident | Good (pass) | none | standard FSRS use (Finding 5.7) |
| Correct, "Not sure" | Good (pass). Use Hard only if logs show it improves calibration, since FSRS is slightly more accurate for Again/Good-only users | show the explanation; next session use a different item for this concept | feedback for low-confidence correct answers: Finding 5.1 [evidence]; Hard vs Good choice: Finding 5.7 [indirect] |
| Correct, "I guessed" | Again (fail); log as `guessed_correct` | show the explanation; re-ask with a different item after ≥ 4 other questions | Findings 5.1 and 5.8 [indirect]; treating a correct guess as a failure in the model: [no direct evidence] |
| Wrong, any confidence | Again (fail) | feedback; re-ask in the same session with a different item after ≥ 4 questions | Findings 4.2 and 5.4 [evidence] |
| Wrong after the student marked confidence high (if the button order allows capturing it) | Again (fail); set `confident_error_pending` | retest right after feedback, then a required check on a later day (1 day or more) | Findings 5.3–5.4 [evidence]; Finding 5.5 (confidence may only reflect prior knowledge) [caution] |

Note on mapping "I guessed" to Again: FSRS defaults were fit on data where Again means "forgot". Counting guessed-correct answers as Again shifts what "recall" means for this student. Parameters optimized on the student's own logs absorb this shift; default parameters do not. **[no direct evidence]**.

### 3.5 Weak-spots statuses (definitions; no direct evidence for the thresholds)

- **unfamiliar**: no graded review yet.
- **struggling**: two or more Again grades in the last 3 reviews, or predicted recall now below 0.7.
- **improving**: last review passed, but fewer than 3 separate days with a confident correct answer.
- **mastered**: 3 or more separate days with a confident correct answer (Finding 3.1), the most recent review passed, and predicted recall at or above desired retention.
- **returning**: previously mastered, then an Again grade.

### 3.6 Course presets

| Preset | Concept unit | Items | Ordering | Notes |
|---|---|---|---|---|
| Lecture (pharmacology, medicinal chemistry) | idea tagged `concept` | different wordings and application questions | interleave across concepts; put confusable classes near each other | varied retrieval (Q2), successive relearning (Q3) |
| Calculation (pharmacokinetics) | problem type | numeric variants; equation sheet available as in the exam | strict interleaving of types; cap per type per session | spacing and interleaving have the strongest math evidence (Q4, Q6); correct-count mastery is a weak signal (Finding 3.6) |
| Fact list (Basic Drug Knowledge, 300 drugs, weekly) | one fact direction | identical item allowed | keep the current order unless logs show a difference | per-card FSRS (design B) already fits this preset; keep reviews running after each weekly quiz (Finding 4.3) |

---

## 4. Open questions and data needed from the app's answer logs

**Open questions the literature does not answer for this student**
1. Does an FSRS state per concept, updated by different items, stay calibrated? FSRS has only been benchmarked per card.
2. Does treating "I guessed" as a failure improve later accuracy, or does it only add reviews?
3. Which exam-target rule (Section 3.3) improves exam-day accuracy enough to justify the extra reviews?
4. In pharmacokinetics, does any memory model predict problem-solving success? Finding 3.6 suggests a correct solve predicts little.
5. Does design A's minimum of 4 intervening questions beat longer or shorter in-session gaps for this student?

**Data to log on every answer**
- **Identifiers and timing:** student, course, concept id, item id, item variant type (wording, numeric, direction), timestamp to the second (FSRS-7 uses fractional days), session id.
- **Context:** mode (normal, Learn, Cram, exam-check), which scheduler chose the item, time since the concept was last seen and since this item was last seen, number of questions since last seen.
- **Response:** correct/incorrect, chosen answer, confidence button (and whether it was pressed before or after the answer was revealed), response time.
- **Model output:** each model's predicted recall at the time of the answer (FSRS per card, FSRS per concept, A's box), so models can be compared on the same answers.
- **Exams:** exam dates and the list of concepts per exam. Where possible, the student's exam results per question mapped to concepts. Failing that, in-app exam-simulation sets of held-out items never used in practice.

**Analyses that would decide between the designs for this student**
1. **Calibration and discrimination per model** (log loss, RMSE by bins, AUC) on the student's own answers. Use the benchmark's method of training on older answers and testing on newer ones (Finding 1.1). Do this separately for same-day and later answers, and for each course preset.
2. **Within-student randomized comparison.** Randomly assign each concept to scheduler A or C (or B, item level) and match the number of review trials, as Lindsey et al. did (Finding 1.6). The outcome is accuracy on held-out items or exam questions for those concepts, plus total study time. With one student, randomizing concepts is the only feasible design.
3. **Transfer check.** For concepts practiced with varied items against one repeated item, compare accuracy on a never-seen item.
4. **Confidence follow-up.** Next-day accuracy after "I guessed" correct, after "Not sure" correct, after confident correct and after confident wrong. Test whether confident errors reappear after a week (Finding 5.3).
5. **Gap curves.** Accuracy as a function of within-session gap (in questions) and between-session gap (in days), compared with the time remaining until the exam (Finding 4.4).
6. **Parameter optimization.** Once enough reviews exist, fit FSRS parameters to the student's logs. The tutorial says Anki 24.06+ has "no minimum limit for the number of reviews to use 'Optimize'", but accuracy improves with more data. Compare default parameters with fitted ones on held-out answers.

---

## 5. Sources

Access: **FT** = full text read (whole or targeted passages); **ABS** = abstract only; **WEB** = web page or repository file.

**FSRS, benchmark and software documentation**
1. open-spaced-repetition. *SRS Benchmark* (README). GitHub, retrieved 2026-11-01. https://github.com/open-spaced-repetition/srs-benchmark (raw README downloaded). WEB.
2. open-spaced-repetition. *The Algorithm* (FSRS wiki; moved from fsrs4anki wiki). https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm (raw file downloaded). WEB.
3. open-spaced-repetition. *ABC of FSRS* (wiki). https://github.com/open-spaced-repetition/awesome-fsrs/wiki/ABC-of-FSRS. WEB.
4. open-spaced-repetition. *fsrs4anki tutorial* (docs/tutorial.md). https://github.com/open-spaced-repetition/fsrs4anki/blob/main/docs/tutorial.md. WEB.
5. open-spaced-repetition. *ts-fsrs* README, and *Migrating to v6 and FSRS-7*. https://github.com/open-spaced-repetition/ts-fsrs ; https://open-spaced-repetition.github.io/ts-fsrs/guide/migration ; npm registry "latest" = 6.0.0 (https://registry.npmjs.org/ts-fsrs/latest). WEB.
6. Anki. *Deck Options* (Anki Manual): FSRS, desired retention, burying. https://docs.ankiweb.net/deck-options.html. WEB.
7. Ye, J. (2025, 14 July). *The History of FSRS for Anki*. LessWrong. https://www.lesswrong.com/posts/G7fpGCi8r7nCKXsQk/the-history-of-fsrs-for-anki. WEB.
8. Expertium. *Benchmark of Spaced Repetition Algorithms*. Expertium's Blog. https://expertium.github.io/Benchmark.html. WEB.

**Adaptive vs fixed scheduling**

9. Lindsey, R. V., Shroyer, J. D., Pashler, H., & Mozer, M. C. (2014). Improving students' long-term knowledge retention through personalized review. *Psychological Science*, 25(3), 639–647. https://doi.org/10.1177/0956797613504302. FT (author reprint PDF, https://home.cs.colorado.edu/~mozer/Research/Selected%20Publications/reprints/LindseyShroyerPashlerMozer2014.pdf) + PubMed abstract.
10. Mettler, E., Massey, C. M., & Kellman, P. J. (2016). A comparison of adaptive and fixed schedules of practice. *Journal of Experimental Psychology: General*, 145(7), 897–917. https://doi.org/10.1037/xge0000170. FT (PMC6028005).
11. Eglington, L. G., & Pavlik, P. I. (2020). Optimizing practice scheduling requires quantitative tracking of individual item performance. *npj Science of Learning*, 5, 15. https://doi.org/10.1038/s41539-020-00074-4. FT (PMC7567101).
12. Pavlik, P. I., & Anderson, J. R. (2008). Using a model to compute the optimal schedule of practice. *Journal of Experimental Psychology: Applied*, 14(2), 101–117. https://doi.org/10.1037/1076-898X.14.2.101. ABS.
13. Settles, B., & Meeder, B. (2016). A trainable spaced repetition model for language learning. *Proceedings of the 54th Annual Meeting of the ACL*, 1848–1858. https://doi.org/10.18653/v1/p16-1174 ; PDF https://aclanthology.org/P16-1174.pdf. FT passages.
14. Tabibian, B., Upadhyay, U., De, A., Zarezade, A., Schölkopf, B., & Gomez-Rodriguez, M. (2019). Enhancing human learning via spaced repetition optimization. *PNAS*, 116(10), 3988–3993. https://doi.org/10.1073/pnas.1815156116. ABS (PubMed metadata).
15. Whitmer, D. E., Johnson, C. I., & Marraffino, M. D. (2022). Examining two adaptive sequencing approaches for flashcard learning: The tradeoff between training efficiency and long-term retention. In *Adaptive Instructional Systems (HCII 2022)*, LNCS, 126–139. Springer. https://doi.org/10.1007/978-3-031-05887-5_10. ABS.
16. Xiong, X., et al. (2015). Improving students' long-term retention performance: A study on personalized retention schedules. *Proceedings of LAK '15*. https://consensus.app/papers/details/7c0cb17878cc58168b897366de7cd82c/. ABS.
17. Sense, F., Behrens, F., Meijer, R. R., & van Rijn, H. (2016). An individual's rate of forgetting is stable over time but differs across materials. *Topics in Cognitive Science*, 8(1), 305–321. https://doi.org/10.1111/tops.12183. ABS.
18. Sense, F., van der Velde, M., & van Rijn, H. (2021). Predicting university students' exam performance using a model-based adaptive fact-learning system. *Journal of Learning Analytics*, 8(3), 155–169. https://doi.org/10.18608/jla.2021.6590. ABS.
19. Khajah, M. M., Lindsey, R. V., & Mozer, M. C. (2014). Maximizing students' retention via spaced review: Practical guidance from computational models of memory. *Topics in Cognitive Science*, 6(1), 157–169. https://doi.org/10.1111/tops.12077. ABS.
20. Choffin, B., Popineau, F., Bourda, Y., & Vie, J.-J. (2019). DAS3H: Modeling student learning and forgetting for optimally scheduling distributed practice of skills. 12th International Conference on Educational Data Mining (EDM 2019), per the arXiv comments field; arXiv:1905.06873. https://arxiv.org/abs/1905.06873. FT passages.
21. Ingebrigtsen, M., Miland, Å. O., Bastesen, J., & Sæle, R. G. (2025). Effective, scalable, and low cost: The use of teacher-made digital flashcards improves student learning. *Applied Cognitive Psychology*, 39(4). https://doi.org/10.1002/acp.70086. ABS. (Consulted; not used for a finding.)

**Varied retrieval, transfer and testing**

22. Pan, S. C., & Rickard, T. C. (2018). Transfer of test-enhanced learning: Meta-analytic review and synthesis. *Psychological Bulletin*, 144(7), 710–756. https://doi.org/10.1037/bul0000151. ABS.
23. Butler, A. C., Black-Maier, A. C., Raley, N. D., & Marsh, E. J. (2017). Retrieving and applying knowledge to different examples promotes transfer of learning. *Journal of Experimental Psychology: Applied*, 23(4), 433–446. https://doi.org/10.1037/xap0000142. ABS.
24. Butowska-Buczyńska, E., Kliś, P., Zawadzka, K., & Hanczakowski, M. (2024). The role of variable retrieval in effective learning. *PNAS*, 121(44), e2413511121. https://doi.org/10.1073/pnas.2413511121. ABS.
25. Butler, A. C. (2010). Repeated testing produces superior transfer of learning relative to repeated studying. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 36(5), 1118–1133. https://doi.org/10.1037/a0019902. ABS.
26. Pan, S. C., & Rickard, T. C. (2017). Does retrieval practice enhance learning and transfer relative to restudy for term-definition facts? *Journal of Experimental Psychology: Applied*, 23(3), 278–292. https://doi.org/10.1037/xap0000124. ABS.
27. Yang, C., Luo, L., Vadillo, M. A., Yu, R., & Shanks, D. R. (2021). Testing (quizzing) boosts classroom learning: A systematic and meta-analytic review. *Psychological Bulletin*, 147(4), 399–435. https://doi.org/10.1037/bul0000309. ABS.
28. Price, D. W., Wang, T., O'Neill, T. R., Morgan, Z. J., Chodavarapu, P., Bazemore, A., Peterson, L. E., & Newton, W. P. (2024). The effect of spaced repetition on learning and knowledge transfer in a large cohort of practicing physicians. *Academic Medicine*, 100(1), 94–102. https://doi.org/10.1097/ACM.0000000000005856. ABS.
29. Wang, T., Morgan, Z. J., Bazemore, A., Newton, W. P., & Price, D. W. (2025). Spaced repetition enhances self-rated learning confidence: A large randomized trial among practicing family physicians. *Journal of Continuing Education in the Health Professions*, 46(1), 16–22. https://doi.org/10.1097/CEH.0000000000000615. ABS.

**Successive relearning**

30. Rawson, K. A., & Dunlosky, J. (2011). Optimizing schedules of retrieval practice for durable and efficient learning: How much is enough? *Journal of Experimental Psychology: General*, 140(3), 283–302. https://doi.org/10.1037/a0023956. ABS.
31. Vaughn, K. E., Dunlosky, J., & Rawson, K. A. (2016). Effects of successive relearning on recall: Does relearning override the effects of initial learning criterion? *Memory & Cognition*, 44(6), 897–909. https://doi.org/10.3758/s13421-016-0606-y. ABS.
32. Rawson, K. A., & Dunlosky, J. (2013; online 2012). Relearning attenuates the benefits and costs of spacing. *Journal of Experimental Psychology: General*, 142(4), 1113–1129. https://doi.org/10.1037/a0030498. ABS.
33. Rawson, K. A., Vaughn, K. E., Walsh, M., & Dunlosky, J. (2018). Investigating and explaining the effects of successive relearning on long-term retention. *Journal of Experimental Psychology: Applied*. https://doi.org/10.1037/xap0000146. ABS (via Consensus; author list taken from the citation inside Janes et al. 2020, read via Scholar Gateway).
34. Rawson, K. A., Dunlosky, J., & Sciartelli, S. M. (2013). The power of successive relearning: Improving performance on course exams and long-term retention. *Educational Psychology Review*, 25(4), 523–548. https://doi.org/10.1007/s10648-013-9240-4. ABS (Springer page).
35. Janes, J. L., Dunlosky, J., Rawson, K. A., & Jasnow, A. (2020). Successive relearning improves performance on a high-stakes exam in a difficult biopsychology course. *Applied Cognitive Psychology*, 34(5), 1118–1132. https://doi.org/10.1002/acp.3699. ABS + FT passages (Scholar Gateway).
36. Higham, P., et al. (2022; online 2021). The benefits of successive relearning on multiple learning outcomes. *Journal of Educational Psychology*. Volume 114(5), pages 928–944 and DOI 10.1037/edu0000693 as reported in search results (not opened); co-authors include Zengel and Hadwin per the repository listings. Author repository: https://eprints.soton.ac.uk/449677. ABS (via Consensus).
37. Rawson, K. A., Dunlosky, J., & Janes, J. L. (2020). All good things must come to an end: A potential boundary condition on the potency of successive relearning. *Educational Psychology Review*, 32(3), 851–871. https://doi.org/10.1007/s10648-020-09528-y (DOI from search results). ABS (via Consensus).
38. Rawson, K. A., & Dunlosky, J. (2022). Successive relearning: An underexplored but potent technique for obtaining and maintaining knowledge. *Current Directions in Psychological Science*. https://journals.sagepub.com/doi/full/10.1177/09637214221100484 (URL from search results). ABS (via Consensus).
39. Sando, K. R., & Feng, X. (2018). Use of an online spaced-education game to study top 200 drugs in a skills laboratory course. *American Journal of Pharmaceutical Education*, 82(7), 6324. https://doi.org/10.5688/ajpe6324. ABS.
40. Kornell, N., & Bjork, R. A. (2008). Optimising self-regulated study: The benefits—and costs—of dropping flashcards. *Memory*, 16(2), 125–136. https://doi.org/10.1080/09658210701763899. ABS.

**Spacing, interval shape and timing**

41. Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. *Psychological Science*, 19(11), 1095–1102. https://doi.org/10.1111/j.1467-9280.2008.02209.x. FT (author PDF https://www.yorku.ca/ncepeda/publications/CVRWP2008.pdf).
42. Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin*, 132(3), 354–380. https://doi.org/10.1037/0033-2909.132.3.354. ABS.
43. Latimier, A., Peyre, H., & Ramus, F. (2021). A meta-analytic review of the benefit of spacing out retrieval practice episodes on retention. *Educational Psychology Review*, 33(3), 959–987. Author PDF http://www.lscp.net/persons/ramus/docs/EPR20.pdf ; ERIC record https://eric.ed.gov/?id=EJ1310148 (DOI not retrieved). FT passages.
44. Karpicke, J. D., & Roediger, H. L. (2007). Expanding retrieval practice promotes short-term retention, but equally spaced retrieval enhances long-term retention. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 33(4), 704–719. https://doi.org/10.1037/0278-7393.33.4.704. ABS.
45. Karpicke, J. D., & Bauernschmidt, A. (2011). Spaced retrieval: Absolute spacing enhances learning regardless of relative spacing. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 37(5), 1250–1257. https://doi.org/10.1037/a0023436. ABS.
46. Karpicke, J. D., & Roediger, H. L. (2010). Is expanding retrieval a superior method for learning text materials? *Memory & Cognition*, 38(1), 116–124. https://doi.org/10.3758/MC.38.1.116. ABS.
47. Kang, S. H. K., Lindsey, R. V., Mozer, M. C., & Pashler, H. (2014). Retrieval practice over the long term: Should spacing be expanding or equal-interval? *Psychonomic Bulletin & Review*, 21(6), 1544–1550. https://doi.org/10.3758/s13423-014-0636-z. ABS.
48. Kim, S. K., & Webb, S. (2022). The effects of spaced practice on second language learning: A meta-analysis. *Language Learning*. https://consensus.app/papers/details/8bf5cae9a33f5c18b7b789b71111bb05/. ABS.
49. Dobson, J. L. (2012). Effect of uniform versus expanding retrieval practice on the recall of physiology information. *Advances in Physiology Education*, 36(1), 6–12. https://doi.org/10.1152/advan.00090.2011. ABS.
50. Terenyi, J., Anksorus, H., & Persky, A. M. (2018). Impact of spacing of practice on learning brand name and generic drugs. *American Journal of Pharmaceutical Education*, 82(1), 6179. https://doi.org/10.5688/ajpe6179. ABS.
51. Terenyi, J., Anksorus, H., & Persky, A. M. (2019). Optimizing the spacing of retrieval practice to improve pharmacy students' learning of drug names. *American Journal of Pharmaceutical Education*, 83(6), 7029. https://doi.org/10.5688/ajpe7029. ABS.
52. Kornell, N. (2009). Optimising learning using flashcards: Spacing is more effective than cramming. *Applied Cognitive Psychology*, 23(9), 1297–1317. https://doi.org/10.1002/acp.1537. ABS (Scholar Gateway).
53. Rohrer, D., & Taylor, K. (2006). The effects of overlearning and distributed practise on the retention of mathematics knowledge. *Applied Cognitive Psychology*, 20(9), 1209–1224. https://doi.org/10.1002/acp.1266. ABS (Scholar Gateway).
54. Emeny, W. G., Hartwig, M. K., & Rohrer, D. (2021). Spaced mathematics practice improves test scores and reduces overconfidence. *Applied Cognitive Psychology*, 35(4), 1082–1089. https://doi.org/10.1002/acp.3814. ABS + FT passage (Scholar Gateway).
55. Murray, E., et al. (2025). A meta-analytic review of the effectiveness of spacing and retrieval practice for mathematics learning. *Educational Psychology Review*. https://consensus.app/papers/details/d58ba8eb9b445dd589188b23ba45a35d/. ABS.

**Confidence and error correction**

56. Butler, A. C., Karpicke, J. D., & Roediger, H. L. (2008). Correcting a metacognitive error: Feedback increases retention of low-confidence correct responses. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 34(4), 918–928. https://doi.org/10.1037/0278-7393.34.4.918. ABS.
57. Butterfield, B., & Metcalfe, J. (2001). Errors committed with high confidence are hypercorrected. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 27(6), 1491–1494. https://doi.org/10.1037/0278-7393.27.6.1491. ABS.
58. Butler, A. C., Fazio, L. K., & Marsh, E. J. (2011). The hypercorrection effect persists over a week, but high-confidence errors return. *Psychonomic Bulletin & Review*, 18(6), 1238–1244. https://doi.org/10.3758/s13423-011-0173-y. ABS (PubMed).
59. Metcalfe, J., et al. (2014). Hypercorrection of high confidence errors: Prior testing both enhances delayed performance and blocks the return of the errors. *Journal of Applied Research in Memory and Cognition*. https://consensus.app/papers/details/01aaf8fd8be6519f8b72d001c8c8759b/. ABS (DOI not retrieved).
60. Carpenter, S. K., Haynes, C. L., Corral, D., & Yeung, K. L. (2018). Hypercorrection of high-confidence errors in the classroom. *Memory*, 26(10), 1379–1384. https://doi.org/10.1080/09658211.2018.1477164. ABS (PubMed).
61. Sitzman, D. M., Rhodes, M. G., & Tauber, S. K. (2014). Prior knowledge is more predictive of error correction than subjective confidence. *Memory & Cognition*, 42(1), 84–96. https://doi.org/10.3758/s13421-013-0344-3. ABS (PubMed).

**Interleaving**

62. Brunmair, M., & Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning and its moderators. *Psychological Bulletin*, 145(11), 1029–1052. https://doi.org/10.1037/bul0000209. ABS.
63. Rohrer, D., Dedrick, R. F., & Burgess, K. (2014). The benefit of interleaved mathematics practice is not limited to superficially similar kinds of problems. *Psychonomic Bulletin & Review*, 21(5), 1323–1330. https://doi.org/10.3758/s13423-014-0588-3. ABS.
64. Rohrer, D., et al. (2015; the Consensus record lists 2014). Interleaved practice improves mathematics learning. https://consensus.app/papers/details/0fb9f87d8aa45a5a837222d0ffa1754d/. ABS. The author list "Rohrer, Dedrick, & Stershic, 2015" appears in a citation inside the 2019 AERA paper by Rohrer (Consensus record). Journal and DOI not retrieved.
65. Rohrer, D., Dedrick, R. F., Hartwig, M. K., & Cheung, C.-N. (2020; online 2019). A randomized controlled trial of interleaved mathematics practice. *Journal of Educational Psychology*, 112(1), 40–52. https://doi.org/10.1037/edu0000367 (DOI from search results). ABS (via Consensus).
66. Foster, N. L., Mueller, M. L., Was, C., Rawson, K. A., & Dunlosky, J. (2019). Why does interleaving improve math learning? The contributions of discriminative contrast and distributed practice. *Memory & Cognition*, 47(6), 1088–1101. https://doi.org/10.3758/s13421-019-00918-4. ABS.
67. Samani, J., & Pan, S. C. (2021). Interleaved practice enhances memory and problem-solving ability in undergraduate physics. *npj Science of Learning*, 6, 32. https://doi.org/10.1038/s41539-021-00110-x. ABS.
68. Sana, F., & Yan, V. X. (2022). Interleaving retrieval practice promotes science learning. *Psychological Science*, 33(5), 782–788. https://doi.org/10.1177/09567976211057507. ABS.
69. Hartwig, M. K., Rohrer, D., & Dedrick, R. F. (2022). Scheduling math practice: Students' underappreciation of spacing and interleaving. *Journal of Experimental Psychology: Applied*, 28(1), 100–113. https://doi.org/10.1037/xap0000391. ABS. (Consulted; supports the point that students misjudge these techniques.)

**Notes on verification**
- Where a DOI is marked "from search results", I saw the DOI in a retrieved search result or URL but did not open the publisher page.
- Benchmark numbers come from the README as it stood on 2026-11-01. The README changes as algorithms are added.
- A WebFetch summary of the benchmark page gave FSRS-7 "41" default parameters; the raw README lists 34 trainable parameters, and I used the raw file.
- For Mettler et al. 2016, the full-text extraction dropped the italic condition names. I report only numbers whose condition is identified by the surrounding sentence.
