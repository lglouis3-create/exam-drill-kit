/* ==========================================================================
   A PAGE PER MODULE: CONCEPTS, CALCULATIONS BY TYPE, WORKSHEETS
   (feature module module-pages v1)
   ==========================================================================
   Ported from Basic-Pharmacokinetics (src/views.js "MODULES: CONCEPTS,
   CALCULATIONS, WORKSHEETS", lines 722-854, with its styles in src/shell.html,
   at ac2eb73).

   The core's Topics tab lists each topic with its subtopics and a Start per
   subtopic. This module adds, above that list, one card per module of the
   course with up to three ways in, each opening a page of its own under
   Topics, with a way back:

   - Concepts: the professor's objectives for the module, each with the
     concept questions of the subtopics it serves (no arithmetic), a Start per
     objective and one for all of them. With concept-statuses on, each row
     also says how many of its concepts are struggling, improving, mastered
     and so on.
   - Calculations: every calculation of the module in one pass, then each kind
     of problem with its count, its progress, Single problems and a worked
     example (the stem, the working line by line, the answer and the slide);
     with chained-problem-sets on, In parts for the professor's problems whose
     parts are of that kind, and the module's lecture examples asked in parts.
   - Worksheets, with worksheets-ink on: the module's documents (its SOURCES),
     each with Write on it and Practice in the drill.

   The course data, in a file listed in course.js `files`:

     const OBJECTIVES = [{module, n, text, subs: ['topic/sub', ...], label?}];
     const CALC_TYPES = [{module, id, name, match: ['topic', 'topic/sub',
                          'topic/sub:skill', ...], example?: question id}];

   A question's module is its own `module` field, or else the `module` of the
   lecture its citation names (COURSE.lectures). A topic belongs to the module
   most of its questions belong to. A calculation (a numeric question, or a
   matching one of a skill with kind 'calc' whose answers are all quantities)
   belongs to the first kind of problem of its module that it matches. A
   question of the module that no objective or kind takes is listed under
   "Other ..." on its page, so nothing in the module is left out. Both lists
   are optional; the build step checks what is declared.

   Options: `modules`, [[module value, heading], ...] in teaching order; without
   it the modules come in the order the lectures name them, headed by the
   value. `title`, the heading over the cards.
   ========================================================================== */
const OBJ_LIST = typeof OBJECTIVES === 'undefined' || !Array.isArray(OBJECTIVES) ? [] : OBJECTIVES;
const TYPE_LIST = typeof CALC_TYPES === 'undefined' || !Array.isArray(CALC_TYPES) ? [] : CALC_TYPES;
const TITLE = OPT.title || 'Study by module';

/* ---- modules: which questions and topics each holds ----------------------- */
const modOf = q => (q.module !== undefined && q.module !== null ? q.module : (lecOf(q) || {}).module);
const headingOf = m => (typeof m === 'string' && /\D/.test(m) ? m : 'Module ' + m);
let MODS = null;   // [[value, heading]], read once the page has its data
function mods(){
  if(MODS) return MODS;
  const set = Array.isArray(OPT.modules) && OPT.modules.length ? OPT.modules.map(r => [r[0], String(r[1])]) : null;
  if(set) return (MODS = set);
  const seen = [];
  (COURSE.lectures || []).map(l => l.module).concat(QUESTIONS.map(modOf))
    .forEach(m => { if(m !== undefined && m !== null && !seen.includes(m)) seen.push(m); });
  return (MODS = seen.map(m => [m, headingOf(m)]));
}
let TOPIC_MOD = null;
function topicModule(t){
  if(!TOPIC_MOD){
    TOPIC_MOD = {};
    const n = {};
    QUESTIONS.forEach(q => { const m = modOf(q); if(m === undefined || m === null) return;
      const k = n[q.topic] = n[q.topic] || new Map(); k.set(m, (k.get(m) || 0) + 1); });
    Object.keys(n).forEach(t => { TOPIC_MOD[t] = [...n[t].entries()].sort((a, b) => b[1] - a[1])[0][0]; });
  }
  return TOPIC_MOD[t.id];
}
const topicsOf = m => TOPICS.filter(t => topicModule(t) === m);
const modulePool = m => topicsOf(m).flatMap(t => poolFor(t.id, null));
const subKey = q => q.topic + '/' + q.sub;

