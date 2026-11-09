
/* ==========================================================================
   STRUCTURE SHOWN WITH A QUESTION
   ==========================================================================
   Atlas structures are drawn at the size an atlas tile wants, which is small
   enough to fit dozens on a screen. A question shows one structure and the
   reader has to count atoms in it, so each is scaled up to a common size
   before it goes on the page. Scaling by the larger dimension keeps a wide
   tricyclic and a four-membered ring at comparable visual weight instead of
   making one of them fill the card.
   ========================================================================== */
/* Natural sizes run from 59px across (aziridine) to 166px (dibenzazepine), so
   a single target with a capped multiplier brings the small rings up without
   blowing the tricyclics past the width of the card. */
const FG_TARGET = 240;   // px across the structure's larger dimension

function fgScale(svg, target, floor){
  if(!svg) return '';
  const w = +(svg.match(/\bwidth="(\d+(?:\.\d+)?)"/)  || [])[1];
  const h = +(svg.match(/\bheight="(\d+(?:\.\d+)?)"/) || [])[1];
  if(!w || !h) return svg;
  const k = Math.min(3.6, Math.max(floor, target / Math.max(w, h)));
  return svg.replace(/\bwidth="[\d.]+"/,  `width="${(w*k).toFixed(0)}"`)
            .replace(/\bheight="[\d.]+"/, `height="${(h*k).toFixed(0)}"`);
}

/* Resolve an option's wording to an atlas key. Option text says
   "Tetrahydrofuran" or "Epoxide"; the atlas key is "Tetrahydrofuran THF" or
   "Epoxide oxirane". Exact match first, then case-insensitive, then the
   atlas key whose first word is the whole option, so a structure is drawn
   whenever one exists for that group and never for a different one. */
/* Built while the page starts, from an optional course table: a table of the
   wrong shape leaves the index empty (no structure is drawn with an option),
   with the error on the console, rather than stopping the page's script. */
const FG_KEYS = (() => { try { return (typeof FG !== 'undefined') ? Object.keys(FG) : []; }
  catch(e){ console.error('The structure index (FG) could not be built; options are shown without structures.', e); return []; } })();
const FG_INDEX = (() => {
  const ix = {};
  try {
    FG_KEYS.forEach(k => {
      ix[k.toLowerCase()] = k;
      const first = k.toLowerCase().split(' ')[0];
      if(!(first in ix)) ix[first] = k;
    });
  } catch(e){ console.error('The structure index (FG) could not be built; options are shown without structures.', e); return {}; }
  return ix;
})();
function fgKey(name){
  if(!name) return null;
  if(typeof FG !== 'undefined' && FG[name]) return name;
  const lc = String(name).toLowerCase().trim();
  return FG_INDEX[lc] || null;
}

function fgShow(key){
  const k = fgKey(key);
  const svg = (k && typeof FGQ !== 'undefined' && FGQ[k]) || '';
  return svg ? `<div class="fgshow">${fgScale(svg, FG_TARGET, 1.4)}</div>` : '';
}

/* ==========================================================================
   SIDE-BY-SIDE STRUCTURES
   ==========================================================================
   Describing a difference in words and drawing it are not the same thing. Two
   rings that differ by one atom read as near-identical sentences and as
   obviously different pictures, so wherever an explanation compares named
   groups, the structures go next to each other and the sentence says what to
   look at.

   Names come from the atlas, so a group that is discussed but not drawn there
   is left out rather than faked. `cmpNames(q)` is what any question can set
   through `cmp`; a question whose options are all atlas groups gets the
   comparison built from its own options without having to declare anything.
   ========================================================================== */
const CMP_TARGET = 132;   // px, smaller than the question's own structure

function fgName(key){
  const it = (typeof ATLAS !== 'undefined' ? ATLAS.item(key) : null);
  return it ? it.n : esc(key);
}
function fgTell(key){
  const it = (typeof ATLAS !== 'undefined' ? ATLAS.item(key) : null);
  if(!it) return '';
  /* the first clause of the atlas tell: what to look at, without the
     consequence trailing behind it */
  const plain = String(it.t).replace(/<[^>]+>/g, '');
  const stop = plain.search(/[.!?]/);
  return deEnt(stop > 0 ? plain.slice(0, stop + 1) : plain);
}

/* Which groups a question compares. An explicit `cmp` wins; otherwise a
   question whose every option names an atlas group compares its own options,
   which is exactly the set the reader was choosing between. The right answer
   leads, because the row is read as "this one, and here is what each of the
   others would have looked like". */
function cmpNames(q){
  if(Array.isArray(q.cmp)) return q.cmp.map(fgKey).filter(Boolean);
  const opts = (q.options || []).map(o => fgKey(o.t));
  if(!opts.length || !opts.every(Boolean)) return [];
  const right = fgKey(((q.options || []).find(o => o.correct) || {}).t);
  return right ? [right, ...opts.filter(t => t !== right)] : opts;
}

function cmpStrip(q, heading){
  const names = cmpNames(q);
  if(names.length < 2) return '';
  const right = (q.options || []).filter(o => o.correct).map(o => fgKey(o.t));
  const cells = names.map(k => {
    const ok = right.includes(k);
    return `<figure class="cmpcell${ok ? ' is-ok' : ''}">
      <div class="cmpfig">${fgScale(FG[k], CMP_TARGET, 1.15)}</div>
      <figcaption><b>${fgName(k)}${ok ? '<i>the answer</i>' : ''}</b>${
        fgTell(k) ? `<span>${esc(fgTell(k))}</span>` : ''}</figcaption>
    </figure>`;
  }).join('');
  return `<div class="cmp">${heading ? `<h5>${esc(heading)}</h5>` : ''}
    <div class="cmprow">${cells}</div></div>`;
}

/* The structure for one option, drawn beside its explanation so the reader is
   not asked to hold four shapes in mind while reading about them. */
function optFig(name){
  const k = fgKey(name);
  const svg = (k && typeof FG !== 'undefined' && FG[k]) || '';
  return svg ? `<span class="wfig">${fgScale(svg, 84, 1)}</span>` : '';
}

/* ==========================================================================
   CONCEPT BLOCKS
   ==========================================================================
   `teach` is either a plain string or a list of {h, t} sections. A long block
   of unbroken prose is hard to scan and hard to re-read selectively, so a
   question whose concept splits into distinct parts — the mechanism, the
   category it belongs to, what it connects to — carries them as named
   sections instead. Both forms render, so no question has to be rewritten.
   ========================================================================== */
const teachParts = t => Array.isArray(t)
  ? t.filter(p => p && p.t).map(p => ({h: p.h, t: String(p.t)}))
  : (t ? [{t: String(t)}] : []);
const teachText  = t => teachParts(t).map(p => p.t).join(' ');

function renderTeach(t, seen, self){
  return teachParts(t).map(p =>
    (p.h ? `<h5 class="tsec">${esc(p.h)}</h5>` : '') +
    `<p class="prose">${seen ? glossify(esc(p.t), seen, self) : esc(p.t)}</p>`
  ).join('');
}

/* Adds each term's definition once per question, at its first appearance.
   `seen` is shared across the option explanations and the concept block, so a
   term is defined once and not at every mention. The text arrives escaped;
   insertions run right-to-left so earlier offsets stay valid. */
function glossify(txt, seen, self){
  const ins = [];
  for(const g of GLOSS){
    if(seen.has(g.k)) continue;
    if(g.skip.test(self)) { seen.add(g.k); continue; }
    const m = txt.match(new RegExp('\\b(' + g.p + ')', 'i'));
    if(!m) continue;
    seen.add(g.k);
    ins.push([m.index + m[0].length, g.d]);
  }
  ins.sort((a,b) => b[0] - a[0]);
  let out = txt;
  for(const [at, d] of ins)
    out = out.slice(0, at) + ' <span class="gloss">(' + d + ')</span>' + out.slice(at);
  return out;
}

/* ==========================================================================
   FILTERS + VIEW ROUTING
   ========================================================================== */
const FILTER = {prof:'all', tier:'all', tag:'all'};
let VIEW = 'topics';

function matchesFilter(q){
  if(FILTER.prof !== 'all' && q.prof !== FILTER.prof) return false;
  if(FILTER.tier !== 'all' && q.tier !== FILTER.tier) return false;
  if(FILTER.tag  !== 'all' && !(q.types||[]).includes(FILTER.tag)) return false;
  return true;
}
/* A topic or subtopic set holds every question of it; with no topic named (Everything,
   adaptive, the filtered pass, the count on Start practice) an optional topic is left
   out (OPTIONAL_TOPICS, shell.html). */
function poolFor(topicId, subId){
  return QUESTIONS.filter(q =>
    (topicId ? q.topic === topicId : !isOptional(q)) &&
    (!subId   || q.sub   === subId)   &&
    matchesFilter(q));
}
/* Question formats describe the TASK a stem sets (a format chip row in the
   filter bar). Derived from each question rather than hand-tagged, so every
   file follows the same scheme. */
const TYPE_LABEL = {
  structure:'read a structure', enzyme:'name the enzyme or cofactor',
  predict:'predict the outcome', define:'define a term',
  list:'list or rank', tf:'true or false'};
/* What a question asks the student to do. One class per question, judged from
   the stem and the figure, in this order: a scheme or structure to read; a
   patient or drug scenario to work; two similar things to tell apart; the
   fact itself. Used by Weak spots to say which kind of thinking is failing. */
const SKILLS = COURSE.skills.map(s => [s.id, s.label]);
const SKILL_SHORT = Object.fromEntries(COURSE.skills.map(s => [s.id, s.short || s.label]));
const SKILL_LABEL = Object.fromEntries(COURSE.skills.map(s => [s.id, s.label]));
function skillOf(q){
  if(q.skill && SKILL_LABEL[q.skill]) return q.skill;   // set when the question was written
  if(q._skill) return q._skill;
  const s = q.stem, tags = q.tags || [];
  let k;
  if(q.img || q.fg || /\bshown\b|scheme below|plot shows|reaction below|circled|which number/i.test(s)) k = 'read';
  else if(tags.includes('case') || /patient|dialysis|is given|starts (a |an |taking |smoking|rifamp)|receives|takes |co-administ|overdose|what happens|expect|outcome|likely|develops|prescrib|a drug (that|with|has|is)|two drugs|two highly/i.test(s)) k = 'apply';
  else if(tags.includes('compare') || /differ|distinguish|\bboth\b|rather than|instead of|versus|\bvs\b|respectively|EXCEPT|WRONG|\bNOT\b|compared|in common|tell|which (one|two) of|same|apart|which of the (two|four)|only\b/i.test(s)) k = 'tell';
  else k = 'recall';
  return (q._skill = k);
}
function typesOf(q){
  const s = q.stem, t = new Set();
  if (/^true or false/i.test(s)) t.add('tf');
  if (q.img || /shown|below|structure|which number|circled/i.test(s)) t.add('structure');
  if (/enzyme|cofactor|co-factor|isoform|which family/i.test(s)) t.add('enzyme');
  if (/rank|order|itemize|list|how many|which set|which combination/i.test(s)) t.add('list');
  if (/what is |what does |defined|definition|term/i.test(s)) t.add('define');
  if (/patient|what happens|outcome|expect|predict|why does|explain|consequence|likely/i.test(s)) t.add('predict');
  if (!t.size) t.add((q.tags||[]).includes('definition') ? 'define' : 'predict');
  return [...t];
}
QUESTIONS.forEach(q => { q.types = typesOf(q); });
const ALL_TAGS = Object.keys(TYPE_LABEL).filter(k => QUESTIONS.some(q=>q.types.includes(k)));

const VIEWS = ['topics','quiz','gaps','exam','atlas','diagrams','guide','tell','ref','settings'];
function show(v){
  figClose();
  VIEW = v;
  document.querySelectorAll('#nav button').forEach(b=>b.setAttribute('aria-selected', b.dataset.v===v));
  VIEWS.forEach(k=> document.getElementById('v-'+k).classList.toggle('hide', k!==v));
  window.scrollTo(0,0);
  ({topics:renderTopics, quiz:renderQuiz, gaps:renderGaps, exam:renderExam,
    atlas:renderAtlas, diagrams:renderDiagrams, guide:renderGuide, tell:renderTell,
    ref:renderRef, settings:renderSettings}[v])();
  navReveal(v);
  armFigs(document.getElementById('v-' + v));
}

/* ---------- the tab bar on a narrow screen ----------
   The tabs scroll sideways when they do not fit (a phone, a tablet in portrait).
   The bar shows a chevron on the side that has more tabs (more-l, more-r, drawn
   in shell.html; tapping it scrolls that way), and the tab opened is scrolled
   into view, so a tab reached from a link is never left off the edge. */
function navCue(){
  const n = document.getElementById('nav');
  if(!n || !n.classList || typeof n.scrollWidth !== 'number') return;
  // the header wraps to two lines or more on a phone when the course title is
  // long, so the bar sits below the header's real height, not a fixed 44 px
  const hd = document.querySelector('header');
  if(hd && document.documentElement.style){
    document.documentElement.style.setProperty('--head-h', hd.offsetHeight + 'px');
    document.documentElement.style.setProperty('--nav-h', n.offsetHeight + 'px');
  }
  const max = n.scrollWidth - n.clientWidth;
  n.classList.toggle('more-l', max > 1 && n.scrollLeft > 1);
  n.classList.toggle('more-r', max > 1 && n.scrollLeft < max - 1);
}
function navReveal(v){
  const n = document.getElementById('nav');
  const b = n && n.querySelector && n.querySelector(`button[data-v="${v}"]`);
  if(!b || typeof b.getBoundingClientRect !== 'function' || typeof n.scrollWidth !== 'number') return navCue();
  const nr = n.getBoundingClientRect(), br = b.getBoundingClientRect(), pad = 30;
  if(br.left < nr.left + pad) n.scrollLeft -= (nr.left + pad - br.left);
  else if(br.right > nr.right - pad) n.scrollLeft += (br.right - nr.right + pad);
  navCue();
}


/* ==========================================================================
   JUMPING TO A READING SECTION, AND BACK
   ==========================================================================
   A question's "Explain more" chip and the review plan's "Read" chip both open
   the section of a reading tab that teaches the item. The stack remembers where
   the reader came from, and a floating button walks back down it, because
   otherwise following a link out of a half-answered question loses the place. */
/* Scroll so the target sits below the sticky header and nav rather than under
   them, which is what scrollIntoView on its own does here. */
const headerOffset = () => {
  const h = document.querySelector('header'), n = document.getElementById('nav');
  return (h ? h.getBoundingClientRect().height : 0) + (n ? n.getBoundingClientRect().height : 0) + 8;
};
const reduceMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function scrollToEl(el){
  if(!el) return;
  window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - headerOffset(),
                   behavior: reduceMotion() ? 'auto' : 'smooth'});
}
const RET = [];
const VIEW_NAME = {quiz:'the question', exam:'the exam', gaps:'weak spots', diagrams:'the diagrams',
                   topics:'the topics', ref:'the reference', tell:'tell apart', guide:'the guides',
                   atlas:'the atlas', settings:'settings'};
function jump(view, anchor){
  RET.push({view: VIEW, y: window.scrollY});
  show(view);
  const t = anchor && document.getElementById(anchor);
  if(t) scrollToEl(t);
  backBtn();
}
function backBtn(){
  let b = document.getElementById('backbtn');
  if(!RET.length){ if(b) b.remove(); return; }
  if(!b){
    b = document.createElement('button');
    b.id = 'backbtn'; b.type = 'button'; b.className = 'btn';
    document.body.appendChild(b);
    b.onclick = () => { const r = RET.pop(); backBtn(); show(r.view); window.scrollTo(0, r.y); };
  }
  b.textContent = '← Back to ' + (VIEW_NAME[RET[RET.length-1].view] || 'where you were');
}
document.addEventListener('click', e => {
  const j = e.target.closest('[data-jump]');
  if(j){ const [v, a] = j.dataset.jump.split(':'); jump(v, a); }
});

/* The sections that explain a question: its own `read`, then the course's table
   in links.js, then its subtopic, then its lecture. */
function linksFor(q){
  if(Array.isArray(q.read) && q.read.length) return q.read;
  const L = (typeof READ_LINKS !== 'undefined') ? READ_LINKS : {};
  const key = [q.concept, q.fg, q.sub, (q.tags||[]).join(' ')].join(' ').toLowerCase();
  for(const [re, links] of (L.byKey || [])) if(re.test(key)) return links;
  if(L.bySub && L.bySub[q.sub]) return [L.bySub[q.sub]];
  const lec = lecOf(q);
  if(L.byLecture && lec && L.byLecture[lec.id]) return [L.byLecture[lec.id]];
  return [];
}
const explainRow = q => {
  const l = linksFor(q);
  return l.length ? `<div class="row explain" style="display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin-top:12px">
    <span class="meta">Explain more:</span>${l.map(([v,a,t]) =>
      `<button type="button" class="chip" data-jump="${esc(v)}:${esc(a)}">${esc(t)}</button>`).join('')}</div>` : '';
};

/* ==========================================================================
   THIS SESSION
   ==========================================================================
   A session is the run of answers with no gap longer than 30 minutes, ending
   with the latest one, so it survives a reload and a break of a few minutes but
   does not quietly merge yesterday's work into today's score. An answer counts
   as solid when it was correct and was not marked a guess or "not sure". */
const SESSION_GAP = 30*60*1000;
const solidEntry = e => e.result === 'correct' && e.conf !== 'shaky';
function sessionLog(){
  const L = DB.answers;
  if(!L.length) return [];
  let k = L.length - 1;
  while(k > 0 && L[k].at - L[k-1].at < SESSION_GAP) k--;
  return Date.now() - L[L.length-1].at < SESSION_GAP ? L.slice(k) : [];
}
function sessStrip(){
  const s = sessionLog();
  if(!s.length) return `<span class="meta" id="sess">This session: no answers yet</span>`;
  const ok = s.filter(solidEntry).length, last = s.slice(-10);
  return `<span class="meta" id="sess">This session: ${ok}/${s.length} solid (${Math.round(100*ok/s.length)}%) · last ${last.length}:
    <span class="sdots10">${last.map(e => `<i class="${solidEntry(e)?'y':'n'}" title="${esc(e.qid)}"></i>`).join('')}</span></span>`;
}
const refreshSess = () => { const el = $('#sess'); if(el) el.outerHTML = sessStrip(); };

/* ==========================================================================
   TOPICS
   ========================================================================== */
/* Marks on the active paper that fall to questions of one tier, summed over
   the pools whose filter names that tier; pools without a tier filter are
   counted as older material. */
function tierMarks(tier){
  return EXAM.pools.filter(p => (p.filter.tier || 'old') === tier).reduce((n, p) => n + p.marks, 0);
}
/* How many questions a chip would select, the other filters held as they are. */
function chipCount(g, v){
  const was = FILTER[g]; FILTER[g] = v;
  const n = QUESTIONS.filter(matchesFilter).length;
  FILTER[g] = was;
  return n;
}
/* Why the current filters select nothing, in words, for the notice on Topics. */
function emptyReason(){
  if(FILTER.prof !== 'all' && !QUESTIONS.some(q => q.prof === FILTER.prof))
    return `${esc(FILTER.prof)} has no questions in this bank yet`;
  return 'no question carries every filter chosen';
}
function filterBar(){
  // a chip that would select nothing stays listed and says so
  const chip=(g,v,l)=>{
    const n = v === 'all' ? QUESTIONS.length : chipCount(g, v);
    const yet = !n && g === 'prof' && !QUESTIONS.some(q => q.prof === v);
    const why = !n ? (yet ? 'no questions yet' : 'no questions with the other filters') : '';
    return `<button class="chip${n ? '' : ' none'}" data-f="${g}" data-v="${v}" aria-pressed="${FILTER[g]===v}"${
      why ? ` title="${why}"` : ''}>${why ? `<span>${l}</span> <small>(${yet ? why : 'none with the other filters'})</small>` : l}</button>`;
  };
  return `<div class="filters">
    <div class="frow"><label>Professor</label>
      ${chip('prof','all',COURSE.professors.length > 1 ? 'Both' : 'All')}${COURSE.professors.map(p => chip('prof',p,p)).join('')}</div>
    ${EXAM.pools.some(p => p.filter.tier) ? `<div class="frow"><label>Weighting</label>
      ${chip('tier','all','All')}${chip('tier','new',`New (${tierMarks('new')} marks)`)}${chip('tier','old',`Older (${tierMarks('old')} marks)`)}</div>` : ''}
    <div class="frow"><label>Question type</label>
      ${chip('tag','all','Any')}${ALL_TAGS.map(t=>chip('tag',t,TYPE_LABEL[t])).join('')}</div>
  </div>`;
}

/* ---------- What's new ----------
   The change log entries newer than the one this browser last marked as seen.
   One key per course, so clearing it is "show me everything since my last
   visit" rather than per-entry bookkeeping. The id carries the entry's bullet
   count, so bullets added under today's heading count as new. */
const NEWS_KEY = () => NS + ':newsSeen';
const newsId = c => c ? c.date + '|' + c.items.join('').length : '';
function newsCard(){
  const log = (BUILD.changelog || []);
  if(!log.length) return '';
  const seen = store.get(NEWS_KEY());
  const i = seen ? log.findIndex(c => newsId(c) === seen) : 1;
  const fresh = log.slice(0, i < 0 ? 1 : i);
  if(!fresh.length) return '';
  const items = fresh.flatMap(c => c.items), shown = items.slice(0, 8);
  return `<div class="panel news" id="news">
    <div class="row spread"><b>What's new</b><span class="meta">${esc(fresh[0].date.replace(/\s*\(.*\)$/, ''))}</span></div>
    <ul>${shown.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    ${items.length > shown.length ? `<p class="meta" style="margin:0 0 8px">+ ${items.length - shown.length} more</p>` : ''}
    <div class="row"><button class="btn" id="newsok">Got it</button>
      <button class="btn ghost" id="newsall">All changes</button></div></div>`;
}
/* ---------- the Home Screen card ----------
   Safari on iPhone and iPad deletes a site's saved data after 7 days without
   use unless the site is on the Home Screen (webkit.org/tracking-prevention).
   A Home Screen copy keeps its own storage, separate from Safari's (WebKit bug
   181849: "Home Screen apps are created as isolated entities"), so the card
   takes the student through Export, Add to Home Screen, Import. A browser that
   offers an install prompt gets an Install button. Ported from BDK
   (assets/app.js: homeCard, homeCardInner, wireHome, refreshHomeCards). The
   card shows only in Settings, where Export and Import are, as a section that
   starts closed: its heading is the one line on show until it is opened
   (Louis, 2026-11-01). Topics shows no card; the `<ns>:homeTipDismissed` key
   its "Not now" button wrote is no longer read. */
const WEBKIT_ITP = 'https://webkit.org/tracking-prevention/';
// navigator and matchMedia are read only when asked, so the engine still loads
// where they are absent (the node checks)
const isStandalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch(e){ return false; } };
const isIOS = () => { try { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); } catch(e){ return false; } };
let installPrompt = null;
/* The section's heading (its <summary>) and what opening it shows. */
function homeCardInner(){
  const name = esc(COURSE.short || COURSE.title);
  if(isStandalone()){
    if(!isIOS() || DB.answers.length) return '';
    return `<summary>Progress from Safari</summary>
      <p class="meta" style="margin:8px 0 2px">This Home Screen copy of ${name} keeps its own progress, separate from Safari's. To bring your progress here, open the drill in Safari, tap <b>Export progress</b> in Settings, then come back here and use <b>Import progress</b> in Settings.</p>`;
  }
  if(isIOS()){
    return `<summary>Keep your progress: add ${name} to your Home Screen</summary>
      <p class="meta" style="margin:8px 0 4px">Safari on iPhone and iPad deletes a website's saved data after 7 days without use, unless the site is on the Home Screen (<a href="${WEBKIT_ITP}" target="_blank" rel="noopener">WebKit</a>). The Home Screen copy keeps its own progress, separate from Safari's, so bring yours across:</p>
      <ol class="hs-steps"><li>Tap <b>Export progress</b> below. It saves a file.</li><li>In Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>.</li><li>Open the drill from the new icon, go to <b>Settings</b>, tap <b>Import progress</b> and choose the file.</li></ol>
      <div class="row"><button class="btn" data-hs-export>Export progress</button></div>`;
  }
  if(installPrompt){
    return `<summary>Install ${name}</summary>
      <p class="meta" style="margin:8px 0 8px">Installing adds the drill to this device as an app with its own icon. After the first visit it also opens without a connection.</p>
      <div class="row"><button class="btn" data-install>Install ${name}</button></div>`;
  }
  return '';
}
function homeCard(){
  const inner = homeCardInner();
  return inner ? `<details class="panel hs-card" data-hs="settings">${inner}</details>` : '';
}
function wireHome(root){
  root.querySelectorAll('[data-hs]').forEach(card => {
    const ex = card.querySelector('[data-hs-export]');
    if(ex) ex.onclick = exportProgress;
    const inst = card.querySelector('[data-install]');
    if(inst) inst.onclick = async () => {
      const p = installPrompt;
      if(!p) return;
      installPrompt = null;
      try { await p.prompt(); await p.userChoice; } catch(e){ /* the browser declined to show it */ }
      refreshHomeCards();
    };
  });
}
/* Redraw a card on screen when the browser's offer changes; the section stays
   open or closed as the student left it. */
function refreshHomeCards(){
  document.querySelectorAll('[data-hs]').forEach(card => {
    const inner = homeCardInner();
    if(!inner){ card.remove(); return; }
    card.innerHTML = inner;
  });
  wireHome(document);
}
/* The progress file: this profile's progress and its answer history, for a
   second device, a Home Screen copy, or a retro that reads the history. */
