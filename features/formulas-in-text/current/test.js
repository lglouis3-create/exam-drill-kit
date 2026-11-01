/* formulas-in-text: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * On the course's own bank: every {{frac:...}} in a question's stem, options,
 * explanations, concept block, note, worked steps and matching pairs is well
 * formed, and every {{ closes (Basic-Pharmacokinetics src/test.js lines 826-857).
 *
 * On a scratch copy with the module on and Basic-Pharmacokinetics' own symbol
 * table (its src/views.js lines 16-38, below) and eight of its questions and one
 * of its calculations (the fixture below, copied from its question files at
 * ac2eb73), in Chromium:
 *   - each stem and option is drawn exactly as that course's own formatter draws
 *     it (its rich(), run on the same text at ac2eb73; the expected HTML is in the
 *     fixture), and so is each worked step of the calculation;
 *   - no {{frac: is left on screen after an answer, the explanations included;
 *   - the control on the formatter (its src/test.js lines 862-874): six typed
 *     formulas set as the slides print them, three runs of ordinary text left as
 *     they are;
 *   - a question with none of the marks is drawn exactly as without the module;
 *   - a fraction in a reading tab's HTML stacks; a matching dropdown shows a
 *     ratio as (a)/(b), since an option cannot hold markup.
 *
 *     node features/formulas-in-text/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/formulas-in-text/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

// Basic-Pharmacokinetics src/views.js lines 16-38 (SUBSYM) and 43 (RATE), at ac2eb73
const PK_SYMBOLS = [['Cmax∞','C<sub>max</sub><sup>∞</sup>'],['Cmin∞','C<sub>min</sub><sup>∞</sup>'],['Cavg∞','C<sub>avg</sub><sup>∞</sup>'],
  ['Cav∞','C<sub>av</sub><sup>∞</sup>'],['Dmax∞','D<sub>max</sub><sup>∞</sup>'],['Dmin∞','D<sub>min</sub><sup>∞</sup>'],
  ['Davg∞','D<sub>avg</sub><sup>∞</sup>'],['kVD','kV<sub>D</sub>'],['FD0','FD<sub>0</sub>'],
  ['AUCA','AUC<sub>A</sub>'],['AUCB','AUC<sub>B</sub>'],['AUCC','AUC<sub>C</sub>'],['Fabs','F<sub>abs</sub>'],['Frel','F<sub>rel</sub>'],
  ['Dpo','D<sub>po</sub>'],['DIV','D<sub>IV</sub>'],['DA','D<sub>A</sub>'],
  ['AUCoral','AUC<sub>oral</sub>'],['AUCiv','AUC<sub>IV</sub>'],['AUCpo','AUC<sub>po</sub>'],['AUCIV','AUC<sub>IV</sub>'],
  ['Cpeak','C<sub>peak</sub>'],['Cmax','C<sub>max</sub>'],['Cmin','C<sub>min</sub>'],['tmax','t<sub>max</sub>'],
  ['Css','C<sub>ss</sub>'],['ClT','Cl<sub>T</sub>'],['ClR','Cl<sub>R</sub>'],['ClH','Cl<sub>H</sub>'],['SCr','S<sub>Cr</sub>'],
  ['k12','k<sub>12</sub>'],['k21','k<sub>21</sub>'],['Cp0','C<sub>p</sub><sup>0</sup>'],['Cp','C<sub>p</sub>'],['Cs','C<sub>s</sub>'],
  ['C0','C<sub>0</sub>'],['D0','D<sub>0</sub>'],['k0','k<sub>0</sub>'],['DB','D<sub>B</sub>'],['DL','D<sub>L</sub>'],['Du','D<sub>u</sub>'],
  ['VD','V<sub>D</sub>'],['Vp','V<sub>p</sub>'],['Vt','V<sub>t</sub>'],['Vc','V<sub>c</sub>'],
  ['ka','k<sub>a</sub>'],['ke','k<sub>e</sub>'],['km','k<sub>m</sub>'],['fe','f<sub>e</sub>'],
  ['C1','C<sub>1</sub>'],['C2','C<sub>2</sub>'],['t1','t<sub>1</sub>'],['t2','t<sub>2</sub>'],['Ct','C<sub>t</sub>'],
  ['Cn','C<sub>n</sub>'],['tn','t<sub>n</sub>']];
const PK_RATES = ['k0', 'ka', 'ke', 'km'];
// Basic-Pharmacokinetics src/test.js lines 862-872
const CONVERT = [
  ['C = C0e^(-kt)', 'C = C<sub>0</sub>e<sup>−kt</sup>'],
  ['t1/2 = C0/2k0', 't½ = C<sub>0</sub>/2k<sub>0</sub>'],
  ['Cl = k x VD', 'Cl = k × V<sub>D</sub>'],
  ['tmax = ln(ka/k)/(ka - k)', 't<sub>max</sub> = ln(k<sub>a</sub>/k)/(k<sub>a</sub> − k)'],
  ['t1/2a = 0.693/ka', 't½<sub>a</sub> = 0.693/k<sub>a</sub>'],
  ['Cp0 = A + B', 'C<sub>p</sub><sup>0</sup> = A + B'],
];
const LEAVE = ['kappa, keep, fetch, taken, Access, VDs, first-order, zero-order, 2-compartment',
               'the peak and the tail', 'Ke, Cps and CAUC are not symbols here'];
/* Eight Basic-Pharmacokinetics questions with formulas, and one calculation, at
   ac2eb73 (ids are theirs; teach is the concept block's text), with that course's
   own rich() of each stem and option (exp) and of each worked step (nexp). */
