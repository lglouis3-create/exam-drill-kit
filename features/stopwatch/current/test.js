/* stopwatch: the module's own test. run_checks.sh runs it when the course switches
 * the module on (build.py --list-checks).
 *
 * In node, on the course's own page: the module is in the page and working; the
 * clock reads minutes and seconds as Basic-Pharmacokinetics' fmtClock did (src/
 * views.js line 1469 at ac2eb73) on 7 control times; the pace is the course's
 * `paceSeconds`.
 * The build: `paceSeconds` given as text, and an option the module does not take
 * (`targetSeconds`, the name the catalog used before the port), each stop the build
 * and say so.
 * In Chromium, on a scratch copy with one of Basic-Pharmacokinetics' calculation
 * questions added (ws6-b3f, src/q9_worksheets.js line 136 at ac2eb73; id prefixed
 * sw-, the professor, topic and skill set to the course's own), `paceSeconds: 120`
 * and the exam's papers drawing calculations (src/review_test.py lines 517-541
 * ported; the page's clock is moved forward instead of waiting): a calculation
 * shows one running clock; it counts in place; past 2 minutes it is red and says
 * "over 2:00"; after the answer it stops on the time taken, which is the `ms` the
 * engine recorded; an answer within the pace is shown in green; a multiple-choice
 * question has no clock; on an exam paper the calculation has its own clock, the
 * time on each question is added up while it is shown (Back adds to it), and each
 * answer of the submitted paper keeps its question's time as `ms`. On a copy with
 * `paceSeconds: 0`: the clock runs and stops the same way, with no pace.
 *
 *     node features/stopwatch/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const NAME = 'features/stopwatch/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

/* Basic-Pharmacokinetics src/q9_worksheets.js line 136, at ac2eb73: the calculation
   its src/review_test.py line 518 times (stem, units, answer, margin and citation). */
const PK_Q = {id: 'ws6-b3f', type: 'numeric',
  stem: 'A 80 kg patient is scheduled to receive a 20 mg/kg IV bolus injection of a medication every 6 hours. The drug has an apparent volume of distribution that is 25% of body weight and a total body clearance is 4.62 L/hr. Determine the following for this medication in this patient: f. Average steady-state plasma drug concentration.',
  units: 'mg/L', answer: 57.72, tol: 0.58, cite: 'Multiple-IV-Bolus-Practice-3---Solutions.pdf, part f'};
// Basic-Pharmacokinetics' fmtClock (src/views.js line 1469, at ac2eb73)
const pkClock = ms => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const CONTROLS = [0, 499, 59499, 59500, 125000, 3600000, -5000];

const qfile = '/* one of Basic-Pharmacokinetics\' calculation questions (ws6-b3f, src/q9_worksheets.js, ac2eb73), added by the stopwatch test */\n' +
  `QUESTIONS.push(Object.assign({prof:COURSE.professors[0], tier:'new', topic:TOPICS[0].id, sub:TOPICS[0].subs[0].id, concept:'sw-calc',
    skill:(COURSE.skills.find(s => s.id === 'calc') || COURSE.skills[0]).id, source:'slide', tags:['calculation'],
    teach:'The average level at steady state from the dose, the volume, the rate constant and the interval.',
    steps:[{k:'setup', t:'Cavg = F D0 / (VD k tau), with F = 1'}]},
    ${JSON.stringify(Object.assign({}, PK_Q, {id: 'sw-calc', cite: undefined}))},
    {cite:'Test (' + COURSE.lectures[0].deck + ') slide 1; Basic-Pharmacokinetics ${PK_Q.cite}'}));\n`;
const typedLine = 'COURSE.exams.forEach(e => { e.typed = true; });';
const meta = path.join(__dirname);
const paceLine = p => L.featureOn(meta, {paceSeconds: p});

/* Date.now moved forward by window.__off, so a test can let minutes pass at once */
const clockInit = () => { window.__off = 0; const real = Date.now.bind(Date); Date.now = () => real() + window.__off; };

