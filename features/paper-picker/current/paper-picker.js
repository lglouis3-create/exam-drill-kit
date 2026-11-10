/* ==========================================================================
   PAPER PICKER: choose which exam's paper to practise, and the papers so far
   ==========================================================================
   Ported from Basic-Pharmacokinetics src/shell.html lines 1108-1128
   (examEnds, pickExam, setActiveExam) and 1174-1186 (poolShares), and
   src/views.js lines 3108-3136 (chooseExam, examPicker, examHistory) and
   3146-3168 (the picker and the history on the Exam view), at ac2eb73.

   What it does:
   - The Exam view's opening page and Settings show one chip per exam in
     course.js `exams` that a paper can be drawn for (below). The choice is kept with the progress
     (DB.paperPicker.exam, and when it was made, .at).
   - A paper started while another exam is chosen is drawn from that exam's
     pools: each pool supplies its share of the paper in proportion to its
     marks (largest remainder, Basic-Pharmacokinetics' poolShares), with that
     exam's select-all count, through the engine's own drawMixed, so the
     engine's rules for a draw hold (one question per concept before a concept
     repeats; never two wordings of one fact on one paper). It goes through
     the X.paper hook, which returns as many questions as the engine drew, so
     the paper keeps the engine's length and clock. So only an exam with the
     current exam's (course.js activeExam) question count, time limit and
     `typed` setting, no `blueprint`, and marks on every pool gets a chip; the
     build step (step.js) leaves every other exam off, and the page says
     which and why.
   - Basic-Pharmacokinetics' rule for an old choice: a paper chosen before its
     exam was sat gives way to the course's current exam once that exam is
     over; a paper chosen after its exam (to review it) is kept.
   - "Your papers so far": every paper submitted on a page with this module
     on, newest first (the 12 newest shown, the 100 newest kept), with the
     exam it was drawn for, the day, the score and the blank items. The record
     is written when the result page is first drawn (DB.paperPicker.papers).

   What it does not do: Topics, Weak spots and the exam-weighted pass follow
   the course's current exam whatever is chosen here (in Basic-
   Pharmacokinetics they followed the choice; that needs several exams on one
   site in the core). Papers submitted before the module was switched on are
   not in the list: the core keeps no record of them. The result page itself
   is still lost on a reload, as in the core.
   ========================================================================== */
const MAX_KEPT = 100, SHOWN = 12;
/* The module's part of the progress. Reading it adds nothing to the progress;
   only a choice, a paper started for a chosen exam, or a paper submitted does. */
const has = () => !!DB.paperPicker && typeof DB.paperPicker === 'object' && !Array.isArray(DB.paperPicker);
const state = () => has() ? DB.paperPicker : {};
const put = () => has() ? DB.paperPicker : (DB.paperPicker = {});
const examById = id => COURSE.exams.find(e => e.id === id) || null;
/* The exams the build step found a paper can be drawn for (step.js), and the
   ones it left off, with the reason. */
const OFFER = new Set((DATA && DATA.offer) || []), LEFT = (DATA && DATA.left) || [];
const offered = e => !!e && (e === EXAM || OFFER.has(e.id));
/* When an exam is over: its `when` (or an ISO `date`, at 23:59) plus its minutes.
   An exam with neither is never over. */
function examEnds(e){
  const at = e.when ? new Date(e.when).getTime()
    : /^\d{4}-\d\d-\d\d$/.test(e.date || '') ? new Date(e.date + 'T23:59').getTime() : NaN;
  return isNaN(at) ? Infinity : at + (e.minutes || 0) * 60000;
}
/* The exam the next paper is drawn for (Basic-Pharmacokinetics pickExam). */
function chosen(){
  const s = state(), e = examById(s.exam);
  if(!offered(e)) return EXAM;
  const over = Date.now() > examEnds(e), chosenAfter = typeof s.at === 'number' && s.at > examEnds(e);
  return over && !chosenAfter && e.id !== EXAM.id ? EXAM : e;
}
function choose(id){
  const e = examById(id);
  if(!offered(e) || (EX && EX.running)) return false;
  const s = put();
  s.exam = e.id; s.at = Date.now();
  save();
  return true;
}
/* Questions a paper may carry: the engine's rule (no lowYield; typed items
   only when the exam takes them, core/exam_typed.js). */
