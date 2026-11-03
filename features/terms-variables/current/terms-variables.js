/* ==========================================================================
   TERMS AND THE VARIABLES QUIZ (feature module terms-variables v1)
   ==========================================================================
   Ported from Basic-Pharmacokinetics src/views.js lines 1029-1260 at ac2eb73
   (the Terms tab: termQuestions, varQuestions, renderTerms). A Terms tab with:

   1. Flashcards over the course's TERMS: the situation that shows a term in
      action (its `scene`), with the term's own words blanked, then the term,
      its one-line meaning and its definition; "Knew it", "Not sure" and "Did
      not know" are recorded as an answer to the term's meaning question.
   2. Quiz me over TERMS: up to three questions per term, drilled by the
      scheduler like any other set: which term a situation describes (only for
      a term with a `scene`), what a term means, and which term a definition
      belongs to. The wrong options are the term's `confuse` terms first, then
      terms of its group, then any other term.
   3. The variables quiz over the course's ASKS: what each symbol in the
      professor's calculation problems stands for. Three kinds of question per
      symbol: which quantity one of the professor's own stems asks for (the
      stem's question sentence, from each numeric question in the bank whose
      `asks` is that symbol, when the sentence does not name the symbol); what
      the symbol means; and which symbol a meaning belongs to. The wrong
      options come from the same family of symbols first (option `families`).

   Course data it reads, from data files listed in course.js `files`:
     TERMS  [{id, term, group, def, cite, gist?, scene?, hook?, module?,
              confuse?: [term ids], src?}]   the shape glossary-tap reads
     ASKS   {key: [symbol, meaning]}          the shape plan-the-problem reads
   and on each numeric question in QUESTIONS, `asks` (a key of ASKS). Either
   TERMS or ASKS may be absent; the tab then offers what the other gives.

   The Glossary list of PK's Terms tab is not here: the glossary-tap module
   (its own tab, id `glossary`) shows it from the same TERMS. When glossary-tap
   is on, this tab links to it.

   The term and variable questions are kept outside QUESTIONS, as in PK, so
   exam papers, the topic counts and the sweeps are unchanged. Their answers
   are recorded (scheduler state under the concepts term:<id> and var:<key>,
   and the answer history), but the core's Weak spots finds a question by id
   in QUESTIONS only, so these answers are not listed there.
   Other modules use it through FX.api('terms-variables'):
   {termQs, varQs, askSentence, start}.
   ========================================================================== */
const ALL_TERMS = (typeof TERMS === 'undefined' || !Array.isArray(TERMS)) ? [] : TERMS;
const ASK = (typeof ASKS === 'undefined' || !ASKS || typeof ASKS !== 'object') ? null : ASKS;
const PROF = (COURSE.professors || [])[0] || '';
const TERM_BY = Object.fromEntries(ALL_TERMS.map(t => [t.id, t]));
const reEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const termName = t => String(t.term).replace(/\s*\(.*\)\s*$/, '');
const termAbbr = t => (String(t.term).match(/\(([^)]*)\)/) || [null, ''])[1];
/* the term's own name and abbreviation blanked out of a text */
const termMask = (t, s) => {
  let out = String(s);
  const words = [termName(t), termAbbr(t)].filter(w => w && w.length > 1);
  for(const w of words) out = out.replace(new RegExp(reEsc(w), 'gi'), '____');
  return out;
};
const gistOf = t => t.gist || termMask(t, t.def);
const modName = m => (OPT.groups && OPT.groups[m]) || ('Module ' + m);

