/* ==========================================================================
   AN EXAM WHOSE QUESTION COUNT, POOL MARKS OR TIME LIMIT ARE NOT SET
   (course.js exams[].questions: null, pools[].marks: null, exams[].minutes: null)
   ==========================================================================
   skill/SKILL.md allows `questions: null` (the number of questions is not
   announced), `marks: null` on a pool and `minutes: null` (no time limit is
   announced). build.py puts this file into the page only when the active exam
   has one of them (a missing field counts the same as null); without them the
   page is unchanged. Before this file the
   engine drew a paper of 0 questions and stopped with a TypeError in
   renderExamQ, Topics said "null questions", and every display that weights
   by marks did arithmetic on null (BDK move assessment, 2026-11-01, §4).

   The question count not set:
   - the Exam view starts no paper and says so in one sentence; beginExam
     starts none, and drawPaper draws none (an empty list). A paper saved
     before the count was removed still comes back and can be finished.
   - Topics and Weak spots leave the count out of their lines.

   The marks of a pool not set (one such pool makes the whole exam
   unweighted, since a share of the paper cannot be read from the others; Louis
   chose this on 2026-11-01, "when any section lacks points, use unweighted
   behavior consistently"):
   - every question weighs 0 in markWeight, so each list the engine orders by
     marks at risk (the topic table, the kinds of question) is ordered by
     accuracy alone, the same with some pools' marks set as with none;
   - a paper (when the count is set) is drawn from all the pools together,
     with no share per pool: the engine's own draw, run with the pools taken
     as one pool of `questions` marks, so every other draw rule holds;
   - the marks figures are left out: the Weighting chips on Topics, the
     marks on each pool's card in Weak spots, and the "Marks at risk" columns,
     whose table "Where you are losing marks" is then "Accuracy by topic"
     (sorted by accuracy, the engine's own order when every weight is 0);
   - the exam-weighted pass on Topics is left out (with no marks there is no
     weighting to follow; "All N questions, one pass" stays), and the lines
     that say answers are weighted by what they are worth on the paper lose
     that clause.

   The time limit not set, with the question count set (Louis, 2026-11-01:
   untimed practice with measured elapsed time and manual submission): this
   file starts the paper untimed (ends: null, started: when it began). The
   engine (views.js) does the rest, so that a paper started untimed stays
   untimed after the course gains a time limit and this file is no longer in
   the page: it has no countdown and never ends by itself, the clock shows the
   time taken so far, it is submitted with its own buttons, the result says how
   long it took, and the paper saved for a reload is the engine's with
   `ends: null` and `started`. No time limit is made up. Topics leaves the
   minutes out of the exam line, and the opening page says the paper is untimed.

   How: renderTopics, renderGaps and filterBar are the engine's, with the
   figures taken out of what they drew (text and table cells only, so every
   button keeps its handler); renderExam, beginExam and drawPaper are wrapped.
   This file comes after exam_typed.js, so its wrappers sit outside that
   file's. A stub DOM (render_test.js) gets the Exam view, the draw and the
   filter chips; the other edits need a real page.
   ========================================================================== */
