# Research notes: recommendation-method evidence (2026-11-01)

Working notes from the research run that informed `review/recommendation-proposal.md`, kept as gathered: the reference format is the run's own, not AMA, and most numbers here were read from abstracts only (marked ABS). The proposal is the checked version; where these notes and the proposal differ, the proposal is current. Differences: the proposal names the readings signal D1, because R1 to R15 are the rules; its rules apply when a signal is present in a topic and report the counts, instead of using "high" thresholds, and it drops the window W and the list length L, because no source supplies those values; it leaves out numbers it could not check again, among them the clicker study's 69.8% and 61.4% and the animation meta-analysis effect sizes.

---

# How a study-tool kit should choose features for a new course, and improve those choices with one student's data

Research report. No code or repository was changed. Date of research: 2026-11-01.
Access labels: FT = full text (or the named full-text passages), ABS = abstract only, WEB = web page or search-result summary.

---

## 1. Summary

1. Practice testing and distributed practice have the broadest support across materials, learners and outcomes (Dunlosky et al. 2013, rated "high utility"); classroom quizzing raises achievement by g = 0.499 across 222 studies (Yang et al. 2021).
2. Material type changes which techniques help: interleaving helps visual category learning (g = 0.67 for paintings) and math (g = 0.34) but favors blocking for word materials (g = -0.39) (Brunmair & Richter 2019). Worked examples help math (g = 0.48; Barbieri et al. 2023).
3. Practice that matches the final test helps more: quizzes in the same format as the final test gave g = 0.531 vs 0.399 for a different format; practice on untested material gave g = 0.321 (Yang et al. 2021, Table 2).
4. In-class questions targeted at exam items raised performance on those items (61.4% to 69.8%) in a within-student, item-level design (Shapiro & Gordon 2012).
5. No study was found that measures how well a professor's spoken "this will be on the exam" cues predict exam content. The kit has to measure this per professor.
6. One learner can be studied by randomizing items or topics (not the learner) to conditions, as in Larsen et al. 2009, Kerfoot et al. 2007 and Terenyi et al. 2018; analysis by randomization tests and Bayesian estimation is supported in the single-case literature.
7. Bandit algorithms (Thompson sampling) need at least twice as many participants for adequate power and raise false-positive rates (Rafferty et al. 2019); they should not be used to judge features with one student's data.
8. Learners' ratings of what helped them are often wrong in a consistent direction: effortful methods feel less effective while producing more learning (Kornell & Bjork 2008; Deslauriers et al. 2019; Kirk-Johnson et al. 2019). Student ratings should be logged but not used as evidence of learning benefit.
9. Proposal (Section 7): count defined signals in course files, map them to features through a versioned rule table with a GRADE-like evidence level per rule, then test each recommended feature against an alternative on randomly assigned items and update rules only by predeclared decision rules.

---

## 2. Question 1: Which techniques suit which material and outcomes

### Findings

**Broad reviews that rate techniques**

- Dunlosky et al. (2013) reviewed 10 techniques against four moderator categories: learning conditions, student characteristics, materials, and criterion tasks. Practice testing and distributed practice received "high utility"; elaborative interrogation, self-explanation and interleaved practice "moderate"; summarization, highlighting, keyword mnemonic, imagery for text, and rereading "low" (ABS). In the elaborative-interrogation section the authors write that effects "have been shown across a relatively broad range of factual topics, although some concerns remain about the applicability of elaborative interrogation to material that is longer or more complex than fact lists", that benefits "may be limited for learners with low levels of domain knowledge", and that effects are established mainly after short delays (FT, one section, elaborative interrogation "Overall assessment").
- Sweller, van Merriënboer and Paas (2019) summarize cognitive load theory: novel information is processed by a limited working memory before storage in long-term memory, and instructional design should take these limits into account (ABS).
- Kalyuga (2007) reviews the expertise reversal effect: instructional techniques that help learners with low prior knowledge can lose their benefit or become harmful for learners with high prior knowledge (ABS).

**Practice testing (retrieval practice)**

- Yang et al. (2021), 222 classroom studies, 48,478 students: overall g = 0.499; moderators included the control condition, test format consistency, material matching, feedback, number of repetitions, timing, duration and design (ABS). See Question 2 for the moderator values.
- Rowland (2014): initial recall tests produced larger testing benefits than recognition tests (ABS).
- Pan & Rickard (2018), 192 transfer effect sizes, 122 experiments, N = 10,382: testing produced transferable learning, d = 0.40 [0.31, 0.50]. Transfer was greatest across test formats, to application and inference questions, and to problems involving medical diagnoses; weakest to rearranged stimulus-response items, to untested material seen during initial study, and to problems involving worked examples. After publication-bias correction, predicted transfer was often absent when the favorable moderators (response congruency, elaborated retrieval, high initial test performance) were absent (ABS).
- Health professions: Green, Moeller & Spak (2018, BEME Guide 48), 19 controlled studies, 41 outcomes: 5 of 6 immediate outcomes (SMD 0.09 to 0.44), 21 of 23 retention outcomes (SMD 0.12 to 2.5) and all 7 transfer outcomes (SMD 0.33 to 1.1) favored test-enhanced learning (ABS). Larsen, Butler & Roediger (2009), residents, final test about 6 months later: 39% after repeated testing vs 26% after repeated study, d = 0.91 (ABS).
- Conflict on complex material: van Gog & Sweller (2015) argue that the testing effect "decreases or even disappears" as the number of interacting elements in the material increases (ABS). Karpicke & Aue (2015) reply that "element interactivity" is not defined in a measurable way, that relevant positive studies were omitted, that the null results came from the retrieval tasks used, and that the worked-example data show "a small positive effect" (ABS). The meta-analyses above (Yang; Pan & Rickard; Green) are the more authoritative sources because they pool many studies; the commentary debate concerns a subset (worked-example problem solving), where Pan & Rickard also found the weakest transfer.

**Distributed practice, scheduling and successive relearning**