const typedOn = () => typeof EXAM_TYPED !== 'undefined' && EXAM_TYPED.allows;
const drawable = q => !q.lowYield && (!q.type || (typedOn() && EXAM_TYPED.typed(q)));
const testOf = p => p.test || (p.test = poolFilter(p.filter || {}));
/* The questions in each pool of exam e: a question belongs to the first pool it matches. */
function poolsOf(e){
  const out = e.pools.map(p => ({pool: p, qs: []}));
  // the core's papers leave out optional topics (shell.html requiredQs); so does this draw
  for(const q of (typeof requiredQs === 'function' ? requiredQs() : QUESTIONS)){
    if(!drawable(q)) continue;
    const i = e.pools.findIndex(p => testOf(p)(q));
    if(i >= 0) out[i].qs.push(q);
  }
  return out;
}
/* n split across the pools by marks, the largest remainder taking the rounding. */
function shares(e, n){
  const total = e.pools.reduce((s, p) => s + (p.marks || 0), 0);
  if(!total) return e.pools.map(() => 0);
  const raw = e.pools.map(p => n * (p.marks || 0) / total);
  const got = raw.map(Math.floor);
  let left = n - got.reduce((a, b) => a + b, 0);
  raw.map((r, i) => ({i, f: r - Math.floor(r)})).sort((a, b) => b.f - a.f)
     .forEach(o => { if(left > 0){ got[o.i]++; left--; } });
  return got;
}
/* How many questions exam e's pools can put on a paper of n. */
function room(e, n){
  const want = shares(e, n);
  return poolsOf(e).reduce((s, x, i) => s + Math.min(want[i], x.qs.length), 0);
}
/* A paper of n drawn from exam e's pools, or null when they hold too few. */
function drawFor(e, n){
  const by = poolsOf(e), want = shares(e, n);
  if(by.reduce((s, x, i) => s + Math.min(want[i], x.qs.length), 0) < n) return null;
  const total = e.pools.reduce((s, p) => s + (p.marks || 0), 0) || 1;
  let sataLeft = e.sata || 0;
  const used = new Set(), out = [];
  // the select-all target split by marks; the largest pool (last here) takes what is left
  const order = by.map((x, i) => i).sort((a, b) => (e.pools[a].marks || 0) - (e.pools[b].marks || 0));
  order.forEach((i, k) => {
    const s = k === order.length - 1 ? Math.max(0, sataLeft) : Math.round((e.sata || 0) * (e.pools[i].marks || 0) / total);
    sataLeft -= s;
    const got = drawMixed(by[i].qs, want[i], s, used);
    // a pool short of single-answer items is topped up from its own select-all items
    if(got.length < want[i]) got.push(...drawN(by[i].qs, want[i] - got.length, used));
    out.push(...got);
  });
  // two wordings of one fact can leave a pool short: top up from the exam's other pools
  if(out.length < n) out.push(...drawN(by.flatMap(x => x.qs), n - out.length, used));
  if(out.length !== n) return null;
  // the parts of one problem set sit together, in its order, as chained-problem-sets' own hook puts them
  const C = typeof FX !== 'undefined' && FX.api && FX.api('chained-problem-sets'), mixed = shuffle(out);
  return C && typeof C.paperOrder === 'function' ? C.paperOrder(mixed) : mixed;
}
X.paper(qs => {
  const e = chosen();
  if(!qs.length || (e === EXAM && !has())) return qs;
  const s = put();
  let paper = qs, forId = EXAM.id;
  if(e !== EXAM){
    const d = drawFor(e, qs.length);
    if(d){ paper = d; forId = e.id; }
  }
  s.drawn = {exam: forId, ids: paper.map(q => q.id)};
  save();
  return paper;
});

