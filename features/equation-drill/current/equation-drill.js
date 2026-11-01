/* ==========================================================================
   EQUATIONS: THE SHEET AND THE WRITING DRILL (feature module equation-drill v2)
   ==========================================================================
   Ported from Basic-Pharmacokinetics src/views.js at ac2eb73: the equation
   normaliser and the test that two spellings are the same equation (lines
   3843-4098), which equations are being worked on (4100-4129), the Equations
   tab and its drill (4131-4310, 4353-4585) and the derivation steps
   (4733-4741). The code below is that code; what changed for the kit:
   - the data is the course's EQUATIONS, in a data file listed in course.js
     `files` (the shape is in that course's src/equations.js header: lhs,
     tokens, disp, typed, also, lures, symbols, holds, derive, use, must, sheet,
     module, name, cite);
   - fractions come from the formulas-in-text module (module.json `needs`);
   - module names come from the option `groups` ({module number: name}), else
     "Module <n>"; the fold state is kept with the core's store;
   - each equation in the list opens what each symbol is, when it holds, how
     to reach it from a printed line, and its source (eqSheetHTML, new);
   - left out: the set-up drill ("Set-up only") and "How she asks it", which
     need the set-up data of plan-the-problem, the variables quiz (Tier 2),
     the exam chip, and the sheet map (its own data, sheet.js);
   - the professor is named as "the professor", not "she".
   Progress: the stats per equation are kept in the progress as DB.eq and the
   chosen equations as DB.settings.eqPick, as in that course, so they are
   exported, imported and erased with the rest.
   ========================================================================== */
const F = FX.api('formulas-in-text');
if(!F) throw new Error('equation-drill needs the formulas-in-text module switched on');
const {FRAC_RE, mathHTML, richHTML} = F;
if(typeof EQUATIONS === 'undefined' || !Array.isArray(EQUATIONS)) throw new Error('equation-drill needs EQUATIONS, in a data file listed in course.js `files`');
const LS = {get: k => store.get(k), set: (k, v) => store.set(k, v)};
const modShort = m => String(m);
const groupName = m => (OPT.groups && OPT.groups[m]) || ('Module ' + m);

const EQ_ENT = {'&minus;':'-', '&times;':'*', '&frac12;':'½', '&infin;':'∞', '&tau;':'τ',
                '&beta;':'beta', '&middot;':'*', '&amp;':'&', '&nbsp;':' ', '&rarr;':'\u2192'};
/* Display HTML to plain text. Subscripts resolve before superscripts, because
   a superscript can contain one: e^(-ka*t) is written with ka inside the sup. */
const eqPlain = h => String(h)
  .replace(FRAC_RE, '(($1)/($2))')
  .replace(/<sub>([^<]*)<\/sub>/g, '$1')
  .replace(/<sup>([^<]*)<\/sup>/g, '^($1)')
  .replace(/<[^>]+>/g, '')
  .replace(/&[a-z0-9]+;/gi, m => EQ_ENT[m] !== undefined ? EQ_ENT[m] : m);

const EQ_SUBS = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5',
  '₆':'6','₇':'7','₈':'8','₉':'9','ₐ':'a','ₑ':'e','ₕ':'h',
  'ᵢ':'i','ₖ':'k','ₗ':'l','ₘ':'m','ₙ':'n','ₒ':'o','ₚ':'p',
  'ᵣ':'r','ₛ':'s','ₜ':'t','ᵤ':'u','ᵥ':'v','ₓ':'x'};
const EQ_SUPS = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5',
  '⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+','ⁿ':'n',
  'ᵃ':'a','ᵇ':'b','ᵗ':'t','ᵏ':'k','ᵉ':'e','ᵖ':'p'};
const EQ_SUP_RE = new RegExp('[' + Object.keys(EQ_SUPS).join('') + ']+', 'g');
const EQ_SUB_RE = new RegExp('[' + Object.keys(EQ_SUBS).join('') + ']', 'g');

function normEq(s, keepCaretGroups){
  let t = String(s == null ? '' : s);
  t = t.replace(EQ_SUP_RE, m => '^' + [...m].map(c => EQ_SUPS[c]).join(''));
  t = t.replace(EQ_SUB_RE, c => EQ_SUBS[c]);
  t = t.replace(/(\s|\))[x×](\s|\()/g, '$1*$2');            // "k x VD": a spaced x is a times sign
  t = t.replace(/½/g, '1/2').toLowerCase();
  t = t.replace(/[−–—‐‑]/g, '-');  // every dash is a minus
  t = t.replace(/÷/g, '/');
  t = t.replace(/\*\*/g, '^');                              // before the star is dropped
  t = t.replace(/[×·⋅*]/g, keepCaretGroups ? '*' : '');   // multiplication is implicit
  t = t.replace(/∞/g, 'inf').replace(/→/g, 'to');
  t = t.replace(/[‘’“”]/g, '');
  t = t.replace(/[\s_,]/g, '');                             // V_D and VD are one thing
  t = t.replace(/half-?life/g, 't1/2').replace(/thalf|t-half/g, 't1/2');
  t = t.replace(/clearance/g, 'cl');
  t = t.replace(/tau/g, 'τ');                                // the dosing interval, typed as a word
  t = t.replace(/[\[\{]/g, '(').replace(/[\]\}]/g, ')');
  /* the height term of ideal body weight, however it is written:
     (inches over 5 ft), (in over 60), (h - 60), (height in inches - 60) */
  t = t.replace(/\((?:inches|inch|in|h|ht|height|heightininches|heightinin)(?:over|above|>|-)(?:60|5ft|5feet|five(?:ft|feet))\)/g, '(hx)');
  t = t.replace(/(?:inches|inch|in|height|heightininches)(?:over|above)(?:60|5ft|5feet|five(?:ft|feet))/g, '(hx)');
  t = t.replace(/(^|[^0-9])\.(\d)/g, '$10.$2');             // .693 -> 0.693
  t = t.replace(/log10/g, 'log');
  if(!keepCaretGroups) for(let i = 0; i < 8; i++) t = t.replace(/\^\(([^()]*)\)/g, '^$1');
  return t.replace(/\.$/, '');
}
/* Every spelling that counts as right, with and without the left side, since
   an answer typed as just the right-hand side answers the question asked. */
