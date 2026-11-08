/* The exam paper's own controls: Review, Submit, the selection on screen, and
 * the opening page's description of the paper.
 *
 * Found on DEENT's live site (core 25c643d, 2026-11-06):
 *   1. On the last question the button beside Back said "Review", and pressing
 *      it graded the paper, recorded every answer (blank ones as misses) and
 *      showed the score, with no question asked. "Submit paper" asked first.
 *      Now Review opens an overview of the paper: every question number with
 *      answered or not answered, a way back to any of them, and one submit
 *      button that asks the same question as "Submit paper". Opening it grades,
 *      records and shows nothing; Cancel on the question keeps the paper.
 *   2. The opening page said the paper "mixes single-answer and select-all
 *      items ... about 0 of the 50 are select-all". It now names what 20
 *      sample draws put on practice papers, worded as a sample and not as the
 *      official exam format ("carry about N" or "between lo and hi ...; yours may differ",
 *      "not expected to carry select-all items"; Louis, 2026-11-06).
 *   3. A chosen answer on a running paper was drawn in the colour of a right
 *      answer (class pick-ok, green), right or wrong. It is now drawn in the
 *      neutral selection colour, the same for a right and a wrong choice;
 *      green and red appear only on the result page.
 *
 * Checks also kept here, so the change cannot break them: Back and Next, the
 * clock counting down and the running paper coming back after a reload (also
 * from the overview), a paper whose clock ran out while the page was closed is
 * submitted as it stands, blank items of a partial paper are left out of the
 * history, and a full paper's score (9 of 50 right shows 18%; on a smaller
 * paper the same share). Run on the course's own page; when its exam has no
 * question count (template-unset), on a scratch copy with a count of 4. A
 * scratch copy with the time limit unset (minutes: null) checks the overview on
 * an untimed paper, and one with a select-all target of 3 checks the opening
 * page when the exam's pools hold fewer.
 *
 *     node exam_review_test.js
 */
const L = require('./check_lib');
const NAME = 'exam_review_test.js';
const {check} = L;
L.PAGE.need(NAME);

const ACTIVE = 'const E = COURSE.exams.find(e => e.id === COURSE.activeExam) || COURSE.exams[0];';
const ready = page => page.waitForFunction(() => typeof NS === 'string' && document.querySelectorAll('#nav button').length > 3, null, {timeout: 15000});
// window.confirm answers what window.__ok says and keeps each question asked
const SPY = () => { window.__asked = []; window.__ok = false; window.confirm = m => { window.__asked.push(String(m)); return !!window.__ok; }; };
const spy = page => page.evaluate(SPY);
// answers the question on screen through its own controls, right or wrong
const ANS = right => {
  const q = EX.qs[EX.i];
  if(q.type === 'numeric'){ const n = document.getElementById('exNum'); n.value = String(right ? q.answer : q.answer + 1000); n.dispatchEvent(new Event('input')); return; }
  if(q.type === 'match'){ EX.picks[EX.i] = q.pairs.map((p, i) => right ? i : (i + 1) % q.pairs.length); saveExam(); return; }
  let want;
  if(isMulti(q)){ const c = correctSet(q), w = q.options.findIndex(o => !o.correct); want = right ? c : (w >= 0 ? [w] : c.slice(0, 1)); }
  else want = [q.options.findIndex(o => right ? o.correct : !o.correct)];
  // set the choice, not toggle it: a select-all option clicked a second time is taken off again, so a question
  // answered earlier (question 1 in Next and Back) would lose its answer when answered again. Click only the
  // options whose state differs from the wanted one (aria-pressed is the drawn state).
  const btn = oi => document.querySelector(`#v-exam button.opt[data-o="${oi}"]`);
  const on = oi => btn(oi).getAttribute('aria-pressed') === 'true';
  if(isMulti(q)){ q.options.forEach((o, oi) => { if(want.includes(oi) !== on(oi)) btn(oi).click(); }); return; }
  for(const oi of want) if(!on(oi)) btn(oi).click();
};
const state = page => page.evaluate(() => ({running: !!(EX && EX.running), done: !!(EX && EX.done), i: EX ? EX.i : -1, n: EX && EX.qs ? EX.qs.length : 0,
  ids: EX && EX.qs ? EX.qs.map(q => q.id).join() : '', picks: EX ? JSON.stringify(EX.picks) : '', ends: EX ? EX.ends : undefined,
  log: LOG.length, answers: DB.answers.length, stored: localStorage.getItem(NS + ':exam:' + PROFILE),
  prog: ((document.querySelector('#v-exam .prog') || {}).textContent || ''), clock: ((document.getElementById('exClock') || {}).textContent || ''),
  review: !!document.getElementById('exReview'), h2: ((document.querySelector('#v-exam h2') || {}).textContent || ''),
  asked: (window.__asked || []).slice()}));
