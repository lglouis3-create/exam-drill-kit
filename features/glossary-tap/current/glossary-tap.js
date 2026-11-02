/* ==========================================================================
   GLOSSARY AND TAP A TERM (feature module glossary-tap v1)
   ==========================================================================
   Two parts, both reading the course's TERMS (a data file listed in course.js
   `files`; one object per term: id, term, group, def, cite, and optionally
   gist, scene, hook, lecture, fig):

   1. A Glossary tab, ported from Intro to Pharmacology (exam1-drill/src/app.js
      lines 1771-1922 at 929cd62: termLetter, termHTML, glossWire and the
      glossary branch of vTerms). Every term with its one-line meaning,
      definition, "In action" situation, the professor's example, its figure
      (a key of diagrams.js DIA) and its source. A search box filters as you
      type (name, one-line meaning, definition, situation) and lists the terms
      whose name matches first, then the terms that only mention the word; a
      letter bar jumps to a letter (switching to A-Z order); the order is by
      group or A-Z; group chips narrow the list; and a floating button returns
      to the search bar once it has scrolled off the screen.

   2. Tap a term (option `tap`, on by default). Intro to Pharmacology has no
      code for this part; it is written for the kit. After an answer is shown
      (the quiz card and the exam review), the first mention of each glossary
      term in a question's explanations and concept block is a button; in the
      Guides, Tell apart and Reference tabs, the first mention in each section
      (each h3). Tapping it opens the term's one-line meaning, definition and
      source under the line, with a button to the term in the Glossary tab;
      tapping it again closes it. Nothing is marked before the answer is shown.

   What the core already does, and this module leaves to it: glossary.js GLOSS
   adds a short definition in brackets after the first use of a term in an
   explanation (views.js glossify). A term the core has glossed there is not
   made a button in that question, and a term a reading section defines in its
   own word list (<dt>) is not made a button in that section, so a definition
   is never shown twice in one place. Text inside a heading, a button, a link,
   a figure, a quotation (blockquote, q, the source line's quote, or words in
   quotation marks, unless the quotation is a term's name alone), an option's
   own text and the core's bracketed glosses is left as it is. The text is
   changed only between tags, so only the buttons are added.
   With formulas-in-text on, its pass over a question card is run before the
   buttons are added, whichever module course.js lists first: it leaves alone
   an element that holds a button, so the other order would leave {{frac:}}
   and the subscripts unset.
   Other modules use it through FX.api('glossary-tap'): {terms, nameOf, find}.
   ========================================================================== */
const ALL = (typeof TERMS === 'undefined' || !Array.isArray(TERMS)) ? [] : TERMS;
const BY_ID = Object.fromEntries(ALL.map(t => [t.id, t]));
const fmtCite = s => String(s == null ? '' : s).replace(/–~/g, '–');
/* the name a term is found by in text: its name without a closing bracket
   (Intro to Pharmacology app.js termName: "Pharmacodynamics (PD)" is found
   as "Pharmacodynamics") */
const nameOf = t => String(t.term).replace(/\s*\([^)]*\)\s*$/, '').trim();
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = s => s.toLowerCase().replace(/\s+/g, ' ');
const SKIPPED = new Set(OPT.notTapped || []);
const TAPPABLE = ALL.filter(t => !SKIPPED.has(t.id) && nameOf(t).length >= 2);
const BY_NAME = {};
TAPPABLE.forEach(t => { BY_NAME[norm(nameOf(t))] = t; });
/* one pattern for every name, longest first, so "Partial agonist" is found
   before "Agonist"; a name is a whole word (no letter or digit on either side;
   the side before is matched as a character, since a lookbehind does not parse
   on older Safari), with an optional plural s or es */
const NAME_RE = TAPPABLE.length ? new RegExp('(^|[^A-Za-z0-9])((?:' + Object.keys(BY_NAME)
  .sort((a, b) => b.length - a.length).map(n => reEsc(n).replace(/ /g, '\\s+')).join('|')
  + ')(?:e?s)?)(?![A-Za-z0-9])', 'gi') : null;