- Cepeda et al. (2006), 839 assessments in 317 experiments: the gap between study sessions that maximized retention increased as the retention interval increased (ABS).
- Cepeda et al. (2008), more than 1,350 people: the optimal gap was about 20 to 40% of a 1-week test delay and about 5 to 10% of a 1-year test delay (ABS).
- Lindsey et al. (2014): a personalized, model-based review schedule gave 16.5% higher course retention than massed study and 10.0% higher than a one-size-fits-all spaced schedule, on a cumulative exam after the semester (ABS).
- Pharmacy: Terenyi, Anksorus & Persky (2018), 100 brand/generic drug pairs, each student practiced different parts of the list under different schedules (partial block design). Long-term retention: contracting spacing 67%, expanding 58%, equal 59%, single practice (massed) 50%, study only 46%; overall scores fell from 95% on the final exam to 55% at long-term retention over 6 weeks (ABS).
- Medicine: Kerfoot et al. (2007) randomized each student to receive spaced e-mailed questions on 2 of 4 urology topics; 95 of 133 students completed the end-of-year test; spaced education improved scores (p < 0.001), with effect sizes 1.01 and 0.73 for students 6 to 8 and 9 to 11 months after the rotation (ABS).
- Versteeg et al. (2020), scoping review of 120 articles: "spaced learning" is defined inconsistently in health-professions education (ABS).
- Successive relearning (practice to a criterion in several spaced sessions): Rawson, Vaughn, Walsh & Dunlosky (2018) report an advantage over single-session learning of d = 1.52 to 4.19 (ABS). Rawson & Dunlosky (2013), 567 students, nearly 40,000 responses: benefits of initial spacing were large before relearning and attenuated after relearning; the time costs of spacing were also attenuated (ABS). Vaughn, Dunlosky & Rawson (2016): the benefit of a higher initial criterion did not persist across relearning sessions (ABS).

**Interleaving**

- Brunmair & Richter (2019), 59 studies, 238 effect sizes: overall g = 0.42; paintings g = 0.67 and other visual materials favorable; mathematics g = 0.34; expository texts and tastes non-significant; words g = -0.39 (blocking better). Interleaving helped more when categories were similar to each other, items within a category were dissimilar, and material was complex (ABS).
- Rohrer, Dedrick & Stershic (2015), 126 seventh-graders over 3 months: interleaved math practice beat blocked practice on unannounced tests 1 day later (d = 0.42) and 30 days later (d = 0.79). The authors' rationale is that interleaving requires choosing a strategy from the problem itself (ABS).
- Medicine: Hatala, Brooks & Norman (2003): mixed ("contrastive") ECG practice gave 46% diagnostic accuracy on new ECGs vs 30% for blocked practice (ABS).

**Worked examples and self-explanation**

- Barbieri et al. (2023), 55 studies, 181 effect sizes: worked examples improved mathematics performance, g = 0.48, both for initial skill acquisition and practice; correct examples alone beat incorrect or mixed examples; adding self-explanation prompts to worked examples produced a negative effect relative to examples without prompts (ABS).
- Bisra et al. (2018), 69 effect sizes from 64 reports: prompting self-explanation gave g = 0.55 across learning tasks (solving problems, studying worked problems, studying text) and subject areas (ABS).
- Conflict: the two meta-analyses disagree about self-explanation prompts in worked-example math. They answer different comparisons (Bisra: prompts vs no prompts across many tasks; Barbieri: prompts added to examples, math only). For calculation drills the more specific source (Barbieri) applies more directly.

**Multimedia, animation, dual coding**

- Noetel et al. (2022), overview of 29 reviews, 1,189 studies, 78,177 participants: 11 design principles had significant positive effects on learning; largest for captioning second-language video, temporal/spatial contiguity and signaling; "robust evidence" for modality, animation, coherence (removing seductive details), segmentation, personalization and others (ABS, ERIC). A search-result summary of the same abstract adds that good design mattered more for complex material and system-paced settings (WEB; this sentence was cut off in the abstract I read).
- Berney & Bétrancourt (2016), 61 studies, 140 comparisons: animation vs static graphics g = 0.226 [0.12, 0.33]; larger when system-paced (g = 0.309), with auditory commentary (g = 0.336), or with no accompanying text (g = 0.883) (ABS). An earlier meta-analysis (Höffler & Leutner 2007) exists; I did not retrieve its abstract.

### Implications for the kit

- Fact lists and drug tables (names, classes, brand/generic, doses): practice testing with feedback, a spaced scheduler, and successive relearning have the strongest support, including a pharmacy study on drug names (Terenyi 2018). Interleaving is not supported for word-like material (Brunmair: g = -0.39); the kit should not make interleaving the default for drug-name drills.
- Calculation courses: worked examples (Barbieri) and interleaved problem sets (Rohrer; Brunmair math) are supported. The expertise reversal effect (Kalyuga) implies the kit should reduce worked-example support as the student's accuracy on a problem type rises. Self-explanation prompts should not be added to worked-example drills by default (Barbieri). A "plan the problem" drill has no direct test; its closest support is Rohrer's rationale that interleaving forces the student to identify the strategy from the problem.
- Mechanism and conceptual content: application and inference questions in practice tests transfer best (Pan & Rickard); elaborative interrogation and self-explanation have moderate support but evidence for longer, complex material and long delays is limited (Dunlosky).
- Figures, structures and visual categories: interleaved comparison practice is supported for visual categories (Brunmair visual materials; Hatala ECG). Step-through animated figures are supported modestly (Berney g = 0.226) and segmentation is among the robust principles (Noetel). Berney's larger effect for system-paced animation is in tension with learner-paced step-through; the kit should treat the step-through pacing as untested.
- Narrated walkthroughs: auditory commentary with animation (Berney g = 0.336) and the modality principle (Noetel) support narration over on-screen text.

---

## 3. Question 2: Using the exam's own signals

### Findings

- Transfer-appropriate processing: Morris, Bransford & Franks (1977) found semantic study beat rhyme study on a standard recognition test, while rhyme study beat semantic study on a rhyme recognition test; memory depended on the match between study processing and test demands (ABS).
- Format and material match in classrooms, Yang et al. (2021) Table 2 (FT, read through a third-party copy of the article):
  - Test format matching between quiz and final test: Yes k = 328, g = 0.531 [0.464, 0.599]; No k = 151, g = 0.399 [0.325, 0.473]; Unknown k = 94, g = 0.532; between-group test Q = 23.378, p < .001.
  - Test material matching: Identical items k = 226, g = 0.512; Rephrased k = 100, g = 0.558; Partial k = 41, g = 0.496; Untested material k = 43, g = 0.321; Q = 22.367, p < .001.
  - Quiz format: matching k = 6, g = 0.913; fill-in-the-blank k = 22, g = 0.773; short answer k = 93, g = 0.638; multiple choice k = 270, g = 0.567; cued recall k = 20, g = 0.316; free recall k = 22, g = 0.238; mixed k = 80, g = 0.336.
