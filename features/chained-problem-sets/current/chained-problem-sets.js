/* ==========================================================================
   PROBLEMS ASKED IN PARTS (feature module chained-problem-sets v2)
   ==========================================================================
   Ported from Basic-Pharmacokinetics (src/views.js startChain, CHAIN_OF,
   paperOrder and the quiz card's lines for a set, at ac2eb73). A professor
   often asks one vignette in parts: "at the rate you determined above".
   Working a set straight through is a different exercise from meeting one
   part cold, because a wrong answer early carries into every part after it.

   Each part is still written to stand on its own, stating in its stem the
   earlier results it uses ("(Part a: k = 0.1198 hr⁻¹.)"), so the scheduler can
   ask any one part alone; this module's test checks that every earlier result
   a part's working uses is stated in its stem. CHAINS only records the order
   the parts are asked in and the vignette they share:

     const CHAINS = [{id, name, setup, parts: [question ids in her order],
                      setupOf?: {question id: a vignette line for that part}}];

   in a data file listed in course.js `files`. `setup` is HTML, so a formula
   in it can carry real subscripts. The build step (step.js) stops the build
   on a set that names a question the bank does not have, or a question in two
   sets.

   What it adds: a "Problems asked in parts" card on Topics with a Start per
   set; a set worked in order as a pass (progress "part i of n", the vignette
   above each part, a closing card that names the set); a part met on its own
   says which set it is in and offers the set from its first part; and on an
   exam paper the parts of one set sit together, in order, where the first of
   them was drawn.
   ========================================================================== */
const sets = () => (typeof CHAINS === 'undefined' || !Array.isArray(CHAINS) ? [] : CHAINS)
  .filter(c => c && Array.isArray(c.parts) && c.parts.some(id => byId(id)));
const CHAIN_OF = {};
(typeof CHAINS === 'undefined' || !Array.isArray(CHAINS) ? [] : CHAINS).forEach(c =>
  (c.parts || []).forEach((id, i) => { CHAIN_OF[id] = {chain: c, step: i + 1}; }));
const setupOf = (c, q) => (c.setupOf && q && c.setupOf[q.id]) || c.setup || '';

/* One set, worked straight through in the order she asks it. Shaped like a
   sweep, but the queue is her part order rather than a shuffle. A part that
   has been answered before is still asked: the set is one piece of work. */
function startChain(id){
  const c = sets().find(x => x.id === id);
  if(!c) return false;
  const parts = c.parts.map(byId).filter(Boolean);
  Q = {pool: parts, label: c.name, chain: c, sweep: parts.map(q => q.id), i: 0, current: null, answered: 0,
       lastId: null, examMode: false, picked: null, revealed: false};
  nextQuestion();
  show('quiz');
  return true;
}
/* On a paper, the parts of one set sit together and in her order, at the
   place the first of them was drawn; everything else keeps its place. */
function paperOrder(qs){
  const out = [], done = new Set();
  qs.forEach(q => {
    if(done.has(q.id)) return;
    const c = CHAIN_OF[q.id];
    if(!c){ out.push(q); done.add(q.id); return; }
    qs.filter(x => CHAIN_OF[x.id] && CHAIN_OF[x.id].chain === c.chain)
      .sort((x, y) => CHAIN_OF[x.id].step - CHAIN_OF[y.id].step)
      .forEach(x => { if(!done.has(x.id)){ out.push(x); done.add(x.id); } });
  });
  return out;
}

function topicsCard(pane){
  const list = sets();
  if(!list.length || pane.querySelector('#chainSets')) return;
  pane.insertAdjacentHTML('beforeend', `<h3>Problems asked in parts</h3>
  <div class="topic" id="chainSets"><div class="subs">${list.map(c => {
    const n = c.parts.filter(id => byId(id)).length;
    return `<div class="subrow"><span class="sname"><b>${esc(c.name)}</b><small>${setupOf(c, null)} · ${n} parts</small></span>
      <button data-chain="${esc(c.id)}">Start</button></div>`; }).join('')}</div></div>`);
  pane.querySelectorAll('#chainSets button[data-chain]').forEach(b => b.onclick = () => startChain(b.dataset.chain));
}

function quizCard(pane){
  if(!Q) return;
  const q = Q.current;
  if(Q.chain && q){
    const prog = pane.querySelector('.qprog span');
    if(prog && /^question \d+ of \d+$/.test(prog.textContent)) prog.textContent = `part ${Q.i} of ${Q.sweep.length}`;
    const stem = pane.querySelector('.stem'), line = setupOf(Q.chain, q);
    if(stem && line && !pane.querySelector('.cset')) stem.insertAdjacentHTML('beforebegin', `<p class="cset">${line}</p>`);
  }
  if(Q.chain && !q && Q.sweep){
    const b = pane.querySelector('.empty b');
    if(b && !b.hasAttribute('data-chain-end')){
      b.setAttribute('data-chain-end', '');
      b.textContent = `That is every part of ${Q.chain.name} — all ${Q.sweep.length}.`;
      const again = pane.querySelector('#goAgain');
      if(again){ again.textContent = 'Work the set again'; again.onclick = () => startChain(Q.chain.id); }
    }
  }
  const inSet = q && CHAIN_OF[q.id];
  if(inSet && !Q.chain && Q.revealed && !pane.querySelector('.fxchain')){
    const whys = pane.querySelectorAll('.why'), at = whys[whys.length - 1] || pane.querySelector('.qbody');
    if(!at) return;
    at.insertAdjacentHTML('beforeend', `<p class="prose fxchain" style="margin:13px 0 0;font-size:14.5px">` +
      `This is part ${inSet.step} of ${inSet.chain.parts.length} of one problem: ${esc(inSet.chain.name)}. ` +
      `<button type="button" class="chip" data-chainlink="${esc(inSet.chain.id)}">Work the whole set from the start</button></p>`);
    const b = at.querySelector('[data-chainlink]');
    if(b) b.onclick = () => startChain(b.dataset.chainlink);
  }
}

X.rendered((pane, view) => {
  if(view === 'topics') topicsCard(pane);
  else if(view === 'quiz') quizCard(pane);
});
X.paper(qs => paperOrder(qs));
X.api({startChain, paperOrder, CHAIN_OF, sets});
