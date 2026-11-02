/* ==========================================================================
   WHAT THE WRONG NUMBER SAYS (feature module wrong-number-diagnosis v1)
   ==========================================================================
   Ported from Basic-Pharmacokinetics src/shell.html lines 1270-1338 at
   ac2eb73 (missDiagnosis and its helpers, below unchanged). The kit's
   grading supplies parseNum and gradeNumeric (the core's, or numeric.js when
   course.js sets `numeric`) and the margin (tolOf).

   What it adds: after a wrong typed number, in the quiz and on an exam
   paper's result page, up to two lines say what the number is (a value in
   the middle of the working, a given carried across, two givens combined the
   wrong way, the key upside down, off by 0.693, off by a unit factor, the
   sign reversed, close but outside the margin) and which kind of miss that
   is. The student still picks the kind with the engine's own chips ("Where
   did your working leave the solution?"); the chip the number points to is
   marked. The pick is kept as the answer's `miss`, which is what the
   engine's Weak spots counts; the kind the number pointed to is kept beside
   it as `missSuggest`. A progress saved by Basic-Pharmacokinetics' own drill
   keeps the kind as `missKind`: when such a progress is loaded or imported,
   each answer with `missKind` and no `miss` gets `miss` from it, so those
   answers count in Weak spots once that course moves onto the core.
   ========================================================================== */
const tolOf = q => typeof NUMERIC !== 'undefined' ? NUMERIC.tol(q) : (q.tol !== undefined ? q.tol : Math.abs(q.answer) * 0.01);

/* ==========================================================================
   WHAT THE WRONG NUMBER SAYS
   ==========================================================================
   A wrong numeric answer is compared with the numbers that known slips
   produce: a given copied across, a value from the middle of the working, two
   givens combined the wrong way, the keyed answer upside down, off by ln 2,
   off by a unit factor, with its sign reversed, or close but outside the
   margin. Each match says what was done and which kind of miss that is. The
   student still chooses the kind; this puts the evidence next to the buttons,
   because a slip named wrongly sends the repair work to the wrong step. */
