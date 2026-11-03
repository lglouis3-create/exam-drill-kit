/* notes: the module's own test. run_checks.sh runs it when the course switches the
 * module on (build.py --list-checks).
 *
 * In node, on the course's own page: with a note on every question of the bank, the
 * copied text has one section per question, a key for every multiple-choice,
 * numeric and matching question, and no "undefined" or "[object Object]"; the
 * converter keeps each saved note {t, at} and drops anything else.
 * In Chromium, on a scratch copy with Basic-Pharmacokinetics' course data (FIX below:
 * two topics, their two lectures and two skills, and 16 of their questions, from src/
 * at ac2eb73, every id prefixed nts- by PFX; the course's own copy when ../ci/oncourse.js
 * wrote it; a plan-the-problem `setup` or `asks` the course has no data for left out) and 3 copies of the
 * 16 under other ids for a large saved state, the exam paper drawn from those two
 * topics, at 390 px and 1200 px (Basic-Pharmacokinetics src/notes_test.py ported; its
 * paper flags are study-controls' and are checked only through the Notes tab):
 * a note on a drill question is saved as it is typed, the button then reads My note,
 * and the note is there after a reload; a note on a running paper leaves the key out
 * of the text and out of the Notes tab; after a reload the paper and the note are
 * both there; after Submit every result card carries the button and the text carries
 * both keys, with the course's {{frac:a|b}} written (a)/(b); Weak spots counts the
 * notes and opens the tab; the Notes tab lists them newest first, Copy for AI copies
 * the text, Download saves it as <course id>-my-questions.md, a note edits in place,
 * an emptied note is removed, Delete note removes it, Drill these drills the noted
 * questions; Settings says what is kept; no page error.
 * Persistence (390 px): 64 notes of 2,000 characters and 300 answers come back
 * after a reload; the topic filter and Drill these follow the topic; Export progress
 * carries every note, and Import into a new profile brings back the same notes; each
 * profile keeps its own; a reload 400 ms after typing keeps the change, a reload
 * under 150 ms is reported (the core writes 150 ms after the last change); with
 * storage denied and with storage full the notice shows, the stored progress is left
 * as it was, and once storage works the next change is saved with every earlier
 * note and loads after a reload; Erase my history removes the notes.
 * When study-controls is on: a flagged question's card on the Notes tab says
 * "⚑ flagged" and the mark goes when the flag does; typing every key study-controls
 * reads (A-J, 1-9, Enter, the arrows) in a note never fires one of its shortcuts, on the
 * quiz before the answer and after a right answer, and on the paper, while the same
 * keys outside the note do act; the one-page cards carry the button. When it
 * is off: no flag mark even with a stray DB.flags.
 *
 *     node features/notes/test.js        (NOTES_SHOTS=<folder> saves screenshots)
 */