function exportProgress(){
  const blob = new Blob([JSON.stringify({app:'exam-drill', course:COURSE.id, ns:NS, exported:new Date().toISOString(),
                                         profile:PROFILE, db:DB, log:LOG}, null, 1)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${COURSE.id}-progress-${PROFILE.replace(/\W+/g,'_')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Import progress ----------
   Louis's rules (2026-11-02, corrected twice on 2026-11-03): a file is read and checked whole
   before anything is saved; a file of another course, and a file that names no
   course, is refused; the page shows what is in the file, what this device has and
   what Import would do, and saves only when the student confirms; the progress
   Import replaces is kept, and Settings can put it back; two records are never
   mixed; whenever it is not established that the file continues this profile's
   record, or that it adds nothing to it, the file goes into a new profile of its
   own and this profile is unchanged; matching or empty answer lists alone never
   show that a file adds nothing; importing the same file again changes nothing,
   and makes no second profile; a write the browser
   refuses, or a saved progress or answer history that could not be read in this
   visit, means nothing is replaced, and the page says so. This device's appearance
   and its other preferences stay as they are.

   An answer is found by its question id and its time (`at`, in milliseconds), and
   two copies are the same answer only when every field of the two agrees (the
   result, the choices picked, the confidence, the count and the rest). Two copies
   under one key that differ are a conflict, never treated as the same answer.
   Every other part of the progress is compared as well (addsTo): each concept
   record, each FSRS card and comparison arm, the answer count, the settings that
   come with the file, and any part a feature module keeps.
   What Import does with a file of this course:
     nothing   every part of the file's progress is here, field for field, and every
               history entry; or every part of it and every history entry is in another
               profile here (a file imported before into a profile of its own; when that
               profile's history lacks some of the file's entries, they are added to it);
     history   the same, except the file adds history entries: they are merged in,
               and the progress is unchanged;
     replace   this profile holds no progress (no answers, answer count, concept
               records, scheduler state or module part; settings alone are not
               progress) and its answer history holds nothing the file's lacks; or the
               file continues this profile's record: it has answers this device lacks,
               every other part of this profile is in the file as it is here (except the
               records the file's further answers changed, and the settings, which come
               with the file), and the file's record has the same origin
               (`created`) as this one, this device's answer list is complete (its
               first answer is answer 1), and this device's answers are the file's
               first answers, field for field, in order. The file's progress then
               replaces this profile's, which is first kept as a copy;
     separate  anything else (answers on each side the other lacks, a conflict, a
               record of another origin, an answer list here that the 4,000-answer
               limit has cut, matching answers with other concept progress, settings
               or scheduling state, an older file whose other parts differ): the
               file's progress goes into a new profile, and this profile's progress
               is unchanged.
   With the progress come its settings, the pace and "Ask everything", because the
   file's review dates were set with them; IMPORT_DEVICE keeps this device's own
   choice of the others. The answer history is merged, never replaced. The copies
   Import keeps (a list under <ns>:backup:<profile>, newest last) are never deleted
   by Import or Put back; Settings deletes them only when the student asks. A
   browser that stops between Import's writes leaves either the old progress, or the
   new progress with the history not yet merged; importing the file again merges it.
   Import plans and writes nothing while this page's progress is not what is stored:
   when another tab or window saved the profile after this page read it, or when the
   browser refused this visit's last save of it (an answer still waiting to be saved
   is saved first, and kept on the page, flagged, if the browser refuses it). The
   file's other parts are checked whole as well as its answers: settings, the answer
   count, each concept record's counts and lists, and the scheduler's cards and arms.
   Every ordinary save has the same guard (shell.html profileSavedElsewhere): a page
   another tab has saved over stops saving instead of writing its older copy. */
const IMPORT_DEVICE = ['eqPick'];          // DB.settings fields that stay with this device
const RESULTS = ['correct', 'wrong', 'guessed'];
const backupKey = p => NS + ':backup:' + p;
const answerKey = a => a.qid + '|' + a.at;
// every field of an answer, in a fixed order: two copies are the same answer only when these agree
const answerSig = a => JSON.stringify(Object.keys(a).sort().map(k => [k, a[k]]));
const logEntryKey = e => e.slice(0, 4).join('|');
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const dateOf = ms => { const d = new Date(ms); return isNaN(d) ? '' : d.toISOString().slice(0, 10); };
const span = list => { const t = list.map(a => a.at).filter(Number.isFinite); return t.length ? `${dateOf(Math.min(...t))} to ${dateOf(Math.max(...t))}` : ''; };
const nAnswers = n => `${n.toLocaleString('en-US')} answer${n === 1 ? '' : 's'}`;
const nEntries = n => `${n.toLocaleString('en-US')} history entr${n === 1 ? 'y' : 'ies'}`;

/* The file read whole: {db, log, profile, exported, unknown} for a progress file of
   this course, or {why} saying why it is not imported. Nothing is saved here. */
function readProgressFile(text){
  let j;
  try { j = JSON.parse(text); } catch(e){ return {why: 'The file is not a progress export: it is not valid JSON.'}; }
  if(!isObj(j)) return {why: 'The file is not a progress export.'};
  if(j.app === 'bdk-quiz') return {why: 'This file was exported by the BDK quiz\'s own site, whose progress this drill cannot read yet.'};
  if(j.app !== undefined && j.app !== 'exam-drill') return {why: 'The file was exported by another app, not by this drill.'};
  const db = j.db;
  if(!isObj(db) || !isObj(db.concepts) || !Array.isArray(db.answers)) return {why: 'The file is not a progress export: it holds no progress.'};
  // the course: the file must name it; question ids alone do not show whose progress a file is
  if(j.ns === undefined && j.course === undefined)
    return {why: 'The file names no course (it was exported before this drill labelled its files), so it cannot be told to be this course\'s progress.'};
  if(j.ns !== undefined && ![NS, COURSE.ns, COURSE.ns + '-preview'].includes(j.ns) || j.course !== undefined && j.course !== COURSE.id)
    return {why: `This file is the progress of another course (${String(j.course || j.ns)}), not of ${COURSE.title || COURSE.id}.`};
  // every answer whole
  for(let i = 0; i < db.answers.length; i++){
    const a = db.answers[i];
    if(!isObj(a) || typeof a.qid !== 'string' || !a.qid || !Number.isFinite(a.at) || !RESULTS.includes(a.result) || a.qn !== undefined && !Number.isFinite(a.qn))
      return {why: `The file's progress is damaged: answer ${i + 1} of ${db.answers.length} is not a whole answer.`};
  }
  const seen = new Set();
  for(const a of db.answers){
    if(seen.has(answerKey(a))) return {why: 'The file\'s progress is damaged: it holds the same answer twice.'};
    seen.add(answerKey(a));
  }
  for(const [c, s] of Object.entries(db.concepts))
    if(!isObj(s)) return {why: `The file's progress is damaged: the record of concept ${c} is not readable.`};
  if(j.log !== undefined && !Array.isArray(j.log)) return {why: 'The file\'s answer history is damaged: it is not a list.'};
  const log = j.log || [];
  for(let i = 0; i < log.length; i++){
    const e = log[i];
    if(!Array.isArray(e) || e.length < 3 || !Number.isFinite(e[0]) || typeof e[1] !== 'string' || (e[2] !== 0 && e[2] !== 1))
      return {why: `The file's answer history is damaged: entry ${i + 1} of ${log.length} is not a whole entry.`};
  }
  // the other parts whole too: a part of the wrong kind breaks the page later (settings
  // that are not a record, a count that is not a number, a concept's list that is not a list)
  const damaged = what => ({why: `The file's progress is damaged: ${what}.`});
  if(db.settings !== undefined && !isObj(db.settings)) return damaged('its settings are not a settings record');
  if(db.qn !== undefined && !(Number.isFinite(db.qn) && db.qn >= 0)) return damaged('its answer count is not a number');
  if(db.created !== undefined && !Number.isFinite(db.created)) return damaged('its start time is not a time');
  for(const m of ['fsrsQ', 'fsrsC', 'arms']) if(db[m] !== undefined && db[m] !== null && !isObj(db[m])) return damaged(`its scheduler record "${m}" is not a list of entries`);
  for(const m of ['fsrsQ', 'fsrsC']) for(const [k, card] of Object.entries(db[m] || {})) if(!isObj(card)) return damaged(`its scheduler record "${m}" has an entry for ${k} that is not a card`);
  for(const [k, arm] of Object.entries(db.arms || {})) if(arm !== 'concept' && arm !== 'concept-fsrs') return damaged(`its comparison record gives concept ${k} an arm that does not exist`);
  for(const k of ['mode', 'pace']) if(isObj(db.settings) && db.settings[k] !== undefined && db.settings[k] !== null && typeof db.settings[k] !== 'string') return damaged(`its setting "${k}" is not a setting`);
  for(const [c, s] of Object.entries(db.concepts)){
    const k = CONCEPT_COUNTS.find(k => s[k] !== undefined && !Number.isFinite(s[k]));
    if(k) return damaged(`in the record of concept ${c}, "${k}" is not a number`);
    if(s.asked !== undefined && !Array.isArray(s.asked)) return damaged(`in the record of concept ${c}, "asked" is not a list`);
    for(const f of ['last', 'check']) if(s[f] !== undefined && s[f] !== null && !isObj(s[f])) return damaged(`in the record of concept ${c}, "${f}" is not a record`);
  }
  const ids = [...new Set(db.answers.map(a => a.qid))], known = ids.filter(id => byId(id)).length;
  let up;
  try { up = upgradeDB(JSON.parse(JSON.stringify(db))); }
  catch(e){ return {why: 'The file\'s progress could not be converted to this drill\'s format.'}; }
  return {db: up, log, profile: typeof j.profile === 'string' ? j.profile : '', exported: typeof j.exported === 'string' ? j.exported : '',
          unknown: ids.length - known, created: db.created};
}

/* The parts of a progress Import compares besides the answers. `v` is the shape's
   version, `created` the record's origin (compared in continuesHere), and `fsUndo`
   and `fsHistory` are the FSRS step "I guessed" can undo and whether the cards were
   rebuilt from the answers: none of them is progress a file could add. */
const NOT_COMPARED = ['v', 'created', 'fsUndo', 'fsHistory', 'answers', 'qn', 'settings'];
const CONCEPT_COUNTS = ['seen', 'correct', 'wrong', 'guessed', 'streak', 'box', 'dueAt', 'dueQ', 'lastQ'];
/* Another tab or window saved this profile's progress after this page read or wrote
   it: what is stored is neither what this page last read or wrote (SEEN) nor what it
   shows (shell.html profileSavedElsewhere). Import then plans and writes nothing. */
const changedElsewhere = () => profileSavedElsewhere();   // its progress or its history
/* While another tab or window has this profile (the single-writer lock in shell.html),
   the reason given is that one, not a save "since". */
const OPEN_ELSEWHERE = 'This profile is open in another tab or window of this browser, which saves it, so this page writes nothing to it. Nothing was imported. Use "Use it here" first, or import in that tab.';
const notTheWriter = () => WRITER !== 'none' && !(WRITER === 'held' && WRITER_FOR === PROFILE);
const elsewhere = () => notTheWriter() ? OPEN_ELSEWHERE : ELSEWHERE;
const ELSEWHERE = 'This profile\'s progress or answer history was saved by another tab or window after this page opened it, so this page cannot import over it. Nothing was imported. Reload this page, then import again.';
const UNSAVED = 'This profile\'s progress could not be saved in this visit (storage is full or blocked), so what this page shows is not what is stored, and nothing was imported. Export progress first, free some space, reload, and import again.';
const ENTRY_MAPS = {concepts: 'concepts', arms: 'scheduler', fsrsQ: 'scheduler', fsrsC: 'scheduler'};   // compared entry by entry
const canon = v => JSON.stringify(v, (k, x) => isObj(x) ? Object.keys(x).sort().reduce((o, key) => (o[key] = x[key], o), {}) : x);
const isEmptyPart = v => v === undefined || v === null || v === '' || v === 0 || v === false ||
  (Array.isArray(v) && !v.length) || (isObj(v) && !Object.keys(v).length);
/* What the file's progress holds that `db` lacks or holds otherwise, by part:
   'answers', 'concepts', 'settings', 'scheduler' (the answer count, the FSRS cards,
   the comparison's arms) or 'other' (a part a feature module keeps). [] when every
   part of the file is in `db`, field for field. Matching answer lists never show
   this on their own (Louis, 2026-11-03): the concept progress, the pace and the
   scheduler's state can differ while the answers agree, or while both lists are
   empty. `sigs`: db's answers, key -> answerSig. */
function addsTo(fdb, db, sigs){
  const parts = new Set();
  if(fdb.answers.some(a => sigs.get(answerKey(a)) !== answerSig(a))) parts.add('answers');
  for(const [m, part] of Object.entries(ENTRY_MAPS)){
    const F = isObj(fdb[m]) ? fdb[m] : {}, D = isObj(db[m]) ? db[m] : {};
    if(Object.keys(F).some(k => !(k in D) || canon(F[k]) !== canon(D[k]))) parts.add(part);
  }
  if((Number(fdb.qn) || 0) > (Number(db.qn) || 0)) parts.add('scheduler');
  const FS = isObj(fdb.settings) ? fdb.settings : {}, DS = isObj(db.settings) ? db.settings : {};
  if(Object.keys(FS).some(k => !IMPORT_DEVICE.includes(k) && canon(FS[k]) !== canon(DS[k]))) parts.add('settings');
  for(const k of Object.keys(fdb))
    if(!NOT_COMPARED.includes(k) && !(k in ENTRY_MAPS) && canon(fdb[k]) !== canon(db[k])) parts.add('other');
  return [...parts];
}
/* Whether a progress holds anything besides settings: answers, an answer count,
   concept records, the scheduler's state or a module's part. */
function holdsProgress(db){
  if(db.answers.length || Number(db.qn) > 0) return true;
  if(Object.keys(ENTRY_MAPS).some(m => isObj(db[m]) && Object.keys(db[m]).length)) return true;
  return Object.keys(db).some(k => !NOT_COMPARED.includes(k) && !(k in ENTRY_MAPS) && !isEmptyPart(db[k]));
}
/* Whether the file's record continues this profile's (which holds progress): see
   "replace" above. */
function continuesHere(here, there, fileCreated, fdb){
  if(!Number.isFinite(fileCreated) || !Number.isFinite(DB.created) || fileCreated !== DB.created) return {ok: false, why: 'origin'};
  if(!here.length) return {ok: false, why: 'empty'};
  if(here[0].qn !== 1) return {ok: false, why: 'incomplete'};
  if(there.length < here.length) return {ok: false, why: 'order'};
  for(let i = 0; i < here.length; i++) if(answerSig(here[i]) !== answerSig(there[i])) return {ok: false, why: 'order'};
  // this profile's other parts: each is in the file as it is here, except the records
  // the file's further answers changed (their concepts and questions), and the
  // settings, which come with the file. A part changed here without an answer (a
  // module's record, for example) is not in a file made elsewhere, so the file does
  // not continue this profile, and the matching answers do not show otherwise.
  const later = there.slice(here.length);
  const byC = new Set(later.map(a => a.concept)), byQ = new Set(later.map(a => a.qid));
  const kept = (m, skip) => Object.entries(isObj(DB[m]) ? DB[m] : {}).every(([k, v]) => skip.has(k) || canon(v) === canon((isObj(fdb[m]) ? fdb[m] : {})[k]));
  if(!kept('concepts', byC)) return {ok: false, why: 'parts', part: 'concepts'};
  if(!kept('fsrsQ', byQ) || !kept('fsrsC', byC) || !kept('arms', new Set())) return {ok: false, why: 'parts', part: 'scheduler'};
  if(Object.keys(DB).some(k => !NOT_COMPARED.includes(k) && !(k in ENTRY_MAPS) && !isEmptyPart(DB[k]) && canon(DB[k]) !== canon(fdb[k])))
    return {ok: false, why: 'parts', part: 'other'};
  return {ok: true};
}

/* What Import would do with a file read whole (readProgressFile), against the
   profile on screen; or {block} when nothing may be replaced in this visit. */
/* The browser holds nothing under this profile's progress key (its site data was
   cleared while this page was open), though the page holds progress. */
const storedGone = () => { try { return localStorage.getItem(keyFor(PROFILE)) === null && holdsProgress(DB); } catch(e){ return false; } };
function importPlan(f){
  if(!canSave()) return {block: LOAD_FAIL};
  // site data cleared while this page was open: the page's copy is saved again first, as
  // its next save would, so the plan compares the file with what is stored
  if(storedGone() && !changedElsewhere()){ store.set(keyFor(PROFILE), JSON.stringify(DB)); saveLog(); }
  if(FAILED.has(keyFor(PROFILE))) return {block: UNSAVED};
  if(changedElsewhere()) return {block: elsewhere()};
  const here = DB.answers, there = f.db.answers;
  const H = new Map(here.map(a => [answerKey(a), a])), T = new Map(there.map(a => [answerKey(a), a]));
  const onlyThere = there.filter(a => !H.has(answerKey(a))).length, onlyHere = here.filter(a => !T.has(answerKey(a)));
  // the same key with different fields: a conflict
  const conflicts = there.filter(a => H.has(answerKey(a)) && answerSig(H.get(answerKey(a))) !== answerSig(a)).length;
  // history entries the file adds, and entries here the file's copy completes (an
  // entry written before the scheduler fields were added; mergeLog's rule)
  const L = new Map(LOG.map(e => [logEntryKey(e), e]));
  const newLog = f.log.filter(e => !L.has(logEntryKey(e))).length;
  const fill = f.log.filter(e => L.has(logEntryKey(e)) && e.length > L.get(logEntryKey(e)).length).length;
  const plan = {f, onlyThere, onlyHere: onlyHere.length, conflicts, newLog, fill};
  // the history here cannot be read: it is never written over, so a file that adds to it is not imported
  const noLog = {block: 'The answer history saved on this device could not be read in this visit, so nothing was imported, and the history is left as it was.'};
  const logChange = newLog || fill;
  // every part of the file's progress compared, not only its answers
  plan.adds = addsTo(f.db, DB, new Map(here.map(a => [answerKey(a), answerSig(a)])));
  if(!plan.adds.length){
    plan.action = logChange ? 'history' : 'nothing';
    return logChange && !LOG_OK ? noLog : plan;
  }
  // a profile with no progress, whose answer history holds nothing the file's lacks
  // (history left from a record put back belongs to that record, not to the file's)
  const FL = new Set(f.log.map(logEntryKey));
  plan.hereOnlyLog = LOG_OK ? LOG.filter(e => !FL.has(logEntryKey(e))).length : -1;
  if(!holdsProgress(DB) && plan.hereOnlyLog === 0){ plan.action = 'replace'; plan.fresh = true; return logChange && !LOG_OK ? noLog : plan; }
  if(!holdsProgress(DB)) plan.unsure = 'history';
  else if(onlyThere && !conflicts && !onlyHere.length){
    const c = continuesHere(here, there, f.created, f.db);
    if(c.ok){ plan.action = 'replace'; return logChange && !LOG_OK ? noLog : plan; }
    plan.unsure = c.why; plan.unsurePart = c.part;
  }
  plan.action = 'separate';
  // the file keeps only its latest answers: say so when that is why this device's answers are missing from it
  const first = there.length ? Math.min(...there.map(a => a.at)) : 0;
  plan.trimmed = there.length >= ANSWERS_MAX && onlyHere.length > 0 && onlyHere.every(a => a.at < first);
  // another profile here that already holds every part of the file, field for field (a file imported before is there)
  plan.already = profilesHere(true).find(p => p.db && p.name !== PROFILE && !addsTo(f.db, p.db, p.sigs).length);
  if(plan.already){
    // that profile holds every part of the file's progress; its history may still lack
    // some of the file's entries (a file exported after a history-only import, or a
    // separate import stopped between its two writes): they are added to that history
    const xl = readLogOf(plan.already.name);
    if(xl === null) return {block: `The answer history of the profile "${plan.already.name}", which holds this file's progress, could not be read, so nothing was imported.`};
    const XL = new Map(xl.map(e => [logEntryKey(e), e]));
    plan.newLog = f.log.filter(e => !XL.has(logEntryKey(e))).length;
    plan.fill = f.log.filter(e => XL.has(logEntryKey(e)) && e.length > XL.get(logEntryKey(e)).length).length;
    plan.logTo = plan.already.name;
    plan.action = plan.newLog || plan.fill ? 'history' : 'nothing';
  }
  else plan.name = newProfileName(f.profile);
  return plan;
}
/* A profile's stored answer history: [] for none, null when it cannot be read. */
function readLogOf(name){
  const raw = store.get(NS + ':log:' + name);
  if(raw === null) return [];
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : null; } catch(e){ return null; }
}
/* The profiles saved in this browser for this course. With `full`, each also has its
   progress as stored, converted as on load (db), and its answers (key -> every
   field); both null when that progress cannot be read. */
function profilesHere(full){
  const pre = NS + ':data:', out = [];
  try {
    for(let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i);
      if(!k || !k.startsWith(pre) || k.length === pre.length) continue;
      let db = null, sigs = null;
      if(full) try {
        const d = JSON.parse(localStorage.getItem(k));
        if(isObj(d) && isObj(d.concepts) && Array.isArray(d.answers)){ db = upgradeDB(d); sigs = new Map(db.answers.map(a => [answerKey(a), answerSig(a)])); }
      } catch(e){ db = sigs = null; }
      out.push({name: k.slice(pre.length), db, sigs});
    }
  } catch(e){ /* storage unreadable: none */ }
  return out;
}
function newProfileName(from){
  const taken = new Set(profilesHere().map(p => p.name));
  // a name is taken when any of its keys holds something (progress, history or copies), as
  // runImport checks again at the click
  const used = n => taken.has(n) || n === PROFILE || store.get(NS + ':log:' + n) !== null || store.get(backupKey(n)) !== null;
  const base = `${(from || 'imported').trim().slice(0, 40) || 'imported'} (imported ${dateOf(Date.now())})`;
  let name = base;
  for(let i = 2; used(name); i++) name = `${base} ${i}`;
  return name;
}

const PART_NAMES = {concepts: 'concept progress', settings: 'settings', scheduler: 'scheduling state', other: 'other saved progress'};
// "concept progress differs", "settings differ", "concept progress and settings differ"
const partsText = parts => {
  const w = parts.filter(x => x !== 'answers').map(x => PART_NAMES[x]);
  const text = w.length > 1 ? w.slice(0, -1).join(', ') + ' and ' + w[w.length - 1] : (w[0] || 'progress');
  return text + (w.length > 1 || w[0] === 'settings' ? ' differ' : ' differs');
};
/* The plan, on screen in Settings, with the buttons that carry it out. */
function showImportPlan(plan){
  const box = $('#importPlan');
  if(!box) return;
  const f = plan.f, there = f.db.answers;
  const what = {
    nothing: plan.already ? `Everything in this file is already in the profile "${esc(plan.already.name)}" (a file imported before goes there). Nothing changes.`
                          : 'Everything in this file (its answers, concept progress, settings and scheduling state, and its history entries) is on this device already. Nothing changes.',
    history: (plan.logTo ? `Every part of this file's progress is already in the profile "${esc(plan.logTo)}". The file adds ${nEntries(plan.newLog)} to that profile's answer history` +
                           (plan.fill ? ` and completes ${nEntries(plan.fill)} there` : '') + `. The progress of "${esc(PROFILE)}" is unchanged.`
                         : `The file adds ${nEntries(plan.newLog)} to the answer history` +
             (plan.fill ? ` and completes ${nEntries(plan.fill)} saved here before the scheduler fields were kept` : '') + '. Your progress is unchanged.'),
    replace: (plan.onlyThere ? `The file has ${nAnswers(plan.onlyThere)} that this device does not have, and ` : 'The file holds progress with no answers, and ') +
             (plan.fresh ? 'this profile has no progress yet. ' : 'it continues this profile\'s record: every answer this device has is the file\'s, in the same order. ') +
             `Import replaces the progress of "${esc(PROFILE)}" with the file's and adds ${nEntries(plan.newLog)} to its answer history. ` +
             'The progress it replaces is kept, and Settings can put it back.',
    separate: [
                plan.onlyThere ? `The file has ${nAnswers(plan.onlyThere)} that this device does not have` : '',
                plan.onlyHere ? `this device has ${nAnswers(plan.onlyHere)} that the file does not have` +
                  (plan.trimmed ? ` (the file keeps only its latest ${nAnswers(ANSWERS_MAX)}, so it cannot show whether it includes this device's older ones)` : '') : '',
                plan.conflicts ? `${nAnswers(plan.conflicts)} ${plan.conflicts === 1 ? 'is' : 'are'} in both with a different result, choice or mark` : '',
                plan.unsure === 'origin' ? 'the file\'s progress was not started from this profile\'s record, so it cannot be shown to continue it' : '',
                plan.unsure === 'incomplete' ? `this device's answer list does not begin with its first answer (a list keeps only the latest ${nAnswers(ANSWERS_MAX)}), so it cannot be shown that the file continues its record` : '',
                plan.unsure === 'order' ? 'this device\'s answers are not the file\'s first answers in order, so it cannot be shown that the file continues its record' : '',
                plan.unsure === 'empty' ? 'this profile has no answers but other progress, so it cannot be shown that the file continues its record' : '',
                plan.unsure === 'parts' ? `this profile's ${PART_NAMES[plan.unsurePart]} is not in the file as it is here, so the file cannot be shown to continue this profile's record` : '',
                plan.unsure === 'history' ? (plan.hereOnlyLog > 0 ? `this profile has no progress, but its answer history holds ${nEntries(plan.hereOnlyLog)} the file does not have, which would be mixed with the file's record`
                                                                   : 'this profile has no progress, but its answer history could not be read in this visit') : '',
                !plan.onlyThere && !plan.conflicts ? `the file's ${partsText(plan.adds)} from this profile's, and the answers alone cannot show that the file adds nothing` : '',
              ].filter(Boolean).join('; ').replace(/^./, c => c.toUpperCase()) +
              `. Import puts the file's progress in a new profile, "${esc(plan.name || '')}", and leaves the progress of "${esc(PROFILE)}" as it is.`,
  }[plan.action];
  const act = plan.action === 'nothing' ? '' : `<button class="btn" id="importGo">${plan.action === 'separate' ? 'Import into a new profile' : 'Import'}</button>`;
  box.innerHTML = `<div class="panel" role="region" aria-label="Import progress">
    <p style="margin:0 0 6px"><b>${esc(COURSE.title || COURSE.id)}</b>: progress${f.profile ? ` of "${esc(f.profile)}"` : ''}${f.exported ? `, exported ${esc(dateOf(Date.parse(f.exported)) || f.exported)}` : ''}.</p>
    <p class="meta" style="margin:0 0 4px">In the file: ${nAnswers(there.length)}${there.length ? ` (${span(there)})` : ''}, ${nEntries(f.log.length)}` +
      `${f.unknown ? `; ${nAnswers(f.unknown)} to questions no longer in this drill, kept as they are` : ''}.</p>
    <p class="meta" style="margin:0 0 8px">On this device, "${esc(PROFILE)}": ${nAnswers(DB.answers.length)}${DB.answers.length ? ` (${span(DB.answers)})` : ''}, ${nEntries(LOG.length)}.</p>
    <p id="importWhat" style="margin:0 0 8px">${what}</p>
    ${plan.action === 'replace' ? '<p class="meta" style="margin:0 0 8px">The pace and "Ask everything" come with the file\'s progress, since its review dates were set with them. This device\'s appearance and its other preferences stay as they are.</p>' : ''}
    <div class="frow">${act}<button class="btn ghost" id="importCancel">${plan.action === 'nothing' ? 'OK' : 'Cancel'}</button></div></div>`;
  $('#importCancel').onclick = () => { box.innerHTML = ''; };
  const go = $('#importGo');
  if(go) go.onclick = () => { go.disabled = true; withOtherProfile(plan, () => runImport(plan)).then(importDone); };
}
function importDone(r){
  const box = $('#importPlan');
  if(!box) return;
  box.innerHTML = `<div class="panel" role="status"><p id="importResult" style="margin:0 0 8px">${r.text}</p>
    <div class="frow">${r.open ? `<button class="btn" id="importOpen">Open "${esc(r.open)}"</button>` : ''}<button class="btn ghost" id="importOk">OK</button></div></div>`;
  $('#importOk').onclick = () => renderSettings();
  const o = $('#importOpen');
  if(o) o.onclick = () => { useProfile(r.open); show('settings'); };
}

/* The history entries of the file added to `base` (mergeLog's rule), as a new list. */
function mergedLog(base, entries){
  const out = base.map(e => e.slice()), here = new Map(out.map(e => [logEntryKey(e), e]));
  for(const e of entries){
    const k = logEntryKey(e), mine = here.get(k);
    if(!mine){ const c = e.slice(); out.push(c); here.set(k, c); }
    else if(e.length > mine.length) for(let i = mine.length; i < e.length; i++) mine.push(e[i]);
  }
  out.sort((x, y) => x[0] - y[0]);
  return out;   // no cut at LOG_MAX: the student decides (capNotice)
}
/* Carry out a plan. Every write is one the browser either keeps or refuses
   (store.trySet), and a refused one leaves what it would have replaced as it was. */
/* An import that writes another profile (a new one, or the history of the profile that
   already holds the file) holds that profile's writer lock while it writes: a tab using
   that profile has the lock, and the import then writes nothing. */
function withOtherProfile(plan, fn){
  const name = plan.action === 'separate' ? plan.name : (plan.logTo && plan.logTo !== PROFILE ? plan.logTo : '');
  if(!name || WRITER === 'none') return Promise.resolve(fn());
  return navigator.locks.request(writerName(name), {ifAvailable: true}, lock => lock ? fn() :
    {text: `The profile "${esc(name)}" is open in another tab or window of this browser, which saves it, so nothing was imported, and that profile and "${esc(PROFILE)}" are unchanged. Import in that tab, or close it and import again.`})
    .catch(e => ({text: 'The import could not start: ' + esc(String(e && e.message || e)) + '. Nothing was imported.'}));
}
function runImport(plan){
  if(!canSave()) return {text: esc(LOAD_FAIL) + ' The file was not imported.'};
  // the plan was made from what this page holds: check again that it is what is stored
  if(FAILED.has(keyFor(PROFILE))) return {text: esc(UNSAVED)};
  if(changedElsewhere()) return {text: esc(elsewhere())};
  // the new profile's name was free when the plan was shown; another tab or window may have
  // saved a profile under it since, which this import must not write over (or delete below)
  if(plan.action === 'separate' && [keyFor(plan.name), NS + ':log:' + plan.name, backupKey(plan.name)].some(k => store.get(k) !== null))
    return {text: `Another tab or window saved a profile named "${esc(plan.name)}" after this plan was shown, so nothing was imported, and that profile and yours are unchanged. Choose the file again for a new plan.`};
  const f = plan.f;
  const refused = 'The browser refused to save (storage is full or blocked)';
  // an answer given in the last 150 ms is saved first, so the copy kept below holds it
  // the browser's site data cleared while this page was open: the page's copy is
  // written back first, so the copy kept below holds it
  const cleared = storedGone();
  if(saveTimer || cleared){
    clearTimeout(saveTimer); saveTimer = null;
    // store.set keeps the refused change on this page and flags it, as any save does
    if(!store.set(keyFor(PROFILE), JSON.stringify(DB))) return {text: `${refused}, so nothing was imported. Your progress is kept on this page until you leave it; export it now.`};
  }
  if(plan.action === 'separate'){
    const name = plan.name, db = JSON.parse(JSON.stringify(f.db));
    if(!store.trySet(keyFor(name), JSON.stringify(db))) return {text: `${refused}, so nothing was imported. Your progress is unchanged.`};
    const log = mergedLog([], f.log);
    if(log.length && !store.trySet(NS + ':log:' + name, JSON.stringify(log))){
      store.del(keyFor(name));
      return {text: `${refused}, so nothing was imported. Your progress is unchanged.`};
    }
    return {text: `The file's progress is now the profile "${esc(name)}" (${nAnswers(db.answers.length)}). The progress of "${esc(PROFILE)}" is unchanged.`, open: name};
  }
  let text = '';
  if(plan.action === 'replace'){
    const now = store.get(keyFor(PROFILE)), before = readCopies(), beforeRaw = storedRaw(backupKey(PROFILE));
    if(before === null) return {text: 'The copies Import kept before cannot be read, so nothing was imported. Your progress is unchanged.'};
    const copies = now === null ? before : before.concat([{at: Date.now(), data: now, why: 'import'}]);
    if(now !== null && !store.trySet(backupKey(PROFILE), JSON.stringify(copies)))
      return {text: `${refused} a copy of the progress Import would replace, so nothing was imported. Your progress is unchanged.`};
    const db = JSON.parse(JSON.stringify(f.db));
    db.settings = Object.assign({}, db.settings || {});
    for(const k of IMPORT_DEVICE){ if(DB.settings && k in DB.settings) db.settings[k] = DB.settings[k]; else delete db.settings[k]; }
    const dbText = JSON.stringify(db);
    pendingMark();
    if(!store.trySet(keyFor(PROFILE), dbText)){
      // the copy written just before is not needed: the list goes back as it was
      let undone = now === null;
      if(!undone && beforeRaw === null){ store.del(backupKey(PROFILE)); undone = store.get(backupKey(PROFILE)) === null; }
      else if(!undone) undone = store.trySet(backupKey(PROFILE), beforeRaw);
      return {text: `${refused}, so nothing was imported. Your progress is unchanged.` +
                    (undone ? '' : ' The copies kept by Import now also hold a copy of it (the browser refused to take it off the list).')};
    }
    clearTimeout(saveTimer); saveTimer = null;
    SEEN = dbText;
    pendingRetire();   // other tabs' older records of this profile cannot bring back what was replaced
    DB = db;
    try { fsFromHistory(); } catch(e){ FS_ERROR = String(e && e.message || e); }
    text = `Imported: "${esc(PROFILE)}" now has the file's progress (${nAnswers(db.answers.length)}). The progress it replaced is kept; Settings can put it back.`;
  }
  if((plan.newLog || plan.fill) && plan.logTo){
    // into the history of the profile that already holds every part of the file's progress
    const base = readLogOf(plan.logTo);
    if(base === null) return {text: `The answer history of the profile "${esc(plan.logTo)}" could not be read, so nothing was imported.`};
    const log = mergedLog(base, f.log);
    return {text: store.trySet(NS + ':log:' + plan.logTo, JSON.stringify(log))
      ? `${nEntries(plan.newLog)} added to the answer history of "${esc(plan.logTo)}"` + (plan.fill ? `, ${plan.fill} completed` : '') + `. The progress of "${esc(PROFILE)}" is unchanged.`
      : `${refused} the answer history of "${esc(plan.logTo)}", so nothing was imported; that history is unchanged.`};
  }
  if(plan.newLog || plan.fill){
    if(!LOG_OK) return {text: text + ' The answer history saved here could not be read in this visit, so the file\'s entries were not added to it.'};
    const log = mergedLog(LOG, f.log);
    if(store.trySet(logKey(), JSON.stringify(log))){ LOG = log; text += (text ? ' ' : '') + `${nEntries(plan.newLog)} added to the answer history` + (plan.fill ? `, ${plan.fill} completed` : '') + '.'; setTimeout(capNotice, 0); }
    else text += (text ? ' ' : '') + `${refused} the answer history, so the file's ${nEntries(plan.newLog)} were not added; the history here is unchanged. Importing the file again adds them.`;
  }
  return {text};
}
/* The copies Import keeps, newest last: [{at, data, why}], [] for none, or null when
   what is stored there cannot be read (then nothing writes over it). Read from what the
   browser holds: copies another tab or window deleted are not shown or written back here. */
