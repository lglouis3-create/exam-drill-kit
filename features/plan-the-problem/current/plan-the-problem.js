/* ==========================================================================
   PLAN THE PROBLEM: THE SET-UP DRILL (feature module plan-the-problem v1)
   ==========================================================================
   Ported from Basic-Pharmacokinetics src/views.js lines 4754-5120 at ac2eb73
   (the set-up drill, "Set-up only: which equation?", and "Plan the problem").
   The course's calculation stems are shown with no arithmetic: the student
   picks the equation line that solves what is asked and then reads why. In
   "Plan the problem" the line comes after what is asked and its unit, the
   dosing model from the stem's words, and is followed by whether the
   equation sheet prints the line and which of the stem's givens it uses.

   Course data it reads (equation-drill's EQUATIONS, and on each numeric
   question):
     setup:  {eq, pre, why}  the line that gives the final number, the lines
             used before it, and the reason in the stem's own words; a
             question with eq 'none' stays out of the drill
     asks:   a key of ASKS, the quantity the stem asks for (optional)
     givens: [[symbol, value, role], ...]; a role that starts "not needed"
             marks a given the line does not use (optional)
     check:  {t}  the estimate to make before computing (optional)
   and, in a data file listed in course.js `files`:
     ASKS = {key: [symbol, meaning]}   optional; without it "What is asked?"
                                       and the unit step are left out
     PLAN = {models: [[id, name], ...], topics: {topic id: model id},
             also: [[[model ids], stem pattern, model id], ...],
             units: [unit, ...], same: [[equation ids], ...],
             routine: [HTML, ...]}     optional; without `models` only
                                       "Set-up only" is offered
   What changed for the kit:
   - the dosing models, the topic-to-model map, the stem words that also
     accept a route, the unit lures, the lines counted as one relation and
     "How to go about any calculation" are the course's PLAN data, not code;
   - the sentence split of the set-up reason has no regex lookbehind;
   - the tally of lines missed is kept in the progress as DB.setup, so it is
     exported, imported and erased with the rest;
   - one stem at a time (the kit has no Answer layout setting);
   - left out: choosing the line from the whole sheet (it needs the sheet
     map, sheet.js), the quiz and exam scopes, "Work it yourself in the
     quiz", "Type this line from memory", the origin tag and the button back
     to the view the drill was started from;
   - the professor is named as "the professor", not "she".
   ========================================================================== */
const F = FX.api('formulas-in-text'), A = FX.api('equation-drill');
if(!F || !A) throw new Error('plan-the-problem needs the equation-drill and formulas-in-text modules switched on');
const {mathHTML, rich} = F;
const EQ_BY_ID = A.EQ_BY_ID;
const P = typeof PLAN === 'undefined' || !PLAN ? {} : PLAN;
const ASK = typeof ASKS === 'undefined' || !ASKS || !Object.keys(ASKS).length ? null : ASKS;   // an ASKS with no keys is no ASKS
const HAS_PLAN = Array.isArray(P.models) && P.models.length > 0;
const groupName = m => (OPT.groups && OPT.groups[m]) || ('Module ' + m);
const eqShow = e => `<span class="eqshow">${e.lhs} = ${mathHTML(e.disp || e.tokens.join(' '))}</span>`;
const SHEET_SAYS = {yes: 'printed on the sheet', no: 'not printed; the professor said so', absent: 'not printed'};
/* Basic-Pharmacokinetics adds "she said to know it" to every line marked `must`,
   whatever the sheet says (src/views.js line 4967). */
const sheetSays = e => (SHEET_SAYS[e.sheet] || SHEET_SAYS.absent) + (!e.must ? '' : e.sheet === 'no' ? ', and said to know it' : '; the professor said to know it');

let SU = null;   /* {queue:[q], i, right, asked, plans, scope, mode, page:{qid: state}} */
/* DB.setup = {equation id: {seen, right, wrong}}. A saved progress whose field has
   another shape (an import of another file) starts the tally afresh rather than
   losing each new pick on the next save. */
const plainObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
const tallyOk = r => plainObj(r) && ['seen', 'right', 'wrong'].every(k => typeof r[k] === 'number');
function suStats(){ const s = typeof DB !== 'undefined' && DB && DB.setup; return plainObj(s) ? s : {}; }
function suLog(eqId, ok){
  if(!plainObj(DB.setup)) DB.setup = {};
  const r = tallyOk(DB.setup[eqId]) ? DB.setup[eqId] : (DB.setup[eqId] = {seen: 0, right: 0, wrong: 0});
  r.seen++; ok ? r.right++ : r.wrong++; save();
}
const suPoolAll = () => QUESTIONS
  .filter(q => q.type === 'numeric' && q.setup && q.setup.eq && q.setup.eq !== 'none' && EQ_BY_ID[q.setup.eq]);
function suScopePool(scope){
  const all = suPoolAll();
  if(scope === 'all') return all;
  const m = +scope; return isNaN(m) ? all : all.filter(q => q.module === m);
}
const suScopeLabel = scope => scope === 'all' ? 'every module' : groupName(+scope);
function suStart(scope){
  const plan = /^plan:/.test(scope); scope = scope.replace(/^plan:/, '');
  const pool = shuffle(suScopePool(scope).slice());
  if(!pool.length){ alert('No set-up questions for that scope yet.'); return; }
  SU = {queue: pool, i: 0, right: 0, asked: 0, plans: 0, scope, mode: plan && HAS_PLAN ? 'plan' : 'line', page: {}};
  if(A.state()) A.stop();
  if(VIEW !== 'eq') show('eq');
  suRender();
}
function suStop(){
  SU = null;
  const el = document.getElementById('v-eq'); if(el) el.onclick = null;
  A.renderEq();
}
/* ---- Plan the whole problem -------------------------------------------
   Decisions before any arithmetic, in the order the routine gives them:
   what is asked and its unit, the dosing model from the stem's words, the
   line whose left side is the asked symbol, whether the sheet prints it, and
   which of the stem's givens that line uses. The model a stem belongs to is
   the one its topic maps to (PLAN.topics, else the first model); PLAN.also
   adds a model a stem of that model also accepts when its words match. */
const PLAN_NAME = Object.fromEntries(HAS_PLAN ? P.models : []);
function planModels(q){
  const main = (P.topics || {})[q.topic] || P.models[0][0], acc = new Set([main]);
  for(const [from, pat, add] of (P.also || [])) if(from.includes(main) && new RegExp(pat, 'i').test(String(q.stem))) acc.add(add);
  return {main, acc};
}
const planNeeded = q => (q.givens || []).map((g, i) => /^not needed/i.test(g[2] || '') ? null : i).filter(i => i !== null);
/* "What is asked?": the symbol of the quantity, from six; then the unit the
   answer carries. The lures are the quantities and units the same module's
   stems ask for, so the choice is between neighbours. */