const fs = require('fs'), os = require('os'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/notes/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;
const SHOTS = process.env.NOTES_SHOTS || '';

/* The course data of this test and of ../ci/oncourse.js, from Basic-Pharmacokinetics src/ at ac2eb73:
   course.js `lectures` L11 and L12 and `skills` pkpd and nonlin; the topics pkpd (q15_module7b.js)
   and nonlin (q16_module8.js), each with the subtopics the questions below are in; and 16 questions
   as the course's engine reads them (each file evaluated, so a section a file writes once and shares,
   such as q16_module8.js's NL_RATE, is in each question that uses it):
     q13_quizzes.js   cq5-1 and cq5-6 (Canvas Quiz 5, questions 1 and 6)
     q15_module7b.js  pd-c20, pd-c01, pd-c02 (select-all), pd-c04, pd-c06, pd-c22, pd-ex-b (numeric)
     q16_module8.js   nl-c04 (select-all), nl-c02, nl-c03, nl-c05, nl-c06, nl-ex1 and nl-ex2a (numeric)
   Every dupOf names a question of the 16. The one change: `prof` is the template's "Professor" (the
   source names the professor). Left out of the source's two topics: questions whose text names the
   professor by a pronoun; nl-c10, whose text has "given as", which style_check.js flags; the
   two-option questions pd-c13, nl-c01 and nl-c18, which the kit's core test.js refuses ("only 2
   options"), and the questions whose dupOf leads to one of them (cq5-2, pd-c14, cq5-5, nl-c08,
   nl-c09), since core test.js needs every dupOf target in the bank. PFX and WRITE below say how
   FIX is written into a course. */
const FIX = {
  lectures: [
    {"id":"L11","deck":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf","label":"Module 7b: PK-PD relationship (12 Oct)","prof":"Professor","exam":3,"module":9},
    {"id":"L12","deck":"8 - Nonlinear PK.pdf","label":"Module 8: Nonlinear pharmacokinetics (14 Oct)","prof":"Professor","exam":3,"module":8}],
  skills: [
    {"id":"pkpd","label":"PK-PD — effect, Emax, EC50 and exposure targets","short":"PK-PD","kind":"calc"},
    {"id":"nonlin","label":"Nonlinear — Vmax, KM, dose rate and steady state","short":"Nonlinear","kind":"calc"}],
  topics: [
    {"id":"pkpd","name":"PK-PD relationship","prof":"Professor","cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 2 \"Objectives\"","subs":[{"id":"pd","name":"Pharmacodynamics and the exposure–response relationship","cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 3 \"Pharmacodynamics\""},{"id":"doseresp","name":"Response rising with dose and concentration up to a maximum","cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slides 4 \"Relationship of Dose to Pharmacologic Effect\", 5 \"Typical Log Dose-versus-Pharmacologic Response Curves\" and 11 \"Summary\""},{"id":"teff","name":"Dose and the duration of activity, teff","cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slides 6 to 9 and 12"},{"id":"dosefor","name":"The dose for a target duration of activity","cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 8 and the In-Class Activity on slide 13"},{"id":"thalf","name":"Elimination half-life and the duration of activity","cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slides 9 \"Effect of Dose and Elimination Half-life on Duration of Activity\" and 10 \"Effect of Elimination Half-life on Duration of Activity\""}]},
    {"id":"nonlin","name":"Nonlinear pharmacokinetics","prof":"Professor","cite":"8 - Nonlinear PK.pdf, slide 2 \"Objectives\"","subs":[{"id":"linear","name":"Linear and nonlinear pharmacokinetics; saturation kinetics","cite":"8 - Nonlinear PK.pdf, slides 3 \"Linear vs. Nonlinear Pharmacokinetics\" to 6 \"Saturation Kinetics\", and 19 \"Summary\""},{"id":"kmcp","name":"KM and Cp: the order of saturable elimination, half-life and clearance","cite":"8 - Nonlinear PK.pdf, slides 7 \"Parameters\", 8 \"Saturable-Enzymatic Elimination Processes\", 9, 17 and 18"},{"id":"kmvmax","name":"Vmax and KM from two dose rates in a patient","cite":"8 - Nonlinear PK.pdf, slides 13 \"Determination of KM and Vmax by Direct Method\", 14 \"Example\" and 15"},{"id":"dose","name":"Dose rate and steady state for a nonlinear drug such as phenytoin","cite":"8 - Nonlinear PK.pdf, slides 11 \"In Vivo Determination of KM and Vmax\" and 12 \"Example\""}]}],
  qs: [
    {"id":"cq5-1","prof":"Professor","tier":"new","exam":3,"module":9,"lecture":"L11","topic":"pkpd","sub":"thalf","concept":"thalf-double-teff","skill":"apply","dupOf":"pd-c20","source":"slide","stem":"For a drug that displays linear, first-order pharmacokinetics, what is the impact on duration of activity if there is an increase in elimination half-life?","options":[{"t":"There is a no change to the duration of activity.","correct":false,"why":"Picking this treats the duration as set by the dose alone. In teff = 1.44 t½ ln({{frac:D0|VD × Ceff}}) the half-life multiplies the whole expression, so a longer t½ with the same dose and volume keeps the level above the minimum effective concentration (MEC) for longer."},{"t":"Duration of activity will increase.","correct":true,"why":"A longer half-life means slower elimination, so the level takes longer to fall from C0 to the MEC. teff is in direct proportion to t½: twice the half-life, twice the duration, as when decreased renal or hepatic function prolongs t½."},{"t":"Duration of activity will decrease.","correct":false,"why":"Picking this reverses the direction. A longer t½ means a smaller elimination rate constant k, so the level falls more slowly and stays at or above the MEC for longer, not shorter."}],"teach":[{"h":"The idea","list":["teff = 1.44 t½ ln({{frac:D0|VD × Ceff}}): t½ multiplies everything, so teff changes in direct proportion to the half-life.","The dose sits inside the logarithm: doubling the dose adds one half-life to teff; it does not double it.","Decreased renal or hepatic elimination prolongs t½, prolongs the effect, and raises the possibility of toxicity."]}],"cite":"Canvas Quiz 5 (Modules 7b and 8), question 1; 7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slides 9 \"Effect of Dose and Elimination Half-life on Duration of Activity\" and 10 \"Effect of Elimination Half-life on Duration of Activity\""},
    {"id":"pd-c20","prof":"Professor","tier":"new","exam":3,"module":9,"lecture":"L11","topic":"pkpd","sub":"thalf","concept":"thalf-double-teff","skill":"apply","source":"slide","stem":"What is the expected change in the duration of activity of a single IV bolus dose if decreased elimination doubles the elimination half-life, with the dose and the volume of distribution unchanged?","options":[{"t":"teff doubles","correct":true,"why":"In teff = 1.44 t½ ln({{frac:D0|VD × Ceff}}), t½ multiplies the whole expression and nothing else changes, so teff is directly proportional to t½: twice the half-life, twice the duration."},{"t":"teff increases by one half-life","why":"Choosing this carries the dose rule over to the half-life. Doubling the dose adds one t½ because the dose is inside the logarithm; t½ multiplies the whole expression, so doubling it doubles teff."},{"t":"teff is halved","why":"Choosing this reverses the direction. A longer half-life means slower elimination, so the level takes longer to fall to Ceff and the drug acts longer, not shorter."},{"t":"teff does not change, because the dose is the same","why":"Choosing this ties duration to the dose alone. Onset, intensity and duration depend on the dose and on the pharmacokinetics; from the same C0, a slower decline keeps the level above Ceff longer."}],"teach":[{"h":"Elimination half-life and duration","list":["Alteration of the elimination processes, excretion and metabolism, changes the t½ of the drug.","In certain disease states, pathophysiologic changes in hepatic or renal function decrease elimination, seen as a prolonged t½.","The prolonged t½ retains drug in the body, increasing the duration of activity and the possibility of toxicity.","teff = 1.44 t½ ln({{frac:D0|VD × Ceff}}): teff is directly proportional to t½, but not to the dose."]}],"cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 9 \"Effect of Dose and Elimination Half-life on Duration of Activity\""},
    {"id":"pd-c01","prof":"Professor","tier":"new","exam":3,"module":9,"lecture":"L11","topic":"pkpd","sub":"pd","concept":"pd-definition","skill":"recall","source":"slide","stem":"Which term describes the relationship between drug concentration at the site of action (receptor) and the observed pharmacologic response?","options":[{"t":"Pharmacodynamics","correct":true,"why":"Pharmacodynamics starts where pharmacokinetics stops: it takes the concentration at the receptor and links it to the response that concentration produces, which is what the drug does to the body once it arrives."},{"t":"Pharmacokinetics","why":"Choosing this takes the half of the relationship that comes first. Pharmacokinetics describes how the dose becomes a concentration over time; the response that concentration produces at the receptor is pharmacodynamics."},{"t":"Bioavailability","why":"Choosing this takes the arrival of the drug for its effect. Bioavailability is the rate and extent to which the active ingredient is absorbed and becomes available at the site of action; it ends where the receptor response begins."},{"t":"Duration of activity","why":"Choosing this takes one measure of the response for the whole relationship. Duration of activity, teff, is the time the plasma level stays at or above the minimum effective concentration; pharmacodynamics is the concentration–response link itself."}],"teach":[{"h":"Pharmacodynamics and exposure–response","list":["Pharmacodynamics (PD): the relationship between drug concentration at the site of action, the receptor, and the observed pharmacologic response.","Pharmacokinetics (PK) turns the dose into a concentration over time; PD turns that concentration into a response.","The PK–PD relationship is also called the exposure–response, concentration–response or concentration–effect relationship.","Exposure–response information is used to determine safety and efficacy in drug approval, to understand benefit–risk, and to derive dosing information."]}],"cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 3 \"Pharmacodynamics\""},
    {"id":"pd-c02","prof":"Professor","tier":"new","exam":3,"module":9,"lecture":"L11","multi":true,"topic":"pkpd","sub":"pd","concept":"exposure-response-names","skill":"recall","source":"slide","stem":"The relationship between pharmacokinetics (PK) and pharmacodynamics (PD) is also referred to as which of the following? (Select all that apply)","options":[{"t":"exposure–response relationship","correct":true,"why":"Exposure is the pharmacokinetic side and response the pharmacologic observation. Joining them is the PK–PD relationship under its most common name."},{"t":"concentration–response relationship","correct":true,"why":"This names the same link with the plasma concentration as the measure of exposure: as the concentration at the receptor rises, the response rises toward its maximum."},{"t":"concentration–effect relationship","correct":true,"why":"Effect is the change in response that the concentration produces, so this third name again joins a PK quantity, the concentration, to a PD one, the effect."},{"t":"concentration–time relationship","why":"Choosing this takes the pharmacokinetic curve alone for the PK–PD link. Concentration against time, C = C0e^(−kt) after an IV bolus, has no response in it; PK–PD joins that concentration to an effect."},{"t":"rate–extent relationship","why":"Choosing this carries over the two parts of bioavailability, rate (read from tmax) and extent (read from AUC). Both describe how drug reaches the circulation, not the response it then produces."}],"teach":[{"h":"Pharmacodynamics and exposure–response","list":["Pharmacodynamics (PD): the relationship between drug concentration at the site of action, the receptor, and the observed pharmacologic response.","Pharmacokinetics (PK) turns the dose into a concentration over time; PD turns that concentration into a response.","The PK–PD relationship is also called the exposure–response, concentration–response or concentration–effect relationship.","Exposure–response information is used to determine safety and efficacy in drug approval, to understand benefit–risk, and to derive dosing information."]}],"cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 3 \"Pharmacodynamics\""},
    {"id":"pd-c04","prof":"Professor","tier":"new","exam":3,"module":9,"lecture":"L11","topic":"pkpd","sub":"doseresp","concept":"response-up-to-max","skill":"recall","source":"slide","stem":"Which of the following is true regarding the relationship of dose to pharmacologic effect?","options":[{"t":"Response rises with dose up to a maximum effect","correct":true,"why":"More dose puts more drug at the receptor, so more receptors are occupied and the response grows; once all are occupied the response cannot rise further, which sets the maximum effect."},{"t":"The response increases in direct proportion to the dose at every dose.","why":"Choosing this extends the steep low-dose part of the curve to every dose. Near the top a further dose change gives only a small increase, and the response levels off at its maximum."},{"t":"The onset, intensity, and duration of the effect depend on the dose alone, not on the pharmacokinetics.","why":"Choosing this drops half of the statement: onset, intensity and duration depend on the dose and the pharmacokinetics. The same dose acts longer when elimination is slower, because the level stays above the MEC longer."},{"t":"The response falls once the dose passes the dose that gives the maximum response.","why":"Choosing this reads the plateau as a peak. The curve rises to the maximum response and stays there; added dose finds no free receptors, so it adds no response, but it does not take response away."}],"teach":[{"h":"Dose, concentration and response","list":["As the dose increases, the concentration at the receptor site increases, and the response increases up to a maximum effect.","Response against dose on a linear scale rises steeply, then flattens: the same dose change gives a large increase at low doses and a small one near the maximum.","Response against log dose is a sigmoid (S-shaped) curve; the maximum is reached when all receptors become saturated.","Its middle portion is close to a straight line: effect against log concentration, with slope m.","Onset, intensity and duration of the effect depend on the dose and on the pharmacokinetics of the drug."]}],"cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 4 \"Relationship of Dose to Pharmacologic Effect\""},
    {"id":"pd-c06","prof":"Professor","tier":"new","exam":3,"module":9,"lecture":"L11","topic":"pkpd","sub":"teff","concept":"duration-term","skill":"recall","source":"slide","stem":"Which term describes the time that the plasma drug level stays at or above the minimum effective concentration (MEC) after a single dose?","options":[{"t":"Duration of action","correct":true,"why":"Duration is read along the time axis between the two crossings of the MEC: from the onset, where the rising level first reaches the MEC, to the time it falls back below it. This is teff, the duration of activity."},{"t":"Onset time","why":"Choosing this takes the start of the effect for its length. Onset time is the single moment the rising curve first reaches the MEC; duration is the whole span from there until the level falls back below the MEC."},{"t":"Intensity","why":"Choosing this reads the vertical measure for the horizontal one. Intensity is how far the peak rises above the MEC, a concentration difference; duration is a time, read along the time axis."},{"t":"Elimination half-life","why":"Choosing this takes a pharmacokinetic constant for a pharmacodynamic span. The half-life is the time for the level to fall by one-half; duration also depends on the MEC and the dose: teff = 1.44 t½ ln({{frac:D0|VD × Ceff}})."}],"teach":[{"h":"Reading the plasma level–time curve","list":["MEC (minimum effective concentration, Ceff): the lowest plasma level that gives the effect. MTC (minimum toxic concentration): the level above which toxicity appears.","Onset time: when the rising level first reaches the MEC.","Duration (teff): the time the level stays at or above the MEC.","Intensity: how far the peak rises above the MEC."]}],"cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 4 \"Relationship of Dose to Pharmacologic Effect\" (right figure)"},
    {"id":"pd-c22","prof":"Professor","tier":"new","exam":3,"module":9,"lecture":"L11","topic":"pkpd","sub":"dosefor","concept":"dose-to-double-teff","skill":"apply","source":"slide","stem":"Which of the following is true regarding the IV bolus dose needed to double the duration of activity (teff) of a drug?","options":[{"t":"The dose doubles per added half-life of teff","correct":true,"why":"D0 = Ceff × VD × e^(k teff), so each added half-life of duration doubles the dose. For an antibiotic with VD 24 L, k 0.15 hr⁻¹ and Ceff 0.2 mcg/mL, 250 mg gives 26.35 hr, about 5.7 half-lives of 4.62 hr; doubling it to 52.7 hr needs about 52 times the dose, 13 g."},{"t":"Twice the dose doubles teff","why":"Choosing this treats teff as proportional to dose. Twice the dose adds only one half-life to teff: for that antibiotic, 4.62 hr on top of a 26.35-hr duration."},{"t":"It is found from D0 = {{frac:Ceff × VD|e^(k teff)}}","why":"Choosing this inverts the exponential. From Ceff = {{frac:D0|VD}}e^(−k teff), multiplying both sides by VD e^(k teff) gives D0 = Ceff × VD × e^(k teff); dividing would make a longer teff need a smaller dose."},{"t":"The dose needed does not depend on the half-life","why":"Choosing this leaves k out of the dose line. In D0 = Ceff × VD × e^(k teff), a small k (a long half-life) keeps the exponent small, so a drug with a long half-life needs a far smaller dose for the same teff."}],"teach":[{"h":"The dose for a target duration","list":["Ceff = {{frac:D0|VD}} e^(−k teff), rearranged: D0 = Ceff × VD × e^(k teff).","The target time is in the exponent, so each extra half-life of duration doubles the dose.","Check: put the dose back into teff = {{frac:ln C0 − ln Ceff|k}} and the target time returns."]}],"cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 8 (dose to double teff)"},
    {"id":"pd-ex-b","type":"numeric","prof":"Professor","tier":"new","exam":3,"module":9,"lecture":"L11","topic":"pkpd","sub":"teff","concept":"teff-dose-change","skill":"pkpd","source":"slide","stem":"The minimum effective concentration (MEC or Ceff) in plasma for a certain antibiotic is 0.2 mcg/mL. The drug follows a one-compartment open model and has an apparent volume of distribution of 24 L and a first-order elimination rate constant of 0.15 h–1. What is the new teff or for this drug if the dose were increased by a factor of four to 1000 mg?","units":"hr","answer":35.6,"tol":0.36,"steps":[{"k":"setup","t":"C0 = {{frac:1000 mg|24 L}} = 41.67 mg/L; Ceff = 0.2 mcg/mL = 0.2 mg/L","why":"Four times the dose gives four times C0, because VD does not change with the dose. 1 mcg/mL equals 1 mg/L, so Ceff goes in as 0.2 mg/L."},{"k":"algebra","t":"teff = {{frac:ln(41.67 ÷ 0.2)|0.15 hr⁻¹}} = {{frac:ln 208.33|0.15}} = {{frac:5.3391|0.15 hr⁻¹}} = 35.594 hr","why":"The same natural-log duration line with the new C0. The ratio C0 ÷ Ceff is four times larger, so its logarithm is larger by ln 4 = 1.386, not four times larger."},{"k":"round","t":"35.594 − 26.352 = 9.242 hr = 2 × 4.621 hr; teff = 35.6 hr","why":"A factor of four is two doublings, and each doubling of the dose adds one half-life, 4.621 hr, to the 26.352 hr of the 250-mg dose. 35.594 hr is 35.6 hr to one decimal place. Four times the dose gives far less than four times the duration."}],"setup":{"eq":"pd-teff-ln","pre":["cp-db-vd"],"why":"\"The new teff\" at 1000 mg, with k given: the natural-log duration line again with the new C0 = D0 over VD."},"asks":"t","givens":[["D0","1000 mg","four times 250 mg, so C0 is four times larger"],["Ceff","0.2 mcg/mL","equals 0.2 mg/L"],["VD","24 L","unchanged by the dose"],["k","0.15 h–1","unchanged by the dose"]],"check":{"t":"Four times the dose adds two half-lives, 2 × 4.621 hr, to the 26.352 hr of part a: 35.6 hr, far short of four times the duration.","lo":26.35,"hi":105.4},"teach":[{"h":"Duration of activity, teff","list":["teff: the time one IV bolus keeps the plasma level at or above Ceff, the minimum effective concentration.","From C = C0e^(−kt) with C = Ceff: teff = {{frac:ln C0 − ln Ceff|k}}, where C0 = {{frac:D0|VD}}, the level just after the bolus.","With k = {{frac:0.693|t½}}: teff = 1.44 t½ ln({{frac:D0|VD × Ceff}}); 1.44 is {{frac:1|0.693}}.","The dose is inside the logarithm, so doubling it adds {{frac:ln 2|k}}, one half-life, to teff; it does not double teff.","Built for a single IV bolus, a one-compartment open model and first-order elimination."]}],"cite":"7b---Pharmacokinetics-and-Pharmacodynamics.pdf, slide 7 \"Practice Problem\", worked on slide 8"},
    {"id":"cq5-6","prof":"Professor","tier":"new","exam":3,"module":8,"lecture":"L12","topic":"nonlin","sub":"linear","concept":"nl-saturation-features","skill":"recall","dupOf":"nl-c04","source":"slide","stem":"Which of the following is true regarding drugs that display nonlinear pharmacokinetics?","options":[{"t":"Parameters do not change when different or multiple doses of a drug are given","correct":false,"why":"Picking this takes the definition of linear pharmacokinetics for nonlinear. With a nonlinear drug an increased dose or chronic administration changes the parameters: clearance falls and the half-life lengthens as the concentration rises."},{"t":"Half-life changes as dose is increased","correct":true,"why":"With saturable elimination t½ = VD({{frac:0.693|Vmax}})(KM + Cp), so a larger dose, giving a higher Cp, gives a longer half-life. It is one of the characteristics of saturation kinetics."},{"t":"The principle of superposition applies at steady-state.","correct":false,"why":"Picking this carries a linear rule into saturation kinetics. Superposition adds the curves of separate doses, which needs each dose to lose the same fraction per hour; once elimination saturates, a later dose is cleared more slowly, so the curves do not simply add."},{"t":"The AUC is proportional to the amount of bioavailable drug.","correct":false,"why":"Picking this describes dose-independent kinetics. With saturable elimination the AUC (area under the curve) is disproportional to the amount of bioavailable drug: past a certain dose it rises more than in proportion."}],"teach":[{"h":"The idea","list":["Linear: parameters such as half-life and clearance do not change when different or multiple doses are given.","Saturation kinetics: half-life changes as dose is increased, and the AUC is disproportional to the amount of bioavailable drug.","t½ = VD({{frac:0.693|Vmax}})(KM + Cp) rises with Cp; Cl = {{frac:Vmax|KM + Cp}} falls with Cp."]}],"cite":"Canvas Quiz 5 (Modules 7b and 8), question 6; 8 - Nonlinear PK.pdf, slides 3 \"Linear vs. Nonlinear Pharmacokinetics\" and 6 \"Saturation Kinetics\""},
    {"id":"nl-c04","prof":"Professor","tier":"new","exam":3,"module":8,"lecture":"L12","topic":"nonlin","sub":"linear","concept":"nl-saturation-features","skill":"recall","source":"slide","multi":true,"stem":"Which of the following are characteristics of saturation kinetics? (Select all that apply)","options":[{"t":"Elimination half-life changes as dose is increased","correct":true,"why":"With saturable elimination t½ = VD(0.693/Vmax)(KM + Cp), so a higher dose, giving a higher Cp, gives a longer half-life. In linear kinetics the half-life does not change with dose."},{"t":"AUC is disproportional to the amount of bioavailable drug","correct":true,"why":"Once elimination saturates, a larger dose is cleared more slowly, so the AUC (area under the curve) rises more than in proportion to the dose, curve A against the straight curve C."},{"t":"Other drugs using the same enzyme or carrier can affect saturation","correct":true,"why":"Two drugs that need the same enzyme or carrier compete for its limited capacity, so one can push the other toward saturation: a drug–drug interaction through a shared system."},{"t":"Metabolite ratios may change with dose","correct":true,"why":"If one metabolic route saturates at a higher dose while others do not, the share of drug going down each route changes, and so does the mix of metabolites."},{"t":"Clearance stays constant as the dose is increased, whatever the concentration","why":"Choosing this carries the linear rule into saturation kinetics. ClT = Vmax/(KM + Cp) falls as Cp rises, so clearance is usually not constant within nonlinear processes."},{"t":"AUC increases in direct proportion to the dose at every dose given","why":"Choosing this describes curve C, dose-independent kinetics, rather than saturable kinetics. With saturation the AUC versus dose line bends upward once the dose passes a certain point."}],"teach":[{"h":"Saturation kinetics","list":["Elimination kinetics is nonlinear, and the elimination half-life changes as dose is increased.","AUC is disproportional to the amount of bioavailable drug.","Saturation of capacity-limited processes may be affected by other drugs requiring the same enzyme or carrier-mediated system.","The composition or ratio of the metabolites may be affected by a change in the dose."]}],"cite":"8 - Nonlinear PK.pdf, slide 6 \"Saturation Kinetics\""},
    {"id":"nl-c02","prof":"Professor","tier":"new","exam":3,"module":8,"lecture":"L12","topic":"nonlin","sub":"linear","concept":"nl-linear-vs-nonlinear","skill":"tell","source":"both","stem":"2. What is the difference between linear and non-linear pharmacokinetics?","options":[{"t":"Linear parameters stay fixed with dose; nonlinear ones change with dose","correct":true,"why":"In linear pharmacokinetics the parameters do not change when different or multiple doses are given, so half-life and clearance stay fixed. In nonlinear pharmacokinetics a larger dose or chronic administration changes them, and a small dose change can give a large concentration change."},{"t":"Linear pharmacokinetics is zero order and nonlinear pharmacokinetics is first order","why":"Choosing this reverses the labels. Linear pharmacokinetics is the first-order elimination of most drugs; a saturable, nonlinear drug looks first order at low concentrations and zero order at high ones."},{"t":"In nonlinear pharmacokinetics the AUC rises in direct proportion to the dose","why":"Choosing this attaches the linear property to the wrong model. Proportional AUC (area under the curve) is curve C, dose-independent kinetics; with saturable elimination the AUC deviates from proportionality once the dose passes a certain point."},{"t":"Nonlinear processes affect absorption only, never elimination","why":"Choosing this narrows saturation to one step. A saturable process can occur anywhere in absorption, distribution, metabolism and excretion, and phenytoin, the usual example, shows saturable elimination."}],"teach":[{"h":"Linear and nonlinear","list":["Linear: parameters such as half-life and clearance do not change when different or multiple doses of a drug are given. Most drugs follow this.","Nonlinear (saturable, dose-dependent, capacity-limited): increased doses or chronic administration cause deviations from the single-dose profile. Example: phenytoin.","Clearance and half-life are usually not constant within nonlinear processes."]}],"cite":"Nonlinear-Solutions-2.pdf, question 2; 8 - Nonlinear PK.pdf, slides 3 \"Linear vs. Nonlinear Pharmacokinetics\" and 19 \"Summary\"; transcript 10-14"},
    {"id":"nl-c03","prof":"Professor","tier":"new","exam":3,"module":8,"lecture":"L12","topic":"nonlin","sub":"kmcp","concept":"nl-thalf-cl-trend","skill":"apply","source":"both","stem":"3. What changes in t½ and ClT are usually observed with increased concentrations of drugs that exhibit nonlinear pharmacokinetics?","options":[{"t":"t½ increases and ClT decreases","correct":true,"why":"t½ = VD(0.693/Vmax)(KM + Cp) grows as Cp grows, and ClT = Vmax/(KM + Cp) shrinks as Cp grows. In one phenytoin patient, going from 15 to 21 mg/L took the half-life from 1.87 to 2.34 days and clearance from 20.8 to 16.7 L/day."},{"t":"t½ decreases and ClT increases","why":"Choosing this runs both lines the opposite direction. Cp is added to KM in the numerator of the half-life line and in the denominator of the clearance line, so a higher concentration lengthens the half-life and lowers the clearance."},{"t":"Neither changes, because Vmax and KM are constants","why":"Choosing this treats the half-life and clearance as constants because Vmax and KM are. Both lines also contain Cp, which changes with dose, so neither stays fixed; that is what makes the drug nonlinear."},{"t":"t½ increases and ClT increases","why":"Choosing this gets the half-life right but moves clearance with it. Cp is in the denominator of ClT = Vmax/(KM + Cp), so clearance falls; a longer half-life with an unchanged volume also requires a lower clearance."}],"teach":[{"h":"Half-life and clearance depend on concentration","list":["t½ = VD({{frac:0.693|Vmax}})(KM + Cp): the half-life rises as Cp rises.","ClT = {{frac:Vmax|KM + Cp}}: clearance falls as Cp rises, because Cp is in the denominator.","VD in L/kg is multiplied by the weight first. With Vmax in mg/day, t½ comes out in days and ClT in L/day."]}],"cite":"Nonlinear-Solutions-2.pdf, question 3; 8 - Nonlinear PK.pdf, slides 17 and 18"},
    {"id":"nl-c05","prof":"Professor","tier":"new","exam":3,"module":8,"lecture":"L12","topic":"nonlin","sub":"linear","concept":"nl-phenytoin","skill":"recall","source":"both","stem":"Which of the following drugs is the prototypical example of nonlinear pharmacokinetics?","options":[{"t":"Phenytoin","correct":true,"why":"Phenytoin shows saturable elimination: once its level passes a certain point, small changes in dose lead to big changes in concentration. It also has a narrow therapeutic window, so its dose is set from the patient's own KM and Vmax."},{"t":"Procainamide","why":"Choosing this picks a drug worked with first-order lines. Procainamide is given a fixed half-life and volume of distribution, which is linear pharmacokinetics; phenytoin is the example of saturable elimination."},{"t":"Ciprofloxacin","why":"Choosing this picks a drug worked with linear lines. Ciprofloxacin is given an equivalent oral dose from F, the bioavailable fraction, a linear calculation; it is not the example of saturable elimination."},{"t":"Cefprozil","why":"Choosing this picks a drug dosed from creatinine clearance. Cefprozil is dosed with first-order lines, its renal elimination treated as linear, not saturable."}],"teach":[{"h":"Phenytoin","list":["The usual example of nonlinear pharmacokinetics: small changes in dose lead to big changes in concentration once a certain level is reached.","It has a narrow therapeutic window, so the dose rate is set from the patient's KM and Vmax, found from two dose rates and their steady-state levels."]}],"cite":"8 - Nonlinear PK.pdf, slide 3 \"Linear vs. Nonlinear Pharmacokinetics\" (\"Ex. phenytoin\"); transcript 10-14"},
    {"id":"nl-c06","prof":"Professor","tier":"new","exam":3,"module":8,"lecture":"L12","topic":"nonlin","sub":"kmcp","concept":"nl-vmax-def","skill":"recall","source":"slide","stem":"Which term describes the maximum elimination rate of a saturable elimination process?","options":[{"t":"Vmax","correct":true,"why":"Vmax is the maximum elimination rate: with nothing else going on, the fastest the enzyme system can remove the drug. It is a rate, an amount or concentration per unit time, such as mg/day."},{"t":"KM","why":"Choosing this swaps the two Michaelis-Menten parameters. KM, the Michaelis constant, reflects the capacity of the enzyme system and is a concentration, mg/L; it is not a rate."},{"t":"k′","why":"Choosing this takes the low-concentration constant for the maximum. k′ = {{frac:Vmax|KM}} is the first-order constant that applies only when Cp is much less than KM; it is not the top rate."},{"t":"R","why":"Choosing this mixes the dose rate with the elimination ceiling. R is the amount given per unit time; at steady state it equals the elimination rate at Css, which is always below Vmax."}],"teach":[{"h":"The two parameters","list":["Vmax: maximum elimination rate, units of concentration (or amount) per time.","KM: Michaelis constant, reflecting the capacity of the enzyme system, units of concentration.","For a given drug in a given patient both are constants; they differ from one patient to another."]}],"cite":"8 - Nonlinear PK.pdf, slides 7 \"Parameters\" and 8"},
    {"id":"nl-ex1","type":"numeric","prof":"Professor","tier":"new","exam":3,"module":8,"lecture":"L12","topic":"nonlin","sub":"dose","concept":"nl-dose-rate","skill":"nonlin","source":"both","stem":"Given that KM = 5 mg/L and Vmax = 8 mg/kg/day, calculate the required daily dose rate to achieve an average plasma concentration of 24 mg/L in a 65 kg patient.","units":"mg/day","answer":430,"tol":4.3,"steps":[{"k":"setup","t":"R = {{frac:Vmax × Css|KM + Css}}","why":"At steady state the dose rate equals the rate of saturable elimination, and this line needs only Vmax, KM and the target concentration. The 24 mg/L average plasma concentration is the Css."},{"k":"algebra","t":"R = {{frac:(8 mg/kg/day)(24 mg/L)|(5 + 24) mg/L}} = {{frac:192|29}} = 6.62 mg/kg/day","why":"The mg/L units cancel top and bottom, so R keeps the units of Vmax. Vmax is per kilogram, so this dose rate is per kilogram too and is not yet a dose for this patient."},{"k":"unit","t":"R = 6.62 mg/kg/day × 65 kg = 430.3 mg/day","why":"Multiplying by the 65 kg weight cancels the kilograms and leaves an amount per day: a dose with its interval, which is what a patient can be told to take."},{"k":"round","t":"R = 430 mg/day","why":"430.3 mg/day to the nearest milligram per day. Given every day, this rate is expected to bring the patient to an average steady-state concentration of 24 mg/L."}],"setup":{"eq":"nl-rate","pre":[],"why":"\"KM\", \"Vmax\" and \"daily dose rate to achieve an average plasma concentration of 24 mg/L\": the nonlinear dose-rate line, then the per-kilogram rate times 65 kg."},"asks":"R","givens":[["KM","5 mg/L","added to Css in the denominator"],["Vmax","8 mg/kg/day","the numerator; makes R per kilogram"],["Css","24 mg/L","the target average concentration"],["weight","65 kg","turns mg/kg/day into mg/day"]],"check":{"t":"R is below Vmax because Css is below KM + Css: 6.62 mg/kg/day against 8 mg/kg/day, and 6.62 × 65 is about 430 mg/day.","lo":0,"hi":520},"teach":[{"h":"The nonlinear dose-rate line","list":["R = {{frac:Vmax × Css|KM + Css}}. R is the dose rate, an amount per unit time; Vmax (maximum elimination rate) has the units of R; KM (Michaelis constant) and Css are concentrations.","A Vmax in mg/kg/day gives R in mg/kg/day, which is multiplied by the weight for mg/day.","Report a dose rate, such as mg/day, not an amount alone."]}],"cite":"8 - Nonlinear PK.pdf, slide 12 \"Example\"; transcript 10-14"},
    {"id":"nl-ex2a","type":"numeric","prof":"Professor","tier":"new","exam":3,"module":8,"lecture":"L12","topic":"nonlin","sub":"kmvmax","concept":"nl-km-direct","skill":"nonlin","source":"both","stem":"After receiving a drug that displays nonlinear kinetics at a dose of 6 mg/kg/day for some time, the steady-state plasma concentration in a 72 kg patient was determined to be 10 mg/L. Since this concentration was lower than the desired steady-state concentration, the dose was increased to 8 mg/kg/day. This dose increase resulted in a steady-state plasma concentration of 20 mg/L, which was greater than the desired steady-state concentration. Calculate Vmax, KM, and a dose rate that should achieve a steady-state plasma concentration of 15 mg/L. Part a: calculate KM.","units":"mg/L","answer":10,"tol":0.1,"steps":[{"k":"setup","t":"KM = {{frac:R2 − R1|(R1/C1) − (R2/C2)}}, with R1 = 6 mg/kg/day, C1 = 10 mg/L, R2 = 8 mg/kg/day, C2 = 20 mg/L","why":"Two dose rates in the same patient, each at steady state, share one Vmax and one KM, so the two dose-rate lines combine into this direct-method line for KM."},{"k":"algebra","t":"KM = {{frac:8 − 6|(6/10) − (8/20)}} = {{frac:2 mg/kg/day|0.6 − 0.4 (mg/kg/day)/(mg/L)}} = {{frac:2|0.2}}","why":"Each R divided by its own C. The bottom is the earlier rate over its concentration minus the later one, which keeps the result positive. The mg/kg/day cancel and mg/L moves to the top."},{"k":"round","t":"KM = 10 mg/L","why":"KM comes out in concentration units, mg/L, as it must: it is compared with plasma concentrations, so a KM in mg/kg/day signals the units were not cancelled."}],"setup":{"eq":"nl-km","pre":[],"why":"\"a dose of 6 mg/kg/day\" giving \"10 mg/L\", then \"8 mg/kg/day\" giving \"20 mg/L\": two rates and two steady states in one patient, so the direct method for KM."},"asks":"Km","givens":[["R1","6 mg/kg/day","the first dose rate"],["C1","10 mg/L","steady state on the first rate"],["R2","8 mg/kg/day","the increased dose rate"],["C2","20 mg/L","steady state on the second rate"],["weight","72 kg","not needed for KM"]],"check":{"t":"A one-third rise in dose doubled the concentration, so the drug is near saturation; KM is a concentration, here equal to the lower measured level: 10 mg/L.","lo":0},"teach":[{"h":"The direct method","list":["Two dose rates in the same patient, each with the steady-state concentration it produced: KM = {{frac:R2 − R1|(R1/C1) − (R2/C2)}}.","The rate units cancel, so KM is a concentration, mg/L.","Then Vmax = {{frac:R(KM + Css)|Css}} with either pair; both pairs give the same Vmax."]}],"cite":"8 - Nonlinear PK.pdf, slides 13 \"Determination of KM and Vmax by Direct Method\", 14 \"Example\" and 15; transcript 10-14"}
  ]};

/* Ids that cannot clash with another module's (rule 2 of the kit's CI data rules): every question,
   topic, subtopic and lecture id of FIX, and every reference to one (dupOf, topic, sub, lecture),
   gets the prefix nts-, with the course's own id kept inside it: questions cq5-1 -> nts-cq5-1,
   cq5-6 -> nts-cq5-6, pd-c20 -> nts-pd-c20, pd-c01, pd-c02, pd-c04, pd-c06, pd-c22, pd-ex-b ->
   nts-pd-..., nl-c04, nl-c02, nl-c03, nl-c05, nl-c06, nl-ex1, nl-ex2a -> nts-nl-...; topics pkpd
   -> nts-pkpd, nonlin -> nts-nonlin, and each of their subtopics x -> nts-x; lectures L11 ->
   nts-L11, L12 -> nts-L12. Concepts, skills and every other field are the course's own.
   ../ci/oncourse.js reads PFX too. */
const PFX = fix => {
  const p = id => 'nts-' + id, ref = (o, ks) => { const r = Object.assign({}, o); ks.forEach(k => { if(r[k] !== undefined) r[k] = p(r[k]); }); return r; };
  return {lectures: fix.lectures.map(l => ref(l, ['id'])), skills: fix.skills,
          topics: fix.topics.map(t => Object.assign(ref(t, ['id']), t.subs ? {subs: t.subs.map(x => ref(x, ['id']))} : {})),
          qs: fix.qs.map(q => ref(q, ['id', 'dupOf', 'topic', 'sub', 'lecture']))};
  };
const FIXP = PFX(FIX);
const IDS = FIXP.qs.map(q => q.id);
const Q1 = 'nts-cq5-6';              // the question the quiz checks write on (its id is written out in the page checks below)
// the first {{frac:a|b}} in that question's stem, options and the reason its key is right, as the copied text writes it: (a)/(b)
const FRAC = (q => { const m = [q.stem].concat(q.options.map(o => o.t), q.options.filter(o => o.correct).map(o => o.why)).join(' ').match(/\{\{frac:([^|}]*)\|([^}]*)\}\}/);
  return m ? `(${m[1]})/(${m[2]})` : null; })(FIXP.qs.find(q => q.id === Q1));
