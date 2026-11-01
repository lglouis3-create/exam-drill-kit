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
// every part names its scheduler; this is the default unless the part's own lines set another
const COURSE_BASE = `
COURSE.scheduler = {model:'concept'};
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
/* The vendored ts-fsrs, run directly in node (not through the page): its
   DefaultScheduler() settings, to compare with the page's. Date comes from
   this realm so the library accepts it. */
async function library(){
  try {
    const vm = require('vm');
    const sb = {console, Date}; sb.globalThis = sb; vm.createContext(sb);
    vm.runInContext(fs.readFileSync(path.join(L.PAGE.SRC, 'vendor', 'ts-fsrs-6.0.0.umd.js'), 'utf8'), sb);
    const ref = await sb.FSRS.DefaultScheduler();
    const out = c => Object.assign({}, c, {dueAt: +c.dueAt, lastReviewAt: c.lastReviewAt == null ? null : +c.lastReviewAt});
    const replay = (id, steps) => { let card = null;
      return steps.map(([t, g]) => { const now = new Date(t);
        const recall = card && card.lastReviewAt ? ref.model.forgettingCurve(card, ref.chrono.difference(card.lastReviewAt, now)) : null;
        card = ref.review({card: card || ref.newCard({now, cardId: id}), grade: g, now}).card;
        return {card: out(card), recall}; }); };
    return {F: sb.FSRS, ref, replay};
  } catch(e){ return {error: 'the vendored ts-fsrs did not load in node: ' + e.message}; }
}
/* The same library alone in a blank Chromium page, for comparing the page's
   cards with the library's own reviews in the same engine (node's V8 and
   Chromium's differ in the last digit of some results). replay(id,
   [[ms, grade]]) gives the card after each review and the recall the
   library predicted just before it. */
async function libraryPage(browser){
  const ctx = await browser.newContext(), pg = await ctx.newPage();
  await pg.setContent('<!doctype html><meta charset="utf-8"><title>ts-fsrs</title>');
  await pg.addScriptTag({content: fs.readFileSync(path.join(L.PAGE.SRC, 'vendor', 'ts-fsrs-6.0.0.umd.js'), 'utf8')});
  const replay = (id, steps) => pg.evaluate(async ([id, steps]) => {
    const ref = await FSRS.DefaultScheduler(); let card = null;
    const out = c => Object.assign({}, c, {dueAt: +c.dueAt, lastReviewAt: c.lastReviewAt == null ? null : +c.lastReviewAt});
    return steps.map(([t, g]) => { const now = new Date(t);
      const recall = card && card.lastReviewAt ? ref.model.forgettingCurve(card, ref.chrono.difference(card.lastReviewAt, now)) : null;
      card = ref.review({card: card || ref.newCard({now, cardId: id}), grade: g, now}).card;
      return {card: out(card), recall}; });
  }, [id, steps]);
  return {ctx, replay};
}
const T0 = '2026-11-02T09:00:00';        // a Monday, local time
const ms = s => new Date(s).getTime();

/* The exam-date fraction, written out again here from the design choice in
   shell.html (0.40 at 7 days or less, 0.10 at 365 days or more, linear in
   log(days) between), so the page is checked against the rule and not
   against its own code. */
const frac = d => d <= 7 ? 0.40 : d >= 365 ? 0.10 : 0.40 + (0.10 - 0.40) * Math.log(d / 7) / Math.log(365 / 7);
const examGapDays = d => Math.max(1, frac(d) * d);

/* A scripted session with Math.random seeded (mulberry32), so the order the
   scheduler serves is reproducible: 40 turns on the test topic at cram pace,
   misses at turns 1, 4, 8, 13 and 21, right answers otherwise. When nothing
   in the topic is due, the turn answers a question from outside it ('-'),
   which moves the question clock on as other study would. */
const SEQUENCE = seed => {
  let a = seed >>> 0;
  Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  DB = BLANK(); DB.settings.pace = 'cram'; LAST_TIER = 0;
  const pool = QUESTIONS.filter(q => q.topic === 'zsched'), wrongAt = new Set([1, 4, 8, 13, 21]);
  const other = QUESTIONS.find(q => q.topic !== 'zsched');
  const seq = []; let last = null;
  for(let i = 0; i < 40; i++){
    const q = pickNext(pool, last);
    if(!q){ seq.push('-'); record(other, 'correct', 0, 1000); last = null; continue; }
    seq.push(q.id); record(q, wrongAt.has(i) ? 'wrong' : 'correct', 0, 1000); last = q.id;
  }
  return seq;
};
/* What the 5014f27 core serves in that session with seeds 1, 2 and 3
   (node scheduler_test.js --print-sequence on a course set up from 5014f27).
   Without the calculation preset the order must stay exactly this. */
const SEQUENCE_5014F27 = {"1":["z4a","z1c","z5a","z2a","z3b","-","z1b","-","-","z3a","z4b","z5a","z2a","-","-","z1a","-","-","z3b","-","-","-","-","-","-","-","-","-","-","-","-","z4a","z5a","z2a","-","-","z1c","-","-","z3a"],"2":["z1c","z4b","z3b","z2a","z5a","-","z4a","-","-","z5a","z1a","z3a","z2a","-","-","z4a","-","-","z5a","-","-","-","-","-","-","-","-","-","-","-","-","z1b","z3a","z2a","-","-","z4a","-","-","z5a"],"3":["z4b","z2a","z1b","z5a","z3b","-","z2a","-","-","z3a","z4a","z1c","z5a","-","-","z2a","-","-","z3b","-","-","-","-","-","-","-","-","-","-","-","-","z4b","z1a","z5a","-","-","z2a","-","-","z3b"]};

/* A study history made through the engine's own functions at fixed times:
   right, wrong, "Not sure", "I guessed", over three days, on the test topic
   and two sample questions. Run on a 5014f27 course (--print-progress), it
   gives SAVED_5014F27 below: what that core saved, and how its scheduler
   ranked each test question afterwards. */
const PROGRESS = () => {
  const t0 = Date.now(), H = 3600000;
  const steps = [[0, 'z1a', 'correct'], [1, 'z1b', 'wrong'], [2, 'z3a', 'correct', 'shaky'], [3, 'z4a', 'correct', 'guess'],
                 [4, 'z5a', 'correct'], [5, 'z2a', 'wrong'], [24, 'z1c', 'correct'], [25, 'z3b', 'correct'], [26, 'z1b', 'correct'],
                 [27, 'z4b', 'wrong'], [50, 'z1a', 'correct'], [51, 'z3a', 'correct'], [52, 'z2a', 'correct']];
  for(const [h, id, res, conf] of steps){
    Date.now = () => t0 + h * H;
    const q = byId(id); record(q, res, 0, 1000);
    if(conf === 'shaky') markShaky(q); if(conf === 'guess') markGuessed(q);
  }
  Date.now = () => t0 + 53 * H;
  const ranks = {}; QUESTIONS.filter(q => q.topic === 'zsched').forEach(q => { ranks[q.id] = score(q); });
  return {db: JSON.parse(JSON.stringify(DB)), log: LOG.slice(), ranks, end: t0 + 53 * H};
};
const SAVED_5014F27 = {"db":{"concepts":{"c1":{"seen":5,"correct":4,"wrong":1,"guessed":0,"streak":3,"box":3,"dueAt":1794135600000,"dueQ":56,"lastQ":11,"asked":["z1a","z1b","z1c"]},"c3":{"seen":3,"correct":3,"wrong":0,"guessed":0,"streak":2,"box":2,"dueAt":1793966400000,"dueQ":32,"lastQ":12,"asked":["z3a","z3b"]},"c4":{"seen":2,"correct":0,"wrong":1,"guessed":1,"streak":0,"box":0,"dueAt":1793707200000,"dueQ":10,"lastQ":10,"asked":["z4a","z4b"]},"c5":{"seen":1,"correct":1,"wrong":0,"guessed":0,"streak":1,"box":1,"dueAt":1793710800000,"dueQ":13,"lastQ":5,"asked":["z5a"]},"c2":{"seen":2,"correct":1,"wrong":1,"guessed":0,"streak":1,"box":1,"dueAt":1793883600000,"dueQ":21,"lastQ":13,"asked":["z2a"]}},"answers":[{"qid":"z1a","concept":"c1","result":"correct","at":1793610000000,"qn":1,"picked":0,"ms":1000},{"qid":"z1b","concept":"c1","result":"wrong","at":1793613600000,"qn":2,"picked":0,"ms":1000},{"qid":"z3a","concept":"c3","result":"correct","at":1793617200000,"qn":3,"picked":0,"ms":1000,"conf":"shaky"},{"qid":"z4a","concept":"c4","result":"guessed","at":1793620800000,"qn":4,"picked":0,"ms":1000},{"qid":"z5a","concept":"c5","result":"correct","at":1793624400000,"qn":5,"picked":0,"ms":1000},{"qid":"z2a","concept":"c2","result":"wrong","at":1793628000000,"qn":6,"picked":0,"ms":1000},{"qid":"z1c","concept":"c1","result":"correct","at":1793696400000,"qn":7,"picked":0,"ms":1000},{"qid":"z3b","concept":"c3","result":"correct","at":1793700000000,"qn":8,"picked":0,"ms":1000},{"qid":"z1b","concept":"c1","result":"correct","at":1793703600000,"qn":9,"picked":0,"ms":1000},{"qid":"z4b","concept":"c4","result":"wrong","at":1793707200000,"qn":10,"picked":0,"ms":1000},{"qid":"z1a","concept":"c1","result":"correct","at":1793790000000,"qn":11,"picked":0,"ms":1000},{"qid":"z3a","concept":"c3","result":"correct","at":1793793600000,"qn":12,"picked":0,"ms":1000},{"qid":"z2a","concept":"c2","result":"correct","at":1793797200000,"qn":13,"picked":0,"ms":1000}],"qn":13,"settings":{"mode":"cram"},"created":1793610000000},"log":[[1793610000,"ac1f3baf",1,"quiz","c1","knew","mc"],[1793613600,"ad1f3d42",0,"quiz","c1","","mc"],[1793617200,"b823cbc1",1,"quiz","c3","unsure","mc"],[1793620800,"b816ffce",1,"quiz","c4","guessed","mc"],[1793624400,"9414888b",1,"quiz","c5","knew","mc"],[1793628000,"9c25de44",0,"quiz","c2","","mc"],[1793696400,"ae1f3ed5",1,"quiz","c1","knew","mc"],[1793700000,"b523c708",1,"quiz","c3","knew","mc"],[1793703600,"ad1f3d42",1,"quiz","c1","knew","mc"],[1793707200,"b716fe3b",0,"quiz","c4","","mc"],[1793790000,"ac1f3baf",1,"quiz","c1","knew","mc"],[1793793600,"b823cbc1",1,"quiz","c3","knew","mc"],[1793797200,"9c25de44",1,"quiz","c2","knew","mc"]],"ranks":{"z1a":null,"z1b":null,"z1c":null,"z2a":null,"z3a":null,"z3b":null,"z4a":null,"z4b":null,"z5a":{"tier":2,"sub":5}},"end":1793800800000};

(async () => {
  const {browser} = await L.launch(NAME);
  if(process.argv.includes('--print-progress')){
    const v = variant('progress', '');
    if(v.error){ console.log(v.error); process.exit(1); }
    const {ctx, page: p} = await open(browser, v.page, T0);
    console.log(JSON.stringify(await p.evaluate(PROGRESS)));
    await ctx.close(); await browser.close(); process.exit(0);
  }
  if(process.argv.includes('--print-sequence')){
    const v = variant('seq', '');
    if(v.error){ console.log(v.error); process.exit(1); }
    const {ctx, page: p} = await open(browser, v.page, T0);
    const out = {};
    for(const seed of [1, 2, 3]) out[seed] = await p.evaluate(SEQUENCE, seed);
    console.log(JSON.stringify(out));
    await ctx.close(); await browser.close(); process.exit(0);
  }

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

  console.log('\n=== 1c. Calculation preset ===');
  {
    const plain = variant('plain', ''), calc = variant('calc', `COURSE.scheduler = {model:'concept', preset:'calc'};`);
    if(plain.error || calc.error){ check(false, 'the calculation-preset test courses build', plain.error || calc.error); }
    else {
      const P = await open(browser, plain.page, T0), C = await open(browser, calc.page, T0);
      // without the preset the scheduler serves exactly what the 5014f27 core served
      for(const seed of [1, 2, 3]){
        const got = await P.page.evaluate(SEQUENCE, seed);
        check(JSON.stringify(got) === JSON.stringify(SEQUENCE_5014F27[seed]), `without the preset, a seeded session (seed ${seed}) serves the same 40 turns as the 5014f27 core`,
          JSON.stringify(got));
      }
      // sessions on the whole test topic: each turn, is a question of another skill eligible, and did the pick share the last skill?
      const SKILLS = mode => {
        let opp = 0, bad = 0, picks = 0;
        for(let t = 0; t < 40; t++){
          DB = BLANK(); DB.settings.pace = 'cram'; DB.settings.mode = mode; LAST_TIER = 0;
          const pool = QUESTIONS.filter(q => q.topic === 'zsched');
          let last = null;
          for(let i = 0; i < 20; i++){
            const prev = last && byId(last);
            const elig = pool.filter(q => q.id !== last && score(q)).concat((typeof earlierDue === 'function' ? earlierDue(pool) : []).filter(q => q.id !== last && score(q) && [2, 4].includes(score(q).tier)));
            const q = pickNext(pool, last); if(!q) break;
            picks++;
            if(prev && elig.some(x => skillOf(x) !== skillOf(prev))){ opp++; if(skillOf(q) === skillOf(prev)) bad++; }
            record(q, (i % 5 === 1) ? 'wrong' : 'correct', 0, 1000); last = q.id;
          }
        }
        return {opp, bad, picks};
      };
      for(const mode of ['normal', 'all']){
        const c = await C.page.evaluate(SKILLS, mode), d = await P.page.evaluate(SKILLS, mode);
        check(c.opp > 50 && c.bad === 0, `with the preset (${mode === 'all' ? 'Ask everything' : 'cram pace'}), no two questions in a row share a skill when another skill was eligible (${c.bad} of ${c.opp} turns)`, c);
        check(d.opp > 50 && d.bad > 0, `without the preset the same sessions do put two questions of one skill in a row (${d.bad} of ${d.opp} turns), so the rule is the preset's`, d);
      }
      // a quiz on lecture 2 only, with a concept of lecture 1 due
      const EARLIER = () => {
        let served = 0, whileNew = 0, other = 0, trials = 40;
        for(let t = 0; t < trials; t++){
          DB = BLANK(); DB.settings.pace = 'cram'; LAST_TIER = 0;
          Object.assign(st('c1'), {seen:1, correct:1, box:1, asked:['z1a'], lastQ:-999, dueQ:0, dueAt:0});
          const pool = QUESTIONS.filter(q => q.topic === 'zsched' && q.sub === 'b');
          let last = null, got = false;
          for(let i = 0; i < 12; i++){
            const q = pickNext(pool, last); if(!q) break;
            if(q.concept === 'c1' && !got){ got = true; served++;
              if(pool.some(x => !DB.concepts[x.concept])) whileNew++; }
            if(!pool.includes(q) && q.concept !== 'c1') other++;
            record(q, 'correct', 0, 1000); last = q.id;
          }
        }
        return {served, whileNew, other, trials};
      };
      const ce = await C.page.evaluate(EARLIER), de = await P.page.evaluate(EARLIER);
      check(ce.served === ce.trials, `with the preset, a due concept from an earlier lecture is served in a quiz on a later lecture (${ce.served} of ${ce.trials} sessions)`, ce);
      check(ce.whileNew * 2 >= ce.trials, `it is mixed in while the later lecture still has new material (${ce.whileNew} of ${ce.trials} sessions), not held back until that runs out`, ce);
      check(ce.other === 0, 'nothing from an earlier lecture that is not due (never seen, or not yet due) is drawn in', ce);
      check(de.served === 0, `without the preset the quiz stays on its own pool (${de.served} of ${de.trials} sessions served the earlier concept)`, de);
      // the retry after "I was sure of that" prefers another skill on the same concept
      const RETRY = () => {
        const out = {};
        for(let t = 0; t < 20; t++){
          DB = BLANK(); startQuiz('zsched', 'a'); Q.current = byId('z1c'); Q.order = [0, 1, 2]; Q.revealed = false; renderQuiz();
          document.querySelector(`#v-quiz button[data-o="1"]`).click();
          const b = document.getElementById('btnSure'); if(b) b.click();
          document.getElementById('btnNext').click();
          const id = Q.current ? Q.current.id : 'none'; out[id] = (out[id] || 0) + 1;
        }
        return out;
      };
      const cr = await C.page.evaluate(RETRY), dr = await P.page.evaluate(RETRY);
      check(cr.z1b === 20, 'with the preset, the question after a confident error on a recall item is the concept\'s calculation item (z1b, 20 of 20)', cr);
      check((dr.z1a || 0) > 0 && (dr.z1b || 0) > 0, 'without the preset it is either of the concept\'s other questions', dr);
      check(!P.errors.length && !C.errors.length, 'no page errors', P.errors.concat(C.errors).slice(0, 2).join('; '));
      await P.ctx.close(); await C.ctx.close();
    }
  }

  console.log('\n=== 1d. No "I know this, skip it" control (on this course\'s own page) ===');
  {
    // the proposal (its reference 15): letting learners drop cards they
    // thought they knew had small but consistent negative effects
    const SKIP = /\bskip|\bi know\b|already know|know (this|it)\b|\bknown\b|too easy|\bretire|\bsuspend|\bbury\b|don.?t (show|ask)|never (show|ask)|(hide|remove|drop) (this|the) (question|card|concept)/i;
    check(SKIP.test('I know this, skip it') && SKIP.test('Mark as known') && !SKIP.test('Next question') && !SKIP.test('Not sure, ask again soon'),
      'the detector finds a skip control in a test label and passes the existing labels');
    const {ctx, page: p, errors} = await L.openFile(browser);
    const controls = () => p.evaluate(() => [...document.querySelectorAll('button, a, [role="button"], .chip, input[type="button"], input[type="submit"]')]
      .filter(e => e.offsetParent !== null || e.getClientRects().length)
      .map(e => [e.id, e.textContent, e.getAttribute('aria-label'), e.title, e.value].filter(Boolean).join(' | ').replace(/\s+/g, ' ').trim()));
    const found = new Set(), screens = [];
    const look = async name => { const c = await controls(); screens.push(name); c.filter(t => SKIP.test(t)).forEach(t => found.add(`${name}: ${t}`)); };
    await look('Topics');
    await p.evaluate(() => startQuiz(null, null));
    for(let i = 0; i < 6; i++){
      const has = await p.evaluate(() => !!(Q && Q.current)); if(!has) break;
      await look('a question before answering');
      const right = i % 2 === 0;
      await p.evaluate(right => { const q = Q.current;
        if(q.type === 'numeric'){ document.getElementById('numIn').value = String(right ? q.answer : q.answer + 1000); document.getElementById('btnCheck').click(); }
        else if(q.type === 'match'){ const sels = [...document.querySelectorAll('#v-quiz select[data-row]')];
          sels.forEach((s, j) => { s.value = String(right ? j : (j + 1) % sels.length); s.dispatchEvent(new Event('change')); }); document.getElementById('btnCheck').click(); }
        else if(isMulti(q)){ for(const j of (right ? correctSet(q) : [q.options.findIndex(o => !o.correct)])) document.querySelector(`#v-quiz button[data-o="${j}"]`).click(); document.getElementById('btnCheck').click(); }
        else document.querySelector(`#v-quiz button[data-o="${q.options.findIndex(o => right ? o.correct : !o.correct)}"]`).click(); }, right);
      await look(right ? 'after a right answer' : 'after a miss');
      await p.evaluate(right => { const b = document.getElementById(right ? 'btnShaky' : 'btnSure'); if(b) b.click(); }, right);
      await look(right ? 'after "Not sure"' : 'after "I was sure of that"');
      await p.evaluate(() => { const b = document.getElementById('btnNext'); if(b) b.click(); });
    }
    await look('the end of a quiz');
    for(const v of ['gaps', 'exam', 'settings']){ await p.evaluate(v => show(v), v); await look(v === 'gaps' ? 'Weak spots' : v === 'exam' ? 'the exam page' : 'Settings'); }
    await p.evaluate(() => { show('exam'); const b = document.getElementById('startExam'); if(b) b.click(); });
    await look('an exam paper');
    check(screens.length >= 10 && !found.size, `no control offers to skip a question or mark it known, on ${screens.length} screens`, [...found].slice(0, 3).join('; '));
    check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
    await ctx.close();
  }

  console.log('\n=== 2. FSRS option (scheduler.model \'fsrs\') ===');
  {
    const lib = await library();
    const v = variant('fsrs', `COURSE.scheduler = {model:'fsrs'};`), c = variant('conceptlib', `COURSE.scheduler = {model:'concept'};`);
    if(v.error || c.error || lib.error){ check(false, 'the FSRS test course builds and the vendored library loads in node', v.error || c.error || lib.error); }
    else {
      const html = fs.readFileSync(v.page, 'utf8'), plainHtml = fs.readFileSync(c.page, 'utf8');
      const umd = fs.readFileSync(path.join(L.PAGE.SRC, 'vendor', 'ts-fsrs-6.0.0.umd.js'), 'utf8');
      check(html.includes(umd) && /MIT License/.test(html) && /BSD 3-Clause License/.test(html) && /ts-fsrs 6\.0\.0 \(npm, dist\/index\.umd\.js, unchanged\)/.test(html),
        'the FSRS course\'s page carries the vendored ts-fsrs bundle unchanged, with the licence texts above it');
      check(!plainHtml.includes(umd.slice(0, 400)) && !plainHtml.includes('exports.DefaultScheduler') && !/BSD 3-Clause License/.test(plainHtml),
        `a concept-scheduler page carries no library (pages ${(plainHtml.length / 1024).toFixed(0)} KB and ${(html.length / 1024).toFixed(0)} KB)`);
      check(/scheduler: fsrs; ts-fsrs 6\.0\.0 inlined/.test(v.out) && /scheduler: concept \(no library\)/.test(c.out), 'the build says which scheduler it built and whether it inlined the library', v.out.split('\n').filter(l => /scheduler:/.test(l)).join(' / '));

      const {ctx, page: p, errors} = await open(browser, v.page, T0);
      // (typeof guards: on an older core these names do not exist, and the checks fail instead of stopping)
      const ready = await p.evaluate(() => typeof FS === 'undefined' ? {ok: false, why: 'no FS in this page'}
        : {ok: !!FS, model: FS && FS.definition.model.name, err: FS_ERROR, sched: SCHED.model});
      check(ready.ok && ready.model === 'fsrs-7' && ready.sched === 'fsrs', 'the page\'s scheduler is ready as soon as the page has loaded, and it is FSRS-7', ready);
      const cfg = await p.evaluate(() => typeof FS !== 'undefined' && FS ? JSON.stringify(FS.config) : '');
      check(cfg === JSON.stringify(lib.ref.config), 'its settings are exactly what DefaultScheduler() with no options gives (default parameters and target retention)', cfg.slice(0, 160));

      // a fixed answer sequence through the screen, compared with the library run directly
      const showQ = (id, sub) => p.evaluate(([id, sub]) => { startQuiz('zsched', sub || null); Q.current = byId(id); Q.order = Q.current.options.map((o, i) => i);
        Q.picked = null; Q.revealed = false; renderQuiz(); }, [id, sub]);
      const pick = right => p.evaluate(right => { const i = Q.current.options.findIndex(o => right ? o.correct : !o.correct);
        document.querySelector(`#v-quiz button[data-o="${i}"]`).click(); }, right);
      const tap = sel => p.evaluate(sel => { const b = document.querySelector(sel); if(b && !b.disabled) b.click(); return !!b; }, sel);
      const STEPS = [[0, true, null, 3], [60, true, null, 3], [120, false, null, 1], [1440, true, null, 3],
                     [1445, true, '#btnGuess', 1], [3 * 1440, true, '#btnShaky', 3], [10 * 1440, false, '#btnSure', 1]];
      const LP = await libraryPage(browser);
      const want = await LP.replay('z3a', STEPS.map(([m, , , g]) => [ms(T0) + m * 60000, g]));
      await LP.ctx.close();
      const got = [], logs = [];
      for(const [m, right, btn] of STEPS){
        await p.clock.setFixedTime(new Date(ms(T0) + m * 60000));
        await showQ('z3a', 'b'); await pick(right); if(btn) await tap(btn);
        got.push(await p.evaluate(() => DB.fsrsQ && DB.fsrsQ.z3a ? JSON.parse(JSON.stringify(DB.fsrsQ.z3a)) : null));
        logs.push(await p.evaluate(() => LOG[LOG.length - 1]));
      }
      const norm = o => JSON.stringify(Object.keys(o || {}).sort().reduce((a, k) => (a[k] = o[k], a), {}));
      const same = got.map((g, i) => norm(g) === norm(want[i].card));
      check(same.every(Boolean), 'after each of 7 answers (right, wrong, same day, next day, "I guessed", "Not sure", "I was sure of that") the stored card equals the library\'s own review of the same sequence',
        JSON.stringify(same.map((x, i) => x ? 'ok' : {got: got[i], want: want[i].card}).filter(x => x !== 'ok').slice(0, 1)));
      check(got[0] && got[1] && got[1].stability !== got[0].stability && got[1].stabilityFast !== got[0].stabilityFast && norm(got[1]) === norm(want[1].card),
        `a second answer an hour later, the same day, changes the memory state (stability ${(got[0] || {}).stability} -> ${(got[1] || {}).stability})`);
      const rec = logs.map(e => e[9]), wantRec = want.map(w => w.recall === null ? null : Math.round(w.recall * 10000) / 10000);
      check(JSON.stringify(rec) === JSON.stringify(wantRec), 'each answer logs the library\'s predicted recall before that answer (null for the first)', JSON.stringify({rec, wantRec}));
      check(logs.every(e => e[7] === 'fsrs' && e[8] === ''), 'each answer logs scheduler "fsrs" and no comparison arm', JSON.stringify(logs.map(e => e.slice(7, 9))));
      check(logs[6][5] === 'sure' && logs[4][5] === 'guessed' && logs[5][5] === 'unsure', 'the confidence buttons are logged as before', JSON.stringify(logs.map(e => e[5])));
      const sure = await p.evaluate(() => ({note: !!document.getElementById('sureNote'), check: (DB.concepts.c3 || {}).check, retry: Q.retryConcept}));
      check(!sure.note && !sure.check && !sure.retry, 'under FSRS "I was sure of that" records the confidence only: no later-day check, no forced retry, no line about one', sure);

      // what comes next
      const sched = await p.evaluate(() => { try {
        const out = {}, pool = QUESTIONS.filter(q => q.topic === 'zsched' && q.sub === 'b'), z = id => byId(id);
        const at = t => { Date.now = () => t; };      // the page clock is fixed; move it here for the picks
        const t0 = Date.now();
        DB = BLANK(); DB.settings.mode = 'normal';
        record(z('z4a'), 'correct', 0, 1000);
        const card = DB.fsrsQ.z4a;
        out.notDue = [...Array(30)].map(() => pickNext(pool, null)).every(q => q && q.id !== 'z4a');
        out.nothing = pickNext([z('z4a')], null) === null;
        DB.settings.mode = 'all'; out.all = (pickNext([z('z4a')], null) || {}).id; DB.settings.mode = 'normal';
        at(card.dueAt + 1000); out.dueFirst = (pickNext(pool, null) || {}).id;
        // three due cards with different recall: the lowest goes first
        at(t0 + 3 * 86400000); record(z('z5a'), 'correct', 0, 1000);
        at(t0 + 5 * 86400000); record(z('z3a'), 'correct', 0, 1000);
        at(t0 + 40 * 86400000);
        const due = ['z3a', 'z4a', 'z5a'].map(id => ({id, r: fsRecall(DB.fsrsQ[id], Date.now()), due: Date.now() >= DB.fsrsQ[id].dueAt}));
        out.due = due; out.lowest = due.slice().sort((a, b) => a.r - b.r)[0].id; out.pick = (pickNext(pool, null) || {}).id;
        // a miss comes back when the library's card falls due, not before
        at(t0 + 41 * 86400000); record(z('z5a'), 'wrong', 0, 1000);
        const miss = DB.fsrsQ.z5a; out.missStep = (miss.dueAt - Date.now()) / 60000;
        out.beforeDue = (pickNext([z('z5a'), z('z3b')], null) || {}).id;
        at(miss.dueAt); out.atDue = (pickNext([z('z5a'), z('z3b')], null) || {}).id;
        out.left = remainingIn(pool);
        return out;
      } catch(e){ return {err: e.message, due: [], missStep: NaN}; } });
      check(sched.notDue && sched.nothing, 'a question whose card is not due is not served (30 picks), and a pool of only that question has nothing to serve', sched);
      check(sched.all === 'z4a', '"Ask everything" serves it anyway', sched);
      check(sched.dueFirst === 'z4a', 'once its card is due it comes before questions never answered', sched);
      check(sched.due.length === 3 && sched.due.every(d => d.due) && sched.pick === sched.lowest, `among due cards the one with the lowest predicted recall comes first (${sched.due.map(d => d.id + ' ' + Number(d.r).toFixed(3)).join(', ')})`, sched);
      check(sched.missStep > 0 && sched.beforeDue === 'z3b' && sched.atDue === 'z5a', `a missed question comes back when its card falls due (${Number(sched.missStep).toFixed(1)} minutes later, the library's step), not before`, sched);
      check(sched.left === 3, 'the quiz header counts the concepts that have a question never answered or due (3 of 3 here)', sched);
      check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
      await ctx.close();
    }
  }

  console.log('\n=== 3. Combination (scheduler.model \'concept-fsrs\') and the comparison ===');
  {
    const one = variant('combo1', `COURSE.scheduler = {model:'concept-fsrs', compare:false};`);
    const cmp = variant('combo', `COURSE.scheduler = {model:'concept-fsrs', compare:true};`);
    if(one.error || cmp.error){ check(false, 'the combination test courses build', one.error || cmp.error); }
    else {
      // ---- one FSRS state per concept, rotation, grades (comparison off: every concept on the combination)
      let {ctx, page: p, errors} = await open(browser, one.page, T0);
      const has = await p.evaluate(() => typeof SCHED !== 'undefined' && SCHED.model === 'concept-fsrs' && typeof FS !== 'undefined' && !!FS);
      check(has, 'the combination course runs concept-fsrs with the library ready');
      const showQ = (id, sub) => p.evaluate(([id, sub]) => { startQuiz('zsched', sub || null); Q.current = byId(id); Q.order = Q.current.options.map((o, i) => i);
        Q.picked = null; Q.revealed = false; renderQuiz(); }, [id, sub]);
      const pick = right => p.evaluate(right => { const i = Q.current.options.findIndex(o => right ? o.correct : !o.correct);
        document.querySelector(`#v-quiz button[data-o="${i}"]`).click(); }, right);
      const tap = sel => p.evaluate(sel => { const b = document.querySelector(sel); if(b && !b.disabled) b.click(); return !!b; }, sel);
      // [minutes after T0, question, right, button, grade the proposal gives it]
      const STEPS = [[0, 'z1a', true, null, 3], [1440, 'z1b', true, '#btnShaky', 3], [3 * 1440, 'z1c', true, '#btnGuess', 1],
                     [10 * 1440, 'z1a', false, null, 1], [10 * 1440 + 60, 'z1b', true, null, 3]];
      const LP = await libraryPage(browser);
      const want = await LP.replay('c1', STEPS.map(([m, , , , g]) => [ms(T0) + m * 60000, g]));
      await LP.ctx.close();
      const got = [], logs = [];
      let whyAfterUnsure = null;
      for(const [m, id, right, btn] of STEPS){
        await p.clock.setFixedTime(new Date(ms(T0) + m * 60000));
        await showQ(id, 'a'); await pick(right); if(btn) await tap(btn);
        if(btn === '#btnShaky') whyAfterUnsure = await p.evaluate(() => !!document.querySelector('#v-quiz .why .verdict') && !!document.querySelector('#v-quiz .why .wrow'));
        got.push(await p.evaluate(() => DB.fsrsC && DB.fsrsC.c1 ? JSON.parse(JSON.stringify(DB.fsrsC.c1)) : null));
        logs.push(await p.evaluate(() => LOG[LOG.length - 1]));
      }
      const norm = o => JSON.stringify(Object.keys(o || {}).sort().reduce((a, k) => (a[k] = o[k], a), {}));
      const same = got.map((g, i) => norm(g) === norm(want[i].card));
      check(same.every(Boolean), 'one card per concept: after answers to three different questions of c1 it equals the library\'s review of the same sequence (Knew it = Good, Not sure = Good, I guessed = Again, wrong = Again, same-day right = Good)',
        JSON.stringify(same.map((x, i) => x ? 'ok' : {step: i, got: got[i], want: want[i].card}).filter(x => x !== 'ok').slice(0, 1)));
      check(await p.evaluate(() => !Object.keys(DB.fsrsQ || {}).length), 'no per-question cards are kept under the combination');
      check(whyAfterUnsure === true, 'after "Not sure" the explanation stays on screen');
      const rec = logs.map(e => e[9]), wantRec = want.map(w => w.recall === null ? null : Math.round(w.recall * 10000) / 10000);
      check(logs.every(e => e[7] === 'concept-fsrs' && e[8] === '') && JSON.stringify(rec) === JSON.stringify(wantRec),
        'each answer logs scheduler "concept-fsrs", no arm (no comparison) and the library\'s predicted recall for the concept', JSON.stringify({log: logs.map(e => e.slice(7)), wantRec}));
      const rot = await p.evaluate(() => { try {
        const out = {}, z = id => byId(id), at = t => { Date.now = () => t; }, t0 = Date.now();
        const poolA = QUESTIONS.filter(q => q.topic === 'zsched' && q.sub === 'a'), poolB = QUESTIONS.filter(q => q.topic === 'zsched' && q.sub === 'b');
        // the concept is due: its question seen least recently comes (z1c was last seen before z1a and z1b)
        at(DB.fsrsC.c1.dueAt + 1000); out.leastRecent = (pickNext(poolA, null) || {}).id;
        // "Not sure", then the concept's next turn is another of its questions
        DB = BLANK(); at(t0); record(z('z4a'), 'correct', 0, 1000); markShaky(z('z4a'));
        at(DB.fsrsC.c4.dueAt + 1000); out.afterUnsure = (pickNext([z('z4a'), z('z4b')], null) || {}).id;
        // three due concepts: the one with the lowest predicted recall goes next
        DB = BLANK();
        at(t0); record(z('z3a'), 'correct', 0, 1000); at(t0 + 2 * 86400000); record(z('z4a'), 'correct', 0, 1000);
        at(t0 + 4 * 86400000); record(z('z5a'), 'correct', 0, 1000); at(t0 + 40 * 86400000);
        out.r = ['c3', 'c4', 'c5'].map(c => [c, fsRecall(DB.fsrsC[c], Date.now())]);
        out.lowest = out.r.slice().sort((a, b) => a[1] - b[1])[0][0];
        const q = pickNext(poolB, null) || {}; out.pickConcept = q.concept; out.pickId = q.id;
        return out; } catch(e){ return {err: e.message, r: []}; } });
      check(rot.leastRecent === 'z1c', 'within a due concept the question seen least recently is shown (z1c)', rot);
      check(rot.afterUnsure === 'z4b', 'after "Not sure" the concept comes back as a different question', rot);
      check(rot.pickConcept === rot.lowest && rot.pickId === 'z3b', `the due concept with the lowest predicted recall goes next (${rot.r.map(([c, r]) => c + ' ' + Number(r).toFixed(3)).join(', ')}), as its question not yet shown`, rot);
      check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
      await ctx.close();

      // ---- the comparison
      ({ctx, page: p, errors} = await open(browser, cmp.page, T0));
      const fnv = id => { let h = 0x811c9dc5; for(let i = 0; i < id.length; i++){ h ^= id.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; };
      const ns = await p.evaluate(() => typeof NS !== 'undefined' ? NS : '');
      const ids = ['c1', 'c2', 'c3', 'c4', 'c5'];
      const hashArm = c => (fnv(c + '|' + ns) >>> 31) ? 'concept-fsrs' : 'concept';
      const arms0 = await p.evaluate(ids => ids.map(c => typeof armOf === 'function' ? armOf(c) : null), ids);
      check(JSON.stringify(arms0) === JSON.stringify(ids.map(hashArm)), `each concept's arm is the top bit of FNV-1a("<concept>|${ns}") (${ids.map((c, i) => c + ' ' + arms0[i]).join(', ')})`, arms0);
      check(new Set(arms0).size === 2, 'the five test concepts, whose ids differ only in the last character, are not all on one arm', arms0);
      const share = await p.evaluate(() => { let n = 0, sw = 0, prev = null;
        for(let i = 0; i < 2000; i++){ const a = typeof armOf === 'function' ? armOf('concept-' + i) : null; if(a === 'concept-fsrs') n++; if(prev !== null && a !== prev) sw++; prev = a; }
        return {n, sw}; });
      check(share.n >= 900 && share.n <= 1100, `over 2000 concept ids, ${share.n} go to the combination and ${2000 - share.n} to the concept scheduler`, share);
      check(share.sw >= 900 && share.sw <= 1100, `neighbouring ids (concept-0, concept-1, ...) change arm ${share.sw} times in 1999, about half, so the arm does not follow the numbering`, share);
      await p.evaluate(() => { record(byId('z1a'), 'correct', 0, 1000); });
      await p.waitForTimeout(400);
      const stored = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem(NS + ':data:' + PROFILE) || '{}'); return d.arms || null; });
      check(stored && stored.c1 === arms0[0], 'the first answer stores the concept\'s arm with the progress', stored);
      // a stored assignment holds across visits, even where the hash would say otherwise
      const flip = arms0[1] === 'concept' ? 'concept-fsrs' : 'concept';
      await p.evaluate(flip => { DB.arms = DB.arms || {}; DB.arms.c2 = flip; save(); }, flip);
      await p.waitForTimeout(400);
      await p.reload(); await p.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
      const arms1 = await p.evaluate(ids => ids.map(c => typeof armOf === 'function' ? armOf(c) : null), ids);
      check(arms1[0] === arms0[0] && arms1[1] === flip && arms1.slice(2).join() === arms0.slice(2).join(), 'after a reload every concept keeps its arm; a stored one wins over the hash', arms1);

      // a session on the test topic with c1, c3 on the combination and c2, c4, c5 on the concept scheduler
      const sess = await p.evaluate(() => { try {
        DB = BLANK(); LOG.length = 0; DB.arms = {c1: 'concept-fsrs', c3: 'concept-fsrs', c2: 'concept', c4: 'concept', c5: 'concept'};
        DB.settings.mode = 'all'; DB.settings.pace = 'cram';
        const pool = QUESTIONS.filter(q => q.topic === 'zsched'), n = {concept: 0, 'concept-fsrs': 0};
        let last = null, worst = 0, t = Date.now(); const both = [], logs = [];
        for(let i = 0; i < 30; i++){
          Date.now = () => t + i * 60000;
          const q = pickNext(pool, last); if(!q) break;
          const arm = armOf(q.concept); n[arm]++; worst = Math.max(worst, Math.abs(n.concept - n['concept-fsrs']));
          record(q, i % 4 === 3 ? 'wrong' : 'correct', 0, 1000); last = q.id; logs.push(LOG[LOG.length - 1]);
        }
        return {n, worst, logsOk: logs.every(e => e[8] === armOf(e[4]) && e[7] === e[8]),
                recallOk: logs.every(e => e[8] === 'concept' ? e[9] === null : (e[9] === null || (e[9] > 0 && e[9] < 1)))};
      } catch(e){ return {err: e.message, n: {}}; } });
      check(sess.n.concept + sess.n['concept-fsrs'] === 30 && sess.worst <= 1, `with both arms able to ask, a 30-question session shares its questions evenly (${sess.n.concept} concept, ${sess.n['concept-fsrs']} combination; never more than ${sess.worst} apart)`, sess);
      check(sess.logsOk, 'every answer logs its concept\'s arm, and the scheduler named is that arm', sess);
      check(sess.recallOk, 'the concept arm logs no predicted recall; the combination logs the library\'s', sess);
      const cont = await p.evaluate(() => { try {
        DB = BLANK(); LOG.length = 0; DB.arms = {c1: 'concept-fsrs', c3: 'concept-fsrs', c2: 'concept', c4: 'concept', c5: 'concept'};
        DB.settings.mode = 'normal'; DB.settings.pace = 'semester';
        for(const id of ['z2a', 'z4a', 'z4b', 'z5a']) record(byId(id), 'correct', 0, 1000);   // every concept-arm concept answered, none due
        const q = pickNext(QUESTIONS.filter(x => x.topic === 'zsched'), null);
        return {id: q && q.id, arm: q && armOf(q.concept)};
      } catch(e){ return {err: e.message}; } });
      check(cont.arm === 'concept-fsrs', 'when one arm has nothing to ask the other arm takes the turn, so the session goes on', cont);
      // "I was sure of that": the concept arm's check and retry; the combination records the confidence only
      const sure = await p.evaluate(() => { try {
        DB = BLANK(); DB.arms = {c1: 'concept', c3: 'concept-fsrs'};
        const run = id => { startQuiz('zsched', null); Q.current = byId(id); Q.order = [0, 1, 2]; Q.revealed = false; renderQuiz();
          document.querySelector('#v-quiz button[data-o="1"]').click(); const b = document.getElementById('btnSure'); if(b) b.click();
          return {note: !!document.getElementById('sureNote'), check: !!(DB.concepts[Q.current.concept] || {}).check, retry: Q.retryConcept || null}; };
        return {concept: run('z1a'), combo: run('z3a')};
      } catch(e){ return {err: e.message, concept: {}, combo: {}}; } });
      check(sure.concept.note && sure.concept.check && sure.concept.retry === 'c1', 'under the comparison, "I was sure of that" on a concept-arm concept sets its check and retry', sure);
      check(!sure.combo.note && !sure.combo.check && !sure.combo.retry, 'on a combination concept it records the confidence only', sure);
      check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
      await ctx.close();
    }
  }

  console.log('\n=== 4. Saved progress from the 5014f27 core ===');
  {
    const F = SAVED_5014F27;
    const conv = variant('conv', ''), convf = variant('convf', `COURSE.scheduler = {model:'fsrs'};`),
          convc = variant('convc', `COURSE.scheduler = {model:'concept-fsrs', compare:true};`);
    if(conv.error || convf.error || convc.error){ check(false, 'the converter test courses build', conv.error || convf.error || convc.error); }
    else {
      const nsOf = repo => new Function(fs.readFileSync(path.join(repo, 'src', 'course.js'), 'utf8') + ';return COURSE.ns;')();
      // the saved progress and history under this course's keys, before the page's script runs
      const openSaved = async (v, db) => {
        const ns = nsOf(v.repo);
        const ctx = await browser.newContext({viewport: {width: 390, height: 844}});
        await ctx.addInitScript(() => { window.prompt = () => 'TestUser'; });
        await ctx.addInitScript(([ns, db, log]) => { if(sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
          localStorage.setItem(ns + ':profile', 'TestUser'); localStorage.setItem(ns + ':data:TestUser', JSON.stringify(db));
          localStorage.setItem(ns + ':log:TestUser', JSON.stringify(log)); }, [ns, db, F.log]);
        const page = await ctx.newPage(); const errors = [];
        page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
        await page.clock.setFixedTime(new Date(F.end));
        await page.goto('file://' + v.page);
        await page.waitForFunction(() => document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
        await page.waitForTimeout(200);
        return {ctx, page, errors, ns};
      };
      const ADDED = ['v', 'fsrsQ', 'fsrsC', 'arms', 'fsUndo', 'fsHistory'];
      const strip = db => { const o = JSON.parse(JSON.stringify(db)); ADDED.forEach(k => delete o[k]);
        Object.values(o.concepts || {}).forEach(s => { delete s.last; }); return o; };
      const lastWant = {};
      for(const a of F.db.answers){ const m = lastWant[a.concept] = lastWant[a.concept] || {}; if(!(a.qid in m) || m[a.qid] < a.qn) m[a.qid] = a.qn; }

      // the concept scheduler
      let {ctx, page: p, errors, ns} = await openSaved(conv, F.db);
      let db = await p.evaluate(() => JSON.parse(JSON.stringify(DB)));
      check(JSON.stringify(strip(db)) === JSON.stringify(F.db), 'every field the 5014f27 core saved is read back unchanged (concepts, answers, question count, settings)', JSON.stringify(strip(db)).slice(0, 200));
      check(db.v === 2, 'the progress is marked as the new shape (v 2)', db.v);
      check(Object.keys(lastWant).every(c => JSON.stringify(db.concepts[c].last) === JSON.stringify(lastWant[c])), 'each concept\'s `last` is rebuilt from the saved answers', JSON.stringify(Object.fromEntries(Object.keys(lastWant).map(c => [c, db.concepts[c].last]))));
      const ids = await p.evaluate(ids => ({missing: ids.filter(id => !byId(id)), ns: NS}), F.db.answers.map(a => a.qid));
      check(!ids.missing.length && ids.ns === ns, `every saved question id is in the bank and the progress is read under the same ns (${ns})`, ids);
      const ranks = await p.evaluate(() => { const r = {}; QUESTIONS.filter(q => q.topic === 'zsched').forEach(q => { r[q.id] = score(q); }); return r; });
      check(JSON.stringify(ranks) === JSON.stringify(F.ranks), 'the scheduler ranks every test question as the 5014f27 core did from the same save', JSON.stringify({ranks, was: F.ranks}).slice(0, 300));
      const log = await p.evaluate(() => LOG.slice());
      check(JSON.stringify(log) === JSON.stringify(F.log) && log.every(e => e.length === 7), 'the saved seven-field history is read back unchanged', JSON.stringify(log.slice(0, 2)));
      await p.evaluate(() => record(byId('z5a'), 'correct', 0, 1000));
      await p.waitForTimeout(400);
      const saved = await p.evaluate(ns => JSON.parse(localStorage.getItem(ns + ':data:TestUser')), ns);
      check(saved.v === 2 && saved.answers.length === F.db.answers.length + 1 && JSON.stringify(saved.answers.slice(0, -1)) === JSON.stringify(F.db.answers),
        'the next save writes the new shape with every earlier answer kept', {v: saved.v, n: saved.answers.length});
      check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
      // Import progress converts the same way
      const file = path.join(conv.repo, 'saved-5014f27.json');
      fs.writeFileSync(file, JSON.stringify({app: 'exam-drill', ns, db: F.db, log: F.log}));
      await p.evaluate(() => { DB = BLANK(); show('settings'); });
      await p.setInputFiles('#fileIn', file);
      await p.waitForTimeout(600);
      db = await p.evaluate(() => JSON.parse(JSON.stringify(DB)));
      check(db.v === 2 && JSON.stringify(strip(db)) === JSON.stringify(F.db) && JSON.stringify(db.concepts.c1.last) === JSON.stringify(lastWant.c1),
        'Import progress of a 5014f27 export gives the same converted progress', {v: db.v});
      await ctx.close();

      // an FSRS course reading the same save: cards rebuilt from the whole history, through the library
      ({ctx, page: p, errors} = await openSaved(convf, F.db));
      db = await p.evaluate(() => JSON.parse(JSON.stringify(DB)));
      const grade = a => a.result === 'correct' ? 3 : 1;
      const byQ = {}; F.db.answers.forEach(a => (byQ[a.qid] = byQ[a.qid] || []).push([a.at, grade(a)]));
      const LP = await libraryPage(browser), wantQ = {};
      for(const [id, steps] of Object.entries(byQ)) wantQ[id] = (await LP.replay(id, steps)).pop().card;
      const norm = o => JSON.stringify(Object.keys(o || {}).sort().reduce((a, k) => (a[k] = o[k], a), {}));
      const badQ = Object.keys(wantQ).filter(id => norm((db.fsrsQ || {})[id]) !== norm(wantQ[id]));
      check(db.fsHistory === 'replayed' && Object.keys(wantQ).length >= 8 && !badQ.length,
        `under 'fsrs' each of the ${Object.keys(wantQ).length} answered questions gets the card the library builds from its saved answers`, {fsHistory: db.fsHistory, badQ});
      check(JSON.stringify(strip(db)) === JSON.stringify(F.db), 'and the saved fields themselves are unchanged');
      check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
      await ctx.close();
      // part of a history only (the oldest answer gone): no card is made up from it
      const cut = JSON.parse(JSON.stringify(F.db)); cut.answers.shift();
      ({ctx, page: p, errors} = await openSaved(convf, cut));
      db = await p.evaluate(() => ({h: DB.fsHistory, n: Object.keys(DB.fsrsQ || {}).length, pick: (pickNext(QUESTIONS.filter(q => q.topic === 'zsched'), null) || {}).id}));
      check(db.h === 'incomplete' && db.n === 0 && !!db.pick, 'when the saved answers are not the whole history, no card is built and the questions start as new under FSRS', db);
      await ctx.close();
      // the comparison: cards only for the concepts on the combination arm
      ({ctx, page: p, errors} = await openSaved(convc, F.db));
      db = await p.evaluate(() => ({fsrsC: JSON.parse(JSON.stringify(DB.fsrsC || {})), arms: Object.fromEntries(Object.keys(DB.concepts).map(c => [c, armOf(c)])), h: DB.fsHistory}));
      const byC = {}; F.db.answers.forEach(a => (byC[a.concept] = byC[a.concept] || []).push([a.at, grade(a)]));
      const wantC = {};
      for(const [c, steps] of Object.entries(byC)) if(db.arms[c] === 'concept-fsrs') wantC[c] = (await LP.replay(c, steps)).pop().card;
      await LP.ctx.close();
      const okC = Object.keys(db.fsrsC).sort().join() === Object.keys(wantC).sort().join() && Object.keys(wantC).every(c => norm(db.fsrsC[c]) === norm(wantC[c]));
      check(okC, `under the comparison only the combination's concepts get a card, the library's from their saved answers (${Object.keys(wantC).join(', ') || 'none on that arm'})`, db);
      check(!errors.length, 'no page errors', errors.slice(0, 2).join('; '));
      await ctx.close();
    }
  }

  await browser.close();
  L.finish(NAME);
})().catch(e => { console.log(e.stack); console.log(`FAIL: ${NAME}: the test stopped: ${String(e.message).split('\n')[0]}`); process.exit(1); });
