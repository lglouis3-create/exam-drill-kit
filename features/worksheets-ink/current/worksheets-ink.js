/* ==========================================================================
   WORKSHEETS AND WRITING ON THEM (feature module worksheets-ink v1)
   ==========================================================================
   Ported from Basic-Pharmacokinetics (src/views.js "WORKSHEETS", lines
   5122-5434, and "Write on a worksheet", lines 6040-6322, with its styles in
   src/shell.html lines 787-856 and 899-931, at ac2eb73).

   The course lists the documents its questions come from, in a data file
   listed in course.js `files`:

     const SOURCES = [{id, title, type, module, modules?, date?, key?, note?,
                       drive?: {id}, missing?, chains?: [problem set ids],
                       items: [{q: question id, label: the number the sheet prints}]}];

   `type` is one of daily-practice, in-class, homework, quiz, review, example,
   lecture-slides. `key: 'instructor'` says the document is the professor's
   own solved sheet. `chains` names problem sets of CHAINS (the
   chained-problem-sets module's data) whose parts come from this document.
   The build step (step.js) checks every item and set against the bank and
   writes which document and number each question comes from.

   What it adds:
   - a Worksheets tab: each document under its module, with the problems the
     drill holds from it, a link to the original where the course has one,
     Write on it, and Practice in the drill (the document's problems in the
     sheet's order, as one pass);
   - Write on it: the worksheet over the page, as the professor's problems with
     room to work under each, a drawing layer on the name line and on every
     problem, pen, highlighter and eraser, three colours and three sizes, undo
     and redo, More room under each problem, Pencil only (once a pen touches
     the page a finger scrolls and only the pen writes), Hold to snap (a
     stroke held still at its end becomes a straight line, an ellipse or a
     box), two fingers tapped together undo, Show solutions, Save as PDF
     (the browser's print, with the writing on it) and Clear page;
   - Scratch paper beside the answer box of a calculation question in the
     quiz and on an exam paper: the stem over one tall work area, no
     solutions; a paper's scratch paper is cleared when the next paper's is
     opened;
   - a Settings section that says how much writing is kept and erases it.

   Where the writing is kept: in this profile's progress (DB.ink), so Export
   progress copies it, Import progress brings it back and Erase my history
   removes it, and each profile keeps its own. A stroke is stored in its
   problem's own coordinates, as fractions of the problem's width, rounded to
   4 decimals. The pen's colour, size and the two switches are a choice of
   this device and are kept under their own key (NS + ':ink-prefs').
   ========================================================================== */
const SRC_LIST = typeof SOURCES === 'undefined' || !Array.isArray(SOURCES) ? [] : SOURCES;
const SRC_OF = (DATA && DATA.of) || {};
const SRC_BY = Object.fromEntries(SRC_LIST.map(s => [s.id, s]));
const SRC_TYPE_ONE = {'daily-practice': 'Daily practice sheet', 'in-class': 'In-class activity', homework: 'Homework',
  quiz: 'Quiz', review: 'Review set', example: 'Lecture slides, worked examples', 'lecture-slides': 'Lecture slides'};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const rx = s => (s ? new RegExp(s, 'i') : null);
const ORIGINAL_IDS = rx(OPT.originalIds), CHANGED_IDS = rx(OPT.changedIds);
const DRILL_WORKED = rx(OPT.drillWorked), SPOKEN_ONLY = rx(OPT.spokenOnly), WRITTEN = rx(OPT.writtenWorking);

/* ---- text: formulas set by formulas-in-text when it is on ----------------- */
const FX_MATH = () => FX.api('formulas-in-text');
const rich = s => { const F = FX_MATH(); return F ? F.rich(s) : esc(s).replace(/\{\{frac:([^|}]*)\|([^}]*)\}\}/g, '($1)/($2)'); };
/* A stem is plain text. Blank lines separate paragraphs, and a block whose
   every line holds "a | b" is a data table, its first line the heading. */