function readCopies(){
  const raw = storedRaw(backupKey(PROFILE));
  if(raw === null) return [];
  try {
    const v = JSON.parse(raw);
    const list = Array.isArray(v) ? v : [v];
    return list.every(c => isObj(c) && typeof c.data === 'string') ? list : null;
  } catch(e){ return null; }
}
/* Settings' "Put back": the newest copy Import kept becomes the progress again, and
   the progress on screen is kept as a copy in its place. Each step is a write the
   browser keeps or refuses, in an order that holds both records in storage at every
   point: (1) the progress on screen is added to the copies, (2) the newest copy is
   written as the progress, (3) that copy is taken off the list. A refusal at (1) or
   (2) changes nothing; a refusal at (3) leaves that copy on the list as well, and the
   put-back stands. */
const ELSEWHERE_SHORT_SAVED = 'This profile was saved in another tab or window after this page opened it';
const elsewhereShort = () => notTheWriter() ? 'This profile is open in another tab or window, which saves it' : ELSEWHERE_SHORT_SAVED;
const COPIES_CHANGED = 'The copies kept by Import were changed in another tab or window while this question was open, so';
// what the browser holds under k now (store.get would fall back to this page's copy of a removed key)
const storedRaw = k => { try { return localStorage.getItem(k); } catch(e){ return null; } };
function restoreBackup(){
  if(!canSave()){ alert(LOAD_FAIL + ' Nothing was put back.'); return; }
  if(changedElsewhere()){ staleWarn(); alert(elsewhereShort() + ', so nothing was put back. Reload this page first.'); return; }
  const copies = readCopies();
  if(copies === null){ alert('The copies kept by Import cannot be read, so nothing was put back.'); return; }
  if(!copies.length){ alert('There is no copy to put back.'); return; }
  const b = copies[copies.length - 1];
  let db;
  try { const v = JSON.parse(b.data); if(!isObj(v)) throw new Error('not a progress object'); db = upgradeDB(v); }
  catch(e){ alert('The copy kept by Import cannot be read, so nothing was put back.'); return; }
  const copiesRaw = storedRaw(backupKey(PROFILE));
  if(!confirm(`Put back the progress of "${PROFILE}" from ${dateOf(b.at)} (${db.answers.length} answers)? The progress now on screen is kept as a copy in its place.`)) return;
  // the question may have stayed open while another tab or window saved this profile, or
  // changed its copies (a delete there must not be undone here)
  if(changedElsewhere()){ staleWarn(); alert(elsewhereShort() + ', so nothing was put back. Reload this page first.'); return; }
  if(storedRaw(backupKey(PROFILE)) !== copiesRaw){ alert(COPIES_CHANGED + ' nothing was put back. Reload this page first.'); return; }
  const refused = 'The browser refused to save (storage is full or blocked), so nothing was put back. Your progress and the copies are unchanged.';
  // a change still waiting on its 150 ms timer is saved first, so the copy kept below (the
  // progress on screen) holds it; refused, it stays on this page, flagged, and nothing is put back
  if(saveTimer){
    clearTimeout(saveTimer); saveTimer = null;
    if(!store.set(keyFor(PROFILE), JSON.stringify(DB))){
      alert('The browser refused to save (storage is full or blocked), so nothing was put back. Your latest change is kept on this page until you leave it; export your progress now.');
      return;
    }
  }
  const now = store.get(keyFor(PROFILE));
  const withNow = now === null ? copies : copies.concat([{at: Date.now(), data: now, why: 'put back'}]);
  if(now !== null && !store.trySet(backupKey(PROFILE), JSON.stringify(withNow))){ alert(refused); return; }       // (1)
  pendingMark();
  if(!store.trySet(keyFor(PROFILE), b.data)){                                                                      // (2)
    // the list as it was; if that is refused too, the list keeps the extra copy of the progress on screen
    const undone = now === null || store.trySet(backupKey(PROFILE), JSON.stringify(copies));
    alert(undone ? refused : 'The browser refused to save (storage is full or blocked), so nothing was put back. Your progress is unchanged; ' +
                             'the copies kept by Import now also hold a copy of it (the browser refused to take it off the list).');
    return;
  }
  clearTimeout(saveTimer); saveTimer = null;
  SEEN = b.data;
  DB = db;
  try { fsFromHistory(); } catch(e){ FS_ERROR = String(e && e.message || e); }
  // a copy kept by "Use it here" may hold history entries that were never stored: they go into the
  // history before the copy leaves the list; refused, the copy stays on the list (#32's review of 1b9d5a6)
  let logIn = true;
  if(typeof b.log === 'string'){
    try {
      const extra = JSON.parse(b.log);
      if(!LOG_OK) logIn = false;
      else if(Array.isArray(extra) && extra.length){
        const merged = mergedLog(LOG, extra);
        if(store.trySet(logKey(), JSON.stringify(merged))){ LOG = merged; SEEN_LOG = JSON.stringify(merged); setTimeout(capNotice, 0); }
        else logIn = false;
      }
    } catch(e){ logIn = false; }
  }
  const kept = logIn ? withNow.filter(c => c !== b) : withNow;
  const listed = store.trySet(backupKey(PROFILE), JSON.stringify(kept));                                          // (3)
  // the per-tab records are retired after the list is written: a record holding a module's part
  // becomes one more copy on this list, and a list written after it would drop that copy (the review of #69, N1)
  pendingRetire();
  alert('The progress from ' + dateOf(b.at) + ' is back. The progress that was on screen is kept as a copy' +
        (!logIn ? '; the copy just put back stays on the list too, because its answer history could not be added to this profile\'s history.' :
         listed ? '.' : '; the copy just put back is also still on the list (the browser refused to update it).'));
  renderSettings();
}
/* Settings' "Delete the copies": only when the student asks, after a confirm. */
function deleteCopies(){
  if(!canSave()){ alert(LOAD_FAIL + ' Nothing was deleted.'); return; }
  if(changedElsewhere()){ staleWarn(); alert(elsewhereShort() + ', so nothing was deleted. Reload this page first.'); return; }
  const copies = readCopies();
  if(!copies || !copies.length) return;
  const copiesRaw = storedRaw(backupKey(PROFILE));
  if(!confirm(`Delete the ${copies.length} cop${copies.length === 1 ? 'y' : 'ies'} of earlier progress kept by Import for "${PROFILE}"? This cannot be undone.`)) return;
  // the question may have stayed open while another tab or window saved this profile or
  // added a copy (an import there): only the copies the question counted are deleted
  if(changedElsewhere()){ staleWarn(); alert(elsewhereShort() + ', so nothing was deleted. Reload this page first.'); return; }
  if(storedRaw(backupKey(PROFILE)) !== copiesRaw){ alert(COPIES_CHANGED + ' nothing was deleted. Reload this page first.'); return; }
  store.del(backupKey(PROFILE));
  pendingRetire();
  renderSettings();
}
function backupNote(){
  const copies = readCopies();
  if(copies === null) return '<p class="meta" style="margin:6px 0 0">The copies of earlier progress kept by Import cannot be read; they are left as they are.</p>';
  if(!copies.length) return '';
  const b = copies[copies.length - 1];
  return `<div class="frow" style="margin-top:6px"><button class="btn ghost" id="btnRestore">Put back the progress from ${esc(dateOf(b.at))}</button>` +
    `<button class="btn ghost" id="btnDeleteCopies">Delete the ${copies.length} cop${copies.length === 1 ? 'y' : 'ies'} kept by Import</button></div>`;
}

/* ---------- Storage use and its warning (review/storage-usage-proposal.md §3 items 1
   and 2; Louis approved them on 2026-11-04) ----------
   Every drill on lglouis3-create.github.io shares one origin, and so one localStorage
   limit. Settings shows what the whole site stores in this browser and this drill's
   part of it; the Quiz tab and Settings warn when the space left may not be enough for
   the next large write. Sizes are string lengths (key plus value), what
   localStorage.getItem(k).length returns; the bytes a browser writes to disk can differ.
   Sizes are UTF-16 code units (an emoji counts as 2), as String.length counts them.
   The limit is taken as 5,242,880 (5 × 1,048,576, the "up to 5 MiB" per origin MDN
   gives). In Chromium 153 one origin accepted exactly 5,242,880 units, keys and values
   together, before setItem threw (the independent review of #46, 2026-11-04, by binary
   search; review/storage-measure/quota.js's coarse fill had stopped at 5,242,873, a
   lower bound). Safari and Firefox were not measured, so the figures and the warning are
   an estimate there. Nothing here writes or deletes a key:
   the warning offers Export progress and the existing "Delete the copies kept by
   Import", which asks first.
   The warning shows when the space left is less than the larger of two needs:
     - profile: the largest profile this browser holds on the core (its progress plus its
       answer history), the most that one more profile (a file Import puts in a profile
       of its own) or a copy can take;
     - preview: for each course on the core whose preview has not yet copied its keys (no
       key starts <ns>-preview:), what the preview's first opening copies: every key of
       the course under the name <ns>-preview:..., 8 characters longer each.
   A course is on the core when one of its <ns>:data:<profile> keys holds a progress the
   core saved: JSON that starts {"v":<2 or more> (BLANK puts v first, and upgradeDB keeps
   it there); drills not on the core (BDK's bdk2:*, Pharmacokinetics, Intro to
   Pharmacology) save no v and count in the site's total only. The course on screen
   counts as on the core always.
   This drill's part is read under NS, the namespace the page saves under: on a preview
   page that is <ns>-preview, so the copies it counts are the ones its "Delete the copies"
   deletes (deleteCopies, readCopies, backupKey use NS too); the twin line is then the live
   drill's keys, and on the live page the preview copies. */
const STORE_LIMIT = 5 * 1048576;     // 5,242,880: MDN's 5 MiB, in characters as Chromium counts them
const STORE_MEASURED = 5242880;      // what Chromium 153 accepted, exactly (the review of #46, 2026-11-04)
const PREVIEW_SUFFIX = '-preview';   // shell.html NS of a preview build
const nChars = n => n.toLocaleString('en-US');
/* What localStorage holds now: null when it cannot be read. Read-only. */
function storageUse(){
  let keys;
  try {
    keys = [];
    for(let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i); if(k === null) continue;
      const v = localStorage.getItem(k); if(v === null) continue;
      keys.push([k, v]);
    }
  } catch(e){ return null; }
  const base = COURSE.ns, live = NS + ':', prev = (BUILD.preview ? base : base + PREVIEW_SUFFIX) + ':';
  const u = {total: 0, items: [], drill: {progress: 0, history: 0, preview: 0, copies: 0, pending: 0, other: 0}, copies: 0, copiesUnread: 0};
  const core = new Set([base]), profiles = {}, byNs = {}, hasPreview = new Set();
  for(const [k, v] of keys){
    const n = k.length + v.length;
    u.total += n;
    u.items.push([k, n]);
    if(k.startsWith(prev)) u.drill.preview += n;
    else if(k.startsWith(live)){
      const what = k.slice(live.length).split(':')[0];
      if(what === 'data' && k.length > live.length + 5) u.drill.progress += n;
      else if(what === 'log' && k.length > live.length + 4) u.drill.history += n;
      else if(what === 'pending' && k.length > live.length + 8) u.drill.pending += n;   // per-tab records (#45)
      else if(what === 'backup' && k.length > live.length + 7){
        u.drill.copies += n;
        try { const c = JSON.parse(v); u.copies += Array.isArray(c) ? c.length : 1; } catch(e){ u.copiesUnread++; }
      }
      else u.drill.other += n;
    }
    const m = /^(.+?):(data|log):(.+)$/.exec(k);
    if(m){
      if(m[2] === 'data'){ const vm = /^\{"v":([0-9]+)[,}]/.exec(v); if(vm && Number(vm[1]) >= 2) core.add(m[1]); }
      const p = (profiles[m[1] + '\n' + m[3]] = profiles[m[1] + '\n' + m[3]] || {ns: m[1], name: m[3], size: 0});
      p.size += n;
    }
    const c = k.indexOf(':');
    if(c > 0){
      const ns = k.slice(0, c);
      (byNs[ns] = byNs[ns] || []).push(k.length + PREVIEW_SUFFIX.length + v.length);
      if(ns.endsWith(PREVIEW_SUFFIX)) hasPreview.add(ns.slice(0, -PREVIEW_SUFFIX.length));
    }
  }
  u.left = STORE_LIMIT - u.total;
  u.profileNeed = 0; u.profileName = null;
  for(const p of Object.values(profiles))
    if(core.has(p.ns) && p.size > u.profileNeed){ u.profileNeed = p.size; u.profileName = p; }
  u.previewNeed = 0; u.previewNs = null;
  for(const ns of core){
    if(ns.endsWith(PREVIEW_SUFFIX) || hasPreview.has(ns)) continue;
    const need = (byNs[ns] || []).reduce((a, b) => a + b, 0);
    if(need > u.previewNeed){ u.previewNeed = need; u.previewNs = ns; }
  }
  u.need = Math.max(u.profileNeed, u.previewNeed);
  u.warn = u.left < u.need;
  u.items.sort((a, b) => b[1] - a[1]);
  return u;
}
const pctOf = n => (100 * n / STORE_LIMIT).toFixed(1) + '%';
/* A stored key in words, for the list of the largest items. */
const nsName = ns => ns === COURSE.ns ? 'this drill' : ns === COURSE.ns + PREVIEW_SUFFIX ? 'this drill\'s preview'
                                     : `another drill, the one with the namespace <code>${esc(ns)}</code>`;
function storeItemName(k){
  const m = /^(.+?):(data|log|backup|exam|pending):(.+)$/.exec(k);
  if(!m){
    const c = k.indexOf(':');
    return `<code>${esc(k)}</code> (${c > 0 ? nsName(k.slice(0, c)) : 'a key with no namespace'})`;
  }
  const what = {data: 'progress', log: 'answer history', backup: 'copies kept by Import', exam: 'exam paper',
                pending: 'records of each writing tab\'s last save (pending)'}[m[2]];
  const who = m[2] === 'pending' ? m[3].split(':')[0] : m[3];
  return `${what} of "${esc(who)}" (${nsName(m[1])})`;
}
const ESTIMATE = 'These figures are an estimate. Each size is the number of characters stored (UTF-16 units: an emoji counts as 2), ' +
  'the key and its value together; the bytes a browser writes to disk can differ. The limit differs by browser: in Chromium 153 ' +
  `one origin accepted exactly ${nChars(STORE_MEASURED)} characters before the browser refused to save more; MDN says browsers ` +
  `can store "up to 5 MiB" of local storage per origin, which is ${nChars(STORE_LIMIT)} characters if counted as Chromium counts them; ` +
  'Safari\'s limit has not been measured. ' +
  'So in another browser the warning can come early or late, and saving can stop before or after the point these figures show.';
/* The warning's HTML, or '' when the space left is enough (or storage cannot be read). */
function storageWarnHtml(u){
  u = u === undefined ? storageUse() : u;
  if(!u || !u.warn) return '';
  const copies = readCopies();
  const top = u.items.slice(0, 3).map(([k, n]) => `<li>${storeItemName(k)}: ${nChars(n)} characters</li>`).join('');
  const needs = [];
  if(u.profileNeed > u.left) needs.push(`one more profile the size of the largest one here (${nChars(u.profileNeed)} characters)`);
  if(u.previewNeed > u.left) needs.push(`the first opening of a preview of <code>${esc(u.previewNs)}</code>, which copies its saved keys (${nChars(u.previewNeed)} characters)`);
  return `<div class="note" data-storage-warn role="status">
    <p style="margin:0 0 6px"><b>Storage for this site in this browser may run short.</b>
    This site stores ${nChars(u.total)} characters here (${pctOf(u.total)} of ${nChars(STORE_LIMIT)}), so about ${nChars(Math.max(0, u.left))} are left.
    That is less than the space needed by ${needs.join(' or by ')}. This is an estimate: the limit differs by browser (see Settings, "Storage in this browser").</p>
    <p style="margin:0 0 4px">The largest items stored:</p><ul style="margin:0 0 6px;padding-left:20px">${top}</ul>
    <p style="margin:0 0 6px">Export your progress to keep a copy of it outside the browser. Nothing is deleted unless you choose to delete it.</p>
    <div class="frow"><button class="btn" data-sw-export>Export progress</button>${copies && copies.length
      ? `<button class="btn ghost" data-sw-delete>Delete the ${copies.length} cop${copies.length === 1 ? 'y' : 'ies'} kept by Import</button>` : ''}</div>
  </div>`;
}
function wireStorageWarn(box, after){
  box.querySelectorAll('[data-sw-export]').forEach(b => b.onclick = exportProgress);
  box.querySelectorAll('[data-sw-delete]').forEach(b => b.onclick = () => { deleteCopies(); if(after) after(); });
}
/* Settings' section: the figures, how the warning point is set, and the warning. */
function storageSection(){
  const u = storageUse();
  if(!u) return `<h3 id="storage">Storage in this browser</h3>
  <div class="filters"><p class="meta" style="margin:0">This page cannot read the browser's storage, so how much it holds is not shown.</p></div>`;
  const d = u.drill, kept = (DB.answers || []).length;
  return `<h3 id="storage">Storage in this browser</h3>
  <div class="filters" data-storage>
    ${storageWarnHtml(u)}
    <p style="margin:0 0 6px">This site (every drill at this web address) stores <b data-st="total">${nChars(u.total)}</b> characters in this browser:
      <b data-st="pct">${pctOf(u.total)}</b> of ${nChars(STORE_LIMIT)}. About <span data-st="left">${nChars(Math.max(0, u.left))}</span> characters are left.</p>
    <p style="margin:0 0 4px">${BUILD.preview ? 'This preview\'s part' : 'This drill\'s part'}:</p>
    <ul style="margin:0 0 6px;padding-left:20px;font-size:14px">
      <li>progress, every profile: <span data-st="progress">${nChars(d.progress)}</span> characters</li>
      <li>answer history, every profile: <span data-st="history">${nChars(d.history)}</span> characters</li>
      <li>${BUILD.preview ? 'the live drill (this page is its preview)' : 'preview copies'}: <span data-st="preview">${nChars(d.preview)}</span> characters</li>
      <li>copies kept by Import: <span data-st="copies">${nChars(d.copies)}</span> characters, <span data-st="ncopies">${nChars(u.copies)}</span> cop${u.copies === 1 ? 'y' : 'ies'}${u.copiesUnread ? ` (${u.copiesUnread} list${u.copiesUnread === 1 ? '' : 's'} could not be read)` : ''}</li>
      <li>records of each writing tab's last save (pending): <span data-st="pending">${nChars(d.pending)}</span> characters</li>
      <li>other settings of this drill: <span data-st="other">${nChars(d.other)}</span> characters</li>
    </ul>
    <p style="margin:0 0 6px">The profile “${esc(PROFILE)}” keeps <span data-st="kept">${nChars(kept)}</span> answers (at most ${nChars(ANSWERS_MAX)}) of
      <span data-st="qn">${nChars(DB.qn || 0)}</span> recorded in all. The answer history has ${nChars(LOG.length)} entries${LOG.length > LOG_MAX && mayWrite() ? `, more than ${nChars(LOG_MAX)}: nothing is removed unless you choose to <button class="btn ghost" id="btnCapTrim" type="button">Remove the oldest ${nChars(LOG.length - LOG_MAX)}…</button>` : ''}.</p>
    <p style="font-size:13.5px;color:var(--text-dim);margin:4px 0 0" data-st="how">
      How the warning point is set: a warning shows here and in the Quiz tab when the space left is less than the larger of two amounts.
      One is the size of the largest profile this browser holds for a drill on this engine (its progress plus its answer history), now
      ${nChars(u.profileNeed)} characters: Import can put a file into a new profile of its own, which can need that much.
      The other is what the first opening of a course's preview copies (every saved key of that course, for a course whose preview has
      not been opened in this browser), now ${nChars(u.previewNeed)} characters. The warning point is therefore
      ${nChars(STORE_LIMIT - u.need)} characters stored. It is worked out from what is stored, not from a fixed percentage.
      Drills not on this engine count in the site's total only.</p>
    <p style="font-size:13.5px;color:var(--text-dim);margin:6px 0 0" data-st="estimate">${ESTIMATE}</p>
  </div>`;
}
/* The Quiz tab's warning: put first in the pane after each drawing of it (any renderer,
   feature modules too), and only while the space left is short. */
function quizStorageWarn(){
  const el = document.getElementById('v-quiz'); if(!el) return;
  const old = el.querySelector(':scope > [data-storage-warn]');
  const html = storageWarnHtml();
  if(!html){ if(old) old.remove(); return; }
  const t = document.createElement('div'); t.innerHTML = html;
  const box = t.firstElementChild;
  // This guard stops a loop: inserting the box is itself a change to the pane, which runs
  // this watcher again; without the comparison it would replace the box at every run and
  // never stop (the review of #46, its broken copy M13, hung the page).
  if(old && old.innerHTML === box.innerHTML) return;
  if(old) old.replaceWith(box); else el.insertBefore(box, el.firstChild);
  wireStorageWarn(box, quizStorageWarn);
}

/* Calendar days to the exam, from an optional ISO `when` on the active exam
   (`date` is the human string shown in the header). Counted as whole days
   rather than hours rounded up, so the morning of the exam says "today". */
function daysToExam(){
  if(!EXAM.when) return null;
  const day = d => { const x = new Date(d); x.setHours(0,0,0,0); return x.getTime(); };
  const t = day(EXAM.when);
  return isNaN(t) ? null : Math.round((t - day(Date.now())) / 86400000);
}
function examCountdown(){
  const d = daysToExam();
  if(d === null) return '';
  const start = new Date(EXAM.when).getTime(), end = start + (EXAM.minutes || 0)*60000, now = Date.now();
  if(now >= end) return 'This exam is over.';
  if(now >= start) return 'The exam is in progress.';
  if(d <= 0) return 'Exam day is today.';
  return `${d} day${d === 1 ? '' : 's'} until the exam.`;
}

/* ---------- Start here ----------
   One short block at the top of the Topics tab with the routes the page already
   has, so a first visit meets an obvious start before the filters, the change
   log and the whole-bank passes: the guides (or the topic list), the adaptive
   runner, Weak spots and the exam tab. A route whose tab the course dropped is
   left out; Start practice is off when the filters select nothing. */
const hasTab = v => !!document.querySelector(`#nav button[data-v="${v}"]`);
function startHere(nFiltered){
  const r = [];
  const guide = typeof GUIDE_HTML !== 'undefined' && String(GUIDE_HTML).trim() && hasTab('guide');
  r.push(['learn', 'Learn a topic', guide ? 'Read a guide, then drill its topic' : 'Pick a topic below and drill it']);
  r.push(['practice', 'Start practice', 'Mixed questions, missed concepts first; follows the filters below', !nFiltered]);
  if(hasTab('gaps')) r.push(['weak', 'Review weak concepts', 'What you have missed, and what to read']);
  if(hasTab('exam')) r.push(['exam', 'Practice exam', 'A paper drawn like the real one']);
  return `<div class="panel startbox" id="startHere"><b class="starthead">Start here</b>
    <div class="startgrid">${r.map(([k, t, d, off]) =>
      `<button type="button" class="startbtn" data-start="${k}"${off ? ' disabled' : ''}><b>${t}</b><small>${d}</small></button>`).join('')}</div></div>`;
}
function wireStart(root){
  root.querySelectorAll('#startHere button[data-start]').forEach(b => b.onclick = () => {
    const k = b.dataset.start;
    if(k === 'practice') return startQuiz(null, null);
    if(k === 'weak') return show('gaps');
    if(k === 'exam') return show('exam');
    if(typeof GUIDE_HTML !== 'undefined' && String(GUIDE_HTML).trim() && hasTab('guide')) return show('guide');
    const t = root.querySelector('details.topic');
    if(t){ t.open = true; scrollToEl(t); }
  });
}

