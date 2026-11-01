/* An exam whose question count or pool marks are not set.
 *
 * skill/SKILL.md allows `exams[].questions: null` (the number of questions is
 * not announced) and `pools[].marks: null`. On the core before nullexam.js a
 * course with those values drew an exam paper of 0 questions and stopped with
 * a TypeError in renderExamQ, Topics said "null questions", and the displays
 * that weight by marks printed or computed with null (BDK move assessment,
 * 2026-11-01, §4).
 *
 * Checked on scratch copies of this source tree, each with one line appended
 * to course.js after the COURSE object (oldcache_test.js does the same), so it
 * runs the same on any course:
 *   1. the active exam with `questions: null` and every pool `marks: null`
 *      (a pool on new material is added when no pool filters by tier, so the
 *      Weighting chips are on screen);
 *   2. `questions: null`, the marks as the course sets them (2 on each pool
 *      when the course sets none, so the case is the same on every course);
 *   3. every pool `marks: null`, the count as the course sets it (4 when the
 *      course sets none).
 * In each: some questions are answered, every tab in the nav is opened, and an
 * exam paper is started from the Exam tab and by calling beginExam. No page
 * error, no error on the console, and no visible "null", "NaN" or "undefined"
 * on any tab. Without a count the Exam tab says the number of questions is not
 * set in the course manifest and starts no paper; without marks no marks
 * figure is shown and a paper (with a count) holds the exam's number of
 * questions, or every eligible question of the pools when they hold fewer.
 * The course's own page carries nullexam.js exactly when its
 * active exam leaves one of these numbers unset.
 *
 *     node nullexam_test.js
 */
const fs = require('fs'), path = require('path');
const L = require('./check_lib');
const NAME = 'nullexam_test.js';
const {check} = L;
L.PAGE.need(NAME);

const NOT_SET = /The number of questions on .+ is not set in the course manifest, so no practice paper is drawn\./;
const BAD_WORD = /\b(null|NaN|undefined)\b/;

// the course's own page
{
  const X = L.engine('{EXAM}');
  const unset = X.EXAM.questions == null || X.EXAM.pools.some(p => p.marks == null);
  const carries = /\bconst EXAM_UNSET = /.test(L.PAGE.read());
  check(carries === unset, `the course's own page ${unset ? 'carries' : 'leaves out'} nullexam.js (its active exam ${unset ? 'leaves a number unset' : 'sets every number'})`,
        `the page ${carries ? 'carries' : 'does not carry'} it`);
}

const ACTIVE = 'const E = COURSE.exams.find(e => e.id === COURSE.activeExam) || COURSE.exams[0];';
const CASES = [
  {label: 'count and marks not set', count: false, marks: false,
   line: `{ ${ACTIVE} E.questions = null; E.pools.forEach(p => { p.marks = null; });
     if(!E.pools.some(p => p.filter && p.filter.tier)) E.pools.push({key:'znew', name:'New material', marks:null, filter:{tier:'new'}}); }`},
  {label: 'count not set', count: false, marks: true,
   line: `{ ${ACTIVE} E.questions = null; E.pools.forEach(p => { if(p.marks == null) p.marks = 2; }); }`},
  {label: 'marks not set', count: true, marks: false,
   line: `{ ${ACTIVE} E.pools.forEach(p => { p.marks = null; }); if(E.questions == null) E.questions = 4; }`},
];

// answers the question on screen through its controls (startup_test.js), then Next
const ANSWER = right => {
  if(!(Q && Q.current)) startSweep('all');
  const q = Q && Q.current; if(!q) return null;
  if(q.type === 'numeric'){ document.getElementById('numIn').value = String(right ? q.answer : q.answer + 1000); document.getElementById('btnCheck').click(); }
  else if(q.type === 'match'){
    const sels = [...document.querySelectorAll('#v-quiz select[data-row]')];
    sels.forEach((s, i) => { s.value = String(right ? i : (i + 1) % sels.length); s.dispatchEvent(new Event('change')); });
    document.getElementById('btnCheck').click();
  } else if(isMulti(q)){
    for(const i of (right ? correctSet(q) : [q.options.findIndex(o => !o.correct)])) document.querySelector(`#v-quiz button[data-o="${i}"]`).click();
    document.getElementById('btnCheck').click();
  } else document.querySelector(`#v-quiz button[data-o="${q.options.findIndex(o => right ? o.correct : !o.correct)}"]`).click();
  const b = document.getElementById('btnNext'); if(b) b.click();
  return q.id;
};
// the visible words "null", "NaN" or "undefined" on screen, with the text around them
const badWords = page => page.evaluate(src => {
  const re = new RegExp(src, 'g'), t = document.body.innerText, out = [];
  for(const m of t.matchAll(re)) out.push(t.slice(Math.max(0, m.index - 40), m.index + 30).replace(/\s+/g, ' '));
  return out;
}, BAD_WORD.source);