const secs = t => { const m = /(\d+):(\d+)/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : NaN; };
// this tab holds its profile's lock (or the browser has none): a clear asked for while the lock is
// still being asked for waits for it (views.js clearExam), so a paper would come back
// a lock that never settles is a failing check naming the state seen, not a silent carry-on (the confirmation of 25a6c5b)
const settled = page => page.waitForFunction(() => typeof WRITER === 'undefined' || WRITER === 'held' || WRITER === 'none', null, {timeout: 5000})
  .then(() => true, async () => { const w = await page.evaluate(() => typeof WRITER === 'undefined' ? 'undefined' : String(WRITER)).catch(() => 'unreadable');
    check(false, `the writer lock settles within 5 s before the next step`, {WRITER: w}); return false; });
const start = async page => {
  await settled(page);
  await page.evaluate(() => { if(EX){ clearInterval(EX.timer); EX = null; } clearExam(); show('exam'); });
  await page.click('#startExam');
  await page.waitForTimeout(100);
};
const toLast = async page => { const n = await page.evaluate(() => EX.qs.length); for(let k = await page.evaluate(() => EX.i); k < n - 1; k++) await page.click('#exNext'); };

/* What the opening page says about select-all items, against the papers the draw makes:
   every count seen on 30 fresh draws lies within what the page names. */
/* The opening page's select-all sentence, with the page's sampler and the test's own 20 draws
   run from the same seeded Math.random (mulberry32), so both see the same papers: no flakiness on
   a bank whose count varies from draw to draw (the review of fd2209e, 3). */
const sataText = page => page.evaluate(() => {
  if(EX){ clearInterval(EX.timer); EX = null; } clearExam();
  const seeded = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rnd = Math.random, SEED = 20261106, N = 20;
  let seen = null;
  try {
    Math.random = seeded(SEED);
    if(typeof examSataDrawn === 'function'){ try { EXAM_SATA_SEEN = null; } catch(e){} seen = examSataDrawn(); }
    Math.random = seeded(SEED);
    var drawn = []; for(let k = 0; k < N; k++) drawn.push(drawPaper().filter(isMulti).length);
  } finally { Math.random = rnd; }
  show('exam');   // the sampler's result is kept per exam and bank, so the page names what it found
  const sub = document.querySelector('#v-exam p.sub'), text = sub ? sub.textContent.replace(/\s+/g, ' ') : '';
  return {text, drawn, bank: QUESTIONS.filter(isMulti).length, seen: seen && {lo: seen.lo, hi: seen.hi}};
});
/* The page words the sampled count as a sample about practice papers, never as a fact about this
   paper or the official exam (Louis, 2026-11-06), never "about 0" (the review of fd2209e), and names
   exactly the range of the same 20 seeded draws. */
