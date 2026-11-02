/* concept-statuses: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * On the course's own data (node, the engine with a stub page): the page carries
 * the module, working; every concept of the bank has a readable name; an answer to
 * a question no longer in the bank reaches no concept.
 * On a scratch copy of the course that holds FIX (below): 4 of Basic-Pharmacokinetics'
 * questions, their 3 topics, the lecture they cite and the 2 skills the course lacks,
 * from src/q1_module1.js and src/course.js at ac2eb73. The ids, the wording and every
 * field are the course's own; `prof` is the course's first professor ("Professor" in
 * FIX), and `teachImg` is left out (the kit has none of the course's slide images, and
 * the core's test.js stops on a teachImg missing from images.json). A course made by
 * ci/oncourse.js already holds FIX, and the test then uses the course's copy.
 * plan-the-problem is switched off in the scratch copy: m1-auc-n02 keeps its `setup`
 * line, which names the equation "auc-trap", and plan-the-problem's build step stops a
 * build whose EQUATIONS lack it. In Chromium:
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

/* Basic-Pharmacokinetics at ac2eb73: questions m1-ord-c07 and m1-ord-c08 (two wordings of
   one concept), m1-int-05 (single answer, a why on each wrong option) and m1-auc-n02 (a
   calculation) from src/q1_module1.js Q_MODULE1; their topics intro, orders and auc from
   its TOPICS; lecture L01 and the skills order and auc (and tell) from src/course.js. Taken
   verbatim with scripts/extract_fix.js (evidence/concept-statuses); the one change to the
   data is `prof` set to the template's "Professor", and `teachImg` is left out (see above).
   ../ci/oncourse.js reads FIX and WRITE from this file. */