const EXAM_UNSET = (() => {
  const countUnset = () => EXAM.questions === null || EXAM.questions === undefined;
  const marksUnset = () => EXAM.pools.some(p => p.marks === null || p.marks === undefined);
  const minutesUnset = () => EXAM.minutes === null || EXAM.minutes === undefined;
  const untimed = () => !countUnset() && minutesUnset();
  const UNTIMED = 'No time limit is set in the course manifest, so this paper is untimed: it shows the time you take and ends when you submit it.';
  const hasBlueprint = () => !!(EXAM.blueprint && Array.isArray(EXAM.blueprint.parts) && EXAM.blueprint.parts.length);
  const NOT_SET = () => `The number of questions on ${esc(EXAM.name)} is not set in the course manifest, so no practice paper is drawn.`;
  const real = el => !!el && typeof el.querySelectorAll === 'function' && typeof el.querySelector === 'function'
    && typeof document.createTreeWalker === 'function';
  // replace text inside the text nodes under el
  const retext = (el, from, to) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()) if(from.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(from, to);
  };
  const literal = s => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  // one pool without marks: every question weighs the same (0), so nothing is ordered by marks
  if(marksUnset()) markWeight = () => 0;

  const engineDraw = drawPaper;
  drawPaper = function(){
    if(countUnset()) return [];
    if(!marksUnset() || hasBlueprint()) return engineDraw.apply(this, arguments);
    const pools = EXAM.pools;
    EXAM.pools = [{key:'all', name:'all pools', marks:EXAM.questions, filter:{}, test:q => pools.some(p => p.test(q))}];
    try { return engineDraw.apply(this, arguments); }
    finally { EXAM.pools = pools; }
  };

  const engineBegin = beginExam;
  beginExam = function(){
    if(countUnset()){ renderExam(); return; }
    const r = engineBegin.apply(this, arguments);
    if(untimed() && EX && EX.running && EX.ends !== null){
      // the engine set ends from minutes (now + 0); the paper is untimed instead, which the
      // engine itself saves, brings back, times and reports (views.js, untimedPaper)
      clearInterval(EX.timer);
      EX.ends = null; EX.started = Date.now();
      saveExam(); startClock(); renderExamQ();
    }
    return r;
  };

  const engineExam = renderExam;
  renderExam = function(){
    if(!countUnset()){
      const r = engineExam.apply(this, arguments);
      // a count and no time limit: the engine's opening page, with the clock sentence and the button made untimed
      const el = $('#v-exam');
      if(untimed() && !(EX && (EX.running || EX.done)) && real(el)){
        retext(el, / with an? (?:null|undefined)-minute clock\./, ' ' + UNTIMED);
        const b = document.getElementById('startExam'); if(b) b.textContent = 'Start the untimed paper';
      }
      return r;
    }
    if(!EX) restoreExam();
    if(EX && (EX.running || EX.done)) return engineExam.apply(this, arguments);
    $('#v-exam').innerHTML = `<h2>Exam simulation</h2>
  <p class="sub" id="examUnset">${NOT_SET()}</p>`;
  };

  const engineBar = filterBar;
  filterBar = function(){
    const h = engineBar.apply(this, arguments);
    return marksUnset() ? h.replace(/>(New|Older) \([^()<]* marks\)</g, '>$1<') : h;
  };

  const engineTopics = renderTopics;
  renderTopics = function(){
    const r = engineTopics.apply(this, arguments);
    const el = $('#v-topics');
    if(!real(el)) return r;
    const sub = el.querySelector('p.sub');
    if(sub && (countUnset() || minutesUnset())){
      // the engine's "<name>: <n> questions, <m> minutes" with the numbers that are not set left out
      const parts = [!countUnset() && `${EXAM.questions} questions`, !minutesUnset() && `${EXAM.minutes} minutes`].filter(Boolean);
      retext(sub, literal(`${EXAM.name}: ${EXAM.questions} questions, ${EXAM.minutes} minutes`), parts.length ? `${EXAM.name}: ${parts.join(', ')}` : EXAM.name);
    }
    if(marksUnset()){
      const row = el.querySelector('#sweepWeighted');
      if(row && row.closest('.subrow')) row.closest('.subrow').remove();
    }
    return r;
  };

  const engineGaps = renderGaps;
  renderGaps = function(){
    const r = engineGaps.apply(this, arguments);
    const el = $('#v-gaps');
    if(!real(el)) return r;
    const noMarks = marksUnset();
    el.querySelectorAll('.nextcard').forEach((card, i) => {
      const p = EXAM.pools[i], span = card.querySelector('.nexthead span');
      if(!p || !span) return;
      const n = conceptsIn(QUESTIONS.filter(p.test)).length;
      span.textContent = (noMarks ? '' : `${p.marks} mark${p.marks === 1 ? '' : 's'} · `) + `${n} concept${n === 1 ? '' : 's'}`;
    });
    if(!noMarks) return r;
    retext(el, /, weighted by what it is worth on the paper\./, '.');
    retext(el, / weighted by what each topic is worth on the paper/, '');
    el.querySelectorAll('table.gap').forEach(t => {
      const i = [...t.querySelectorAll('thead th')].findIndex(th => th.textContent.trim() === 'Marks at risk');
      if(i < 0) return;
      t.querySelectorAll('tr').forEach(tr => { if(tr.children[i]) tr.children[i].remove(); });
    });
    el.querySelectorAll('h3').forEach(h => {
      if(h.textContent.trim() !== 'Where you are losing marks') return;
      h.textContent = 'Accuracy by topic';
      const s = h.nextElementSibling;
      if(s && s.matches('p.sub') && /^Marks at risk/.test(s.textContent.trim())) s.remove();
    });
    return r;
  };

  return {countUnset, marksUnset, minutesUnset, untimed};
})();
