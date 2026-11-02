#!/usr/bin/env python3
"""Assemble features/equation-drill/current/equation-drill.js from Basic-Pharmacokinetics
src/views.js at ac2eb73, lines 3843-4098, 4100-4129, 4131-4310, 4353-4585 and 4733-4741,
with the changes a kit module needs (each replace below must match exactly once, so a
different views.js stops the script instead of writing a wrong module).

    python3 features/equation-drill/port_from_pk.py <Basic-Pharmacokinetics checkout>/src/views.js
"""
import os, sys
PK = sys.argv[1] if len(sys.argv) > 1 else '../basic-pharmacokinetics-/src/views.js'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'current', 'equation-drill.js')
L = open(PK, encoding='utf-8').read().split('\n')
chunk = lambda a, b: '\n'.join(L[a - 1:b])
body = '\n'.join([chunk(3843, 4098), '', chunk(4100, 4129), '', chunk(4131, 4310), '', chunk(4353, 4585), '', chunk(4733, 4741)])

def rep(old, new, count=1):
    global body
    n = body.count(old)
    if n != count:
        sys.exit(f'expected {count} of {old[:70]!r}, found {n}')
    body = body.replace(old, new)

# renderEq: no set-up drill (plan-the-problem is not ported)
rep("  if(SU){ el.innerHTML = suHTML(); suWire(el); return; }\n", '')
rep("  no:      ['not on the sheet', 'She said out loud she does not supply this one'],",
    "  no:      ['not on the sheet', 'The professor said this one is not on the sheet'],")
rep("  absent:  ['not on the sheet', 'No line of the equation sheet prints it; she never said either way'],",
    "  absent:  ['not on the sheet', 'No line of the equation sheet prints it; the professor did not say either way'],")
rep('title="Not printed on her sheet, but reached from a printed line in a step or two"',
    'title="Not printed on the sheet, but reached from a printed line in a step or two"')
# the picker: literal headings, no set-up drill or variables quiz (Tier 2), no exam chip
rep("<p class=\"sub\">Every equation she expects, grouped by module, as a writing drill.</p>",
    "<p class=\"sub\">Every equation in the course's list, grouped by module: what each symbol is, when it holds and how to reach it, and a writing drill.</p>")
rep("  <li><b>Set-up only</b> shows one of her calculation stems and asks only which line solves it, then says why; the map of her sheet, line by line and coloured by module, is the first section under Reference.</li>\n", '')
rep("  <li><b>Each equation is marked</b> on the sheet, not on the sheet, or one she said to memorise; start with those.</li>",
    "  <li><b>Each equation is marked</b> on the sheet, not on the sheet, or one the professor said to memorise; start with those.</li>\n  <li><b>Symbols, when it holds</b> under each equation opens what each symbol is, the condition it holds under and, for a line the sheet does not print, how to reach it from one it does.</li>")
rep("  <li>Nothing here is scored against the question bank or Weak spots; <b>Reference</b> holds the same equations with their symbols and conditions.</li>",
    "  <li>Nothing here is scored against the question bank or Weak spots.</li>")
a = body.index("    ${VAR_QS.length ?")
b = body.index("  </div></div>`;\n  h += suCardHTML();")
body = body[:a] + body[b:]
rep("  </div></div>`;\n  h += suCardHTML();\n", "  </div></div>`;\n")
rep("  const derived = EQUATIONS.filter(e => e.sheet !== 'yes' && !e.must), ex2 = EQUATIONS.filter(e => examOf(e.module) === EXAM.id);",
    "  const derived = EQUATIONS.filter(e => e.sheet !== 'yes' && !e.must);")
rep("    <button class=\"chip\" data-pick=\"must\">The ${EQ_MUST.length} she said to memorise</button>",
    "    <button class=\"chip\" data-pick=\"must\">The ${EQ_MUST.length} said to memorise</button>")
rep("    <button class=\"chip\" data-pick=\"exam\">${esc(EXAM.name)}: ${ex2.length} lines</button>\n", '')
rep("              : p === 'exam' ? EQUATIONS.filter(e => examOf(e.module) === EXAM.id).map(e => e.id)\n", '')
rep("  const modName = m => (COURSE.topicsMenu.find(t => t.module === m) || {}).name || ('Module ' + m);",
    "  const modName = groupName;")
rep("${e.must ? '<b class=\"must\">she said to memorise this one</b> · ' : ''}",
    "${e.must ? '<b class=\"must\">said to memorise</b> · ' : ''}")
# under each row: the symbols, when it holds, how to reach it, the source
rep("""        ${done ? '<span class="eqdone">learned</span>'
               : st.streak ? `<span class="counts">${st.streak}/${EQ_STREAK}</span>` : ''}
      </div>`;""", """        ${done ? '<span class="eqdone">learned</span>'
               : st.streak ? `<span class="counts">${st.streak}/${EQ_STREAK}</span>` : ''}
      </div>${eqSheetHTML(e)}`;""")
rep("""  h += `<p class="sub">Every equation here, with its symbols, its units and the condition it holds
    under, is set out under Reference.</p>`;\n""", '')
rep("  el.querySelectorAll('button[data-su]').forEach(b => b.onclick = () => suStart(b.dataset.su));\n", '')
rep("  el.querySelectorAll('button[data-sufrom]').forEach(b => b.onclick = () => { LS.set(SU_FROM_KEY, b.dataset.sufrom); renderEq(); });\n", '')
# the drill: no "How she asks it" (it needs the set-up drill's data), a plain way back
rep("  EQ.revealed = false; EQ.ok = false; EQ.shown = false; EQ.overrode = false; EQ.typed = ''; EQ.howOpen = false; EQ.exIdx = 0;",
    "  EQ.revealed = false; EQ.ok = false; EQ.shown = false; EQ.overrode = false; EQ.typed = '';")
rep("  let h = `<div class=\"sessline\">${drillBackHTML(EQ.from, 'eq', '← Stop, choose equations')}</div><div class=\"qcard\"><div class=\"qhead\">",
    "  let h = `<p><button class=\"btn ghost\" id=\"eqBack\" type=\"button\">← Stop, choose equations</button></p><div class=\"qcard\"><div class=\"qhead\">")
rep("""    h += EQ.howOpen ? eqHowHTML(e)
      : `<p><button class="btn ghost" id="eqHow" type="button">How she asks it: one of her questions, worked</button></p>`;\n""", '')
rep("    if(e.must) h += `<p class=\"prose\"><b>She said to memorise this one.</b> It is not on the equation sheet.</p>`;",
    "    if(e.must) h += `<p class=\"prose\"><b>The professor said to memorise this one.</b> It is not on the equation sheet.</p>`;")
rep("  if(byId('eqHow')) byId('eqHow').onclick = () => { EQ.howOpen = true; renderEq(); };\n", '')
rep("  if(byId('eqExNext')) byId('eqExNext').onclick = () => { EQ.exIdx = (EQ.exIdx || 0) + 1; renderEq(); };\n", '')
rep("  if(byId('eqStop')) byId('eqStop').onclick = stop;", "  if(byId('eqStop')) byId('eqStop').onclick = stop;\n  if(byId('eqBack')) byId('eqBack').onclick = stop;")
rep("Her sheet prints it in the order above.", "The sheet prints it in the order above.")

HEAD = r"""/* ==========================================================================
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
"""
TAIL = r"""
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
"""
open(OUT, 'w', encoding='utf-8').write(HEAD + '\n' + body + '\n' + TAIL)
print(f'wrote {OUT} ({len((HEAD + body + TAIL).splitlines())} lines)')
