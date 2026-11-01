/* equation-drill: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * On the course's own EQUATIONS (Basic-Pharmacokinetics src/test.js section 5d):
 * each has a name, a left side, a typed form, a source, the condition it holds
 * under, its pieces, its symbols and a sheet mark; its pieces build what its typed
 * form keys; no lure is one of its own pieces and there are two or more; a stacked
 * display says what a keyed form says; every keyed form reads as algebra; and each
 * accepts its own answer with and without the left side.
 * The checker's controls (same section): 12 pairs it must keep apart and 14
 * spellings it must join.
 * On a scratch copy with 14 of Basic-Pharmacokinetics' equations added (its
 * src/equations.js at ac2eb73, ids prefixed eqt-), in Chromium (its
 * src/equation_test.py and the algebra rows of src/test.js ported): the algebra rows
 * (other spellings accepted, different equations refused), 28 accept/refuse cases,
 * the tab, each equation's symbols and conditions, the typing drill (right, wrong,
 * the streak, what was read), the building drill (stacked slots, Check disabled until
 * full, right, each slot marked, a clean tray after Next, a chosen box, factors in
 * another order, a division upside down, clearing a slot), the picker, and the
 * chosen set kept through a reload.
 *
 *     node features/equation-drill/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/equation-drill/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

/* 14 of Basic-Pharmacokinetics' equations (src/equations.js, ac2eb73). */
const FIX = [{"id":"thalf-first","module":1,"name":"First-order half-life","must":true,"sheet":"no","lhs":"t&frac12;","tokens":["0.693","/","k"],"disp":"{{frac:0.693|k}}","typed":"t1/2 = 0.693/k","lures":["&times;","2.303","2k"],"symbols":[["k","first-order elimination rate constant, hr⁻¹"],["t&frac12;","half-life, the time for the amount or concentration of drug to fall by one-half; a time and never a reciprocal time"]],"holds":"First order only, where the rate of loss is proportional to the amount of drug remaining. Constant at every concentration, so it does not depend on the dose or on where the concentration started.","derive":["Start from the printed first-order line: ln C = ln C<sub>0</sub> &minus; kt.","At one half-life the level is half the start: C = {{frac:C<sub>0</sub>|2}} when t = t&frac12;.","Put that in: ln {{frac:C<sub>0</sub>|2}} = ln C<sub>0</sub> &minus; kt&frac12;, which leaves ln 2 = kt&frac12;.","ln 2 = 0.693, so t&frac12; = {{frac:0.693|k}} and, turned round, k = {{frac:0.693|t&frac12;}}."],"use":"Any time a stem gives a half-life and the line wants k, or asks for a half-life from k. She said to know it.","cite":"Introduction.pdf slide 19; she names it four times as not on the sheet (08-19, 08-24, 08-26, 09-09)"},{"id":"cl-k-vd","module":2,"name":"Clearance from k and volume of distribution","must":true,"sheet":"no","lhs":"Cl","tokens":["k","&times;","V<sub>D</sub>"],"typed":"Cl = k*VD","also":["ClT = k*VD"],"lures":["/","0.693","C<sub>p</sub>","AUC","D<sub>0</sub>"],"symbols":[["Cl","clearance, L/hr"],["k","first-order elimination rate constant, the fraction of drug removed per hour, hr⁻¹"],["V<sub>D</sub>","apparent volume of distribution, L: the hypothetical volume of body fluid that links the amount of drug in the body to the measured plasma concentration"]],"holds":"First-order elimination, where the rate of loss is proportional to the amount of drug remaining. Clearance is the volume of plasma cleared of drug per unit time, and it stays constant while the elimination rate does not.","derive":["Printed: rate of elimination = Cl &times; C<sub>p</sub>.","First-order elimination is also k times the amount in the body: rate = k &times; D<sub>B</sub>.","Printed: C<sub>p</sub> = {{frac:D<sub>B</sub>|V<sub>D</sub>}}, so D<sub>B</sub> = V<sub>D</sub> &times; C<sub>p</sub> and rate = k &times; V<sub>D</sub> &times; C<sub>p</sub>.","Set the two rates equal and cancel C<sub>p</sub>: Cl = k &times; V<sub>D</sub>."],"use":"When a stem gives clearance and volume and the line wants k, as k = {{frac:Cl|V<sub>D</sub>}}, or gives k and volume and asks for clearance. She said to know it.","cite":"2IVBolusAdministration.pdf, slide \"Clearance\"; she names it as not on the sheet (08-24, and as total clearance in the 19 Oct final review)"},{"id":"crcl","module":4,"name":"Cockcroft-Gault creatinine clearance","must":true,"sheet":"no","lhs":"CrCl","tokens":["(140 &minus; age)","(IBW)","/","(72","&times;","S<sub>Cr</sub>)"],"disp":"{{frac:(140 &minus; age)(IBW)|72 &times; S<sub>Cr</sub>}}","typed":"CrCl = (140-age)(IBW)/(72*SCr)","also":["CrCl = (140-age)(IBW)/(72*SCr)*0.85","CrCl = ((140-age)(IBW)/(72*SCr))*0.85"],"lures":["(140 + age)","age)","0.85"],"symbols":[["age","years"],["IBW","ideal body weight, kg: the weight from the height formula, used in place of the patient&rsquo;s actual weight"],["S<sub>Cr</sub>","serum creatinine, mg/dL"],["CrCl","creatinine clearance, an estimate of the patient&rsquo;s kidney function; reported in mL/min"]],"holds":"Multiply by 0.85 for a female patient. The answer is reported in mL/min even though the units do not cancel algebraically.","derive":["Not printed and not reached from a printed line: she requires it from memory.","Work out the ideal body weight first, from the height and sex.","Put age, IBW and the serum creatinine SCr into the line; the result is in mL/min."],"use":"When a stem gives age, height, sex and serum creatinine and asks for creatinine clearance, or needs it to judge kidney function. The weight is the ideal body weight even when an actual weight is given: &ldquo;we&rsquo;re only gonna use the ideal body weight&rdquo; (19 Oct).","cite":"4---Clearance-and-Elimination.pdf, slides \"Creatinine Clearance/GFR\" and \"Creatinine Clearance\"; \"this one is not there. You need to know this one.\" (09-14)"},{"id":"first-exp","module":1,"name":"First-order decline, exponential form","sheet":"yes","lhs":"C","tokens":["C<sub>0</sub>","e<sup>&minus;kt</sup>"],"typed":"C = C0*e^(-kt)","also":["Cp = Cp0*e^(-kt)","C = C0e^-kt"],"lures":["&minus;","e<sup>+kt</sup>","kt","/","ln"],"symbols":[["C","concentration at time t"],["C<sub>0</sub>","starting concentration, at time zero"],["k","first-order rate constant, the fraction removed per hour, hr⁻¹"],["t","elapsed time, hr"]],"holds":"First-order loss. The rate is proportional to what remains. A curve on linear axes and a straight line on semi-logarithmic axes. On semi-logarithmic axes the concentration axis is a base-10 log scale and the time axis is ordinary.","cite":"Introduction.pdf slide 18; equation sheet page 1"},{"id":"tmax","module":5,"name":"Time to peak concentration","sheet":"yes","lhs":"t<sub>max</sub>","tokens":["ln(k<sub>a</sub>/k)","/","(k<sub>a</sub> &minus; k)"],"disp":"{{frac:ln(k<sub>a</sub>/k)|k<sub>a</sub> &minus; k}}","typed":"tmax = ln(ka/k)/(ka-k)","also":["tmax = (ln(ka/k))/(ka-k)"],"lures":["ln(k/k<sub>a</sub>)","(k &minus; k<sub>a</sub>)","&times;","0.693","D<sub>0</sub>"],"symbols":[["t<sub>max</sub>","the time at which the plasma concentration peaks after an oral dose; a time, hr"],["k<sub>a</sub>, k","the absorption rate constant and the elimination rate constant, both in the same reciprocal time unit"]],"holds":"Single oral dose. It carries no dose and no volume, so tmax depends only on the two rate constants and doubling the dose does not move it. It is always found before Cmax, the peak concentration, which is reached at tmax.","cite":"5---Pharmacokinetics-of-Oral-Absorption.pdf; equation sheet page 1"},{"id":"css","module":3,"name":"Steady-state concentration","sheet":"yes","lhs":"C<sub>ss</sub>","tokens":["R","/","Cl"],"disp":"{{frac:R|Cl}}","typed":"Css = R/Cl","also":["Css = R/(k*VD)","Css = R/kVD"],"lures":["&times;","k","(1 &minus; e<sup>&minus;kt</sup>)"],"symbols":[["C<sub>ss</sub>","steady-state concentration, mg/L"],["R","infusion rate, mg/hr"],["Cl","clearance, the volume of plasma cleared of drug per unit time, L/hr"]],"holds":"At steady state only, where rate in equals rate out. It carries no t, so it says nothing about when steady state arrives.","cite":"3IntravenousInfusions.pdf; equation sheet page 1"},{"id":"ibw-female","module":4,"name":"Ideal body weight, female","must":true,"sheet":"no","lhs":"IBW<sub>female</sub>","tokens":["45.5","+","2.3","&times;","(inches over 5 ft)"],"typed":"IBWfemale = 45.5 + 2.3*(inches over 5 ft)","also":["IBW = 45.5 + 2.3*(height in inches - 60)","IBWfemale = 45.5 + 2.3(inches over 5 ft)"],"lures":["50","&minus;","2.54","60","0.85"],"symbols":[["IBW","ideal body weight, kg: the weight used in the creatinine clearance (Cockcroft-Gault) calculation in place of the patient&rsquo;s actual weight"],["inches over 5 ft","height in inches minus 60"]],"holds":"The male form, IBW = 50 + 2.3 &times; (inches over 5 ft), with a different constant. 45.5 is the only difference.","derive":["Not printed and not derivable: from memory.","Turn the height into inches over 5 ft, as for a man.","IBW = 45.5 kg plus 2.3 kg for each inch over 5 ft."],"use":"For a woman, inside the Cockcroft-Gault line; the actual body weight is not used there.","cite":"4---Clearance-and-Elimination.pdf, slide \"Creatinine Clearance\""},{"id":"ibw-male","module":4,"name":"Ideal body weight, male","must":true,"sheet":"no","lhs":"IBW<sub>male</sub>","tokens":["50","+","2.3","&times;","(inches over 5 ft)"],"typed":"IBWmale = 50 + 2.3*(inches over 5 ft)","also":["IBW = 50 + 2.3*(height in inches - 60)","IBWmale = 50 + 2.3(inches over 5 ft)"],"lures":["45.5","&minus;","2.54","60","/"],"symbols":[["IBW","ideal body weight, kg: the weight used in the creatinine clearance (Cockcroft-Gault) calculation in place of the patient&rsquo;s actual weight"],["inches over 5 ft","height in inches minus 60"]],"holds":"Every patient in this course is 5 ft or taller, and ideal body weight is always the weight used in the creatinine clearance calculation, never the actual weight.","derive":["Not printed and not derivable: from memory.","Turn the height into inches over 5 ft: 5 ft is 60 inches, so take 60 from the height in inches (1 inch = 2.54 cm).","IBW = 50 kg plus 2.3 kg for each inch over 5 ft."],"use":"For a man, inside the Cockcroft-Gault line; the actual body weight is not used there.","cite":"4---Clearance-and-Elimination.pdf, slide \"Creatinine Clearance\"; \"again, you need to know this one.\" (09-14); \"we're only gonna use the ideal body weight\" (19 Oct)"},{"id":"clh","module":4,"name":"Hepatic clearance from the fraction","sheet":"yes","lhs":"Cl<sub>H</sub>","tokens":["(1 &minus; f<sub>e</sub>)","&times;","Cl<sub>T</sub>"],"typed":"ClH = (1-fe)*ClT","also":["ClH = ClT - ClR","ClH = (1-fe)ClT"],"lures":["f<sub>e</sub>","+","Cl<sub>R</sub>","/"],"symbols":[["Cl<sub>H</sub>","hepatic clearance, the volume of plasma cleared of drug per unit time by the liver, L/hr"],["f<sub>e</sub>","fraction of the dose excreted unchanged in urine, no units"],["Cl<sub>T</sub>","total body clearance, by every route, L/hr"]],"holds":"The remainder after the renal share. Equivalently total clearance minus renal clearance; the two forms are one statement.","cite":"4---Clearance-and-Elimination.pdf; equation sheet"},{"id":"fe-k","module":4,"name":"Excretion rate constant from the fraction","sheet":"yes","lhs":"k<sub>e</sub>","tokens":["f<sub>e</sub>","&times;","k"],"typed":"ke = fe*k","also":["ke = fek"],"lures":["/","k<sub>m</sub>","Cl<sub>T</sub>","D<sub>u</sub>"],"symbols":[["k<sub>e</sub>","excretion rate constant, for the drug leaving unchanged in urine, hr⁻¹"],["f<sub>e</sub>","fraction of the dose excreted unchanged in urine, no units"],["k","overall elimination rate constant, all routes together, hr⁻¹"]],"holds":"The same fraction that splits the dose splits the rate constant, since fe is also ke over k.","cite":"4---Clearance-and-Elimination.pdf; equation sheet"},{"id":"cmax-ss","module":6,"name":"Maximum concentration at steady state, IV bolus","sheet":"yes","lhs":"C<sub>max</sub><sup>&infin;</sup>","tokens":["C<sub>0</sub>","/","(1 &minus; e<sup>&minus;k&tau;</sup>)"],"disp":"{{frac:C<sub>0</sub>|1 &minus; e<sup>&minus;k&tau;</sup>}}","typed":"Cmax,ss = C0/(1 - e^(-k*tau))","also":["Cmax^inf = C0/(1 - e^(-k*tau))","Cmax∞ = C0/(1 - e^(-kτ))","Cmax,ss = (D0/VD)/(1 - e^(-k*tau))"],"lures":["C<sub>0</sub>e<sup>&minus;k&tau;</sup>","(1 + e<sup>&minus;k&tau;</sup>)","&times;"],"symbols":[["C<sub>max</sub><sup>&infin;</sup>","the peak concentration in a dosing interval at steady state, just after a dose, mg/L"],["C<sub>0</sub>","the first-dose peak: the dose D<sub>0</sub> divided by the volume of distribution V<sub>D</sub>, mg/L"],["k","first-order elimination rate constant, hr⁻¹"],["&tau;","dosing interval, hr"],["&infin;","at steady state"]],"holds":"Repeated IV bolus at steady state, the plateau reached when each dose adds back what was lost over the interval. The first-dose peak divided by (1 &minus; e<sup>&minus;k&tau;</sup>), so it is always higher than C<sub>0</sub>.","cite":"6---Repetitive-IV-Bolus-and-Intermittent-IV-Infusions.pdf, slide \"Concentration of Drug in the Body at Steady-State Following Repeated IV Bolus Injections\""},{"id":"cavg-ss","module":6,"name":"Average concentration at steady state, IV or oral","sheet":"yes","lhs":"C<sub>avg</sub><sup>&infin;</sup>","tokens":["FD<sub>0</sub>","/","Cl<sub>T</sub>&tau;"],"disp":"{{frac:FD<sub>0</sub>|Cl<sub>T</sub>&tau;}}","typed":"Cavg,ss = F*D0/(ClT*tau)","also":["Cavg^inf = F*D0/(ClT*tau)","Cavg∞ = FD0/(ClTτ)","Cavg,ss = F*D0/(VD*k*tau)"],"lures":["k&tau;","2","(1 &minus; e<sup>&minus;k&tau;</sup>)"],"symbols":[["C<sub>avg</sub><sup>&infin;</sup>","the time-averaged concentration over one dosing interval at steady state, mg/L"],["F","bioavailability, the fraction of the dose reaching the circulation; 1 for an IV dose"],["D<sub>0</sub>","dose, mg"],["Cl<sub>T</sub>","total body clearance, the volume of plasma cleared of drug per unit time, equal to the volume of distribution V<sub>D</sub> times the elimination rate constant k, L/hr"],["&tau;","dosing interval, hr"],["&infin;","at steady state"]],"holds":"Steady state, the plateau reached when each dose adds back what was lost over the interval, IV or oral. The same as {{frac:FD<sub>0</sub>|V<sub>D</sub>k&tau;}}. Not the midpoint of the steady-state peak C<sub>max</sub> and trough C<sub>min</sub>.","cite":"6---Repetitive-IV-Bolus-and-Intermittent-IV-Infusions.pdf, slide \"Concentration of Drug in the Body at Steady-State Following Repeated IV Bolus Injections\""},{"id":"oral-cp","module":5,"name":"Concentration after a single oral dose","sheet":"yes","lhs":"C<sub>p</sub>","tokens":["[Fk<sub>a</sub>D<sub>0</sub>","/","V<sub>D</sub>(k<sub>a</sub> &minus; k)]","&times;","(e<sup>&minus;kt</sup> &minus; e<sup>&minus;k<sub>a</sub>t</sup>)"],"disp":"{{frac:Fk<sub>a</sub>D<sub>0</sub>|V<sub>D</sub>(k<sub>a</sub> &minus; k)}} (e<sup>&minus;kt</sup> &minus; e<sup>&minus;k<sub>a</sub>t</sup>)","typed":"Cp = [F*ka*D0/(VD(ka-k))]*(e^(-kt) - e^(-ka*t))","also":["Cp = (F*ka*D0/(VD*(ka-k)))*(e^(-kt)-e^(-ka*t))","Cp = [F*ka*D0/VD(ka-k)]*(e^(-kt) - e^(-ka*t))"],"lures":["(e<sup>&minus;k<sub>a</sub>t</sup> &minus; e<sup>&minus;kt</sup>)","(k &minus; k<sub>a</sub>)","+","V<sub>D</sub>"],"symbols":[["F","oral bioavailability fraction, no units"],["k<sub>a</sub>","absorption rate constant, hr⁻¹"],["k","elimination rate constant, hr⁻¹"],["D<sub>0</sub>","oral dose, mg"],["V<sub>D</sub>","apparent volume of distribution, L"],["C<sub>p</sub>","plasma concentration at time t, mg/L"],["t","time since the dose, hr"]],"holds":"Single oral dose, one compartment (the body treated as one uniform volume), first order in and first order out (each rate proportional to the amount still to move). The bracket is drug in minus drug out. The lumped prefactor, the fraction in front of the bracket, is not C<sub>0</sub>, the time-zero concentration of an IV bolus.","cite":"5---Pharmacokinetics-of-Oral-Absorption.pdf; equation sheet page 1"},{"id":"cp-n","module":6,"name":"Concentration at any time after n doses, IV bolus","sheet":"yes","lhs":"C<sub>p</sub>","tokens":["(D<sub>0</sub>/V<sub>D</sub>)","&times;","(1 &minus; e<sup>&minus;nk&tau;</sup>)","/","(1 &minus; e<sup>&minus;k&tau;</sup>)","&times;","e<sup>&minus;kt</sup>"],"disp":"{{frac:D<sub>0</sub>|V<sub>D</sub>}} ({{frac:1 &minus; e<sup>&minus;nk&tau;</sup>|1 &minus; e<sup>&minus;k&tau;</sup>}}) e<sup>&minus;kt</sup>","typed":"Cp = (D0/VD)*((1 - e^(-n*k*tau))/(1 - e^(-k*tau)))*e^(-kt)","also":["Cp = D0/VD*(1-e^(-nkτ))/(1-e^(-kτ))*e^(-kt)"],"lures":["(1 &minus; e<sup>&minus;nkt</sup>)","e<sup>&minus;k&tau;</sup>","(1 + e<sup>&minus;k&tau;</sup>)"],"symbols":[["C<sub>p</sub>","plasma concentration, mg/L"],["D<sub>0</sub>","the dose given each time, mg"],["V<sub>D</sub>","apparent volume of distribution, L"],["k","first-order elimination rate constant, hr⁻¹"],["n","how many doses have been given, counting the one just given"],["t","time since that dose, hr"],["&tau;","dosing interval, hr"]],"holds":"Repeated IV bolus (the whole dose into a vein at once, every &tau; hours) before steady state. Steady state is the plateau reached when each dose adds back what was lost over the interval. As n grows, e<sup>&minus;nk&tau;</sup> approaches 0 and this becomes the steady-state equation.","cite":"6---Repetitive-IV-Bolus-and-Intermittent-IV-Infusions.pdf, slide \"Plasma Drug Concentration at Any Time After n Doses\""}];
const P = id => 'eqt-' + id;

