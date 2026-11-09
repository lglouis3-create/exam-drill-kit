/* ==========================================================================
   COMPARE: DRUGS SIDE BY SIDE (feature module compare-tab v1)
   ==========================================================================
   Ported from BDK assets/app.js at 05c36c3: viewCompare (lines 2301-2374),
   COMPARE_ROWS (2290-2293), factList (2294-2299), classmates (879) and the
   "Compare the N drugs in this class" button of the Drug list's detail row
   (2611); its styles in assets/style.css (lines 90, 106, 310-323). The code
   below follows that code; what changed for the kit:
   - the drugs are the course's DRUG_TABLES (the data file drug-list-tab
     reads; this module works with drug-list-tab on or off);
   - BDK builds each drug's facts from its flashcards (lines 283-347); the
     kit's data has no cards, so each row's list comes from the table's own
     fields (the option `rows`): a field as one item, a field split at the
     separators a row names (at parentheses' depth 0, as BDK's splitDepth0,
     lines 108-120), or one section of a field split at its labels, with the
     qualifier rule and the "See above" resolution drug-list-tab uses (BDK
     resolveSeeAbove, 331-347). The item texts are the list's own; BDK's
     cards reword them, so a row can hold the same facts in other words. How
     far the kit's lists agree with BDK's is measured in this module's test;
   - items are compared without case and with spaces collapsed (ctMark): the
     list writes one fact as "asthma" for one drug and "Asthma" for another,
     where BDK's cards write both alike;
   - opening Compare with drugs (the Drug list's button) moves the page picker
     to their page; BDK's go('compare', refs) (lines 1250, 2304-2306) keeps the
     picker on the page it had;
   - items are plain text; BDK draws each with gloss(x) (line 2326), its
     glossary links;
   - the table picked and Only differences last for the visit (memory); BDK
     stores them (comparePage, onlyDiff);
   - the tab opens on the option defaultTable (else the first table); BDK
     opens on its next quiz's first page (currentQuiz, a date rule);
   - when drug-list-tab is on, its detail row gets BDK's "Compare the N drugs
     in this class" button (X.rendered on its pane; drug-list-tab unchanged);
   - each row header carries data-field="<field>", so field-colours colours
     it (BDK: th.k-cat, th.k-ind, line 2325);
   - left out: "Learn these N drugs together" (starts Learn, which records
     answers: part 2), "Drugs you have mixed up" (PROGRESS.confusions:
     stored), Compare links from question feedback (no kit view).
   Nothing is stored.
   ========================================================================== */
