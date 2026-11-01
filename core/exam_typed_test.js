/* exams[].typed: calculations and matching items on exam papers (exam_typed.js).
 * run_checks.sh runs it when an exam in course.js sets `typed` (build.py --list-checks).
 *
 * On the course's own page, in node: the option is on for the active exam as
 * course.js says; 40 papers keep their size, and the bank's numeric and matching
 * items come back with their `type` after every draw; when the active exam allows
 * them and its pools hold any, they reach a paper.
 * On scratch copies (one pool over the whole bank, 10 marks), in Chromium:
 *   - with `typed: true`, 40 papers carry numeric and matching items; with
 *     `typed: false`, none do, as on the core without the option;
 *   - on a paper holding a calculation from Basic-Pharmacokinetics (m6b-n01), a
 *     matching item and a multiple-choice item: the calculation is typed, the
 *     matching item picked row by row, both are kept through a reload, graded as
 *     in the quiz, recorded on submit with what was typed and picked, counted in
 *     the score, and shown on the result page with the answer and the working.
 *
 *     node exam_typed_test.js
 */
const fs = require('fs'), path = require('path');
const L = require('./check_lib');
const NAME = 'exam_typed_test.js';
const {check} = L;
L.PAGE.need(NAME);

console.log('\n=== the course\'s own papers (node) ===');
const X = L.engine('({drawPaper, QUESTIONS, EXAM, ET: typeof EXAM_TYPED === "undefined" ? null : EXAM_TYPED})');
check(!!X.ET && X.ET.allows === !!X.EXAM.typed, `the option is ${X.EXAM.typed ? 'on' : 'off'} for the active exam (${X.EXAM.name}), as course.js says`);
const typedQ = X.QUESTIONS.filter(q => q.type === 'numeric' || q.type === 'match');
const before = JSON.stringify(typedQ.map(q => [q.id, q.type]));
let onPaper = 0, sizes = new Set();
for(let k = 0; k < 40; k++){ const p = X.drawPaper(); sizes.add(p.length); onPaper += p.filter(q => q.type === 'numeric' || q.type === 'match').length; }
check(JSON.stringify(typedQ.map(q => [q.id, q.type])) === before && X.QUESTIONS.every(q => q._paperType === undefined),
      `every numeric and matching item keeps its type after 40 draws (${typedQ.length} in the bank)`);
check(sizes.size === 1 && [...sizes][0] <= X.EXAM.questions, `every paper has the same size, at most ${X.EXAM.questions}`, [...sizes].join(', '));
const eligible = typedQ.filter(q => !q.lowYield && X.EXAM.pools.some(p => p.test(q))).length;
if(X.EXAM.typed && eligible) check(onPaper > 0, `the exam's ${eligible} numeric and matching items reach its papers (${onPaper} on 40 papers)`);
else L.skip('the course\'s own typed items on papers', X.EXAM.typed ? 'no numeric or matching item is in the exam\'s pools' : 'the active exam does not set typed');

// a calculation from Basic-Pharmacokinetics src/q8_module6b.js (m6b-n01, ac2eb73) and a matching item
const QF = `QUESTIONS.push({id:'et-num', type:'numeric', prof:COURSE.professors[0], tier:'new', topic:TOPICS[0].id,
  sub:TOPICS[0].subs[0].id, concept:'et-num', skill:COURSE.skills[0].id, source:'slide', tags:[],
  stem:'A 300-mg dose of an antibiotic is administered as an intravenous (IV) infusion over a period of 2 hours. What is the infusion rate?',
  answer:150, tol:0.5, units:'mg/hr', steps:[{k:'setup', t:'R = {{frac:dose|infusion time}}'}, {k:'algebra', t:'R = {{frac:300 mg|2 hr}} = 150 mg/hr'}, {k:'round', t:'R = 150 mg/hr'}],
  teach:'An infusion rate is the dose divided by the time it runs.', cite:'Test (' + COURSE.lectures[0].deck + ') slide 1'});
QUESTIONS.push({id:'et-match', type:'match', prof:COURSE.professors[0], tier:'new', topic:TOPICS[0].id, sub:TOPICS[0].subs[0].id,
  concept:'et-match', skill:COURSE.skills[0].id, source:'slide', tags:[], stem:'Match each quantity to its unit.', left:'Quantity', right:'Unit',
  pairs:[{l:'Infusion rate', r:'mg/hr', why:'An amount per time.'}, {l:'Volume of distribution', r:'L', why:'A volume.'}, {l:'Elimination rate constant', r:'hr⁻¹', why:'A reciprocal time.'}],
  teach:'Each quantity carries its own unit.', cite:'Test (' + COURSE.lectures[0].deck + ') slide 1'});\n`;