// Basic-Pharmacokinetics src/test.js lines 598-634: pairs that must stay apart, spellings that must agree
const MUST_DIFFER = [
  ['t1/2 = 0.693/k', 't1/2 = k/0.693'], ['C = C0*e^(-kt)', 'C = C0*e^(kt)'], ['Css = R/Cl', 'Css = Cl/R'],
  ['tmax = ln(ka/k)/(ka-k)', 'tmax = ln(k/ka)/(ka-k)'], ['ClH = (1-fe)*ClT', 'ClH = fe*ClT'], ['DL = R/k', 'DL = R*k'],
  ['t1/2 = C0/2k', 't1/2 = 2*C0/k'], ['IBW = 45.5 + 2.3*(h-60)', 'IBW = 50 + 2.3*(h-60)'],
  ['CrCl = (140-age)(IBW)/(72*SCr)', 'CrCl = (140-age)(IBW)/72*SCr'], ['Css = R/(k*VD)', 'Css = R/k*VD'],
  ['Cmin = C0*e^(-k*tau)/(1-e^(-k*tau))', 'Cmin = C0/(1-e^(-k*tau))'],
  ['Cp = D0/VD*(1-e^(-n*k*tau))/(1-e^(-k*tau))*e^(-kt)', 'Cp = D0/VD*(1-e^(-n*k*t))/(1-e^(-k*tau))*e^(-kt)']];