const fmtN = v => String(+(+v).toPrecision(4));
/* A student rounds to three figures, so a match is within 1% of a transformed key and within 0.6% of a value made from the givens or the working, where many candidates exist and a looser match would find one by chance. */
const nearTo = (x, y, rel = 0.01) => isFinite(x) && isFinite(y) && Math.abs(x - y) <= Math.max(rel * Math.abs(y), 1e-9);
const TIGHT = 0.006;
function numbersIn(text){
  const t = String(text || '').replace(/<[^>]+>/g, ' ').replace(/\{\{frac:([^|}]*)\|([^}]*)\}\}/g, ' $1 / $2 ');
  const out = [];
  for(const m of t.matchAll(/(^|[^A-Za-z\d.])(\d+(?:\.\d+)?)/g)){ const v = parseFloat(m[2]); if(v && !out.includes(v)) out.push(v); }
  return out;
}
function missDiagnosis(q, entered){
  const e = parseNum(entered), A = q.answer;
  if(!isFinite(e) || !isFinite(A) || gradeNumeric(q, entered)) return [];
  const out = [], push = (kind, text) => { if(!out.some(d => d.kind === kind)) out.push({kind, text}); };
  const givens = numbersIn(q.stem).filter(g => !nearTo(g, A));
  const E = String(e), K = fmtN(A);
  /* Each number with the unit written after it, in the stem and in the working.
     A working value counts only in the answer's own unit, so a stem's "80 kg"
     and a step's "80 mg/L" are two quantities and the reading names the one
     the student stopped at. */
  const plain = txt => String(txt || '').replace(/<[^>]+>/g, ' ').replace(/\{\{frac:([^|}]*)\|([^}]*)\}\}/g, ' $1 / $2 ');
  const toks = txt => [...plain(txt).matchAll(/(^|[^A-Za-z\d.])(\d+(?:\.\d+)?)\s*(%|[A-Za-zµ][A-Za-zµ⁻¹²]*(?:\/[A-Za-zµ]+)?)?/g)]
    .map(m => ({v: parseFloat(m[2]), u: (m[3] || '').toLowerCase(), raw: (m[2] + ' ' + (m[3] || '')).trim()})).filter(t => t.v && !nearTo(t.v, A));
  const unit = String(q.units || '').toLowerCase().replace(/\s+/g, '');
  const stemToks = toks(q.stem);
  const work = (q.steps || []).flatMap((st, i) => toks(st.t + ' ' + (st.why || '')).filter(t => t.v !== 0.693 && t.v !== 2.303).map(t => Object.assign(t, {i})));
  const wHit = work.find(t => nearTo(e, t.v, TIGHT) && t.u === unit && !stemToks.some(g => nearTo(g.v, t.v) && g.u === t.u));
  const gHit = stemToks.find(t => nearTo(e, t.v, TIGHT));
  if(wHit) push('setup', `${E} ${q.units || ''} is a value inside the working, at step ${wHit.i + 1}, so the working stopped there; the question asks for the quantity in the last step`);
  else if(gHit) push('setup', `${E} is the stem's "${gHit.raw}" carried across as the answer${gHit.u && gHit.u !== unit ? `, as ${q.units} where the stem had ${gHit.raw.replace(/^[\d.]+\s*/, '')}` : ''}`);
  const ops = (a, b) => [[a * b, `${fmtN(a)} × ${fmtN(b)}`], [a / b, `${fmtN(a)} ÷ ${fmtN(b)}`], [b / a, `${fmtN(b)} ÷ ${fmtN(a)}`],
                         [a + b, `${fmtN(a)} + ${fmtN(b)}`], [a - b, `${fmtN(a)} − ${fmtN(b)}`], [b - a, `${fmtN(b)} − ${fmtN(a)}`]];
  for(let i = 0; i < givens.length && !out.length; i++) for(let j = i + 1; j < givens.length && !out.length; j++){
    const cs = ops(givens[i], givens[j]);
    const hit = cs.find(([v]) => nearTo(e, v, TIGHT)); if(!hit) continue;
    const key = cs.find(([v]) => nearTo(A, v, TIGHT));
    if(key) push('algebra', `${E} is ${hit[1]}; the keyed ${K} is ${key[1]}. The right two givens, combined the wrong way round`);
    else if(cs.indexOf(hit) < 3) push('setup', `${E} is ${hit[1]}, two givens combined in one step: a step on the way with the working stopped there, or a line this question does not need`);   // a sum or difference of givens is a chance match more often than a slip
  }
  if(nearTo(e, 1 / A)) push('algebra', `${E} is 1 ÷ ${K}, the keyed answer upside down, so the line was rearranged the wrong way`);
  if(nearTo(e, A * 0.693)) push('setup', `${E} is ${K} × 0.693: a half-life stands where k belongs, or k where the half-life belongs`);
  if(nearTo(e, A / 0.693)) push('setup', `${E} is ${K} ÷ 0.693: a half-life stands where k belongs, or k where the half-life belongs`);
  const factors = [[1000, 'a unit prefix slipped: mg against µg or g, L against mL'], [1e6, 'a unit prefix slipped twice: g against µg'],
                   [100, 'a fraction and a percentage swapped, or a decimal place'], [10, 'a decimal place or a unit prefix'],
                   [60, 'minutes against hours'], [24, 'hours against days']];
  for(const [f, why] of factors){
    if(nearTo(e, A * f)) push('unit', `${E} is ${K} × ${f}: ${why}`);
    else if(nearTo(e, A / f)) push('unit', `${E} is ${K} ÷ ${f}: ${why}`);
  }
  if(nearTo(e, -A)) push('algebra', `${E} is ${K} with its sign reversed`);
  const ck = q.check || {};
  if(!out.length && ((isFinite(ck.lo) && e < ck.lo) || (isFinite(ck.hi) && e > ck.hi)))
    push('setup', `${E} lies outside what the stem allows${ck.t ? ': ' + (String(ck.t).match(/^.*?[.!?](?=\s|$)/) || [String(ck.t)])[0].replace(/[.!?]\s*$/, '') : ''}`);
  if(!out.length && Math.abs(e - A) <= 0.1 * Math.abs(A)){
    const pct = Math.round(1000 * Math.abs(e - A) / Math.abs(A)) / 10;
    push('round', `${E} is ${pct}% from the keyed ${K}, outside the margin of ±${fmtN(tolOf(q))}; a value in the working was rounded before the end`);
  }
  return out.slice(0, 2);
}

