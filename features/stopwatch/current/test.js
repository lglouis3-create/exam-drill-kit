/* stopwatch: the module's own test. run_checks.sh runs it when the course switches
 * the module on (build.py --list-checks).
 *
 * The course data is Basic-Pharmacokinetics' own (ac2eb73), in test_fixture.js: its
 * Exam 3 (final), the 5 numeric questions of the professor's Canvas Quiz 4 (the quiz
 * whose pace is "2 minutes or less", src/course.js line 264) and the single-answer and
 * select-all questions that fill Exam 3's pools. The module's own course
 * (ci/oncourse.js) holds exactly that data; on any other course the test's scratch
 * copies add it.
 *
 * In node, on the course's own page: the module is in the page and working; the
 * clock reads minutes and seconds as Basic-Pharmacokinetics' fmtClock did (src/
 * views.js line 1469) on 7 control times; the pace is the course's `paceSeconds`;
 * on the module's own course, the course holds Basic-Pharmacokinetics' Exam 3 as its
 * exam and the 5 calculations as typed questions.
 * The build: `paceSeconds` given as text, and an option the module does not take
 * (`targetSeconds`, the name the catalog used before the port), each stop the build
 * and say so.
 * In Chromium (src/review_test.py lines 517-541 ported; the page's clock is moved
 * forward instead of waiting), with `paceSeconds: 120`:
 *   - the quiz, on the Quiz 4 calculation cq4-2: one running clock; it counts in
 *     place; past 2 minutes it is red and says "over 2:00"; after the answer it
 *     stops on the time taken, which is the `ms` the engine recorded; an answer
 *     within the pace is shown in green; a multiple-choice question has no clock;
 *   - a paper of Exam 3 as the course has it (no `typed`, so the kit draws no
 *     calculation onto it): the paper has the exam's 40 questions and no clock; the
 *     time on each question is added up while it is shown (Back adds to it); the
 *     answers of the submitted paper keep their question's time as `ms`, also after
 *     a reload 400 ms later (the core saves 150 ms after a change);
 *   - a scratch copy with the core option `typed: true` on Exam 3 (Basic-
 *     Pharmacokinetics' own engine draws calculations onto every paper without an
 *     option; the kit core needs this one): a calculation on the paper has its own
 *     clock, and its time is kept with its answer;
 *   - a copy with `paceSeconds: 0`: the clock runs and stops the same way, with no pace.
 *
 *     node features/stopwatch/test.js
 */
const fs = require('fs'), path = require('path');
const L = require(path.join(__dirname, '..', '..', 'check_lib'));
const FX = require(path.join(__dirname, 'test_fixture.js'));
const NAME = 'features/stopwatch/test.js';
const {check} = L;
delete process.env.DRILL_PAGE;

// Basic-Pharmacokinetics' fmtClock (src/views.js line 1469, at ac2eb73)
const pkClock = ms => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const CONTROLS = [0, 499, 59499, 59500, 125000, 3600000, -5000];
const CALC = FX.pre(FX.FIX.calc[0]);                                   // sw-cq4-2
const CALC_Q = FX.FIX.qs.find(q => q.id === FX.FIX.calc[0]);
const ANSWER = String(CALC_Q.answer);                                  // the professor's key, 151.1
const meta = path.join(__dirname);
const paceLine = p => L.featureOn(meta, {paceSeconds: p});
const typedLine = `COURSE.exams.forEach(e => { if(e.id === ${JSON.stringify(FX.FIX.activeExam)}) e.typed = true; });`;

/* Date.now moved forward by window.__off, so a test can let minutes pass at once */
const clockInit = () => { window.__off = 0; const real = Date.now.bind(Date); Date.now = () => real() + window.__off; };

