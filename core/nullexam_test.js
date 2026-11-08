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
 *      course sets none);
 *   4. `minutes: null` with the count set (4 when the course sets none): the
 *      paper is untimed (Louis, 2026-11-01). The opening page says no time
 *      limit is set; a started paper is still running after more than the
 *      engine's one-second tick, its clock counts the time taken up, the paper
 *      saved for a reload is the engine's with `ends: null` and `started`,
 *      a reload brings the same paper back with its answers, its place and the
 *      time taken still counting. Then the course gains a time limit (the
 *      scratch copy is built again with every exam number set, so nullexam.js
 *      is left out of the page): the paper still comes back untimed, with its
 *      answers, its place and the time taken, and does not end by itself; a
 *      paper started after it counts down. Submitting logs only the answered
 *      items and says
 *      how long the paper took, the saved paper is then removed, and a reload
 *      after submitting starts no paper. In case 3 the saved paper of a timed
 *      exam keeps the engine's fields exactly;
 *   5. some pools with marks and some without (Louis, 2026-11-01: "when any
 *      section lacks points, use unweighted behavior consistently"): two pools
 *      made from two of the course's topics, one with 1 mark and one without.
 *      The topic table lists the topic answered worse first, by accuracy; the
 *      pool cards come in the manifest's order with no marks figure; and the
 *      paper is drawn from both pools together, so it carries more of the
 *      first pool's items than its 1 mark.
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
const fs = require('fs'), path = require('path'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'nullexam_test.js';
const {check} = L;
L.PAGE.need(NAME);

const NOT_SET = /The number of questions on .+ is not set in the course manifest, so no practice paper is drawn\./;
const BAD_WORD = /\b(null|NaN|undefined)\b/;

// the course's own page
{
  const X = L.engine('{EXAM}');
  const unset = X.EXAM.questions == null || X.EXAM.minutes == null || X.EXAM.pools.some(p => p.marks == null);
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
  // a paper whose pools' marks add up to its count: when the course leaves a count or a pool's
  // marks unset, one pool of every question supplies the count, so the draw has one shape
  {label: 'time limit not set', count: true, marks: true, minutes: false,
   line: `{ ${ACTIVE} E.minutes = null; if(E.questions == null) E.questions = 4;
     if(E.pools.some(p => p.marks == null)) E.pools = [{key:'all', name:'All questions', marks:E.questions, filter:{}}]; }`},
];
const UNTIMED = /No time limit is set in the course manifest, so this paper is untimed/;
const TAKEN = /^(\d\d):(\d\d) taken$/;
const secs = t => { const m = TAKEN.exec(String(t || '').trim()); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; };

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
          const out = {start: !!document.getElementById('startExam'), intro: document.getElementById('v-exam').innerText,
                       button: (document.getElementById('startExam') || {}).textContent || ''};
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
            // the paper saved for a reload: a timed exam keeps the engine's fields exactly
            const saved = await page.evaluate(() => ({paper: JSON.parse(localStorage.getItem(NS + ':exam:' + PROFILE) || 'null'), minutes: EXAM.minutes}));
            if(c.minutes !== false){
              if(saved.minutes === null || saved.minutes === undefined)
                L.skip('a timed paper is saved with the engine\'s fields only', 'this course sets no time limit, so its papers are untimed (the time-limit case checks them)');
              else check(saved.paper && Object.keys(saved.paper).sort().join(',') === 'ends,i,ids,orders,picks' && typeof saved.paper.ends === 'number',
                'a timed paper is saved with the engine\'s fields only (ids, picks, orders, i, ends)', saved.paper && Object.keys(saved.paper).join(','));
            }
            await page.click('#exEnd');
            await page.waitForTimeout(300);
            await look('the exam result page');
          }
        }

        // the time limit not set: an untimed paper, through a reload and a submission
        if(c.minutes === false){
          check(!/minutes/.test(topics.sub.split('.')[0]), 'Topics leaves the minutes out of the exam line', topics.sub.slice(0, 120));
          check(UNTIMED.test(exam.intro) && exam.button.trim() === 'Start the untimed paper',
                'the opening page says no time limit is set, so the paper is untimed, and the button starts an untimed paper', exam.button);
          await page.evaluate(() => { if(EX){ clearInterval(EX.timer); EX = null; } clearExam(); renderExam(); });
          await page.click('#startExam');
          await page.waitForTimeout(3200);
          const run = await page.evaluate(() => ({running: !!(EX && EX.running), done: !!(EX && EX.done), clock: (document.getElementById('exClock') || {}).textContent,
            n: EX ? EX.qs.length : 0, saved: JSON.parse(localStorage.getItem(NS + ':exam:' + PROFILE) || 'null')}));
          check(run.running && !run.done, 'an untimed paper is still running after 3 seconds (the engine ended it at its first one-second tick)', JSON.stringify({running: run.running, done: run.done}));
          check(secs(run.clock) >= 2, `the clock counts the time taken up (${run.clock})`, run.clock);
          check(run.saved && Object.keys(run.saved).sort().join(',') === 'ends,i,ids,orders,picks,started' && run.saved.ends === null && typeof run.saved.started === 'number',
                'the saved paper is the engine\'s with ends: null and started', run.saved && JSON.stringify(Object.keys(run.saved)));
          // answer the first item, then reload
          const first = await page.evaluate(() => {
            const q = EX.qs[0];
            if(q.type === 'numeric'){ const n = document.getElementById('exNum'); n.value = String(q.answer); n.dispatchEvent(new Event('input')); }
            else if(q.type === 'match'){ EX.picks[0] = q.pairs.map((p, i) => i); saveExam(); }
            else if(isMulti(q)){ for(const i of correctSet(q)){ const b = document.querySelector(`#v-exam button.opt[data-o="${i}"]`) || [...document.querySelectorAll('#v-exam button.opt')][EX.orders[0].indexOf(i)]; if(b) b.click(); } }
            else { const b = [...document.querySelectorAll('#v-exam button.opt')][EX.orders[0].indexOf(q.options.findIndex(o => o.correct))]; if(b) b.click(); }
            const next = document.getElementById('exNext'); if(next && EX.qs.length > 1) next.click();
            return {ids: EX.qs.map(q => q.id), pick: JSON.stringify(EX.picks[0]), started: EX.started, i: EX.i};
          });
          check(first.pick !== 'null' && first.pick !== '[]', 'the first item is answered', first.pick);
          const place = Math.min(1, first.ids.length - 1);
          check(first.i === place, `the paper is on question ${place + 1}`, first.i);
          await page.reload();
          await page.waitForFunction(() => typeof NS === 'string' && document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
          await page.click('#nav button[data-v="exam"]');
          await page.waitForTimeout(1200);
          const resumed = () => page.evaluate(() => ({running: !!(EX && EX.running), done: !!(EX && EX.done), ids: EX ? EX.qs.map(q => q.id) : [],
            pick: EX ? JSON.stringify(EX.picks[0]) : '', i: EX ? EX.i : -1, ends: EX ? EX.ends : undefined, started: EX && EX.started,
            clock: (document.getElementById('exClock') || {}).textContent, onScreen: ((document.querySelector('#v-exam .prog') || {}).textContent || '')}));
          const same = (x, label) => check(x.running && x.ids.join() === first.ids.join() && x.pick === first.pick && x.i === place && x.started === first.started
                && x.onScreen.startsWith(`Question ${place + 1} of `), label, JSON.stringify({running: x.running, pick: x.pick, i: x.i, onScreen: x.onScreen}));
          const back = await resumed();
          same(back, 'after a reload the same paper comes back with its answer, its place and its start time');
          check(secs(back.clock) >= secs(run.clock), `after a reload the time taken goes on from where it was (${run.clock}, then ${back.clock})`, back.clock);

          // the course gains a time limit: built again with every exam number set, so nullexam.js is left out
          fs.appendFileSync(path.join(b.src, 'course.js'), `\n;{ ${ACTIVE} E.minutes = 10; }\n`);   // a test value standing for a later-announced limit
          const rb = child.spawnSync('python3', ['build.py'], {cwd: b.src, encoding: 'utf8', timeout: 600000});
          check(rb.status === 0, 'the scratch copy builds again with a time limit of 10 minutes', ((rb.stdout || '') + (rb.stderr || '')).trim().split('\n').slice(-2).join(' | '));
          check(!/\bconst EXAM_UNSET = /.test(fs.readFileSync(b.page, 'utf8')), 'with every exam number set the page leaves nullexam.js out');
          await page.reload();
          await page.waitForFunction(() => typeof NS === 'string' && document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
          check(await page.evaluate(() => EXAM.minutes === 10 && typeof EXAM_UNSET === 'undefined'), 'the reloaded page has the 10-minute limit and no nullexam.js');
          await page.click('#nav button[data-v="exam"]');
          await page.waitForTimeout(2500);
          const kept = await resumed();
          same(kept, 'after the course gains a time limit the paper in progress comes back with its answer, its place and its start time');
          check(kept.ends === null && !kept.done && TAKEN.test(String(kept.clock).trim()) && secs(kept.clock) >= secs(back.clock),
                `it stays untimed and is not submitted by itself after 2.5 seconds; the time taken goes on (${back.clock}, then ${kept.clock})`,
                JSON.stringify({ends: kept.ends, done: kept.done, clock: kept.clock}));
          const before = await page.evaluate(() => (JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]')).length);
          await page.click('#exEnd');
          await page.waitForTimeout(400);
          const res = await page.evaluate(() => ({done: !!(EX && EX.done), took: (document.getElementById('exTook') || {}).textContent || '',
            log: JSON.parse(localStorage.getItem(NS + ':log:' + PROFILE) || '[]'), saved: localStorage.getItem(NS + ':exam:' + PROFILE)}));
          const added = res.log.slice(before);
          check(res.done && /^Time taken: \d\d:\d\d\. This paper was untimed\.$/.test(res.took),
                'submitting ends the paper and the result says how long it took', res.took);
          check(added.length === 1 && added[0][3] === 'exam', `only the answered item is logged, as an exam answer (${added.length} logged)`, JSON.stringify(added));
          check(res.saved === null, 'the saved paper is removed once it is submitted');
          await look('the untimed result page');
          await page.reload();
          await page.waitForFunction(() => typeof NS === 'string' && document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
          await page.click('#nav button[data-v="exam"]');
          await page.waitForTimeout(300);
          const after = await page.evaluate(() => ({running: !!(EX && EX.running), start: !!document.getElementById('startExam')}));
          check(!after.running && after.start, 'a reload after submitting starts no paper and offers a new one (the result is not kept after a reload, as with a timed paper)');
          // a paper started now has the course's new time limit
          await page.click('#startExam');
          await page.waitForTimeout(1200);
          const fresh = await page.evaluate(() => ({ends: EX && EX.ends, started: EX && EX.started, left: EX && typeof EX.ends === 'number' ? EX.ends - Date.now() : null,
            clock: (document.getElementById('exClock') || {}).textContent, saved: JSON.parse(localStorage.getItem(NS + ':exam:' + PROFILE) || 'null')}));
          check(typeof fresh.ends === 'number' && fresh.started === undefined && fresh.left > 9 * 60000 && fresh.left <= 10 * 60000 && /^\d\d:\d\d$/.test(String(fresh.clock).trim()),
                `a paper started after the time limit is set counts down from 10 minutes (${fresh.clock})`, JSON.stringify({ends: fresh.ends, started: fresh.started, clock: fresh.clock}));
          check(fresh.saved && Object.keys(fresh.saved).sort().join(',') === 'ends,i,ids,orders,picks' && typeof fresh.saved.ends === 'number',
                'it is saved with the engine\'s fields only', fresh.saved && Object.keys(fresh.saved).join(','));
          await page.evaluate(() => { if(EX){ clearInterval(EX.timer); EX = null; } clearExam(); });
        }

        // Weak spots
        await page.click('#nav button[data-v="gaps"]');
        await page.waitForTimeout(200);
        const gaps = await page.evaluate(() => ({text: document.getElementById('v-gaps').innerText, unsetFile: typeof EXAM_UNSET !== 'undefined',
          pools: [...document.querySelectorAll('#v-gaps .nextcard .nexthead span')].map(s => s.textContent)}));
        check(gaps.pools.length > 0, `Weak spots shows a card per pool (${gaps.pools.length})`);
        if(!c.marks){
          check(gaps.pools.every(t => /^\d+ concepts?$/.test(t)), 'each pool card gives its concepts and no marks figure', gaps.pools);
          // the engine's own marks wording (a question's text may say "marks" too: Medicinal-chemistry's "Slide 47 marks gender")
          const MARKS = /Marks at risk|losing marks|worth on the paper|\d+ of \d+ marks|\bnull marks\b/;
          check(!MARKS.test(gaps.text), 'Weak spots shows no marks figure and no weighting by marks', (gaps.text.match(new RegExp('.{0,40}(' + MARKS.source + ').{0,30}')) || [''])[0]);
          check(/Accuracy by topic/.test(gaps.text), 'the topic table is headed "Accuracy by topic"');
        } else if(gaps.unsetFile) check(gaps.pools.every(t => /^\d+ marks? · \d+ concepts?$/.test(t)), 'each pool card gives its marks and concepts, with no count of the paper', gaps.pools);
        // the time-limit case ends on a page built with every exam number set: the engine's own card line
        else check(gaps.pools.every(t => /^\d+ of \d+ marks · \d+ concepts?$/.test(t)), 'each pool card gives the engine\'s marks line (every exam number is set)', gaps.pools);

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

    // 5. some pools with marks and some without
    console.log('\n=== some pools with marks, some without ===');
    const X0 = L.engine('{TOPICS, QUESTIONS}');
    const eligible = q => !q.lowYield && !q.type;
    const topicsWith = X0.TOPICS.map(t => ({id: t.id, name: t.name, qs: X0.QUESTIONS.filter(q => q.topic === t.id && eligible(q))}))
      .map(t => Object.assign(t, {concepts: new Set(t.qs.map(q => q.concept)).size}));
    const A = topicsWith.find(t => t.concepts >= 2), B = topicsWith.find(t => t !== A && t.qs.length >= 1);
    if(!A || !B) L.skip('pools with and without marks', 'the course has no two topics with questions a paper can draw (one with two concepts)');
    else {
      const n = A.qs.length + B.qs.length;
      const line = `{ ${ACTIVE} E.questions = ${n}; delete E.blueprint;
        E.pools = [{key:'za', name:'Section A', marks:1, filter:{topic:${JSON.stringify(A.id)}}}, {key:'zb', name:'Section B', marks:null, filter:{topic:${JSON.stringify(B.id)}}}]; }`;
      const b = L.scratchBuild('nullexam-test', {courseLine: line});
      built.push(b);
      if(check(b.code === 0, 'the scratch copy builds', b.out.split('\n').slice(-3).join(' | '))){
        const {ctx, page, errors} = await L.openPage(browser, b.page);
        try {
          // topic A answered 9 of 10 right, topic B 2 of 10: by accuracy B comes first
          const out = await page.evaluate(([a, b]) => {
            let k = 0;
            const add = (q, ok) => DB.answers.push({qid: q.id, concept: q.concept, result: ok ? 'correct' : 'wrong', at: Date.now() - 1e6 + k, qn: ++k});
            const qa = QUESTIONS.filter(q => q.topic === a), qb = QUESTIONS.filter(q => q.topic === b);
            for(let i = 0; i < 10; i++) add(qa[i % qa.length], i !== 0);
            for(let i = 0; i < 10; i++) add(qb[i % qb.length], i < 2);
            show('gaps');
            const h = [...document.querySelectorAll('#v-gaps h3')].find(x => x.textContent.trim() === 'Accuracy by topic');
            // the table, or the box that lets it scroll on a phone (div.gapwrap)
            let t = h && h.nextElementSibling; while(t && !t.matches('table') && !t.querySelector(':scope > table')) t = t.nextElementSibling;
            if(t && !t.matches('table')) t = t.querySelector(':scope > table');
            const rows = t ? [...t.querySelectorAll('tbody tr')].map(r => ({name: r.children[0].childNodes[0].textContent.trim(),
              pct: Number((r.lastElementChild.textContent.match(/(\d+)%/) || [])[1])})) : [];
            const cards = [...document.querySelectorAll('#v-gaps .nextcard')].map(c => ({name: c.querySelector('.nexthead b').textContent, head: c.querySelector('.nexthead span').textContent}));
            const papers = Array.from({length: 20}, () => drawPaper());
            return {rows, cards, heading: !!h,
              paperN: papers.map(p => p.length), aOn: papers.map(p => p.filter(q => q.topic === a).length),
              other: papers.some(p => p.some(q => q.topic !== a && q.topic !== b))};
          }, [A.id, B.id]);
          const names = out.rows.map(r => r.name);
          check(out.heading && names.indexOf(B.name) === 0 && names.indexOf(A.name) === 1,
                `the topic table lists ${B.name} (20%) before ${A.name} (90%), by accuracy`, JSON.stringify(out.rows));
          check(out.rows.every((r, i) => i === 0 || r.pct >= out.rows[i - 1].pct), 'every row of the topic table is in order of accuracy, lowest first', JSON.stringify(out.rows));
          check(out.cards.map(c => c.name).join('|') === 'Section A|Section B' && out.cards.every(c => /^\d+ concepts?$/.test(c.head)),
                'the pool cards come in the manifest\'s order with their concepts and no marks figure', JSON.stringify(out.cards));
          check(out.paperN.every(x => x >= 2) && !out.other, `each of 20 papers holds questions from the two pools only (${Math.min(...out.paperN)} to ${Math.max(...out.paperN)} questions)`);
          check(out.aOn.every(x => x > 1), `every paper carries more than the first pool's 1 mark of its items (${Math.min(...out.aOn)} to ${Math.max(...out.aOn)}): the pools are drawn together, unweighted`,
                JSON.stringify(out.aOn));
          check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
        } catch(e) {
          check(false, 'the case ran to the end', e.message.split('\n')[0]);
        } finally { await ctx.close(); }
      }
    }
  } finally {
    await browser.close();
    built.forEach(b => b.rm());
  }
  L.finish(NAME);
})().catch(e => { console.log(`FAIL: ${NAME}: the test stopped: ${e.message}`); process.exit(1); });