function eqAccepts(e){
  const out = new Set();
  for(const form of [e.typed, ...(e.also || []), eqPlain(e.lhs) + '=' + eqPlain(e.tokens.join(' '))]){
    const n = normEq(form);
    out.add(n);
    const i = n.indexOf('=');
    if(i > 0) out.add(n.slice(i + 1));
  }
  return out;
}
const eqRhs = e => e.tokens.join(' ');
/* How an equation is shown to be read: stacked as the slides print it where a
   display form exists, and as its pieces joined up where it does not. */
const eqShow = e => `<span class="eqshow">${e.lhs} = ${mathHTML(e.disp || eqRhs(e))}</span>`;
/* ---------- the same equation, spelled another way ----------
   A student who types VD*k for k*VD, or ln2/k for 0.693/k, or Cmax for
   Cmax,ss, has the equation. Spelling is compared first; where it differs,
   both right-hand sides are read as algebra and evaluated at the same random
   values of every symbol. Two expressions that agree at every point are the
   same expression. What still counts as different: which quantity is above
   the line, the sign of an exponent, and where a bracket closes, because
   those change the value. */
const EQ_FUNS = {ln: Math.log, log: Math.log10, exp: Math.exp, sqrt: Math.sqrt};
/* Every symbol the course's equations declare, in the normalised spelling, so
   a run of letters like kvd or fkad0 can be cut at the right places. */
const EQ_SYMS = (() => {
  const out = new Set(['e', 't', 'n', 'τ', 'hx', 'thalf', 'thalfa', 'thalfb', 'thalfbeta',
                       'age', 'ibw', 'scr', 'auc', 'aucpo', 'auciv', 'aucoral', 'auca', 'aucb',
                       'div', 'dpo', 'da', 'db', 'cn', 'tn', 'cl', 'clt', 'clr', 'clh',
                       'a', 'b', 'k', 'ka', 'ke', 'km', 'k0', 'k12', 'k21', 'vd', 'vp', 'vt',
                       'v', 'd0', 'dl', 'du', 'd', 'c0', 'cp', 'cp0', 'cs', 'c', 'css', 'cpeak',
                       'cmax', 'cmin', 'cavg', 'cav', 'tmax', 'f', 'fe', 'frel', 'r', 'kel']);
  const add = x => { const n = normEq(eqPlain(x), true).replace(/t1\/2/g, 'thalf').replace(/(ss|inf)$/, '');
                     if(/^[a-zτ][a-z0-9τ]*$/.test(n) && !/^(ln|log|exp)/.test(n)) out.add(n); };
  for(const e of (typeof EQUATIONS === 'undefined' ? [] : EQUATIONS)){
    add(e.lhs);
    for(const s of (e.symbols || [])) String(s[0]).split(/,|\band\b/).forEach(add);
  }
  return out;
})();
const EQ_SYM_LIST = [...EQ_SYMS].sort((a, b) => b.length - a.length);

/* Tokens: numbers, symbols (a letter run cut at known symbols, longest
   first), functions, operators and brackets. Adjacent atoms multiply, and
   that written-together product binds tighter than a division sign: a/bc is
   a/(bc), the way a one-line fraction is meant, while a/b*c with an explicit
   sign is (a/b)c. */
function eqTokens(src){
  const s = normEq(src, true).replace(/t1\/2/g, 'thalf');
  const out = [];
  let i = 0;
  while(i < s.length){
    const ch = s[i];
    if(/[0-9.]/.test(ch)){
      const m = s.slice(i).match(/^\d*\.?\d+|^\d+\.?/);
      if(!m) return null;
      out.push({t: 'num', v: parseFloat(m[0])}); i += m[0].length; continue;
    }
    if(/[a-zτ]/.test(ch)){
      const run = s.slice(i).match(/^[a-zτ][a-z0-9τ]*/)[0];
      let j = 0;
      while(j < run.length){
        const rest = run.slice(j);
        const dm = rest.match(/^\d+\.?\d*/);
        if(dm){ out.push({t: 'num', v: parseFloat(dm[0])}); j += dm[0].length; continue; }   // ln2, e2
        const fn = Object.keys(EQ_FUNS).find(f => rest.startsWith(f) && rest.length > f.length);
        const fnAtEnd = Object.keys(EQ_FUNS).find(f => rest === f) && s[i + run.length] === '(';
        if(fn || fnAtEnd){ const f = fn || rest; out.push({t: 'fn', v: f}); j += f.length; continue; }
        const sym = EQ_SYM_LIST.find(y => rest.startsWith(y));
        if(sym){ out.push({t: 'sym', v: sym === 'clt' ? 'cl' : sym}); j += sym.length; continue; }   // Cl and ClT are one quantity
        out.push({t: 'sym', v: rest[0]}); j += 1;               // an unknown letter is its own symbol
      }
      i += run.length; continue;
    }
    if('+-*/^()'.includes(ch)){ out.push({t: ch}); i++; continue; }
    return null;                                                 // a character algebra cannot read
  }
  return out;
}

/* A recursive-descent evaluator. `env` maps each symbol to a number.
   Levels, loosest first: sums; division and an explicit times sign, left to
   right; a written-together product; a power; an atom. An exponent written
   without brackets, as in e^-kt, runs to the end of the written-together
   product, which is how the slides and the string comparison both read it. */