(async () => {
  console.log('\n=== the course\'s own page (node) ===');
  L.PAGE.need(NAME);
  const X = L.engine('({FX: typeof FX === "undefined" ? null : FX, QUESTIONS, COURSE, EXAM,' +
    ' EQ: typeof EQUATIONS !== "undefined" && Array.isArray(EQUATIONS) ? EQUATIONS.map(e => e && e.id) : [],' +
    ' ASK: typeof ASKS !== "undefined" && ASKS && typeof ASKS === "object" ? Object.keys(ASKS) : []})');
  const A = X.FX && X.FX.api('stopwatch');
  if(!check(!!A, 'the page carries stopwatch, working', JSON.stringify((X.FX && X.FX.errors) || 'no feature modules in the page'))) L.finish(NAME);
  const off = CONTROLS.filter(ms => A.fmtClock(ms) !== pkClock(ms)).map(ms => `${ms}: ${A.fmtClock(ms)} against ${pkClock(ms)}`);
  check(!off.length, `the clock reads as Basic-Pharmacokinetics' fmtClock on ${CONTROLS.length} control times (0:00, 0:00, 0:59, 1:00, 2:05, 60:00, 0:00)`, off.join('; '));
  const mine = X.FX.modules().find(m => m.name === 'stopwatch') || {};
  const coursePace = Math.max(0, +((mine.options || {}).paceSeconds) || 0);
  check(A.pace === coursePace * 1000, `the pace is the course's paceSeconds (${coursePace} s)`, A.pace);
  const ids = FX.FIX.qs.map(q => FX.pre(q.id)), have = new Set(X.QUESTIONS.map(q => q.id));
  const holds = ids.every(id => have.has(id)) && X.EXAM.name === FX.FIX.exam.name;
  if(holds){
    const calcs = FX.FIX.calc.map(id => X.QUESTIONS.find(q => q.id === FX.pre(id)));
    check(calcs.every(q => q && q.type === 'numeric'), `the course holds the ${calcs.length} calculations of the professor's Quiz 4 as typed questions (${FX.FIX.calc.map(FX.pre).join(', ')})`,
          calcs.map(q => q && q.id + ':' + q.type));
    check(X.EXAM.questions === FX.FIX.exam.questions && X.EXAM.minutes === FX.FIX.exam.minutes && !X.EXAM.typed,
          `its exam is Basic-Pharmacokinetics' ${FX.FIX.exam.name}: ${X.EXAM.questions} questions, ${X.EXAM.minutes} minutes, no typed (as the course has it)`, {questions: X.EXAM.questions, typed: X.EXAM.typed});
  } else L.skip('the course holds Basic-Pharmacokinetics\' data', 'this is not the module\'s own course; the scratch copies below add it');

  console.log('\n=== the build stops on a bad option ===');
  for(const [label, line, re] of [
    ['paceSeconds given as text', paceLine('two minutes'), /paceSeconds is str; stopwatch expects int/],
    ['an option the module does not take (targetSeconds)', L.featureOn(meta, {targetSeconds: 120}), /sets \['targetSeconds'\], which stopwatch v1 does not take/]]){
    const r = L.scratchBuild('stopwatch-refuse', {courseLine: line});
    check(r.code !== 0 && re.test(r.out), `${label} stops the build and says so`, r.out.split('\n').slice(-2).join(' '));
    r.rm();
  }

  /* a scratch copy of this course, with Basic-Pharmacokinetics' data added when the course does not hold it
     (a setup line or asks key is written only when the course has that equation or ASKS key, as ci/oncourse.js does) */
  const copy = (label, line) => {
    const data = holds ? null : FX.courseData({eq: X.EQ, asks: X.ASK});
    return L.scratchBuild(label, {files: data ? data.files : {}, courseLine: (data ? data.courseLine : '') + line,
      edit: src => { if(data){ const f = path.join(src, 'images.json'); fs.writeFileSync(f, FX.withImages(fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '{}')); } }});
  };
  const own = holds && coursePace === 120;
  const s = own ? null : copy('stopwatch', paceLine(120));
  if(s && s.code !== 0) L.notRun(NAME, 'the scratch copy with Basic-Pharmacokinetics\' data does not build: ' + s.out.split('\n').pop());
  const st = copy('stopwatch-typed', paceLine(120) + typedLine);
  const s0 = copy('stopwatch-nopace', paceLine(0));
  const {browser} = await L.launch(NAME);
  try {
    console.log(`\n=== ${own ? 'the module\'s own course' : 'a scratch copy with Basic-Pharmacokinetics\' data'}, pace 2:00 (Chromium) ===`);
    const {ctx, page, errors} = await L.openPage(browser, own ? L.PAGE.PAGE : s.page, {viewport: {width: 1100, height: 1200}}, clockInit);
    const ev = (f, a) => page.evaluate(f, a);
    const timer = (pg, sel) => pg.evaluate(sel => { const t = document.querySelector(sel + ' .qtimer');
      return t ? {n: document.querySelectorAll(sel + ' .qtimer').length, text: t.textContent, cls: t.className, title: t.title, running: t.hasAttribute('data-start'),
                  inHead: !!t.closest('.qhead')} : null; }, sel);

    await L.quizOn(page, [CALC, CALC]);
    await page.waitForTimeout(150);
    let t = await timer(page, '#v-quiz');
    check(t && t.n === 1 && t.running && t.inHead && /^⏱ 0:0\d$/.test(t.text), `a calculation (${CALC}, the professor's Quiz 4) shows one running clock in its card head`, t);
    check(t && /The professor's pace: 2:00 or less per calculation/.test(t.title), 'its title gives the professor\'s pace', t && t.title);
    const same = await ev(() => { window.__el = document.querySelector('#v-quiz .qtimer'); window.__off += 3000; FX.api('stopwatch').tickTimers();
      return window.__el ? {same: document.querySelector('#v-quiz .qtimer') === window.__el, text: window.__el.textContent} : null; });
    check(same && same.same && /^⏱ 0:0[3-4]$/.test(same.text), 'it counts in place (the same element, the text moved on)', same);
    await ev(() => { window.__off += 122000; FX.api('stopwatch').tickTimers(); });
    t = await timer(page, '#v-quiz');
    check(t && /over 2:00/.test(t.text) && /\bover\b/.test(t.cls), 'past 2 minutes it is red and says over 2:00', t);
    await page.fill('#numIn', ANSWER); await page.press('#numIn', 'Enter');
    await page.waitForTimeout(200);
    t = await timer(page, '#v-quiz');
    const last = await ev(() => DB.answers[DB.answers.length - 1]);
    check(t && !t.running && /^⏱ took 2:0\d · over 2:00$/.test(t.text) && /\bdone\b/.test(t.cls) && /\bover\b/.test(t.cls), 'after the answer it stops on the time taken, over the pace', t);
    check(last.qid === CALC && last.result === 'correct' && last.ms >= 125000 && t && t.text.includes('took ' + pkClock(last.ms)),
          `the time shown is the ms the engine recorded with the answer (the professor's key ${ANSWER}, graded right)`, {ms: last.ms, result: last.result, text: t && t.text});
    await page.click('#btnNext'); await page.waitForTimeout(150);
    await ev(() => { window.__off += 30000; });
    await page.fill('#numIn', ANSWER); await page.press('#numIn', 'Enter');
    await page.waitForTimeout(200);
    t = await timer(page, '#v-quiz');
    check(t && /^⏱ took 0:3\d$/.test(t.text) && /\bunder\b/.test(t.cls) && !/over/.test(t.text + t.cls), 'an answer within the pace is shown in green, with no "over"', t);

    const mc = await ev(() => (QUESTIONS.find(q => !q.type && q.id.startsWith('sw-') && EXAM.pools.some(p => p.test(q))) || {}).id);
    await L.quizOn(page, [mc]); await page.waitForTimeout(150);
    check(mc && !(await timer(page, '#v-quiz')), `a multiple-choice question (${mc}) has no clock`, mc);

    // a paper of the exam as the course has it: no typed, so no calculation on it
    await ev(() => show('exam'));
    await page.click('#startExam'); await page.waitForTimeout(150);
    const drawn = await ev(() => ({n: EX.qs.length, calc: EX.qs.filter(q => q.type).length, want: EXAM.questions, name: EXAM.name}));
    check(drawn.n === drawn.want && drawn.calc === 0 && !(await timer(page, '#v-exam')),
          `a paper of ${drawn.name} as the course has it: ${drawn.n} questions, ${drawn.calc} calculations, no clock`, drawn);
    await page.click('#v-exam .opt');
    await ev(() => { window.__off += 40000; document.getElementById('exNext').click(); });
    await page.waitForTimeout(150);
    await page.click('#v-exam .opt');
    await ev(() => { window.__off += 20000; document.getElementById('exPrev').click(); });
    await page.waitForTimeout(150);
    const back = await ev(() => FX.api('stopwatch').spent().slice(0, 3).map(x => Math.round(x / 1000)));
    check(back[0] >= 40 && back[1] >= 20 && back[1] < 40, `the time on each paper question is added up while it is shown: ${back.slice(0, 2).join(', ')} s`, back);
    await ev(() => { window.__off += 5000; });
    let n0 = await ev(() => DB.answers.length);
    await page.click('#exEnd'); await page.waitForTimeout(300);                      // "Submit what I have answered" (the dialog is accepted)
    let paper = await ev(n0 => DB.answers.slice(n0).map(a => ({qid: a.qid, ms: a.ms})), n0);
    const ids2 = await ev(() => EX.qs.slice(0, 2).map(q => q.id));
    const a0 = paper.find(a => a.qid === ids2[0]), a1 = paper.find(a => a.qid === ids2[1]);
    check(paper.length === 2 && a0 && a0.ms >= 45000 && a1 && a1.ms >= 20000 && a1.ms < 45000,
          'the 2 answers of the submitted paper keep their question\'s time as ms (Back added to the first one\'s)', paper);
    check(!(await timer(page, '#v-exam')), 'the result page shows no clock');
    // the times are saved with the progress: the core writes 150 ms after the last change
    await page.waitForTimeout(400); await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
    const kept = await ev(n0 => DB.answers.slice(n0).map(a => ({qid: a.qid, ms: a.ms})), n0);
    check(JSON.stringify(kept) === JSON.stringify(paper), 'after a reload the paper\'s answers come back with their times', kept);
    check(!errors.length, 'no page error', errors.slice(0, 3).join(' | '));
    await ctx.close();

    console.log('\n=== a copy with typed: true on the exam: a calculation on the paper (Chromium) ===');
    if(st.code !== 0) check(false, 'the copy with typed: true builds', st.out.split('\n').pop());
    else {
      const o = await L.openPage(browser, st.page, {viewport: {width: 1100, height: 1200}}, clockInit);
      const p = o.page;
      if(await p.evaluate(() => typeof EXAM_TYPED !== 'undefined' && EXAM_TYPED.allows)){
        await p.evaluate(([c, mc]) => { drawPaper = () => [byId(c), byId(mc)]; show('exam'); }, [CALC, mc]);
        await p.click('#startExam'); await p.waitForTimeout(150);
        t = await timer(p, '#v-exam');
        check(t && t.running && t.inHead, `an exam calculation (${CALC}) shows its own clock`, t);
        await p.fill('#exNum', ANSWER);
        await p.evaluate(() => { window.__off += 40000; document.getElementById('exNext').click(); });
        await p.waitForTimeout(150);
        check(!(await timer(p, '#v-exam')), 'the multiple-choice question of the paper has no clock');
        await p.click('#v-exam .opt');
        await p.evaluate(() => { window.__off += 20000; document.getElementById('exPrev').click(); });
        await p.waitForTimeout(150);
        const b2 = await p.evaluate(() => ({spent: FX.api('stopwatch').spent().map(x => Math.round(x / 1000)), text: (document.querySelector('#v-exam .qtimer') || {}).textContent}));
        check(b2.spent[0] >= 40 && b2.spent[1] >= 20 && /^⏱ 0:4\d$/.test(b2.text || ''), `back on the calculation its clock reads its time so far: ${b2.text}`, b2);
        await p.evaluate(() => { window.__off += 5000; });
        n0 = await p.evaluate(() => DB.answers.length);
        await p.click('#exEnd'); await p.waitForTimeout(300);
        paper = await p.evaluate(n0 => DB.answers.slice(n0).map(a => ({qid: a.qid, ms: a.ms, result: a.result})), n0);
        const calc = paper.find(a => a.qid === CALC), other = paper.find(a => a.qid === mc);
        check(paper.length === 2 && calc && calc.ms >= 45000 && calc.result === 'correct' && other && other.ms >= 20000 && other.ms < 45000,
              'each answer of the submitted paper keeps its question\'s time as ms, the calculation\'s too', paper);
      } else check(false, 'the copy with typed: true draws calculations onto the paper', 'EXAM_TYPED.allows is false');
      check(!o.errors.length, 'no page error on the copy with typed: true', o.errors.slice(0, 3).join(' | '));
      await o.ctx.close();
    }

    console.log('\n=== on a copy with paceSeconds 0 (Chromium) ===');
    if(s0.code !== 0) check(false, 'the copy with paceSeconds 0 builds', s0.out.split('\n').pop());
    else {
      const o = await L.openPage(browser, s0.page, {viewport: {width: 1100, height: 1200}}, clockInit);
      await L.quizOn(o.page, [CALC]); await o.page.waitForTimeout(150);
      await o.page.evaluate(() => { window.__off += 130000; FX.api('stopwatch').tickTimers(); });
      const r = await o.page.evaluate(() => { const t = document.querySelector('#v-quiz .qtimer'); return t && {text: t.textContent, cls: t.className, title: t.title}; });
      check(r && /^⏱ 2:1\d$/.test(r.text) && !/over/.test(r.cls) && r.title === 'Time on this calculation', 'the clock runs with no pace and no "over"', r);
      await o.page.fill('#numIn', ANSWER); await o.page.press('#numIn', 'Enter'); await o.page.waitForTimeout(200);
      const d = await o.page.evaluate(() => { const t = document.querySelector('#v-quiz .qtimer'); return t && {text: t.textContent, cls: t.className}; });
      check(d && /^⏱ took 2:1\d$/.test(d.text) && !/over|under/.test(d.cls), 'it stops on the time taken, with no pace colour', d);
      check(!o.errors.length, 'no page error with paceSeconds 0', o.errors.slice(0, 3).join(' | '));
      await o.ctx.close();
    }
  } finally {
    await browser.close();
    if(s) s.rm(); st.rm(); s0.rm();
  }
  L.finish(NAME);
})().catch(e => { console.log('FAIL: ' + NAME + ': crashed: ' + (e && e.stack || e)); process.exit(1); });