const MUST_AGREE = [
  ['t1/2 = 0.693/k', 'T½ = 0.693 ÷ K', 't 1/2=.693/k', 'thalf = 0.693/k'],
  ['Cl = k*VD', 'Cl = kVD', 'CL = K × V_D', 'cl=k·vd'],
  ['C = C0*e^(-kt)', 'C = C0e^-kt', 'c = c0*e**(−kt)'],
  ['Cmax = C0/(1-e^(-k*tau))', 'Cmax = C0/(1 - e^(-kτ))', 'cmax=c0/(1-e^-k tau)']];
// src/test.js lines 636-660: [equation id, the same equation spelled otherwise, different equations]
const ALGEBRA = [
  ['cl-k-vd', ['Cl = VD*k', 'Cl = VDk', 'CL = k x VD', 'clearance = k*VD', 'ClT = VD k'], ['Cl = k/VD', 'Cl = VD/k', 'Cl = k+VD']],
  ['thalf-first', ['t1/2 = ln2/k', 'half-life = 0.693/k', 't1/2 = ln(2)/k', 't1/2 = 0.69/k'], ['t1/2 = k/0.693', 't1/2 = 0.693k', 't1/2 = 0.5/k']],
  ['crcl', ['CrCl = (140-age)*IBW/(72*SCr)', 'CrCl = (140-age)(IBW)/72(SCr)', 'CrCl = [(140-age)(IBW)]/(72)(SCr)',
            'CrCl = IBW(140-age)/(72 SCr)', 'CrCl = (140 - age) x IBW / (72 x SCr)'],
           ['CrCl = (140-age)(IBW)/72*SCr', 'CrCl = (140+age)(IBW)/(72*SCr)', 'CrCl = (140-age)/(72*SCr*IBW)']],
  ['ibw-male', ['IBW = 50 + 2.3(h-60)', 'IBW = 50 + 2.3*(inches over 60)', 'IBW = 50 + 2.3 x (height in inches - 60)', 'IBW = 2.3(in-60) + 50'],
               ['IBW = 45.5 + 2.3(h-60)', 'IBW = 50 - 2.3(h-60)', 'IBW = 50 + 2.3h - 60']],
  ['cmax-ss', ['Cmax = C0/(1-e^(-k*tau))', 'Cmax = (D0/VD)/(1-e^-ktau)', 'Cmax = C0/(1-e^-kT)', 'Cmax = C0 (1-e^-ktau)^-1'],
              ['Cmax = C0(1-e^-ktau)', 'Cmax = C0/(1-e^ktau)', 'Cmax = C0/(1+e^-ktau)', 'Cmax = C0e^-ktau/(1-e^-ktau)', 'Cmax = C0/(1-e^-kt)']],
  ['cavg-ss', ['Cavg = FD0/(VD k tau)', 'Cavg = F D0 / Cl tau', 'Cavg = FD0/(ClT*tau)', 'Cavg = D0F/(kVDtau)'],
              ['Cavg = FD0/(VD tau)', 'Cavg = FD0 k/tau', 'Cavg = (Cmax+Cmin)/2', 'Cavg = D0/(Cl*tau)']],
  ['tmax', ['tmax = ln(ka/k)/(ka-k)', 'tmax = 2.3 log(ka/k)/(ka-k)', 'tmax = (ln ka - ln k)/(ka-k)'],
           ['tmax = ln(k/ka)/(ka-k)', 'tmax = ln(ka/k)/ka-k', 'tmax = ln(ka/k)/(k-ka)']],
  ['oral-cp', ['Cp = FkaD0/(VD(ka-k)) (e^-kt - e^-kat)', 'Cp = (F ka D0)/(Vd(ka-k)) (e^(-kt) - e^(-kat))', 'Cp = F*ka*D0*(e^(-kt)-e^(-ka*t))/(VD*(ka-k))'],
              ['Cp = FkaD0/(VD(ka-k)) (e^-kat - e^-kt)', 'Cp = FkaD0/(VD(k-ka)) (e^-kt - e^-kat)', 'Cp = FkaD0/(VD(ka-k)) (e^-kt + e^-kat)']],
  ['cp-n', ['Cp = D0/VD * (1-e^-nktau)/(1-e^-ktau) * e^-kt', 'Cp = (D0/VD)[(1-e^(-nkτ))/(1-e^(-kτ))]e^(-kt)'],
           ['Cp = D0/VD * (1-e^-ktau)/(1-e^-nktau) * e^-kt', 'Cp = D0/VD * (1-e^-nkt)/(1-e^-ktau) * e^-kt']],
  ['css', ['Css = R/Cl', 'Css = R/(k*VD)', 'Css = R/kVD', 'Css = R/(VD k)'], ['Css = R/k*VD', 'Css = Cl/R', 'Css = R k/VD']]];
