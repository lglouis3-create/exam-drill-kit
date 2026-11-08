/* ==========================================================================
   DRUG LIST: A TABLE PER PAGE, GROUP CHIPS, SEARCH (feature module drug-list-tab v1)
   ==========================================================================
   Ported from BDK assets/app.js at 05c36c3: the Drug list (viewBrowse, lines
   2553-2618), its quiz chips (QUIZZES, line 42), the essential-knowledge box
   (ekHtml, lines 882-899) and its styles (assets/style.css). The code below
   follows that code; what changed for the kit:
   - the data is the course's DRUG_TABLES, in a data file listed in course.js
     `files`: [{id, title, short?, legend?, color?, image?, imageSize?, rows}],
     one table per page or section, each row an object of fields;
   - the columns, the searched fields, the detail field, the groups and the
     group the tab opens on are options (module.json); BDK's are in this
     module's test;
   - the group the tab opens on is the option `defaultGroup` (a group label;
     empty: all tables). BDK opens on its next quiz (currentQuiz, line 1381),
     which reads the student's stored lab day; that rule is not ported;
   - the detail row shows the detail field split at its section labels
     (option `detailSections`; BDK: Key Side Effects, US Boxed Warning(s),
     Other Notes, each with an optional "(qualifier)"). BDK builds its box from
     its flashcards (lines 281, 316-322), which split each section into items and
     rewrite them; the kit's data has no cards, so each section is shown as the
     text the list prints, one entry per label, its qualifier marked as BDK
     marks it. BDK's gray "shared by every drug in this class" marking needs
     those items and is not ported;
     a section qualified with another drug of the same table ("(only for
     ketorolac)") is shown only on that drug's row (dltParts, below);
   - the chosen group and view last for the visit only (in memory): nothing is
     written to localStorage, sessionStorage, IndexedDB or the progress (DB);
   - the page-image view is offered only when every table gives an `image`;
   - left out: saved personal lists ("My drug lists"), the "Compare the N drugs
     in this class" button (compare-tab), Quizlet download files, the glossary
     pop-ups, the "· next" chip mark (date logic).
   ========================================================================== */
const DLT_ALL = {label: 'All pages'};
const dltText = s => esc(s == null ? '' : String(s));
const dltTables = () => (typeof DRUG_TABLES !== 'undefined' && Array.isArray(DRUG_TABLES)) ? DRUG_TABLES : [];
const dltCols = () => OPT.columns;
const dltTag = (t, id) => String(OPT.headTag).replace('{id}', id).replace('{short}', t && t.short != null ? t.short : id);
const dltAnchor = t => 'dlt-t-' + String(t.id).replace(/[^A-Za-z0-9_-]/g, '_');
/* each group with its tables resolved, in the data's order */
function dltGroups(){
  const T = dltTables();
  return (OPT.groups || []).map(g => {
    const ids = g.tables === 'all' ? T.map(t => String(t.id)) : (g.tables || []).map(String);
    const want = new Set(ids);
    return {label: g.label, ids, tables: T.filter(t => want.has(String(t.id)))};
  });
}
/* the visit's choices, in memory only */
const DLT = {group: null, view: 'table'};
function dltStart(){
  if(DLT.group !== null) return;
  const G = dltGroups(), at = OPT.defaultGroup ? G.findIndex(g => g.label === OPT.defaultGroup) : -1;
  DLT.group = at;
}
const dltImages = () => { const T = dltTables(); return T.length > 0 && T.every(t => typeof t.image === 'string' && t.image); };

/* BDK ekHtml (lines 882-899), on the detail field's own text: each label the
   field holds opens a section; a label's "(qualifier)" is marked as BDK marks it. */