function eqEval(tokens, env, loose){
  let p = 0;
  const peek = () => tokens[p], next = () => tokens[p++];
  const startsAtom = k => k && (k.t === 'num' || k.t === 'sym' || k.t === 'fn' || k.t === '(');
  function atom(){
    const k = peek();
    if(!k) throw 0;
    if(k.t === 'num'){ next(); return k.v; }
    if(k.t === 'sym'){ next(); return k.v === 'e' ? Math.E : env(k.v); }
    if(k.t === 'fn'){ next(); return EQ_FUNS[k.v](peek() && peek().t === '(' ? atom() : power()); }
    if(k.t === '('){ next(); const v = expr(); if(!peek() || peek().t !== ')') throw 0; next(); return v; }
    if(k.t === '-'){ next(); return -power(); }
    if(k.t === '+'){ next(); return power(); }
    throw 0;
  }
  function exponent(){
    let sign = 1;
    while(peek() && (peek().t === '-' || peek().t === '+')){ if(next().t === '-') sign = -sign; }
    if(peek() && peek().t === '(') return sign * atom();
    let v = atom();
    while(peek() && (peek().t === 'num' || peek().t === 'sym' || peek().t === 'fn')) v *= atom();
    return sign * v;
  }
  function power(){
    const base = atom();
    if(peek() && peek().t === '^'){ next(); return Math.pow(base, exponent()); }
    return base;
  }
  function juxta(){
    let v = power();
    while(!loose && startsAtom(peek())) v *= power();
    return v;
  }
  function term(){
    let v = juxta();
    for(;;){
      const k = peek();
      if(k && k.t === '/'){ next(); v /= juxta(); continue; }
      if(k && k.t === '*'){ next(); v *= juxta(); continue; }
      if(loose && startsAtom(k)){ v *= juxta(); continue; }
      return v;
    }
  }
  function expr(){
    let v = term();
    for(;;){
      const k = peek();
      if(k && k.t === '+'){ next(); v += term(); continue; }
      if(k && k.t === '-'){ next(); v -= term(); continue; }
      return v;
    }
  }
  const v = expr();
  if(p !== tokens.length) throw 0;
  return v;
}

/* Does a typed right-hand side agree with the keyed one at every point?
   Symbols take the same random values in both, drawn from a fixed sequence so
   the answer never changes between runs. Half a per cent of tolerance keeps
   0.693 and ln 2 together. The keyed form is read as written; the typed one
   is read both ways a one-line fraction can be meant, because "/(72)(SCr)"
   puts the second bracket under the line and "/(VD(ka - k))(e^-kt - e^-kat)"
   does not, and nothing in the string says which. */
function eqEquiv(key, typed){
  const tk = eqTokens(key), tt = eqTokens(typed);
  if(!tk || !tt || !tk.length || !tt.length) return false;
  let seed = 7;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return 0.3 + 1.4 * (seed / 2147483647); };
  const same = (x, y) => Math.abs(x - y) <= 0.005 * Math.max(Math.abs(x), Math.abs(y), 1e-9);
  let tight = true, loose = true, good = 0;
  for(let trial = 0; trial < 7 && (tight || loose); trial++){
    const vals = {};
    const env = name => (name in vals ? vals[name] : (vals[name] = rnd()));
    let vk, v1, v2;
    try{ vk = eqEval(tk, env); }catch(_){ return false; }
    try{ v1 = eqEval(tt, env); }catch(_){ v1 = NaN; }
    try{ v2 = eqEval(tt, env, true); }catch(_){ v2 = NaN; }
    if(!isFinite(vk)) continue;
    if(!isFinite(v1) || !same(vk, v1)) tight = false;
    if(!isFinite(v2) || !same(vk, v2)) loose = false;
    good++;
  }
  return good >= 3 && (tight || loose);
}
/* The left side is the quantity the exercise names, so it is read loosely:
   Cmax for Cmax,ss, C for Cp, IBW for IBWmale, ClT for Cl. */
function eqLhsKey(x){
  return normEq(x, true).replace(/(ss|inf|male|female)$/, '').replace(/^cp$/, 'c');
}
const eqLhsMatch = (a, b) => { const x = eqLhsKey(a), y = eqLhsKey(b); return !x || !y || x === y || x.startsWith(y) || y.startsWith(x); };
function eqSplit(form){
  const n = String(form == null ? '' : form);
  const i = n.indexOf('=');
  return i < 0 ? ['', n] : [n.slice(0, i), n.slice(i + 1)];
}
function eqSame(e, typed){
  const [lt, rt] = eqSplit(typed);
  if(!rt.trim()) return false;
  const forms = [e.typed, ...(e.also || []), eqPlain(e.lhs) + '=' + eqPlain(e.tokens.join(' '))];
  for(const form of forms){
    const [lk, rk] = eqSplit(form);
    if(!eqLhsMatch(lk, lt)) continue;
    if(eqEquiv(rk, rt)) return true;
  }
  return false;
}
/* A spelling match that the algebra contradicts is not a match: R/k*VD folds
   to the same string as R/kVD once the star is dropped, but reads as (R/k)VD. */
function eqRefuted(e, typed){
  const rt = eqSplit(typed)[1];
  const forms = [e.typed, ...(e.also || [])];
  if(!eqTokens(rt) || !eqTokens(eqSplit(e.typed)[1])) return false;
  return !forms.some(f => eqEquiv(eqSplit(f)[1], rt));
}
function eqCorrect(e, typed){
  if(eqAccepts(e).has(normEq(typed))) return !eqRefuted(e, typed);
  if(eqSame(e, typed)) return true;
  /* a capital T on its own is the dosing interval, typed without a Greek keyboard */
  const asTau = String(typed == null ? '' : typed).replace(/T(?![A-Za-z0-9½\/])/g, 'τ');
  return asTau !== typed && (eqAccepts(e).has(normEq(asTau)) || eqSame(e, asTau));
}

