/* plan-the-problem: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * On the course's own data (Basic-Pharmacokinetics src/test.js lines 788-795 and
 * 997-1068): every set-up stem is offered four distinct lines, the right one among
 * them; every set-up reason splits into whole sentences (no fraction or decimal cut).
 * The sentence split against Basic-Pharmacokinetics' own form of it (a regex
 * lookbehind, src/views.js line 4937) on 9 control texts: the same sentences.
 * The build step: a set-up line that is not in EQUATIONS, a given that is not
 * [symbol, value, role], an ASKS key that does not exist, a PLAN.same id that does
 * not exist and a bank with no set-up stem each stop the build with that reason.
 * On a scratch copy with 10 of Basic-Pharmacokinetics' calculation questions, its
 * ASKS and its plan tables added (src/q1-q8 files, shell.html ASKS and views.js
 * PLAN_MODELS, PLAN_TOPIC, UNIT_POOL, CALC_ROUTINE_HTML, at ac2eb73; ids prefixed
 * plt-; their own professor and skills added to the course), in Chromium (src/
 * review_test.py lines 255-268 and 396-438 ported): the card on the Equations tab
 * with a scope per module, a wrong pick marked with the right line and why, the
 * miss tallied per line and kept through a reload, the worked problem shown in
 * place, how to reach a line the sheet does not print, the closing card with the
 * lines missed most often, Stop back to the picker, the drill redrawn when the tab
 * is opened again; the plan: what is asked from six, the unit, the model from the
 * course's list, the line, the sheet question, the givens as ticks with their roles
 * hidden, the plan written out in five lines, and a plan right in every step
 * counted. On a copy without ASKS and PLAN: no plan row, and the set-up drill runs.
 * Added in review (2026-11-02): the build refusals name the question and the equation,
 * and the build names formulas-in-text and equation-drill when they are off; the wrong
 * choices are never a line used on the way or the same relation and come from the stem's
 * module first; the ask and unit choices; the models a stem accepts against
 * Basic-Pharmacokinetics' own planModels; "the block" for an "Any route" model; givens
 * set aside; PLAN without ASKS; and the tally saved in the progress: a long tally through
 * a reload, a reload 300 ms after a pick, Export and Import into a fresh profile, a
 * profile switch, storage denied and full, and a saved tally of another shape.
 * The fixture: Basic-Pharmacokinetics' own values (ac2eb73), verbatim, `prof` and the
 * worked steps included (rework 2026-11-03, Louis's policy: real course data is kept).
 *
 *     node features/plan-the-problem/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/plan-the-problem/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

/* 10 of Basic-Pharmacokinetics' calculation questions with their set-up data, its
   ASKS (src/shell.html), the topics they use, and its plan tables (src/views.js), at
   ac2eb73. The set-up lines are among the 14 equations the equation-drill test adds. */