// src/equation_test.py lines 31-60: (equation id, typed, accepted?)
const CASES = [
  ['thalf-first', '0.693/k', true], ['thalf-first', '0.693 / K', true], ['thalf-first', 't1/2 = 0.693/k', true],
  ['thalf-first', '.693/k', true], ['thalf-first', 'k/0.693', false], ['thalf-first', '0.693k', false],
  ['cl-k-vd', 'k*VD', true], ['cl-k-vd', 'kvd', true], ['cl-k-vd', 'K × Vd', true], ['cl-k-vd', 'k/VD', false],
  ['crcl', '(140-age)(IBW)/(72*SCr)', true], ['crcl', '(140 − age)(IBW) / (72 × Scr)', true], ['crcl', '(140+age)(IBW)/(72*SCr)', false],
  ['first-exp', 'C0*e^(-kt)', true], ['first-exp', 'c0e^-kt', true], ['first-exp', 'C0e**(-kt)', true], ['first-exp', 'C0*e^(kt)', false],
  ['tmax', 'ln(ka/k)/(ka-k)', true], ['tmax', 'LN(Ka/K)/(Ka–K)', true], ['tmax', 'ln(k/ka)/(ka-k)', false],
  ['css', 'R/Cl', true], ['css', 'R/(k*VD)', true], ['css', 'Cl/R', false],
  ['ibw-female', '45.5 + 2.3*(inches over 5 ft)', true], ['ibw-female', '50 + 2.3*(inches over 5 ft)', false],
  ['clh', '(1-fe)*ClT', true], ['clh', 'ClT - ClR', true], ['clh', 'fe*ClT', false]];

