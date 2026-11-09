/* ==========================================================================
   DRUG LIST: A TABLE PER PAGE, GROUP CHIPS, SEARCH (feature module drug-list-tab v2)
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
     ketorolac)") is shown only on that drug's row (dltOwnParts, below; a
     heuristic tuned on BDK's data, see module.json detailOwnField); a
     qualified section that says "See above" shows the shared texts, as BDK's
     resolveSeeAbove (lines 331-347) does (dltShared, dltParts);
   - the chosen group and view last for the visit only (in memory): nothing is
     written to localStorage, sessionStorage, IndexedDB or the progress (DB);
   - the page-image view is offered only when every table gives an `image`;
   - recall mode, from DEENT src/druglist_ui.js at 0281922 (cards there, table
     rows here): DEENT's state recall/showCls and its memory-only revealed and
     typed (lines 31-32) are DLR; its open rule (160) is dltOpen; the hiding
     (163-164, 174) is dltCell, which draws a hidden cell empty but for a
     visually hidden "hidden" so the table keeps its shape and no hidden text is
     in the page until the row is revealed; the writing box and Reveal / Hide
     again button with aria-expanded and aria-controls (168-173; style 70-71) go
     in a row of their own under the drug row, because a cell of the 640 px table
     is too narrow to write in and the row spans the table as the detail row
     does; the detail row is filled only once the row is revealed (174), and a
     tap on the row opens nothing in recall mode; the chips Recall mode, Show
     class, Reveal all shown and Hide all (203-206) and their handlers (256-259)
     are as DEENT's, Reveal all shown taking the rows the group and the search
     show; the note (209) is adapted to the table; Reveal redraws one drug and
     keeps the focus (248-253); what is typed is kept for the visit (236).
     Differences: DEENT opens in recall mode, the kit only when the option
     recallDefault is true; which fields stay visible is the option recallShow
     (BDK: generic, brand) and Show class shows the option recallClassField
     (BDK: category; empty, no chip); the box's label is the option recallPrompt,
     a neutral wording adapted from DEENT's "Write the target or mechanism
     first"; the Recall mode and Show class chips keep the search, as DEENT's do,
     while a group chip clears it, as BDK's does; in recall mode the search looks
     only in recallShow and recallClassField, as DEENT's search (findText, line
     99: name, other names, brands, class) does, and with recall off in
     searchFields, as BDK's does; recall mode draws the table only: the Table /
     page-image choice is hidden while it is on, and the view chosen before
     comes back when it is turned off; in recall mode drug rows take no focus
     and no pointer cursor, since Reveal opens them. DEENT's Flashcards (flash, fi) are not here (queue item 16);
   - each column heading carries data-field="<field>", the hook the module
     field-colours colours (BDK marks its two coloured headings th.k-cat and
     th.k-ind, app.js line 2598);
   - v2 (2026-11-09, queue item 23, drug-list-persistent-outcomes; Louis: develop
     and test, the pull request goes to him before any merge or any course switches
     it on): ratings kept in the profile's progress. With the option recallFields
     ([field, name] pairs; empty, the default: v1's recall mode, nothing stored),
     recall mode asks for one field at a time ("Ask for", DEENT's Recall field
     st.rfield, src/druglist_ui.js at b747e49); once a row is revealed, Forgot /
     Partly / Knew with DEENT's criteria (lines 117-118, rateBlock 415-422) rate
     that fact, `<drug id>:<field>`. DEENT keeps its ratings for the visit only
     (events, line 98-99; note(), 424-428); here they go into the progress as
     DB.drugs = {v: 1, ev: [{f: fact id, r: 'forgot'|'partly'|'knew', at: ms}]},
     the equation-drill pattern (a module's own part: Reset, profiles, Export
     and Import carry it as they carry DB.eq). A new rating of the same opening
     replaces the earlier one, as DEENT's note() does with its token; a new
     opening (Hide again, then Reveal) is a new rating. Nothing typed is kept,
     no answer is recorded (record() is never called) and no bank question is
     changed. A rating never counts as a bank answer, so nothing is counted
     twice: the line under each row shows the recall ratings from DB.drugs and,
     apart from them, the bank questions that test the fact (the course's
     optional DRUG_FACTS, {question id: [fact ids]}, DEENT drugfacts.js MAP
     shape) with DEENT's status words (drugfacts.js status(), lines 126-141),
     read from DB.answers only. "Not yet Knew" shows the rows whose fact's last
     rating is not Knew. The drug id is a slug of the row's option idField
     (default generic; DEENT's cards: id); the build refuses two rows with one id;
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
function dltOwnParts(t, i){
  const row = t.rows[i], {lead, parts} = dltSplit(row[OPT.detailField]);
  const own = OPT.detailOwnField;
  if(!own) return {lead, parts};
  const firsts = new Set(t.rows.map(r => dltWords(r[own])[0]).filter(Boolean)), mine = dltWords(row[own]);
  return {lead, parts: parts.filter(p => { const w = dltWords(p.qual); return !w.length || !firsts.has(w[0]) || w.every(x => mine.includes(x)); })};
}
/* BDK resolveSeeAbove (app.js lines 331-347): a qualified section whose text starts with
   the option detailSeeAbove (BDK: "See above"), such as "US Boxed Warnings (all opioid
   analgesics): See above" on pages 25-26, takes the texts of the same section and
   qualifier on every row of every table (the row's own included) that do not start so, gathered in the
   data's order without repeats (BDK's Set per qualifier). Worked out once, from
   DRUG_TABLES, in memory. */
