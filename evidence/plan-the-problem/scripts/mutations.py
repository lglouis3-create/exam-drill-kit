#!/usr/bin/env python3
"""Mutation checks for plan-the-problem (QUALITY B). Each mutation breaks one behaviour of
the module in a scratch copy of the module's own course (never the port branch): an exact
string replace that must match once, then build.py and the module test. Writes
evidence/mutations/<id>.log and evidence/mutations.tsv (id, behaviour, file, exit, checks that FAILed).
  python3 -I mutations.py <course dir built by oncourse_course.sh> [id ...]"""
import os, shutil, subprocess, sys
COURSE = sys.argv[1]; ONLY = set(sys.argv[2:])
EV = '/tmp/port-plan-the-problem/evidence'; os.makedirs(EV + '/mutations', exist_ok=True)
JS, STEP, META = 'plan-the-problem.js', 'step.js', 'module.json'
M = [
 ('M1', 'the right line is among the four', JS, 'return shuffle([e, ...out]);', 'return shuffle([...out, out[0]]);'),
 ('M2', 'no wrong choice is a line used on the way or the same relation', JS,
  'used = new Set([q.setup.eq, ...suSame(q.setup.eq), ...(q.setup.pre || [])]);', 'used = new Set([q.setup.eq]);'),
 ('M3', 'wrong choices from the stem\'s own module first', JS, 'pick(EQUATIONS.filter(x => x.module === e.module), 3, out);', ''),
 ('M4', 'the sentence split keeps a quoted ".." inside its sentence', JS, "if(s[m.index] === '.' && s[m.index - 1] === '.') continue;", ''),
 ('M5', 'the tally is saved with the progress', JS, 'r.seen++; ok ? r.right++ : r.wrong++; save();', 'r.seen++; ok ? r.right++ : r.wrong++;'),
 ('M6', 'a wrong pick is counted wrong', JS, 'r.seen++; ok ? r.right++ : r.wrong++; save();', 'r.seen++; r.right++; save();'),
 ('M7', 'PLAN.also: a route named in the stem is also accepted', JS, 'for(const [from, pat, add] of (P.also || []))', 'for(const [from, pat, add] of [])'),
 ('M8', 'a plan counts as right only with every step right', JS, 'if(st.modelOk && st.ok && st.givOk', 'if(st.ok && st.givOk'),
 ('M9', 'the sheet answer is judged against the line\'s sheet mark', JS,
  "st.sheetOk = (st.sheet === 'yes') === (EQ_BY_ID[q.setup.eq].sheet === 'yes');", "st.sheetOk = (st.sheet === 'yes') !== (EQ_BY_ID[q.setup.eq].sheet === 'yes');"),
 ('M10', 'a given whose role starts "not needed" is set aside', JS, "/^not needed/i.test(g[2] || '')", "/^never/i.test(g[2] || '')"),
 ('M11', 'an "Any route" model reads "the block", others "the block of the sheet"', JS,
  "the ${PLAN_NAME[main].toLowerCase().startsWith('any') ? 'block' : 'block of the sheet'} to read from", 'the block of the sheet to read from'),
 ('M12', 'a line the professor said to know says so', JS, "e.sheet === 'no' ? ', and said to know it'", "e.sheet === 'no' ? ''"),
 ('M13', '"What is asked?" offers the module\'s other asked symbols first', JS, '[q.asks, ...near, ...rest].slice(0, 6)', '[q.asks, ...rest, ...near].slice(0, 6)'),
 ('M14', 'no unit is offered twice', JS, 'if(u && !seen.has(normUnit(u)))', 'if(u)'),
 ('M15', 'a saved tally of another shape starts afresh', JS, 'if(!plainObj(DB.setup)) DB.setup = {};', 'if(!DB.setup) DB.setup = {};'),
 ('M16', 'the build refusal names the question and the equation', STEP,
  '`${q.id}: setup names the equation "${s.eq}", which is not in EQUATIONS`', '`setup names the equation "${s.eq}", which is not in EQUATIONS`'),
 ('M17', 'the build refuses a line used on the way that is not in EQUATIONS', STEP, 'for(const p of (s.pre || [])) if(!E.has(p))', 'for(const p of []) if(!E.has(p))'),
 ('M18', 'module.json needs names formulas-in-text and equation-drill', META, '"needs": ["formulas-in-text", "equation-drill"]', '"needs": ["equation-drill"]'),
 ('M19', 'the card on the Equations tab', JS, 'at ? at.after(card) : pane.appendChild(card);', ''),
 ('M20', 'the drill is redrawn when the tab is opened again', JS, "if(SU){ if(!pane.querySelector('[data-suroot]')) suRender(); return; }", 'if(SU){ return; }'),
 ('M21', 'the build refuses a given that is not [symbol, value, role]', STEP, 'g.length !== 3 ||', 'false &&'),
 ('M22', 'without ASKS the plan has no "What is asked?" step', JS, 'const planHasAsk = q => !!(ASK && q.asks && ASK[q.asks] && q.units);', 'const planHasAsk = q => !!(q.asks && q.units);'),
 ('M23', 'an ASKS with no keys is no ASKS (the card does not promise "what is asked")', JS,
  "const ASK = typeof ASKS === 'undefined' || !ASKS || !Object.keys(ASKS).length ? null : ASKS;", "const ASK = typeof ASKS === 'undefined' || !ASKS ? null : ASKS;"),
]
env = dict(os.environ, NODE_PATH='/opt/node22/lib/node_modules')
rows = []
for mid, what, f, old, new in M:
    if ONLY and mid not in ONLY: continue
    work = '/tmp/port-plan-the-problem/mut/' + mid
    shutil.rmtree(work, ignore_errors=True); shutil.copytree(COURSE, work, symlinks=True)
    path = os.path.join(work, 'src', 'features', 'plan-the-problem', f)
    text = open(path, encoding='utf8').read()
    n = text.count(old)
    if n != 1:
        rows.append((mid, what, f, 'n/a', f'replace matched {n} times: mutation not applied')); print(mid, 'NOT APPLIED', n); continue
    open(path, 'w', encoding='utf8').write(text.replace(old, new))
    b = subprocess.run(['python3', 'build.py'], cwd=work + '/src', capture_output=True, text=True, env=env)
    if b.returncode != 0:
        out = 'build exit %d: %s' % (b.returncode, (b.stdout + b.stderr).strip().split('\n')[-1][:300]); code = b.returncode; log = b.stdout + b.stderr
        fails = [out]
    else:
        t = subprocess.run(['node', 'features/plan-the-problem/test.js'], cwd=work + '/src', capture_output=True, text=True, env=env, timeout=900)
        code = t.returncode; log = t.stdout + t.stderr
        fails = [l.strip() for l in log.split('\n') if l.strip().startswith('FAIL')]
    open(f'{EV}/mutations/{mid}.log', 'w').write(log)
    rows.append((mid, what, f, str(code), ' | '.join(fails)[:900] or 'none (NOT CAUGHT)'))
    print(mid, 'exit', code, '|', (' | '.join(fails))[:300]); sys.stdout.flush()
    shutil.rmtree(work, ignore_errors=True)
mode = 'a' if ONLY and os.path.exists(EV + '/mutations.tsv') else 'w'
with open(EV + '/mutations.tsv', mode) as fh:
    if mode == 'w': fh.write('id\tbehaviour\tfile\texit\tchecks that failed\n')
    for r in rows: fh.write('\t'.join(r) + '\n')
