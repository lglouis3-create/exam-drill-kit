# Recommendation method proposal (for Louis's review)

On 2026-11-01 Louis approved research into how the kit should decide which features
to recommend for a course, whether the professor's transcripts and example questions
should count, and how the recommendations should improve with use. He also decided
that only his own data informs recommendations (`KIT_DESIGN.md` §12.4). Under brief
decision 2 this document is a proposal. `skill/SKILL.md` describes the method with the
values Louis has not set left blank, and the comparison in §5 does not start in any
course until he approves the method and sets those values (§6).

How it was prepared: a research run on 2026-11-01 searched PubMed, the Firecrawl
research index and web search, Wiley Scholar Gateway and ERIC; its working notes are
in `review/research-notes/recommendation-2026-11-01.md`. The main session then checked
every number below again against the source's PubMed record, publisher or author page,
or full text. Where a number could not be checked again it is left out and the
sentence says so. Section 2 reports what the sources state; sections 3 to 5 are this
proposal's reasoning from them. References follow AMA style, 11th edition.

## 1. The method in four steps

1. **Measure.** A script reads the course files and counts defined signals for each
   topic: the syllabus, the decks, the transcripts, the professor's polls and example
   questions, and the readings (§3). The profile is stored with a hash of the input
   files and the script version, so the same files always give the same profile.
2. **Match.** A versioned rule table maps signals to catalog features (§4). Each rule
   carries an evidence level for the literature and the sources behind it, and each
   recommendation records the rule version it used.
3. **Approve.** Each recommendation shows the rule, the signal counts that made it
   apply, the evidence level with its sources, and Louis's own result so far (§5.6).
   Louis approves before anything is built (decision 7).
4. **Test and update.** An approved feature runs against the current default on
   randomly assigned concept clusters inside the course, and a rule changes only by a
   decision rule written down before the course starts (§5).

## 2. What the sources state

**Techniques with broad support.** A review of ten learning techniques rated practice
testing and distributed practice "high utility".<sup>1</sup> Across 222 classroom
studies with 48,478 students, quizzing raised achievement (g = 0.499), and the effect
varied with test format consistency, material matching, corrective feedback and other
factors.<sup>2</sup> In health professions education, 21 of 23 retention outcomes in 19
controlled studies favored test-enhanced learning over studying.<sup>3</sup> Pharmacy
students who practiced brand and generic names for 100 drugs, with parts of the list
on different schedules, retained more under every spaced schedule than under massed
practice or study only: 67% with contracting spacing against 50% massed and 46% study
only. Their overall performance fell from 95% on the final exam to 55% on long-term
retention over 6 weeks.<sup>4</sup>

**The material changes which techniques help.** Across 59 studies, interleaving had an
overall effect of g = 0.42. It was best for paintings (g = 0.67) and other visual
materials, small for mathematical tasks (g = 0.34), and blocking was better than
interleaving for words (g = −0.39).<sup>5</sup> Medical students who practiced ECG
diagnosis with categories mixed together reached 46% diagnostic accuracy, against 30%
for students who practiced one category at a time.<sup>6</sup> Worked examples improved
mathematics performance (g = 0.48, 95% CI 0.36-0.60, 55 studies); correct examples
alone gave larger effects than incorrect or mixed examples, and adding
self-explanation prompts to worked examples gave a negative effect compared with
worked examples without prompts.<sup>7</sup> A meta-analysis across many tasks and
subjects found that prompting self-explanation helps,<sup>8</sup> which conflicts with
the worked-example finding; the two answer different comparisons, and the
worked-example meta-analysis is the closer match to calculation drills. Instructional
support that helps learners with little prior knowledge can lose its benefit, or harm
learning, for learners who know more (the expertise reversal effect).<sup>9</sup>

**Matching the exam.** In the classroom meta-analysis, quizzes in the same format as the
final test gave g = 0.531 (95% CI 0.464-0.599), against g = 0.399 (0.325-0.473) for a
different format. By material, identical items gave g = 0.512 (0.432-0.591), rephrased
items g = 0.558 (0.464-0.651), partly matching items g = 0.496 (0.363-0.628), and final
test items on material that had not been quizzed g = 0.321 (0.210-0.432), the smallest
of the four.<sup>2</sup> Across 192 effect sizes, learning from practice tests
transferred to other tests (d = 0.40, 95% CI 0.31-0.50); transfer was greatest across
test formats and to application and inference questions, and weakest to rearranged
stimulus-response items, to untested material seen during initial study, and to
problems involving worked examples.<sup>10</sup> In college classes, clicker questions
aimed at particular exam items raised performance on those delayed exam questions by
10% to 13%.<sup>11</sup>