const termOf = w => { const k = norm(w); return BY_NAME[k] || BY_NAME[k.replace(/s$/, '')] || BY_NAME[k.replace(/es$/, '')] || null; };
/* every term named in a plain text, in order, each once: [[id, the words], ...] */
function find(text){
  const out = [], seen = new Set();
  if(!NAME_RE) return out;
  NAME_RE.lastIndex = 0;
  let m;
  while((m = NAME_RE.exec(text))){
    const t = termOf(m[2]);
    if(t && !seen.has(t.id)){ seen.add(t.id); out.push([t.id, m[2]]); }
    if(m[0] === '') NAME_RE.lastIndex++;
  }
  return out;
}

/* ---- the Glossary tab (Intro to Pharmacology app.js 1771-1922, 929cd62) --- */
const G = {q: '', order: 'group', group: 'all'};
let GIO = null;          // the scroll watcher for the floating button; one at a time
const groupsOf = () => [...new Set(ALL.map(t => t.group))];
const LETTERS_AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat('#');
const termLetter = t => { const c = (t.term.match(/[A-Za-z]/) || [''])[0].toUpperCase(); return /^[A-Za-z]/.test(t.term.trim()) ? c : '#'; };
const byName = l => l.slice().sort((a, b) => a.term.localeCompare(b.term, undefined, {sensitivity: 'base'}));
const figOf = t => (t.fig && typeof DIA !== 'undefined' && DIA[t.fig]) ? `<div class="gtfig">${DIA[t.fig]}</div>` : '';
const termHTML = t => `<div class="gterm" id="gt-${esc(t.id)}"><b>${esc(t.term)}</b>${t.gist ? `<div class="gist">${esc(t.gist)}</div>` : ''}<div>${esc(t.def)}</div>${
  t.scene ? `<div class="hook"><b>In action:</b> ${esc(t.scene)}</div>` : ''}${t.hook ? `<div class="hook">${esc(t.hook)}</div>` : ''}${figOf(t)}<div class="cite">${esc(fmtCite(t.cite))}</div></div>`;
const chip = (attr, val, on, label) => `<button type="button" class="chip" ${attr}="${esc(val)}" aria-pressed="${on}">${label}</button>`;

