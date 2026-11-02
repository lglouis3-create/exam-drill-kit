/* ==========================================================================
   STUDY CONTROLS (feature module study-controls v1)
   ==========================================================================
   Ported from Intro-Pharmacology- exam1-drill/src/app.js at 929cd62. Four
   controls, each switched on by its own option (module.json); they share the
   delegated click handler, the layout state and the card drawing, so they are
   one module:

   flags (isFlagged, toggleFlag, flagBtn, flaggedPool, lines 145-149; the
     delegated handler, 576-588; the Topics row, 722-723 and 777-778): a Flag
     button on every quiz card, on the exam question and on every card of the
     exam result. The set is kept in the progress as DB.flags {id: when}, so it
     follows the profile, Export and Import. Topics shows the count, "Drill
     flagged" (every flagged question once, shuffled) and "Clear flags". A
     paper's flagged questions are listed by number on its question bar, as
     links (the course's question grid marks them; the kit's paper has no grid).
   layout (layoutToggle, line 151; renderAll and its card handlers, 994-1080;
     renderExamAll, 1663-1689): chips "One at a time" / "All on one page" on
     Topics, on the quiz and on the exam. All on one page draws every multiple-
     choice and select-all question of the quiz, 40 at a time, each graded and
     recorded when it is answered; or every question of the exam paper, with
     the clock and Submit on a bar that stays in view. The choice is kept as
     DB.layout. Calculation and matching questions stay one at a time.
   keys (the keydown handler, lines 3936-3961): A-J or 1-9 pick an option,
     Enter checks or continues, after a right answer 1 = Knew it, 2 = Not sure,
     3 = I guessed; on the exam paper Enter or the right arrow moves to the next
     question and the left arrow to the previous one. Typing in a field is never
     a shortcut, and Enter or Space on a focused button keeps its own meaning.
   strict (the noBack paper: vExam line 1616 and 1633, renderExam 1690-1714,
     exLeaveOk 1716): a box on the exam start page. A paper started with it
     ticked is one question at a time with no going back: no Back button, no
     flags, no one-page layout, and moving on from a blank question asks first.
     The box is offered only when the course sets `strict: true`.

   What the course had that the kit core already has: the exam clock, Back and
   Next on the paper, Submit with a count of the blank items, and the answer's
   record and confidence (the core's record, markShaky, markGuessed, markSure).
   Those are the core's own; this module calls them.

   Other modules read the flags with FX.api('study-controls'): isFlagged(id),
   flagged() (ids, oldest flag first), set(id, on), toggle(id), button(id)
   (the button's HTML; the click is handled here), onChange(fn(id, on)).
   ========================================================================== */
const FLAGS = OPT.flags !== false, LAYOUT = OPT.layout !== false, KEYS = OPT.keys !== false, STRICT = OPT.strict === true;
const STRICT_NOTE = typeof OPT.strictNote === 'string' ? OPT.strictNote.trim() : '';

/* ---- flags --------------------------------------------------------------- */
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
// read without writing: a progress gains `flags` only when a question is first flagged
const flagsNow = () => DB && isObj(DB.flags) ? DB.flags : {};
const flagMap = () => isObj(DB.flags) ? DB.flags : (DB.flags = {});
const isFlagged = id => !!flagsNow()[id];
const flaggedIds = () => { const m = flagsNow(); return Object.keys(m).filter(id => byId(id)).sort((a, b) => m[a] - m[b]); };
const listeners = [];
function setFlag(id, on){
  if(!FLAGS || !byId(id)) return false;
  if(on){ const m = flagMap(); m[id] = m[id] || Date.now(); save(); }
  else if(isFlagged(id)){ delete DB.flags[id]; save(); }
  flagChanged(id);
  return true;
}
const toggleFlag = id => setFlag(id, !isFlagged(id));
const flagLabel = id => '⚑ ' + (isFlagged(id) ? 'Flagged' : 'Flag');
const flagBtn = id => FLAGS ? `<button type="button" class="btn ghost scflag${isFlagged(id) ? ' on' : ''}" data-scflag="${esc(id)}" aria-pressed="${isFlagged(id)}" title="Flag this question to come back to it">${flagLabel(id)}</button>` : '';
/* id null: every button (Clear flags) */
function flagChanged(id){
  // only the buttons for this id change; a full redraw would reset a card being answered
  document.querySelectorAll('[data-scflag]').forEach(b => {
    const bid = b.dataset.scflag;
    if(id !== null && bid !== id) return;
    b.classList.toggle('on', isFlagged(bid)); b.setAttribute('aria-pressed', isFlagged(bid)); b.textContent = flagLabel(bid);
  });
  refreshPaperFlags();
  const row = document.getElementById('scRow'); if(row) row.outerHTML = topicsRow();
  listeners.forEach(f => { try { f(id, id === null ? false : isFlagged(id)); } catch(e){ console.error('study-controls onChange:', e); } });
}
function drillFlagged(){
  const pool = flaggedIds().map(byId);
  if(pool.length) drillList(pool, 'Flagged questions');
}