function sataAgrees(r, label){
  const most = Math.max(...r.drawn), least = Math.min(...r.drawn);
  const none = /not expected to carry select-all items \(none in \d+ sample draws\)/.test(r.text);
  const about = /carry about (\d+) select-all/.exec(r.text), between = /carry between (\d+) and (\d+) select-all items/.exec(r.text);
  const guarantee = /This paper has no select-all|Between \d+ and \d+ of the|\d+ of the \d+ (?:is|are) select-all|mixes single-answer and select-all|about 0 select-all|same as the real thing/i.test(r.text);
  check(!guarantee && /practice papers, not the official exam format/.test(r.text) && (none || ((about || between) && /yours may differ/.test(r.text))),
    `${label}: the opening page words the select-all count as a sample about practice papers (never "about 0", never a fact about the real exam)`, r.text);
  const named = none ? [0, 0] : about ? [+about[1], +about[1]] : between ? [+between[1], +between[2]] : null;
  check(named && named[0] === least && named[1] === most && (!about || +about[1] > 0),
    `${label}: what it names (${named ? (named[0] === named[1] ? named[0] : named[0] + '-' + named[1]) : 'nothing'}) is the range of the same 20 seeded draws (${least}-${most}; ${r.bank} in the bank)`,
    {text: r.text, drawn: r.drawn, seen: r.seen});
  return most;
}
async function setupText(page, label){
  sataAgrees(await sataText(page), label);
  // a blueprint whose select-all count cannot be reached: sata 0 with a part whose category holds
  // only select-all items (the review of 007e956, 1); the page must name what the draw puts on it
  const set = await page.evaluate(() => {
    const elig = QUESTIONS.filter(q => !q.lowYield && !q.type);
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const q = elig.find(x => isMulti(x) && elig.filter(y => y.concept === x.concept).every(isMulti));
    if(!q) return null;
    window.__bp = EXAM.blueprint;
    EXAM.blueprint = {sata: 0, cats: [{key: 'only', match: '\\b' + esc(q.concept) + '\\b'}], rest: 'other',
      parts: [{key: 'only', name: 'only select-all', n: 1}, {key: 'other', name: 'the rest', rest: true}]};
    return q.id;
  });
  if(!set){ L.skip(`${label}: a blueprint whose select-all count cannot be reached`, 'no concept in this bank is made only of select-all items'); return; }
  const r = await sataText(page);
  await page.evaluate(() => { if(window.__bp === undefined) delete EXAM.blueprint; else EXAM.blueprint = window.__bp; });
  const most = sataAgrees(r, `${label}, blueprint with sata 0 and a part only select-all items fill (${set})`);
  check(most >= 1, `${label}: that blueprint really puts a select-all item on the paper (the case the review found)`, r.drawn);
  // a count that varies from draw to draw: the same part takes 0 or 1 question (n: [0, 1]); the page
  // names the range, never "about 0" (the review of fd2209e, 1)
  await page.evaluate(() => { window.__bp = EXAM.blueprint; });
  const set2 = await page.evaluate(id => {
    const q = byId(id), esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    EXAM.blueprint = {sata: 0, cats: [{key: 'only', match: '\\b' + esc(q.concept) + '\\b'}], rest: 'other',
      parts: [{key: 'only', name: 'only select-all', n: [0, 1]}, {key: 'other', name: 'the rest', rest: true}]};
    return id;
  }, set);
  const r2 = await sataText(page);
  await page.evaluate(() => { if(window.__bp === undefined) delete EXAM.blueprint; else EXAM.blueprint = window.__bp; });
  sataAgrees(r2, `${label}, blueprint whose part takes 0 or 1 select-all item (${set2})`);
  check(Math.min(...r2.drawn) === 0 && Math.max(...r2.drawn) === 1 && /carry between 0 and 1 select-all items/.test(r2.text),
    `${label}: that blueprint varies (0 and 1 in 20 seeded draws) and the page names "between 0 and 1"`, {drawn: r2.drawn, text: r2.text});
}