/* ---------- which equations are being worked on ---------- */
const EQ_BY_ID = Object.fromEntries(EQUATIONS.map(e => [e.id, e]));
const EQ_MUST = EQUATIONS.filter(e => e.must).map(e => e.id);
function eqChosen(){
  const s = DB.settings.eqPick;
  const valid = Array.isArray(s) ? s.filter(id => EQ_BY_ID[id]) : null;
  return valid && valid.length ? valid : EQ_MUST.slice();
}
function eqSetChosen(ids){
  DB.settings.eqPick = ids.filter(id => EQ_BY_ID[id]);
  save();
}
/* How many correct answers in a row an equation is held to before it counts as
   learned. Typing one out once is recall with the question still on screen;
   the point of the drill is to be able to do it again cold. */
const EQ_STREAK = 3;
function eqStat(id){
  const s = (DB.eq || {})[id];
  return s || {seen:0, right:0, wrong:0, streak:0, mode:{}};
}
function eqRecord(id, mode, ok){
  if(!DB.eq) DB.eq = {};
  const s = DB.eq[id] || (DB.eq[id] = {seen:0, right:0, wrong:0, streak:0, mode:{}});
  s.seen++;
  if(ok){ s.right++; s.streak++; } else { s.wrong++; s.streak = 0; }
  s.mode[mode] = (s.mode[mode] || 0) + (ok ? 1 : 0);
  s.at = Date.now();
  save();
}
const eqLearned = id => eqStat(id).streak >= EQ_STREAK;

/* ---------- the view ---------- */
let EQ = null;   /* {queue:[id], i, mode:'type'|'build', slots:[], tray:[], revealed, ok} */

const SHEET_TAG = {
  no:      ['not on the sheet', 'The professor said this one is not on the sheet'],
  yes:     ['on the sheet', 'The equation sheet carries it'],
  absent:  ['not on the sheet', 'No line of the equation sheet prints it; the professor did not say either way'],
};

function renderEq(){
  const el = $('#v-eq');
  if(EQ){ el.innerHTML = eqDrillHTML(); eqDrillWire(el); return; }
  el.innerHTML = eqPickerHTML();
  eqPickerWire(el);
}

const EQ_FOLD_KEY = NS + ':eqfold';
const eqFold = () => LS.get(EQ_FOLD_KEY) === 'closed' ? 'closed' : 'open';   // the modules start open, as before
function eqPickerHTML(){
  const chosen = new Set(eqChosen());
  const learned = [...chosen].filter(eqLearned).length;
  let h = `<h2>Equations</h2>
  <p class="sub">Every equation in the course's list, grouped by module: what each symbol is, when it holds and how to reach it, and a writing drill.</p>
  <details class="tabhelp" open><summary>What this tab is for</summary><ul>
  <li><b>Write the equations from memory.</b> Type one out (what the exam asks for) or build it from pieces, some of them wrong.</li>
  <li><b>Each equation is marked</b> on the sheet, not on the sheet, or one the professor said to memorise; start with those.</li>
  <li><b>Symbols, when it holds</b> under each equation opens what each symbol is, the condition it holds under and, for a line the sheet does not print, how to reach it from one it does.</li>
  <li><b>Learned</b> means ${EQ_STREAK} correct in a row; one wrong answer puts it back to nothing. Tick the ones to work on; the drill asks only those.</li>
  <li>Nothing here is scored against the question bank or Weak spots.</li>
  </ul></details>`;

  h += `<div class="topic sweepcard"><div class="subs">
    <div class="subrow"><span class="sname"><b>Type them out</b>
      <small>The equation is named and you write it. This is what the exam asks for.</small></span>
      <button data-start="type"${chosen.size ? '' : ' disabled'}>Start</button></div>
    <div class="subrow"><span class="sname"><b>Build them from pieces</b>
      <small>The pieces are given, some of them wrong, and you place them in order</small></span>
      <button data-start="build"${chosen.size ? '' : ' disabled'} class="ghost">Start</button></div>
    <div class="subrow"><span class="sname"><b>Both, alternating</b>
      <small>Builds first, then types the same equation, which is the order that makes typing possible</small></span>
      <button data-start="mix"${chosen.size ? '' : ' disabled'} class="ghost">Start</button></div>
  </div></div>`;

  const derived = EQUATIONS.filter(e => e.sheet !== 'yes' && !e.must);
  h += `<div class="filters"><div class="frow"><label>Choose</label>
    <button class="chip" data-pick="must">The ${EQ_MUST.length} said to memorise</button>
    <button class="chip" data-pick="derived" title="Not printed on the sheet, but reached from a printed line in a step or two">The ${derived.length} not printed but reached from the sheet</button>
    <button class="chip" data-pick="unprinted">All ${EQ_MUST.length + derived.length} the sheet does not print</button>
    <button class="chip" data-pick="all">All ${EQUATIONS.length}</button>
    <button class="chip" data-pick="none">None</button>
    <button class="chip" data-pick="unlearned">Only the ones not yet learned</button>
    </div><div class="frow"><label>One module</label>
    ${[...new Set(EQUATIONS.map(e => e.module))].sort((a, b) => a - b).map(m => `<button class="chip" data-pick="m:${m}" title="Drill this module's equations and no others">Module ${esc(modShort(m))}</button>`).join('')}
    </div><div class="frow"><label>Selected</label>
    <span class="sub" style="margin:0">${chosen.size} equation${chosen.size===1?'':'s'}${
      chosen.size ? `, ${learned} learned` : ''}</span></div></div>`;

  const mods = [...new Set(EQUATIONS.map(e => e.module))].sort((a,b) => a-b);
  const modName = groupName;
  const fold = eqFold();
  h += `<div class="foldbar"><span>Modules</span><button class="chip" data-eqfold="open" aria-pressed="${fold === 'open'}">Expand all</button><button class="chip" data-eqfold="closed" aria-pressed="${fold === 'closed'}">Collapse all</button></div>`;
  for(const m of mods){
    const es = EQUATIONS.filter(e => e.module === m);
    h += `<details class="module" id="eq-m${m}"${fold === 'open' ? ' open' : ''}><summary>
      <span class="mname">${esc(modName(m))}<small>${es.length} equations ·
        ${es.filter(e => chosen.has(e.id)).length} selected</small></span>
      <button class="chip" data-modpick="${m}" title="Add every equation of this module to the selection">Add all</button></summary><div class="mfoot">`;
    for(const e of es){
      const st = eqStat(e.id), done = eqLearned(e.id);
      const tag = SHEET_TAG[e.sheet] || SHEET_TAG.absent;
      h += `<div class="subrow eqrow">
        <label class="eqpick"><input type="checkbox" data-eq="${esc(e.id)}"${chosen.has(e.id)?' checked':''}>
          <span class="sname"><b>${esc(e.name)}</b>
            <span class="eqline">${eqShow(e)}</span>
            <small>${e.must ? '<b class="must">said to memorise</b> · ' : ''}<span title="${esc(tag[1])}">${tag[0]}</span>${
              st.seen ? ` · ${st.right} right of ${st.seen}` : ''}</small></span></label>
        ${done ? '<span class="eqdone">learned</span>'
               : st.streak ? `<span class="counts">${st.streak}/${EQ_STREAK}</span>` : ''}
      </div>${eqSheetHTML(e)}`;
    }
    h += `</div></details>`;
  }
  return h;
}