/* ---- layout -------------------------------------------------------------- */
const layout = () => LAYOUT && DB && DB.layout === 'all' ? 'all' : 'one';
const layoutChips = () => LAYOUT ? `<span class="sclayout">${[['one', 'One at a time'], ['all', 'All on one page']].map(([k, l]) =>
  `<button type="button" class="chip" data-sclayout="${k}" aria-pressed="${layout() === k}">${l}</button>`).join('')}</span>` : '';
function setLayout(k){
  DB.layout = k === 'all' ? 'all' : 'one'; save();
  document.querySelectorAll('[data-sclayout]').forEach(b => b.setAttribute('aria-pressed', b.dataset.sclayout === layout()));
  if(VIEW === 'quiz' && Q){ if(layout() === 'one') backToOne(); else renderQuiz(); }
  else if(VIEW === 'exam' && EX && EX.running && !strictPaper()) renderExamQ();
}

/* ---- the Topics row ------------------------------------------------------ */
function topicsRow(){
  const n = FLAGS ? flaggedIds().length : 0;
  return `<div class="scrow" id="scRow">${LAYOUT ? `<span class="scpart"><span class="meta">Answer:</span>${layoutChips()}</span>` : ''}${FLAGS ? `<span class="scpart"><span class="meta">⚑ Flagged: <b id="scFlagN">${n}</b></span>${n
    ? '<button type="button" class="btn ghost scsmall" id="scDrillFlag">Drill flagged</button><button type="button" class="btn ghost scsmall" id="scClearFlag">Clear flags</button>' : ''}</span>` : ''}</div>`;
}
function onTopics(pane){
  if(!(FLAGS || LAYOUT) || pane.querySelector('#scRow')) return;
  const at = pane.querySelector('.sweepcard');
  if(at) at.insertAdjacentHTML('beforebegin', topicsRow()); else pane.insertAdjacentHTML('afterbegin', topicsRow());
}

/* ---- the quiz, one at a time --------------------------------------------- */
const QUIZ_KEYS = 'Keys: A–J or 1–9 pick an option · Enter checks or continues · after a right answer 1 = Knew it, 2 = Not sure, 3 = I guessed';
function onQuiz(pane){
  if(typeof Q === 'undefined' || !Q) return;
  if(layout() === 'all'){
    if(pane.querySelector('.scall')) return;
    if(allTake(pane)) return;
  }
  const card = pane.querySelector(':scope > .qcard');
  if(!card || !Q.current) return;
  if(LAYOUT && !pane.querySelector(':scope > .scbar')) card.insertAdjacentHTML('beforebegin', `<div class="scbar">${layoutChips()}</div>`);
  const head = card.querySelector('.qhead');
  if(FLAGS && head && !head.querySelector('[data-scflag]')) head.insertAdjacentHTML('beforeend', flagBtn(Q.current.id));
  if(KEYS && !pane.querySelector('.sckbd')) card.insertAdjacentHTML('afterend', `<p class="meta sckbd">${QUIZ_KEYS}</p>`);
}