/* Review, Submit, Back and Next, the reload, the score: on one page. */
async function flow(page, label, opts){
  opts = opts || {};
  await spy(page);
  await start(page);
  let s = await state(page);
  if(!check(s.running && s.n > 0, `${label}: the Start button draws a running paper (${s.n} questions)`, s)) return;
  const n = s.n;
  // a select-all item first, when the paper has one: question 1 is answered twice below (Next and Back, then
  // the loop), and a select-all answer is the one a second answer could take off (the failure fixed by #78)
  const multiFirst = await page.evaluate(() => { const j = EX.qs.findIndex(isMulti); if(j > 0){ for(const a of [EX.qs, EX.picks, EX.orders]) if(Array.isArray(a)) [a[0], a[j]] = [a[j], a[0]]; EX.i = 0; renderExamQ(); saveExam(); } return j >= 0; });
  // Next and Back
  if(n > 1){
    await page.evaluate(ANS, true);
    const p0 = (await state(page)).picks;
    await page.click('#exNext');
    s = await state(page);
    check(s.i === 1 && s.prog.startsWith(`Question 2 of ${n}`), `${label}: Next moves to question 2`, s.prog);
    await page.click('#exPrev');
    s = await state(page);
    check(s.i === 0 && s.prog.startsWith(`Question 1 of ${n}`) && s.picks === p0, `${label}: Back returns to question 1 with its answer kept`, s);
  }
  // every question answered but the second (the first when the paper has one question): the first `right` right
  const right = Math.max(1, Math.round(n * 9 / 50)), blankAt = n > 1 ? 1 : 0;
  for(let k = 0; k < n; k++){
    await page.evaluate(k => { EX.i = k; renderExamQ(); }, k);
    if(k !== blankAt) await page.evaluate(ANS, k < right);
  }
  await page.evaluate(() => { EX.i = 0; renderExamQ(); });
  if(multiFirst){
    const q1 = await page.evaluate(() => ({multi: isMulti(EX.qs[0]), picks: (EX.picks[0] || []).slice().sort((a, b) => a - b), want: correctSet(EX.qs[0]).slice().sort((a, b) => a - b)}));
    check(q1.multi && JSON.stringify(q1.picks) === JSON.stringify(q1.want),
      `${label}: question 1, a select-all item, keeps exactly its right answer after it is answered a second time`, q1);
  } else L.skip(`${label}: question 1 answered twice as a select-all item`, 'no select-all item on this paper');
  await toLast(page);
  s = await state(page);
  const before = s;
  const label1 = await page.textContent('#exNext');
  check(/review/i.test(label1) && !/submit/i.test(label1), `${label}: on the last question the button beside Back says Review ("${label1.trim()}")`, label1);
  await page.click('#exNext');
  await page.waitForTimeout(150);
  s = await state(page);
  check(s.running && !s.done, `${label}: Review on the last question leaves the paper running (not graded or finished)`, s);
  check(s.log === before.log && s.answers === before.answers, `${label}: Review records no answer (history ${before.log} → ${s.log}, progress ${before.answers} → ${s.answers})`);
  check(s.stored && s.stored === before.stored, `${label}: Review leaves the saved paper as it was`, {before: before.stored, after: s.stored});
  check(s.asked.length === 0, `${label}: opening the overview asks nothing`, s.asked);
  if(!check(s.review, `${label}: Review opens the overview of the paper`, s.h2)) return;
  const ov = await page.evaluate(() => {
    const el = document.getElementById('v-exam');
    const items = [...el.querySelectorAll('#exReview [data-q]')];
    return {n: items.length, nums: items.map(b => b.textContent.replace(/\s+/g, ' ').trim()),
      blank: items.filter(b => b.dataset.state === 'blank').map(b => +b.dataset.q),
      answered: items.filter(b => b.dataset.state === 'answered').map(b => +b.dataset.q),
      text: el.textContent, explain: el.querySelectorAll('.wrow, .why, .teach, .mark, .verdict, .opt').length,
      submit: (document.getElementById('exRevSubmit') || {}).textContent || '', clock: !!document.getElementById('exClock')};
  });
  check(ov.n === n && ov.nums.every((t, k) => t.startsWith(String(k + 1))), `${label}: the overview lists all ${n} question numbers`, ov.nums);
  check(ov.blank.length === 1 && ov.blank[0] === blankAt && ov.answered.length === n - 1, `${label}: the overview marks question ${blankAt + 1} not answered and the rest answered`, ov);
  check(ov.explain === 0 && !/\bcorrect\b|\bmissed\b|you picked this|\d+ \/ \d+ \(\d+%\)/i.test(ov.text),
    `${label}: the overview shows no answers, grades or explanations`, ov.text.slice(0, 300));
  check(/submit/i.test(ov.submit), `${label}: the overview has one submit button ("${ov.submit.trim()}")`, ov.submit);
  check(ov.clock, `${label}: the overview keeps the clock on screen`);
  // back to the blank question from the overview, answer it, and back to the overview
  await page.click(`#exReview [data-q="${blankAt}"]`);
  s = await state(page);
  check(s.running && !s.review && s.i === blankAt && s.prog.startsWith(`Question ${blankAt + 1} of ${n}`) && s.picks === before.picks,
    `${label}: a number in the overview opens that question, with every answer kept`, s);
  check(await page.evaluate(() => !!document.activeElement && document.activeElement.classList.contains('stem')),
    `${label}: the question opened from the overview takes the focus`, await page.evaluate(() => document.activeElement && document.activeElement.outerHTML.slice(0, 80)));
  await page.evaluate(ANS, false);
  await toLast(page);
  await page.click('#exNext');
  // Cancel on the submit question keeps the paper; the question is the one "Submit paper" asks
  await page.evaluate(() => { window.__asked = []; window.__ok = false; });
  await page.click('#exRevSubmit');
  s = await state(page);
  check(s.running && !s.done && s.log === before.log && s.answers === before.answers && s.review,
    `${label}: Cancel on the overview's submit question keeps the paper running, records nothing, and stays on the overview`, s);
  const fromReview = s.asked.slice();
  await page.click(`#exReview [data-q="${n - 1}"]`);
  await page.evaluate(() => { window.__asked = []; });
  await page.click('#exEnd');
  s = await state(page);
  check(s.running && s.log === before.log, `${label}: Cancel on "Submit paper" keeps the paper running too`, s);
  check(fromReview.length === 1 && s.asked.length === 1 && fromReview[0] === s.asked[0],
    `${label}: the overview's submit and "Submit paper" ask the same question`, {fromReview, submitPaper: s.asked});
  // a reload from the overview: the same paper comes back running, nothing recorded
  await page.click('#exNext');
  const pre = await state(page);
  await page.reload(); await ready(page); await spy(page);
  await page.evaluate(() => show('exam'));
  await page.waitForTimeout(300);
  s = await state(page);
  check(s.running && s.ids === pre.ids && s.picks === pre.picks && s.ends === pre.ends && s.log === before.log,
    `${label}: after a reload from the overview the same paper comes back running, with its answers and its clock, and nothing recorded`, {pre, s});
  if(opts.untimed) check(/taken/.test(s.clock), `${label}: the untimed paper's clock counts the time taken (${s.clock})`, s.clock);
  else check(secs(s.clock) > 0 && secs(s.clock) <= secs(pre.clock), `${label}: the clock goes on counting down after the reload (${pre.clock}, then ${s.clock})`, s.clock);
  // submit for real from the overview
  await toLast(page);
  await page.click('#exNext');
  await page.evaluate(() => { window.__ok = true; window.__asked = []; });
  await page.click('#exRevSubmit');
  await page.waitForTimeout(200);
  s = await state(page);
  const got = await page.evaluate(() => EX ? EX.qs.filter((q, i) => examRight(q, EX.picks[i])).length : -1);
  check(s.done && !s.running && !s.stored, `${label}: OK on the overview's submit question grades the paper and removes the saved paper`, s);
  check(s.log - before.log === n && s.answers - before.answers === n, `${label}: all ${n} answers are recorded once (history +${s.log - before.log})`);
  const pct = Math.round(100 * got / n);
  check(s.h2.includes(`${got} / ${n} (${pct}%)`), `${label}: the score reads ${got} / ${n} (${pct}%)`, s.h2);
}

