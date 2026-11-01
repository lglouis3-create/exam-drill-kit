/* ==========================================================================
   FORMULAS IN TEXT (feature module formulas-in-text v1)
   ==========================================================================
   Ported from Basic-Pharmacokinetics (src/views.js lines 1-93 and 3496-3505
   at ac2eb73). The bank types its formulas in plain text: C0e^(-kt),
   t1/2 = 0.693/k, Cl = k x VD. Shown as typed they read as code. This sets
   them the way the slides print them at the moment they are shown, so no
   stored text changes: subscripts on the course's own symbols (option
   `symbols`, longest first), a superscript for whatever follows a caret, t½
   for t1/2, a times sign for a spaced x between factors, and a minus sign for
   a spaced hyphen. A ratio is written {{frac:numerator|denominator}} and
   stacks; neither part may contain a | or a closing brace pair.

   Where it applies: after the engine draws a view, to the question's stem,
   options, explanations, concept block, note, worked steps and matching cells
   (TARGETS below), and to the reading tabs' HTML before it is drawn
   (fractions only there, as in the course it came from, because that HTML is
   written with its own <sub> and <sup>). Text with none of these marks is
   left exactly as it was. An element holding a control (a select, a button,
   an input) is left alone so its handlers stay; a matching dropdown's option
   text, which cannot hold markup, shows a ratio as (a)/(b).

   It runs on text the engine has already escaped and changes only the text
   between tags, so the only markup it can add is the <sub>, <sup> and the
   fraction spans it writes itself. Other modules use it through
   FX.api('formulas-in-text'): {prettyMath, mathHTML, rich, richHTML, plain}.
   ========================================================================== */
const SUBSYM = (OPT.symbols || []).filter(s => Array.isArray(s) && s.length === 2 && s[0]);
const SUB_MAP = Object.fromEntries(SUBSYM);
/* A symbol stands alone: no letter before it (a digit is allowed, as in 2k0),
   and no letter or digit after it, except the e of a following exponential
   (C0e^-kt) or, for a rate constant (option `rates`), the t it multiplies (k0t). */
const RATE = new Set(OPT.rates || []);
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SUB_RE = SUBSYM.length ? new RegExp('(^|[^A-Za-z])(' + SUBSYM.map(s => reEsc(s[0])).join('|')
  + ')(?=(e<sup>|t(?![A-Za-z0-9])|[^A-Za-z0-9]|$))', 'g') : null;

/* the balanced group after a caret: ^(...) with nesting, or ^ and a signed run */
function sups(s){
  let out = '', i = 0;
  while(i < s.length){
    const j = s.indexOf('^', i);
    if(j < 0){ out += s.slice(i); break; }
    out += s.slice(i, j);
    if(s[j+1] === '('){
      let d = 0, k = j + 1;
      for(; k < s.length; k++){ if(s[k] === '(') d++; else if(s[k] === ')'){ d--; if(d === 0) break; } }
      if(k >= s.length){ out += s.slice(j); break; }
      out += '<sup>' + s.slice(j + 2, k) + '</sup>'; i = k + 1;
    }else{
      const m = s.slice(j + 1).match(/^[-−+]?[A-Za-z0-9.]+/);
      if(!m){ out += '^'; i = j + 1; continue; }
      out += '<sup>' + m[0] + '</sup>'; i = j + 1 + m[0].length;
    }
  }
  return out;
}

function prettyMath(s){
  let t = String(s);
  if(OPT.halfLife) t = t.replace(/\bt1\/2(a|beta|β)?(?![A-Za-z0-9])/g,
                (m, q) => 't½' + (q ? '<sub>' + (q === 'beta' ? 'β' : q) + '</sub>' : ''));
  if(OPT.times) t = t.replace(/(\d|\)|[A-Za-z]|,) x (?=[\dA-Za-z(\[])/g, '$1 × ');    // times, between factors only
  if(OPT.minus){
    t = t.replace(/ - (?=[\dA-Za-z(\[])/g, ' − ');                                    // a spaced hyphen is a minus
    t = t.replace(/\(-/g, '(−').replace(/\^-/g, '^−');
  }
  if(OPT.powers) t = sups(t);
  if(SUB_RE) t = t.replace(SUB_RE, (m, pre, sym, after) => {
    if(/^t/.test(after || '') && !RATE.has(sym)) return m;                           // only a rate constant multiplies t
    return pre + SUB_MAP[sym];
  });
  return t;
}
/* Stacked fractions, in the same token style as {{fig:...}}. */
const FRAC_RE = /\{\{frac:([^|}]*)\|([^}]*)\}\}/g;
const mathHTML = h => String(h).replace(FRAC_RE,
  '<span class="frac"><span class="fn">$1</span><span class="fd">$2</span></span>');
const rich = s => mathHTML(prettyMath(esc(s)));
/* HTML in: the formatter runs on the text between tags only, then the
   fractions, whose two parts may hold tags of their own */
const richHTML = h => mathHTML(String(h).split(/(<[^>]*>)/).map((part, i) => i % 2 ? part : prettyMath(part)).join(''));
const plain = s => String(s == null ? '' : s).replace(FRAC_RE, '($1)/($2)');

const TARGETS = ['.stem', '.opt > span:last-child', '.wtxt', '.teach .prose', '.qbody > p.prose', '.why p.prose',
                 '.steps code', '.stepwhy', '.matchtab td', '.cset', '.fxmath'].join(', ');
const MARK = /\{\{frac:|\^|t1\/2| x | - |\(-/;
function setPane(pane){
  pane.querySelectorAll(TARGETS).forEach(el => {
    if(el.hasAttribute('data-fxmath') || el.querySelector('select, button, input, textarea')) return;
    el.setAttribute('data-fxmath', '');
    const h = el.innerHTML;
    if(!SUB_RE && !MARK.test(h)) return;
    const out = richHTML(h);
    if(out !== h) el.innerHTML = out;
  });
  pane.querySelectorAll('select option').forEach(o => { if(o.textContent.indexOf('{{frac:') >= 0) o.textContent = plain(o.textContent); });
}

X.rendered(pane => setPane(pane));
X.reading(html => mathHTML(html));
X.api({prettyMath, mathHTML, rich, richHTML, plain, FRAC_RE, setPane});
