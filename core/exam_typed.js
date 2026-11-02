/* ==========================================================================
   CALCULATIONS AND MATCHING ON EXAM PAPERS (core option: exams[].typed)
   ==========================================================================
   build.py puts this file into the page only when an exam in course.js has
   `typed: true`. Without it the engine keeps numeric and matching items off
   every paper (views.js drawPaper and drawBlueprint draw only !q.type), as
   before. With it, the paper of an exam that allows them draws them too, by
   the same rules as every other item: the pools' marks and filters, one
   question per concept first, one wording per dupOf family, the select-all
   count. (Basic-Pharmacokinetics' Exam 3 was 20 multiple choice and 20 fill
   in the blank: its course.js, exam 3 blurb, at ac2eb73.)

   On the paper a calculation is typed (the number, its unit after it if the
   student wants), a matching item is a dropdown per row; both are kept as the
   student goes, graded as in the quiz (gradeNumeric: with course.js `numeric`
   the course's margin), recorded when the paper is submitted, and shown on the
   result page with the answer, the margin and the worked steps or the pairs.

   How: the engine's own draw is kept, and while it runs the numeric and
   matching items read as untyped (their `type` is set aside and put back,
   also when the draw throws), so every draw rule and every later fix to it
   applies to them. beginExam is the engine's, with the option order made only
   for items that have options. The question on screen and the result page are
   the engine's own, with the typed part added after them.
   ========================================================================== */