/* ---- the quiz, all on one page -------------------------------------------- */
let ALL = null, INALL = false;
function allState(){
  if(ALL && ALL.q === Q) return ALL;
  let ids;
  if(Q.sweep){
    // Q.i is past the question on screen; that one belongs in the list unless it was answered
    const from = Q.current && !Q.revealed ? Q.i - 1 : Q.i;
    ids = Q.sweep.slice(Math.max(0, from));
  }else{
    // an adaptive set: due concepts first, then never shown, then the rest
    const due = [], unseen = [], rest = [];
    (Q.pool || []).forEach(q => { const s = DB.concepts[q.concept];
      if(Q.current && q.id === Q.current.id && !Q.revealed) return;
      if(!askedBefore(q)) unseen.push(q.id); else if(s && isDue(s)) due.push(q.id); else rest.push(q.id); });
    ids = (Q.current && !Q.revealed ? [Q.current.id] : []).concat(shuffle(due), shuffle(unseen), shuffle(rest));
  }
  const qs = [...new Set(ids)].map(byId).filter(Boolean);
  ALL = {q: Q, list: qs.filter(q => !q.type).map(q => q.id), typed: qs.filter(q => q.type).length, n: 40, st: {}, oneDone: new Set(), lastId: null};
  return ALL;
}
function cardState(q){
  const A = ALL;
  return A.st[q.id] || (A.st[q.id] = {order: shuffle(q.options.map((o, i) => i)), picked: isMulti(q) ? [] : null,
    answered: false, ok: null, conf: null, qn: -1, sure: false, t0: Date.now()});
}
const box = (multi, chosen, n) => multi ? (chosen ? '☑' : '☐') : LETTERS[n];
function allCard(q, k){
  const s = cardState(q), multi = isMulti(q), id = esc(q.id);
  let h = `<div class="qcard scq" data-scq="${id}"><div class="qhead">${profTag(q.prof)}<span>${k + 1}.</span>${qLabel(q)}${multi ? '<span class="tag sata">select all that apply</span>' : ''}<span class="spacer"></span>${flagBtn(q.id)}</div>
    <div class="qbody"><p class="stem">${esc(q.stem)}</p>`;
  if(q.img && IMAGES[q.img]) h += `<img class="qimg" src="${IMAGES[q.img]}" alt="Reaction scheme for this question">`;
  if(q.fg) h += fgShow(q.fg);
  if(!s.answered){
    s.order.forEach((oi, n) => {
      const chosen = multi && s.picked.includes(oi);
      h += `<button class="opt${multi ? ' multi' : ''}${chosen ? ' on' : ''}" data-sck="${id}" data-sco="${oi}" aria-pressed="${chosen}"><span class="k">${box(multi, chosen, n)}</span><span>${esc(q.options[oi].t)}</span></button>`;
    });
    h += `</div><div class="qfoot">${multi
      ? `<button class="btn" data-sccheck="${id}"${s.picked.length ? '' : ' disabled'}>Check answer</button><span class="meta">${s.picked.length} selected</span>`
      : '<span class="meta">Pick an answer.</span>'}</div></div>`;
    return h;
  }
  const chose = oi => multi ? s.picked.includes(oi) : oi === s.picked;
  s.order.forEach((oi, n) => {
    const o = q.options[oi];
    const cls = 'opt' + (multi ? ' multi' : '') + (chose(oi) ? (o.correct ? ' pick-ok' : ' pick-bad') : o.correct ? ' reveal-ok' : '');
    h += `<button class="${cls}" disabled aria-pressed="${chose(oi)}"><span class="k">${box(multi, chose(oi), n)}</span><span>${esc(o.t)}</span></button>`;
  });
  h += `<div class="why"><p class="verdict ${s.ok ? 'ok' : 'bad'}">${s.ok ? '✓ Correct' : '✗ Not correct'}</p>`;
  s.order.forEach((oi, n) => {
    const o = q.options[oi];
    h += `<div class="wrow"><span class="mark ${o.correct ? 'y' : 'n'}">${o.correct ? '✓' : '✗'}</span>
      <span class="wtxt"><b>${LETTERS[n]}. ${esc(o.t)}</b>${multi && chose(oi) ? ' <i class="youpicked">you selected this</i>' : ''}${o.why ? ' — ' + esc(o.why) : ''}</span>${optFig(o.t)}</div>`;
  });
  if(q.teach) h += `<div class="teach"><h4>The concept behind this</h4>${q.svg ? `<div class="tdiag">${q.svg}</div>` : ''}${cmpStrip(q, 'The structures side by side')}${renderTeach(q.teach)}</div>`;
  if(q.note) h += `<p class="prose" style="margin:13px 0 0;font-size:14.5px">${esc(q.note)}</p>`;
  h += `<div class="cite">${q.quote ? `<span class="quote">“${esc(q.quote)}”</span>` : ''}${srcFlag(q)}${esc(q.cite)}</div></div>`;
  return h + `</div><div class="qfoot">${confLine(q, s)}</div></div>`;
}
/* The core changes the confidence of the answer recorded last only, so the
   buttons are on that card; the other cards say how their answer was recorded. */
