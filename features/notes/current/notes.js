/* ==========================================================================
   NOTES ON QUESTIONS (feature module notes v1)
   ==========================================================================
   Ported from Basic-Pharmacokinetics src/views.js at ac2eb73: NOTES, noteChip,
   noteBoxHTML, noteMyAnswer, plain, notesMarkdown and renderNotes (lines
   5564-5654), the Weak spots line (2062-2063), the Note button on the quiz,
   paper and result cards (1494, 1587, 1791, 3309, 3425) and the delegated
   handlers that open the box and save what is typed (6361-6375).

   What it adds: a "✎ Note" button on every question card (the quiz, the exam
   paper, the paper's results, and study-controls' one-page cards). It opens a
   box under the card's head for what the student is thinking or wants to
   ask; the text is saved as it is typed, and the button then reads
   "✎ My note". A Notes tab lists every noted question, newest first: the
   stem, the options, the student's last answer, the key and the working,
   with the note to edit, Drill this question and Delete note; Copy for AI
   and Download (.md) give every note as one Markdown text with the question,
   the answer given, the key and the working. A question on a paper still
   running has its key left out, on the tab and in the text, until the paper
   is submitted. Weak spots says how many notes there are and opens the tab.

   Kept: DB.notes {question id: {t: the text, at: when it was last typed}}, in
   the profile's progress, so Export progress carries it, Import progress
   brings it back, Erase my history removes it and each profile has its own.
   Basic-Pharmacokinetics keeps its notes in the same shape, so its saved
   notes read in unchanged. An empty note is removed, not kept.

   What changed from the course: the course's name, exam and professor come
   from course.js (the text names "the professor"); the Notes tab filters by
   topic, where the course filtered by module; the request at the top of the
   text and the download's file name are options. The course's flags on a
   paper (EX.flags) are not ported: the kit's flags are study-controls' one
   store (DB.flags). When study-controls is on, a flagged question's card on
   the Notes tab carries "⚑ flagged", read from FX.api('study-controls') each
   time the tab draws; when it is off, there is no flag mark.

   Other modules read the notes with FX.api('notes'): noteOf(id) (the text or
   ''), noted() (ids, newest first), markdown(), button(id) (the button's HTML;
   the click is handled here).
   ========================================================================== */
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
// read without writing: a progress gains `notes` only when a note is first typed
const notesNow = () => DB && isObj(DB.notes) ? DB.notes : {};
const noteOf = id => { const n = notesNow()[id]; return n && typeof n.t === 'string' ? n.t : ''; };
const hasNote = id => !!noteOf(id).trim();
const notedIds = () => { const m = notesNow();
  return Object.keys(m).filter(id => byId(id) && hasNote(id)).sort((a, b) => (m[b].at || 0) - (m[a].at || 0)); };
function setNote(id, t){
  if(String(t).trim()){ if(!isObj(DB.notes)) DB.notes = {}; DB.notes[id] = {t: String(t), at: Date.now()}; }
  else if(isObj(DB.notes)) delete DB.notes[id];
  save();
}
const PROF = 'the professor';
const REQUEST = typeof OPT.request === 'string' && OPT.request.trim() ? OPT.request.trim()
  : 'Under each question below I wrote what I was thinking or what I want to ask. For each one, answer my question, say where my reasoning went wrong if it did, and show the working step by step.';
const FILE = () => typeof OPT.file === 'string' && OPT.file.trim() ? OPT.file.trim() : `${COURSE.id}-my-questions.md`;

const chipLabel = id => hasNote(id) ? '✎ My note' : '✎ Note';
const noteChip = id => `<button type="button" class="chip ntchip" data-noteq="${esc(id)}" aria-expanded="false" title="Write what you are thinking or want to ask">${chipLabel(id)}</button>`;
const noteBox = (id, inTab) => `<div class="notebox"><label for="nt-${esc(id)}">What I'm thinking, or what I want to ask</label>
  <textarea id="nt-${esc(id)}" data-notetext="${esc(id)}" rows="3">${esc(noteOf(id))}</textarea>
  ${inTab ? '' : '<small>Saved in this browser with your progress. The Notes tab lists every note and copies them, with the question and the key, for an AI.</small>'}</div>`;

