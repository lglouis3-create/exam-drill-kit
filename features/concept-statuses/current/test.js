/* concept-statuses: the module's own test. run_checks.sh runs it when the course
 * switches the module on (build.py --list-checks).
 *
 * On the course's own data (node, the engine with a stub page): the page carries
 * the module, working; every concept of the bank has a readable name; an answer to
 * a question no longer in the bank reaches no concept.
 * On a scratch copy with 4 of Basic-Pharmacokinetics' questions added (src/q1_module1.js
 * at ac2eb73: m1-ord-c07 and m1-ord-c08, two wordings of one concept; m1-int-05, a
 * single-answer question whose wrong options have their why; m1-auc-n02, a calculation;
 * and the 3 topics they sit in), copied verbatim with ids prefixed cst-, the professor
 * and the skill set to the course's own, and the slide image and transcript quote
 * fields left out (the kit has no slide images of that course), in Chromium:
 *   - Basic-Pharmacokinetics' src/test.js section 4c ported: the 13 synthetic logs
 *     give the statuses, mastery starts the spaced check at the mastery box at the
 *     pace's intervals and each further solid answer moves it up one, a concept
 *     mastered 40 days ago is due and one mastered minutes ago is not, the evidence
 *     line gives exact counts;
 *   - this kit's additions: a correct answer marked "Not sure" is a miss (the core's
 *     solidEntry), the weekly pace's days are used on that pace, "Ask everything"
 *     does not list a fresh mastered concept as due, the course's `words` option
 *     names the concept;
 *   - Basic-Pharmacokinetics' src/sweep_test.py concept_check ported, at 390 and
 *     1100 px, light and dark: the struggling card with the option chosen 3 times and
 *     its why, the exact evidence line, the most common kind of miss on a calculation,
 *     the mastered concept folded away and listed as due, no undefined or NaN, the
 *     cards inside the width, Practice this concept opens a quiz on that concept;
 *   - this kit's additions: the section sits after "This session" and before "What
 *     to review next"; drawing it changes neither the scheduler's records nor the
 *     saved progress; Check and Run the check start a one-question review; with no
 *     answers there is no section; no page error.
 *
 *     node features/concept-statuses/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/concept-statuses/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

/* Basic-Pharmacokinetics src/q1_module1.js (ac2eb73): 4 questions and their 3 topics,
   the `prof` field taken out (the test puts the course's own professor in). */