/* ---- concept or calculation (Basic-Pharmacokinetics kindOf) ---------------- */
const SKILL_CALC = Object.fromEntries((COURSE.skills || []).map(s => [s.id, s.kind === 'calc']));
const QUANTITY = /^[<>≈~]?\s*-?[\d.]/;
function kindOf(q){
  if(q.type === 'numeric') return 'calc';
  if(q.type === 'match' && SKILL_CALC[skillOf(q)] && (q.pairs || []).length
     && q.pairs.every(p => QUANTITY.test(String(p.r).trim()))) return 'calc';
  return 'concept';
}
const ofKind = (pool, k) => pool.filter(q => kindOf(q) === k);

/* ---- objectives and kinds of problem -------------------------------------- */
const objectivesOf = m => OBJ_LIST.filter(o => o.module === m);
const objectivePool = (o, m) => QUESTIONS.filter(q => kindOf(q) === 'concept' && o.subs.includes(subKey(q))
  && (m === undefined || modOf(q) === m) && matchesFilter(q));
const objLabel = o => o.label || `Objective ${o.n}`;
function calcTypeOf(q){
  if(kindOf(q) !== 'calc') return null;
  const m = modOf(q);
  return TYPE_LIST.find(t => t.module === m && (t.match || []).some(x => {
    const [ts, sk] = String(x).split(':');
    return (ts === subKey(q) || ts === q.topic) && (!sk || skillOf(q) === sk);
  })) || null;
}
const typesOf = m => TYPE_LIST.filter(t => t.module === m);
const typePool = t => QUESTIONS.filter(q => calcTypeOf(q) === t && matchesFilter(q));
const otherConcepts = m => { const objs = objectivesOf(m);
  return ofKind(modulePool(m), 'concept').filter(q => !objs.some(o => o.subs.includes(subKey(q)))); };
const otherCalcs = m => ofKind(modulePool(m), 'calc').filter(q => !calcTypeOf(q));

/* ---- what the other modules add, read when the page is drawn --------------- */
const chainApi = () => FX.api('chained-problem-sets');
const chainModule = c => (c.module !== undefined && c.module !== null ? c.module : (byId(c.parts[0]) ? modOf(byId(c.parts[0])) : undefined));
const chainsIn = m => { const C = chainApi(); return C ? C.sets().filter(c => chainModule(c) === m) : []; };
const chainsForType = t => chainsIn(t.module).filter(c => c.parts.some(id => { const q = byId(id); return q && calcTypeOf(q) === t; }));
const lectureChains = m => chainsIn(m).filter(c => !c.src || c.src === 'example');
const sheetApi = () => FX.api('worksheets-ink');
function sheetsOf(m){
  const W = sheetApi(); if(!W || !W.SRC_BY) return [];
  return Object.keys(W.SRC_BY).map(k => W.SRC_BY[k])
    .filter(s => s.module === m || (Array.isArray(s.modules) && s.modules.includes(m)));
}
const sheetIds = s => { const W = sheetApi(); if(!W || !W.sheetPlan) return [];
  return [...new Set(W.sheetPlan(s).main.flatMap(g => g.ids))]; };
const SHEET_KINDS = [['example', 'Worked examples (lecture slides)'], ['in-class', 'In-class activities'], ['daily-practice', 'Daily practice'],
  ['homework', 'Homework'], ['quiz', 'Quizzes'], ['review', 'Review sets'], ['lecture-slides', 'Lecture slides']];