function confLine(q, s){
  const last = DB.answers[DB.answers.length - 1], mine = !!last && last.qid === q.id && last.qn === s.qn, id = esc(q.id);
  if(s.ok){
    const as = s.conf === 'guess' ? '“I guessed”' : s.conf === 'unsure' ? '“Not sure”' : '“Knew it”';
    if(s.conf !== 'sure') return `<span class="meta">Recorded as ${as}.</span>`;
    return mine ? `<span class="meta">Recorded as ${as}.</span><button class="btn amber" data-scdown="unsure" data-sck="${id}">Not sure, ask again soon</button><button class="btn amber" data-scdown="guess" data-sck="${id}">I guessed that one</button>`
      : `<span class="meta">Recorded as ${as}. Not sure and I guessed are offered on the question answered last.</span>`;
  }
  if(s.sure) return `<span class="meta">Marked as sure.${armOf(q.concept) === 'concept' ? ' This concept is asked again on a later day.' : ''}</span>`;
  return mine ? `<button class="btn amber" data-scsure="${id}">I was sure of that</button>` : '';
}
function allCount(){
  const A = ALL, shown = A.list.slice(0, A.n), done = shown.filter(id => A.st[id] && A.st[id].answered);
  const right = done.filter(id => A.st[id].ok).length;
  return `${Q.label || ''} · ${done.length} of ${shown.length} answered${done.length ? ' · ' + right + ' right' : ''}${A.list.length > shown.length ? ' · ' + A.list.length + ' in the set' : ''}`;
}
function allTake(pane){
  const A = allState();
  // questions answered one at a time since this page was drawn leave it, unless they were answered here
  A.list = A.list.filter(id => !A.oneDone.has(id) || (A.st[id] && A.st[id].answered));
  if(!A.list.length) return false;
  const shown = A.list.slice(0, A.n);
  let h = `<div class="scall"><div class="scbar">${layoutChips()}<span class="meta" id="scAllCount">${esc(allCount())}</span></div>`;
  if(A.typed) h += `<p class="sub">${A.typed} calculation or matching question${A.typed === 1 ? ' is' : 's are'} in this set; ${A.typed === 1 ? 'it is' : 'they are'} asked one at a time.</p>`;
  shown.forEach((id, k) => { h += allCard(byId(id), k); });
  h += A.list.length > shown.length
    ? `<p><button class="btn" id="scMore">Show the next ${Math.min(40, A.list.length - shown.length)}</button></p>`
    : '<p><button class="btn ghost" id="scFinish">Finish</button></p>';
  pane.innerHTML = h + '</div>';
  return true;
}
function refreshCard(id){
  const el = document.querySelector(`#v-quiz .scq[data-scq="${CSS.escape(id)}"]`);
  if(!el){ renderQuiz(); return; }
  const k = ALL.list.indexOf(id), tmp = document.createElement('div');
  tmp.innerHTML = allCard(byId(id), k);
  el.replaceWith(tmp.firstElementChild);
  const c = document.getElementById('scAllCount'); if(c) c.textContent = allCount();
}
function allPick(id, oi){
  const q = byId(id), s = cardState(q);
  if(s.answered) return;
  if(isMulti(q)){ s.picked = s.picked.includes(oi) ? s.picked.filter(x => x !== oi) : [...s.picked, oi]; refreshCard(id); return; }
  s.picked = oi; allCheck(id);
}
function allCheck(id){
  const q = byId(id), s = cardState(q), multi = isMulti(q);
  if(s.answered || (multi ? !s.picked.length : s.picked === null)) return;
  s.ok = multi ? gradeMulti(q, s.picked) : !!q.options[s.picked].correct;
  s.answered = true; s.conf = s.ok ? 'sure' : 'wrong';
  INALL = true;
  try { record(q, s.ok ? 'correct' : 'wrong', multi ? s.picked.slice().sort((a, b) => a - b) : s.picked, Date.now() - s.t0); }
  finally { INALL = false; }
  const e = DB.answers[DB.answers.length - 1]; s.qn = e && e.qid === id ? e.qn : -1;
  Q.answered++;
  const before = ALL.lastId; ALL.lastId = id;
  refreshCard(id);
  if(before && before !== id && ALL.st[before]) refreshCard(before);   // its confidence buttons go
  if(typeof refreshSess === 'function') refreshSess();
}
function allDown(id, how){
  const q = byId(id), s = cardState(q);
  if(!s.answered || !s.ok || s.conf !== 'sure') return;
  if(how === 'guess' ? markGuessed(q) : markShaky(q)) s.conf = how === 'guess' ? 'guess' : 'unsure';
  refreshCard(id);
  if(typeof refreshSess === 'function') refreshSess();
}
function allSure(id){
  const q = byId(id), s = cardState(q);
  if(!s.answered || s.ok || s.sure) return;
  if(markSure(q)) s.sure = true;
  refreshCard(id);
}
/* Back to one at a time: the questions answered on the page are not asked again in a fixed pass,
   and the question on screen moves on when it was answered there. */