const EXAM_TYPED = (() => {
  const kinds = new Set(['numeric', 'match']);
  const allows = !!EXAM.typed;
  const typed = q => !!q && kinds.has(q.type);
  if(!allows) return {allows, typed};

  const engineDraw = drawPaper;
  drawPaper = function(){
    const set = QUESTIONS.filter(typed);
    set.forEach(q => { q._paperType = q.type; delete q.type; });
    try { return engineDraw.apply(this, arguments); }
    finally { set.forEach(q => { q.type = q._paperType; delete q._paperType; }); }
  };

  beginExam = function(){
    const qs = drawPaper();
    EX = {qs, i:0, picks:qs.map(q => isMulti(q) ? [] : null), running:true, done:false,
          ends: Date.now() + EXAM.minutes*60000, orders: qs.map(q => q.options ? shuffle(q.options.map((o,k)=>k)) : [])};
    saveExam();
    startClock();
    renderExamQ();
  };

  const engineRight = examRight;
  examRight = function(q, p){
    if(q.type === 'numeric') return p !== null && p !== undefined && String(p).trim() !== '' && gradeNumeric(q, p);
    if(q.type === 'match') return Array.isArray(p) && p.length === q.pairs.length && p.every((x, i) => x === i);
    return engineRight.apply(this, arguments);
  };

  /* the order the right-hand values are offered in, per paper item, kept for the visit */
  const rights = new WeakMap();
  const rightsOf = q => rights.get(q) || (rights.set(q, shuffle(q.pairs.map((p, i) => i))), rights.get(q));
  function typedBody(q, i){
    const p = EX.picks[i];
    if(q.type === 'numeric')
      return `<div class="numin"><input type="text" inputmode="decimal" id="exNum" value="${p === null || p === undefined ? '' : esc(p)}" placeholder="your answer" aria-label="your answer">${q.units ? `<span class="units">${esc(q.units)}</span>` : ''}</div>
        <p class="sub">Type the number; the unit may follow it.</p>`;
    const picks = Array.isArray(p) ? p : q.pairs.map(() => null);
    return `<table class="reftab matchtab"><thead><tr><th>${esc(q.left || '')}</th><th>${esc(q.right || '')}</th></tr></thead><tbody>${
      q.pairs.map((pr, r) => `<tr><td>${esc(pr.l)}</td><td><select data-exrow="${r}" aria-label="match for ${esc(pr.l)}"><option value="">—</option>${
        rightsOf(q).map(ri => `<option value="${ri}"${picks[r] === ri ? ' selected' : ''}>${esc(q.pairs[ri].r)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table>`;
  }
  const engineQ = renderExamQ;
  renderExamQ = function(){
    const r = engineQ.apply(this, arguments);
    const q = EX && EX.qs[EX.i];
    if(!typed(q)) return r;
    const el = $('#v-exam');
    if(!el || typeof el.querySelector !== 'function') return r;
    const body = el.querySelector('.qbody'), head = el.querySelector('.qhead');
    if(head) head.insertAdjacentHTML('afterbegin', `<span class="tag">${q.type === 'numeric' ? 'calculation' : 'match each row'}</span>`);
    if(!body) return r;
    body.insertAdjacentHTML('beforeend', typedBody(q, EX.i));
    const i = EX.i, count = () => {
      const n = EX.picks.filter((p, k) => !examBlank(EX.qs[k], p)).length, pr = el.querySelector('.examhead .prog');
      if(pr) pr.textContent = `Question ${EX.i + 1} of ${EX.qs.length} · ${n} answered`;
    };
    const inp = body.querySelector('#exNum');
    if(inp){
      inp.oninput = () => { EX.picks[i] = inp.value.trim() ? inp.value : null; saveExam(); count(); };
      inp.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); const n = $('#exNext'); if(n) n.click(); } };
    }
    body.querySelectorAll('select[data-exrow]').forEach(s => s.onchange = () => {
      const p = Array.isArray(EX.picks[i]) ? EX.picks[i] : q.pairs.map(() => null);
      p[+s.dataset.exrow] = s.value === '' ? null : +s.value;
      EX.picks[i] = p.some(x => x !== null) ? p : null;
      saveExam(); count();
    });
    return r;
  };

  function typedReview(q, p){
    if(q.type === 'numeric'){
      const ok = examRight(q, p), tol = typeof NUMERIC !== 'undefined' ? NUMERIC.tol(q) : (q.tol !== undefined ? q.tol : Math.abs(q.answer) * 0.01);
      return `<div class="why"><p class="verdict ${ok ? 'ok' : 'bad'}">${ok ? '✓ Correct' : '✗ Not correct'} — the answer is ${esc(fmtNum(q.answer))}${q.units ? ' ' + esc(q.units) : ''}${
        p === null || p === undefined ? '; left blank' : `; you wrote ${esc(p)}`} (accepted within ±${esc(fmtNum(tol))}${q.units ? ' ' + esc(q.units) : ''})</p>
        <ol class="steps">${(q.steps || []).map(s => `<li><span class="stepk">${esc(MISS_KINDS[s.k] || s.k)}</span><code>${esc(s.t)}</code>${s.why ? `<span class="stepwhy">${esc(s.why)}</span>` : ''}</li>`).join('')}</ol></div>`;
    }
    const picks = Array.isArray(p) ? p : q.pairs.map(() => null);
    return `<table class="reftab matchtab"><thead><tr><th>${esc(q.left || '')}</th><th>${esc(q.right || '')}</th><th></th></tr></thead><tbody>${
      q.pairs.map((pr, r) => { const ok = picks[r] === r, c = picks[r];
        return `<tr><td>${esc(pr.l)}</td><td>${ok ? esc(pr.r) : `<s>${c === null || c === undefined ? '—' : esc(q.pairs[c].r)}</s> ${esc(pr.r)}`}${pr.why ? `<div class="stepwhy">${esc(pr.why)}</div>` : ''}</td><td><span class="mark ${ok ? 'y' : 'n'}">${ok ? '✓' : '✗'}</span></td></tr>`; }).join('')}</tbody></table>`;
  }
  const engineResult = renderExamResult;
  renderExamResult = function(){
    const r = engineResult.apply(this, arguments);
    const pane = $('#v-exam');
    if(!pane || typeof pane.querySelectorAll !== 'function') return r;
    const cards = pane.querySelectorAll('.qcard');
    EX.qs.forEach((q, i) => {
      if(!typed(q) || !cards[i]) return;
      const body = cards[i].querySelector('.qbody'); if(!body) return;
      const stem = body.querySelector('.stem');
      (stem || body).insertAdjacentHTML(stem ? 'afterend' : 'beforeend', typedReview(q, EX.picks[i]));
    });
    return r;
  };

  const engineIntro = renderExam;
  renderExam = function(){
    const r = engineIntro.apply(this, arguments);
    if(!(EX && (EX.running || EX.done))){
      const start = $('#startExam'), n = QUESTIONS.filter(q => typed(q) && !q.lowYield && EXAM.pools.some(p => p.test(q))).length;
      if(start && typeof start.closest === 'function' && start.closest('p')) start.closest('p').insertAdjacentHTML('beforebegin', `<p class="sub" id="exTypedNote">This paper draws calculations and matching items too (${n} in the bank for this exam): type the number, or pick each match. They are graded as in the quiz.</p>`);
    }
    return r;
  };
  return {allows, typed, typedReview};
})();