/* src/test.js lines 554-590, on any list of equations, with the page's own functions */
function sheetChecks(A, E, mathHTML){
  const bad = [];
  if(new Set(E.map(e => e.id)).size !== E.length) bad.push('two equations share an id');
  for(const e of E){
    for(const f of ['name', 'lhs', 'typed', 'cite', 'holds']) if(!e[f]) bad.push(`${e.id} has no ${f}`);
    if(!Array.isArray(e.tokens) || !e.tokens.length){ bad.push(`${e.id} has no pieces`); continue; }
    if(!Array.isArray(e.symbols) || !e.symbols.length) bad.push(`${e.id} names no symbols`);
    if(!['yes', 'no', 'absent'].includes(e.sheet)) bad.push(`${e.id} has sheet "${e.sheet}"`);
    const built = A.eqPlain(e.lhs) + ' = ' + A.eqPlain(e.tokens.join(' '));
    if(!A.eqCorrect(e, built)) bad.push(`${e.id}: its pieces build ${A.normEq(built)}, which its typed form does not accept`);
    const own = new Set(e.tokens.map(t => A.normEq(A.eqPlain(t))));
    for(const l of (e.lures || [])) if(own.has(A.normEq(A.eqPlain(l)))) bad.push(`${e.id}: the lure ${A.eqPlain(l)} is one of its own pieces`);
    if((e.lures || []).length < 2) bad.push(`${e.id} offers fewer than two wrong pieces`);
    if(e.disp){
      const blind = t => A.normEq(A.eqPlain(t)).replace(/[()]/g, '');
      const shown = blind(A.eqPlain(e.lhs) + '=' + e.disp);
      if(![e.typed, ...(e.also || [])].some(f => blind(f) === shown)) bad.push(`${e.id}: its stacked display reads ${shown}, which no keyed form says`);
      if(!mathHTML(e.disp).includes('frac') && e.disp.includes('{{')) bad.push(`${e.id}: a fraction in its display does not render`);
    }
    if([e.typed, ...(e.also || [])].some(f => !A.eqTokens(f.split('=').slice(1).join('=')))) bad.push(`${e.id}: a keyed form does not read as algebra`);
    if(!A.eqCorrect(e, e.typed) || !A.eqCorrect(e, e.typed.split('=').slice(1).join('='))) bad.push(`${e.id} rejects its own keyed answer`);
  }
  return bad;
}

