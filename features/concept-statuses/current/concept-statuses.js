/* ==========================================================================
   CONCEPT STATUSES: a Concepts section on Weak spots
   ==========================================================================
   Ported from Basic-Pharmacokinetics src/views.js lines 2506-2725 (ac2eb73).

   What the core already shows about a concept (core/views.js, shell.html):
   the scheduler's box per concept (DB.concepts), "N of M concepts mastered"
   (box >= MASTER_BOX) on Weak spots and per topic on Topics, per exam pool
   "not yet seen / missed or guessed, still open (box 0) / mastered", and on
   each missed question "now mastered" or "still in review". It names no
   status beyond mastered or not, and gives no evidence for it.

   This module adds, read from the answer log (DB.answers) on every draw of
   Weak spots, so an answer changed afterwards ("I guessed that one", "Not
   sure", "No, I was right") is read as it now stands:
     unfamiliar  seen once, missed once
     struggling  2 or more misses, or under 60% on the last 5 with 2 or more attempts
     improving   missed before, last 2 solid, not mastered
     mastered    3 or more solid answers on 2 or more different questions in 2 or
                 more sessions, no miss in the last 3 (one right answer never masters)
     returning   was mastered, then missed
     learning    right so far, or one slip after solid answers: not weak, not mastered
   A miss is any answer that is not solid in the core's own sense (solidEntry:
   a correct answer not marked "Not sure"), so a guess and a "Not sure" are
   misses. A session is a run of answers with no gap of SESSION_GAP (30 min).
   Each card gives the status, the exact counts behind it, the wrong option
   chosen most often with its why, the most common kind of miss on missed
   calculations, and a button that drills the concept.

   A mastered concept is given a spaced check, computed here and never
   written: box MASTER_BOX at mastery, one box up per further solid answer,
   due at the pace in Settings (its question steps on the cram pace, its day
   steps otherwise) after the last solid answer. It is listed as due once that
   check and the scheduler's own record for the concept (DB.concepts) are both
   due. The module reads the core's state and never changes it: the scheduler
   picks questions exactly as it does without the module.
   ========================================================================== */
const RECENT_N = 5, DAY = 86400000;
const WORDS = OPT.words || {};
const solid = a => solidEntry(a);
const shaky = a => a.result === 'correct' && a.conf === 'shaky';

/* The log grouped by concept, in time order, each answer with its question
   and its session index. An answer whose question is no longer in the bank is
   left out. */
function conceptLog(answers){
  const g = {};
  let sid = 0, prev = null;
  for(const a of (answers || DB.answers).slice().sort((x, y) => x.at - y.at)){
    if(prev != null && a.at - prev >= SESSION_GAP) sid++;
    prev = a.at;
    const q = byId(a.qid); if(!q) continue;
    (g[q.concept] = g[q.concept] || []).push(Object.assign({}, a, {sid, q}));
  }
  return g;
}
const masteredBy = list => { const sol = list.filter(solid);
  return sol.length >= 3 && new Set(sol.map(a => a.qid)).size >= 2 && new Set(sol.map(a => a.sid)).size >= 2 && list.slice(-3).every(solid); };
/* the steps the core's schedule() uses for a box: questions on the cram pace,
   days on the pace in Settings (semester's days while on cram) */
function paceSteps(){
  const P = PACES[pace()];
  return {q: PACES.cram.steps, d: cram() ? PACES.semester.steps : P.steps};
}
/* One concept's status from its answers (conceptLog order), with the spaced
   check of a mastered concept in the scheduler's field names (box, dueAt,
   dueQ) so the core's isDue reads it. r = 1 once it has been mastered and
   then missed. */
function conceptRecord(list){
  const S = paceSteps(), top = S.q.length - 1;
  let was = false, r = 0, box = 0, dueAt = 0, dueQ = 0;
  const due = a => { dueAt = a.at + S.d[box] * DAY; dueQ = (a.qn || 0) + S.q[box]; };
  list.forEach((a, i) => {
    if(was){
      if(solid(a)){ box = Math.min(top, box + 1); due(a); }
      else { was = false; r = 1; }
    }else if(masteredBy(list.slice(0, i + 1))){ was = true; box = MASTER_BOX; due(a); }
  });
  const n = list.length, misses = list.filter(a => !solid(a)).length, recent = list.slice(-RECENT_N);
  const accR = recent.length ? recent.filter(solid).length / recent.length : 1;
  let s;
  if(was) s = 'mastered';
  else if(!misses) s = 'learning';
  else if(n >= 2 && list.slice(-2).every(solid)) s = 'improving';
  else if(r) s = 'returning';
  else if(misses >= 2 || (recent.length >= 2 && accR < 0.6)) s = 'struggling';
  else if(n === 1) s = 'unfamiliar';
  else s = 'learning';   // one slip after two or more solid answers: not weak on this evidence
  return {s, r, box, dueAt, dueQ};
}
/* _isDue is the core's due test without "Ask everything" (which makes isDue
   always true and would list every mastered concept as due). */