const PK = {"qs":[{"id":"m1-ord-c07","tier":"new","exam":1,"module":1,"lecture":"L01","topic":"orders","sub":"decide","concept":"order-from-data","skill":"order","source":"slide","stem":"The table below shows the decomposition of a drug as a function of time.\n\nTime (minute) | Drug A (mg)\n10 | 97.0\n20 | 89.0\n40 | 73.0\n60 | 57.0\n90 | 34.0\n120 | 10.0\n130 | 2.5\n\nWhich order of reaction describes the decrease in the amount of drug A?","options":[{"t":"Zero order","correct":true,"why":"From 20 to 40 minutes the amount falls from 89.0 to 73.0 mg, and from 40 to 60 minutes from 73.0 to 57.0 mg: 16.0 mg lost in each 20 minutes. Equal quantities lost in equal intervals (constant differences, not ratios) is the zero-order signature."},{"t":"First order","why":"Picking this reads a continuous fall as the first-order signature; first order needs a constant ratio over equal intervals. Over 20 minutes, {{frac:89.0|73.0}} is 1.22 and {{frac:73.0|57.0}} is 1.28; over 30 minutes, {{frac:57.0|34.0}} is 1.68 and {{frac:34.0|10.0}} is 3.40. The ratios climb, so it is not first order."},{"t":"Neither order fits the data","why":"Choosing this treats the unequal spacing of the time points as a reason the data cannot be classified. Unequal spacing adds arithmetic, not ambiguity: take the difference or ratio over whatever interval separates the points. The two 20-minute pairs, 89.0 to 73.0 mg and 73.0 to 57.0 mg, each lose 16.0 mg: zero order."}],"teach":[{"h":"The idea","list":["To decide the order from a data set, compare what happens over equal time intervals.","Equal differences, the same amount lost per interval, mean zero order: C = C0 − kt is a straight line on linear axes.","Equal ratios, the same fraction lost per interval, mean first order: ln C against time is a straight line.","From two points, zero order gives k0 = {{frac:C1 − C2|t2 − t1}}; first order gives k = {{frac:ln(C1 ÷ C2)|t2 − t1}}.","On the exam a data set is supplied and the order has to be decided from it."]}],"cite":"IntroductionandMathReview3Solutions.pdf, problem 1a; Introduction.pdf slide 17"},{"id":"m1-ord-c08","tier":"new","exam":1,"module":1,"lecture":"L01","topic":"orders","sub":"decide","concept":"order-from-data","skill":"order","source":"slide","stem":"A pharmacist dissolved an antibiotic in purified water and measured the drug concentration in aliquots removed over 16 hours.\n\nTime (hr) | C (mcg/mL) | ln C\n0.5 | 233.3 | 5.4523\n1.0 | 217.6 | 5.3827\n2.0 | 189.5 | 5.2444\n4.0 | 143.6 | 4.9670\n8.0 | 82.5 | 4.4128\n12.0 | 47.4 | 3.8586\n16.0 | 27.2 | 3.3032\n\nIs the decomposition of this antibiotic a zero-order or a first-order process?","options":[{"t":"First order","correct":true,"why":"Between 4 and 8 hours ln C falls from 4.9670 to 4.4128, and between 8 and 12 hours from 4.4128 to 3.8586: a drop of 0.5542 each 4 hours, a straight line on logarithmic axes. The concentrations themselves fall by 61.1 and then 35.1 mcg/mL, so they are not linear."},{"t":"Zero order","why":"Picking this reads any fall as zero order, but a falling concentration fits either order. Zero order needs equal losses over equal intervals, yet 61.1 mcg/mL is lost from 4 to 8 hours and only 35.1 mcg/mL from 8 to 12 hours; losses that shrink with the concentration are first-order behaviour."},{"t":"Neither order fits the data","why":"Choosing this treats the uneven sampling times as a feature of the kinetics. Either order can be sampled at any times, and choosing equally separated pairs, such as 4 to 8 hours and 8 to 12 hours, removes the difficulty."}],"steps":[{"k":"setup","t":"Equal intervals from the table: 4.0 to 8.0 hr and 8.0 to 12.0 hr, each 4 hours long","why":"Order is read from how the fall behaves over equal time intervals, so two adjacent 4-hour intervals are taken from the table. The uneven spacing of the other times then does not matter."},{"k":"algebra","t":"ΔC: 143.6 − 82.5 = 61.1 mcg/mL (4 to 8 hr); 82.5 − 47.4 = 35.1 mcg/mL (8 to 12 hr)","why":"A zero-order process loses the same amount in each equal interval. The differences in C are 61.1 and then 35.1 mcg/mL: the loss shrinks as the concentration falls, so the process is not zero order."},{"k":"algebra","t":"Δln C: 4.9670 − 4.4128 = 0.5542 (4 to 8 hr); 4.4128 − 3.8586 = 0.5542 (8 to 12 hr)","why":"A first-order process loses the same fraction in each equal interval, which makes ln C fall by the same amount. The two drops in ln C are identical, 0.5542 each 4 hours, so ln C is linear in time."},{"k":"setup","t":"Compare: equal ΔC fails (61.1 against 35.1); equal Δln C holds (0.5542 against 0.5542), so first order, with k = {{frac:0.5542|4 hr}} = 0.1386 hr⁻¹","why":"The column that falls by a constant amount over equal intervals names the order. It is the ln C column, so the decomposition is first order; the drop over 4 hours is the slope and gives k, 0.1386 hr⁻¹."}],"givens":[["t","0.5 to 16.0 hr","equal 4-hour intervals chosen: 4.0 to 8.0 and 8.0 to 12.0"],["C","143.6, 82.5, 47.4 mcg/mL","differences 61.1 then 35.1: unequal, so not zero order"],["ln C","4.9670, 4.4128, 3.8586","differences 0.5542 and 0.5542: equal, so first order"],["other rows","233.3 down to 27.2","not needed: unevenly spaced; any equally separated pair would do"]],"check":{"t":"A fall by itself does not name the order, since both orders fall. Equal differences in C over equal intervals mean zero order and equal differences in ln C mean first order; here 61.1 against 35.1 is unequal and 0.5542 against 0.5542 is equal."},"teach":[{"h":"The idea","list":["When a table gives a column of natural logarithms (ln C), that column is the test.","ln C falling by equal amounts over equal intervals means first order, because ln C = ln C0 − kt is linear in time.","C falling by equal amounts means zero order, because C = C0 − kt is linear in time.","Whichever column is linear gives the rate constant k from its slope."]}],"cite":"PHAR_4221_Homework_1.md, problem 1a; Introduction.pdf slide 18"},{"id":"m1-int-05","tier":"new","exam":1,"module":1,"lecture":"L01","topic":"intro","sub":"matrix","concept":"blood-components","skill":"tell","source":"slide","stem":"Which blood component is obtained after whole blood is allowed to clot and the clot is removed?","options":[{"t":"Serum","correct":true,"why":"Serum is defined by the clotting step: the blood clots, the clot is removed, and what remains has neither the cells nor fibrinogen nor the other clotting factors. A concentration measured in this fraction is written with a subscript s."},{"t":"Plasma","correct":false,"why":"Picking plasma reads the clotting step as a centrifugation step. Plasma is the liquid left after centrifuging whole blood that an anticoagulant kept from clotting, so it still holds fibrinogen, the other clotting factors and albumin. Serum is what remains once clotting is allowed to run and the clot is removed."},{"t":"Whole blood","correct":false,"why":"Whole blood is the sample as drawn by venous puncture with an anticoagulant such as heparin or EDTA, and it contains all the cellular and protein elements. Nothing has been removed from it. Choosing it means stopping at the sample rather than at the fraction the description asks for."}],"teach":[{"h":"The idea","list":["The three blood fractions differ by what has been taken out.","Whole blood keeps everything. It is collected with an anticoagulant, such as heparin or EDTA, a substance that stops the blood clotting.","Plasma: the cells are spun out while the anticoagulant prevents clotting, so the clotting proteins, fibrinogen among them, remain.","Serum: the blood is allowed to clot and the clot is removed, so the cells and the clotting proteins are gone.","Cp is a plasma concentration, Cs a serum concentration, and a plain C leaves the fraction unspecified."]},{"h":"Where to read more","t":"Introduction.pdf, slide \"Blood Components\"."}],"cite":"Introduction.pdf slide 10"},{"id":"m1-auc-n02","type":"numeric","tier":"new","exam":1,"module":1,"lecture":"L01","topic":"auc","sub":"trap","concept":"trapezoidal-auc","skill":"auc","source":"slide","stem":"Plasma drug levels after a dose were as follows.\n\nTime (hr) | Plasma drug level (mcg/mL)\n0.5 | 38.9\n1 | 30.3\n2 | 18.4\n3 | 11.1\n4 | 6.77\n5 | 4.10\n\nWhat is the area under the curve from hours 0.5 to 2?","units":"mcg·hr/mL","answer":41.65,"tol":0.8,"steps":[{"k":"setup","t":"Hours 0.5 to 2 contain two segments of unequal width: 0.5 to 1 hr, which is 0.5 hr wide, and 1 to 2 hr, which is 1 hr wide.","why":"The sampling times in this table are not evenly spaced, so each segment carries its own width and a single width cannot be factored out of the sum. Reading the widths off the time column before starting is what prevents the first segment being given a full hour."},{"k":"algebra","t":"Segment 1: [(38.9 + 30.3) mcg/mL ÷ 2] × 0.5 hr = 34.6 × 0.5 = 17.30 mcg·hr/mL.","why":"The two concentrations average to 34.6 mcg/mL and the interval is half an hour, so the area is half of that average. Micrograms per millilitre multiplied by hours gives micrograms times hours per millilitre."},{"k":"algebra","t":"Segment 2: [(30.3 + 18.4) mcg/mL ÷ 2] × 1 hr = 24.35 × 1 = 24.35 mcg·hr/mL.","why":"This segment is wider and its concentrations are lower, and the two effects work against each other, which is why it is the larger of the two areas despite sitting later on the curve. The width has to be taken from the time column rather than assumed."},{"k":"algebra","t":"AUC = 17.30 + 24.35 = 41.65 mcg·hr/mL.","why":"The segment areas share a unit and add directly. The result is larger than the area from hours 2 to 4 because the concentrations over this earlier interval are higher, which is the expected direction for a curve that is declining throughout."},{"k":"round","t":"AUC = 41.65 mcg·hr/mL.","why":"The value is reported to two decimal places, which is what the half-hour and one-hour segment widths support without inventing precision. The unit is again a concentration multiplied by a time, unchanged by the unequal segment widths used over this earlier stretch of the curve."}],"setup":{"eq":"auc-trap","pre":[],"why":"\"area under the curve\" between two sampling times in a table of plasma levels, so the trapezoidal rule. Given Cn−1, Cn and the times bounding each segment, asked AUC, so AUC = [{{frac:Cn−1 + Cn|2}}](tn − tn−1) for each segment, with unequal widths, then summed. No hinge."},"asks":"AUC","givens":[["C at 0.5 hr","38.9 mcg/mL","the first side of segment 1"],["C at 1 hr","30.3 mcg/mL","the shared side of segments 1 and 2"],["C at 2 hr","18.4 mcg/mL","the last side of segment 2"],["widths","0.5 to 2 hr","segment 1 is 0.5 hr wide, segment 2 is 1 hr wide"],["other rows","11.1, 6.77, 4.10 mcg/mL","not needed: outside hours 0.5 to 2"]],"check":{"t":"The span from 0.5 to 2 hr is one and a half hours wide, so the area must lie between one and a half times 18.4 and one and a half times 38.9 mcg·hr/mL, and 41.65 does.","lo":27.6,"hi":58.35},"teach":[{"h":"The idea","list":["The trapezoidal rule does not need evenly spaced samples; each segment uses the interval between its own two points.","One trapezoid = {{frac:C1 + C2|2}} × (t2 − t1), and the total AUC is the sum of the segments.","Pharmacokinetic sampling is usually dense early and sparse late, so each width is read from the time column."]}],"cite":"Introduction.pdf slides 24–25"}],"topics":[{"id":"intro","name":"What pharmacokinetics is","cite":"Introduction.pdf slides 2–15","subs":[{"id":"matrix","name":"Whole blood, serum and plasma","cite":"Introduction.pdf slide 10"}]},{"id":"orders","name":"Kinetic orders and the maths","cite":"Introduction.pdf slides 16–21","subs":[{"id":"decide","name":"Deciding the order from a data set","cite":"Introduction.pdf slides 17–18"}]},{"id":"auc","name":"Area under the curve","cite":"Introduction.pdf slides 22–26","subs":[{"id":"trap","name":"The trapezoidal rule","cite":"Introduction.pdf slides 24–25"}]}]};
/* Basic-Pharmacokinetics src/views.js CONCEPT_WORDS (ac2eb73), the one entry the
   fixture's concept ids use, as the course's `words` option. */