const STATUS_WORDS = [['struggling', 'struggling'], ['returning', 'returning'], ['unfamiliar', 'unfamiliar'], ['improving', 'improving'],
  ['learning', 'learning'], ['mastered', 'mastered']];
/* With concept-statuses on: the concepts of a set of questions by status. */
function statusNote(pool){
  const S = FX.api('concept-statuses'); if(!S || !pool.length) return '';
  const G = S.conceptLog(), n = {}, cs = [...new Set(pool.map(q => q.concept))];
  let none = 0;
  cs.forEach(c => { if(!G[c]) { none++; return; } const s = S.conceptRecord(G[c]).s; n[s] = (n[s] || 0) + 1; });
  const parts = STATUS_WORDS.filter(([k]) => n[k]).map(([k, w]) => `${n[k]} ${w}`);
  if(none) parts.push(`${none} not answered yet`);
  return `<span class="mpstatus" data-statuses="${cs.length}">Concepts: ${parts.join(', ')}</span>`;
}

/* ---- text ----------------------------------------------------------------- */
const rich = s => { const F = FX.api('formulas-in-text'); return F ? F.rich(s) : esc(s).replace(/\{\{frac:([^|}]*)\|([^}]*)\}\}/g, '($1)/($2)'); };
const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;
function answeredOf(pool){
  const ids = new Set(pool.map(q => q.id)), seen = new Set();
  for(const a of DB.answers) if(ids.has(a.qid)) seen.add(a.qid);
  return {n: seen.size, total: ids.size};
}
function progressHTML(pool){
  const m = masteryOf(pool), an = answeredOf(pool);
  const pm = m.total ? Math.round(100 * m.mastered / m.total) : 0;
  return `<span class="mpmeters" title="Questions answered at least once; concepts on long review"><span class="counts">${an.n}/${an.total} answered</span>` +
    `<span class="meter"><i style="width:${pm}%"></i></span><span class="counts">${m.mastered}/${m.total} concepts</span></span>`;
}
function rowHTML(title, sub, pool, btn){
  return `<div class="subrow"><span class="sname"><b>${title}</b><small>${sub}</small></span>
    ${pool && pool.length ? progressHTML(pool) : ''}${btn}</div>`;
}
function chainRow(c){
  const parts = c.parts.map(byId).filter(Boolean);
  return rowHTML(esc(c.name), `${plural(parts.length, 'part')} · ${c.setup || ''}`, parts, `<button data-mpchain="${esc(c.id)}">Start</button>`);
}
function workedHTML(q){
  const steps = (q.steps || []).map(s => `<li><span class="stepk">${esc(MISS_KINDS[s.k] || s.k)}</span><code>${rich(s.t)}</code>${s.why ? `<span class="stepwhy">${rich(s.why)}</span>` : ''}</li>`).join('');
  return `<details class="worked"><summary>Worked example</summary><div class="wbody">
    <div class="wstem">${String(q.stem || '').split(/\n\s*\n/).map(p => `<p>${rich(p)}</p>`).join('')}</div>
    ${steps ? `<ol class="steps">${steps}</ol>` : ''}
    <p class="wans"><b>Answer:</b> ${esc(typeof fmtNum === 'function' ? fmtNum(q.answer) : String(q.answer))} ${esc(q.units || '')}</p>
    <p class="wcite">${esc(q.cite || '')}</p></div></details>`;
}

