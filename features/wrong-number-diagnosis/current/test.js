/* wrong-number-diagnosis: the module's own test. run_checks.sh runs it when the
 * course switches the module on (build.py --list-checks).
 *
 * In node, on the course's own page (Basic-Pharmacokinetics src/test.js lines
 * 368-387 ported): its probe question (two givens whose product is the key) read for
 * eleven wrong numbers, each to the slip behind it (givens combined the wrong way, a
 * unit factor, the key upside down, a given carried across, a value from the
 * working, a near miss, none for the key or for no number); the reading quotes both
 * givens and both operations; no keyed answer of the bank is read as a slip.
 * In Chromium, on a scratch copy with the probe added: a wrong answer shows what the
 * number says beside the miss chips and marks the chip it points to; the pick is
 * kept as the answer's `miss` with the number's reading as `missSuggest`; a pick that
 * differs is followed by the line the number pointed to; Weak spots counts the
 * pick; a progress saved with Basic-Pharmacokinetics' `missKind` counts there after
 * a reload (the converter), and after Import; and, when the active exam draws
 * calculations (exams[].typed), a paper's result page shows the reading too.
 *
 *     node features/wrong-number-diagnosis/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/wrong-number-diagnosis/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

// Basic-Pharmacokinetics src/test.js lines 368-373, at ac2eb73
const PROBE = {id: 'diag-probe', type: 'numeric', stem: 'A drug has an average steady-state concentration of 42.37 mg/L and an apparent VD of 17.03 L. Calculate the amount of drug in the body.',
  answer: 721.6, tol: 2, units: 'mg', steps: [{k: 'setup', t: 'D = Cavg × VD'}, {k: 'algebra', t: 'an amount of 350 mg on the way (an intermediate for the probe)'}]};
const WANT = [['2.49', 'algebra'], ['721600', 'unit'], ['0.7216', 'unit'], ['42.37', 'setup'], ['350', 'setup'], ['0.001386', 'algebra'],
              ['500', 'setup'], ['43300', 'unit'], ['700', 'round'], ['721.6', 'none'], ['nonsense', 'none']];

(async () => {
  console.log('\n=== reading a wrong number (node) ===');
  L.PAGE.need(NAME);
  const X = L.engine('({FX, QUESTIONS})');
  const A = X.FX && X.FX.api('wrong-number-diagnosis');
  if(!check(!!A, 'the page carries wrong-number-diagnosis, working', JSON.stringify((X.FX && X.FX.errors) || []))) L.finish(NAME);
  const dx = e => (A.missDiagnosis(PROBE, e)[0] || {}).kind || 'none';
  const off = WANT.filter(([e, k]) => dx(e) !== k).map(([e, k]) => `${e} read ${dx(e)}, expected ${k}`);
  check(!off.length, `${WANT.length} wrong numbers read for the slip behind them (givens swapped, unit factor, reciprocal, a given carried, stopped early, near miss)`, off.join('; '));
  const t = (A.missDiagnosis(PROBE, '2.49')[0] || {}).text || '';
  check(/42\.37 ÷ 17\.03/.test(t) && /42\.37 × 17\.03/.test(t), 'the reading quotes the two givens and both operations', t);
  const keyed = X.QUESTIONS.filter(q => q.type === 'numeric' && A.missDiagnosis(q, String(q.answer)).length).map(q => q.id);
  check(!keyed.length, `no keyed answer of the bank's ${X.QUESTIONS.filter(q => q.type === 'numeric').length} numeric items is read as a slip`, keyed.join(', '));

  console.log('\n=== in the quiz (Chromium, scratch copy) ===');
  const qfile = '/* the probe of Basic-Pharmacokinetics src/test.js line 368, added by the wrong-number-diagnosis test */\n' +
    `QUESTIONS.push(Object.assign({prof:COURSE.professors[0], tier:'new', topic:TOPICS[0].id, sub:TOPICS[0].subs[0].id, concept:'wnd-probe',
      skill:COURSE.skills[0].id, source:'slide', tags:[], teach:'Amount in the body from the average level and the volume.',
      cite:'Test (' + COURSE.lectures[0].deck + ') slide 1'}, ${JSON.stringify(Object.assign({}, PROBE, {id: 'wnd-probe'}))}));\n`;
  const s = L.scratchBuild('wrongnumber', {files: {'q92_wrong_number_test.js': qfile}});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the probe does not build: ' + s.out.split('\n').pop());
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, s.page);
    await L.quizOn(page, ['wnd-probe', 'wnd-probe']);
    await page.fill('#numIn', '2.49'); await page.click('#btnCheck');
    const a = await page.evaluate(() => ({list: [...document.querySelectorAll('#v-quiz .fxmiss li')].map(l => l.textContent),
      marked: [...document.querySelectorAll('#v-quiz .misspick .fxsuggest')].map(b => b.dataset.miss),
      before: !!document.querySelector('#v-quiz .fxmiss') && !!(document.querySelector('#v-quiz .fxmiss').compareDocumentPosition(document.querySelector('#v-quiz .misspick')) & Node.DOCUMENT_POSITION_FOLLOWING),
      last: DB.answers[DB.answers.length - 1]}));
    check(a.list.length >= 1 && /42\.37 ÷ 17\.03/.test(a.list[0]) && /Algebra/.test(a.list[0]), 'a wrong answer shows what the number says, with its kind', a.list);
    check(a.before && a.marked.join() === 'algebra', 'beside the miss chips, the chip it points to marked', a);
    check(a.last.qid === 'wnd-probe' && a.last.result === 'wrong' && a.last.missSuggest === 'algebra' && !a.last.miss,
          'the number\'s reading is kept with the answer as missSuggest; the pick is still the student\'s', a.last);
    await page.click('#v-quiz .misspick [data-miss="setup"]');
    const b = await page.evaluate(() => ({last: DB.answers[DB.answers.length - 1], text: document.getElementById('v-quiz').textContent}));
    check(b.last.miss === 'setup' && b.last.missSuggest === 'algebra', 'the pick is kept as miss, beside missSuggest', b.last);
    check(/Logged as a Setup miss\. The number itself pointed to algebra\./.test(b.text), 'a pick that differs is followed by what the number pointed to');
    await page.click('#nav button[data-v="gaps"]');
    check(await page.evaluate(() => /Calculation misses, by kind/.test(document.getElementById('v-gaps').textContent)), 'Weak spots counts the pick');

    // a progress saved by Basic-Pharmacokinetics' drill: missKind, no miss
    await page.evaluate(() => { DB.answers.forEach(a => { if(a.qid === 'wnd-probe'){ a.missKind = 'unit'; delete a.miss; } }); store.set(keyFor(PROFILE), JSON.stringify(DB)); });
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    await page.waitForTimeout(300);
    const c = await page.evaluate(() => { show('gaps'); const rows = [...document.querySelectorAll('#v-gaps table.gap')].find(t => /Kind of miss/.test(t.textContent));
      return {miss: DB.answers.filter(a => a.qid === 'wnd-probe').map(a => a.miss), converted: FX.api('wrong-number-diagnosis').converted(),
              unit: rows ? /Unit conversion\s*1/.test(rows.textContent) : false}; });
    check(c.miss.length && c.miss.every(m => m === 'unit') && c.converted >= 1, 'a saved missKind becomes miss when the progress is loaded', c);
    check(c.unit, 'and Weak spots counts it (Unit conversion: 1)', c);
    const imp = await page.evaluate(() => { const db = JSON.parse(JSON.stringify(DB)); db.answers.forEach(a => { if(a.qid === 'wnd-probe'){ a.missKind = 'round'; delete a.miss; } });
      return upgradeDB(db).answers.filter(a => a.qid === 'wnd-probe').map(a => a.miss); });
    check(imp.length && imp.every(m => m === 'round'), 'and when a progress is imported', imp);

    // an exam paper's result page, when the exam draws calculations (exams[].typed)
    if(await page.evaluate(() => typeof EXAM_TYPED !== 'undefined' && EXAM_TYPED.allows)){
      await page.evaluate(() => { drawPaper = () => [byId('wnd-probe')]; show('exam'); });
      await page.click('#startExam');
      await page.fill('#exNum', '2.49');
      await page.click('#exEnd');
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => ({list: [...document.querySelectorAll('#v-exam .fxmiss li')].map(l => l.textContent),
        last: DB.answers[DB.answers.length - 1]}));
      check(r.list.length && /42\.37 ÷ 17\.03/.test(r.list[0]) && r.last.missSuggest === 'algebra', 'on a paper\'s result page too, and kept with the exam answer', r);
    } else L.skip('a paper\'s result page', 'the active exam does not draw calculations (exams[].typed is off)');
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();
  } finally {
    await browser.close();
    s.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