const conceptDue = (c, rec) => rec.s === 'mastered' && _isDue(rec) && (!DB.concepts[c] || _isDue(DB.concepts[c]));
function checkWhen(c, rec){
  const s2 = DB.concepts[c] || {};
  if(cram()){ const n = Math.max(rec.dueQ, s2.dueQ || 0) - DB.qn; return n <= 0 ? 'due now' : `due after ${n} more question${n === 1 ? '' : 's'}`; }
  const d = Math.ceil((Math.max(rec.dueAt, s2.dueAt || 0) - Date.now()) / DAY);
  return d <= 0 ? 'due now' : `due in ${d} day${d === 1 ? '' : 's'}`;
}
/* The wrong choices in one wrong answer, keyed so repeats can be counted.
   `picked` is an option index or an array of them, the string typed (numeric:
   no option) or, for matching, the array of the right-hand item picked for
   each left-hand one. A question of a module's own type is left out. */
function wrongPicks(q, a){
  const p = a.picked;
  if(a.result !== 'wrong' || p === undefined || p === null || q.termId) return [];
  if(q.type === 'numeric') return [];
  if(q.type === 'match'){
    if(!Array.isArray(p) || !Array.isArray(q.pairs)) return [];
    return p.map((r, k) => (r !== null && r !== undefined && r !== k && q.pairs[k] && q.pairs[r])
      ? {k: q.id + ':' + k + '>' + r, t: `${q.pairs[k].l} → ${q.pairs[r].r}`, why: `${q.pairs[k].l} goes with ${q.pairs[k].r}.${q.pairs[k].why ? ' ' + q.pairs[k].why : ''}`}
      : null).filter(Boolean);
  }
  if(q.type || !Array.isArray(q.options)) return [];
  return [].concat(p).filter(i => q.options[i] && !q.options[i].correct)
    .map(i => ({k: q.id + ':' + i, t: q.options[i].t, why: q.options[i].why || ''}));
}
/* Everything a card states, counted from the concept's answers. */
function conceptStats(list){
  const recent = list.slice(-RECENT_N), sol = list.filter(solid), miss = list.filter(a => !solid(a));
  const picks = {};
  for(const a of list) for(const w of wrongPicks(a.q, a)){ const P = picks[w.k] = picks[w.k] || Object.assign({n: 0, at: 0}, w); P.n++; P.at = Math.max(P.at, a.at); }
  const errs = Object.values(picks).sort((x, y) => y.n - x.n || y.at - x.at);
  const kinds = {};
  for(const a of miss) if(a.miss && MISS_KINDS[a.miss]) kinds[a.miss] = (kinds[a.miss] || 0) + 1;
  const topKind = Object.entries(kinds).sort((x, y) => y[1] - x[1])[0];
  return {n: list.length, misses: miss.length, guessed: list.filter(a => a.result === 'guessed').length, shaky: list.filter(shaky).length,
    recentN: recent.length, recentPct: recent.length ? Math.round(100 * recent.filter(solid).length / recent.length) : 0,
    sessions: new Set(list.map(a => a.sid)).size, solidN: sol.length, solidQs: new Set(sol.map(a => a.qid)).size,
    solidSess: new Set(sol.map(a => a.sid)).size, errs, recurring: errs.filter(x => x.n > 1),
    numMiss: miss.filter(a => a.q.type === 'numeric').length, topKind: topKind ? {id: topKind[0], n: topKind[1]} : null,
    lastMiss: miss.length ? miss[miss.length - 1].at : 0, q: (miss.length ? miss[miss.length - 1] : list[list.length - 1]).q};
}
const STATUS_WORD = {unfamiliar: 'Unfamiliar', struggling: 'Struggling', improving: 'Improving', mastered: 'Mastered', returning: 'Returning', learning: 'Learning'};
const nMiss = n => n === 1 ? '1 miss' : `${n} misses`;
const nOf = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
/* which of the misses were correct answers marked as a guess or "Not sure" */
function marked(st){
  const p = [];
  if(st.guessed) p.push(`${st.guessed} of them a correct answer marked as a guess`);
  if(st.shaky) p.push(`${st.shaky} of them a correct answer marked "Not sure"`);
  return p.length ? ` (${p.join('; ')})` : '';
}
/* The evidence line under a concept's status, in exact counts. */
function statusLine(c, rec, st){
  const last = `last ${st.recentN} at ${st.recentPct}%`;
  switch(rec.s){
    case 'unfamiliar': return 'seen once, missed once' + (st.guessed ? ' (a correct answer marked as a guess)' : st.shaky ? ' (a correct answer marked "Not sure")' : '');
    case 'struggling': return `${nMiss(st.misses)} in ${nOf(st.n, 'attempt')}, ${last}${marked(st)}`;
    case 'returning':  return `was mastered, then missed: ${nMiss(st.misses)} in ${nOf(st.n, 'attempt')}, ${last}${marked(st)}`;
    case 'improving':  return `${nMiss(st.misses)} in ${nOf(st.n, 'attempt')}, last 2 correct`;
    case 'mastered':   return `${st.solidN} correct on ${nOf(st.solidQs, 'question')} across ${nOf(st.solidSess, 'session')}, no miss in the last 3; spaced check ${checkWhen(c, rec)}`;
    default:           return `${st.solidN} correct, ${nMiss(st.misses)}; not yet mastered`;
  }
}
/* A concept's name: the concept id read as words, each word looked up in the
   course's `words` option (vd -> VD), the first letter a capital. */