const PK = {"qs":[{"id":"m1-ord-n03","concept":"first-order-halflife","type":"numeric","prof":"Mosley","tier":"new","module":1,"topic":"orders","sub":"half","skill":"krate","stem":"A drug solution decomposes by a first-order process with a rate constant of 0.0866 hr⁻¹. How much time is required for exactly half the solution to decompose?","units":"hr","answer":8,"tol":0.2,"steps":[{"k":"setup","t":"t½ = {{frac:0.693|k}} for a first-order process.","why":"Setting the concentration to half its starting value in ln C = ln C0 − kt leaves ln 2, which is 0.693, divided by the rate constant. The starting concentration cancels, so a first-order half-life does not depend on it. This relation is not printed on the exam equation sheet."},{"k":"algebra","t":"t½ = {{frac:0.693|0.0866}} hr⁻¹ = 8.002 hr.","why":"Dividing a pure number by a quantity in reciprocal hours gives hours, which is the unit a half-life must have. The rate constant sits in the denominator because a faster process has a shorter half-life, so the two quantities move in opposite directions."},{"k":"round","t":"t½ = 8 hr.","why":"Dr. Mosley reports this as 8 hours, to the whole hour. The answer is a time and carries no reciprocal unit; hours to the minus one belongs to the rate constant that was given, not to the half-life that was asked for."}],"setup":{"eq":"thalf-first","pre":[],"why":"\"first-order process\" and \"half the solution\", so the first-order half-life line. Given k, asked t½, so t½ = {{frac:0.693|k}} directly. No hinge."},"asks":"t","givens":[["k","0.0866 hr⁻¹","the denominator of {{frac:0.693|k}}"]],"check":{"t":"The half-life is 0.693 over k. A k near one tenth per hour gives a half-life near 7 hr; 8 hr fits, and k × t½ must return 0.693.","lo":0},"cite":"IntroductionandMathReviewSolutions.pdf, problem 1c; Introduction.pdf slide 19"},{"id":"m2-n-cl2","concept":"cl-from-k-vd","type":"numeric","prof":"Mosley","tier":"new","module":2,"topic":"bolus1","sub":"calc","skill":"clearance","stem":"A 187-pound male patient received a drug by rapid IV injection. The drug has a half-life of 4 hours and an apparent volume of distribution that is 20% of body weight. What is the total body clearance in this patient?","units":"L/hr","answer":2.95,"tol":0.08,"steps":[{"k":"unit","t":"{{frac:187 lb|2.2 lb/kg}} = 85.0 kg","why":"Body weight in pharmacokinetics is always in kilograms, so a weight stated in pounds is converted before anything else is done with it. She divides by 2.2 and does not show the step, but every absolute quantity in this problem depends on it."},{"k":"setup","t":"ClT = k · VD, so the half-life has to become a rate constant and the percentage of body weight has to become an absolute volume before the two can be multiplied","why":"Total body clearance is k multiplied by VD, and neither is given directly: the stem gives a half-life and a percentage. Naming the relation first shows which two quantities have to be built. Dr. Mosley leaves this relation off the exam equation sheet, so it has to be known."},{"k":"algebra","t":"VD = 0.2 L/kg × 85.0 kg = 17.0 L","why":"A volume of distribution that is 20% of body weight becomes 0.2 L per kilogram under the assumption that 1 L corresponds to 1 kg. Multiplying by the patient weight in kilograms converts it into the absolute volume that clearance needs."},{"k":"algebra","t":"k = {{frac:0.693|4 hr}} = 0.1733 hr⁻¹","why":"The clearance equation takes a rate constant, not a half-life, so the stated half-life is converted first. Her keys report k to four decimal places throughout."},{"k":"algebra","t":"ClT = k·VD = (0.1733 hr⁻¹)(17.0 L) = 2.9461 L/hr","why":"Reciprocal hours multiplied by litres gives litres per hour. This is the relationship she withholds from the equation sheet, so both factors have to be assembled before it can be used."},{"k":"round","t":"ClT = 2.95 L/hr","why":"Her key prints 2.95 L/hr, two decimal places. Carrying k unrounded as 0.17325 hr⁻¹ gives 2.9453 L/hr, which rounds to the same value."}],"setup":{"eq":"cl-k-vd","pre":["thalf-first"],"why":"\"rapid IV injection\" and \"total body clearance\", so the clearance line. Given t½ and VD as a per cent of body weight, asked ClT, so ClT = k·VD. k first, from k = {{frac:0.693|t½}}, because the line wants k, not t½; the pounds to kilograms and per cent to litres steps are unit conversions."},"asks":"ClT","givens":[["weight","187-pound","becomes 85.0 kg, then VD = 0.2 × 85.0 = 17.0 L"],["t½","4 hours","gives k = {{frac:0.693|4}} = 0.1733 hr⁻¹"],["VD","20% of body weight","the fraction of 85.0 kg that is the volume, 17.0 L"]],"check":{"t":"187 lb is 85.0 kg, so VD is 17.0 L, and k is 0.693 over 4, 0.1733 hr⁻¹; about a sixth of 17.0 L cleared each hour is a little under 3 L/hr, so 2.95 L/hr fits.","lo":0},"cite":"IV-Bolus-Practice-3---Solutions.pdf, problem 1 part c"},{"id":"inf-n1","concept":"css-from-rate","type":"numeric","prof":"Mosley","tier":"new","module":3,"topic":"infusion","sub":"css","skill":"infusion","stem":"Theophylline is given by continuous intravenous infusion at 50 mg/hr. Its half-life is 6 hours and its volume of distribution is 30 L. What steady-state plasma concentration is expected?","units":"mg/L","answer":14.43,"tol":0.2,"steps":[{"k":"setup","t":"Css = {{frac:R|Cl}}, and clearance is itself k · VD, so the half-life has to become a rate constant before the plateau can be computed","why":"At steady state rate in equals rate out, and rate out is clearance times concentration, so the plateau is infusion rate divided by clearance. The stem gives a half-life and a volume, not a clearance, so two conversions come before the division."},{"k":"algebra","t":"k = {{frac:0.693|6 hr}} = 0.1155 hr⁻¹","why":"The steady-state concentration needs a clearance, and clearance is the elimination rate constant multiplied by the volume of distribution, so the half-life has to be converted to a rate constant first. Dividing 0.693 by a time in hours leaves reciprocal hours, which is what a first-order rate constant must be."},{"k":"algebra","t":"Cl = k · VD = (0.1155 hr⁻¹)(30 L) = 3.465 L/hr","why":"Clearance is the volume of plasma cleared of drug per unit time, and it is the product of the fractional rate of removal and the volume that drug occupies. Reciprocal hours multiplied by litres leaves litres per hour, the unit a clearance must carry."},{"k":"algebra","t":"Css = {{frac:R|Cl}} = {{frac:50 mg/hr|3.465 L/hr}} = 14.43 mg/L","why":"At steady state the rate in equals the rate out, and the rate out is clearance multiplied by concentration, so the concentration is the infusion rate divided by clearance. Milligrams per hour divided by litres per hour cancels the hours and leaves milligrams per litre."},{"k":"round","t":"Css = 14.43 mg/L","why":"Report 14.43 mg/L, or about 14 mg/L. The two decimal places follow the four-figure rate constant used throughout."}],"setup":{"eq":"css","pre":["thalf-first","cl-k-vd"],"why":"\"continuous intravenous infusion at\" a rate, so the infusion block. Given R, t½ and VD, asked the \"steady-state plasma concentration\", so Css = {{frac:R|Cl}}. k first, from k = {{frac:0.693|t½}}, then Cl = k·VD, because the line wants Cl and the stem gives t½ and VD instead."},"asks":"Css","givens":[["R","50 mg/hr","the numerator of {{frac:R|Cl}}"],["t½","6 hours","gives k = {{frac:0.693|6}} = 0.1155 hr⁻¹"],["VD","30 L","with k gives Cl = 0.1155 × 30 = 3.465 L/hr, the denominator"]],"check":{"t":"k is 0.693 over 6, 0.1155 hr⁻¹, so Cl is 0.1155 × 30 = 3.465 L/hr; 50 mg/hr spread over 3.465 L/hr is a little over 14 mg/L, and 14.43 fits.","lo":0},"cite":"3IntravenousInfusions.pdf, slide \"Example 1\""},{"id":"inf-n2","concept":"rate-for-target-css","type":"numeric","prof":"Mosley","tier":"new","module":3,"topic":"infusion","sub":"rate","skill":"infusion","stem":"The same drug has a half-life of 6 hours and a volume of distribution of 30 L. What infusion rate would achieve a steady-state concentration of 20 mg/L?","units":"mg/hr","answer":69.3,"tol":1,"steps":[{"k":"setup","t":"R = Css · Cl = Css · k · VD","why":"Rearranging Css equal to R over clearance puts the rate on its own, so the wanted concentration is multiplied rather than divided by clearance. Writing clearance as k times VD lets the two parameters given in the stem be used directly."},{"k":"algebra","t":"k = {{frac:0.693|6 hr}} = 0.1155 hr⁻¹","why":"The relation between rate and steady-state concentration runs through clearance, and clearance needs the rate constant. Converting the half-life first keeps every later line in reciprocal hours."},{"k":"algebra","t":"R = (20 mg/L)(0.1155 hr⁻¹)(30 L) = 69.3 mg/hr","why":"Milligrams per litre multiplied by reciprocal hours multiplied by litres cancels the litres and leaves milligrams per hour, which is the unit an infusion rate must have. The arithmetic is 20 times 3.465."},{"k":"round","t":"R = 69.3 mg/hr","why":"Report 69.3 mg/hr. One decimal place is what the four-figure rate constant supports. As a check, 69.3 divided by the clearance of 3.465 L/hr returns the 20 mg/L target."}],"setup":{"eq":"css","pre":["thalf-first","cl-k-vd"],"why":"\"infusion rate\" to achieve a \"steady-state concentration\", so the infusion block. Given Css, t½ and VD, asked R, so Css = {{frac:R|Cl}} rearranged to R = Css·Cl. k first, from k = {{frac:0.693|t½}}, then Cl = k·VD, because the line wants Cl."},"asks":"R","givens":[["t½","6 hours","gives k = {{frac:0.693|6}} = 0.1155 hr⁻¹"],["VD","30 L","with k gives Cl = 0.1155 × 30 = 3.465 L/hr"],["Css","20 mg/L","the target, multiplied by Cl"]],"check":{"t":"Cl is k × VD = 0.1155 × 30, about three and a half L/hr, and the rate has to replace what is cleared: 20 mg/L × Cl, about 69.3 mg/hr. A higher target needs a proportionally higher rate.","lo":0},"cite":"3IntravenousInfusions.pdf, slide \"Example 2\""},{"id":"m4-n-clt","concept":"total-clearance-kvd","type":"numeric","prof":"Mosley","tier":"new","module":4,"topic":"clearance","sub":"clcalc","skill":"clearance","stem":"Five hundred mg of a drug was administered by rapid IV injection. The VD is 15 L and the elimination half-life is 8 hours. Urine samples were collected for 48 hours and 300 mg of unchanged drug was recovered. Calculate ClT.","units":"L/hr","answer":1.3,"tol":0.03,"steps":[{"k":"setup","t":"ClT = k × VD","why":"Total body clearance is the overall elimination rate constant multiplied by the volume of distribution, the relationship Dr. Mosley requires from memory alongside the half-life equation. Both quantities are available here, one from the stated half-life and one stated directly."},{"k":"algebra","t":"k = {{frac:0.693|8}} hr = 0.086625 hr⁻¹","why":"The half-life is converted to a rate constant first, because clearance needs a fractional rate rather than a time. Reciprocal hours is what the next multiplication requires."},{"k":"algebra","t":"ClT = (0.086625 hr⁻¹)(15 L) = 1.299375 L/hr","why":"Reciprocal hours multiplied by litres leaves litres per hour, which is the unit a clearance must carry. The 300 mg of urinary drug plays no part in this line; it enters only when the total is split."},{"k":"round","t":"ClT = 1.3 L/hr","why":"Her worked value is 1.3 litres per hour, and she carries that rounded figure into the renal and hepatic parts that follow. Keeping her rounding is what reproduces her 0.78 and 0.52 exactly."}],"setup":{"eq":"cl-k-vd","pre":["thalf-first"],"why":"\"rapid IV injection\" with a VD and an \"elimination half-life\" names the clearance block. VD and t½ are given and ClT is asked, so ClT = k·VD. k first, from the half-life, because the line wants k, not t½; the urine figures are not used."},"asks":"ClT","givens":[["D0","Five hundred mg","not needed: ClT = k × VD"],["VD","15 L","one factor of k × VD"],["t½","8 hours","gives k = {{frac:0.693|8}} = 0.086625 hr⁻¹, the other factor"],["collection","48 hours","not needed"],["Du∞","300 mg","not needed"]],"check":{"t":"k is 0.693 over 8, 0.086625 hr⁻¹, so a little under a tenth of the 15 L is cleared each hour: a little under one and a half L/hr, and 1.3 L/hr fits.","lo":0,"hi":1.5},"cite":"4---Clearance-and-Elimination.pdf slide 22, with the relationship from slide 21"},{"id":"m4-n-crcl","concept":"cockcroft-gault","type":"numeric","prof":"Mosley","tier":"new","module":4,"topic":"clearance","sub":"crclcalc","skill":"crcl","stem":"Estimate, using the ideal body weight, the creatinine clearance of a 45-year-old female who weighs 61 kg, has a serum creatinine of 1.1 mg/dL, and is 165 cm tall.","units":"mL/min","answer":58.1,"tol":1,"steps":[{"k":"unit","t":"165 cm ÷ 2.54 cm/inch = 64.96 inches, taken as 65 inches, which is 5 inches over 5 ft","why":"The ideal body weight formula counts inches above five feet, so the metric height is converted and rounded as she does in her own working. Sixty inches is five feet, leaving five inches of excess height."},{"k":"algebra","t":"IBW = 45.5 + (2.3)(5) = 57 kg","why":"The female form of the equation is used because the patient is female. The 61 kg actual weight stated in the question is not used, because the question specifies ideal body weight, and she sets all her problems up this way."},{"k":"setup","t":"CrCl = [(140 − age){{frac:IBW|72 × SCr}}] × 0.85 for a female","why":"This is the Cockcroft-Gault equation, which she requires from memory. The 0.85 factor is applied because the patient is female, on the assumption built into the equation that women are smaller and less muscular than men."},{"k":"algebra","t":"(140 − 45)(57 kg) = (95)(57) = 5415","why":"The age term subtracts the patient age from 140 and the product is formed with the ideal body weight. Both terms are inputs to an empirical estimate, so the units do not cancel through the expression."},{"k":"algebra","t":"{{frac:5415|72 × 1.1 mg/dL}} = {{frac:5415|79.2}} = 68.37","why":"The denominator is the fixed constant 72 multiplied by the serum creatinine in milligrams per decilitre. A higher serum creatinine makes the denominator larger and the estimated clearance smaller, which is the direction renal impairment moves in."},{"k":"algebra","t":"CrCl = (68.37)(0.85) = 58.11 mL/min","why":"Applying the female factor reduces the estimate by 15 per cent, on the assumption built into the equation that women carry less muscle for the same height and age. The factor is dimensionless, so the units are unchanged by it."},{"k":"round","t":"CrCl = 58.1 mL/min","why":"Her worked answer is about 58 millilitres per minute, so 58.1 mL/min is the figure to carry. Creatinine clearance is reported in millilitres per minute, not litres per hour, because it is compared with the normal value of about 120 mL/min."}],"setup":{"eq":"crcl","pre":["ibw-female"],"why":"\"creatinine clearance\" \"using the ideal body weight\" of a \"female\" names the Cockcroft-Gault block. Age, SCr and height are given and CrCl is asked, so CrCl = (140 − age){{frac:IBW|72·SCr}}, times 0.85 for a female. IBW first, from IBWfemale = 45.5 + 2.3·(inches over 5 ft), because the line wants IBW, not the actual weight."},"asks":"CrCl","givens":[["age","45-year-old","in 140 − age = 95"],["sex","female","the 0.85 factor, and the 45.5 kg IBW base"],["weight","61 kg","not needed: the stem asks for the ideal body weight"],["SCr","1.1 mg/dL","in the denominator 72 × 1.1 = 79.2"],["height","165 cm","becomes 65 inches, so IBW = 45.5 + 2.3 × 5 = 57 kg"]],"check":{"t":"IBW is 57 kg; (140 − 45) × 57 over (72 × 1.1) is 68.37, and the female factor 0.85 brings it to 58.1 mL/min. The female value must be below the unadjusted 68.37.","lo":0,"hi":68.37},"cite":"4---Clearance-and-Elimination.pdf slide 17"},{"id":"m5-n07","concept":"tmax-from-rate-constants","type":"numeric","prof":"Mosley","tier":"new","module":5,"topic":"oral","sub":"peak","skill":"oral","stem":"A single oral dose of an antibiotic given to an adult 70 kg male patient is described by Cp = 75(e^(−0.22t) − e^(−2.75t)), with Cp in mcg/mL and t in hours. Calculate tmax.","units":"hr","answer":1,"tol":0.05,"steps":[{"k":"setup","t":"ka = 2.75 hr⁻¹ and k = 0.22 hr⁻¹, read from the exponents by size","why":"The two rate constants are already in the equation and need no conversion; only their identification is required. The larger is absorption because absorption is the faster process for an ordinary oral product, and putting them the other way round would give a negative denominator and a negative time."},{"k":"setup","t":"tmax = {{frac:ln(ka / k)|ka − k}}","why":"The time to peak is the moment at which the absorption and elimination rates are equal, obtained by setting the derivative of the concentration equation to zero. Only the rate constants appear, so the prefactor of 75 plays no part in this step."},{"k":"algebra","t":"tmax = {{frac:ln(2.75 / 0.22)|(2.75 − 0.22) hr⁻¹}} = {{frac:ln(12.5)|2.53 hr⁻¹}}","why":"The ratio of the two constants is dimensionless, so the logarithm can be taken. Dividing by a difference in reciprocal hours returns hours."},{"k":"algebra","t":"tmax = {{frac:2.5257|2.53 hr⁻¹}} = 0.9983 hr","why":"The ratio of the two rate constants is 12.5 and its natural logarithm is 2.5257, which is then divided by their difference of 2.53 reciprocal hours. That the numerator and denominator are so nearly equal here is a coincidence of these particular constants, not a general result."},{"k":"round","t":"tmax = 1 hour","why":"Her worked value is one hour, and the unrounded figure of 0.9983 hour rounds to it. The peak therefore occurs about one hour after the dose, which is early because absorption is more than twelve times faster than elimination for this drug."}],"setup":{"eq":"tmax","pre":[],"why":"\"single oral dose\" with the printed equation Cp = 75(e^(−0.22t) − e^(−2.75t)) names the oral block. ka and k are the larger and smaller exponents and tmax is asked, so tmax = {{frac:ln(ka ÷ k)|ka − k}}. No hinge; both rate constants are read straight off the equation."},"asks":"tmax","givens":[["weight","70 kg","not needed"],["coefficient","75","not needed: tmax depends on ka and k only"],["k","0.22","the smaller exponent, in hr⁻¹: the denominator of the ratio, subtracted below"],["ka","2.75","the larger exponent, in hr⁻¹: the numerator of the ratio; ka − k = 2.53"]],"check":{"t":"ka over k is 12.5, so ln(12.5) = 2.5257 over 2.53 is just under 1 hr; the peak must come after the quarter-hour absorption half-life and before much elimination at k = 0.22 hr⁻¹.","lo":0.252},"cite":"5---Pharmacokinetics-of-Oral-Absorption.pdf, slide \"Example 2\"; 09.21 lecture"},{"id":"m5-n08","concept":"cmax-by-substitution","type":"numeric","prof":"Mosley","tier":"new","module":5,"topic":"oral","sub":"peak","skill":"oral","stem":"A single oral dose of an antibiotic given to an adult 70 kg male patient is described by Cp = 75(e^(−0.22t) − e^(−2.75t)), with Cp in mcg/mL and t in hours. Calculate Cmax.","units":"mg/L","answer":55.4,"tol":1,"steps":[{"k":"setup","t":"Cmax is the concentration at tmax, so the time to peak has to be found first and then substituted back into the equation the stem supplies","why":"The peak is not a separate parameter to look up; it is the concentration equation evaluated at the one time the curve turns over. So the problem runs in two stages, and the second cannot start until the first gives a number. Naming both stages first stops the two rate constants being swapped."},{"k":"algebra","t":"tmax = {{frac:ln(2.75 / 0.22)|(2.75 − 0.22) hr⁻¹}} = 0.9983 hr, taken as 1 hr","why":"The peak concentration is the concentration at the time of the peak, so that time has to be in hand before the equation can be evaluated. This step is required even when the question asks only for the peak."},{"k":"setup","t":"Cmax = 75(e^(−(0.22)(1)) − e^(−(2.75)(1)))","why":"The whole prefactor has already been collected into the 75, so the only work left is to substitute the time into both exponentials. Each exponent is a reciprocal time multiplied by a time and so is dimensionless."},{"k":"algebra","t":"e^(−0.22) = 0.80252; e^(−2.75) = 0.06393; difference = 0.73859","why":"The absorption exponential has already fallen to about six per cent of its starting value by one hour, which is what makes the curve turn over. The bracket is a pure fraction below one, so the peak must be below the 75."},{"k":"algebra","t":"Cmax = (75)(0.73859) = 55.394 mg/L","why":"The intercept of 75 multiplies a dimensionless bracket, so the result keeps the concentration units of the equation. Evaluating at the unrounded time to peak of 0.9983 hour rather than at exactly 1 hour gives the same figure to one decimal place."},{"k":"round","t":"Cmax = 55.4 mg/L","why":"Report 55.4 milligrams per litre, the value the equation gives at the peak. The tolerance is set narrowly enough to exclude 53.4, which does not follow from the equation at any time near the peak."}],"setup":{"eq":"oral-cp","pre":["tmax"],"why":"\"single oral dose\" with the printed equation Cp = 75(e^(−0.22t) − e^(−2.75t)) names the oral block. The coefficient and both exponents are given and Cmax is asked, so the printed Cp line is evaluated at t = tmax. tmax first, from {{frac:ln(ka ÷ k)|ka − k}}, because the concentration line wants t."},"asks":"Cmax","givens":[["weight","70 kg","not needed"],["coefficient","75","in mg/L, multiplied by the bracket at tmax"],["k","0.22","the smaller exponent, in hr⁻¹: gives tmax and the e^(−0.22) term"],["ka","2.75","the larger exponent, in hr⁻¹: gives tmax and the e^(−2.75) term"]],"check":{"t":"At tmax of about 1 hr the fast term e^(−2.75) is small, 0.06393, and e^(−0.22) is 0.80252, so Cmax is a little under four fifths of 75 mg/L; it must be below the coefficient 75.","lo":0,"hi":75},"cite":"5---Pharmacokinetics-of-Oral-Absorption.pdf, slide \"Example 2\"; 09.21 lecture","note":"55.4 mg/L is the value the equation gives at the peak. A figure of 53.4 does not follow from it."},{"id":"m6-p1d","concept":"cmax-ss","type":"numeric","prof":"Mosley","tier":"new","module":6,"topic":"multi","sub":"ssbolus","skill":"multidose","stem":"One gram of a drug is given by IV bolus every 8 hours. The first dose peaks at 58.72 mg/L and k is 0.1732 hr⁻¹. Calculate the maximum steady-state plasma drug concentration.","units":"mg/L","answer":78.31,"tol":0.2,"steps":[{"k":"setup","t":"Cmax∞ = {{frac:C0|1 - e^(-kτ)}}","why":"The first-dose peak divided by (1 − e^(-kτ)) adds the drug accumulated from earlier doses, so the result must be larger than 58.72 mg/L."},{"k":"algebra","t":"e^(-(8 hr)(0.1732 hr⁻¹)) = e^(-1.386) = 0.2502; 1 - 0.2502 = 0.7498","why":"e^(-kτ) is the fraction of each dose left at the end of an interval, and 1 minus it is the fraction removed during the interval."},{"k":"algebra","t":"Cmax∞ = {{frac:58.72 mg/L|1 - e^(-(8)(0.1732))}} = {{frac:58.72 mg/L|0.7498}} = 78.31 mg/L","why":"Dividing by a number less than 1 raises the peak, as accumulation must: {{frac:58.72|0.7498}} = 78.31, a factor of 1.33."},{"k":"round","t":"Cmax∞ = 78.31 mg/L","why":"Her keyed value, 78.31 mg/L, higher than the first-dose 58.72 mg/L by the accumulation factor 1.33, as a steady-state peak must be."}],"setup":{"eq":"cmax-ss","pre":[],"why":"\"IV bolus every 8 hours\", \"maximum steady-state plasma drug concentration\". The first-dose peak C0, k and τ are given and Cmax∞ is asked, so Cmax∞ = {{frac:C0|1 - e^(-kτ)}}. No hinge: k is given."},"asks":"Cmaxss","givens":[["D0","One gram","not needed: already inside the given peak"],["τ","every 8 hours","the exponent kτ = 0.1732 × 8 = 1.386"],["C0","58.72 mg/L","the numerator"],["k","0.1732 hr⁻¹","the exponent kτ"]],"check":{"t":"Eight hours is two half-lives at k = 0.1732 hr⁻¹, so a quarter of each dose remains at the next; the accumulation factor is {{frac:1|1 − 0.25}}, a third more than C0: 78.31 mg/L, above 58.72 and below 2 × 58.72.","lo":58.72,"hi":117.44},"cite":"Multiple-IV-Bolus-Practice-1---Solutions.pdf, question 1(d)"},{"id":"m6-n05","concept":"cavg-ss","type":"numeric","prof":"Mosley","tier":"new","module":6,"topic":"multi","sub":"ssbolus","skill":"multidose","stem":"An antibiotic has an average t½ of approximately 4 hours and an apparent VD that is 25% of body weight. The drug is to be administered 10 mg/kg every 8 hours by multiple IV bolus injections to a 65-kg female. What is the expected average concentration at steady state?","units":"mg/L","answer":28.9,"tol":0.2,"steps":[{"k":"setup","t":"Cavg∞ = {{frac:FD0|VD kτ}}, with F = 1","why":"The average over one interval at steady state is the dose divided by clearance times the interval, and clearance is VD k. An intravenous (IV) dose has F = 1."},{"k":"unit","t":"{{frac:D0|VD}} = {{frac:10 mg/kg|0.25 L/kg}} = 40 mg/L","why":"{{frac:D0|VD}} is the first-dose C0 again, so the kilograms cancel and the value from part one can be reused. The dose is 650 mg and VD is 16.25 L, which give the same 40 mg/L."},{"k":"algebra","t":"Cavg∞ = {{frac:40 mg/L|(0.693/4 hr)(8 hr)}} = {{frac:40 mg/L|1.386}}","why":"k is {{frac:0.693|4}} = 0.1733 hr⁻¹ and τ is 8 hr. k times τ is reciprocal hours times hours, a pure number, so the result stays in mg/L."},{"k":"algebra","t":"Cavg∞ = 28.9 mg/L","why":"40 divided by 1.386 is 28.86. kτ is 1.386 because the interval is two half-lives: 2 × 0.693. No exponential is needed for the average."},{"k":"round","t":"Cavg∞ = 28.9 mg/L","why":"Her value, 28.9 mg/L. It lies between the steady-state trough, 13.3, and peak, 53.3, and below their midpoint, 33.3, because the decline is exponential."}],"setup":{"eq":"cavg-ss","pre":["thalf-first","cl-k-vd"],"why":"\"every 8 hours by multiple IV bolus injections\", \"average concentration at steady state\". D0, VD, t½ and τ are given and Cavg∞ is asked, so Cavg∞ = {{frac:FD0|ClT τ}} with F = 1 for an IV dose. k first, from the half-life, then ClT = kVD, because the line wants clearance."},"asks":"Cavgss","givens":[["t½","approximately 4 hours","gives k = {{frac:0.693|4}} = 0.1733 hr⁻¹"],["VD","25% of body weight","with the dose gives {{frac:D0|VD}} = 40 mg/L"],["D0","10 mg/kg","the numerator; F = 1 for IV"],["τ","every 8 hours","the denominator kτ = 1.386"],["weight","65-kg","not needed: the kilograms cancel"]],"check":{"t":"Cavg∞ is C0 = 40 mg/L divided by kτ = 1.386, so a little under three-quarters of C0: 28.9 mg/L. It lies between the steady-state trough and peak, so above 10 mg/L and below 2 × 40 mg/L.","lo":10,"hi":80},"cite":"6---Repetitive-IV-Bolus-and-Intermittent-IV-Infusions.pdf, slide \"(c) What is the expected average concentration at steady state?\" (Example 1); 09.23 lecture"}],"asks":{"k":["k","the first-order elimination rate constant: the fraction of the drug in the body removed per unit time"],"ka":["ka","the first-order absorption rate constant: the fraction of the drug at the absorption site taken up per unit time"],"k0":["k0","the zero-order rate constant: a fixed amount or concentration lost per unit time"],"thalf":["t½","the elimination half-life: the time for the amount or concentration to fall by one-half"],"thalfa":["t½a","the absorption half-life: the time for half of the drug at the absorption site to be absorbed"],"t":["t","a time: how long after the start, or how long until a level is reached"],"nhalf":["n","a count of half-lives"],"C0":["C0","the concentration at time zero: for an IV bolus the dose spread through the volume of distribution, for a solution its starting concentration"],"Cp":["Cp","the plasma concentration at a stated time"],"Css":["Css","the steady-state concentration: the plateau where rate in equals rate out (a constant infusion, or a daily dose rate of a nonlinear drug)"],"Cmax":["Cmax","the peak concentration after one dose"],"Cmin":["Cmin","the lowest concentration after one dose, just before the next"],"Cmaxss":["Cmax∞","the peak concentration at steady state, just after a dose"],"Cminss":["Cmin∞","the trough concentration at steady state, just before the next dose"],"Cavgss":["Cavg∞","the average concentration over one dosing interval at steady state"],"Cpn":["Cp (n doses)","the concentration at a stated time after the nth dose"],"tmax":["tmax","the time of the peak after one oral dose"],"tmaxss":["tmax∞","the time of the peak within a dosing interval at steady state"],"D0":["D0","the dose given each time"],"DL":["DL","the loading dose: the amount that puts the target level in the body at once"],"Dpo":["Dpo","the oral dose"],"DB":["DB","the amount of drug in the body at a stated time"],"Davgss":["Davg∞","the average amount of drug in the body over one dosing interval at steady state"],"Du":["Du","the amount of unchanged drug recovered in the urine"],"R":["R","the infusion rate or daily dose rate: amount delivered per unit time"],"rate":["dDB/dt","the rate of elimination: amount removed per unit time at a stated concentration"],"VD":["VD","the apparent volume of distribution: the volume that relates amount in the body to plasma concentration"],"Vp":["Vp","the volume of the central compartment"],"Vt":["Vt","the volume of the tissue compartment"],"ClT":["ClT","total body clearance: the volume of plasma cleared of drug per unit time"],"ClR":["ClR","renal clearance: the volume of plasma cleared of drug by the kidney per unit time"],"ClH":["ClH","hepatic (non-renal) clearance: total clearance less renal clearance"],"CrCl":["CrCl","creatinine clearance: the estimate of the glomerular filtration rate for this patient"],"IBW":["IBW","ideal body weight, from height and sex"],"fe":["fe","the fraction of the dose excreted unchanged in the urine"],"ke":["ke","the renal excretion rate constant: the renal share of k"],"F":["F","absolute bioavailability: the fraction of the dose reaching the circulation, against an IV dose"],"Frel":["Frel","relative bioavailability: the extent of one product against another, neither IV"],"AUC":["AUC","the area under the concentration–time curve: total exposure from one dose"],"AUCtau":["AUC over τ","the area under the curve over one dosing interval at steady state"],"alpha":["α","the distribution rate constant of a two-compartment drug"],"beta":["β","the elimination rate constant of a two-compartment drug"],"k12":["k12","the transfer rate constant from the central to the tissue compartment"],"k21":["k21","the transfer rate constant from the tissue to the central compartment"],"tau":["τ","the dosing interval"],"height":["height","the height, converted to the unit the formula wants"],"volume":["V","a volume of solution or of water"],"ratio":["ratio","a ratio or factor between two quantities"],"pct":["%","a percentage of a starting amount or of a plateau"],"Vmax":["Vmax","the maximum rate of elimination by the saturable process: an amount (or amount per kg) per unit time"],"Km":["KM","the Michaelis constant: the concentration at which the elimination rate is half of Vmax"],"Emax":["Emax","the maximum effect the drug can produce"],"EC50":["EC50","the concentration that produces half of the maximum effect"],"E":["E","the pharmacological effect at a given concentration"],"coef":["F ka D0 / VD(ka − k)","the coefficient of the single oral dose equation: the factor in front of the bracket of exponentials, in concentration units"]},"topics":[{"id":"orders","name":"Kinetic orders and the maths","prof":"Mosley","open":true,"cite":"Introduction.pdf slides 16–21","subs":[{"id":"zero","name":"Zero-order reactions","cite":"Introduction.pdf slide 17"},{"id":"first","name":"First-order reactions","cite":"Introduction.pdf slide 18"},{"id":"half","name":"Half-life, both orders","cite":"Introduction.pdf slide 19"},{"id":"plots","name":"Linear and semi-logarithmic plots","cite":"Introduction.pdf slides 20–21"},{"id":"decide","name":"Deciding the order from a data set","cite":"Introduction.pdf slides 17–18"}]},{"id":"bolus1","name":"One-compartment IV bolus","prof":"Mosley","cite":"2IVBolusAdministration.pdf, slide \"Lecture Objectives\"","subs":[{"id":"model","name":"The one-compartment model after an IV bolus injection","cite":"2IVBolusAdministration.pdf, slide \"Lecture Objectives\", bullet 1"},{"id":"vd","name":"Volume of distribution","cite":"2IVBolusAdministration.pdf, slides \"Volume of Distribution\""},{"id":"cl","name":"Clearance","cite":"2IVBolusAdministration.pdf, slide \"Clearance\""},{"id":"calc","name":"Parameters from concentration versus time data","cite":"2IVBolusAdministration.pdf, slide \"Lecture Objectives\", bullet 3"}]},{"id":"infusion","name":"Intravenous infusion","prof":"Mosley","cite":"3IntravenousInfusions.pdf, slide \"Objectives\"","subs":[{"id":"basics","name":"What an infusion does, and why the input is zero order","cite":"3IntravenousInfusions.pdf, slide \"Intravenous Infusion\""},{"id":"css","name":"Steady state and continuous dosing","cite":"3IntravenousInfusions.pdf, slide \"Drug Concentration at Steady-State\""},{"id":"pre","name":"Concentration before steady state is reached","cite":"3IntravenousInfusions.pdf, slides \"Drug Concentration Prior to Reaching Steady-State\""},{"id":"rate","name":"Infusion rate for a target steady-state concentration","cite":"3IntravenousInfusions.pdf, slide \"Objectives\", bullet 6"},{"id":"time","name":"Time to reach a stated fraction of steady state","cite":"3IntravenousInfusions.pdf, slide \"Example 4\""},{"id":"stop","name":"Concentration after the infusion is stopped","cite":"3IntravenousInfusions.pdf, slide \"Drug Concentration after an IV Infusion has Ended\""},{"id":"load","name":"Loading dose, alone and with a continuous infusion","cite":"3IntravenousInfusions.pdf, slides \"IV Bolus Loading Dose and Continuous IV Infusion\""}]},{"id":"clearance","name":"Elimination, clearance and renal clearance","prof":"Mosley","cite":"4---Clearance-and-Elimination.pdf slide 2","subs":[{"id":"routes","name":"The main routes of elimination, renal and hepatic","cite":"4---Clearance-and-Elimination.pdf slide 2, bullet 1"},{"id":"renalmech","name":"Glomerular filtration, tubular secretion and reabsorption","cite":"4---Clearance-and-Elimination.pdf slide 2, bullet 2"},{"id":"crclcalc","name":"Creatinine clearance and its significance","cite":"4---Clearance-and-Elimination.pdf slide 2, bullet 3"},{"id":"ionization","name":"Degree of ionization and renal excretion","cite":"4---Clearance-and-Elimination.pdf slide 2, bullet 4"},{"id":"clcalc","name":"Total, renal and hepatic clearance","cite":"4---Clearance-and-Elimination.pdf slide 2, bullet 5"}]},{"id":"oral","name":"Oral absorption, single dose","prof":"Mosley","cite":"5---Pharmacokinetics-of-Oral-Absorption.pdf slide 2","subs":[{"id":"extravasc","name":"Kinetics after extravascular administration","cite":"5---Pharmacokinetics-of-Oral-Absorption.pdf slide 2, bullet 1"},{"id":"conc","name":"Plasma concentration after a single oral dose","cite":"5---Pharmacokinetics-of-Oral-Absorption.pdf slide 2, bullet 2"},{"id":"peak","name":"Peak concentration and time to peak","cite":"5---Pharmacokinetics-of-Oral-Absorption.pdf slide 2, bullet 3"},{"id":"changes","name":"Effects of changing ka, k and dose","cite":"5---Pharmacokinetics-of-Oral-Absorption.pdf slide 2, bullet 4"}]},{"id":"multi","name":"Multiple dosing: repeated IV bolus (deck 6)","prof":"Mosley","cite":"6---Repetitive-IV-Bolus-and-Intermittent-IV-Infusions.pdf, slide \"Objectives\"","subs":[{"id":"accum","name":"Drug accumulation and steady state","cite":"6---Repetitive-IV-Bolus-and-Intermittent-IV-Infusions.pdf, slide \"Drug accumulation with repeated administration\""},{"id":"superpos","name":"The principle of superposition","cite":"6---Repetitive-IV-Bolus-and-Intermittent-IV-Infusions.pdf, slide \"Superposition\""},{"id":"ssbolus","name":"Maximum, minimum and average at steady state","cite":"6---Repetitive-IV-Bolus-and-Intermittent-IV-Infusions.pdf, slides \"Amount of Drug in the Body Following Repeated IV Bolus Injections\" to \"Example 1\""},{"id":"ndose","name":"Concentration after n doses and after the last dose","cite":"6---Repetitive-IV-Bolus-and-Intermittent-IV-Infusions.pdf, slides \"Plasma Drug Concentration at Any Time After n Doses\" to \"Example 3\""}]}],"plan":{"models":[["kin","Any route: order of elimination, half-life, AUC"],["bolus1","Single IV bolus, one compartment"],["bolus2","Single IV bolus, two compartments"],["infusion","Constant IV infusion"],["clearance","Any route: clearance and renal function"],["oral","Single oral dose"],["multi","Repeated IV bolus"],["intermit","Intermittent IV infusions"],["multoral","Multiple oral doses"],["bioavail","Bioavailability: two routes or two products compared"],["pkpd","PK-PD: duration of action after an IV bolus"],["nonlin","Nonlinear (Michaelis-Menten): KM, Vmax, dose rate and Css"]],"topics":{"orders":"kin","auc":"kin","bolus1":"bolus1","bolus2":"bolus2","infusion":"infusion","clearance":"clearance","oral":"oral","multi":"multi","intermit":"intermit","multoral":"multoral","bioavail":"bioavail","pkpd":"pkpd","nonlin":"nonlin"},"also":[[["kin","clearance"],"bolus","bolus1"],[["kin","clearance"],"infus","infusion"],[["kin","clearance"],"\\boral|tablet|capsule","oral"],[["pkpd"],"bolus","bolus1"]],"units":["mg/L","mcg/mL","mg","L","hr","min","hr⁻¹","L/hr","mL/min","(mg/L)·hr","mg/hr","no units"],"same":[],"routine":["<b>Write the symbol of what is asked</b> before anything else: C<sub>min</sub><sup>&infin;</sup>, C<sub>avg</sub><sup>&infin;</sup>, k, t&frac12;, D<sub>0</sub>. The line is the one with that symbol on the left.","<b>Name the dosing model</b> from the stem's words: single IV bolus, infusion, oral, repeated bolus, intermittent infusion, repeated oral. That names the block of the sheet.","<b>Pick the line in that block whose left side is the asked symbol.</b> Not the line whose right side holds the numbers already in hand: D<sub>0</sub> over V<sub>D</sub> is the first-dose peak, never an average or a trough.","<b>List the givens with their symbols</b> and cross out the ones the line does not use. A given the stem states but the line does not need is there to be set aside.","<b>Estimate before computing.</b> Count half-lives (two half-lives leave a quarter), and set bounds: a trough lies below its peak, an average between trough and peak, F at or below 1.","<b>Then the arithmetic, the units and the decimal places</b> she asked for. If the number falls outside the estimate, the line is wrong, not the calculator."]},"skills":[{"id":"krate","label":"Rate constant and half-life","short":"k and t½","kind":"calc"},{"id":"clearance","label":"Clearance — total, renal and hepatic","short":"Clearance","kind":"calc"},{"id":"infusion","label":"Infusion rate and steady state","short":"Infusion","kind":"calc"},{"id":"crcl","label":"Creatinine clearance and ideal weight","short":"CrCl","kind":"calc"},{"id":"oral","label":"Oral absorption — Cmax, tmax, ka","short":"Oral","kind":"calc"},{"id":"multidose","label":"Repeated dosing — peak, trough, average","short":"Multi-dose","kind":"calc"}],"lectures":[{"id":"L01","deck":"Introduction.pdf","label":"Module 1: Introduction, kinetic orders and AUC (17 & 19 Aug)","prof":"Mosley","exam":1,"module":1},{"id":"L02","deck":"2IVBolusAdministration.pdf","label":"Module 2: One-compartment IV bolus (24 Aug)","prof":"Mosley","exam":1,"module":2},{"id":"L04","deck":"3IntravenousInfusions.pdf","label":"Module 3: Intravenous infusion (2 Sep)","prof":"Mosley","exam":1,"module":3},{"id":"L05","deck":"4---Clearance-and-Elimination.pdf","label":"Module 4: Drug elimination, clearance and renal clearance (14 Sep)","prof":"Mosley","exam":2,"module":4},{"id":"L06","deck":"5---Pharmacokinetics-of-Oral-Absorption.pdf","label":"Module 5: Pharmacokinetics of oral absorption (16 & 21 Sep)","prof":"Mosley","exam":2,"module":5},{"id":"L07","deck":"6---Repetitive-IV-Bolus-and-Intermittent-IV-Infusions.pdf","label":"Module 6: Repetitive IV bolus injections (23 Sep)","prof":"Mosley","exam":2,"module":6}],"lectureOf":{"m1-ord-n03":"L01","m2-n-cl2":"L02","inf-n1":"L04","inf-n2":"L04","m4-n-clt":"L05","m4-n-crcl":"L05","m5-n07":"L06","m5-n08":"L06","m6-p1d":"L07","m6-n05":"L07"}};
const EQ_FIX = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'equation-drill', 'test.js'), 'utf8').match(/^const FIX = (\[.*\]);$/m)[1]);
const pre = id => 'eqt-' + id, qpre = id => 'plt-' + id;

