/* ==========================================================================
   QUIZ PREP CARDS (Basic-Pharmacokinetics src/views.js lines 466-512, 699-709,
   2409-2417, 3734-3738 and 3785, at ac2eb73)
   ==========================================================================
   One card per quiz in COURSE.quizzes, at the top of Topics, from the quiz's
   course data until the quiz is over (`when` plus `minutes`) or the student
   hides it on this browser. A card gives the quiz's day and time, the days
   left, what it covers, the professor's words about it and what the professor
   said to prepare (with the source), and four drills over the questions of the
   topics (or question `module` values) the quiz names: concepts adaptive,
   calculations adaptive, everything adaptive, and a straight pass that asks
   each question once. Settings puts a hidden card back.

   What it does not do: it does not change the exam the page prepares for, the
   exam countdown or the Exam sim (several exams and multi-day quizzes are a
   core change, review/port-queue.md); it does not sit a timed practice quiz
   (Basic-Pharmacokinetics beginQuiz runs one on its own exam engine, which the
   kit's core does not have); it has no "Set-up only" row (plan-the-problem's).

   The build step (step.js) has checked every quiz before the page is written;
   DATA is {quizzes: <count>, scope: {<quiz id>: <questions>}}.

   FX.api('quiz-prep-cards'): {quizzes, scopeOf, kindOf, ahead, hidden, live,
   countdown, cardsHTML, startDrill, hide, unhideAll}.
   ========================================================================== */
const HIDE_KEY = NS + ':quizhide:';
const quizzes = () => (Array.isArray(COURSE.quizzes) ? COURSE.quizzes : []);
const quizById = id => quizzes().find(z => z.id === id) || null;

/* The questions a quiz covers: those of the topics it names and those whose
   `module` is one it names. */
function scopeOf(qz){
  const t = qz.topics || [], m = qz.modules || [];
  return QUESTIONS.filter(q => t.includes(q.topic) || (q.module !== undefined && m.includes(q.module)));
}
/* A typed number is a calculation; every other question is a concept item. */
const kindOf = q => (q.type === 'numeric' ? 'calc' : 'concept');
const ofKind = (pool, k) => pool.filter(q => kindOf(q) === k);

/* The quiz has not been sat yet: its start time plus its length is still ahead. */
const endOf = qz => new Date(qz.when).getTime() + (qz.minutes || 0) * 60000;
const ahead = (qz, now) => !!qz.when && (now === undefined ? Date.now() : now) < endOf(qz);
const hidden = qz => store.get(HIDE_KEY + qz.id) === '1';
const live = qz => ahead(qz) && !hidden(qz);

/* Calendar days to the quiz, counted as whole days, so the morning of the
   quiz says "today" (the core's examCountdown, for a quiz). */
function countdown(qz, now){
  now = now === undefined ? Date.now() : now;
  const day = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const start = new Date(qz.when).getTime();
  if(isNaN(start)) return '';
  const d = Math.round((day(start) - day(now)) / 86400000);
  if(now >= endOf(qz)) return 'This quiz is over.';
  if(now >= start) return 'The quiz is in progress.';
  if(d <= 0) return 'Quiz day is today.';
  return `${d} day${d === 1 ? '' : 's'} until the quiz.`;
}

/* A line of what the professor said: text, with <sub>, <sup>, <b>, <i> and <em>
   kept (step.js refuses any other tag); {{frac:a|b}} stacked by
   formulas-in-text when the course has it on, written (a)/(b) otherwise. */
const KEEP = /&lt;(\/?)(sub|sup|b|i|em)&gt;/g;
function lineHTML(t){
  const h = esc(t).replace(KEEP, '<$1$2>');
  const F = FX.api('formulas-in-text');
  return F ? F.richHTML(h) : h.replace(/\{\{frac:([^|{}]*)\|([^{}]*)\}\}/g, '($1)/($2)');
}