const paperLine = typed => `COURSE.activeExam = COURSE.exams[0].id; Object.assign(COURSE.exams[0], {typed: ${typed}, questions: 10, sata: 0, blueprint: undefined,
  pools: [{key: 'all', name: 'The whole bank', marks: 10, filter: {}}]});`;

(async () => {
  console.log('\n=== on scratch copies (Chromium) ===');
  const on = L.scratchBuild('typed-on', {files: {'q95_exam_typed_test.js': QF}, courseLine: paperLine(true)});
  const off = L.scratchBuild('typed-off', {files: {'q95_exam_typed_test.js': QF}, courseLine: paperLine(false)});
  if(on.code !== 0 || off.code !== 0) L.notRun(NAME, 'a scratch copy does not build: ' + (on.code ? on.out : off.out).split('\n').pop());
  check(!/const EXAM_TYPED = /.test(fs.readFileSync(off.page, 'utf8')), 'with typed: false the page holds none of exam_typed.js');
  const {browser} = await L.launch(NAME);
  try {
    const count = page => page.evaluate(() => { let n = 0; for(let k = 0; k < 40; k++) n += drawPaper().filter(q => q.type === 'numeric' || q.type === 'match').length; return n; });
    const o = await L.openPage(browser, off.page);
    const nOff = await count(o.page);
    check(nOff === 0, 'typed: false keeps numeric and matching items off 40 papers', nOff);
    await o.ctx.close();

    const {ctx, page, errors} = await L.openPage(browser, on.page);
    const nOn = await count(page);
    check(nOn > 0, `typed: true puts them on papers (${nOn} on 40 papers of 10)`);
    await page.click('#nav button[data-v="exam"]');
    check(await page.evaluate(() => !!document.getElementById('exTypedNote')), 'the exam page says the paper draws calculations and matching items');
    // a fixed paper: the calculation, the matching item, and a multiple-choice item
    await page.evaluate(() => { const mc = QUESTIONS.find(q => !q.type && !q.multi);
      drawPaper = () => [byId('et-num'), byId('et-match'), mc]; });
    await page.click('#startExam');
    check(await page.evaluate(() => !!document.getElementById('exNum') && /calculation/.test(document.querySelector('#v-exam .qhead').textContent)),
          'the calculation is asked with a box to type the number, marked as a calculation');
    await page.fill('#exNum', '149');
    await page.waitForTimeout(200);
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await page.waitForTimeout(400);
    check(await page.evaluate(() => VIEW === 'exam' && (document.getElementById('exNum') || {}).value === '149'),
          'what was typed is kept through a reload');
    await page.fill('#exNum', '150 mg/hr');
    await page.click('#exNext');
    const rows = await page.evaluate(() => document.querySelectorAll('#v-exam select[data-exrow]').length);
    check(rows === 3, 'the matching item has a dropdown per row', rows);
    for(let r = 0; r < 3; r++) await page.selectOption(`#v-exam select[data-exrow="${r}"]`, String(r));
    await page.click('#exNext');
    await page.evaluate(() => { const q = EX.qs[2]; const k = EX.orders[2].indexOf(q.options.findIndex(o => o.correct));
      document.querySelectorAll('#v-exam .opt')[k].click(); });
    await page.click('#exEnd');
    await page.waitForTimeout(300);
    const res = await page.evaluate(() => ({h: document.querySelector('#v-exam h2').textContent,
      text: document.getElementById('v-exam').textContent, ans: DB.answers.slice(-3).map(a => [a.qid, a.result, a.picked]),
      log: LOG.slice(-3).map(e => e[3])}));
    check(/3 \/ 3/.test(res.h), 'the paper scores 3 of 3', res.h);
    const num = res.ans.find(a => a[0] === 'et-num'), mat = res.ans.find(a => a[0] === 'et-match');
    check(num && num[1] === 'correct' && num[2] === '150 mg/hr', 'the calculation is recorded right, with what was typed', res.ans);
    check(mat && mat[1] === 'correct' && JSON.stringify(mat[2]) === '[0,1,2]', 'the matching item is recorded right, with the pairs picked', res.ans);
    check(res.log.every(m => m === 'exam'), 'all three are in the answer history as exam answers', res.log);
    check(/you wrote 150 mg\/hr/.test(res.text) && /R = 150 mg\/hr/.test(res.text) && /Elimination rate constant/.test(res.text),
          'the result page shows the answer, what was typed, the working and the pairs');
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();
  } finally {
    await browser.close();
    on.rm(); off.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