(async () => {
  console.log('\n=== the course\'s own equations ===');
  L.PAGE.need(NAME);
  const X = L.engine('({EQUATIONS: typeof EQUATIONS === "undefined" ? null : EQUATIONS, FX})');
  const A = X.FX && X.FX.api('equation-drill'), F = X.FX && X.FX.api('formulas-in-text');
  if(!check(!!(A && F), 'the page carries equation-drill and formulas-in-text, working', JSON.stringify((X.FX && X.FX.errors) || []))) L.finish(NAME);
  const own = X.EQUATIONS || [];
  const bad = sheetChecks(A, own, F.mathHTML);
  check(!bad.length, `${own.length} equations: complete, their pieces build their keyed form, lures are not pieces, displays agree, keyed forms read as algebra and are accepted`, bad.slice(0, 4).join('; '));
  const differ = MUST_DIFFER.filter(([a, b]) => A.normEq(a) === A.normEq(b));
  check(!differ.length, `the checker keeps ${MUST_DIFFER.length} pairs apart`, differ.map(p => p.join(' / ')).join('; '));
  const split = MUST_AGREE.filter(forms => new Set(forms.map(f => A.normEq(f))).size !== 1);
  check(!split.length, `the checker joins ${MUST_AGREE.reduce((n, f) => n + f.length, 0)} spellings of 4 equations`, split.map(f => f.join(' | ')).join('; '));

  console.log('\n=== on a scratch copy with Basic-Pharmacokinetics\' equations (Chromium) ===');
  const fix = FIX.map(e => Object.assign({}, e, {id: P(e.id)}));
  const s = L.scratchBuild('equations', {files: {'eq_test_fixture.js': '/* 14 of Basic-Pharmacokinetics\' equations (ac2eb73), added by the equation-drill test */\n' +
      (X.EQUATIONS ? `EQUATIONS.push(...${JSON.stringify(fix)});` : `const EQUATIONS = ${JSON.stringify(fix)};`) + '\n'},
    courseLine: "COURSE.files = (COURSE.files || ['atlas.js', 'diagrams.js', 'q1_topics.js']).concat(['eq_test_fixture.js']);"});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test equations does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1300}});
    const ev = (f, a) => page.evaluate(f, a);
    const alg = await ev(([rows, pre]) => { const A = FX.api('equation-drill'); let same = 0, diff = 0; const bad = [];
      for(const [id, yes, no] of rows){ const e = A.EQ_BY_ID[pre + id]; if(!e){ bad.push('no ' + id); continue; }
        for(const f of yes){ if(!A.eqCorrect(e, f)) bad.push(`${id} rejects ${f}`); same++; }
        for(const f of no){ if(A.eqCorrect(e, f)) bad.push(`${id} accepts ${f}`); diff++; } }
      return {same, diff, bad}; }, [ALGEBRA, 'eqt-']);
    check(!alg.bad.length, `read as algebra: ${alg.same} other spellings accepted, ${alg.diff} different equations refused`, alg.bad.slice(0, 4).join('; '));
    const wrong = await ev(([cases, pre]) => { const A = FX.api('equation-drill');
      return cases.filter(([id, t, want]) => A.eqCorrect(A.EQ_BY_ID[pre + id], t) !== want).map(c => c.join(' ')); }, [CASES, 'eqt-']);
    check(!wrong.length, `${CASES.length} accept/refuse cases behave`, wrong.join('; '));

    await page.click('#nav button[data-v="eq"]');
    const tab = await ev(() => { const A = FX.api('equation-drill');
      return {text: document.getElementById('v-eq').textContent, chosen: A.eqChosen().length, must: A.EQ_MUST.length,
              boxes: document.querySelectorAll('#v-eq input[data-eq]').length, n: EQUATIONS.length,
              more: document.querySelectorAll('#v-eq details.eqmore').length}; });
    check(/Equations/.test(tab.text) && tab.boxes === tab.n, `the Equations tab lists every equation with a tick box (${tab.boxes} of ${tab.n})`);
    check(tab.chosen === tab.must, 'it opens on the ones marked to memorise', tab);
    const sheet = await ev(id => { const d = document.querySelector(`#v-eq details[data-eqmore="${id}"]`); if(!d) return null;
      d.open = true; return {text: d.textContent, frac: !!d.querySelector('.frac')}; }, P('thalf-first'));
    check(sheet && /What each symbol is/.test(sheet.text) && /first-order elimination rate constant/.test(sheet.text) && /When it holds/.test(sheet.text) && /how to get there/.test(sheet.text),
          'under each equation: what each symbol is, when it holds, how to reach it from a printed line', sheet && sheet.text.slice(0, 160));
    check(sheet && sheet.frac, 'its fractions stack');

    // the typing drill
    await ev(id => { const A = FX.api('equation-drill'); A.eqSetChosen([id]); A.eqStart('type'); }, P('thalf-first'));
    check(await ev(() => document.querySelectorAll('#eqIn').length === 1), 'the typing drill shows an input');
    await page.fill('#eqIn', '0.693 / k'); await page.click('#eqCheck');
    const t1 = await ev(id => ({text: document.getElementById('v-eq').textContent, streak: FX.api('equation-drill').eqStat(id).streak}), P('thalf-first'));
    check(/✓ Correct/.test(t1.text) && t1.streak === 1, 'a correct typed answer is marked right and the streak advances', t1.streak);
    check(/What each symbol is/.test(t1.text), 'the symbols are explained after answering');
    await page.click('#eqNext');
    check(/right of/.test(await ev(() => document.getElementById('v-eq').textContent)), 'one equation, one pass, then the closing card');
    await ev(() => FX.api('equation-drill').eqStart('type'));
    await page.fill('#eqIn', 'k/0.693'); await page.click('#eqCheck');
    const t2 = await ev(id => ({text: document.getElementById('v-eq').textContent, streak: FX.api('equation-drill').eqStat(id).streak}), P('thalf-first'));
    check(/✗ Not correct/.test(t2.text) && /0\.693/.test(t2.text) && /once capitals and spacing are set aside/.test(t2.text) && t2.streak === 0,
          'a wrong typed answer is marked wrong, shows the answer and how it was read, and resets the streak', t2.streak);

    // the building drill
    await ev(id => { const A = FX.api('equation-drill'); A.eqSetChosen([id]); A.eqStart('build'); }, P('css'));
    const b0 = await ev(() => ({slots: document.querySelectorAll('.eqslot').length, tiles: document.querySelectorAll('.eqtile').length,
      frac: document.querySelectorAll('.eqfrac').length, off: document.getElementById('eqCheck').disabled}));
    check(b0.slots === 2 && b0.tiles > b0.slots && b0.frac === 1, `R over Cl is built in two stacked slots from ${b0.tiles} pieces`, b0);
    check(b0.off, 'Check is disabled while a slot is empty');
    const order = await ev(id => { const A = FX.api('equation-drill'), E = A.state();
      return A.EQ_BY_ID[id].tokens.filter(t => !A.EQ_OP(t)).map(w => E.tray.find(t => t.t === w).i); }, P('css'));
    for(const i of order) await page.click(`.eqtile[data-tile="${i}"]`);
    check(await ev(() => !document.getElementById('eqCheck').disabled), 'placing every piece enables Check');
    await page.click('#eqCheck');
    check(await ev(() => /✓ Correct/.test(document.getElementById('v-eq').textContent) && document.querySelectorAll('.eqslot.ok').length === 2),
          'the built equation is marked right, each slot on its own');
    await ev(ids => { const A = FX.api('equation-drill'); A.eqSetChosen(ids); A.eqStart('build'); }, ['css', 'cl-k-vd', 'thalf-first', 'crcl'].map(P));
    for(let k = 0; k < 3; k++){
      await ev(() => { const A = FX.api('equation-drill'), E = A.state();
        while(E.slots.some(x => x === null)){ const t = E.tray.find(x => !Object.values(E.trayOf || {}).includes(x.i)); if(!t) break; A.eqPlace(t.i); } });
      await page.click('#eqCheck'); await page.click('#eqNext');
      const g = await ev(() => { const A = FX.api('equation-drill'), E = A.state(), e = A.EQ_BY_ID[E.queue[E.i]];
        return {grey: document.querySelectorAll('.eqtile[disabled]').length, sel: document.querySelectorAll('.eqslot.sel').length,
                filled: E.slots.filter((x, i) => x !== null && !(E.layout && A.EQ_OP(e.tokens[i]))).length}; });
      check(!g.grey && !g.filled && !g.sel, `after Next ${k + 1}, the tray is clean: nothing greyed, placed or selected`, g);
    }
    await ev(id => { const A = FX.api('equation-drill'); A.eqSetChosen([id]); A.eqStart('build'); }, P('css'));
    await page.locator('.eqslot').nth(1).click();
    check(await ev(() => document.querySelectorAll('.eqslot.sel').length === 1), 'a tapped empty box shows as selected');
    await page.locator('.eqtile:not([disabled])').first().click();
    check(await ev(id => { const A = FX.api('equation-drill'); return A.state().slots[A.EQ_BY_ID[id].tokens.length - 1] !== null && !document.querySelector('.eqslot.sel'); }, P('css')),
          'the next piece goes into the selected box');
    await ev(id => { const A = FX.api('equation-drill'); A.eqSetChosen([id]); A.eqStart('build'); }, P('fe-k'));
    await ev(() => { const A = FX.api('equation-drill');
      for(const w of ['k', '&times;', 'f<sub>e</sub>']){ const E = A.state(); A.eqPlace(E.tray.find(t => t.t === w && !Object.values(E.trayOf || {}).includes(t.i)).i); } });
    await page.click('#eqCheck');
    check(await ev(() => /✓ Correct/.test(document.getElementById('v-eq').textContent) && !document.querySelector('.eqslot.bad')),
          'k × fe is accepted for fe × k, with no box marked wrong');
    await ev(id => { const A = FX.api('equation-drill'); A.eqSetChosen([id]); A.eqStart('build');
      const E = A.state(), e = A.EQ_BY_ID[id];
      e.tokens.filter(t => !A.EQ_OP(t)).reverse().forEach(w => { const i = E.slots.findIndex((x, j) => x === null && !A.EQ_OP(e.tokens[j]));
        A.eqPlace(E.tray.find(t => t.t === w).i, i); }); }, P('thalf-first'));
    await page.click('#eqCheck');
    check(await ev(() => /✗ Not correct/.test(document.getElementById('v-eq').textContent)), 'a division built upside down is marked not correct');
    await ev(id => { const A = FX.api('equation-drill'); A.eqSetChosen([id]); A.eqStart('build'); A.eqPlace(A.state().tray[0].i); }, P('css'));
    const operand = id => ev(id => { const A = FX.api('equation-drill'), E = A.state(); return E.slots.filter((x, i) => x !== null && !A.EQ_OP(A.EQ_BY_ID[id].tokens[i])).length; }, id);
    const filled = await operand(P('css'));
    await page.click('.eqslot.full');
    check(filled === 1 && await operand(P('css')) === 0, 'tapping a filled slot clears it');

    // the picker, and the choice kept through a reload
    await ev(() => { const A = FX.api('equation-drill'); A.stop(); A.renderEq(); });
    await page.click('#v-eq button[data-pick="all"]');
    const all = await ev(() => FX.api('equation-drill').eqChosen().length === EQUATIONS.length);
    await page.click('#v-eq button[data-pick="must"]');
    const must = await ev(() => { const A = FX.api('equation-drill'); return A.eqChosen().length === A.EQ_MUST.length; });
    check(all && must, '"All" selects every equation and "said to memorise" narrows it');
    await ev(ids => FX.api('equation-drill').eqSetChosen(ids), ['css', 'tmax', 'clh'].map(P));
    await page.waitForTimeout(400);
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const kept = await ev(() => FX.api('equation-drill').eqChosen().slice().sort());
    check(JSON.stringify(kept) === JSON.stringify(['clh', 'css', 'tmax'].map(P)), 'the chosen set is kept through a reload', kept);
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();
  } finally {
    await browser.close();
    s.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