const FIX = {"qs":[{"id":"m2-mod-4","stem":"The decline of plasma concentration after an intravenous bolus can be written as Cp = Cp0·e^(−kt), as ln Cp = ln Cp0 − kt, or as log Cp = log Cp0 − kt/2.3. Which of the three forms is the preferred one in this course, the other two being equally valid?","options":[{"t":"The natural-logarithm form","correct":true,"why":"She prefers the natural-log equations and adds that either one gets you there, so the base-ten form is not wrong, just not her route. The natural-log form needs no conversion factor, so the 2.3 never appears in her worked solutions."},{"t":"The base-ten logarithm form","correct":false,"why":"This is the form that carries the 2.3, and the one she works away from. Choosing it usually comes from having met semi-logarithmic graph paper first, which is base ten, and assuming the algebra must match it. The two forms describe the same line; only the scaling of the slope differs."},{"t":"The exponential form","correct":false,"why":"This answer confuses the form she uses in forward calculations with the one she names as preferred. The exponential form, Cp = Cp0·e^(−kt), carries a known concentration forward to a later time, but her stated preference is the natural-log form, whose slope is k. It also invites a sign error when solving back to Cp0."},{"t":"Whichever form the plotted axis uses","correct":false,"why":"The axis of a plot decides how the data look, not which algebraic form you must solve with. A concentration measured at a time is the same number whichever equation you rearrange, so tying the choice of equation to the graph paper adds a constraint that does not exist."}],"teach":"","cite":"2IVBolusAdministration.pdf, slide \"Concentration of Drug in the Plasma, Cp\""},{"id":"m5-c04","stem":"The first-order absorption rate constant ka of an oral tablet accounts for which processes?","options":[{"t":"Disintegration, dissolution, membrane crossing and first pass","correct":true,"why":"A tablet must break up, the drug must dissolve, the dissolved drug must cross the gut membranes, and what crosses then passes through the liver. The single constant ka lumps these steps into one number, so a change of dosage form changes ka without changing elimination."},{"t":"Glomerular filtration, tubular secretion and tubular reabsorption","correct":false,"why":"Filtration, secretion and reabsorption decide how drug leaves the body, so they belong to the elimination rate constant k, not to ka. Choosing this attaches output processes to the input constant."},{"t":"Distribution into the tissues","correct":false,"why":"Picking this imports the distribution phase of the two-compartment intravenous model into a one-compartment oral one. Here distribution is immediate and is carried by the volume of distribution, not a rate constant; the rising limb of an oral curve is absorption, not distribution."},{"t":"Protein binding in the plasma","correct":false,"why":"Protein binding affects how much drug is free once the drug is in the plasma and has nothing to do with the rate at which it arrives there. No binding term appears anywhere in the single oral dose equation. Selecting this attaches a plasma process to a gastrointestinal rate constant."}],"teach":"","cite":"09.21 lecture"},{"id":"m6-c12","stem":"In Cmax∞ = {{frac:C0|1 − e^(-kτ)}}, what does the factor {{frac:1|1 − e^(-kτ)}} account for?","options":[{"t":"The drug accumulated in the body at steady state","correct":true,"why":"Multiplying the first-dose peak C0 by this factor gives the steady-state peak, so the factor is how much higher the peak is once earlier doses have left drug behind. It is 1 only if nothing is left from one dose to the next."},{"t":"The fraction of the dose absorbed","correct":false,"why":"Choosing this confuses the accumulation factor with F, the bioavailability. An intravenous (IV) bolus puts the whole dose into the blood, so F = 1 and no F appears in this line. The factor is built from k and τ only, so it carries nothing about absorption."},{"t":"The fraction of each dose eliminated","correct":false,"why":"Choosing this reads the denominator as the whole factor. The fraction eliminated in one interval is 1 − e^(-kτ), the denominator itself. Its reciprocal is what multiplies C0, and that reciprocal is the accumulation."},{"t":"The conversion from amount to concentration","correct":false,"why":"Choosing this mixes the accumulation factor up with VD. The conversion from amount to concentration is division by VD, which is already inside C0 = {{frac:D0|VD}}. This factor has no units."}],"teach":"The same factor, {{frac:1|1 − e^(-kτ)}}, appears in the steady-state maximum, the minimum and the concentration after n doses. Each time it carries the drug that has accumulated.","cite":"6---Repetitive-IV-Bolus-and-Intermittent-IV-Infusions.pdf, slide \"Amount of Drug in the Body at Steady-State Following Repeated IV Bolus Injections\"; 09.23 lecture"},{"id":"m6-c15","stem":"Cavg∞ = {{frac:FD0|VD kτ}} is used for a drug given by repeated IV bolus. What value does F take?","options":[{"t":"1","correct":true,"why":"F is the fraction of the dose that reaches the systemic circulation. An IV bolus puts the whole dose into the circulation, so F = 1. F is written into the equation because the same average applies to repeated oral dosing, where F may be less than 1."},{"t":"0","correct":false,"why":"Choosing this reverses what F measures. F = 0 would mean none of the dose reached the circulation and the average concentration would be zero. An IV dose is the case where all of it does."},{"t":"The accumulation factor","correct":false,"why":"Choosing this confuses F with the accumulation factor. The average-concentration equation has no accumulation factor in it; the average does not need one. F is bioavailability, a fraction of the dose."},{"t":"e^(-kτ)","correct":false,"why":"Choosing this confuses F with the fraction remaining. e^(-kτ) is the fraction of a dose left after one interval, which appears in the minimum equations. F is the fraction absorbed, which for an IV dose is all of it."}],"teach":"F is bioavailability from Module 5: the fraction of the dose that reaches the plasma, measured as {{frac:AUCoral|AUCIV}} (Introduction slide \"The Concept of Area Under The Curve (AUC)\").","cite":"6---Repetitive-IV-Bolus-and-Intermittent-IV-Infusions.pdf, slide \"Concentration of Drug in the Body at Steady-State Following Repeated IV Bolus Injections\"; 09.23 lecture"},{"id":"m6b-c02","stem":"A drug is given as a series of 2-hour intravenous (IV) infusions. Which equation gives the plasma concentration at the end of one infusion?","options":[{"t":"Cp = {{frac:R|VD k}} × (1 − e^(−kt))","correct":true,"why":"Each infusion is a constant-rate input, so during it the concentration follows the single-infusion equation. R is the dose divided by the duration, and t runs only to the end of the infusion."},{"t":"Cp = C0e^(−kt)","correct":false,"why":"This is the decline after the infusion stops, not the rise during it. Choosing this skips the step that produces C0: the concentration at the end of the infusion has to be found first, and this equation is then applied to it."},{"t":"Cmax∞ = {{frac:C0|1 − e^(−kτ)}}","correct":false,"why":"Choosing this carries the bolus steady-state peak into an infusion regimen. That equation needs C0 = {{frac:D0|VD}}, a bolus quantity; an infusion has no concentration at time zero, because the drug enters over time."},{"t":"Css = R/Cl","correct":false,"why":"This treats a short infusion as if it had run to steady state. {{frac:R|Cl}} is the plateau a continuous infusion reaches after 3 to 5 half-lives; a 2-hour infusion stops short of it whenever 2 hours is less than 3 to 5 half-lives, and the (1 − e^(−kt)) factor measures how far short."}],"teach":"","cite":"6---Repetitive-IV-Bolus-and-Intermittent-IV-Infusions.pdf, slide \"Administering One or More Doses by IV Infusion\"; 09.28 lecture"},{"id":"m6b-c07","stem":"Cmax∞ = {{frac:FD0|VD}} × {{frac:1|1 − e^(−kτ)}} × e^(−k·tmax∞). What marks this as the steady-state peak for an oral dose rather than for a repeated intravenous (IV) bolus?","options":[{"t":"The F and the tmax","correct":true,"why":"F is bioavailability, which an IV dose does not need, and tmax is the time to peak, which a bolus lacks because it peaks at the moment of the dose. Remove those two and what is left, {{frac:D0|VD}} × {{frac:1|1 − e^(−kτ)}}, is the bolus Cmax∞."},{"t":"The τ","correct":false,"why":"This reads the dosing interval as an oral feature. Every multiple-dose regimen has a τ, bolus or oral, so τ cannot tell the two apart."},{"t":"The accumulation factor {{frac:1|1 − e^(−kτ)}}","correct":false,"why":"Choosing this attaches accumulation to the oral route. The same factor appears in the repeated-bolus equations, because accumulation depends on k and τ, not on how the dose enters."},{"t":"The VD","correct":false,"why":"The volume of distribution turns an amount into a concentration for every route, so VD is in the bolus equation too."}],"teach":"","cite":"6a---Multiple-Oral-Doses.pdf, slide \"Peak, Trough and Average Plasma Concentrations at Steady State\"; 09.28 lecture"},{"id":"m6b-c12","stem":"The equation for the plasma concentration after n oral doses has the same prefactor {{frac:F ka D0|VD(ka − k)}} as the single-dose equation. What is new in it?","options":[{"t":"The dose number n and the dosing interval τ","correct":true,"why":"Each exponential is now multiplied by a bracket: {{frac:1 − e^(−nkτ)|1 − e^(−kτ)}} on the elimination term, and the matching bracket in ka on the absorption term. n says which dose has just been given, and τ how far apart the doses are."},{"t":"F and VD","correct":false,"why":"This reads the prefactor as new. F and VD are already in the single-dose equation; what changes is the multiplier on each exponential."},{"t":"A new rate constant for accumulation","correct":false,"why":"Choosing this invents a constant. Accumulation is expressed with the same k and ka through the brackets in τ; no new rate constant is defined."},{"t":"tmax in place of t","correct":false,"why":"This confuses the general equation with the peak. The equation gives the concentration at any time t after the n-th dose; tmax is one particular t."}],"teach":"","cite":"6a---Multiple-Oral-Doses.pdf, slide \"Concentration of Drug in the Plasma at Any Time\"; 09.28 lecture"},{"id":"m7-c14","stem":"A patient on an IV dose is to be sent home on an oral dose of the same drug that gives the same AUC. What does the absolute bioavailability equation reduce to?","options":[{"t":"F = {{frac:DIV|Dpo}}","correct":true,"why":"An equivalent regimen means the same extent of exposure, which is the same AUC (area under the curve) by either route. With AUCpo = AUCIV the first bracket of Fabs is 1 and only the dose ratio is left, which rearranges to Dpo = DIV over F."},{"t":"F = {{frac:Dpo|DIV}}","correct":false,"why":"This inverts the dose ratio. The oral dose is larger, so Dpo over DIV would be greater than 1, which an absolute F cannot be. The IV dose stays on top, and dividing it by F is what makes the oral dose larger."},{"t":"F = {{frac:AUCpo|AUCIV}}","correct":false,"why":"Picking this puts the equality on the wrong bracket. Fabs = ({{frac:AUCpo|AUCIV}})({{frac:DIV|Dpo}}). The two regimens are made equivalent by setting the AUCs (areas under the curve) equal, which makes the first bracket 1; the doses are what is being solved for, so they are not equal, and the dose ratio is what remains."},{"t":"F = Cl × AUCIV","correct":false,"why":"Picking this takes the IV dose for F. Cl × AUCIV is DIV, since dose = Cl × AUC for an IV dose. Clearance (Cl) links each dose to its area; with the AUCs (areas under the curve) set equal it cancels from the ratio, leaving F = {{frac:DIV|Dpo}}."}],"teach":"","cite":"7a---Bioavailability-and-Bioequivalence.pdf, slide \"Absolute Bioavailability\" (equations); transcript 09-30"}],"exp":[{"stem":"The decline of plasma concentration after an intravenous bolus can be written as C<sub>p</sub> = C<sub>p</sub><sup>0</sup>·e<sup>−kt</sup>, as ln C<sub>p</sub> = ln C<sub>p</sub><sup>0</sup> − kt, or as log C<sub>p</sub> = log C<sub>p</sub><sup>0</sup> − kt/2.3. Which of the three forms is the preferred one in this course, the other two being equally valid?","opts":["The natural-logarithm form","The base-ten logarithm form","The exponential form","Whichever form the plotted axis uses"]},{"stem":"The first-order absorption rate constant k<sub>a</sub> of an oral tablet accounts for which processes?","opts":["Disintegration, dissolution, membrane crossing and first pass","Glomerular filtration, tubular secretion and tubular reabsorption","Distribution into the tissues","Protein binding in the plasma"]},{"stem":"In C<sub>max</sub><sup>∞</sup> = <span class=\"frac\"><span class=\"fn\">C<sub>0</sub></span><span class=\"fd\">1 − e<sup>−kτ</sup></span></span>, what does the factor <span class=\"frac\"><span class=\"fn\">1</span><span class=\"fd\">1 − e<sup>−kτ</sup></span></span> account for?","opts":["The drug accumulated in the body at steady state","The fraction of the dose absorbed","The fraction of each dose eliminated","The conversion from amount to concentration"]},{"stem":"C<sub>avg</sub><sup>∞</sup> = <span class=\"frac\"><span class=\"fn\">FD<sub>0</sub></span><span class=\"fd\">V<sub>D</sub> kτ</span></span> is used for a drug given by repeated IV bolus. What value does F take?","opts":["1","0","The accumulation factor","e<sup>−kτ</sup>"]},{"stem":"A drug is given as a series of 2-hour intravenous (IV) infusions. Which equation gives the plasma concentration at the end of one infusion?","opts":["C<sub>p</sub> = <span class=\"frac\"><span class=\"fn\">R</span><span class=\"fd\">V<sub>D</sub> k</span></span> × (1 − e<sup>−kt</sup>)","C<sub>p</sub> = C<sub>0</sub>e<sup>−kt</sup>","C<sub>max</sub><sup>∞</sup> = <span class=\"frac\"><span class=\"fn\">C<sub>0</sub></span><span class=\"fd\">1 − e<sup>−kτ</sup></span></span>","C<sub>ss</sub> = R/Cl"]},{"stem":"C<sub>max</sub><sup>∞</sup> = <span class=\"frac\"><span class=\"fn\">FD<sub>0</sub></span><span class=\"fd\">V<sub>D</sub></span></span> × <span class=\"frac\"><span class=\"fn\">1</span><span class=\"fd\">1 − e<sup>−kτ</sup></span></span> × e<sup>−k·t<sub>max</sub>∞</sup>. What marks this as the steady-state peak for an oral dose rather than for a repeated intravenous (IV) bolus?","opts":["The F and the t<sub>max</sub>","The τ","The accumulation factor <span class=\"frac\"><span class=\"fn\">1</span><span class=\"fd\">1 − e<sup>−kτ</sup></span></span>","The V<sub>D</sub>"]},{"stem":"The equation for the plasma concentration after n oral doses has the same prefactor <span class=\"frac\"><span class=\"fn\">F k<sub>a</sub> D<sub>0</sub></span><span class=\"fd\">V<sub>D</sub>(k<sub>a</sub> − k)</span></span> as the single-dose equation. What is new in it?","opts":["The dose number n and the dosing interval τ","F and V<sub>D</sub>","A new rate constant for accumulation","t<sub>max</sub> in place of t"]},{"stem":"A patient on an IV dose is to be sent home on an oral dose of the same drug that gives the same AUC. What does the absolute bioavailability equation reduce to?","opts":["F = <span class=\"frac\"><span class=\"fn\">D<sub>IV</sub></span><span class=\"fd\">D<sub>po</sub></span></span>","F = <span class=\"frac\"><span class=\"fn\">D<sub>po</sub></span><span class=\"fd\">D<sub>IV</sub></span></span>","F = <span class=\"frac\"><span class=\"fn\">AUC<sub>po</sub></span><span class=\"fd\">AUC<sub>IV</sub></span></span>","F = Cl × AUC<sub>IV</sub>"]}],"num":{"id":"m1-ord-n03","type":"numeric","stem":"A drug solution decomposes by a first-order process with a rate constant of 0.0866 hr⁻¹. How much time is required for exactly half the solution to decompose?","answer":8,"tol":0.2,"units":"hr","steps":[{"k":"setup","t":"t½ = {{frac:0.693|k}} for a first-order process.","why":"Setting the concentration to half its starting value in ln C = ln C0 − kt leaves ln 2, which is 0.693, divided by the rate constant. The starting concentration cancels, so a first-order half-life does not depend on it. This relation is not printed on the exam equation sheet."},{"k":"algebra","t":"t½ = {{frac:0.693|0.0866}} hr⁻¹ = 8.002 hr.","why":"Dividing a pure number by a quantity in reciprocal hours gives hours, which is the unit a half-life must have. The rate constant sits in the denominator because a faster process has a shorter half-life, so the two quantities move in opposite directions."},{"k":"round","t":"t½ = 8 hr.","why":"Dr. Mosley reports this as 8 hours, to the whole hour. The answer is a time and carries no reciprocal unit; hours to the minus one belongs to the rate constant that was given, not to the half-life that was asked for."}],"teach":"Introduction.pdf, slide 19.","cite":"IntroductionandMathReviewSolutions.pdf, problem 1c; Introduction.pdf slide 19"},"nexp":["t½ = <span class=\"frac\"><span class=\"fn\">0.693</span><span class=\"fd\">k</span></span> for a first-order process.","t½ = <span class=\"frac\"><span class=\"fn\">0.693</span><span class=\"fd\">0.0866</span></span> hr⁻¹ = 8.002 hr.","t½ = 8 hr."]};