function eqPickerWire(el){
  el.querySelectorAll('input[data-eq]').forEach(b => b.onchange = () => {
    const set = new Set(eqChosen());
    b.checked ? set.add(b.dataset.eq) : set.delete(b.dataset.eq);
    eqSetChosen([...set]);
    renderEq();
  });
  el.querySelectorAll('button[data-pick]').forEach(b => b.onclick = () => {
    const p = b.dataset.pick;
    eqSetChosen(p === 'must' ? EQ_MUST
              : p === 'derived' ? EQUATIONS.filter(e => e.sheet !== 'yes' && !e.must).map(e => e.id)
              : p === 'unprinted' ? EQUATIONS.filter(e => e.sheet !== 'yes').map(e => e.id)
              : p === 'all'  ? EQUATIONS.map(e => e.id)
              : p === 'none' ? []
              : /^m:/.test(p) ? EQUATIONS.filter(e => e.module === +p.slice(2)).map(e => e.id)
              : EQUATIONS.filter(e => !eqLearned(e.id)).map(e => e.id));
    renderEq();
  });
  el.querySelectorAll('button[data-modpick]').forEach(b => b.onclick = ev => {
    ev.preventDefault();
    const set = new Set(eqChosen());
    EQUATIONS.filter(e => e.module === +b.dataset.modpick).forEach(e => set.add(e.id));
    eqSetChosen([...set]);
    renderEq();
  });
  el.querySelectorAll('button[data-start]').forEach(b => b.onclick = () => eqStart(b.dataset.start));
  el.querySelectorAll('button[data-eqfold]').forEach(b => b.onclick = () => { LS.set(EQ_FOLD_KEY, b.dataset.eqfold); renderEq(); });
}

/* A pass over the chosen equations. The queue is shuffled so the order they
   were ticked in is not the order they are asked in, which is the whole point
   of drilling a list rather than reading it. */
function eqStart(mode){
  const ids = shuffle(eqChosen().slice());
  if(!ids.length) return;
  EQ = {from: VIEW, queue: ids, i: 0, mode, step: mode === 'mix' ? 'build' : mode,
        slots: [], tray: [], revealed: false, ok: false, typed: '', right: 0, asked: 0};
  eqLoad();
}
/* The build layout: the slots laid out the way the sheet prints the line,
   numerator over denominator, read from the equation's `disp`. Each
   operand token takes a slot; the '/' and '×' tokens are the structure and
   are drawn as the fraction bar or the glue between slots, not placed. When
   the pieces cannot be matched to the display (a piece that is itself a
   ratio, or a line with no stacked display) the slots stay in a row. */
const EQ_OP = t => /^(\/|&times;|×|\*)$/.test(String(t).trim());
/* A piece that opens a bracket the next piece closes ("(AUCpo", "AUCIV)")
   loses that stray bracket in the stacked layout, where the bar does the
   grouping; a piece whose brackets balance keeps them. */
const eqTileText = t => { const s = String(t), o = (s.match(/[(\[]/g) || []).length, c = (s.match(/[)\]]/g) || []).length;
  return o === c ? s : s.replace(/^[(\[]+/, '').replace(/[)\]]+$/, ''); };
const eqNorm = s => deEnt(String(s)).replace(/<[^>]+>/g, '').toLowerCase().replace(/[\s()\[\]×*\/]/g, '').replace(/−/g, '-');
function eqLayout(e){
  if(!e.disp || !/\{\{frac:/.test(e.disp)) return null;
  const ops = e.tokens.map((t, i) => EQ_OP(t) ? null : i).filter(i => i !== null);   // operand indices in order
  let pos = 0;
  const take = target => {                       // consume operands whose joined text is the target
    const out = []; let acc = '';
    while(pos < ops.length && acc.length < target.length){
      const n = eqNorm(e.tokens[ops[pos]]); if(!n){ pos++; continue; }
      if(!target.startsWith(acc + n)) return null;
      acc += n; out.push(ops[pos]); pos++;
    }
    return acc === target ? out : null;
  };
  const parts = [];
  const re = /\{\{frac:([^|}]*)\|([^}]*)\}\}/g; let last = 0, m;
  const plain = txt => {
    if(!txt) return true;
    const t = eqNorm(txt);
    if(!t){ if(txt.trim()) parts.push({kind: 'glue', html: txt}); return true; }
    const save = pos, got = take(t);
    if(got){ parts.push({kind: 'row', idx: got}); return true; }
    pos = save; parts.push({kind: 'glue', html: txt}); return true;   // text that is not a piece (ln, brackets)
  };
  while((m = re.exec(e.disp))){
    if(!plain(e.disp.slice(last, m.index))) return null;
    const num = take(eqNorm(m[1])); if(!num) return null;
    const den = take(eqNorm(m[2])); if(!den) return null;
    parts.push({kind: 'frac', num, den}); last = m.index + m[0].length;
  }
  if(!plain(e.disp.slice(last))) return null;
  return pos === ops.length ? parts : null;
}