const WORDS = {auc: 'AUC'};

function fixtureFiles(own){
  const qs = PK.qs.map(q => Object.assign({}, q, {id: 'cst-' + q.id, prof: own.prof, skill: own.skill}));
  const topics = PK.topics.filter(t => !own.topics.includes(t.id)).map(t => Object.assign({}, t, {prof: own.prof}));
  return {'q91_concept_fixture.js': '/* 4 of Basic-Pharmacokinetics\' questions (ac2eb73), added by the concept-statuses test */\n' +
    `TOPICS.push(...${JSON.stringify(topics)});\nQUESTIONS.push(...${JSON.stringify(qs)});\n`};
}

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
  const two = [byId('cst-m1-ord-c07'), byId('cst-m1-ord-c08')], mcq = byId('cst-m1-int-05'), num = byId('cst-m1-auc-n02');
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
  const own = {topics: X.TOPICS.map(t => t.id), prof: X.COURSE.professors[0], skill: X.COURSE.skills[0].id};

  console.log('\n=== on a scratch copy with 4 of Basic-Pharmacokinetics\' questions (Chromium) ===');
  const s = L.scratchBuild('cstat', {files: fixtureFiles(own), courseLine: L.featureOn(__dirname, {words: WORDS})});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test questions does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  try {
    { const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1000}});
      const ev = (f, a) => page.evaluate(f, a);
      const r = await ev(([CASES]) => {
        const A = FX.api('concept-statuses'), two = [byId('cst-m1-ord-c07'), byId('cst-m1-ord-c08')];
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
        DB.settings.mode = mode; DB.concepts = saved;
        const line = rows => { const l = A.conceptLog(log(rows))[two[0].concept]; return A.statusLine(two[0].concept, A.conceptRecord(l), A.conceptStats(l)); };
        out.line = line([[0, 'wrong', 0], [1, 'correct', 1], [0, 'wrong', 2], [1, 'guessed', 3], [0, 'correct', 4]]);
        out.shaky = recOf([[0, 'correct', 0], [1, 'correct', 5], [0, 'correct', 120, 'shaky']]).s;
        out.shakyLine = line([[0, 'wrong', 0], [1, 'correct', 1, 'shaky']]);
        out.title = A.conceptTitle(byId('cst-m1-auc-n02').concept);
        return out;
      }, [CASES]);
      check(!r.off.length, `the status rules hold on ${CASES.length} synthetic logs (unfamiliar, struggling, improving, mastered, returning, learning)`, r.off.join('; '));
      check(r.box.ok, 'mastery starts the spaced check at the mastery box at the pace\'s intervals, and each further solid answer moves it up one', r.box);
      check(r.weekly, 'on the weekly pace the spaced check uses the weekly days');
      check(r.due[0] === true && r.due[1] === false, 'a concept mastered 40 days ago is due for its spaced check, one mastered minutes ago is not', r.due);
      check(r.dueAll === false, '"Ask everything" does not list a concept mastered minutes ago as due', r.dueAll);
      check(r.line === '3 misses in 5 attempts, last 5 at 40% (1 of them a correct answer marked as a guess)', 'the evidence line gives exact counts: ' + r.line, r.line);
      check(r.shaky === 'learning', 'a correct answer marked "Not sure" is a miss: it blocks mastery', r.shaky);
      check(r.shakyLine === '2 misses in 2 attempts, last 2 at 0% (1 of them a correct answer marked "Not sure")', 'the evidence line counts a "Not sure": ' + r.shakyLine, r.shakyLine);
      check(r.title === 'Trapezoidal AUC', 'the course\'s `words` option names the concept ("trapezoidal-auc" as "Trapezoidal AUC")', r.title);

      // with no answers, Weak spots has no Concepts section
      await ev(() => { DB.answers = []; DB.concepts = {}; DB.qn = 0; save(); show('gaps'); });
      await page.waitForTimeout(150);
      check(!(await ev(() => !!document.getElementById('cstatuses'))), 'with no answers there is no Concepts section');

      // the section's place, and its Check and Run the check buttons (the seed leaves DB.concepts empty, so the scheduler has the concept due)
      await ev(SEED);
      await ev(() => show('gaps'));
      await page.waitForTimeout(200);
      const order = await ev(() => { const box = document.getElementById('cstatuses'), hs = [...document.querySelectorAll('#v-gaps h3')];
        const ses = hs.find(h => h.textContent === 'This session'), rev = hs.find(h => /^What to review next/.test(h.textContent));
        const pos = (a, b) => !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING));
        return {box: !!box, n: document.querySelectorAll('#cstatuses').length, afterSession: pos(ses, box), beforeReview: pos(box, rev)}; });
      check(order.box && order.n === 1 && order.afterSession && order.beforeReview, 'the section is drawn once, after "This session" and before "What to review next"', order);
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
      const snap = () => ev(() => JSON.stringify([DB.concepts, DB.qn, DB.answers, DB.settings, Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])]));
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
      await ev(() => document.querySelector('#v-gaps [data-cpractice]').click());
      await page.waitForTimeout(200);
      check(await ev(() => VIEW === 'quiz' && Q && Q.label.startsWith('Concept: ') && Q.sweep.every(id => byId(id).concept === byId(Q.sweep[0]).concept)),
            'Practice this concept opens a quiz on that concept');
      check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
      await ctx.close();
    }
  } finally {
    await browser.close();
    s.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
