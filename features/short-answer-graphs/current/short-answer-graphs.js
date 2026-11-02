/* ==========================================================================
   SHORT ANSWER AND GRAPHS (feature module short-answer-graphs v1)
   ==========================================================================
   Ported from Intro-Pharmacology exam1-drill/src/app.js at 929cd62 (lines
   2402-2444, 3716-3778 and 3821-3854): the
   Short answer page (vSa, saState, saSave; the "Short answer" section) and
   the Graphs drill (GR, MISS, MISS2, missOf, graphOf, graphQs, missTally,
   graphFeedback, graphDone, startGraph, vGraphs; the "Graphs: drill one of
   his figures" section). The two are separate pages; each one appears only
   when its data is in the page. What changed for the kit:
   - the data is the course's, in a data file listed in course.js `files`:
     SHORT_ANSWERS (that course's SHORT4 and SHORT3, in the order wanted),
     GRAPHS (its graphs.js), GRAPH_MISS (its MISS table) and, optionally,
     GRAPH_EXAMS {exam number: {intro, noun, other, miss}} (its INTRO lines
     and MISS2, the tracing wording of Exam 2);
   - short answers are self-check, as in that course: write, show the model
     answer, tick the key points covered. Nothing grades the typed text. The
     draft, the ticks and "checked" are kept in the progress as DB.sa (that
     course kept them per browser), so they follow the profile and Export;
   - a figure's questions are drilled as a fixed pass of the core's quiz
     (a sweep with Q.graph set); right, wrong and the skipped-reading tally
     are read from the core's answers (DB.answers: result and picked);
     a "guessed" or "not sure" answer that was marked guessed counts as not
     right;
   - the exam folds are one per exam number that has a figure; a number
     with no exam in COURSE.exams is named "Exam <n>";
   - the professor is named as "the professor", not "he" or "she";
   - left out: that course's tidySpeech clean-up of transcript quotes (the
     quote is shown as written, as the core's quiz shows q.quote), its page
     cache (memoHTML) and its focus-one-exam mode.
   ========================================================================== */
const HAS_SA = typeof SHORT_ANSWERS !== 'undefined' && Array.isArray(SHORT_ANSWERS) && SHORT_ANSWERS.length > 0;
const HAS_GR = typeof GRAPHS !== 'undefined' && Array.isArray(GRAPHS) && GRAPHS.length > 0;
if(!HAS_SA && !HAS_GR) throw new Error('short-answer-graphs needs SHORT_ANSWERS or GRAPHS, in a data file listed in course.js `files`');
const MISS = typeof GRAPH_MISS === 'undefined' ? {} : GRAPH_MISS;
const EXAMS = typeof GRAPH_EXAMS === 'undefined' ? {} : GRAPH_EXAMS;