function renderGlossary(pane){
  const old = document.getElementById('gtback'); if(old) old.remove();
  if(GIO){ GIO.disconnect(); GIO = null; }
  if(!ALL.length){ pane.innerHTML = `<h2>${esc(OPT.label)}</h2><div class="empty">No glossary terms in this build.</div>`; return; }
  const groups = groupsOf();
  if(G.group !== 'all' && !groups.includes(G.group)) G.group = 'all';
  const pool = ALL.filter(t => G.group === 'all' || t.group === G.group);
  const have = new Set(pool.map(termLetter));
  pane.innerHTML = `<h2>${esc(OPT.label)}</h2><p class="sub">${ALL.length} term${ALL.length === 1 ? '' : 's'}, each with its source.${
      OPT.tap ? ' After an answer is shown, a term named in its explanation is underlined: tap it for its definition. The Guides, Tell apart and Reference tabs underline the terms the same way.' : ''}</p>
    ${groups.length > 1 ? `<div class="panel"><div class="row"><span class="meta">Group:</span>${['all'].concat(groups).map(g => chip('data-gtgroup', g, G.group === g, g === 'all' ? 'All' : esc(g))).join('')}</div></div>` : ''}
    <div class="panel gtbar" id="gtbar"><div class="row gtsrow"><input id="gtsearch" type="search" placeholder="Search the terms (name, meaning or example)" value="${esc(G.q)}" autocomplete="off" aria-label="Search the terms">
      <button class="btn ghost" id="gtclear" type="button"${G.q ? '' : ' hidden'}>Clear</button></div>
      <div class="gtletters" role="navigation" aria-label="Jump to a letter">${LETTERS_AZ.filter(L => L !== '#' || have.has('#')).map(L => `<button type="button" class="gtlt" data-gtlt="${L}"${have.has(L) ? '' : ' disabled'}>${L}</button>`).join('')}</div>
      <div class="row" style="margin-top:6px"><span class="meta">Order:</span>${[['group', 'By group'], ['az', 'A–Z']].map(([k, l]) => chip('data-gtorder', k, G.order === k, l)).join('')}<span class="meta" id="gtcount" aria-live="polite" style="margin-left:auto"></span></div></div>
    <div id="gtlist"></div>`;
  const box = pane.querySelector('#gtsearch'), list = pane.querySelector('#gtlist');
  const draw = () => {
    const q = G.q.trim().toLowerCase();
    let shown = pool;
    if(q) shown = shown.filter(t => [t.term, t.gist, t.def, t.scene].join(' ').toLowerCase().includes(q));
    let h = '';
    if(!shown.length) h = q ? `<div class="empty">No term matches “${esc(G.q.trim())}”. Try a shorter word, or pick a letter above.</div>` : '<div class="empty">No terms in this group.</div>';
    else if(q){
      // a search lists the terms whose name matches first, then the terms that only mention the word
      const named = shown.filter(t => t.term.toLowerCase().includes(q)), rest = shown.filter(t => !named.includes(t));
      if(named.length) h += `<h3>Term names with “${esc(G.q.trim())}”</h3><div class="panel">${byName(named).map(termHTML).join('')}</div>`;
      if(rest.length) h += `<h3>Also mentioned in</h3><div class="panel">${byName(rest).map(termHTML).join('')}</div>`;
    } else if(G.order === 'az'){
      const byL = {};
      byName(shown).forEach(t => (byL[termLetter(t)] = byL[termLetter(t)] || []).push(t));
      LETTERS_AZ.filter(L => byL[L]).forEach(L => { h += `<h3 id="gtl-${L === '#' ? 'num' : L}">${L}</h3><div class="panel">${byL[L].map(termHTML).join('')}</div>`; });
    } else {
      h = groups.filter(g => G.group === 'all' || g === G.group).map(g => { const ts = shown.filter(t => t.group === g);
        return ts.length ? `<h3>${esc(g)}</h3><div class="panel">${ts.map(termHTML).join('')}</div>` : ''; }).join('');
    }
    list.innerHTML = h;
    pane.querySelector('#gtcount').textContent = q ? `${shown.length} match${shown.length === 1 ? '' : 'es'}` : `${shown.length} term${shown.length === 1 ? '' : 's'}`;
    pane.querySelector('#gtclear').hidden = !G.q;
  };
  const orderOn = k => pane.querySelectorAll('[data-gtorder]').forEach(x => x.setAttribute('aria-pressed', x.dataset.gtorder === k));
  box.oninput = () => { G.q = box.value; draw(); };
  pane.querySelector('#gtclear').onclick = () => { G.q = ''; box.value = ''; draw(); box.focus(); };
  pane.querySelectorAll('[data-gtorder]').forEach(c => c.onclick = () => { G.order = c.dataset.gtorder; orderOn(G.order); draw(); });
  pane.querySelectorAll('[data-gtgroup]').forEach(c => c.onclick = () => { G.group = c.dataset.gtgroup; renderGlossary(pane); });
  pane.querySelectorAll('[data-gtlt]').forEach(b => b.onclick = () => {
    if(G.q){ G.q = ''; box.value = ''; }
    if(G.order !== 'az'){ G.order = 'az'; orderOn('az'); }
    draw();
    const el = document.getElementById('gtl-' + (b.dataset.gtlt === '#' ? 'num' : b.dataset.gtlt));
    if(el) scrollToEl(el);
  });
  draw();
  // the floating "back to search" once the bar has scrolled away
  const bar = pane.querySelector('#gtbar');
  if(window.IntersectionObserver){
    const hd = document.querySelector('header'), top = Math.round((hd ? hd.getBoundingClientRect().height : 0) + 4);
    const io = GIO = new IntersectionObserver(([e]) => {
      let b = document.getElementById('gtback');
      if(e.isIntersecting || VIEW !== 'glossary' || !document.body.contains(bar)){ if(b) b.remove(); if(!document.body.contains(bar)) io.disconnect(); return; }
      if(!b){ b = document.createElement('button'); b.id = 'gtback'; b.type = 'button'; b.className = 'btn'; b.textContent = '↑ Search or pick a letter'; document.body.appendChild(b); }
      b.onclick = () => { scrollToEl(bar); b.remove(); };
    }, {rootMargin: `-${top}px 0px 0px 0px`});
    io.observe(bar);
  }
}
X.tab({id: 'glossary', label: OPT.label, before: OPT.before, render: renderGlossary});