- Conflict on quiz format: Rowland (2014, mostly laboratory) found recall tests produce larger testing benefits than recognition tests (ABS), while Yang's classroom moderator analysis found multiple-choice quizzes (g = 0.567) above free recall (g = 0.238). Yang's comparison is between studies, so quiz format is mixed with other study differences. Pan & Rickard (2018) found transfer "greatest across test formats", which concerns transfer to a different format rather than the size of the benefit; it is consistent with Yang's finding that mismatched formats still help (g = 0.399), only less.
- Test expectancy: Lundeberg & Fox (1991), meta-analysis of 107 classroom and laboratory studies: laboratory findings did not generalize well to classrooms; in classroom studies students performed better when they knew which test type to expect (ABS).
- Jensen et al. (2014), two sections of an introductory biology course: sections given high-level (application, evaluation, analysis) quizzes and exams all semester scored higher on both the low-level and high-level items of a common final exam (ABS). This is one classroom comparison of two sections.
- Constructive alignment: Biggs (1996) describes an instructional design approach in which teaching and assessment are aligned with intended outcomes (ABS). The abstract describes the approach and an illustration; it reports no outcome data.
- Instructor questions targeted at exam items: Shapiro & Gordon (2012), two introductory psychology classes, 226 students analyzed, 44 multiple-choice factual exam items, items assigned to conditions within students (FT, Method and Results passages):
  - Targeted exam items were answered correctly 69.8% of the time after a matching clicker question vs 61.4% without; by subjects d = 0.38, by items d = 0.77.
  - When material was highlighted on slides and students were told it would be on the test, targeted items were answered at 70.1% vs 72.1% after clicker questions; not significant by subjects (t(225) = 1.33), p = .05 with d = 0.46 by items.
  - The paper cites an earlier study (Shapiro 2009) in which clicker-targeted exam questions were 20% higher than in a control class while untargeted items differed by under 3%.
  - A later study by the same group (Shapiro et al. 2017, Computers & Education 111:44-59) is reported in search-result summaries to find benefits for factual but not conceptual exam questions (WEB, abstract not retrieved; summaries disagree on details).
- Lecture cues: Titsworth & Kiewra (2004), laboratory lecture: spoken organizational cues increased noted organizational points by 39% and details by 35%; cueing raised test achievement 15 to 45% vs no cueing; note-taking raised achievement about 13% (ABS). A review by Boyle (2012) distinguishes "emphasis cues" (for example "the key point is") from "organizational cues" (for example "there are six parts to a cell") and reports a study (Locke 1977) in which on average 88% of content written on the board appeared in students' notes (FT, one passage; Locke is a secondary citation).
- Predictive validity of professor cues for exam content: a targeted search found no study that measures what share of exam items covers material the instructor cued as important (WEB search, no result). The only related evidence is that explicit "this will be on the test" alerts improved performance on those items about as much as clicker questions did (Shapiro & Gordon 2012), which shows the cue was accurate in a study where the researchers made it accurate.

### Implications for the kit

- Example questions and syllabus statements about format are a supported basis for choosing practice formats: matching format and material gives larger classroom effects (Yang), and knowing the test type helps in classrooms (Lundeberg & Fox).
- Verbatim polls are identical-item practice when the professor reuses them; rephrased versions were at least as effective as identical items (Yang: 0.558 vs 0.512), so the kit should add rephrased variants rather than only verbatim copies. Support is strongest for factual multiple-choice items (Shapiro & Gordon).
- Transcript cues are a supported reason to increase practice on a topic only if they have proved accurate for that professor. The kit should not drop uncued topics: practice on untested material helps least (Yang g = 0.321; Pan & Rickard weakest transfer to untested material), so coverage of all exam topics matters.
- Practice questions at the application level can raise both factual and application exam scores (Jensen), so the kit should include higher-level questions even when example questions are mostly factual. This rests on one classroom comparison.

---

## 4. Question 3: Measuring whether a tool helps one learner

### Findings

**Designs**

- Alternating treatments design: Barlow & Hayes (1979) describe comparing two treatments within one person by alternating them, and name three threats from multiple-treatment interference: sequential confounding, carryover effects, and alternation effects (ABS).
- Kratochwill & Levin (2010) show how randomization can be built into each single-case design type and recommend randomized single-case designs whenever conditions allow (ABS).
- CONSORT extension for N-of-1 trials (CENT 2015) is the reporting standard for single-patient trials (Vohra et al. 2015; metadata only, abstract not available in PubMed).
- Within-learner randomization of items or topics has precedents in education research with real courses:
  - Larsen et al. (2009): each resident was tested on one topic and restudied the other, counterbalanced across two groups (ABS).
  - Kerfoot et al. (2007): each student received spaced questions on 2 of 4 topics, chosen at random (ABS).
  - Terenyi et al. (2018): each pharmacy student practiced different parts of a 100-drug list under different schedules (ABS).
  - Shapiro & Gordon (2012): exam items were assigned to clicker and control conditions within students, and results were analyzed both by subjects and by items. Content experts rated how related each clicker question was to every non-target exam item to check that questions did not affect items they were not meant for (FT).

**Analysis**

- Treating items as random: Judd, Westfall & Kenny (2012) show that analyses ignoring variation among stimuli (items) are biased, and present mixed models with crossed random factors for participants and stimuli (ABS). With one learner, the item becomes the main random factor.
- Bayesian combination of single-person trials: Zucker et al. (1997) present a hierarchical Bayesian model that combines N-of-1 trials; each individual's estimate is adjusted between the individual's own result and the population estimate according to within- and between-person variation (ABS). Zucker, Ruthazer & Schmid (2010) found Bayesian hierarchical models improved precision but were "highly sensitive to within-patient variance priors", and that few observations per patient may not support complex variance models (ABS).
- Decision rule: Kruschke (2018) describes accepting or rejecting a parameter value by comparing the highest density interval of the posterior with a region of practical equivalence (ROPE) set around the null value, and discusses how to set ROPE limits (ABS).

**Pitfalls**

- Usage is not benefit: Kibble (2007) found students who chose to use online quizzes performed better on examinations, but use was self-selected; offering course credit increased participation and was followed by "widespread inappropriate use" (ABS). Hartwig & Dunlosky (2012), 324 undergraduates: both self-testing and rereading were positively associated with GPA (ABS), although rereading is rated low utility in experiments (Dunlosky 2013). Correlations between use and outcome do not show which tool caused the outcome.
- Self-selection of timing: Rafferty, Ying & Williams (2019) found adaptive assignment increased false positives "especially if there are temporal biases in when students enter the experiment" and advised caution when students choose when to participate (ABS).
- Regression to the mean: Barnett, van der Pols & Dobson (2005): unusually low or high measurements tend to be followed by values closer to the mean; the effect is larger with more measurement error and when follow-up is limited to a subgroup selected by its baseline value (ABS).
- Novelty: Clark (1983) concluded from meta-analyses that there are no learning benefits from the delivery medium itself (ABS). The one direct test of a novelty effect I retrieved (Popham 1962, 11 vs 12 pupils) found no difference (ABS). I found no high-quality estimate of novelty effects in study tools.
- Exam score is not retention: in Terenyi et al. (2018), scores fell from 95% on the final exam to 55% six weeks later (ABS).

### Implications for the kit