const CT = {page: null, sel: [], onlyDiff: false};
const ctText = s => esc(s == null ? '' : String(s));
const ctTables = () => (typeof DRUG_TABLES !== 'undefined' && Array.isArray(DRUG_TABLES)) ? DRUG_TABLES : [];
const ctRow = ref => { const [ti, i] = String(ref).split(':').map(Number), t = ctTables()[ti]; return t && t.rows && t.rows[i] ? {t, ti, i, r: t.rows[i]} : null; };
/* BDK splitDepth0 (lines 108-120) */
function ctSplitDepth0(s, sep){
  const out = []; let depth = 0, cur = '';
  for(let i = 0; i < s.length; i++){
    const ch = s[i];
    if(ch === '(') depth++;
    if(ch === ')') depth = Math.max(0, depth - 1);
    if(depth === 0 && s.startsWith(sep, i)){ out.push(cur); cur = ''; i += sep.length - 1; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map(x => x.trim()).filter(Boolean);
}
const ctSplitAll = (s, seps) => (seps || []).reduce((list, sep) => list.flatMap(x => ctSplitDepth0(x, sep)), [String(s == null ? '' : s).trim()].filter(Boolean));
/* a field split at its section labels (drug-list-tab's dltSplit, dltOwnParts, dltShared, dltParts) */
function ctSections(text){
  const secs = OPT.sectionLabels || [], s = String(text == null ? '' : text).trim();
  if(!s || !secs.length) return [];
  const re = new RegExp('(' + secs.join('|') + ')\\s*(\\([^)]*\\))?\\s*:', 'gi'), hits = [];
  let m;
  while((m = re.exec(s))){
    const k = secs.findIndex(x => new RegExp('^(?:' + x + ')$', 'i').test(m[1]));
    hits.push({k, at: m.index, end: re.lastIndex, qual: m[2] ? m[2].slice(1, -1) : ''});
  }
  return hits.map((h, i) => ({k: h.k, qual: h.qual, text: s.slice(h.end, i + 1 < hits.length ? hits[i + 1].at : s.length).trim()}));
}
const ctWords = s => String(s == null ? '' : s).toLowerCase().replace(/^only for\s+/, '').split(/[^a-z0-9]+/).filter(Boolean);
function ctOwnParts(t, i, field){
  const row = t.rows[i], parts = ctSections(row[field]), own = OPT.ownField;
  if(!own) return parts;
  const firsts = new Set(t.rows.map(r => ctWords(r[own])[0]).filter(Boolean)), mine = ctWords(row[own]);
  return parts.filter(p => { const w = ctWords(p.qual); return !w.length || !firsts.has(w[0]) || w.every(x => mine.includes(x)); });
}
const CT_SHARED = {};
const ctSeeRe = () => OPT.seeAbove ? new RegExp('^(?:' + OPT.seeAbove + ')', 'i') : null;
function ctParts(t, i, field){
  const parts = ctOwnParts(t, i, field), re = ctSeeRe();
  if(!re) return parts;
  if(!CT_SHARED[field]){
    const sh = CT_SHARED[field] = {};
    ctTables().forEach(u => (u.rows || []).forEach((r, j) => ctOwnParts(u, j, field).forEach(p => {
      if(!p.qual || re.test(p.text)) return;
      (sh[p.k + '|' + p.qual] = sh[p.k + '|' + p.qual] || new Set()).add(p.text);
    })));
  }
  const sh = CT_SHARED[field];
  return parts.flatMap(p => { const s = p.qual && re.test(p.text) && sh[p.k + '|' + p.qual]; return s ? [...s].map(text => Object.assign({}, p, {text})) : [p]; });
}
/* BDK factList (lines 2294-2299), from the row's own fields */
function ctFacts(ref, def){
  const x = ctRow(ref); if(!x) return [];
  let items;
  if(typeof def.section === 'number' && def.section >= 0)
    items = ctParts(x.t, x.i, def.field).filter(p => p.k === def.section).flatMap(p => ctSplitAll(p.text, def.split).map(it => (p.qual ? `(${p.qual}) ` : '') + it));
  else {
    const v = x.r[def.field];
    items = v == null || String(v).trim() === '' || (def.blank && String(v).trim() === def.blank) ? [] : ctSplitAll(v, def.split);
  }
  return items.length || !def.empty ? items : [def.empty];
}
/* BDK classmates (line 879): same table, same class field */
const ctClassmates = ref => { const x = ctRow(ref), cf = OPT.classField; if(!x || !cf) return [];
  return x.t.rows.map((r, j) => [r, x.ti + ':' + j]).filter(([r]) => r[cf] && r[cf] === x.r[cf]).map(([, ref2]) => ref2); };
/* BDK d.short (lines 297-299): the label without its "(brands)" when the row has brands */
function ctShort(r){
  const label = String(r[OPT.labelField] == null ? '' : r[OPT.labelField]), b = OPT.brandField ? r[OPT.brandField] : '';
  const m = label.match(/^(.*) \(([^()]*(?:\([^()]*\)[^()]*)*)\)$/);
  const blank = (OPT.rows.find(d => d.field === OPT.brandField) || {}).blank;
  return b && b !== blank && m ? m[1] : label;
}
const ctTag = t => String(t.short != null && t.short !== '' ? t.short : t.id);

/* BDK's marking (viewCompare, lines 2323-2324): an item is shared when every drug has it,
   a row is the same when every list holds the same items; compared on a key without case
   and with spaces collapsed, so "asthma" and "Asthma" (page 9) count as one item; each
   item keeps its own text */
const ctKey = x => String(x).toLowerCase().replace(/\s+/g, ' ').trim();
function ctMark(lists){
  const keys = lists.map(l => l.map(ctKey));
  const shared = new Set(keys[0].filter(x => keys.every(l => l.includes(x))));
  const same = keys.every(l => l.length === keys[0].length && l.every(x => shared.has(x)));
  return {shared, same, counts: keys.map(l => l.filter(x => shared.has(x)).length)};
}
function ctRender(pane){
  const T = ctTables();
  if(CT.page === null){ const at = OPT.defaultTable !== '' ? T.findIndex(t => String(t.id) === String(OPT.defaultTable)) : -1; CT.page = at < 0 ? 0 : at; }
  const pick = T[CT.page] || T[0];
  CT.sel = CT.sel.filter(ctRow).slice(0, OPT.max);
  const sel = CT.sel.map(ctRow);
  const cf = OPT.classField, classes = [];
  if(pick && cf) pick.rows.forEach((r, j) => {
    if(!r[cf] || (OPT.classSkip || []).includes(r[cf])) return;
    let g = classes.find(x => x.name === r[cf]);
    if(!g) classes.push(g = {name: r[cf], refs: []});
    g.refs.push(CT.page + ':' + j);
  });
  let table = '';
  if(sel.length >= 2){
    const rows = OPT.rows.map(def => {
      const lists = CT.sel.map(ref => ctFacts(ref, def));
      if(lists.every(l => !l.length)) return '';
      const {shared, same} = ctMark(lists);
      return `<tr class="${same ? 'same' : ''}" data-row="${ctText(def.key)}"><th scope="row" data-field="${ctText(def.field)}">${ctText(def.heading)}${same ? '<span class="ct-samebadge">same</span>' : ''}</th>${lists.map(l =>
        `<td>${l.length ? `<ul>${l.map(x => `<li class="${shared.has(ctKey(x)) ? 'shared' : 'diff'}">${ctText(x)}</li>`).join('')}</ul>` : '<span class="ct-dim">—</span>'}</td>`).join('')}</tr>`;
    }).join('');
    table = `<div class="ct-card" data-side>
      <div class="ct-spread"><h3>Side by side</h3>
        <label class="ct-check"><input type="checkbox" data-onlydiff ${CT.onlyDiff ? 'checked' : ''}> Only differences</label></div>
      <p class="ct-dim"><span class="ct-diffkey">Bold</span> = differs between these drugs · gray = the same for all of them.</p>
      <div class="ct-wrap ct-cmp-wrap${CT.onlyDiff ? ' ct-onlydiff' : ''}"><table class="ct-cmp">
        <thead><tr><th></th>${sel.map((x, k) => `<th scope="col"><span class="ct-pdot" style="--pc:${ctText(x.t.color || 'var(--line)')}" aria-hidden="true"></span>${ctText(x.r[OPT.labelField])}<div class="ct-dim">${ctText(ctTag(x.t))}</div>
          <button class="ct-linkbtn" data-remove="${CT.sel[k]}" aria-label="Remove ${ctText(x.r[OPT.labelField])}">Remove</button></th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody></table></div>
    </div>`;
  }
  const multi = classes.filter(g => g.refs.length > 1);
  pane.innerHTML = `<h2>${ctText(OPT.label)}</h2>
    <p class="sub">Put look-alike drugs side by side to see exactly how they differ.</p>
    ${table}
    ${sel.length === 1 ? `<div class="ct-card" data-one><p>Selected: <span class="ct-pdot" style="--pc:${ctText(sel[0].t.color || 'var(--line)')}" aria-hidden="true"></span><b>${ctText(sel[0].r[OPT.labelField])}</b>. Add at least one more drug.</p></div>` : ''}
    <div class="ct-card">
      <h3>Choose drugs</h3>
      <div class="ct-jump">${T.map((t, k) => `<button class="ct-pchip ct-pagepick${k === CT.page ? ' on' : ''}" style="--pc:${ctText(t.color || 'var(--surface)')}" data-pickpage="${k}" aria-pressed="${k === CT.page}">${ctText(t.id)}</button>`).join('')}</div>
      ${pick ? `<p class="ct-dim" style="margin-top:10px">${ctText(ctTag(pick))} · ${ctText(pick.title)}</p>` : ''}
      ${multi.length ? `<div class="ct-group-label">Whole class</div><div class="ct-row">${multi.map(g =>
        `<button class="chip" data-compare="${g.refs.slice(0, OPT.max).join(',')}">${ctText(g.name)} <span class="count">${g.refs.length}</span></button>`).join('')}</div>` : ''}
      <div class="ct-group-label">One at a time (up to ${OPT.max})</div>
      <div class="ct-row">${pick ? pick.rows.map((r, j) => `<button class="chip" data-toggle="${CT.page}:${j}" aria-pressed="${CT.sel.includes(CT.page + ':' + j)}">${ctText(ctShort(r))}</button>`).join('') : ''}</div>
      ${CT.sel.length ? '<div class="ct-actions"><button class="btn ghost" data-clear>Clear selection</button></div>' : ''}
    </div>`;
  const again = () => ctRender(pane);
  pane.querySelectorAll('[data-pickpage]').forEach(b => b.onclick = () => { CT.page = +b.dataset.pickpage; again(); });
  pane.querySelectorAll('[data-compare]').forEach(b => b.onclick = () => { CT.sel = b.dataset.compare.split(',').filter(ctRow).slice(0, OPT.max); again(); window.scrollTo(0, 0); });
  pane.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
    const r = b.dataset.toggle;
    CT.sel = CT.sel.includes(r) ? CT.sel.filter(x => x !== r) : [...CT.sel, r].slice(-OPT.max);
    again();
  });
  pane.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => { CT.sel = CT.sel.filter(x => x !== b.dataset.remove); again(); });
  const clear = pane.querySelector('[data-clear]');
  if(clear) clear.onclick = () => { CT.sel = []; again(); };
  const od = pane.querySelector('[data-onlydiff]');
  if(od) od.onchange = e => { CT.onlyDiff = e.target.checked; pane.querySelector('.ct-cmp-wrap').classList.toggle('ct-onlydiff', e.target.checked); };
}
/* open Compare with these drugs, on their table (BDK go('compare', refs), line 1250) */
function ctOpen(refs){
  const ok = refs.filter(ctRow).slice(0, OPT.max);
  if(!ok.length) return;
  CT.sel = ok; CT.page = ctRow(ok[0]).ti;
  show(OPT.tab);
}
/* BDK viewBrowse's detail row (line 2611): "Compare the N drugs in this class" when the
   row has classmates on its table, opening Compare with up to max of them */
function ctDecorate(pane){
  pane.querySelectorAll('tr.detail .detailin').forEach(box => {
    if(box.querySelector('[data-ct-compare]')) return;
    const det = box.closest('tr.detail'), ref = det.dataset.for || (det.previousElementSibling && det.previousElementSibling.dataset.ref);
    if(!ref || !ctRow(ref)) return;
    const mates = ctClassmates(ref);
    if(mates.length < 2) return;
    const b = document.createElement('button');
    b.className = 'ct-linkbtn'; b.type = 'button';
    b.setAttribute('data-ct-compare', mates.slice(0, OPT.max).join(','));
    b.textContent = `Compare the ${mates.length} drugs in this class`;
    b.onclick = e => { e.stopPropagation(); ctOpen(b.dataset.ctCompare.split(',')); };
    box.appendChild(b);
  });
}
X.tab({id: OPT.tab, label: OPT.label, before: OPT.before, render: pane => ctRender(pane)});
X.rendered((pane, view) => {
  const d = typeof FX !== 'undefined' && FX.modules().find(m => m.name === 'drug-list-tab' && m.on);
  if(d && view === ((d.options && d.options.tab) || 'drugs')) ctDecorate(pane);
});
X.api({facts: ctFacts, mark: ctMark, classmates: ctClassmates, open: ctOpen, state: () => ({page: CT.page, sel: CT.sel.slice(), onlyDiff: CT.onlyDiff})});