/* An overview left on screen after a switch to another profile (useProfile with no redraw): its
   Submit, its numbers and its Back do nothing, throw nothing and record nothing for either profile
   (the confirmation of 5b062f5, Low). */
async function staleOverview(page, label){
  await spy(page);
  await start(page);
  await page.evaluate(ANS, true);
  await toLast(page);
  await page.click('#exNext');
  const from = await page.evaluate(() => PROFILE);
  const logBefore = await page.evaluate(() => LOG.length);   // this page's history before the stale actions
  const r = await page.evaluate(() => {
    const count = p => { let a = 0, l = 0; try { a = (JSON.parse(localStorage.getItem(NS + ':data:' + p) || 'null') || {answers: []}).answers.length; } catch(e){}
      try { l = JSON.parse(localStorage.getItem(NS + ':log:' + p) || '[]').length; } catch(e){} return a + '/' + l; };
    const from = PROFILE, to = from + '-other';
    const sub = document.getElementById('exRevSubmit'), num = document.querySelector('#exReview [data-q]'), back = document.getElementById('exRevBack');
    const before = {from: count(from), to: count(to)};
    window.__ok = true; window.__asked = [];
    useProfile(to);   // no redraw: the overview of `from`'s paper stays on screen
    const errs = [];
    for(const [n, b] of [['Submit', sub], ['a number', num], ['Back', back]]){ try { if(b && b.onclick) b.onclick(); } catch(e){ errs.push(n + ': ' + (e && e.message || e)); } }
    const after = {from: count(from), to: count(to)};
    const res = {before, after, errs, asked: window.__asked.slice(), profile: PROFILE, exOwner: EX ? (EX.owner || '(none)') : null};
    useProfile(from);
    return res;
  });
  check(!r.errs.length, `${label}: after a switch to another profile, the stale overview's Submit, numbers and Back throw nothing`, r.errs);
  check(JSON.stringify(r.before) === JSON.stringify(r.after) && !r.asked.length,
    `${label}: and they record nothing for either profile and ask nothing`, r);
  await settled(page);
  await page.evaluate(() => show('exam'));
  const s = await state(page);
  check(s.running && s.log === logBefore, `${label}: back on "${from}", the paper is still running and the history is as it was before the stale actions (${logBefore} → ${s.log})`, {running: s.running, profile: from, logBefore, log: s.log});
}