const normUnit = u => String(u || '').toLowerCase().replace(/\s+/g, '').replace(/·|\*/g, '.');
function planAskOpts(q){
  const mod = suPoolAll().filter(x => x.module === q.module && x.asks && ASK[x.asks] && x.asks !== q.asks).map(x => x.asks);
  const near = shuffle([...new Set(mod)]), rest = shuffle(Object.keys(ASK).filter(k => k !== q.asks && !near.includes(k)));
  return shuffle([q.asks, ...near, ...rest].slice(0, 6));
}
function planUnitOpts(q){
  const seen = new Set([normUnit(q.units)]), out = [q.units];
  const mod = shuffle([...new Set(suPoolAll().filter(x => x.module === q.module).map(x => x.units))]);
  const rest = shuffle([...new Set(suPoolAll().map(x => x.units))]);
  for(const u of [...mod, ...(P.units || []), ...rest]){ if(out.length >= 6) break; if(u && !seen.has(normUnit(u))){ seen.add(normUnit(u)); out.push(u); } }
  return shuffle(out);
}
const planHasAsk = q => !!(ASK && q.asks && ASK[q.asks] && q.units);
function planAskHTML(q, st, n){
  st.askOpts ||= planAskOpts(q);
  let h = `<p class="suask"><b>${n}. What is asked?</b> The symbol of the quantity the stem wants, before anything else.</p><div class="sumodels">${st.askOpts.map(k => {
    const cls = st.ask == null ? '' : k === q.asks ? ' right' : k === st.ask ? ' wrong' : ' dim';
    return `<button type="button" class="suopt sumodel${cls}" data-suask="${esc(k)}"${st.ask != null ? ' disabled' : ''}><span class="suname">${rich(ASK[k][0])}</span></button>`; }).join('')}</div>`;
  if(st.ask != null){
    h += `<p class="verdict ${st.askOk ? 'ok' : 'bad'}">${st.askOk ? '✓ ' : `✗ Not ${rich(ASK[st.ask][0])}: the stem asks for `}${rich(ASK[q.asks][0])}</p>
      <p class="sub">${rich(ASK[q.asks][0])} is ${esc(ASK[q.asks][1])}.</p>`;
  }
  return h;
}
function planUnitHTML(q, st, n){
  st.unitOpts ||= planUnitOpts(q);
  let h = `<p class="suask"><b>${n}. Which unit will the answer carry?</b></p><div class="sumodels">${st.unitOpts.map(u => {
    const cls = st.unit == null ? '' : normUnit(u) === normUnit(q.units) ? ' right' : u === st.unit ? ' wrong' : ' dim';
    return `<button type="button" class="suopt sumodel${cls}" data-suunit="${esc(u)}"${st.unit != null ? ' disabled' : ''}><span class="suname">${esc(u)}</span></button>`; }).join('')}</div>`;
  if(st.unit != null) h += `<p class="verdict ${st.unitOk ? 'ok' : 'bad'}">${st.unitOk ? '✓ ' + esc(q.units) : `✗ Not ${esc(st.unit)}: the answer is in ${esc(q.units)}`}</p>`;
  return h;
}
function planSheetHTML(q, st, n){
  const e = EQ_BY_ID[q.setup.eq], printed = e.sheet === 'yes';
  let h = `<p class="suask"><b>${n}. Is that line printed on the equation sheet?</b></p><div class="sumodels">${[['yes', 'Printed on the sheet'], ['no', 'Not printed: from memory, or reached from a printed line']].map(([k, label]) => {
    const right = (k === 'yes') === printed, cls = st.sheet == null ? '' : right ? ' right' : k === st.sheet ? ' wrong' : ' dim';
    return `<button type="button" class="suopt sumodel${cls}" data-susheet="${k}"${st.sheet != null ? ' disabled' : ''}><span class="suname">${esc(label)}</span></button>`; }).join('')}</div>`;
  if(st.sheet != null) h += `<p class="verdict ${st.sheetOk ? 'ok' : 'bad'}">${st.sheetOk ? '✓ ' : '✗ '}${printed ? 'It is printed; find it on the sheet rather than recalling it.' : (e.must ? 'It is not printed; the professor said to know it.' : 'It is not printed; it is reached from a printed line.')}</p>`;
  return h;
}
function planModelHTML(q, st, n){
  const {main, acc} = planModels(q);
  let h = `<p class="suask"><b>${n}. Which dosing model?</b> From the stem's words.</p><div class="sumodels">${P.models.map(([k, name]) => {
    const cls = st.model == null ? '' : acc.has(k) ? ' right' : k === st.model ? ' wrong' : ' dim';
    return `<button type="button" class="suopt sumodel${cls}" data-sumodel="${esc(k)}"${st.model != null ? ' disabled' : ''}><span class="suname">${esc(name)}</span></button>`; }).join('')}</div>`;
  if(st.model != null){
    const first = suFirstSentence(String(q.setup.why || ''));
    h += `<p class="verdict ${st.modelOk ? 'ok' : 'bad'}">${st.modelOk ? '✓ ' + esc(PLAN_NAME[main]) : `✗ Not ${esc(PLAN_NAME[st.model] || '')}: this stem is ${esc(PLAN_NAME[main])}`}</p>
      ${first ? `<p class="sub">${rich(first)}</p>` : ''}`;
  }
  return h;
}
function planGivensHTML(q, st, n){
  const need = new Set(planNeeded(q)), gs = q.givens || [];
  let h = `<p class="suask"><b>${n}. Which givens does this line use?</b> Tick every value that enters the working, the lines used before it included; leave the rest.</p>
    <div class="sugivs">${gs.map((g, i) => { const on = st.giv.has(i);
      const cls = !st.givChecked ? (on ? ' on' : '') : need.has(i) ? (on ? ' right' : ' missed') : (on ? ' wrong' : ' dim');
      return `<button type="button" class="suopt sugiv${cls}" data-sugiv="${i}" aria-pressed="${on}"${st.givChecked ? ' disabled' : ''}><span class="suname">${rich(g[0])} = ${esc(g[1])}</span>${st.givChecked ? `<span class="sueq surole">${rich(g[2])}</span>` : ''}</button>`; }).join('')}</div>`;
  if(!st.givChecked) h += `<div class="btns"><button type="button" class="btn" data-sugivcheck="1">Check the givens</button></div>`;
  else {
    const extra = [...st.giv].filter(i => !need.has(i)).length, left = [...need].filter(i => !st.giv.has(i)).length;
    h += `<p class="verdict ${st.givOk ? 'ok' : 'bad'}">${st.givOk ? '✓ The right givens, and the right ones set aside' : `✗ ${left ? left + ' needed given' + (left > 1 ? 's' : '') + ' left out' : ''}${left && extra ? ', ' : ''}${extra ? extra + ' not needed' : ''}`}</p>`;
  }
  return h;
}
/* Three other lines: first from the same module (minus the lines the
   working uses before the last one, which would be defensible picks), then
   from the modules next door, then anywhere. Lines the course treats as one
   relation written two ways (PLAN.same) are never offered against each other. */