const COPIES = 3;                    // 3 copies of the 16, for a large saved state
const ALL = IDS.concat(...Array.from({length: COPIES}, (_, k) => IDS.map(id => `${id}-c${k + 1}`)));

/* How FIX (through PFX) is written into a course, as a question file in the kit's form: one question per line,
   opening {id:'...', then type, dupOf and skill, then prof:'...' (browser_test.js counts the bank that
   way), in the two topics of their own after the course's topics. own = {prof, skills, lectures} of
   the course: `prof` is the course's first professor (the template's "Professor"). The two lectures
   and the two skills are added to course.js, the lectures in the course's literal form
   ({id:'nts-L11', ...}, which state_check.js reads), unless the course has those ids (lectures)
   or skills already. A `setup` (plan-the-problem's) is written only when own.eq, the course's
   EQUATIONS ids, has its equation and every one before it; an `asks` only when own.asks, the
   course's ASKS keys, has it; otherwise it is left out and listed in `dropped`.
   opt.base writes the topics and the 16 questions; opt.copies writes that many more copies of the 16
   (ids, concepts and dupOf suffixed -c<n>, content unchanged; test pages only). ../ci/oncourse.js
   reads FIX and WRITE from this file, so the CI course and the test's copies hold the same data. */
const WRITE = (fix, own, opt) => {
  const lit = v => { if(!/^[^'\\\n]*$/.test(String(v))) throw new Error('cannot be written as a literal: ' + v); return `'${v}'`; };
  const eq = new Set(own.eq || []), asks = new Set(own.asks || []), dropped = {setup: [], asks: []};
  const row = (q, c) => { const r = Object.assign({}, q); ['id', 'type', 'dupOf', 'skill', 'prof'].forEach(k => delete r[k]);
    if(c) r.concept = q.concept + c;
    if(r.setup !== undefined && !(r.setup && (r.setup.eq === 'none' || eq.has(r.setup.eq)) && (r.setup.pre || []).every(x => eq.has(x)))){ delete r.setup; dropped.setup.push(q.id + c); }
    if(r.asks !== undefined && !asks.has(r.asks)){ delete r.asks; dropped.asks.push(q.id + c); }
    return `{id:${lit(q.id + c)},` + (q.type ? ` type:${lit(q.type)},` : '') + (q.dupOf ? ` dupOf:${lit(q.dupOf + c)},` : '') +
           ` skill:${lit(q.skill)}, prof:${lit(own.prof)}, ${JSON.stringify(r).slice(1)},`; };
  const rows = [];
  if(opt.base) fix.qs.forEach(q => rows.push(row(q, '')));
  for(let c = 1; c <= (opt.copies || 0); c++) fix.qs.forEach(q => rows.push(row(q, '-c' + c)));
  let body = `/* notes: Basic-Pharmacokinetics' topics pkpd and nonlin and 16 of their questions (src/q13_quizzes.js,\n   q15_module7b.js, q16_module8.js, ac2eb73), ids prefixed nts-${opt.copies ? `, ${opt.copies} copies of the 16 (ids suffixed -c<n>)` : ''}; written from FIX in features/notes/test.js */\n`;
  if(opt.base) body += fix.topics.map(t => `TOPICS.push(${JSON.stringify(Object.assign({}, t, {prof: own.prof}))});\n`).join('');
  if(rows.length) body += `QUESTIONS.push(\n${rows.join('\n')}\n);\n`;
  const lec = opt.base ? fix.lectures.filter(l => !(own.lectures || []).some(x => x.id === l.id)) : [];
  const sk = opt.base ? fix.skills.filter(s => !(own.skills || []).includes(s.id)) : [];
  const lectures = lec.map(l => `{id:${lit(l.id)}, deck:${lit(l.deck)}, label:${lit(l.label)}, prof:${lit(own.prof)}, exam:${JSON.stringify(l.exam)}, module:${JSON.stringify(l.module)}}`);
  const line = (lectures.length ? `COURSE.lectures = (COURSE.lectures || []).concat([${lectures.join(', ')}]); ` : '') +
               (sk.length ? `COURSE.skills = (COURSE.skills || []).concat(${JSON.stringify(sk)}); ` : '');
  return {body, line, rows: rows.length, lectures: lec.map(l => l.id), skills: sk.map(s => s.id), dropped};
  };

/* The test's scratch copies: the course's own copy of FIX when it has one (a course made by
   ../ci/oncourse.js), else FIX written in, and the copies; the exam paper drawn from FIX's topics. */
function fixtureFiles(own, have){
  const w = WRITE(FIXP, own, {base: !have, copies: COPIES});
  return {files: {[have ? 'q91_notes_copies.js' : 'q90_notes_fixture.js']: w.body}, dropped: w.dropped,
          line: w.line + `COURSE.exams.forEach(e => e.pools.forEach(p => { p.filter = {topic: ${JSON.stringify(FIXP.topics.map(t => t.id))}}; }));`};
}

const DENY = () => { const orig = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k, v){
    if(window.__deny === 'denied') throw new DOMException('The operation is insecure.', 'SecurityError');
    if(window.__deny === 'full') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    return orig.call(this, k, v); }; };

(async () => {
  console.log('\n=== the copied text on the course\'s own bank (node) ===');
  L.PAGE.need(NAME);
  const X = L.engine('({FX, QUESTIONS, COURSE, db: () => DB, upgradeDB: r => upgradeDB(r),' +
    ' EQ: typeof EQUATIONS !== "undefined" && Array.isArray(EQUATIONS) ? EQUATIONS.map(e => e && e.id) : [],' +
    ' ASKS: typeof ASKS !== "undefined" && ASKS && typeof ASKS === "object" ? Object.keys(ASKS) : []})');
  const N = X.FX && X.FX.api('notes');
  if(!check(!!N, 'the page carries notes, working', JSON.stringify((X.FX && X.FX.errors) || 'no feature modules in the page'))) L.finish(NAME);
  X.db().notes = {};
  X.QUESTIONS.forEach((q, i) => { X.db().notes[q.id] = {t: 'Question about ' + q.id, at: 1000 + i}; });
  const md = N.markdown();
  const keyed = X.QUESTIONS.filter(q => (!q.type && Array.isArray(q.options)) || q.type === 'numeric' || q.type === 'match');
  check((md.match(/^## \d+\. /mg) || []).length === X.QUESTIONS.length, `the text has one section per question (${X.QUESTIONS.length} questions)`);
  check((md.match(/^\*\*Key:\*\* \S/mg) || []).length === keyed.length, `a key for every multiple-choice, numeric and matching question (${keyed.length})`);
  check(!/undefined|\[object Object\]/.test(md), 'no "undefined" or "[object Object]" in the text', (md.match(/.{0,40}(undefined|\[object Object\]).{0,20}/) || [''])[0]);
  check(N.noted().length === X.QUESTIONS.length && N.noted()[0] === X.QUESTIONS[X.QUESTIONS.length - 1].id, 'noted() lists every note, newest first');
  const id0 = X.QUESTIONS[0].id;
  const conv = X.upgradeDB({concepts: {}, answers: [], notes: {[id0]: {t: 'kept', at: 5}, a: 'text only', b: {t: '   '}, c: {at: 3}, d: null}});
  check(JSON.stringify(conv.notes) === JSON.stringify({[id0]: {t: 'kept', at: 5}}), 'the converter keeps each note {t, at} and drops anything else', conv.notes);
  check(!('notes' in X.upgradeDB({concepts: {}, answers: [], notes: 'x'})), 'a saved `notes` that is not an object is dropped');

  console.log('\n=== on a scratch copy with Basic-Pharmacokinetics\' question (Chromium) ===');
  const own = {prof: X.COURSE.professors[0], skills: X.COURSE.skills.map(k => k.id), lectures: X.COURSE.lectures, eq: X.EQ, asks: X.ASKS};
  // a course made by ci/oncourse.js has FIX already: the copies are added to the course's own
  const have = IDS.every(id => X.QUESTIONS.some(q => q.id === id));
  console.log(`  the course ${have ? 'has' : 'does not have'} FIX's ${IDS.length} questions; the scratch copy ${have ? 'adds' : 'writes them and adds'} ${COPIES} copies of them`);
  const f = fixtureFiles(own, have);
  console.log(`  left out of the scratch copy: ${f.dropped.setup.length} setup and ${f.dropped.asks.length} asks lines naming an equation or ASKS key the course lacks`);
  const s = L.scratchBuild('notes', {files: f.files, courseLine: f.line});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test question does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'notes-test-'));
  try {
    for(const width of [390, 1200]){
      console.log(`\n--- ${width} px ---`);
      const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width, height: 900}, acceptDownloads: true}, DENY);
      const ev = (f, a) => page.evaluate(f, a);
      const wait = ms => page.waitForTimeout(ms);
      const SC = await ev(() => !!FX.api('study-controls'));
      // a note on a drill question
      await L.quizOn(page, ['nts-cq5-6', 'nts-cq5-6']);
      check(await ev(() => !!document.querySelector('#v-quiz .qcard .qhead [data-noteq="nts-cq5-6"]')), 'the quiz card carries ✎ Note');
      await page.click('#v-quiz [data-noteq="nts-cq5-6"]');
      await page.fill('#v-quiz textarea[data-notetext="nts-cq5-6"]', 'Why is Vmax not compared with Cp?');
      if(SHOTS && width === 390) await page.screenshot({path: path.join(SHOTS, 'quiz-note-390.png')});
      await wait(400);
      check(await ev(() => DB.notes['nts-cq5-6'] && DB.notes['nts-cq5-6'].t) === 'Why is Vmax not compared with Cp?', 'a note on a drill question is saved as it is typed');
      check(await ev(() => document.querySelector('#v-quiz [data-noteq="nts-cq5-6"]').textContent) === '✎ My note', 'the button then reads My note');
      if(SC){
        // study-controls' keys must not fire while the note is typed in: every key it reads
        // (A-J, 1-9, Enter, the arrows), before the answer and after a right answer
        const KEYS = 'abcdefghij123456789';
        const typeKeys = async sel => { await page.click(sel); await page.keyboard.type(KEYS);
          for(const k of ['Enter', 'ArrowRight', 'ArrowLeft']) await page.keyboard.press(k); };
        const n0 = await ev(() => (DB.answers || []).length);
        await typeKeys('#v-quiz textarea[data-notetext="nts-cq5-6"]'); await wait(300);
        const k = await ev(() => ({revealed: Q.revealed, picked: Q.picked, t: DB.notes['nts-cq5-6'].t, n: (DB.answers || []).length}));
        check(!k.revealed && (k.picked === null || k.picked === undefined) && k.n === n0 && k.t.endsWith(KEYS + '\n'),
              'typing A-J, 1-9, Enter and the arrows in a note on the quiz picks, checks and records nothing, and the keys go into the note (study-controls keys)', k);
        // the same keys outside the note do drive the quiz: the right letter answers it
        await ev(() => document.activeElement && document.activeElement.blur());
        const right = await ev(() => 'abcdefghij'[Q.order.findIndex(oi => Q.current.options[oi].correct)]);
        await page.keyboard.press(right); await wait(100);
        if(!(await ev(() => Q.revealed))){ await page.keyboard.press('Enter'); await wait(100); }
        const r1 = await ev(() => ({revealed: Q.revealed, right: !!Q.lastRight, n: DB.answers.length}));
        check(r1.revealed && r1.right && r1.n === n0 + 1, 'with the note left, the right letter key answers the question (the keys are live)', r1);
        if(!(await ev(() => !!document.querySelector('#v-quiz textarea[data-notetext="nts-cq5-6"]')))) await page.click('#v-quiz [data-noteq="nts-cq5-6"]');
        await typeKeys('#v-quiz textarea[data-notetext="nts-cq5-6"]'); await wait(300);
        const r2 = await ev(() => ({revealed: Q.revealed, n: DB.answers.length, last: DB.answers[DB.answers.length - 1].result, t: DB.notes['nts-cq5-6'].t}));
        check(r2.revealed && r2.n === r1.n && r2.last === 'correct' && r2.t.split(KEYS).length - 1 === 2,
              'after a right answer, typing 1, 2, 3 and Enter in the note marks nothing (Not sure, I guessed) and does not move on', r2);
        await page.fill('#v-quiz textarea[data-notetext="nts-cq5-6"]', 'Why is Vmax not compared with Cp?'); await wait(300);
        await ev(() => document.activeElement && document.activeElement.blur());
        await page.keyboard.press('1'); await wait(150);
        check(await ev(() => !Q.revealed), 'with the note left, 1 moves on to the next question (the keys are live)');
      }
      await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
      check(await ev(() => DB.notes && DB.notes['nts-cq5-6'] && DB.notes['nts-cq5-6'].t) === 'Why is Vmax not compared with Cp?', 'the note is still there after a reload');

      // a note on a running paper
      await ev(() => { Q = null; show('exam'); beginExam(); });
      const k2 = await ev(() => { const k = EX.qs.findIndex(q => q.id !== 'nts-cq5-6'); EX.i = k; renderExamQ(); return k; });
      const pid = await ev(k => EX.qs[k].id, k2);
      check(await ev(all => EX.qs.length > 1 && EX.qs.every(q => all.includes(q.id)), ALL), 'the paper is drawn from the Pharmacokinetics questions only');
      await page.waitForSelector(`#v-exam [data-noteq="${pid}"]`, {timeout: 3000}).catch(() => {});
      check(await ev(id => !!document.querySelector(`#v-exam .qhead [data-noteq="${id}"]`), pid), 'the exam paper\'s card carries ✎ Note');
      await page.click(`#v-exam [data-noteq="${pid}"]`);
      await page.fill(`#v-exam textarea[data-notetext="${pid}"]`, 'Not sure which line to use here.');
      if(SC){
        const before = await ev(() => ({i: EX.i, p: JSON.stringify(EX.picks)}));
        await page.click(`#v-exam textarea[data-notetext="${pid}"]`);
        await page.keyboard.type(' ' + 'abcdefghij123456789'); for(const k of ['Enter', 'ArrowRight', 'ArrowLeft']) await page.keyboard.press(k);
        const after = await ev(id => ({i: EX.i, p: JSON.stringify(EX.picks), t: DB.notes[id] && DB.notes[id].t}), pid);
        check(after.i === before.i && after.p === before.p && String(after.t).endsWith('abcdefghij123456789\n'),
              'typing A-J, 1-9, Enter and the arrows in a note on the paper moves and picks nothing, and the keys go into the note (study-controls keys)', {before, after});
        await page.fill(`#v-exam textarea[data-notetext="${pid}"]`, 'Not sure which line to use here.');
        await ev(() => document.activeElement && document.activeElement.blur());
        await page.keyboard.press('ArrowRight'); await wait(100);
        const moved = await ev(() => EX.i);
        await page.keyboard.press('ArrowLeft'); await wait(100);
        check(moved === before.i + 1 && await ev(() => EX.i) === before.i, 'with the note left, the right arrow moves to the next question and the left arrow back (the keys are live)', {moved, i: before.i});
      }
      await wait(400);
      let text = await ev(() => FX.api('notes').markdown());
      const sec = text.split(/^## /m).find(x => x.includes('Not sure which line')) || '';
      check(sec.includes('**Key:** left out until the paper is submitted') && (sec.match(/^\*\*Key:\*\* /mg) || []).length === 1 && !sec.includes('Why the key is right'),
            'a note on a running paper leaves its key and the reason out of the text', sec.slice(0, 300));
      await ev(() => show('notes'));
      check(await ev(id => { const c = document.querySelector(`#v-notes [data-noteid="${id}"]`); return !!c && /hidden until the paper/.test(c.textContent) && !c.querySelector('.ntkey'); }, pid),
            'the Notes tab hides that question\'s key while the paper runs');
      await ev(() => { window.onbeforeunload = null; });
      await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
      await ev(() => show('exam'));
      check(await ev(id => !!EX && EX.running && DB.notes[id] && DB.notes[id].t === 'Not sure which line to use here.', pid), 'after a reload the paper and its note are both there');
      await ev(() => finishExam(false)); await wait(200);
      check(await ev(() => document.querySelectorAll('#v-exam > .qcard .qhead [data-noteq]').length === EX.qs.length), 'after Submit every result card carries ✎ Note');
      check(await ev(id => document.querySelector(`#v-exam [data-noteq="${id}"]`).textContent === '✎ My note', pid), 'the result card of the noted question reads My note');
      text = await ev(() => FX.api('notes').markdown());
      check(!text.includes('left out until') && (text.match(/^\*\*Key:\*\* /mg) || []).length === 2 && text.includes('Not sure which line') && text.includes('Why is Vmax'),
            'after Submit the text carries both notes with their keys');
      check(!!FRAC && text.includes(FRAC) && !text.includes('{{frac'), `the course's {{frac:a|b}} is written (a)/(b) in the text (${FRAC})`);
      check(text.startsWith('# My questions: ') && !/\bher\b|\bshe\b/i.test(text), 'the text names no professor by pronoun');

      // Weak spots and the Notes tab
      await ev(() => show('gaps'));
      check(await ev(() => (document.querySelector('#ntGaps') || {}).textContent || ''), 'Weak spots has the notes line') ;
      check((await ev(() => document.querySelector('#ntGaps').textContent)).includes('You have 2 notes'), 'Weak spots counts the 2 notes');
      await page.click('#ntOpen');
      check(await ev(() => VIEW === 'notes' && document.querySelectorAll('#v-notes [data-noteid]').length === 2), 'Open Notes opens the Notes tab with a card for each note');
      check(await ev(id => document.querySelector('#v-notes [data-noteid]').dataset.noteid === id, pid), 'the newest note is first');
      check(await ev(() => /Your answer:/.test(document.querySelector('#v-notes [data-noteid="nts-cq5-6"]').textContent) || /Not answered yet/.test(document.querySelector('#v-notes [data-noteid="nts-cq5-6"]').textContent)),
            'each card says the answer last given, or that there is none');
      if(SHOTS && width === 390) await page.screenshot({path: path.join(SHOTS, 'notes-tab-390.png'), fullPage: true});
      await ev(() => { navigator.clipboard.writeText = t => { window.__copied = t; return Promise.resolve(); }; });
      await page.click('#notesCopy'); await wait(200);
      check(await ev(() => document.querySelector('#notesCopy').textContent) === 'Copied ✓', 'Copy for AI says Copied');
      check(await ev(() => window.__copied === FX.api('notes').markdown()), 'Copy for AI copies the whole text');
      const dl = page.waitForEvent('download');
      await page.click('#notesDown');
      const d = await dl, cid = await ev(() => COURSE.id);
      check(d.suggestedFilename() === `${cid}-my-questions.md`, 'Download saves <course id>-my-questions.md', d.suggestedFilename());
      const dp = path.join(tmp, 'notes-' + width + '.md'); await d.saveAs(dp);
      check(fs.readFileSync(dp, 'utf8') === await ev(() => FX.api('notes').markdown()), 'the downloaded file is the text');
      await page.fill('#v-notes textarea[data-notetext="nts-cq5-6"]', 'Edited in the Notes tab.'); await wait(300);
      check(await ev(() => DB.notes['nts-cq5-6'].t) === 'Edited in the Notes tab.', 'a note edits in the Notes tab');
      // the flag mark, read from study-controls when it is on
      if(SC){
        await ev(() => { FX.api('study-controls').set('nts-cq5-6', true); show('topics'); show('notes'); });
        check(await ev(() => !!document.querySelector('#v-notes [data-noteid="nts-cq5-6"] .ntflag') && document.querySelectorAll('#v-notes .ntflag').length === 1), 'with study-controls on, the flagged question\'s card says ⚑ flagged');
        await ev(() => { FX.api('study-controls').set('nts-cq5-6', false); show('topics'); show('notes'); });
        check(await ev(() => !document.querySelector('#v-notes .ntflag')), 'the mark goes when the flag does');
      }else{
        await ev(() => { DB.flags = {'nts-cq5-6': 1}; show('topics'); show('notes'); });
        check(await ev(() => !document.querySelector('#v-notes .ntflag')), 'with study-controls off, no flag mark, even with a stray DB.flags');
        await ev(() => { delete DB.flags; });
      }
      await page.click('#v-notes [data-notedel="nts-cq5-6"]'); await wait(200);
      check(await ev(() => !DB.notes['nts-cq5-6'] && document.querySelectorAll('#v-notes [data-noteid]').length === 1), 'Delete note removes it');
      await page.fill(`#v-notes textarea[data-notetext="${pid}"]`, '   '); await wait(300);
      check(await ev(id => !(id in DB.notes), pid), 'an emptied note is removed from the progress');
      await page.fill(`#v-notes textarea[data-notetext="${pid}"]`, 'Back again.'); await wait(300);
      await page.click('#notesDrill');
      check(await ev(id => VIEW === 'quiz' && Q.pool.length === 1 && Q.pool[0].id === id, pid), 'Drill these drills the noted questions');
      await ev(() => show('settings'));
      check(await ev(() => /Export progress includes them, Import progress brings them back, and Erase my history removes them/.test((document.querySelector('#v-settings [data-feature="notes"]') || {}).textContent || '')),
            'Settings says what is kept and where');

      if(SC){
        await ev(() => { DB.layout = 'all'; save(); drillList(QUESTIONS.filter(q => !q.type).slice(0, 5), 'one page'); });
        await wait(300);
        check(await ev(() => { const c = document.querySelectorAll('#v-quiz .qcard[data-scq]'); return c.length > 1 && [...c].every(x => x.querySelector('.qhead [data-noteq="' + x.dataset.scq + '"]')); }),
              'study-controls\' one-page quiz cards each carry ✎ Note');
        await ev(() => { Q = null; EX = null; clearExam(); show('exam'); beginExam(); }); await wait(300);
        check(await ev(() => { const c = document.querySelectorAll('#v-exam .qcard.scxq'); return c.length === EX.qs.length && [...c].every((x, k) => x.querySelector('.qhead [data-noteq="' + EX.qs[k].id + '"]')); }),
              'study-controls\' one-page paper cards each carry ✎ Note');
        await ev(() => { finishExam(false); DB.layout = 'one'; save(); });
      }

      if(width === 390){
        console.log('\n--- persistence: a large saved state (390 px) ---');
        const big = await ev(all => {
          const ids = all.filter(id => byId(id));
          if(ids.length !== all.length) throw new Error('the scratch copy lacks ' + (all.length - ids.length) + ' of the fixture\'s questions');
          ids.forEach((id, i) => { DB.notes[id] = {t: 'Note ' + i + ': ' + 'what I am thinking about this question. '.repeat(50).slice(0, 2000), at: Date.now() - (ids.length - i) * 1000}; });
          for(let i = 0; i < 300; i++) record(QUESTIONS[i % QUESTIONS.length], i % 3 ? 'correct' : 'wrong', undefined, 1000);
          save(); return {n: Object.keys(DB.notes).length, answers: DB.answers.length, profile: PROFILE};
        }, ALL);
        await wait(400);
        const snap = await ev(() => JSON.stringify(DB.notes));
        await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
        check(await ev(() => JSON.stringify(DB.notes)) === snap && await ev(() => DB.answers.length) >= big.answers,
              `${big.n} notes of up to 2,000 characters and ${big.answers} answers come back after a reload`, big);
        await ev(() => show('notes'));
        check(await ev(n => document.querySelectorAll('#v-notes [data-noteid]').length === n, big.n), `the Notes tab lists all ${big.n}`);
        const tp = await ev(() => { const b = [...document.querySelectorAll('#v-notes [data-notestopic]')].filter(x => x.dataset.notestopic !== 'all');
          if(!b.length) return null; const t = b[b.length - 1].dataset.notestopic; b[b.length - 1].click();
          const cards = [...document.querySelectorAll('#v-notes [data-noteid]')];
          return {t, n: cards.length, all: cards.every(c => byId(c.dataset.noteid).topic === t), want: Object.keys(DB.notes).filter(id => byId(id) && byId(id).topic === t).length,
                  drill: document.querySelector('#notesDrill').textContent}; });
        check(tp && tp.n === tp.want && tp.all && tp.drill === `Drill these ${tp.want}`, 'the topic filter lists only that topic\'s notes, and Drill these counts them', tp);
        await page.click('#notesDrill');
        check(await ev(t => Q.pool.length > 0 && Q.pool.every(q => q.topic === t), tp && tp.t), 'Drill these drills only that topic\'s noted questions');

        // Export, then Import into a new profile
        await ev(() => show('settings'));
        const ex = page.waitForEvent('download'); await page.click('#btnExport');
        const ef = path.join(tmp, 'export.json'); await (await ex).saveAs(ef);
        const exported = JSON.parse(fs.readFileSync(ef, 'utf8'));
        check(JSON.stringify(exported.db.notes) === snap, `Export progress carries every note (${Object.keys(exported.db.notes || {}).length})`);
        await ev(() => { window.__name = 'Fresh'; askProfile(true); show('settings'); });
        check(await ev(() => PROFILE === 'Fresh' && !DB.notes), 'a new profile starts with no notes');
        await page.setInputFiles('#fileIn', ef); await wait(600);
        check(await ev(() => JSON.stringify(DB.notes)) === snap, 'Import progress into the new profile brings back the same notes');
        await wait(300);
        await ev(() => { window.__name = 'Other'; askProfile(true); });
        await ev(() => { show('notes'); });
        check(await ev(() => !DB.notes && /No notes yet/.test(document.querySelector('#v-notes').textContent)), 'a third profile has no notes');
        await ev(() => { FX.api('notes'); DB.notes = {'nts-cq5-6': {t: 'Other profile note', at: Date.now()}}; save(); }); await wait(300);
        await ev(p => { window.__name = p; askProfile(true); }, big.profile);
        check(await ev(() => JSON.stringify(DB.notes)) === snap, 'switching back, the first profile has its own notes');
        await ev(() => { window.__name = 'Other'; askProfile(true); });
        check(await ev(() => Object.keys(DB.notes).length === 1 && DB.notes['nts-cq5-6'].t === 'Other profile note'), 'the other profile keeps only its own note');
        await ev(p => { window.__name = p; askProfile(true); }, big.profile);
        check(await ev(p => PROFILE === p, big.profile), 'back on the first profile');

        // a reload soon after a change
        const typeNote = async (t) => { await L.quizOn(page, ['nts-cq5-6-c1', 'nts-cq5-6-c1']); await page.click('#v-quiz [data-noteq="nts-cq5-6-c1"]');
          await page.fill('#v-quiz textarea[data-notetext="nts-cq5-6-c1"]', t); };
        await typeNote('Kept: reloaded 400 ms after.'); await wait(400);
        await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
        check(await ev(() => DB.notes['nts-cq5-6-c1'].t) === 'Kept: reloaded 400 ms after.', 'a reload 400 ms after typing keeps the change');
        await typeNote('Typed then reloaded at once.');
        await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
        const fast = await ev(() => ({t: DB.notes['nts-cq5-6-c1'].t, n: Object.keys(DB.notes).length}));
        console.log(`  report  a reload under 150 ms after typing: the note reads "${fast.t}" (${fast.t === 'Typed then reloaded at once.' ? 'the change was kept' : 'the last change was lost; the earlier text is kept'}), ${fast.n} notes`);
        check(fast.n === big.n && (fast.t === 'Kept: reloaded 400 ms after.' || fast.t === 'Typed then reloaded at once.'), 'a reload under 150 ms after typing loses at most that change, and every note is still there', fast);

        // storage denied, then storage full
        for(const mode of ['denied', 'full']){
          await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
          const stored0 = await ev(() => localStorage.getItem(keyFor(PROFILE)));
          await ev(m => { window.__deny = m; }, mode);
          await typeNote(`Written while storage is ${mode}.`); await wait(400);
          const r = await ev(() => ({warn: (() => { const w = document.querySelector('#savewarn'); if(!w) return false; const b = w.getBoundingClientRect(), cs = getComputedStyle(w);
              return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; })(),
            text: (document.querySelector('#savewarn') || {}).textContent || '', stored: localStorage.getItem(keyFor(PROFILE)), mem: DB.notes['nts-cq5-6-c1'].t}));
          check(r.warn && /did not save your progress/.test(r.text), `storage ${mode}: the student is told the progress was not saved`, r.text);
          check(r.stored === stored0 && r.mem === `Written while storage is ${mode}.`, `storage ${mode}: the stored progress is left as it was, and the note stays on screen`);
          await ev(() => { window.__deny = null; });
          await typeNote(`Written after storage works again (${mode}).`); await wait(400);
          await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
          const back = await ev(() => ({t: DB.notes['nts-cq5-6-c1'].t, n: Object.keys(DB.notes).length}));
          check(back.t === `Written after storage works again (${mode}).` && back.n === big.n, `storage ${mode}: once storage works, the next change is saved with every earlier note and loads after a reload`, back);
        }
        if(SHOTS) { await ev(() => show('notes')); await page.screenshot({path: path.join(SHOTS, 'notes-many-390.png')}); }

        // a saved note in a bad shape is dropped on load; the rest load
        await ev(() => { const k = keyFor(PROFILE), d = JSON.parse(localStorage.getItem(k)); d.notes.bad1 = 'text only'; d.notes['nts-cq5-6-c2'] = {t: 7}; localStorage.setItem(k, JSON.stringify(d)); });
        await page.reload(); await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3);
        check(await ev(n => !('bad1' in DB.notes) && !('nts-cq5-6-c2' in DB.notes) && Object.keys(DB.notes).length === n - 1, big.n), 'a saved note in a bad shape is dropped on load, the others load');

        await ev(() => show('settings')); await page.click('#btnReset'); await wait(300);
        check(await ev(() => !DB.notes), 'Erase my history removes the notes');
      }
      const fx = await ev(() => FX.errors.length ? FX.errors : null);
      check(!fx && !errors.length, `no page error and no module error at ${width} px`, JSON.stringify(fx || errors.slice(0, 3)));
      await ctx.close();
    }
  } finally {
    await browser.close();
    s.rm(); fs.rmSync(tmp, {recursive: true, force: true});
  }
  L.finish(NAME);
})().catch(e => { console.log('  FAIL  the test stopped: ' + (e && e.stack || e)); L.check(false, 'the test ran to its end', String(e && e.message || e)); L.finish(NAME); });