- The unit of randomization should be the item or concept, not the course or the week: the student cannot be randomized against himself in one course, but items can be. Randomizing items within topics and within difficulty levels removes most self-selection and time trends, because both conditions run at the same time.
- The comparison should be between two active methods (for example, feature A vs the current default), not "feature vs nothing", because an untreated arm costs the student learning before a real exam. This is a design choice for Louis, not a research finding.
- Spillover between related items (carryover in Barlow & Hayes's terms) will make differences look smaller, since practice on related material still helps (Yang untested g = 0.321). The kit should assign whole concept clusters (for example, all items for one drug) to one arm, as Shapiro & Gordon did by checking item relatedness.
- Only exam items that were mapped to concepts before the exam should count; items selected after the fact for being missed will show regression to the mean on any retest.
- A delayed retention probe is needed in addition to the course exam, because the two can diverge widely (Terenyi).

---

## 5. Question 4: Improving recommendations over time with small data

### Findings

- GRADE (Guyatt et al. 2008; Balshem et al. 2011): four levels of certainty (high, moderate, low, very low), applied to a body of evidence, not a single study. Randomized trials start as high and observational studies as low; certainty is lowered for risk of bias, imprecision, inconsistency, indirectness and publication bias. Assessing certainty is kept separate from the strength of a recommendation (ABS).
- The Education Endowment Foundation toolkit presents each approach with an implementation cost, an evidence-strength rating and an impact in months of progress (WEB; I did not retrieve the definition of its evidence-strength scale).
- Bayesian updating across individual trials: hierarchical models (Zucker et al. 1997; 2010) combine separate small trials and shrink each estimate toward the overall estimate; results are sensitive to variance priors (ABS).
- Bandits in education:
  - Rafferty, Ying & Williams (2019), simulations based on 10 educational experiments: multi-armed bandit assignment gave much higher average benefit to students, but "at least twice as many participants are needed for acceptable statistical power"; an optimistic prior reduced the power loss; bandit assignment increased false-positive rates (ABS).
  - Williams et al. (2021), Thompson sampling in three university classes: collecting data with Thompson sampling "can as much as double" both the false-positive and false-negative rates of common hypothesis tests in the two-arm binary case (ABS).
  - Nie et al. (2018): under natural conditions, sample means from adaptively collected data are biased downward (ABS).
  - Villar, Bowden & Wason (2015): bandit designs assign more patients to the better treatment but have "severe limitations" in statistical power (ABS).
  - Russo et al. (tutorial, arXiv 2017): Thompson sampling balances using current knowledge against collecting information (ABS).
- Decision rules: Kruschke's HDI-plus-ROPE rule yields three outcomes: reject the null value, accept it for practical purposes, or withhold a decision (ABS).

### Implications for the kit

- A GRADE-like scale is usable by a non-expert if each rule records: the sources, their design, whether the material and learners match (indirectness), and whether results agree (inconsistency). The kit should keep literature certainty and the student's own results as two separate labels, following GRADE's separation of certainty from recommendation.
- With one student, bandits should not decide which feature works: the power loss and bias reported above were found with far more participants than one student's items in one course. If adaptive allocation is wanted, it should only schedule study within a feature (as Lindsey et al. 2014 did for review timing), while the comparison between features uses fixed, equal random assignment.
- Updates across courses should use partial pooling: each course's estimate counts, but no single course changes a rule on its own. Because priors on variation strongly affect results (Zucker 2010), the kit should report results under two predeclared priors and flag rules whose conclusion changes between them.

---

## 6. Question 5: Students' judgments of what helps

### Findings

- Kornell & Bjork (2008): participants rated massed study as more effective than spaced (interleaved) study "even after their own test performance had demonstrated the opposite" (ABS).
- Yan, Bjork & Bjork (2016): theory-based and experience-based debiasing had only modest effects on belief in blocking; only when test performance on the two schedules was shown separately did a majority of learners come to appreciate interleaving. Learners also tended to believe that what helps others differs from what helps them (ABS).
- Kirk-Johnson, Galla & Fraundorf (2019): learners who experienced a strategy as more effortful rated it less effective and were less likely to choose it; choosing the more effortful strategy was associated with better long-term retention (Study 3) (ABS).
- Deslauriers et al. (2019), randomized physics classes: students in active classes learned more but reported a lower feeling of learning than students in passive lectures (ABS).
- Karpicke, Butler & Roediger (2009), 177 students: most repeatedly reread, few self-tested (ABS). Bjork, Dunlosky & Kornell (2013) review evidence that learners hold a faulty model of how they learn and are misled by fluency (ABS).
- Shapiro & Gordon (2012): students rated clicker questions as less helpful (2.84 on a 1-5 scale) than professor emphasis (3.68) and slide emphasis (3.39), although the clicker questions produced the measured gains (FT).
- Health professions: Davis et al. (2006), 17 studies: of 20 comparisons of physician self-assessment with external assessment, 13 showed little, no or an inverse relationship and 7 a positive one; accuracy was worst among the least skilled and the most confident (ABS).
- Nuance: Blasiman, Dunlosky & Rawson (2017) found students had a relatively accurate assessment of which strategies are more vs less effective, but still massed their study in the day or two before exams (ABS). General beliefs about named strategies can be accurate while judgments made after using a strategy are not.
- Confidence data: Butterfield & Metcalfe (2001): errors made with high confidence were the most likely to be corrected after feedback (ABS).

### Implications for the kit

- The student's ratings of a feature should be logged as a measure of acceptability and usability (whether he will keep using it), not as evidence that it improves exam scores.
- When rating and measured outcome disagree, the measured outcome decides the evidence label; the rating is shown next to it.
- Showing the student his own results for each arm separately is the one debiasing method with direct support (Yan et al. 2016, Experiment 6).
- Because knowing which strategy is better did not stop massing (Blasiman), the scheduler matters more than advice text.
- Logged confidence can be used to find high-confidence errors and schedule them for feedback and retest (Butterfield & Metcalfe).

---

## 7. Proposed recommendation method for the kit (PROPOSAL)

Everything in this section is a proposal derived from the findings above. Thresholds are written as named parameters for Louis to set; I give no values because no source supplies them.

### 7a. Material-profile signals (each countable by a script)

Each signal is computed per topic (a topic is a syllabus unit or lecture) and per course, and stored with the hash of the input files and the script version, so that the same files always give the same profile.

| ID | Source file | Definition (what the script counts) |
|---|---|---|
| S1 | Syllabus | Number of graded assessments, with date and stated format words: counts of "multiple choice", "short answer", "calculation", "case", "essay", "draw/structure" within each assessment description. |
| S2 | Syllabus | Cumulative flag: presence of "cumulative" or "comprehensive" in a final-exam description. |
| S3 | Syllabus / slides | Learning-objective verb classes: each objective is classified by its first verb against a fixed lexicon: recall (list, name, define, identify, state), calculation (calculate, compute, determine, convert, dose), conceptual (explain, describe the mechanism, compare, predict), figure (interpret, draw, label, identify the structure). Output: count per class. |
| S4 | Slides | Calculation density: share of slides with at least one line containing a number, an arithmetic operator or "=", and a unit token from a fixed list (mg, mL, g, kg, mEq, mmol, mOsm, %, h, min, L). |
| S5 | Slides | Table load: number of tables; total rows; share of first-column cells that match a drug-name lexicon (for example the course drug list). |
| S6 | Slides | Process density: share of slides containing numbered steps, arrow characters, or sequence words from a fixed list (step, then, leads to, results in, pathway, cycle, cascade, mechanism). |
| S7 | Slides | Structure density: number of slides with chemical-structure images (if image classification is available) or with functional-group terms from a fixed list (hydroxyl, amine, amide, ester, carboxylic acid, ketone, aldehyde, sulfonamide, pKa). |
| S8 | Slides | List density: number of bullet lists with at least L parallel items (L is a parameter). |
| T1 | Transcript | Explicit exam cues: count of phrases from a fixed lexicon ("on the exam", "on the test", "on the quiz", "will be tested", "you need to know", "know this", "make sure you know"), each linked by timestamp to the slide shown at that time. |
| T2 | Transcript | Emphasis cues: count of "key point", "important", "remember", "the main thing", plus repetitions of the same noun phrase within W seconds (W is a parameter). |
| T3 | Transcript | Exclusion cues: "you don't need to memorize", "won't be on the exam", "just for your information", "not responsible for". |
| T4 | Transcript | Format cues: format words (as in S1) spoken near "exam/test/quiz". |
| T5 | Transcript | Time on topic: minutes of transcript linked to each topic. |
| Q1 | Polls | Number of polls per topic and their class by stem pattern: calculation (numbers in stem and a numeric answer), recall (asks for a name, class, brand/generic, or fact), conceptual (asks "why", "mechanism", "which explains"), figure (contains an image or asks about a structure). |
| Q2 | Practice and example questions | Format distribution (MC, short answer, calculation, case, drawing) and the class distribution as in Q1. |
| Q3 | Polls, examples | Share of each topic covered by at least one poll or example question. |
| R1 | Readings | Pages assigned per topic. |
| V1 | After each exam (needs item-level results or topic-level scores) | Cue validity for this professor: precision = share of T1-cued topics that appeared on the exam; recall = share of exam items whose topic had a T1 cue. |
| V2 | After each exam | Format validity: agreement between the predicted format distribution (S1, T4, Q2) and the actual exam format distribution. |

### 7b. Rules mapping signals to features, with evidence levels

Evidence levels use a GRADE-like scale (High, Moderate, Low, Very low) for the literature. "Indirect" means the evidence comes from other learners, material or settings than a pharmacy student's course. Each rule is versioned; a recommendation records the rule version used.

| Rule | Condition (signals) | Feature | Evidence level | Basis |
|---|---|---|---|---|
| R1 | Any course | Practice testing with feedback, spaced scheduler | High | Dunlosky 2013; Yang 2021; Cepeda 2006, 2008; Green 2018 |
| R2 | S5 high or S3 recall high | Table-recall drills on drug tables, with spacing and successive relearning (Learn mode) | Moderate (testing and spacing evidence is high; the specific table drill is untested; one pharmacy study on drug names) | Terenyi 2018; Rawson 2013, 2018; Kerfoot 2007 |
| R3 | S5 high, material is names/terms | Do not interleave verbal lists by default | Moderate | Brunmair 2019 (words g = -0.39) |
| R4 | S4 high or S3 calculation high | Worked examples (correct examples), faded as accuracy rises | Moderate (math, not pharmacy calculation) | Barbieri 2023; Kalyuga 2007 |
| R5 | S4 high with several problem types | Interleaved problem sets | Moderate | Rohrer 2015; Brunmair 2019 (math g = 0.34) |
| R6 | S4 high | "Plan the problem" formula-sheet drill | Very low (no direct test; rationale only) | Rohrer 2015 rationale |
| R7 | S4 high | Do not add self-explanation prompts to worked examples by default | Moderate | Barbieri 2023 (conflicts with Bisra 2018 in general tasks) |
| R8 | S3 conceptual high or S6 high | Application/inference practice questions; elaborative "why" prompts | Moderate | Pan & Rickard 2018; Jensen 2014; Dunlosky 2013; Bisra 2018 |
| R9 | S6 high | Step-through segmented figures with narration | Low to Moderate (overall animation effect is small; pacing in step-through form untested) | Berney 2016; Noetel 2022 |
| R10 | S7 high | Structure atlas with interleaved comparison of similar structures | Low (indirect: visual category learning, ECG) | Brunmair 2019 (visual materials); Hatala 2003 |
| R11 | Q1 > 0 | Polls as practice items, plus rephrased variants | Moderate for factual MC; Low for conceptual | Shapiro & Gordon 2012; Yang 2021 (rephrased g = 0.558) |
| R12 | S1, T4, Q2 give a format | Practice mainly in the predicted exam format, with some items in other formats | Moderate | Yang 2021 (format match 0.531 vs 0.399); Lundeberg & Fox 1991; Morris 1977 |
| R13 | T1 cues on a topic | Increase practice weight on cued topics without removing uncued topics; weight depends on V1 for this professor (none until V1 exists) | Very low for cue validity; Moderate for keeping coverage | No validity study found; Yang 2021 (untested g = 0.321) |
| R14 | Quiz within days | Cram mode as a final relearning session over material already practiced with spacing | Low | Cepeda 2008 (optimal gap shrinks with shorter test delay); Rawson & Dunlosky 2013 |
| R15 | Any course | Log confidence; resurface high-confidence errors | Low to Moderate (laboratory) | Butterfield & Metcalfe 2001 |

### 7c. Updating rules with the student's own data

**What to log (per answer):** item ID; concept and topic ID; feature and mode; randomized arm; timestamp; response time; correct or not; confidence; attempt number; whether it was the first attempt in that session. **Per exam:** item-level results mapped to concept IDs (or topic-level scores if items are not returned); exam date. **Per course:** one delayed retention probe on a fixed sample of concepts from both arms, at a predeclared time after the exam; time spent per arm; the student's rating of each feature; his notes.

**Comparison to run (per course):**
1. Before the course, list the concepts eligible for a feature (for example all drugs in tables). Stratify by topic and by difficulty, then randomly assign whole concept clusters to arm A (the new feature) or arm B (the current default). Write the assignment and the planned analysis to a file before any studying (preregistration in the CENT/Kratochwill & Levin sense).
2. Primary outcome: proportion correct on exam items mapped to each arm. Secondary: delayed retention probe. Cost: minutes of study per concept in each arm.
3. Analysis: (a) a randomization test that re-shuffles the arm labels over clusters many times to obtain the probability of a difference at least as large by chance; (b) a Bayesian estimate of the difference (for example Beta-binomial per arm, or a logistic model with items as random effects per Judd et al. 2012), reported as a posterior interval; (c) the same under two predeclared priors.
4. Before the course, compute and record the smallest difference this number of items can detect, so that an inconclusive result is reported as "not enough items" rather than "no effect".

**When a rule changes (decision rule):** with a ROPE of width w set by Louis (the smallest difference in proportion correct worth the time cost):
- If the posterior interval for the difference lies entirely above +w in at least R courses (R set by Louis), the personal label becomes "Supports", and the kit proposes keeping the feature as default for matching material.
- If it lies entirely inside the ROPE, the label becomes "No meaningful difference"; the kit proposes keeping whichever arm costs less time.
- If it lies entirely below -w, the label becomes "Against", and the kit proposes retiring that feature version for this material type.
- Otherwise the label is "Inconclusive", and the test continues next term.
- Pooled across courses with a hierarchical model, so one course does not decide alone.
- For transcript cues (R13): after each exam, update V1 for that professor; the cue weight for that professor is set from V1 precision and recall, starting at zero weight.
- Following the project's "flag, don't decide" rule, the kit writes proposed rule changes, with the data, to the open-questions file for Louis to approve.

**How to report confidence:** each recommendation shows (1) the rule and its signals with counts, (2) the literature evidence level and sources, (3) the personal label with the item counts per arm and the posterior interval, (4) the student's rating shown separately and marked as a rating, not a measure of learning.

### 7d. What has no direct evidence

- That professor transcript cues ("this will be on the exam") predict exam content: no study found. Measured by V1.
- The "plan the problem" drill, the functional-group structure atlas, cram mode as a separate feature, and step-through (learner-paced) figures as implemented: no direct tests found.
- Combinations of features (for example interleaving plus worked examples plus spacing in one drill): the meta-analyses test single techniques.
- Effects in pharmacy courses specifically, except drug-name spacing (Terenyi 2018) and health-professions testing (Green 2018).
- Effect sizes for one particular learner: the literature gives averages over people; the kit has to measure the individual effect.
- The values of w, R and the delay of the retention probe: these are judgments about cost and benefit, not findings.
- Contracting vs expanding spacing schedules: one study (Terenyi 2018) favors contracting; I found no replication.

---

## 8. Open questions

1. Can Louis obtain item-level exam results (returned exams or item reports), or only total scores? Item-level results are needed for the per-arm comparison; topic-level scores allow only a weaker version.
2. Is it acceptable to assign some concepts to the current default method instead of a new feature before a real exam? The cost is that those concepts get the method expected to be weaker.
3. What smallest difference (w) in proportion correct is worth the extra time a feature takes, and how many courses (R) should agree before a rule changes?
4. When should the delayed retention probe run (for example at the start of the next term), and on how many concepts?
5. Should the kit collect the student's rating of each feature, given that ratings will be shown but not used as evidence of learning?
6. Which drug-name and functional-group lexicons should the signal script use, and who maintains them?
7. Should conceptual polls be drilled verbatim, given that the support for clicker questions is mainly for factual items and a later study reportedly found no conceptual benefit (abstract not retrieved)?
8. The step-through animation evidence favors system-paced animation (Berney 2016); should the kit compare step-through vs auto-play on randomly assigned figures?

---

## 9. Sources

Format: authors (year). Title. Journal volume(issue):pages. DOI or URL. Access.

**Question 1**
- Dunlosky J, Rawson KA, Marsh EJ, Nathan MJ, Willingham DT (2013). Improving students' learning with effective learning techniques: promising directions from cognitive and educational psychology. Psychological Science in the Public Interest 14(1):4-58. https://doi.org/10.1177/1529100612453266. ABS (PubMed) and FT for one section (elaborative interrogation overall assessment, from https://www.whz.de/fileadmin/lehre/hochschuldidaktik/docs/dunloskiimprovingstudentlearning.pdf). The per-cell ratings of its Table 4 could not be verified and are not used.
- Brunmair M, Richter T (2019). Similarity matters: a meta-analysis of interleaved learning and its moderators. Psychological Bulletin 145(11):1029-1052. https://doi.org/10.1037/bul0000209. ABS.
- Rowland CA (2014). The effect of testing versus restudy on retention: a meta-analytic review of the testing effect. Psychological Bulletin 140(6):1432-1463. https://doi.org/10.1037/a0037559. ABS.
- Pan SC, Rickard TC (2018). Transfer of test-enhanced learning: meta-analytic review and synthesis. Psychological Bulletin 144(7):710-756. https://doi.org/10.1037/bul0000151. ABS.
- Cepeda NJ, Pashler H, Vul E, Wixted JT, Rohrer D (2006). Distributed practice in verbal recall tasks: a review and quantitative synthesis. Psychological Bulletin 132(3):354-380. https://doi.org/10.1037/0033-2909.132.3.354. ABS.
- Cepeda NJ, Vul E, Rohrer D, Wixted JT, Pashler H (2008). Spacing effects in learning: a temporal ridgeline of optimal retention. Psychological Science 19(11):1095-1102. https://doi.org/10.1111/j.1467-9280.2008.02209.x. ABS.
- Yang C, Luo L, Vadillo MA, Yu R, Shanks DR (2021). Testing (quizzing) boosts classroom learning: a systematic and meta-analytic review. Psychological Bulletin 147(4):399-435. https://doi.org/10.1037/bul0000309. ABS (PubMed) and FT for Table 2 (read from a third-party copy, https://gwern.net/doc/psychology/spaced-repetition/2021-yang.pdf).
- Barbieri CA, Miller-Cotto D, Clerjuste SN, Chawla K (2023). A meta-analysis of the worked examples effect on mathematics performance. Educational Psychology Review 35:11. https://doi.org/10.1007/s10648-023-09745-1. ABS.
- Bisra K, Liu Q, Nesbit JC, Salimi F, Winne PH (2018). Inducing self-explanation: a meta-analysis. Educational Psychology Review 30(3):703-725. https://doi.org/10.1007/s10648-018-9434-x. ABS.
- Noetel M, Griffith S, Delaney O, Harris NR, Sanders T, Parker P, del Pozo Cruz B, Lonsdale C (2022). Multimedia design for learning: an overview of reviews with meta-meta-analysis. Review of Educational Research 92(3):413-454. https://doi.org/10.3102/00346543211052329 (DOI from a web search result); ERIC record https://eric.ed.gov/?id=EJ1338120. ABS (ERIC, truncated) and WEB (search-result summary for the final sentence).
- Berney S, Bétrancourt M (2016). Does animation enhance learning? A meta-analysis. Computers & Education 101:150-167. https://doi.org/10.1016/j.compedu.2016.06.005. ABS (https://archive-ouverte.unige.ch/unige:92234).
- Sweller J, van Merriënboer JJG, Paas F (2019). Cognitive architecture and instructional design: 20 years later. Educational Psychology Review (volume and pages not retrieved). https://eric.ed.gov/?id=EJ1217401. ABS.
- Kalyuga S (2007). Expertise reversal effect and its implications for learner-tailored instruction. Educational Psychology Review (volume and pages not retrieved). https://eric.ed.gov/?id=EJ785056. ABS.
- van Gog T, Sweller J (2015). Not new, but nearly forgotten: the testing effect decreases or even disappears as the complexity of learning materials increases. Educational Psychology Review 27(2):247-264. https://doi.org/10.1007/s10648-015-9310-x. ABS.
- Karpicke JD, Aue WR (2015). The testing effect is alive and well with complex materials. Educational Psychology Review 27(2):317-326. https://doi.org/10.1007/s10648-015-9309-3. ABS.
- Rohrer D, Dedrick RF, Stershic S (2015). Interleaved practice improves mathematics learning. Journal of Educational Psychology (volume and pages not retrieved). https://eric.ed.gov/?id=EJ1071568. ABS.
- Hatala RM, Brooks LR, Norman GR (2003). Practice makes perfect: the critical role of mixed practice in the acquisition of ECG interpretation skills. Advances in Health Sciences Education 8(1):17-26. https://doi.org/10.1023/a:1022687404380. ABS.
- Terenyi J, Anksorus H, Persky AM (2018). Impact of spacing of practice on learning brand name and generic drugs. American Journal of Pharmaceutical Education 82(1):6179. https://doi.org/10.5688/ajpe6179. ABS.
- Green ML, Moeller JJ, Spak JM (2018). Test-enhanced learning in health professions education: a systematic review: BEME Guide No. 48. Medical Teacher 40(4):337-350. https://doi.org/10.1080/0142159X.2018.1430354. ABS.
- Larsen DP, Butler AC, Roediger HL (2009). Repeated testing improves long-term retention relative to repeated study: a randomised controlled trial. Medical Education 43(12):1174-1181. https://doi.org/10.1111/j.1365-2923.2009.03518.x. ABS.
- Kerfoot BP, DeWolf WC, Masser BA, Church PA, Federman DD (2007). Spaced education improves the retention of clinical knowledge by medical students: a randomised controlled trial. Medical Education 41(1):23-31. https://doi.org/10.1111/j.1365-2929.2006.02644.x. ABS.
- Versteeg M, Hendriks RA, Thomas A, Ommering BWC, Steendijk P (2020). Conceptualising spaced learning in health professions education: a scoping review. Medical Education 54(3):205-216. https://doi.org/10.1111/medu.14025. ABS.
- Rawson KA, Dunlosky J (2013). Relearning attenuates the benefits and costs of spacing. Journal of Experimental Psychology: General 142(4):1113-1129. https://doi.org/10.1037/a0030498. ABS.
- Vaughn KE, Dunlosky J, Rawson KA (2016). Effects of successive relearning on recall: does relearning override the effects of initial learning criterion? Memory & Cognition 44(6):897-909. https://doi.org/10.3758/s13421-016-0606-y. ABS.
- Rawson KA, Vaughn KE, Walsh M, Dunlosky J (2018). Investigating and explaining the effects of successive relearning on long-term retention. Journal of Experimental Psychology: Applied 24(1):57-71. https://doi.org/10.1037/xap0000146. ABS.
- Lindsey RV, Shroyer JD, Pashler H, Mozer MC (2014). Improving students' long-term knowledge retention through personalized review. Psychological Science 25(3):639-647. https://doi.org/10.1177/0956797613504302. ABS.

**Question 2**
- Morris CD, Bransford JD, Franks JJ (1977). Levels of processing versus transfer appropriate processing. Journal of Verbal Learning and Verbal Behavior 16(5):519-533. https://doi.org/10.1016/S0022-5371(77)80016-9. ABS.
- Lundeberg MA, Fox PW (1991). Do laboratory findings on test expectancy generalize to classroom outcomes? Review of Educational Research 61(1):94-106. https://eric.ed.gov/?id=EJ425123. ABS.
- Adesope OO, Trevisan DA, Sundararajan N (2017). Rethinking the use of tests: a meta-analysis of practice testing. Review of Educational Research 87(3):659-701. https://eric.ed.gov/?id=EJ1141817. ABS (no numbers in the abstract; not used for figures).
- Jensen JL, McDaniel MA, Woodard SM, Kummer TA (2014). Teaching to the test… or testing to teach: exams requiring higher order thinking skills encourage greater conceptual understanding. Educational Psychology Review 26(2):307-329 (volume, pages and DOI from the reference list of Karpicke & Aue 2015). https://doi.org/10.1007/s10648-013-9248-9; https://eric.ed.gov/?id=EJ1036773. ABS.
- Biggs J (1996). Enhancing teaching through constructive alignment. Higher Education (volume and pages not retrieved). https://eric.ed.gov/?id=EJ534311. ABS.
- Shapiro AM, Gordon LT (2012). A controlled study of clicker-assisted memory enhancement in college classrooms. Applied Cognitive Psychology 26(4):635-643. https://doi.org/10.1002/acp.2843. FT (Method and Results passages via Wiley Scholar Gateway).
- Shapiro AM, Sims-Knight J, O'Rielly GV, Capaldo P, Pedlow T, Gordon L, Monteiro K (2017). Clickers can promote fact retention but impede conceptual understanding. Computers & Education 111:44-59. https://doi.org/10.1016/j.compedu.2017.03.017. WEB (search-result summaries only; abstract not retrieved).
- Titsworth BS, Kiewra KA (2004). Spoken organizational lecture cues and student notetaking as facilitators of student learning. Contemporary Educational Psychology 29(4):447-461. https://doi.org/10.1016/j.cedpsych.2003.12.001. ABS.
- Boyle JR (2012). Note-taking and secondary students with learning disabilities: challenges and solutions. Learning Disabilities Research & Practice 27(2):90-101. https://doi.org/10.1111/j.1540-5826.2012.00354.x. FT (one passage via Wiley Scholar Gateway).

**Question 3**
- Barlow DH, Hayes SC (1979). Alternating treatments design: one strategy for comparing the effects of two treatments in a single subject. Journal of Applied Behavior Analysis 12(2):199-210. https://doi.org/10.1901/jaba.1979.12-199. ABS.
- Kratochwill TR, Levin JR (2010). Enhancing the scientific credibility of single-case intervention research: randomization to the rescue. Psychological Methods 15(2):124-144. https://doi.org/10.1037/a0017736. ABS.
- Vohra S, Shamseer L, Sampson M, et al. (2015). CONSORT extension for reporting N-of-1 trials (CENT) 2015 Statement. BMJ 350:h1738. https://doi.org/10.1136/bmj.h1738. Metadata only.
- Judd CM, Westfall J, Kenny DA (2012). Treating stimuli as a random factor in social psychology: a new and comprehensive solution to a pervasive but largely ignored problem. Journal of Personality and Social Psychology 103(1):54-69. https://doi.org/10.1037/a0028347. ABS.
- Zucker DR, Schmid CH, McIntosh MW, D'Agostino RB, Selker HP, Lau J (1997). Combining single patient (N-of-1) trials to estimate population treatment effects and to evaluate individual patient responses to treatment. Journal of Clinical Epidemiology 50(4):401-410. https://doi.org/10.1016/s0895-4356(96)00429-5. ABS.
- Zucker DR, Ruthazer R, Schmid CH (2010). Individual (N-of-1) trials can be combined to give population comparative treatment effect estimates: methodologic considerations. Journal of Clinical Epidemiology 63(12):1312-1323. https://doi.org/10.1016/j.jclinepi.2010.04.020. ABS.
- Barnett AG, van der Pols JC, Dobson AJ (2005). Regression to the mean: what it is and how to deal with it. International Journal of Epidemiology 34(1):215-220. https://doi.org/10.1093/ije/dyh299. ABS.
- Kibble J (2007). Use of unsupervised online quizzes as formative assessment in a medical physiology course: effects of incentives on student participation and performance. Advances in Physiology Education 31(3):253-260. https://doi.org/10.1152/advan.00027.2007. ABS.
- Clark RE (1983). Reconsidering research on learning from media. Review of Educational Research (volume and pages not retrieved). https://eric.ed.gov/?id=EJ294173. ABS.
- Popham WJ (1962). The influence of novelty effect upon teaching machine learning. ERIC report. https://eric.ed.gov/?id=ED003605. ABS.

**Question 4**
- Guyatt GH, Oxman AD, Vist GE, Kunz R, Falck-Ytter Y, Alonso-Coello P, Schünemann HJ (2008). GRADE: an emerging consensus on rating quality of evidence and strength of recommendations. BMJ 336(7650):924-926. https://doi.org/10.1136/bmj.39489.470347.AD. ABS.
- Balshem H, Helfand M, Schünemann HJ, et al. (2011). GRADE guidelines: 3. Rating the quality of evidence. Journal of Clinical Epidemiology 64(4):401-406. https://doi.org/10.1016/j.jclinepi.2010.07.015. ABS.
- Education Endowment Foundation. Teaching and Learning Toolkit. https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit. WEB.
- Rafferty A, Ying H, Williams JJ (2019). Statistical consequences of using multi-armed bandits to conduct adaptive educational experiments. Journal of Educational Data Mining 11(1):47-79. https://doi.org/10.5281/zenodo.3554749. ABS.
- Williams JJ, Nogas J, Deliu N, Shaikh H, Villar SS, Durand A, Rafferty A (2021). Challenges in statistical analysis of data collected by a bandit algorithm: an empirical exploration in applications to adaptively randomized experiments. arXiv:2103.12198. https://arxiv.org/abs/2103.12198. ABS.
- Nie X, Tian X, Taylor J, Zou J (2018). Why adaptively collected data have negative bias and how to correct for it. arXiv:1708.01977. https://arxiv.org/abs/1708.01977. ABS.
- Villar SS, Bowden J, Wason J (2015). Multi-armed bandit models for the optimal design of clinical trials: benefits and challenges. Statistical Science 30(2):199-215. https://doi.org/10.1214/14-STS504 (citation from a web search result); arXiv:1507.08025. ABS.
- Russo D, Van Roy B, Kazerouni A, Osband I, Wen Z (2017). A tutorial on Thompson sampling. arXiv:1707.02038. https://arxiv.org/abs/1707.02038. ABS.
- Kruschke JK (2018). Rejecting or accepting parameter values in Bayesian estimation. Advances in Methods and Practices in Psychological Science 1(2):270-280 (citation from a web search result). https://doi.org/10.1177/2515245918771304. ABS (https://scholarworks.iu.edu/dspace/items/bada026d-fe1b-4f53-ad5b-db6e8bf99711).

**Question 5**
- Kornell N, Bjork RA (2008). Learning concepts and categories: is spacing the "enemy of induction"? Psychological Science 19(6):585-592. https://doi.org/10.1111/j.1467-9280.2008.02127.x. ABS.
- Yan VX, Bjork EL, Bjork RA (2016). On the difficulty of mending metacognitive illusions: a priori theories, fluency effects, and misattributions of the interleaving benefit. Journal of Experimental Psychology: General 145(7):918-933. https://doi.org/10.1037/xge0000177. ABS.
- Kirk-Johnson A, Galla BM, Fraundorf SH (2019). Perceiving effort as poor learning: the misinterpreted-effort hypothesis of how experienced effort and perceived learning relate to study strategy choice. Cognitive Psychology 115:101237. https://doi.org/10.1016/j.cogpsych.2019.101237. ABS.
- Deslauriers L, McCarty LS, Miller K, Callaghan K, Kestin G (2019). Measuring actual learning versus feeling of learning in response to being actively engaged in the classroom. PNAS 116(39):19251-19257. https://doi.org/10.1073/pnas.1821936116. ABS.
- Karpicke JD, Butler AC, Roediger HL (2009). Metacognitive strategies in student learning: do students practise retrieval when they study on their own? Memory 17(4):471-479. https://doi.org/10.1080/09658210802647009. ABS.
- Bjork RA, Dunlosky J, Kornell N (2013). Self-regulated learning: beliefs, techniques, and illusions. Annual Review of Psychology 64:417-444. https://doi.org/10.1146/annurev-psych-113011-143823. ABS.
- Hartwig MK, Dunlosky J (2012). Study strategies of college students: are self-testing and scheduling related to achievement? Psychonomic Bulletin & Review 19(1):126-134. https://doi.org/10.3758/s13423-011-0181-y. ABS.
- Davis DA, Mazmanian PE, Fordis M, Van Harrison R, Thorpe KE, Perrier L (2006). Accuracy of physician self-assessment compared with observed measures of competence: a systematic review. JAMA 296(9):1094-1102. https://doi.org/10.1001/jama.296.9.1094. ABS.
- Blasiman RN, Dunlosky J, Rawson KA (2017). The what, how much, and when of study strategies: comparing intended versus actual study behaviour. Memory 25(6):784-792. https://doi.org/10.1080/09658211.2016.1221974. ABS.
- Butterfield B, Metcalfe J (2001). Errors committed with high confidence are hypercorrected. Journal of Experimental Psychology: Learning, Memory, and Cognition 27(6):1491-1494. https://doi.org/10.1037//0278-7393.27.6.1491. ABS.

**Search notes**
- Searches used PubMed, Firecrawl (research index, web search, page reads), Wiley Scholar Gateway, the ERIC API, and web search. Consensus was rate-limited after one query and was not used as a source. Direct downloads from journal sites were blocked by the session network; journal pages were read through Firecrawl.