const FRAC_RE = /\{\{frac:([^|}]*)\|([^}]*)\}\}/g;
const qfile = (qs, num) => '/* questions copied from Basic-Pharmacokinetics (ac2eb73) for the formulas-in-text test */\n' +
  qs.concat(num ? [num] : []).map(q => `QUESTIONS.push(Object.assign({prof:COURSE.professors[0], tier:'new', topic:TOPICS[0].id,
  sub:TOPICS[0].subs[0].id, skill:COURSE.skills[0].id, source:'slide', tags:[]}, ${JSON.stringify(Object.assign({}, q, {id: 'fxf-' + q.id, concept: 'fxf-' + q.id}))}));`).join('\n') +
  `\nQUESTIONS.push({id:'fxf-match', type:'match', prof:COURSE.professors[0], tier:'new', topic:TOPICS[0].id, sub:TOPICS[0].subs[0].id,
  concept:'fxf-match', skill:COURSE.skills[0].id, source:'slide', tags:[], stem:'Match each quantity to its line.', left:'Quantity', right:'Line',
  pairs:[{l:'First-order half-life', r:'t1/2 = {{frac:0.693|k}}', why:'First order only, where the rate of loss is proportional to the amount of drug remaining.'},
         {l:'Clearance', r:'Cl = k x VD', why:'First-order elimination, where the rate of loss is proportional to the amount of drug remaining.'}],
  teach:'Two lines of the equation sheet.', cite:'Test (' + COURSE.lectures[0].deck + ') slide 1'});\n`;