function renderTopics(){
  const counts = {};
  QUESTIONS.forEach(q => counts[q.prof] = (counts[q.prof]||0)+1);

  let h = `<h2>Pick a topic</h2>
  <p class="sub">${esc(EXAM.name)}: ${EXAM.questions} questions, ${EXAM.minutes} minutes${EXAM.date ? ', ' + esc(EXAM.date) : ''}.
  ${EXAM.blurb ? esc(EXAM.blurb) + '. ' : ''}Question bank: ${QUESTIONS.length} across ${conceptsIn(QUESTIONS).length} concepts${
    requiredQs().length < QUESTIONS.length ? `, ${QUESTIONS.length - requiredQs().length} of them in optional topics outside ${esc(EXAM.name)}` : ''}.
  ${examCountdown() ? '<b>' + esc(examCountdown()) + '</b>' : ''}</p>
  ${startHere(poolFor(null, null).length)}
  <p class="stamp">Built ${esc(BUILD.stamp || '')}${(BUILD.changelog||[]).length ? ' · <a href="#" id="whatsnew">all changes</a>' : ''}</p>
  ${newsCard()}`;

  h += filterBar();

  // The featured pass follows the paper rather than the bank. A bank usually
  // holds far more questions on the material worth few marks than on the
  // material worth many, so a straight pass through everything spends the
  // evening in the wrong place. This one takes the whole of the heaviest pool
  // and samples the others in the paper's own proportion. Both whole-bank
  // passes come after the topic list: the Start here block above is the way in
  // for a first visit, and these are the advanced route.
  const REQ = requiredQs(), nAll = REQ.length, nFiltered = poolFor(null, null).length;
  const wp = weightedPool();
  // filters that select nothing: say why and offer to clear them, and offer no
  // Start, since every one would open an empty set or quietly ignore the filters
  if(!nFiltered) h += `<div class="panel" id="noMatch"><b>No questions match these filters:</b> ${emptyReason()}.
    <div class="row" style="margin-top:9px"><button class="btn" id="clearFilters">Clear filters</button></div></div>`;
  // the whole-bank passes are the advanced route: offered after the topic list
  const passes = !nFiltered ? '' : `<div class="topic sweepcard" id="wholeBank"><div class="subs">
    <div class="subrow"><span class="sname"><b>Exam-weighted pass — ${wp.length} questions</b>
      <small>Every question from the ${mainPool().marks}-mark pool, plus the other pools in the paper's ${EXAM.pools.map(p=>p.marks).join(' : ')} proportion. Shuffled, each once.</small></span>
      <button id="sweepWeighted">Start</button></div>
    <div class="subrow"><span class="sname"><b>All ${nAll} questions, one pass</b>
      <small>Everything in the bank${nAll < QUESTIONS.length ? ' outside the optional topics' : ''}, shuffled, each asked once, nothing held back by scheduling</small></span>
      <button id="sweepAll" class="ghost">Start</button></div>
    ${nFiltered < nAll ? `<div class="subrow"><span class="sname"><b>All ${nFiltered} under the current filters</b>
      <small>The same straight pass, limited to what the chips above select</small></span>
      <button id="sweepFiltered" class="ghost">Start</button></div>` : ''}
  </div></div>`;

  for(const t of TOPICS){
    const pool = poolFor(t.id, null);
    if(!pool.length) continue;
    const m = masteryOf(pool);
    const pct = m.total ? Math.round(100*m.mastered/m.total) : 0;
    // an optional topic says so on its line, and that it is outside the active exam
    h += `<details class="topic${t.optional ? ' optional' : ''}"${t.open?' open':''}>
      <summary>
        <span class="tname">${t.optional ? `<span class="lbl optional" data-optional>Optional</span> ` : ''}${esc(t.name)}<small>${esc(t.cite)}${
          t.optional ? ` · optional practice, outside ${esc(EXAM.name)}: left out of Everything, the passes, exam papers and Weak spots` : ''}</small></span>
        ${profTag(t.prof)}
        <span class="meter"><i style="width:${pct}%"></i></span>
        <span class="counts">${m.mastered}/${m.total}</span>
      </summary>
      <div class="subs">`;

    for(const s of t.subs){
      const sp = poolFor(t.id, s.id);
      if(!sp.length) continue;
      const sm = masteryOf(sp);
      const spct = sm.total ? Math.round(100*sm.mastered/sm.total) : 0;
      const done = sm.total && sm.mastered === sm.total;
      h += `<div class="subrow">
        <span class="sname">${esc(s.name)}<small>${sp.length} questions · ${esc(s.cite)}</small></span>
        <span class="meter"><i style="width:${spct}%"></i></span>
        <button data-t="${t.id}" data-s="${s.id}" class="${done?'done':''}">${done?'Review':'Start'}</button>
      </div>`;
    }
    h += `<div class="subrow" style="border-top:1px solid var(--line-soft);margin-top:4px;padding-top:11px">
        <span class="sname"><b>Everything in ${esc(t.name)}</b><small>${pool.length} questions, mixed order</small></span>
        <button data-t="${t.id}" data-s="">Start</button>
      </div>`;
    h += `</div></details>`;
  }

  if(nFiltered) h += `<h3>Mixed drills and whole-bank passes</h3>
  <div class="topic"><div class="subs">
    <div class="subrow"><span class="sname"><b>Everything, adaptive</b>
      <small>Whole bank under the current filters — missed concepts first, and it stops when nothing is due</small></span>
      <button data-t="" data-s="">Start</button></div>
  </div></div>`;
  h += passes;

  $('#v-topics').innerHTML = h;
  wireStart($('#v-topics'));

  const wn = $('#whatsnew'); if(wn) wn.onclick = e => { e.preventDefault(); show('settings'); };
  const nok = $('#newsok'); if(nok) nok.onclick = () => {
    store.set(NEWS_KEY(), newsId(BUILD.changelog[0]));
    const c = $('#news'); if(c) c.remove();
  };
  const nall = $('#newsall'); if(nall) nall.onclick = () => show('settings');
  $('#v-topics').querySelectorAll('.chip[data-f]').forEach(b => b.onclick = () => {
    FILTER[b.dataset.f] = b.dataset.v; renderTopics();
  });
  const cf = $('#clearFilters');
  if(cf) cf.onclick = () => { FILTER.prof = FILTER.tier = FILTER.tag = 'all'; renderTopics(); };
  $('#v-topics').querySelectorAll('.subrow button[data-t]').forEach(b => b.onclick = () => {
    startQuiz(b.dataset.t || null, b.dataset.s || null);
  });
  const sa = document.getElementById('sweepAll');
  const sw = document.getElementById('sweepWeighted'); if(sw) sw.onclick = () => startSweep('weighted');
  if(sa) sa.onclick = () => startSweep('all');
  const sf = document.getElementById('sweepFiltered');
  if(sf) sf.onclick = () => startSweep('filtered');
}

/* ==========================================================================
   QUIZ RUNNER
   ========================================================================== */
let Q = null;     // {pool, label, current, order, answered, lastId, examMode}

function startQuiz(topicId, subId){
  const pool = poolFor(topicId, subId);
  if(!pool.length){ alert('No questions match those filters.'); return; }
  const t = TOPICS.find(x=>x.id===topicId);
  const s = t && t.subs.find(x=>x.id===subId);
  // the whole bank with no filter on is the one broad adaptive session; a topic, a
  // subtopic or a filtered "Everything" is a set the student chose (targetedSet)
  const broad = !topicId && !subId && FILTER.prof === 'all' && FILTER.tier === 'all' && FILTER.tag === 'all';
  Q = {pool, label: s ? `${t.name} — ${s.name}` : (t ? t.name : 'Everything'), broad,
       current:null, answered:0, lastId:null, examMode:false, picked:null, revealed:false};
  nextQuestion();
  show('quiz');
}

/* A straight sweep of the whole bank: every question asked once, in shuffled
   order, with no scheduling gate. The spaced-repetition runner is the better
   way to study, since it brings missed concepts back sooner and holds mastered
   ones, but it deliberately stops when nothing is due. When the whole set is
   examinable, seeing all of it once is its own requirement, and this is the
   mode for that. Answers still record, so Weak spots stays accurate. */
/* The pool for the exam-weighted pass: the whole 38-mark pool, and the other
   two pools sampled so the three sit in the paper's 38 : 8 : 4 ratio. Sampling
   takes one question per concept before any concept repeats, so the smaller
   pools are covered broadly rather than deeply. Deterministic per call only
   in size; the members are drawn fresh each time. */
const mainPool = () => EXAM.pools.reduce((a, b) => b.marks > a.marks ? b : a, EXAM.pools[0]);
function weightedPool(){
  const main = mainPool();
  const anchor = requiredQs().filter(main.test);
  const rest = EXAM.pools.filter(p => p !== main).flatMap(p => {
    const pool = requiredQs().filter(p.test);
    return drawN(pool, Math.min(pool.length, Math.round(anchor.length * p.marks / main.marks)));
  });
  return [...anchor, ...rest];
}
function startSweep(scope){
  const pool = scope === 'filtered' ? poolFor(null, null)
             : scope === 'weighted' ? weightedPool()
             : requiredQs().slice();
  if(!pool.length){ alert('No questions match those filters.'); return; }
  Q = {pool,
       label: scope === 'filtered' ? 'Every question under these filters'
            : scope === 'weighted' ? 'Exam-weighted pass' : 'Every question',
       sweep: shuffle(pool.map(q => q.id)), i: 0,
       // a pass of everything, or the exam-weighted sample, is drawn again for a
       // repeat; a filtered pass, like every other set, repeats its own questions
       repeat: scope === 'filtered' ? null : scope,
       current:null, answered:0, lastId:null, examMode:false, picked:null, revealed:false};
  nextQuestion();
  show('quiz');
}
/* The same questions again, once each, in a new order: what "again, reshuffled"
   does for any set that is not a pass of everything or the exam-weighted sample.
   The set's own pool is kept, so a filter changed since, or a retry question added
   to the queue on the way, never widens it. */
function repeatSet(){
  if(Q.repeat){ startSweep(Q.repeat); return; }
  const pool = Q.pool.slice();
  // a filtered pass is named by filters that may have changed since: name it by its size
  const label = Q.label === 'Every question under these filters' ? `The same ${pool.length} questions again` : Q.label;
  Q = {pool, label, sweep: shuffle(pool.map(q => q.id)), i: 0,
       current:null, answered:0, lastId:null, examMode:false, picked:null, revealed:false};
  nextQuestion();
}

/* A targeted set: any session the student narrowed (Louis, 2026-11-06: "preserve
   the original targeted set"): a topic or subtopic drill, a filtered "Everything",
   a filtered pass, every weak-spot drill and repeat, "Missed concepts". Its retry
   after "I was sure of that" comes from the session's own pool only. Three sessions
   are broad and keep reaching the rest of the bank: "Everything, adaptive" with no
   filter on (Q.broad), the pass of every question and the exam-weighted pass
   (Q.repeat). Which question the adaptive runner picks next is unchanged. */
const targetedSet = () => !!(Q && !Q.repeat && !Q.broad);
function nextQuestion(){
  let q = null;
  // after "I was sure of that": a different question on the same concept comes
  // next (scheduler rule 8); retryConcept is set only when there is one
  const retry = Q.retryConcept ? retryQuestion(Q.retryConcept, Q.retryNot, Q.pool, targetedSet()) : null;
  Q.retryConcept = Q.retryNot = null;
  if(Q.sweep){
    if(retry){
      // in a fixed pass the retry moves up from later in the queue, or is added
      const at = Q.sweep.indexOf(retry.id, Q.i);
      if(at >= 0) Q.sweep.splice(at, 1);
      Q.sweep.splice(Q.i, 0, retry.id);
    }
    // walk the fixed queue rather than asking the scheduler what is due
    while(Q.i < Q.sweep.length && !q) q = byId(Q.sweep[Q.i++]);
  }else{
    q = retry || pickNext(Q.pool, Q.lastId);
  }
  Q.current = q; Q.picked = null; Q.revealed = false; Q.startedAt = Date.now();
  Q.rights = null; Q.lastRight = false; Q.missLogged = null; Q.guessedLogged = false; Q.sureLogged = null;
  if(q) Q.order = shuffle((q.options || []).map((o,i)=>i));
  renderQuiz();
}

/* Has this exact question been shown before (any result)? */
const askedBefore = q => { const s = DB.concepts[q.concept]; return !!(s && s.asked && s.asked.includes(q.id)); };
/* The small labels on a question card: exam and module from the manifest,
   and the kind of thinking the question asks for. */
function qLabel(q){
  const l = lecOf(q), k = skillOf(q);
  return `${l && !isOptional(q) ? `<span class="lbl">Exam ${l.exam} · ${esc(l.module)}</span>` : ''}${isOptional(q) ? '<span class="lbl optional" data-optional>Optional</span>' : ''}<span class="lbl kind">${esc(SKILL_SHORT[k] || k)}</span>`;
}
/* Material that came from the lecture audio rather than a slide is marked
   wherever a citation is shown, in the quiz and in the exam review alike. */
const srcFlag = q => q.source==='transcript' ? '<span class="srcflag">from lecture audio</span>'
                   : q.source==='both'       ? '<span class="srcflag">slides and lecture audio</span>' : '';
function renderQuiz(){
  figClose();
  const el = $('#v-quiz');
  if(!Q){
    el.innerHTML = `<div class="empty"><p><b>No set is open.</b></p>
      <p style="margin:10px 0 16px">Pick a topic, a subtopic or one of the passes on the Topics tab to start.</p>
      <p><button class="btn" id="emptyTopics">Choose a topic</button></p></div>`;
    document.getElementById('emptyTopics').onclick = () => show('topics');
    return;
  }
  if(!Q.current && Q.sweep){
    const nReq = requiredQs().length;
    const n = Q.repeat ? (Q.repeat === 'all' ? nReq : Q.pool.length) : Q.pool.length;
    const whole = Q.pool.length >= nReq;
    el.innerHTML = `<div class="empty">
      <p><b>That is every question in this set — ${n === 1 ? 'its 1 question' : `all ${n} of them`}.</b></p>
      <p style="margin:10px 0 16px">Everything you answered is recorded, so Weak spots now
        reflects ${whole ? 'the whole bank' : 'these answers too'} and the adaptive runner will bring the missed concepts back first.</p>
      <p style="display:flex;gap:9px;flex-wrap:wrap;justify-content:center">
        <button class="btn" id="goGaps">See weak spots</button>
        <button class="btn ghost" id="goAgain">${Q.repeat === 'weighted' ? 'A new exam-weighted pass' : `Same ${n === 1 ? 'question' : 'questions'} again, reshuffled`} (${n})</button>
        ${whole ? '' : `<button class="btn ghost" id="goWhole">Whole bank, one pass (${nReq})</button>`}
        <button class="btn ghost" onclick="show('topics')">Back to topics</button>
      </p></div>`;
    document.getElementById('goGaps').onclick = () => show('gaps');
    document.getElementById('goAgain').onclick = repeatSet;
    const gw = document.getElementById('goWhole'); if(gw) gw.onclick = () => startSweep('all');
    return;
  }
  if(!Q.current){
    const t = TOPICS.find(x=>x.name===String(Q.label).split(' — ')[0]);
    const wider = t ? poolFor(t.id, null).length : 0;
    // The scheduler stops when no concept is due, which can happen while other
    // wordings of those concepts have never been shown. Say so, and offer them.
    const unseenQ = Q.pool.filter(q => !askedBefore(q));
    el.innerHTML = `<div class="empty">
      <p><b>${unseenQ.length
        ? `Every concept in this set has been answered at least once, and none is due yet.`
        : `You have worked through everything available in this set.`}</b></p>
      <p style="margin:10px 0 16px">${Q.pool.length === 1
        ? 'This subtopic currently holds one question, so there is nothing further to draw from here.'
        : unseenQ.length
          ? `${unseenQ.length} question${unseenQ.length===1?'':'s'} with other wordings ${unseenQ.length===1?'has':'have'} not been shown. Missed and due concepts come back on their own schedule.`
          : 'Every question here has been shown and every concept is scheduled to return later.'}</p>
      <p style="display:flex;gap:9px;flex-wrap:wrap;justify-content:center">
        ${unseenQ.length ? `<button class="btn" id="goUnseen">Ask the ${unseenQ.length} not yet shown</button>` : ''}
        ${t && wider > Q.pool.length
          ? `<button class="btn ghost" id="goWide">Continue with all of ${esc(t.name)} (${wider})</button>` : ''}
        <button class="btn ghost" id="goAll">Continue with everything</button>
        <button class="btn ghost" onclick="show('topics')">Back to topics</button>
      </p></div>`;
    const gu = document.getElementById('goUnseen');
    if (gu) gu.onclick = () => {
      Q = {pool:unseenQ, label:(Q.label||'') + ' — not yet shown', sweep: shuffle(unseenQ.map(q=>q.id)), i:0,
           current:null, answered:0, lastId:null, examMode:false, picked:null, revealed:false};
      nextQuestion();
    };
    const gw = document.getElementById('goWide');
    if (gw) gw.onclick = () => startQuiz(t.id, null);
    document.getElementById('goAll').onclick = () => startQuiz(null, null);
    return;
  }
  const q = Q.current, s = DB.concepts[q.concept];
  const left   = remainingIn(Q.pool);
  const seenQ  = Q.pool.filter(askedBefore).length;
  const pctDone = Q.pool.length ? Math.round(100*seenQ/Q.pool.length) : 0;
  const seenBefore = s && s.seen > 0;
  const missedBefore = s && s.wrong > 0 && s.box === 0;

  let h = `<div class="qcard"><div class="qhead">
    ${profTag(q.prof)}
    <span>${esc(Q.label)}</span>
    ${qLabel(q)}
    <span class="spacer"></span>
    ${missedBefore ? '<span style="color:var(--bad)">missed before</span>' :
      seenBefore   ? '<span>review</span>' : '<span>new</span>'}
  </div>
  <div class="qprog">
    <span>${Q.sweep ? `question ${Q.i} of ${Q.sweep.length}` : `${seenQ} of ${Q.pool.length} questions shown`}</span>
    <span class="pbar"><i style="width:${Q.sweep ? Math.round(100*Q.i/Q.sweep.length) : pctDone}%"></i></span>
    <span>${Q.sweep ? `${Q.sweep.length - Q.i} to go` : `${left} concept${left===1?'':'s'} to go`}</span>
  </div>
  <div class="qprog" style="border-top:0;padding-top:0">${sessStrip()}</div>
  <div class="qbody">
    <p class="stem">${esc(q.stem)}</p>`;

  if(q.img && IMAGES[q.img]) h += `<img class="qimg" src="${IMAGES[q.img]}" alt="Reaction scheme for this question">`;
  // A structure a question asks you to name belongs above the options, where
  // a slide crop would go. FG holds it as drawn SVG rather than a picture.
  if(q.fg) h += fgShow(q.fg);

  const multi = isMulti(q);
  const picks = multi ? (Q.picked || []) : null;
  const kind = q.type || 'mc';
  if(kind !== 'mc'){
    h += kind === 'numeric' ? numericBody(q) : matchBody(q);
    if(Q.revealed) h += explainRow(q);
    h += `</div><div class="qfoot">`;
    if(!Q.revealed){
      h += kind === 'numeric'
        ? `<button class="btn" id="btnCheck">Check answer</button><span style="font-size:13px;color:var(--text-dim)">Type the number${q.units ? ' in ' + esc(q.units) : ''}.</span>`
        : `<button class="btn" id="btnCheck"${matchComplete(q) ? '' : ' disabled'}>Check answer</button><span style="font-size:13px;color:var(--text-dim)">${(Q.picked||[]).filter(x=>x!==null&&x!==undefined).length} of ${q.pairs.length} matched</span>`;
    }else{
      h += `<button class="btn" id="btnNext">Next question</button>`;
      if(Q.lastRight && !Q.guessedLogged) h += confidenceButtons();
      if(!Q.lastRight) h += sureButton();
      h += `<button class="btn ghost" onclick="show('topics')">Change topic</button>`;
    }
    h += `</div></div>`;
    el.innerHTML = h;
    wireTyped(q, kind);
    return;
  }
  if(multi) h += `<p class="sata">Select all that apply, then check. Marked right only when the whole set matches.</p>`;

  Q.order.forEach((oi,n)=>{
    const o = q.options[oi];
    let cls = 'opt' + (multi ? ' multi' : '');
    const chosen = multi ? picks.includes(oi) : (oi === Q.picked);
    if(Q.revealed){
      if(chosen) cls += o.correct ? ' pick-ok' : ' pick-bad';
      else if(o.correct)  cls += ' reveal-ok';
    }else if(multi && chosen){
      cls += ' on';
    }
    h += `<button class="${cls}" data-o="${oi}"${Q.revealed?' disabled':''} aria-pressed="${chosen}">
      <span class="k">${multi ? (chosen ? '\u2611' : '\u2610') : LETTERS[n]}</span><span>${esc(o.t)}</span></button>`;
  });

  if(Q.revealed){
    // one gloss per term per question, shared between the options and the concept block
    const seen = new Set();
    const self = [teachText(q.teach), ...q.options.map(o=>o.why||'')].join(' ');
    let ok, verdictLine;
    if(multi){
      ok = gradeMulti(q, picks);
      const want = correctSet(q);
      const missedOnes = want.filter(i => !picks.includes(i)).length;
      const extraOnes  = picks.filter(i => !want.includes(i)).length;
      verdictLine = ok ? `\u2713 Correct \u2014 all ${want.length} identified`
        : `\u2717 Not correct \u2014 ${missedOnes ? missedOnes + ' correct option' + (missedOnes>1?'s':'') + ' left out' : ''}${
            missedOnes && extraOnes ? ', ' : ''}${extraOnes ? extraOnes + ' wrong option' + (extraOnes>1?'s':'') + ' included' : ''}`;
    }else{
      ok = q.options[Q.picked].correct;
      verdictLine = ok ? '\u2713 Correct'
        : `\u2717 Not correct \u2014 the answer is ${LETTERS[Q.order.indexOf(q.options.findIndex(o=>o.correct))]}`;
    }
    h += `<div class="why">
      <p class="verdict ${ok?'ok':'bad'}">${verdictLine}</p>`;
    Q.order.forEach((oi,n)=>{
      const o = q.options[oi];
      const chosen = multi ? picks.includes(oi) : (oi === Q.picked);
      h += `<div class="wrow">
        <span class="mark ${o.correct?'y':'n'}">${o.correct?'\u2713':'\u2717'}</span>
        <span class="wtxt"><b>${LETTERS[n]}. ${esc(o.t)}</b>${multi && chosen ? ' <i class="youpicked">you selected this</i>' : ''} \u2014 ${glossify(esc(o.why), seen, self)}</span>
        ${optFig(o.t)}</div>`;
    });
    if(q.teach) h += `<div class="teach"><h4>The concept behind this</h4>${
        q.svg ? `<div class="tdiag">${q.svg}</div>` : ''}${
        q.teachImg && IMAGES[q.teachImg] ? `<img class="qimg tdimg" src="${IMAGES[q.teachImg]}" alt="Figure from the lecture slide">` : ''}${
        cmpStrip(q, 'The structures side by side')}${renderTeach(q.teach, seen, self)}</div>`;
    if(q.note) h += `<p class="prose" style="margin:13px 0 0;font-size:14.5px">${esc(q.note)}</p>`;
    h += `<div class="cite">${q.quote ? `<span class="quote">\u201c${esc(q.quote)}\u201d</span>` : ''}${
        srcFlag(q)}${esc(q.cite)}</div>`;
    h += explainRow(q);
    h += `</div>`;
  }
  h += `</div><div class="qfoot">`;
  if(!Q.revealed){
    if(multi) h += `<button class="btn" id="btnCheck"${picks.length ? '' : ' disabled'}>Check answer</button>
      <span style="font-size:13px;color:var(--text-dim)">${picks.length} selected</span>`;
    else h += `<span style="font-size:13px;color:var(--text-dim)">Pick an answer.</span>`;
  }else{
    const wasRight = multi ? gradeMulti(q, picks) : q.options[Q.picked].correct;
    h += `<button class="btn" id="btnNext">Next question</button>`;
    if(wasRight && !Q.guessedLogged) h += confidenceButtons();
    if(!wasRight) h += sureButton();
    h += `<button class="btn ghost" onclick="show('topics')">Change topic</button>`;
  }
  h += `</div></div>`;
  el.innerHTML = h;

  // only real answer buttons: a label inside the card (the Optional badge) is never an answer (ChatGPT review of #72)
  el.querySelectorAll('button.opt[data-o]').forEach(b => b.onclick = () => multi ? toggleOption(+b.dataset.o) : answer(+b.dataset.o));
  const bc = $('#btnCheck'); if(bc) bc.onclick = submitMulti;
  const bn = $('#btnNext'); if(bn) bn.onclick = () => { Q.answered++; Q.lastId = Q.current.id; nextQuestion(); };
  wireConfidence();
  armFigs(el);
}
/* After a correct answer: how sure were you. "Not sure" brings the concept
   back at the short interval; "guessed" treats it as not yet known. Neither
   pressed, the answer stands as known, and the answer history records it as
   "Knew it"; the line says so, so the record matches what the student saw. */
function confidenceButtons(){
  return `<button class="btn amber" id="btnShaky">Not sure, ask again soon</button>
    <button class="btn amber" id="btnGuess">I guessed that one</button>
    <span class="meta" id="knewNote">Next counts as “Knew it”.</span>`;
}
/* After a miss: "I was sure of that" (scheduler rule 8). Tapped, it logs the
   confidence as "sure", a different question on the same concept comes next
   when the concept has one, and the concept is due on later days until it is
   answered right on a later day. The line under it says which of these
   happens, so the record matches what the student saw. */
const SURE_NOTE = {
  retry: 'A different question on this concept comes next, and the concept is asked again on a later day.',
  later: 'This concept is asked again on a later day.',
  fsrs: ''};      // under an FSRS model the tap only records the confidence
const sureNote = k => SURE_NOTE[k] ? `<span class="meta" id="sureNote">${esc(SURE_NOTE[k])}</span>` : '';
function sureButton(){
  if(Q.sureLogged) return `<button class="btn amber" id="btnSure" disabled>Marked as sure</button>${sureNote(Q.sureLogged)}`;
  return `<button class="btn amber" id="btnSure">I was sure of that</button>`;
}
function wireConfidence(){
  const bu = $('#btnSure'); if(bu && !bu.disabled) bu.onclick = () => {
    const q = Q.current;
    if(!markSure(q)) return;
    const concept = armOf(q.concept) === 'concept';
    const other = concept ? retryQuestion(q.concept, q.id, Q.pool, targetedSet()) : null;
    if(other){ Q.retryConcept = q.concept; Q.retryNot = q.id; }
    Q.sureLogged = other ? 'retry' : concept ? 'later' : 'fsrs';
    bu.textContent = 'Marked as sure'; bu.disabled = true;
    bu.insertAdjacentHTML('afterend', sureNote(Q.sureLogged));
  };
  const note = () => { const n = $('#knewNote'); if(n) n.remove(); };
  const bg = $('#btnGuess'); if(bg) bg.onclick = () => {
    markGuessed(Q.current);
    Q.guessedLogged = true;
    bg.textContent = 'Marked as a guess'; bg.disabled = true;
    const bs = $('#btnShaky'); if(bs) bs.remove();
    note();
    refreshSess();            // the answer stops counting as solid, so the dots change
  };
  const bs = $('#btnShaky'); if(bs) bs.onclick = () => {
    markShaky(Q.current);
    Q.guessedLogged = true;
    bs.textContent = 'Coming back soon'; bs.disabled = true;
    const g = $('#btnGuess'); if(g) g.remove();
    note();
    refreshSess();
  };
}

/* ---- typed question kinds: numeric answer, and matching ------------------ */
/* Numeric: the student types a number; it is right within `tol` (absolute) of
   `answer`. After the check the worked solution is shown one line at a time,
   each line tagged with the kind of work it is (setup, unit, algebra, round),
   and a wrong answer asks which line the student's own work left, so Weak
   spots can say which kind of miss it was. */
const MISS_KINDS = {setup:'Setup', unit:'Unit conversion', algebra:'Algebra', round:'Rounding'};
function numericBody(q){
  let h = '';
  if(!Q.revealed){
    h += `<div class="numin"><input type="text" inputmode="decimal" id="numIn" value="${Q.picked !== null && Q.picked !== undefined ? esc(Q.picked) : ''}" placeholder="your answer" aria-label="your answer">${q.units ? `<span class="units">${esc(q.units)}</span>` : ''}</div>`;
    return h;
  }
  const typed = Q.picked, ok = Q.lastRight;
  h += `<div class="why"><p class="verdict ${ok?'ok':'bad'}">${ok ? '✓ Correct' : '✗ Not correct'} — the answer is ${esc(fmtNum(q.answer))}${q.units ? ' ' + esc(q.units) : ''}${typed !== null && typed !== undefined && typed !== '' ? `; you wrote ${esc(typed)}` : ''}${q.tol ? ` (accepted within ±${esc(fmtNum(q.tol))})` : ''}</p>`;
  h += `<ol class="steps">` + q.steps.map((s, i) => `<li><span class="stepk">${esc(MISS_KINDS[s.k] || s.k)}</span><code>${esc(s.t)}</code>${s.why ? `<span class="stepwhy">${esc(s.why)}</span>` : ''}</li>`).join('') + `</ol>`;
  if(!ok){
    h += Q.missLogged
      ? `<p class="sub">Logged as a ${esc(MISS_KINDS[Q.missLogged] || Q.missLogged)} miss.</p>`
      : `<p class="sub" style="margin:8px 0 4px">Where did your working leave the solution?</p><p class="misspick">${
          Object.entries(MISS_KINDS).map(([k, l]) => `<button class="chip" data-miss="${k}">${esc(l)}</button>`).join('')}</p>`;
  }
  if(q.teach) h += `<div class="teach"><h4>The concept behind this</h4>${renderTeach(q.teach)}</div>`;
  if(q.note) h += `<p class="prose" style="margin:13px 0 0;font-size:14.5px">${esc(q.note)}</p>`;
  h += `<div class="cite">${srcFlag(q)}${esc(q.cite)}</div></div>`;
  return h;
}
const fmtNum = n => (typeof n === 'number' ? (Math.round(n * 10000) / 10000).toString() : String(n));
function parseNum(s){
  const t = String(s || '').replace(/,/g, '').replace(/[^0-9eE+\-.]/g, '');
  return t === '' ? NaN : Number(t);
}
function gradeNumeric(q, typed){
  const x = parseNum(typed); if(!isFinite(x)) return false;
  const tol = q.tol !== undefined ? q.tol : Math.abs(q.answer) * 0.01;
  return Math.abs(x - q.answer) <= tol + 1e-9;
}
/* Matching: one dropdown per left-hand item, every right-hand value offered
   in each. Right only when every pair is right; the per-pair result is kept on
   the log entry so a table column that keeps failing can be named. */