function conceptTitle(c){
  const w = String(c).split('-').map(t => Object.prototype.hasOwnProperty.call(WORDS, t.toLowerCase()) ? WORDS[t.toLowerCase()] : t).join(' ');
  return w.charAt(0).toUpperCase() + w.slice(1);
}
/* Where it sits: topic and subtopic of its first question. */
function conceptWhere(c){
  const q = conceptQs(c)[0]; if(!q) return '';
  const t = TOPICS.find(x => x.id === q.topic), sb = t && (t.subs || []).find(x => x.id === q.sub);
  return t ? (sb ? `${t.name} — ${sb.name}` : t.name) : '';
}
/* Questions for a concept drill: wordings never answered first, then the one
   answered longest ago. */
function conceptPick(c, n){
  const lastAt = {};
  for(const a of DB.answers) lastAt[a.qid] = a.at;
  return shuffle(conceptQs(c).slice()).sort((x, y) => (lastAt[x.id] || 0) - (lastAt[y.id] || 0)).slice(0, n);
}
/* Every concept answered, with its record and counts, sorted into the groups
   the section shows. Struggling and returning first, by misses x how recent
   the last miss is x what one question in its pool is worth. */
function conceptGroups(){
  const G = conceptLog(), now = Date.now();
  const cs = Object.keys(G).map(c => ({c, rec: conceptRecord(G[c]), st: conceptStats(G[c])}));
  const weight = x => x.st.misses / (1 + (now - x.st.lastMiss) / DAY) * (1 + markWeight(x.st.q));
  const byMiss = (x, y) => y.st.lastMiss - x.st.lastMiss;
  const of = s => cs.filter(x => s.includes(x.rec.s));
  const strug = of(['struggling', 'returning']).sort((x, y) => weight(y) - weight(x));
  const unfam = of(['unfamiliar']).sort(byMiss), impr = of(['improving']).sort(byMiss);
  const mastered = of(['mastered']);
  return {all: cs, strug, unfam, impr, weak: strug.concat(unfam, impr), mastered, learning: of(['learning']),
          due: mastered.filter(x => conceptDue(x.c, x.rec))};
}
const clip = (t, n) => t.length > n ? t.slice(0, n - 1) + '…' : t;
function conceptCard(x){
  const {c, rec, st} = x;
  let h = `<div class="ccard s-${rec.s}"><div class="chead"><b>${esc(conceptTitle(c))}</b><span class="cstat s-${rec.s}">${STATUS_WORD[rec.s]}</span></div>`;
  const where = conceptWhere(c);
  if(where) h += `<div class="cwhere">${esc(where)}</div>`;
  h += `<div class="cwhy">${esc(STATUS_WORD[rec.s])}: ${esc(statusLine(c, rec, st))}</div>`;
  const errs = st.recurring.length ? st.recurring : st.errs.slice(0, 1);
  for(const e of errs) h += `<div class="cpw"><b>${e.n > 1 ? `You chose this ${e.n} times:` : 'You chose:'}</b> ${esc(e.t)}${
    e.why ? `<span class="cpwhy">Why it is not the answer: ${esc(clip(e.why, 400))}</span>` : ''}</div>`;
  if(st.numMiss) h += `<div class="cpw">${st.topKind
    ? `<b>Most common kind of miss:</b> ${esc(MISS_KINDS[st.topKind.id])} (${st.topKind.n} of ${nOf(st.numMiss, 'missed calculation')})`
    : `<b>Kind of miss:</b> not yet named on ${st.numMiss === 1 ? 'the missed calculation' : `the ${st.numMiss} missed calculations`}`}</div>`;
  if(!errs.length && !st.numMiss && (st.guessed || st.shaky)) h += `<div class="cpw"><b>Correct, but marked as a guess or "Not sure"${st.guessed + st.shaky > 1 ? ` ${st.guessed + st.shaky} times` : ''}.</b></div>`;
  h += `<div class="cbtns"><button class="btn small" data-cpractice="${esc(c)}">Practice this concept</button></div></div>`;
  return h;
}
const conceptRow = x => `<div class="crow"><span><b>${esc(conceptTitle(x.c))}</b><small>${esc(statusLine(x.c, x.rec, x.st))}</small></span>
  <button class="btn small ghost" data-ccheck="${esc(x.c)}">Check</button></div>`;