const suSame = id => new Set((P.same || []).filter(g => g.includes(id)).flat());
function suOptions(q){
  const e = EQ_BY_ID[q.setup.eq], used = new Set([q.setup.eq, ...suSame(q.setup.eq), ...(q.setup.pre || [])]);
  const pick = (cands, n, out) => { for(const c of shuffle(cands.slice())){ if(out.length >= n) break; if(!used.has(c.id) && !out.includes(c)) out.push(c); } };
  const out = [];
  pick(EQUATIONS.filter(x => x.module === e.module), 3, out);
  pick(EQUATIONS.filter(x => Math.abs(x.module - e.module) === 1), 3, out);
  pick(EQUATIONS, 3, out);
  return shuffle([e, ...out]);
}
/* The state for one stem, made on first sight and kept, so a return never
   re-asks or re-rolls a stem already answered. */
const suState = q => (SU.page[q.id] ||= {options: suOptions(q), picked: null, ok: false, model: null, modelOk: false, giv: new Set(), givChecked: false, givOk: false,
  ask: null, askOk: false, unit: null, unitOk: false, sheet: null, sheetOk: false, shown: false});
const suAnswered = st => st.picked != null;
/* The set-up reasoning as one bullet per sentence. A sentence ends at . ? or !
   followed by a space, so a decimal point (0.693) inside a fraction never
   splits a sentence, and neither does the ellipsis of a quoted phrase ("..").
   Written without a regex lookbehind, which older Safari cannot parse. */