/* Basic-Pharmacokinetics' own split (src/views.js line 4937), built from a string so
   that this file carries no lookbehind literal; Node reads it, older Safari would not. */
const LOOKBEHIND = new RegExp('(?<!\\.\\.)(?<=[.?!])\\s+');
const pkSplit = t => String(t || '').split(LOOKBEHIND).map(x => x.trim()).filter(Boolean);
const CONTROLS = ['One. Two? Three! Four', 'k = {{frac:0.693|t½}} = 0.1155 hr⁻¹. Then Cl.', '"the plateau..." is quoted. Next.',
  'Ends with a full stop.', 'Two  spaces.   Three spaces. ', 'No stop at all', '', 'a.. b. c', 'Is it 2.5? Yes. 0.5 of it!  Done'];

/* The scratch course: the 14 equations, the 10 questions (pushed onto the bank),
   their topics, ASKS and PLAN; `own` says which the course already declares. */
function fixtureFiles(own, opts){
  opts = opts || {};
  const eqs = EQ_FIX.map(e => Object.assign({}, e, {id: pre(e.id)}));
  const qs = PK.qs.map(q => Object.assign({}, q, {id: qpre(q.id),
    setup: Object.assign({}, q.setup, {eq: q.setup.eq === 'none' ? 'none' : pre(q.setup.eq), pre: (q.setup.pre || []).map(pre)}),
    asks: opts.noAsks ? undefined : q.asks}));
  if(opts.mutate) opts.mutate(qs, eqs);
  const plan = Object.assign({}, PK.plan, {same: PK.plan.same.map(g => g.map(pre))}, opts.plan || {});
  const decl = (name, value, has) => has ? `Object.assign(${name}, ${JSON.stringify(value)});` : `const ${name} = ${JSON.stringify(value)};`;
  let data = '/* Basic-Pharmacokinetics\' equations, ASKS and plan tables (ac2eb73), added by the plan-the-problem test */\n' +
    (own.EQUATIONS ? `EQUATIONS.push(...${JSON.stringify(eqs)});` : `const EQUATIONS = ${JSON.stringify(eqs)};`) + '\n';
  if(!opts.noAsks) data += decl('ASKS', PK.asks, own.ASKS) + '\n';
  if(!opts.noPlan) data += decl('PLAN', plan, own.PLAN) + '\n';
  const topics = PK.topics.filter(t => !own.topics.includes(t.id));
  return {'plan_test_data.js': data,
          'q90_plan_fixture.js': '/* 10 of Basic-Pharmacokinetics\' calculation questions (ac2eb73), added by the plan-the-problem test */\n' +
            `TOPICS.push(...${JSON.stringify(topics)});\nQUESTIONS.push(...${JSON.stringify(qs)});\n`};
}
/* The fixture keeps Basic-Pharmacokinetics' own `prof` and `skill` (rework 2026-11-03: real course data is
   kept verbatim): the course line adds that professor and those skills when the course lacks them. */
