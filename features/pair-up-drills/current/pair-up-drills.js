/* ==========================================================================
   PAIR UP AND TABLE RECALL (feature module pair-up-drills v1)
   ==========================================================================
   Ported from Intro-Pharmacology- exam1-drill/src/app.js at 929cd62 (the
   port queue's lines 1923-2060 were taken at d0d3d2d): Pair up (PAIR_SETS,
   pairRound, vPair, pairPlace, pairCheck, pairWire), the drug-receptor drill
   (rxStart, rxAnswers, rxOptions, vRxq, rxCheck, rxAdvance) and the poisoning
   table drill (ptItems, ptStart, ptOptions, ptTable, vPtab, ptCheck,
   ptAdvance). What changed for the kit:

   - The sets and the tables are the course's data, in a data file listed in
     course.js `files`; the module holds no course content.

       PAIR_SETS = [{id, name, cite, bins, pairs: [[chip, box, why], ...]}]
         bins true: several chips can go into one box; otherwise one chip per
         box. A set of up to `wholeUpTo` pairs is served whole, a bigger one
         `pairRound` pairs a round (bins: `binRound`).

       RECALL_TABLES = [{id, tab, title, intro, cite, name, columns, covers,
                         modes, rows}]
         one nav tab per table, labelled `tab`. `rows` [{id, <column>: text or
         [text, ...]}]; `name` the column that heads a row; `columns`
         [[column, label], ...] what a row shows after an answer and on
         "Cover and reveal"; `covers` [[id, label, [columns]], ...] the cover
         choices of "Cover and reveal" (default: every column covered).
         `modes` [{id, label, ask, answer, prompt, options, near, distinct,
         alts}]: one item per row that has the `ask` column (or columns,
         joined with " · ") and the `answer` column; a column given as a list
         gives one item per entry (the other columns of the row repeat). The
         item is answered by one tap among `options` (default 5) different
         answers: the row's own, then the row's `alts` column (for example
         the same receptor with the action flipped), then the answers of the
         other items, those with the same `near` value first, leaving out
         rows with the same `distinct` value (another right answer).

     Intro to Pharmacology's drug set of Pair up and its drug table were built
     in the page from its drug list (pairDrugs, rxKey, rxSig); a course writes
     those rows into its data (port_from_ip.js beside this folder shows how).
   - Each drill draws into its own tab's pane, not #view.
   - The best score and the misses are kept in the progress as DB.pairup
     ({best: {key: 'right/total'}, miss: {key: [item id, ...]}}), so they are
     exported, imported and erased with the rest; Intro to Pharmacology kept
     them in separate keys (':pair', ':rx', ':pt').
   - Left out: the "See the figure" links (they open that course's own
     diagrams), the antidote diagrams beside the poisoning table, the variant
     drill (pgx_table.js, the same pattern; a course can give it as a table).
   - In every table drill a tap on an answer or on Skip within 350 ms of the
     card being drawn is not taken (Intro to Pharmacology's poisoning table
     drill had this guard; its drug drill had none): the second tap of a
     double tap on Next would otherwise land on the next card's Skip.
   - A saved best score or miss list in another shape (an older or edited
     export) is read as none instead of stopping the tab.
   - The professor is named as "the professor".
   Answers in these drills are not answers to bank questions: they are not
   recorded in DB.answers and the scheduler does not see them, as in Intro to
   Pharmacology. The core's `match` question type is a bank question; these
   are practice tabs over the course's own tables.
   ========================================================================== */
const SETS = typeof PAIR_SETS === 'undefined' ? [] : PAIR_SETS;
const TABLES = typeof RECALL_TABLES === 'undefined' ? [] : RECALL_TABLES;
const PAIR_TAB = 'pairup';
const tabOf = t => 'rt-' + t.id.replace(/[^a-z0-9-]/gi, '-');
const pane = id => document.getElementById('v-' + id);

/* ---------- progress: best scores and misses, in DB.pairup ---------- */
function PD(){
  if(!DB.pairup || typeof DB.pairup !== 'object') DB.pairup = {};
  for(const f of ['best', 'miss']) if(!DB.pairup[f] || typeof DB.pairup[f] !== 'object' || Array.isArray(DB.pairup[f])) DB.pairup[f] = {};
  return DB.pairup;
}
/* a saved value in another shape (an older or edited export) is read as nothing, not as an error */
const bestOf = k => { const v = ((DB.pairup || {}).best || {})[k]; return typeof v === 'string' && /^\d+\/\d+$/.test(v) ? v : ''; };
const missOf = k => { const v = ((DB.pairup || {}).miss || {})[k]; return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; };
const frac = s => { const [a, b] = String(s).split('/').map(Number); return b ? a / b : -1; };