/* ---- tap a term (written for the kit) ------------------------------------ */
const NO_TAP = 'A,BUTTON,SELECT,INPUT,TEXTAREA,LABEL,SUMMARY,SVG,FIGURE,IMG,H1,H2,H3,H4,H5,H6,SCRIPT,STYLE,CODE,NAV,BLOCKQUOTE,Q';
const NO_TAP_SET = new Set(NO_TAP.split(','));
const noTapClass = el => el.classList && (el.classList.contains('gloss') || el.classList.contains('gtap-box') ||
  el.classList.contains('refnav-wrap') || el.classList.contains('verdict') || el.classList.contains('cite') || el.classList.contains('quote'));
/* the stretches of a text inside quotation marks (“…” or ‘…’), each [from, to)
   without the marks: quoted words are the speaker's or the slide's own */
function quotedIn(text){
  const out = [];
  for(const [o, c] of [['\u201c', '\u201d'], ['\u2018', '\u2019']]){
    let i = text.indexOf(o);
    while(i >= 0){ const j = text.indexOf(c, i + 1); if(j < 0) break; out.push([i + 1, j]); i = text.indexOf(o, j + 1); }
  }
  return out;
}
/* Make the first mention of each term a button, in the text of `root`. `seen`
   holds the terms already marked (or already defined) in this question or
   section; `resetAt` names an element (H3) that starts a new section. */