function matchBody(q){
  const picks = Q.picked || q.pairs.map(() => null);
  const rights = Q.rights || (Q.rights = shuffle(q.pairs.map((p, i) => i)));
  let h = `<table class="reftab matchtab"><thead><tr><th>${esc(q.left || '')}</th><th>${esc(q.right || '')}</th>${Q.revealed ? '<th></th>' : ''}</tr></thead><tbody>`;
  q.pairs.forEach((p, i) => {
    const chosen = picks[i];
    if(!Q.revealed){
      h += `<tr><td>${esc(p.l)}</td><td><select data-row="${i}" aria-label="match for ${esc(p.l)}"><option value="">—</option>${
        rights.map(ri => `<option value="${ri}"${chosen === ri ? ' selected' : ''}>${esc(q.pairs[ri].r)}</option>`).join('')}</select></td></tr>`;
    }else{
      const ok = chosen === i;
      h += `<tr><td>${esc(p.l)}</td><td>${ok ? esc(p.r) : `<s>${chosen === null || chosen === undefined ? '—' : esc(q.pairs[chosen].r)}</s> ${esc(p.r)}`}${p.why ? `<div class="stepwhy">${esc(p.why)}</div>` : ''}</td><td><span class="mark ${ok?'y':'n'}">${ok?'✓':'✗'}</span></td></tr>`;
    }
  });
  h += `</tbody></table>`;
  if(Q.revealed){
    const n = q.pairs.filter((p, i) => picks[i] === i).length;
    h += `<div class="why"><p class="verdict ${Q.lastRight?'ok':'bad'}">${Q.lastRight ? '✓ Correct — all matched' : `✗ Not correct — ${n} of ${q.pairs.length} matched`}</p>`;
    if(q.teach) h += `<div class="teach"><h4>The concept behind this</h4>${renderTeach(q.teach)}</div>`;
    h += `<div class="cite">${srcFlag(q)}${esc(q.cite)}</div></div>`;
  }
  return h;
}
const matchComplete = q => (Q.picked || []).length === q.pairs.length && (Q.picked || []).every(x => x !== null && x !== undefined);
function wireTyped(q, kind){
  const el = $('#v-quiz');
  const bn = $('#btnNext'); if(bn) bn.onclick = () => { Q.answered++; Q.lastId = Q.current.id; nextQuestion(); };
  wireConfidence();
  if(kind === 'numeric'){
    const inp = $('#numIn'), bc = $('#btnCheck');
    if(inp && bc){
      const go = () => {
        if(Q.revealed) return;
        const typed = inp.value.trim(); if(typed === '') { inp.focus(); return; }
        Q.picked = typed; Q.revealed = true; Q.guessedLogged = false; Q.missLogged = null;
        Q.lastRight = gradeNumeric(q, typed);
        record(q, Q.lastRight ? 'correct' : 'wrong', typed, Date.now() - (Q.startedAt||Date.now()));
        renderQuiz();
      };
      bc.onclick = go; inp.onkeydown = e => { if(e.key === 'Enter') go(); };
      inp.focus();
    }
    el.querySelectorAll('[data-miss]').forEach(b => b.onclick = () => {
      const last = DB.answers[DB.answers.length-1];
      if(last && last.qid === q.id){ last.miss = b.dataset.miss; save(); }
      Q.missLogged = b.dataset.miss; renderQuiz();
    });
  }else{
    el.querySelectorAll('select[data-row]').forEach(s => s.onchange = () => {
      const p = Q.picked || (Q.picked = q.pairs.map(() => null));
      p[+s.dataset.row] = s.value === '' ? null : +s.value;
      const bc = $('#btnCheck'); if(bc) bc.disabled = !matchComplete(q);
      const cnt = bc && bc.nextElementSibling; if(cnt) cnt.textContent = `${p.filter(x=>x!==null&&x!==undefined).length} of ${q.pairs.length} matched`;
    });
    const bc = $('#btnCheck'); if(bc) bc.onclick = () => {
      if(Q.revealed || !matchComplete(q)) return;
      Q.revealed = true; Q.guessedLogged = false;
      const picks = Q.picked.slice();
      Q.lastRight = picks.every((x, i) => x === i);
      record(q, Q.lastRight ? 'correct' : 'wrong', picks, Date.now() - (Q.startedAt||Date.now()));
      const last = DB.answers[DB.answers.length-1];
      if(last && last.qid === q.id){ last.pairOk = picks.map((x, i) => x === i); save(); }
      renderQuiz();
    };
  }
}

function answer(oi){
  if(Q.revealed) return;
  Q.picked = oi; Q.revealed = true; Q.guessedLogged = false;
  Q.lastRight = Q.current.options[oi].correct;
  record(Q.current, Q.lastRight ? 'correct' : 'wrong', oi, Date.now() - (Q.startedAt||Date.now()));
  renderQuiz();
}
function toggleOption(oi){
  if(Q.revealed) return;
  const p = Q.picked || [];
  Q.picked = p.includes(oi) ? p.filter(x => x !== oi) : [...p, oi];
  renderQuiz();
}
function submitMulti(){
  if(Q.revealed || !Q.picked || !Q.picked.length) return;
  Q.revealed = true; Q.guessedLogged = false;
  const picks = Q.picked.slice().sort((a,b)=>a-b);
  Q.lastRight = gradeMulti(Q.current, picks);
  record(Q.current, Q.lastRight ? 'correct' : 'wrong', picks, Date.now() - (Q.startedAt||Date.now()));
  renderQuiz();
}

/* ==========================================================================
   WEAK SPOTS
   ========================================================================== */
/* Drill an arbitrary list of questions once each, in shuffled order: what every
   "drill these" button on this page does. */
function drillList(pool, label){
  if(!pool || !pool.length) return;
  Q = {pool, label, sweep: shuffle(pool.map(q => q.id)), i:0,
       current:null, answered:0, lastId:null, examMode:false, picked:null, revealed:false};
  nextQuestion(); show('quiz');
}
function renderGaps(){
  const el = $('#v-gaps');
  const tot = DB.answers.length;
  if(!tot){
    el.innerHTML = `<h2>Weak spots</h2>
      <div class="empty"><p><b>Nothing answered yet.</b></p>
      <p style="margin:10px 0 16px">Answer some questions and this fills in with what to study next,
      your accuracy by topic weighted by what each topic is worth on the paper, and every
      question you have missed.</p>
      <p><button class="btn" data-go="topics">Choose a topic</button></p></div>`;
    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => show(b.dataset.go));
    return;
  }
  /* Three different measures, each named for what it counts:
     answer accuracy  answers that matched the key, a guess included (a guess is
                      logged only on a right pick), over all answers;
     confidence       how those right answers were rated: "Knew it", "Not sure",
                      "I guessed" (an exam answer carries no rating and counts as
                      "Knew it", as it does for "solid");
     mastered         from the review schedule (box MASTER_BOX or higher).
     "Solid" (This session, the review plan) is right and rated neither a guess nor
     "not sure". */
  const right = DB.answers.filter(a=>a.result==='correct').length;
  const guess = DB.answers.filter(a=>a.result==='guessed').length;
  const wrong = DB.answers.filter(a=>a.result==='wrong').length;
  const matched = right + guess;
  const shaky = DB.answers.filter(a=>a.result==='correct' && a.conf==='shaky').length;
  // the answer log stores only "not sure" (conf 'shaky') and a guess (result 'guessed');
  // every other right answer counts as "Knew it", an exam paper's too (it asks no rating)
  const knew = right - shaky;
  // mastered, What to review next and the pool cards count the exam's questions only
  const m = masteryOf(requiredQs());

  let h = `<h2>Weak spots</h2>
  <p class="sub">Every answer you have logged, weighted by what it is worth on the paper.</p>
  <div class="stat">
    <div><b>${tot}</b><span>answered</span></div>
    <div data-stat="accuracy"><b style="color:var(--ok)">${Math.round(100*matched/tot)}%</b><span>right · ${matched} of ${tot} (guesses included)</span></div>
    <div><b style="color:var(--bad)">${wrong}</b><span>missed</span></div>
    <div><b>${m.mastered}</b><span>of ${m.total} concepts mastered</span></div>
  </div>
  <p class="meta" data-stat="confidence" style="margin:-6px 0 6px">${matched ? `Of the ${matched} right: ${knew} knew it · ${shaky} not sure · ${guess} guessed.` : 'None right yet.'}</p>
  <p class="meta" id="statKey" style="margin:0 0 14px">Right counts every right pick, guesses included.
    Solid means right and not marked a guess or "not sure". Mastered comes from the review schedule
    (a concept at review step ${MASTER_BOX} or higher). Right answers on an exam paper, which asks no rating, count as "knew it".</p>`;

  /* ---- This session ---------------------------------------------------
     The run of answers with no half-hour gap. Shown first because it is the
     only number on this page that answers "is this sitting going well", and
     the two halves tell the reader whether they are warming up or tiring. */
  const ses = sessionLog();
  let retryList = [];
  if(ses.length){
    const ok = ses.filter(solidEntry).length, pct = Math.round(100*ok/ses.length);
    const half = Math.floor(ses.length/2), a = ses.slice(0, half), b = ses.slice(half);
    const pa = a.length ? Math.round(100*a.filter(solidEntry).length/a.length) : null;
    const pb = b.length ? Math.round(100*b.filter(solidEntry).length/b.length) : null;
    const mins = Math.max(1, Math.round((ses[ses.length-1].at - ses[0].at)/60000));
    retryList = [...new Set(ses.filter(e => !solidEntry(e)).map(e => e.qid))]
      .map(id => byId(id)).filter(Boolean);
    h += `<h3>This session</h3>
    <div class="panel">
      <div class="row spread">
        <span data-stat="session"><b style="font-size:22px">${pct}%</b> <span class="meta">solid · ${ok} of ${ses.length} in ${mins} min</span></span>
        ${pa !== null && ses.length >= 6 ? `<span class="meta">first half ${pa}% → second half ${pb}%</span>` : ''}
      </div>
      <div class="sdots10 big" style="margin:11px 0 5px">${ses.slice(-20).map(e =>
        `<i class="${solidEntry(e)?'y':'n'}" title="${esc(e.qid)}${e.result==='guessed'?' (guessed)':e.conf==='shaky'?' (not sure)':''}"></i>`).join('')}</div>
      <p class="meta" style="margin:0">Last ${Math.min(20, ses.length)} answers, oldest on the left; filled means solid,
        outlined means missed, guessed or marked "not sure". A session ends after 30 minutes with no answer.</p>
      ${retryList.length ? `<div class="row" style="margin-top:11px"><button class="btn" id="retrysess">Retry missed, guessed or unsure (${retryList.length})</button>
        <span class="meta">${retryList.length === 1 ? 'the 1 question' : `the ${retryList.length} questions`} not solid in this session, each once</span></div>` : ''}
    </div>`;
  }

  /* ---- What to review next --------------------------------------------
     A question is "not solid" when its last three answers are not all solid.
     They are grouped by the section that teaches them (links.js), so the
     reader is sent to one piece of reading rather than a list of scattered
     questions, and the group with the most missing comes first. Each concept
     shows the option actually chosen with why it is wrong, the right answer,
     and the first lines of the concept block. */
  const recent = {};
  DB.answers.forEach(e => (recent[e.qid] = recent[e.qid] || []).push(e));
  const scoreOf = q => {
    const r = (recent[q.id] || []).slice(-3);
    return r.length ? r.filter(solidEntry).length / r.length : null;
  };
  const notSolid = requiredQs().filter(q => { const s = scoreOf(q); return s !== null && s < 1; });
  const topicName = id => (TOPICS.find(t => t.id === id) || {}).name || id;
  const areas = {};
  notSolid.forEach(q => {
    const l = linksFor(q)[0];
    const name = l ? l[2] : topicName(q.topic);
    const A = areas[name] = areas[name] || {name, links: l ? linksFor(q) : [], qs:[], gap:0, concepts:{}};
    A.qs.push(q); A.gap += 1 - scoreOf(q);
    const c = A.concepts[q.concept] = A.concepts[q.concept] || {qs:[], last:null};
    c.qs.push(q);
    const lastMiss = (recent[q.id] || []).filter(e => !solidEntry(e)).pop();
    if(lastMiss && (!c.last || lastMiss.at > c.last.e.at)) c.last = {e:lastMiss, q};
  });
  const ranked = Object.values(areas).sort((x, y) => y.gap - x.gap);
  /* the first sentence or two of a concept block, which is as much as a plan
     card can carry without becoming the reading itself */
  const firstSentences = t => {
    const flat = teachText(t).replace(/<[^>]+>/g, '').trim();
    const m = flat.match(/^(.*?[.!?](\s|$)){1,2}/);
    const r = (m ? m[0] : flat).trim();
    return r.length > 320 ? r.slice(0, 317) + '…' : r;
  };
  const chosenOpts = (q, e) => {
    if(q.type || e.picked === undefined || e.picked === null) return [];
    return [].concat(e.picked).map(i => q.options && q.options[i]).filter(Boolean);
  };
  /* what a typed item's miss was, since those carry no option text */
  const typedMiss = (q, e) => q.type === 'numeric'
      ? `you wrote ${e.picked === undefined ? '—' : e.picked}${e.miss ? ' · ' + (MISS_KINDS[e.miss] || e.miss) : ''}`
      : q.type === 'match' && Array.isArray(e.pairOk)
        ? `${e.pairOk.filter(x => !x).length} of ${e.pairOk.length} pairs wrong` : '';
  if(ranked.length){
    const anyLinks = ranked.slice(0, 6).some(A => A.links.length);
    h += `<h3>What to review next</h3>
    <p class="sub">Weak concepts to review: ${notSolid.length} question${notSolid.length===1?'':'s'} not yet solid on the last three answers,
      grouped by ${anyLinks ? 'the section that teaches them' : 'topic'}, most missing first. ${anyLinks
        ? 'Read the linked section where there is one, or the explanation shown after each answer, then drill the questions.'
        : 'Drill the questions; the explanation shown after each answer teaches the concept.'}</p>`;
    ranked.slice(0, 6).forEach((A, ai) => {
      const cs = Object.entries(A.concepts).sort((x, y) => y[1].qs.length - x[1].qs.length);
      h += `<div class="panel plan"><div class="row spread"><b>${ai+1}. ${esc(A.name)}</b>
        <span class="meta">${A.qs.length} question${A.qs.length===1?'':'s'} · ${cs.length} concept${cs.length===1?'':'s'}</span></div>`;
      cs.slice(0, 4).forEach(([cid, c]) => {
        const q = (c.last && c.last.q) || c.qs[0];
        const wrong = c.last ? chosenOpts(c.last.q, c.last.e).filter(o => !o.correct) : [];
        const right = q.type === 'numeric' ? [`${fmtNum(q.answer)}${q.units ? ' ' + q.units : ''}`]
          : q.type === 'match' ? q.pairs.map(p => `${p.l} → ${p.r}`)
          : (q.options || []).filter(o => o.correct).map(o => o.t);
        h += `<div class="pconcept"><div class="pq">${esc(q.stem.length > 160 ? q.stem.slice(0,160) + '…' : q.stem)}</div>`;
        if(wrong.length) h += `<div class="pw"><b>You chose:</b> ${esc(wrong.map(o => o.t).join(' · '))}
          <br><span class="meta">Why it is not the answer: ${esc(wrong.map(o => o.why || '').join(' '))}</span></div>`;
        else if(c.last && c.last.q.type) {
          const t = typedMiss(c.last.q, c.last.e);
          if(t) h += `<div class="pw"><b>Your attempt:</b> ${esc(t)}</div>`;
        } else if(c.last && (c.last.e.result === 'guessed' || c.last.e.conf === 'shaky'))
          h += `<div class="pw"><b>Right, but you marked it ${c.last.e.result === 'guessed' ? 'a guess' : 'not sure'}.</b></div>`;
        if(right.length) h += `<div class="pr"><b>Answer:</b> ${esc(right.join(' · '))}</div>`;
        if(q.teach) h += `<div class="pi"><b>The idea:</b> ${esc(firstSentences(q.teach))}</div>`;
        if(c.qs.length > 1) h += `<p class="meta" style="margin:3px 0 0">${c.qs.length} questions on this concept are not solid.</p>`;
        h += `</div>`;
      });
      if(cs.length > 4) h += `<p class="meta">+ ${cs.length-4} more concept${cs.length-4===1?'':'s'} in this section.</p>`;
      if(!A.links.length) h += `<p class="meta" style="margin:7px 0 0">No reading section is linked for these; the explanation shown after each answer teaches the concept.</p>`;
      h += `<div class="row" style="margin-top:9px">${A.links.map(([v,a,t]) =>
          `<button type="button" class="chip" data-jump="${esc(v)}:${esc(a)}">Read: ${esc(t)}</button>`).join('')}
        <button class="btn" data-area="${ai}">Drill these ${A.qs.length}</button></div></div>`;
    });
    if(ranked.length > 6) h += `<p class="meta">${ranked.length-6} more section${ranked.length-6===1?'':'s'} have questions to review; they appear here as these are cleared.</p>`;
    h += `<p style="margin:7px 0 16px"><button class="btn ghost" id="missall">Drill all ${notSolid.length} not-solid questions</button></p>`;
  }else{
    h += `<h3>What to review next</h3><div class="panel"><b>No weak concepts right now:</b> every question you have answered is solid on its last three answers.
      <div class="row" style="margin-top:9px"><button class="btn" data-go="topics">Practise more topics</button>
      <button class="btn ghost" data-go="exam">Try an exam paper</button></div></div>`;
  }

  /* ---- What to do next ------------------------------------------------
     Three pools, ranked by marks. For each: concepts never seen, concepts
     missed or guessed and not yet recovered. The 38-mark pool leads, since
     an unseen concept there is worth ten times one in the 4-mark pool. */
  const pools = EXAM.pools.map(p => ({key:p.key, name:p.name, marks:p.marks, filter:p.test}));
  h += `<h3>What to do next</h3><div class="nextgrid">`;
  for(const pl of pools){
    const pool = QUESTIONS.filter(pl.filter);
    const cs = conceptsIn(pool);
    const unseen = cs.filter(c => !DB.concepts[c] || !DB.concepts[c].seen);
    const open   = cs.filter(c => { const st = DB.concepts[c]; return st && st.seen && st.box === 0; });
    const done   = cs.filter(c => { const st = DB.concepts[c]; return st && st.box >= MASTER_BOX; });
    h += `<div class="nextcard">
      <div class="nexthead"><b>${esc(pl.name)}</b><span>${pl.marks} of ${EXAM.questions} marks · ${cs.length} concepts</span></div>
      <div class="nextrow"><span>${unseen.length} not yet seen</span>${unseen.length
        ? `<button class="btn small" data-next="unseen" data-pool="${pl.key}">Start these</button>` : '<i>none</i>'}</div>
      <div class="nextrow"><span>${open.length} missed or guessed, still open</span>${open.length
        ? `<button class="btn small amber" data-next="open" data-pool="${pl.key}">Redrill</button>` : '<i>none</i>'}</div>
      <div class="nextrow"><span>${done.length} mastered</span><i>${cs.length ? Math.round(100*done.length/cs.length) : 0}%</i></div>
    </div>`;
  }
  h += `</div>`;

  /* ---- Which kind of question is failing ---------------------------------
     Every question is classed by what it asks the student to do. A miss on a
     recall item and a miss on a case item call for different repairs (reread
     the slide, or work the reasoning again), so the split is shown before the
     topic table, and each topic row carries its own split. */
  const bySkill = {};
  SKILLS.forEach(([k]) => bySkill[k] = {n:0, r:0, w:0, g:0, atRisk:0});
  for(const a of DB.answers){
    const q = byId(a.qid); if(!q) continue;
    const b = bySkill[skillOf(q)];
    b.n++; if(a.result==='correct') b.r++; else if(a.result==='wrong') b.w++; else b.g++;
    b.atRisk += a.result==='correct' ? 0 : (a.result==='wrong' ? 1 : 0.5) * markWeight(q);
  }
  h += `<h3>Which kind of question is failing</h3>
  <p class="sub">Recall is the fact itself. Tell apart is choosing between things with similar wording. Apply is a patient or drug scenario. Read is a structure or reaction scheme.</p>
  <table class="gap"><thead><tr><th>Kind</th><th>Seen</th><th>Missed</th><th>Guessed</th><th>Marks at risk</th><th style="width:30%">Accuracy</th></tr></thead><tbody>`;
  for(const [k, label] of SKILLS){
    const b = bySkill[k]; if(!b.n) continue;
    const pct = Math.round(100*b.r/b.n);
    const col = pct>=80 ? 'var(--ok)' : pct>=60 ? 'var(--warn)' : 'var(--bad)';
    h += `<tr><td>${esc(label)}</td><td>${b.n}</td><td${b.w?' style="color:var(--bad);font-weight:600"':''}>${b.w}</td>
      <td${b.g?' style="color:var(--warn)"':''}>${b.g}</td><td${b.atRisk>=0.5?' style="font-weight:600"':''}>${b.atRisk.toFixed(1)}</td>
      <td><div class="bar"><i style="width:${pct}%;background:${col}"></i></div><span style="font-size:12px;color:var(--text-dim)">${pct}%</span></td></tr>`;
  }
  h += `</tbody></table>`;

  /* ---- Right, but slow -------------------------------------------------
     A correct answer that took far longer than the student's own median for
     that kind of question is knowledge that is not yet firm; the box advanced
     as if it were. These concepts are listed so they can be redrilled. */
  const medians = {};
  for(const [k] of SKILLS){
    const ts = DB.answers.filter(a => a.result==='correct' && a.ms && byId(a.qid) && skillOf(byId(a.qid))===k).map(a=>a.ms).sort((a,b)=>a-b);
    if(ts.length >= 5) medians[k] = ts[Math.floor(ts.length/2)];
  }
  const slowC = {};
  for(const a of DB.answers){
    if(a.result !== 'correct' || !a.ms) continue;
    const q = byId(a.qid); if(!q) continue;
    const med = medians[skillOf(q)]; if(!med) continue;
    if(a.ms >= Math.max(2*med, 8000)) slowC[q.concept] = {q, ms:a.ms, med};
    else if(slowC[q.concept] && slowC[q.concept].q.id === q.id) delete slowC[q.concept];   // a later quick answer clears it
  }
  const slowList = Object.values(slowC).filter(x => { const s = DB.concepts[x.q.concept]; return s && s.box > 0; })
    .sort((a,b) => b.ms/b.med - a.ms/a.med).slice(0, 12);
  if(slowList.length){
    h += `<h3>Right, but slow</h3>
    <p class="sub">Correct answers that took at least twice your usual time for that kind of question (and at least 8 seconds). The scheduler counted them as known; these are worth a second pass.</p>
    <table class="gap"><thead><tr><th>Question</th><th>Kind</th><th>Took</th><th>Your usual</th></tr></thead><tbody>`;
    for(const x of slowList){
      h += `<tr><td>${esc(x.q.stem)}</td><td>${esc(SKILL_SHORT[skillOf(x.q)] || '')}</td><td>${Math.round(x.ms/1000)} s</td><td>${Math.round(x.med/1000)} s</td></tr>`;
    }
    h += `</tbody></table><p class="sub"><button class="btn" id="drillSlow">Redrill these ${slowList.length}</button></p>`;
  }

  /* ---- Kind of miss on calculation items --------------------------------- */
  const missK = {};
  for(const a of DB.answers){ if(a.result==='wrong' && a.miss) missK[a.miss] = (missK[a.miss]||0) + 1; }
  if(Object.keys(missK).length){
    h += `<h3>Calculation misses, by kind</h3>
    <table class="gap"><thead><tr><th>Kind of miss</th><th>Times</th></tr></thead><tbody>${
      Object.entries(missK).sort((a,b)=>b[1]-a[1]).map(([k,n]) => `<tr><td>${esc(MISS_KINDS[k]||k)}</td><td>${n}</td></tr>`).join('')}</tbody></table>`;
  }

  /* ---- Accuracy by topic, ordered by marks at risk -------------------
     A miss in a 137-question pool that supplies 38 marks costs 38/137 of a
     mark; a miss in the 129-question pool that supplies 4 costs 4/129. Sorting
     by that, rather than by the raw count, puts the topic that is actually
     costing marks at the top even when it has fewer questions to miss. */
  const rows = [];
  for(const t of TOPICS){
    const qs = QUESTIONS.filter(q=>q.topic===t.id);
    const ids = new Map(qs.map(q=>[q.id,q]));
    const as  = DB.answers.filter(a=>ids.has(a.qid));
    if(!as.length) continue;
    const r = as.filter(a=>a.result==='correct').length;
    const w = as.filter(a=>a.result==='wrong').length;
    const g = as.filter(a=>a.result==='guessed').length;
    const atRisk = as.reduce((acc,a)=> acc + (a.result==='correct' ? 0 : (a.result==='wrong' ? 1 : 0.5) * markWeight(ids.get(a.qid))), 0);
    // the same answers split by kind, for the line under the topic name
    const sk = {};
    for(const a of as){ const k = skillOf(ids.get(a.qid)); (sk[k] ||= {n:0,r:0}).n++; if(a.result==='correct') sk[k].r++; }
    rows.push({t, n:as.length, r, w, g, pct: Math.round(100*r/as.length), atRisk, sk});
  }
  rows.sort((a,b)=> b.atRisk - a.atRisk || a.pct - b.pct);

  /* ---- Weakest topics on a comparable footing ------------------------------
     Raw accuracy favours the topic answered least. Each topic with three or
     more answers is compared with the accuracy of its own pool (the 38-, 8-
     or 4-mark pool), and the gap in percentage points is what ranks it. The
     kind of question missed most inside that topic is named beside it. */
  const poolAcc = {};
  for(const a of DB.answers){ const q = byId(a.qid); if(!q) continue;
    const k = poolKey(q); (poolAcc[k] ||= {n:0,r:0}).n++; if(a.result==='correct') poolAcc[k].r++; }
  const weakest = rows.filter(r => r.n >= 3).map(r => {
    const pk = poolKey(QUESTIONS.find(q=>q.topic===r.t.id));
    const pa = poolAcc[pk] ? Math.round(100*poolAcc[pk].r/poolAcc[pk].n) : r.pct;
    let worst = null;
    for(const [sk, label] of SKILLS){ const s = r.sk[sk]; if(!s || s.n < 2) continue;
      const p = Math.round(100*s.r/s.n); if(!worst || p < worst.p) worst = {label, p, n:s.n}; }
    return {r, gap: pa - r.pct, pa, worst};
  }).filter(x => x.gap > 0).sort((a,b) => b.gap - a.gap).slice(0, 5);
  if(weakest.length){
    h += `<h3>Weakest topics, on a comparable footing</h3>
    <p class="sub">Topics with three or more answers, ranked by how far they sit below the accuracy of their own pool. The kind of question missed most in that topic is named beside it.</p>
    <table class="gap"><thead><tr><th>Topic</th><th>Yours</th><th>Pool</th><th>Gap</th><th>Weakest kind</th></tr></thead><tbody>`;
    for(const x of weakest){
      h += `<tr><td>${esc(x.r.t.name)}</td><td>${x.r.pct}%</td><td>${x.pa}%</td><td style="color:var(--bad);font-weight:600">&minus;${x.gap}</td>
        <td>${x.worst ? `${esc(x.worst.label)} (${x.worst.p}% of ${x.worst.n})` : '<i>too few of any one kind</i>'}</td></tr>`;
    }
    h += `</tbody></table>`;
  }

  h += `<h3>Where you are losing marks</h3>
  <p class="sub">Marks at risk = each miss weighted by what one question in that pool is worth on the paper (a guess counts half).</p>
  <table class="gap"><thead><tr>
    <th>Topic</th><th>Seen</th><th>Missed</th><th>Guessed</th><th>Marks at risk</th><th style="width:30%">Accuracy</th>
  </tr></thead><tbody>`;
  for(const r of rows){
    const col = r.pct>=80 ? 'var(--ok)' : r.pct>=60 ? 'var(--warn)' : 'var(--bad)';
    h += `<tr>
      <td>${esc(r.t.name)}<br><span style="font-size:11.5px;color:var(--text-dim)">${r.t.prof}</span><br>
          <span style="font-size:11.5px;color:var(--text-dim)">${SKILLS.filter(([k]) => r.sk[k]).map(([k,label]) => `${SKILL_SHORT[k]} ${r.sk[k].r}/${r.sk[k].n}`).join(' &middot; ')}</span></td>
      <td>${r.n}</td>
      <td${r.w?' style="color:var(--bad);font-weight:600"':''}>${r.w}</td>
      <td${r.g?' style="color:var(--warn)"':''}>${r.g}</td>
      <td${r.atRisk>=0.5?' style="font-weight:600"':''}>${r.atRisk.toFixed(1)}</td>
      <td><div class="bar"><i style="width:${r.pct}%;background:${col}"></i></div>
          <span style="font-size:12px;color:var(--text-dim)">${r.pct}%</span></td>
    </tr>`;
  }
  h += `</tbody></table>`;

  /* ---- Confusions -------------------------------------------------------
     Which wrong option was picked, grouped. A pair that recurs is a specific
     misunderstanding with a name, and the atlas or the concept block for that
     pair is what to read. Only answers logged with `picked` count. */
  const pairs = {};
  for(const a of DB.answers){
    if(a.result !== 'wrong' || a.picked === undefined || a.picked === null) continue;
    const q = byId(a.qid); if(!q) continue;
    if(q.type) continue;
    const right = q.options.filter(o=>o.correct).map(o=>o.t).join(' + ');
    const pickedIdx = Array.isArray(a.picked) ? a.picked : [a.picked];
    const wrongPicked = pickedIdx.filter(i => q.options[i] && !q.options[i].correct).map(i => q.options[i].t);
    for(const wp of wrongPicked){
      const k = right + '\u0000' + wp;
      (pairs[k] ||= {right, wrong:wp, n:0, qids:new Set(), topic:q.topic}).n++;
      pairs[k].qids.add(q.id);
    }
  }
  const plist = Object.values(pairs).sort((a,b)=>b.n-a.n).slice(0,12);
  if(plist.length){
    h += `<h3>What you keep choosing instead</h3>
    <p class="sub">The wrong option you picked, against the right one. A pair that appears more than once is a confusion worth naming and reading up on.</p>
    <table class="gap"><thead><tr><th>You picked</th><th>The answer was</th><th>Times</th><th>Topic</th></tr></thead><tbody>`;
    for(const pr of plist){
      const t = TOPICS.find(x=>x.id===pr.topic);
      h += `<tr><td style="color:var(--bad)">${esc(pr.wrong)}</td><td style="color:var(--ok)">${esc(pr.right)}</td>
        <td${pr.n>1?' style="font-weight:600"':''}>${pr.n}</td><td>${t?esc(t.name):''}</td></tr>`;
    }
    h += `</tbody></table>`;
  }

  /* ---- Every missed question -------------------------------------------- */
  const missedIds = [...new Set(DB.answers.filter(a=>a.result==='wrong').map(a=>a.qid))];
  h += `<h3>Every question you have missed (${missedIds.length})</h3>`;
  if(!missedIds.length){
    h += `<div class="empty">Nothing missed yet.</div>`;
  }else{
    h += `<p class="sub"><button class="btn" id="drillMissed">Drill these ${missedIds.length} now</button></p>`;
    for(const id of missedIds.slice().reverse()){
      const q = byId(id); if(!q) continue;
      const s = DB.concepts[q.concept] || {};
      const correctTxt = q.type === 'numeric' ? `${fmtNum(q.answer)}${q.units ? ' ' + q.units : ''}` : q.type === 'match' ? q.pairs.map(p => `${p.l} → ${p.r}`).join(' · ') : q.options.filter(o=>o.correct).map(o=>o.t).join(' · ');
      const last = DB.answers.slice().reverse().find(a=>a.qid===id && a.result==='wrong');
      const pickedTxt = last && last.picked !== undefined
        ? (q.type === 'numeric' ? String(last.picked)
           : q.type === 'match' ? (Array.isArray(last.picked) ? last.picked.map((r, k) => r !== null && r !== undefined && r !== k ? `${q.pairs[k].l} → ${q.pairs[r].r}` : '').filter(Boolean).join(' · ') : '')
           : (Array.isArray(last.picked) ? last.picked : [last.picked]).map(i=>q.options[i] ? q.options[i].t : '').filter(Boolean).join(' · '))
        : '';
      h += `<div class="missq">
        <div class="mstem">${esc(q.stem)}</div>
        <div class="mmeta" style="color:var(--ok);margin-bottom:4px">Answer: ${esc(correctTxt)}</div>
        ${pickedTxt ? `<div class="mmeta" style="color:var(--bad);margin-bottom:4px">You picked: ${esc(pickedTxt)}</div>` : ''}
        <div class="mmeta">${esc(q.cite)} · missed ${s.wrong||1}× · ${s.box>=MASTER_BOX?'now mastered':'still in review'}</div>
      </div>`;
    }
  }
  el.innerHTML = h;
  // wide tables scroll inside their own box on a phone instead of widening the page
  el.querySelectorAll('table.gap').forEach(t => {
    const w = document.createElement('div'); w.className = 'gapwrap';
    t.parentNode.insertBefore(w, t); w.appendChild(t);
  });

  el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => show(b.dataset.go));
  const rs = $('#retrysess');
  if(rs) rs.onclick = () => drillList(retryList, 'Missed, guessed or unsure this session');
  const ma = $('#missall');
  if(ma) ma.onclick = () => drillList(notSolid, 'Not yet solid');
  el.querySelectorAll('[data-area]').forEach(b => b.onclick = () => {
    const A = ranked[+b.dataset.area]; if(A) drillList(A.qs, A.name);
  });
  el.querySelectorAll('[data-next]').forEach(b => b.onclick = () => {
    const pl = pools.find(x=>x.key===b.dataset.pool);
    const pool = QUESTIONS.filter(pl.filter);
    const want = b.dataset.next === 'unseen'
      ? pool.filter(q => !DB.concepts[q.concept] || !DB.concepts[q.concept].seen)
      : pool.filter(q => { const st = DB.concepts[q.concept]; return st && st.seen && st.box === 0; });
    if(!want.length) return;
    Q = {pool:want, label:(b.dataset.next==='unseen' ? 'Not yet seen — ' : 'Redrill — ') + pl.name,
         sweep: shuffle(want.map(q=>q.id)), i:0,
         current:null, answered:0, lastId:null, examMode:false, picked:null, revealed:false};
    nextQuestion(); show('quiz');
  });
  const ds = $('#drillSlow');
  if(ds) ds.onclick = () => {
    const pool = slowList.map(x => x.q);
    Q = {pool, label:'Right but slow', sweep: shuffle(pool.map(q=>q.id)), i:0, current:null, answered:0, lastId:null, picked:null, revealed:false};
    nextQuestion(); show('quiz');
  };
  const d = $('#drillMissed');
  if(d) d.onclick = () => {
    const pool = QUESTIONS.filter(q => missedIds.includes(q.id) ||
      missedIds.some(id => byId(id) && byId(id).concept === q.concept));
    Q = {pool, label:'Missed concepts', current:null, answered:0, lastId:null, picked:null, revealed:false};
    nextQuestion(); show('quiz');
  };
}