/* ---- the cards on Topics --------------------------------------------------- */
function modBtn(i, sec, title, sub, pool){
  const an = pool ? answeredOf(pool) : null;
  return `<button class="modbtn" data-mpmod="${i}" data-mpsec="${sec}"><b>${title}</b><small>${sub}</small>${
    an && an.total ? `<span class="meter cov"><i style="width:${Math.round(100 * an.n / an.total)}%"></i></span>` : ''}</button>`;
}
function moduleCard(row, i){
  const m = row[0], pool = modulePool(m);
  if(!pool.length) return '';
  const cpool = ofKind(pool, 'concept'), kpool = ofKind(pool, 'calc');
  const objs = objectivesOf(m).filter(o => objectivePool(o, m).length);
  const types = typesOf(m).filter(t => typePool(t).length);
  const sheets = sheetsOf(m).filter(s => sheetIds(s).length);
  const sheetQs = [...new Set(sheets.flatMap(sheetIds))].map(byId).filter(Boolean);
  const mm = masteryOf(pool), pct = mm.total ? Math.round(100 * mm.mastered / mm.total) : 0;
  return `<div class="topic modcard" data-mpcard="${i}"><div class="mrow">
      <span class="tname">${esc(row[1])}<small>${plural(pool.length, 'question')}</small></span>
      <span class="meter"><i style="width:${pct}%"></i></span><span class="counts">${mm.mastered}/${mm.total}</span></div>
    <div class="modbtns">
      ${cpool.length ? modBtn(i, 'concepts', 'Concepts', `${plural(cpool.length, 'question')} · ${plural(objs.length, 'objective')}`, cpool) : ''}
      ${kpool.length ? modBtn(i, 'calcs', 'Calculations', `${plural(kpool.length, 'problem')} · ${plural(types.length, 'type')}`, kpool) : ''}
      ${sheets.length ? modBtn(i, 'worksheets', 'Worksheets', `${plural(sheets.length, 'document')} from the professor's handouts`, sheetQs) : ''}
    </div></div>`;
}
function cardsHTML(){
  const cards = mods().map(moduleCard).join('');
  return cards ? `<div id="mpCards"><h3>${esc(TITLE)}</h3>${cards}</div>` : '';
}

/* ---- the module's page ----------------------------------------------------- */
let MODPAGE = null;   // {i: index into mods(), sec: 'concepts' | 'calcs' | 'worksheets'}
function conceptsPage(m){
  const objs = objectivesOf(m), all = [...new Set(objs.flatMap(o => objectivePool(o, m)))], other = otherConcepts(m);
  let h = `<p class="sub">Pick one objective, or study all of them. Questions on a concept you missed come back first.</p>`;
  h += `<div class="topic plain"><div class="subs">`;
  if(all.length) h += rowHTML('All objectives', `${plural(all.length, 'question')}, no arithmetic ${statusNote(all)}`, all, `<button data-mpobjall="1">Start</button>`);
  objs.forEach((o, k) => { const pool = objectivePool(o, m); if(!pool.length) return;
    h += rowHTML(`<span class="objn">${esc(objLabel(o))}</span> ${esc(o.text)}`, `${plural(pool.length, 'question')} ${statusNote(pool)}`, pool, `<button data-mpobj="${k}">Start</button>`); });
  if(other.length) h += rowHTML(objs.length ? 'Other concept questions in this module' : 'All concept questions in this module',
    `${plural(other.length, 'question')} ${statusNote(other)}`, other, `<button data-mpother="concept">Start</button>`);
  return h + `</div></div>`;
}
function calcsPage(m){
  const all = ofKind(modulePool(m), 'calc'), C = chainApi();
  let h = `<p class="sub">Each kind of problem has a worked example. <b>Single problems</b> asks the problems of that kind one at a time${C ? `; <b>In parts</b> works one of the professor's problems where each part uses the answer before it` : ''}.</p>`;
  h += `<div class="topic plain"><div class="subs">` +
    rowHTML('All calculations in this module', `${plural(all.length, 'problem')}, one at a time, shuffled`, all, `<button data-mpcalcall="1">Start</button>`) + `</div></div>`;
  typesOf(m).forEach(t => {
    const pool = typePool(t); if(!pool.length) return;
    const ex = t.example ? byId(t.example) : null, chains = C ? chainsForType(t) : [];
    h += `<div class="ctype" data-mptype="${esc(t.id)}"><div class="ctop"><span class="sname"><b>${esc(t.name)}</b><small>${plural(pool.length, 'problem')}${
        chains.length ? ` · ${chains.length} in parts` : ''}</small></span>${progressHTML(pool)}</div>
      <div class="cbtns"><button class="btn small" data-mpctype="${esc(t.id)}">Single problems</button>${
        chains.length === 1 ? `<button class="btn small ghost" data-mpchain="${esc(chains[0].id)}">In parts</button>` : ''}</div>
      ${ex ? workedHTML(ex) : ''}
      ${chains.length > 1 ? `<details class="worked"><summary>In parts: ${chains.length} of the professor's problems</summary>
        <div class="subs">${chains.map(chainRow).join('')}</div></details>` : ''}
    </div>`;
  });
  const other = otherCalcs(m);
  if(other.length) h += `<div class="topic plain"><div class="subs">` + rowHTML(typesOf(m).length ? 'Other calculations in this module' : 'Calculations by subtopic',
    plural(other.length, 'problem'), other, `<button data-mpother="calc">Start</button>`) + `</div></div>`;
  const lec = lectureChains(m);
  if(lec.length) h += `<h3>Lecture examples, in parts</h3><div class="topic plain"><div class="subs">${lec.map(chainRow).join('')}</div></div>`;
  return h;
}
function worksheetsPage(m){
  const list = sheetsOf(m);
  let h = `<p class="sub">The professor's documents for this module. Write on it opens the worksheet to write on; Practice in the drill asks its problems in the sheet's order.</p>`;
  let any = false;
  for(const [k, name] of SHEET_KINDS.concat([['', 'Other documents']])){
    const cs = list.filter(s => k ? s.type === k : !SHEET_KINDS.some(([t]) => t === s.type)); if(!cs.length) continue; any = true;
    h += `<h3>${esc(name)}</h3><div class="topic plain"><div class="subs">${cs.map(s => {
      const ids = sheetIds(s), pool = ids.map(byId).filter(Boolean);
      return rowHTML(esc(s.title), ids.length ? plural(ids.length, 'problem') + ' in the drill' : 'No questions from this document are in the drill yet', pool,
        ids.length ? `<span class="btns"><button class="ghost" data-ink="${esc(s.id)}" data-var="main">Write on it</button><button data-mpsheet="${esc(s.id)}">Practice in the drill</button></span>` : '');
    }).join('')}</div></div>`;
  }
  return any ? h : h + `<div class="empty">No worksheets for this module yet.</div>`;
}
function startPool(pool, label){
  if(!pool.length){ alert('No questions match those filters.'); return; }
  Q = {pool, label, current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false};
  nextQuestion(); show('quiz');
}
function startSweepOf(pool, label){
  if(!pool.length){ alert('No questions match those filters.'); return; }
  Q = {pool, label, sweep: shuffle(pool.map(q => q.id)), i: 0, current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false};
  nextQuestion(); show('quiz');
}
const pageKey = () => MODPAGE ? MODPAGE.i + ':' + MODPAGE.sec : '';
function drawPage(pane){
  const row = mods()[MODPAGE.i];
  if(!row || !modulePool(row[0]).length){ MODPAGE = null; pane.classList.remove('onmodpage'); return; }
  const m = row[0], ofSec = {concepts: ofKind(modulePool(m), 'concept').length, calcs: ofKind(modulePool(m), 'calc').length,
    worksheets: sheetsOf(m).length};
  if(!ofSec[MODPAGE.sec]) MODPAGE.sec = ['concepts', 'calcs', 'worksheets'].find(s => ofSec[s]) || 'concepts';
  const sec = MODPAGE.sec, tab = (s, label) => ofSec[s] ? `<button class="mtab" data-mpsec="${s}" aria-pressed="${sec === s}">${label}</button>` : '';
  let h = `<div class="mpage" data-mpkey="${pageKey()}"><p class="crumb"><button class="linkbtn" id="mpBack">← All modules</button></p>
    <h2>${esc(row[1])}</h2>
    <div class="mtabs" role="group" aria-label="Section">${tab('concepts', 'Concepts')}${tab('calcs', 'Calculations')}${tab('worksheets', 'Worksheets')}</div>`;
  h += sec === 'calcs' ? calcsPage(m) : sec === 'worksheets' ? worksheetsPage(m) : conceptsPage(m);
  pane.innerHTML = h + `</div>`;
  pane.classList.add('onmodpage');
  wirePage(pane, row);
}
function wirePage(pane, row){
  const m = row[0], name = row[1], on = (sel, f) => pane.querySelectorAll(sel).forEach(b => b.onclick = () => FX.run(X.name, 'click', () => f(b)));
  on('#mpBack', () => { MODPAGE = null; pane.classList.remove('onmodpage'); renderTopics(); });
  on('.mtab', b => { MODPAGE.sec = b.dataset.mpsec; drawPage(pane); window.scrollTo(0, 0); });
  on('[data-mpobjall]', () => startPool([...new Set(objectivesOf(m).flatMap(o => objectivePool(o, m)))], `${name} — all objectives`));
  on('[data-mpobj]', b => { const o = objectivesOf(m)[+b.dataset.mpobj]; startPool(objectivePool(o, m), `${name} — ${objLabel(o)}`); });
  on('[data-mpother]', b => b.dataset.mpother === 'calc' ? startSweepOf(otherCalcs(m), `${name} — other calculations`)
                                                         : startPool(otherConcepts(m), `${name} — concepts`));
  on('[data-mpcalcall]', () => startSweepOf(ofKind(modulePool(m), 'calc'), `${name} — calculations`));
  on('[data-mpctype]', b => { const t = TYPE_LIST.find(x => x.id === b.dataset.mpctype); startSweepOf(typePool(t), t.name); });
  on('[data-mpchain]', b => { const C = chainApi(); if(C) C.startChain(b.dataset.mpchain); });
  on('[data-mpsheet]', b => { const W = sheetApi(); if(W) W.startSheetSet(b.dataset.mpsheet, 'main'); });
}
function wireCards(pane){
  pane.querySelectorAll('#mpCards .modbtn').forEach(b => b.onclick = () => FX.run(X.name, 'click', () => {
    MODPAGE = {i: +b.dataset.mpmod, sec: b.dataset.mpsec}; drawPage(pane); window.scrollTo(0, 0);
  }));
}

/* After the core draws Topics: the module's page when one is open (anything
   another module adds to the pane is hidden under it), otherwise the cards
   above the topic list. */
X.rendered((pane, view) => {
  if(view !== 'topics') return;
  if(MODPAGE){
    const p = pane.querySelector(':scope > .mpage');
    if(!p || p.dataset.mpkey !== pageKey()) drawPage(pane);
    return;
  }
  pane.classList.remove('onmodpage');
  if(pane.querySelector('#mpCards')) return;
  const html = cardsHTML(); if(!html) return;
  const at = pane.querySelector(':scope > .sweepcard');
  if(at) at.insertAdjacentHTML('afterend', html); else pane.insertAdjacentHTML('afterbegin', html);
  wireCards(pane);
});
/* a tap on Topics while a module's page is open goes back to the list */
X.start(() => {
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#nav button[data-v="topics"]');
    if(b && MODPAGE && typeof VIEW !== 'undefined' && VIEW === 'topics') MODPAGE = null;
  }, true);
});
X.api({mods, modOf, topicModule, modulePool, kindOf, calcTypeOf, objectivesOf, objectivePool, typesOf, typePool,
       otherConcepts, otherCalcs, sheetsOf, chainsForType, state: () => MODPAGE,
       open: (i, sec) => { MODPAGE = {i, sec: sec || 'concepts'}; show('topics'); },
       close: () => { MODPAGE = null; show('topics'); }});