function backToOne(){
  const A = ALL && ALL.q === Q ? ALL : null;
  const done = new Set(A ? Object.keys(A.st).filter(id => A.st[id].answered) : []);
  if(Q.sweep && done.size) Q.sweep = Q.sweep.slice(0, Q.i).concat(Q.sweep.slice(Q.i).filter(id => !done.has(id)));
  if(Q.current && !Q.revealed && done.has(Q.current.id)){ Q.lastId = Q.current.id; nextQuestion(); }
  else renderQuiz();
}

/* ---- the exam paper ------------------------------------------------------- */
const STRICT_KEY = () => NS + ':strictpaper:' + PROFILE;
const PREF_KEY = () => NS + ':strict';
const paperKey = () => !EX ? '' : (EX.ends === null || EX.ends === undefined) ? 'u' + EX.started : String(EX.ends);
const strictPaper = () => STRICT && !!EX && !!EX.running && store.get(STRICT_KEY()) === paperKey();
let PENDING = null;    // the strict box as it stood when Start was pressed
const EXAM_KEYS = strict => 'Keys: A–J or 1–9 pick an option · Enter or → next question' + (strict ? '' : ' · ← previous question');
const blankAt = i => examBlank(EX.qs[i], EX.picks[i]);

function onExam(pane){
  if(typeof EX === 'undefined') return;
  if(EX && EX.running){
    if(PENDING !== null){ if(PENDING) store.set(STRICT_KEY(), paperKey()); else store.del(STRICT_KEY()); PENDING = null; }
    if(pane.querySelector('.scxall')) return;
    const strict = strictPaper();
    if(!strict && layout() === 'all'){ examAll(pane); return; }
    const head = pane.querySelector(':scope > .examhead');
    if(!head) return;
    if(strict){
      const back = pane.querySelector('#exPrev'); if(back) back.remove();
      if(!pane.querySelector('.scnoback')) head.insertAdjacentHTML('afterend', '<p class="sub scnoback">No going back: once you move on you cannot return to this question.</p>');
    }else{
      if(LAYOUT && !head.querySelector('.sclayout')) head.insertAdjacentHTML('beforeend', layoutChips());
      if(FLAGS && !head.querySelector('.scxflags')) head.insertAdjacentHTML('beforeend', paperFlags());
      const qh = pane.querySelector('.qcard .qhead');
      if(FLAGS && qh && !qh.querySelector('[data-scflag]')) qh.insertAdjacentHTML('beforeend', flagBtn(EX.qs[EX.i].id));
    }
    const card = pane.querySelector(':scope > .qcard');
    if(KEYS && card && !pane.querySelector('.sckbd')) card.insertAdjacentHTML('afterend', `<p class="meta sckbd">${EXAM_KEYS(strict)}</p>`);
    return;
  }
  if(EX && EX.done){
    store.del(STRICT_KEY());
    pane.querySelectorAll(':scope > .qcard').forEach((c, i) => {
      const qh = c.querySelector('.qhead'), q = EX.qs[i];
      if(FLAGS && q && qh && !qh.querySelector('[data-scflag]')) qh.insertAdjacentHTML('beforeend', flagBtn(q.id));
    });
    return;
  }
  const start = pane.querySelector('#startExam');
  if(!start) return;
  if(!store.get(EXAM_KEY())) store.del(STRICT_KEY());
  if((LAYOUT || STRICT) && !pane.querySelector('.scstart')){
    const pref = store.get(PREF_KEY()) === '1';
    start.parentElement.insertAdjacentHTML('beforebegin', `<div class="scstart">${LAYOUT ? `<p><span class="meta">Answer:</span> ${layoutChips()}</p>` : ''}${STRICT
      ? `<label class="scstrict"><input type="checkbox" id="scStrict"${pref ? ' checked' : ''}><span>Strict paper: one question at a time with no going back. Once you move on, you cannot return to a question.${STRICT_NOTE ? ' ' + esc(STRICT_NOTE) : ''}</span></label>` : ''}</div>`);
  }
}
/* The flagged questions of the paper on screen, by number; a link moves to the question. */
function paperFlags(){
  if(!FLAGS || !EX || !EX.running || strictPaper()) return '';
  const ks = EX.qs.map((q, k) => isFlagged(q.id) ? k : -1).filter(k => k >= 0);
  return `<span class="scxflags">${ks.length ? '⚑ Flagged: ' + ks.map(k => `<button type="button" data-scjump="${k}" aria-label="Question ${k + 1}, flagged">${k + 1}</button>`).join('') : ''}</span>`;
}
function refreshPaperFlags(){
  const f = document.querySelector('#v-exam .scxflags'); if(f) f.outerHTML = paperFlags();
}
function examCard(q, k){
  const multi = isMulti(q), p = EX.picks[k];
  let h = `<div class="qcard scxq" id="scx${k}"><div class="qhead">${profTag(q.prof)}<b>Question ${k + 1}</b>${multi ? '<span class="tag sata">select all that apply</span>' : ''}<span class="spacer"></span>${flagBtn(q.id)}</div>
    <div class="qbody"><p class="stem">${esc(q.stem)}</p>`;
  if(q.img && IMAGES[q.img]) h += `<img class="qimg" src="${IMAGES[q.img]}" alt="Reaction scheme">`;
  if(q.fg) h += fgShow(q.fg);
  EX.orders[k].forEach((oi, n) => {
    const sel = multi ? (p || []).includes(oi) : p === oi;
    h += `<button class="opt${multi ? ' multi' : ''}${sel ? (multi ? ' on' : ' pick-ok') : ''}" data-scxk="${k}" data-scxo="${oi}" aria-pressed="${sel}"><span class="k">${box(multi, sel, n)}</span><span>${esc(q.options[oi].t)}</span></button>`;
  });
  return h + '</div></div>';
}
const answeredN = () => EX.qs.filter((q, i) => !blankAt(i)).length;
const countText = () => `${answeredN()} of ${EX.qs.length} answered`;
function examAll(pane){
  const top = Math.max(0, headerOffset() - 8);
  let h = `<div class="scxall"><div class="examhead scxhead" style="top:${top}px"><span class="clock" id="exClock">${untimedPaper() ? tookText() : fmt(EX.ends - Date.now())}</span>
    <span class="prog" id="scxCount">${countText()}</span>${layoutChips()}${paperFlags()}<span class="spacer" style="flex:1"></span><button class="btn ghost" id="scxSubmit">Submit paper</button></div>`;
  EX.qs.forEach((q, k) => { h += examCard(q, k); });
  pane.innerHTML = h + '<p><button class="btn" id="scxSubmit2">Submit paper</button></p></div>';
}
function examPick(k, oi){
  const q = EX.qs[k];
  if(isMulti(q)){ const p = EX.picks[k] || []; EX.picks[k] = p.includes(oi) ? p.filter(x => x !== oi) : [...p, oi]; }
  else EX.picks[k] = oi;
  EX.i = k;
  saveExam();
  const el = document.getElementById('scx' + k), tmp = document.createElement('div');
  tmp.innerHTML = examCard(q, k);
  if(el) el.replaceWith(tmp.firstElementChild);
  const c = document.getElementById('scxCount'); if(c) c.textContent = countText();
}
/* The core's own submit questions, word for word (views.js renderExamQ, exEnd). */
function examSubmit(){
  const blank = EX.qs.filter((q, i) => blankAt(i)).length;
  if(!blank){ if(confirm('Submit the paper and see your score?')){ finishExam(false); window.scrollTo(0, 0); } return; }
  if(confirm(`${blank} item${blank === 1 ? ' is' : 's are'} still blank.\n\nOK: submit what you have answered (blank items are not logged).\nCancel: keep going.`)){ finishExam(true); window.scrollTo(0, 0); }
}