const PK_PROFS = [...new Set(PK.qs.concat(PK.topics).map(x => x.prof))];
const courseLine = "COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).filter(f => f !== 'plan_test_data.js').concat(['plan_test_data.js']);" +
  ` COURSE.professors = (COURSE.professors || []).concat(${JSON.stringify(PK_PROFS)}.filter(p => !(COURSE.professors || []).includes(p)));` +
  ` COURSE.skills = (COURSE.skills || []).concat(${JSON.stringify(PK.skills)}.filter(s => !(COURSE.skills || []).some(x => x.id === s.id)));`;
/* The copies without ASKS switch terms-variables off when the course has it on: its build step refuses a course
   whose ASKS lacks the keys its `families`, `names` and `twins` options name, and these copies exist to show this
   module without ASKS. No module needs terms-variables (module.json `needs`), so this module is unaffected. */
const noAsksLine = " if(COURSE.features && COURSE.features['terms-variables']) delete COURSE.features['terms-variables'];";

(async () => {
  console.log('\n=== the course\'s own set-up data ===');
  L.PAGE.need(NAME);
  const X = L.engine('({EQUATIONS: typeof EQUATIONS === "undefined" ? null : EQUATIONS, ASKS: typeof ASKS === "undefined" ? null : ASKS,' +
    ' PLAN: typeof PLAN === "undefined" ? null : PLAN, QUESTIONS, TOPICS, COURSE, FX})');
  const S = X.FX && X.FX.api('plan-the-problem');
  if(!check(!!S, 'the page carries plan-the-problem, working', JSON.stringify((X.FX && X.FX.errors) || 'no feature modules in the page'))) L.finish(NAME);
  const pool = S.suPoolAll();
  const badOpt = pool.filter(q => { const o = S.suOptions(q); return o.length !== Math.min(4, X.EQUATIONS.length) || new Set(o.map(x => x.id)).size !== o.length || !o.some(x => x.id === q.setup.eq); }).map(q => q.id);
  check(pool.length && !badOpt.length, `every set-up stem is offered four distinct lines, the right one among them (${pool.length} stems)`, badOpt.slice(0, 6).join(', '));
  const torn = pool.filter(q => S.whySentences(q.setup.why).some(t => (t.match(/\{\{/g) || []).length !== (t.match(/\}\}/g) || []).length || /^\d/.test(t))).map(q => q.id);
  check(!torn.length, 'every set-up reason splits into whole sentences (no fraction or decimal cut)', torn.slice(0, 6).join(', '));
  const differ = CONTROLS.concat(pool.map(q => q.setup.why)).filter(t => JSON.stringify(S.whySentences(t)) !== JSON.stringify(pkSplit(t)));
  check(!differ.length, `the sentence split without lookbehind gives Basic-Pharmacokinetics' sentences on ${CONTROLS.length} control texts and ${pool.length} reasons`, differ.slice(0, 3).join(' | '));

  /* the three other lines (src/views.js lines 4888-4906): never a line the working uses on the way or a
     line counted as the same relation (PLAN.same), and drawn from the stem's own module first */
  const EQ = Object.fromEntries(X.EQUATIONS.map(e => [e.id, e]));
  const sameOf = id => new Set(((X.PLAN && X.PLAN.same) || []).filter(g => g.includes(id)).flat());
  const lureBad = [], lureFar = [];
  for(const q of pool) for(let k = 0; k < 20; k++){
    const e = EQ[q.setup.eq], used = new Set([q.setup.eq, ...sameOf(q.setup.eq), ...(q.setup.pre || [])]);
    const lures = S.suOptions(q).filter(o => o.id !== q.setup.eq);
    if(lures.some(o => used.has(o.id))) lureBad.push(q.id);
    const near = X.EQUATIONS.filter(x => x.module === e.module && !used.has(x.id)).length;
    if(lures.filter(o => o.module === e.module).length !== Math.min(3, near)) lureFar.push(q.id);
  }
  check(pool.length && !lureBad.length, `no wrong choice is a line used on the way or the same relation (${pool.length} stems, 20 draws each)`, [...new Set(lureBad)].slice(0, 6).join(', '));
  check(pool.length && !lureFar.length, 'the wrong choices come from the stem\'s own module first', [...new Set(lureFar)].slice(0, 6).join(', '));

  const own = {EQUATIONS: !!X.EQUATIONS, ASKS: !!X.ASKS, PLAN: !!X.PLAN, topics: X.TOPICS.map(t => t.id)};

  console.log('\n=== the build step stops on bad set-up data ===');
  const refusals = [
    // the message names the question and the equation (the coordinator's integration check, evidence/integration 1329222)
    ['a set-up line that is not in EQUATIONS, named with its question', {mutate: qs => { qs[0].setup.eq = 'eqt-nowhere'; }},
      new RegExp(qpre(PK.qs[0].id) + ': setup names the equation "eqt-nowhere", which is not in EQUATIONS')],
    ['a line used on the way that is not in EQUATIONS, named with its question', {mutate: qs => { qs[3].setup.pre = ['eqt-gone']; }},
      new RegExp(qpre(PK.qs[3].id) + ': setup.pre names "eqt-gone", which is not in EQUATIONS')],
    ['a given that is not [symbol, value, role]', {mutate: qs => { qs[1].givens = [['R', '50 mg/hr']]; }}, /is not \[symbol, value, role\]/],
    ['an asks key that ASKS does not have', {mutate: qs => { qs[2].asks = 'nowhere'; }}, /is not a key of ASKS/],
    ['a PLAN.same id that is not in EQUATIONS', {plan: {same: [['eqt-css', 'eqt-nowhere']]}}, /PLAN\.same 1 names "eqt-nowhere"/]];
  for(const [label, opts, want] of refusals){
    const r = L.scratchBuild('plan-refuse', {files: fixtureFiles(own, opts), courseLine});
    check(r.code !== 0 && want.test(r.out), `${label} stops the build and says so`, r.out.split('\n').slice(-2).join(' '));
    r.rm();
  }
  { // every stem, the course's own included, set to no catalog line by a question file read last
    const files = Object.assign(fixtureFiles(own), {'q99_plan_nosetup.js': "QUESTIONS.forEach(q => { if(q.setup) q.setup = Object.assign({}, q.setup, {eq: 'none'}); });\n"});
    const r = L.scratchBuild('plan-empty', {files, courseLine});
    check(r.code !== 0 && /nothing to ask/.test(r.out), 'a bank with no set-up stem stops the build and says so', r.out.split('\n').slice(-2).join(' '));
    r.rm();
  }
  { // module.json `needs`: with equation-drill and formulas-in-text off, the build names them
    const r = L.scratchBuild('plan-needs', {files: fixtureFiles(own), courseLine: courseLine + " delete COURSE.features['equation-drill']; delete COURSE.features['formulas-in-text'];"});
    check(r.code !== 0 && /plan-the-problem needs \[.*formulas-in-text.*equation-drill.*\]/.test(r.out), 'with formulas-in-text and equation-drill off, the build stops and names both', r.out.split('\n').slice(-2).join(' '));
    r.rm();
  }

  console.log('\n=== on a scratch copy with Basic-Pharmacokinetics\' calculation questions (Chromium) ===');
  const s = L.scratchBuild('plan', {files: fixtureFiles(own), courseLine});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test questions does not build: ' + s.out.split('\n').pop());
  // without ASKS and PLAN: a question file read last empties the course's own, when it has them
  const s2 = L.scratchBuild('plan-noplan', {files: Object.assign(fixtureFiles(own, {noAsks: true, noPlan: true}), {'q99_plan_noplan.js':
    "QUESTIONS.forEach(q => { delete q.asks; });\nif(typeof ASKS !== 'undefined') for(const k of Object.keys(ASKS)) delete ASKS[k];\n" +
    "if(typeof PLAN !== 'undefined') for(const k of Object.keys(PLAN)) delete PLAN[k];\n"}), courseLine: courseLine + noAsksLine});
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1300}});
    const ev = (f, a) => page.evaluate(f, a);
    const pane = () => ev(() => document.getElementById('v-eq').textContent);
    await page.click('#nav button[data-v="eq"]');
    await page.waitForSelector('#v-eq .sucard', {timeout: 5000}).catch(() => {});
    const card = await ev(() => ({card: document.querySelectorAll('#v-eq .sucard').length, all: !!document.querySelector('#v-eq .sucard [data-su="all"]'),
      m3: !!document.querySelector('#v-eq .sucard [data-su="3"]'), plan: document.querySelectorAll('#v-eq .sucard [data-su^="plan:"]').length,
      routine: document.querySelectorAll('#v-eq .sucard .routine li').length}));
    check(card.card === 1 && card.all && card.m3, 'the Equations tab offers the set-up drill with a scope per module', card);
    check(card.plan >= 2 && card.routine === 6, 'it offers the plan per module, and the course\'s six steps for any calculation', card);

    await page.click('#v-eq .sucard [data-su="3"]');
    const s3 = await ev(() => { const A = FX.api('plan-the-problem'), SU = A.state();
      return {stem: document.querySelectorAll('#v-eq .suq .stem').length, opts: document.querySelectorAll('#v-eq [data-suopt]').length,
              m3: SU.queue.every(q => q.module === 3), n: SU.queue.length}; });
    check(s3.stem === 1 && s3.opts === 4 && s3.m3, `starting it shows one Module 3 stem with four lines to choose from (${s3.n} stems)`, s3);
    const wrong = await ev(() => { const SU = FX.api('plan-the-problem').state(), q = SU.queue[SU.i]; return SU.page[q.id].options.findIndex(o => o.id !== q.setup.eq); });
    await page.click(`#v-eq [data-suopt="${wrong}"]`);
    const w = await ev(() => { const SU = FX.api('plan-the-problem').state(), q = SU.queue[SU.i];
      return {w: document.querySelectorAll('#v-eq .suopt.wrong').length, r: document.querySelectorAll('#v-eq .suopt.right').length,
              vb: document.querySelectorAll('#v-eq .verdict.bad').length, sr: document.querySelectorAll('#v-eq .suright').length,
              why: document.querySelectorAll('#v-eq .why .tlist li').length, asked: SU.asked, right: SU.right, eq: q.setup.eq,
              tally: (DB.setup || {})[q.setup.eq]}; });
    check(w.w === 1 && w.r === 1 && w.vb === 1 && w.sr === 1 && w.why >= 1 && w.asked === 1 && w.right === 0,
          'a wrong pick is marked, the right line is shown with why, one sentence a line', w);
    check(w.tally && w.tally.wrong === 1 && w.tally.seen === 1, 'the missed line is tallied per equation in the progress', w.tally);
    await page.click('#v-eq [data-sushow]');
    check(await ev(() => document.querySelectorAll('#v-eq .suwork .steps li').length >= 2 && document.querySelectorAll('#v-eq .suq').length === 1),
          'Show the problem worked out opens the keyed answer and the steps in place');
    // a line the sheet does not print: Basic-Pharmacokinetics' first-order half-life (sheet "no", with its derivation)
    await ev(() => { const A = FX.api('plan-the-problem'); A.suStart('1'); const SU = A.state(); SU.queue = SU.queue.filter(q => q.id === 'plt-m1-ord-n03'); SU.i = 0; A.render(); });
    const right1 = await ev(() => { const SU = FX.api('plan-the-problem').state(), q = SU.queue[SU.i]; return SU.page[q.id].options.findIndex(o => o.id === q.setup.eq); });
    await page.click(`#v-eq [data-suopt="${right1}"]`);
    const r1 = await ev(() => { const d = document.querySelector('#v-eq details.eqmore'); if(d) d.open = true;
      return {ok: document.querySelectorAll('#v-eq .verdict.ok').length, how: d ? d.textContent : '', said: document.querySelector('#v-eq .suright').textContent}; });
    check(r1.ok === 1 && /how to get there/.test(r1.how) && /0\.693/.test(r1.how), 'a right pick of a line the sheet does not print comes with the way to reach it', r1.how.slice(0, 120));
    check(/not printed; the professor said so, and said to know it/.test(r1.said), 'and says the professor said it is not on the sheet, and said to know it', r1.said);
    await page.click('#v-eq [data-sunext]');
    const end = await ev(() => ({text: document.getElementById('v-eq').textContent, again: !!document.querySelector('#v-eq [data-suagain]')}));
    check(/1 of 1/.test(end.text) && end.again && /The lines you missed most often/.test(end.text), 'after the last stem: the count, the lines missed most often, Again', end.text.slice(0, 200));
    await page.click('#nav button[data-v="topics"]'); await page.click('#nav button[data-v="eq"]');
    await page.waitForSelector('#v-eq [data-suroot]', {timeout: 5000}).catch(() => {});
    check(await ev(() => !!document.querySelector('#v-eq [data-suroot] [data-suagain]')), 'opening the tab again while the drill runs shows the drill');
    await page.click('#v-eq [data-suhome]');
    await page.waitForSelector('#v-eq .sucard', {timeout: 5000}).catch(() => {});
    check(await ev(() => !FX.api('plan-the-problem').state() && !!document.querySelector('#v-eq .sucard') && !document.querySelector('#v-eq [data-suroot]')),
          'Stop returns to the Equations picker, with the card');

    console.log('  -- plan the problem --');
    await ev(() => { const A = FX.api('plan-the-problem'); A.suStart('plan:3');
      const SU = A.state(); SU.queue = SU.queue.filter(q => q.id === 'plt-inf-n1'); SU.i = 0; A.render(); });
    const p0 = await ev(() => ({ask: document.querySelectorAll('#v-eq [data-suask]').length, model: document.querySelectorAll('#v-eq [data-sumodel]').length,
                                line: document.querySelectorAll('#v-eq [data-suopt]').length}));
    check(p0.ask === 6 && !p0.model && !p0.line, 'the plan opens on "What is asked?" with six symbols and nothing else yet', p0);
    await page.click('#v-eq [data-suask="Css"]');
    const p1 = await ev(() => ({ok: FX.api('plan-the-problem').state().page['plt-inf-n1'].askOk, units: document.querySelectorAll('#v-eq [data-suunit]').length,
      text: document.getElementById('v-eq').textContent}));
    check(p1.ok && p1.units === 6 && /steady-state concentration/.test(p1.text), 'the right symbol is marked, its meaning shown, and six units offered', {ok: p1.ok, units: p1.units});
    await page.click('#v-eq [data-suunit="mg/L"]');
    const p2 = await ev(() => ({ok: FX.api('plan-the-problem').state().page['plt-inf-n1'].unitOk, models: document.querySelectorAll('#v-eq [data-sumodel]').length,
                                line: document.querySelectorAll('#v-eq [data-suopt]').length, n: PLAN.models.length}));
    check(p2.ok && p2.models === p2.n && !p2.line, `the unit is judged and the ${p2.n} models of the course's list are offered, the line held back`, p2);
    await page.click('#v-eq [data-sumodel="oral"]');
    const p3 = await ev(() => ({ok: FX.api('plan-the-problem').state().page['plt-inf-n1'].modelOk, text: document.getElementById('v-eq').textContent,
                                line: document.querySelectorAll('#v-eq [data-suopt]').length}));
    check(!p3.ok && /Not Single oral dose: this stem is Constant IV infusion/.test(p3.text) && p3.line === 4, 'a wrong model is marked, the stem\'s model named, then the four lines', p3.ok);
    const right = await ev(() => { const SU = FX.api('plan-the-problem').state(), q = SU.queue[0]; return SU.page[q.id].options.findIndex(o => o.id === q.setup.eq); });
    await page.click(`#v-eq [data-suopt="${right}"]`);
    check(await ev(() => document.querySelectorAll('#v-eq [data-susheet]').length === 2 && !document.querySelector('#v-eq [data-sugiv]')),
          'after the line: whether the sheet prints it, before the givens');
    await page.click('#v-eq [data-susheet="yes"]');
    const g0 = await ev(() => ({ok: FX.api('plan-the-problem').state().page['plt-inf-n1'].sheetOk, giv: document.querySelectorAll('#v-eq [data-sugiv]').length,
      role: document.querySelectorAll('#v-eq .surole').length, chk: document.querySelectorAll('#v-eq [data-sugivcheck]').length,
      n: QUESTIONS.find(q => q.id === 'plt-inf-n1').givens.length}));
    check(g0.ok && g0.giv === g0.n && !g0.role && g0.chk === 1, `the sheet answer is judged; the ${g0.n} givens are offered as ticks with their roles hidden`, g0);
    await page.click('#v-eq [data-sugiv="0"]'); await page.click('#v-eq [data-sugiv="1"]'); await page.click('#v-eq [data-sugiv="2"]');
    await page.click('#v-eq [data-sugiv="2"]');
    check(await ev(() => document.querySelectorAll('#v-eq [data-sugiv][aria-pressed="true"]').length === 2), 'ticks toggle and show as pressed');
    await page.click('#v-eq [data-sugiv="2"]');
    await page.click('#v-eq [data-sugivcheck]');
    const done = await ev(() => { const A = FX.api('plan-the-problem'), SU = A.state();
      return {li: document.querySelectorAll('#v-eq .suplan li').length, text: document.querySelector('#v-eq .suplan') ? document.querySelector('#v-eq .suplan').textContent : '',
              givOk: SU.page['plt-inf-n1'].givOk, plans: SU.plans, roles: document.querySelectorAll('#v-eq .surole').length}; });
    check(done.li === 5 && /Asked:/.test(done.text) && /Before computing/.test(done.text) && done.roles === 3, 'the plan is written out: asked, model, line, givens, estimate; each given\'s role shown', done);
    check(done.givOk && done.plans === 0, 'the givens are right, and a plan with a wrong model is not counted as right in every step', done);
    await ev(() => { const A = FX.api('plan-the-problem'); A.suStart('plan:3'); const SU = A.state(); SU.queue = SU.queue.filter(q => q.id === 'plt-inf-n1'); SU.i = 0; A.render(); });
    await page.click('#v-eq [data-suask="Css"]'); await page.click('#v-eq [data-suunit="mg/L"]'); await page.click('#v-eq [data-sumodel="infusion"]');
    const right2 = await ev(() => { const SU = FX.api('plan-the-problem').state(), q = SU.queue[0]; return SU.page[q.id].options.findIndex(o => o.id === q.setup.eq); });
    await page.click(`#v-eq [data-suopt="${right2}"]`); await page.click('#v-eq [data-susheet="yes"]');
    for(const i of [0, 1, 2]) await page.click(`#v-eq [data-sugiv="${i}"]`);
    await page.click('#v-eq [data-sugivcheck]');
    check(await ev(() => FX.api('plan-the-problem').state().plans === 1 && /The right givens/.test(document.getElementById('v-eq').textContent)),
          'a plan right in every step is counted');
    check(await ev(() => /Constant IV infusion: the block of the sheet to read from/.test(document.querySelector('#v-eq .suplan').textContent)),
          'the plan names the model\'s block of the sheet');
    /* every step right, by the page's own buttons, for one stem */
    const planRight = id => ev(id => { const A = FX.api('plan-the-problem'); A.suStart('plan:all');
      const SU = A.state(); SU.queue = SU.queue.filter(q => q.id === id); SU.i = 0; A.render();
      const q = SU.queue[0], st = SU.page[q.id], el = s => { const b = document.querySelector('#v-eq ' + s); if(!b) throw new Error('no ' + s); b.click(); };
      if(A.planHasAsk(q)){ el(`[data-suask="${q.asks}"]`); el(`[data-suunit="${CSS.escape(st.unitOpts.find(u => A.normUnit(u) === A.normUnit(q.units)))}"]`); }
      el(`[data-sumodel="${A.planModels(q).main}"]`);
      el(`[data-suopt="${st.options.findIndex(o => o.id === q.setup.eq)}"]`);
      el(`[data-susheet="${EQUATIONS.find(e => e.id === q.setup.eq).sheet === 'yes' ? 'yes' : 'no'}"]`);
      // the givens the line uses, read from the roles here (src/views.js line 4816): every role not starting "not needed"
      (q.givens || []).forEach((g, i) => { if(!/^not needed/i.test(g[2] || '')) el(`[data-sugiv="${i}"]`); });
      el('[data-sugivcheck]');
      return {plans: SU.plans, text: (document.querySelector('#v-eq .suplan') || {}).textContent || ''}; }, id);
    const kin = await planRight('plt-m1-ord-n03');
    check(kin.plans === 1 && /Any route: order of elimination, half-life, AUC: the block to read from/.test(kin.text),
          'a stem of an "Any route" model: the plan says the block, not the block of the sheet (src/views.js line 4974)', kin.text.slice(0, 160));
    const aside = await planRight('plt-m4-n-clt');
    check(aside.plans === 1 && /Set aside: /.test(aside.text) && (aside.text.match(/Set aside: ([^.]*)\./) || ['', ''])[1].split(', ').length === 3,
          'the three givens whose role says "not needed" are set aside, and ticking only the other two makes the plan right', aside.text.slice(0, 300));

    /* What is asked and its unit (src/views.js lines 4820-4832): six symbols with the right one and the
       same module's other asked symbols first; up to six units, the right one among them, none twice;
       and the dosing model a stem accepts, against Basic-Pharmacokinetics' own planModels (lines 4809-4815) */
    const opts = await ev(() => { const A = FX.api('plan-the-problem'), pool = A.suPoolAll(), bad = [];
      const nu = A.normUnit;
      for(const q of pool) for(let k = 0; k < 20; k++){
        const a = A.planAskOpts(q), u = A.planUnitOpts(q);
        const near = [...new Set(pool.filter(x => x.module === q.module && x.asks && ASKS[x.asks] && x.asks !== q.asks).map(x => x.asks))];
        const nearU = [...new Set(pool.filter(x => x.module === q.module).map(x => nu(x.units)))];
        if(a.length !== Math.min(6, Object.keys(ASKS).length) || new Set(a).size !== a.length || !a.includes(q.asks) || !a.every(x => ASKS[x])) bad.push(q.id + ' asks');
        if(near.length <= 5 && !near.every(x => a.includes(x))) bad.push(q.id + ' asks-near');
        if(u.length > 6 || new Set(u.map(nu)).size !== u.length || !u.some(x => nu(x) === nu(q.units))) bad.push(q.id + ' units');
        if(nearU.length <= 6 && !nearU.every(x => u.some(y => nu(y) === x))) bad.push(q.id + ' units-near');
      }
      // Basic-Pharmacokinetics' planModels, written out as it stands (PLAN_TOPIC is the course's PLAN.topics)
      const pkModels = q => { const main = PLAN.topics[q.topic] || 'kin', acc = new Set([main]);
        if(main === 'kin' || main === 'clearance'){ const s = String(q.stem).toLowerCase();
          if(/bolus/.test(s)) acc.add('bolus1'); if(/infus/.test(s)) acc.add('infusion'); if(/\boral|tablet|capsule/.test(s)) acc.add('oral'); }
        if(main === 'pkpd' && /bolus/i.test(String(q.stem))) acc.add('bolus1');
        return {main, acc: [...acc].sort().join(',')}; };
      // the stems as the course has them, and each with the route words added, so every PLAN.also row is reached
      const probes = pool.flatMap(q => [q, ...['an IV bolus', 'an infusion', 'an oral tablet'].map(w => Object.assign({}, q, {stem: q.stem + ' ' + w}))])
        .concat(pool.map(q => Object.assign({}, q, {topic: 'pkpd', stem: 'after an IV bolus'})));
      const modelBad = probes.filter(q => { const m = A.planModels(q), r = pkModels(q); return m.main !== r.main || [...m.acc].sort().join(',') !== r.acc; }).map(q => q.id + ':' + q.topic);
      return {bad, modelBad, n: pool.length, probes: probes.length}; });
    check(!opts.bad.length, `"What is asked?" offers six distinct symbols with the right one and its module's first, and the units are distinct with the right one (${opts.n} stems, 20 draws each)`, opts.bad.slice(0, 6).join(', '));
    check(!opts.modelBad.length, `the models a stem accepts are Basic-Pharmacokinetics' own (${opts.probes} stems and variants)`, opts.modelBad.slice(0, 6).join(', '));
    await ev(() => FX.api('plan-the-problem').suStop());
    await page.waitForTimeout(400);
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const kept = await ev(() => Object.values(DB.setup || {}).reduce((n, r) => n + r.seen, 0));
    check(kept === 6, 'the tally of lines picked is kept in the progress through a reload (6 picks)', kept);
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();

    if(s2.code !== 0) check(false, 'the copy without ASKS and PLAN builds', s2.out.split('\n').pop());
    else {
      const b = await L.openPage(browser, s2.page, {viewport: {width: 1100, height: 1300}});
      await b.page.click('#nav button[data-v="eq"]');
      await b.page.waitForSelector('#v-eq .sucard', {timeout: 5000}).catch(() => {});
      const np = await b.page.evaluate(() => ({card: !!document.querySelector('#v-eq .sucard'), plan: document.querySelectorAll('#v-eq .sucard [data-su^="plan:"]').length,
        routine: !!document.querySelector('#v-eq .sucard .routine')}));
      await b.page.evaluate(() => FX.api('plan-the-problem').suStart('plan:all'));
      const np2 = await b.page.evaluate(() => ({mode: FX.api('plan-the-problem').state().mode, opts: document.querySelectorAll('#v-eq [data-suopt]').length,
        ask: document.querySelectorAll('#v-eq [data-suask]').length}));
      check(np.card && !np.plan && !np.routine && np2.mode === 'line' && np2.opts === 4 && !np2.ask, 'without ASKS and PLAN: no plan row, and the set-up drill runs on its own', {np, np2});
      check(!b.errors.length, 'no page error without ASKS and PLAN', b.errors.slice(0, 3).join(' | '));
      await b.ctx.close();
    }

    { // PLAN without ASKS: the questions keep `asks`, the course's ASKS is left with no keys (src/views.js line 4833)
      // read after plan_test_data.js, which fills ASKS
      const s3 = L.scratchBuild('plan-noasks', {files: Object.assign(fixtureFiles(own), {'plan_noasks.js': 'for(const k of Object.keys(ASKS)) delete ASKS[k];\n'}),
        courseLine: courseLine + " COURSE.files = COURSE.files.concat(['plan_noasks.js']);" + noAsksLine});
      if(s3.code !== 0) check(false, 'the copy with PLAN and no ASKS builds', s3.out.split('\n').pop());
      else {
        const c = await L.openPage(browser, s3.page, {viewport: {width: 1100, height: 1300}});
        await c.page.click('#nav button[data-v="eq"]');
        await c.page.waitForSelector('#v-eq .sucard', {timeout: 5000}).catch(() => {});
        const na = await c.page.evaluate(() => { const card = document.querySelector('#v-eq .sucard').textContent;
          FX.api('plan-the-problem').suStart('plan:all');
          return {asksOn: QUESTIONS.filter(q => q.asks).length, card: /what is asked and its unit/.test(card), mode: FX.api('plan-the-problem').state().mode,
                  ask: document.querySelectorAll('#v-eq [data-suask]').length, unit: document.querySelectorAll('#v-eq [data-suunit]').length,
                  model: document.querySelectorAll('#v-eq [data-sumodel]').length}; });
        check(na.asksOn > 0 && !na.card && na.mode === 'plan' && !na.ask && !na.unit && na.model > 0 && !c.errors.length,
              'with PLAN and no ASKS: the plan starts at the dosing model, with no "What is asked?" or unit step', Object.assign(na, {errors: c.errors.slice(0, 2)}));
        await c.ctx.close();
      }
      s3.rm();
    }

    console.log('  -- persistence: a long tally, reloads, Export and Import, profiles, storage denied and full --');
    {
      // sessionStorage '__plfail' = 'deny' or 'full' makes every localStorage write throw, as a blocked or full storage does
      const CTL = () => { const real = Storage.prototype.setItem;
        Storage.prototype.setItem = function(k, v){ const m = this === window.localStorage ? sessionStorage.getItem('__plfail') : null;
          if(m === 'full') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
          if(m === 'deny') throw new DOMException('The operation is insecure.', 'SecurityError');
          return real.call(this, k, v); }; };
      const m = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1300}, acceptDownloads: true}, CTL);
      const P = m.page, pe = (f, a) => P.evaluate(f, a), wait = t => P.waitForTimeout(t);
      const ready = () => P.waitForFunction(() => typeof VIEW === 'string' && document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      const mem = () => pe(() => JSON.stringify(FX.api('plan-the-problem').suStats()));
      const raw = p => pe(p => { const d = JSON.parse(localStorage.getItem(NS + ':data:' + p) || '{}'); return JSON.stringify(d.setup || {}); }, p);
      const sum = j => Object.values(JSON.parse(j)).reduce((n, r) => n + r.seen, 0);
      const warn = () => pe(() => !!document.getElementById('savewarn') && document.getElementById('savewarn').getClientRects().length > 0);
      // n rounds through every stem by the page's own buttons: the right line on every other stem, a wrong one between
      const rounds = n => pe(n => { const A = FX.api('plan-the-problem'); let picks = 0;
        for(let r = 0; r < n; r++){ A.suStart('all');
          for(let k = 0; k < 500; k++){ const SU = A.state(), q = SU.queue[SU.i]; if(!q) break;
            const st = SU.page[q.id], right = (SU.i + r) % 2 === 0, i = st.options.findIndex(o => right ? o.id === q.setup.eq : o.id !== q.setup.eq);
            document.querySelector(`#v-eq [data-suopt="${i}"]`).click(); picks++; document.querySelector('#v-eq [data-sunext]').click(); } }
        A.suStop(); return picks; }, n);
      const one = () => pe(() => { const A = FX.api('plan-the-problem'); A.suStart('all'); const SU = A.state(), q = SU.queue[0];
        document.querySelector('#v-eq [data-suopt="0"]').click(); const id = q.setup.eq; A.suStop(); return id; });
      await P.click('#nav button[data-v="eq"]'); await wait(60);
      const picks = await rounds(8);
      const t0 = await mem();
      await wait(400); await P.reload(); await ready();
      const t1 = await mem();
      const lines = Object.keys(JSON.parse(t1)).length;
      check(picks >= 80 && sum(t0) === picks && t1 === t0, `a tally of ${picks} picks over ${lines} lines is kept whole through a reload`, {picks, before: sum(t0), after: sum(t1)});
      await P.click('#nav button[data-v="eq"]'); await wait(60);
      check(await pe(() => { FX.api('plan-the-problem').suStart('all'); const S = FX.api('plan-the-problem').state(); S.i = S.queue.length; FX.api('plan-the-problem').render();
        const n = document.querySelectorAll('#v-eq .suend .tlist li').length; FX.api('plan-the-problem').suStop(); return n === 6; }),
        'with that tally the closing card lists the six lines missed most often');

      // a reload soon after a change: the core writes the progress 150 ms after the last change
      const before = sum(await mem());
      await one(); await P.reload(); await ready();
      const fast = sum(await mem());
      console.log(`  note  a reload at once (under 150 ms) after a pick: the pick was ${fast === before + 1 ? 'kept' : 'lost'} (the core saves 150 ms after the last change; agent-run report, not a check)`);
      await one(); await wait(300); await P.reload(); await ready();
      check(sum(await mem()) === fast + 1, 'a pick is kept through a reload made 300 ms after it');

      // Export, then Import into a fresh profile
      const me = await pe(() => PROFILE), mine = await mem();
      await P.click('#nav button[data-v="settings"]'); await wait(60);
      const [dl] = await Promise.all([P.waitForEvent('download', {timeout: 10000}), P.click('#btnExport')]);
      const file = await dl.path();
      const ex = JSON.parse(fs.readFileSync(file, 'utf8'));
      await pe(() => { window.__name = 'SecondProfile'; });
      await P.click('#btnWho'); await wait(100);
      const fresh = await pe(() => ({p: PROFILE, n: Object.keys(FX.api('plan-the-problem').suStats()).length}));
      await P.click('#nav button[data-v="settings"]'); await wait(60);
      // Import as a student does it since kit #32: choose the file, read the plan, press its
      // Import button, wait for the outcome (core/import_test.js lines 1332-1336)
      const importFile = async f => {
        await P.setInputFiles('#fileIn', f);
        await P.waitForFunction(() => { const b = document.getElementById('importPlan'); return b && b.textContent.trim(); }, null, {timeout: 5000}).catch(() => {});
        const plan = await pe(() => { const g = document.getElementById('importGo'), w = document.getElementById('importWhat');
          return {go: g ? g.textContent.trim() : null, what: w ? w.textContent.replace(/\s+/g, ' ').trim() : ''}; });
        await pe(() => { const g = document.getElementById('importGo'); if(g) g.click(); });
        await P.waitForSelector('#importResult', {timeout: 3000}).catch(() => {});
        plan.result = await pe(() => { const r = document.getElementById('importResult'); return r ? r.textContent.replace(/\s+/g, ' ').trim() : null; });
        return plan;
      };
      // SecondProfile holds no progress, so under #32 the file replaces it: the plan offers
      // "Import" (not "Import into a new profile"), says this profile has no progress yet,
      // and after the outcome the student is still in SecondProfile with the tally back
      const plan = await importFile(file);
      const imp = await pe(() => ({p: PROFILE, t: JSON.stringify(FX.api('plan-the-problem').suStats())}));
      check(JSON.stringify(ex.db.setup) === mine && fresh.p === 'SecondProfile' && fresh.n === 0 &&
        plan.go === 'Import' && /has no progress yet/.test(plan.what) && !!plan.result && imp.p === 'SecondProfile' && imp.t === mine,
        `Export carries the tally (${sum(mine)} picks); Import into a fresh profile brings it back whole`,
        {exported: sum(JSON.stringify(ex.db.setup || {})), fresh, plan, p: imp.p, imported: sum(imp.t)});
      // each profile keeps its own
      await P.click('#nav button[data-v="eq"]'); await wait(60);
      const more = await rounds(1); await wait(400);
      await pe(n => { window.__name = n; }, me);
      await P.click('#btnWho'); await wait(100);
      const back = await pe(() => ({p: PROFILE, t: JSON.stringify(FX.api('plan-the-problem').suStats())}));
      const other = await raw('SecondProfile');
      check(back.p === me && back.t === mine && sum(other) === sum(mine) + more, 'a profile switch: each profile keeps its own tally', {me: sum(back.t), other: sum(other), more});

      // storage denied: the failure shows; what was saved is not overwritten; once storage works the picks are saved
      const saved = await raw(me);
      await pe(() => sessionStorage.setItem('__plfail', 'deny'));
      await P.click('#nav button[data-v="eq"]'); await wait(60);
      const nd = await rounds(1); await wait(400);
      const d1 = {warn: await warn(), mem: sum(await mem()), raw: await raw(me)};
      check(d1.warn && d1.raw === saved && d1.mem === sum(saved) + nd, 'storage denied: the student is told, the saved tally is not overwritten, the new picks hold for the visit',
        {warn: d1.warn, saved: sum(saved), stored: sum(d1.raw), mem: d1.mem});
      await pe(() => sessionStorage.removeItem('__plfail'));
      await one(); await wait(400); await P.reload(); await ready();
      check(sum(await mem()) === sum(saved) + nd + 1, 'once storage works again the next save writes the picks made while it was denied, and a reload loads all of them', sum(await mem()));

      // storage full: the same, and a reload after storage works again loads the tally saved before
      const full0 = await raw(me);
      await pe(() => sessionStorage.setItem('__plfail', 'full'));
      await P.click('#nav button[data-v="eq"]'); await wait(60);
      const nf = await rounds(1); await wait(400);
      const f1 = {warn: await warn(), mem: sum(await mem()), raw: await raw(me)};
      await pe(() => sessionStorage.removeItem('__plfail'));
      await P.reload(); await ready();
      const f2 = await mem();
      check(f1.warn && f1.raw === full0 && f1.mem === sum(full0) + nf && f2 === full0,
        'storage full (QuotaExceededError): the student is told, nothing saved is overwritten, and the saved tally loads after storage works again',
        {warn: f1.warn, saved: sum(full0), stored: sum(f1.raw), mem: f1.mem, after: sum(f2)});
      console.log(`  note  the ${nf} picks made while storage was full were ${sum(f2) === sum(full0) + nf ? 'kept' : 'lost'} on the reload (the core keeps them only for the visit, as its notice says; agent-run report)`);

      // a saved tally of another shape: the tally starts afresh and the next picks are saved
      await pe(() => { DB.setup = ['not', 'a', 'tally']; save(); });
      await wait(400);
      const shapeId = await one(); await wait(400); await P.reload(); await ready();
      const sh = JSON.parse(await mem());
      check(Object.keys(sh).length === 1 && sh[shapeId] && sh[shapeId].seen === 1, 'a saved tally of another shape starts afresh, and the next pick is saved', sh);
      check(!m.errors.length, 'no page error in the persistence runs', m.errors.slice(0, 3).join(' | '));
      await m.ctx.close();
    }
  } finally {
    await browser.close();
    s.rm(); s2.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