/* ---- term questions (PK views.js 1045-1068) ------------------------------ */
function termDistractors(t, n, text){
  const pick = [], seenText = new Set([text(t).toLowerCase()]);
  const take = o => { if(pick.length < n && o && o !== t && !pick.includes(o) && !seenText.has(text(o).toLowerCase())){ pick.push(o); seenText.add(text(o).toLowerCase()); } };
  (t.confuse || []).forEach(id => take(TERM_BY[id]));
  ALL_TERMS.forEach(o => { if(o.group === t.group) take(o); });
  ALL_TERMS.forEach(take);
  return pick;
}
function termQuestions(){
  const out = [];
  for(const t of ALL_TERMS){
    const base = {prof: PROF, tier: 'new', module: t.module, lecture: t.lecture, topic: 'terms', sub: t.group,
      concept: 'term:' + t.id, source: t.src || 'slide', cite: t.cite, termId: t.id,
      teach: [{h: termName(t), t: [t.def].concat(t.hook ? [t.hook] : []).join(' ')}]};
    if(OPT.skill) base.skill = OPT.skill;
    const named = (o, right) => ({t: o.term, correct: right, why: right ? `${termName(o)}: ${gistOf(o)}` : `${termName(o)} means something else: ${gistOf(o)}`});
    const byTerm = termDistractors(t, 3, o => o.term), byGist = termDistractors(t, 3, gistOf);
    const top = t.scene ? `term-${t.id}-scene` : `term-${t.id}-gist`;
    if(t.scene) out.push(Object.assign({}, base, {id: top, stem: `Which term describes this? ${termMask(t, t.scene)}`,
      options: [named(t, true)].concat(byTerm.map(o => named(o, false)))}));
    out.push(Object.assign({}, base, {id: `term-${t.id}-gist`, stem: `What does "${t.term}" mean?`,
      options: [{t: gistOf(t), correct: true, why: `${termName(t)}: ${gistOf(t)}`}]
        .concat(byGist.map(o => ({t: gistOf(o), correct: false, why: `That describes ${termName(o)}, not ${termName(t)}.`})))},
      top === `term-${t.id}-gist` ? {} : {dupOf: top}));
    out.push(Object.assign({}, base, {id: `term-${t.id}-def`, dupOf: top, stem: `Which term has this definition? ${termMask(t, t.def)}`,
      options: [named(t, true)].concat(byTerm.map(o => named(o, false)))}));
  }
  return out;
}
const TERM_QS = termQuestions();

/* ---- the variables quiz (PK views.js 1072-1147) -------------------------- */
const FAMILY = (() => {
  if(!ASK) return {};
  const f = OPT.families || {};
  if(Object.keys(f).length) return Object.fromEntries(Object.keys(f).filter(k => ASK[k]).map(k => [k, f[k]]));
  return Object.fromEntries(Object.keys(ASK).map(k => [k, 'variables']));
})();
const VAR_GROUPS = [...new Set(Object.values(FAMILY))];
const sym = x => ASK[x][0], mean = x => ASK[x][1];
/* The sentence of a stem that asks: its last question, else its last sentence
   that says what to find. PK splits sentences with a regex lookbehind
   (views.js line 1087); here the end mark is matched and kept instead, which
   gives the same sentences and parses on older Safari. */