(async () => {
  console.log('\n=== the course\'s own {{frac:...}} marks ===');
  const X = L.engine('({QUESTIONS})');
  let marks = 0;
  const torn = [];
  for(const q of X.QUESTIONS){
    const parts = Array.isArray(q.teach) ? q.teach.flatMap(p => [p && p.t, p && p.h]) : [q.teach];
    const strs = [q.stem, q.note].concat(parts, (q.options || []).flatMap(o => [o.t, o.why]),
      (q.steps || []).flatMap(st => [st.t, st.why]), (q.pairs || []).flatMap(pr => [pr.l, pr.r, pr.why]));
    for(const t of strs){
      if(!t) continue;
      const s = String(t), open = (s.match(/\{\{frac:/g) || []).length, good = (s.match(FRAC_RE) || []).length;
      marks += open;
      if(open !== good || (s.match(/\{\{/g) || []).length !== (s.match(/\}\}/g) || []).length) torn.push(q.id);
    }
  }
  if(marks || torn.length) check(!torn.length, `every {{frac:...}} in the bank is well formed and every {{ closes (${marks} marks in ${X.QUESTIONS.length} questions)`, [...new Set(torn)].slice(0, 8).join(', '));
  else L.skip('the bank\'s own fractions', `the bank's ${X.QUESTIONS.length} questions carry no {{frac:...}}`);

  console.log('\n=== drawn as Basic-Pharmacokinetics draws it (scratch copy) ===');
  if(!FIX) L.notRun(NAME, 'the fixture is missing from this test');
  const s = L.scratchBuild('formulas', {files: {'q97_formulas_test.js': qfile(FIX.qs, FIX.num)},
    courseLine: L.featureOn(__dirname, {symbols: PK_SYMBOLS, rates: PK_RATES, halfLife: true, times: true, minus: true, powers: true}),
    edit: src => {
      const f = path.join(src, 'reference.js'), t = fs.readFileSync(f, 'utf8'), head = 'const REFERENCE_HTML = `\n';
      if(t.startsWith(head)) fs.writeFileSync(f, head + '<p id="fxRefProbe">C = {{frac:C<sub>0</sub>|2}}</p>\n' + t.slice(head.length));
    }});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the module on does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, s.page);
    const norm = h => page.evaluate(h => { const d = document.createElement('div'); d.innerHTML = h; return d.innerHTML; }, h);
    const inner = sel => page.evaluate(sel => [...document.querySelectorAll(sel)].map(e => e.innerHTML), sel);
    let stems = 0, opts = 0, raw = [];
    for(let i = 0; i < FIX.qs.length; i++){
      const q = FIX.qs[i], e = FIX.exp[i];
      await L.quizOn(page, 'fxf-' + q.id);
      const st = (await inner('#v-quiz .stem'))[0], want = await norm(e.stem);
      if(st === want) stems++; else check(false, `${q.id}: the stem is drawn as Basic-Pharmacokinetics draws it`, {got: st.slice(0, 160), want: want.slice(0, 160)});
      // the options as shown, mapped back to the question's own order
      const shown = await page.evaluate(() => Q.order.map(oi => ({oi, h: document.querySelectorAll('#v-quiz .opt > span:last-child')[Q.order.indexOf(oi)].innerHTML})));
      for(const {oi, h} of shown){ if(h === await norm(e.opts[oi])) opts++; else check(false, `${q.id}: option ${oi + 1} as Basic-Pharmacokinetics draws it`, {got: h, want: e.opts[oi]}); }
      await page.click('#v-quiz .opt');
      const left = await page.evaluate(() => document.getElementById('v-quiz').textContent.includes('{{frac:'));
      if(left) raw.push(q.id);
    }
    const nOpts = FIX.qs.reduce((n, q) => n + q.options.length, 0);
    check(stems === FIX.qs.length, `all ${FIX.qs.length} stems drawn as Basic-Pharmacokinetics' own formatter draws them`, `${stems} of ${FIX.qs.length}`);
    check(opts === nOpts, `all ${nOpts} options drawn the same way`, `${opts} of ${nOpts}`);
    check(!raw.length, 'no {{frac: left on screen after an answer, the explanations included', raw.join(', '));

    await L.quizOn(page, 'fxf-' + FIX.num.id);
    await page.fill('#numIn', String(FIX.num.answer)); await page.click('#btnCheck');
    const steps = await inner('#v-quiz .steps code');
    const wantSteps = [];
    for(const h of FIX.nexp) wantSteps.push(await norm(h));
    check(JSON.stringify(steps) === JSON.stringify(wantSteps), `the ${FIX.nexp.length} worked steps of ${FIX.num.id} drawn the same way`,
          {got: steps.map(x => x.slice(0, 80)), want: wantSteps.map(x => x.slice(0, 80))});

    const api = await page.evaluate(([C, Lv]) => { const A = FX.api('formulas-in-text');
      return {conv: C.filter(([a, w]) => A.prettyMath(a) !== w).map(c => c[0]), leave: Lv.filter(a => A.prettyMath(a) !== a)}; }, [CONVERT, LEAVE]);
    check(!api.conv.length, `the control: ${CONVERT.length} typed formulas set as the slides print them`, api.conv.join(' | '));
    check(!api.leave.length, `the control: ${LEAVE.length} runs of ordinary text left as they are`, api.leave.join(' | '));

    // a question with none of the marks, from the course's own bank
    const plainQ = await page.evaluate(() => {
      const M = /\{\{frac:|\^|t1\/2| x | - |\(-/;
      const q = QUESTIONS.find(q => !q.type && !q.id.startsWith('fxf-') && !M.test(q.stem + (q.options || []).map(o => o.t).join(' ')));
      return q && {id: q.id, stem: q.stem, opts: q.options.map(o => o.t)};
    });
    if(plainQ){
      await L.quizOn(page, plainQ.id);
      const got = await page.evaluate(() => ({stem: document.querySelector('#v-quiz .stem').innerHTML,
        opts: Q.order.map(oi => [oi, document.querySelectorAll('#v-quiz .opt > span:last-child')[Q.order.indexOf(oi)].innerHTML])}));
      const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const symHit = PK_SYMBOLS.some(([sym]) => new RegExp('(^|[^A-Za-z])' + sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z0-9])').test(plainQ.stem));
      if(symHit) L.skip('a question with none of the marks', `${plainQ.id} uses a symbol of the test's table`);
      else check(got.stem === esc(plainQ.stem) && got.opts.every(([oi, h]) => h === esc(plainQ.opts[oi])),
                 `a question with none of the marks (${plainQ.id}) is drawn exactly as without the module`, got);
    } else L.skip('a question with none of the marks', 'every question of the bank carries one');

    // matching dropdowns and the reading tab
    await L.quizOn(page, 'fxf-match');
    const optsText = await page.evaluate(() => [...document.querySelectorAll('#v-quiz select option')].map(o => o.textContent));
    check(optsText.includes('t1/2 = (0.693)/(k)') && !optsText.some(t => t.includes('{{')), 'a matching dropdown shows a ratio as (a)/(b)', optsText.join(' | '));
    await page.click('#nav button[data-v="ref"]');
    const ref = await page.evaluate(() => { const p = document.getElementById('fxRefProbe'); return p ? p.innerHTML : null; });
    if(ref === null) L.skip('a fraction in a reading tab', 'this course\'s reference.js does not start the way the test expects');
    else check(ref === 'C = <span class="frac"><span class="fn">C<sub>0</sub></span><span class="fd">2</span></span>',
               'a fraction in a reading tab\'s HTML stacks, its own <sub> kept', ref);
    check(await page.evaluate(() => getComputedStyle(document.querySelector('#fxRefProbe .frac') || document.body).display) === 'inline-flex',
          'the fraction styles are in the page');
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();
  } finally {
    await browser.close();
    s.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