const kindOf = q => q.type || 'mc';
const hasOptions = q => Array.isArray(q.options) && q.options.length > 0;
const topicName = q => { const t = TOPICS.find(x => x.id === q.topic); return t ? t.name : String(q.topic || ''); };
// the answer last given to a question, as text, and whether it was right
function myAnswer(q){
  const a = (DB.answers || []).filter(x => x.qid === q.id).pop(); if(!a) return null;
  const p = a.picked, kind = kindOf(q);
  let txt;
  if(p === undefined || p === null || (kind === 'numeric' && String(p).trim() === '')) txt = 'left blank';
  else if(kind === 'numeric') txt = String(p) + (q.units ? ' ' + q.units : '');
  else if(kind === 'match' && Array.isArray(p) && Array.isArray(q.pairs))
    txt = q.pairs.map((pr, i) => `${pr.l} → ${p[i] === null || p[i] === undefined || !q.pairs[p[i]] ? '—' : q.pairs[p[i]].r}`).join('; ');
  else if(kind === 'mc' && hasOptions(q)) txt = [].concat(p).map(i => q.options[i] ? q.options[i].t : '').filter(Boolean).join('; ');
  else txt = typeof p === 'object' ? JSON.stringify(p) : String(p);
  return {txt, result: a.result === 'correct' ? 'right' : a.result === 'guessed' ? 'guessed' : 'missed'};
}
// the key, as text: the number with its unit, the pairs, or the right options
function keyText(q){
  const kind = kindOf(q);
  if(kind === 'numeric' && q.answer !== undefined) return fmtNum(q.answer) + (q.units ? ' ' + q.units : '');
  if(kind === 'match' && Array.isArray(q.pairs)) return q.pairs.map(p => `${p.l} → ${p.r}`).join('; ');
  if(hasOptions(q)) return q.options.filter(o => o.correct).map(o => o.t).join('; ');
  return '';
}
const steps = q => kindOf(q) === 'numeric' && Array.isArray(q.steps) ? q.steps : [];
const whys = q => kindOf(q) === 'mc' && hasOptions(q) ? q.options.filter(o => o.correct).map(o => o.why).filter(Boolean) : [];
const running = id => typeof EX !== 'undefined' && !!EX && !!EX.running && EX.qs.some(q => q.id === id);
const md = s => String(s === undefined || s === null ? '' : s).replace(/\{\{frac:([^|}]*)\|([^}]*)\}\}/g, '($1)/($2)')
  .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&[a-z]+;/g, ' ').trim();

// every noted question as one Markdown text, with the request at the top for whoever reads it
function notesMarkdown(){
  const ids = notedIds().slice().reverse();     // oldest first, as written
  let out = `# My questions: ${md(COURSE.title)}\n\nI am studying for ${md(EXAM.name)}. ${REQUEST}\n`;
  ids.forEach((id, n) => {
    const q = byId(id), mine = myAnswer(q), key = keyText(q);
    out += `\n## ${n + 1}. ${md(topicName(q))}${q.cite ? ' (' + md(q.cite).slice(0, 90) + ')' : ''}\n\n**Question:** ${md(q.stem)}\n`;
    if(kindOf(q) === 'mc' && hasOptions(q)) out += '\n' + q.options.map((o, k) => `${LETTERS[k]}. ${md(o.t)}`).join('\n') + '\n';
    if(kindOf(q) === 'match' && Array.isArray(q.pairs)) out += `\nMatch each of ${q.pairs.map(p => md(p.l)).join('; ')} with one of ${q.pairs.map(p => md(p.r)).join('; ')}.\n`;
    if(mine) out += `\n**My answer:** ${md(mine.txt)} (${mine.result})\n`;
    if(running(id)) out += `\n**Key:** left out until the paper is submitted\n`;
    else {
      if(key) out += `\n**Key:** ${md(key)}\n`;
      if(steps(q).length) out += `\n**Working in the drill:**\n${steps(q).map(s => `- ${md(s.t)}`).join('\n')}\n`;
      else if(whys(q).length) out += `\n**Why the key is right:** ${whys(q).map(md).join(' ')}\n`;
    }
    out += `\n**What I'm thinking / my question:** ${noteOf(id).trim()}\n`;
  });
  return out;
}