const FIX = {"qs":[{"id":"m1-ord-c07","prof":"Professor","tier":"new","exam":1,"module":1,"lecture":"L01","topic":"orders","sub":"decide","concept":"order-from-data","skill":"order","source":"slide","stem":"The table below shows the decomposition of a drug as a function of time.\n\nTime (minute) | Drug A (mg)\n10 | 97.0\n20 | 89.0\n40 | 73.0\n60 | 57.0\n90 | 34.0\n120 | 10.0\n130 | 2.5\n\nWhich order of reaction describes the decrease in the amount of drug A?","options":[{"t":"Zero order","correct":true,"why":"From 20 to 40 minutes the amount falls from 89.0 to 73.0 mg, and from 40 to 60 minutes from 73.0 to 57.0 mg: 16.0 mg lost in each 20 minutes. Equal quantities lost in equal intervals (constant differences, not ratios) is the zero-order signature."},{"t":"First order","why":"Picking this reads a continuous fall as the first-order signature; first order needs a constant ratio over equal intervals. Over 20 minutes, {{frac:89.0|73.0}} is 1.22 and {{frac:73.0|57.0}} is 1.28; over 30 minutes, {{frac:57.0|34.0}} is 1.68 and {{frac:34.0|10.0}} is 3.40. The ratios climb, so it is not first order."},{"t":"Neither order fits the data","why":"Choosing this treats the unequal spacing of the time points as a reason the data cannot be classified. Unequal spacing adds arithmetic, not ambiguity: take the difference or ratio over whatever interval separates the points. The two 20-minute pairs, 89.0 to 73.0 mg and 73.0 to 57.0 mg, each lose 16.0 mg: zero order."}],"teach":[{"h":"The idea","list":["To decide the order from a data set, compare what happens over equal time intervals.","Equal differences, the same amount lost per interval, mean zero order: C = C0 − kt is a straight line on linear axes.","Equal ratios, the same fraction lost per interval, mean first order: ln C against time is a straight line.","From two points, zero order gives k0 = {{frac:C1 − C2|t2 − t1}}; first order gives k = {{frac:ln(C1 ÷ C2)|t2 − t1}}.","On the exam a data set is supplied and the order has to be decided from it."]}],"cite":"IntroductionandMathReview3Solutions.pdf, problem 1a; Introduction.pdf slide 17","quote":"Zero-order — the drug is decreasing at a constant amount per unit time"},{"id":"m1-ord-c08","prof":"Professor","tier":"new","exam":1,"module":1,"lecture":"L01","topic":"orders","sub":"decide","concept":"order-from-data","dupOf":"m1-ord-c07","skill":"order","source":"slide","stem":"A pharmacist dissolved an antibiotic in purified water and measured the drug concentration in aliquots removed over 16 hours.\n\nTime (hr) | C (mcg/mL) | ln C\n0.5 | 233.3 | 5.4523\n1.0 | 217.6 | 5.3827\n2.0 | 189.5 | 5.2444\n4.0 | 143.6 | 4.9670\n8.0 | 82.5 | 4.4128\n12.0 | 47.4 | 3.8586\n16.0 | 27.2 | 3.3032\n\nIs the decomposition of this antibiotic a zero-order or a first-order process?","options":[{"t":"First order","correct":true,"why":"Between 4 and 8 hours ln C falls from 4.9670 to 4.4128, and between 8 and 12 hours from 4.4128 to 3.8586: a drop of 0.5542 each 4 hours, a straight line on logarithmic axes. The concentrations themselves fall by 61.1 and then 35.1 mcg/mL, so they are not linear."},{"t":"Zero order","why":"Picking this reads any fall as zero order, but a falling concentration fits either order. Zero order needs equal losses over equal intervals, yet 61.1 mcg/mL is lost from 4 to 8 hours and only 35.1 mcg/mL from 8 to 12 hours; losses that shrink with the concentration are first-order behaviour."},{"t":"Neither order fits the data","why":"Choosing this treats the uneven sampling times as a feature of the kinetics. Either order can be sampled at any times, and choosing equally separated pairs, such as 4 to 8 hours and 8 to 12 hours, removes the difficulty."}],"steps":[{"k":"setup","t":"Equal intervals from the table: 4.0 to 8.0 hr and 8.0 to 12.0 hr, each 4 hours long","why":"Order is read from how the fall behaves over equal time intervals, so two adjacent 4-hour intervals are taken from the table. The uneven spacing of the other times then does not matter."},{"k":"algebra","t":"ΔC: 143.6 − 82.5 = 61.1 mcg/mL (4 to 8 hr); 82.5 − 47.4 = 35.1 mcg/mL (8 to 12 hr)","why":"A zero-order process loses the same amount in each equal interval. The differences in C are 61.1 and then 35.1 mcg/mL: the loss shrinks as the concentration falls, so the process is not zero order."},{"k":"algebra","t":"Δln C: 4.9670 − 4.4128 = 0.5542 (4 to 8 hr); 4.4128 − 3.8586 = 0.5542 (8 to 12 hr)","why":"A first-order process loses the same fraction in each equal interval, which makes ln C fall by the same amount. The two drops in ln C are identical, 0.5542 each 4 hours, so ln C is linear in time."},{"k":"setup","t":"Compare: equal ΔC fails (61.1 against 35.1); equal Δln C holds (0.5542 against 0.5542), so first order, with k = {{frac:0.5542|4 hr}} = 0.1386 hr⁻¹","why":"The column that falls by a constant amount over equal intervals names the order. It is the ln C column, so the decomposition is first order; the drop over 4 hours is the slope and gives k, 0.1386 hr⁻¹."}],"givens":[["t","0.5 to 16.0 hr","equal 4-hour intervals chosen: 4.0 to 8.0 and 8.0 to 12.0"],["C","143.6, 82.5, 47.4 mcg/mL","differences 61.1 then 35.1: unequal, so not zero order"],["ln C","4.9670, 4.4128, 3.8586","differences 0.5542 and 0.5542: equal, so first order"],["other rows","233.3 down to 27.2","not needed: unevenly spaced; any equally separated pair would do"]],"check":{"t":"A fall by itself does not name the order, since both orders fall. Equal differences in C over equal intervals mean zero order and equal differences in ln C mean first order; here 61.1 against 35.1 is unequal and 0.5542 against 0.5542 is equal."},"teach":[{"h":"The idea","list":["When a table gives a column of natural logarithms (ln C), that column is the test.","ln C falling by equal amounts over equal intervals means first order, because ln C = ln C0 − kt is linear in time.","C falling by equal amounts means zero order, because C = C0 − kt is linear in time.","Whichever column is linear gives the rate constant k from its slope."]}],"cite":"PHAR_4221_Homework_1.md, problem 1a; Introduction.pdf slide 18","quote":"Plotting the natural logarithm of concentration (ln C) vs. time (t) yields a straight line with a correlation coefficient of r = −1.0000"},{"id":"m1-int-05","prof":"Professor","tier":"new","exam":1,"module":1,"lecture":"L01","topic":"intro","sub":"matrix","concept":"blood-components","skill":"tell","source":"slide","stem":"Which blood component is obtained after whole blood is allowed to clot and the clot is removed?","options":[{"t":"Serum","correct":true,"why":"Serum is defined by the clotting step: the blood clots, the clot is removed, and what remains has neither the cells nor fibrinogen nor the other clotting factors. A concentration measured in this fraction is written with a subscript s."},{"t":"Plasma","correct":false,"why":"Picking plasma reads the clotting step as a centrifugation step. Plasma is the liquid left after centrifuging whole blood that an anticoagulant kept from clotting, so it still holds fibrinogen, the other clotting factors and albumin. Serum is what remains once clotting is allowed to run and the clot is removed."},{"t":"Whole blood","correct":false,"why":"Whole blood is the sample as drawn by venous puncture with an anticoagulant such as heparin or EDTA, and it contains all the cellular and protein elements. Nothing has been removed from it. Choosing it means stopping at the sample rather than at the fraction the description asks for."}],"teach":[{"h":"The idea","list":["The three blood fractions differ by what has been taken out.","Whole blood keeps everything. It is collected with an anticoagulant, such as heparin or EDTA, a substance that stops the blood clotting.","Plasma: the cells are spun out while the anticoagulant prevents clotting, so the clotting proteins, fibrinogen among them, remain.","Serum: the blood is allowed to clot and the clot is removed, so the cells and the clotting proteins are gone.","Cp is a plasma concentration, Cs a serum concentration, and a plain C leaves the fraction unspecified."]},{"h":"Where to read more","t":"Introduction.pdf, slide \"Blood Components\"."}],"cite":"Introduction.pdf slide 10","quote":"Obtained from whole blood after the blood is allowed to clot and the clot is removed"},{"id":"m1-auc-n02","type":"numeric","prof":"Professor","tier":"new","exam":1,"module":1,"lecture":"L01","topic":"auc","sub":"trap","concept":"trapezoidal-auc","dupOf":"m1-auc-n01","skill":"auc","source":"slide","stem":"Plasma drug levels after a dose were as follows.\n\nTime (hr) | Plasma drug level (mcg/mL)\n0.5 | 38.9\n1 | 30.3\n2 | 18.4\n3 | 11.1\n4 | 6.77\n5 | 4.10\n\nWhat is the area under the curve from hours 0.5 to 2?","units":"mcg·hr/mL","answer":41.65,"tol":0.8,"steps":[{"k":"setup","t":"Hours 0.5 to 2 contain two segments of unequal width: 0.5 to 1 hr, which is 0.5 hr wide, and 1 to 2 hr, which is 1 hr wide.","why":"The sampling times in this table are not evenly spaced, so each segment carries its own width and a single width cannot be factored out of the sum. Reading the widths off the time column before starting is what prevents the first segment being given a full hour."},{"k":"algebra","t":"Segment 1: [(38.9 + 30.3) mcg/mL ÷ 2] × 0.5 hr = 34.6 × 0.5 = 17.30 mcg·hr/mL.","why":"The two concentrations average to 34.6 mcg/mL and the interval is half an hour, so the area is half of that average. Micrograms per millilitre multiplied by hours gives micrograms times hours per millilitre."},{"k":"algebra","t":"Segment 2: [(30.3 + 18.4) mcg/mL ÷ 2] × 1 hr = 24.35 × 1 = 24.35 mcg·hr/mL.","why":"This segment is wider and its concentrations are lower, and the two effects work against each other, which is why it is the larger of the two areas despite sitting later on the curve. The width has to be taken from the time column rather than assumed."},{"k":"algebra","t":"AUC = 17.30 + 24.35 = 41.65 mcg·hr/mL.","why":"The segment areas share a unit and add directly. The result is larger than the area from hours 2 to 4 because the concentrations over this earlier interval are higher, which is the expected direction for a curve that is declining throughout."},{"k":"round","t":"AUC = 41.65 mcg·hr/mL.","why":"The value is reported to two decimal places, which is what the half-hour and one-hour segment widths support without inventing precision. The unit is again a concentration multiplied by a time, unchanged by the unequal segment widths used over this earlier stretch of the curve."}],"setup":{"eq":"auc-trap","pre":[],"why":"\"area under the curve\" between two sampling times in a table of plasma levels, so the trapezoidal rule. Given Cn−1, Cn and the times bounding each segment, asked AUC, so AUC = [{{frac:Cn−1 + Cn|2}}](tn − tn−1) for each segment, with unequal widths, then summed. No hinge."},"asks":"AUC","givens":[["C at 0.5 hr","38.9 mcg/mL","the first side of segment 1"],["C at 1 hr","30.3 mcg/mL","the shared side of segments 1 and 2"],["C at 2 hr","18.4 mcg/mL","the last side of segment 2"],["widths","0.5 to 2 hr","segment 1 is 0.5 hr wide, segment 2 is 1 hr wide"],["other rows","11.1, 6.77, 4.10 mcg/mL","not needed: outside hours 0.5 to 2"]],"check":{"t":"The span from 0.5 to 2 hr is one and a half hours wide, so the area must lie between one and a half times 18.4 and one and a half times 38.9 mcg·hr/mL, and 41.65 does.","lo":27.6,"hi":58.35},"teach":[{"h":"The idea","list":["The trapezoidal rule does not need evenly spaced samples; each segment uses the interval between its own two points.","One trapezoid = {{frac:C1 + C2|2}} × (t2 − t1), and the total AUC is the sum of the segments.","Pharmacokinetic sampling is usually dense early and sparse late, so each width is read from the time column."]}],"cite":"Introduction.pdf slides 24–25"}],"topics":[{"id":"intro","name":"What pharmacokinetics is","prof":"Professor","open":true,"cite":"Introduction.pdf slides 2–15","subs":[{"id":"disc","name":"Pharmacokinetics and the related disciplines","cite":"Introduction.pdf slides 3–8"},{"id":"terms","name":"ADME and the fundamental terms","cite":"Introduction.pdf slides 4–5"},{"id":"matrix","name":"Whole blood, serum and plasma","cite":"Introduction.pdf slide 10"},{"id":"models","name":"Pharmacokinetic models","cite":"Introduction.pdf slides 11–14"},{"id":"curve","name":"The concentration versus time curve","cite":"Introduction.pdf slide 9"}]},{"id":"orders","name":"Kinetic orders and the maths","prof":"Professor","open":true,"cite":"Introduction.pdf slides 16–21","subs":[{"id":"zero","name":"Zero-order reactions","cite":"Introduction.pdf slide 17"},{"id":"first","name":"First-order reactions","cite":"Introduction.pdf slide 18"},{"id":"half","name":"Half-life, both orders","cite":"Introduction.pdf slide 19"},{"id":"plots","name":"Linear and semi-logarithmic plots","cite":"Introduction.pdf slides 20–21"},{"id":"decide","name":"Deciding the order from a data set","cite":"Introduction.pdf slides 17–18"}]},{"id":"auc","name":"Area under the curve","prof":"Professor","cite":"Introduction.pdf slides 22–26","subs":[{"id":"concept","name":"What the area under the curve tells you","cite":"Introduction.pdf slides 22–23"},{"id":"trap","name":"The trapezoidal rule","cite":"Introduction.pdf slides 24–25"}]}],"lecture":{"id":"L01","deck":"Introduction.pdf","label":"Module 1: Introduction, kinetic orders and AUC (17 & 19 Aug)","prof":"Professor","exam":1,"module":1},"skills":[{"id":"tell","label":"Tell two similar things apart","short":"Tell apart","kind":"concept"},{"id":"order","label":"Decide the order from a data set","short":"Order","kind":"calc"},{"id":"auc","label":"AUC and the trapezoidal rule","short":"AUC","kind":"calc"}]};
/* Basic-Pharmacokinetics src/views.js CONCEPT_WORDS (line 2634, ac2eb73), verbatim, as the
   course's `words` option. */