function cardHTML(qz){
  const pool = scopeOf(qz), c = ofKind(pool, 'concept').length, m = ofKind(pool, 'calc').length;
  const at = new Date(qz.when);
  const day = at.toLocaleDateString(undefined, {weekday: 'long', month: 'short', day: 'numeric'});
  const time = at.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'});
  const due = 'missed concepts first; stops when nothing is due';
  const n = k => `${k} question${k === 1 ? '' : 's'}`;
  const row = (title, sub, how, k) => `<div class="subrow"><span class="sname"><b>${title}</b><small>${sub}</small></span>
      <button data-qpquiz="${esc(qz.id)}" data-how="${how}" data-k="${k}"${how === 'sweep' ? ' class="ghost"' : ''}>Start</button></div>`;
  const said = qz.said || [];
  return `<div class="topic qpcard" data-qp="${esc(qz.id)}"><div class="qphead">
      <span class="qpname">${esc(qz.name)} — ${esc(day)}, ${esc(time)}<small>${esc(countdown(qz))}${qz.covers ? ' ' + esc(qz.covers) : ''}</small></span>
      <button class="btn ghost" data-qphide="${esc(qz.id)}" title="Hide the ${esc(qz.name)} prep card on this browser until the quiz is over">Hide</button></div>
    <div class="subs">
      ${qz.quote ? `<p class="qpquote">“${esc(qz.quote)}”</p>` : ''}
      ${said.length ? `<details class="qpsaid"><summary>What the professor said to prepare</summary>
        <ul class="tlist">${said.map(t => `<li>${lineHTML(t)}</li>`).join('')}</ul>
        ${qz.src ? `<p class="qpsrc">${esc(qz.src)}</p>` : ''}</details>` : ''}
      ${c && m ? row('Concepts on this quiz, adaptive', `${n(c)}, no arithmetic — ${due}`, 'adaptive', 'concept') : ''}
      ${c && m ? row('Calculations on this quiz, adaptive', `${n(m)}, each worked to a number — ${due}`, 'adaptive', 'calc') : ''}
      ${row('Everything on this quiz, adaptive', `${n(pool.length)} — ${due}`, 'adaptive', '')}
      ${row('Straight pass', `${n(pool.length)}, each asked once, shuffled, nothing held back by scheduling`, 'sweep', '')}
    </div></div>`;
}
const cardsHTML = () => quizzes().filter(live).map(cardHTML).join('');

/* A drill over a quiz's questions: adaptive (the scheduler picks, missed
   concepts come back first, it stops when nothing is due) or a straight pass.
   The Topics filter chips do not narrow it: the quiz names its own scope. */
function startDrill(id, how, k){
  const qz = quizById(id);
  if(!qz) return false;
  const all = scopeOf(qz), pool = k ? ofKind(all, k) : all;
  if(!pool.length){ alert('The bank holds no question on this quiz yet.'); return false; }
  const label = qz.name + ' prep' + (k === 'concept' ? ' — concepts' : k === 'calc' ? ' — calculations' : '');
  Q = {pool, label, current: null, answered: 0, lastId: null, examMode: false, picked: null, revealed: false};
  if(how === 'sweep') Object.assign(Q, {sweep: shuffle(pool.map(q => q.id)), i: 0});
  nextQuestion();
  show('quiz');
  return true;
}
function hide(id){ store.set(HIDE_KEY + id, '1'); }
function unhideAll(){ quizzes().forEach(qz => store.del(HIDE_KEY + qz.id)); }

/* The cards go under the build stamp and the What's new card, above the filters. */
function topicsCards(pane){
  if(pane.querySelector('#qpCards')) return;
  const h = cardsHTML();
  if(!h) return;
  const at = pane.querySelector('#news') || pane.querySelector('.stamp');
  const box = `<div id="qpCards">${h}</div>`;
  if(at) at.insertAdjacentHTML('afterend', box); else pane.insertAdjacentHTML('afterbegin', box);
  const el = pane.querySelector('#qpCards');
  el.querySelectorAll('button[data-qpquiz]').forEach(b => b.onclick = () => startDrill(b.dataset.qpquiz, b.dataset.how, b.dataset.k || null));
  el.querySelectorAll('button[data-qphide]').forEach(b => b.onclick = () => { hide(b.dataset.qphide); renderTopics(); });
}

X.rendered((pane, view) => { if(view === 'topics') topicsCards(pane); });
X.settings({
  title: 'Quiz prep cards',
  html(){
    const back = quizzes().filter(qz => ahead(qz) && hidden(qz));
    return back.length
      ? `<div class="filters"><div class="frow"><button class="btn ghost" id="qpUnhide">Show the hidden quiz card${back.length === 1 ? '' : 's'} again</button></div>
         <p class="qpnote">A card hidden with its Hide button stays hidden on this browser until the quiz has been sat. This puts it back on Topics: ${back.map(qz => esc(qz.name)).join(', ')}.</p></div>`
      : `<p class="qpnote">Each quiz the course lists has a card at the top of Topics until the quiz is over. No card is hidden.</p>`;
  },
  wire(el){ const b = el.querySelector('#qpUnhide'); if(b) b.onclick = () => { unhideAll(); renderSettings(); }; },
});
X.api({quizzes, scopeOf, kindOf, ahead, hidden, live, countdown, cardsHTML, startDrill, hide, unhideAll});