function stemHTML(stem){
  return String(stem || '').split(/\n\s*\n/).map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if(lines.length >= 2 && lines.every(l => l.includes('|'))){
      const cells = l => l.split('|').map(c => c.trim());
      return `<div class="cmpwrap"><table class="stemtab"><thead><tr>${cells(lines[0]).map(c => `<th>${rich(c)}</th>`).join('')}</tr></thead>
        <tbody>${lines.slice(1).map(l => `<tr>${cells(l).map(c => `<td>${rich(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    return `<p>${rich(lines.join(' '))}</p>`;
  }).join('');
}

/* ---- modules: the order and the names the course gives them --------------- */
// OPT.modules: [[module value, short name, heading], ...] in teaching order; without it, the order the
// documents first name them in, headed by the value when it is a name ('Module 1') and 'Module <value>' otherwise
const modDefault = m => { const t = /^Module\s+(\S+)$/i.exec(String(m)); return t ? [m, t[1], String(m)] : [m, String(m), typeof m === 'string' && /\D/.test(m) ? m : 'Module ' + m]; };
const MODS = (Array.isArray(OPT.modules) && OPT.modules.length ? OPT.modules
  : [...new Set(SRC_LIST.map(s => s.module))].map(modDefault)).filter(r => Array.isArray(r) && r.length >= 2);
const MOD_ORDER = MODS.map(r => r[0]);
const modRow = m => MODS.find(r => r[0] === m);
const modShort = m => { const r = modRow(m); return r ? String(r[1]) : String(m); };
const modName = m => { const r = modRow(m); return r ? String(r[2] || 'Module ' + r[1]) : 'Module ' + m; };
const srcDate = d => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : ''; };
const driveView = id => `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;
const driveDown = id => `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
const srcMods = s => { const ms = (s.modules && s.modules.length ? s.modules : [s.module]); const o = MOD_ORDER.filter(m => ms.includes(m)); return o.length ? o : [s.module]; };
const srcModSpan = s => { const ms = srcMods(s); return ms.length > 1 ? `Modules ${modShort(ms[0])}–${modShort(ms[ms.length - 1])}` : 'Module ' + modShort(ms[0]); };
// homework, quizzes and reviews span modules: they are listed after the last module they cover, each problem tagged
const SRC_SPANNING = ['homework', 'quiz', 'review'];
const srcSpans = s => SRC_SPANNING.includes(s.type);
const srcHome = s => srcMods(s).reduce((a, m) => MOD_ORDER.indexOf(m) > MOD_ORDER.indexOf(a) ? m : a, srcMods(s)[0]);
const chainList = () => (typeof CHAINS === 'undefined' || !Array.isArray(CHAINS) ? [] : CHAINS);

/* original | changed | '' for a problem set, from its name or its part ids. A
   set named "(changed numbers)" is the drill's re-numbered copy of a problem;
   one named "(original numbers)", or whose parts' ids match OPT.originalIds, is
   the professor's own. */
function setNumbers(c){
  if(/\(changed numbers\)/i.test(c.name || '')) return 'changed';
  if(/\(original numbers\)/i.test(c.name || '') || (ORIGINAL_IDS && (ORIGINAL_IDS.test(c.id)
     || (c.parts.length && c.parts.every(id => ORIGINAL_IDS.test(id)))))) return 'original';
  return '';
}
const srcLabel = id => (SRC_OF[id] || {}).label || '';
/* The worksheet's groups: one per problem set (the parts that come from this
   document, in the professor's order), then each item that sits in no set. */
function sheetPlan(s){
  const sets = (s.chains || []).map(id => chainList().find(c => c.id === id)).filter(Boolean)
    .map(c => ({chain: c, ids: c.parts.filter(id => SRC_OF[id] && SRC_OF[id].src === s.id && byId(id)), kind: setNumbers(c)}))
    .filter(g => g.ids.length);
  const orig = sets.filter(g => g.kind === 'original');
  let changed = sets.filter(g => g.kind === 'changed'), main = sets.filter(g => g.kind !== 'changed');
  if(orig.length){
    // an older set of the same problem in the professor's numbers is already on the sheet: leave it off
    const have = new Set(orig.flatMap(g => g.ids.map(srcLabel)));
    const dup = main.filter(g => !g.kind && g.ids.every(id => have.has(srcLabel(id))));
    main = main.filter(g => !dup.includes(g));
    changed = changed.concat(dup.filter(g => CHANGED_IDS && g.ids.every(id => CHANGED_IDS.test(id))));
  }
  let mainChanged = false;
  if(!main.length && changed.length){ main = changed; changed = []; mainChanged = true; }
  const inSet = new Set(sets.flatMap(g => g.ids));
  (s.items || []).forEach(it => { if(!inSet.has(it.q) && byId(it.q)) main.push({chain: null, ids: [it.q], kind: ''}); });
  // the sheet's numbering decides the order of the problems where every one is numbered; examples keep the deck's order
  const num = g => { const m = /\d+/.exec(srcLabel(g.ids[0])); return m ? +m[0] : null; };
  const order = gs => s.type !== 'example' && gs.every(g => num(g) != null)
    ? gs.map((g, i) => [g, i]).sort((a, b) => num(a[0]) - num(b[0]) || a[1] - b[1]).map(x => x[0]) : gs;
  return {main: order(main), changed: order(changed), mainChanged};
}
const sheetGroups = (s, variant) => sheetPlan(s)[variant === 'changed' ? 'changed' : 'main'];

/* ---- the text of a part on paper ----------------------------------------- */
/* "(Part a: k = 0.1198 hr⁻¹.)": the value an earlier part found, carried so a
   part can be answered alone in the drill. On paper the parts are worked in
   order, so the bracket is left out. */
const CARRY_RE = /\s*\((?:Parts?|Questions?|Problems?)\s[^():]{0,40}:\s(?:[^()]|\([^()]*\))*\)/g;
const dropCarry = t => String(t || '').replace(CARRY_RE, '');
/* Where the text the parts share ends: the longest common start of their
   stems, cut back to the end of a sentence (or a paragraph), never after a
   list marker such as "1." or "a.", and leaving every part some text. */
function sharedLead(stems){
  if(stems.length < 2) return 0;
  const a = stems[0];
  let n = 0;
  while(n < a.length && stems.every(s => s[n] === a[n])) n++;
  for(let i = n; i > 0; i--){
    const head = a.slice(0, i);
    const sentence = /[.?!:]\s+$/.test(head) && !/(?:^|\s)\(?(?:\d{1,2}|[a-z])[.)]\s+$/.test(head);
    if(!(sentence || /\n\s*\n\s*$/.test(head))) continue;
    if(stems.every(s => s.slice(i).trim().length)) return head.trim().length >= 20 ? i : 0;
  }
  return 0;
}
/* The part letter at the start of a part's own text ("a. What is ...") is the
   label already printed beside it. */
function dropMarker(t, label){
  const m = /^\s*\(?(\d{1,2}|[a-z])[.)]\s+/i.exec(t), e = /(\d{1,2}|[a-z])\)?$/i.exec(label || '');
  return m && e && m[1].toLowerCase() === e[1].toLowerCase() ? t.slice(m[0].length) : t;
}
/* A fixed order for the options, from the question id, so the worksheet and
   its solutions letter them alike every time. */
function wsOrder(q){
  let h = 2166136261;
  for(const ch of q.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const idx = (q.options || []).map((o, i) => i);
  for(let i = idx.length - 1; i > 0; i--){ h = Math.imul(h ^ (h >>> 13), 1103515245) + 12345 >>> 0; const j = h % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}
const qKind = q => q.type === 'numeric' ? 'numeric' : q.type === 'match' ? 'match' : 'choice';
const isCalcPart = q => q.type === 'numeric' || (q.type !== 'match' && Array.isArray(q.steps) && q.steps.length > 0);
/* The professor's key, or worked by the drill: the professor's key only where
   the document is the professor's own solved sheet and nothing recorded on the
   question (audit, note) matches the course's OPT.drillWorked; where the audit
   says the working was only heard (OPT.spokenOnly) and neither it nor the
   document's note says it was written (OPT.writtenWorking), the drill's. */
function solvedBy(q, s){
  if(!s || s.key !== 'instructor') return 'drill';
  const a = String(q.audit || ''), t = a + ' ' + String(q.note || '');
  if(DRILL_WORKED && DRILL_WORKED.test(t)) return 'drill';
  if(SPOKEN_ONLY && SPOKEN_ONLY.test(a) && !(WRITTEN && WRITTEN.test(a + ' ' + (s.note || '')))) return 'drill';
  return 'prof';
}
const SOLVED_LABEL = {prof: "The professor's key", drill: 'Worked by the drill'};
const imgHTML = key => key && typeof IMAGES !== 'undefined' && IMAGES[key] ? `<img class="wsimg" src="${IMAGES[key]}" alt="Figure for this problem">` : '';
const STEP_KIND = k => (typeof MISS_KINDS !== 'undefined' && MISS_KINDS[k]) || k || '';

function givensHTML(q){
  if(!Array.isArray(q.givens) || !q.givens.length) return '';
  return `<div class="givens"><h4>What the stem gives</h4><table class="gtab"><tbody>${q.givens.map(([s, v, r]) =>
    `<tr><td class="gsym">${rich(s)}</td><td class="gval">${esc(v)}</td><td class="grole${/^not needed/i.test(r || '') ? ' gskip' : ''}">${rich(r || '')}</td></tr>`).join('')}</tbody></table></div>`;
}
function stepsHTML(q){
  if(!Array.isArray(q.steps) || !q.steps.length) return '';
  return `<div class="steps"><h4>Worked solution</h4>${q.steps.map(s =>
    `<div class="step"><span class="stepk">${esc(STEP_KIND(s.k))}</span><span>${rich(s.t)}${s.why ? `<span class="stepwhy">${rich(s.why)}</span>` : ''}</span></div>`).join('')}</div>`;
}
const checkHTML = q => q.check && q.check.t ? `<div class="sanity"><h4>Does the number make sense?</h4><p>${rich(q.check.t)}</p></div>` : '';
const workedBlock = q => givensHTML(q) + stepsHTML(q) + checkHTML(q);
const pairsBlock = q => `<div class="steps"><h4>Each pair, and why</h4>` + (q.pairs || []).map(p =>
  `<div class="pairrow"><span class="pl">${rich(p.l)}</span><span class="pr">${rich(p.r)}${p.why ? `<span class="stepwhy">${rich(p.why)}</span>` : ''}</span></div>`).join('') + `</div>`;
const matchRight = q => Array.isArray(q.right) ? q.right : [...new Set((q.pairs || []).map(p => p.r))];
const matchLeft = q => Array.isArray(q.left) ? q.left : (q.pairs || []).map(p => p.l);

function sheetPartHTML(q, label, text, withImg, tag){
  const calc = isCalcPart(q), kind = qKind(q);
  let h = `<div class="wspart${calc ? ' calc' : ''}" data-qid="${esc(q.id)}" data-label="${esc(label)}">
    <div class="wsq${label.length > 10 ? ' stack' : ''}"><span class="wslab">${esc(label)}</span><div class="wstext">${tag ? `<span class="wsmod">${esc(tag)}</span> ` : ''}${stemHTML(text)}</div></div>`;
  if(withImg) h += imgHTML(q.img);
  if(kind === 'match'){
    h += `<div class="wsmatch"><ol class="wsleft">${matchLeft(q).map(l => `<li>${rich(l)} <span class="wsblank">________</span></li>`).join('')}</ol>
      <ol class="wsright" type="A">${matchRight(q).map(r => `<li>${rich(r)}</li>`).join('')}</ol></div>`;
  }else if(kind === 'choice' && Array.isArray(q.options)){
    h += `<ol class="wsopts" type="A">${wsOrder(q).map(i => `<li>${rich(q.options[i].t)}</li>`).join('')}</ol>`;
  }
  return h + `<div class="wswork${calc ? '' : ' short'}"></div></div>`;
}
function sheetSolHTML(q, label, s){
  const kind = qKind(q), by = solvedBy(q, s);
  let ans;
  if(kind === 'numeric') ans = `${esc(fmtNum(q.answer))} ${esc(q.units || '')}`;
  else if(kind === 'match') ans = (q.pairs || []).map(p => `${rich(p.l)} → ${rich(p.r)}`).join('; ');
  else { const ord = wsOrder(q);
    ans = ord.map((oi, n) => q.options[oi].correct ? `${LETTERS[n]}. ${rich(q.options[oi].t)}` : null).filter(Boolean).join('; '); }
  let h = `<div class="wssp" data-qid="${esc(q.id)}"><p class="wsshead"><span class="wslab">${esc(label)}</span><span class="wsby ${by}">${SOLVED_LABEL[by]}</span></p>
    <p class="wsans"><b>Answer:</b> ${ans}</p>`;
  if(kind === 'numeric') h += workedBlock(q);
  else if(kind === 'match') h += pairsBlock(q);
  else {
    if(Array.isArray(q.steps) && q.steps.length) h += workedBlock(q);
    const right = (q.options || []).filter(o => o.correct && o.why);
    if(right.length) h += `<div class="wswhy">${right.map(o => `<p>${rich(o.why)}</p>`).join('')}</div>`;
  }
  if(q.note) h += `<p class="wsnote">${rich(q.note)}</p>`;
  return h + `</div>`;
}
/* The worksheet's markup: mode is worksheet, solutions, changed-worksheet or
   changed-solutions; a solutions mode adds the solutions after the problems. */
function sheetHTML(sourceId, mode){
  const s = SRC_BY[sourceId];
  if(!s) return '';
  const variant = /^changed-/.test(mode || '') ? 'changed' : 'main', sol = /solutions$/.test(mode || '');
  const plan = sheetPlan(s), groups = plan[variant];
  const changedNums = variant === 'changed' || plan.mainChanged;
  const date = srcDate(s.date);
  let h = `<article class="wsdoc" data-src="${esc(s.id)}" data-mode="${esc(mode)}"><div class="wshead">
    <h1>${esc(String(s.title).replace(/\s*\(solutions\)\s*$/i, ''))}${variant === 'changed' ? ' — changed numbers (extra practice)' : ''}</h1>
    <p class="wsmeta">${esc(srcSpans(s) ? srcModSpan(s) : modName(s.module))} · ${esc(SRC_TYPE_ONE[s.type] || s.type)} · ${date ? esc(date) : 'No date'}</p>
    ${changedNums ? `<p class="wsmeta">The numbers on this sheet are changed from the professor's sheet.</p>` : ''}
    <p class="wsname"><span>Name <i></i></span><span>Date <i></i></span></p></div>`;
  const parts = [];
  groups.forEach(g => {
    const qs = g.ids.map(byId);
    const stems = qs.map(q => dropCarry(q.stem));
    const cut = g.ids.length > 1 ? sharedLead(stems) : 0;
    const imgs = [...new Set(qs.map(q => q.img).filter(k => k && typeof IMAGES !== 'undefined' && IMAGES[k]))];
    const sharedImg = imgs.length === 1 && qs.every(q => q.img === imgs[0]) && qs.length > 1 ? imgs[0] : null;
    h += `<section class="wsgroup">`;
    if(cut) h += `<div class="wscase">${stemHTML(stems[0].slice(0, cut).trim())}${sharedImg ? imgHTML(sharedImg) : ''}</div>`;
    else if(sharedImg) h += `<div class="wscase">${imgHTML(sharedImg)}</div>`;
    qs.forEach((q, i) => {
      const label = srcLabel(q.id) || String(i + 1);
      const text = dropMarker(stems[i].slice(cut).trim(), label);
      h += sheetPartHTML(q, label, text, !sharedImg && !!q.img, srcSpans(s) && q.module != null ? 'Module ' + modShort(q.module) : '');
      parts.push([q, label]);
    });
    h += `</section>`;
  });
  if(sol){
    h += `<section class="wssol"><h2 class="wssolh">Solutions</h2>
      <p class="wsmeta">${esc(SOLVED_LABEL.prof)}: the answer and working on the professor's own solved sheet or annotated slide. ${esc(SOLVED_LABEL.drill)}: the drill's own working${s.key === 'instructor' ? ", where the professor's sheet gives no worked value" : ''}.</p>
      ${parts.map(([q, label]) => sheetSolHTML(q, label, s)).join('')}</section>`;
  }
  return h + `</article>`;
}

/* ---- the tab --------------------------------------------------------------- */
/* The document's problems, in the sheet's order, as one pass in the drill. A
   single whole problem set starts as that set (chained-problem-sets, when on). */
function startSheetSet(id, variant){
  const s = SRC_BY[id]; if(!s) return;
  const groups = sheetGroups(s, variant), ids = groups.flatMap(g => g.ids);
  if(!ids.length){ alert('That worksheet has no questions in the drill yet.'); return; }
  const C = FX.api('chained-problem-sets');
  if(C && groups.length === 1 && groups[0].chain && groups[0].ids.length === groups[0].chain.parts.length && C.startChain(groups[0].chain.id)) return;
  Q = {pool: ids.map(byId), label: s.title + (variant === 'changed' ? ', changed numbers' : ''), sweep: ids.slice(), i: 0,
       current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false};
  nextQuestion();
  show('quiz');
}
function srcCardHTML(s){
  const plan = sheetPlan(s), date = srcDate(s.date);
  const span = srcSpans(s), ids = [...new Set(plan.main.concat(plan.changed).flatMap(g => g.ids))];
  const labels = [...new Set(ids.map(id => { const l = srcLabel(id), q = byId(id); return span && l && q && q.module != null ? `${l} (M${modShort(q.module)})` : l; }).filter(Boolean))];
  const link = (href, text) => `<a class="btn small ghost" href="${esc(href)}" target="_blank" rel="noopener">${text}</a>`;
  let h = `<div class="srccard" data-src="${esc(s.id)}" id="src-${esc(s.id)}"><div class="srctop"><b>${esc(s.title)}</b><small>${[span ? 'Covers ' + srcModSpan(s) : '', date || 'No date'].filter(Boolean).map(esc).join(' · ')}</small></div>`;
  h += `<div class="srcrow"><span class="srcrlab">Original</span><span class="srcbtns">`;
  if(s.drive && s.drive.id) h += link(driveView(s.drive.id), 'Open original') + link(driveDown(s.drive.id), 'Download original');
  else h += `<span class="srcmiss">${esc(s.missing || 'No original on file.')}</span>`;
  h += `</span></div>`;
  if(s.drive && s.key === 'student-work') h += `<p class="srcsub">Original: a completed copy, with the owner's working on it.</p>`;
  const row = (variant, lab) => `<div class="srcrow"><span class="srcrlab">${lab}</span><span class="srcbtns"><button type="button" class="btn small" data-ink="${esc(s.id)}" data-var="${variant}">✍️ Write on it</button><button type="button" class="btn small ghost" data-srcgo="${esc(s.id)}" data-var="${variant}">Practice in the drill</button></span></div>`;
  if(plan.main.length) h += row('main', plan.mainChanged ? 'Worksheet, changed numbers' : 'Worksheet');
  else h += `<p class="srcsub">No worksheet: ${esc(s.missing || 'no questions from this document are in the drill yet.')}</p>`;
  if(plan.changed.length) h += row('changed', 'Changed numbers (extra practice)');
  if(labels.length) h += `<p class="srcprobs"><span class="srcrlab">Problems</span> ${labels.map(esc).join(', ')}</p>`;
  if(s.note) h += `<p class="srcsub">${esc(s.note)}</p>`;
  return h + `</div>`;
}
const SRC_OPEN = new Set();
function renderSheets(el){
  el = el || document.getElementById('v-' + OPT.tab);
  const anyDrive = SRC_LIST.some(s => s.drive && s.drive.id);
  let h = `<h2>${esc(OPT.label)}</h2>
    <p class="sub">Each module holds its worked examples, in-class activities and daily practice. Each homework, quiz and review is listed on its own, after the last module it covers, with every problem tagged by its module. Each worksheet holds the professor's problems from that document, with room to work under each.</p>
    <p class="srcnote">Write on it opens the worksheet here to write on with an Apple Pencil, a stylus, a finger or a mouse, with a grid under each problem and More room when it runs out. Show solutions adds the solutions under the worksheet. The writing is kept with this profile's progress in this browser: Export progress in Settings copies it with the rest, and Erase my history removes it. Save as PDF prints the worksheet with the writing on it, or saves it as a PDF file.</p>`;
  if(anyDrive) h += `<p class="srcnote">Open original and Download original open the copy kept in the drill owner's Google Drive, so they work only for an account that folder is shared with. The originals are not copied onto this site, because the course materials may not be shared publicly; the worksheets carry the same problems.</p>`;
  const KINDS = [['example', "Worked examples (the professor's lecture slides)"], ['in-class', 'In-class activities'], ['daily-practice', 'Daily practice'], ['lecture-slides', 'Lecture slides']];
  const ONE = {'in-class': ['in-class activity', 'in-class activities'], example: ['set of worked examples', 'sets of worked examples'],
    'daily-practice': ['daily practice sheet', 'daily practice sheets'], 'lecture-slides': ['slide set', 'slide sets']};
  const tally = list => KINDS.map(([t]) => [t, list.filter(s => s.type === t).length]).filter(([, n]) => n).map(([t, n]) => `${n} ${ONE[t][n === 1 ? 0 : 1]}`).join(' · ');
  const SPAN_ORDER = ['homework', 'quiz', 'review'], num = s => +((String(s.title).match(/\d+/) || [0])[0]);
  const after = m => SRC_LIST.filter(s => srcSpans(s) && srcHome(s) === m)
    .sort((a, b) => SPAN_ORDER.indexOf(a.type) - SPAN_ORDER.indexOf(b.type) || num(a) - num(b));
  const probs = s => new Set(sheetPlan(s).main.flatMap(g => g.ids)).size;
  const here = m => SRC_LIST.filter(s => !srcSpans(s) && s.module === m && KINDS.some(([t]) => t === s.type));
  const anchor = m => 'srcm-' + String(m).replace(/[^A-Za-z0-9_-]/g, '_');
  const shown = MOD_ORDER.filter(m => here(m).length || after(m).length);
  h += `<p class="srcjump">${shown.map(m => `<a class="chip" href="#${anchor(m)}">Module ${esc(modShort(m))}</a>`).join('')}</p>`;
  shown.forEach(m => {
    const list = here(m), later = after(m);
    h += `<section class="srcmod" id="${anchor(m)}">`;
    if(list.length){
      const key = 'm' + m;
      h += `<details class="srcgrp"${SRC_OPEN.has(key) ? ' open' : ''} data-srcgrp="${esc(key)}"><summary><b>${esc(modName(m))}</b><small>${esc(tally(list))}</small></summary>`;
      KINDS.forEach(([t, name]) => { const l = list.filter(s => s.type === t); if(l.length) h += `<h4>${esc(name)}</h4>${l.map(srcCardHTML).join('')}`; });
      h += `</details>`;
    }
    later.forEach(s => {
      const n = probs(s);
      h += `<details class="srcgrp srcown"${SRC_OPEN.has(s.id) ? ' open' : ''} data-srcgrp="${esc(s.id)}"><summary><b>${esc(s.title)}</b><small>${esc(['Covers ' + srcModSpan(s), n ? `${n} problem${n === 1 ? '' : 's'}, each tagged by module` : ''].filter(Boolean).join(' · '))}</small></summary>${srcCardHTML(s)}</details>`;
    });
    h += `</section>`;
  });
  const lost = SRC_LIST.filter(s => srcSpans(s) ? !shown.includes(srcHome(s)) : !(shown.includes(s.module) && KINDS.some(([t]) => t === s.type)));
  if(lost.length) h += `<section class="srcmod"><h3>Other</h3>${lost.map(srcCardHTML).join('')}</section>`;
  if(!SRC_LIST.length) h += `<div class="empty">No source documents are listed yet.</div>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-srcgo]').forEach(b => b.onclick = () => startSheetSet(b.dataset.srcgo, b.dataset.var));
  // which groups are open is kept for the visit, so coming back to the tab keeps the place
  el.querySelectorAll('details[data-srcgrp]').forEach(d => d.ontoggle = () => { d.open ? SRC_OPEN.add(d.dataset.srcgrp) : SRC_OPEN.delete(d.dataset.srcgrp); });
  el.querySelectorAll('.srcjump a').forEach(a => a.onclick = e => { const t = document.getElementById(a.getAttribute('href').slice(1)); if(!t) return; e.preventDefault();
    const d = t.querySelector('details'); if(d){ d.open = true; SRC_OPEN.add(d.dataset.srcgrp); } t.scrollIntoView({block: 'start'}); });
  inkMark(el);
}

/* ---------- Write on a worksheet: pen or finger ink over the worksheet, in the page ----------
   The worksheet opens over the page as its markup (sheetHTML), with large work areas and a "More room" button
   under each problem. Each problem part and the name line carry their own drawing layer, and a stroke is stored in
   that part's coordinates as fractions of its width, so the ink stays on its problem when room is added above it
   or the tablet is turned. Once a pen touches the page, fingers scroll and only the pen writes. */
const INK_COLORS = [['#111111', 'Black'], ['#1E56C8', 'Blue'], ['#C62828', 'Red']];
const INK_ROOM = 240;      // px added by one tap on More room
const PREFS_KEY = () => NS + ':ink-prefs';
let INK = null;            // {id, variant, data:{parts:{key:[stroke]}, room:{key:px}}, tool, color, size, pencil, shapes, undo:[], redo:[]}
const inkKey = (id, v) => id + '|' + v;
const inkStore = () => (DB.ink && typeof DB.ink === 'object' && !Array.isArray(DB.ink) ? DB.ink : null);
const inkLoad = (id, v) => { const all = inkStore(), d = all && all[inkKey(id, v)];
  return d && d.parts && typeof d.parts === 'object' ? {parts: JSON.parse(JSON.stringify(d.parts)), room: Object.assign({}, d.room || {})} : {parts: {}, room: {}}; };
const strokeCount = d => Object.values(d.parts || {}).reduce((n, a) => n + (Array.isArray(a) ? a.length : 0), 0);
const inkCount = (id, v) => strokeCount(inkLoad(id, v));
const inkBytes = () => { const all = inkStore(); return all ? JSON.stringify(all).length : 0; };
/* the writing on the page open now, into the progress; a page with no writing and no extra room is not kept */
function inkSave(){
  if(!INK) return;
  const k = inkKey(INK.id, INK.variant), empty = !strokeCount(INK.data) && !Object.values(INK.data.room).some(v => v > 0);
  if(empty){ const all = inkStore(); if(all && k in all){ delete all[k]; save(); } }
  else { if(!inkStore()) DB.ink = {}; DB.ink[k] = {parts: INK.data.parts, room: INK.data.room, at: Date.now()}; save(); }
  const failed = typeof FAILED !== 'undefined' && PROFILE && FAILED.has(keyFor(PROFILE));
  const w = document.querySelector('#ink .inkwarn'); if(w) w.hidden = canSave() && !failed;
}
// the Write on it buttons say Continue writing where writing is kept
function inkMark(root){
  root.querySelectorAll('[data-ink][data-var]').forEach(b => { if(b.classList.contains('inkscratch')) return;
    b.textContent = inkCount(b.dataset.ink, b.dataset.var) ? '✍️ Continue writing' : '✍️ Write on it'; });
}
// a question's scratch paper (id 'q:<question id>'): its stem over one tall work area, no solutions
function inkQuestionHTML(q){
  return `<div class="wsdoc"><div class="wspart calc" data-qid="work"><div class="wsq stack"><span class="wslab">Scratch paper</span><div>${stemHTML(q.stem)}${q.units ? ` <span class="units">(answer in ${esc(q.units)})</span>` : ''}</div></div><div class="wswork tall"></div></div></div>`;
}
const prefsLoad = () => { try { return JSON.parse(store.get(PREFS_KEY()) || '{}') || {}; } catch(e){ return {}; } };
function inkOpen(id, variant){
  const q = id.startsWith('q:') ? byId(id.slice(2)) : null;
  const s = q ? {title: 'scratch paper'} : SRC_BY[id]; if(!s || (id.startsWith('q:') && !q)) return;
  if(document.getElementById('ink')) inkClose();
  if(q && variant.startsWith('exam:')){   // the scratch paper of an earlier paper is cleared when this paper's is opened
    const all = inkStore(), keep = '|' + variant;
    if(all) Object.keys(all).forEach(k => { if(k.startsWith('q:') && k.includes('|exam:') && !k.endsWith(keep)) delete all[k]; });
  }
  const prefs = prefsLoad();
  INK = {id, variant, data: inkLoad(id, variant), tool: 'pen', color: prefs.color || INK_COLORS[0][0], size: prefs.size || 2,
         pencil: 'pencil' in prefs ? !!prefs.pencil : false, shapes: 'shapes' in prefs ? !!prefs.shapes : true, undo: [], redo: [], scrollY: window.scrollY || 0};   // a finger writes until a pen touches the page
  const mode = variant === 'changed' ? 'changed-worksheet' : 'worksheet', solMode = variant === 'changed' ? 'changed-solutions' : 'solutions';
  const sol = q ? '' : (sheetHTML(id, solMode).match(/<section class="wssol">[\s\S]*<\/section>/) || [''])[0];
  const exam = q && variant.startsWith('exam:');
  const ov = document.createElement('div'); ov.id = 'ink'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Write on ' + s.title);
  ov.innerHTML = `<div class="inkbar" role="toolbar" aria-label="Writing tools">
      <button type="button" class="btn small" data-inkdone>✓ Done</button>${exam ? '<span class="inkgrp"><b class="inkclock" aria-label="Time on the paper"></b></span>' : ''}
      <span class="inkgrp">${INK_COLORS.map(([c, n]) => `<button type="button" class="inkc" data-inkcolor="${c}" aria-label="${n} pen" style="--c:${c}"></button>`).join('')}</span>
      <span class="inkgrp"><button type="button" class="chip" data-inktool="pen">✏️ Pen</button><button type="button" class="chip" data-inktool="hl">🖍 Highlight</button><button type="button" class="chip" data-inktool="erase">⌫ Eraser</button></span>
      <span class="inkgrp"><button type="button" class="chip" data-inksize="1.5">Fine</button><button type="button" class="chip" data-inksize="2.5">Medium</button><button type="button" class="chip" data-inksize="4">Bold</button></span>
      <span class="inkgrp"><button type="button" class="chip" data-inkundo aria-label="Undo">↶ Undo</button><button type="button" class="chip" data-inkredo aria-label="Redo">↷ Redo</button></span>
      <span class="inkgrp"><button type="button" class="chip" data-inkpencil aria-pressed="false">Pencil only</button><button type="button" class="chip" data-inkshapes aria-pressed="true" title="Draw a line, a circle or a box and hold the pen still at the end: it becomes a straight line or a clean shape. Two fingers tapped together undo.">Hold to snap</button>${q ? '' : '<button type="button" class="chip" data-inksol aria-expanded="false">Show solutions</button>'}<button type="button" class="chip" data-inkpdf>Save as PDF</button><button type="button" class="chip" data-inkclear>Clear page</button></span>
      <span class="inkwarn" hidden>This browser is not saving: the writing lasts only until the page closes. Save as PDF to keep it.</span>
    </div>
    <div class="inkpaper">${q ? inkQuestionHTML(q) : sheetHTML(id, mode)}<div class="inksol" hidden>${sol}</div></div>`;
  document.body.appendChild(ov); document.body.classList.add('inking');
  // a pen or finger held on the page selects nothing and opens no menu: the page is for writing
  ov.addEventListener('selectstart', e => { if(!(e.target.closest && e.target.closest('textarea, input'))) e.preventDefault(); });
  ov.addEventListener('contextmenu', e => e.preventDefault());
  ov.tabIndex = -1;
  // a drawing layer on the name line and on every problem, with More room under each problem's work area
  const doc = ov.querySelector('.wsdoc');
  const regions = [[doc.querySelector('.wshead'), 'head'], ...[...doc.querySelectorAll('.wspart')].map(p => [p, p.dataset.qid])];
  regions.forEach(([el, key]) => {
    if(!el) return;
    el.classList.add('inkreg'); el.dataset.ink = key;
    const w = el.querySelector('.wswork');
    if(w){ w.style.height = (inkBase(w) + (INK.data.room[key] || 0)) + 'px';
      el.insertAdjacentHTML('afterend', `<div class="inkroom" data-inkfor="${esc(key)}"><button type="button" class="chip" data-inkroom="1">＋ More room</button><button type="button" class="chip" data-inkroom="-1"${INK.data.room[key] ? '' : ' hidden'}>− Less room</button></div>`); }
    const c = document.createElement('canvas'); c.className = 'inkcv'; el.appendChild(c);
    inkWire(c, el, key);
  });
  inkTools(); inkSave();
  const clk = ov.querySelector('.inkclock');
  if(clk){ const t = () => { clk.textContent = '⏱ ' + (typeof EX !== 'undefined' && EX ? (EX.ends ? fmt(Math.max(0, EX.ends - Date.now())) : fmt(Date.now() - (EX.started || Date.now())) + ' taken') : fmt(0)); }; t(); INK.clock = setInterval(t, 1000); }
  if(typeof ResizeObserver !== 'undefined'){
    const ro = new ResizeObserver(es => es.forEach(e => inkSize(e.target)));
    regions.forEach(([el]) => el && ro.observe(el)); INK.ro = ro;
  } else regions.forEach(([el]) => el && inkSize(el));
  ov.scrollTop = 0; if(ov.focus) ov.focus();
}
const inkBase = w => w.classList.contains('short') ? 200 : w.classList.contains('tall') ? 720 : 480;   // on screen: a calculation gets 480 px to work in, a short answer 200
function inkSize(el){
  const c = el.querySelector(':scope > canvas.inkcv'); if(!c) return;
  const r = el.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1);
  c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
  c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
  inkDraw(el);
}
function inkDraw(el){
  const c = el.querySelector(':scope > canvas.inkcv'); if(!c || !INK) return;
  const g = c.getContext('2d'), W = c.width;
  g.clearRect(0, 0, c.width, c.height);
  const ss = INK.data.parts[el.dataset.ink] || [];
  ss.forEach(s => { if(s.t === 'hl') inkStroke(g, s, W); });   // highlighter first, so it sits under the writing
  ss.forEach(s => { if(s.t !== 'hl') inkStroke(g, s, W); });
  if(INK.live && INK.live.el === el && INK.live.s) inkStroke(g, INK.live.s, W);   // (an eraser drag has no stroke of its own)
}
// one stroke: points stored as fractions of the part's width, drawn through midpoints so the line is smooth
function inkStroke(g, s, W){
  const p = s.p; if(!Array.isArray(p) || p.length < 2) return;
  g.save(); g.lineCap = g.lineJoin = 'round'; g.strokeStyle = s.c;
  g.globalAlpha = s.t === 'hl' ? 0.32 : 1; g.lineWidth = s.w * W;
  g.beginPath(); g.moveTo(p[0] * W, p[1] * W);
  if(s.k === 'poly'){ for(let i = 2; i < p.length; i += 2) g.lineTo(p[i] * W, p[i + 1] * W); g.stroke(); g.restore(); return; }   // a snapped box keeps its corners
  if(p.length === 2){ g.lineTo(p[0] * W + 0.01, p[1] * W); }
  for(let i = 2; i < p.length - 2; i += 2){ const mx = (p[i] + p[i + 2]) / 2, my = (p[i + 1] + p[i + 3]) / 2; g.quadraticCurveTo(p[i] * W, p[i + 1] * W, mx * W, my * W); }
  if(p.length > 2) g.lineTo(p[p.length - 2] * W, p[p.length - 1] * W);
  g.stroke(); g.restore();
}
/* Hold to snap: a stroke held still at its end for INK_HOLD ms becomes a straight line when it runs close to
   straight (its end then follows the pen until it lifts), or, when it closes back on itself, an ellipse or a box,
   whichever fits its points better. A highlighter only straightens. */
const INK_HOLD = 500, INK_STILL = 5;   // ms held, and px of jitter that still counts as held
function inkRecognize(p, Wpx, tool){
  const n = p.length / 2; if(n < 4) return null;
  const X_ = i => p[2 * i] * Wpx, Y_ = i => p[2 * i + 1] * Wpx;
  let len = 0, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for(let i = 0; i < n; i++){ const x = X_(i), y = Y_(i); if(i) len += Math.hypot(x - X_(i - 1), y - Y_(i - 1));
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  if(len < 24) return null;
  const x0 = X_(0), y0 = Y_(0), x1 = X_(n - 1), y1 = Y_(n - 1), d = Math.hypot(x1 - x0, y1 - y0);
  if(d > 0.8 * len){
    let dev = 0; for(let i = 1; i < n - 1; i++) dev = Math.max(dev, Math.abs((x1 - x0) * (y0 - Y_(i)) - (x0 - X_(i)) * (y1 - y0)) / d);
    return dev < Math.max(6, 0.06 * d) ? {kind: 'line', p: [p[0], p[1], p[2 * n - 2], p[2 * n - 1]]} : null;
  }
  if(tool === 'hl') return null;
  const w = maxX - minX, h = maxY - minY;
  if(Math.min(w, h) < 16 || d > 0.3 * Math.max(w, h)) return null;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, rx_ = w / 2, ry = h / 2;
  let ee = 0, er = 0;
  for(let i = 0; i < n; i++){ const x = X_(i), y = Y_(i);
    ee += Math.abs(Math.hypot((x - cx) / rx_, (y - cy) / ry) - 1);
    er += Math.min(Math.abs(x - minX), Math.abs(x - maxX), Math.abs(y - minY), Math.abs(y - maxY)) / Math.min(rx_, ry); }
  ee /= n; er /= n;
  const f = v => +(v / Wpx).toFixed(4);
  if(er < ee && er < 0.12) return {kind: 'shape', k: 'poly', p: [minX, minY, maxX, minY, maxX, maxY, minX, maxY, minX, minY].map(f)};
  if(ee < 0.15){ const q = []; for(let k = 0; k <= 72; k++){ const a = 2 * Math.PI * k / 72; q.push(f(cx + rx_ * Math.cos(a)), f(cy + ry * Math.sin(a))); } return {kind: 'shape', p: q}; }
  return null;
}
function inkSnap(el){
  const lv = INK && INK.live; if(!lv || lv.el !== el || !lv.s || lv.snap || !INK.shapes) return;
  const r = inkRecognize(lv.s.p, el.getBoundingClientRect().width, lv.s.t); if(!r) return;
  lv.s.p = r.p; if(r.k) lv.s.k = r.k; lv.snap = r.kind; inkDraw(el);
}
const inkCapture = (c, e) => { try { c.setPointerCapture(e.pointerId); } catch(err){ /* a pointer that is already gone cannot be captured */ } };
/* an event handler of the writing layer: an error is kept in FX.errors and the console, and the page carries on */
const guard = (where, f) => function(e){ try { return f.call(this, e); } catch(err){ FX.errors.push({module: X.name, where, message: String(err && err.message || err)}); try { console.error('feature module ' + X.name + ' (' + where + '):', err); } catch(_){} } };
function inkWire(c, el, key){
  const pt = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.width]; };
  let scroll = null, tap = null, pen = false; const touches = new Set(), starts = new Map();
  ['touchstart', 'touchmove'].forEach(t => c.addEventListener(t, e => { if(e.cancelable) e.preventDefault(); }, {passive: false}));   // no selection, magnifier or callout from the browser
  const hold = () => { clearTimeout(c._hold); c._hold = setTimeout(guard('snap', () => inkSnap(el)), INK_HOLD); };
  c.addEventListener('pointerdown', guard('pointerdown', e => {
    if(!INK) return;
    if(e.pointerType === 'touch'){ touches.add(e.pointerId); starts.set(e.pointerId, [e.clientX, e.clientY]);
      if(touches.size === 2) tap = pen ? null : {t: Date.now(), moved: false}; else if(touches.size > 2) tap = null;   // (a hand resting while the pen writes is no tap)
      if(touches.size > 1 && !INK.pencil){ if(INK.live && INK.live.el === el){ INK.live = null; inkDraw(el); } scroll = {y: e.clientY, id: e.pointerId}; inkCapture(c, e); return; } }   // two fingers scroll
    if(e.pointerType === 'pen'){ pen = true; if(!INK.pencil){ INK.pencil = true; inkPrefs(); inkTools(); } }
    if(INK.pencil && e.pointerType === 'touch'){ scroll = {y: e.clientY, id: e.pointerId}; inkCapture(c, e); return; }   // a finger scrolls
    e.preventDefault(); inkCapture(c, e);
    const [x, y] = pt(e);
    if(INK.tool === 'erase'){ INK.live = {el, id: e.pointerId, erase: true}; inkErase(el, key, x, y); return; }
    const W = 1 / c.getBoundingClientRect().width;
    INK.live = {el, id: e.pointerId, s: {t: INK.tool, c: INK.color, w: +((INK.tool === 'hl' ? INK.size * 6 : INK.size) * W).toFixed(5), p: [+x.toFixed(4), +y.toFixed(4)]}, still: [e.clientX, e.clientY]};
    hold();
  }));
  c.addEventListener('pointermove', guard('pointermove', e => {
    if(tap && starts.has(e.pointerId)){ const [sx, sy] = starts.get(e.pointerId); if(Math.hypot(e.clientX - sx, e.clientY - sy) > 12) tap.moved = true; }
    if(scroll && e.pointerId === scroll.id){ const ov = document.getElementById('ink'); ov.scrollTop -= e.clientY - scroll.y; scroll.y = e.clientY; return; }
    if(!INK || !INK.live || INK.live.el !== el || INK.live.id !== e.pointerId) return;   // only the pointer that began the stroke draws it
    e.preventDefault();
    const co = e.getCoalescedEvents ? e.getCoalescedEvents() : [], evs = co.length ? co : [e];   // a browser may return no coalesced events
    if(INK.live.erase){ evs.forEach(ev => { const [x, y] = pt(ev); inkErase(el, key, x, y); }); return; }
    const lv = INK.live, last = evs[evs.length - 1];
    if(lv.snap === 'line'){ const [x, y] = pt(last); lv.s.p.splice(2, 2, +x.toFixed(4), +y.toFixed(4)); inkDraw(el); return; }   // a snapped line: its end follows the pen
    if(lv.snap) return;   // a snapped shape stays as it is until the pen lifts
    if(Math.hypot(last.clientX - lv.still[0], last.clientY - lv.still[1]) > INK_STILL){ lv.still = [last.clientX, last.clientY]; hold(); }
    const p = INK.live.s.p;
    evs.forEach(ev => { const [x, y] = pt(ev), lx = p[p.length - 2], ly = p[p.length - 1];
      if(Math.hypot(x - lx, y - ly) > 0.0015) p.push(+x.toFixed(4), +y.toFixed(4)); });
    inkDraw(el);
  }));
  const end = guard('pointerup', e => {
    clearTimeout(c._hold);
    touches.delete(e.pointerId); starts.delete(e.pointerId);
    if(e.pointerType === 'pen') pen = false;
    if(e.type === 'pointercancel') tap = null;   // a touch the system took back, such as a rejected palm
    if(tap && !touches.size){ const quick = !tap.moved && Date.now() - tap.t < 350; tap = null; if(quick && INK){ scroll = null; INK.live = null; inkUndo(false); return; } }   // two fingers tapped together: undo
    if(scroll && e.pointerId === scroll.id){ scroll = null; return; }
    if(!INK || !INK.live || INK.live.el !== el || INK.live.id !== e.pointerId) return;   // a finger lifting does not end the pen's stroke
    const lv = INK.live; INK.live = null;
    if(lv.s){ (INK.data.parts[key] = INK.data.parts[key] || []).push(lv.s); INK.undo.push({k: 'add', key, s: lv.s}); INK.redo = []; inkSave(); }
    inkDraw(el); inkTools();
  });
  c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
}
// the stroke eraser: touching a stroke removes the whole stroke. Is (x, y) within r of the path through the
// points p? Measured to each segment, so a snapped line or box, which keeps only its ends or corners, is hit
// along its whole length
function inkNear(p, x, y, r){
  for(let i = 0; i < p.length; i += 2){
    const ax = p[i], ay = p[i + 1], bx = i + 2 < p.length ? p[i + 2] : ax, by = i + 2 < p.length ? p[i + 3] : ay;
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
    if(Math.hypot(ax + t * dx - x, ay + t * dy - y) < r) return true;
  }
  return false;
}
function inkErase(el, key, x, y){
  const list = INK.data.parts[key] || [], W = el.getBoundingClientRect().width, tol = 10 / W;
  const hit = list.filter(s => inkNear(s.p, x, y, tol + s.w / 2));
  if(!hit.length) return;
  INK.data.parts[key] = list.filter(s => !hit.includes(s));
  INK.undo.push({k: 'del', key, s: hit}); INK.redo = []; inkSave(); inkDraw(el); inkTools();
}
function inkUndo(redo){
  const from = redo ? INK.redo : INK.undo, to = redo ? INK.undo : INK.redo, op = from.pop(); if(!op) return;
  if(op.k === 'clear') INK.data.parts = redo ? {} : JSON.parse(op.prev);
  else {
    const arr = INK.data.parts[op.key] = INK.data.parts[op.key] || [], add = (op.k === 'add') === !!redo, ss = Array.isArray(op.s) ? op.s : [op.s];
    if(add) arr.push(...ss); else INK.data.parts[op.key] = arr.filter(s => !ss.includes(s));
  }
  to.push(op); inkSave(); document.querySelectorAll('#ink .inkreg').forEach(inkDraw); inkTools();
}
function inkPrefs(){ store.set(PREFS_KEY(), JSON.stringify({color: INK.color, size: INK.size, pencil: INK.pencil, shapes: INK.shapes})); }
function inkTools(){
  const ov = document.getElementById('ink'); if(!ov || !INK) return;
  ov.querySelectorAll('[data-inkcolor]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.inkcolor === INK.color && INK.tool !== 'erase')));
  ov.querySelectorAll('[data-inktool]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.inktool === INK.tool)));
  ov.querySelectorAll('[data-inksize]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.inksize === INK.size)));
  ov.querySelector('[data-inkpencil]').setAttribute('aria-pressed', String(INK.pencil));
  ov.querySelector('[data-inkshapes]').setAttribute('aria-pressed', String(INK.shapes));
  ov.querySelector('[data-inkundo]').disabled = !INK.undo.length; ov.querySelector('[data-inkredo]').disabled = !INK.redo.length;
}
function inkClose(){
  const ov = document.getElementById('ink');
  if(!INK){ if(ov) ov.remove(); document.body.classList.remove('inking'); return; }
  try { inkSave(); } finally {
    if(INK.ro) INK.ro.disconnect(); if(INK.clock) clearInterval(INK.clock);
    const y = INK.scrollY, id = INK.id, opener = INK.opener; INK = null;
    if(ov) ov.remove();
    document.body.classList.remove('inking');
    const tab = document.getElementById('v-' + OPT.tab); if(tab) inkMark(tab);
    window.scrollTo(0, y);
    // back to the button that opened it (the tab redraws its cards, so find the same one again if it was replaced)
    const b = opener && opener.isConnected ? opener : [...document.querySelectorAll(`[data-ink="${CSS.escape(id)}"]`)].find(x => x.offsetParent);
    if(b) b.focus({preventScroll: true});
  }
}
// Save as PDF: the canvases are swapped for pictures of themselves, so the ink prints with the worksheet
// (the pictures show only in print, so they can stay until the next Save as PDF or until the worksheet closes)
function inkPrint(){
  const ov = document.getElementById('ink'); if(!ov) return;
  ov.querySelectorAll('img.inkimg').forEach(i => i.remove());
  ov.querySelectorAll('canvas.inkcv').forEach(c => { const im = new Image(); im.className = 'inkimg'; im.alt = ''; im.src = c.toDataURL('image/png'); c.after(im); });
  // the page prints at its width on screen, scaled to the paper, so text and ink keep their places
  const pp = ov.querySelector('.inkpaper'), w = pp.getBoundingClientRect().width;
  pp.style.setProperty('--inkpw', w + 'px'); pp.style.setProperty('--inkzoom', String(Math.min(1, 700 / w)));
  setTimeout(() => window.print(), 60);
}
function onClick(e){
  const o = e.target.closest && e.target.closest('[data-ink][data-var]');
  if(o && !o.closest('#ink')){ inkOpen(o.dataset.ink, o.dataset.var); if(INK) INK.opener = o; return; }
  if(!e.target.closest || !e.target.closest('#ink') || !INK) return;
  const b = e.target.closest('button'); if(!b) return;
  if(b.matches('[data-inkdone]')) return inkClose();
  if(b.dataset.inkcolor){ INK.color = b.dataset.inkcolor; if(INK.tool === 'erase') INK.tool = 'pen'; inkPrefs(); return inkTools(); }
  if(b.dataset.inktool){ INK.tool = b.dataset.inktool; return inkTools(); }
  if(b.dataset.inksize){ INK.size = +b.dataset.inksize; inkPrefs(); return inkTools(); }
  if(b.matches('[data-inkundo]')) return inkUndo(false);
  if(b.matches('[data-inkredo]')) return inkUndo(true);
  if(b.matches('[data-inkpencil]')){ INK.pencil = !INK.pencil; inkPrefs(); return inkTools(); }
  if(b.matches('[data-inkshapes]')){ INK.shapes = !INK.shapes; inkPrefs(); return inkTools(); }
  if(b.matches('[data-inksol]')){ const s = document.querySelector('#ink .inksol'); s.hidden = !s.hidden; b.setAttribute('aria-expanded', String(!s.hidden)); b.textContent = s.hidden ? 'Show solutions' : 'Hide solutions'; return; }
  if(b.matches('[data-inkpdf]')) return inkPrint();
  if(b.matches('[data-inkclear]')){
    if(!confirm('Clear all the writing on this page?')) return;
    INK.undo.push({k: 'clear', key: '_', prev: JSON.stringify(INK.data.parts)}); INK.redo = []; INK.data.parts = {};
    inkSave(); document.querySelectorAll('#ink .inkreg').forEach(inkDraw); return inkTools();
  }
  if(b.dataset.inkroom){
    const box = b.closest('.inkroom'), reg = box.previousElementSibling, key = box.dataset.inkfor, w = reg.querySelector('.wswork');
    INK.data.room[key] = Math.max(0, (INK.data.room[key] || 0) + INK_ROOM * +b.dataset.inkroom);
    w.style.height = (inkBase(w) + INK.data.room[key]) + 'px';
    box.querySelector('[data-inkroom="-1"]').hidden = !INK.data.room[key];
    inkSave();
  }
}
function onKey(e){
  if(!INK || !(e.metaKey || e.ctrlKey) || String(e.key).toLowerCase() !== 'z') return;
  e.preventDefault(); inkUndo(e.shiftKey);
}

/* ---- Scratch paper beside a calculation's answer box ----------------------- */
function scratchButton(pane, input, q, variant){
  if(!input || pane.querySelector('.inkscratch')) return;
  const box = input.closest('.numin') || input.parentElement;
  box.insertAdjacentHTML('beforeend', `<button type="button" class="chip inkscratch" data-ink="q:${esc(q.id)}" data-var="${esc(variant)}">✍️ Scratch paper</button>`);
}
X.rendered((pane, view) => {
  if(view === 'quiz' && typeof Q !== 'undefined' && Q && Q.current && Q.current.type === 'numeric' && !Q.revealed)
    scratchButton(pane, pane.querySelector('#numIn'), Q.current, 'scratch');
  else if(view === 'exam' && typeof EX !== 'undefined' && EX && EX.qs && EX.qs[EX.i] && EX.qs[EX.i].type === 'numeric')
    scratchButton(pane, pane.querySelector('#exNum'), EX.qs[EX.i], 'exam:' + (EX.ends || EX.started));
});

/* ---- the tab, Settings, the saved shape ------------------------------------ */
X.tab({id: OPT.tab, label: OPT.label, before: OPT.before, render: pane => renderSheets(pane)});
X.settings({
  title: 'Writing on worksheets',
  html(){
    const all = inkStore() || {}, keys = Object.keys(all), n = keys.reduce((a, k) => a + strokeCount(all[k]), 0), kb = inkBytes() / 1024;
    return `<p class="sub" id="inkSize">${keys.length ? `${keys.length} page${keys.length === 1 ? '' : 's'} with writing, ${n} stroke${n === 1 ? '' : 's'}, ${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB of this profile's progress.` : 'No writing is kept for this profile.'} The writing is part of the progress: Export progress copies it and Erase my history removes it.</p>
      ${keys.length ? `<button type="button" class="btn ghost" id="inkErase">Erase all writing</button>` : ''}`;
  },
  wire(el){
    const b = el.querySelector('#inkErase');
    if(b) b.onclick = () => {
      if(!canSave()){ alert(LOAD_FAIL + ' Nothing was erased.'); return; }
      if(!confirm(`Erase all the writing on worksheets and scratch paper for "${PROFILE}"? Answers are kept. This cannot be undone.`)) return;
      delete DB.ink; save(); renderSettings();
    };
  }
});
// a saved or imported progress: writing in any other shape than {<page>: {parts, room}} is left out
X.progress(db => {
  if(!('ink' in db)) return;
  if(!db.ink || typeof db.ink !== 'object' || Array.isArray(db.ink)){ delete db.ink; return; }
  Object.keys(db.ink).forEach(k => { const d = db.ink[k]; if(!d || typeof d.parts !== 'object' || !d.parts || Array.isArray(d.parts)) delete db.ink[k]; });
});
X.start(() => {
  document.addEventListener('click', e => { if(e.target.closest && e.target.closest('[data-inkdone]')) return inkClose(); FX.run(X.name, 'click', () => onClick(e)); });
  document.addEventListener('keydown', e => FX.run(X.name, 'keydown', () => onKey(e)));
});
X.api({sheetPlan, sheetHTML, solvedBy, setNumbers, sharedLead, dropCarry, dropMarker, wsOrder, inkRecognize, inkOpen, inkClose,
       inkCount, inkBytes, inkKey, renderSheets, startSheetSet, state: () => INK, SRC_BY, SRC_OF});