(async () => {
  const {browser} = await L.launch(NAME);
  const built = [];
  try {
    for(const c of CASES){
      console.log(`\n=== ${c.label} ===`);
      const b = L.scratchBuild('nullexam-test', {courseLine: c.line});
      built.push(b);
      if(!check(b.code === 0, 'the scratch copy builds', b.out.split('\n').slice(-3).join(' | '))) continue;
      const {ctx, page, errors} = await L.openPage(browser, b.page);
      const logged = [];
      page.on('console', m => { if(m.type() === 'error') logged.push(m.text()); });
      const seen = [];
      const look = async name => { const w = await badWords(page); if(w.length) seen.push(`${name}: …${w[0]}…`); };
      try {
        await look('Topics at start-up');
        // answers, so Weak spots draws its tables
        for(let i = 0; i < 6; i++){ await page.evaluate(ANSWER, i % 3 === 0); await page.waitForTimeout(150); }
        const views = await page.evaluate(() => [...document.querySelectorAll('#nav button[data-v]')].map(b => b.dataset.v));
        for(const v of views){
          await page.click(`#nav button[data-v="${v}"]`);
          await page.waitForTimeout(200);
          await look(`the ${v} tab`);
        }
        check(views.length >= 4, `every tab in the nav was opened (${views.join(', ')})`);

        // Topics
        await page.click('#nav button[data-v="topics"]');
        const topics = await page.evaluate(() => ({sub: (document.querySelector('#v-topics p.sub') || {}).innerText || '',
          weighted: !!document.getElementById('sweepWeighted'), tiers: EXAM.pools.some(p => p.filter && p.filter.tier),
          chips: [...document.querySelectorAll('#v-topics .chip[data-f="tier"]')].map(b => b.textContent)}));
        if(!c.count) check(!/questions,/.test(topics.sub.split('.')[0]), 'Topics leaves the question count out of the exam line', topics.sub.slice(0, 120));
        if(!c.marks){
          check(!topics.weighted, 'Topics offers no exam-weighted pass');
          if(topics.tiers) check(topics.chips.length === 3 && topics.chips.every(t => !/marks|\d/.test(t)), 'the Weighting chips show no marks figure', topics.chips);
          else L.skip('the Weighting chips', 'no pool of this exam filters by tier');
        }

        // Exam: the Start button if there is one, then beginExam itself
        await page.click('#nav button[data-v="exam"]');
        const exam = await page.evaluate(() => {
          const out = {start: !!document.getElementById('startExam')};
          try { if(out.start) document.getElementById('startExam').click(); } catch(e){ out.clickError = e.message; }
          out.afterClick = document.getElementById('v-exam').innerText;
          out.runningAfterClick = !!(EX && EX.running);
          if(EX && EX.running){ clearInterval(EX.timer); EX = null; clearExam(); }
          try { beginExam(); } catch(e){ out.beginError = e.message; }
          out.afterBegin = document.getElementById('v-exam').innerText;
          out.running = !!(EX && EX.running);
          out.n = EX && EX.qs ? EX.qs.length : null;
          out.questions = EXAM.questions;
          // what a paper can hold: the items of the pools the draw takes (exam_typed.js adds numeric and matching)
          out.eligible = QUESTIONS.filter(q => !q.lowYield && (!q.type || (EXAM.typed && (q.type === 'numeric' || q.type === 'match')))
            && EXAM.pools.some(p => p.test(q))).length;
          return out;
        });
        await look('the Exam tab after starting a paper');
        if(!c.count){
          check(!exam.start, 'the Exam tab offers no Start button');
          check(NOT_SET.test(exam.afterClick) && NOT_SET.test(exam.afterBegin), 'the Exam tab says the number of questions is not set in the course manifest, so no practice paper is drawn',
                exam.afterBegin.slice(0, 160));
          check(!exam.beginError && !exam.running, 'beginExam starts no paper and throws nothing', exam.beginError || '');
        } else {
          check(exam.start && !exam.clickError && exam.runningAfterClick, 'the Start button starts a paper', exam.clickError || '');
          const want = Math.min(exam.questions, exam.eligible);
          check(!exam.beginError && exam.running && exam.n === want, `the paper holds ${want} questions (the exam's ${exam.questions}; ${exam.eligible} in its pools)`,
                `${exam.n} drawn${exam.beginError ? '; ' + exam.beginError : ''}`);
          if(exam.running){
            await page.click('#exEnd');
            await page.waitForTimeout(300);
            await look('the exam result page');
          }
        }

        // Weak spots
        await page.click('#nav button[data-v="gaps"]');
        await page.waitForTimeout(200);
        const gaps = await page.evaluate(() => ({text: document.getElementById('v-gaps').innerText,
          pools: [...document.querySelectorAll('#v-gaps .nextcard .nexthead span')].map(s => s.textContent)}));
        check(gaps.pools.length > 0, `Weak spots shows a card per pool (${gaps.pools.length})`);
        if(!c.marks){
          check(gaps.pools.every(t => /^\d+ concepts?$/.test(t)), 'each pool card gives its concepts and no marks figure', gaps.pools);
          // the engine's own marks wording (a question's text may say "marks" too: Medicinal-chemistry's "Slide 47 marks gender")
          const MARKS = /Marks at risk|losing marks|worth on the paper|\d+ of \d+ marks|\bnull marks\b/;
          check(!MARKS.test(gaps.text), 'Weak spots shows no marks figure and no weighting by marks', (gaps.text.match(new RegExp('.{0,40}(' + MARKS.source + ').{0,30}')) || [''])[0]);
          check(/Accuracy by topic/.test(gaps.text), 'the topic table is headed "Accuracy by topic"');
        } else check(gaps.pools.every(t => /^\d+ marks? · \d+ concepts?$/.test(t)), 'each pool card gives its marks and concepts, with no count of the paper', gaps.pools);

        check(!seen.length, 'no tab shows "null", "NaN" or "undefined"', seen.slice(0, 3).join(' ; '));
        check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
        check(!logged.length, 'no errors on the console', logged.slice(0, 2).join('; '));
      } catch(e) {
        check(false, 'the case ran to the end', e.message.split('\n')[0]);
        if(errors.length) check(false, 'no page errors', errors.slice(0, 2).join('; '));
      } finally {
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
    built.forEach(b => b.rm());
  }
  L.finish(NAME);
})().catch(e => { console.log(`FAIL: ${NAME}: the test stopped: ${e.message}`); process.exit(1); });