/* ---- the record of papers submitted ----------------------------------------- */
function paperExam(){
  const d = state().drawn;
  return d && Array.isArray(d.ids) && d.ids.length === EX.qs.length && d.ids.every((id, i) => id === EX.qs[i].id)
    ? d.exam : EXAM.id;
}
function logPaper(){
  if(!EX || !EX.done || EX.ppLogged) return;
  EX.ppLogged = true;
  EX.ppExam = paperExam();
  const s = put();
  const right = EX.qs.filter((q, i) => examRight(q, EX.picks[i])).length;
  const blank = EX.qs.filter((q, i) => examBlank(q, EX.picks[i])).length;
  (s.papers = Array.isArray(s.papers) ? s.papers : []).push({at: Date.now(), exam: EX.ppExam, right, total: EX.qs.length, blank,
    partial: !!EX.partial});
  if(s.papers.length > MAX_KEPT) s.papers.splice(0, s.papers.length - MAX_KEPT);
  delete s.drawn;
  save();
}
const fmtDay = t => new Date(t).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
const pctCol = p => p >= 80 ? 'var(--ok)' : p >= 60 ? 'var(--warn)' : 'var(--bad)';
function historyHTML(){
  const papers = (state().papers || []).slice().reverse();
  if(!papers.length) return '';
  let h = `<div data-pp="history"><h3>Your papers so far</h3>
  <p class="sub">Every paper submitted since this list was added to the drill, newest first${papers.length > SHOWN ? ` (the ${SHOWN} newest of ${papers.length})` : ''}.</p>
  <table class="gap"><thead><tr><th>Paper</th><th>When</th><th>Score</th><th>Blank</th><th style="width:36%">Result</th></tr></thead><tbody>`;
  for(const x of papers.slice(0, SHOWN)){
    const ex = examById(x.exam);
    const pc = x.total ? Math.round(100 * x.right / x.total) : 0;
    h += `<tr><td>${esc(ex ? ex.name : 'Paper')}</td><td>${esc(fmtDay(x.at))}</td><td>${x.right} / ${x.total}</td><td>${x.blank || 0}</td>
      <td><div class="bar"><i style="width:${pc}%;background:${pctCol(pc)}"></i></div><span style="font-size:12px;color:var(--text-dim)">${pc}%</span></td></tr>`;
  }
  return h + `</tbody></table></div>`;
}

/* ---- the chips ---------------------------------------------------------------- */
const leftHTML = () => LEFT.length ? `<p style="font-size:13.5px;color:var(--text-dim);margin:4px 0 0" data-pp="left">Not offered as a practice paper here,
  because a paper keeps ${esc(EXAM.name)}'s length, clock and kinds of question: ${LEFT.map(([id, why]) => {
    const x = examById(id); return `${esc(x ? x.name : String(id))} (${esc(why)})`; }).join('; ')}.</p>` : '';
function pickerHTML(note){
  if(!OFFER.size && !LEFT.length) return '';
  const e = chosen();
  return `<div class="filters" data-pp="picker">${OFFER.size ? `<div class="frow"><label>Paper</label>${COURSE.exams.filter(offered).map(x =>
    `<button class="chip" data-ppexam="${esc(String(x.id))}" aria-pressed="${x.id === e.id}">${esc(x.name)}</button>`).join('')}</div>
    <p style="font-size:13.5px;color:var(--text-dim);margin:4px 0 0">${note}</p>` : ''}${leftHTML()}</div>`;
}
function wireChips(el, after){
  el.querySelectorAll('.chip[data-ppexam]').forEach(b => b.onclick = () => {
    const x = COURSE.exams.find(e => String(e.id) === b.dataset.ppexam);
    if(x && choose(x.id)) after();
  });
}
const NOTE = () => `A paper for an earlier exam is drawn from that exam's pools, so it can be sat again before a later exam.
  Topics, Weak spots and the exam-weighted pass follow ${esc(EXAM.name)}, the course's current exam, whatever is chosen here.`;