function eqTrayPieces(e, layout){
  const tileKey = t => eqNorm(eqTileText(t));
  const right = new Set(e.tokens.map(tileKey));
  return [...e.tokens, ...(e.lures || [])].map((t, i) => ({t, i, lure: i >= e.tokens.length}))
    .filter(x => !layout || !EQ_OP(x.t))
    .filter(x => !(layout && x.lure && tileKey(x.t) && right.has(tileKey(x.t))))
    .map(({t, i}) => ({t, i}));
}
function eqLoad(){
  const e = EQ_BY_ID[EQ.queue[EQ.i]];
  EQ.revealed = false; EQ.ok = false; EQ.shown = false; EQ.overrode = false; EQ.typed = '';
  EQ.trayOf = {}; EQ.sel = null;   // a new equation starts with no piece placed and no box chosen
  if(e && EQ.step === 'build'){
    EQ.layout = eqLayout(e);
    EQ.slots = e.tokens.map(t => EQ.layout && EQ_OP(t) ? t : null);   // the structure is drawn, not placed
    EQ.tray  = shuffle(eqTrayPieces(e, !!EQ.layout));
  }
  renderEq();
}

function eqDrillHTML(){
  const e = EQ_BY_ID[EQ.queue[EQ.i]];
  if(!e) return eqDoneHTML();
  const st = eqStat(e.id);
  const building = EQ.step === 'build';
  let h = `<p><button class="btn ghost" id="eqBack" type="button">← Stop, choose equations</button></p><div class="qcard"><div class="qhead">
    <span>${esc(building ? 'Build it' : 'Type it out')}</span>
    <span class="spacer"></span>
    <span>${eqLearned(e.id) ? 'learned' : st.streak ? st.streak + ' of ' + EQ_STREAK + ' in a row' : 'not yet'}</span>
  </div>
  <div class="qprog">
    <span>equation ${EQ.i + 1} of ${EQ.queue.length}</span>
    <span class="pbar"><i style="width:${Math.round(100 * EQ.i / EQ.queue.length)}%"></i></span>
    <span>${EQ.asked ? EQ.right + ' right of ' + EQ.asked : 'nothing asked yet'}</span>
  </div>
  <div class="qbody">
    <p class="stem">${esc(e.name)}</p>
    <p class="eqask">${building
      ? 'Place the pieces to the right of the equals sign. Some of them do not belong.'
      : 'Write it out. Capitals, spaces, the order of the factors and how you write the multiplication do not matter.'}</p>`;

  if(building){
    const slotBtn = i => { const s = EQ.slots[i];
      /* An accepted build is right in every slot, even when its factors sit in
         another order than the printed line (k × fe for fe × k); only a wrong
         build is marked slot by slot against the printed order. */
      const cls = EQ.revealed ? (EQ.ok || normEq(eqPlain(s || '')) === normEq(eqPlain(e.tokens[i])) ? ' ok' : ' bad') : '';
      const sel = !EQ.revealed && EQ.sel === i ? ' sel' : '';   // the box the next piece goes into
      return `<button class="eqslot${cls}${s ? ' full' : ''}${sel}" data-slot="${i}" aria-pressed="${!!sel}"${EQ.revealed ? ' disabled' : ''}
        aria-label="Position ${i + 1} of ${EQ.slots.length}">${s ? (EQ.layout ? eqTileText(s) : s) : '&nbsp;'}</button>`; };
    h += `<div class="eqbuild"><span class="eqlhs">${e.lhs} =</span>`;
    if(EQ.layout){
      h += EQ.layout.map(p => p.kind === 'glue' ? `<span class="eqglue">${p.html}</span>`
        : p.kind === 'row' ? p.idx.map(slotBtn).join('')
        : `<span class="eqfrac"><span class="eqfn">${p.num.map(slotBtn).join('')}</span><span class="eqfd">${p.den.map(slotBtn).join('')}</span></span>`).join('');
    }else EQ.slots.forEach((s, i) => { h += slotBtn(i); });
    h += `</div>`;
    if(!EQ.revealed){
      h += `<p class="sub eqhint">${EQ.sel != null ? 'Box selected: tap a piece to put it there, or tap the box again to unselect it.'
        : 'Tap a piece to fill the next empty box, or tap a box first to choose where it goes. Tap a filled box to empty it.'}</p>`;
      const placed = new Set(EQ.slots.map((_, i) => EQ.trayOf && EQ.trayOf[i]).filter(x => x != null));
      h += `<div class="eqtray">${EQ.tray.map(t =>
        `<button class="eqtile${placed.has(t.i) ? ' used' : ''}" data-tile="${t.i}"${
          placed.has(t.i) ? ' disabled' : ''}>${EQ.layout ? eqTileText(t.t) : t.t}</button>`).join('')}</div>`;
    }
  }else{
    h += `<div class="eqtype"><span class="eqlhs">${e.lhs} =</span>
      <input id="eqIn" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
        value="${esc(EQ.typed)}"${EQ.revealed ? ' disabled' : ''}
        class="${EQ.revealed ? (EQ.ok ? 'ok' : 'bad') : ''}"
        aria-label="The right-hand side of ${esc(e.name)}" placeholder="the right-hand side"></div>
    <p class="sub eqhint">Type <code>*</code> or nothing at all for multiplication, <code>/</code> for a division,
      <code>^</code> for a power, and plain letters for subscripts: <code>VD</code>, <code>ka</code>, <code>Cp</code>.</p>`;
  }

  if(EQ.revealed){
    h += `<div class="why"><p class="verdict ${EQ.ok ? 'ok' : 'bad'}">${
      EQ.ok ? (EQ.overrode ? '✓ Counted as right' : '✓ Correct') : '✗ Not correct'}</p>
      <p class="eqanswer"><b>${eqShow(e)}</b></p>`;
    if(EQ.ok && building && EQ.slots.some((s, i) => normEq(eqPlain(s || '')) !== normEq(eqPlain(e.tokens[i]))))
      h += `<p class="prose">Your order is the same equation, because the pieces you swapped give the same result in either order (a product or a sum). The sheet prints it in the order above.</p>`;
    if(!EQ.ok && !building && EQ.typed.trim())
      h += `<p class="prose">You wrote <code>${esc(EQ.typed.trim())}</code>, which reads as
        <code>${esc(normEq(EQ.typed))}</code> once capitals and spacing are set aside. Spelling and
        order do not matter; what is above the line, the sign in an exponent and where a bracket
        closes do.</p>`;
    if(EQ.ok && !building && EQ.typed.trim() && !eqAccepts(e).has(normEq(EQ.typed))
       && !eqAccepts(e).has(normEq(eqPlain(e.lhs) + '=' + EQ.typed)))
      h += `<p class="prose">You wrote <code>${esc(EQ.typed.trim())}</code>: a different spelling of the
        same equation.</p>`;
    if(e.symbols && e.symbols.length)
      h += `<h5 class="tsec">What each symbol is</h5><ul class="tlist">${
        e.symbols.map(s => `<li><b>${s[0]}</b> — ${s[1]}</li>`).join('')}</ul>`;
    if(e.holds) h += `<h5 class="tsec">When it holds</h5><p class="prose">${richHTML(e.holds)}</p>`;   // entities and {{frac}} render
    if(e.derive) h += `<h5 class="tsec">Not on the sheet: how to get there</h5>${deriveBodyHTML(e)}`;
    if(e.must) h += `<p class="prose"><b>The professor said to memorise this one.</b> It is not on the equation sheet.</p>`;
    h += `<div class="cite">${esc(e.cite)}</div>`;
    h += `</div>`;
  }
  h += `</div><div class="qfoot">`;
  if(!EQ.revealed){
    const ready = building ? EQ.slots.every(s => s !== null) : true;
    h += `<button class="btn" id="eqCheck"${ready ? '' : ' disabled'}>Check</button>`;
    if(building) h += `<button class="btn ghost" id="eqClear">Clear</button>`;
    h += `<button class="btn ghost" id="eqShow">Show me</button>`;
  }else{
    h += `<button class="btn" id="eqNext">Next</button>`;
    if(!EQ.ok && !EQ.shown && !building) h += `<button class="btn ghost" id="eqRight" title="A typing slip: count it as right">No, I was right</button>`;
  }
  h += `<button class="btn ghost" id="eqStop">Choose equations</button></div></div>`;
  return h;
}