function dltSplit(text){
  const secs = OPT.detailSections || [];
  const s = String(text == null ? '' : text).trim();
  if(!s) return {lead: '', parts: []};
  if(!secs.length) return {lead: s, parts: []};
  const re = new RegExp('(' + secs.map(x => x.label).join('|') + ')\\s*(\\([^)]*\\))?\\s*:', 'gi');
  const hits = [];
  let m;
  while((m = re.exec(s))){
    const k = secs.findIndex(x => new RegExp('^(?:' + x.label + ')$', 'i').test(m[1]));
    hits.push({k, at: m.index, end: re.lastIndex, label: m[1], qual: m[2] ? m[2].slice(1, -1) : ''});
  }
  const parts = hits.map((h, i) => ({k: h.k, label: h.label, qual: h.qual, text: s.slice(h.end, i + 1 < hits.length ? hits[i + 1].at : s.length).trim()}));
  return {lead: hits.length ? s.slice(0, hits[0].at).trim() : s, parts};
}
/* A section whose qualifier names a drug of the same table (the first word of
   another row's detailOwnField, BDK: generic), such as "(only for ketorolac)" in
   a cell the list prints for every NSAID on its page, is shown only on the rows
   whose detailOwnField holds every word of the qualifier ("only for" left out).
   BDK's flashcards give such a section to that drug alone (app.js lines 316-322);
   on BDK's 300 rows this rule gives each row the sections and qualifiers its
   cards give it (features/drug-list-tab/current/test.js, BDK_SECTIONS). */
const dltWords = s => String(s == null ? '' : s).toLowerCase().replace(/^only for\s+/, '').split(/[^a-z0-9]+/).filter(Boolean);
function dltParts(t, i){
  const row = t.rows[i], {lead, parts} = dltSplit(row[OPT.detailField]);
  const own = OPT.detailOwnField;
  if(!own) return {lead, parts};
  const firsts = new Set(t.rows.map(r => dltWords(r[own])[0]).filter(Boolean)), mine = dltWords(row[own]);
  return {lead, parts: parts.filter(p => { const w = dltWords(p.qual); return !w.length || !firsts.has(w[0]) || w.every(x => mine.includes(x)); })};
}
function dltDetail(t, i){
  const {lead, parts} = dltParts(t, i);
  if(!lead && !parts.length) return '';
  const secs = OPT.detailSections || [];
  let out = lead ? `<p class="dlt-lead">${dltText(lead)}</p>` : '';
  secs.forEach((x, k) => {
    const mine = parts.filter(p => p.k === k);
    if(!mine.length) return;
    const plural = mine.length > 1 || mine.some(p => /s$/i.test(p.label));
    const head = String(x.heading).replace('{s}', plural ? 's' : '');
    const li = mine.map(p => `<li>${p.qual ? `<span class="qual">${dltText(p.qual)}</span> ` : ''}${dltText(p.text)}</li>`).join('');
    out += `<div class="eksec${x.warn ? ' bwsec' : ''}" data-sec="${k}"><h4>${x.warn ? '⚠ ' : ''}${dltText(head)}</h4><ul>${li}</ul></div>`;
  });
  return `<div class="ekbox">${out}</div>`;
}

function dltCell(row, c){
  const [f, , sub, subLabel] = c;
  const v = row[f];
  return `<td>${dltText(v)}${sub && row[sub] ? `<div class="act">${dltText(subLabel || '')}${dltText(row[sub])}</div>` : ''}</td>`;
}
function dltTable(t, ti, rows){
  const C = dltCols();
  return `<section class="pagetable" id="${dltAnchor(t)}" data-table="${dltText(t.id)}"><h3 class="pagehead" style="--pc:${dltText(t.color || 'var(--surface)')}">${dltText(t.title)} <span class="ed">${dltText(dltTag(t, t.id))}</span></h3>
    <div class="table-wrap"><table><thead><tr>${C.map(c => `<th>${dltText(c[1])}</th>`).join('')}</tr></thead><tbody>
    ${rows.map(([r, i]) => `<tr data-ref="${ti}:${i}" tabindex="0">${C.map(c => dltCell(r, c)).join('')}</tr>`).join('')}
    </tbody></table></div>${t.legend ? `<p class="legend">${dltText(t.legend)}</p>` : ''}</section>`;
}