(async () => {
  console.log('\n=== the course\'s own page (node) ===');
  L.PAGE.need(NAME);
  const X = L.engine('({FX: typeof FX === "undefined" ? null : FX})');
  const A = X.FX && X.FX.api('stopwatch');
  if(!check(!!A, 'the page carries stopwatch, working', JSON.stringify((X.FX && X.FX.errors) || 'no feature modules in the page'))) L.finish(NAME);
  const off = CONTROLS.filter(ms => A.fmtClock(ms) !== pkClock(ms)).map(ms => `${ms}: ${A.fmtClock(ms)} against ${pkClock(ms)}`);
  check(!off.length, `the clock reads as Basic-Pharmacokinetics' fmtClock on ${CONTROLS.length} control times (0:00, 0:00, 0:59, 1:00, 2:05, 60:00, 0:00)`, off.join('; '));
  const mine = X.FX.modules().find(m => m.name === 'stopwatch') || {};
  const want = Math.max(0, +((mine.options || {}).paceSeconds) || 0) * 1000;
  check(A.pace === want, `the pace is the course's paceSeconds (${want / 1000} s)`, A.pace);

  console.log('\n=== the build stops on a bad option ===');
  for(const [label, line, re] of [
    ['paceSeconds given as text', paceLine('two minutes'), /paceSeconds is str; stopwatch expects int/],
    ['an option the module does not take (targetSeconds)', L.featureOn(meta, {targetSeconds: 120}), /sets \['targetSeconds'\], which stopwatch v1 does not take/]]){
    const r = L.scratchBuild('stopwatch-refuse', {courseLine: line});
    check(r.code !== 0 && re.test(r.out), `${label} stops the build and says so`, r.out.split('\n').slice(-2).join(' '));
    r.rm();
  }

  console.log('\n=== on a scratch copy with a Basic-Pharmacokinetics calculation, pace 2:00 (Chromium) ===');
  const s = L.scratchBuild('stopwatch', {files: {'q93_stopwatch_test.js': qfile}, courseLine: paceLine(120) + typedLine});
  if(s.code !== 0) L.notRun(NAME, 'the scratch copy with the test question does not build: ' + s.out.split('\n').pop());
  const s0 = L.scratchBuild('stopwatch-nopace', {files: {'q93_stopwatch_test.js': qfile}, courseLine: paceLine(0)});
  const {browser} = await L.launch(NAME);
  try {
    const {ctx, page, errors} = await L.openPage(browser, s.page, {viewport: {width: 1100, height: 1200}}, clockInit);
    const ev = (f, a) => page.evaluate(f, a);
    const timer = sel => ev(sel => { const t = document.querySelector(sel + ' .qtimer');
      return t ? {n: document.querySelectorAll(sel + ' .qtimer').length, text: t.textContent, cls: t.className, title: t.title, running: t.hasAttribute('data-start'),
                  inHead: !!t.closest('.qhead')} : null; }, sel);

    await L.quizOn(page, ['sw-calc', 'sw-calc']);
    await page.waitForTimeout(150);
    let t = await timer('#v-quiz');
    check(t && t.n === 1 && t.running && t.inHead && /^⏱ 0:0\d$/.test(t.text), 'a calculation shows one running clock in its card head', t);
    check(t && /The professor's pace: 2:00 or less per calculation/.test(t.title), 'its title gives the professor\'s pace', t && t.title);
    const same = await ev(() => { window.__el = document.querySelector('#v-quiz .qtimer'); window.__off += 3000; FX.api('stopwatch').tickTimers();
      return window.__el ? {same: document.querySelector('#v-quiz .qtimer') === window.__el, text: window.__el.textContent} : null; });
    check(same && same.same &&/^⏱ 0:0[3-4]$/.test(same.text), 'it counts in place (the same element, the text moved on)', same);
    await ev(() => { window.__off += 122000; FX.api('stopwatch').tickTimers(); });
    t = await timer('#v-quiz');
    check(t && /over 2:00/.test(t.text) && /\bover\b/.test(t.cls), 'past 2 minutes it is red and says over 2:00', t);
    await page.fill('#numIn', '57.72'); await page.press('#numIn', 'Enter');
    await page.waitForTimeout(200);
    t = await timer('#v-quiz');
    const last = await ev(() => DB.answers[DB.answers.length - 1]);
    check(t && !t.running && /^⏱ took 2:0\d · over 2:00$/.test(t.text) && /\bdone\b/.test(t.cls) && /\bover\b/.test(t.cls), 'after the answer it stops on the time taken, over the pace', t);
    check(last.qid === 'sw-calc' && last.ms >= 125000 && t && t.text.includes('took ' + pkClock(last.ms)), 'the time shown is the ms the engine recorded with the answer', {ms: last.ms, text: t && t.text});
    await page.click('#btnNext'); await page.waitForTimeout(150);
    await ev(() => { window.__off += 30000; });
    await page.fill('#numIn', '57.72'); await page.press('#numIn', 'Enter');
    await page.waitForTimeout(200);
    t = await timer('#v-quiz');
    check(t && /^⏱ took 0:3\d$/.test(t.text) && /\bunder\b/.test(t.cls) && !/over/.test(t.text + t.cls), 'an answer within the pace is shown in green, with no "over"', t);

    const mc = await ev(() => (QUESTIONS.find(q => !q.type && EXAM.pools.some(p => p.test(q))) || {}).id);
    await L.quizOn(page, [mc]); await page.waitForTimeout(150);
    check(mc && !(await timer('#v-quiz')), 'a multiple-choice question has no clock', mc);

    if(await ev(() => typeof EXAM_TYPED !== 'undefined' && EXAM_TYPED.allows)){
      await ev(mc => { drawPaper = () => [byId('sw-calc'), byId(mc)]; show('exam'); }, mc);
      await page.click('#startExam'); await page.waitForTimeout(150);
      t = await timer('#v-exam');
      check(t && t.running && t.inHead, 'an exam calculation shows its own clock', t);
      await page.fill('#exNum', '57.72');
      await ev(() => { window.__off += 40000; document.getElementById('exNext').click(); });
      await page.waitForTimeout(150);
      check(!(await timer('#v-exam')), 'the multiple-choice question of the paper has no clock');
      await page.click('#v-exam .opt');
      await ev(() => { window.__off += 20000; document.getElementById('exPrev').click(); });
      await page.waitForTimeout(150);
      const back = await ev(() => ({spent: FX.api('stopwatch').spent().map(x => Math.round(x / 1000)), text: (document.querySelector('#v-exam .qtimer') || {}).textContent}));
      check(back.spent[0] >= 40 && back.spent[1] >= 20 && /^⏱ 0:4\d$/.test(back.text || ''), `the time on each paper question is added up while it is shown: ${back.spent.join(', ')} s; back on the calculation its clock reads ${back.text}`, back);
      await ev(() => { window.__off += 5000; });
      const n0 = await ev(() => DB.answers.length);
      await page.click('#exEnd'); await page.waitForTimeout(300);
      const paper = await ev(n0 => DB.answers.slice(n0).map(a => ({qid: a.qid, ms: a.ms})), n0);
      const calc = paper.find(a => a.qid === 'sw-calc'), other = paper.find(a => a.qid === mc);
      check(paper.length === 2 && calc && calc.ms >= 45000 && other && other.ms >= 20000 && other.ms < 45000,
            'each answer of the submitted paper keeps its question\'s time as ms (Back added to the calculation\'s)', paper);
      check(!(await timer('#v-exam')), 'the result page shows no clock');
    } else L.skip('the clock on an exam paper', 'the active exam does not draw calculations (exams[].typed is off)');
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();

    console.log('\n=== on a copy with paceSeconds 0 (Chromium) ===');
    if(s0.code !== 0) check(false, 'the copy with paceSeconds 0 builds', s0.out.split('\n').pop());
    else {
      const o = await L.openPage(browser, s0.page, {viewport: {width: 1100, height: 1200}}, clockInit);
      await L.quizOn(o.page, ['sw-calc']); await o.page.waitForTimeout(150);
      await o.page.evaluate(() => { window.__off += 130000; FX.api('stopwatch').tickTimers(); });
      const r = await o.page.evaluate(() => { const t = document.querySelector('#v-quiz .qtimer'); return t && {text: t.textContent, cls: t.className, title: t.title}; });
      check(r && /^⏱ 2:1\d$/.test(r.text) && !/over/.test(r.cls) && r.title === 'Time on this calculation', 'the clock runs with no pace and no "over"', r);
      await o.page.fill('#numIn', '57.72'); await o.page.press('#numIn', 'Enter'); await o.page.waitForTimeout(200);
      const d = await o.page.evaluate(() => { const t = document.querySelector('#v-quiz .qtimer'); return t && {text: t.textContent, cls: t.className}; });
      check(d && /^⏱ took 2:1\d$/.test(d.text) && !/over|under/.test(d.cls), 'it stops on the time taken, with no pace colour', d);
      check(!o.errors.length, 'no page error with paceSeconds 0', o.errors.slice(0, 3).join(' | '));
      await o.ctx.close();
    }
  } finally {
    await browser.close();
    s.rm(); s0.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