/* The overview's "Not answered" line names a count and the first few, not every number. */
async function manyBlanks(page, label){
  await start(page);
  const r = await page.evaluate(() => {
    EX.qs.forEach((q, i) => { if(i % 3 === 0) EX.picks[i] = isMulti(q) ? [0] : (q.type ? null : 0); });
    EX.i = EX.qs.length - 1; renderExamQ(); document.getElementById('exNext').click();
    const n = EX.qs.length, blank = EX.qs.filter((q, i) => examBlank(q, EX.picks[i])).length;
    return {n, blank, line: (document.getElementById('exRevBlank') || {}).textContent || ''};
  });
  if(r.blank <= 6){ L.skip(`${label}: the "Not answered" line with many blanks`, `the paper has ${r.n} questions, ${r.blank} left blank`); return; }
  const nums = (r.line.match(/\d+/g) || []).length;
  check(r.line.includes(`${r.blank} questions`) && nums <= 7, `${label}: with ${r.blank} not answered the line gives the count and the first five ("${r.line.trim()}")`, r.line);
}

/* Blank items of a partial paper stay out of the history; a full paper's score. */
async function scores(page, label){
  await spy(page);
  await start(page);
  const n = (await state(page)).n;
  if(n < 2){ L.skip(`${label}: a partial paper`, 'the paper has one question'); return; }
  const k = Math.ceil(n / 2), b0 = await state(page);
  for(let i = 0; i < k; i++){ await page.evaluate(i => { EX.i = i; renderExamQ(); }, i); await page.evaluate(ANS, true); }
  await page.evaluate(() => { window.__ok = true; });
  await page.click('#exEnd');
  await page.waitForTimeout(200);
  let s = await state(page);
  const logs = await page.evaluate(n => LOG.slice(-n).map(e => e[3]), s.log - b0.log);
  check(s.done && s.log - b0.log === k && s.answers - b0.answers === k && logs.every(m => m === 'exam'),
    `${label}: a partial paper with ${k} of ${n} answered records only those ${k}`, {log: s.log - b0.log, answers: s.answers - b0.answers});
  // full paper: 9 of 50 right is 18%; the same share on a smaller paper
  await start(page);
  const right = Math.round(n * 9 / 50), b1 = await state(page);
  for(let i = 0; i < n; i++){ await page.evaluate(i => { EX.i = i; renderExamQ(); }, i); await page.evaluate(ANS, i < right); }
  await page.evaluate(() => { window.__ok = true; });
  await page.click('#exEnd');
  await page.waitForTimeout(200);
  s = await state(page);
  const pct = Math.round(100 * right / n);
  check(s.done && s.h2.includes(`${right} / ${n} (${pct}%)`) && s.log - b1.log === n,
    `${label}: a full paper with ${right} of ${n} right reads ${right} / ${n} (${pct}%) and records all ${n}`, {h2: s.h2, logged: s.log - b1.log});
}