/* ---- the Notes tab -------------------------------------------------------- */
let TOPIC = 'all';
function renderNotes(el){
  const all = notedIds();
  const topics = [...new Set(all.map(id => byId(id).topic))];
  topics.sort((a, b) => TOPICS.findIndex(t => t.id === a) - TOPICS.findIndex(t => t.id === b));
  if(TOPIC !== 'all' && !topics.includes(TOPIC)) TOPIC = 'all';
  const ids = all.filter(id => TOPIC === 'all' || byId(id).topic === TOPIC);
  const SC = FX.api('study-controls');
  let h = `<h2>Notes</h2><p class="sub">Every question you wrote on with ✎ Note: what you were thinking or want to ask. Edit a note here; empty it to remove it. Copy for AI gives each question with your answer, the key and the working, ready to paste into an AI or bring to ${PROF}'s review.</p>`;
  if(!all.length){
    el.innerHTML = h + `<div class="empty">No notes yet. Tap ✎ Note on any question, in a drill, on an exam paper or on its results, and write what you are thinking. Your notes collect here.</div>`;
    return;
  }
  h += `<p class="ntbar"><button class="btn small" id="notesCopy">Copy for AI (${all.length})</button><button class="btn small ghost" id="notesDown">Download (.md)</button><button class="btn small ghost" id="notesDrill">Drill these ${ids.length}</button></p>`;
  if(topics.length > 1) h += `<div class="filters"><div class="frow"><label>Topic</label>${['all', ...topics].map(t =>
    `<button class="chip" data-notestopic="${esc(t)}" aria-pressed="${TOPIC === t}">${t === 'all' ? 'All' : esc(topicName({topic: t}))}</button>`).join('')}</div></div>`;
  h += ids.map(id => {
    const q = byId(id), mine = myAnswer(q), at = notesNow()[id].at, key = keyText(q);
    const when = at ? new Date(at).toLocaleString([], {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}) : '';
    let keyH;
    if(running(id)) keyH = `<p class="sub">The key is hidden until the paper this question is on is submitted.</p>`;
    else {
      const work = steps(q).length ? `<ol class="steps">${steps(q).map(s => `<li><code>${esc(s.t)}</code></li>`).join('')}</ol>`
        : whys(q).map(w => `<p>${esc(w)}</p>`).join('');
      keyH = key || work ? `<details class="ntkey"><summary>The key and the working</summary>${key ? `<p><b>Key:</b> ${esc(key)}</p>` : ''}${work}</details>` : '';
    }
    const flagged = SC && typeof SC.isFlagged === 'function' && SC.isFlagged(id);
    return `<div class="qcard ntcard" data-noteid="${esc(id)}"><div class="qhead"><span class="lbl">${esc(topicName(q))}</span>${flagged ? '<span class="tag ntflag">⚑ flagged</span>' : ''}<span class="spacer"></span><span class="meta">${esc(when)}</span></div>
      <div class="qbody"><p class="stem">${esc(q.stem)}</p>
      ${q.img && IMAGES[q.img] ? `<img class="qimg" src="${IMAGES[q.img]}" alt="Figure for this question">` : ''}
      ${kindOf(q) === 'mc' && hasOptions(q) ? `<ol type="A" class="ntopts">${q.options.map(o => `<li>${esc(o.t)}</li>`).join('')}</ol>` : ''}
      ${mine ? `<p class="ntmine"><b>Your answer:</b> ${esc(mine.txt)} <span class="${mine.result === 'right' ? 'ntok' : 'ntbad'}">(${mine.result})</span></p>` : '<p class="sub ntmine">Not answered yet.</p>'}
      ${keyH}${noteBox(id, true)}
      <p class="ntbar"><button type="button" class="btn small ghost" data-notedrill="${esc(id)}">Drill this question</button><button type="button" class="btn small ghost" data-notedel="${esc(id)}">Delete note</button></p></div></div>`;
  }).join('');
  el.innerHTML = h;
  const c = el.querySelector('#notesCopy'), d = el.querySelector('#notesDown'), r = el.querySelector('#notesDrill');
  c.onclick = () => { const t = notesMarkdown(), done = () => { c.textContent = 'Copied ✓'; setTimeout(() => { c.textContent = `Copy for AI (${all.length})`; }, 2000); };
    const old = () => { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch(e){} ta.remove(); };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, old); else old(); };
  d.onclick = () => download(FILE(), notesMarkdown(), 'text/markdown');
  r.onclick = () => drillList(ids.map(byId), 'My notes');
  el.querySelectorAll('[data-notestopic]').forEach(b => b.onclick = () => { TOPIC = b.dataset.notestopic; renderNotes(el); });
  el.querySelectorAll('[data-notedrill]').forEach(b => b.onclick = () => drillList([byId(b.dataset.notedrill)], 'My note'));
  el.querySelectorAll('[data-notedel]').forEach(b => b.onclick = () => { if(!confirm('Delete this note?')) return; setNote(b.dataset.notedel, ''); renderNotes(el); });
}
X.tab({id: 'notes', label: 'Notes', before: 'exam', render: renderNotes});