/* ==================== Pair up ==================== */
const PR = {set: SETS.length ? SETS[0].id : null, sel: null, round: [], placed: {}, result: null};
const setOf = id => SETS.find(s => s.id === id);
function pairRound(){
  const S0 = setOf(PR.set), all = S0.pairs.slice();
  PR.round = S0.bins ? (all.length > OPT.binRound ? shuffle(all).slice(0, OPT.binRound) : shuffle(all))
                     : shuffle(all).slice(0, all.length <= OPT.wholeUpTo ? all.length : OPT.pairRound);
  PR.placed = {}; PR.sel = null; PR.result = null;
}
function vPair(){
  const el = pane(PAIR_TAB); if(!el) return;
  if(!PR.round.length) pairRound();
  const S0 = setOf(PR.set), targets = [...new Set(PR.round.map(p => p[1]))], tray = PR.round.filter(p => !PR.placed[p[0]]);
  const chip = p => `<button type="button" class="pchip ${PR.sel === p[0] ? 'sel' : ''} ${PR.result ? (PR.result[p[0]] ? 'ok' : 'bad') : ''}" data-pc="${esc(p[0])}" aria-pressed="${PR.sel === p[0]}">${esc(p[0])}</button>`;
  const best = bestOf('pair:' + PR.set);
  let h = `<h2>${esc(OPT.pairLabel)}</h2><p class="sub">Drag each chip onto its match, or tap a chip and then tap where it goes. Check marks every chip and explains where it belongs and why. A tapped chip in a box returns to the tray.</p>
    <div class="pucard"><div class="purow">${SETS.map(x => `<button type="button" class="chip" aria-pressed="${PR.set === x.id}" data-pset="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div></div>
    <div class="pucard"><div class="purow pusplit"><b>${esc(S0.name)}</b><span class="meta">${S0.bins ? 'several chips can share a box' : 'one chip per box'}${best ? ` · best ${esc(best)}` : ''}</span></div>
    <div class="ptray" id="ptray" aria-label="Chips to place">${tray.map(chip).join('') || '<span class="meta">All placed. Check.</span>'}</div>
    <div class="pgrid">${targets.map(t => `<div class="ptarget" data-pt="${esc(t)}" role="button" tabindex="0"><div class="pl">${esc(t)}</div><div class="pin">${PR.round.filter(p => PR.placed[p[0]] === t).map(chip).join('')}</div></div>`).join('')}</div>
    <div class="purow" style="margin-top:10px">${PR.result ? `<button type="button" class="btn" id="pretry">Retry the wrong ones</button>` : `<button type="button" class="btn" id="pcheck">Check</button>`}<button type="button" class="btn ghost" id="pnew">New round</button><span class="meta" id="pscore" aria-live="polite">${PR.result ? `${Object.values(PR.result).filter(Boolean).length} of ${PR.round.length} right` : `${Object.keys(PR.placed).length} of ${PR.round.length} placed`}</span></div>`;
  if(PR.result){
    // every chip: where it went, where it belongs, and why; wrong and unplaced ones first
    const rows = PR.round.slice().sort((a, b) => (PR.result[a[0]] ? 1 : 0) - (PR.result[b[0]] ? 1 : 0));
    h += `<div class="pfb">${rows.map(p => { const ok = PR.result[p[0]], at = PR.placed[p[0]];
      return `<div class="pfbr ${ok ? 'ok' : 'bad'}"><div><b>${ok ? '✓' : '✗'} ${esc(p[0])}</b> ${ok ? `→ ${esc(p[1])}` : at ? `was put under “${esc(at)}”; it belongs under <b>${esc(p[1])}</b>` : `was not placed; it belongs under <b>${esc(p[1])}</b>`}</div>${p[2] ? `<div class="sub pusub">${esc(p[2])}</div>` : ''}</div>`; }).join('')}</div>`;
  }
  h += S0.cite ? `<p class="sub pusrc">Sources: ${esc(S0.cite)}.</p></div>` : '</div>';
  el.innerHTML = h;
  el.querySelectorAll('[data-pset]').forEach(b => b.onclick = () => { PR.set = b.dataset.pset; PR.round = []; vPair(); });
  el.querySelector('#pnew').onclick = () => { PR.round = []; vPair(); };
  const pc = el.querySelector('#pcheck'); if(pc) pc.onclick = pairCheck;
  const prt = el.querySelector('#pretry'); if(prt) prt.onclick = () => { PR.round.forEach(p => { if(!PR.result[p[0]]) delete PR.placed[p[0]]; }); PR.result = null; vPair(); };
  pairWire(el);
}
function pairPlace(name, target){   // target: a box label, or null for the tray
  if(target){ if(!setOf(PR.set).bins){ for(const k of Object.keys(PR.placed)) if(PR.placed[k] === target) delete PR.placed[k]; } PR.placed[name] = target; }
  else delete PR.placed[name];
  PR.sel = null; PR.result = null; vPair();
}
function pairCheck(){
  const res = {}; PR.round.forEach(p => { res[p[0]] = PR.placed[p[0]] === p[1]; });
  const right = Object.values(res).filter(Boolean).length;
  PR.result = res;   // placements stay as they are, so the explanation sits next to the mistake
  const k = 'pair:' + PR.set, b = bestOf(k);
  if(!b || +b.split('/')[0] < right){ PD().best[k] = `${right}/${PR.round.length}`; save(); }
  vPair();
}
function pairWire(view){
  let drag = null;
  view.querySelectorAll('.pchip').forEach(c => {
    c.addEventListener('pointerdown', e => { drag = {name: c.dataset.pc, x: e.clientX, y: e.clientY, moved: false, ghost: null, el: c}; try { c.setPointerCapture(e.pointerId); } catch(_){} });
    c.addEventListener('pointermove', e => {
      if(!drag || drag.el !== c) return;
      if(!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      if(!drag.ghost){ drag.moved = true; const g = c.cloneNode(true); g.className = 'pchip pghost'; document.body.appendChild(g); drag.ghost = g; c.classList.add('lift'); }
      drag.ghost.style.left = (e.clientX - 20) + 'px'; drag.ghost.style.top = (e.clientY - 18) + 'px';
      view.querySelectorAll('.ptarget.over').forEach(t => t.classList.remove('over'));
      const under = document.elementFromPoint(e.clientX, e.clientY), t = under && under.closest('.ptarget'); if(t) t.classList.add('over');
    });
    const end = e => {
      if(!drag || drag.el !== c) return; const d = drag; drag = null;
      if(d.ghost) d.ghost.remove(); c.classList.remove('lift');
      if(d.moved){ const under = document.elementFromPoint(e.clientX, e.clientY), t = under && under.closest('.ptarget'), tray = under && under.closest('#ptray');
        if(t) pairPlace(d.name, t.dataset.pt); else if(tray) pairPlace(d.name, null); else vPair(); return; }
      // a tap: in a box the chip returns to the tray; in the tray it is selected (or unselected)
      if(PR.placed[d.name]) pairPlace(d.name, null); else { PR.sel = PR.sel === d.name ? null : d.name; vPair(); }
    };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  });
  view.querySelectorAll('.ptarget').forEach(t => {
    const go = () => { if(PR.sel) pairPlace(PR.sel, t.dataset.pt); };
    t.addEventListener('click', e => { if(!e.target.closest('.pchip')) go(); });
    t.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
  });
}

/* ==================== Table recall ==================== */
const filled = v => Array.isArray(v) ? v.length > 0 && v.every(x => typeof x === 'string' && x !== '') : typeof v === 'string' && v !== '';
const cellText = v => Array.isArray(v) ? v.join(' · ') : String(v);
/* the items of one mode: {id, ask, ans, row, i} */
function items(t, m){
  const asks = [].concat(m.ask), out = [];
  for(const r of t.rows){
    const cells = asks.map(k => r[k]).concat([r[m.answer]]);
    if(!cells.every(filled)) continue;
    const list = cells.find(Array.isArray), n = list ? list.length : 1;
    for(let i = 0; i < n; i++){
      const at = c => Array.isArray(c) ? c[i] : c;
      out.push({id: list ? r.id + ':' + i : r.id, ask: asks.map(k => at(r[k])).join(' · '), ans: at(r[m.answer]), row: r, i});
    }
  }
  return out;
}
/* the answers offered: the item's own, its row's alts, then other items' answers (same `near` first),
   none from a row with the same `distinct` value, no answer twice */
function options(t, m, it, all){
  const n = m.options || 5, seen = new Set([it.ans]), out = [it.ans];
  const add = a => { if(out.length < n && filled(a) && !seen.has(a)){ seen.add(a); out.push(a); } };
  if(m.alts) [].concat(it.row[m.alts] || []).forEach(add);
  let pool = all.filter(x => x.id !== it.id);
  if(m.distinct) pool = pool.filter(x => x.row[m.distinct] !== it.row[m.distinct]);
  const near = m.near ? shuffle(pool.filter(x => x.row[m.near] === it.row[m.near])) : [];
  const far = shuffle(pool.filter(x => !near.includes(x)));
  near.concat(far).forEach(x => add(x.ans));
  return shuffle(out);
}
/* a tap within this many ms of a card being drawn is taken as the end of the tap before
   it, not as an answer or a skip (Intro to Pharmacology's ptCheck and its Skip button) */
const GUARD = 350;
const TS = {};   // per table: {mode, queue, i, opts, pick, result, right, redo, round, shown, cover}
const stOf = t => TS[t.id] || (TS[t.id] = {mode: t.modes[0].id, queue: [], i: 0, opts: null, pick: null, result: null, right: 0, redo: [], round: 1, shown: {}, cover: null});
const modeOf = (t, S) => t.modes.find(m => m.id === S.mode);
const key = (t, S) => t.id + ':' + S.mode;
function tStart(t, ids){
  const S = stOf(t), all = items(t, modeOf(t, S)), miss = new Set(ids || missOf(key(t, S)));
  const first = shuffle(all.filter(x => miss.has(x.id))), rest = ids ? [] : shuffle(all.filter(x => !miss.has(x.id)));
  Object.assign(S, {queue: first.concat(rest), i: 0, opts: null, pick: null, result: null, right: 0, redo: [], round: ids ? S.round + 1 : 1});
}
function rowHTML(t, r){
  return `<b>${esc(cellText(r[t.name]))}</b>` + t.columns.filter(([k]) => filled(r[k])).map(([k, l]) => `<div class="sub pusub"><span class="meta">${esc(l)}:</span> ${esc(cellText(r[k]))}</div>`).join('');
}
function coverHTML(t, S){
  const covers = t.covers && t.covers.length ? t.covers : [['all', 'Cover every cell', t.columns.map(c => c[0])]];
  const cv = covers.find(c => c[0] === S.cover) || covers[0], hid = new Set(cv[2]);
  const cell = (k, txt) => hid.has(k.split('|')[1]) && !S.shown[k] ? `<button type="button" class="chip" data-ptshow="${esc(k)}">Show</button>` : esc(txt);
  return `<div class="pucard"><div class="purow">${covers.map(c => `<button type="button" class="chip" aria-pressed="${c === cv}" data-ptcover="${esc(c[0])}">${esc(c[1])}</button>`).join('')}</div>
    <div class="purow" style="margin-top:6px"><button type="button" class="btn ghost" data-pthide>Hide again</button><button type="button" class="btn ghost" data-ptshowall>Show all</button></div></div>` +
    t.rows.map(r => `<div class="pucard"><b>${esc(cellText(r[t.name]))}</b>${t.columns.filter(([k]) => filled(r[k])).map(([k, l]) =>
      `<div class="pufld"><div class="meta">${esc(l)}</div><div>${cell(r.id + '|' + k, cellText(r[k]))}</div></div>`).join('')}</div>`).join('');
}
function vTable(t){
  const el = pane(tabOf(t)); if(!el) return;
  const S = stOf(t);
  let h = `<h2>${esc(t.title || t.tab)}</h2>${t.intro ? `<p class="sub">${esc(t.intro)}</p>` : ''}
    <div class="pucard"><div class="purow">${t.modes.map(m => `<button type="button" class="chip" aria-pressed="${S.mode === m.id}" data-ptmode="${esc(m.id)}">${esc(m.label)}</button>`).join('')}${t.cover === false ? '' : `<button type="button" class="chip" aria-pressed="${S.mode === '#cover'}" data-ptmode="#cover">Cover and reveal</button>`}</div></div>`;
  if(S.mode === '#cover') h += coverHTML(t, S);
  else {
    const m = modeOf(t, S);
    if(!S.queue.length) tStart(t);
    const it = S.queue[S.i], total = S.queue.length, best = bestOf(key(t, S));
    if(!S.opts) S.opts = options(t, m, it, items(t, m));
    h += `<div class="pucard rxcard"><div class="meta">${S.round > 1 ? `redo round ${S.round} · ` : ''}${Math.min(S.i + 1, total)} of ${total} · ${S.right} right${S.redo.length ? ` · ${S.redo.length} to redo` : ''}${best ? ` · best ${esc(best)}` : ''}</div>
      <div class="rxdrug">${esc(it.ask)}</div><div class="rxq">${esc(m.prompt || '')}</div>
      <div class="rxopts">${S.opts.map((o, n) => `<button type="button" class="rxopt ${S.result ? (o === it.ans ? 'ok' : S.pick === n ? 'bad' : '') : ''}" data-ptans="${n}" ${S.result ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      <div class="purow" style="margin-top:10px">${S.result ? `<button type="button" class="btn" data-ptnext>${S.i + 1 < total ? 'Next' : S.redo.length ? `Redo the ${S.redo.length} missed` : 'New round'}</button>` : ''}<button type="button" class="btn ghost" data-ptskip>${S.result ? 'Start over' : 'Skip'}</button></div>`;
    if(S.result) h += `<div class="pfb"><div class="pfbr ${S.result.ok ? 'ok' : 'bad'}">${S.result.ok ? '✓' : '✗'} ${rowHTML(t, it.row)}${S.result.ok ? '' : `<div class="pusub">You said: ${esc(S.opts[S.pick])}</div>`}</div></div>`;
    h += `</div>`;
  }
  if(t.cite) h += `<p class="sub pusrc">Source: ${esc(t.cite)}.</p>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-ptmode]').forEach(b => b.onclick = () => { if(S.mode === b.dataset.ptmode) return; S.mode = b.dataset.ptmode; S.queue = []; S.opts = null; vTable(t); });
  el.querySelectorAll('[data-ptans]').forEach(b => b.onclick = () => tCheck(t, +b.dataset.ptans));
  el.querySelectorAll('[data-ptshow]').forEach(b => b.onclick = () => { S.shown[b.dataset.ptshow] = true; vTable(t); });
  el.querySelectorAll('[data-ptcover]').forEach(b => b.onclick = () => { S.cover = b.dataset.ptcover; S.shown = {}; vTable(t); });
  const hd = el.querySelector('[data-pthide]'); if(hd) hd.onclick = () => { S.shown = {}; vTable(t); };
  const sa = el.querySelector('[data-ptshowall]'); if(sa) sa.onclick = () => { el.querySelectorAll('[data-ptshow]').forEach(b => { S.shown[b.dataset.ptshow] = true; }); vTable(t); };
  S.t0 = Date.now();
  const nx = el.querySelector('[data-ptnext]'); if(nx){ nx.onclick = e => { if(e.detail > 1) return; tAdvance(t); }; try { nx.focus({preventScroll: true}); } catch(_){} }
  const sk = el.querySelector('[data-ptskip]'); if(sk) sk.onclick = () => {
    if(Date.now() - S.t0 < GUARD) return;   // the second tap of a double tap on Next lands here
    if(S.result){ if(confirm('Start over? This round and its missed list are cleared.')){ S.queue = []; S.opts = null; vTable(t); } }
    else { S.redo.push(S.queue[S.i]); tAdvance(t); } };
}
function tCheck(t, n){
  const S = stOf(t);
  if(S.result || Date.now() - (S.t0 || 0) < GUARD) return;
  const it = S.queue[S.i]; S.pick = n; const ok = S.opts[n] === it.ans;
  S.result = {ok}; if(ok) S.right++; else S.redo.push(it);
  vTable(t);
}
function tAdvance(t){
  const S = stOf(t);
  S.opts = null; S.pick = null; S.result = null;
  if(S.i + 1 < S.queue.length){ S.i++; vTable(t); return; }
  // round over: keep the best first-round score, remember the misses for next time, then redo them or start fresh
  const k = key(t, S), b = bestOf(k), P = PD();
  if(S.round === 1 && (!b || frac(b) < S.right / S.queue.length)) P.best[k] = `${S.right}/${S.queue.length}`;
  P.miss[k] = [...new Set(S.redo.map(x => x.id))];
  save();
  if(S.redo.length) tStart(t, P.miss[k]); else tStart(t);
  vTable(t);
}
document.addEventListener('keydown', e => {
  if(e.key !== 'Enter' || e.target.closest('button, input, select, textarea, [role="button"]')) return;
  const t = TABLES.find(x => typeof VIEW !== 'undefined' && VIEW === tabOf(x));
  if(!t || !FX.on(X.name)) return;
  const b = pane(tabOf(t)).querySelector('[data-ptnext]'); if(b) b.click();
});

/* ---------- the tabs ---------- */
if(SETS.length) X.tab({id: PAIR_TAB, label: OPT.pairLabel, before: OPT.before, render: () => vPair()});
TABLES.forEach(t => X.tab({id: tabOf(t), label: t.tab, before: OPT.before, render: () => vTable(t)}));
X.api({items, options, tabOf, state: id => TS[id] || null, pair: () => PR, vPair, vTable: id => vTable(TABLES.find(t => t.id === id)), pairCheck, pairPlace});