const SENT_END = /([.?!])\s+(?=[A-Z(])/g;
function askSentence(stem){
  const ss = String(stem || '').split(/\n+/).filter(l => !/\|/.test(l))   // a table row is never the question
    .flatMap(l => l.replace(/\s+/g, ' ').replace(SENT_END, '$1\u0000').split('\u0000')).map(x => x.trim()).filter(Boolean);
  const q = ss.filter(x => /\?$/.test(x)); if(q.length) return q[q.length - 1];
  const d = ss.filter(x => /^(calculate|determine|find|estimate|what|how|compute)\b/i.test(x)); return d.length ? d[d.length - 1] : null;
}
/* does the sentence name the symbol, its usual name (option `names`), or any
   symbol of its family as a word of its own, so the question would answer itself? */
const namesSym = (k, s) => [sym(k).replace(/∞/g, '')].concat((OPT.names || {})[k] || [])
    .some(n => n.length > 1 && new RegExp('(^|[^A-Za-z])' + reEsc(n) + '(?![a-z])', 'i').test(s))
  || Object.keys(FAMILY).filter(x => FAMILY[x] === FAMILY[k])
    .some(x => new RegExp('(^|[^A-Za-z0-9])' + reEsc(sym(x).replace(/∞/g, '')) + '(?![A-Za-z0-9])').test(s));
/* two symbols the professor's wording alone cannot tell apart (option `twins`)
   are never each other's wrong option */
const twinsOf = k => (OPT.twins || {})[k] || [];
function varOptions(k, n, label){
  const ok = x => x !== k && !twinsOf(k).includes(x) && label(x).toLowerCase() !== label(k).toLowerCase();
  const fam = Object.keys(FAMILY).filter(x => ok(x) && FAMILY[x] === FAMILY[k]), rest = Object.keys(FAMILY).filter(x => ok(x) && FAMILY[x] !== FAMILY[k]);
  const picked = [], texts = new Set([label(k).toLowerCase()]);
  for(const x of shuffle(fam).concat(shuffle(rest))){
    if(picked.length >= n - 1) break;
    if(texts.has(label(x).toLowerCase())) continue;
    texts.add(label(x).toLowerCase()); picked.push(x);
  }
  return [k].concat(picked).map(x => ({k: x, t: label(x)}));
}
function varQuestions(){
  if(!ASK) return [];
  const out = [], seen = new Set();
  const nums = QUESTIONS.filter(q => q.type === 'numeric' && q.asks && FAMILY[q.asks] && !q.lowYield);
  for(const k of Object.keys(FAMILY)){
    const mine = nums.filter(q => q.asks === k);
    const first = mine.slice().sort((a, b) => (+a.module || 0) - (+b.module || 0))[0];
    const base = {prof: PROF, tier: 'new', module: first ? first.module : undefined, topic: 'terms',
      sub: 'Variables: ' + FAMILY[k], concept: 'var:' + k, source: 'slide', varKey: k, cite: OPT.cite,
      teach: [{h: sym(k), t: sym(k) + ' is ' + mean(k) + '.'}]};
    if(OPT.skill) base.skill = OPT.skill;
    const why = (x, ok) => ok ? `${sym(x)} is ${mean(x)}.` : `${sym(x)} is ${mean(x)}; the one asked for is ${sym(k)}.`;
    const top = `var-${k}-means`;
    out.push(Object.assign({}, base, {id: top, stem: `What does ${sym(k)} stand for in the professor's problems?`,
      options: varOptions(k, 4, mean).map(o => ({t: o.t, correct: o.k === k, why: o.k === k ? why(k, true) : `That describes ${sym(o.k)}, not ${sym(k)}.`}))}));
    out.push(Object.assign({}, base, {id: `var-${k}-symbol`, dupOf: top, stem: `Which symbol is ${mean(k)}?`,
      options: varOptions(k, 5, sym).map(o => ({t: o.t, correct: o.k === k, why: why(o.k, o.k === k)}))}));
    for(const q of mine){
      const a = askSentence(q.stem);
      // a part header ("Calculate the following: f.") says nothing
      if(!a || a.split(/\s+/).length < 5 || /the following|as follows|:\s*\S{0,3}\.?$/i.test(a) || namesSym(k, a)) continue;
      const key = k + '|' + a.toLowerCase(); if(seen.has(key)) continue; seen.add(key);
      out.push(Object.assign({}, base, {id: `var-${k}-ask-${q.id}`, dupOf: top, module: q.module, cite: q.cite, fromQ: q.id,
        stem: `Which quantity is this question asking for? “${a}”`,
        options: varOptions(k, 5, sym).map(o => ({t: o.t, correct: o.k === k, why: why(o.k, o.k === k)}))}));
    }
  }
  return out;
}
const VAR_QS = varQuestions();

/* ---- drilling a set: the scheduler picks, missed concepts come back first,
   and it stops when nothing is due (PK views.js startPool, line 872) ------- */
function start(pool, label){
  if(!pool.length) return false;
  Q = {pool, label, current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false};
  nextQuestion();
  show('quiz');
  return true;
}
const termPool = g => TERM_QS.filter(q => (g === 'all' || q.sub === g) && (TV.module === 'all' || q.module === TV.module));
const varPool = g => VAR_QS.filter(q => g === 'all' || q.sub === 'Variables: ' + g);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ---- the tab (PK views.js 1148-1260, its Glossary mode left to glossary-tap) */
const TERM_GROUPS = [...new Set(ALL_TERMS.map(t => t.group))];
const MODS = [...new Set(ALL_TERMS.map(t => t.module).filter(m => m !== undefined && m !== null))].sort((a, b) => a - b);
const TV = {mode: ALL_TERMS.length ? 'flash' : 'quiz', group: 'all', module: 'all', fc: null};
const termsShown = () => ALL_TERMS.filter(t => (TV.group === 'all' || t.group === TV.group) && (TV.module === 'all' || t.module === TV.module));
const row = (name, small, attr, val) => `<div class="subrow"><span class="sname"><b>${name}</b><small>${small}</small></span><button type="button" ${attr}="${esc(val)}">Start</button></div>`;

function varQuizHTML(){
  if(!VAR_QS.length) return '';
  const asks = VAR_QS.filter(q => q.fromQ).length, n = Object.keys(FAMILY).length;
  return `<h3 id="tvx-varquiz">Variables: what is the question asking for?</h3>
    <p class="sub">${asks} question sentence${asks === 1 ? '' : 's'} from the professor's own calculation stems, each asking which symbol it wants, and two questions on each of ${n} symbols: what it means, and which symbol a meaning belongs to.${
      VAR_GROUPS.length > 1 ? ' The wrong choices come first from the same family of symbols.' : ''}</p>
    <div class="topic plain"><div class="subs">${['all'].concat(VAR_GROUPS.length > 1 ? VAR_GROUPS : []).map(g =>
      row(g === 'all' ? 'All variables' : esc(cap(g)), `${varPool(g).length} questions`, 'data-varquiz', g)).join('')}</div></div>`;
}
function renderTerms(pane){
  pane = pane || document.getElementById('v-terms');
  const gl = FX.api('glossary-tap');
  const modes = (ALL_TERMS.length ? [['flash', 'Flashcards'], ['quiz', 'Quiz me']] : [['quiz', 'Quiz me']]);
  if(!modes.some(m => m[0] === TV.mode)) TV.mode = modes[0][0];
  let h = `<h2>${esc(OPT.label)}</h2><p class="sub">${ALL_TERMS.length ? `${ALL_TERMS.length} term${ALL_TERMS.length === 1 ? '' : 's'} from the course's term list` : ''}${
      ALL_TERMS.length && VAR_QS.length ? ', and ' : ''}${VAR_QS.length ? `the symbols of the professor's calculation problems` : ''}.</p>
    <details class="tabhelp"><summary>What this tab is for</summary><ul>
    ${ALL_TERMS.length ? `<li><b>Flashcards</b> show a situation with the term left out; say the term, then show it. What you mark is recorded.</li>
    <li><b>Quiz me</b> asks questions on the terms: which term a situation describes, what a term means, and which term a definition belongs to. Missed terms come back first.</li>` : ''}
    ${VAR_QS.length ? `<li><b>Variables</b> (under Quiz me) asks which symbol a question sentence wants, and what each symbol stands for.</li>` : ''}
    <li>These questions are kept apart from the question bank: they are not on exam papers and Weak spots does not list them.</li>
    ${gl ? `<li>To read every term with its definition, open the <button type="button" class="chip" data-tvxgloss="1">Glossary</button> tab.</li>` : ''}
    </ul></details>`;
  if(modes.length > 1) h += `<div class="frow tvx-modes">${modes.map(([m, l]) => `<button type="button" class="chip" data-tmode="${m}" aria-pressed="${TV.mode === m}">${l}</button>`).join('')}</div>`;
  if(ALL_TERMS.length){
    const groupChips = TERM_GROUPS.length > 1 ? `<div class="frow"><label>Group</label>${['all'].concat(TERM_GROUPS).map(g => `<button type="button" class="chip" data-tgroup="${esc(g)}" aria-pressed="${TV.group === g}">${g === 'all' ? 'All groups' : esc(g)}</button>`).join('')}</div>` : '';
    const modChips = MODS.length > 1 ? `<div class="frow"><label>Module</label>${['all'].concat(MODS).map(m => `<button type="button" class="chip" data-tmod="${esc(m)}" aria-pressed="${TV.module === m}">${m === 'all' ? 'All modules' : esc(modName(m))}</button>`).join('')}</div>` : '';
    if(groupChips || modChips) h += `<div class="filters">${groupChips}${modChips}</div>`;
  }
  if(TV.mode === 'flash'){
    const pool = termsShown();
    const key = TV.group + '|' + TV.module;
    if(!TV.fc || TV.fc.key !== key) TV.fc = {key, order: shuffle(pool.map(t => t.id)), i: 0, shown: false};
    const fc = TV.fc;
    if(!fc.order.length) h += `<div class="empty">No term in this group and module.</div>`;
    else if(fc.i >= fc.order.length){
      h += `<div class="empty">That is every card in this set, all ${fc.order.length}. <button type="button" class="btn small" id="tvxAgain">Shuffle and start again</button></div>`;
    }else{
      const t = TERM_BY[fc.order[fc.i]];
      const front = t.scene ? `<b>In action:</b> ${esc(termMask(t, t.scene))}` : `<b>Definition:</b> ${esc(termMask(t, t.def))}`;
      h += `<div class="qcard tvx-flash"><div class="qhead"><span>Card ${fc.i + 1} of ${fc.order.length}</span><span class="spacer"></span><span>${esc(t.group)}</span></div>
        <div class="qbody"><p class="tvx-front">${front}</p>${
        fc.shown ? `<p class="tvx-term">${esc(t.term)}</p>${t.gist ? `<p>${esc(t.gist)}</p>` : ''}<p class="tvx-def">${esc(t.def)}</p>${
          t.hook ? `<p class="tvx-def"><b>The professor's point:</b> ${esc(t.hook)}</p>` : ''}<p class="tvx-cite">${esc(t.cite)}</p>` : ''}</div>
        <div class="qfoot">${fc.shown ? `<button type="button" class="btn" data-fc="correct">Knew it</button><button type="button" class="btn amber" data-fc="guessed">Not sure</button><button type="button" class="btn ghost" data-fc="wrong">Did not know</button>`
          : `<button type="button" class="btn" id="tvxShow">Show the term</button>`}</div></div>`;
    }
  }else{
    if(ALL_TERMS.length){
      const per = TERM_QS.length / ALL_TERMS.length;
      h += `<p class="sub">${TERM_QS.length} questions on ${ALL_TERMS.length} terms${per === 3 ? ', three per term' : ''}: which term a situation describes, what a term means, and which term a definition belongs to.</p>
      <div class="topic plain"><div class="subs">${['all'].concat(TERM_GROUPS.length > 1 ? TERM_GROUPS : []).map(g =>
        row(g === 'all' ? (TV.module === 'all' ? 'All terms' : 'All terms of ' + esc(modName(TV.module))) : esc(g), `${termPool(g).length} questions`, 'data-tquiz', g)).join('')}</div></div>`;
    }
    h += varQuizHTML();
  }
  pane.innerHTML = h;
  pane.querySelectorAll('[data-tmode]').forEach(b => b.onclick = () => { TV.mode = b.dataset.tmode; renderTerms(pane); });
  pane.querySelectorAll('[data-tgroup]').forEach(b => b.onclick = () => { TV.group = b.dataset.tgroup; renderTerms(pane); });
  pane.querySelectorAll('[data-tmod]').forEach(b => b.onclick = () => { TV.module = b.dataset.tmod === 'all' ? 'all' : +b.dataset.tmod; renderTerms(pane); });
  const sh = pane.querySelector('#tvxShow'); if(sh) sh.onclick = () => { TV.fc.shown = true; renderTerms(pane); };
  const ag = pane.querySelector('#tvxAgain'); if(ag) ag.onclick = () => { TV.fc = null; renderTerms(pane); };
  pane.querySelectorAll('[data-fc]').forEach(b => b.onclick = () => {
    const t = TERM_BY[TV.fc.order[TV.fc.i]], q = TERM_QS.find(x => x.id === `term-${t.id}-gist`);
    if(q) record(q, b.dataset.fc, null, 0);
    TV.fc.i++; TV.fc.shown = false; renderTerms(pane);
  });
  pane.querySelectorAll('[data-tquiz]').forEach(b => b.onclick = () => {
    const g = b.dataset.tquiz; start(termPool(g), g === 'all' ? OPT.label : `${OPT.label} — ${g}`); });
  pane.querySelectorAll('[data-varquiz]').forEach(b => b.onclick = () => {
    const g = b.dataset.varquiz; start(varPool(g), g === 'all' ? 'Variables' : 'Variables — ' + g); });
  const gb = pane.querySelector('[data-tvxgloss]'); if(gb) gb.onclick = () => show('glossary');
}
X.tab({id: 'terms', label: OPT.label, before: OPT.before, render: renderTerms});

/* the variables quiz offered on the Equations tab too, when equation-drill is on
   (PK views.js lines 4173-4175) */
X.rendered((pane, view) => {
  if(view !== 'eq' || !VAR_QS.length) return;
  const subs = pane.querySelector('.sweepcard .subs');
  if(!subs || subs.querySelector('[data-varquiz]')) return;
  const d = document.createElement('div');
  d.className = 'subrow';
  d.innerHTML = `<span class="sname"><b>What each variable means</b><small>The professor's question sentences: which symbol is asked for; and what each symbol stands for. Also on the ${esc(OPT.label)} tab, under Quiz me</small></span><button type="button" class="ghost" data-varquiz="all">Start</button>`;
  d.querySelector('button').onclick = () => start(varPool('all'), 'Variables');
  subs.appendChild(d);
});

X.api({termQs: TERM_QS, varQs: VAR_QS, askSentence, start, families: FAMILY});