/* The selection on a running paper: neutral, the same for a right and a wrong choice. */
async function selection(page, label, scheme){
  await page.emulateMedia({colorScheme: scheme});
  await start(page);
  const at = await page.evaluate(() => EX.qs.findIndex(q => !isMulti(q) && !q.type && q.options && q.options.some(o => o.correct) && q.options.some(o => !o.correct)));
  if(at < 0){ L.skip(`${label}: the selection colour (${scheme})`, 'the paper has no single-answer question'); return; }
  const look = await page.evaluate(at => {
    EX.i = at; renderExamQ();
    const q = EX.qs[at], css = oi => { const b = document.querySelector(`#v-exam button.opt[data-o="${oi}"]`), s = getComputedStyle(b), k = getComputedStyle(b.querySelector('.k'));
      return {cls: b.className, pressed: b.getAttribute('aria-pressed'), border: s.borderColor, bg: s.backgroundColor, kbg: k.backgroundColor}; };
    const rgb = v => { const d = document.createElement('i'); d.style.color = getComputedStyle(document.documentElement).getPropertyValue(v).trim(); document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
    const r = q.options.findIndex(o => o.correct), w = q.options.findIndex(o => !o.correct);
    document.querySelector(`#v-exam button.opt[data-o="${r}"]`).click(); const onRight = css(r);
    document.querySelector(`#v-exam button.opt[data-o="${w}"]`).click(); const onWrong = css(w), off = css(r);
    return {onRight, onWrong, off, ok: rgb('--ok'), okbg: rgb('--ok-bg'), bad: rgb('--bad')};
  }, at);
  const same = ['border', 'bg', 'kbg'].every(f => look.onRight[f] === look.onWrong[f]) && look.onRight.cls === look.onWrong.cls;
  check(same, `${label} (${scheme}): a chosen right answer and a chosen wrong answer look the same before the paper is submitted`, look);
  const green = [look.onRight, look.onWrong].some(x => /pick-ok|pick-bad|reveal-ok/.test(x.cls) || [x.border, x.bg, x.kbg].some(c => c === look.ok || c === look.okbg || c === look.bad));
  check(!green, `${label} (${scheme}): the chosen answer uses no right or wrong colour`, look);
  check(look.onWrong.pressed === 'true' && look.off.pressed === 'false' && look.onWrong.border !== look.off.border,
    `${label} (${scheme}): the chosen answer is marked pressed and drawn apart from the others`, look);
  // selected and hovered are drawn apart (the review of 007e956, 3)
  const hv = await page.evaluate(() => { const b = [...document.querySelectorAll('#v-exam button.opt')].find(x => x.getAttribute('aria-pressed') === 'false'); return b ? +b.dataset.o : -1; });
  if(hv >= 0){
    await page.hover(`#v-exam button.opt[data-o="${hv}"]`);
    const d = await page.evaluate(hv => { const sty = b => { const s = getComputedStyle(b), k = getComputedStyle(b.querySelector('.k')); return [s.borderColor, s.backgroundColor, s.boxShadow, k.backgroundColor].join(' | '); };
      return {hover: sty(document.querySelector(`#v-exam button.opt[data-o="${hv}"]`)), chosen: sty(document.querySelector('#v-exam button.opt[aria-pressed="true"]'))}; }, hv);
    check(d.hover !== d.chosen, `${label} (${scheme}): a chosen answer looks different from an answer under the pointer`, d);
    await page.mouse.move(0, 0);
  }
  // the keyboard: a focused option is chosen with the space bar
  const before = await page.evaluate(() => EX.picks[EX.i]);
  const target = await page.evaluate(before => { const bs = [...document.querySelectorAll('#v-exam button.opt')]; const b = bs.find(x => +x.dataset.o !== before); return +b.dataset.o; }, before);
  await page.focus(`#v-exam button.opt[data-o="${target}"]`);
  await page.keyboard.press('Space');
  check(await page.evaluate(() => EX.picks[EX.i]) === target, `${label} (${scheme}): the space bar on a focused option chooses it`);
  await page.emulateMedia({colorScheme: 'light'});
}

/* A paper whose clock ran out while the page was closed is submitted as it stands (blank items not logged). */
async function expired(page, label){
  await start(page);
  await page.evaluate(ANS, true);
  const b = await state(page);
  await page.evaluate(() => { const j = JSON.parse(localStorage.getItem(NS + ':exam:' + PROFILE)); j.ends = Date.now() - 1000; localStorage.setItem(NS + ':exam:' + PROFILE, JSON.stringify(j)); EX && clearInterval(EX.timer); });
  await page.reload(); await ready(page);
  await page.evaluate(() => show('exam'));
  await page.waitForTimeout(300);
  const s = await state(page);
  check(s.done && !s.running && s.log - b.log === 1, `${label}: a paper whose clock ran out while the page was closed is submitted as it stands, its one answer recorded`, {done: s.done, logged: s.log - b.log});
}

async function onPage(browser, file, label, opts){
  const {ctx, page, errors} = file ? await L.openPage(browser, file) : await L.openFile(browser);
  try {
    const count = await page.evaluate(() => EXAM.questions !== null && EXAM.questions !== undefined);
    if(!count){ L.skip(`${label}: the exam paper`, 'the number of questions is not set, so no paper is drawn'); return false; }
    if(opts.setup !== false) await setupText(page, label);
    if(opts.flow !== false) await flow(page, label, opts);
    if(opts.scores) await scores(page, label);
    if(opts.scores) await manyBlanks(page, label);
    if(opts.scores) await staleOverview(page, label);
    if(opts.select) for(const sch of ['light', 'dark']) await selection(page, label, sch);
    if(opts.expired) await expired(page, label);
    check(!errors.length, `${label}: no page errors`, errors.slice(0, 2).join('; '));
    return true;
  } finally { await ctx.close(); }
}

(async () => {
  const {browser} = await L.launch(NAME);
  const built = [];
  try {
    console.log('\n=== The course\'s own page ===');
    const own = await onPage(browser, null, 'the course', {scores: true, select: true, expired: true});
    if(!own){
      console.log('\n=== A scratch copy with a question count of 4 ===');
      const b = L.scratchBuild('exam-review', {courseLine: `{ ${ACTIVE} E.questions = 4; }`}); built.push(b);
      if(check(b.code === 0, 'the scratch copy with a count builds', b.out.split('\n').slice(-3).join(' | ')))
        await onPage(browser, b.page, 'count 4', {scores: true, select: true, expired: true});
    }
    console.log('\n=== A scratch copy with no time limit (minutes: null) ===');
    {
      const b = L.scratchBuild('exam-review', {courseLine: `{ ${ACTIVE} E.questions = E.questions || 4; E.minutes = null; }`}); built.push(b);
      if(check(b.code === 0, 'the untimed scratch copy builds', b.out.split('\n').slice(-3).join(' | ')))
        await onPage(browser, b.page, 'untimed', {setup: false, untimed: true});
    }
    console.log('\n=== A scratch copy with a select-all target of 3 ===');
    {
      const b = L.scratchBuild('exam-review', {courseLine: `{ ${ACTIVE} E.questions = E.questions || 4; E.sata = 3; if(E.blueprint) E.blueprint.sata = 3; }`}); built.push(b);
      if(check(b.code === 0, 'the scratch copy with a select-all target builds', b.out.split('\n').slice(-3).join(' | ')))
        await onPage(browser, b.page, 'select-all target 3', {flow: false});
    }
  } finally {
    built.forEach(b => b.rm());
    await browser.close();
  }
  L.finish(NAME);
})().catch(e => { console.log(`FAIL: ${NAME}: ${e && e.stack || e}`); process.exit(1); });