/* ---- clicks: one delegated handler for every control of the module ------- */
function onClick(e){
  const t = e.target && e.target.closest ? e.target : null;
  if(!t) return;
  const f = t.closest('[data-scflag]');
  if(f){ toggleFlag(f.dataset.scflag); if(e.detail) f.blur(); return; }   // a mouse click leaves focus on the button, where Enter would flag again
  const l = t.closest('[data-sclayout]');
  if(l){ setLayout(l.dataset.sclayout); return; }
  if(t.closest('#scDrillFlag')){ drillFlagged(); return; }
  if(t.closest('#scClearFlag')){ if(confirm('Remove every flag?')){ DB.flags = {}; save(); flagChanged(null); } return; }
  const j = t.closest('[data-scjump]');
  if(j && EX && EX.running && !strictPaper()){
    const k = +j.dataset.scjump;
    if(document.querySelector('#v-exam .scxall')) scrollToEl(document.getElementById('scx' + k));
    else { EX.i = k; saveExam(); renderExamQ(); }
    return;
  }
  const xo = t.closest('[data-scxk]');
  if(xo && EX && EX.running){ examPick(+xo.dataset.scxk, +xo.dataset.scxo); return; }
  if(t.closest('#scxSubmit') || t.closest('#scxSubmit2')){ if(EX && EX.running) examSubmit(); return; }
  if(!ALL || ALL.q !== Q) return;
  const o = t.closest('[data-sco]');
  if(o){ allPick(o.dataset.sck, +o.dataset.sco); return; }
  const ck = t.closest('[data-sccheck]');
  if(ck){ allCheck(ck.dataset.sccheck); return; }
  const dn = t.closest('[data-scdown]');
  if(dn){ allDown(dn.dataset.sck, dn.dataset.scdown); return; }
  const su = t.closest('[data-scsure]');
  if(su){ allSure(su.dataset.scsure); return; }
  if(t.closest('#scMore')){ ALL.n += 40; renderQuiz(); return; }
  if(t.closest('#scFinish')){ show('topics'); }
}
/* Before the core's own handlers: the strict paper's Next on a blank question asks first,
   and Start notes the strict box. */
