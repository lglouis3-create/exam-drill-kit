/* concept-statuses: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * On the course's own data (node, the engine with a stub page): the page carries
 * the module, working; every concept of the bank has a readable name; an answer to
 * a question no longer in the bank reaches no concept.
 * On a scratch copy of the course that holds FIX (below): 7 of Basic-Pharmacokinetics'
 * questions of the topic "infusion", that topic, the lecture they cite and the skill the
 * course lacks, from src/q3_module3.js, src/q13_quizzes.js, src/q1_module1.js and
 * src/course.js at ac2eb73. The wording and every field are the course's own, and
 * each id is the course's own with the prefix cst- (PFX below), so another module's
 * copy of the same question never shares an id with this one; `prof` is the course's first professor ("Professor" in
 * FIX), and `teachImg` is left out (the kit has none of the course's slide images, and
 * the core's test.js stops on a teachImg missing from images.json). A course made by
 * ci/oncourse.js already holds FIX, and the test then uses the course's copy.
 * inf-n1, inf-n2 and inf-n4 carry plan-the-problem `setup` lines, which name the
 * equations "css" and "cp-infusing", and `asks` keys: WRITE keeps a `setup` only when
 * the course's EQUATIONS has every equation it names, and an `asks` only when the
 * course's ASKS has the key, so the scratch copy builds whatever other modules the
 * course has on. In Chromium:
 *   - Basic-Pharmacokinetics' src/test.js section 4c ported: the 13 synthetic logs
 *     give the statuses, mastery starts the spaced check at the mastery box at the
 *     pace's intervals and each further solid answer moves it up one, a concept
 *     mastered 40 days ago is due and one mastered minutes ago is not, the evidence
 *     line gives exact counts;
 *   - this kit's additions: a correct answer marked "Not sure" is a miss (the core's
 *     solidEntry), the weekly pace's days are used on that pace, "Ask everything"
 *     does not list a fresh mastered concept as due, a concept the scheduler does not
 *     have due is not listed, a select-all answer counts only its wrong options, a
 *     matching answer names the wrong pairs, only wrong options chosen more than once
 *     are listed as repeated, no {{frac:...}} markup is shown on a card (with and
 *     without formulas-in-text), the course's `words` option names the concept;
 *   - Basic-Pharmacokinetics' src/sweep_test.py concept_check ported, at 390 and
 *     1100 px, light and dark: the struggling card first, then the unfamiliar one,
 *     with the option chosen 3 times and its why, the exact evidence line, the most
 *     common kind of miss on a calculation, the mastered concept folded away and listed
 *     as due, no undefined or NaN, the cards inside the width, Practice this concept
 *     opens a quiz on that concept;
 *   - this kit's additions: the section sits after "This session" and before "What
 *     to review next"; 8 weak concepts are shown and the rest folded; drawing it changes
 *     neither the scheduler's records nor the saved progress, with and without the
 *     scheduler's records; Check and Run the check start a one-question review; with no
 *     answers there is no section; no page error;
 *   - persistence, with an answer history of 4100 answers and one more answered on the
 *     page (the core keeps the last 4000): the statuses are read from the 4000 kept;
 *     Export progress, then Import progress in a fresh browser profile, gives the same
 *     statuses and the same section; a profile switch keeps each profile's statuses;
 *     a reload 400 ms after an answer keeps it, and what a reload 50 ms after an answer
 *     keeps is reported (the core saves 150 ms after the last change); with storage full
 *     (QuotaExceededError) and with storage denied, the notice is shown, the saved
 *     progress is not overwritten, and after storage works again it loads unchanged.
 *
 *     node features/concept-statuses/test.js
 */