/* ---------- Short answer ---------- */
const SA_LIST = HAS_SA ? SHORT_ANSWERS : [];
const SA = {i: 0, order: null, shown: false};
const FORM = {her: " · the professor's wording", key: " · the professor's key"};
const saLec = id => { const l = (COURSE.lectures || []).find(x => x.id === id); return l ? l.label : (id || ''); };
const saState = () => (DB.sa && typeof DB.sa === 'object' ? DB.sa : {});
function saSave(id, patch){
  const all = DB.sa = saState();
  all[id] = Object.assign({}, all[id] || {}, patch);
  save();
}
function vSa(pane){
  pane = pane || document.getElementById('v-sa');
  if(!SA.order || SA.order.length !== SA_LIST.length) SA.order = SA_LIST.map((x, k) => k);
  const p = SA_LIST[SA.order[SA.i]], st = saState()[p.id] || {}, ticks = st.ticks || [];
  const done = SA_LIST.filter(x => (saState()[x.id] || {}).checked).length;
  let h = `<h2 id="sa-top">${esc(OPT.saLabel)}</h2><p class="sub">${OPT.saAbout ? esc(OPT.saAbout) + ' ' : ''}Write your answer first, in the length the prompt asks for, then check it against the model answer and tick each key point you covered.</p>
    <div class="row sahead"><b>Prompt ${SA.i + 1} of ${SA_LIST.length}</b><span class="meta">${done} checked</span></div>
    <div class="card sacard"><div class="meta">${esc(saLec(p.lecture))}${FORM[p.form] || ''}</div>
    <p class="stem" tabindex="-1">${esc(p.q)}</p>
    <label class="sub salabel" for="satext">Your answer</label>
    <textarea id="satext" class="satext" rows="5">${esc(st.text || '')}</textarea>
    <div class="row"><button type="button" class="btn" id="sacheck">${SA.shown ? 'Hide the model answer' : 'Check my answer'}</button><button type="button" class="btn ghost" id="saclear">Clear</button></div>`;
  if(SA.shown){
    h += `<div class="teach"><b>Model answer.</b> ${esc(p.model)}</div>
      <fieldset class="sapts"><legend>Key points (tick the ones your answer has)</legend>${p.points.map((t, k) => `<label class="row"><input type="checkbox" data-sapt="${k}" ${ticks.includes(k) ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('')}</fieldset>
      <div class="meta" id="sascore">${ticks.length} of ${p.points.length} key points</div>`;
    if(p.note) h += `<p class="sub sanote">${esc(p.note)}</p>`;
    if(p.quote) h += `<div class="cite"><span class="quote">“${esc(p.quote)}”</span></div>`;
    if(p.cite) h += `<div class="cite">${esc(p.cite)}</div>`;
  }
  h += `</div><div class="row"><button type="button" class="btn ghost" id="saprev" ${SA.i ? '' : 'disabled'}>Previous</button><button type="button" class="btn ghost" id="sanext" ${SA.i < SA_LIST.length - 1 ? '' : 'disabled'}>Next</button><button type="button" class="btn ghost" id="sashuf">Shuffle</button></div>`;
  pane.innerHTML = h;
  const ta = pane.querySelector('#satext');
  ta.oninput = () => saSave(p.id, {text: ta.value});
  pane.querySelector('#sacheck').onclick = () => { SA.shown = !SA.shown; if(SA.shown) saSave(p.id, {checked: !!ta.value.trim(), text: ta.value}); vSa(pane); };
  pane.querySelector('#saclear').onclick = () => { saSave(p.id, {text: '', ticks: [], checked: false}); SA.shown = false; vSa(pane); };
  pane.querySelectorAll('[data-sapt]').forEach(c => c.onchange = () => {
    const t = [...pane.querySelectorAll('[data-sapt]')].filter(x => x.checked).map(x => +x.dataset.sapt);
    saSave(p.id, {ticks: t}); pane.querySelector('#sascore').textContent = `${t.length} of ${p.points.length} key points`;
  });
  const move = d => { SA.i += d; SA.shown = false; vSa(pane); window.scrollTo(0, 0); };
  pane.querySelector('#saprev').onclick = () => move(-1);
  pane.querySelector('#sanext').onclick = () => move(1);
  pane.querySelector('#sashuf').onclick = () => { SA.order = shuffle(SA.order.slice()); SA.i = 0; SA.shown = false; vSa(pane); };
}

/* ---------- Graphs: drill one of the professor's figures ---------- */
const GR = HAS_GR ? GRAPHS : [];
const examNo = g => +(g.exam || 1);
const exOpt = n => EXAMS[n] || {};
const missOf = (g, m) => (g && (exOpt(examNo(g)).miss || {})[m]) || MISS[m] || [m, ''];
const noun = g => exOpt(examNo(g)).noun || 'figure';
const graphOf = img => GR.find(g => g.key === img || (g.alts || []).includes(img));
let GQ = null;   // image key -> questions, built once
const graphQs = g => {
  if(!GQ){ GQ = {}; QUESTIONS.forEach(q => { if(q.img) (GQ[q.img] = GQ[q.img] || []).push(q); }); }
  return [g.key].concat(g.alts || []).flatMap(k => GQ[k] || []);
};
const answers = () => (DB && Array.isArray(DB.answers) ? DB.answers : []);
/* the result of each question's latest answer */
function lastMap(){
  const last = {};
  answers().forEach(e => { last[e.qid] = e.result === 'correct'; });
  return last;
}
const lastOutcome = (q, last) => !(q.id in last) ? 'unseen' : last[q.id] ? 'right' : 'wrong';
const isPick = q => !q.type;          // a picked-option question (the core's mc and select-all)
/* What the student skipped on this figure: the miss tags of the wrong options they chose, across the answers kept. */
function missTally(g){
  const ids = {}; graphQs(g).forEach(q => ids[q.id] = q);
  const t = {};
  answers().forEach(e => {
    const q = ids[e.qid]; if(!q || e.result === 'correct' || !isPick(q)) return;
    [].concat(e.picked == null ? [] : e.picked).forEach(i => { const o = q.options[i]; if(o && !o.correct && o.miss) t[o.miss] = (t[o.miss] || 0) + 1; });
  });
  return Object.entries(t).sort((a, b) => b[1] - a[1]);
}
/* st: {ok, picked}, as the quiz card leaves it */
function graphFeedback(q, st){
  const g = q.img && graphOf(q.img); if(!g) return '';
  let h = '';
  if(!st.ok && isPick(q)){
    const picked = [].concat(st.picked == null ? [] : st.picked);
    const misses = [...new Set(picked.map(i => q.options[i]).filter(o => o && !o.correct && o.miss).map(o => o.miss))];
    if(misses.length) h += `<div class="gskip"><b>The question you skipped:</b> ${misses.map(m => { const d = missOf(g, m); return `<span class="chip on">${esc(d[0])}</span> ${esc(d[1])}`; }).join('<br>')}</div>`;
  }
  h += `<details class="gread"${st.ok ? '' : ' open'}><summary>Read this ${noun(g)} the professor's way</summary><ul>${(g.read || []).map(r => `<li>${esc(r)}</li>`).join('')}</ul>${g.method ? `<div class="meta">${esc(g.method)}</div>` : ''}</details>`;
  return h;
}
function startGraph(key, onlyWrong){
  const g = GR.find(x => x.key === key); if(!g) return;
  let list = graphQs(g);
  if(onlyWrong){ const last = lastMap(); list = list.filter(q => lastOutcome(q, last) === 'wrong'); }
  if(!list.length){ alert('No questions on this figure yet.'); return; }
  Q = {pool: list, label: g.title + (onlyWrong ? ' · wrong' : ''), sweep: shuffle(list.map(q => q.id)), i: 0,
       current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false,
       graph: key, graphAt: Date.now()};
  nextQuestion();
  show('quiz');
}
function graphDone(pane){
  const g = GR.find(x => x.key === Q.graph); if(!g) return;
  const ids = new Set(Q.sweep), mine = answers().filter(e => e.at >= Q.graphAt && ids.has(e.qid));
  const right = mine.filter(e => e.result === 'correct').length;
  const tally = missTally(g);
  pane.innerHTML = `<div class="card gdone"><h2>${esc(g.title)}: pass finished</h2><p>${right} of ${mine.length} correct.</p>
    ${tally.length ? `<p><b>What you keep skipping on this figure</b></p><ul>${tally.map(([m, n]) => { const d = missOf(g, m); return `<li><b>${esc(d[0])}</b> (${n}×): ${esc(d[1])}</li>`; }).join('')}</ul>` : '<p>No reading question was skipped on this pass.</p>'}
    <div class="row"><button type="button" class="btn" id="gagain">Drill this figure again</button><button type="button" class="btn ghost" id="gback">All figures</button></div></div>`;
  pane.querySelector('#gagain').onclick = () => startGraph(g.key);
  pane.querySelector('#gback').onclick = () => show('graphs');
}
const examName = n => { const e = (COURSE.exams || [])[n - 1]; return e && e.name ? e.name : 'Exam ' + n; };
const activeNo = () => Math.max(1, (COURSE.exams || []).findIndex(e => e.id === COURSE.activeExam) + 1);
function vGraphs(pane){
  pane = pane || document.getElementById('v-graphs');
  const last = lastMap();
  let h = `<h2>${esc(OPT.graphsLabel)}</h2><p class="sub">The professor's own figures. Pick one and every question written on it is asked in turn; a wrong answer names the reading question you skipped, and the end of the pass shows which one you keep skipping.</p>`;
  const nums = [...new Set(GR.map(examNo))].sort((a, b) => a - b);
  nums.forEach(n => {
    const groups = {};
    GR.filter(g => examNo(g) === n).forEach(g => (groups[g.group || 'Other'] = groups[g.group || 'Other'] || []).push(g));
    let b = exOpt(n).intro ? `<p class="sub">${esc(exOpt(n).intro)}</p>` : '';
    Object.entries(groups).forEach(([name, gs]) => {
      b += `<h3>${esc(name === 'Other' && exOpt(n).other ? exOpt(n).other : name)}</h3><div class="ggrid">`;
      gs.forEach(g => {
        const qs = graphQs(g), c = {unseen: 0, right: 0, wrong: 0}; qs.forEach(q => c[lastOutcome(q, last)]++);
        const tally = missTally(g).slice(0, 3);
        b += `<div class="card gcard" data-gkey="${esc(g.key)}"><div class="gthumb">${IMAGES[g.key] ? `<img src="${IMAGES[g.key]}" alt="${esc(g.title)}">` : ''}</div>
          <div><b>${esc(g.title)}</b><div class="meta">${qs.length} questions · ${c.unseen} unseen · ${c.right} right · ${c.wrong} wrong${g.source ? ' · ' + esc(g.source) : ''}</div>
          ${g.asks && g.asks.length ? `<div class="meta">The professor asks: ${g.asks.map(esc).join(' · ')}</div>` : ''}
          ${tally.length ? `<div class="meta gyouskip">You skip: ${tally.map(([m, k]) => esc(missOf(g, m)[0]) + ' ×' + k).join(', ')}</div>` : ''}
          <div class="row"><button type="button" class="btn" data-g="${esc(g.key)}" ${qs.length ? '' : 'disabled'}>Drill this figure</button>
          ${c.wrong ? `<button type="button" class="btn ghost" data-g="${esc(g.key)}" data-wrong="1">Redo wrong</button>` : ''}</div></div></div>`;
      });
      b += '</div>';
    });
    h += nums.length > 1 ? `<details class="gexam" data-ex="${n}" ${n === activeNo() ? 'open' : ''}><summary>${esc(examName(n))}</summary><div>${b}</div></details>` : b;
  });
  pane.innerHTML = h;
  pane.querySelectorAll('[data-g]').forEach(b => b.onclick = () => startGraph(b.dataset.g, !!b.dataset.wrong));
}
/* on the quiz card: the figure's reading after an answer, and the pass's end */
function quizPane(pane){
  if(typeof Q === 'undefined' || !Q) return;
  if(!Q.current){ if(Q.graph && Q.sweep) graphDone(pane); return; }
  const q = Q.current, g = q.img && graphOf(q.img); if(!g) return;
  const img = pane.querySelector('img.qimg');
  if(img && q.imgAlt) img.alt = q.imgAlt;
  if(!Q.revealed || pane.querySelector('.gread')) return;
  const ok = isPick(q) ? (isMulti(q) ? gradeMulti(q, Q.picked || []) : !!(q.options[Q.picked] || {}).correct) : !!Q.lastRight;
  const html = graphFeedback(q, {ok, picked: Q.picked});
  const verdict = pane.querySelector('.why .verdict'), body = pane.querySelector('.qbody');
  if(verdict) verdict.insertAdjacentHTML('afterend', html); else if(body) body.insertAdjacentHTML('beforeend', html);
}

if(HAS_SA) X.tab({id: 'sa', label: OPT.saLabel, before: OPT.before, render: pane => vSa(pane)});
if(HAS_GR){
  X.tab({id: 'graphs', label: OPT.graphsLabel, before: OPT.before, render: pane => vGraphs(pane)});
  X.rendered((pane, view) => { if(view === 'quiz') quizPane(pane); });
}
X.api({SA_LIST, GR, saState, graphOf, graphQs, missOf, missTally, graphFeedback, startGraph, lastMap, lastOutcome,
       state: () => ({SA, Q: typeof Q === 'undefined' ? null : Q})});