/* ==========================================================================
   EXAM SIMULATION — a paper drawn to the blueprint in course.js
   ========================================================================== */
let EX = null;
/* ---- A paper or a quiz session belongs to the profile that started it ----------------
   An independent review of the live DEENT site (core 25c643d, 2026-11-06) found that EX
   (the exam paper) and Q (the quiz or targeted-review session) stayed in place when the
   profile changed: profile B saw A's paper with A's picks, a pick on it wrote A's paper
   into B's stored paper, and submitting it, or its clock running out, recorded A's answers
   in B's history. useProfile (shell.html) now calls parkSession before the switch and
   resumeSession after the next profile's progress is loaded (ownership_test.js).
   A running paper is saved under its own profile and put away; the Exam tab reads it back
   from storage on the return, as after a reload, so a paper that ran out meanwhile is
   submitted then, under its own profile. The page keeps the paper itself only where
   storage cannot hold it: a submitted paper (its result screen) and a paper of a visit that
   saves nothing (canSave false). The quiz session is kept for the visit, with the time
   already spent on an unanswered question, so the time away is not counted as answer time.
   Nothing new is stored. */
const PARKED = {};   // profile -> {Q, EX, qElapsed}: what this page put away when it left that profile
const examOwned = () => !!EX && (!EX.owner || EX.owner === PROFILE);
function parkSession(from){
  if(EX && EX.running && examOwned()) saveExam();   // PROFILE is still `from` here
  if(EX) clearInterval(EX.timer);
  // kept in memory where saveExam stores nothing: a visit that saves nothing, or a profile another
  // tab or window saved since (saveExam then stops at staleWarn), so the picks are not lost
  let unstored = false;
  try { unstored = !canSave() || profileSavedElsewhere(); } catch(e){ unstored = true; }
  const keepEX = !!EX && EX.owner === from && (EX.done || (EX.running && unstored));
  const p = {Q, EX: keepEX ? EX : null};
  if(Q && Q.current && !Q.revealed && typeof Q.startedAt === 'number') p.qElapsed = Date.now() - Q.startedAt;
  PARKED[from] = p;
  Q = null; EX = null;
}
function resumeSession(to){
  const p = PARKED[to]; delete PARKED[to];
  Q = null; EX = null;
  if(!p) return;
  Q = p.Q || null;
  if(Q && typeof p.qElapsed === 'number') Q.startedAt = Date.now() - p.qElapsed;
  if(p.EX){ EX = p.EX; if(EX.running) startClock(); }
}
function renderExam(){
  const el = $('#v-exam');
  // a paper of another profile is never drawn, saved or submitted here
  if(EX && !examOwned()){ clearInterval(EX.timer); EX = null; }
  if(!EX) restoreExam();
  if(EX && EX.running){ if(EX.review) renderExamReview(); else renderExamQ(); return; }
  if(EX && EX.done){ renderExamResult(); return; }
  el.innerHTML = `<h2>Exam simulation</h2>
  <p class="sub">${EXAM.questions} questions drawn at the blueprint of ${esc(EXAM.name)}${EXAM.blurb ? ' — ' + esc(EXAM.blurb) : ''} —
  with a ${EXAM.minutes}-minute clock. ${examSataText()}
  No explanations until you finish.</p>
  <div class="note"><b>Answers are logged when you submit.</b> The paper is saved as you go, so a
  reload or a switch to another app does not lose it, and "Submit what I have answered" logs a
  paper you cannot finish; blank items are then left out of your history rather than counted as misses.</div>
  <p><button class="btn" id="startExam">Start the ${EXAM.minutes}-minute paper</button></p>`;
  $('#startExam').onclick = beginExam;
}
/* A question marked dupOf:'x' tests the same fact as question x, so a paper
   never carries both. The wordings of one fact form a family: x, everything
   marked dupOf x, and anything marked dupOf one of those (a chain), so two
   wordings that both point at x are siblings and block each other even when x
   is not on the paper (Intro-Pharmacology, exam1-drill/src/app.js line 1503).
   A family is named by its root, the end of its dupOf chain (Basic-
   Pharmacokinetics, src/views.js lines 3174-3177); the root is the id at the
   end even when no question in the bank carries it, so siblings of an original
   that was removed still block each other. */
function familyOf(q){
  let id = q.id, r = q;
  const seen = new Set();
  while(r && r.dupOf && !seen.has(r.id)){ seen.add(r.id); id = r.dupOf; r = byId(r.dupOf); }
  return id;
}
/* `blocked` holds the families already on the paper. One set is passed through
   every pool of a paper (drawPaper), because a family can span two pools and a
   set per pool let both members onto one paper (Medicinal-chemistry ed38dbd). */
function drawN(pool, n, blocked){
  const picked = [], used = blocked || new Set(), byConcept = {};
  const take = q => { picked.push(q); used.add(q.id); used.add(familyOf(q)); };
  const free = q => !used.has(q.id) && !used.has(familyOf(q));
  shuffle(pool.slice()).forEach(q => { (byConcept[q.concept] ||= []).push(q); });
  const concepts = shuffle(Object.keys(byConcept));
  for(const c of concepts){                       // one per concept first, for spread
    if(picked.length >= n) break;
    const q = byConcept[c].find(free);
    if(q) take(q);
  }
  for(const q of shuffle(pool.slice())){          // top up if the bank is short on concepts
    if(picked.length >= n) break;
    if(free(q)) take(q);
  }
  return picked.slice(0,n);
}
/* How many of the 50 are select-all. The exam is described as a mix of
   multiple choice and select-all without a stated split, so the draw aims for
   this many, taken in proportion to each pool's share of the paper, and falls
   back to whatever the bank holds if a pool has fewer. */
const EXAM_SATA = EXAM.sata || 0;
/* How many select-all items the draw puts on a paper, for the opening page:
   counted on papers drawn by drawPaper itself (every wrapper included), never
   worked out from the targets, so the page names only what the draw really
   gives. A worked-out count disagreed with the draw (the review of 007e956):
   a blueprint's select-all count is reached by swaps that can fail, and the
   pools share one set of families (dupOf) and cap each pool at its marks.
   EXAM_SAMPLE papers are drawn, once per exam and bank (kept in EXAM_SATA_SEEN);
   the result is the lowest and the highest count seen. A count the draw gives
   more rarely than that can be missed, so the page words it as a sample ("about
   N", "between lo and hi", "not expected"; "yours may differ"), never as a fact. DEENT, 2026-11-06: the page said "about 0 of the 50 are
   select-all" beside a paper that held none. */
const EXAM_SAMPLE = 20;
let EXAM_SATA_SEEN = null;
/* True while the opening page draws its sample papers: they are not new papers, so the
   feature modules' X.paper hooks (core/features.js) do not run on them. The samples
   describe this exam's own draw; a hook may reorder the questions or put others in
   their place (paper-picker), and such a module describes its own paper. */
let EXAM_SAMPLING = false;
function examSataDrawn(){
  const key = JSON.stringify([EXAM.id, EXAM.questions, EXAM.sata, EXAM.blueprint || null, (EXAM.pools || []).map(p => [p.key, p.marks]), QUESTIONS.length]);
  if(EXAM_SATA_SEEN && EXAM_SATA_SEEN.key === key) return EXAM_SATA_SEEN;
  let lo = Infinity, hi = 0;
  try {
    EXAM_SAMPLING = true;
    for(let k = 0; k < EXAM_SAMPLE; k++){
      const c = (drawPaper() || []).filter(isMulti).length;
      lo = Math.min(lo, c); hi = Math.max(hi, c);
    }
  } catch(e){ lo = hi = 0; }
  finally { EXAM_SAMPLING = false; }
  if(lo === Infinity) lo = 0;
  return (EXAM_SATA_SEEN = {key, lo, hi});
}
/* Sampled, so never worded as a guarantee, and about practice papers, not the
   official exam (Louis, 2026-11-06: "address the outstanding review concern about
   sampled select-all counts being presented as guaranteed facts"). */
/* The range the samples gave, never "about 0" (the review of fd2209e): none seen, one count
   seen ("about N"), or two or more ("between lo and hi"). */
const examSataText = () => {
  const {lo, hi} = examSataDrawn();
  const tail = 'This describes the practice papers, not the official exam format.';
  if(!hi) return `Practice papers drawn from this bank are not expected to carry select-all items (none in ${EXAM_SAMPLE} sample draws). ${tail}`;
  const how = 'tick every right option, marked all-or-nothing; in ' + EXAM_SAMPLE + ' sample draws';
  if(lo === hi) return `Practice papers drawn from this bank carry about ${hi} select-all item${hi === 1 ? '' : 's'} (${how}); yours may differ. ${tail}`;
  return `Practice papers drawn from this bank carry between ${lo} and ${hi} select-all items (${how}); yours may differ. ${tail}`;
};

/* Draw n from a pool with a target number of select-all items in it. Select-all
   questions are drawn first so they are never crowded out, then single-answer
   questions fill the rest, one concept each before any concept repeats. */
function drawMixed(pool, n, nSata, used){
  used = used || new Set();
  const sata = drawN(pool.filter(isMulti), Math.min(nSata, n), used);
  const rest = drawN(pool.filter(q => !isMulti(q)), n - sata.length, used);
  return [...sata, ...rest];
}
/* The paper follows the manifest: each pool supplies its marks' worth of
   questions, and the select-all target is split across the pools in the same
   proportion (largest pool takes the rounding remainder). lowYield items and
   typed items (numeric, matching) stay out of the paper. */
/* ---- the paper -----------------------------------------------------------
   Two ways to draw one. By default each pool supplies its own marks' worth of
   questions, which is what the manifest's pools already say. When the professor
   has announced counts per topic instead ("five on receptor regulation, two or
   three on the therapeutic index"), `exams[].blueprint` names those parts and
   drawBlueprint fills them: each part takes its questions from the category its
   pattern matches, one question per concept before any concept repeats, and the
   select-all count is then corrected by swapping within a category so the paper
   carries exactly the announced number. */
function bpCat(q){
  const bp = EXAM.blueprint;
  const t = [q.stem, q.concept, q.sub, (q.tags||[]).join(' ')].join(' ');
  for(const c of (bp.cats || [])) if(new RegExp(c.match, 'i').test(t)) return c.key;
  return bp.rest || 'other';
}
function drawBlueprint(bp){
  const elig = requiredQs().filter(q => !q.lowYield && !q.type);
  const by = {};
  elig.forEach(q => (by[bpCat(q)] ||= []).push(q));
  // `used` holds the families on the paper (familyOf), the same rule as drawN
  const out = [], used = new Set(), cat = new Map();
  const free = q => !used.has(familyOf(q));
  const take = (key, n) => {
    const list = shuffle((by[key] || []).slice()), seen = new Set();
    const firsts = list.filter(q => !seen.has(q.concept) && seen.add(q.concept));
    for(const q of firsts.concat(list)){
      if(n <= 0) break;
      if(!free(q)) continue;
      out.push(q); used.add(familyOf(q)); cat.set(q.id, key); n--;
    }
  };
  let left = EXAM.questions;
  // fixed parts first (a count, or a range to pick from), then a floor, then the rest
  bp.parts.forEach(p => {
    if(p.rest || p.min) return;
    const n = Array.isArray(p.n) ? p.n[0] + Math.floor(Math.random()*(p.n[1]-p.n[0]+1)) : p.n;
    take(p.key, n); left -= n;
  });
  const g = bp.parts.find(p => p.min);
  if(g){ take(g.key, g.min); left -= g.min; }
  const r = bp.parts.find(p => p.rest);
  if(r) take(r.key, Math.max(0, left));
  const wantSata = bp.sata || 0;
  const swap = (from, wantMulti) => {
    for(const q of shuffle(out.filter(x => !!x.multi === from))){
      const k = cat.get(q.id);
      const alt = shuffle((by[k] || []).slice()).find(x => !!x.multi === wantMulti && free(x));
      if(alt){ out[out.indexOf(q)] = alt; used.delete(familyOf(q)); used.add(familyOf(alt)); cat.set(alt.id, k); return true; }
    }
    return false;
  };
  while(out.filter(q => q.multi).length > wantSata && swap(true, false));
  while(out.filter(q => q.multi).length < wantSata && swap(false, true));
  return shuffle(out);
}
function drawPaper(){
  if(EXAM.blueprint && Array.isArray(EXAM.blueprint.parts) && EXAM.blueprint.parts.length)
    return drawBlueprint(EXAM.blueprint);
  const examQ = requiredQs().filter(q => !q.lowYield && !q.type);
  const total = EXAM.pools.reduce((n, p) => n + p.marks, 0) || 1;
  const main = mainPool();
  let sataLeft = EXAM_SATA;
  const used = new Set();                         // one blocked set for the whole paper
  const parts = EXAM.pools.filter(p => p !== main).map(p => {
    const s = Math.round(EXAM_SATA * p.marks / total); sataLeft -= s;
    return drawMixed(examQ.filter(p.test), p.marks, s, used);
  });
  parts.push(drawMixed(examQ.filter(main.test), main.marks, Math.max(0, sataLeft), used));
  return shuffle(parts.flat());
}
const EXAM_KEY = () => NS + ':exam:' + PROFILE;
/* An untimed paper (nullexam.js starts one when the course sets a count and no
   time limit) has ends: null and `started`, when it began. It keeps its own
   rules whatever the course says later: a course that gains a time limit while
   such a paper is open still brings it back untimed, with its answers, its
   place and the time taken, and only a paper started after that has the
   countdown. The engine reads it, not nullexam.js, because a course that sets
   every number has no nullexam.js in its page. A timed paper is saved exactly
   as before. */
const untimedPaper = () => !!EX && EX.ends === null && typeof EX.started === 'number';
// written, and removed, only when the saved progress was loaded (canSave in shell.html)
function saveExam(){
  if(!EX || !EX.running || !canSave()) return;
  if(!EX.owner) EX.owner = PROFILE;
  if(EX.owner !== PROFILE) return;   // never under another profile's key
  if(profileSavedElsewhere()){ staleWarn(); return; }   // never over another tab's paper
  const paper = {ids:EX.qs.map(q=>q.id), picks:EX.picks, orders:EX.orders, i:EX.i, ends:EX.ends};
  if(untimedPaper()) paper.started = EX.started;
  store.set(EXAM_KEY(), JSON.stringify(paper));
}
function clearExam(){
  if(!canSave()) return;
  if(WRITER === 'pending'){ EXAM_CLEAR_WAITING = PROFILE; return; }   // cleared once the lock is this page's (flushWaiting)
  if(!profileSavedElsewhere()) store.del(EXAM_KEY());
}
/* A paper saved by an earlier visit is brought back if its clock has not run
   out; otherwise it is submitted as it stands. */