function whySentences(txt){
  const s = String(txt || ''), out = [], re = /[.?!]\s+/g;
  let start = 0, m;
  while((m = re.exec(s))){
    if(s[m.index] === '.' && s[m.index - 1] === '.') continue;
    out.push(s.slice(start, m.index + 1)); start = re.lastIndex;
  }
  out.push(s.slice(start));
  return out.map(t => t.trim()).filter(Boolean);
}
const suFirstSentence = t => { const m = /^[\s\S]*?\.(?=\s|$)/.exec(String(t || '')); return m ? m[0] : String(t || ''); };
function workedHTML(q){
  const kinds = typeof MISS_KINDS === 'undefined' ? {} : MISS_KINDS;
  return `<ol class="steps">${(q.steps || []).map(s => `<li><span class="stepk">${esc(kinds[s.k] || s.k)}</span>${rich(s.t)}${s.why ? `<span class="stepwhy">${esc(s.why)}</span>` : ''}</li>`).join('')}</ol>`;
}
function suQuestionHTML(q, st){
  const e = EQ_BY_ID[q.setup.eq], plan = SU.mode === 'plan';
  let h = `<div class="card suq"><div class="qhead"><span class="tag">${esc(groupName(q.module))}</span><span class="tag">${plan ? 'plan the problem' : 'set-up only'}</span></div>
    <div class="stem">${rich(q.stem)}</div>`;
  let step = 1;
  if(plan){
    if(planHasAsk(q)){
      h += planAskHTML(q, st, step++); if(st.ask == null) return h + `</div>`;
      h += planUnitHTML(q, st, step++); if(st.unit == null) return h + `</div>`;
    }
    h += planModelHTML(q, st, step++); if(st.model == null) return h + `</div>`;
  }
  const lineStep = plan ? step++ + '. ' : '';
  /* names are shown only once answered: a name such as "Relative bioavailability" would give the line away */
  h += `<p class="suask"><b>${lineStep}Which line solves what is asked?</b> Pick the equation; no arithmetic.</p>
    <div class="suopts">${st.options.map((o, i) => {
      const cls = !suAnswered(st) ? '' : o.id === e.id ? ' right' : i === st.picked ? ' wrong' : ' dim';
      return `<button type="button" class="suopt${cls}" data-suopt="${i}"${suAnswered(st) ? ' disabled' : ''}>
        ${suAnswered(st) ? `<span class="suname">${esc(o.name)}</span>` : ''}<span class="sueq">${eqShow(o)}</span></button>`; }).join('')}</div>`;
  if(suAnswered(st)){
    const chosen = st.options[st.picked];
    const why = whySentences(q.setup.why);
    const pre = (q.setup.pre || []).filter(id => EQ_BY_ID[id]);
    h += `<div class="why"><p class="verdict ${st.ok ? 'ok' : 'bad'}">${st.ok ? '✓ That is the line' : '✗ Not that line'}</p>
      ${st.ok ? '' : `<p class="sub">You picked <b>${esc(chosen.name)}</b>, ${eqShow(chosen)}.${chosen.holds ? ` It holds when: ${mathHTML(suFirstSentence(chosen.holds))}` : ''}</p>`}
      <div class="suright"><b>${esc(e.name)}</b> <span class="sm">(${esc(sheetSays(e))})</span><div class="sueqbig">${eqShow(e)}</div></div>`;
    if(plan && (q.givens || []).length){
      h += planSheetHTML(q, st, step++); if(st.sheet == null) return h + `</div></div>`;
      h += planGivensHTML(q, st, step++);
      if(!st.givChecked) return h + `</div></div>`;
      const need = planNeeded(q), main = planModels(q).main;
      h += `<div class="suplan"><h4>The plan</h4><ol>
        ${planHasAsk(q) ? `<li>Asked: ${rich(ASK[q.asks][0])}, ${esc(ASK[q.asks][1])}; the answer is in ${esc(q.units)}.</li>` : ''}
        <li>${esc(PLAN_NAME[main])}: the ${PLAN_NAME[main].toLowerCase().startsWith('any') ? 'block' : 'block of the sheet'} to read from.</li>
        <li>${eqShow(e)}, the line whose left side is what is asked${pre.length ? `, after ${pre.map(id => eqShow(EQ_BY_ID[id])).join(' and ')}` : ''}; ${e.sheet === 'yes' ? 'printed on the sheet' : 'not printed'}.</li>
        <li>Givens that enter: ${need.map(i => rich(q.givens[i][0])).join(', ') || 'none beyond the line'}.${q.givens.length > need.length ? ` Set aside: ${q.givens.map((g, i) => need.includes(i) ? null : rich(g[0])).filter(Boolean).join(', ')}.` : ''}</li>
        ${q.check && q.check.t ? `<li>Before computing: ${rich(q.check.t)}</li>` : ''}</ol></div>`;
    }
    h += `<h4>Why this line</h4><ul class="tlist">${why.map(s => `<li>${rich(s)}</li>`).join('')}</ul>
      ${pre.length ? `<h4>Lines used on the way</h4><ul class="tlist">${pre.map(id => `<li>${eqShow(EQ_BY_ID[id])} <span class="sm">${esc(EQ_BY_ID[id].name)}</span></li>`).join('')}</ul>` : ''}
      ${[e.id, ...pre].map(id => A.eqSheetHTML(EQ_BY_ID[id])).join('')}
      ${st.shown ? `<div class="suwork"><p class="verdict ok">Keyed answer ${esc(fmtNum(q.answer))} ${esc(q.units || '')}</p>${workedHTML(q)}</div>` : ''}
      <div class="btns"><button class="btn" data-sunext="1">Next</button>
        <button class="btn ghost" data-sushow="1">${st.shown ? 'Hide the working' : 'Show the problem worked out'}</button></div></div>`;
  }
  return h + `</div>`;
}
function suMixupsHTML(){
  const s = suStats();
  const rows = Object.entries(s).filter(([id, r]) => EQ_BY_ID[id] && tallyOk(r) && r.wrong).sort((a, b) => b[1].wrong - a[1].wrong).slice(0, 6);
  if(!rows.length) return '';
  return `<h4>The lines you missed most often</h4><ul class="tlist">${rows.map(([id, r]) => `<li>${eqShow(EQ_BY_ID[id])} <span class="sm">${esc(EQ_BY_ID[id].name)}: ${r.wrong} wrong of ${r.seen}</span></li>`).join('')}</ul>`;
}
/* The running count. In Plan the problem the line can be right while another
   step of the plan is wrong, so the two are counted apart. */