const WORDS = {"999":"99.9%","vd":"VD","cl":"Cl","clr":"ClR","crcl":"CrCl","gfr":"GFR","ibw":"IBW","bw":"body weight","cmax":"Cmax","cmin":"Cmin","tmax":"tmax","c0":"C0","cp":"Cp","css":"Css","cavg":"Cavg","cav":"Cav","auc":"AUC","aucs":"AUCs","k":"k","ka":"ka","ke":"ke","kvd":"k × VD","thalf":"t½","tau":"τ","f":"F","fe":"fe","frel":"Frel","fabs":"Fabs","alpha":"α","beta":"β","vp":"Vp","db":"DB","d0":"D0","davg":"Davg","r":"R","mec":"MEC","pk":"PK","pd":"PD","adme":"ADME","iv":"IV","ph":"pH","ss":"steady state","halflife":"half-life","halflives":"half-lives","onecpt":"one-compartment","multicpt":"multicompartment","cpt":"compartment","defn":"definition","def":"definition","conc":"concentration","bioavail":"bioavailability","biexp":"biexponential","equiv":"equivalent","rel":"relative","params":"parameters","calc":"calculation","diffeq":"differential equation","cockcroft":"Cockcroft","gault":"Gault","henderson":"Henderson","hasselbalch":"Hasselbalch"};
/* The course data file for FIX, in the kit's question-file form: one question per line,
   opening {id:'...', the type, the skill, then prof as a literal (browser_test.js counts
   the bank that way); the topics pushed after the course's own; the lecture as L91 when
   the course has no entry for its deck; the skills the course lacks. Questions, topics
   and skills the course already has are not written again. */