/* ---- the kit's hooks --------------------------------------------------- */
const KIND = k => (MISS_KINDS[k] || k);
const listHTML = d => `<div class="fxmiss"><p class="sub" style="margin:8px 0 4px"><b>What the number says:</b></p><ul class="fxmisslist">${
  d.map(x => `<li>${esc(x.text)}. <span class="fxmisskind">${esc(KIND(x.kind))}</span></li>`).join('')}</ul></div>`;

/* kept with the answer: the kind the number pointed to */
X.after((q, result, picked, mode, entry) => {
  if(!entry || q.type !== 'numeric' || result !== 'wrong') return;
  const d = missDiagnosis(q, picked);
  if(d.length){ entry.missSuggest = d[0].kind; save(); }
});

function quizCard(pane){
  const q = Q && Q.current;
  if(!q || q.type !== 'numeric' || !Q.revealed || Q.lastRight || pane.querySelector('.fxmiss')) return;
  const d = missDiagnosis(q, Q.picked);
  if(!d.length) return;
  const pick = pane.querySelector('.misspick');
  if(pick){
    const ask = pick.previousElementSibling && pick.previousElementSibling.tagName === 'P' ? pick.previousElementSibling : pick;
    ask.insertAdjacentHTML('beforebegin', listHTML(d));
    const chip = pick.querySelector(`[data-miss="${d[0].kind}"]`);
    if(chip){ chip.classList.add('fxsuggest'); chip.setAttribute('aria-describedby', 'fxmissnote');
              chip.insertAdjacentHTML('afterend', `<span class="meta" id="fxmissnote">the number points here</span>`); }
    return;
  }
  // already logged: say what the number pointed to when the pick differs
  const steps = pane.querySelector('.steps');
  if(steps) steps.insertAdjacentHTML('afterend', listHTML(d));
  const last = DB.answers[DB.answers.length - 1];
  const logged = Array.from(pane.querySelectorAll('p.sub')).find(p => /^Logged as a /.test(p.textContent));
  if(logged && last && last.qid === q.id && last.miss && last.missSuggest && last.miss !== last.missSuggest)
    logged.insertAdjacentHTML('beforeend', ` The number itself pointed to ${esc(KIND(last.missSuggest).toLowerCase())}.`);
}
function examResult(pane){
  if(!EX || !EX.done || pane.querySelector('.fxmiss')) return;
  const cards = pane.querySelectorAll('.qcard');
  EX.qs.forEach((q, i) => {
    if(q.type !== 'numeric' || !cards[i]) return;
    const d = missDiagnosis(q, EX.picks[i]);
    const at = cards[i].querySelector('.steps');
    if(d.length && at) at.insertAdjacentHTML('afterend', listHTML(d));
  });
}
X.rendered((pane, view) => {
  if(view === 'quiz') quizCard(pane);
  else if(view === 'exam') examResult(pane);
});

/* a progress saved by Basic-Pharmacokinetics' drill: missKind -> miss */
let converted = 0;
X.progress(db => {
  for(const a of (db.answers || [])) if(a && a.missKind && !a.miss){ a.miss = a.missKind; converted++; }
});
X.api({missDiagnosis, tolOf, converted: () => converted});