/* The opening page for a paper of another exam: what it is drawn from. */
function otherHTML(e, n){
  const by = poolsOf(e), want = shares(e, n), have = room(e, n);
  const clock = typeof EXAM.minutes === 'number' ? `with a ${EXAM.minutes}-minute clock` : 'untimed';
  const table = `<table class="gap"><thead><tr><th>Drawn from</th><th>Questions</th><th>In the bank</th></tr></thead><tbody>${
    by.map((x, i) => `<tr><td>${esc(x.pool.name || x.pool.key || '')}</td><td>${want[i]}</td><td>${x.qs.length}</td></tr>`).join('')}</tbody></table>`;
  // too few questions: the paper is the current exam's, so the engine's own description of it stays (renderHook)
  if(have < n) return `<div data-pp="other"><div class="note" data-pp="short"><b>The bank holds too few questions for a paper of ${esc(e.name)}:</b>
    its pools can supply ${have} of the ${n}. Until it holds more, a paper started here is drawn for ${esc(EXAM.name)},
    as described below.</div>${table}</div>`;
  return `<div data-pp="other"><p class="sub">This paper: ${n} questions drawn at the blueprint of ${esc(e.name)}${e.blurb ? ' — ' + esc(e.blurb) : ''} — ${clock}.
  ${e.sata ? `The draw aims for ${e.sata} of the ${n} to be select-all, as many as each pool holds, marked all-or-nothing. ` : ''}No explanations until you finish, same as the real thing.</p>${table}</div>`;
}

/* While a paper runs: which exam it was drawn for, from the paper itself (its
   record, state().drawn), so a paper that fell back to the current exam (too few
   questions for the chosen one) says so; the engine's opening-page text about the
   current exam's papers does not stand for another exam's paper. */
function runningLine(pane){
  if(pane.querySelector('[data-pp="running"]')) return;
  const d = state().drawn, x = d && examById(d.exam);
  if(!x) return;
  pane.insertAdjacentHTML('afterbegin', `<p class="sub" data-pp="running">This paper is drawn for ${esc(x.name)}.</p>`);
}
X.rendered((pane, view) => {
  if(view === 'exam' && OFFER.size && EX && EX.running) return runningLine(pane);
  if(view !== 'exam' || !EX && !document.getElementById('startExam') || EX && EX.running) return;
  if(EX && EX.done){
    logPaper();
    if(EX.ppExam !== undefined && EX.ppExam !== EXAM.id && !pane.querySelector('[data-pp="result"]')){
      const h2 = pane.querySelector('h2'), x = examById(EX.ppExam);
      if(h2 && x) h2.insertAdjacentHTML('afterend', `<p class="sub" data-pp="result">This paper was drawn for ${esc(x.name)}.</p>`);
    }
    return;
  }
  if(pane.querySelector('[data-pp="done"]')) return;
  const h2 = pane.querySelector('h2');
  if(!h2) return;
  h2.insertAdjacentHTML('afterend', `<div data-pp="done">${pickerHTML(NOTE())}</div>`);
  const e = chosen(), n = typeof EXAM.questions === 'number' ? EXAM.questions : 0;
  if(e !== EXAM && n){
    // the engine's description of the current exam's paper ("... drawn at the blueprint of <exam>"), found by what it says
    const sub = [...pane.querySelectorAll('p')].find(x => !x.closest('[data-pp]') && x.textContent.includes('blueprint of ' + EXAM.name));
    if(sub && room(e, n) >= n) sub.remove();
    pane.querySelector('[data-pp="done"]').insertAdjacentHTML('beforeend', otherHTML(e, n));
  }
  pane.insertAdjacentHTML('beforeend', historyHTML());
  wireChips(pane, () => renderExam());
});

if(OFFER.size) X.settings({
  title: 'Practice paper',
  html: () => pickerHTML('The Exam view draws its paper for this exam. ' + NOTE()),
  wire: el => wireChips(el, () => renderSettings()),
});

X.api({chosen, choose, drawFor, shares, room, examEnds, logPaper, state});