const WRITE = (fix, own) => {
  const lit = v => { if(!/^[^'\\\n]*$/.test(String(v))) throw new Error('cannot be written as a literal: ' + v); return `'${v}'`; };
  const rows = fix.qs.filter(q => !own.qids.includes(q.id)).map(q => {
    const r = Object.assign({}, q); ['id', 'type', 'skill', 'prof'].forEach(k => delete r[k]);
    return `{id:${lit(q.id)},` + (q.type ? ` type:${lit(q.type)},` : '') + ` skill:${lit(q.skill)}, prof:${lit(own.prof)}, ${JSON.stringify(r).slice(1)},`; });
  const topics = fix.topics.filter(t => !own.topics.includes(t.id)).map(t => Object.assign({}, t, {prof: own.prof}));
  let body = '';
  if(topics.length) body += `TOPICS.push(\n${topics.map(t => JSON.stringify(t)).join(',\n')}\n);\n`;
  if(rows.length) body += `QUESTIONS.push(\n${rows.join('\n')}\n);\n`;
  if(body) body = `/* concept-statuses: 4 of Basic-Pharmacokinetics' questions and their topics (src/q1_module1.js, ac2eb73),\n   written from FIX in features/concept-statuses/current/test.js */\n` + body;
  const skills = fix.skills.filter(s => !own.skills.includes(s.id));
  const l = fix.lecture, lecture = own.decks.includes(l.deck) ? '' :
    `{id:'L91', deck:${lit(l.deck)}, label:${lit(l.label)}, prof:${lit(own.prof)}, exam:${JSON.stringify(l.exam)}, module:${JSON.stringify(l.module)}}`;
  const line = (lecture ? `COURSE.lectures = (COURSE.lectures || []).concat([${lecture}]); ` : '') +
    (skills.length ? `COURSE.skills = (COURSE.skills || []).concat(${JSON.stringify(skills)}); ` : '');
  return {body, line, rows: rows.length, topics: topics.length, skills: skills.length, lecture: !!lecture};
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
  const two = [byId('m1-ord-c07'), byId('m1-ord-c08')], mcq = byId('m1-int-05'), num = byId('m1-auc-n02');
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
  const X = L.engine('({QUESTIONS, TOPICS, COURSE, FX: typeof FX === "undefined" ? null : FX})');
  const S = X.FX && X.FX.api('concept-statuses');
  if(!check(!!S, 'the page carries concept-statuses, working', JSON.stringify((X.FX && X.FX.errors) || 'no feature modules in the page'))) L.finish(NAME);
  const concepts = [...new Set(X.QUESTIONS.map(q => q.concept))];
  const badT = concepts.filter(c => { const t = S.conceptTitle(c); return !t || /undefined|NaN/.test(t); });
  check(concepts.length && !badT.length, `every concept has a readable name (${concepts.length}; e.g. "${S.conceptTitle(concepts[0])}")`, badT.slice(0, 5).join(', '));
  const ghost = S.conceptLog([{qid: 'no-such-question', concept: 'gone', result: 'wrong', at: Date.now(), qn: 1}]);
  check(!Object.keys(ghost).length, 'an answer to a question no longer in the bank reaches no concept');
  const prof = X.COURSE.professors[0];
  const own = {prof, qids: X.QUESTIONS.map(q => q.id), topics: X.TOPICS.map(t => t.id), skills: (X.COURSE.skills || []).map(s => s.id),
               decks: (X.COURSE.lectures || []).map(l => l.deck)};
  const w = WRITE(FIX, own);
  console.log(`  the course ${w.rows ? `lacks ${w.rows} of the ${FIX.qs.length} questions of FIX: the scratch copy adds them` : 'holds the questions of FIX: the scratch copy uses its copy'}` +
              ` (${w.topics} topics, ${w.skills} skills, ${w.lecture ? 'the lecture as L91' : 'no lecture'} added)`);

  console.log('\n=== on a scratch copy with 4 of Basic-Pharmacokinetics\' questions (Chromium) ===');
  const s = L.scratchBuild('cstat', {files: w.body ? {'q91_cst_fixture.js': w.body} : {},
    courseLine: w.line + L.featureOn(__dirname, {words: WORDS}) + "if(COURSE.features) delete COURSE.features['plan-the-problem'];"});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test questions does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  const dl = fs.mkdtempSync(path.join(os.tmpdir(), 'cstat-dl-'));
  try {
    { const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1000}});
      const ev = (f, a) => page.evaluate(f, a);
      const fm = await ev(() => !!FX.api('formulas-in-text'));
      console.log(`  formulas-in-text is ${fm ? 'on' : 'off'} in this copy`);
      const r = await ev(([CASES]) => {
        const A = FX.api('concept-statuses'), two = [byId('m1-ord-c07'), byId('m1-ord-c08')];
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
        out.title = A.conceptTitle(byId('m1-auc-n02').concept);
        // wrong options: a select-all answer counts only the wrong options it picked
        const mcq = byId('m1-int-05'), ri = mcq.options.findIndex(o => o.correct), wi = mcq.options.map((o, i) => o.correct ? -1 : i).filter(i => i >= 0);
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
      check(r.title === 'Trapezoidal AUC', 'the course\'s `words` option names the concept ("trapezoidal-auc" as "Trapezoidal AUC")', r.title);
      check(JSON.stringify(r.multi) === JSON.stringify(r.multiWant), 'a select-all answer counts only the wrong options it picked', r.multi);
      check(JSON.stringify(r.rep2.slice().sort()) === JSON.stringify(r.repWant[0]) && JSON.stringify(r.rep1) === JSON.stringify(r.repWant[1]),
            'wrong options chosen more than once are all listed as repeated, one chosen once is not', {rep2: r.rep2, rep1: r.rep1});
      if(r.match) check(JSON.stringify(r.match) === JSON.stringify(r.matchWant), 'a matching answer names each left item with the wrong right-hand item picked', r.match);
      else L.skip('a matching answer names the wrong pairs', 'the bank has no matching question');

      // a card's option text and its why: no {{frac:...}} markup (m1-ord-c07's "First order" why holds four ratios)
      await ev(() => { DB.answers = []; DB.concepts = {}; DB.qn = 0; const q = byId('m1-ord-c07'), wi = q.options.findIndex(o => /\{\{frac:/.test(o.why || ''));
        [0, 1].forEach(k => { DB.qn++; DB.answers.push({qid: q.id, concept: q.concept, result: 'wrong', picked: wi, at: Date.now() - (5 - k) * 60000, qn: DB.qn}); });
        save(); show('gaps'); });
      await page.waitForTimeout(250);
      const fr = await ev(() => { const c = document.querySelector('#cstatuses .ccard'); return c ? {t: c.innerText, h: c.innerHTML} : null; });
      check(fr && !/\{\{frac:/.test(fr.h) && fr.t.includes('(89.0)/(73.0)'), `a card shows a ratio of the why as (a)/(b), with no {{frac:...}} markup (formulas-in-text ${fm ? 'on' : 'off'})`,
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
        const q = byId('m1-int-05'), wi = q.options.findIndex(o => !o.correct); for(let k = 0; k < 3; k++) record(q, 'wrong', wi);
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
      const mark = async ms => { const e = await ev(ms => { const q = byId('m1-int-05'), wi = q.options.findIndex(o => !o.correct); record(q, 'wrong', wi);
          const a = DB.answers[DB.answers.length - 1]; setTimeout(() => location.reload(), ms); return {at: a.at, qn: a.qn}; }, ms);
        await page.waitForTimeout(ms + 300);
        await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
        return ev(e => ({kept: DB.answers.some(a => a.at === e.at && a.qn === e.qn && a.qid === 'm1-int-05'), qn: DB.qn, n: DB.answers.length}), e); };
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
          const q = byId('m1-ord-c07'); record(q, 'correct', q.options.findIndex(o => o.correct));
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