/* ---- the Note button on the cards ----------------------------------------- */
function addChip(card, id){
  const head = card && card.querySelector('.qhead');
  if(!head || !id || !byId(id) || head.querySelector('[data-noteq]')) return;
  head.insertAdjacentHTML('beforeend', noteChip(id));
}
/* A module after this one in course.js order may redraw the pane in the same
   pass (study-controls' one-page layout does), and that redraw is not passed to
   the hooks again; so the buttons are also added once the pass is over. Adding
   them is idempotent, so the second look adds only what the first missed. */
X.rendered((pane, view) => {
  chips(pane, view);
  if(view === 'quiz' || view === 'exam') setTimeout(() => FX.run('notes', 'rendered (after the pass)', () => chips(pane, view)), 0);
});
function chips(pane, view){
  if(view === 'quiz'){
    pane.querySelectorAll('.qcard[data-scq]').forEach(c => addChip(c, c.dataset.scq));    // study-controls, all on one page
    if(typeof Q !== 'undefined' && Q && Q.current) addChip(pane.querySelector(':scope > .qcard'), Q.current.id);
  }else if(view === 'exam'){
    if(typeof EX === 'undefined' || !EX) return;
    if(EX.running){
      pane.querySelectorAll('.qcard.scxq').forEach(c => { const k = +String(c.id).slice(3); if(EX.qs[k]) addChip(c, EX.qs[k].id); });
      if(!pane.querySelector('.scxall')) addChip(pane.querySelector(':scope > .qcard'), EX.qs[EX.i] && EX.qs[EX.i].id);
    }else if(EX.done){
      const cards = pane.querySelectorAll(':scope > .qcard');
      if(cards.length === EX.qs.length) cards.forEach((c, i) => addChip(c, EX.qs[i].id));
    }
  }else if(view === 'gaps'){
    if(pane.querySelector('#ntGaps')) return;
    const n = notedIds().length, at = pane.querySelector(':scope > .stat') || pane.querySelector(':scope > h2');
    if(at) at.insertAdjacentHTML('afterend', `<p class="sub" id="ntGaps">${n ? `✎ You have ${n} note${n === 1 ? '' : 's'} on questions.` : '✎ Notes you write on questions collect in the Notes tab.'} <button type="button" class="btn small ghost" id="ntOpen">Open Notes</button></p>`);
    const b = pane.querySelector('#ntOpen'); if(b) b.onclick = () => show('notes');
  }
}

/* ✎ Note opens a box under the card's head; what is typed is saved as it is typed */
X.start(() => {
  document.addEventListener('click', e => FX.run('notes', 'note button', () => {
    const b = e.target.closest && e.target.closest('[data-noteq]'); if(!b) return;
    const head = b.closest('.qhead'), nx = head && head.nextElementSibling;
    if(nx && nx.classList.contains('notebox')){ nx.remove(); b.setAttribute('aria-expanded', 'false'); return; }
    if(head){ head.insertAdjacentHTML('afterend', noteBox(b.dataset.noteq)); b.setAttribute('aria-expanded', 'true');
      const ta = head.nextElementSibling.querySelector('textarea'); if(ta) ta.focus(); }
  }));
  document.addEventListener('input', e => FX.run('notes', 'note text', () => {
    const ta = e.target.closest && e.target.closest('[data-notetext]'); if(!ta) return;
    const id = ta.dataset.notetext;
    setNote(id, ta.value);
    document.querySelectorAll(`[data-noteq="${CSS.escape(id)}"]`).forEach(c => { c.textContent = chipLabel(id); });
  }));
});

/* a saved progress: keep each note that is {t: text, at}, drop anything else */
X.progress(db => {
  if(!('notes' in db)) return;
  if(!isObj(db.notes)){ delete db.notes; return; }
  for(const id of Object.keys(db.notes)){
    const n = db.notes[id];
    if(!isObj(n) || typeof n.t !== 'string' || !n.t.trim()) delete db.notes[id];
  }
});

X.settings({title: 'Notes', html: () => {
  const n = notedIds().length;
  return `<p class="meta">${n ? `${n} note${n === 1 ? '' : 's'} on questions.` : 'No notes on questions yet.'} Notes are kept with your progress in this browser, for this profile: Export progress includes them, Import progress brings them back, and Erase my history removes them.</p>`;
}});

X.api({noteOf, noted: notedIds, markdown: notesMarkdown, button: noteChip});