function tapText(root, seen, resetAt){
  const jobs = [];
  const walk = (node) => {
    for(let n = node.firstChild; n; n = n.nextSibling){
      if(n.nodeType === 1){
        const tag = n.tagName.toUpperCase();
        if(resetAt && tag === resetAt) seen.clear();
        if(n.classList && n.classList.contains('gtap')){ seen.add(n.dataset.term); continue; }
        if(tag === 'DT'){ find(n.textContent).forEach(([id]) => seen.add(id)); continue; }   // the section defines it in its own words
        if(NO_TAP_SET.has(tag) || noTapClass(n)) continue;
        if(tag === 'B' && n.parentElement && n.parentElement.classList.contains('wtxt')) continue;   // an option's own text
        walk(n);
      } else if(n.nodeType === 3 && NAME_RE){
        const text = n.nodeValue, quoted = quotedIn(text);
        NAME_RE.lastIndex = 0;
        let m; const hits = [];
        while((m = NAME_RE.exec(text))){
          const t = termOf(m[2]);
          if(!t || seen.has(t.id)) continue;
          const at = m.index + m[1].length, end = at + m[2].length;
          // inside a quotation the term is left alone, unless the quotation is its name alone (“cheese effect”)
          const qt = quoted.find(([a, b]) => at < b && end > a);
          if(qt && text.slice(qt[0], qt[1]).trim().toLowerCase() !== m[2].toLowerCase()) continue;
          // the core has glossed this mention in brackets right after it: leave it to the core
          const nx = n.nextSibling;
          if(/^\s*$/.test(text.slice(end)) && nx && nx.nodeType === 1 && nx.classList && nx.classList.contains('gloss')){ seen.add(t.id); continue; }
          seen.add(t.id);
          hits.push([at, end, t]);
        }
        if(hits.length) jobs.push([n, hits]);
      }
    }
  };
  walk(root);
  for(const [n, hits] of jobs){
    const text = n.nodeValue, frag = document.createDocumentFragment();
    let pos = 0;
    for(const [at, end, t] of hits){
      if(at > pos) frag.appendChild(document.createTextNode(text.slice(pos, at)));
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'gtap'; b.dataset.term = t.id;
      b.setAttribute('aria-expanded', 'false');
      b.title = 'Definition of ' + t.term;
      b.textContent = text.slice(at, end);
      frag.appendChild(b);
      pos = end;
    }
    if(pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    n.parentNode.replaceChild(frag, n);
  }
}
/* the units a term is marked once in: a question card's explanations, or a reading tab's sections */
function tapPane(pane, view){
  if(!OPT.tap || !NAME_RE) return;
  if(view === 'quiz' || view === 'exam'){
    /* formulas-in-text, when the course has it on, rewrites the same explanations
       after they are drawn and leaves alone an element that holds a button. The
       two modules' hooks run in course.js order, so when this one runs first its
       buttons would leave the formulas unset ({{frac:...}} shown as typed). Its
       pass is run here first (it marks what it has done, so it does not run twice). */
    const fx = FX.api('formulas-in-text');
    if(fx && typeof fx.setPane === 'function') FX.run('formulas-in-text', 'rendered', () => fx.setPane(pane));
    pane.querySelectorAll('.qcard').forEach(card => {
      const parts = [...card.querySelectorAll('.wtxt, .teach')].filter(p => !p.hasAttribute('data-gtap'));
      if(!parts.length) return;
      // a term the core has glossed anywhere in this card is the core's
      const seen = new Set([...card.querySelectorAll('.gtap')].map(b => b.dataset.term));
      card.querySelectorAll('.gloss').forEach(g => { const p = g.previousSibling; if(p && p.nodeType === 3){ const f = find(p.nodeValue); if(f.length) seen.add(f[f.length - 1][0]); } });
      parts.forEach(p => { p.setAttribute('data-gtap', '1'); tapText(p, seen, null); });
    });
  } else if(view === 'guide' || view === 'tell' || view === 'ref'){
    const first = pane.firstElementChild;
    if(!first || first.hasAttribute('data-gtap')) return;
    first.setAttribute('data-gtap', '1');
    tapText(pane, new Set(), 'H3');
  }
}
X.rendered((pane, view) => tapPane(pane, view));

/* the definition under the line, opened and closed by the term's button */
function boxFor(b){
  const t = BY_ID[b.dataset.term];
  const d = document.createElement('div');
  d.className = 'gtap-box'; d.setAttribute('role', 'note');
  d.innerHTML = `<b>${esc(t.term)}</b>${t.gist ? `<div class="gist">${esc(t.gist)}</div>` : ''}<div>${esc(t.def)}</div><div class="cite">${esc(fmtCite(t.cite))}</div>
    <button type="button" class="chip" data-gtopen="${esc(t.id)}">Open in the ${esc(OPT.label)}</button>`;
  return d;
}
function toggle(b){
  const open = b.getAttribute('aria-expanded') === 'true';
  if(open){
    const d = b._gtbox; if(d) d.remove();
    b._gtbox = null; b.setAttribute('aria-expanded', 'false');
    return;
  }
  const d = boxFor(b);
  const host = b.closest('.wrow, p, li, dd, td, th, blockquote, .teach, div') || b.parentElement;
  if(host.matches('.wrow, p')) host.after(d); else host.appendChild(d);
  b._gtbox = d; b.setAttribute('aria-expanded', 'true');
}
X.start(() => {
  document.addEventListener('click', e => {
    if(!FX.on('glossary-tap')) return;
    const b = e.target.closest && e.target.closest('button.gtap');
    if(b && BY_ID[b.dataset.term]){ FX.run('glossary-tap', 'tap', () => toggle(b)); return; }
    const o = e.target.closest && e.target.closest('[data-gtopen]');
    if(o && BY_ID[o.dataset.gtopen]){
      FX.run('glossary-tap', 'open', () => { G.q = ''; G.group = 'all'; jump('glossary', 'gt-' + o.dataset.gtopen); });
    }
  });
});

X.api({terms: ALL, nameOf, find});