const suTally = () => SU.mode === 'plan'
  ? `${SU.right} of ${SU.asked} lines right · ${SU.plans} plans right in every step`
  : `${SU.right} of ${SU.asked} right`;
function suHTML(){
  const q = SU.queue[SU.i];
  const title = SU.mode === 'plan' ? 'Plan the problem' : 'Set-up drill';
  if(!q){
    const pct = SU.asked ? Math.round(100 * SU.right / SU.asked) : 0;
    return `<h2>${title}</h2><div class="card suend"><p><b>${SU.right} of ${SU.asked}</b> lines chosen correctly (${pct}%) for ${esc(suScopeLabel(SU.scope))}.${SU.mode === 'plan' ? ` <b>${SU.plans}</b> of ${SU.asked} plans right in every step.` : ''}</p>
      ${suMixupsHTML()}
      <div class="btns"><button class="btn" data-suagain="1">Again, reshuffled</button><button class="btn ghost" data-suhome="1">Back to Equations</button></div></div>`;
  }
  return `<h2>${title}</h2><div class="sessrow"><span>question ${SU.i + 1} of ${SU.queue.length} · ${esc(suScopeLabel(SU.scope))}</span>
    <span class="pbar"><i style="width:${Math.round(100 * SU.i / SU.queue.length)}%"></i></span><span class="sutally">${suTally()}</span></div>`
    + suQuestionHTML(q, suState(q))
    + `<p class="sub"><button class="chip" data-suhome="1">Stop and return to Equations</button></p>`;
}
function suRender(){
  const el = document.getElementById('v-eq'); if(!el || !SU) return;
  el.innerHTML = `<div data-suroot="1">${suHTML()}</div>`;
  suWire(el);
}
function suWire(el){
  el.onclick = ev => {
    if(!SU) return;
    const q = SU.queue[SU.i], st = q && SU.page[q.id];
    const t = sel => ev.target.closest(sel);
    let b;
    if((b = t('[data-suhome]'))){ suStop(); return; }
    if((b = t('[data-suagain]'))){ suStart((SU.mode === 'plan' ? 'plan:' : '') + SU.scope); return; }
    if(!q || !st) return;
    if((b = t('[data-suopt]'))){
      if(suAnswered(st)) return;
      st.picked = +b.dataset.suopt; st.ok = st.options[st.picked].id === q.setup.eq;
      SU.asked++; if(st.ok) SU.right++;
      suLog(q.setup.eq, st.ok);
    }
    else if((b = t('[data-sushow]'))) st.shown = !st.shown;
    else if((b = t('[data-sunext]'))){ SU.i++; suRender(); window.scrollTo(0, 0); return; }
    else if((b = t('[data-suask]'))){ if(st.ask != null) return; st.ask = b.dataset.suask; st.askOk = st.ask === q.asks; }
    else if((b = t('[data-suunit]'))){ if(st.unit != null) return; st.unit = b.dataset.suunit; st.unitOk = normUnit(st.unit) === normUnit(q.units); }
    else if((b = t('[data-susheet]'))){ if(st.sheet != null) return; st.sheet = b.dataset.susheet; st.sheetOk = (st.sheet === 'yes') === (EQ_BY_ID[q.setup.eq].sheet === 'yes'); }
    else if((b = t('[data-sumodel]'))){ if(st.model != null) return; st.model = b.dataset.sumodel; st.modelOk = planModels(q).acc.has(st.model); }
    else if((b = t('[data-sugiv]'))){ if(st.givChecked) return; const i = +b.dataset.sugiv; st.giv.has(i) ? st.giv.delete(i) : st.giv.add(i); }
    else if((b = t('[data-sugivcheck]'))){
      if(st.givChecked) return;
      const need = planNeeded(q); st.givChecked = true; st.givOk = need.length === st.giv.size && need.every(i => st.giv.has(i));
      if(st.modelOk && st.ok && st.givOk && st.sheetOk && (!planHasAsk(q) || (st.askOk && st.unitOk))) SU.plans++;
    }
    else return;
    suRender();
  };
}
/* The card on the Equations picker that starts the drill. */
function suCardHTML(){
  const pool = suPoolAll(), n = pool.length;
  const mods = [...new Set(pool.map(q => q.module))].sort((a, b) => a - b);
  const routine = (P.routine || []).length ? `<details class="tabhelp routine"><summary>How to go about any calculation</summary><ol>${P.routine.map(r => `<li>${r}</li>`).join('')}</ol></details>` : '';
  return `<div class="topic sweepcard sucard"><div class="subs">
    <div class="subrow"><span class="sname"><b>Set-up only: which equation?</b>
      <small>The course's calculation stems, no arithmetic: pick the line that solves what is asked, then read why. ${n} stem${n === 1 ? '' : 's'}, one at a time.</small></span></div>
    ${routine}
    <div class="frow suscope"><span class="olab">Drill</span>
      ${mods.map(m => `<button class="chip" data-su="${m}">${esc(groupName(m))}</button>`).join('')}
      <button class="chip" data-su="all">All</button></div>
    ${HAS_PLAN ? `<div class="frow suscope"><span class="olab">Plan</span>
      ${mods.map(m => `<button class="chip" data-su="plan:${m}">${esc(groupName(m))}</button>`).join('')}
      <button class="chip" data-su="plan:all">All</button>
      <small class="sm">Plan the whole problem: ${ASK ? 'what is asked and its unit, ' : ''}the dosing model from the stem's words, the line, whether the sheet prints it, and which givens it uses. Still no arithmetic.</small></div>` : ''}
  </div></div>`;
}
/* After the Equations tab is drawn: the drill takes the pane while it runs;
   otherwise the picker gets the card, after the writing drill's card. */
X.rendered((pane, view) => {
  if(view !== 'eq') return;
  if(SU){ if(!pane.querySelector('[data-suroot]')) suRender(); return; }
  if(A.state() || pane.querySelector('.sucard') || !suPoolAll().length) return;
  const at = pane.querySelector('.sweepcard');
  const box = document.createElement('div'); box.innerHTML = suCardHTML();
  const card = box.firstElementChild;
  at ? at.after(card) : pane.appendChild(card);
  card.addEventListener('click', ev => { const b = ev.target.closest('[data-su]'); if(b){ ev.stopPropagation(); suStart(b.dataset.su); } });
});
X.api({suPoolAll, suScopePool, suOptions, suStart, suStop, suStats, whySentences, planModels, planNeeded, planHasAsk, planAskOpts, planUnitOpts, normUnit,
       state: () => SU, render: suRender, HAS_PLAN});