function eqDoneHTML(){
  const learned = eqChosen().filter(eqLearned).length;
  return `<div class="empty">
    <p><b>That is every equation in this set — ${EQ.right} right of ${EQ.asked}.</b></p>
    <p style="margin:10px 0 16px">${learned} of ${eqChosen().length} selected
      ${learned === 1 ? 'equation is' : 'equations are'} learned, meaning ${EQ_STREAK} correct
      answers in a row. Going round again is what turns the rest over.</p>
    <p style="display:flex;gap:9px;flex-wrap:wrap;justify-content:center">
      <button class="btn" id="eqAgain">Go round again</button>
      <button class="btn ghost" id="eqStop">Choose equations</button>
    </p></div>`;
}

function eqDrillWire(el){
  const e = EQ_BY_ID[EQ.queue[EQ.i]];
  const stop = () => { EQ = null; renderEq(); };
  const byId = i => document.getElementById(i);
  if(byId('eqStop')) byId('eqStop').onclick = stop;
  if(byId('eqBack')) byId('eqBack').onclick = stop;
  if(byId('eqAgain')) byId('eqAgain').onclick = () => eqStart(EQ.mode);
  if(!e) return;

  /* Tap a slot to select it, then tap a piece; or tap a piece to drop it into
     the first empty slot. Dragging works too where a mouse is present, but
     tapping is what has to work, since this is read on a phone. */
  el.querySelectorAll('.eqslot').forEach(b => b.onclick = () => {
    const i = +b.dataset.slot;
    if(EQ.layout && EQ_OP(e.tokens[i])) return;  // a drawn operator is part of the structure, not a piece
    if(EQ.slots[i] !== null){                     // tapping a filled slot empties it
      EQ.slots[i] = null;
      if(EQ.trayOf) delete EQ.trayOf[i];
    }else{
      EQ.sel = EQ.sel === i ? null : i;
    }
    renderEq();
  });
  el.querySelectorAll('.eqtile').forEach(b => {
    b.onclick = () => eqPlace(+b.dataset.tile);
    b.draggable = true;
    b.ondragstart = ev => { ev.dataTransfer.setData('text/plain', b.dataset.tile); };
  });
  el.querySelectorAll('.eqslot').forEach(b => {
    b.ondragover = ev => ev.preventDefault();
    b.ondrop = ev => {
      ev.preventDefault();
      const t = +ev.dataTransfer.getData('text/plain');
      if(!isNaN(t)) eqPlace(t, +b.dataset.slot);
    };
  });

  const inp = byId('eqIn');
  if(inp && !EQ.revealed){
    inp.oninput = ev => { EQ.typed = ev.target.value; };
    inp.onkeydown = ev => { if(ev.key === 'Enter'){ ev.preventDefault(); eqCheck(); } };
    if(typeof inp.focus === 'function') inp.focus();
  }
  if(byId('eqCheck')) byId('eqCheck').onclick = eqCheck;
  if(byId('eqClear')) byId('eqClear').onclick = () => {
    EQ.slots = e.tokens.map(t => EQ.layout && EQ_OP(t) ? t : null); EQ.trayOf = {}; EQ.sel = null; renderEq();
  };
  if(byId('eqShow')) byId('eqShow').onclick = () => {
    EQ.revealed = true; EQ.ok = false; EQ.shown = true;
    eqRecord(e.id, EQ.step, false);
    renderEq();
  };
  if(byId('eqRight')) byId('eqRight').onclick = eqMarkRight;
  if(byId('eqNext')) byId('eqNext').onclick = () => {
    /* In the alternating mode the same equation is typed straight after it has
       been built, so the piece order is still in mind when the typing is asked
       for. Only then does the queue move on. */
    if(EQ.mode === 'mix' && EQ.step === 'build'){ EQ.step = 'type'; eqLoad(); return; }
    if(EQ.mode === 'mix') EQ.step = 'build';
    EQ.i++; eqLoad();
  };
}