let DLT_SHARED = null;
const dltSeeRe = () => OPT.detailSeeAbove ? new RegExp('^(?:' + OPT.detailSeeAbove + ')', 'i') : null;
function dltShared(){
  if(DLT_SHARED) return DLT_SHARED;
  const re = dltSeeRe(), shared = {};
  if(re) dltTables().forEach(t => (t.rows || []).forEach((r, i) => dltOwnParts(t, i).parts.forEach(p => {
    if(!p.qual || re.test(p.text)) return;
    (shared[p.k + '|' + p.qual] = shared[p.k + '|' + p.qual] || new Set()).add(p.text);
  })));
  return (DLT_SHARED = shared);
}
function dltParts(t, i){
  const {lead, parts} = dltOwnParts(t, i), re = dltSeeRe();
  if(!re) return {lead, parts};
  const shared = dltShared();
  return {lead, parts: parts.flatMap(p => {
    const s = p.qual && re.test(p.text) && shared[p.k + '|' + p.qual];
    return s ? [...s].map(text => Object.assign({}, p, {text, from: p.text})) : [p];
  })};
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

/* ---- recall mode (DEENT src/druglist_ui.js at 0281922, lines 31-32, 160-174, 203-209,
   236, 248-259; its style 70-71): the visit's recall choices, in memory only. DEENT keeps
   `revealed` and `typed` the same way (line 32: "memory only, never stored"). ---- */
const DLR = {recall: !!OPT.recallDefault, showCls: false, revealed: new Set(), typed: {}};
const dltShows = f => (OPT.recallShow || []).includes(f) || (DLR.showCls && OPT.recallClassField && f === OPT.recallClassField);
/* DEENT line 160: a row is open when recall mode is off or the row was revealed */
const dltOpen = ref => !DLR.recall || DLR.revealed.has(ref);
const dltId = ref => ref.replace(':', '-');

/* ---- v2: the ratings kept in the progress (DB.drugs) ---- */
const DLO_ON = Array.isArray(OPT.recallFields) && OPT.recallFields.length > 0;
const DLO_MAX = 2000;          // ratings kept; past it the oldest go (about 60 bytes each)
const DLO_RATE = [['forgot', 'Forgot', 'I could not produce it.'], ['partly', 'Partly', 'I had the idea but missed the key term or one part.'],
  ['knew', 'Knew', 'I wrote the key term without looking.']];     // DEENT src/druglist_ui.js lines 117-118
const DLO_NAME = {forgot: 'Forgot', partly: 'Partly', knew: 'Knew'};
/* the visit's choices (memory only): the field asked, the Not yet Knew filter, and each
   row's rating of its current opening (DEENT's openTok) */
const DLO = {ask: '', notKnew: false, open: {}, db: null};
/* the openings belong to the progress on screen: a profile switch, an Import or Erase my
   history (a new DB) starts them again, so no rating of another profile shows or is replaced */
const dloMine = () => { if(DLO.db !== DB){ DLO.open = {}; DLO.db = DB; } return DLO.open; };
const dloSlug = s => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dloRow = ref => { const [ti, i] = ref.split(':').map(Number); return dltTables()[ti].rows[i]; };
const dloFact = (ref, f) => dloSlug(dloRow(ref)[OPT.idField]) + ':' + f;
const dloName = f => { const e = (OPT.recallFields || []).find(x => x[0] === f); return e ? e[1] : f; };
const dloEvents = () => (DB.drugs && Array.isArray(DB.drugs.ev)) ? DB.drugs.ev : [];
/* the bank questions of each fact, from the course's DRUG_FACTS ({qid: [fact ids]}) */
let DLO_QS = null;
function dloQs(fact){
  if(!DLO_QS){
    DLO_QS = {};
    const M = typeof DRUG_FACTS !== 'undefined' && DRUG_FACTS && typeof DRUG_FACTS === 'object' ? DRUG_FACTS : {};
    for(const [qid, fs] of Object.entries(M)) for(const f of (fs || [])) (DLO_QS[f] = DLO_QS[f] || []).push(qid);
  }
  return DLO_QS[fact] || [];
}
/* DEENT drugfacts.js status() (lines 126-141), on the profile's answers: Not practised,
   Forgot, Right, but unsure, Remembered, Kept on a later day (the device's calendar day) */
/* the day as the core's scheduler counts it (shell.html dayKey: the browser's calendar day,
   YYYY-MM-DD; DEENT's dayOf is the same local day), worked out when read: only `at` is stored */
const dloDay = t => typeof dayKey === 'function' ? dayKey(t) : new Date(t).toISOString().slice(0, 10);
const dloSolid = a => a.result === 'correct' && a.conf !== 'shaky';
function dloBank(qids){
  const set = new Set(qids);
  const at = (DB.answers || []).filter(a => a && set.has(a.qid)).slice().sort((a, b) => a.at - b.at);
  const n = at.length;
  if(!n) return {label: 'Not practised', n};
  const last = at[n - 1];
  if(last.result === 'wrong') return {label: 'Forgot', n};
  if(!dloSolid(last)) return {label: 'Right, but unsure', n};
  let i = n - 1; while(i > 0 && dloSolid(at[i - 1])) i--;
  return {label: at.slice(i, n - 1).some(a => dloDay(a.at) < dloDay(last.at)) ? 'Kept on a later day' : 'Remembered', n};
}
/* the ratings of one fact, with DEENT's "Kept on a later day" (drugfacts.js status(), as the
   DEENT session gave it for ratings on 2026-11-09): the last rating is Knew, and an earlier
   Knew in the unbroken run of Knew ratings that ends with it falls on an earlier day;
   Forgot or Partly breaks the run, and ratings on the same day never count */
function dloRecall(fact){
  const ev = dloEvents().filter(e => e.f === fact).slice().sort((a, b) => a.at - b.at);
  const n = ev.length, last = n ? ev[n - 1] : null;
  let kept = false;
  if(last && last.r === 'knew'){
    let i = n - 1; while(i > 0 && ev[i - 1].r === 'knew') i--;
    kept = ev.slice(i, n - 1).some(e => dloDay(e.at) < dloDay(last.at));
  }
  return {n, last, kept};
}
const dloDate = t => new Date(t).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
function dloStatus(ref){
  const fact = dloFact(ref, DLO.ask), rc = dloRecall(fact), qs = dloQs(fact);
  let out = `<b>${dltText(dloName(DLO.ask))}</b>: ` + (rc.last
    ? `last rated ${dltText(DLO_NAME[rc.last.r])} on ${dltText(dloDate(rc.last.at))} (${rc.n} rating${rc.n === 1 ? '' : 's'}${rc.kept ? '; Kept on a later day' : ''})`
    : 'not rated yet');
  if(qs.length){ const b = dloBank(qs); out += ` · bank question${qs.length === 1 ? '' : 's'}: ${dltText(b.label)}${b.n ? ` (${b.n} answer${b.n === 1 ? '' : 's'})` : ''}`; }
  return `<p class="dlo-status" data-status="${dltText(fact)}">${out}</p>`;
}
/* whether the rating is stored: the stored progress of this profile is this page's progress,
   and the browser did not refuse the write (the core's FAILED); a write that was refused, a
   save another tab or window got in before (the core shows its notice and writes nothing) or
   a save still waiting on its timer is not stored (the review of #92, M1). The stored text is
   compared with what the core writes: progText(DB) where the core has it (a course with a part
   kept outside localStorage, such as #81's ink, writes the progress without that part), else
   JSON.stringify(DB) (the follow-up review of #92) */
function dloStored(){
  try { const k = keyFor(PROFILE), txt = typeof progText === 'function' ? progText(DB) : JSON.stringify(DB);
    return !FAILED.has(k) && localStorage.getItem(k) === txt; } catch(e){ return false; }
}
function dloRateBlock(ref){
  const open = dloMine(), cur = open[ref] ? open[ref].r : '';
  return `<div class="dlo-rate" role="group" aria-label="How well did you recall it?">${DLO_RATE.map(([r, l]) =>
    `<button type="button" class="chip" data-rate="${ref}" data-r="${r}" aria-pressed="${cur === r}">${l}</button>`).join('')}</div>
    <ul class="dlo-crit">${DLO_RATE.map(([, l, c]) => `<li><b>${l}:</b> ${dltText(c)}</li>`).join('')}</ul>
    <p class="dlt-note" data-ratenote${cur ? ` data-saved="${dloStored() ? 1 : 0}"` : ''}>${!cur ? 'Not counted until you choose one.'
      : dloStored() ? 'Saved in this profile\'s progress: ' + DLO_NAME[cur] + '.'
      : 'Not saved: ' + DLO_NAME[cur] + ' is on this page only. The notice on this page about saving says why.'}</p>`;
}
/* a rating of the row's current opening: the first one adds a rating, a later one replaces it */
function dloRate(ref, r){
  if(!DLO_RATE.some(x => x[0] === r) || !DLO.ask) return;
  if(!DB.drugs || !Array.isArray(DB.drugs.ev)) DB.drugs = {v: 1, ev: []};
  const fact = dloFact(ref, DLO.ask), mine = dloMine()[ref];
  const keep = mine && mine.f === fact && DB.drugs.ev.indexOf(mine) >= 0;
  if(keep){ mine.r = r; mine.at = Date.now(); }
  else { const e = {f: fact, r, at: Date.now()}; DB.drugs.ev.push(e); DLO.open[ref] = e; }
  // past the cap the oldest go, by time (an Import or a replaced rating leaves the list out of time order)
  if(DB.drugs.ev.length > DLO_MAX){ DB.drugs.ev.sort((a, b) => a.at - b.at); DB.drugs.ev.splice(0, DB.drugs.ev.length - DLO_MAX); }
  // written at once (the core's saveNow, as on leaving the page), so the note can say whether it was stored
  save(); saveNow();
}
const dloNotKnew = ref => { const l = dloRecall(dloFact(ref, DLO.ask)).last; return !l || l.r !== 'knew'; };

function dltCell(row, c, open){
  const [f, , sub, subLabel] = c;
  // DEENT line 174 draws the answer only when the card is open: a hidden cell holds none of its text
  if(!open && !dltShows(f)) return `<td class="dlt-hid" data-hidden="1"><span class="dlt-vh">hidden</span></td>`;
  const v = row[f];
  // a column's sub-field is its own field: in recall mode it shows only when its row is open or it is shown itself
  return `<td>${dltText(v)}${sub && row[sub] && (open || dltShows(sub)) ? `<div class="act">${dltText(subLabel || '')}${dltText(row[sub])}</div>` : ''}</td>`;
}
/* one drug: its row; in recall mode also the writing box with Reveal (DEENT 168-173) in
   a row under it, and the detail row, filled only once revealed (DEENT 174) */
function dltRowHtml(T, ti, r, i){
  const C = dltCols(), ref = ti + ':' + i, open = dltOpen(ref), id = dltId(ref);
  let h = `<tr data-ref="${ref}" id="dlt-r-${id}"${DLR.recall ? '' : ' tabindex="0"'}>${C.map(c => dltCell(r, c, open)).join('')}</tr>`;
  if(!DLR.recall) return h;
  h += `<tr class="dlt-recall" data-for="${ref}"><td colspan="${C.length}"><div class="detailin">
    <label for="dlt-w-${id}">${dltText(DLO.ask ? 'Write the ' + dloName(DLO.ask).toLowerCase() + ' first (self-check: not graded; what you type is not saved)' : OPT.recallPrompt)}</label>
    <textarea id="dlt-w-${id}" autocomplete="off" autocapitalize="off" data-typed="${ref}">${dltText(DLR.typed[ref] || '')}</textarea>
    <button type="button" class="btn sm${open ? ' ghost' : ''}" data-reveal="${ref}" aria-expanded="${open}" aria-controls="dlt-r-${id} dlt-a-${id}">${open ? 'Hide again' : 'Reveal'}</button>
    ${DLO.ask ? dloStatus(ref) + (open ? dloRateBlock(ref) : '') : ''}</div></td></tr>`;
  h += open ? `<tr class="detail" id="dlt-a-${id}" data-for="${ref}"><td colspan="${C.length}"><div class="detailin">${dltDetail(T[ti], i) || `<p class="dlt-note">${dltText(OPT.noDetail)}</p>`}</div></td></tr>`
            : `<tr class="detail" id="dlt-a-${id}" data-for="${ref}" hidden></tr>`;
  return h;
}
function dltTable(t, ti, rows){
  const C = dltCols(), T = dltTables();
  return `<section class="pagetable" id="${dltAnchor(t)}" data-table="${dltText(t.id)}"><h3 class="pagehead" style="--pc:${dltText(t.color || 'var(--surface)')}">${dltText(t.title)} <span class="ed">${dltText(dltTag(t, t.id))}</span></h3>
    <div class="table-wrap"><table><thead><tr>${C.map(c => `<th data-field="${dltText(c[0])}">${dltText(c[1])}</th>`).join('')}</tr></thead><tbody>
    ${rows.map(([r, i]) => dltRowHtml(T, ti, r, i)).join('')}
    </tbody></table></div>${t.legend ? `<p class="legend">${dltText(t.legend)}</p>` : ''}</section>`;
}

function dltRender(pane, keepTerm){
  dltStart();
  const T = dltTables(), G = dltGroups();
  if(!G[DLT.group]) DLT.group = -1;
  const imgs = dltImages();
  if(!imgs) DLT.view = 'table';
  // recall mode draws the table only: the page images would show what it hides; the
  // view chosen before comes back when recall mode is turned off
  const view = DLR.recall ? 'table' : DLT.view;
  const oldQ = pane.querySelector('[data-q]'), term = keepTerm && oldQ ? oldQ.value : '';
  const shown = DLT.group < 0 ? T : G[DLT.group].tables;
  const chip = (i, label, ids) => `<button class="chip" data-listgroup="${i}" aria-pressed="${DLT.group === i}">${dltText(label)}${ids ? ` <span class="count">${dltText(dltTag(null, ids))}</span>` : ''}</button>`;
  const sortIds = ids => { const a = ids.slice(); if(a.every(x => !isNaN(+x))) a.sort((x, y) => x - y); return a.join(', '); };
  const table = view === 'table';
  pane.innerHTML = `<h2>${dltText(OPT.label)}</h2>
    ${OPT.intro ? `<p class="sub">${dltText(OPT.intro)}</p>` : ''}
    ${G.length ? `<div class="dlt-row listgroup">${chip(-1, DLT_ALL.label)}${G.map((g, i) => chip(i, g.label, g.tables.length > 6 ? '' : sortIds(g.ids))).join('')}</div>` : ''}
    ${imgs && !DLR.recall ? `<div class="seg listview" data-listview><button data-val="table" aria-pressed="${DLT.view === 'table'}">Table</button><button data-val="image" aria-pressed="${DLT.view === 'image'}">${dltText(OPT.imageLabel)}</button></div>` : ''}
    ${`<div class="dlt-row dlt-recallbar"><button type="button" class="chip" data-dl="recall" aria-pressed="${DLR.recall}">Recall mode</button>
      ${DLR.recall ? `${OPT.recallClassField ? `<button type="button" class="chip" data-dl="showcls" aria-pressed="${DLR.showCls}">Show class</button>` : ''}
        <button type="button" class="chip" data-dl="revealall">Reveal all shown</button>
        <button type="button" class="chip" data-dl="hideall">Hide all</button>
        ${DLO_ON ? `<label class="dlo-ask">Ask for <select data-dl="ask"><option value="">Every hidden field</option>${OPT.recallFields.map(([f, n]) =>
          `<option value="${dltText(f)}"${DLO.ask === f ? ' selected' : ''}>${dltText(n)}</option>`).join('')}</select></label>
          ${DLO.ask ? `<button type="button" class="chip" data-dl="notknew" aria-pressed="${DLO.notKnew}">Not yet Knew</button>` : ''}` : ''}` : ''}</div>`}
    ${DLR.recall ? `<p class="dlt-self" data-recallnote>Recall mode: each row shows the drug only. Write what you recall, then Reveal and compare. This is a self-check: what you type is not graded and not saved, and it is gone when the page reloads.${DLO.ask ? ' After Reveal, rate how well you recalled the ' + dltText(dloName(DLO.ask).toLowerCase()) + ': Forgot, Partly or Knew. The ratings are saved in this profile\'s progress (Export progress includes them; Erase my history clears them) and never count as answers to the bank\'s questions.' : ''} The search looks only in the fields shown${OPT.recallClassField ? ' and in the class, so searching by class shows which drugs are in that class' : ''}.</p>` : ''}
    <div class="jump">${shown.map(t => `<a href="#${dltAnchor(t)}" class="pchip" style="--pc:${dltText(t.color || 'var(--surface)')}">${dltText(t.id)}</a>`).join('')}</div>
    ${table ? `<input class="search" data-q type="search" placeholder="${dltText(DLR.recall ? OPT.recallPlaceholder : OPT.placeholder)}" aria-label="Search">${OPT.rowNote && !DLR.recall ? `<p class="dlt-note">${dltText(OPT.rowNote)}</p>` : ''}`
      : '<p class="dlt-note">The pages as they appear in the PDF. Pinch to zoom, or tap a page to open it full size.</p>'}
    <div data-body></div>`;
  pane.querySelectorAll('[data-listgroup]').forEach(b => b.onclick = () => { DLT.group = +b.dataset.listgroup; dltRender(pane); });
  pane.querySelectorAll('[data-listview] button').forEach(b => b.onclick = () => { DLT.view = b.dataset.val; dltRender(pane); });
  pane.querySelectorAll('[data-dl="recall"]').forEach(b => b.onclick = () => { DLR.recall = !DLR.recall; dltRender(pane, true); });
  const body = pane.querySelector('[data-body]');
  if(!table){
    body.innerHTML = shown.map(t => {
      const [w, h] = Array.isArray(t.imageSize) ? t.imageSize : [1636, 1200];
      return `<section class="pagetable" id="${dltAnchor(t)}" data-table="${dltText(t.id)}"><h3 class="pagehead" style="--pc:${dltText(t.color || 'var(--surface)')}">${dltText(t.title)} <span class="ed">${dltText(dltTag(t, t.id))}</span></h3>
        <a class="pdfpage" href="${dltText(t.image)}" target="_blank" rel="noopener"><img src="${dltText(t.image)}" width="${+w}" height="${+h}" loading="lazy" alt="${dltText(OPT.imageLabel + ' ' + dltTag(t, t.id) + ': ' + t.title)}"></a></section>`;
    }).join('');
    return;
  }
  // DEENT 256-257: the recall and Show class chips redraw the pane, keeping the search
  pane.querySelectorAll('[data-dl="showcls"]').forEach(b => b.onclick = () => { DLR.showCls = !DLR.showCls; dltRender(pane, true); });
  // DEENT 258: every row shown now (after the group and the search); 259: every row
  pane.querySelectorAll('[data-dl="revealall"]').forEach(b => b.onclick = () => { body.querySelectorAll('tr[data-ref]').forEach(tr => { if(!DLR.revealed.has(tr.dataset.ref)){ DLR.revealed.add(tr.dataset.ref); delete DLO.open[tr.dataset.ref]; } }); draw(input.value); });
  pane.querySelectorAll('[data-dl="hideall"]').forEach(b => b.onclick = () => { DLR.revealed.clear(); draw(input.value); });
  pane.querySelectorAll('[data-dl="ask"]').forEach(s => s.onchange = () => { DLO.ask = s.value; DLO.open = {}; if(!DLO.ask) DLO.notKnew = false; dltRender(pane, true); });
  pane.querySelectorAll('[data-dl="notknew"]').forEach(b => b.onclick = () => { DLO.notKnew = !DLO.notKnew; dltRender(pane, true); });
  // DEENT's search (findText, line 99) looks in the name, other names, brands and class:
  // in recall mode the search looks only in recallShow and recallClassField
  const fields = DLR.recall ? [...new Set((OPT.recallShow || []).concat(OPT.recallClassField ? [OPT.recallClassField] : []))] : OPT.searchFields;
  const draw = term => {
    const tq = term.trim().toLowerCase();
    let html = '';
    for(const t of (tq ? T : shown)){     // a search looks at every table, not only the chosen group's
      const ti = T.indexOf(t);
      const rows = (t.rows || []).map((r, i) => [r, i]).filter(([r]) => !tq || fields.some(f => String(r[f] == null ? '' : r[f]).toLowerCase().includes(tq)))
        .filter(([, i]) => !(DLR.recall && DLO.ask && DLO.notKnew) || dloNotKnew(ti + ':' + i));
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
  /* DEENT 248-253: Reveal / Hide again redraws that one drug and puts the focus back on its button */
  const reveal = ref => {
    if(DLR.revealed.has(ref)) DLR.revealed.delete(ref); else DLR.revealed.add(ref);
    delete DLO.open[ref];                 // a new opening is a new rating (DEENT's openTok)
    redraw(ref, '[data-reveal="' + ref + '"]');
  };
  const redraw = (ref, focus) => {
    const tr = body.querySelector(`tr[data-ref="${ref}"]`); if(!tr) return;
    body.querySelectorAll(`tr[data-for="${ref}"]`).forEach(x => x.remove());
    const [ti, i] = ref.split(':').map(Number);
    tr.insertAdjacentHTML('afterend', dltRowHtml(T, ti, T[ti].rows[i], i));
    tr.remove();
    const nb = body.querySelector(focus); if(nb) nb.focus();
  };
  body.onclick = e => {
    const rb = e.target.closest('[data-reveal]');
    if(rb) return reveal(rb.dataset.reveal);
    const kb = e.target.closest('[data-rate]');
    if(kb){ dloRate(kb.dataset.rate, kb.dataset.r); return redraw(kb.dataset.rate, `[data-rate="${kb.dataset.rate}"][data-r="${kb.dataset.r}"]`); }
    if(DLR.recall) return;            // in recall mode Reveal opens a row
    const tr = e.target.closest('tr[data-ref]'); if(tr && !e.target.closest('button')) toggleRow(tr);
  };
  body.onkeydown = e => { if(DLR.recall) return; const tr = e.target.closest('tr[data-ref]'); if(tr && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); toggleRow(tr); } };
  // DEENT 236: what is typed is kept for the visit, so a redraw (group, search) puts it back
  body.oninput = e => { const t = e.target; if(t.dataset && t.dataset.typed) DLR.typed[t.dataset.typed] = t.value; };
  const input = pane.querySelector('[data-q]');
  input.value = term;
  input.oninput = () => draw(input.value);
  draw(term);
}

X.tab({id: OPT.tab, label: OPT.label, before: OPT.before, render: pane => dltRender(pane)});
X.api({split: dltSplit, parts: dltParts, groups: dltGroups, fact: dloFact, bank: dloBank, stored: dloStored,
  state: () => ({group: DLT.group, view: DLT.view, recall: DLR.recall, showCls: DLR.showCls, revealed: [...DLR.revealed], ask: DLO.ask, notKnew: DLO.notKnew})});
