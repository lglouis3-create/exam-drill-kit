#!/usr/bin/env python3
"""Mutation checks for glossary-tap (agent-run, 2026-11-02).

    python3 -I mutations.py <courseSrc> <logDir> [M13,M25,...]

<courseSrc> is a scratch course with formulas-in-text and glossary-tap on
(src/features/glossary-tap holds the module under test). Each mutation is an
exact string replace that must match once; the course is rebuilt, the module
test is run, the exit code and the FAIL lines are recorded, and the original
file is put back. Nothing here is committed to the port branch.
"""
import os, subprocess, sys, shutil

SRC, LOGS = sys.argv[1], sys.argv[2]
ONLY = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None   # optional: run only these ids
MOD = os.path.join(SRC, 'features', 'glossary-tap')
JS, STEP = 'glossary-tap.js', 'step.js'
ENV = dict(os.environ, NODE_PATH='/opt/node22/lib/node_modules')

M = [
  ('M1', 'formulas-in-text pass not run first (order fix removed)', JS,
   [("if(fx && typeof fx.setPane === 'function') FX.run(", "if(false) FX.run(")]),
  ('M2', 'a term inside a quotation is marked (quote rule removed)', JS,
   [("if(qt && text.slice(qt[0], qt[1])", "if(false && text.slice(qt[0], qt[1])")]),
  ('M3', 'a quotation of a term\'s name alone is not marked', JS,
   [("text.slice(qt[0], qt[1]).trim().toLowerCase() !== m[2].toLowerCase()", "true")]),
  ('M4', 'links are marked (A removed from the skipped tags)', JS,
   [("const NO_TAP = 'A,BUTTON,", "const NO_TAP = 'BUTTON,")]),
  ('M5', '<q> quotations are marked (Q removed from the skipped tags)', JS,
   [(",NAV,BLOCKQUOTE,Q';", ",NAV,BLOCKQUOTE';")]),
  ('M6', 'every mention marked, not the first only', JS,
   [("if(!t || seen.has(t.id)) continue;", "if(!t) continue;")]),
  ('M7', 'the core\'s bracketed gloss not respected', JS,
   [("if(/^\\s*$/.test(text.slice(end)) && nx", "if(false && nx"),
    ("card.querySelectorAll('.gloss').forEach(", "[].forEach(")]),
  ('M8', 'the stem is marked too', JS,
   [("card.querySelectorAll('.wtxt, .teach')", "card.querySelectorAll('.wtxt, .teach, .stem')")]),
  ('M9', 'an option\'s own text is marked', JS,
   [("if(tag === 'B' && n.parentElement && n.parentElement.classList.contains('wtxt')) continue;", "")]),
  ('M10', 'a word list (dt) does not count as a definition', JS,
   [("if(tag === 'DT'){ find(n.textContent).forEach(([id]) => seen.add(id)); continue; }", "if(tag === 'DT'){ continue; }")]),
  ('M11', 'a new section (h3) does not start over', JS,
   [("if(resetAt && tag === resetAt) seen.clear();", "if(false) seen.clear();")]),
  ('M12', 'the exam review is not marked', JS,
   [("if(view === 'quiz' || view === 'exam'){\n    /* formulas", "if(view === 'quiz'){\n    /* formulas")]),
  ('M13', 'the source line is marked', JS,
   [("el.classList.contains('verdict') || el.classList.contains('cite') ||", "el.classList.contains('verdict') ||")]),
  ('M14', 'a second tap does not close', JS,
   [("const open = b.getAttribute('aria-expanded') === 'true';", "const open = false;")]),
  ('M15', '"Open in the Glossary" goes to the wrong tab', JS,
   [("jump('glossary', 'gt-' + o.dataset.gtopen)", "jump('topics', 'gt-' + o.dataset.gtopen)")]),
  ('M16', 'the module saves the last tapped term', JS,
   [("b._gtbox = d; b.setAttribute('aria-expanded', 'true');", "b._gtbox = d; b.setAttribute('aria-expanded', 'true'); localStorage.setItem('gtap-last', b.dataset.term);")]),
  ('M17', 'option tap ignored', JS,
   [("function tapPane(pane, view){\n  if(!OPT.tap || !NAME_RE) return;", "function tapPane(pane, view){\n  if(!NAME_RE) return;")]),
  ('M18', 'option notTapped ignored', JS,
   [("const SKIPPED = new Set(OPT.notTapped || []);", "const SKIPPED = new Set([]);")]),
  ('M19', 'search: names that match not listed first', JS,
   [("const named = shown.filter(t => t.term.toLowerCase().includes(q))", "const named = []")]),
  ('M20', 'search reads the name only', JS,
   [("[t.term, t.gist, t.def, t.scene].join(' ')", "[t.term].join(' ')")]),
  ('M21', 'a letter does not switch to A-Z', JS,
   [("if(G.order !== 'az'){ G.order = 'az'; orderOn('az'); }", "")]),
  ('M22', 'letters with no term not disabled', JS,
   [("${have.has(L) ? '' : ' disabled'}", "${''}")]),
  ('M23', 'a group chip does not narrow', JS,
   [("G.group = c.dataset.gtgroup; renderGlossary(pane);", "G.group = 'all'; renderGlossary(pane);")]),
  ('M24', 'no floating button', JS,
   [("document.body.appendChild(b); }", "}")]),
  ('M25', 'shortest name first in the finder', JS,
   [(".sort((a, b) => b.length - a.length)", ".sort((a, b) => a.length - b.length)")]),
  ('M26', 'no plural s/es', JS,
   [("+ ')(?:e?s)?)(?![A-Za-z0-9])'", "+ '))(?![A-Za-z0-9])'")]),
  ('M27', 'build step accepts two terms found by one name', STEP,
   [("if(names[n]) errs.push(", "if(false) errs.push(")]),
  ('M28', 'build step accepts a fig not in DIA', STEP,
   [("if(t.fig !== undefined && !dia[t.fig])", "if(false)")]),
]

