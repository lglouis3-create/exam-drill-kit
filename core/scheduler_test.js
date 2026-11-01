/* The scheduler (the kit's review/scheduler-proposal.md §4-§5, approved by
 * Louis on 2026-11-01), checked in Chromium with a fixed clock.
 *
 * Each part builds its own copy of this source tree (check_lib scratchRepo):
 * course.js gets a few lines appended (the scheduler setting, test lectures,
 * test exams) and q1_topics.js gets a test topic with concepts that have more
 * than one question each, which the sample bank does not. The course's own
 * files are not changed. The days below are fixed dates read by a fake clock
 * (Playwright page.clock), so nothing depends on today's date.
 *
 *     node scheduler_test.js
 */
const fs = require('fs'), path = require('path'), child = require('child_process');
const L = require('./check_lib');
const NAME = 'scheduler_test.js';
const {check} = L;
L.PAGE.need(NAME);
const DAY = 86400000;

/* ---- the test bank ------------------------------------------------------
   Lecture ZS-L1 (subtopic a): c1 has three questions, c2 one.
   Lecture ZS-L2 (subtopic b): c3 and c4 two each, c5 one.            */
const BANK = [
  ['z1a', 'c1', 'recall', 'ZS-L1', 'a'], ['z1b', 'c1', 'calc', 'ZS-L1', 'a'], ['z1c', 'c1', 'recall', 'ZS-L1', 'a'],
  ['z2a', 'c2', 'recall', 'ZS-L1', 'a'],
  ['z3a', 'c3', 'calc', 'ZS-L2', 'b'], ['z3b', 'c3', 'calc', 'ZS-L2', 'b'],
  ['z4a', 'c4', 'recall', 'ZS-L2', 'b'], ['z4b', 'c4', 'recall', 'ZS-L2', 'b'],
  ['z5a', 'c5', 'calc', 'ZS-L2', 'b'],
];
const QEXTRA = `
TOPICS.push({id:'zsched', name:'Scheduler test', prof:COURSE.professors[0], cite:'test',
  subs:[{id:'a', name:'Test lecture 1', cite:'test'}, {id:'b', name:'Test lecture 2', cite:'test'}]});
QUESTIONS.push(...${JSON.stringify(BANK.map(([id, concept, skill, lec, sub]) => ({id, skill, tier: 'new', topic: 'zsched', sub, concept,
  tags: [], source: 'slide', stem: `TEST ${id}: which option is the one marked right?`,
  options: [{t: 'The one marked right', correct: true, why: 'Marked right in this test bank.'},
            {t: 'The one marked wrong', correct: false, why: 'Marked wrong in this test bank.'},
            {t: 'Another one marked wrong', correct: false, why: 'Marked wrong in this test bank.'}],
  teach: 'Test bank item.', cite: `Test (${lec}.pdf) slide 1`})))}.map(q => Object.assign(q, {prof: COURSE.professors[0]})));
`;
const COURSE_BASE = `
COURSE.lectures.push({id:'ZS1', deck:'ZS-L1.pdf', label:'Test lecture 1', prof:COURSE.professors[0], exam:99, module:'ZS'},
                     {id:'ZS2', deck:'ZS-L2.pdf', label:'Test lecture 2', prof:COURSE.professors[0], exam:99, module:'ZS'});
`;

/* A scratch copy of this source tree with course.js and the first question
   file extended, built; returns the page's path or the build's last line. */