function restoreExam(){
  let j = null;
  try { j = JSON.parse(store.get(EXAM_KEY()) || 'null'); } catch(e) { j = null; }
  if(!j || !j.ids) return false;
  const qs = j.ids.map(byId); if(qs.some(q => !q)) { clearExam(); return false; }
  EX = {qs, i:Math.min(j.i||0, qs.length-1), picks:j.picks, orders:j.orders, running:true, done:false, ends:j.ends, owner:PROFILE};
  if(j.ends === null && typeof j.started === 'number') EX.started = j.started;   // untimed: never expires
  else if(Date.now() >= EX.ends){ finishExam(true); return true; }
  startClock();
  return true;
}
const tookText = () => fmt(Date.now() - EX.started) + ' taken';
function startClock(){
  clearInterval(EX.timer);
  if(!EX.owner) EX.owner = PROFILE;
  // each clock stops itself once its own paper is no longer the one on this page (a profile
  // switch, a new paper), so it can never submit a paper under another profile
  const mine = EX;
  if(untimedPaper()){
    mine.timer = setInterval(()=>{
      if(EX !== mine || !mine.running) return clearInterval(mine.timer);
      const c = document.getElementById('exClock'); if(c) c.textContent = tookText();
    }, 1000);
    return;
  }
  mine.timer = setInterval(()=>{
    if(EX !== mine || !mine.running || mine.owner !== PROFILE) return clearInterval(mine.timer);
    if(Date.now() >= EX.ends){ finishExam(true); return; }
    const c = document.getElementById('exClock');
    if(c){ const l = EX.ends - Date.now();
      c.textContent = fmt(l); c.classList.toggle('low', l < 5*60000); }
  }, 1000);
}
function beginExam(){
  const qs = drawPaper();
  EX = {qs, i:0, picks:qs.map(q => isMulti(q) ? [] : null), running:true, done:false,
        ends: Date.now() + EXAM.minutes*60000, orders: qs.map(q=>shuffle(q.options.map((o,k)=>k)))};
  saveExam();
  startClock();
  renderExamQ();
}
const fmt = ms => { const s = Math.max(0, Math.round(ms/1000));
  return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0'); };

function renderExamQ(){
  EX.review = false;   // a question is on screen: the Exam tab reopens on it, not on the overview
  const el = $('#v-exam'), q = EX.qs[EX.i], order = EX.orders[EX.i];
  const answered = EX.picks.filter(p => Array.isArray(p) ? p.length > 0 : p !== null).length;
  const multi = isMulti(q);
  let h = `<div class="examhead">
    <span class="clock" id="exClock"${untimedPaper() ? ' title="Time taken so far: this paper is untimed"' : ''}>${untimedPaper() ? tookText() : fmt(EX.ends-Date.now())}</span>
    <span class="prog">Question ${EX.i+1} of ${EX.qs.length} · ${answered} answered</span>
  </div>
  <div class="qcard"><div class="qhead">${profTag(q.prof)}${multi ? '<span class="tag sata">select all that apply</span>' : ''}<span class="spacer"></span>
    <span>no feedback until you submit</span></div>
  <div class="qbody"><p class="stem">${esc(q.stem)}</p>`;
  if(q.img && IMAGES[q.img]) h += `<img class="qimg" src="${IMAGES[q.img]}" alt="Reaction scheme">`;
  if(q.fg) h += fgShow(q.fg);
  order.forEach((oi,n)=>{
    const sel = multi ? EX.picks[EX.i].includes(oi) : EX.picks[EX.i] === oi;
    // chosen, not graded: the neutral selection colour (exsel), never the right-answer green
    h += `<button class="opt${multi?' multi':''}${sel?(multi?' on':' exsel'):''}" data-o="${oi}" aria-pressed="${sel}">
      <span class="k">${multi ? (sel ? '\u2611' : '\u2610') : LETTERS[n]}</span><span>${esc(q.options[oi].t)}</span></button>`;
  });
  h += `</div><div class="qfoot">
    <button class="btn ghost" id="exPrev"${EX.i===0?' disabled':''}>Back</button>
    <button class="btn" id="exNext">${EX.i===EX.qs.length-1?'Review answers':'Next'}</button>
    <span class="spacer" style="flex:1"></span>
    <button class="btn ghost" id="exEnd">${submitLabel()}</button>
  </div></div>`;
  el.innerHTML = h;
  el.querySelectorAll('button.opt[data-o]').forEach(b=>b.onclick=()=>{
    const oi = +b.dataset.o;
    if(multi){ const p = EX.picks[EX.i]; EX.picks[EX.i] = p.includes(oi) ? p.filter(x=>x!==oi) : [...p, oi]; }
    else EX.picks[EX.i] = oi;
    saveExam(); renderExamQ(); });
  $('#exPrev').onclick = ()=>{ if(EX.i>0){EX.i--; saveExam(); renderExamQ();} };
  // the last question's Review opens the overview: it grades, records and finishes nothing (DEENT, 2026-11-06)
  $('#exNext').onclick = ()=>{ if(EX.i<EX.qs.length-1){EX.i++; saveExam(); renderExamQ();} else renderExamReview(); };
  $('#exEnd').onclick  = askSubmitExam;
}
const examAnsweredN = () => EX.qs.filter((q,i)=> !examBlank(q, EX.picks[i])).length;
const submitLabel = () => examAnsweredN() < EX.qs.length ? 'Submit what I have answered' : 'Submit paper';
/* The one question every hand submit asks ("Submit paper", and the overview's
   submit): Cancel keeps the paper running as it is. */
function askSubmitExam(){
  // a control left on screen after a switch to another profile: that profile's paper is not this one
  if(!EX || !EX.running || !examOwned()) return;
  const blank = EX.qs.length - examAnsweredN();
  if(!blank){ if(confirm('Submit the paper and see your score?')) finishExam(false); return; }
  if(confirm(`${blank} item${blank===1?' is':'s are'} still blank.\n\nOK: submit what you have answered (blank items are not logged).\nCancel: keep going.`)) finishExam(true);
}
/* The overview of a running paper: each question number, answered or not, a way
   back to any of them, and the submit button. It shows no answer, grade or
   explanation, and records nothing; the paper stays saved and its clock runs.
   EX.review is not saved: a reload opens the paper on its question, as before. */
function renderExamReview(){
  if(!EX || !EX.running || !examOwned()) return;   // as askSubmitExam
  EX.review = true;
  const el = $('#v-exam'), n = EX.qs.length, answered = examAnsweredN();
  const blanks = EX.qs.map((q,i)=> examBlank(q, EX.picks[i]) ? i+1 : 0).filter(Boolean);
  let h = `<div class="examhead">
    <span class="clock" id="exClock"${untimedPaper() ? ' title="Time taken so far: this paper is untimed"' : ''}>${untimedPaper() ? tookText() : fmt(EX.ends-Date.now())}</span>
    <span class="prog">Review · ${answered} of ${n} answered</span>
  </div>
  <div class="qcard" id="exReview"><div class="qbody">
    <h2 tabindex="-1" id="exRevHead" style="margin-top:0">Review your paper</h2>
    <p class="sub">Nothing is graded or logged yet. Choose a number to go back to that question and change its answer.
    The paper is graded only when you submit it.</p>
    <div class="exgrid">`;
  EX.qs.forEach((q,i)=>{
    const blank = examBlank(q, EX.picks[i]);
    h += `<button class="exq${blank?' blank':''}" data-q="${i}" data-state="${blank?'blank':'answered'}" aria-label="Question ${i+1}, ${blank?'not answered':'answered'}">
      <b>${i+1}</b><small>${blank?'not answered':'answered'}</small></button>`;
  });
  h += `</div>${blanks.length ? `<p class="sub" id="exRevBlank">Not answered: ${blanks.length === n ? 'every question' : blanks.length > 6
    ? `${blanks.length} questions, the first ${blanks.slice(0, 5).join(', ')} and ${blanks.length - 5} more (dashed in the grid)`
    : 'question' + (blanks.length===1?' ':'s ') + blanks.join(', ')}.</p>` : ''}
  </div><div class="qfoot">
    <button class="btn ghost" id="exRevBack">Back to question ${EX.i+1}</button>
    <span class="spacer" style="flex:1"></span>
    <button class="btn" id="exRevSubmit">${submitLabel()}</button>
  </div></div>`;
  el.innerHTML = h;
  // the question opened from the overview takes the focus (keyboard and screen reader land on it)
  const go = i => { if(!EX || !EX.running || !examOwned()) return; EX.i = i; saveExam(); renderExamQ();
    try { const st = document.querySelector('#v-exam .stem'); if(st){ st.setAttribute('tabindex', '-1'); st.focus(); } } catch(e){} };
  el.querySelectorAll('#exReview [data-q]').forEach(b => b.onclick = () => go(+b.dataset.q));
  $('#exRevBack').onclick = () => { if(EX) go(EX.i); };
  $('#exRevSubmit').onclick = askSubmitExam;
  try { const hd = document.getElementById('exRevHead'); if(hd && hd.focus) hd.focus(); } catch(e){}
}
/* One place decides whether an exam answer was right, for both grading and the
   review page: a select-all item is right only when the whole set matches. */
function examRight(q, p){
  if(isMulti(q)) return Array.isArray(p) && p.length > 0 && gradeMulti(q, p);
  return p !== null && p !== undefined && q.options[p].correct;
}
const examBlank = (q, p) => isMulti(q) ? !(Array.isArray(p) && p.length) : (p === null || p === undefined);
/* partial: blank items are left out of the history rather than logged as
   misses, for a paper that could not be finished. */
function finishExam(partial){
  // once per paper, and only under its own profile: a second submit (a handler run twice, a
  // clock firing as the paper is submitted) records nothing more
  if(!EX || !EX.running || !examOwned()) return;
  clearInterval(EX.timer);
  if(untimedPaper()) EX.took = Date.now() - EX.started;
  EX.running = false; EX.done = true; EX.partial = !!partial;
  EX.qs.forEach((q,i)=>{
    const p = EX.picks[i];
    if(partial && examBlank(q, p)) return;
    const picked = isMulti(q) ? (p || []).slice().sort((a,b)=>a-b) : p;
    record(q, examRight(q, p) ? 'correct' : 'wrong', picked, undefined, 'exam');
  });
  clearExam();
  renderExamResult();
}
function renderExamResult(){
  const right = EX.qs.filter((q,i)=> examRight(q, EX.picks[i])).length;
  const blank = EX.qs.filter((q,i)=> examBlank(q, EX.picks[i])).length;
  const pct = Math.round(100*right/EX.qs.length);
  let h = `<h2>Exam simulation — ${right} / ${EX.qs.length} (${pct}%)</h2>${typeof EX.took === 'number' ? `
  <p class="sub" id="exTook">Time taken: ${fmt(EX.took)}. This paper was untimed.</p>` : ''}
  ${blank ? `<p class="sub" id="exDenoms">${EX.partial ? '<b>Partial submission.</b> ' : ''}${EX.qs.length - blank} answered, ${blank} unanswered.
    The score above counts all ${EX.qs.length} items on the paper; ${EX.qs.length - blank
      ? `${Math.round(100*right/(EX.qs.length - blank))}% on the ${EX.qs.length - blank} answered (${right} right)` : 'none was answered'}.</p>` : ''}
  <p class="sub">${blank ? blank + ' left blank' + (EX.partial ? ', not logged. ' : ', scored as incorrect. ') : ''}${EX.partial ? 'The answered items are' : 'All ' + EX.qs.length + ' are'} now in your history,
  so anything you missed is back in active review.</p>
  <p><button class="btn" id="exAgain">New paper</button>
     <button class="btn ghost" onclick="show('gaps')">See weak spots</button></p>
  <h3>Every question, with the reasoning</h3>`;
  EX.qs.forEach((q,i)=>{
    const p = EX.picks[i], ok = examRight(q, p), blankQ = examBlank(q, p), multi = isMulti(q);
    const chosen = oi => multi ? (p || []).includes(oi) : oi === p;
    h += `<div class="qcard" style="margin-bottom:12px"><div class="qhead">
      ${profTag(q.prof)}<span>Q${i+1}</span>${multi ? '<span class="tag sata">select all</span>' : ''}<span class="spacer"></span>
      <span style="color:${ok?'var(--ok)':'var(--bad)'}">${ok?'correct':(blankQ?'blank':'missed')}</span>
      </div><div class="qbody"><p class="stem" style="font-size:15.5px">${esc(q.stem)}</p>`;
    if(q.img && IMAGES[q.img]) h += `<img class="qimg" src="${IMAGES[q.img]}" alt="Reaction scheme">`;
    if(q.fg) h += fgShow(q.fg);
    EX.orders[i].forEach((oi,n)=>{
      const o = q.options[oi];
      h += `<div class="wrow"><span class="mark ${o.correct?'y':'n'}">${o.correct?'\u2713':'\u2717'}</span>
        <span class="wtxt"><b>${LETTERS[n]}. ${esc(o.t)}</b>${chosen(oi)?' &nbsp;<i>(you picked this)</i>':''} \u2014 ${esc(o.why)}</span>
        ${optFig(o.t)}</div>`;
    });
    if(q.teach) h += `<div class="teach"><h4>The concept behind this</h4>${
        q.svg ? `<div class="tdiag">${q.svg}</div>` : ''}${
        q.teachImg && IMAGES[q.teachImg] ? `<img class="qimg tdimg" src="${IMAGES[q.teachImg]}" alt="Figure from the lecture slide">` : ''}${
        cmpStrip(q, 'The structures side by side')}${renderTeach(q.teach)}</div>`;
    h += `<div class="cite">${q.quote ? `<span class="quote">\u201c${esc(q.quote)}\u201d</span>` : ''}${srcFlag(q)}${esc(q.cite)}</div></div></div>`;
  });
  $('#v-exam').innerHTML = h;
  $('#exAgain').onclick = ()=>{ EX=null; renderExam(); };
}

/* ==========================================================================
   STEP-THROUGH FIGURES
   ==========================================================================
   A step-through figure (diagrams.js `stepper`) holds one SVG group per step and
   shows one at a time. Moving between two steps animates the difference: a shape
   that is in both glides from where it was to where it now is, a shape that is
   new fades in, and a shape that is gone fades out from a ghost copy of the old
   step. Only end positions are set here; the CSS does the motion, and
   prefers-reduced-motion turns all of it off.

   Matching is by `data-k` where the author supplied one, and otherwise by tag
   plus class plus text or fill. The animation classes have to be stripped out of
   that signature: a shape still carrying `glide` from the previous move would
   otherwise look like a different shape and fade out and back in. */
let ANIM = null;                      // the one figure playing: {t:interval, b:its Play button}
const LEAF = 'text,circle,rect,ellipse,line,polyline,polygon,path';
const sigOf = el => el.getAttribute('data-k') || [
  el.tagName,
  (el.getAttribute('class') || '').replace(/\b(fadein|glide)\b/g, '').trim(),
  el.tagName === 'text' ? el.textContent : (el.getAttribute('fill') || '')].join('|');
const centreOf = el => { const r = el.getBoundingClientRect();
  return [r.left + r.width/2, r.top + r.height/2, r.width + r.height]; };

function stepTo(fig, from, to){
  const steps = [...fig.querySelectorAll('.st')], svg = fig.querySelector('svg');
  if(!steps.length || !svg) return;
  fig.querySelectorAll('.st-out').forEach(n => n.remove());
  const old = (from !== null && from !== undefined && from !== to) ? steps[from] : null;
  const before = new Map();                       // signature -> queue of old screen positions
  if(old && !reduceMotion()) old.querySelectorAll(LEAF).forEach(el => {
    if(el.classList.contains('capt')) return;     // captions fade, they do not travel
    const k = sigOf(el), c = centreOf(el);
    if(c[2]){ if(!before.has(k)) before.set(k, []); before.get(k).push({el, c}); }
  });
  steps.forEach((s, j) => s.classList.toggle('on', j === to));
  fig.querySelectorAll('.sdot').forEach((d, j) => {
    d.classList.toggle('on', j === to);
    d.setAttribute('aria-current', j === to ? 'step' : 'false');
  });
  const now$ = fig.querySelector('.stepnow');
  if(now$) now$.textContent = `Step ${to + 1} of ${steps.length}`;
  if(reduceMotion()) return;
  const now = steps[to];
  const scale = svg.viewBox.baseVal.width / (svg.getBoundingClientRect().width || 1);
  const used = new Set(), leaves = [...now.querySelectorAll(LEAF)];
  leaves.forEach(el => { el.classList.remove('fadein', 'glide'); el.style.transform = ''; });
  svg.getBoundingClientRect();                    // restart the fade-in animations
  leaves.forEach(el => {
    if(el.classList.contains('capt')){ el.classList.add('fadein'); return; }
    const q = before.get(sigOf(el)), m = q && q.shift();
    if(!m){ el.classList.add('fadein'); return; }
    used.add(m.el);
    if(el.hasAttribute('transform')) return;      // a CSS transform would replace its own rotate()
    const c = centreOf(el), dx = (m.c[0]-c[0])*scale, dy = (m.c[1]-c[1])*scale;
    if(Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    el.style.transform = `translate(${dx}px,${dy}px)`;
    el.getBoundingClientRect();                   // commit the start position
    el.classList.add('glide'); el.style.transform = '';
  });
  if(!old) return;
  const ghost = old.cloneNode(true);
  ghost.classList.remove('on', 'st'); ghost.classList.add('st-out'); ghost.removeAttribute('data-step');
  const oldLeaves = [...old.querySelectorAll(LEAF)], ghostLeaves = [...ghost.querySelectorAll(LEAF)];
  oldLeaves.forEach((el, k) => {
    if(used.has(el) || el.classList.contains('capt')) ghostLeaves[k].remove();
  });
  svg.appendChild(ghost);
  setTimeout(() => ghost.remove(), 600);
}
/* What the step controls gain from the engine, whatever diagrams.js wrote: the
   current step in words (announced as it changes), aria-current on its dot, and
   an Enlarge button that shows the figure across the screen (Escape or Close
   puts it back). The steps and their order are the figure's own. Run on each
   view as it is drawn; a figure already armed is left alone. */
function armFigs(root){
  if(!root || typeof root.querySelectorAll !== 'function') return;
  root.querySelectorAll('[data-anim]').forEach(ctl => {
    if(ctl.querySelector('.stepnow')) return;
    const fig = ctl.closest('figure'); if(!fig) return;
    const steps = [...fig.querySelectorAll('.st')]; if(!steps.length) return;
    const i = Math.max(0, steps.findIndex(s => s.classList.contains('on')));
    const now = document.createElement('span');
    now.className = 'stepnow'; now.setAttribute('aria-live', 'polite');
    now.textContent = `Step ${i + 1} of ${steps.length}`;
    ctl.prepend(now);
    fig.querySelectorAll('.sdot').forEach((d, j) => d.setAttribute('aria-current', j === i ? 'step' : 'false'));
    const big = document.createElement('button');
    big.type = 'button'; big.className = 'btn ghost'; big.dataset.go = 'big'; big.textContent = 'Enlarge';
    big.setAttribute('aria-pressed', 'false');
    ctl.appendChild(big);
  });
}
function figBig(fig, on, keepFocus){
  if(on === fig.classList.contains('big')) return;
  /* The enlarged figure leaves the page's flow, which would shorten the page and
     let the browser move the reader up; a placeholder of the figure's own size
     holds its place, and the page is put back where it was on close. */
  let ph = null;
  if(on){
    const cs = getComputedStyle(fig);
    ph = document.createElement('div');
    ph.className = 'figph'; ph.setAttribute('aria-hidden', 'true');
    ph.style.height = fig.getBoundingClientRect().height + 'px';   // the exact height: offsetHeight rounds, and a fractional figure then shortened the page while enlarged (DEENT ux_test)
    ph.style.marginTop = cs.marginTop; ph.style.marginBottom = cs.marginBottom;
    fig.dataset.y = String(window.scrollY);
  }
  fig.classList.toggle('big', on);
  document.body.classList.toggle('figbig', on);
  // the placeholder goes in only once the figure has left the flow, so the two
  // never stand in the flow together; the page is held where it was either way
  if(ph){ fig.before(ph); window.scrollTo(0, +fig.dataset.y); }
  if(!on){
    const ph = fig.previousElementSibling;
    if(ph && ph.classList.contains('figph')) ph.remove();
    const y = +fig.dataset.y; delete fig.dataset.y;
    if(fig.isConnected && !isNaN(y)) window.scrollTo(0, y);
  }
  const b = fig.querySelector('[data-go="big"]');
  if(b){ b.textContent = on ? 'Close' : 'Enlarge'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  if(on){ fig.setAttribute('role', 'dialog'); fig.setAttribute('aria-modal', 'true'); }
  else { fig.removeAttribute('role'); fig.removeAttribute('aria-modal'); }
  // focus goes to the button that opened it, Close while open and Enlarge after,
  // without the browser scrolling to it
  if(b && !keepFocus && b.isConnected) b.focus({preventScroll: true});
}
/* Close any enlarged figure and release the page's scroll lock: before another
   tab is shown or a view is drawn again, so the lock never outlives its figure. */
function figClose(){
  if(typeof document.querySelectorAll !== 'function' || !document.body || !document.body.classList) return;
  document.querySelectorAll('figure.big').forEach(f => figBig(f, false, true));
  document.body.classList.remove('figbig');
}
document.addEventListener('keydown', e => {
  const open = document.querySelector('figure.big');
  if(!open && document.body.classList.contains('figbig')) document.body.classList.remove('figbig');
  if(e.key === 'Escape' && open){ e.preventDefault(); figBig(open, false); return; }
  // while a figure is enlarged, Tab moves among its own controls only
  if(e.key === 'Tab' && open){
    const f = [...open.querySelectorAll('button,[href],select,input,[tabindex]:not([tabindex="-1"])')]
      .filter(x => !x.disabled && x.getClientRects().length);
    if(f.length){
      const i = f.indexOf(document.activeElement);
      const to = e.shiftKey ? (i <= 0 ? f[f.length - 1] : f[i - 1]) : (i < 0 || i === f.length - 1 ? f[0] : f[i + 1]);
      e.preventDefault(); to.focus();
    }
    return;
  }
  // the arrow keys step a figure while one of its controls has focus
  const ctl = e.target && e.target.closest && e.target.closest('[data-anim]');
  if(!ctl || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
  const b = ctl.querySelector(`button[data-go="${e.key === 'ArrowRight' ? 1 : -1}"]`);
  if(b){ e.preventDefault(); b.click(); }
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-anim] button'); if(!b) return;
  const fig = b.closest('figure'); if(!fig) return;
  if(b.dataset.go === 'big') return figBig(fig, !fig.classList.contains('big'));
  const steps = [...fig.querySelectorAll('.st')]; if(!steps.length) return;
  const cur = steps.findIndex(s => s.classList.contains('on')), n = steps.length;
  const playBtn = fig.querySelector('[data-go="play"]');
  const stop = () => { if(ANIM){ clearInterval(ANIM.t); ANIM.b.textContent = '▶ Play all'; ANIM = null; } };
  const go = b.dataset.go;
  if(go === 'play'){
    const same = ANIM && ANIM.b === b; stop(); if(same) return;
    b.textContent = '❚❚ Pause'; stepTo(fig, null, 0);
    ANIM = {b, t: setInterval(() => {
      if(!document.body.contains(fig)) return stop();
      const i = steps.findIndex(s => s.classList.contains('on'));
      if(i >= n-1) return stop();
      stepTo(fig, i, i+1);
      if(i+1 === n-1) stop();
    }, 3200)};
    return;
  }
  if(ANIM && ANIM.b === playBtn) stop();
  if(go === 'replay') return stepTo(fig, cur > 0 ? cur-1 : null, cur);
  if(go === 'dot') return stepTo(fig, cur, +b.dataset.i);
  stepTo(fig, cur, (cur + (+go) + n) % n);
});

/* ==========================================================================
   EXPLAIN ONE — a card under a table, for one row at a time
   ==========================================================================
   A reference table with a row per drug or per class cannot carry a paragraph
   of reasoning in every row without becoming unreadable. Instead each row has a
   Why? button, the table has one select and one output area, and each row's
   explanation sits in a <template> in the content file:

     <td><button class="whybtn" data-xpick="classes:atenolol">Why?</button> …
     <div class="xpick">
       <label>Explain one: <select data-xsel="classes">…</select></label>
       <div class="xout" data-xout="classes"></div>
     </div>
     <template data-x="classes:atenolol"> … card markup … </template>

   A card may carry <button data-xgo="fig-id"> to jump to the figure that shows
   it; a floating button then comes back to the card. */
function showExplain(group, key){
  const out = document.querySelector(`[data-xout="${group}"]`);
  const sel = document.querySelector(`[data-xsel="${group}"]`);
  if(!out) return null;
  const t = key && document.querySelector(`template[data-x="${group}:${key}"]`);
  out.innerHTML = t ? t.innerHTML : '';
  boxTables(out);
  if(sel) sel.value = key || '';
  return out;
}
document.addEventListener('change', e => {
  const s = e.target.closest('select[data-xsel]');
  if(s) showExplain(s.dataset.xsel, s.value);
});
document.addEventListener('click', e => {
  const w = e.target.closest('[data-xpick]');
  if(w){
    const [g, k] = w.dataset.xpick.split(':');
    const out = showExplain(g, k);
    if(out) scrollToEl(out.closest('.xpick') || out);
    return;
  }
  const g = e.target.closest('[data-xgo]');
  if(g){
    const el = document.getElementById(g.dataset.xgo);
    if(el){ xBack(g.closest('.xpick') || g.parentElement); scrollToEl(el); }
  }
});
function xBack(target){
  let b = document.getElementById('xback');
  if(!target){ if(b) b.remove(); return; }
  if(!b){
    b = document.createElement('button');
    b.id = 'xback'; b.type = 'button'; b.className = 'btn';
    b.textContent = '↑ Back to the explanation';
    document.body.appendChild(b);
  }
  b.onclick = () => { if(document.body.contains(target)) scrollToEl(target); xBack(null); };
}

/* ==========================================================================
   DIAGRAMS TAB
   ==========================================================================
   Every drawn figure in one place, grouped as DIAGRAMS in diagrams.js, with a
   contents card per group whose chips jump to a figure. A figure that is also
   shown inside a question appears here too, which is where a reader goes to
   work through a process without being asked anything. */
const DIA_LIST = () => (typeof DIAGRAMS !== 'undefined' ? DIAGRAMS : [])
  .map(([name, keys]) => [name, keys.filter(k => typeof DIA !== 'undefined' && DIA[k])])
  .filter(([, keys]) => keys.length);
function renderDiagrams(){
  figClose();
  const el = $('#v-diagrams');
  const groups = DIA_LIST();
  if(!groups.length){
    el.innerHTML = `<h2>Diagrams</h2><div class="empty">No figures are registered yet.
      Add them to DIA in diagrams.js and list them in DIAGRAMS.</div>`;
    return;
  }
  const titleOf = html => { const m = html.match(/<text class="title"[^>]*>([^<]*)</); return m ? m[1] : ''; };
  let toc = '', body = '';
  groups.forEach(([name, keys], gi) => {
    const figs = keys.map(k => ({k, html: DIA[k],
      t: (typeof DIA_NAMES !== 'undefined' && DIA_NAMES[k]) || titleOf(DIA[k]) || k}));
    toc += `<div class="panel"><b>${esc(name)}</b><div class="row" style="margin-top:7px">${figs.map(f =>
      `<a class="chip" href="#dg-${esc(f.k)}" data-dg="${esc(f.k)}">${esc(f.t)}${/data-anim/.test(f.html) ? ' ▶' : ''}</a>`).join('')}</div></div>`;
    body += `<h3 id="dgg-${gi}">${esc(name)}</h3><div class="diagrid">${figs.map(f =>
      `<div id="dg-${esc(f.k)}">${f.html}</div>`).join('')}</div>`;
  });
  el.innerHTML = `<h2>Diagrams</h2>
    <p class="sub">Every drawn figure in one place. ▶ marks a step-through: use Next, Play all or the step dots under it.</p>${toc}${body}`;
  el.querySelectorAll('[data-dg]').forEach(a => a.onclick = e => {
    e.preventDefault();
    scrollToEl(document.getElementById('dg-' + a.dataset.dg));
  });
}

/* ==========================================================================
   REFERENCE
   ========================================================================== */
/* The reference text carries {{fig:key|caption}} tokens rather than the base64
   itself, so reference.js stays readable and a figure is stored once in
   IMAGES. A token naming a key that is not in the bank is dropped rather than
   rendered as a broken image. */
const ENT = {'&mdash;':'—','&ndash;':'–','&nbsp;':' ','&rarr;':'→',
             '&amp;':'&','&lt;':'<','&gt;':'>','&deg;':'°','&pi;':'π',
             '&minus;':'−','&le;':'≤','&ge;':'≥',
             /* the atlas adds these */
             '&beta;':'β','&alpha;':'α','&gamma;':'γ','&equiv;':'≡',
             '&ldquo;':'“','&rdquo;':'”','&rsquo;':'’',
             '&lsquo;':'‘','&hellip;':'…','&times;':'×'};
/* Reference text is authored as HTML, so an entity has to be decoded before it
   is re-escaped for an attribute or a caption, or it reads out literally.
   Numeric entities are decoded too, since the atlas writes &#8801; for a
   triple bond. */
const deEnt = t => String(t)
  .replace(/&[a-z]+;/gi, e => ENT[e] !== undefined ? ENT[e] : e)
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));

function refFigures(html){
  return html
    // a slide crop stored in images.json
    .replace(/\{\{fig:([a-z0-9_]+)\|([^}]*)\}\}/gi, (_, key, cap) => {
      if(!IMAGES[key]) return '';
      const c = esc(deEnt(cap));
      return `<figure class="reffig"><img src="${IMAGES[key]}" alt="${c}">` +
             `<figcaption>${c}</figcaption></figure>`;
    })
    // a figure drawn in diagrams.js, step-through controls and all
    .replace(/<!--DIA:([\w-]+)-->/g, (_, key) => (typeof DIA !== 'undefined' && DIA[key]) ? DIA[key] : '');
}

/* ==========================================================================
   FUNCTIONAL GROUP ATLAS
   ==========================================================================
   Every group drawn at the same scale, with confusable ones side by side and
   the atom that separates them shaded. Structures come from atlas.js, which
   renders them from atom-and-bond data rather than storing pictures, so they
   stay sharp at any size and cost almost nothing in file size.

   "Hide names" turns the page into a recall test: the drawing stays, the name
   and the tell disappear, and clicking a structure reveals just that one.
   ========================================================================== */
let ATLAS_BUILT = false;

/* The words the Atlas uses for itself, from course.js, each defaulting to what
   the engine always said, so a course that sets none reads as before:
     atlasTitle         the heading ('Functional group atlas')
     atlasNoun          what one tile is: a word ('structure', plural + "s") or
                        [one, many] (['group', 'groups'])
     atlasExampleLabel  the label before a tile's `e` line ('e.g.'); '' drops it,
                        for a course whose `e` lines are facts, not examples */
function atlasWords(){
  const n = COURSE.atlasNoun;
  const [one, many] = Array.isArray(n) ? [n[0], n[1] || n[0] + 's'] : n ? [n, n + 's'] : ['group', 'groups'];
  return {title: COURSE.atlasTitle || 'Functional group atlas', one, many,
          search: n ? `Find a ${one}` : 'Find a functional group',
          eg: COURSE.atlasExampleLabel === undefined || COURSE.atlasExampleLabel === null ? 'e.g.' : String(COURSE.atlasExampleLabel)};
}
const ATLAS_ANON = 'Structure to identify';

function renderAtlas(){
  const el = $('#v-atlas');
  if(ATLAS_BUILT) return;

  const W = atlasWords();
  const count = ATLAS.boards.reduce((n,b)=>n+b.sections.reduce((m,s)=>m+s.items.length,0),0);
  let h = `<h2>${esc(W.title)}</h2>
  <p class="sub">${count} ${esc(count === 1 ? W.one : W.many)}, drawn to the same scale. The ones that get confused sit next to
  each other and the atom that separates them is shaded. Read a row left to right, then hide the
  names and go along it again.</p>
  <div class="atbar">
    <input id="atq" type="search" placeholder="Find a ${esc(W.one)}…" aria-label="${esc(W.search)}">
    <button class="chip" id="atHide" aria-pressed="false">Hide names</button>
    <button class="chip hide" id="atShow">Reveal all</button>
    <span class="spacer"></span>
    <span style="font-size:12px;color:var(--text-dim)" id="atCount" aria-live="polite"></span>
  </div>`;

  // In Hide names mode a board's heading reads "Board n of N" instead of its
  // title, and its intro, section labels and note are hidden (shell.html).
  ATLAS.boards.forEach((b, bi) => {
    h += `<section class="atboard" id="at-${b.id}"><h3><span class="athead-name">${b.title}</span><span class="athead-anon">Board ${bi + 1} of ${ATLAS.boards.length}</span></h3>
      <p class="bintro">${b.intro}</p>`;
    for(const sec of b.sections){
      h += `<div class="atsub">${esc(sec.label)}</div><div class="atgrid">`;
      for(const it of sec.items){
        const svg = ATLAS.FG[it.plain] || '';
        const hay = (it.plain + ' ' + it.t + ' ' + (it.e||'')).replace(/<[^>]+>/g,'').toLowerCase();
        h += `<article class="attile" data-find="${esc(hay)}">
          <div class="atfig">${svg}</div>
          <button type="button" class="chip atrev" aria-expanded="false">Reveal name</button>
          <div class="atname">${it.n}</div>
          <p class="attell">${it.t}</p>
          ${it.e ? `<p class="ateg">${W.eg ? `<span class="ateglbl">${esc(W.eg)} </span>` : ''}${esc(it.e)}</p>` : ''}
        </article>`;
      }
      h += `</div>`;
    }
    if(b.note) h += `<p class="atnote">${b.note}</p>`;
    h += `</section>`;
  });
  h += `<p class="sub" style="margin-top:26px">A bare line end is a carbon with three hidden
  hydrogens and a plain vertex is a carbon with two. A line end carrying a letter is that atom
  instead, not a carbon — different drawings entirely, and the cheapest point to lose.</p>`;

  el.innerHTML = h;
  ATLAS_BUILT = true;

  const tiles = [...el.querySelectorAll('.attile')];
  const q = el.querySelector('#atq'), hide = el.querySelector('#atHide'),
        showAll = el.querySelector('#atShow'), count$ = el.querySelector('#atCount');
  tiles.forEach(t => t.querySelectorAll('.atfig svg').forEach(sv => {
    sv.dataset.label = sv.getAttribute('aria-label') || '';
    const ti = sv.querySelector('title'); if(ti) ti.dataset.label = ti.textContent;
  }));

  /* A tile counts as shown when the search left it in and nothing else hides it
     either: a course's own controls may hide tiles with a class (a filter of its
     own), so the count reads what is on screen, not only the search's `hidden`. */
  const onScreen = t => !t.hidden && (el.offsetParent === null || t.getClientRects().length > 0);
  const recount = () => {
    const live = tiles.filter(onScreen).length;
    count$.textContent = live === tiles.length ? `${tiles.length} ${tiles.length === 1 ? W.one : W.many}` : (COURSE.atlasNoun ? `${live} of ${tiles.length} ${W.many}` : `${live} of ${tiles.length}`);
  };
  recount();
  el.atlasRecount = recount;

  /* The names, as the mode shows them: a drawing is labelled with its name only
     while the names are shown or its tile is revealed; otherwise it reads as a
     structure to identify. Each reveal button says whether its tile is open. */
  const sync = () => {
    const off = el.classList.contains('namesoff');
    tiles.forEach(t => {
      const shown = !off || t.classList.contains('shown');
      t.querySelectorAll('.atfig svg').forEach(sv => {
        sv.setAttribute('aria-label', shown ? sv.dataset.label : ATLAS_ANON);
        const ti = sv.querySelector('title'); if(ti) ti.textContent = shown ? ti.dataset.label : ATLAS_ANON;
      });
      const b = t.querySelector('.atrev');
      if(b){ b.setAttribute('aria-expanded', off && t.classList.contains('shown') ? 'true' : 'false');
             b.textContent = off && t.classList.contains('shown') ? 'Hide name' : 'Reveal name'; }
    });
  };
  const reveal = t => { if(!el.classList.contains('namesoff')) return; t.classList.toggle('shown'); sync(); };

  q.oninput = () => {
    const v = q.value.trim().toLowerCase();
    tiles.forEach(t => t.hidden = v && t.dataset.find.indexOf(v) === -1);
    el.querySelectorAll('.atboard').forEach(b => {
      b.querySelectorAll('.atgrid').forEach(g => {
        const any = [...g.children].some(c => !c.hidden);
        g.hidden = !any;
        if(g.previousElementSibling) g.previousElementSibling.hidden = !any;
      });
      const live = [...b.querySelectorAll('.attile')].some(t => !t.hidden);
      b.querySelectorAll('h3, .bintro, .atnote').forEach(x => x.hidden = !live);
    });
    recount();
  };

  hide.onclick = () => {
    const on = !el.classList.contains('namesoff');
    el.classList.toggle('namesoff', on);
    hide.setAttribute('aria-pressed', on ? 'true' : 'false');
    hide.textContent = on ? 'Names hidden' : 'Hide names';
    showAll.classList.toggle('hide', !on);
    if(!on) tiles.forEach(t => t.classList.remove('shown'));
    sync(); recount();
  };
  showAll.onclick = () => { tiles.forEach(t => t.classList.add('shown')); sync(); };
  tiles.forEach(t => {
    t.querySelector('.atfig').onclick = () => reveal(t);
    const b = t.querySelector('.atrev'); if(b) b.onclick = () => reveal(t);
  });
  sync();
}

function renderDoc(el, html, prefix){
  // a jump list, built from the section headings that are actually present
  // headings are authored as HTML, so entities are decoded before the label is
  // re-escaped for the link; otherwise a chip reads "&mdash;" literally
  const heads = [...html.matchAll(/<h3([^>]*)>([\s\S]*?)<\/h3>/g)]
    .map((m, n) => ({id: (m[1].match(/id="([^"]+)"/) || [])[1] || `${prefix}-${n}`,
                     label: deEnt(m[2].replace(/<[^>]+>/g, '')).trim()}));
  // A heading that already carries an id keeps it: links.js points the review
  // plan and the "Explain more" chips at those, and a hand-written id stays put
  // when a section is inserted above it, while the generated numbering shifts.
  let i = 0;
  const body = html.replace(/<h3([^>]*)>/g, (m, attrs) =>
    /\bid=/.test(attrs) ? `<h3${attrs}>` : `<h3 id="${prefix}-${i++}"${attrs}>`);
  // the jump list folds away so it does not sit between the reader and the
  // tables while scrolling; it opens on tap and closes again after a jump
  const nav = heads.length
    ? `<details class="refnav-wrap"><summary>Jump to a section</summary><nav class="refnav">${heads.map(h =>
        `<a href="#${h.id}">${esc(h.label)}</a>`).join('')}</nav></details>`
    : '';
  el.innerHTML = body.replace('</p>', '</p>' + nav);
  boxTables(el);
  // anchor links inside a scrolling panel need handling rather than a page jump,
  // and the target has to clear the sticky header and nav
  el.querySelectorAll('.refnav a').forEach(a => a.onclick = e => {
    e.preventDefault();
    const t = el.querySelector(a.getAttribute('href'));
    const d = el.querySelector('.refnav-wrap'); if (d) d.open = false;
    scrollToEl(t);
  });
}
/* A table wider than the screen (a phone, most often) scrolls sideways inside
   a box of its own (.tscroll in shell.html), so the page itself never scrolls
   sideways. The table, its rows and their order are as written; only the box
   is added around it. The table's top and bottom margins move to the box: a
   scrolling box keeps its children's margins inside, so left on the table they
   would no longer collapse with the heading after it and the tab would grow. */