function dltRender(pane){
  dltStart();
  const T = dltTables(), G = dltGroups();
  if(!G[DLT.group]) DLT.group = -1;
  const imgs = dltImages();
  if(!imgs) DLT.view = 'table';
  const shown = DLT.group < 0 ? T : G[DLT.group].tables;
  const chip = (i, label, ids) => `<button class="chip" data-listgroup="${i}" aria-pressed="${DLT.group === i}">${dltText(label)}${ids ? ` <span class="count">${dltText(dltTag(null, ids))}</span>` : ''}</button>`;
  const sortIds = ids => { const a = ids.slice(); if(a.every(x => !isNaN(+x))) a.sort((x, y) => x - y); return a.join(', '); };
  pane.innerHTML = `<h2>${dltText(OPT.label)}</h2>
    ${OPT.intro ? `<p class="sub">${dltText(OPT.intro)}</p>` : ''}
    ${G.length ? `<div class="dlt-row listgroup">${chip(-1, DLT_ALL.label)}${G.map((g, i) => chip(i, g.label, g.tables.length > 6 ? '' : sortIds(g.ids))).join('')}</div>` : ''}
    ${imgs ? `<div class="seg listview" data-listview><button data-val="table" aria-pressed="${DLT.view === 'table'}">Table</button><button data-val="image" aria-pressed="${DLT.view === 'image'}">${dltText(OPT.imageLabel)}</button></div>` : ''}
    <div class="jump">${shown.map(t => `<a href="#${dltAnchor(t)}" class="pchip" style="--pc:${dltText(t.color || 'var(--surface)')}">${dltText(t.id)}</a>`).join('')}</div>
    ${DLT.view === 'table' ? `<input class="search" data-q type="search" placeholder="${dltText(OPT.placeholder)}" aria-label="Search">${OPT.rowNote ? `<p class="dlt-note">${dltText(OPT.rowNote)}</p>` : ''}`
      : '<p class="dlt-note">The pages as they appear in the PDF. Pinch to zoom, or tap a page to open it full size.</p>'}
    <div data-body></div>`;
  pane.querySelectorAll('[data-listgroup]').forEach(b => b.onclick = () => { DLT.group = +b.dataset.listgroup; dltRender(pane); });
  pane.querySelectorAll('[data-listview] button').forEach(b => b.onclick = () => { DLT.view = b.dataset.val; dltRender(pane); });
  const body = pane.querySelector('[data-body]');
  if(DLT.view === 'image'){
    body.innerHTML = shown.map(t => {
      const [w, h] = Array.isArray(t.imageSize) ? t.imageSize : [1636, 1200];
      return `<section class="pagetable" id="${dltAnchor(t)}" data-table="${dltText(t.id)}"><h3 class="pagehead" style="--pc:${dltText(t.color || 'var(--surface)')}">${dltText(t.title)} <span class="ed">${dltText(dltTag(t, t.id))}</span></h3>
        <a class="pdfpage" href="${dltText(t.image)}" target="_blank" rel="noopener"><img src="${dltText(t.image)}" width="${+w}" height="${+h}" loading="lazy" alt="${dltText(OPT.imageLabel + ' ' + dltTag(t, t.id) + ': ' + t.title)}"></a></section>`;
    }).join('');
    return;
  }
  const fields = OPT.searchFields;
  const draw = term => {
    const tq = term.trim().toLowerCase();
    let html = '';
    for(const t of (tq ? T : shown)){     // a search looks at every table, not only the chosen group's
      const ti = T.indexOf(t);
      const rows = (t.rows || []).map((r, i) => [r, i]).filter(([r]) => !tq || fields.some(f => String(r[f] == null ? '' : r[f]).toLowerCase().includes(tq)));
      if(!rows.length) continue;
      html += dltTable(t, ti, rows);
    }
    body.innerHTML = (tq && DLT.group >= 0 ? '<p class="dlt-note" data-allnote>Showing matches from all pages.</p>' : '') + (html || '<p class="dlt-note" data-nomatch>No matches</p>');
  };
  const toggleRow = tr => {
    const nxt = tr.nextElementSibling;
    if(nxt && nxt.classList.contains('detail')) return nxt.remove();
    const [ti, i] = tr.dataset.ref.split(':').map(Number);
        tr.insertAdjacentHTML('afterend', `<tr class="detail"><td colspan="${dltCols().length}"><div class="detailin">${dltDetail(T[ti], i) || `<p class="dlt-note">${dltText(OPT.noDetail)}</p>`}</div></td></tr>`);
  };
  body.onclick = e => { const tr = e.target.closest('tr[data-ref]'); if(tr && !e.target.closest('button')) toggleRow(tr); };
  body.onkeydown = e => { const tr = e.target.closest('tr[data-ref]'); if(tr && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); toggleRow(tr); } };
  const input = pane.querySelector('[data-q]');
  input.oninput = () => draw(input.value);
  draw('');
}

X.tab({id: OPT.tab, label: OPT.label, before: OPT.before, render: pane => dltRender(pane)});
X.api({split: dltSplit, parts: dltParts, groups: dltGroups, state: () => ({group: DLT.group, view: DLT.view})});