function variant(label, courseExtra){
  const repo = L.scratchRepo(L.PAGE.SRC, 'sched-' + label);
  const src = path.join(repo, 'src');
  if(!fs.existsSync(path.join(src, 'q1_topics.js'))) return {error: 'no q1_topics.js to add the test topic to'};
  fs.appendFileSync(path.join(src, 'course.js'), '\n' + COURSE_BASE + (courseExtra || '') + '\n');
  fs.appendFileSync(path.join(src, 'q1_topics.js'), '\n' + QEXTRA + '\n');
  const b = child.spawnSync('python3', ['build.py'], {cwd: src, encoding: 'utf8'});
  if(b.status !== 0) return {error: ((b.stderr || '') + (b.stdout || '')).trim().split('\n').pop()};
  return {repo, page: path.join(repo, 'index.html'), out: b.stdout};
}
/* The page from disk at a fixed time, with the name prompt answered. */
async function open(browser, page_, at, init){
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
  await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
  if(init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  await page.clock.setFixedTime(new Date(at));
  await page.goto('file://' + page_);
  await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
  return {ctx, page, errors};
}
const T0 = '2026-11-02T09:00:00';        // a Monday, local time
const ms = s => new Date(s).getTime();

/* The exam-date fraction, written out again here from the design choice in
   shell.html (0.40 at 7 days or less, 0.10 at 365 days or more, linear in
   log(days) between), so the page is checked against the rule and not
   against its own code. */
const frac = d => d <= 7 ? 0.40 : d >= 365 ? 0.10 : 0.40 + (0.10 - 0.40) * Math.log(d / 7) / Math.log(365 / 7);
const examGapDays = d => Math.max(1, frac(d) * d);

(async () => {
  const {browser} = await L.launch(NAME);

  console.log('\n=== 1a. Exam-date spacing ===');
  {
    // the course's own exam: 10 days after T0, covering lecture 2 of the test bank
    const v = variant('exam', `
COURSE.exams.push({id:'zsA', name:'Test exam', date:'12 Nov', when:'2026-11-12T09:00', questions:1, minutes:10,
                   pools:[{key:'z', name:'test', marks:1, filter:{topic:'zsched', sub:'b'}}]},
                  {id:'zsN', name:'Test exam with no date', date:'', when:'', questions:1, minutes:10,
                   pools:[{key:'z', name:'test', marks:1, filter:{topic:'zsched', sub:'a'}}]});`);
    if(v.error){ check(false, 'the exam-date test course builds', v.error); }
    else {
      const {ctx, page: p, errors} = await open(browser, v.page, T0);
      // answer `id` right with the concept at `box` first; returns the gap in days and the box after
      const gapAfter = (id, box, extra) => p.evaluate(([id, box, extra]) => {
        const q = byId(id), s = st(q.concept);
        Object.assign(s, {box, seen: Math.max(1, s.seen)}, extra || {});
        const qn = DB.qn;
        record(q, 'correct', 0, 1000);
        return {days: (s.dueAt - Date.now()) / 86400000, box: s.box, dq: s.dueQ - DB.qn, qn0: qn};
      }, [id, box, extra]);
      await p.evaluate(() => { DB.settings.pace = 'semester'; });
      const box60 = 5;                    // semester steps 0,1,3,7,14,30,60: box 5 -> 6 is 60 days

      let r = await gapAfter('z3a', box60);
      check(Math.abs(r.days - examGapDays(10)) < 1e-4, `exam in course.js 10 days away: next review after ${examGapDays(10).toFixed(3)} days, not 60`, r);
      r = await gapAfter('z1a', box60);
      check(Math.abs(r.days - 60) < 1e-4, 'a concept outside every dated exam keeps its box interval (60 days); the exam without a date is ignored', r);
      r = await gapAfter('z3a', 0);
      check(Math.abs(r.days - 1) < 1e-4, 'a box interval shorter than the exam gap stays (1 day)', r);

      // the same rule at other distances, with exams set on the page
      for(const d of [3, 7, 30, 100, 365, 500]){
        await p.evaluate(([d]) => { COURSE.exams = [{id:'zsX', name:'x', when:new Date(Date.now() + d * 86400000).toISOString(), pools:[{key:'z', marks:1, filter:{topic:'zsched', sub:'b'}}]}]; }, [d]);
        r = await gapAfter('z4a', box60);
        const want = Math.min(60, examGapDays(d));
        check(Math.abs(r.days - want) < 1e-4, `exam ${d} days away: next review after ${want.toFixed(3)} days (fraction ${frac(d).toFixed(4)})`, r);
      }
      // two exams: the nearer one counts
      await p.evaluate(() => { const at = d => new Date(Date.now() + d * 86400000).toISOString();
        COURSE.exams = [{id:'far', when:at(200), pools:[{key:'z', marks:1, filter:{topic:'zsched'}}]},
                        {id:'near', when:at(20), pools:[{key:'z', marks:1, filter:{topic:'zsched', sub:'b'}}]}]; });
      r = await gapAfter('z4a', box60);
      check(Math.abs(r.days - examGapDays(20)) < 1e-4, 'with two exams covering a concept the nearer one sets the gap', r);
      r = await gapAfter('z1a', box60);
      check(Math.abs(r.days - examGapDays(200)) < 1e-4, 'a concept covered only by the farther exam gets that exam\'s gap', r);

      // after the exam: nothing reset, the box schedule continues
      await p.evaluate(() => { COURSE.exams = [{id:'past', when:new Date(Date.now() - 86400000).toISOString(), pools:[{key:'z', marks:1, filter:{topic:'zsched'}}]}]; });
      r = await gapAfter('z4a', box60);
      check(Math.abs(r.days - 60) < 1e-4 && r.box === 6, 'after the exam date the box interval applies again and the box is kept', r);

      // cram: the question clock is unchanged, the day clock is capped
      await p.evaluate(() => { DB.settings.pace = 'cram'; COURSE.exams = [{id:'c', when:new Date(Date.now() + 5 * 86400000).toISOString(), pools:[{key:'z', marks:1, filter:{topic:'zsched'}}]}]; });
      r = await gapAfter('z4a', box60);
      check(r.dq === 260, 'cram pace: the question clock still gives box 6 its 260 questions', r);
      check(Math.abs(r.days - examGapDays(5)) < 1e-4, 'cram pace: the day clock is capped by the exam (5 days away)', r);
      check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
      await ctx.close();
    }
  }

  console.log('\n=== 1b. Confident-error check ===');
  {
    const v = variant('sure', '');
    if(v.error){ check(false, 'the confident-error test course builds', v.error); }
    else {
      let {ctx, page: p, errors} = await open(browser, v.page, T0);
      await p.evaluate(() => { DB.settings.pace = 'semester'; });
      // put one question on screen in the adaptive runner (pool: a subtopic of the test topic)
      const showQ = (id, sub) => p.evaluate(([id, sub]) => { startQuiz('zsched', sub || null); Q.current = byId(id); Q.order = Q.current.options.map((o, i) => i);
        Q.picked = null; Q.revealed = false; renderQuiz(); }, [id, sub]);
      const pick = right => p.evaluate(right => { const i = Q.current.options.findIndex(o => right ? o.correct : !o.correct);
        document.querySelector(`#v-quiz button[data-o="${i}"]`).click(); }, right);
      const next = () => p.evaluate(() => { document.getElementById('btnNext').click(); return Q.current && {id: Q.current.id, concept: Q.current.concept}; });
      const lastLog = () => p.evaluate(() => LOG[LOG.length - 1]);
      // click a control if it is on screen (an older core may not have it)
      const tap = sel => p.evaluate(sel => { const b = document.querySelector(sel); if(b && !b.disabled) b.click(); return !!b; }, sel);

      await showQ('z1a', 'a'); await pick(true);
      check(!(await p.$('#btnSure')), 'after a right answer there is no "I was sure of that" button');
      await next();
      await showQ('z1a', 'a'); await pick(false);
      const btn = await p.$('#btnSure');
      check(!!btn && (await btn.textContent()).trim() === 'I was sure of that', 'after a miss the screen offers "I was sure of that"');
      const cls = await p.evaluate(() => { const b = document.getElementById('btnSure'); return b && b.className; });
      check(cls === 'btn amber', 'it is styled like the "Not sure" and "I guessed" buttons (btn amber)', cls);
      check(!(await p.$('#btnShaky')) && !(await p.$('#btnGuess')), 'after a miss there is no "Not sure" or "I guessed"');
      if(btn) await btn.click();
      const lg = await lastLog();
      check(lg && lg[2] === 0 && lg[5] === 'sure', 'the miss is logged with confidence "sure"', JSON.stringify(lg));
      const st1 = await p.evaluate(() => ({check: DB.concepts.c1.check, conf: DB.answers[DB.answers.length - 1].conf,
        note: (document.getElementById('sureNote') || {}).textContent, btn: (document.getElementById('btnSure') || {}).disabled}));
      check(st1.check && st1.check.day === '2026-11-02' && st1.conf === 'sure', 'the concept carries the check, dated the day of the error', JSON.stringify(st1));
      check(st1.btn && /different question on this concept comes next/.test(st1.note || ''), 'the line under the button says a different question on the concept comes next', st1.note);
      let n = await next();
      check(n && n.concept === 'c1' && n.id !== 'z1a', 'the next question is a different question on the same concept', JSON.stringify(n));

      // a concept with one question: the normal GAP rule
      await showQ('z2a', null); await pick(false);
      await tap('#btnSure');
      const note2 = await p.evaluate(() => (document.getElementById('sureNote') || {}).textContent || '');
      check(/asked again on a later day/.test(note2) && !/different question/.test(note2), 'for a concept with one question the line says only that it comes back on a later day', note2);
      n = await next();
      check(n && n.concept !== 'c2', 'a concept with no other question does not come straight back (the GAP rule)', JSON.stringify(n));

      // without the button, a miss keeps the GAP rule
      await showQ('z4a', 'b'); await pick(false);
      n = await next();
      check(n && n.concept !== 'c4', 'a miss without the button does not bring its concept straight back', JSON.stringify(n));

      // same day: right answers move the box but the check stays
      await showQ('z1b', 'a'); await pick(true); await next();
      await showQ('z1c', 'a'); await pick(true); await next();
      let s = await p.evaluate(() => ({box: DB.concepts.c1.box, check: DB.concepts.c1.check, due: isDue(DB.concepts.c1)}));
      check(s.box === 2 && s.check && !s.due, 'right answers on the day of the error raise the box and leave the check in place', JSON.stringify(s));
      // c4 the same way, without the check: missed, then right twice
      await showQ('z4a', 'b'); await pick(true); await next();
      await showQ('z4b', 'b'); await pick(true); await next();
      // two more answers, so c1 has cooled (GAP) by the next day's pick
      await showQ('z3a', 'b'); await pick(true); await next();
      await showQ('z5a', 'b'); await pick(true); await next();

      // the next day: due whatever its box, and ranked with the misses
      await p.clock.setFixedTime(new Date(ms(T0) + DAY));
      s = await p.evaluate(() => ({due1: isDue(DB.concepts.c1), box1: DB.concepts.c1.box, due4: isDue(DB.concepts.c4), box4: DB.concepts.c4.box,
        tier1: (score(byId('z1a')) || {}).tier}));
      check(s.due1 && s.box1 === 2, 'the next day the concept is due although its box (2: 3 days) is not', JSON.stringify(s));
      check(!s.due4 && s.box4 === 2, 'the same history without the check is not due the next day', JSON.stringify(s));
      check(s.tier1 === 4, 'the check ranks with missed concepts (tier 4)', JSON.stringify(s));
      await showQ('z1a', 'a'); await pick(true);
      s = await p.evaluate(() => ({check: DB.concepts.c1.check}));
      check(!s.check, 'a right answer on a later calendar day clears the check', JSON.stringify(s));
      await tap('#btnGuess');
      s = await p.evaluate(() => ({check: DB.concepts.c1.check}));
      check(s.check && s.check.day === '2026-11-02', '"I guessed" on that answer puts the check back', JSON.stringify(s));
      await next();
      await showQ('z1b', 'a'); await pick(false); await next();
      s = await p.evaluate(() => ({check: DB.concepts.c1.check}));
      check(s.check && s.check.day === '2026-11-02', 'a miss on a later day does not clear the check', JSON.stringify(s));
      await showQ('z1c', 'a'); await pick(true); await next();
      // two days on, at 07:00: box 1 is due at 09:00, so only a check would make it due now
      await p.clock.setFixedTime(new Date(ms(T0) + 2 * DAY - 2 * 3600000));
      s = await p.evaluate(() => ({check: DB.concepts.c1.check, due: isDue(DB.concepts.c1), box: DB.concepts.c1.box}));
      check(!s.check && !s.due && s.box === 1, 'once cleared, the concept follows its box again (box 1 not yet due)', JSON.stringify(s));

      // the miss screen of a typed question carries the button too
      const typed = await p.evaluate(() => { const q = QUESTIONS.find(x => x.type === 'numeric'); if(!q) return null;
        startQuiz(q.topic, q.sub); Q.current = q; Q.order = []; Q.revealed = false; renderQuiz();
        document.getElementById('numIn').value = String(q.answer + 1000); document.getElementById('btnCheck').click();
        return !!document.getElementById('btnSure'); });
      if(typed === null) L.skip('a typed question offers "I was sure of that"', 'no numeric question in this bank');
      else check(typed, 'a typed (numeric) question offers "I was sure of that" after a miss');

      // a one-pass sweep: the retry moves up in the queue
      const sw = await p.evaluate(() => { drillList(['z1a', 'z2a', 'z4a', 'z1b'].map(byId), 'test sweep');
        Q.sweep = ['z1a', 'z2a', 'z4a', 'z1b']; Q.i = 0; nextQuestion();
        const first = Q.current.id;
        document.querySelector(`#v-quiz button[data-o="${Q.current.options.findIndex(o => !o.correct)}"]`).click();
        const b = document.getElementById('btnSure'); if(b) b.click(); document.getElementById('btnNext').click();
        return {first, second: Q.current.id, len: Q.sweep.length}; });
      check(sw.first === 'z1a' && sw.second === 'z1b' && sw.len === 4, 'in a one-pass sweep the other question on the concept moves up to come next', JSON.stringify(sw));
      check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
      await ctx.close();
    }
  }

  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