def run(cmd, log):
    with open(log, 'w') as f:
        r = subprocess.run(cmd, cwd=SRC, stdout=f, stderr=subprocess.STDOUT, env=ENV, timeout=900)
    return r.returncode

orig = {f: open(os.path.join(MOD, f), encoding='utf8').read() for f in (JS, STEP)}
rows = []
try:
    code = run(['python3', 'build.py'], os.path.join(LOGS, 'mutation_M0_build.log'))
    code = run(['node', 'features/glossary-tap/test.js'], os.path.join(LOGS, 'mutation_M0.log'))
    rows.append(('M0', 'no mutation (control)', code, open(os.path.join(LOGS, 'mutation_M0.log')).read().strip().split('\n')[-1]))
    for mid, what, f, reps in M:
        if ONLY and mid not in ONLY: continue
        text = orig[f]
        for a, b in reps:
            n = text.count(a)
            if n != 1:
                raise SystemExit(f'{mid}: the text to replace occurs {n} times in {f}: {a!r}')
            text = text.replace(a, b)
        open(os.path.join(MOD, f), 'w', encoding='utf8').write(text)
        log = os.path.join(LOGS, f'mutation_{mid}.log')
        bcode = run(['python3', 'build.py'], os.path.join(LOGS, f'mutation_{mid}_build.log'))
        code = run(['node', 'features/glossary-tap/test.js'], log)
        out = open(log, encoding='utf8').read().split('\n')
        fails = [l.strip()[6:].split('  — ')[0] for l in out if l.startswith('  FAIL')]
        summary = '; '.join(fails[:3]) + (f' (+{len(fails) - 3} more)' if len(fails) > 3 else '') if fails else (out[-2] if len(out) > 1 else '')
        if bcode != 0: summary = f'build exit {bcode}; ' + summary
        rows.append((mid, what, code, summary))
        print(mid, code, summary[:200], flush=True)
        open(os.path.join(MOD, f), 'w', encoding='utf8').write(orig[f])
finally:
    for f, t in orig.items(): open(os.path.join(MOD, f), 'w', encoding='utf8').write(t)
    run(['python3', 'build.py'], os.path.join(LOGS, 'mutation_restore_build.log'))
with open(os.path.join(LOGS, 'mutations_table.md'), 'w', encoding='utf8') as t:
    t.write('| Mutation | What it breaks | Test exit | Checks that FAILed |\n|---|---|---|---|\n')
    for r in rows: t.write('| %s | %s | %s | %s |\n' % (r[0], r[1], r[2], r[3].replace('|', '\\|')))
print('caught:', sum(1 for r in rows[1:] if r[2] != 0), 'of', len(rows) - 1)
