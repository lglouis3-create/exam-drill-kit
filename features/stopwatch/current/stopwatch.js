/* ==========================================================================
   THE STOPWATCH ON EACH CALCULATION (feature module stopwatch v1)
   ==========================================================================
   Ported from Basic-Pharmacokinetics src/views.js lines 1463-1482 at ac2eb73
   (PACE_MS, fmtClock, timerHTML, tickTimers), with the places that use them:
   line 1794 (the clock on the quiz card), 1890-1892 (the time taken), 3226,
   3290-3297, 3310 and 3371 (time per paper question) and 5762 (the tick).

   What the core already does with time, and keeps doing: the quiz records,
   with every answer, the time from drawing the question to the answer
   (`ms`, views.js nextQuestion and record); Weak spots lists "Right, but
   slow", the right answers that took at least twice the student's usual
   time for that kind of question; an exam paper has its own clock for the
   whole paper (a countdown, or the time taken on an untimed paper). The core
   shows no clock on a question, has no pace, and records no time for the
   answers of a paper.

   What this adds:
   - In the quiz, a clock on each calculation (type 'numeric'), running from
     the moment the question is drawn (the same start as the engine's `ms`).
     After the answer it stops and shows the time taken, read from the answer
     the engine recorded, so the clock and the record show the same time.
   - With the option `paceSeconds` (the professor's time per calculation;
     Basic-Pharmacokinetics: 120, its course.js line 264), a clock past the
     pace is red and says "over 2:00" in words, never colour alone; an
     answer within the pace is shown in green.
   - On an exam paper, the time on each question is added up while that
     question is on screen (going Back to it adds to it); a calculation on
     the paper (exams[].typed) shows its total as a running clock; when the
     paper is submitted each recorded answer keeps its question's total as
     `ms`, as Basic-Pharmacokinetics' paper did (views.js line 3371).
   Not ported: the one-page layout's "Start timer" button (the core has no
   one-page layout) and the time per kind of calculation on Weak spots
   (views.js 2160-2200, which groups by Basic-Pharmacokinetics' CALC_TYPES).
   ========================================================================== */
const PACE = Math.max(0, +OPT.paceSeconds || 0) * 1000;
const fmtClock = ms => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const PACE_TXT = PACE ? fmtClock(PACE) : '';
const TITLE = PACE ? `The professor's pace: ${PACE_TXT} or less per calculation` : 'Time on this calculation';
const isCalc = q => !!q && q.type === 'numeric';
const overTxt = ms => PACE && ms > PACE ? ' · over ' + PACE_TXT : '';

function timerHTML(start, took){
  if(took != null) return `<span class="qtimer done${PACE ? (took > PACE ? ' over' : ' under') : ''}" title="${TITLE}">⏱ took ${fmtClock(took)}${overTxt(took)}</span>`;
  const ms = Date.now() - start;
  return `<span class="qtimer${PACE && ms > PACE ? ' over' : ''}" data-start="${start}" title="${TITLE}">⏱ ${fmtClock(ms)}${overTxt(ms)}</span>`;
}
/* Once a second: the text node is changed in place (not replaced), so the
   engine's watch for redrawn panes is not woken every second. */
function tickTimers(){
  document.querySelectorAll('.qtimer[data-start]').forEach(el => {
    const ms = Date.now() - +el.dataset.start, t = '⏱ ' + fmtClock(ms) + overTxt(ms);
    if(el.firstChild && el.firstChild.nodeType === 3) el.firstChild.data = t; else el.textContent = t;
    if(PACE) el.classList.toggle('over', ms > PACE);
  });
}

/* the time the engine recorded for the last quiz answer, by question id */
let lastTook = null;

/* time per paper question: added up while the question is on screen */
let T = null;
function paperTick(next){
  if(!T || T.ex !== EX) T = {ex: EX, spent: EX.qs.map(() => 0), idx: null, mark: 0};
  const now = Date.now();
  if(T.idx != null) T.spent[T.idx] += now - T.mark;
  T.idx = next; T.mark = now;
}

function placeIn(head, html){
  if(!head || head.querySelector('.qtimer')) return;
  const sp = head.querySelector('.spacer');
  if(sp) sp.insertAdjacentHTML('afterend', html); else head.insertAdjacentHTML('beforeend', html);
}

X.rendered((pane, view) => {
  if(view === 'quiz'){
    const q = typeof Q !== 'undefined' && Q && Q.current;
    if(!isCalc(q)) return;
    const head = pane.querySelector('.qcard .qhead');
    if(!Q.revealed){ if(Q.startedAt) placeIn(head, timerHTML(Q.startedAt)); }
    else if(lastTook && lastTook.id === q.id && lastTook.ms != null) placeIn(head, timerHTML(null, lastTook.ms));
    return;
  }
  if(view === 'exam'){
    if(typeof EX === 'undefined' || !EX || !EX.running || !pane.querySelector('.examhead')) return;
    if(!T || T.ex !== EX || T.idx !== EX.i) paperTick(EX.i);
    const q = EX.qs[EX.i];
    if(isCalc(q)){
      const now = Date.now(), spent = T.spent[EX.i] + (now - T.mark);
      placeIn(pane.querySelector('.qcard .qhead'), timerHTML(now - spent));
    }
  }
});

X.after((q, result, picked, mode, entry) => {
  if(mode === 'exam'){
    if(typeof EX === 'undefined' || !EX || !entry) return;
    if(!T || T.ex !== EX) return;               // the paper was never on screen in this visit: no time kept for it
    if(T.idx != null) paperTick(EX.running ? T.idx : null);
    const i = EX.qs.indexOf(q);
    if(i >= 0 && T.spent[i] > 0 && entry.ms == null) entry.ms = Math.round(T.spent[i]);
    return;
  }
  if(isCalc(q)) lastTook = {id: q.id, ms: entry && entry.ms != null ? entry.ms : null};
});

X.start(() => { setInterval(tickTimers, 1000); });

X.api({fmtClock, pace: PACE, tickTimers, spent: () => (T && typeof EX !== 'undefined' && T.ex === EX ? T.spent.slice() : [])});