**The professor's spoken cues.** The research run found no study that measures what
share of exam items covers material an instructor had cued as important ("this will be
on the exam").

**Comparing two methods within one learner.** An alternating treatments design compares
two treatments within one person; its threats are sequential confounding, carryover
effects and alternation effects.<sup>12</sup> Randomization can be built into each type
of single-case design, and its authors recommend randomized designs whenever the
conditions allow.<sup>13</sup> Studies in real courses have randomized topics within
each learner. Residents were tested on one topic and restudied another,
counterbalanced, and scored 39% on the tested topic against 26% on
the restudied topic on the final test (d = 0.91).<sup>14</sup> Medical students each
received spaced e-mailed questions on 2 of 4 topics chosen at random, and the spaced
topics scored higher (effect sizes 1.01 and 0.73).<sup>15</sup>
The pharmacy drug-name study assigned parts of one list to different schedules within
each student.<sup>4</sup>

**Analysing a small comparison.** Analyses that ignore variation among items are biased;
mixed models treat participants and items as crossed random factors.<sup>16</sup> When
N-of-1 trials were combined, Bayesian hierarchical models "improved precision and were
highly sensitive to within-patient variance priors".<sup>17</sup> A decision rule can
accept or reject a null value by comparing the highest density interval of the
posterior with a region of practical equivalence (ROPE) around that value; the same
article discusses how to set the ROPE limits.<sup>18</sup> Unusually low or high
measurements tend to be followed by values closer to the mean, and the effect is
larger when follow-up is limited to a subgroup selected by its first
value.<sup>19</sup> For adaptive (bandit) assignment in educational experiments, "at
least twice as many participants are needed for acceptable statistical
power".<sup>20</sup>

**What learners judge helps them.** Learners rated massed study as more effective than
spaced study "even after their own test performance had demonstrated the
opposite".<sup>21</sup> Learners who experienced a strategy as more effortful rated it
less effective and chose it less often, and choosing the more effortful strategy went
with better long-term retention.<sup>22</sup> Students in active physics classes
learned more than students in lectures but felt they had learned less.<sup>23</sup> In
one series of experiments, learners' belief in blocking changed only when their test
performance under each schedule was shown to them separately; then a majority came to
appreciate interleaving.<sup>24</sup>

**Confidence and grading of evidence.** Errors made with high confidence were the most
likely to be corrected on a retest after feedback.<sup>25</sup> GRADE rates the quality
of a body of evidence as high, moderate, low or very low, and keeps that rating
separate from the strength of a recommendation.<sup>26</sup>

## 3. Material-profile signals

The profile script counts each signal per topic (a syllabus unit or lecture) and per
course. A rule in §4 applies when its signal is present in a topic, and the
recommendation reports the count and the share of topics where it is present; no
threshold is set, because no source supplies one. A threshold can be added later from
Louis's results (§5.5).

| ID | Source file | What the script counts |
|---|---|---|
| S1 | Syllabus | Graded assessments with date, weight and format words in each description: "multiple choice", "short answer", "calculation", "case", "essay", "draw" or "structure". |
| S2 | Syllabus | Whether a final exam is described as "cumulative" or "comprehensive". |
| S3 | Syllabus, decks | Learning objectives by first verb from a fixed list: recall (list, name, define, identify, state), calculation (calculate, compute, determine, convert, dose), conceptual (explain, describe the mechanism, compare, predict), figure (interpret, draw, label, identify the structure). |
| S4 | Decks | Slides with a line that holds a number, an arithmetic operator or "=", and a unit from a fixed list (mg, mL, g, kg, mEq, mmol, mOsm, %, h, min, L). |
| S5 | Decks | Tables, their rows, and the first-column cells that match the course drug list. |
| S6 | Decks | Slides with numbered steps, arrows, or sequence words from a fixed list (step, then, leads to, results in, pathway, cycle, cascade, mechanism). |
| S7 | Decks | Slides with structure images, or with functional-group terms from a fixed list (hydroxyl, amine, amide, ester, carboxylic acid, ketone, aldehyde, sulfonamide, pKa). |
| S8 | Decks | Bullet lists, with the number of parallel items in each. |
| T1 | Transcripts | Exam cues from a fixed list ("on the exam", "on the test", "on the quiz", "will be tested", "you need to know", "know this", "make sure you know"), each linked by time stamp to the slide on screen. |
| T2 | Transcripts | Emphasis cues ("key point", "important", "remember", "the main thing") and noun phrases repeated while one slide is on screen. |
| T3 | Transcripts | Exclusion cues ("you don't need to memorize", "won't be on the exam", "just for your information", "not responsible for"). |
| T4 | Transcripts | Format words (as in S1) spoken in the same sentence as "exam", "test" or "quiz". |
| T5 | Transcripts | Minutes of lecture linked to each topic. |
| Q1 | Polls | Polls per topic, by stem: calculation (numbers in the stem and a numeric answer), recall (asks for a name, class, brand or generic, or fact), conceptual ("why", "mechanism", "which explains"), figure (an image, or a question about a structure). |
| Q2 | Practice and example questions | Formats (multiple choice, short answer, calculation, case, drawing) and the classes in Q1. |
| Q3 | Polls and examples | Topics covered by at least one poll or example question. |
| D1 | Readings | Pages assigned per topic. |
| V1 | After each exam | Cue validity for this professor: the share of T1-cued topics that appeared on the exam, and the share of exam items whose topic had a T1 cue. Needs item-level or topic-level results (§6, question 1). |
| V2 | After each exam | Agreement between the predicted format mix (S1, T4, Q2) and the formats on the exam. |

## 4. Rules from signals to features

The evidence level describes the literature on a GRADE-like scale. The levels are this
proposal's judgment from the sources in §2; "indirect" means the studies used other
learners, material or settings than a pharmacy student's course. Louis's own results
are a separate label (§5.5). The table becomes `RULES.md` version 1 after approval, and
each `FEATURES.md` entry's "Use when" line names its rule.

| Rule | Applies when | Feature | Evidence level | Sources |
|---|---|---|---|---|
| R1 | Any course | Practice testing with feedback and the spaced scheduler (core) | High | 1-4 |
| R2 | S5 drug rows, or S3 recall objectives | Table-recall drills with spacing and relearning (Learn mode) | Moderate: testing and spacing evidence is strong; the table drill itself is untested; one pharmacy study on drug names | 4, 15, 27 |
| R3 | Material is names or terms | Verbal lists are not interleaved by default | Moderate | 5 |
| R4 | S4, or S3 calculation objectives | Correct worked examples, with support reduced as the student's accuracy on that problem type rises | Moderate, indirect (mathematics, not pharmacy calculation) | 7, 9 |
| R5 | S4 with more than one problem type | Interleaved problem sets (the approved calculation preset) | Moderate | 5, 28 |
| R6 | S4 | "Plan the problem" drill | Very low: no direct test found | none |
| R7 | S4 | No self-explanation prompts added to worked examples by default | Moderate; conflicts with source 8 for other tasks | 7, 8 |
| R8 | S3 conceptual objectives, or S6 | Application and inference questions; "why" prompts | Moderate | 1, 10 |
| R9 | S6 | Step-through figures with narration | Low: animation showed an advantage over static graphics in a meta-analysis (its effect sizes were not re-checked and are not quoted); step-through pacing as built is untested | 29 |
| R10 | S7 | Structure atlas with interleaved comparison of similar structures | Low, indirect (visual categories, ECG diagnosis) | 5, 6 |
| R11 | Q1 present | Polls as practice items, plus rephrased versions | Moderate for factual items; Low for conceptual items | 2, 11 |
| R12 | S1, T4 or Q2 name a format | Most practice in the predicted exam format, some in other formats | Moderate | 2, 10 |
| R13 | T1 cues on a topic | More practice on cued topics, with uncued topics kept; the extra weight starts at zero and is set from V1 once this professor has one exam scored | Very low for cue validity; Moderate for keeping every topic | 2 |
| R14 | An exam within days | Cram as a last relearning session over material already practised with spacing | Low | 30, 31 |
| R15 | Any course | Confidence logged; high-confidence errors come back (the approved later-day check) | Low to moderate (laboratory) | 25 |

## 5. Testing a feature with Louis's own data

### 5.1 What is logged
Per answer, the fields in `review/scheduler-proposal.md` §5 (course, concept, question,
time, mode, right or wrong, confidence, and the scheduler's prediction), plus the arm
the concept is assigned to. Per exam: results by item mapped to concepts, or by topic if
items are not returned. Per course: one delayed retention probe on a fixed sample of
concepts from both arms, minutes of study per arm, Louis's rating of each feature, and
his notes.

### 5.2 Design
1. Before the course, list the concepts eligible for the feature (for example, every
   drug in the course tables). Group them into clusters (all questions on one drug or
   one idea), stratify the clusters by topic and by difficulty, and assign each cluster
   at random to arm A (the new feature) or arm B (the current default). Whole clusters
   go to one arm because practice on related material still helps (carryover<sup>12</sup>;
   quizzing still raised final-test scores on material that had not been quizzed,
   g = 0.321<sup>2</sup>), which would make the two arms look more alike than they are.
2. Both arms are active methods; no concept goes unpractised before a real exam.
3. Write the assignment, the outcome, the analysis and the priors to
   `reviews/experiments/<feature>.json` in the course repo before any studying, and
   compute there the smallest difference the number of clusters can detect, so that a
   result with too few clusters is reported as "not enough items", not "no effect".
4. Only exam items mapped to concepts before the exam count. Items picked afterwards
   because they were missed would score higher on any retest without a real
   change.<sup>19</sup>

### 5.3 Outcomes
Primary: proportion correct on exam items mapped to each arm. Secondary: the delayed
retention probe, because exam scores and later retention can differ widely.<sup>4</sup>
Cost: minutes of study per concept in each arm.

### 5.4 Analysis
(a) A randomization test that reshuffles the arm labels over clusters, giving the
probability of a difference at least as large by chance. (b) A Bayesian estimate of the
difference with items as a random factor,<sup>16</sup> reported as a posterior interval.
(c) The same estimate under the two priors written in the experiment file, because
results can depend strongly on the variance priors;<sup>17</sup> a conclusion that
changes between the priors is reported as such. Adaptive assignment (bandits) is not
used to decide between features with one student's data.<sup>20</sup> Adaptive choices
stay inside a feature, such as the scheduler choosing review times.

### 5.5 When a rule changes
With a region of practical equivalence of half-width *w* around zero<sup>18</sup> and a
number of courses *R*, both set by Louis (§6):
- The interval lies entirely above +*w* in at least *R* courses: personal label
  "Supports"; the kit proposes the feature as default for matching material.
- The interval lies entirely inside the region: "No meaningful difference"; the kit
  proposes whichever arm costs less study time.
- The interval lies entirely below −*w*: "Against"; the kit proposes retiring that
  feature version for this material.
- Otherwise: "Inconclusive"; the comparison continues in the next course with
  matching material.

Results from several courses are combined in a hierarchical model, so that no single
course changes a rule alone. For R13, each scored exam updates V1 for that professor,
and the cue weight is set from V1. Following "flag, don't decide", every proposed rule
change goes to the course's `reviews/OPEN_QUESTIONS.md` with its data, and the kit
change goes by pull request for Louis to merge.

### 5.6 How a recommendation reports confidence
Each recommendation shows four things: the rule and the signal counts that made it
apply; the literature evidence level and sources; the personal label with the clusters
per arm and the posterior interval; and Louis's rating, marked as a rating. Ratings
measure whether a feature is acceptable to use; they never set the label, because
learners' judgments of what helped them often disagree with measured
learning.<sup>21-23</sup> The Progress screen shows the results of each arm
separately, the presentation that changed learners' beliefs in that series of
experiments.<sup>24</sup>

## 6. Values and decisions for Louis

Nothing in §5 starts until these are answered. Blank entries have no value yet.

| # | Question | Answer |
|---|---|---|
| 1 | Can you get item-level exam results (returned exams or item reports), or only scores by topic or in total? Item-level results give the full comparison; topic scores give a weaker one. | |
| 2 | Is it acceptable that some concepts get the current default instead of a new feature before a real exam? Those concepts get the method expected to be weaker. | |
| 3 | *w*: the smallest difference in proportion correct worth a feature's extra study time. No source gives this value; it is a judgment of cost and benefit. | |
| 4 | *R*: how many courses must agree before a rule changes. | |
| 5 | The delayed retention probe: when it runs (for example, the start of the next term) and on how many concepts. | |
| 6 | Should the drill ask for your rating of each feature, given that ratings are shown but do not count as evidence of learning? | |
| 7 | Which drug-name list and functional-group list the profile script uses, and who keeps them current. | |
| 8 | Should conceptual polls be drilled word for word? The clicker evidence is for exam questions aimed at particular items. Search summaries report that a later study by the same group found no benefit for conceptual questions; its abstract was not retrieved, so it is not cited. | |
| 9 | Should step-through figures be compared with auto-play figures on randomly assigned figures? | |

## 7. What has no direct evidence

- That a professor's spoken exam cues predict exam content: no study found; V1 measures
  it for each professor.
- The "plan the problem" drill, the structure atlas, Cram as a separate feature, and
  step-through figures as built: no direct test found.
- Combinations of features in one drill: the meta-analyses test single techniques.
- Effects in pharmacy courses, apart from drug-name spacing<sup>4</sup> and
  test-enhanced learning in the health professions.<sup>3</sup>
- The effect for one learner: the sources report averages over people, so the kit
  measures Louis's own.
- The values of *w* and *R* and the timing of the retention probe.

## References

1. Dunlosky J, Rawson KA, Marsh EJ, Nathan MJ, Willingham DT. Improving students' learning with effective learning techniques: promising directions from cognitive and educational psychology. *Psychol Sci Public Interest*. 2013;14(1):4-58. doi:10.1177/1529100612453266
2. Yang C, Luo L, Vadillo MA, Yu R, Shanks DR. Testing (quizzing) boosts classroom learning: a systematic and meta-analytic review. *Psychol Bull*. 2021;147(4):399-435. doi:10.1037/bul0000309
3. Green ML, Moeller JJ, Spak JM. Test-enhanced learning in health professions education: a systematic review: BEME Guide No. 48. *Med Teach*. 2018;40(4):337-350. doi:10.1080/0142159X.2018.1430354
4. Terenyi J, Anksorus H, Persky AM. Impact of spacing of practice on learning brand name and generic drugs. *Am J Pharm Educ*. 2018;82(1):6179. doi:10.5688/ajpe6179
5. Brunmair M, Richter T. Similarity matters: a meta-analysis of interleaved learning and its moderators. *Psychol Bull*. 2019;145(11):1029-1052. doi:10.1037/bul0000209
6. Hatala RM, Brooks LR, Norman GR. Practice makes perfect: the critical role of mixed practice in the acquisition of ECG interpretation skills. *Adv Health Sci Educ Theory Pract*. 2003;8(1):17-26. doi:10.1023/a:1022687404380
7. Barbieri CA, Miller-Cotto D, Clerjuste SN, Chawla K. A meta-analysis of the worked examples effect on mathematics performance. *Educ Psychol Rev*. 2023;35(1):11. doi:10.1007/s10648-023-09745-1
8. Bisra K, Liu Q, Nesbit JC, Salimi F, Winne PH. Inducing self-explanation: a meta-analysis. *Educ Psychol Rev*. 2018;30(3):703-725. doi:10.1007/s10648-018-9434-x
9. Kalyuga S. Expertise reversal effect and its implications for learner-tailored instruction. *Educ Psychol Rev*. 2007;19(4):509-539. doi:10.1007/s10648-007-9054-3
10. Pan SC, Rickard TC. Transfer of test-enhanced learning: meta-analytic review and synthesis. *Psychol Bull*. 2018;144(7):710-756. doi:10.1037/bul0000151
11. Shapiro AM, Gordon LT. A controlled study of clicker-assisted memory enhancement in college classrooms. *Appl Cogn Psychol*. 2012;26(4):635-643. doi:10.1002/acp.2843
12. Barlow DH, Hayes SC. Alternating treatments design: one strategy for comparing the effects of two treatments in a single subject. *J Appl Behav Anal*. 1979;12(2):199-210. doi:10.1901/jaba.1979.12-199
13. Kratochwill TR, Levin JR. Enhancing the scientific credibility of single-case intervention research: randomization to the rescue. *Psychol Methods*. 2010;15(2):124-144. doi:10.1037/a0017736
14. Larsen DP, Butler AC, Roediger HL III. Repeated testing improves long-term retention relative to repeated study: a randomised controlled trial. *Med Educ*. 2009;43(12):1174-1181. doi:10.1111/j.1365-2923.2009.03518.x
15. Kerfoot BP, DeWolf WC, Masser BA, Church PA, Federman DD. Spaced education improves the retention of clinical knowledge by medical students: a randomised controlled trial. *Med Educ*. 2007;41(1):23-31. doi:10.1111/j.1365-2929.2006.02644.x
16. Judd CM, Westfall J, Kenny DA. Treating stimuli as a random factor in social psychology: a new and comprehensive solution to a pervasive but largely ignored problem. *J Pers Soc Psychol*. 2012;103(1):54-69. doi:10.1037/a0028347
17. Zucker DR, Ruthazer R, Schmid CH. Individual (N-of-1) trials can be combined to give population comparative treatment effect estimates: methodologic considerations. *J Clin Epidemiol*. 2010;63(12):1312-1323. doi:10.1016/j.jclinepi.2010.04.020
18. Kruschke JK. Rejecting or accepting parameter values in Bayesian estimation. *Adv Methods Pract Psychol Sci*. 2018;1(2):270-280. doi:10.1177/2515245918771304
19. Barnett AG, van der Pols JC, Dobson AJ. Regression to the mean: what it is and how to deal with it. *Int J Epidemiol*. 2005;34(1):215-220. doi:10.1093/ije/dyh299
20. Rafferty A, Ying H, Williams JJ. Statistical consequences of using multi-armed bandits to conduct adaptive educational experiments. *J Educ Data Min*. 2019;11(1):47-79. doi:10.5281/zenodo.3554749
21. Kornell N, Bjork RA. Learning concepts and categories: is spacing the "enemy of induction"? *Psychol Sci*. 2008;19(6):585-592. doi:10.1111/j.1467-9280.2008.02127.x
22. Kirk-Johnson A, Galla BM, Fraundorf SH. Perceiving effort as poor learning: the misinterpreted-effort hypothesis of how experienced effort and perceived learning relate to study strategy choice. *Cogn Psychol*. 2019;115:101237. doi:10.1016/j.cogpsych.2019.101237
23. Deslauriers L, McCarty LS, Miller K, Callaghan K, Kestin G. Measuring actual learning versus feeling of learning in response to being actively engaged in the classroom. *Proc Natl Acad Sci U S A*. 2019;116(39):19251-19257. doi:10.1073/pnas.1821936116
24. Yan VX, Bjork EL, Bjork RA. On the difficulty of mending metacognitive illusions: a priori theories, fluency effects, and misattributions of the interleaving benefit. *J Exp Psychol Gen*. 2016;145(7):918-933. doi:10.1037/xge0000177
25. Butterfield B, Metcalfe J. Errors committed with high confidence are hypercorrected. *J Exp Psychol Learn Mem Cogn*. 2001;27(6):1491-1494. doi:10.1037//0278-7393.27.6.1491
26. Guyatt GH, Oxman AD, Vist GE, et al. GRADE: an emerging consensus on rating quality of evidence and strength of recommendations. *BMJ*. 2008;336(7650):924-926. doi:10.1136/bmj.39489.470347.AD
27. Rawson KA, Dunlosky J. Optimizing schedules of retrieval practice for durable and efficient learning: how much is enough? *J Exp Psychol Gen*. 2011;140(3):283-302. doi:10.1037/a0023956
28. Rohrer D, Dedrick RF, Hartwig MK, Cheung CN. A randomized controlled trial of interleaved mathematics practice. *J Educ Psychol*. 2020;112(1):40-52. doi:10.1037/edu0000367
29. Berney S, Bétrancourt M. Does animation enhance learning? A meta-analysis. *Comput Educ*. 2016;101:150-167. doi:10.1016/j.compedu.2016.06.005
30. Cepeda NJ, Vul E, Rohrer D, Wixted JT, Pashler H. Spacing effects in learning: a temporal ridgeline of optimal retention. *Psychol Sci*. 2008;19(11):1095-1102. doi:10.1111/j.1467-9280.2008.02209.x
31. Vaughn KE, Dunlosky J, Rawson KA. Effects of successive relearning on recall: does relearning override the effects of initial learning criterion? *Mem Cognit*. 2016;44(6):897-909. doi:10.3758/s13421-016-0606-y