const fs = require('fs'), os = require('os'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/concept-statuses/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

/* Basic-Pharmacokinetics at ac2eb73, the topic "infusion": inf-c11 (src/q3_module3.js) and
   cq2-4 (src/q13_quizzes.js), two wordings of one concept; inf-c5, single answer, a why on
   each wrong option, ratios in them; inf-n1, a calculation; inf-c4, inf-n2 and inf-n4, three
   more concepts of the topic (src/q3_module3.js); the topic from TOPICS (src/q1_module1.js);
   lecture L04 and the skills recall, apply and infusion from src/course.js. Chosen so that
   no text names the professor or uses a pronoun for the professor, no stem trips the core
   checks, and every dupOf is in FIX (scripts/extract_fix.js reports each). Taken
   verbatim with scripts/extract_fix.js (evidence/concept-statuses); the one change to the
   data is `prof` set to the template's "Professor", and `teachImg` is left out (see above).
   ../ci/oncourse.js reads FIX and WRITE from this file. */
const FIX = {"qs":[{"id":"inf-c4","prof":"Professor","tier":"new","exam":1,"module":3,"lecture":"L04","topic":"infusion","sub":"css","concept":"time-to-css","skill":"recall","source":"both","stem":"A drug is given by continuous intravenous infusion with no loading dose. How long does it take to reach steady state?","options":[{"t":"Three to five half-lives","correct":true,"why":"Each half-life closes half of the remaining gap to the plateau, so three half-lives reach 87.5 per cent of steady state and five reach about 96.9 per cent, close enough to treat the level as steady. The answer depends only on the half-life, so no other parameter appears."},{"t":"Three to five hours","correct":false,"why":"Picking this reads three to five half-lives as a number of hours. The approach is measured in half-lives, which differ between drugs: one with a one-hour half-life is near steady state within five hours, while one with a twelve-hour half-life is far from it. Quoting hours drops the parameter that sets the time."},{"t":"Three to five times the infusion rate","correct":false,"why":"The infusion rate is an amount per unit time and multiplying it by a number does not give a time. The rate sets how high the plateau is, not how long it takes to arrive. This confuses the two questions the infusion curve answers."},{"t":"It depends on the size of the loading dose","correct":false,"why":"Picking this attaches the time course to the dose rather than to the half-life. The stem states that no loading dose is given, and a loading dose in any case fills the body at once rather than changing how the infusion approaches its plateau, which is governed by k alone."}],"teach":[{"h":"The idea","list":["The fraction of steady state reached after infusing for a time t is 1 − e^(−kt), where k is the elimination rate constant.","With t counted in half-lives that fraction is the same for every drug: 50 per cent after one, 75 after two, 87.5 after three.","In practice the level is called steady after three to five half-lives.","A more precise question, such as the time to 90 or 95 per cent, needs a calculation: 0.9 = 1 − e^(−kt) gives t = {{frac:ln 10|k}}."]},{"h":"Where to read more","t":"3IntravenousInfusions.pdf, slide \"Drug Concentration at Steady-State\"."}],"cite":"3IntravenousInfusions.pdf, slide \"Drug Concentration at Steady-State\"; 09-02 lecture","quote":"if I ask you how long it takes to get steady state following IV infusion, the simplest answer. Is 3 to 5 half-lives"},{"id":"inf-c5","prof":"Professor","tier":"new","exam":1,"module":3,"lecture":"L04","topic":"infusion","sub":"css","concept":"rate-vs-time-to-css","skill":"apply","source":"both","stem":"If the rate of a continuous intravenous infusion is doubled, what is the expected change to the time needed to reach steady state?","options":[{"t":"The time to reach steady state will not change.","correct":true,"why":"The plateau is infusion rate divided by clearance, and clearance is constant for the patient, so doubling the rate doubles the plateau. The approach follows one minus e to the minus kt, which has no rate term, so the curve rises higher but reaches its new plateau at the same time."},{"t":"The time to reach steady state will double.","why":"Picking this reads the plateau and its arrival time as moving together. Doubling the rate R doubles Css = {{frac:R|Cl}}, but the approach follows 1 − e^(−kt), with k the elimination rate constant, which has no rate term. The curve climbs twice as high in the same time."},{"t":"The time to reach steady state will be halved.","why":"Picking this reads a faster input as a faster arrival. The approach to steady state follows 1 − e^(−kt), where k is the elimination rate constant, and has no rate term, so the time stays at three to five half-lives. A faster infusion reaches a higher plateau, Css = {{frac:R|Cl}}, in the same time."},{"t":"The steady-state concentration will not change.","why":"This answer swaps the two quantities the infusion curve answers for. The steady-state concentration does change: Css = {{frac:R|Cl}} is proportional to the rate R, so doubling the rate doubles Css. What does not change is the time to reach it, which the half-life alone sets; the plateau moves and the clock does not."}],"teach":[{"h":"The idea","list":["Two parts of the infusion equation answer two different questions.","{{frac:R|Cl}} (R the infusion rate, Cl the clearance) sets how high the plateau sits, so it responds to the infusion rate.","1 − e^(−kt) sets how far along the climb the concentration is, so it responds only to k, the elimination rate constant, and so to the half-life.","Changing the rate moves the plateau and leaves the time to reach it, three to five half-lives, unchanged."]},{"h":"Where to read more","t":"3IntravenousInfusions.pdf, slide \"Drug Concentration at Steady-State\"."}],"cite":"3IntravenousInfusions.pdf, slide \"Drug Concentration at Steady-State\"; 09-02 and 09-09 lectures","quote":"changing the rate changes our steady state concentration … it has no impact, right? Because it is three to five half-lives"},{"id":"inf-c11","prof":"Professor","tier":"new","exam":1,"module":3,"lecture":"L04","topic":"infusion","sub":"load","concept":"loading-purpose","skill":"recall","source":"both","stem":"What is the purpose of giving an intravenous loading dose at the start of a continuous infusion?","options":[{"t":"To reach the target steady-state concentration almost immediately","correct":true,"why":"Without a loading dose the concentration has to climb over three to five half-lives, which is unacceptable for a drug that is needed now. A bolus of the amount present at steady state reaches that level at once, and the infusion then holds it. The loading dose saves time; it does not raise the level."},{"t":"To raise the steady-state concentration above what the infusion alone would give","correct":false,"why":"The plateau is set by infusion rate and clearance, and a single bolus changes neither; the bolus is eliminated like the infused drug and adds nothing to the rate coming in. Choosing this treats the loading dose as extra drug that stays, when it only saves the time spent climbing to the plateau."},{"t":"To shorten the elimination half-life so that steady state arrives sooner","correct":false,"why":"Half-life is a property of the drug and the patient and no dose changes it. The loading dose does not make the approach to the plateau faster; it starts the patient at the plateau so that no approach is needed. Confusing those two is the reason this option is tempting."},{"t":"To allow a lower infusion rate to be used for the same effect","correct":false,"why":"The maintenance rate is fixed by the target concentration and the clearance; lowering it would let the level fall away from the target once the loading dose is eliminated. Picking this treats the total drug given, rather than the rate, as what matters."}],"teach":[{"h":"The idea","list":["A loading dose and an infusion rate answer two separate questions.","The rate sets where the concentration settles, because the plateau is the rate divided by clearance.","The loading dose sets how soon it gets there, by putting the steady-state amount into the body at once.","So DL (loading dose) = Css × VD, the steady-state concentration times the volume of distribution; equivalently {{frac:R|k}}, once R has been chosen for that target."]},{"h":"Where to read more","t":"3IntravenousInfusions.pdf, slide \"IV Bolus Loading Dose and Continuous IV Infusion\"."}],"cite":"3IntravenousInfusions.pdf, slide \"IV Bolus Loading Dose and Continuous IV Infusion\"","quote":"We want the loading dose to look like the amount of drug that’s in the body at steady state."},{"id":"cq2-4","prof":"Professor","tier":"new","exam":1,"module":3,"lecture":"L04","topic":"infusion","sub":"load","concept":"loading-purpose","skill":"recall","dupOf":"inf-c11","stem":"Why is a loading dose used?","options":[{"t":"To immediately obtain a therapeutic plasma concentration","correct":true,"why":"An infusion alone takes three to five half-lives to reach steady state. A loading dose puts the steady-state amount, Css × VD (the steady-state concentration times the apparent volume of distribution), into the body at once, so the therapeutic level is there from the start and the infusion then holds it."},{"t":"To reduce the adverse effects associated with the drug","correct":false,"why":"Picking this reads a dosing device as a safety device. A loading dose raises the concentration faster, which brings any concentration-related adverse effect forward rather than reducing it. The plateau Css = {{frac:R|Cl}} depends on the infusion rate R and clearance Cl, not on the loading dose."},{"t":"To improve patient adherence","correct":false,"why":"This answer confuses a kinetic quantity with a behavioural one. Adherence concerns how reliably a patient takes a regimen over days or weeks. A loading dose is a one-time amount, Css × VD, chosen so the target level exists from the first minute; it says nothing about how reliably later doses are taken."},{"t":"To reduce the elimination half-life","correct":false,"why":"Picking this reads the half-life as something a dose can shorten. The half-life is a property of the drug and the patient, set by k = {{frac:Cl|VD}}, where k is the elimination rate constant. No dose changes k, Cl or VD; a loading dose only changes how soon the target concentration is reached."}],"teach":[{"h":"The idea","list":["The time to steady state is set by the half-life alone: three to five half-lives, whatever the rate.","When that wait is too long, a loading dose DL = Css × VD supplies the steady-state amount at once.","DL = Css × VD because Cp = {{frac:DB|VD}}: the amount in the body at the plateau is the target concentration times the volume it spreads through.","With the right loading dose the level stays flat at Css: the bolus part falls as C0e^(−kt) while the infusion part rises as Css(1 − e^(−kt)), and the two add to Css at every time."]}],"cite":"Canvas Quiz 2 (Modules 2–3), question 4; 3IntravenousInfusions.pdf, slide \"IV Bolus Loading Dose and Continuous IV Infusion\""},{"id":"inf-n1","type":"numeric","prof":"Professor","tier":"new","exam":1,"module":3,"lecture":"L04","topic":"infusion","sub":"css","concept":"css-from-rate","skill":"infusion","source":"both","stem":"Theophylline is given by continuous intravenous infusion at 50 mg/hr. Its half-life is 6 hours and its volume of distribution is 30 L. What steady-state plasma concentration is expected?","units":"mg/L","answer":14.43,"tol":0.2,"steps":[{"k":"setup","t":"Css = {{frac:R|Cl}}, and clearance is itself k · VD, so the half-life has to become a rate constant before the plateau can be computed","why":"At steady state rate in equals rate out, and rate out is clearance times concentration, so the plateau is infusion rate divided by clearance. The stem gives a half-life and a volume, not a clearance, so two conversions come before the division."},{"k":"algebra","t":"k = {{frac:0.693|6 hr}} = 0.1155 hr⁻¹","why":"The steady-state concentration needs a clearance, and clearance is the elimination rate constant multiplied by the volume of distribution, so the half-life has to be converted to a rate constant first. Dividing 0.693 by a time in hours leaves reciprocal hours, which is what a first-order rate constant must be."},{"k":"algebra","t":"Cl = k · VD = (0.1155 hr⁻¹)(30 L) = 3.465 L/hr","why":"Clearance is the volume of plasma cleared of drug per unit time, and it is the product of the fractional rate of removal and the volume that drug occupies. Reciprocal hours multiplied by litres leaves litres per hour, the unit a clearance must carry."},{"k":"algebra","t":"Css = {{frac:R|Cl}} = {{frac:50 mg/hr|3.465 L/hr}} = 14.43 mg/L","why":"At steady state the rate in equals the rate out, and the rate out is clearance multiplied by concentration, so the concentration is the infusion rate divided by clearance. Milligrams per hour divided by litres per hour cancels the hours and leaves milligrams per litre."},{"k":"round","t":"Css = 14.43 mg/L","why":"Report 14.43 mg/L, or about 14 mg/L. The two decimal places follow the four-figure rate constant used throughout."}],"setup":{"eq":"css","pre":["thalf-first","cl-k-vd"],"why":"\"continuous intravenous infusion at\" a rate, so the infusion block. Given R, t½ and VD, asked the \"steady-state plasma concentration\", so Css = {{frac:R|Cl}}. k first, from k = {{frac:0.693|t½}}, then Cl = k·VD, because the line wants Cl and the stem gives t½ and VD instead."},"asks":"Css","givens":[["R","50 mg/hr","the numerator of {{frac:R|Cl}}"],["t½","6 hours","gives k = {{frac:0.693|6}} = 0.1155 hr⁻¹"],["VD","30 L","with k gives Cl = 0.1155 × 30 = 3.465 L/hr, the denominator"]],"check":{"t":"k is 0.693 over 6, 0.1155 hr⁻¹, so Cl is 0.1155 × 30 = 3.465 L/hr; 50 mg/hr spread over 3.465 L/hr is a little over 14 mg/L, and 14.43 fits.","lo":0},"teach":[{"h":"The idea","list":["Steady state is where first-order removal matches the fixed input, so Css (steady-state concentration) = {{frac:R|Cl}}, with R the infusion rate.","When clearance is not given, it is built from the half-life and the volume of distribution: Cl = k × VD, with k = {{frac:0.693|t½}}.","Once those two constants are found, the calculation is one division."]},{"h":"Where to read more","t":"3IntravenousInfusions.pdf, slide \"Example 1\"."}],"cite":"3IntravenousInfusions.pdf, slide \"Example 1\"","quote":"What is the expected steady-state concentration of theophylline in a patient?"},{"id":"inf-n2","type":"numeric","prof":"Professor","tier":"new","exam":1,"module":3,"lecture":"L04","topic":"infusion","sub":"rate","concept":"rate-for-target-css","skill":"infusion","source":"both","stem":"The same drug has a half-life of 6 hours and a volume of distribution of 30 L. What infusion rate would achieve a steady-state concentration of 20 mg/L?","units":"mg/hr","answer":69.3,"tol":1,"steps":[{"k":"setup","t":"R = Css · Cl = Css · k · VD","why":"Rearranging Css equal to R over clearance puts the rate on its own, so the wanted concentration is multiplied rather than divided by clearance. Writing clearance as k times VD lets the two parameters given in the stem be used directly."},{"k":"algebra","t":"k = {{frac:0.693|6 hr}} = 0.1155 hr⁻¹","why":"The relation between rate and steady-state concentration runs through clearance, and clearance needs the rate constant. Converting the half-life first keeps every later line in reciprocal hours."},{"k":"algebra","t":"R = (20 mg/L)(0.1155 hr⁻¹)(30 L) = 69.3 mg/hr","why":"Milligrams per litre multiplied by reciprocal hours multiplied by litres cancels the litres and leaves milligrams per hour, which is the unit an infusion rate must have. The arithmetic is 20 times 3.465."},{"k":"round","t":"R = 69.3 mg/hr","why":"Report 69.3 mg/hr. One decimal place is what the four-figure rate constant supports. As a check, 69.3 divided by the clearance of 3.465 L/hr returns the 20 mg/L target."}],"setup":{"eq":"css","pre":["thalf-first","cl-k-vd"],"why":"\"infusion rate\" to achieve a \"steady-state concentration\", so the infusion block. Given Css, t½ and VD, asked R, so Css = {{frac:R|Cl}} rearranged to R = Css·Cl. k first, from k = {{frac:0.693|t½}}, then Cl = k·VD, because the line wants Cl."},"asks":"R","givens":[["t½","6 hours","gives k = {{frac:0.693|6}} = 0.1155 hr⁻¹"],["VD","30 L","with k gives Cl = 0.1155 × 30 = 3.465 L/hr"],["Css","20 mg/L","the target, multiplied by Cl"]],"check":{"t":"Cl is k × VD = 0.1155 × 30, about three and a half L/hr, and the rate has to replace what is cleared: 20 mg/L × Cl, about 69.3 mg/hr. A higher target needs a proportionally higher rate.","lo":0},"teach":[{"h":"The idea","list":["Choosing an infusion rate uses the steady-state relation in reverse: R = Css × Cl = Css × k × VD.","Target concentration times clearance gives the amount that must be delivered each hour to replace exactly what is removed each hour.","Clearance is constant for that patient, so rate and plateau are strictly proportional: doubling the target doubles the rate.","Changing R moves the plateau only; the time to reach it is unchanged."]}],"cite":"3IntravenousInfusions.pdf, slide \"Example 2\"","quote":"How would we alter the infusion rate to achieve a steady-state concentration of 20 mg/L?"},{"id":"inf-n4","type":"numeric","prof":"Professor","tier":"new","exam":1,"module":3,"lecture":"L04","topic":"infusion","sub":"time","concept":"time-to-percent-css","skill":"infusion","source":"both","stem":"A drug with an elimination rate constant of 0.15 hr⁻¹ is infused at a constant rate with no loading dose. How long must the infusion continue to reach 90% of the steady-state concentration?","units":"hr","answer":15.35,"tol":0.3,"steps":[{"k":"setup","t":"0.9 = 1 − e^(−kt)","why":"The fraction of steady state achieved is the bracket in the infusion equation, so reaching 90 per cent means setting that bracket equal to 0.9. The infusion rate and the clearance cancel out because both sides are fractions of the same plateau, which is why no rate appears anywhere in this calculation."},{"k":"algebra","t":"e^(−kt) = 1 − 0.9 = 0.1","why":"Subtracting 0.9 from both sides isolates the exponential. The 0.1 is the fraction of the gap still to be closed, which is the quantity the logarithm will act on."},{"k":"algebra","t":"t = {{frac:−ln(0.1)|k}} = {{frac:2.3026|0.15 hr⁻¹}} = 15.35 hr","why":"Taking natural logarithms of both sides brings the exponent down, and dividing by the rate constant isolates t. Dividing a pure number by a quantity in reciprocal hours leaves hours, which is the unit a time must have."},{"k":"round","t":"t = 15.35 hr","why":"Report 15.35 hr, or about 15 hours. As a check, that is 3.32 half-lives of 4.62 hr, the number of half-lives that 90 per cent of steady state always takes."}],"setup":{"eq":"cp-infusing","pre":[],"why":"\"infused at a constant rate with no loading dose\" and \"90% of the steady-state concentration\", so the concentration-during-infusion line solved for t. Given k and the fraction of Css, asked t, so 0.9 = 1 − e^(−kt) rearranged to t = −{{frac:ln(0.1)|k}}. {{frac:R|Cl}} cancels, so no hinge."},"asks":"t","givens":[["k","0.15 hr⁻¹","the denominator of {{frac:−ln(0.1)|k}}"],["fraction of Css","90%","so e^(−kt) = 0.1 and the numerator is −ln(0.1) = 2.3026"]],"check":{"t":"Reaching 90% of the plateau takes a little over three half-lives, and 0.693 over 0.15 is between 4 and 5 hr, so t lies between 13 and 17 hr; 15.35 hr fits.","lo":13.86,"hi":18.48},"teach":[{"h":"The idea","list":["A question that names a percentage of steady state is solved from the bracket 1 − e^(−kt) alone, because the plateau cancels.","Set the bracket equal to the target fraction, isolate the exponential and take logarithms: t = {{frac:−ln(1 − fraction)|k}}.","90% of Css takes 3.32 half-lives; 95% takes 4.32; 99% takes 6.64. None depends on the infusion rate, the dose or the volume of distribution."]}],"cite":"3IntravenousInfusions.pdf, slide \"Example 4\"","quote":"How long will the infusion have to be continued to achieve 90% steady-state?"}],"topics":[{"id":"infusion","name":"Intravenous infusion","prof":"Professor","cite":"3IntravenousInfusions.pdf, slide \"Objectives\"","subs":[{"id":"basics","name":"What an infusion does, and why the input is zero order","cite":"3IntravenousInfusions.pdf, slide \"Intravenous Infusion\""},{"id":"css","name":"Steady state and continuous dosing","cite":"3IntravenousInfusions.pdf, slide \"Drug Concentration at Steady-State\""},{"id":"pre","name":"Concentration before steady state is reached","cite":"3IntravenousInfusions.pdf, slides \"Drug Concentration Prior to Reaching Steady-State\""},{"id":"rate","name":"Infusion rate for a target steady-state concentration","cite":"3IntravenousInfusions.pdf, slide \"Objectives\", bullet 6"},{"id":"time","name":"Time to reach a stated fraction of steady state","cite":"3IntravenousInfusions.pdf, slide \"Example 4\""},{"id":"stop","name":"Concentration after the infusion is stopped","cite":"3IntravenousInfusions.pdf, slide \"Drug Concentration after an IV Infusion has Ended\""},{"id":"load","name":"Loading dose, alone and with a continuous infusion","cite":"3IntravenousInfusions.pdf, slides \"IV Bolus Loading Dose and Continuous IV Infusion\""}]}],"lecture":{"id":"L04","deck":"3IntravenousInfusions.pdf","label":"Module 3: Intravenous infusion (2 Sep)","prof":"Professor","exam":1,"module":3},"skills":[{"id":"recall","label":"Recall a definition or fact","short":"Recall","kind":"concept"},{"id":"apply","label":"Reason about a patient or a change","short":"Apply","kind":"concept"},{"id":"infusion","label":"Infusion rate and steady state","short":"Infusion","kind":"calc"}]};
/* Basic-Pharmacokinetics src/views.js CONCEPT_WORDS (line 2634, ac2eb73), verbatim, as the
   course's `words` option. */
const WORDS = {"999":"99.9%","vd":"VD","cl":"Cl","clr":"ClR","crcl":"CrCl","gfr":"GFR","ibw":"IBW","bw":"body weight","cmax":"Cmax","cmin":"Cmin","tmax":"tmax","c0":"C0","cp":"Cp","css":"Css","cavg":"Cavg","cav":"Cav","auc":"AUC","aucs":"AUCs","k":"k","ka":"ka","ke":"ke","kvd":"k × VD","thalf":"t½","tau":"τ","f":"F","fe":"fe","frel":"Frel","fabs":"Fabs","alpha":"α","beta":"β","vp":"Vp","db":"DB","d0":"D0","davg":"Davg","r":"R","mec":"MEC","pk":"PK","pd":"PD","adme":"ADME","iv":"IV","ph":"pH","ss":"steady state","halflife":"half-life","halflives":"half-lives","onecpt":"one-compartment","multicpt":"multicompartment","cpt":"compartment","defn":"definition","def":"definition","conc":"concentration","bioavail":"bioavailability","biexp":"biexponential","equiv":"equivalent","rel":"relative","params":"parameters","calc":"calculation","diffeq":"differential equation","cockcroft":"Cockcroft","gault":"Gault","henderson":"Henderson","hasselbalch":"Hasselbalch"};
/* Ids that cannot clash with another module's (rule 2 of the kit's CI data rules): every
   question, topic, subtopic and lecture id of FIX, and every reference to one (dupOf,
   topic, sub, lecture), gets the prefix cst-, with the course's own id kept inside it:
   questions inf-c4 -> cst-inf-c4, inf-c5 -> cst-inf-c5, inf-c11 -> cst-inf-c11,
   cq2-4 -> cst-cq2-4 (dupOf cst-inf-c11), inf-n1 -> cst-inf-n1, inf-n2 -> cst-inf-n2,
   inf-n4 -> cst-inf-n4; topic infusion -> cst-infusion; its subtopics basics, css, pre,
   rate, time, stop, load -> cst-basics ... cst-load; lecture L04 -> cst-L04. Concepts,
   skills and every other field are the course's own. ../ci/oncourse.js reads PFX too. */
const PFX = fix => {
  const p = id => 'cst-' + id, ref = (o, ks) => { const r = Object.assign({}, o); ks.forEach(k => { if(r[k] !== undefined) r[k] = p(r[k]); }); return r; };
  return {qs: fix.qs.map(q => ref(q, ['id', 'dupOf', 'topic', 'sub', 'lecture'])),
          topics: fix.topics.map(t => Object.assign(ref(t, ['id']), t.subs ? {subs: t.subs.map(x => ref(x, ['id']))} : {})),
          lecture: ref(fix.lecture, ['id']), skills: fix.skills};
  };
/* The course data file for FIX (written through PFX), in the kit's question-file form: one
   question per line, opening {id:'...', the type, the skill, then prof as a literal
   (browser_test.js counts the bank that way); the topics pushed after the course's own; the
   lecture under its own prefixed id (cst-L04) unless the course already has that id; the
   skills the course lacks. Questions, topics and skills the course already has are not
   written again. A `setup` (plan-the-problem's) is written only when own.eq, the course's
   EQUATIONS ids, has its equation and every one before it; an `asks` only when own.asks, the
   course's ASKS keys, has it; otherwise it is left out and listed in `dropped`. */
const WRITE = (fix, own) => {
  const lit = v => { if(!/^[^'\\\n]*$/.test(String(v))) throw new Error('cannot be written as a literal: ' + v); return `'${v}'`; };
  const eq = new Set(own.eq || []), asks = new Set(own.asks || []), dropped = {setup: [], asks: []};
  const rows = fix.qs.filter(q => !own.qids.includes(q.id)).map(q => {
    const r = Object.assign({}, q); ['id', 'type', 'skill', 'prof'].forEach(k => delete r[k]);
    if(r.setup !== undefined && !(r.setup && (r.setup.eq === 'none' || eq.has(r.setup.eq)) && (r.setup.pre || []).every(x => eq.has(x)))){ delete r.setup; dropped.setup.push(q.id); }
    if(r.asks !== undefined && !asks.has(r.asks)){ delete r.asks; dropped.asks.push(q.id); }
    return `{id:${lit(q.id)},` + (q.type ? ` type:${lit(q.type)},` : '') + ` skill:${lit(q.skill)}, prof:${lit(own.prof)}, ${JSON.stringify(r).slice(1)},`; });
  const topics = fix.topics.filter(t => !own.topics.includes(t.id)).map(t => Object.assign({}, t, {prof: own.prof}));
  let body = '';
  if(topics.length) body += `TOPICS.push(\n${topics.map(t => JSON.stringify(t)).join(',\n')}\n);\n`;
  if(rows.length) body += `QUESTIONS.push(\n${rows.join('\n')}\n);\n`;
  if(body) body = `/* concept-statuses: 7 of Basic-Pharmacokinetics' questions and their topic (ac2eb73), ids prefixed cst-,\n   written from FIX in features/concept-statuses/current/test.js */\n` + body;
  const skills = fix.skills.filter(s => !own.skills.includes(s.id));
  const l = fix.lecture, lecture = (own.lids || []).includes(l.id) ? '' :
    `{id:${lit(l.id)}, deck:${lit(l.deck)}, label:${lit(l.label)}, prof:${lit(own.prof)}, exam:${JSON.stringify(l.exam)}, module:${JSON.stringify(l.module)}}`;
  const line = (lecture ? `COURSE.lectures = (COURSE.lectures || []).concat([${lecture}]); ` : '') +
    (skills.length ? `COURSE.skills = (COURSE.skills || []).concat(${JSON.stringify(skills)}); ` : '');
  return {body, line, rows: rows.length, topics: topics.length, skills: skills.length, lecture: !!lecture, dropped};
  };

/* The 13 logs of Basic-Pharmacokinetics src/test.js section 4c: [question index,
   result, minutes after the start]; a gap of 30 minutes or more starts a new session. */
const CASES = [
  ['one miss is unfamiliar', [[0, 'wrong', 0]], 'unfamiliar'],
  ['a correct answer marked "I guessed" is a miss', [[0, 'guessed', 0]], 'unfamiliar'],
  ['one right answer never masters', [[0, 'correct', 0]], 'learning'],
  ['two misses are struggling', [[0, 'wrong', 0], [1, 'correct', 1], [0, 'wrong', 2]], 'struggling'],
  ['under 60% on the last attempts is struggling', [[0, 'correct', 0], [1, 'wrong', 1]], 'struggling'],
  ['missed, then the last 2 solid, is improving', [[0, 'wrong', 0], [1, 'correct', 1], [0, 'correct', 2]], 'improving'],
  ['three solid on one question is not mastered', [[0, 'correct', 0], [0, 'correct', 60], [0, 'correct', 120]], 'learning'],
  ['three solid on two questions in one session is not mastered', [[0, 'correct', 0], [1, 'correct', 5], [0, 'correct', 10]], 'learning'],
  ['three solid on two questions across two sessions is mastered', [[0, 'correct', 0], [1, 'correct', 5], [0, 'correct', 120]], 'mastered'],
  ['a guess in the last three blocks mastery', [[0, 'correct', 0], [1, 'correct', 5], [0, 'guessed', 120]], 'learning'],
  ['a miss after mastery is returning', [[0, 'correct', 0], [1, 'correct', 5], [0, 'correct', 120], [1, 'wrong', 600]], 'returning'],
  ['returning, then the last 2 solid, is improving', [[0, 'correct', 0], [1, 'correct', 5], [0, 'correct', 120], [1, 'wrong', 600], [0, 'correct', 601], [1, 'correct', 602]], 'improving'],
  ['returning, then 3 solid, is mastered again', [[0, 'correct', 0], [1, 'correct', 5], [0, 'correct', 120], [1, 'wrong', 600], [0, 'correct', 601], [1, 'correct', 602], [0, 'correct', 603]], 'mastered'],
];

/* Basic-Pharmacokinetics src/sweep_test.py CONCEPT_SEED, in the kit's answer shape
   (the kind of miss is `miss`, PK's `missKind`): the single-answer question missed
   three times with the same wrong option (struggling), the calculation missed once
   with the kind "unit" (unfamiliar), and the two wordings answered right three
   times across two sessions ten days ago (mastered, its spaced check due). */
const SEED = () => {
  DB.answers = []; DB.concepts = {}; DB.qn = 0; DB.settings.pace = 'semester';
  const two = [byId('cst-inf-c11'), byId('cst-cq2-4')], mcq = byId('cst-inf-c5'), num = byId('cst-inf-n1');
  const now = Date.now(), MIN = 60000, old = now - 10 * 86400000;
  const add = (q, result, at, picked, miss) => { DB.qn++; const a = {qid: q.id, concept: q.concept, result, at, qn: DB.qn};
    if(picked !== undefined) a.picked = picked; if(miss) a.miss = miss; DB.answers.push(a); };
  add(two[0], 'correct', old); add(two[1], 'correct', old + 5 * MIN); add(two[0], 'correct', old + 120 * MIN);
  const w = mcq.options.findIndex(o => !o.correct && o.why), r = mcq.options.findIndex(o => o.correct);
  [[w, 'wrong'], [r, 'correct'], [w, 'wrong'], [w, 'wrong']].forEach(([p, res], k) => add(mcq, res, now - (10 - k) * MIN, p));
  add(num, 'wrong', now - 5 * MIN, '1.234', 'unit');
  save();
  const A = FX.api('concept-statuses');
  return {struggling: A.conceptTitle(mcq.concept), mastered: A.conceptTitle(two[0].concept), num: A.conceptTitle(num.concept)};
};

/* A long answer history over the whole bank, the same on every run (a fixed seed): n0
   answers on the bank's first concept only, then n1 answers on the other questions, 2
   minutes apart with a 3-hour gap after every 40, each concept with its own share of
   correct answers, and wrong options, kinds of miss and "Not sure" marks as the core
   records them. The scheduler's records are rebuilt from it with the core's own st()
   and schedule(). */
const HISTORY = ([n0, n1]) => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cs = [...new Set(QUESTIONS.map(q => q.concept))], Z = cs[0];
  const zq = QUESTIONS.filter(q => q.concept === Z), rest = QUESTIONS.filter(q => q.concept !== Z);
  const MIN = 60000; let at = Date.now() - 30 * 86400000, qn = 0; const out = [];
  const add = q => { qn++; at += 2 * MIN; if(qn % 40 === 0) at += 180 * MIN;
    const p = 0.35 + 0.6 * cs.indexOf(q.concept) / cs.length, x = rnd();
    const result = x < p ? 'correct' : x < p + 0.08 ? 'guessed' : 'wrong';
    const a = {qid: q.id, concept: q.concept, result, at, qn};
    if(result === 'wrong' && !q.type && Array.isArray(q.options)){ const w = q.options.findIndex(o => !o.correct); if(w >= 0) a.picked = w; }
    if(result === 'wrong' && q.type === 'numeric'){ a.picked = '1'; a.miss = ['setup', 'unit', 'algebra', 'round'][Math.floor(rnd() * 4)]; }
    if(result === 'correct' && rnd() < 0.05) a.conf = 'shaky';
    out.push(a); };
  for(let i = 0; i < n0; i++) add(zq[i % zq.length]);
  for(let i = 0; i < n1; i++) add(rest[Math.floor(rnd() * rest.length)]);
  DB.answers = out; DB.qn = qn; DB.concepts = {}; DB.settings.pace = 'semester';
  for(const a of out){ const s = st(a.concept); s.seen++; if(a.result === 'correct'){ s.correct++; s.box = Math.min(s.box + 1, 6); } else { s.wrong++; s.box = 0; } schedule(s, a.concept); }
  save();
  return {Z, n: out.length};
};
/* What the module states, as data: each concept's status, review step, due times and
   counts, and the due list; DB.answers.length with it. */
const SUMMARY = () => { const g = FX.api('concept-statuses').conceptGroups();
  return JSON.stringify({n: DB.answers.length, all: g.all.map(x => [x.c, x.rec.s, x.rec.box, x.rec.dueAt, x.rec.dueQ, x.st.n, x.st.misses, x.st.solidN]).sort(),
                         due: g.due.map(x => x.c).sort()}); };
/* The Concepts section as the student reads it, every fold open. */
const SECTION = async page => {
  await page.evaluate(() => show('gaps'));
  await page.waitForTimeout(250);
  return page.evaluate(() => { const b = document.getElementById('cstatuses'); if(!b) return null;
    b.querySelectorAll('details').forEach(d => d.open = true); return b.innerText; });
};

(async () => {
  console.log('\n=== the course\'s own data ===');
  L.PAGE.need(NAME);
  const X = L.engine('({QUESTIONS, TOPICS, COURSE, FX: typeof FX === "undefined" ? null : FX,' +
    ' EQ: typeof EQUATIONS !== "undefined" && Array.isArray(EQUATIONS) ? EQUATIONS.map(e => e && e.id) : [],' +
    ' ASKS: typeof ASKS !== "undefined" && ASKS && typeof ASKS === "object" ? Object.keys(ASKS) : []})');
  const S = X.FX && X.FX.api('concept-statuses');
  if(!check(!!S, 'the page carries concept-statuses, working', JSON.stringify((X.FX && X.FX.errors) || 'no feature modules in the page'))) L.finish(NAME);
  const concepts = [...new Set(X.QUESTIONS.map(q => q.concept))];
  const badT = concepts.filter(c => { const t = S.conceptTitle(c); return !t || /undefined|NaN/.test(t); });
  check(concepts.length && !badT.length, `every concept has a readable name (${concepts.length}; e.g. "${S.conceptTitle(concepts[0])}")`, badT.slice(0, 5).join(', '));
  const ghost = S.conceptLog([{qid: 'no-such-question', concept: 'gone', result: 'wrong', at: Date.now(), qn: 1}]);
  check(!Object.keys(ghost).length, 'an answer to a question no longer in the bank reaches no concept');
  const prof = X.COURSE.professors[0];
  const own = {prof, qids: X.QUESTIONS.map(q => q.id), topics: X.TOPICS.map(t => t.id), skills: (X.COURSE.skills || []).map(s => s.id),
               lids: (X.COURSE.lectures || []).map(l => l.id), eq: X.EQ, asks: X.ASKS};
  const w = WRITE(PFX(FIX), own);
  console.log(`  the course ${w.rows ? `lacks ${w.rows} of the ${FIX.qs.length} questions of FIX: the scratch copy adds them` : 'holds the questions of FIX: the scratch copy uses its copy'}` +
              ` (${w.topics} topics, ${w.skills} skills, ${w.lecture ? 'the lecture as cst-L04' : 'no lecture'} added;` +
              ` left out: ${w.dropped.setup.length} setup and ${w.dropped.asks.length} asks lines naming an equation or ASKS key the course lacks)`);

  console.log('\n=== on a scratch copy with 7 of Basic-Pharmacokinetics\' questions (Chromium) ===');
  const s = L.scratchBuild('cstat', {files: w.body ? {'q91_cst_fixture.js': w.body} : {},
    courseLine: w.line + L.featureOn(__dirname, {words: WORDS})});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test questions does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  const dl = fs.mkdtempSync(path.join(os.tmpdir(), 'cstat-dl-'));
  try {
    { const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1000}});
      const ev = (f, a) => page.evaluate(f, a);
      const fm = await ev(() => !!FX.api('formulas-in-text'));
      console.log(`  formulas-in-text is ${fm ? 'on' : 'off'} in this copy`);
      const r = await ev(([CASES]) => {
        const A = FX.api('concept-statuses'), two = [byId('cst-inf-c11'), byId('cst-cq2-4')];
        const MIN = 60000, DAYMS = 86400000, t0 = Date.now() - 2 * DAYMS;
        const log = (rows, start) => rows.map(([i, result, m, conf], k) => Object.assign({qid: two[i].id, concept: two[i].concept, result, at: (start === undefined ? t0 : start) + m * MIN, qn: k + 1}, conf ? {conf} : {}));
        const recOf = (rows, start) => A.conceptRecord(A.conceptLog(log(rows, start))[two[0].concept]);
        const out = {};
        out.off = CASES.map(([name, rows, want]) => { const x = recOf(rows); return x.s === want ? null : `${name}: got ${x.s}, expected ${want}`; }).filter(Boolean);
        const M = [[0, 'correct', 0], [1, 'correct', 5], [0, 'correct', 120]], lastAt = t0 + 120 * MIN;
        DB.settings.pace = 'semester';
        const m0 = recOf(M), m1 = recOf(M.concat([[1, 'correct', 200]]));
        out.box = {m0, m1, ok: m0.box === MASTER_BOX && m0.dueAt === lastAt + PACES.semester.steps[MASTER_BOX] * DAYMS &&
          m0.dueQ === 3 + PACES.cram.steps[MASTER_BOX] && m1.box === MASTER_BOX + 1};
        DB.settings.pace = 'weekly';
        const w0 = recOf(M);
        out.weekly = w0.dueAt === lastAt + PACES.weekly.steps[MASTER_BOX] * DAYMS;
        DB.settings.pace = 'semester';
        const saved = DB.concepts, mode = DB.settings.mode; DB.concepts = {};
        const old = recOf(M, Date.now() - 40 * DAYMS), fresh = recOf(M, Date.now() - 3 * 60 * MIN);
        out.due = [A.conceptDue(two[0].concept, old), A.conceptDue(two[0].concept, fresh)];
        DB.settings.mode = 'all';
        out.dueAll = A.conceptDue(two[0].concept, fresh);
        DB.settings.mode = mode;
        // the scheduler's own record for the concept, not yet due: the concept is not listed
        DB.concepts = {[two[0].concept]: {seen: 3, correct: 3, wrong: 0, guessed: 0, streak: 3, box: 3, dueAt: Date.now() + 10 * DAYMS, dueQ: DB.qn + 1000, lastQ: 0, asked: []}};
        out.dueSched = A.conceptDue(two[0].concept, old);
        DB.concepts = saved;
        const line = rows => { const l = A.conceptLog(log(rows))[two[0].concept]; return A.statusLine(two[0].concept, A.conceptRecord(l), A.conceptStats(l)); };
        out.line = line([[0, 'wrong', 0], [1, 'correct', 1], [0, 'wrong', 2], [1, 'guessed', 3], [0, 'correct', 4]]);
        out.shaky = recOf([[0, 'correct', 0], [1, 'correct', 5], [0, 'correct', 120, 'shaky']]).s;
        out.shakyLine = line([[0, 'wrong', 0], [1, 'correct', 1, 'shaky']]);
        out.title = A.conceptTitle(byId('cst-inf-c4').concept);
        // wrong options: a select-all answer counts only the wrong options it picked
        const mcq = byId('cst-inf-c5'), ri = mcq.options.findIndex(o => o.correct), wi = mcq.options.map((o, i) => o.correct ? -1 : i).filter(i => i >= 0);
        out.multi = A.wrongPicks(mcq, {result: 'wrong', picked: [ri, wi[0]]}).map(x => x.t);
        out.multiWant = [mcq.options[wi[0]].t];
        // repeated wrong options: each chosen twice are both listed; one chosen once is not
        const at = Date.now() - 60 * MIN, rep = picks => { const l = A.conceptLog(picks.map((p, k) => ({qid: mcq.id, concept: mcq.concept, result: 'wrong', picked: p, at: at + k * MIN, qn: k + 1})))[mcq.concept];
          return A.conceptStats(l).recurring.map(x => x.t + ' ' + x.n); };
        out.rep2 = rep([wi[0], wi[1], wi[0], wi[1]]);
        out.rep1 = rep([wi[0], wi[1], wi[0]]);
        out.repWant = [[mcq.options[wi[0]].t + ' 2', mcq.options[wi[1]].t + ' 2'].sort(), [mcq.options[wi[0]].t + ' 2']];
        // a matching answer: each left item given a wrong right-hand item is named
        const mq = QUESTIONS.find(q => q.type === 'match' && Array.isArray(q.pairs) && q.pairs.length >= 2);
        if(mq){ const p = mq.pairs.map((x, k) => k); [p[0], p[1]] = [p[1], p[0]];
          out.match = A.wrongPicks(mq, {result: 'wrong', picked: p}).map(x => x.t);
          out.matchWant = [`${mq.pairs[0].l} → ${mq.pairs[1].r}`, `${mq.pairs[1].l} → ${mq.pairs[0].r}`]; }
        return out;
      }, [CASES]);
      check(!r.off.length, `the status rules hold on ${CASES.length} synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning)`, r.off.join('; '));
      check(r.box.ok, 'mastery starts the spaced check at the mastery box at the pace\'s intervals, and each further solid answer moves it up one', r.box);
      check(r.weekly, 'on the weekly pace the spaced check uses the weekly days');
      check(r.due[0] === true && r.due[1] === false, 'a concept mastered 40 days ago is due for its spaced check, one mastered minutes ago is not', r.due);
      check(r.dueAll === false, '"Ask everything" does not list a concept mastered minutes ago as due', r.dueAll);
      check(r.dueSched === false, 'a concept mastered 40 days ago is not listed as due while the scheduler\'s own record for it is not due', r.dueSched);
      check(r.line === '3 misses in 5 attempts, last 5 at 40% (1 of them a correct answer marked as a guess)', 'the evidence line gives exact counts: ' + r.line, r.line);
      check(r.shaky === 'learning', 'a correct answer marked "Not sure" is a miss: it blocks mastery', r.shaky);
      check(r.shakyLine === '2 misses in 2 attempts, last 2 at 0% (1 of them a correct answer marked "Not sure")', 'the evidence line counts a "Not sure": ' + r.shakyLine, r.shakyLine);
      check(r.title === 'Time to Css', 'the course\'s `words` option names the concept ("time-to-css" as "Time to Css")', r.title);
      check(JSON.stringify(r.multi) === JSON.stringify(r.multiWant), 'a select-all answer counts only the wrong options it picked', r.multi);
      check(JSON.stringify(r.rep2.slice().sort()) === JSON.stringify(r.repWant[0]) && JSON.stringify(r.rep1) === JSON.stringify(r.repWant[1]),
            'wrong options chosen more than once are all listed as repeated, one chosen once is not', {rep2: r.rep2, rep1: r.rep1});
      if(r.match) check(JSON.stringify(r.match) === JSON.stringify(r.matchWant), 'a matching answer names each left item with the wrong right-hand item picked', r.match);
      else L.skip('a matching answer names the wrong pairs', 'the bank has no matching question');

      // a card's option text and its why: no {{frac:...}} markup (inf-c5's wrong options hold the ratio {{frac:R|Cl}})
      const want = await ev(() => { const o = byId('cst-inf-c5').options.find(o => !o.correct && /\{\{frac:/.test(o.why || '')), m = o.why.match(/\{\{frac:([^|}]*)\|([^}]*)\}\}/); return `(${m[1]})/(${m[2]})`; });
      await ev(() => { DB.answers = []; DB.concepts = {}; DB.qn = 0; const q = byId('cst-inf-c5'), wi = q.options.findIndex(o => !o.correct && /\{\{frac:/.test(o.why || ''));
        [0, 1].forEach(k => { DB.qn++; DB.answers.push({qid: q.id, concept: q.concept, result: 'wrong', picked: wi, at: Date.now() - (5 - k) * 60000, qn: DB.qn}); });
        save(); show('gaps'); });
      await page.waitForTimeout(250);
      const fr = await ev(() => { const c = document.querySelector('#cstatuses .ccard'); return c ? {t: c.innerText, h: c.innerHTML} : null; });
      check(fr && !/\{\{frac:/.test(fr.h) && fr.t.includes(want), `a card shows the ratio of the why as ${want}, with no {{frac:...}} markup (formulas-in-text ${fm ? 'on' : 'off'})`,
            fr && fr.t.slice(0, 300));

      // with no answers, Weak spots has no Concepts section
      await ev(() => { DB.answers = []; DB.concepts = {}; DB.qn = 0; save(); show('gaps'); });
      await page.waitForTimeout(150);
      check(!(await ev(() => !!document.getElementById('cstatuses'))), 'with no answers there is no Concepts section');

      // 8 weak concepts shown, the rest folded: two misses on every concept of the bank
      const nC = await ev(() => { DB.answers = []; DB.concepts = {}; DB.qn = 0; const cs = [...new Set(QUESTIONS.map(q => q.concept))];
        cs.forEach((c, i) => { const q = conceptQs(c)[0]; [0, 1].forEach(k => { DB.qn++; DB.answers.push({qid: q.id, concept: c, result: 'wrong', at: Date.now() - (100 - 2 * i - k) * 60000, qn: DB.qn}); }); });
        save(); return cs.length; });
      if(nC >= 9){
        await ev(() => show('gaps'));
        await page.waitForTimeout(200);
        const f8 = await ev(() => ({top: document.querySelectorAll('#cstatuses > .ccard').length, folded: document.querySelectorAll('#cstatuses > details.cmore .ccard').length,
          sum: (document.querySelector('#cstatuses > details.cmore > summary') || {}).textContent}));
        check(f8.top === 8 && f8.folded === nC - 8 && f8.sum === `${nC - 8} more weak concept${nC - 8 === 1 ? '' : 's'}`, `8 of the ${nC} weak concepts are shown and the rest folded`, f8);
      } else L.skip('8 weak concepts shown and the rest folded', `the bank has ${nC} concepts, fewer than 9`);

      // the section's place, and its Check and Run the check buttons (the seed leaves DB.concepts empty, so the scheduler has the concept due)
      await ev(SEED);
      // drawing the section with no scheduler records changes nothing
      const snap = () => ev(() => JSON.stringify([DB.concepts, DB.qn, DB.answers, DB.settings, Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])]));
      await page.waitForTimeout(400);
      const before0 = await snap();
      await ev(() => show('gaps'));
      await page.waitForTimeout(200);
      const order = await ev(() => { const box = document.getElementById('cstatuses'), hs = [...document.querySelectorAll('#v-gaps h3')];
        const ses = hs.find(h => h.textContent === 'This session'), rev = hs.find(h => /^What to review next/.test(h.textContent));
        const pos = (a, b) => !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING));
        return {box: !!box, n: document.querySelectorAll('#cstatuses').length, afterSession: pos(ses, box), beforeReview: pos(box, rev)}; });
      check(order.box && order.n === 1 && order.afterSession && order.beforeReview, 'the section is drawn once, after "This session" and before "What to review next"', order);
      await page.waitForTimeout(400);
      const after0 = await snap();
      check(before0 === after0, 'drawing the Concepts section with no scheduler records leaves DB.concepts, DB.qn and the saved progress unchanged', {same: before0 === after0});
      await ev(() => document.querySelector('#v-gaps [data-ccheck]').click());
      await page.waitForTimeout(150);
      const ck = await ev(() => ({v: VIEW, label: Q && Q.label, n: Q && Q.sweep && Q.sweep.length}));
      check(ck.v === 'quiz' && /^Spaced review: /.test(ck.label) && ck.n === 1, 'Check starts a one-question spaced review of that concept', ck);
      await ev(() => show('gaps'));
      await page.waitForTimeout(150);
      const ca = await ev(() => { const b = document.querySelector('#cdueAll'); if(b) b.click(); return {b: !!b}; });
      await page.waitForTimeout(150);
      Object.assign(ca, await ev(() => ({v: VIEW, label: Q && Q.label, n: Q && Q.sweep && Q.sweep.length})));
      check(ca.b && ca.v === 'quiz' && ca.label === 'Spaced review' && ca.n === 1, 'Run the check starts the due checks, one question each (1 due)', ca);

      // drawing the section changes neither the scheduler's records nor the saved progress
      await ev(() => { DB.concepts = {}; for(const a of DB.answers){ const s = st(a.concept); s.seen++; if(a.result === 'correct'){ s.correct++; s.box = Math.min(s.box + 1, 6); } else { s.wrong++; s.box = 0; } schedule(s, a.concept); } save(); show('topics'); });
      await page.waitForTimeout(800);
      const before = await snap();
      await ev(() => show('gaps'));
      await page.waitForTimeout(200);
      const drawn = await ev(() => !!document.getElementById('cstatuses'));
      await ev(() => { document.querySelectorAll('#v-gaps details').forEach(d => d.open = true); show('topics'); show('gaps'); });
      await page.waitForTimeout(800);
      const after = await snap();
      check(drawn && before === after, 'drawing the Concepts section changes neither the scheduler\'s records (DB.concepts, DB.qn) nor the saved progress', {drawn, same: before === after});
      check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
      await ctx.close();
    }

    for(const scheme of ['light', 'dark']) for(const w of [390, 1100]){
      console.log(`\n=== Weak spots, concepts: ${w} px, ${scheme} ===`);
      const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width: w, height: 900}, colorScheme: scheme});
      const ev = (f, a) => page.evaluate(f, a);
      const names = await ev(SEED);
      await ev(() => show('gaps'));
      await page.waitForTimeout(250);
      await ev(() => document.querySelectorAll('#v-gaps details.cmore, #v-gaps details.clegend').forEach(d => d.open = true));
      await page.waitForTimeout(100);
      const cards = await ev(() => [...document.querySelectorAll('#v-gaps .ccard')].map(c => ({
        t: c.querySelector('.chead b').textContent, s: c.querySelector('.cstat').textContent, txt: c.innerText, r: c.getBoundingClientRect().right})));
      const strug = cards.filter(c => c.t === names.struggling);
      check(strug.length && strug[0].s === 'Struggling', `struggling card shown (${names.struggling})`, cards.map(c => [c.t, c.s]));
      check(cards.length === 2 && cards[0].t === names.struggling && cards[1].t === names.num && cards[1].s === 'Unfamiliar',
            'the struggling card comes first, then the unfamiliar one', cards.map(c => [c.t, c.s]));
      check(strug.length && strug[0].txt.includes('You chose this 3 times') && strug[0].txt.includes('Why it is not the answer'), 'the wrong option chosen 3 times is shown with its why');
      check(strug.length && strug[0].txt.includes('3 misses in 4 attempts, last 4 at 25%'), 'the evidence line gives exact counts');
      check(cards.some(c => c.t === names.num && c.txt.includes('Most common kind of miss: Unit conversion')), 'a calculation concept shows its most common kind of miss');
      const txt = await page.innerText('#v-gaps');
      check(txt.includes('Mastered (1)') && txt.includes(names.mastered), `mastered concept folded away (${names.mastered})`);
      check(txt.includes('Due for spaced review (1)'), 'the mastered concept is listed as due for spaced review');
      const bad = ['undefined', 'NaN'].filter(x => txt.includes(x));
      check(!bad.length, 'no undefined or NaN on Weak spots', bad.join(', '));
      // the section's own boxes, every one inside the width (the core's own tables on Weak spots are not this module's)
      const over = await ev(() => [document.getElementById('cstatuses')].concat([...document.querySelectorAll('#cstatuses *')])
        .filter(e => e.getBoundingClientRect().right > innerWidth + 0.5).map(e => e.tagName + '.' + e.className).slice(0, 5));
      check(cards.length && !over.length, 'the Concepts section and its cards fit the width', `past the edge: ${over}`);
      if(w === 390 && process.env.CSTAT_SHOTS) await page.screenshot({path: path.join(process.env.CSTAT_SHOTS, `concepts-${w}-${scheme}.png`), fullPage: false,
        clip: await ev(() => { const r = document.getElementById('cstatuses').getBoundingClientRect(); window.scrollTo(0, r.top + scrollY - 10);
          const q = document.getElementById('cstatuses').getBoundingClientRect(); return {x: 0, y: Math.max(0, q.top), width: innerWidth, height: Math.min(900, q.height)}; })});
      await ev(() => document.querySelector('#v-gaps [data-cpractice]').click());
      await page.waitForTimeout(200);
      check(await ev(() => VIEW === 'quiz' && Q && Q.label.startsWith('Concept: ') && Q.sweep.every(id => byId(id).concept === byId(Q.sweep[0]).concept)),
            'Practice this concept opens a quiz on that concept');
      check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
      await ctx.close();
    }

    console.log('\n=== persistence: a history of 4100 answers, then one more on the page ===');
    { const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1000}, acceptDownloads: true});
      const ev = (f, a) => page.evaluate(f, a);
      const reload = async () => { await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000}); };
      const h = await ev(HISTORY, [100, 4000]);
      await page.waitForTimeout(400);
      await reload();
      const loaded = await ev(() => DB.answers.length);
      const beforeCap = await ev(([Z]) => ({z: FX.api('concept-statuses').conceptGroups().all.some(x => x.c === Z)}), [h.Z]);
      // one more answer through the core: record() keeps the last 4000
      const one = await ev(() => { const all = DB.answers.slice(); const q = QUESTIONS.find(x => x.concept !== QUESTIONS[0].concept);
        record(q, 'correct', q.options ? q.options.findIndex(o => o.correct) : undefined);
        const A = FX.api('concept-statuses'), g = A.conceptLog(all.concat([DB.answers[DB.answers.length - 1]]).slice(-4000));
        return {n: DB.answers.length, want: JSON.stringify(Object.keys(g).sort().map(c => [c, A.conceptRecord(g[c]).s, g[c].length]))}; });
      await page.waitForTimeout(400);
      await reload();
      const capped = await ev(([Z]) => { const A = FX.api('concept-statuses'), g = A.conceptGroups();
        return {n: DB.answers.length, z: g.all.some(x => x.c === Z), got: JSON.stringify(g.all.map(x => [x.c, x.rec.s, x.st.n]).sort((a, b) => a[0] < b[0] ? -1 : 1))}; }, [h.Z]);
      check(loaded === 4100 && beforeCap.z, `a saved history of ${h.n} answers loads whole, and the first concept (answered only in its first 100) has a status`, {loaded, z: beforeCap.z});
      check(one.n === 4000 && capped.n === 4000 && capped.got === one.want,
            'after one more answer the core keeps the last 4000, and the statuses are those of exactly those 4000', {n: capped.n});
      check(!capped.z, 'a concept answered only before the last 4000 answers has no status any more (the core keeps 4000; reported)', capped.z);
      console.log('  report: the core keeps the last 4000 answers (record(), DB.answers.splice); the statuses are read from those, so a concept answered only earlier is no longer listed');
      const sum0 = await ev(SUMMARY), sec0 = await SECTION(page);
      check(sec0 && sec0.length > 200 && !/undefined|NaN/.test(sec0), `the Concepts section draws from the long history (${JSON.parse(sum0).all.length} concepts)`, sec0 && sec0.slice(0, 200));

      // Export progress, then Import progress into a fresh browser profile
      await ev(() => show('settings'));
      await page.waitForTimeout(200);
      const [d] = await Promise.all([page.waitForEvent('download'), page.click('#btnExport')]);
      const file = path.join(dl, 'progress.json');
      await d.saveAs(file);
      const exp = JSON.parse(fs.readFileSync(file, 'utf8'));
      check(exp.db && exp.db.answers.length === 4000, `Export progress writes the 4000 answers (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`, exp.db && exp.db.answers.length);
      { const B = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1000}}, () => { window.__name = 'Fresh'; });
        const fresh = await B.page.evaluate(() => DB.answers.length);
        await B.page.evaluate(() => show('settings'));
        await B.page.waitForTimeout(200);
        await B.page.setInputFiles('#fileIn', file);
        await B.page.waitForFunction(() => DB.answers.length === 4000, null, {timeout: 10000}).catch(() => {});
        const sumB = await B.page.evaluate(SUMMARY), secB = await SECTION(B.page);
        check(fresh === 0 && sumB === sum0 && secB === sec0, 'Import progress in a fresh browser profile gives the same statuses, counts and Concepts section', {fresh, same: sumB === sum0, sameText: secB === sec0});
        await B.page.waitForTimeout(400);
        await B.page.reload();
        await B.page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
        check(await B.page.evaluate(SUMMARY) === sum0, 'after a reload the imported profile still has the same statuses');
        check(!B.errors.length, 'no page error in the fresh profile', B.errors.slice(0, 2).join('; '));
        await B.ctx.close(); }

      // a profile switch: each profile keeps its own statuses
      const p1 = await ev(() => PROFILE);
      const sw = await ev(() => { window.__name = 'Second'; askProfile(true); const n0 = DB.answers.length;
        const q = byId('cst-inf-c5'), wi = q.options.findIndex(o => !o.correct); for(let k = 0; k < 3; k++) record(q, 'wrong', wi);
        return {n0, prof: PROFILE}; });
      await page.waitForTimeout(400);
      const sum2 = await ev(SUMMARY), sec2 = await SECTION(page);
      await ev(p => { window.__name = p; askProfile(true); }, p1);
      await page.waitForTimeout(300);
      const back1 = await ev(SUMMARY), secBack = await SECTION(page);
      await ev(() => { window.__name = 'Second'; askProfile(true); });
      await page.waitForTimeout(300);
      const back2 = await ev(SUMMARY);
      const s2 = JSON.parse(sum2);
      check(sw.prof === 'Second' && sw.n0 === 0 && s2.n === 3 && s2.all.length === 1 && s2.all[0][1] === 'struggling' && /Struggling/.test(sec2 || ''),
            'a new profile starts with no answers and shows only its own concept (3 misses: struggling)', {n0: sw.n0, s2: s2.all});
      check(back1 === sum0 && secBack === sec0 && back2 === sum2, `switching back to "${p1}" gives its statuses unchanged, and "Second" keeps its own`, {first: back1 === sum0, second: back2 === sum2});
      await ev(p => { window.__name = p; askProfile(true); }, p1);
      await page.waitForTimeout(300);

      // a reload soon after an answer: 50 ms (before the core's 150 ms save) and 400 ms
      const mark = async ms => { const e = await ev(ms => { const q = byId('cst-inf-c5'), wi = q.options.findIndex(o => !o.correct); record(q, 'wrong', wi);
          const a = DB.answers[DB.answers.length - 1]; setTimeout(() => location.reload(), ms); return {at: a.at, qn: a.qn}; }, ms);
        await page.waitForTimeout(ms + 300);
        await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
        return ev(e => ({kept: DB.answers.some(a => a.at === e.at && a.qn === e.qn && a.qid === 'cst-inf-c5'), qn: DB.qn, n: DB.answers.length}), e); };
      const q0 = await ev(() => DB.qn);
      const fast = await mark(50);
      console.log(`  report: a reload 50 ms after an answer: the answer was ${fast.kept ? 'kept' : 'lost'} (DB.qn ${q0} before, ${fast.qn} after); the core writes the progress 150 ms after the last change`);
      const q1 = await ev(() => DB.qn);
      const slow = await mark(400);
      check(slow.kept && slow.qn === q1 + 1, 'a reload 400 ms after an answer keeps it, and the statuses read it', {slow, q1});
      const sumR = await ev(SUMMARY);

      // storage full, then storage denied: the notice, nothing saved overwritten, the saved progress loads again
      for(const [kind, err] of [['full', 'QuotaExceededError'], ['denied', 'SecurityError']]){
        const k = await ev(() => keyFor(PROFILE));
        const stored = await ev(k => localStorage.getItem(k), k);
        const res = await ev(([err]) => {
          window.__set = Storage.prototype.setItem;
          Storage.prototype.setItem = function(){ throw new DOMException('the test refuses this write', err); };
          const q = byId('cst-inf-c4'); record(q, 'correct', q.options.findIndex(o => o.correct));
          return {qn: DB.qn}; }, [err]);
        await page.waitForTimeout(400);
        const sec = await SECTION(page);
        const st1 = await ev(([k, s]) => { const n = document.getElementById('savewarn');
          const r = n && n.getBoundingClientRect();
          return {warn: !!(n && r.width > 0 && r.height > 0 && getComputedStyle(n).visibility !== 'hidden' && /did not save your progress/.test(n.textContent)), same: localStorage.getItem(k) === s,
                  inMemory: DB.qn}; }, [k, stored]);
        check(st1.warn, `storage ${kind} (${err}): the student sees that the progress was not saved`, st1);
        check(st1.same, `storage ${kind}: the saved progress is not overwritten`, st1);
        check(!!sec && st1.inMemory === res.qn, `storage ${kind}: the Concepts section still draws, from the answers of this visit`, {sec: !!sec});
        await ev(() => { Storage.prototype.setItem = window.__set; });
        await reload();
        const sumL = await ev(SUMMARY);
        check(sumL === sumR && await ev(([k, s]) => localStorage.getItem(k) === s, [k, stored]),
              `storage ${kind}, then working again: the saved progress is still there and loads with the same statuses`, {same: sumL === sumR});
      }
      check(!errors.length, 'no page error in the persistence checks', errors.slice(0, 3).join(' | '));
      await ctx.close();
    }
  } finally {
    await browser.close();
    s.rm();
    fs.rmSync(dl, {recursive: true, force: true});
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