function eqPlace(tileIndex, slot){
  const tile = EQ.tray.find(t => t.i === tileIndex);
  if(!tile) return;
  if(!EQ.trayOf) EQ.trayOf = {};
  if(Object.values(EQ.trayOf).includes(tileIndex)) return;   // already placed
  let i = slot != null ? slot : (EQ.sel != null ? EQ.sel : EQ.slots.indexOf(null));
  if(i == null || i < 0 || i >= EQ.slots.length) return;
  if(EQ.slots[i] !== null) delete EQ.trayOf[i];              // replacing what was there
  EQ.slots[i] = tile.t;
  EQ.trayOf[i] = tileIndex;
  EQ.sel = null;
  renderEq();
}

function eqCheck(){
  const e = EQ_BY_ID[EQ.queue[EQ.i]];
  if(!e) return;
  if(EQ.step === 'build'){
    if(EQ.slots.some(s => s === null)) return;
    EQ.ok = eqCorrect(e, eqPlain(e.lhs) + '=' + eqPlain(EQ.slots.join(' ')));
  }else{
    if(!EQ.typed.trim()) return;
    EQ.ok = eqCorrect(e, EQ.typed) || eqCorrect(e, eqPlain(e.lhs) + '=' + EQ.typed);
  }
  EQ.revealed = true;
  EQ.asked++; if(EQ.ok) EQ.right++;
  EQ.prevStreak = eqStat(e.id).streak;   // kept so "No, I was right" can restore it
  eqRecord(e.id, EQ.step, EQ.ok);
  renderEq();
}
/* A typed equation graded wrong that the student says was a typing slip:
   the record flips to right and the streak carries on as if it had been. */
function eqMarkRight(){
  const e = EQ_BY_ID[EQ.queue[EQ.i]];
  if(!e || !EQ.revealed || EQ.ok || EQ.shown) return;
  const s = (DB.eq || {})[e.id];
  if(s){ s.wrong = Math.max(0, s.wrong - 1); s.right++; s.streak = (EQ.prevStreak || 0) + 1; s.mode[EQ.step] = (s.mode[EQ.step] || 0) + 1; save(); }
  EQ.ok = true; EQ.right++; EQ.overrode = true;
  renderEq();
}


/* The steps from a printed line to an unprinted one, numbered, and the
   condition for reaching for it. `derive` is a list of steps (a single
   string is still accepted). */
const deriveSteps = e => Array.isArray(e.derive) ? e.derive : [e.derive];
function deriveBodyHTML(e){
  return `<ol class="dsteps">${deriveSteps(e).map(s => `<li>${richHTML(s)}</li>`).join('')}</ol>${
    e.use ? `<p class="duse"><b>When to use it:</b> ${richHTML(e.use)}</p>` : ''}`;
}
/* In a worked problem each unprinted line says why it is in this box: the

/* Under each equation of the list: what each symbol is, when it holds, how to
   reach it from a printed line, and where it comes from. */
function eqSheetHTML(e){
  const sym = (e.symbols || []).length ? `<h5 class="tsec">What each symbol is</h5><ul class="tlist">${
    e.symbols.map(s => `<li><b>${s[0]}</b> — ${s[1]}</li>`).join('')}</ul>` : '';
  return `<details class="eqmore" data-eqmore="${esc(e.id)}"><summary>Symbols, when it holds</summary>${sym}${
    e.holds ? `<h5 class="tsec">When it holds</h5><p class="prose">${richHTML(e.holds)}</p>` : ''}${
    e.derive ? `<h5 class="tsec">Not on the sheet: how to get there</h5>${deriveBodyHTML(e)}` : ''}${
    e.cite ? `<div class="cite">${esc(e.cite)}</div>` : ''}</details>`;
}

X.tab({id: 'eq', label: OPT.label, before: OPT.before, render: () => renderEq()});
X.api({normEq, eqPlain, eqAccepts, eqCorrect, eqEquiv, eqTokens, eqLayout, eqTrayPieces, eqTileText, eqNorm, eqStat, eqLearned,
       eqChosen, eqSetChosen, eqPlace, eqStart, renderEq, EQ_OP, EQ_BY_ID, EQ_STREAK, EQ_MUST, eqSheetHTML,
       state: () => EQ, stop: () => { EQ = null; }});
