#!/usr/bin/env python3
"""Assemble features/wrong-number-diagnosis/current/wrong-number-diagnosis.js: Basic-Pharmacokinetics
src/shell.html lines 1270-1338 at ac2eb73 (the reading of a wrong number, unchanged except that the
margin comes from the kit's grading), then the kit's hooks.

    python3 features/wrong-number-diagnosis/port_from_pk.py <Basic-Pharmacokinetics checkout>/src/shell.html
"""
import os, sys
PK = sys.argv[1] if len(sys.argv) > 1 else '../basic-pharmacokinetics-/src/shell.html'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'current', 'wrong-number-diagnosis.js')
L = open(PK, encoding='utf-8').read().split('\n')
body = '\n'.join(L[1270 - 1:1338])
assert body.startswith('/* ===') and body.rstrip().endswith('return out.slice(0, 2);\n}'), 'PK shell.html lines 1270-1338 are not the reading of a wrong number'
assert body.count('tolOf(q)') == 1
HEAD = r"""/* ==========================================================================
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
"""
TAIL = r"""
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
"""
open(OUT, 'w', encoding='utf-8').write(HEAD + '\n' + body + '\n' + TAIL)
print(f'wrote {OUT} ({len((HEAD + body + TAIL).splitlines())} lines)')