function onClickFirst(e){
  const t = e.target && e.target.closest ? e.target : null;
  if(!t) return;
  if(t.closest('#startExam')){
    const b = document.getElementById('scStrict');
    PENDING = STRICT && !!(b && b.checked);
    if(b) store.set(PREF_KEY(), b.checked ? '1' : '0');
    return;
  }
  if(t.closest('#exNext') && strictPaper() && blankAt(EX.i)){
    const last = EX.i === EX.qs.length - 1;
    if(!confirm(last ? 'Submit the paper without answering this question?' : 'Move on without answering? You cannot come back to this question.')){
      e.stopPropagation(); e.preventDefault();
    }
  }
}

/* ---- keys ------------------------------------------------------------------ */
const letterIndex = k => /^[1-9]$/.test(k) ? +k - 1 : /^[a-jA-J]$/.test(k) ? 'ABCDEFGHIJ'.indexOf(k.toUpperCase()) : -1;
const press = sel => { const b = typeof sel === 'string' ? document.querySelector(sel) : sel; if(b && !b.disabled){ b.click(); return true; } return false; };
function onKey(e){
  // typing in a field is never a shortcut; on a focused button or link, Enter and Space keep their own meaning
  const tg = (e.target && e.target.tagName) || '';
  if(/^(INPUT|SELECT|TEXTAREA)$/.test(tg) || (e.target && e.target.isContentEditable)) return;
  if(/^(BUTTON|A|SUMMARY)$/.test(tg) && (e.key === 'Enter' || e.key === ' ')) return;
  if(e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
  const k = e.key;
  if(VIEW === 'quiz' && Q && Q.current){
    const pane = document.getElementById('v-quiz');
    if(!pane || pane.querySelector('.scall')) return;
    const n = letterIndex(k);
    if(!Q.revealed){
      if(n >= 0){ const opts = pane.querySelectorAll('.qbody button.opt[data-o]'); if(opts[n] && press(opts[n])) e.preventDefault(); return; }
      if(k === 'Enter' && press('#btnCheck')) e.preventDefault();
      return;
    }
    // after a right answer: 1 Knew it, 2 Not sure, 3 I guessed, each then the next question
    if(Q.lastRight && /^[1-3]$/.test(k)){
      if(k === '2') press('#btnShaky'); else if(k === '3') press('#btnGuess');
      press('#btnNext'); e.preventDefault(); return;
    }
    if(k === 'Enter' && press('#btnNext')) e.preventDefault();
    return;
  }
  if(VIEW === 'exam' && EX && EX.running){
    const pane = document.getElementById('v-exam');
    if(!pane || pane.querySelector('.scxall')) return;
    const n = letterIndex(k);
    if(n >= 0){ const opts = pane.querySelectorAll('.qbody button.opt[data-o]'); if(opts[n] && press(opts[n])) e.preventDefault(); return; }
    if((k === 'ArrowRight' || k === 'Enter') && EX.i < EX.qs.length - 1){ press('#exNext'); e.preventDefault(); return; }
    if(k === 'ArrowLeft' && EX.i > 0 && !strictPaper()){ press('#exPrev'); e.preventDefault(); }
  }
}

/* ---- the hooks ---------------------------------------------------------------- */
/* a progress without flags or a layout is left exactly as saved; one of another shape loses that field */
X.progress(db => {
  if('flags' in db && !isObj(db.flags)) delete db.flags;
  if(db.layout !== undefined && db.layout !== 'all' && db.layout !== 'one') delete db.layout;
});
X.after((q, result, picked, mode) => { if(!INALL && ALL && ALL.q === Q && mode !== 'exam') ALL.oneDone.add(q.id); });
X.rendered((pane, view) => {
  if(view === 'topics') onTopics(pane);
  else if(view === 'quiz') onQuiz(pane);
  else if(view === 'exam') onExam(pane);
});
X.start(() => {
  document.addEventListener('click', e => FX.run('study-controls', 'click', () => onClickFirst(e)), true);
  document.addEventListener('click', e => FX.run('study-controls', 'click', () => onClick(e)));
  if(KEYS) document.addEventListener('keydown', e => FX.run('study-controls', 'keys', () => onKey(e)));
});
X.api({isFlagged, flagged: flaggedIds, set: setFlag, toggle: toggleFlag, button: flagBtn,
       onChange: fn => { if(typeof fn === 'function') listeners.push(fn); },
       layout, strictPaper, options: {flags: FLAGS, layout: LAYOUT, keys: KEYS, strict: STRICT}});