function boxTables(root){
  root.querySelectorAll('table').forEach(t => {
    if(t.parentElement && t.parentElement.classList.contains('tscroll')) return;
    const box = document.createElement('div'), cs = getComputedStyle(t);
    box.className = 'tscroll';
    box.style.marginTop = cs.marginTop; box.style.marginBottom = cs.marginBottom;
    t.before(box); box.appendChild(t);
    t.style.marginTop = '0'; t.style.marginBottom = '0';
    const cue = document.createElement('p');
    cue.className = 'tcue'; cue.hidden = true; cue.setAttribute('aria-hidden', 'true');
    box.before(cue);
    box.addEventListener('scroll', () => sideCue(box), {passive: true});
    TABLE_BOXES.add(box);
  });
  if(typeof requestAnimationFrame === 'function')
    requestAnimationFrame(() => root.querySelectorAll('.tscroll').forEach(sideCue));
}
/* A box whose table is wider than it is marked .wide (its first column then
   stays in view) and more-l / more-r for the side that has more columns; the
   line above it says so in words. Measured again on a resize or rotation. */
const TABLE_BOXES = new Set();
function sideCue(box){
  if(!box.isConnected){ TABLE_BOXES.delete(box); return; }
  if(!box.offsetParent) return;                     // its tab is not on screen
  const over = box.scrollWidth - box.clientWidth > 1;
  const l = over && box.scrollLeft > 1, r = over && box.scrollLeft < box.scrollWidth - box.clientWidth - 1;
  box.classList.toggle('wide', over);
  // the first column stays in view only where each row starts with its own cell:
  // a rowspan or colspan would pin a cell of another column on the rows it spans
  const t = box.querySelector('table');
  box.classList.toggle('stick', over && !!t && !t.querySelector('[rowspan]:not([rowspan="1"]),[colspan]:not([colspan="1"])'));
  box.classList.toggle('more-l', l);
  box.classList.toggle('more-r', r);
  const cue = box.previousElementSibling;
  if(cue && cue.classList.contains('tcue')){
    cue.hidden = !over;
    cue.textContent = r ? (l ? '\u2190 More columns on both sides \u2192' : 'More columns to the right: scroll sideways \u2192')
                        : '\u2190 More columns to the left';
  }
}
if(typeof window.addEventListener === 'function')
  window.addEventListener('resize', () => { TABLE_BOXES.forEach(sideCue); navCue(); });
function renderRef(){ renderDoc($('#v-ref'), refFigures(REFERENCE_HTML), 'ref'); }
function renderTell(){ renderDoc($('#v-tell'), refFigures(TELL_HTML), 'tell'); }
function renderGuide(){ renderDoc($('#v-guide'), refFigures(GUIDE_HTML), 'guide'); }

/* ==========================================================================
   SETTINGS
   ========================================================================== */
/* Which scheduler this course runs, in Settings, when it is not the concept
   scheduler the pace buttons above describe. */
function schedulerNote(){
  if(SCHED.model === 'fsrs') return `<p style="font-size:13.5px;color:var(--text-dim);margin:8px 0 0">
      This course schedules each question with FSRS-7 (the ts-fsrs library, version 6.0.0, with its default settings):
      when a question comes back is worked out from your answers to it, so the paces above do not change it.
      "Ask everything" still serves every question, lowest predicted recall first.
      "I was sure of that" records the confidence.</p>`;
  const combo = `FSRS-7 (the ts-fsrs library, version 6.0.0, with its default settings) keeps one memory model
      per concept, updated by whichever of its questions you answer, and shows the concept's question you saw least recently`;
  if(SCHED.model === 'concept-fsrs' && SCHED.compare) return `<p style="font-size:13.5px;color:var(--text-dim);margin:8px 0 0">
      This course compares two schedulers. Each concept is assigned at random to one of them: the paces above, or
      ${combo}. The questions of each session are shared evenly between the two, and the answer history records
      which one scheduled each answer.</p>`;
  if(SCHED.model === 'concept-fsrs') return `<p style="font-size:13.5px;color:var(--text-dim);margin:8px 0 0">
      In this course ${combo}; the paces above do not change when a concept comes back.</p>`;
  return '';
}
function renderSettings(){
  const p = pace(), all = DB.settings.mode === 'all';
  $('#v-settings').innerHTML = `<h2>Settings</h2>
  <p class="sub">Progress is stored in this browser only, under the name “${esc(PROFILE)}”.</p>

  <h3>Review pace</h3>
  <div class="filters">
    <div class="frow">
      ${Object.entries(PACES).map(([k, P]) => `<button class="chip" data-pace="${k}" aria-pressed="${p===k && !all}">${esc(P.label)}</button>`).join('')}
      <button class="chip" data-pace="all" aria-pressed="${all}">Ask everything</button>
    </div>
    <p style="font-size:13.5px;color:var(--text-dim);margin:4px 0 0">
      ${Object.values(PACES).map(P => `<b>${esc(P.label)}</b>: ${esc(P.blurb)}. `).join('')}
      <b>Ask everything</b> ignores the schedule and keeps serving questions, still worst-first.
      After a correct answer, "Not sure" brings that concept back at the shortest interval and "I guessed" treats it as not yet known.
      After a wrong answer, "I was sure of that" brings a different question on the same concept next and asks the concept again on a later day.
    </p>
    ${schedulerNote()}
  </div>

  <h3>Export</h3>
  <div class="filters">
    <div class="frow">
      <button class="btn ghost" id="expMd">Questions as text (Markdown)</button>
      <button class="btn ghost" id="expJson">Questions as data (JSON)</button>
      <button class="btn ghost" id="expGuides">Guides + Tell apart + Reference (HTML)</button>
    </div>
    <p style="font-size:13.5px;color:var(--text-dim);margin:4px 0 0">
      The Markdown file lists every question with its answer, explanations and citation; the JSON is the same bank for other apps; the HTML is the three reading tabs as one page that prints.
    </p>
  </div>

  <h3>Move your progress between devices</h3>
  <div class="filters">
    <div class="frow">
      <button class="btn" id="btnExport">Export progress</button>
      <button class="btn ghost" id="btnImport">Import progress</button>
      <input type="file" id="fileIn" accept="application/json" class="hide">
    </div>
    <p style="font-size:13.5px;color:var(--text-dim);margin:4px 0 0">
      Storage does not sync between your phone and your laptop. Export on one, import on the other.
      Import shows what the file holds and what it would change before it saves anything.
      Each answer is also kept in an answer history (time, question, right or wrong, the confidence button, the scheduler that chose it)
      so the review schedule can later be fitted to your own answers; Export progress includes it.
    </p>
    ${backupNote()}
    <div id="importPlan"></div>
  </div>
  ${storageSection()}
  ${homeCard()}

  <h3>Start over</h3>
  <div class="filters">
    <div class="frow"><button class="btn ghost" id="btnReset"
      style="color:var(--bad);border-color:#E9B8B4">Erase my history</button></div>
    <p style="font-size:13.5px;color:var(--text-dim);margin:4px 0 0">
      Clears every answer and schedule for “${esc(PROFILE)}”. Other people's profiles are untouched.
    </p>
  </div>

  ${(BUILD.changelog || []).length ? `<h3 id="changelog">What has changed</h3>
  <div class="panel">${BUILD.changelog.map(c => `<p style="margin:0 0 4px"><b>${esc(c.date)}</b></p>
    <ul style="margin:0 0 12px;padding-left:20px;font-size:14px">${c.items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`).join('')}
    <p class="meta" style="margin:0">Every update to this drill is listed here, newest first.</p></div>` : ''}

  <p class="sub" style="margin-top:18px">Build ${esc(BUILD.stamp || '')} · ${QUESTIONS.length} questions · ${BUILD.images || Object.keys(IMAGES).length} figures · ${esc(COURSE.title)}</p>
  <div class="note" style="margin-top:20px">
    <b>Sharing this with classmates.</b> Each person's history lives in their own browser on their own
    device, so nobody can see anyone else's. On a shared computer, use the Switch button at the top
    right to keep profiles apart. Private/incognito windows and “clear site data” erase progress.
  </div>`;

  $('#v-settings').querySelectorAll('.chip[data-pace]').forEach(b=>b.onclick=()=>{
    if(b.dataset.pace === 'all'){ DB.settings.mode = 'all'; }
    else { DB.settings.mode = 'normal'; DB.settings.pace = b.dataset.pace; }
    save(); renderSettings();
  });
  $('#expMd').onclick = () => download(`${COURSE.id}-questions.md`, bankMarkdown(), 'text/markdown');
  $('#expJson').onclick = () => download(`${COURSE.id}-questions.json`, JSON.stringify(bankJson(), null, 1), 'application/json');
  $('#expGuides').onclick = () => download(`${COURSE.id}-guides.html`, readingHtml(), 'text/html');
  $('#btnExport').onclick = exportProgress;
  wireHome($('#v-settings'));
  // Import and Erase replace the saved progress, so they too do nothing when
  // it was not loaded in this visit, and say why
  $('#btnImport').onclick = ()=>{ if(!canSave()){ alert(LOAD_FAIL + ' The file was not imported.'); return; } $('#fileIn').click(); };
  // Import reads and checks the whole file, then shows what it would do; it saves
  // only when that is confirmed (readProgressFile, importPlan, runImport)
  $('#fileIn').onchange = e=>{
    const f = e.target.files[0]; e.target.value = ''; if(!f) return;
    if(!canSave()){ alert(LOAD_FAIL + ' The file was not imported.'); return; }
    const r = new FileReader();
    r.onerror = () => importDone({text: 'The file could not be read, so nothing was imported. Your progress is unchanged.'});
    r.onload = () => {
      const got = readProgressFile(String(r.result));
      if(got.why){ importDone({text: esc(got.why) + ' Nothing was imported; your progress is unchanged.'}); return; }
      const plan = importPlan(got);
      if(plan.block){ importDone({text: esc(plan.block)}); return; }
      showImportPlan(plan);
    };
    r.readAsText(f);
  };
  const rb = $('#btnRestore');
  if(rb) rb.onclick = restoreBackup;
  const dc = $('#btnDeleteCopies');
  if(dc) dc.onclick = deleteCopies;
  const ct = $('#btnCapTrim'); if(ct) ct.onclick = () => { if(trimOldest()){ const w = document.getElementById('capwarn'); if(w) w.remove(); renderSettings(); } };
  const sw = $('#v-settings [data-storage-warn]');
  if(sw) wireStorageWarn(sw);
  $('#btnReset').onclick = ()=>{
    if(!canSave()){ alert(LOAD_FAIL + ' Nothing was erased.'); return; }
    if(changedElsewhere()){ staleWarn(); alert(elsewhereShort() + ', so nothing was erased. Reload this page first.'); return; }
    if(confirm(`Erase all quiz history for "${PROFILE}"? This cannot be undone.`)){
      // the question may have stayed open while another tab or window saved this profile
      if(changedElsewhere()){ staleWarn(); alert(elsewhereShort() + ', so nothing was erased. Reload this page first.'); return; }
      // erasing replaces a stored history that could not be read, too
      DB = BLANK(); save(); LOG = []; LOG_OK = true; saveLog(); pendingRetire(); alert('History erased.'); renderSettings();
    }
  };
}

/* ---- exports --------------------------------------------------------------- */
function download(name, text, type){
  const blob = new Blob([text], {type: type + ';charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const plain = s => deEnt(String(s || '')).replace(/<[^>]+>/g, '');
function bankJson(){
  return QUESTIONS.map(q => ({id:q.id, prof:q.prof, exam:(lecOf(q)||{}).exam, module:(lecOf(q)||{}).module, topic:q.topic, sub:q.sub,
    concept:q.concept, skill:skillOf(q), type:q.type||'mc', multi:!!q.multi, source:q.source||'slide', stem:q.stem,
    options:(q.options||[]).map(o=>({t:o.t, correct:!!o.correct, why:o.why})),
    answer:q.answer, units:q.units, steps:q.steps, pairs:q.pairs, teach:teachText(q.teach), note:q.note, cite:q.cite}));
}
function bankMarkdown(){
  const lines = [`# ${plain(COURSE.title)} — question bank`, '', `${QUESTIONS.length} questions. Build ${BUILD.stamp || ''}.`, ''];
  let n = 0;
  for(const t of TOPICS){
    const qs = QUESTIONS.filter(q => q.topic === t.id); if(!qs.length) continue;
    lines.push(`## ${plain(t.name)} (${t.prof})`, '');
    for(const q of qs){
      n++;
      const l = lecOf(q);
      lines.push(`### ${n}. ${plain(q.stem)}`, '', `*${l ? `Exam ${l.exam} · ${plain(l.module)} · ` : ''}${plain(SKILL_LABEL[skillOf(q)]||'')}${q.multi ? ' · select all that apply' : ''}*`, '');
      if(q.type === 'numeric'){
        lines.push(`Answer: ${fmtNum(q.answer)}${q.units ? ' ' + q.units : ''}`, '');
        (q.steps||[]).forEach((s, i) => lines.push(`${i+1}. [${MISS_KINDS[s.k]||s.k}] ${plain(s.t)}${s.why ? ' — ' + plain(s.why) : ''}`));
      } else if(q.type === 'match'){
        (q.pairs||[]).forEach(p => lines.push(`- ${plain(p.l)} → ${plain(p.r)}${p.why ? ' — ' + plain(p.why) : ''}`));
      } else {
        q.options.forEach((o, i) => lines.push(`- ${o.correct ? '**' : ''}${LETTERS[i]}. ${plain(o.t)}${o.correct ? ' ✓**' : ''} — ${plain(o.why)}`));
      }
      if(q.teach) lines.push('', `> ${plain(teachText(q.teach)).replace(/\n+/g, ' ')}`);
      if(q.note) lines.push('', `Note: ${plain(q.note)}`);
      lines.push('', `Source: ${plain(q.cite)}${q.source && q.source !== 'slide' ? ' (lecture audio)' : ''}`, '');
    }
  }
  return lines.join('\n');
}
/* The three reading tabs as one standalone page, with the figures inlined and
   the same styles, so it prints or opens anywhere. */
function readingHtml(){
  const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
  const body = ['<h1>' + esc(COURSE.title) + '</h1>', refFigures(GUIDE_HTML), refFigures(TELL_HTML), refFigures(REFERENCE_HTML)].join('\n<hr>\n');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(COURSE.short)} — guides</title><style>${css}\nbody{background:#fff}main{max-width:980px;margin:0 auto;padding:16px}@media print{.refnav-wrap{display:none}}</style></head><body><main>${body}</main></body></html>`;
}

/* "Ask everything" mode short-circuits the due check */
const _isDue = isDue;
isDue = function(s){ return (DB.settings.mode === 'all') ? true : _isDue(s); };

/* ==========================================================================
   BOOT
   ==========================================================================
   The saved progress is read first, before any step that builds the page.
   (load() in shell.html needs the answer history and the scheduler, which the
   shell defines after the storage code, so this is the earliest point it can
   run; before it, only a preview's first-visit copy of the live keys writes to
   storage, and it copies them unchanged.) Until 2026-11-01 the tab
   steps came first: when one threw (in a scratch move of the
   Pharmacokinetics drill, a DIAGRAMS list of another shape), start-up stopped
   before the load, the drill ran on a blank progress, and the next answer
   was saved over the saved progress. Every write of the progress, the answer
   history and the exam paper also waits for a load that worked (canSave in
   shell.html), so a fault before or in the load cannot cost saved progress.

   Every step after the load runs on its own (bootStep): a step that throws is
   skipped with its error on the console, and the rest of start-up goes on, so
   one feature's fault cannot stop the drill. A tab whose list cannot be built
   is removed, as an empty one is. */
function bootStep(name, run, onFail){
  try { run(); return true; }
  catch(e){
    console.error(`Start-up step skipped: ${name}.`, e);
    if(onFail){ try { onFail(); } catch(e2){ console.error(`Start-up step skipped: ${name} (its fallback failed too).`, e2); } }
    return false;
  }
}
bootStep('loading the saved progress', () => askProfile(false), () => { if(!canSave()) loadWarn(true); });
bootStep('the page title', () => {
  document.title = COURSE.title.replace(/\u2014.*/, '').trim() + ' — exam drill';
  document.getElementById('courseTitle').textContent = COURSE.title;
});
bootStep('the tab buttons', () => {
  document.querySelectorAll('#nav button').forEach(b => b.onclick = () => show(b.dataset.v));
  document.getElementById('btnWho').onclick = () => { askProfile(true); show(VIEW); };
});
bootStep('the tab bar cue', () => {
  const n = document.getElementById('nav');
  n.addEventListener('scroll', navCue, {passive: true});
  // the chevrons are the bar's own ::before / ::after, so a tap on one lands on the bar
  n.addEventListener('click', e => {
    if(e.target !== n) return;
    const r = n.getBoundingClientRect(), x = e.clientX;
    if(n.classList.contains('more-r') && x > r.right - 40) n.scrollBy({left: n.clientWidth * 0.7, behavior: reduceMotion() ? 'auto' : 'smooth'});
    else if(n.classList.contains('more-l') && x < r.left + 40) n.scrollBy({left: -n.clientWidth * 0.7, behavior: reduceMotion() ? 'auto' : 'smooth'});
  });
  navCue();
});
/* A tab with nothing in it is removed rather than left to open on an empty
   page: the atlas when the course draws no structures, the Diagrams tab when no
   figure is registered, and either one when its list cannot be built. */
const dropTab = v => { const b = document.querySelector(`#nav button[data-v="${v}"]`); if(b) b.remove(); };
bootStep('the Atlas tab', () => {
  if(COURSE.atlas === false || typeof ATLAS === 'undefined' || !ATLAS.boards || !ATLAS.boards.length) dropTab('atlas');
}, () => dropTab('atlas'));
bootStep('the Diagrams tab', () => { if(!DIA_LIST().length) dropTab('diagrams'); }, () => dropTab('diagrams'));
// Chrome offers installing the drill after the first render; the Home Screen
// section in Settings turns into an Install button where it is on screen, and
// shows one the next time Settings is drawn.
bootStep('the Home Screen section', () => {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; refreshHomeCards(); });
  window.addEventListener('appinstalled', () => { installPrompt = null; refreshHomeCards(); });
});

/* ---------- the bar along the bottom ----------
   One bar (Medicinal-chemistry's #swbar) carries both a plain note and an offer
   to reload. A note never replaces an offer that is still showing, because the
   offer is the one the student has to act on. */
function bar(text, action, onAction, hideAfter){
  let el = document.getElementById('swbar');
  if(el && el.querySelector('[data-reload]') && !action) return;
  if(el) el.remove();
  el = document.createElement('div');
  el.id = 'swbar'; el.setAttribute('role', 'status');
  const msg = document.createElement('span'); msg.textContent = text; el.appendChild(msg);
  if(action){
    const b = document.createElement('button'); b.type = 'button'; b.textContent = action; b.onclick = onAction;
    b.setAttribute('data-reload', ''); el.appendChild(b);
  }
  const x = document.createElement('button');
  x.type = 'button'; x.className = 'swx'; x.setAttribute('aria-label', 'Dismiss'); x.textContent = '×';
  const hide = () => { el.remove(); document.body.classList.remove('swbar-on'); };
  x.onclick = hide; el.appendChild(x);
  document.body.appendChild(el);
  document.body.classList.add('swbar-on');
  if(hideAfter) setTimeout(hide, hideAfter);
}
/* Reload keeps the place (below) and asks first while a paper is running: the
   paper is saved, but its clock keeps running through the reload. */
function offerReload(text){
  bar(text, 'Reload', () => {
    // a stopped page, or one whose writes the browser refused (storage full): what it has not saved
    // is lost on reload, unless exported (#32's review of 4311133; Louis, 2026-11-05)
    if((STALE || WRITER === 'other' || FAILED.size) && atRiskAll() && !confirm('The answers and settings this page has not saved are lost on reload unless you export them first (the button on the notice). Reload anyway?')) return;
    if(EX && EX.running && !confirm('A paper is running. It is saved and its clock keeps running. Reload now?')) return;
    placeSave();
    LEAVE_ASKED = true;   // asked here already: the browser's leave question is not shown again
    location.reload();
  });
}

/* ---------- offline: the service worker (hosted copy only) ----------
   Registered only on https or on localhost: a service worker needs a secure
   origin, and opened from disk the file is already self-contained. It never
   reloads on its own; a student part-way through an exam paper decides when
   (Medicinal-chemistry, ed38dbd). */
bootStep('the offline copy', function offline(){
  const sw = navigator.serviceWorker;
  const hosted = location.protocol === 'https:' ||
                 location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  // A preview never registers a worker: one at /preview/ would keep a second
  // offline copy of an unreleased version under the live drill's cache names.
  if(!sw || !hosted || BUILD.preview) return;
  const firstTime = !sw.controller;
  // The worker sends this when it served the saved copy because the network
  // was slow, and the network copy then turned out to be newer.
  sw.addEventListener('message', e => {
    if(e.data && e.data.type === 'drill-updated') offerReload('A newer version of the drill is ready.');
  });
  sw.register('./sw.js').then(() => {
    if(!firstTime) return;
    // Fires once the drill is actually saved, not merely requested.
    sw.addEventListener('controllerchange', () => {
      const key = NS + ':offline-ready';
      if(store.get(key) === '1') return;
      store.set(key, '1');
      bar('Saved for offline use: the drill now opens with no connection.', null, null, 7000);
    }, {once: true});
  }).catch(() => {});
});

/* ---------- a newer version is published ----------
   A page left open keeps the copy it loaded. Every 15 minutes, and when the tab
   comes back, it reads version.json beside it (written by build.py) and, when a
   newer build is published, offers a reload (Basic-Pharmacokinetics, src/views.js
   lines 5766-5771). Progress is kept in the browser, so reloading loses nothing.
   Opened from disk there is no version.json to read, so nothing is checked. */
function checkForUpdate(){
  if(!/^https?:$/.test(location.protocol) || !BUILD.built) return;
  if(document.querySelector('#swbar [data-reload]')) return;
  fetch('version.json?t=' + Date.now(), {cache: 'no-store'}).then(r => r.ok ? r.json() : null).then(j => {
    if(!j || !j.built || j.built <= BUILD.built || document.querySelector('#swbar [data-reload]')) return;
    offerReload('A newer version of the drill is published. Your progress is kept.');
  }).catch(() => {});
}
bootStep('the update check', () => {
  setInterval(checkForUpdate, 15 * 60000);
  document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible') checkForUpdate(); });
  setTimeout(checkForUpdate, 5000);
});

/* ---------- keeping the place across a reload ----------
   A reload (Reload for a newer version, the browser's own, or a phone that drops
   a background tab) comes back to the same tab, the same open sections, the same
   question and the same line at the top of the screen (Basic-Pharmacokinetics,
   src/views.js lines 6389-6447). It is kept in sessionStorage, so it belongs to
   this browser tab and goes when the tab is closed. Answers are not part of it:
   an answered question comes back answered, and nothing is recorded twice. */
const PLACE_KEY = NS + ':place', PLACE_MAX = 12 * 3600000;
const SS = {get(k){ try { return sessionStorage.getItem(k); } catch(e){ return null; } },
            set(k, v){ try { sessionStorage.setItem(k, v); } catch(e){} }};
const PLACE_SEL = '[id], h2, h3, h4, summary, p, li, tr, figure, .opt, .subrow';
const placeText = el => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
let PLACE_READY = false, PLACE_T = 0, PLACE_MOVED = false;
// the first element whose top edge is on screen, named by its id or by its text and which copy of that text it is
function placeAnchor(pane){
  for(const el of pane.querySelectorAll(PLACE_SEL)){
    const r = el.getBoundingClientRect(); if(!r.height || r.top < 0) continue;
    if(el.id) return {id: el.id, off: r.top};
    const txt = placeText(el); if(!txt) continue;
    return {tag: el.tagName, txt, n: [...pane.querySelectorAll(el.tagName)].filter(x => placeText(x) === txt).indexOf(el), off: r.top};
  }
  return null;
}
// every fold in a pane with a key that survives a redraw: its summary text and which copy of that text it is
function detKeys(pane){
  const seen = {};
  return [...pane.querySelectorAll('details')].map(d => { const sm = d.querySelector(':scope > summary'), t = sm ? placeText(sm) : '';
    seen[t] = (seen[t] || 0) + 1; return [d, t + '#' + seen[t]]; });
}
// the quiz state as plain data: questions by id, everything else as it is
function quizSnap(){
  const o = {};
  for(const [k, v] of Object.entries(Q)){
    if(v == null || /^(string|number|boolean)$/.test(typeof v)) o[k] = v;
    else if(Array.isArray(v) && v.length && v.every(x => x && typeof x === 'object' && x.id && byId(x.id) === x)) o[k] = {__ids: v.map(x => x.id)};
    else if(Array.isArray(v) && v.every(x => x == null || typeof x !== 'object')) o[k] = v;
    else if(typeof v === 'object' && v.id && byId(v.id) === v) o[k] = {__q: v.id};
  }
  return o;
}
function quizFrom(o){
  const q = {};
  for(const [k, v] of Object.entries(o || {})){
    if(v && v.__ids) q[k] = v.__ids.map(byId).filter(Boolean);
    else if(v && v.__q) q[k] = byId(v.__q);
    else q[k] = v;
  }
  return q.pool && q.pool.length && q.current ? q : null;
}
function placeSave(){
  if(!PLACE_READY || !VIEW) return;
  const pane = document.getElementById('v-' + VIEW); if(!pane) return;
  const pl = {v: VIEW, at: Date.now(), y: window.scrollY, a: placeAnchor(pane), open: detKeys(pane).filter(([d]) => d.open).map(([, k]) => k)};
  // the quiz session belongs to its profile: the profile goes in the record (placeRestore)
  if(VIEW === 'quiz' && Q && Q.current){ pl.quiz = quizSnap(); pl.p = PROFILE; }
  SS.set(PLACE_KEY, JSON.stringify(pl));
}
const placeSoon = () => { clearTimeout(PLACE_T); PLACE_T = setTimeout(placeSave, 400); };
function placeLoad(){
  try {
    const pl = JSON.parse(SS.get(PLACE_KEY) || 'null');
    return pl && document.querySelector(`#nav button[data-v="${pl.v}"]`) && Date.now() - pl.at < PLACE_MAX ? pl : null;
  } catch(e){ return null; }
}
// put the saved line back at the same height on screen; again once images have loaded, unless the reader has moved
function placeScroll(pl){
  const pane = document.getElementById('v-' + pl.v), a = pl.a; let el = null;
  if(a && a.id) el = document.getElementById(a.id);
  else if(a) el = [...pane.querySelectorAll(a.tag)].filter(x => placeText(x) === a.txt)[a.n] || null;
  window.scrollTo(0, el && pane.contains(el) ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - a.off) : pl.y || 0);
}
function placeRestore(pl){
  try {
    // a quiz place is brought back only for the profile it was saved under. The tab's place is per tab
    // (sessionStorage) but the chosen profile is shared by every tab (localStorage): another tab that
    // switched the profile meanwhile makes this reload open another profile, which must not get the
    // question, ticks and label of the one before (the review of #58). A record with no profile was
    // written by a build before this check and is read as before.
    if(pl.v === 'quiz'){ Q = pl.p === undefined || pl.p === PROFILE ? quizFrom(pl.quiz) : null; if(!Q) pl.v = 'topics'; }
    show(pl.v);
    const pane = document.getElementById('v-' + pl.v), open = new Set(pl.open || []);
    detKeys(pane).forEach(([d, k]) => { if(d.open !== open.has(k)) d.open = open.has(k); });
    placeScroll(pl);
    [350, 1200].forEach(ms => setTimeout(() => { if(!PLACE_MOVED && VIEW === pl.v) placeScroll(pl); }, ms));
    return true;
  } catch(e){ console.error('Start-up step skipped: the place before the reload could not be brought back.', e); Q = null; return false; }
}
bootStep('keeping the place across a reload', () => {
  try { history.scrollRestoration = 'manual'; } catch(e){}
  window.addEventListener('scroll', placeSoon, {passive: true});
  document.addEventListener('toggle', placeSoon, true);
  document.addEventListener('click', placeSoon);
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(t => window.addEventListener(t, () => { PLACE_MOVED = true; }, {passive: true, capture: true}));
  // the progress first (saveNow, shell.html), then the place on the page, also if saveNow throws
  const gone = () => { try { saveNow(); } finally { placeSave(); } };
  document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'hidden') gone(); });
  window.addEventListener('pagehide', gone);
  // closing the tab or leaving the page while the browser refused writes and that work is not
  // exported: the browser asks its own "leave this page?" question (its wording, not this page's;
  // Louis, 2026-11-05). Not every browser shows it: see core/README.md.
  window.addEventListener('beforeunload', e => {
    try { if(!LEAVE_ASKED && FAILED.size && atRiskAll()){ e.preventDefault(); e.returnValue = ''; } } catch(err){}
  });
});

/* The Quiz tab's storage warning follows every drawing of the pane, whichever code drew
   it (quizStorageWarn). */
bootStep('the storage warning in the Quiz tab', () => {
  const el = document.getElementById('v-quiz');
  if(!el || typeof MutationObserver === 'undefined') return;
  new MutationObserver(() => { try { quizStorageWarn(); } catch(e){ console.error('The storage warning could not be drawn.', e); } })
    .observe(el, {childList: true});
  quizStorageWarn();
});
/* A running paper comes back first (restoreExam); otherwise the place saved
   before the reload, otherwise Topics. A paper or a place that cannot be
   brought back leaves the next one to open. */
{ let ex = false, pl = null;
  bootStep('bringing back a running exam paper', () => { ex = restoreExam(); });
  bootStep('reading the place saved before the reload', () => { pl = placeLoad(); });
  const shown = ex ? bootStep('the exam page', () => show('exam')) : !!(pl && placeRestore(pl));
  if(!shown) bootStep('the Topics page', () => show('topics'));
  PLACE_READY = true; }