function conceptSection(g){
  if(!g.all.length) return '';
  let h = `<h3>Concepts</h3>
  <p class="sub">Each status counts every wording of the concept. A miss is a wrong answer, or a correct one marked as a guess or "Not sure". ${
    [[g.strug, 'struggling or returning'], [g.unfam, 'unfamiliar'], [g.impr, 'improving'], [g.learning, 'learning'], [g.mastered, 'mastered']]
      .filter(([l]) => l.length).map(([l, w]) => `${l.length} ${w}`).join(' · ')}.</p>
  <details class="clegend"><summary>What each status means</summary><ul>
    <li><b>Unfamiliar:</b> seen once, missed once.</li>
    <li><b>Struggling:</b> 2 or more misses, or under 60% on the last 5 with 2 or more attempts.</li>
    <li><b>Improving:</b> missed before, the last 2 correct, not yet mastered.</li>
    <li><b>Mastered:</b> 3 or more correct answers on 2 or more different questions in 2 or more sessions, no miss in the last 3. One correct answer never masters.</li>
    <li><b>Returning:</b> was mastered, then missed.</li>
    <li><b>Learning:</b> correct so far, or one miss after correct answers; not weak, not yet mastered.</li>
    <li>A session ends after 30 minutes with no answer. A mastered concept is listed under "Due for spaced review" once the interval of the review pace in Settings has passed since its last correct answer and the scheduler also has it due.</li>
    <li>These statuses are read from your answers. The count of concepts mastered at the top of this page is the scheduler's own count (a concept at review step ${MASTER_BOX} or higher), so the two can differ.</li></ul></details>`;
  if(g.due.length) h += `<h4>Due for spaced review (${g.due.length})</h4><div class="panel">${g.due.map(conceptRow).join('')}
    <div class="cbtns"><button class="btn small" id="cdueAll">${g.due.length === 1 ? 'Run the check' : `Run the ${g.due.length} checks, one question each`}</button></div></div>`;
  if(g.weak.length){
    const shown = g.weak.slice(0, 8), rest = g.weak.slice(8);
    h += shown.map(conceptCard).join('');
    if(rest.length) h += `<details class="cmore"><summary>${nOf(rest.length, 'more weak concept')}</summary>${rest.map(conceptCard).join('')}</details>`;
  }else h += `<div class="empty">No concept is weak on the answers so far.</div>`;
  if(g.mastered.length) h += `<details class="cmore"><summary>Mastered (${g.mastered.length})</summary><div class="panel">${g.mastered.map(conceptRow).join('')}</div></details>`;
  return h;
}
function wireConcepts(el, g){
  el.querySelectorAll('[data-cpractice]').forEach(b => b.onclick = () => {
    const c = b.dataset.cpractice; drillList(conceptPick(c, 3), 'Concept: ' + conceptTitle(c)); });
  el.querySelectorAll('[data-ccheck]').forEach(b => b.onclick = () => {
    const c = b.dataset.ccheck; drillList(conceptPick(c, 1), 'Spaced review: ' + conceptTitle(c)); });
  const all = el.querySelector('#cdueAll');
  if(all) all.onclick = () => drillList(g.due.flatMap(x => conceptPick(x.c, 1)), 'Spaced review');
}

/* Weak spots: the section goes after "This session" and before "What to
   review next", where Basic-Pharmacokinetics put it; at the end of the pane
   if that heading is not there. Drawn once per draw of the pane. */
X.rendered((pane, view) => {
  if(view !== 'gaps' || pane.querySelector('#cstatuses') || !DB.answers.length) return;
  const g = conceptGroups(), html = conceptSection(g);
  if(!html) return;
  const box = document.createElement('div');
  box.id = 'cstatuses'; box.innerHTML = html;
  const at = [...pane.querySelectorAll('h3')].find(h => /^What to review next/.test(h.textContent));
  if(at) at.parentNode.insertBefore(box, at); else pane.appendChild(box);
  wireConcepts(box, g);
});

X.api({conceptLog, conceptRecord, conceptStats, conceptDue, conceptTitle, conceptGroups, statusLine, wrongPicks, conceptPick});
